// pages/api/courses/index.js

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

module.exports = withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
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
        _count: {
          select: { lessons: true },
        },
      },
    });

    if (req.user) {
      const progressRows = await prisma.progress.findMany({
        where: { userId: req.user.id },
      });

      // Mappa courseId -> percentuale completamento
      // Raggruppa per courseId
      const progressByCourse = {};
      for (const p of progressRows) {
        if (!progressByCourse[p.courseId]) {
          progressByCourse[p.courseId] = { completed: 0, total: 0 };
        }
        progressByCourse[p.courseId].total += 1;
        if (p.completed) progressByCourse[p.courseId].completed += 1;
      }

      const coursesWithProgress = courses.map((course) => {
        const prog = progressByCourse[course.id];
        const progressPercent = prog && prog.total > 0
          ? Math.round((prog.completed / prog.total) * 100)
          : 0;
        return { ...course, progressPercent };
      });

      return res.status(200).json({ courses: coursesWithProgress });
    }

    return res.status(200).json({ courses });
  } catch (err) {
    console.error('[courses/index]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
