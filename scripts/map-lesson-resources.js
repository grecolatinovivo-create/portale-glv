/**
 * SCRIPT: map-lesson-resources.js
 *
 * PROBLEMA RISOLTO
 * ─────────────────
 * Lo script precedente (expand-to-lesson-resources.js) creava UNA LessonResource
 * per ogni combinazione (lezione × file), duplicando ogni file su TUTTE le lezioni
 * di un corso → 593 record da 63 file distinti (tutti sbagliati).
 *
 * SOLUZIONE
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. La cartella Aruba `/classroomresources/` contiene sottocartelle numerate
 *    per IDL (chiave primaria della tabella `lezione` di latin-cert.org).
 *    Ogni sottocartella contiene i materiali specifici di quella lezione.
 *
 * 2. La tabella Neon `Lesson` ha il campo `latinCertId` (= IDL di latin-cert),
 *    popolato via match su vimeoUrl in sessione precedente (456/467 lezioni).
 *
 * 3. Incrocio: cartella IDL → Lesson.latinCertId → Lesson.id (Neon)
 *    → 168 file correttamente assegnati a 104 lezioni specifiche.
 *
 * RISULTATO FINALE
 * ─────────────────
 * - LessonResource: 593 record errati → 168 record corretti
 * - 104 lezioni con almeno 1 file specifico
 * - 20 corsi coinvolti
 * - URL sorgente: 7 file via Vercel Blob, 161 via Aruba
 *
 * FILE ANCORA SENZA MAPPING (56 file Vercel Blob)
 * ─────────────────────────────────────────────────
 * 56 file caricati su Vercel Blob non compaiono in classroomresources
 * con IDL corrispondenti a lezioni Neon. Potrebbero provenire da:
 *   a) Classi private non importate in Neon (IDCR 335, 336, 380)
 *   b) File caricati direttamente senza passare per classroomresources
 * → Questi file sono stati rimossi da LessonResource (era sbagliato linkarli
 *   a tutte le lezioni). Da assegnare manualmente se necessario.
 *
 * NOTE TECNICHE
 * ─────────────────────────────────────────────────────────────────────────────
 * URL Aruba: https://www.latin-cert.org/classroomresources/{IDL}/{filename}
 * URL Vercel: https://z4vkwstir9irjbdf.public.blob.vercel-storage.com/...
 *
 * Per rieseguire questo script (se classroomresources viene aggiornato):
 *   node scripts/map-lesson-resources.js
 *
 * Richiede: DATABASE_URL in .env, accesso in lettura a classroomresources/
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

// ── CONFIG ───────────────────────────────────────────────────────────────────
const ARUBA_BASE_URL = 'https://www.latin-cert.org/classroomresources';

// Percorso locale della cartella classroomresources (da aggiornare se necessario)
// In produzione questa cartella non è presente → questo script va eseguito in locale
// dopo aver scaricato classroomresources da Aruba.
const CLASSROOM_RESOURCES_DIR = process.env.CLASSROOM_RESOURCES_DIR ||
  path.join(__dirname, '../../www.latin-cert.org/classroomresources');

// ── HELPERS ──────────────────────────────────────────────────────────────────
function cuid() {
  return randomBytes(12).toString('hex').slice(0, 25);
}

function extractTitle(filename) {
  let title = filename;
  // Rimuovi suffisso _Latin-Cert_XXXX.ext
  title = title.replace(/_Latin-Cert_[a-z0-9]+\.\w+$/i, '');
  // Rimuovi suffisso hex timestamp
  title = title.replace(/_[0-9a-f]{10,}\.\w+$/, '');
  // Rimuovi estensione residua
  title = title.replace(/\.\w+$/, '');
  // Pulisci
  return title.replace(/^_+|_+$/g, '').trim() || filename;
}

function encodeFilename(filename) {
  return filename.split('').map(c => {
    if (c === ' ') return '%20';
    // Caratteri sicuri per URL
    if (/[a-zA-Z0-9\-_.~!$&'()*+,;=:@]/.test(c)) return c;
    return encodeURIComponent(c);
  }).join('');
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('1. Recupero lezioni Neon con latinCertId...');
  const { rows: lessons } = await client.query(`
    SELECT id, "latinCertId", title FROM "Lesson"
    WHERE "latinCertId" IS NOT NULL
    ORDER BY "latinCertId"
  `);
  console.log(`   ${lessons.length} lezioni con latinCertId`);

  const lessonByIdl = {};
  for (const l of lessons) lessonByIdl[l.latinCertId] = l;

  console.log('2. Scansione cartelle classroomresources...');
  if (!fs.existsSync(CLASSROOM_RESOURCES_DIR)) {
    console.error(`ERRORE: cartella non trovata: ${CLASSROOM_RESOURCES_DIR}`);
    process.exit(1);
  }

  const folders = fs.readdirSync(CLASSROOM_RESOURCES_DIR);
  const toInsert = [];

  for (const folderName of folders) {
    const idl = parseInt(folderName, 10);
    if (isNaN(idl) || !lessonByIdl[idl]) continue;

    const folderPath = path.join(CLASSROOM_RESOURCES_DIR, folderName);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const files = fs.readdirSync(folderPath)
      .filter(f => fs.statSync(path.join(folderPath, f)).isFile())
      .sort();

    const lesson = lessonByIdl[idl];
    files.forEach((filename, i) => {
      const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : 'pdf';
      const url = `${ARUBA_BASE_URL}/${idl}/${encodeFilename(filename)}`;
      toInsert.push({
        id: cuid(),
        lessonId: lesson.id,
        title: extractTitle(filename).slice(0, 120),
        filename,
        fileType: ext,
        sortOrder: i,
        blobUrl: url,
      });
    });
  }

  console.log(`   ${toInsert.length} record da inserire su ${lessons.length} lezioni`);

  console.log('3. Pulizia LessonResource esistenti...');
  await client.query('DELETE FROM "LessonResource"');

  console.log('4. Inserimento nuovi record...');
  let inserted = 0;
  for (const r of toInsert) {
    await client.query(`
      INSERT INTO "LessonResource" (id, "lessonId", title, filename, "fileType", "sortOrder", "blobUrl")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [r.id, r.lessonId, r.title, r.filename, r.fileType, r.sortOrder, r.blobUrl]);
    inserted++;
  }

  console.log(`   Inseriti: ${inserted}`);

  const { rows: [{ count }] } = await client.query('SELECT COUNT(*) FROM "LessonResource"');
  console.log(`\n✓ Completato. LessonResource: ${count} record.`);

  await client.end();
}

main().catch(err => {
  console.error('Errore:', err.message);
  process.exit(1);
});
