# Studio — Gestione corsi/lezioni/video dall'admin

> Obiettivo: ricreare nel pannello admin il flusso "apro corso → creo lezioni → assegno nome,
> tier, video (caricato direttamente sul mio Vimeo), materiali → il corso resta nascosto finché
> non lo pubblico".
>
> Questo documento fotografa **cosa esiste già** e **cosa manca**, e propone il disegno tecnico.
> Data: 2026-05-30.

---

## 1. Il flusso che vuoi (riformulato)

```
Admin apre un corso (o ne crea uno nuovo, di default NASCOSTO)
   └─ crea Lezione 1
        • nome, descrizione, ordine
        • tier di appartenenza
        • VIDEO → il sistema lo carica direttamente sul TUO Vimeo e salva l'URL
        • MATERIALI → PDF/slide allegati
   └─ crea Lezione 2 …
Quando tutto è pronto → "Rendi visibile" → il corso appare nel catalogo
```

---

## 2. Come sono i video OGGI (stato reale del codice)

### 2.1 Dato in DB
Il video di una lezione è **un URL Vimeo** salvato in `Lesson.vimeoUrl` (PostgreSQL/Prisma).
Non c'è un id separato: l'id numerico si ricava a runtime con regex. Non esiste alcun campo di
"tier" sulla lezione (il tier è solo sul **corso**, `Course.tierRequired`).

```prisma
model Lesson {
  vimeoUrl    String?   // es. "https://vimeo.com/762900694"
  durationMin Int
  isFree      Boolean @default(false)  // regola: SEMPRE false
  sortOrder   Int
  latinCertId Int?    @unique
  // ❌ nessun tierRequired qui
}
```

### 2.2 Come il video finisce sul portale (lettura)
1. **API** `pages/api/courses/[id].js` carica il corso con le lezioni e applica il **paywall**:
   - admin bypass → `purchase` → `subscription.status === 'active'` (+ tier + scadenze).
   - Se l'utente **non** ha accesso, `vimeoUrl` viene **azzerato** nella response (`vimeoUrl: null`).
2. **Frontend** `public/js/app.js` riproduce con l'**SDK ufficiale `@vimeo/player`** (già in
   `package.json`): crea `<iframe id="vimeo-player">`, istanzia `new Vimeo.Player(iframe)`, ascolta
   `timeupdate`/`ended` e salva i progressi in `LessonProgress`. Thumbnail via
   `vimeo.com/api/v2/video/{id}.json`.

### 2.3 Come il video entra OGGI in DB (scrittura)
**Non c'è alcun upload.** I video sono entrati solo via **migrazione una tantum** dal vecchio dump
(`tools/migrate-complete.js`), che leggeva la tabella `video.link`. Dopodiché l'unico modo per
cambiare un `vimeoUrl` è… a mano nel DB. L'admin web **non** può aggiungere/cambiare video.

---

## 3. Cosa fa OGGI il pannello admin (`public/admin.html` + `pages/api/admin/*`)

Tab presenti: Panoramica · **Corsi** · Utenti · Attestati · Editore · AI Magistro · Log · Impostazioni.

La tab **Corsi** è l'unica rilevante e fa **solo questo**:
- `GET /api/admin/courses` → lista corsi con statistiche.
- Click su un corso → modale (`openCourseModal`) che permette di modificare:
  - titolo, descrizione, lingua del corso
  - **`isAvailable` = "Visibile nel catalogo"** ✅ (esiste già! badge "Nascosto" quando false)
  - `isNew`, `tierRequired` (del **corso**), scadenze
  - **solo i TITOLI** delle lezioni esistenti (rename)
- `POST /api/admin/courses` → aggiorna quei campi.

### Quello che l'admin NON può fare oggi
| Funzione richiesta | Stato |
|---|---|
| Creare un **nuovo corso** | ❌ manca (solo update) |
| **Creare** una lezione | ❌ manca |
| **Eliminare/riordinare** lezioni | ❌ manca |
| Editare campi lezione (durata, ordine, descrizione) | ❌ solo titolo |
| **Tier per singola lezione** | ❌ non esiste in schema |
| **Caricare un video su Vimeo** | ❌ nessuna pipeline |
| **Caricare materiali** (PDF) | ❌ nessuna pipeline upload |
| Rendere corso visibile/nascosto | ✅ `isAvailable` già c'è |

---

## 3-bis. Come funzionano i MATERIALI oggi (verificato nel codice)

