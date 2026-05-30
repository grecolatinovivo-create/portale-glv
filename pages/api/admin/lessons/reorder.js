// pages/api/admin/lessons/reorder.js
// POST { courseId, order: [{ id, sortOrder }] } — riordina le lezioni di un corso.
// Solo admin.

const { prisma } = require('../../../../lib/prisma');
const { withAuth } = require('../../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { courseId, order } = req.body || {};
  if (!courseId || !Array.isArray(order) || order.length === 0) {
    return res.status(400).json({ error: 'courseId e order[] sono obbligatori' });
  }

  try {
    // Sicurezza: aggiorna solo lezioni che appartengono a questo corso
    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      select: { id: true },
    });
    const validIds = new Set(lessons.map(l => l.id));

    const updates = order
      .filter(o => o && validIds.has(o.id))
      .map(o =>
        prisma.lesson.update({
          where: { id: o.id },
          data: { sortOrder: parseInt(o.sortOrder, 10) || 0 },
        })
      );

    await prisma.$transaction(updates);

    await prisma.adminLog.create({
      data: {
        adminEmail: req.user.email,
        action: 'REORDER_LESSONS',
        targetType: 'course',
        targetId: courseId,
        payload: JSON.stringify({ count: updates.length }),
      },
    });

    return res.status(200).json({ ok: true, updated: updates.length });
  } catch (err) {
    console.error('[admin/lessons/reorder]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
