// prisma/seed.js — Popola il DB con tutti i 56 corsi del portale GLV
// Esegui con: npm run db:seed
// Fonte dati: public/js/app.js (MOCK_COURSES) — sincronizzato il 17/05/2026

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── CORSI (56 totali) ────────────────────────────────────────────────────────
const COURSES = [

  // ── LATINO ────────────────────────────────────────────────────────────────
  { slug:'lat-a11', lang:'Latino', level:'A1.1', sortOrder:10,
    title:'Corso di lingua latina A1.1 • E-Learning',
    description:'Parti da zero con un metodo rigoroso basato sulle ricerche neurocognitive. Declinazioni, morfologia nominale, verbo esse.',
    priceEur:13000, isNew:false, isAvailable:true },

  { slug:'lat-a12', lang:'Latino', level:'A1.2', sortOrder:11,
    title:'Corso di lingua latina A1.2 • E-Learning',
    description:'Terza, quarta e quinta declinazione. Struttura grammaticale del latino: concordanze, forme verbali, prime strutture del periodo.',
    priceEur:13000, isNew:false, isAvailable:true },

  { slug:'lat-a21', lang:'Latino', level:'A2.1', sortOrder:12,
    title:'Corso di lingua latina A2.1 • E-Learning',
    description:'Sistema dei casi completo, concordanze avanzate, forme verbali essenziali. Prime letture di testi autentici adattati.',
    priceEur:15000, isNew:false, isAvailable:true },

  { slug:'lat-a22', lang:'Latino', level:'A2.2', sortOrder:13,
    title:'Corso di lingua latina A2.2 • E-Learning',
    description:'Accusativo con infinito, ablativo assoluto, subordinate finali e causali. Approfondimento sintattico e lessicale.',
    priceEur:15000, isNew:false, isAvailable:true },

  { slug:'lat-b11', lang:'Latino', level:'B1.1', sortOrder:14,
    title:'Corso di lingua latina B1.1 • E-Learning',
    description:'Lettura di Cicerone e Cesare in originale. Analisi retorica del testo, strutture sintattiche avanzate, traduzione guidata.',
    priceEur:18000, isNew:false, isAvailable:true },

  { slug:'lat-b12', lang:'Latino', level:'B1.2', sortOrder:15,
    title:'Corso di lingua latina B1.2 • E-Learning',
    description:'Virgilio e la poesia epica: Eneide, metrica latina, figure retoriche. Introduzione alla poesia augustea.',
    priceEur:18000, isNew:false, isAvailable:true },

  { slug:'lat-b13', lang:'Latino', level:'B1.3', sortOrder:16,
    title:'Corso di lingua latina B1.3 • E-Learning',
    description:'Ovidio, Orazio e la poesia lirica. Elegia latina, epigramma, generi poetici del I sec. a.C.',
    priceEur:18000, isNew:false, isAvailable:true },

  // ── GRECO ANTICO ──────────────────────────────────────────────────────────
  { slug:'gr-a11', lang:'Greco Antico', level:'A1.1', sortOrder:20,
    title:'Corso di greco antico A1.1 • E-Learning',
    description:'Alfabeto greco, pronuncia restituita, prime declinazioni e coniugazioni. 18 ore in 12 lezioni da 90 minuti.',
    priceEur:13000, isNew:false, isAvailable:true },

  { slug:'gr-a12', lang:'Greco Antico', level:'A1.2', sortOrder:21,
    title:'Corso di greco antico A1.2 • E-Learning',
    description:'Il verbo contratto, il sistema verbale greco, le particelle. Accesso a biblioteca digitale di testi greci antichi.',
    priceEur:13000, isNew:false, isAvailable:true },

  { slug:'gr-a21', lang:'Greco Antico', level:'A2.1', sortOrder:22,
    title:'Corso di greco antico A2.1 • E-Learning',
    description:'Testi da Platone e Senofonte adattati. Il periodo ipotetico. Biblioteca digitale inclusa.',
    priceEur:15000, isNew:false, isAvailable:true },

  { slug:'gr-a22', lang:'Greco Antico', level:'A2.2', sortOrder:23,
    title:'Corso di greco antico A2.2 • E-Learning',
    description:'Il participio greco: usi e costrutti. Sintassi del periodo complesso. Letture da Plutarco e Luciano.',
    priceEur:15000, isNew:false, isAvailable:true },

  { slug:'gr-b11', lang:'Greco Antico', level:'B1.1', sortOrder:24,
    title:'Corso di greco antico B1.1 • E-Learning',
    description:"Omero: lettura dell'Iliade in originale. Metrica epica, dialetto ionico, formulaicità omerica.",
    priceEur:18000, isNew:false, isAvailable:true },

  { slug:'gr-b12', lang:'Greco Antico', level:'B1.2', sortOrder:25,
    title:'Corso di greco antico B1.2 • E-Learning',
    description:'I tragici greci: Sofocle, Euripide, la struttura del dramma attico. Letture in originale.',
    priceEur:18000, isNew:false, isAvailable:true },

  { slug:'gr-b13', lang:'Greco Antico', level:'B1.3', sortOrder:26,
    title:'Corso di greco antico B1.3 • E-Learning',
    description:'Lirici greci, Pindaro, Saffo. Filosofia presocratica in lingua. Storiografia: Tucidide.',
    priceEur:18000, isNew:false, isAvailable:true },

  // ── EGIZIANO GEROGLIFICO ─────────────────────────────────────────────────
  { slug:'eg-a11', lang:'Egiziano Geroglifico', level:'A1.1', sortOrder:30,
    title:'Corso di Egiziano Geroglifico A1.1 • E-Learning',
    description:'I geroglifici: logogrammi e fonogrammi. Lettura delle prime iscrizioni. Introduzione al medio-egiziano.',
    priceEur:17000, isNew:false, isAvailable:true },

  { slug:'eg-a12', lang:'Egiziano Geroglifico', level:'A1.2', sortOrder:31,
    title:'Corso di Egiziano Geroglifico A1.2 • E-Learning',
    description:'Il medio-egiziano: morfologia nominale, il verbo egiziano. Testi del Medio Regno.',
    priceEur:17000, isNew:false, isAvailable:true },

  { slug:'eg-a21', lang:'Egiziano Geroglifico', level:'A2', sortOrder:32,
    title:'Corso di Egiziano Geroglifico A2 • E-Learning',
    description:'Testi autentici: il Libro dei Morti, iscrizioni tombali, letteratura del Medio Regno.',
    priceEur:19000, isNew:false, isAvailable:true },

  // ── EBRAICO BIBLICO ──────────────────────────────────────────────────────
  { slug:'eb-a11', lang:'Ebraico Biblico', level:'A1.1', sortOrder:40,
    title:'Ebraico Biblico A1.1 • E-Learning',
    description:"L'alfabeto ebraico, scrittura destra-sinistra, vocali masoretiche. 18 ore di formazione.",
    priceEur:17000, isNew:false, isAvailable:true },

  { slug:'eb-a12', lang:'Ebraico Biblico', level:'A1.2', sortOrder:41,
    title:'Ebraico Biblico A1.2 • E-Learning',
    description:'Il verbo forte, prime radici trilittere. Lettura del Genesi in originale.',
    priceEur:17000, isNew:false, isAvailable:true },

  { slug:'eb-a21', lang:'Ebraico Biblico', level:'A2', sortOrder:42,
    title:'Ebraico Biblico A2 • E-Learning',
    description:'La prosa narrativa biblica: Esodo, Salmi, sintassi ebraica avanzata.',
    priceEur:19000, isNew:false, isAvailable:true },

  // ── DIDATTICA (formazione docenti, Bonus Docenti) ─────────────────────────
  { slug:'did-elementa', lang:'Didattica', level:'Formazione – Modulo 1', sortOrder:50,
    title:'Didattica del Latino: Pars Prima – Elementa',
    description:'Metodo induttivo-contestuale per principianti: morfologia nominale, lessico, prime declinazioni. 10h video + 10h autoapprendimento. Bonus Docenti attivo.',
    priceEur:15000, isNew:false, isAvailable:true },

  { slug:'did-principia', lang:'Didattica', level:'Formazione – Modulo 2', sortOrder:51,
    title:'Didattica del Latino: Pars Secunda – Principia',
    description:'Livello intermedio: morfologia verbale, sintassi, testi autentici. Prerequisito: Elementa. 10h video + 10h autonomo. Bonus Docenti attivo.',
    priceEur:18000, isNew:false, isAvailable:true },

  { slug:'did-grammatica', lang:'Didattica', level:'Formazione – Percorso', sortOrder:52,
    title:'Grammatica Latina e Buone Pratiche Didattiche',
    description:'Metodologia grammaticale-traduttiva e glottodidattica. Come rendere la grammatica più efficace in classe. 20 ore in 10 parti. Bonus Docenti attivo.',
    priceEur:17000, isNew:false, isAvailable:true },

  { slug:'did-tertia', lang:'Didattica', level:'Formazione – Modulo 3', sortOrder:53,
    title:'Didattica della Letteratura Latina: Pars Tertia – Litterae',
    description:'Letteratura latina in classe: approcci, testi, metodi. Come rendere la letteratura classica viva e accessibile. Bonus Docenti attivo.',
    priceEur:18000, isNew:true, isAvailable:true },

  // ── CORSI BREVI ───────────────────────────────────────────────────────────
  { slug:'breve-marziale', lang:'Corsi Brevi', level:'Autori Latini', sortOrder:100,
    title:'Marziale per principianti avanzati',
    description:'Ironia e critica della società del benessere negli Epigrammi. 4 ore.',
    priceEur:2900, isNew:false, isAvailable:true },

  { slug:'breve-tradurre', lang:'Corsi Brevi', level:'Metodo', sortOrder:101,
    title:'Tradurre senza scomporre',
    description:'Un approccio neuroscientifico al testo classico: come tradurre con fluidità. 4 ore.',
    priceEur:2900, isNew:false, isAvailable:true },

  { slug:'breve-japonia', lang:'Corsi Brevi', level:'Autori Latini', sortOrder:102,
    title:'Terra Japonia: un viaggio in latino nel Giappone del Cinquecento',
    description:'Un testo in latino del XVI secolo che racconta il Giappone. Lettura guidata. 4 ore.',
    priceEur:2900, isNew:false, isAvailable:false },

  { slug:'breve-metrica', lang:'Corsi Brevi', level:'Metodo', sortOrder:103,
    title:'Il ritmo del verso: approccio neuroscientifico alla metrica classica',
    description:'Come il cervello elabora il ritmo poetico. Metrica latina e greca in chiave cognitiva. 4 ore.',
    priceEur:2900, isNew:false, isAvailable:false },

  { slug:'breve-catullo', lang:'Corsi Brevi', level:'Autori Latini', sortOrder:104,
    title:'Catullo per principianti avanzati',
    description:'Passioni, invettive e vita quotidiana al tramonto della Repubblica. 4 ore.',
    priceEur:3900, isNew:true, isAvailable:true },

  { slug:'breve-sacro-romano', lang:'Corsi Brevi', level:'Civiltà Romana', sortOrder:110,
    title:'Pensare e fare il sacro: un percorso religioso romano',
    description:'Riti, culti, divinità e spazio sacro nella Roma antica. 6 ore in asincrono.',
    priceEur:6000, isNew:false, isAvailable:true },

  { slug:'breve-dei-uomini', lang:'Corsi Brevi', level:'Civiltà Romana', sortOrder:111,
    title:'Tra Dèi e Uomini: il mito come fondamento di Roma',
    description:'Il mito come fondamento della Roma religiosa e civile. 6 ore in asincrono.',
    priceEur:6000, isNew:false, isAvailable:true },

  { slug:'breve-conclave', lang:'Corsi Brevi', level:'Storia della Chiesa', sortOrder:112,
    title:'Conclave: le bolle papali che decidono la Chiesa',
    description:'Storia e linguaggio delle bolle papali. Dal latino dei documenti pontifici alla politica ecclesiastica. 4 ore.',
    priceEur:6000, isNew:false, isAvailable:true },

  { slug:'breve-voci-vangeli', lang:'Corsi Brevi', level:'Bibbia e Antichità', sortOrder:113,
    title:'Voci dei Vangeli: un viaggio dalle Radici alla Rivelazione',
    description:'I Vangeli nel loro contesto storico, linguistico e culturale. 6 ore.',
    priceEur:6000, isNew:false, isAvailable:false },

  { slug:'breve-storie-latine', lang:'Corsi Brevi', level:'Autori Latini', sortOrder:114,
    title:"Dall'Antico al Moderno: Storie in Lingua Latina",
    description:'Lettura di testi latini medievali e moderni che narrano storie di ogni epoca. 6 ore.',
    priceEur:6000, isNew:false, isAvailable:false },

  { slug:'breve-buona-novella', lang:'Corsi Brevi', level:'Bibbia e Antichità', sortOrder:115,
    title:'La Buona Novella tra greco e latino',
    description:'Il Vangelo nelle sue versioni greca e latina: confronto linguistico e teologico. 6 ore.',
    priceEur:7000, isNew:false, isAvailable:false },

  { slug:'breve-padri-chiesa', lang:'Corsi Brevi', level:'Bibbia e Antichità', sortOrder:116,
    title:'Il Vangelo attraverso i Padri della Chiesa',
    description:'Lettura e interpretazione patristica del Vangelo: Agostino, Gregorio, Ambrogio. 6 ore.',
    priceEur:7000, isNew:false, isAvailable:false },

  { slug:'breve-echi-marmo', lang:'Corsi Brevi', level:'Arte Antica', sortOrder:120,
    title:"Echi di Marmo: viaggio nell'Arte Greca da Omero ad Alessandro",
    description:'Scultura, ceramica e architettura greca nel contesto storico e letterario. 6 ore.',
    priceEur:9000, isNew:false, isAvailable:true },

  { slug:'breve-schiavitu', lang:'Corsi Brevi', level:'Storia Antica', sortOrder:121,
    title:'Vite in catene: la Schiavitù nel Mondo Antico',
    description:'Storia, diritto e filosofia della schiavitù nel mondo greco-romano. Fonti antiche. 6 ore.',
    priceEur:9000, isNew:false, isAvailable:true },

  { slug:'breve-etruschi', lang:'Corsi Brevi', level:'Archeologia', sortOrder:122,
    title:'Tracce Etrusche: origini, espansioni, eredità di una civiltà',
    description:'Dalla Villanove alla romanizzazione: la civiltà etrusca attraverso le sue testimonianze materiali. 8 ore.',
    priceEur:9000, isNew:false, isAvailable:false },

  { slug:'breve-nubia-egitto', lang:'Corsi Brevi', level:'Archeologia', sortOrder:123,
    title:'Tra due Mondi: Nubia ed Egitto sulla linea di confine',
    description:'Il rapporto tra Egitto e Nubia: conflitto, scambio culturale, ibridazione artistica. 6 ore.',
    priceEur:9000, isNew:false, isAvailable:false },

  { slug:'breve-archeologia', lang:'Corsi Brevi', level:'Archeologia', sortOrder:124,
    title:"Testimonianze del Tempo: un viaggio nell'Archeologia Applicata",
    description:'Come si fa archeologia: metodo, scavo, interpretazione. 4 ore.',
    priceEur:9000, isNew:false, isAvailable:false },

  { slug:'breve-passione', lang:'Corsi Brevi', level:'Bibbia e Antichità', sortOrder:125,
    title:'Prospettive di Passione: gli ultimi giorni di Gesù nei Vangeli',
    description:'Confronto sinottico della Passione nei quattro Vangeli: stile, teologia, storicità. 6 ore.',
    priceEur:9000, isNew:false, isAvailable:false },

  { slug:'breve-pompei', lang:'Corsi Brevi', level:'Archeologia', sortOrder:126,
    title:'Voci silenziose di Pompei: scoperte epigrafiche nella città sepolta',
    description:'Le iscrizioni di Pompei: graffiti, tituli, dipinti elettorali. Lettura e contesto. 8 ore.',
    priceEur:9000, isNew:false, isAvailable:false },

  { slug:'breve-miniera-luna', lang:'Corsi Brevi', level:'Filosofia Antica', sortOrder:127,
    title:"Dalla Miniera alla Luna: Pirandello e Verga tra esistenza e letteratura",
    description:'Percorso letterario tra i due grandi autori siciliani: tema del destino, della natura, della lotta. 6 ore.',
    priceEur:9000, isNew:false, isAvailable:false },

  { slug:'breve-algoritmica', lang:'Corsi Brevi', level:'Filosofia Antica', sortOrder:128,
    title:"L'Algoritmica dell'Essere: filosofia nell'Intelligenza Artificiale",
    description:'Esplorazioni filosofiche ai confini tra intelligenza artificiale e pensiero antico. 6 ore.',
    priceEur:9000, isNew:false, isAvailable:false },

  { slug:'breve-voci-femminili', lang:'Corsi Brevi', level:'Bibbia e Antichità', sortOrder:129,
    title:'Dal Margine al Centro: Voci Femminili nei Vangeli',
    description:'Le donne nei Vangeli: protagoniste dimenticate della storia cristiana. 4 ore.',
    priceEur:9000, isNew:false, isAvailable:false },

  { slug:'breve-nilo', lang:'Corsi Brevi', level:'Archeologia', sortOrder:130,
    title:"Aldilà e Al-di-qua del Nilo: l'Antico Egitto tra vita e morte",
    description:"Il concetto egiziano di morte, aldilà e resurrezione. Testi funerari e iconografia. 8 ore.",
    priceEur:10000, isNew:false, isAvailable:false },

  { slug:'breve-etruschi-vita', lang:'Corsi Brevi', level:'Archeologia', sortOrder:131,
    title:'Etruschi: vita, guerra, spirito di una civiltà antica',
    description:'La civiltà etrusca nelle sue dimensioni quotidiana, militare e spirituale. 6 ore.',
    priceEur:10000, isNew:false, isAvailable:false },

  { slug:'breve-terre-bibbia', lang:'Corsi Brevi', level:'Bibbia e Antichità', sortOrder:132,
    title:'Le Terre della Bibbia: viaggio fra storia e sacro',
    description:'Israele, Giordania, Egitto: i luoghi della Bibbia tra archeologia e fede. 4 ore.',
    priceEur:10000, isNew:false, isAvailable:false },

  { slug:'breve-guerra-religione', lang:'Corsi Brevi', level:'Storia della Religione', sortOrder:133,
    title:'Guerra di Religione, Religione di Guerra',
    description:'Le guerre di religione nella storia antica e medievale: teologia, propaganda, martirio. 6 ore.',
    priceEur:11000, isNew:false, isAvailable:true },

  { slug:'breve-maturita-greco', lang:'Corsi Brevi', level:'Esercitazioni', sortOrder:140,
    title:'Ponte alla Maturità Classica: tradurre il Greco Antico',
    description:'Preparazione alla traduzione greca per la Maturità classica. Metodo e pratica. 6 ore.',
    priceEur:14000, isNew:false, isAvailable:false },

  { slug:'breve-egiziano-appro', lang:'Corsi Brevi', level:'Egiziano Geroglifico', sortOrder:141,
    title:'Approfondimenti di Egiziano Geroglifico: preparazione alla letteratura',
    description:'Testi letterari egiziani per studenti di livello intermedio. 4 ore.',
    priceEur:15000, isNew:false, isAvailable:false },

  { slug:'breve-tragedia-greci', lang:'Corsi Brevi', level:'Teatro Antico', sortOrder:142,
    title:'La tragedia dei Greci: Eschilo, Sofocle, Euripide',
    description:'La struttura del dramma attico, i grandi temi, le differenze di stile tra i tre tragici. 4 ore.',
    priceEur:17000, isNew:true, isAvailable:true },

  { slug:'breve-maturita-latino', lang:'Corsi Brevi', level:'Esercitazioni', sortOrder:143,
    title:'Ponte alla Maturità Classica: tradurre il Latino',
    description:'Preparazione alla traduzione latina per la Maturità classica. Metodo e pratica. 6 ore.',
    priceEur:19000, isNew:false, isAvailable:true },

  { slug:'breve-roma-dei', lang:'Corsi Brevi', level:'Civiltà Romana', sortOrder:144,
    title:'Roma e i suoi Dèi: storia di una religione millenaria',
    description:'Percorso completo sulla religione romana: politeismo, culto imperiale, rapporto col Cristianesimo. 15 ore.',
    priceEur:25000, isNew:false, isAvailable:true },

  { slug:'breve-ars-scribendi', lang:'Corsi Brevi', level:'Scrittura Latina', sortOrder:145,
    title:"Ars latine scribendi: l'arte di scrivere in latino",
    description:'Composizione latina avanzata: stile, prosa, epistolografia. Per studenti di livello B2+. 10 ore.',
    priceEur:45000, isNew:false, isAvailable:false },
];

