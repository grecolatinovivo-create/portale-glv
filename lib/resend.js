// lib/resend.js — Email transazionali via Resend
//
// REGOLA EMAIL (valida per TUTTE le email):
//   - SFONDO CHIARO + TESTO SCURO. Mai testo grigio chiaro su scuro: molti client
//     (Gmail/Outlook) mostrano sfondo bianco e il testo diventa illeggibile.
//   - Si usa SEMPRE il layout `emailLayout()` qui sotto. Non scrivere stili di
//     colore inline custom nei corpi: usa i componenti (emailBtn, emailBox).
//   - I client in dark mode invertono da soli un layout chiaro ben fatto.

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');
const FROM   = process.env.RESEND_FROM_EMAIL || 'noreply@grecolatinovivo.it';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://portale.grecolatinovivo.it';

// ── Palette email (chiara, alto contrasto) ───────────────────────────────
const C = {
  bordeaux: '#a01a36',
  gold:     '#9a7b1f',   // oro scuro: leggibile anche su bianco (non il gold chiaro)
  text:     '#1a1a1a',   // testo principale
  textSoft: '#444444',   // testo secondario (contrasto ok su bianco)
  muted:    '#777777',   // footer
  bg:       '#ffffff',   // sfondo contenuto
  page:     '#f4f1ea',   // sfondo pagina (crema chiaro)
  boxBg:    '#f6f3ee',   // box interno
  border:   '#e3ddd2',
};

/**
 * Layout email unico, chiaro e leggibile ovunque.
 * @param {object} o
 * @param {string} o.title    - titolo (h2)
 * @param {string} o.body     - HTML del corpo (paragrafi, box, bottoni)
 * @param {string} [o.preheader] - testo nascosto di anteprima inbox
 */
