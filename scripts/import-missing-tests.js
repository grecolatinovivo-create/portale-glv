/**
 * import-missing-tests.js
 * Importa i 39 test (public=0) collegati a lezioni Neon via FK
 * che erano stati esclusi dall'import originale.
 *
 * Usa la stessa logica di import-exercises.js ma con /tmp/missing_exercises.json.
 */

const { Client } = require('pg');
const fs = require('fs');
const crypto = require('crypto');

const CONN = 'postgresql://neondb_owner:npg_wRBXT6Azv0Vj@ep-late-sea-aqyed9xw-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const DATA = '/tmp/missing_exercises.json';

function genId() {
  return crypto.randomBytes(12).toString('hex');
}

(async () => {
  const tests = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
  console.log(`Caricati ${tests.length} test da importare`);

  const client = new Client({ connectionString: CONN });
  await client.connect();
  console.log('Connesso a Neon.\n');

  // Controlla quali IDT esistono già
  const existingRes = await client.query(`SELECT "latinCertId" FROM "ExerciseTest"`);
  const existingIdts = new Set(existingRes.rows.map(r => r.latinCertId));
  console.log(`ExerciseTest esistenti: ${existingIdts.size}`);

  const toImport = tests.filter(t => !existingIdts.has(t.IDT));
  const alreadyIn = tests.filter(t => existingIdts.has(t.IDT));
  console.log(`Da importare: ${toImport.length} | Già presenti: ${alreadyIn.length}\n`);

  if (toImport.length === 0) {
    console.log('Nulla da importare.');
    await client.end();
    return;
  }

  // Import ExerciseTest
  // Schema reale:
  // ExerciseTest: id, latinCertId, title, description, isPublic, lingua, livello, metodo, ordine, courseId, createdAt, lessonId
  // ExerciseSection: id, latinCertId, testId, name, timeMinutes, sortOrder
  // ExerciseQuestion: id, latinCertId, sectionId, questionType, sortOrder, title, instruction, contextText, audio, image, data

  console.log('Inserimento ExerciseTest...');
  const testIds = new Map(); // latinCertId → Neon id
  for (const t of toImport) {
    const id = genId();
    await client.query(
      `INSERT INTO "ExerciseTest" (id, "latinCertId", title, description, "isPublic", lingua, livello, metodo, ordine, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [id, t.IDT, t.title, t.description || '', false, t.lingua, t.livello, t.metodo, t.ordine || 100]
    );
    testIds.set(t.IDT, id);
    process.stdout.write(`  ✓ IDT=${t.IDT} '${t.title}'\n`);
  }

  // Import ExerciseSection
  console.log('\nInserimento ExerciseSection...');
  const sectionIds = new Map(); // IDS → Neon id
  let secCount = 0;
  for (const t of toImport) {
    const testId = testIds.get(t.IDT);
    for (let i = 0; i < t.sections.length; i++) {
      const sec = t.sections[i];
      const id = genId();
      await client.query(
        `INSERT INTO "ExerciseSection" (id, "latinCertId", "testId", name, "timeMinutes", "sortOrder")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, sec.IDS, testId, sec.name, sec.timeMinutes || 5, i + 1]
      );
      sectionIds.set(sec.IDS, id);
      secCount++;
    }
  }
  console.log(`  Inserite: ${secCount} sezioni`);

  // Import ExerciseQuestion
  console.log('\nInserimento ExerciseQuestion...');
  let qCount = 0;
  for (const t of toImport) {
    for (const sec of t.sections) {
      const sectionId = sectionIds.get(sec.IDS);
      for (let i = 0; i < sec.questions.length; i++) {
        const q = sec.questions[i];
        const id = genId();
        await client.query(
          `INSERT INTO "ExerciseQuestion" (id, "latinCertId", "sectionId", "questionType", "sortOrder", title, instruction, "contextText", audio, image, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            id, q.IDQL, sectionId,
            q.questionType,
            q.sortOrder || i,
            q.title,
            q.instruction,
            q.contextText,
            q.audio,
            q.image,
            JSON.stringify(q.data || {}),
          ]
        );
        qCount++;
      }
    }
  }
  console.log(`  Inserite: ${qCount} domande`);

  // Verifica finale
  const finalRes = await client.query(`
    SELECT COUNT(*) total FROM "ExerciseTest"
  `);
  const secFinal = await client.query(`SELECT COUNT(*) FROM "ExerciseSection"`);
  const qFinal = await client.query(`SELECT COUNT(*) FROM "ExerciseQuestion"`);
  console.log(`\nStato finale:`);
  console.log(`  ExerciseTest: ${finalRes.rows[0].total}`);
  console.log(`  ExerciseSection: ${secFinal.rows[0].count}`);
  console.log(`  ExerciseQuestion: ${qFinal.rows[0].count}`);

  await client.end();
  console.log('\nFatto.');
})().catch(e => {
  console.error('ERRORE:', e.message);
  process.exit(1);
});