// ─── GENERATORE LEZIONI ───────────────────────────────────────────────────────
// Calcola il numero di lezioni in base al tipo di corso:
// - Didattica: 10 lezioni (20h divise in parti da 2h)
// - Corsi Brevi: 1 lezione ogni ora circa (es. 4h → 4 lezioni, 6h → 6 lezioni)
// - Livello B: 32 lezioni
// - Standard (A1-A2): 24 lezioni
function lessonCount(course) {
  if (course.lang === 'Didattica') return 10;
  if (course.lang === 'Corsi Brevi') {
    // Ricava le ore dal testo della descrizione
    const m = course.description.match(/(\d+)\s*ore/);
    return m ? Math.max(parseInt(m[1]), 2) : 4;
  }
  if (course.level.startsWith('B')) return 32;
  return 24;
}

function makeLessons(course) {
  const count = lessonCount(course);
  return Array.from({ length: count }, (_, i) => ({
    title: `Lezione ${i + 1} — ${course.title.replace(' • E-Learning', '')}`,
    durationMin: course.lang === 'Corsi Brevi' ? 55 : 22 + (i % 4) * 5,
    isFree: i < 2,   // Prime 2 lezioni sempre gratuite come anteprima
    sortOrder: i + 1,
  }));
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🌱 Seeding ${COURSES.length} corsi nel database Neon...\n`);

  let inserted = 0;
  let skipped = 0;

  for (const c of COURSES) {
    const lessons = makeLessons(c);
    try {
      const course = await prisma.course.upsert({
        where: { slug: c.slug },
        update: {
          // Aggiorna i metadati ma NON tocca le lezioni (evita duplicati)
          title:       c.title,
          description: c.description,
          priceEur:    c.priceEur,
          isNew:       c.isNew,
          isAvailable: c.isAvailable,
          sortOrder:   c.sortOrder,
        },
        create: {
          slug:        c.slug,
          lang:        c.lang,
          level:       c.level,
          title:       c.title,
          description: c.description,
          priceEur:    c.priceEur,
          isNew:       c.isNew,
          isAvailable: c.isAvailable,
          sortOrder:   c.sortOrder,
          lessons: { create: lessons },
        },
      });
      console.log(`  ✅ [${c.lang}] ${course.title.slice(0, 55)}`);
      inserted++;
    } catch (err) {
      console.error(`  ❌ Errore su ${c.slug}:`, err.message);
      skipped++;
    }
  }

  console.log(`\n✨ Seed completato — ${inserted} corsi inseriti/aggiornati, ${skipped} errori.`);
  console.log(`   Latino: 7 · Greco: 7 · Egiziano: 3 · Ebraico: 3 · Didattica: 4 · Corsi Brevi: 32`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
