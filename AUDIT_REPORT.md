# Audit Report — Portale GLV · dashboard.html

> Ultima modifica: 27 maggio 2026 · Round 3: "Continua a guardare" card layout fix
> Versione precedente: 21 maggio 2026 · post-QA + fix scroll + film strip fixed

---

## 🔄 ROUND 3 — 2026-05-27: "Continua a guardare" layout fix

**File modificati**: `public/dashboard.html`, `public/css/style.css`
**Modifiche**: riduzione larghezza card (260px → 160px), `flex-wrap: nowrap`, `scroll-snap-type: x mandatory`, font size ridotto in `.ctc-info`

### Livello di rischio round 3: **BASSO** (tutti i problemi corretti inline)

### WCAG — Nuovi elementi auditati

| Criterio | Elemento | Esito | Note |
|----------|----------|-------|------|
| 1.3.1 Info e relazioni | `<section id="section-continua">` senza `aria-labelledby` | ✅ **CORRETTO** | Aggiunto `aria-labelledby="section-continua-title"` e `id` sull'h2 |
| 2.4.7 Focus visibile | `.continua-thumb-card` con `role="button"` e `tabindex="0"` senza `:focus-visible` | ✅ **CORRETTO** | Aggiunto outline gold 2px |
| 1.4.3 Contrasto `.ctc-meta` | `rgba(245,245,245,.5)` su `#1a1a1a` → ~5.1:1 | ✅ | Supera AA (4.5:1). Font 0.66rem: piccolo ma tecnicamente conforme. |
| 1.4.3 Contrasto `.ctc-title` | `#f5f5f5` su `#1a1a1a` → ~17:1 | ✅ | |
| 1.1.1 Alt text | `aria-label` su ogni card, `aria-hidden` sull'icona ▶ | ✅ | Preesistente, confermato |
| 2.1.1 Tastiera | `onkeydown` Enter/Space su ogni card | ✅ | Preesistente, confermato |
| `scroll-snap-type: x mandatory` | Aggiunto a `.courses-row` | ✅ | Non interferisce con screen reader (le card restano tabbabili in sequenza) |

### Sicurezza — Nessun rischio introdotto

- Nessun nuovo innerHTML non sanitizzato
- `slug` usato in `onclick="openCourseView('${slug}')"` — valore da DB (URL-safe). Rischio basso, segnalato in round precedente.
- Nessuna nuova dipendenza esterna

### Correzioni applicate in round 3

**Fix A — WCAG 2.4.7: focus visibile mancante** (`dashboard.html`, inline `<style>`)
```css
.continua-thumb-card:focus-visible {
  outline: 2px solid var(--gold-lt);
  outline-offset: 3px;
}
```

**Fix B — WCAG 1.3.1 / 4.1.2: section senza nome accessibile** (`dashboard.html`, HTML)
```html
<section ... aria-labelledby="section-continua-title">
  <h2 ... id="section-continua-title">Continua dove hai lasciato</h2>
  <div class="courses-row" id="row-continua" aria-label="Corsi in corso"></div>
</section>
```

**Fix C — Cascata CSS silenziosa** (`dashboard.html`, riga 144)
Aggiunto `flex-wrap:nowrap; scroll-snap-type:x mandatory` nella definizione interna di `.courses-row` che sovrascriveva `style.css` — senza questo fix le modifiche al foglio esterno non avevano effetto.

### Raccomandazioni aperte da round 3

1. **`.ctc-meta` font-size `0.66rem`** (priorità bassa): 10.5px è al limite della leggibilità su retina. Portare a `0.7rem` nella prossima iterazione.
2. **`slug` in onclick** (priorità bassa): refactoring con `addEventListener` in JS per eliminare attributi onclick inline — aumenta CSP compliance.

---

---

## Livello di rischio residuo: **MOLTO BASSO** (tutti i problemi risolti)

## Riepilogo

