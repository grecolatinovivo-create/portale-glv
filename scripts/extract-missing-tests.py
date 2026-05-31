#!/usr/bin/env python3
"""
extract-missing-tests.py
Estrae i 39 test (public=0) collegati a lezioni Neon via FK
che erano stati esclusi dall'import originale.

Stessa logica di extract-exercises.py ma con whitelist IDT invece di public=1.
Output: /tmp/missing_exercises.json
"""
import re, json, sys, os

# Percorso al dump SQL:
#   1) primo argomento da riga di comando, se fornito
#   2) altrimenti ./database_latin-cert.sql nella cartella corrente
# Uso:  python3 scripts/extract-missing-tests.py [percorso/al/database_latin-cert.sql]
SQL_FILE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.getcwd(), 'database_latin-cert.sql')
if not os.path.exists(SQL_FILE):
    print(f"ERRORE: dump non trovato: {SQL_FILE}")
    print("Passa il percorso del file database_latin-cert.sql come argomento.")
    sys.exit(1)

# IDT mancanti (collegati a lezioni Neon via lezione.FK_IDT ma public=0)
TARGET_IDTS = {
    215, 211, 212, 226, 222, 221, 218, 227, 234, 235, 238, 229,
    246, 244, 245, 243, 250, 251, 253, 257, 260, 261, 259, 270,
    268, 264, 267, 272, 275, 280, 278, 281, 284, 288,
    346, 349, 350, 354, 450
}

# ── Helpers ──────────────────────────────────────────────────────────────────
def to_int(v, default=None):
    if v is None or str(v).strip().upper() == 'NULL':
        return default
    try: return int(v)
    except: return default

def to_str(v):
    if v is None or str(v).strip().upper() == 'NULL':
        return None
    return str(v).strip()

# ── Parser INSERT per tabella ─────────────────────────────────────────────────
def parse_inserts(filepath, table_name):
    """Restituisce lista di liste di valori per ogni riga INSERT della tabella."""
    records = []
    inside = False
    current_block = ""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
            ls = line.strip()
            if not inside:
                if ls.startswith(f'INSERT INTO `{table_name}`'):
                    inside = True
                    idx = line.find('VALUES')
                    if idx >= 0:
                        current_block = line[idx + len('VALUES'):].strip()
                    continue
            else:
                current_block += ' ' + ls
                if ls.endswith(';'):
                    inside = False
                    current_block = current_block.rstrip().rstrip(';')
                    records.extend(parse_value_tuples(current_block))
                    current_block = ''
    return records

def parse_value_tuples(block):
    tuples = []
    i = 0
    block = block.strip()
    while i < len(block):
        if block[i] == '(':
            i += 1
            fields = []
            current = ''
            in_string = False
            string_char = None
            escape = False
            while i < len(block):
                c = block[i]
                if escape:
                    current += c; escape = False; i += 1; continue
                if c == '\\' and in_string:
                    escape = True; i += 1; continue
                if not in_string and c in ("'", '"'):
                    in_string = True; string_char = c; i += 1; continue
                if in_string and c == string_char:
                    in_string = False; i += 1; continue
                if not in_string and c == ',':
                    fields.append(current.strip()); current = ''; i += 1; continue
                if not in_string and c == ')':
                    fields.append(current.strip()); tuples.append(fields); i += 1; break
                current += c; i += 1
        else:
            i += 1
    return tuples

print("Analisi dump SQL per 39 IDT mancanti...", flush=True)

# ── Test ─────────────────────────────────────────────────────────────────────
print("Parsing 'test'...", flush=True)
raw_tests = parse_inserts(SQL_FILE, 'test')
tests = {}
for row in raw_tests:
    if len(row) < 19: continue
    idt = to_int(row[0])
    if idt not in TARGET_IDTS: continue
    tests[idt] = {
        'IDT': idt,
        'title': to_str(row[2]),
        'description': to_str(row[3]) or '',
        'public': False,
        'lingua': to_str(row[14]),
        'livello': to_str(row[15]),
        'metodo': to_str(row[16]),
        'ordine': to_int(row[18], 100),
    }
print(f"  Test trovati: {len(tests)}", flush=True)

# ── Section ───────────────────────────────────────────────────────────────────
print("Parsing 'section'...", flush=True)
raw_sections = parse_inserts(SQL_FILE, 'section')
sections = {}           # IDS → {...}
sections_by_test = {}   # IDT → [IDS]
for row in raw_sections:
    if len(row) < 4: continue
    ids = to_int(row[0])
    idt = to_int(row[1])
    if idt not in TARGET_IDTS: continue
    sec = {'IDS': ids, 'FK_IDT': idt, 'name': to_str(row[2]), 'time': to_int(row[3], 5)}
    sections[ids] = sec
    sections_by_test.setdefault(idt, []).append(ids)
print(f"  Sezioni trovate: {len(sections)}", flush=True)

# ── quiz_list ─────────────────────────────────────────────────────────────────
TYPE_MAP = {1:'SceltaMultipla',2:'VeroFalso',3:'RispostaAperta',4:'Completamento',
            6:'ClozeDragDrop',8:'ClozeSceltaMultipla',9:'Abbinamento',10:'RiordinoTesto'}

