// pages/api/exercises/library.js — Libreria dei test autocorrettivi (per i docenti)
// GET → elenco dei test assegnabili a una classe.
// Accesso: docente Accademia annuale (o admin).

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');
const { checkFeatureAccess } = require('../../../lib/courseAccess');

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const access = await checkFeatureAccess(req.user, { minTier: 'accademia', requireAnnual: true });
  if (!access.ok) return res.status(403).json({ error: 'Riservato al piano annuale Accademia.' });

  try {
    // L'admin vede tutti i test (per curare/provare); il docente solo quelli
    // resi assegnabili dall'admin (assignableByTeachers = true).
    const { ADMIN_EMAIL } = require('../../../lib/courseAccess');
    const isAdmin = req.user.email === ADMIN_EMAIL;
    const tests = await prisma.exerciseTest.findMany({
      where: isAdmin ? {} : { assignableByTeachers: true },
      orderBy: [{ lingua: 'asc' }, { ordine: 'asc' }, { title: 'asc' }],
      select: { id: true, title: true, lingua: true, livello: true, assignableByTeachers: true },
    });
    return res.status(200).json({ tests });
  } catch (err) {
    console.error('[exercises/library]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
