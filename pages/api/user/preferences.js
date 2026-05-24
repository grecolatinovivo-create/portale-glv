// pages/api/user/preferences.js — Salva/legge le preferenze onboarding
//
// GET  → { onboardingDone, prefLang, prefLevel, prefGoal }
// POST { lang, level, goal, done } → salva nel DB e ritorna l'utente aggiornato
//
// Sostituisce il vecchio approccio localStorage (non sincronizzato tra dispositivi).

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

module.exports = withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  // ── GET: legge le preferenze correnti ───────────────────────────
  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { onboardingDone: true, prefLang: true, prefLevel: true, prefGoal: true },
      });
      if (!user) return res.status(404).json({ error: 'Utente non trovato' });
      return res.status(200).json(user);
    } catch (err) {
      console.error('[preferences GET]', err);
      return res.status(500).json({ error: 'Errore server' });
    }
  }

  // ── POST: salva le preferenze ────────────────────────────────────
  if (req.method === 'POST') {
    const { lang, level, goal, done } = req.body || {};
    try {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          onboardingDone: done !== false,          // true di default
          prefLang:  lang  ?? null,
          prefLevel: level ?? null,
          prefGoal:  goal  ?? null,
        },
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[preferences POST]', err);
      return res.status(500).json({ error: 'Errore server' });
    }
  }

  return res.status(405).json({ error: 'Metodo non consentito' });
});
