// scripts/populate-missing-courses.js
// Popola con lezioni, link Vimeo e durata i 12 corsi brevi aggiunti da add-missing-courses.js
// Dati estratti dal DB SQL latin-cert (dump 21 maggio 2026)
//
// NOTA sugli IDL già presenti in Neon DB:
//   • IDCR=110 (QK1256): tutti e 9 gli IDL sono già in DB come lezioni di lat-a12
//     → creo le lezioni SENZA latinCertId (evito violazione unique constraint)
//   • IDCR=116 (CYKZFU): IDL 733, 896, 904, 990 già in DB come lezioni di lat-a22
//     → per quei 4 uso latinCertId=null; per gli altri 6 uso il loro IDL
//   • Tutti gli altri IDCR: IDL non ancora in DB → uso latinCertId corretto
//
// Eseguire con:
//   node scripts/populate-missing-courses.js
//
// Idempotente: usa upsert sullo slug del corso e deleteMany+create per le lezioni.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// DATI ESTRATTI DAL DB SQL LATIN-CERT
// Struttura: { slug, lessons: [{ latinCertId, title, vimeoUrl, durationMin, sortOrder }] }
// latinCertId=null → IDL già presente in DB per altro corso, non riassegnabile
// ─────────────────────────────────────────────────────────────────────────────

