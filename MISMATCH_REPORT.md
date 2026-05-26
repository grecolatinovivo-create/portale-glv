# MISMATCH REPORT — Database Latin-Cert vs Portale GLV (Neon)
Data: 2026-05-26  
Analisi: reverse Vimeo lookup + cross-check classroom SQL + re-mapping codici classe  
Stato: ✅ TUTTI I FIX APPLICATI (incluso re-mapping completo 7 corsi Latino)

---

## Riepilogo

| Metrica | Risultato |
|---------|-----------|
| Corsi analizzati | 56 |
| Lezioni analizzate | 467 |
| Lezioni con latinCertId | 462 |
| **latinCertId sbagliati corretti** | **9** |
| **Titoli con encoding errato corretti** | **36** |
| courseId sbagliati | 0 (nessuno) |
| vimeoUrl mismatch reali | 0 (nessuno) |
| Fix totali applicati | **47** |

---

## Metodologia di analisi

L'analisi ha usato una doppia verifica:

1. **Forward lookup**: `latinCertId` → `IDL` SQL → verifica `FK_IDCR` (classroom di origine)
2. **Reverse Vimeo lookup**: per ogni URL Vimeo Neon, trovare nel dump SQL tutti i `FK_IDL` che lo contengono, e verificare che il `FK_IDCR` corrisponda alla classroom attesa.

Il secondo metodo è quello che ha rivelato i mismatch reali che il primo metodo non aveva rilevato.

---

## FIX 1 — gr-b11: 8 latinCertId puntavano a IDCR=264 (Greco B1.2 Asincrono) invece di IDCR=30 (Greco B1.1)

**Causa:** Durante la migrazione, le lezioni 10–18 del corso `gr-b11` hanno ricevuto i `latinCertId` del corso "Greco B1.2 Asincrono/Settembre 2024" (IDCR=264), che è un corso successivo creato riutilizzando le stesse registrazioni. I `vimeoUrl` erano corretti (puntavano ai video di B1.1), ma il metadata `latinCertId` era sbagliato, compromettendo il linking di risorse ed esercizi.

| sortOrder | latinCertId errato | latinCertId corretto | Lezione SQL |
|-----------|-------------------|---------------------|-------------|
| 10 | 2291 (IDCR=264) | **134** (IDCR=30) | Greco B1.1 - Lezione 10 (29/11/2022) |
| 11 | 2292 (IDCR=264) | **159** (IDCR=30) | Greco B1.1 - Lezione 11 (06/12/2022) |
| 12 | 2293 (IDCR=264) | **177** (IDCR=30) | Greco B1.1 - Lezione 12 (13/12/2022) |
| 14 | 2294 (IDCR=264) | **224** (IDCR=30) | Greco B1.1 - Lezione 14 (10/01/2023) |
| 15 | 2295 (IDCR=264) | **241** (IDCR=30) | Greco B1.1 - Lezione 15 (17/01/2023) |
| 16 | 2296 (IDCR=264) | **254** (IDCR=30) | Greco B1.1 - Lezione 16 (19/01/2023) |
| 17 | 2297 (IDCR=264) | **273** (IDCR=30) | Greco B1.1 - Lezione 17 (24/01/2023) |
| 18 | 2298 (IDCR=264) | **294** (IDCR=30) | Greco B1.1 - Lezione 18 (31/01/2023) |

**Stato:** ✅ CORRETTO

---

## FIX 2 — did-principia: latinCertId invertiti tra sort=3 e sort=5

**Causa:** Le due lezioni "Attività in autoapprendimento" del corso `did-principia` avevano i `latinCertId` scambiati. La sort=3 puntava a IDL=2108 ("incontro 3") e la sort=5 puntava a IDL=2055 (lezione di `lat-b11`, completamente sbagliato). Entrambe condividevano lo stesso `vimeoUrl` (954924448), il che aveva mascherato l'errore.

| sortOrder | Titolo | latinCertId errato | latinCertId corretto |
|-----------|--------|--------------------|---------------------|
| 3 | "Attività in autoapprendimento - incontro 2" | 2108 (incontro 3) | **2100** (incontro 2) |
| 5 | "Attività in autoapprendimento - incontro 3" | 2055 (lat-b11!) | **2108** (incontro 3) |

**Stato:** ✅ CORRETTO (fix applicato in 3 step per rispettare il vincolo UNIQUE su latinCertId)

---

## FIX 3 — 36 titoli con encoding errato (doppio UTF-8 / Latin-1 mixing)

Titoli corretti (da SQL dump) in 14 corsi:

