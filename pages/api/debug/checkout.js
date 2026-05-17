// /api/debug/checkout — mostra esattamente cosa manca per far funzionare il checkout
// DA ELIMINARE dopo aver verificato che tutto funziona.

async function handler(req, res) {
  const vars = {
    DATABASE_URL:                   process.env.DATABASE_URL,
    JWT_SECRET:                     process.env.JWT_SECRET,
    STRIPE_SECRET_KEY:              process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET:          process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_CULTURA_MONTHLY:   process.env.STRIPE_PRICE_CULTURA_MONTHLY,
    STRIPE_PRICE_CULTURA_ANNUAL:    process.env.STRIPE_PRICE_CULTURA_ANNUAL,
    STRIPE_PRICE_LINGUAE_MONTHLY:   process.env.STRIPE_PRICE_LINGUAE_MONTHLY,
    STRIPE_PRICE_LINGUAE_ANNUAL:    process.env.STRIPE_PRICE_LINGUAE_ANNUAL,
    STRIPE_PRICE_ACCADEMIA_MONTHLY: process.env.STRIPE_PRICE_ACCADEMIA_MONTHLY,
    STRIPE_PRICE_ACCADEMIA_ANNUAL:  process.env.STRIPE_PRICE_ACCADEMIA_ANNUAL,
    RESEND_API_KEY:                 process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL:              process.env.RESEND_FROM_EMAIL,
    NEXT_PUBLIC_APP_URL:            process.env.NEXT_PUBLIC_APP_URL,
  };

  // Per le chiavi segrete mostra solo i primi 8 caratteri, per non esporle
  const SENSITIVE = ['DATABASE_URL', 'JWT_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY'];

  const report = {};
  const missing = [];
  const wrong = [];

  for (const [name, value] of Object.entries(vars)) {
    if (!value) {
      report[name] = '❌ MANCANTE';
      missing.push(name);
    } else if (SENSITIVE.includes(name)) {
      report[name] = `✅ presente (${value.slice(0, 8)}...)`;
    } else {
      report[name] = `✅ ${value}`;
    }
  }

  // Controlli specifici
  const warnings = [];

  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    warnings.push('STRIPE_SECRET_KEY è in modalità TEST (sk_test_...) — ok per sviluppo, non per produzione');
  }
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') && !process.env.STRIPE_SECRET_KEY.includes('_live_')) {
    warnings.push('STRIPE_SECRET_KEY sembra un placeholder — inserisci la chiave reale da Stripe');
  }
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.includes('www.grecolatinovivo')) {
    wrong.push('NEXT_PUBLIC_APP_URL punta al sito principale, non al portale. Deve essere: https://portale.grecolatinovivo.it');
  }

  // Verifica Stripe connessa
  let stripeStatus = 'non testato';
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('...')) {
    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
      await stripe.products.list({ limit: 1 });
      stripeStatus = '✅ connessione Stripe OK';
    } catch (err) {
      stripeStatus = `❌ errore Stripe: ${err.message}`;
    }
  }

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    variabili: report,
    missing_count: missing.length,
    variabili_mancanti: missing,
    variabili_sbagliate: wrong,
    warnings,
    stripe: stripeStatus,
    istruzioni: missing.length === 0 && wrong.length === 0
      ? '✅ Tutto configurato. Se il checkout non funziona, il problema è in Stripe (price ID sbagliati o non esistenti).'
      : `🔧 Configura le variabili mancanti su Vercel → Settings → Environment Variables, poi fai Redeploy.`,
  });
}

module.exports = handler;