const COURSES_DATA = [

  // ── IDCR=238 · GKPY1B · Mantenimento Greco A1 (4 lezioni) ────────────────
  {
    slug: 'breve-mantenimento-greco-a1-4lez',
    lessons: [
      { latinCertId: 1951, title: 'Lezione 1 — vita rurale (20 maggio 2024)',        vimeoUrl: 'https://vimeo.com/948469505', durationMin: 63, sortOrder: 1 },
      { latinCertId: 1982, title: 'Lezione 2 — Alexandros (27 maggio 2024)',          vimeoUrl: 'https://vimeo.com/950880244', durationMin: 72, sortOrder: 2 },
      { latinCertId: 2040, title: 'Lezione 3 — il sacro (4 giugno 2024)',             vimeoUrl: 'https://vimeo.com/953443869', durationMin: 65, sortOrder: 3 },
      { latinCertId: 2104, title: 'Lezione 4 — Demetra (17 giugno 2024)',             vimeoUrl: 'https://vimeo.com/960693937', durationMin: 62, sortOrder: 4 },
    ],
  },

  // ── IDCR=123 · U1SDFB · Mantenimento Greco A1.1/A1 (10 lezioni) ──────────
  {
    slug: 'breve-mantenimento-greco-a1-10lez',
    lessons: [
      { latinCertId: 679,  title: 'ΠΤΩΤΟΝ ΜΑΘΗΜΑ: ΠΕΡΙ ΤΟΥ ΟΙΚΟΥ',                  vimeoUrl: 'https://vimeo.com/842116615', durationMin: 10, sortOrder: 1 },
      { latinCertId: 746,  title: 'ΔΕΥΤΕΡΟΝ ΜΑΘΗΜΑ: TA OMHRIKA',                     vimeoUrl: 'https://vimeo.com/844496753', durationMin: 11, sortOrder: 2 },
      { latinCertId: 783,  title: 'ΤΡΙΤΟΝ ΜΑΘΗΜΑ: TO ΑΡΙΘΜΕΙΝ',                      vimeoUrl: 'https://vimeo.com/846185686', durationMin: 14, sortOrder: 3 },
      { latinCertId: 841,  title: 'TETAΡTON ΜΑΘΗΜΑ: TO ΑΛΓΕΙΝ',                      vimeoUrl: 'https://vimeo.com/847952634', durationMin: 11, sortOrder: 4 },
      { latinCertId: 860,  title: 'ΠΕΜΠΤΟΝ ΜΑΘΗΜΑ: ΠΕΡΙ ΤΗΣ ΔΙΑΙΤΗΣ',               vimeoUrl: 'https://vimeo.com/850513809', durationMin: 10, sortOrder: 5 },
      { latinCertId: 881,  title: 'ΕΚΤΟΝ ΜΑΘΗΜΑ: ΠΕΡΙ ΤΟΥ ΣΩΜΑΤΟΣ',                 vimeoUrl: 'https://vimeo.com/853111615', durationMin: 10, sortOrder: 6 },
      { latinCertId: 898,  title: 'ΕΒΔΟΜΟΝ ΜΑΘΗΜΑ: ΠΕΡΙ ΤΟΥ ΑΓΡΟΙΚΟΥ ΒΙΟΥ',         vimeoUrl: 'https://vimeo.com/855922269', durationMin: 13, sortOrder: 7 },
      { latinCertId: 907,  title: 'ΟΓΔΟΟΝ ΜΑΘΗΜΑ: Ο ΙΑΣΩΝ (α)',                      vimeoUrl: 'https://vimeo.com/856690346', durationMin: 15, sortOrder: 8 },
      { latinCertId: 934,  title: 'ΕΝΑΤΟΝ ΜΑΘΗΜΑ: Ο ΙΑΣΩΝ (β)',                      vimeoUrl: 'https://vimeo.com/858713243', durationMin: 16, sortOrder: 9 },
      { latinCertId: 957,  title: 'ΔΕΚΑΤΟΝ ΜΑΘΗΜΑ: Ο ΙΑΣΩΝ (γ)',                     vimeoUrl: 'https://vimeo.com/860915450', durationMin: 16, sortOrder: 10 },
    ],
  },

  // ── IDCR=124 · FXG6Q5 · Mantenimento Greco A2 (10 lezioni) ──────────────
  {
    slug: 'breve-mantenimento-greco-a2',
    lessons: [
      { latinCertId: 680,  title: 'ΠΡΩΤΟΝ ΜΑΘΗΜΑ: ΠΕΡΙ ΤΟΥ ΟΙΚΟΥ',                  vimeoUrl: 'https://vimeo.com/842114317', durationMin: 10, sortOrder: 1 },
      { latinCertId: 747,  title: 'ΔΕΥΤΕΡΟΝ ΜΑΘΗΜΑ: ΤΑ ΟΜΗΡΙΚΑ',                    vimeoUrl: 'https://vimeo.com/844576943', durationMin: 11, sortOrder: 2 },
      { latinCertId: 787,  title: 'ΤΡΙΤΟΝ ΜΑΘΗΜΑ: TO ΑΡΙΘΜΕΙΝ',                      vimeoUrl: 'https://vimeo.com/846207142', durationMin: 14, sortOrder: 3 },
      { latinCertId: 842,  title: 'TETAΡTON ΜΑΘΗΜΑ: TO ΑΛΓΕΙΝ',                      vimeoUrl: 'https://vimeo.com/847963092', durationMin: 11, sortOrder: 4 },
      { latinCertId: 861,  title: 'ΠΕΜΠΤΟΝ ΜΑΘΗΜΑ: ΠΕΡΙ ΤΗΣ ΔΙΑΙΤΗΣ',               vimeoUrl: 'https://vimeo.com/850547228', durationMin: 10, sortOrder: 5 },
      { latinCertId: 882,  title: 'ΕΚΤΟΝ ΜΑΘΗΜΑ: ΠΕΡΙ ΤΟΥ ΣΩΜΑΤΟΣ',                 vimeoUrl: 'https://vimeo.com/853115692', durationMin: 10, sortOrder: 6 },
      { latinCertId: 899,  title: 'ΕΒΔΟΜΟΝ ΜΑΘΗΜΑ: ΠΕΡΙ ΤΟΥ ΑΓΡΟΙΚΟΥ ΒΙΟΥ',         vimeoUrl: 'https://vimeo.com/855922269', durationMin: 13, sortOrder: 7 },
      { latinCertId: 908,  title: 'ΟΓΔΟΟΝ ΜΑΘΗΜΑ: Ο ΙΑΣΩΝ (α)',                      vimeoUrl: 'https://vimeo.com/856691012', durationMin: 15, sortOrder: 8 },
      { latinCertId: 935,  title: 'ΕΝΑΤΟΝ ΜΑΘΗΜΑ: Ο ΙΑΣΩΝ (β)',                      vimeoUrl: 'https://vimeo.com/858723071', durationMin: 16, sortOrder: 9 },
      { latinCertId: 958,  title: 'ΔΕΚΑΤΟΝ ΜΑΘΗΜΑ: Ο ΙΑΣΩΝ (γ)',                     vimeoUrl: 'https://vimeo.com/860914850', durationMin: 16, sortOrder: 10 },
    ],
  },

  // ── IDCR=122 · AVUMC6 · Mantenimento Greco B1/B2 (10 lezioni) ────────────
  {
    slug: 'breve-mantenimento-greco-b1-b2',
    lessons: [
      { latinCertId: 668,  title: 'Lezione 1 — Una strana notizia…',                  vimeoUrl: 'https://vimeo.com/841920142', durationMin: 24, sortOrder: 1 },
      { latinCertId: 735,  title: 'Lezione 2 — Poliido e il serpente',                 vimeoUrl: 'https://vimeo.com/843869406', durationMin: 23, sortOrder: 2 },
      { latinCertId: 776,  title: 'Lezione 3 — Quando la guerra va male…',             vimeoUrl: 'https://vimeo.com/845965929', durationMin: 23, sortOrder: 3 },
      { latinCertId: 844,  title: 'Lezione 4 — Da dove viene il Minotauro?',           vimeoUrl: 'https://vimeo.com/848030793', durationMin: 27, sortOrder: 4 },
      { latinCertId: 859,  title: 'Lezione 5 — I sacrifici degli Egizi',               vimeoUrl: 'https://vimeo.com/850254678', durationMin: 24, sortOrder: 5 },
      { latinCertId: 873,  title: 'Lezione 6 — Meleagro e il tizzone',                 vimeoUrl: 'https://vimeo.com/852434777', durationMin: 26, sortOrder: 6 },
      { latinCertId: 887,  title: 'Lezione 7 — La vita pitagorica',                    vimeoUrl: 'https://vimeo.com/854584956', durationMin: 22, sortOrder: 7 },
      { latinCertId: 912,  title: 'Lezione 8 — Chi trova un delfino trova un tesoro',  vimeoUrl: 'https://vimeo.com/856715721', durationMin: 31, sortOrder: 8 },
      { latinCertId: 936,  title: 'Lezione 9 — Le stranezze dell\'Egitto',             vimeoUrl: 'https://vimeo.com/858714700', durationMin: 22, sortOrder: 9 },
      { latinCertId: 955,  title: 'Lezione 10 — Maledetti Toscani (Hdt. 1, 94)',       vimeoUrl: 'https://vimeo.com/860909976', durationMin: 22, sortOrder: 10 },
    ],
  },

  // ── IDCR=110 · QK1256 · Mantenimento Latino A1.1 (9 lezioni) ─────────────
  // ATTENZIONE: tutti gli IDL (656..1046) sono già in Neon DB come lezioni di lat-a12
  // → latinCertId=null per evitare violazione unique constraint
  {
    slug: 'breve-mantenimento-latino-a1-1',
    lessons: [
      { latinCertId: null, title: 'Prima lectio: Fabulae de leone',                    vimeoUrl: 'https://vimeo.com/841468354', durationMin: 16, sortOrder: 1 },
      { latinCertId: null, title: 'Lectio secunda: de puero mendace',                  vimeoUrl: 'https://vimeo.com/844133651', durationMin: 1,  sortOrder: 2 },
      { latinCertId: null, title: 'Lectio tertia: de militibus romanis',               vimeoUrl: 'https://vimeo.com/846022992', durationMin: 11, sortOrder: 3 },
      { latinCertId: null, title: 'Lectio quarta: Snupius, canis a Carolo M. Schultz', vimeoUrl: 'https://vimeo.com/847807295', durationMin: 1,  sortOrder: 4 },
      { latinCertId: null, title: 'Lectio quinta: de Orpheo lyram psallente',          vimeoUrl: 'https://vimeo.com/850130446', durationMin: 1,  sortOrder: 5 },
      { latinCertId: null, title: 'Lectio sexta: De Colosseo vel Amphitheatro Flavio', vimeoUrl: 'https://vimeo.com/852656691', durationMin: 10, sortOrder: 6 },
      { latinCertId: null, title: 'Lectio septima: aenigma de coclea',                 vimeoUrl: 'https://vimeo.com/855378774', durationMin: 14, sortOrder: 7 },
      { latinCertId: null, title: 'Lectio octava: de die pueri',                       vimeoUrl: 'https://vimeo.com/858623552', durationMin: 15, sortOrder: 8 },
      { latinCertId: null, title: 'Lectio nona: de puero et matre',                    vimeoUrl: 'https://vimeo.com/872124198', durationMin: 12, sortOrder: 9 },
    ],
  },

  // ── IDCR=116 · CYKZFU · Mantenimento Latino C/B1/B2 (10 lezioni) ─────────
  // IDL 733, 896, 904, 990 già in Neon DB (lat-a22) → latinCertId=null per quelli
  {
    slug: 'breve-mantenimento-latino-b1-b2',
    lessons: [
      { latinCertId: 665,  title: 'Prima lectio: De insularum incommodis',             vimeoUrl: 'https://vimeo.com/841852674',         durationMin: 20, sortOrder: 1 },
      { latinCertId: null, title: 'Lectio secunda: De vehiculis et de frequentia',     vimeoUrl: 'https://vimeo.com/843792522',         durationMin: 13, sortOrder: 2 },
      { latinCertId: 775,  title: 'Lectio tertia: de fele emunctae naris',             vimeoUrl: 'https://vimeo.com/846001494',         durationMin: 1,  sortOrder: 3 },
      { latinCertId: 829,  title: 'Lectio quarta: de itinere sive de sententiis',      vimeoUrl: 'https://vimeo.com/847813707',         durationMin: 1,  sortOrder: 4 },
      { latinCertId: 857,  title: 'Lectio quinta: de belli Macedonici initio',         vimeoUrl: 'https://vimeo.com/850209723',         durationMin: 1,  sortOrder: 5 },
      { latinCertId: 874,  title: 'Lectio sexta: De Augusto principe',                 vimeoUrl: 'https://vimeo.com/852598352',         durationMin: 1,  sortOrder: 6 },
      { latinCertId: null, title: 'Lectio septima: de morte Hannibalis',               vimeoUrl: 'https://vimeo.com/855645853',         durationMin: 18, sortOrder: 7 },
      { latinCertId: null, title: 'Lectio octava: biduum piscando feriatum',           vimeoUrl: 'https://vimeo.com/855986465',         durationMin: 13, sortOrder: 8 },
      { latinCertId: 952,  title: 'Lectio nona: biduum piscando — pars altera',        vimeoUrl: 'https://vimeo.com/860430404',         durationMin: 10, sortOrder: 9 },
      { latinCertId: null, title: 'Lectio decima — iter filmicum',                     vimeoUrl: 'https://vimeo.com/792163246/7da3078098', durationMin: 14, sortOrder: 10 },
    ],
  },

  // ── IDCR=149 · APQNYG · Webinar Ebraico (1 lezione) ──────────────────────
  {
    slug: 'breve-webinar-ebraico',
    lessons: [
      { latinCertId: 1006, title: 'הַעֲלִיָה לְאֶרֶץ יִשְׂרָאֵל — Webinar 27/09/2023', vimeoUrl: 'https://vimeo.com/868834439', durationMin: 67, sortOrder: 1 },
    ],
  },

  // ── IDCR=41 · 2DCGBL · Neo-egiziano B1 (5 lezioni) ───────────────────────
  {
    slug: 'breve-neo-egiziano-b1',
    lessons: [
      { latinCertId: 63,  title: 'Lezione 1 — 4 ottobre 2022',   vimeoUrl: 'https://vimeo.com/764985921', durationMin: 114, sortOrder: 1 },
      { latinCertId: 64,  title: 'Lezione 2 — 11 ottobre 2022',  vimeoUrl: 'https://vimeo.com/764992313', durationMin: 103, sortOrder: 2 },
      { latinCertId: 65,  title: 'Lezione 3 — 18 ottobre 2022',  vimeoUrl: 'https://vimeo.com/765177262', durationMin: 90,  sortOrder: 3 },
      { latinCertId: 66,  title: 'Lezione 4 — 25 ottobre 2022',  vimeoUrl: 'https://vimeo.com/764996578', durationMin: 90,  sortOrder: 4 },
      { latinCertId: 90,  title: 'Lezione 5 — 5 novembre 2022',  vimeoUrl: 'https://vimeo.com/767763272', durationMin: 90,  sortOrder: 5 },
    ],
  },

  // ── IDCR=167 · 7QR824 · Club di Lettu-RA: I Testi delle Piramidi (11 lez) ─
  {
    slug: 'breve-club-lettura-testi-piramidi',
    lessons: [
      { latinCertId: 1088, title: 'Lezione 1 — Introduzione ai Testi delle Piramidi (18/10/2023)', vimeoUrl: 'https://vimeo.com/875692567',  durationMin: 119, sortOrder: 1 },
      { latinCertId: 1120, title: 'Lezione 2 del 25/10/2023',                                       vimeoUrl: 'https://vimeo.com/878244624',  durationMin: 97,  sortOrder: 2 },
      { latinCertId: 1197, title: 'Lezione 3 del 08/11/2023',                                       vimeoUrl: 'https://vimeo.com/882985017',  durationMin: 102, sortOrder: 3 },
      { latinCertId: 1232, title: 'Lezione 4 del 15/11/2023',                                       vimeoUrl: 'https://vimeo.com/885127735',  durationMin: 118, sortOrder: 4 },
      { latinCertId: 1268, title: 'Lezione 5 del 22/11/2023',                                       vimeoUrl: 'https://vimeo.com/887452881',  durationMin: 113, sortOrder: 5 },
      { latinCertId: 1301, title: 'Lezione 6 del 28/11/2023',                                       vimeoUrl: 'https://vimeo.com/889267264',  durationMin: 106, sortOrder: 6 },
      { latinCertId: 1340, title: 'Lezione 7 del 06/12/2023',                                       vimeoUrl: 'https://vimeo.com/893048508',  durationMin: 97,  sortOrder: 7 },
      { latinCertId: 1368, title: 'Lezione 8 del 13/12/2023',                                       vimeoUrl: 'https://vimeo.com/895001786',  durationMin: 108, sortOrder: 8 },
      { latinCertId: 1387, title: 'Lezione 9 del 20/12/2023',                                       vimeoUrl: 'https://vimeo.com/896706880',  durationMin: 112, sortOrder: 9 },
      { latinCertId: 2686, title: 'Lezione 1 — Egiziani, Egittologi, Egittomani (12/11/2024)',       vimeoUrl: 'https://vimeo.com/1029217019', durationMin: 88,  sortOrder: 10 },
      { latinCertId: 2775, title: 'Lezione 2 — Dalla sabbia alle piramidi (19/11/2024)',             vimeoUrl: 'https://vimeo.com/1032769949', durationMin: 90,  sortOrder: 11 },
    ],
  },

  // ── IDCR=234 · V6EFWX · Egiziano Geroglifico — Letteratura (8 lezioni) ───
  // ATTENZIONE: tutti gli IDL (1904..2154) sono già in Neon DB come lezioni di eg-a12
  // (idl-lesson-map: idcr=234 → courseTitle="Corso di Egiziano Geroglifico A1.2")
  // → latinCertId=null per tutti, come già fatto per lat-a12 e lat-a22
  {
    slug: 'breve-egiziano-geroglifico-letteratura',
    lessons: [
      { latinCertId: null, title: 'Lezione 1 — Sinuhe R 58-71 (9 maggio 2024)',        vimeoUrl: 'https://vimeo.com/944576227',  durationMin: 118, sortOrder: 1 },
      { latinCertId: null, title: 'Lezione 2 — diario di Merer (16 maggio 2024)',       vimeoUrl: 'https://vimeo.com/947144346',  durationMin: 114, sortOrder: 2 },
      { latinCertId: null, title: 'Lezione 3 — Correzione esercizi (23 maggio 2024)',   vimeoUrl: 'https://vimeo.com/949652490',  durationMin: 112, sortOrder: 3 },
      { latinCertId: null, title: 'Lezione 4 — Sinuhe B 146-148 (30 maggio 2024)',      vimeoUrl: 'https://vimeo.com/952075222',  durationMin: 120, sortOrder: 4 },
      { latinCertId: null, title: 'Lezione 5 — Correzione esercizi (6 giugno 2024)',    vimeoUrl: 'https://vimeo.com/954973762',  durationMin: 86,  sortOrder: 5 },
      { latinCertId: null, title: 'Lezione 6 del 13 giugno 2024',                       vimeoUrl: 'https://vimeo.com/957926456',  durationMin: 117, sortOrder: 6 },
      { latinCertId: null, title: 'Lezione 7 — Lettura Sinuhe (27 giugno 2024)',        vimeoUrl: 'https://vimeo.com/970144481',  durationMin: 118, sortOrder: 7 },
      { latinCertId: null, title: 'Lezione 8 — Finale di Sinuhe (4 luglio 2024)',       vimeoUrl: 'https://vimeo.com/977045666',  durationMin: 135, sortOrder: 8 },
    ],
  },

  // ── IDCR=239 · BJSC4A · Impariamo a leggere il greco antico (8 lezioni) ───
  {
    slug: 'breve-impariamo-greco-antico',
    lessons: [
      { latinCertId: 1991, title: 'Presentazione del corso',                                          vimeoUrl: 'https://vimeo.com/951903062', durationMin: 4,  sortOrder: 1 },
      { latinCertId: 2045, title: 'Incontro 1 — Storia dell\'alfabeto greco',                        vimeoUrl: 'https://vimeo.com/953890583', durationMin: 5,  sortOrder: 2 },
      { latinCertId: 2046, title: 'Incontro 2 — Primo gruppo di lettere (α β ν η ξ ι)',              vimeoUrl: 'https://vimeo.com/953922438', durationMin: 11, sortOrder: 3 },
      { latinCertId: 2057, title: 'Incontro 3 — Secondo gruppo di lettere (ο ε γ ρ σ ς)',            vimeoUrl: 'https://vimeo.com/955162359', durationMin: 17, sortOrder: 4 },
      { latinCertId: 2058, title: 'Incontro 4 — Terzo gruppo di lettere (π υ χ ω δ μ τ)',            vimeoUrl: 'https://vimeo.com/955174978', durationMin: 20, sortOrder: 5 },
      { latinCertId: 2059, title: 'Incontro 5 — Quarto gruppo di lettere (κ λ φ ψ θ ζ)',             vimeoUrl: 'https://vimeo.com/955218168', durationMin: 16, sortOrder: 6 },
      { latinCertId: 2062, title: 'Incontro 6 — Le maiuscole (extra)',                               vimeoUrl: 'https://vimeo.com/955342260', durationMin: 6,  sortOrder: 7 },
      { latinCertId: 2063, title: 'Incontro 7 — Lettura e comprensione del greco antico',            vimeoUrl: 'https://vimeo.com/955431702', durationMin: 20, sortOrder: 8 },
    ],
  },

  // ── IDCR=377 · YD81QU · Colloquia Ciceroniana (18 lezioni, 2 senza video) ─
  {
    slug: 'breve-colloquia-ciceroniana',
    lessons: [
      { latinCertId: 3712, title: 'Prima lectio — Tusculanae V II 5-6 (29/09/2025)',              vimeoUrl: 'https://vimeo.com/1122994968', durationMin: 99,  sortOrder: 1 },
      { latinCertId: 3734, title: 'Secunda lectio — De Legibus I (8/10/2025)',                    vimeoUrl: 'https://vimeo.com/1125654981', durationMin: 110, sortOrder: 2 },
      { latinCertId: 3743, title: 'Tertia lectio — De Legibus I 58-61 (13/10/2025)',              vimeoUrl: 'https://vimeo.com/1126968619', durationMin: 116, sortOrder: 3 },
      { latinCertId: 3750, title: 'Quarta lectio — De Re publica I (15/10/2025)',                 vimeoUrl: 'https://vimeo.com/1127645240', durationMin: 111, sortOrder: 4 },
      { latinCertId: 3763, title: 'Quinta lectio — De Re publica I + Laelius (20/10/2025)',       vimeoUrl: 'https://vimeo.com/1128978656', durationMin: 106, sortOrder: 5 },
      { latinCertId: 3783, title: 'Sexta lectio — De Re publica I 7-11 (27/10/2025)',             vimeoUrl: 'https://vimeo.com/1131064010', durationMin: 90,  sortOrder: 6 },
      { latinCertId: 3811, title: 'Septima lectio — Rep. I + Somnium Scipionis (5/11/2025)',      vimeoUrl: 'https://vimeo.com/1133993310', durationMin: 108, sortOrder: 7 },
      { latinCertId: 3823, title: 'Octava lectio — De Re publica III (10/11/2025)',               vimeoUrl: 'https://vimeo.com/1135486367', durationMin: 108, sortOrder: 8 },
      { latinCertId: 3844, title: 'Nona lectio — De finibus + epistole (17/11/2025)',             vimeoUrl: 'https://vimeo.com/1137813078', durationMin: 105, sortOrder: 9 },
      { latinCertId: 3852, title: 'Decima lectio — Epistule Cicerone (19/11/2025)',               vimeoUrl: 'https://vimeo.com/1138573822', durationMin: 56,  sortOrder: 10 },
      { latinCertId: 3865, title: 'Undecima lectio — De Oratore (24/11/2025)',                    vimeoUrl: 'https://vimeo.com/1140295793', durationMin: 90,  sortOrder: 11 },
      { latinCertId: 3876, title: 'Duodecima lectio — De inventione (26/11/2025)',                vimeoUrl: 'https://vimeo.com/1140906085', durationMin: 107, sortOrder: 12 },
      { latinCertId: 3889, title: 'Decima tertia lectio — De Oratore (1/12/2025)',                vimeoUrl: 'https://vimeo.com/1142197797', durationMin: 112, sortOrder: 13 },
      { latinCertId: 3894, title: 'Quarta decima lectio — De Oratore I (3/12/2025)',              vimeoUrl: 'https://vimeo.com/1143209534', durationMin: 109, sortOrder: 14 },
      { latinCertId: 3906, title: 'Quinta decima lectio — In Catilinam (9/12/2025)',              vimeoUrl: 'https://vimeo.com/1145022184', durationMin: 113, sortOrder: 15 },
      { latinCertId: 3925, title: 'Sexta decima lectio — Pro Archia (15/12/2025)',                vimeoUrl: 'https://vimeo.com/1146716716', durationMin: 101, sortOrder: 16 },
      { latinCertId: 3928, title: 'Septima decima lectio — Laelius (17/12/2025)',                 vimeoUrl: 'https://vimeo.com/1147446884', durationMin: 110, sortOrder: 17 },
      { latinCertId: 3938, title: 'Optava decima lectio — Laelius fine (22/12/2025)',             vimeoUrl: 'https://vimeo.com/1148743464', durationMin: 107, sortOrder: 18 },
    ],
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Popolamento lezioni dei 12 corsi brevi mancanti...\n');

  let totalLessons = 0;
  let skippedCourses = 0;

  for (const courseData of COURSES_DATA) {
    // Trova il corso nel DB tramite slug
    const course = await prisma.course.findUnique({
      where: { slug: courseData.slug },
    });

    if (!course) {
      console.warn(`  ⚠️  Corso non trovato: ${courseData.slug} — esegui prima add-missing-courses.js`);
      skippedCourses++;
      continue;
    }

    // Rimuove eventuali lezioni esistenti (idempotenza)
    const deleted = await prisma.lesson.deleteMany({ where: { courseId: course.id } });
    if (deleted.count > 0) {
      console.log(`  🗑️  Cancellate ${deleted.count} lezioni precedenti per ${courseData.slug}`);
    }

    // Crea le nuove lezioni
    let created = 0;
    let errors  = 0;
    for (const lesson of courseData.lessons) {
      try {
        await prisma.lesson.create({
          data: {
            courseId:    course.id,
            title:       lesson.title,
            durationMin: lesson.durationMin,
            isFree:      false,           // REGOLA ASSOLUTA: isFree sempre false
            sortOrder:   lesson.sortOrder,
            vimeoUrl:    lesson.vimeoUrl ?? undefined,
            latinCertId: lesson.latinCertId ?? undefined, // null → non impostare
          },
        });
        created++;
      } catch (err) {
        console.error(`    ⚠️  Lezione "${lesson.title}" (IDL ${lesson.latinCertId}) — ${err.message}`);
        errors++;
      }
    }

    totalLessons += created;
    const status = errors > 0 ? `✅  ${created} create, ⚠️  ${errors} errori` : `✅  ${created} lezioni create`;
    console.log(`  ${status}  →  ${courseData.slug}`);
  }

  console.log(`\n✔ Completato: ${totalLessons} lezioni create su ${COURSES_DATA.length - skippedCourses} corsi.`);
  if (skippedCourses > 0) {
    console.log(`  ⚠️  ${skippedCourses} corsi saltati (non trovati nel DB).`);
    console.log('     Esegui prima: node scripts/add-missing-courses.js\n');
  } else {
    console.log('  Verifica nel pannello admin → sezione Corsi.\n');
  }
}

main()
  .catch(err => {
    console.error('\n❌ Errore:', err.message);
    if (err.code === 'P2002') {
      console.error('   Violazione unique constraint su latinCertId — un IDL è già presente in un altro corso.');
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
