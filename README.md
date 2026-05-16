# Portale GLV — portale.grecolatinovivo.it

## Obiettivo principale
Piattaforma di video-corsi in abbonamento stile Netflix/Learnn, dedicata alle lingue classiche e alla didattica. Accesso a tutto il catalogo con abbonamento mensile o annuale; acquisto singolo per chi non vuole abbonarsi.

## Utenti target
- Studenti già iscritti all'elearning GLV che vogliono continuare o aggiungere lingue
- Nuovi utenti appassionati di lingue classiche (35–60 anni, alto livello culturale)
- Docenti che cercano materiali di didattica delle lingue classiche

## Requisiti funzionali
1. Landing page per non abbonati (hero, catalogo preview, pricing, CTA)
2. Dashboard abbonato stile Netflix (righe orizzontali per categoria, hero con corso in evidenza)
3. Catalogo sfogliabile per lingua e per livello con filtri
4. Pagina singolo corso (lezioni, docente, descrizione, CTA accesso)
5. Sistema abbonamento Stripe (mensile €12,90 / annuale €99)
6. Acquisto singolo corso senza abbonamento
7. Area profilo utente (dati, abbonamento, cronologia)

## Vincoli
- Mockup HTML/CSS/JS puro — nessun backend reale
- Struttura API-ready per aggancio successivo (Supabase + Next.js)
- Coerenza visiva con sito GLV (#a01a36, #232323, Montserrat)
- Dark theme Netflix-style come strato aggiuntivo

## Struttura file
```
portale-glv/
├── index.html        Landing page (non abbonati)
├── dashboard.html    Home abbonato (Netflix-style)
├── catalogo.html     Catalogo completo con filtri
├── corso.html        Pagina singolo corso
├── profilo.html      Area profilo utente
├── css/style.css     Design system completo
├── js/app.js         Logica, dati mock, interazioni
├── README.md
├── UX_SPEC.md
├── TECH_NOTES.md
└── QA_REPORT.md
```

## Rischi
- Thumbnails: usare gradienti CSS fino a disponibilità immagini reali
- Dati corsi: mock JSON inline — da sostituire con API call
- Auth: simulata via localStorage — da sostituire con Supabase Auth
