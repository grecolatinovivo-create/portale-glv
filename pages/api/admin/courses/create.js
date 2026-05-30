// pages/api/admin/courses/create.js
// POST — crea un nuovo corso. Di default NASCOSTO (isAvailable:false).
// Solo admin (email === ADMIN_EMAIL).

const { prisma } = require('../../../../lib/prisma');
const { withAuth } = require('../../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

// Genera uno slug URL-safe da una stringa
function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // rimuove accenti
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const {
    title,
    slug,
    description = '',
    lang = 'Latino',
    level = '',
    tierRequired = 'cultura',
    priceEur = 0,
  } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Il titolo è obbligatorio' });
  }

  try {
    // Slug: usa quello fornito o derivalo dal titolo; garantisce unicità
    let baseSlug = slugify(slug && slug.trim() ? slug : title);
    if (!baseSlug) baseSlug = 'corso';
    let finalSlug = baseSlug;
    let n = 1;
    // eslint-disable-next-line no-await-in-loop
    while (await prisma.course.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${n++}`;
    }

    // sortOrder: in coda
    const last = await prisma.course.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (last?.sortOrder || 0) + 1;

    const course = await prisma.course.create({
      data: {
        slug: finalSlug,
        title: title.trim(),
        description: (description || '').trim(),
        lang: (lang || 'Latino').trim(),
        level: (level || '').trim(),
        tierRequired: tierRequired || null,
        priceEur: parseInt(priceEur, 10) || 0,
        isAvailable: false, // NASCOSTO di default — diventa visibile solo con "Pubblica"
        isNew: false,
        sortOrder,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminEmail: req.user.email,
        action: 'CREATE_COURSE',
        targetType: 'course',
        targetId: course.id,
        payload: JSON.stringify({ slug: finalSlug, title: course.title }),
      },
    });

    return res.status(201).json({ ok: true, course });
  } catch (err) {
    console.error('[admin/courses/create]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
