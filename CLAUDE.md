# Regole di progetto — GrecoLatinoVivo Portale

## Modello di business

- **NON ESISTE il piano trial / trialing.** Tutti gli utenti pagano. Non introdurre mai logica basata su `status: 'trialing'`.
- Gli unici stati validi per una `Subscription` sono: `active`, `canceled`, `past_due`.
- In tutti i controlli di accesso usare `status === 'active'`, mai array con `trialing`.

## Accesso admin

- L'admin (`grecolatinovivo@gmail.com`) ha accesso completo a tutti i corsi e contenuti, senza bisogno di abbonamento.
- Il flag `isAdmin` viene calcolato in `/api/auth/me` confrontando `user.email === process.env.ADMIN_EMAIL`.
- Il bypass admin è implementato in `pages/api/courses/[id].js` (passo 0, prima di qualsiasi controllo subscription/purchase).
- Nel frontend (`dashboard.html`), se `user.isAdmin` è true, viene impostato `_adminTierActive = 3` (tier massimo = accademia).
- **NON aggiungere mai logica di trial o accesso gratuito temporaneo.** L'unico bypass speciale è quello admin.

## Regole permanenti per lo sviluppo

- **Bug fix**: verificare sempre l'intero flusso end-to-end, non solo il punto che si rompe.
  Seguire il percorso completo (registrazione → login → navigazione → azione) e controllare anche gli utenti esistenti, non solo i nuovi.
- **Quando l'utente dice che qualcosa non funziona**: fare prima un check approfondito nel codice e cercare il bug. Solo come ultima ipotesi chiedere del deploy.
- **Preferenze onboarding**: salvate nel DB (campi `onboardingDone`, `prefLang`, `prefLevel`, `prefGoal` su `User`), NON in localStorage. Così si sincronizzano su tutti i dispositivi.

## Stack tecnico

- Next.js (pages router) + HTML statico in `public/`
- PostgreSQL su Neon, ORM Prisma
- Auth JWT via cookie (lib/auth.js `withAuth`)
- Player video: Vimeo iframe con postMessage API
- Deploy: Vercel
