# Analisi Portale GrecoLatinoVivo — 29 maggio 2026

Analisi statica di lettura di tutte le pagine (frontend `public/`) e di tutte le API (`pages/api/`, `lib/`). **Nessuna modifica al codice effettuata.**

---

## 🔴 Bug critici

### 1. `/api/admin/dashboard` va sempre in errore 500
File: `pages/api/admin/dashboard.js`

La variabile locale `subscriptionsByPlan` viene costruita (righe 88-90) come array di oggetti `{ plan, count }`:

```js
const subscriptionsByPlan = Object.entries(planCountMap)
  .map(([plan, count]) => ({ plan, count }));
```

Poi, nella risposta (righe 129-132), viene rimappata leggendo `s._count.plan`, che **non esiste** su quegli oggetti:

```js
subscriptionsByPlan: subscriptionsByPlan.map(s => ({
  plan: s.plan,
  count: s._count.plan,   // ← s._count è undefined → TypeError
})),
```

`s._count` è `undefined` → `undefined.plan` lancia un `TypeError`, catturato dal `try/catch` esterno → l'endpoint restituisce **500 su ogni chiamata**.

Conseguenza end-to-end: la sezione **Dashboard** dell'area admin (`admin.html`, `loadDashboard()` → `fetch('/api/admin/dashboard')`) non carica le metriche. Lo stesso endpoint è chiamato anche da `loadSubscriptions()` e dal refresh dei log.

Fix suggerito (non applicato): nella risposta usare direttamente `subscriptionsByPlan` così com'è (è già `{ plan, count }`).

---

## 🟠 Violazioni delle regole di business (CLAUDE.md)

La regola assoluta del progetto è: **`isFree` SEMPRE `false`, nessuna lezione/anteprima gratuita**. Sono rimasti residui di logica "prima lezione gratis":

### 2. Il seed crea lezioni gratuite
File: `prisma/seed.js:320`
```js
isFree: i < 2,   // Prime 2 lezioni sempre gratuite come anteprima
```
Se il database è stato popolato con questo seed, le prime 2 lezioni di **ogni** corso risultano `isFree: true`, in diretta violazione della regola. Da verificare sul DB di produzione. (Nota: `scripts/populate-missing-courses.js:261` invece imposta correttamente `isFree: false`.)

### 3. Logica `isFree` ancora presente in frontend e backend
- `pages/api/courses/[id].js:128` → `if (lesson.isFree || hasAccess)` espone `vimeoUrl` se `isFree` è true.
- `public/dashboard.html` righe 3463, 4132, 4158 (badge "free"), 6171, 6316 → `lesson.isFree || hasAccess`.
- `pages/api/vocabulary/adaptive-session.js:58` seleziona il campo `isFree`.

Finché `isFree` è `false` ovunque nel DB questa logica è innocua, ma la regola chiede di **rimuoverla**. Resta un rischio: basta un singolo record con `isFree: true` (vedi punto 2) per sbloccare contenuti gratis.

I riferimenti in `TODO.md`, `CORSO_VIEW_README.md` e `DIDACTIC_SPEC_AI_PANEL.md` descrivono ancora il vecchio modello "2 lezioni gratuite" e andrebbero allineati o archiviati.

---

## 🟡 Incongruenze (rischio manutenzione)

### 4. La lista `MANUAL_PLANS` è diversa tra i file
- `auth/me.js` e `admin/users.js`: 6 piani (include `cultura-free`, `linguae-free`, `accademia-free` + i `-manuale`).
- `courses/[id].js`, `admin/dashboard.js`, `admin/content-stats.js`: 4 piani (solo i `-manuale` + `accademia-free`; **mancano** `cultura-free` e `linguae-free`).

In `courses/[id].js` l'omissione è mitigata da `planToTier()` che usa `startsWith('cultura'/'linguae')`, quindi l'accesso per tier funziona comunque; ma la selezione del "piano effettivo" quando un utente ha più subscription non è coerente tra le pagine. Conviene centralizzare `MANUAL_PLANS` in un unico modulo condiviso (es. `lib/plans.js`).