print("Parsing 'quiz_list'...", flush=True)
raw_ql = parse_inserts(SQL_FILE, 'quiz_list')
# IDQL, FK_IDQT, FK_IDS, rand, order_view, title, instruction, textTitle, text, audio, audio_number, img, status
quiz_list = {}      # IDQL → {...}
ql_by_section = {}  # IDS → [IDQL]
for row in raw_ql:
    if len(row) < 13: continue
    idql = to_int(row[0])
    idqt = to_int(row[1])
    ids = to_int(row[2])
    if ids not in sections: continue
    ql = {
        'IDQL': idql, 'FK_IDQT': idqt, 'FK_IDS': ids,
        'questionType': TYPE_MAP.get(idqt, f'Unknown_{idqt}'),
        'order_view': to_int(row[4], 0),
        'title': to_str(row[5]),
        'instruction': to_str(row[6]),
        'textTitle': to_str(row[7]),
        'text': to_str(row[8]),
        'audio': to_str(row[9]),
        'img': to_str(row[11]),
        'data': {}
    }
    quiz_list[idql] = ql
    ql_by_section.setdefault(ids, []).append(idql)
print(f"  Domande trovate: {len(quiz_list)}", flush=True)

# ── Tabelle tipo-specifiche ───────────────────────────────────────────────────
def load_type_table(name, id_col=1):
    return parse_inserts(SQL_FILE, name)

print("Parsing tabelle tipo-specifiche...", flush=True)

sm_by_ql = {}
for row in load_type_table('SceltaMultipla'):
    if len(row) < 5: continue
    idql = to_int(row[1])
    sm_by_ql.setdefault(idql, []).append({
        'question': to_str(row[2]), 'correct': to_str(row[3]),
        'wrong_1': to_str(row[4]) if len(row) > 4 else None,
        'wrong_2': to_str(row[5]) if len(row) > 5 else None,
        'wrong_3': to_str(row[6]) if len(row) > 6 else None,
    })

vf_by_ql = {}
for row in load_type_table('VeroFalso'):
    if len(row) < 4: continue
    idql = to_int(row[1])
    vf_by_ql.setdefault(idql, []).append({'question': to_str(row[2]), 'correct': to_int(row[3], 0)})

cdd_by_ql = {}
for row in load_type_table('ClozeDragDrop'):
    if len(row) < 3: continue
    cdd_by_ql[to_int(row[1])] = {'html': to_str(row[2])}

csm_by_ql = {}
for row in load_type_table('ClozeSceltaMultipla'):
    if len(row) < 3: continue
    csm_by_ql[to_int(row[1])] = {'html': to_str(row[2])}

comp_by_ql = {}
for row in load_type_table('Completamento'):
    if len(row) < 3: continue
    comp_by_ql[to_int(row[1])] = {'html': to_str(row[2])}

abb_by_ql = {}
for row in load_type_table('Abbinamento'):
    if len(row) < 4: continue
    abb_by_ql.setdefault(to_int(row[1]), []).append({'w1': to_str(row[2]), 'w2': to_str(row[3])})

rt_by_ql = {}
for row in load_type_table('RiordinoTesto'):
    if len(row) < 5: continue
    rt_by_ql[to_int(row[1])] = {'flag1': to_int(row[2],0), 'flag2': to_int(row[3],0), 'txt': to_str(row[4])}

ra_by_ql = {}
for row in load_type_table('RispostaAperta'):
    if len(row) < 4: continue
    ra_by_ql[to_int(row[1])] = {'max': to_int(row[2]), 'min': to_int(row[3])}

type_data_map = {
    'SceltaMultipla': sm_by_ql, 'VeroFalso': vf_by_ql,
    'ClozeDragDrop': cdd_by_ql, 'ClozeSceltaMultipla': csm_by_ql,
    'Completamento': comp_by_ql, 'Abbinamento': abb_by_ql,
    'RiordinoTesto': rt_by_ql, 'RispostaAperta': ra_by_ql,
}
for idql, ql in quiz_list.items():
    qt = ql['questionType']
    ql['data'] = type_data_map.get(qt, {}).get(idql, {})

print("Assemblaggio struttura finale...", flush=True)

output_tests = []
skipped = 0
for idt, test in tests.items():
    test_section_ids = sections_by_test.get(idt, [])
    built_sections = []
    for ids in test_section_ids:
        sec = sections[ids]
        qs = []
        for idql in ql_by_section.get(ids, []):
            ql = quiz_list.get(idql)
            if not ql: continue
            qs.append({
                'IDQL': ql['IDQL'],
                'questionType': ql['questionType'],
                'sortOrder': ql['order_view'],
                'title': ql['title'],
                'instruction': ql['instruction'],
                'contextText': ql['text'],
                'textTitle': ql['textTitle'],
                'audio': ql['audio'],
                'image': ql['img'],
                'data': ql['data'],
            })
        qs.sort(key=lambda q: q['sortOrder'] or 0)
        built_sections.append({'IDS': sec['IDS'], 'name': sec['name'], 'timeMinutes': sec['time'], 'questions': qs})
    if not built_sections:
        skipped += 1
        print(f"  ⚠ IDT={idt} '{test['title']}' — nessuna sezione, saltato")
        continue
    output_tests.append({**test, 'sections': built_sections})

output_tests.sort(key=lambda x: x['IDT'])

with open('/tmp/missing_exercises.json', 'w') as f:
    json.dump(output_tests, f)

total_sez = sum(len(t['sections']) for t in output_tests)
total_dom = sum(len(s['questions']) for t in output_tests for s in t['sections'])
print(f"\n✅ Test estratti: {len(output_tests)} (saltati: {skipped})")
print(f"   Sezioni: {total_sez} | Domande: {total_dom}")
print("Salvato in /tmp/missing_exercises.json")
