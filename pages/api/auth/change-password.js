// pages/api/auth/change-password.js — Cambio password da utente loggato (sicuro)
// POST { currentPassword, newPassword } → verifica la password attuale, poi aggiorna.
// Richiede autenticazione. Vale anche per l'admin.

const { prisma } = require('../../../lib/prisma');
const bcrypt = require('bcryptjs');
const { withAuth } = require('../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Password attuale e nuova sono obbligatorie' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La nuova password deve avere almeno 8 caratteri' });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({ error: 'La nuova password deve essere diversa da quella attuale' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'La password attuale non è corretta' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[change-password]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
