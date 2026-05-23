import re

# Scansione TOTALE del dump: trova OGNI occorrenza di URL a file o path /db/
# in QUALSIASI tabella, non solo lezione

all_file_refs = []
current_table = None

with open('/sessions/epic-keen-cori/mnt/portale-glv/database_latin-cert.sql', 'r', encoding='utf-8', errors='replace') as f:
    for line in f:
        line = line.rstrip()
        m = re.match(r'INSERT INTO `(\w+)`', line)
        if m:
            current_table = m.group(1)

        # Cerca percorsi Aruba: /db/materiali/, /db/files/, ecc.
        aruba_paths = re.findall(r'(?:https?://[^\s"\'<>]*aruba[^\s"\'<>]*|/db/[^\s"\'<>]+)', line)
        # Cerca file con estensione
        file_refs = re.findall(r'[\w\-/]+\.(?:pdf|PDF|doc|docx|xls|xlsx|ppt|pptx|mp3|mp4|zip|rar)', line)
        # Cerca path con numeri hex (come i compiti: 67321d148f3dc.pdf)
        hex_files = re.findall(r'[0-9a-f]{10,}\.\w+', line)

        found = aruba_paths + file_refs + hex_files
        if found:
            # Deduplica
            found = list(set(found))
            all_file_refs.append({'table': current_table, 'line_start': line[:80], 'found': found[:5]})

print(f'Totale righe con riferimenti a file: {len(all_file_refs)}')
print()
# Raggruppa per tabella
by_table = {}
for r in all_file_refs:
    t = r['table']
    if t not in by_table:
        by_table[t] = []
    by_table[t].extend(r['found'])

for table, refs in sorted(by_table.items(), key=lambda x: -len(x[1])):
    unique_refs = list(set(refs))
    print(f'  {table}: {len(refs)} riferimenti ({len(unique_refs)} unici)')
    for r in unique_refs[:5]:
        print(f'    {r}')
    print()
