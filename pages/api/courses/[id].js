// pages/api/courses/[id].js
// [id] è lo slug del corso, es. "lat-a11"

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

module.exports = withAuth(async function handler(req, res) {
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

    if (req.user) {
      // Controlla abbonamento attivo
      const subscription = await prisma.subscription.findUnique({
        where: { userId: req.user.id },
      });

      if (subscription && ['active', 'trialing'].includes(subscription.status)) {
        hasAccess = true;
      }

      // Controlla acquisto singolo corso
      if (!hasAccess) {
        const purchase = await prisma.purchase.findFirst({
          where: { userId: req.user.id, courseId: course.id },
        });
        if (purchase) hasAccess = true;
      }
    }

    // Filtra vimeoUrl per lezioni a pagamento se l'utente non ha accesso
    const lessons = course.lessons.map((lesson) => {
      if (lesson.isFree || hasAccess) {
        return lesson;
      }
      return { ...lesson, vimeoUrl: null };
    });

    return res.status(200).json({
      course: { ...course, lessons, hasAccess },
    });
  } catch (err) {
    console.error('[courses/[id]]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
