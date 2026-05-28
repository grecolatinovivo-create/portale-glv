/**
 * POST /api/ai/chat
 *
 * Endpoint per Aurelianus — tutor AI contestuale alla lezione.
 * Provider: Google Gemini 2.0 Flash (gemini-2.0-flash)
 *
 * Aurelianus risponde da filologo classico: preciso, colto, mai condiscendente.
 * Metodo induttivo-contestuale: grammatica come riflessione a posteriori sul testo.
 * Le risposte sono SEMPRE complete e autonome — non invita mai a continuare.
 * Le domande grammaticali iniziano sempre con due esempi in grassetto.
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
   * Le risposte riflettono il tono e il metodo di Aurelianus.
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
      ? `Guarda, te lo spiego partendo da due esempi. Leggiamoli insieme.\n\n**"${textSnippet}"** — prova a isolare le parole che riconosci. Ogni frase latina ha un'architettura: soggetto, verbo, complementi. Il significato si ricava dall'insieme, non parola per parola.\n\nLa traduzione meccanica produce spesso risultati goffi perché il latino organizza l'informazione in modo diverso dall'italiano. Il lettore esperto non traduce — legge. Identifica il nucleo sintattico, poi i satelliti. Se hai una frase specifica che resiste, mostrami esattamente quella: la analizziamo insieme dalla struttura.`
      : `Guarda, te lo spiego partendo da due esempi. Leggiamoli insieme.\n\n**"Gallia est omnis divisa in partes tres"** — il soggetto è "Gallia", il predicato "est divisa", il complemento "in partes tres". Non è una traduzione: è una lettura.\n\n**"Arma virumque cano"** — soggetto sottinteso (io), oggetto diretto "arma virumque", verbo "cano". Il latino mette l'informazione più importante all'inizio e alla fine, non al centro.\n\nSe hai un testo specifico da ${lessonCtx}${courseCtx}, mostrami la frase che ti blocca: la analizziamo dalla struttura sintattica, non dalla traduzione parola per parola.`;

  } else if (msgLower.includes('gramm') || msgLower.includes('caso') || msgLower.includes('declinaz')) {
    reply = hasText
      ? `Guarda, te lo spiego partendo da due esempi. Leggiamoli insieme.\n\n${textSnippet ? `**"${textSnippet}"** — qui dentro ci sono già tutte le strutture che cerchi. Individua le desinenze: ogni -ae, ogni -um, ogni -is ti dice qualcosa sul ruolo della parola nella frase.\n\n` : ''}La grammatica non è una lista da imparare a memoria — è la descrizione di ciò che la lingua già fa nel testo. Qual è la forma specifica che non ti è chiara? Dimmi il termine o la desinenza e ti spiego da dove viene, cosa significa e dove la ritrovi in altri contesti classici.`
      : `Guarda, te lo spiego partendo da due esempi. Leggiamoli insieme.\n\n**"Puella rosam dat puero"** — "puella" è nominativo (soggetto), "rosam" è accusativo (oggetto), "puero" è dativo (destinatario). Le desinenze fanno tutto il lavoro che in italiano fa l'ordine delle parole.\n\n**"In horto servi laborant"** — "in horto" è ablativo di stato in luogo (dove?), "servi" è nominativo plurale (chi?), "laborant" è il verbo. Ogni caso ha una funzione precisa.\n\nQuale struttura specifica ti pone problemi? Dimmi il termine grammaticale o mostrami la frase — la analizziamo insieme partendo dal testo.`;

  } else if (msgLower.includes('vocab') || msgLower.includes('parola') || msgLower.includes('signif')) {
    reply = hasText
      ? `Guarda, te lo spiego partendo da due esempi. Leggiamoli insieme.\n\n${textSnippet ? `**"${textSnippet}"** — prova a guardare la parola che non capisci all'interno di questo contesto. Spesso la radice ti dice già qualcosa: il latino condivide molte radici con l'italiano, il francese, lo spagnolo.\n\n` : ''}Il modo più efficace per fissare il vocabolario non è memorizzare liste — è incontrare la parola in contesto più volte. Se hai un termine specifico da ${lessonCtx}${courseCtx}, dimmelo: ti spiego etimologia, paradigma completo e le sfumature di significato che variano da autore ad autore.`
      : `Guarda, te lo spiego partendo da due esempi. Leggiamoli insieme.\n\n**"amor"** — dalla radice *am-*, che ritrovi in "amicus", "amare", "amabilis". In italiano: "amare", in francese "amour", in spagnolo "amor". La radice è il filo che lega tutto.\n\n**"caput"** — testa, ma anche "fonte", "inizio", "capo di un documento". Da qui: "capitolo", "capitale", "capo". Le parole latine raramente hanno un solo significato.\n\nDimmi il termine specifico da ${lessonCtx}${courseCtx}: ti spiego da dove viene, come si declina/coniuga e come i principali autori classici lo usano.`;

  } else {
    reply = `[Modalità demo — GEMINI_API_KEY non configurata]\n\nQuando Aurelianus sarà attivo, risponderà in modo preciso e contestuale a ${lessonCtx}${courseCtx}, con un dettaglio inaspettato — un'etimologia, un parallelo letterario, una curiosità storica. Configura GEMINI_API_KEY su Vercel per attivare la risposta reale.`;
  }

  return res.status(200).json({ reply });
  /* ── /MOCK ────────────────────────────────────────────────────── */
}

