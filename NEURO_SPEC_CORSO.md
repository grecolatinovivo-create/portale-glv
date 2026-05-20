# NEURO_SPEC_CORSO.md — Psicologia cognitiva della Vista Corso
## Portale GrecoLatinoVivo · Sprint MVP (breve-marziale)
> Analisi applicata: psicologia cognitiva, neuroscienze del comportamento, design motivazionale.
> Tutti i riferimenti al contenuto (prezzi, dettagli abbonamento) sono rimossi — si linka a /index.html#prezzi.

---

## 1. Gerarchia dell'attenzione nella vista corso

### Sequenza visiva ottimale

L'occhio si muove in tre passi entro i primi 2 secondi dall'apertura della vista corso:

**Primo sguardo — orientamento (0–300ms)**
Il titolo del corso, in Inter 700 28px, è l'ancora visiva principale. Deve essere il testo più grande nella zona visibile senza scroll. L'utente deve capire immediatamente "dove si trova" — il titolo risolve questo in modo univoco. Nessun elemento sopra il titolo (eccetto il back button e i badge) deve avere peso visivo comparabile.

**Secondo sguardo — stato (300–800ms)**
La barra progresso con la label "N/M lezioni · X%" cattura il secondo sguardo perché combina due stimoli potenti: un elemento grafico (la barra dorata) e un numero concreto (la percentuale). L'occhio va lì perché il cervello vuole rispondere alla domanda implicita "quanto manca?". Il colore `var(--gold)` assicura che la barra spicchi sul background `var(--surface)`.

**Terzo sguardo — azione (800ms–2s)**
La riga della lezione corrente (`.lesson-row--current`, con bordo sinistro oro e play icon) è il punto di atterraggio finale. Deve essere visibile senza scroll almeno su desktop. Il bordo sinistro oro crea un segnale di "dove si parte" senza bisogno di testo esplicativo.

### Implicazioni di layout

- Il titolo NON deve competere con la nav — la nav resta in background visivo (`--bg-nav` con opacità 0.92)
- La barra progresso va posizionata immediatamente sotto la descrizione, non in fondo all'header
- La riga `.lesson-row--current` deve essere la prima riga visibile della lista, o al massimo la seconda

---

## 2. Progress effect — effetto Zeigarnik e goal gradient

### Effetto Zeigarnik

Il cervello ricorda meglio i compiti **interrotti** rispetto a quelli completati. Una barra al 50% crea una tensione cognitiva attiva: il compito è iniziato, non finito. Questa tensione si risolve solo completando le lezioni. La barra al 0% non funziona allo stesso modo — non c'è nulla da "finire". La barra al 100% è soddisfacente ma non motiva all'apertura.

**Applicazione pratica**: l'animazione del fill (da 0 al valore reale in 600ms) all'apertura della vista corso riproduce artificialmente il senso di un compito in corso. Non mostrare mai la barra già alla percentuale corretta senza animazione — l'animazione è parte del trigger motivazionale.

### Goal gradient effect

La motivazione aumenta man mano che ci si avvicina al completamento. Questo significa:

- Quando l'utente ha completato 3/4 lezioni, il design deve rendere visivamente evidente la prossimità del completamento (barra quasi piena, lezione 4 ben visibile)
- Il numero di lezioni rimanenti (non quelle completate) deve emergere facilmente dal calcolo visivo: "M - N = quanto manca"

**Label ottimale**: `2/4 lezioni · 50%` funziona bene perché mostra sia il progresso assoluto (2) sia il totale (4). L'utente può fare la sottrazione mentale istantaneamente.

### Streak come sistema di commitment

Il badge streak ("3 giorni") non è un semplice dato informativo. Attiva il **commitment effect**: chi ha una serie in corso non vuole interromperla. Anche uno streak di 1 giorno funziona perché pone la domanda "riuscirei a tornare domani?". Uno streak di 0 giorni deve comunque essere visibile (non nascosto) perché mostra che la serie può iniziare oggi.

**Posizionamento streak**: va affiancato alla barra progresso nella stessa riga, non in una sezione separata. La prossimità fisica tra progresso del corso e progresso quotidiano crea un'associazione cognitiva: "sto avanzando nel corso E nel mio streak".

---

## 3. Lock psychology — presentare i contenuti bloccati senza frustrare

