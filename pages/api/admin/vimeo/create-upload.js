// pages/api/admin/vimeo/create-upload.js
// POST { lessonId, name, size } — crea un video su Vimeo (approccio tus, resumable)
// e ritorna l'upload_link. Il file verrà caricato DIRETTAMENTE dal browser su Vimeo
// (tus-js-client), senza passare dal nostro server. Solo admin.
//
// Richiede env VIMEO_ACCESS_TOKEN con scope: upload, edit, video_files.

const { prisma } = require('../../../../lib/prisma');
const { withAuth } = require('../../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';
const VIMEO_API = 'https://api.vimeo.com';

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'VIMEO_ACCESS_TOKEN non configurato sul server' });
  }

  const { lessonId, name, size } = req.body || {};
  if (!lessonId) return res.status(400).json({ error: 'lessonId è obbligatorio' });
  if (!size || isNaN(parseInt(size, 10))) return res.status(400).json({ error: 'size (byte) è obbligatorio' });

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, course: { select: { title: true } } },
    });
    if (!lesson) return res.status(404).json({ error: 'Lezione non trovata' });

    // Crea il video su Vimeo con upload resumable (tus)
    const vimeoRes = await fetch(`${VIMEO_API}/me/videos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
      body: JSON.stringify({
        upload: { approach: 'tus', size: String(size) },
        name: name || 'Lezione',
        description: lesson.course?.title ? `Corso: ${lesson.course.title}` : undefined,
        // Privacy: visibile solo via embed sui domini whitelistati (impostati su Vimeo).
        // 'disable' = non accessibile su vimeo.com; embed controllato a livello account.
        privacy: { view: 'disable', embed: 'whitelist' },
      }),
    });

    const data = await vimeoRes.json();
    if (!vimeoRes.ok) {
      console.error('[vimeo/create-upload] Vimeo error:', data);
      return res.status(502).json({ error: data.error || 'Errore Vimeo', detail: data });
    }

    const uploadLink = data?.upload?.upload_link;
    const vimeoUri   = data?.uri; // es. "/videos/123456789"
    if (!uploadLink || !vimeoUri) {
      return res.status(502).json({ error: 'Risposta Vimeo incompleta', detail: data });
    }

    return res.status(200).json({ ok: true, uploadLink, vimeoUri });
  } catch (err) {
    console.error('[vimeo/create-upload]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
