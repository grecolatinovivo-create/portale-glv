/**
 * GET /api/vocabulary/adaptive-session?lessonId=xxx
 *
 * Motore adattivo cross-capitolo per l'acquisizione lessicale.
 *
 * LOGICA:
 *  1. Carica il keyVocabulary del capitolo corrente
 *  2. Trova eventuali termini in scadenza SRS da capitoli precedenti
 *     (lo studente ha sbagliato "pater" nel Cap. I → riappare nel Cap. II)
 *  3. Per ogni termine, determina il livello di esercizio in base alla storia
 *     dello studente (reviewCount, lastResult, easeFactor)
 *  4. Restituisce la coda ordinata:
 *     [ripasso da altri capitoli] → [nuovi termini del capitolo corrente]
 *
 * LIVELLI ESERCIZIO:
 *  1 — encounter:    prima esposizione (immagine + termine + contesto)
 *  2 — recognition:  4 opzioni visive / scegli il termine
 *  3 — cloze:        frase con blank + word bank
 *
 * Auth: withAuth
 */

import { withAuth } from '../../../lib/auth.js';
import { prisma }   from '../../../lib/prisma.js';

/* ── Quante review da altri capitoli mostrare per sessione ── */
const MAX_CROSS_CHAPTER_REVIEWS = 3;

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lessonId } = req.query;
  if (!lessonId) return res.status(400).json({ error: 'lessonId obbligatorio' });

  /* ── 1. Carica lezione + verifica accesso ──────────────────── */
  let lesson;
  try {
    lesson = await prisma.lesson.findUnique({
      where:  { id: lessonId },
      select: {
        id: true, title: true, isFree: true,
        keyVocabulary: true, textFragment: true,
        course: { select: { id: true, title: true, lang: true } }
      }
    });
  } catch (e) {
    return res.status(500).json({ error: 'Errore database' });
  }

  if (!lesson) return res.status(404).json({ error: 'Lezione non trovata' });

  const isAdmin = req.user?.email === process.env.ADMIN_EMAIL;
  if (!isAdmin && !lesson.isFree) {
    const sub = await prisma.subscription.findFirst({
      where: { userId: req.user.userId, status: 'active' }
    });
    const purchase = sub ? null : await prisma.purchase.findFirst({
      where: { userId: req.user.userId, courseId: lesson.course.id }
    });
    if (!sub && !purchase) return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  const chapterVocab = Array.isArray(lesson.keyVocabulary) ? lesson.keyVocabulary : [];

  /* ── 2. Carica storia SRS dell'utente per questo capitolo ─── */
  const userId      = req.user.userId;
  const termsInChap = chapterVocab.map(v => v.term);

  let currentChapterRecords = [];
  let crossChapterReviews   = [];

  try {
    // Record SRS per i termini del capitolo corrente
    if (termsInChap.length > 0) {
      currentChapterRecords = await prisma.vocabulary.findMany({
        where: {
          userId,
          lessonId,
          term: { in: termsInChap }
        }
      });
    }

    // Termini da altri capitoli in scadenza SRS (nextReview <= ora)
    crossChapterReviews = await prisma.vocabulary.findMany({
      where: {
        userId,
        nextReview: { lte: new Date() },
        NOT: { lessonId }  // da altri capitoli
      },
      orderBy: { nextReview: 'asc' },
      take:    MAX_CROSS_CHAPTER_REVIEWS,
      include: {
        // Abbiamo bisogno del titolo della lezione sorgente
        // Ma Vocabulary non ha relazione a Lesson — recuperiamo dopo
      }
    });
  } catch (e) {
    console.error('[adaptive-session] DB error:', e.message);
    // Non fatale: procedi senza storia
  }

  /* ── 3. Arricchisci le review cross-chapter con dati della lezione ── */
  const reviewQueue = [];
  if (crossChapterReviews.length > 0) {
    // Carica titoli delle lezioni sorgente in batch
    const sourceLessonIds = [...new Set(crossChapterReviews.map(r => r.lessonId).filter(Boolean))];
    let sourceLessons = {};
    try {
      const lessons = await prisma.lesson.findMany({
        where:  { id: { in: sourceLessonIds } },
        select: { id: true, title: true, keyVocabulary: true }
      });
      lessons.forEach(l => { sourceLessons[l.id] = l; });
    } catch (_) {}

    for (const review of crossChapterReviews) {
      const sourceLesson = review.lessonId ? sourceLessons[review.lessonId] : null;
      const sourceVocab  = Array.isArray(sourceLesson?.keyVocabulary)
        ? sourceLesson.keyVocabulary.find(v => v.term === review.term)
        : null;

      reviewQueue.push({
        exerciseId:          `review-${review.id}`,
        term:                review.term,
        level:               determineLevel(review),
        isReview:            true,
        sourceLesson:        review.lessonId,
        sourceLessonTitle:   sourceLesson?.title || 'Lezione precedente',
        contextSentences:    sourceVocab?.contextSentences || (review.context ? [review.context] : []),
        imageUrl:            sourceVocab?.imageUrl || null,
        grammarNote:         sourceVocab?.grammarNote || review.context || null,
        distractors:         buildDistractors(review.term, chapterVocab, currentChapterRecords),
        vocabularyId:        review.id,
        srsInterval:         review.interval,
        reviewCount:         review.reviewCount,
      });
    }
  }

  /* ── 4. Costruisci la coda del capitolo corrente ─────────────── */
  const chapterQueue = [];
  const srsMap       = Object.fromEntries(currentChapterRecords.map(r => [r.term, r]));

  for (const vocabItem of chapterVocab) {
    const srs = srsMap[vocabItem.term] || null;

    // Salta termini già masterizzati (easeFactor=5 + interval>30 + reviewCount>5)
    if (srs && srs.easeFactor >= 5 && srs.interval > 30 && srs.reviewCount > 5) continue;

    chapterQueue.push({
      exerciseId:       `ch-${lessonId}-${vocabItem.term}`,
      term:             vocabItem.term,
      level:            srs ? determineLevel(srs) : 1,
      isReview:         false,
      sourceLesson:     lessonId,
      sourceLessonTitle: lesson.title,
      contextSentences: vocabItem.contextSentences
        || (vocabItem.contextSentence ? [vocabItem.contextSentence] : []),
      imageUrl:         vocabItem.imageUrl || null,
      grammarNote:      vocabItem.grammarNote || vocabItem.notes || null,
      semanticField:    vocabItem.semanticField || null,
      difficulty:       vocabItem.difficulty || 1,
      distractors:      buildDistractors(vocabItem.term, chapterVocab, currentChapterRecords),
      vocabularyId:     srs?.id || null,
      srsInterval:      srs?.interval || 1,
      reviewCount:      srs?.reviewCount || 0,
    });
  }

  // Ordina: prima i termini non ancora visti, poi quelli in base alla difficoltà
  chapterQueue.sort((a, b) => {
    if (a.reviewCount === 0 && b.reviewCount > 0) return -1;
    if (a.reviewCount > 0 && b.reviewCount === 0) return 1;
    return (a.difficulty || 1) - (b.difficulty || 1);
  });

  /* ── 5. Coda finale: review → capitolo corrente ─────────────── */
  const queue = [...reviewQueue, ...chapterQueue];

  return res.status(200).json({
    queue,
    lessonTitle:  lesson.title,
    courseTitle:  lesson.course?.title || '',
    courseLang:   lesson.course?.lang  || '',
    textFragment: lesson.textFragment  || null,
    total:        queue.length,
    reviewCount:  reviewQueue.length,
    newCount:     chapterQueue.length,
  });
}

