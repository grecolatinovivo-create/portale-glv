# Vista Corso — Pagina singolo corso con animazione in-page
> SPA-view in dashboard.html: le card scivolano fuori schermo, la vista corso entra da destra. URL aggiornato via history.pushState. Test su `breve-marziale`.

---

## 0. Fonti dati

### Dati disponibili e dove trovarli
| Tipo di dato | Fonte | Percorso |
|---|---|---|
| Metadati corso (titolo, descrizione, livello, lang) | DB via API | `GET /api/courses/[slug]` → `course.{title, description, lang, level}` |
| Lista lezioni (titolo, durata, isFree, vimeoUrl) | DB via API | `GET /api/courses/[slug]` → `course.lessons[]` |
| Accesso utente al corso | DB via API | `GET /api/courses/[slug]` → `course.hasAccess` |
| Progresso lezioni del corso | DB via API | `GET /api/progress/course/[slug]` → `{percent, completedLessons, totalLessons, lessons[]}` |
| Daily streak | Da calcolare lato server | Nuovo endpoint `GET /api/progress/streak` (vedi sezione 7) |
| Variabili CSS design system | `public/css/style.css` | `--bg, --gold, --rosso, --surface, --border, --text-muted` |
| Font | Google Fonts (già caricato) | Inter, Playfair Display |
| Corso di test | seed.js riga 137 | slug: `breve-marziale`, 4 lezioni, €29, isAvailable: true |

### Dati mancanti — richiedono input utente
| Dato mancante | Sezione | Placeholder |
|---|---|---|
| Immagine di copertina corso | Header vista corso | Nessuna (usa sfondo gradient con lang color) |
| URL Vimeo reali delle lezioni | Player lezione | `vimeoUrl` è null nel seed — usare iframe placeholder per il test |

---

## 1. Obiettivo e contesto

**Obiettivo**: L'utente può aprire un corso dalla dashboard, vedere l'elenco delle lezioni con il proprio progresso e guardare la prima lezione disponibile — tutto senza ricaricare la pagina, con un'animazione fluida.

**Scope MVP**: solo il corso `breve-marziale` ("Marziale per principianti avanzati", 4 lezioni da 55 min). Se il risultato piace, si replica su tutti i corsi rimuovendo il filtro per slug.

**Contesto tecnico**: Next.js con file HTML statici in `public/`. La dashboard è `public/dashboard.html` con JS vanilla inline. Non si usa React. Non si creano nuovi file HTML — la vista corso è un layer che si sovrappone/sostituisce il catalogo dentro la stessa pagina.

---

## 2. Utenti target

**Abbonato attivo** — ha pagato, ha `hasAccess: true`, vede tutte le lezioni con player Vimeo.

**Visitatore non loggato / senza abbonamento** — vede le prime 2 lezioni gratuite (`isFree: true`) con player attivo; le altre mostrano un lock con CTA "Abbonati".

---

## 3. Requisiti funzionali

1. Cliccando una card corso nella dashboard, tutte le card scivolano fuori dallo schermo verso sinistra e la vista corso entra da destra.
2. La vista corso mostra: titolo, lang, level, descrizione breve, barra progresso corso (N/M lezioni), daily streak.
3. La vista corso mostra la lista completa delle lezioni con stato per ciascuna: completata ✓ | corrente (prossima da fare) ▶ | libera (free) | bloccata (requires access).
4. Cliccando una lezione disponibile, il player Vimeo si apre inline sotto la lista (o in un pannello dedicato) e riproduce il video dalla posizione `resumeAt`.
5. Il tasto "← Torna ai corsi" (o il tasto Back del browser) fa rientrare la vista corso da destra e fa riapparire le card da sinistra.
6. L'URL si aggiorna a `?corso=breve-marziale` all'apertura e torna alla root alla chiusura (history.pushState / popstate).
7. Se l'utente arriva direttamente con `?corso=breve-marziale` nell'URL (es. link condiviso), la vista corso si apre immediatamente senza animazione.
8. Il progresso (secondi guardati, completed) viene salvato in tempo reale tramite `POST /api/progress/update` durante la riproduzione Vimeo.
9. Le lezioni bloccate mostrano un overlay "Sblocca con un abbonamento" con link a `#prezzi` — non mostrano il player.
10. Su mobile la vista corso è full-width con lista lezioni in verticale e player sopra.