function emailLayout({ title = '', body = '', preheader = '' }) {
  return `<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${C.page};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.bg};border:1px solid ${C.border};border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 40px 0;">
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${C.bordeaux};margin:0;">GrecoLatinoVivo</p>
          <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.muted};margin:4px 0 0;letter-spacing:.04em;">Centro Nazionale di Studi Classici</p>
        </td></tr>
        <tr><td style="padding:24px 40px 8px;">
          ${title ? `<h2 style="font-family:Arial,sans-serif;font-size:21px;font-weight:700;color:${C.text};margin:0 0 16px;line-height:1.3;">${title}</h2>` : ''}
          ${body}
        </td></tr>
        <tr><td style="padding:24px 40px 32px;border-top:1px solid ${C.border};">
          <p style="font-family:Arial,sans-serif;font-size:11px;color:${C.muted};margin:16px 0 0;line-height:1.6;">
            GrecoLatinoVivo · Centro Nazionale di Studi Classici · Firenze<br>
            Assistenza: <a href="mailto:supporto@grecolatinovivo.it" style="color:${C.bordeaux};">supporto@grecolatinovivo.it</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Paragrafo standard (testo scuro leggibile)
function emailP(html, soft = true) {
  return `<p style="font-family:Arial,sans-serif;font-size:15px;color:${soft ? C.textSoft : C.text};line-height:1.7;margin:0 0 16px;">${html}</p>`;
}
// Bottone CTA (sfondo bordeaux, testo bianco — contrasto pieno)
function emailBtn(label, href) {
  return `<a href="${href}" style="display:inline-block;background:${C.bordeaux};color:#ffffff;padding:13px 30px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin:6px 0 18px;">${label}</a>`;
}
// Box evidenziato (sfondo crema chiaro, testo scuro)
function emailBox(innerHtml) {
  return `<div style="background:${C.boxBg};border:1px solid ${C.border};border-radius:8px;padding:18px 20px;margin:0 0 22px;">${innerHtml}</div>`;
}
// Etichetta piccola + valore (per box credenziali/codici)
function emailField(label, value, mono = false) {
  return `<p style="font-family:Arial,sans-serif;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px;">${label}</p>`
       + `<p style="font-family:${mono ? "'Courier New',monospace" : 'Arial,sans-serif'};font-size:${mono ? '17px' : '15px'};font-weight:${mono ? '700' : '400'};color:${C.text};margin:0 0 14px;${mono ? 'letter-spacing:1px;' : ''}">${value}</p>`;
}

function fmtDateTimeIt(d) {
  try { return new Date(d).toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short' }); }
  catch { return String(d); }
}

// ─────────────────────────────────────────────────────────────────────────
//  PIANI (price ID + etichette)
// ─────────────────────────────────────────────────────────────────────────
const PLANS = {
  'cultura-mensile':   { label: 'Cultura Mensile',   price: '€5,90/mese',   envKey: 'STRIPE_PRICE_CULTURA_MONTHLY'   },
  'cultura-annuale':   { label: 'Cultura Annuale',   price: '€49/anno',     envKey: 'STRIPE_PRICE_CULTURA_ANNUAL'    },
  'linguae-mensile':   { label: 'Linguae Mensile',   price: '€12,90/mese',  envKey: 'STRIPE_PRICE_LINGUAE_MONTHLY'   },
  'linguae-annuale':   { label: 'Linguae Annuale',   price: '€99/anno',     envKey: 'STRIPE_PRICE_LINGUAE_ANNUAL'    },
  'accademia-mensile': { label: 'Accademia Mensile', price: '€19,90/mese',  envKey: 'STRIPE_PRICE_ACCADEMIA_MONTHLY' },
  'accademia-annuale': { label: 'Accademia Annuale', price: '€199/anno',    envKey: 'STRIPE_PRICE_ACCADEMIA_ANNUAL'  },
};
function getPriceId(planId) {
  const plan = PLANS[planId];
  if (!plan) throw new Error(`Piano sconosciuto: ${planId}`);
  return process.env[plan.envKey];
}

// ─────────────────────────────────────────────────────────────────────────
//  EMAIL
// ─────────────────────────────────────────────────────────────────────────

async function sendWelcomeEmail(user) {
  return resend.emails.send({
    from: FROM, to: user.email,
    subject: `Benvenuto nel Portale GLV, ${user.fullName || 'studente'}!`,
    html: emailLayout({
      title: `Benvenuto, ${user.fullName || 'studente'}!`,
      preheader: 'Il tuo account è pronto.',
      body: emailP('Il tuo account è stato creato con successo. Puoi ora accedere al portale e iniziare il tuo percorso nelle lingue classiche.')
          + emailBtn('Vai al Portale →', `${APP_URL}/`),
    }),
  });
}

async function sendWelcomeWithCredentialsEmail(user, planId, tempPassword) {
  const plan = PLANS[planId];
  const planLabel = plan ? `${plan.label} — ${plan.price}` : planId;
  return resend.emails.send({
    from: FROM, to: user.email,
    subject: 'Il tuo accesso al Portale GLV è pronto!',
    html: emailLayout({
      title: 'Il tuo abbonamento è attivo!',
      preheader: 'Ecco le tue credenziali di accesso.',
      body: emailP(`Grazie per esserti abbonato a <strong style="color:${C.text};">${planLabel}</strong>.`)
          + emailP('Abbiamo creato automaticamente un account per te. Ecco le tue credenziali di accesso:')
          + emailBox(emailField('Email', user.email) + emailField('Password temporanea', tempPassword, true))
          + emailP('<strong>Importante:</strong> dopo il primo accesso ti consigliamo di cambiare la password dalle impostazioni del profilo.')
          + emailBtn('Accedi al Portale →', `${APP_URL}/`),
    }),
  });
}

async function sendSubscriptionEmail(user, planId) {
  const plan = PLANS[planId] || PLANS['linguae-mensile'];
  const planLabel = `${plan.label} — ${plan.price}`;
  return resend.emails.send({
    from: FROM, to: user.email,
    subject: 'Abbonamento attivato — Portale GLV',
    html: emailLayout({
      title: 'Il tuo abbonamento è attivo!',
      body: emailP(`Piano: <strong style="color:${C.text};">${planLabel}</strong>.`)
          + emailP('Hai ora accesso al catalogo incluso nel tuo piano. Buono studio!')
          + emailBtn('Inizia a studiare →', `${APP_URL}/`),
    }),
  });
}

async function sendCoursePurchaseEmail(user, course) {
  return resend.emails.send({
    from: FROM, to: user.email,
    subject: `Acquisto confermato: ${course.title}`,
    html: emailLayout({
      title: 'Acquisto confermato!',
      body: emailP(`Il corso <strong style="color:${C.text};">${course.title}</strong> è ora disponibile nel tuo account. Accesso a vita incluso.`)
          + emailBtn('Vai al corso →', `${APP_URL}/dashboard.html?corso=${course.slug}`),
    }),
  });
}

async function sendCertificateEmail(user, course, certCode) {
  const downloadUrl = `${APP_URL}/api/progress/certificate/${course.slug}`;
  const verifyUrl   = `${APP_URL}/verifica/${certCode}`;
  return resend.emails.send({
    from: FROM, to: user.email,
    subject: `Il tuo attestato è pronto — ${course.title}`,
    html: emailLayout({
      title: `Complimenti, ${user.fullName || 'studente'}!`,
      preheader: 'Il tuo attestato è disponibile.',
      body: emailP('Hai completato con successo il corso:')
          + `<p style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:${C.bordeaux};margin:0 0 20px;">${course.title}</p>`
          + emailP("Il tuo attestato è stato emesso ed è disponibile per il download dalla tua area profilo.")
          + emailBtn("Scarica l'attestato →", downloadUrl)
          + emailBox(emailField('Codice attestato', certCode, true)
              + `<p style="font-family:Arial,sans-serif;font-size:12px;color:${C.muted};margin:0;">Verifica l'autenticità su <a href="${verifyUrl}" style="color:${C.bordeaux};">${verifyUrl}</a></p>`),
    }),
  });
}

