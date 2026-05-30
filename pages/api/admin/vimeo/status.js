// pages/api/admin/vimeo/status.js
// GET ?lessonId=xxx — interroga Vimeo sullo stato di transcoding del video della
// lezione e aggiorna Lesson.vimeoStatus ('processing' | 'ready' | 'error').
// Aggiorna anche durationMin quando il video è pronto. Solo admin.

const { prisma } = require('../../../../lib/prisma');
const { withAuth } = require('../../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';
const VIMEO_API = 'https://api.vimeo.com';

function extractVimeoId(url) {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: 'VIMEO_ACCESS_TOKEN non configurato' });

  const { lessonId } = req.query;
  if (!lessonId) return res.status(400).json({ error: 'lessonId è obbligatorio' });

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, vimeoUrl: true, vimeoStatus: true, durationMin: true },
    });
    if (!lesson) return res.status(404).json({ error: 'Lezione non trovata' });

    const vimeoId = extractVimeoId(lesson.vimeoUrl);
    if (!vimeoId) return res.status(200).json({ status: null, message: 'Nessun video associato' });

    const vimeoRes = await fetch(`${VIMEO_API}/videos/${vimeoId}?fields=transcode.status,duration`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    });
    const data = await vimeoRes.json();
    if (!vimeoRes.ok) {
      return res.status(502).json({ error: 'Errore Vimeo', detail: data });
    }

    // transcode.status: 'in_progress' | 'complete' | 'error'
    const t = data?.transcode?.status;
    let status = 'processing';
    if (t === 'complete') status = 'ready';
    else if (t === 'error') status = 'error';

    const data2 = {};
    if (status !== lesson.vimeoStatus) data2.vimeoStatus = status;
    // Quando pronto, aggiorna la durata reale (Vimeo la dà in secondi)
    if (status === 'ready' && data?.duration) {
      data2.durationMin = Math.max(1, Math.round(data.duration / 60));
    }
    if (Object.keys(data2).length > 0) {
      await prisma.lesson.update({ where: { id: lessonId }, data: data2 });
    }

    return res.status(200).json({
      status,
      durationMin: data2.durationMin || lesson.durationMin,
    });
  } catch (err) {
    console.error('[vimeo/status]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
