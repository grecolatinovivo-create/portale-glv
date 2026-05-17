// /api/debug/checkout — diagnostica variabili d'ambiente
// DA ELIMINARE dopo i test.

export default function handler(req, res) {
  const check = (val) => {
    if (!val) return 'MANCANTE';
    if (val.includes('...')) return 'PLACEHOLDER - valore non reale';
    return 'OK';
  };

  const checkPrice = (val) => {
    if (!val) return 'MANCANTE';
    if (!val.startsWith('price_')) return `STRANO: "${val}" (deve iniziare con price_)`;
    return `OK: ${val}`;
  };

  const checkUrl = (val) => {
    if (!val) return 'MANCANTE';
    if (val.includes('www.grecolatinovivo')) return `SBAGLIATO: punta al sito principale, deve essere https://portale.grecolatinovivo.it`;
    if (val.endsWith('/')) return `Ha uno slash finale (rimuovilo): "${val}"`;
    return `OK: ${val}`;
  };

  const env = {
    DATABASE_URL:                   check(process.env.DATABASE_URL),
    JWT_SECRET:                     check(process.env.JWT_SECRET),
    STRIPE_SECRET_KEY:              check(process.env.STRIPE_SECRET_KEY),
    STRIPE_WEBHOOK_SECRET:          check(process.env.STRIPE_WEBHOOK_SECRET),
    STRIPE_PRICE_CULTURA_MONTHLY:   checkPrice(process.env.STRIPE_PRICE_CULTURA_MONTHLY),
    STRIPE_PRICE_CULTURA_ANNUAL:    checkPrice(process.env.STRIPE_PRICE_CULTURA_ANNUAL),
    STRIPE_PRICE_LINGUAE_MONTHLY:   checkPrice(process.env.STRIPE_PRICE_LINGUAE_MONTHLY),
    STRIPE_PRICE_LINGUAE_ANNUAL:    checkPrice(process.env.STRIPE_PRICE_LINGUAE_ANNUAL),
    STRIPE_PRICE_ACCADEMIA_MONTHLY: checkPrice(process.env.STRIPE_PRICE_ACCADEMIA_MONTHLY),
    STRIPE_PRICE_ACCADEMIA_ANNUAL:  checkPrice(process.env.STRIPE_PRICE_ACCADEMIA_ANNUAL),
    RESEND_API_KEY:                 check(process.env.RESEND_API_KEY),
    RESEND_FROM_EMAIL:              process.env.RESEND_FROM_EMAIL || 'MANCANTE',
    NEXT_PUBLIC_APP_URL:            checkUrl(process.env.NEXT_PUBLIC_APP_URL),
  };

  const mancanti = Object.entries(env).filter(([, v]) => v === 'MANCANTE').map(([k]) => k);

  return res.status(200).json({ variabili: env, mancanti });
}
