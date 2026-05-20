// lib/resend.js — Email transazionali via Resend

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');
const FROM   = process.env.RESEND_FROM_EMAIL || 'noreply@grecolatinovivo.it';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://portale.grecolatinovivo.it';

async function sendWelcomeEmail(user) {
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Benvenuto nel Portale GLV, ${user.fullName || 'studente'}!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#fff;padding:40px;">
        <h1 style="color:#a01a36;font-size:24px;margin-bottom:8px;">GrecoLatinoVivo</h1>
        <p style="color:#b3b3b3;font-size:13px;margin-bottom:32px;">Centro Nazionale di Studi Classici</p>
        <h2 style="font-size:20px;margin-bottom:16px;">Benvenuto, ${user.fullName || 'studente'}!</h2>
        <p style="color:#b3b3b3;line-height:1.7;margin-bottom:24px;">
          Il tuo account è stato creato con successo. Puoi ora accedere al portale e iniziare il tuo percorso nelle lingue classiche.
        </p>
        <a href="${APP_URL}/" style="display:inline-block;background:#a01a36;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
          Vai al Portale →
        </a>
        <p style="color:#666;font-size:11px;margin-top:32px;">
          GrecoLatinoVivo · Centro Nazionale di Studi Classici
        </p>
      </div>`,
  });
}

/**
 * Email inviata a chi paga senza account preesistente.
 * Include la password temporanea e le istruzioni per accedere.
 */
async function sendWelcomeWithCredentialsEmail(user, planId, tempPassword) {
  const plan     = PLANS[planId];
  const planLabel = plan ? `${plan.label} — ${plan.price}` : planId;

  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: 'Il tuo accesso al Portale GLV è pronto!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#fff;padding:40px;">
        <h1 style="color:#a01a36;font-size:24px;margin-bottom:8px;">GrecoLatinoVivo</h1>
        <p style="color:#b3b3b3;font-size:13px;margin-bottom:32px;">Centro Nazionale di Studi Classici</p>

        <h2 style="font-size:20px;margin-bottom:16px;">Il tuo abbonamento è attivo!</h2>
        <p style="color:#b3b3b3;line-height:1.7;margin-bottom:8px;">
          Grazie per esserti abbonato a <strong style="color:#fff;">${planLabel}</strong>.
        </p>
        <p style="color:#b3b3b3;line-height:1.7;margin-bottom:24px;">
          Abbiamo creato automaticamente un account per te. Ecco le tue credenziali di accesso:
        </p>

        <div style="background:#1a1a1a;border-radius:8px;padding:20px;margin-bottom:28px;border:1px solid #333;">
          <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Email</p>
          <p style="font-size:15px;color:#fff;margin-bottom:16px;">${user.email}</p>
          <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Password temporanea</p>
          <p style="font-size:18px;font-weight:700;color:#c9a84c;letter-spacing:2px;font-family:monospace;">${tempPassword}</p>
        </div>

        <p style="color:#b3b3b3;font-size:13px;line-height:1.7;margin-bottom:24px;">
          ⚠️ <strong style="color:#fff;">Importante:</strong> dopo il primo accesso ti consigliamo di cambiare la password dalle impostazioni del profilo.
        </p>

        <a href="${APP_URL}/" style="display:inline-block;background:#a01a36;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
          Accedi al Portale →
        </a>

        <p style="color:#666;font-size:11px;margin-top:40px;">
          GrecoLatinoVivo · Centro Nazionale di Studi Classici<br>
          Per assistenza: <a href="mailto:supporto@grecolatinovivo.it" style="color:#c9a84c;">supporto@grecolatinovivo.it</a>
        </p>
      </div>`,
  });
}

