// pages/api/auth/forgot-password.js — Richiesta recupero password
// POST { email } → se l'utente esiste, crea un PasswordResetToken (48h) e invia
// l'email con il link a /set-password.html. Vale anche per l'admin.
//
// Sicurezza: risponde SEMPRE ok (non rivela se l'email è registrata) per evitare
// l'enumerazione degli account.

const { prisma } = require('../../../lib/prisma');
const crypto = require('crypto');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email obbligatoria' });

  const clean = String(email).toLowerCase().trim();

  try {
    const user = await prisma.user.findUnique({ where: { email: clean } });

    // Risposta generica in ogni caso (no enumeration)
    if (!user) return res.status(200).json({ ok: true });

    // Invalida eventuali token precedenti non usati di questo utente
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    try {
      const { sendSetPasswordEmail } = require('../../../lib/resend');
      await sendSetPasswordEmail(user, token);
    } catch (e) {
      console.error('[forgot-password] email:', e.message);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[forgot-password]', err);
    // Anche in errore, risposta generica per non rivelare dettagli
    return res.status(200).json({ ok: true });
  }
}
