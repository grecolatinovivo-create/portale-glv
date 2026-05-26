/**
 * POST /api/ai/chat
 *
 * Endpoint per il Magistro — tutor AI contestuale alla lezione.
 * (DIDACTIC_SPEC_AI_PANEL.md §6.1, NEURO_SPEC_AI_PANEL.md §6)
 *
 * Il Magistro risponde da filologo classico: autorevole, preciso, colto.
 * Non traduce automaticamente — guida lo studente a inferire dal contesto.
 * Usa il metodo induttivo-contestuale: la grammatica è riflessione a posteriori.
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

  /* ══ INTEGRAZIONE AI ════════════════════════════════════════════
   *
   * ── Claude (Anthropic) ──────────────────────────────────────
   * import Anthropic from '@anthropic-ai/sdk';
   * const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
   *
   * const systemPrompt = buildSystemPrompt(lessonTitle, courseTitle, lessonData);
   * const messages = [
   *   ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
   *   { role: 'user', content: message.trim() }
   * ];
   *
   * const response = await client.messages.create({
   *   model: 'claude-opus-4-6',
   *   max_tokens: 1024,
   *   system: systemPrompt,
   *   messages
   * });
   * return res.status(200).json({ reply: response.content[0].text });
   *
   * ── OpenAI ──────────────────────────────────────────────────
   * import OpenAI from 'openai';
   * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   *
   * const completion = await openai.chat.completions.create({
   *   model: 'gpt-4o',
   *   messages: [
   *     { role: 'system', content: buildSystemPrompt(lessonTitle, courseTitle, lessonData) },
   *     ...history.slice(-10),
   *     { role: 'user', content: message.trim() }
   *   ],
   *   max_tokens: 1024
   * });
   * return res.status(200).json({ reply: completion.choices[0].message.content });
   *
   * ══════════════════════════════════════════════════════════ */

  /* ── 2. MOCK — da sostituire con AI reale ───────────────────────
   *
   * Le risposte mock sono state aggiornate per riflettere il metodo
   * induttivo-contestuale e il tono del Magistro (NEURO_SPEC §6).
   */
  await new Promise(r => setTimeout(r, 900 + Math.random() * 600));

  const lessonCtx = lessonTitle ? `"${lessonTitle}"` : 'questa lezione';
  const courseCtx = courseTitle ? ` del corso "${courseTitle}"` : '';
  const msgLower  = message.toLowerCase();

  // Se c'è un textFragment, può essere usato in alcune risposte mock
  const hasText    = !!lessonData?.textFragment;
  const textSnippet = hasText
    ? lessonData.textFragment.substring(0, 120) + (lessonData.textFragment.length > 120 ? '…' : '')
    : null;

  let reply;

  if (msgLower.includes('traduz') || msgLower.includes('traduc')) {
    reply = hasText
      ? `Prima di tradurre, provo a chiederti una cosa: hai letto il testo — "${textSnippet}" — e provato a capire il senso globale senza cercare ogni parola?\n\nLa traduzione parola per parola è spesso il percorso più lento. I lettori esperti di latino e greco costruiscono il senso *nel testo*, non attraverso di esso. Se hai un passaggio specifico che resiste alla comprensione diretta, mostrami il punto — lo analizziamo insieme partendo dal contesto narrativo.`
      : `La traduzione diretta è spesso il percorso più lento. I lettori esperti di latino e greco costruiscono il senso nel testo senza mediazione.\n\nSe hai un passaggio specifico da ${lessonCtx}${courseCtx} che non capisci, mostrami le parole o la frase — le analizziamo insieme partendo dal contesto narrativo, non dalla traduzione meccanica.`;

  } else if (msgLower.includes('gramm') || msgLower.includes('caso') || msgLower.includes('declinaz')) {
    reply = `Buona domanda. Una precisazione metodologica che trovo utile: le categorie grammaticali (casi, declinazioni, modi) descrivono ciò che la lingua già fa — non lo insegnano.\n\nPartire sempre da un testo concreto è più efficace. ${hasText ? `Per esempio, guarda questo frammento dalla lezione: "${textSnippet}". ` : `Hai un brano specifico da ${lessonCtx}? `}Mostrami dove la struttura grammaticale ti risulta opaca e la chiariremo a partire da quel contesto, non dalla regola astratta.\n\nQuale aspetto specifico ti pone difficoltà?`;

  } else if (msgLower.includes('vocab') || msgLower.includes('parola') || msgLower.includes('lemma') || msgLower.includes('signif')) {
    reply = hasText
      ? `Prima di consultare il vocabolario, prova questo: guarda la parola nel contesto — "${textSnippet}". Cosa ti dice il senso generale della frase? Riesci a inferire qualcosa dalla radice o da parole simili in italiano?\n\nL'inferenza contestuale è la strategia del lettore autonomo. Se dopo questo tentativo la parola ancora resiste, dammi il termine e te ne spiego l'etimologia, il paradigma e gli usi classici principali.`
      : `Hai una parola specifica da ${lessonCtx}${courseCtx} che vuoi approfondire? Dammi il termine e ti spiego: etimologia, paradigma completo, usi classici e — cosa che i vocabolari spesso trascurano — le sfumature di significato che variano da autore ad autore.`;

  } else if (msgLower.includes('pronuncia') || msgLower.includes('suon') || msgLower.includes('legger')) {
    const isGreek = courseTitle && courseTitle.toLowerCase().includes('grec');
    reply = isGreek
      ? `La pronuncia del greco antico è una delle questioni più affascinanti — e più dibattute — della filologia classica. La pronuncia ricostruita (Erasmiana) differisce notevolmente dalla pronuncia moderna greca.\n\nPer il greco attico del V secolo a.C.: le vocali lunghe e brevi erano quantitativamente distinte (ā vs a), non qualitativamente come in italiano. L'accento era prevalentemente melodico (tonico), non dinamico. La η si pronunciava come [eː] lungo, non come [i] moderno. Se hai un testo specifico da ${lessonCtx}, possiamo lavorare sulla scansione delle singole parole.`
      : `La pronuncia del latino classico ricostruita — quella del I secolo a.C. — è molto diversa dalla pronuncia tradizionale italiana o ecclesiastica.\n\nAlcune differenze chiave: la c è sempre occlusiva velare [k], mai [tʃ]. La v si pronunciava [w], non [v]. Le vocali lunghe e brevi erano quantitativamente distinte. Per ${lessonCtx}, possiamo analizzare la prosodia di un brano specifico — è un ottimo modo per interiorizzare il ritmo della lingua.`;

  } else {
    reply = hasText
      ? `Interessante. Lasciami rispondere partendo dal testo della lezione: "${textSnippet}".\n\nQuesta è una risposta di esempio — il Magistro vero risponderà in modo molto più preciso e specifico, attingendo direttamente ai contenuti di ${lessonCtx}${courseCtx}. Quando l'integrazione AI sarà attiva, ogni risposta includerà un dettaglio inaspettato — un'etimologia, un parallelo letterario, una curiosità storica che illumina il testo da un'angolazione nuova. Continua pure a fare domande: mi aiuta a capire cosa ti interessa approfondire.`
      : `Capito. Questa è una risposta di esempio — il Magistro vero risponderà in modo preciso e contestuale alla lezione ${lessonCtx}${courseCtx}.\n\nQuando l'integrazione AI sarà attiva, ogni risposta includerà un elemento inaspettato: un'etimologia, un parallelo letterario o una curiosità storica che nessun manuale cita. Il Magistro non è Wikipedia — è un filologo che sa cosa vale la pena notare. Hai altre domande su questa lezione?`;
  }

  return res.status(200).json({ reply });
  /* ── /MOCK ────────────────────────────────────────────────────── */
}