// 6 piani distinti — ciascuno ha il suo Price ID Stripe e la sua etichetta.
// planId = una delle 6 chiavi qui sotto.
const PLANS = {
  'cultura-mensile':   { label: 'Cultura Mensile',   price: '€5,90/mese',   envKey: 'STRIPE_PRICE_CULTURA_MONTHLY'   },
  'cultura-annuale':   { label: 'Cultura Annuale',   price: '€49/anno',     envKey: 'STRIPE_PRICE_CULTURA_ANNUAL'    },
  'linguae-mensile':   { label: 'Linguae Mensile',   price: '€12,90/mese',  envKey: 'STRIPE_PRICE_LINGUAE_MONTHLY'   },
  'linguae-annuale':   { label: 'Linguae Annuale',   price: '€99/anno',     envKey: 'STRIPE_PRICE_LINGUAE_ANNUAL'    },
  'accademia-mensile': { label: 'Accademia Mensile', price: '€19,90/mese',  envKey: 'STRIPE_PRICE_ACCADEMIA_MONTHLY' },
  'accademia-annuale': { label: 'Accademia Annuale', price: '€179/anno',    envKey: 'STRIPE_PRICE_ACCADEMIA_ANNUAL'  },
};

// Ritorna il Price ID Stripe per un dato planId.
function getPriceId(planId) {
  const plan = PLANS[planId];
  if (!plan) throw new Error(`Piano sconosciuto: ${planId}`);
  return process.env[plan.envKey];
}

async function sendSubscriptionEmail(user, planId) {
  const plan = PLANS[planId] || PLANS['linguae-mensile'];
  const planLabel = `${plan.label} — ${plan.price}`;

  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: 'Abbonamento attivato — Portale GLV',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#fff;padding:40px;">
        <h1 style="color:#a01a36;font-size:24px;margin-bottom:32px;">GrecoLatinoVivo</h1>
        <h2 style="font-size:20px;margin-bottom:16px;">Il tuo abbonamento è attivo!</h2>
        <p style="color:#b3b3b3;line-height:1.7;margin-bottom:8px;">Piano: <strong style="color:#fff;">${planLabel}</strong></p>
        <p style="color:#b3b3b3;line-height:1.7;margin-bottom:24px;">
          Hai ora accesso illimitato a tutto il catalogo GLV. Buono studio!
        </p>
        <a href="${APP_URL}/" style="display:inline-block;background:#a01a36;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
          Inizia a studiare →
        </a>
      </div>`,
  });
}

async function sendCoursePurchaseEmail(user, course) {
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Acquisto confermato: ${course.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#fff;padding:40px;">
        <h1 style="color:#a01a36;font-size:24px;margin-bottom:32px;">GrecoLatinoVivo</h1>
        <h2 style="font-size:20px;margin-bottom:16px;">Acquisto confermato!</h2>
        <p style="color:#b3b3b3;line-height:1.7;margin-bottom:24px;">
          Il corso <strong style="color:#fff;">${course.title}</strong> è ora disponibile nel tuo account. Accesso a vita incluso.
        </p>
        <a href="${APP_URL}/corso.html?id=${course.slug}" style="display:inline-block;background:#a01a36;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
          Vai al corso →
        </a>
      </div>`,
  });
}


