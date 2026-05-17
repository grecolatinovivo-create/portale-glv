# Portale GLV — Centro Nazionale di Studi Classici
*GrecoLatinoVivo · Fondato a Firenze nel 2015*

## Obiettivo principale
Portale di e-learning per la didattica del Latino, Greco, Egiziano e Ebraico. Abbonamento mensile/annuale con 3 piani (Cultura €5,90/mese · Linguae €12,90/mese · Accademia €19,90/mese). 12.447 studenti in 10 anni. 56 corsi nel catalogo.

## Utenti target
- Studenti liceali (Latino e Greco obbligatorio)
- Docenti in formazione continua (Bonus Docenti MIM)
- Appassionati di antichità (40+)
- Ricercatori universitari

## Requisiti funzionali (invarianti)

1. **Stripe Checkout** — 6 piani: cultura-mensile, cultura-annuale, linguae-mensile, linguae-annuale, accademia-mensile, accademia-annuale. Flusso: button[data-open-register data-plan] → app.js → /api/stripe/checkout.
2. **Auth modal** — Login/registrazione via [data-open-register] senza data-plan. Gestito da app.js.
3. **Billing toggle** — #billingToggle + #tog-annual (sentinella periodo). updatePricing() in index.html.
4. **Corso player** — [data-lesson-id] su ogni li.lezione-item. Struttura HTML intoccabile.
5. **Tab profilo** — [data-tab] su nav-tab e section.tab-content. Valori: corsi, attestati, abbonamento, impostazioni.
6. **Catalogo filtri** — Sidebar con checkbox lingua/livello. Classi CSS usate da app.js per show/hide.

## Elementi HTML non modificabili (lista esplicita)

| File | Elemento | Motivo |
|------|---------|--------|
| index.html | button[data-open-register data-plan] | Stripe checkout |
| index.html | #tog-annual | getCurrentBillingPeriod() in app.js |
| index.html | #billingToggle | Toggle visivo sincronizzato |
| index.html | #modalDocenti | Modal docenti |
| corso.html | li.lezione-item[data-lesson-id] | Player lezioni |
| corso.html | [data-buy-course] | Acquisto singolo corso |
| corso.html | [data-course-slug] | Riferimento backend |
| profilo.html | [data-tab] | Tab navigation |
| dashboard.html | [data-subscribe-monthly/annual] | Legacy subscribe |
| tutte | #btnLogin | Auth state check |

## Vincoli e rischi

- **Git branch rotto** — impossibile fare rollback automatico. Backup manuale prima di ogni sessione.
- **CSS inline** — ogni pagina ha il suo `<style>`. Nessun CSS esterno (scelta Next.js).
- **app.js globale** — qualsiasi elemento con data-* sbagliato rompe silenziosamente un flusso.
- **Vercel env vars** — i prezzi Stripe vengono da variabili d'ambiente; se mancano, il checkout mostra errore.

## Struttura cartelle

```
portale-glv/
├── public/
│   ├── index.html       # Landing page + pricing
│   ├── dashboard.html   # Dashboard studente
│   ├── catalogo.html    # Catalogo 56 corsi
│   ├── corso.html       # Pagina singolo corso
│   ├── profilo.html     # Profilo + attestati
│   ├── js/
│   │   └── app.js       # JS globale (NON TOCCARE)
│   ├── COUNCIL.md       # Brainstorming multiagent
│   ├── README.md        # Questo file
│   ├── UX_SPEC.md
│   ├── NEURO_SPEC.md
│   ├── TECH_NOTES.md
│   └── QA_REPORT.md
├── pages/api/           # Next.js API routes (NON TOCCARE)
├── prisma/              # Schema + seed database
└── lib/                 # Helpers (stripe, auth, resend)
```

## Come far girare il progetto

```bash
cd portale-glv
npm install
cp .env.example .env    # Inserire le variabili Stripe/DB/Resend
npx prisma db push
npx prisma db seed
npm run dev             # → http://localhost:3000
```
