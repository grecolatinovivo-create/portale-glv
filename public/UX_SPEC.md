# UX Spec — Portale GLV v3
*Centro Nazionale di Studi Classici · GrecoLatinoVivo*

## Design System

### Palette
| Token | Valore | Uso |
|-------|--------|-----|
| --primary | #a01a36 | CTA, accenti, heading underline |
| --primary-50 | #fdf0f3 | Hover su outline button |
| --gold | #d4a017 | SOLO decorativo: bordi badge, separatori, icone |
| --bg-ivory | #faf8f5 | Background pagina |
| --bg-card | #ffffff | Background card |
| --bg-section | #f5f2ee | Background sezioni alternate |
| --text-900 | #1a1a2e | Testo principale |
| --text-500 | #6b6b80 | Testo secondario |
| --text-300 | #a0a0b8 | Placeholder, testo disabilitato |
| --border | #e8e4de | Bordi card |
| --success | #1e7e34 | Check features, badge successo |

### Tipografia
| Elemento | Font | Peso | Dimensione |
|---------|------|------|-----------|
| Titoli hero, section title | Playfair Display | 700 | 2.8–4rem |
| Nomi piani, tier label | Playfair Display | 600 | 1.5rem |
| Corpo testo, label | Inter | 400 | 0.9–1rem |
| Microcopy, note | Inter | 400 | 0.8–0.85rem |
| Prezzi | Playfair Display | 700 | 2.4rem |

### Spaziature (8px grid)
- Padding sezione: 5rem 2rem (desktop) / 3rem 1rem (mobile)
- Gap card grid: 1.5rem
- Border radius card: 12px
- Border radius button: 8px

---

## Architettura dell'informazione

### index.html — Landing page
1. **Navbar** — Logo "Centro Nazionale di Studi Classici" (Playfair, bordeaux) + "GrecoLatinoVivo" (Inter small, secondary). Nav links: Corsi · Chi siamo · Prezzi · [Login/Dashboard].
2. **Hero** — Headline Playfair, sottotitolo Inter, trust bar con 12.447 studenti (primo elemento), CTA "Scegli il tuo piano" + "Sfoglia il catalogo".
3. **Sezione Lingue** — Latino e Greco: card 2x larghezza con citazione latina/greca. Egiziano ed Ebraico: card standard.
4. **Sezione Corsi recenti** — 3-4 card corso con thumbnail, titolo, docente, livello.
5. **Sezione Docenti** — 4-6 docenti reali con nome e disciplina.
6. **Pricing** — Toggle mensile/annuale + 3 card (Cultura, Linguae featured, Accademia).
7. **FAQ** — Accordion 6-8 domande.
8. **Final CTA** — "Inizia il tuo percorso" (data-open-register senza piano).
9. **Footer** — ΓΛ mark, nome completo, anno, accreditamenti.

### dashboard.html — Area studente
1. **Header** — Benvenuto + nome utente + badge piano attivo.
2. **In corso** — Corsi con progress bar (% completamento).
3. **Consigliati** — Card corso senza progress, con CTA.
4. **Abbonamento** — Riepilogo piano + link gestione Stripe portal.

### catalogo.html — Catalogo corsi
1. **Sidebar** — Filtri lingua (Latino/Greco/Egiziano/Ebraico/Didattica/Brevi), livello (A1-C2), prezzo.
2. **Grid corsi** — Card con thumbnail, titolo, docente, durata, livello, badge.
3. **Search** — Campo testo in testa alla grid.
4. **Count** — "56 corsi disponibili".

### corso.html — Pagina corso
1. **Hero** — Titolo corso, descrizione, docente, tag lingua+livello.
2. **Layout 65/35** — Contenuto principale a sinistra, sidebar sticky a destra.
3. **Sidebar** — Card acquisto/abbonamento + lista lezioni ([data-lesson-id]).
4. **Tab contenuto** — Descrizione / Docente / Recensioni.

### profilo.html — Profilo studente
1. **Hero dark** — Avatar, nome, piano attivo.
2. **Tab nav** — Corsi / Attestati / Abbonamento / Impostazioni ([data-tab]).
3. **Corsi tab** — Card corsi con progress.
4. **Attestati tab** — Grid certificati scaricabili.
5. **Abbonamento tab** — Dettagli piano, storico pagamenti [DA INSERIRE].

---

## Componenti UI principali

### Card Corso
```
┌─────────────────────────────────┐
│ [thumbnail 16:9]                │
├─────────────────────────────────┤
│ LATINO · INTERMEDIO             │  ← tag grigio Inter 0.75rem
│ Titolo del Corso                │  ← Inter 600 1rem
│ Giampiero Marchi                │  ← Inter 400 0.85rem text-500
│ ████████░░ 60%                  │  ← progress bar bordeaux
└─────────────────────────────────┘
```

### Card Lingua (Latino/Greco — 2x width)
```
┌─────────────────────────────────────────────────┐
│ LATINO                     "Alea iacta est"     │
│ La lingua della civiltà occidentale · 7 corsi   │
│ [Inizia →]                                      │
└─────────────────────────────────────────────────┘
```

### Card Lingua (Egiziano/Ebraico — standard)
```
┌────────────────────┐
│ EGIZIANO           │
│ 3 corsi            │
│ [Inizia →]         │
└────────────────────┘
```

### Pricing Card
```
┌──────────────────────────┐
│        PIANO             │
│       Linguae            │  ← Playfair 1.5rem
│  Per gli studiosi seri   │
│  €12,90  /mese           │  ← Playfair 2.4rem
│  ─────────────────       │
│  ✓ Tutto del piano...    │
│  ✓ Materiali scari...    │
│  [Abbonati ora]          │
└──────────────────────────┘
```

---

## Flussi utente

### Flusso acquisto abbonamento (non loggato)
1. Hero CTA / Pricing button → modal login (app.js)
2. Login → sessionStorage salva glv_pending_plan + period
3. Redirect dashboard → app.js rileva pending → Stripe checkout
4. Stripe → success → dashboard.html?checkout=success

### Flusso acquisto abbonamento (loggato)
1. Pricing button[data-open-register data-plan="X"] → click
2. app.js legge period da #tog-annual → key = plan_period
3. Fetch /api/config/prices → priceId
4. POST /api/stripe/checkout → session.url
5. Redirect a Stripe

### Flusso catalogo → corso
1. Catalogo → click card → corso.html?slug=X
2. corso.html: app.js legge slug, carica dati corso
3. Click lezione → [data-lesson-id] → player

---

## Tono visivo
- Istituzionale ma accessibile. Non accademico-pesante.
- Fotografie reali dei docenti (quando disponibili), no stock photo generiche.
- Citazioni latine/greche usate come elementi decorativi nei punti strategici.
- Nessuna gamification (no confetti, no badge animati, no countdown fake).
