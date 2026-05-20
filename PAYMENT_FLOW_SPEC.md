# PAYMENT_FLOW_SPEC.md — GrecoLatinoVivo
**Versione:** 1.0  
**Data:** 2026-05-20  
**Autore:** Senior PM (analisi da codebase)  
**Obiettivo:** Specifica completa per la migrazione al flusso payment-first (nessun account senza abbonamento attivo)

---

## 1. Stato attuale — Mappa di tutti i punti di ingresso alla registrazione

### 1.1 Punti di ingresso dalla landing page (`/public/index.html`)

| Elemento | Tipo | Attributo/ID | Riga | Comportamento attuale |
|---|---|---|---|---|
| Pulsante "Inizia con Cultura" | `<button>` | `data-open-register data-plan="cultura"` | r. 1111 | Chiama `Payments.subscribe('cultura')` → checkout Stripe diretto |
| Pulsante "Inizia con Linguae" | `<button>` | `data-open-register data-plan="linguae"` | r. 1132 | Chiama `Payments.subscribe('linguae')` → checkout Stripe diretto |
| Pulsante "Inizia con Accademia" | `<button>` | `data-open-register data-plan="accademia"` | r. 1151 | Chiama `Payments.subscribe('accademia')` → checkout Stripe diretto |
| Link "Accedi" in navbar | `<a>` | `data-open-login` id `btnLogin` | r. 1025 | Apre modal login |
| CTA Hero "Scegli il piano" | `<a href="#prezzi">` | — | r. 1052 | Scroll anchor verso sezione prezzi |
| CTA navbar "Abbonati" | `<a href="#prezzi">` | — | r. 1027 | Scroll anchor verso sezione prezzi |

**Nota:** I tre pulsanti `data-open-register` con `data-plan` presente **non aprono la modal di registrazione**: il codice in `initAuthModals()` (app.js r. 1337) intercetta il click e chiama direttamente `Payments.subscribe(plan)`, bypassando il form. La modal si apre solo se `plan` è assente (r. 1352). Questo significa che il flow payment-first è già **parzialmente implementato** per chi clicca su un piano specifico.

### 1.2 Punti di ingresso da JavaScript (`/public/js/app.js`)

| Funzione/Meccanismo | Riga | Comportamento |
|---|---|---|
| `showAuthModal('register')` | r. 1249, r. 1274, r. 1352 | Apre modal con form registrazione (email, nome, password, conferma email) |
| `Auth.register(email, password, fullName)` | r. 1296 | Chiamata a `POST /api/auth/register` se modal in modalità `register` |
| `showAuthModal('login')` | r. 857, r. 1330 | Apre modal login — contiene link "Non hai un account? Registrati" (r. 1274) |
| `Payments.subscribeDirectly(plan, period)` | r. 849 | Se utente non loggato → salva `glv_pending_plan` in sessionStorage → apre modal **login** (non register), r. 857 |
| `initAuthModals()` → listener `[data-open-register]` senza piano | r. 1332–1353 | Apre modal register se il pulsante non ha `data-plan` |
| `initAuthModals()` → listener `[data-open-login]` | r. 1325–1331 | Apre modal login |
| `sessionStorage glv_pending_plan` | r. 855, r. 1299 | Piano memorizzato prima del login/register per riprendere il checkout dopo auth |

**Link "Registrati" dentro modal login** (r. 1274): apre la modal register — questo è un punto di ingresso secondario che permette la creazione account senza pagamento.

### 1.3 Endpoint API

| Route | Metodo | File | Comportamento |
|---|---|---|---|
| `POST /api/auth/register` | POST | `pages/api/auth/register.js` | Crea utente, imposta password, emette cookie JWT. **Non richiede abbonamento.** |
| `POST /api/stripe/checkout` | POST | `pages/api/stripe/checkout.js` | Crea sessione Stripe. Auth opzionale (withAuth non bloccante). |
| `POST /api/stripe/webhook` percorso B | POST | `pages/api/stripe/webhook.js` r. 113–123 | Se utente non loggato post-pagamento: crea account con password temporanea auto-generata + invia email credenziali. |

### 1.4 Riassunto del problema

