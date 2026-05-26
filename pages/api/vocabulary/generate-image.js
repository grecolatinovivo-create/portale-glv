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

// Nano Banana (gemini-2.5-flash-image): modello stabile per image generation
// via standard Gemini API key — stessa key usata per il testo.
const GEMINI_IMG_MODEL    = 'gemini-2.5-flash-image';
const GEMINI_IMG_ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMG_MODEL}:generateContent?key=${key}`;

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
  const isGreek = lang && lang.toLowerCase().includes('grec');
  const culture = isGreek ? 'ancient Greek' : 'ancient Roman';
  const ctx     = Array.isArray(contextSentences) && contextSentences.length > 0
    ? contextSentences[0].substring(0, 120)
    : semanticField || term;

  return (
    `Children's book illustration style, like a 1950s Italian elementary school primer (sussidiario). ` +
    `Draw: one single object or character from ${culture} daily life that represents "${term}" ` +
    `(context: "${ctx}"). ` +
    `Style: hand-drawn line art with flat watercolor fills, warm muted palette, ` +
    `simple shapes, like Lele Luzzati or old Einaudi children's books. ` +
    `Plain white or cream background, no scenery, no decorations, no text. ` +
    `NOT photorealistic. NOT a photograph. NOT a sculpture. NOT a museum piece. ` +
    `NO text, NO letters, NO numbers, NO labels anywhere. ` +
    `Just one clear, simple illustration of the concept, centered, with generous white space around it.`
  );
}

/* ── Genera immagine con Gemini 2.0 Flash (image generation) ──── */
async function generateImage(apiKey, prompt) {
  const response = await fetch(GEMINI_IMG_ENDPOINT(apiKey), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini image-gen ${response.status}: ${errText.substring(0, 300)}`);
  }

  const data = await response.json();
  // La risposta ha parts con inlineData invece di predictions
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
  return imgPart?.inlineData?.data || null;
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
  let imageUrl  = null;
  let b64Image  = null;

  try {
    const lang   = lesson.course?.lang || '';
    const prompt = buildImagePrompt(term, semanticField, contextSentences, lang);
    b64Image     = await generateImage(apiKey, prompt);
  } catch (e) {
    console.error(`[generate-image] Imagen API failed for "${term}":`, e.message);
    return res.status(502).json({ error: 'Imagen API fallita', detail: e.message });
  }

  if (!b64Image) {
    console.error(`[generate-image] Imagen returned no data for "${term}"`);
    return res.status(502).json({ error: 'Imagen non ha restituito dati' });
  }

  /* ── 4. Salva su Vercel Blob (se token disponibile) altrimenti data URL ── */
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    try {
      const buffer   = Buffer.from(b64Image, 'base64');
      const filename = `vocab/${lessonId}/${slugify(term)}.png`;
      const blob     = await put(filename, buffer, {
        access:      'public',
        contentType: 'image/png',
      });
      imageUrl = blob.url;
    } catch (e) {
      console.error(`[generate-image] Vercel Blob failed for "${term}":`, e.message);
      // Fallback: usa data URL (salvato nel DB, funziona senza Blob)
      imageUrl = `data:image/png;base64,${b64Image}`;
    }
  } else {
    // Nessun token Blob configurato: usa data URL come fallback
    console.warn(`[generate-image] BLOB_READ_WRITE_TOKEN mancante — uso data URL per "${term}"`);
    imageUrl = `data:image/png;base64,${b64Image}`;
  }

  /* ── 5. Aggiorna keyVocabulary nel DB ───────────────────────── */
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
