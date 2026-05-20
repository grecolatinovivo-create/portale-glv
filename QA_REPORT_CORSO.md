# QA Report — Vista Corso SPA in-page · GLV Portale
*20 maggio 2026 — MVP: slug `breve-marziale`*

## Livello di rischio residuo: BASSO (dopo fix)

## Riepilogo
- Test eseguiti: 21
- Bug critici trovati e corretti: 1
- Bug alti trovati e corretti: 1
- Bug medi trovati e corretti: 2
- Problemi aperti (non bloccanti): 2

---

## Test funzionali (vs CORSO_VIEW_README.md)

| # | Requisito | Risultato | Note |
|---|-----------|-----------|------|
| 1 | Click su breve-marziale apre vista corso | ✅ OK | Guard `ALLOWED_SLUGS` applicato |
| 2 | Altri slug: toast, nessuna apertura | ✅ OK | `else` branch in `goToCourse` |
| 3 | Animazione slide 420ms cubic-bezier | ✅ OK | Double-rAF per reflow |
| 4 | URL aggiornato `?corso=breve-marziale` | ✅ OK | `pushState` con opt `pushState:false` |
| 5 | Back button torna al catalogo | ✅ OK | Listener su `#course-back-btn` |
| 6 | Browser back/forward gestito | ✅ OK | `popstate` con `skipAnimation:true` |
| 7 | Deep link `?corso=` funziona al caricamento | ✅ OK | Check in DOMContentLoaded dopo `await showDashboard()` |
| 8 | Header: titolo, badge, descrizione, progresso | ✅ OK dopo fix #1 | Fix necessario per unwrap risposta API |
| 9 | Streak badge mostra giorni consecutivi | ✅ OK | Calcolato da `updatedAt` senza nuova colonna DB |
| 10 | Lista lezioni con icone stato, FREE badge, durata | ✅ OK dopo fix #2 + #3 | |
| 11 | Auto-selezione next lesson (evidenziazione) | ✅ OK | No autoplay — conforme NEURO_SPEC |
| 12 | Click lezione accessibile → player Vimeo | ✅ OK | Placeholder Vimeo per vimeoUrl null |
| 13 | Click lezione bloccata → locked banner + CTA | ✅ OK | `role="alert"` presente |
| 14 | Progresso salvato ogni 10s via timeupdate | ✅ OK | Debounce con `_lastSaveTime` |
| 15 | Fine video → completamento + icona aggiornata | ✅ OK dopo fix #3 | `totalSeconds` ora corretto |
| 16 | Navigazione prec/succ nel player | ✅ OK | `cloneNode` anti-leak listener |
| 17 | Player distrutto a cambio lezione/chiusura vista | ✅ OK | `_destroyPlayer()` in `renderPlayer` + `closeCourseView` |
| 18 | Vimeo SDK non ancora caricato → retry 200ms | ✅ OK | Evita crash su connessioni lente |
| 19 | `aria-hidden` gestito su course-view | ✅ OK | Focus su back-btn dopo animazione |
| 20 | `prefers-reduced-motion` disabilita animazioni | ✅ OK | `transition: none !important` via media query |
| 21 | Utente senza abbonamento vede solo lezioni free | ✅ OK | `lesson-row--locked` + opacity 0.45 |

---

## Coerenza UX/NM → codice

| Controllo | Esito |
|-----------|-------|
| Animazione 420ms `cubic-bezier(0.4, 0, 0.2, 1)` (UX_SPEC) | ✅ |
| Auto-selezione next lesson senza autoplay (NEURO_SPEC Zeigarnik) | ✅ |
| Microcopy locked: "Questa lezione è inclusa nei piani di abbonamento" | ✅ |
| Streak badge fiamma SVG (UX_SPEC_CORSO path) | ✅ |
| Back button freccia + "Torna ai corsi" | ✅ |
| Progress bar animata con delay dopo slide-in (500ms) | ✅ |
| Badge lingua colorati con variabili CSS esistenti | ✅ |

---

## Bug trovati e corretti

### Bug #1 — CRITICO: risposta API corsi non unwrappata
- **File**: `public/dashboard.html` → `openCourseView()`, fetch parallelo
- **Problema**: `/api/courses/[id].js` ritorna `{ course: { … } }` ma il codice memorizzava l'intero oggetto JSON come `course`. Risultato: `course.title`, `course.lessons`, `course.hasAccess` = `undefined`. La vista corso apriva vuota.
- **Correzione**:
  ```js
  // Prima
  course = rCourse.ok ? await rCourse.json() : null;
  // Dopo
  course = rCourse.ok ? ((await rCourse.json())?.course ?? null) : null;
  ```

