// pages/api/classroom/index.js — Gestione classi (lato DOCENTE)
// GET            → lista delle classi del docente (con conteggi studenti/test)
// POST {name}    → crea una classe (genera codice univoco a 6 caratteri)
// DELETE {id}    → elimina una classe
//
// Accesso: docente = abbonato Accademia ANNUALE (o admin).

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');
const { checkFeatureAccess } = require('../../../lib/courseAccess');
const crypto = require('crypto');

// Codice classe: 6 caratteri leggibili (no 0/O/1/I per evitare ambiguità)
function genCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) s += alphabet[bytes[i] % alphabet.length];
  return s;
}

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });

  // Gate docente: Accademia annuale (o admin)
  const access = await checkFeatureAccess(req.user, { minTier: 'accademia', requireAnnual: true });
  if (!access.ok) {
    return res.status(403).json({
      error: 'La gestione classi è riservata al piano annuale Accademia.',
      reason: access.reason,
    });
  }

  // GET — lista classi del docente
  if (req.method === 'GET') {
    try {
      const classrooms = await prisma.classroom.findMany({
        where: { teacherId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { students: true, assignments: true } },
        },
      });
      return res.status(200).json({ classrooms });
    } catch (err) {
      console.error('[classroom GET]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  // POST — crea classe
  if (req.method === 'POST') {
    const { name } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Il nome della classe è obbligatorio' });
    try {
      // genera un codice univoco (riprova in caso di collisione)
      let code, exists = true, attempts = 0;
      while (exists && attempts < 10) {
        code = genCode();
        // eslint-disable-next-line no-await-in-loop
        exists = await prisma.classroom.findUnique({ where: { code } });
        attempts++;
      }
      const classroom = await prisma.classroom.create({
        data: { teacherId: req.user.userId, name: name.trim(), code },
      });
      return res.status(201).json({ ok: true, classroom });
    } catch (err) {
      console.error('[classroom POST]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  // DELETE — elimina classe (solo se proprietario)
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id obbligatorio' });
    try {
      const cls = await prisma.classroom.findUnique({ where: { id } });
      if (!cls || cls.teacherId !== req.user.userId) {
        return res.status(404).json({ error: 'Classe non trovata' });
      }
      await prisma.classroom.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[classroom DELETE]', err);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: 'Metodo non consentito' });
});
