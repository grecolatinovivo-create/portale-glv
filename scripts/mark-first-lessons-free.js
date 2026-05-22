// scripts/mark-first-lessons-free.js
// Marca come isFree=true la prima lezione (sortOrder più basso) di ogni corso.
// Esegui con: node scripts/mark-first-lessons-free.js
//
// SICURO: opera solo su isFree — non tocca nient'altro.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Recupera tutti i corsi con le loro lezioni ordinate per sortOrder
  const courses = await prisma.course.findMany({
    include: {
      lessons: { orderBy: { sortOrder: 'asc' } },
    },
  });

  console.log(`Corsi trovati: ${courses.length}`);

  let updated = 0;
  for (const course of courses) {
    if (!course.lessons.length) {
      console.log(`  [SKIP] ${course.slug} — nessuna lezione`);
      continue;
    }

    const firstLesson = course.lessons[0];

    if (firstLesson.isFree) {
      console.log(`  [OK]   ${course.slug} — lezione 1 già isFree`);
      continue;
    }

    await prisma.lesson.update({
      where: { id: firstLesson.id },
      data: { isFree: true },
    });

    console.log(`  [SET]  ${course.slug} — "${firstLesson.title}" → isFree=true`);
    updated++;
  }

  console.log(`\nCompletato. ${updated} lezioni aggiornate.`);
}

main()
  .catch(err => { console.error('Errore:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
