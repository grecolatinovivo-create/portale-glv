#!/usr/bin/env python3
"""
extract-exercises.py
--------------------
Estrae esercizi autocorrettivi dal dump MySQL di latin-cert.org
e produce un file JSON pronto per l'import in Neon.

Solo test con public=1 vengono importati.
Per ciascun test vengono estratte: sezioni, quiz_list, e dati specifici
per ogni tipo di esercizio.

Output: scripts/exercises_export.json
"""

import re
import json
import sys

SQL_FILE = "database_latin-cert.sql"
OUTPUT_FILE = "scripts/exercises_export.json"

print("Lettura del dump SQL (potrebbe richiedere qualche secondo)...")

# ── Parser lineare del dump SQL ───────────────────────────────────────────────
# Leggiamo il file linea per linea per evitare di caricare 1M+ righe in memoria

def parse_inserts(filepath, table_name):
    """
    Restituisce una lista di tuple (liste di valori) per ogni INSERT
    nella tabella specificata.
    Gestisce INSERT multi-riga (valori su più righe separate da virgole).
    """
    records = []
    inside = False
    current_block = ""

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line_stripped = line.strip()

            if not inside:
                if line_stripped.startswith(f"INSERT INTO `{table_name}`"):
                    inside = True
                    # Prendi solo la parte VALUES in poi
                    idx = line.find("VALUES")
                    if idx >= 0:
                        current_block = line[idx + len("VALUES"):].strip()
                    continue
            else:
                current_block += " " + line_stripped
                # Fine del blocco INSERT (terminato da punto e virgola)
                if line_stripped.endswith(";"):
                    inside = False
                    # Rimuovi il punto e virgola finale
                    current_block = current_block.rstrip().rstrip(";")
                    # Parsa le tuple
                    tuples = parse_value_tuples(current_block)
                    records.extend(tuples)
                    current_block = ""

    return records


def parse_value_tuples(block):
    """
    Prende il testo dopo VALUES e restituisce una lista di tuple (liste di str).
    Gestisce: escape di virgolette, newline interni alle stringhe, NULL.
    """
    tuples = []
    i = 0
    block = block.strip()

    while i < len(block):
        # Trova inizio tupla
        if block[i] == '(':
            i += 1
            fields = []
            current = ""
            in_string = False
            string_char = None

            while i < len(block):
                c = block[i]

                if in_string:
                    if c == '\\' and i + 1 < len(block):
                        # escape sequence
                        next_c = block[i + 1]
                        if next_c == 'n':
                            current += '\n'
                        elif next_c == 't':
                            current += '\t'
                        elif next_c == 'r':
                            current += '\r'
                        elif next_c == '\\':
                            current += '\\'
                        elif next_c == "'":
                            current += "'"
                        elif next_c == '"':
                            current += '"'
                        else:
                            current += next_c
                        i += 2
                        continue
                    elif c == string_char:
                        # Fine stringa
                        in_string = False
                        i += 1
                        continue
                    else:
                        current += c
                        i += 1
                        continue
                else:
                    if c in ("'", '"'):
                        in_string = True
                        string_char = c
                        i += 1
                        continue
                    elif c == ',':
                        fields.append(current.strip())
                        current = ""
                        i += 1
                        continue
                    elif c == ')':
                        fields.append(current.strip())
                        tuples.append(fields)
                        i += 1
                        break
                    else:
                        current += c
                        i += 1
                        continue
        else:
            i += 1

    return tuples


def to_int(v, default=None):
    try:
        return int(v)
    except:
        return default


def to_str(v):
    if v == 'NULL' or v is None:
        return None
    return v.strip()


# ── Estrazione tabelle ────────────────────────────────────────────────────────

print("Parsing tabella 'test'...")
raw_tests = parse_inserts(SQL_FILE, "test")
# IDT, FK_IDU, title, description, section, date_creation, date_test,
# hour, minute, state, type, public, sectionbreak, week, lingua, livello, metodo, flag_cert, ordine
tests = {}
for row in raw_tests:
    if len(row) < 19:
        continue
    idt = to_int(row[0])
    public = to_int(row[11], 0)
    if public != 1:
        continue
    tests[idt] = {
        "IDT": idt,
        "title": to_str(row[2]),
        "description": to_str(row[3]),
        "public": True,
        "lingua": to_str(row[14]),
        "livello": to_str(row[15]),
        "metodo": to_str(row[16]),
        "ordine": to_int(row[18], 100),
    }
print(f"  → {len(tests)} test pubblici trovati")

print("Parsing tabella 'test2classroom'...")
raw_t2c = parse_inserts(SQL_FILE, "test2classroom")
# IDT2C, FK_IDT, FK_IDCR, datetime
test_to_classrooms = {}  # IDT → [IDCR, ...]
for row in raw_t2c:
    if len(row) < 3:
        continue
    idt = to_int(row[1])
    idcr = to_int(row[2])
    if idt not in test_to_classrooms:
        test_to_classrooms[idt] = []
    test_to_classrooms[idt].append(idcr)

