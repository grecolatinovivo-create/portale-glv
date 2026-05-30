# Piano operativo — Gestione contenuti da admin (corsi, lezioni, video, materiali)

> Decisioni prese con l'utente:
> - **Tier** a livello di **corso** (`Course.tierRequired`), non per lezione.
> - **Video**: Vimeo Pro+, upload nativo dal pannello (tus resumable).
> - **Materiali**: **Vercel Blob** (già installato). Upload nativo + migrazione dei 5.8 GB da Aruba.
> - **Protezione materiali a pagamento**: sempre via **proxy autenticato** `/api/download-resource`.
> - **Visibilità corso**: `Course.isAvailable` (di default un nuovo corso nasce NASCOSTO).
>
> Regole di progetto rispettate: `isFree` sempre `false`; accesso solo con `status === 'active'` /
> acquisto / admin; nessun trial/preview.
>
> Data: 2026-05-30. Questo è un PIANO — nessun codice è stato ancora scritto.

---

## 0. Obiettivo (flusso utente-admin finale)

```
Admin → "Nuovo corso" (nasce NASCOSTO)
      → compila titolo, slug, descrizione, lingua, tier, prezzo
      → "+ Aggiungi lezione" (ripetibile)
            • nome, descrizione, ordine
            • VIDEO → upload diretto sul mio Vimeo (barra avanzamento, stato processing)
            • MATERIALI → upload PDF/audio/img sul nostro storage (Vercel Blob)
      → riordina/elimina lezioni
      → "Pubblica" → il corso compare nel catalogo
Nessuna dipendenza da latin-cert.org.
```

---

## FASE 0 — Messa in sicurezza materiali (URGENTE, indipendente dal pannello)

**Perché prima:** se Aruba cade, i 161+ link esterni muoiono. I file però sono già in locale
(`latin-cert-files/`, 5.438 file, 5.8 GB).

