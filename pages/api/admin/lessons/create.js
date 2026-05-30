// pages/api/admin/lessons/create.js
// POST — crea una nuova lezione in un corso. Solo admin.
// isFree è SEMPRE false (regola di progetto). Il tier è del corso, non della lezione.

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

  const {
    courseId,
    title,
    description = '',
    durationMin = 1,
    vimeoUrl = null,
    sortOrder,
  } = req.body || {};

  if (!courseId) return res.status(400).json({ error: 'courseId è obbligatorio' });
  if (!title || !title.trim()) return res.status(400).json({ error: 'Il titolo è obbligatorio' });

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
    if (!course) return res.status(404).json({ error: 'Corso non trovato' });

    // sortOrder: se non fornito, in coda alle lezioni esistenti
    let order = parseInt(sortOrder, 10);
    if (isNaN(order)) {
      const last = await prisma.lesson.findFirst({
        where: { courseId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      order = (last?.sortOrder || 0) + 1;
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title: title.trim(),
        description: (description || '').trim() || null,
        durationMin: Math.max(1, parseInt(durationMin, 10) || 1),
        vimeoUrl: vimeoUrl || null,
        isFree: false, // REGOLA ASSOLUTA: mai true
        sortOrder: order,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminEmail: req.user.email,
        action: 'CREATE_LESSON',
        targetType: 'lesson',
        targetId: lesson.id,
        payload: JSON.stringify({ courseId, title: lesson.title }),
      },
    });

    return res.status(201).json({ ok: true, lesson });
  } catch (err) {
    console.error('[admin/lessons/create]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
