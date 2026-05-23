// pages/api/download-resource.js
// GET ?id=xxx&type=lesson|course
// Verifica autenticazione, poi redirect al blob URL pubblico.
// L'URL blob è opaco (non indovinabile) — serve autenticazione per ottenerlo.

const { prisma } = require('../../lib/prisma');
const { withAuth } = require('../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id, type = 'course' } = req.query;
  if (!id) return res.status(400).json({ error: 'id obbligatorio' });

  try {
    let resource;
    if (type === 'lesson') {
      resource = await prisma.lessonResource.findUnique({
        where: { id },
        select: { filename: true, blobUrl: true },
      });
    } else {
      resource = await prisma.courseResource.findUnique({
        where: { id },
        select: { filename: true, blobUrl: true },
      });
    }

    if (!resource) return res.status(404).json({ error: 'Risorsa non trovata' });
    if (!resource.blobUrl) return res.status(404).json({ error: 'File non ancora migrato' });

    // Redirect al blob URL — il client scarica direttamente da Vercel CDN
    res.redirect(302, resource.blobUrl);

  } catch (err) {
    console.error('[download-resource] Errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
