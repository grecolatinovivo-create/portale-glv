/**
 * GET /api/vocabulary/session?lessonId=xxx
 *
 * Restituisce il vocabolario della lezione arricchito con immagini.
 *
 * METODO INDUTTIVO-CONTESTUALE (Krashen / Ørberg):
 *  Il significato NON viene mai mostrato allo studente come traduzione.
 *  È veicolato esclusivamente da: immagine contestuale + frase dal testo.
 *  La "comprensione" è un atto inferenziale, non dichiarativo.
 *
 * Flusso vocabolario:
 *  1. Se keyVocabulary è già popolato → usalo direttamente
 *  2. Se keyVocabulary è vuoto ma textFragment esiste → auto-genera via Gemini
 *     (zero lavoro admin: la lezione si arricchisce al primo accesso)
 *
 * Flusso immagini:
 *  1. Se keyVocabulary[i].imageUrl esiste → usa quello (cached)
 *  2. Se manca → genera con Imagen 3 Fast, carica su Vercel Blob, aggiorna DB
 *
 * Provider: Google Gemini 2.0 Flash (estrazione vocab) + Imagen 3 Fast (immagini)
 * Cost immagini: ~$0.02/immagine, generate una volta sola per lezione
 *
 * Auth: withAuth — utente deve aver accesso alla lezione
 */

import { withAuth } from '../../../lib/auth.js';
import { prisma }   from '../../../lib/prisma.js';
import { put }      from '@vercel/blob';

/* ── Costanti ────────────────────────────────────────────────────── */
const IMAGEN_MODEL    = 'imagen-3.0-fast-generate-001';
const GEMINI_MODEL    = 'gemini-2.0-flash';

