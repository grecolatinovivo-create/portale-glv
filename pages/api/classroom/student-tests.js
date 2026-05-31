// pages/api/classroom/student-tests.js — Test per lo studente di classe (PUBBLICO)
// GET  ?code=ABC123&email=...  → verifica studente confermato, lista test assegnati + stato
// POST { code, email, testId, answers:[{questionId, given}] } → registra submission e calcola punteggio
//
// Niente login: lo studente è identificato da (code classe + email confermata).

const { prisma } = require('../../../lib/prisma');

async function resolveStudent(code, email) {
  if (!code || !email) return null;
  const classroom = await prisma.classroom.findUnique({ where: { code: String(code).trim().toUpperCase() } });
  if (!classroom) return null;
  const student = await prisma.classroomStudent.findUnique({
    where: { classroomId_email: { classroomId: classroom.id, email: String(email).trim().toLowerCase() } },
  });
  if (!student || !student.emailConfirmed) return null;
  return { classroom, student };
}

export default async function handler(req, res) {
  // GET — lista test assegnati alla classe + stato submission dello studente
  if (req.method === 'GET') {
    const { code, email } = req.query;
    const ctx = await resolveStudent(code, email);
    if (!ctx) return res.status(403).json({ error: 'Accesso non valido. Verifica codice ed email confermata.' });
    try {
      const assignments = await prisma.classroomTest.findMany({
        where: { classroomId: ctx.classroom.id },
        include: { test: { select: { id: true, title: true, lingua: true, livello: true } } },
      });
      const subs = await prisma.testSubmission.findMany({
        where: { studentId: ctx.student.id },
        select: { testId: true, score: true, maxScore: true, completedAt: true },
      });
      const subByTest = Object.fromEntries(subs.map(s => [s.testId, s]));
      const tests = assignments.map(a => ({
        testId: a.test.id, title: a.test.title, lingua: a.test.lingua, livello: a.test.livello,
        done: !!subByTest[a.test.id]?.completedAt,
        score: subByTest[a.test.id]?.score ?? null,
        maxScore: subByTest[a.test.id]?.maxScore ?? null,
      }));
      return res.status(200).json({ student: { firstName: ctx.student.firstName, lastName: ctx.student.lastName }, classroom: { name: ctx.classroom.name }, tests });
    } catch (err) {
      console.error('[student-tests GET]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  // POST — registra svolgimento e calcola punteggio (modello latin-cert)
  if (req.method === 'POST') {
    const { code, email, testId, answers } = req.body || {};
    const ctx = await resolveStudent(code, email);
    if (!ctx) return res.status(403).json({ error: 'Accesso non valido' });
    if (!testId) return res.status(400).json({ error: 'testId obbligatorio' });

    try {
      const assigned = await prisma.classroomTest.findUnique({
        where: { classroomId_testId: { classroomId: ctx.classroom.id, testId } },
      });
      if (!assigned) return res.status(403).json({ error: 'Test non assegnato a questa classe' });

      const test = await prisma.exerciseTest.findUnique({
        where: { id: testId },
        include: { sections: { include: { questions: true } } },
      });
      const allQ = (test?.sections || []).flatMap(s => s.questions);

      // answers: { questionId: <risposta> }  — la forma di <risposta> dipende dal tipo.
      const ansMap = {};
      (answers || []).forEach(a => { ansMap[a.questionId] = a.given; });

      const { gradeQuestion } = require('../../../lib/grading');

      // ── Modello latin-cert: ogni domanda → percentuale 0-100 (credito parziale),
      //    sessione = MEDIA delle percentuali → "N/100".
      const detailed = [];
      let sum = 0, graded = 0;
      for (const q of allQ) {
        const pct = gradeQuestion(q, ansMap[q.id]);  // null se non autocorreggibile
        if (pct === null) {
          detailed.push({ questionId: q.id, type: q.questionType, pct: null, manual: true });
          continue; // RispostaAperta ecc. non entrano nella media (autoval_flag=0)
        }
        sum += pct; graded++;
        detailed.push({ questionId: q.id, type: q.questionType, pct });
      }
      const scorePercent = graded > 0 ? Math.round(sum / graded) : 0;

      const submission = await prisma.testSubmission.create({
        data: {
          studentId: ctx.student.id, testId, classroomId: ctx.classroom.id,
          score: scorePercent,       // percentuale 0-100 (come latin-cert: result = N/100)
          maxScore: 100,
          completedAt: new Date(),
          answers: detailed,
        },
      });
      return res.status(200).json({ ok: true, score: scorePercent, maxScore: 100, submissionId: submission.id });
    } catch (err) {
      console.error('[student-tests POST]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Metodo non consentito' });
}
