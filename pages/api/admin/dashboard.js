// pages/api/admin/dashboard.js
// GET — metriche aggregate per il pannello admin
// Accessibile solo all'admin (email = ADMIN_EMAIL)

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

module.exports = withAuth(async function handler(req, res) {
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
      activeSubscriptions,
      totalCertificates,
      revokedCertificates,
      totalCourses,
      completedCoursesLast30,
      recentLogs,
      expiringCourses,
    ] = await Promise.all([
      // Utenti totali
      prisma.user.count(),

      // Nuovi utenti ultimi 30 giorni
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

      // Abbonamenti attivi o in prova
      prisma.subscription.count({
        where: { status: { in: ['active', 'trialing'] } },
      }),

      // Attestati totali (inclusi revocati)
      prisma.certificate.count(),

      // Attestati revocati
      prisma.certificate.count({ where: { revokedAt: { not: null } } }),

      // Corsi disponibili
      prisma.course.count({ where: { isAvailable: true } }),

      // Corsi completati (100%) negli ultimi 30 giorni
      // Conteggio dei Certificate emessi nell'ultimo mese come proxy
      prisma.certificate.count({
        where: { issuedAt: { gte: thirtyDaysAgo }, revokedAt: null },
      }),

      // Ultime 10 azioni admin
      prisma.adminLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Corsi in scadenza entro 14 giorni (urgency)
      prisma.course.findMany({
        where: {
          isAvailable: true,
          expiresAt: {
            not: null,
            gte: now,
            lte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          slug: true,
          title: true,
          expiresAt: true,
          availableUntilLabel: true,
        },
      }),
    ]);

    return res.status(200).json({
      metrics: {
        totalUsers,
        newUsersLast30,
        activeSubscriptions,
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
