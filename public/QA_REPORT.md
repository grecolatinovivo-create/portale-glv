# QA Report — Design System v3 GLV
**Data:** 17 maggio 2026
**QA Engineer:** Agent QA Senior

---

## Pagine verificate

| Pagina | Font corretto | CSS v3 | Navbar v3 | Bottom Nav | JS Hooks | Mobile |
|---|---|---|---|---|---|---|
| index.html | ✅ Playfair+Inter | ✅ | ✅ nav-inner | ✅ | N/A | ✅ |
| dashboard.html | ✅ | ✅ | ✅ | ✅ | ✅ row-IDs | ✅ |
| catalogo.html | ✅ | ✅ | ✅ | ✅ | ✅ #catalog-grid | ✅ |
| corso.html | ✅ | ✅ | ✅ | ✅ | ✅ js-corso-* | ✅ |
| profilo.html | ✅ | ✅ | ✅ | ✅ | N/A | ✅ |

---

## Problemi trovati e corretti

### 1. Variabili CSS mancanti (CRITICO — CORRETTO)
**Problema:** Le pagine v3 usano `--radius`, `--radius-lg`, `--font-heading`, `--font-body`, `--primary-50..300`, `--text-400/600/800` — variabili non definite in style.css.
**Correzione:** Aggiunto blocco alias in `:root` di style.css con tutte le variabili mancanti.

### 2. Struttura navbar incompatibile (CRITICO — CORRETTO)
**Problema:** style.css definiva `.glv-nav` con `padding: 0 48px` senza `.nav-inner`. Le nuove pagine usano la struttura `<nav><div class="nav-inner">...`.
**Correzione:** Refactored `.glv-nav` per supportare `.nav-inner` come wrapper, con layout centrato max-width 1280px.

### 3. Classi navbar mancanti (CRITICO — CORRETTO)
**Problema:** `.nav-hamburger`, `.nav-link`, `.nav-actions`, `.nav-logo-icon` non definite in CSS.
**Correzione:** Aggiunte tutte le classi con stili completi incluso hamburger animato.

### 4. Hamburger menu — nessun responsive (ALTO — CORRETTO)
**Problema:** `.nav-links` non collassava su mobile, hamburger non appariva.
**Correzione:** Aggiunto `@media (max-width: 768px)` con display:none/flex per `.nav-links` e display:flex per `.nav-hamburger`.

### 5. Bottom nav — classi .bottom-nav-item/.bottom-nav-icon mancanti (ALTO — CORRETTO)
**Problema:** Le 4 pagine usano queste classi ma non erano in style.css.
**Correzione:** Aggiunte con stili completi: flex column, color, hover, .active state.

### 6. Footer v3 — classi mancanti (MEDIO — CORRETTO)
**Problema:** index.html usa `.footer-logo`, `.footer-tagline`, `.footer-social`, `.footer-col-title`, `.footer-links` — non presenti nel CSS.
**Correzione:** Aggiunte dopo il blocco footer esistente come "footer v3 alias".

### 7. .mobile-sticky-cta.visible mancante (BASSO — CORRETTO)
**Problema:** corso.html usa `.mobile-sticky-cta.visible` per mostrare il CTA su scroll ma la classe non esisteva.
**Correzione:** Aggiunta regola `.mobile-sticky-cta.visible { display: block; }`.

---

## Verifica hook JS (app.js)

| Classe/ID | Presente in CSS | Note |
|---|---|---|
| `.course-card` | ✅ riga 423 | Con hover lift |
| `.card-thumb` / `.card-thumb-gradient` | ✅ | 16:9, emoji centered |
| `.card-progress` / `.card-progress-bar` | ✅ | Con shimmer animation |
| `.card-title` / `.card-meta` | ✅ | Playfair + Inter |
| `.card-btn-play` / `.card-btn-add` | ✅ | Stili completi |
| `.card-locked` / `.card-ribbon` | ✅ | |
| `.catalog-filters` / `.filter-tab` | ✅ | Con .active state |
| `#catalog-grid` | Stile via `.course-grid` | ✅ compatibile |
| `.section-row` / `.row-header` / `.row-title` | ✅ | Dashboard layout |
| `.courses-row` | ✅ | Scroll orizzontale |
| `.js-corso-*` | N/A CSS | Manipolati via JS |
| `.glv-nav` / `.nav-avatar-initials` | ✅ | |
| `.glv-footer` / `.glv-bottom-nav` | ✅ | |

---

## Consistenza cross-page

- ✅ Tutte le pagine linkano `css/style.css` (un solo file CSS)
- ✅ Tutte le pagine importano Playfair Display + Inter (o tramite CSS o direttamente)
- ✅ Navbar identica su tutte le pagine (`nav-inner` wrapper, logo, links, actions)
- ✅ Bottom nav presente su tutte le pagine con item attivo corretto
- ✅ Palette colori coerente: bordeaux `#a01a36`, gold `#d4a017`, ivory `#faf8f5`
- ✅ Token system backward-compatible con app.js (`--accent`, `--text-primary`, gradients)

---

## Punti aperti (non bloccanti)

1. **login.html / registrazione.html** — non aggiornate al design v3 (fuori scope originale)
2. **app.js initDashboard** — dashboard.html ha un doppio auth check (inline + app.js). Non rompe nulla.
3. **Video player** — corso.html ha placeholder per video reale; richiede URL video da backend
4. **Prezzi** — index.html mostra prezzi statici; richiedono integrazione Stripe/backend per pricing dinamico
5. **Offline app** — citata come "in arrivo" su index.html; da implementare separatamente

---

## Verdict

**🟢 APPROVATO per deploy**

Il sistema di design è coeso, le pagine sono cross-consistenti, tutti gli hook JS sono preservati, la responsività è completa. I punti aperti sono miglioramenti futuri non bloccanti per il rilascio.
