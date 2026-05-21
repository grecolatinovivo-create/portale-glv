// tools/migrate-latin-cert.js
// Popola il DB Neon con lezioni reali da latin-cert
// Esegui dalla cartella portale-glv:
//   node tools/migrate-latin-cert.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Migrazione latin-cert → portale GLV')
  let totalLezioni = 0, totalCorsi = 0


  // lat-a11 (19 lezioni da IDCR=59)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'lat-a11' } })
    if (!course) { console.warn('  ⚠ corso non trovato: lat-a11') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1 - 29/11/22`, vimeoUrl: `https://vimeo.com/776546078`, sortOrder: 1, durationMin: 120, isFree: false },
        { title: `Lezione 2 - 6 dicembre 2022`, vimeoUrl: `https://vimeo.com/778622074`, sortOrder: 2, durationMin: 1, isFree: false },
        { title: `Lezione 3 - 13 dicembre 2022`, vimeoUrl: `https://vimeo.com/780863354`, sortOrder: 3, durationMin: 1, isFree: false },
        { title: `Lezione 4 - 15 dicembre 2022`, vimeoUrl: `https://vimeo.com/781601347`, sortOrder: 4, durationMin: 1, isFree: false },
        { title: `Lezione 5 - 20 dicembre 2022`, vimeoUrl: `https://vimeo.com/783214335`, sortOrder: 5, durationMin: 1, isFree: false },
        { title: `Lezione 6 - 22 dicembre 2022`, vimeoUrl: `https://vimeo.com/783748939`, sortOrder: 6, durationMin: 111, isFree: false },
        { title: `Lezione 7 del 27 dicembre 2022`, vimeoUrl: `https://vimeo.com/784717983`, sortOrder: 7, durationMin: 96, isFree: false },
        { title: `Lezione 8 del 01 gennaio 2023`, vimeoUrl: `https://vimeo.com/786821251`, sortOrder: 8, durationMin: 119, isFree: false },
        { title: `Lezione 9 del 10 gennaio 2023`, vimeoUrl: `https://vimeo.com/788195517`, sortOrder: 9, durationMin: 1, isFree: false },
        { title: `Lezione 10 del 17 gennaio 2023`, vimeoUrl: `https://vimeo.com/790456332`, sortOrder: 10, durationMin: 1, isFree: false },
        { title: `Lezione 11 del 24 gennaio 2023`, vimeoUrl: `https://vimeo.com/792993577`, sortOrder: 11, durationMin: 1, isFree: false },
        { title: `Lezione 12 del 2 febbraio 2023`, vimeoUrl: `https://vimeo.com/795416073`, sortOrder: 12, durationMin: 120, isFree: false },
        { title: `Lezione 13 del 7 febbraio 2023`, vimeoUrl: `https://vimeo.com/796909792`, sortOrder: 13, durationMin: 1, isFree: false },
        { title: `Lezione 14 del 14 febbraio 2023 (contiene materiale da scaricare EXTRA)`, vimeoUrl: `https://vimeo.com/798998265`, sortOrder: 14, durationMin: 1, isFree: false },
        { title: `Lezione 15 del 21 febbraio 2023`, vimeoUrl: `https://vimeo.com/801145271`, sortOrder: 15, durationMin: 1, isFree: false },
        { title: `Lezione 16 del 23 febbraio 2023`, vimeoUrl: `https://vimeo.com/801946977`, sortOrder: 16, durationMin: 1, isFree: false },
        { title: `Lezione 17 del 28 febbraio 2023`, vimeoUrl: `https://vimeo.com/803521524`, sortOrder: 17, durationMin: 1, isFree: false },
        { title: `Lezione 18 del 7 marzo 2023`, vimeoUrl: `https://vimeo.com/805888308`, sortOrder: 18, durationMin: 1, isFree: false },
        { title: `Lezione EXTRA`, vimeoUrl: `https://vimeo.com/810066344`, sortOrder: 19, durationMin: 1, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ lat-a11: 19 lezioni`)
      totalLezioni += 19
      totalCorsi++
    }
  }

  // lat-a12 (9 lezioni da IDCR=110)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'lat-a12' } })
    if (!course) { console.warn('  ⚠ corso non trovato: lat-a12') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Prima lectio: Fabulae de leone`, vimeoUrl: `https://vimeo.com/841468354`, sortOrder: 1, durationMin: 16, isFree: false },
        { title: `Lectio secunda: de puero mendace`, vimeoUrl: `https://vimeo.com/844133651`, sortOrder: 2, durationMin: 1, isFree: false },
        { title: `Lectio tertia: de militibus romanis`, vimeoUrl: `https://vimeo.com/846022992`, sortOrder: 3, durationMin: 11, isFree: false },
        { title: `Lectio quarta: Snupius, canis a Carolo M. Schultz pictus.`, vimeoUrl: `https://vimeo.com/847807295`, sortOrder: 4, durationMin: 1, isFree: false },
        { title: `Lectio quinta: de Orpheo lyram psallente`, vimeoUrl: `https://vimeo.com/850130446`, sortOrder: 5, durationMin: 1, isFree: false },
        { title: `Lectio sexta: De Colosseo vel Amphitheatro Flavio`, vimeoUrl: `https://vimeo.com/852656691`, sortOrder: 6, durationMin: 10, isFree: false },
        { title: `Lectio septima: aenigma de coclea`, vimeoUrl: `https://vimeo.com/855378774`, sortOrder: 7, durationMin: 14, isFree: false },
        { title: `Lectio octava: de die pueri`, vimeoUrl: `https://vimeo.com/858623552`, sortOrder: 8, durationMin: 15, isFree: false },
        { title: `Lectio nona: de puero et matre`, vimeoUrl: `https://vimeo.com/872124198`, sortOrder: 9, durationMin: 12, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ lat-a12: 9 lezioni`)
      totalLezioni += 9
      totalCorsi++
    }
  }

  // lat-a21 (19 lezioni da IDCR=87)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'lat-a21' } })
    if (!course) { console.warn('  ⚠ corso non trovato: lat-a21') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1 - 28 marzo 2023`, vimeoUrl: `https://vimeo.com/812711343`, sortOrder: 1, durationMin: 1, isFree: false },
        { title: `Lezione 2 - 31 marzo 2023`, vimeoUrl: `https://vimeo.com/813679580`, sortOrder: 2, durationMin: 1, isFree: false },
        { title: `Lezione 3 - 4 aprile 2023`, vimeoUrl: `https://vimeo.com/814859011`, sortOrder: 3, durationMin: 1, isFree: false },
        { title: `Lezione 4 - 11 aprile 2023`, vimeoUrl: `https://vimeo.com/816786914`, sortOrder: 4, durationMin: 1, isFree: false },
        { title: `Lezione 5 - 14 aprile 2023`, vimeoUrl: `https://vimeo.com/817869339`, sortOrder: 5, durationMin: 1, isFree: false },
        { title: `Lezione 6 - 18 aprile 2023`, vimeoUrl: `https://vimeo.com/819884897`, sortOrder: 6, durationMin: 1, isFree: false },
        { title: `Lezione 7 - 22 aprile 2023`, vimeoUrl: `https://vimeo.com/820056476`, sortOrder: 7, durationMin: 1, isFree: false },
        { title: `Lezione 7 (parte seconda)`, vimeoUrl: `https://vimeo.com/820059405`, sortOrder: 8, durationMin: 1, isFree: false },
        { title: `Lezione 8 del 26 aprile 2023`, vimeoUrl: `https://vimeo.com/821392254`, sortOrder: 9, durationMin: 1, isFree: false },
        { title: `Lezione 9 del 2 maggio 2023`, vimeoUrl: `https://vimeo.com/823126194/e2bb53c630`, sortOrder: 10, durationMin: 1, isFree: false },
        { title: `Lezione 10 del 5 maggio 2023`, vimeoUrl: `https://vimeo.com/824310256`, sortOrder: 11, durationMin: 1, isFree: false },
        { title: `Lezione 11 del 9 maggio 2023`, vimeoUrl: `https://vimeo.com/825359424`, sortOrder: 12, durationMin: 1, isFree: false },
        { title: `Lezione 12 del 16 maggio 2023`, vimeoUrl: `https://vimeo.com/827509703`, sortOrder: 13, durationMin: 1, isFree: false },
        { title: `Lezione 13 del 23 maggio 2023`, vimeoUrl: `https://vimeo.com/829552375`, sortOrder: 14, durationMin: 1, isFree: false },
        { title: `Lezione 14 del 26 maggio 2023`, vimeoUrl: `https://vimeo.com/830767264`, sortOrder: 15, durationMin: 1, isFree: false },
        { title: `Lezione 15 del 30 maggio 2023`, vimeoUrl: `https://vimeo.com/831764688`, sortOrder: 16, durationMin: 1, isFree: false },
        { title: `Lezione 16 del 6 giugno 2023`, vimeoUrl: `https://vimeo.com/833945725`, sortOrder: 17, durationMin: 1, isFree: false },
        { title: `Lezione 17 del 13 giugno 2023`, vimeoUrl: `https://vimeo.com/836084324`, sortOrder: 18, durationMin: 1, isFree: false },
        { title: `Lezione 18 del 20 giugno 2023`, vimeoUrl: `https://vimeo.com/838222991`, sortOrder: 19, durationMin: 110, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ lat-a21: 19 lezioni`)
      totalLezioni += 19
      totalCorsi++
    }
  }

  // lat-a22 (10 lezioni da IDCR=111)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'lat-a22' } })
    if (!course) { console.warn('  ⚠ corso non trovato: lat-a22') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lectio prima: De Infantia Persei`, vimeoUrl: `https://vimeo.com/841502574`, sortOrder: 1, durationMin: 11, isFree: false },
        { title: `Lectio secunda: De vehiculis et de frequentia eorum`, vimeoUrl: `https://vimeo.com/843792522`, sortOrder: 2, durationMin: 13, isFree: false },
        { title: `Lectio tertia: de fele emunctae naris`, vimeoUrl: `https://vimeo.com/845957122`, sortOrder: 3, durationMin: 16, isFree: false },
        { title: `Lectio quarta: de itinere sive de sententiis finalibus gerundio gerundivoque extruendis`, vimeoUrl: `https://vimeo.com/847810297`, sortOrder: 4, durationMin: 16, isFree: false },
        { title: `Lectio quinta: de belli Macedonici initio`, vimeoUrl: `https://vimeo.com/850151345`, sortOrder: 5, durationMin: 11, isFree: false },
        { title: `Lectio sexta: De Augusto principe ab Eutropio conscripto`, vimeoUrl: `https://vimeo.com/852604467`, sortOrder: 6, durationMin: 13, isFree: false },
        { title: `Lectio septima: de morte Hannibalis`, vimeoUrl: `https://vimeo.com/855645853`, sortOrder: 7, durationMin: 18, isFree: false },
        { title: `Lectio octava: biduum piscando feriatum`, vimeoUrl: `https://vimeo.com/855986465`, sortOrder: 8, durationMin: 13, isFree: false },
        { title: `Lectio nona: biduum biscando feriatum - pars altera`, vimeoUrl: `https://vimeo.com/860430404`, sortOrder: 9, durationMin: 10, isFree: false },
        { title: `Lectio decima - Iter filmicum`, vimeoUrl: `https://vimeo.com/792163246/7da3078098`, sortOrder: 10, durationMin: 14, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ lat-a22: 10 lezioni`)
      totalLezioni += 10
      totalCorsi++
    }
  }

  // lat-b11 (19 lezioni da IDCR=78)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'lat-b11' } })
    if (!course) { console.warn('  ⚠ corso non trovato: lat-b11') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1 - 14 febbraio`, vimeoUrl: `https://vimeo.com/800079532`, sortOrder: 1, durationMin: 1, isFree: false },
        { title: `Lezione 2 - 21 febbraio`, vimeoUrl: `https://vimeo.com/801315418`, sortOrder: 2, durationMin: 1, isFree: false },
        { title: `Lezione 3 - 28 febbraio`, vimeoUrl: `https://vimeo.com/804787749`, sortOrder: 3, durationMin: 1, isFree: false },
        { title: `Lezione 4- 7 marzo 2023`, vimeoUrl: `https://vimeo.com/806443464`, sortOrder: 4, durationMin: 1, isFree: false },
        { title: `Lezione 5 - 14 marzo 2023`, vimeoUrl: `https://vimeo.com/808070938`, sortOrder: 5, durationMin: 1, isFree: false },
        { title: `Lezione 6 - 16 marzo 2023`, vimeoUrl: `https://vimeo.com/808823087`, sortOrder: 6, durationMin: 1, isFree: false },
        { title: `Lezione 7 - 29 marzo 2023`, vimeoUrl: `https://vimeo.com/815032636`, sortOrder: 7, durationMin: 1, isFree: false },
        { title: `Lezione 8 - 4 aprile 2023`, vimeoUrl: `https://vimeo.com/815053739`, sortOrder: 8, durationMin: 1, isFree: false },
        { title: `Lezione 9 - 11 aprile 2023`, vimeoUrl: `https://vimeo.com/818763150`, sortOrder: 9, durationMin: 1, isFree: false },
        { title: `Lezione 10 - 20 aprile 2022`, vimeoUrl: `https://vimeo.com/819596443`, sortOrder: 10, durationMin: 1, isFree: false },
        { title: `Lezione 11 - 27 aprile 2023`, vimeoUrl: `https://vimeo.com/822049022`, sortOrder: 11, durationMin: 1, isFree: false },
        { title: `Lezione 12 - 2 maggio 2023`, vimeoUrl: `https://vimeo.com/823149153/f2255733d6`, sortOrder: 12, durationMin: 1, isFree: false },
        { title: `Lezione 13 - 9 maggio 2023`, vimeoUrl: `https://vimeo.com/825213548`, sortOrder: 13, durationMin: 1, isFree: false },
        { title: `Lezione 14 - 16 maggio 2023`, vimeoUrl: `https://vimeo.com/827500001`, sortOrder: 14, durationMin: 1, isFree: false },
        { title: `Lezione 15 - 18 maggio 2023`, vimeoUrl: `https://vimeo.com/828094822`, sortOrder: 15, durationMin: 1, isFree: false },
        { title: `Lezione 16 - 23 maggio 2023`, vimeoUrl: `https://vimeo.com/830159354`, sortOrder: 16, durationMin: 1, isFree: false },
        { title: `Lezione 17 - 25 maggio 2023`, vimeoUrl: `https://vimeo.com/830315476`, sortOrder: 17, durationMin: 1, isFree: false },
        { title: `Lezione 18 - 30 maggio 2023`, vimeoUrl: `https://vimeo.com/831617336`, sortOrder: 18, durationMin: 1, isFree: false },
        { title: `Lezione 19`, vimeoUrl: `https://vimeo.com/834124326`, sortOrder: 19, durationMin: 1, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ lat-b11: 19 lezioni`)
      totalLezioni += 19
      totalCorsi++
    }
  }

  // lat-b12 (18 lezioni da IDCR=13)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'lat-b12' } })
    if (!course) { console.warn('  ⚠ corso non trovato: lat-b12') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1 del 3 ottobre 2022`, vimeoUrl: `https://vimeo.com/762900694`, sortOrder: 1, durationMin: 1, isFree: false },
        { title: `Lezione 2 del 10 ottobre 2022`, vimeoUrl: `https://vimeo.com/762903486`, sortOrder: 2, durationMin: 1, isFree: false },
        { title: `Lezione 3 del 12 ottobre 2022`, vimeoUrl: `https://vimeo.com/763412611`, sortOrder: 3, durationMin: 1, isFree: false },
        { title: `Lezione 4 del 17 ottobre 2022`, vimeoUrl: `https://vimeo.com/763474413`, sortOrder: 4, durationMin: 1, isFree: false },
        { title: `Lezione 5 del 24 ottobre 2022`, vimeoUrl: `https://vimeo.com/763529601`, sortOrder: 5, durationMin: 1, isFree: false },
        { title: `Lezione 6 del 31 Ottobre 2022`, vimeoUrl: `https://vimeo.com/765841742`, sortOrder: 6, durationMin: 1, isFree: false },
        { title: `lezione 7 del 7 novembre 2022`, vimeoUrl: `https://vimeo.com/768451431`, sortOrder: 7, durationMin: 1, isFree: false },
        { title: `Lezione 8 del 14 novembre 2022`, vimeoUrl: `https://vimeo.com/770937564`, sortOrder: 8, durationMin: 1, isFree: false },
        { title: `Lezione 9 del 21 novembre 2022`, vimeoUrl: `https://vimeo.com/773505858`, sortOrder: 9, durationMin: 1, isFree: false },
        { title: `Lezione 10 del 28 novembre 2022`, vimeoUrl: `https://vimeo.com/775923101`, sortOrder: 10, durationMin: 1, isFree: false },
        { title: `Lezione 11 del 5 dicembre 2022`, vimeoUrl: `https://vimeo.com/778234279`, sortOrder: 11, durationMin: 1, isFree: false },
        { title: `Lezione 12 del 12 Dicembre 2922`, vimeoUrl: `https://vimeo.com/780485982`, sortOrder: 12, durationMin: 1, isFree: false },
        { title: `Lezione 13 del 19 dicembre 2022`, vimeoUrl: `https://vimeo.com/782659065`, sortOrder: 13, durationMin: 1, isFree: false },
        { title: `Lezione 14 del 9 gennaio 2023`, vimeoUrl: `https://vimeo.com/787679408`, sortOrder: 14, durationMin: 1, isFree: false },
        { title: `Lezione 15 del 16 gennaio 2023`, vimeoUrl: `https://vimeo.com/789815411`, sortOrder: 15, durationMin: 1, isFree: false },
        { title: `Lezione 16 del 18 gennaio 2023`, vimeoUrl: `https://vimeo.com/790548483`, sortOrder: 16, durationMin: 1, isFree: false },
        { title: `Lezione 17 del 23 gennaio 2023`, vimeoUrl: `https://vimeo.com/791998027`, sortOrder: 17, durationMin: 1, isFree: false },
        { title: `Lezione 18 del 30 gennaio 2023`, vimeoUrl: `https://vimeo.com/794408328`, sortOrder: 18, durationMin: 123, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ lat-b12: 18 lezioni`)
      totalLezioni += 18
      totalCorsi++
    }
  }

  // lat-b13 (10 lezioni da IDCR=113)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'lat-b13' } })
    if (!course) { console.warn('  ⚠ corso non trovato: lat-b13') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lectio prima: De Britannia Liberata`, vimeoUrl: `https://vimeo.com/841790552`, sortOrder: 1, durationMin: 18, isFree: false },
        { title: `Lectio secunda: De vehiculis et de frequentia eorum`, vimeoUrl: `https://vimeo.com/843792522`, sortOrder: 2, durationMin: 1, isFree: false },
        { title: `Lectio tertia: de fele emunctae naris`, vimeoUrl: `https://vimeo.com/845965920`, sortOrder: 3, durationMin: 1, isFree: false },
        { title: `Lectio quarta: de itinere sive de sententiis finalibus gerundio gerundivoque exstruendis`, vimeoUrl: `https://vimeo.com/847813431`, sortOrder: 4, durationMin: 1, isFree: false },
        { title: `Lectio quinta: de belli Macedonici initio`, vimeoUrl: `https://vimeo.com/850157958`, sortOrder: 5, durationMin: 1, isFree: false },
        { title: `Lectio sexta: De Augusto principe ab Eutropio conscripto`, vimeoUrl: `https://vimeo.com/852598352`, sortOrder: 6, durationMin: 1, isFree: false },
        { title: `Lectio septima: de morte Hannibalis`, vimeoUrl: `https://vimeo.com/855645853`, sortOrder: 7, durationMin: 1, isFree: false },
        { title: `Lectio octava: biduum piscando feriatum`, vimeoUrl: `https://vimeo.com/855986465`, sortOrder: 8, durationMin: 13, isFree: false },
        { title: `Lectio nona: biduum biscando feriatum - pars altera`, vimeoUrl: `https://vimeo.com/860430404`, sortOrder: 9, durationMin: 10, isFree: false },
        { title: `Lectio decima - iter filmicum`, vimeoUrl: `https://vimeo.com/792163246/7da3078098`, sortOrder: 10, durationMin: 14, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ lat-b13: 10 lezioni`)
      totalLezioni += 10
      totalCorsi++
    }
  }

  // gr-a11 (19 lezioni da IDCR=66)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'gr-a11' } })
    if (!course) { console.warn('  ⚠ corso non trovato: gr-a11') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1 - 24 gennaio 2023`, vimeoUrl: `https://vimeo.com/792150300`, sortOrder: 1, durationMin: 116, isFree: false },
        { title: `Lezione 2 - 30 gennaio 2023`, vimeoUrl: `https://vimeo.com/794400809`, sortOrder: 2, durationMin: 118, isFree: false },
        { title: `Lezione 3 - 06 febbraio 2023`, vimeoUrl: `https://vimeo.com/796418274`, sortOrder: 3, durationMin: 118, isFree: false },
        { title: `Lezione 4 - 13 febbraio 2023`, vimeoUrl: `https://vimeo.com/798662712`, sortOrder: 4, durationMin: 43, isFree: false },
        { title: `Lezione 4 - parte 2`, vimeoUrl: `https://vimeo.com/800805584`, sortOrder: 5, durationMin: 73, isFree: false },
        { title: `Lezione 5 - 20 febbraio 2023`, vimeoUrl: `https://vimeo.com/800764598`, sortOrder: 6, durationMin: 119, isFree: false },
        { title: `Lezione 6 - 27 febbraio 2023`, vimeoUrl: `https://vimeo.com/802986138`, sortOrder: 7, durationMin: 116, isFree: false },
        { title: `Lezione 7 - 6 marzo 2023`, vimeoUrl: `https://vimeo.com/805444064`, sortOrder: 8, durationMin: 116, isFree: false },
        { title: `Lezione 8 - 14 marzo 2023`, vimeoUrl: `https://vimeo.com/807822542`, sortOrder: 9, durationMin: 119, isFree: false },
        { title: `Lezione 9 - 20 marzo 2023`, vimeoUrl: `https://vimeo.com/810052001`, sortOrder: 10, durationMin: 120, isFree: false },
        { title: `Lezione 10 - 27 marzo 2023`, vimeoUrl: `https://vimeo.com/812332775`, sortOrder: 11, durationMin: 120, isFree: false },
        { title: `Lezione 11 - 03 aprile 2023`, vimeoUrl: `https://vimeo.com/814507495`, sortOrder: 12, durationMin: 121, isFree: false },
        { title: `Lezione 12 - 12 aprile 2023`, vimeoUrl: `https://vimeo.com/817183717`, sortOrder: 13, durationMin: 118, isFree: false },
        { title: `Lezione 13 - 18 aprile 2023`, vimeoUrl: `https://vimeo.com/818658833`, sortOrder: 14, durationMin: 122, isFree: false },
        { title: `Lezione 14 - 24 aprile 2023`, vimeoUrl: `https://vimeo.com/820783369`, sortOrder: 15, durationMin: 119, isFree: false },
        { title: `Lezione 15 - 3 maggio 2023`, vimeoUrl: `https://vimeo.com/823633688/0762ff6161`, sortOrder: 16, durationMin: 118, isFree: false },
        { title: `Lezione 16 - 8 maggio 2023`, vimeoUrl: `https://vimeo.com/825000064`, sortOrder: 17, durationMin: 118, isFree: false },
        { title: `Lezione 17 - 15 maggio 2023`, vimeoUrl: `https://vimeo.com/827155366`, sortOrder: 18, durationMin: 116, isFree: false },
        { title: `Lezione 18 - 22 maggio 2023`, vimeoUrl: `https://vimeo.com/829372209`, sortOrder: 19, durationMin: 120, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ gr-a11: 19 lezioni`)
      totalLezioni += 19
      totalCorsi++
    }
  }

  // gr-a12 (12 lezioni da IDCR=407)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'gr-a12' } })
    if (!course) { console.warn('  ⚠ corso non trovato: gr-a12') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1 9 MARZO 2026`, vimeoUrl: `https://vimeo.com/1171935065`, sortOrder: 1, durationMin: 88, isFree: false },
        { title: `Lezione 2 12 MARZO 2026`, vimeoUrl: `https://vimeo.com/1173078194`, sortOrder: 2, durationMin: 88, isFree: false },
        { title: `Lezione 3 16 MARZO 2026`, vimeoUrl: `https://vimeo.com/1174172308`, sortOrder: 3, durationMin: 89, isFree: false },
        { title: `Lezione 4 19 MARZO 2026`, vimeoUrl: `https://vimeo.com/1175308698`, sortOrder: 4, durationMin: 89, isFree: false },
        { title: `Lezione 5 23 MARZO 2026`, vimeoUrl: `https://vimeo.com/1176348324`, sortOrder: 5, durationMin: 85, isFree: false },
        { title: `Lezione 6 26 MARZO 2026`, vimeoUrl: `https://vimeo.com/1177481560`, sortOrder: 6, durationMin: 82, isFree: false },
        { title: `Lezione 7 30 MARZO 2026`, vimeoUrl: `https://vimeo.com/1178599924`, sortOrder: 7, durationMin: 87, isFree: false },
        { title: `Lezione 8 9 APRILE 2026`, vimeoUrl: `https://vimeo.com/1181718865`, sortOrder: 8, durationMin: 91, isFree: false },
        { title: `Lezione 9 13 APRILE 2026`, vimeoUrl: `https://vimeo.com/1182770707`, sortOrder: 9, durationMin: 89, isFree: false },
        { title: `Lezione 10 16 APRILE 2026`, vimeoUrl: `https://vimeo.com/1183883031`, sortOrder: 10, durationMin: 89, isFree: false },
        { title: `Lezione 11 20 APRILE 2026`, vimeoUrl: `https://vimeo.com/1184949871`, sortOrder: 11, durationMin: 90, isFree: false },
        { title: `LEZIONE 12 23 APRILE 2026`, vimeoUrl: `https://vimeo.com/1186024894`, sortOrder: 12, durationMin: 84, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ gr-a12: 12 lezioni`)
      totalLezioni += 12
      totalCorsi++
    }
  }

  // gr-a21 (19 lezioni da IDCR=35)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'gr-a21' } })
    if (!course) { console.warn('  ⚠ corso non trovato: gr-a21') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1 - 04/10/22`, vimeoUrl: `https://vimeo.com/764103996`, sortOrder: 1, durationMin: 1, isFree: false },
        { title: `Lezione 2 - 11/10/22 (parte 1)`, vimeoUrl: `https://vimeo.com/764118065`, sortOrder: 2, durationMin: 1, isFree: false },
        { title: `Lezione 2 - 11/10/22 (parte 2)`, vimeoUrl: `https://vimeo.com/764139978`, sortOrder: 3, durationMin: 1, isFree: false },
        { title: `Lezione 3 - 18/10/22`, vimeoUrl: `https://vimeo.com/764150850`, sortOrder: 4, durationMin: 1, isFree: false },
        { title: `Lezione 4 - 25/10/22`, vimeoUrl: `https://vimeo.com/764178527`, sortOrder: 5, durationMin: 1, isFree: false },
        { title: `Lezione 5 - 27/10/22`, vimeoUrl: `https://vimeo.com/764679138`, sortOrder: 6, durationMin: 1, isFree: false },
        { title: `Lezione 6 - 08/11/22`, vimeoUrl: `https://vimeo.com/768684336`, sortOrder: 7, durationMin: 1, isFree: false },
        { title: `Lezione 7 - 15/11/22`, vimeoUrl: `https://vimeo.com/771342076`, sortOrder: 8, durationMin: 1, isFree: false },
        { title: `Lezione 8 - 17/11/22`, vimeoUrl: `https://vimeo.com/772377170`, sortOrder: 9, durationMin: 1, isFree: false },
        { title: `Lezione 9 - 22/11/22`, vimeoUrl: `https://vimeo.com/773934718`, sortOrder: 10, durationMin: 1, isFree: false },
        { title: `Lezione 10 - 29/11/22`, vimeoUrl: `https://vimeo.com/776322948`, sortOrder: 11, durationMin: 1, isFree: false },
        { title: `Lezione 11 - 06/12/22`, vimeoUrl: `https://vimeo.com/778868920`, sortOrder: 12, durationMin: 1, isFree: false },
        { title: `Lezione 12 - 13/12/22`, vimeoUrl: `https://vimeo.com/780851243`, sortOrder: 13, durationMin: 1, isFree: false },
        { title: `Lezione 13 - 20/12/22`, vimeoUrl: `https://vimeo.com/783093331`, sortOrder: 14, durationMin: 1, isFree: false },
        { title: `Lezione 14 - 10/01/23`, vimeoUrl: `https://vimeo.com/788109279`, sortOrder: 15, durationMin: 1, isFree: false },
        { title: `Lezione 15 - 17/01/23`, vimeoUrl: `https://vimeo.com/790357032`, sortOrder: 16, durationMin: 1, isFree: false },
        { title: `Lezione 16 - 19/01/23`, vimeoUrl: `https://vimeo.com/790916210`, sortOrder: 17, durationMin: 1, isFree: false },
        { title: `Lezione 17 - 24/01/23`, vimeoUrl: `https://vimeo.com/792420554`, sortOrder: 18, durationMin: 1, isFree: false },
        { title: `Lezione 18 - 31/01/23`, vimeoUrl: `https://vimeo.com/794610052`, sortOrder: 19, durationMin: 1, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ gr-a21: 19 lezioni`)
      totalLezioni += 19
      totalCorsi++
    }
  }

  // gr-a22 (10 lezioni da IDCR=124)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'gr-a22' } })
    if (!course) { console.warn('  ⚠ corso non trovato: gr-a22') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Î¤Î Î PÎ©Î¤ÎÎ ÎÎÎÎÎÎ: Î ÎÎ¡Î Î¤ÎÎ¥ ÎÎÎÎÎ¥`, vimeoUrl: `https://vimeo.com/842114317`, sortOrder: 1, durationMin: 10, isFree: false },
        { title: `ÎÎÎ¥Î¤ÎÎ¡ÎÎ ÎÎÎÎÎÎ : Î¤Î ÎÎÎÎ¡ÎÎÎ`, vimeoUrl: `https://vimeo.com/844576943`, sortOrder: 2, durationMin: 11, isFree: false },
        { title: `Î¤Î¡ÎÎ¤ÎÎ ÎÎÎÎÎÎ: TO ÎÎ¡ÎÎÎÎÎÎ`, vimeoUrl: `https://vimeo.com/846207142`, sortOrder: 3, durationMin: 14, isFree: false },
        { title: `TETAÎ¡TON ÎÎÎÎÎÎ: TO ÎÎÎÎÎÎ`, vimeoUrl: `https://vimeo.com/847963092`, sortOrder: 4, durationMin: 11, isFree: false },
        { title: `Î ÎÎÎ Î¤ÎÎ ÎÎÎÎÎÎ: Î ÎÎ¡Î Î¤ÎÎ£ ÎÎÎÎÎ¤ÎÎ£`, vimeoUrl: `https://vimeo.com/850547228`, sortOrder: 5, durationMin: 10, isFree: false },
        { title: `ÎÎÎ¤ÎÎ ÎÎÎÎÎÎ: Î ÎÎ¡Î Î¤ÎÎ¥ Î£Î©ÎÎÎ¤ÎÎ£`, vimeoUrl: `https://vimeo.com/853115692`, sortOrder: 6, durationMin: 10, isFree: false },
        { title: `Î¤Î ÎÎÎÎÎÎÎ ÎÎÎÎÎÎ: Î ÎÎ¡Î Î¤ÎÎ¥ ÎÎÎ¡ÎÎÎÎÎ¥ ÎÎÎÎ¥`, vimeoUrl: `https://vimeo.com/855922269`, sortOrder: 7, durationMin: 13, isFree: false },
        { title: `ÎÎÎÎÎÎ ÎÎÎÎÎÎ O ÎÎÎ£Î©Î ÎÎÎ Î¤Î Î§Î¡Î¥Î£ÎÎÎÎÎÎÎ ÎÎÎ¡ÎÎ£ (a)`, vimeoUrl: `https://vimeo.com/856691012`, sortOrder: 8, durationMin: 15, isFree: false },
        { title: `ÎÎÎÎ¤ÎÎ ÎÎÎÎÎÎ Î ÎÎÎ£Î©Î ÎÎÎ Î¤Î Î§Î¡Î¥Î£ÎÎÎÎÎÎÎ ÎÎÎ¡ÎÎ£ (Î²)`, vimeoUrl: `https://vimeo.com/858723071`, sortOrder: 9, durationMin: 16, isFree: false },
        { title: `ÎÎÎÎÎ¤ÎÎ ÎÎÎÎÎÎ Î ÎÎÎ£Î©Î ÎÎÎ Î¤Î Î§Î¡Î¥Î£ÎÎÎÎÎÎÎ ÎÎÎ¡ÎÎ£ (Î³)`, vimeoUrl: `https://vimeo.com/860914850`, sortOrder: 10, durationMin: 16, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ gr-a22: 10 lezioni`)
      totalLezioni += 10
      totalCorsi++
    }
  }

  // gr-b11 (18 lezioni da IDCR=30)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'gr-b11' } })
    if (!course) { console.warn('  ⚠ corso non trovato: gr-b11') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Greco B1.1 - Lezione 1 (04/10/2022)`, vimeoUrl: `https://vimeo.com/763323171`, sortOrder: 1, durationMin: 123, isFree: false },
        { title: `Greco B1.1 - Lezione 2 (11/10/2022)`, vimeoUrl: `https://vimeo.com/763324359`, sortOrder: 2, durationMin: 117, isFree: false },
        { title: `Greco B1.1 - Lezione 3 (18/10/2022)`, vimeoUrl: `https://vimeo.com/763325464`, sortOrder: 3, durationMin: 120, isFree: false },
        { title: `Greco B1.1 - Lezione 4 (25/10/2022)`, vimeoUrl: `https://vimeo.com/763896309`, sortOrder: 4, durationMin: 114, isFree: false },
        { title: `Greco B1.1 - Lezione 5 (27/10/2022)`, vimeoUrl: `https://vimeo.com/764693967`, sortOrder: 5, durationMin: 116, isFree: false },
        { title: `Greco B1.1 - Lezione 6 (08/11/2022)`, vimeoUrl: `https://vimeo.com/768704449`, sortOrder: 6, durationMin: 1, isFree: false },
        { title: `Greco B1.1 - Lezione 7 (15/11/2022)`, vimeoUrl: `https://vimeo.com/771548091`, sortOrder: 7, durationMin: 117, isFree: false },
        { title: `Greco B1.1 - Lezione 8 (17/11/2022)`, vimeoUrl: `https://vimeo.com/772167992`, sortOrder: 8, durationMin: 1, isFree: false },
        { title: `Greco B1.1 - Lezione 9 (22/11/2022)`, vimeoUrl: `https://vimeo.com/773939408`, sortOrder: 9, durationMin: 1, isFree: false },
        { title: `Greco B1.1 - Lezione 10 (29/11/2022)`, vimeoUrl: `https://vimeo.com/776331181`, sortOrder: 10, durationMin: 113, isFree: false },
        { title: `Greco B1.1 - Lezione 11 (06/12/2022)`, vimeoUrl: `https://vimeo.com/778609624`, sortOrder: 11, durationMin: 121, isFree: false },
        { title: `Greco B1.1 - Lezione 12 (13/12/2022)`, vimeoUrl: `https://vimeo.com/780867495`, sortOrder: 12, durationMin: 116, isFree: false },
        { title: `Greco B1.1 - Lezione 13 (20/12/2022)`, vimeoUrl: `https://vimeo.com/783047869`, sortOrder: 13, durationMin: 118, isFree: false },
        { title: `Greco B1.1 - Lezione 14 (10/01/2023)`, vimeoUrl: `https://vimeo.com/788036700`, sortOrder: 14, durationMin: 114, isFree: false },
        { title: `Greco B1.1 - Lezione 15 (17/01/2023)`, vimeoUrl: `https://vimeo.com/790174833`, sortOrder: 15, durationMin: 117, isFree: false },
        { title: `Greco B1.1 - Lezione 16 (19/01/2023)`, vimeoUrl: `https://vimeo.com/790926150`, sortOrder: 16, durationMin: 118, isFree: false },
        { title: `Greco B1.1 - Lezione 17 (24/01/2023)`, vimeoUrl: `https://vimeo.com/792362828`, sortOrder: 17, durationMin: 114, isFree: false },
        { title: `Greco B1.1 - Lezione 18 (31/01/2023)`, vimeoUrl: `https://vimeo.com/794626177`, sortOrder: 18, durationMin: 116, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ gr-b11: 18 lezioni`)
      totalLezioni += 18
      totalCorsi++
    }
  }

  // gr-b12 (19 lezioni da IDCR=162)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'gr-b12' } })
    if (!course) { console.warn('  ⚠ corso non trovato: gr-b12') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1 - 3 ottobre 2023`, vimeoUrl: `https://vimeo.com/871166165`, sortOrder: 1, durationMin: 106, isFree: false },
        { title: `Lezione 2 - 10 ottobre 2023`, vimeoUrl: `https://vimeo.com/875620485`, sortOrder: 2, durationMin: 104, isFree: false },
        { title: `Lezione 3 - 17 ottobre 2023`, vimeoUrl: `https://vimeo.com/875622342`, sortOrder: 3, durationMin: 103, isFree: false },
        { title: `Lezione 4 (prima parte) - 24 ottobre 2023`, vimeoUrl: `https://vimeo.com/878192642`, sortOrder: 4, durationMin: 18, isFree: false },
        { title: `Lezione 4 (seconda parte) - 24 ottobre 2023`, vimeoUrl: `https://vimeo.com/878193174`, sortOrder: 5, durationMin: 43, isFree: false },
        { title: `Lezione 5 - 7 novembre 2023`, vimeoUrl: `https://vimeo.com/883017995`, sortOrder: 6, durationMin: 116, isFree: false },
        { title: `Lezione 6 - 14 novembre 2023`, vimeoUrl: `https://vimeo.com/884723791`, sortOrder: 7, durationMin: 124, isFree: false },
        { title: `Lezione 7 - 15 novembre 2023`, vimeoUrl: `https://vimeo.com/885171244`, sortOrder: 8, durationMin: 1, isFree: false },
        { title: `Lezione 8 - 28 novembre 2023`, vimeoUrl: `https://vimeo.com/897143202`, sortOrder: 9, durationMin: 1, isFree: false },
        { title: `Lezione 9 - 29 novembre 2023`, vimeoUrl: `https://vimeo.com/889835486`, sortOrder: 10, durationMin: 114, isFree: false },
        { title: `Lezione 10 - 5 dicembre 2023`, vimeoUrl: `https://vimeo.com/893253260`, sortOrder: 11, durationMin: 1, isFree: false },
        { title: `Lezione 11 - 12 dicembre 2023`, vimeoUrl: `https://vimeo.com/897135031`, sortOrder: 12, durationMin: 117, isFree: false },
        { title: `Lezione 12 - 19 dicembre 2023`, vimeoUrl: `https://vimeo.com/896985885`, sortOrder: 13, durationMin: 109, isFree: false },
        { title: `Lezione 13 - 20 dicembre 2023`, vimeoUrl: `https://vimeo.com/896989605`, sortOrder: 14, durationMin: 118, isFree: false },
        { title: `Lezione 14 - 9 gennaio 2024`, vimeoUrl: `https://vimeo.com/901430391`, sortOrder: 15, durationMin: 105, isFree: false },
        { title: `Lezione 15 - 16 gennaio 2024`, vimeoUrl: `https://vimeo.com/903786924`, sortOrder: 16, durationMin: 119, isFree: false },
        { title: `Lezione 16 - 23 gennaio 2024`, vimeoUrl: `https://vimeo.com/906002364`, sortOrder: 17, durationMin: 112, isFree: false },
        { title: `Lezione 17 - 26 gennaio 2024`, vimeoUrl: `https://vimeo.com/906968222`, sortOrder: 18, durationMin: 109, isFree: false },
        { title: `Lezione 18 - 30 gennaio 2024`, vimeoUrl: `https://vimeo.com/908040943`, sortOrder: 19, durationMin: 1, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ gr-b12: 19 lezioni`)
      totalLezioni += 19
      totalCorsi++
    }
  }

  // gr-b13 (18 lezioni da IDCR=392)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'gr-b13' } })
    if (!course) { console.warn('  ⚠ corso non trovato: gr-b13') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1`, vimeoUrl: `https://vimeo.com/1153737047`, sortOrder: 1, durationMin: 74, isFree: false },
        { title: `Lezione 2`, vimeoUrl: `https://vimeo.com/1154815047`, sortOrder: 2, durationMin: 80, isFree: false },
        { title: `Lezione 3`, vimeoUrl: `https://vimeo.com/1156410946`, sortOrder: 3, durationMin: 80, isFree: false },
        { title: `Lezione 4`, vimeoUrl: `https://vimeo.com/1158176522`, sortOrder: 4, durationMin: 83, isFree: false },
        { title: `Incontro extra`, vimeoUrl: `https://vimeo.com/1158560020`, sortOrder: 5, durationMin: 39, isFree: false },
        { title: `Lezione 5`, vimeoUrl: `https://vimeo.com/1160123223`, sortOrder: 6, durationMin: 70, isFree: false },
        { title: `Lezione 6`, vimeoUrl: `https://vimeo.com/1161223722`, sortOrder: 7, durationMin: 67, isFree: false },
        { title: `Lezione 7`, vimeoUrl: `https://vimeo.com/1162344078`, sortOrder: 8, durationMin: 79, isFree: false },
        { title: `Lezione 8`, vimeoUrl: `https://vimeo.com/1163643135`, sortOrder: 9, durationMin: 80, isFree: false },
        { title: `Lezione 9`, vimeoUrl: `https://vimeo.com/1165608107`, sortOrder: 10, durationMin: 73, isFree: false },
        { title: `Lezione 10`, vimeoUrl: `https://vimeo.com/1168646307`, sortOrder: 11, durationMin: 77, isFree: false },
        { title: `Lezione 11`, vimeoUrl: `https://vimeo.com/1169704766`, sortOrder: 12, durationMin: 91, isFree: false },
        { title: `Lezione 12`, vimeoUrl: `https://vimeo.com/1171034649`, sortOrder: 13, durationMin: 75, isFree: false },
        { title: `Lezione 13`, vimeoUrl: `https://vimeo.com/1172501915`, sortOrder: 14, durationMin: 103, isFree: false },
        { title: `Lezione 14`, vimeoUrl: `https://vimeo.com/1173193310`, sortOrder: 15, durationMin: 85, isFree: false },
        { title: `Lezione 15`, vimeoUrl: `https://vimeo.com/1174171216`, sortOrder: 16, durationMin: 93, isFree: false },
        { title: `Lezione 16`, vimeoUrl: `https://vimeo.com/1177127624`, sortOrder: 17, durationMin: 79, isFree: false },
        { title: `Lezione extra`, vimeoUrl: `https://vimeo.com/1179845782`, sortOrder: 18, durationMin: 79, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ gr-b13: 18 lezioni`)
      totalLezioni += 18
      totalCorsi++
    }
  }

  // eg-a11 (18 lezioni da IDCR=39)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'eg-a11' } })
    if (!course) { console.warn('  ⚠ corso non trovato: eg-a11') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1 del 27 ottobre 2022`, vimeoUrl: `https://vimeo.com/766089751`, sortOrder: 1, durationMin: 122, isFree: false },
        { title: `Lezione 2 del 3/11/2022`, vimeoUrl: `https://vimeo.com/767038604`, sortOrder: 2, durationMin: 115, isFree: false },
        { title: `Lezione del 5/11/2022 (Lezione speciale sulla decifrazione, con A. Colonna)`, vimeoUrl: `https://vimeo.com/767759830`, sortOrder: 3, durationMin: 136, isFree: false },
        { title: `Lezione 3 del 10/11/2022`, vimeoUrl: `https://vimeo.com/769601756`, sortOrder: 4, durationMin: 108, isFree: false },
        { title: `Lezione 4 del 17/11/2022`, vimeoUrl: `https://vimeo.com/772165637`, sortOrder: 5, durationMin: 113, isFree: false },
        { title: `Lezione 5 del 24/11/2022`, vimeoUrl: `https://vimeo.com/775464915`, sortOrder: 6, durationMin: 110, isFree: false },
        { title: `Lezione 6 del 26/11/2022`, vimeoUrl: `https://vimeo.com/775318123`, sortOrder: 7, durationMin: 112, isFree: false },
        { title: `Lezione 7 del 1/12/2022`, vimeoUrl: `https://vimeo.com/777110347`, sortOrder: 8, durationMin: 111, isFree: false },
        { title: `Lezione 8 del 13/12/2022`, vimeoUrl: `https://vimeo.com/783688692`, sortOrder: 9, durationMin: 109, isFree: false },
        { title: `Lezione 9 del 22/12/2022`, vimeoUrl: `https://vimeo.com/783743451`, sortOrder: 10, durationMin: 117, isFree: false },
        { title: `Lezione 10 del 12/01/2023`, vimeoUrl: `https://vimeo.com/788770158`, sortOrder: 11, durationMin: 118, isFree: false },
        { title: `Lezione 11 del 19/01/2023`, vimeoUrl: `https://vimeo.com/790927020`, sortOrder: 12, durationMin: 115, isFree: false },
        { title: `Lezione 12 del 21/01/2023`, vimeoUrl: `https://vimeo.com/791465035`, sortOrder: 13, durationMin: 101, isFree: false },
        { title: `Lezione 13 del 27/01/2023`, vimeoUrl: `https://vimeo.com/793146252`, sortOrder: 14, durationMin: 121, isFree: false },
        { title: `Lezione 14 del 02/02/2023`, vimeoUrl: `https://vimeo.com/795398561`, sortOrder: 15, durationMin: 116, isFree: false },
        { title: `Lezione 15 del 09/02/2023`, vimeoUrl: `https://vimeo.com/797477832`, sortOrder: 16, durationMin: 118, isFree: false },
        { title: `Lezione 16 del 15/02/2023`, vimeoUrl: `https://vimeo.com/799239046`, sortOrder: 17, durationMin: 118, isFree: false },
        { title: `Lezione 17 del 23/2/2023`, vimeoUrl: `https://vimeo.com/801758590`, sortOrder: 18, durationMin: 114, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ eg-a11: 18 lezioni`)
      totalLezioni += 18
      totalCorsi++
    }
  }

  // eg-a12 (8 lezioni da IDCR=234)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'eg-a12' } })
    if (!course) { console.warn('  ⚠ corso non trovato: eg-a12') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1 del 9 maggio 2024`, vimeoUrl: `https://vimeo.com/944576227`, sortOrder: 1, durationMin: 118, isFree: false },
        { title: `Lezione 2 del 16 maggio 2024`, vimeoUrl: `https://vimeo.com/947144346`, sortOrder: 2, durationMin: 114, isFree: false },
        { title: `Lezione 3 del 23 maggio 2024`, vimeoUrl: `https://vimeo.com/949652490`, sortOrder: 3, durationMin: 112, isFree: false },
        { title: `Lezione 4 del 30 maggio 2024`, vimeoUrl: `https://vimeo.com/952075222`, sortOrder: 4, durationMin: 120, isFree: false },
        { title: `Lezione 5 del 6 giugno 2024`, vimeoUrl: `https://vimeo.com/954973762`, sortOrder: 5, durationMin: 86, isFree: false },
        { title: `Lezione 6 del 13 giugno 2024`, vimeoUrl: `https://vimeo.com/957926456`, sortOrder: 6, durationMin: 117, isFree: false },
        { title: `Lezione 7 del 27 giugno 2024`, vimeoUrl: `https://vimeo.com/970144481`, sortOrder: 7, durationMin: 118, isFree: false },
        { title: `Lezione 8 del 4 luglio 2024`, vimeoUrl: `https://vimeo.com/977045666`, sortOrder: 8, durationMin: 135, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ eg-a12: 8 lezioni`)
      totalLezioni += 8
      totalCorsi++
    }
  }

  // eg-a21 (5 lezioni da IDCR=211)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'eg-a21' } })
    if (!course) { console.warn('  ⚠ corso non trovato: eg-a21') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1`, vimeoUrl: `https://vimeo.com/915711595`, sortOrder: 1, durationMin: 112, isFree: false },
        { title: `Lezione 2`, vimeoUrl: `https://vimeo.com/918090448`, sortOrder: 2, durationMin: 119, isFree: false },
        { title: `Lezione 3`, vimeoUrl: `https://vimeo.com/920615307`, sortOrder: 3, durationMin: 115, isFree: false },
        { title: `Lezione 4`, vimeoUrl: `https://vimeo.com/923537269`, sortOrder: 4, durationMin: 114, isFree: false },
        { title: `Lezione 5`, vimeoUrl: `https://vimeo.com/925999010`, sortOrder: 5, durationMin: 124, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ eg-a21: 5 lezioni`)
      totalLezioni += 5
      totalCorsi++
    }
  }

  // breve-marziale (25 lezioni da IDCR=286)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'breve-marziale' } })
    if (!course) { console.warn('  ⚠ corso non trovato: breve-marziale') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lez. 1 del 1 ottobre 2024`, vimeoUrl: `https://vimeo.com/1014712627`, sortOrder: 1, durationMin: 63, isFree: false },
        { title: `Lez. 2 del 3 ottobre 2024`, vimeoUrl: `https://vimeo.com/1015613080`, sortOrder: 2, durationMin: 56, isFree: false },
        { title: `Lez. 3 del 4 ottobre 2024`, vimeoUrl: `https://vimeo.com/1016058415`, sortOrder: 3, durationMin: 58, isFree: false },
        { title: `Lez. 4 (1h30) dell' 8 ottobre 2024`, vimeoUrl: `https://vimeo.com/1017450618`, sortOrder: 4, durationMin: 1, isFree: false },
        { title: `Lezione 5 (1h30) del 10 ottobre 2024`, vimeoUrl: `https://vimeo.com/1018230446`, sortOrder: 5, durationMin: 86, isFree: false },
        { title: `Lezione 6 (1h) dell'11 ottobre 2024`, vimeoUrl: `https://vimeo.com/1018598174`, sortOrder: 6, durationMin: 62, isFree: false },
        { title: `Lezione 7 del 14 ottobre 2024`, vimeoUrl: `https://vimeo.com/1019364869`, sortOrder: 7, durationMin: 1, isFree: false },
        { title: `Lezione 8 del 14 ottobre 2024`, vimeoUrl: `https://vimeo.com/1019717975`, sortOrder: 8, durationMin: 50, isFree: false },
        { title: `Lezione 10 del 21 ottobre 2024`, vimeoUrl: `https://vimeo.com/1021840276`, sortOrder: 9, durationMin: 60, isFree: false },
        { title: `Lezione 11 del 22 ottobre 2024`, vimeoUrl: `https://vimeo.com/1022023565`, sortOrder: 10, durationMin: 51, isFree: false },
        { title: `Lezione 12 (1) del 29 ottobre 2024`, vimeoUrl: `https://vimeo.com/1024289845`, sortOrder: 11, durationMin: 60, isFree: false },
        { title: `Lezione 13 (2) del 5 novembre 2024`, vimeoUrl: `https://vimeo.com/1027203451`, sortOrder: 12, durationMin: 1, isFree: false },
        { title: `Lezione 14 (3) del 6 novembre 2024`, vimeoUrl: `https://vimeo.com/1027206087`, sortOrder: 13, durationMin: 44, isFree: false },
        { title: `Lezione 15 (4) del 7 novembre 2024`, vimeoUrl: `https://vimeo.com/1027222793`, sortOrder: 14, durationMin: 38, isFree: false },
        { title: `Lezione 16 (5) del 12 novembre 2025`, vimeoUrl: `https://vimeo.com/1032240526`, sortOrder: 15, durationMin: 1, isFree: false },
        { title: `Lezione 17 (6) del 14 novembre 2025`, vimeoUrl: `https://vimeo.com/1032241899`, sortOrder: 16, durationMin: 1, isFree: false },
        { title: `Lezione 18 (7) del 15 novembre 2024`, vimeoUrl: `https://vimeo.com/1032243436`, sortOrder: 17, durationMin: 1, isFree: false },
        { title: `Lezione 19 (8) del 18 novembre 2025`, vimeoUrl: `https://vimeo.com/1032244085`, sortOrder: 18, durationMin: 1, isFree: false },
        { title: `Lezione 20 (9) del 25 novembre 2024`, vimeoUrl: `https://vimeo.com/1033374635`, sortOrder: 19, durationMin: 1, isFree: false },
        { title: `Lezione del 26 (10) novembre 2024`, vimeoUrl: `https://vimeo.com/1033408746`, sortOrder: 20, durationMin: 1, isFree: false },
        { title: `Lezione del 27 novembre 2024 (1)`, vimeoUrl: `https://vimeo.com/1035123239`, sortOrder: 21, durationMin: 1, isFree: false },
        { title: `Lezione del 28 novembre 2024 (2)`, vimeoUrl: `https://vimeo.com/1035131064`, sortOrder: 22, durationMin: 1, isFree: false },
        { title: `Lezione del 29 novembre 2024 (3)`, vimeoUrl: `https://vimeo.com/1035136574`, sortOrder: 23, durationMin: 1, isFree: false },
        { title: `Lezione del 2 dicembre 2024 (3)`, vimeoUrl: `https://vimeo.com/1035160010`, sortOrder: 24, durationMin: 1, isFree: false },
        { title: `Lezione del 3 dicembre 2024`, vimeoUrl: `https://vimeo.com/1035537881`, sortOrder: 25, durationMin: 1, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ breve-marziale: 25 lezioni`)
      totalLezioni += 25
      totalCorsi++
    }
  }

  // breve-buona-novella (5 lezioni da IDCR=63)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'breve-buona-novella' } })
    if (!course) { console.warn('  ⚠ corso non trovato: breve-buona-novella') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Primo Incontro: "Dal logos all'annunciazione" - 14 dicembre 2022`, vimeoUrl: `https://vimeo.com/781267458`, sortOrder: 1, durationMin: 83, isFree: false },
        { title: `Secondo incontro: "La trasmutazione dell'acqua in vino: Le Nozze di Cana" - 21 dicembre 2022`, vimeoUrl: `https://vimeo.com/783435242`, sortOrder: 2, durationMin: 1, isFree: false },
        { title: `Terzo incontro: "La nativitÃ dai Canonici agli Apocrifi" - 28 dicembre 2022`, vimeoUrl: `https://vimeo.com/785438855`, sortOrder: 3, durationMin: 1, isFree: false },
        { title: `Quarto incontro: Giovanni Battista - dal tweet di Papa Francesco ai Padri della Chiesa - 11 gennaio 2023`, vimeoUrl: `https://vimeo.com/788547537`, sortOrder: 4, durationMin: 1, isFree: false },
        { title: `Quinto incontro: Dal Discorso della Montagna (Matteo 5, 3-12), una riflessione teologica sulle Beatitudini - 18 gennaio 2023`, vimeoUrl: `https://vimeo.com/790698948`, sortOrder: 5, durationMin: 56, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ breve-buona-novella: 5 lezioni`)
      totalLezioni += 5
      totalCorsi++
    }
  }

  // breve-padri-chiesa (4 lezioni da IDCR=67)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'breve-padri-chiesa' } })
    if (!course) { console.warn('  ⚠ corso non trovato: breve-padri-chiesa') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Incontro 1 del 1Â° febbraio 2023`, vimeoUrl: `https://vimeo.com/795032916`, sortOrder: 1, durationMin: 45, isFree: false },
        { title: `Incontro 2 - 08/02/2023`, vimeoUrl: `https://vimeo.com/797480429`, sortOrder: 2, durationMin: 1, isFree: false },
        { title: `Incontro 3 - 15 febbraio 2023`, vimeoUrl: `https://vimeo.com/799597392`, sortOrder: 3, durationMin: 54, isFree: false },
        { title: `Incontro 4 - 22/02/2023`, vimeoUrl: `https://vimeo.com/801970109`, sortOrder: 4, durationMin: 1, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ breve-padri-chiesa: 4 lezioni`)
      totalLezioni += 4
      totalCorsi++
    }
  }

  // breve-maturita-greco (6 lezioni da IDCR=235)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'breve-maturita-greco' } })
    if (!course) { console.warn('  ⚠ corso non trovato: breve-maturita-greco') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1 del 13 maggio 2024`, vimeoUrl: `https://vimeo.com/945915783?share=copy`, sortOrder: 1, durationMin: 90, isFree: false },
        { title: `Lezione 2 del 16 Maggio 2024`, vimeoUrl: `https://vimeo.com/947110743?share=copy`, sortOrder: 2, durationMin: 92, isFree: false },
        { title: `Lezione 3 del 20 maggio 2024`, vimeoUrl: `https://vimeo.com/948425475?share=copy`, sortOrder: 3, durationMin: 65, isFree: false },
        { title: `Lezione 4 del 23 maggio 2024`, vimeoUrl: `https://vimeo.com/949624111?share=copy`, sortOrder: 4, durationMin: 101, isFree: false },
        { title: `Lezione 5 del 27 maggio 2024`, vimeoUrl: `https://vimeo.com/950848693?share=copy`, sortOrder: 5, durationMin: 93, isFree: false },
        { title: `Lezione 6 del 3 giugno 2024`, vimeoUrl: `https://vimeo.com/953440006?share=copy`, sortOrder: 6, durationMin: 106, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ breve-maturita-greco: 6 lezioni`)
      totalLezioni += 6
      totalCorsi++
    }
  }

  // breve-egiziano-appro (5 lezioni da IDCR=211)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'breve-egiziano-appro' } })
    if (!course) { console.warn('  ⚠ corso non trovato: breve-egiziano-appro') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1`, vimeoUrl: `https://vimeo.com/915711595`, sortOrder: 1, durationMin: 112, isFree: false },
        { title: `Lezione 2`, vimeoUrl: `https://vimeo.com/918090448`, sortOrder: 2, durationMin: 119, isFree: false },
        { title: `Lezione 3`, vimeoUrl: `https://vimeo.com/920615307`, sortOrder: 3, durationMin: 115, isFree: false },
        { title: `Lezione 4`, vimeoUrl: `https://vimeo.com/923537269`, sortOrder: 4, durationMin: 114, isFree: false },
        { title: `Lezione 5`, vimeoUrl: `https://vimeo.com/925999010`, sortOrder: 5, durationMin: 124, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ breve-egiziano-appro: 5 lezioni`)
      totalLezioni += 5
      totalCorsi++
    }
  }

  // breve-tragedia-greci (3 lezioni da IDCR=414)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'breve-tragedia-greci' } })
    if (!course) { console.warn('  ⚠ corso non trovato: breve-tragedia-greci') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1: Il Prologo dell'Agamennone`, vimeoUrl: `https://vimeo.com/1188228682`, sortOrder: 1, durationMin: 86, isFree: false },
        { title: `Lezione 2: l'omicidio di Agamennone`, vimeoUrl: `https://vimeo.com/1192215847`, sortOrder: 2, durationMin: 87, isFree: false },
        { title: `Lezione 3: lâEdipo Re di Sofocle. Dal prologo alla veritÃ`, vimeoUrl: `https://vimeo.com/1192487904`, sortOrder: 3, durationMin: 79, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ breve-tragedia-greci: 3 lezioni`)
      totalLezioni += 3
      totalCorsi++
    }
  }

  // breve-ars-scribendi (12 lezioni da IDCR=337)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'breve-ars-scribendi' } })
    if (!course) { console.warn('  ⚠ corso non trovato: breve-ars-scribendi') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1 - 12 marzo 2025`, vimeoUrl: `https://vimeo.com/1065359984`, sortOrder: 1, durationMin: 58, isFree: false },
        { title: `Lezione 2 - 20 marzo 2025`, vimeoUrl: `https://vimeo.com/1067616730`, sortOrder: 2, durationMin: 56, isFree: false },
        { title: `Lezione 3 - 26 marzo 2025`, vimeoUrl: `https://vimeo.com/1070086694`, sortOrder: 3, durationMin: 53, isFree: false },
        { title: `Lezione 4 - 2 aprile 2025`, vimeoUrl: `https://vimeo.com/1072275347`, sortOrder: 4, durationMin: 47, isFree: false },
        { title: `Lezione 5 - 9 aprile 2025`, vimeoUrl: `https://vimeo.com/1074225616`, sortOrder: 5, durationMin: 55, isFree: false },
        { title: `Lezione 6 - 23 aprile 2025`, vimeoUrl: `https://vimeo.com/1078273214`, sortOrder: 6, durationMin: 26, isFree: false },
        { title: `Lezione 7 - 30 aprile 2025`, vimeoUrl: `https://vimeo.com/1079991355`, sortOrder: 7, durationMin: 52, isFree: false },
        { title: `Lezione 8 - 7 maggio 2025`, vimeoUrl: `https://vimeo.com/1082790198`, sortOrder: 8, durationMin: 53, isFree: false },
        { title: `Lezione 9 - 14 maggio 2025`, vimeoUrl: `https://vimeo.com/1086498574`, sortOrder: 9, durationMin: 50, isFree: false },
        { title: `Lezione 10 - 21 maggio 2025`, vimeoUrl: `https://vimeo.com/1086724575`, sortOrder: 10, durationMin: 48, isFree: false },
        { title: `Lezione 11 - 28 maggio 2025`, vimeoUrl: `https://vimeo.com/1090126314`, sortOrder: 11, durationMin: 59, isFree: false },
        { title: `Lezione 12 - 11 giugno`, vimeoUrl: `https://vimeo.com/1093496492`, sortOrder: 12, durationMin: 52, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ breve-ars-scribendi: 12 lezioni`)
      totalLezioni += 12
      totalCorsi++
    }
  }

  // breve-colloquia (18 lezioni da IDCR=377)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'breve-colloquia' } })
    if (!course) { console.warn('  ⚠ corso non trovato: breve-colloquia') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Prima lectio - LunedÃ¬ 29/09/2025`, vimeoUrl: `https://vimeo.com/1122994968`, sortOrder: 1, durationMin: 99, isFree: false },
        { title: `Secunda lectio - mercoledÃ¬ 8 ottobre 2025`, vimeoUrl: `https://vimeo.com/1125654981`, sortOrder: 2, durationMin: 110, isFree: false },
        { title: `tertia lectio - lunedÃ¬ 13 ottobre 2025`, vimeoUrl: `https://vimeo.com/1126968619`, sortOrder: 3, durationMin: 116, isFree: false },
        { title: `quarta lectio - mercoledÃ¬ 15 ottobre 2025`, vimeoUrl: `https://vimeo.com/1127645240`, sortOrder: 4, durationMin: 111, isFree: false },
        { title: `quinta lectio - lunedÃ¬ 20 ottobre 2025`, vimeoUrl: `https://vimeo.com/1128978656`, sortOrder: 5, durationMin: 106, isFree: false },
        { title: `sexta lectio - lunedÃ¬ 27 ottobre 2025`, vimeoUrl: `https://vimeo.com/1131064010`, sortOrder: 6, durationMin: 112, isFree: false },
        { title: `septima lectio - mercoledÃ¬ 5 novembre 2025`, vimeoUrl: `https://vimeo.com/1133993310`, sortOrder: 7, durationMin: 108, isFree: false },
        { title: `octava lectio - lunedÃ¬ 10 novembre 2025`, vimeoUrl: `https://vimeo.com/1135486367`, sortOrder: 8, durationMin: 108, isFree: false },
        { title: `nona lectio - lunedÃ¬ 17 novembre 2025`, vimeoUrl: `https://vimeo.com/1137813078`, sortOrder: 9, durationMin: 105, isFree: false },
        { title: `decima lectio - mercoledÃ¬ 19 novembre 2025`, vimeoUrl: `https://vimeo.com/1138667903`, sortOrder: 10, durationMin: 114, isFree: false },
        { title: `undecima lectio - lunedÃ¬ 24 novembre 2025`, vimeoUrl: `https://vimeo.com/1140295793`, sortOrder: 11, durationMin: 108, isFree: false },
        { title: `duodecima lectio - mercoledÃ¬ 26 novembre 2025`, vimeoUrl: `https://vimeo.com/1140906085`, sortOrder: 12, durationMin: 107, isFree: false },
        { title: `decima tertio lectio - lunedÃ¬ primo dicembre 2025`, vimeoUrl: `https://vimeo.com/1142197797`, sortOrder: 13, durationMin: 112, isFree: false },
        { title: `quarta decima lectio - mercoledÃ¬ 3 dicembre 2025`, vimeoUrl: `https://vimeo.com/1143209534`, sortOrder: 14, durationMin: 109, isFree: false },
        { title: `quinta decima lectio - martedÃ¬ 9 dicembre 2025`, vimeoUrl: `https://vimeo.com/1145022184`, sortOrder: 15, durationMin: 113, isFree: false },
        { title: `sexta decima lectio - lunedÃ¬ 15 dicembre 2025`, vimeoUrl: `https://vimeo.com/1146716716`, sortOrder: 16, durationMin: 101, isFree: false },
        { title: `septima decima lectio - mercoledÃ¬ 17 dicembre 2025`, vimeoUrl: `https://vimeo.com/1147446884`, sortOrder: 17, durationMin: 110, isFree: false },
        { title: `optava decima lectio - lunedÃ¬ 22 dicembre 2025`, vimeoUrl: `https://vimeo.com/1148743464`, sortOrder: 18, durationMin: 107, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ breve-colloquia: 18 lezioni`)
      totalLezioni += 18
      totalCorsi++
    }
  }

  // breve-maturita-latino (4 lezioni da IDCR=200)
  {
    const course = await prisma.course.findUnique({ where: { slug: 'breve-maturita-latino' } })
    if (!course) { console.warn('  ⚠ corso non trovato: breve-maturita-latino') }
    else {
      await prisma.lesson.deleteMany({ where: { courseId: course.id } })
      const rows = [
        { title: `Lezione 1 - 5 febbraio 2024`, vimeoUrl: `https://vimeo.com/910171195`, sortOrder: 1, durationMin: 88, isFree: false },
        { title: `Lezione 2 - 8 febbraio 2024`, vimeoUrl: `https://vimeo.com/911330189`, sortOrder: 2, durationMin: 88, isFree: false },
        { title: `Lezione 3 - 12 febbraio 2024`, vimeoUrl: `https://vimeo.com/912348959`, sortOrder: 3, durationMin: 87, isFree: false },
        { title: `Lezione 4 - 15 febbraio 2024`, vimeoUrl: `https://vimeo.com/913463978`, sortOrder: 4, durationMin: 87, isFree: false },
      ]
      for (const row of rows) {
        await prisma.lesson.create({ data: { ...row, courseId: course.id } })
      }
      console.log(`  ✓ breve-maturita-latino: 4 lezioni`)
      totalLezioni += 4
      totalCorsi++
    }
  }

  console.log(`\nFatto: ${totalCorsi} corsi, ${totalLezioni} lezioni inserite`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