const IMAGEN_ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${key}`;
const GEMINI_ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

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
    const sub = await prisma.subscription.findFirst({
      where: { userId: req.user.userId, status: 'active' }
    });
    const purchase = sub ? null : await prisma.purchase.findFirst({
      where: { userId: req.user.userId, courseId: lesson.course.id }
    });
    if (!sub && !purchase) {
      return res.status(403).json({ error: 'Accesso non autorizzato a questa lezione' });
    }
  }

  /* ── 3. Auto-genera keyVocabulary se vuoto ma testo disponibile ── */
  const apiKey   = process.env.GEMINI_API_KEY;
  let rawVocab   = lesson.keyVocabulary;
  const hasText  = !!(lesson.textFragment && lesson.textFragment.trim().length > 50);

  const vocabIsEmpty = !rawVocab || !Array.isArray(rawVocab) || rawVocab.length === 0;

  if (vocabIsEmpty) {
    if (!hasText) {
      // Nessun testo disponibile: impossibile generare
      return res.status(200).json({
        words:        [],
        textFragment: lesson.textFragment || null,
        lessonTitle:  lesson.title,
        courseTitle:  lesson.course?.title || '',
        courseLang:   lesson.course?.lang  || '',
        hasVocab:     false,
      });
    }

    if (apiKey) {
      try {
        // Auto-genera vocabolario dal textFragment via Gemini
        rawVocab = await autoGenerateVocab(
          lesson.textFragment,
          lesson.title,
          lesson.course?.title || '',
          lesson.course?.lang  || '',
          apiKey
        );

        if (rawVocab && rawVocab.length > 0) {
          // Salva nel DB (zero lavoro futuro)
          await prisma.lesson.update({
            where: { id: lessonId },
            data:  { keyVocabulary: rawVocab }
          });
        }
      } catch (e) {
        console.error('[vocab/session] Auto-gen failed:', e.message);
        rawVocab = [];
      }
    }

    if (!rawVocab || rawVocab.length === 0) {
      return res.status(200).json({
        words:        [],
        textFragment: lesson.textFragment || null,
        lessonTitle:  lesson.title,
        courseTitle:  lesson.course?.title || '',
        courseLang:   lesson.course?.lang  || '',
        hasVocab:     false,
      });
    }
  }

  /* ── 4. Genera immagini mancanti (Imagen → Vercel Blob) ────── */
  let vocab         = [...rawVocab];
  let dbNeedsUpdate = false;

  if (apiKey) {
    for (let i = 0; i < vocab.length; i++) {
      const word = vocab[i];
      if (word.imageUrl) continue; // già cached

      try {
        const prompt      = buildImagePrompt(word, lesson.course?.lang);
        const imageBase64 = await generateImage(apiKey, prompt);

        if (imageBase64) {
          const buffer   = Buffer.from(imageBase64, 'base64');
          const filename = `vocab/${lessonId}/${i}_${slugify(word.term)}.png`;
          const blob     = await put(filename, buffer, {
            access:      'public',
            contentType: 'image/png',
          });
          vocab[i]      = { ...word, imageUrl: blob.url };
          dbNeedsUpdate = true;
        }
      } catch (e) {
        console.error(`[vocab/session] Image gen failed for "${word.term}":`, e.message);
        // Continua senza immagine — il frontend mostra un placeholder emoji
      }
    }

    if (dbNeedsUpdate) {
      try {
        await prisma.lesson.update({
          where: { id: lessonId },
          data:  { keyVocabulary: vocab }
        });
      } catch (e) {
        console.error('[vocab/session] DB image-url update failed:', e.message);
      }
    }
  }

  /* ── 5. Costruisci risposta — SENZA traduzione ───────────────── */
  // Il campo `meaning` NON viene mai esposto al frontend:
  // il significato è veicolato da immagine + contextSentence (metodo induttivo).
  // Se il vocab è stato auto-generato, `meaning` non esiste.
  // Se era stato inserito manualmente con `meaning`, lo usiamo solo
  // internamente per le immagini, mai in output.
  const text  = lesson.textFragment || '';
  const words = vocab.map(word => ({
    term:            word.term,
    // meaning: OMESSO — mai mostrato allo studente
    notes:           word.notes || null,
    imageUrl:        word.imageUrl || null,
    // contextSentence: priorità 1 → salvata nel DB (da auto-gen)
    //                  priorità 2 → estratta runtime da textFragment
    contextSentence: word.contextSentence
      || extractContextSentence(text, word.term)
      || null,
    // imagePromptHint: solo per uso interno futuro, non esposto
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

/* ═══════════════════════════════════════════════════════════════════
   AUTO-GENERAZIONE VOCABOLARIO (Gemini 2.0 Flash)
   ═══════════════════════════════════════════════════════════════════
   Principio: estrae dal testo i termini che lo studente DEVE incontrare
   per capire la lezione. Nessuna traduzione — il significato emerge
   dall'esposizione al testo + all'immagine contestuale.
   Formato output: [{term, contextSentence, notes?}]
*/
async function autoGenerateVocab(textFragment, lessonTitle, courseTitle, courseLang, apiKey) {
  const isGreek = courseLang && courseLang.toLowerCase().includes('grec');
  const lang    = isGreek ? 'greco antico' : 'latino';

  const systemPrompt = `Sei un esperto di didattica delle lingue classiche che usa il metodo induttivo-contestuale (Krashen, Ørberg/LLPSI).
Il tuo compito è identificare il lessico chiave di un testo di ${lang} per una piattaforma di apprendimento.

PRINCIPIO FONDAMENTALE: non fornire MAI traduzioni. Il significato delle parole viene acquisito dallo studente attraverso l'immagine e il contesto narrativo, non attraverso la glossa in italiano. Questo è il cuore del metodo.

Dal testo fornito, estrai 6-10 termini chiave seguendo questi criteri:
- Parole che sono cruciali per capire la narrativa (sostantivi, verbi, aggettivi principali)
- Termini che uno studente di livello A1-B1 troverebbe nuovi ma inferibili dal contesto
- Privilegia parole che designano oggetti concreti, azioni visibili, persone, luoghi
- Evita parole grammaticali (congiunzioni, preposizioni comuni, pronomi)
- Evita termini già noti a chiunque (es. "Roma", "Caesar")

