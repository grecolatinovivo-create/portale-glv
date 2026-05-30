// scripts/check-exercises.js — READ ONLY
// Verifica stato esercizi autocorrettivi: collegamento a lezioni/corsi e media (audio/immagini).
// Uso:  node scripts/check-exercises.js
require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const q = async (s, p) => (await c.query(s, p)).rows;

  console.log('\n=== ESERCIZI — STATO COLLEGAMENTI ===');
  const [agg] = await q(`
    SELECT
      COUNT(*)::int AS tot,
      COUNT(*) FILTER (WHERE "lessonId" IS NOT NULL)::int AS with_lesson,
      COUNT(*) FILTER (WHERE "courseId" IS NOT NULL)::int AS with_course,
      COUNT(*) FILTER (WHERE "lessonId" IS NULL AND "courseId" IS NULL)::int AS orphan
    FROM "ExerciseTest"`);
  console.log(agg);

  const [secq] = await q(`SELECT
    (SELECT COUNT(*)::int FROM "ExerciseSection") AS sezioni,
    (SELECT COUNT(*)::int FROM "ExerciseQuestion") AS domande`);
  console.log(secq);

  console.log('\n=== TEST PER CORSO (con/ senza lezione) ===');
  const perCourse = await q(`
    SELECT c.slug, c.title,
           COUNT(t.id)::int AS test_totali,
           COUNT(t.id) FILTER (WHERE t."lessonId" IS NOT NULL)::int AS test_su_lezione
    FROM "ExerciseTest" t
    LEFT JOIN "Course" c ON c.id = t."courseId"
    GROUP BY c.slug, c.title
    ORDER BY test_totali DESC`);
  console.table(perCourse);

  console.log('\n=== LEZIONI CHE HANNO ESERCIZI (prime 30) ===');
  const perLesson = await q(`
    SELECT l.title AS lezione, c.slug AS corso, COUNT(t.id)::int AS n_test
    FROM "ExerciseTest" t
    JOIN "Lesson" l ON l.id = t."lessonId"
    JOIN "Course" c ON c.id = l."courseId"
    GROUP BY l.title, c.slug
    ORDER BY c.slug, l.title
    LIMIT 30`);
  console.table(perLesson);

  console.log('\n=== MEDIA (audio/immagini) NELLE DOMANDE ===');
  const [media] = await q(`
    SELECT
      COUNT(*) FILTER (WHERE audio IS NOT NULL AND audio <> '')::int AS con_audio,
      COUNT(*) FILTER (WHERE image IS NOT NULL AND image <> '')::int AS con_immagine
    FROM "ExerciseQuestion"`);
  console.log(media);

  console.log('\n--- esempi di valori audio/image (per capire se puntano ad Aruba) ---');
  const samples = await q(`
    SELECT audio, image FROM "ExerciseQuestion"
    WHERE (audio IS NOT NULL AND audio <> '') OR (image IS NOT NULL AND image <> '')
    LIMIT 12`);
  samples.forEach(s => console.log('  audio:', s.audio || '-', '| image:', s.image || '-'));

  // quanti riferimenti contengono latin-cert / classroomresources nel campo data o media
  const [aruba] = await q(`
    SELECT COUNT(*)::int AS n FROM "ExerciseQuestion"
    WHERE audio ILIKE '%latin-cert%' OR image ILIKE '%latin-cert%'
       OR audio ILIKE '%classroomresources%' OR image ILIKE '%classroomresources%'`);
  console.log('\nDomande con media che puntano a latin-cert/Aruba:', aruba.n);

  await c.end();
  console.log('\n✓ fatto (nessuna modifica al DB)\n');
})().catch(e => { console.error('ERRORE:', e.message); process.exit(1); });
