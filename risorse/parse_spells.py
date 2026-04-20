"""Parser PDF -> JSON per gli incantesimi.
Estrae i dati strutturati dal PDF in `trucchetti.pdf` e produce
`js/data/spells_cantrips.js` con un oggetto `SPELLS_DATA` pronto al consumo
dal frontend (id = nome incantesimo).
"""

import json
import re
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "risorse" / "trucchetti.pdf"
OUT_JSON = ROOT / "risorse" / "trucchetti.json"
OUT_JS = ROOT / "js" / "data" / "spells_cantrips.js"

CLASS_NAMES = {
    "Bard", "Cleric", "Druid", "Sorcerer", "Warlock", "Wizard",
    "Artificer", "Paladin", "Ranger",
}

# Italianizzazione classi
CLASS_IT = {
    "Bard": "Bardo",
    "Cleric": "Chierico",
    "Druid": "Druido",
    "Sorcerer": "Stregone",
    "Warlock": "Warlock",
    "Wizard": "Mago",
    "Artificer": "Artefice",
    "Paladin": "Paladino",
    "Ranger": "Ranger",
}

SCHOOL_IT = {
    "abjuration": "Abiurazione",
    "conjuration": "Evocazione",
    "divination": "Divinazione",
    "enchantment": "Ammaliamento",
    "evocation": "Invocazione",
    "illusion": "Illusione",
    "necromancy": "Necromanzia",
    "transmutation": "Trasmutazione",
}

LEVEL_RE = re.compile(r"^level (\d+) - (\w+)$", re.IGNORECASE)
FOOTER_DATE_RE = re.compile(r"^\d{2}/\d{2}/\d{2},\s*\d{1,2}:\d{2}\s+List")
FOOTER_URL_RE = re.compile(r"^https?://")


def clean_text(line: str) -> str:
    return line.replace("\u00b4", "'").replace("´", "'").rstrip()


def extract_lines() -> list[str]:
    reader = PdfReader(str(PDF_PATH))
    lines: list[str] = []
    for page in reader.pages:
        for raw in (page.extract_text() or "").splitlines():
            line = clean_text(raw)
            if not line:
                continue
            if line == "DnD 5 Spells":
                continue
            if FOOTER_DATE_RE.match(line) or FOOTER_URL_RE.match(line):
                continue
            lines.append(line)
    return lines


def parse_spells(lines: list[str]) -> list[dict]:
    spells: list[dict] = []
    i = 0
    n = len(lines)
    while i < n:
        m = LEVEL_RE.match(lines[i]) if i > 0 else None
        if not m:
            i += 1
            continue

        name = lines[i - 1]
        level = int(m.group(1))
        school = m.group(2).lower()

        casting_time = range_ = components = duration = ""
        j = i + 1
        for _ in range(8):
            if j >= n:
                break
            ln = lines[j]
            if ln.startswith("Casting Time:"):
                casting_time = ln.split(":", 1)[1].strip()
            elif ln.startswith("Range:"):
                range_ = ln.split(":", 1)[1].strip()
            elif ln.startswith("Components:"):
                components = ln.split(":", 1)[1].strip()
            elif ln.startswith("Duration:"):
                duration = ln.split(":", 1)[1].strip()
            else:
                break
            j += 1

        desc_lines: list[str] = []
        classes: list[str] = []
        source = ""
        while j < n:
            ln = lines[j]
            if ln in CLASS_NAMES:
                classes.append(ln)
                j += 1
                continue
            if classes:
                source = ln
                j += 1
                break
            if j + 1 < n and LEVEL_RE.match(lines[j + 1]):
                source = ""
                break
            desc_lines.append(ln)
            j += 1

        description = " ".join(desc_lines).strip()
        description = re.sub(r"\s+", " ", description)
        description = description.replace(" • ", "\n• ")

        spells.append({
            "name": name,
            "level": level,
            "school": school,
            "school_it": SCHOOL_IT.get(school, school.capitalize()),
            "casting_time": casting_time,
            "range": range_,
            "components": components,
            "duration": duration,
            "description": description,
            "classes": [CLASS_IT.get(c, c) for c in classes],
            "classes_en": classes,
            "source": source,
        })

        i = j

    return spells


def main():
    lines = extract_lines()
    spells = parse_spells(lines)
    print(f"Estratti {len(spells)} incantesimi")
    for s in spells[:3]:
        print(f"  - {s['name']} (lv{s['level']}, {s['school_it']}) -> {s['classes']}")

    OUT_JSON.write_text(
        json.dumps({s["name"]: s for s in spells}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    js_payload = json.dumps({s["name"]: s for s in spells}, ensure_ascii=False, indent=2)
    OUT_JS.write_text(
        "/* Auto-generato da risorse/parse_spells.py — non modificare a mano */\n"
        f"window.SPELLS_DATA = Object.assign(window.SPELLS_DATA || {{}}, {js_payload});\n",
        encoding="utf-8",
    )

    print(f"Scritto: {OUT_JSON.relative_to(ROOT)}")
    print(f"Scritto: {OUT_JS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
