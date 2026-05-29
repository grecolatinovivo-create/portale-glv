// scripts/link-lesson-resources-new-courses.js
// Collega i materiali (PDF, audio, immagini) alle lezioni dei 12 nuovi corsi brevi.
// Replica esattamente il metodo usato per gli altri 56 corsi.
//
// Logica:
//   1. Per ogni IDL che ha file in classroomresources/
//   2. Trova la lezione Neon con latinCertId = IDL
//   3. Cancella eventuali LessonResource esistenti (idempotente)
//   4. Crea LessonResource con blobUrl = https://www.latin-cert.org/classroomresources/{IDL}/{filename}
//
// Eseguire con:
//   node scripts/link-lesson-resources-new-courses.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// DATI: IDL → lista file (estratti da classroomresources/ locale)
// ─────────────────────────────────────────────────────────────────────────────
const IDL_FILES = {
  665:  ['De insularum incommodis_Latin-Cert_5wqw1r5r6y5nbv1.m4a','Paoli - Ciceronis filius_Latin-Cert_irvugxpy2kfha4j.pdf'],
  668:  ['Lys. 1, 15-16 (Lettura del passo)_Latin-Cert_ugkvdtztkmksvrq.m4a','Lys. 1, 15-16_Latin-Cert_zk8kkmmo36oy1kk.pdf','Mantenimento Greco B2 - 1_Latin-Cert_6rd3gy1am0jphgo.pdf'],
  679:  ['Alexandros. To Hellenikon Paidion (Diaz Avila) (trascinato)_Latin-Cert_sdcgi7jp2pcimq6.pdf'],
  680:  ['Alexandros. To Hellenikon Paidion (Diaz Avila) (trascinato)_Latin-Cert_aosqipwhh8uddoa.pdf'],
  735:  ['Lezione 2 - Mantenimento Greco B2 (lettura)_Latin-Cert_k4xsmf9x1opsdgf.m4a','Lezione 2 - Mantenimento Greco B2 (dispensa)_Latin-Cert_ljeumbbb8lak9cc.pdf','Lezione 2 - Mantenimento Greco B2 (testo)_Latin-Cert_gsbi98ch8wbyuyx.pdf'],
  746:  ['Alexandros. To Hellenikon Paidion (Diaz Avila) 2_Latin-Cert_jal6o7jaalkxjmq.pdf'],
  747:  ['Alexandros. To Hellenikon Paidion (Diaz Avila) 2_Latin-Cert_9f11umk334t8p6e.pdf'],
  775:  ['De Publio Cornelio Lentulo adulescente_Latin-Cert_tav51jq8cp0c5sg.m4a','Feles_emunctae_naris_Latin-Cert_ufk1epivptfohg7.m4a','feles_emunctae_naris_Latin-Cert_ropxe0h5pciebb3.pdf'],
  776:  ['Lezione 3 - Mantenimento Greco B2 (audio)_Latin-Cert_fue2cpg42o1smhh.m4a','Lezione 3 - Mantenimento Greco B2 (testo)_Latin-Cert_kj1jrr6zrstoav7.pdf','Lezione 3 - Μantenimento Greco B2 (lavagna)_Latin-Cert_iwr069ph2dfjhhs.pdf'],
  783:  ['οι αριθμοι_Latin-Cert_8p0tkyt3leu7glw.pdf'],
  787:  ['οι αριθμοι_Latin-Cert_wacpg0bmdwgcknn.pdf'],
  829:  ['de_itinere_Latin-Cert_1jqt6twsui6jblc.pdf','De itinere_Latin-Cert_prchevpmhydpwex.m4a'],
  841:  ['Alexandros. To Hellenikon Paidion (Diaz Avila) 4_Latin-Cert_8evjcmm9jat0f8w.pdf'],
  842:  ['Alexandros. To Hellenikon Paidion (Diaz Avila) 4_Latin-Cert_ru7wd6f4awu9ygu.pdf'],
  844:  ['Lezione 4 - Mantenimento Greco B2 (testo)_Latin-Cert_viv995p6i49gm33.pdf','Lezione 4 - Mantenimento Greco B2 (audio)_Latin-Cert_obm79gqkki04u64.m4a','Lezione 4 - Mantenimento Greco B2 (lavagna)_Latin-Cert_9gj8ckrbzpjbiax.pdf'],
  857:  ['De belli Macedonici initio_Latin-Cert_o9hdlilk3ykjz32.m4a','de_belli_macedonici_initio_Latin-Cert_nop7gynn9t1n2wc.pdf'],
  859:  ['Lezione 5 - Mantenimento Greco B2 (lavagna).pdf_Latin-Cert_k8f5ccud3i2enuj.pdf','Lezione 5 - Mantenimento Greco B2 (testo)_Latin-Cert_i75317d49jrqr1h.pdf'],
  860:  ['5_Latin-Cert_ypy7lnt0ing3pd9.pdf','Audio5_Latin-Cert_5d4d6ms8hz5dtq6.m4a'],
  861:  ['5_Latin-Cert_dg0tfa74cxhj1fb.pdf','Audio5_Latin-Cert_zezhx6o1t67mnui.m4a'],
  873:  ['Lezione 6 - Mantenimento Greco B2 (lavagna)_Latin-Cert_cu4ex3wbmd4g5z8.pdf','Lezione 6 - Mantenimento Greco B2 (testo)_Latin-Cert_170hrxpschh5pbb.pdf','Lezione 6 - Mantenimento Greco B2_Latin-Cert_leo3cm49zr71lux.m4a'],
  874:  ['eutropius_Latin-Cert_q4gmfdj42q6isle.pdf','Eutropius_Latin-Cert_phv1o5y9lgxo1ue.m4a'],
  881:  ['6.1_Latin-Cert_2vz64g1i58hchla.pdf','6.audio_Latin-Cert_wozr8qjm87dcgy5.m4a'],
  882:  ['6.audio_Latin-Cert_toqtql787weecow.m4a','6.1_Latin-Cert_g7a66jejkyqao2w.pdf'],
  887:  ['Lez. 7 - Mantenimento Greco B2 (testo)_Latin-Cert_d87fcx3v0y1f87h.pdf','Lezione 7 - Mantenimento Greco B2 (lavagna)_Latin-Cert_scw4vokv5fs91zx.pdf'],
  898:  ['M7gr_audio_Latin-Cert_tryuuip32gxgpvu.m4a','7.1_Latin-Cert_y9e3761d5xc4g4u.pdf'],
  899:  ['M7gr_audio_Latin-Cert_txvhlkl3ipxxgss.m4a','7.1_Latin-Cert_uq9w0dl6p59ycnu.pdf'],
  907:  ['Lezione 8 - Mantenimento Greco A1 (audio)_Latin-Cert_kgc0x707f76kwu3.m4a','Lezione 8 - Mantenimento Greco A1 (lavagna)_Latin-Cert_leab2dvy3jio812.pdf','Lezione 8 - Mantenimento Greco A1 (audio)_Latin-Cert_9ytc8v98dzx1toj.m4a','Lezione 8 (testo) A1_Latin-Cert_31l0mlijdedff0z.pdf'],
  908:  ['Lezione 8 (testo) A2_Latin-Cert_tx9819hb603nosf.pdf','Lezione 8 - Mantenimento Greco A2 (lavagna)_Latin-Cert_n80hqpgyea7xg0h.pdf','Lezione 8 - Mantenimento Greco A2 (audio)_Latin-Cert_to0szpa5440246s.m4a'],
  912:  ['Lezione 8 - Mantenimento Greco B2 (audio)_Latin-Cert_2k4i6olkhnr6aj5.m4a','Lezione 8 - Mantenimento Greco B2 (testo)_Latin-Cert_i00cr1dsks5h9vb.pdf','Lezione 8 - Mantenimento Greco B2 (lavagna)_Latin-Cert_aqtmgk0q6ehlxwi.pdf'],
  934:  ['Lezione 9 (testo) A1_Latin-Cert_1wic5p4nne6ezca.pdf','Lezione 9 - Mantenimento A1 (audio)_Latin-Cert_t4unua0fm4ftorx.m4a','Lezione 9 - Mantenimento A1 (lavagna)_Latin-Cert_fe6dto9tgqssumt.pdf'],
  935:  ['Lezione 9 (testo) A2_Latin-Cert_nuwo3pjpbh78hhp.pdf','Lezione 9 - Mantenimento A2 (lavagna)_Latin-Cert_7c23n62yc7jpgut.pdf','Lezione 9 - Mantenimento Greco A2_Latin-Cert_kowgoczr93kw96c.m4a'],
  936:  ['Lezione 9 - Mantenimento Greco B2 (audio)_Latin-Cert_hooeez8c4va74dp.m4a','Lezione 9 - Mantenimento Greco B2 (lavagna)_Latin-Cert_pjimrpmzwl1sfv2.pdf','Lezione 9 - Mantenimento Greco B2 (testo)_Latin-Cert_1m2ch44jtka26r1.pdf'],
  952:  ['biduum2_Latin-Cert_ig8mjihsi3bd76d.pdf','BPF2_Latin-Cert_krvt5nah2aci7ue.m4a'],
  955:  ['Lezione 10 - Mantenimento Lingistico Greco B2 (lavagna)_Latin-Cert_pcuk1c6oq0zxd0t.pdf','Lezione 10 - Mantenimento Greco B2 (testo)_Latin-Cert_q3s364engka7c1g.pdf'],
  957:  ['Lezione 10 - Mantenimento Greco A2 (testo)_Latin-Cert_idtl3mapsp9oqb7.pdf','Lezione 10 - Mantenimento Linguistico Greco A1 (lavagna)_Latin-Cert_ig8zxskcvo74c02.pdf'],
  958:  ['Lezione 10 - Mantenimento Linguistico Greco A2 (lavagna)_Latin-Cert_iwyd7iwvrkxrm92.pdf','Lezione 10 - Mantenimento Greco A2 (testo)_Latin-Cert_sty9cp3r4ojsi80.pdf'],
  1006: ['הַעֲלִיָה לְאֶרֶץ יִשְׂרָאֵל_Latin-Cert_xtmhoco4s0ihksf.pdf'],
  1088: ['Allen_Pyramid_Texts_intro_Latin-Cert_p9f26f0pw0h1ai3.pdf','Club_di_Lettu-Ra_PT_1_Latin-Cert_28ej6m87weipx3u.pdf','Colonna_Testi_delle_Piramidi_Latin-Cert_g159q9x04inw85f.pdf','Cronologia_Egitto_Latin-Cert_11ybm85loet7u6z.png'],
  1120: ['Club_di_Lettu-Ra_PT_2_Latin-Cert_pd30wxsmxoimiiy.pdf'],
  1197: ['Club_di_Lettu-Ra_PT_3_Latin-Cert_f4p8rdnlfhnsdo0.pdf','Lexicon_Unis_Pyramid_Allen_Latin-Cert_jojqo4ixz8zoffg.pdf'],
  1232: ['Club_di_Lettu-Ra_PT_4_Latin-Cert_8ar65ppjizvw1va.pdf'],
  1268: ['Club_di_Lettu-Ra_PT_5_Latin-Cert_kc1il6bysauw3nl.pdf'],
  1301: ['Club_di_Lettu-Ra_PT_6_Latin-Cert_amkxz8aeyh4emra.pdf'],
  1340: ['Club_di_Lettu-Ra_PT_7_Latin-Cert_l03n7mr5f0k2zlp.pdf'],
  1368: ['Club_di_Lettu-Ra_PT_8_Latin-Cert_vc4zct6kau6ngpx.pdf','Transliteration_Leiden_Latin-Cert_09e9vhg0k8q82of.jpg'],
  1387: ['Club_di_Lettu-Ra_PT_9_Latin-Cert_1lhi88mz3wuazyu.pdf'],
  1951: ['5_Latin-Cert_ypy7lnt0ing3pd9_Latin-Cert_8uo7kj.pdf','7.1_Latin-Cert_y9e3761d5xc4g4u_Latin-Cert_3ipdmn.pdf'],
  2028: ['Dispensa - Il participio attivo (da Grandet-Mathieu)_Latin-Cert_ns1itb.pdf','Dispensa -Il participio_Latin-Cert_dr82rc.pdf','Sinuhe parte II - slides riassuntive lez 4_Latin-Cert_r1dgdo.pdf'],
  2040: ['Alexandros. To Hellenikon Paidion (Diaz Avila) (trascinato)_Latin-Cert_ox7czx.pdf','Mantenimento 3_Latin-Cert_qz4a20.pdf'],
  2056: ['Sinuhe parte II - slides riassuntive lez 5_Latin-Cert_4adag9.pdf'],
  2059: ['alfabeto_Latin-Cert_pv0lc5.pdf'],
  2063: ['Testo 1 e 2_Latin-Cert_ltno3l.pdf','Letture 1 e 2_Latin-Cert_7wungc.m4a'],
  2087: ['Dispensa frase relativa o attributiva_Latin-Cert_jx10kr.pdf','Sinuhe parte II - slides riassuntive lez 6_Latin-Cert_wv54l2.pdf','Dispensa infinito_Latin-Cert_ttq5af.pdf'],
  2104: ['LEZIONE 4 - 17_06_Latin-Cert_htn5ol.pdf'],
  2142: ['Reeves - Tutankhamuns_Mask_Reconsidered_2015_Latin-Cert_yztp82.pdf','Sinuhe parte II - slides riassuntive lez 7_Latin-Cert_vqonv4.pdf','Reeves - Aspect of reuse in the tomb of Tutankhamun (Nile Magazine 2023)(1)_Latin-Cert_pv57a4.pdf'],
  2154: ['Sinuhe parte II - slides riassuntive lez 8_Latin-Cert_0b9noo.pdf','Dispensa forme ampliate - sDmt.f (da Ciampini)_Latin-Cert_97as3j.pdf'],
  2686: ['Egitto_1.pdf','Cronologia Egitto.png','Mappa_Egitto.png','Piante_Alto&Basso_Egitto.pdf'],
  2775: ['Egitto_2.pdf'],
  3712: ['primus textus.pdf'],
  3734: ['primus textus.pdf','secundus textus (1).pdf'],
  3743: ['tertius textus (1).pdf','secundus textus (1).pdf'],
  3750: ['quartus textus.pdf','tertius textus (1).pdf'],
  3763: ['quartus textus.pdf','quintus textus (1).pdf'],
  3811: ['septimus textus.pdf'],
  3823: ['Copy of octavus textus.pdf'],
  3844: ['Copy of nonus textus.pdf'],
  3852: ['LIU GUOPENG NUOVO 5  LEZIONE 7  19-11-2025 PDF.pdf'],
  3865: ['ADELE DESIDERI INIZIO NUOVO LEZIONE 4  24-11-2025 PDF.pdf'],
  3876: ['Copy of undecimus textus.pdf'],
  3889: ['Copy of duodecimus textus.pdf'],
  3894: ['Copy of decimus tertius textus.pdf'],
  3906: ['Copy of decimus quartus textus.pdf'],
  3925: ['Copy of decimus quintus textus.pdf'],
  3928: ['Copy of decimus sextus textus.pdf'],
  3938: ['Copy of decimus septimus textus.pdf'],
};

