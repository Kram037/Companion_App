import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "risorse" / "mostri"
PDF_PATH = OUT_DIR / "Lista Mostri.pdf"

MONSTERS_JSON = OUT_DIR / "monsters.json"
SUMMONS_JSON = OUT_DIR / "summon_statblocks.json"
VALIDATION_JSON = OUT_DIR / "monster_validation.json"
INVENTORY_JSON = OUT_DIR / "sources_inventory.json"

MONSTERS_JS = ROOT / "js" / "Compendio" / "data" / "mostri_data.js"
SUMMONS_JS = ROOT / "js" / "Compendio" / "data" / "summon_statblocks_data.js"


SIZE_WORDS = ("tiny", "small", "medium", "large", "huge", "gargantuan")
TYPE_WORDS = (
    "aberration",
    "beast",
    "celestial",
    "construct",
    "dragon",
    "elemental",
    "fey",
    "fiend",
    "giant",
    "humanoid",
    "monstrosity",
    "ooze",
    "plant",
    "undead",
)

SIZE_IT = {
    "tiny": "Minuscolo",
    "small": "Piccolo",
    "medium": "Medio",
    "large": "Grande",
    "huge": "Enorme",
    "gargantuan": "Mastodontico",
}

TYPE_IT = {
    "aberration": "Aberrazione",
    "beast": "Bestia",
    "celestial": "Celestiale",
    "construct": "Costrutto",
    "dragon": "Drago",
    "elemental": "Elementale",
    "fey": "Folletto",
    "fiend": "Immondo",
    "giant": "Gigante",
    "humanoid": "Umanoide",
    "monstrosity": "Mostruosita",
    "ooze": "Melma",
    "plant": "Pianta",
    "undead": "Non morto",
}

ABILITY_KEYS = ("STR", "DEX", "CON", "INT", "WIS", "CHA")
ABILITY_IT = {
    "STR": "forza",
    "DEX": "destrezza",
    "CON": "costituzione",
    "INT": "intelligenza",
    "WIS": "saggezza",
    "CHA": "carisma",
}

SAVE_IT = {
    "STR": "FOR",
    "DEX": "DES",
    "CON": "COS",
    "INT": "INT",
    "WIS": "SAG",
    "CHA": "CAR",
}

DAMAGE_TYPES = {
    "acid": "acido",
    "bludgeoning": "contundente",
    "cold": "freddo",
    "fire": "fuoco",
    "force": "forza",
    "lightning": "fulmine",
    "necrotic": "necrotico",
    "piercing": "perforante",
    "poison": "veleno",
    "psychic": "psichico",
    "radiant": "radioso",
    "slashing": "tagliente",
    "thunder": "tuono",
}

ALIGNMENT_SHORT = {
    "lawful good": "LB",
    "neutral good": "NB",
    "chaotic good": "CB",
    "lawful neutral": "LN",
    "neutral": "N",
    "neutral neutral": "N",
    "true neutral": "N",
    "chaotic neutral": "CN",
    "lawful evil": "LM",
    "neutral evil": "NM",
    "chaotic evil": "CM",
    "unaligned": "SA",
    "any alignment": "Qualsiasi",
    "any non-good alignment": "Non buono",
    "any non-lawful alignment": "Non legale",
    "any chaotic alignment": "Caotico",
    "any evil alignment": "Malvagio",
}

SOURCE_SHORT = {
    "monster manual": "MM",
    "tasha": "TCoE",
    "xanathar": "XGtE",
    "fizban": "FTD",
    "volo": "VGM",
    "mordenkainen": "MPMM",
    "monsters of the multiverse": "MPMM",
    "eberron": "ERLW",
    "van richten": "VRGtR",
    "strixhaven": "SCC",
    "spelljammer": "SAiS",
    "dragonlance": "DSotDQ",
    "planescape": "PAitM",
    "guildmasters": "GGR",
    "mythic odysseys": "MOoT",
    "adventures": "ADV",
    "rules": "Rules",
}

