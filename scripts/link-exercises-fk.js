/**
 * link-exercises-fk.js
 *
 * USA SOLO LE FOREIGN KEY DEL DATABASE SQL — nessuna euristica.
 *
 * 1. Carica /tmp/fk_data.json (prodotto da extract-fk-data.py)
 * 2. Tenta di aggiornare Lesson.latinCertId per le lezioni mancanti (via Vimeo URL match)
 *    — salta duplicati (unique constraint): queste lezioni condividono video con altri corsi
 * 3. Resetta TUTTI gli ExerciseTest.lessonId a NULL
 * 4. Collega ExerciseTest.lessonId usando:
 *    lezione.IDL (= Lesson.latinCertId) → lezione.FK_IDT (= ExerciseTest.latinCertId)
 */

const { Client } = require('pg');
const fs = require('fs');

require('dotenv').config();
const CONN = process.env.DATABASE_URL;
if (!CONN) { console.error('ERRORE: DATABASE_URL non impostata in .env'); process.exit(1); }
const FK_DATA = '/tmp/fk_data.json';

(async () => {
  const fkData = JSON.parse(fs.readFileSync(FK_DATA, 'utf-8'));
  const videoRows = fkData.video;       // [{idl, link}, ...]
  const lezioneFk = fkData.lezione_fk;  // [{idl, idt}, ...]

  const client = new Client({ connectionString: CONN });
  await client.connect();
  console.log('Connesso a Neon.\n');

  // ─── STEP 1: Aggiorna Lesson.latinCertId per le lezioni mancanti ───────────
  console.log('STEP 1: Match Vimeo URL → latinCertId per lezioni mancanti...');

  const missingRes = await client.query(`
    SELECT id, "vimeoUrl" FROM "Lesson"
    WHERE "latinCertId" IS NULL AND "vimeoUrl" IS NOT NULL
  `);
  console.log(`  Lezioni senza latinCertId con vimeoUrl: ${missingRes.rows.length}`);

  const vimeoToIdl = new Map();
  for (const v of videoRows) {
    const normalized = v.link.replace(/\/+$/, '').split('?')[0];
    // Se ci sono più video per lo stesso link, teniamo il primo trovato
    if (!vimeoToIdl.has(normalized)) {
      vimeoToIdl.set(normalized, v.idl);
    }
  }

  let updatedLatinCertId = 0;
  for (const lesson of missingRes.rows) {
    const normalized = lesson.vimeoUrl.replace(/\/+$/, '').split('?')[0];
    const idl = vimeoToIdl.get(normalized);
    if (idl === undefined) {
      console.log(`  ✗ Nessun match vimeo per: ${lesson.vimeoUrl}`);
      continue;
    }
    try {
      await client.query(
        `UPDATE "Lesson" SET "latinCertId" = $1 WHERE id = $2`,
        [idl, lesson.id]
      );
      console.log(`  ✓ Lesson ${lesson.id} → latinCertId=${idl}`);
      updatedLatinCertId++;
    } catch (e) {
      if (e.code === '23505') {
        // Duplicate: questo IDL è già usato da un'altra lezione (video condiviso tra corsi)
        console.log(`  ⚠ Saltata (IDL=${idl} già usato, video condiviso): ${lesson.vimeoUrl}`);
      } else {
        throw e;
      }
    }
  }
  console.log(`  Aggiornate: ${updatedLatinCertId} lezioni con latinCertId`);

  const stillMissing = await client.query(
    `SELECT COUNT(*) cnt FROM "Lesson" WHERE "latinCertId" IS NULL`
  );
  console.log(`  Lezioni ancora senza latinCertId: ${stillMissing.rows[0].cnt}\n`);

  // ─── STEP 2: Reset TUTTI gli ExerciseTest.lessonId a NULL ───────────────────
  console.log('STEP 2: Reset ExerciseTest.lessonId → NULL...');
  const resetRes = await client.query(`UPDATE "ExerciseTest" SET "lessonId" = NULL`);
  console.log(`  Resettati: ${resetRes.rowCount} ExerciseTest\n`);

  // ─── STEP 3: Carica mapping latinCertId → Lesson.id da Neon ─────────────────
  console.log('STEP 3: Carico mapping Lesson.latinCertId → Lesson.id da Neon...');
  const lessonRes = await client.query(
    `SELECT id, "latinCertId" FROM "Lesson" WHERE "latinCertId" IS NOT NULL`
  );
  const idlToLessonId = new Map();
  for (const row of lessonRes.rows) {
    idlToLessonId.set(row.latinCertId, row.id);
  }
  console.log(`  Lezioni con latinCertId: ${idlToLessonId.size}`);

  // ─── STEP 4: Carica mapping ExerciseTest.latinCertId → ExerciseTest.id ───────
  console.log('\nSTEP 4: Carico mapping ExerciseTest.latinCertId → ExerciseTest.id...');
  const testRes = await client.query(
    `SELECT id, "latinCertId" FROM "ExerciseTest" WHERE "latinCertId" IS NOT NULL`
  );
  const idtToTestId = new Map();
  for (const row of testRes.rows) {
    idtToTestId.set(row.latinCertId, row.id);
  }
  console.log(`  ExerciseTest con latinCertId: ${idtToTestId.size}`);

  // ─── STEP 5: Applica i collegamenti FK ──────────────────────────────────────
  console.log('\nSTEP 5: Collego ExerciseTest.lessonId via FK (lezione.IDL → lezione.FK_IDT)...');

  let linked = 0;
  let skippedNoLesson = 0;
  let skippedNoTest = 0;
  const linked_detail = [];

  for (const { idl, idt } of lezioneFk) {
    const lessonId = idlToLessonId.get(idl);
    if (!lessonId) {
      skippedNoLesson++;
      continue;
    }
    const testId = idtToTestId.get(idt);
    if (!testId) {
      skippedNoTest++;
      continue;
    }

    await client.query(
      `UPDATE "ExerciseTest" SET "lessonId" = $1 WHERE id = $2`,
      [lessonId, testId]
    );
    linked++;
    linked_detail.push({ idl, idt, lessonId, testId });
  }

  console.log(`\n  ✅ Collegati: ${linked} ExerciseTest a Lezioni Neon`);
  console.log(`  ⚠️  Saltati (lezione IDL non in Neon): ${skippedNoLesson}`);
  console.log(`  ⚠️  Saltati (test IDT non importato): ${skippedNoTest}`);

  // ─── Verifica finale ─────────────────────────────────────────────────────────
  const finalRes = await client.query(
    `SELECT COUNT(*) total, COUNT("lessonId") with_lid FROM "ExerciseTest"`
  );
  console.log(`\n  Stato finale ExerciseTest: ${finalRes.rows[0].with_lid}/${finalRes.rows[0].total} con lessonId`);

  // Verifica che i linked abbiano lessonId con vimeoUrl (video Vimeo associato)
  const vimeoCheck = await client.query(`
    SELECT COUNT(*) cnt FROM "ExerciseTest" et
    JOIN "Lesson" l ON l.id = et."lessonId"
    WHERE l."vimeoUrl" IS NOT NULL
  `);
  console.log(`  ExerciseTest collegati a lezioni con video Vimeo: ${vimeoCheck.rows[0].cnt}`);

  fs.writeFileSync('/tmp/linked_exercises.json', JSON.stringify(linked_detail, null, 2));
  console.log(`\n  Dettaglio salvato in /tmp/linked_exercises.json`);

  await client.end();
  console.log('\nFatto.');
})().catch(e => {
  console.error('ERRORE:', e.message);
  process.exit(1);
});
