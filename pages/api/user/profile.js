// pages/api/user/profile.js

const { prisma } = require('../../../lib/prisma');
const { requireAuth } = require('../../../lib/auth');

module.exports = requireAuth(async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, fullName: true, createdAt: true },
      });

      return res.status(200).json({ user });
    } catch (err) {
      console.error('[user/profile GET]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  if (req.method === 'PUT') {
    const { fullName } = req.body || {};

    if (!fullName || fullName.trim() === '') {
      return res.status(400).json({ error: 'fullName non può essere vuoto' });
    }

    try {
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { fullName: fullName.trim() },
      });

      return res.status(200).json({ user: { id: user.id, email: user.email, fullName: user.fullName } });
    } catch (err) {
      console.error('[user/profile PUT]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
