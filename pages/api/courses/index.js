// pages/api/courses/index.js
// GET — lista corsi disponibili con progresso utente (se autenticato)
// Restituisce anche expiresAt / isExpiringSoon per urgency badge

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const now = new Date();
    const courses = await prisma.course.findMany({
      where: { isAvailable: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        lang: true,
        level: true,
        title: true,
        description: true,
        priceEur: true,
        isNew: true,
        sortOrder: true,
        expiresAt: true,
        availableUntilLabel: true,
        _count: { select: { lessons: true } },
      },
    });

    // Calcola isExpiringSoon lato server (< 14 giorni dall'accesso abbonato)
    const enriched = courses.map(c => {
      let isExpiringSoon = false;
      let isExpired = false;

      if (c.expiresAt) {
        const daysLeft = Math.ceil((new Date(c.expiresAt) - now) / (1000 * 60 * 60 * 24));
        isExpiringSoon = daysLeft >= 0 && daysLeft <= 14;
        isExpired = daysLeft < 0;
      }

      return {
        ...c,
        lessonCount: c._count.lessons,
        isExpiringSoon,
        isExpired,
        _count: undefined,
      };
    });

    // Aggiunge progresso per utenti autenticati
    if (req.user) {
      const progressRows = await prisma.lessonProgress.findMany({
        where: { userId: req.user.userId },
        select: { courseId: true, completed: true },
      });

      const progressByCourse = {};
      for (const p of progressRows) {
        if (!progressByCourse[p.courseId]) {
          progressByCourse[p.courseId] = { completed: 0, total: 0 };
        }
        progressByCourse[p.courseId].total += 1;
        if (p.completed) progressByCourse[p.courseId].completed += 1;
      }

      // Controlla abbonamento attivo per mostrare/nascondere urgency
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: req.user.userId,
          status: { in: ['active', 'trialing'] },
        },
        select: { id: true },
      });

      const hasSubscription = !!subscription;

      const withProgress = enriched.map(course => {
        const prog = progressByCourse[course.id];
        const progressPercent = prog && prog.total > 0
          ? Math.round((prog.completed / prog.total) * 100)
          : 0;

        // L'urgency è rilevante solo per chi ha abbonamento (non per chi ha comprato singolo)
        return {
          ...course,
          progressPercent,
          // Mostra urgency solo agli abbonati (non agli acquirenti singoli — per loro il corso non scade)
          showUrgency: hasSubscription && (course.isExpiringSoon || course.isExpired),
        };
      });

      return res.status(200).json({ courses: withProgress });
    }

    return res.status(200).json({ courses: enriched });
  } catch (err) {
    console.error('[courses/index]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
