// pages/api/admin/courses/[id]/publish.js
// POST { isAvailable: true|false } — pubblica o nasconde un corso.
// Solo admin.

const { prisma } = require('../../../../../lib/prisma');
const { withAuth } = require('../../../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { id } = req.query;
  const { isAvailable } = req.body || {};

  if (typeof isAvailable !== 'boolean') {
    return res.status(400).json({ error: 'isAvailable (boolean) è obbligatorio' });
  }

  try {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Corso non trovato' });

    const course = await prisma.course.update({
      where: { id },
      data: { isAvailable },
    });

    await prisma.adminLog.create({
      data: {
        adminEmail: req.user.email,
        action: isAvailable ? 'PUBLISH_COURSE' : 'HIDE_COURSE',
        targetType: 'course',
        targetId: id,
        payload: JSON.stringify({ isAvailable }),
      },
    });

    return res.status(200).json({ ok: true, course });
  } catch (err) {
    console.error('[admin/courses/publish]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
