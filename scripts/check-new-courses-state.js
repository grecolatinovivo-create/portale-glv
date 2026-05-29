// scripts/check-new-courses-state.js
// Verifica descrizioni e materiali dei 12 nuovi corsi brevi

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SLUGS = [
  'breve-mantenimento-greco-a1-4lez',
  'breve-mantenimento-greco-a1-10lez',
  'breve-mantenimento-greco-a2',
  'breve-mantenimento-greco-b1-b2',
  'breve-mantenimento-latino-a1-1',
  'breve-mantenimento-latino-b1-b2',
  'breve-webinar-ebraico',
  'breve-neo-egiziano-b1',
  'breve-club-lettura-testi-piramidi',
  'breve-egiziano-geroglifico-letteratura',
  'breve-impariamo-greco-antico',
  'breve-colloquia-ciceroniana',
];

async function main() {
  console.log('\n📋 Stato descrizioni e materiali — 12 nuovi corsi\n');

  for (const slug of SLUGS) {
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        lessons: {
          include: { resources: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!course) { console.log(`❌ ${slug} — NON TROVATO`); continue; }

    const totalResources = course.lessons.reduce((s, l) => s + l.resources.length, 0);
    const lessonsWithResources = course.lessons.filter(l => l.resources.length > 0).length;

    console.log(`\n── ${slug}`);
    console.log(`   title:       "${course.title}"`);
    console.log(`   description: "${course.description}"`);
    console.log(`   lezioni: ${course.lessons.length} | materiali: ${totalResources} su ${lessonsWithResources} lezioni`);
  }
  console.log('');
}

main()
  .catch(err => { console.error('Errore:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
