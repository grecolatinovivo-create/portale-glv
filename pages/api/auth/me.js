// pages/api/auth/me.js

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

module.exports = withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!req.user) {
    return res.status(200).json({ user: null });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { subscription: true },
    });

    if (!user) {
      return res.status(200).json({ user: null });
    }

    const sub = user.subscription
      ? {
          status: user.subscription.status,
          plan: user.subscription.plan,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
        }
      : null;

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        subscription: sub,
      },
    });
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
