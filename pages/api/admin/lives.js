// pages/api/admin/lives.js — Gestione live mensili (admin)
// GET / POST / PUT / DELETE

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  if (req.method === 'GET') {
    try {
      const lives = await prisma.liveSession.findMany({
        orderBy: { startAt: 'desc' },
        include: {
          _count: { select: { bookings: true } },
          bookings: { include: { user: { select: { fullName: true, email: true } } } },
        },
      });
      return res.status(200).json({ lives });
    } catch (err) {
      console.error('[admin/lives GET]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  if (req.method === 'POST') {
    const { title, description, startAt, durationMin, zoomLink } = req.body || {};
    if (!title || !startAt || !zoomLink) {
      return res.status(400).json({ error: 'title, startAt e zoomLink sono obbligatori' });
    }
    try {
      const live = await prisma.liveSession.create({
        data: {
          title: title.trim(), description: description || null,
          startAt: new Date(startAt),
          durationMin: parseInt(durationMin, 10) || 60,
          zoomLink: zoomLink.trim(),
        },
      });
      await prisma.adminLog.create({
        data: { adminEmail: req.user.email, action: 'CREATE_LIVE', targetType: 'live', targetId: live.id, payload: JSON.stringify({ title, startAt }) },
      });
      return res.status(201).json({ ok: true, live });
    } catch (err) {
      console.error('[admin/lives POST]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  if (req.method === 'PUT') {
    const { id, title, description, startAt, durationMin, zoomLink, isPublished } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id obbligatorio' });
    try {
      const data = {};
      if (title !== undefined && title.trim()) data.title = title.trim();
      if (description !== undefined) data.description = description || null;
      if (startAt !== undefined) {
        data.startAt = new Date(startAt);
        // se cambia la data, resetta i reminder già inviati
        data.remind24Sent = false; data.remind2Sent = false;
      }
      if (durationMin !== undefined) data.durationMin = parseInt(durationMin, 10) || 60;
      if (zoomLink !== undefined && zoomLink.trim()) data.zoomLink = zoomLink.trim();
      if (isPublished !== undefined) data.isPublished = Boolean(isPublished);
      const live = await prisma.liveSession.update({ where: { id }, data });
      await prisma.adminLog.create({
        data: { adminEmail: req.user.email, action: 'UPDATE_LIVE', targetType: 'live', targetId: id, payload: JSON.stringify(data) },
      });
      return res.status(200).json({ ok: true, live });
    } catch (err) {
      console.error('[admin/lives PUT]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id obbligatorio' });
    try {
      await prisma.liveSession.delete({ where: { id } });
      await prisma.adminLog.create({
        data: { adminEmail: req.user.email, action: 'DELETE_LIVE', targetType: 'live', targetId: id, payload: '{}' },
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[admin/lives DELETE]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
