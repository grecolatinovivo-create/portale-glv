// pages/api/progress/update.js — Aggiorna il progresso di una lezione
// POST { lessonId, watchedSeconds, totalSeconds, resumeAt }
// courseId viene ricavato server-side dalla lezione (non fidarsi del client)
// Quando il corso raggiunge il 100%, emette automaticamente l'attestato.

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

module.exports = withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  const { lessonId, watchedSeconds, totalSeconds, resumeAt } = req.body || {};

  if (!lessonId) {
    return res.status(400).json({ error: 'lessonId è obbligatorio' });
  }

  const ws = Math.max(0, parseInt(watchedSeconds) || 0);
  const ts = Math.max(0, parseInt(totalSeconds) || 0);
  const ra = Math.max(0, parseInt(resumeAt) || 0);

  // Lezione completata se >= 90% guardato (e video > 30s)
  const isCompleted = ts > 30 && ws >= ts * 0.9;

  try {
    // Recupera la lezione — courseId autoritativo viene dal DB, non dal client
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true },
    });
    if (!lesson) return res.status(404).json({ error: 'Lezione non trovata' });

    const courseId = lesson.courseId;

    // Legge lo stato precedente del progresso
    const existing = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: req.user.userId, lessonId } },
    });

    const wasAlreadyCompleted = existing?.completed ?? false;
    const nowCompleted = wasAlreadyCompleted || isCompleted;

    const progressData = {
      watchedSeconds: ws,
      totalSeconds: ts,
      resumeAt: ra,
      completed: nowCompleted,
      completedAt: nowCompleted && !wasAlreadyCompleted
        ? new Date()
        : (existing?.completedAt ?? null),
    };

    // Upsert progresso lezione
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: req.user.userId, lessonId } },
      update: progressData,
      create: { userId: req.user.userId, lessonId, courseId, ...progressData },
    });

    // Calcola completamento totale del corso
    const [totalLessons, completedLessons] = await Promise.all([
      prisma.lesson.count({ where: { courseId } }),
      prisma.lessonProgress.count({
        where: { userId: req.user.userId, courseId, completed: true },
      }),
    ]);

    const coursePercent = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
    const courseCompleted = coursePercent === 100;

    // ── EMISSIONE AUTOMATICA ATTESTATO ──────────────────────────
    let certificateIssued = false;
    let certCode = null;

    if (courseCompleted) {
      // Controlla se l'attestato esiste già (evita duplicati)
      const existingCert = await prisma.certificate.findUnique({
        where: { userId_courseId: { userId: req.user.userId, courseId } },
      });

      if (!existingCert) {
        const { generateCertCode } = require('../../../lib/certificate');
        certCode = generateCertCode();

        await prisma.certificate.create({
          data: { certCode, userId: req.user.userId, courseId },
        });

        certificateIssued = true;

        // Invia email di notifica (non blocca la risposta)
        try {
          const [user, course] = await Promise.all([
            prisma.user.findUnique({
              where: { id: req.user.userId },
              select: { fullName: true, email: true },
            }),
            prisma.course.findUnique({
              where: { id: courseId },
              select: { title: true, slug: true },
            }),
          ]);
          const { sendCertificateEmail } = require('../../../lib/resend');
          await sendCertificateEmail(user, course, certCode);
        } catch (emailErr) {
          console.error('[progress/update] Errore invio email attestato:', emailErr);
        }
      } else {
        certCode = existingCert.certCode;
      }
    }

    return res.status(200).json({
      ok: true,
      lessonCompleted: nowCompleted,
      coursePercent,
      courseCompleted,
      certificateIssued,
      certCode,
    });
  } catch (err) {
    console.error('[progress/update] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
