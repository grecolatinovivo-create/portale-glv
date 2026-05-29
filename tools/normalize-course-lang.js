// tools/normalize-course-lang.js
// Riallinea la "lingua" (= gruppo mostrato in dashboard) al tier di ogni corso.
//
// Perché serve: un bug nel salvataggio admin lasciava la lingua invariata quando
// si cambiava il tier (il select lingua non aveva le opzioni "Corsi Brevi"/
// "Didattica", quindi veniva inviato lang=undefined). Risultato: corsi con
// tierRequired aggiornato ma lang vecchia → in dashboard la card manteneva
// colore ed etichette del gruppo precedente.
//
// Mappatura tier → gruppo (identica a onTierChange in admin.html):
//   cultura   → "Corsi Brevi"
//   accademia → "Didattica"
//   linguae   → lingua reale (Latino / Greco Antico / Egiziano Geroglifico /
//               Ebraico Biblico) — lasciata invariata se già valida.
//
// Uso (con DATABASE_URL impostata nell'ambiente):
//   node tools/normalize-course-lang.js          # mostra cosa cambierebbe (dry-run)
//   node tools/normalize-course-lang.js --apply   # applica le modifiche

// Carica DATABASE_URL da .env / .env.local (loader minimale, nessuna dipendenza).
// Uno script Node "nudo" non legge .env in automatico (lo fa solo la CLI Prisma).
const fs = require('fs');
const path = require('path');
for (const f of ['.env', '.env.local']) {
  const p = path.join(__dirname, '..', f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

const { prisma } = require('../lib/prisma');

const LINGUAE_LANGS = ['Latino', 'Greco Antico', 'Egiziano Geroglifico', 'Ebraico Biblico'];

// Restituisce la lingua attesa per un corso dato il suo tier (null = non cambiare).
function expectedLang(tier, currentLang) {
  if (tier === 'cultura') return 'Corsi Brevi';
  if (tier === 'accademia') return 'Didattica';
  if (tier === 'linguae') {
    // Mantiene la lingua reale se già valida; altrimenti segnala (non indovina).
    return LINGUAE_LANGS.includes(currentLang) ? currentLang : null;
  }
  return null; // tier null/sconosciuto → non tocca
}

async function main() {
  const apply = process.argv.includes('--apply');
  const courses = await prisma.course.findMany({
    select: { id: true, slug: true, lang: true, tierRequired: true },
  });

  const mismatches = [];
  const linguaeNeedsAttention = [];

  for (const c of courses) {
    const want = expectedLang(c.tierRequired, c.lang);
    if (c.tierRequired === 'linguae' && want === null) {
      linguaeNeedsAttention.push(c);
      continue;
    }
    if (want && want !== c.lang) {
      mismatches.push({ ...c, newLang: want });
    }
  }

  if (mismatches.length === 0) {
    console.log('✓ Nessun disallineamento lingua↔tier trovato.');
  } else {
    console.log(`Trovati ${mismatches.length} corsi disallineati:`);
    for (const m of mismatches) {
      console.log(`  • ${m.slug}: tier=${m.tierRequired}  lang "${m.lang}" → "${m.newLang}"`);
    }
    if (apply) {
      for (const m of mismatches) {
        await prisma.course.update({ where: { id: m.id }, data: { lang: m.newLang } });
      }
      console.log(`\n✓ Applicate ${mismatches.length} correzioni.`);
    } else {
      console.log('\n(dry-run) Riesegui con --apply per scrivere le modifiche.');
    }
  }

  if (linguaeNeedsAttention.length > 0) {
    console.log(`\n⚠ ${linguaeNeedsAttention.length} corsi linguae con lingua non valida — vanno corretti a mano in admin:`);
    for (const c of linguaeNeedsAttention) {
      console.log(`  • ${c.slug}: lang="${c.lang}" (atteso una di: ${LINGUAE_LANGS.join(', ')})`);
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
