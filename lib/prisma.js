// lib/prisma.js — Singleton Prisma client
// In Next.js, hot-reload crea nuove connessioni: questo pattern le riusa.
// IMPORTANTE: il singleton viene salvato su globalThis in TUTTI gli ambienti,
// non solo in dev. In produzione (Vercel serverless) il processo Lambda viene
// riutilizzato tra invocazioni warm: senza questo salvataggio ogni richiesta API
// creerebbe un nuovo PrismaClient e una nuova connessione Neon, causando
// connection pool exhaustion e cold start intermittenti.

const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });
}

const prisma = globalForPrisma.prisma;

module.exports = { prisma };