SOURCE_START_RE = re.compile(
    r"^(Monster Manual|Rules|Adventures|Volo|Mordenkainen|Fizban|Tasha|Xanathar|"
    r"Eberron|Van Richten|Strixhaven|Spelljammer|Dragonlance|Planescape|Monsters of the Multiverse|"
    r"Guildmasters|Mythic Odysseys|Candlekeep|Journeys|Keys from|The Wild Beyond|"
    r"Tales from|Princes of|Curse of|Tomb of|Waterdeep|Baldur|Icewind|"
    r"Storm King's|Out of the Abyss|The Book of Many Things)\b",
    re.I,
)

FIELD_LABELS = (
    "Saving Throws",
    "Skills",
    "Damage Vulnerabilities",
    "Damage Resistances",
    "Damage Immunities",
    "Condition Immunities",
    "Senses",
    "Languages",
    "Challenge",
)

SECTION_LABELS = {
    "actions": "azioni",
    "bonus actions": "azioni_bonus",
    "reactions": "reazioni",
    "legendary actions": "azioni_leggendarie",
    "mythic actions": "azioni_mitiche",
    "lair actions": "azioni_tana",
}

SPELL_NAME_IT = {
    "summon aberration": "Evocare Aberrazione",
    "summon beast": "Evocare Bestia",
    "summon celestial": "Evocare Celestiale",
    "summon construct": "Evocare Costrutto",
    "summon elemental": "Evocare Elementale",
    "summon fey": "Evocare Fata",
    "summon fiend": "Evocare Immondo",
    "summon shadowspawn": "Evocare Stirpe d'Ombra",
    "summon undead": "Evocare Non Morto",
    "tiny servant": "Servitore Minuscolo",
}

SUMMON_NAME_IT = {
    "Aberrant Spirit": "Spirito Aberrante",
    "Bestial Spirit": "Spirito Bestiale",
    "Celestial Spirit": "Spirito Celestiale",
    "Construct Spirit": "Spirito Costrutto",
    "Elemental Spirit": "Spirito Elementale",
    "Fey Spirit": "Spirito Fatato",
    "Fiendish Spirit": "Spirito Immondo",
    "Shadow Spirit": "Spirito d'Ombra",
    "Undead Spirit": "Spirito Non Morto",
    "Tiny Servant": "Servitore Minuscolo",
}


def normalize_spaces(value):
    value = str(value or "").replace("\u00a0", " ").replace("´", "'")
    return re.sub(r"\s+", " ", value).strip()


def slugify(value):
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return text or "monster"


def source_short(source):
    lower = normalize_spaces(source).lower()
    for key, short in SOURCE_SHORT.items():
        if key in lower:
            return short
    return ""


def is_footer(line):
    clean = normalize_spaces(line)
    if not clean:
        return True
    if clean == "DnD 5 Monsters":
        return True
    if clean.startswith("https://www.aidedd.org"):
        return True
    if re.match(r"^\d{2}/\d{2}/\d{2},\s+\d{2}:\d{2}", clean):
        return True
    return False


def read_pdf_lines():
    if not PDF_PATH.exists():
        raise FileNotFoundError(f"PDF non trovato: {PDF_PATH}")
    reader = PdfReader(str(PDF_PATH))
    lines = []
    for page_index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        for raw_line in text.splitlines():
            line = normalize_spaces(raw_line)
            if is_footer(line):
                continue
            lines.append({"text": line, "page": page_index})
    return reader, lines


def is_type_line(line):
    lower = normalize_spaces(line).lower()
    if not any(lower.startswith(size + " ") for size in SIZE_WORDS):
        return False
    return any(re.search(rf"\b{re.escape(kind)}\b", lower) for kind in TYPE_WORDS) or "swarm of" in lower


def is_basic_field(line):
    return normalize_spaces(line).startswith(("Armor Class", "Hit Points", "Speed"))


def is_source_line(line):
    return bool(SOURCE_START_RE.match(normalize_spaces(line)))


def is_section_line(line):
    return normalize_spaces(line).lower() in SECTION_LABELS


def is_name_line(line):
    clean = normalize_spaces(line)
    if not clean or len(clean) > 90:
        return False
    if is_basic_field(clean) or is_source_line(clean) or is_section_line(clean):
        return False
    if clean in FIELD_LABELS or clean in ABILITY_KEYS:
        return False
    if re.match(r"^\d", clean):
        return False
    return True


