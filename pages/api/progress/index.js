// pages/api/progress/index.js — Lista di tutti i corsi avviati dall'utente
// GET → { courses: [ { courseId, slug, title, lang, totalLessons, completedLessons, percent, lastWatchedAt, nextLesson } ] }

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

module.exports = withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  try {
    // Tutti i progressi dell'utente raggruppati per corso
    const progressRecords = await prisma.lessonProgress.findMany({
      where: { userId: req.user.userId },
      include: {
        course: {
          include: {
            lessons: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (progressRecords.length === 0) {
      return res.status(200).json({ courses: [] });
    }

    // Raggruppa per courseId
    const courseMap = new Map();
    for (const rec of progressRecords) {
      const cid = rec.courseId;
      if (!courseMap.has(cid)) {
        courseMap.set(cid, {
          course: rec.course,
          progressList: [],
          lastWatchedAt: rec.updatedAt,
        });
      }
      courseMap.get(cid).progressList.push(rec);
      // Tiene la data più recente
      if (rec.updatedAt > courseMap.get(cid).lastWatchedAt) {
        courseMap.get(cid).lastWatchedAt = rec.updatedAt;
      }
    }

    const courses = [];
    for (const [courseId, { course, progressList, lastWatchedAt }] of courseMap) {
      const totalLessons = course.lessons.length;
      const completedLessons = progressList.filter(p => p.completed).length;
      const percent = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      // Ultima lezione vista (quella aggiornata più di recente)
      const lastProgress = progressList.sort((a, b) =>
        new Date(b.updatedAt) - new Date(a.updatedAt)
      )[0];
      const lastLesson = course.lessons.find(l => l.id === lastProgress?.lessonId);

      // Prossima lezione da fare: prima lezione non completata in ordine
      const completedIds = new Set(progressList.filter(p => p.completed).map(p => p.lessonId));
      const nextLesson = course.lessons.find(l => !completedIds.has(l.id));

      courses.push({
        courseId,
        slug: course.slug,
        title: course.title,
        lang: course.lang,
        level: course.level,
        totalLessons,
        completedLessons,
        percent,
        courseCompleted: percent === 100,
        lastWatchedAt,
        lastLesson: lastLesson
          ? { id: lastLesson.id, title: lastLesson.title, sortOrder: lastLesson.sortOrder }
          : null,
        nextLesson: nextLesson
          ? { id: nextLesson.id, title: nextLesson.title, sortOrder: nextLesson.sortOrder }
          : null,
        resumeAt: lastProgress?.resumeAt ?? 0,
      });
    }

    // Ordina per data ultimo accesso (più recente prima)
    courses.sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt));

    return res.status(200).json({ courses });
  } catch (err) {
    console.error('[progress/index] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
