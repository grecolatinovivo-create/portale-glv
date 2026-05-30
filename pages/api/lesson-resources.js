// pages/api/lesson-resources.js
// GET ?lessonId=xxx — elenca le risorse scaricabili di una lezione.
// NON espone più l'URL diretto del file: il download passa SEMPRE dal proxy
// autenticato /api/download-resource?id=... che verifica l'accesso al corso.

const { prisma } = require('../../lib/prisma');
const { withAuth } = require('../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { lessonId } = req.query;
  if (!lessonId) return res.status(400).json({ error: 'lessonId obbligatorio' });

  try {
    const resources = await prisma.lessonResource.findMany({
      where: { lessonId },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        filename: true,
        fileType: true,
        // blobUrl NON viene restituito: l'URL reale non esce mai dall'API
      },
    });

    // Il client costruisce il link verso il proxy autenticato.
    const result = resources.map(r => ({
      id: r.id,
      title: r.title,
      filename: r.filename,
      fileType: r.fileType,
      url: `/api/download-resource?id=${encodeURIComponent(r.id)}`,
    }));

    return res.status(200).json({ resources: result });
  } catch (err) {
    console.error('[lesson-resources] Errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
