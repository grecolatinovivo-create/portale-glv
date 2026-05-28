#!/usr/bin/env python3
"""
seed-didattica.py
Popola i campi AI dei corsi Didattica: did-elementa, did-grammatica, did-principia, did-tertia
"""
import psycopg2, json

DB_URL = "postgresql://neondb_owner:npg_wRBXT6Azv0Vj@ep-late-sea-aqyed9xw-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# ─── DID-ELEMENTA (8 lezioni) ─────────────────────────────────────────────────
# Corso introduttivo per insegnare il latino con metodo diretto/naturale

DID_ELEMENTA = [
  {
    "textFragment": "Quid est lingua Latina? Lingua viva, non mortua. Prima sessione: insegnare il latino come lingua — non come sistema di regole da memorizzare, ma come mezzo di comunicazione autentico. Il metodo diretto parte dall'input comprensibile.",
    "contentSummary": "Primo incontro del corso did-elementa. Introduce la filosofia di fondo: il latino come lingua viva, acquisibile attraverso l'esposizione a testi comprensibili. Si discute la differenza tra apprendimento (conscio, regole) e acquisizione (inconscio, esposizione). Riferimento alla didattica naturalistica e al metodo LLPSI.",
    "keyVocabulary": [{"term": "input comprensibile", "meaning": "testo comprensibile leggermente al di sopra del livello dell'apprendente (i+1, Krashen)"}, {"term": "metodo diretto", "meaning": "insegnamento della lingua nella lingua stessa, senza ricorso alla traduzione"}, {"term": "acquisizione", "meaning": "processo inconscio di interiorizzazione della lingua per esposizione"}, {"term": "LLPSI", "meaning": "Lingua Latina Per Se Illustrata, manuale di Hans Ørberg"}],
    "learningObjectives": "Il docente comprende la distinzione tra apprendimento conscio e acquisizione inconscia. Sa motivare pedagogicamente la scelta del metodo diretto. Conosce i principi della didattica naturalistica applicata al latino."
  },
  {
    "textFragment": "Prima lezione pratica con gli studenti: 'Quis es? Discipulus sum.' Presentazione del metodo in azione. Video extra: il latino nella classe — gestione dello spazio, della voce, del contesto.",
    "contentSummary": "Video extra 1 del corso did-elementa. Mostra una lezione modello in cui il docente introduce il latino con domande semplici (Quis es? Ubi es? Quot anni tibi sunt?). Dimostra come creare contesto linguistico in aula senza ricorso all'italiano. Tecniche di Total Physical Response (TPR) e gestione del silenzio produttivo.",
    "keyVocabulary": [{"term": "TPR", "meaning": "Total Physical Response: risposta fisica totale, metodo che associa lingua e azione corporea"}, {"term": "Quis es?", "meaning": "Chi sei? — formula di base per l'interazione in classe"}, {"term": "silenzio produttivo", "meaning": "fase in cui lo studente comprende prima di produrre, normale nel periodo silenzioso"}],
    "learningObjectives": "Il docente osserva come condurre una prima lezione in latino puro. Impara le domande di base per l'interazione in aula. Comprende come gestire il periodo silenzioso degli studenti principianti."
  },
  {
    "textFragment": "Secondo incontro: la costruzione del testo narrativo in classe. Come introdurre il lessico attraverso storie (TPRS: Teaching Proficiency through Reading and Storytelling). 'Erat puer. Puer erat Romanus. Puer habitabat Romae.'",
    "contentSummary": "Secondo incontro del corso did-elementa. Introduce il metodo TPRS (Teaching Proficiency through Reading and Storytelling): costruzione collettiva di storie in classe, co-creazione narrativa, verifica della comprensione con domande circling. Il docente impara a costruire storie con strutture linguistiche ripetute in modo naturale.",
    "keyVocabulary": [{"term": "TPRS", "meaning": "Teaching Proficiency through Reading and Storytelling: metodo narrativo per l'acquisizione linguistica"}, {"term": "circling", "meaning": "tecnica di verifica e ripetizione: domande sì/no, o/o, interrogative su una struttura linguistica"}, {"term": "pop-up grammar", "meaning": "spiegazione grammaticale breve e contestuale, non sistematica"}],
    "learningObjectives": "Il docente sa costruire una storia con il metodo TPRS. Conosce la tecnica del circling per consolidare le strutture. Sa quando e come fare pop-up grammar senza interrompere il flusso narrativo."
  },
  {
    "textFragment": "Video extra 2: la gestione delle domande degli studenti. Come rispondere in latino anche a domande meta-linguistiche. 'Quid significat haec vox?' 'Quid est participium?' — rispondere rimanendo nella lingua.",
    "contentSummary": "Video extra 2 del corso did-elementa. Affronta la gestione delle domande metalinguistiche degli studenti durante una lezione in latino. Mostra strategie per restare nella L2 anche quando si deve spiegare un elemento grammaticale. Tecniche: parafrasi in latino, esempi multipli, gesti, disegni.",
    "keyVocabulary": [{"term": "metalinguaggio", "meaning": "il linguaggio che parla del linguaggio (es. 'questo è un sostantivo')"}, {"term": "L2", "meaning": "seconda lingua o lingua target in apprendimento"}, {"term": "parafrasi", "meaning": "spiegazione con altre parole nella stessa lingua"}],
    "learningObjectives": "Il docente sa gestire le domande degli studenti rimanendo in latino. Conosce strategie di parafrasi e contestualizzazione in L2. Sa usare il corpo e il disegno come supporto alla comprensione."
  },
  {
    "textFragment": "Video extra 3: lettura estensiva e intensiva. Come scegliere i testi adatti al livello. Gradazione della difficoltà: dalla frase semplice al paragrafo narrativo complesso. LLPSI cap. I-V come modello.",
    "contentSummary": "Video extra 3 del corso did-elementa. Distingue lettura estensiva (molta lettura facile, per piacere e fluidità) da lettura intensiva (testo difficile, analisi approfondita). Mostra come graduare i testi. Presenta LLPSI capitoli I-V come esempio di testo graduato e contestualizzato. Criteri di scelta dei testi per principianti.",
    "keyVocabulary": [{"term": "lettura estensiva", "meaning": "lettura di grandi quantità di testi facili per costruire fluidità"}, {"term": "lettura intensiva", "meaning": "lettura approfondita di un testo difficile con analisi"}, {"term": "testo graduato", "meaning": "testo adattato al livello dell'apprendente, con difficoltà progressiva"}],
    "learningObjectives": "Il docente distingue lettura estensiva da intensiva. Sa scegliere testi adatti al livello degli studenti. Conosce i criteri di gradazione della difficoltà testuale."
  },
  {
    "textFragment": "Terzo incontro: la valutazione nel metodo diretto. Come valutare la comprensione senza traduzione. Strumenti: dettato, narrazione guidata, risposta a domande in latino, riassunto orale.",
    "contentSummary": "Terzo incontro del corso did-elementa. Affronta la valutazione nel contesto del metodo diretto: come misurare la competenza senza ricorrere alla traduzione come unico strumento. Strumenti proposti: dettato comprensivo, narrazione guidata da immagini, risposte orali a domande in latino, riassunto scritto in latino semplice.",
    "keyVocabulary": [{"term": "valutazione autentica", "meaning": "valutazione che rispecchia usi reali della lingua, non solo esercizi decontestualizzati"}, {"term": "dettato comprensivo", "meaning": "dettato in cui lo studente deve anche dimostrare di aver capito il senso"}, {"term": "narrazione guidata", "meaning": "produzione linguistica supportata da immagini o traccia"}],
    "learningObjectives": "Il docente conosce strumenti di valutazione alternativi alla traduzione. Sa progettare verifiche che misurano la comprensione autentica. Comprende come integrare valutazione formativa e sommativa nel metodo diretto."
  },
  {
    "textFragment": "Quarto incontro: la programmazione di un'unità didattica in latino diretto. Dalla selezione del testo alla sequenza delle attività. Modello: obiettivi → pre-lettura → lettura → post-lettura → produzione.",
    "contentSummary": "Quarto incontro del corso did-elementa. Guida il docente nella progettazione completa di un'unità didattica con metodo diretto. Sequenza: selezione del testo, obiettivi linguistici e culturali, attività di pre-lettura (contestualizzazione), lettura guidata, attività di post-lettura (approfondimento), produzione autonoma. Esempi pratici con LLPSI.",
    "keyVocabulary": [{"term": "unità didattica", "meaning": "sequenza organizzata di lezioni intorno a un obiettivo linguistico e culturale"}, {"term": "pre-lettura", "meaning": "attività di contestualizzazione prima di leggere il testo"}, {"term": "post-lettura", "meaning": "attività di riflessione, approfondimento e produzione dopo la lettura"}],
    "learningObjectives": "Il docente sa progettare un'unità didattica completa con metodo diretto. Conosce la sequenza pre-lettura → lettura → post-lettura. Sa definire obiettivi linguistici e culturali integrati."
  },
  {
    "textFragment": "Quinto incontro: laboratorio conclusivo. Progettazione autonoma di una lezione-tipo. Il docente elabora una propria sequenza didattica e la condivide con il gruppo. Feedback collegiale e riflessione finale.",
    "contentSummary": "Quinto e ultimo incontro del corso did-elementa. Workshop pratico: ogni partecipante progetta una lezione-tipo da 50 minuti in latino diretto e la presenta al gruppo. Feedback strutturato su: uso della L2, gradazione della difficoltà, gestione della classe, valutazione. Riflessione conclusiva sul percorso formativo.",
    "keyVocabulary": [{"term": "feedback strutturato", "meaning": "commento organizzato su criteri definiti, non impressionistico"}, {"term": "lezione-tipo", "meaning": "lezione modello che può essere replicata in contesti diversi"}, {"term": "peer learning", "meaning": "apprendimento tra pari attraverso condivisione e confronto"}],
    "learningObjectives": "Il docente è in grado di progettare autonomamente una lezione in latino diretto. Sa ricevere e dare feedback costruttivo. Ha interiorizzato i principi del metodo e sa applicarli in contesti reali."
  },
]

