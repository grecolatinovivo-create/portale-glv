// pages/api/vocabulary/index.js
// GET  → lista parole del vocabolario personale (con conteggio da ripassare)
// POST → aggiunge una parola al vocabolario

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  // ── GET — lista parole ─────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { lang } = req.query;
      const where = { userId: req.user.userId };
      if (lang) where.lang = lang;

      const words = await prisma.vocabulary.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          term: true,
          translation: true,
          context: true,
          lang: true,
          easeFactor: true,
          interval: true,
          nextReview: true,
          reviewCount: true,
          lastResult: true,
          createdAt: true,
        },
      });

      // Quante parole da ripassare oggi
      const now = new Date();
      const dueCount = words.filter(w => new Date(w.nextReview) <= now).length;

      return res.status(200).json({ words, dueCount, total: words.length });
    } catch (err) {
      console.error('[vocabulary/index GET]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  // ── POST — aggiungi parola ─────────────────────────────────────
  if (req.method === 'POST') {
    const { term, translation, context, lang, courseId, lessonId } = req.body || {};

    if (!term?.trim() || !translation?.trim()) {
      return res.status(400).json({ error: 'term e translation sono obbligatori' });
    }

    try {
      const word = await prisma.vocabulary.create({
        data: {
          userId:      req.user.userId,
          term:        term.trim(),
          translation: translation.trim(),
          context:     context?.trim() || null,
          lang:        lang || null,
          courseId:    courseId || null,
          lessonId:    lessonId || null,
          nextReview:  new Date(), // subito disponibile per il primo ripasso
        },
      });

      return res.status(201).json({ word });
    } catch (err) {
      console.error('[vocabulary/index POST]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