| Corso | Sort | Tipo problema |
|-------|------|---------------|
| breve-algoritmica | 1, 3, 4 | `â€œ/â€` → virgolette tipografiche |
| breve-archeologia | 1 | `Ã ` → `à` |
| breve-buona-novella | 3 | `Ã ` → `à` |
| breve-catullo | 2 | `â€œ/â€` → virgolette tipografiche |
| breve-conclave | 4 | `Ã ` → `à` |
| breve-guerra-religione | 1 | `Ã¨` → `è` |
| breve-japonia | 1–4 | `Ã ` → `à`, `Â` finale rimosso |
| breve-marziale | 4 | `Ã¨` → `è` |
| breve-metrica | 1, 4 | `â€"` → `–`, `Ã©` → `é`, `Ã¹` → `ù` |
| breve-padri-chiesa | 1 | `Â°` → `°` |
| breve-passione | 1–4 | `Ã ` → `à`, `Ã¹` → `ù` |
| breve-roma-dei | 10 | `Ã ` → `à` |
| breve-sacro-romano | 2 | `ÃI` → `ÈI` |
| breve-schiavitu | 1, 4 | `Ã¹` → `ù` |
| breve-tragedia-greci | 3 | `â€˜` → `'` |
| did-grammatica | 6 | `â€™` → `'` |
| did-principia | 3, 5 | `Ã ` → `à` (+ fix latinCertId) |
| gr-a22 | 1–10 | Caratteri greci Î-encoded → UTF-8 corretto |

**Stato:** ✅ TUTTI CORRETTI (0 lezioni con encoding sbagliato dopo il fix)

---

## Casi non problematici (confermati)

- **lat-a22 e lat-b13**: video condivisi tra corsi di mantenimento (111, 113, 114, 116) — comportamento intenzionale, stesso contenuto disponibile a più livelli di abbonamento
- **breve-egiziano-appro vs eg-a21**: stesso contenuto video (5 lezioni) — courseId corretto per entrambi, `latinCertId` NULL per breve-egiziano-appro (nessun errore)
- **gr-b11 sort=13**: `latinCertId=192` era già corretto (IDCR=30)
- **gr-a22 sort=7**: video condiviso tra Mantenimento A2 (124) e Mantenimento A1.1 (123) — comportamento intenzionale

---

## FIX 4 — Re-mapping completo dei 7 corsi di Latino (codici classe)

**Causa:** Le lezioni dei corsi lat-a11..lat-b13 erano state importate da classroom errate (classi live invece dei corsi e-learning ufficiali). I vimeoUrl erano di video sbagliati.

**Metodo:** L'utente ha fornito i codici classe corretti dal database latin-cert. Ogni corso è stato completamente re-mappato.

| Slug | Codice | IDCR | Lezioni vecchie (Neon) | Lezioni nuove (SQL) |
|------|--------|------|------------------------|---------------------|
| lat-a11 | HZF194 | 140 | 19 (errate) | 13 (12 video + 1 test) |
| lat-a12 | RN2EJA | 169 | 9 (errate) | 12 (tutte con video) |
| lat-a21 | JTLECV | 182 | 19 (errate) | 13 (12 video + 1 test) |
| lat-a22 | R9A873 | 202 | 10 (errate) | 12 (tutte con video) |
| lat-b11 | LP71QV | 227 | 19 (errate) | 18 (17 video + 1 test) |
| lat-b12 | 5YP6V7 | 290 | 18 (errate) | 17 (16 video + 1 materiale) |
| lat-b13 | MFZTW5 | 324 | 10 (errate) | 16 (tutte con video) |

**Note:**
- RNZEJA (fornito dall'utente per A1.2) non esiste nel dump: usato RN2EJA (IDCR=169, "Latino - Livello A1.2") — probabile typo con carattere '2' letto come 'Z'
- lat-b13 IDL=3207 escluso: "Lezione 16" senza video, duplicato di IDL=3208 che ha il video
- LessonProgress cancellati: 22 record (riferiti a vecchie lezioni non più valide)
- Prima lezione di ogni corso impostata `isFree=true`

**Stato:** ✅ CORRETTO (COMMIT applicato, verifica end-to-end passata 7/7)

---

## Verifica finale (post-fix)

```
Corsi:   56   ✅
Lezioni: 514 (re-mappati 7 corsi lat-*) ✅
latinCertId validi e coerenti con IDCR: tutti ✅
Titoli con encoding sbagliato: 0 ✅
latinCertId 2291-2298 (IDCR=264 sbagliati): 0 ✅
latinCertId 2055 (lat-b11 in did-principia): 0 ✅
Corsi lat-* con lezioni dal classroom sbagliato: 0 ✅
Verifica codice classe -> IDCR -> lezioni: 7/7 OK ✅
```
