#!/usr/bin/env python3
"""
Estrae dal dump SQL di latin-cert:
1. video: (FK_IDL, link) — per matchare Vimeo URL → latinCertId
2. lezione: (IDL, FK_IDT) — per collegare test alle lezioni via FK diretta

Output: /tmp/fk_data.json
"""
import re
import json
import sys
import os

# Percorso del dump SQL di latin-cert:
#   1) primo argomento da riga di comando, se fornito
#   2) altrimenti ./database_latin-cert.sql nella cartella corrente
# Uso:  python3 scripts/extract-fk-data.py [percorso/al/database_latin-cert.sql]
DUMP_PATH = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.getcwd(), 'database_latin-cert.sql')
# Output accanto a questo script, così link-exercises-fk.js lo trova senza percorsi assoluti
OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fk_data.json')

if not os.path.exists(DUMP_PATH):
    print(f"ERRORE: dump non trovato: {DUMP_PATH}")
    print("Passa il percorso del file database_latin-cert.sql come argomento.")
    sys.exit(1)

video_rows = []   # { idl: int, link: str }
lezione_fk = []   # { idl: int, idt: int } — solo dove FK_IDT non è NULL

# Pattern per le INSERT multi-riga — raccogliamo i VALUES riga per riga
# Struttura video: IDV, FK_IDL, link, datetime, is_uploaded, is_active, foto, durata, log
# Struttura lezione: IDL, title, description, addtext, datetime, calendar, FK_IDCR, view, FK_IDT

def extract_values(line):
    """Estrae lista di valori da una riga INSERT VALUES come (v1, v2, ...)"""
    # Cerca tutti i gruppi (...)
    match = re.match(r'\s*\((.+)\)([,;]?)$', line.rstrip())
    if not match:
        return None
    return match.group(1)

print("Apertura dump SQL...", flush=True)

in_video_insert = False
in_lezione_insert = False

with open(DUMP_PATH, 'r', encoding='utf-8', errors='replace') as f:
    for i, line in enumerate(f):
        if i % 100000 == 0:
            print(f"  linea {i}...", flush=True)

        line_stripped = line.strip()

        # Rileva inizio INSERT INTO video
        if line_stripped.startswith('INSERT INTO `video`'):
            in_video_insert = True
            in_lezione_insert = False
            # I valori possono iniziare sulla stessa riga dopo VALUES
            if 'VALUES' in line_stripped:
                rest = line_stripped[line_stripped.index('VALUES')+6:].strip()
                if rest:
                    # parse della parte rimanente
                    line = rest
                    line_stripped = rest
                else:
                    continue
        elif line_stripped.startswith('INSERT INTO `lezione`'):
            in_lezione_insert = True
            in_video_insert = False
            if 'VALUES' in line_stripped:
                rest = line_stripped[line_stripped.index('VALUES')+6:].strip()
                if rest:
                    line = rest
                    line_stripped = rest
                else:
                    continue
        elif line_stripped.startswith('INSERT INTO '):
            in_video_insert = False
            in_lezione_insert = False
            continue
        elif line_stripped.startswith('--') or line_stripped.startswith('/*') or not line_stripped:
            if not in_video_insert and not in_lezione_insert:
                continue

        if in_video_insert:
            # Ogni riga è una tupla (IDV, FK_IDL, link, ...)
            # Usa regex per estrarre i valori
            m = re.match(r"\s*\((\d+),\s*(\d+),\s*'([^']*)'", line_stripped)
            if m:
                idv = int(m.group(1))
                fk_idl = int(m.group(2))
                link = m.group(3)
                if 'vimeo' in link.lower():
                    video_rows.append({'idl': fk_idl, 'link': link})
            # Fine INSERT
            if line_stripped.endswith(';'):
                in_video_insert = False

        elif in_lezione_insert:
            # Struttura: IDL, title, description, addtext, datetime, calendar, FK_IDCR, view, FK_IDT
            # FK_IDT è l'ultimo campo — può essere NULL o un numero
            # La riga è complessa per via di stringhe con virgole e escape
            # Usiamo regex per catturare IDL all'inizio e FK_IDT alla fine
            m = re.match(r"\s*\((\d+),\s*'", line_stripped)
            if m:
                idl = int(m.group(1))
                # FK_IDT è alla fine: ,<numero>) o ,NULL)
                fk_idt_m = re.search(r',\s*(NULL|\d+)\)\s*[,;]?\s*$', line_stripped)
                if fk_idt_m:
                    fk_idt_val = fk_idt_m.group(1)
                    if fk_idt_val != 'NULL':
                        lezione_fk.append({'idl': idl, 'idt': int(fk_idt_val)})
            if line_stripped.endswith(';'):
                in_lezione_insert = False

print(f"\nVideo estratti: {len(video_rows)}")
print(f"Lezione con FK_IDT: {len(lezione_fk)}")

# Salva risultati
with open(OUT_PATH, 'w') as f:
    json.dump({
        'video': video_rows,
        'lezione_fk': lezione_fk
    }, f)

print(f"\nSalvato in {OUT_PATH}")
print("Primi 3 video:", video_rows[:3])
print("Primi 3 lezione_fk:", lezione_fk[:3])
