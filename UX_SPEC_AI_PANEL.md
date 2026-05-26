# UX SPEC — AI Panel v1 · GrecoLatinoVivo
*Senior UX/UI Designer — Maggio 2026*

---

## Contesto

Il pannello AI è un componente **secondario contestuale** che appare solo nella vista corso.
Non compete con il video player (il protagonista assoluto della pagina) — è una risorsa
consulta-quando-ne-hai-bisogno, non un elemento push.

**Utente target**: colto, 35-60 anni, si è abbonato per imparare sul serio.
Percepirà qualsiasi elemento "giochino" come infantile. L'AI deve sentirsi come un
**collega esperto**, non un chatbot.

---

## Criticità rilevate nell'implementazione base

### 1. CRITICA — Naming "AI" è generico e anonimo
**Problema**: il tab toggle laterale dice "AI" — non comunica valore, non è invitante.
**Soluzione**: cambiare in "Magistro" (latinismo evocativo del target) con un'icona wand/sparkle.
Il tono è autorevole, giocoso nella misura giusta, coerente col brand classico.

### 2. ALTA — Welcome state piatto
**Problema**: "Ciao! Sono il tuo tutor AI" + testo generico → friction cognitiva alta
(l'utente non sa da dove iniziare, quindi non inizia).
**Soluzione**: aggiungere 3 **domande suggerite cliccabili** che pre-compilano l'input.

```
💬 Chiedi al Magistro:
┌─────────────────────────────────┐
│  Come si declina questa parola? │
│  Spiega la struttura del brano  │
│  Traducimi questo periodo…      │
└─────────────────────────────────┘
```

Le chip sono cliccabili → inseriscono il testo nell'input e spostano il focus.

### 3. ALTA — Context bar invisibile
**Problema**: la context bar è testo muto #888 che nessuno legge.
**Soluzione**: aggiungere un **punto colorato** corrispondente al colore del corso
(Latino = rosso brand, Greco = blu, ecc.) e un layout pill con icona 📖.

### 4. MEDIA — Tab "Quiz" → nome freddo
**Problema**: "🎯 Quiz" evoca un test scolastico — il target 35-60 anni ha brutti ricordi.
**Soluzione**: "📋 Esercitati" — implica pratica volontaria, non valutazione.

### 5. MEDIA — Nessun close button nel pannello
**Problema**: l'utente che vuole chiudere il pannello deve ricordare di cliccare la tab
sul bordo — non è ovvio, specie su tablet.
**Soluzione**: aggiungere un "×" in alto a destra dentro il pannello (sottile, non dominante).

### 6. MEDIA — Pulsante "Genera quiz" insufficiente
**Problema**: il pulsante non comunica aspettative (quanto tempo? quante domande?).
**Soluzione**: "Genera 4 domande · ~2 min" con un'icona sparkle.
Sotto, aggiungere micro-testo: "Basate sul contenuto della lezione".

### 7. BASSA — AI messages: "Tutor AI" label è fredda
**Problema**: il label sopra ogni risposta AI è burocratico.
**Soluzione**: usare "Magistro" come nome del personaggio AI, con icona 🏛️ o ✦.

### 8. BASSA — Nessun indicatore "lezione attiva" sul tab toggle
**Problema**: l'utente non sa che il pannello è "pronto" con la lezione caricata.
**Soluzione**: aggiungere un piccolo dot verde animato (pulse) sul toggle quando
una lezione è selezionata e il pannello è chiuso.

---

## Design System: componenti AI panel

### Colori (dal design system reale)
```
pannello bg:       #141414   (--bg-card)
pannello border:   rgba(255,255,255,.08)  (--border)
tab attiva:        #c9962a   (--gold)
tab inattiva:      rgba(245,245,245,.45)
bubble utente bg:  rgba(160,26,54,.18)   (--primary-mid) → CAMBIA in gold-dim
bubble utente text:#f5f5f5
bubble AI bg:      rgba(255,255,255,.05)
bubble AI border:  rgba(255,255,255,.06)
chip suggested:    rgba(201,150,42,.1)   border rgba(201,150,42,.25)
chip text:         rgba(245,245,245,.75)
dot indicatore:    #3db05b (success green)
```

> Raccomandazione: la bubble utente attuale usa --primary-mid (rosso).
> Il rosso GLV è il colore di "errore/brand" — su sfondo scuro le bubble rosse
> leggono come warning. **Cambiare a gold-dim**: rgba(201,150,42,0.15).

### Tipografia nel pannello
```
label Magistro:  Inter 700, .65rem, letter-spacing .07em, uppercase, --gold
bubble testo:    Inter 400, .80rem, line-height 1.6
input:           Inter 400, .80rem
chip testo:      Inter 500, .75rem
quiz domanda:    Inter 600, .82rem
quiz opzione:    Inter 400, .78rem
context bar:     Inter 400, .68rem
```

### Componente: Suggested Questions Chip

```html
<!-- Aspetto visivo target -->
┌──────────────────────────────────────┐
│ 🏛️ Ciao! Sono il Magistro.           │
│ Sono qui per aiutarti con questa     │
│ lezione. Da dove vuoi iniziare?      │
│                                      │
│ Suggerimenti:                        │
│ ┌──────────────────────────────┐     │
│ │ Come si declina questa parola│     │
│ └──────────────────────────────┘     │
│ ┌──────────────────────────────┐     │
│ │ Spiega la struttura del brano│     │
│ └──────────────────────────────┘     │
│ ┌──────────────────────────────┐     │
│ │ Traducimi questo periodo     │     │
│ └──────────────────────────────┘     │
└──────────────────────────────────────┘
```

CSS chip:
```css
.ai-suggested-chip {
  padding: 7px 10px;
  background: rgba(201,150,42,.08);
  border: 1px solid rgba(201,150,42,.2);
  border-radius: 6px;
  font-size: .75rem; color: rgba(245,245,245,.72);
  cursor: pointer; text-align: left;
  transition: background .15s, border-color .15s;
}
.ai-suggested-chip:hover {
  background: rgba(201,150,42,.14);
  border-color: rgba(201,150,42,.4);
  color: rgba(245,245,245,.9);
}
```

### Wireframe: AI Panel desktop (300px larghezza)

```
┌─────────────────────────────────────────┐
│  [💬 Magistro]  [📋 Esercitati]    [×] │  ← tab bar + close
├─────────────────────────────────────────┤
│  🔵 Latino A1 · Lezione 3: Il verbo…   │  ← context bar con dot colorato
├─────────────────────────────────────────┤
│                                         │
│   🏛️                                   │
│   Ciao! Sono il Magistro.              │  ← welcome message
│   Cosa vuoi approfondire su            │
│   questa lezione?                      │
│                                         │
│   ┌───────────────────────────────┐    │
│   │ Come si declina questa parola │    │  ← chip 1
│   └───────────────────────────────┘    │
│   ┌───────────────────────────────┐    │
│   │ Spiega la struttura del brano │    │  ← chip 2
│   └───────────────────────────────┘    │
│   ┌───────────────────────────────┐    │
│   │ Traducimi questo periodo      │    │  ← chip 3
│   └───────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────┐  [→]      │
│  │ Fai una domanda…        │           │  ← input
│  └─────────────────────────┘           │
└─────────────────────────────────────────┘
```

### Wireframe: Tab "Esercitati" (stato iniziale)

```
┌─────────────────────────────────────────┐
│  [💬 Magistro]  [📋 Esercitati]    [×] │
├─────────────────────────────────────────┤
│  🔵 Latino A1 · Lezione 3: Il verbo…   │
├─────────────────────────────────────────┤
│                                         │
│              📋                        │
│   Metti alla prova                     │
│   ciò che hai imparato                │  ← empty state
│                                         │
│   4 domande · circa 2 minuti          │  ← aspettativa chiara
│                                         │
│   ┌─────────────────────────────────┐  │
│   │ ✦  Genera le domande            │  │  ← CTA principale
│   └─────────────────────────────────┘  │
│                                         │
│   Basate sul contenuto di              │
│   questa lezione                       │  ← micro-testo
└─────────────────────────────────────────┘
```

---

## Flusso utente AI Panel

```
[Utente apre corso] → [selectLesson()] → [dot verde pulsa sul toggle AI]
  → [Utente nota il toggle] → [Clicca toggle / FAB]
  → [Pannello si apre con slide-in]
  → [Vede welcome + 3 chip suggeriti]
  → [Clicca chip] → [Input pre-compilato] → [Utente completa e invia]
  → [Typing indicator] → [Risposta Magistro]
  → [Continua conversazione]
  
  OPPURE:
  → [Clicca tab "Esercitati"]
  → [Vede empty state con conteggio domande]
  → [Clicca "Genera domande"]
  → [Loading state nel pulsante]
  → [4 domande appaiono in stagger (ogni +80ms)]
  → [Risponde a tutte] → [Score finale con animazione]
  → [Può generare un nuovo set]
```

---

## Comportamento toggle (indicatore lezione attiva)

Quando `updateAiContext()` viene chiamata (nuova lezione selezionata):
- Se il pannello è **chiuso**: aggiungere classe `.ai-has-lesson` al toggle
  → dot verde (3px, pulsante) appare nell'angolo superiore destro del toggle
- Se il pannello è **aperto**: nessun indicatore (già visibile)
- Quando pannello si apre: rimuovere `.ai-has-lesson` (utente ha "visto")

CSS:
```css
.ai-panel-tab .ai-ready-dot {
  position: absolute; top: 6px; right: 6px;
  width: 6px; height: 6px; border-radius: 50%;
  background: #3db05b;
  animation: ai-pulse 2s ease-in-out infinite;
  opacity: 0; transition: opacity .3s;
}
.ai-panel-tab.ai-has-lesson .ai-ready-dot { opacity: 1; }
@keyframes ai-pulse {
  0%, 100% { transform: scale(1); opacity: .8; }
  50%       { transform: scale(1.5); opacity: .4; }
}
```

---

## Micro-interazioni da implementare

| Elemento | Interazione | Dettaglio |
|---|---|---|
| Pannello apertura | Slide-in + fade | Già implementato — OK |
| Chip suggerite | Click → input pre-fill + focus | Aggiungere highlight flash sull'input |
| Messaggio inviato | Bubble appare dal basso | Già OK |
| Typing indicator | 3 dot bounce | Già implementato — OK |
| Quiz opzioni | Stagger fade-in | Ogni opzione +60ms di delay |
| Quiz risposta corretta | Border verde + check icon flash | Aggiungere micro-bounceAnimation |
| Score finale | Counter animato 0→N | requestAnimationFrame counter |
| Toggle lezione attiva | Dot verde pulse | Da aggiungere |
| Close button [×] | Hover rosso sottile | Al click: closeAiPanel() |

---

## Raccomandazioni accessibilità (WCAG 2.1 AA)

- Contrasto bubble utente (gold-dim su nero): ratio ~4.8:1 — ✅ AA
- Contrasto tab attiva (gold su nero): ~7.2:1 — ✅ AA  
- Contrasto chip suggested: da verificare con tool (punta a ≥4.5:1)
- focus-visible su tutti i bottoni interattivi
- aria-live="polite" sull'area messaggi — già presente ✅
- role="tabpanel" + aria-labelledby — già presenti ✅
- Aggiungere aria-label="Indicatore lezione attiva" al dot verde

---

*Questo spec è input diretto per il Developer e Neuromarketer.*
