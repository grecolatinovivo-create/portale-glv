# DIDACTIC_SPEC — AI Panel · GrecoLatinoVivo
*Esperto di Didattica delle Lingue Classiche — Metodo Induttivo-Contestuale — Maggio 2026*

---

## 1. Premessa metodologica

Il pannello AI non è un "quiz di grammatica". È uno strumento di **retrieval practice contestuale**:
il modo più efficace per consolidare l'acquisizione linguistica reale (Roediger & Butler 2011,
Kornell & Bjork 2008). La distinzione è cruciale e ha impatto diretto sull'architettura tecnica.

**Il metodo grammaticale-traduttivo** (MCQ tipo "Qual è il dativo di...?") allena esclusivamente
la memoria dichiarativa esplicita. Il risultato: lo studente ricorda la regola durante il quiz
e la dimentica entro 72 ore. Non costruisce mai competenza procedurale.

**Il metodo induttivo-contestuale** parte dal testo autentico. Le domande emergono dal testo
della lezione, non dall'astrazione grammaticale. Lo studente incontra la lingua in contesto
narrativo comprensibile e la grammatica è strumento di riflessione *a posteriori*, non punto
di partenza.

> **Principio cardine**: ogni esercizio deve essere generato a partire da un frammento
> di testo autentico (o pseudoautentico) legato alla lezione specifica. Senza testo,
> non c'è esercizio contestuale.

---

## 2. Problema architetturale — stato attuale

Il modello `Lesson` nel DB ha solo:
- `id`, `courseId`, `title`, `durationMin`, `isFree`, `sortOrder`, `vimeoUrl`

**Non esiste alcun campo contenuto.** L'AI riceve solo il titolo della lezione.
Un'AI che conosce solo "Lezione 4 — L'ablativo assoluto" non può fare altro che
generare domande grammaticali generiche sull'ablativo assoluto. Questo è esattamente
il contrario del metodo induttivo-contestuale.

**Soluzione richiesta**: aggiungere 4 campi al modello `Lesson` che forniscano all'AI
il contesto necessario per generare esercizi veramente legati alla lezione.

---

## 3. Campi da aggiungere al modello `Lesson`

```prisma
// Contesto per il pannello AI — popolato dal docente/admin tramite tool di gestione
textFragment       String? @db.Text   // Testo autentico o pseudoautentico usato nella lezione
                                       // Es: "Cornelia in villa habitat. Villa est pulchra."
                                       // Questo è il materiale primario per gli esercizi AI.

contentSummary     String? @db.Text   // Descrizione breve del contenuto (3-5 frasi)
                                       // Es: "La lezione introduce il presente indicativo di
                                       //      esse e i sostantivi della I declinazione,
                                       //      attraverso il racconto della famiglia di Marco."

keyVocabulary      Json?              // Array JSON: [{term, meaning, notes?}]
                                       // Es: [{"term":"habitat","meaning":"abita"},
                                       //      {"term":"villa","meaning":"villa, casa di campagna"}]
                                       // Massimo 15 voci — solo il lessico chiave della lezione

learningObjectives String? @db.Text   // Obiettivi: cosa lo studente capisce dopo la lezione
                                       // Es: "Riconosce le forme del presente di esse.
                                       //      Comprende la struttura nominale della I declinazione
                                       //      nel contesto narrativo."
```

### Rationale per ogni campo

**`textFragment`**: è il campo più importante. Senza un testo di riferimento, gli esercizi
sono necessariamente astratti. Con il testo, l'AI può fare domande di comprensione,
cloze, riordino — tutti esercizi contestuali. Anche un brano di 3-4 frasi è sufficiente.

**`contentSummary`**: orienta l'AI sul tema narrativo/culturale della lezione, non solo
sul contenuto grammaticale. "Oggi parliamo della famiglia di Marco" è più utile di
"Oggi studiamo la I declinazione" per generare domande significative.

**`keyVocabulary`**: permette all'AI di calibrare la difficoltà lessicale. Se l'AI sa
quali parole sono state introdotte in questa lezione, può usarle nelle domande senza
introdurre vocaboli sconosciuti che renderebbero incomprensibile l'esercizio.

**`learningObjectives`**: guida l'AI sulla profondità di analisi richiesta. Se l'obiettivo
è "riconoscere le forme verbali", l'AI non proporrà esercizi di produzione scritta.

---

## 4. Tipologie di esercizi (metodo induttivo-contestuale)

Ordine da prioritario a secondario. I primi 4 sono il core del pannello AI.

### 4.1 Comprensione del testo (Lectio Comprensiva) — PRIORITÀ ALTA

