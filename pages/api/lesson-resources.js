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
      },
    });

    // Costruisce l'URL pubblico per ogni file
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const result = resources.map(r => ({
      id: r.id,
      title: r.title,
      filename: r.filename,
      fileType: r.fileType,
      url: `${baseUrl}/resources/lessons/${r.filename}`,
    }));

    return res.status(200).json({ resources: result });
  } catch (err) {
    console.error('[lesson-resources] Errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
