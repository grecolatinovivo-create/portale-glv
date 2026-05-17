// pages/api/verify/[certCode].js — Verifica pubblica autenticità di un attestato
// Nessuna autenticazione richiesta — endpoint pubblico
// GET /api/verify/GLV-2025-A3B7F2C1

const { prisma } = require('../../../lib/prisma');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { certCode } = req.query;

  if (!certCode) {
    return res.status(400).json({ valid: false, error: 'Codice mancante' });
  }

  try {
    const cert = await prisma.certificate.findUnique({
      where: { certCode: certCode.toUpperCase() },
      include: {
        user:   { select: { fullName: true } },
        course: { select: { title: true, lang: true, level: true } },
      },
    });

    if (!cert) {
      return res.status(404).json({
        valid: false,
        error: 'Attestato non trovato. Il codice potrebbe essere errato.',
      });
    }

    if (cert.revokedAt) {
      return res.status(200).json({
        valid: false,
        revoked: true,
        revokedAt: cert.revokedAt,
        message: 'Questo attestato è stato revocato.',
      });
    }

    return res.status(200).json({
      valid: true,
      certCode: cert.certCode,
      studentName: cert.user?.fullName || 'Studente',
      courseTitle: cert.course?.title,
      courseLang:  cert.course?.lang,
      courseLevel: cert.course?.level,
      issuedAt:    cert.issuedAt,
    });
  } catch (err) {
    console.error('[verify] Errore:', err);
    return res.status(500).json({ valid: false, error: 'Errore interno del server' });
  }
};
