require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const { rows } = await c.query(`SELECT slug, lang, level, title, "sortOrder" FROM "Course" WHERE lang IN ('Latino','Greco Antico') ORDER BY lang, "sortOrder"`);
  rows.forEach(r => console.log(r.lang.slice(0,3)+' | level='+JSON.stringify(r.level)+' | '+r.slug+' | '+(r.title||'').slice(0,42)));
  await c.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
