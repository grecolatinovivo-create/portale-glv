# Council — Portale GLV · Analisi pre-lancio
*Brainstorming del 17 maggio 2026 — 6 agenti specializzati*

---

## Contesto analizzato dal codice reale

| Cosa | Stato |
|---|---|
| Frontend HTML/CSS/JS (`public/`) | ✅ Completo, QA mobile superato |
| `lib/auth.js` | ✅ Pronto ma non usato |
| `lib/stripe.js` | ✅ Pronto ma non usato |
| `lib/resend.js` | ✅ Pronto ma non usato |
| `lib/prisma.js` | ✅ Pronto ma non usato |
| `prisma/schema.prisma` | ❌ NON ESISTE |
| `pages/api/` o `app/api/` | ❌ VUOTO — zero route Next.js |
| Pricing (3 piani vs 2) | ⚠️ INCONSISTENZA — da risolvere |
| `/api/debug/checkout` | ⚠️ Da rimuovere (se creata) |

---

## Trascrizione del dialogo

### ROUND 0 — Reazioni libere

**[PM] Prima reazione**
Entusiasmo: il mockup HTML è finito, il QA mobile è stato fatto. È un punto di partenza solido.
Preoccupazione: il progetto vive una **doppia personalità** pericolosa. TECH_NOTES dice "Next.js + Supabase", ma package.json dice Prisma + Neon, e non esiste una riga di Next.js funzionale. Non c'è `schema.prisma`, non ci sono `pages/api/`. Il checkout "testato e funzionante" non corrisponde ad alcuna route nel codice.
→ Chiede a: **DEV**

**[DEV] Prima reazione**
Entusiasmo: `lib/auth.js`, `lib/stripe.js`, `lib/resend.js`, `lib/prisma.js` — quattro utility ben scritte. Il seed.js con 21 corsi è dettagliato e già API-ready.
Preoccupazione: **Blocco totale**. Mancano `prisma/schema.prisma` e `pages/api/*`. Il backend esiste solo come libreria — senza route che la chiamino, non serve a nulla. Il "checkout testato" potrebbe essere un test su Stripe Dashboard, non un endpoint reale nel progetto.
→ Chiede a: **PM**

**[UX] Prima reazione**
Entusiasmo: QA mobile impeccabile — bottom nav, sticky CTA, touch target 44px, scroll-snap. Il mockup è già di livello produzione visivamente.
Preoccupazione: le pagine HTML usano `localStorage` per l'auth simulata. In produzione con JWT + cookie httpOnly, tutta la logica JS di accesso ai contenuti deve essere riscritta. L'avatar mostra una "M" hardcoded.
→ Chiede a: **NM**

**[NM] Prima reazione**
Entusiasmo: i 3 piani creano una struttura di ancoraggio perfetta — il piano centrale sarà percepito come "giusto compromesso" (anchoring, Ariely 2008). Tasso di conversione stimabile +20-30% con evidenziazione del piano medio.
Preoccupazione: **inconsistenza critica di pricing**. Brief dice 3 piani (Cultura/Linguae/Accademia). DEPLOY_CHECKLIST e resend.js ne prevedono solo 2. Se non si risolve, metà degli utenti vedrà prezzi diversi a seconda del touchpoint — distrugge la fiducia.
→ Chiede a: **PM**

**[QA] Prima reazione**
Entusiasmo: il QA mobile precedente è di buona qualità — 4 bug critici corretti, nessuna regressione desktop.
Preoccupazione: il QA esistente testa solo il mockup statico. Il sistema reale non è mai stato testato perché non esiste ancora. Nessun test di: registrazione, login, webhook Stripe, pagamento fallito, scadenza JWT.
→ Chiede a: **AUD**

**[AUD] Prima reazione**
Entusiasmo: `lib/auth.js` è ben scritto — cookie httpOnly, secure in produzione, sameSite lax. Pattern solido.
Preoccupazione: (1) Nessuna privacy policy nella landing — GDPR art. 13 violato dal giorno 0. (2) Webhook senza verifica firma → replay attack. (3) `/api/debug/checkout` da rimuovere prima del deploy.
→ Chiede a: **DEV**

---

### ROUND 1 — Tensione e negoziazione

