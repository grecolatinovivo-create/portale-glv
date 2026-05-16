const { prisma } = require('../../../lib/prisma');
const { stripe } = require('../../../lib/stripe');
const { withAuth } = require('../../../lib/auth');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, priceId, courseSlug } = req.body;

    if (!type || (type !== 'subscription' && type !== 'course')) {
      return res.status(400).json({ error: 'Parametro type non valido' });
    }

    // Utente opzionale — req.user è già popolato da withAuth se loggato, null altrimenti
    const user = req.user ? await prisma.user.findUnique({ where: { id: req.user.id } }) : null;

    let customerParam = {};
    if (user) {
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.fullName || '',
        });
        customerId = customer.id;
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customerId },
        });
      }
      customerParam = { customer: customerId };
    }

    if (type === 'subscription') {
      if (!priceId) {
        return res.status(400).json({ error: 'priceId obbligatorio per subscription' });
      }

      const session = await stripe.checkout.sessions.create({
        ...customerParam,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        // FIX: URL corretti che puntano al portale, non al sito principale
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard.html?subscribed=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/index.html#prezzi`,
        locale: 'it',
        billing_address_collection: 'required',
        allow_promotion_codes: true,
        // FIX: trial di 7 giorni — era pubblicizzato ma non implementato
        subscription_data: {
          trial_period_days: 7,
          metadata: { userId: user?.id || '', type: 'subscription' },
        },
        custom_fields: [
          {
            key: 'codice_fiscale',
            label: { type: 'custom', custom: 'Codice Fiscale / P.IVA (necessario per fattura)' },
            type: 'text',
          },
        ],
        metadata: { userId: user?.id || '', type: 'subscription' },
      });

      return res.status(200).json({ url: session.url });
    }

    if (type === 'course') {
      if (!courseSlug) {
        return res.status(400).json({ error: 'courseSlug obbligatorio per course' });
      }
      if (!user) {
        return res.status(401).json({ error: 'Devi essere loggato per acquistare un corso' });
      }

      const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
      if (!course) return res.status(404).json({ error: 'Corso non trovato' });

      const existingPurchase = await prisma.purchase.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      });
      if (existingPurchase) return res.status(409).json({ error: 'Corso già acquistato' });

      const session = await stripe.checkout.sessions.create({
        ...customerParam,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: course.title },
              unit_amount: course.priceEur,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/corso.html?id=${courseSlug}&purchased=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/corso.html?id=${courseSlug}`,
        locale: 'it',
        billing_address_collection: 'required',
        custom_fields: [
          {
            key: 'codice_fiscale',
            label: { type: 'custom', custom: 'Codice Fiscale / P.IVA (necessario per fattura)' },
            type: 'text',
          },
        ],
        metadata: { userId: user.id, courseId: course.id, courseSlug, type: 'course' },
      });

      return res.status(200).json({ url: session.url });
    }
  } catch (err) {
    console.error('[checkout] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}

module.exports = withAuth(handler);
