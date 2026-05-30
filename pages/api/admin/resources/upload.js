// pages/api/admin/resources/upload.js
// POST — endpoint di handshake per l'upload CLIENT-SIDE su Vercel Blob.
//
// Il file NON passa dal server (evita il limite 4.5MB del body serverless di Vercel):
// il browser usa `upload()` di @vercel/blob/client, che chiama questo endpoint per
// ottenere un token firmato, poi carica il file DIRETTAMENTE su Blob.
// Dopo l'upload il client chiama /api/admin/resources/create per registrare la
// LessonResource nel DB.
//
// Qui verifichiamo che chi richiede il token sia l'admin.

import { handleUpload } from '@vercel/blob/client';
const { verifyToken } = require('../../../../lib/auth');
const cookie = require('cookie');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  // Auth admin via cookie JWT
  const cookies = cookie.parse(req.headers.cookie || '');
  const decoded = cookies.glv_token ? verifyToken(cookies.glv_token) : null;
  if (!decoded || decoded.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  try {
    const jsonResponse = await handleUpload({
      request: req,
      body: req.body,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => ({
        // Tipi consentiti per i materiali didattici
        allowedContentTypes: [
          'application/pdf',
          'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg',
          'image/png', 'image/jpeg', 'image/gif', 'image/webp',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/zip',
        ],
        addRandomSuffix: true,
        maximumSizeInBytes: 200 * 1024 * 1024, // 200 MB
        tokenPayload: JSON.stringify({ admin: decoded.email, pathname }),
      }),
      // onUploadCompleted non è affidabile in locale (richiede URL pubblico per il
      // callback Vercel): la creazione della LessonResource avviene via
      // /api/admin/resources/create chiamato dal client dopo l'upload.
      onUploadCompleted: async () => {},
    });

    return res.status(200).json(jsonResponse);
  } catch (err) {
    console.error('[admin/resources/upload]', err);
    return res.status(400).json({ error: err.message || 'Errore handshake upload' });
  }
}
