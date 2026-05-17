# QA Report Pre-Lancio — Portale GrecoLatinoVivo
**Data revisione:** 17 maggio 2026  
**Revisore:** Agent QA  
**Giudizio complessivo:** GIALLO — deploy possibile con cautela (2 azioni obbligatorie prima del go-live)

---

## 1. Bug trovati e corretti

### BUG-01 — Critico | Messaggi di errore login/registrazione non visualizzati
**File:** `public/index.html` — righe 716 e 765  
**Problema:** Il frontend cercava `result.data.message` per mostrare i messaggi di errore del backend, ma tutte le API di autenticazione rispondono con `{ error: '...' }` (non `message`). Di conseguenza, in caso di errore (email già registrata, credenziali errate, password troppo corta, ecc.) l'utente vedeva sempre il messaggio generico di fallback, mai il testo specifico proveniente dal server.  
**Correzione applicata:** `result.data.message` → `result.data.error` in entrambe le form (login e registrazione).

### BUG-02 — Medio | doCheckout non gestiva la risposta 401 (sessione scaduta)
**File:** `public/index.html` — funzione `doCheckout`  
**Problema:** Se un utente con sessione scaduta cliccava un pulsante di acquisto, il fetch verso `/api/stripe/checkout` restituiva 401, ma il codice tentava comunque di leggere `.url` su una risposta di errore, senza mostrare feedback né aprire il modal di login.  
**Correzione applicata:** Aggiunto controllo esplicito su `res.status === 401`: in tal caso si imposta `window.PENDING_PLAN` e si apre il modal di autenticazione. Aggiunto anche gestione di `data.error` (alert) per errori generici non-URL.

### BUG-03 — Medio | Flash di contenuto protetto prima del controllo auth
**File:** `public/dashboard.html`, `public/catalogo.html`, `public/corso.html`, `public/profilo.html`  
**Problema:** Le quattro pagine protette caricavano tutto il contenuto HTML visibile prima che la chiamata a `/api/auth/me` completasse. Un utente non autenticato vedeva brevemente il contenuto per 200–500ms prima del redirect.  
**Correzione applicata:** Aggiunto `document.documentElement.style.visibility = 'hidden'` immediatamente all'avvio dello script (sincrono, prima di DOMContentLoaded). La visibilità viene ripristinata a `''` solo dopo che `/api/auth/me` ha risposto con successo. Il redirect a '/' avviene prima di mostrare qualsiasi contenuto.

---

## 2. Inconsistenze risolte

### INCON-01 — Formato risposta API ↔ frontend (analisi)
**Verifica eseguita:** Il pattern fetch del frontend usa il wrapper `res.json().then(function(d) { return { ok: res.ok, data: d }; })`, quindi `result.ok` = HTTP status boolean, `result.data` = corpo JSON. Le API di register e login rispondono `{ ok: true, user: {...} }`, che il frontend legge correttamente come `result.data.ok` e `result.data.user`. **Non era un bug.** Il formato e' coerente.

### INCON-02 — planId costruito dal frontend ↔ planId attesi dal backend
**Verifica eseguita:** Il frontend costruisce `planId = plan + '-' + (period === 'monthly' ? 'mensile' : 'annuale')`. I 6 piani definiti in `lib/resend.js` sono `cultura-mensile`, `cultura-annuale`, `linguae-mensile`, `linguae-annuale`, `accademia-mensile`, `accademia-annuale`. Gli attributi HTML sono `data-plan="cultura|linguae|accademia"` e `data-period="monthly|annual"`. La logica produce esattamente i 6 planId validi. **Nessun bug.**

### INCON-03 — me.js: formato risposta ↔ frontend dashboard/catalogo/corso/profilo
**Verifica eseguita:** `me.js` risponde `{ user: { id, email, fullName, subscription } }`. Tutti e 4 i file HTML protetti leggono `data.user` direttamente. **Coerente, nessun bug.**