async function sendSetPasswordEmail(user, planId, token) {
  const plan = PLANS[planId];
  const planLabel = plan ? `${plan.label} — ${plan.price}` : null;
  const setUrl = `${APP_URL}/set-password.html?token=${token}`;
  return resend.emails.send({
    from: FROM, to: user.email,
    subject: 'Imposta la tua password — Portale GLV',
    html: emailLayout({
      title: 'Il tuo abbonamento è attivo!',
      preheader: 'Imposta la password per accedere.',
      body: (planLabel ? emailP(`Grazie per esserti abbonato a <strong style="color:${C.text};">${planLabel}</strong>.`) : '')
          + emailP(`Abbiamo creato un account per te con l'email <strong style="color:${C.text};">${user.email}</strong>. Clicca il pulsante qui sotto per scegliere la tua password.`)
          + emailBtn('Imposta la password →', setUrl)
          + emailBox(emailField('Link di accesso (valido 48 ore)', `<a href="${setUrl}" style="color:${C.bordeaux};word-break:break-all;">${setUrl}</a>`))
          + emailP('Se il link scade, puoi richiederne uno nuovo dalla pagina di accesso.'),
    }),
  });
}

async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${APP_URL}/set-password.html?token=${token}`;
  return resend.emails.send({
    from: FROM, to: user.email,
    subject: 'Reimposta la tua password — Portale GLV',
    html: emailLayout({
      title: 'Reimposta la tua password',
      preheader: 'Richiesta di reimpostazione password.',
      body: emailP(`Abbiamo ricevuto una richiesta di reimpostazione della password per l'account <strong style="color:${C.text};">${user.email}</strong>.`)
          + emailP('Clicca il pulsante qui sotto per scegliere una nuova password. Il link è valido per 48 ore.')
          + emailBtn('Reimposta la password →', resetUrl)
          + emailBox(emailField('Link (valido 48 ore)', `<a href="${resetUrl}" style="color:${C.bordeaux};word-break:break-all;">${resetUrl}</a>`))
          + emailP('<strong>Non hai richiesto tu questa modifica?</strong> Ignora questa email: la tua password resta invariata.'),
    }),
  });
}

