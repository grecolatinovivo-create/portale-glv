// pages/api/admin/vimeo/fix-privacy.js
// POST { lessonId }  — ripara la privacy del video Vimeo di una lezione:
//   view: 'disable' (non visibile su vimeo.com) + embed: 'public' (embeddabile dal portale).
// Serve per i video caricati con la vecchia privacy 'whitelist' (che bloccava l'embed).
// Solo admin.

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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: 'VIMEO_ACCESS_TOKEN non configurato' });

  const { lessonId } = req.body || {};
  if (!lessonId) return res.status(400).json({ error: 'lessonId è obbligatorio' });

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, vimeoUrl: true },
    });
    if (!lesson) return res.status(404).json({ error: 'Lezione non trovata' });

    const vimeoId = extractVimeoId(lesson.vimeoUrl);
    if (!vimeoId) return res.status(400).json({ error: 'La lezione non ha un video Vimeo' });

    const r = await fetch(`${VIMEO_API}/videos/${vimeoId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
      body: JSON.stringify({ privacy: { view: 'disable', embed: 'public' } }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('[vimeo/fix-privacy] Vimeo error:', data);
      return res.status(502).json({ error: data.error || 'Errore Vimeo', detail: data });
    }

    return res.status(200).json({ ok: true, privacy: data.privacy });
  } catch (err) {
    console.error('[vimeo/fix-privacy]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
