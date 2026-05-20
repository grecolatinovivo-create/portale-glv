// pages/api/stripe/webhook.js — Gestione webhook Stripe
// IMPORTANTE: bodyParser disabilitato per leggere il raw body (necessario per verifica firma)
//
// Flusso checkout.session.completed:
//  A) Utente loggato  → userId in metadata → trova utente, crea subscription, manda email abbonamento
//  B) Utente guest    → userId assente → legge email dalla sessione Stripe →
//                       trova o crea utente (con password inutilizzabile) → crea subscription →
//                       genera PasswordResetToken → manda email con link imposta-password (48h)

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { prisma } = require('../../../lib/prisma');
const { stripe } = require('../../../lib/stripe');
const {
  sendSubscriptionEmail,
  sendSetPasswordEmail,
} = require('../../../lib/resend');

// Disabilita il bodyParser di Next.js per ottenere il raw body
export const config = { api: { bodyParser: false } };

// ── Helper: trova o crea utente dalla email della sessione Stripe ──
// Ritorna { user, isNew } — isNew=true se l'account è stato appena creato
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
    // Utente già registrato — nessuna modifica alla password
    return { user: existing, isNew: false };
  }

  // Utente non esiste → crea con password inutilizzabile (hash di 32 byte casuali).
  // L'utente imposterà la propria password tramite il token inviato via email.
  const unusableHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      fullName: session.customer_details?.name || null,
      passwordHash: unusableHash,
    },
  });

  console.log(`[webhook] Nuovo utente creato automaticamente dal pagamento: ${normalizedEmail}`);
  return { user: newUser, isNew: true };
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

        // ── Email: utente guest → crea token set-password e manda link ──
        if (isNewUser) {
          try {
            // Token sicuro a 48 byte → 96 caratteri hex, unico
            const rawToken  = crypto.randomBytes(48).toString('hex');
            const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 ore

            await prisma.passwordResetToken.create({
              data: {
                userId:    resolvedUserId,
                token:     rawToken,
                expiresAt,
              },
            });

            await sendSetPasswordEmail(user, planId, rawToken);
            console.log(`[webhook] Email imposta-password inviata a: ${user.email}`);
          } catch (emailErr) {
            console.error('[webhook] Errore invio email imposta-password:', emailErr);
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
              status:            sub.status,
              cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
              currentPeriodEnd:  new Date(sub.current_period_end * 1000),
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