def find_headers(lines):
    headers = []
    for index in range(0, len(lines) - 2):
        name = lines[index]["text"]
        type_line = lines[index + 1]["text"]
        ac_line = lines[index + 2]["text"]
        if is_name_line(name) and is_type_line(type_line) and ac_line.startswith("Armor Class"):
            headers.append(index)
    return headers


def split_blocks(lines):
    headers = find_headers(lines)
    blocks = []
    for pos, start in enumerate(headers):
        end = headers[pos + 1] if pos + 1 < len(headers) else len(lines)
        blocks.append(lines[start:end])
    return blocks


def field_value(line, label):
    clean = normalize_spaces(line)
    if not clean.startswith(label):
        return ""
    return clean[len(label):].strip()


def parse_type_line(type_line):
    clean = normalize_spaces(type_line)
    lower = clean.lower()
    size_en = next((size for size in SIZE_WORDS if lower.startswith(size + " ")), "")
    type_en = next((kind for kind in TYPE_WORDS if re.search(rf"\b{re.escape(kind)}\b", lower)), "")
    if "swarm of" in lower and not type_en:
        type_en = "beast"
    alignment = clean.split(",", 1)[1].strip() if "," in clean else ""
    return {
        "taglia": SIZE_IT.get(size_en, size_en.title() if size_en else ""),
        "tipo": TYPE_IT.get(type_en, type_en.title() if type_en else ""),
        "allineamento": alignment,
        "allineamento_breve": short_alignment(alignment),
    }


def short_alignment(value):
    clean = normalize_spaces(value).lower()
    clean = re.sub(r"^(typically|usually)\s+", "", clean)
    clean = clean.replace(" or ", " / ")
    if clean in ALIGNMENT_SHORT:
        return ALIGNMENT_SHORT[clean]
    if "/" in clean:
        parts = [ALIGNMENT_SHORT.get(part.strip(), "") for part in clean.split("/")]
        return "/".join(part for part in parts if part)
    return ""


def parse_abilities(lines):
    texts = [entry["text"] for entry in lines]
    for index in range(0, len(texts) - 11):
        if tuple(texts[index:index + 6]) == ABILITY_KEYS:
            values = texts[index + 6:index + 12]
            parsed = {}
            for key, value in zip(ABILITY_KEYS, values):
                parsed[ABILITY_IT[key]] = parse_ability_value(value)
            return parsed, index + 12
        pair_labels = texts[index:index + 12:2]
        if tuple(pair_labels) == ABILITY_KEYS:
            parsed = {}
            for key, value in zip(ABILITY_KEYS, texts[index + 1:index + 12:2]):
                parsed[ABILITY_IT[key]] = parse_ability_value(value)
            return parsed, index + 12
        if texts[index] == " ".join(ABILITY_KEYS) and index + 1 < len(texts):
            values = re.findall(r"\d+\s*\([+-]\d+\)", texts[index + 1])
            if len(values) == 6:
                parsed = {}
                for key, value in zip(ABILITY_KEYS, values):
                    parsed[ABILITY_IT[key]] = parse_ability_value(value)
                return parsed, index + 2
    joined = " ".join(texts)
    match = re.search(
        r"\bSTR\s+DEX\s+CON\s+INT\s+WIS\s+CHA\s+"
        r"((?:\d+\s*\([+-]\d+\)\s*){6})",
        joined,
        re.I,
    )
    if match:
        values = re.findall(r"\d+\s*\([+-]\d+\)", match.group(1))
        parsed = {}
        for key, value in zip(ABILITY_KEYS, values):
            parsed[ABILITY_IT[key]] = parse_ability_value(value)
        return parsed, 0
    return {}, 5


def parse_ability_value(value):
    match = re.search(r"(\d+)\s*\(([+-]?\d+)\)", normalize_spaces(value))
    if not match:
        return {"score": None, "mod": None}
    return {"score": int(match.group(1)), "mod": int(match.group(2))}


def label_for_line(line):
    clean = normalize_spaces(line)
    for label in FIELD_LABELS:
        if clean.startswith(label):
            return label
    return ""


