// pages/api/auth/set-password.js — Imposta la password dopo il primo pagamento
//
// Flusso:
//  1. Frontend /set-password.html manda POST { token, password }
//  2. Questo endpoint verifica il token nel DB (non scaduto, non già usato)
//  3. Fa bcrypt.hash della nuova password e aggiorna l'utente
//  4. Marca il token come usato (usedAt = now)
//  5. Emette il JWT cookie di sessione
//  6. Risponde 200 { ok: true } → il frontend fa redirect a /dashboard.html

const bcrypt = require('bcryptjs');
const { prisma } = require('../../../lib/prisma');
const { signToken, setAuthCookie } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { token, password } = req.body || {};

  // Validazione input
  if (!token || typeof token !== 'string' || token.length < 32) {
    return res.status(400).json({ error: 'Token non valido' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'La password deve essere di almeno 8 caratteri' });
  }

  try {
    // Cerca il token nel DB
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Link non valido o già utilizzato.' });
    }

    if (resetToken.usedAt) {
      return res.status(400).json({ error: 'Questo link è già stato utilizzato. Accedi con le tue credenziali.' });
    }

    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({ error: 'Il link è scaduto. Richiedine uno nuovo dalla pagina di accesso.' });
    }

    // Hash della nuova password
    const passwordHash = await bcrypt.hash(password, 10);

    // Aggiorna password e marca il token come usato in una transazione atomica
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Emetti il JWT di sessione
    const sessionToken = signToken({ userId: resetToken.userId, email: resetToken.user.email });
    setAuthCookie(res, sessionToken);

    console.log(`[set-password] Password impostata per utente: ${resetToken.user.email}`);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[set-password] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}
