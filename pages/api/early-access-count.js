// pages/api/early-access-count.js
// Restituisce lo stato dell'early access e della lista d'attesa.
// - Finché i 100 posti early access NON sono pieni: { mode:'early', remaining, total }
// - Quando sono pieni: { mode:'waitlist', waitlistCount } → il front mostra un
//   numero a INCREMENTO ("già N in lista d'attesa"), non un countdown.

const { Resend } = require('resend');

const resend           = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID       = process.env.RESEND_EARLY_ACCESS_AUDIENCE_ID;
const WAITLIST_AUDIENCE = process.env.RESEND_WAITLIST_AUDIENCE_ID;
const MAX_SPOTS         = 100;
// Numero di partenza mostrato per la lista d'attesa (chi era già in coda prima
// dell'attivazione del segmento). Al conteggio reale si somma questa base.
const WAITLIST_BASE     = parseInt(process.env.WAITLIST_BASE || '175', 10);

async function countAudience(id) {
  if (!id) return 0;
  const { data } = await resend.contacts.list({ audienceId: id });
  return data?.data?.length ?? 0;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://grecolatinovivo.it', 'https://portale.grecolatinovivo.it'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' });

  if (!AUDIENCE_ID) {
    return res.status(200).json({ mode: 'early', remaining: MAX_SPOTS, total: MAX_SPOTS });
  }

  try {
    const earlyCount = await countAudience(AUDIENCE_ID);
    const remaining  = Math.max(0, MAX_SPOTS - earlyCount);

    if (remaining > 0) {
      // Early access ancora aperto
      return res.status(200).json({ mode: 'early', remaining, total: MAX_SPOTS, count: earlyCount });
    }

    // Early access pieno → lista d'attesa (conteggio a incremento).
    // Mostriamo la base (chi era già in coda) + gli iscritti reali del segmento.
    const realWaitlist = await countAudience(WAITLIST_AUDIENCE);
    const waitlistCount = WAITLIST_BASE + realWaitlist;
    return res.status(200).json({ mode: 'waitlist', waitlistCount, total: MAX_SPOTS });
  } catch (err) {
    console.error('[early-access-count]', err);
    return res.status(200).json({ mode: 'early', remaining: MAX_SPOTS, total: MAX_SPOTS });
  }
}