def parse_labeled_fields(lines, start_index):
    fields = {}
    index = start_index
    while index < len(lines):
        text = lines[index]["text"]
        if is_section_line(text) or is_source_line(text):
            break
        if re.search(r"\bSee the .+? spell\.", text, re.I):
            break
        label = label_for_line(text)
        if not label:
            index += 1
            continue
        chunks = [field_value(text, label)]
        index += 1
        if label == "Challenge":
            fields[label] = normalize_spaces(" ".join(chunks))
            break
        while index < len(lines):
            next_text = lines[index]["text"]
            if label_for_line(next_text) or is_section_line(next_text) or is_source_line(next_text):
                break
            if re.search(r"\bSee the .+? spell\.", next_text, re.I):
                break
            chunks.append(next_text)
            index += 1
        fields[label] = normalize_spaces(" ".join(chunks))
    return fields, index


def parse_challenge(value):
    clean = normalize_spaces(value)
    if not clean or clean.startswith("-"):
        return "Senza GS", ""
    xp = ""
    match_xp = re.search(r"\(([^)]*XP)\)", clean, re.I)
    if match_xp:
        xp = match_xp.group(1)
    score = re.sub(r"\([^)]*\)", "", clean).strip()
    score = re.sub(r"\s+Proficiency Bonus.*$", "", score, flags=re.I).strip()
    return score or "Senza GS", xp


def parse_damage_values(value):
    lower = normalize_spaces(value).lower()
    found = []
    for key, translated in DAMAGE_TYPES.items():
        if re.search(rf"\b{re.escape(key)}\b", lower):
            found.append(translated)
    return found


def parse_saves(value):
    found = []
    for key, translated in SAVE_IT.items():
        if re.search(rf"\b{key}\b", normalize_spaces(value)):
            found.append(translated)
    return found


def find_source(block):
    source_index = None
    source = ""
    for index, entry in enumerate(block):
        if is_source_line(entry["text"]):
            source_index = index
            source = entry["text"]
    return source_index, source


def entry_title_match(line):
    match = re.match(r"^([A-Z][A-Za-z0-9'’/() -]{1,80}\.)\s*(.*)$", normalize_spaces(line))
    if not match:
        return None
    title, rest = match.groups()
    words = re.findall(r"[A-Za-z]+", title.rstrip("."))
    if len(words) > 6:
        return None
    if words and words[0].lower() in {"strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"} and len(words) > 2:
        return None
    return title, rest


def is_tail_description_line(line, monster_name):
    lower = normalize_spaces(line).lower()
    name = normalize_spaces(monster_name).lower()
    simple = re.sub(r"[^a-z0-9 ]+", "", name).strip()
    variants = {name, f"{name}s", simple, f"{simple}s"}
    for variant in variants:
        if not variant:
            continue
        if lower.startswith(variant + " "):
            return True
        if lower.startswith("a " + variant + " ") or lower.startswith("an " + variant + " "):
            return True
        if lower.startswith("the " + variant + " "):
            return True
    return False


def is_rules_continuation(line):
    lower = normalize_spaces(line).lower()
    allowed_prefixes = (
        "a creature ",
        "all creatures ",
        "any creature ",
        "each creature ",
        "if ",
        "hit:",
        "on a failed ",
        "on a success",
        "on a successful ",
        "the target ",
        "a target ",
        "the creature ",
        "the spell ",
        "the attack ",
        "this attack ",
        "this effect ",
        "this damage ",
        "when ",
        "while ",
        "until ",
        "at the ",
        "before ",
        "after ",
        "for ",
        "in ",
        "it ",
        "its ",
        "they ",
        "then ",
        "or ",
        "and ",
        "must ",
        "can ",
        "provided ",
    )
    return lower.startswith(allowed_prefixes)


def format_section(lines, monster_name, trim_tail=True):
    paragraphs = []
    current = ""
    seen_entry = False

    for raw in lines:
        line = normalize_spaces(raw)
        if not line:
            continue
        if trim_tail and seen_entry and is_tail_description_line(line, monster_name):
            break
        if trim_tail and seen_entry and current.rstrip().endswith(".") and not entry_title_match(line) and not is_rules_continuation(line):
            break
        match = entry_title_match(line)
        if match:
            if current:
                paragraphs.append(current.strip())
            title, rest = match
            current = f"**{title}** {rest}".strip()
            seen_entry = True
            continue
        if current:
            current = f"{current} {line}".strip()
        else:
            current = line

    if current:
        paragraphs.append(current.strip())
    return "\n\n".join(paragraphs)


