// pages/api/course-resources.js
// GET ?courseId=xxx — risorse scaricabili del corso (PDF, slide, esercizi...)
// Richiede autenticazione

const { prisma } = require('../../lib/prisma');
const { withAuth } = require('../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { courseId } = req.query;
  if (!courseId) return res.status(400).json({ error: 'courseId obbligatorio' });

  try {
    const resources = await prisma.courseResource.findMany({
      where: { courseId },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true, filename: true, fileType: true },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const result = resources.map(r => ({
      id: r.id,
      title: r.title,
      filename: r.filename,
      fileType: r.fileType,
      downloadUrl: `${baseUrl}/api/download-resource?id=${r.id}&type=course`,
    }));

    return res.status(200).json({ resources: result });
  } catch (err) {
    console.error('[course-resources] Errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