async function sendAdminAccessAlertEmail(adminEmail, attempt) {
  const when = new Date().toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'medium' });
  return resend.emails.send({
    from: FROM, to: adminEmail,
    subject: 'Tentativo di accesso al pannello admin',
    html: emailLayout({
      title: 'Tentativo di accesso non autorizzato al pannello admin',
      body: emailBox(
          emailField('Utente', attempt.email || 'non autenticato')
        + emailField('ID utente', attempt.userId || '—')
        + emailField('Quando', when)
        + emailField('IP', attempt.ip || '—'))
        + emailP("Se sei stato tu, ignora questa email. L'accesso è stato comunque bloccato."),
    }),
  });
}

async function sendExamBookingEmail(user, session) {
  return resend.emails.send({
    from: FROM, to: user.email,
    subject: `Prenotazione confermata — ${session.title}`,
    html: emailLayout({
      title: 'Prenotazione confermata',
      body: emailP(`Ciao ${user.fullName || 'studente'}, la tua prenotazione all'esame di certificazione è confermata.`)
          + emailBox(`<p style="font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:${C.text};margin:0 0 8px;">${session.title}</p>`
              + `<p style="font-family:Arial,sans-serif;color:${C.bordeaux};margin:0 0 4px;">${fmtDateTimeIt(session.examDate)}</p>`
              + `<p style="font-family:Arial,sans-serif;color:${C.textSoft};margin:0;">${session.location || 'Online'}</p>`)
          + emailBtn('Vai al Portale →', `${APP_URL}/dashboard.html`),
    }),
  });
}

async function sendLiveBookingEmail(user, session) {
  return resend.emails.send({
    from: FROM, to: user.email,
    subject: `Prenotazione confermata — ${session.title}`,
    html: emailLayout({
      title: 'Sei prenotato alla live',
      body: emailP(`Ciao ${user.fullName || 'studente'}, ecco i dettagli della diretta. Riceverai un promemoria 24 ore e 2 ore prima. Il link per partecipare si attiva 1 ora prima dell'inizio.`)
          + emailBox(`<p style="font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:${C.text};margin:0 0 8px;">${session.title}</p>`
              + `<p style="font-family:Arial,sans-serif;color:${C.bordeaux};margin:0;">${fmtDateTimeIt(session.startAt)}</p>`)
          + emailBtn('Vai al Portale →', `${APP_URL}/dashboard.html`),
    }),
  });
}

async function sendLiveReminderEmail(user, session, when) {
  return resend.emails.send({
    from: FROM, to: user.email,
    subject: `Tra ${when}: ${session.title}`,
    html: emailLayout({
      title: `La live inizia tra ${when}`,
      body: emailBox(`<p style="font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:${C.text};margin:0 0 8px;">${session.title}</p>`
              + `<p style="font-family:Arial,sans-serif;color:${C.bordeaux};margin:0;">${fmtDateTimeIt(session.startAt)}</p>`)
          + emailP('Il pulsante per partecipare si attiva 1 ora prima dell\'inizio, nella tua area Live del portale.')
          + emailBtn('Vai al Portale →', `${APP_URL}/dashboard.html`),
    }),
  });
}

async function sendClassStudentConfirmEmail(studentEmail, studentName, className, confirmUrl) {
  return resend.emails.send({
    from: FROM, to: studentEmail,
    subject: `Conferma la tua iscrizione alla classe "${className}"`,
    html: emailLayout({
      title: 'Conferma iscrizione',
      body: emailP(`Ciao ${studentName || ''}, sei stato iscritto alla classe <strong style="color:${C.text};">${className}</strong>. Conferma il tuo indirizzo email per accedere ai test assegnati.`)
          + emailBtn('Conferma email →', confirmUrl),
    }),
  });
}

module.exports = { resend, PLANS, getPriceId, sendWelcomeEmail, sendWelcomeWithCredentialsEmail, sendSetPasswordEmail, sendSubscriptionEmail, sendCoursePurchaseEmail, sendCertificateEmail, sendExamBookingEmail, sendLiveBookingEmail, sendLiveReminderEmail, sendClassStudentConfirmEmail, sendPasswordResetEmail, sendAdminAccessAlertEmail };
