// pages/api/progress/overview.js — Riepilogo globale progresso utente
// GET → {
//   completedLessons,  // totale lezioni completate su tutti i corsi
//   totalLessons,      // totale lezioni disponibili (solo corsi avviati)
//   percent,           // percentuale completamento globale
//   weeklyLessons,     // lezioni viste/aggiornate negli ultimi 7 giorni
//   lastLesson: {      // ultima lezione aperta (per "Riprendi da dove hai lasciato")
//     courseSlug, courseTitle, courseLang,
//     lessonId, lessonTitle, lessonSortOrder,
//     resumeAt, progressPercent
//   } | null
// }

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Tutti i progressi dell'utente, con dati lezione e corso
    const allProgress = await prisma.lessonProgress.findMany({
      where: { userId: req.user.userId },
      include: {
        lesson: {
          select: { id: true, title: true, sortOrder: true },
        },
        course: {
          select: { id: true, slug: true, title: true, lang: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!allProgress.length) {
      return res.status(200).json({
        completedLessons: 0,
        totalLessons: 0,
        percent: 0,
        weeklyLessons: 0,
        lastLesson: null,
      });
    }

    // ── Aggregati globali ──────────────────────────────────────────
    const completedLessons = allProgress.filter(p => p.completed).length;
    const totalLessons = allProgress.length; // solo lezioni avviate
    const percent = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    // ── Lezioni viste questa settimana ────────────────────────────
    const weeklyLessons = allProgress.filter(
      p => p.updatedAt >= sevenDaysAgo
    ).length;

    // ── Ultima lezione aperta ─────────────────────────────────────
    // allProgress è già ordinato per updatedAt desc → il primo è l'ultimo accesso
    const last = allProgress[0];
    const lessonProgress = last.watchedSeconds > 0 || last.resumeAt > 0
      ? last
      : allProgress.find(p => p.watchedSeconds > 0 || p.resumeAt > 0) || last;

    const totalSecondsForPct = lessonProgress.totalSeconds > 0 ? lessonProgress.totalSeconds : 1;
    const progressPercent = Math.round(
      (lessonProgress.watchedSeconds / totalSecondsForPct) * 100
    );

    const lastLesson = {
      courseSlug:      lessonProgress.course.slug,
      courseTitle:     lessonProgress.course.title,
      courseLang:      lessonProgress.course.lang,
      lessonId:        lessonProgress.lesson.id,
      lessonTitle:     lessonProgress.lesson.title,
      lessonSortOrder: lessonProgress.lesson.sortOrder,
      resumeAt:        lessonProgress.resumeAt,
      progressPercent: Math.min(100, progressPercent),
      completed:       lessonProgress.completed,
    };

    return res.status(200).json({
      completedLessons,
      totalLessons,
      percent,
      weeklyLessons,
      lastLesson,
    });
  } catch (err) {
    console.error('[progress/overview] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
