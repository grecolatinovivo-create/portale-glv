// pages/api/stripe/webhook.js — Gestione webhook Stripe
// IMPORTANTE: bodyParser disabilitato per leggere il raw body (necessario per verifica firma)

const { prisma } = require('../../../lib/prisma');
const { stripe } = require('../../../lib/stripe');
const { sendSubscriptionEmail } = require('../../../lib/resend');

// Disabilita il bodyParser di Next.js per ottenere il raw body
module.exports.config = { api: { bodyParser: false } };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  // Leggi il raw body dall'evento Stripe
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const rawBody = Buffer.concat(chunks);

  // Verifica la firma del webhook Stripe
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Firma non valida:', err.message);
    return res.status(400).json({ error: `Firma webhook non valida: ${err.message}` });
  }

  // Gestione degli eventi Stripe
  try {
    switch (event.type) {

      // Checkout completato con successo
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, planId } = session.metadata || {};

        if (!userId || !planId) {
          console.warn('[webhook] checkout.session.completed: metadata userId o planId mancante');
          break;
        }

        // Recupera i dettagli della subscription da Stripe
        const sub = await stripe.subscriptions.retrieve(session.subscription);

        // Crea o aggiorna la Subscription nel database
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: sub.id },
          create: {
            userId,
            plan: planId,
            stripeSubscriptionId: sub.id,
            stripeCustomerId: sub.customer,
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
          update: {
            userId,
            plan: planId,
            stripeCustomerId: sub.customer,
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });

        // Invia email di conferma abbonamento
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          try {
            await sendSubscriptionEmail(user, planId);
          } catch (emailErr) {
            console.error('[webhook] Errore invio email abbonamento:', emailErr);
          }
        }

        break;
      }

      // Abbonamento aggiornato (rinnovo, cambio piano, ecc.)
      case 'customer.subscription.updated': {
        const sub = event.data.object;

        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });

        if (existing) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: sub.id },
            data: {
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          });
        } else {
          console.warn('[webhook] customer.subscription.updated: subscription non trovata nel DB:', sub.id);
        }

        break;
      }

      // Abbonamento cancellato
      case 'customer.subscription.deleted': {
        const sub = event.data.object;

        try {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: sub.id },
            data: { status: 'canceled' },
          });
        } catch (updateErr) {
          console.warn('[webhook] customer.subscription.deleted: subscription non trovata nel DB:', sub.id);
        }

        break;
      }

      // Pagamento fattura fallito
      case 'invoice.payment_failed': {
        const invoice = event.data.object;

        if (invoice.subscription) {
          try {
            await prisma.subscription.update({
              where: { stripeSubscriptionId: invoice.subscription },
              data: { status: 'past_due' },
            });
          } catch (updateErr) {
            console.warn('[webhook] invoice.payment_failed: subscription non trovata nel DB:', invoice.subscription);
          }
        }

        break;
      }

      // Tutti gli altri eventi Stripe non gestiti
      default:
        // Nessuna azione necessaria
        break;
    }
  } catch (err) {
    // Logga l'errore ma risponde 200 per evitare che Stripe riprovi l'invio
    console.error('[webhook] Errore nella gestione dell\'evento', event.type, ':', err);
  }

  // Risponde sempre 200 per confermare la ricezione del webhook
  return res.status(200).json({ received: true });
};
