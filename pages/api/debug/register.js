// pages/api/debug/register.js — Diagnostica completa
// Accessibile SOLO all'admin loggato: espone conteggio utenti, presenza chiavi e
// prefisso del DATABASE_URL. Per chiunque altro risponde 404.

const { withAuth } = require('../../../lib/auth');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

export default withAuth(async function handler(req, res) {
  // Gate admin: nessuna informazione esposta a utenti non admin
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(404).json({ error: 'Not found' });
  }

  const checks = {};

  // 1. Variabili d'ambiente (non richiede nulla)
  checks.env = {
    ok: true,
    DATABASE_URL:   !!process.env.DATABASE_URL,
    JWT_SECRET:     !!process.env.JWT_SECRET,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    NODE_ENV:       process.env.NODE_ENV,
    DB_URL_prefix:  process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(0, 30) + '...' : 'MANCANTE',
  };

  // 2. @prisma/client — caricamento modulo
  let PrismaClient;
  try {
    ({ PrismaClient } = require('@prisma/client'));
    checks.prisma_module = { ok: true };
  } catch (e) {
    checks.prisma_module = { ok: false, error: e.message };
  }

  // 3. Prisma — istanza e connessione DB
  if (PrismaClient) {
    try {
      const pc = new PrismaClient();
      const count = await pc.user.count();
      await pc.$disconnect();
      checks.prisma_db = { ok: true, userCount: count };
    } catch (e) {
      checks.prisma_db = { ok: false, error: e.message };
    }
  }

  // 4. bcryptjs
  try {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('test', 10);
    checks.bcrypt = { ok: !!hash };
  } catch (e) {
    checks.bcrypt = { ok: false, error: e.message };
  }

  // 5. jsonwebtoken
  try {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ test: 1 }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: 60 });
    checks.jwt = { ok: !!token };
  } catch (e) {
    checks.jwt = { ok: false, error: e.message };
  }

  // 6. resend
  try {
    const { Resend } = require('resend');
    new Resend(process.env.RESEND_API_KEY || 'placeholder');
    checks.resend = { ok: true };
  } catch (e) {
    checks.resend = { ok: false, error: e.message };
  }

  // 7. lib/prisma singleton
  try {
    const { prisma } = require('../../../lib/prisma');
    const n = await prisma.user.count();
    checks.lib_prisma = { ok: true, userCount: n };
  } catch (e) {
    checks.lib_prisma = { ok: false, error: e.message };
  }

  // 8. lib/auth
  try {
    const { signToken } = require('../../../lib/auth');
    const t = signToken({ userId: 'x', email: 'x@x.it' });
    checks.lib_auth = { ok: !!t };
  } catch (e) {
    checks.lib_auth = { ok: false, error: e.message };
  }

  const failed = Object.entries(checks).filter(([, v]) => v.ok === false).map(([k]) => k);
  const allOk  = failed.length === 0;

  return res.status(200).json({   // sempre 200 così leggiamo la risposta
    status: allOk ? '✓ Tutto OK' : `✗ Fallito: ${failed.join(', ')}`,
    checks,
  });
});
