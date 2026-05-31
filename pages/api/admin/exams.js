// pages/api/admin/exams.js — Gestione sessioni d'esame di certificazione (admin)
// GET    → lista sessioni con conteggio prenotazioni
// POST   → crea sessione { lingua, livello, title, examDate, location, capacity }
// PUT    → aggiorna sessione { id, ... }
// DELETE → elimina sessione { id }

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  // GET — lista
  if (req.method === 'GET') {
    try {
      const sessions = await prisma.examSession.findMany({
        orderBy: { examDate: 'asc' },
        include: {
          _count: { select: { bookings: true } },
          bookings: {
            where: { status: 'booked' },
            include: { user: { select: { fullName: true, email: true } } },
          },
        },
      });
      return res.status(200).json({ sessions });
    } catch (err) {
      console.error('[admin/exams GET]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  // POST — crea
  if (req.method === 'POST') {
    const { lingua, livello, title, description, examDate, location, capacity } = req.body || {};
    if (!lingua || !title || !examDate) {
      return res.status(400).json({ error: 'lingua, title e examDate sono obbligatori' });
    }
    try {
      const session = await prisma.examSession.create({
        data: {
          lingua, livello: livello || null, title: title.trim(),
          description: description || null,
          examDate: new Date(examDate),
          location: location || 'Online',
          capacity: (capacity === '' || capacity == null) ? null : parseInt(capacity, 10),
        },
      });
      await prisma.adminLog.create({
        data: { adminEmail: req.user.email, action: 'CREATE_EXAM', targetType: 'exam', targetId: session.id, payload: JSON.stringify({ title, examDate }) },
      });
      return res.status(201).json({ ok: true, session });
    } catch (err) {
      console.error('[admin/exams POST]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  // PUT — aggiorna
  if (req.method === 'PUT') {
    const { id, lingua, livello, title, description, examDate, location, capacity, isOpen } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id obbligatorio' });
    try {
      const data = {};
      if (lingua !== undefined) data.lingua = lingua;
      if (livello !== undefined) data.livello = livello || null;
      if (title !== undefined && title.trim()) data.title = title.trim();
      if (description !== undefined) data.description = description || null;
      if (examDate !== undefined) data.examDate = new Date(examDate);
      if (location !== undefined) data.location = location || 'Online';
      if (capacity !== undefined) data.capacity = (capacity === '' || capacity == null) ? null : parseInt(capacity, 10);
      if (isOpen !== undefined) data.isOpen = Boolean(isOpen);
      const session = await prisma.examSession.update({ where: { id }, data });
      await prisma.adminLog.create({
        data: { adminEmail: req.user.email, action: 'UPDATE_EXAM', targetType: 'exam', targetId: id, payload: JSON.stringify(data) },
      });
      return res.status(200).json({ ok: true, session });
    } catch (err) {
      console.error('[admin/exams PUT]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  // DELETE — elimina
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id obbligatorio' });
    try {
      await prisma.examSession.delete({ where: { id } });
      await prisma.adminLog.create({
        data: { adminEmail: req.user.email, action: 'DELETE_EXAM', targetType: 'exam', targetId: id, payload: '{}' },
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[admin/exams DELETE]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
