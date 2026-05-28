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
      html: `
        <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:44px;border-radius:12px;">

          <p style="font-family:'Georgia',serif;font-size:12px;font-weight:700;color:rgba(245,245,245,0.4);letter-spacing:0.15em;text-transform:uppercase;margin:0 0 28px;">GrecoLatinoVivo</p>

          <h1 style="font-family:'Georgia',serif;font-size:24px;font-weight:700;color:#f5f5f5;margin:0 0 10px;line-height:1.2;">Gentile ${nomeCompleto},</h1>
          <p style="font-size:14px;color:rgba(245,245,245,0.65);line-height:1.7;margin:0 0 28px;">
            Di seguito trovi le istruzioni per completare l'iscrizione al piano <strong style="color:#e8c875;">Accademia Annuale</strong> (${IMPORTO}) tramite Carta del Docente.
          </p>

          <!-- Box istruzioni -->
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:28px 32px;margin-bottom:28px;">

            <p style="font-size:13px;font-weight:600;color:#f5f5f5;margin:0 0 16px;">Per effettuare il pagamento a conferma dell'iscrizione dovrai generare il buono pari all'importo del corso con la Carta Docente.</p>

            <p style="font-size:13px;color:rgba(245,245,245,0.75);margin:0 0 12px;">Ecco il percorso da seguire <strong style="color:#f5f5f5;">(attenzione a seguirlo pedissequamente, altrimenti non sarà valido!):</strong></p>

            <p style="font-size:13px;color:rgba(245,245,245,0.75);margin:0 0 8px;">Una volta effettuato il login nel portale del Ministero:</p>

            <ol style="padding-left:20px;margin:0 0 16px;">
              <li style="font-size:13px;color:rgba(245,245,245,0.85);padding:4px 0;"><strong style="color:#e8c875;">Formazione</strong></li>
              <li style="font-size:13px;color:rgba(245,245,245,0.85);padding:4px 0;"><strong style="color:#e8c875;">Enti accreditati/qualificati ai sensi della direttiva 170/2016</strong></li>
            </ol>

            <p style="font-size:13px;color:rgba(245,245,245,0.75);margin:0 0 20px;">A questo punto dovrai salvare in <strong style="color:#f5f5f5;">PDF il buono generato</strong>, che dovrai necessariamente inviarci via email.</p>

            <!-- Warning box -->
            <div style="background:rgba(160,26,54,0.15);border:1px solid rgba(160,26,54,0.4);border-radius:8px;padding:14px 18px;">
              <p style="font-size:12px;font-weight:700;color:#f08080;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">⚠️ Attenzione</p>
              <p style="font-size:13px;color:rgba(245,245,245,0.8);margin:0;line-height:1.6;">
                <strong style="color:#f5f5f5;">NON SELEZIONARE</strong> "Corsi riconosciuti ai sensi della direttiva 170/2016" perché <strong style="color:#f5f5f5;">non validabili dal nostro ente.</strong>
              </p>
            </div>
          </div>

          <!-- Importo e destinatario -->
          <div style="display:flex;gap:16px;margin-bottom:28px;">
            <div style="flex:1;background:rgba(201,150,42,0.08);border:1px solid rgba(201,150,42,0.3);border-radius:8px;padding:14px 18px;">
              <p style="font-size:11px;color:rgba(245,245,245,0.4);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Importo da generare</p>
              <p style="font-family:'Georgia',serif;font-size:22px;font-weight:700;color:#e8c875;margin:0;">${IMPORTO}</p>
            </div>
            <div style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:14px 18px;">
              <p style="font-size:11px;color:rgba(245,245,245,0.4);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Invia il PDF a</p>
              <p style="font-size:14px;font-weight:600;color:#f5f5f5;margin:0;">${REPLY_EMAIL}</p>
            </div>
          </div>

          <p style="font-size:13px;color:rgba(245,245,245,0.55);line-height:1.7;margin:0 0 8px;">
            Una volta ricevuto e validato il buono, attiveremo il tuo abbonamento entro 24 ore lavorative e riceverai un'email di conferma con le credenziali di accesso.
          </p>
          <p style="font-size:13px;color:rgba(245,245,245,0.55);line-height:1.7;margin:0 0 32px;">
            Per qualsiasi dubbio rispondi a questa email o scrivici a <a href="mailto:${REPLY_EMAIL}" style="color:#c9962a;">${REPLY_EMAIL}</a>.
          </p>

          <p style="font-size:10px;color:rgba(245,245,245,0.25);line-height:1.7;margin:0;">
            GrecoLatinoVivo · Centro Nazionale di Studi Classici · Firenze, 2015
          </p>
        </div>`,
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
