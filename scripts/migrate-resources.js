/**
 * migrate-resources.js
 * Migra le "Risorse da Scaricare" da latin-cert al portale GLV.
 *
 * Cosa fa:
 * 1. Legge i 59 compiti con file dalla tabella `compiti` del dump SQL
 * 2. Ottiene la title della lezione corrispondente dal dump
 * 3. Trova il Lesson ID su Neon per titolo + corso
 * 4. Scarica ogni file da https://www.latin-cert.org/db/compiti/{filename}
 * 5. Salva in public/resources/lessons/{filename}
 * 6. Crea record LessonResource in Neon
 * 7. Aggiorna Lesson.latinCertId per future migrazioni
 *
 * Uso: node scripts/migrate-resources.js
 * Prerequisiti: npx prisma db push (per creare tabelle LessonResource)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');

const prisma = new PrismaClient();

// ─── Dati estratti dal dump (compiti con file non-NULL) ───────────────────────
// Formato: { IDCompito, FK_IDL, title, filename }
const COMPITI_CON_FILE = [
  { IDCompito: 11, FK_IDL: 2557, title: 'Produzione scritta', filename: '67165f23017ab.pdf' },
  { IDCompito: 14, FK_IDL: 2605, title: 'Esercizio lezione 3', filename: '67201277b9ecc.pdf' },
  { IDCompito: 15, FK_IDL: 2630, title: 'Esercizi lezione 2', filename: '6724f635d9720.pdf' },
  { IDCompito: 16, FK_IDL: 2670, title: 'Ebraico Biblico - Livello Intermedio, Lezione 01', filename: '67321d148f3dc.pdf' },
  { IDCompito: 17, FK_IDL: 2670, title: 'Ebraico Biblico - Livello Intermedio, Lezione 01', filename: '67321dc13afd5.pdf' },
  { IDCompito: 18, FK_IDL: 2700, title: 'Esercizio participi', filename: '6736699e016d7.pdf' },
  { IDCompito: 41, FK_IDL: 3214, title: 'Esercizio participi', filename: '67d0650bd8e9d.pdf' },
  { IDCompito: 42, FK_IDL: 3214, title: 'Esercizio participi', filename: '67d0650be2078.pdf' },
  { IDCompito: 43, FK_IDL: 3212, title: 'Exercitium capituli XXVII', filename: '67d190bfde472.pdf' },
  { IDCompito: 44, FK_IDL: 3221, title: 'Exercitium capituli XV', filename: '67d308a976d91.pdf' },
  { IDCompito: 45, FK_IDL: 3234, title: 'Exercitium cap. XVI', filename: '67d9990885b05.pdf' },
  { IDCompito: 46, FK_IDL: 3249, title: 'Exercitium cap. XVI', filename: '67dd984022f12.pdf' },
  { IDCompito: 47, FK_IDL: 3254, title: 'Exercitium cap. XXVIII', filename: '67e1e5e6c5bea.pdf' },
  { IDCompito: 50, FK_IDL: 3291, title: 'Exercitia cap. XIX', filename: '67eff126aab3f.pdf' },
  { IDCompito: 51, FK_IDL: 3301, title: 'Exercitium cap. XXX', filename: '67f44e4c9fe1d.pdf' },
  { IDCompito: 53, FK_IDL: 3306, title: 'Exercitium cap. XX', filename: '67f5470598492.pdf' },
  { IDCompito: 54, FK_IDL: 3313, title: 'Exercitium cap. XX', filename: '67f7e107cf550.pdf' },
  { IDCompito: 55, FK_IDL: 3328, title: 'Exercitium - quidam', filename: '67fd8123ef3dc.pdf' },
  { IDCompito: 56, FK_IDL: 3331, title: 'Materiale didattico', filename: '67fe825c62174.pdf' },
  { IDCompito: 57, FK_IDL: 3332, title: 'Exercitium cap. XXI', filename: '67fe8c5f0206d.pdf' },
  { IDCompito: 58, FK_IDL: 3331, title: 'Esercizio n.7', filename: '67ffd56d0a5f1.pdf' },
  { IDCompito: 60, FK_IDL: 3339, title: 'Exercitium cap. XXI', filename: '68011b3422b58.pdf' },
  { IDCompito: 61, FK_IDL: 3343, title: 'Exercitium cap. 3', filename: '680211d1beb11.pdf' },
  { IDCompito: 62, FK_IDL: 3347, title: 'Exercitium cap. XXII', filename: '6807b7e80c54a.pdf' },
  { IDCompito: 63, FK_IDL: 3349, title: 'Exercitium Cap. III', filename: '6808b96c6cf6a.pdf' },
  { IDCompito: 65, FK_IDL: 3372, title: 'Exercitium cap. XXXII', filename: '680ff43a6a04d.pdf' },
  { IDCompito: 66, FK_IDL: 3376, title: 'Exercitium cap. XXIII', filename: '6810e8a3d7d87.pdf' },
  { IDCompito: 67, FK_IDL: 3381, title: 'Exercitium cap. 4', filename: '6811eb868b21a.pdf' },
  { IDCompito: 68, FK_IDL: 3381, title: 'Esercizi eum/eam e qui/quem', filename: '68124bc1c2751.pdf' },
  { IDCompito: 69, FK_IDL: 3381, title: 'Esercizi extra', filename: '6814c0f806bf9.pdf' },
  { IDCompito: 71, FK_IDL: 3393, title: 'Vita Medi', filename: '68193b7030963.pdf' },
  { IDCompito: 72, FK_IDL: 3393, title: 'Exercitia cap. XXXII', filename: '68193c799243a.pdf' },
  { IDCompito: 73, FK_IDL: 3398, title: 'Exercitium cap. 23', filename: '681a31a1df8ed.pdf' },
  { IDCompito: 74, FK_IDL: 3401, title: 'Esercizi cap. 4-5', filename: '681b2cb1a5a5f.pdf' },
  { IDCompito: 75, FK_IDL: 3421, title: 'Exercitia cap. XXIV', filename: '68237007c55f9.pdf' },
  { IDCompito: 76, FK_IDL: 3423, title: 'Exercitia cap. V', filename: '682465235a8f3.pdf' },
  { IDCompito: 77, FK_IDL: 3433, title: 'Exercitium cap. XXV', filename: '682748e2c9997.pdf' },
  { IDCompito: 79, FK_IDL: 3457, title: 'Exercitium cap. XXVI', filename: '683084020691a.pdf' },
  { IDCompito: 80, FK_IDL: 3423, title: 'Esercizi extra', filename: '6842ba21cf01f.pdf' },
  { IDCompito: 82, FK_IDL: 3764, title: 'Exercitia - cap. I', filename: '68f6b192ba86e.pdf' },
  { IDCompito: 83, FK_IDL: 3788, title: 'Exercitia cap. II', filename: '69007b6bd3d29.pdf' },
  { IDCompito: 84, FK_IDL: 3797, title: 'Exercitia cap. II/III', filename: '690480c984173.pdf' },
  { IDCompito: 85, FK_IDL: 3801, title: 'Exercitia cap. III', filename: '69092dcf083f4.pdf' },
  { IDCompito: 87, FK_IDL: 3817, title: 'Exercitia cap. IV', filename: '690d27395dbe5.pdf' },
  { IDCompito: 89, FK_IDL: 3826, title: 'Exercitia cap. V', filename: '6912f38106569.pdf' },
  { IDCompito: 90, FK_IDL: 3837, title: 'Exercitia cap. V', filename: '6916644913ff1.pdf' },
  { IDCompito: 91, FK_IDL: 3847, title: 'Exercitia cap. VI', filename: '691c31a985235.pdf' },
  { IDCompito: 92, FK_IDL: 3858, title: 'Exercitia cap. VI', filename: '691f967f9e1d2.pdf' },
  { IDCompito: 93, FK_IDL: 3867, title: 'Exercitia cap. VII', filename: '69259634437b5.pdf' },
  { IDCompito: 95, FK_IDL: 3882, title: 'Exercitium cap. VII', filename: '6929624774906.pdf' },
  { IDCompito: 99, FK_IDL: 4039, title: 'Esercizi cap. 5', filename: '698ef7f32ad2e.pdf' },
];

// Titoli delle lezioni dal dump (IDL → title)
const LEZIONE_TITLES = {
  2557: 'Lezione 6 del 21 ottobre 2024',
  2605: 'Lezione 3 - 28 ottobre 2024',
  2630: 'Lezione 2 del 31 ottobre 2024',
  2670: 'Lezione 01 - 11/11/2024',
  2700: 'Lezione 6 del 14 novembre 2024',
  2786: 'Lezione 9 del 25 novembre 2024',
  3212: "Lezione 1 dell'8 gennaio 2025",
  3214: 'Lezione 1 - 11 marzo 2025',
  3221: 'Lezione 2 - 13 marzo 2025',
  3234: 'Lezione 3 - 18 marzo 2025',
  3249: 'Lezione 4 - 21 marzo 2025',
  3254: 'Lezione 4 del 24 marzo 2025',
  3291: 'Lezione 8 - 4 aprile 2025',
  3301: 'Lezione 8 - 7 aprile 2025',
  3302: 'Lezione 1',
  3306: 'Lezione 9 - 8 aprile 2025',
  3313: 'Lezione 10 - 10 aprile 2025',
  3328: 'Lezione 10 - 14 aprile 2025',
  3331: 'Materiali didattici',
  3332: 'Lezione 11 - 15 aprile 2024',
  3339: 'Lezione 12 - 17 aprile 2025',
  3343: 'Lezione 1 - 18 aprile 2025',
  3347: 'Lezione 13 - 22 aprile 2024',
  3349: 'Lezione 2 - 23 aprile 2025',
  3372: 'Lezione 13 - 28 aprile 2024',
  3376: 'Lezione 14 - 29 aprile 2025',
  3381: 'Lezione 3 - 30 aprile 2025',
  3393: 'Lezione 14 - 5 maggio 2025',
  3398: 'Lezione 15 - 6 maggio 2025',
  3401: 'Lezione 4 - 7 maggio 2025',
  3421: 'Lezione 16 - 13 maggio 2025',
  3423: 'Lezione 5 - 14 maggio 2025',
  3433: 'Lezione 17 - 16 maggio 2025',
  3457: 'Lezione 19 - 23 maggio 2025',
  3764: 'Lezione 1 - 20 ottobre 2025',
  3788: 'Lezione 3 - 27 ottobre 2025',
  3797: 'Lezione 4 - 30 ottobre 2025',
  3801: 'Lezione 5 - 3 novembre 2025',
  3817: 'Lezione 6 - 6 novembre 2025',
  3826: 'Lezione 7 - 10 novembre 2025',
  3837: 'Lezione 8 - 13 novembre 2025',
  3847: 'Lezione 9 - 17 novembre 2025',
  3858: 'Lezione 10 - 20 novembre 2025',
  3867: 'Lezione 11 - 24 novembre 2025',
  3882: 'Lezione 12 - 27 novembre 2025',
  4039: 'Lezione 9 - 12 febbraio 2026',
};

const SOURCE_BASE_URL = 'https://www.latin-cert.org/db/compiti/';
const DEST_DIR = path.join(__dirname, '..', 'public', 'resources', 'lessons');

// ─── Utility: scarica un file via HTTPS ──────────────────────────────────────
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    // Se il file esiste già, salta
    if (fs.existsSync(destPath)) {
      console.log(`  ⏭  Già presente: ${path.basename(destPath)}`);
      return resolve(true);
    }

    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      // Segui redirect
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
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // Crea la cartella destinazione
  fs.mkdirSync(DEST_DIR, { recursive: true });
  console.log(`📁 Cartella destinazione: ${DEST_DIR}\n`);

  // Carica tutti i Lesson da Neon per trovare i match per titolo
  const allLessons = await prisma.lesson.findMany({
    select: { id: true, title: true, courseId: true, latinCertId: true },
  });
  console.log(`📚 ${allLessons.size || allLessons.length} lezioni su Neon\n`);

  // Costruisci indice per titolo normalizzato → array di lessons
  const byTitle = {};
  for (const l of allLessons) {
    const key = l.title.trim().toLowerCase();
    if (!byTitle[key]) byTitle[key] = [];
    byTitle[key].push(l);
  }

  let matched = 0;
  let skipped = 0;
  let downloaded = 0;
  let errors = [];

  // Raggruppa i compiti per FK_IDL per assegnare sortOrder
  const byIDL = {};
  for (const c of COMPITI_CON_FILE) {
    if (!byIDL[c.FK_IDL]) byIDL[c.FK_IDL] = [];
    byIDL[c.FK_IDL].push(c);
  }

  for (const [idl, compiti] of Object.entries(byIDL)) {
    const idlNum = parseInt(idl);
    const lezioneTitle = (LEZIONE_TITLES[idlNum] || '').trim().toLowerCase();

    // Trova la lezione su Neon per titolo
    let neonLesson = null;
    if (lezioneTitle) {
      const candidates = byTitle[lezioneTitle] || [];
      if (candidates.length === 1) {
        neonLesson = candidates[0];
      } else if (candidates.length > 1) {
        // Ambiguo — usa il primo, logga avviso
        neonLesson = candidates[0];
        console.warn(`⚠️  IDL ${idl}: titolo ambiguo ("${LEZIONE_TITLES[idlNum]}") → ${candidates.length} match, uso il primo`);
      }
    }

    if (!neonLesson) {
      console.warn(`⚠️  IDL ${idl}: lezione NON trovata su Neon per titolo "${LEZIONE_TITLES[idlNum]}"`);
      skipped += compiti.length;
      continue;
    }

    // Aggiorna latinCertId se non è già impostato
    if (!neonLesson.latinCertId) {
      await prisma.lesson.update({
        where: { id: neonLesson.id },
        data: { latinCertId: idlNum },
      });
      console.log(`🔗 Collegato Lesson "${neonLesson.title}" → latinCertId=${idlNum}`);
    }

    // Processa ogni file di questa lezione
    for (let i = 0; i < compiti.length; i++) {
      const c = compiti[i];
      const ext = path.extname(c.filename).toLowerCase().replace('.', '') || 'pdf';
      const fileType = ['pdf'].includes(ext) ? 'pdf' : ['jpg','jpeg','png','webp','gif'].includes(ext) ? 'image' : 'other';

      // Salta file non-PDF (immagini di test, ecc.)
      if (fileType !== 'pdf') {
        console.log(`  ⏭  Salto non-PDF: ${c.filename} (${fileType})`);
        skipped++;
        continue;
      }

      const destPath = path.join(DEST_DIR, c.filename);
      const sourceUrl = SOURCE_BASE_URL + c.filename;

      // Scarica il file
      try {
        console.log(`  ⬇️  Scarico: ${c.filename} → "${c.title}"`);
        await downloadFile(sourceUrl, destPath);
        downloaded++;
      } catch (err) {
        console.error(`  ❌ Errore download ${c.filename}: ${err.message}`);
        errors.push({ filename: c.filename, error: err.message });
        continue;
      }

      // Crea record su Neon (upsert per idempotenza)
      try {
        await prisma.lessonResource.upsert({
          where: { id: `lc-${c.IDCompito}` },
          create: {
            id: `lc-${c.IDCompito}`,
            lessonId: neonLesson.id,
            title: c.title,
            filename: c.filename,
            fileType: 'pdf',
            sortOrder: i,
          },
          update: {
            title: c.title,
            sortOrder: i,
          },
        });
        matched++;
        console.log(`  ✅ LessonResource creato: "${c.title}" per lezione "${neonLesson.title}"`);
      } catch (err) {
        console.error(`  ❌ Errore DB ${c.filename}: ${err.message}`);
        errors.push({ filename: c.filename, error: err.message });
      }
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`✅ Risorse migrate: ${matched}`);
  console.log(`⬇️  File scaricati: ${downloaded}`);
  console.log(`⏭  Saltati (non trovati o non-PDF): ${skipped}`);
  if (errors.length) {
    console.log(`❌ Errori: ${errors.length}`);
    errors.forEach(e => console.log(`   - ${e.filename}: ${e.error}`));
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
