// pages/api/progress/overview.js — Riepilogo globale progresso utente
// GET → {
//   completedLessons,    // totale lezioni completate su tutti i corsi
//   totalLessons,        // totale lezioni disponibili (solo corsi avviati)
//   percent,             // percentuale completamento globale
//   weeklyLessons,       // lezioni viste/aggiornate negli ultimi 7 giorni
//   lastLesson: { ... } | null,  // ultima lezione aperta (compat. legacy)
//   inProgressLessons: [ // tutti i corsi avviati, ordinati per ultimo accesso
//     { courseSlug, courseTitle, courseLang,
//       lessonId, lessonTitle, lessonSortOrder,
//       resumeAt, progressPercent, completed }
//   ]
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
        completedLessons:  0,
        totalLessons:      0,
        percent:           0,
        weeklyLessons:     0,
        lastLesson:        null,
        inProgressLessons: [],
      });
    }

    // ── Aggregati globali ──────────────────────────────────────────
    const completedLessons = allProgress.filter(p => p.completed).length;
    const totalLessons     = allProgress.length; // solo lezioni avviate
    const percent          = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    // ── Lezioni viste questa settimana ────────────────────────────
    const weeklyLessons = allProgress.filter(
      p => p.updatedAt >= sevenDaysAgo
    ).length;

    // ── Ultimo accesso PER CORSO (per "Riprendi" multi-corso) ─────
    // allProgress è ordinato per updatedAt desc.
    // Per ogni corso prendiamo il record più recente (= il primo che
    // troviamo per quel courseId, dato l'ordinamento desc).
    const coursesMap = new Map();
    for (const p of allProgress) {
      const courseId = p.course.id;
      if (!coursesMap.has(courseId)) {
        // Prima occorrenza = più recente per quel corso
        coursesMap.set(courseId, p);
      }
    }

    // Converti in array già ordinato per ultimo accesso (preserva l'ordine
    // del Map, che segue l'inserimento → updatedAt desc per costruzione).
    const inProgressLessons = Array.from(coursesMap.values()).map(p => {
      const totalSecondsForPct = p.totalSeconds > 0 ? p.totalSeconds : 1;
      const progressPercent    = Math.min(100,
        Math.round((p.watchedSeconds / totalSecondsForPct) * 100)
      );
      return {
        courseSlug:      p.course.slug,
        courseTitle:     p.course.title,
        courseLang:      p.course.lang,
        lessonId:        p.lesson.id,
        lessonTitle:     p.lesson.title,
        lessonSortOrder: p.lesson.sortOrder,
        resumeAt:        p.resumeAt,
        progressPercent,
        completed:       p.completed,
      };
    });

    // ── lastLesson: il primo elemento (legacy compat.) ────────────
    const lastLesson = inProgressLessons[0] || null;

    return res.status(200).json({
      completedLessons,
      totalLessons,
      percent,
      weeklyLessons,
      lastLesson,
      inProgressLessons,
    });
  } catch (err) {
    console.error('[progress/overview] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