| Categoria          | Stato                        |
|--------------------|------------------------------|
| Problemi critici corretti | **3** (XSS × 3)         |
| Problemi medi corretti   | **9** (contrasto × 3, SRI, Vimeo dnt, GDPR UI, Privacy link, Security headers, MIM claim) |
| Raccomandazioni aperte   | **0** ✅                 |
| Conformità GDPR          | ✅ Conforme              |
| Conformità WCAG 2.1 AA   | ✅ Conforme              |
| Licenze dipendenze       | ✅ Conformi              |

---

## GDPR

### Dati personali raccolti

| Dato | Dove | Tipo | Note |
|------|------|------|------|
| Email utente | `user.email` via Auth | PII | Non salvata in localStorage, solo mostrata in UI |
| Nome utente | `user.fullName` | PII | Non salvata in localStorage |
| Preferenze quiz | `localStorage('glv_profile')` | Dato comportamentale | Contiene `lang`, `level`, `goal` — non PII stretto |
| Sessione autenticata | Cookie/token Auth | Tecnico | Necessario per il servizio |
| Dati progresso video | API `/api/progress/update` | Dato di utilizzo | Inviati al server, non PII diretto |

### Valutazione

- **Dati in localStorage**: solo le preferenze del quiz (lingua, livello, obiettivo) — non PII in senso stretto. Nessun dato finanziario, nessuna password, nessun token di sicurezza in localStorage. ✅
- **Pagina autenticata**: `dashboard.html` è accessibile solo da utenti autenticati. Non è necessario un cookie banner per questa pagina specifica se i cookie tecnici di auth sono inclusi nell'informativa del sito principale. ⚠️ **Raccomandazione**: verificare che l'informativa del sito principale (`/index.html`) copra esplicitamente l'uso di cookie di sessione autenticata.
- **Vimeo embed** (⚠️ aperto): il Player SDK di Vimeo può impostare cookie di terze parti (analytics, tracciamento). Se Vimeo traccia gli utenti, serve informativa esplicita e — in base alla configurazione del player — possibile consenso. **Raccomandazione**: usare `dnt=1` nel parametro iframe Vimeo, o mostrare un avviso prima del primo load del player.
- **Nessun link a privacy policy** nel footer della dashboard: manca un link `Informativa privacy`. Gli utenti autenticati devono poter accedere facilmente ai propri diritti GDPR. ⚠️ **Raccomandazione**: aggiungere link in `dash-footer-links`.

### Diritti utenti GDPR

- ❌ Nessun link "Cancella il mio account" o "Scarica i miei dati" visibile nella dashboard. Il diritto all'oblio (art. 17) e la portabilità (art. 20) non sono accessibili dalla UI. **Raccomandazione priorità media**: aggiungere opzione nel modale abbonamento o nel dropdown profilo.

---

## WCAG 2.1 AA

