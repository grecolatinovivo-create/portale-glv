// pages/api/download-resource.js
// GET ?id=xxx
// Proxy autenticato per i materiali. Verifica che l'utente abbia ACCESSO AL CORSO
// della lezione a cui il materiale appartiene, poi fa redirect 302 al file.
// Così i materiali a pagamento sono protetti come i video (admin/acquisto/abbonamento).

const { prisma } = require('../../lib/prisma');
const { withAuth } = require('../../lib/auth');
const { checkCourseAccess } = require('../../lib/courseAccess');

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id obbligatorio' });

  try {
    // Recupera la risorsa + il corso della lezione (per il controllo accesso)
    const resource = await prisma.lessonResource.findUnique({
      where: { id },
      select: {
        filename: true,
        blobUrl: true,
        lesson: {
          select: {
            course: { select: { id: true, tierRequired: true, expiresAt: true } },
          },
        },
      },
    });

    if (!resource) return res.status(404).json({ error: 'Risorsa non trovata' });
    if (!resource.blobUrl) return res.status(404).json({ error: 'File non ancora disponibile' });

    const course = resource.lesson?.course;
    if (!course) return res.status(404).json({ error: 'Corso non trovato' });

    // Controllo accesso (admin / acquisto / abbonamento attivo + tier + scadenze)
    const { hasAccess } = await checkCourseAccess(req.user, course);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Accesso non consentito a questo materiale' });
    }

    // Redirect al file (Vercel Blob o, per i non ancora migrati, Aruba)
    res.redirect(302, resource.blobUrl);
  } catch (err) {
    console.error('[download-resource] Errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
