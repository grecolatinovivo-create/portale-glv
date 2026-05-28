/**
 * POST /api/ai/quiz
 *
 * Genera esercizi contestuali alla lezione — metodo induttivo-contestuale.
 * Provider: Google Gemini 2.0 Flash con responseMimeType: 'application/json'
 *
 * Gli esercizi emergono dal testo della lezione (textFragment), non da regole
 * grammaticali astratte. Priorità: comprensione → riconoscimento semantico
 * → cloze/inferenza → riflessione metalinguistica.
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

import { withAuth } from '../../../lib/auth.js';
import { prisma }   from '../../../lib/prisma.js';

/* ── Gemini client (lazy init) ─────────────────────────────────────── */
let _geminiClient = null;
function getGemini() {
  if (_geminiClient) return _geminiClient;
  if (!process.env.GEMINI_API_KEY) return null;
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  _geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return _geminiClient;
}

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
    }
  }

  /* ── 2. Integrazione Gemini con JSON mode ──────────────────────── */
  const gemini = getGemini();
  if (gemini) {
    try {
      const prompt = buildQuizPrompt(lessonTitle, courseTitle, numQuestions, lessonData);

      // responseMimeType: 'application/json' forza Gemini a produrre JSON valido
      const model = gemini.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature:      0.6,
          maxOutputTokens:  2048,
        }
      });

      const result    = await model.generateContent(prompt);
      const raw       = result.response.text();
      const questions = parseQuestionsFromJson(raw).map(shuffleOptions);

      if (questions.length === 0) {
        throw new Error('Gemini ha restituito 0 domande valide');
      }

      return res.status(200).json({ questions });

    } catch (e) {
      console.error('[ai/quiz] Gemini error:', e.message);
      // Fallback al mock se AI fallisce
      console.warn('[ai/quiz] Fallback al mock');
    }
  }

  /* ── 3. MOCK — attivo solo se GEMINI_API_KEY non è impostata ────
   *
   * Domande didatticamente corrette (metodo induttivo-contestuale).
   * Se la lezione ha textFragment, usa il mock contestuale.
   */
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

  const isGreek = courseTitle && courseTitle.toLowerCase().includes('grec');

  if (lessonData?.textFragment) {
    const questions = buildContextualMock(
      lessonData.textFragment,
      lessonData.keyVocabulary,
      isGreek,
      numQuestions
    ).map(shuffleOptions);
    return res.status(200).json({ questions });
  }

  const bank     = isGreek ? GREEK_QUESTIONS : LATIN_QUESTIONS;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return res.status(200).json({ questions: shuffled.slice(0, numQuestions).map(shuffleOptions) });
  /* ── /MOCK ─────────────────────────────────────────────────────── */
}

/* ── Prompt per la generazione AI (metodo induttivo-contestuale) ─── */
function buildQuizPrompt(lessonTitle, courseTitle, count, lessonData) {
  const vocab = lessonData?.keyVocabulary
    ? (Array.isArray(lessonData.keyVocabulary)
        ? lessonData.keyVocabulary.map(v => `${v.term} = ${v.meaning}`).join(', ')
        : JSON.stringify(lessonData.keyVocabulary))
    : '(non specificato)';

  return `Sei Aurelianus, didatta esperto di lingue classiche (latino, greco antico, ebraico biblico, egiziano medio) che usa il metodo induttivo-contestuale.
Genera ${count} esercizi di comprensione contestuale per questa lezione.

CONTESTO DELLA LEZIONE:
- Corso: ${courseTitle || '(non specificato)'}
- Lezione: ${lessonTitle || '(non specificato)'}
- Testo della lezione: ${lessonData?.textFragment || '(non disponibile)'}
- Riassunto contenuto: ${lessonData?.contentSummary || '(non specificato)'}
- Vocabolario introdotto in questa lezione: ${vocab}
- Obiettivi di apprendimento: ${lessonData?.learningObjectives || '(non specificati)'}

REGOLE OBBLIGATORIE — non derogabili:
1. Ogni domanda DEVE basarsi sul testo della lezione (textFragment). Cita o usa frammenti reali.
   Se textFragment è vuoto, usa contentSummary ma NON generare MCQ grammaticali astratti.
2. VIETATO come domanda principale: "Che caso ha questa parola?" o "Come si coniuga X?"
   La grammatica è riflessione a posteriori, non oggetto di verifica primaria.
3. VIETATO richiedere paradigmi a memoria come risposta principale.
4. La prima domanda deve avere alta probabilità di risposta corretta (riduce l'ansia).
5. Distribuzione richiesta:
   - 1-2 domande di comprensione diretta (chi fa cosa, dove, quando nel testo)
   - 1 domanda di riconoscimento semantico in contesto (senso di una forma nel testo)
   - 1 domanda di cloze o inferenza dalla radice
   - Ultima domanda opzionale: riflessione metalinguistica (il nome grammaticale di ciò
     che lo studente ha già capito nelle domande precedenti)
6. Le spiegazioni devono spiegare prima il SENSO, poi eventualmente la regola.

Restituisci SOLO il seguente JSON (nessun testo prima o dopo):
{
  "questions": [
    {
      "type": "comprehension|semantic_recognition|cloze|root_inference|meta_reflection",
      "question": "Testo della domanda in italiano",
      "context": "Frase o frammento del testo citato (ometti se non applicabile)",
      "options": ["Opzione A", "Opzione B", "Opzione C", "Opzione D"],
      "correctIndex": 0,
      "explanation": "Spiegazione: prima il SENSO, poi eventualmente la regola grammaticale. Max 3 frasi."
    }
  ]
}`;
}