---

## 4. Vincoli e rischi

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| vimeoUrl null nel seed (test con URL reale assente) | Alta | Alto | Usare iframe placeholder o un URL Vimeo pubblico di test per le 4 lezioni di `breve-marziale` |
| Animazione che sfarfalla su mobile | Media | Medio | Usare `will-change: transform` + `transform: translateX` (no left/right) |
| Back button browser comportamento inatteso | Media | Alto | Gestire evento `popstate` con lo stesso handler dell'animazione |
| Progresso non salvato se utente chiude tab durante riproduzione | Bassa | Medio | Salvataggio periodico ogni 10s via Vimeo Player API timeupdate |

---

## 5. Stack tecnologico

Invariato rispetto al progetto esistente:
```
Rendering:    HTML statico in public/ (Next.js serve i file as-is)
Logic:        JavaScript vanilla inline (no framework)
Styling:      CSS custom properties (design system esistente in style.css)
Video:        Vimeo Player JS SDK (CDN) — già compatibile con iframe embed
API:          Next.js API routes esistenti + 1 nuovo endpoint (streak)
Animation:    CSS transform + transition (no GSAP, no librerie esterne)
```

---

## 6. Struttura — file modificati e nuovi

```
public/
  dashboard.html          ← MODIFICA: aggiunge vista corso e logica SPA
  css/
    style.css             ← MODIFICA: aggiunge classi animazione e vista corso

pages/api/
  progress/
    streak.js             ← NUOVO: calcola daily streak dell'utente
```

Nessun nuovo file HTML. Nessuna nuova pagina. Tutto vive in `dashboard.html`.

---

## 7. Schema database — nessuna modifica

Il daily streak si calcola dinamicamente dall'endpoint `/api/progress/streak` leggendo i record `LessonProgress.updatedAt` — nessuna colonna nuova nel DB.

**Logica streak**:
```
1. Recupera tutti i LessonProgress dell'utente (updatedAt)
2. Raggruppa per giorno (data UTC)
3. Ordina i giorni decrescente a partire da oggi
4. Conta quanti giorni consecutivi hanno almeno 1 record aggiornato
5. Se oggi non ha attività, streak parte da ieri (non si azzera il giorno corrente)
```
Risposta: `{ streak: N, lastActivityDate: ISO }`

---

## 8. Design system — aggiunte per la vista corso

Usa SOLO le variabili CSS già esistenti. Nessun nuovo colore hardcoded.

```css
/* variabili già esistenti usate dalla vista corso */
--bg:          #0a0a0a   (sfondo pagina)
--surface:     #141414   (card, pannelli)
--border:      #2a2a2a   (separatori)
--gold:        #c9962a   (accenti, badge, barra progresso)
--gold-lt:     #e8c875   (hover gold)
--rosso:       #a01a36   (CTA, badge livello)
--text:        #f5f5f5   (testo principale)
--text-muted:  rgba(245,245,245,.55)  (testo secondario)
```

**Animazione di transizione** (da aggiungere in style.css):
```css
.catalog-view, .course-view {
  will-change: transform;
  transition: transform 0.42s cubic-bezier(0.4, 0, 0.2, 1),
              opacity   0.42s cubic-bezier(0.4, 0, 0.2, 1);
}
/* Catalog esce a sinistra */
.catalog-view.slide-out-left  { transform: translateX(-100%); opacity: 0; }
/* Course entra da destra */
.course-view.slide-in-right   { transform: translateX(0);    opacity: 1; }
.course-view.offscreen-right  { transform: translateX(100%); opacity: 0; }
```

**Barra progresso corso**:
```css
.course-progress-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
}
.course-progress-bar__fill {
  height: 100%;
  background: var(--gold);
  border-radius: 2px;
  transition: width 0.6s ease;
}
```

**Daily streak badge**:
```css
.streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--gold);
  border: 1px solid rgba(201,150,42,.3);
  border-radius: 20px;
  padding: 4px 12px;
}
```