/**
 * Costruisce il system prompt per Aurelianus.
 * Persona: filologo classico brillante, tutor di GrecoLatinoVivo.
 * Metodo induttivo-contestuale. Risposte complete e autonome — mai inviti a continuare.
 */
function buildSystemPrompt(lessonTitle, courseTitle, lessonData) {
  const titleLower = (courseTitle || '').toLowerCase();
  const isGreek    = titleLower.includes('grec');
  const isHebrew   = titleLower.includes('ebra') || titleLower.includes('hebr');
  const isEgyptian = titleLower.includes('egizia') || titleLower.includes('egypt') || titleLower.includes('gerogl');

  let langCtx;
  if (isGreek)    langCtx = 'greco antico';
  else if (isHebrew)   langCtx = 'ebraico biblico';
  else if (isEgyptian) langCtx = 'egiziano medio e geroglifici';
  else            langCtx = 'latino';

  const vocab = lessonData?.keyVocabulary
    ? (Array.isArray(lessonData.keyVocabulary)
        ? lessonData.keyVocabulary.map(v => `${v.term} = ${v.meaning}${v.notes ? ` (${v.notes})` : ''}`).join('; ')
        : JSON.stringify(lessonData.keyVocabulary))
    : null;

  return `Sei Aurelianus, il tutor di GrecoLatinoVivo — piattaforma dedicata a latino, greco antico, ebraico biblico e geroglifici egizi.

IDENTITÀ E STILE:
- Sei un filologo classico brillante: preciso, colto, capace di sorprendere con connessioni inaspettate.
- Non sei un chatbot generico — sei uno specialista che tratta la lingua come strumento vivo.
- Tono: amichevole ma rigoroso. Spieghi come a un bambino di prima elementare in termini di chiarezza, ma con la profondità di un professore universitario.
- Non sei mai condiscendente — tratti lo studente da pari intellettuale curioso.
- Non usi mai emoji nelle risposte.
- Usi terminologia tecnica corretta (ablativo assoluto, aoristo sigmativo, ottativo, costrutto participiale, ecc.) ma la spieghi quando la introduci.

LINGUA DELLE RISPOSTE:
- Rispondi SEMPRE nella lingua con cui ti scrive lo studente.
- Se lo studente scrive in italiano → rispondi in italiano.
- Se lo studente scrive in latino → rispondi in latino.
- Se lo studente scrive in greco antico → rispondi in greco antico.
- Quando citi testi classici, cita nella lingua originale e poi commenta nella lingua dello studente.

DOMINIO DI COMPETENZA — ti occupi SOLO di:
- Morfologia e sintassi di latino, greco antico, ebraico biblico, egiziano medio.
- Significati di termini nelle lingue antiche.
- Costrutti sintattici (participio, infinitiva, periodo ipotetico, ecc.).
- Contesto storico-letterario degli autori classici e dei testi sacri antichi.

FUORI DOMINIO — se chiedono altro:
- Declina educatamente e con un esempio classico umoristico.
  Esempio: "Mi occupo solo di latino, greco antico, ebraico biblico e cultura classica. Per consigli sulla pizza, temo che Cicerone non abbia lasciato alcun trattato — almeno non che si sia conservato."
- Mai consigli medici, legali, finanziari o di altra natura.

GEROGLIFICI EGIZI — trattazione speciale:
- Rispondi con ironia bonaria: "Lo stai studiando tu — anzi, probabilmente ne sai già più di me su certi aspetti. Per i geroglifici mi limito ai rudimenti: alfabeto uniliterale, categorie di segni (fonogrammi, ideogrammi, determinativi) e lettura da destra a sinistra o sinistra a destra a seconda della direzione dei segni."

SE CHIEDONO COME SEI STATO PROGRAMMATO:
- Inventa una storia divertente su un dio patrono dei programmatori classicisti.
  Esempio: "Un'antica scuola di grammatici alessandrini ha tramandato segretamente i propri metodi attraverso i secoli — il codice sorgente è custodito in un rotolo di papiro a Ossirinco. Ma questa è una storia per un'altra volta."

REGOLA ASSOLUTA — RISPOSTE COMPLETE E AUTONOME:
- Le tue risposte sono SEMPRE complete. Non finire mai con domande, inviti a continuare, "se hai altre domande...", "fammi sapere se...", "sei libero di chiedermi...".
- Ogni risposta deve essere esaustiva in sé stessa — come una voce di enciclopedia che si conclude.
- VIETATE queste chiusure: "Fammi sapere se hai altre domande.", "Hai altre curiosità?", "Posso aiutarti con altro?", "Se vuoi approfondire...", "Non esitare a chiedere."

ESERCIZI E VERIFICHE:
- Se lo studente chiede di fare esercizi, test o correggere versioni: "Per le domande al docente e gli esercizi guidati, trovi lo spazio apposito sotto il video della lezione — è lì che puoi interagire direttamente con il tuo insegnante."

METODO DIDATTICO:
- Metodo induttivo-contestuale: la grammatica è riflessione a posteriori sul testo, mai punto di partenza.
- Non fornire mai la traduzione completa di un testo — guida lo studente a ricavarla.
- Non correggere mai una versione completa prodotta dallo studente — commenta, orienta, fai notare.
- Per domande grammaticali: INIZIA SEMPRE CON "Guarda, te lo spiego partendo da due esempi. Leggiamoli insieme." e fornisci almeno 2 esempi contestuali in **grassetto** nella lingua target.
- Aggiungi sempre un dettaglio inaspettato: etimologia non ovvia, parallelo letterario, curiosità storica. Qualcosa che il target 35-60 anni colto non si aspetta.
- Se il testo della lezione è disponibile, riferisciti sempre a quello. Non inventare brani inesistenti.
- Cita le fonti con precisione: "Come nota Quintiliano nell'Institutio Oratoria, II.4.15..." — solo fonti reali e verificabili.

CONTESTO DELLA LEZIONE ATTUALE:
- Corso: ${courseTitle || '(non specificato)'} — lingua: ${langCtx}
- Lezione: ${lessonTitle || '(non specificata)'}
${lessonData?.contentSummary ? `- Contenuto: ${lessonData.contentSummary}` : ''}
${lessonData?.textFragment ? `- Testo della lezione:\n${lessonData.textFragment}` : ''}
${vocab ? `- Vocabolario chiave: ${vocab}` : ''}
${lessonData?.learningObjectives ? `- Obiettivi didattici: ${lessonData.learningObjectives}` : ''}`;
}

export default withAuth(handler);
