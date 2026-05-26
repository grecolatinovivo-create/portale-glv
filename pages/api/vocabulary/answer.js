/**
 * POST /api/vocabulary/answer
 *
 * Salva la risposta dello studente e aggiorna il record SRS.
 *
 * Body: {
 *   term:          string   — termine latino/greco
 *   lessonId:      string   — lezione sorgente del termine
 *   correct:       boolean  — risposta corretta?
 *   exerciseLevel: number   — 1=encounter|2=recognition|3=cloze
 *   vocabularyId?: string   — ID record Vocabulary esistente (se già visto)
 *   contextSentence?: string — frase di contesto (usata se creiamo il record)
 *   lang?:         string   — lingua del corso
 * }
 *
 * ALGORITMO SRS (SM-2 semplificato):
 *  Corretto:
 *    easeFactor = min(5, easeFactor + 1)
 *    interval   = round(interval × 1.6)  [fattore leggermente < SM-2 per più rinforzo]
 *    nextReview = ora + interval giorni
 *  Sbagliato:
 *    easeFactor = max(1, easeFactor - 1)
 *    interval   = 1                      [riparte da 1 giorno]
 *    nextReview = domani
 *
 * Il termine "encounter" (level 1) non richiede risposta corretta/errata:
 *  viene sempre registrato come "visto" con interval=1 e si porta
 *  automaticamente al livello recognition alla prossima sessione.
 *
 * Auth: withAuth
 */

import { withAuth } from '../../../lib/auth.js';
import { prisma }   from '../../../lib/prisma.js';

/* ── Costanti SRS ───────────────────────────────────────────────── */
const SRS_GROWTH_FACTOR  = 1.6;
const SRS_MAX_EASE       = 5;
const SRS_MIN_EASE       = 1;
const SRS_MIN_INTERVAL   = 1;   // giorni
const SRS_INITIAL_INTERVAL = 1;

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    term,
    lessonId,
    correct,
    exerciseLevel = 1,
    vocabularyId,
    contextSentence,
    lang,
  } = req.body || {};

  if (!term?.trim() || !lessonId) {
    return res.status(400).json({ error: 'term e lessonId obbligatori' });
  }

  const userId = req.user.userId;

  try {
    /* ── Cerca il record esistente ─────────────────────────────── */
    let record = null;

    if (vocabularyId) {
      record = await prisma.vocabulary.findUnique({
        where: { id: vocabularyId }
      });
      // Verifica che appartenga all'utente
      if (record && record.userId !== userId) record = null;
    }

    if (!record) {
      // Cerca per userId + lessonId + term
      record = await prisma.vocabulary.findFirst({
        where: { userId, lessonId, term: term.trim() }
      });
    }

    /* ── Calcola nuovi valori SRS ──────────────────────────────── */
    let newEase, newInterval, newResult;
    const now = new Date();

    if (exerciseLevel === 1) {
      // Encounter: solo registra l'esposizione, non "giusto/sbagliato"
      newEase     = record ? record.easeFactor : SRS_MIN_EASE;
      newInterval = SRS_INITIAL_INTERVAL;
      newResult   = 'seen';
    } else if (correct) {
      const oldEase     = record?.easeFactor   ?? SRS_MIN_EASE;
      const oldInterval = record?.interval      ?? SRS_INITIAL_INTERVAL;
      newEase     = Math.min(SRS_MAX_EASE, oldEase + 1);
      newInterval = Math.max(SRS_MIN_INTERVAL, Math.round(oldInterval * SRS_GROWTH_FACTOR));
      newResult   = 'correct';
    } else {
      const oldEase = record?.easeFactor ?? SRS_MIN_EASE;
      newEase     = Math.max(SRS_MIN_EASE, oldEase - 1);
      newInterval = SRS_MIN_INTERVAL;
      newResult   = 'wrong';
    }

    const nextReview = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

    /* ── Upsert del record Vocabulary ─────────────────────────── */
    let updatedRecord;

    if (record) {
      updatedRecord = await prisma.vocabulary.update({
        where: { id: record.id },
        data: {
          easeFactor:   newEase,
          interval:     newInterval,
          nextReview,
          reviewCount:  { increment: 1 },
          lastResult:   newResult,
          lastReviewAt: now,
          // Aggiorna il contesto se non c'era
          context: record.context || contextSentence?.trim() || null,
          lang:    record.lang    || lang || null,
        }
      });
    } else {
      // Prima volta che lo studente incontra questo termine
      updatedRecord = await prisma.vocabulary.create({
        data: {
          userId,
          lessonId,
          term:        term.trim(),
          translation: '',        // nessuna traduzione — metodo induttivo
          context:     contextSentence?.trim() || null,
          lang:        lang || null,
          easeFactor:  newEase,
          interval:    newInterval,
          nextReview,
          reviewCount: 1,
          lastResult:  newResult,
          lastReviewAt: now,
        }
      });
    }

    return res.status(200).json({
      vocabularyId: updatedRecord.id,
      easeFactor:   updatedRecord.easeFactor,
      interval:     updatedRecord.interval,
      nextReview:   updatedRecord.nextReview,
      reviewCount:  updatedRecord.reviewCount,
      nextLevel:    computeNextLevel(updatedRecord),
    });

  } catch (e) {
    console.error('[vocabulary/answer]', e.message);
    return res.status(500).json({ error: 'Errore nel salvataggio della risposta' });
  }
}

/**
 * Calcola a quale livello sarà portato il termine alla prossima esposizione.
 * Usato dal frontend per mostrare feedback motivazionale.
 */
function computeNextLevel(record) {
  const { reviewCount, lastResult, easeFactor } = record;
  if (lastResult === 'wrong' || easeFactor <= 1)   return 1;
  if (reviewCount <= 2       || easeFactor <= 2)   return 2;
  return 3;
}

export default withAuth(handler);
