// pages/api/stripe/upgrade-subscription.js
// Permette a un abbonato di cambiare piano (upgrade o downgrade) con prorating Stripe.
// Il prorating è gestito nativamente da Stripe: se l'utente passa da Cultura a Linguae
// dopo 2 settimane, paga solo la differenza proporzionale al tempo restante nel ciclo.

const { stripe }    = require('../../../lib/stripe');
const { prisma }    = require('../../../lib/prisma');
const { requireAuth } = require('../../../lib/auth');
const { PLANS }     = require('../../../lib/resend');

// Reverse-lookup: da priceId Stripe → planId leggibile (es. 'linguae-mensile')
function planIdFromPriceId(priceId) {
  for (const [planId, pData] of Object.entries(PLANS)) {
    if (process.env[pData.envKey] === priceId) return planId;
  }
  return null;
}

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { priceId } = req.body || {};

  if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) {
    return res.status(400).json({ error: 'priceId non valido' });
  }

  // Verifica che il priceId sia uno dei nostri piani noti
  const newPlanId = planIdFromPriceId(priceId);
  if (!newPlanId) {
    return res.status(400).json({ error: 'Piano non riconosciuto' });
  }

  try {
    // Trova la subscription attiva dell'utente nel DB
    const dbSub = await prisma.subscription.findFirst({
      where: {
        userId: req.user.userId,
        status: { in: ['active', 'past_due'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!dbSub) {
      return res.status(400).json({ error: 'Nessun abbonamento attivo trovato' });
    }

    // Recupera la subscription da Stripe per ottenere l'item ID
    const stripeSub = await stripe.subscriptions.retrieve(dbSub.stripeSubscriptionId);
    const item = stripeSub.items?.data?.[0];

    if (!item) {
      return res.status(400).json({ error: 'Subscription item non trovato su Stripe' });
    }

    // Controlla che non sia già sullo stesso piano
    if (item.price.id === priceId) {
      return res.status(400).json({ error: 'Sei già su questo piano' });
    }

    // ── Aggiorna la subscription Stripe con prorating ────────────────
    // proration_behavior: 'create_prorations' → Stripe calcola la differenza
    // proporzionale al tempo restante nel ciclo corrente e crea un credit/charge
    // che appare nella prossima fattura.
    const updatedSub = await stripe.subscriptions.update(dbSub.stripeSubscriptionId, {
      items: [{ id: item.id, price: priceId }],
      proration_behavior: 'create_prorations',
    });

    // Aggiorna immediatamente il piano nel DB (non aspettiamo il webhook)
    await prisma.subscription.update({
      where: { stripeSubscriptionId: dbSub.stripeSubscriptionId },
      data: {
        plan:            newPlanId,
        status:          updatedSub.status,
        currentPeriodEnd: new Date(updatedSub.current_period_end * 1000),
      },
    });

    console.log(`[upgrade-subscription] Utente ${req.user.userId}: ${dbSub.plan} → ${newPlanId}`);

    return res.status(200).json({ ok: true, newPlan: newPlanId });

  } catch (err) {
    console.error('[upgrade-subscription] Errore Stripe:', err);
    return res.status(500).json({ error: err.message || 'Errore interno del server' });
  }
});
