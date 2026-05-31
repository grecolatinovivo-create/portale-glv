// lib/grading.js — Correzione automatica dei test, modello latin-cert.
//
// Principio (come autovalResults.result su latin-cert): ogni domanda restituisce
// una PERCENTUALE 0-100 con CREDITO PARZIALE (le domande multi-item danno credito
// proporzionale ai sotto-item corretti). La sessione = media delle percentuali.
//
// gradeQuestion(question, given) → number 0..100  | null se non autocorreggibile.
//
// Formati `data` per tipo (vedi schema.prisma):
//   SceltaMultipla      [{question, correct, wrong_1, wrong_2, wrong_3?}, ...]
//   VeroFalso           [{question, correct: 0|1}, ...]
//   Abbinamento         [{w1, w2}, ...]
//   ClozeDragDrop       {html}  span.completamento con dentro la risposta
//   ClozeSceltaMultipla {html}  span con risposta giusta + attr incorrect/incorrect2
//   Completamento       {html}  span con <label>hint</label>, testo = risposta
//   RiordinoTesto       {txt}   blocchi {part}...{/part} nell'ordine corretto
//   RispostaAperta      {min,max}  → NON autocorreggibile (null)

function parseData(q) {
  try { return typeof q.data === 'string' ? JSON.parse(q.data) : q.data; }
  catch { return null; }
}

function norm(s) {
  return String(s == null ? '' : s).trim().toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?«»"'`]/g, '');
}

// Estrae il testo "risposta corretta" dagli span di un html cloze.
// Per Completamento/ClozeDragDrop la risposta giusta è il testo dello span.
function extractClozeAnswers(html) {
  if (!html) return [];
  const answers = [];
  // <span ...>risposta</span> — prende il contenuto testuale dello span (senza eventuale <label>)
  const re = /<span[^>]*>([\s\S]*?)<\/span>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let inner = m[1].replace(/<label[^>]*>[\s\S]*?<\/label>/gi, ''); // togli hint
    inner = inner.replace(/<[^>]+>/g, '').trim();
    if (inner) answers.push(inner);
  }
  return answers;
}

// pct su un array di booleani
function pctOf(boolArray) {
  if (!boolArray.length) return 0;
  const ok = boolArray.filter(Boolean).length;
  return Math.round((ok / boolArray.length) * 100);
}

/**
 * @param {object} q  - ExerciseQuestion ({ questionType, data })
 * @param {*} given   - risposta dello studente; forma dipende dal tipo:
 *    SceltaMultipla/VeroFalso : array di indici/valori per sotto-domanda, oppure singolo
 *    Abbinamento              : array di {w1, w2} scelti dallo studente
 *    Cloze/Completamento      : array di stringhe (una per blank)
 *    RiordinoTesto            : array di indici nell'ordine scelto
 * @returns {number|null} percentuale 0..100, o null se non autocorreggibile
 */
function gradeQuestion(q, given) {
  const type = q.questionType;
  const data = parseData(q);
  if (data == null) return null;

  switch (type) {
    case 'RispostaAperta':
      return null; // correzione manuale (autoval_flag = 0 su latin-cert)

    case 'VeroFalso': {
      // data: [{question, correct: 0|1}] — given: array di 0/1 (o 'Vero'/'Falso')
      const items = Array.isArray(data) ? data : [];
      const ans = Array.isArray(given) ? given : [given];
      const res = items.map((it, i) => {
        const exp = Number(it.correct) === 1 || it.correct === true || norm(it.correct) === 'vero' ? 1 : 0;
        const g = (ans[i] === 1 || ans[i] === '1' || norm(ans[i]) === 'vero') ? 1 : 0;
        return g === exp;
      });
      return pctOf(res);
    }

    case 'SceltaMultipla': {
      // data: [{question, correct, wrong_1,...}] — la risposta giusta è il VALORE `correct`.
      // given: array — per ogni sotto-domanda il TESTO scelto (o l'indice se il client manda indici).
      const items = Array.isArray(data) ? data : [];
      const ans = Array.isArray(given) ? given : [given];
      const res = items.map((it, i) => {
        const correctText = norm(it.correct);
        const g = ans[i];
        // accetta sia il testo sia, se numero, l'opzione corrispondente
        if (typeof g === 'number' || /^\d+$/.test(String(g))) {
          // 0 = correct, 1.. = wrong_n (ordine di rendering: correct,wrong_1,wrong_2,wrong_3)
          return Number(g) === 0;
        }
        return norm(g) === correctText;
      });
      return pctOf(res);
    }

    case 'Abbinamento': {
      // data: [{w1, w2}] coppie corrette — given: array di {w1, w2} scelti
      const pairs = Array.isArray(data) ? data : [];
      const map = {};
      pairs.forEach(p => { map[norm(p.w1)] = norm(p.w2); });
      const ans = Array.isArray(given) ? given : [];
      const res = pairs.map(() => false);
      ans.forEach((a, i) => {
        if (i < res.length) res[i] = map[norm(a.w1)] === norm(a.w2);
      });
      return pctOf(res);
    }

    case 'ClozeDragDrop':
    case 'ClozeSceltaMultipla':
    case 'Completamento': {
      // risposte corrette = testo degli span nel html; given = array di stringhe per blank
      const correct = extractClozeAnswers(data.html || '');
      const ans = Array.isArray(given) ? given : [];
      if (!correct.length) return null;
      const res = correct.map((c, i) => norm(ans[i]) === norm(c));
      return pctOf(res);
    }

    case 'RiordinoTesto': {
      // ordine corretto = sequenza dei blocchi {part}..{/part}; given = array indici scelti
      const txt = data.txt || '';
      const parts = (txt.match(/\{part\}[\s\S]*?\{\/part\}/g) || []);
      const n = parts.length;
      if (!n) return null;
      const ans = Array.isArray(given) ? given : [];
      // confronto posizione per posizione con l'ordine 0,1,2,...
      const res = [];
      for (let i = 0; i < n; i++) res.push(Number(ans[i]) === i);
      return pctOf(res);
    }

    default:
      return null; // tipo sconosciuto → non conteggiato
  }
}

module.exports = { gradeQuestion };
