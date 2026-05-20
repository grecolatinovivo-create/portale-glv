// pages/api/stripe/cancel-subscription.js — Annulla l'abbonamento a fine periodo
//
// NON cancella subito: imposta cancel_at_period_end = true su Stripe.
// L'utente mantiene l'accesso fino a currentPeriodEnd, poi l'abbonamento scade.
// Il webhook customer.subscription.updated salva cancelAtPeriodEnd nel DB.

const { prisma } = require('../../../lib/prisma');
const { stripe }  = require('../../../lib/stripe');
const { requireAuth } = require('../../../lib/auth');

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    // Trova la subscription attiva dell'utente
    const sub = await prisma.subscription.findFirst({
      where: {
        userId: req.user.userId,
        status: { in: ['active', 'past_due'] },
        cancelAtPeriodEnd: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub) {
      return res.status(400).json({ error: 'Nessun abbonamento attivo da annullare.' });
    }

    // Comunica a Stripe di non rinnovare al prossimo ciclo
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Aggiorna subito il DB senza aspettare il webhook (ottimistic update)
    await prisma.subscription.update({
      where: { stripeSubscriptionId: sub.stripeSubscriptionId },
      data: { cancelAtPeriodEnd: true },
    });

    console.log(`[cancel-subscription] Abbonamento annullato a fine periodo per userId: ${req.user.userId}`);

    return res.status(200).json({
      ok: true,
      currentPeriodEnd: sub.currentPeriodEnd,
    });
  } catch (err) {
    console.error('[cancel-subscription] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
