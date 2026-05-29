// scripts/audit-db.js — AUDIT COMPLETO READ-ONLY del database Neon
// Esegue SOLO letture (findMany / count). NON modifica nulla.
// Uso:  node scripts/audit-db.js
//
// Produce il report richiesto:
//  1. Nome corso, slug, tier, lingua
//  2. N° lezioni
//  3. N° lezioni con vimeoUrl valido (non vuoto)
//  4. N° lezioni con vimeoUrl vuoto/NULL
//  5. N° lezioni con materiali (LessonResource)
//  6. Lezioni doppie (stesso titolo o stesso vimeoUrl, nello stesso corso o tra corsi)
//  7. Buchi nel sortOrder
//  8. Corsi senza lezioni

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function norm(s) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function main() {
  const courses = await prisma.course.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      lessons: {
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { resources: true } } },
      },
    },
  });

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`AUDIT DATABASE NEON — ${new Date().toISOString()}`);
  console.log(`Corsi totali: ${courses.length}`);
  console.log('══════════════════════════════════════════════════════════════\n');

  // ── Tabella principale ──────────────────────────────────────────────
  const rows = [];
  const emptyCourses = [];
  const gapsReport = [];

  for (const c of courses) {
    const lessons = c.lessons;
    const total = lessons.length;
    const withVimeo = lessons.filter(l => l.vimeoUrl && l.vimeoUrl.trim() !== '').length;
    const noVimeo = total - withVimeo;
    const withResources = lessons.filter(l => l._count.resources > 0).length;

    rows.push({
      Corso: c.title,
      Slug: c.slug,
      Tier: c.tierRequired ?? 'null',
      Lingua: c.lang,
      Livello: c.level,
      Disp: c.isAvailable ? 'sì' : 'NO',
      Lezioni: total,
      ConVideo: withVimeo,
      SenzaVideo: noVimeo,
      ConMateriali: withResources,
    });

    if (total === 0) emptyCourses.push(`${c.title}  (${c.slug})`);

    // Buchi nel sortOrder
    const orders = lessons.map(l => l.sortOrder).sort((a, b) => a - b);
    if (orders.length > 0) {
      const min = orders[0];
      const max = orders[orders.length - 1];
      const present = new Set(orders);
      const missing = [];
      for (let i = min; i <= max; i++) if (!present.has(i)) missing.push(i);
      const dupOrders = orders.filter((v, i) => orders.indexOf(v) !== i);
      if (missing.length || dupOrders.length) {
        gapsReport.push({
          Corso: c.title,
          Range: `${min}–${max}`,
          BuchiSortOrder: missing.join(', ') || '—',
          SortOrderDuplicati: [...new Set(dupOrders)].join(', ') || '—',
        });
      }
    }
  }

  console.log('── TABELLA PRINCIPALE ──────────────────────────────────────');
  console.table(rows);

  // ── Lezioni vuote vimeoUrl: dettaglio ───────────────────────────────
  console.log('\n── LEZIONI SENZA vimeoUrl (dettaglio) ──────────────────────');
  for (const c of courses) {
    const missing = c.lessons.filter(l => !l.vimeoUrl || l.vimeoUrl.trim() === '');
    if (missing.length) {
      console.log(`\n• ${c.title} (${c.slug}) — ${missing.length} senza video:`);
      missing.forEach(l => console.log(`    [sort ${l.sortOrder}] ${l.title}`));
    }
  }

  // ── Corsi senza lezioni ─────────────────────────────────────────────
  console.log('\n── CORSI SENZA LEZIONI ─────────────────────────────────────');
  console.log(emptyCourses.length ? emptyCourses.map(s => '  • ' + s).join('\n') : '  Nessuno.');

  // ── Buchi / duplicati nel sortOrder ─────────────────────────────────
  console.log('\n── BUCHI / DUPLICATI nel sortOrder ─────────────────────────');
  if (gapsReport.length) console.table(gapsReport);
  else console.log('  Nessuna anomalia di sequenza.');

  // ── Lezioni doppie (titolo) ─────────────────────────────────────────
  console.log('\n── LEZIONI DOPPIE per TITOLO ───────────────────────────────');
  const byTitle = new Map();
  for (const c of courses) {
    for (const l of c.lessons) {
      const k = norm(l.title);
      if (!k) continue;
      if (!byTitle.has(k)) byTitle.set(k, []);
      byTitle.get(k).push({ course: c.title, slug: c.slug, title: l.title, sort: l.sortOrder, id: l.id });
    }
  }
  let titleDupFound = false;
  for (const [, arr] of byTitle) {
    if (arr.length > 1) {
      titleDupFound = true;
      console.log(`\n  "${arr[0].title}" ×${arr.length}:`);
      arr.forEach(a => console.log(`     - ${a.course} (${a.slug}) [sort ${a.sort}] id=${a.id}`));
    }
  }
  if (!titleDupFound) console.log('  Nessun titolo duplicato.');

  // ── Lezioni doppie (vimeoUrl) ───────────────────────────────────────
  console.log('\n── LEZIONI DOPPIE per vimeoUrl ─────────────────────────────');
  const byVimeo = new Map();
  for (const c of courses) {
    for (const l of c.lessons) {
      const v = (l.vimeoUrl || '').trim();
      if (!v) continue;
      if (!byVimeo.has(v)) byVimeo.set(v, []);
      byVimeo.get(v).push({ course: c.title, slug: c.slug, title: l.title, sort: l.sortOrder, id: l.id });
    }
  }
  let vimeoDupFound = false;
  for (const [v, arr] of byVimeo) {
    if (arr.length > 1) {
      vimeoDupFound = true;
      console.log(`\n  ${v} ×${arr.length}:`);
      arr.forEach(a => console.log(`     - ${a.course} (${a.slug}) [sort ${a.sort}] "${a.title}" id=${a.id}`));
    }
  }
  if (!vimeoDupFound) console.log('  Nessun vimeoUrl duplicato.');

  // ── Verifica regola di progetto: isFree deve essere SEMPRE false ────
  const freeLessons = await prisma.lesson.count({ where: { isFree: true } });
  console.log('\n── CONTROLLO REGOLA isFree (deve essere 0) ─────────────────');
  console.log(`  Lezioni con isFree=true: ${freeLessons}${freeLessons ? '  ⚠️ VIOLAZIONE REGOLA' : '  ✓'}`);

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('FINE AUDIT — nessun dato è stato modificato.');
  console.log('══════════════════════════════════════════════════════════════\n');
}

main()
  .catch(e => { console.error('Errore audit:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
