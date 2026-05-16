const { prisma } = require('../../../lib/prisma');
const { stripe } = require('../../../lib/stripe');
const { requireAuth } = require('../../../lib/auth');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user || !user.stripeCustomerId) {
      return res.status(400).json({ error: 'Nessun abbonamento trovato' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/profilo.html`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error('[portal] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}

module.exports = requireAuth(handler);
