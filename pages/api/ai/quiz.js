/**
 * POST /api/ai/quiz
 *
 * Genera esercizi contestuali alla lezione — metodo induttivo-contestuale.
 * (DIDACTIC_SPEC_AI_PANEL.md §4 e §6.2)
 *
 * Gli esercizi emergono dal testo della lezione (textFragment), non da
 * regole grammaticali astratte. Priorità: comprensione → riconoscimento
 * semantico → inferenza → riflessione metalinguistica.
 *
 * Body atteso:
 *   { lessonId?: string, lessonTitle?: string, courseTitle?: string, count?: number }
 *
 * Response:
 *   { questions: Array<{
 *       type: string,
 *       question: string,
 *       context?: string,
 *       options: string[],
 *       correctIndex: number,
 *       explanation: string
 *     }>
 *   }
 */

import { withAuth }  from '../../../lib/auth.js';
import { prisma }    from '../../../lib/prisma.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lessonId, lessonTitle, courseTitle, count = 4 } = req.body || {};
  const numQuestions = Math.min(Math.max(parseInt(count) || 4, 2), 6);

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
      console.error('[ai/quiz] DB fetch error:', e.message);
      // Non bloccare — procedi con contesto parziale
    }
  }

  /* ══ INTEGRAZIONE AI ════════════════════════════════════════════
   *
   * ── Claude (Anthropic) ──────────────────────────────────────
   * import Anthropic from '@anthropic-ai/sdk';
   * const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
   *
   * const prompt = buildQuizPrompt(lessonTitle, courseTitle, numQuestions, lessonData);
   * const response = await client.messages.create({
   *   model: 'claude-opus-4-6',
   *   max_tokens: 2048,
   *   messages: [{ role: 'user', content: prompt }]
   * });
   * const questions = parseQuestionsFromJson(response.content[0].text);
   * return res.status(200).json({ questions });
   *
   * ── OpenAI ──────────────────────────────────────────────────
   * import OpenAI from 'openai';
   * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   *
   * const completion = await openai.chat.completions.create({
   *   model: 'gpt-4o',
   *   response_format: { type: 'json_object' },
   *   messages: [{ role: 'user', content: buildQuizPrompt(lessonTitle, courseTitle, numQuestions, lessonData) }]
   * });
   * const data = JSON.parse(completion.choices[0].message.content);
   * return res.status(200).json({ questions: data.questions ?? [] });
   *
   * ══════════════════════════════════════════════════════════ */

  /* ── 2. MOCK — domande plausibili per lingue classiche ─────────
   *
   * Queste domande sono placeholder DIDATTICAMENTE CORRETTI:
   * seguono il metodo induttivo-contestuale (comprensione in contesto,
   * non grammatica astratta come prima attività).
   * Sostituire con integrazione AI reale quando il servizio sarà scelto.
   */
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

  const isGreek = courseTitle && courseTitle.toLowerCase().includes('grec');

  // Se la lezione ha un textFragment reale, genera mock contestuali ad esso.
  // Altrimenti usa la bank generica.
  if (lessonData?.textFragment) {
    const questions = buildContextualMock(
      lessonData.textFragment,
      lessonData.keyVocabulary,
      isGreek,
      numQuestions
    );
    return res.status(200).json({ questions });
  }

  // Fallback: bank generica
  const bank     = isGreek ? GREEK_QUESTIONS : LATIN_QUESTIONS;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return res.status(200).json({ questions: shuffled.slice(0, numQuestions) });
  /* ── /MOCK ─────────────────────────────────────────────────── */
}

