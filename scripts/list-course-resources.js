/**
 * list-course-resources.js
 * Elenca tutti i file migrati, raggruppati per corso.
 * Serve per verificare quali associazioni sono corrette e quali vanno cancellate.
 */
require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const { rows } = await db.query(`
    SELECT c.title AS course, r.id, r.filename, r.title AS file_title
    FROM "CourseResource" r
    JOIN "Course" c ON c.id = r."courseId"
    ORDER BY c.title, r."sortOrder"
  `);

  await db.end();

  let currentCourse = null;
  for (const row of rows) {
    if (row.course !== currentCourse) {
      currentCourse = row.course;
      console.log(`\n📁 ${row.course}`);
    }
    console.log(`   [${row.id}] ${row.filename}`);
  }
  console.log(`\nTotale file: ${rows.length}`);
}

main().catch(console.error);
