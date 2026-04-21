"""Estrae descrizioni features di classi/sottoclassi non tradotte."""
import json
import sys
from pathlib import Path

DATA = json.load(open("risorse/classi/classes.json", encoding="utf-8"))


def collect():
    out = {}
    for cls in DATA:
        slug = cls["slug"]
        for f in cls.get("features", []):
            if not f.get("translated") and f.get("description_en"):
                out[f"{slug}::{f['name_en']}"] = {
                    "kind": "feature",
                    "class": slug,
                    "class_name": cls.get("name", cls.get("name_en")),
                    "name_en": f["name_en"],
                    "name_it": f.get("name", f["name_en"]),
                    "level": f.get("level"),
                    "description_en": f["description_en"],
                }
        for sub in cls.get("subclasses", []):
            sub_slug = sub["slug"]
            for f in sub.get("features", []):
                if not f.get("translated") and f.get("description_en"):
                    out[f"{slug}::sub::{sub_slug}::{f['name_en']}"] = {
                        "kind": "subclass_feature",
                        "class": slug,
                        "class_name": cls.get("name", cls.get("name_en")),
                        "subclass": sub_slug,
                        "subclass_name": sub.get("name", sub.get("name_en")),
                        "name_en": f["name_en"],
                        "name_it": f.get("name", f["name_en"]),
                        "level": f.get("level"),
                        "description_en": f["description_en"],
                    }
    return out


def main() -> int:
    items = collect()
    total_chars = sum(len(v["description_en"]) for v in items.values())
    print(f"Da tradurre: {len(items)} features (caratteri totali: {total_chars:,})")

    by_class: dict[str, int] = {}
    for v in items.values():
        by_class.setdefault(v["class"], 0)
        by_class[v["class"]] += 1
    for cls_slug, n in sorted(by_class.items()):
        print(f"  {cls_slug:<14} {n:>3} feat")

    if len(sys.argv) > 1:
        # Estrai per una specifica classe (incluse le sottoclassi)
        target = sys.argv[1]
        out = {k: v for k, v in items.items() if v["class"] == target}
        out_path = Path(f"_to_translate_class_{target}.json")
        with open(out_path, "w", encoding="utf-8") as fp:
            json.dump(out, fp, ensure_ascii=False, indent=2)
        print(f"\nScritto: {out_path} ({len(out)} feat)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
