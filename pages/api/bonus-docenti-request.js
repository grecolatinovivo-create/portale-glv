// pages/api/bonus-docenti-request.js
// Riceve i dati del docente, invia:
//   1. Email al docente con istruzioni per generare il buono Carta del Docente
//   2. Notifica all'admin con i dati del docente

const { Resend } = require('resend');

const resend       = new Resend(process.env.RESEND_API_KEY);
const FROM         = process.env.RESEND_FROM_EMAIL   || 'noreply@grecolatinovivo.it';
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL          || 'grecolatinovivo@gmail.com';
const IMPORTO      = '€199,00';
const REPLY_EMAIL  = 'info@grecolatinovivo.it';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  'https://portale.grecolatinovivo.it');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Metodo non consentito' });

  const { nome, cognome, email } = req.body || {};

  if (!nome?.trim() || !cognome?.trim()) {
    return res.status(400).json({ error: 'Nome e cognome sono obbligatori' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email non valida' });
  }

  const nomeCompleto = `${nome.trim()} ${cognome.trim()}`;

  try {
    // 1. Email istruzioni al docente
    await resend.emails.send({
      from:    FROM,
      to:      email,
      replyTo: REPLY_EMAIL,
      subject: `Istruzioni pagamento con Bonus Docenti — Portale GrecoLatinoVivo`,
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
          <h2 style="font-family:Arial,sans-serif;font-size:21px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">Gentile ${nomeCompleto},</h2>
          <p style="font-family:Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;margin:0 0 24px;">Di seguito trovi le istruzioni per completare l'iscrizione al piano <strong style="color:#1a1a1a;">Accademia Annuale</strong> (${IMPORTO}) tramite Carta del Docente.</p>

          <div style="background:#f6f3ee;border:1px solid #e3ddd2;border-radius:10px;padding:22px 24px;margin:0 0 24px;">
            <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 14px;">Per confermare l'iscrizione devi generare il buono pari all'importo del corso con la Carta del Docente.</p>
            <p style="font-family:Arial,sans-serif;font-size:14px;color:#444;margin:0 0 10px;">Percorso da seguire <strong style="color:#1a1a1a;">(attenzione a seguirlo esattamente, altrimenti non sarà valido):</strong></p>
            <p style="font-family:Arial,sans-serif;font-size:14px;color:#444;margin:0 0 6px;">Una volta effettuato il login nel portale del Ministero:</p>
            <ol style="padding-left:20px;margin:0 0 14px;">
              <li style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;padding:3px 0;"><strong>Formazione</strong></li>
              <li style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;padding:3px 0;"><strong>Enti accreditati/qualificati ai sensi della direttiva 170/2016</strong></li>
            </ol>
            <p style="font-family:Arial,sans-serif;font-size:14px;color:#444;margin:0 0 16px;">A questo punto salva in <strong style="color:#1a1a1a;">PDF il buono generato</strong>, che dovrai inviarci via email.</p>
            <div style="background:#fbe9ec;border:1px solid #e6b8c2;border-radius:8px;padding:14px 18px;">
              <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#a01a36;text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px;">Attenzione</p>
              <p style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;margin:0;line-height:1.6;"><strong>NON selezionare</strong> "Corsi riconosciuti ai sensi della direttiva 170/2016": non sono validabili dal nostro ente.</p>
            </div>
          </div>

          <div style="background:#f6f3ee;border:1px solid #e3ddd2;border-radius:8px;padding:16px 20px;margin:0 0 22px;">
            <p style="font-family:Arial,sans-serif;font-size:11px;color:#777;text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px;">Importo da generare</p>
            <p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#a01a36;margin:0 0 14px;">${IMPORTO}</p>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:#777;text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px;">Invia il PDF a</p>
            <p style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#1a1a1a;margin:0;">${REPLY_EMAIL}</p>
          </div>

          <p style="font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7;margin:0 0 8px;">Una volta ricevuto e validato il buono, attiveremo il tuo abbonamento entro 24 ore lavorative e riceverai un'email di conferma con le credenziali di accesso.</p>
          <p style="font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7;margin:0;">Per qualsiasi dubbio rispondi a questa email o scrivici a <a href="mailto:${REPLY_EMAIL}" style="color:#a01a36;">${REPLY_EMAIL}</a>.</p>
        </td></tr>
        <tr><td style="padding:24px 40px 32px;border-top:1px solid #e3ddd2;">
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#777;margin:16px 0 0;">GrecoLatinoVivo · Centro Nazionale di Studi Classici · Firenze</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    });

    // 2. Notifica admin
    await resend.emails.send({
      from:    FROM,
      to:      ADMIN_EMAIL,
      subject: `[Bonus Docenti] Nuova richiesta: ${nomeCompleto} — ${email}`,
      html: `
        <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#333;max-width:480px;">
          <p><strong>Nuova richiesta Bonus Docenti — Accademia Annuale</strong></p>
          <table style="border-collapse:collapse;width:100%;">
            <tr><td style="padding:6px 12px 6px 0;color:#666;">Nome</td><td style="padding:6px 0;font-weight:600;">${nomeCompleto}</td></tr>
            <tr><td style="padding:6px 12px 6px 0;color:#666;">Email</td><td style="padding:6px 0;font-weight:600;">${email}</td></tr>
            <tr><td style="padding:6px 12px 6px 0;color:#666;">Piano</td><td style="padding:6px 0;">Accademia Annuale — ${IMPORTO}</td></tr>
          </table>
          <p style="margin-top:16px;color:#666;font-size:13px;">
            Le istruzioni sono state inviate al docente. Quando ricevi il PDF del buono, validalo su Carta del Docente e attiva manualmente l'abbonamento.
          </p>
        </div>`,
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[bonus-docenti-request]', err);
    return res.status(500).json({ error: 'Errore nell\'invio dell\'email. Riprova.' });
  }
}
