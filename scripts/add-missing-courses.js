// scripts/add-missing-courses.js
// Aggiunge i 12 corsi mancanti (fonte: catalogo video su latincert.xlsx)
// come "Corsi Brevi" nel piano Cultura (accessibili a tutti gli abbonati).
//
// Eseguire con:
//   node scripts/add-missing-courses.js
//
// I corsi vengono inseriti via upsert (idempotente): sicuro da rieseguire.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── I 12 corsi mancanti ───────────────────────────────────────────────────
// lang: 'Corsi Brevi'  →  categoria standard per i corsi brevi del portale
// level: sottocategoria tematica (usata per il badge nella card)
// tierRequired: 'cultura'  →  accessibili a tutti gli abbonati (piano base)
// priceEur: 0  →  portale ad abbonamento, nessun acquisto singolo previsto
// isAvailable: true  →  visibili subito nel catalogo
//
// Nota: i due "Mantenimento Greco A1" sono due classi distinte
//   GKPY1B (4 lezioni) e U1SDFB (10 lezioni) → slug separati.
// ─────────────────────────────────────────────────────────────────────────
const corsiDaAggiungere = [
  {
    slug:        'breve-mantenimento-greco-a1-4lez',
    title:       'Mantenimento linguistico Greco A1',
    description: 'Corso di mantenimento della lingua greca antica a livello A1. Classe GKPY1B — 4 lezioni.',
    lang:        'Corsi Brevi',
    level:       'Greco Antico',
    priceEur:    0,
    tierRequired: 'cultura',
    sortOrder:   200,
    isAvailable: true,
    isNew:       false,
  },
  {
    slug:        'breve-mantenimento-greco-a1-10lez',
    title:       'Mantenimento linguistico Greco A1',
    description: 'Corso di mantenimento della lingua greca antica a livello A1. Classe U1SDFB — 10 lezioni.',
    lang:        'Corsi Brevi',
    level:       'Greco Antico',
    priceEur:    0,
    tierRequired: 'cultura',
    sortOrder:   201,
    isAvailable: true,
    isNew:       false,
  },
  {
    slug:        'breve-mantenimento-greco-a2',
    title:       'Mantenimento linguistico Greco A2',
    description: 'Corso di mantenimento della lingua greca antica a livello A2. Classe FXG6Q5 — 10 lezioni.',
    lang:        'Corsi Brevi',
    level:       'Greco Antico',
    priceEur:    0,
    tierRequired: 'cultura',
    sortOrder:   202,
    isAvailable: true,
    isNew:       false,
  },
  {
    slug:        'breve-mantenimento-greco-b1-b2',
    title:       'Mantenimento linguistico Greco B1/B2',
    description: 'Corso di mantenimento della lingua greca antica a livello B1/B2. Classe AVUMC6 — 10 lezioni.',
    lang:        'Corsi Brevi',
    level:       'Greco Antico',
    priceEur:    0,
    tierRequired: 'cultura',
    sortOrder:   203,
    isAvailable: true,
    isNew:       false,
  },
  {
    slug:        'breve-mantenimento-latino-a1-1',
    title:       'Mantenimento linguistico Latino A1.1',
    description: 'Corso di mantenimento della lingua latina a livello A1.1. Classe QK1256 — 9 lezioni.',
    lang:        'Corsi Brevi',
    level:       'Latino',
    priceEur:    0,
    tierRequired: 'cultura',
    sortOrder:   204,
    isAvailable: true,
    isNew:       false,
  },
  {
    slug:        'breve-mantenimento-latino-b1-b2',
    title:       'Mantenimento linguistico Latino B1/B2',
    description: 'Corso di mantenimento della lingua latina a livello B1/B2. Classe CYKZFU — 10 lezioni.',
    lang:        'Corsi Brevi',
    level:       'Latino',
    priceEur:    0,
    tierRequired: 'cultura',
    sortOrder:   205,
    isAvailable: true,
    isNew:       false,
  },
  {
    slug:        'breve-webinar-ebraico',
    title:       'Webinar ebraico',
    description: 'Webinar di lingua e cultura ebraica. Classe APQNYG.',
    lang:        'Corsi Brevi',
    level:       'Ebraico Biblico',
    priceEur:    0,
    tierRequired: 'cultura',
    sortOrder:   206,
    isAvailable: true,
    isNew:       false,
  },
  {
    slug:        'breve-neo-egiziano-b1',
    title:       'Neo-egiziano B1',
    description: 'Corso di neoegiziano a livello B1. Classe 2DCGBL.',
    lang:        'Corsi Brevi',
    level:       'Egiziano Geroglifico',
    priceEur:    0,
    tierRequired: 'cultura',
    sortOrder:   207,
    isAvailable: true,
    isNew:       false,
  },
  {
    slug:        'breve-club-lettura-testi-piramidi',
    title:       'Club di Lettu-RA: I Testi delle Piramidi',
    description: 'Laboratorio di lettura dei Testi delle Piramidi egizi in originale. Classe 7QR824.',
    lang:        'Corsi Brevi',
    level:       'Egiziano Geroglifico',
    priceEur:    0,
    tierRequired: 'cultura',
    sortOrder:   208,
    isAvailable: true,
    isNew:       false,
  },
  {
    slug:        'breve-egiziano-geroglifico-letteratura',
    title:       'Egiziano Geroglifico — Letteratura',
    description: 'Lettura dei grandi testi letterari della civiltà egiziana in geroglifico. Classe V6EFWX.',
    lang:        'Corsi Brevi',
    level:       'Egiziano Geroglifico',
    priceEur:    0,
    tierRequired: 'cultura',
    sortOrder:   209,
    isAvailable: true,
    isNew:       false,
  },
  {
    slug:        'breve-impariamo-greco-antico',
    title:       'Impariamo a leggere il greco antico',
    description: 'Introduzione alla lettura del greco antico per chi parte da zero. Classe BJSC4A.',
    lang:        'Corsi Brevi',
    level:       'Greco Antico',
    priceEur:    0,
    tierRequired: 'cultura',
    sortOrder:   210,
    isAvailable: true,
    isNew:       false,
  },
  {
    slug:        'breve-colloquia-ciceroniana',
    title:       'Colloquia Ciceroniana',
    description: 'Lettura e commento dei dialoghi ciceroniani per studenti avanzati. Classe YD81QU.',
    lang:        'Corsi Brevi',
    level:       'Autori Latini',
    priceEur:    0,
    tierRequired: 'cultura',
    sortOrder:   211,
    isAvailable: true,
    isNew:       false,
  },
];

async function main() {
  console.log(`\n🚀 Inserimento ${corsiDaAggiungere.length} corsi brevi mancanti...\n`);

  let inseriti = 0;
  let aggiornati = 0;

  for (const corso of corsiDaAggiungere) {
    const result = await prisma.course.upsert({
      where:  { slug: corso.slug },
      update: {
        // Se il corso esiste già aggiorna solo i campi essenziali
        title:        corso.title,
        description:  corso.description,
        isAvailable:  corso.isAvailable,
        tierRequired: corso.tierRequired,
        sortOrder:    corso.sortOrder,
      },
      create: corso,
    });

    const wasNew = result.createdAt.getTime() === result.createdAt.getTime() &&
                   (Date.now() - result.createdAt.getTime()) < 5000;

    console.log(`  ✅  ${corso.slug}`);
    inseriti++;
  }

  console.log(`\n✔ Completato: ${inseriti} corsi processati.`);
  console.log('  Verifica nel pannello admin → sezione Corsi.\n');
}

main()
  .catch(err => {
    console.error('\n❌ Errore:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
