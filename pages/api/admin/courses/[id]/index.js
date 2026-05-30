// pages/api/admin/courses/[id]/index.js
// DELETE — elimina un corso e (a cascata) le sue lezioni/risorse.
// Solo admin. Operazione distruttiva: il client deve confermare.

const { prisma } = require('../../../../../lib/prisma');
const { withAuth } = require('../../../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { id } = req.query;

  try {
    const existing = await prisma.course.findUnique({
      where: { id },
      include: { _count: { select: { lessons: true, purchases: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Corso non trovato' });

    // Salvaguardia: non eliminare corsi con acquisti singoli associati
    if (existing._count.purchases > 0) {
      return res.status(409).json({
        error: `Impossibile eliminare: il corso ha ${existing._count.purchases} acquisti associati. Nascondilo invece di eliminarlo.`,
      });
    }

    // Le relazioni Lesson/CourseResource hanno onDelete: Cascade nello schema
    await prisma.course.delete({ where: { id } });

    await prisma.adminLog.create({
      data: {
        adminEmail: req.user.email,
        action: 'DELETE_COURSE',
        targetType: 'course',
        targetId: id,
        payload: JSON.stringify({ slug: existing.slug, title: existing.title, lessons: existing._count.lessons }),
      },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[admin/courses/delete]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
