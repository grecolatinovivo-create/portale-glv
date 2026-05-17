// lib/certificate.js — Generazione attestato PDF con pdfkit + QR code
//
// Design GLV: bordeaux (#a01a36) + oro (#c9a84c) su fondo crema
// Layout: A4 orizzontale, doppio bordo oro, banda bordeaux header/footer
//
// NOTA: questo template è stato progettato per il portale.
// Quando sarà disponibile il template latin-cert originale, confrontare
// ed eventualmente aggiornare il layout mantenendo la logica invariata.
//
// Dipendenze: npm install pdfkit qrcode

const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const crypto      = require('crypto');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://portale.grecolatinovivo.it';

// Palette colori GLV
const C = {
  bordeaux:    '#a01a36',
  bordeauxDark:'#7b0d1e',
  gold:        '#c9a84c',
  goldLight:   '#e8d5a0',
  black:       '#1a1a1a',
  grey:        '#444444',
  greyLight:   '#888888',
  white:       '#ffffff',
  bgCream:     '#faf8f4',
};

/**
 * Genera un codice attestato univoco nel formato GLV-ANNO-XXXXXXXX
 */
function generateCertCode() {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `GLV-${year}-${rand}`;
}

/**
 * Genera un Buffer PNG con il QR code che punta alla pagina di verifica
 */
async function buildQRCode(certCode) {
  const url = `${APP_URL}/verifica/${certCode}`;
  return QRCode.toBuffer(url, {
    type: 'png',
    width: 80,
    margin: 1,
    color: { dark: C.bordeaux.replace('#', ''), light: 'FDFBF7' },
  });
}

/**
 * Genera un Buffer con il PDF dell'attestato.
 *
 * @param {object} opts
 * @param {string} opts.studentName   - Nome completo dello studente
 * @param {string} opts.courseTitle   - Titolo del corso
 * @param {string} opts.courseLang    - Lingua (Latino, Greco Antico, ecc.)
 * @param {string} opts.courseLevel   - Livello (A1.1, B1.2, ecc.)
 * @param {Date}   opts.completedAt   - Data di completamento
 * @param {string} opts.certCode      - Codice univoco attestato (es. GLV-2025-A3B7F2)
 * @returns {Promise<Buffer>}
 */
