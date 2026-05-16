// pages/api/auth/register.js

const bcrypt = require('bcryptjs');
const { prisma } = require('../../../lib/prisma');
const { signToken, setAuthCookie } = require('../../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { email, fullName, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password sono obbligatori' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email già registrata' });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, fullName: fullName || null, password: hash },
    });

    const token = signToken({ id: user.id, email: user.email });
    setAuthCookie(res, token);

    return res.status(201).json({ user: { id: user.id, email: user.email, fullName: user.fullName } });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
};