**Stato lezione** (icone SVG inline, niente emoji):
- Completata: checkmark SVG verde (#3db05b)
- Corrente/prossima: triangolo play SVG (--gold)
- Libera non completata: cerchio vuoto
- Bloccata: lucchetto SVG (--text-muted)

---

## 9. Wireframe — Vista corso

```
┌─────────────────────────────────────────────────────────────┐
│ NAV (invariata — logo + profilo + hamburger)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ← Torna ai corsi                                           │
│                                                             │
│  [CORSI BREVI]  [AUTORI LATINI]   ← badge lang + level     │
│  Marziale per principianti avanzati                         │
│  Ironia e critica della società del benessere               │
│  negli Epigrammi. 4 ore.                                    │
│                                                             │
│  ████████████████░░░░░░  2/4 lezioni   🔥 3 giorni         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  LEZIONI                                                    │
│                                                             │
│  ✓  Lezione 1 — Introduzione      55 min  [FREE]           │
│  ▶  Lezione 2 — Gli Epigrammi     55 min  [FREE]  ← focus  │
│  ○  Lezione 3 — Ironia e società  55 min                   │
│  🔒  Lezione 4 — Letture scelte    55 min  ← se no access  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  PLAYER ATTIVO (visibile solo quando lezione selezionata)  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │           [ Vimeo iframe 16:9 ]                    │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  Lezione 2 — Gli Epigrammi di Marziale                     │
│  55 min · Riparte da 12:30  [← Prec]  [Succ →]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Vista mobile (< 768px)**:
```
┌────────────────────────┐
│ NAV (hamburger)        │
├────────────────────────┤
│ ← Torna ai corsi       │
│ [BADGE] [BADGE]        │
│ Titolo corso           │
│ Descrizione            │
│ ████░░  2/4  🔥 3gg   │
├────────────────────────┤
│ PLAYER (full-width)    │
│ [ Vimeo 16:9 ]        │
│ Lezione 2 — titolo     │
├────────────────────────┤
│ LEZIONI (lista)        │
│ ✓ Lezione 1   55m      │
│ ▶ Lezione 2   55m      │
│ ○ Lezione 3   55m      │
│ 🔒 Lezione 4  55m      │
└────────────────────────┘
```

---

## 10. Flussi utente

### Flusso A — Apertura corso dalla dashboard

```
Dashboard (catalogo cards)
  ↓ utente clicca card "Marziale per principianti avanzati"
  
  [JS] openCourseView('breve-marziale')
    ↓ fetch GET /api/courses/breve-marziale
    ↓ fetch GET /api/progress/course/breve-marziale
    ↓ fetch GET /api/progress/streak
    ↓ history.pushState({corso:'breve-marziale'}, '', '?corso=breve-marziale')
    
    → Animazione: .catalog-view aggiunge .slide-out-left
    → .course-view rimuove .offscreen-right (→ slide in da destra)
    
    ↓ Render: header corso, barra progresso, streak, lista lezioni
    ↓ Auto-seleziona la "nextLesson" (prima non completata) — apre player
    
  Utente è nella vista corso, URL = ?corso=breve-marziale
```

### Flusso B — Riproduzione lezione

```
Vista corso (lista lezioni)
  ↓ utente clicca "Lezione 2"
  
  → Player Vimeo si carica (iframe) con vimeoUrl della lezione
  → Vimeo SDK: timeupdate ogni 10s → POST /api/progress/update
  → Al 90% del video: lezione marcata completed
  
  ↓ Fine video → lezione successiva auto-highlighted nella lista
  ↓ Barra progresso aggiornata live
```

### Flusso C — Ritorno al catalogo

```
Vista corso
  ↓ utente clicca "← Torna ai corsi" O premi Back nel browser
  
  [JS] closeCourseView()
    ↓ history.pushState({}, '', location.pathname) se da click
    ↓ da popstate: stesso handler
    
    → Animazione inversa: .course-view aggiunge .offscreen-right
    → .catalog-view rimuove .slide-out-left
    
  Utente torna al catalogo, URL = /dashboard.html
```

### Flusso D — Accesso diretto via URL con ?corso=breve-marziale

```
Browser carica /dashboard.html?corso=breve-marziale
  ↓ Auth check (come normale)
  ↓ DOMContentLoaded → legge URLSearchParams
  → Se 'corso' è presente: openCourseView(slug) senza animazione (skipAnimation: true)
```

### Flusso E — Lezione bloccata (utente senza accesso)

```
Vista corso (lista lezioni)
  ↓ utente clicca "Lezione 3" (bloccata, no access)
  
  → Player NON si apre
  → Appare overlay/toast: "Questa lezione richiede un abbonamento"
  → CTA: "Scopri i piani →" link a /index.html#prezzi
```

---

## 11. Componenti condivisi

| Componente | Usato in | Note |
|---|---|---|
| NAV (header) | dashboard.html — entrambe le viste | Rimane visibile in entrambe le viste |
| Toast notification | Tutto dashboard.html | `showToast()` già esistente |
| Auth check / getUser() | Entrambe le viste | Già implementato |

---

## 12. Checklist di coerenza — TUTTI GLI AGENT LA CONSULTANO

```
□ Nessun nuovo colore hardcoded — usare SOLO variabili CSS esistenti
□ Font Inter per tutti i testi nella vista corso
□ Animazioni disabilitate con @media (prefers-reduced-motion: reduce) — già presente in style.css
□ Il tasto "← Torna ai corsi" è sempre visibile e raggiungibile da tastiera
□ Il player Vimeo NON parte automaticamente senza interazione utente
□ Le lezioni free (isFree: true) sono sempre accessibili senza auth
□ Le lezioni bloccate NON mostrano mai il vimeoUrl (già gestito dall'API)
□ history.pushState aggiorna URL ma NON causa reload
□ L'evento popstate (Back browser) usa la stessa animazione inversa di closeCourseView()
□ La vista corso è fullscreen (100vw/100vh del container dashboard, non una modal)
□ Su mobile la lista lezioni scorre verticalmente senza scroll orizzontale
□ Il player Vimeo è responsive (padding-bottom: 56.25% trick o aspect-ratio: 16/9)
□ Il progresso streak mostra "0 giorni" se non c'è attività (non undefined)
□ La sezione corso è SOLO per slug 'breve-marziale' nel test (feature flag o slug check)
□ Nessuna emoji nel codice HTML — usare SVG inline per icone (check, play, lock)
□ WCAG: contrasto sufficiente per testo lezione su --surface (#141414)
□ WCAG: focus visibile su tutti gli elementi interattivi della lista lezioni
```

---

## 13. Roadmap

### MVP (questo sprint) — solo breve-marziale
| Feature | Criterio |
|---|---|
| Animazione catalog → corso | Cards scivolano a sinistra, corso entra da destra in 420ms |
| Header corso (titolo, badge, descrizione) | Dati reali da API |
| Barra progresso corso | N/M lezioni, % corretta da API |
| Daily streak badge | Numero giorni consecutivi da API /progress/streak |
| Lista lezioni con stati | Completata/Corrente/Libera/Bloccata con icone SVG |
| Player Vimeo inline | Apre al click sulla lezione, rispetta resumeAt |
| Salvataggio progresso | POST /api/progress/update ogni 10s + al 90% |
| Back button / tasto Torna | Animazione inversa, URL ripristinato |
| URL pushState | ?corso=breve-marziale aggiornato e leggibile |

### Fase 2 — dopo approvazione
- Rimuovere il filtro slug → abilitare su tutti i corsi
- Nota "prossima lezione" (continua da dove hai lasciato) nel card del corso nel catalogo
- Attestato automatico al completamento del corso (già supportato dall'API)

### Tech debt MVP
- Il player Vimeo usa `vimeoUrl: null` dal seed — le lezioni di test avranno bisogno di URL reali o un placeholder. Developer: usare un iframe con URL Vimeo pubblico hardcoded per il test, documentarlo in TECH_NOTES.

---

## 15. Assunzioni

1. Le lezioni di `breve-marziale` nel DB hanno `vimeoUrl: null` (seed non popola URL reali). Il Developer deve usare un URL Vimeo pubblico di placeholder per le 4 lezioni.
2. Il daily streak a 0 è una condizione valida e deve essere mostrata (non nascosta).
3. La NAV rimane visibile durante la vista corso — non diventa fullscreen-modal.
4. `@media (prefers-reduced-motion: reduce)` già presente in style.css — disabilita le animazioni di transizione, la vista corso si apre direttamente senza slide.
5. Il test è solo su `breve-marziale` per decisione dell'utente — il codice deve essere facilmente estendibile senza refactor.
