# UX_SPEC_CORSO.md — Vista Corso
## Portale GrecoLatinoVivo · Sprint MVP (breve-marziale)
> Riferimento: CORSO_VIEW_README.md · Design system: public/css/style.css
> Tutti i valori usano esclusivamente variabili CSS esistenti. Nessun colore hardcoded.

---

## 1. Animazione di transizione: Catalogo → Corso

### Parametri di timing

| Parametro | Valore |
|---|---|
| Durata totale | 420ms |
| Easing | `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design standard — accelerazione rapida, frenata morbida) |
| Proprietà animate | `transform: translateX(...)` + `opacity` |
| Hardware acceleration | `will-change: transform` dichiarato a riposo su entrambe le viste |

### CSS da aggiungere in `public/css/style.css`

```css
/* ── Vista corso — contenitori principali ────────────────────────── */
.catalog-view,
.course-view {
  position: absolute;
  inset: 0;
  will-change: transform;
  transition: transform 0.42s cubic-bezier(0.4, 0, 0.2, 1),
              opacity   0.42s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Stato riposo catalog: visibile */
.catalog-view {
  transform: translateX(0);
  opacity: 1;
}

/* Catalog esce a sinistra */
.catalog-view.slide-out-left {
  transform: translateX(-100%);
  opacity: 0;
  pointer-events: none;
}

/* Corso fuori schermo a destra (stato iniziale) */
.course-view.offscreen-right {
  transform: translateX(100%);
  opacity: 0;
  pointer-events: none;
}

/* Corso entra — stato visibile */
.course-view.slide-in-right {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

/* Animazione inversa — corso torna a destra */
.course-view.slide-out-right {
  transform: translateX(100%);
  opacity: 0;
  pointer-events: none;
}

/* ── prefers-reduced-motion: nessuna animazione ─────────────────── */
@media (prefers-reduced-motion: reduce) {
  .catalog-view,
  .course-view {
    transition: none !important;
  }
}
```

### Sequenza JS per apertura

```
1. .course-view ottiene classe .offscreen-right (posizione iniziale, fuori destra)
2. rAF: aggiunge .slide-in-right → rimuove .offscreen-right
3. Contemporaneamente: .catalog-view aggiunge .slide-out-left
4. Dopo 420ms (o transitionend): .catalog-view → display:none (evita tab-order)
```

### Accesso diretto via URL (`?corso=breve-marziale`)

Quando `skipAnimation: true`, aggiungere entrambe le classi di stato finale senza transition:

```js
catalogView.style.transition = 'none';
courseView.style.transition = 'none';
// applicare stati finali immediatamente
```

---

## 2. Layout vista corso — Desktop e Mobile

### Desktop (>= 768px)

```
┌─────────────────────────────────────────────────────────┐
│  NAV (height: var(--nav-height) = 64px)                  │
├─────────────────────────────────────────────────────────┤
│  .course-view  padding: 32px 24px                        │
│  max-width: var(--container) = 1240px; margin: 0 auto   │
│                                                          │
│  ┌──── .course-header ─────────────────────────────┐    │
│  │  ← Torna ai corsi (back button)                  │    │
│  │  Badge lang + Badge level                        │    │
│  │  Titolo corso (Inter 700, 28px)                  │    │
│  │  Descrizione (Inter 400, 15px, --text-secondary) │    │
│  │  Barra progresso + streak                        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──── .lesson-list ───────────────────────────────┐    │
│  │  Heading "LEZIONI" (Inter 600, 11px, uppercase)  │    │
│  │  Ogni riga .lesson-row                           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──── .player-section ────────────────────────────┐    │
│  │  Titolo lezione attiva                           │    │
│  │  iframe Vimeo (16:9)                             │    │
│  │  Navigazione prec / succ                         │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Proporzioni desktop**: tutto in colonna singola centrata, max-width 860px per la zona corso (leggibilità ottimale). Non a due colonne — la lista lezioni precede il player.

**Spaziature chiave desktop**:
- Padding esterno `.course-view`: `40px 24px`
- Gap tra `.course-header` e `.lesson-list`: `32px`
- Gap tra `.lesson-list` e `.player-section`: `32px`
- Padding interno `.course-header`: `24px`
- Background `.course-header`: `var(--surface)` = `#141414`
- Border-radius `.course-header`: `var(--r-lg)` = `10px`
- Border `.course-header`: `1px solid var(--border)`

### Mobile (< 768px)

```
┌────────────────────────┐
│ NAV (64px, hamburger)  │
├────────────────────────┤
│ .course-view           │
│ padding: 16px          │
│                        │
│ ← Torna ai corsi       │
│ [BADGE] [BADGE]        │
│ Titolo corso           │
│ Descrizione            │
│ Barra prog + streak    │
├────────────────────────┤
│ PLAYER (se attivo)     │
│ 16:9 full-width        │
│ Titolo lezione         │
│ [← Prec] [Succ →]     │
├────────────────────────┤
│ LEZIONI                │
│ lista verticale        │
└────────────────────────┘
```

**Differenze mobile**:
- Padding `.course-view`: `16px`
- Il player appare **sopra** la lista lezioni (invertito rispetto al desktop)
- Font titolo corso: `22px` (vs 28px desktop)
- Nessun scroll orizzontale — lista lezioni sempre in colonna singola

---

## 3. Header corso

### Struttura HTML

```html
<section class="course-header">
  <button class="back-btn" aria-label="Torna al catalogo corsi">
    <!-- SVG freccia sinistra -->
    Torna ai corsi
  </button>

  <div class="course-badges">
    <span class="badge badge--lang">LATINO</span>   <!-- o GRECO, EGIZIANO, EBRAICO -->
    <span class="badge badge--level">INTERMEDIO</span>
  </div>

  <h1 class="course-title">Marziale per principianti avanzati</h1>
  <p class="course-description">
    Ironia e critica della società del benessere negli Epigrammi. 4 ore.
  </p>

  <div class="course-meta-bar">
    <!-- Barra progresso (sezione 4) -->
    <!-- Streak badge (sezione 5) -->
  </div>
</section>
```

### Tipografia

| Elemento | Font | Peso | Dimensione | Colore |
|---|---|---|---|---|
| Titolo corso (H1) | **Inter** | 700 | 28px desktop / 22px mobile | `var(--text-primary)` |
| Descrizione | Inter | 400 | 15px | `var(--text-secondary)` |
| Badge lang | Inter | 600 | 11px uppercase | testo `var(--bg)` su bg lingua (see colori gradiente lang) |
| Badge level | Inter | 600 | 11px uppercase | `var(--text-primary)` su `var(--bg-card-2)` |

**Nota tipografica**: Il titolo usa **Inter 700** (non Playfair Display) per coerenza con il resto della dashboard. Playfair Display è riservato a heading di marketing del sito pubblico. Nella dashboard il testo è sempre Inter.

### Badge lingua — colori di background

| Lingua | Background badge |
|---|---|
| LATINO | `var(--primary)` = `#a01a36` |
| GRECO | `#1a3aaa` (variabile `--greco-b`) |
| EGIZIANO | `#b84010` (variabile `--egiziano-b`) |
| EBRAICO | `#0f7a38` (variabile `--ebraico-b`) |

### Comportamento mobile

- `.course-badges` passa a `flex-wrap: wrap; gap: 6px`
- Titolo H1 ridotto a 22px
- La descrizione si tronca con `display: -webkit-box; -webkit-line-clamp: 3` se superiore a 3 righe

---

## 4. Barra progresso corso

### CSS

```css
.course-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.course-progress-label {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.course-progress-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.course-progress-bar__fill {
  height: 100%;
  background: var(--gold);
  border-radius: 2px;
  transition: width 0.6s ease;
  /* JS imposta: style="width: {percent}%" */
}
```

### Label

Formato: **`2/4 lezioni · 50%`**

- N = `completedLessons` da `GET /api/progress/course/[slug]`
- M = `totalLessons`
- X% = `percent` (già calcolato dall'API)

Struttura label:

```html
<div class="course-progress-label">
  <span>2/4 lezioni</span>
  <span>50%</span>
</div>
```

### Animazione fill

Alla prima apertura della vista corso, la barra parte da 0 e raggiunge il valore reale in 600ms (`transition: width 0.6s ease`). Si ottiene impostando `width: 0` nell'HTML iniziale e poi, dopo 50ms di delay (per garantire che il DOM sia renderizzato), aggiornando via JS al valore reale.

---

## 5. Streak badge

### CSS

```css
.streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--gold);
  border: 1px solid rgba(201, 150, 42, 0.3);
  border-radius: var(--r-full);
  padding: 4px 12px;
  background: rgba(201, 150, 42, 0.06);
  white-space: nowrap;
}
```

### SVG flame inline (esatto — da inserire dentro .streak-badge)

```html
<svg
  class="streak-icon"
  width="14"
  height="14"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <path
    d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-3-2-6-2-6s-1 2-2 2c0 0 1-4-1-7Z"
    fill="var(--gold)"
  />
  <path
    d="M12 17a2 2 0 0 1-2-2c0-1.5 2-3 2-3s2 1.5 2 3a2 2 0 0 1-2 2Z"
    fill="var(--bg)"
    opacity="0.6"
  />
</svg>
```

### Struttura HTML completa badge

```html
<span class="streak-badge">
  <svg class="streak-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-3-2-6-2-6s-1 2-2 2c0 0 1-4-1-7Z" fill="var(--gold)"/>
    <path d="M12 17a2 2 0 0 1-2-2c0-1.5 2-3 2-3s2 1.5 2 3a2 2 0 0 1-2 2Z" fill="var(--bg)" opacity="0.6"/>
  </svg>
  <span>3 giorni</span>
</span>
```

**Caso streak = 0**: mostrare comunque il badge con testo "0 giorni" (non nascondere).

---

## 6. Lista lezioni

### Dimensioni e spaziature riga

| Proprietà | Valore |
|---|---|
| Altezza minima riga | `64px` |
| Padding riga | `14px 16px` |
| Gap tra icona e testo | `12px` |
| Background riga riposo | `var(--surface)` = `#141414` |
| Background riga hover | `var(--bg-card-2)` = `#1c1c1c` |
| Background riga corrente (nextLesson) | `rgba(201,150,42,0.06)` + bordo sinistro `3px solid var(--gold)` |
| Separatore tra righe | `1px solid var(--border)` |
| Border-radius lista | `var(--r-md)` = `6px` (solo ai bordi esterni) |

### Struttura HTML riga

```html
<button class="lesson-row lesson-row--[stato]" data-lesson-id="..." aria-label="Lezione 2 — Gli Epigrammi, 55 minuti">
  <span class="lesson-icon" aria-hidden="true">
    <!-- SVG stato -->
  </span>
  <span class="lesson-info">
    <span class="lesson-title">Lezione 2 — Gli Epigrammi</span>
    <span class="lesson-duration">55 min</span>
  </span>
  <span class="lesson-badge-free">FREE</span>  <!-- solo se isFree: true -->
</button>
```

### Icone SVG per stato (14×14px, viewBox="0 0 16 16")

**Completata** — checkmark verde (#3db05b):
```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-label="Completata">
  <circle cx="8" cy="8" r="7" fill="#3db05b" opacity="0.15"/>
  <circle cx="8" cy="8" r="7" stroke="#3db05b" stroke-width="1.5"/>
  <path d="M5 8l2 2 4-4" stroke="#3db05b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Corrente / prossima** — triangolo play oro (var(--gold)):
```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-label="Lezione corrente">
  <circle cx="8" cy="8" r="7" fill="var(--gold)" opacity="0.12"/>
  <circle cx="8" cy="8" r="7" stroke="var(--gold)" stroke-width="1.5"/>
  <path d="M6.5 5.5l4 2.5-4 2.5V5.5Z" fill="var(--gold)"/>
</svg>
```

**Libera non completata** — cerchio vuoto:
```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-label="Disponibile">
  <circle cx="8" cy="8" r="7" stroke="var(--border-mid)" stroke-width="1.5"/>
</svg>
```

**Bloccata** — lucchetto grigio (var(--text-muted)):
```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-label="Bloccata">
  <rect x="4" y="7" width="8" height="6" rx="1" stroke="var(--text-muted)" stroke-width="1.5"/>
  <path d="M6 7V5.5a2 2 0 0 1 4 0V7" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="8" cy="10" r="1" fill="var(--text-muted)"/>
</svg>
```

### Tipografia riga

| Elemento | Font | Peso | Dimensione | Colore |
|---|---|---|---|---|
| Titolo lezione | Inter | 500 | 14px | `var(--text-primary)` |
| Durata | Inter | 400 | 13px | `var(--text-muted)` |
| Badge FREE | Inter | 600 | 10px uppercase | `var(--gold)` su `rgba(201,150,42,0.1)`, border `1px solid rgba(201,150,42,0.3)`, padding `2px 6px`, border-radius `var(--r-sm)` |

### Stato corrente (nextLesson)

La riga corrispondente a `nextLesson` (prima lezione non completata) riceve all'apertura della vista corso:
- Classe `.lesson-row--current`
- Bordo sinistro `3px solid var(--gold)`
- Background `rgba(201,150,42,0.06)`
- Il titolo è in peso 600 invece di 500

---

## 7. Player Vimeo

### Posizionamento

Il player è **inline sotto la lista lezioni** (non pannello fisso laterale, non modal). Sul mobile appare sopra la lista. Visibile solo quando una lezione è selezionata (`.player-section` con `display: none` di default, diventa `display: block` al click su una lezione disponibile).

### Struttura HTML

```html
<section class="player-section" hidden>
  <h2 class="player-lesson-title">Lezione 2 — Gli Epigrammi di Marziale</h2>
  <div class="player-wrapper">
    <iframe
      id="vimeo-player"
      src="https://player.vimeo.com/video/[VIDEO_ID]?api=1&player_id=vimeo-player"
      width="100%"
      height="100%"
      frameborder="0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
      title="Lezione 2 — Gli Epigrammi di Marziale"
    ></iframe>
  </div>
  <div class="player-nav">
    <button class="player-nav__prev" aria-label="Lezione precedente">
      <!-- SVG freccia sinistra 16px -->
      Precedente
    </button>
    <button class="player-nav__next" aria-label="Lezione successiva">
      Successiva
      <!-- SVG freccia destra 16px -->
    </button>
  </div>
</section>
```

### CSS responsive player

```css
.player-lesson-title {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.player-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: var(--r-md);
  overflow: hidden;
}

.player-wrapper iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.player-nav {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.player-nav__prev,
.player-nav__next {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 8px 14px;
  cursor: pointer;
  transition: color var(--t-fast), border-color var(--t-fast);
}

.player-nav__prev:hover,
.player-nav__next:hover {
  color: var(--text-primary);
  border-color: var(--border-mid);
}

.player-nav__prev:disabled,
.player-nav__next:disabled {
  opacity: 0.35;
  cursor: default;
}
```

**Nota**: Il player NON parte automaticamente. L'autoplay è disabilitato — l'utente fa play manualmente. Se `resumeAt` è presente, si usa l'API Vimeo (`player.setCurrentTime(resumeAt)`).

---

## 8. Stato locked

### Comportamento al click

Click su `.lesson-row--locked` non apre il player. Appare un toast oppure un inline-banner sotto la riga cliccata.

### Inline banner (preferito rispetto a toast — più stabile su mobile)

```html
<div class="locked-banner" role="alert">
  <svg ...> <!-- lucchetto 16px, var(--text-muted) --> </svg>
  <span>Questa lezione richiede un abbonamento</span>
  <a href="/index.html#prezzi" class="locked-banner__cta">
    Scopri i piani
    <!-- SVG freccia destra 12px -->
  </a>
</div>
```

### CSS

```css
.locked-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(160, 26, 54, 0.08);
  border: 1px solid rgba(160, 26, 54, 0.2);
  border-radius: var(--r-sm);
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0 8px;
}

.locked-banner__cta {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  font-size: 13px;
  color: var(--gold);
  text-decoration: none;
  white-space: nowrap;
}

.locked-banner__cta:hover {
  color: var(--gold-lt);
}
```

### Overlay sulla riga (opzionale — se si vuole stile visivo più marcato)

Le righe con `hasAccess: false` E `isFree: false` ricevono classe `.lesson-row--locked`:
- Opacità titolo: 0.45
- Cursor: `default` (non pointer)
- Icona: lucchetto SVG grigio

---

## 9. Back button

### Posizionamento e stile

Primo elemento dentro `.course-view`, prima dei badge e del titolo. Distanza dal top della vista corso: `0px` (il padding del contenitore ci pensa). Distanza dal bordo sinistro del contenitore: `0px`.

### CSS

```css
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  background: none;
  border: none;
  padding: 6px 0;
  cursor: pointer;
  margin-bottom: 20px;
  transition: color var(--t-fast);
}

.back-btn:hover {
  color: var(--text-primary);
}

.back-btn:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 4px;
  border-radius: var(--r-xs);
}
```

### SVG freccia back (16px)

```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### Comportamento

- Click su `.back-btn` chiama `closeCourseView()` in JS
- `closeCourseView()` esegue `history.pushState({}, '', location.pathname)` (rimuove `?corso=...`)
- Poi esegue animazione inversa: `.course-view` aggiunge `.slide-out-right`, `.catalog-view` rimuove `.slide-out-left`
- Accessibilità: `tabindex="0"`, `aria-label="Torna al catalogo corsi"`, visibile al focus con outline `var(--gold)`

---

## 10. Comportamento URL

### Apertura corso

```js
history.pushState(
  { corso: 'breve-marziale' },
  '',
  '?corso=breve-marziale'
);
```

Viene chiamato **dopo** l'inizio dell'animazione (non prima, per evitare micro-delay visivo).

### Chiusura corso (click back button)

```js
history.pushState(
  {},
  '',
  location.pathname  // → /dashboard.html senza query string
);
```

### Gestione popstate (Back browser)

```js
window.addEventListener('popstate', (e) => {
  const params = new URLSearchParams(location.search);
  if (params.has('corso')) {
    // Apri vista corso senza pushState (già nella history)
    openCourseView(params.get('corso'), { pushState: false });
  } else {
    // Chiudi vista corso senza pushState
    closeCourseView({ pushState: false });
  }
});
```

### Accesso diretto via URL

```js
// In DOMContentLoaded, dopo auth check:
const params = new URLSearchParams(location.search);
if (params.has('corso')) {
  openCourseView(params.get('corso'), { skipAnimation: true, pushState: false });
}
```

### Validazione slug (MVP)

Per il test MVP, accettare solo `breve-marziale`. Se lo slug non è riconosciuto, ignorare il parametro e mostrare il catalogo normale.

```js
const ALLOWED_SLUGS = ['breve-marziale']; // rimuovere questo check nella fase 2
if (!ALLOWED_SLUGS.includes(slug)) return;
```
