const { Client } = require('/tmp/npm_pg/node_modules/pg');
const DB = "postgresql://neondb_owner:npg_wRBXT6Azv0Vj@ep-late-sea-aqyed9xw-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  const client = new Client({ connectionString: DB });
  await client.connect();

  // Carica tutte le lezioni per i corsi con gap
  const { rows: allLessons } = await client.query(`
    SELECT l.id, l."latinCertId", l."sortOrder", c.lang, c.level
    FROM "Lesson" l JOIN "Course" c ON l."courseId" = c.id
    ORDER BY c.lang, c.level, l."sortOrder"
  `);
  const bySort = {};
  for (const l of allLessons) {
    bySort[`${l.lang}|${l.level}|${l.sortOrder}`] = l.id;
  }
  const byIDL = {};
  for (const l of allLessons) byIDL[l.latinCertId] = l.id;

  // Test ancora senza lessonId
  const { rows: missing } = await client.query(`
    SELECT et.id, et."latinCertId" as "IDT", et.title, et.ordine, c.lang, c.level
    FROM "ExerciseTest" et
    JOIN "Course" c ON et."courseId" = c.id
    WHERE et."lessonId" IS NULL
    ORDER BY c.lang, c.level, et.ordine
  `);
  console.log(`Test ancora senza lessonId: ${missing.length}`);
  for (const t of missing) console.log(`  IDT=${t.IDT} [${t.lang} ${t.level}] ordine=${t.ordine} "${t.title}"`);

  const updates = [];

  for (const t of missing) {
    const { id: testId, IDT, title, ordine, lang, level } = t;
    let lessonId = null, reason = '';

    // ── Greco A1.1: usa ordine come sortOrder (ordine ≈ cap numero ≈ lezione) ─
    if (!lessonId && lang === 'Greco Antico' && level === 'A1.1' && ordine < 50) {
      const key = `${lang}|${level}|${ordine}`;
      if (bySort[key]) {
        lessonId = bySort[key];
        reason = `A1.1 ordine=${ordine} → sortOrder=${ordine}`;
      }
    }

    // ── Greco A2.1: ordine=15/16/17 → sortOrder corrispondente ───────────────
    if (!lessonId && lang === 'Greco Antico' && level === 'A2.1' && ordine >= 15 && ordine <= 19) {
      const key = `${lang}|${level}|${ordine}`;
      if (bySort[key]) {
        lessonId = bySort[key];
        reason = `A2.1 ordine=${ordine} → sortOrder=${ordine}`;
      }
    }

    // ── Greco A1.2: IDT=442 "Athenaze Cap 7" → sortOrder=7 ──────────────────
    if (!lessonId && IDT === 442) {
      const key = `Greco Antico|A1.2|7`;
      if (bySort[key]) { lessonId = bySort[key]; reason = 'Athenaze Cap 7 → sortOrder=7'; }
    }

    // ── Latino A1.1: residui (Capitulum secundum, Cap1+Cap2) ─────────────────
    if (!lessonId && lang === 'Latino' && level === 'A1.1') {
      // "secundum" = II = Cap 2 → sortOrder 2
      if (title.match(/secundum/i)) {
        const key = `Latino|A1.1|2`;
        if (bySort[key]) { lessonId = bySort[key]; reason = 'Capitulum secundum → sortOrder 2'; }
      }
      // "Capitolo 1 (ripasso) + Capitolo 2" → sortOrder 2
      if (!lessonId && title.match(/Capitolo\s+1.*Capitolo\s+2/i)) {
        const key = `Latino|A1.1|2`;
        if (bySort[key]) { lessonId = bySort[key]; reason = 'Cap1+Cap2 → sortOrder 2'; }
      }
      // "Capitulum XXVI" → no match (troppo avanzato per A1.1, skip)
    }

    if (lessonId) updates.push({ testId, lessonId, reason, IDT, title });
  }

  console.log(`\nNuovi aggiornamenti: ${updates.length}`);
  for (const u of updates) {
    console.log(`  IDT=${u.IDT} "${u.title.slice(0, 55)}" → [${u.reason}]`);
  }

  for (const u of updates) {
    await client.query(`UPDATE "ExerciseTest" SET "lessonId"=$1 WHERE id=$2`, [u.lessonId, u.testId]);
  }

  // Stato finale
  const { rows } = await client.query(`
    SELECT c.lang, c.level,
      COUNT(et.id)::int as totale,
      COUNT(et."lessonId")::int as con_lesson
    FROM "ExerciseTest" et JOIN "Course" c ON et."courseId" = c.id
    GROUP BY c.lang, c.level ORDER BY c.lang, c.level
  `);
  let total = 0, conLesson = 0;
  console.log('\nStato finale:');
  for (const r of rows) {
    const mark = r.con_lesson === r.totale ? '✓' : '~';
    console.log(`  ${mark} ${r.lang} ${r.level}: ${r.con_lesson}/${r.totale}`);
    total += r.totale; conLesson += r.con_lesson;
  }
  console.log(`\nTOTALE: ${conLesson}/${total} test con lessonId (${total-conLesson} irrisolvibili)`);

  await client.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
