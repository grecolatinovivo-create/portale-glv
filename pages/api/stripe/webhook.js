// pages/api/stripe/webhook.js — Gestione webhook Stripe
// IMPORTANTE: bodyParser disabilitato per leggere il raw body (necessario per verifica firma)
//
// Flusso checkout.session.completed:
//  A) Utente loggato  → userId in metadata → trova utente, crea subscription, manda email abbonamento
//  B) Utente guest    → userId assente → legge email dalla sessione Stripe →
//                       trova o crea utente → crea subscription →
//                       manda email con credenziali temporanee + conferma abbonamento

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { prisma } = require('../../../lib/prisma');
const { stripe } = require('../../../lib/stripe');
const {
  sendSubscriptionEmail,
  sendWelcomeWithCredentialsEmail,
} = require('../../../lib/resend');

// Disabilita il bodyParser di Next.js per ottenere il raw body
export const config = { api: { bodyParser: false } };

// ── Helper: genera password temporanea leggibile (12 caratteri) ──
function generateTempPassword() {
  // Usa solo caratteri non ambigui (no 0/O, 1/l/I)
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.randomBytes(12))
    .map(b => chars[b % chars.length])
    .join('');
}

// ── Helper: trova o crea utente dalla email della sessione Stripe ──
// Ritorna { user, isNew, tempPassword } — tempPassword è null se utente esisteva già
async function findOrCreateUserFromStripeSession(session) {
  const email =
    session.customer_email ||
    session.customer_details?.email ||
    null;

  if (!email) {
    console.warn('[webhook] Impossibile ricavare email dalla sessione Stripe:', session.id);
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Cerca utente esistente
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // Utente già registrato — non sovrascrive la password
    return { user: existing, isNew: false, tempPassword: null };
  }

  // Utente non esiste → crea con password temporanea
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      fullName: session.customer_details?.name || null,
      passwordHash,
    },
  });

  console.log(`[webhook] Nuovo utente creato automaticamente dal pagamento: ${normalizedEmail}`);
  return { user: newUser, isNew: true, tempPassword };
}

export default async function handler(req, res) {
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

      // ── Checkout completato con successo ────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, planId } = session.metadata || {};

        // planId è sempre presente (impostato da /api/stripe/checkout).
        // Se manca anche planId non possiamo fare nulla di utile.
        if (!planId) {
          console.warn('[webhook] checkout.session.completed: planId assente nei metadata, sessione:', session.id);
          break;
        }

        let resolvedUserId = userId || null;
        let isNewUser      = false;
        let tempPassword   = null;

        // ── Percorso B: utente guest — ricava/crea account dall'email ──
        if (!resolvedUserId) {
          const result = await findOrCreateUserFromStripeSession(session);
          if (!result) {
            // Senza email non possiamo creare nulla — logga e interrompi
            console.error('[webhook] Pagamento senza userId e senza email Stripe. Sessione:', session.id);
            break;
          }
          resolvedUserId = result.user.id;
          isNewUser      = result.isNew;
          tempPassword   = result.tempPassword;
        }

        // Recupera i dettagli della subscription da Stripe
        const sub = await stripe.subscriptions.retrieve(session.subscription);

        // Crea o aggiorna la Subscription nel database
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: sub.id },
          create: {
            userId:               resolvedUserId,
            plan:                 planId,
            stripeSubscriptionId: sub.id,
            stripeCustomerId:     sub.customer,
            status:               sub.status,
            currentPeriodEnd:     new Date(sub.current_period_end * 1000),
          },
          update: {
            userId:           resolvedUserId,
            plan:             planId,
            stripeCustomerId: sub.customer,
            status:           sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });

        // Recupera l'utente completo per le email
        const user = await prisma.user.findUnique({ where: { id: resolvedUserId } });
        if (!user) {
          console.error('[webhook] Utente non trovato dopo upsert subscription, userId:', resolvedUserId);
          break;
        }

        // ── Email: utente guest → benvenuto + credenziali + abbonamento ──
        if (isNewUser && tempPassword) {
          try {
            await sendWelcomeWithCredentialsEmail(user, planId, tempPassword);
            console.log(`[webhook] Email credenziali inviata a: ${user.email}`);
          } catch (emailErr) {
            console.error('[webhook] Errore invio email credenziali:', emailErr);
          }
        } else {
          // ── Email: utente già registrato → solo conferma abbonamento ──
          try {
            await sendSubscriptionEmail(user, planId);
            console.log(`[webhook] Email abbonamento inviata a: ${user.email}`);
          } catch (emailErr) {
            console.error('[webhook] Errore invio email abbonamento:', emailErr);
          }
        }

        break;
      }

      // ── Abbonamento aggiornato (rinnovo, cambio piano, ecc.) ────
      case 'customer.subscription.updated': {
        const sub = event.data.object;

        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });

        if (existing) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: sub.id },
            data: {
              status:          sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          });
        } else {
          console.warn('[webhook] customer.subscription.updated: subscription non trovata nel DB:', sub.id);
        }

        break;
      }

      // ── Abbonamento cancellato ───────────────────────────────────
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

      // ── Pagamento fattura fallito ────────────────────────────────
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

      // ── Tutti gli altri eventi Stripe non gestiti ────────────────
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
}
