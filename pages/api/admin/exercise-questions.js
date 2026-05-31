// pages/api/admin/exercise-questions.js — CRUD domande/sezioni di un test (admin)
//
// GET    ?testId=        → test completo con sezioni e domande (per l'editor)
// POST   {action, ...}   → azioni:
//   'add-section'        { testId, name, timeMinutes }
//   'update-section'     { sectionId, name, timeMinutes }
//   'delete-section'     { sectionId }
//   'add-question'       { sectionId, questionType, title, instruction, contextText, data }
//   'update-question'    { questionId, title, instruction, contextText, data, questionType }
//   'delete-question'    { questionId }
//   'reorder-questions'  { sectionId, order:[{id, sortOrder}] }
//
// Solo admin.

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  // GET — test completo per l'editor
  if (req.method === 'GET') {
    const { testId } = req.query;
    if (!testId) return res.status(400).json({ error: 'testId obbligatorio' });
    try {
      const test = await prisma.exerciseTest.findUnique({
        where: { id: testId },
        include: {
          sections: {
            orderBy: { sortOrder: 'asc' },
            include: { questions: { orderBy: { sortOrder: 'asc' } } },
          },
        },
      });
      if (!test) return res.status(404).json({ error: 'Test non trovato' });
      return res.status(200).json({ test });
    } catch (err) {
      console.error('[exercise-questions GET]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { action } = req.body || {};
  try {
    // ── SEZIONI ──────────────────────────────────────────────
    if (action === 'add-section') {
      const { testId, name, timeMinutes } = req.body;
      if (!testId || !name) return res.status(400).json({ error: 'testId e name obbligatori' });
      const last = await prisma.exerciseSection.findFirst({ where: { testId }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
      const section = await prisma.exerciseSection.create({
        data: { testId, name: name.trim(), timeMinutes: parseInt(timeMinutes, 10) || 5, sortOrder: (last?.sortOrder || 0) + 1 },
      });
      return res.status(201).json({ ok: true, section });
    }
    if (action === 'update-section') {
      const { sectionId, name, timeMinutes } = req.body;
      const data = {};
      if (name !== undefined && name.trim()) data.name = name.trim();
      if (timeMinutes !== undefined) data.timeMinutes = parseInt(timeMinutes, 10) || 5;
      const section = await prisma.exerciseSection.update({ where: { id: sectionId }, data });
      return res.status(200).json({ ok: true, section });
    }
    if (action === 'delete-section') {
      const { sectionId } = req.body;
      await prisma.exerciseSection.delete({ where: { id: sectionId } });
      return res.status(200).json({ ok: true });
    }

    // ── DOMANDE ──────────────────────────────────────────────
    if (action === 'add-question') {
      const { sectionId, questionType, title, instruction, contextText, data } = req.body;
      if (!sectionId || !questionType) return res.status(400).json({ error: 'sectionId e questionType obbligatori' });
      const last = await prisma.exerciseQuestion.findFirst({ where: { sectionId }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
      const question = await prisma.exerciseQuestion.create({
        data: {
          sectionId, questionType,
          title: title || null, instruction: instruction || null, contextText: contextText || null,
          data: data ?? {},
          sortOrder: (last?.sortOrder || 0) + 1,
        },
      });
      await prisma.adminLog.create({ data: { adminEmail: req.user.email, action: 'ADD_QUESTION', targetType: 'exerciseQuestion', targetId: question.id, payload: JSON.stringify({ sectionId, questionType }) } });
      return res.status(201).json({ ok: true, question });
    }
    if (action === 'update-question') {
      const { questionId, title, instruction, contextText, data, questionType } = req.body;
      if (!questionId) return res.status(400).json({ error: 'questionId obbligatorio' });
      const d = {};
      if (title !== undefined) d.title = title || null;
      if (instruction !== undefined) d.instruction = instruction || null;
      if (contextText !== undefined) d.contextText = contextText || null;
      if (questionType !== undefined) d.questionType = questionType;
      if (data !== undefined) d.data = data;
      const question = await prisma.exerciseQuestion.update({ where: { id: questionId }, data: d });
      await prisma.adminLog.create({ data: { adminEmail: req.user.email, action: 'UPDATE_QUESTION', targetType: 'exerciseQuestion', targetId: questionId, payload: '{}' } });
      return res.status(200).json({ ok: true, question });
    }
    if (action === 'delete-question') {
      const { questionId } = req.body;
      await prisma.exerciseQuestion.delete({ where: { id: questionId } });
      await prisma.adminLog.create({ data: { adminEmail: req.user.email, action: 'DELETE_QUESTION', targetType: 'exerciseQuestion', targetId: questionId, payload: '{}' } });
      return res.status(200).json({ ok: true });
    }
    if (action === 'reorder-questions') {
      const { sectionId, order } = req.body;
      if (!sectionId || !Array.isArray(order)) return res.status(400).json({ error: 'sectionId e order obbligatori' });
      const valid = await prisma.exerciseQuestion.findMany({ where: { sectionId }, select: { id: true } });
      const ids = new Set(valid.map(q => q.id));
      await prisma.$transaction(order.filter(o => ids.has(o.id)).map(o =>
        prisma.exerciseQuestion.update({ where: { id: o.id }, data: { sortOrder: parseInt(o.sortOrder, 10) || 0 } })
      ));
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Azione non riconosciuta' });
  } catch (err) {
    console.error('[exercise-questions POST]', err);
    return res.status(500).json({ error: 'Errore interno: ' + (err.message || '') });
  }
});
