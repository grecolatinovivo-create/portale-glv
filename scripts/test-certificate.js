// scripts/test-certificate.js
// Test produzione attestato con LOG step-by-step (per diagnosticare blocchi).
//
// USO:
//   node scripts/test-certificate.js <email> <slug>           → solo PDF in /tmp
//   node scripts/test-certificate.js <email> <slug> --email   → PDF + invio email
//   node scripts/test-certificate.js <email> <slug> --commit  → salva anche il record Certificate
//
// Esempio:
//   node scripts/test-certificate.js grecolatinovivo@gmail.com gr-b13 --email
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const [, , email, slug, ...flags] = process.argv;
const DO_EMAIL  = flags.includes('--email');
const DO_COMMIT = flags.includes('--commit');

function log(...a) { console.log('[test-cert]', ...a); }

if (!email || !slug) {
  console.error('Uso: node scripts/test-certificate.js <email> <slug> [--email] [--commit]');
  process.exit(1);
}

// Safety net: se qualcosa appende, dopo 30s usciamo dicendo dove eravamo.
let stage = 'avvio';
const watchdog = setTimeout(() => {
  console.error(`\n⏱  TIMEOUT 30s — bloccato nello stage: "${stage}".`);
  console.error('   (se è "connessione DB" → problema di rete/SSL verso Neon;');
  console.error('    se è "invio email" → problema con Resend)');
  process.exit(2);
}, 30000);

(async () => {
  log('ENV check:',
      'DATABASE_URL', !!process.env.DATABASE_URL,
      '| RESEND_API_KEY', !!process.env.RESEND_API_KEY,
      '| APP_URL', process.env.NEXT_PUBLIC_APP_URL || '(non impostato)');

  stage = 'connessione DB';
  log('Connessione al DB…');
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  log('✓ connesso');

  stage = 'lookup utente';
  const [user] = (await c.query('SELECT id, "fullName", email FROM "User" WHERE email=$1', [email])).rows;
  if (!user) { console.error('✗ Utente non trovato:', email); process.exit(1); }
  log('✓ utente:', user.fullName || user.email);

  stage = 'lookup corso';
  const [course] = (await c.query('SELECT id, slug, title, lang, level FROM "Course" WHERE slug=$1', [slug])).rows;
  if (!course) { console.error('✗ Corso non trovato:', slug); process.exit(1); }
  log('✓ corso:', course.title);

  stage = 'lookup/crea certCode';
  const { generateCertCode, generateCertificate } = require('../lib/certificate');
  let [cert] = (await c.query(
    'SELECT "certCode" FROM "Certificate" WHERE "userId"=$1 AND "courseId"=$2', [user.id, course.id])).rows;
  let certCode = cert?.certCode || generateCertCode();
  log('✓ certCode:', certCode, cert ? '(esistente)' : '(nuovo)');

  if (!cert && DO_COMMIT) {
    await c.query(
      'INSERT INTO "Certificate" (id, "certCode", "userId", "courseId") VALUES (gen_random_uuid()::text, $1, $2, $3)',
      [certCode, user.id, course.id]);
    log('✓ record Certificate salvato nel DB');
  }

  stage = 'generazione PDF';
  // Verifica che pdfkit e le sue dipendenze siano installate (in locale a volte
  // node_modules è incompleto → "Cannot find module 'es-object-atoms'" ecc.)
  try {
    require('pdfkit');
  } catch (depErr) {
    console.error('\n✗ Dipendenza PDF mancante/rotta:', depErr.message);
    console.error('  → Esegui:  rm -rf node_modules package-lock.json && npm install');
    console.error('  (in produzione su Vercel questo non accade: npm install è sempre pulito)');
    process.exit(3);
  }
  log('Genero PDF…');
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
  log('✓ PDF generato:', out, `(${(pdfBuffer.length/1024).toFixed(0)} KB)`);

  if (DO_EMAIL) {
    stage = 'invio email';
    log('Invio email via Resend…');
    const { sendCertificateEmail } = require('../lib/resend');
    await sendCertificateEmail(user, course, certCode);
    log('✓ email inviata a', email);
  }

  stage = 'chiusura';
  await c.end();
  clearTimeout(watchdog);
  log('✓ FATTO');
  process.exit(0);
})().catch(e => {
  clearTimeout(watchdog);
  console.error(`✗ ERRORE nello stage "${stage}":`, e.message);
  process.exit(1);
});
