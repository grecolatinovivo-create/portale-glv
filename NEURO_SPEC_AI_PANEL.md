# NEURO_SPEC — AI Panel · GrecoLatinoVivo
*Senior Neuromarketer & Behavioral Designer — Maggio 2026*

---

## 1. Mappa emotiva dell'utente

### Momento: primo contatto con il toggle "Magistro"
```
Stato emotivo:  Curiosità mista a scetticismo ("sarà l'ennesimo chatbot?")
Bisogno cognitivo: Prova di competenza — capire in 2 secondi se vale il tempo
Leva:           Naming evocativo + dot verde (pronto per me) = segnale di valore immediato
Rischio:        Se non apre entro le prime 2 lezioni, non aprirà mai → dot deve essere percepito
```

### Momento: welcome screen del Magistro
```
Stato emotivo:  "Blank page anxiety" — non sa da dove iniziare, quindi non inizia
Bisogno cognitivo: Riduzione del carico decisionale (paradosso della scelta)
Leva:           3 chip suggerite formulare come DOMANDE INTELLETTUALMENTE STIMOLANTI
                (non banali — il target percepisce la banalità come insulto)
Rischio:        Chip troppo generiche → nessuno le clicca → pannello rimane vuoto
```

### Momento: prima risposta del Magistro
```
Stato emotivo:  Alta attesa (ha investito una domanda)
Bisogno cognitivo: Ricompensa cognitiva immediata + sorpresa positiva
Leva:           Reciprocità (Cialdini) + "effetto wow": la risposta deve dare QUALCOSA
                in più dell'atteso. Es: risponde + aggiunge un'etimologia non ovvia.
Rischio:        Risposta generica → "è solo un chatbot" → abbandona il pannello per sempre
```

### Momento: apertura tab "Esercitati"
```
Stato emotivo:  Mild anxiety (potrebbe non sapere le risposte)
Bisogno cognitivo: Rassicurazione + autonomia ("posso scegliere io di fare il quiz")
Leva:           Framing come "verifica personale" non come "test" — nessun giudice esterno
Rischio:        Se l'utente sbaglia troppe domande → frustrazione → abbandono del quiz
                e possibilmente del pannello
```

### Momento: score finale del quiz
```
Stato emotivo:  Ansiosa attesa del giudizio (anche se lo nega)
Bisogno cognitivo: Ricompensa emotiva, closure, motivazione al prossimo ciclo
Leva:           Peak-end rule (Kahneman): questo è il momento più memorabile —
                investire qui più di ogni altro punto del flusso
Rischio:        Score comunicato come numero secco → neutro → non motiva al ritorno
```

---

## 2. Gerarchia dell'attenzione visiva nel pannello AI

