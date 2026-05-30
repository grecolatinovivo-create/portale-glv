// lib/auth.js — Utilità JWT + cookie

const jwt    = require('jsonwebtoken');
const cookie = require('cookie');
const { prisma } = require('./prisma');

const JWT_SECRET  = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const COOKIE_NAME = 'glv_token';
const MAX_AGE     = 60 * 60 * 24 * 7; // 7 giorni

/**
 * Genera un JWT per l'utente.
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: MAX_AGE });
}

/**
 * Verifica e decodifica un JWT. Ritorna null se invalido.
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Imposta il cookie di autenticazione nella risposta.
 */
function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  }));
}

/**
 * Cancella il cookie di autenticazione.
 */
function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  }));
}

/**
 * Middleware: legge il token dal cookie e lo verifica.
 * Aggiunge req.user se valido, null altrimenti.
 *
 * La sospensione viene riverificata sul DB ad OGNI richiesta autenticata:
 * un utente sospeso dall'admin perde subito l'accesso, senza dover aspettare
 * la scadenza del JWT (7 giorni). Costo: una lookup per chiave primaria
 * (indicizzata) sulle sole richieste con token valido. Fail-open se il campo
 * isSuspended non esiste ancora nel DB.
 */
function withAuth(handler) {
  return async (req, res) => {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token   = cookies[COOKIE_NAME];
    const decoded = token ? verifyToken(token) : null;
    req.user = decoded;

    if (decoded?.userId) {
      try {
        const u = await prisma.user.findUnique({
          where:  { id: decoded.userId },
          select: { isSuspended: true },
        });
        // Utente sospeso o eliminato → trattato come non autenticato
        if (!u || u.isSuspended) req.user = null;
      } catch {
        /* campo/DB non disponibile — fail-open (comportamento precedente) */
      }
    }

    return handler(req, res);
  };
}

/**
 * Middleware: richiede autenticazione. Ritorna 401 se non autenticato.
 */
function requireAuth(handler) {
  return withAuth(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non autenticato' });
    }
    return handler(req, res);
  });
}

module.exports = { signToken, verifyToken, setAuthCookie, clearAuthCookie, withAuth, requireAuth };
