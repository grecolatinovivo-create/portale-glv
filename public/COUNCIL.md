# Council — Portale GLV
*Brainstorming del 17 maggio 2026*

## Trascrizione del dialogo

### ROUND 0 — Reazioni libere al brief

```
[PM] Prima reazione
Il perimetro è chiaro: SOLO presentazione, backend intoccabile. Riduce il rischio.
Mi preoccupa che 5 pagine diverse richiedano un sistema di stile coerente senza CSS esterno.
→ Chiede a: DEV — esiste già un CSS condiviso esterno o tutto è inline?

[UX] Prima reazione
Palette (bordeaux/gold/ivory) ha carattere. Le 5 pagine hanno navbar diverse accumulate da
sessioni precedenti. Entusiasmo: modello Coursera/Netflix ben adatto al catalogo corsi.
→ Chiede a: PM — obbligatorio mantenere la bottom-nav mobile per le pagine interne?

[NM] Prima reazione
L'emozione chiave è "appartenenza a comunità di studiosi seri" (non gaming). Zeigarnik già
attivo con progress bar. Rischio: sembrare startup tech anziché centro culturale.
→ Chiede a: UX — Playfair nei titoli delle card o solo nell'hero?

[DEV] Prima reazione
Risponde a PM: nessun CSS esterno, tutto inline. JS globale in public/js/app.js. Caricato
in tutte le pagine. I data-hook sono critici: data-open-register, data-plan, #tog-annual.
Mi preoccupa che modifiche estetiche rompano hook JS come già successo con Stripe.
→ Risponde a: PM

[QA] Prima reazione
Hook critici identificati: data-open-register, data-plan, data-subscribe-monthly/annual,
#tog-annual, #billingToggle, #modalDocenti. Stripe ora corretto. Preoccupazione: elementi
[data-lesson-id], [data-course-slug], [data-buy-course] in corso.html e profilo.html.
→ Chiede a: DEV — quante classi CSS aggiunte dinamicamente da app.js?

[AUD] Prima reazione
WCAG alert: gold #d4a017 su bianco = ratio 2.1:1 — FALLISCE per testo normale.
Bordeaux #a01a36 su bianco = 5.8:1 — OK. Bisogna chiarire se gold è usato come testo.
→ Chiede a: UX — gold usato come colore di testo o solo accento decorativo?

[CLA] Prima reazione
Nome "Centro Nazionale di Studi Classici" corretto e va in primo piano. Latino e Greco
sono il core: non devono avere lo stesso visual di Egiziano e Ebraico.
→ Chiede a: UX — Latino e Greco hanno visual privilegiato nella sezione lingue?
```

### ROUND 1 — Tensione e negoziazione

```
[UX] Risponde a PM, NM, AUD, CLA (intervento 1)
- Bottom-nav mobile: resta, è l'unica navigazione su mobile.
- Playfair: solo titoli sezione e nomi piani. Card usano Inter (leggibilità).
- Gold: SOLO accento decorativo (bordi, badge) — mai testo. Nessuna violazione WCAG.
- Latino/Greco: proposta card doppie (larghezza 2x su desktop) con citazione latina.
→ Risponde a: PM, NM, AUD, CLA

[DEV] Risponde a QA (intervento 1)
Classi dinamiche: .active (tabs, modal), .open (faq), .annual (toggle), .locked (features).
Selettori [data-lesson-id], [data-course-slug], [data-buy-course]: solo event listener,
non toccateli nell'HTML. In corso.html il <video> ha data-lesson-id — non rimuoverlo.
→ Risponde a: QA

[NM] Proposta nuova (intervento 1)
Badge "Più scelto" su Linguae → sostituire con "Il preferito dai docenti MIM" (prova
sociale, Cialdini). Più credibile di un badge promozionale generico.
Numero 12.447 nell'hero: deve essere il PRIMO elemento dopo il titolo (effetto ancoraggio).
→ Chiede a: UX

[QA] Secondo intervento — vincoli hard
in corso.html: <li class="lezione-item" data-lesson-id="X"> — struttura intoccabile.
in profilo.html: [data-tab] — valori dei data-tab non rinominarli.
Modifiche solo CSS, non struttura HTML per questi elementi.

[PM] Secondo intervento — sintesi
Confermato: bottom-nav resta. Card Latino/Greco più grandi: approvato.
Vincolo assoluto: retrocompatibilità totale con app.js senza modificare una riga di JS.
Se un effetto richiede JS, si usa CSS puro (:hover, @keyframes, details/summary).
```

### ROUND 2 — Convergenza

| Agente | Condizioni NON negoziabili | Punti di flessibilità |
|--------|---------------------------|----------------------|
| PM | Zero modifiche a JS/API; data-* e id JS preservati | Struttura sezioni, nuovi componenti CSS |
| UX | Playfair+Inter, #a01a36, gold solo decorativo, card Latino/Greco 2x | Layout interno card, dimensioni heading |
| NM | Badge Linguae = prova sociale; 12.447 studenti prominente hero | Formulazione microcopy, posizione badge |
| DEV | lezione-item e tab-nav intoccabili; data-open-register, data-plan, #tog-annual preservati | Nuove classi CSS, wrapper div aggiuntivi |
| QA | Test cross-browser (Chrome+Safari); QA_REPORT aggiornato | Formato del report |
| AUD | Contrasto WCAG AA (gold mai come testo); alt text immagini | Ordine delle verifiche |
| CLA | Latino/Greco distinti da lingue moderne; docenti reali nominati | Formulazione delle descrizioni |

---

## Decisioni condivise

1. **Stripe ripristinato** — button `data-open-register data-plan="cultura|linguae|accademia"` + `#tog-annual` sentinella. *Proposto da DEV+QA, accettato da tutti.*

2. **CSS solo inline** per compatibilità con Next.js e zero dipendenze esterne. *Confermato da DEV.*

3. **Card Latino+Greco a larghezza doppia** nella sezione lingue della home. *Proposto da CLA, approvato da UX.*

4. **Badge Linguae = prova sociale**: "Il preferito dai docenti MIM" anziché "Più scelto". *Proposto da NM.*

5. **12.447 studenti in hero** come prima cifra di fiducia. *Confermato da NM e PM.*

6. **Gold #d4a017 mai come testo** — solo bordi, badge background, separatori. *Imposto da AUD.*

7. **Struttura lezione-item e data-tab non toccare** nell'HTML. Solo restyling CSS. *Imposto da QA+DEV.*

8. **Bottom-nav mobile resta** in tutte le pagine interne. *Confermato da UX+PM.*

---

## Punti di disaccordo residui

- **Nessuno**: tutti i conflitti sono stati risolti nel Round 1-2.

---

## Mandato per la pipeline

- **PM**: Documentare requisiti funzionali con lista esplicita di elementi HTML non modificabili.
- **UX**: Implementare card 2x per Latino/Greco; Playfair nei titoli; gold solo decorativo.
- **NM**: Badge "Il preferito dai docenti MIM" su Linguae; 12.447 in posizione prominente hero.
- **DEV**: SOLO HTML e CSS. Preservare tutti i data-* e id esistenti. Zero righe JS.
- **QA**: Verificare Stripe flow, contrasti WCAG, zero emoji, dati reali su tutte le pagine.
- **AUD**: Contrasto ratio su tutti i testi; alt text immagini; nessun pattern dark pattern.
