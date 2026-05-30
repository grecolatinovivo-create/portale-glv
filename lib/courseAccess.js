// lib/courseAccess.js
// Logica condivisa di controllo accesso a un corso.
// Usata da:
//   - pages/api/courses/[id].js  (mostra/nasconde vimeoUrl)
//   - pages/api/download-resource.js (protegge i materiali a pagamento)
//
// Regole di progetto:
//   - Accesso solo con: admin | acquisto singolo | abbonamento status === 'active' (+ tier/scadenze)
//   - NESSUN trial, NESSUNA lezione gratuita.

const { prisma } = require('./prisma');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

const TIER_RANK = { cultura: 1, linguae: 2, accademia: 3 };

const MANUAL_PLANS = [
  'cultura-manuale', 'cultura-free',
  'linguae-manuale', 'linguae-free',
  'accademia-manuale', 'accademia-free',
];

function planToTier(plan) {
  if (!plan || typeof plan !== 'string') return null;
  if (plan.startsWith('cultura'))   return 'cultura';
  if (plan.startsWith('linguae'))   return 'linguae';
  if (plan.startsWith('accademia')) return 'accademia';
  return null;
}

function hasTierAccess(userPlan, courseRequiredTier) {
  if (!courseRequiredTier) return true;
  const userTier = planToTier(userPlan);
  if (!userTier) return false;
  return (TIER_RANK[userTier] || 0) >= (TIER_RANK[courseRequiredTier] || 0);
}

/**
 * Verifica se `user` (oggetto req.user: { userId, email } | null) ha accesso al corso.
 * @param {object|null} user
 * @param {object} course - deve avere { id, tierRequired, expiresAt }
 * @returns {Promise<{ hasAccess: boolean, accessSource: string|null }>}
 */
async function checkCourseAccess(user, course) {
  const now = new Date();
  let hasAccess = false;
  let accessSource = null;

  if (!user) return { hasAccess: false, accessSource: null };

  // 0. Admin bypass
  if (user.email === ADMIN_EMAIL) {
    return { hasAccess: true, accessSource: 'admin' };
  }

  // 1. Acquisto singolo — priorità massima, mai bloccato da expiresAt
  const purchase = await prisma.purchase.findFirst({
    where: { userId: user.userId, courseId: course.id },
  });
  if (purchase) {
    return { hasAccess: true, accessSource: 'purchase' };
  }

  // 2. Abbonamento attivo (+ tier + scadenze). Piani manuali hanno precedenza.
  const allActiveSubs = await prisma.subscription.findMany({
    where: { userId: user.userId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
  const subscription = allActiveSubs.find(s => MANUAL_PLANS.includes(s.plan))
    || allActiveSubs[0]
    || null;

  if (subscription) {
    const periodEnded = subscription.currentPeriodEnd
      && new Date(subscription.currentPeriodEnd) <= now;

    if (periodEnded) {
      accessSource = 'subscription-expired';
    } else if (course.expiresAt && new Date(course.expiresAt) <= now) {
      accessSource = 'subscription-expired';
    } else if (!hasTierAccess(subscription.plan, course.tierRequired)) {
      accessSource = 'subscription-tier';
    } else {
      hasAccess = true;
      accessSource = 'subscription';
    }
  }

  return { hasAccess, accessSource };
}

module.exports = {
  checkCourseAccess,
  hasTierAccess,
  planToTier,
  TIER_RANK,
  MANUAL_PLANS,
  ADMIN_EMAIL,
};