// Ricava il fileType dall'estensione
function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext))             return 'pdf';
  if (['m4a','mp3','wav','ogg'].includes(ext)) return 'audio';
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) return 'image';
  return 'other';
}

// Ricava un titolo leggibile dal nome file (rimuove hash Latin-Cert e underscore)
function cleanTitle(filename) {
  return filename
    .replace(/_Latin-Cert_[a-z0-9]+(\.[a-z0-9]+)?$/i, '') // rimuove hash finale
    .replace(/_/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n📎 Collegamento materiali alle lezioni dei 12 nuovi corsi brevi...\n');

  const idls = Object.keys(IDL_FILES).map(Number);
  let totalCreated = 0;
  let skipped = 0;

  for (const idl of idls) {
    // Trova la lezione con questo latinCertId
    const lesson = await prisma.lesson.findUnique({
      where: { latinCertId: idl },
      select: { id: true, title: true, courseId: true },
    });

    if (!lesson) {
      console.log(`  ⚠️  IDL=${idl} — lezione non trovata in Neon (latinCertId non presente)`);
      skipped++;
      continue;
    }

    const files = IDL_FILES[idl];

    // Cancella eventuali LessonResource precedenti (idempotente)
    await prisma.lessonResource.deleteMany({ where: { lessonId: lesson.id } });

    // Crea un LessonResource per ogni file
    let created = 0;
    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const blobUrl  = `https://www.latin-cert.org/classroomresources/${idl}/${encodeURIComponent(filename)}`;
      const fileType = getFileType(filename);
      const title    = cleanTitle(filename) || filename;

      await prisma.lessonResource.create({
        data: {
          lessonId:  lesson.id,
          title,
          filename,
          blobUrl,
          fileType,
          sortOrder: i,
        },
      });
      created++;
    }

    totalCreated += created;
    console.log(`  ✅  IDL=${String(idl).padEnd(4)} → ${created} file  (lezione: "${lesson.title.substring(0, 50)}")`);
  }

  console.log(`\n✔ Completato: ${totalCreated} LessonResource creati su ${idls.length - skipped} lezioni.`);
  if (skipped > 0) console.log(`  ⚠️  ${skipped} IDL saltati (lezione non trovata in Neon).`);
  console.log('');
}

main()
  .catch(err => { console.error('\n❌ Errore:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
