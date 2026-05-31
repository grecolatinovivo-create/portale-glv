// pages/api/lives/index.js — Live mensili (lato utente)
// GET             → lista live future + stato prenotazione; zoomLink incluso SOLO da 1h prima (se prenotato)
// POST {sessionId}→ prenota (email di conferma)
// DELETE {sessionId}→ annulla prenotazione
//
// Accesso: solo Accademia ANNUALE / admin.

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');
const { checkFeatureAccess } = require('../../../lib/courseAccess');

const ACCESS_WINDOW_MS = 60 * 60 * 1000; // link visibile da 1h prima

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  const access = await checkFeatureAccess(req.user, { minTier: 'accademia', requireAnnual: true });
  if (!access.ok) {
    return res.status(403).json({
      error: 'Le live mensili sono riservate al piano annuale Accademia.',
      reason: access.reason,
    });
  }

  if (req.method === 'GET') {
    try {
      const now = new Date();
      // Mostra le live future e quelle in corso (fino a fine durata)
      const lives = await prisma.liveSession.findMany({
        where: { isPublished: true, startAt: { gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) } },
        orderBy: { startAt: 'asc' },
        include: { bookings: { where: { userId: req.user.userId }, select: { id: true } } },
      });
      const result = lives.map(l => {
        const start = new Date(l.startAt);
        const booked = l.bookings.length > 0;
        // Il link si attiva da 1h prima dell'inizio fino a fine live
        const endAt = new Date(start.getTime() + (l.durationMin || 60) * 60 * 1000);
        const accessOpen = now >= new Date(start.getTime() - ACCESS_WINDOW_MS) && now <= endAt;
        return {
          id: l.id, title: l.title, description: l.description,
          startAt: l.startAt, durationMin: l.durationMin,
          booked,
          // zoomLink solo se prenotato E finestra aperta (admin lo vede sempre)
          zoomLink: (access.reason === 'admin' || (booked && accessOpen)) ? l.zoomLink : null,
          accessOpen,
        };
      });
      return res.status(200).json({ lives: result });
    } catch (err) {
      console.error('[lives GET]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  if (req.method === 'POST') {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId obbligatorio' });
    try {
      const live = await prisma.liveSession.findUnique({ where: { id: sessionId } });
      if (!live) return res.status(404).json({ error: 'Live non trovata' });
      const booking = await prisma.liveBooking.upsert({
        where: { sessionId_userId: { sessionId, userId: req.user.userId } },
        create: { sessionId, userId: req.user.userId },
        update: {},
      });
      try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { fullName: true, email: true } });
        const { sendLiveBookingEmail } = require('../../../lib/resend');
        if (user) await sendLiveBookingEmail(user, live);
      } catch (e) { console.error('[lives] email conferma:', e.message); }
      return res.status(200).json({ ok: true, booking });
    } catch (err) {
      console.error('[lives POST]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  if (req.method === 'DELETE') {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId obbligatorio' });
    try {
      await prisma.liveBooking.deleteMany({ where: { sessionId, userId: req.user.userId } });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[lives DELETE]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
