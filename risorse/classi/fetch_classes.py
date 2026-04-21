"""
Scarica le 12 classi base D&D 5e dall'API open5e e produce:
  - risorse/classi/classes.json   (debug, leggibile)
  - js/data/classes_data.js       (consumato dal frontend)

Per ogni classe estrae:
  - meta (dadi vita, competenze armi/armature/abilità/tiri salvezza, equipment)
  - level_table (tabella livelli parsata)
  - features (privilegi parsati dal markdown desc, ognuno con livello)
  - subclasses (archetipi) con le loro features

Le traduzioni IT (override) sono in risorse/classi/class_translations.json
e vengono fuse in fase di build.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

API_URL = "https://api.open5e.com/v1/classes/?limit=20"
ROOT = Path(__file__).resolve().parent.parent.parent  # repo root
OUT_JSON = ROOT / "risorse" / "classi" / "classes.json"
OUT_JS = ROOT / "js" / "data" / "classes_data.js"
TRANSLATIONS = ROOT / "risorse" / "classi" / "class_translations.json"
EXTRA_CLASSES = ROOT / "risorse" / "classi" / "extra_classes.json"

# ─────────────────────────────────────────────────────────────────────────
# Fetch
# ─────────────────────────────────────────────────────────────────────────
def fetch_classes() -> list[dict]:
    print(f"Scarico classi da {API_URL} ...")
    req = urllib.request.Request(API_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["results"]


# ─────────────────────────────────────────────────────────────────────────
# Markdown parsing
# ─────────────────────────────────────────────────────────────────────────
HEADING_ANY_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)


def split_features(md: str, depth: int = 3) -> list[tuple[str, str]]:
    """Spezza un markdown sui titoli del livello indicato e restituisce
    [(name, description)]. Le classi (open5e) usano ### (depth=3),
    le sottoclassi usano ##### (depth=5)."""
    if not md:
        return []
    headings = list(HEADING_ANY_RE.finditer(md))
    if not headings:
        return []
    out: list[tuple[str, str]] = []
    for i, h in enumerate(headings):
        if len(h.group(1)) != depth:
            continue
        name = h.group(2).strip()
        start = h.end()
        end = len(md)
        for h2 in headings[i + 1:]:
            if len(h2.group(1)) <= depth:
                end = h2.start()
                break
        body = md[start:end].strip()
        out.append((name, body))
    return out


# ─────────────────────────────────────────────────────────────────────────
# Level table parsing
# ─────────────────────────────────────────────────────────────────────────
LEVEL_ORDINAL_RE = re.compile(r"^(\d+)(st|nd|rd|th)$", re.IGNORECASE)


def parse_level_table(md: str) -> list[dict]:
    """Parsa una tabella markdown in lista di dict {col: val}."""
    if not md:
        return []
    lines = [l.strip() for l in md.splitlines() if l.strip().startswith("|")]
    if len(lines) < 2:
        return []

    def row(line: str) -> list[str]:
        parts = [p.strip() for p in line.strip("|").split("|")]
        return parts

    headers = [h.strip() for h in row(lines[0])]
    out: list[dict] = []
    for line in lines[2:]:  # skip separator
        cells = row(line)
        if len(cells) != len(headers):
            continue
        rec: dict = {}
        for h, v in zip(headers, cells):
            rec[h] = v
        # normalizza Level
        lvl_raw = rec.get("Level") or rec.get("level") or ""
        m = LEVEL_ORDINAL_RE.match(lvl_raw)
        if m:
            rec["_level"] = int(m.group(1))
        out.append(rec)
    return out


def features_at_level(level_row: dict) -> list[str]:
    feats = level_row.get("Features") or level_row.get("features") or ""
    if not feats or feats in ("—", "-"):
        return []
    return [f.strip() for f in feats.split(",") if f.strip()]


