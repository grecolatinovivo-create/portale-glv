// pages/api/classroom/[id].js — Dettaglio classe (lato DOCENTE)
// GET  → dettaglio: studenti, test assegnati, risultati delle submission
// POST → azioni: { action:'assign-test', testId } | { action:'unassign-test', testId }
//                | { action:'toggle-open', isOpen } | { action:'remove-student', studentId }
//
// Accesso: solo il docente proprietario (Accademia annuale) o admin.

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');
const { checkFeatureAccess } = require('../../../lib/courseAccess');

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  const access = await checkFeatureAccess(req.user, { minTier: 'accademia', requireAnnual: true });
  if (!access.ok) return res.status(403).json({ error: 'Riservato al piano annuale Accademia.' });

  const { id } = req.query;
  const cls = await prisma.classroom.findUnique({ where: { id } });
  if (!cls || cls.teacherId !== req.user.userId) {
    return res.status(404).json({ error: 'Classe non trovata' });
  }

  // GET — dettaglio completo
  if (req.method === 'GET') {
    try {
      const [students, assignments] = await Promise.all([
        prisma.classroomStudent.findMany({
          where: { classroomId: id },
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          include: {
            submissions: {
              select: { id: true, testId: true, score: true, maxScore: true, completedAt: true },
            },
          },
        }),
        prisma.classroomTest.findMany({
          where: { classroomId: id },
          include: { test: { select: { id: true, title: true, lingua: true, livello: true } } },
        }),
      ]);
      return res.status(200).json({ classroom: cls, students, assignments });
    } catch (err) {
      console.error('[classroom/[id] GET]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  // POST — azioni
  if (req.method === 'POST') {
    const { action } = req.body || {};
    try {
      if (action === 'assign-test') {
        const { testId } = req.body;
        if (!testId) return res.status(400).json({ error: 'testId obbligatorio' });
        await prisma.classroomTest.upsert({
          where: { classroomId_testId: { classroomId: id, testId } },
          create: { classroomId: id, testId },
          update: {},
        });
        return res.status(200).json({ ok: true });
      }
      if (action === 'unassign-test') {
        const { testId } = req.body;
        await prisma.classroomTest.deleteMany({ where: { classroomId: id, testId } });
        return res.status(200).json({ ok: true });
      }
      if (action === 'toggle-open') {
        const { isOpen } = req.body;
        await prisma.classroom.update({ where: { id }, data: { isOpen: Boolean(isOpen) } });
        return res.status(200).json({ ok: true });
      }
      if (action === 'remove-student') {
        const { studentId } = req.body;
        await prisma.classroomStudent.deleteMany({ where: { id: studentId, classroomId: id } });
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: 'Azione non riconosciuta' });
    } catch (err) {
      console.error('[classroom/[id] POST]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
