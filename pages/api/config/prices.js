// Espone al frontend i 6 Price ID Stripe (sono pubblici per definizione)
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    cultura_monthly:   process.env.STRIPE_PRICE_CULTURA_MONTHLY   || '',
    cultura_annual:    process.env.STRIPE_PRICE_CULTURA_ANNUAL    || '',
    linguae_monthly:   process.env.STRIPE_PRICE_LINGUAE_MONTHLY   || '',
    linguae_annual:    process.env.STRIPE_PRICE_LINGUAE_ANNUAL    || '',
    accademia_monthly: process.env.STRIPE_PRICE_ACCADEMIA_MONTHLY || '',
    accademia_annual:  process.env.STRIPE_PRICE_ACCADEMIA_ANNUAL  || '',
  });
}

module.exports = handler;
