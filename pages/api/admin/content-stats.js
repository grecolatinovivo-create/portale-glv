// pages/api/admin/content-stats.js
// Calcola: % minutaggio Familia Romana sul totale portale
// e commissione editore (20% sulla quota FR del MRR)

const { prisma } = require('../../../lib/prisma');
const { requireAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

const FR_LEVELS = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B1.3'];

// Solo i piani che includono Familia Romana (Latino A1.1–B1.3)
const PLAN_MONTHLY_PRICE = {
  'linguae-mensile':   12.90,
  'linguae-annuale':   99  / 12,
  'accademia-mensile': 19.90,
  'accademia-annuale': 179 / 12,
};

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  try {
    // ── Minutaggio totale portale ─────────────────────────────
    const allLessons = await prisma.lesson.findMany({
      select: { durationMin: true },
    });
    const totalMinutes = allLessons.reduce((s, l) => s + (l.durationMin || 0), 0);

    // ── Minutaggio Familia Romana ─────────────────────────────
    const frCourses = await prisma.course.findMany({
      where: { lang: 'Latino', level: { in: FR_LEVELS } },
      include: { lessons: { select: { durationMin: true } } },
    });
    const frMinutes = frCourses.reduce(
      (s, c) => s + c.lessons.reduce((ls, l) => ls + (l.durationMin || 0), 0),
      0
    );
    const pctMinutes = totalMinutes > 0
      ? (frMinutes / totalMinutes) * 100
      : 0;

    // ── Abbonati per piano (status active) ───────────────────
    const plans = Object.keys(PLAN_MONTHLY_PRICE);
    const subCounts = {};
    await Promise.all(plans.map(async (plan) => {
      subCounts[plan] = await prisma.subscription.count({
        where: { plan, status: 'active' },
      });
    }));

    // ── MRR per tier (solo Linguae + Accademia) ───────────────
    const mrrLinguae   = (subCounts['linguae-mensile']   || 0) * PLAN_MONTHLY_PRICE['linguae-mensile']
                       + (subCounts['linguae-annuale']   || 0) * PLAN_MONTHLY_PRICE['linguae-annuale'];
    const mrrAccademia = (subCounts['accademia-mensile'] || 0) * PLAN_MONTHLY_PRICE['accademia-mensile']
                       + (subCounts['accademia-annuale'] || 0) * PLAN_MONTHLY_PRICE['accademia-annuale'];
    const mrr = mrrLinguae + mrrAccademia;

    // ── Commissione editore per tier ──────────────────────────
    const pct = pctMinutes / 100;
    const commLinguae   = mrrLinguae   * pct * 0.20;
    const commAccademia = mrrAccademia * pct * 0.20;
    const commission    = commLinguae + commAccademia;

    return res.status(200).json({
      pctMinutes:   parseFloat(pctMinutes.toFixed(2)),
      mrr:          parseFloat(mrr.toFixed(2)),
      mrrLinguae:   parseFloat(mrrLinguae.toFixed(2)),
      mrrAccademia: parseFloat(mrrAccademia.toFixed(2)),
      frRevenue:    parseFloat((mrr * pct).toFixed(2)),
      commission:   parseFloat(commission.toFixed(2)),
      commissionAnnual: parseFloat((commission * 12).toFixed(2)),
      commLinguae:   parseFloat(commLinguae.toFixed(2)),
      commAccademia: parseFloat(commAccademia.toFixed(2)),
      subCounts,
      totalSubs: (subCounts['linguae-mensile'] || 0) + (subCounts['linguae-annuale'] || 0)
               + (subCounts['accademia-mensile'] || 0) + (subCounts['accademia-annuale'] || 0),
    });
  } catch (err) {
    console.error('[admin/content-stats]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
