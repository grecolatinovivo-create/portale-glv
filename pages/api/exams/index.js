// pages/api/exams/index.js — Esami di certificazione (lato utente)
// GET            → lista sessioni future + stato prenotazione dell'utente
// POST {sessionId}→ prenota
// DELETE {sessionId}→ annulla prenotazione
//
// Accesso: solo Linguae ANNUALE (o superiore annuale) / admin.

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');
const { checkFeatureAccess } = require('../../../lib/courseAccess');

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  // Gate: Linguae annuale o superiore (annuale). Admin passa sempre.
  const access = await checkFeatureAccess(req.user, { minTier: 'linguae', requireAnnual: true });
  if (!access.ok) {
    return res.status(403).json({
      error: 'Gli esami di certificazione sono riservati ai piani annuali Linguae e Accademia.',
      reason: access.reason,
    });
  }

  // GET — sessioni future
  if (req.method === 'GET') {
    try {
      const now = new Date();
      const sessions = await prisma.examSession.findMany({
        where: { examDate: { gte: now } },
        orderBy: { examDate: 'asc' },
        include: {
          _count: { select: { bookings: true } },
          bookings: { where: { userId: req.user.userId, status: 'booked' }, select: { id: true } },
        },
      });
      const result = sessions.map(s => ({
        id: s.id, lingua: s.lingua, livello: s.livello, title: s.title,
        description: s.description, examDate: s.examDate, location: s.location,
        capacity: s.capacity, isOpen: s.isOpen,
        booked: s.bookings.length > 0,
        seatsTaken: s._count.bookings,
        seatsLeft: s.capacity != null ? Math.max(0, s.capacity - s._count.bookings) : null,
      }));
      return res.status(200).json({ sessions: result });
    } catch (err) {
      console.error('[exams GET]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  // POST — prenota
  if (req.method === 'POST') {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId obbligatorio' });
    try {
      const session = await prisma.examSession.findUnique({
        where: { id: sessionId },
        include: { _count: { select: { bookings: true } } },
      });
      if (!session) return res.status(404).json({ error: 'Sessione non trovata' });
      if (!session.isOpen) return res.status(400).json({ error: 'Prenotazioni chiuse per questa sessione' });
      if (session.capacity != null && session._count.bookings >= session.capacity) {
        return res.status(400).json({ error: 'Posti esauriti' });
      }
      // upsert: se aveva annullato, riattiva
      const booking = await prisma.examBooking.upsert({
        where: { sessionId_userId: { sessionId, userId: req.user.userId } },
        create: { sessionId, userId: req.user.userId, status: 'booked' },
        update: { status: 'booked' },
      });

      // Email di conferma (non bloccante)
      try {
        const [user] = await Promise.all([
          prisma.user.findUnique({ where: { id: req.user.userId }, select: { fullName: true, email: true } }),
        ]);
        const { sendExamBookingEmail } = require('../../../lib/resend');
        if (user && sendExamBookingEmail) await sendExamBookingEmail(user, session);
      } catch (e) { console.error('[exams] email conferma:', e.message); }

      return res.status(200).json({ ok: true, booking });
    } catch (err) {
      console.error('[exams POST]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  // DELETE — annulla
  if (req.method === 'DELETE') {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId obbligatorio' });
    try {
      await prisma.examBooking.updateMany({
        where: { sessionId, userId: req.user.userId },
        data: { status: 'canceled' },
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[exams DELETE]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
