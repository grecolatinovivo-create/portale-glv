/**
 * GET /api/vocabulary/adaptive-session?lessonId=xxx
 *
 * Motore adattivo cross-capitolo per l'acquisizione lessicale.
 *
 * LOGICA:
 *  1. Carica il keyVocabulary del capitolo corrente
 *  2. Filtra funzionali (est, in, et, ...) — non utili per acquisizione lessicale
 *  3. Trova eventuali termini in scadenza SRS da capitoli precedenti
 *  4. Per ogni termine determina livello esercizio in base alla storia SRS
 *  5. Restituisce la coda: [ripasso cross-capitolo] → [nuovi termini]
 *
 * LIVELLI ESERCIZIO:
 *  1 — encounter:    prima esposizione (placeholder semantico + termine + contesto)
 *  2 — recognition:  4 opzioni — scegli il termine mancante nella frase
 *  3 — cloze:        frase con blank + word bank
 *
 * Auth: withAuth
 */

import { withAuth } from '../../../lib/auth.js';
import { prisma }   from '../../../lib/prisma.js';

const MAX_CROSS_CHAPTER_REVIEWS = 3;

/* ── Funzionali latini da escludere dal vocab adattivo ── */
const LATIN_FUNCTION_WORDS = new Set([
  'est','sunt','erat','erant','esse','fuit','fuerat','fuerunt',
  'in','ad','ex','de','cum','ab','per','pro','sub','sine','ante',
  'post','inter','contra','trans','super','apud','ob','propter',
  'et','sed','aut','nec','neque','at','vel','ac','atque',
  'non','iam','nunc','tum','tunc','etiam','autem','enim',
  'igitur','ergo','nam','ubi','ut','ne','si','nisi','quod',
  'hic','haec','hoc','is','ea','id','ille','illa','illud',
  'qui','quae','qui','ego','tu','nos','vos','se',
  'unus','duo','tres','primus','secundus',
]);

