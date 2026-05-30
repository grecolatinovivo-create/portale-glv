require("dotenv").config();
const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const q = async (s) => (await c.query(s)).rows;
  const one = async (s) => (await q(s))[0].n;
  const tot       = await one(`SELECT COUNT(*)::int n FROM "ExerciseTest"`);
  const withLesson= await one(`SELECT COUNT(*)::int n FROM "ExerciseTest" WHERE "lessonId" IS NOT NULL`);
  const withCourse= await one(`SELECT COUNT(*)::int n FROM "ExerciseTest" WHERE "courseId" IS NOT NULL`);
  const orphan    = await one(`SELECT COUNT(*)::int n FROM "ExerciseTest" WHERE "lessonId" IS NULL AND "courseId" IS NULL`);
  const sections  = await one(`SELECT COUNT(*)::int n FROM "ExerciseSection"`);
  const questions = await one(`SELECT COUNT(*)::int n FROM "ExerciseQuestion"`);
  console.log("EXSTATS " + JSON.stringify({ tot, withLesson, withCourse, orphan, sections, questions }));
  // audio/immagini con riferimenti
  const media = await q(`SELECT COUNT(*) FILTER (WHERE audio IS NOT NULL AND audio<>'') AS a, COUNT(*) FILTER (WHERE image IS NOT NULL AND image<>'') AS i FROM "ExerciseQuestion"`);
  console.log("MEDIA " + JSON.stringify(media[0]));
  // esempi di valori audio/image
  const ex = await q(`SELECT audio, image FROM "ExerciseQuestion" WHERE (audio IS NOT NULL AND audio<>'') OR (image IS NOT NULL AND image<>'') LIMIT 8`);
  console.log("MEDIA_SAMPLES " + JSON.stringify(ex));
  await c.end();
})().catch(e => { console.error("ERR", e.message); process.exit(1); });
