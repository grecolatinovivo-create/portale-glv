// lib/certificate.js — Generazione attestato PDF FEDELE al template latin-cert.
//
// Strategia: si parte dal PDF "template.pdf" (il vero attestato latin-cert con
// loghi, firma, filigrana, blob beige e tutti i testi fissi già presenti) da cui
// sono stati rimossi SOLO i campi variabili. Qui sopra ridisegniamo quei campi:
//   - nome studente      (font calligrafico Great Vibes, ~simile al Broisther)
//   - titolo corso       (Helvetica-Oblique 19pt, bordeaux #63180c, centrato)
//   - codice SOFIA       (Helvetica 13pt nero)
//   - data inizio / fine (Helvetica 13pt nero)
//   - durata in ore      (Helvetica 13pt nero)
//   - data "Firenze, il" (Helvetica 10pt nero)
//
// Coordinate ricavate al pixel dal PDF originale (vedi commit asset).
// Dipendenze: pdf-lib + @pdf-lib/fontkit  (già nel progetto)

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

// Risolve un asset provando più percorsi: su Vercel la cwd e __dirname possono
// differire, quindi cerchiamo in entrambi (e in process.cwd()) per robustezza.
function resolveAsset(filename) {
  const candidates = [
    path.join(__dirname, 'cert-assets', filename),
    path.join(process.cwd(), 'lib', 'cert-assets', filename),
    path.join(process.cwd(), 'cert-assets', filename),
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch (_) { /* ignora */ }
  }
  // fallback: ritorna il primo (genererà ENOENT con messaggio chiaro a monte)
  return candidates[0];
}

const TEMPLATE    = resolveAsset('template.pdf');
const SCRIPT_FONT = resolveAsset('GreatVibes.ttf');

// Altezza pagina A4 (pt). Le Y dei dati sono "baseline dall'alto" (come fitz):
// in pdf-lib vanno convertite con  y = PAGE_H - baselineTop.
const PAGE_H = 841.89;

const BORDEAUX = rgb(0x63 / 255, 0x18 / 255, 0x0c / 255); // #63180c (titolo corso)
const BLACK    = rgb(0, 0, 0);

/**
 * Codice attestato univoco GLV-ANNO-XXXXXXXX
 */
function generateCertCode() {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `GLV-${year}-${rand}`;
}

// Formatta una data come gg/mm/aaaa
function fmtDate(d) {
  if (!d) return '';
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt)) return '';
  const p = n => String(n).padStart(2, '0');
  return `${p(dt.getDate())}/${p(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

/**
 * Genera il PDF dell'attestato riempiendo il template originale.
 *
 * @param {object} opts
 * @param {string} opts.studentName  - Nome completo studente
 * @param {string} opts.courseTitle  - Titolo del corso
 * @param {string} [opts.sofiaCode]  - Codice SOFIA/MIM del corso
 * @param {Date}   [opts.startDate]  - Data inizio corso
 * @param {Date}   [opts.endDate]    - Data fine corso (quando lo studente ha finito di vederlo)
 * @param {number} [opts.hours]      - Durata in ore
 * @param {Date}   [opts.issueDate]  - Data di emissione attestato (stampata "Firenze, il …"). Default: oggi.
 * @param {string} opts.certCode     - Codice attestato
 * @returns {Promise<Buffer>}
 */
async function generateCertificate(opts) {
  const {
    studentName = 'Studente',
    courseTitle = '',
    sofiaCode = '',
    startDate = null,
    endDate = null,
    hours = null,
    issueDate = new Date(),   // data di GENERAZIONE → va sotto la firma ("Firenze, il …")
  } = opts || {};

  const endD = endDate;       // fine corso = quando lo studente ha completato (no fallback su oggi)

  const templateBytes = fs.readFileSync(TEMPLATE);
  const pdf = await PDFDocument.load(templateBytes);
  pdf.registerFontkit(fontkit);

  const scriptFont = await pdf.embedFont(fs.readFileSync(SCRIPT_FONT));
  const helv       = await pdf.embedFont(StandardFonts.Helvetica);
  const helvObl    = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const page = pdf.getPages()[0];

  // Helper: disegna testo centrato su un centro X dato (cx), a baseline-top y
  const drawCentered = (text, cx, yTop, font, size, color) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: cx - w / 2, y: PAGE_H - yTop, size, font, color });
  };
  // Helper: testo allineato a sinistra su origin X, baseline-top y
  const drawAt = (text, x, yTop, font, size, color) => {
    page.drawText(text, { x, y: PAGE_H - yTop, size, font, color });
  };

  // ── NOME STUDENTE — calligrafico, centrato. Originale: size 40, centro X≈300, baseline 218.9
  // Adattiamo la dimensione se il nome è lungo, per non sforare i margini.
  {
    const cx = 300.5;
    let size = 40;
    const maxW = 360;
    while (scriptFont.widthOfTextAtSize(studentName, size) > maxW && size > 22) size -= 1;
    drawCentered(studentName, cx, 218.9, scriptFont, size, BLACK);
  }

  // ── TITOLO CORSO — Helvetica-Oblique 19pt bordeaux, centrato. baseline 314.7, centro X≈300
  if (courseTitle) {
    const cx = 300.5;
    let size = 19;
    const maxW = 470;
    while (helvObl.widthOfTextAtSize(courseTitle, size) > maxW && size > 11) size -= 0.5;
    drawCentered(courseTitle, cx, 314.7, helvObl, size, BORDEAUX);
  }

  // ── CODICE SOFIA — Helvetica 13pt nero. origin X 382.7, baseline 341.2 (sopra la linea)
  if (sofiaCode) drawAt(String(sofiaCode), 386, 341.2, helv, 13, BLACK);

  // ── DATE — Helvetica 13pt nero. baseline 372.4. inizio X≈233, fine X≈358
  if (startDate) drawAt(fmtDate(startDate), 233, 372.4, helv, 13, BLACK);
  if (endD)      drawAt(fmtDate(endD),      358, 372.4, helv, 13, BLACK);

  // ── ORE — Helvetica 13pt nero, sopra la linea. origin X≈374, baseline 400.8
  if (hours != null && hours !== '') {
    const hs = String(hours);
    // piccolo centraggio sul trattino (la riga sotto è larga ~16pt)
    const w = helv.widthOfTextAtSize(hs, 13);
    drawAt(hs, 377 - w / 2 + 4, 400.8, helv, 13, BLACK);
  }

  // ── DATA FIRENZE (in basso, accanto a "Firenze, il") = DATA DI EMISSIONE dell'attestato
  //    (data in cui viene generato). Helvetica 10pt. baseline 717.3, X≈468
  drawAt(fmtDate(issueDate), 468.5, 716.0, helv, 10, BLACK);

  const out = await pdf.save();
  return Buffer.from(out);
}

module.exports = { generateCertificate, generateCertCode };
