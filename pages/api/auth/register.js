// pages/api/auth/register.js — Registrazione nuovo utente

const bcrypt = require('bcryptjs');
const { prisma } = require('../../../lib/prisma');
const { signToken, setAuthCookie } = require('../../../lib/auth');
const { sendWelcomeEmail } = require('../../../lib/resend');

export default async function handler(req, res) {
  // Accetta solo richieste POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { email, fullName, password } = req.body || {};

  // Validazione campi obbligatori
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password sono obbligatori' });
  }

  // Validazione lunghezza minima password
  if (password.length < 8) {
    return res.status(400).json({ error: 'La password deve essere di almeno 8 caratteri' });
  }

  // Validazione formato email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Formato email non valido' });
  }

  try {
    // Controlla se l'email è già registrata
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'Email già registrata' });
    }

    // Hash della password con bcryptjs (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Creazione utente nel database
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        fullName: fullName || null,
        passwordHash,
      },
    });

    // Generazione JWT e impostazione cookie
    const token = signToken({ userId: user.id, email: user.email });
    setAuthCookie(res, token);

    // Invio email di benvenuto (non blocca la risposta in caso di errore)
    try {
      await sendWelcomeEmail(user);
    } catch (emailErr) {
      console.error('[register] Errore invio email di benvenuto:', emailErr);
    }

    return res.status(201).json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (err) {
    console.error('[register] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
};
