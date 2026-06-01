// pages/api/early-access-verify.js
// Step 2: verifica codice, salva email su Resend Audiences

const { Resend } = require('resend');
const crypto     = require('crypto');

const resend      = new Resend(process.env.RESEND_API_KEY);
const FROM        = process.env.RESEND_FROM_EMAIL || 'noreply@grecolatinovivo.it';
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || 'https://portale.grecolatinovivo.it';
const SECRET      = process.env.NEXTAUTH_SECRET   || process.env.JWT_SECRET || 'glv-secret-fallback';
const AUDIENCE_ID = process.env.RESEND_EARLY_ACCESS_AUDIENCE_ID;
const WAITLIST_AUDIENCE = process.env.RESEND_WAITLIST_AUDIENCE_ID;
const MAX_SPOTS   = 100;
const WAITLIST_BASE = parseInt(process.env.WAITLIST_BASE || '175', 10);

function verifyToken(token) {
  try {
    const { data, sig } = JSON.parse(Buffer.from(token, 'base64url').toString());
    const expected = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
    if (sig !== expected) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const origin  = req.headers.origin || '';
  const allowed = ['https://grecolatinovivo.it', 'https://portale.grecolatinovivo.it'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Metodo non consentito' });

  const { token, code } = req.body || {};

  if (!token || !code) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }

  // Verifica token
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(400).json({ error: 'Token non valido' });
  }

  // Controlla scadenza
  if (Date.now() > payload.expires) {
    return res.status(400).json({ error: 'Codice scaduto. Richiedi un nuovo codice.' });
  }

  // Controlla codice
  if (String(code).trim() !== payload.code) {
    return res.status(400).json({ error: 'Codice errato. Riprova.' });
  }

  const { email } = payload;

  try {
    // Decide se l'iscritto va in EARLY ACCESS o in LISTA D'ATTESA.
    // Se i 100 posti early sono pieni → waitlist (audience separata).
    let isWaitlist = false;
    if (AUDIENCE_ID) {
      try {
        const { data } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
        const earlyCount = data?.data?.length ?? 0;
        isWaitlist = earlyCount >= MAX_SPOTS;
      } catch (_) { /* in dubbio, trattiamo come early */ }
    }

    const targetAudience = isWaitlist ? WAITLIST_AUDIENCE : AUDIENCE_ID;
    if (targetAudience) {
      await resend.contacts.create({
        email,
        audienceId:   targetAudience,
        unsubscribed: false,
      });
    }

    // Posizione in lista d'attesa = base + iscritti reali del segmento waitlist.
    let waitlistPosition = null;
    if (isWaitlist) {
      let realCount = 0;
      try {
        const { data } = await resend.contacts.list({ audienceId: WAITLIST_AUDIENCE });
        realCount = data?.data?.length ?? 0;
      } catch (_) { /* fallback sotto */ }
      // realCount include l'iscritto appena creato → la sua posizione è base + realCount
      waitlistPosition = WAITLIST_BASE + (realCount > 0 ? realCount : 1);
    }

    // Email di conferma — usa il layout CHIARO condiviso (leggibile ovunque).
    const subject = isWaitlist
      ? 'Sei in lista d\'attesa — Portale GrecoLatinoVivo'
      : 'Sei nella lista — Portale GrecoLatinoVivo';

    const posTxt = (isWaitlist && waitlistPosition)
      ? ` Sei il numero <strong>${waitlistPosition}</strong> in coda.` : '';
    const heading = isWaitlist ? 'Sei in lista d\'attesa' : 'Sei nella lista';
    const intro = isWaitlist
      ? `I 100 posti dell'accesso anticipato sono esauriti, ma ti abbiamo aggiunto alla lista d'attesa.${posTxt} Facciamo entrare un nuovo gruppo di utenti ogni giorno: ti avvisiamo appena è il tuo turno.`
      : `Grazie per esserti iscritto all'accesso anticipato al nuovo Portale GLV. Sarai tra i primi ad essere avvisato quando apriamo le porte.`;

    const html = `<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:#f4f1ea;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e3ddd2;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 40px 0;">
          <p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#a01a36;margin:0;">GrecoLatinoVivo</p>
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#777;margin:4px 0 0;letter-spacing:.04em;">Centro Nazionale di Studi Classici</p>
        </td></tr>
        <tr><td style="padding:24px 40px 8px;">
          <h2 style="font-family:Arial,sans-serif;font-size:21px;font-weight:700;color:#1a1a1a;margin:0 0 16px;line-height:1.3;">${heading}</h2>
          <p style="font-family:Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;margin:0 0 20px;">${intro}</p>
          <div style="background:#f6f3ee;border:1px solid #e3ddd2;border-radius:8px;padding:18px 20px;margin:0 0 22px;">
            <p style="font-family:Arial,sans-serif;font-size:11px;color:#777;text-transform:uppercase;letter-spacing:.08em;margin:0 0 6px;">Piano in arrivo</p>
            <p style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;margin:0;">Latino · Greco Antico · Egiziano · Ebraico Biblico<br>
            <span style="color:#9a7b1f;font-weight:700;">Un abbonamento per l'intero catalogo.</span></p>
          </div>
          <a href="${APP_URL}" style="display:inline-block;background:#a01a36;color:#ffffff;padding:13px 30px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;font-size:13px;letter-spacing:.06em;text-transform:uppercase;">Scopri il portale →</a>
        </td></tr>
        <tr><td style="padding:24px 40px 32px;border-top:1px solid #e3ddd2;">
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#777;margin:16px 0 0;line-height:1.6;">
            GrecoLatinoVivo · Centro Nazionale di Studi Classici · Firenze<br>
            Per disiscriverti rispondi a questa email con oggetto "Rimuovi".
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    await resend.emails.send({ from: FROM, to: email, subject, html });

    return res.status(200).json({ ok: true, waitlist: isWaitlist, waitlistPosition });

  } catch (err) {
    console.error('[early-access-verify]', err);
    if (err?.statusCode === 422 || err?.message?.includes('already exists')) {
      return res.status(200).json({ ok: true });
    }
    return res.status(500).json({ error: 'Errore interno. Riprova.' });
  }
}
