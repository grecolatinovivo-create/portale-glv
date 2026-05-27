# Council — Sezioni Tematiche Dashboard GLV
*Brainstorming — 2026-05-27*

## Decisioni condivise

1. **Classificazione JS con THEME_MAP** — costante configurabile, keyword su title+description — nessun DB change
2. **8 sezioni tematiche**: Mondo Greco · Mondo Romano · Archeologia · Filosofia e Storia · Letteratura · Arte e Civiltà · Lettura e Testi · Mondo Antico
3. **Soglia visibilità: min 2 corsi** per sezione
4. **Multi-sezione: max 2 sezioni per corso** (Netflix pattern)
5. **Posizione: dopo le sezioni lingua** (Latino, Greco, Egiziano, Ebraico)
6. **Locked card**: usa renderLockedCard esistente
7. **Nessun DB change per MVP**

## Mandato DEV

- THEME_MAP come const in testa al JS
- renderThemeRow(themeId, courses, tier) con min 2 corsi, stesso pattern renderRow
- Ogni sezione: <section class="dash-section hidden" id="section-[id]" aria-labelledby="...">
- Aggiungere sezioni a reorderSections DOPO le sezioni lingua