**Cosa chiede**: il senso globale di una frase o brano.
**Non chiede**: analisi grammaticale, traduzione, nomenclatura.

```
Formato generato dall'AI:
{
  type: "comprehension",
  question: "Dove vive Cornelia, secondo il testo?",
  context: "Cornelia in villa habitat. Villa est pulchra.",
  options: ["In città", "In villa", "In campagna senza villa", "Non si sa"],
  correctIndex: 1,
  explanation: "Il testo dice esplicitamente 'in villa habitat' — abita in villa.
                Nota come il contesto narrativo rende il significato trasparente
                anche senza conoscere a priori il vocabolo 'villa'."
}
```

**Perché**: allena la lettura diretta in lingua originale senza mediazione traduttiva.
Il filtro affettivo rimane basso (nessun rischio di "sbagliare grammatica").

### 4.2 Riconoscimento semantico in contesto — PRIORITÀ ALTA

**Cosa chiede**: identificare il referente di una forma in un contesto dato.
**Non chiede**: "Che caso è questa parola?" — chiede "Chi compie questa azione?"

```
{
  type: "semantic_recognition",
  question: "In 'Marcus magistrum salutat', chi saluta?",
  context: "Marcus magistrum salutat. Magister laetus est.",
  options: ["Il maestro", "Marco", "Entrambi", "Non si può sapere"],
  correctIndex: 1,
  explanation: "Marcus è il soggetto (nominativo), magistrum è il complemento oggetto
                (accusativo). Marco saluta il maestro. La desinenza -um segnala
                il complemento oggetto — ma la comprensione del senso viene prima
                dell'analisi della forma."
}
```

**Perché**: sviluppa la sensazione che una forma "suoni giusta" in contesto (memoria
procedurale) prima di esplicitare la regola grammaticale.

### 4.3 Cloze contestuale — PRIORITÀ ALTA

**Cosa chiede**: completare un gap in un testo autentico con la forma corretta.
**Non chiede**: "Quale desinenza ha il genitivo?" — il contesto guida la scelta.

```
{
  type: "cloze",
  question: "Completa il testo con la parola giusta:",
  context: "Cornelia in _____ habitat. Ibi felix est.",
  options: ["villam", "villa", "villae", "villārum"],
  correctIndex: 1,
  explanation: "'In' con ablativo indica luogo in cui si sta. 'Villa' (ablativo singolare)
                è la forma corretta. 'Villam' sarebbe accusativo (moto a luogo con 'in').
                Il contesto ('felice là') conferma che si tratta di luogo stativo."
}
```

**Perché**: il cloze in testo autentico è la tipologia con il miglior rapporto tra
carico cognitivo e acquisizione (VanPatten 1996). Il contesto riduce l'ansia da
prestazione pur mantenendo la sfida linguistica.

### 4.4 Inferenza dalla radice — PRIORITÀ ALTA

**Cosa chiede**: usare il contesto + la radice per capire una parola nuova.
**Non chiede**: "Cosa significa X?" come test di memoria lessicale.

```
{
  type: "root_inference",
  question: "La parola 'agricola' non è stata introdotta ancora. Guardando il contesto
             e il fatto che 'ager' significa 'campo', cosa significa probabilmente?",
  context: "In agris multi agricolae laborant. Ager magnus est.",
  options: ["Guerriero", "Contadino, chi lavora nei campi", "Città", "Strumento agricolo"],
  correctIndex: 1,
  explanation: "'Agricola' si compone di 'ager' (campo) + '-cola' (chi coltiva, da 'colo').
                È lo stesso elemento che troviamo in 'incola' (abitante) e 'caelicola'
                (abitante del cielo). Il contesto narrativo — 'molti lavorano nei campi' —
                conferma l'inferenza."
}
```

**Perché**: allena la strategia di lettura più importante per il lettore autonomo di testi
classici: dedurre il significato dal contesto e dalla morfologia, non dalla consultazione
del dizionario. Questa è competenza procedurale pura.

### 4.5 Riordino di enunciato (RiordinoTesto) — PRIORITÀ MEDIA

**Cosa chiede**: ricostruire l'ordine naturale di una frase latina/greca a partire da
frammenti mescolati. L'ordine delle parole in latino non è fisso ma non è casuale.

```
{
  type: "reorder",
  question: "Riordina i segmenti per formare una frase latina naturale:",
  segments: ["est", "Marcus", "laetus", "magister"],
  naturalOrder: [1, 3, 0, 2],  // "Marcus magister laetus est"
  explanation: "In latino il verbo 'esse' tende alla posizione finale. Il predicativo
                'laetus' precede il verbo. Soggetto e predicato nominale in apertura.
                Ordine naturale: Marcus (sogg.) magister (pred. nom.) laetus (agg.) est (cop.)."
}
```

