# QA Report — Mobile Experience GLV Portal
*16 maggio 2026 — viewport target: 375px iPhone / 390px iPhone Pro*

## Livello di rischio residuo: BASSO

## Riepilogo
- Problemi critici trovati e corretti: 4
- Regressioni desktop: 0
- CSS bilanciato: ✅ (339 { = 339 })
- JS sintassi: ✅ node --check OK

## Cosa funziona
- ✅ Bottom nav iniettata via JS su tutte le 5 pagine (< 768px)
- ✅ Bottom nav: 4 tab con icone + label (WCAG 2.4.6)
- ✅ Voce attiva rilevata da window.location.pathname
- ✅ Toast spostato sopra bottom nav: bottom: calc(60px + 20px)
- ✅ body.padding-bottom = var(--bottom-nav-height) su mobile
- ✅ Cards 75vw con scroll-snap su mobile
- ✅ card-btn-play/add: 44×44px (WCAG 2.5.5)
- ✅ card-desc nascosta su mobile (più respiro, decisione CLA+UX)
- ✅ catalog-filters: overflow-x scroll, no wrap
- ✅ pricing-cards: stack verticale, width 100% (override inline 300px con !important)
- ✅ corso-cta-card nascosta su mobile
- ✅ Sticky CTA bar su corso.html: prezzo + bottone fisso sopra bottom nav
- ✅ Sticky CTA nascosta quando il video player è aperto (MutationObserver)
- ✅ grid-template-columns:1fr 1fr → 1fr su mobile (div selector)
- ✅ Sezioni con padding inline 48px → 16px mobile
- ✅ viewport-fit=cover su tutte le 5 pagine (safe area iPhone)
- ✅ footer con padding-bottom = bottom-nav-height + 24px
- ✅ Modali: slide-up dal basso su mobile (border-radius top, no padding)

## Problemi corretti durante QA

### Bug 1 — Selector CSS sbagliato per griglia 2-colonne
- Prima: `section[style*="grid-template-columns:1fr 1fr"]` → non matchava
- Dopo: `div[style*="grid-template-columns:1fr 1fr"]` → corretto

### Bug 2 — Sticky CTA leggeva onclick dal pulsante statico
- Prima: `btnDesktop.getAttribute('onclick')` → onclick hardcoded 'lat-a11'
- Dopo: slug letto da URLSearchParams → slug corretto per ogni corso

### Bug 3 — Prezzo sticky CTA poteva essere vuoto
- Prima: leggeva da `.corso-price .js-corso-price` (selector troppo specifico)
- Dopo: legge da `.js-corso-price` globale (già popolato da initCorsoPage)

### Bug 4 — nav-right btn-ghost visibile su mobile
- Prima: solo nav-links nascosti, rimasto il bottone "Esci"
- Dopo: `.nav-right .btn-ghost { display: none }` su mobile

## Raccomandazioni aperte
- [ ] Testare su device fisico iOS (Safari) per safe-area-inset-bottom
- [ ] Testare landscape mode (90° rotation) su iPhone
- [ ] Valutare swipe gesture orizzontale su testimonials (carousel mobile)
- [ ] Profilo.html: verificare che le progress bar dei corsi siano leggibili a 375px

## Note
Nessuna regressione desktop rilevata. I breakpoint 768px e 480px sono addittivi
e non sovrascrivono le regole desktop se non esplicitamente necessario.
