# Council — Portale GLV Mobile
*Brainstorming del 16 maggio 2026*

## Decisioni condivise
1. Bottom nav 4 tab (Home · Catalogo · Dashboard · Profilo) — iniettata via JS su tutte le pagine
2. Sticky CTA bar su corso.html mobile — prezzo + bottone sempre visibili
3. Card width: 75vw su mobile in scroll orizzontale
4. card-btn touch target ≥ 44×44px via pseudo-element
5. Filter tabs: overflow-x scroll (no wrap) su mobile
6. Toast: bottom offset = bottom-nav-height (60px) + 24px su mobile
7. card-desc nascosta su mobile per leggibilità
8. NO banner sticky aggiuntivo — overload cognitivo (AUD)

## Mandato pipeline
- DEV: var(--bottom-nav-height): 60px in :root; body padding-bottom su mobile; inietta nav via initMobileNav()
- DEV: IntersectionObserver su corso per sticky CTA
- QA: testa 375px e 390px con Chrome devtools; verifica toast, sticky CTA, card scroll