Il percorso attuale consente la creazione di un account tramite `POST /api/auth/register` **senza che l'utente abbia un abbonamento attivo**. Il link "Registrati" nella modal di login (r. 1274 di app.js) e il listener `[data-open-register]` senza piano (r. 1352) sono i due vettori che permettono questo.

---

## 2. Flusso target — Payment-First

### 2.1 Diagramma del flusso principale (utente nuovo)

```
[Landing page]
    |
    | Utente clicca su "Inizia con Cultura/Linguae/Accademia"
    v
[app.js: Payments.subscribe(plan)]
    |
    | fetch POST /api/stripe/checkout
    | body: { type:'subscription', priceId:'price_...' }
    | (nessun userId — utente non è loggato)
    v
[Stripe Checkout]
    | Stripe raccoglie: email, dati carta
    | metadata: { planId: '...' }  ← nessun userId
    |
    |── SUCCESSO ──────────────────────────────────────────────────
    v
[Webhook: checkout.session.completed]
    | Percorso B (nessun userId in metadata)
    | findOrCreateUserFromStripeSession(session)
    |   → email da session.customer_email o session.customer_details.email
    |   → prisma.user.findUnique(email)
    |
    |── Email NON esiste nel DB ────────────────────────────────────
    |   → prisma.user.create({ email, passwordHash: hash(tempPassword) })
    |   → prisma.subscription.upsert(...)
    |   → [DA IMPLEMENTARE] genera set-password token con scadenza
    |   → [DA IMPLEMENTARE] salva token in DB (tabella PasswordResetToken)
    |   → [DA IMPLEMENTARE] sendSetPasswordEmail(user, token, planId)
    |     (sostituisce sendWelcomeWithCredentialsEmail che invia password in chiaro)
    v
[Email "Imposta la tua password"]
    | Oggetto: "Il tuo abbonamento è attivo — imposta la password"
    | Contiene: link https://portale.grecolatinovivo.it/set-password?token=TOKEN
    |
    v
[Utente clicca sul link → /set-password?token=TOKEN]
    |
    | GET /set-password (pagina HTML o Next.js page)
    | → verifica token valido e non scaduto
    |
    v
[Form "Scegli la tua password"]
    | Campi: password, conferma password
    | Submit: POST /api/auth/set-password
    | body: { token, password }
    |
    v
[/api/auth/set-password]
    | → valida token
    | → aggiorna user.passwordHash
    | → invalida token (usedAt = now)
    | → emette cookie JWT
    v
[Redirect → /dashboard.html]
    | Utente è loggato e ha abbonamento attivo
    v
[FINE — account configurato]
```

### 2.2 Utente che torna sul sito e accede (login)

```
[Landing page o /login]
    |
    | Utente clicca "Accedi"
    v
[Modal login: showAuthModal('login')]
    |
    | [MODIFICA] Rimuovere il link "Non hai un account? Registrati"
    |            (o sostituire con "Vuoi abbonarti? → #prezzi")
    v
[Auth.login(email, password)]
    |
    | POST /api/auth/login (invariato)
    v
[/dashboard.html]
```

### 2.3 Recovery flow — Utente ha pagato ma non ha completato la password

```
[Utente non ha cliccato il link email o il link è scaduto]
    |
    v
[Pagina /set-password?token=TOKEN scaduto]
    | → mostra errore "Link scaduto"
    | → mostra form "Inserisci la tua email per ricevere un nuovo link"
    v
[POST /api/auth/resend-set-password]
    | body: { email }
    | → verifica che l'utente esista AND abbia un abbonamento attivo
    | → genera nuovo token
    | → invia nuova email
    v
[Nuova email con link set-password]

OPPURE (utente non ha email/link):

[Utente va sul sito e prova ad accedere con email ma senza password]
    | → clicca "Password dimenticata?" nel modal login
    v
[Stesso flusso di /api/auth/resend-set-password]
```

### 2.4 Flusso email già esistente (utente già registrato paga di nuovo)

```
[Webhook: checkout.session.completed]
    | findOrCreateUserFromStripeSession(session)
    | → prisma.user.findUnique(email) → utente ESISTE
    | → isNew = false, tempPassword = null
    v
[prisma.subscription.upsert(...)]
    v
[sendSubscriptionEmail(user, planId)]  ← invariato
    v
[Utente accede con credenziali esistenti]
```

---

## 3. Cosa va rimosso/modificato — Lista operativa

