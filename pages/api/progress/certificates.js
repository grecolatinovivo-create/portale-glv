// pages/api/progress/certificates.js — Lista degli attestati sbloccati dall'utente
// Un attestato si sblocca quando tutte le lezioni di un corso sono completate (100%)
// GET → { certificates: [ { courseId, slug, title, lang, level, completedAt } ] }

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  try {
    // Recupera tutti i progressi completati dell'utente, raggruppati per corso
    const progressList = await prisma.lessonProgress.findMany({
      where: { userId: req.user.userId },
      include: {
        course: {
          include: {
            lessons: { select: { id: true } },
          },
        },
      },
    });

    // Raggruppa per corso
    const courseMap = new Map();
    for (const p of progressList) {
      const cid = p.courseId;
      if (!courseMap.has(cid)) {
        courseMap.set(cid, {
          course: p.course,
          completed: [],
          all: [],
          latestCompletedAt: null,
        });
      }
      courseMap.get(cid).all.push(p);
      if (p.completed) {
        courseMap.get(cid).completed.push(p);
        // Tieni la data di completamento più recente come data del certificato
        if (!courseMap.get(cid).latestCompletedAt ||
            (p.completedAt && p.completedAt > courseMap.get(cid).latestCompletedAt)) {
          courseMap.get(cid).latestCompletedAt = p.completedAt;
        }
      }
    }

    // Un attestato è sbloccato se tutte le lezioni del corso sono completate
    const certificates = [];
    for (const [courseId, { course, completed, latestCompletedAt }] of courseMap) {
      const totalLessons = course.lessons.length;
      if (totalLessons > 0 && completed.length >= totalLessons) {
        certificates.push({
          courseId,
          slug: course.slug,
          title: course.title,
          lang: course.lang,
          level: course.level,
          completedAt: latestCompletedAt,
          downloadUrl: `/api/progress/certificate/${course.slug}`,
        });
      }
    }

    // Ordina per data di completamento (più recente prima)
    certificates.sort((a, b) =>
      new Date(b.completedAt || 0) - new Date(a.completedAt || 0)
    );

    return res.status(200).json({ certificates });
  } catch (err) {
    console.error('[progress/certificates] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
