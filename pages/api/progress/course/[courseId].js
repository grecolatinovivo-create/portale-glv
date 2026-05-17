// pages/api/progress/course/[courseId].js — Progresso dettagliato per un singolo corso
// GET /api/progress/course/lat-a11 → { percent, completedLessons, totalLessons, lessons: [...] }

const { prisma } = require('../../../../lib/prisma');
const { withAuth } = require('../../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  const { courseId } = req.query; // qui courseId è lo SLUG del corso

  try {
    // Trova il corso tramite slug
    const course = await prisma.course.findUnique({
      where: { slug: courseId },
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Corso non trovato' });
    }

    // Recupera tutti i progressi dell'utente per questo corso
    const progressList = await prisma.lessonProgress.findMany({
      where: { userId: req.user.userId, courseId: course.id },
    });

    const progressMap = new Map(progressList.map(p => [p.lessonId, p]));

    // Costruisce la lista lezioni arricchita con il progresso
    const lessons = course.lessons.map(lesson => {
      const p = progressMap.get(lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        durationMin: lesson.durationMin,
        isFree: lesson.isFree,
        sortOrder: lesson.sortOrder,
        vimeoUrl: lesson.vimeoUrl,
        watchedSeconds: p?.watchedSeconds ?? 0,
        totalSeconds: p?.totalSeconds ?? 0,
        completed: p?.completed ?? false,
        completedAt: p?.completedAt ?? null,
        resumeAt: p?.resumeAt ?? 0,
        percentWatched: p && p.totalSeconds > 0
          ? Math.round((p.watchedSeconds / p.totalSeconds) * 100)
          : 0,
      };
    });

    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(l => l.completed).length;
    const percent = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    // Prossima lezione da fare
    const nextLesson = lessons.find(l => !l.completed) ?? null;

    return res.status(200).json({
      courseId: course.id,
      slug: course.slug,
      title: course.title,
      lang: course.lang,
      level: course.level,
      totalLessons,
      completedLessons,
      percent,
      courseCompleted: percent === 100,
      nextLesson,
      lessons,
    });
  } catch (err) {
    console.error('[progress/course] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
