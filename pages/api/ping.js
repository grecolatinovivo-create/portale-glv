// pages/api/ping.js — endpoint di test atomico
export default function handler(req, res) {
  res.status(200).json({ ok: true, ts: Date.now() });
};