Per ogni termine fornisci:
- term: la forma ESATTA come appare nel testo (non il lemma dizionario)
- contextSentence: la frase COMPLETA e VERBATIM dal testo dove appare il termine
- notes: SOLO una nota grammaticale breve se davvero utile (es. "abl. assoluto", "part. perf."), altrimenti null

NON fornire:
- Traduzioni italiane
- Significati
- Glosse
- Spiegazioni del contenuto

Rispondi SOLO con un JSON array valido: [{"term":"...","contextSentence":"...","notes":null}]`;

  const body = {
    contents: [{
      role: 'user',
      parts: [{ text: `Corso: ${courseTitle || '(non specificato)'}\nLezione: ${lessonTitle}\n\nTesto:\n${textFragment}` }]
    }],
    generationConfig: {
      temperature:      0.3,
      maxOutputTokens:  1200,
      responseMimeType: 'application/json',
    },
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  const response = await fetch(GEMINI_ENDPOINT(apiKey), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini vocab-gen ${response.status}: ${err.substring(0, 120)}`);
  }

  const data   = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

  try {
    const parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed)) throw new Error('Non è un array');

    // Validazione: ogni item deve avere almeno term e contextSentence
    return parsed.filter(item =>
      item && typeof item.term === 'string' && item.term.trim() &&
      typeof item.contextSentence === 'string' && item.contextSentence.trim()
    ).map(item => ({
      term:            item.term.trim(),
      contextSentence: item.contextSentence.trim(),
      notes:           item.notes || null,
      // imageUrl: sarà aggiunto nella fase successiva
    }));
  } catch (e) {
    console.error('[vocab/session] JSON parse error:', e.message, '— raw:', rawText.substring(0, 200));
    return [];
  }
}

/* ── Prompt immagine: usa contextSentence invece di meaning ───────── */
function buildImagePrompt(word, lang) {
  const isGreek  = lang && lang.toLowerCase().includes('grec');
  const langCtx  = isGreek ? 'ancient Greek' : 'ancient Roman';
  const notes    = word.notes ? ` (${word.notes})` : '';

  // Il significato viene inferito dalla frase di contesto, non da una glossa
  // Usiamo `meaning` solo se presente (backward compat con vocab inserito manualmente)
  // ma mai come etichetta visibile
  const conceptHint = word.meaning
    ? `"${word.term}" (${word.meaning})`       // admin ha inserito il significato → usalo per il prompt
    : `"${word.term}" as in: "${(word.contextSentence || '').substring(0, 100)}"`; // auto-generato

  return (
    `Educational illustration for a ${langCtx} language lesson. ` +
    `Word: ${conceptHint}${notes}. ` +
    `Style: photorealistic, warm tones, museum-quality, clean white background, ` +
    `no text overlay, no watermarks. ` +
    `Subject: realistic single object or scene from ancient ${isGreek ? 'Greece' : 'Rome'} ` +
    `that clearly represents this concept.`
  );
}

/* ── Genera immagine con Imagen 3 Fast ────────────────────────────── */
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
    throw new Error(`Imagen API ${response.status}: ${errText.substring(0, 120)}`);
  }

  const data = await response.json();
  return data?.predictions?.[0]?.bytesBase64Encoded || null;
}

/* ── Estrae la frase di contesto dal testo (fallback runtime) ─────── */
function extractContextSentence(text, term) {
  if (!text || !term) return null;

  const sentences = text
    .split(/(?<=[.!?;])\s+/)
    .filter(s => s.trim().length > 10);

  // Cerca la radice del termine (case-insensitive)
  const root = term.length >= 5
    ? term.substring(0, Math.max(5, Math.floor(term.length * 0.7)))
    : term;
  const re = new RegExp(root, 'i');

  const match = sentences.find(s => re.test(s));
  return match?.trim() || sentences[0]?.trim() || null;
}

/* ── Slug per nomi file Blob ──────────────────────────────────────── */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/__+/g, '_')
    .substring(0, 40);
}

export default withAuth(handler);