**Perché**: sviluppa la sensazione del ritmo della frase latina/greca — competenza
essenziale per la lettura fluente che non si acquisisce mai studiando le regole.

### 4.6 Riflessione metalinguistica (Grammatica come post-testo) — PRIORITÀ BASSA

Solo DOPO la comprensione del testo, domande brevi di riflessione.

```
{
  type: "meta_reflection",
  question: "Nel testo 'Marcus magistrum salutat', quale forma segnala il complemento oggetto?",
  context: "Marcus magistrum salutat.",
  options: ["-um (desinenza accusativo)", "-us (desinenza nominativo)",
            "la posizione nella frase", "la preposizione"],
  correctIndex: 0,
  explanation: "La desinenza -um marca l'accusativo (complemento oggetto) nella II declinazione.
                La comprensione del senso ('chi saluta chi') viene prima — poi si nomina
                la categoria grammaticale che lo segnala formalmente."
}
```

**Perché**: la grammatica esplicita ha un ruolo di *consolidamento e riflessione*, non di
punto di partenza. La ricerca (Krashen, VanPatten) mostra che la regola spiega ciò che
lo studente ha già acquisito implicitamente — non produce acquisizione autonomamente.

---

## 5. Distribuzione ottimale degli esercizi in una sessione da 4 domande

```
Domanda 1: Comprensione del testo (Lectio Comprensiva)
           → Ingresso nel testo, filtro affettivo basso, buona probabilità di risposta corretta
           → Effetto: "ho capito il testo" → motivazione per continuare

Domanda 2: Riconoscimento semantico o Cloze contestuale
           → Sfida media — richiede attenzione alle forme, non solo al senso globale
           → Effetto: "sto notando come funziona la lingua"

Domanda 3: Inferenza dalla radice o Cloze contestuale
           → Sfida media-alta — richiede mobilitazione di conoscenze precedenti
           → Effetto: "sto usando ciò che so per capire cose nuove"

Domanda 4: Riflessione metalinguistica
           → La categoria grammaticale come spiegazione a posteriori di ciò che lo studente
              ha già compreso nei tre passi precedenti
           → Effetto: closure cognitiva — "ora so il nome di quello che facevo già"
```

Questa sequenza applica il **gradino di sfida progressiva** (Vygotsky, zona di sviluppo
prossimale) e termina con la categorizzazione grammaticale come *naming* di una competenza
già acquisita, non come regola da memorizzare a priori.

---

## 6. System prompt per l'AI — versione completa

Questo è il system prompt da inserire in `pages/api/ai/quiz.js` e `pages/api/ai/chat.js`
quando si integra un servizio AI reale (Claude o OpenAI).

### 6.1 System prompt per il TUTOR (chat)

```
Sei il Magistro, il tutor di GrecoLatinoVivo — una piattaforma di lingue classiche
che usa il metodo induttivo-contestuale. Il tuo modello è il filologo classico brillante:
preciso, colto, capace di sorprendere con connessioni inaspettate.

CONTESTO DELLA LEZIONE ATTUALE:
- Corso: [courseTitle]
- Lezione: [lessonTitle]
- Riassunto contenuto: [contentSummary se disponibile]
- Testo della lezione: [textFragment se disponibile]
- Vocabolario chiave: [keyVocabulary se disponibile]

PRINCIPI METODOLOGICI (rispetta sempre):
1. Non tradurre automaticamente — guida lo studente a inferire il significato dal contesto
2. Quando spieghi una forma grammaticale, parti sempre dal testo, mai dalla regola astratta
3. Se lo studente fa una domanda vaga, chiedi prima di cosa ha bisogno specificamente
4. Aggiungi sempre un dettaglio inaspettato: etimologia, parallelo letterario, curiosità
   storica sulla lingua — qualcosa che il target 35-60 anni colto non si aspetta
5. Non usare emoji nelle risposte — questo pubblico le troverebbe infantili
6. Usa terminologia tecnica corretta (ablativo assoluto, aoristo sigmativo, ecc.)
   ma spiega il termine la prima volta che lo usi in conversazione
7. Mantieni le risposte a 3-5 paragrafi max — muri di testo fanno abbandonare la lettura
8. Puoi usare la maieutica: a volte rispondi con una domanda che guida verso la risposta,
   ma solo se è pedagogicamente utile e non sembri evasivo
9. Se il textFragment è disponibile, riferisciti sempre ad esso — non inventare testi
10. Rispondi SEMPRE in italiano, salvo quando citi direttamente testi latini o greci

PERSONA DEL MAGISTRO:
Filologo classico, professore universitario, 55 anni. Sa tutto ma non lo esibisce.
Risponde sempre con un dettaglio che illumina il quadro più ampio.
Cita fonti: "Come nota Quintiliano nell'Institutio Oratoria..." non "Come sappiamo..."
Non è mai condiscendente — tratta lo studente da pari intellettuale curioso.
```

