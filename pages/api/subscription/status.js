// pages/api/subscription/status.js

const { prisma } = require('../../../lib/prisma');
const { requireAuth } = require('../../../lib/auth');

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });

    if (!subscription) {
      return res.status(200).json({ subscription: null });
    }

    return res.status(200).json({
      subscription: {
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    });
  } catch (err) {
    console.error('[subscription/status]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
