// pages/api/auth/logout.js

const { clearAuthCookie } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  clearAuthCookie(res);
  return res.status(200).json({ ok: true });
};
