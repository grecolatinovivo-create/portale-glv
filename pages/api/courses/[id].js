// pages/api/courses/[id].js
// [id] è lo slug del corso, es. "lat-a11"

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

// Admin bypass
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

// ── Gerarchia tier ────────────────────────────────────────────
// cultura (1) < linguae (2) < accademia (3)
const TIER_RANK = { cultura: 1, linguae: 2, accademia: 3 };

// Estrae il nome del tier da un planId (es. 'cultura-mensile' → 'cultura')
// Gestisce anche il caso in cui il plan sia un Stripe priceId (price_xxx)
function planToTier(plan) {
  if (!plan || typeof plan !== 'string') return null;
  if (plan.startsWith('cultura'))   return 'cultura';
  if (plan.startsWith('linguae'))   return 'linguae';
  if (plan.startsWith('accademia')) return 'accademia';
  return null; // plan non riconosciuto (es. price_xxx da checkout legacy)
}

// Restituisce true se il tier dell'abbonato è >= il tier richiesto dal corso
function hasTierAccess(userPlan, courseRequiredTier) {
  if (!courseRequiredTier) return true; // nessun requisito
  const userTier = planToTier(userPlan);
  if (!userTier) return false; // piano non riconosciuto → nessun accesso tier
  return (TIER_RANK[userTier] || 0) >= (TIER_RANK[courseRequiredTier] || 0);
}

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { id } = req.query; // slug

  try {
    const course = await prisma.course.findUnique({
      where: { slug: id },
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Corso non trovato' });
    }

    // FIX: 'now' dichiarato qui — era dopo il primo utilizzo (riga ~84),
    // causando ReferenceError in Temporal Dead Zone → 500 → course=null nel client.
    const now = new Date();

    let hasAccess = false;
    let accessSource = null; // 'subscription' | 'purchase' | 'admin' | null

    if (req.user) {
      // 0. Admin bypass — l'admin vede sempre tutto
      if (req.user.email === ADMIN_EMAIL) {
        hasAccess = true;
        accessSource = 'admin';
      }

      // 1. Controlla acquisto singolo corso — PRIORITÀ MASSIMA, mai bloccato da expiresAt
      if (!hasAccess) {
        const purchase = await prisma.purchase.findFirst({
          where: { userId: req.user.userId, courseId: course.id },
        });
        if (purchase) {
          hasAccess = true;
          accessSource = 'purchase';
        }
      }

      // 2. Controlla abbonamento attivo per corsi linguae / accademia
      if (!hasAccess) {
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId: req.user.userId,
            status: 'active',
          },
        });

        if (subscription) {
          // Abbonamento valido: verifica tier + scadenza
          if (course.expiresAt && new Date(course.expiresAt) <= now) {
            // Corso scaduto per abbonati
            accessSource = 'subscription-expired';
          } else if (!hasTierAccess(subscription.plan, course.tierRequired)) {
            // Tier insufficiente — hasAccess rimane false
            accessSource = 'subscription-tier';
          } else {
            hasAccess = true;
            accessSource = 'subscription';
          }
        }
      }
    }

    // Urgency per abbonati
    let isExpiringSoon = false;
    if (course.expiresAt && accessSource === 'subscription') {
      const daysLeft = Math.ceil((new Date(course.expiresAt) - now) / (1000 * 60 * 60 * 24));
      isExpiringSoon = daysLeft >= 0 && daysLeft <= 14;
    }

    // Filtra vimeoUrl per lezioni a pagamento se l'utente non ha accesso
    const lessons = course.lessons.map((lesson) => {
      if (lesson.isFree || hasAccess) {
        return lesson;
      }
      return { ...lesson, vimeoUrl: null };
    });

    return res.status(200).json({
      course: {
        ...course,
        lessons,
        hasAccess,
        accessSource,       // 'purchase' | 'subscription' | 'subscription-expired' | 'subscription-tier' | null
        tierRequired: course.tierRequired || null,
        isExpiringSoon,
        availableUntilLabel: course.availableUntilLabel || null,
      },
    });
  } catch (err) {
    console.error('[courses/[id]]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
