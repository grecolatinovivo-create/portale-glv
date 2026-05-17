# SETUP_CHECKLIST — Portale GLV

> Guida completa per configurare le variabili d'ambiente su Vercel e far funzionare il checkout Stripe.
> Aggiornato dopo diagnosi bug maggio 2026.

---

## 🚨 PROBLEMA PRINCIPALE RISOLTO

Il checkout Stripe mostrava "Risorsa non disponibile" per tre cause combinate:

1. **`NEXT_PUBLIC_APP_URL` sbagliato** — era impostato al sito principale `www.grecolatinovivo.it` invece di `portale.grecolatinovivo.it`. Stripe creava la sessione con URL di ritorno sbagliati.
2. **Nomi variabili price ID errati** — il template `.env.local.example` usava i nomi sbagliati (`STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL`) mentre il codice cerca 6 variabili specifiche per piano.
3. **Race condition frontend** — se l'utente cliccava prima che i prezzi fossero caricati, si alzava un TypeError silenzioso e il checkout non partiva senza nessun messaggio di errore.

---

## ✅ VARIABILI D'AMBIENTE — Lista completa per Vercel

Vai su: **Vercel Dashboard → portale-glv → Settings → Environment Variables**

Aggiungi/correggi **tutte** le seguenti variabili. Ogni nome deve corrispondere esattamente.

### Che cos'è il flag "Sensitive" su Vercel?

Quando aggiungi una variabile su Vercel, puoi spuntare **"Sensitive"**: il valore viene cifrato e non sarà più leggibile nell'interfaccia (puoi solo sostituirlo). Usalo per tutto ciò che è una chiave segreta, una password o un token. Le variabili non sensitive restano visibili in chiaro nel pannello Vercel.

---

### 1. DATABASE (Neon PostgreSQL)

