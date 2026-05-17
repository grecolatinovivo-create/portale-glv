# UX SPEC — Portale GLV v2
*Senior UX/UI Designer — Revisione maggio 2026*

---

## Design System (invariato, confermato)

### Palette colori
| Token | Valore | Uso |
|---|---|---|
| --bg-base | #0d0d0d | Sfondo pagina |
| --bg-card | #1a1a1a | Card corsi |
| --bg-card-hover | #252525 | Card hover |
| --bg-nav | rgba(13,13,13,0.95) | Navbar fixed |
| --accent | #a01a36 | Brand red GLV |
| --accent-hover | #c02040 | Hover rosso |
| --text-primary | #ffffff | Titoli, body |
| --text-secondary | #b3b3b3 | Sottotitoli |
| --text-muted | #666666 | Note, label |
| --border | #2a2a2a | Bordi card |
| --gold | #f0c040 | Stelle rating, attestati |

### Colori categoria (thumbnail gradient)
- Latino: #7b0d1e → #a01a36
- Greco Antico: #1a237e → #3949ab
- Egiziano: #e65100 → #ff8f00
- Ebraico: #1b5e20 → #2e7d32
- Didattica: #4a148c → #7b1fa2
- Corsi Brevi: #004d40 → #00796b

### Tipografia
- Heading: Montserrat 700/600 (Google Fonts)
- Body: Roboto 400/500 (Google Fonts) — *nota: l'esistente usa Roboto, non Inter*
- Monospace: nessuno

### Spaziatura (sistema 8px)
xs:4px · sm:8px · md:16px · lg:24px · xl:32px · 2xl:48px · 3xl:64px

---

## Architettura dell'informazione

### Schermate principali
1. **index.html** — Landing page pubblica (acquisizione)
2. **dashboard.html** — Home utente loggato (retention)
3. **catalogo.html** — Catalogo filtrabile (discovery)
4. **corso.html** — Pagina corso + player (fruizione)
5. **profilo.html** — Abbonamento + attestati (gestione account)
6. **admin.html** — Pannello amministratore (operazioni)

---

## Analisi critica: HOME (index.html)

### Problemi identificati

**BUG CRITICO — Doppio sistema auth:**
La home ha un proprio modal auth (`#glv-auth-overlay`) con form di login/registrazione
**separato** da quello in `app.js` (`showAuthModal`). Risultato: la conferma email e
l'occhiolino 👁 aggiunti in app.js NON esistono nel form della home. L'utente che
si registra dalla home usa un form vecchio senza validazione doppia email.

**Fix**: eliminare il modal duplicato in index.html e usare esclusivamente `showAuthModal()`
da app.js, già aggiornato con tutte le feature.

**Problemi UX minori:**
- Stats hero hardcodate (1.500+, 150+, 98%): ok per ora, ma da aggiornare periodicamente
- Pricing: pulsanti mensile/annuale inline con stili inline misti — fragile
- La sezione "preview catalogo" carica i corsi via API ma non ha skeleton loader
- FAQ senza schema JSON-LD per SEO (consigliato)
- CTA "Abbonamento" in navbar porta a #prezzi: corretto, ma non distingue utente loggato
- Footer: link `catalogo.html?lang=Egiziano` dovrebbe essere `?lang=Egiziano%20Geroglifico`

### Flusso utente — Home
```
Utente arriva sulla home
  → Vede Hero con CTA "Scegli il tuo piano" e "Esplora il catalogo"
  → Scorre → Value Props → Testimonianze → Pricing
  → Clicca "Scegli il tuo piano"
    → [non loggato] → showAuthModal('register') → registrazione → redirect dashboard
    → [loggato]     → redirect diretto a profilo.html#abbonamento
  → Clicca "Accedi" in navbar
    → showAuthModal('login') → login → redirect dashboard
```

### Wireframe HOME (above the fold)
```
┌─────────────────────────────────────────────────────┐
│ GRECOLATINO VIVO    Catalogo  Come funziona  Prezzi  │ ← navbar fixed dark
│                                          [Accedi] [Abbonamento ▶] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Centro Nazionale di Studi Classici                 │ ← eyebrow label bordeaux
│                                                     │
│  Il portale per le *lingue classiche*               │ ← h1, em = bordeaux
│                                                     │
│  Latino, Greco, Egiziano, Ebraico.                  │
│  150+ ore di video-lezioni con docenti universitari │
│                                                     │
│  [ Scegli il tuo piano ] [ Esplora il catalogo ]    │
│                                                     │
│  ▏ 1.500+    ▏ 150+     ▏ 98%       ▏ 4            │
│  ▏ Iscritti  ▏ Ore lez  ▏ Soddisf.  ▏ Lingue       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Analisi critica: DASHBOARD (dashboard.html)

### Problemi identificati

**1. Hero Billboard hardcodato**
L'hero mostra sempre "Latino B1.1" con testo fisso. Non si aggiorna mai.
Dovrebbe mostrare il corso più recente con progressi, oppure un featured course
scelto dall'API. Un utente che sta studiando Greco vede sempre Latino come featured.

**Fix**: Il JS che popola la dashboard (`loadDashboard` in app.js) dovrebbe alimentare
l'hero con il corso che l'utente ha aperto per ultimo, o con il featured
del mese da un campo nel DB.

**2. Nessun saluto personale**
L'utente entra e non sa di essere loggato — non c'è "Ciao Mario" da nessuna parte.
L'avatar in navbar mostra "M" hardcodato. Non usa `currentUser.fullName`.

**Fix**: Navbar avatar + nome dal JWT, e banner di benvenuto personalizzato.

**3. Nessun banner abbonamento**
Un utente senza abbonamento attivo vede lo stesso layout di uno con abbonamento.
Non c'è nessun prompt a sottoscrivere, nessun avviso di scadenza.

**Fix**: Banner sticky sotto navbar con stato abbonamento:
- Verde: "Piano Linguae attivo — rinnovo il 12/06/2026"
- Arancione: "Il tuo abbonamento scade tra 7 giorni — [Rinnova]"
- Rosso: "Abbonamento scaduto — [Riattiva] per accedere ai corsi"
- Grigio: "Nessun abbonamento — [Scegli un piano] per sbloccare i corsi"

**4. "Vedi tutto →" senza href**
Tutti i link "Vedi tutto →" non puntano da nessuna parte. Friction inutile.

**Fix**: `href="catalogo.html?lang=Latino"` ecc.

**5. Sezione "I miei corsi" nascosta di default**
`#section-progress` ha `display:none` e appare solo se c'è progresso.
Un nuovo utente non capisce che quella sezione esiste.

