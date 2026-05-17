# DEPLOY CHECKLIST — Portale GLV
## `portale.grecolatinovivo.it` su Vercel + Neon + Stripe

### Architettura hosting
| Dominio | Hosting | Stack |
|---|---|---|
| `grecolatinovivo.it` | Serverplan | PHP/MySQL (sito principale — non si tocca) |
| `portale.grecolatinovivo.it` | Vercel | Next.js + Neon + Stripe |

---

## PASSO 1 — GitHub (necessario per Vercel)
Vercel deploya da un repository Git. Se non ce l'hai:
1. Vai su https://github.com/new → crea repo privato `portale-glv`
2. Dal tuo computer, nella cartella `portale-glv`:
```bash
git init
git add .
git commit -m "primo commit"
git remote add origin https://github.com/TUO-USERNAME/portale-glv.git
git push -u origin main
```
> In alternativa usa **Vercel CLI** senza GitHub: `npx vercel` dalla cartella del progetto.

---

## PASSO 2 — Neon (database PostgreSQL gratuito)
1. Vai su https://console.neon.tech → Sign up → **New Project**
   - Nome: `portale-glv`
   - Regione: **EU Central (Frankfurt)** — più vicina all'Italia
2. Una volta creato, vai su **Connection Details**
3. Copia la stringa in formato:
   ```
   postgresql://utente:password@host.neon.tech/neondb?sslmode=require
   ```
4. Tienila da parte — serve al Passo 4.

---

## PASSO 3 — Stripe
1. **API Keys** → https://dashboard.stripe.com → Developers → API Keys
   - Copia `Secret key` (`sk_live_...`)
   - Copia `Publishable key` (`pk_live_...`)

2. **Crea i 6 piani di abbonamento su Stripe:**

   Dashboard → Products → **Add product**. Crea **6 prodotti distinti**, uno per riga:

   | # | Nome prodotto Stripe        | Tipo       | Importo   | Frequenza | Variabile da copiare              |
   |---|-----------------------------|------------|-----------|-----------|-----------------------------------|
   | 1 | GLV — Cultura Mensile       | Ricorrente | €5,90     | Mensile   | `STRIPE_PRICE_CULTURA_MONTHLY`    |
   | 2 | GLV — Cultura Annuale       | Ricorrente | €49,00    | Annuale   | `STRIPE_PRICE_CULTURA_ANNUAL`     |
   | 3 | GLV — Linguae Mensile       | Ricorrente | €12,90    | Mensile   | `STRIPE_PRICE_LINGUAE_MONTHLY`    |
   | 4 | GLV — Linguae Annuale       | Ricorrente | €99,00    | Annuale   | `STRIPE_PRICE_LINGUAE_ANNUAL`     |
   | 5 | GLV — Accademia Mensile     | Ricorrente | €19,90    | Mensile   | `STRIPE_PRICE_ACCADEMIA_MONTHLY`  |
   | 6 | GLV — Accademia Annuale     | Ricorrente | €179,00   | Annuale   | `STRIPE_PRICE_ACCADEMIA_ANNUAL`   |

   Per ciascuno: copia il `price_...` che Stripe genera e incollalo nella variabile corrispondente su Vercel.

3. **Registra il Webhook:**
   - Dashboard → Developers → Webhooks → **Add endpoint**
   - Endpoint URL: `https://portale.grecolatinovivo.it/api/stripe/webhook`
   - Eventi da selezionare:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copia il **Signing secret** (`whsec_...`)

---

## PASSO 4 — Vercel (deploy)

### 4a. Crea il progetto
1. Vai su https://vercel.com → **Add New Project**
2. Importa il repo GitHub `portale-glv`
3. Framework: Next.js (rilevato in automatico)
4. **Non cliccare ancora Deploy** — prima aggiungi le variabili

### 4b. Variabili d'ambiente
In Vercel → Settings → **Environment Variables**, aggiungi queste (una alla volta):

```
DATABASE_URL                       = postgresql://...  (da Neon)
JWT_SECRET                         = <32+ caratteri casuali — vedi nota>
STRIPE_SECRET_KEY                  = sk_live_...
STRIPE_PUBLISHABLE_KEY             = pk_live_...
STRIPE_WEBHOOK_SECRET              = whsec_...

# 6 Price ID — 3 piani × 2 periodi
STRIPE_PRICE_CULTURA_MONTHLY       = price_...  (Cultura  €5,90/mese)
STRIPE_PRICE_CULTURA_ANNUAL        = price_...  (Cultura  €49/anno)
STRIPE_PRICE_LINGUAE_MONTHLY       = price_...  (Linguae  €12,90/mese)
STRIPE_PRICE_LINGUAE_ANNUAL        = price_...  (Linguae  €99/anno)
STRIPE_PRICE_ACCADEMIA_MONTHLY     = price_...  (Accademia €19,90/mese)
STRIPE_PRICE_ACCADEMIA_ANNUAL      = price_...  (Accademia €179/anno)

RESEND_API_KEY                     = re_...
RESEND_FROM_EMAIL                  = noreply@grecolatinovivo.it
NEXT_PUBLIC_APP_URL                = https://portale.grecolatinovivo.it
```

