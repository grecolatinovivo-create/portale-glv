/**
 * verify-resources.js
 * Verifica lo stato dei materiali per ogni corso del portale.
 * Confronta FTP (latin-cert) vs Neon DB (CourseResource).
 */
require('dotenv').config();
const { Client } = require('pg');
const ftp = require('basic-ftp');
const idlMap = require('./idl-lesson-map.json');

const REMOTE_BASE = '/www.latin-cert.org/classroomresources';

async function main() {
  // ── DB Neon via pg ─────────────────────────────────────────────────────────
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const { rows: courses } = await db.query(`
    SELECT c.id, c.title,
           COUNT(r.id)::int AS resource_count
    FROM "Course" c
    LEFT JOIN "CourseResource" r ON r."courseId" = c.id
    GROUP BY c.id, c.title
    ORDER BY c.title
  `);

  // ── IDCR → courseTitle da idl-lesson-map ───────────────────────────────────
  const idcrToTitle = {};
  for (const d of Object.values(idlMap)) {
    if (!idcrToTitle[d.idcr]) idcrToTitle[d.idcr] = d.courseTitle;
  }
  const titleToIdcr = {};
  for (const [idcr, title] of Object.entries(idcrToTitle)) titleToIdcr[title] = Number(idcr);

  // ── FTP ────────────────────────────────────────────────────────────────────
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = false;
  await ftpClient.access({
    host: 'ftp.latin-cert.org', port: 21,
    user: '7686675@aruba.it', password: process.env.FTP_PASSWORD, secure: false,
  });

  console.log('\n══════════════════════════════════════════════════════');
  console.log('VERIFICA MATERIALI CORSI — portale GLV');
  console.log('══════════════════════════════════════════════════════\n');

  const problems = [];
  let totalDb = 0;

  for (const course of courses) {
    const idcr = titleToIdcr[course.title];
    const dbCount = course.resource_count;
    totalDb += dbCount;

    let ftpCount = 0;
    if (idcr) {
      try {
        const list = await ftpClient.list(`${REMOTE_BASE}/${idcr}`);
        ftpCount = list.filter(f => f.type === ftp.FileType.File).length;
      } catch { ftpCount = 0; }
    }

    if (ftpCount === 0 && dbCount === 0) {
      console.log(`⬜ ${course.title} — nessun materiale`);
    } else if (dbCount >= ftpCount && ftpCount > 0) {
      console.log(`✅ ${course.title} — ${dbCount} file`);
    } else if (ftpCount > dbCount) {
      console.log(`❌ ${course.title} — DB: ${dbCount} / FTP: ${ftpCount} — MANCANO ${ftpCount - dbCount}`);
      problems.push({ title: course.title, id: course.id, idcr, ftpCount, dbCount });
    } else if (dbCount > 0 && ftpCount === 0) {
      console.log(`✅ ${course.title} — ${dbCount} file (FTP non disponibile o già rimosso)`);
    }
  }

  ftpClient.close();
  await db.end();

  console.log('\n══════════════════════════════════════════════════════');
  console.log(`Corsi totali:        ${courses.length}`);
  console.log(`File totali in DB:   ${totalDb}`);

  if (problems.length === 0) {
    console.log('\n🎉 Tutto in ordine — nessun file mancante.');
  } else {
    console.log(`\n❌ PROBLEMI (${problems.length} corsi con file mancanti):`);
    problems.forEach(p =>
      console.log(`  IDCR ${p.idcr} — ${p.title}: ${p.dbCount}/${p.ftpCount} migrati`)
    );
    console.log('\nEsegui: node scripts/migrate-classroomresources.js');
  }
  console.log('══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
