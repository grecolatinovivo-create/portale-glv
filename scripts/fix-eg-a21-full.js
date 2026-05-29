// scripts/fix-eg-a21-full.js
// Sostituisce COMPLETAMENTE le lezioni di eg-a21 (Egiziano Geroglifico A2)
// con le 22 lezioni corrette dal IDCR=89 (codice classe 8GJBRL) del dump SQL.
//
// Le 5 lezioni attualmente presenti appartengono al corso IDCR=398 (anno 2026) — sbagliato.
// Le lezioni corrette sono IDCR=89 (anno 2023): ripasso + 15 lezioni + extra.
//
// Ordine: IDL crescente (= ordine cronologico reale del corso)
//   ripasso pt1/pt2 → lez 1-15 → extra 1 pt1-4 → extra 2
//
// Eseguire con:
//   node scripts/fix-eg-a21-full.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── 22 lezioni IDCR=89 ───────────────────────────────────────────────────────
// durationMin: NULL in DB → impostato 90 come stima (durata classe tipica)
const LESSONS = [
  { latinCertId: 445, sortOrder: 1,  title: 'Lezione di ripasso — parte I',       vimeoUrl: 'https://vimeo.com/817391727', durationMin: 21  },
  { latinCertId: 446, sortOrder: 2,  title: 'Lezione di ripasso — parte II',      vimeoUrl: 'https://vimeo.com/817393896', durationMin: 74  },
  { latinCertId: 447, sortOrder: 3,  title: 'Lezione 1 corso A2',                 vimeoUrl: 'https://vimeo.com/817397170', durationMin: 106 },
  { latinCertId: 452, sortOrder: 4,  title: 'Lezione 2 corso A2',                 vimeoUrl: 'https://vimeo.com/818284407', durationMin: 116 },
  { latinCertId: 472, sortOrder: 5,  title: 'Lezione 3 corso A2',                 vimeoUrl: 'https://vimeo.com/819611946', durationMin: 114 },
  { latinCertId: 490, sortOrder: 6,  title: 'Lezione 4 corso A2',                 vimeoUrl: 'https://vimeo.com/990468829', durationMin: 112 },
  { latinCertId: 493, sortOrder: 7,  title: 'Lezione 5 corso A2',                 vimeoUrl: 'https://vimeo.com/822317101', durationMin: 121 },
  { latinCertId: 526, sortOrder: 8,  title: 'Lezione 6 corso A2',                 vimeoUrl: 'https://vimeo.com/826320437', durationMin: 107 },
  { latinCertId: 528, sortOrder: 9,  title: 'Lezione 7 corso A2',                 vimeoUrl: 'https://vimeo.com/826494918', durationMin: 118 },
  { latinCertId: 543, sortOrder: 10, title: 'Lezione 8 corso A2',                 vimeoUrl: 'https://vimeo.com/828092117', durationMin: 90  },
  { latinCertId: 550, sortOrder: 11, title: 'Lezione 9 corso A2',                 vimeoUrl: 'https://vimeo.com/828729257', durationMin: 90  },
  { latinCertId: 577, sortOrder: 12, title: 'Lezione 10 corso A2',                vimeoUrl: 'https://vimeo.com/832783164', durationMin: 90  },
  { latinCertId: 581, sortOrder: 13, title: 'Lezione 11 corso A2',                vimeoUrl: 'https://vimeo.com/830832157', durationMin: 90  },
  { latinCertId: 594, sortOrder: 14, title: 'Lezione 12 corso A2',                vimeoUrl: 'https://vimeo.com/832367644', durationMin: 90  },
  { latinCertId: 605, sortOrder: 15, title: 'Lezione 13 corso A2',                vimeoUrl: 'https://vimeo.com/835389889', durationMin: 90  },
  { latinCertId: 618, sortOrder: 16, title: 'Lezione 14 corso A2',                vimeoUrl: 'https://vimeo.com/836832742', durationMin: 90  },
  { latinCertId: 631, sortOrder: 17, title: 'Lezione 15 corso A2',                vimeoUrl: 'https://vimeo.com/838820117', durationMin: 121 },
  { latinCertId: 800, sortOrder: 18, title: 'Lezione extra 1 — parte 1',          vimeoUrl: 'https://vimeo.com/847124001', durationMin: 90  },
  { latinCertId: 801, sortOrder: 19, title: 'Lezione extra 1 — parte 2',          vimeoUrl: 'https://vimeo.com/847124765', durationMin: 90  },
  { latinCertId: 802, sortOrder: 20, title: 'Lezione extra 1 — parte 3',          vimeoUrl: 'https://vimeo.com/847125297', durationMin: 90  },
  { latinCertId: 803, sortOrder: 21, title: 'Lezione extra 1 — parte 4',          vimeoUrl: 'https://vimeo.com/847126193', durationMin: 24  },
  { latinCertId: 851, sortOrder: 22, title: 'Lezione extra 2',                    vimeoUrl: 'https://vimeo.com/849241354', durationMin: 119 },
];