/**
 * Mescola le opzioni di una domanda e ricalcola correctIndex.
 * Risolve il problema per cui l'AI (e il mock) tendono a mettere
 * la risposta corretta sempre in prima posizione.
 */
function shuffleOptions(q) {
  if (!Array.isArray(q.options) || q.options.length < 2) return q;

  const correctText = q.options[q.correctIndex ?? 0];

  // Fisher-Yates shuffle
  const opts = [...q.options];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }

  return {
    ...q,
    options:      opts,
    correctIndex: opts.indexOf(correctText),
  };
}

function parseQuestionsFromJson(raw) {
  try {
    // Con responseMimeType: 'application/json', Gemini restituisce JSON puro
    const data = JSON.parse(raw);
    if (Array.isArray(data.questions)) return data.questions;
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    // Fallback: cerca il JSON nel testo
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return [];
      const data = JSON.parse(match[0]);
      return Array.isArray(data.questions) ? data.questions : [];
    } catch {
      return [];
    }
  }
}

/* ── Mock contestuale — quando textFragment è disponibile ─────────── */
function buildContextualMock(textFragment, keyVocabulary, isGreek, count) {
  const firstSentence = textFragment.split(/[.!?;]/).filter(s => s.trim().length > 3)[0]?.trim()
    || textFragment.substring(0, 100);

  const vocab = Array.isArray(keyVocabulary) && keyVocabulary.length > 0
    ? keyVocabulary[0] : null;

  const questions = [
    {
      type: 'comprehension',
      question: `Basandoti sul testo "${firstSentence}…", quale interpretazione è corretta?`,
      context: firstSentence,
      options: [
        'Il testo usa la lingua in modo narrativo, descrivendo una situazione reale',
        'Il testo è un elenco grammaticale di forme verbali',
        'Il testo è una definizione tecnica di un concetto astratto',
        'Il testo è un dialogo tra personaggi non identificati'
      ],
      correctIndex: 0,
      explanation: `Questo frammento è narrativo — descrive persone o situazioni. Il tipo di testo più efficace per l'acquisizione linguistica perché attiva la comprensione diretta senza mediazione traduttiva.`
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
        'Non è inferibile dal contesto'
      ],
      correctIndex: 0,
      explanation: `"${vocab.term}" significa "${vocab.meaning}"${vocab.notes ? ' — ' + vocab.notes : ''}. Il contesto narrativo rende il significato inferibile anche prima di conoscere la parola.`
    });
  }

  if (count >= 3) {
    questions.push({
      type: 'cloze',
      question: isGreek
        ? 'Quale strategia aiuta di più a capire un testo greco non ancora conosciuto?'
        : 'Quale strategia è più efficace con una parola latina nuova nel testo?',
      context: firstSentence,
      options: [
        'Usare il contesto e la radice per inferire il significato',
        'Consultare subito il vocabolario completo',
        'Tradurre parola per parola dall\'inizio',
        'Memorizzare il paradigma prima di leggere'
      ],
      correctIndex: 0,
      explanation: `L'inferenza contestuale è la strategia del lettore esperto. Produce acquisizione più duratura della memorizzazione esplicita. Il vocabolario si consulta dopo il tentativo di inferenza, non prima.`
    });
  }

  if (count >= 4) {
    questions.push({
      type: 'meta_reflection',
      question: isGreek
        ? 'Cosa segnala la funzione sintattica del soggetto in greco antico?'
        : 'Come riconosci il soggetto in una frase latina, senza una posizione fissa?',
      context: firstSentence,
      options: [
        isGreek ? 'Il caso nominativo (desinenza del soggetto)' : 'La desinenza del nominativo, non la posizione',
        'La posizione iniziale nella frase (sempre)',
        'L\'assenza di preposizione prima del nome',
        'La forma più lunga della frase'
      ],
      correctIndex: 0,
      explanation: isGreek
        ? 'Il soggetto greco è al nominativo — la desinenza segnala la funzione, non la posizione. L\'ordine delle parole è relativamente libero e guidato dall\'enfasi retorica.'
        : 'In latino il soggetto è al nominativo — la desinenza determina la funzione sintattica. "Marcum videt puella" e "Puella videt Marcum" significano lo stesso: la ragazza vede Marco.'
    });
  }

  return questions.slice(0, count);
}

