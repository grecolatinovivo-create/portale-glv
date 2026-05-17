// pages/api/admin/certificates.js — Gestione attestati per l'admin
// Richiede autenticazione come admin (email == ADMIN_EMAIL env var)
//
// GET  → lista tutti gli attestati emessi
// POST → { action: 'revoke', certCode } | { action: 'regenerate', certCode }

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

module.exports = withAuth(async function handler(req, res) {
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
    const { action, certCode } = req.body || {};

    if (!action || !certCode) {
      return res.status(400).json({ error: 'action e certCode sono obbligatori' });
    }

    try {
      const cert = await prisma.certificate.findUnique({ where: { certCode } });
      if (!cert) return res.status(404).json({ error: 'Attestato non trovato' });

      // ── REVOCA ────────────────────────────────────────────────
      if (action === 'revoke') {
        if (cert.revokedAt) {
          return res.status(400).json({ error: 'Attestato già revocato' });
        }
        await prisma.certificate.update({
          where: { certCode },
          data: { revokedAt: new Date(), revokedBy: ADMIN_EMAIL },
        });
        return res.status(200).json({ ok: true, message: 'Attestato revocato' });
      }

      // ── RIPRISTINO (annulla revoca) ────────────────────────────
      if (action === 'restore') {
        await prisma.certificate.update({
          where: { certCode },
          data: { revokedAt: null, revokedBy: null },
        });
        return res.status(200).json({ ok: true, message: 'Attestato ripristinato' });
      }

      // ── RIGENERA CODICE ────────────────────────────────────────
      if (action === 'regenerate') {
        const { generateCertCode } = require('../../../lib/certificate');
        const newCode = generateCertCode();
        await prisma.certificate.update({
          where: { certCode },
          data: { certCode: newCode, revokedAt: null, revokedBy: null },
        });
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
