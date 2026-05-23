/**
 * fix-course-mapping.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Risolve il mapping IDCR → Neon courseId sbagliato.
 *
 * STRATEGIA:
 * 1. Scansione FTP: lista tutti gli IDCR e i loro file
 * 2. Analisi filename: usa parole chiave nei nomi file per inferire il corso REALE
 * 3. Confronto con corsi Neon disponibili
 * 4. Cancella tutti i CourseResource record errati
 * 5. Ri-crea i record con il mapping corretto
 *
 * Se il filename non dà segnali, usa idl-lesson-map.json come fallback.
 */

require('dotenv').config();
const { Client }  = require('pg');
const ftp         = require('basic-ftp');
const https       = require('https');
const idlMap      = require('./idl-lesson-map.json');

// ─── FTP settings ─────────────────────────────────────────────────────────────
const FTP_HOST   = 'ftp.latin-cert.org';
const FTP_USER   = '7686675@aruba.it';
const FTP_PASS   = process.env.FTP_PASSWORD;
const REMOTE_BASE = '/www.latin-cert.org/classroomresources';

// ─── Vercel Blob settings ──────────────────────────────────────────────────────
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// ─── Keyword-based course inference ──────────────────────────────────────────
// Ordine: il primo match vince
const COURSE_KEYWORDS = [
  // Livelli espliciti nel filename ("Greco A1", "Latino B2.2", ecc.)
  { re: /greco\s*[ab]\s*2\.2/i,   title: 'Corso di greco antico B2.2 • E-Learning'    },
  { re: /greco\s*[ab]\s*2\.1/i,   title: 'Corso di greco antico B2.1 • E-Learning'    },
  { re: /greco\s*[ab]\s*1\.2/i,   title: 'Corso di greco antico B1.2 • E-Learning'    },
  { re: /greco\s*[ab]\s*1\.1/i,   title: 'Corso di greco antico B1.1 • E-Learning'    },
  { re: /greco\s*[ab]\s*1/i,      title: 'Corso di greco antico B1.1 • E-Learning'    },
  { re: /greco\s*a\s*2\.2/i,      title: 'Corso di greco antico A2.2 • E-Learning'    },
  { re: /greco\s*a\s*2\.1/i,      title: 'Corso di greco antico A2.1 • E-Learning'    },
  { re: /greco\s*a\s*2/i,         title: 'Corso di greco antico A2.1 • E-Learning'    },
  { re: /greco\s*a\s*1\.2/i,      title: 'Corso di greco antico A1.2 • E-Learning'    },
  { re: /greco\s*a\s*1/i,         title: 'Corso di greco antico A1.1 • E-Learning'    },

  { re: /latino\s*[ab]\s*2\.2/i,  title: 'Corso di lingua latina B2.2 • E-Learning'   },
  { re: /latino\s*[ab]\s*2\.1/i,  title: 'Corso di lingua latina B2.1 • E-Learning'   },
  { re: /latino\s*[ab]\s*1\.3/i,  title: 'Corso di lingua latina B1.3 • E-Learning'   },
  { re: /latino\s*[ab]\s*1\.2/i,  title: 'Corso di lingua latina B1.2 • E-Learning'   },
  { re: /latino\s*[ab]\s*1\.1/i,  title: 'Corso di lingua latina B1.1 • E-Learning'   },
  { re: /latino\s*[ab]\s*1/i,     title: 'Corso di lingua latina B1.1 • E-Learning'   },
  { re: /latino\s*a\s*2\.2/i,     title: 'Corso di lingua latina A2.2 • E-Learning'   },
  { re: /latino\s*a\s*2\.1/i,     title: 'Corso di lingua latina A2.1 • E-Learning'   },
  { re: /latino\s*a\s*2/i,        title: 'Corso di lingua latina A2.1 • E-Learning'   },
  { re: /latino\s*a\s*1\.2/i,     title: 'Corso di lingua latina A1.2 • E-Learning'   },
  { re: /latino\s*a\s*1/i,        title: 'Corso di lingua latina A1.1 • E-Learning'   },

  // Egiziano (Ciampini è l'autore del manuale di geroglifico più usato in Italia)
  { re: /bilitteri|trilitteri|determinativi|segni\s*fonetici|ciampini|geroglifico/i,
                                    title: 'Corso di Egiziano Geroglifico A1.1 • E-Learning' },

  // Athenaze è il manuale di greco antico per principianti, usato dal livello A2
  { re: /athenaze/i,               title: 'Corso di greco antico A2.1 • E-Learning'    },

  // Alfabeto greco → A1.1
  { re: /alfabeto\s*greco|αλφαβητο/i, title: 'Corso di greco antico A1.1 • E-Learning' },
];