print("Parsing tabella 'classroom'...")
raw_classrooms = parse_inserts(SQL_FILE, "classroom")
# Trova la struttura: IDCR, ...code, name, ...
# CREATE TABLE `classroom` — cerchiamo IDCR e name
classrooms = {}
for row in raw_classrooms:
    if len(row) < 3:
        continue
    idcr = to_int(row[0])
    # name è di solito la seconda o terza colonna — prova a trovare la colonna giusta
    name = to_str(row[2]) if len(row) > 2 else None
    classrooms[idcr] = {"IDCR": idcr, "name": name}

print("Parsing tabella 'section'...")
raw_sections = parse_inserts(SQL_FILE, "section")
# IDS, FK_IDT, name, time
sections = {}  # IDS → {IDT, ...}
sections_by_test = {}  # IDT → [IDS, ...]
for row in raw_sections:
    if len(row) < 4:
        continue
    ids = to_int(row[0])
    idt = to_int(row[1])
    sec = {
        "IDS": ids,
        "FK_IDT": idt,
        "name": to_str(row[2]),
        "time": to_int(row[3], 5),
    }
    sections[ids] = sec
    if idt not in sections_by_test:
        sections_by_test[idt] = []
    sections_by_test[idt].append(ids)

print("Parsing tabella 'quiz_list'...")
raw_ql = parse_inserts(SQL_FILE, "quiz_list")
# IDQL, FK_IDQT, FK_IDS, rand, order_view, title, instruction, textTitle, text, audio, audio_number, img, status
TYPE_MAP = {
    1: "SceltaMultipla",
    2: "VeroFalso",
    3: "RispostaAperta",
    4: "Completamento",
    6: "ClozeDragDrop",
    8: "ClozeSceltaMultipla",
    9: "Abbinamento",
    10: "RiordinoTesto",
}
quiz_list = {}  # IDQL → {...}
ql_by_section = {}  # IDS → [IDQL, ...]
for row in raw_ql:
    if len(row) < 13:
        continue
    idql = to_int(row[0])
    idqt = to_int(row[1])
    ids = to_int(row[2])
    ql = {
        "IDQL": idql,
        "FK_IDQT": idqt,
        "FK_IDS": ids,
        "questionType": TYPE_MAP.get(idqt, f"Unknown_{idqt}"),
        "order_view": to_int(row[4], 0),
        "title": to_str(row[5]),
        "instruction": to_str(row[6]),
        "textTitle": to_str(row[7]),
        "text": to_str(row[8]),
        "audio": to_str(row[9]),
        "img": to_str(row[11]),
        "data": []  # verrà popolato sotto
    }
    quiz_list[idql] = ql
    if ids not in ql_by_section:
        ql_by_section[ids] = []
    ql_by_section[ids].append(idql)

print("Parsing esercizi tipo SceltaMultipla...")
raw_sm = parse_inserts(SQL_FILE, "SceltaMultipla")
sm_by_ql = {}  # FK_IDQL → [items]
for row in raw_sm:
    if len(row) < 5:
        continue
    idql = to_int(row[1])
    item = {
        "question": to_str(row[2]),
        "correct": to_str(row[3]),
        "wrong_1": to_str(row[4]),
        "wrong_2": to_str(row[5]) if len(row) > 5 else None,
        "wrong_3": to_str(row[6]) if len(row) > 6 else None,
    }
    if idql not in sm_by_ql:
        sm_by_ql[idql] = []
    sm_by_ql[idql].append(item)

print("Parsing esercizi tipo VeroFalso...")
raw_vf = parse_inserts(SQL_FILE, "VeroFalso")
vf_by_ql = {}
for row in raw_vf:
    if len(row) < 4:
        continue
    idql = to_int(row[1])
    item = {"question": to_str(row[2]), "correct": to_int(row[3], 0)}
    if idql not in vf_by_ql:
        vf_by_ql[idql] = []
    vf_by_ql[idql].append(item)

print("Parsing esercizi tipo ClozeDragDrop...")
raw_cdd = parse_inserts(SQL_FILE, "ClozeDragDrop")
cdd_by_ql = {}
for row in raw_cdd:
    if len(row) < 3:
        continue
    idql = to_int(row[1])
    cdd_by_ql[idql] = {"html": to_str(row[2])}

print("Parsing esercizi tipo ClozeSceltaMultipla...")
raw_csm = parse_inserts(SQL_FILE, "ClozeSceltaMultipla")
csm_by_ql = {}
for row in raw_csm:
    if len(row) < 3:
        continue
    idql = to_int(row[1])
    csm_by_ql[idql] = {"html": to_str(row[2])}

print("Parsing esercizi tipo Completamento...")
raw_comp = parse_inserts(SQL_FILE, "Completamento")
comp_by_ql = {}
for row in raw_comp:
    if len(row) < 3:
        continue
    idql = to_int(row[1])
    comp_by_ql[idql] = {"html": to_str(row[2])}