function isFunctionWord(term) {
  return LATIN_FUNCTION_WORDS.has(term.toLowerCase().replace(/[āēīōūĀĒĪŌŪ]/g, m =>
    ({ā:'a',ē:'e',ī:'i',ō:'o',ū:'u',Ā:'a',Ē:'e',Ī:'i',Ō:'o',Ū:'u'}[m])));
}

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

  /* ── 2. Filtra vocab: rimuovi funzionali e termini senza contesto ── */
  const rawVocab = Array.isArray(lesson.keyVocabulary) ? lesson.keyVocabulary : [];
  const chapterVocab = rawVocab.filter(v =>
    v.term &&
    !isFunctionWord(v.term) &&
    (
      // Formato nuovo (extract-vocab.js): contextSentences è un array
      (Array.isArray(v.contextSentences) && v.contextSentences.length > 0) ||
      // Formato vecchio (session.js auto-gen): contextSentence è una stringa singola
      (typeof v.contextSentence === 'string' && v.contextSentence.trim().length > 0)
    )
  );

  /* ── 3. Carica storia SRS ──────────────────────────────────── */
  const userId      = req.user.userId;
  const termsInChap = chapterVocab.map(v => v.term);

  let currentChapterRecords = [];
  let crossChapterReviews   = [];

  try {
    if (termsInChap.length > 0) {
      currentChapterRecords = await prisma.vocabulary.findMany({
        where: { userId, lessonId, term: { in: termsInChap } }
      });
    }
    crossChapterReviews = await prisma.vocabulary.findMany({
      where: {
        userId,
        nextReview: { lte: new Date() },
        NOT: { lessonId }
      },
      orderBy: { nextReview: 'asc' },
      take: MAX_CROSS_CHAPTER_REVIEWS,
    });
  } catch (e) {
    console.error('[adaptive-session] DB error:', e.message);
  }

  /* ── 4. Review cross-capitolo ─────────────────────────────── */
  const reviewQueue = [];
  if (crossChapterReviews.length > 0) {
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
        exerciseId:        `review-${review.id}`,
        term:              review.term,
        forms:             sourceVocab?.forms || [],
        level:             determineLevel(review),
        isReview:          true,
        sourceLesson:      review.lessonId,
        sourceLessonTitle: sourceLesson?.title || 'Lezione precedente',
        contextSentences:  (Array.isArray(sourceVocab?.contextSentences) && sourceVocab.contextSentences.length > 0)
          ? sourceVocab.contextSentences
          : (sourceVocab?.contextSentence ? [sourceVocab.contextSentence] : (review.context ? [review.context] : [])),
        imageUrl:          sourceVocab?.imageUrl || null,
        grammarNote:       sourceVocab?.grammarNote || null,
        semanticField:     sourceVocab?.semanticField || null,
        difficulty:        sourceVocab?.difficulty || 1,
        distractors:       buildDistractors(review.term, chapterVocab, currentChapterRecords),
        vocabularyId:      review.id,
        srsInterval:       review.interval,
        reviewCount:       review.reviewCount,
      });
    }
  }

  /* ── 5. Coda capitolo corrente ────────────────────────────── */
  const chapterQueue = [];
  const srsMap = Object.fromEntries(currentChapterRecords.map(r => [r.term, r]));

  for (const vocabItem of chapterVocab) {
    const srs = srsMap[vocabItem.term] || null;

    // Salta termini già masterizzati
    if (srs && srs.easeFactor >= 5 && srs.interval > 30 && srs.reviewCount > 5) continue;

    chapterQueue.push({
      exerciseId:        `ch-${lessonId}-${vocabItem.term}`,
      term:              vocabItem.term,
      forms:             Array.isArray(vocabItem.forms) ? vocabItem.forms : [],
      level:             srs ? determineLevel(srs) : 1,
      isReview:          false,
      sourceLesson:      lessonId,
      sourceLessonTitle: lesson.title,
      contextSentences:  Array.isArray(vocabItem.contextSentences) && vocabItem.contextSentences.length > 0
        ? vocabItem.contextSentences
        : (vocabItem.contextSentence ? [vocabItem.contextSentence] : []),
      imageUrl:          vocabItem.imageUrl || null,
      grammarNote:       vocabItem.grammarNote || null,
      semanticField:     vocabItem.semanticField || null,
      difficulty:        vocabItem.difficulty || 1,
      distractors:       buildDistractors(vocabItem.term, chapterVocab, currentChapterRecords),
      vocabularyId:      srs?.id || null,
      srsInterval:       srs?.interval || 1,
      reviewCount:       srs?.reviewCount || 0,
    });
  }

  // Ordina: termini mai visti prima, poi per difficoltà crescente
  chapterQueue.sort((a, b) => {
    if (a.reviewCount === 0 && b.reviewCount > 0) return -1;
    if (a.reviewCount > 0 && b.reviewCount === 0) return 1;
    return (a.difficulty || 1) - (b.difficulty || 1);
  });

  /* ── 6. Coda finale ───────────────────────────────────────── */
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

/* ── Determina livello esercizio in base alla storia SRS ── */
function determineLevel(srsRecord) {
  const { reviewCount, lastResult, easeFactor } = srsRecord;
  if (!reviewCount || reviewCount === 0)         return 1;
  if (lastResult === 'wrong' || easeFactor <= 1) return 1;
  if (reviewCount <= 2 || easeFactor <= 2)       return 2;
  return 3;
}

/* ── Costruisce 3 distrattori dal pool del capitolo ── */
function buildDistractors(targetTerm, chapterVocab, srsRecords) {
  const pool = chapterVocab
    .filter(v => v.term !== targetTerm)
    .map(v => v.term);

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const result = pool.slice(0, 3);
  while (result.length < 3) result.push('—');
  return result;
}

export default withAuth(handler);
