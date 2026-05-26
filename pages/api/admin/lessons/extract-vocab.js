/**
 * POST /api/admin/lessons/extract-vocab
 *
 * Endpoint admin-only: estrae vocabolario strutturato ricco da un capitolo
 * (testo e/o immagini di pagine scansionate) usando Gemini 2.0 Flash.
 *
 * Salva il risultato nel campo keyVocabulary della lezione target.
 *
 * Body (multipart/form-data oppure JSON):
 *  - lessonId:     string   — ID lezione target
 *  - text?:        string   — testo del capitolo (plain text / trascritto da PDF/OCR)
 *  - append?:      boolean  — se true, aggiunge ai termini esistenti invece di sostituire
 *  - maxTerms?:    number   — quanti termini estrarre (default: 15)
 *  - difficulty?:  string   — livello difficoltà hint per Gemini ("A1" | "A2" | "B1")
 *
 * Output per ogni termine (formato ricco per motore adattivo):
 * [{
 *   term:             string   — forma esatta dal testo
 *   forms:            string[] — altre forme morfologiche (es. gen., plur.)
 *   semanticField:    string   — campo semantico (es. "famiglia", "abitazione", "cibo")
 *   contextSentences: string[] — frasi verbatim dal testo (max 3)
 *   difficulty:       number   — 1=base, 2=intermedio, 3=avanzato
 *   grammarNote:      string|null — nota grammaticale breve se utile
 *   imageUrl:         null     — verrà generata da session.js al primo accesso
 * }]
 *
 * Auth: solo admin (req.user.email === ADMIN_EMAIL)
 */

import { withAuth } from '../../../../lib/auth.js';
import { prisma }   from '../../../../lib/prisma.js';

const GEMINI_MODEL    = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

/* ── Limite dimensione body ────────────────────────────────────────── */
export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

/* ── Handler ─────────────────────────────────────────────────────── */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  /* ── 1. Solo admin ─────────────────────────────────────────────── */
  const isAdmin = req.user?.email === process.env.ADMIN_EMAIL;
  if (!isAdmin) {
    return res.status(403).json({ error: 'Accesso riservato agli amministratori' });
  }

  const {
    lessonId,
    text,
    append    = false,
    maxTerms  = 15,
    difficulty = null,
  } = req.body || {};

  if (!lessonId) {
    return res.status(400).json({ error: 'lessonId obbligatorio' });
  }

  if (!text?.trim()) {
    return res.status(400).json({ error: 'text obbligatorio (testo del capitolo)' });
  }

  /* ── 2. Carica lezione ─────────────────────────────────────────── */
  let lesson;
  try {
    lesson = await prisma.lesson.findUnique({
      where:  { id: lessonId },
      select: {
        id:           true,
        title:        true,
        keyVocabulary: true,
        course: { select: { title: true, lang: true } }
      }
    });
  } catch (e) {
    return res.status(500).json({ error: 'Errore database' });
  }

  if (!lesson) {
    return res.status(404).json({ error: 'Lezione non trovata' });
  }

  /* ── 3. Chiama Gemini per estrazione strutturata ─────────────────── */
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY non configurata' });
  }

  let extracted;
  try {
    extracted = await extractVocabWithGemini({
      text:       text.trim(),
      lessonTitle: lesson.title,
      courseTitle: lesson.course?.title || '',
      courseLang:  lesson.course?.lang  || '',
      maxTerms:   Number(maxTerms) || 15,
      difficultyHint: difficulty,
      apiKey,
    });
  } catch (e) {
    console.error('[extract-vocab] Gemini error:', e.message);
    return res.status(502).json({ error: `Errore Gemini: ${e.message}` });
  }

  if (!extracted || extracted.length === 0) {
    return res.status(422).json({ error: 'Gemini non ha estratto termini validi dal testo' });
  }

  /* ── 4. Merge o sostituisci con vocab esistente ─────────────────── */
  let finalVocab;

  if (append && Array.isArray(lesson.keyVocabulary) && lesson.keyVocabulary.length > 0) {
    // Merge: aggiungi solo termini non già presenti (per termine esatto)
    const existingTerms = new Set(lesson.keyVocabulary.map(v => v.term.toLowerCase().trim()));
    const newTerms = extracted.filter(v => !existingTerms.has(v.term.toLowerCase().trim()));
    finalVocab = [...lesson.keyVocabulary, ...newTerms];
  } else {
    finalVocab = extracted;
  }

  /* ── 5. Salva nel DB ─────────────────────────────────────────────── */
  try {
    await prisma.lesson.update({
      where: { id: lessonId },
      data:  { keyVocabulary: finalVocab }
    });
  } catch (e) {
    console.error('[extract-vocab] DB update error:', e.message);
    return res.status(500).json({ error: 'Errore salvataggio nel database' });
  }

  return res.status(200).json({
    lessonId,
    lessonTitle:   lesson.title,
    extracted:     extracted.length,
    total:         finalVocab.length,
    appended:      append,
    vocabulary:    finalVocab,
  });
}

