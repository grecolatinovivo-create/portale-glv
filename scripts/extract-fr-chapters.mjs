/**
 * scripts/extract-fr-chapters.mjs
 *
 * Estrae il testo di Familia Romana (LLPSI) capitolo per capitolo
 * usando Gemini Vision, preservando le macron (ā, ē, ī, ō, ū).
 *
 * Requisiti:
 *   npm install pdf-lib @pdf-lib/fontkit canvas pdfjs-dist
 *   oppure: pip install pymupdf  (usa il worker Python sottostante)
 *
 * Uso:
 *   node --env-file=.env.local scripts/extract-fr-chapters.mjs --cap 1
 *   node --env-file=.env.local scripts/extract-fr-chapters.mjs --cap 1 --cap 5
 *   node --env-file=.env.local scripts/extract-fr-chapters.mjs --all
 *
 * Output:
 *   bib/output/cap_01_textFragment.txt   (testo narrativo con macron)
 *   bib/output/cap_01_vocab.json         (lessico estratto da Gemini)
 */

import { execSync, execFileSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const PDF_PATH  = join(ROOT, 'bib', 'Familia Romana.pdf');
const OUT_DIR   = join(ROOT, 'bib', 'output');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

/* ══════════════════════════════════════════════════════════════════
   MAPPA CAPITOLI → PAGINE PDF
   (indice 0-based; verificato campionando il PDF con PyMuPDF)

   Struttura: { cap: numero_romano, pages: [da, a] }  (inclusi, 0-based)
   Le pagine includono il testo narrativo + grammatica + Pensvm.
   Gemini estrarrà SOLO il testo narrativo principale.
   ══════════════════════════════════════════════════════════════════ */
const CHAPTER_MAP = {
   1: { title: 'CAPITVLVM PRIMVM',         pages: [4,  11]  },
   2: { title: 'CAPITVLVM SECVNDVM',       pages: [12, 18]  },
   3: { title: 'CAPITVLVM TERTIVM',        pages: [19, 26]  },
   4: { title: 'CAPITVLVM QVARTVM',        pages: [27, 34]  },
   5: { title: 'CAPITVLVM QVINTVM',        pages: [35, 41]  },
   6: { title: 'CAPITVLVM SEXTVM',         pages: [42, 49]  },
   7: { title: 'CAPITVLVM SEPTIMVM',       pages: [50, 57]  },
   8: { title: 'CAPITVLVM OCTAVVM',        pages: [58, 65]  },
   9: { title: 'CAPITVLVM NONVM',          pages: [66, 73]  },
  10: { title: 'CAPITVLVM DECIMVM',        pages: [74, 82]  },
  11: { title: 'CAPITVLVM VNDECIMVM',      pages: [83, 91]  },
  12: { title: 'CAPITVLVM DVODECIMVM',     pages: [92, 100] },
  13: { title: 'CAPITVLVM TERTIVM DECIMVM',pages: [101,109] },
  14: { title: 'CAPITVLVM QVARTVM DECIMVM',pages: [110,118] },
  15: { title: 'CAPITVLVM QVINTVM DECIMVM',pages: [119,127] },
  16: { title: 'CAPITVLVM SEXTVM DECIMVM', pages: [128,136] },
  17: { title: 'CAPITVLVM SEPTIMVM DECIMVM',pages:[137,145] },
  18: { title: 'CAPITVLVM DVODEVICESIMVM', pages: [146,154] },
  19: { title: 'CAPITVLVM VNDEVOICESIMVM', pages: [155,163] },
  20: { title: 'CAPITVLVM VICENSIMVM',     pages: [164,172] },
  21: { title: 'CAPITVLVM VICENSIMVM PRIMVM', pages: [173,181] },
  22: { title: 'CAPITVLVM VICENSIMVM SECVNDVM', pages: [182,190] },
  23: { title: 'CAPITVLVM VICENSIMVM TERTIVM',  pages: [191,199] },
  24: { title: 'CAPITVLVM VICENSIMVM QVARTVM',  pages: [200,208] },
  25: { title: 'CAPITVLVM VICENSIMVM QVINTVM',  pages: [209,217] },
  26: { title: 'CAPITVLVM VICENSIMVM SEXTVM',   pages: [218,226] },
  27: { title: 'CAPITVLVM VICENSIMVM SEPTIMVM', pages: [227,235] },
  28: { title: 'CAPITVLVM DVODETRICESIMVM',     pages: [236,244] },
  29: { title: 'CAPITVLVM VNDETRICESIMVM',      pages: [245,253] },
  30: { title: 'CAPITVLVM TRICESIMVM',          pages: [254,262] },
  31: { title: 'CAPITVLVM TRICESIMVM PRIMVM',   pages: [263,271] },
  32: { title: 'CAPITVLVM TRICESIMVM SECVNDVM', pages: [272,280] },
  33: { title: 'CAPITVLVM TRICESIMVM TERTIVM',  pages: [281,289] },
  34: { title: 'CAPITVLVM TRICESIMVM QVARTVM',  pages: [290,298] },
  35: { title: 'CAPITVLVM TRICESIMVM QVINTVM',  pages: [299,310] },
};

const GEMINI_MODEL    = 'gemini-2.0-flash';
const GEMINI_API_KEY  = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

if (!GEMINI_API_KEY) {
  console.error('❌  GEMINI_API_KEY non trovata. Esegui con --env-file=.env.local');
  process.exit(1);
}

/* ── CLI args ─────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const doAll = args.includes('--all');
const caps  = doAll
  ? Object.keys(CHAPTER_MAP).map(Number)
  : args.flatMap((a, i) => a === '--cap' ? [parseInt(args[i+1])] : []).filter(Boolean);

if (!caps.length && !doAll) {
  console.log('Uso: node scripts/extract-fr-chapters.mjs --cap 1 [--cap 2 ...] | --all');
  process.exit(0);
}

/* ═══════════════════════════════════════════════════════════════
   ESTRAZIONE PAGINE → PNG (via Python/PyMuPDF in subprocess)
   ═══════════════════════════════════════════════════════════════ */
function extractPageAsPng(pageIndex, outPath) {
  const py = `
import fitz, sys
from PIL import Image
doc = fitz.open(sys.argv[1])
page = doc[int(sys.argv[2])]
imgs = page.get_images()
if not imgs:
    print('NO_IMAGE')
    sys.exit(0)
pix = fitz.Pixmap(doc, imgs[0][0])
img = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
# Ruota se landscape (w > h)
if img.width > img.height:
    img = img.rotate(-90, expand=True)
# Ridimensiona a max 1600px di larghezza per non eccedere i limiti Gemini
if img.width > 1600:
    ratio = 1600 / img.width
    img = img.resize((1600, int(img.height * ratio)))
img.save(sys.argv[3])
print(f'{img.width}x{img.height}')
`;
  const result = execFileSync('python3', ['-c', py, PDF_PATH, String(pageIndex), outPath], {
    encoding: 'utf8', timeout: 30000
  }).trim();
  return result;
}

/* ═══════════════════════════════════════════════════════════════
   GEMINI VISION — trascrivi una pagina preservando le macron
   ═══════════════════════════════════════════════════════════════ */
async function transcribePage(imgPath, capNum, capTitle) {
  const imgBytes  = readFileSync(imgPath);
  const imgBase64 = imgBytes.toString('base64');

  const prompt = `Sei un filologo classico che trascrive pagine di "Lingua Latina per se Illustrata — Familia Romana" di Hans Ørberg (edizione Accademia Vivarium Novum).

COMPITO: trascrivi SOLO il testo narrativo principale della pagina (la colonna centrale), preservando con assoluta precisione tutte le macron (ā, ē, ī, ō, ū, Ā, Ē, Ī, Ō, Ū).

CAPITOLO: ${capNum} — ${capTitle}

REGOLE OBBLIGATORIE:
1. Mantieni OGNI macron esattamente come stampata. Se la barra sopra la vocale è visibile, trascrivila con la lettera Unicode corrispondente (ā non a, ē non e, ecc.)
2. NON includere: intestazioni di capitolo (es. "CAP. II"), numeri di pagina, glosse marginali (le note sui lati), sezioni "GRAMMATICA LATINA", esercizi "PĒNSUM A/B/C", intestazioni "LITTERAE ET NVMERI"
3. Mantieni i numeri di riga presenti nel testo (es. "5", "10", "15"…) come appaiono nell'originale — sono parte del testo
4. Separa i paragrafi con una riga vuota
5. Mantieni le virgolette ('parola') per i termini citati nel testo
6. Se una parola è tagliata a fine colonna con trattino, riuniscila alla riga successiva senza trattino
7. Se la pagina è una pagina di esercizi o grammatica PURA (nessun testo narrativo), rispondi con la stringa: SOLO_GRAMMATICA

Rispondi SOLO con il testo trascritto, nessun commento.`;

  const body = {
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inline_data: { mime_type: 'image/png', data: imgBase64 } }
      ]
    }],
    generationConfig: {
      temperature:     0.1,
      maxOutputTokens: 4096,
    }
  };

  const response = await fetch(GEMINI_ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini ${response.status}: ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/* ═══════════════════════════════════════════════════════════════
   GEMINI — estrai lessico dal testo trascritto
   ═══════════════════════════════════════════════════════════════ */
async function extractVocabFromText(text, capNum, capTitle) {
  const prompt = `Sei un esperto di didattica delle lingue classiche (metodo Krashen/Ørberg/LLPSI).

Dal testo del capitolo ${capNum} di Familia Romana (${capTitle}), estrai 8-12 termini chiave per studenti principianti.

REGOLE ASSOLUTE:
- NON fornire MAI traduzioni italiane
- Mantieni le macron esattamente (ā, ē, ī, ō, ū)
- Il significato emerge dall'immagine contestuale e dalla frase, mai da una glossa

Per ogni termine fornisci:
- term: forma esatta dal testo (con macron corrette)
- forms: 1-2 altre forme morfologiche utili (array, può essere vuoto)
- semanticField: campo semantico in italiano (es. "famiglia", "geografia", "casa") — NON è una traduzione
- contextSentences: 1-2 frasi VERBATIM dal testo dove il termine appare (array)
- difficulty: 1=frequentissimo/base, 2=comune, 3=raro/tecnico
- grammarNote: nota grammaticale brevissima (es. "nom. sg. 2ª decl.") oppure null

Rispondi SOLO con JSON array valido.
Schema: [{"term":"...","forms":[],"semanticField":"...","contextSentences":["..."],"difficulty":1,"grammarNote":null}]

TESTO:
${text.substring(0, 6000)}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature:      0.2,
      maxOutputTokens:  2000,
      responseMimeType: 'application/json',
    }
  };

  const response = await fetch(GEMINI_ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  });

  if (!response.ok) throw new Error(`Gemini vocab ${response.status}`);
  const data = await response.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN — processa ogni capitolo richiesto
   ═══════════════════════════════════════════════════════════════ */
async function processChapter(capNum) {
  const chapter = CHAPTER_MAP[capNum];
  if (!chapter) {
    console.error(`❌  Capitolo ${capNum} non trovato nella mappa`);
    return;
  }

  const [fromPage, toPage] = chapter.pages;
  console.log(`\n📖  Cap. ${capNum} — ${chapter.title}`);
  console.log(`    Pagine PDF: ${fromPage+1}–${toPage+1} (0-based: ${fromPage}–${toPage})`);

  const tmpDir = join(OUT_DIR, `cap_${String(capNum).padStart(2,'0')}_pages`);
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  /* ── 1. Estrai ogni pagina come PNG ─────────────────────────── */
  const pageTexts = [];
  for (let pn = fromPage; pn <= toPage; pn++) {
    const imgPath = join(tmpDir, `pag_${pn+1}.png`);
    process.stdout.write(`    → Pag ${pn+1}: `);

    if (!existsSync(imgPath)) {
      try {
        const dims = extractPageAsPng(pn, imgPath);
        process.stdout.write(`estratta ${dims} `);
      } catch (e) {
        console.log(`ERRORE estrazione: ${e.message}`);
        continue;
      }
    } else {
      process.stdout.write(`(cache) `);
    }

    /* ── 2. Trascrivi con Gemini Vision ── */
    try {
      const text = await transcribePage(imgPath, capNum, chapter.title);
      if (text.trim() === 'SOLO_GRAMMATICA') {
        console.log('(solo grammatica — saltata)');
        continue;
      }
      pageTexts.push(text.trim());
      console.log(`✓ ${text.trim().substring(0,60).replace(/\n/g,' ')}…`);
    } catch (e) {
      console.log(`ERRORE Gemini: ${e.message}`);
    }

    // Rate limit: aspetta 1s tra chiamate
    await new Promise(r => setTimeout(r, 1000));
  }

  /* ── 3. Unisci il testo ─────────────────────────────────────── */
  const fullText = pageTexts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  const txtOut   = join(OUT_DIR, `cap_${String(capNum).padStart(2,'0')}_textFragment.txt`);
  writeFileSync(txtOut, fullText, 'utf8');
  console.log(`\n    ✅ TextFragment salvato: ${txtOut}`);
  console.log(`       ${fullText.length} caratteri, ${fullText.split('\n').length} righe`);

  // Mostra anteprima macron
  const macrons = fullText.match(/[āēīōūĀĒĪŌŪ]/g) || [];
  console.log(`       Macron trovate: ${macrons.length} (${[...new Set(macrons)].join(' ')})`);

  /* ── 4. Estrai lessico ──────────────────────────────────────── */
  console.log(`\n    📚 Estrazione lessico con Gemini…`);
  let vocab = [];
  try {
    vocab = await extractVocabFromText(fullText, capNum, chapter.title);
    const vocabOut = join(OUT_DIR, `cap_${String(capNum).padStart(2,'0')}_vocab.json`);
    writeFileSync(vocabOut, JSON.stringify(vocab, null, 2), 'utf8');
    console.log(`    ✅ Lessico: ${vocab.length} termini → ${vocabOut}`);
    vocab.forEach(v => {
      console.log(`       · ${v.term} [${v.semanticField}] diff=${v.difficulty}`);
    });
  } catch (e) {
    console.log(`    ⚠️  Errore estrazione lessico: ${e.message}`);
  }

  return { capNum, textFragment: fullText, vocab };
}

/* ── Run ──────────────────────────────────────────────────────── */
console.log(`\n🏛️  Familia Romana — Estrattore capitoli con Gemini Vision`);
console.log(`   PDF: ${PDF_PATH}`);
console.log(`   Capitoli da processare: ${caps.join(', ')}\n`);

for (const cap of caps) {
  await processChapter(cap);
}

console.log('\n✅  Completato. I file sono in bib/output/');
console.log('   Copia i textFragment nel DB usando /api/admin/lessons/extract-vocab');
