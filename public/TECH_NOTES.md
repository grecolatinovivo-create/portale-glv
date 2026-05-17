# TECH_NOTES — Portale GLV v3

## Stack scelto

**Next.js (Pages Router)** — già in produzione, non modificato.

File statici in `/public/` serviti direttamente. JS globale in `/public/js/app.js`.
CSS interamente inline in ogni pagina `<style>` — scelta intenzionale per evitare dipendenze e ridurre il bundle JS.

## Scelte tecniche del redesign

### Perché CSS inline e non file esterno
Next.js serve i file statici ma non processa il CSS inline come Tailwind/CSS Modules.
Mantenere tutto inline per ogni pagina permette:
- Zero build step per il CSS
- Nessun rischio di collisione tra classi
- Deploy immediato modificando solo i file HTML

### Design system tramite CSS custom properties
Tutte le pagine usano le stesse variabili CSS (`--primary`, `--font-heading`, ecc.) definite in `:root` dentro il `<style>` di ogni pagina. In caso di futura estrazione in file esterno, basta spostare le variabili.

### Stripe — flusso completo

```
[button data-open-register data-plan="cultura|linguae|accademia"]
  → app.js listener su [data-open-register]
  → if(plan) Payments.subscribe(plan)
  → getCurrentBillingPeriod() legge #tog-annual.classList.contains('active')
  → key = `${plan}_${period}` (es. "linguae_monthly")
  → window.__GLV_PRICES[key] = priceId (da /api/config/prices)
  → POST /api/stripe/checkout { type:'subscription', priceId }
  → Stripe session.url → redirect
```

### Billing toggle
- `#billingToggle` — toggle visivo
- `#tog-annual` — sentinella per `getCurrentBillingPeriod()` in app.js
- `updatePricing()` in index.html sincronizza entrambi
- I button di pricing usano `data-plan` senza suffisso periodo — il periodo è letto dal toggle

### Hook JS critici — NON TOCCARE

| Selettore | Funzione |
|-----------|---------|
| `[data-open-register]` | Apre modal auth o avvia Stripe |
| `[data-plan]` | Piano da passare a `Payments.subscribe()` |
| `#tog-annual` | Periodo (monthly/annual) corrente |
| `#billingToggle` | Toggle visivo |
| `[data-lesson-id]` | Player lezioni in corso.html |
| `[data-buy-course]` | Acquisto corso singolo |
| `[data-course-slug]` | Slug corso per API |
| `[data-tab]` | Tab navigation in profilo.html |
| `[data-subscribe-monthly/annual]` | Legacy dashboard.html |
| `#btnLogin` | Aggiornato da app.js con stato auth |
| `#modalDocenti` | Modal docenti in index.html |

## Come far girare il progetto

```bash
cd portale-glv
npm install
cp .env.example .env
# Compilare .env con:
#   DATABASE_URL (Neon PostgreSQL)
#   JWT_SECRET
#   STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
#   STRIPE_PRICE_CULTURA_MONTHLY, _ANNUAL
#   STRIPE_PRICE_LINGUAE_MONTHLY, _ANNUAL
#   STRIPE_PRICE_ACCADEMIA_MONTHLY, _ANNUAL
#   RESEND_API_KEY + RESEND_FROM_EMAIL
#   NEXT_PUBLIC_APP_URL=https://portale.grecolatinovivo.it

npx prisma db push
node prisma/seed.js   # Carica i 56 corsi reali
npm run dev           # → http://localhost:3000
```

## Diagnosi Stripe (debug)

Aprire in browser: `/api/debug/checkout`
Restituisce JSON con stato di ogni variabile d'ambiente. Se una variabile STRIPE_PRICE_* è MANCANTE, il checkout mostra errore.

## Git — nota importante

Il branch `main` è broken (file `main 2.lock` nella cartella `.git/refs/heads/`).
Per risolvere: `rm -f .git/refs/heads/main\ 2.lock` o rinominare il file.
Non usare `git stash` finché il branch non è riparato.
