// pages/api/progress/certificate/[courseId].js — Download attestato PDF
// GET /api/progress/certificate/lat-a11
// Verifica che il corso sia completato al 100%, poi genera e invia il PDF

const { prisma } = require('../../../../lib/prisma');
const { withAuth } = require('../../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  const { courseId } = req.query; // slug del corso

  try {
    // Carica il corso con tutte le sue lezioni
    const course = await prisma.course.findUnique({
      where: { slug: courseId },
      include: { lessons: { select: { id: true } } },
    });

    if (!course) {
      return res.status(404).json({ error: 'Corso non trovato' });
    }

    // Verifica che l'utente abbia completato tutte le lezioni
    const totalLessons = course.lessons.length;
    if (totalLessons === 0) {
      return res.status(400).json({ error: 'Il corso non ha lezioni registrate' });
    }

    const completedCount = await prisma.lessonProgress.count({
      where: {
        userId: req.user.userId,
        courseId: course.id,
        completed: true,
      },
    });

    if (completedCount < totalLessons) {
      return res.status(403).json({
        error: 'Corso non ancora completato',
        completedLessons: completedCount,
        totalLessons,
        percent: Math.round((completedCount / totalLessons) * 100),
      });
    }

    // Recupera i dati dell'utente e la data di completamento
    const [user, latestProgress] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { fullName: true, email: true },
      }),
      prisma.lessonProgress.findFirst({
        where: { userId: req.user.userId, courseId: course.id, completed: true },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      }),
    ]);

    // Genera il PDF
    const { generateCertificate } = require('../../../../lib/certificate');
    const pdfBuffer = await generateCertificate({
      studentName: user?.fullName || user?.email || 'Studente',
      courseTitle: course.title,
      courseLang: course.lang,
      courseLevel: course.level,
      completedAt: latestProgress?.completedAt ?? new Date(),
    });

    // Invia il PDF come download
    const safeTitle = course.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .slice(0, 40);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attestato_${safeTitle}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.status(200).end(pdfBuffer);
  } catch (err) {
    console.error('[progress/certificate] Errore:', err);
    // Errore specifico se pdfkit non è installato
    if (err.code === 'MODULE_NOT_FOUND') {
      return res.status(500).json({
        error: 'Libreria PDF non installata. Esegui: npm install pdfkit',
      });
    }
    return res.status(500).json({ error: 'Errore nella generazione del PDF' });
  }
});
