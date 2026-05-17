// pages/api/auth/logout.js — Disconnessione utente

const { clearAuthCookie } = require('../../../lib/auth');

export default async function handler(req, res) {
  // Accetta solo richieste POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  // Cancella il cookie di autenticazione
  clearAuthCookie(res);
  return res.status(200).json({ ok: true });
};
