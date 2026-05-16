# TECH NOTES — Portale GLV

## Stack scelto (mockup)
- **HTML5 + CSS3 + Vanilla JS** — nessuna dipendenza, zero build step
- **Google Fonts** (Montserrat + Inter) via CDN
- **FontAwesome 6** via CDN (icone)
- **Mock data** inline in app.js (array COURSES)
- **Auth simulata** via localStorage (chiave: `glv_user`)

## Stack target (produzione)
| Layer | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) su Vercel |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + magic link) |
| Email | Resend (conferme, fatture, onboarding) |
| Pagamenti | Stripe (subscription + one-time) |
| Video | Vimeo (link privati) |
| Hosting | Vercel (sottodominio portale.grecolatinovivo.it) |

## Come far girare il mockup
Apri `index.html` direttamente nel browser (doppio click) oppure avvia un server locale:
```bash
cd portale-glv
npx serve .
# oppure
python3 -m http.server 3000
```
Poi vai su http://localhost:3000

## Flusso demo
1. Apri `index.html` → landing page (non abbonato)
2. Clicca "Accedi" o "Inizia gratis" → login simulato → vai a `dashboard.html`
3. Clicca qualsiasi card → vai a `corso.html?id=...`
4. Nav → Catalogo → `catalogo.html` con filtri funzionanti
5. Nav → Profilo → `profilo.html`
6. Clicca "Esci" → torna a `index.html` e pulisce localStorage

## Struttura JS (API-ready)
Le funzioni che oggi usano mock data sono pronte per essere sostituite con chiamate API reali:

```js
// OGGI (mock):
const COURSES = [ /* array inline */ ];

// DOMANI (Supabase):
const { data: COURSES } = await supabase.from('courses').select('*');
```

```js
// OGGI (mock auth):
Auth.login() → localStorage.setItem('glv_user', ...)

// DOMANI (Supabase Auth):
await supabase.auth.signInWithPassword({ email, password })
```

## Struttura database (Supabase)
```sql
-- Tabelle principali da creare
courses (id, lang, level, title, description, price, is_new, thumbnail_url, created_at)
lessons (id, course_id, title, duration_min, vimeo_url, is_free, sort_order)
subscriptions (id, user_id, plan, status, stripe_sub_id, current_period_end)
purchases (id, user_id, course_id, stripe_payment_id, created_at)
users (id, email, full_name, avatar_url) -- estende auth.users di Supabase
```

## Webhook Stripe → accesso contenuto
1. Utente paga → Stripe genera `checkout.session.completed`
2. Webhook PHP/Next.js riceve evento
3. Scrive in `subscriptions` o `purchases` su Supabase
4. Resend invia email di conferma con link al portale
5. Supabase RLS (Row Level Security) controlla accesso ai video

## Import dal portale Aruba
Script da costruire:
1. Export MySQL da phpMyAdmin del vecchio portale
2. Script Node.js legge SQL dump → trasforma in formato Supabase
3. Insert batch in tabelle `courses` + `lessons`
4. Nessuna modifica manuale

## Note deploy Vercel
- Aggiungere record DNS `portale` → CNAME a `cname.vercel-dns.com`
- Variabili d'ambiente: SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE_KEY, RESEND_KEY
