# -*- coding: utf-8 -*-
"""
Estrae dal PDF 'oggetti magici.pdf' una lista JSON di oggetti magici
con campi allineati a laboratorio.js (tipo, rarita, sintonia, ecc.).
Uso: python extract_pdf_to_json.py
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    raise SystemExit("Installa pypdf: pip install pypdf")

ROOT = Path(__file__).resolve().parent
PDF_PATH = ROOT / "oggetti magici.pdf"
OUT_JSON = ROOT / "oggetti_magici.json"

# Riga che inizia un blocco "tipo + rarità" (inglese, come nel PDF aidedd).
TYPE_LINE_START = re.compile(
    r"^(Weapon|Armor|Wondrous item|Ring|Staff|Wand|Rod|Potion|Scroll|Ammunition)\b",
    re.I,
)

# Rarità nella riga header (anche spezzata su più righe).
RARITY_TOKENS = re.compile(
    r"\b(common|uncommon|rare|very\s+rare|legendary|artifact|rarity\s+varies)\b",
    re.I,
)

FOOTER_PATTERNS = [
    re.compile(r"^\d{2}/\d{2}/\d{2}.*aidedd", re.I),
    re.compile(r"^https?://www\.aidedd\.org", re.I),
    re.compile(r"^DnD 5 Magic Items\s*$", re.I),
    re.compile(r"^List\s", re.I),
    re.compile(r"/\d+\s*$"),  # ... 68/71
]

TIPO_MAP = {
    "weapon": "Arma",
    "armor": "Armatura",
    "ammunition": "Arma",
    "wondrous item": "Oggetto Meraviglioso",
    "ring": "Anello",
    "staff": "Bastone",
    "wand": "Bacchetta",
    "rod": "Asta",
    "potion": "Pozione",
    "scroll": "Pergamena",
}

RARITA_MAP = {
    "common": "Comune",
    "uncommon": "Non Comune",
    "rare": "Raro",
    "very rare": "Molto Raro",
    "legendary": "Leggendario",
    "artifact": "Artefatto",
    "rarity varies": "Leggendario",  # placeholder; DM choice
}

# Il PDF unisce spesso header e descrizione sulla stessa riga (es. "uncommon This suit...").
_DESC_AFTER_CLOSE = re.compile(
    r"\)\s+("
    r"This |While |You |Held |Held in|It |If |When |The |Description not|But here|"
    r"Sloshing |Your |Each |Once |All |Dungeon |There |Any |One |Sentience\.|Personality\.|"
    r"You can|You gain|You have|An animal|Liquid |A fine|This item|Apparatus |"
    r"Thrown |Shock |Supernatural |Whelm |Wave zealously"
    r")",
    re.I,
)
_DESC_AFTER_RARITY_COMMA = re.compile(
    r",\s*(common|uncommon|rare|very rare|legendary|artifact|rarity varies)"
    r"(?:\s*\([^)]*\))?\s+("
    r"This |While |You |Held |It |If |When |The |Description not|Sloshing |Your |"
    r"A |An |You can|You gain|You have|All |Each |Once |Liquid |Ammunition |"
    r"While holding|While wearing|While you"
    r")",
    re.I,
)


def reflow_pdf_text(text: str) -> str:
    """Inserisce newline tra header oggetto e testo descrittivo (layout PDF compresso)."""
    t = text.replace("\u2019", "'").replace("\u00b4", "'").replace("\ufffd", "'")
    # Ripeti finché non ci sono più fusioni evidenti (attunement lungo + Held...).
    for _ in range(8):
        t2 = _DESC_AFTER_CLOSE.sub(r")\n\1", t)
        t2 = _DESC_AFTER_RARITY_COMMA.sub(r", \1\n\2", t2)
        if t2 == t:
            break
        t = t2
    return t


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = s.encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s or "item"


def strip_footers(lines: list[str]) -> list[str]:
    out = []
    for ln in lines:
        t = ln.strip()
        if not t:
            out.append("")
            continue
        if any(p.search(t) for p in FOOTER_PATTERNS):
            continue
        out.append(ln.rstrip())
    return out


def first_tipo_word(header: str) -> str:
    m = TYPE_LINE_START.match(header.strip())
    if not m:
        return ""
    return m.group(1).lower()


def normalize_tipo(raw: str) -> str:
    w = first_tipo_word(raw)
    if w == "ammunition":
        return "Arma"
    return TIPO_MAP.get(w, "Oggetto Meraviglioso")


def extract_subtype(header: str) -> str:
    """Parentesi dopo Weapon/Armor/... : (greataxe) -> greataxe"""
    h = header.strip()
    m = re.match(
        r"^(?:Weapon|Armor|Wondrous item|Ring|Staff|Wand|Rod|Potion|Scroll|Ammunition)\s*\(([^)]+)\)",
        h,
        re.I,
    )
    if m:
        return m.group(1).strip()
    # Wondrous item (tattoo)
    m2 = re.match(r"^Wondrous item\s*\(([^)]+)\)", h, re.I)
    if m2:
        return m2.group(1).strip()
    return ""


def parse_rarity_and_attune(header: str) -> tuple[str, bool, str, int]:
    """
    Restituisce (rarita_it, richiede_sintonia, dettaglio_sintonia, incantamento).
    Gestisce 'uncommon (+1) rare (+2)' prendendo la prima rarità e incantamento da arma/armatura/scudo.
    """
    low = header.lower()
    richiede = "requires attunement" in low or "attunement by" in low
    det = ""
    ma = re.search(
        r"requires attunement(?:\s+by\s+(.+?))?(?:\)|$|,)",
        header,
        re.I | re.DOTALL,
    )
    if ma and ma.group(1):
        det = ma.group(1).strip().rstrip(")")
    elif richiede:
        m2 = re.search(r"requires attunement\s+(.+)$", header, re.I | re.DOTALL)
        if m2:
            det = m2.group(1).strip().rstrip(")")

    inc = 0
    for n in (3, 2, 1):
        if re.search(rf"\b\+\s*{n}\b", header) and first_tipo_word(header) in (
            "weapon",
            "armor",
            "ammunition",
        ):
            inc = n
            break

    # Prima occorrenza di rarità testuale.
    rar_en = ""
    for m in RARITY_TOKENS.finditer(low):
        rar_en = m.group(1).lower()
        break
    if not rar_en:
        rar_it = "Comune"
    else:
        rar_it = RARITA_MAP.get(rar_en.replace("  ", " "), "Comune")
    return rar_it, richiede, det, inc


def header_complete(buf: str) -> bool:
    """True se l'header contiene già una parola di rarità e le parentesi sono bilanciate."""
    if not RARITY_TOKENS.search(buf):
        return False
    return buf.count("(") <= buf.count(")")


