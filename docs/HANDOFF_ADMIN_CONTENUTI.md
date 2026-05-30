# Handoff — Gestione contenuti da admin (Fasi 0–4 completate)

> Stato: backend + UI scritti. Restano: `prisma db push`, variabili env, deploy, QA end-to-end.
> Data: 2026-05-30

## Cosa è stato fatto

### Fase 0 — Messa in sicurezza materiali ✅ (in esecuzione lato tuo)
- `scripts/migrate-materials-to-blob.js` — migra i **925** materiali da latin-cert.org (Aruba) al
  nostro Vercel Blob e riscrive `blobUrl`. Idempotente, dry-run di default.
- Dry-run verificato: 925/925 file trovati in locale, 0 mancanti, ~3.55 GB.
- `--apply` lo stai eseguendo in locale.

### Fase 1 — Schema ✅
`prisma/schema.prisma`, modello `Lesson`: aggiunti `vimeoStatus String?` e `description String? @db.Text`.
Tier resta sul corso. **Da applicare:** `npx prisma db push`.

### Fase 2 — API admin ✅ (tutte protette da ADMIN_EMAIL + AdminLog)
- Corsi: `POST /api/admin/courses/create` (nasce nascosto), `POST /api/admin/courses/[id]/publish`,
  `DELETE /api/admin/courses/[id]`.
- Lezioni: `POST /api/admin/lessons/create`, `POST /api/admin/lessons/[id]` (update),
  `DELETE /api/admin/lessons/[id]`, `POST /api/admin/lessons/reorder`.
- Materiali (Vercel Blob, upload client-side): `POST /api/admin/resources/upload` (handshake token),
  `POST /api/admin/resources/create` (registra in DB), `DELETE /api/admin/resources/[id]`.
- Video (Vimeo, upload client-side via tus): `POST /api/admin/vimeo/create-upload`,
  `POST /api/admin/vimeo/finalize`, `GET /api/admin/vimeo/status`.

### Fase 3 — Protezione materiali ✅
- Nuovo `lib/courseAccess.js`: logica di accesso condivisa (admin / acquisto / abbonamento active+tier+scadenze).
- `pages/api/download-resource.js`: ora verifica l'accesso al corso prima del redirect → materiali a
  pagamento protetti come i video.
- `pages/api/lesson-resources.js`: non espone più `blobUrl`; restituisce un link al proxy.
- Frontend utente: nessuna modifica necessaria (usava già `r.url`).

### Fase 4 — UI pannello admin ✅
`public/admin.html` (HTML statico, niente bundler → librerie importate da CDN ESM):
- Bottone **"+ Nuovo corso"** + modale di creazione.
- In tabella corsi: bottoni **Lezioni**, **Pubblica/Nascondi**.
- Modale **Gestione lezioni**: aggiungi/rinomina/elimina/riordina lezioni; per ogni lezione
  **dropzone video** (Vimeo tus con barra %) e **dropzone materiali** (Blob), lista materiali con elimina.
- Librerie via CDN: `@vercel/blob@0.27/client` e `tus-js-client@4.1`.

## Cosa devi fare tu (in ordine)

1. **Finire la migrazione Fase 0** (`--apply`) e verificarne l'esito.
2. **Schema:** dalla cartella progetto → `npx prisma db push` (aggiunge i 2 campi a Lesson).
3. **Env — aggiungi il token Vimeo** (necessario SOLO per l'upload video; il resto funziona già):
   - Su developer.vimeo.com → My Apps → (crea/usa app) → **Generate an access token** con scope
     **`public, private, upload, edit, video_files`**.
   - Mettilo in `.env` e su Vercel: `VIMEO_ACCESS_TOKEN="..."`
   - `BLOB_READ_WRITE_TOKEN` è già presente (lo usa anche il vocabolario).
4. **Vimeo privacy/embed:** nelle impostazioni Vimeo, whitelista i domini di embed
   (`portale.grecolatinovivo.it` e l'eventuale dominio Vercel) così i video non sono visibili fuori dal portale.
5. **Deploy** su Vercel.

## QA end-to-end (Fase 5) — da fare dopo il deploy

Seguire il flusso COMPLETo, non solo il punto che cambia:
1. Admin → "+ Nuovo corso" → si crea **nascosto** (non appare nel catalogo a un utente normale).
2. "Lezioni" → "+ Aggiungi lezione".
3. Sulla lezione → carica un **video** → barra %, poi stato passa a "in elaborazione" → "pronto".
4. Sulla lezione → carica un **materiale** (PDF) → compare nell'elenco.
5. "Pubblica" il corso → ora appare nel catalogo.
6. Login utente **senza** abbonamento → vede il corso ma **non** il video né scarica i materiali (403).
7. Login utente **con** abbonamento attivo del tier giusto → vede il video e scarica i materiali.
8. Admin → vede sempre tutto.
9. Controlla che `isFree` resti false e che non sia comparsa logica di trial.

## Note tecniche / limiti
- L'ambiente di sviluppo remoto non può fare il QA reale (no DB write, no token Vimeo, no deploy):
  i file sono validati per **sintassi**, ma il test funzionale va fatto da te dopo il deploy.
- Upload materiali e video sono **client-side diretti** (browser→Blob, browser→Vimeo): aggirano il
  limite di 4.5 MB del body serverless di Vercel. Per questo `@vercel/blob/client` e `tus-js-client`
  girano nel browser via CDN ESM.
- `onUploadCompleted` di Vercel Blob non è affidabile senza URL pubblico: per questo la
  registrazione del materiale in DB avviene con la chiamata separata `/api/admin/resources/create`.
