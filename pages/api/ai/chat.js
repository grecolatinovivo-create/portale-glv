/**
 * POST /api/ai/chat
 *
 * Endpoint per il Magistro — tutor AI contestuale alla lezione.
 * Provider: Google Gemini 2.0 Flash (gemini-2.0-flash)
 *
 * Il Magistro risponde da filologo classico: autorevole, preciso, colto.
 * Non traduce automaticamente — guida lo studente a inferire dal contesto.
 * Metodo induttivo-contestuale: la grammatica è riflessione a posteriori.
 *
 * Body atteso:
 *   { message: string, lessonId?: string, lessonTitle?: string,
 *     courseTitle?: string, history?: [{role, content}] }
 *
 * Response:
 *   { reply: string }
 */

import { withAuth } from '../../../lib/auth.js';
import { prisma }   from '../../../lib/prisma.js';

/* ── Gemini client (lazy init — solo se GEMINI_API_KEY è impostata) ── */
let _geminiClient = null;
function getGemini() {
  if (_geminiClient) return _geminiClient;
  if (!process.env.GEMINI_API_KEY) return null;
  // Importazione dinamica per evitare errori se l'SDK non è installato
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  _geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return _geminiClient;
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, lessonId, lessonTitle, courseTitle, history = [] } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Campo "message" obbligatorio.' });
  }

  /* ── 1. Fetch contesto lezione dal DB ──────────────────────────── */
  let lessonData = null;
  if (lessonId) {
    try {
      lessonData = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: {
          textFragment:       true,
          contentSummary:     true,
          keyVocabulary:      true,
          learningObjectives: true,
        }
      });
    } catch (e) {
      console.error('[ai/chat] DB fetch error:', e.message);
    }
  }

  /* ── 2. Integrazione Gemini ────────────────────────────────────── */
  const gemini = getGemini();
  if (gemini) {
    try {
      const systemPrompt = buildSystemPrompt(lessonTitle, courseTitle, lessonData);

      const model = gemini.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature:     0.7,
          maxOutputTokens: 1024,
        }
      });

      // Gemini usa { role: 'user'|'model', parts: [{text}] }
      // L'history dal frontend usa { role: 'user'|'assistant', content: string }
      const geminiHistory = history
        .slice(-10)  // max 10 messaggi precedenti
        .map(h => ({
          role:  h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        }));

      const chat   = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(message.trim());
      const reply  = result.response.text();

      return res.status(200).json({ reply });

    } catch (e) {
      console.error('[ai/chat] Gemini error:', e.message);
      // Fallback al mock se l'AI fallisce
      return res.status(200).json({
        reply: `Il Magistro non è al momento disponibile. Errore: ${e.message.substring(0, 80)}. Riprova tra qualche istante.`
      });
    }
  }

  /* ── 3. MOCK — attivo solo se GEMINI_API_KEY non è impostata ────
   *
   * Le risposte riflettono il tono e il metodo del Magistro.
   * Rimuovi questo blocco non appena GEMINI_API_KEY è configurata.
   */
  await new Promise(r => setTimeout(r, 900 + Math.random() * 600));

  const lessonCtx  = lessonTitle ? `"${lessonTitle}"` : 'questa lezione';
  const courseCtx  = courseTitle ? ` del corso "${courseTitle}"` : '';
  const msgLower   = message.toLowerCase();
  const hasText    = !!lessonData?.textFragment;
  const textSnippet = hasText
    ? lessonData.textFragment.substring(0, 120) + (lessonData.textFragment.length > 120 ? '…' : '')
    : null;

  let reply;

  if (msgLower.includes('traduz') || msgLower.includes('traduc')) {
    reply = hasText
      ? `Prima di tradurre, provo a chiederti una cosa: hai letto — "${textSnippet}" — e provato a cogliere il senso globale senza cercare ogni parola?\n\nLa traduzione parola per parola è spesso il percorso più lento. I lettori esperti costruiscono il senso nel testo, non attraverso di esso. Se hai un punto specifico che resiste, mostrami la frase — la analizziamo dal contesto narrativo.`
      : `La traduzione diretta è spesso il percorso più lento per chi vuole leggere davvero. Se hai un brano specifico da ${lessonCtx}${courseCtx}, mostrami le parole — le analizziamo insieme partendo dal contesto, non dalla traduzione meccanica.`;

  } else if (msgLower.includes('gramm') || msgLower.includes('caso') || msgLower.includes('declinaz')) {
    reply = `Le categorie grammaticali descrivono ciò che la lingua già fa — non lo insegnano.\n\nPartire da un testo concreto è sempre più efficace. ${hasText ? `Guarda questo frammento: "${textSnippet}". ` : `Hai un brano da ${lessonCtx}? `}Mostrami il punto che ti crea difficoltà e lo chiariremo dal contesto — non dalla regola astratta.\n\nQuale struttura specifica ti pone problemi?`;

  } else if (msgLower.includes('vocab') || msgLower.includes('parola') || msgLower.includes('signif')) {
    reply = hasText
      ? `Prima del vocabolario, prova questo: guarda la parola nel contesto — "${textSnippet}". Cosa ti dice il senso generale? Riesci a inferire qualcosa dalla radice?\n\nL'inferenza contestuale è la strategia del lettore autonomo. Se la parola ancora resiste, dammi il termine: ti spiego etimologia, paradigma e usi classici.`
      : `Hai una parola specifica da ${lessonCtx}${courseCtx}? Dammi il termine: ti spiego etimologia, paradigma completo e — cosa che i vocabolari spesso trascurano — le sfumature che variano da autore ad autore.`;

  } else {
    reply = `[Modalità demo — GEMINI_API_KEY non configurata]\n\nQuando il Magistro sarà attivo, risponderà in modo preciso e contestuale a ${lessonCtx}${courseCtx}, con un dettaglio inaspettato — un'etimologia, un parallelo letterario, una curiosità storica. Configura GEMINI_API_KEY su Vercel per attivare la risposta reale.`;
  }

  return res.status(200).json({ reply });
  /* ── /MOCK ────────────────────────────────────────────────────── */
}