### Il paradosso del lock

Mostrare lezioni bloccate può avere effetto positivo o negativo a seconda di come viene gestita. Il rischio principale è la **reactance psicologica**: se la percezione è "mi stanno togliendo qualcosa", la risposta emotiva è irritazione e abbandono. L'obiettivo è la **curiosità aperta**: le lezioni bloccate devono sembrare accessibili, non negate.

### Principi di implementazione

**1. Il titolo è sempre visibile.** Non oscurare il titolo della lezione bloccata con asterischi o testi generici. "Lezione 4 — Letture scelte" deve essere leggibile anche se bloccata. La curiosità nasce dal titolo che si vede ma non si può ancora raggiungere.

**2. La durata è visibile.** "55 min" accanto alla lezione bloccata comunica valore concreto: "vale 55 minuti di contenuto". Nasconderla riduce la percezione del valore.

**3. L'icona lucchetto è piccola e non dominante.** Il lucchetto SVG deve avere dimensioni identiche alle altre icone di stato (16×16px) e colore `var(--text-muted)`. Non deve essere rosso o grande — il lock non è una punizione, è uno stato temporaneo.

**4. Il banner bloccato appare solo al click, non a vista.** Non sovrapporre un overlay permanente sulle righe bloccate. Mostrare il banner solo quando l'utente clicca attivamente su una lezione bloccata. Questo riduce la "densità di frustrazione" nella lista.

**5. Il messaggio evita il tono imperativo.** Non "Abbonati per sbloccare" (imperativo transazionale). Sì "Questa lezione è inclusa nei piani" (informativo, positivo) + CTA neutra "Scopri i piani".

### Messaggio esatto da mostrare (inline banner)

```
Questa lezione è inclusa nei piani di abbonamento.
[Scopri i piani →]
```

Il link "Scopri i piani" porta a `/index.html#prezzi`. Il testo non menziona prezzi, non crea urgenza artificiale, non usa linguaggio promozionale.

---

## 4. Auto-selezione della lezione successiva (nextLesson)

### Perché è necessaria

Quando un utente apre la vista corso, ha già un'intenzione implicita: continuare da dove ha lasciato. Se la vista si apre e nessuna lezione è evidenziata, si crea un micro-momento di indecisione ("da dove inizio?"). Questo micro-momento è sufficiente a interrompere il flusso e, in alcuni casi, a causare l'abbandono della sessione.

### Effetto dell'auto-selezione

Evidenziare visivamente la `nextLesson` (prima lezione non completata) compie due operazioni cognitive in simultanea:

1. **Riduce il costo decisionale** — l'utente non deve scegliere, può semplicemente procedere
2. **Crea continuità narrativa** — la vista corso non è un elenco neutro ma un percorso con una direzione precisa

L'auto-selezione non significa auto-riproduzione: il player non parte automaticamente. La `nextLesson` riceve solo l'evidenziazione visiva (bordo oro + background lieve) e lo scroll automatico per portarla nel viewport. L'avvio del player rimane un'azione consapevole dell'utente.

### Logica di selezione

```
nextLesson = prima lezione in lessons[] dove:
  - lesson.completed === false
  - E (lesson.isFree === true OPPURE course.hasAccess === true)

Se tutte le lezioni sono completate:
  nextLesson = ultima lezione (per rivedere)

Se nessuna lezione è accessibile (no access, no free):
  nextLesson = null (nessuna riga evidenziata)
```

---

## 5. Microcopy — testi esatti

### Back button
```
← Torna ai corsi
```
Semplice, diretto. "Torna ai corsi" (non "Torna indietro", non "Chiudi") perché specifica dove si va, non solo che si torna. La freccia SVG sostituisce il simbolo Unicode ←.

### Label barra progresso
```
2/4 lezioni · 50%
```
Struttura: `[completate]/[totali] lezioni · [percentuale]%`

Il punto mediano (·) come separatore è visivamente leggero e non rompe il ritmo. La parola "lezioni" specifica l'unità e distingue la barra da altri indicatori di progresso generici.

### Badge streak
```
3 giorni
```
Solo il numero e la parola "giorni". Nessuna parola aggiuntiva ("consecutivi", "di fila", "streak"). La semplicità massimizza la leggibilità nel badge compatto. L'icona fiamma SVG porta il significato visivo senza bisogno di parole.

