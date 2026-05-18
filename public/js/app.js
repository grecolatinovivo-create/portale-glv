/* ============================================================
   PORTALE GLV — app.js v2 (API-connected)
   Chiamate reali a /api/*  — il mock è usato solo come fallback
   in assenza di backend attivo (apertura diretta da file system).
   ============================================================ */

/* ── Config ────────────────────────────────────────────────── */
const API = {
  BASE: window.location.origin.startsWith('file:') ? 'http://localhost:3000' : '',
  async get(path) {
    const r = await fetch(`${API.BASE}${path}`, { credentials:'include' });
    const text = await r.text();
    try { return JSON.parse(text); } catch { return { error: `Risposta non JSON (${r.status}): ${text.slice(0,120)}` }; }
  },
  async post(path, body) {
    const r = await fetch(`${API.BASE}${path}`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const text = await r.text();
    try { return JSON.parse(text); } catch { return { error: `Risposta non JSON (${r.status}): ${text.slice(0,120)}` }; }
  },
  async put(path, body) {
    const r = await fetch(`${API.BASE}${path}`, { method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const text = await r.text();
    try { return JSON.parse(text); } catch { return { error: `Risposta non JSON (${r.status}): ${text.slice(0,120)}` }; }
  },
};

/* ── Mock Data (fallback per preview statica) ──────────────── */
/* Dati sincronizzati dal DB Serverplan (ytgrecol_grecolatinovivo) — maggio 2026 */
const MOCK_COURSES = [
  // ── LATINO ─────────────────────────────────────────────────
  { id:'lat-a11', slug:'lat-a11', lang:'Latino', level:'A1.1', title:'Corso di lingua latina A1.1 • E-Learning', description:'Parti da zero con un metodo rigoroso basato sulle ricerche neurocognitive. Declinazioni, morfologia nominale, verbo esse.', priceEur:13000, isNew:false, progressPercent:65, hours:24, teacher:'Giampiero Marchi', idc:372 },
  { id:'lat-a12', slug:'lat-a12', lang:'Latino', level:'A1.2', title:'Corso di lingua latina A1.2 • E-Learning', description:'Terza, quarta e quinta declinazione. Struttura grammaticale del latino: concordanze, forme verbali, prime strutture del periodo.', priceEur:13000, isNew:false, progressPercent:0,  hours:24, teacher:'Giampiero Marchi', idc:374 },
  { id:'lat-a21', slug:'lat-a21', lang:'Latino', level:'A2.1', title:'Corso di lingua latina A2.1 • E-Learning', description:'Sistema dei casi completo, concordanze avanzate, forme verbali essenziali. Prime letture di testi autentici adattati.', priceEur:15000, isNew:false, progressPercent:0,  hours:24, teacher:'Giampiero Marchi', idc:377 },
  { id:'lat-a22', slug:'lat-a22', lang:'Latino', level:'A2.2', title:'Corso di lingua latina A2.2 • E-Learning', description:'Accusativo con infinito, ablativo assoluto, subordinate finali e causali. Approfondimento sintattico e lessicale.', priceEur:15000, isNew:false, progressPercent:0,  hours:24, teacher:'Giampiero Marchi', idc:378 },
  { id:'lat-b11', slug:'lat-b11', lang:'Latino', level:'B1.1', title:'Corso di lingua latina B1.1 • E-Learning', description:'Lettura di Cicerone e Cesare in originale. Analisi retorica del testo, strutture sintattiche avanzate, traduzione guidata.', priceEur:18000, isNew:false, progressPercent:0,  hours:24, teacher:'Giampiero Marchi', idc:432 },
  { id:'lat-b12', slug:'lat-b12', lang:'Latino', level:'B1.2', title:'Corso di lingua latina B1.2 • E-Learning', description:'Virgilio e la poesia epica: Eneide, metrica latina, figure retoriche. Introduzione alla poesia augustea.', priceEur:18000, isNew:false, progressPercent:0,  hours:24, teacher:'Giampiero Marchi', idc:433 },
  { id:'lat-b13', slug:'lat-b13', lang:'Latino', level:'B1.3', title:'Corso di lingua latina B1.3 • E-Learning', description:'Ovidio, Orazio e la poesia lirica. Elegia latina, epigramma, generi poetici del I sec. a.C.', priceEur:18000, isNew:false, progressPercent:0,  hours:24, teacher:'Giampiero Marchi', idc:434 },
  // ── GRECO ANTICO ───────────────────────────────────────────
  { id:'gr-a11',  slug:'gr-a11',  lang:'Greco Antico', level:'A1.1', title:'Corso di greco antico A1.1 • E-Learning', description:'Alfabeto greco, pronuncia restituita, prime declinazioni e coniugazioni. 18 ore in 12 lezioni da 90 minuti.', priceEur:13000, isNew:false, progressPercent:30, hours:24, teacher:'Giampiero Marchi', idc:373 },
  { id:'gr-a12',  slug:'gr-a12',  lang:'Greco Antico', level:'A1.2', title:'Corso di greco antico A1.2 • E-Learning', description:'Il verbo contratto, il sistema verbale greco, le particelle. Accesso a biblioteca digitale di testi greci antichi.', priceEur:13000, isNew:false, progressPercent:0,  hours:24, teacher:'Giampiero Marchi', idc:375 },
  { id:'gr-a21',  slug:'gr-a21',  lang:'Greco Antico', level:'A2.1', title:'Corso di greco antico A2.1 • E-Learning', description:'Testi da Platone e Senofonte adattati. Il periodo ipotetico. Biblioteca digitale inclusa.', priceEur:15000, isNew:false, progressPercent:0,  hours:24, teacher:'Giampiero Marchi', idc:381 },
  { id:'gr-a22',  slug:'gr-a22',  lang:'Greco Antico', level:'A2.2', title:'Corso di greco antico A2.2 • E-Learning', description:'Il participio greco: usi e costrutti. Sintassi del periodo complesso. Letture da Plutarco e Luciano.', priceEur:15000, isNew:false, progressPercent:0,  hours:24, teacher:'Giampiero Marchi', idc:380 },
  { id:'gr-b11',  slug:'gr-b11',  lang:'Greco Antico', level:'B1.1', title:'Corso di greco antico B1.1 • E-Learning', description:"Omero: lettura dell'Iliade in originale. Metrica epica, dialetto ionico, formulaicità omerica.", priceEur:18000, isNew:false, progressPercent:0,  hours:24, teacher:'Giulio Bianchi', idc:435 },
  { id:'gr-b12',  slug:'gr-b12',  lang:'Greco Antico', level:'B1.2', title:'Corso di greco antico B1.2 • E-Learning', description:'I tragici greci: Sofocle, Euripide, la struttura del dramma attico. Letture in originale.', priceEur:18000, isNew:false, progressPercent:0,  hours:24, teacher:'Giulio Bianchi', idc:436 },
  { id:'gr-b13',  slug:'gr-b13',  lang:'Greco Antico', level:'B1.3', title:'Corso di greco antico B1.3 • E-Learning', description:'Lirici greci, Pindaro, Saffo. Filosofia presocratica in lingua. Storiografia: Tucidide.', priceEur:18000, isNew:false, progressPercent:0,  hours:24, teacher:'Giulio Bianchi', idc:437 },
  // ── EGIZIANO GEROGLIFICO ────────────────────────────────────
  { id:'eg-a11',  slug:'eg-a11',  lang:'Egiziano Geroglifico', level:'A1.1', title:'Corso di Egiziano Geroglifico A1.1 • E-Learning', description:'I geroglifici: logogrammi e fonogrammi. Lettura delle prime iscrizioni. Introduzione al medio-egiziano.', priceEur:17000, isNew:false, progressPercent:0, hours:24, teacher:'Ilaria Cariddi', idc:382 },
  { id:'eg-a12',  slug:'eg-a12',  lang:'Egiziano Geroglifico', level:'A1.2', title:'Corso di Egiziano Geroglifico A1.2 • E-Learning', description:'Il medio-egiziano: morfologia nominale, il verbo egiziano. Testi del Medio Regno.', priceEur:17000, isNew:false, progressPercent:0, hours:24, teacher:'Ilaria Cariddi', idc:430 },
  { id:'eg-a21',  slug:'eg-a21',  lang:'Egiziano Geroglifico', level:'A2',   title:'Corso di Egiziano Geroglifico A2 • E-Learning',   description:'Testi autentici: il Libro dei Morti, iscrizioni tombali, letteratura del Medio Regno.', priceEur:19000, isNew:false, progressPercent:0, hours:24, teacher:'Ilaria Cariddi', idc:431 },
  // ── EBRAICO BIBLICO ─────────────────────────────────────────
  { id:'eb-a11',  slug:'eb-a11',  lang:'Ebraico Biblico', level:'A1.1', title:'Ebraico Biblico A1.1 • E-Learning', description:"L'alfabeto ebraico, scrittura destra-sinistra, vocali masoretiche. 18 ore di formazione.", priceEur:17000, isNew:false, progressPercent:0, hours:24, teacher:'Alberto Bibbiani', idc:383 },
  { id:'eb-a12',  slug:'eb-a12',  lang:'Ebraico Biblico', level:'A1.2', title:'Ebraico Biblico A1.2 • E-Learning', description:'Il verbo forte, prime radici trilittere. Lettura del Genesi in originale.', priceEur:17000, isNew:false, progressPercent:0, hours:24, teacher:'Alberto Bibbiani', idc:428 },
  { id:'eb-a21',  slug:'eb-a21',  lang:'Ebraico Biblico', level:'A2',   title:'Ebraico Biblico A2 • E-Learning',   description:'La prosa narrativa biblica: Esodo, Salmi, sintassi ebraica avanzata.', priceEur:19000, isNew:false, progressPercent:0, hours:24, teacher:'Alberto Bibbiani', idc:429 },
  // ── FORMAZIONE PER DOCENTI ──────────────────────────────────
  { id:'did-elementa',   slug:'did-elementa',   lang:'Didattica', level:'Formazione – Modulo 1', title:'Didattica del Latino: Pars Prima – Elementa',            description:'Metodo induttivo-contestuale per principianti: morfologia nominale, lessico, prime declinazioni. 10h video + 10h autoapprendimento. Bonus Docenti attivo.', priceEur:15000, isNew:false, progressPercent:0, hours:20, bonusDocenti:true, targetDocenti:true, teacher:'Giampiero Marchi', idc:388 },
  { id:'did-principia',  slug:'did-principia',  lang:'Didattica', level:'Formazione – Modulo 2', title:'Didattica del Latino: Pars Secunda – Principia',          description:'Livello intermedio: morfologia verbale, sintassi, testi autentici. Prerequisito: Elementa. 10h video + 10h autonomo. Bonus Docenti attivo.', priceEur:18000, isNew:false, progressPercent:0, hours:20, bonusDocenti:true, targetDocenti:true, teacher:'Giampiero Marchi', idc:389 },
  { id:'did-grammatica', slug:'did-grammatica', lang:'Didattica', level:'Formazione – Percorso', title:'Grammatica Latina e Buone Pratiche Didattiche',           description:'Metodologia grammaticale-traduttiva e glottodidattica. Come rendere la grammatica più efficace in classe. 20 ore in 10 parti. Bonus Docenti attivo.', priceEur:17000, isNew:false, progressPercent:0, hours:20, bonusDocenti:true, targetDocenti:true, teacher:'Marta Giannico', idc:392 },
  { id:'did-tertia',     slug:'did-tertia',     lang:'Didattica', level:'Formazione – Modulo 3', title:'Didattica della Letteratura Latina: Pars Tertia – Litterae', description:'Letteratura latina in classe: approcci, testi, metodi. Come rendere la letteratura classica viva e accessibile. Bonus Docenti attivo.', priceEur:18000, isNew:true,  progressPercent:0, hours:20, bonusDocenti:true, targetDocenti:true, teacher:'Giampiero Marchi', idc:448 },
  // ── CORSI BREVI — tutti, aperti e non ancora disponibili ────
  { id:'breve-marziale',         slug:'breve-marziale',         lang:'Corsi Brevi', level:'Autori Latini',         title:'Marziale per principianti avanzati', description:'Ironia e critica della società del benessere negli Epigrammi. 4 ore.', priceEur:2900,  isNew:false, progressPercent:0, hours:4, available:true, teacher:'Giampiero Marchi',  idc:406 },
  { id:'breve-tradurre',         slug:'breve-tradurre',         lang:'Corsi Brevi', level:'Metodo',                title:'Tradurre senza scomporre', description:'Un approccio neuroscientifico al testo classico: come tradurre con fluidità. 4 ore.', priceEur:2900,  isNew:false, progressPercent:0, hours:4, available:true, teacher:'Giampiero Marchi',  idc:439 },
  { id:'breve-japonia',          slug:'breve-japonia',          lang:'Corsi Brevi', level:'Autori Latini',         title:'Terra Japonia: un viaggio in latino nel Giappone del Cinquecento', description:'Un testo in latino del XVI secolo che racconta il Giappone. Lettura guidata. 4 ore.', priceEur:2900,  isNew:false, progressPercent:0, hours:4, available:false, teacher:'Marta Giannico', idc:440 },
  { id:'breve-metrica',          slug:'breve-metrica',          lang:'Corsi Brevi', level:'Metodo',                title:'Il ritmo del verso: approccio neuroscientifico alla metrica classica', description:'Come il cervello elabora il ritmo poetico. Metrica latina e greca in chiave cognitiva. 4 ore.', priceEur:2900,  isNew:false, progressPercent:0, hours:4, available:false, teacher:'Giampiero Marchi', idc:441 },
  { id:'breve-catullo',          slug:'breve-catullo',          lang:'Corsi Brevi', level:'Autori Latini',         title:'Catullo per principianti avanzati', description:'Passioni, invettive e vita quotidiana al tramonto della Repubblica. 4 ore.', priceEur:3900,  isNew:true,  progressPercent:0, hours:4, available:true, teacher:'Giampiero Marchi',  idc:454 },
  { id:'breve-sacro-romano',     slug:'breve-sacro-romano',     lang:'Corsi Brevi', level:'Civiltà Romana',        title:'Pensare e fare il sacro: un percorso religioso romano', description:'Riti, culti, divinità e spazio sacro nella Roma antica. 6 ore in asincrono.', priceEur:6000,  isNew:false, progressPercent:0, hours:6, available:true, teacher:'Emanuele Viotti',  idc:360 },
  { id:'breve-dei-uomini',       slug:'breve-dei-uomini',       lang:'Corsi Brevi', level:'Civiltà Romana',        title:'Tra Dèi e Uomini: il mito come fondamento di Roma', description:'Il mito come fondamento della Roma religiosa e civile. 6 ore in asincrono.', priceEur:6000,  isNew:false, progressPercent:0, hours:6, available:true, teacher:'Emanuele Viotti',  idc:368 },
  { id:'breve-conclave',         slug:'breve-conclave',         lang:'Corsi Brevi', level:'Storia della Chiesa',   title:'Conclave: le bolle papali che decidono la Chiesa', description:'Storia e linguaggio delle bolle papali. Dal latino dei documenti pontifici alla politica ecclesiastica. 4 ore.', priceEur:6000,  isNew:false, progressPercent:0, hours:4, available:true, teacher:'Giampiero Marchi',  idc:427 },
  { id:'breve-voci-vangeli',     slug:'breve-voci-vangeli',     lang:'Corsi Brevi', level:'Bibbia e Antichità',    title:'Voci dei Vangeli: un viaggio dalle Radici alla Rivelazione', description:'I Vangeli nel loro contesto storico, linguistico e culturale. 6 ore.', priceEur:6000,  isNew:false, progressPercent:0, hours:6, available:false, teacher:'Alberto Bibbiani', idc:337 },
  { id:'breve-storie-latine',    slug:'breve-storie-latine',    lang:'Corsi Brevi', level:'Autori Latini',         title:"Dall'Antico al Moderno: Storie in Lingua Latina", description:'Lettura di testi latini medievali e moderni che narrano storie di ogni epoca. 6 ore.', priceEur:6000,  isNew:false, progressPercent:0, hours:6, available:false, teacher:'Maria Di Puorto', idc:338 },
  { id:'breve-buona-novella',    slug:'breve-buona-novella',    lang:'Corsi Brevi', level:'Bibbia e Antichità',    title:'La Buona Novella tra greco e latino', description:'Il Vangelo nelle sue versioni greca e latina: confronto linguistico e teologico. 6 ore.', priceEur:7000,  isNew:false, progressPercent:0, hours:6, available:false, teacher:'Giampiero Marchi', idc:276 },
  { id:'breve-padri-chiesa',     slug:'breve-padri-chiesa',     lang:'Corsi Brevi', level:'Bibbia e Antichità',    title:'Il Vangelo attraverso i Padri della Chiesa', description:'Lettura e interpretazione patristica del Vangelo: Agostino, Gregorio, Ambrogio. 6 ore.', priceEur:7000,  isNew:false, progressPercent:0, hours:6, available:false, teacher:'Andrés Reyes Cabrera', idc:286 },
  { id:'breve-echi-marmo',       slug:'breve-echi-marmo',       lang:'Corsi Brevi', level:'Arte Antica',           title:"Echi di Marmo: viaggio nell'Arte Greca da Omero ad Alessandro", description:'Scultura, ceramica e architettura greca nel contesto storico e letterario. 6 ore.', priceEur:9000,  isNew:false, progressPercent:0, hours:6, available:true, teacher:'Roberto Melfi',  idc:370 },
  { id:'breve-schiavitu',        slug:'breve-schiavitu',        lang:'Corsi Brevi', level:'Storia Antica',         title:'Vite in catene: la Schiavitù nel Mondo Antico', description:'Storia, diritto e filosofia della schiavitù nel mondo greco-romano. Fonti antiche. 6 ore.', priceEur:9000,  isNew:false, progressPercent:0, hours:6, available:true, teacher:'Rossano Fragale',  idc:418 },
  { id:'breve-etruschi',         slug:'breve-etruschi',         lang:'Corsi Brevi', level:'Archeologia',           title:'Tracce Etrusche: origini, espansioni, eredità di una civiltà', description:'Dalla Villanove alla romanizzazione: la civiltà etrusca attraverso le sue testimonianze materiali. 8 ore.', priceEur:9000,  isNew:false, progressPercent:0, hours:8, available:false, teacher:'Mattia Scarpetta', idc:339 },
  { id:'breve-nubia-egitto',     slug:'breve-nubia-egitto',     lang:'Corsi Brevi', level:'Archeologia',           title:'Tra due Mondi: Nubia ed Egitto sulla linea di confine', description:'Il rapporto tra Egitto e Nubia: conflitto, scambio culturale, ibridazione artistica. 6 ore.', priceEur:9000,  isNew:false, progressPercent:0, hours:6, available:false, teacher:'Francesca Iannarilli', idc:340 },
  { id:'breve-archeologia',      slug:'breve-archeologia',      lang:'Corsi Brevi', level:'Archeologia',           title:"Testimonianze del Tempo: un viaggio nell'Archeologia Applicata", description:'Come si fa archeologia: metodo, scavo, interpretazione. 4 ore.', priceEur:9000,  isNew:false, progressPercent:0, hours:4, available:false, teacher:'Roberto Melfi', idc:341 },
  { id:'breve-passione',         slug:'breve-passione',         lang:'Corsi Brevi', level:'Bibbia e Antichità',    title:'Prospettive di Passione: gli ultimi giorni di Gesù nei Vangeli', description:'Confronto sinottico della Passione nei quattro Vangeli: stile, teologia, storicità. 6 ore.', priceEur:9000,  isNew:false, progressPercent:0, hours:6, available:false, teacher:'Alberto Bibbiani', idc:349 },
  { id:'breve-pompei',           slug:'breve-pompei',           lang:'Corsi Brevi', level:'Archeologia',           title:'Voci silenziose di Pompei: scoperte epigrafiche nella città sepolta', description:'Le iscrizioni di Pompei: graffiti, tituli, dipinti elettorali. Lettura e contesto. 8 ore.', priceEur:9000,  isNew:false, progressPercent:0, hours:8, available:false, teacher:'Marta Giannico', idc:350 },
  { id:'breve-miniera-luna',     slug:'breve-miniera-luna',     lang:'Corsi Brevi', level:'Filosofia Antica',      title:"Dalla Miniera alla Luna: Pirandello e Verga tra esistenza e letteratura", description:'Percorso letterario tra i due grandi autori siciliani: tema del destino, della natura, della lotta. 6 ore.', priceEur:9000,  isNew:false, progressPercent:0, hours:6, available:false, teacher:'Alessandra Chiusaroli', idc:361 },
  { id:'breve-algoritmica',      slug:'breve-algoritmica',      lang:'Corsi Brevi', level:'Filosofia Antica',      title:"L'Algoritmica dell'Essere: filosofia nell'Intelligenza Artificiale", description:'Esplorazioni filosofiche ai confini tra intelligenza artificiale e pensiero antico. 6 ore.', priceEur:9000,  isNew:false, progressPercent:0, hours:6, available:false, teacher:'Giulio Bianchi', idc:362 },
  { id:'breve-voci-femminili',   slug:'breve-voci-femminili',   lang:'Corsi Brevi', level:'Bibbia e Antichità',    title:'Dal Margine al Centro: Voci Femminili nei Vangeli', description:'Le donne nei Vangeli: protagoniste dimenticate della storia cristiana. 4 ore.', priceEur:9000,  isNew:false, progressPercent:0, hours:4, available:false, teacher:'Alberto Bibbiani', idc:369 },
  { id:'breve-nilo',             slug:'breve-nilo',             lang:'Corsi Brevi', level:'Archeologia',           title:"Aldilà e Al-di-qua del Nilo: l'Antico Egitto tra vita e morte", description:"Il concetto egiziano di morte, aldilà e resurrezione. Testi funerari e iconografia. 8 ore.", priceEur:10000, isNew:false, progressPercent:0, hours:8, available:false, teacher:'Francesca Iannarilli', idc:403 },
  { id:'breve-etruschi-vita',    slug:'breve-etruschi-vita',    lang:'Corsi Brevi', level:'Archeologia',           title:'Etruschi: vita, guerra, spirito di una civiltà antica', description:'La civiltà etrusca nelle sue dimensioni quotidiana, militare e spirituale. 6 ore.', priceEur:10000, isNew:false, progressPercent:0, hours:6, available:false, teacher:'Mattia Scarpetta', idc:404 },
  { id:'breve-terre-bibbia',     slug:'breve-terre-bibbia',     lang:'Corsi Brevi', level:'Bibbia e Antichità',    title:'Le Terre della Bibbia: viaggio fra storia e sacro', description:'Israele, Giordania, Egitto: i luoghi della Bibbia tra archeologia e fede. 4 ore.', priceEur:10000, isNew:false, progressPercent:0, hours:4, available:false, teacher:'Alberto Bibbiani', idc:405 },
  { id:'breve-guerra-religione', slug:'breve-guerra-religione', lang:'Corsi Brevi', level:'Storia della Religione', title:'Guerra di Religione, Religione di Guerra', description:'Le guerre di religione nella storia antica e medievale: teologia, propaganda, martirio. 6 ore.', priceEur:11000, isNew:false, progressPercent:0, hours:6, available:true, teacher:'Emanuele Viotti',  idc:424 },
  { id:'breve-maturita-greco',   slug:'breve-maturita-greco',   lang:'Corsi Brevi', level:'Esercitazioni',         title:'Ponte alla Maturità Classica: tradurre il Greco Antico', description:'Preparazione alla traduzione greca per la Maturità classica. Metodo e pratica. 6 ore.', priceEur:14000, isNew:false, progressPercent:0, hours:6, available:false, teacher:'Alberto Bibbiani', idc:363 },
  { id:'breve-egiziano-appro',   slug:'breve-egiziano-appro',   lang:'Corsi Brevi', level:'Egiziano Geroglifico',  title:'Approfondimenti di Egiziano Geroglifico: preparazione alla letteratura', description:'Testi letterari egiziani per studenti di livello intermedio. 4 ore.', priceEur:15000, isNew:false, progressPercent:0, hours:4, available:false, teacher:'Ilaria Cariddi', idc:352 },
  { id:'breve-tragedia-greci',   slug:'breve-tragedia-greci',   lang:'Corsi Brevi', level:'Teatro Antico',         title:'La tragedia dei Greci: Eschilo, Sofocle, Euripide', description:'La struttura del dramma attico, i grandi temi, le differenze di stile tra i tre tragici. 4 ore.', priceEur:17000, isNew:true,  progressPercent:0, hours:4, available:true, teacher:'Giampiero Marchi',  idc:456 },
  { id:'breve-maturita-latino',  slug:'breve-maturita-latino',  lang:'Corsi Brevi', level:'Esercitazioni',         title:'Ponte alla Maturità Classica: tradurre il Latino', description:'Preparazione alla traduzione latina per la Maturità classica. Metodo e pratica. 6 ore.', priceEur:19000, isNew:false, progressPercent:0, hours:6, available:true, teacher:'Giampiero Marchi',  idc:452 },
  { id:'breve-roma-dei',         slug:'breve-roma-dei',         lang:'Corsi Brevi', level:'Civiltà Romana',        title:'Roma e i suoi Dèi: storia di una religione millenaria', description:'Percorso completo sulla religione romana: politeismo, culto imperiale, rapporto col Cristianesimo. 15 ore.', priceEur:25000, isNew:false, progressPercent:0, hours:15, available:true, teacher:'Emanuele Viotti',  idc:387 },
  { id:'breve-ars-scribendi',    slug:'breve-ars-scribendi',    lang:'Corsi Brevi', level:'Scrittura Latina',      title:'Ars latine scribendi: l\'arte di scrivere in latino', description:'Composizione latina avanzata: stile, prosa, epistolografia. Per studenti di livello B2+. 10 ore.', priceEur:45000, isNew:false, progressPercent:0, hours:10, available:false, teacher:'Christian Costa', idc:419 },
];

const LANG_GRADIENTS = {
  'Latino':               'linear-gradient(155deg,#3d1e10,#1c0d06)', /* terracotta bruciata — anfore romane */
  'Greco Antico':         'linear-gradient(155deg,#0e1e35,#060f1c)', /* ceramica attica a figure nere */
  'Egiziano Geroglifico': 'linear-gradient(155deg,#3a2a08,#1c1404)', /* papiro antico, oro brunito */
  'Ebraico Biblico':      'linear-gradient(155deg,#162416,#0a120a)', /* bronzo ossidato, oliva minerale */
  'Didattica':            'linear-gradient(155deg,#201830,#100d1c)', /* pergamena, inchiostro */
  'Corsi Brevi':          'linear-gradient(155deg,#1a2020,#0d1414)', /* ardesia, pietra scura */
};

/* ── State ───────────────────────────────────────────────────── */
let _courses = null;
let _user    = undefined; // undefined = non ancora caricato

/* ── Auth ────────────────────────────────────────────────────── */
const Auth = {
  async getUser() {
    if (_user !== undefined) return _user;
    try {
      const data = await API.get('/api/auth/me');
      _user = data.user || null;
    } catch { _user = null; }
    return _user;
  },
  async register(email, password, fullName) {
    const data = await API.post('/api/auth/register', { email, password, fullName });
    if (data.user) { _user = data.user; return { ok:true, user:data.user }; }
    return { ok:false, error:data.error };
  },
  async login(email, password) {
    const data = await API.post('/api/auth/login', { email, password });
    if (data.user) { _user = data.user; return { ok:true, user:data.user }; }
    return { ok:false, error:data.error };
  },
  async logout() {
    await API.post('/api/auth/logout', {}).catch(() => {});
    _user = null;
    window.location.href = 'index.html';
  },
  hasActiveSubscription(user) {
    return ['active','trialing'].includes(user?.subscription?.status);
  },
};

/* ── Lezioni reali dal DB latin-cert.org (estratte maggio 2026) ── */
const MOCK_LESSONS = {
  'lat-a11': [
    {title:'Lezione 1', vimeoUrl:'https://vimeo.com/861030827', durationMin:90, isFree:true},
    {title:'Lezione 2', vimeoUrl:'https://vimeo.com/862131807', durationMin:90},
    {title:'Lezione 3', vimeoUrl:'https://vimeo.com/863293919', durationMin:90},
    {title:'Lezione 4', vimeoUrl:'https://vimeo.com/864691446', durationMin:90},
    {title:'Lezione 5', vimeoUrl:'https://vimeo.com/865846111', durationMin:90},
    {title:'Lezione 6', vimeoUrl:'https://vimeo.com/866923051', durationMin:90},
    {title:'Lezione 7', vimeoUrl:'https://vimeo.com/868230496', durationMin:90},
    {title:'Lezione 8', vimeoUrl:'https://vimeo.com/869299510', durationMin:90},
    {title:'Lezione 9', vimeoUrl:'https://vimeo.com/870401616', durationMin:90},
    {title:'Lezione 10', vimeoUrl:'https://vimeo.com/871582516', durationMin:90},
    {title:'Lezione 11', vimeoUrl:'https://vimeo.com/872666321', durationMin:90},
    {title:'Lezione 12', vimeoUrl:'https://vimeo.com/873814603', durationMin:90},
    {title:'Test di fine livello - Latino A1.1', vimeoUrl:'', durationMin:90},
  ],
  'lat-a12': [
    {title:'Lezione 1', vimeoUrl:'https://vimeo.com/878010849', durationMin:90, isFree:true},
    {title:'Lezione 2', vimeoUrl:'https://vimeo.com/878443995', durationMin:90},
    {title:'Lezione 3', vimeoUrl:'https://vimeo.com/879645188', durationMin:90},
    {title:'Lezione 4', vimeoUrl:'https://vimeo.com/880642654', durationMin:90},
    {title:'Lezione 5', vimeoUrl:'https://vimeo.com/881836484', durationMin:90},
    {title:'Lezione 6', vimeoUrl:'https://vimeo.com/883016414', durationMin:90},
    {title:'Lezione 7', vimeoUrl:'https://vimeo.com/884125077', durationMin:90},
    {title:'Lezione 8', vimeoUrl:'https://vimeo.com/885561377', durationMin:90},
    {title:'Lezione 9', vimeoUrl:'https://vimeo.com/886613562', durationMin:90},
    {title:'Lezione 10', vimeoUrl:'https://vimeo.com/887775543', durationMin:90},
    {title:'Lezione 11', vimeoUrl:'https://vimeo.com/888827915', durationMin:90},
    {title:'Lezione 12', vimeoUrl:'https://vimeo.com/890652143', durationMin:90},
  ],
  'lat-a21': [
    {title:'Lezione 1', vimeoUrl:'https://vimeo.com/893597780', durationMin:90, isFree:true},
    {title:'Lezione 2', vimeoUrl:'https://vimeo.com/894825135', durationMin:90},
    {title:'Lezione 3', vimeoUrl:'https://vimeo.com/895950009', durationMin:90},
    {title:'Lezione 4', vimeoUrl:'https://vimeo.com/922169090', durationMin:90},
    {title:'Lezione 5', vimeoUrl:'https://vimeo.com/898513319', durationMin:90},
    {title:'Lezione 6', vimeoUrl:'https://vimeo.com/900117194', durationMin:90},
    {title:'Lezione 7', vimeoUrl:'https://vimeo.com/900947064', durationMin:90},
    {title:'Lezione 8', vimeoUrl:'https://vimeo.com/902281279', durationMin:90},
    {title:'Lezione 9', vimeoUrl:'https://vimeo.com/903094171', durationMin:90},
    {title:'Lezione 10', vimeoUrl:'https://vimeo.com/970621408', durationMin:90},
    {title:'Lezione 11', vimeoUrl:'https://vimeo.com/905548925', durationMin:90},
    {title:'Lezione 12', vimeoUrl:'https://vimeo.com/909499703', durationMin:90},
    {title:'Test di fine livello - Latino A2.1', vimeoUrl:'', durationMin:90},
  ],
  'lat-a22': [
    {title:'Lezione 1', vimeoUrl:'https://vimeo.com/912381234', durationMin:90, isFree:true},
    {title:'Lezione 2', vimeoUrl:'https://vimeo.com/913479664', durationMin:90},
    {title:'Lezione 3', vimeoUrl:'https://vimeo.com/914568332', durationMin:90},
    {title:'Lezione 4', vimeoUrl:'https://vimeo.com/915867670', durationMin:90},
    {title:'Lezione 5', vimeoUrl:'https://vimeo.com/916893026', durationMin:90},
    {title:'Lezione 6', vimeoUrl:'https://vimeo.com/918221926', durationMin:90},
    {title:'Lezione 7', vimeoUrl:'https://vimeo.com/919338861', durationMin:90},
    {title:'Lezione 8', vimeoUrl:'https://vimeo.com/921137218', durationMin:90},
    {title:'Lezione 9', vimeoUrl:'https://vimeo.com/922202474', durationMin:90},
    {title:'Lezione 10', vimeoUrl:'https://vimeo.com/923645311', durationMin:90},
    {title:'Lezione 11', vimeoUrl:'https://vimeo.com/924896855', durationMin:90},
    {title:'Lezione 12', vimeoUrl:'https://vimeo.com/926554700', durationMin:90},
  ],

  /* ── Latino B1.1 (IDCR 227) ── */
  'lat-b11': [
    {title:'Lezione 1 – 29 apr 2024',  vimeoUrl:'https://vimeo.com/940970411', durationMin:90, isFree:true},
    {title:'Lezione 2 – 2 mag 2024',   vimeoUrl:'https://vimeo.com/943321880', durationMin:90},
    {title:'Lezione 3 – 6 mag 2024',   vimeoUrl:'https://vimeo.com/943388464', durationMin:90},
    {title:'Lezione 4 – 9 mag 2024',   vimeoUrl:'https://vimeo.com/945797408', durationMin:90},
    {title:'Lezione 5 – 13 mag 2024',  vimeoUrl:'https://vimeo.com/946085166', durationMin:90},
    {title:'Lezione 6 – 16 mag 2024',  vimeoUrl:'https://vimeo.com/947970004', durationMin:90},
    {title:'Lezione 7 – 20 mag 2024',  vimeoUrl:'https://vimeo.com/948461758', durationMin:90},
    {title:'Lezione 8 – 23 mag 2024',  vimeoUrl:'https://vimeo.com/949937961', durationMin:90},
    {title:'Lezione 9 – 27 mag 2024',  vimeoUrl:'https://vimeo.com/950871381', durationMin:90},
    {title:'Lezione 10a – 3 giu 2024', vimeoUrl:'https://vimeo.com/953301489', durationMin:90},
    {title:'Lezione 10b – 3 giu 2024', vimeoUrl:'https://vimeo.com/953303059', durationMin:90},
    {title:'Lezione 11',               vimeoUrl:'https://vimeo.com/954924448', durationMin:90},
    {title:'Lezione 12',               vimeoUrl:'https://vimeo.com/956140417', durationMin:90},
    {title:'Lezione 13 – 13 giu 2024', vimeoUrl:'https://vimeo.com/958897732', durationMin:90},
    {title:'Lezione 14 – 17 giu 2024', vimeoUrl:'https://vimeo.com/960648876', durationMin:90},
    {title:'Lezione 15 – 20 giu 2024', vimeoUrl:'https://vimeo.com/964570116', durationMin:90},
    {title:'Lezione 16 – 25 giu 2024', vimeoUrl:'https://vimeo.com/970357560', durationMin:90},
    {title:'Test finale B1.1',          vimeoUrl:'',                            durationMin:90},
  ],

  /* ── Latino B1.2 (IDCR 290) ── */
  'lat-b12': [
    {title:'Lezione 0 – Materiali del corso', vimeoUrl:'',                              durationMin:0,  isFree:true},
    {title:'Lezione 1 – 21 ott 2024',         vimeoUrl:'https://vimeo.com/1021879669',  durationMin:90},
    {title:'Lezione 2 – 24 ott 2024',         vimeoUrl:'https://vimeo.com/1023512678',  durationMin:90},
    {title:'Lezione 3 – 28 ott 2024',         vimeoUrl:'https://vimeo.com/1024161759',  durationMin:90},
    {title:'Lezione 4 – 4 nov 2024',          vimeoUrl:'https://vimeo.com/1026285169',  durationMin:90},
    {title:'Lezione 5 – 7 nov 2024',          vimeoUrl:'https://vimeo.com/1027656779',  durationMin:90},
    {title:'Lezione 6 – 11 nov 2024',         vimeoUrl:'https://vimeo.com/1028581309',  durationMin:90},
    {title:'Lezione 7 – 14 nov 2024',         vimeoUrl:'https://vimeo.com/1029915038',  durationMin:90},
    {title:'Lezione 8 – 18 nov 2024',         vimeoUrl:'https://vimeo.com/1030917306',  durationMin:90},
    {title:'Lezione 9 – 21 nov 2024',         vimeoUrl:'https://vimeo.com/1032290808',  durationMin:90},
    {title:'Lezione 10 – 25 nov 2024',        vimeoUrl:'https://vimeo.com/1033249837',  durationMin:90},
    {title:'Lezione 11 – 28 nov 2024',        vimeoUrl:'https://vimeo.com/1034625708',  durationMin:90},
    {title:'Lezione 12 – 2 dic 2024',         vimeoUrl:'https://vimeo.com/1035385418',  durationMin:90},
    {title:'Lezione 13 – 5 dic 2024',         vimeoUrl:'https://vimeo.com/1036967832',  durationMin:90},
    {title:'Lezione 14 – 9 dic 2024',         vimeoUrl:'https://vimeo.com/1037618900',  durationMin:90},
    {title:'Lezione 15 – 12 dic 2024',        vimeoUrl:'https://vimeo.com/1038891737',  durationMin:90},
    {title:'Lezione 16 – 16 dic 2024',        vimeoUrl:'https://vimeo.com/1039828485',  durationMin:90},
  ],

  /* ── Latino B1.3 (IDCR 324) ── */
  'lat-b13': [
    {title:'Lezione 1 – 9 gen 2025',         vimeoUrl:'https://vimeo.com/1045656918', durationMin:90, isFree:true},
    {title:'Lezione 2 – 13 gen 2025',        vimeoUrl:'https://vimeo.com/1046579547', durationMin:90},
    {title:'Lezione 3 – 16 gen 2025',        vimeoUrl:'https://vimeo.com/1047755329', durationMin:90},
    {title:'Lezione 4 – 20 gen 2025',        vimeoUrl:'https://vimeo.com/1048713256', durationMin:90},
    {title:'Lezione 5 – 23 gen 2025',        vimeoUrl:'https://vimeo.com/1050082669', durationMin:90},
    {title:'Lezione 6 – 27 gen 2025',        vimeoUrl:'https://vimeo.com/1050953204', durationMin:90},
    {title:'Lezione 7 – 30 gen 2025',        vimeoUrl:'https://vimeo.com/1052252630', durationMin:90},
    {title:'Lezione 9 – 3 feb 2025',         vimeoUrl:'https://vimeo.com/1053177083', durationMin:90},
    {title:'Lezione 10 – 10 feb 2025',       vimeoUrl:'https://vimeo.com/1055370074', durationMin:90},
    {title:'Lezione 10 – 13 feb 2025',       vimeoUrl:'https://vimeo.com/1056737913', durationMin:90},
    {title:'Lezione 12 – 17 feb 2025',       vimeoUrl:'https://vimeo.com/1057655003', durationMin:90},
    {title:'Lezione 12 – 20 feb 2025',       vimeoUrl:'https://vimeo.com/1059873568', durationMin:90},
    {title:'Lezione 14 – 24 feb 2025',       vimeoUrl:'https://vimeo.com/1059895231', durationMin:90},
    {title:'Lezione 15 – 27 feb 2025',       vimeoUrl:'https://vimeo.com/1061979097', durationMin:90},
    {title:'Lezione 15 – 4 mar 2025',        vimeoUrl:'https://vimeo.com/1062309095', durationMin:90},
    {title:'Lezione 16 – 6 mar 2025 (I)',    vimeoUrl:'',                              durationMin:90},
    {title:'Lezione 16 – 6 mar 2025 (II)',   vimeoUrl:'https://vimeo.com/1063485681', durationMin:90},
  ],

  'gr-a11': [
    {title:'Introduzione al corso', vimeoUrl:'https://vimeo.com/828737393', durationMin:90, isFree:true},
    {title:'Lezione 1 (22/05/2023)', vimeoUrl:'https://vimeo.com/829197205', durationMin:90},
    {title:'Lezione 2 (25/05/2023)', vimeoUrl:'https://vimeo.com/830360301', durationMin:90},
    {title:'Lezione 3 (29/05/2023)', vimeoUrl:'https://vimeo.com/831411465', durationMin:90},
    {title:'Lezione 4 (01/06/2023)', vimeoUrl:'https://vimeo.com/832407672', durationMin:90},
    {title:'Lezione 5 (05/06/2023)', vimeoUrl:'https://vimeo.com/833594714', durationMin:90},
    {title:'Lezione 6 dell\'8 giugno 2023', vimeoUrl:'https://vimeo.com/834543236', durationMin:90},
    {title:'Lezione 7 (12/06/2023)', vimeoUrl:'https://vimeo.com/835579015', durationMin:90},
    {title:'Lezione 8 (15/06/2023)', vimeoUrl:'https://vimeo.com/836687258', durationMin:90},
    {title:'Lezione 9 (19/06/2023)', vimeoUrl:'https://vimeo.com/837714054', durationMin:90},
    {title:'Lezione 10 (22/06/2023)', vimeoUrl:'https://vimeo.com/838808918', durationMin:90},
    {title:'Lezione 11 (27/06/2023)', vimeoUrl:'https://vimeo.com/839979814', durationMin:90},
    {title:'Lezione 12 (29/06/2023)', vimeoUrl:'https://vimeo.com/841037349', durationMin:90},
  ],
  'gr-a12': [
    {title:'Greco A1.2 - Lezione 1', vimeoUrl:'https://vimeo.com/861033000', durationMin:90, isFree:true},
    {title:'Greco A1.2 - Lezione 2', vimeoUrl:'https://vimeo.com/862163384', durationMin:90},
    {title:'Greco A1.2 - Lezione 3', vimeoUrl:'https://vimeo.com/863332820', durationMin:90},
    {title:'Greco A1.2 - Lezione 4', vimeoUrl:'https://vimeo.com/864569184', durationMin:90},
    {title:'Greco A1.2 - Lezione 5', vimeoUrl:'https://vimeo.com/865723851', durationMin:90},
    {title:'Greco A1.2 - Lezione 6', vimeoUrl:'https://vimeo.com/866927615', durationMin:90},
    {title:'Greco A1.2 - Lezione 7', vimeoUrl:'https://vimeo.com/868080088', durationMin:90},
    {title:'Greco A1.2 - Lezione 8', vimeoUrl:'https://vimeo.com/869305895', durationMin:90},
    {title:'Greco A1.2 - Lezione 9', vimeoUrl:'https://vimeo.com/870441629', durationMin:90},
    {title:'Greco A1.2 - Lezione 10', vimeoUrl:'https://vimeo.com/871605953', durationMin:90},
    {title:'Greco A1.2 - Lezione 11', vimeoUrl:'https://vimeo.com/872697581', durationMin:90},
    {title:'Greco A1.2 - Lezione 12', vimeoUrl:'https://vimeo.com/873849487', durationMin:90},
  ],

  /* ── Greco A2.1 (IDCR 171) ── */
  'gr-a21': [
    {title:'Lezione 1 – 23/10/2023',  vimeoUrl:'https://vimeo.com/877263290', durationMin:90, isFree:true},
    {title:'Lezione 2 – 26/10/2023',  vimeoUrl:'https://vimeo.com/878438174', durationMin:90},
    {title:'Lezione 3 – 30/10/2023',  vimeoUrl:'https://vimeo.com/879562672', durationMin:90},
    {title:'Lezione 4 – 02/11/2023',  vimeoUrl:'https://vimeo.com/880678607', durationMin:90},
    {title:'Lezione 5 – 06/11/2023',  vimeoUrl:'https://vimeo.com/881846943', durationMin:90},
    {title:'Lezione 6 – 09/11/2023',  vimeoUrl:'https://vimeo.com/883062933', durationMin:90},
    {title:'Lezione 7 – 13/11/2023',  vimeoUrl:'https://vimeo.com/884150783', durationMin:90},
    {title:'Lezione 8 – 16/11/2023',  vimeoUrl:'https://vimeo.com/885381687', durationMin:90},
    {title:'Lezione 9 – 20/11/2023',  vimeoUrl:'https://vimeo.com/886617684', durationMin:90},
    {title:'Lezione 10 – 23/11/2023', vimeoUrl:'https://vimeo.com/887786227', durationMin:90},
    {title:'Lezione 11 – 27/11/2023', vimeoUrl:'https://vimeo.com/888854052', durationMin:90},
    {title:'Lezione 12 – 30/11/2023', vimeoUrl:'https://vimeo.com/890074572', durationMin:90},
  ],

  /* ── Greco A2.2 (IDCR 199) ── */
  'gr-a22': [
    {title:'Lezione 1 – 12/02/2024',  vimeoUrl:'https://vimeo.com/912380290', durationMin:90, isFree:true},
    {title:'Lezione 2 – 15/02/2024',  vimeoUrl:'https://vimeo.com/913476631', durationMin:90},
    {title:'Lezione 3 – 19/02/2024',  vimeoUrl:'https://vimeo.com/914565737', durationMin:90},
    {title:'Lezione 4 – 22/02/2024',  vimeoUrl:'https://vimeo.com/915742529', durationMin:90},
    {title:'Lezione 5 – 26/02/2024',  vimeoUrl:'https://vimeo.com/916871014', durationMin:90},
    {title:'Lezione 6 – 29/02/2024',  vimeoUrl:'https://vimeo.com/918083948', durationMin:90},
    {title:'Lezione 7 – 04/03/2024',  vimeoUrl:'https://vimeo.com/919323177', durationMin:90},
    {title:'Lezione 8 – 07/03/2024',  vimeoUrl:'https://vimeo.com/920640282', durationMin:90},
    {title:'Lezione 9 – 11/03/2024',  vimeoUrl:'https://vimeo.com/922196916', durationMin:90},
    {title:'Lezione 10 – 14/03/2024', vimeoUrl:'https://vimeo.com/923522395', durationMin:90},
    {title:'Lezione 11 – 18/03/2024', vimeoUrl:'https://vimeo.com/924774238', durationMin:90},
    {title:'Lezione 12 – 21/03/2024', vimeoUrl:'https://vimeo.com/926028426', durationMin:90},
  ],

  /* ── Greco B1.1 (IDCR 228) ── */
  'gr-b11': [
    {title:'Lezione 01 – 29/04/2024', vimeoUrl:'https://vimeo.com/940969039', durationMin:90, isFree:true},
    {title:'Lezione 02 – 02/05/2024', vimeoUrl:'https://vimeo.com/942108178', durationMin:90},
    {title:'Lezione 03 – 06/05/2024', vimeoUrl:'https://vimeo.com/943390116', durationMin:90},
    {title:'Lezione 04 – 09/05/2024', vimeoUrl:'https://vimeo.com/944599399', durationMin:90},
    {title:'Lezione 05 – 13/05/2024', vimeoUrl:'https://vimeo.com/945939492', durationMin:90},
    {title:'Lezione 06 – 16/05/2024', vimeoUrl:'https://vimeo.com/947143508', durationMin:90},
    {title:'Lezione 07 – 20/05/2024', vimeoUrl:'https://vimeo.com/948462768', durationMin:90},
    {title:'Lezione 08 – 23/05/2024', vimeoUrl:'https://vimeo.com/949680406', durationMin:90},
    {title:'Lezione 09 – 27/05/2024', vimeoUrl:'https://vimeo.com/950869890', durationMin:90},
    {title:'Lezione 10 – 30/05/2024', vimeoUrl:'https://vimeo.com/952099217', durationMin:90},
    {title:'Lezione 11 – 03/06/2024', vimeoUrl:'https://vimeo.com/953304636', durationMin:90},
    {title:'Lezione 12 – 06/06/2024', vimeoUrl:'https://vimeo.com/954548514', durationMin:90},
    {title:'Lezione 13 – 10/06/2024', vimeoUrl:'https://vimeo.com/956136491', durationMin:90},
    {title:'Lezione 14 – 13/06/2024', vimeoUrl:'https://vimeo.com/957968257', durationMin:90},
    {title:'Lezione 15 – 17/06/2024', vimeoUrl:'https://vimeo.com/960644257', durationMin:90},
    {title:'Lezione 16 – 20/06/2024', vimeoUrl:'https://vimeo.com/963579618', durationMin:90},
  ],

  /* ── Greco B1.2 Asincrono (IDCR 264) ── */
  'gr-b12': [
    {title:'Lezione 1',  vimeoUrl:'https://vimeo.com/776331181', durationMin:90, isFree:true},
    {title:'Lezione 2',  vimeoUrl:'https://vimeo.com/778609624', durationMin:90},
    {title:'Lezione 3',  vimeoUrl:'https://vimeo.com/780867495', durationMin:90},
    {title:'Lezione 4',  vimeoUrl:'https://vimeo.com/788036700', durationMin:90},
    {title:'Lezione 5',  vimeoUrl:'https://vimeo.com/790174833', durationMin:90},
    {title:'Lezione 6',  vimeoUrl:'https://vimeo.com/790926150', durationMin:90},
    {title:'Lezione 7',  vimeoUrl:'https://vimeo.com/792362828', durationMin:90},
    {title:'Lezione 8',  vimeoUrl:'https://vimeo.com/794626177', durationMin:90},
    {title:'Lezione 9',  vimeoUrl:'https://vimeo.com/798886382', durationMin:90},
    {title:'Lezione 10', vimeoUrl:'https://vimeo.com/801161772', durationMin:90},
    {title:'Lezione 11', vimeoUrl:'https://vimeo.com/803215529', durationMin:90},
    {title:'Lezione 12', vimeoUrl:'https://vimeo.com/805698682', durationMin:90},
  ],

  /* ── Greco B1.3 Asincrono (IDCR 306) ── */
  'gr-b13': [
    {title:'Lezione 01', vimeoUrl:'https://vimeo.com/808079469', durationMin:90, isFree:true},
    {title:'Lezione 02', vimeoUrl:'https://vimeo.com/810295287', durationMin:90},
    {title:'Lezione 03', vimeoUrl:'https://vimeo.com/811062094', durationMin:90},
    {title:'Lezione 04', vimeoUrl:'https://vimeo.com/812547523', durationMin:90},
    {title:'Lezione 05', vimeoUrl:'https://vimeo.com/814741264', durationMin:90},
    {title:'Lezione 06', vimeoUrl:'https://vimeo.com/818861685', durationMin:90},
    {title:'Lezione 07', vimeoUrl:'https://vimeo.com/821416066', durationMin:90},
    {title:'Lezione 08', vimeoUrl:'https://vimeo.com/823128889/dc7d7c3c9f', durationMin:90},
    {title:'Lezione 09', vimeoUrl:'https://vimeo.com/825209669', durationMin:90},
    {title:'Lezione 10', vimeoUrl:'https://vimeo.com/827381662', durationMin:90},
    {title:'Lezione 11', vimeoUrl:'https://vimeo.com/829589007', durationMin:90},
    {title:'Lezione 12', vimeoUrl:'https://vimeo.com/830327350', durationMin:90},
  ],

  'eb-a11': [
    {title:'Lezione 1', vimeoUrl:'https://vimeo.com/900911359', durationMin:90, isFree:true},
    {title:'Lezione 2', vimeoUrl:'https://vimeo.com/901999491', durationMin:90},
    {title:'Lezione 3', vimeoUrl:'https://vimeo.com/903064489', durationMin:90},
    {title:'Lezione 4 - 18/01/2024', vimeoUrl:'https://vimeo.com/904242841', durationMin:90},
    {title:'Lezione 5', vimeoUrl:'https://vimeo.com/905354486', durationMin:90},
    {title:'Lezione 6', vimeoUrl:'https://vimeo.com/906525198', durationMin:90},
    {title:'Lezione 7', vimeoUrl:'https://vimeo.com/907576002', durationMin:90},
    {title:'Lezione 8', vimeoUrl:'https://vimeo.com/908782258', durationMin:90},
    {title:'Lezione 9', vimeoUrl:'https://vimeo.com/910168826', durationMin:90},
    {title:'Lezione 10', vimeoUrl:'https://vimeo.com/911314473', durationMin:90},
    {title:'Lezione 11', vimeoUrl:'https://vimeo.com/912344180', durationMin:90},
    {title:'Lezione 12', vimeoUrl:'https://vimeo.com/913436163', durationMin:90},
  ],
  'eb-a12': [
    {title:'Lezione 01 - 04/03/2024', vimeoUrl:'https://vimeo.com/919276658', durationMin:90, isFree:true},
    {title:'Lezione 02 - 07/03/2024', vimeoUrl:'https://vimeo.com/920599841', durationMin:90},
    {title:'Lezione 03 - 11/03/2024', vimeoUrl:'https://vimeo.com/922158046', durationMin:90},
    {title:'Lezione 04 - 13/03/2024', vimeoUrl:'https://vimeo.com/923518314', durationMin:90},
    {title:'Lezione 05 - 18/03/2024', vimeoUrl:'https://vimeo.com/924736309', durationMin:90},
    {title:'Lezione 06 - 21/03/2024', vimeoUrl:'https://vimeo.com/925988159', durationMin:90},
    {title:'Lezione 07 - 25/03/2024', vimeoUrl:'https://vimeo.com/927254814', durationMin:90},
    {title:'Lezione 08 - 04/04/2024', vimeoUrl:'https://vimeo.com/930775102', durationMin:90},
    {title:'Lezione 09 - 08/04/2024', vimeoUrl:'https://vimeo.com/932175255', durationMin:90},
    {title:'Lezione 10 - 11/04/2024', vimeoUrl:'https://vimeo.com/933392146', durationMin:90},
    {title:'Lezione 11 - 15/04/2024', vimeoUrl:'https://vimeo.com/935081032', durationMin:90},
    {title:'Lezione 12 - 18/04/2024', vimeoUrl:'https://vimeo.com/936392001', durationMin:90},
  ],
  'eg-a11': [
    {title:'Lezione 1 del 3 aprile 2024', vimeoUrl:'https://vimeo.com/930375590', durationMin:90, isFree:true},
    {title:'Lezione 2 del 10 aprile 2024', vimeoUrl:'https://vimeo.com/933002893', durationMin:90},
    {title:'Lezione 3 del 13 aprile 2024', vimeoUrl:'https://vimeo.com/934285952', durationMin:90},
    {title:'Lezione 4 del 17 aprile 2024', vimeoUrl:'https://vimeo.com/935990488', durationMin:90},
    {title:'Lezione 5 del 24 aprile 2024', vimeoUrl:'https://vimeo.com/938760896', durationMin:90},
    {title:'Lezione 6 dell\'8 maggio 2024', vimeoUrl:'https://vimeo.com/944193738', durationMin:90},
    {title:'Lezione 7 del 15 maggio 2024', vimeoUrl:'https://vimeo.com/946715294', durationMin:90},
    {title:'Lezione 8 del 22 maggio 2024', vimeoUrl:'https://vimeo.com/949296439', durationMin:90},
    {title:'Lezione 9 del 29 maggio 2024', vimeoUrl:'https://vimeo.com/951685007', durationMin:90},
  ],
  'eg-a12': [
    {title:'Lezione 1', vimeoUrl:'https://vimeo.com/894309594', durationMin:90, isFree:true},
    {title:'Lezione 2', vimeoUrl:'https://vimeo.com/897026831', durationMin:90},
    {title:'Lezione 3', vimeoUrl:'https://vimeo.com/898415978', durationMin:90},
    {title:'Lezione 4', vimeoUrl:'https://vimeo.com/899924216', durationMin:90},
    {title:'Lezione 5', vimeoUrl:'https://vimeo.com/903440917', durationMin:90},
    {title:'Lezione 6', vimeoUrl:'https://vimeo.com/904214205', durationMin:90},
    {title:'Lezione 7', vimeoUrl:'https://vimeo.com/906497940', durationMin:90},
    {title:'Lezione 8', vimeoUrl:'https://vimeo.com/909171602', durationMin:90},
    {title:'Lezione 9', vimeoUrl:'https://vimeo.com/911348232', durationMin:90},
  ],

  /* ── Egiziano Geroglifico A2 (IDCR 398) ── */
  'eg-a21': [
    {title:'Lezione 1 – 22 gen 2026',         vimeoUrl:'https://vimeo.com/1157563535', durationMin:90, isFree:true},
    {title:'Lezione 2 – 29 gen 2026',         vimeoUrl:'https://vimeo.com/1159848393', durationMin:90},
    {title:'Lezione 3 – 5 feb 2026',          vimeoUrl:'https://vimeo.com/1162338745', durationMin:90},
    {title:'Lezione 4 – 7 feb 2026',          vimeoUrl:'https://vimeo.com/1162867534', durationMin:90},
    {title:'Lezione 5 – 12 feb 2026',         vimeoUrl:'https://vimeo.com/1164971752', durationMin:90},
    {title:'Lezione 6 – 19 feb 2026',         vimeoUrl:'https://vimeo.com/1166502712', durationMin:90},
    {title:'Lezione 7 – 26 feb 2026',         vimeoUrl:'https://vimeo.com/1168609738', durationMin:90},
    {title:'Lezione 8 – 5 mar 2026',          vimeoUrl:'https://vimeo.com/1170846219', durationMin:90},
    {title:'Lezione 9 – 14 mar 2026',         vimeoUrl:'https://vimeo.com/1173629953', durationMin:90},
    {title:'Lezione 10 – 19 mar 2026',        vimeoUrl:'https://vimeo.com/1175287047', durationMin:90},
    {title:'Lezione 11 – 27 mar 2026',        vimeoUrl:'https://vimeo.com/1177507482', durationMin:90},
    {title:'Lezione extra 12 – 1 apr 2026',   vimeoUrl:'https://vimeo.com/1179345592', durationMin:90},
  ],

  /* ── breve-algoritmica (IDCR 236) ── */
  'breve-algoritmica': [
      {title:'1. ”Introduzione all\'Intelligenza Artificiale: Dall\'Origine ai Dilemmi Etici\"', vimeoUrl:'https://vimeo.com/945955024?share=copy', durationMin:90, isFree:true},
      {title:'2. \"Veicoli Autonomi: Tra Innovazione, Etica e Filosofia\"', vimeoUrl:'https://vimeo.com/947305960', durationMin:90},
      {title:'3. \"Armi Autonome: Tecnologia, Etica e Responsabilità\"', vimeoUrl:'https://vimeo.com/948610559', durationMin:90},
      {title:'4. ”Impatti dell\'Intelligenza Artificiale: Lavoro, Controllo, Etica\"', vimeoUrl:'https://vimeo.com/949712502', durationMin:90},
  ],

  /* ── breve-ars-scribendi (IDCR 337) ── */
  'breve-ars-scribendi': [
      {title:'Lezione 1 - 12 marzo 2025', vimeoUrl:'https://vimeo.com/1065359984', durationMin:90, isFree:true},
      {title:'Lezione 2 - 20 marzo 2025', vimeoUrl:'https://vimeo.com/1067616730', durationMin:90},
      {title:'Lezione 3 - 26 marzo 2025', vimeoUrl:'https://vimeo.com/1070086694', durationMin:90},
      {title:'Lezione 4 - 2 aprile 2025', vimeoUrl:'https://vimeo.com/1072275347', durationMin:90},
      {title:'Lezione 5 - 9 aprile 2025', vimeoUrl:'https://vimeo.com/1074225616', durationMin:90},
      {title:'Lezione 6 - 23 aprile 2025', vimeoUrl:'https://vimeo.com/1078273214', durationMin:90},
      {title:'Lezione 7 - 30 aprile 2025', vimeoUrl:'https://vimeo.com/1079991355', durationMin:90},
      {title:'Lezione 8 - 7 maggio 2025', vimeoUrl:'https://vimeo.com/1082790198', durationMin:90},
      {title:'Lezione 9 - 14 maggio 2025', vimeoUrl:'https://vimeo.com/1086498574', durationMin:90},
      {title:'Lezione 10 - 21 maggio 2025', vimeoUrl:'https://vimeo.com/1086724575', durationMin:90},
      {title:'Lezione 11 - 28 maggio 2025', vimeoUrl:'https://vimeo.com/1090126314', durationMin:90},
      {title:'Lezione 12 - 11 giugno', vimeoUrl:'https://vimeo.com/1093496492', durationMin:90},
  ],

  /* ── breve-buona-novella (IDCR 63) ── */
  'breve-buona-novella': [
      {title:'Primo Incontro: \"Dal logos all\'annunciazione\" - 14 dicembre 2022', vimeoUrl:'https://vimeo.com/781267458', durationMin:90, isFree:true},
      {title:'Secondo incontro: \"La trasmutazione dell\'acqua in vino: Le Nozze di Cana\" - 21 dicembre 2022', vimeoUrl:'https://vimeo.com/783435242', durationMin:90},
      {title:'Terzo incontro: \"La natività dai Canonici agli Apocrifi\" - 28 dicembre 2022', vimeoUrl:'https://vimeo.com/785438855', durationMin:90},
      {title:'Quarto incontro: Giovanni Battista - dal tweet di Papa Francesco ai Padri della Chiesa - 11 gennaio 2023', vimeoUrl:'https://vimeo.com/788547537', durationMin:90},
      {title:'Quinto incontro: Dal Discorso della Montagna (Matteo 5, 3-12), una riflessione teologica sulle Beatitudini - 18 gennaio 2023', vimeoUrl:'https://vimeo.com/790698948', durationMin:90},
  ],

  /* ── breve-catullo (IDCR 411) ── */
  'breve-catullo': [
      {title:'Lezione 1 - \"La cerchia dei poeti neoterici\"', vimeoUrl:'https://vimeo.com/1176352302', durationMin:90, isFree:true},
      {title:'Lezione 2: “Amore a prima vista”', vimeoUrl:'https://vimeo.com/1177813691', durationMin:90},
      {title:'Lezione 3: \"Sed fieri sentio...\"', vimeoUrl:'https://vimeo.com/1178594516', durationMin:90},
      {title:'Lezione 4: \"Cenabis bene, mi Fabulle, apud me...\"', vimeoUrl:'https://vimeo.com/1181718638', durationMin:90},
  ],

  /* ── breve-conclave (IDCR 358) ── */
  'breve-conclave': [
      {title:'Lezione 1: anatomia di una Bolla Papale', vimeoUrl:'https://vimeo.com/1081621613', durationMin:90, isFree:true},
      {title:'Lezione 2: Ubi Periculum, una bolla papale di svolta', vimeoUrl:'https://vimeo.com/1082341797', durationMin:90},
      {title:'Lezione 3: Le Bolle della Controriforma', vimeoUrl:'https://vimeo.com/1083676196', durationMin:90},
      {title:'Lezione 4: Il Conclave e le sfide della Modernità', vimeoUrl:'https://vimeo.com/1085832773', durationMin:90},
  ],

  /* ── breve-dei-uomini (IDCR 237) ── */
  'breve-dei-uomini': [
      {title:'1. Il mito delle origini', vimeoUrl:'https://vimeo.com/948620365', durationMin:90, isFree:true},
      {title:'2 I miti della nascita delle donne', vimeoUrl:'https://vimeo.com/950540316', durationMin:90},
      {title:'3 Roma e il destino del mondo', vimeoUrl:'https://vimeo.com/950842521', durationMin:90},
      {title:'4 L\'assedio di Roma da parte dei Galli', vimeoUrl:'https://vimeo.com/952125088', durationMin:90},
  ],

  /* ── breve-echi-marmo (IDCR 340) ── */
  'breve-echi-marmo': [
      {title:'Lezione 1 del 17/03/25', vimeoUrl:'https://vimeo.com/1066701466', durationMin:90, isFree:true},
      {title:'Lezione 2 20/03/25', vimeoUrl:'https://vimeo.com/1067874280', durationMin:90},
      {title:'Lezione 3 - 24/03/25', vimeoUrl:'https://vimeo.com/1068977172', durationMin:90},
      {title:'Lezione 4 - 27/03/25', vimeoUrl:'https://vimeo.com/1070117557', durationMin:90},
  ],

  /* ── breve-etruschi-vita (IDCR 307) ── */
  'breve-etruschi-vita': [
      {title:'Religione etrusca', vimeoUrl:'https://vimeo.com/1033249720', durationMin:90, isFree:true},
      {title:'La guerra degli Etruschi', vimeoUrl:'https://vimeo.com/1034013062', durationMin:90},
      {title:'Lezione 3: il commercio etrusco', vimeoUrl:'https://vimeo.com/1035372625', durationMin:90},
      {title:'La musica degli Etruschi', vimeoUrl:'https://vimeo.com/1036146673', durationMin:90},
  ],

  /* ── breve-guerra-religione (IDCR 345) ── */
  'breve-guerra-religione': [
      {title:'1 - Gli Dèi della Guerra 31/03/2025', vimeoUrl:'https://vimeo.com/1071155270', durationMin:90, isFree:true},
      {title:'2 - Auspicia Militaria 3/04/25', vimeoUrl:'https://vimeo.com/1072473233', durationMin:90},
      {title:'3 - Le porte di Giano 07/04/25', vimeoUrl:'https://vimeo.com/1073316079', durationMin:90},
      {title:'4 - sguainare la magia 10/04/25', vimeoUrl:'https://vimeo.com/1074425796', durationMin:90},
  ],

  /* ── breve-japonia (IDCR 365) ── */
  'breve-japonia': [
      {title:'Lezione 1 - Terra Japonia: geografia, stupore e costruzione dell’immagine', vimeoUrl:'https://vimeo.com/1101369047', durationMin:90, isFree:true},
      {title:'Lezione 2 - A tavola con gli altri: cibo, cerimonie e codici culturali', vimeoUrl:'https://vimeo.com/1102002189', durationMin:90},
      {title:'Lezione 3 - Abiti, lingua e scrittura: tradurre la differenza', vimeoUrl:'https://vimeo.com/1103262113', durationMin:90},
      {title:'Lezione 4 - La società giapponese tra ordine, valori e identità', vimeoUrl:'https://vimeo.com/1103916414', durationMin:90},
  ],

  /* ── breve-marziale (IDCR 300) ── */
  'breve-marziale': [
      {title:'Lezione 1: \"Marziale e le accuse di plagio\"', vimeoUrl:'https://vimeo.com/1027050163', durationMin:90, isFree:true},
      {title:'Lezione 2: \"Sfarzo e ipocrisia a banchetto\"', vimeoUrl:'https://vimeo.com/1029553091', durationMin:90},
      {title:'Lezione 3: \"I segreti di una vita felice\"', vimeoUrl:'https://vimeo.com/1031694291', durationMin:90},
      {title:'Lezione 4: \"Questo è quel Marziale che leggi...\"', vimeoUrl:'https://vimeo.com/1034130355', durationMin:90},
  ],

  /* ── breve-maturita-greco (IDCR 235) ── */
  'breve-maturita-greco': [
      {title:'Lezione 1 del 13 maggio 2024', vimeoUrl:'https://vimeo.com/945915783?share=copy', durationMin:90, isFree:true},
      {title:'Lezione 2 del 16 Maggio 2024', vimeoUrl:'https://vimeo.com/947110743?share=copy', durationMin:90},
      {title:'Lezione 3 del 20 maggio 2024', vimeoUrl:'https://vimeo.com/948425475?share=copy', durationMin:90},
      {title:'Lezione 4 del 23 maggio 2024', vimeoUrl:'https://vimeo.com/949624111?share=copy', durationMin:90},
      {title:'Lezione 5 del 27 maggio 2024', vimeoUrl:'https://vimeo.com/950848693?share=copy', durationMin:90},
      {title:'Lezione 6 del 3 giugno 2024', vimeoUrl:'https://vimeo.com/953440006?share=copy', durationMin:90},
  ],

  /* ── breve-metrica (IDCR 369) ── */
  'breve-metrica': [
      {title:'Lezione 1 – Il cervello e il verso: perché la metrica non funziona (più)', vimeoUrl:'https://vimeo.com/1114951364', durationMin:90, isFree:true},
      {title:'Lezione 2 - Il Cervello e il Ritmo poetico', vimeoUrl:'https://vimeo.com/1115600748', durationMin:90},
      {title:'Lezione 3 - Voce, Corpo, Memoria', vimeoUrl:'https://vimeo.com/1117077214', durationMin:90},
      {title:'Lezione 4 - Dalla classe alla realtà', vimeoUrl:'https://vimeo.com/1117556031', durationMin:90},
  ],

  /* ── breve-miniera-luna (IDCR 224) ── */
  'breve-miniera-luna': [
      {title:'Lezione 1 - 08/04/2024', vimeoUrl:'https://vimeo.com/932215890', durationMin:90, isFree:true},
      {title:'Lezione 2 - 11/04/2024', vimeoUrl:'https://vimeo.com/933436593', durationMin:90},
      {title:'Lezione 3 - 15/04/2024', vimeoUrl:'https://vimeo.com/935123884', durationMin:90},
      {title:'Lezione 4 - 22/04/2024', vimeoUrl:'https://vimeo.com/937935691', durationMin:90},
  ],

  /* ── breve-nilo / Piramidi (IDCR 167) ── */
  'breve-nilo': [
      {title:'Lezione 1 del 18/10/2023', vimeoUrl:'https://vimeo.com/875692567', durationMin:90, isFree:true},
      {title:'Lezione 2 del 25/10/2023', vimeoUrl:'https://vimeo.com/878244624', durationMin:90},
      {title:'Lezione 3 del 08/11/2023', vimeoUrl:'https://vimeo.com/882985017', durationMin:90},
      {title:'Lezione 4 del 15/11/2023', vimeoUrl:'https://vimeo.com/885127735', durationMin:90},
      {title:'Lezione 5 del 22/11/2023', vimeoUrl:'https://vimeo.com/887452881', durationMin:90},
      {title:'Lezione 6 del 28/11/2023', vimeoUrl:'https://vimeo.com/889267264', durationMin:90},
      {title:'Lezione 7 del 06/12/2023', vimeoUrl:'https://vimeo.com/893048508', durationMin:90},
      {title:'Lezione 8 del 13/12/2023', vimeoUrl:'https://vimeo.com/895001786', durationMin:90},
      {title:'Lezione 9 del 20/12/2023', vimeoUrl:'https://vimeo.com/896706880', durationMin:90},
      {title:'Lezione 1 del 12/11/2024', vimeoUrl:'https://vimeo.com/1029217019', durationMin:90},
      {title:'Lezione 2 del 19/11/2024', vimeoUrl:'https://vimeo.com/1032769949', durationMin:90},
  ],

  /* ── breve-padri-chiesa (IDCR 67) ── */
  'breve-padri-chiesa': [
      {title:'Incontro 1 del 1° febbraio 2023', vimeoUrl:'https://vimeo.com/795032916', durationMin:90, isFree:true},
      {title:'Incontro 2 - 08/02/2023', vimeoUrl:'https://vimeo.com/797480429', durationMin:90},
      {title:'Incontro 3  - 15 febbraio 2023', vimeoUrl:'https://vimeo.com/799597392', durationMin:90},
      {title:'Incontro 4 - 22/02/2023', vimeoUrl:'https://vimeo.com/801970109', durationMin:90},
  ],

  /* ── breve-passione (IDCR 214) ── */
  'breve-passione': [
      {title:'Sessione 01 - Verso la Città Santa: Marco e l\'Entrata Trionfale di Gesù a Gerusalemme', vimeoUrl:'https://vimeo.com/919782060', durationMin:90, isFree:true},
      {title:'Sessione 02 - Gesti di Umanità e Servizio: Il Profondo Messaggio di Giovanni nella Lavanda dei Piedi', vimeoUrl:'https://vimeo.com/922670851', durationMin:90},
      {title:'Sessione 03 - Tra Giustizia e Ingiustizia: Matteo e il Complesso Processo a Gesù', vimeoUrl:'https://vimeo.com/925181165', durationMin:90},
      {title:'Sessione 04 - Dal Calvario alla Gloria: Luca e il Viaggio di Gesù dalla Croce alla Risurrezione', vimeoUrl:'https://vimeo.com/927731108', durationMin:90},
  ],

  /* ── breve-roma-dei (IDCR 270) ── */
  'breve-roma-dei': [
      {title:'1 - Le origini - 9/09/24', vimeoUrl:'https://vimeo.com/1007801935', durationMin:90, isFree:true},
      {title:'2 - Le religioni Italiche - 12/09/24', vimeoUrl:'https://vimeo.com/1008953352', durationMin:90},
      {title:'3 - Dal Rex al Rex Sacrorum 16/09/2024', vimeoUrl:'https://vimeo.com/1010005050', durationMin:90},
      {title:'4 - La Repubblica 19/09/24', vimeoUrl:'https://vimeo.com/1011249634', durationMin:90},
      {title:'5 - L\'Ellenizzazione', vimeoUrl:'https://vimeo.com/1012161074', durationMin:90},
      {title:'6 - La Tarda Repubblica', vimeoUrl:'https://vimeo.com/1013295498', durationMin:90},
      {title:'7 - La rivoluzione augustea', vimeoUrl:'https://vimeo.com/1014512382', durationMin:90},
      {title:'8 - L\'Impero e il Sole', vimeoUrl:'https://vimeo.com/1015828825', durationMin:90},
      {title:'9 - Il Cristianesimo 07/10/24', vimeoUrl:'https://vimeo.com/1017286510', durationMin:90},
      {title:'10 - Sopravvivenze, continuità, rinascita', vimeoUrl:'https://vimeo.com/1019492517', durationMin:90},
      {title:'LEZIONE ITINERANTE - ROMA, 13 OTTOBRE 2024', vimeoUrl:'https://vimeo.com/1021238979', durationMin:90},
      {title:'11 - Lezione EXTRA: il rito romano e i Lupercalia', vimeoUrl:'https://vimeo.com/1020735228', durationMin:90},
  ],

  /* ── breve-sacro-romano (IDCR 225) ── */
  'breve-sacro-romano': [
      {title:'1) Non chiamatela \"religione\" 8/04/24', vimeoUrl:'https://vimeo.com/932207396', durationMin:90, isFree:true},
      {title:'2) Vivere con gli DÈI 11/04/24', vimeoUrl:'https://vimeo.com/933417641', durationMin:90},
      {title:'3) sacra non sagre 15/04/24', vimeoUrl:'https://vimeo.com/935109704', durationMin:90},
      {title:'4) potere e guerra 18/04/24', vimeoUrl:'https://vimeo.com/936430434', durationMin:90},
  ],

  /* ── breve-schiavitu (IDCR 339) ── */
  'breve-schiavitu': [
      {title:'Lezione 1 - Introduzione al corso: la schiavitù nel mondo antico', vimeoUrl:'https://vimeo.com/1066743951', durationMin:90, isFree:true},
      {title:'Lezione 2 - Lo schiavo nel mondo romano', vimeoUrl:'https://vimeo.com/1067908663', durationMin:90},
      {title:'Lezione 3 - Lo schiavo nella letteratura latina', vimeoUrl:'https://vimeo.com/1069011647', durationMin:90},
      {title:'Lezione 4 - Il cristianesimo e la schiavitù', vimeoUrl:'https://vimeo.com/1070128504', durationMin:90},
  ],

  /* ── breve-storie-latine (IDCR 192) ── */
  'breve-storie-latine': [
      {title:'Incontro con le fiabe: Cenerentola e Cappuccetto Rosso', vimeoUrl:'https://vimeo.com/903206305', durationMin:90, isFree:true},
      {title:'Ugo Enrico Paoli e le Fiabe Latine: un mondo di fantasia', vimeoUrl:'https://vimeo.com/904418572', durationMin:90},
      {title:'Lucrezio: l\'amore e la follia nella letteratura latina', vimeoUrl:'https://vimeo.com/905594813', durationMin:90},
      {title:'Dante in Latino: traduzione e trasformazione del I, III e V Canto dell\'Inferno', vimeoUrl:'https://vimeo.com/906696098', durationMin:90},
  ],

  /* ── breve-terre-bibbia (IDCR 311) ── */
  'breve-terre-bibbia': [
      {title:'Sessione 01 - 09/12/2024', vimeoUrl:'https://vimeo.com/1037560036', durationMin:90, isFree:true},
      {title:'Sessione 02 - 16/12/2024', vimeoUrl:'https://vimeo.com/1039802841', durationMin:90},
      {title:'Sessione 03 - 18/12/2024', vimeoUrl:'https://vimeo.com/1040522353', durationMin:90},
      {title:'Sessione 04 - 23/12/2024', vimeoUrl:'https://vimeo.com/1041824088', durationMin:90},
  ],

  /* ── breve-tradurre (IDCR 359) ── */
  'breve-tradurre': [
      {title:'Lezione 1: Il cervello e il testo: fondamenti neuroscientifici della lettura e della traduzione. Problemi e pratiche comuni da superare.', vimeoUrl:'https://vimeo.com/1097625327', durationMin:90, isFree:true},
      {title:'Lezione 2 - Lessico, Acquisizione e rilettura incrementale', vimeoUrl:'https://vimeo.com/1098302754', durationMin:90},
      {title:'Lezione 3 - Dalla comprensione alla resa', vimeoUrl:'https://vimeo.com/1099585074', durationMin:90},
      {title:'Lezione 4 - Dalla lezione alla versione', vimeoUrl:'https://vimeo.com/1100233558', durationMin:90},
  ],

  /* ── breve-tragedia-greci (IDCR 414) ── */
  'breve-tragedia-greci': [
      {title:'Lezione 1: Il Prologo dell\'Agamennone', vimeoUrl:'https://vimeo.com/1188228682', durationMin:90, isFree:true},
      {title:'Lezione 2: l\'omicidio di Agamennone', vimeoUrl:'https://vimeo.com/1192215847', durationMin:90},
      {title:'Lezione 3: l’Edipo Re di Sofocle. Dal prologo alla verità', vimeoUrl:'https://vimeo.com/1192487904', durationMin:90},
  ],

  /* ── breve-voci-vangeli (IDCR 190) ── */
  'breve-voci-vangeli': [
      {title:'Sessione 1 - 15/01/2024', vimeoUrl:'https://vimeo.com/903098237', durationMin:90, isFree:true},
      {title:'Sessione 2 - 18/01/2024', vimeoUrl:'https://vimeo.com/904240139', durationMin:90},
      {title:'Sessione 3 - 22/01/2024', vimeoUrl:'https://vimeo.com/905354717', durationMin:90},
      {title:'Sessione 4 - 25/01/2024', vimeoUrl:'https://vimeo.com/906525685', durationMin:90},
  ],

  /* ── breve-voci-femminili (IDCR 229) ── */
  'breve-voci-femminili': [
      {title:'Sessione 01 - Annunciazione e Accettazione: Maria e l\'Inizio del Nuovo Testamento', vimeoUrl:'https://vimeo.com/948420261', durationMin:90, isFree:true},
      {title:'Sessione 02 - Testimoni della Resurrezione: Maria Maddalena e le Donne al Sepolcro', vimeoUrl:'https://vimeo.com/949648226', durationMin:90},
      {title:'Sessione 03 - Perdono e Giustizia: La Storia della Donna colta in adulterio', vimeoUrl:'https://vimeo.com/950841950', durationMin:90},
      {title:'Sessione 04 - Ponti fra l\'Antico e il Nuovo Testamento: La Storia della Samaritana al Pozzo', vimeoUrl:'https://vimeo.com/952059007', durationMin:90},
  ],

  /* ── breve-nubia-egitto (da Serverplan) ── */
  'breve-nubia-egitto': [
      {title:'Lezione 1 del 30/01/2024', vimeoUrl:'https://vimeo.com/908001898', durationMin:90, isFree:true},
      {title:'Lezione 2 del 06/02/2024', vimeoUrl:'https://vimeo.com/910740602', durationMin:90},
      {title:'Lezione 3 del 13/02/2024', vimeoUrl:'https://vimeo.com/912903063', durationMin:90},
      {title:'Lezione 4 del 22/02/2024', vimeoUrl:'https://vimeo.com/915895871', durationMin:90},
  ],

  /* ── breve-etruschi (da Serverplan) ── */
  'breve-etruschi': [
      {title:'Le origini degli Etruschi', vimeoUrl:'https://vimeo.com/910219240', durationMin:90, isFree:true},
      {title:'L\'espansione etrusca', vimeoUrl:'https://vimeo.com/911367162', durationMin:90},
      {title:'Lingua e scrittura etrusca', vimeoUrl:'https://vimeo.com/912389234', durationMin:90},
      {title:'Veio e la fine degli Etruschi', vimeoUrl:'https://vimeo.com/913488057', durationMin:90},
  ],

  /* ── breve-egiziano-appro (da Serverplan) ── */
  'breve-egiziano-appro': [
      {title:'Lezione 1 del 9 maggio 2024', vimeoUrl:'https://vimeo.com/944576227', durationMin:90, isFree:true},
      {title:'Lezione 2 del 16 maggio 2024', vimeoUrl:'https://vimeo.com/947144346', durationMin:90},
      {title:'Lezione 3 del 23 maggio 2024', vimeoUrl:'https://vimeo.com/949652490', durationMin:90},
      {title:'Lezione 4 del 30 maggio 2024', vimeoUrl:'https://vimeo.com/952075222', durationMin:90},
      {title:'Lezione 5 del 6 giugno 2024', vimeoUrl:'https://vimeo.com/954973762', durationMin:90},
      {title:'Lezione 6 del 13 giugno 2024', vimeoUrl:'https://vimeo.com/957926456', durationMin:90},
      {title:'Lezione 7 del 27 giugno 2024', vimeoUrl:'https://vimeo.com/970144481', durationMin:90},
      {title:'Lezione 8 del 4 luglio 2024', vimeoUrl:'https://vimeo.com/977045666', durationMin:90},
  ],

  /* ── breve-pompei (da Serverplan) ── */
  'breve-pompei': [
      {title:'Incontro 1 - 11 marzo 2024', vimeoUrl:'https://vimeo.com/922206407', durationMin:90, isFree:true},
      {title:'Incontro 2 - 15 marzo 2024', vimeoUrl:'https://vimeo.com/923553951', durationMin:90},
      {title:'Incontro 3 - 18 marzo 2024', vimeoUrl:'https://vimeo.com/924786662', durationMin:90},
      {title:'Incontro 4 - 21 marzo 2024', vimeoUrl:'https://vimeo.com/926057072', durationMin:90},
  ],

  /* ── breve-archeologia (da Serverplan) ── */
  'breve-archeologia': [
      {title:'Scavare nelle profondità del passato', vimeoUrl:'https://vimeo.com/914579107', durationMin:90, isFree:true},
      {title:'L\'interpretazione delle tracce archeologiche', vimeoUrl:'https://vimeo.com/915869064', durationMin:90},
      {title:'Il Cantiere del tempo: evoluzione dello scavo', vimeoUrl:'https://vimeo.com/917126754', durationMin:90},
      {title:'Dal museo al parco: dal magazzino all\'esposizione', vimeoUrl:'https://vimeo.com/918233652', durationMin:90},
  ],


  /* ── Didattica – Modulo 1: Elementa (IDCR 242) ── */
  'did-elementa': [
    {title:'Incontro 1 – La morfologia nominale', vimeoUrl:'https://vimeo.com/1094069190', durationMin:120, isFree:true},
    {title:'Video extra 1',                        vimeoUrl:'https://vimeo.com/797919254',  durationMin:60},
    {title:'Incontro 2 – Lessico e prime declinazioni', vimeoUrl:'https://vimeo.com/956021244', durationMin:120},
    {title:'Video extra 2',                        vimeoUrl:'https://vimeo.com/956023328',  durationMin:60},
    {title:'Video extra 3',                        vimeoUrl:'https://vimeo.com/956024667',  durationMin:60},
    {title:'Incontro 3 – Strutture di base',       vimeoUrl:'https://vimeo.com/956026956',  durationMin:120},
    {title:'Incontro 4 – Testi in classe',         vimeoUrl:'https://vimeo.com/956030134',  durationMin:120},
    {title:'Incontro 5 – Prima lettura estesa',    vimeoUrl:'https://vimeo.com/956032875',  durationMin:120},
    {title:'Elaborato finale',                     vimeoUrl:'',                              durationMin:0},
  ],

  /* ── Didattica – Modulo 2: Principia (IDCR 247) ── */
  'did-principia': [
    {title:'Incontro 1 – La morfologia verbale',            vimeoUrl:'https://vimeo.com/957764542', durationMin:120, isFree:true},
    {title:'Incontro 2 – La sintassi: pars prima',          vimeoUrl:'https://vimeo.com/957772736', durationMin:120},
    {title:'Attività in autoapprendimento – Incontro 2',    vimeoUrl:'https://vimeo.com/954924448', durationMin:60},
    {title:'Incontro 3 – La sintassi: pars altera',         vimeoUrl:'https://vimeo.com/957775662', durationMin:120},
    {title:'Attività in autoapprendimento – Incontro 3',    vimeoUrl:'https://vimeo.com/954924448', durationMin:60},
    {title:'Incontro 4 – Primi approcci al testo autentico',vimeoUrl:'https://vimeo.com/957779134', durationMin:120},
    {title:'Incontro 5 – Traduzione e metodologie',         vimeoUrl:'https://vimeo.com/957784886', durationMin:120},
    {title:'Elaborato finale',                              vimeoUrl:'',                             durationMin:0},
  ],

  /* ── Didattica – Grammatica Latina e Buone Pratiche (IDCR 252) ── */
  'did-grammatica': [
    {title:'Parte 1 – Il Latino come lingua',               vimeoUrl:'https://vimeo.com/966950395', durationMin:120, isFree:true},
    {title:'Parte 2 – I processi cognitivi',                vimeoUrl:'https://vimeo.com/967656487', durationMin:120},
    {title:'Parte 3 – Principi di glottodidattica',         vimeoUrl:'https://vimeo.com/967932807', durationMin:120},
    {title:'Parte 4 – Una lezione con metodo induttivo',    vimeoUrl:'https://vimeo.com/966972032', durationMin:120},
    {title:'Attività in autoapprendimento (1)',              vimeoUrl:'',                             durationMin:0},
    {title:'Parte 5 – L\'insegnamento della grammatica',    vimeoUrl:'https://vimeo.com/967820601', durationMin:120},
    {title:'Parte 6 – L\'insegnamento del lessico',         vimeoUrl:'https://vimeo.com/967828631', durationMin:120},
    {title:'Parte 7 – BES e DSA',                           vimeoUrl:'https://vimeo.com/967835231', durationMin:120},
    {title:'Parte 8 – La valutazione',                      vimeoUrl:'https://vimeo.com/967841804', durationMin:120},
    {title:'Parte 9 – La produzione',                       vimeoUrl:'https://vimeo.com/969069360', durationMin:120},
    {title:'Parte 10 – I bisogni degli apprendenti',        vimeoUrl:'https://vimeo.com/970029621', durationMin:120},
    {title:'Attività in autoapprendimento (2)',              vimeoUrl:'',                             durationMin:0},
  ],

  /* ── Didattica – Modulo 3: Litterae (IDCR 412) ── */
  'did-tertia': [
    {title:'Incontro 1 – Insegnare la letteratura in lingua: obiettivi e riflessioni', vimeoUrl:'https://vimeo.com/1181492062', durationMin:120, isFree:true},
    {title:'Incontro 2 – Le fasi del percorso: prima della lettura',                   vimeoUrl:'https://vimeo.com/1183671058', durationMin:120},
    {title:'Autoapprendimento – Attività 1',                                            vimeoUrl:'',                             durationMin:0},
    {title:'Incontro 3 – Le fasi del percorso: lettura',                               vimeoUrl:'https://vimeo.com/1185791723', durationMin:120},
    {title:'Autoapprendimento – Attività 2',                                            vimeoUrl:'',                             durationMin:0},
    {title:'Incontro 4 – La valutazione',                                              vimeoUrl:'https://vimeo.com/1188008682', durationMin:120},
    {title:'Autoapprendimento – Attività 3',                                            vimeoUrl:'',                             durationMin:0},
    {title:'Incontro 5 – Roma Aeterna: la preparazione dell\'insegnante',              vimeoUrl:'https://vimeo.com/1190043708', durationMin:120},
    {title:'Test finale',                                                               vimeoUrl:'',                             durationMin:0},
  ],
};

/* ── Courses ─────────────────────────────────────────────────── */
const Courses = {
  async getAll() {
    if (_courses) return _courses;
    try {
      const data = await API.get('/api/courses');
      if (data.courses) { _courses = data.courses; return _courses; }
    } catch { /* fallback */ }
    _courses = MOCK_COURSES;
    return _courses;
  },
  async getById(slug) {
    try {
      const data = await API.get(`/api/courses/${slug}`);
      if (data.course) return data.course;
    } catch { /* fallback */ }
    const course = MOCK_COURSES.find(c => c.slug === slug) || MOCK_COURSES[0];
    // Inietta le lezioni reali se disponibili
    if (MOCK_LESSONS[course.slug]) {
      return { ...course, lessons: MOCK_LESSONS[course.slug], lessonCount: MOCK_LESSONS[course.slug].length };
    }
    return course;
  },
};

/* ── Payments ────────────────────────────────────────────────── */

// Cache dei 6 price ID caricati da /api/config/prices
// NULL = non ancora caricato | {} = caricato ma vuoto (env vars mancanti) | {key: 'price_...'} = ok
window.__GLV_PRICES = null;
fetch('/api/config/prices')
  .then(r => {
    if (!r.ok) throw new Error(`/api/config/prices ha risposto con HTTP ${r.status}`);
    return r.json();
  })
  .then(d => {
    window.__GLV_PRICES = d;
    console.log('[GLV] Price ID caricati:', d);
  })
  .catch(err => {
    console.error('[GLV] Impossibile caricare i price ID:', err.message);
    window.__GLV_PRICES = {}; // segna come "tentativo fatto, fallito"
  });

// Restituisce il period attivo in base al toggle (mensile/annuale)
function getCurrentBillingPeriod() {
  const togA = document.getElementById('tog-annual');
  return (togA && togA.classList.contains('active')) ? 'annual' : 'monthly';
}

const Payments = {
  // Avvia checkout per un piano specifico con il periodo corrente del toggle
  async subscribe(plan) {
    // Carica i prezzi se non ancora disponibili
    if (!window.__GLV_PRICES) {
      try {
        const d = await fetch('/api/config/prices').then(r => r.json());
        window.__GLV_PRICES = d;
      } catch {
        showToast('⚠️ Errore di connessione. Riprova tra qualche secondo.', '#8b1a1a');
        return;
      }
    }
    const period = getCurrentBillingPeriod();
    const key = `${plan}_${period}`;
    const priceId = window.__GLV_PRICES[key];
    if (!priceId) {
      showToast('⚠️ Prezzi non ancora disponibili. Attendi e riprova.', '#8b1a1a');
      return;
    }
    return Payments._checkout({ type:'subscription', priceId });
  },
  // Abbonamento diretto: prende piano + periodo esplicitamente (non dal toggle)
  async subscribeDirectly(plan, period) {
    console.log(`[GLV] subscribeDirectly chiamato: piano="${plan}" periodo="${period}"`);

    // Se non loggato → salva piano pendente e apri modal login
    const user = await Auth.getUser();
    if (!user) {
      sessionStorage.setItem('glv_pending_plan', plan);
      sessionStorage.setItem('glv_pending_period', period);
      showAuthModal('login');
      return;
    }

    // Se i prezzi non sono ancora stati caricati, aspetta o riprova
    if (window.__GLV_PRICES === null) {
      console.log('[GLV] Prezzi non ancora caricati, aspetto...');
      try {
        const r = await fetch('/api/config/prices');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        window.__GLV_PRICES = await r.json();
      } catch (err) {
        console.error('[GLV] Errore fetch prezzi:', err);
        showToast('⚠️ Errore caricamento prezzi. Riprova.', '#8b1a1a');
        return;
      }
    }

    const key = `${plan}_${period}`;
    const priceId = window.__GLV_PRICES[key];

    if (!priceId) {
      console.error(`[GLV] Price ID mancante per "${key}". Verifica env vars su Vercel.`);
      showToast('⚠️ Piano non disponibile. Contatta il supporto.', '#8b1a1a');
      return;
    }

    return Payments._checkout({ type:'subscription', priceId });
  },
  // Legacy — usati da [data-subscribe-monthly/annual] nel dashboard
  async subscribeMonthly() { return Payments._checkout({ type:'subscription', priceId: (window.__GLV_PRICES||{})['linguae_monthly'] || '' }); },
  async subscribeAnnual()  { return Payments._checkout({ type:'subscription', priceId: (window.__GLV_PRICES||{})['linguae_annual']  || '' }); },
  async buyCourse(slug)    { return Payments._checkout({ type:'course', courseSlug:slug }); },
  async openPortal() {
    try { const d = await API.post('/api/stripe/portal',{}); if (d.url) window.location.href = d.url; }
    catch { showToast('⚠️ Impossibile aprire il portale abbonamento.', '#8b1a1a'); }
  },
  async _checkout(body) {
    console.log('[GLV] _checkout chiamato con:', body);
    try {
      const d = await API.post('/api/stripe/checkout', body);
      console.log('[GLV] Risposta checkout API:', d);
      if (d.url) {
        window.location.href = d.url;
      } else {
        const msg = d.error || 'Errore sconosciuto dal server.';
        console.error('[GLV] Checkout senza URL:', msg);
        showToast(`⚠️ ${msg}`, '#8b1a1a');
      }
    } catch (err) {
      console.error('[GLV] Errore di rete nel checkout:', err);
      showToast('⚠️ Impossibile contattare il server. Controlla la connessione.', '#8b1a1a');
    }
  },
};

/* ── Card Builder — HTML IDENTICO ALLE FAN-CARD DI INDEX.HTML ── */
/* Colori dot = fan-card (index.html .catalog-preview) */
const LANG_DOT_COLORS = {
  'Latino':               '#5a2e18',
  'Greco Antico':         '#1a3258',
  'Egiziano Geroglifico': '#c9962a',
  'Ebraico Biblico':      '#2a4028',
  'Didattica':            '#3a1e60',
  'Corsi Brevi':          '#2a3a3a',
};

function getLevelLabel(level) {
  if (!level) return '';
  const l = level.toLowerCase();
  if (l.includes('a1')) return 'Livello Base';
  if (l.includes('a2')) return 'Livello Elementare';
  if (l.includes('b1')) return 'Livello Intermedio';
  if (l.includes('b2')) return 'Livello Avanzato';
  if (l.includes('formazione') || l.includes('modulo') || l.includes('percorso')) return 'Formazione Docenti';
  return level;
}

function buildCard(course, opts={}) {
  const slug = course.slug || course.id;
  const grad = LANG_GRADIENTS[course.lang] || LANG_GRADIENTS['Latino'];
  const pct  = course.progressPercent || 0;
  const dot  = LANG_DOT_COLORS[course.lang] || '#555555';

  const newBadge   = course.isNew ? '<span class="fan-card-badge-new">NUOVO</span>' : '';
  const lockIcon   = opts.locked  ? '<span class="fan-card-locked">&#128274;</span>' : '';
  const progressEl = pct > 0
    ? `<div class="fan-card-progress"><div class="fan-card-progress-bar" style="width:${pct}%"></div></div>`
    : '';
  const metaText = course.hours
    ? `${course.hours} ore · Attestato incluso`
    : (course.teacher || '');

  /* ── STRUTTURA IDENTICA A .fan-card (index.html) ── */
  return `
  <div class="course-card" data-slug="${slug}" data-lingua="${(course.lang||'').toLowerCase()}" data-livello="${(course.level||'').toLowerCase()}" onclick="goToCourse('${slug}')">
    <div class="fan-card-header" style="background:${grad};">
      ${newBadge}${lockIcon}
      <div class="fan-card-level">${course.lang} · ${course.level}</div>
      <div class="fan-card-lang">${getLevelLabel(course.level)}</div>
      ${progressEl}
    </div>
    <div class="fan-card-body">
      <div class="fan-card-title card-title">${course.title}</div>
      <div class="fan-card-meta">${metaText}</div>
    </div>
    <div class="fan-card-footer">
      <div class="fan-card-dot" style="background:${dot};"></div>
      <span class="fan-card-status">${course.lang}</span>
    </div>
  </div>`;
}
function goToCourse(slug){ /* corso.html rimossa — scroll alla sezione corsi */ document.getElementById('corsi')?.scrollIntoView({behavior:'smooth'}); }

/* ── Row Renderer ────────────────────────────────────────────── */
async function renderRow(id, filter, locked=false){
  const el=document.getElementById(id); if(!el)return;
  const all=await Courses.getAll();
  const list=typeof filter==='function'?filter(all):all.filter(c=>c.lang===filter);
  el.innerHTML=list.map(c=>buildCard(c,{locked})).join('');
}

/* ── Navbar ──────────────────────────────────────────────────── */
function initNav(){
  const nav=document.querySelector('.glv-nav'); if(!nav)return;
  window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>20));
}
async function initNavAuth(){
  const user=await Auth.getUser();
  document.querySelectorAll('[data-if-logged]').forEach(el=>el.style.display=user?'':'none');
  document.querySelectorAll('[data-if-guest]').forEach(el=>el.style.display=user?'none':'');
  if(user) document.querySelectorAll('.nav-avatar-initials').forEach(el=>el.textContent=(user.fullName||user.email||'U')[0].toUpperCase());
}

/* ── Pricing Toggle ──────────────────────────────────────────── */
function initPricing(){
  const togM = document.getElementById('tog-monthly');
  const togA = document.getElementById('tog-annual');
  if (!togM || !togA) return;

  function applyPlan(plan) {
    const isAnnual = plan === 'annual';
    // toggle buttons
    togM.classList.toggle('active', !isAnnual);
    togA.classList.toggle('active',  isAnnual);
    // prezzi
    document.querySelectorAll('.js-price').forEach(el => {
      el.textContent = isAnnual ? el.dataset.a : el.dataset.m;
    });
    document.querySelectorAll('.js-cadenza').forEach(el => {
      el.textContent = isAnnual ? el.dataset.a : el.dataset.m;
    });
    document.querySelectorAll('.js-saving').forEach(el => {
      el.textContent = isAnnual ? el.dataset.a : el.dataset.m;
    });
    // Bonus Docenti box appare solo sull'annuale
    const bd = document.getElementById('bonus-docenti-box');
    if (bd) bd.style.display = isAnnual ? '' : 'none';
  }

  togM.addEventListener('click', () => applyPlan('monthly'));
  togA.addEventListener('click', () => applyPlan('annual'));
  applyPlan('annual'); // default annuale
}

/* ── FAQ ─────────────────────────────────────────────────────── */
function initFaq(){
  document.querySelectorAll('.faq-question').forEach(btn=>btn.addEventListener('click',()=>{
    const answer=btn.nextElementSibling; const isOpen=btn.classList.contains('open');
    document.querySelectorAll('.faq-question.open').forEach(b=>{b.classList.remove('open');b.nextElementSibling.style.maxHeight='0';});
    if(!isOpen){btn.classList.add('open');answer.style.maxHeight=answer.scrollHeight+'px';}
  }));
}

/* ── Catalog Filters ─────────────────────────────────────────── */
async function initCatalogFilters(){
  const grid=document.getElementById('catalog-grid'); if(!grid)return;
  const filtersBar=document.getElementById('catalogFilters');
  const all=await Courses.getAll();

  /* Rimuovi skeleton */
  grid.querySelectorAll('.skeleton-card').forEach(s=>s.remove());

  /* Lingue uniche nell'ordine desiderato */
  const langOrder=['Tutti','Latino','Greco Antico','Egiziano Geroglifico','Ebraico Biblico','Didattica','Corsi Brevi'];
  const present=new Set(all.map(c=>c.lang));
  const langs=['Tutti',...langOrder.filter(l=>l!=='Tutti'&&present.has(l))];

  /* Inietta filter-tab nel DOM */
  if(filtersBar){
    filtersBar.innerHTML=langs.map((l,i)=>
      `<button class="filter-tab${i===0?' active':''}" data-lingua="${l==='Tutti'?'':l}">${l}</button>`
    ).join('');
  }

  /* Render griglia */
  function render(lang){
    const list=lang?all.filter(c=>c.lang===lang):all;
    grid.innerHTML=list.map(c=>buildCard(c)).join('');
    const cnt=document.getElementById('resultCount');
    if(cnt) cnt.textContent=list.length;
  }

  /* Click handler sui tab */
  document.addEventListener('click', e=>{
    const tab=e.target.closest('.filter-tab');
    if(!tab||!filtersBar||!filtersBar.contains(tab))return;
    filtersBar.querySelectorAll('.filter-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    render(tab.dataset.lingua);
    /* Sync sidebar lingua */
    const lang=tab.dataset.lingua||'tutti';
    document.querySelectorAll('#sidebarLingue .sidebar-filter-item').forEach(i=>{
      i.classList.toggle('active', i.dataset.lang===(lang||'tutti'));
    });
  });

  render(''); /* mostra tutti all'avvio */
}

/* ── Dashboard ───────────────────────────────────────────────── */
async function initDashboard(){
  if(!document.getElementById('row-continua'))return;
  const user=await Auth.getUser();
  if(!user){ window.location.href='index.html'; return; }
  await renderRow('row-continua',  c=>c.filter(x=>(x.progressPercent||0)>0));
  await renderRow('row-nuovi',     c=>c.filter(x=>x.isNew).slice(0,8));
  await renderRow('row-latino',    'Latino');
  await renderRow('row-greco',     'Greco Antico');
  await renderRow('row-egiziano',  'Egiziano Geroglifico');
  await renderRow('row-ebraico',   'Ebraico Biblico');
  await renderRow('row-brevi',     'Corsi Brevi');
  await renderRow('row-didattica', 'Didattica');
}

/* ── Landing Preview ─────────────────────────────────────────── */
async function initLandingPreview(){
  const row=document.getElementById('row-preview'); if(!row)return;
  const all=await Courses.getAll();
  row.innerHTML=all.slice(0,10).map(c=>buildCard(c,{locked:true})).join('');
}

/* ── Video Player (globale, usato da initCorsoPage) ─────────── */
let _previewTimer = null;

function playLesson(vimeoUrl, title, isPreview, lessonId, resumeAt) {
  const section = document.getElementById('video-player-section');
  const iframe  = document.getElementById('vimeo-iframe');
  const titleEl = document.getElementById('video-player-title');
  if (!section || !iframe || !vimeoUrl) return;

  // Resetta eventuale timer di anteprima precedente
  if (_previewTimer) { clearTimeout(_previewTimer); _previewTimer = null; }
  const oldOverlay = document.getElementById('preview-overlay');
  if (oldOverlay) oldOverlay.remove();
  iframe.style.display = '';

  // Supporta URL normali (vimeo.com/123) e URL con hash privato (vimeo.com/123/abcdef)
  const match = vimeoUrl.match(/vimeo\.com\/(\d+)(?:\/([a-f0-9]+))?/);
  if (!match) return;
  const hashParam = match[2] ? `&h=${match[2]}` : '';
  iframe.src = `https://player.vimeo.com/video/${match[1]}?autoplay=1&title=0&byline=0&portrait=0${hashParam}`;
  if (titleEl) titleEl.textContent = title || '';
  section.style.display = '';
  section.scrollIntoView({ behavior:'smooth', block:'start' });

  // Anteprima: blocca dopo 10 minuti
  if (isPreview) {
    _previewTimer = setTimeout(() => {
      iframe.src = '';
      iframe.style.display = 'none';
      const overlay = document.createElement('div');
      overlay.id = 'preview-overlay';
      overlay.style.cssText = [
        'position:absolute','inset:0','display:flex','flex-direction:column',
        'align-items:center','justify-content:center','background:rgba(10,10,20,0.92)',
        'color:#fff','z-index:10','border-radius:8px','gap:1.2rem',
        'padding:2rem','text-align:center'
      ].join(';');
      overlay.innerHTML = `
        <i class="fas fa-lock" style="font-size:2.8rem;color:var(--accent);"></i>
        <h3 style="margin:0;font-size:1.25rem;font-weight:700;">Anteprima terminata</h3>
        <p style="margin:0;opacity:.75;max-width:320px;line-height:1.5;">
          Hai visto i primi 10 minuti di questa lezione.<br>
          Iscriviti al corso per guardare tutto il contenuto.
        </p>
        <a href="mailto:info@grecolatinovivo.it"
           style="background:var(--accent);color:#000;padding:.65rem 1.5rem;border-radius:6px;
                  text-decoration:none;font-weight:700;font-size:.95rem;margin-top:.4rem;">
          Informazioni e iscrizione
        </a>`;
      const wrapper = iframe.closest('.video-wrapper, [id*="player"], #video-player-section') || iframe.parentElement;
      if (wrapper) { wrapper.style.position = 'relative'; wrapper.appendChild(overlay); }
    }, 10 * 60 * 1000); // 10 minuti
  }
}

/* ── Corso Page ──────────────────────────────────────────────── */
async function initCorsoPage(){
  const thumb=document.getElementById('corso-thumb'); if(!thumb)return;
  const params=new URLSearchParams(window.location.search);
  const slug=params.get('id')||'lat-a11';
  const course=await Courses.getById(slug);
  const grad=LANG_GRADIENTS[course.lang]||LANG_GRADIENTS['Latino'];

  document.querySelectorAll('.js-corso-title').forEach(el=>el.textContent=course.title);
  document.querySelectorAll('.js-corso-lang').forEach(el=>el.textContent=course.lang);
  document.querySelectorAll('.js-corso-level').forEach(el=>el.textContent=course.level);
  document.querySelectorAll('.js-corso-lessons').forEach(el=>el.textContent=course._count?.lessons||course.lessonCount||24);
  document.querySelectorAll('.js-corso-hours').forEach(el=>el.textContent=course.hours||'—');
  document.querySelectorAll('.js-corso-price').forEach(el=>el.textContent=course.priceEur?Math.round(course.priceEur/100)+' €':'—');
  document.querySelectorAll('.js-corso-desc').forEach(el=>el.textContent=course.description||'');
  if(course.teacher){
    document.querySelectorAll('.js-corso-teacher').forEach(el=>el.textContent=course.teacher);
    const initials=course.teacher.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    document.querySelectorAll('.js-corso-teacher-initials').forEach(el=>el.textContent=initials);
  }
  const heroEl=document.getElementById('corso-hero-color'); if(heroEl)heroEl.style.background=grad;
  thumb.style.background=grad;

  document.querySelectorAll('[data-buy-course]').forEach(btn=>btn.addEventListener('click',()=>Payments.buyCourse(slug)));

  const ll=document.getElementById('lessons-list'); if(!ll)return;
  const lessons=course.lessons||[];

  if(lessons.length>0){
    // Aggiorna il conteggio lezioni
    const countLabel = document.getElementById('lessons-count-label');
    if (countLabel) countLabel.textContent = `(${lessons.length} lezioni · ${course.hours||'—'} ore)`;

    ll.innerHTML=lessons.map((l,i)=>{
      const canPlay = l.isFree || course.hasAccess;
      const hasVideo = !!l.vimeoUrl;
      return `
      <div class="lesson-item ${l.isFree?'free':''}" style="cursor:${canPlay&&hasVideo?'pointer':'default'};"
           data-lesson-id="${l.id||''}"
           onclick="${canPlay&&hasVideo?`playLesson('${l.vimeoUrl}','${l.title.replace(/'/g,"\\'")}',${l.isFree&&!course.hasAccess},'${l.id||''}',${0})`:''}" >
        <span class="lesson-num">${String(i+1).padStart(2,'0')}</span>
        <span class="lesson-title">${l.title}</span>
        <span class="lesson-duration">${l.durationMin||'90'} min</span>
        ${canPlay&&hasVideo
          ? `<span class="lesson-lock" style="color:var(--accent);"><i class="fas fa-${l.isFree?'unlock-alt':'play-circle'}"></i></span>`
          : !hasVideo
            ? `<span class="lesson-lock" style="color:var(--text-muted);font-size:11px;">—</span>`
            : '<span class="lesson-lock"><i class="fas fa-lock"></i></span>'
        }
      </div>`;
    }).join('');
  } else {
    const count=course.lessonCount||24;
    ll.innerHTML=Array.from({length:Math.min(count,8)},(_,i)=>`
      <div class="lesson-item ${i<2?'free':''}">
        <span class="lesson-num">${String(i+1).padStart(2,'0')}</span>
        <span class="lesson-title">Lezione ${i+1} — ${course.lang} ${course.level}</span>
        <span class="lesson-duration">90 min</span>
        <span class="lesson-lock"><i class="fas fa-${i<2?'unlock-alt':'lock'}"></i></span>
      </div>`).join('')+(count>8?`<p style="padding:16px 0;color:var(--text-muted);font-size:13px;">... e altre ${count-8} lezioni</p>`:'');
  }
  if(params.get('purchased')==='1'){ showToast('✓ Acquisto completato! Hai ora accesso al corso.'); window.history.replaceState({},'',window.location.pathname+'?id='+slug); }
}

/* ── Profilo Page ────────────────────────────────────────────── */
async function initProfiloPage(){
  if(!document.querySelector('.profile-hero'))return;
  const user=await Auth.getUser();
  if(!user){ window.location.href='index.html'; return; }
  document.querySelectorAll('.js-user-name').forEach(el=>el.textContent=user.fullName||user.email);
  document.querySelectorAll('.js-user-email').forEach(el=>el.textContent=user.email);
  document.querySelectorAll('.js-user-initials').forEach(el=>el.textContent=(user.fullName||user.email||'U')[0].toUpperCase());
  if(user.subscription){
    const end=new Date(user.subscription.currentPeriodEnd).toLocaleDateString('it-IT');
    document.querySelectorAll('.js-sub-plan').forEach(el=>el.textContent=user.subscription.plan==='annual'?'Annuale':'Mensile');
    document.querySelectorAll('.js-sub-renew').forEach(el=>el.textContent=end);
    document.querySelectorAll('.js-sub-status').forEach(el=>el.textContent=user.subscription.status==='active'?'Attivo':user.subscription.status);
  }
  document.querySelectorAll('[data-open-portal]').forEach(btn=>btn.addEventListener('click',()=>Payments.openPortal()));
  const form=document.getElementById('profile-form'); if(!form)return;
  const nameInput=form.querySelector('[name="fullName"]'); if(nameInput)nameInput.value=user.fullName||'';
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const fullName=nameInput?.value?.trim(); if(!fullName)return;
    const btn=form.querySelector('[type="submit"]'); btn.disabled=true; btn.textContent='Salvataggio...';
    const result=await API.put('/api/user/profile',{fullName});
    btn.disabled=false;
    if(result.user){ _user={..._user,fullName}; btn.textContent='✓ Salvato'; setTimeout(()=>btn.textContent='Salva modifiche',2000); }
    else{ alert(result.error||'Errore.'); btn.textContent='Salva modifiche'; }
  });
}

/* ── Auth Modals ─────────────────────────────────────────────── */
const IS = 'display:block;width:100%;padding:12px 14px;background:#fff;border:1.5px solid #e0e0e0;color:#232323;border-radius:4px;font-family:inherit;font-size:14px;margin-bottom:12px;box-sizing:border-box;transition:border-color .2s;';

function showAuthModal(mode){
  const ex=document.getElementById('glv-auth-modal'); if(ex)ex.remove();
  const modal=document.createElement('div');
  modal.id='glv-auth-modal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML=`
    <div style="background:#fff;border:1.5px solid #e0e0e0;border-radius:12px;padding:40px;width:100%;max-width:420px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.2);">
      <button aria-label="Chiudi" onclick="document.getElementById('glv-auth-modal').remove()" style="position:absolute;top:16px;right:16px;background:none;border:none;color:#888;font-size:22px;cursor:pointer;line-height:1;" >×</button>
      <div style="font-family:Montserrat,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a01a36;margin-bottom:8px;">GrecoLatinoVivo</div>
      <h2 style="font-family:Montserrat,sans-serif;font-size:22px;font-weight:800;margin-bottom:28px;color:#232323;">${mode==='login'?'Accedi al portale':'Crea il tuo account'}</h2>
      <form id="auth-form">
        ${mode==='register'?`<input name="fullName" type="text" placeholder="Nome e cognome" style="${IS}">`:''}
        <input name="email" type="email" placeholder="Email" required style="${IS}">
        ${mode==='register'?`<input name="confirmEmail" type="email" placeholder="Conferma email" required style="${IS}">`:''}
        <div style="position:relative;margin-bottom:12px;">
          <input name="password" id="glv-pw-input" type="password" placeholder="Password" required style="display:block;width:100%;padding:12px 44px 12px 14px;background:#fff;border:1.5px solid #e0e0e0;color:#232323;border-radius:4px;font-family:inherit;font-size:14px;box-sizing:border-box;transition:border-color .2s;">
          <button type="button" id="glv-pw-toggle" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#aaa;font-size:17px;padding:0;line-height:1;" title="Mostra/nascondi password">👁</button>
        </div>
        <button type="submit" style="display:block;width:100%;padding:14px;background:#232323;color:#fff;border:none;border-radius:4px;font-family:Montserrat,sans-serif;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;margin-top:4px;">
          ${mode==='login'?'Accedi →':'Registrati →'}
        </button>
        <p id="auth-error" style="color:#a01a36;font-size:12px;margin-top:10px;display:none;"></p>
      </form>
      <p style="text-align:center;font-size:12px;color:#888;margin-top:20px;">
        ${mode==='login'
          ?`Non hai un account? <a href="#" style="color:#a01a36;font-weight:600;" onclick="event.preventDefault();document.getElementById('glv-auth-modal').remove();showAuthModal('register')">Registrati</a>`
          :`Hai già un account? <a href="#" style="color:#a01a36;font-weight:600;" onclick="event.preventDefault();document.getElementById('glv-auth-modal').remove();showAuthModal('login')">Accedi</a>`}
      </p>
    </div>`;
  document.body.appendChild(modal);
  // Occhiolino mostra/nascondi password
  document.getElementById('glv-pw-toggle').addEventListener('click',function(){
    const inp=document.getElementById('glv-pw-input');
    const show=inp.type==='password';
    inp.type=show?'text':'password';
    this.style.color=show?'#a01a36':'#aaa';
  });
  document.getElementById('auth-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const f=e.target; const email=f.email.value.trim(); const password=f.password.value; const fullName=f.fullName?.value?.trim();
    const errEl=document.getElementById('auth-error'); const btn=f.querySelector('[type="submit"]');
    // Valida doppia email in fase di registrazione
    if(mode==='register'){
      const confirmEmail=f.confirmEmail?.value?.trim();
      if(email!==confirmEmail){ errEl.textContent='Le email non corrispondono.'; errEl.style.display='block'; return; }
    }
    btn.disabled=true; btn.textContent='Attendere...';
    const result=mode==='login'?await Auth.login(email,password):await Auth.register(email,password,fullName);
    if(result.ok){
      modal.remove();
      const pendingPlan   = sessionStorage.getItem('glv_pending_plan');
      const pendingPeriod = sessionStorage.getItem('glv_pending_period') || getCurrentBillingPeriod();
      if(pendingPlan){
        sessionStorage.removeItem('glv_pending_plan');
        sessionStorage.removeItem('glv_pending_period');
        const key = `${pendingPlan}_${pendingPeriod}`;
        const priceId = window.__GLV_PRICES[key];
        if(priceId){ await Payments._checkout({ type:'subscription', priceId }); return; }
      }
      // Controlla parametro redirect (es. ?redirect=admin per il pannello admin)
      const redirectParam = new URLSearchParams(window.location.search).get('redirect');
      if(redirectParam === 'admin'){ window.location.href = 'admin.html'; return; }
      window.location.href='index.html';
    }
    else{ errEl.textContent=result.error||'Errore. Riprova.'; errEl.style.display='block'; btn.disabled=false; btn.textContent=mode==='login'?'Accedi →':'Registrati →'; }
  });
}

function showToast(msg, color='#232323'){
  const t=document.createElement('div');
  t.style.cssText=`position:fixed;bottom:24px;right:24px;background:${color};color:#fff;padding:14px 22px;border-radius:6px;font-weight:600;font-size:13px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.18);animation:toast-in .3s ease;`;
  t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),5000);
}

function initAuthModals(){
  document.querySelectorAll('[data-open-login]').forEach(btn=>btn.addEventListener('click',e=>{
    e.preventDefault();
    const plan = btn.dataset.plan || null;
    if (plan) sessionStorage.setItem('glv_pending_plan', plan);
    if (plan) sessionStorage.setItem('glv_pending_period', getCurrentBillingPeriod());
    showAuthModal('login');
  }));
  document.querySelectorAll('[data-open-register]').forEach(btn=>btn.addEventListener('click',async e=>{
    e.preventDefault();
    const plan = btn.dataset.plan || null;
    console.log('[GLV] Pulsante abbonamento cliccato — piano:', plan || '(nessuno)');
    // Se il pulsante ha un piano → vai diretto a Stripe (auth non richiesta)
    if (plan) {
      const origText = btn.textContent;
      btn.textContent = 'Caricamento…';
      btn.disabled = true;
      try {
        await Payments.subscribe(plan);
      } catch(err) {
        console.error('[GLV] Errore in Payments.subscribe:', err);
        showToast('⚠️ Errore: ' + err.message, '#8b1a1a');
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
      }
      return;
    }
    showAuthModal('register');
  }));
  document.querySelectorAll('[data-logout]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();Auth.logout();}));
  // Pulsanti abbonamento diretto: data-subscribe-direct data-plan="cultura" data-period="monthly|annual"
  document.querySelectorAll('[data-subscribe-direct]').forEach(btn=>btn.addEventListener('click',async e=>{
    e.preventDefault();
    const plan   = btn.dataset.plan;
    const period = btn.dataset.period;
    if (plan && period) await Payments.subscribeDirectly(plan, period);
  }));
}

function initUrlFeedback(){
  const p=new URLSearchParams(window.location.search);
  if(p.get('subscribed')==='1'){ showToast('✓ Abbonamento attivato. Accesso al portale abilitato.'); window.history.replaceState({},'',window.location.pathname); }
}

/* ── Mobile — Bottom Navigation Bar ─────────────────────────── */
function initMobileNav(){
  if(window.innerWidth > 768) return;

  // Rileva pagina corrente
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const isActive = (page) => path === page || (page === 'index.html' && (path === '' || path === '/'));

  const nav = document.createElement('nav');
  nav.className = 'glv-bottom-nav';
  nav.setAttribute('aria-label', 'Navigazione principale');
  nav.innerHTML = `
    <a href="index.html"  class="bottom-nav-item ${isActive('index.html') ? 'active':''}" aria-label="Home">
      <i class="fas fa-home bottom-nav-icon" aria-hidden="true"></i><span>Home</span>
    </a>
    <a href="#corsi" class="bottom-nav-item" aria-label="Corsi">
      <i class="fas fa-th-large bottom-nav-icon" aria-hidden="true"></i><span>Corsi</span>
    </a>
    <a href="#prezzi" class="bottom-nav-item" aria-label="Abbonati">
      <i class="fas fa-star bottom-nav-icon" aria-hidden="true"></i><span>Abbonati</span>
    </a>
  `;
  document.body.appendChild(nav);
  // Padding-bottom per evitare che il nav fisso copra i contenuti cliccabili
  document.body.style.paddingBottom = '64px';
}

/* ── Mobile — Sticky CTA Bar (corso.html) ────────────────────── */
function initMobileStickyCta(){
  if(window.innerWidth > 768) return;
  // Solo su corso.html — verifica presenza della CTA card nel DOM
  const ctaCard = document.querySelector('.corso-cta-card');
  if(!ctaCard) return;

  // Slug dalla URL per l'azione corretta
  const slug = new URLSearchParams(window.location.search).get('id') || 'lat-a11';

  // Leggi prezzo dinamico (popolato da initCorsoPage)
  const priceEl  = document.querySelector('.js-corso-price');
  const priceSub = ctaCard.querySelector('.corso-price-sub');
  const priceText = priceEl ? priceEl.textContent : '—';
  const subText   = priceSub ? priceSub.textContent : 'o incluso nell\'abbonamento';

  const bar = document.createElement('div');
  bar.className = 'mobile-sticky-cta';
  bar.innerHTML = `
    <div style="flex:1; min-width:0;">
      <div class="cta-price">${priceText}</div>
      <div class="cta-sub" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${subText}</div>
    </div>
    <button class="btn btn-primary" style="flex-shrink:0;" onclick="goToCourse('${slug}')">
      &#9654; Accedi
    </button>
  `;
  document.body.appendChild(bar);
  document.body.classList.add('has-corso-cta');

  // Nascondi quando il video player è aperto (evita sovrapposizione)
  const playerSection = document.getElementById('video-player-section');
  if(playerSection){
    const observer = new MutationObserver(()=>{
      const playerVisible = playerSection.style.display !== 'none';
      bar.style.display = playerVisible ? 'none' : 'flex';
    });
    observer.observe(playerSection, { attributes: true, attributeFilter: ['style'] });
  }
}

/* ── Mobile — Scroll Snap feedback su course rows ────────────── */
function initTouchRows(){
  if(window.innerWidth > 768) return;
  document.querySelectorAll('.courses-row').forEach(row=>{
    // Aggiunge scroll-snap via JS per sicurezza cross-browser
    row.style.scrollSnapType = 'x mandatory';
    row.querySelectorAll('.course-card').forEach(card=>{
      card.style.scrollSnapAlign = 'start';
    });
  });
}

/* ── Init ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',async()=>{
  initNav(); initNavAuth(); initPricing(); initFaq(); initAuthModals(); initUrlFeedback();
  await initDashboard(); await initLandingPreview(); await initCatalogFilters();
  await initCorsoPage(); await initProfiloPage();
  // Mobile — dopo le init principali
  initMobileNav();
  initMobileStickyCta();
  initTouchRows();
});

window.goToCourse    = goToCourse;
window.showAuthModal = showAuthModal;
