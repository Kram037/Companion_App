#!/usr/bin/env python3
"""Audit helper for compendium feature data.

The script reports likely data quality issues without embedding manual text:
- missing Italian descriptions
- leftover English fragments in Italian fields
- English spell names still present in Italian descriptions
- subclass spell-grant features that are duplicated by subclass spell tables

Run from the repository root:
    python risorse/audit_compendium_data.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
RISORSE = ROOT / "risorse"

CLASS_DATA = RISORSE / "classi" / "classes.json"
RACE_DATA = RISORSE / "razze" / "razze.json"
SPELL_DATA = RISORSE / "incantesimi" / "spells.json"
SUBCLASS_SPELLS = RISORSE / "classi" / "subclass_spells.json"
REPORT_PATH = RISORSE / "audit_compendium_data.md"

ENGLISH_RESIDUE_RE = re.compile(
    r"\b("
    r"starting|beginning|when you|you can|you gain|you have|choose|until|"
    r"short rest|long rest|saving throw|ability check|spell slot|cantrip|"
    r"feet|within|bonus action|reaction|action|damage|target"
    r")\b",
    re.IGNORECASE,
)

GRANTED_SPELL_FEATURE_RE = re.compile(
    r"\b("
    r"domain spells|oath spells|circle spells|expanded spell list|"
    r"psionic spells|clockwork magic|artificer spells|alchemist spells|"
    r"armorer spells|artillerist spells|battle smith spells"
    r")\b|"
    r"incantesimi (del|della|dello|dei|degli|delle|da|dell'|psionici|estesa|ampliata)|"
    r"lista .*incantesimi|magia dell'orologeria",
    re.IGNORECASE,
)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def text(value: Any) -> str:
    return str(value or "").strip()


def feature_label(owner: str, feature: dict[str, Any]) -> str:
    level = feature.get("level")
    suffix = f" lv {level}" if level else ""
    name = text(feature.get("name") or feature.get("name_en") or "Senza nome")
    return f"{owner} - {name}{suffix}"


def has_subclass_spell_table(table: dict[str, Any], class_slug: str, subclass_slug: str) -> bool:
    subclass_table = table.get(class_slug, {}).get(subclass_slug)
    if not isinstance(subclass_table, dict):
        return False
    for level, spells in subclass_table.items():
        if str(level).startswith("_"):
            continue
        if isinstance(spells, list) and any(spells):
            return True
    for by_level in subclass_table.get("_variants", {}).values():
        if isinstance(by_level, dict) and any(isinstance(spells, list) and any(spells) for spells in by_level.values()):
            return True
    return False


def iter_class_features(classes: list[dict[str, Any]]) -> Iterable[tuple[str, str, str, dict[str, Any], str, str]]:
    for cls in classes:
        class_slug = text(cls.get("slug"))
        class_name = text(cls.get("name") or cls.get("name_en") or class_slug)
        for feature in cls.get("features", []):
            yield "classe", class_name, class_slug, feature, class_slug, ""
        for subclass in cls.get("subclasses", []):
            subclass_slug = text(subclass.get("slug"))
            subclass_name = text(subclass.get("name") or subclass.get("name_en") or subclass_slug)
            owner = f"{class_name} / {subclass_name}"
            for feature in subclass.get("features", []):
                yield "sottoclasse", owner, class_slug, feature, class_slug, subclass_slug


def iter_race_traits(node: Any, owner: str = "") -> Iterable[tuple[str, dict[str, Any]]]:
    if isinstance(node, dict):
        name = text(node.get("name") or node.get("name_en") or owner)
        current_owner = name or owner
        if "description" in node and ("name" in node or "name_en" in node):
            yield current_owner, node
        for key in ("traits", "subraces", "versions"):
            for child in node.get(key, []) if isinstance(node.get(key), list) else []:
                yield from iter_race_traits(child, current_owner)
    elif isinstance(node, list):
        for child in node:
            yield from iter_race_traits(child, owner)


def build_spell_english_names(spells: dict[str, Any]) -> list[str]:
    names = set()
    for spell in spells.values():
        name = text(spell.get("name_en"))
        if name and len(name) >= 4:
            names.add(name)
    return sorted(names, key=len, reverse=True)


def find_english_spell_names(description: str, names: list[str]) -> list[str]:
    hits: list[str] = []
    for name in names:
        if re.search(rf"(^|[^A-Za-z]){re.escape(name)}(?=$|[^A-Za-z])", description):
            hits.append(name)
            if len(hits) >= 8:
                break
    return hits


def audit() -> list[str]:
    classes = load_json(CLASS_DATA)
    races = load_json(RACE_DATA)
    spells = load_json(SPELL_DATA)
    subclass_spells = load_json(SUBCLASS_SPELLS)
    spell_names_en = build_spell_english_names(spells)

    missing: list[str] = []
    english_residue: list[str] = []
    english_spell_names: list[str] = []
    duplicate_spell_features: list[str] = []

    for kind, owner, _owner_slug, feature, class_slug, subclass_slug in iter_class_features(classes):
        label = feature_label(owner, feature)
        description = text(feature.get("description"))
        if not description:
            missing.append(f"{kind}: {label}")
        if description and ENGLISH_RESIDUE_RE.search(description):
            english_residue.append(f"{kind}: {label}")
        hits = find_english_spell_names(description, spell_names_en)
        if hits:
            english_spell_names.append(f"{kind}: {label} -> {', '.join(hits)}")
        if subclass_slug and has_subclass_spell_table(subclass_spells, class_slug, subclass_slug):
            if GRANTED_SPELL_FEATURE_RE.search(text(feature.get("name")) + " " + text(feature.get("name_en"))):
                duplicate_spell_features.append(f"{kind}: {label}")

    for race_name, trait in iter_race_traits(races):
        label = feature_label(race_name, trait)
        description = text(trait.get("description"))
        if not description:
            missing.append(f"razza: {label}")
        if description and ENGLISH_RESIDUE_RE.search(description):
            english_residue.append(f"razza: {label}")
        hits = find_english_spell_names(description, spell_names_en)
        if hits:
            english_spell_names.append(f"razza: {label} -> {', '.join(hits)}")

    lines = [
        "# Audit dati compendio",
        "",
        "Report operativo generato senza riportare testo dei manuali.",
        "",
        f"- Descrizioni mancanti: {len(missing)}",
        f"- Possibile inglese residuo: {len(english_residue)}",
        f"- Nomi inglesi di incantesimi in descrizioni IT: {len(english_spell_names)}",
        f"- Privilegi incantesimi duplicati da tabella: {len(duplicate_spell_features)}",
        "",
    ]

    sections = [
        ("Descrizioni Mancanti", missing),
        ("Possibile Inglese Residuo", english_residue),
        ("Nomi Inglesi Di Incantesimi", english_spell_names),
        ("Privilegi Incantesimi Duplicati", duplicate_spell_features),
    ]
    for title, items in sections:
        lines.append(f"## {title}")
        if items:
            lines.extend(f"- {item}" for item in items)
        else:
            lines.append("- Nessun elemento rilevato.")
        lines.append("")

    return lines


def main() -> None:
    lines = audit()
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"Report scritto in {REPORT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