/* ── Costruisce il prompt per la generazione AI reale ─────────────── */
function buildQuizPrompt(lessonTitle, courseTitle, count, lessonData) {
  const vocab = lessonData?.keyVocabulary
    ? (Array.isArray(lessonData.keyVocabulary)
        ? lessonData.keyVocabulary.map(v => `${v.term} = ${v.meaning}`).join(', ')
        : JSON.stringify(lessonData.keyVocabulary))
    : '(non specificato)';

  return `Sei un didatta esperto di lingue classiche che usa il metodo induttivo-contestuale.
Genera ${count} esercizi di comprensione contestuale per questa lezione.

CONTESTO DELLA LEZIONE:
- Corso: ${courseTitle || '(non specificato)'}
- Lezione: ${lessonTitle || '(non specificato)'}
- Testo della lezione: ${lessonData?.textFragment || '(non disponibile — usa contentSummary)'}
- Riassunto: ${lessonData?.contentSummary || '(non specificato)'}
- Vocabolario introdotto: ${vocab}
- Obiettivi: ${lessonData?.learningObjectives || '(non specificati)'}

REGOLE OBBLIGATORIE:
1. Gli esercizi DEVONO essere generati dal testo della lezione (textFragment).
   Ogni domanda cita o usa una parte del testo. Non inventare testi che non ci sono.
2. VIETATO come domanda principale: "Che caso ha questa parola?" o "Come si coniuga X?"
   La grammatica è spiegazione a posteriori, non oggetto di verifica primaria.
3. VIETATO richiedere paradigmi a memoria come risposta principale.
4. VIETATO usare vocaboli non introdotti nelle lezioni senza spiegarli nel testo.
5. La prima domanda deve avere alta probabilità di risposta corretta (filtro affettivo basso).
6. Distribuisci le tipologie: comprensione → riconoscimento semantico → cloze/inferenza
   → riflessione metalinguistica (solo come ultima domanda).
7. Se textFragment è vuoto, usa contentSummary come base ma NON generare MCQ grammaticali.

FORMATO OUTPUT — solo JSON valido, nient'altro:
{
  "questions": [
    {
      "type": "comprehension|semantic_recognition|cloze|root_inference|meta_reflection",
      "question": "Testo della domanda",
      "context": "Frammento di testo citato (se applicabile, altrimenti ometti)",
      "options": ["Risposta A", "Risposta B", "Risposta C", "Risposta D"],
      "correctIndex": 0,
      "explanation": "Spiegazione: prima il SENSO, poi eventualmente la REGOLA grammaticale."
    }
  ]
}`;
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

/* ── Mock contestuale — quando textFragment è disponibile ────────────
 * Genera domande plausibili basate sul testo reale della lezione.
 * Funzione di fallback: sarà sostituita dall'AI reale.
 */
function buildContextualMock(textFragment, keyVocabulary, isGreek, count) {
  // Estrai la prima frase del testo come contesto per le domande
  const firstSentence = textFragment.split(/[.!?;]/).filter(s => s.trim().length > 3)[0]?.trim() || textFragment.substring(0, 100);

  // Prendi una parola chiave se disponibile
  const vocab = Array.isArray(keyVocabulary) && keyVocabulary.length > 0
    ? keyVocabulary[0]
    : null;

  const questions = [
    {
      type: 'comprehension',
      question: `Basandoti sul testo "${firstSentence}…", quale delle seguenti interpretazioni è corretta?`,
      context: firstSentence,
      options: [
        'Il testo descrive una situazione o un\'azione specifica in modo narrativo',
        'Il testo è un elenco grammaticale di forme verbali',
        'Il testo è una definizione tecnica di un concetto astratto',
        'Il testo è un dialogo tra più persone non identificate'
      ],
      correctIndex: 0,
      explanation: `Questo frammento usa la lingua ${isGreek ? 'greca' : 'latina'} in modo narrativo — descrive persone o situazioni reali. Questo è il tipo di testo più efficace per l'acquisizione linguistica, perché attiva la comprensione diretta senza mediazione traduttiva.`
    }
  ];

  if (vocab && count >= 2) {
    questions.push({
      type: 'semantic_recognition',
      question: `Nel contesto della lezione, la parola "${vocab.term}" viene usata con quale significato?`,
      context: textFragment.substring(0, 150),
      options: [
        vocab.meaning,
        isGreek ? 'Un tipo di costruzione sintattica' : 'Una forma verbale irregolare',
        isGreek ? 'Un dialetto della koiné' : 'Una preposizione composta',
        'Non è possibile capirlo dal contesto'
      ],
      correctIndex: 0,
      explanation: `"${vocab.term}" significa "${vocab.meaning}" ${vocab.notes ? '— ' + vocab.notes : ''}. Il contesto narrativo rende il significato inferibile anche prima di conoscere la parola — questo è esattamente il meccanismo dell'acquisizione per input comprensibile.`
    });
  }

  if (count >= 3) {
    questions.push({
      type: 'cloze',
      question: isGreek
        ? 'Quale approccio ti aiuta di più a capire un testo greco che non conosci ancora?'
        : 'Quale strategia è più efficace quando incontri una parola latina nuova nel testo?',
      context: firstSentence,
      options: [
        'Usare il contesto e la radice della parola per inferire il significato',
        'Consultare subito il vocabolario completo',
        'Tradurre parola per parola dall\'inizio',
        'Memorizzare il paradigma completo prima di leggere'
      ],
      correctIndex: 0,
      explanation: `L'inferenza dal contesto è la strategia del lettore esperto. La ricerca sull'acquisizione (Krashen, VanPatten) mostra che l'input comprensibile con inferenza contestuale produce acquisizione più duratura della memorizzazione esplicita. Il vocabolario si consulta *dopo* aver tentato l'inferenza, non prima.`
    });
  }

  if (count >= 4) {
    questions.push({
      type: 'meta_reflection',
      question: isGreek
        ? 'Nella frase greca, cosa segnala tipicamente la funzione sintattica del soggetto?'
        : 'Come riconosci il soggetto in una frase latina, anche senza una posizione fissa?',
      context: firstSentence,
      options: [
        isGreek ? 'Il caso nominativo (desinenza del soggetto)' : 'La desinenza del nominativo, non la posizione nella frase',
        'La posizione iniziale nella frase (sempre)',
        'L\'assenza di preposizione prima del nome',
        'La forma più lunga della frase'
      ],
      correctIndex: 0,
      explanation: isGreek
        ? 'In greco antico il soggetto è al nominativo — la desinenza segnala la funzione, non la posizione. L\'ordine delle parole greco è relativamente libero e guidato dall\'enfasi retorica, non dalla funzione sintattica.'
        : 'In latino il soggetto è al nominativo — la desinenza determina la funzione sintattica, non la posizione nella frase. Questo è fondamentale: "Marcum videt puella" e "Puella videt Marcum" hanno lo stesso significato ("la ragazza vede Marco").'
    });
  }

  return questions.slice(0, count);
}

/* ── Mock questions bank — fallback quando textFragment è null ────── */
const LATIN_QUESTIONS = [
  {
    type: 'comprehension',
    question: 'Leggi: "Cornelia in villa habitat. Villa est pulchra et magna." Chi abita nella villa?',
    context: 'Cornelia in villa habitat. Villa est pulchra et magna.',
    options: ['Cornelia', 'Il servo', 'Il padrone della villa', 'Non si può sapere'],
    correctIndex: 0,
    explanation: '"Habitat" è la terza persona singolare del presente di "habitare" — abita. Il soggetto è "Cornelia" (nominativo). Il testo dice esplicitamente che Cornelia abita nella villa. La comprensione del senso precede l\'analisi grammaticale.'
  },
  {
    type: 'semantic_recognition',
    question: 'In "Marcus magistrum salutat", chi compie l\'azione di salutare?',
    context: 'Marcus magistrum salutat. Magister laetus est.',
    options: ['Marco', 'Il maestro', 'Entrambi', 'Nessuno — è una forma passiva'],
    correctIndex: 0,
    explanation: '"Marcus" è il soggetto (nominativo, desinenza -us). "Magistrum" è il complemento oggetto (accusativo, desinenza -um). Marco saluta il maestro. La desinenza -um segnala il complemento oggetto — ma il senso si capisce dal contesto narrativo prima di nominare la categoria grammaticale.'
  },
  {
    type: 'root_inference',
    question: 'La parola "agricola" non è ancora stata introdotta. Sapendo che "ager" significa "campo", cosa significa probabilmente?',
    context: 'In agris multi agricolae laborant. Labor durus est.',
    options: ['Chi lavora nei campi — contadino', 'Uno strumento per l\'agricoltura', 'Un tipo di terreno fertile', 'Una festa legata ai raccolti'],
    correctIndex: 0,
    explanation: '"Agricola" si compone di "ager" (campo) + "-cola" (chi coltiva, da "colo" = coltivo). Il contesto conferma: molti lavorano nei campi. Questa strategia di inferenza dalla radice + contesto è quella del lettore esperto — non serve il dizionario ogni volta.'
  },
  {
    type: 'cloze',
    question: 'Completa con la forma corretta: "Cornelia in _____ habitat." (la villa è il luogo in cui si trova)',
    context: 'Cornelia in _____ habitat. Ibi semper felix est.',
    options: ['villa (ablativo)', 'villam (accusativo)', 'villae (genitivo)', 'villarum (genitivo plurale)'],
    correctIndex: 0,
    explanation: '"In" con ablativo indica il luogo in cui si sta (stato in luogo). "Villa" è l\'ablativo singolare della I declinazione. "Villam" con "in" indicherebbe moto verso luogo. Il contesto — "lì è sempre felice" — conferma che si tratta di stato, non di movimento.'
  },
  {
    type: 'comprehension',
    question: 'Leggi: "Servi in agris laborant. Dominus in villa sedet." Chi lavora e chi è seduto?',
    context: 'Servi in agris laborant. Dominus in villa sedet.',
    options: ['I servi lavorano, il padrone è seduto', 'Il padrone lavora, i servi sono seduti', 'Tutti lavorano nei campi', 'Il padrone e i servi lavorano insieme'],
    correctIndex: 0,
    explanation: '"Servi" (nominativo plurale) è il soggetto di "laborant". "Dominus" (nominativo singolare) è il soggetto di "sedet". La distinzione servi/dominus è narrativamente e culturalmente significativa — apre la riflessione sulla struttura sociale romana.'
  },
  {
    type: 'meta_reflection',
    question: 'Nelle frasi precedenti, come hai riconosciuto il soggetto senza che la posizione nella frase fosse fissa?',
    context: 'Marcus magistrum salutat. / Magistrum Marcus salutat.',
    options: ['Dalla desinenza del nominativo (-us, -a, -um ecc.)', 'Dalla posizione iniziale nella frase', 'Dalla lunghezza della parola', 'Dal numero di sillabe'],
    correctIndex: 0,
    explanation: 'In latino l\'ordine delle parole è libero — entrambe le frasi significano "Marco saluta il maestro". È la desinenza a segnalare la funzione: -us (nominativo, soggetto) vs -um (accusativo, oggetto). Questa flessibilità è una caratteristica fondamentale del latino, non un problema da risolvere.'
  }
];

const GREEK_QUESTIONS = [
  {
    type: 'comprehension',
    question: 'Leggi: "ὁ παῖς ἐν τῇ οἰκίᾳ μένει." Dove rimane il ragazzo?',
    context: 'ὁ παῖς ἐν τῇ οἰκίᾳ μένει. ἡ δὲ μήτηρ ἐν τῇ ἀγορᾷ ἐστίν.',
    options: ['In casa', 'In piazza (ἀγορά)', 'A scuola', 'Nel campo'],
    correctIndex: 0,
    explanation: '"ἐν τῇ οἰκίᾳ" = "in casa" (ἐν + dativo = stato in luogo). "μένει" = rimane, sta. La madre invece è nell\'ἀγορά (piazza pubblica). La lettura diretta in greco, senza traduzione intermedia, è l\'obiettivo del metodo induttivo-contestuale.'
  },
  {
    type: 'semantic_recognition',
    question: 'In "ὁ διδάσκαλος τοὺς παῖδας διδάσκει", chi insegna e chi apprende?',
    context: 'ὁ διδάσκαλος τοὺς παῖδας διδάσκει. οἱ δὲ παῖδες ἀκούουσιν.',
    options: ['Il maestro insegna ai ragazzi', 'I ragazzi insegnano al maestro', 'Tutti imparano insieme', 'Non si può capire senza analisi grammaticale'],
    correctIndex: 0,
    explanation: '"ὁ διδάσκαλος" è il soggetto (nominativo con articolo ὁ). "τοὺς παῖδας" è l\'accusativo plurale (articolo τούς + παῖδας). Il maestro è il soggetto dell\'azione di insegnare. Il verbo "διδάσκει" — "insegna" — dalla stessa radice di διδάσκαλος (maestro).'
  },
  {
    type: 'root_inference',
    question: 'La parola "φιλόσοφος" non è stata introdotta. Sapendo che "φιλέω" = amare e "σοφία" = sapienza, cosa significa?',
    context: 'ὁ Σωκράτης φιλόσοφός ἐστιν. ζητεῖ τὴν ἀλήθειαν.',
    options: ['Chi ama la sapienza — filosofo', 'Chi studia la natura', 'Chi teme gli dei', 'Chi governa la città'],
    correctIndex: 0,
    explanation: 'φιλό-σοφος = "amante della sapienza" (φιλέω + σοφία). Il contesto lo conferma: Socrate cerca la verità (ἀλήθεια). Questa è la stessa radice di "filosofia" in italiano. La capacità di ricostruire il significato dalla morfologia è competenza fondamentale per il lettore di greco.'
  },
  {
    type: 'cloze',
    question: 'Completa: "ὁ παῖς _____ βλέπει." (il ragazzo guarda la madre)',
    context: 'ὁ παῖς _____ βλέπει. ἡ δὲ μήτηρ χαίρει.',
    options: ['τὴν μητέρα (accusativo)', 'ἡ μήτηρ (nominativo)', 'τῆς μητρός (genitivo)', 'τῇ μητρί (dativo)'],
    correctIndex: 0,
    explanation: '"βλέπει" (guarda) regge l\'accusativo — il complemento oggetto. "τὴν μητέρα" è la forma accusativa di "ἡ μήτηρ" (la madre). L\'articolo τήν segnala il caso accusativo femminile singolare — anche senza conoscere la declinazione completa, l\'articolo guida la comprensione.'
  },
  {
    type: 'comprehension',
    question: 'Leggi: "ἐν ἀρχῇ ἦν ὁ λόγος." Cosa dice questo celebre inizio?',
    context: 'ἐν ἀρχῇ ἦν ὁ λόγος. καὶ ὁ λόγος ἦν πρὸς τὸν θεόν.',
    options: ['In principio era il Logos (la Parola)', 'Il principio era nella parola', 'La parola viene da Dio', 'All\'inizio c\'era il silenzio'],
    correctIndex: 0,
    explanation: '"ἐν ἀρχῇ" = in principio/all\'inizio. "ἦν" = era (imperfetto di εἰμί). "ὁ λόγος" = il logos, la parola, la ragione. Il famoso incipit del Vangelo di Giovanni in greco — esempio di come l\'acquisizione del greco apra testi di straordinaria densità culturale.'
  },
  {
    type: 'meta_reflection',
    question: 'Nel greco antico, come si distingue l\'aoristo dall\'imperfetto indicativo?',
    context: 'ἔλυσα (aoristo) vs ἔλυον (imperfetto) — entrambi "tradotti" come passato',
    options: ['Per l\'aspetto: aoristo = azione vista come completata; imperfetto = azione in corso o ripetuta', 'Per il tempo: aoristo = ieri, imperfetto = mesi fa', 'Per la persona: aoristo = prima, imperfetto = terza', 'Non c\'è differenza significativa — è solo variazione stilistica'],
    correctIndex: 0,
    explanation: 'La distinzione aoristo/imperfetto è aspettuale, non temporale. L\'aoristo presenta l\'azione come un evento unitario e concluso (Aktionsart puntuale). L\'imperfetto presenta l\'azione come in corso, ripetuta o durativa nel passato. Tradurre entrambi con il passato italiano fa perdere una distinzione cognitiva fondamentale del greco.'
  }
];

export default withAuth(handler);