**Script:** `scripts/migrate-materials-to-blob.js` (una tantum, idempotente)
1. Legge da DB tutte le `LessonResource` con `blobUrl LIKE '%latin-cert.org%'`.
2. Per ciascuna, individua il file locale: `latin-cert-files/www.latin-cert.org/classroomresources/{IDL}/{filename}`
   (IDL ricavato dall'URL stesso).
3. `put(pathBlob, fileBuffer, { access: 'public', token: BLOB_READ_WRITE_TOKEN })`.
   - Path Blob ordinato: `materials/{lessonId}/{filename}`.
4. `UPDATE LessonResource SET blobUrl = <nuovo URL>`.
5. Log: migrati / già su Blob / file locale mancante.
6. **Sicurezza:** dry-run prima (`--dry`), poi esecuzione reale; non cancella nulla da Aruba.

**Esito:** tutti i materiali serviti dal nostro Blob. Aruba diventa irrilevante.

> Nota costi: 5.8 GB su Vercel Blob ok. Se l'egress diventasse caro, valuteremo R2 in seguito
> (la migrazione futura sarebbe banale: stessi path, cambia solo il base URL).

---

## FASE 1 — Schema (Prisma) — modifiche minime

```prisma
model Lesson {
  // campi esistenti invariati...
  description String?  @db.Text   // NEW (opzionale): note/descrizione lezione
  vimeoStatus String?             // NEW (opzionale): 'processing' | 'ready' | 'error'
}
```
- **Nessun** `tierRequired` su Lesson (tier resta sul corso).
- `LessonResource` invariato (già adatto).
- `Course` invariato (`isAvailable`, `tierRequired`, `slug`, `priceEur` già ci sono).
- Applicare con `npx prisma db push`.

---

## FASE 2 — API admin (tutte protette: `req.user.email === ADMIN_EMAIL` + `AdminLog`)

### Corsi
```
POST   /api/admin/courses/create     { slug, title, lang, level, tierRequired, priceEur }
                                      → crea con isAvailable:false (NASCOSTO)
POST   /api/admin/courses/[id]       update campi (riusa la POST esistente, estesa)
POST   /api/admin/courses/[id]/publish   { isAvailable:true|false }  (toggle pubblica/nascondi)
DELETE /api/admin/courses/[id]       elimina corso (+ cascata lezioni/risorse) — con conferma
```

### Lezioni
```
POST   /api/admin/lessons/create     { courseId, title, description?, durationMin?, sortOrder }
POST   /api/admin/lessons/[id]       update { title, description, durationMin, sortOrder, vimeoUrl }
DELETE /api/admin/lessons/[id]       elimina lezione (+ risorse collegate)
POST   /api/admin/lessons/reorder    { courseId, order:[{id, sortOrder}] }
```

### Video (Vimeo)
```
POST   /api/admin/vimeo/create-upload   { lessonId, name, size }
        → chiama api.vimeo.com/me/videos (upload.approach=tus)
        → ritorna { uploadLink, vimeoUri }   (token server-side, mai esposto al client)
POST   /api/admin/vimeo/finalize        { lessonId, vimeoUri }
        → set privacy (unlisted + domain whitelist), salva Lesson.vimeoUrl + vimeoStatus='processing'
GET    /api/admin/vimeo/status?lessonId  → { status: 'processing'|'ready'|'error', durationMin }
```
Flusso upload: il file va **direttamente browser → Vimeo** via tus (libreria `tus-js-client` lato
client). Il nostro server fa solo create/finalize/status — niente file dal server (no limiti payload
Vercel).

### Materiali (Vercel Blob)
```
POST   /api/admin/resources/upload   (multipart) { lessonId, file }
        → put('materials/{lessonId}/{filename}', buffer, {access:'public', token})
        → crea LessonResource { lessonId, title, filename, fileType, blobUrl, sortOrder }
DELETE /api/admin/resources/[id]     → del() dal Blob + elimina record
```

---

## FASE 3 — Protezione materiali a pagamento (proxy autenticato)

1. **Frontend** smette di usare `r.url` diretto; usa sempre
   `GET /api/download-resource?id={resourceId}`.
2. **`/api/download-resource`** esteso: prima del `302`, verifica che l'utente abbia accesso al
   **corso della lezione** (stessa logica di `courses/[id].js`: admin / purchase / subscription
   active+tier). Se non ha accesso → `403`.
3. `/api/lesson-resources` smette di restituire `blobUrl`; restituisce solo `id`+metadati (l'URL
   reale non esce mai dall'API).

> Risultato: i PDF a pagamento sono protetti come i video. URL del Blob mai esposto in chiaro.

---

## FASE 4 — UI pannello admin (`public/admin.html`, tab Corsi)

- Header tab Corsi: bottone **"+ Nuovo corso"**.
- Riga corso in tabella: badge **Nascosto/Pubblicato** + azione **Pubblica/Nascondi** rapida +
  **Elimina**.
- Modale corso (estesa): toggle visibilità in evidenza, e sezione **Lezioni** trasformata da
  "solo titoli" a **editor completo**:
  - lista lezioni con drag-to-reorder, elimina, "+ Aggiungi lezione";
  - per ogni lezione: nome, descrizione, durata, **dropzone VIDEO** (progress bar + stato Vimeo),
    **dropzone MATERIALI** (lista file con elimina).
- Polling stato Vimeo finché `ready`.
- Tutto coerente con lo stile esistente del pannello (riuso classi `.btn`, `.modal`, `.form-*`).

---

## FASE 5 — QA end-to-end (obbligatoria, da regole di progetto)

Verifica del flusso COMPLETO, non solo del punto che cambia:
1. Crea corso nascosto → non appare nel catalogo (utente normale). ✅
2. Aggiungi lezione + upload video → `vimeoUrl` salvato, stato → ready. ✅
3. Upload materiale → finisce su Blob, compare nella lezione. ✅
4. Pubblica corso → appare nel catalogo. ✅
5. Login utente **senza** abbonamento → vede il corso ma **non** il video né i materiali (403 sul
   proxy). ✅
6. Login utente **con** abbonamento attivo del tier giusto → vede video e scarica materiali. ✅
7. Admin → vede sempre tutto (bypass). ✅
8. `isFree` resta false ovunque; nessun trial introdotto. ✅
9. Spegnere idealmente Aruba (o testare un URL vecchio) → i materiali migrati funzionano comunque. ✅

---

## Ordine di esecuzione consigliato

1. **FASE 0** (migrazione 5.8 GB su Blob) — mette subito al sicuro i contenuti.
2. **FASE 1** (schema) — veloce.
3. **FASE 2** API (corsi → lezioni → materiali → vimeo).
4. **FASE 3** protezione proxy.
5. **FASE 4** UI.
6. **FASE 5** QA end-to-end.

---

## Prerequisiti da preparare (tu)

1. **Vimeo access token** con scope `upload, edit, video_files` (ti guido a generarlo su
   developer.vimeo.com → My Apps → Generate token). Andrà in env `VIMEO_ACCESS_TOKEN`.
2. **`BLOB_READ_WRITE_TOKEN`**: già presente (lo usa il vocabolario). Da confermare che il piano
   Blog/Blob copra ~6 GB.
3. Confermare il **dominio di embed** Vimeo da whitelistare (es. `grecolatinovivo.it` + dominio
   Vercel) per la privacy dei video.

---

## Rischi e mitigazioni

| Rischio | Mitigazione |
|---|---|
| Migrazione Blob interrotta a metà | Script idempotente: rilancia, salta i già migrati |
| File locale mancante per qualche record | Log dedicato; resta su Aruba finché non risolto |
| Limite payload upload materiali su Vercel | File grandi → stesso pattern resumable o upload client→Blob |
| Token Vimeo esposto | Solo server-side, mai inviato al browser |
| Costi egress Blob | Monitorare; piano B = Cloudflare R2 (migrazione banale) |