**[DEV→PM] intervento 1**
Strategia raccomandata: **mantieni il frontend in `public/` come HTML statico, aggiungi solo le route API Next.js necessarie**. Next.js serve automaticamente i file in `public/`. Le pagine già funzionano — basta cambiare il meccanismo di auth (localStorage → cookie httpOnly) e le call alle API reali. Route minime: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/stripe/checkout`, `/api/stripe/webhook`.

**[PM→NM] intervento 1**
Sul pricing: il brief di oggi (3 piani) è più recente del DEPLOY_CHECKLIST. Il codice resend.js riflette la versione vecchia a 2 piani. **Decisione bloccante**: 3 piani = 6 Price ID Stripe e 6 variabili d'ambiente. 2 piani = sistema quasi pronto. Questa decisione blocca DEV — deve essere presa prima di procedere.

**[AUD→DEV] intervento 1**
Sul `micro` in package.json: non serve. In Next.js il webhook Stripe si gestisce con `bodyParser: false` nella config della route + lettura del body raw con `buffer`. `micro` è un residuo di architetture vecchie — va rimosso. Aggiungo: la landing `index.html` deve avere footer con Privacy Policy e Termini di Servizio prima di raccogliere qualsiasi email. Art. 13 GDPR — non opzionale.

**[UX→AUD] intervento 1**
Il footer GDPR va in `index.html` e nel form di registrazione come checkbox di consenso. Il form di registrazione non esiste ancora come schermata reale — va progettato con: email, password, checkbox "Accetto Privacy Policy [link]", poi bottone "Crea account" attivo. L'avatar hardcoded "M" va sostituito con prima lettera del nome reale via `/api/auth/me`.

**[QA→DEV] intervento 1**
Aggiungo un endpoint critico mancante dalla lista: `/api/auth/me` — ritorna dati utente loggato dal cookie JWT. Senza questo, nessuna pagina sa chi è l'utente. Tutte le pagine protette (dashboard, profilo, corso) devono fare fetch a `/api/auth/me` on-load e, se 401, redirect a `index.html`. **Blocco 0 assoluto: `prisma/schema.prisma` — senza schema il PrismaClient non sa cosa è `Course`.**

**[NM→UX] intervento 1**
Il form di registrazione non deve apparire prima del checkout. Flusso ottimale: CTA → pricing → scelta piano → poi email+password. Questo riduce friction iniziale (effetto Zeigarnik: l'utente ha già investito nella scelta, è motivato a completare). Ordine inverso → abbandono +40-60% (Nielsen, 2020). La sezione pricing deve essere visibile nella landing **prima** del form.

---

### ROUND 2 — Convergenza

**[PM]** Non negoziabile: (1) pricing confermato da Giampiero prima di creare Price ID Stripe; (2) `schema.prisma` prima di qualsiasi sviluppo backend. Flessibile: frontend resta HTML statico; Customer Portal può arrivare dopo il lancio.

**[DEV]** Non negoziabile: (1) 6 route API minime create prima del deploy; (2) `micro` rimosso dal package.json. Flessibile: Pages Router (`pages/api/`) — non serve App Router; schema Prisma minimal (User, Course, Lesson, Subscription).

**[UX]** Non negoziabile: (1) checkbox Privacy Policy nel form registrazione; (2) avatar e nome dinamici via `/api/auth/me`. Flessibile: verifica email può essere rimantata; search non funzionale nella v1 è accettabile.

**[NM]** Non negoziabile: (1) sezione pricing visibile nella landing prima del form; (2) piano centrale evidenziato con badge "Più scelto". Flessibile: CTA "Inizia gratis" da cambiare in "Abbonati ora" se non esiste un trial reale.

**[QA]** Non negoziabile: (1) webhook con `constructEvent` — nessuna eccezione; (2) redirect a `index.html` se `/api/auth/me` ritorna 401 su tutte le pagine protette. Flessibile: test automatici possono essere manuali nella v1.

**[AUD]** Non negoziabile: (1) Privacy Policy + Termini di Servizio in `index.html` prima del lancio; (2) valutare cookie banner per Google Fonts/FontAwesome CDN. Flessibile: WCAG avanzato (skip-link, focus-visible) può essere v2.

---

## Decisioni condivise

1. **Frontend resta HTML statico** in `public/` — non si riscrive nulla, si aggiunge solo il layer API — *proposta da DEV, accettata da tutti*
2. **Creare `prisma/schema.prisma`** — è il blocco zero, tutto il resto dipende da questo — *proposta da QA, accettata da tutti*
3. **6 route API minime** da creare in `pages/api/`: register, login, logout, me, stripe/checkout, stripe/webhook — *proposta da DEV, accettata da tutti*
4. **Pricing da confermare** con Giampiero prima di procedere — blocco hard — *proposta da PM, con riserva di NM (attende risposta)*
5. **`micro` rimosso** dal package.json — *proposta da AUD, accettata da DEV*
6. **Privacy Policy + footer GDPR** in `index.html` e checkbox nel form registrazione — *proposta da AUD, accettata da UX*
7. **Webhook con `constructEvent`** — nessuna deroga — *proposta da AUD/QA, accettata da tutti*
8. **Avatar dinamico** via `/api/auth/me` al load di ogni pagina protetta — *proposta da UX, accettata da tutti*
9. **Flusso: pricing → scelta piano → registrazione** (non viceversa) — *proposta da NM, accettata da UX*
10. **Piano centrale evidenziato** con badge "Più scelto" nella sezione pricing — *proposta da NM, accettata da tutti*
11. **CTA onesta**: se non c'è trial, cambiare "Inizia gratis" in "Abbonati ora" — *proposta da NM, accettata da PM*

---

## Punti di disaccordo residui

- **Pricing (2 vs 3 piani)**: NM vs PM — non risolto, in attesa di decisione Giampiero
- **Cookie banner**: AUD raccomanda, UX vorrebbe evitare friction aggiuntiva — rimandato a dopo conferma su uso font CDN vs locale

---

## ROADMAP PRIORITIZZATA PER IL LANCIO

### 🔴 BLOCCHI ASSOLUTI (niente funziona senza questi)

| # | Task | Chi | Note |
|---|---|---|---|
| B1 | Confermare pricing definitivo (2 o 3 piani) | Giampiero | Blocca tutto il layer Stripe |
| B2 | Creare `prisma/schema.prisma` | DEV | User, Course, Lesson, Subscription, Purchase |
| B3 | `npx prisma db push` + `npm run db:seed` | DEV | Dopo B2 |
| B4 | Rimuovere `micro` da package.json | DEV | Incompatibile con webhook Next.js |

### 🟠 BACKEND CORE (lancio impossibile senza)

| # | Task | Chi | Note |
|---|---|---|---|
| C1 | `pages/api/auth/register.js` | DEV | bcrypt + Prisma + JWT + Resend welcome |
| C2 | `pages/api/auth/login.js` | DEV | bcrypt verify + JWT cookie |
| C3 | `pages/api/auth/logout.js` | DEV | Clear cookie |
| C4 | `pages/api/auth/me.js` | DEV | Legge JWT cookie → user + subscription status |
| C5 | `pages/api/stripe/checkout.js` | DEV | Crea Stripe Checkout Session con price_id corretto |
| C6 | `pages/api/stripe/webhook.js` | DEV | constructEvent + aggiorna DB + invia email |

### 🟡 FRONTEND REALE (collegare l'HTML alle API)

| # | Task | Chi | Note |
|---|---|---|---|
| F1 | Aggiungere fetch `/api/auth/me` su ogni pagina protetta | DEV/UX | Con redirect 401 → index.html |
| F2 | Avatar dinamico (prima lettera nome reale) | DEV | Dashboard, navbar |
| F3 | Form registrazione reale (email + password + checkbox GDPR) | UX+DEV | Modale o pagina dedicata |
| F4 | Cambiare CTA "Inizia gratis" → "Abbonati ora" | UX | Se non c'è trial reale |
| F5 | Badge "Più scelto" sul piano centrale nella pricing card | UX | Anchoring visivo |
| F6 | Verificare che pricing card mostri i prezzi giusti | UX | Dopo decisione B1 |

### 🟢 LEGALE/SICUREZZA (obbligatorio pre-lancio)

| # | Task | Chi | Note |
|---|---|---|---|
| L1 | Privacy Policy (pagina o modale) | PM/UX | GDPR art. 13 — obbligatorio |
| L2 | Termini di Servizio | PM | Breve versione minima |
| L3 | Link Privacy + ToS nel footer di index.html | UX | |
| L4 | Checkbox consenso nel form registrazione | UX | Deve essere unchecked di default |
| L5 | Valutare cookie banner (Google Fonts/FontAwesome) | AUD | O caricare font in locale |
| L6 | Rimuovere `/api/debug/checkout` se esiste | DEV | Non trovata nel codice — verificare |

### 🔵 POST-LANCIO (non bloccano la v1)

| # | Task | Note |
|---|---|---|
| P1 | Customer Portal Stripe (link "Gestisci abbonamento") | Profilo.html |
| P2 | Verifica email all'iscrizione | Aggiunge fiducia ma non è bloccante |
| P3 | Search funzionale nel catalogo | Il bottone esiste ma non è wired |
| P4 | Test su device fisico iOS (Safari) — raccomandazione QA | Safe-area, landscape |
| P5 | WCAG avanzato (skip-link, focus-visible) | Accessibilità v2 |
| P6 | Acquisto singolo corso (senza abbonamento) | Previsto nel README ma non implementato |
| P7 | Import corsi dal vecchio portale Aruba | Script tools/fetch_corsi.php già presente |

---

## Mandato per la pipeline successiva

- **PM**: monitorare che B1 (pricing) sia sbloccato prima di procedere con C5/C6
- **DEV**: iniziare da B2 (schema.prisma) → B3 → B4 → poi C1–C6 → poi F1–F6
- **UX**: preparare il form di registrazione reale (F3) e gli aggiornamenti della landing (F4, F5, F6, L3, L4)
- **QA**: testare ogni API route con Postman/curl dopo C1–C6; verificare redirect 401 su tutte le pagine protette
- **AUD**: produrre testi Privacy Policy e Termini di Servizio minimi prima del lancio (L1, L2)
- **NM**: verificare che il flusso pricing → registrazione sia rispettato nell'implementazione F3

---

*Questo COUNCIL sostituisce il precedente COUNCIL.md (ottimizzazione mobile del 16 maggio 2026).*
