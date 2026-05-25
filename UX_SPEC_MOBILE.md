# UX Spec — Mobile Dashboard (375–390px)
**Progetto**: GrecoLatinoVivo Portale  
**Viewport target**: 375px (iPhone SE/13 mini), 390px (iPhone 14/15)  
**Breakpoint applicato**: ≤640px (senza toccare il desktop)  
**Data**: 2026-05-25

---

## 1. Architettura dell'informazione — Pagina Catalogo su Mobile

```
┌──────────────────────────────────────────┐  h: ~56px
│  [≡] GLV           [Vocab] [Piano] [▼]  │  navbar sticky
├──────────────────────────────────────────┤
│                                          │  h: ~72px
│  Bentornato, Giampiero.                  │
│  Lingua, cultura e civiltà del mondo…   │
│                                          │
├──────────────────────────────────────────┤  h: ~76px (se attivo)
│  ▶ Riprendi                              │
│  [corso] · Titolo lezione…   73% ──── → │
├──────────────────────────────────────────┤  h: ~80px (se attivo)
│  [!] Sblocca i corsi di lingua           │
│  [   Esplora i piani →   ]               │
├──────────────────────────────────────────┤  h: ~88px
│  🔍 Cerca corsi…                         │
│  [Tutti] [Latino] [Greco] [Egiziano] ›   │  scroll orizzontale
├──────────────────────────────────────────┤
│  ▶ Continua a guardare                   │
│  ┌──────┐  ┌──────┐  ┌──────┐ ›        │  scroll →
│  │ ███  │  │ ███  │  │      │           │
│  │ 73%  │  │ 45%  │  │      │           │
│  │      │  │      │  │      │           │
│  └──────┘  └──────┘  └──────┘           │
├──────────────────────────────────────────┤
│  Scelti per te                           │
│  ┌──────┐  ┌──────┐  ┌──────┐ ›        │  scroll →
│  │      │  │      │  │      │           │
│  └──────┘  └──────┘  └──────┘           │
├──────────────────────────────────────────┤
│  Latino                                  │
│  ┌──────┐  ┌──────┐ ›                  │
│  │      │  │      │                    │
│  └──────┘  └──────┘                    │
├──────────────────────────────────────────┤
│  ...altre sezioni...                     │
├──────────────────────────────────────────┤
│  GLV · Centro Nazionale di Studi         │
│  Abbonamento  Supporto  Privacy  Home    │
└──────────────────────────────────────────┘
```

---

## 2. Problemi identificati e soluzioni

### P1 — CRITICO: Double padding su `.courses-row`
**Problema**: `.dash-section` ha `padding: 0 16-20px` su mobile; dentro, `.courses-row` riceveva ulteriori `padding-left: 16px` da style.css → le card iniziavano a 36px dal bordo sinistro dello schermo.
**Soluzione**: `padding-left: 0` su `.courses-row` a ≤640px. Il padding viene gestito dalla sezione padre.

### P2 — CRITICO: Filter chips a 2–3 righe
**Problema**: 6 chip con `flex-wrap: wrap` occupavano 80–100px verticali, spingendo i corsi in basso.
**Soluzione**: `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch` → scroll orizzontale. Tap target portato a `min-height: 44px` (Apple HIG).

### P3 — CRITICO: Upgrade banner button non espandibile su mobile
**Problema**: `white-space: nowrap; display: inline-block` → il pulsante non occupava tutta la larghezza disponibile in layout a colonna.
**Soluzione**: `width: 100%; display: flex; align-items: center; justify-content: center; min-height: 48px`.

### P4 — MODERATO: Corner deck a `right: 72px`
**Problema**: Su 375px, `right: 72px` spostava il mazzetto quasi al centro dello schermo.
**Soluzione**: `right: 16px; bottom: 16px` a ≤640px.

### P5 — MODERATO: Spaziature eccessive su mobile
**Problema**: `padding-bottom: 40px` nell'hero e `margin-bottom: 44px` nelle sezioni → 3 schermi di scroll prima dei corsi.
**Soluzione**: Hero `padding-bottom: 16px`, sezioni `margin-bottom: 28px` a ≤640px.

