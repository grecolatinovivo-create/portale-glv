# Studio — Sistema di caricamento video Vimeo su latin-cert

> Ricostruzione di come latin-cert.org gestiva il caricamento e la riproduzione dei video Vimeo,
> a partire dal dump `database_latin-cert.sql` e dal codice di migrazione/portale di GrecoLatinoVivo.
>
> Data analisi: 2026-05-30 · Fonte primaria: `database_latin-cert.sql` (664 MB)

---

## 1. Cos'è realmente il dump

`database_latin-cert.sql` è un **dump phpMyAdmin di MySQL 5.7**, di un **CMS custom** (non WordPress,
non LearnDash). L'intestazione reale del file:

```
-- phpMyAdmin SQL Dump · version 5.2.3
-- Host: 31.11.39.51
-- Creato il: Mag 21, 2026 alle 06:17
-- Versione del server: 5.7.44-48-log
-- Database: `Sql1555180_1`
```

È quindi il backend applicativo di latin-cert/grecolatinovivo, con tabelle proprie e chiavi
prefissate (`IDL`, `IDV`, `IDCR`, `IDT`, `FK_IDCR`, `FK_IDL`…). Non esiste un database "tan-cert"
separato: la fonte di verità dei video è interamente questo dump.

---

## 2. Il modello dati dei video su latin-cert

I video **non** stavano dentro al testo della lezione. C'erano **due tabelle distinte e collegate**:

### 2.1 Tabella `lezione`
Colonne (ordine confermato dal parser di migrazione):

```
IDL, title, description, addtext, datetime, calendar, FK_IDCR, ...
 0     1        2          3         4         5         6
```

- `IDL` — id lezione (usato anche per l'ordinamento).
- `FK_IDCR` — chiave esterna verso il **corso** (`corso.IDCR`).

### 2.2 Tabella `video`
Colonne (ordine confermato dal parser):

```
IDV, FK_IDL, link, datetime, is_uploaded, is_active, foto, durata, log
 0     1       2      3           4            5        6      7      8
```

- `FK_IDL` — chiave esterna verso la **lezione** (`lezione.IDL`).
- `link` — **l'URL Vimeo**, nella forma `https://vimeo.com/<id>` (es. `https://vimeo.com/762900694`),
  a volte con hash privato `https://vimeo.com/<id>/<hash>`.
- `durata` — durata in **secondi**.
- `is_uploaded` / `is_active` — stato del caricamento / pubblicazione.
- `foto` — thumbnail.
- `log` — traccia dell'upload; nel dump ricorre 688 volte il marcatore `_vimeo_create`,
  segno che il caricamento su Vimeo era registrato/loggato per ogni video.

### 2.3 La catena di relazioni

```
corso (IDCR) 1──∞ lezione (IDL, FK_IDCR) 1──1 video (FK_IDL, link Vimeo, durata)
```

Nel dump ci sono **~2.412 URL Vimeo distinti** (2.463 occorrenze totali di `vimeo.com`).

Quindi su latin-cert "caricare un video" significava: l'admin caricava il file su Vimeo, e nel CMS
creava una riga in `video` con il `link` Vimeo, la `durata` e i flag, agganciata alla lezione via
`FK_IDL`. Vimeo restava l'host esterno; il DB conservava solo il riferimento.

---

## 3. Come i video vengono estratti dal dump (migrazione)

Due script leggono il dump. Il più completo è `tools/migrate-complete.js`.

### 3.1 Lettura in streaming (il file è enorme)

Il dump è da 664 MB: viene letto **riga per riga** in `latin1`, accumulando gli `INSERT INTO`
delle sole tabelle `lezione` e `video`:

```js
const stream = fs.createReadStream(SQL_FILE, { encoding: 'latin1' })
const reader = rl.createInterface({ input: stream, crlfDelay: Infinity })
// raccoglie i blocchi `INSERT INTO `lezione`` e `INSERT INTO `video`` fino al ';'
```

> Nota operativa: per ispezionare il dump NON usare `grep` ripetuti sull'intero file (satura il
> mount e va in timeout). Usare lo script di migrazione, oppure `dd`/offset su porzioni.

### 3.2 Parsing delle righe ed estrazione del link

Per ogni riga di `video` prende `FK_IDL` (col 1), `link` (col 2), `durata` (col 7), e tiene solo
i link che contengono `vimeo`:

```js
const fkIdl  = vals[1]
const link   = vals[2]
const durata = vals[7]
if (link && typeof link === 'string' && link.includes('vimeo')) {
  if (!videos.has(fkIdl)) videos.set(fkIdl, { link, durata })
}
```

### 3.3 Ricostruzione corso → lezioni → video

```js
// lezione.IDL → video
const vid  = videos.get(idl)
const idcr = lezData.FK_IDCR              // a quale corso appartiene
byIdcr.get(idcr).push({ idl, ...lezData, ...vid })
// ordina per IDL e assegna sortOrder progressivo
rows.sort((a,b) => a.idl - b.idl).forEach((r,i) => r.sortOrder = i+1)
```

Un `MAPPING { slug-portale → IDCR-latin-cert }` collega ogni corso del nuovo portale al suo IDCR
originale (es. `'breve-colloquia': 377`, `'eb-a11': 186`). La durata viene convertita in minuti:

```js
const durMin = Math.max(1, Math.round((r.durata || 60) / 60))
```

### 3.4 Lo script alternativo "hardcoded"

`tools/migrate-latin-cert.js` fa la stessa cosa ma con gli URL già estratti a mano, corso per corso
(es. `lat-a11` → 19 lezioni con `vimeoUrl: https://vimeo.com/776546078`, ecc.). Utile come riferimento
verificato dei mapping ma meno scalabile del parser streaming.

