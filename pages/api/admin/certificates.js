// pages/api/admin/certificates.js — Gestione attestati per l'admin
// Richiede autenticazione come admin (email == ADMIN_EMAIL env var)
//
// GET  → lista tutti gli attestati emessi
// POST → { action: 'revoke', certCode } | { action: 'regenerate', certCode }

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  // Controlla che l'utente sia l'admin
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { email: true },
  });
  if (!user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso negato' });
  }

  // ── GET: lista tutti gli attestati ───────────────────────────
  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '50', search = '' } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = search
        ? {
            OR: [
              { certCode: { contains: search, mode: 'insensitive' } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { user: { fullName: { contains: search, mode: 'insensitive' } } },
              { course: { title: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {};

      const [total, certificates] = await Promise.all([
        prisma.certificate.count({ where }),
        prisma.certificate.findMany({
          where,
          include: {
            user:   { select: { id: true, email: true, fullName: true } },
            course: { select: { id: true, slug: true, title: true, lang: true } },
          },
          orderBy: { issuedAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
      ]);

      return res.status(200).json({
        total,
        page: parseInt(page),
        certificates: certificates.map(c => ({
          id: c.id,
          certCode: c.certCode,
          issuedAt: c.issuedAt,
          revoked: !!c.revokedAt,
          revokedAt: c.revokedAt,
          revokedBy: c.revokedBy,
          student: c.user,
          course: c.course,
        })),
      });
    } catch (err) {
      console.error('[admin/certificates GET] Errore:', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  // ── POST: azioni admin ────────────────────────────────────────
  if (req.method === 'POST') {
    // Accetta sia certId (ID primario) che certCode (per compatibilità)
    const { action, certId, certCode } = req.body || {};

    if (!action || (!certId && !certCode)) {
      return res.status(400).json({ error: 'action e certId (o certCode) sono obbligatori' });
    }

    try {
      const cert = certId
        ? await prisma.certificate.findUnique({ where: { id: certId } })
        : await prisma.certificate.findUnique({ where: { certCode } });

      if (!cert) return res.status(404).json({ error: 'Attestato non trovato' });

      // ── REVOCA ────────────────────────────────────────────────
      if (action === 'revoke') {
        if (cert.revokedAt) {
          return res.status(400).json({ error: 'Attestato già revocato' });
        }
        await prisma.certificate.update({
          where: { id: cert.id },
          data: { revokedAt: new Date(), revokedBy: ADMIN_EMAIL },
        });
        await prisma.adminLog.create({
          data: {
            adminEmail: ADMIN_EMAIL,
            action: 'REVOKE_CERT',
            targetType: 'certificate',
            targetId: cert.id,
            payload: JSON.stringify({ certCode: cert.certCode }),
          },
        });
        return res.status(200).json({ ok: true, message: 'Attestato revocato' });
      }

      // ── RIPRISTINO (annulla revoca) ────────────────────────────
      if (action === 'restore') {
        await prisma.certificate.update({
          where: { id: cert.id },
          data: { revokedAt: null, revokedBy: null },
        });
        await prisma.adminLog.create({
          data: {
            adminEmail: ADMIN_EMAIL,
            action: 'RESTORE_CERT',
            targetType: 'certificate',
            targetId: cert.id,
            payload: JSON.stringify({ certCode: cert.certCode }),
          },
        });
        return res.status(200).json({ ok: true, message: 'Attestato ripristinato' });
      }

      // ── RIGENERA CODICE ────────────────────────────────────────
      if (action === 'regenerate') {
        const { generateCertCode } = require('../../../lib/certificate');
        const oldCode = cert.certCode;
        const newCode = generateCertCode();

        await prisma.certificate.update({
          where: { id: cert.id },
          data: { certCode: newCode, revokedAt: null, revokedBy: null },
        });

        await prisma.adminLog.create({
          data: {
            adminEmail: ADMIN_EMAIL,
            action: 'REGENERATE_CERT',
            targetType: 'certificate',
            targetId: cert.id,
            payload: JSON.stringify({ oldCode, newCode }),
          },
        });

        // Tenta di inviare email con il nuovo codice (non bloccante)
        try {
          const [certUser, certCourse] = await Promise.all([
            prisma.user.findUnique({ where: { id: cert.userId }, select: { fullName: true, email: true } }),
            prisma.course.findUnique({ where: { id: cert.courseId }, select: { title: true, slug: true } }),
          ]);
          if (certUser && certCourse) {
            const { sendCertificateEmail } = require('../../../lib/resend');
            await sendCertificateEmail(certUser, certCourse, newCode);
          }
        } catch (emailErr) {
          console.error('[admin/certificates] Errore invio email rigenera:', emailErr);
        }

        return res.status(200).json({ ok: true, newCertCode: newCode });
      }

      return res.status(400).json({ error: `Azione non riconosciuta: ${action}` });
    } catch (err) {
      console.error('[admin/certificates POST] Errore:', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