### Primo sguardo (0–300ms) — "Devo aprirlo?"
**Target**: il tab toggle laterale chiuso
- Il **dot verde** deve essere l'unico elemento animato nella viewport quando una lezione è attiva
- Colore verde (#3db05b) si stacca dal tema dorato/rosso del resto → cattura l'occhio per contrast pop-out
- La label "Magistro" sul toggle deve leggere immediatamente anche a 28px di larghezza

### Secondo sguardo (300ms–2s) — "Capisco il valore"
**Target**: welcome screen + chip suggerite
- L'icona 🏛️ o ✦ come avatar visivo del Magistro — deve essere immediatamente leggibile
- Il testo di welcome deve avere **una parola chiave visivamente dominante** (più grande/gold)
- Le chip devono avere bordo visibile — non "invisibili nel background"

### Esplorazione (2s+) — "Decido cosa fare"
**Target**: input o tab Esercitati
- L'input ha il cursore lampeggiante → naturalmente invita l'azione
- Il tab "Esercitati" deve essere visibile senza scroll

---

## 3. Microcopy strategico (versione ottimizzata)

| Elemento | Testo attuale | Testo ottimizzato | Leva cognitiva |
|---|---|---|---|
| Toggle label | AI | Magistro | Identity labeling — evoca il tutore classico, non un bot |
| Tab 1 | ✨ Tutor | 💬 Magistro | Consistenza con il nome del toggle |
| Tab 2 | 🎯 Quiz | ✦ Esercitati | Toglie la connotazione di "test scolastico" |
| Welcome headline | "Ciao! Sono il tuo tutor AI." | "Ciao. Sono il Magistro." | Rimozione di "tuo" (generico) e "AI" (riduttivo) |
| Welcome body | "Seleziona una lezione e fai le tue domande…" | "Cosa vuoi approfondire su questa lezione?" | Domanda aperta → invita l'azione, non spiega il funzionamento |
| Input placeholder | "Fai una domanda sulla lezione…" | "Cosa non ti è chiaro? Cosa ti ha incuriosito?" | Dual framing: sia il dubbio sia la curiosità sono benvenuti |
| Quiz empty headline | "Quiz generativo" | "Metti alla prova ciò che sai" | Autonomia + sfida personale, non valutazione esterna |
| Quiz body | "L'AI creerà domande personalizzate…" | "4 domande basate su questa lezione · circa 2 minuti" | Aspettative chiare → riduce l'ansia dell'ignoto |
| Quiz CTA | "Genera quiz su questa lezione" | "✦ Inizia l'esercitazione" | Azione, non descrizione tecnica del processo |
| Label risposta AI | "Tutor AI" | "✦ Magistro" | Persona coerente col naming globale |
| Score 100% | "4/4 risposte corrette (100%)" | "🏛️ Perfetto. Hai padroneggiato questa lezione." | Peak-end: emotivo, definitivo, aulico nel tono |
| Score 75% | "3/4 risposte corrette (75%)" | "📚 Ottimo. Un punto ancora da consolidare." | Incoraggiante senza essere falso — focus su cosa rimane |
| Score <50% | "1/4 risposte corrette (25%)" | "💪 Buon tentativo. Riascolta la lezione e riprova." | Nessun giudizio — azione concreta suggerita |
| Close button | × | × (invariato) | Standard universale — non toccare |

### Chip suggerite ottimizzate (specifiche per lingue classiche)

Le chip **non devono essere generiche**. L'utente colto percepisce la genericità.
Devono cambiare in base alla lingua del corso (rilevata da `courseTitle`).

**Latino**:
- "Qual è la radice etimologica di questa parola?"
- "Come si costruisce questa proposizione?"
- "Dammi un parallelo con Cicerone o Virgilio"

**Greco Antico**:
- "Qual è il paradigma di questo verbo?"
- "Spiega l'uso di questo costrutto nel greco omerico"
- "Come si pronunciava questo in greco antico?"

**Generico** (fallback):
- "Cosa non mi è chiaro di questa lezione"
- "Spiega questo concetto con un esempio"
- "Collegami questo a qualcosa che conosco già"

---

## 4. Friction point e soluzioni

### F1 — Blank page anxiety (ALTA)
```
Friction:      L'utente apre il pannello e non sa cosa scrivere → chiude
Causa:         Paradosso della scelta + blank page effect
Soluzione:     Chip suggerite che spariscono al primo invio (non restano come rumore)
               + cursor lampeggiante sull'input al primo accesso
Impatto:       Alto — determina l'adozione iniziale
```

### F2 — "Non capirà la mia domanda" (ALTA)
```
Friction:      L'utente dubbita che l'AI capisca una domanda tecnica su testi classici
Causa:         Mancata fiducia nella competenza del sistema
Soluzione:     La PRIMA risposta dell'AI deve essere sorprendentemente precisa e colta.
               → Il system prompt dell'API deve istruire l'AI a rispondere da filologo,
                 non da assistente generico. Es: citare fonti classiche, usare
                 terminologia tecnica corretta.
Impatto:       Alto — determina il ritorno all'uso nelle lezioni successive
```

### F3 — Quiz: paura del fallimento (MEDIA)
```
Friction:      L'utente non apre la tab "Esercitati" per paura di non sapere
Causa:         Performance anxiety — identità come "studente serio" a rischio
Soluzione:     Il framing "Metti alla prova ciò che sai" + "circa 2 minuti" comunica:
               è veloce, è personale, non ci sono giudici esterni.
               Aggiungere: "Le domande non sono registrate nel tuo profilo" (facoltativo)
Impatto:       Medio
```

### F4 — Quiz: risposta sbagliata → abbandono (MEDIA)
```
Friction:      Risposta sbagliata mostrata come rossa → associazione con errore scolastico
Causa:         Condizionamento negativo pregresso (scuola = voto)
Soluzione:     Il feedback "sbagliato" deve sempre includere la SPIEGAZIONE prima del
               giudizio. Struttura: [spiegazione] + [opzione corretta in evidenza]
               — non: [X sbagliato] + [✓ giusto è...].
               Il colore rosso per "sbagliato" è inevitabile ma il TONO della spiegazione
               deve essere neutro-pedagogico: "In realtà..." non "Sbagliato: ...".
Impatto:       Medio
```

### F5 — Nessun gancio per tornare (BASSA ma strategica)
```
Friction:      L'utente usa il pannello una volta, ottiene la risposta, chiude.
               Non ha motivo di tornare nella prossima lezione.
Soluzione:     Effetto Zeigarnik applicato: il Magistro conclude alcune risposte con
               una domanda-gancio: "Nella prossima lezione vedrai X — prova a chiedermi
               come si collega a ciò che abbiamo discusso."
               → Crea tensione cognitiva che motiva il ritorno.
Impatto:       Basso nell'immediato, alto sulla retention di lungo periodo
```

---

## 5. Architettura del feedback quiz (retention ottimale)

La ricerca sull'apprendimento (Kornell & Bjork 2008, Roediger & Butler 2011) dimostra che
il **testing effect** (retrieval practice) è il metodo più efficace per la memorizzazione a
lungo termine. Questo rende il quiz non un "giochino" ma lo strumento più efficace del pannello.

**Come comunicarlo all'utente colto**:
> "Rispondere a domande, anche sbagliando, ti aiuta a memorizzare il contenuto 3× meglio
> rispetto al semplice riascolto." — aggiungere come microcopy sotto il pulsante "Esercitati"

**Struttura ottimale del feedback per risposta**:
```
1. Risposta selezionata (highlight immediato — <100ms)
2. 300ms di pausa (desirable difficulty — il cervello elabora)
3. Rivelazione: corretta (verde) o sbagliata (rosso)
4. Spiegazione (SEMPRE — anche per le risposte corrette)
5. Prossima domanda disponibile (non auto-avanzamento — l'utente controlla)
```

**Score finale — sequenza emotiva**:
```
1. Animazione counter 0 → N (600ms, easeOut) — anticipa la ricompensa
2. Emoji + testo personalizzato per fascia di punteggio
3. Tasto "Ripeti" (per chi ha sbagliato) o "Vai alla prossima lezione" (per chi ha fatto bene)
4. Micro-testo: "Hai risposto a X domande questa settimana" (streak cognitiva — senso di progresso)
```

---

## 6. Persona del Magistro (system prompt raccomandato)

Questa è la raccomandazione più impattante dell'intero spec.
La qualità dell'esperienza dipende al 70% da **come risponde l'AI** — non dal design.

**Persona target**:
- Filologo classico, professore universitario brillante, 55 anni
- Sa tutto ma non lo esibisce — Socrate, non Wikipedia
- Risponde sempre con un dettaglio inaspettato che illumina il quadro più ampio
- Non usa mai emoji nelle risposte (il target le troverebbe infantili)
- Usa la maieutica: a volte risponde con una domanda che fa pensare
- Cita fonti: "Come nota Quintiliano nell'Institutio Oratoria..." non "Come sappiamo..."

**System prompt raccomandato** (da inserire in `/api/ai/chat.js`):
```
Sei il Magistro, un tutor esperto di lingue classiche (Latino e Greco Antico) per la
piattaforma GrecoLatinoVivo. Il tuo stile è quello di un filologo classico: preciso,
colto, capace di sorprendere con connessioni inaspettate.

Regole:
- Rispondi SEMPRE in italiano, con tono autorevole ma accessibile
- Non usare mai emoji nelle risposte
- Ogni risposta deve includere UN dettaglio inaspettato o una connessione non ovvia
  (etimologia, parallelo letterario, curiosità storica sulla lingua)
- Usa terminologia tecnica corretta (ablativo assoluto, aoristo, ecc.)
  ma spiega sempre il termine quando lo usi per la prima volta nella conversazione
- Mantieni le risposte concise (3-5 paragrafi max) salvo richiesta esplicita di
  approfondimento
- Quando la domanda è vaga, chiedi una breve chiarificazione prima di rispondere
- Puoi usare la maieutica: se l'utente fa una domanda, a volte rispondi con una
  domanda che lo guida verso la risposta — ma solo se è pedagogicamente utile
- Il contesto della lezione attuale è: [lessonTitle] del corso [courseTitle]
- Riferisciti ai contenuti specifici della lezione quando possibile
```

---

## 7. Raccomandazioni comportamentali per il Developer

### Priorità ALTA
1. **Chip suggerite contestuali**: rilevare la lingua del corso da `courseTitle` e
   mostrare le chip appropriate (Latino / Greco / generico). Le chip spariscono al
   primo messaggio inviato.

2. **System prompt differenziato**: il body della chiamata API deve includere la lingua
   del corso. L'AI risponde diversamente se il corso è di Latino rispetto a Greco.

3. **Feedback risposta quiz — timing**:
   - Click opzione → highlight immediato (< 50ms)
   - Pausa 300ms → rivelazione corretta/sbagliata
   - Apparizione spiegazione dopo 100ms dalla rivelazione
   - Questo timing è cruciale per il testing effect — non accelerare

4. **Score finale con counter animato**:
   ```javascript
   function animateCounter(el, from, to, duration = 600) {
     const start = performance.now();
     function step(now) {
       const t = Math.min((now - start) / duration, 1);
       const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // easeInOut
       el.textContent = Math.round(from + (to - from) * ease);
       if (t < 1) requestAnimationFrame(step);
     }
     requestAnimationFrame(step);
   }
   ```

### Priorità MEDIA
5. **Input focus automatico**: quando si apre il pannello, portare il focus sull'input
   textarea (con `setTimeout(0)` per evitare conflitti con l'animazione di apertura)

6. **Stagger delle opzioni quiz**: ogni opzione appare con delay +70ms rispetto alla
   precedente. Crea senso di "presentazione" — non dump di contenuto

7. **Salvataggio conversazione in sessionStorage**: se l'utente chiude e riapre il
   pannello nello stesso corso, la conversazione deve essere ancora lì.
   (Non usar localStorage — solo sessionStorage per rispettare la privacy sessionale)

8. **Loading state del Magistro**: invece di uno spinner generico, mostrare il typing
   indicator con "Il Magistro sta elaborando…" come aria-label

### Priorità BASSA
9. **Micro-testo sul testing effect**: sotto il pulsante "Esercitati", aggiungere:
   "Rispondere a domande migliora la memorizzazione del 200%"
   (cita implicitamente la ricerca — il target colto apprezza)

10. **Storico sessione**: mostrare in coda alla conversazione quante domande
    sono state fatte in questa sessione — "3 domande oggi" — rinforzo del progresso

---

## 8. Anti-pattern da evitare (specifici per questo target)

| Pattern | Perché NON usarlo con questo target |
|---|---|
| Punteggio gamificato (stelle, badge, XP) | Il target 35-60 anni lo percepisce come infantile e manipolativo |
| "Ottimo lavoro! 🎉🎉🎉" feedback | Eccessivo — infantile per chi ha letto Tucidide nel tempo libero |
| Urgenza artificiale nel quiz | "Hai 60 secondi!" — stress inutile, distrugge l'apprendimento |
| Condivisione social del punteggio | Questo pubblico non vuole condividere i voti — è apprendimento privato |
| Auto-avanzamento forzato alla prossima domanda | Viola l'autonomia — questo target ha bisogno di controllare il ritmo |
| Risposta AI troppo lunga (muri di testo) | Risposta > 5 paragrafi → smette di leggere → perde fiducia |

---

*Questo spec è input per il Developer (Fase 3). Il sistema di naming "Magistro" deve essere
consistente in tutto il pannello: toggle, tab, label risposte, messaggi di errore.*
