/**
 * POST /api/ai/chat
 *
 * Endpoint per il Tutor AI — chat contestuale alla lezione.
 *
 * STATO ATTUALE: risposta mock (struttura pronta per integrazione AI).
 *
 * Per integrare Claude (Anthropic):
 *   1. npm install @anthropic-ai/sdk
 *   2. Imposta ANTHROPIC_API_KEY in .env
 *   3. Sostituisce il blocco "MOCK" con la chiamata SDK come indicato nei commenti.
 *
 * Per integrare OpenAI:
 *   1. npm install openai
 *   2. Imposta OPENAI_API_KEY in .env
 *   3. Sostituisce il blocco "MOCK" con la chiamata SDK.
 *
 * Body atteso:
 *   { message: string, lessonId?: string, lessonTitle?: string,
 *     courseTitle?: string, history?: [{role, content}] }
 *
 * Response:
 *   { reply: string }
 */

import { withAuth } from '../../../lib/auth.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, lessonId, lessonTitle, courseTitle, history = [] } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Campo "message" obbligatorio.' });
  }

  /* ══ INTEGRAZIONE AI ════════════════════════════════════════════
   *
   * ── Claude (Anthropic) ──────────────────────────────────────
   * import Anthropic from '@anthropic-ai/sdk';
   * const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
   *
   * const systemPrompt = buildSystemPrompt(lessonTitle, courseTitle);
   * const messages = [
   *   ...history.map(h => ({ role: h.role, content: h.content })),
   *   { role: 'user', content: message.trim() }
   * ];
   *
   * const response = await client.messages.create({
   *   model: 'claude-opus-4-6',
   *   max_tokens: 1024,
   *   system: systemPrompt,
   *   messages
   * });
   * const reply = response.content[0].text;
   * return res.status(200).json({ reply });
   *
   * ── OpenAI ──────────────────────────────────────────────────
   * import OpenAI from 'openai';
   * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   *
   * const completion = await openai.chat.completions.create({
   *   model: 'gpt-4o',
   *   messages: [
   *     { role: 'system', content: buildSystemPrompt(lessonTitle, courseTitle) },
   *     ...history,
   *     { role: 'user', content: message.trim() }
   *   ],
   *   max_tokens: 1024
   * });
   * const reply = completion.choices[0].message.content;
   * return res.status(200).json({ reply });
   *
   * ══════════════════════════════════════════════════════════ */

  /* ── MOCK — da sostituire con integrazione AI reale ─────────── */
  await new Promise(r => setTimeout(r, 900 + Math.random() * 600));

  const lessonCtx  = lessonTitle  ? `"${lessonTitle}"` : 'questa lezione';
  const courseCtx  = courseTitle  ? ` del corso "${courseTitle}"` : '';
  const msgLower   = message.toLowerCase();

  let reply;
  if (msgLower.includes('traduz') || msgLower.includes('traduc')) {
    reply = `Ottima domanda sulla traduzione! Per tradurre correttamente dal latino o greco antico, ti consiglio di:\n\n1. Identificare il verbo principale e il suo soggetto\n2. Analizzare tutti i casi nominali\n3. Poi costruire la frase in italiano seguendo il senso\n\nSe hai un testo specifico da ${lessonCtx}${courseCtx}, incollalo qui e lo analizziamo insieme.`;
  } else if (msgLower.includes('gramm') || msgLower.includes('caso') || msgLower.includes('declinaz')) {
    reply = `Sulla grammatica di ${lessonCtx}${courseCtx}: le declinazioni latine e greche seguono schemi precisi che, una volta interiorizzati, diventano automatici.\n\nQuale aspetto grammaticale ti crea più difficoltà? Posso spiegarti con esempi tratti direttamente dal corso.`;
  } else if (msgLower.includes('vocab') || msgLower.includes('parola') || msgLower.includes('lemma')) {
    reply = `Il vocabolario di ${lessonCtx} è fondamentale! Ti consiglio di usare la funzione "Aggiungi al vocabolario" per salvare le parole che incontri.\n\nHai una parola specifica che vuoi approfondire? Dammi il termine e ti spiego etimologia, declinazione/coniugazione e uso contestuale.`;
  } else {
    reply = `Capito! Riguardo a ${lessonCtx}${courseCtx}: questa è una risposta di esempio — l'AI reale risponderà in modo contestuale al contenuto specifico della lezione.\n\nSei su una demo: quando l'integrazione AI sarà attiva, riceverai risposte precise basate sui contenuti del corso GrecoLatinoVivo. Continua pure a fare domande!`;
  }

  return res.status(200).json({ reply });
  /* ── /MOCK ────────────────────────────────────────────────── */
}

/* Costruisce il system prompt per il tutor — usato dall'integrazione AI reale */
function buildSystemPrompt(lessonTitle, courseTitle) {
  return `Sei un tutor esperto di lingue classiche per la piattaforma GrecoLatinoVivo.
Il tuo ruolo è aiutare gli studenti a comprendere i contenuti ${courseTitle ? `del corso "${courseTitle}"` : 'dei corsi di Latino e Greco Antico'}.
${lessonTitle ? `Lo studente sta seguendo la lezione: "${lessonTitle}".` : ''}

Linee guida:
- Rispondi in italiano, con un tono professionale ma accessibile
- Sii specifico e usa esempi concreti tratti dal testo/lezione quando possibile
- Per le analisi grammaticali, usa la terminologia della grammatica tradizionale italiana
- Per i testi greci, usa caratteri Unicode corretti (non traslitterazione salvo richiesta)
- Mantieni le risposte concise (max 250 parole) salvo richiesta di approfondimento
- Se non conosci qualcosa di specifico del corso, dillo onestamente`;
}

export default withAuth(handler);