| Nome variabile | Sensitive | Valore | Dove si trova |
|---|---|---|---|
| `DATABASE_URL` | 🔒 **SÌ** | `postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require&channel_binding=require` | [console.neon.tech](https://console.neon.tech) → tuo progetto → Connection string → **Pooled connection** |

Contiene username e password del database — va cifrata.

---

### 2. JWT (Autenticazione)

| Nome variabile | Sensitive | Valore | Come generarlo |
|---|---|---|---|
| `JWT_SECRET` | 🔒 **SÌ** | Stringa random di almeno 32 caratteri | Nel terminale: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

È la chiave con cui vengono firmati i token di sessione. Se trapela, chiunque può impersonare qualsiasi utente.

⚠️ Se non impostato, il sistema usa una chiave di default insicura. Impostarlo sempre.

---

### 3. Stripe — Chiavi API

| Nome variabile | Sensitive | Valore | Dove si trova |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | 🔒 **SÌ** | `sk_live_...` (o `sk_test_...` per test) | [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → API Keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | 🔒 **SÌ** | `whsec_...` | Vedi sezione Webhook qui sotto |

Entrambe vanno cifrate: con la secret key si possono creare addebiti su Stripe, con il webhook secret si possono falsificare eventi.

⚠️ **IMPORTANTE**: usa chiavi live solo in produzione. Non mischiare test e live.

---

### 4. Stripe — 6 Price ID (NOMI ESATTI — NON cambiare)

> ⚠️ Questi sono i nomi che il codice cerca. Se li metti con nomi diversi, le variabili non vengono lette e il checkout non funziona.

| Nome variabile | Sensitive | Piano | Tipo | Prezzo |
|---|---|---|---|---|
| `STRIPE_PRICE_CULTURA_MONTHLY` | 🔓 No | Cultura | Mensile | €5,90/mese |
| `STRIPE_PRICE_CULTURA_ANNUAL` | 🔓 No | Cultura | Annuale | €49/anno |
| `STRIPE_PRICE_LINGUAE_MONTHLY` | 🔓 No | Linguae | Mensile | €12,90/mese |
| `STRIPE_PRICE_LINGUAE_ANNUAL` | 🔓 No | Linguae | Annuale | €99/anno |
| `STRIPE_PRICE_ACCADEMIA_MONTHLY` | 🔓 No | Accademia | Mensile | €19,90/mese |
| `STRIPE_PRICE_ACCADEMIA_ANNUAL` | 🔓 No | Accademia | Annuale | €179/anno |

I Price ID (`price_...`) sono identificatori pubblici: il codice li espone già al browser tramite `/api/config/prices`. Non contengono dati sensibili e non permettono operazioni non autorizzate da soli — non c'è motivo di cifrarli (e non cifrarli ti permette di controllarli visivamente nel pannello Vercel).

**Come creare i price ID su Stripe:**
1. Vai su [dashboard.stripe.com](https://dashboard.stripe.com) → Product Catalog → `+ Add product`
2. Nome prodotto: es. "Abbonamento Cultura Mensile"
3. Pricing: Recurring, €5,90, ogni mese
4. Copia il **Price ID** (inizia con `price_`) e incollalo nella variabile corrispondente su Vercel
5. Ripeti per tutti e 6 i piani

---

### 5. Email (Resend)

| Nome variabile | Sensitive | Valore | Dove si trova |
|---|---|---|---|
| `RESEND_API_KEY` | 🔒 **SÌ** | `re_...` | [resend.com](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | 🔓 No | `noreply@grecolatinovivo.it` | Email verificata su Resend |

La API key va cifrata (permette di inviare email a nome tuo). L'indirizzo mittente è un dato non segreto.

---

### 6. URL del portale (CRITICO)

| Nome variabile | Sensitive | Valore CORRETTO | ❌ NON usare |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | 🔓 No | `https://portale.grecolatinovivo.it` | ~~`https://www.grecolatinovivo.it`~~ |

È un URL pubblico già visibile nel codice frontend — non serve cifrarlo. Deve essere l'URL del portale senza slash finale: viene usato per le `success_url` e `cancel_url` di Stripe.

---

### Riepilogo rapido sensitive / non sensitive

| 🔒 Sensitive (cifrate) | 🔓 Non sensitive (in chiaro) |
|---|---|
| `DATABASE_URL` | `STRIPE_PRICE_CULTURA_MONTHLY` |
| `JWT_SECRET` | `STRIPE_PRICE_CULTURA_ANNUAL` |
| `STRIPE_SECRET_KEY` | `STRIPE_PRICE_LINGUAE_MONTHLY` |
| `STRIPE_WEBHOOK_SECRET` | `STRIPE_PRICE_LINGUAE_ANNUAL` |
| `RESEND_API_KEY` | `STRIPE_PRICE_ACCADEMIA_MONTHLY` |
| | `STRIPE_PRICE_ACCADEMIA_ANNUAL` |
| | `RESEND_FROM_EMAIL` |
| | `NEXT_PUBLIC_APP_URL` |

---

## 🔗 Configurazione Webhook Stripe

Il webhook è necessario per attivare l'abbonamento nel DB dopo il pagamento.

1. Vai su [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → Webhooks → `+ Add endpoint`
2. **Endpoint URL**: `https://portale.grecolatinovivo.it/api/stripe/webhook`
3. **Eventi da selezionare** (tutti e 4):
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Clicca **Add endpoint**
5. Copia il **Signing secret** (`whsec_...`) e mettilo in `STRIPE_WEBHOOK_SECRET` su Vercel

---

## 🧪 Come testare il checkout

### Test in modalità test (raccomandato prima del go-live)

1. Su Stripe Dashboard, metti in **test mode** (toggle in alto a sinistra)
2. Crea i 6 prodotti/prezzi in test mode (avranno `price_test_...`)
3. Su Vercel, usa le chiavi test: `sk_test_...` e i price ID test
4. Clicca "Abbonati Mensile" o "Abbonati Annuale" → dovresti essere reindirizzato su `checkout.stripe.com`
5. Usa la carta di test Stripe: `4242 4242 4242 4242` — qualsiasi scadenza futura, qualsiasi CVC
6. Dopo il pagamento devi arrivare su `https://portale.grecolatinovivo.it/dashboard.html?subscribed=1`

### Verifica webhook (opzionale ma utile)

```bash
# Installa Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Ascolta gli eventi in locale (per test locali)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Simula un checkout completato
stripe trigger checkout.session.completed
```

---

## 🔄 Dopo aver aggiornato le variabili su Vercel

Ogni volta che aggiungi/modifichi una variabile d'ambiente su Vercel, devi fare un nuovo deploy:

1. Vai su Vercel → portale-glv → Deployments
2. Clicca sui tre puntini sull'ultimo deployment → **Redeploy**
3. Attendi che il build finisca (circa 2 minuti)
4. Testa il checkout

---

## 📋 Checklist rapida prima del go-live

- [ ] `DATABASE_URL` impostato e Prisma funziona (`npx prisma db push`)
- [ ] `JWT_SECRET` impostato con valore casuale sicuro
- [ ] `STRIPE_SECRET_KEY` con chiave live (`sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` impostato
- [ ] Tutti e 6 i `STRIPE_PRICE_*` impostati con price ID live (`price_live_...`)
- [ ] `RESEND_API_KEY` impostato
- [ ] `NEXT_PUBLIC_APP_URL` = `https://portale.grecolatinovivo.it` (senza slash)
- [ ] Webhook endpoint registrato su Stripe con i 4 eventi
- [ ] Deploy su Vercel eseguito dopo aver salvato tutte le variabili
- [ ] Test checkout con carta di test Stripe completato con successo

---

## 🐛 Bug corretti nel codice (maggio 2026)

| File | Bug | Fix |
|---|---|---|
| `public/js/app.js` | Race condition: `window.__GLV_PRICES` undefined al click → TypeError silenzioso | Aggiunto fetch sincrono se `__GLV_PRICES` non è ancora caricato |
| `pages/api/stripe/checkout.js` | Nessuna prova gratuita: il checkout è diretto (mensile o annuale) | Rimosso trial, aggiunto `allow_promotion_codes: true` |
| `next.config.js` | CORS headers duplicati rispetto a `vercel.json` → browser blocca risposte con header doppi incoerenti | Rimossi da `next.config.js`, gestiti solo in `vercel.json` |
| `.env` | `NEXT_PUBLIC_APP_URL` puntava a `www.grecolatinovivo.it` invece di `portale.grecolatinovivo.it` | Corretto URL |
| `.env.local.example` | Nomi variabili price ID sbagliati (`STRIPE_PRICE_MONTHLY/ANNUAL`) | Aggiornato con i 6 nomi corretti |
