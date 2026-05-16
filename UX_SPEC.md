# UX SPEC — Portale GLV

## Design System

### Palette colori
| Token | Valore | Uso |
|---|---|---|
| --bg-base | #0d0d0d | Sfondo pagina |
| --bg-card | #1a1a1a | Card corsi |
| --bg-card-hover | #252525 | Card hover |
| --bg-nav | rgba(13,13,13,0.95) | Navbar fixed |
| --accent | #a01a36 | Brand red GLV |
| --accent-hover | #c02040 | Hover rosso |
| --text-primary | #ffffff | Titoli, body |
| --text-secondary | #b3b3b3 | Sottotitoli |
| --text-muted | #666666 | Note, label |
| --border | #2a2a2a | Bordi card |
| --gold | #f0c040 | Stelle rating |

### Colori categoria (thumbnail gradient)
- Latino: #7b0d1e → #a01a36
- Greco Antico: #1a237e → #3949ab
- Egiziano: #e65100 → #ff8f00
- Ebraico: #1b5e20 → #2e7d32
- Didattica: #4a148c → #7b1fa2

### Tipografia
- Heading: Montserrat 700/600 (Google Fonts)
- Body: Inter 400/500 (Google Fonts)
- Monospace: nessuno
- Scale: 11px / 13px / 15px / 18px / 24px / 32px / 48px / 64px

### Spaziature
- Base: 8px grid
- Card gap: 10px
- Section padding: 60px verticale, 48px orizzontale
- Nav height: 64px

## Architettura dell'informazione

### index.html — Landing (non abbonati)
1. NAV: logo + "Accedi" + "Abbonati ora" (CTA rosso)
2. HERO: headline grande, sottotitolo, 2 CTA, immagine/video di sfondo
3. PREVIEW CATALOGO: riga orizzontale di card (blurrate/locked per chi non è abbonato)
4. PROPOSTA VALORE: 3 colonne — "Tutti i livelli", "A tuo ritmo", "Una community"
5. PRICING: toggle mensile/annuale, 2 card piano, garanzia 30gg
6. SOCIAL PROOF: "1.500+ studenti", recensioni
7. FAQ: accordion
8. FOOTER: link, social, legal

### dashboard.html — Home abbonato
1. NAV: logo + cerca + avatar + "Il mio abbonamento"
2. HERO BILLBOARD: corso in evidenza a schermo quasi-pieno, titolo sovrapposto, CTA "Inizia" + "Aggiungi alla lista"
3. ROW "Continua a studiare": corsi con progress bar
4. ROW "Nuovi questo mese": ultimi aggiunti
5. ROW "Latino": tutti i corsi latino
6. ROW "Greco Antico": tutti i corsi greco
7. ROW "Egiziano Geroglifico"
8. ROW "Ebraico Biblico"
9. ROW "Didattica delle Lingue Classiche"

### corso.html — Singolo corso
1. HERO: gradient sfondo lingua, titolo, badge livello, metadati (durata, lezioni, docente)
2. CTA STICKY: "Accedi al corso" o "Abbonati per accedere"
3. DESCRIZIONE: testo completo
4. LISTA LEZIONI: accordion con titolo, durata, lock icon se non abbonato
5. DOCENTE: avatar, bio, altri corsi
6. CORSI CORRELATI: riga orizzontale

### catalogo.html — Catalogo
1. NAV standard
2. FILTRI: lingua (tab), livello (dropdown), durata
3. GRID corsi: 4 colonne desktop, 2 tablet, 1 mobile

### profilo.html — Area utente
1. Header profilo: avatar, nome, tipo abbonamento
2. Il mio abbonamento: piano, data rinnovo, gestisci
3. Cronologia: corsi seguiti
4. Impostazioni: email, password, notifiche

## Componenti chiave

### CourseCard
- Thumbnail (gradiente CSS con titolo lingua sovrapposto)
- Hover: scale(1.08) + tooltip espanso con descrizione + CTA
- Badge: livello (A1, A2, B1), lingua, "NUOVO"
- Progress bar (solo in dashboard, se iniziato)

### PricingCard
- Piano Mensile: €12,90/mese
- Piano Annuale: €99/anno (€8,25/mese) — "PIÙ POPOLARE"
- Toggle switch mensile/annuale con aggiornamento prezzi live

### HeroRow (dashboard)
- Background: thumbnail corso a piena larghezza, overlay gradiente
- Titolo 48px, sottotitolo, 2 pulsanti
- Auto-rotate ogni 8 secondi

## Flussi utente

### Conversione (non abbonato → abbonato)
Landing → scroll pricing → click "Inizia ora" → checkout Stripe → email Resend → dashboard

### Accesso corso (abbonato)
Dashboard → click card → pagina corso → click lezione → player Vimeo

### Acquisto singolo
Catalogo → corso → "Acquista singolo €XX" → checkout Stripe → accesso immediato
