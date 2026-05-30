const { prisma } = require('../../../lib/prisma');
const { stripe } = require('../../../lib/stripe');
const { requireAuth } = require('../../../lib/auth');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // stripeCustomerId vive sul modello Subscription, non su User.
    // I piani manuali assegnati dall'admin hanno un customer sintetico
    // (es. "admin_xxx") che NON esiste su Stripe: vanno esclusi, altrimenti
    // billingPortal.sessions.create fallisce. Cerchiamo un customer Stripe reale
    // (prefisso "cus_"), prendendo la subscription più recente.
    const subs = await prisma.subscription.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      select: { stripeCustomerId: true },
    });

    const realCustomer = subs.find(
      s => typeof s.stripeCustomerId === 'string' && s.stripeCustomerId.startsWith('cus_')
    );

    if (!realCustomer) {
      return res.status(400).json({ error: 'Nessun abbonamento Stripe da gestire' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: realCustomer.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/profilo.html`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error('[portal] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}

export default requireAuth(handler);
