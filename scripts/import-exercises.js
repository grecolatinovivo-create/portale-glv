/**
 * import-exercises.js
 * -------------------
 * Importa gli esercizi autocorrettivi estratti da latin-cert
 * nel database Neon del portale.
 *
 * Prerequisiti:
 *   - scripts/exercises_export.json (generato da extract-exercises.py)
 *   - DATABASE_URL in .env
 *   - Tabelle ExerciseTest, ExerciseSection, ExerciseQuestion presenti (prisma db push)
 *
 * Uso:
 *   node scripts/import-exercises.js
 *
 * Re-runnabile: cancella e ricrea tutti i record ExerciseTest a ogni esecuzione.
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

function cuid() {
  return randomBytes(12).toString('hex').slice(0, 25);
}

// ── Carica il JSON degli esercizi ─────────────────────────────────────────────
const exportPath = path.join(__dirname, 'exercises_export.json');
if (!fs.existsSync(exportPath)) {
  console.error('ERRORE: exercises_export.json non trovato. Esegui prima extract-exercises.py');
  process.exit(1);
}
const tests = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
console.log(`Caricati ${tests.length} test da exercises_export.json`);

// ── Connessione Neon ──────────────────────────────────────────────────────────
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connesso a Neon.');

  // ── 1. Carica mapping classroom IDCR → Course.id (tramite Lesson.latinCertId) ──
  // La strategia: un classroom IDCR è collegato a lezioni tramite latin-cert.
  // Ma nel portale non abbiamo una tabella classroom → course diretta.
  // Usiamo invece la corrispondenza tra IDCR e il courseId:
  // Da Lesson possiamo ricavare courseId; ma Lesson non ha IDCR direttamente.
  // Usiamo il file exercises_export.json che include classroomNames → match per nome/slug.

  // Carica tutti i corsi con slug e titolo
  const { rows: courses } = await client.query(
    `SELECT id, slug, title, lang, level FROM "Course" ORDER BY slug`
  );
  console.log(`Trovati ${courses.length} corsi in Neon.`);

  // Mappa slug → Course
  const courseBySlug = {};
  for (const c of courses) courseBySlug[c.slug] = c;

  // ── 2. Pulizia tabelle esercizi esistenti ─────────────────────────────────
  console.log('\nPulizia tabelle esercizi esistenti...');
  await client.query('DELETE FROM "ExerciseQuestion"');
  await client.query('DELETE FROM "ExerciseSection"');
  await client.query('DELETE FROM "ExerciseTest"');
  console.log('  → Tabelle svuotate.');

  // ── 3. Import ─────────────────────────────────────────────────────────────
  let importedTests = 0;
  let importedSections = 0;
  let importedQuestions = 0;
  let linkedToCourse = 0;

  console.log('\nImport in corso...');

  for (const test of tests) {
    // Prova a collegare il test a un corso tramite classroomNames
    // Convention di naming: il nome classroom è spesso "IDCR - NomeCorso" o simile
    // Facciamo un match fuzzy semplice: se il nome classroom contiene slug o livello+lingua
    let courseId = null;

    // Cerca match per lingua + livello nel titolo del test
    if (!courseId && test.lingua && test.livello) {
      const lingua = test.lingua.toLowerCase();
      const livello = test.livello.toLowerCase().replace(/\s+/g, '');
      for (const c of courses) {
        const cLang = (c.lang || '').toLowerCase();
        const cLevel = (c.level || '').toLowerCase().replace(/\s+/g, '');
        if (cLang.includes(lingua) && cLevel === livello) {
          // Unico match esatto lingua + livello → collegalo
          // (se ci sono più corsi con stessa lingua/livello, lascia null)
          if (!courseId) {
            courseId = c.id;
          } else {
            // ambiguo → non collegare
            courseId = null;
            break;
          }
        }
      }
    }

    const testId = cuid();

    await client.query(
      `INSERT INTO "ExerciseTest"
         (id, "latinCertId", title, description, "isPublic", lingua, livello, metodo, ordine, "courseId", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
      [
        testId,
        test.IDT,
        (test.title || '').slice(0, 255),
        test.description,
        test.isPublic,
        test.lingua,
        test.livello,
        test.metodo,
        test.ordine,
        courseId,
      ]
    );
    if (courseId) linkedToCourse++;
    importedTests++;

    // Sezioni
    for (let si = 0; si < test.sections.length; si++) {
      const sec = test.sections[si];
      const sectionId = cuid();

      await client.query(
        `INSERT INTO "ExerciseSection"
           (id, "latinCertId", "testId", name, "timeMinutes", "sortOrder")
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [sectionId, sec.IDS, testId, (sec.name || 'Sezione').slice(0, 128), sec.timeMinutes || 5, si]
      );
      importedSections++;

      // Domande
      for (let qi = 0; qi < sec.questions.length; qi++) {
        const q = sec.questions[qi];
        const questionId = cuid();

        // Normalizza data: se è array vuoto o oggetto vuoto, metti {}
        let data = q.data;
        if (!data || (Array.isArray(data) && data.length === 0)) data = {};

        await client.query(
          `INSERT INTO "ExerciseQuestion"
             (id, "latinCertId", "sectionId", "questionType", "sortOrder",
              title, instruction, "contextText", audio, image, data)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            questionId,
            q.IDQL,
            sectionId,
            q.questionType,
            q.sortOrder || qi,
            q.title ? q.title.slice(0, 255) : null,
            q.instruction,
            q.contextText,
            q.audio,
            q.image,
            JSON.stringify(data),
          ]
        );
        importedQuestions++;
      }
    }

    if (importedTests % 20 === 0) {
      process.stdout.write(`  ${importedTests}/${tests.length} test...\r`);
    }
  }

  // ── 4. Riepilogo ─────────────────────────────────────────────────────────
  const { rows: [{ count: countTests }] } = await client.query('SELECT COUNT(*) FROM "ExerciseTest"');
  const { rows: [{ count: countSecs }] } = await client.query('SELECT COUNT(*) FROM "ExerciseSection"');
  const { rows: [{ count: countQs }] } = await client.query('SELECT COUNT(*) FROM "ExerciseQuestion"');

  console.log('\n');
  console.log('════════════════════════════════════════════');
  console.log('IMPORT COMPLETATO');
  console.log('════════════════════════════════════════════');
  console.log(`ExerciseTest:     ${countTests} record`);
  console.log(`ExerciseSection:  ${countSecs} record`);
  console.log(`ExerciseQuestion: ${countQs} record`);
  console.log(`Test collegati a un corso: ${linkedToCourse}/${importedTests}`);
  console.log('════════════════════════════════════════════');

  // Dettaglio per tipo di domanda
  const { rows: typeCounts } = await client.query(
    `SELECT "questionType", COUNT(*) as cnt FROM "ExerciseQuestion" GROUP BY "questionType" ORDER BY cnt DESC`
  );
  console.log('\nDistribuzione per tipo:');
  for (const r of typeCounts) {
    console.log(`  ${r.questionType.padEnd(22)} ${r.cnt}`);
  }

  // Test collegati a corso
  const { rows: linked } = await client.query(
    `SELECT et.title, et.lingua, et.livello, c.title as corso
     FROM "ExerciseTest" et JOIN "Course" c ON et."courseId" = c.id
     ORDER BY c.title, et.ordine
     LIMIT 30`
  );
  if (linked.length > 0) {
    console.log('\nTest collegati a corsi:');
    for (const r of linked) {
      console.log(`  [${r.lingua} ${r.livello}] ${r.title} → ${r.corso}`);
    }
  }

  await client.end();
  console.log('\n✓ Completato.');
}

main().catch(err => {
  console.error('Errore:', err.message);
  process.exit(1);
});
