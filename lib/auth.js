// lib/auth.js — Utilità JWT + cookie

const jwt    = require('jsonwebtoken');
const cookie = require('cookie');

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
 * La sospensione viene controllata al login (non qui, per evitare
 * una query DB su ogni richiesta).
 */
function withAuth(handler) {
  return async (req, res) => {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token   = cookies[COOKIE_NAME];
    req.user = token ? verifyToken(token) : null;
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
