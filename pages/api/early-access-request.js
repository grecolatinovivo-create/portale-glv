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
      subject: `Il tuo codice di accesso — GrecoLatinoVivo`,
      html: `
        <div style="font-family:'Inter',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:40px;border-radius:12px;">
          <p style="font-family:'Georgia',serif;font-size:12px;font-weight:700;color:rgba(245,245,245,0.4);letter-spacing:0.15em;text-transform:uppercase;margin:0 0 24px;">GrecoLatinoVivo</p>
          <h1 style="font-family:'Georgia',serif;font-size:24px;font-weight:700;color:#f5f5f5;margin:0 0 12px;">Il tuo codice di verifica</h1>
          <p style="font-size:13px;color:rgba(245,245,245,0.6);line-height:1.6;margin:0 0 28px;">
            Inserisci questo codice nella pagina per confermare la tua email e riservare il posto.
          </p>
          <div style="background:rgba(201,150,42,0.1);border:1px solid rgba(201,150,42,0.35);border-radius:10px;padding:20px 28px;text-align:center;margin-bottom:28px;">
            <span style="font-family:'Georgia',serif;font-size:38px;font-weight:700;color:#e8c875;letter-spacing:0.18em;">${code}</span>
          </div>
          <p style="font-size:11px;color:rgba(245,245,245,0.3);line-height:1.6;margin:0;">
            Il codice scade tra 15 minuti. Se non hai richiesto questo codice, ignora questa email.
          </p>
        </div>`,
    });

    return res.status(200).json({ token });

  } catch (err) {
    console.error('[early-access-request]', err);
    return res.status(500).json({ error: 'Errore nell\'invio dell\'email. Riprova.' });
  }
}
