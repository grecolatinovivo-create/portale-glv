// pages/api/favorites/[courseId].js
// [courseId] è lo SLUG del corso (es. "lat-a11")
//
// GET    → { isFavorite: boolean }
// POST   → Aggiunge il corso ai preferiti. { ok: true, isFavorite: true }
// DELETE → Rimuove il corso dai preferiti.  { ok: true, isFavorite: false }
//
// Idempotente: POST su un preferito già esistente → 200 OK senza duplicati.
//              DELETE su un preferito non esistente → 200 OK senza errore.

const { prisma }   = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  const { courseId: slug } = req.query;   // slug (non id cuid)

  try {
    // Risolvi lo slug → id corso
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true, isAvailable: true },
    });

    if (!course || !course.isAvailable) {
      return res.status(404).json({ error: 'Corso non trovato' });
    }

    const key = { userId: req.user.userId, courseId: course.id };

    // ── GET: stato corrente ──────────────────────────────────────────
    if (req.method === 'GET') {
      const existing = await prisma.favorite.findUnique({ where: { userId_courseId: key } });
      return res.status(200).json({ isFavorite: !!existing });
    }

    // ── POST: aggiungi preferito ─────────────────────────────────────
    if (req.method === 'POST') {
      await prisma.favorite.upsert({
        where:  { userId_courseId: key },
        update: {},          // già esistente: non toccare nulla
        create: { userId: req.user.userId, courseId: course.id },
      });
      return res.status(200).json({ ok: true, isFavorite: true });
    }

    // ── DELETE: rimuovi preferito ────────────────────────────────────
    if (req.method === 'DELETE') {
      await prisma.favorite.deleteMany({ where: key });   // deleteMany è idempotente (no throw se assente)
      return res.status(200).json({ ok: true, isFavorite: false });
    }

  } catch (err) {
    console.error('[favorites/[courseId]] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
