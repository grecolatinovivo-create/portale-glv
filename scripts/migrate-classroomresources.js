/**
 * migrate-classroomresources.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Struttura reale sul server FTP:
 *   /www.latin-cert.org/classroomresources/{IDCR}/nomefile.pdf
 *
 * I file sono DIRETTAMENTE nella cartella IDCR (non in sotto-cartelle IDL).
 * Sono materiali del corso, non di una singola lezione.
 * Vengono salvati come CourseResource in Neon.
 *
 * Uso: node scripts/migrate-classroomresources.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { put } = require('@vercel/blob');
const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Validazione env ──────────────────────────────────────────────────────────

if (!process.env.FTP_PASSWORD) { console.error('❌ FTP_PASSWORD mancante nel .env'); process.exit(1); }
if (!process.env.BLOB_READ_WRITE_TOKEN) { console.error('❌ BLOB_READ_WRITE_TOKEN mancante nel .env'); process.exit(1); }

// ─── Config FTP ───────────────────────────────────────────────────────────────

const FTP = {
  host: 'ftp.latin-cert.org',
  port: 21,
  user: '7686675@aruba.it',
  password: process.env.FTP_PASSWORD,
  secure: false,
};
const REMOTE_BASE = '/www.latin-cert.org/classroomresources';

// ─── TARGET: IDCR presenti nel portale ───────────────────────────────────────
// Estratti da idl-lesson-map.json (tutti gli IDCR mappati)

const idlMap = require('./idl-lesson-map.json');

// Costruisce mappa IDCR → courseTitle (da idl-lesson-map.json)
const IDCR_TO_TITLE = {};
for (const data of Object.values(idlMap)) {
  if (!IDCR_TO_TITLE[data.idcr]) IDCR_TO_TITLE[data.idcr] = data.courseTitle;
}
const TARGET_IDCRS = Object.keys(IDCR_TO_TITLE).map(Number).sort((a, b) => a - b);

// ─── Helper ───────────────────────────────────────────────────────────────────

function contentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ({
    '.pdf':  'application/pdf',
    '.jpg':  'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.doc':  'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.ppt':  'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.mp3':  'audio/mpeg', '.mp4': 'video/mp4',
  })[ext] || 'application/octet-stream';
}

function fileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (['.jpg','.jpeg','.png','.gif'].includes(ext)) return 'image';
  if (['.mp3','.wav'].includes(ext)) return 'audio';
  if (['.mp4','.webm'].includes(ext)) return 'video';
  return 'other';
}

function cleanTitle(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const prisma = new PrismaClient();
  const client = new ftp.Client();
  client.ftp.verbose = false;

  // Carica tutti i corsi da Neon: title → id
  const courses = await prisma.course.findMany({ select: { id: true, title: true } });
  const titleToId = {};
  for (const c of courses) titleToId[c.title] = c.id;

  let migrated = 0, skipped = 0, noMatch = 0, errors = 0;

  console.log(`\n🚀 Migrazione classroomresources → Vercel Blob (CourseResource)`);
  console.log(`   IDCR da processare: ${TARGET_IDCRS.length}`);
  console.log(`   Corsi in Neon: ${courses.length}`);

  await client.access(FTP);
  console.log('✅ FTP connesso\n');

  for (const idcr of TARGET_IDCRS) {
    const courseTitle = IDCR_TO_TITLE[idcr];
    const courseId = titleToId[courseTitle];

    if (!courseId) {
      console.log(`⚠️  IDCR ${idcr} — "${courseTitle}" — non trovato in Neon, salto`);
      noMatch++;
      continue;
    }

    // Lista file direttamente nella cartella IDCR
    let files;
    try {
      files = await client.list(`${REMOTE_BASE}/${idcr}`);
    } catch {
      continue; // cartella non esiste — corso senza materiali
    }

    const realFiles = files.filter(f => f.type === ftp.FileType.File);
    if (realFiles.length === 0) continue;

    console.log(`📁 IDCR ${idcr} — ${courseTitle} — ${realFiles.length} file`);

    for (const ftpFile of realFiles) {
      // Idempotenza: salta se già presente in DB
      const existing = await prisma.courseResource.findFirst({
        where: { courseId, filename: ftpFile.name },
        select: { id: true },
      });
      if (existing) { skipped++; continue; }

      // Download in /tmp
      const tmpPath = path.join(os.tmpdir(), `glv_${idcr}_${Date.now()}_${ftpFile.name}`);
      try {
        await client.downloadTo(tmpPath, `${REMOTE_BASE}/${idcr}/${ftpFile.name}`);
      } catch (e) {
        console.error(`  ❌ Download fallito: ${ftpFile.name} — ${e.message}`);
        errors++;
        continue;
      }

      // Upload su Vercel Blob
      let blobResult;
      try {
        const buf = fs.readFileSync(tmpPath);
        blobResult = await put(`courses/${courseId}/${ftpFile.name}`, buf, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
          contentType: contentType(ftpFile.name),
          addRandomSuffix: false,
        });
      } catch (e) {
        console.error(`  ❌ Blob upload fallito: ${ftpFile.name} — ${e.message}`);
        errors++;
        continue;
      } finally {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      }

      // Crea record Neon
      await prisma.courseResource.create({
        data: {
          courseId,
          title:     cleanTitle(ftpFile.name),
          filename:  ftpFile.name,
          blobUrl:   blobResult.url,
          fileType:  fileType(ftpFile.name),
          sortOrder: migrated,
        },
      });

      migrated++;
      console.log(`  ✅ ${ftpFile.name}`);
    }
  }

  client.close();
  await prisma.$disconnect();

  console.log('\n' + '─'.repeat(50));
  console.log('📊 Migrazione completata');
  console.log(`   ✅ File migrati:          ${migrated}`);
  console.log(`   ⏭️  Già presenti:          ${skipped}`);
  console.log(`   ⚠️  IDCR senza corso Neon: ${noMatch}`);
  console.log(`   ❌ Errori:                 ${errors}`);
  if (migrated > 0) console.log('\n🎉 Dopo la migrazione rimuovi FTP_PASSWORD dal .env');
}

main().catch(err => { console.error('\n💥', err.message); process.exit(1); });
