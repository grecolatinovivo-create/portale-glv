/**
 * GET /api/vocabulary/session?lessonId=xxx
 *
 * Restituisce il vocabolario della lezione arricchito con:
 *  - imageUrl: URL Vercel Blob (generato on-demand, poi cached nel DB)
 *  - contextSentence: frase estratta da textFragment dove appare il termine
 *
 * Flusso immagini:
 *  1. Se keyVocabulary[i].imageUrl esiste → usa quello (cached)
 *  2. Se manca → chiama Gemini Imagen 3 Fast, carica su Vercel Blob,
 *     aggiorna keyVocabulary nel DB (write-through cache)
 *
 * Provider: Google Imagen 3 Fast via REST API
 * Cost: ~$0.02/immagine, generate una volta sola per lezione
 *
 * Auth: withAuth — utente deve aver accesso alla lezione
 */

import { withAuth } from '../../../lib/auth.js';
import { prisma }   from '../../../lib/prisma.js';
import { put }      from '@vercel/blob';

/* ── Costanti ────────────────────────────────────────────────────── */
const IMAGEN_MODEL  = 'imagen-3.0-fast-generate-001';
const IMAGEN_ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${key}`;

/* ── Handler ─────────────────────────────────────────────────────── */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lessonId } = req.query;
  if (!lessonId) {
    return res.status(400).json({ error: 'lessonId obbligatorio' });
  }

  /* ── 1. Fetch lezione con corso ─────────────────────────────── */
  let lesson;
  try {
    lesson = await prisma.lesson.findUnique({
      where:  { id: lessonId },
      select: {
        id:                 true,
        title:              true,
        isFree:             true,
        textFragment:       true,
        keyVocabulary:      true,
        contentSummary:     true,
        learningObjectives: true,
        course: {
          select: { id: true, title: true, lang: true, tierRequired: true }
        }
      }
    });
  } catch (e) {
    console.error('[vocab/session] DB error:', e.message);
    return res.status(500).json({ error: 'Errore database' });
  }

  if (!lesson) {
    return res.status(404).json({ error: 'Lezione non trovata' });
  }

  /* ── 2. Verifica accesso (replica logica di courses/[id].js) ── */
  const isAdmin = req.user?.email === process.env.ADMIN_EMAIL;

  if (!isAdmin && !lesson.isFree) {
    // Controlla abbonamento attivo
    const sub = await prisma.subscription.findFirst({
      where: { userId: req.user.userId, status: 'active' }
    });
    // Controlla acquisto singolo corso
    const purchase = sub ? null : await prisma.purchase.findFirst({
      where: { userId: req.user.userId, courseId: lesson.course.id }
    });

    if (!sub && !purchase) {
      return res.status(403).json({ error: 'Accesso non autorizzato a questa lezione' });
    }
  }

  /* ── 3. Controlla che ci sia vocabolario ──────────────────── */
  const rawVocab = lesson.keyVocabulary;
  if (!rawVocab || !Array.isArray(rawVocab) || rawVocab.length === 0) {
    return res.status(200).json({
      words:         [],
      textFragment:  lesson.textFragment || null,
      lessonTitle:   lesson.title,
      courseTitle:   lesson.course?.title || '',
      courseLang:    lesson.course?.lang  || '',
      hasVocab:      false,
    });
  }

  /* ── 4. Genera immagini mancanti (Imagen → Vercel Blob) ────── */
  const apiKey = process.env.GEMINI_API_KEY;
  let vocab    = [...rawVocab]; // copia per eventuali aggiornamenti
  let dbNeedsUpdate = false;

  if (apiKey) {
    for (let i = 0; i < vocab.length; i++) {
      const word = vocab[i];
      // Salta se l'immagine è già cached
      if (word.imageUrl) continue;

      try {
        const prompt = buildImagePrompt(word, lesson.course?.lang);
        const imageBase64 = await generateImage(apiKey, prompt);

        if (imageBase64) {
          // Carica su Vercel Blob
          const buffer   = Buffer.from(imageBase64, 'base64');
          const filename = `vocab/${lessonId}/${i}_${slugify(word.term)}.png`;
          const blob     = await put(filename, buffer, {
            access:      'public',
            contentType: 'image/png',
          });

          vocab[i] = { ...word, imageUrl: blob.url };
          dbNeedsUpdate = true;
        }
      } catch (e) {
        console.error(`[vocab/session] Image gen failed for "${word.term}":`, e.message);
        // Continua senza immagine — fallback gestito nel frontend
      }
    }

    // Aggiorna il DB con le nuove imageUrl (write-through cache)
    if (dbNeedsUpdate) {
      try {
        await prisma.lesson.update({
          where: { id: lessonId },
          data:  { keyVocabulary: vocab }
        });
      } catch (e) {
        console.error('[vocab/session] DB update failed:', e.message);
        // Non fatale: le immagini sono già su Blob, perdiamo solo la cache
      }
    }
  }

  /* ── 5. Arricchisci ogni parola con contextSentence ─────────── */
  const text  = lesson.textFragment || '';
  const words = vocab.map(word => ({
    term:            word.term,
    meaning:         word.meaning,
    notes:           word.notes || null,
    imageUrl:        word.imageUrl || null,
    contextSentence: extractContextSentence(text, word.term),
  }));

  return res.status(200).json({
    words,
    textFragment:  lesson.textFragment || null,
    lessonTitle:   lesson.title,
    courseTitle:   lesson.course?.title || '',
    courseLang:    lesson.course?.lang  || '',
    hasVocab:      true,
  });
}

/* ── Funzioni helper ──────────────────────────────────────────────── */

/**
 * Costruisce il prompt per Imagen — contestualizzato per lingua classica.
 */
function buildImagePrompt(word, lang) {
  const isGreek = lang && lang.toLowerCase().includes('grec');
  const langCtx = isGreek ? 'ancient Greek' : 'ancient Roman';
  const notes   = word.notes ? ` (${word.notes})` : '';

  // Prompt ottimizzato per illustrazioni didattiche pulite
  return (
    `Educational illustration for a ${langCtx} language lesson. ` +
    `Concept: "${word.term}" meaning "${word.meaning}"${notes}. ` +
    `Style: photorealistic, warm tones, museum-quality, clean background, ` +
    `no text overlay, no watermarks, no people's faces close-up. ` +
    `Subject: realistic depiction of the concept in ancient ${isGreek ? 'Greece' : 'Rome'}.`
  );
}

