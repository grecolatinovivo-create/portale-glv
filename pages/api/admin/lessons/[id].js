// pages/api/admin/lessons/[id].js
// POST   — aggiorna campi di una lezione (title, description, durationMin, sortOrder, vimeoUrl, vimeoStatus)
// DELETE — elimina una lezione (cascata su LessonProgress, LessonResource)
// Solo admin. isFree resta SEMPRE false (non aggiornabile a true).

const { prisma } = require('../../../../lib/prisma');
const { withAuth } = require('../../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  const { id } = req.query;

  // ── POST — aggiorna ───────────────────────────────────────────────
  if (req.method === 'POST') {
    const { title, description, durationMin, sortOrder, vimeoUrl, vimeoStatus } = req.body || {};

    try {
      const existing = await prisma.lesson.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Lezione non trovata' });

      const data = {};
      if (title !== undefined && title.trim()) data.title = title.trim();
      if (description !== undefined) data.description = (description || '').trim() || null;
      if (durationMin !== undefined) data.durationMin = Math.max(1, parseInt(durationMin, 10) || 1);
      if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder, 10) || 0;
      if (vimeoUrl !== undefined) data.vimeoUrl = vimeoUrl || null;
      if (vimeoStatus !== undefined) data.vimeoStatus = vimeoStatus || null;
      // isFree NON è aggiornabile: resta sempre false (regola di progetto)

      const lesson = await prisma.lesson.update({ where: { id }, data });

      await prisma.adminLog.create({
        data: {
          adminEmail: req.user.email,
          action: 'UPDATE_LESSON',
          targetType: 'lesson',
          targetId: id,
          payload: JSON.stringify({ changes: data }),
        },
      });

      return res.status(200).json({ ok: true, lesson });
    } catch (err) {
      console.error('[admin/lessons/[id] POST]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  // ── DELETE — elimina ──────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const existing = await prisma.lesson.findUnique({
        where: { id },
        include: { _count: { select: { lessonProgress: true, resources: true } } },
      });
      if (!existing) return res.status(404).json({ error: 'Lezione non trovata' });

      // onDelete: Cascade nello schema → progressi e risorse vengono eliminati con la lezione
      await prisma.lesson.delete({ where: { id } });

      await prisma.adminLog.create({
        data: {
          adminEmail: req.user.email,
          action: 'DELETE_LESSON',
          targetType: 'lesson',
          targetId: id,
          payload: JSON.stringify({
            title: existing.title,
            courseId: existing.courseId,
            deletedProgress: existing._count.lessonProgress,
            deletedResources: existing._count.resources,
          }),
        },
      });

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[admin/lessons/[id] DELETE]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  res.setHeader('Allow', ['POST', 'DELETE']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