### 6.2 System prompt per il QUIZ (generazione esercizi)

```
Sei un didatta esperto di lingue classiche che usa il metodo induttivo-contestuale.
Devi generare [count] esercizi di comprensione contestuale basati su questa lezione.

CONTESTO DELLA LEZIONE:
- Corso: [courseTitle]
- Lezione: [lessonTitle]  
- Testo della lezione: [textFragment]
- Riassunto: [contentSummary]
- Vocabolario introdotto: [keyVocabulary]
- Obiettivi di apprendimento: [learningObjectives]

REGOLE OBBLIGATORIE — NON DEROGABILI:
1. Gli esercizi DEVONO essere generati dal textFragment. Ogni domanda cita o usa
   una parte del testo. Non inventare testi che non ci sono.
2. VIETATO chiedere "Che caso ha questa parola?" come domanda principale —
   la grammatica è strumento di spiegazione, non oggetto di verifica primaria.
3. VIETATO chiedere paradigmi a memoria ("Come si coniuga...?" come domanda principale)
4. VIETATO usare vocaboli non introdotti nelle lezioni precedenti senza spiegarli nel testo
5. La prima domanda deve avere alta probabilità di risposta corretta (filtro affettivo basso)
6. L'ultima domanda può contenere riflessione grammaticale, ma solo DOPO che le precedenti
   hanno dimostrato la comprensione del testo

DISTRIBUZIONE RICHIESTA:
- 1-2 domande di comprensione diretta del testo (chi fa cosa, dove, quando)
- 1 domanda di riconoscimento semantico in contesto (il senso di una forma nel testo)
- 1 domanda di inferenza o cloze contestuale (completare con la forma corretta nel contesto)
- Ultima domanda opzionale: riflessione metalinguistica (il nome grammaticale di ciò che
  lo studente ha già compreso nelle domande precedenti)

SE textFragment È VUOTO O NULL:
Genera esercizi ragionevoli basati sul contentSummary e learningObjectives.
In questo caso è accettabile una domanda di comprensione concettuale, ma NON
domande di memorizzazione di paradigmi o regole astratte.

FORMATO OUTPUT — JSON valido:
{
  "questions": [
    {
      "type": "comprehension|semantic_recognition|cloze|root_inference|meta_reflection",
      "question": "Testo della domanda",
      "context": "Frammento di testo citato (se applicabile)",
      "options": ["Risposta A", "Risposta B", "Risposta C", "Risposta D"],
      "correctIndex": 0,
      "explanation": "Spiegazione della risposta corretta (2-3 frasi).
                      Deve prima spiegare il SENSO, poi eventualmente la REGOLA."
    }
  ]
}
```

---

## 7. Modifiche tecniche necessarie al codice

### 7.1 `prisma/schema.prisma` — aggiungere al modello `Lesson`

```prisma
textFragment       String? @db.Text
contentSummary     String? @db.Text
keyVocabulary      Json?
learningObjectives String? @db.Text
```

Dopo la modifica: `npx prisma db push` (NON `migrate` — usa push per schema drift rapido)

### 7.2 `pages/api/ai/chat.js` — aggiungere fetch del contesto lezione

```javascript
// Nel body della richiesta, aggiungere: lessonContext (opzionale)
// Il frontend passa lessonContext se disponibile
const { message, lessonId, lessonTitle, courseTitle, history, lessonContext } = req.body;

// Prima di costruire il system prompt, fetch contesto lezione dal DB:
let lessonData = null;
if (lessonId) {
  lessonData = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      textFragment: true,
      contentSummary: true,
      keyVocabulary: true,
      learningObjectives: true
    }
  });
}

// buildSystemPrompt riceve ora lessonData
const systemPrompt = buildSystemPrompt(lessonTitle, courseTitle, lessonData);
```

### 7.3 `pages/api/ai/quiz.js` — stessa modifica

```javascript
// Fetch lezione dal DB
const lessonData = lessonId ? await prisma.lesson.findUnique({
  where: { id: lessonId },
  select: { textFragment: true, contentSummary: true, keyVocabulary: true, learningObjectives: true }
}) : null;

// Costruisce il prompt con contesto reale
const prompt = buildQuizPrompt(lessonTitle, courseTitle, numQuestions, lessonData);
```