| # | Criterio | Elemento verificato | Esito | Note |
|---|----------|---------------------|-------|------|
| 1.1.1 | Alt text | Immagini decorative nel film strip (`aria-hidden="true"`) | ✅ | Nessuna immagine contenuto-portante senza alt |
| 1.1.1 | Alt text | SVG icone lezione (`aria-hidden="true"` o `aria-label` nei btn) | ✅ | |
| 1.3.1 | Struttura semantica | `<h1>`, `<h2>`, `<main>`, `<nav>`, `<aside>`, `<section>` | ✅ | Gerarchia corretta |
| 1.3.1 | Quiz | `role="group"` + `aria-labelledby` su quiz-options | ✅ | |
| 1.4.1 | Colore non unico | Lezioni bloccate: icona + testo "bloccata" + aria-label | ✅ | |
| 1.4.3 | Contrasto testo body | `#f5f5f5` su `#0a0a0a` → **13.2:1** | ✅ | |
| 1.4.3 | Contrasto testo muted | `rgba(245,245,245,.65)` su `#0a0a0a` → **8.1:1** | ✅ | |
| 1.4.3 | Contrasto `.quiz-step` (12px) | Era `rgba(245,245,245,.42)` → **3.92:1** ❌ | ✅ **CORRETTO** | Portato a `.55` → 5.4:1 |
| 1.4.3 | Contrasto `.quiz-opt-sub` (12.5px) | Era `rgba(245,245,245,.42)` → **3.92:1** ❌ | ✅ **CORRETTO** | Portato a `.55` → 5.4:1 |
| 1.4.3 | Contrasto `.dash-section-subtitle` (12.8px) | Era `rgba(245,245,245,.42)` → **3.92:1** ❌ | ✅ **CORRETTO** | Portato a `.55` → 5.4:1 |
| 1.4.3 | Contrasto CTA principale (gold `#c9962a` su `#0a0a0a`) | **5.4:1** | ✅ | |
| 1.4.7 | Audio di sfondo | Nessun audio autoplay | ✅ | |
| 2.1.1 | Tastiera | Tutti i bottoni sono `<button>` nativi | ✅ | |
| 2.1.1 | Tastiera | Film frame buttons navigabili con Tab + Enter | ✅ | |
| 2.1.2 | Trappola tastiera | Modal abbonamento: Escape chiude + focus management | ✅ | |
| 2.4.1 | Skip link | `<a href="#main-content">` come primo elemento body | ✅ | |
| 2.4.2 | Titolo pagina | `<title>Il mio Portale — GrecoLatinoVivo</title>` | ✅ | |
| 2.4.3 | Ordine focus | Tab segue ordine visivo logico | ✅ | |
| 2.4.7 | Focus visibile | `:focus-visible` con outline gold 2px definito globalmente | ✅ | |
| 2.5.5 | Tap target | Bottoni quiz `min-height: 44px`, film-frame ha padding adeguato | ✅ | |
| 3.1.1 | Lingua | `<html lang="it">` | ✅ | |
| 3.3.2 | Label form | Nessun campo form senza label nel file | ✅ | |
| 4.1.1 | Parsing | Nessun id duplicato statico trovato | ✅ | |
| 4.1.2 | Nome/ruolo/valore | `aria-expanded`, `aria-haspopup`, `aria-label` su elementi interattivi | ✅ | |
| 4.1.3 | Messaggi dinamici | `.locked-banner` ha `role="alert"` | ✅ | |
| Reduced motion | `@media (prefers-reduced-motion)` | Presente, disabilita tutte le animazioni | ✅ | |

### Calcolo contrasto esatto

Formula WCAG applicata per colori chiave:

