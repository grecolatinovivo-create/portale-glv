// pages/api/cron/live-reminders.js
// Cron orario (Vercel) — invia i reminder delle live ai prenotati:
//   - 24h prima (campo remind24Sent)
//   - 2h prima  (campo remind2Sent)
// Idempotente: marca i flag per non reinviare. Protetto da CRON_SECRET.

const { prisma } = require('../../../lib/prisma');
const { sendLiveReminderEmail } = require('../../../lib/resend');

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  // Sicurezza: Vercel Cron invia l'header Authorization: Bearer <CRON_SECRET>.
  // In assenza di CRON_SECRET configurato, accettiamo solo richieste con header cron di Vercel.
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';
  if (secret) {
    if (authHeader !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Non autorizzato' });
    }
  } else if (!req.headers['x-vercel-cron']) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  const now = new Date();
  let sent24 = 0, sent2 = 0;

  try {
    // Finestra 24h: live che iniziano tra ~23h e ~25h e non ancora notificate
    const win24Start = new Date(now.getTime() + 23 * 3600 * 1000);
    const win24End   = new Date(now.getTime() + 25 * 3600 * 1000);
    const lives24 = await prisma.liveSession.findMany({
      where: { isPublished: true, remind24Sent: false, startAt: { gte: win24Start, lte: win24End } },
      include: { bookings: { include: { user: { select: { fullName: true, email: true } } } } },
    });
    for (const live of lives24) {
      for (const b of live.bookings) {
        try { await sendLiveReminderEmail(b.user, live, '24 ore'); sent24++; } catch (e) { console.error('reminder24', e.message); }
      }
      await prisma.liveSession.update({ where: { id: live.id }, data: { remind24Sent: true } });
    }

    // Finestra 2h: live che iniziano tra ~1h e ~3h e non ancora notificate
    const win2Start = new Date(now.getTime() + 1 * 3600 * 1000);
    const win2End   = new Date(now.getTime() + 3 * 3600 * 1000);
    const lives2 = await prisma.liveSession.findMany({
      where: { isPublished: true, remind2Sent: false, startAt: { gte: win2Start, lte: win2End } },
      include: { bookings: { include: { user: { select: { fullName: true, email: true } } } } },
    });
    for (const live of lives2) {
      for (const b of live.bookings) {
        try { await sendLiveReminderEmail(b.user, live, '2 ore'); sent2++; } catch (e) { console.error('reminder2', e.message); }
      }
      await prisma.liveSession.update({ where: { id: live.id }, data: { remind2Sent: true } });
    }

    return res.status(200).json({ ok: true, sent24, sent2 });
  } catch (err) {
    console.error('[cron/live-reminders]', err);
    return res.status(500).json({ error: 'Errore cron' });
  }
}
