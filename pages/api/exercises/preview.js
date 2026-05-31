// pages/api/exercises/preview.js — Anteprima/prova di un test (admin o docente)
// GET ?testId=  → test completo con sezioni e domande (per vederlo e provarlo).
// POST { testId, answers } → valuta le risposte SENZA salvare (modalità prova).
//
// Accesso: admin (tutti i test) o docente Accademia annuale (solo assignableByTeachers).

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');
const { checkFeatureAccess, ADMIN_EMAIL } = require('../../../lib/courseAccess');

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  const isAdmin = req.user.email === ADMIN_EMAIL;
  if (!isAdmin) {
    const access = await checkFeatureAccess(req.user, { minTier: 'accademia', requireAnnual: true });
    if (!access.ok) return res.status(403).json({ error: 'Riservato ad admin e docenti Accademia annuale.' });
  }

  const testId = req.method === 'GET' ? req.query.testId : (req.body || {}).testId;
  if (!testId) return res.status(400).json({ error: 'testId obbligatorio' });

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

  // Docente non admin: può vedere solo i test assegnabili
  if (!isAdmin && !test.assignableByTeachers) {
    return res.status(403).json({ error: 'Questo test non è disponibile' });
  }

  // GET — restituisce il test (per vederlo/provarlo)
  if (req.method === 'GET') {
    return res.status(200).json({ test });
  }

  // POST — valuta in modalità prova (nessun salvataggio)
  if (req.method === 'POST') {
    const { gradeQuestion } = require('../../../lib/grading');
    const ansMap = {};
    ((req.body || {}).answers || []).forEach(a => { ansMap[a.questionId] = a.given; });
    const allQ = (test.sections || []).flatMap(s => s.questions);
    let sum = 0, graded = 0;
    const detailed = [];
    for (const q of allQ) {
      const pct = gradeQuestion(q, ansMap[q.id]);
      if (pct === null) { detailed.push({ questionId: q.id, type: q.questionType, pct: null, manual: true }); continue; }
      sum += pct; graded++;
      detailed.push({ questionId: q.id, type: q.questionType, pct });
    }
    const score = graded > 0 ? Math.round(sum / graded) : 0;
    return res.status(200).json({ ok: true, score, maxScore: 100, detailed });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