# ─── DID-GRAMMATICA (10 lezioni) ──────────────────────────────────────────────
# Corso di glottodidattica del latino: dalla teoria alla pratica

DID_GRAMMATICA = [
  {
    "textFragment": "Pars I: Il latino come lingua — non sistema di regole, ma sistema di comunicazione. Differenza tra grammatica descrittiva e prescrittiva. Perché insegnare latino diversamente richiede un cambio di paradigma epistemologico.",
    "contentSummary": "Prima parte del corso did-grammatica. Parte da una domanda fondamentale: cos'è il latino? Non una lingua morta ma un sistema linguistico con regole proprie, ritmo, pragmatica. Distingue grammatica descrittiva (com'è la lingua) da prescrittiva (com'è 'giusto' che sia). Introduce il cambio di paradigma necessario per un'insegnamento moderno del latino.",
    "keyVocabulary": [{"term": "grammatica descrittiva", "meaning": "studio della lingua com'è realmente usata"}, {"term": "grammatica prescrittiva", "meaning": "norme su come si 'dovrebbe' usare la lingua"}, {"term": "paradigma epistemologico", "meaning": "visione di fondo su cosa è il sapere e come si apprende"}],
    "learningObjectives": "Il docente comprende la distinzione tra grammatica descrittiva e prescrittiva. Sa motivare un approccio moderno all'insegnamento del latino. Riconosce i limiti del paradigma tradizionale basato su regole decontestualizzate."
  },
  {
    "textFragment": "Pars II: I processi cognitivi nell'apprendimento linguistico. Memoria di lavoro, memoria a lungo termine, chunking. Come il cervello elabora le strutture linguistiche. Implicazioni per la didattica.",
    "contentSummary": "Seconda parte del corso did-grammatica. Introduce le basi neurocognitive dell'acquisizione linguistica: memoria di lavoro (capacità limitata), memoria a lungo termine (schemi), chunking (raggruppamento in unità significative). Spiega perché la memorizzazione isolata delle regole grammaticali è inefficiente e come l'esposizione contestuale favorisce la ritenzione.",
    "keyVocabulary": [{"term": "memoria di lavoro", "meaning": "sistema cognitivo che elabora informazioni in tempo reale, capacità limitata"}, {"term": "chunking", "meaning": "raggruppamento di elementi in unità significative per ridurre il carico cognitivo"}, {"term": "schema", "meaning": "struttura mentale organizzata che facilita l'elaborazione di nuove informazioni"}],
    "learningObjectives": "Il docente comprende i meccanismi cognitivi di base dell'apprendimento linguistico. Sa progettare attività che rispettano i limiti della memoria di lavoro. Conosce il ruolo del chunking nella grammatica."
  },
  {
    "textFragment": "Pars III: Principi di glottodidattica applicata al latino. La gerarchia input → intake → output. Il filtro affettivo di Krashen. Come creare condizioni favorevoli all'acquisizione.",
    "contentSummary": "Terza parte del corso did-grammatica. Presenta i principali fondamenti teorici della glottodidattica moderna applicati al latino: ipotesi dell'input (Krashen), filtro affettivo, ipotesi dell'output (Swain). Discute come ridurre il filtro affettivo (ansia, stress) e creare un ambiente di classe che favorisca l'acquisizione. Casi pratici.",
    "keyVocabulary": [{"term": "filtro affettivo", "meaning": "blocco psicologico che impedisce l'acquisizione quando lo studente è ansioso o demotivato (Krashen)"}, {"term": "intake", "meaning": "porzione di input che l'apprendente effettivamente elabora e interiorizza"}, {"term": "ipotesi dell'output", "meaning": "la produzione linguistica (Swain) aiuta a consolidare l'acquisizione"}],
    "learningObjectives": "Il docente conosce i principi fondamentali della glottodidattica moderna. Sa identificare e ridurre il filtro affettivo in classe. Comprende la sequenza input → intake → output e le sue implicazioni pratiche."
  },
  {
    "textFragment": "Pars IV: Una lezione con metodo induttivo — dimostrazione pratica. Il docente osserva una lezione in cui gli studenti scoprono da soli le regole del genitivo attraverso l'analisi di esempi contestuali.",
    "contentSummary": "Quarta parte del corso did-grammatica. Mostra in pratica il metodo induttivo applicato all'insegnamento del genitivo latino. Gli studenti leggono esempi ('liber pueri', 'domus patris', 'amor patriae'), osservano le forme, formulano ipotesi, verificano. Il docente guida senza spiegare direttamente. Confronto con approccio deduttivo tradizionale.",
    "keyVocabulary": [{"term": "metodo induttivo", "meaning": "si parte dagli esempi per arrivare alla regola (il contrario del metodo deduttivo)"}, {"term": "metodo deduttivo", "meaning": "si spiega prima la regola, poi si applicano esempi"}, {"term": "discovery learning", "meaning": "apprendimento per scoperta: lo studente costruisce da sé la comprensione"}],
    "learningObjectives": "Il docente sa condurre una lezione con metodo induttivo. Conosce la differenza tra approccio induttivo e deduttivo e sa scegliere il più adatto al contesto. Sa guidare gli studenti nella scoperta delle regole senza spiegazione diretta."
  },
  {
    "textFragment": "Pars V: L'insegnamento della grammatica nel metodo diretto. Come e quando spiegare la grammatica senza uscire dalla L2. Pop-up grammar, focus on form, noticing.",
    "contentSummary": "Quinta parte del corso did-grammatica. Affronta il problema dell'insegnamento esplicito della grammatica nel metodo diretto: quando intervenire con una spiegazione grammaticale, come farlo senza interrompere l'acquisizione. Tecniche: pop-up grammar (spiegazione breve e immediata), focus on form (attenzione guidata alla forma), noticing (consapevolezza della struttura).",
    "keyVocabulary": [{"term": "focus on form", "meaning": "attenzione momentanea alla forma linguistica durante un'attività comunicativa (Long)"}, {"term": "noticing", "meaning": "consapevolezza cosciente di una struttura linguistica che facilita l'acquisizione (Schmidt)"}, {"term": "focus on forms", "meaning": "insegnamento esplicito e sistematico delle forme grammaticali, fuori contesto comunicativo"}],
    "learningObjectives": "Il docente sa quando e come intervenire con spiegazioni grammaticali nel metodo diretto. Conosce le tecniche di pop-up grammar e focus on form. Sa distinguere quando usare focus on form vs focus on forms."
  },
  {
    "textFragment": "Pars VI: L'insegnamento del lessico. Frequenza, collocazione, campo semantico. Come scegliere quale vocabolario insegnare e in quale ordine. Liste di frequenza del latino e loro uso didattico.",
    "contentSummary": "Sesta parte del corso did-grammatica. Affronta la selezione e l'insegnamento del lessico latino: frequenza delle parole (core vocabulary vs. parole rare), collocazioni (combinazioni tipiche), campi semantici. Presenta le liste di frequenza del latino (DCC Latin Vocabulary, Diederich list) e discute come usarle per scegliere cosa insegnare prima. Tecniche di consolidamento lessicale.",
    "keyVocabulary": [{"term": "collocazione", "meaning": "combinazione tipica di parole (es. 'bellum gerere', non '*bellum facere')"}, {"term": "campo semantico", "meaning": "gruppo di parole legate per significato (es. termini militari, della famiglia)"}, {"term": "DCC Latin Vocabulary", "meaning": "lista delle 1000 parole latine più frequenti, curata dal Dickinson College Commentaries"}],
    "learningObjectives": "Il docente conosce i criteri per selezionare il lessico da insegnare. Sa usare le liste di frequenza nella pianificazione didattica. Conosce tecniche efficaci di consolidamento del vocabolario in contesto."
  },
  {
    "textFragment": "Pars VII: BES e DSA nell'insegnamento del latino. Come adattare il metodo per studenti con Bisogni Educativi Speciali e Disturbi Specifici dell'Apprendimento. Strategie inclusive.",
    "contentSummary": "Settima parte del corso did-grammatica. Affronta l'inclusione nell'insegnamento del latino: studenti con dislessia, disortografia, discalculia (DSA) e altri Bisogni Educativi Speciali (BES). Strategie: testi a font leggibile (OpenDyslexic), mappe concettuali, tempo aggiuntivo, verifiche orali, supporto visivo. Il metodo diretto può essere vantaggioso per i DSA rispetto al metodo tradizionale (meno carico sulla memorizzazione esplicita).",
    "keyVocabulary": [{"term": "DSA", "meaning": "Disturbi Specifici dell'Apprendimento: dislessia, disgrafia, disortografia, discalculia"}, {"term": "BES", "meaning": "Bisogni Educativi Speciali: categoria più ampia che include DSA, ADHD, difficoltà socio-economiche"}, {"term": "strumenti compensativi", "meaning": "ausili che compensano le difficoltà (sintesi vocale, dizionario digitale, mappe)"}],
    "learningObjectives": "Il docente conosce le principali categorie di BES e DSA. Sa adattare le attività e le verifiche per studenti con bisogni speciali. Comprende come il metodo diretto può essere inclusivo."
  },
  {
    "textFragment": "Pars VIII: La valutazione. Dall'interrogazione orale al portfolio. Come costruire rubriche di valutazione per il metodo diretto. Valutazione formativa vs sommativa nel latino.",
    "contentSummary": "Ottava parte del corso did-grammatica. Affronta la valutazione nel contesto dell'insegnamento del latino con metodo moderno. Strumenti: rubrica analitica (criteri espliciti), portfolio linguistico, valutazione tra pari. Differenza tra valutazione formativa (in itinere, per migliorare) e sommativa (finale, per certificare). Come costruire prove che valutino la competenza comunicativa.",
    "keyVocabulary": [{"term": "rubrica analitica", "meaning": "griglia di valutazione con criteri e livelli esplicitati"}, {"term": "portfolio linguistico", "meaning": "raccolta di elaborati dello studente che documentano il progresso"}, {"term": "valutazione tra pari", "meaning": "peer assessment: gli studenti valutano il lavoro dei compagni secondo criteri condivisi"}],
    "learningObjectives": "Il docente sa costruire rubriche di valutazione per il metodo diretto. Conosce la differenza tra valutazione formativa e sommativa. Sa progettare un portfolio linguistico per il latino."
  },
  {
    "textFragment": "Pars IX: La produzione linguistica. Come guidare gli studenti dalla comprensione alla produzione in latino. Scrittura guidata, parafrasi, riassunto, composizione libera. La produzione orale.",
    "contentSummary": "Nona parte del corso did-grammatica. Affronta il passaggio dalla comprensione alla produzione: come aiutare gli studenti a scrivere e parlare in latino. Sequenza: riformulazione di frasi modello → completamento → parafrasi → riassunto → composizione su traccia → composizione libera. Produzione orale: dialogo guidato, narrazione, descrizione. Il ruolo dell'errore come feedback.",
    "keyVocabulary": [{"term": "scaffolding", "meaning": "supporto graduale che viene ritirato man mano che l'autonomia aumenta"}, {"term": "riformulazione", "meaning": "produzione della stessa idea con parole diverse — consolida la struttura"}, {"term": "composizione guidata", "meaning": "produzione scritta con traccia, modello o vincoli che riducono la difficoltà"}],
    "learningObjectives": "Il docente sa progettare un percorso graduato dalla comprensione alla produzione. Conosce le tecniche di scaffolding per la produzione scritta e orale. Sa gestire l'errore come risorsa didattica."
  },
  {
    "textFragment": "Pars X: I bisogni degli apprendenti. Profili diversi: studente liceale, autodidatta adulto, universitario, insegnante in formazione. Come adattare il metodo a profili diversi. Motivazione e continuità.",
    "contentSummary": "Decima e ultima parte del corso did-grammatica. Affronta la diversità degli apprendenti di latino: profili motivazionali diversi, contesti diversi (scuola, università, autoapprendimento), ritmi diversi. Come adattare la progressione e le attività a ciascun profilo. L'importanza della motivazione intrinseca e come coltivarla. Riflessione conclusiva sul ruolo del docente come mediatore culturale.",
    "keyVocabulary": [{"term": "motivazione intrinseca", "meaning": "motivazione che nasce dall'interesse per la materia stessa, non da ricompense esterne"}, {"term": "apprendente autonomo", "meaning": "studente capace di gestire il proprio apprendimento senza dipendere dal docente"}, {"term": "mediatore culturale", "meaning": "ruolo del docente che non trasferisce sapere ma facilita l'incontro con la cultura"}],
    "learningObjectives": "Il docente riconosce i diversi profili degli apprendenti di latino. Sa adattare metodi e contenuti a contesti diversi. Comprende come motivare studenti con background e obiettivi diversi."
  },
]

