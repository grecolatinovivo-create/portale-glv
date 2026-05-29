// pages/api/auth/me.js — Dati utente autenticato

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

export default withAuth(async function handler(req, res) {
  // Accetta solo richieste GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  // Se l'utente non è autenticato, restituisce 401
  if (!req.user) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  try {
    // Piani manuali (gratuiti) assegnati dall'admin — hanno precedenza su Stripe
    const MANUAL_PLANS = [
      'cultura-manuale',
      'cultura-free',
      'linguae-manuale',
      'linguae-free',
      'accademia-manuale',
      'accademia-free',
    ];

    // Recupera TUTTE le subscription attive — scegliamo il piano effettivo in JS
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Utente non trovato nel DB (token valido ma utente eliminato)
    if (!user) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    // Il piano manuale vince sempre sul piano Stripe (stesso utente con doppia sub)
    const activeSub = user.subscriptions.find(s => MANUAL_PLANS.includes(s.plan))
      || user.subscriptions[0]
      || null;
    const subscription = activeSub
      ? {
          plan:              activeSub.plan,
          status:            activeSub.status,
          currentPeriodEnd:  activeSub.currentPeriodEnd,
          cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd,
        }
      : null;

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

    return res.status(200).json({
      user: {
        id:             user.id,
        email:          user.email,
        fullName:       user.fullName,
        subscription,
        isAdmin:        user.email === ADMIN_EMAIL,
        // Preferenze onboarding — lette dal DB così sono sincronizzate su tutti i dispositivi
        onboardingDone: user.onboardingDone ?? false,
        prefLang:       user.prefLang  ?? null,
        prefLevel:      user.prefLevel ?? null,
        prefGoal:       user.prefGoal  ?? null,
      },
    });
  } catch (err) {
    console.error('[me] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
