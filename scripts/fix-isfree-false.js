// scripts/fix-isfree-false.js
// REGOLA ASSOLUTA del progetto: nessuna lezione gratuita → isFree deve essere SEMPRE false.
// Questo script bonifica il database: imposta isFree = false su tutte le lezioni che
// risultassero ancora true (es. residui del vecchio seed "prime 2 lezioni gratis").
//
// È SICURO: il codice del portale ignora ormai del tutto il campo isFree per decidere
// l'accesso (che dipende solo da abbonamento attivo / acquisto / admin). Quindi questo
// aggiornamento non toglie né concede accesso a nessuno: normalizza solo un dato.
// È anche idempotente: si può rieseguire quante volte si vuole senza effetti collaterali.
//
// Eseguire dalla cartella del progetto con:  node scripts/fix-isfree-false.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Controllo lezioni con isFree = true...\n');

  // Quante lezioni sono ancora marcate come gratuite (prima della bonifica)
  const before = await prisma.lesson.count({ where: { isFree: true } });
  const totale = await prisma.lesson.count();

  console.log(`   Lezioni totali nel database: ${totale}`);
  console.log(`   Lezioni con isFree = true:   ${before}`);

  if (before === 0) {
    console.log('\n✅ Nessuna lezione gratuita da correggere. Database già conforme.\n');
    return;
  }

  // Bonifica: porta tutte le lezioni gratuite a isFree = false
  const result = await prisma.lesson.updateMany({
    where: { isFree: true },
    data:  { isFree: false },
  });

  // Verifica finale: non deve restare nessuna lezione gratuita
  const after = await prisma.lesson.count({ where: { isFree: true } });

  console.log(`\n✏️  Lezioni aggiornate (isFree → false): ${result.count}`);
  console.log(`   Lezioni con isFree = true rimaste:    ${after}`);

  if (after === 0) {
    console.log('\n✅ Bonifica completata. Nessuna lezione gratuita nel database.\n');
  } else {
    console.log('\n⚠️  Attenzione: alcune lezioni risultano ancora gratuite. Riesegui lo script.\n');
  }
}

main()
  .catch((e) => {
    console.error('\n❌ Errore durante la bonifica:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