/**
 * Costruisce il system prompt per il Magistro.
 * (DIDACTIC_SPEC_AI_PANEL.md §6.1, NEURO_SPEC_AI_PANEL.md §6)
 */
function buildSystemPrompt(lessonTitle, courseTitle, lessonData) {
  const isGreek = courseTitle && courseTitle.toLowerCase().includes('grec');
  const lang    = isGreek ? 'greco antico' : 'latino';

  const vocab = lessonData?.keyVocabulary
    ? (Array.isArray(lessonData.keyVocabulary)
        ? lessonData.keyVocabulary.map(v => `${v.term} = ${v.meaning}`).join('; ')
        : JSON.stringify(lessonData.keyVocabulary))
    : null;

  return `Sei il Magistro, il tutor di GrecoLatinoVivo — piattaforma di ${lang} che usa il metodo induttivo-contestuale.
Il tuo modello è il filologo classico brillante: preciso, colto, capace di sorprendere con connessioni inaspettate.
Non sei un chatbot generico — sei uno specialista che tratta la lingua come strumento vivo, non come oggetto museale.

CONTESTO DELLA LEZIONE ATTUALE:
- Corso: ${courseTitle || '(non specificato)'}
- Lezione: ${lessonTitle || '(non specificata)'}
${lessonData?.contentSummary ? `- Contenuto: ${lessonData.contentSummary}` : ''}
${lessonData?.textFragment ? `- Testo della lezione:\n${lessonData.textFragment}` : ''}
${vocab ? `- Vocabolario chiave: ${vocab}` : ''}
${lessonData?.learningObjectives ? `- Obiettivi: ${lessonData.learningObjectives}` : ''}

PRINCIPI METODOLOGICI — rispetta sempre:
1. Non tradurre automaticamente. Guida lo studente a inferire il significato dal contesto.
   Se chiede la traduzione di un testo, prima chiedi se ha provato a capirlo globalmente.
2. Quando spieghi una forma grammaticale, parti sempre dal testo, mai dalla regola astratta.
3. Se la domanda è vaga ("spiegami il congiuntivo"), chiedi in quale testo o frase lo ha incontrato.
4. Aggiungi sempre un dettaglio inaspettato: etimologia non ovvia, parallelo letterario,
   curiosità storica sulla lingua. Qualcosa che il target 35-60 anni colto non si aspetta.
5. Non usare mai emoji nelle risposte.
6. Usa terminologia tecnica corretta (ablativo assoluto, aoristo sigmativo, ottativo, ecc.)
   ma spiega il termine la prima volta che lo usi nella conversazione.
7. Mantieni le risposte a 3-5 paragrafi max.
8. Puoi usare la maieutica — rispondere con una domanda che guida — ma solo se pedagogicamente utile.
9. Se il testo della lezione è disponibile, riferisciti sempre ad esso. Non inventare brani.
10. Rispondi SEMPRE in italiano, salvo quando citi direttamente testi latini o greci.

PERSONA:
Filologo classico, professore universitario, 55 anni. Conosce Cicerone, Tucidide, i papiri
di Ossirinco e il dibattito sulla pronuncia ricostruita. Sa tutto ma non lo esibisce.
Cita le fonti con precisione: "Come nota Quintiliano nell'Institutio Oratoria, II.4.15..."
Non è mai condiscendente — tratta lo studente da pari intellettuale curioso.`;
}

export default withAuth(handler);
