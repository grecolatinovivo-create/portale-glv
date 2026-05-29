// scripts/fix-eg-a21-missing-lessons.js
// Aggiunge le lezioni mancanti al corso "Corso di Egiziano Geroglifico A2 • E-Learning" (eg-a21)
// Il corso ha 5 lezioni in Neon ma dovrebbe averne 12 (IDCR=398 nel DB latin-cert).
//
// Logica:
//   - NON tocca le 5 lezioni già presenti
//   - Per ciascuna delle 12 lezioni attese, controlla se esiste già (per vimeoUrl nel corso)
//   - Se non esiste, la crea con tutti i dati corretti
//
// Eseguire con:
//   node scripts/fix-eg-a21-missing-lessons.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Dati estratti dal dump SQL di latin-cert (IDCR=398)
// durata convertita da secondi a minuti
const EXPECTED_LESSONS = [
  { latinCertId: 3984, sortOrder: 1,  title: 'Lezione 1 del 22 gennaio 2026',        vimeoUrl: 'https://vimeo.com/1157563535', durationMin: 117 },
  { latinCertId: 4001, sortOrder: 2,  title: 'Lezione 2 del 29 gennaio 2026',        vimeoUrl: 'https://vimeo.com/1159848393', durationMin: 120 },
  { latinCertId: 4017, sortOrder: 3,  title: 'Lezione 3 del 5 febbraio 2026',        vimeoUrl: 'https://vimeo.com/1162338745', durationMin: 90  },
  { latinCertId: 4026, sortOrder: 4,  title: 'Lezione 4 del 7 febbraio 2026',        vimeoUrl: 'https://vimeo.com/1162867534', durationMin: 161 },
  { latinCertId: 4041, sortOrder: 5,  title: 'Lezione 5 del 12 febbraio 2026',       vimeoUrl: 'https://vimeo.com/1164971752', durationMin: 123 },
  { latinCertId: 4050, sortOrder: 6,  title: 'Lezione 6 del 19 febbraio 2026',       vimeoUrl: 'https://vimeo.com/1166502712', durationMin: 123 },
  { latinCertId: 4066, sortOrder: 7,  title: 'Lezione 7 del 26 febbraio 2026',       vimeoUrl: 'https://vimeo.com/1168609738', durationMin: 116 },
  { latinCertId: 4083, sortOrder: 8,  title: 'Lezione 8 del 5 marzo 2026',           vimeoUrl: 'https://vimeo.com/1170846219', durationMin: 119 },
  { latinCertId: 4112, sortOrder: 9,  title: 'Lezione 9 del 14 marzo 2026',          vimeoUrl: 'https://vimeo.com/1173629953', durationMin: 159 },
  { latinCertId: 4131, sortOrder: 10, title: 'Lezione 10 del 19 marzo 2026',         vimeoUrl: 'https://vimeo.com/1175287047', durationMin: 122 },
  { latinCertId: 4153, sortOrder: 11, title: 'Lezione 11 del 27 marzo 2026',         vimeoUrl: 'https://vimeo.com/1177507482', durationMin: 119 },
  { latinCertId: 4172, sortOrder: 12, title: 'Lezione extra (12) del 1 aprile 2026', vimeoUrl: 'https://vimeo.com/1179345592', durationMin: 69  },
];

async function main() {
  console.log('\n🔧 Fix eg-a21 — aggiunta lezioni mancanti...\n');

  const course = await prisma.course.findUnique({
    where: { slug: 'eg-a21' },
    select: { id: true, title: true },
  });

  if (!course) {
    console.error('❌ Corso eg-a21 non trovato nel DB.');
    process.exit(1);
  }

  console.log(`Corso: "${course.title}" (id: ${course.id})\n`);

  // Carica le lezioni esistenti per confronto
  const existing = await prisma.lesson.findMany({
    where: { courseId: course.id },
    select: { id: true, vimeoUrl: true, sortOrder: true, title: true, latinCertId: true },
  });

  console.log(`Lezioni attualmente in DB: ${existing.length}`);
  existing.forEach(l => console.log(`  [${l.sortOrder}] IDL=${l.latinCertId} "${l.title}" → ${l.vimeoUrl}`));
  console.log('');

  const existingUrls = new Set(existing.map(l => l.vimeoUrl).filter(Boolean));
  const existingIdls = new Set(existing.map(l => l.latinCertId).filter(Boolean));

  let added = 0;
  let skipped = 0;

  for (const lesson of EXPECTED_LESSONS) {
    // Salta se già presente (per vimeoUrl o latinCertId)
    if (existingUrls.has(lesson.vimeoUrl)) {
      console.log(`  ✓ skip  [${lesson.sortOrder}] già presente: ${lesson.vimeoUrl}`);
      skipped++;
      continue;
    }
    if (existingIdls.has(lesson.latinCertId)) {
      console.log(`  ✓ skip  [${lesson.sortOrder}] IDL=${lesson.latinCertId} già presente`);
      skipped++;
      continue;
    }

    // Controlla se latinCertId è già usato da un'altra lezione (unique constraint)
    const conflict = await prisma.lesson.findUnique({
      where: { latinCertId: lesson.latinCertId },
      select: { id: true, courseId: true },
    });
    if (conflict) {
      console.log(`  ⚠️  IDL=${lesson.latinCertId} già usato da un'altra lezione — creo senza latinCertId`);
      await prisma.lesson.create({
        data: {
          courseId:    course.id,
          title:       lesson.title,
          durationMin: lesson.durationMin,
          isFree:      false,
          sortOrder:   lesson.sortOrder,
          vimeoUrl:    lesson.vimeoUrl,
        },
      });
    } else {
      await prisma.lesson.create({
        data: {
          courseId:    course.id,
          title:       lesson.title,
          durationMin: lesson.durationMin,
          isFree:      false,
          sortOrder:   lesson.sortOrder,
          vimeoUrl:    lesson.vimeoUrl,
          latinCertId: lesson.latinCertId,
        },
      });
    }

    console.log(`  ✅ add   [${lesson.sortOrder}] IDL=${lesson.latinCertId} "${lesson.title}"`);
    added++;
  }

  // Verifica finale
  const total = await prisma.lesson.count({ where: { courseId: course.id } });
  console.log(`\n✔ Completato: ${added} lezioni aggiunte, ${skipped} già presenti.`);
  console.log(`  Totale lezioni eg-a21 in DB: ${total}\n`);
}

main()
  .catch(err => { console.error('\n❌ Errore:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
