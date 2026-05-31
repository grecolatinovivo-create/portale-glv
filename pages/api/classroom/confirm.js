// pages/api/classroom/confirm.js — Conferma email studente (PUBBLICO)
// POST { token } → marca emailConfirmed:true. Ritorna i dati base classe/studente.

const { prisma } = require('../../../lib/prisma');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Token mancante' });

  try {
    const student = await prisma.classroomStudent.findUnique({
      where: { confirmToken: token },
      include: { classroom: { select: { id: true, name: true, code: true } } },
    });
    if (!student) return res.status(404).json({ error: 'Link di conferma non valido' });

    if (!student.emailConfirmed) {
      await prisma.classroomStudent.update({ where: { id: student.id }, data: { emailConfirmed: true } });
    }
    return res.status(200).json({
      ok: true,
      student: { firstName: student.firstName, lastName: student.lastName, email: student.email },
      classroom: student.classroom,
      code: student.classroom.code,
    });
  } catch (err) {
    console.error('[classroom/confirm]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
