// pages/api/admin/fix-tiers.js
// POST — assegna automaticamente tierRequired a tutti i corsi in base alla lingua
// Regola: Corsi Brevi → cultura | Latino/Greco/Egiziano/Ebraico → linguae | Didattica → accademia

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

const LANG_TO_TIER = {
  'Corsi Brevi':             'cultura',
  'Latino':                  'linguae',
  'Greco Antico':            'linguae',
  'Egiziano Geroglifico':    'linguae',
  'Ebraico Biblico':         'linguae',
  'Didattica':               'accademia',
};

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  try {
    const courses = await prisma.course.findMany({
      select: { id: true, lang: true, title: true, tierRequired: true },
    });

    const updates = [];
    for (const course of courses) {
      const newTier = LANG_TO_TIER[course.lang];
      if (!newTier) continue; // lingua non mappata — lascia invariato
      if (course.tierRequired === newTier) continue; // già corretto

      await prisma.course.update({
        where: { id: course.id },
        data:  { tierRequired: newTier },
      });
      updates.push({ title: course.title, lang: course.lang, from: course.tierRequired, to: newTier });
    }

    await prisma.adminLog.create({
      data: {
        adminEmail: req.user.email,
        action:     'FIX_TIERS_BULK',
        targetType: 'course',
        targetId:   'all',
        payload:    JSON.stringify({ updated: updates.length, changes: updates }),
      },
    });

    return res.status(200).json({ ok: true, updated: updates.length, changes: updates });
  } catch (err) {
    console.error('[admin/fix-tiers]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
