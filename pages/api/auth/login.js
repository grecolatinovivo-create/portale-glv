// pages/api/auth/login.js — Accesso utente esistente

const bcrypt = require('bcryptjs');
const { prisma } = require('../../../lib/prisma');
const { signToken, setAuthCookie } = require('../../../lib/auth');

export default async function handler(req, res) {
  // Accetta solo richieste POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { email, password } = req.body || {};

  // Validazione campi obbligatori
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password sono obbligatori' });
  }

  try {
    // Ricerca utente per email (normalizzata in minuscolo)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Utente non trovato — messaggio generico per sicurezza
    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Verifica password con bcryptjs
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Controlla sospensione account (campo opzionale — safe anche se non ancora nel DB)
    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account sospeso. Contatta support@grecolatinovivo.it.' });
    }

    // Generazione JWT e impostazione cookie
    const token = signToken({ userId: user.id, email: user.email });
    setAuthCookie(res, token);

    return res.status(200).json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (err) {
    console.error('[login] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
};