---

## 🟡 Sicurezza / housekeeping

### 5. Endpoint di debug pubblici (nessuna autenticazione)
- `pages/api/debug/checkout.js` — restituisce a chiunque lo stato delle env var **e i valori reali dei Price ID Stripe** (`price_...`). Il file stesso dice "DA ELIMINARE dopo i test".
- `pages/api/debug/register.js` — restituisce `userCount`, presenza di `JWT_SECRET`/`RESEND_API_KEY` e il prefisso (30 caratteri) del `DATABASE_URL`.

Sono accessibili senza login in produzione: information disclosure. Raccomandato rimuoverli o proteggerli con `INTERNAL_API_TOKEN` (come fa `auth/register.js`).

### 6. File duplicati/stray
- `public/profilo 2.html` — copia macOS di `profilo.html` (i pulsanti tier puntano a `alert(...)`, non funzionali).
- `public/early-access.html` duplicato in `public/sitonuovo/early-access.html`.

Da consolidare per evitare di mantenere/servire versioni divergenti.

---

## ✅ Cosa funziona correttamente

**Autenticazione (`lib/auth.js`, `auth/login.js`, `auth/register.js`)**
- JWT in cookie `httpOnly`, `secure` in produzione, `sameSite: lax`, scadenza 7 giorni.
- Login blocca gli account sospesi (`isSuspended` → 403) con messaggio generico sulle credenziali.
- `auth/register.js` è interno: senza header `X-Internal-Token` corretto risponde 404 (non rivela la route).

**Bypass admin — conforme a CLAUDE.md**
- `courses/[id].js` passo 0: `req.user.email === ADMIN_EMAIL` → accesso totale prima di ogni controllo subscription/purchase.
- `auth/me.js` calcola `isAdmin` confrontando con `ADMIN_EMAIL`.
- `dashboard.html`: se `user.isAdmin` imposta `_adminTierActive = 3` (Accademia).
- Tutte le API admin (`admin/*`) verificano `req.user.email === ADMIN_EMAIL` → 403 altrimenti. `admin.html` usa il flag `isAdmin` dal server, non email hardcoded nel gate.

**Modello "no trial" — rispettato**
- `stripe/checkout.js` non imposta alcun `trial_period_days`.
- `subscription/status.js` filtra solo `['active','past_due']` — nessun `trialing`.
- `auth/me.js` e `courses/[id].js` usano solo `status: 'active'`. Nessuna occorrenza di `trialing` nel codice applicativo.

**Webhook Stripe (`stripe/webhook.js`)**
- Verifica della firma con raw body (`bodyParser` disabilitato).
- Gestisce checkout guest (crea utente + token set-password 48h) e utente loggato.
- Gestisce `subscription.updated/deleted` e `invoice.payment_failed` (→ `past_due`). Risponde sempre 200 per evitare retry.

**Tier & accesso corsi**
- Gerarchia `cultura(1) < linguae(2) < accademia(3)` coerente tra backend e frontend.
- Acquisto singolo corso ha priorità massima e non scade (`expiresAt` ignorato per i purchase).
- Preferenze onboarding lette dal DB (`onboardingDone`, `prefLang`, `prefLevel`, `prefGoal`) — conforme alla regola "non localStorage".

---

## Priorità d'intervento consigliata

1. **Bug 500 `/api/admin/dashboard`** (punto 1) — blocca l'area admin.
2. **`isFree: true` nel seed** (punto 2) — verificare il DB di produzione e bonificare eventuali record.
3. **Rimuovere endpoint debug pubblici** (punto 5) — esposizione Price ID/env.
4. Rimuovere la logica `isFree` residua (punto 3) e centralizzare `MANUAL_PLANS` (punto 4).
5. Pulizia file duplicati (punto 6).
