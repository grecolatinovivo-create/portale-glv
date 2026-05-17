// /api/debug/checkout — diagnostica variabili d'ambiente
// Zero dipendenze esterne. DA ELIMINARE dopo i test.

function handler(req, res) {
  const check = (val) => {
    if (!val)                         return '❌ MANCANTE';
    if (val.includes('...'))          return '⚠️  PLACEHOLDER (valore non reale)';
    return '✅ presente';
  };

  const checkPrice = (val) => {
    if (!val)                         return '❌ MANCANTE';
    if (!val.startsWith('price_'))    return `⚠️  VALORE STRANO: "${val}" (deve iniziare con price_)`;
    return `✅ ${val}`;
  };

  const checkUrl = (val) => {
    if (!val)                         return '❌ MANCANTE';
    if (val.includes('www.grecolatinovivo')) return `⚠️  SBAGLIATO: punta al sito principale, deve essere https://portale.grecolatinovivo.it`;
    if (val.endsWith('/'))            return `⚠️  Ha uno slash finale: "${val}" — rimuovilo`;
    return `✅ ${val}`;
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
    RESEND_FROM_EMAIL:              process.env.RESEND_FROM_EMAIL || '❌ MANCANTE',
    NEXT_PUBLIC_APP_URL:            checkUrl(process.env.NEXT_PUBLIC_APP_URL),
  };

  const missing   = Object.entries(env).filter(([,v]) => v.startsWith('❌')).map(([k]) => k);
  const warnings  = Object.entries(env).filter(([,v]) => v.startsWith('⚠️')).map(([k,v]) => `${k}: ${v}`);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json({
    ok: missing.length === 0 && warnings.length === 0,
    variabili: env,
    mancanti: missing,
    attenzione: warnings,
    conclusione: missing.length > 0
      ? `🔧 Aggiungi le ${missing.length} variabili mancanti su Vercel → Settings → Environment Variables → poi Redeploy`
      : warnings.length > 0
        ? '⚠️ Tutte presenti ma alcune sembrano sbagliate — leggi "attenzione"'
        : '✅ Tutto configurato correttamente',
  });
}

module.exports = handler;