### INCON-04 — Schema Prisma ↔ query nelle API
**Verifica eseguita:**
- `passwordHash` usato in login.js (`user.passwordHash`) — campo esiste nello schema. OK.
- `subscriptions` come array in me.js con `include: { subscriptions: { where: { status: 'active' }, orderBy, take } }` — sintassi Prisma corretta per relazione uno-a-molti. OK.
- `stripeSubscriptionId` come campo `@unique` usato in webhook.js per `upsert` e `update` — coerente con lo schema. OK.
- `prisma.user.findUnique` con `req.user.userId` — il JWT viene firmato con `{ userId: user.id }` in `lib/auth.js`, e `me.js` usa `req.user.userId`. Coerente. OK.

### INCON-05 — checkout.js importa getPriceId e PLANS da lib/resend.js
**Osservazione:** L'accoppiamento e' logicamente impuro (la logica dei piani Stripe non appartiene al modulo email), ma funziona correttamente. Non e' un bug. Da rifattorizzare in v2 con un modulo `lib/plans.js` dedicato.

### INCON-06 — Seed.js ↔ Schema Prisma
**Verifica eseguita:** I campi usati nel seed (`slug`, `lang`, `level`, `title`, `description`, `priceEur`, `isNew`, `sortOrder`) corrispondono esattamente allo schema. Le lezioni create con `lessons: { create: [...] }` usano `title`, `durationMin`, `isFree`, `sortOrder` — tutti presenti nello schema. Il campo `vimeoUrl` e' omesso ma e' nullable (`String?`). **Nessun bug.**

---

## 3. Edge case aperti (non bloccanti per v1)

### EDGE-01 — Delay webhook Stripe post-checkout
Scenario: utente paga con successo, Stripe reindirizze a `/dashboard.html?checkout=success`, ma il webhook non ha ancora processato il pagamento (latenza tipica 0.5–3s). L'utente vede il banner "Nessun abbonamento attivo". Questo e' accettabile per v1. In v2 si puo' aggiungere un polling o un messaggio apposito se `?checkout=success` e' presente nella URL.

### EDGE-02 — JWT_SECRET non configurato nel .env
Il file `.env` ha `JWT_SECRET="INSERISCI_QUI_UNA_STRINGA_SEGRETA..."` (placeholder). `lib/auth.js` ha il fallback `'dev-secret-change-in-production'`. Se il valore reale non viene inserito prima del deploy, i token vengono firmati con il secret di default — tutti i JWT emessi in dev saranno validi in produzione se il secret non cambia, e questo e' un rischio di sicurezza. **Azione obbligatoria prima del go-live:** generare e inserire un secret reale di almeno 32 caratteri esadecimali.

### EDGE-03 — Credenziali database Neon nel file .env committato in repo
Il file `.env` (non `.env.local`) contiene la stringa di connessione Neon con credenziali reali: `postgresql://neondb_owner:npg_wRBXT6Azv0Vj@...`. Se il repository e' o diventa pubblico, queste credenziali sono esposte. **Azione obbligatoria:** aggiungere `.env` al `.gitignore`, ruotare immediatamente le credenziali Neon dal pannello di controllo, usare `.env.local` (gia' in gitignore per Next.js) per i valori reali.

### EDGE-04 — STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET con valori placeholder in .env
Stessa considerazione di EDGE-03: i valori `sk_live_...` e `whsec_...` sono placeholder, ma il file .env e' committato. Se venissero inseriti valori reali in quel file, sarebbero esposti.

### EDGE-05 — Visibilita' hidden potrebbe causare pagina bianca in caso di errore di rete
Se la chiamata a `/api/auth/me` fallisce per errore di rete, il `.catch` fa redirect a `/`. In questo caso `document.documentElement.style.visibility` rimane `hidden` per il brevissimo tempo prima del redirect. Comportamento accettabile.