> Questa sezione è stata corretta dopo ispezione reale: la mia prima ipotesi ("tutti su Vercel
> Blob") era **sbagliata**.

### 3-bis.1 Dato in DB
`model LessonResource` (una riga per file allegato a una lezione):
```prisma
LessonResource {
  lessonId  String
  title     String   // titolo leggibile (nome file ripulito)
  filename  String   // nome file originale
  blobUrl   String?  // ⚠️ il nome dice "blob" ma contiene un URL QUALSIASI
  fileType  String   // 'pdf' | 'audio' | 'image' | 'other'
  sortOrder Int
}
```
Esiste anche `CourseResource` (materiali a livello di corso), ma il portale utente serve i materiali
**per lezione** (`LessonResource`).

### 3-bis.2 Dove stanno fisicamente i file OGGI
Il campo `blobUrl` è un **URL pubblico**, ma le fonti sono DUE e in pratica **non è quasi mai Vercel Blob**:
- **~96% → Aruba (hosting di latin-cert)**: `https://www.latin-cert.org/classroomresources/{IDL}/{file}`
  — l'IDL è la cartella della vecchia lezione (es. `.../classroomresources/2348/GC1_L01....pdf`).
- **Pochi file → Vercel Blob**: `https://z4vkwstir9irjbdf.public.blob.vercel-storage.com/...`

Quindi i materiali **non sono stati ricaricati**: il portale punta ancora ai PDF ospitati sul vecchio
sito Aruba. (Da `map-lesson-resources.js`: "7 file via Vercel Blob, 161 via Aruba".)

### 3-bis.3 Come i materiali sono entrati in DB (scrittura)
Solo via **script di migrazione una tantum** che hanno incrociato le cartelle `classroomresources/{IDL}`
con `Lesson.latinCertId` (= IDL) e scritto le righe `LessonResource` con `blobUrl` = URL Aruba.
Niente upload, niente UI: come per i video.

### 3-bis.4 Come arrivano all'utente (lettura)
1. Frontend `dashboard.html` → `loadLessonResources(lessonId)` chiama
   `GET /api/lesson-resources?lessonId=...`.
2. `pages/api/lesson-resources.js` (auth richiesta) ritorna `{ id, title, filename, fileType, url }`
   dove **`url` = `blobUrl` diretto** (commento: "restituiamo direttamente per performance").
3. Il browser mostra un link `<a href="{url}" target="_blank">` con icona + estensione.

> C'è anche un proxy autenticato `GET /api/download-resource?id=...` che fa `302` verso `blobUrl`,
> ma il frontend attuale usa l'URL diretto, non il proxy. Per i materiali **dietro paywall** sarebbe
> più corretto passare sempre dal proxy (vedi §7).

---

## 4. Gli ingredienti già pronti

- ✅ **Visibilità corso**: `Course.isAvailable` (false = nascosto). Già rispettata da catalogo e badge.
- ✅ **Player Vimeo**: `@vimeo/player` installato e funzionante.
- ✅ **Paywall** su `vimeoUrl` già robusto (admin/purchase/subscription+tier).
- ✅ **Modello materiali**: `LessonResource` + API lettura (`/api/lesson-resources`) + proxy
  (`/api/download-resource`) già esistono. Manca solo l'**upload** e l'aggancio dall'admin.
- ✅ **Vercel Blob già installato e usato**: `@vercel/blob` è in `node_modules` e già usato per le
  immagini del vocabolario (`import { put } from '@vercel/blob'` in `vocabulary/session.js` e
  `generate-image.js`), con `BLOB_READ_WRITE_TOKEN`. → **la pipeline di upload PDF è già metà fatta.**
- ✅ **AdminLog** per tracciare ogni azione.
- ✅ Auth admin centralizzata (`withAuth` + `email === ADMIN_EMAIL`).

## 5. Gli ingredienti da aggiungere

1. **Token Vimeo lato server** — NON presente. Serve un token Vimeo con scope
   `upload,edit,video_files` in env (`VIMEO_ACCESS_TOKEN`). L'upload usa il protocollo **tus**
   (resumable) verso `api.vimeo.com/me/videos`.
2. **Upload materiali** — riusare `@vercel/blob` (già installato, `BLOB_READ_WRITE_TOKEN` già in uso
   per il vocabolario): nuova API `POST /api/admin/resources/upload` che fa `put()` e crea la
   `LessonResource`. **Niente nuova dipendenza.**
3. **(Solo se serve)** Campo `tierRequired` sulla Lesson — **NON richiesto**: hai scelto tier per
   **corso** (resta `Course.tierRequired`).

---

## 6. Disegno tecnico proposto

### 6.1 Modifiche schema (Prisma) — minime
Tier resta sul **corso** (scelta confermata), quindi sulla Lesson serve poco o nulla:
```prisma
model Lesson {
  // ...campi esistenti...
  description String?  @db.Text   // (NEW, opzionale: descrizione/note lezione)
  vimeoStatus String?             // (NEW, opzionale: 'processing' | 'ready' | 'error')
}
```
> `isFree` resta sempre `false` (regola di progetto). Visibilità sul **corso** = `isAvailable`.
> Materiali: nessuna modifica schema, `LessonResource` è già adatto.

### 6.2 Nuove API admin (tutte protette da `email === ADMIN_EMAIL`)
```
POST   /api/admin/courses/create          → crea corso (default isAvailable:false = NASCOSTO)
DELETE /api/admin/courses/[id]            → elimina corso (con cascata lezioni)
POST   /api/admin/courses/[id]/publish    → toggle isAvailable (Pubblica / Nascondi)

POST   /api/admin/lessons/create          → crea lezione { courseId, title, tier, sortOrder }
POST   /api/admin/lessons/[id]            → update campi lezione
DELETE /api/admin/lessons/[id]            → elimina lezione
POST   /api/admin/lessons/reorder         → riordina (array di {id, sortOrder})

POST   /api/admin/vimeo/create-upload     → crea il video su Vimeo, ritorna upload_link (tus)
POST   /api/admin/vimeo/finalize          → salva vimeoUrl + durata sulla lezione
GET    /api/admin/vimeo/status?id=...      → stato transcoding ('processing'/'ready')

POST   /api/admin/resources/upload        → carica PDF/materiale su Vercel Blob → crea LessonResource
DELETE /api/admin/resources/[id]          → elimina materiale (e file dal Blob)
```
> L'upload materiali riusa `@vercel/blob` (già installato) esattamente come fa oggi il vocabolario:
> `put(filename, fileBuffer, { access: 'public', token: BLOB_READ_WRITE_TOKEN })` → salva l'URL in
> `LessonResource.blobUrl`. I vecchi materiali restano dove sono (Aruba); i nuovi vanno su Blob.

### 6.3 Flusso upload video (resumable, file grandi)
```
[Browser admin] sceglie file video
      │ 1. POST /api/admin/vimeo/create-upload  { name, size }
      ▼
[Server] chiama api.vimeo.com/me/videos (upload.approach=tus, size)
      │    → ottiene { vimeoUri:'/videos/123', upload_link }
      │ 2. ritorna upload_link al browser
      ▼
[Browser] carica il file DIRETTAMENTE su Vimeo via tus (resumable, niente passaggio dal server)
      │ 3. al termine: POST /api/admin/vimeo/finalize { lessonId, vimeoUri }
      ▼
[Server] imposta privacy (es. unlisted/whitelist dominio), salva
         Lesson.vimeoUrl = https://vimeo.com/123, vimeoStatus='processing'
      │ 4. polling /api/admin/vimeo/status finché 'ready'
      ▼
[DB] lezione pronta. Sul portale il player la mostra solo a chi ha accesso (paywall invariato).
```
> Il file NON transita dal nostro server (upload diretto browser→Vimeo): più veloce, niente limiti
> di payload serverless di Vercel. Il server gestisce solo creazione, privacy e finalizzazione.

### 6.4 UI admin (estensione di `admin.html`, tab Corsi)
- Bottone **"+ Nuovo corso"** (crea nascosto).
- Nella modale corso: toggle **Pubblica/Nascondi** in evidenza + bottone **"+ Aggiungi lezione"**.
- Editor lezione: nome, descrizione, **tier**, ordine (drag), **dropzone video** (barra di
  avanzamento upload + stato Vimeo), **dropzone materiali**, lista materiali con elimina.

---

## 7. Sicurezza e regole da rispettare

- Tutte le nuove API: gate `req.user.email === ADMIN_EMAIL` + log su `AdminLog`.
- `isFree` resta **sempre false**; nessuna preview gratuita.
- Accesso ai video solo con `status === 'active'` / purchase / admin (paywall già esistente,
  da non toccare).
- Privacy Vimeo: impostare i video come **unlisted con dominio whitelisted** (solo il portale
  può fare embed), così l'URL Vimeo da solo non basta a vedere il video fuori dal sito.
- Verifica **end-to-end** dopo ogni fix: crea corso nascosto → aggiungi lezione → carica video →
  pubblica → login utente con/ senza abbonamento → controlla che veda/ non veda il player.

---

## 8. Decisioni prese (dalle tue risposte)

1. **Tier**: resta a livello di **corso** (`Course.tierRequired`). Niente tier per lezione. ✅
2. **Materiali**: **Vercel Blob** — già installato e già usato per il vocabolario, riuso la stessa
   pipeline `put()` + `BLOB_READ_WRITE_TOKEN`. I materiali vecchi restano su Aruba. ✅
3. **Vimeo**: hai **Vimeo Pro+**. Upload diretto dal pannello (browser→Vimeo via tus). Resta solo da
   generare l'**access token** con scope `upload,edit` (ti guido al momento dell'implementazione). ✅

