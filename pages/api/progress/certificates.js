// pages/api/progress/certificates.js — Lista degli attestati emessi all'utente
// Interroga direttamente la tabella Certificate (non ricostruisce dai LessonProgress).
// GET → { certificates: [ { certCode, courseId, slug, title, lang, level, issuedAt, downloadUrl } ] }

const { prisma }    = require('../../../lib/prisma');
const { withAuth }  = require('../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  try {
    // Recupera tutti i certificati attivi (non revocati) dell'utente, con dati corso
    const certs = await prisma.certificate.findMany({
      where: {
        userId:    req.user.userId,
        revokedAt: null,                  // esclude i revocati
      },
      include: {
        course: {
          select: { id: true, slug: true, title: true, lang: true, level: true },
        },
      },
      orderBy: { issuedAt: 'desc' },      // più recente prima
    });

    const certificates = certs.map(c => ({
      certCode:    c.certCode,
      courseId:    c.course.id,
      slug:        c.course.slug,
      title:       c.course.title,
      lang:        c.course.lang,
      level:       c.course.level,
      issuedAt:    c.issuedAt,
      downloadUrl: `/api/progress/certificate/${c.course.slug}`,
      verifyUrl:   `/verifica/${c.certCode}`,
    }));

    return res.status(200).json({ certificates });
  } catch (err) {
    console.error('[progress/certificates] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
