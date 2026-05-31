require('dotenv').config();
const { Client } = require('pg');
const DB = process.env.DATABASE_URL;
if (!DB) { console.error('ERRORE: DATABASE_URL non impostata in .env'); process.exit(1); }

async function main() {
  const client = new Client({ connectionString: DB });
  await client.connect();

  // Carica tutte le lezioni per corso con il loro sortOrder e ID Neon
  const { rows: allLessons } = await client.query(`
    SELECT l.id, l."latinCertId", l.title, l."sortOrder", c.lang, c.level, c.id as "courseId"
    FROM "Lesson" l
    JOIN "Course" c ON l."courseId" = c.id
    ORDER BY c.lang, c.level, l."sortOrder"
  `);

  // Indice: [lang+level+sortOrder] → lessonId Neon
  const bySort = {};
  for (const l of allLessons) {
    const key = `${l.lang}|${l.level}|${l.sortOrder}`;
    bySort[key] = l.id;
  }

  // Indice: latinCertId → lessonId Neon
  const byIDL = {};
  for (const l of allLessons) {
    byIDL[l.latinCertId] = l.id;
  }

  // Carica tutti i test senza lessonId
  const { rows: missing } = await client.query(`
    SELECT et.id, et."latinCertId", et.title, et.ordine, c.lang, c.level
    FROM "ExerciseTest" et
    JOIN "Course" c ON et."courseId" = c.id
    WHERE et."lessonId" IS NULL
    ORDER BY c.lang, c.level, et.ordine
  `);

  console.log(`Test senza lessonId: ${missing.length}`);

  const updates = []; // { testId, lessonId, reason }

  for (const t of missing) {
    const { id: testId, latinCertId: IDT, title, ordine, lang, level } = t;
    let lessonId = null;
    let reason = '';

    // ─── Mappings espliciti da addtext ────────────────────────────────────────
    // Latino A1.1: IDT=65 "Capitulum I" → IDL=152 (addtext "primo capitolo")
    if (IDT === 65)  { lessonId = byIDL[152]; reason = 'addtext Cap I'; }
    // Latino A1.1: IDT=209 "Capitulum IV" → IDL=203 (addtext "cap.4")
    if (IDT === 209) { lessonId = byIDL[203]; reason = 'addtext cap.4'; }
    // Greco A1.1: IDT=404 "Athenaze, Cap. 1" → IDL=289 (addtext "cap. I fino alla riga 16")
    if (IDT === 404) { lessonId = byIDL[289]; reason = 'addtext Athenaze cap. I'; }
    // Greco B1.3: IDT=351 "Athenaze Cap XXVI (195-249)" → IDL=3965 (addtext "terminato cap 26... Policrate")
    if (IDT === 351) { lessonId = byIDL[3965]; reason = 'addtext Cap XXVI seconda parte (Policrate)'; }
    // Greco B1.3: IDT=339 "Athenaze Cap XXIV (1-69)" → IDL=3955 (Cap 26 prima parte — approssimazione)
    // Nessuna lezione B1.3 copre Cap 24 → skip

    // ─── Greco B1.2: lezioni con addtext chiari sui capitoli ────────────────
    // Cap 17: IDL=1060,1082,1117,1118  Cap 18: IDL=1199-1308  Cap 19: IDL=1341-1390  Cap 20: IDL=1449-1482
    // Ma i test per B1.2 sono Cap 21-23, che NON corrispondono → skip

    // ─── Greco B1.3: Cap 26-30 match diretto da addtext ─────────────────────
    // IDT=339 "Cap XXIV (1-69)" → nessuna lezione copre Cap 24 → skip
    // IDT=340 "Cap XXIV (69-186)" → skip

    // ─── Latino B1.1/B1.2: "Test della settimana N" → sortOrder=N ───────────
    if (!lessonId) {
      const mSettimana = title.match(/[Ss]ettimana\s+(\d+)/);
      if (mSettimana) {
        const n = parseInt(mSettimana[1]);
        const key = `${lang}|${level}|${n}`;
        if (bySort[key]) {
          lessonId = bySort[key];
          reason = `settimana ${n} → sortOrder ${n}`;
        }
      }
    }

    // ─── "#N De..." → sortOrder=N (approssimazione per test tematici) ────────
    if (!lessonId && ordine === 100) {
      const mHash = title.match(/^#(\d+)\s/);
      if (mHash) {
        const n = parseInt(mHash[1]);
        const key = `${lang}|${level}|${n}`;
        if (bySort[key]) {
          lessonId = bySort[key];
          reason = `#${n} → sortOrder ${n}`;
        }
      }
    }

    // ─── "Test di autovalutazione 1" → sortOrder=1 ────────────────────────
    if (!lessonId && title.match(/autovalutazione\s+1/i)) {
      const key = `${lang}|${level}|1`;
      if (bySort[key]) {
        lessonId = bySort[key];
        reason = 'autovalutazione 1 → sortOrder 1';
      }
    }

    // ─── Logos Cap N / Athenaze Cap N → cerca nell'addtext estratto ─────────
    // (solo per corsi con pattern chiari e lezioni conosciute)
    // Latino A1.1 Cap specifici: IDT=343,316 "Cap II" → lezioni con sortOrder 2/3
    if (!lessonId && lang === 'Latino' && level === 'A1.1') {
      const mCap = title.match(/Capitulum\s+(II|2|IV|4|III|3|VIII|8|XXVI|26)/i);
      if (mCap) {
        const capMap = {
          'II': 2, '2': 2, 'III': 3, '3': 3, 'IV': 4, '4': 4,
          'VIII': 8, '8': 8, 'XXVI': 26, '26': 26
        };
        const capN = capMap[mCap[1].toUpperCase()] || null;
        if (capN) {
          // Cerca prima lezione con quel sortOrder (se Cap=sortOrder per A1.1)
          // Mapping cap → sortOrder per A1.1 (da addtext)
          // IDL=152 sortOrder=1 → Cap 1
          // IDL=203 sortOrder=5 → Cap 4
          // IDL=218 sortOrder=8 → Cap 6 start
          // IDL=229 sortOrder=9 → Cap 6 end
          // Per Cap 2/3 non abbiamo addtext → uso sortOrder 2/3 come guess
          const capToSort = { 2: 2, 3: 3, 4: 5, 8: 8, 26: null };
          const s = capToSort[capN];
          if (s) {
            const key = `Latino|A1.1|${s}`;
            if (bySort[key]) {
              lessonId = bySort[key];
              reason = `Capitulum ${capN} → sortOrder ${s} (heuristic)`;
            }
          }
        }
      }
    }

    if (lessonId) {
      updates.push({ testId, lessonId, reason, IDT, title });
    }
  }

  console.log(`\nAggiornamenti trovati: ${updates.length}`);
  for (const u of updates) {
    console.log(`  IDT=${u.IDT} "${u.title.slice(0, 50)}" → ${u.lessonId} [${u.reason}]`);
  }

  if (updates.length === 0) {
    console.log('Niente da aggiornare.');
    await client.end();
    return;
  }

  // Applica aggiornamenti
  let ok = 0;
  for (const u of updates) {
    await client.query(
      `UPDATE "ExerciseTest" SET "lessonId" = $1 WHERE id = $2`,
      [u.lessonId, u.testId]
    );
    ok++;
  }
  console.log(`\n✓ Aggiornati ${ok} test.`);

  // Riepilogo finale
  const { rows } = await client.query(`
    SELECT c.lang, c.level,
      COUNT(et.id) as totale,
      COUNT(et."lessonId") as con_lesson
    FROM "ExerciseTest" et
    JOIN "Course" c ON et."courseId" = c.id
    GROUP BY c.lang, c.level, c.id
    ORDER BY c.lang, c.level
  `);
  console.log('\nStato finale per corso:');
  let totalCon = 0, totalAll = 0;
  for (const r of rows) {
    console.log(`  ${r.lang} ${r.level}: ${r.con_lesson}/${r.totale}`);
    totalCon += parseInt(r.con_lesson);
    totalAll += parseInt(r.totale);
  }
  console.log(`\nTOTALE: ${totalCon}/${totalAll} test con lessonId`);

  await client.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