> **Come generare JWT_SECRET:** apri il Terminale sul tuo Mac e incolla:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
> Copia il risultato.

### 4c. Clicca Deploy
Vercel farà il build automaticamente. Ci vogliono 1-2 minuti.

---

## PASSO 5 — DNS su Serverplan (sottodominio portale)

Questo è il passo per collegare `portale.grecolatinovivo.it` a Vercel,
senza toccare il sito principale su Serverplan.

### 5a. Entra nel pannello DNS di Serverplan
1. Vai su https://clienti.serverplan.com → accedi
2. Dal menu: **Domini** → clicca su `grecolatinovivo.it`
3. Cerca la sezione **Gestione DNS** o **Zone DNS** (di solito è un tab o una voce di menu)

### 5b. Aggiungi il record CNAME
Nella sezione DNS, aggiungi un nuovo record con questi valori:

| Campo | Valore |
|---|---|
| **Tipo** | `CNAME` |
| **Nome / Host** | `portale` |
| **Valore / Destinazione** | `cname.vercel-dns.com` |
| **TTL** | `3600` (o "Automatico") |

> ⚠️ Attenzione: nel campo "Nome" scrivi solo `portale`, NON `portale.grecolatinovivo.it`.
> Serverplan aggiunge il dominio base in automatico.

### 5c. Aggiungi il dominio su Vercel
1. Vai su Vercel → tuo progetto → **Settings → Domains**
2. Clicca **Add Domain**
3. Digita: `portale.grecolatinovivo.it`
4. Vercel verificherà il record CNAME — diventa verde in 5-30 minuti

### 5d. Verifica
Dopo la propagazione DNS, `https://portale.grecolatinovivo.it` deve mostrare il portale.
Puoi controllare la propagazione su: https://dnschecker.org/#CNAME/portale.grecolatinovivo.it

---

## PASSO 6 — Database (una tantum, dopo il deploy)
Dal tuo computer (con Node.js installato):
```bash
cd portale-glv
npm install
npx prisma db push        # crea le tabelle su Neon
npm run db:seed           # inserisce i 21 corsi iniziali
```

---

## PASSO 7 — Resend (email transazionali)
1. Vai su https://resend.com → crea account → **API Keys** → crea chiave
2. **Domains** → Add Domain → inserisci `grecolatinovivo.it`
3. Resend ti darà dei record DNS (TXT e MX) da aggiungere su Serverplan
   - Torna nel pannello DNS Serverplan (come al Passo 5) e aggiungili
4. Clicca **Verify** su Resend — diventa verde in pochi minuti

---

## PASSO 8 — Test finale
- [ ] `https://portale.grecolatinovivo.it` → mostra la landing page
- [ ] Clicca "Registrati" → crea account → ricevi email di benvenuto
- [ ] Clicca "Abbonati" → checkout Stripe → carta test: `4242 4242 4242 4242` (qualsiasi data futura, qualsiasi CVC)
- [ ] Dopo pagamento → dashboard con toast "Abbonamento attivato"
- [ ] Profilo → "Gestisci abbonamento" → si apre Customer Portal Stripe
- [ ] Controlla che le email arrivino via Resend

---

## Riferimento rapido post-deploy

| Cosa | Dove |
|---|---|
| Aggiungere un corso | Modifica `prisma/seed.js` → `npm run db:seed` |
| Vedere utenti registrati | Neon Console → tabella `User` |
| Vedere abbonamenti attivi | Stripe Dashboard → Customers |
| Log errori in produzione | Vercel → Deployments → Functions → Logs |
| Cambiare prezzi | Stripe Dashboard → Products + aggiorna variabili su Vercel |
| Rideploy dopo modifiche al codice | `git push` → Vercel deploya in automatico |

---

**Tempo stimato per il deploy completo: ~45 minuti** (inclusa propagazione DNS)

> Il sito principale `grecolatinovivo.it` su Serverplan non viene toccato in nessun passo.