/**
 * Chiama Gemini Imagen 3 Fast via REST API.
 * Restituisce la stringa base64 dell'immagine PNG, o null in caso di errore.
 */
async function generateImage(apiKey, prompt) {
  const response = await fetch(IMAGEN_ENDPOINT(apiKey), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      instances:  [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Imagen API ${response.status}: ${errText.substring(0, 120)}`);
  }

  const data = await response.json();
  // La risposta ha predictions[0].bytesBase64Encoded
  return data?.predictions?.[0]?.bytesBase64Encoded || null;
}

/**
 * Estrae la frase del textFragment che contiene il termine.
 * Cerca una corrispondenza case-insensitive sulla radice (5+ caratteri).
 */
function extractContextSentence(text, term) {
  if (!text || !term) return null;

  // Dividi il testo in frasi (., ?, !, punto e virgola)
  const sentences = text
    .split(/(?<=[.!?;])\s+/)
    .filter(s => s.trim().length > 10);

  // Cerca la radice (min 5 caratteri) del termine
  const root = term.length >= 5 ? term.substring(0, Math.max(5, Math.floor(term.length * 0.7))) : term;
  const re   = new RegExp(root, 'i');

  const match = sentences.find(s => re.test(s));
  if (match) return match.trim();

  // Fallback: ritorna il primo pezzo di testo se il termine non è trovato
  return sentences[0]?.trim() || null; // Il frontend ha un fallback su null
}

/**
 * Converte un termine in slug per il nome file Blob.
 */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/__+/g, '_')
    .substring(0, 40);
}

export default withAuth(handler);