---

## 4. Come i video sono modellati e serviti nel nuovo portale

### 4.1 Schema (`prisma/schema.prisma`, PostgreSQL/Neon)

Il modello `Lesson` conserva **solo l'URL** (niente colonna `vimeoId`):

```prisma
model Lesson {
  id          String  @id @default(cuid())
  courseId    String
  title       String
  durationMin Int
  isFree      Boolean @default(false)   // regola di progetto: SEMPRE false
  sortOrder   Int
  vimeoUrl    String?                    // es. "https://vimeo.com/762900694"
  latinCertId Int?    @unique            // IDL originale, per mappare le risorse
  ...
}
```

L'`IDV`/`durata`/flag della vecchia tabella `video` non vengono migrati: restano solo `vimeoUrl`
(da `video.link`) e `durationMin` (da `video.durata / 60`). Il legame con la vecchia lezione è tenuto
da `latinCertId = IDL`.

### 4.2 API — il video è dietro paywall (`pages/api/courses/[id].js`)

L'URL non viene mai inviato a chi non ha accesso. Ordine dei controlli:

```js
// 0. Admin bypass
if (req.user.email === ADMIN_EMAIL) hasAccess = true;
// 1. Acquisto singolo del corso (priorità massima)
// 2. Abbonamento status === 'active' + guard scadenza periodo/corso + tier
...
const lessons = course.lessons.map((lesson) => {
  const { textFragment, contentSummary, keyVocabulary, learningObjectives, ...pub } = lesson;
  if (hasAccess) return { ...pub, hasAiContext };
  return { ...pub, vimeoUrl: null, hasAiContext };   // senza accesso: vimeoUrl azzerato
});
```

Coerente con le regole di progetto: solo `status === 'active'` (mai `trialing`), nessuna lezione
gratuita, unico bypass quello admin.

### 4.3 Frontend — Player ufficiale Vimeo SDK (`public/js/app.js`)

A differenza di un semplice `<iframe>`, il portale usa l'**SDK ufficiale `@vimeo/player`**:

```html
<script async src="https://player.vimeo.com/api/player.js"></script>
```

```js
// estrae l'id dall'URL (gestisce sia vimeo.com/ID sia player.vimeo.com/video/ID)
const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);

// renderPlayer(): crea <iframe id="vimeo-player"> e poi new Vimeo.Player(iframe)
// eventi 'timeupdate' / 'ended' → salvano i progressi in LessonProgress
// _destroyPlayer(): rimuove l'iframe e chiama player.destroy()
```

Dettagli aggiuntivi:
- **Thumbnail**: `https://vimeo.com/api/v2/video/${videoId}.json` (con cache `_vimeoThumbCache`).
- **Placeholder** per lezioni senza URL: `VIMEO_PLACEHOLDER = https://player.vimeo.com/video/76979871`.
- Il tracking dei progressi è **obbligatorio**: il player viene inizializzato via SDK proprio per
  poter ascoltare `timeupdate`/`ended` e aggiornare `watchedSeconds`/`completed`.

---

## 5. Pipeline completa (da latin-cert a oggi)

```
[latin-cert · CMS custom MySQL  `Sql1555180_1`]
   corso(IDCR) → lezione(IDL,FK_IDCR) → video(FK_IDL, link Vimeo, durata, is_uploaded, log:_vimeo_create)
                                                       │
   database_latin-cert.sql  (dump phpMyAdmin, 664 MB)  │
                                                       ▼
[migrate-complete.js]  stream latin1 → tabelle lezione+video → match FK_IDL → raggruppa per FK_IDCR
                                                       │
                                                       ▼
[PostgreSQL/Prisma]  Lesson.vimeoUrl (= video.link) · durationMin (= durata/60) · latinCertId (= IDL)
                                                       │
                  API courses/[id].js ────────────────┴── paywall (admin | purchase | subscription active+tier)
                                                       ▼
[public/js/app.js]  @vimeo/player SDK → iframe #vimeo-player + eventi timeupdate/ended → LessonProgress
```

---

## 6. Punti di attenzione

1. **Nessun `vimeoId` nello schema**: si lavora sempre con `vimeoUrl` completo. L'id numerico viene
   ricavato a runtime con la regex `/vimeo\.com\/(?:video\/)?(\d+)/`. Se in futuro si volessero URL
   `player.vimeo.com/video/ID`, la regex già li gestisce.

2. **URL con hash privato**: alcuni link sono del tipo `https://vimeo.com/823126194/e2bb53c630`.
   La regex di estrazione id prende solo la prima cifra (`823126194`) — corretto per l'embed SDK, ma
   l'hash di privacy va mantenuto nell'`vimeoUrl` salvato se il video Vimeo è "unlisted con hash".

3. **`durata` mancante o a 1 minuto**: nello script hardcoded molte lezioni hanno `durationMin: 1`
   (durata non disponibile all'epoca dell'estrazione). Dove serve precisione, ricavare la durata reale
   dall'API Vimeo o dal campo `video.durata` del dump.

4. **Migrazione `video` parziale**: oggi nel portale si conserva solo `link`+`durata`. Se in futuro
   servisse stato/anteprima (`is_active`, `foto`), quei campi sono ancora nel dump e recuperabili via
   `FK_IDL`/`latinCertId`.

5. **`isFree` sempre `false`** e accesso solo con `status === 'active'`: nessuna preview gratuita,
   nessun trial — coerente con le regole di progetto.
