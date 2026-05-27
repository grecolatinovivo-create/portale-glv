// pages/api/early-access-verify.js
// Step 2: verifica codice, salva email su Resend Audiences

const { Resend } = require('resend');
const crypto     = require('crypto');

const resend      = new Resend(process.env.RESEND_API_KEY);
const FROM        = process.env.RESEND_FROM_EMAIL || 'noreply@grecolatinovivo.it';
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || 'https://portale.grecolatinovivo.it';
const SECRET      = process.env.NEXTAUTH_SECRET   || process.env.JWT_SECRET || 'glv-secret-fallback';
const AUDIENCE_ID = process.env.RESEND_EARLY_ACCESS_AUDIENCE_ID;

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
    // Salva su Resend Audiences
    if (AUDIENCE_ID) {
      await resend.contacts.create({
        email,
        audienceId:   AUDIENCE_ID,
        unsubscribed: false,
      });
    }

    // Email di conferma
    await resend.emails.send({
      from: FROM,
      to:   email,
      subject: 'Sei nella lista — Portale GrecoLatinoVivo',
      html: `
        <div style="font-family:'Inter',Arial,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:40px;border-radius:12px;">
          <p style="font-family:'Georgia',serif;font-size:13px;font-weight:700;color:rgba(245,245,245,0.5);letter-spacing:0.15em;text-transform:uppercase;margin:0 0 24px;">GrecoLatinoVivo</p>
          <h1 style="font-family:'Georgia',serif;font-size:26px;font-weight:700;color:#f5f5f5;margin:0 0 16px;line-height:1.2;">Sei nella lista.</h1>
          <p style="font-size:14px;color:rgba(245,245,245,0.65);line-height:1.7;margin:0 0 24px;">
            Grazie per esserti iscritto all'accesso anticipato al nuovo Portale GLV.<br>
            Sarai tra i primi ad essere avvisato quando apriamo le porte.
          </p>
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px 20px;margin-bottom:28px;">
            <p style="font-size:11px;color:rgba(245,245,245,0.4);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px;">Piano in arrivo</p>
            <p style="font-size:13px;color:#f5f5f5;margin:0;">Latino · Greco Antico · Egiziano · Ebraico Biblico<br>
            <span style="color:#c9962a;">Un abbonamento per l'intero catalogo.</span></p>
          </div>
          <a href="${APP_URL}" style="display:inline-block;background:#c9962a;color:#0a0a0a;font-size:13px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">Scopri il portale →</a>
          <p style="font-size:10px;color:rgba(245,245,245,0.25);margin-top:32px;line-height:1.7;">
            GrecoLatinoVivo · Centro Nazionale di Studi Classici · Firenze, 2015<br>
            Per disiscriverti rispondi a questa email con oggetto "Rimuovi".
          </p>
        </div>`,
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[early-access-verify]', err);
    if (err?.statusCode === 422 || err?.message?.includes('already exists')) {
      return res.status(200).json({ ok: true });
    }
    return res.status(500).json({ error: 'Errore interno. Riprova.' });
  }
}
