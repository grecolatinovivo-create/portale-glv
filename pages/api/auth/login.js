// pages/api/auth/login.js

const bcrypt = require('bcryptjs');
const { prisma } = require('../../../lib/prisma');
const { signToken, setAuthCookie } = require('../../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { email, password } = req.body || {};

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = signToken({ id: user.id, email: user.email });
    setAuthCookie(res, token);

    return res.status(200).json({ user: { id: user.id, email: user.email, fullName: user.fullName } });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
};