/* ── Mock questions bank — fallback senza textFragment ───────────── */
const LATIN_QUESTIONS = [
  {
    type: 'comprehension',
    question: 'Leggi: "Cornelia in villa habitat. Villa est pulchra et magna." Chi abita nella villa?',
    context: 'Cornelia in villa habitat. Villa est pulchra et magna.',
    options: ['Cornelia', 'Il servo', 'Il padrone della villa', 'Non si può sapere'],
    correctIndex: 0,
    explanation: '"Habitat" è la 3ª singolare di "habitare" — abita. Il soggetto "Cornelia" è al nominativo. La comprensione del senso precede l\'analisi grammaticale.'
  },
  {
    type: 'semantic_recognition',
    question: 'In "Marcus magistrum salutat", chi compie l\'azione di salutare?',
    context: 'Marcus magistrum salutat. Magister laetus est.',
    options: ['Marco', 'Il maestro', 'Entrambi', 'Nessuno — è passiva'],
    correctIndex: 0,
    explanation: '"Marcus" è il soggetto (nominativo, -us). "Magistrum" è il complemento oggetto (accusativo, -um). Marco saluta il maestro. La desinenza -um segnala l\'oggetto — il senso si capisce dal contesto prima di nominare la categoria grammaticale.'
  },
  {
    type: 'root_inference',
    question: '"Agricola" non è ancora stata introdotta. Sapendo che "ager" = campo, cosa significa?',
    context: 'In agris multi agricolae laborant. Labor durus est.',
    options: ['Contadino — chi lavora nei campi', 'Uno strumento agricolo', 'Un tipo di terreno', 'Una festa legata ai raccolti'],
    correctIndex: 0,
    explanation: '"Agricola" = "ager" (campo) + "-cola" (chi coltiva, da "colo"). Il contesto conferma: molti lavorano nei campi. L\'inferenza dalla radice + contesto è la strategia del lettore esperto.'
  },
  {
    type: 'cloze',
    question: 'Completa: "Cornelia in _____ habitat." (luogo dove si trova)',
    context: 'Cornelia in _____ habitat. Ibi semper felix est.',
    options: ['villa (ablativo)', 'villam (accusativo)', 'villae (genitivo)', 'villarum (genitivo pl.)'],
    correctIndex: 0,
    explanation: '"In" con ablativo indica lo stato in luogo. "Villa" è l\'ablativo singolare. "Villam" con "in" indicherebbe moto verso. Il contesto — "lì è sempre felice" — conferma lo stato.'
  },
  {
    type: 'comprehension',
    question: '"Servi in agris laborant. Dominus in villa sedet." Chi lavora e chi è seduto?',
    context: 'Servi in agris laborant. Dominus in villa sedet.',
    options: ['I servi lavorano, il padrone è seduto', 'Il padrone lavora, i servi sono seduti', 'Tutti lavorano', 'Lavorano insieme'],
    correctIndex: 0,
    explanation: '"Servi" (nom. pl.) soggetto di "laborant". "Dominus" (nom. sing.) soggetto di "sedet". La distinzione servi/dominus apre la riflessione sulla struttura sociale romana.'
  },
  {
    type: 'meta_reflection',
    question: 'Come hai riconosciuto il soggetto in frasi con ordine delle parole variabile?',
    context: 'Marcus magistrum salutat. / Magistrum Marcus salutat.',
    options: ['Dalla desinenza del nominativo (-us, -a, -um…)', 'Dalla posizione iniziale', 'Dalla lunghezza della parola', 'Dal numero di sillabe'],
    correctIndex: 0,
    explanation: 'In latino l\'ordine è libero — entrambe le frasi significano "Marco saluta il maestro". È la desinenza a segnalare la funzione: -us (nominativo) vs -um (accusativo). Questa flessibilità è una caratteristica fondamentale del latino.'
  }
];

