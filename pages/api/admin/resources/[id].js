// pages/api/admin/resources/[id].js
// DELETE — elimina un materiale: rimuove il file dal Blob (se è sul nostro storage)
// e cancella la LessonResource. Solo admin.

import { del } from '@vercel/blob';
const { prisma } = require('../../../../lib/prisma');
const { withAuth } = require('../../../../lib/auth');

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
    const resource = await prisma.lessonResource.findUnique({ where: { id } });
    if (!resource) return res.status(404).json({ error: 'Materiale non trovato' });

    // Elimina dal Blob solo se è ospitato sul NOSTRO storage (i vecchi file Aruba
    // non vanno toccati: non sono nostri e potrebbero servire altrove).
    if (resource.blobUrl && resource.blobUrl.includes('blob.vercel-storage.com')) {
      try {
        await del(resource.blobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
      } catch (e) {
        console.warn('[admin/resources/delete] del Blob fallito (procedo comunque):', e.message);
      }
    }

    await prisma.lessonResource.delete({ where: { id } });

    await prisma.adminLog.create({
      data: {
        adminEmail: req.user.email,
        action: 'DELETE_RESOURCE',
        targetType: 'lesson',
        targetId: resource.lessonId,
        payload: JSON.stringify({ resourceId: id, filename: resource.filename }),
      },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[admin/resources/delete]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