def _is_desc_start_line(s: str) -> bool:
    """Prima riga del corpo descrittivo (inglese) dopo header completo."""
    if not s:
        return False
    if s[0].islower():
        return False
    prefixes = (
        "This ",
        "While ",
        "You ",
        "The ",
        "If ",
        "When ",
        "It ",
        "Held ",
        "Held in",
        "Description ",
        "Sloshing ",
        "Your ",
        "Each ",
        "Once ",
        "All ",
        "But ",
        "An ",
        "Sentience.",
        "Personality.",
        "Thrown ",
        "Shock ",
        "Supernatural ",
        "Apparatus ",
        "One ",
        "There ",
        "Dungeon ",
        "Any ",
        "Each time",
        "In addition",
        "Curse",
        "Proficiency",
    )
    if s.startswith(prefixes):
        return True
    if s.startswith("A ") and len(s) > 2 and s[2].isupper():
        return True
    return False


def _post_process_item_fields(item: dict) -> None:
    """Completa sintonia / bonus da descrizione se l'header PDF era troncato."""
    d = item.get("descrizione") or ""
    low = d.lower()
    if not item.get("richiede_sintonia"):
        if (
            "requires attunement" in low
            or "(requires attunement)" in low
            or " attune to" in low
            or " attuned to" in low
            or "while attuned" in low
        ):
            item["richiede_sintonia"] = True
    if item.get("tipo") in ("Arma", "Armatura", "Scudo", "Focus") and not item.get("incantamento"):
        for n in (3, 2, 1):
            if re.search(rf"\+{n}\s+bonus", d, re.I):
                item["incantamento"] = n
                break


