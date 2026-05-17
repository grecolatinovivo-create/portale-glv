# 🧹 Cleanup Report
*Generato il 17 maggio 2026 — Progetto: portale-glv (Next.js 14, Pages Router)*

## Riepilogo

| Gravità | Problemi trovati | Corretti automaticamente |
|---------|-----------------|--------------------------|
| 🔴 Critica | 2 | 1 |
| 🟡 Media   | 3 | 1 |
| 🟢 Bassa   | 4 | 1 |

---

## 🔴 PROBLEMI CRITICI

### [API Routes] Mismatch frontend/backend nel checkout Stripe
- **File**: `pages/api/stripe/checkout.js` + `public/js/app.js`
- **Problema**: il frontend inviava `{ type:'subscription', priceId:'price_...' }` ma il backend si aspettava `{ planId:'cultura-mensile' }`. Il campo `planId` risultava `undefined` → risposta 400 "Il campo planId è obbligatorio". Il checkout era completamente rotto.
- **Fix proposto**: rendere `checkout.js` capace di accettare entrambi i formati (nuovo con `priceId` diretto, legacy con `planId`).
- **Fix applicato**: ✅ Sì — `checkout.js` ora gestisce entrambi i percorsi in modo backward-compatible.

### [Variabili d'ambiente] `ADMIN_EMAIL` assente da `.env.local.example`
- **File**: `pages/api/admin/dashboard.js`, `admin/users.js`, `admin/courses.js`, `admin/certificates.js`
- **Problema**: la variabile `ADMIN_EMAIL` è usata in 4 file backend ma non era documentata nel template `.env.local.example`. Il fallback hardcoded (`grecolatinovivo@gmail.com`) la mascherava, ma chi installa il progetto non saprebbe di poterla configurare.
- **Fix applicato**: ✅ Sì — aggiunta sezione `ADMIN_EMAIL` con commento esplicativo in `.env.local.example`.

---

## 🟡 PROBLEMI MEDI

### [Codice duplicato] `ADMIN_EMAIL` definita in 4 file separati
- **File**: `pages/api/admin/dashboard.js:8`, `admin/users.js:13`, `admin/courses.js:9`, `admin/certificates.js:10`
- **Problema**: `const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com'` è ripetuta identica 4 volte. Se l'email di default cambia, va modificata in 4 posti.
- **Fix proposto**: centralizzare in `lib/auth.js` esportando `ADMIN_EMAIL`.
  ```js
  // In lib/auth.js — aggiungere:
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'grecolatinovivo@gmail.com';
  module.exports = { ..., ADMIN_EMAIL };
  // In ogni file admin — sostituire la riga const con:
  const { ADMIN_EMAIL } = require('../../../lib/auth');
  ```
- **Fix applicato**: ❌ No — richiede refactoring in 4 file, lasciato all'utente.

### [Listener morti] `data-subscribe-monthly`, `data-subscribe-annual`, `data-demo-login` in app.js
- **File**: `public/js/app.js` (righe ~1283-1290 prima del fix)
- **Problema**: 3 listener registrati in `initAuthModals()` per attributi HTML che non esistono in nessuna pagina. `data-demo-login` era codice di sviluppo mai rimosso; `data-subscribe-monthly/annual` erano listener legacy sostituiti da `data-subscribe-direct`.
- **Fix applicato**: ✅ Sì — i 3 listener sono stati rimossi da `initAuthModals()`.

### [Window global] `window.GLV_USER` assegnato ma mai letto
- **File**: `public/dashboard.html:243`, `corso.html:376`, `catalogo.html:79`, `profilo.html:233`
- **Problema**: ogni pagina fa `window.GLV_USER = data.user` nel proprio inline script dopo la verifica auth. Ma `app.js` non legge mai `window.GLV_USER` — usa il proprio `_user` interno. È un residuo del vecchio sistema auth rimosso.
- **Fix proposto**: rimuovere `window.GLV_USER = data.user;` dalle 4 pagine.
- **Fix applicato**: ❌ No — basso rischio ma non verificato che nessun altro inline script lo usi. Lasciato all'utente.

---

## 🟢 PROBLEMI BASSI

### [File spazzatura] `tools/.DS_Store`
- **File**: `tools/.DS_Store`
- **Problema**: file macOS in una cartella che potrebbe essere già tracciata da Git nonostante il `.gitignore`. Il `.gitignore` copre `.DS_Store` ma solo se il file non era già stato committato.
- **Fix proposto**: `git rm --cached tools/.DS_Store && git rm --cached .DS_Store` (da terminale o GitHub Desktop → Repository → Open in Terminal).
- **Fix applicato**: ❌ No — operazione Git da fare manualmente.

### [File legacy] `tools/fetch_corsi.php` e `tools/fetch_lezioni.php`
- **File**: `tools/fetch_corsi.php`, `tools/fetch_lezioni.php`
- **Problema**: file PHP residui della migrazione dal vecchio sistema. Non referenziati da nessuna parte del progetto Node.js. Fanno rumore.
- **Fix proposto**: eliminare entrambi i file.
- **Fix applicato**: ❌ No — decisione dell'utente (potrebbero servire come riferimento).

### [File dev] `tools/create-test-users.js`
- **File**: `tools/create-test-users.js`
- **Problema**: script di sviluppo per creare utenti di test, mai referenziato dal progetto principale. Da rimuovere prima di un deploy in produzione definitivo.
- **Fix proposto**: eliminare o spostare in `.gitignore`.
- **Fix applicato**: ❌ No — decisione dell'utente.

### [Naming] Mix CommonJS / ES Modules
- **File**: tutti i file in `lib/` usano `module.exports`; tutti i file in `pages/api/` usano `export default`
- **Problema**: coesistenza di due sistemi di moduli nello stesso progetto. Funziona perché Next.js gestisce la compilazione, ma può confondere in manutenzione.
- **Impatto**: nullo in produzione, ma bassa leggibilità.
- **Fix proposto**: standardizzare `lib/` su ES modules (richiede di cambiare `require` → `import` e `module.exports` → `export`). **Non urgente.**
- **Fix applicato**: ❌ No — refactoring architetturale non urgente.

---

## TODO/FIXME trovati

Nessun TODO, FIXME, HACK o XXX nel codice. ✅

---

## Fix applicati automaticamente

| File | Modifica |
|------|----------|
| `pages/api/stripe/checkout.js` | Accetta ora sia `{ type, priceId }` che `{ planId }` — fix critico al flusso checkout |
| `public/js/app.js` | Rimossi 3 listener morti: `data-subscribe-monthly`, `data-subscribe-annual`, `data-demo-login` |
| `.env.local.example` | Aggiunta sezione `ADMIN_EMAIL` con documentazione |

---

## Raccomandazioni finali

1. **🔴 Commit e rideploy subito** — il fix a `checkout.js` era critico: il flusso acquisto abbonamento era rotto. Committa e verifica su Vercel che il pagamento funzioni end-to-end.

2. **🟡 Centralizza `ADMIN_EMAIL` in `lib/auth.js`** — prima o poi qualcuno cambierà l'email in un solo file dimenticando gli altri tre. 20 minuti di refactoring che risparmiano futuri bug oscuri.

3. **🟢 Pulisci `tools/`** — rimuovi `fetch_corsi.php`, `fetch_lezioni.php` e `create-test-users.js`. Non servono più e fanno rumore nel repository.
