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
    // Recupera utente con subscription attiva inclusa
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Utente non trovato nel DB (token valido ma utente eliminato)
    if (!user) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    // Estrae la subscription attiva (se presente)
    const activeSub = user.subscriptions.length > 0 ? user.subscriptions[0] : null;
    const subscription = activeSub
      ? {
          plan: activeSub.plan,
          status: activeSub.status,
          currentPeriodEnd: activeSub.currentPeriodEnd,
        }
      : null;

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        subscription,
      },
    });
  } catch (err) {
    console.error('[me] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
