// prisma/seed.js — Popola il DB con i corsi iniziali
// Esegui con: npm run db:seed

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COURSES = [
  // LATINO
  { slug:'lat-a11', lang:'Latino', level:'A1.1', title:'Latino A1.1 – Principianti',        description:'Parti da zero: le declinazioni, il verbo esse, morfologia nominale di base.', priceEur:13000, sortOrder:10 },
  { slug:'lat-a12', lang:'Latino', level:'A1.2', title:'Latino A1.2 – Principianti II',      description:'Consolida le basi e affronta le prime strutture del periodo latino.', priceEur:13000, sortOrder:11 },
  { slug:'lat-a21', lang:'Latino', level:'A2.1', title:'Latino A2.1 – Base',                description:'Espandi il vocabolario e affronta testi latini autentici adattati.', priceEur:15000, sortOrder:12 },
  { slug:'lat-a22', lang:'Latino', level:'A2.2', title:'Latino A2.2 – Base II',             description:'Accusativo con l\'infinito, ablativo assoluto, subordinate finali e causali.', priceEur:15000, sortOrder:13 },
  { slug:'lat-b11', lang:'Latino', level:'B1.1', title:'Latino B1.1 – Intermedio I',        description:'Lettura di Cicerone e Cesare. Analisi retorica del testo.', priceEur:18000, isNew:true, sortOrder:14 },
  { slug:'lat-b12', lang:'Latino', level:'B1.2', title:'Latino B1.2 – Intermedio II',       description:'Virgilio e la poesia epica: Eneide, metrica, figure retoriche.', priceEur:18000, sortOrder:15 },
  { slug:'lat-b13', lang:'Latino', level:'B1.3', title:'Latino B1.3 – Intermedio III',      description:'Ovidio, Orazio e la poesia lirica latina.', priceEur:18000, sortOrder:16 },
  // GRECO
  { slug:'gr-a11',  lang:'Greco Antico', level:'A1.1', title:'Greco Antico A1.1 – Principianti',   description:'Alfabeto greco, pronuncia restituita, prime declinazioni e coniugazioni.', priceEur:13000, sortOrder:20 },
  { slug:'gr-a12',  lang:'Greco Antico', level:'A1.2', title:'Greco Antico A1.2 – Principianti II', description:'Il verbo contratto, il sistema verbale greco, le particelle.', priceEur:13000, sortOrder:21 },
  { slug:'gr-a21',  lang:'Greco Antico', level:'A2.1', title:'Greco Antico A2.1 – Base',           description:'Testi da Platone e Senofonte adattati. Il periodo ipotetico.', priceEur:15000, sortOrder:22 },
  { slug:'gr-a22',  lang:'Greco Antico', level:'A2.2', title:'Greco Antico A2.2 – Base II',        description:'Il participio greco: usi e costrutti. Sintassi del periodo complesso.', priceEur:15000, isNew:true, sortOrder:23 },
  { slug:'gr-b11',  lang:'Greco Antico', level:'B1.1', title:'Greco Antico B1.1 – Intermedio I',   description:'Omero: lettura dell\'Iliade in originale. Metrica epica, dialetto ionico.', priceEur:18000, sortOrder:24 },
  { slug:'gr-b12',  lang:'Greco Antico', level:'B1.2', title:'Greco Antico B1.2 – Intermedio II',  description:'I tragici greci: Sofocle, Euripide, la struttura del dramma attico.', priceEur:18000, sortOrder:25 },
  // EGIZIANO
  { slug:'eg-a11',  lang:'Egiziano Geroglifico', level:'A1.1', title:'Egiziano A1.1 – Principianti',  description:'I geroglifici: logogrammi, fonogrammi. Lettura delle prime iscrizioni.', priceEur:17000, sortOrder:30 },
  { slug:'eg-a12',  lang:'Egiziano Geroglifico', level:'A1.2', title:'Egiziano A1.2 – Principianti II', description:'Il medio-egiziano: morfologia nominale, il verbo egiziano.', priceEur:17000, isNew:true, sortOrder:31 },
  { slug:'eg-a21',  lang:'Egiziano Geroglifico', level:'A2',   title:'Egiziano A2 – Base',           description:'Testi autentici: il Libro dei Morti, iscrizioni tombali.', priceEur:20000, sortOrder:32 },
  // EBRAICO
  { slug:'eb-a11',  lang:'Ebraico Biblico', level:'A1.1', title:'Ebraico A1.1 – Principianti',  description:'L\'alfabeto ebraico, scrittura destra-sinistra, vocali masoretiche.', priceEur:15000, sortOrder:40 },
  { slug:'eb-a12',  lang:'Ebraico Biblico', level:'A1.2', title:'Ebraico A1.2 – Principianti II', description:'Il verbo forte, prime radici trilittere, lettura del Genesi.', priceEur:15000, sortOrder:41 },
  { slug:'eb-a21',  lang:'Ebraico Biblico', level:'A2',   title:'Ebraico A2 – Base',             description:'La prosa narrativa biblica: Esodo, Salmi, sintassi ebraica.', priceEur:18000, isNew:true, sortOrder:42 },
  // DIDATTICA — corsi ufficiali di formazione (formazione.grecolatinovivo.it)
  // Ente accreditato MIUR · Bonus Docenti attivo · 20 ore asincrono ciascuno
  { slug:'did-elementa',   lang:'Didattica', level:'Formazione – Modulo 1', title:'Didattica del Latino: Pars Prima – Elementa',   description:'Metodo induttivo-contestuale per principianti: morfologia nominale, acquisizione del lessico, prime declinazioni, aggettivi, pronomi. 10h video asincrono + 10h autoapprendimento. Bonus Docenti attivo. In collaborazione con Convitto Nazionale Maria Luigia di Parma.', priceEur:15000, sortOrder:50 },
  { slug:'did-principia',  lang:'Didattica', level:'Formazione – Modulo 2', title:'Didattica del Latino: Pars Secunda – Principia', description:'Livello intermedio: morfologia verbale, sintassi del periodo, testi autentici. Prerequisito: aver frequentato Elementa o avere competenze equivalenti. 10h video + 10h lavoro autonomo. Bonus Docenti attivo.', priceEur:18000, sortOrder:51 },
  { slug:'did-grammatica', lang:'Didattica', level:'Formazione – Percorso',  title:'Grammatica Latina e Buone Pratiche Didattiche',  description:'Metodologia grammaticale-traduttiva e riflessione glottodidattica: rendere l\'insegnamento della grammatica più efficace attraverso esempi pratici e analisi delle ricadute sugli studenti. 20 ore in 10 parti. Bonus Docenti attivo.', priceEur:17000, isNew:true, sortOrder:52 },
];

const LESSONS_TEMPLATE = (courseTitle, count) =>
  Array.from({ length: count }, (_, i) => ({
    title: `Lezione ${i + 1} — ${courseTitle}`,
    durationMin: 22 + (i % 4) * 5,
    isFree: i < 2,
    sortOrder: i + 1,
  }));

async function main() {
  console.log('🌱 Seeding courses...');
  for (const c of COURSES) {
    const lessonCount = c.lang === 'Didattica' ? 10 : c.level.startsWith('B') ? 32 : 24;
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        ...c,
        isNew: c.isNew || false,
        lessons: {
          create: LESSONS_TEMPLATE(c.title, lessonCount),
        },
      },
    });
    console.log(`  ✅ ${course.title}`);
  }
  console.log(`\n✨ Seed completato — ${COURSES.length} corsi inseriti.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
