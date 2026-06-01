// pages/api/early-access-request.js
// Step 1: valida email, genera codice 6 cifre, invia via Resend, restituisce token firmato

const { Resend } = require('resend');
const crypto     = require('crypto');

const resend   = new Resend(process.env.RESEND_API_KEY);
const FROM     = process.env.RESEND_FROM_EMAIL || 'noreply@grecolatinovivo.it';
const SECRET   = process.env.NEXTAUTH_SECRET   || process.env.JWT_SECRET || 'glv-secret-fallback';
const TTL_MS   = 15 * 60 * 1000; // 15 minuti

function signToken(payload) {
  const data = JSON.stringify(payload);
  const sig  = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ data, sig })).toString('base64url');
}

export default async function handler(req, res) {
  const origin  = req.headers.origin || '';
  const allowed = ['https://grecolatinovivo.it', 'https://portale.grecolatinovivo.it'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Metodo non consentito' });

  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email non valida' });
  }

  // Genera codice a 6 cifre
  const code    = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + TTL_MS;

  // Crea token firmato {email, code, expires}
  const token = signToken({ email, code, expires });

  try {
    // Invia codice via email
    await resend.emails.send({
      from: FROM,
      to:   email,
      subject: `${code} — Il tuo codice GrecoLatinoVivo`,
      html: `<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:#f4f1ea;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border:1px solid #e3ddd2;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 40px 0;">
          <p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#a01a36;margin:0;">GrecoLatinoVivo</p>
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#777;margin:4px 0 0;letter-spacing:.04em;">Centro Nazionale di Studi Classici</p>
        </td></tr>
        <tr><td style="padding:24px 40px 8px;">
          <h2 style="font-family:Arial,sans-serif;font-size:21px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">Il tuo codice di verifica</h2>
          <p style="font-family:Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;margin:0 0 22px;">Inserisci questo codice nella pagina per confermare la tua email e riservare il posto.</p>
          <div style="background:#f6f3ee;border:1px solid #e3ddd2;border-radius:10px;padding:24px;text-align:center;margin:0 0 22px;">
            <span style="font-family:'Courier New',monospace;font-size:46px;font-weight:700;color:#a01a36;letter-spacing:.18em;line-height:1;">${code}</span>
          </div>
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#777;line-height:1.6;margin:0;">Il codice scade tra 15 minuti. Se non hai richiesto questo codice, ignora questa email.</p>
        </td></tr>
        <tr><td style="padding:24px 40px 32px;border-top:1px solid #e3ddd2;">
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#777;margin:16px 0 0;">GrecoLatinoVivo · Centro Nazionale di Studi Classici · Firenze</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    });

    return res.status(200).json({ token });

  } catch (err) {
    console.error('[early-access-request]', err);
    return res.status(500).json({ error: 'Errore nell\'invio dell\'email. Riprova.' });
  }
}
