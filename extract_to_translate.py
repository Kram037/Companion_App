import json, sys
data = json.load(open('risorse/incantesimi/spells.json', encoding='utf-8'))
target_levels = list(range(2, 10))
to_translate = {}
for sp in data.values():
    if sp['level'] in target_levels and not sp['translated']:
        to_translate[sp['name_en']] = {
            'level': sp['level'],
            'description_en': sp['description_en'],
        }
order = sorted(to_translate.keys(), key=lambda k: (to_translate[k]['level'], k))
total_chars = sum(len(to_translate[k]['description_en']) for k in order)
print(f'Da tradurre: {len(order)} (caratteri totali: {total_chars:,})')
for lvl in target_levels:
    cnt = sum(1 for k in order if to_translate[k]['level'] == lvl)
    chars = sum(len(to_translate[k]['description_en']) for k in order if to_translate[k]['level'] == lvl)
    print(f'  L{lvl}: {cnt} spell ({chars:,} caratteri)')

# Output for one level requested via CLI: writes to UTF-8 file to avoid Windows console encoding errors
if len(sys.argv) > 1:
    lvl = int(sys.argv[1])
    out = {k: v['description_en'] for k, v in to_translate.items() if v['level'] == lvl}
    out_path = f'_to_translate_L{lvl}.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f'Scritto: {out_path} ({len(out)} spell)')
