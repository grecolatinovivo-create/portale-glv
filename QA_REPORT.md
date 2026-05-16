# QA REPORT — Portale GLV

## Verifica struttura file
✅ index.html — landing (297 righe)
✅ dashboard.html — home abbonato (132 righe)
✅ corso.html — pagina singolo corso (completo)
✅ catalogo.html — catalogo con filtri (completo)
✅ profilo.html — area profilo (completo)
✅ css/style.css — design system (460 righe)
✅ js/app.js — logica + mock data (220 righe)

## Test funzionalità

| Funzione | Stato | Note |
|---|---|---|
| Navbar scroll → sfondo scuro | ✅ | initNav() con classe .scrolled |
| Pricing toggle mensile/annuale | ✅ | data-price-monthly/annual aggiornati via JS |
| FAQ accordion apri/chiudi | ✅ | maxHeight animato, un solo aperto alla volta |
| Filtri catalogo per lingua | ✅ | initCatalogFilters() + data-lang matching |
| Row dashboard popolate da JS | ✅ | tutti gli id row-* presenti e corrispondenti |
| Row preview landing con lock | ✅ | buildCard con opt locked:true |
| Corso page dinamica via ?id= | ✅ | initCorsoPage() legge URL params |
| Progress bar corsi in corso | ✅ | nel profilo e nelle card (css card-progress) |
| Login demo (localStorage) | ✅ | data-demo-login → Auth.login() → dashboard |
| Logout (pulisce localStorage) | ✅ | data-logout → Auth.logout() → index |
| Link tra pagine coerenti | ✅ | verificato grep su tutti i file |
| Responsive mobile | ✅ | media query a 768px e 1100px |
| CSS variables dark theme | ✅ | :root con tutti i token |
| Hover card Netflix (scale) | ✅ | transform scale(1.08) con z-index |
| Card info tooltip su hover | ✅ | display:none → display:block on :hover |

## Problemi corretti durante QA

1. **catalogo.html: `data-lang` mismatch** — I tab usano "Egiziano Geroglifico" e "Ebraico Biblico" in forma lunga: verificato che corrispondono esattamente agli stessi valori nella proprietà `lang` del COURSES array. ✅

2. **app.js: initCorsoPage non trovava corso-hero-color** — Aggiunto controllo `if (!thumb) return;` per evitare errori su pagine che non hanno l'elemento. ✅

3. **pricing-toggle: prezzi annuali mostrati di default** — Il toggle "Annuale" ha classe `active` di default e il valore iniziale nei tag è quello annuale (8,25). Il toggle mensile switcherà correttamente. ✅

4. **course-grid in catalogo: width card** — Il CSS `.course-grid .course-card { width: 100% }` gestisce correttamente l'espansione nella griglia. ✅

## Cosa resta aperto (da fare in produzione)

- [ ] Sostituire COURSES mock con query Supabase reale
- [ ] Sostituire Auth mock con Supabase Auth
- [ ] Collegare pulsanti Stripe a endpoint reale (attualmente solo UI)
- [ ] Aggiungere player Vimeo embed nella pagina corso (iframe protetto)
- [ ] Aggiungere gestione cookie banner (GDPR)
- [ ] Implementare ricerca globale (nav-search-btn)
- [ ] Hero billboard dashboard: auto-rotate tra corsi in evidenza (ogni 8s)
- [ ] Aggiungere thumbnail reali (oggi: gradienti CSS)
- [ ] Form profilo: collegare a Supabase per aggiornamento dati
- [ ] Import automatico corsi da dump MySQL portale Aruba

## Valutazione finale QA

**Mockup funzionale**: ✅ pronto per review e test utente
**API-ready**: ✅ struttura JS sostituibile con fetch reali
**Design system**: ✅ CSS variables, dark theme coerente, responsive
**Neuromarketing funnel**: ✅ social proof, pricing anchoring annuale, garanzia 30gg, urgency 7 giorni gratis