const GREEK_QUESTIONS = [
  {
    type: 'comprehension',
    question: '"ὁ παῖς ἐν τῇ οἰκίᾳ μένει." Dove rimane il ragazzo?',
    context: 'ὁ παῖς ἐν τῇ οἰκίᾳ μένει. ἡ δὲ μήτηρ ἐν τῇ ἀγορᾷ ἐστίν.',
    options: ['In casa (οἰκία)', 'In piazza (ἀγορά)', 'A scuola', 'Nel campo'],
    correctIndex: 0,
    explanation: '"ἐν τῇ οἰκίᾳ" = in casa (ἐν + dativo). "μένει" = rimane. La madre è nell\'ἀγορά. La lettura diretta in greco senza traduzione intermedia è l\'obiettivo del metodo.'
  },
  {
    type: 'semantic_recognition',
    question: 'In "ὁ διδάσκαλος τοὺς παῖδας διδάσκει", chi insegna?',
    context: 'ὁ διδάσκαλος τοὺς παῖδας διδάσκει. οἱ δὲ παῖδες ἀκούουσιν.',
    options: ['Il maestro insegna ai ragazzi', 'I ragazzi insegnano al maestro', 'Tutti imparano', 'Non si capisce'],
    correctIndex: 0,
    explanation: '"ὁ διδάσκαλος" è il soggetto (nominativo con articolo ὁ). "τοὺς παῖδας" è l\'accusativo plurale. "διδάσκει" — dalla stessa radice di διδάσκαλος (maestro).'
  },
  {
    type: 'root_inference',
    question: '"φιλόσοφος" non è stata introdotta. Sapendo che φιλέω = amare e σοφία = sapienza…',
    context: 'ὁ Σωκράτης φιλόσοφός ἐστιν. ζητεῖ τὴν ἀλήθειαν.',
    options: ['Chi ama la sapienza — filosofo', 'Chi studia la natura', 'Chi teme gli dei', 'Chi governa la città'],
    correctIndex: 0,
    explanation: 'φιλό-σοφος = amante della sapienza. Il contesto conferma: Socrate cerca la verità. Stessa radice di "filosofia" in italiano. L\'analisi morfologica + contesto è la strategia del lettore esperto.'
  },
  {
    type: 'cloze',
    question: 'Completa: "ὁ παῖς _____ βλέπει." (il ragazzo guarda la madre)',
    context: 'ὁ παῖς _____ βλέπει. ἡ δὲ μήτηρ χαίρει.',
    options: ['τὴν μητέρα (accusativo)', 'ἡ μήτηρ (nominativo)', 'τῆς μητρός (genitivo)', 'τῇ μητρί (dativo)'],
    correctIndex: 0,
    explanation: '"βλέπει" regge l\'accusativo. "τὴν μητέρα" è l\'accusativo di "ἡ μήτηρ". L\'articolo τήν segnala il caso anche prima di conoscere la declinazione completa.'
  },
  {
    type: 'comprehension',
    question: '"ἐν ἀρχῇ ἦν ὁ λόγος." Cosa dice questo celebre inizio?',
    context: 'ἐν ἀρχῇ ἦν ὁ λόγος. καὶ ὁ λόγος ἦν πρὸς τὸν θεόν.',
    options: ['In principio era il Logos (la Parola)', 'Il principio era nella parola', 'La parola viene da Dio', 'All\'inizio c\'era il silenzio'],
    correctIndex: 0,
    explanation: '"ἐν ἀρχῇ" = in principio. "ἦν" = era (imperfetto di εἰμί). "ὁ λόγος" = il logos. Incipit del Vangelo di Giovanni — esempio di come il greco apra testi di straordinaria densità culturale.'
  },
  {
    type: 'meta_reflection',
    question: 'Aoristo vs imperfetto indicativo: qual è la distinzione fondamentale?',
    context: 'ἔλυσα (aoristo) vs ἔλυον (imperfetto) — entrambi "passato" in italiano',
    options: ['Aspetto: aoristo = azione vista come completata; imperfetto = azione in corso o ripetuta', 'Tempo: aoristo = ieri, imperfetto = mesi fa', 'Persona: aoristo = prima, imperfetto = terza', 'Nessuna differenza significativa'],
    correctIndex: 0,
    explanation: 'La distinzione è aspettuale, non temporale. L\'aoristo presenta l\'azione come evento unitario e concluso. L\'imperfetto la presenta come in corso, ripetuta o durativa. Tradurli entrambi con il passato italiano fa perdere una distinzione cognitiva fondamentale del greco.'
  }
];

export default withAuth(handler);
