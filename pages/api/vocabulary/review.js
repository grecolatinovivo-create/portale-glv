// pages/api/vocabulary/review.js
// GET  → parole da ripassare oggi (nextReview <= now), max 20
// POST → registra il risultato di un ripasso e calcola il prossimo intervallo

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

// Intervalli in giorni per ogni livello di facilità
// Algoritmo SRS leggero: easy=×2, good=×1.5, hard=×1, again=reset a 1
const NEXT_INTERVALS = {
  easy:  (current) => Math.min(Math.round(current * 2.2), 60),
  good:  (current) => Math.max(Math.round(current * 1.5), current + 1),
  hard:  (current) => Math.max(1, Math.round(current * 0.8)),
  again: (_)       => 1,
};

const EASE_DELTA = { easy: 1, good: 0, hard: -1, again: -1 };

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  // ── GET — parole da ripassare oggi ────────────────────────────
  if (req.method === 'GET') {
    try {
      const now = new Date();
      const due = await prisma.vocabulary.findMany({
        where: {
          userId:     req.user.userId,
          nextReview: { lte: now },
        },
        orderBy: { nextReview: 'asc' },
        take: 20,
        select: {
          id: true,
          term: true,
          translation: true,
          context: true,
          lang: true,
          reviewCount: true,
          easeFactor: true,
          interval: true,
        },
      });

      return res.status(200).json({ due, count: due.length });
    } catch (err) {
      console.error('[vocabulary/review GET]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  // ── POST — registra risultato ripasso ─────────────────────────
  if (req.method === 'POST') {
    const { wordId, result } = req.body || {};

    if (!wordId) return res.status(400).json({ error: 'wordId obbligatorio' });
    if (!['easy', 'good', 'hard', 'again'].includes(result)) {
      return res.status(400).json({ error: 'result deve essere: easy | good | hard | again' });
    }

    try {
      const word = await prisma.vocabulary.findFirst({
        where: { id: wordId, userId: req.user.userId },
      });
      if (!word) return res.status(404).json({ error: 'Parola non trovata' });

      const newInterval   = NEXT_INTERVALS[result](word.interval);
      const newEaseFactor = Math.max(1, Math.min(5, word.easeFactor + EASE_DELTA[result]));
      const nextReview    = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

      const updated = await prisma.vocabulary.update({
        where: { id: wordId },
        data: {
          interval:     newInterval,
          easeFactor:   newEaseFactor,
          nextReview,
          reviewCount:  { increment: 1 },
          lastResult:   result,
          lastReviewAt: new Date(),
        },
        select: { id: true, interval: true, nextReview: true, reviewCount: true },
      });

      return res.status(200).json({ ok: true, word: updated });
    } catch (err) {
      console.error('[vocabulary/review POST]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
