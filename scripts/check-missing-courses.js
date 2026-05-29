// scripts/check-missing-courses.js
// Verifica lo stato esatto nel DB dei 12 corsi brevi mancanti
// Eseguire con: node scripts/check-missing-courses.js

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
  console.log('\n📋 Stato DB — 12 corsi brevi\n');

  for (const slug of SLUGS) {
    const course = await prisma.course.findUnique({
      where: { slug },
      include: { lessons: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!course) {
      console.log(`❌  ${slug} — CORSO NON TROVATO`);
      continue;
    }

    const lessons = course.lessons;
    const withVideo   = lessons.filter(l => l.vimeoUrl).length;
    const withoutVideo = lessons.filter(l => !l.vimeoUrl).length;

    const stato = lessons.length === 0 ? '⚠️  NESSUNA LEZIONE' : `✅  ${lessons.length} lezioni`;
    const video = lessons.length > 0
      ? ` (${withVideo} con video${withoutVideo > 0 ? `, ${withoutVideo} senza video` : ''})`
      : '';

    console.log(`${stato}${video}  →  ${slug}`);

    if (lessons.length > 0 && withVideo > 0) {
      // Mostra il primo vimeoUrl come campione
      const prima = lessons.find(l => l.vimeoUrl);
      console.log(`        campione: ${prima.vimeoUrl}`);
    }
  }

  console.log('');
}

main()
  .catch(err => { console.error('Errore:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