/* ═══════════════════════════════════════════════════════════════════
   ESTRAZIONE VOCABOLARIO — Gemini 2.0 Flash
   ═══════════════════════════════════════════════════════════════════
   Principio metodologico (Krashen / LLPSI):
   - Nessuna traduzione — il significato emerge dall'immagine + contesto
   - Termini estratti in forma esatta come appaiono nel testo
   - Campo semantico per raggruppamento tematico (metodo induttivo)
   - Frasi di contesto verbatim per comprensione implicita
   - Difficoltà stimata per ordinamento progressivo
*/
async function extractVocabWithGemini({ text, lessonTitle, courseTitle, courseLang, maxTerms, difficultyHint, apiKey }) {
  const isGreek = courseLang && courseLang.toLowerCase().includes('grec');
  const lang    = isGreek ? 'greco antico' : 'latino';

  const diffHint = difficultyHint
    ? `\nLivello target degli studenti: ${difficultyHint} (CEFR adattato per lingue classiche).`
    : '';

  const systemPrompt = `Sei un esperto di didattica delle lingue classiche con il metodo induttivo-contestuale (Krashen, Ørberg/LLPSI).
Hai il compito di estrarre il lessico chiave da un testo di ${lang} per alimentare un motore adattivo di acquisizione lessicale.

PRINCIPIO FONDAMENTALE: non fornire MAI traduzioni italiane. Il significato delle parole viene acquisito dallo studente attraverso immagini contestuali e frasi dal testo, non attraverso glosse in italiano. Questo è il cuore del metodo.

OBIETTIVO: costruire una "knowledge base" del capitolo che permetta al motore adattivo di:
1. Presentare il termine per la prima volta con immagine + frase di contesto (livello Encounter)
2. Testare il riconoscimento con 4 opzioni visive (livello Recognition)
3. Richiedere produzione in un cloze (livello Cloze)
4. Ripresentare cross-capitolo i termini dimenticati (SRS)

CRITERI DI SELEZIONE (seleziona ${maxTerms} termini):
- Sostantivi, verbi, aggettivi principali della narrativa
- Termini cruciali per seguire la storia (senza questi il testo non si capisce)
- Parole che uno studente di livello base-intermedio trovrebbe nuove ma inferibili dal contesto
- Privilegia: oggetti concreti, azioni visibili, persone, luoghi, sentimenti espressi
- Evita: conjunctions, prepositions comuni, pronouns, termini universalmente noti (Roma, Caesar)
- Evita: termini estremamente tecnici grammaticali come lemma principale${diffHint}

Per ogni termine fornisci:
- term: forma ESATTA come appare nel testo (NON il lemma dizionario — mantieni caso/persona/numero/tempo)
- forms: array con 1-3 altre forme morfologiche utili per il riconoscimento (es. nominativo se hai genitivo, infinito se hai forma coniugata) — array vuoto se non necessario
- semanticField: campo semantico sintetico in italiano (es. "famiglia", "abitazione", "cibo", "sentimenti", "movimento", "lavoro agricolo") — serve per raggruppamento tematico, NON è una traduzione del termine
- contextSentences: array di 1-3 frasi VERBATIM e COMPLETE dal testo dove il termine appare — essenziale per comprensione inductive
- difficulty: stima numerica 1=base, 2=intermedio, 3=avanzato — basati su frequenza nella lingua e complessità morfologica
- grammarNote: nota grammaticale BREVISSIMA solo se aggiunge informazione utile all'acquisizione (es. "participio pf. passivo", "abl. assoluto", "gen. partitivo") — null altrimenti

NON fornire MAI:
- Traduzioni italiane del termine
- Significati espliciti
- Glosse
- Spiegazioni del contenuto narrativo

Rispondi SOLO con un JSON array valido. Nessun testo prima o dopo.
Schema: [{"term":"...","forms":[],"semanticField":"...","contextSentences":["..."],"difficulty":1,"grammarNote":null}]`;

  const userMessage = `Corso: ${courseTitle || '(non specificato)'}
Lezione: ${lessonTitle}
Lingua: ${lang}

Testo del capitolo:
${text}`;

  const body = {
    contents: [{
      role: 'user',
      parts: [{ text: userMessage }]
    }],
    generationConfig: {
      temperature:      0.2,
      maxOutputTokens:  4000,
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
    throw new Error(`Gemini ${response.status}: ${err.substring(0, 200)}`);
  }

  const data    = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

  let parsed;
  try {
    parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed)) throw new Error('Risposta non è un array JSON');
  } catch (e) {
    throw new Error(`JSON parse failed: ${e.message} — raw: ${rawText.substring(0, 200)}`);
  }

  /* ── Validazione e normalizzazione ──────────────────────────────── */
  return parsed
    .filter(item =>
      item &&
      typeof item.term === 'string' && item.term.trim() &&
      typeof item.semanticField === 'string' &&
      Array.isArray(item.contextSentences) && item.contextSentences.length > 0
    )
    .map(item => ({
      term:             item.term.trim(),
      forms:            Array.isArray(item.forms) ? item.forms.filter(f => typeof f === 'string' && f.trim()) : [],
      semanticField:    (item.semanticField || '').trim(),
      contextSentences: item.contextSentences
        .filter(s => typeof s === 'string' && s.trim().length > 5)
        .slice(0, 3),
      difficulty:       typeof item.difficulty === 'number'
        ? Math.max(1, Math.min(3, Math.round(item.difficulty)))
        : 1,
      grammarNote:      item.grammarNote || null,
      imageUrl:         null,  // verrà generata da session.js al primo accesso studente
    }))
    .slice(0, maxTerms);
}

export default withAuth(handler);