// ── Materiali per IDL (classroomresources/) ──────────────────────────────────
// IDL=800,801,802 non hanno cartella → nessun materiale
const IDL_FILES = {
  445: ['Slides ripasso 1_Latin-Cert_j33v9rejn4m8idm.pdf'],
  446: ['Slides ripasso 2_Latin-Cert_52h76va5238iq2e.pdf'],
  447: ['Slides riassuntive lez 1 mod A2_Latin-Cert_hung06vjqkix2tw.pdf'],
  452: ['Dispensa lez 2 A2 (imperativo, da Ciampini)_Latin-Cert_8014yrm6d6aj342.pdf','Dispensa lez 2 A2 (imperativo, da Grandet Mathieu)_Latin-Cert_9cs25s6q04qryhy.pdf','Slides riassuntive lez 2 modulo A2 2022_Latin-Cert_lhuvkkdgwqb08di.pdf'],
  472: ['Latin-Cert_27xizlmpc240rl4.pdf','Latin-Cert_4jh850wkg9fujl1.pdf','Latin-Cert_7vehi0nfe2mbeqg.pdf'],
  490: ['Corredo della tomba del Ramesseo ( da Miniaci - The Middle Kingdom Ramesseum Papyri Tomb and its Archaeological Context)_Latin-Cert_0go9ktg9ygqvzi5.pdf','Dispensa lez 4 e 5 mod 2A (sDm.f, particolarità sDm.f)_Latin-Cert_vxz812zkiuk4pih.pdf','Slides riassuntive lezione 4_Latin-Cert_qvauc34njlbbuom.pdf'],
  493: ['Dispensa lez 5 mod A2 (participio)_Latin-Cert_4y3q5ccqgkquwrg.pdf','Dispensa lezione 5 mod 2A (participi, tabella riepilogativa, da Grandet Mathieu)_Latin-Cert_r9s9cyln9r97xgm.pdf','Slides riassuntive lezione 5 A2_Latin-Cert_2wjixfqubcjfwt3.pdf'],
  526: ['Slides riassuntive lezione 6 A2_Latin-Cert_iql2hnu902yhhyr.pdf'],
  528: ['Dispensa lez 7 A2 (particolarità sDm.f, passivo, sDm.tw.f)_Latin-Cert_b2vftdq9x8d1m3i.pdf','Slides riassuntive lezione 7 A2 + esercizio_Latin-Cert_jvbc6eq1pov0ye9.pdf','preposizioni e particelle_Latin-Cert_ckidoyhxmhue8m9.pdf'],
  543: ['Dispensa lez 8 (imperativo, negazione imperativo e sDm.f prospettiva)_Latin-Cert_hgi931xl79wi9uv.pdf','Dispensa lezione 8(imperativo negativo)_Latin-Cert_90mjom9psfui3j1.pdf','Slides riassuntive lezione 8 A2_Latin-Cert_p1mpjoux2ow5hxi.pdf'],
  550: ['Dispensa lez 9 (ausiliare aHa)_Latin-Cert_gcxrovicmjkxbuf.pdf','Slides riassuntive lezione 9 A2_Latin-Cert_517chtmg3m1e9jl.pdf'],
  577: ['Dispensa lez 10 A2 (frase relativa o attributiva)_Latin-Cert_0dx7stfhfbhxdu2.pdf','Dispensa lezione 10 A2 - aggettivo, gradi dell\'aggettivo_Latin-Cert_lxt0ja2152m1zlc.pdf','Slides riassuntive lezione 10 A2_Latin-Cert_r3fuh1eq0zbi4q0.pdf'],
  581: ['Dispensa lez 11 A2 (frazioni)_Latin-Cert_91yc9q4apyo0w66.pdf','Dispensa lez 11 A2 (particelle relative, interrogativi)_Latin-Cert_oxdzjldxc5b7iin.pdf','Esercizio extra lezione 11 A2_Latin-Cert_ao5vq93f2mdeu3u.pdf','Slides riassuntive lezione 11 A2_Latin-Cert_v2d49jac6dszgqh.pdf'],
  594: ['Slides riassuntive lezione 12 A2_Latin-Cert_1ewnwbeopb2atq4.pdf','Verbi di movimento_Latin-Cert_tqxftq7mg7wrwfi.pdf'],
  605: ['Dispensa lezione 13 A2 (forme ampliate - sDm.in.f)_Latin-Cert_tvpr0l1zrrpp6rk.pdf','Dispensa lezione 13 corso A2 (sDm.ty.fy, appello ai viventi)_Latin-Cert_6da9be0qxl63a21.pdf','Dispensa lezione 13 corso A2 (sDm.ty.fy, da Ciampini)_Latin-Cert_87xo35tnomw2adw.pdf','Slides riassuntive lezione 13 A2_Latin-Cert_9nppwqhtmgzriv4.pdf'],
  618: ['Slides riassuntive lezione 14 A2_Latin-Cert_hedykonx8tcden8.pdf'],
  631: ['Donadoni -  Appunti di grammatica egiziana_Latin-Cert_jkfkhy11d4hdt3x.pdf','Slides riassuntive lezione 15 A2_Latin-Cert_99xy54voakrvswl.pdf'],
  803: ['Karary - Taxation - UCLA Encyclopaedia_Latin-Cert_hg4fxsyow7invvq.pdf','Le Tasse nell\'Antico Egitto_Latin-Cert_jxcq36vhg96ugky.pdf'],
  851: ['Lezione extra 2 - papirologia_Latin-Cert_vf8lr91rd4jxzhy.pdf','Olga - testi delle piramidi_Latin-Cert_08yqq0ji6a5fx4y.pdf','Rosati - Egitto Medio Regno (2006)_Latin-Cert_uy6cl3vxu5drspf.pdf','Sara Cascione - Un pantomimo di età imperiale e la sua messa in scena_Latin-Cert_qt3549h1rozn3kp.pdf'],
};

