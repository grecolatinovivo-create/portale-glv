// tools/create-test-users.js
// Crea l'utente admin e un utente di test nel database
// Esegui con: node tools/create-test-users.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Creazione utenti di prova...\n');

  // ── ADMIN ─────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('GLVadmin2025!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'grecolatinovivo@gmail.com' },
    update: { passwordHash: adminHash, fullName: 'Giampiero Marchi' },
    create: {
      email: 'grecolatinovivo@gmail.com',
      fullName: 'Giampiero Marchi',
      passwordHash: adminHash,
    },
  });
  console.log('✓ Admin creato:');
  console.log('  Email:    grecolatinovivo@gmail.com');
  console.log('  Password: GLVadmin2025!');
  console.log('  ID:       ' + admin.id);

  // ── UTENTE TEST ───────────────────────────────────────────────
  const testHash = await bcrypt.hash('Testuser2025!', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@grecolatinovivo.it' },
    update: { passwordHash: testHash, fullName: 'Studente Test' },
    create: {
      email: 'test@grecolatinovivo.it',
      fullName: 'Studente Test',
      passwordHash: testHash,
    },
  });
  console.log('\n✓ Utente test creato:');
  console.log('  Email:    test@grecolatinovivo.it');
  console.log('  Password: Testuser2025!');
  console.log('  ID:       ' + testUser.id);

  console.log('\nFatto! Puoi ora accedere al portale con queste credenziali.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
