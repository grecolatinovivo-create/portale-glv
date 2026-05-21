// tools/migrate-complete.js
// ─────────────────────────────────────────────────────────────────────────────
// Migrazione COMPLETA latin-cert → portale GLV
//
//  Cosa fa:
//   1. Legge database_latin-cert.sql dalla cartella radice del progetto
//   2. Estrae lezioni + link Vimeo per ogni IDCR specificato nel mapping
//   3. FIX breve-marziale: rimuove le 25 lezioni sbagliate (tutoraggio privato)
//      e inserisce le 4 corrette (il vero corso pubblico)
//   4. Aggiunge tutti i corsi rimanenti: Didattica, Ebraico, Corsi Brevi
//
//  Esegui dalla cartella portale-glv:
//    node tools/migrate-complete.js
//
// ─────────────────────────────────────────────────────────────────────────────

const { PrismaClient } = require('@prisma/client')
const fs   = require('fs')
const path = require('path')
const rl   = require('readline')

const prisma   = new PrismaClient()
const SQL_FILE = path.join(__dirname, '..', 'database_latin-cert.sql')

// ─── MAPPING DEFINITIVO: slug portale → IDCR latin-cert ──────────────────
// Verificato sui titoli reali delle lezioni estratte dal DB
const MAPPING = {
  // FIX CRITICO: Marziale era mappato su IDCR=286 (tutoraggio privato, 25 lezioni)
  // IDCR=300 contiene le 4 lezioni del corso pubblico:
  //   "Marziale e le accuse di plagio", "Sfarzo e ipocrisia a banchetto",
  //   "I segreti di una vita felice", "Questo è quel Marziale che leggi..."
  'breve-marziale':         300,

  // DIDATTICA (verificati sui titoli lezioni)
  'did-elementa':           242,  // "Incontro 1-5 + Video extra" — 8 lezioni
  'did-principia':          247,  // "La Grammatica dell'Induzione: Principia" — 7 lezioni
  'did-grammatica':         252,  // "Il Latino come lingua, processi cognitivi..." — 10 lezioni
  'did-tertia':             412,  // "Insegnare la letteratura in lingua..." — 5 lezioni

  // EBRAICO BIBLICO (3 edizioni assegnate per data crescente = livello crescente)
  'eb-a11':                 186,  // Jan 2024 — 13 lezioni
  'eb-a12':                 213,  // Mar 2024 — 12 lezioni
  'eb-a21':                 299,  // Nov 2024 — 16 lezioni

  // CORSI BREVI (verificati sui titoli lezioni dove possibile)
  'breve-tradurre':         359,  // "Il cervello e il testo, Lessico e acquisizione..."
  'breve-japonia':          365,  // "Terra Japonia: geografia, stupore..."
  'breve-metrica':          369,  // "Il cervello e il verso, Il Cervello e il Ritmo..."
  'breve-catullo':          411,  // "La cerchia dei neoterici, Amore a prima vista..."
  'breve-sacro-romano':     225,  // "Non chiamatela religione, Vivere con gli Dèi..."
  'breve-dei-uomini':       237,  // "Il mito delle origini, Roma e il destino del mondo..."
  'breve-conclave':         358,  // "Anatomia di una Bolla Papale, Ubi Periculum..."
  'breve-voci-vangeli':     190,  // 4 sessioni Gen 2024
  'breve-storie-latine':    192,  // 4 lezioni Gen 2024
  'breve-echi-marmo':       340,  // 4 lezioni Mar 2025
  'breve-schiavitu':        339,  // 4 lezioni Mar 2025
  'breve-etruschi':         201,  // "Le origini, l'espansione, lingua e scrittura, Veio..."
  'breve-nubia-egitto':     197,  // 4 lezioni Feb 2024
  'breve-archeologia':      207,  // 4 lezioni Feb 2024
  'breve-passione':         214,  // "Verso la Città Santa, Gesti di Umanità..."
  'breve-pompei':           218,  // 4 incontri Mar 2024
  'breve-miniera-luna':     224,  // 4 lezioni Apr 2024
  'breve-voci-femminili':   229,  // "Annunciazione e Accettazione: Maria..."
  'breve-nilo':             301,  // 4 lezioni Nov-Dic 2024
  'breve-etruschi-vita':    307,  // "Religione etrusca, La guerra degli Etruschi..."
  'breve-terre-bibbia':     311,  // 4 sessioni Dic 2024
  'breve-guerra-religione': 345,  // "Gli Dèi della Guerra, Auspicia Militaria..."
  'breve-colloquia':        377,  // Colloquia Ciceroniana — 18 lezioni

  // AGGIUNTO dopo ricerca classroom: IDCR trovati
  'breve-roma-dei':         270,  // "Roma e i Suoi Dèi: Storia di una Religione Millenaria"
  'breve-algoritmica':      236,  // "L'Algoritmica dell'Essere: Esplorazioni Filosofiche..."
}

