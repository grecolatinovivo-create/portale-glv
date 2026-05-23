// pages/api/vocabulary/[id].js
// DELETE → elimina una parola dal vocabolario personale

const { prisma } = require('../../../lib/prisma');
const { withAuth } = require('../../../lib/auth');

export default withAuth(async function handler(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { id } = req.query;

  try {
    // Verifica che la parola appartenga all'utente
    const word = await prisma.vocabulary.findFirst({
      where: { id, userId: req.user.userId },
    });
    if (!word) return res.status(404).json({ error: 'Parola non trovata' });

    await prisma.vocabulary.delete({ where: { id } });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[vocabulary/[id] DELETE]', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});