### P6 — MODERATO: Card troppo larghe per 375px
**Problema**: `.course-card` a 210px e `.continua-card` a 228px mostravano meno di 1.5 card visibili, riducendo il discovery hint.
**Soluzione**: a ≤640px → 192px; a ≤390px → 180px. Obiettivo: 1.5 card visibili nette.

### P7 — UX: Scroll snap per le righe card
**Aggiunto**: `scroll-snap-type: x mandatory` sulle righe + `scroll-snap-align: start` sulle card → scorrimento preciso, stop su card intera.

### P8 — UX: Overlay "Prossima lezione" su mobile
**Problema**: `.nlo-btn-dismiss` era 36×36px → sotto il tap target.
**Soluzione**: portato a 44×44px. Pulsante "Avanti" portato a `min-height: 48px`.

---

## 3. Design System mobile

### Spaziatura a ≤640px
```
xs:   4px   (gap chip)
sm:   8px   (gap sezione header)
md:  12px   (gap card row)
lg:  16px   (padding sezione, padding sezione hero)
xl:  24px   (margin-bottom sezione 390px)
2xl: 28px   (margin-bottom sezione 640px)
```

### Tipografia adattiva
```
.dash-greeting:  clamp(1.6rem, 5vw, 1.8rem)  — iPhone 390px: ~24.5px
.dash-section-title: 1.15rem (640px) → 1.05rem (390px)
.dash-subtitle: .88rem
.filter-chip: .82rem con min-height 44px
```

### Card dimensioni per 375px viewport
```
Viewport:        375px
Section padding: 16px × 2 = 32px
Spazio disponibile: 343px

Card width 192px:
  Carta 1: 0–192px (visibile completa)
  Gap:     192–204px
  Carta 2: 204–396px (visibile 139px = 72%) → ottimo scroll hint

Card width 180px (390px):
  Carta 1: 0–180px
  Gap:     180–190px
  Carta 2: 190–370px (visibile 153px = 85%) → leggermente meno inviting
```

---

## 4. Flusso utente mobile — Catalogo

```
Utente apre la dashboard su iPhone
  → Vede Hero: "Bentornato, [nome]" + sottotitolo piano
  → Se ha sessione attiva: vede card "Riprendi" (full-width)
  → Vede filtro ricerca (full-width) + chip scroll orizzontale
  → Vede sezione "Continua a guardare" (se ha corsi in progress)
    → Scorre orizzontalmente con snap → click apre il corso
  → Vede "Scelti per te"
    → Scorre → click apre il corso
  → Scorre in basso per le sezioni lingua
  → Footer con link utili
```

---

## 5. Componenti modificati

| Componente | Modifica mobile |
|---|---|
| `.dash-hero` | `padding-top: 80px; padding-bottom: 16px` |
| `.dash-section` | `padding: 0 16px; margin-bottom: 28px` |
| `.dash-section-title` | `font-size: 1.15rem` (640px) → `1.05rem` (390px) |
| `.courses-row` | `padding-left: 0; scroll-snap-type: x mandatory` |
| `.course-card` | `width: 192px` (640px) → `180px` (390px) |
| `.continua-card` | `width: 200px` (640px) → `180px` (390px) |
| `.continua-resume-hint` | `display: none` (risparmio spazio) |
| `.course-filter-chips` | `flex-wrap: nowrap; overflow-x: auto` |
| `.filter-chip` | `min-height: 44px; flex-shrink: 0` |
| `.upgrade-banner-btn` | `width: 100%; min-height: 48px` |
| `.catalog-corner-deck` | `right: 16px; bottom: 16px` |
| `.nlo-btn-dismiss` | `width: 44px; height: 44px` |
| `.nlo-btn-next` | `min-height: 48px` |

---

## 6. Regole di non-regressione desktop

Tutte le modifiche sono dentro `@media(max-width:640px)` e `@media(max-width:390px)`.  
Il breakpoint ≤768px tocca solo layout e spaziature già presenti nel file.  
**Desktop (≥641px) non viene toccato.**
