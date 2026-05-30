// scripts/test-certificate.js
// Test di produzione attestato: genera il PDF per un corso e (opzionale) invia l'email.
//
// USO:
//   node scripts/test-certificate.js <emailUtente> <slugCorso>            → genera PDF di prova in /tmp
//   node scripts/test-certificate.js <emailUtente> <slugCorso> --email    → genera PDF + invia email Resend
//
// Esempio:
//   node scripts/test-certificate.js grecolatinovivo@gmail.com gr-b13 --email
//
// NB: NON crea un record Certificate "vero" se non vuoi — usa --commit per salvarlo nel DB.
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const [, , email, slug, ...flags] = process.argv;
const DO_EMAIL  = flags.includes('--email');
const DO_COMMIT = flags.includes('--commit');

if (!email || !slug) {
  console.error('Uso: node scripts/test-certificate.js <emailUtente> <slugCorso> [--email] [--commit]');
  process.exit(1);
}

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const [user] = (await c.query('SELECT id, "fullName", email FROM "User" WHERE email=$1', [email])).rows;
  if (!user) { console.error('Utente non trovato:', email); process.exit(1); }

  const [course] = (await c.query('SELECT id, slug, title, lang, level FROM "Course" WHERE slug=$1', [slug])).rows;
  if (!course) { console.error('Corso non trovato:', slug); process.exit(1); }

  // certCode: riusa esistente o genera di prova
  let [cert] = (await c.query(
    'SELECT "certCode" FROM "Certificate" WHERE "userId"=$1 AND "courseId"=$2', [user.id, course.id])).rows;

  const { generateCertCode, generateCertificate } = require('../lib/certificate');
  let certCode = cert?.certCode;
  if (!certCode) {
    certCode = generateCertCode();
    if (DO_COMMIT) {
      await c.query(
        'INSERT INTO "Certificate" (id, "certCode", "userId", "courseId") VALUES (gen_random_uuid()::text, $1, $2, $3)',
        [certCode, user.id, course.id]);
      console.log('Record Certificate creato nel DB.');
    } else {
      console.log('(prova: certCode generato ma NON salvato — usa --commit per salvarlo)');
    }
  }

  console.log('Genero PDF attestato…', { studente: user.fullName || user.email, corso: course.title, certCode });
  const pdfBuffer = await generateCertificate({
    studentName: user.fullName || user.email,
    courseTitle: course.title,
    courseLang:  course.lang,
    courseLevel: course.level,
    completedAt: new Date(),
    certCode,
  });

  const out = path.join('/tmp', `attestato_test_${slug}.pdf`);
  fs.writeFileSync(out, pdfBuffer);
  console.log('✓ PDF generato:', out, `(${(pdfBuffer.length/1024).toFixed(0)} KB)`);

  if (DO_EMAIL) {
    try {
      const { sendCertificateEmail } = require('../lib/resend');
      await sendCertificateEmail(user, course, certCode);
      console.log('✓ Email inviata a', email);
    } catch (e) {
      console.error('✗ Invio email fallito:', e.message);
    }
  } else {
    console.log('(email non inviata — aggiungi --email per inviarla)');
  }

  await c.end();
})().catch(e => { console.error('ERRORE:', e.message); process.exit(1); });