async function generateCertificate({ studentName, courseTitle, courseLang, courseLevel, completedAt, certCode }) {
  // Genera il QR code prima (operazione async)
  let qrBuffer = null;
  try {
    qrBuffer = await buildQRCode(certCode);
  } catch {
    // Se qrcode non è disponibile, il PDF viene generato senza QR
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width;   // 841.89 pt
      const H = doc.page.height;  // 595.28 pt

      // ── SFONDO CREMA ───────────────────────────────────────────
      doc.rect(0, 0, W, H).fill(C.bgCream);

      // ── BANDA BORDEAUX HEADER ───────────────────────────────────
      doc.rect(0, 0, W, 82).fill(C.bordeaux);

      // ── BANDA BORDEAUX FOOTER ───────────────────────────────────
      doc.rect(0, H - 58, W, 58).fill(C.bordeaux);

      // ── BORDO ORO ESTERNO ──────────────────────────────────────
      doc
        .rect(14, 14, W - 28, H - 28)
        .lineWidth(2.5)
        .stroke(C.gold);

      // ── BORDO ORO INTERNO (sottile) ────────────────────────────
      doc
        .rect(22, 22, W - 44, H - 44)
        .lineWidth(0.6)
        .stroke(C.goldLight);

      // ── ROMBI ANGOLO ───────────────────────────────────────────
      [[48, 48], [W - 48, 48], [48, H - 48], [W - 48, H - 48]].forEach(([x, y]) => {
        doc.polygon([x, y - 7], [x + 7, y], [x, y + 7], [x - 7, y]).fill(C.gold);
      });

      // ── NOME CENTRO (header) ───────────────────────────────────
      doc
        .fillColor(C.white)
        .fontSize(9)
        .font('Helvetica')
        .text('CENTRO NAZIONALE DI STUDI CLASSICI', 0, 18, {
          align: 'center', characterSpacing: 3.5,
        });

      doc
        .fillColor(C.gold)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('GRECOLATINOVIVO', 0, 36, {
          align: 'center', characterSpacing: 7,
        });

      // ── LINEA ORNAMENTALE ──────────────────────────────────────
      const lineY = 96;
      doc.moveTo(70, lineY).lineTo(W - 70, lineY).lineWidth(1).stroke(C.gold);
      // Rombo centrale sulla linea
      const cx = W / 2;
      doc.polygon([cx, lineY - 6], [cx + 7, lineY], [cx, lineY + 6], [cx - 7, lineY]).fill(C.gold);

      // ── TITOLO ATTESTATO ───────────────────────────────────────
      doc
        .fillColor(C.bordeaux)
        .fontSize(10)
        .font('Helvetica')
        .text('A T T E S T A T O   D I   C O M P L E T A M E N T O', 0, 114, {
          align: 'center', characterSpacing: 2.5,
        });

      // ── TESTO INTRODUTTIVO ─────────────────────────────────────
      doc
        .fillColor(C.grey)
        .fontSize(12)
        .font('Helvetica')
        .text('Si attesta che', 0, 152, { align: 'center' });

      // ── NOME STUDENTE ──────────────────────────────────────────
      doc
        .fillColor(C.black)
        .fontSize(32)
        .font('Helvetica-BoldOblique')
        .text(studentName || 'Studente', 0, 174, { align: 'center' });

      // Sottolineatura nome
      const nameUnderY = 218;
      const nameW = 360;
      doc
        .moveTo((W - nameW) / 2, nameUnderY)
        .lineTo((W + nameW) / 2, nameUnderY)
        .lineWidth(0.7)
        .stroke(C.gold);

      // ── TESTO CORSO ────────────────────────────────────────────
      doc
        .fillColor(C.grey)
        .fontSize(12)
        .font('Helvetica')
        .text('ha completato con successo il percorso formativo', 0, 232, { align: 'center' });

      // ── TITOLO CORSO ───────────────────────────────────────────
      doc
        .fillColor(C.bordeaux)
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(courseTitle || 'Corso GrecoLatinoVivo', 0, 256, {
          align: 'center', width: W,
        });

      // Lingua · Livello
      const langLevel = [courseLang, courseLevel].filter(Boolean).join('  ·  ');
      if (langLevel) {
        doc
          .fillColor(C.greyLight)
          .fontSize(10)
          .font('Helvetica')
          .text(langLevel, 0, 284, { align: 'center', characterSpacing: 1.5 });
      }

      // ── LINEA DIVISORIA ────────────────────────────────────────
      doc
        .moveTo(140, 308)
        .lineTo(W - 140, 308)
        .lineWidth(0.5)
        .stroke(C.goldLight);

      // ── DATA COMPLETAMENTO ─────────────────────────────────────
      const dateStr = completedAt
        ? new Date(completedAt).toLocaleDateString('it-IT', {
            day: 'numeric', month: 'long', year: 'numeric',
          })
        : new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

      doc
        .fillColor(C.grey)
        .fontSize(11)
        .font('Helvetica')
        .text(`Completato il  ${dateStr}`, 0, 322, { align: 'center' });

      // ── QR CODE (angolo in basso a destra) ────────────────────
      if (qrBuffer) {
        doc.image(qrBuffer, W - 148, H - 148, { width: 80, height: 80 });
        doc
          .fillColor(C.greyLight)
          .fontSize(7)
          .font('Helvetica')
          .text('Verifica autenticità', W - 148, H - 63, { width: 80, align: 'center' });
      }

      // ── CODICE UNIVOCO ─────────────────────────────────────────
      if (certCode) {
        doc
          .fillColor(C.greyLight)
          .fontSize(8.5)
          .font('Helvetica')
          .text(`Codice attestato: ${certCode}`, 0, H - 115, { align: 'center' });
      }

      // ── BLOCCO FIRMA (sinistra) ────────────────────────────────
      const sigX = 90;
      const sigY = 400;
      doc.moveTo(sigX, sigY).lineTo(sigX + 200, sigY).lineWidth(0.6).stroke(C.grey);
      doc
        .fillColor(C.grey)
        .fontSize(9)
        .font('Helvetica')
        .text('La Direzione Didattica', sigX, sigY + 8, { width: 200, align: 'center' });
      doc
        .fillColor(C.greyLight)
        .fontSize(8)
        .text('GrecoLatinoVivo', sigX, sigY + 22, { width: 200, align: 'center' });

      // ── BLOCCO LUOGO/DATA (destra) ─────────────────────────────
      const rightX = W - 310;
      doc
        .fillColor(C.greyLight)
        .fontSize(9)
        .font('Helvetica')
        .text(`Roma, ${new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`, rightX, 400, {
          width: 200, align: 'center',
        });

      // ── FOOTER (in banda bordeaux) ─────────────────────────────
      doc
        .fillColor(C.goldLight)
        .fontSize(8.5)
        .font('Helvetica')
        .text('portale.grecolatinovivo.it  ·  grecolatinovivo@gmail.com', 0, H - 42, {
          align: 'center', characterSpacing: 0.5,
        });
      doc
        .fillColor(C.white)
        .fontSize(7)
        .text('Documento emesso automaticamente dal sistema GrecoLatinoVivo Portale.', 0, H - 26, {
          align: 'center',
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCertificate, generateCertCode };