# ─────────────────────────────────────────────────────────────────────────
# Feature -> level matching
# ─────────────────────────────────────────────────────────────────────────
def normalize(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def assign_levels(features: list[tuple[str, str]], table: list[dict]) -> list[dict]:
    """Associa a ogni feature il livello in cui compare nella tabella."""
    # mappa nome_normalizzato -> livello (prima occorrenza)
    name_to_level: dict[str, int] = {}
    for row in table:
        lvl = row.get("_level")
        if not lvl:
            continue
        for fname in features_at_level(row):
            key = normalize(fname)
            if key and key not in name_to_level:
                name_to_level[key] = lvl

    out = []
    for name, desc in features:
        key = normalize(name)
        # match esatto
        lvl = name_to_level.get(key)
        # match parziale (es. "Brutal Critical (1 die)" vs "Brutal Critical")
        if lvl is None:
            for k, v in name_to_level.items():
                if k.startswith(key) or key.startswith(k):
                    lvl = v
                    break
        out.append({"name_en": name, "level": lvl, "description_en": desc})
    return out


# ─────────────────────────────────────────────────────────────────────────
# Translations
# ─────────────────────────────────────────────────────────────────────────
def load_translations() -> dict:
    if not TRANSLATIONS.exists():
        return {}
    return json.loads(TRANSLATIONS.read_text(encoding="utf-8"))


def apply_translations(cls: dict, tr: dict) -> dict:
    """Applica gli override IT a una classe parsata."""
    slug = cls["slug"]
    cls_tr = (tr.get("classes", {}) or {}).get(slug, {}) or {}
    cls["name"] = cls_tr.get("name", cls.get("name_en", ""))
    # descrizione/competenze: per ora lasciamo in inglese, override opzionale
    for fld in ("hit_dice", "prof_armor", "prof_weapons", "prof_tools",
                "prof_saving_throws", "prof_skills", "equipment",
                "spellcasting_ability"):
        cls[fld] = cls_tr.get(fld, cls.get(f"{fld}_en", ""))

    feat_tr = (cls_tr.get("features") or {})
    for f in cls["features"]:
        t = feat_tr.get(f["name_en"], {})
        f["name"] = t.get("name", f["name_en"])
        f["description"] = t.get("description", "")
        f["translated"] = bool(t.get("description"))

    sub_tr = (cls_tr.get("subclasses") or {})
    for sc in cls["subclasses"]:
        st = sub_tr.get(sc["slug"], {}) or {}
        sc["name"] = st.get("name", sc["name_en"])
        sc_feat_tr = (st.get("features") or {})
        for f in sc["features"]:
            t = sc_feat_tr.get(f["name_en"], {})
            f["name"] = t.get("name", f["name_en"])
            f["description"] = t.get("description", "")
            f["translated"] = bool(t.get("description"))
    return cls


# ─────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────
# Nomi di "sezioni separatrici" che non sono vere feature, ma intestazioni
# che introducono l'elenco delle sottoclassi (plurali) oppure sotto-sezioni
# della Spellcasting che vengono indebitamente promosse al livello h3
_FAKE_FEATURE_NAMES = {
    "Spellcasting Ability", "Ritual Casting", "Spellcasting Focus",
    "Cantrips",
}


def _filter_fake_features(features: list[dict]) -> list[dict]:
    """Rimuove le features che sono in realta' sezioni separatrici (plurali
    di un'altra feature, es. 'Martial Archetypes' quando esiste 'Martial
    Archetype'), sotto-sezioni note della Spellcasting, o duplicati (stessa
    feature ripetuta come sezione 'Prerequisites' o simili)."""
    names = {f["name_en"] for f in features}
    out = []
    seen_names: set[str] = set()
    for f in features:
        n = f["name_en"]
        if n in _FAKE_FEATURE_NAMES:
            continue
        if n.endswith("s") and n[:-1] in names:
            continue
        if n in seen_names:
            continue
        seen_names.add(n)
        out.append(f)
    return out


def parse_class(raw: dict) -> dict:
    table = parse_level_table(raw.get("table", ""))
    features = split_features(raw.get("desc", ""))
    feats_with_lvl = assign_levels(features, table)
    feats_with_lvl = _filter_fake_features(feats_with_lvl)

    subclasses = []
    for arc in raw.get("archetypes", []) or []:
        # tieni solo le sottoclassi del manuale base (SRD)
        if (arc.get("document__slug") or "").lower() != "wotc-srd":
            continue
        arc_feats_raw = split_features(arc.get("desc", ""), depth=5)
        # le sottoclassi non hanno tabella propria: livello determinato da regex
        # nella descrizione (es. "Starting at 3rd level...")
        arc_feats = []
        for name, desc in arc_feats_raw:
            lvl = guess_level_from_text(desc)
            arc_feats.append({
                "name_en": name, "level": lvl, "description_en": desc
            })
        subclasses.append({
            "slug": arc["slug"],
            "name_en": arc["name"],
            "features": arc_feats,
        })

    return {
        "slug": raw["slug"],
        "name_en": raw["name"],
        "hit_dice_en": raw.get("hit_dice", ""),
        "prof_armor_en": raw.get("prof_armor", ""),
        "prof_weapons_en": raw.get("prof_weapons", ""),
        "prof_tools_en": raw.get("prof_tools", ""),
        "prof_saving_throws_en": raw.get("prof_saving_throws", ""),
        "prof_skills_en": raw.get("prof_skills", ""),
        "equipment_en": raw.get("equipment", ""),
        "spellcasting_ability_en": raw.get("spellcasting_ability", ""),
        "level_table": table,
        "features": feats_with_lvl,
        "subclasses": subclasses,
    }


LEVEL_TEXT_RE = re.compile(
    r"\b(?:at|starting at|beginning at|when you reach)\s+(\d+)(st|nd|rd|th)\s+level",
    re.IGNORECASE,
)


def guess_level_from_text(desc: str) -> int | None:
    if not desc:
        return None
    m = LEVEL_TEXT_RE.search(desc)
    if m:
        return int(m.group(1))
    # fallback: prima occorrenza generica "Nth level"
    m2 = re.search(r"\b(\d+)(st|nd|rd|th)\s+level\b", desc, re.IGNORECASE)
    if m2:
        return int(m2.group(1))
    return None


def load_extra_classes() -> dict:
    """Carica classi/sottoclassi extra non presenti nel SRD Open5e."""
    if not EXTRA_CLASSES.exists():
        return {"classes": [], "extra_subclasses": {}}
    return json.loads(EXTRA_CLASSES.read_text(encoding="utf-8"))


def merge_extras(parsed: list[dict], extras: dict) -> list[dict]:
    """Aggiunge le classi extra (es. Artefice) e fonde le sottoclassi extra
    nelle classi gia' presenti."""
    extra_subs = extras.get("extra_subclasses", {}) or {}
    for cls in parsed:
        slug = cls["slug"]
        for sub in extra_subs.get(slug, []) or []:
            cls["subclasses"].append(sub)

    out = list(parsed)
    existing_slugs = {c["slug"] for c in parsed}
    for extra_cls in extras.get("classes", []) or []:
        if extra_cls["slug"] in existing_slugs:
            continue
        out.append(extra_cls)
    out.sort(key=lambda c: c.get("name", c["slug"]).lower())
    return out


def main() -> int:
    raw_classes = fetch_classes()
    tr = load_translations()
    parsed = []
    for raw in raw_classes:
        cls = parse_class(raw)
        cls = apply_translations(cls, tr)
        parsed.append(cls)

    extras = load_extra_classes()
    parsed = merge_extras(parsed, extras)

    for cls in parsed:
        translated = sum(1 for f in cls["features"] if f.get("translated"))
        print(
            f"  {cls['slug']:<14} - {len(cls['features']):>3} feat "
            f"({translated} IT) - {len(cls['subclasses'])} sottoclassi"
        )

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(
        json.dumps(parsed, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text(
        "// Auto-generato da risorse/classi/fetch_classes.py - non modificare a mano\n"
        "window.CLASSES_DATA = " + json.dumps(parsed, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    print(f"Scritto: {OUT_JSON.relative_to(ROOT)}")
    print(f"Scritto: {OUT_JS.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
