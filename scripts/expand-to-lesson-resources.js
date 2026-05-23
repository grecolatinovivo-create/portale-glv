/**
 * expand-to-lesson-resources.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Converte i CourseResource (file per corso) in LessonResource (file per lezione).
 *
 * LOGICA:
 * 1. Legge tutti i CourseResource dal DB (hanno già blobUrl da Vercel Blob)
 * 2. Per ogni CourseResource, trova TUTTE le lezioni di quel corso
 * 3. Crea un LessonResource per ogni (lezione × file), riusando il blobUrl
 * 4. Cancella tutti i LessonResource precedenti con blobUrl = NULL (compiti vecchi)
 * 5. Cancella tutti i CourseResource (non più necessari)
 *
 * RISULTATO: ogni lezione avrà i materiali del suo corso visibili nel film strip.
 */

require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  console.log('✅ DB connesso\n');

  // ── 1. Leggi tutti i CourseResource con blobUrl ───────────────────────────
  const { rows: courseResources } = await db.query(`
    SELECT cr.id, cr."courseId", cr.title, cr.filename, cr."blobUrl", cr."fileType", cr."sortOrder",
           c.title AS "courseTitle"
    FROM "CourseResource" cr
    JOIN "Course" c ON c.id = cr."courseId"
    WHERE cr."blobUrl" IS NOT NULL
    ORDER BY cr."courseId", cr."sortOrder"
  `);
  console.log(`📦 CourseResource con blobUrl: ${courseResources.length}`);

  if (courseResources.length === 0) {
    console.log('Nessun CourseResource da convertire. Esco.');
    await db.end();
    return;
  }

  // ── 2. Per ogni corso unico, recupera le lezioni ──────────────────────────
  const courseIds = [...new Set(courseResources.map(r => r.courseId))];
  const lessonsByCourse = {};
  for (const courseId of courseIds) {
    const { rows } = await db.query(
      `SELECT id, title FROM "Lesson" WHERE "courseId" = $1 ORDER BY "sortOrder"`,
      [courseId]
    );
    lessonsByCourse[courseId] = rows;
  }

  // Riepilogo
  for (const courseId of courseIds) {
    const lessons = lessonsByCourse[courseId];
    const files   = courseResources.filter(r => r.courseId === courseId);
    const title   = files[0]?.courseTitle || courseId;
    console.log(`  📚 "${title}" → ${lessons.length} lezioni × ${files.length} file = ${lessons.length * files.length} LessonResource`);
  }

  // ── 3. Cancella LessonResource senza blobUrl (compiti vecchi) ────────────
  const { rowCount: deletedNull } = await db.query(
    `DELETE FROM "LessonResource" WHERE "blobUrl" IS NULL`
  );
  console.log(`\n🗑  Cancellati ${deletedNull} LessonResource senza blobUrl (compiti vecchi)`);

  // ── 4. Cancella LessonResource che già vengono dai classroomresources ─────
  //    (eventuale re-run: evita duplicati)
  const { rowCount: deletedOld } = await db.query(
    `DELETE FROM "LessonResource" WHERE "blobUrl" IS NOT NULL`
  );
  if (deletedOld > 0) {
    console.log(`🗑  Cancellati ${deletedOld} LessonResource con blobUrl (da run precedente)`);
  }

  // ── 5. Crea LessonResource per ogni (lezione × file) ─────────────────────
  let inserted = 0;
  let skipped  = 0;

  for (const cr of courseResources) {
    const lessons = lessonsByCourse[cr.courseId] || [];
    if (lessons.length === 0) {
      console.log(`  ⚠️  Nessuna lezione per corso "${cr.courseTitle}" — file "${cr.filename}" saltato`);
      skipped++;
      continue;
    }

    for (const lesson of lessons) {
      await db.query(`
        INSERT INTO "LessonResource" (id, "lessonId", title, filename, "blobUrl", "fileType", "sortOrder", "createdAt")
        VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, NOW())
      `, [lesson.id, cr.title, cr.filename, cr.blobUrl, cr.fileType, cr.sortOrder]);
      inserted++;
    }
  }

  console.log(`\n✅ Inseriti ${inserted} LessonResource`);
  if (skipped > 0) console.log(`⚠️  Saltati ${skipped} file (corso senza lezioni)`);

  // ── 6. Cancella tutti i CourseResource (ora ridondanti) ───────────────────
  const { rowCount: deletedCR } = await db.query(`DELETE FROM "CourseResource"`);
  console.log(`🗑  Cancellati ${deletedCR} CourseResource`);

  // ── 7. Verifica finale ────────────────────────────────────────────────────
  const { rows: [{ cnt }] } = await db.query(
    `SELECT COUNT(*) as cnt FROM "LessonResource" WHERE "blobUrl" IS NOT NULL`
  );
  console.log(`\n📊 LessonResource totali con blobUrl: ${cnt}`);

  // Sample: mostra per corso
  const { rows: sample } = await db.query(`
    SELECT c.title AS corso, COUNT(lr.id) AS file_per_lezione, COUNT(DISTINCT lr."lessonId") AS lezioni
    FROM "LessonResource" lr
    JOIN "Lesson" l ON l.id = lr."lessonId"
    JOIN "Course" c ON c.id = l."courseId"
    WHERE lr."blobUrl" IS NOT NULL
    GROUP BY c.title
    ORDER BY c.title
  `);

  console.log('\n📚 Materiali per corso:');
  for (const r of sample) {
    console.log(`  ${r.corso}: ${r.lezioni} lezioni, ${r.file_per_lezione} LessonResource totali`);
  }

  await db.end();
  console.log('\n🎉 FATTO. Esegui il push su Vercel e testa il film strip.');
}

main().catch(console.error);