# ─── DID-PRINCIPIA (7 lezioni) ────────────────────────────────────────────────
# Fondamenti dell'insegnamento del latino con metodo naturale

DID_PRINCIPIA = [
  {
    "textFragment": "Incontro 1: Perché insegnare il latino diversamente? Storia e critica del metodo tradizionale. Dal 'grammatica-traduzione' al metodo diretto. I principia del cambio metodologico.",
    "contentSummary": "Primo incontro del corso did-principia. Analisi storica del metodo grammatica-traduzione: origini nel XVIII secolo, dominanza nel sistema scolastico italiano, criticità pedagogiche. Confronto con il metodo diretto e i principi della glottodidattica moderna. Perché cambiare è difficile e necessario. Storie di insegnanti che hanno cambiato approccio.",
    "keyVocabulary": [{"term": "metodo grammatica-traduzione", "meaning": "metodo tradizionale: spiegazione grammaticale + traduzione di brani, senza comunicazione in L2"}, {"term": "metodo diretto", "meaning": "insegnamento della L2 nella L2 stessa, con input comprensibile e senza traduzione"}, {"term": "glottodidattica", "meaning": "scienza dell'insegnamento delle lingue, integra linguistica, psicologia e pedagogia"}],
    "learningObjectives": "Il docente conosce la storia del metodo grammatica-traduzione e le sue criticità. Comprende i principi fondamentali del cambio metodologico. Sa motivare la scelta del metodo diretto verso colleghi e famiglie."
  },
  {
    "textFragment": "Incontro 2: Il testo come centro. Come scegliere, adattare e usare i testi latini in classe. Dall'iscrizione epigrafica alla narrazione LLPSI. Cosa rende un testo didatticamente efficace.",
    "contentSummary": "Secondo incontro del corso did-principia. Il testo autentico (iscrizioni, Seneca, Cicerone) e il testo adattato (LLPSI, Ecce Romani) come strumenti didattici diversi con funzioni diverse. Criteri di scelta: lunghezza, lessico, strutture grammaticali, interesse culturale. Come adattare un testo autentico per renderlo accessibile. Esempi pratici con iscrizioni CIL e testi LLPSI.",
    "keyVocabulary": [{"term": "testo autentico", "meaning": "testo prodotto da autori latini per lettori latini, non pensato per l'insegnamento"}, {"term": "testo adattato", "meaning": "testo modificato o creato appositamente per l'insegnamento, con difficoltà controllata"}, {"term": "CIL", "meaning": "Corpus Inscriptionum Latinarum, raccolta sistematica di iscrizioni latine"}],
    "learningObjectives": "Il docente sa distinguere testi autentici da testi adattati e quando usare ciascuno. Conosce i criteri per valutare la difficoltà di un testo. Sa adattare un testo autentico per renderlo accessibile al livello dei propri studenti."
  },
  {
    "textFragment": "Attività in autoapprendimento (incontro 2): Seleziona un testo latino autentico di max 5 righe. Analizza il lessico con una lista di frequenza. Proponi un adattamento per principianti. Porta il risultato all'incontro successivo.",
    "contentSummary": "Attività autonoma associata al secondo incontro di did-principia. Il corsista sceglie un testo autentico breve (massimo 5 righe), ne analizza il vocabolario con una lista di frequenza latina (DCC o simile), identifica le parole rare, e propone un adattamento semplificato per studenti principianti. L'attività sviluppa la competenza di selezione e adattamento testuale.",
    "keyVocabulary": [{"term": "analisi di frequenza", "meaning": "esame del vocabolario di un testo rispetto a una lista delle parole più comuni"}, {"term": "semplificazione lessicale", "meaning": "sostituzione di parole rare con parole più comuni a parità di significato"}, {"term": "testo parallelo", "meaning": "testo originale e testo adattato a confronto"}],
    "learningObjectives": "Il corsista sa analizzare il lessico di un testo con strumenti di frequenza. Sa proporre un adattamento lessicale motivato. Sviluppa autonomia nella selezione dei materiali didattici."
  },
  {
    "textFragment": "Incontro 3: La grammatica nel metodo naturale. Non 'spiega la regola, applica la regola' ma 'scopri la regola attraverso molti esempi'. Focus on form contestuale. Come presentare il nominativo e l'accusativo senza paradigmi.",
    "contentSummary": "Terzo incontro del corso did-principia. Mostra come introdurre casi grammaticali fondamentali (nominativo, accusativo) attraverso esempi contestuali e scoperta induttiva, senza presentare paradigmi decontestualizzati. Il docente legge frasi ('Marcus amat Iuliam / Iulia amat Marcum') e guida gli studenti a scoprire la funzione delle terminazioni. Applicazione del focus on form.",
    "keyVocabulary": [{"term": "nominativo", "meaning": "caso del soggetto della frase latina"}, {"term": "accusativo", "meaning": "caso del complemento oggetto diretto in latino"}, {"term": "paradigma", "meaning": "tavola delle forme flessive di un sostantivo o verbo, presentata in modo sistematico"}],
    "learningObjectives": "Il docente sa introdurre i casi latini in modo induttivo senza paradigmi. Conosce tecniche di focus on form per nominativo e accusativo. Sa guidare la scoperta della funzione delle terminazioni attraverso esempi narrativi."
  },
  {
    "textFragment": "Attività in autoapprendimento (incontro 3): Progetta una sequenza di 10 frasi graduate per introdurre il genitivo di possesso in modo induttivo. Usa nomi e situazioni familiari agli studenti.",
    "contentSummary": "Attività autonoma associata al terzo incontro di did-principia. Il corsista progetta una sequenza di 10 frasi graduate per introdurre il genitivo di possesso in modo induttivo: dalla frase più semplice alla più complessa, con lessico controllato e contesto narrativo coerente. L'attività sviluppa la competenza di progettazione di sequenze grammaticali contestualizzate.",
    "keyVocabulary": [{"term": "genitivo di possesso", "meaning": "uso del genitivo latino per indicare appartenenza: 'liber Marci' = il libro di Marco"}, {"term": "sequenza graduata", "meaning": "serie di frasi o testi con difficoltà crescente"}, {"term": "contesto narrativo", "meaning": "cornice di storia che dà senso alle frasi isolate"}],
    "learningObjectives": "Il corsista sa progettare sequenze grammaticali induttive. Conosce il principio di gradazione della difficoltà. Sa creare contesti narrativi che rendono significative le strutture grammaticali."
  },
  {
    "textFragment": "Incontro 4: Cultura e civiltà nel metodo naturale. Come integrare storia, arte, religione romana nell'insegnamento linguistico. Il testo come finestra sulla cultura. Non 'ora facciamo cultura', ma 'la lingua porta sempre cultura'.",
    "contentSummary": "Quarto incontro del corso did-principia. Affronta l'integrazione lingua-cultura: come usare l'insegnamento del latino per trasmettere anche conoscenze storiche, artistiche, religiose, sociali del mondo romano. Il testo come documento culturale: cosa ci dice sulla vita quotidiana, sui valori, sulla visione del mondo. Esempi: iscrizioni funerarie, testi di Plinio il Giovane, epistole di Cicerone come fonti culturali.",
    "keyVocabulary": [{"term": "competenza interculturale", "meaning": "capacità di comprendere e confrontare culture diverse, anche storicamente distanti"}, {"term": "documento culturale", "meaning": "testo che rivela aspetti della cultura che lo ha prodotto"}, {"term": "vita quotidiana", "meaning": "aspetti materiali e sociali della vita ordinaria nel mondo romano"}],
    "learningObjectives": "Il docente sa integrare contenuti culturali nell'insegnamento linguistico. Conosce fonti primarie che testimoniano la vita quotidiana romana. Sa usare un testo latino come documento culturale senza ridurlo a esercizio grammaticale."
  },
  {
    "textFragment": "Incontro 5: Pianificazione dell'anno. Come strutturare un corso annuale con metodo naturale. Progressione linguistica e culturale. Momenti forti: recitazione, scrittura creativa, uscita didattica. Riflessione sul cammino percorso.",
    "contentSummary": "Quinto e conclusivo incontro del corso did-principia. Guida il docente nella pianificazione di un intero anno scolastico con metodo naturale: progressione linguistica (dal lessico di base alle strutture complesse), progressione culturale (dalla famiglia romana alla storia di Roma), momenti culminanti (recitazione di un testo, progetto di scrittura creativa in latino, visita a un sito archeologico). Riflessione sul percorso formativo e sulle sfide future.",
    "keyVocabulary": [{"term": "progressione curricolare", "meaning": "sequenza planificata di contenuti linguistici e culturali lungo un anno o un ciclo"}, {"term": "momento forte", "meaning": "attività culminante che motiva e dà senso al percorso"}, {"term": "scrittura creativa", "meaning": "produzione di testi originali in latino (poesie, storie, dialoghi)"}],
    "learningObjectives": "Il docente sa progettare la progressione di un intero anno di latino con metodo naturale. Conosce come integrare momenti forti (recitazione, scrittura creativa) nel piano didattico. Ha sviluppato una visione coerente e motivata del proprio approccio metodologico."
  },
]

