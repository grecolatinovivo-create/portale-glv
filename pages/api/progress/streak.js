// pages/api/progress/streak.js — Daily streak dell'utente
// GET /api/progress/streak
// Risposta: { streak: N, lastActivityDate: ISO|null }
// Logica: conta i giorni consecutivi con almeno 1 LessonProgress.updatedAt
//         partendo da oggi; se oggi non ha attività, parte da ieri
//         (lo streak non si azzera il giorno corrente).

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  try {
    // Recupera tutti i LessonProgress dell'utente con il campo updatedAt
    const records = await prisma.lessonProgress.findMany({
      where: { userId: req.user.userId },
      select: { updatedAt: true },
    });

    if (!records.length) {
      return res.status(200).json({ streak: 0, lastActivityDate: null });
    }

    // Raggruppa per giorno (UTC, formato YYYY-MM-DD)
    const daySet = new Set(
      records.map(r => r.updatedAt.toISOString().slice(0, 10))
    );

    // Data di oggi in UTC
    const todayUTC = new Date().toISOString().slice(0, 10);

    // Calcola il giorno di partenza per il conteggio streak:
    // se oggi ha attività → parti da oggi; altrimenti parti da ieri.
    let startDay;
    if (daySet.has(todayUTC)) {
      startDay = todayUTC;
    } else {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayUTC = yesterday.toISOString().slice(0, 10);
      if (!daySet.has(yesterdayUTC)) {
        // Nessuna attività né oggi né ieri → streak = 0
        // Trova l'ultima data di attività per lastActivityDate
        const sorted = [...daySet].sort().reverse();
        return res.status(200).json({
          streak: 0,
          lastActivityDate: sorted[0] ? sorted[0] + 'T00:00:00.000Z' : null,
        });
      }
      startDay = yesterdayUTC;
    }

    // Conta i giorni consecutivi a ritroso da startDay
    let streak = 0;
    let current = new Date(startDay + 'T00:00:00.000Z');

    while (true) {
      const dayStr = current.toISOString().slice(0, 10);
      if (!daySet.has(dayStr)) break;
      streak++;
      current.setUTCDate(current.getUTCDate() - 1);
    }

    // lastActivityDate = il giorno più recente con attività
    const sortedDays = [...daySet].sort().reverse();
    const lastActivityDate = sortedDays[0] ? sortedDays[0] + 'T00:00:00.000Z' : null;

    return res.status(200).json({ streak, lastActivityDate });
  } catch (err) {
    console.error('[progress/streak] Errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