### 3.1 `/public/index.html`

| Elemento | Riga | Azione |
|---|---|---|
| Link "Accedi" in navbar (`data-open-login`, id `btnLogin`) | r. 1025 | **Mantenere** — è il punto di accesso per utenti già abbonati |
| Pulsanti piano con `data-open-register data-plan="..."` | r. 1111, 1132, 1151 | **Mantenere** — chiamano direttamente `Payments.subscribe(plan)`, comportamento corretto |
| Nessun elemento HTML specifico da rimuovere sulla landing | — | Il problema è nel JS, non nell'HTML della landing |

**Nota:** La landing page è già strutturalmente corretta per il flusso payment-first. I CTA dei piani portano direttamente a Stripe. Non ci sono form di registrazione nella pagina HTML.

### 3.2 `/public/js/app.js`

| Funzione/Elemento | Riga | Azione |
|---|---|---|
| `showAuthModal()` — stringa "Non hai un account? Registrati" | r. 1274 | **Modificare**: sostituire con "Vuoi abbonarti? → Scegli un piano" con link `href="#prezzi"` o `href="/#prezzi"` |
| `showAuthModal('register')` — generazione della modal con form registrazione completo | r. 1249–1277 | **Rimuovere o proteggere**: la modal in modalità `register` non deve essere raggiungibile dall'utente finale. Lasciare solo la modalità `login`. In alternativa: eliminare il branch `mode === 'register'` |
| `Auth.register()` — chiamata a `POST /api/auth/register` | r. 1296 | **Rimuovere** la chiamata frontend (l'endpoint rimane per uso interno webhook) |
| Listener `[data-open-register]` senza piano — apre modal register | r. 1352 | **Modificare**: se non c'è piano, reindirizzare a `#prezzi` invece di aprire modal register |
| `Payments.subscribeDirectly()` — se utente non loggato apre modal login | r. 854–858 | **Mantenere invariato**: già corretto (apre login, non register) |
| `sessionStorage glv_pending_plan` meccanismo | r. 855, 1299–1306 | **Mantenere**: funziona correttamente per riprendere il checkout dopo login |
| Logica post-login per riprendere piano pendente | r. 1299–1306 | **Mantenere invariato** |

### 3.3 `/pages/api/auth/register.js`

**Azione: Proteggere per uso solo interno (webhook), non deprecare.**

- Aggiungere un meccanismo di autenticazione interna per limitarne l'accesso. Opzioni:
  - Header segreto `X-Internal-Token: INTERNAL_SECRET` verificato contro env var
  - Oppure: spostare la logica di creazione utente direttamente nel webhook (già autosufficiente — webhook usa `prisma.user.create` direttamente a r. 57–63 del webhook)
- **Alternativa pratica**: deprecare l'endpoint REST pubblico e mantenere solo la logica di creazione nel webhook. Il webhook è già autonomo.
- **Non eliminare** immediatamente: verificare che non ci siano altri chiamanti interni.

### 3.4 `/pages/api/stripe/webhook.js`

**Azioni da apportare:**

1. **Sostituire `sendWelcomeWithCredentialsEmail`** (r. 158) con `sendSetPasswordEmail`:
   - Il nuovo flusso non invia la password in chiaro via email
   - Genera invece un token set-password con scadenza `[DA DECIDERE: 24h o 72h]`
   - Salva token nel DB (nuova tabella `PasswordResetToken` o campo `passwordResetToken` + `passwordResetExpiry` su `User`)
   - Invia email con link `https://[DOMINIO]/set-password?token=TOKEN`

2. **Aggiungere importazione** di `generateSetPasswordToken` e `sendSetPasswordEmail` da `lib/resend`

3. **Codice da modificare** (attorno a r. 54–66 e r. 156–160):

```js
// PRIMA (da rimuovere):
const tempPassword = generateTempPassword();
const passwordHash = await bcrypt.hash(tempPassword, 10);
// ...
await sendWelcomeWithCredentialsEmail(user, planId, tempPassword);

// DOPO:
// Crea utente senza password (o con hash placeholder non usabile)
const newUser = await prisma.user.create({
  data: {
    email: normalizedEmail,
    fullName: session.customer_details?.name || null,
    passwordHash: '', // non usabile — utente deve impostare via link
  },
});
// Genera token set-password
const token = generateSetPasswordToken(); // crypto.randomBytes(32).toString('hex')
await prisma.passwordResetToken.create({
  data: {
    userId: newUser.id,
    token,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS), // [DA DECIDERE]
  },
});
await sendSetPasswordEmail(newUser, planId, token);
```

### 3.5 Nuove API necessarie (vedere Sezione 4)

- `POST /api/auth/set-password` — imposta password da token
- `POST /api/auth/resend-set-password` — reinvia email set-password

---

## 4. Nuove API necessarie

### 4.1 `POST /api/auth/set-password`

**Scopo:** Consente all'utente di impostare la propria password usando il token ricevuto via email dopo il pagamento.

| Campo | Valore |
|---|---|
| Metodo HTTP | `POST` |
| Path | `/api/auth/set-password` |
| Autenticazione richiesta | No (utente non ha ancora sessione) |

**Input atteso (body JSON):**
```json
{
  "token": "a1b2c3...64chars hex string",
  "password": "nuovaPassword123",
  "confirmPassword": "nuovaPassword123"
}
```

**Output atteso:**
- `200 OK` + `Set-Cookie: glv_token=JWT` + `{ ok: true, user: { id, email, fullName } }`
- `400 Bad Request` → `{ error: 'Token mancante' }` | `{ error: 'Password troppo corta (min 8 caratteri)' }` | `{ error: 'Le password non coincidono' }`
- `400 Bad Request` → `{ error: 'Link scaduto. Richiedi un nuovo link.' }` (token expiresAt passato)
- `400 Bad Request` → `{ error: 'Link già utilizzato.' }` (token usedAt != null)
- `404 Not Found` → `{ error: 'Token non valido.' }`
- `500 Internal Server Error` → `{ error: 'Errore interno del server' }`

**Logica (pseudo-codice):**
```
1. Valida input: token presente, password >= 8 chars, password === confirmPassword
2. prisma.passwordResetToken.findUnique({ where: { token } })
   → se null: return 404
   → se usedAt != null: return 400 "già utilizzato"
   → se expiresAt < now: return 400 "scaduto"
3. passwordHash = await bcrypt.hash(password, 10)
4. prisma.$transaction([
     prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
     prisma.passwordResetToken.update({ where: { token }, data: { usedAt: now } })
   ])
5. user = await prisma.user.findUnique({ where: { id: record.userId } })
6. jwtToken = signToken({ userId: user.id, email: user.email })
7. setAuthCookie(res, jwtToken)
8. return 200 { ok: true, user: { id, email, fullName } }
```

---

### 4.2 `POST /api/auth/resend-set-password`

**Scopo:** Reinvia l'email con il link per impostare la password (recovery per link scaduto o email non ricevuta).

| Campo | Valore |
|---|---|
| Metodo HTTP | `POST` |
| Path | `/api/auth/resend-set-password` |
| Autenticazione richiesta | No |
| Rate limiting | Necessario — `[DA IMPLEMENTARE]` max 3 richieste/ora per email |

**Input atteso (body JSON):**
```json
{
  "email": "utente@esempio.it"
}
```

**Output atteso:**
- `200 OK` → `{ ok: true, message: 'Se la email è associata a un abbonamento attivo, riceverai un link.' }` (risposta generica per sicurezza, non rivela se email esiste)
- `400 Bad Request` → `{ error: 'Email obbligatoria' }`
- `500 Internal Server Error` → `{ error: 'Errore interno del server' }`

**Logica (pseudo-codice):**
```
1. Valida email presente e formato valido
2. user = prisma.user.findUnique({ where: { email: email.toLowerCase() } })
   → se null: return 200 (risposta generica — non rivelare)
3. sub = prisma.subscription.findFirst({
     where: { userId: user.id, status: { in: ['active', 'trialing'] } }
   })
   → se null: return 200 (risposta generica — non rilasciare token senza sub attiva)
4. Invalida eventuali token precedenti non usati:
   prisma.passwordResetToken.updateMany({
     where: { userId: user.id, usedAt: null },
     data: { usedAt: now } // considerati "sostituiti"
   })
5. Genera nuovo token: crypto.randomBytes(32).toString('hex')
6. prisma.passwordResetToken.create({ userId, token, expiresAt })
7. sendSetPasswordEmail(user, sub.plan, token)
8. return 200 { ok: true, message: '...' }
```

---

### 4.3 Schema DB — Nuova tabella `PasswordResetToken`

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Da aggiungere al model `User` nel schema Prisma:
```prisma
passwordResetTokens PasswordResetToken[]
```

---

### 4.4 Nuova pagina: `/set-password` (o `/pages/set-password.js`)

Non è una API REST ma una pagina HTML/Next.js che:
- Legge `?token=...` dalla URL
- Valida il token via API o lato server
- Mostra form con campi password + conferma password
- On submit: chiama `POST /api/auth/set-password`
- On success: redirect a `/dashboard.html`
- On error (token scaduto): mostra form per richiedere nuovo link (chiama `POST /api/auth/resend-set-password`)

---

## 5. Requisiti funzionali (testabili da QA)

**RF-01** — Il sistema non permette la creazione di un account tramite `POST /api/auth/register` da client non autenticati internamente. Una chiamata diretta all'endpoint senza header interno restituisce `403 Forbidden`.

**RF-02** — L'utente che clicca su un piano nella sezione prezzi viene reindirizzato alla pagina di checkout Stripe senza che gli venga richiesto di creare un account prima del pagamento.

**RF-03** — A seguito del completamento del checkout Stripe da parte di un utente con email non esistente nel DB, il sistema crea automaticamente un account e invia entro 60 secondi una email con un link per impostare la password.

**RF-04** — Il link set-password è valido per `[DA DECIDERE: 24h o 72h]` dall'invio. Dopo la scadenza, la pagina `/set-password` mostra un messaggio di errore e un form per richiedere un nuovo link.

**RF-05** — L'utente che imposta la password tramite il link viene automaticamente autenticato (cookie JWT impostato) e reindirizzato alla dashboard senza dover eseguire un login separato.

**RF-06** — Il modal di login non contiene più il link "Non hai un account? Registrati". Al suo posto è presente un link verso la sezione prezzi per invitare l'utente ad abbonarsi.

**RF-07** — Se un utente con account esistente completa un nuovo pagamento Stripe con la stessa email, il sistema riconosce l'account esistente, aggiorna o crea la subscription, e invia una email di conferma abbonamento (non di set-password).

**RF-08** — L'endpoint `POST /api/auth/resend-set-password` risponde sempre con `200 OK` e un messaggio generico, indipendentemente dal fatto che la email esista o meno nel DB (prevenzione email enumeration).

---

## 6. Edge Cases e Rischi

### 6.1 Utente che paga ma l'email non arriva

**Scenario:** Il provider email (Resend) fallisce nell'invio o l'email finisce in spam.

**Rischi:** L'utente ha pagato ma non può accedere. Frustrazione, chargeback.

**Mitigazioni:**
- Il token set-password è persistente nel DB con scadenza. L'utente può richiedere un reinvio tramite `/api/auth/resend-set-password` inserendo la sua email.
- Aggiungere link "Non hai ricevuto la email? Richiedi un nuovo link" sulla landing page o in una pagina dedicata `/accedi`.
- Monitorare i log Resend per bounce e delivery failure.
- `[DA DECIDERE]` Implementare notifica Slack/email admin per invii falliti su webhook?

### 6.2 Utente che paga con una email già esistente nel DB

**Scenario:** Un utente già registrato (magari con abbonamento scaduto) paga di nuovo con la stessa email.

**Comportamento attuale del webhook** (r. 47–51 di webhook.js): Se l'utente esiste, `isNew = false` e `tempPassword = null`. La subscription viene creata/aggiornata. Viene inviata `sendSubscriptionEmail` (non set-password email).

**Comportamento nel nuovo flusso:** Invariato. L'utente già esistente ha già una password. Riceve conferma abbonamento. Accede normalmente con le sue credenziali.

**Rischio residuo:** Se l'utente non ricorda la password, dovrà usare il flusso password dimenticata standard. `[DA DECIDERE]` Aggiungere link "Password dimenticata?" nel modal login prima del lancio?

### 6.3 Utente che paga due volte

**Scenario A:** Due pagamenti con stessa email.
- Webhook: `prisma.subscription.upsert` — la seconda esecuzione aggiorna la subscription esistente (non duplica).
- `[DA VERIFICARE]` Stripe gestisce già il caso: se un `stripeCustomerId` ha già una subscription attiva, il comportamento dipende dalla configurazione del prodotto Stripe. `[DA DECIDERE]` Stripe deve essere configurato per consentire o bloccare multiple subscription per la stessa email?

**Scenario B:** Due pagamenti con email diverse (es. errore di digitazione).
- Crea due account separati. L'utente avrà difficoltà a riconoscere quale email usare.
- `[DA DECIDERE]` Implementare flusso di merge account?

### 6.4 Abbonamento che scade: cosa succede all'account?

**Comportamento attuale:** L'evento `customer.subscription.deleted` (webhook r. 200–212) aggiorna `status: 'canceled'`. L'account utente **rimane nel DB** — il login continua a funzionare, ma il dashboard deve mostrare che l'abbonamento non è attivo.

**Comportamento richiesto nel nuovo flusso:** `[DA DECIDERE]`
- Opzione A: L'account rimane attivo ma l'accesso ai corsi è bloccato (solo area "Il mio abbonamento" con CTA per rinnovare).
- Opzione B: L'account viene sospeso (`isSuspended: true`) fino al rinnovo.
- Opzione C: L'account viene mantenuto ma con redirect automatico alla pagina prezzi al login.

**Raccomandazione PM:** Opzione A. Preservare l'account è meno rischioso per la UX e facilita il rinnovo.

### 6.5 Link set-password scaduto

**Scenario:** L'utente clicca sul link dopo la scadenza (`expiresAt < now`).

**Comportamento:**
- Pagina `/set-password` mostra: "Il link è scaduto. Inserisci la tua email per riceverne uno nuovo."
- Form chiama `POST /api/auth/resend-set-password`.
- Nuovo token generato, vecchi token invalidati.

**Rischio:** Se l'utente non ha accesso alla email originale, non può recuperare l'account senza supporto manuale.

**Mitigazione:** Processo di supporto (email a supporto@grecolatinovivo.it) per verifica identità + reset manuale da admin.

---

## 7. Decisioni aperte

Le seguenti decisioni richiedono una scelta esplicita dell'owner **prima** dell'inizio dello sviluppo.

| ID | Domanda | Opzioni | Impatto |
|---|---|---|---|
| D-01 | Durata token set-password | 24h / 48h / 72h | Sicurezza vs usabilità. 24h è standard per password reset. 72h per utenti che controllano la email raramente. |
| D-02 | Cosa fare con `POST /api/auth/register` | A) Proteggere con header interno B) Eliminare endpoint e portare logica nel webhook | A è reversibile, B è più pulita. |
| D-03 | Il modal login deve avere "Password dimenticata?" | Sì / No | Se No, l'utente che dimentica la password non ha un recovery standard. Raccomandato Sì. |
| D-04 | Sostituire password temporanea con link set-password anche nel caso utente esistente (isNew=false) | Sì / No | Se Sì, tutti i nuovi pagamenti richiedono set-password. Se No (raccomandato), solo i nuovi account. |
| D-05 | Rate limiting su `resend-set-password` | Max richieste per ora/IP/email | Senza rate limiting, l'endpoint è vulnerabile a spam email abuse. |
| D-06 | Cosa succede all'account quando l'abbonamento scade | A) Solo blocco contenuti B) Sospensione account C) Redirect a prezzi | Vedi Sezione 6.4. |
| D-07 | Multiple subscription per la stessa email su Stripe | Consentite / Bloccate a livello Stripe | Configurazione nel Stripe Dashboard (prodotto/subscription settings). |
| D-08 | Nome e path della pagina set-password | `/set-password` / `/imposta-password` / `/benvenuto` | Impatta comunicazione email e URL nel link. |
| D-09 | Inviare notifica admin/Slack se webhook fallisce l'invio email | Sì / No | Utile per intercettare utenti che hanno pagato ma non ricevuto email. |
| D-10 | Il campo `passwordHash` del nuovo utente creato via webhook può essere vuoto o deve avere un placeholder? | Stringa vuota / Hash di stringa impossibile da digitare | Schema Prisma attuale potrebbe richiedere un valore non-null. Da verificare. |

---

*Fine documento — v1.0 — generato dal codebase in data 2026-05-20*
