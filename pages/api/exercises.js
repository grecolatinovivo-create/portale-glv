/**
 * GET /api/exercises?lessonId=<id>
 * Restituisce i test esercizi collegati a una lezione specifica.
 * Include sezioni e domande con i dati per il rendering.
 *
 * Risposta: { tests: [{ id, title, sections: [{ id, name, questions: [...] }] }] }
 *
 * Accesso: solo Linguae, Accademia e admin.
 * I test autocorrettivi non sono inclusi nel piano Cultura.
 */

const { prisma } = require('../../lib/prisma');
const { withAuth } = require('../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

// Estrae il tier dal planId (es. 'cultura-mensile' → 'cultura')
function planToTier(plan) {
  if (!plan || typeof plan !== 'string') return null;
  if (plan.startsWith('cultura'))   return 'cultura';
  if (plan.startsWith('linguae'))   return 'linguae';
  if (plan.startsWith('accademia')) return 'accademia';
  return null;
}

const TIER_RANK = { cultura: 1, linguae: 2, accademia: 3 };

module.exports = withAuth(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  // ── Gate: solo Linguae+, Accademia o admin ──────────────────────────────
  const isAdmin = req.user.email === ADMIN_EMAIL;
  if (!isAdmin) {
    const sub = req.user.subscription;
    const userTier = planToTier(sub?.plan);
    const tierRank = TIER_RANK[userTier] || 0;
    if (sub?.status !== 'active' || tierRank < TIER_RANK['linguae']) {
      return res.status(403).json({
        error: 'I test autocorrettivi sono disponibili dal piano Linguae.',
        upgradeRequired: true,
      });
    }
  }

  const { lessonId } = req.query;
  if (!lessonId) return res.status(400).json({ error: 'lessonId obbligatorio' });

  try {
    const tests = await prisma.exerciseTest.findMany({
      where: { lessonId },
      orderBy: { ordine: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        lingua: true,
        livello: true,
        sections: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            timeMinutes: true,
            sortOrder: true,
            questions: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                questionType: true,
                sortOrder: true,
                title: true,
                instruction: true,
                contextText: true,
                audio: true,
                image: true,
                data: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({ tests });
  } catch (err) {
    console.error('[exercises] DB error:', err);
    return res.status(500).json({ error: 'Errore server' });
  }
});
