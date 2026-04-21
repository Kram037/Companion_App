"""Parser PDF -> JSON per i talenti (Feats) D&D 5e con traduzione IT.

Estrae i dati dal PDF `risorse/talenti/talenti.pdf` (lista da aidedd.org)
e produce due file consumabili dal frontend:

- `risorse/talenti/talenti.json`     (debug human-readable)
- `js/data/feats_data.js`            (oggetto `window.FEATS_DATA`)

Pattern (replicato da `risorse/incantesimi/parse_spells.py`):
- Il nome italiano e' usato come chiave (id). `name_en` mantiene il nome originale.
- Le traduzioni IT (nome, prerequisiti, descrizione) sono lette da
  `risorse/talenti/feat_translations.json`. Se mancanti, si usa il nome
  inglese e la descrizione inglese estratta dal PDF.
- Le voci marcate "Description not available (not OGL)" nel PDF mantengono
  il summary del PDF e vengono marcate `not_ogl: True` cosi' da poter
  essere integrate in seguito da fonti come dnd5e.wikidot.com.
"""

import json
import re
from pathlib import Path
from pypdf import PdfReader

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

PDF_FILE = HERE / "talenti.pdf"
OUT_JSON = HERE / "talenti.json"
OUT_JS = ROOT / "js" / "data" / "feats_data.js"
TRANSLATIONS_FILE = HERE / "feat_translations.json"
WIKIDOT_FILE = HERE / "wikidot_descriptions.json"

# Fonti note (riga finale di ciascun blocco talento). Anche se nel PDF
# l'apostrofo viene reso come carattere sostitutivo "\ufffd" (mojibake),
# la pagina resta riconoscibile: facciamo match flessibile.
SOURCES = {
    "PHB":  ("Player",       "Handbook",  "Player's Handbook"),
    "XGtE": ("Xanathar",     "Everything", "Xanathar's Guide to Everything"),
    "TCoE": ("Tasha",        "Everything", "Tasha's Cauldron of Everything"),
    "MToF": ("Mordenkainen", "Foes",      "Mordenkainen's Tome of Foes"),
    "ERLW": ("Eberron",      "Wildemount","Eberron: Rising from the Last War"),
    "FToD": ("Fizban",       "Dragons",   "Fizban's Treasury of Dragons"),
    # Nel PDF aidedd la fonte appare come "Glory of the Giants" (non "Bigby Presents: ...").
    "BGG":  ("Glory",        "Giants",    "Bigby Presents: Glory of the Giants"),
    "SCAG": ("Sword Coast",  "Adventurer","Sword Coast Adventurer's Guide"),
    "SCC":  ("Strixhaven",   "Curriculum","Strixhaven: A Curriculum of Chaos"),
}

NOT_OGL_MARKER = "Description not available (not OGL)"

# Footer da scartare. Nel PDF aidedd ogni pagina termina con due righe:
#   "21/04/26, 14:49 List <apos> DnD 5 Feats"
#   "https://www.aidedd.org/dnd/donsList.php X/10"
FOOTER_RES = [
    re.compile(r"^\d{1,2}/\d{1,2}/\d{2,4}.*aidedd\.org.*", re.I),
    re.compile(r"^\d{1,2}/\d{1,2}/\d{2,4}.*list.*feats?\s*$", re.I),
    re.compile(r"^https?://.*aidedd\.org.*", re.I),
]


def _is_footer(line: str) -> bool:
    s = line.strip()
    return any(rgx.match(s) for rgx in FOOTER_RES)


def normalize_text(text: str) -> str:
    """Pulizia base + correzione mojibake apostrofi/virgolette."""
    if not text:
        return text
    # Apostrofo tipografico mal codificato (single replacement char).
    text = text.replace("\ufffd", "'")
    # Sequenze multiple di replacement (mojibake double-encoded da wikidot).
    text = re.sub(r"\ufffd+", "'", text)
    # Apostrofo curvo / virgolette tipografiche -> apostrofo standard.
    text = (text
            .replace("\u2018", "'").replace("\u2019", "'")
            .replace("\u201C", '"').replace("\u201D", '"')
            .replace("\u2013", "-").replace("\u2014", "-"))
    return text


def extract_full_text() -> str:
    if not PDF_FILE.exists():
        raise SystemExit(f"PDF non trovato: {PDF_FILE}")
    reader = PdfReader(str(PDF_FILE))
    pages = []
    for p in reader.pages:
        try:
            txt = p.extract_text() or ""
        except Exception:
            txt = ""
        cleaned_lines = [
            line for line in txt.splitlines()
            if line.strip() and not _is_footer(line)
        ]
        pages.append("\n".join(cleaned_lines))
    return normalize_text("\n".join(pages))


def detect_source(line: str) -> str | None:
    """Dato un testo, restituisce lo slug fonte se la riga matcha un libro."""
    s = line.strip()
    for slug, (a, b, _full) in SOURCES.items():
        if a in s and b in s:
            return slug
    return None


def split_into_feat_blocks(full_text: str) -> list[list[str]]:
    """Divide il testo in blocchi-talento. Ogni blocco termina con una riga
    di fonte riconosciuta; il successivo inizia dalla riga successiva."""
    lines = full_text.splitlines()
    blocks = []
    cur = []
    # La prima riga del PDF e' "DnD 5 Feats" (titolo): saltala.
    if lines and lines[0].strip().lower().startswith("dnd"):
        lines = lines[1:]
    for line in lines:
        if not line.strip():
            continue
        cur.append(line)
        if detect_source(line):
            blocks.append(cur)
            cur = []
    if cur:
        # Eventuale residuo (di solito solo footer gia' filtrato).
        blocks.append(cur)
    return blocks


