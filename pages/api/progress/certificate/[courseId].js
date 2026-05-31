// pages/api/progress/certificate/[courseId].js — Download attestato PDF
// GET /api/progress/certificate/lat-a11
// Verifica che il corso sia completato al 100%, poi genera e invia il PDF

const { prisma } = require('../../../../lib/prisma');
const { withAuth } = require('../../../../lib/auth');

// Forza il runtime Node.js: pdfkit usa API native (Buffer, stream, fontkit) che
// NON funzionano sul runtime Edge. Senza questo, in produzione la generazione
// del PDF potrebbe fallire se Vercel scegliesse Edge.
export const config = { api: { responseLimit: false }, runtime: 'nodejs' };

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

    // Recupera i dati utente, le date di fruizione e il record certificato.
    // Le date dell'attestato sono PER-STUDENTE, ricavate dai progressi reali:
    //   - inizio  = primo LessonProgress creato (quando ha iniziato a vedere il corso)
    //   - fine    = ultimo completamento (quando ha finito di vederlo)
    const [user, firstProgress, latestProgress, cert] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { fullName: true, email: true },
      }),
      prisma.lessonProgress.findFirst({
        where: { userId: req.user.userId, courseId: course.id },
        orderBy: { id: 'asc' }, // il primo record = primo accesso al corso
        select: { updatedAt: true },
      }),
      prisma.lessonProgress.findFirst({
        where: { userId: req.user.userId, courseId: course.id, completed: true },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      }),
      prisma.certificate.findUnique({
        where: { userId_courseId: { userId: req.user.userId, courseId: course.id } },
        select: { certCode: true, revokedAt: true, issuedAt: true },
      }),
    ]);

    let resolvedCert = cert;

    // ── REGOLA D'ACCESSO AL DOWNLOAD ────────────────────────────────────────
    // 1) Se ESISTE già un attestato (emesso automaticamente o MANUALMENTE da admin),
    //    è scaricabile — senza ricontrollare il completamento. L'attestato è la prova.
    // 2) Se è stato REVOCATO dall'admin → bloccato.
    // 3) Se NON esiste, lo si può emettere on-demand SOLO se il corso è completato al 100%.
    if (resolvedCert && resolvedCert.revokedAt) {
      return res.status(403).json({ error: 'Attestato revocato' });
    }

    if (!resolvedCert) {
      const totalLessons = course.lessons.length;
      if (totalLessons === 0) {
        return res.status(400).json({ error: 'Il corso non ha lezioni registrate' });
      }
      const completedCount = await prisma.lessonProgress.count({
        where: { userId: req.user.userId, courseId: course.id, completed: true },
      });
      if (completedCount < totalLessons) {
        return res.status(403).json({
          error: 'Corso non ancora completato',
          completedLessons: completedCount,
          totalLessons,
          percent: Math.round((completedCount / totalLessons) * 100),
        });
      }

      // Corso completato ma record mancante → crea on-demand
      const { generateCertCode } = require('../../../../lib/certificate');
      const newCertCode = generateCertCode();
      resolvedCert = await prisma.certificate.create({
        data: { certCode: newCertCode, userId: req.user.userId, courseId: course.id },
      });
      console.log(`[progress/certificate] Certificato creato on-demand per userId=${req.user.userId} courseId=${course.id}`);

      try {
        if (user) {
          const { sendCertificateEmail } = require('../../../../lib/resend');
          await sendCertificateEmail(user, course, newCertCode);
        }
      } catch (emailErr) {
        console.error('[progress/certificate] Errore invio email (on-demand):', emailErr);
      }
    }

    // Genera il PDF (template fedele latin-cert)
    // Date per-studente dai progressi; data emissione = oggi (o issuedAt del cert).
    const { generateCertificate } = require('../../../../lib/certificate');
    const pdfBuffer = await generateCertificate({
      studentName: user?.fullName || user?.email || 'Studente',
      courseTitle: course.title,
      sofiaCode:   course.sofiaCode || '',
      startDate:   firstProgress?.updatedAt || null,        // quando ha iniziato a vedere
      endDate:     latestProgress?.completedAt || null,     // quando ha finito di vedere
      hours:       course.courseHours ?? null,
      issueDate:   resolvedCert.issuedAt || new Date(),     // data di emissione (sotto la firma)
      certCode:    resolvedCert.certCode,
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
    // Messaggi diagnostici chiari per le cause più comuni in produzione
    if (err.code === 'MODULE_NOT_FOUND') {
      return res.status(500).json({ error: 'Libreria PDF mancante (pdf-lib). Esegui: npm install pdf-lib @pdf-lib/fontkit' });
    }
    if (err.code === 'ENOENT') {
      return res.status(500).json({ error: 'Asset attestato non trovato sul server (template/font). Verifica il deploy di lib/cert-assets.' });
    }
    // Colonna DB mancante (prisma db push non eseguito)
    if (/column .* does not exist|Unknown arg|sofiaCode|courseHours|courseStart|courseEnd/i.test(err.message || '')) {
      return res.status(500).json({ error: 'Schema DB non aggiornato (manca prisma db push per i campi attestato).' });
    }
    return res.status(500).json({ error: 'Errore nella generazione del PDF: ' + (err.message || 'sconosciuto') });
  }
});