print("Parsing esercizi tipo Abbinamento...")
raw_abb = parse_inserts(SQL_FILE, "Abbinamento")
abb_by_ql = {}
for row in raw_abb:
    if len(row) < 4:
        continue
    idql = to_int(row[1])
    item = {"w1": to_str(row[2]), "w2": to_str(row[3])}
    if idql not in abb_by_ql:
        abb_by_ql[idql] = []
    abb_by_ql[idql].append(item)

print("Parsing esercizi tipo RiordinoTesto...")
raw_rt = parse_inserts(SQL_FILE, "RiordinoTesto")
rt_by_ql = {}
for row in raw_rt:
    if len(row) < 5:
        continue
    idql = to_int(row[1])
    rt_by_ql[idql] = {"flag1": to_int(row[2], 0), "flag2": to_int(row[3], 0), "txt": to_str(row[4])}

print("Parsing esercizi tipo RispostaAperta...")
raw_ra = parse_inserts(SQL_FILE, "RispostaAperta")
ra_by_ql = {}
for row in raw_ra:
    if len(row) < 4:
        continue
    idql = to_int(row[1])
    ra_by_ql[idql] = {"max": to_int(row[2]), "min": to_int(row[3])}

# ── Associa dati specifici ai quiz_list ───────────────────────────────────────
type_data_map = {
    "SceltaMultipla": sm_by_ql,
    "VeroFalso": vf_by_ql,
    "ClozeDragDrop": cdd_by_ql,
    "ClozeSceltaMultipla": csm_by_ql,
    "Completamento": comp_by_ql,
    "Abbinamento": abb_by_ql,
    "RiordinoTesto": rt_by_ql,
    "RispostaAperta": ra_by_ql,
}
for idql, ql in quiz_list.items():
    qt = ql["questionType"]
    dm = type_data_map.get(qt, {})
    ql["data"] = dm.get(idql, {})

# ── Assembla output ───────────────────────────────────────────────────────────
print("\nAssemblaggio struttura finale...")

# Per ogni test pubblico, raccoglie sezioni → quiz → dati
output_tests = []
skipped = 0

for idt, test in tests.items():
    test_sections = sections_by_test.get(idt, [])
    built_sections = []

    for ids in test_sections:
        sec = sections[ids]
        sec_questions = ql_by_section.get(ids, [])
        built_qs = []
        for idql in sec_questions:
            ql = quiz_list.get(idql)
            if not ql:
                continue
            built_qs.append({
                "IDQL": ql["IDQL"],
                "questionType": ql["questionType"],
                "sortOrder": ql["order_view"],
                "title": ql["title"],
                "instruction": ql["instruction"],
                "contextText": ql["text"],
                "textTitle": ql["textTitle"],
                "audio": ql["audio"],
                "image": ql["img"],
                "data": ql["data"],
            })
        built_qs.sort(key=lambda q: q["sortOrder"])
        built_sections.append({
            "IDS": sec["IDS"],
            "name": sec["name"],
            "timeMinutes": sec["time"],
            "questions": built_qs,
        })

    if not built_sections:
        skipped += 1
        continue  # test pubblico senza sezioni → salta

    # Classrooms associati a questo test
    idcrs = test_to_classrooms.get(idt, [])
    classroom_names = [classrooms[c]["name"] for c in idcrs if c in classrooms]

    output_tests.append({
        "IDT": idt,
        "title": test["title"],
        "description": test["description"],
        "isPublic": True,
        "lingua": test["lingua"],
        "livello": test["livello"],
        "metodo": test["metodo"],
        "ordine": test["ordine"],
        "classroomIDCRs": idcrs,
        "classroomNames": classroom_names,
        "sections": built_sections,
    })

output_tests.sort(key=lambda t: t["ordine"])

# ── Statistiche ───────────────────────────────────────────────────────────────
total_sections = sum(len(t["sections"]) for t in output_tests)
total_questions = sum(
    len(s["questions"]) for t in output_tests for s in t["sections"]
)
type_counts = {}
for t in output_tests:
    for s in t["sections"]:
        for q in s["questions"]:
            qt = q["questionType"]
            type_counts[qt] = type_counts.get(qt, 0) + 1

print(f"\n{'='*50}")
print(f"RISULTATO ESTRAZIONE")
print(f"{'='*50}")
print(f"Test pubblici con sezioni: {len(output_tests)}")
print(f"Test pubblici senza sezioni (saltati): {skipped}")
print(f"Sezioni totali: {total_sections}")
print(f"Domande totali: {total_questions}")
print(f"Tipi di domanda:")
for k, v in sorted(type_counts.items()):
    print(f"  {k}: {v}")
print(f"{'='*50}")

# ── Scrittura output ──────────────────────────────────────────────────────────
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(output_tests, f, ensure_ascii=False, indent=2)

print(f"\n✓ Salvato in: {OUTPUT_FILE}")