function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['m4a','mp3','wav','ogg'].includes(ext)) return 'audio';
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) return 'image';
  return 'other';
}

function cleanTitle(filename) {
  return filename.replace(/_Latin-Cert_[a-z0-9]+(\.[a-z0-9]+)?$/i, '').replace(/_/g, ' ').trim();
}

async function main() {
  console.log('\n🔧 Fix eg-a21 — sostituzione completa lezioni (IDCR=89, codice 8GJBRL)\n');

  const course = await prisma.course.findUnique({
    where: { slug: 'eg-a21' },
    select: { id: true, title: true },
  });
  if (!course) { console.error('❌ Corso eg-a21 non trovato'); process.exit(1); }
  console.log(`Corso: "${course.title}"\n`);

  // 1. Cancella tutte le lezioni esistenti (cascade: LessonResource + LessonProgress)
  const deleted = await prisma.lesson.deleteMany({ where: { courseId: course.id } });
  console.log(`🗑️  Cancellate ${deleted.count} lezioni errate (IDCR=398)\n`);

  // 2. Crea le 22 lezioni corrette
  const createdLessons = [];
  for (const l of LESSONS) {
    // Controlla che il latinCertId non sia già usato altrove
    const conflict = await prisma.lesson.findUnique({ where: { latinCertId: l.latinCertId } });
    const lesson = await prisma.lesson.create({
      data: {
        courseId:    course.id,
        title:       l.title,
        durationMin: l.durationMin,
        isFree:      false,
        sortOrder:   l.sortOrder,
        vimeoUrl:    l.vimeoUrl,
        latinCertId: conflict ? undefined : l.latinCertId,
      },
    });
    createdLessons.push({ ...l, neonId: lesson.id, conflicted: !!conflict });
    const warn = conflict ? ' ⚠️ (latinCertId già usato, omesso)' : '';
    console.log(`  ✅ [${l.sortOrder}] IDL=${l.latinCertId} "${l.title}"${warn}`);
  }

  // 3. Aggancia i materiali
  console.log('\n📎 Collegamento materiali...\n');
  let totalResources = 0;

  for (const l of createdLessons) {
    const files = IDL_FILES[l.latinCertId];
    if (!files || files.length === 0) continue;

    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      await prisma.lessonResource.create({
        data: {
          lessonId:  l.neonId,
          title:     cleanTitle(filename) || filename,
          filename,
          blobUrl:   `https://www.latin-cert.org/classroomresources/${l.latinCertId}/${encodeURIComponent(filename)}`,
          fileType:  getFileType(filename),
          sortOrder: i,
        },
      });
      totalResources++;
    }
    console.log(`  ✅ IDL=${l.latinCertId} → ${files.length} file`);
  }

  // 4. Riepilogo finale
  const finalCount = await prisma.lesson.count({ where: { courseId: course.id } });
  console.log(`\n✔ Completato:`);
  console.log(`  Lezioni in DB per eg-a21: ${finalCount} (atteso 22)`);
  console.log(`  Materiali creati: ${totalResources}\n`);
}

main()
  .catch(err => { console.error('\n❌ Errore:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
