// pages/api/admin/dashboard.js
// GET — metriche aggregate per il pannello admin
// Accessibile solo all'admin (email = ADMIN_EMAIL)

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

// Piani assegnati manualmente (gratuiti) — esclusi da contatori e commissioni
const MANUAL_PLANS = [
  'cultura-manuale',
  'linguae-manuale',
  'accademia-manuale',
  'accademia-free',
];

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersLast30,
      newUsersLast7,
      suspendedUsers,
      activeSubscriptions,
      newSubscriptionsLast30,
      totalCertificates,
      revokedCertificates,
      totalCourses,
      completedCoursesLast30,
      totalPurchases,
      subscriptionsByPlan,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.subscription.count({
        where: { status: 'active' },
      }),
      prisma.subscription.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.certificate.count(),
      prisma.certificate.count({ where: { revokedAt: { not: null } } }),
      prisma.course.count({ where: { isAvailable: true } }),
      prisma.certificate.count({
        where: { issuedAt: { gte: thirtyDaysAgo }, revokedAt: null },
      }),
      prisma.purchase.count(),
      prisma.subscription.groupBy({
        by: ['plan'],
        where: { status: 'active' },
        _count: { plan: true },
        orderBy: { _count: { plan: 'desc' } },
      }),
    ]);

    // AdminLog e campi nuovi (expiresAt) potrebbero non esistere ancora nel DB
    // se npx prisma db push non è stato eseguito — gestiamo il fallback
    let recentLogs = [];
    try {
      recentLogs = await prisma.adminLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    } catch { /* tabella non ancora creata */ }

    let expiringCourses = [];
    try {
      expiringCourses = await prisma.course.findMany({
        where: {
          isAvailable: true,
          expiresAt: {
            not: null,
            gte: now,
            lte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true, slug: true, title: true,
          expiresAt: true, availableUntilLabel: true,
        },
      });
    } catch { /* colonna non ancora creata */ }

    return res.status(200).json({
      metrics: {
        totalUsers,
        newUsersLast30,
        newUsersLast7,
        suspendedUsers,
        activeSubscriptions,
        newSubscriptionsLast30,
        totalPurchases,
        subscriptionsByPlan: subscriptionsByPlan.map(s => ({
          plan: s.plan,
          count: s._count.plan,
        })),
        certificates: {
          total: totalCertificates,
          revoked: revokedCertificates,
          active: totalCertificates - revokedCertificates,
          issuedLast30: completedCoursesLast30,
        },
        totalCourses,
      },
      expiringCourses,
      recentLogs,
    });
  } catch (err) {
    console.error('[admin/dashboard]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