/**
 * Costruisce il system prompt per il Magistro.
 * (DIDACTIC_SPEC_AI_PANEL.md §6.1, NEURO_SPEC_AI_PANEL.md §6)
 *
 * @param {string|undefined} lessonTitle
 * @param {string|undefined} courseTitle
 * @param {object|null}      lessonData  — { textFragment, contentSummary, keyVocabulary, learningObjectives }
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
${lessonData?.textFragment ? `- Testo della lezione: ${lessonData.textFragment}` : ''}
${vocab ? `- Vocabolario chiave: ${vocab}` : ''}
${lessonData?.learningObjectives ? `- Obiettivi: ${lessonData.learningObjectives}` : ''}

PRINCIPI METODOLOGICI — rispetta sempre:
1. Non tradurre automaticamente. Guida lo studente a inferire il significato dal contesto.
   Se chiede la traduzione di un testo, prima chiedi se ha provato a capirlo in modo globale.
2. Quando spieghi una forma grammaticale, parti sempre dal testo, mai dalla regola astratta.
   Es: "In questa frase, '-um' segnala il complemento oggetto — guarda come Marcus magistr-um saluta."
3. Se lo studente fa una domanda vaga ("spiegami il congiuntivo"), chiedi prima:
   "In quale contesto — su quale testo o frase — ti sei imbattuto nel congiuntivo?"
4. Aggiungi sempre un dettaglio inaspettato: etimologia non ovvia, parallelo letterario,
   curiosità storica sulla lingua, connessione con l'italiano o con altra lingua nota.
   Qualcosa che il target 35-60 anni colto non si aspetta e non troverebbe altrove.
5. Non usare mai emoji nelle risposte — questo pubblico le troverebbe infantili.
6. Usa terminologia tecnica corretta (ablativo assoluto, aoristo sigmativo, ottativo, ecc.)
   ma spiega il termine la prima volta che lo usi nella conversazione.
7. Mantieni le risposte a 3-5 paragrafi max — muri di testo fanno abbandonare la lettura.
8. Puoi usare la maieutica: a volte rispondi con una domanda che guida verso la risposta,
   ma solo se è pedagogicamente utile e non sembri evasivo o pigro.
9. Se il testo della lezione (textFragment) è disponibile, riferisciti sempre ad esso.
   Non inventare brani che non ci sono.
10. Rispondi SEMPRE in italiano, salvo quando citi direttamente testi latini o greci.

PERSONA DEL MAGISTRO:
Filologo classico, professore universitario, 55 anni. Conosce Cicerone, Tucidide,
i papiri di Ossirinco e il dibattito sulla pronuncia ricostruita. Sa tutto ma non lo esibisce.
Risponde sempre con un dettaglio che illumina il quadro più ampio.
Cita fonti con precisione: "Come nota Quintiliano nell'Institutio Oratoria, II.4.15..."
Non è mai condiscendente — tratta lo studente da pari intellettuale curioso.
Non usa la maieutica in modo meccanico — solo quando è genuinamente utile.`;
}

export default withAuth(handler);