# ─── DID-TERTIA (5 lezioni) ───────────────────────────────────────────────────
# Insegnare la letteratura in lingua: dalla lettura al commento al testo in aula

DID_TERTIA = [
  {
    "textFragment": "Incontro 1: Insegnare la letteratura latina in lingua — obiettivi e sfide. Cosa significa leggere Virgilio in latino con gli studenti? La differenza tra analisi letteraria e lettura competente. Obiettivi linguistici e culturali integrati.",
    "contentSummary": "Primo incontro del corso did-tertia. Parte da una domanda centrale: cosa vuol dire insegnare letteratura latina 'in lingua'? Distingue l'approccio filologico-tradizionale (traduzione + analisi) dall'approccio integrato (lettura competente + commento nella L2). Obiettivi: sviluppare la capacità di leggere Virgilio, Orazio, Cicerone direttamente, con commento in latino semplice. Sfide: livello avanzato richiesto, testi autentici difficili.",
    "keyVocabulary": [{"term": "lettura competente", "meaning": "capacità di leggere un testo nella lingua originale con comprensione diretta"}, {"term": "commento in L2", "meaning": "spiegazione e analisi del testo nella lingua target"}, {"term": "approccio filologico", "meaning": "metodo che privilegia l'analisi formale del testo (metrica, sintassi, retorica)"}],
    "learningObjectives": "Il docente comprende la distinzione tra approccio filologico e lettura competente. Sa definire obiettivi integrati (linguistici e letterari) per un corso di letteratura latina in lingua. Riconosce le sfide specifiche dell'insegnamento di testi autentici avanzati."
  },
  {
    "textFragment": "Incontro 2: Le fasi del percorso — prima della lettura. Pre-reading activities: come preparare gli studenti prima di affrontare un testo difficile. Contesto storico, biografia dell'autore, intertestualità. In latino.",
    "contentSummary": "Secondo incontro del corso did-tertia. Affronta la fase pre-lettura per testi letterari avanzati: come preparare il contesto storico-culturale, la biografia dell'autore, il genere letterario — tutto in latino semplice. Tecniche: presentazione orale in latino del contesto, lettura di testi preparatori più facili, visione di immagini commentate in latino. Esempio: preparare la lettura del libro IV dell'Eneide con una presentazione su Didone e Cartagine.",
    "keyVocabulary": [{"term": "intertestualità", "meaning": "relazioni tra testi: come un testo richiama, cita o rilegge altri testi"}, {"term": "genere letterario", "meaning": "categoria a cui appartiene un testo (epica, elegia, oratoria, ecc.) con convenzioni proprie"}, {"term": "contesto storico-culturale", "meaning": "insieme di eventi, idee e valori del periodo in cui un testo è stato prodotto"}],
    "learningObjectives": "Il docente sa progettare attività di pre-lettura per testi letterari latini avanzati. Sa presentare il contesto storico-culturale e la biografia dell'autore in latino semplice. Conosce il concetto di intertestualità e sa usarlo nella preparazione alla lettura."
  },
  {
    "textFragment": "Incontro 3: Le fasi del percorso — la lettura. Come leggere un testo letterario con la classe: lettura ad alta voce, lettura silenziosa, lettura analitica. Il commento linea per linea in latino. Virgilio Aen. I, 1-7 come caso studio.",
    "contentSummary": "Terzo incontro del corso did-tertia. Mostra in pratica come condurre la lettura di un testo letterario autentico con la classe. Sequenza: lettura magistrale ad alta voce (modello di pronuncia e ritmo), lettura silenziosa individuale, discussione guidata in latino. Commento linea per linea: analisi grammaticale contestuale, osservazioni stilistiche, riferimenti intertestuali. Caso studio: Aeneid I, 1-7 ('Arma virumque cano...').",
    "keyVocabulary": [{"term": "lettura magistrale", "meaning": "lettura del testo da parte del docente come modello di pronuncia e comprensione"}, {"term": "commento linea per linea", "meaning": "analisi sequenziale del testo con note grammaticali, lessicali e culturali"}, {"term": "arma virumque cano", "meaning": "incipit dell'Eneide di Virgilio (I,1): 'Canto le armi e l'eroe'"}],
    "learningObjectives": "Il docente sa condurre la lettura di un testo letterario latino con tecniche diverse. Sa commentare un testo linea per linea in latino semplice. Conosce l'incipit dell'Eneide e sa usarlo come caso studio."
  },
  {
    "textFragment": "Incontro 4: La valutazione nella letteratura in lingua. Come valutare la competenza di lettura letteraria. Dalla comprensione del testo all'analisi stilistica. Prove orali e scritte in latino.",
    "contentSummary": "Quarto incontro del corso did-tertia. Affronta la valutazione specifica per corsi di letteratura latina in lingua: come misurare la competenza di lettura autonoma, la capacità di commento, la comprensione del contesto. Strumenti: domande di comprensione in latino, analisi guidata di un breve passaggio, saggio breve in latino su un tema letterario, interrogazione orale con discussione del testo. Costruzione di rubriche specifiche.",
    "keyVocabulary": [{"term": "saggio breve", "meaning": "elaborato scritto argomentativo di lunghezza limitata (300-500 parole)"}, {"term": "analisi stilistica", "meaning": "studio delle scelte formali di un autore (metafore, struttura sintattica, ritmo, figure retoriche)"}, {"term": "rubrica di valutazione", "meaning": "griglia con criteri e descrittori di livello per la valutazione"}],
    "learningObjectives": "Il docente sa costruire prove di valutazione per la lettura letteraria in latino. Conosce strumenti per valutare la comprensione e l'analisi stilistica. Sa costruire rubriche specifiche per la competenza letteraria."
  },
  {
    "textFragment": "Incontro 5: Roma Aeterna — la preparazione dell'insegnante. Come il docente si prepara culturalmente e linguisticamente per insegnare i grandi testi latini. Lettura personale, aggiornamento, comunità di pratica.",
    "contentSummary": "Quinto e conclusivo incontro del corso did-tertia. Affronta la formazione continua del docente: come mantenersi aggiornati culturalmente (lettura di studi filologici, partecipazione a convegni), linguisticamente (lettura personale di testi latini difficili), metodologicamente (comunità di pratica con altri insegnanti). Roma Aeterna: il latino non finisce mai di essere scoperto. Il docente come eterno apprendente.",
    "keyVocabulary": [{"term": "comunità di pratica", "meaning": "gruppo di professionisti che condividono esperienza e conoscenza per migliorarsi reciprocamente"}, {"term": "formazione continua", "meaning": "aggiornamento professionale permanente durante la carriera"}, {"term": "docente riflessivo", "meaning": "insegnante che analizza criticamente la propria pratica per migliorarla"}],
    "learningObjectives": "Il docente comprende l'importanza della formazione continua per insegnare letteratura latina. Conosce risorse per il proprio aggiornamento (riviste, convegni, comunità online). Ha sviluppato una visione del proprio ruolo come docente-ricercatore."
  },
]

