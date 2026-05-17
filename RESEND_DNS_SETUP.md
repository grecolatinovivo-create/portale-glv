# Configurazione Resend + DNS Serverplan
**Dominio mittente:** `grecolatinovivo.it`  
**Email mittente:** `noreply@grecolatinovivo.it`

---

## PARTE 1 — Aggiungere il dominio su Resend

1. Vai su **[resend.com](https://resend.com)** e accedi al tuo account.
2. Nel menu a sinistra clicca **"Domains"**.
3. Clicca **"Add Domain"**.
4. Digita: `grecolatinovivo.it` → clicca **"Add"**.
5. Resend mostrerà una tabella con **3–4 record DNS** da aggiungere.  
   **Lascia questa pagina aperta** e passa alla Parte 2.

---

## PARTE 2 — Aggiungere i record DNS su Serverplan

### Dove trovare il pannello DNS

1. Vai su **[https://my.serverplan.com](https://my.serverplan.com)** e accedi.
2. Clicca su **"Domini"** nel menu.
3. Trova `grecolatinovivo.it` nella lista → clicca **"Gestisci"** (o l'icona a ingranaggio).
4. Clicca su **"DNS Zone"** o **"Modifica zona DNS"**.

---

### I record da aggiungere

Resend ti mostra esattamente i valori — copia/incolla da lì. I record tipici sono questi:

#### Record 1 — SPF (tipo TXT)
| Campo | Valore |
|-------|--------|
| **Tipo** | `TXT` |
| **Nome/Host** | `@` oppure lascia vuoto |
| **Valore** | `v=spf1 include:amazonses.com ~all` (usa quello che mostra Resend) |
| **TTL** | `3600` (o il default) |

> ⚠️ Se hai già un record TXT con `v=spf1`, **non crearne uno nuovo**: modifica quello esistente aggiungendo `include:amazonses.com` prima di `~all`.

#### Record 2 — DKIM (tipo TXT)
| Campo | Valore |
|-------|--------|
| **Tipo** | `TXT` |
| **Nome/Host** | `resend._domainkey` |
| **Valore** | (stringa lunga che ti mostra Resend — inizia con `p=...`) |
| **TTL** | `3600` |

> Su alcuni pannelli il campo "Nome" va compilato come `resend._domainkey.grecolatinovivo.it` (con il dominio completo). Prova prima senza dominio; se non funziona aggiungi `.grecolatinovivo.it` in fondo.

#### Record 3 — DMARC (tipo TXT) — opzionale ma consigliato
| Campo | Valore |
|-------|--------|
| **Tipo** | `TXT` |
| **Nome/Host** | `_dmarc` |
| **Valore** | `v=DMARC1; p=none; rua=mailto:grecolatinovivo@gmail.com` |
| **TTL** | `3600` |

---

### Come aggiungere un record su Serverplan (step by step)

1. Nella zona DNS, cerca un pulsante **"Aggiungi record"** o **"+"**.
2. Seleziona il **tipo** dal menu a tendina (es. `TXT`).
3. Compila il campo **Nome/Host** con il valore dalla tabella sopra.
4. Incolla il **valore** copiato da Resend nel campo "Valore" / "Content".
5. Imposta il **TTL** a `3600`.
6. Clicca **"Salva"** o **"Aggiungi"**.
7. Ripeti per ogni record.

---

## PARTE 3 — Verificare il dominio su Resend

1. Torna sulla pagina Resend con i record.
2. Clicca il pulsante **"Verify DNS Records"** (o "Check").
3. Resend controllerà i tuoi record. Se tutto è verde → ✅ dominio verificato.
4. **I record DNS possono richiedere da 5 minuti a 24 ore per propagarsi.**  
   Se Resend dice "not found", aspetta 15 minuti e riprova.

---

## PARTE 4 — Aggiungere la variabile d'ambiente su Vercel

Una volta che il dominio è verificato:

1. Vai su [vercel.com](https://vercel.com) → il tuo progetto `portale-glv`.
2. **Settings → Environment Variables**.
3. Aggiungi (se non l'hai già fatto):
   - `RESEND_API_KEY` → la tua API key da Resend (Settings → API Keys)
   - `RESEND_FROM_EMAIL` → `noreply@grecolatinovivo.it`
4. Clicca **"Save"** → poi **"Redeploy"** per applicare le variabili.

---

## Riepilogo rapido

```
Resend dashboard → Domains → Add → grecolatinovivo.it → copia i record
Serverplan → Domini → grecolatinovivo.it → DNS Zone → aggiungi i record
Resend dashboard → Verify → attendi propagazione (max 24h)
Vercel → Settings → Env Vars → RESEND_API_KEY + RESEND_FROM_EMAIL → Redeploy
```

---

## 🔧 AZIONI DA ESEGUIRE ANCHE TU (terminale locale)

Questi due comandi vanno eseguiti **una volta sola** nella cartella `portale-glv`:

```bash
# 1. Aggiunge la colonna isAvailable al database (operazione non distruttiva)
npx prisma db push

# 2. Carica tutti i 56 corsi nel database (upsert — non duplica nulla)
npm run db:seed
```

> Se `npm run db:seed` non esiste nel package.json, usa:
> ```bash
> node prisma/seed.js
> ```
