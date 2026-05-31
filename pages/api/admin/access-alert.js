// pages/api/admin/access-alert.js
// Registra e notifica un tentativo di accesso al pannello admin da parte di un
// utente NON admin. Chiamato dal frontend (admin.html) quando il gate fallisce.
//
// NB: NON richiede di essere admin (lo chiama proprio chi admin non è). Usa withAuth
// per identificare l'utente loggato (se c'è). Invia una mail all'ADMIN_EMAIL.
// Throttle leggero per evitare spam: max 1 alert ogni 5 minuti per utente/IP.

const { withAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

// memoria volatile per il throttle (per istanza serverless; sufficiente come anti-spam base)
const _lastAlert = globalThis.__adminAlertCache || (globalThis.__adminAlertCache = {});

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  // Se per qualche motivo è l'admin, non fare nulla
  if (req.user && req.user.email === ADMIN_EMAIL) {
    return res.status(200).json({ ok: true, skipped: 'is-admin' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '—';
  const key = (req.user?.userId || ip) + '';
  const now = Date.now();
  if (_lastAlert[key] && now - _lastAlert[key] < 5 * 60 * 1000) {
    return res.status(200).json({ ok: true, throttled: true });
  }
  _lastAlert[key] = now;

  try {
    const { sendAdminAccessAlertEmail } = require('../../../lib/resend');
    await sendAdminAccessAlertEmail(ADMIN_EMAIL, {
      email: req.user?.email || null,
      userId: req.user?.userId || null,
      ip,
    });
  } catch (e) {
    console.error('[access-alert] email:', e.message);
  }
  // Risposta generica: il client mostra comunque "accesso non autorizzato"
  return res.status(200).json({ ok: true });
});