def parse_sections(lines, start_index, monster_name):
    sections = {value: [] for value in SECTION_LABELS.values()}
    current = "tratti"
    index = start_index
    while index < len(lines):
        text = lines[index]["text"]
        lower = text.lower()
        if is_source_line(text) or re.search(r"\bSee the .+? spell\.", text, re.I):
            break
        if lower in SECTION_LABELS:
            current = SECTION_LABELS[lower]
            index += 1
            continue
        if text.startswith(("STR", "DEX", "CON", "INT", "WIS", "CHA")):
            index += 1
            continue
        sections.setdefault(current, []).append(text)
        index += 1

    return {
        key: format_section(value, monster_name, trim_tail=key != "tratti")
        for key, value in sections.items()
    }


def parse_block(block):
    all_text = "\n".join(entry["text"] for entry in block)
    if "not available (not OGL)" in all_text:
        return None, "not_ogl"

    name_en = normalize_spaces(block[0]["text"])
    type_line = normalize_spaces(block[1]["text"])
    source_index, source = find_source(block)
    content = block[:source_index] if source_index is not None else block
    page = block[0]["page"]

    see_spell_match = re.search(r"\bSee the ([^.]+?) spell\.", all_text, re.I)
    spell_name_en = normalize_spaces(see_spell_match.group(1)).lower() if see_spell_match else ""

    ac = field_value(content[2]["text"], "Armor Class") if len(content) > 2 else ""
    hp = ""
    speed = ""
    for entry in content[2:8]:
        text = entry["text"]
        if text.startswith("Hit Points"):
            hp = field_value(text, "Hit Points")
        elif text.startswith("Speed"):
            speed = field_value(text, "Speed")

    abilities, after_abilities = parse_abilities(content)
    fields, after_fields = parse_labeled_fields(content, after_abilities)
    challenge, xp = parse_challenge(fields.get("Challenge", ""))
    sections = parse_sections(content, after_fields, name_en)
    type_info = parse_type_line(type_line)
    source_abbr = source_short(source)

    display_name = SUMMON_NAME_IT.get(name_en, name_en) if spell_name_en else name_en
    monster_id = slugify(f"{display_name}-{source_abbr or source}-{page}")

    monster = {
        "id": monster_id,
        "nome": display_name,
        "nome_en": name_en,
        "fonte": source,
        "fonte_breve": source_abbr,
        "pagina_pdf": page,
        "tipo_linea": type_line,
        "taglia": type_info["taglia"],
        "tipo": type_info["tipo"],
        "allineamento": type_info["allineamento"],
        "allineamento_breve": type_info["allineamento_breve"],
        "classe_armatura": ac,
        "punti_ferita": hp,
        "velocita": speed,
        "caratteristiche": abilities,
        "tiri_salvezza_testo": fields.get("Saving Throws", ""),
        "tiri_salvezza": parse_saves(fields.get("Saving Throws", "")),
        "abilita_testo": fields.get("Skills", ""),
        "vulnerabilita_testo": fields.get("Damage Vulnerabilities", ""),
        "vulnerabilita": parse_damage_values(fields.get("Damage Vulnerabilities", "")),
        "resistenze_testo": fields.get("Damage Resistances", ""),
        "resistenze": parse_damage_values(fields.get("Damage Resistances", "")),
        "immunita_danni_testo": fields.get("Damage Immunities", ""),
        "immunita_danni": parse_damage_values(fields.get("Damage Immunities", "")),
        "immunita_condizioni_testo": fields.get("Condition Immunities", ""),
        "sensi": fields.get("Senses", ""),
        "linguaggi": fields.get("Languages", ""),
        "grado_sfida": challenge,
        "pe": xp,
        "tratti": sections.get("tratti", ""),
        "azioni": sections.get("azioni", ""),
        "azioni_bonus": sections.get("azioni_bonus", ""),
        "reazioni": sections.get("reazioni", ""),
        "azioni_leggendarie": sections.get("azioni_leggendarie", ""),
        "azioni_mitiche": sections.get("azioni_mitiche", ""),
        "azioni_tana": sections.get("azioni_tana", ""),
    }

    if spell_name_en:
        monster["spell_name_en"] = spell_name_en
        monster["spell_name"] = SPELL_NAME_IT.get(spell_name_en, spell_name_en.title())
        monster["id"] = slugify(f"{monster['spell_name']}-{display_name}")
        return monster, "summon"

    return monster, "monster"


