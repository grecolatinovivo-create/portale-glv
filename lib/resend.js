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
        <a href="${APP_URL}/dashboard.html" style="display:inline-block;background:#a01a36;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
          Vai al Portale →
        </a>
        <p style="color:#666;font-size:11px;margin-top:32px;">
          GrecoLatinoVivo · Centro Nazionale di Studi Classici
        </p>
      </div>`,
  });
}

async function sendSubscriptionEmail(user, plan) {
  const planLabel = plan === 'annual' ? 'Annuale (€99/anno)' : 'Mensile (€12,90/mese)';
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
        <a href="${APP_URL}/dashboard.html" style="display:inline-block;background:#a01a36;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
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

module.exports = { resend, sendWelcomeEmail, sendSubscriptionEmail, sendCoursePurchaseEmail };
