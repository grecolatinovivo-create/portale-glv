// pages/api/admin/users.js
// GET  — lista utenti con abbonamento e acquisti
// POST — sospendi / riattiva un utente (action: "suspend" | "restore")
// Accessibile solo all'admin (email = ADMIN_EMAIL)
//
// NOTA: "sospendere" un utente NON cancella i dati. Imposta un flag isSuspended
// che il middleware withAuth controlla. Gli acquisti singoli rimangono validi
// a livello di DB; solo il login viene bloccato (403) mentre l'account è sospeso.

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

export default withAuth(async function handler(req, res) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  // ── GET — lista utenti ───────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { search, page = 1, limit = 30 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            fullName: true,
            createdAt: true,
            subscriptions: {
              where: { status: 'active' },
              select: { id: true, plan: true, status: true, currentPeriodEnd: true },
              take: 1,
            },
            purchases: {
              select: { id: true, courseId: true, createdAt: true },
            },
            certificates: {
              select: { id: true, certCode: true, issuedAt: true, revokedAt: true },
            },
          },
        }),
      ]);

      // Prova a leggere isSuspended separatamente (campo nuovo — potrebbe non esistere nel DB)
      let suspendedIds = new Set();
      try {
        const suspended = await prisma.user.findMany({
          where: { isSuspended: true },
          select: { id: true },
        });
        suspendedIds = new Set(suspended.map(u => u.id));
      } catch { /* campo non ancora nel DB — tutti considerati attivi */ }

      const usersWithStatus = users.map(u => ({
        ...u,
        isSuspended: suspendedIds.has(u.id),
      }));

      return res.status(200).json({
        users: usersWithStatus,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (err) {
      console.error('[admin/users GET]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  // ── POST — sospendi / riattiva / assegna piano / revoca piano ───
  if (req.method === 'POST') {
    const { userId, action } = req.body || {};

    if (!userId || !['suspend', 'restore', 'grant-cultura', 'revoke-plan'].includes(action)) {
      return res.status(400).json({ error: 'userId e action (suspend|restore|grant-cultura|revoke-plan) sono obbligatori' });
    }

    if (action === 'suspend' && userId === req.user.userId) {
      return res.status(400).json({ error: 'Non puoi sospendere il tuo stesso account' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'Utente non trovato' });

      // ── Sospendi / Riattiva ─────────────────────────────────────
      if (action === 'suspend' || action === 'restore') {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { isSuspended: action === 'suspend' },
          select: { id: true, email: true, fullName: true, isSuspended: true },
        });

        await prisma.adminLog.create({
          data: {
            adminEmail: req.user.email,
            action:     action === 'suspend' ? 'SUSPEND_USER' : 'RESTORE_USER',
            targetType: 'user',
            targetId:   userId,
            payload:    JSON.stringify({ email: user.email, fullName: user.fullName }),
          },
        });

        return res.status(200).json({ ok: true, user: updated });
      }

      // ── Assegna piano Cultura manuale (senza Stripe) ────────────
      if (action === 'grant-cultura') {
        const syntheticSubId = `admin_cultura_${userId}`;
        const farFuture = new Date('2099-12-31T23:59:59Z');

        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: syntheticSubId },
          create: {
            userId,
            plan:                 'cultura-manuale',
            stripeSubscriptionId: syntheticSubId,
            stripeCustomerId:     `admin_${userId}`,
            status:               'active',
            currentPeriodEnd:     farFuture,
          },
          update: {
            status:           'active',
            currentPeriodEnd: farFuture,
          },
        });

        await prisma.adminLog.create({
          data: {
            adminEmail: req.user.email,
            action:     'GRANT_CULTURA',
            targetType: 'user',
            targetId:   userId,
            payload:    JSON.stringify({ plan: 'cultura-manuale', note: "assegnato manualmente dall'admin" }),
          },
        });

        return res.status(200).json({ ok: true });
      }

      // ── Revoca piano manuale ─────────────────────────────────────
      if (action === 'revoke-plan') {
        const syntheticSubId = `admin_cultura_${userId}`;

        await prisma.subscription.updateMany({
          where: {
            userId,
            OR: [
              { stripeSubscriptionId: syntheticSubId },
              { plan: 'cultura-manuale' },
            ],
          },
          data: { status: 'canceled' },
        });

        await prisma.adminLog.create({
          data: {
            adminEmail: req.user.email,
            action:     'REVOKE_PLAN',
            targetType: 'user',
            targetId:   userId,
            payload:    JSON.stringify({ note: "piano manuale revocato dall'admin" }),
          },
        });

        return res.status(200).json({ ok: true });
      }

    } catch (err) {
      console.error('[admin/users POST]', err);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
