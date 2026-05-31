// pages/api/classroom/join.js — Iscrizione studente a una classe (PUBBLICO, no login)
// POST { code, firstName, lastName, email } → crea ClassroomStudent (emailConfirmed:false)
//   e invia email di conferma con link. Se già iscritto, rimanda la conferma.
//
// Nessun gate di abbonamento: gli studenti non sono utenti del portale.

const { prisma } = require('../../../lib/prisma');
const crypto = require('crypto');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://portale.grecolatinovivo.it';

function isEmail(s) { return typeof s === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s); }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { code, firstName, lastName, email } = req.body || {};
  if (!code || !firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
  }
  if (!isEmail(email)) return res.status(400).json({ error: 'Email non valida' });

  try {
    const classroom = await prisma.classroom.findUnique({ where: { code: String(code).trim().toUpperCase() } });
    if (!classroom) return res.status(404).json({ error: 'Codice classe non valido' });
    if (!classroom.isOpen) return res.status(403).json({ error: 'Questa classe non accetta nuove iscrizioni' });

    const cleanEmail = String(email).trim().toLowerCase();
    const token = crypto.randomBytes(24).toString('hex');

    // upsert per (classroomId, email): se riesiste, rigenera token e rimanda conferma
    const student = await prisma.classroomStudent.upsert({
      where: { classroomId_email: { classroomId: classroom.id, email: cleanEmail } },
      create: {
        classroomId: classroom.id,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: cleanEmail,
        confirmToken: token,
      },
      update: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        // rigenera token solo se non ancora confermato
        ...(/* keep */ {}),
      },
    });

    // Se non confermato, (ri)genera token e manda email
    if (!student.emailConfirmed) {
      const freshToken = student.confirmToken || token;
      if (!student.confirmToken) {
        await prisma.classroomStudent.update({ where: { id: student.id }, data: { confirmToken: token } });
      }
      const confirmUrl = `${APP_URL}/classe-conferma.html?token=${freshToken}`;
      try {
        const { sendClassStudentConfirmEmail } = require('../../../lib/resend');
        await sendClassStudentConfirmEmail(cleanEmail, `${firstName} ${lastName}`, classroom.name, confirmUrl);
      } catch (e) { console.error('[classroom/join] email:', e.message); }
      return res.status(200).json({ ok: true, needsConfirm: true });
    }

    return res.status(200).json({ ok: true, needsConfirm: false });
  } catch (err) {
    console.error('[classroom/join]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
