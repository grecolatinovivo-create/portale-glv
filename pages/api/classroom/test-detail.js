// pages/api/classroom/test-detail.js — Domande di un test per lo studente (PUBBLICO)
// GET ?code=&email=&testId=  → domande del test, SOLO se assegnato alla classe
// e lo studente è confermato. Non espone le soluzioni in chiaro più del necessario
// (il rendering client mescola le opzioni; la correzione avviene server-side al submit).

const { prisma } = require('../../../lib/prisma');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { code, email, testId } = req.query;
  if (!code || !email || !testId) return res.status(400).json({ error: 'Parametri mancanti' });

  try {
    const classroom = await prisma.classroom.findUnique({ where: { code: String(code).trim().toUpperCase() } });
    if (!classroom) return res.status(404).json({ error: 'Classe non trovata' });
    const student = await prisma.classroomStudent.findUnique({
      where: { classroomId_email: { classroomId: classroom.id, email: String(email).trim().toLowerCase() } },
    });
    if (!student || !student.emailConfirmed) return res.status(403).json({ error: 'Accesso non valido' });

    const assigned = await prisma.classroomTest.findUnique({
      where: { classroomId_testId: { classroomId: classroom.id, testId } },
    });
    if (!assigned) return res.status(403).json({ error: 'Test non assegnato a questa classe' });

    const test = await prisma.exerciseTest.findUnique({
      where: { id: testId },
      select: {
        id: true, title: true, lingua: true, livello: true,
        sections: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true, name: true,
            questions: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, questionType: true, title: true, instruction: true, contextText: true, data: true },
            },
          },
        },
      },
    });
    if (!test) return res.status(404).json({ error: 'Test non trovato' });
    return res.status(200).json({ test });
  } catch (err) {
    console.error('[classroom/test-detail]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
