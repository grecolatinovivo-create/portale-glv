// pages/api/admin/exercises.js — Gestione esercizi (admin)
// GET            → lista tutti i test con flag assignableByTeachers e n. domande
// POST           → { action:'toggle-assignable', id, value } | { action:'update', id, title, lingua, livello }
//
// Solo admin.

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  if (req.method === 'GET') {
    try {
      const tests = await prisma.exerciseTest.findMany({
        orderBy: [{ lingua: 'asc' }, { ordine: 'asc' }, { title: 'asc' }],
        select: {
          id: true, title: true, lingua: true, livello: true,
          assignableByTeachers: true, isPublic: true,
          _count: { select: { sections: true } },
        },
      });
      // conteggio domande per test (somma sulle sezioni)
      return res.status(200).json({ tests });
    } catch (err) {
      console.error('[admin/exercises GET]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  if (req.method === 'POST') {
    const { action, id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id obbligatorio' });
    try {
      if (action === 'toggle-assignable') {
        const { value } = req.body;
        const t = await prisma.exerciseTest.update({
          where: { id }, data: { assignableByTeachers: Boolean(value) },
        });
        await prisma.adminLog.create({
          data: { adminEmail: req.user.email, action: 'TEST_ASSIGNABLE', targetType: 'exerciseTest', targetId: id, payload: JSON.stringify({ value: Boolean(value) }) },
        });
        return res.status(200).json({ ok: true, assignableByTeachers: t.assignableByTeachers });
      }
      if (action === 'update') {
        const { title, lingua, livello } = req.body;
        const data = {};
        if (title !== undefined && title.trim()) data.title = title.trim();
        if (lingua !== undefined) data.lingua = lingua || null;
        if (livello !== undefined) data.livello = livello || null;
        const t = await prisma.exerciseTest.update({ where: { id }, data });
        await prisma.adminLog.create({
          data: { adminEmail: req.user.email, action: 'UPDATE_TEST', targetType: 'exerciseTest', targetId: id, payload: JSON.stringify(data) },
        });
        return res.status(200).json({ ok: true, test: t });
      }
      return res.status(400).json({ error: 'Azione non riconosciuta' });
    } catch (err) {
      console.error('[admin/exercises POST]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