def challenge_sort_key(value):
    clean = normalize_spaces(value)
    if clean == "Senza GS":
        return 999
    if "/" in clean:
        left, right = clean.split("/", 1)
        try:
            return float(left) / float(right)
        except ValueError:
            return 999
    try:
        return float(clean)
    except ValueError:
        return 999


def extract_monsters():
    reader, lines = read_pdf_lines()
    blocks = split_blocks(lines)
    monsters = []
    summons = []
    skipped = Counter()

    for block in blocks:
        parsed, kind = parse_block(block)
        if kind == "not_ogl":
            skipped["not_ogl"] += 1
            continue
        if not parsed:
            skipped["parse_error"] += 1
            continue
        if kind == "summon":
            summons.append(parsed)
        else:
            monsters.append(parsed)

    monsters.sort(key=lambda item: (challenge_sort_key(item.get("grado_sfida")), item.get("nome", "")))
    summons.sort(key=lambda item: (item.get("spell_name", ""), item.get("nome", "")))
    return reader, blocks, monsters, summons, skipped


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_js(path, global_name, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, ensure_ascii=False, indent=2)
    path.write_text(f"// Auto-generated by risorse/mostri/build_monsters.py\nwindow.{global_name} = {payload};\n", encoding="utf-8")


def validation_report(reader, blocks, monsters, summons, skipped):
    return {
        "source": str(PDF_PATH.relative_to(ROOT)),
        "pages": len(reader.pages),
        "statblock_headers": len(blocks),
        "monsters_written": len(monsters),
        "summon_statblocks_written": len(summons),
        "skipped": dict(skipped),
        "by_challenge": dict(Counter(item.get("grado_sfida") or "Senza GS" for item in monsters)),
        "by_source": dict(Counter(item.get("fonte_breve") or item.get("fonte") or "Sconosciuta" for item in monsters)),
        "summons_by_spell": {
            spell: count
            for spell, count in Counter(item.get("spell_name") or item.get("spell_name_en") for item in summons).items()
        },
    }


def source_inventory(reader):
    return {
        "sources": [
            {
                "id": "lista-mostri",
                "source": "Lista Mostri",
                "file": str(PDF_PATH.relative_to(ROOT)),
                "pages": len(reader.pages),
                "status": "active",
                "notes": "PDF usato solo per statblock. I blocchi non OGL sono esclusi; gli statblock evocati da incantesimi sono separati.",
            }
        ]
    }


def main():
    if len(sys.argv) >= 3 and sys.argv[1] == "--peek":
        _, lines = read_pdf_lines()
        needle = normalize_spaces(sys.argv[2]).lower()
        for block in split_blocks(lines):
            if normalize_spaces(block[0]["text"]).lower() == needle:
                for entry in block[:80]:
                    print(f"{entry['page']:>3}: {entry['text']}")
                return
        raise SystemExit(f"Mostro non trovato: {sys.argv[2]}")

    reader, blocks, monsters, summons, skipped = extract_monsters()
    write_json(MONSTERS_JSON, monsters)
    write_json(SUMMONS_JSON, summons)
    write_json(VALIDATION_JSON, validation_report(reader, blocks, monsters, summons, skipped))
    write_json(INVENTORY_JSON, source_inventory(reader))
    write_js(MONSTERS_JS, "COMP_MONSTERS_DATA", monsters)
    write_js(SUMMONS_JS, "COMP_SUMMON_STATBLOCKS_DATA", summons)
    print(f"Mostri scritti: {len(monsters)}")
    print(f"Statblock incantesimi: {len(summons)}")
    print(f"Saltati non OGL: {skipped.get('not_ogl', 0)}")


if __name__ == "__main__":
    main()
