/**
 * POST /api/vocabulary/generate-image
 *
 * Genera un'immagine contestuale per un termine del vocabolario con Imagen 3 Fast,
 * la salva su Vercel Blob e aggiorna keyVocabulary[i].imageUrl nel DB.
 *
 * Chiamata lazy dal frontend durante l'encounter: se imageUrl è null,
 * il client chiama questo endpoint in background. Alla risposta, swappa
 * il placeholder con l'immagine reale. Alla prossima sessione, l'URL è già in DB.
 *
 * Body JSON: { lessonId, term, semanticField?, contextSentences?, grammarNote? }
 *
 * Auth: withAuth
 */

import { withAuth } from '../../../lib/auth.js';
import { prisma }   from '../../../lib/prisma.js';
import { put }      from '@vercel/blob';

const IMAGEN_MODEL    = 'imagen-3.0-fast-generate-001';
const IMAGEN_ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${key}`;

/* ── Helper: slug per nomi file Blob ────────────────────────────── */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[āēīōūĀĒĪŌŪ]/g, m =>
      ({ā:'a',ē:'e',ī:'i',ō:'o',ū:'u',Ā:'a',Ē:'e',Ī:'i',Ō:'o',Ū:'u'}[m]))
    .replace(/[^a-z0-9]/g, '_')
    .replace(/__+/g, '_')
    .substring(0, 40);
}

/* ── Prompt immagine per termini latini/greci ────────────────────── */
function buildImagePrompt(term, semanticField, contextSentences, lang) {
  const isGreek  = lang && lang.toLowerCase().includes('grec');
  const langCtx  = isGreek ? 'ancient Greek' : 'ancient Roman';
  const ctx      = Array.isArray(contextSentences) && contextSentences.length > 0
    ? contextSentences[0].substring(0, 120)
    : semanticField || '';

  return (
    `Educational illustration for a ${langCtx} language lesson. ` +
    `Word: "${term}" as in: "${ctx}". ` +
    `Style: photorealistic, warm tones, museum-quality, clean white background, ` +
    `no text overlay, no watermarks. ` +
    `Subject: realistic single object or scene from ancient ${isGreek ? 'Greece' : 'Rome'} ` +
    `that clearly represents this concept.`
  );
}

/* ── Genera immagine con Imagen 3 Fast ──────────────────────────── */
async function generateImage(apiKey, prompt) {
  const response = await fetch(IMAGEN_ENDPOINT(apiKey), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      instances:  [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: '1:1' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Imagen API ${response.status}: ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  return data?.predictions?.[0]?.bytesBase64Encoded || null;
}

/* ── Handler ─────────────────────────────────────────────────────── */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lessonId, term, semanticField, contextSentences, grammarNote } = req.body || {};

  if (!lessonId || !term) {
    return res.status(400).json({ error: 'lessonId e term obbligatori' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY non configurata' });
  }

  /* ── 1. Verifica accesso alla lezione ───────────────────────── */
  let lesson;
  try {
    lesson = await prisma.lesson.findUnique({
      where:  { id: lessonId },
      select: {
        id: true, isFree: true, keyVocabulary: true,
        course: { select: { id: true, lang: true } }
      }
    });
  } catch (e) {
    return res.status(500).json({ error: 'Errore database' });
  }

  if (!lesson) return res.status(404).json({ error: 'Lezione non trovata' });

  const isAdmin = req.user?.email === process.env.ADMIN_EMAIL;
  if (!isAdmin && !lesson.isFree) {
    const sub = await prisma.subscription.findFirst({
      where: { userId: req.user.userId, status: 'active' }
    });
    const purchase = sub ? null : await prisma.purchase.findFirst({
      where: { userId: req.user.userId, courseId: lesson.course.id }
    });
    if (!sub && !purchase) return res.status(403).json({ error: 'Accesso non autorizzato' });
  }

  /* ── 2. Controlla se imageUrl già esiste nel DB ─────────────── */
  const vocab = Array.isArray(lesson.keyVocabulary) ? [...lesson.keyVocabulary] : [];
  const idx   = vocab.findIndex(v =>
    v.term === term ||
    (v.term || '').toLowerCase() === term.toLowerCase()
  );

  if (idx >= 0 && vocab[idx].imageUrl) {
    // Già generata: restituisci quella cached
    return res.status(200).json({ imageUrl: vocab[idx].imageUrl, cached: true });
  }

  /* ── 3. Genera immagine con Imagen 3 Fast ───────────────────── */
  let imageUrl = null;
  try {
    const lang   = lesson.course?.lang || '';
    const prompt = buildImagePrompt(term, semanticField, contextSentences, lang);
    const b64    = await generateImage(apiKey, prompt);

    if (b64) {
      const buffer   = Buffer.from(b64, 'base64');
      const filename = `vocab/${lessonId}/${slugify(term)}.png`;
      const blob     = await put(filename, buffer, {
        access:      'public',
        contentType: 'image/png',
      });
      imageUrl = blob.url;
    }
  } catch (e) {
    console.error(`[generate-image] Imagen failed for "${term}":`, e.message);
    return res.status(502).json({ error: 'Generazione immagine fallita', detail: e.message });
  }

  if (!imageUrl) {
    return res.status(502).json({ error: 'Imagen non ha restituito dati' });
  }

  /* ── 4. Aggiorna keyVocabulary nel DB ───────────────────────── */
  try {
    if (idx >= 0) {
      vocab[idx] = { ...vocab[idx], imageUrl };
    } else {
      // Termine non trovato nel vocab (es. review cross-capitolo): non aggiorniamo il DB
      // ma restituiamo l'URL generato per questa sessione
    }

    if (idx >= 0) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data:  { keyVocabulary: vocab }
      });
    }
  } catch (e) {
    console.error(`[generate-image] DB update failed for "${term}":`, e.message);
    // Non bloccare: l'immagine è stata generata, restituiamo l'URL comunque
  }

  return res.status(200).json({ imageUrl, cached: false });
}

export default withAuth(handler);