/**
 * Inferisce il courseTitle dal set di nomi file di un IDCR.
 * Restituisce null se nessun keyword matcha.
 */
function inferCourseTitleFromFiles(files) {
  const allNames = files.map(f => f.name).join('\n');
  for (const { re, title } of COURSE_KEYWORDS) {
    if (re.test(allNames)) return title;
  }
  return null;
}

// ─── Blob upload helpers ───────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const os = require('os');

async function uploadToBlob(localPath, blobPath) {
  // Usa la Vercel Blob REST API direttamente
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(localPath);
    const url = new URL(`https://blob.vercel-storage.com/${blobPath}`);

    const options = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'PUT',
      headers: {
        'Authorization':   `Bearer ${BLOB_TOKEN}`,
        'x-api-version':   '7',
        'Content-Type':    'application/octet-stream',
        'Content-Length':  fileData.length,
        'x-add-random-suffix': 'true',
        'cache-control': 'public, max-age=31536000',
        'x-cache-control-max-age': '31536000',
      },
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(body)); }
          catch(e) { reject(new Error('Invalid JSON: ' + body)); }
        } else {
          reject(new Error(`Blob PUT ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Connessione DB
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  // 2. Leggi tutti i corsi Neon (title → id)
  const { rows: neonCourses } = await db.query(`SELECT id, title FROM "Course" ORDER BY title`);
  const titleToId = {};
  const availableTitles = [];
  for (const c of neonCourses) {
    titleToId[c.title] = c.id;
    availableTitles.push(c.title);
  }
  console.log(`\n✅ Corsi Neon caricati: ${neonCourses.length}`);

  // Helper: trova il titolo Neon più simile (gestisce anche varianti parziali)
  function findNeonCourseId(title) {
    if (!title) return null;
    if (titleToId[title]) return titleToId[title]; // match esatto
    // match parziale: cerca il titolo Neon che inizia con il candidato (o viceversa)
    const lower = title.toLowerCase();
    for (const t of availableTitles) {
      if (t.toLowerCase().startsWith(lower) || lower.startsWith(t.toLowerCase())) {
        return titleToId[t];
      }
    }
    return null;
  }

  // 3. Costruisci mapping IDCR → courseTitle da idl-lesson-map (fallback)
  const idcrToTitleFallback = {};
  for (const d of Object.values(idlMap)) {
    if (!idcrToTitleFallback[d.idcr]) idcrToTitleFallback[d.idcr] = d.courseTitle;
  }

  // 4. Connessione FTP
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = false;
  await ftpClient.access({
    host: FTP_HOST, port: 21,
    user: FTP_USER, password: FTP_PASS, secure: false,
  });
  console.log('✅ FTP connesso');

  // 5. Lista TUTTE le cartelle IDCR
  const idcrFolders = await ftpClient.list(REMOTE_BASE);
  const idcrList = idcrFolders
    .filter(e => e.type === ftp.FileType.Directory)
    .map(e => e.name)
    .sort((a, b) => Number(a) - Number(b));
  console.log(`✅ Cartelle IDCR trovate: ${idcrList.length}`);

  // 6. Per ogni IDCR: elenca file, inferisce corso, decide mapping
  const mapping = []; // { idcr, files, inferredTitle, finalTitle, courseId, source }

  for (const idcr of idcrList) {
    const remotePath = `${REMOTE_BASE}/${idcr}`;
    let files = [];
    try {
      const listed = await ftpClient.list(remotePath);
      files = listed.filter(e => e.type === ftp.FileType.File);
    } catch { files = []; }

    if (files.length === 0) continue; // IDCR vuoto: salta

    // Inferisci dal contenuto
    const inferredTitle = inferCourseTitleFromFiles(files);
    const fallbackTitle  = idcrToTitleFallback[Number(idcr)];
    const finalTitle     = inferredTitle || fallbackTitle;
    const courseId       = findNeonCourseId(finalTitle);
    const source         = inferredTitle ? '📂 filename' : (fallbackTitle ? '🗂 json' : '❌ none');

    mapping.push({ idcr: Number(idcr), files, inferredTitle, fallbackTitle, finalTitle, courseId, source });
  }

  ftpClient.close();

  // 7. Stampa il mapping proposto
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('MAPPING PROPOSTO (idcr → corso)');
  console.log('══════════════════════════════════════════════════════════════════');
  for (const m of mapping) {
    const status = m.courseId ? '✅' : '❌ NESSUN NEON MATCH';
    console.log(`\nIDCR ${m.idcr} [${m.files.length} file] ${m.source} → "${m.finalTitle}" ${status}`);
    if (m.inferredTitle && m.fallbackTitle && m.inferredTitle !== m.fallbackTitle) {
      console.log(`   ⚠️  JSON diceva: "${m.fallbackTitle}" — OVERRIDE da filename`);
    }
    for (const f of m.files) console.log(`   • ${f.name}`);
  }

  // 8. Cancella TUTTI i record CourseResource esistenti
  const { rowCount: deleted } = await db.query(`DELETE FROM "CourseResource"`);
  console.log(`\n🗑  Cancellati ${deleted} record CourseResource esistenti`);

  // 9. Ri-migra con mapping corretto
  const tmpDir = os.tmpdir();
  const { default: { put } } = await import('@vercel/blob');

  const ftpClient2 = new ftp.Client();
  ftpClient2.ftp.verbose = false;
  await ftpClient2.access({
    host: FTP_HOST, port: 21,
    user: FTP_USER, password: FTP_PASS, secure: false,
  });

  let inserted = 0;
  let skipped  = 0;

  for (const m of mapping) {
    if (!m.courseId) {
      console.log(`⚠️  IDCR ${m.idcr}: nessun match Neon per "${m.finalTitle}" — saltato`);
      skipped += m.files.length;
      continue;
    }

    for (let i = 0; i < m.files.length; i++) {
      const file      = m.files[i];
      const localPath = path.join(tmpDir, file.name);
      const remotePath = `${REMOTE_BASE}/${m.idcr}/${file.name}`;

      try {
        // Download
        await ftpClient2.downloadTo(localPath, remotePath);

        // Upload to Vercel Blob
        const fileStream = fs.createReadStream(localPath);
        const ext = path.extname(file.name).toLowerCase().replace('.', '') || 'pdf';
        const blobPath = `course-resources/${m.idcr}/${file.name}`;
        const blob = await put(blobPath, fileStream, { access: 'public', token: BLOB_TOKEN });

        // Insert in DB
        const cleanTitle = path.basename(file.name, path.extname(file.name))
          .replace(/_Latin-Cert_[a-z0-9]+/i, '')
          .replace(/_/g, ' ')
          .trim();

        await db.query(`
          INSERT INTO "CourseResource" (id, "courseId", title, filename, "blobUrl", "fileType", "sortOrder", "createdAt")
          VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, NOW())
        `, [m.courseId, cleanTitle, file.name, blob.url, ext, i]);

        fs.unlinkSync(localPath);
        inserted++;
        process.stdout.write(`\r📤 ${inserted} file migrati...`);
      } catch(err) {
        console.error(`\n❌ Errore su IDCR ${m.idcr} / ${file.name}: ${err.message}`);
        skipped++;
      }
    }
  }

  ftpClient2.close();
  await db.end();

  console.log(`\n\n════════════════════════════════════════`);
  console.log(`✅ MIGRAZIONE COMPLETATA`);
  console.log(`   Inseriti: ${inserted} file`);
  console.log(`   Saltati:  ${skipped} file`);
  console.log(`════════════════════════════════════════\n`);
}

main().catch(console.error);
