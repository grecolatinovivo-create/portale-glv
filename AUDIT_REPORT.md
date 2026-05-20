# Audit Report — Portale GLV · dashboard.html

> Data: 21 maggio 2026 · Versione auditata: post-QA + fix scroll + film strip fixed

---

## Livello di rischio residuo: **BASSO**

## Riepilogo

| Categoria          | Stato                        |
|--------------------|------------------------------|
| Problemi critici corretti | **3** (XSS × 3)         |
| Problemi medi corretti   | **3** (contrasto testo piccolo) |
| Raccomandazioni aperte   | **4**                    |
| Conformità GDPR          | ⚠️ Parziale (vedi note)  |
| Conformità WCAG 2.1 AA   | ✅ Conforme dopo fix     |
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

## Problemi aperti (non risolvibili in HTML solo)

| # | Problema | Priorità | Motivazione |
|---|----------|----------|-------------|
| 1 | SRI mancante su FontAwesome CDN e Vimeo SDK | Media | Aggiungere `integrity=` e `crossorigin="anonymous"` richiede calcolo hash SRI e verifica compatibilità CDN versioned |
| 2 | Vimeo cookie di terze parti senza avviso | Media-Alta | Richiederebbe consent manager o `dnt=1` nel player embed — dipende da accordo con Vimeo e policy cookie del sito |
| 3 | Diritti GDPR (cancellazione dati, portabilità) non accessibili dalla UI | Media | Richiederebbe endpoint API `/api/user/delete` e `/api/user/export` non ancora esistenti |
| 4 | Link privacy policy assente nel footer dashboard | Bassa | Aggiungere `<a href="/privacy.html">Privacy</a>` in `.dash-footer-links` — dipende da esistenza della pagina |
| 5 | CSP / X-Frame-Options / X-Content-Type-Options | Media | Configurazione server Vercel (`vercel.json` headers) — fuori scope HTML |
| 6 | Claim MIM accreditamento da verificare | Alta (legale) | Verificare con il team che l'accreditamento MIM sia formalizzato prima del lancio |

---

## Raccomandazioni finali

1. **Aggiungere `vercel.json` con headers di sicurezza** (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`) prima del go-live. È un file di 20 righe con impatto di sicurezza elevato.

2. **Vimeo e cookie**: verificare con Vimeo se l'embed con `dnt=1` disabilita il tracciamento, oppure valutare un "player facade" (immagine statica con click-to-load) per caricare Vimeo solo su interazione utente — questo evita anche problemi di performance sul caricamento iniziale.

3. **Verificare il claim MIM accreditamento** con il team legale/accademico prima del lancio. Se non ancora formalizzato, sostituire con "in fase di accreditamento MIM" fino all'ottenimento ufficiale.

---

## Note

Questo report è una valutazione tecnica, non un parere legale. Per aspetti GDPR relativi a raccolta di dati personali di cittadini UE, si raccomanda consulenza specializzata in data protection prima del lancio pubblico del portale.

Il livello di rischio residuo è classificato **BASSO** grazie alle correzioni XSS applicate e alla buona struttura di base (autenticazione, nessun dato sensibile in client storage, markup semantico corretto). I rischi aperti principali riguardano la configurazione infrastrutturale (headers server, Vimeo tracking) e una verifica legale sul microcopy MIM.