### Nota di sicurezza sui materiali (da sistemare in implementazione)
Oggi `/api/lesson-resources` restituisce l'URL **diretto** del file. Per i contenuti a pagamento
conviene servire i materiali **solo a chi ha accesso al corso** e passare dal proxy
`/api/download-resource` (che può verificare l'abbonamento prima del 302), così come i video sono
già protetti. Da valutare insieme.

---

## 9. RISCHIO CRITICO: dipendenza da Aruba (latin-cert.org)

**Problema:** ~96% dei materiali (161 file su 168 collegati, ma il pattern vale per tutti i corsi)
sono serviti da `https://www.latin-cert.org/classroomresources/...`. Se quel dominio/hosting Aruba
viene dismesso, **tutti quei download si rompono** → utenti paganti senza materiali. Va eliminata la
dipendenza.

**Buona notizia — i file li abbiamo già in locale.** Nella cartella di progetto
`latin-cert-files/www.latin-cert.org/classroomresources/{IDL}/...`:
- **5.438 file** (PDF, audio, immagini) — **~5.8 GB**
- **3.570 cartelle IDL**

Quindi NON serve scaricare nulla da Aruba: basta **migrarli su uno storage nostro** e riscrivere i
`blobUrl`.

### 9.1 Piano di messa in sicurezza (migrazione una tantum)
```
[latin-cert-files/ (locale, 5.8 GB)]
   └─ script migrate-materials-to-blob.js
        per ogni LessonResource con blobUrl che punta a latin-cert.org:
          1. trova il file locale in classroomresources/{IDL}/{filename}
          2. put() su Vercel Blob (access controllato) → nuovo URL
          3. UPDATE LessonResource.blobUrl = nuovo URL
        log dei file mancanti/non trovati
[Vercel Blob (nostro)]  ← tutti i materiali, indipendenti da Aruba
```
Dopo la migrazione, `latin-cert.org` può sparire senza conseguenze.

> Attenzione costi/limiti: 5.8 GB su Vercel Blob è gestibile, ma valutare il piano Blob. In
> alternativa storage S3/R2 (Cloudflare R2 ha egress gratuito — buono per file scaricati spesso).
> Da decidere insieme (vedi §11).

### 9.2 Upload NATIVO dei nuovi materiali (richiesta esplicita)
Da ora ogni nuovo materiale caricato dall'admin va **direttamente sul nostro storage**, mai più
link esterni:
```
[Admin] dropzone PDF/audio/img nella lezione
   → POST /api/admin/resources/upload (multipart o presigned)
   → put() su Vercel Blob/R2  → URL nostro
   → crea LessonResource { lessonId, title, filename, fileType, blobUrl: <nostro URL> }
```
Stessa pipeline `@vercel/blob` già usata per le immagini del vocabolario.

---

## 10. Architettura finale "a prova di Aruba"

```
                         ┌─────────────────────────────┐
   VIDEO  ───────────────►  Vimeo (Pro+)  ← upload nativo dal pannello (tus)
                         └─────────────────────────────┘
                         ┌─────────────────────────────┐
   MATERIALI ────────────►  Vercel Blob / R2 (nostro)   ← upload nativo + migrazione 5.8 GB
                         └─────────────────────────────┘
                         ┌─────────────────────────────┐
   DATI (corsi/lezioni) ─►  PostgreSQL Neon (Prisma)    ← CRUD dal pannello admin
                         └─────────────────────────────┘
   Nessuna dipendenza residua da latin-cert.org / Aruba.
```

---

## 11. Da decidere prima di implementare

1. **Storage materiali**: Vercel Blob (semplice, già integrato) o Cloudflare R2 (egress gratis,
   meglio per 5.8 GB scaricati spesso)? Default consigliato: iniziamo con Vercel Blob.
2. **Quando migrare i 5.8 GB**: subito (script una tantum) o in parallelo allo sviluppo del pannello?
3. **Protezione materiali a pagamento**: servirli sempre via proxy autenticato (consigliato) o
   lasciare URL pubblici opachi come ora?
