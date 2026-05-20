// pages/api/auth/resend-set-password.js — Reinvia il link imposta-password
//
// Flusso:
//  1. Utente inserisce la propria email nella pagina /set-password.html
//  2. Questo endpoint verifica che l'email esista e abbia un abbonamento attivo
//  3. Invalida i token precedenti (li marca come usati)
//  4. Genera un nuovo token valido 48 ore
//  5. Manda la email con il link
//
// Risponde sempre 200 per non rivelare se l'email è registrata o meno.

const crypto = require('crypto');
const { prisma } = require('../../../lib/prisma');
const { sendSetPasswordEmail } = require('../../../lib/resend');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { email } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email obbligatoria' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Risposta generica — non rivela se l'email esiste o meno
  const genericOk = res.status(200).json.bind(
    res,
    { ok: true, message: 'Se l\'email è associata a un abbonamento attivo, riceverai il link a breve.' }
  );

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      console.log(`[resend-set-password] Email non trovata (risposta generica): ${normalizedEmail}`);
      return genericOk();
    }

    // Verifica che l'utente abbia un abbonamento attivo
    const activeSub = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'active',
      },
    });

    if (!activeSub) {
      console.log(`[resend-set-password] Nessun abbonamento attivo per: ${normalizedEmail}`);
      return genericOk();
    }

    // Invalida i token precedenti non ancora usati
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    // Genera nuovo token (48 byte → 96 char hex)
    const rawToken  = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token:  rawToken,
        expiresAt,
      },
    });

    // Usa il piano dell'abbonamento attivo come label nell'email
    await sendSetPasswordEmail(user, activeSub.plan, rawToken);
    console.log(`[resend-set-password] Nuovo link inviato a: ${normalizedEmail}`);

    return genericOk();
  } catch (err) {
    console.error('[resend-set-password] Errore:', err);
    // Anche in caso di errore rispondiamo 200 per non rivelare informazioni
    return genericOk();
  }
}