/* ═══════════════════════════════════════════════════════════════════
   Determina il livello di esercizio in base alla storia SRS
   ═══════════════════════════════════════════════════════════════════

   Logica (bilanciata per acquisizione implicita, Krashen):
   - Mai visto                           → 1 encounter
   - Visto ma sbagliato l'ultima volta   → 1 encounter (più esposizione)
   - Visto 1-2 volte, andava bene        → 2 recognition
   - Visto 3+ volte, buon easeFactor     → 3 cloze
*/
function determineLevel(srsRecord) {
  const { reviewCount, lastResult, easeFactor } = srsRecord;

  if (!reviewCount || reviewCount === 0)              return 1; // encounter
  if (lastResult === 'wrong' || easeFactor <= 1)      return 1; // torna all'encounter
  if (reviewCount <= 2 || easeFactor <= 2)            return 2; // recognition
  return 3;                                                      // cloze
}

/* ═══════════════════════════════════════════════════════════════════
   Costruisce i distrattori per recognition e cloze
   Prende termini dal capitolo corrente, diversi dal termine target
   ═══════════════════════════════════════════════════════════════════ */
function buildDistractors(targetTerm, chapterVocab, srsRecords) {
  const pool = chapterVocab
    .filter(v => v.term !== targetTerm)
    .map(v => v.term);

  // Shuffla e prendi 3
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const result = pool.slice(0, 3);

  // Fallback se il capitolo ha pochi termini
  while (result.length < 3) result.push('—');

  return result;
}

export default withAuth(handler);
