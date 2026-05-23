/**
 * migrate-resources.js  (v2 — matching per numero di lezione)
 * Migra le "Risorse da Scaricare" da latin-cert al portale GLV.
 *
 * STRATEGIA DI MATCHING (v2):
 *   - Estrae il numero N da "Lezione N - data" nel titolo IDL
 *   - Cerca la lezione Neon nel corso corretto il cui titolo contiene "Lezione N"
 *   - Mapping IDCR → corso Neon hardcodato (corsi E-Learning pubblici)
 *   - Percorsi individuali (IDCR 285, 350, 351, 353, 394) → SKIP
 *
 * Uso: node scripts/migrate-resources.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');

const prisma = new PrismaClient();

// ─── Mapping IDCR → titolo corso Neon ────────────────────────────────────────
const IDCR_TO_COURSE_TITLE = {
  290: 'Corso di lingua latina B1.2 • E-Learning',
  291: 'Corso di greco antico A2.1 • E-Learning',
  292: 'Corso di Egiziano Geroglifico A1.1 • E-Learning',
  299: 'Ebraico Biblico A2 • E-Learning',
  335: 'Corso di lingua latina B1.1 • E-Learning',
  336: 'Corso di lingua latina B1.1 • E-Learning', // Madeleine — stesso curriculum
  380: 'Corso di lingua latina A1.1 • E-Learning',
};

// ─── Dati estratti dal dump (compiti con file non-NULL, percorsi pubblici) ───
const COMPITI_CON_FILE = [
  // IDCR 290 — Latino B1.2 (ottobre 2024)
  { IDCompito: 14, FK_IDL: 2605, FK_IDCR: 290, lessonTitle: 'Lezione 3 - 28 ottobre 2024', title: 'Esercizio lezione 3', filename: '67201277b9ecc.pdf' },

  // IDCR 292 — Egiziano Geroglifico A1 (ottobre 2024)
  { IDCompito: 15, FK_IDL: 2630, FK_IDCR: 292, lessonTitle: 'Lezione 2 del 31 ottobre 2024', title: 'Esercizi lezione 2', filename: '6724f635d9720.pdf' },

  // IDCR 299 — Ebraico Biblico A2 (novembre 2024)
  { IDCompito: 16, FK_IDL: 2670, FK_IDCR: 299, lessonTitle: 'Lezione 01 - 11/11/2024', title: 'Ebraico Biblico - Lezione 01 (materiali)', filename: '67321d148f3dc.pdf' },
  { IDCompito: 17, FK_IDL: 2670, FK_IDCR: 299, lessonTitle: 'Lezione 01 - 11/11/2024', title: 'Ebraico Biblico - Lezione 01 (esercizi)', filename: '67321dc13afd5.pdf' },

  // IDCR 291 — Greco A2.1 (novembre 2024)
  { IDCompito: 18, FK_IDL: 2700, FK_IDCR: 291, lessonTitle: 'Lezione 6 del 14 novembre 2024', title: 'Esercizio participi', filename: '6736699e016d7.pdf' },

  // IDCR 335 — Latino B1.1 gruppo (2025)
  { IDCompito: 43, FK_IDL: 3212, FK_IDCR: 335, lessonTitle: "Lezione 1 dell'11 marzo 2025", title: 'Exercitium capituli XXVII', filename: '67d190bfde472.pdf' },
  { IDCompito: 47, FK_IDL: 3254, FK_IDCR: 335, lessonTitle: 'Lezione 4 del 24 marzo 2025', title: 'Exercitium cap. XXVIII', filename: '67e1e5e6c5bea.pdf' },
  { IDCompito: 51, FK_IDL: 3301, FK_IDCR: 335, lessonTitle: 'Lezione 8 - 7 aprile 2025', title: 'Exercitium cap. XXX', filename: '67f44e4c9fe1d.pdf' },
  { IDCompito: 55, FK_IDL: 3328, FK_IDCR: 335, lessonTitle: 'Lezione 10 - 14 aprile 2025', title: 'Exercitium - quidam', filename: '67fd8123ef3dc.pdf' },
  { IDCompito: 65, FK_IDL: 3372, FK_IDCR: 335, lessonTitle: 'Lezione 13 - 28 aprile 2025', title: 'Exercitium cap. XXXII', filename: '680ff43a6a04d.pdf' },
  { IDCompito: 71, FK_IDL: 3393, FK_IDCR: 335, lessonTitle: 'Lezione 14 - 5 maggio 2025', title: 'Vita Medi', filename: '68193b7030963.pdf' },
  { IDCompito: 72, FK_IDL: 3393, FK_IDCR: 335, lessonTitle: 'Lezione 14 - 5 maggio 2025', title: 'Exercitia cap. XXXII', filename: '68193c799243a.pdf' },

  // IDCR 336 — Madeleine (percorso individuale B1.1, stesso curriculum)
  { IDCompito: 41, FK_IDL: 3214, FK_IDCR: 336, lessonTitle: 'Lezione 1 - 11 marzo 2025', title: 'Esercizio participi (A)', filename: '67d0650bd8e9d.pdf' },
  { IDCompito: 42, FK_IDL: 3214, FK_IDCR: 336, lessonTitle: 'Lezione 1 - 11 marzo 2025', title: 'Esercizio participi (B)', filename: '67d0650be2078.pdf' },
  { IDCompito: 44, FK_IDL: 3221, FK_IDCR: 336, lessonTitle: 'Lezione 2 - 13 marzo 2025', title: 'Exercitium capituli XV', filename: '67d308a976d91.pdf' },
  { IDCompito: 45, FK_IDL: 3234, FK_IDCR: 336, lessonTitle: 'Lezione 3 - 18 marzo 2025', title: 'Exercitium cap. XVI', filename: '67d9990885b05.pdf' },
  { IDCompito: 46, FK_IDL: 3249, FK_IDCR: 336, lessonTitle: 'Lezione 4 - 21 marzo 2025', title: 'Exercitium cap. XVI (var.)', filename: '67dd984022f12.pdf' },
  { IDCompito: 50, FK_IDL: 3291, FK_IDCR: 336, lessonTitle: 'Lezione 8 - 4 aprile 2025', title: 'Exercitia cap. XIX', filename: '67eff126aab3f.pdf' },
  { IDCompito: 53, FK_IDL: 3306, FK_IDCR: 336, lessonTitle: 'Lezione 9 - 8 aprile 2025', title: 'Exercitium cap. XX', filename: '67f5470598492.pdf' },
  { IDCompito: 54, FK_IDL: 3313, FK_IDCR: 336, lessonTitle: 'Lezione 10 - 10 aprile 2025', title: 'Exercitium cap. XX (var.)', filename: '67f7e107cf550.pdf' },
  { IDCompito: 57, FK_IDL: 3332, FK_IDCR: 336, lessonTitle: 'Lezione 11 - 15 aprile 2025', title: 'Exercitium cap. XXI', filename: '67fe8c5f0206d.pdf' },
  { IDCompito: 60, FK_IDL: 3339, FK_IDCR: 336, lessonTitle: 'Lezione 12 - 17 aprile 2025', title: 'Exercitium cap. XXI (var.)', filename: '68011b3422b58.pdf' },
  { IDCompito: 62, FK_IDL: 3347, FK_IDCR: 336, lessonTitle: 'Lezione 13 - 22 aprile 2025', title: 'Exercitium cap. XXII', filename: '6807b7e80c54a.pdf' },
  { IDCompito: 66, FK_IDL: 3376, FK_IDCR: 336, lessonTitle: 'Lezione 14 - 29 aprile 2025', title: 'Exercitium cap. XXIII', filename: '6810e8a3d7d87.pdf' },
  { IDCompito: 73, FK_IDL: 3398, FK_IDCR: 336, lessonTitle: 'Lezione 15 - 6 maggio 2025', title: 'Exercitium cap. XXIII (var.)', filename: '681a31a1df8ed.pdf' },
  { IDCompito: 75, FK_IDL: 3421, FK_IDCR: 336, lessonTitle: 'Lezione 16 - 13 maggio 2025', title: 'Exercitia cap. XXIV', filename: '68237007c55f9.pdf' },
  { IDCompito: 77, FK_IDL: 3433, FK_IDCR: 336, lessonTitle: 'Lezione 17 - 16 maggio 2025', title: 'Exercitium cap. XXV', filename: '682748e2c9997.pdf' },
  { IDCompito: 79, FK_IDL: 3457, FK_IDCR: 336, lessonTitle: 'Lezione 19 - 23 maggio 2025', title: 'Exercitium cap. XXVI', filename: '683084020691a.pdf' },

  // IDCR 380 — Latino A1.1 (ottobre–novembre 2025)
  { IDCompito: 82, FK_IDL: 3764, FK_IDCR: 380, lessonTitle: 'Lezione 1 - 20 ottobre 2025', title: 'Exercitia - cap. I', filename: '68f6b192ba86e.pdf' },
  { IDCompito: 83, FK_IDL: 3788, FK_IDCR: 380, lessonTitle: 'Lezione 3 - 27 ottobre 2025', title: 'Exercitia cap. II', filename: '69007b6bd3d29.pdf' },
  { IDCompito: 84, FK_IDL: 3797, FK_IDCR: 380, lessonTitle: 'Lezione 4 - 30 ottobre 2025', title: 'Exercitia cap. II/III', filename: '690480c984173.pdf' },
  { IDCompito: 85, FK_IDL: 3801, FK_IDCR: 380, lessonTitle: 'Lezione 5 - 3 novembre 2025', title: 'Exercitia cap. III', filename: '69092dcf083f4.pdf' },
  { IDCompito: 87, FK_IDL: 3817, FK_IDCR: 380, lessonTitle: 'Lezione 6 - 6 novembre 2025', title: 'Exercitia cap. IV', filename: '690d27395dbe5.pdf' },
  { IDCompito: 89, FK_IDL: 3826, FK_IDCR: 380, lessonTitle: 'Lezione 7 - 10 novembre 2025', title: 'Exercitia cap. V', filename: '6912f38106569.pdf' },
  { IDCompito: 90, FK_IDL: 3837, FK_IDCR: 380, lessonTitle: 'Lezione 8 - 13 novembre 2025', title: 'Exercitia cap. V (var.)', filename: '6916644913ff1.pdf' },
  { IDCompito: 91, FK_IDL: 3847, FK_IDCR: 380, lessonTitle: 'Lezione 9 - 17 novembre 2025', title: 'Exercitia cap. VI', filename: '691c31a985235.pdf' },
  { IDCompito: 92, FK_IDL: 3858, FK_IDCR: 380, lessonTitle: 'Lezione 10 - 20 novembre 2025', title: 'Exercitia cap. VI (var.)', filename: '691f967f9e1d2.pdf' },
  { IDCompito: 93, FK_IDL: 3867, FK_IDCR: 380, lessonTitle: 'Lezione 11 - 24 novembre 2025', title: 'Exercitia cap. VII', filename: '69259634437b5.pdf' },
  { IDCompito: 95, FK_IDL: 3882, FK_IDCR: 380, lessonTitle: 'Lezione 12 - 27 novembre 2025', title: 'Exercitium cap. VII (var.)', filename: '6929624774906.pdf' },
];

const SOURCE_BASE_URL = 'https://www.latin-cert.org/db/compiti/';
const DEST_DIR = path.join(__dirname, '..', 'public', 'resources', 'lessons');

// ─── Utility: estrae il numero di lezione dal titolo ─────────────────────────
function extractLessonNumber(title) {
  const m = title.match(/Lezione\s+0*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

// ─── Utility: scarica un file via HTTPS ──────────────────────────────────────
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) {
      console.log(`  ⏭  Già presente: ${path.basename(destPath)}`);
      return resolve(true);
    }
    const file = fs.createWriteStream(destPath);
    const req = https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlink(destPath, () => {});
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`HTTP ${response.statusCode} per ${url}`));
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
    });
    req.on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(DEST_DIR, { recursive: true });
  console.log(`📁 Cartella destinazione: ${DEST_DIR}\n`);

  // ─── Costruisci indice corsi Neon ─────────────────────────────────────────
  const courseData = {}; // courseTitle → { courseId, lessonByNumber }
  const uniqueTitles = [...new Set(Object.values(IDCR_TO_COURSE_TITLE))];

  for (const title of uniqueTitles) {
    const course = await prisma.course.findFirst({ where: { title } });
    if (!course) {
      console.error(`❌ Corso non trovato: "${title}"`);
      courseData[title] = null;
      continue;
    }

    const lessons = await prisma.lesson.findMany({
      where: { courseId: course.id },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true, sortOrder: true },
    });

    const lessonByNumber = {};
    for (const l of lessons) {
      const n = extractLessonNumber(l.title);
      if (n !== null && !lessonByNumber[n]) {
        lessonByNumber[n] = l.id; // prima occorrenza per "Lezione 2 parte 1/2"
      }
    }

    courseData[title] = { courseId: course.id, lessonByNumber };
    console.log(`✅ ${title}`);
    console.log(`   ${lessons.length} lezioni | numeri: ${Object.keys(lessonByNumber).sort((a,b)=>a-b).join(', ')}`);
  }

  console.log('');

  // ─── Raggruppa compiti per IDL ────────────────────────────────────────────
  const byIDL = {};
  for (const c of COMPITI_CON_FILE) {
    if (!byIDL[c.FK_IDL]) byIDL[c.FK_IDL] = [];
    byIDL[c.FK_IDL].push(c);
  }

  let matched = 0, skipped = 0, downloaded = 0;
  const errors = [];

  for (const [idlStr, compiti] of Object.entries(byIDL)) {
    const idl = parseInt(idlStr, 10);
    const { FK_IDCR, lessonTitle } = compiti[0];
    const courseTitle = IDCR_TO_COURSE_TITLE[FK_IDCR];
    const cd = courseData[courseTitle];

    if (!cd) {
      console.log(`⚠️  IDL ${idl} (IDCR ${FK_IDCR}): corso non disponibile → skip`);
      skipped++;
      continue;
    }

    const lessonNum = extractLessonNumber(lessonTitle);
    const neonLessonId = lessonNum ? cd.lessonByNumber[lessonNum] : null;

    if (!neonLessonId) {
      console.log(`⚠️  IDL ${idl} "${lessonTitle}" (IDCR ${FK_IDCR}): lezione ${lessonNum} non trovata → skip`);
      skipped++;
      continue;
    }

    matched++;
    console.log(`\n📎 IDL ${idl} → Lezione ${lessonNum} → Neon ${neonLessonId.substring(0,8)}...`);

    for (let i = 0; i < compiti.length; i++) {
      const c = compiti[i];
      const sourceUrl = `${SOURCE_BASE_URL}${c.filename}`;
      const destPath = path.join(DEST_DIR, c.filename);
      const resourceId = `lc-${c.IDCompito}`;

      try {
        await downloadFile(sourceUrl, destPath);
        downloaded++;
      } catch (err) {
        console.error(`  ❌ Download fallito: ${c.filename} — ${err.message}`);
        errors.push({ IDCompito: c.IDCompito, file: c.filename, error: err.message });
        continue;
      }

      await prisma.lessonResource.upsert({
        where: { id: resourceId },
        create: {
          id: resourceId,
          lessonId: neonLessonId,
          title: c.title,
          filename: c.filename,
          fileType: 'pdf',
          sortOrder: i,
        },
        update: {
          lessonId: neonLessonId,
          title: c.title,
          filename: c.filename,
          sortOrder: i,
        },
      });
      console.log(`  ✅ ${resourceId}: "${c.title}"`);
    }
  }

  // ─── Riepilogo ───────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────');
  console.log(`📊 Riepilogo:`);
  console.log(`   IDL processati:  ${matched}`);
  console.log(`   IDL skippati:    ${skipped}`);
  console.log(`   File scaricati:  ${downloaded}`);
  if (errors.length) {
    console.log(`   Errori:          ${errors.length}`);
    errors.forEach(e => console.log(`     • ${e.file}: ${e.error}`));
  }

  const total = await prisma.lessonResource.count();
  console.log(`\n🗄️  LessonResource totali su Neon: ${total}`);

  // Riepilogo per corso
  console.log('\n📋 Risorse per corso:');
  const byLesson = await prisma.lessonResource.groupBy({
    by: ['lessonId'],
    _count: { id: true },
  });
  console.log(`   Lezioni con risorse: ${byLesson.length}`);
  console.log(`   Totale risorse:      ${byLesson.reduce((s, r) => s + r._count.id, 0)}`);
}

main()
  .catch((err) => { console.error('❌ Errore fatale:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
