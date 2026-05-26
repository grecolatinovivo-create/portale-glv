/**
 * POST /api/ai/quiz
 *
 * Endpoint per la generazione di quiz contestuali alla lezione.
 *
 * STATO ATTUALE: genera domande mock plausibili per lingue classiche.
 * Struttura già pronta per integrazione con Claude o OpenAI (vedi commenti).
 *
 * Body atteso:
 *   { lessonId?: string, lessonTitle?: string, courseTitle?: string, count?: number }
 *
 * Response:
 *   { questions: Array<{
 *       question: string,
 *       options: string[],
 *       correctIndex: number,
 *       explanation: string
 *     }>
 *   }
 */

import { withAuth } from '../../../lib/auth.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lessonId, lessonTitle, courseTitle, count = 4 } = req.body || {};
  const numQuestions = Math.min(Math.max(parseInt(count) || 4, 2), 6);

  /* ══ INTEGRAZIONE AI ════════════════════════════════════════════
   *
   * ── Claude (Anthropic) ──────────────────────────────────────
   * import Anthropic from '@anthropic-ai/sdk';
   * const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
   *
   * const prompt = buildQuizPrompt(lessonTitle, courseTitle, numQuestions);
   * const response = await client.messages.create({
   *   model: 'claude-opus-4-6',
   *   max_tokens: 2048,
   *   messages: [{ role: 'user', content: prompt }]
   * });
   * const raw = response.content[0].text;
   * const questions = parseQuestionsFromJson(raw);
   * return res.status(200).json({ questions });
   *
   * ── OpenAI ──────────────────────────────────────────────────
   * import OpenAI from 'openai';
   * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   *
   * const completion = await openai.chat.completions.create({
   *   model: 'gpt-4o',
   *   response_format: { type: 'json_object' },
   *   messages: [{ role: 'user', content: buildQuizPrompt(lessonTitle, courseTitle, numQuestions) }]
   * });
   * const data = JSON.parse(completion.choices[0].message.content);
   * return res.status(200).json({ questions: data.questions });
   *
   * ══════════════════════════════════════════════════════════ */

  /* ── MOCK — bank di domande di esempio per lingue classiche ── */
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

  const isGreek  = courseTitle && courseTitle.toLowerCase().includes('grec');
  const isLatino = !isGreek;

  const questionBank = isGreek ? GREEK_QUESTIONS : LATIN_QUESTIONS;

  /* Mescola e prende N domande */
  const shuffled = questionBank.sort(() => Math.random() - 0.5);
  const questions = shuffled.slice(0, numQuestions);

  return res.status(200).json({ questions });
  /* ── /MOCK ─────────────────────────────────────────────────── */
}

/* ── Prompt per la generazione AI reale ─────────────────────────── */
function buildQuizPrompt(lessonTitle, courseTitle, count) {
  return `Sei un esperto di lingue classiche. Crea ${count} domande a scelta multipla per verificare la comprensione ${
    lessonTitle ? `della lezione "${lessonTitle}"` : 'del corso'
  }${courseTitle ? ` di "${courseTitle}"` : ''}.

Rispondi SOLO con un JSON valido in questo formato esatto:
{
  "questions": [
    {
      "question": "Testo della domanda",
      "options": ["Risposta A", "Risposta B", "Risposta C", "Risposta D"],
      "correctIndex": 0,
      "explanation": "Breve spiegazione della risposta corretta (1-2 frasi)"
    }
  ]
}

Regole:
- Domande in italiano, contenuti in latino/greco dove pertinente
- 4 opzioni per ogni domanda, una sola corretta
- correctIndex è l'indice 0-based dell'opzione corretta
- Varia la difficoltà: alcune facili, alcune medie, una difficile
- Le domande devono essere specifiche e didatticamente utili`;
}

function parseQuestionsFromJson(raw) {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return [];
    const data = JSON.parse(match[0]);
    return Array.isArray(data.questions) ? data.questions : [];
  } catch {
    return [];
  }
}

