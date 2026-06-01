// pages/api/early-access.js — Raccolta email early birds
// Salva il contatto su Resend Audiences e invia email di conferma

const { Resend } = require('resend');

const resend   = new Resend(process.env.RESEND_API_KEY);
const FROM     = process.env.RESEND_FROM_EMAIL || 'noreply@grecolatinovivo.it';
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://portale.grecolatinovivo.it';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

// ID dell'audience Resend per gli early birds
// Crea un'audience su resend.com/audiences e metti l'ID in RESEND_EARLY_ACCESS_AUDIENCE_ID
const AUDIENCE_ID = process.env.RESEND_EARLY_ACCESS_AUDIENCE_ID;

export default async function handler(req, res) {
  // CORS — accetta richieste da entrambi i domini
  const origin = req.headers.origin || '';
  const allowed = ['https://grecolatinovivo.it', 'https://portale.grecolatinovivo.it'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });

  const { email } = req.body || {};

  // Validazione base
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email non valida' });
  }

  try {
    // 1. Salva su Resend Audiences (se configurato)
    if (AUDIENCE_ID) {
      await resend.contacts.create({
        email,
        audienceId: AUDIENCE_ID,
        unsubscribed: false,
      });
    }

    // 2. Email di conferma all'utente
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Sei nella lista — Portale GrecoLatinoVivo',
      html: `<!DOCTYPE html>
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
          <h2 style="font-family:Arial,sans-serif;font-size:21px;font-weight:700;color:#1a1a1a;margin:0 0 16px;">Sei nella lista</h2>
          <p style="font-family:Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;margin:0 0 22px;">Grazie per esserti iscritto all'accesso anticipato al nuovo Portale GLV. Sarai tra i primi a essere avvisato quando apriamo le porte.</p>
          <div style="background:#f6f3ee;border:1px solid #e3ddd2;border-radius:8px;padding:16px 20px;margin:0 0 22px;">
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
</body></html>`,
    });

    // 3. Notifica a Giampiero
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `[Early Access] Nuova iscrizione: ${email}`,
      html: `<p style="font-family:Arial,sans-serif;font-size:14px;">Nuova iscrizione early access: <strong>${email}</strong></p>`,
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[early-access]', err);
    // Se l'email esiste già su Resend Audiences, non è un errore bloccante
    if (err?.statusCode === 422 || err?.message?.includes('already exists')) {
      return res.status(200).json({ ok: true });
    }
    return res.status(500).json({ error: 'Errore interno. Riprova.' });
  }
}
