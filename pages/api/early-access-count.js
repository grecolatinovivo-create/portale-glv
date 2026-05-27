// pages/api/early-access-count.js — Restituisce i posti rimasti per l'early access
// Legge il conteggio reale da Resend Audiences

const { Resend } = require('resend');

const resend      = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = process.env.RESEND_EARLY_ACCESS_AUDIENCE_ID;
const MAX_SPOTS   = 100;

export default async function handler(req, res) {
  // CORS — accetta richieste da entrambi i domini
  const origin = req.headers.origin || '';
  const allowed = ['https://grecolatinovivo.it', 'https://portale.grecolatinovivo.it'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' });

  // Se l'audience non è configurata, restituiamo un valore di default
  if (!AUDIENCE_ID) {
    return res.status(200).json({ remaining: MAX_SPOTS, total: MAX_SPOTS });
  }

  try {
    const { data } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
    const count     = data?.data?.length ?? 0;
    const remaining = Math.max(0, MAX_SPOTS - count);

    return res.status(200).json({ remaining, total: MAX_SPOTS, count });
  } catch (err) {
    console.error('[early-access-count]', err);
    // In caso di errore, non blocchiamo la pagina — mostriamo il max
    return res.status(200).json({ remaining: MAX_SPOTS, total: MAX_SPOTS });
  }
}
