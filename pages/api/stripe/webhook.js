const { prisma } = require('../../../lib/prisma');
const { stripe } = require('../../../lib/stripe');
const { sendSubscriptionEmail, sendCoursePurchaseEmail } = require('../../../lib/resend');

// Mappa tutti e 6 i Price ID Stripe al nome del piano interno
function getPlanFromPriceId(priceId) {
  const map = {
    [process.env.STRIPE_PRICE_CULTURA_MONTHLY]:    'cultura_monthly',
    [process.env.STRIPE_PRICE_CULTURA_ANNUAL]:     'cultura_annual',
    [process.env.STRIPE_PRICE_LINGUAE_MONTHLY]:    'linguae_monthly',
    [process.env.STRIPE_PRICE_LINGUAE_ANNUAL]:     'linguae_annual',
    [process.env.STRIPE_PRICE_ACCADEMIA_MONTHLY]:  'accademia_monthly',
    [process.env.STRIPE_PRICE_ACCADEMIA_ANNUAL]:   'accademia_annual',
  };
  return map[priceId] || null;
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Leggi body raw
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  // Verifica firma Stripe
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, type, courseId, courseSlug } = session.metadata;

        if (type === 'subscription') {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const priceId = sub.items.data[0].price.id;
          const plan = getPlanFromPriceId(priceId) || 'linguae_monthly';

          await prisma.subscription.upsert({
            where: { stripeSubId: sub.id },
            create: {
              userId,
              stripeSubId: sub.id,
              stripePriceId: priceId,
              plan,
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
            update: {
              userId,
              stripePriceId: priceId,
              plan,
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          });

          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            await sendSubscriptionEmail(user, plan);
          }
        }

        if (type === 'course') {
          await prisma.purchase.upsert({
            where: { userId_courseId: { userId, courseId } },
            create: {
              userId,
              courseId,
              stripePaymentId: session.payment_intent,
              amountEur: session.amount_total,
            },
            update: {
              stripePaymentId: session.payment_intent,
              amountEur: session.amount_total,
            },
          });

          const user = await prisma.user.findUnique({ where: { id: userId } });
          const course = await prisma.course.findUnique({ where: { id: courseId } });
          if (user && course) {
            await sendCoursePurchaseEmail(user, course);
          }
        }

        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;

        const existing = await prisma.subscription.findUnique({
          where: { stripeSubId: sub.id },
        });

        if (existing) {
          await prisma.subscription.update({
            where: { stripeSubId: sub.id },
            data: {
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;

        await prisma.subscription.update({
          where: { stripeSubId: sub.id },
          data: { status: 'canceled' },
        });

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;

        await prisma.subscription.update({
          where: { stripeSubId: invoice.subscription },
          data: { status: 'past_due' },
        });

        break;
      }

      default:
        // Evento non gestito — va bene, Stripe invia molti eventi
        break;
    }
  } catch (err) {
    // Log dell'errore ma si risponde comunque 200 per evitare che Stripe riprovi
    console.error('[webhook] Errore nella gestione dell\'evento:', event.type, err);
  }

  return res.status(200).json({ received: true });
}

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