### EDGE-06 — `sendSubscriptionEmail` in webhook.js usa fallback piano errato
In `lib/resend.js` riga 51: `const plan = PLANS[planId] || PLANS['linguae-mensile']`. Se `planId` fosse sconosciuto (non dovrebbe mai accadere dopo la validazione del checkout), l'email mostrerebbe "Linguae Mensile" come piano. Comportamento defensivo accettabile ma logicamente impreciso. Meglio sarebbe loggare un errore senza fallback.

---

## 4. Valutazione componente per componente

| Componente | Stato | Note |
|---|---|---|
| `prisma/schema.prisma` | VERDE | Modelli coerenti, relazioni corrette, campi nullable appropriati |
| `pages/api/auth/register.js` | VERDE | Validazione completa, bcrypt 10 rounds, email lowercased, risposta consistente |
| `pages/api/auth/login.js` | VERDE | Timing-safe compare con bcrypt, messaggio generico anti-enumerazione |
| `pages/api/auth/logout.js` | VERDE | Semplice e corretto |
| `pages/api/auth/me.js` | VERDE | Query con include subscription attiva, risposta ben strutturata |
| `pages/api/stripe/checkout.js` | VERDE | Validazione planId, requireAuth applicato, gestione priceId mancante |
| `pages/api/stripe/webhook.js` | VERDE | rawBody letto correttamente, firma verificata, 400 se firma errata, 200 sempre dopo eventi |
| `lib/auth.js` | VERDE | JWT, cookie httpOnly+secure+sameSite=lax, withAuth/requireAuth corretti |
| `lib/resend.js` | VERDE | 6 piani definiti, email HTML corrette, getPriceId funziona |
| `lib/stripe.js` | VERDE | Singleton corretto, apiVersion specificata |
| `lib/prisma.js` | VERDE | Pattern singleton Next.js corretto |
| `package.json` | VERDE | Dipendenze coerenti con il codice |
| `prisma/seed.js` | VERDE | Campi coerenti con schema, lessonCount variabile per tipo corso |
| `public/index.html` (script) | VERDE* | *Corretti BUG-01 e BUG-02 in questa sessione |
| `public/dashboard.html` (script) | VERDE* | *Corretto BUG-03 in questa sessione |
| `public/catalogo.html` (script) | VERDE* | *Corretto BUG-03 in questa sessione |
| `public/corso.html` (script) | VERDE* | *Corretto BUG-03 in questa sessione |
| `public/profilo.html` (script) | VERDE* | *Corretto BUG-03 in questa sessione |
| `.env` configurazione | ROSSO | JWT_SECRET placeholder, DATABASE_URL reale committata in repo |

---

## 5. Azioni obbligatorie prima del go-live

1. **Ruotare le credenziali Neon** dal pannello `console.neon.tech` (la stringa di connessione nel `.env` committato e' da considerare compromessa).
2. **Aggiungere `.env` al `.gitignore`** e spostare tutti i valori reali in `.env.local` (che Next.js ignora automaticamente in git).
3. **Generare un JWT_SECRET reale** con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` e inserirlo in `.env.local`.
4. **Compilare i 6 STRIPE_PRICE_***: creare i prodotti su Stripe Dashboard e copiare i Price ID.
5. **Compilare STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET** con i valori reali (live mode).

---

## 6. Giudizio complessivo

**GIALLO — Deploy possibile con cautela**

Il codice applicativo (backend API, frontend, schema, seed) e' corretto e coerente dopo le correzioni apportate in questa sessione. I 3 bug trovati sono stati corretti direttamente. Non esistono bug bloccanti di logica applicativa.

Il GIALLO (anziche' VERDE) e' dovuto esclusivamente alle 2 azioni obbligatorie legate alla configurazione delle variabili d'ambiente (EDGE-02 e EDGE-03): la presenza di credenziali database reali in un file git-tracked e il JWT_SECRET non configurato sono rischi di sicurezza che devono essere risolti prima del deploy in produzione, indipendentemente dalla qualita' del codice.

Una volta completate le 5 azioni elencate nella sezione precedente, il giudizio diventa **VERDE**.
