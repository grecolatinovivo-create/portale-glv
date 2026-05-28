// pages/api/admin/content-stats.js
// Restituisce statistiche sui contenuti del portale:
// - totale lezioni e minuti
// - Familia Romana (Latino A1.1–B1.3)
// - breakdown per livello
// - abbonati Linguae + Accademia

const { prisma } = require('../../../lib/prisma');
const { requireAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

const FR_LEVELS = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B1.3'];

const LINGUAE_PLANS = ['linguae-mensile', 'linguae-annuale'];
const ACCADEMIA_PLANS = ['accademia-mensile', 'accademia-annuale'];

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  // Solo admin
  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  try {
    // ── 1. Totale portale ─────────────────────────────────────────
    const allLessons = await prisma.lesson.findMany({
      select: { durationMin: true },
    });
    const totalLessons = allLessons.length;
    const totalMinutes = allLessons.reduce((s, l) => s + (l.durationMin || 0), 0);

    // ── 2. Familia Romana: corsi Latino A1.1–B1.3 ────────────────
    const frCourses = await prisma.course.findMany({
      where: {
        lang: 'Latino',
        level: { in: FR_LEVELS },
      },
      include: {
        lessons: { select: { id: true, durationMin: true } },
      },
    });

    const frTotalLessons = frCourses.reduce((s, c) => s + c.lessons.length, 0);
    const frTotalMinutes = frCourses.reduce(
      (s, c) => s + c.lessons.reduce((ls, l) => ls + (l.durationMin || 0), 0),
      0
    );

    // ── 3. Breakdown per livello ──────────────────────────────────
    const breakdownMap = {};
    for (const level of FR_LEVELS) {
      breakdownMap[level] = { courses: 0, lessons: 0, minutes: 0 };
    }
    for (const course of frCourses) {
      const lvl = course.level;
      if (breakdownMap[lvl]) {
        breakdownMap[lvl].courses  += 1;
        breakdownMap[lvl].lessons  += course.lessons.length;
        breakdownMap[lvl].minutes  += course.lessons.reduce((s, l) => s + (l.durationMin || 0), 0);
      }
    }
    const breakdown = FR_LEVELS.map(level => ({ level, ...breakdownMap[level] }));

    // ── 4. Abbonati Linguae + Accademia (stato active) ────────────
    const linguaeCount = await prisma.subscription.count({
      where: { plan: { in: LINGUAE_PLANS }, status: 'active' },
    });
    const accademiaCount = await prisma.subscription.count({
      where: { plan: { in: ACCADEMIA_PLANS }, status: 'active' },
    });

    // ── 5. % sul totale ───────────────────────────────────────────
    const pctLessons = totalLessons > 0
      ? ((frTotalLessons / totalLessons) * 100).toFixed(1)
      : '0.0';
    const pctMinutes = totalMinutes > 0
      ? ((frTotalMinutes / totalMinutes) * 100).toFixed(1)
      : '0.0';

    return res.status(200).json({
      total: {
        lessons: totalLessons,
        minutes: totalMinutes,
        hours:   Math.floor(totalMinutes / 60),
      },
      familiaRomana: {
        courses: frCourses.length,
        lessons: frTotalLessons,
        minutes: frTotalMinutes,
        hours:   Math.floor(frTotalMinutes / 60),
        pctLessons,
        pctMinutes,
        breakdown,
      },
      subscribers: {
        linguae:  linguaeCount,
        accademia: accademiaCount,
        total:    linguaeCount + accademiaCount,
      },
    });
  } catch (err) {
    console.error('[admin/content-stats]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
