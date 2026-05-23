# TODO — Portale GLV

- [ ] **#62** UI — pulsante "Aggiungi al vocabolario" in film strip + modale vocabolario *(in corso)*
- [ ] **#63** Git commit e push finale
- [ ] **#64** Migra esercizi autocorrettivi da latin-cert a Neon

## Risorse lezione (nuovi task)
- [x] **#65** Schema Prisma — modello `LessonResource` + `latinCertId` su `Lesson`
- [x] **#66** Script `scripts/migrate-resources.js` — scarica PDF da latin-cert + popola Neon
- [x] **#67** API `GET /api/lesson-resources?lessonId=` — ritorna risorse per lezione
- [x] **#68** UI — sezione "Risorse da scaricare" nel film strip (CSS + JS)
- [ ] **#69** Esegui migrazione: `npx prisma db push` poi `node scripts/migrate-resources.js`

---

## Archivio completate

- [x] #61 API — /api/vocabulary (CRUD + review queue)
- [x] #60 DB — modello Vocabulary + prisma db push
- [x] #59 Streak qualitativa — aggiorna display in course header
- [x] #58 Git commit e push finale
- [x] #57 Streak qualitativa — "lezioni viste questa settimana"
- [x] #56 Filtro/ricerca nel catalogo
- [x] #55 Prima lezione gratuita — mark isFree in DB + badge UI
- [x] #54 Dashboard — barra progresso cross-corso globale
- [x] #53 Dashboard — overlay "Prossima lezione" a fine video
- [x] #52 Dashboard — sezione "Riprendi da dove hai lasciato"
- [x] #51 API — /api/progress/summary (progresso cross-corso)
- [x] #50 API — /api/progress/last-lesson (ultima lezione vista)
- [x] #49 Leggi codebase — schema, API progresso, struttura dashboard
- [x] #48 Update style.css — player CSS from container to iframe
- [x] #47 Rewrite video player JS — direct iframe (no SDK)
- [x] #46 Implementa tier-based access control sui corsi
- [x] #45 Query DB e genera MD con tutte le lezioni per corso
- [x] #44 Esegui migrazione completa lezioni da latin-cert
- [x] #43 Migrazione completa — fix Marziale + tutti i corsi rimanenti
- [x] #42 Popolare DB Neon con corsi e lezioni reali
- [x] #41 Estrarre corsi e lezioni dal database latin-cert.sql
- [x] #40 Aggiornare AUDIT_REPORT.md — tutti i problemi risolti
- [x] #39 Ammorbidire claim MIM accreditamento nel microcopy
- [x] #38 Security headers — creare/aggiornare vercel.json
- [x] #37 Link Privacy Policy nel footer dashboard
- [x] #36 GDPR — diritti utente accessibili dalla UI (cancella dati, esporta)
- [x] #35 Vimeo dnt=1 — disabilita tracking cookie di terze parti
- [x] #34 SRI integrity hash su FontAwesome CDN
- [x] #33 Launch agent-auditor
- [x] #32 Reposition film strip to fixed top-left (specular to mini-deck)
- [x] #31 Fix scroll bug — JS minHeight on course view render
- [x] #30 FASE 5 — QA: revisione critica vista corso
- [x] #29 FASE 4 — Developer: implementa vista corso in dashboard.html
- [x] #28 FASE 2+3 — UX + Neuromarketer: spec vista corso
- [x] #27 FASE 1 — PM: analisi e README.md pagina corso
- [x] #26 Git commit e push
- [x] #25 Aggiorna UI dashboard — sezione Gestisci abbonamento
- [x] #24 Crea POST /api/stripe/cancel-subscription
- [x] #23 Add cancelAtPeriodEnd to Subscription model
- [x] #22 Git commit and push all changes
- [x] #21 Create public/set-password.html
- [x] #20 Create pages/api/auth/resend-set-password.js
- [x] #19 Create pages/api/auth/set-password.js
- [x] #18 Remove Registrati link from login modal in app.js
- [x] #17 Protect register.js con X-Internal-Token header
- [x] #16 Update webhook.js to use token flow instead of temp password
- [x] #15 Add PasswordResetToken model to prisma/schema.prisma
- [x] #14 Add sendSetPasswordEmail to lib/resend.js
- [x] #13 Dashboard GLV — produzione completa (pipeline orchestra)
- [x] #12 Fix webhook Stripe: crea utente automaticamente se paga senza account
- [x] #11 Optimize mobile feature lists
- [x] #10 Pricing horizontal swipe on mobile
- [x] #9 Replace bottom nav with sticky CTA bar (mobile)
- [x] #8 Feature list: 3 voci visibili su mobile + "vedi tutto"
- [x] #7 Pricing: swipe orizzontale su mobile
- [x] #6 Sostituire bottom nav con sticky CTA bar
- [x] #5 Rimuovi tutti i link morti da index.html (mobile + desktop)
- [x] #4 Rinomina "Catalogo" → "Corsi" nella navbar e aggiungi anchor #corsi
- [x] #3 Commit e push di tutte le modifiche
- [x] #2 Cancella pagine HTML e mockup da public/
- [x] #1 Uniformare le card dei corsi in tutto il portale
