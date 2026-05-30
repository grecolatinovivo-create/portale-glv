# Fase 0 — Report migrazione materiali (verificato)

> Stato: **script pronto e matching verificato in sola lettura sul DB di produzione.
> Nessuna scrittura ancora eseguita** (né su Blob né sul DB).
> Script: `scripts/migrate-materials-to-blob.js` · Data: 2026-05-30

## Numeri reali (query in sola lettura su Neon)

| Metrica | Valore |
|---|---|
| `LessonResource` totali nel DB | **925** |
| Puntano a latin-cert.org (Aruba) | **925** (il 100%) |
| Già su Vercel Blob | **0** |
| `blobUrl` nullo | **0** |
| File trovati nella copia locale | **925 / 925** ✅ |
| File NON trovati in locale | **0** |
| Cartelle IDL assenti in locale | **0** |
| Volume totale da caricare | **~3.55 GB** (3636 MB) |

> Nota: in un report precedente avevo indicato cifre diverse (219 record, ecc.). Erano
> **errate** — derivavano da esecuzioni fallite per un problema di moduli nell'ambiente.
> I numeri qui sopra provengono da una query reale sul DB + scansione della cartella locale.

## Cosa fa lo script
Legge le `LessonResource` con `blobUrl` su latin-cert.org, trova il file nella copia locale
`latin-cert-files/`, lo carica sul **nostro Vercel Blob** e riscrive `blobUrl`. È **idempotente**
(salta i già migrati), parte in **dry-run**, scrive solo con `--apply`.

Il matching nome-file è robusto: i nomi su disco hanno suffissi (`_Latin-Cert_<hash>`,
`_compressed`, estensione doppia `_pdf.pdf`) assenti nel DB. Lo script normalizza e incrocia per
cartella IDL. **Verificato: risolve tutti i 925 file.**

## Esecuzione dell'`--apply`: dove e nota importante

L'`--apply` scrive sul **Vercel Blob di produzione** e aggiorna il **DB Neon di produzione**
(token live in `.env`). Due strade:

1. **La esegui tu in locale** (consigliato per affidabilità del filesystem):
   ```bash
   node scripts/migrate-materials-to-blob.js            # dry-run
   node scripts/migrate-materials-to-blob.js --apply    # reale
   ```
2. **La eseguo io da qui**: possibile, ma in questo ambiente sandbox il caricamento dei
   `node_modules` montati è instabile (gli script vanno lanciati con dipendenze installate a parte).
   L'upload di ~3.55 GB da qui sarebbe lento e fragile. Per un'operazione una tantum su dati di
   produzione, è più sicuro che parta dalla tua macchina.

In entrambi i casi lo script è **idempotente**: se si interrompe, basta rilanciarlo e riprende
solo i record ancora su Aruba.

## Dopo l'`--apply`
- Rilanciare la query di verifica: i 925 record devono avere `blobUrl` su `blob.vercel-storage.com`.
- A quel punto **latin-cert.org diventa irrilevante** per i materiali esistenti.
- Si procede con le fasi successive (upload nativo nuovi materiali + proxy autenticato).
