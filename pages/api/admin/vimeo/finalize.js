// pages/api/admin/vimeo/finalize.js
// POST { lessonId, vimeoUri } — dopo che il browser ha completato l'upload tus,
// salva l'URL Vimeo sulla lezione e imposta lo stato a 'processing'. Solo admin.

const { prisma } = require('../../../../lib/prisma');
const { withAuth } = require('../../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';
const VIMEO_API = 'https://api.vimeo.com';

// Forza la privacy corretta su un video Vimeo: non visibile su vimeo.com ma
// embeddabile dal nostro player. Best-effort: se fallisce non blocca il salvataggio.
async function setVideoPrivacy(token, vimeoId) {
  try {
    await fetch(`${VIMEO_API}/videos/${vimeoId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
      body: JSON.stringify({ privacy: { view: 'disable', embed: 'public' } }),
    });
  } catch (e) {
    console.warn('[vimeo/finalize] setVideoPrivacy fallito (best-effort):', e.message);
  }
}

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { lessonId, vimeoUri } = req.body || {};
  if (!lessonId || !vimeoUri) {
    return res.status(400).json({ error: 'lessonId e vimeoUri sono obbligatori' });
  }

  // Estrae l'id numerico da "/videos/123456789"
  const m = String(vimeoUri).match(/(\d+)/);
  if (!m) return res.status(400).json({ error: 'vimeoUri non valido' });
  const vimeoId  = m[1];
  const vimeoUrl = `https://vimeo.com/${vimeoId}`;

  try {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
    if (!lesson) return res.status(404).json({ error: 'Lezione non trovata' });

    // Assicura che il video sia embeddabile dal portale (privacy corretta)
    const token = process.env.VIMEO_ACCESS_TOKEN;
    if (token) await setVideoPrivacy(token, vimeoId);

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: { vimeoUrl, vimeoStatus: 'processing' },
    });

    await prisma.adminLog.create({
      data: {
        adminEmail: req.user.email,
        action: 'SET_LESSON_VIDEO',
        targetType: 'lesson',
        targetId: lessonId,
        payload: JSON.stringify({ vimeoUrl }),
      },
    });

    return res.status(200).json({ ok: true, lesson: updated });
  } catch (err) {
    console.error('[vimeo/finalize]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
