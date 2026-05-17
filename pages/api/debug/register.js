// pages/api/debug/register.js
// Endpoint diagnostico — verifica tutto ciò che serve alla registrazione
// Apri: https://portale.grecolatinovivo.it/api/debug/register

const { prisma } = require('../../../lib/prisma');
const { signToken } = require('../../../lib/auth');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  const checks = {};

  // 1. Prisma: connessione al DB
  try {
    const count = await prisma.user.count();
    checks.database = { ok: true, userCount: count };
  } catch (e) {
    checks.database = { ok: false, error: e.message };
  }

  // 2. Colonne necessarie su User
  try {
    await prisma.$queryRaw`SELECT "isSuspended" FROM "User" LIMIT 1`;
    checks.column_isSuspended = { ok: true };
  } catch (e) {
    checks.column_isSuspended = { ok: false, error: e.message };
  }

  // 3. JWT sign
  try {
    const token = signToken({ userId: 'test', email: 'test@test.it' });
    checks.jwt = { ok: !!token };
  } catch (e) {
    checks.jwt = { ok: false, error: e.message };
  }

  // 4. bcrypt
  try {
    const hash = await bcrypt.hash('testpassword', 10);
    checks.bcrypt = { ok: !!hash };
  } catch (e) {
    checks.bcrypt = { ok: false, error: e.message };
  }

  // 5. Resend (solo inizializzazione, non invia email)
  try {
    const { Resend } = require('resend');
    const r = new Resend(process.env.RESEND_API_KEY || 'placeholder');
    checks.resend = { ok: true, keySet: !!process.env.RESEND_API_KEY };
  } catch (e) {
    checks.resend = { ok: false, error: e.message };
  }

  // 6. Variabili d'ambiente critiche
  checks.env = {
    DATABASE_URL:  !!process.env.DATABASE_URL,
    JWT_SECRET:    !!process.env.JWT_SECRET,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    NODE_ENV:      process.env.NODE_ENV,
  };

  const allOk = Object.values(checks).every(c => c.ok !== false);

  return res.status(allOk ? 200 : 500).json({
    status: allOk ? 'OK — registrazione funzionante' : 'ERRORE — vedi checks',
    checks,
  });
};
