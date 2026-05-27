// pages/api/favorites/index.js
// GET  → { favorites: [{ courseId, slug, title, lang, level, firstVimeoUrl }] }
// Restituisce i corsi preferiti dell'utente autenticato (non revocati, disponibili).

const { prisma }   = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  try {
    const favs = await prisma.favorite.findMany({
      where: { userId: req.user.userId },
      include: {
        course: {
          select: {
            id:    true,
            slug:  true,
            title: true,
            lang:  true,
            level: true,
            isAvailable: true,
            tierRequired: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filtra corsi non più disponibili (rimossi dal catalogo)
    const available = favs.filter(f => f.course.isAvailable);

    // Per ogni corso recupera la prima vimeoUrl (per la thumbnail Netflix)
    const courseIds = available.map(f => f.course.id);
    const firstLessons = await prisma.lesson.findMany({
      where: { courseId: { in: courseIds }, vimeoUrl: { not: null } },
      orderBy: { sortOrder: 'asc' },
      select: { courseId: true, vimeoUrl: true },
    });
    const firstVimeoMap = {};
    for (const l of firstLessons) {
      if (!firstVimeoMap[l.courseId]) firstVimeoMap[l.courseId] = l.vimeoUrl;
    }

    const favorites = available.map(f => ({
      courseId:      f.course.id,
      slug:          f.course.slug,
      title:         f.course.title,
      lang:          f.course.lang,
      level:         f.course.level,
      tierRequired:  f.course.tierRequired,
      firstVimeoUrl: firstVimeoMap[f.course.id] ?? null,
      savedAt:       f.createdAt,
    }));

    return res.status(200).json({ favorites });
  } catch (err) {
    console.error('[favorites/index] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
