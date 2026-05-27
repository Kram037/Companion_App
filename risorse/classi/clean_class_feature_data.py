#!/usr/bin/env python3
"""Normalize class feature data after manual audits.

This keeps the current generated class payload aligned with the source data:
- replaces English spell names inside Italian descriptions with the local IT name
- removes subclass spell-list features when the subclass spell table already exists
- rewrites js/Personaggi/data/classes_data.js from risorse/classi/classes.json
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

CLASSES_JSON = HERE / "classes.json"
CLASS_TRANSLATIONS = HERE / "class_translations.json"
EXTRA_CLASSES = HERE / "extra_classes.json"
SUBCLASS_SPELLS = HERE / "subclass_spells.json"
SPELLS_JSON = ROOT / "risorse" / "incantesimi" / "spells.json"
CLASSES_JS = ROOT / "js" / "Personaggi" / "data" / "classes_data.js"

GRANTED_SPELL_FEATURE_RE = re.compile(
    r"\b(domain spells|oath spells|circle spells|expanded spell list|"
    r"psionic spells|clockwork magic|artificer spells|alchemist spells|"
    r"armorer spells|artillerist spells|battle smith spells)\b|"
    r"incantesimi (del|della|dello|dei|degli|delle|da|dell'|psionici|estesa|ampliata)|"
    r"lista .*incantesimi|magia dell'orologeria",
    re.IGNORECASE,
)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def save_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def spell_name_pairs() -> list[tuple[re.Pattern[str], str]]:
    spells = load_json(SPELLS_JSON)
    pairs: list[tuple[str, str]] = []
    seen: set[str] = set()
    for spell in spells.values():
        en = str(spell.get("name_en") or "").strip()
        it = str(spell.get("name") or "").strip()
        if not en or not it or en.lower() == it.lower():
            continue
        key = en.lower()
        if key in seen:
            continue
        seen.add(key)
        pairs.append((en, it))
    pairs.sort(key=lambda item: len(item[0]), reverse=True)
    return [
        (re.compile(rf"(^|[^A-Za-z])({re.escape(en)})(?=$|[^A-Za-z])"), it)
        for en, it in pairs
    ]


def replace_spell_names(text: str, replacements: list[tuple[re.Pattern[str], str]]) -> str:
    out = text
    for pattern, replacement in replacements:
        out = pattern.sub(lambda match: f"{match.group(1)}{replacement}", out)
    return out


def normalize_descriptions(node: Any, replacements: list[tuple[re.Pattern[str], str]]) -> None:
    if isinstance(node, dict):
        if isinstance(node.get("description"), str):
            node["description"] = replace_spell_names(node["description"], replacements)
        for value in node.values():
            normalize_descriptions(value, replacements)
    elif isinstance(node, list):
        for item in node:
            normalize_descriptions(item, replacements)


def has_subclass_spell_table(table: dict[str, Any], class_slug: str, subclass_slug: str) -> bool:
    subclass_table = table.get(class_slug, {}).get(subclass_slug)
    if not isinstance(subclass_table, dict):
        return False
    for level, spells in subclass_table.items():
        if str(level).startswith("_"):
            continue
        if isinstance(spells, list) and any(spells):
            return True
    return any(
        isinstance(by_level, dict)
        and any(isinstance(spells, list) and any(spells) for spells in by_level.values())
        for by_level in subclass_table.get("_variants", {}).values()
    )


def is_granted_spell_feature(feature: dict[str, Any]) -> bool:
    name = f"{feature.get('name_en', '')} {feature.get('name', '')}".lower()
    if not name.strip():
        return False
    if "spellcasting" in name or "lancio di incantesimi" in name:
        return False
    return bool(GRANTED_SPELL_FEATURE_RE.search(name))


def remove_duplicate_spell_features(classes: list[dict[str, Any]], subclass_spells: dict[str, Any]) -> int:
    removed = 0
    for cls in classes:
        class_slug = str(cls.get("slug") or "")
        for sub in cls.get("subclasses", []) or []:
            subclass_slug = str(sub.get("slug") or "")
            if not has_subclass_spell_table(subclass_spells, class_slug, subclass_slug):
                continue
            before = len(sub.get("features", []))
            sub["features"] = [
                feature for feature in sub.get("features", [])
                if not is_granted_spell_feature(feature)
            ]
            removed += before - len(sub["features"])
    return removed


def rewrite_classes_js(classes: list[dict[str, Any]]) -> None:
    CLASSES_JS.write_text(
        "// Auto-generato da risorse/classi/fetch_classes.py - non modificare a mano\n"
        "window.CLASSES_DATA = " + json.dumps(classes, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )


def main() -> None:
    replacements = spell_name_pairs()
    subclass_spells = load_json(SUBCLASS_SPELLS)

    classes = load_json(CLASSES_JSON)
    translations = load_json(CLASS_TRANSLATIONS)
    extras = load_json(EXTRA_CLASSES)

    normalize_descriptions(classes, replacements)
    normalize_descriptions(translations, replacements)
    normalize_descriptions(extras, replacements)
    removed = remove_duplicate_spell_features(classes, subclass_spells)

    save_json(CLASSES_JSON, classes)
    save_json(CLASS_TRANSLATIONS, translations)
    save_json(EXTRA_CLASSES, extras)
    rewrite_classes_js(classes)

    print(f"Rimossi {removed} privilegi incantesimi duplicati.")
    print("Normalizzati i nomi inglesi degli incantesimi nelle descrizioni IT.")


if __name__ == "__main__":
    main()