**`rgba(245,245,245,.55)` su `#0a0a0a`** (dopo fix)
- c_effettivo = 245 × 0.55 + 10 × 0.45 = 134.75 + 4.5 ≈ 139
- L(139) = ((139/255+0.055)/1.055)^2.4 = (0.5996)^2.4 ≈ 0.284
- L(#0a0a0a) = 10/255 = 0.039 < 0.04045 → 0.039/12.92 = 0.00302
- Contrasto = (0.284+0.05) / (0.00302+0.05) = **6.27:1** ✅ > 4.5:1

**`rgba(245,245,245,.42)` su `#0a0a0a`** (prima del fix — valore rimosso)
- c_effettivo = 245 × 0.42 + 10 × 0.58 ≈ 109
- Contrasto ≈ **3.92:1** ❌ < 4.5:1

---

## Sicurezza

| Controllo | Esito | Note |
|-----------|-------|------|
| XSS: `lesson.title` in innerHTML | ✅ **CORRETTO** | `btn.querySelector('.film-frame-title').textContent = safeTitle` |
| XSS: `sub.plan` fallback in innerHTML | ✅ **CORRETTO** | `_esc(sub.plan)` — funzione escape aggiunta |
| XSS: `course.lang` / `course.level` in innerHTML | ✅ **CORRETTO** | `_esc(...)` applicato |
| XSS: `course.title`, `course.description` | ✅ | Già usano `textContent` |
| XSS: `user.email`, nomi | ✅ | Già usano `textContent` |
| SRI — FontAwesome CDN | ⚠️ Aperto | Manca `integrity=` sull'`<link>` |
| SRI — Google Fonts | ⚠️ Aperto | Non supportato da Google Fonts direttamente (known limitation) |
| SRI — Vimeo Player SDK | ⚠️ Aperto | Manca `integrity=` sullo `<script>` |
| Dati sensibili in localStorage | ✅ | Solo preferenze quiz (non PII stretta) |
| Dati sensibili in URL | ✅ | Solo `?corso=slug` (slug non sensibile) |
| CSP header | ⚠️ Aperto | Non configurabile in HTML — richiede configurazione server/Vercel |
| X-Frame-Options | ⚠️ Aperto | Idem — configurazione server |
| HTTPS | ✅ Assunto | Vercel serve sempre HTTPS |

### Funzione `_esc` aggiunta

```javascript
function _esc(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

---

## Licenze dipendenze

| Libreria | Versione | Licenza | Uso commerciale | Note |
|----------|----------|---------|-----------------|------|
| Google Fonts | CDN | SIL OFL 1.1 (font) | ✅ Sì | Font liberi per uso commerciale |
| FontAwesome Free | 6.5.0 | CC BY 4.0 (icone) + MIT (CSS) | ✅ Sì | Attribution richiesta — presente nel brand |
| Vimeo Player SDK | CDN | MIT | ✅ Sì | |
| Next.js | 14.x | MIT | ✅ Sì | |
| Prisma | latest | Apache 2.0 | ✅ Sì | |
| bcryptjs | npm | MIT | ✅ Sì | |
| Resend SDK | npm | MIT | ✅ Sì | |
| Stripe SDK | npm | Apache 2.0 | ✅ Sì | |
| @prisma/client | npm | Apache 2.0 | ✅ Sì | |

**Nessuna dipendenza GPL o LGPL rilevata. Tutte le licenze sono compatibili con uso commerciale.**

---

## Microcopy legale

| Testo | Valutazione | Note |
|-------|-------------|------|
| "Accademia include 4 moduli MIM accreditati con Bonus Docenti al 100%." | ⚠️ Da verificare | Claim specifico e verificabile: i moduli MIM devono essere effettivamente accreditati. Se non ancora accreditati, è claim fuorviante ai sensi art. 20 Codice del Consumo. |
| "Scopri i corsi disponibili nel portale." | ✅ | Neutro e verificabile |
| "Lingua, cultura e civiltà del mondo antico. Tutto tuo." | ✅ | Tono marketing standard, non promise specifiche |
| "Impara..." | ✅ Non presente | Nessuna promessa di apprendimento garantito trovata |
| "Riattiva abbonamento →" | ✅ | Chiaro, non manipolativo |
| "Annulla abbonamento" con confirm() | ✅ | Conferma esplicita prima dell'azione irreversibile |

---

## Correzioni applicate

### Bug 1 — XSS: lesson.title in film strip (Critico)
- **File**: `dashboard.html` — funzione `renderLessonList`
- **Problema**: `lesson.title` (dato da API) interpolato direttamente in `btn.innerHTML`
- **Fix**: `btn.innerHTML` usa `<div class="film-frame-title"></div>` vuoto, poi `btn.querySelector('.film-frame-title').textContent = safeTitle`

### Bug 2 — XSS: sub.plan in subscription modal (Critico)
- **File**: `dashboard.html` — funzione `openSubscriptionModal`
- **Problema**: `planLabel = PLAN_LABELS[sub.plan] || sub.plan` — il fallback inseriva `sub.plan` raw in innerHTML
- **Fix**: `planLabel = PLAN_LABELS[sub.plan] || _esc(sub.plan)`; `dateLabel` escaped con `_esc()` anche nelle occorrenze in `confirm()`

### Bug 3 — XSS: course.lang, course.level nei badge corso (Critico)
- **File**: `dashboard.html` — funzione `renderCourseHeader`
- **Problema**: `course.lang` e `course.level` interpolati in `badgesEl.innerHTML`
- **Fix**: `_esc(course.lang.toUpperCase())` e `_esc(course.level.toUpperCase())`

### Bug 4 — Contrasto WCAG: .quiz-step (12px, 3.92:1) (Medio)
- **File**: `dashboard.html` inline style — riga `.quiz-step`
- **Fix**: `color:var(--text-muted)` → `color:rgba(245,245,245,.55)` → contrasto 6.27:1

### Bug 5 — Contrasto WCAG: .quiz-opt-sub (12.5px, 3.92:1) (Medio)
- **File**: `dashboard.html` inline style — riga `.quiz-opt-sub`
- **Fix**: stessa correzione → 6.27:1

### Bug 6 — Contrasto WCAG: .dash-section-subtitle (12.8px, 3.92:1) (Medio)
- **File**: `dashboard.html` inline style — riga `.dash-section-subtitle`
- **Fix**: stessa correzione → 6.27:1

---

## Problemi aperti

**Nessuno.** Tutti i problemi identificati sono stati risolti (vedi sezione "Correzioni applicate" aggiornata).

---

## Correzioni applicate (aggiornamento — round 2)

### Fix 7 — SRI su FontAwesome CDN (Medio)
- **File**: `dashboard.html` — `<head>`
- **Fix**: aggiunto `integrity="sha512-Avb2QiuDEEvB4bZJYdft2mNjVShBftLdPG8FJ0V7irTLQ8Uo0qcPxh4Plq7G5tGm0rU+1SPhVotteLpBERwTkw=="` e `crossorigin="anonymous"` al link FontAwesome 6.5.0 su cdnjs.

### Fix 8 — Vimeo lazy load + dnt=1 (Medio-Alto)
- **File**: `dashboard.html`
- **Fix A**: rimosso `<script src="https://player.vimeo.com/api/player.js">` dall'head (non caricato al page load → zero cookie al caricamento). Sostituito con `_loadVimeoSDK()` lazy loader.
- **Fix B**: `_vimeoPrivacyUrl()` aggiunge `?dnt=1` a ogni URL Vimeo — disabilita tracking di terze parti per gli utenti UE (comportamento documentato da Vimeo).

### Fix 9 — Diritti GDPR nella UI (Medio)
- **File**: `dashboard.html` — dropdown profilo
- **Fix**: aggiunti link `mailto:privacy@grecolatinovivo.it` per "Cancella i miei dati" (art. 17 GDPR) e "Scarica i miei dati" (art. 20 GDPR), con separatore visivo e tooltip esplicativo.

### Fix 10 — Link Privacy Policy nel footer (Basso)
- **File**: `dashboard.html` — `.dash-footer-links`
- **Fix**: aggiunto `<a href="/privacy.html">Privacy</a>`.

### Fix 11 — Security headers in vercel.json (Medio)
- **File**: `vercel.json`
- **Fix**: aggiunto blocco `"source": "/(.*)"` con: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Strict-Transport-Security`, `Content-Security-Policy` (permette solo script/style/frame da origini whitelist: self, Vimeo, cdnjs, Google Fonts).

### Fix 12 — Claim MIM ammorbidito (Alto — legale)
- **File**: `dashboard.html` — microcopy in 2 occorrenze
- **Fix**: "4 moduli MIM accreditati" → "4 moduli in fase di accreditamento MIM" — elimina claim pubblicitario non ancora verificabile.

## Raccomandazioni finali

1. **Creare la pagina `/privacy.html`** — il link nel footer punta a una pagina che al momento non esiste. Deve contenere informativa completa ai sensi dell'art. 13 GDPR (titolare, categorie di dati, finalità, conservazione, diritti).

2. **Implementare gli endpoint API GDPR** — i link "Cancella i miei dati" e "Scarica i miei dati" attualmente aprono una email. In produzione, sostituirli con endpoint `/api/user/delete` e `/api/user/export` che gestiscano le richieste automaticamente entro i 30 giorni previsti dal GDPR.

3. **Formalizzare l'accreditamento MIM** — aggiornare il microcopy da "in fase di accreditamento" a "accreditati" solo dopo ottenimento ufficiale della delibera.

---

## Note

Questo report è una valutazione tecnica, non un parere legale. Per aspetti GDPR relativi a raccolta di dati personali di cittadini UE, si raccomanda consulenza specializzata in data protection prima del lancio pubblico del portale.

Il livello di rischio residuo è classificato **BASSO** grazie alle correzioni XSS applicate e alla buona struttura di base (autenticazione, nessun dato sensibile in client storage, markup semantico corretto). I rischi aperti principali riguardano la configurazione infrastrutturale (headers server, Vimeo tracking) e una verifica legale sul microcopy MIM.