const NEEDED_IDCR = new Set(Object.values(MAPPING))

// ─── Parser SQL streaming ─────────────────────────────────────────────────
function parseSql() {
  return new Promise((resolve, reject) => {
    console.log('Lettura database_latin-cert.sql (695MB) — attendere...')

    // lezione: IDL→{title, description, addtext, FK_IDCR}
    const lezioni = new Map()
    // video: FK_IDL→{link, durata}
    const videos  = new Map()

    const stream = fs.createReadStream(SQL_FILE, { encoding: 'latin1' })
    const reader = rl.createInterface({ input: stream, crlfDelay: Infinity })

    let inLezione = false
    let inVideo   = false
    let buffer    = ''

    const ROW_RE = /\(([^)]*(?:'[^']*'[^)]*)*)\)/g

    function parseVal(s) {
      s = s.trim()
      if (s === 'NULL') return null
      if (s.startsWith("'")) {
        return s.slice(1, -1)
          .replace(/\\'/g, "'")
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\\\/g, '\\')
      }
      const n = Number(s)
      return isNaN(n) ? s : n
    }

    function parseRow(raw) {
      const vals = []
      let cur = '', depth = 0, inStr = false, i = 0
      while (i < raw.length) {
        const c = raw[i]
        if (c === "'" && !inStr) { inStr = true; cur += c }
        else if (c === "'" && inStr) {
          if (raw[i+1] === "'") { cur += "'"; i++ }
          else { inStr = false; cur += c }
        } else if (!inStr && c === ',') {
          vals.push(parseVal(cur.trim())); cur = ''
        } else { cur += c }
        i++
      }
      vals.push(parseVal(cur.trim()))
      return vals
    }

    function processBuffer(tableName, buf) {
      const content = buf.replace(/^[^(]*/, '')
      let match
      ROW_RE.lastIndex = 0
      const re = /\(([^)]*(?:'(?:[^'\\]|\\.)*'[^)]*)*)\)/g
      while ((match = re.exec(content)) !== null) {
        try {
          const vals = parseRow(match[1])
          if (tableName === 'lezione') {
            // IDL, title, description, addtext, datetime, calendar, FK_IDCR, ...
            const idl    = vals[0]
            const title  = vals[1]
            const desc   = vals[2]
            const addt   = vals[3]
            const fkIdcr = vals[6]
            if (NEEDED_IDCR.has(fkIdcr)) {
              lezioni.set(idl, { title, description: desc, addtext: addt, FK_IDCR: fkIdcr })
            }
          } else if (tableName === 'video') {
            // IDV, FK_IDL, link, datetime, is_uploaded, is_active, foto, durata, log
            const fkIdl  = vals[1]
            const link   = vals[2]
            const durata = vals[7]
            if (link && typeof link === 'string' && link.includes('vimeo')) {
              if (!videos.has(fkIdl)) {
                videos.set(fkIdl, { link, durata })
              }
            }
          }
        } catch (_) {}
      }
    }

    reader.on('line', line => {
      if (line.startsWith('INSERT INTO `lezione`')) { inLezione = true; inVideo = false; buffer = line }
      else if (line.startsWith('INSERT INTO `video`')) { inVideo = true; inLezione = false; buffer = line }
      else if (line.startsWith('INSERT INTO ') && !line.startsWith('INSERT INTO `lezione`') && !line.startsWith('INSERT INTO `video`')) {
        if (inLezione) { processBuffer('lezione', buffer); inLezione = false; buffer = '' }
        if (inVideo)   { processBuffer('video',   buffer); inVideo   = false; buffer = '' }
      } else if (inLezione || inVideo) {
        buffer += '\n' + line
        if (line.trimEnd().endsWith(';')) {
          if (inLezione) { processBuffer('lezione', buffer); inLezione = false; buffer = '' }
          if (inVideo)   { processBuffer('video',   buffer); inVideo   = false; buffer = '' }
        }
      }
    })

    reader.on('close', () => {
      if (inLezione) processBuffer('lezione', buffer)
      if (inVideo)   processBuffer('video',   buffer)
      console.log(`  Lezioni trovate: ${lezioni.size}`)
      console.log(`  Video trovati:   ${videos.size}`)
      resolve({ lezioni, videos })
    })

    reader.on('error', reject)
    stream.on('error', reject)
  })
}

// ─── Pulizia testo ────────────────────────────────────────────────────────
function clean(s) {
  if (!s) return ''
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300)
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== MIGRAZIONE COMPLETA latin-cert → portale GLV ===\n')

  const { lezioni, videos } = await parseSql()

  // Costruisce mappa IDCR → [{sortOrder, title, vimeoUrl, durationMin}]
  const byIdcr = new Map()
  for (const [idl, lezData] of lezioni) {
    const vid = videos.get(idl)
    if (!vid) continue
    const idcr = lezData.FK_IDCR
    if (!byIdcr.has(idcr)) byIdcr.set(idcr, [])
    byIdcr.get(idcr).push({ idl, ...lezData, ...vid })
  }

  // Ordina per IDL e assegna sortOrder
  for (const [idcr, rows] of byIdcr) {
    rows.sort((a, b) => a.idl - b.idl)
    rows.forEach((r, i) => { r.sortOrder = i + 1 })
  }

  // Carica corsi dal DB Neon
  const allCourses = await prisma.course.findMany({ select: { id: true, slug: true } })
  const courseMap  = Object.fromEntries(allCourses.map(c => [c.slug, c.id]))

  let totalInserted = 0, totalDeleted = 0
  const skipped = []

  for (const [slug, idcr] of Object.entries(MAPPING)) {
    const courseId = courseMap[slug]
    if (!courseId) { skipped.push(`${slug} — slug non trovato nel DB`); continue }

    const rows = byIdcr.get(idcr)
    if (!rows || rows.length === 0) { skipped.push(`${slug} — nessuna lezione/video in IDCR=${idcr}`); continue }

    // Cancella lezioni esistenti (include fix Marziale)
    const { count: deleted } = await prisma.lesson.deleteMany({ where: { courseId } })
    totalDeleted += deleted

    // Inserisci lezioni nuove
    let n = 0
    for (const r of rows) {
      const title   = clean(r.title) || `Lezione ${r.sortOrder}`
      const durMin  = Math.max(1, Math.round((r.durata || 60) / 60))
      await prisma.lesson.create({
        data: {
          courseId,
          title,
          vimeoUrl:    r.link,
          durationMin: durMin,
          isFree:      false,
          sortOrder:   r.sortOrder,
        }
      })
      n++
    }

    totalInserted += n
    const tag = deleted > 0 ? 'FIX' : 'NEW'
    console.log(`  [${tag}] ${slug.padEnd(32)} ${n} lezioni${deleted > 0 ? `  (rimosso ${deleted} vecchie)` : ''}`)
  }

  console.log(`\n${'─'.repeat(55)}`)
  console.log(`Lezioni rimosse:  ${totalDeleted}`)
  console.log(`Lezioni inserite: ${totalInserted}`)

  if (skipped.length) {
    console.log(`\nNon elaborati (${skipped.length}):`)
    skipped.forEach(s => console.log(`  ⚠  ${s}`))
  }

  // Riepilogo finale DB
  const summary = await prisma.$queryRaw`
    SELECT c.slug, c."sortOrder", COUNT(l.id)::int AS n
    FROM "Course" c
    LEFT JOIN "Lesson" l ON l."courseId" = c.id
    GROUP BY c.slug, c."sortOrder"
    ORDER BY c."sortOrder"
  `

  const withLessons = summary.filter(r => r.n > 0)
  const totalLessons = withLessons.reduce((s, r) => s + r.n, 0)

  console.log(`\n${'─'.repeat(55)}`)
  console.log(`STATO FINALE — ${withLessons.length} corsi con lezioni (${totalLessons} totali)\n`)
  for (const r of withLessons) {
    console.log(`  ${r.slug.padEnd(32)} ${String(r.n).padStart(3)} lezioni`)
  }
  console.log(`\n  TOTALE: ${totalLessons} lezioni su ${withLessons.length} corsi`)
}

main()
  .catch(e => { console.error('\nERRORE:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
