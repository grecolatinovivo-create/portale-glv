# QA Report — Pannello Admin GrecoLatinoVivo
*Data: 17 maggio 2026 — QA Engineer Agent*

---

## ✅ Cosa funziona

### Schema DB
- `isSuspended Boolean @default(false)` aggiunto a `User` — compatibile, nessun dato pregresso rotto
- `expiresAt DateTime?` e `availableUntilLabel String?` aggiunti a `Course` — nullable, nessun corso legacy rotto
- `AdminLog` model creato — append-only, no relazioni cascade che potrebbero cancellarlo per sbaglio

### Protezione Admin
- Gate client-side in `admin.html`: verifica `/api/auth/me` → controlla `email === 'grecolatinovivo@gmail.com'`
- Gate server-side in tutte le route `/api/admin/*`: richiede token JWT valido + `req.user.email === ADMIN_EMAIL`
- Doppia protezione: anche se qualcuno raggiunge il pannello HTML direttamente, le API rifiutano tutte le operazioni

### Sospensione Utenti
- `withAuth` ora controlla `isSuspended` nel DB ad ogni richiesta autenticata
- Cookie cancellato immediatamente se account sospeso (non aspetta scadenza del JWT)
- L'admin non può sospendere se stesso (controllo `userId === req.user.userId`)

### Scadenza Corsi — Edge Case Critico
- **Acquirenti singoli (Purchase) NON sono mai bloccati da `expiresAt`** — logica verificata in `courses/[id].js`: controlla Purchase prima di Subscription, e il blocco `expiresAt` è applicato solo al ramo Subscription
- `accessSource` ('purchase' | 'subscription' | 'subscription-expired' | null) restituito nell'API per debug
- Urgency badge mostrato solo agli abbonati (`showUrgency` dipende da `hasSubscription`)

### AdminLog
- Scritto in: `admin/courses.js` (UPDATE_COURSE), `admin/users.js` (SUSPEND_USER / RESTORE_USER), `admin/certificates.js` (REVOKE_CERT / RESTORE_CERT / REGENERATE_CERT)
- Payload JSON contiene before/after per audit

### Attestati Admin
- API accetta `certId` (ID primario) — più robusto di `certCode` che potrebbe cambiare con `regenerate`
- `regenerate` invia automaticamente la nuova email con il nuovo codice
- Admin.html usa `c.student || c.user` per retrocompatibilità con entrambe le chiavi API

---

## 🔧 Bug Corretti Durante QA

| Bug | Dove | Fix |
|-----|------|-----|
| POST admin/certificates usava `certCode` come lookup ma frontend mandava `certId` | `admin/certificates.js` | Accetta ora sia `certId` che `certCode` |
| GET admin/certificates restituiva `student` ma template admin.html accedeva `c.user` | `admin.html` | Template ora legge `c.student || c.user` |
| `courses/index.js` usava `export default` invece di `module.exports` | `pages/api/courses/index.js` | Corretto in `module.exports` |
| `courses/index.js` usava `isPublished` (campo inesistente) | `pages/api/courses/index.js` | Corretto in `isAvailable` |
| `courses/index.js` usava `prisma.progress` (modello inesistente) | `pages/api/courses/index.js` | Corretto in `prisma.lessonProgress` |
| `courses/index.js` usava `req.user.id` | `pages/api/courses/index.js` | Corretto in `req.user.userId` |
| Attestati admin non scrivevano AdminLog | `admin/certificates.js` | Aggiunto per tutte e 3 le azioni |
| Urgency badge non mostrava testo corretto quando `availableUntilLabel` era null | `app.js` | Fallback su 'In scadenza' |

---

## ⚠️ Punti Aperti (non bloccanti per il lancio)

1. **withAuth fa una query DB per ogni request autenticata** — per il portale attuale (bassa concorrenza) è accettabile. In futuro: usare un campo `version` nel JWT e confrontare con `suspendedAt` nel DB per evitare query.

2. **Log admin mostra solo ultimi 10 record** — la sezione "Log azioni" del pannello usa la stessa API `/admin/dashboard` limitata a 10. Creare una route dedicata `/api/admin/logs` con paginazione per log completi.

3. **Admin identificato solo tramite email** — sicuro per ora (verifica JWT + email). Per il futuro: aggiungere campo `role` a `User` ('admin' | 'user') per una gestione più formale dei permessi.

4. **`courses/[id].js` — accesso scaduto non restituisce 403 esplicito** — l'API restituisce `hasAccess: false` e `accessSource: 'subscription-expired'`. Il frontend deve gestire questo stato mostrando un messaggio chiaro ("Il tuo abbonamento non copre più questo corso"). Da implementare in `corso.html`.

---

## 📋 Checklist Lancio Admin Panel

- [x] Schema aggiornato (`isSuspended`, `expiresAt`, `availableUntilLabel`, `AdminLog`)
- [x] API `/api/admin/dashboard` — metriche + log
- [x] API `/api/admin/courses` — lista + modifica scadenza
- [x] API `/api/admin/users` — lista + sospensione
- [x] API `/api/admin/certificates` — lista + revoca/ripristino/rigenera
- [x] `public/admin.html` — pannello completo con 4 sezioni
- [x] Urgency badge in `app.js` e `style.css`
- [x] Gate doppio (client + server) per protezione admin
- [x] AdminLog scritto per tutte le azioni distruttive
- [x] Modal di conferma per azioni distruttive (sospensione, revoca)
- [ ] **Da fare prima del lancio:** `npx prisma db push` per applicare le nuove colonne al DB
- [ ] **Da fare prima del lancio:** `npm install` se nuove dipendenze aggiunte