def extract_items(text: str) -> list[dict]:
    raw_lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    lines = strip_footers(raw_lines)
    items: list[dict] = []
    i = 0
    n = len(lines)

    while i < n:
        line = lines[i].strip()
        if not TYPE_LINE_START.match(line):
            i += 1
            continue
        # Nome: prima riga non vuota sopra
        j = i - 1
        name = ""
        while j >= 0:
            t = lines[j].strip()
            if t:
                name = t
                break
            j -= 1
        if not name or name == "DnD 5 Magic Items":
            i += 1
            continue

        # Unisci righe header (attunement spezzato su più righe).
        header_parts = [lines[i].strip()]
        k = i + 1
        while k < n:
            nxt = lines[k].strip()
            if not nxt:
                if header_complete(" ".join(header_parts)):
                    k += 1
                    while k < n and not lines[k].strip():
                        k += 1
                    break
                k += 1
                continue
            if TYPE_LINE_START.match(nxt):
                break
            # Nuovo oggetto: riga nome + riga tipo
            if k + 1 < n and TYPE_LINE_START.match(lines[k + 1].strip()):
                break
            joined_prev = " ".join(header_parts)
            if header_complete(joined_prev) and _is_desc_start_line(nxt):
                break
            header_parts.append(nxt)
            joined = " ".join(header_parts)
            if header_complete(joined) and k + 1 < n:
                peek = lines[k + 1].strip()
                if peek and not TYPE_LINE_START.match(peek):
                    if peek[0].isupper() and len(peek) < 60 and not peek.startswith(
                        ("While ", "You ", "This ", "The ", "If ", "When ", "Each ", "Any ", "All ")
                    ):
                        break
            k += 1

        header = " ".join(header_parts)
        # Descrizione fino al prossimo (nome, tipo) o fine.
        desc_lines: list[str] = []
        m = k
        while m < n:
            cur = lines[m].strip()
            if cur and m + 1 < n:
                n2 = lines[m + 1].strip()
                if n2 and TYPE_LINE_START.match(n2):
                    break
            desc_lines.append(lines[m])
            m += 1

        while desc_lines and not desc_lines[-1].strip():
            desc_lines.pop()
        while desc_lines and not desc_lines[0].strip():
            desc_lines.pop(0)
        descrizione = "\n".join(desc_lines).strip()

        tipo = normalize_tipo(header)
        sotto = extract_subtype(header)
        rarita, rs, sdet, inc = parse_rarity_and_attune(header)
        if tipo not in ("Arma", "Armatura", "Scudo", "Focus"):
            inc = 0

        row = {
            "id": slugify(name),
            "nome": name,
            "tipo": tipo,
            "sotto_tipo": sotto,
            "rarita": rarita,
            "richiede_sintonia": rs,
            "sintonia_dettaglio": sdet,
            "incantamento": inc,
            "descrizione": descrizione,
        }
        _post_process_item_fields(row)
        items.append(row)
        i = m

    # Dedupe per id mantenendo ordine
    seen: set[str] = set()
    uniq: list[dict] = []
    for it in items:
        if it["id"] in seen:
            continue
        seen.add(it["id"])
        uniq.append(it)
    return uniq


def _is_valid_item_name(name: str) -> bool:
    if not name or len(name) < 2:
        return False
    low = name.lower()
    if low.startswith("but here"):
        return False
    if low in ("liquid max amount", "lever up down"):
        return False
    if low.startswith(("the weapon also", "each ", "personality.", "sentience.", "lever ")):
        return False
    return True


def main() -> None:
    if not PDF_PATH.is_file():
        raise SystemExit(f"Manca il PDF: {PDF_PATH}")

    reader = PdfReader(str(PDF_PATH))
    full = []
    for page in reader.pages:
        full.append(page.extract_text() or "")
    text = reflow_pdf_text("\n".join(full))

    items = [it for it in extract_items(text) if _is_valid_item_name(it["nome"])]
    payload = {
        "meta": {
            "lingua": "en",
            "fonte_pdf": PDF_PATH.name,
            "count": len(items),
            "nota": "Testo estratto dal PDF (aidedd-style); tipi e rarità mappati ai valori italiani del Laboratorio.",
        },
        "items": items,
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Scritti {len(items)} oggetti in {OUT_JSON}")


if __name__ == "__main__":
    main()