Caso zero: `0 giorni` — non nascondere, non scrivere "Inizia oggi", solo il dato neutro.

### Stato locked — banner inline
```
Questa lezione è inclusa nei piani di abbonamento.
```
CTA: `Scopri i piani →`

La freccia → nella CTA è SVG inline (12px), non Unicode. Link a `/index.html#prezzi`.

### CTA locked alternativa (toast, se usato invece del banner)
```
Lezione disponibile con l'abbonamento — Scopri i piani
```
Testo compatto per il toast. Stesso link `/index.html#prezzi`.

### Navigazione player — pulsanti prec/succ
```
← Precedente
Successiva →
```
Etichette complete, non solo simboli. I pulsanti disabilitati (prima lezione: "Precedente" disabilitato; ultima lezione: "Successiva" disabilitato) hanno `opacity: 0.35` e `cursor: default`.

### Heading lista lezioni
```
LEZIONI
```
Uppercase, Inter 600, 11px, `var(--text-muted)`. Breve, categoriale.

### Titolo sopra player
```
[Titolo lezione] — [Titolo corso]
```
Esempio: `Lezione 2 — Gli Epigrammi di Marziale`
Formato esatto da API: `lesson.title` (non serve ripetere il numero se già nel titolo).

---

## 6. Trigger emotivi — rendere la vista corso piacevole ogni giorno

### Sense of progress come principale motivatore intrinseco

La letteratura sulla motivazione (Deci & Ryan, 1985; Amabile & Kramer, 2011) identifica il **senso di progresso** come il driver motivazionale più efficace nel lavoro e nell'apprendimento. Non il premio, non il completamento finale — il movimento percepito.

Nella vista corso, ogni elemento visivo deve comunicare movimento:
- La barra al 50% dice "sono a metà, non all'inizio"
- La checkmark verde sulle lezioni completate dice "questo l'ho fatto io"
- Lo streak badge dice "sono tornato anche ieri"

### Consistenza visiva come comfort

L'utente che torna ogni giorno trova la stessa interfaccia, con lo stesso layout, gli stessi colori. Il design familiare riduce il costo cognitivo dell'apertura della piattaforma. Questo è particolarmente rilevante per una piattaforma di lingue classiche, dove il pubblico è adulto, motivato, ma con poco tempo disponibile.

### Granularità del progresso

Mostrare il progresso a livello di lezione (non solo di corso) è fondamentale. Se ci fosse solo "hai completato 2 corsi su 10", il feedback sarebbe troppo lento. Con "2/4 lezioni" il ciclo di feedback è settimanale o addirittura quotidiano — scalato al tempo reale che l'utente investe.

### Micro-reward visivo al completamento

Quando una lezione raggiunge il 90% (marcata come `completed`), la barra progresso si aggiorna con animazione (0.6s ease). Questo aggiornamento visibile in tempo reale è una micro-ricompensa immediata. Il cervello associa il gesto (guardare il video fino in fondo) alla gratificazione (la barra avanza).

### Abitudine da costruire — il loop quotidiano

Il percorso abitudinale ottimale per la vista corso è:
```
Apri dashboard → Vedi "3 giorni" streak → Apri corso → Guarda lezione → Barra avanza → Streak +1 → Chiudi
```
Ogni apertura deve confermare e rinforzare il loop. Per questo:
- Il back button e il titolo devono essere visibili immediatamente (senza scroll) — uscire deve essere facile quanto entrare
- La nextLesson è già evidenziata — non serve decidere
- Il player non parte automaticamente — l'utente mantiene il controllo (autonomy, nel senso di Self-Determination Theory)

### Cosa NON fare

- Non mostrare percentuali di completamento globale del catalogo (troppo lontane, demotivanti)
- Non usare il rosso (`var(--primary)`) nella vista corso salvo per badge errori critici — il rosso attiva vigilanza, non comfort
- Non aggiungere countdown ("scade tra X giorni") — l'urgenza esterna distrugge la motivazione intrinseca
- Non nascondere le lezioni bloccate dalla lista — la loro presenza visibile aumenta il perceived value dell'abbonamento senza creare frustrazione se gestito correttamente (vedi sezione 3)