// Email automatica quando un attestato viene emesso
async function sendCertificateEmail(user, course, certCode) {
  const downloadUrl = `${APP_URL}/api/progress/certificate/${course.slug}`;
  const verifyUrl   = `${APP_URL}/verifica/${certCode}`;

  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `🏛 Il tuo attestato è pronto — ${course.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#fff;padding:40px;">
        <h1 style="color:#a01a36;font-size:24px;margin-bottom:8px;">GrecoLatinoVivo</h1>
        <p style="color:#b3b3b3;font-size:13px;margin-bottom:32px;">Centro Nazionale di Studi Classici</p>

        <h2 style="font-size:22px;margin-bottom:12px;">Complimenti, ${user.fullName || 'studente'}!</h2>
        <p style="color:#b3b3b3;line-height:1.7;margin-bottom:8px;">
          Hai completato con successo il corso:
        </p>
        <p style="font-size:18px;font-weight:700;color:#c9a84c;margin-bottom:24px;">${course.title}</p>
        <p style="color:#b3b3b3;line-height:1.7;margin-bottom:24px;">
          Il tuo attestato è stato emesso ed è disponibile per il download dalla tua area profilo.
        </p>

        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:32px;">
          <a href="${downloadUrl}" style="display:inline-block;background:#a01a36;color:#fff;padding:14px 28px;border-radius:4px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
            ⬇ Scarica l'attestato
          </a>
          <a href="${verifyUrl}" style="display:inline-block;background:transparent;color:#c9a84c;padding:14px 28px;border-radius:4px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;border:1px solid #c9a84c;">
            Verifica autenticità
          </a>
        </div>

        <div style="background:#1a1a1a;border-radius:6px;padding:16px;margin-bottom:24px;">
          <p style="font-size:11px;color:#666;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Codice attestato</p>
          <p style="font-size:15px;font-weight:700;color:#fff;letter-spacing:2px;">${certCode}</p>
          <p style="font-size:11px;color:#666;margin-top:4px;">
            Conserva questo codice per verificare l'autenticità del tuo attestato.
          </p>
        </div>

        <p style="color:#666;font-size:11px;margin-top:32px;">
          GrecoLatinoVivo · Centro Nazionale di Studi Classici
        </p>
      </div>`,
  });
}

/**
 * Email inviata a chi paga senza account preesistente.
 * Contiene un link per impostare la password (token valido 48 ore).
 * NON include la password in chiaro — il flusso è: link → /set-password.html?token=...
 */
async function sendSetPasswordEmail(user, planId, token) {
  const plan      = PLANS[planId];
  const planLabel = plan ? `${plan.label} — ${plan.price}` : planId;
  const setUrl    = `${APP_URL}/set-password.html?token=${token}`;

  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: 'Imposta la tua password — Portale GLV',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#fff;padding:40px;">
        <h1 style="color:#a01a36;font-size:24px;margin-bottom:8px;">GrecoLatinoVivo</h1>
        <p style="color:#b3b3b3;font-size:13px;margin-bottom:32px;">Centro Nazionale di Studi Classici</p>

        <h2 style="font-size:20px;margin-bottom:16px;">Il tuo abbonamento è attivo!</h2>
        <p style="color:#b3b3b3;line-height:1.7;margin-bottom:8px;">
          Grazie per esserti abbonato a <strong style="color:#fff;">${planLabel}</strong>.
        </p>
        <p style="color:#b3b3b3;line-height:1.7;margin-bottom:24px;">
          Abbiamo creato un account per te con l'email <strong style="color:#fff;">${user.email}</strong>.
          Clicca il pulsante qui sotto per scegliere la tua password e accedere al portale.
        </p>

        <a href="${setUrl}" style="display:inline-block;background:#a01a36;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;margin-bottom:28px;">
          Imposta la password →
        </a>

        <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #333;">
          <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Link di accesso (valido 48 ore)</p>
          <p style="font-size:12px;color:#c9a84c;word-break:break-all;font-family:monospace;">${setUrl}</p>
        </div>

        <p style="color:#b3b3b3;font-size:13px;line-height:1.7;margin-bottom:8px;">
          Se il link scade, puoi richiederne uno nuovo dalla pagina di accesso.
        </p>

        <p style="color:#666;font-size:11px;margin-top:40px;">
          GrecoLatinoVivo · Centro Nazionale di Studi Classici<br>
          Per assistenza: <a href="mailto:supporto@grecolatinovivo.it" style="color:#c9a84c;">supporto@grecolatinovivo.it</a>
        </p>
      </div>`,
  });
}

module.exports = { resend, PLANS, getPriceId, sendWelcomeEmail, sendWelcomeWithCredentialsEmail, sendSetPasswordEmail, sendSubscriptionEmail, sendCoursePurchaseEmail, sendCertificateEmail };