**Fix**: Mostrare sempre la sezione, con un empty state onboarding:
"Non hai ancora iniziato nessun corso. [Inizia ora →]"

**6. Il footer dashboard è spoglio**
Solo due righe. Non coerente col footer della home.

### Flusso utente — Dashboard
```
Utente loggato arriva su dashboard.html
  → Vede Navbar con nome/avatar personale
  → Banner abbonamento (stato colorato)
  → Hero Billboard: ultimo corso aperto / featured
  → "I miei corsi" (con progresso) — sempre visibile, con empty state se vuota
  → Righe catalogo: Continua, Nuovi, per lingua
  → Corsi Brevi + Didattica in fondo
  → Click su corso → corso.html?id=slug
  → "Il mio abbonamento" in navbar → profilo.html
```

### Wireframe DASHBOARD
```
┌─────────────────────────────────────────────────────┐
│ GRECOLATINO VIVO  Catalogo Latino Greco Egiziano…   │
│                   [🔍] [Il mio piano] [M▼ Mario] [Esci]│
├─────────────────────────────────────────────────────┤
│ 🟢 Piano Linguae attivo — rinnovo il 12/06/2026     │ ← banner abbonamento
├─────────────────────────────────────────────────────┤
│                                                     │
│  [────────── HERO BILLBOARD ──────────────────────] │
│  IN EVIDENZA   Greco Antico A1.1                    │
│  24 lezioni · 24 ore · Livello A1                   │
│  [▶ Accedi al corso]  [+ Lista]                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│ I miei corsi                              Attestati→│
│ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │ Greco A1 │ │ Latino A1│ │ + Inizia │            │
│ │ ████░░ 65%│ │ ██░░░ 30%│ │  un corso│            │
│ └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────┤
│ Continua a studiare                      Vedi tutto→│
│ [card] [card] [card] [card] [card] →               │
│                                                     │
│ Latino                                   Vedi tutto→│
│ [card] [card] [card] [card] [card] →               │
│ ...                                                 │
└─────────────────────────────────────────────────────┘
```

---

## Componenti da correggere

### 1. SubscriptionBanner (NUOVO)
Elemento: `<div id="subscription-banner">` sotto la navbar in dashboard.html
Stati:
- `.active` — verde, testo "Piano X attivo — rinnovo il [data]"
- `.expiring` — arancione, testo "Scade tra N giorni — [Rinnova]"
- `.expired` — rosso, testo "Abbonamento scaduto — [Riattiva]"
- `.none` — bordeaux scuro, testo "Nessun piano — [Scegli un piano]"

### 2. Navbar avatar (FIX)
`#nav-avatar` e `#nav-name` devono essere popolati da JS al caricamento pagina
con `currentUser.fullName[0]` e `currentUser.fullName`.

### 3. Auth modal (FIX — CRITICO)
Eliminare `#glv-auth-overlay` da index.html.
Usare esclusivamente `showAuthModal()` da app.js, già aggiornato.
I pulsanti `data-open-auth` devono chiamare `showAuthModal('login')`.
Il link "Registrati" deve chiamare `showAuthModal('register')`.

### 4. Empty state "I miei corsi"
Quando l'utente non ha progressi mostrare:
```
🏛  Non hai ancora iniziato nessun corso.
    Sfoglia il catalogo e inizia il tuo percorso nelle lingue classiche.
    [ Esplora il catalogo ]
```
Stile: testo centrato, icon emoji 2rem, CTA btn-primary.

### 5. Vedi tutto → href
- "Continua a studiare" → `catalogo.html`
- "Latino" → `catalogo.html?lang=Latino`
- "Greco Antico" → `catalogo.html?lang=Greco%20Antico`
- "Egiziano Geroglifico" → `catalogo.html?lang=Egiziano%20Geroglifico`
- "Ebraico Biblico" → `catalogo.html?lang=Ebraico%20Biblico`
- "Corsi Brevi" → `catalogo.html?lang=Corsi%20Brevi`
- "Formazione per Docenti" → `catalogo.html?lang=Didattica`

---

## Priorità interventi

| Priorità | Intervento | File |
|---|---|---|
| 🔴 CRITICO | Fix auth modal duplicato in index.html | index.html |
| 🔴 CRITICO | Navbar avatar/nome dinamici | dashboard.html + app.js |
| 🟠 ALTA | Banner abbonamento in dashboard | dashboard.html + app.js |
| 🟠 ALTA | Empty state "I miei corsi" | dashboard.html |
| 🟡 MEDIA | "Vedi tutto →" con href corretti | dashboard.html |
| 🟡 MEDIA | Hero billboard dinamico | app.js |
| 🟢 BASSA | FAQ schema JSON-LD | index.html |
| 🟢 BASSA | Footer link lang corretto (Egiziano) | index.html |
