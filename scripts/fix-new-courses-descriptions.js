// scripts/fix-new-courses-descriptions.js
// Aggiorna le descrizioni dei 12 nuovi corsi rimuovendo i codici classe

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FIXES = [
  { slug: 'breve-mantenimento-greco-a1-4lez',
    description: 'Corso di mantenimento della lingua greca antica a livello A1. 4 lezioni.' },
  { slug: 'breve-mantenimento-greco-a1-10lez',
    description: 'Corso di mantenimento della lingua greca antica a livello A1. 10 lezioni.' },
  { slug: 'breve-mantenimento-greco-a2',
    description: 'Corso di mantenimento della lingua greca antica a livello A2. 10 lezioni.' },
  { slug: 'breve-mantenimento-greco-b1-b2',
    description: 'Corso di mantenimento della lingua greca antica a livello B1/B2. 10 lezioni.' },
  { slug: 'breve-mantenimento-latino-a1-1',
    description: 'Corso di mantenimento della lingua latina a livello A1.1. 9 lezioni.' },
  { slug: 'breve-mantenimento-latino-b1-b2',
    description: 'Corso di mantenimento della lingua latina a livello B1/B2. 10 lezioni.' },
  { slug: 'breve-webinar-ebraico',
    description: 'Webinar di lingua e cultura ebraica.' },
  { slug: 'breve-neo-egiziano-b1',
    description: 'Corso di neoegiziano a livello B1.' },
  { slug: 'breve-club-lettura-testi-piramidi',
    description: 'Laboratorio di lettura dei Testi delle Piramidi egizi in originale.' },
  { slug: 'breve-impariamo-greco-antico',
    description: 'Introduzione alla lettura del greco antico per chi parte da zero.' },
  { slug: 'breve-colloquia-ciceroniana',
    description: 'Lettura e commento dei dialoghi ciceroniani per studenti avanzati.' },
];

async function main() {
  console.log('\n✏️  Fix descrizioni corsi brevi...\n');
  for (const { slug, description } of FIXES) {
    await prisma.course.update({ where: { slug }, data: { description } });
    console.log(`  ✅  ${slug}`);
  }
  console.log('\n✔ Fatto.\n');
}

main()
  .catch(err => { console.error('Errore:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
