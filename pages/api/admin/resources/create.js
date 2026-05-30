// pages/api/admin/resources/create.js
// POST { lessonId, url, filename, contentType? } — registra in DB un materiale
// già caricato su Vercel Blob (upload client-side completato). Solo admin.

const { prisma } = require('../../../../lib/prisma');
const { withAuth } = require('../../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

function getFileType(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['mp3', 'm4a', 'wav', 'ogg'].includes(ext)) return 'audio';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image';
  return 'other';
}

function cleanTitle(filename) {
  return filename.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim() || filename;
}

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { lessonId, url, filename } = req.body || {};
  if (!lessonId) return res.status(400).json({ error: 'lessonId è obbligatorio' });
  if (!url || !filename) return res.status(400).json({ error: 'url e filename sono obbligatori' });

  // Sicurezza: accetta solo URL del nostro Blob (evita di registrare link arbitrari)
  if (!url.includes('blob.vercel-storage.com')) {
    return res.status(400).json({ error: 'URL non valido (atteso Vercel Blob)' });
  }

  try {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
    if (!lesson) return res.status(404).json({ error: 'Lezione non trovata' });

    const last = await prisma.lessonResource.findFirst({
      where: { lessonId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (last?.sortOrder || 0) + 1;

    const resource = await prisma.lessonResource.create({
      data: {
        lessonId,
        title: cleanTitle(filename),
        filename,
        blobUrl: url,
        fileType: getFileType(filename),
        sortOrder,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminEmail: req.user.email,
        action: 'UPLOAD_RESOURCE',
        targetType: 'lesson',
        targetId: lessonId,
        payload: JSON.stringify({ resourceId: resource.id, filename }),
      },
    });

    return res.status(201).json({ ok: true, resource });
  } catch (err) {
    console.error('[admin/resources/create]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