### Bug #2 — ALTO: `_lessonProgressMap` usava chiave sbagliata
- **File**: `public/dashboard.html` → `_lessonProgressMap()`
- **Problema**: Il codice cercava `p.lessonId` ma `/api/progress/course/[courseId].js` ritorna oggetti con chiave `p.id`. La Map era sempre vuota → nessuna lezione mostrava completamento, nessun resume point letto.
- **Correzione**:
  ```js
  // Prima
  if (p.lessonId) map.set(p.lessonId, p);
  // Dopo
  const key = p.id || p.lessonId;
  if (key) map.set(key, p);
  ```

### Bug #3a — MEDIO: `lesson.durationSeconds` non esiste in Prisma
- **File**: `public/dashboard.html` → `renderLessonList()`
- **Problema**: Schema Prisma ha `durationMin: Int`, non `durationSeconds`. La durata non veniva mai mostrata nelle righe lezione.
- **Correzione**: `const durationStr = lesson.durationMin ? (lesson.durationMin + ' min') : '';`

### Bug #3b — MEDIO: `totalSeconds` sempre 0 → completamento mai raggiunto
- **File**: `public/dashboard.html` → `renderPlayer()` → `initVimeoProgress()`
- **Problema**: `const totalSec = lesson.durationSeconds || 0` → sempre 0. Il server usa `ts > 30 && ws >= ts * 0.9` per marcare completo. Con `ts = 0` la condizione non veniva mai soddisfatta.
- **Correzione**: `const totalSec = lesson.durationMin ? lesson.durationMin * 60 : 0;`

---

## Edge case testati

| Caso | Esito |
|------|-------|
| Slug non in `ALLOWED_SLUGS` | ✅ ritorna immediatamente |
| `course` null dopo fetch 404 | ✅ mostra toast, non procede |
| Errore di rete su fetch parallelo | ✅ catch con toast |
| `streakData` null/errore | ✅ fallback `{ streak: 0 }` |
| Player → chiusura → riapertura | ✅ `_destroyPlayer()` garantisce stato pulito |
| Locked banner su più click consecutivi | ✅ `existing.remove()` prima di aggiungerne uno |
| Tutte le lezioni completate → `_findNextLesson` | ✅ ritorna `firstFallback` per rivedere |
| `durationMin: null` nel DB | ✅ durata non mostrata, nessun crash |
| `prefers-reduced-motion` attivo | ✅ nessuna animazione CSS |

---

## Problemi aperti (non bloccanti)

### 1. Attestato non notificato nella UI del corso
Il backend emette automaticamente il certificato quando il corso raggiunge il 100% (risposta `certificateIssued: true` da `/api/progress/update`), ma `saveProgress()` non gestisce questo campo visivamente. L'utente non vede nessuna notifica in-app.
- **Severità**: Bassa (email certificato comunque inviata)
- **Azione suggerita fase 2**: Nel callback `.then(data => {...})` dell'evento `ended`, aggiungere un toast "🎓 Corso completato! Attestato disponibile nella tua area."

### 2. Nessun loading state durante fetch parallelo in `openCourseView`
Tra il click sulla card e la comparsa della vista corso non c'è feedback visivo. Su connessioni lente l'utente potrebbe cliccare più volte, generando fetch multipli sovrapposti.
- **Severità**: Bassa (MVP accettabile)
- **Azione suggerita fase 2**: Aggiungere un flag `_isLoading` + spinner overlay sul wrapper, o disabilitare le card durante il fetch.

---

## Raccomandazioni finali

1. **Fase 2 — rimozione ALLOWED_SLUGS**: quando tutti i corsi supportano la vista in-page, rimuovere il guard `if (!ALLOWED_SLUGS.includes(slug))` e la costante `CORSO_SLUG_TEST`.
2. **Attestato in UI**: gestire `data.certificateIssued === true` nella callback `ended` → banner celebrativo + link alla sezione certificati nella dashboard.
3. **Test E2E**: aggiungere un test Playwright: click corso → selezione lezione → avanzamento → back button → verifica URL ripristinato. Priorità: prevenire regressioni sullo slug guard e sull'animazione.
