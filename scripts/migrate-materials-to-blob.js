/**
 * scripts/migrate-materials-to-blob.js
 * ─────────────────────────────────────────────────────────────────────────────
 * FASE 0 — Messa in sicurezza dei materiali.
 *
 * PROBLEMA
 *   ~96% delle LessonResource puntano ancora a latin-cert.org (Aruba):
 *     blobUrl = https://www.latin-cert.org/classroomresources/{IDL}/{filename}
 *   Se quel dominio cade, tutti i download dei materiali si rompono.
 *
 * SOLUZIONE
 *   I file sono già presenti in locale (latin-cert-files/, ~5.8 GB).
 *   Questo script li carica sul NOSTRO Vercel Blob e riscrive blobUrl nel DB,
 *   eliminando ogni dipendenza da Aruba.
 *
 * SICUREZZA / IDEMPOTENZA
 *   - DRY-RUN DI DEFAULT: senza --apply non scrive né su Blob né su DB.
 *   - Salta i record già migrati (blobUrl che contiene blob.vercel-storage.com).
 *   - Non cancella nulla da Aruba né dal disco locale.
 *   - Rilanciabile: riprende solo i record ancora su latin-cert.org.
 *
 * USO
 *   node scripts/migrate-materials-to-blob.js            # dry-run (default)
 *   node scripts/migrate-materials-to-blob.js --apply    # esecuzione reale
 *   node scripts/migrate-materials-to-blob.js --apply --limit 20   # primi 20 (test)
 *
 * PREREQUISITI (.env)
 *   DATABASE_URL            → Neon PostgreSQL
 *   BLOB_READ_WRITE_TOKEN   → token Vercel Blob (già usato dal vocabolario)
 *
 * Cartella file locali (override con MATERIALS_LOCAL_DIR):
 *   latin-cert-files/www.latin-cert.org/classroomresources/{IDL}/{filename}
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Client } = require('pg');
const { put }    = require('@vercel/blob');

// ── CONFIG ───────────────────────────────────────────────────────────────────
const APPLY = process.argv.includes('--apply');
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit');
  return i !== -1 && process.argv[i + 1] ? parseInt(process.argv[i + 1], 10) : null;
})();

const LOCAL_DIR = process.env.MATERIALS_LOCAL_DIR ||
  path.join(__dirname, '..', 'latin-cert-files', 'www.latin-cert.org', 'classroomresources');

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const ARUBA_MARKER = 'latin-cert.org';
const BLOB_MARKER  = 'blob.vercel-storage.com';

// MIME minimi per estensione (Blob lo usa per il Content-Type del download)
const MIME = {
  pdf: 'application/pdf',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', ogg: 'audio/ogg',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};

// ── HELPERS ──────────────────────────────────────────────────────────────────

// Estrae l'IDL (cartella) dall'URL Aruba: .../classroomresources/{IDL}/{file}
function extractIdl(url) {
  const m = url.match(/classroomresources\/(\d+)\//);
  return m ? m[1] : null;
}

function mimeFor(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  return MIME[ext] || 'application/octet-stream';
}

// Normalizza un nome file per il confronto: il nome nel DB è "pulito" mentre su
// disco ha suffissi come "_Latin-Cert_<hash>", "_compressed", estensione doppia
// (es. "Platone.pdf" → "Platone_pdf.pdf") o ".pdf" residuo nel mezzo.
// Restituisce una chiave alfanumerica minuscola confrontabile.
const EXTS = 'pdf|odt|docx|doc|pptx|ppt|mp3|m4a|wav|ogg|png|jpg|jpeg|gif|webp|zip';
function normKey(name) {
  let s = String(name);
  // rimozioni iterative dei suffissi tecnici (in qualsiasi ordine compaiano)
  let prev;
  do {
    prev = s;
    s = s.replace(new RegExp(`\\.(${EXTS})$`, 'i'), '');      // estensione finale
    s = s.replace(/_Latin-Cert_[a-z0-9]+$/i, '');             // hash latin-cert
    s = s.replace(/_compressed$/i, '');                        // marcatore compressione
    s = s.replace(new RegExp(`_(${EXTS})$`, 'i'), '');        // estensione "doppia" (_pdf)
    s = s.replace(new RegExp(`\\.(${EXTS})$`, 'i'), '');      // .pdf residuo (es. "...24.pdf_compressed")
  } while (s !== prev);
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Cache per cartella IDL: { normKey → filepath assoluto }
const _folderIndex = new Map();
function folderIndex(idl) {
  if (_folderIndex.has(idl)) return _folderIndex.get(idl);
  const dir = path.join(LOCAL_DIR, idl);
  const idx = new Map();
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (!fs.statSync(full).isFile() || f === '.DS_Store') continue;
      const k = normKey(f);
      if (!idx.has(k)) idx.set(k, full);   // primo vince in caso di chiavi uguali
    }
  }
  _folderIndex.set(idl, idx);
  return idx;
}

// Trova il file locale. Strategia: 1) match esatto, 2) variante "_ext.ext",
// 3) match per chiave normalizzata dentro la cartella IDL.
function resolveLocalPath(idl, filename, url) {
  if (!idl) return null;
  const dir = path.join(LOCAL_DIR, idl);
  if (!fs.existsSync(dir)) return null;

  const fromUrl = decodeURIComponent(url.split('/').pop());
  const names = [filename, fromUrl].filter(Boolean);

  // 1) match esatto
  for (const n of names) {
    const p = path.join(dir, n);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  // 2) variante estensione doppia: "name.pdf" → "name_pdf.pdf"
  for (const n of names) {
    const dot = n.lastIndexOf('.');
    if (dot > 0) {
      const alt = path.join(dir, n.slice(0, dot) + '_' + n.slice(dot + 1) + n.slice(dot));
      if (fs.existsSync(alt) && fs.statSync(alt).isFile()) return alt;
    }
  }
  // 3) match per chiave normalizzata
  const idx = folderIndex(idl);
  for (const n of names) {
    const hit = idx.get(normKey(n));
    if (hit) return hit;
  }
  return null;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== FASE 0 — Migrazione materiali latin-cert → Vercel Blob ===');
  console.log(APPLY ? '⚙  MODALITÀ: APPLY (scrive su Blob e DB)' : '🧪 MODALITÀ: DRY-RUN (nessuna scrittura) — usa --apply per eseguire');
  console.log(`📁 Cartella file locali: ${LOCAL_DIR}`);
  if (LIMIT) console.log(`🔢 Limite: primi ${LIMIT} record`);

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ DATABASE_URL mancante in .env'); process.exit(1);
  }
  if (APPLY && !BLOB_TOKEN) {
    console.error('\n❌ BLOB_READ_WRITE_TOKEN mancante in .env (necessario con --apply)'); process.exit(1);
  }
  if (!fs.existsSync(LOCAL_DIR)) {
    console.error(`\n❌ Cartella file locali non trovata: ${LOCAL_DIR}`); process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Solo i record ancora su Aruba (salta i già migrati su Blob)
  const { rows } = await client.query(
    `SELECT id, "lessonId", title, filename, "blobUrl"
       FROM "LessonResource"
      WHERE "blobUrl" LIKE '%${ARUBA_MARKER}%'
      ORDER BY "lessonId", "sortOrder"
      ${LIMIT ? `LIMIT ${LIMIT}` : ''}`
  );

  const { rows: [{ count: totalAll }] } = await client.query(`SELECT COUNT(*)::int AS count FROM "LessonResource"`);
  const { rows: [{ count: onBlob }] }   = await client.query(`SELECT COUNT(*)::int AS count FROM "LessonResource" WHERE "blobUrl" LIKE '%${BLOB_MARKER}%'`);

  console.log(`\n📊 LessonResource totali: ${totalAll}  |  già su Blob: ${onBlob}  |  da migrare (Aruba): ${rows.length}\n`);

  let migrated = 0, missing = 0, errors = 0, bytes = 0;
  const missingList = [];

  for (let i = 0; i < rows.length; i++) {
    const r   = rows[i];
    const idl = extractIdl(r.blobUrl);
    const localPath = resolveLocalPath(idl, r.filename, r.blobUrl);
    const tag = `[${i + 1}/${rows.length}]`;

    if (!localPath) {
      missing++;
      missingList.push({ id: r.id, idl, filename: r.filename, url: r.blobUrl });
      console.warn(`${tag} ⚠  file locale NON trovato: IDL=${idl} "${r.filename}"`);
      continue;
    }

    const size = fs.statSync(localPath).size;
    const blobPath = `materials/${r.lessonId}/${r.filename}`;

    if (!APPLY) {
      console.log(`${tag} (dry) ${blobPath}  ←  ${path.relative(process.cwd(), localPath)}  (${(size/1024).toFixed(0)} KB)`);
      migrated++; bytes += size;
      continue;
    }

    try {
      const data = fs.readFileSync(localPath);
      const blob = await put(blobPath, data, {
        access: 'public',
        token: BLOB_TOKEN,
        contentType: mimeFor(r.filename),
        addRandomSuffix: true, // evita collisioni / errori di overwrite su rilancio
      });
      await client.query(`UPDATE "LessonResource" SET "blobUrl" = $1 WHERE id = $2`, [blob.url, r.id]);
      migrated++; bytes += size;
      console.log(`${tag} ✓ ${r.filename}  →  ${blob.url}`);
    } catch (e) {
      errors++;
      console.error(`${tag} ❌ errore su "${r.filename}": ${e.message}`);
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`${APPLY ? 'Migrati' : 'Da migrare (dry-run)'}: ${migrated}`);
  console.log(`File locali mancanti: ${missing}`);
  if (APPLY) console.log(`Errori: ${errors}`);
  console.log(`Volume: ${(bytes / (1024 * 1024)).toFixed(1)} MB`);

  if (missingList.length) {
    const outFile = path.join(__dirname, 'migrate-materials-missing.json');
    fs.writeFileSync(outFile, JSON.stringify(missingList, null, 2));
    console.log(`\n⚠  ${missingList.length} file non trovati in locale → elenco in ${path.relative(process.cwd(), outFile)}`);
    console.log('   (questi record restano su latin-cert.org finché non risolti)');
  }

  if (!APPLY) console.log('\n👉 Tutto ok? Rilancia con  --apply  per eseguire la migrazione reale.');

  await client.end();
}

main().catch(err => {
  console.error('\nERRORE FATALE:', err.message);
  process.exit(1);
});