### 7.4 `public/dashboard.html` — passare lessonId alle API

La funzione `sendChat()` e `generateQuiz()` devono già passare `lessonId`.
Verificare che il payload includa l'`id` della lezione (non solo il titolo).
L'id è già disponibile in `_ai.lessonId` dopo `updateAiContext()`.

### 7.5 Mock di fallback — quando i campi sono null

Le API devono degradare gracefully:
- Se `textFragment` è null → usare `contentSummary` come base
- Se anche `contentSummary` è null → generare esercizi generici sul topic del corso
  ma NON generare MCQ grammaticali astratti — generare domande culturali/contestuali:
  "Cosa sai già su X argomento?" o "Come ti aspetti che suoni questa parola?"

---

## 8. Anti-pattern da non implementare — specifici per questo metodo

| Pattern | Perché NO |
|---|---|
| "Quale caso ha questa parola?" come domanda principale | Verifica memoria dichiarativa, non comprensione. Lo studente può rispondere correttamente senza aver capito nulla. |
| Paradigmi completi come risposta attesa | Nessuno legge i testi classici recitando paradigmi. Il paradigma è strumento di riflessione, non performance |
| Traduzione come attività richiesta nel quiz | Sposta il focus dalla lingua al testo in italiano — rinforza la mediazione traduttiva che il metodo vuole superare |
| Esercizi grammaticali senza testo di riferimento | Grammatica senza testo è astrazione senza contesto — inutile per acquisizione |
| Feedback immediato senza spiegazione | La spiegazione è il momento di acquisizione. Il feedback nudo ("sbagliato!") produce ansia, non apprendimento |
| Timer / pressione temporale | Distrugge la qualità dell'elaborazione — il processamento lento è più efficace per la memoria a lungo termine |
| Auto-avanzamento alla prossima domanda | Lo studente deve avere tempo per elaborare il feedback prima di procedere |

---

## 9. Roadmap di implementazione prioritizzata

### Fase A — Dati (prerequisito di tutto il resto)
1. Aggiungere i 4 campi al modello `Lesson` (schema + db push)
2. Creare una pagina admin semplice (o un seed script) per popolare `textFragment`
   e `contentSummary` per le prime 5 lezioni — anche solo 3-4 frasi per lezione sono sufficienti
3. Verificare che l'API `/api/ai/quiz.js` riceva e usi questi campi

### Fase B — AI reale (sostituire il mock)
1. Scegliere il servizio: Claude (Anthropic) o OpenAI
2. Installare l'SDK, configurare la variabile d'ambiente
3. Sostituire il blocco MOCK con la chiamata AI reale usando i prompt di questa spec
4. Testare con 2-3 lezioni che hanno `textFragment` popolato

### Fase C — Affinamento
1. Raccogliere feedback dei primi utenti: le domande sono pertinenti? Troppo facili? Troppo difficili?
2. Aggiustare il system prompt in base ai risultati
3. Aggiungere la tipologia "Riordino di enunciato" se il frontend la supporta (richiede UI specifica)
4. Valutare integrazione con il sistema `Vocabulary` esistente: le parole del quiz possono
   essere aggiunte alla lista vocaboli personale con un click

---

## 10. Nota sul Greco Antico

Il Greco Antico richiede alcune specificità aggiuntive rispetto al Latino:

1. **Alfabeto**: le domande devono usare caratteri Unicode corretti (ὁ ἡ τό, non h, e, to).
   L'AI deve produrre output con diacritici corretti (spiriti, accenti). Testare con Claude
   o GPT-4o — entrambi gestiscono correttamente il greco politonico.

2. **Sistema verbale**: la distinzione aspettuale (aoristo vs imperfetto vs perfetto) è più
   importante del tempo cronologico. Le domande NON devono chiedere "È passato o presente?"
   ma "L'azione è vista come completata o in corso?" — diverso livello cognitivo.

3. **Dialetti**: specificare nel system prompt se la lezione usa attico, ionico, o koiné.
   Un esercizio su un testo omerico non deve confondere lo studente con forme attiche.

4. **Chip suggerite nel pannello**: per i corsi di Greco, le chip devono essere diverse.
   Già definite nel NEURO_SPEC: paradigma verbale, costrutti, pronuncia antica.

---

*Questo spec è input per il Developer (Fase 3 della pipeline). Va letto insieme a
UX_SPEC_AI_PANEL.md (struttura pannello) e NEURO_SPEC_AI_PANEL.md (microcopy e timing).
Il sistema di esercizi qui descritto è il contenuto; quei due spec gestiscono la forma.*