/* ── Mock questions bank ─────────────────────────────────────────── */
const LATIN_QUESTIONS = [
  {
    question: 'Quale caso latino indica il complemento di mezzo o strumento?',
    options: ['Ablativo', 'Dativo', 'Genitivo', 'Accusativo'],
    correctIndex: 0,
    explanation: 'L\'ablativo strumentale indica il mezzo con cui si compie un\'azione, senza preposizione in latino (es. gladio — "con la spada").'
  },
  {
    question: 'La desinenza -ārum appartiene a quale caso e declinazione?',
    options: ['Genitivo plurale, I declinazione', 'Ablativo plurale, II declinazione', 'Nominativo plurale, I declinazione', 'Dativo singolare, I declinazione'],
    correctIndex: 0,
    explanation: '-ārum è la desinenza del genitivo plurale della I declinazione (es. rosarum — "delle rose").'
  },
  {
    question: 'In latino classico, quale forma del verbo "esse" corrisponde alla 3ª persona plurale del presente indicativo?',
    options: ['sunt', 'est', 'esse', 'erant'],
    correctIndex: 0,
    explanation: '"Sunt" è la 3ª persona plurale del presente indicativo di "esse" (essere). "Est" è la 3ª singolare, "erant" è l\'imperfetto.'
  },
  {
    question: 'Qual è la funzione del gerundivo latino?',
    options: ['Esprimere necessità o obbligo', 'Indicare il tempo passato', 'Formare il futuro', 'Esprimere una condizione'],
    correctIndex: 0,
    explanation: 'Il gerundivo (o participio futuro passivo) esprime necessità: "Liber legendus est" = "Il libro deve essere letto".'
  },
  {
    question: '"Amo, amas, amat" appartiene a quale coniugazione verbale?',
    options: ['I coniugazione (tema in -ā)', 'II coniugazione (tema in -ē)', 'III coniugazione (tema in consonante)', 'IV coniugazione (tema in -ī)'],
    correctIndex: 0,
    explanation: '"Amare" è il verbo modello della I coniugazione latina, con tema in -ā. Il suo paradigma completo è amo, amas, amat, amamus, amatis, amant.'
  },
  {
    question: 'Quale figura retorica consiste nella ripetizione di una parola all\'inizio di versi o frasi consecutive?',
    options: ['Anafora', 'Metafora', 'Iperbole', 'Chiasmo'],
    correctIndex: 0,
    explanation: 'L\'anafora è la ripetizione della stessa parola o gruppo di parole all\'inizio di più proposizioni o versi consecutivi.'
  }
];

const GREEK_QUESTIONS = [
  {
    question: 'In greco antico, quale caso indica il soggetto della frase?',
    options: ['Nominativo', 'Accusativo', 'Genitivo', 'Dativo'],
    correctIndex: 0,
    explanation: 'Il nominativo è il caso del soggetto in greco antico, come in latino. Il verbo concorda con il soggetto al nominativo.'
  },
  {
    question: 'L\'articolo determinativo greco maschile singolare al nominativo è:',
    options: ['ὁ', 'τό', 'ἡ', 'τοῦ'],
    correctIndex: 0,
    explanation: 'ὁ (ho) è l\'articolo determinativo maschile singolare al nominativo. ἡ è femminile, τό è neutro, τοῦ è maschile al genitivo.'
  },
  {
    question: 'Come si chiama la lettera greca "θ"?',
    options: ['Theta', 'Delta', 'Phi', 'Chi'],
    correctIndex: 0,
    explanation: 'La lettera "θ" si chiama theta e rappresenta il suono fricativo dentale sordo /θ/, come la "th" inglese in "think".'
  },
  {
    question: 'Il verbo greco λύω significa:',
    options: ['Sciogliere, liberare', 'Correre', 'Scrivere', 'Vedere'],
    correctIndex: 0,
    explanation: 'Λύω (lýō) significa "sciogliere, liberare". È uno dei verbi modello più usati nella didattica del greco antico per le coniugazioni.'
  },
  {
    question: 'L\'ottativo greco esprime principalmente:',
    options: ['Desiderio o possibilità', 'Certezza assoluta', 'Azione compiuta', 'Ordine diretto'],
    correctIndex: 0,
    explanation: 'L\'ottativo è il modo del desiderio e della possibilità in greco antico. Nelle proposizioni principali esprime spesso un augurio o una speranza.'
  },
  {
    question: 'Quale spirito si mette sulle parole greche che iniziano con vocale e non hanno aspirazione?',
    options: ['Spirito dolce (᾿)', 'Spirito aspro (῾)', 'Entrambi', 'Nessuno spirito'],
    correctIndex: 0,
    explanation: 'Lo spirito dolce (᾿, psile) si mette sulle vocali iniziali che non sono aspirate. Lo spirito aspro (῾, daseía) indica invece la presenza di aspirazione (/h/).'
  }
];

export default withAuth(handler);