# ─── IDS ──────────────────────────────────────────────────────────────────────

IDS = {
  'did-elementa': [
    'a991fa39-bbc7-4750-bc4d-bf26aea3d64a',
    'e873aa38-c8ed-4f07-9a88-54cd1dd56641',
    '439f27ba-ca29-45a6-9042-12a21f76bbab',
    '75ee2e53-11a8-4263-8b5e-13d5d41ee112',
    'a9bcb2db-f445-4ad7-befb-18c5f0fd1051',
    'e2ba12d2-0b52-4a51-9fc9-321d10fe5ea1',
    '6614df23-773f-4a81-b134-31eea46ec7dc',
    '4e71bb8b-2f74-4eed-a2db-017d54bfe96e',
  ],
  'did-grammatica': [
    '65bbbe46-1b99-40c8-9206-ddf51c2461d6',
    '9951f9bf-f411-40fc-b919-1b372bd7f237',
    'e3c06d87-76d1-41e4-bedc-af118910a5d6',
    '6c3f8e0a-9096-4f9d-82d3-c07ca2054e79',
    'f58f8c35-94b6-4495-8934-7f1a2b5dbd8a',
    'bd6963ea-6015-42a5-85cc-b58282f4d1dd',
    'f494d52b-849f-4dfe-874e-e0bd426a0b02',
    '1c4c9482-28a9-499d-aaa8-b302be6a4686',
    '895fb3c5-87ef-4795-b500-ac3234f65163',
    'b29f5d30-e36a-414b-b3da-bf135fd1bc35',
  ],
  'did-principia': [
    'd6e17cd0-18ea-49de-80b1-be9cc84572ae',
    '92388fca-2c99-4961-97fc-4570174bc0af',
    '58284701-033d-40a1-bf29-30b81f9c4c6f',
    '9db19d76-1d62-4fea-9893-469865fd5589',
    'dd0949c0-8336-4fea-b48c-66f527e2a3b7',
    '0abe45be-d32d-41f0-89e1-67c6110236b5',
    '7c61936c-7c3c-4106-85a9-c9194a7636c3',
  ],
  'did-tertia': [
    '5eda0fcd-52c3-4ab3-bd18-ea659d70f10b',
    '67fd5ea8-b3ec-45c9-8db2-1ca66c2396a7',
    '1dfcb570-17a5-4682-9508-876ed764e7a6',
    'f1081d0a-0f78-4cbf-9967-2ff3c7dce504',
    '51ae849b-5c96-4d7f-9e2f-72273277e715',
  ],
}

DATASETS = [
  ('did-elementa', DID_ELEMENTA),
  ('did-grammatica', DID_GRAMMATICA),
  ('did-principia', DID_PRINCIPIA),
  ('did-tertia', DID_TERTIA),
]

def run():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    total = 0
    for slug, data in DATASETS:
        ids = IDS[slug]
        assert len(ids) == len(data), f"{slug}: {len(ids)} IDs vs {len(data)} records"
        for lid, lesson in zip(ids, data):
            cur.execute("""
                UPDATE "Lesson"
                SET "textFragment"=%s, "contentSummary"=%s,
                    "keyVocabulary"=%s::jsonb, "learningObjectives"=%s
                WHERE id=%s
            """, (
                lesson["textFragment"],
                lesson["contentSummary"],
                json.dumps(lesson["keyVocabulary"], ensure_ascii=False),
                lesson["learningObjectives"],
                lid
            ))
            total += 1
        print(f"  ✓ {slug}: {len(data)} lezioni")
    conn.commit()
    conn.close()
    print(f"\nTotale: {total} lezioni Didattica aggiornate")

if __name__ == "__main__":
    run()
