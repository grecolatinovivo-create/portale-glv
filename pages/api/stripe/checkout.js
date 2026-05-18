// pages/api/stripe/checkout.js — Crea sessione Stripe Checkout per abbonamento
// Autenticazione OPZIONALE: se l'utente è loggato viene pre-compilata l'email e
// aggiunto l'userId nei metadata. Se non loggato, Stripe raccoglie l'email da solo.
// L'account utente viene creato/aggiornato nel webhook checkout.session.completed.

const { stripe } = require('../../../lib/stripe');
const { withAuth } = require('../../../lib/auth');
const { getPriceId, PLANS } = require('../../../lib/resend');

// Lista dei 6 planId validi (formato legacy: 'cultura-mensile', ecc.)
const VALID_PLAN_IDS = Object.keys(PLANS);

async function handler(req, res) {
  // Accetta solo richieste POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { planId, priceId: directPriceId, type } = req.body || {};

  // ── Risolvi il Price ID: accetta due formati ─────────────────
  // 1. Nuovo (frontend app.js): { type:'subscription', priceId:'price_...' }
  // 2. Legacy: { planId:'cultura-mensile' }
  let finalPriceId;
  let resolvedPlanId = planId || null;

  if (type === 'subscription' && directPriceId) {
    // Percorso nuovo: priceId diretto dalla cache /api/config/prices
    if (typeof directPriceId !== 'string' || !directPriceId.startsWith('price_')) {
      return res.status(400).json({ error: 'priceId non valido' });
    }
    finalPriceId = directPriceId;

  } else if (planId) {
    // Percorso legacy: lookup tramite nome piano
    if (!VALID_PLAN_IDS.includes(planId)) {
      return res.status(400).json({
        error: `Piano non valido. Scegli uno tra: ${VALID_PLAN_IDS.join(', ')}`,
      });
    }
    finalPriceId = getPriceId(planId);
    if (!finalPriceId) {
      console.error(`[checkout] Price ID mancante per il piano: ${planId}`);
      return res.status(500).json({ error: 'Configurazione del piano non disponibile' });
    }

  } else {
    return res.status(400).json({ error: 'Specificare planId oppure type+priceId' });
  }

  try {
    // Costruisce la sessione Stripe — auth opzionale
    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: finalPriceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?checkout=success`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/#prezzi`,
      // allow_promotion_codes: true, // decommenta per abilitare coupon
      metadata: {
        planId: resolvedPlanId || finalPriceId,
      },
    };

    // Se l'utente è loggato: pre-compila email e aggiungi userId nei metadata
    if (req.user) {
      sessionParams.customer_email = req.user.email;
      sessionParams.metadata.userId = req.user.userId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[checkout] Errore Stripe:', err);
    return res.status(500).json({ error: err.message || 'Errore interno del server' });
  }
}

// withAuth (non requireAuth): legge il cookie se presente ma NON blocca i non-loggati
export default withAuth(handler);
