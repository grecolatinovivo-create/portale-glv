// scripts/assign-demo-tiers.js
// Assegna tier manuali agli account demo di test.
// Esegui con: node scripts/assign-demo-tiers.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ACCOUNTS = [
  { email: 'cultura@grecolatinovivo.it',   tier: 'cultura',   plan: 'cultura-manuale'   },
  { email: 'linguae@grecolatinovivo.it',   tier: 'linguae',   plan: 'linguae-manuale'   },
  { email: 'accademia@grecolatinovivo.it', tier: 'accademia', plan: 'accademia-manuale' },
];

const MANUAL_PLANS = ['cultura-manuale', 'linguae-manuale', 'accademia-manuale', 'accademia-free'];

async function run() {
  for (const { email, tier, plan } of ACCOUNTS) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`⚠ NON TROVATO: ${email}`);
      continue;
    }

    // Cancella piani manuali esistenti
    await prisma.subscription.updateMany({
      where: { userId: user.id, plan: { in: MANUAL_PLANS }, status: 'active' },
      data: { status: 'canceled' },
    });

    const syntheticId = `admin_${tier}_${user.id}`;
    const farFuture = new Date('2099-12-31T23:59:59Z');

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: syntheticId },
      create: {
        userId:               user.id,
        plan,
        stripeSubscriptionId: syntheticId,
        stripeCustomerId:     `admin_${user.id}`,
        status:               'active',
        currentPeriodEnd:     farFuture,
      },
      update: {
        plan,
        status:           'active',
        currentPeriodEnd: farFuture,
      },
    });

    console.log(`✓ ${email} → ${plan}`);
  }

  await prisma.$disconnect();
  console.log('\nFatto.');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
