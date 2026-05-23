// pages/api/lesson-resources.js
// GET ?lessonId=xxx — ritorna le risorse scaricabili per una lezione
// Richiede autenticazione

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
        blobUrl: true,
      },
    });

    // Per ogni risorsa, costruisce l'URL di download tramite proxy autenticato.
    // Il client fa GET /api/download-resource?id=xxx — l'API verifica l'auth
    // e proxa il blob privato da Vercel, senza esporre l'URL diretto.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const result = resources.map(r => ({
      id: r.id,
      title: r.title,
      filename: r.filename,
      fileType: r.fileType,
      // URL proxy — richiede autenticazione, non espone URL blob diretto
      downloadUrl: `${baseUrl}/api/download-resource?id=${r.id}`,
    }));

    return res.status(200).json({ resources: result });
  } catch (err) {
    console.error('[lesson-resources] Errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