def parse_block(block: list[str]) -> dict | None:
    """Parsa un blocco-talento in un dict strutturato."""
    if not block:
        return None
    # Ultima riga = fonte.
    src_line = block[-1].strip()
    src_slug = detect_source(src_line)
    if not src_slug:
        return None
    src_full = SOURCES[src_slug][2]

    # Prima riga = nome.
    name_en = block[0].strip()
    body = block[1:-1]

    # Eventuale prerequisito sulla seconda riga (se inizia con "Prerequisite:").
    prereq = None
    if body and body[0].strip().lower().startswith("prerequisite"):
        prereq_line = body[0].strip()
        # "Prerequisite: ..." -> ...
        prereq = re.sub(r"^prerequisite[:\-\s]*", "", prereq_line, flags=re.I).strip()
        body = body[1:]

    # Descrizione.
    desc = " ".join(line.strip() for line in body if line.strip())
    desc = re.sub(r"\s+", " ", desc).strip()

    not_ogl = NOT_OGL_MARKER in desc
    if not_ogl:
        # "Description not available (not OGL). But here is a summary: <summary>"
        desc = re.sub(r"^.*?But here is a summary:\s*", "", desc, flags=re.I).strip()
        if not desc:
            desc = "(testo non disponibile per restrizioni OGL - verificare manuale ufficiale)"

    return {
        "name_en": name_en,
        "prerequisites_en": prereq,
        "description_en": desc,
        "source": src_full,
        "source_short": src_slug,
        "not_ogl": not_ogl,
    }


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_")


def build_feats(translations: dict, wikidot: dict) -> dict:
    full = extract_full_text()
    blocks = split_into_feat_blocks(full)

    feats = {}
    for block in blocks:
        parsed = parse_block(block)
        if not parsed:
            continue
        en = parsed["name_en"]
        tr = translations.get(en, {})

        # Per le voci not_ogl, sostituisci il summary del PDF con la
        # descrizione completa di wikidot, se trovata.
        wd = wikidot.get(en) or {}
        wd_desc = normalize_text(wd.get("description_en") or "")
        wd_prereq = normalize_text(wd.get("prerequisites_en") or "")

        if parsed["not_ogl"] and wd_desc:
            description_en = wd_desc
            had_wikidot = True
        else:
            description_en = parsed["description_en"]
            had_wikidot = False

        prereq_en = parsed["prerequisites_en"] or wd_prereq or None

        name_it = tr.get("name") or en
        desc_it = tr.get("description") or description_en
        prereq_it = tr.get("prerequisites") or prereq_en

        feats[name_it] = {
            "name": name_it,
            "name_en": en,
            "slug": slugify(en),
            "source": parsed["source"],
            "source_short": parsed["source_short"],
            "prerequisites": prereq_it,
            "prerequisites_en": prereq_en,
            "description": desc_it,
            "description_en": description_en,
            "not_ogl": parsed["not_ogl"],
            "wikidot_filled": had_wikidot,
            "translated": bool(tr.get("description")),
        }
    return feats


def write_outputs(feats: dict) -> None:
    # JSON sorgente human-readable, ordinato alfabeticamente per nome IT.
    ordered = dict(sorted(feats.items(), key=lambda kv: kv[0].lower()))
    OUT_JSON.write_text(
        json.dumps(ordered, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    # JS payload per il browser.
    js_payload = json.dumps(ordered, ensure_ascii=False, indent=2)
    js_text = (
        "// AUTOGENERATO da risorse/talenti/parse_feats.py - non modificare a mano.\n"
        "// Per arricchire le traduzioni IT modifica risorse/talenti/feat_translations.json\n"
        "// e ri-esegui `python risorse/talenti/parse_feats.py`.\n"
        f"window.FEATS_DATA = Object.assign(window.FEATS_DATA || {{}}, {js_payload});\n"
    )
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text(js_text, encoding="utf-8")


def main() -> None:
    translations = {}
    if TRANSLATIONS_FILE.exists():
        translations = json.loads(TRANSLATIONS_FILE.read_text(encoding="utf-8"))
        translations = {k: v for k, v in translations.items() if not k.startswith("_")}

    wikidot = {}
    if WIKIDOT_FILE.exists():
        wikidot = json.loads(WIKIDOT_FILE.read_text(encoding="utf-8"))

    feats = build_feats(translations, wikidot)

    # Stats utili in console.
    total = len(feats)
    translated = sum(1 for f in feats.values() if f["translated"])
    not_ogl = sum(1 for f in feats.values() if f["not_ogl"])
    wd_filled = sum(1 for f in feats.values() if f.get("wikidot_filled"))
    print(f"Talenti trovati:        {total}")
    print(f"Con traduzione IT:      {translated}/{total}")
    print(f"Marcati not_ogl:        {not_ogl}")
    print(f"Riempiti da wikidot:    {wd_filled}/{not_ogl}")

    write_outputs(feats)
    print(f"\nScritto: {OUT_JSON.relative_to(ROOT)}")
    print(f"Scritto: {OUT_JS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
