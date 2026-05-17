// pages/api/admin/courses.js
// GET  — lista tutti i corsi con metriche (iscritti, completamenti)
// POST — aggiorna un corso (expiresAt, availableUntilLabel, isAvailable, isNew)
// Accessibile solo all'admin (email = ADMIN_EMAIL)

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  // ── GET — lista corsi ────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      // Recupera i corsi con tutti i campi disponibili
      // expiresAt / availableUntilLabel sono nuovi: se non esistono nel DB
      // (prisma db push non ancora eseguito) Prisma li restituirà come undefined
      const courses = await prisma.course.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          _count: {
            select: {
              lessons: true,
              purchases: true,
              certificates: true,
            },
          },
        },
      });

      // Per ogni corso calcola views totali e studenti distinti
      const courseIds = courses.map(c => c.id);

      // viewCount = totale record LessonProgress (quante volte una lezione è stata aperta)
      const viewGroups = await prisma.lessonProgress.groupBy({
        by: ['courseId'],
        where: { courseId: { in: courseIds } },
        _count: { _all: true },
      });
      const viewsMap = Object.fromEntries(
        viewGroups.map(g => [g.courseId, g._count._all])
      );

      // studentsStarted = utenti DISTINTI che hanno almeno una riga in LessonProgress
      // (Prisma non supporta _countDistinct — usiamo groupBy su [courseId, userId])
      const studentPairs = await prisma.lessonProgress.groupBy({
        by: ['courseId', 'userId'],
        where: { courseId: { in: courseIds } },
      });
      const studentsMap = {};
      studentPairs.forEach(p => {
        studentsMap[p.courseId] = (studentsMap[p.courseId] || 0) + 1;
      });

      const now = new Date();
      const enriched = courses.map(c => ({
        ...c,
        stats: {
          lessonCount:      c._count.lessons,
          purchaseCount:    c._count.purchases,
          certificateCount: c._count.certificates,
          studentsStarted:  studentsMap[c.id] || 0,
          viewCount:        viewsMap[c.id]    || 0,
        },
        isExpiringSoon:
          c.expiresAt !== null &&
          c.expiresAt > now &&
          c.expiresAt <= new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        isExpired: c.expiresAt !== null && c.expiresAt <= now,
        _count: undefined, // rimuovi dal response
      }));

      return res.status(200).json({ courses: enriched });
    } catch (err) {
      console.error('[admin/courses GET]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  // ── POST — aggiorna corso ────────────────────────────────────────
  if (req.method === 'POST') {
    const {
      courseId,
      expiresAt,          // ISO string o null
      availableUntilLabel,
      isAvailable,
      isNew,
      sortOrder,
    } = req.body || {};

    if (!courseId) {
      return res.status(400).json({ error: 'courseId è obbligatorio' });
    }

    try {
      const existing = await prisma.course.findUnique({ where: { id: courseId } });
      if (!existing) return res.status(404).json({ error: 'Corso non trovato' });

      const updateData = {};

      if (expiresAt !== undefined) {
        updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      }
      if (availableUntilLabel !== undefined) {
        updateData.availableUntilLabel = availableUntilLabel || null;
      }
      if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable);
      if (isNew !== undefined) updateData.isNew = Boolean(isNew);
      if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder) || 0;

      const updated = await prisma.course.update({
        where: { id: courseId },
        data: updateData,
      });

      // Scrivi AdminLog
      await prisma.adminLog.create({
        data: {
          adminEmail: req.user.email,
          action: 'UPDATE_COURSE',
          targetType: 'course',
          targetId: courseId,
          payload: JSON.stringify({ before: existing, changes: updateData }),
        },
      });

      return res.status(200).json({ ok: true, course: updated });
    } catch (err) {
      console.error('[admin/courses POST]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
