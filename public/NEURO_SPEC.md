# NEURO_SPEC — Psicologia della persuasione
*Portale GLV · Centro Nazionale di Studi Classici*

## Posizionamento emotivo

**Emozione primaria:** Appartenenza a una comunità di studiosi seri.
**Emozione secondaria:** Orgoglio culturale e identità intellettuale.
**Emozione da evitare:** Fretta, FOMO, scarcity artificiale. Il target non si fida dei countdown falsi.

Il GLV non vende "corsi online". Vende **accesso a un centro di eccellenza** con docenti reali, riconoscimenti MIM, e 10 anni di storia. Questo è l'argomento più forte disponibile.

---

## Bias cognitivi attivati

### 1. Effetto ancoraggio — Hero
Il numero **12.447 studenti** deve essere il primo dato visivo dopo il titolo. Questo ancora la percezione di qualità prima che l'utente legga il prezzo. Ordine esatto nella trust bar:
1. 12.447 studenti — (primo, valore assoluto alto)
2. 2015 — (anno fondazione, rafforza autorevolezza)
3. 56 corsi — (catalogo ricco)
4. Accreditato MIM — (social proof istituzionale)

### 2. Prova sociale (Cialdini) — Badge Linguae
Il badge sulla pricing card featured NON deve essere "Più scelto" (claim non verificabile).
Deve essere: **"Il preferito dai docenti MIM"** — specifico, credibile, rilevante per il target.

### 3. Effetto Zeigarnik — Dashboard e Corso
Le progress bar sui corsi in corso devono essere visibili e incomplete. Il cervello è disturbato dai task incompleti e tende a completarli. Non nascondere la percentuale, anzi enfatizzarla: "60% completato — continua".

### 4. Autorità (Cialdini) — Sezione Docenti
I docenti reali (Giampiero Marchi, Ilaria Cariddi, Alberto Bibbiani, Emanuele Viotti, ecc.) sono l'argomento di autorità più forte. Nome completo + disciplina specifica + università/istituzione se disponibile.

### 5. Reciprocità — Catalogo visibile
Il catalogo completo (56 corsi con descrizioni) deve essere consultabile SENZA login. Dare valore prima di chiedere la registrazione. Chi vede i contenuti si sente in debito (reciprocità) e più propenso ad abbonarsi.

### 6. Effetto del primato — Pricing
La card Cultura (€5,90) va mostrata prima. Il prezzo basso fa da ancora: anche se l'utente sceglie Linguae (€12,90), lo percepisce come ragionevole rispetto al €5,90 iniziale.

---

## Microcopy strategico

| Contesto | Testo attuale | Testo proposto | Motivo |
|---------|---------------|---------------|--------|
| CTA hero | "Scegli il tuo piano" | "Inizia il tuo percorso" | Linguaggio del viaggio, non del commercio |
| CTA pricing | "Abbonati ora" | "Abbonati ora" | OK — diretto e onesto |
| Badge Linguae | "Più scelto" | "Il preferito dai docenti MIM" | Prova sociale specifica |
| Trust bar | "150+ corsi" | "56 corsi" | Dato reale > numero gonfiato |
| Sub-headline hero | variabile | "Studia le lingue dell'antichità con i migliori docenti italiani" | Autorità + specificità |
| Final CTA | "Inizia il tuo percorso" | OK — resta | Coerente col tono |

**Parole da NON usare:**
- gratis, gratuito, free trial (non esiste)
- illimitato (da verificare con i termini)
- leader, numero 1 (non verificabile)
- esclusivo (inflazionato)

**Parole da usare:**
- accreditato, riconosciuto, certificato
- docenti, studiosi, ricercatori
- percorso, apprendimento, formazione
- tradizione, eccellenza, rigore

---

## Gerarchia dell'attenzione per pagina

### index.html (F-pattern desktop, thumb zone mobile)
1. Logo + nome centro (top-left — identità)
2. Headline hero (centro — proposta di valore)
3. 12.447 studenti (sotto headline — prova sociale)
4. CTA primaria "Inizia il tuo percorso" (above fold)
5. Sezione lingue (scroll 1 — cosa offriamo)
6. Pricing (scroll 2 — quanto costa)
7. FAQ (scroll 3 — obiezioni)

### dashboard.html
1. Progress corsi in corso (Zeigarnik attivo)
2. Corsi consigliati (upsell contenuti)
3. Stato abbonamento (gestione account)

### corso.html
1. Titolo + descrizione corso (above fold)
2. Sidebar acquisto/abbonamento (visibile senza scroll su desktop)
3. Lista lezioni (contenuto, riduce friction)

---

## Friction reduction

- **Zero form nella home** — il login è in modal, non in pagina separata
- **Prezzi visibili senza login** — nessun "registrati per vedere i prezzi"
- **Catalogo accessibile** — 56 corsi consultabili senza account
- **Cancella quando vuoi** — esplicitato sotto il pricing (riduce rischio percepito)
- **Toggle mensile/annuale** — l'utente controlla il prezzo, non subisce il piano annuale

---

## Note specifiche per il DEV

- Il progress "60% completato" va mostrato con la percentuale numerica, non solo visivamente
- Il badge "Il preferito dai docenti MIM" va sul div.pricing-badge della card Linguae
- La trust bar segue l'ordine: studenti → anno → corsi → accreditamento
- Nessun countdown timer, nessun "Solo 3 posti rimasti", nessuna urgency fake
