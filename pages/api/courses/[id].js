// pages/api/courses/[id].js
// [id] è lo slug del corso, es. "lat-a11"

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { id } = req.query; // slug

  try {
    const course = await prisma.course.findUnique({
      where: { slug: id },
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Corso non trovato' });
    }

    let hasAccess = false;
    let accessSource = null; // 'subscription' | 'purchase' | null

    if (req.user) {
      // 1. Controlla acquisto singolo corso — PRIORITÀ MASSIMA, mai bloccato da expiresAt
      const purchase = await prisma.purchase.findFirst({
        where: { userId: req.user.userId, courseId: course.id },
      });
      if (purchase) {
        hasAccess = true;
        accessSource = 'purchase';
      }

      // 2. Controlla abbonamento attivo — solo se non ha acquistato singolarmente
      if (!hasAccess) {
        const now = new Date();
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId: req.user.userId,
            status: { in: ['active', 'trialing'] },
          },
        });

        if (subscription) {
          // Abbonamento valido: blocca solo se il corso ha una scadenza superata
          if (course.expiresAt && new Date(course.expiresAt) <= now) {
            // Corso scaduto per abbonati — hasAccess rimane false
            accessSource = 'subscription-expired';
          } else {
            hasAccess = true;
            accessSource = 'subscription';
          }
        }
      }
    }

    // Urgency per abbonati
    const now = new Date();
    let isExpiringSoon = false;
    if (course.expiresAt && accessSource === 'subscription') {
      const daysLeft = Math.ceil((new Date(course.expiresAt) - now) / (1000 * 60 * 60 * 24));
      isExpiringSoon = daysLeft >= 0 && daysLeft <= 14;
    }

    // Filtra vimeoUrl per lezioni a pagamento se l'utente non ha accesso
    const lessons = course.lessons.map((lesson) => {
      if (lesson.isFree || hasAccess) {
        return lesson;
      }
      return { ...lesson, vimeoUrl: null };
    });

    return res.status(200).json({
      course: {
        ...course,
        lessons,
        hasAccess,
        accessSource,       // 'purchase' | 'subscription' | 'subscription-expired' | null
        isExpiringSoon,
        availableUntilLabel: course.availableUntilLabel || null,
      },
    });
  } catch (err) {
    console.error('[courses/[id]]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
