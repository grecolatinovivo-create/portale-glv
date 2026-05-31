// pages/api/progress/my-courses.js
// GET — elenco dei corsi INIZIATI dall'utente con il progresso reale.
// Per ogni corso: % completamento (lezioni completate / totali), ultima lezione
// vista (per "riprendi"), data ultimo accesso.
//
// Risposta: { courses: [{ slug, title, lang, totalLessons, completedLessons,
//   percent, lastLessonId, lastLessonTitle, updatedAt }] }

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const progress = await prisma.lessonProgress.findMany({
      where: { userId: req.user.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        lesson: { select: { id: true, title: true, sortOrder: true } },
        course: { select: { id: true, slug: true, title: true, lang: true } },
      },
    });

    if (!progress.length) return res.status(200).json({ courses: [] });

    // Totale lezioni per i corsi coinvolti (per calcolare la %)
    const courseIds = [...new Set(progress.map(p => p.courseId))];
    const totals = await prisma.lesson.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _count: { _all: true },
    });
    const totalByCourse = Object.fromEntries(totals.map(t => [t.courseId, t._count._all]));

    // Aggrega per corso
    const byCourse = {};
    for (const p of progress) {
      const cid = p.courseId;
      if (!byCourse[cid]) {
        byCourse[cid] = {
          slug: p.course.slug,
          title: p.course.title,
          lang: p.course.lang,
          totalLessons: totalByCourse[cid] || 0,
          completedLessons: 0,
          // la prima riga (ordinata desc per updatedAt) è la più recente → "riprendi"
          lastLessonId: p.lesson.id,
          lastLessonTitle: p.lesson.title,
          updatedAt: p.updatedAt,
        };
      }
      if (p.completed) byCourse[cid].completedLessons++;
    }

    const courses = Object.values(byCourse).map(c => ({
      ...c,
      percent: c.totalLessons > 0 ? Math.round((c.completedLessons / c.totalLessons) * 100) : 0,
    }));
    // ordina: prima i corsi non completati, poi per ultimo accesso
    courses.sort((a, b) => {
      const ad = a.percent >= 100 ? 1 : 0;
      const bd = b.percent >= 100 ? 1 : 0;
      if (ad !== bd) return ad - bd;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    return res.status(200).json({ courses });
  } catch (err) {
    console.error('[progress/my-courses] Errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
