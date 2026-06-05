import json
import re
import unicodedata
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[2]
MANUALS = ROOT / "risorse" / "Manuali"
OUT_DIR = ROOT / "risorse" / "mostri"
JS_OUT = ROOT / "js" / "Compendio" / "data" / "mostri_data.js"


SOURCES = [
    {
        "id": "mm",
        "source": "Manuale dei Mostri",
        "source_short": "MM",
        "file": "Manuale dei Mostri.pdf",
        "language": "it",
        "status": "active",
    },
    {
        "id": "vgm",
        "source": "Volo's Guide to Monsters",
        "source_short": "VGM",
        "file": "Volo's Guide to Monsters.pdf",
        "language": "en",
        "status": "pending",
    },
    {
        "id": "mpmm",
        "source": "Mordenkainen Presents: Monsters of the Multiverse",
        "source_short": "MPMM",
        "file": "mosters of the multiverse ita.pdf",
        "language": "it",
        "status": "pending_ocr_review",
    },
    {
        "id": "ftd",
        "source": "Fizban's Treasury of Dragons",
        "source_short": "FTD",
        "file": "fizban ita.pdf",
        "language": "it",
        "status": "pending_ocr",
    },
    {
        "id": "erlw",
        "source": "Eberron: Rising from the Last War",
        "source_short": "ERLW",
        "file": "Eberron -Rising from the Last War.pdf",
        "language": "en",
        "status": "pending",
    },
]


SIZE_WORDS = ["Minuscolo", "Piccolo", "Medio", "Grande", "Enorme", "Mastodontico"]
TYPE_WORDS = [
    "Aberrazione",
    "Bestia",
    "Celestiale",
    "Costrutto",
    "Drago",
    "Elementale",
    "Folletto",
    "Gigante",
    "Immondo",
    "Melma",
    "Mostruosita",
    "Mostruosità",
    "Non morto",
    "Pianta",
    "Sciame",
    "Umanoide",
]


ABILITY_LABELS = {
    "FOR": "forza",
    "DES": "destrezza",
    "COS": "costituzione",
    "INT": "intelligenza",
    "SAG": "saggezza",
    "SAC": "saggezza",
    "CAR": "carisma",
}

ABILITY_ALIASES = {
    "FOR": "FOR",
    "DES": "DES",
    "COS": "COS",
    "CON": "COS",
    "INT": "INT",
    "SAG": "SAG",
    "SAC": "SAG",
    "WIS": "SAG",
    "CAR": "CAR",
    "CHA": "CAR",
}

DAMAGE_TYPES = [
    "acido",
    "contundente",
    "freddo",
    "fuoco",
    "forza",
    "fulmine",
    "necrotico",
    "perforante",
    "psichico",
    "radioso",
    "tagliente",
    "tuono",
    "veleno",
]


ALIGNMENT_SHORT = {
    "legale buono": "LB",
    "neutrale buono": "NB",
    "caotico buono": "CB",
    "legale neutrale": "LN",
    "neutrale": "N",
    "caotico neutrale": "CN",
    "legale malvagio": "LM",
    "neutrale malvagio": "NM",
    "caotico malvagio": "CM",
    "senza allineamento": "SA",
    "qualsiasi allineamento": "QA",
    "qualsiasi allineamento non buono": "QANB",
    "qualsiasi allineamento non legale": "QANL",
}

BAD_NAME_KEYS = {
    "azioni",
    "azioni bonus",
    "reazioni",
    "variante dragh i cr omatici",
    "variante draghi cromatici",
    "tormento telepatico",
}


OCR_FIXES = {
    "\ufb01": "fi",
    "\ufb02": "fl",
    "Punti Ferfta": "Punti Ferita",
    "Punti Ferfta": "Punti Ferita",
    "Punti Ferita": "Punti Ferita",
    "Velodtà": "Velocità",
    "VelocitÃ": "Velocità",
    "Velocita": "Velocità",
    "l inguaggi": "Linguaggi",
    "L inguaggi": "Linguaggi",
    "Condizjoni": "Condizioni",
    "Condizloni": "Condizioni",
    "Percez ìone": "Percezione",
    "Percez ione": "Percezione",
    "Tiri Salvezz a": "Tiri Salvezza",
    "Tiri Salvezza": "Tiri Salvezza",
    "Abilita": "Abilità",
    "Mostruosita": "Mostruosità",
    "a/lineamento": "allineamento",
    "alfineamento": "allineamento",
    "ma/11agio": "malvagio",
    "caoiico": "caotico",
    "c;aotic;o": "caotico",
    "legale malvagia": "legale malvagio",
    "O (": "0 (",
}


def normalize_text(text):
    text = text or ""
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\r", "\n")
    for wrong, right in OCR_FIXES.items():
        text = text.replace(wrong, right)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def slugify(value):
    value = unicodedata.normalize("NFKD", value or "")
    value = value.encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
    return value or "mostro"


def clean_name(name):
    name = normalize_text(name)
    name = re.sub(r"^\d+\s*", "", name).strip()
    name = re.sub(r"\s+", " ", name)
    return name.title() if name.isupper() else name


def normalized_key(value):
    value = unicodedata.normalize("NFKD", value or "")
    value = value.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def extract_field(linear, labels):
    if isinstance(labels, str):
        labels = [labels]
    label_re = "|".join(re.escape(label) for label in labels)
    stop_labels = (
        "Classe Armatura|Punti Ferita|Velocita|Velocità|Tiri Salvezza|Abilità|"
        "Vulnerabilità ai Danni|Resistenze ai Danni|Immunità ai Danni|"
        "Immunità alle Condizioni|Sensi|Linguaggi|Lingue|Sfida|Bonus di competenza|AZIONI|REAZIONI|"
        "AZIONI LEGGENDARIE|AZIONI DI TANA|FOR|DES|COS|INT|SAG|SAC|CAR"
    )
    pattern = re.compile(rf"(?:{label_re})\s+(.+?)(?=\s+(?:{stop_labels})\b|$)", re.IGNORECASE)
    match = pattern.search(linear)
    return match.group(1).strip(" .") if match else ""


def extract_line(text, label_pattern):
    pattern = re.compile(rf"{label_pattern}\s+([^\n]+)", re.IGNORECASE)
    match = pattern.search(text)
    return match.group(1).strip() if match else ""


def parse_abilities(chunk):
    abilities = {}
    ability_re = re.compile(
        r"\b(FOR|DES|COS|cos|INT|SAG|SAC|CAR)\s*\n\s*(\d+)\s*\(([^)]{1,10})\)",
        re.IGNORECASE,
    )
    for label, score, mod in ability_re.findall(chunk):
        key = ABILITY_LABELS.get(label.upper())
        if not key:
            continue
        abilities[key] = {
            "score": int(score),
            "mod": parse_modifier(mod),
        }
    return abilities


def parse_modifier(value):
    value = str(value or "").upper().replace("−", "-").replace("O", "0").replace("L", "1").replace("I", "1")
    value = re.sub(r"[^0-9+\-]", "", value)
    try:
        return int(value)
    except ValueError:
        return 0


def parse_type_line(type_line):
    left, _, alignment = type_line.partition(",")
    left = left.strip()
    alignment = normalize_alignment(alignment.strip())
    size = ""
    type_name = left
    tags = []
    for word in SIZE_WORDS:
        match = re.search(rf"\b{word}\b", left, flags=re.IGNORECASE)
        if not match:
            continue
        size = word
        type_name = left[: match.start()].strip()
        tail = left[match.end() :].strip()
        tags = [tag.strip() for tag in re.findall(r"\(([^)]*)\)", tail)]
        break
    type_name = type_name.strip()
    return {
        "tipo": normalize_type(type_name),
        "taglia": size,
        "tag": ", ".join(tags),
        "allineamento": alignment,
        "allineamento_breve": ALIGNMENT_SHORT.get(normalized_key(alignment), ""),
    }


def normalize_type(value):
    key = normalized_key(value)
    mapping = {
        "aberrazione": "Aberrazione",
        "bestia": "Bestia",
        "celestiale": "Celestiale",
        "costrutto": "Costrutto",
        "drago": "Drago",
        "elementale": "Elementale",
        "folletto": "Folletto",
        "gigante": "Gigante",
        "immondo": "Immondo",
        "melma": "Melma",
        "mostruosita": "Mostruosità",
        "non morto": "Non morto",
        "pianta": "Pianta",
        "sciame": "Sciame",
        "umanoide": "Umanoide",
    }
    return mapping.get(key, value.strip())


def normalize_alignment(value):
    key = normalized_key(value)
    key = key.replace("malvagia", "malvagio")
    key = key.replace("caoiico", "caotico")
    mapping = {
        "legale buono": "legale buono",
        "neutrale buono": "neutrale buono",
        "caotico buono": "caotico buono",
        "legale neutrale": "legale neutrale",
        "neutrale": "neutrale",
        "caotico neutrale": "caotico neutrale",
        "legale malvagio": "legale malvagio",
        "neutrale malvagio": "neutrale malvagio",
        "caotico malvagio": "caotico malvagio",
        "senza allineamento": "senza allineamento",
        "qualsiasi allineamento": "qualsiasi allineamento",
        "qualsiasi allineamento non buono": "qualsiasi allineamento non buono",
        "qualsiasi allineamento non legale": "qualsiasi allineamento non legale",
    }
    return mapping.get(key, value.strip())


def parse_damage_list(value):
    key = normalized_key(value)
    found = []
    for damage in DAMAGE_TYPES:
        if normalized_key(damage) in key:
            found.append(damage)
    return found


def parse_saves(value):
    result = []
    for match in re.finditer(r"\b(FOR|DES|COS|CON|INT|SAG|SAC|WIS|CAR|CHA)\b", value, flags=re.IGNORECASE):
        ability = ABILITY_ALIASES.get(match.group(1).upper())
        if ability and ability not in result:
            result.append(ability)
    return result


def parse_challenge(text):
    match = re.search(r"Sfida\s+([0-9OIl]+(?:\s*/\s*[0-9OIl]+)?|[-—])\s*\(([^)]*PE)\)", text, flags=re.IGNORECASE)
    if not match:
        return "", ""
    gs = match.group(1).replace(" ", "").replace("O", "0").replace("I", "1").replace("l", "1").replace("—", "-")
    xp = (
        match.group(2)
        .replace("S.", "5.")
        .replace("SO", "50")
        .replace("S0", "50")
        .replace("O", "0")
        .strip()
    )
    return gs, xp


def section_text(chunk, start_label, end_labels):
    start = re.search(start_label, chunk, flags=re.IGNORECASE)
    if not start:
        return ""
    rest = chunk[start.end() :]
    stops = [m.start() for label in end_labels for m in [re.search(label, rest, flags=re.IGNORECASE)] if m]
    if stops:
        rest = rest[: min(stops)]
    return clean_block(rest)


def clean_block(value):
    value = normalize_text(value)
    value = re.sub(r"\n+", "\n", value)
    value = re.sub(r" +", " ", value)
    return value.strip()


def trim_description_tail(chunk, name):
    lines = chunk.splitlines()
    if not name:
        return chunk
    name_key = normalized_key(name)
    for idx, line in enumerate(lines[8:], start=8):
        if normalized_key(line) == name_key:
            return "\n".join(lines[:idx]).strip()
    return chunk


def line_offsets(text):
    offsets = []
    cursor = 0
    for line in text.splitlines():
        offsets.append(cursor)
        cursor += len(line) + 1
    return offsets


def is_plausible_name_line(line):
    clean = normalize_text(line)
    if not clean or len(clean) > 70:
        return False
    key = normalized_key(clean)
    if not key or any(token in key for token in ["capitolo", "bestiario", "classe armatura", "punti ferita"]):
        return False
    if re.search(r"\d", clean):
        return False
    letters = re.findall(r"[A-Za-zÀ-ÿ]", clean)
    if len(letters) < 3:
        return False
    punctuation = re.findall(r"[^A-Za-zÀ-ÿ '\-]", clean)
    if len(punctuation) > max(2, len(letters) // 3):
        return False
    uppercase = sum(1 for char in letters if char.isupper())
    return uppercase / max(len(letters), 1) >= 0.45


def clean_statblock_name(value):
    name = clean_name(value)
    letters = re.findall(r"[A-Za-zÀ-ÿ]", name)
    if letters:
        uppercase = sum(1 for char in letters if char.isupper())
        if uppercase / len(letters) >= 0.45:
            name = name.title()
    replacements = {
        "'Tridrone": "Tridrone",
        "(Svirfneblin)": "Gnomo delle Profondità (Svirfneblin)",
        "Aq,Uila": "Aquila",
        "De Lla": "Della",
        "De L": "Del",
        "Alli P": "Allip",
        "Bove": "Bove",
        "Bue": "Bue",
        "Bug Bear": "Bugbear",
        "Cocconrillo": "Coccodrillo",
        "Fll.Ngo": "Fango",
        "Gobli�": "Goblin",
        "Kuo-Toa": "Kuo-toa",
        "Lucertolol De": "Lucertoloide",
        "Lmp": "Imp",
        "Mepmit": "Mephit",
        "Goblin": "Goblin",
        "Q,Uipper": "Quipper",
        "Tribal E": "Tribale",
        "Yuan-Tisanguepuro": "Yuan-ti Purosangue",
    }
    for wrong, right in replacements.items():
        name = re.sub(rf"\b{re.escape(wrong)}\b", right, name)
    return re.sub(r"\s+", " ", name).strip()


def is_bad_monster_name(name):
    key = normalized_key(name)
    return (
        key in BAD_NAME_KEYS
        or key.startswith("azioni ")
        or key.startswith("variante ")
        or key.startswith("di ")
        or len(key.split()) > 5
        or not re.match(r"^[A-Za-zÀ-ÿ]", name or "")
        or bool(re.search(r"[•\\.,]", name or ""))
    )


def split_type_line(line):
    type_pattern = "|".join(TYPE_WORDS)
    size_pattern = "|".join(SIZE_WORDS)
    match = re.search(
        rf"(?P<prefix>.*?)\b(?P<type>(?:{type_pattern})\b[^\n]*\b(?:{size_pattern})\b[^\n]*,[^\n]+)$",
        normalize_text(line),
        flags=re.IGNORECASE,
    )
    if not match:
        return "", ""
    return match.group("prefix").strip(" -•*?§#;:.,'\""), match.group("type").strip()


def find_statblock_headers(page_text, page_index, page_offset):
    lines = page_text.splitlines()
    offsets = line_offsets(page_text)
    headers = []
    for armor_idx, line in enumerate(lines):
        if not re.search(r"\bClasse Armatura\b", line, flags=re.IGNORECASE):
            continue
        type_idx = None
        raw_name = ""
        type_line = ""
        for idx in range(armor_idx - 1, max(-1, armor_idx - 10), -1):
            prefix, candidate_type = split_type_line(lines[idx])
            if not candidate_type:
                continue
            type_idx = idx
            type_line = candidate_type
            if prefix and is_plausible_name_line(prefix):
                raw_name = prefix
            break
        if type_idx is None:
            continue
        name_idx = type_idx
        if not raw_name:
            for idx in range(type_idx - 1, max(-1, type_idx - 80), -1):
                if is_plausible_name_line(lines[idx]):
                    raw_name = lines[idx]
                    name_idx = idx
                    break
        headers.append({
            "page": page_index,
            "name": clean_statblock_name(raw_name),
            "type": type_line,
            "start": page_offset + offsets[max(0, name_idx)],
        })
    return headers


def parse_monster(match, chunk, source):
    page = int(match["page"])
    raw_name = match["name"].strip()
    name = clean_name(raw_name)
    type_line = normalize_text(match["type"])
    chunk = trim_description_tail(normalize_text(chunk), name)
    linear = re.sub(r"\s+", " ", chunk)
    parsed_type = parse_type_line(type_line)
    gs, xp = parse_challenge(linear)
    armor = extract_line(chunk, r"Classe Armatura")
    hp = extract_line(chunk, r"Punti Ferita")
    speed = extract_line(chunk, r"Velocità")
    saves_text = extract_field(linear, "Tiri Salvezza")
    skills_text = extract_field(linear, "Abilità")
    vulnerabilities_text = extract_field(linear, "Vulnerabilità ai Danni")
    resistances_text = extract_field(linear, "Resistenze ai Danni")
    damage_immunities_text = extract_field(linear, "Immunità ai Danni")
    condition_immunities_text = extract_field(linear, "Immunità alle Condizioni")
    senses = extract_field(linear, "Sensi")
    languages = extract_field(linear, ["Linguaggi", "Lingue"])
    traits = section_text(
        chunk,
        r"Sfida\s+[0-9O]+(?:/[0-9]+)?\s*\([^)]*PE\)",
        [r"\nAZIONI\b", r"\nREAZIONI\b", r"\nAZIONI LEGGENDARIE\b", r"\nAZIONI DI TANA\b"],
    )
    actions = section_text(chunk, r"\nAZIONI\b", [r"\nREAZIONI\b", r"\nAZIONI LEGGENDARIE\b", r"\nAZIONI DI TANA\b"])
    reactions = section_text(chunk, r"\nREAZIONI\b", [r"\nAZIONI LEGGENDARIE\b", r"\nAZIONI DI TANA\b"])
    legendary = section_text(chunk, r"\nAZIONI LEGGENDARIE\b", [r"\nAZIONI DI TANA\b"])
    name_suspect = (
        not name
        or name.isdigit()
        or len(name) < 3
        or bool(re.search(r"[.!?]$", name))
        or raw_name.strip().isdigit()
        or raw_name[:1].islower()
        or is_bad_monster_name(name)
    )
    review = []
    if name_suspect:
        review.append("name")
    for field, value in [
        ("classe_armatura", armor),
        ("punti_ferita", hp),
        ("velocita", speed),
        ("grado_sfida", gs),
    ]:
        if not value:
            review.append(field)
    abilities = parse_abilities(chunk)
    if len(abilities) < 6:
        review.append("caratteristiche")
    return {
        "id": f"{source['id']}-{slugify(name)}-{page}",
        "nome": name,
        "fonte": source["source"],
        "fonte_breve": source["source_short"],
        "pagina_pdf": page,
        "tipo_linea": type_line,
        **parsed_type,
        "classe_armatura": armor,
        "punti_ferita": hp,
        "velocita": speed,
        "caratteristiche": abilities,
        "tiri_salvezza_testo": saves_text,
        "tiri_salvezza": parse_saves(saves_text),
        "abilita_testo": skills_text,
        "vulnerabilita_testo": vulnerabilities_text,
        "vulnerabilita": parse_damage_list(vulnerabilities_text),
        "resistenze_testo": resistances_text,
        "resistenze": parse_damage_list(resistances_text),
        "immunita_danni_testo": damage_immunities_text,
        "immunita_danni": parse_damage_list(damage_immunities_text),
        "immunita_condizioni_testo": condition_immunities_text,
        "sensi": senses,
        "linguaggi": languages,
        "grado_sfida": gs,
        "pe": xp,
        "tratti": traits,
        "azioni": actions,
        "reazioni": reactions,
        "azioni_leggendarie": legendary,
        "needs_review": review,
    }


def source_inventory():
    inventory = []
    for source in SOURCES:
        path = MANUALS / source["file"]
        item = {**source, "exists": path.exists(), "page_count": 0}
        if path.exists():
            try:
                item["page_count"] = len(PdfReader(str(path)).pages)
            except Exception as exc:
                item["error"] = str(exc)
        inventory.append(item)
    return inventory


def extract_italian_source(source):
    path = MANUALS / source["file"]
    reader = PdfReader(str(path))
    page_texts = []
    page_starts = []
    cursor = 0
    for index, page in enumerate(reader.pages, start=1):
        text = normalize_text(page.extract_text() or "")
        page_starts.append(cursor)
        page_texts.append(text)
        cursor += len(text) + 2
    full_text = "\n\n".join(page_texts)
    matches = []
    for page_index, text in enumerate(page_texts, start=1):
        page_offset = page_starts[page_index - 1]
        matches.extend(find_statblock_headers(text, page_index, page_offset))
    matches.sort(key=lambda item: item["start"])
    monsters = []
    for index, match in enumerate(matches):
        start = match["start"]
        end = matches[index + 1]["start"] if index + 1 < len(matches) else len(full_text)
        chunk = full_text[start:end]
        monsters.append(parse_monster(match, chunk, source))
    return monsters


def extract_manuale_mostri():
    source = SOURCES[0]
    path = MANUALS / source["file"]
    reader = PdfReader(str(path))
    page_texts = []
    page_starts = []
    cursor = 0
    for index, page in enumerate(reader.pages, start=1):
        text = normalize_text(page.extract_text() or "")
        page_starts.append(cursor)
        page_texts.append(text)
        cursor += len(text) + 2
    full_text = "\n\n".join(page_texts)
    type_pattern = "|".join(TYPE_WORDS)
    size_pattern = "|".join(SIZE_WORDS)
    page_start_re = re.compile(
        rf"(?m)^(?P<name>[^\n]{{1,80}})\n"
        rf"(?P<type>(?:{type_pattern})[^\n]*(?:{size_pattern})[^\n]*,[^\n]+)\n"
        rf"Classe Armatura",
        flags=re.IGNORECASE | re.DOTALL,
    )
    matches = []
    for page_index, text in enumerate(page_texts, start=1):
        page_offset = page_starts[page_index - 1]
        for match in page_start_re.finditer(text):
            matches.append({
                "page": page_index,
                "name": clean_statblock_name(match.group("name")),
                "type": match.group("type"),
                "start": page_offset + match.start("name"),
            })
    matches.sort(key=lambda item: item["start"])
    monsters = []
    for index, match in enumerate(matches):
        start = match["start"]
        end = matches[index + 1]["start"] if index + 1 < len(matches) else len(full_text)
        chunk = full_text[start:end]
        monsters.append(parse_monster(match, chunk, source))
    return monsters


def extract_all_monsters():
    monsters = []
    for source in SOURCES:
        if source.get("language") != "it" or source.get("status") != "active":
            continue
        path = MANUALS / source["file"]
        if not path.exists():
            continue
        monsters.extend(extract_italian_source(source))
    return sorted(monsters, key=lambda item: (challenge_sort_key(item["grado_sfida"]), item["nome"], item["fonte_breve"]))


def challenge_sort_key(value):
    value = str(value or "").strip()
    if "/" in value:
        num, den = value.split("/", 1)
        try:
            return float(num) / float(den)
        except ValueError:
            return 999
    try:
        return float(value)
    except ValueError:
        return 999


def validation_report(monsters, inventory, skipped=None):
    skipped = skipped or []
    by_source = {}
    by_cr = {}
    review = []
    for monster in monsters:
        by_source[monster["fonte_breve"]] = by_source.get(monster["fonte_breve"], 0) + 1
        by_cr[monster["grado_sfida"] or "?"] = by_cr.get(monster["grado_sfida"] or "?", 0) + 1
        if monster["needs_review"]:
            review.append({
                "id": monster["id"],
                "nome": monster["nome"],
                "pagina_pdf": monster["pagina_pdf"],
                "issues": monster["needs_review"],
                "tipo_linea": monster["tipo_linea"],
            })
    return {
        "total": len(monsters),
        "by_source": by_source,
        "by_challenge": dict(sorted(by_cr.items(), key=lambda item: challenge_sort_key(item[0]))),
        "needs_review_count": len(review),
        "needs_review": review[:200],
        "skipped_name_count": len(skipped),
        "skipped_name": skipped[:200],
        "sources": inventory,
    }


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_js(path, monsters):
    content = "// Generato da risorse/mostri/build_monsters.py.\n"
    content += "window.COMP_MONSTERS_DATA = "
    content += json.dumps(monsters, ensure_ascii=False, indent=2)
    content += ";\n"
    path.write_text(content, encoding="utf-8")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    inventory = source_inventory()
    extracted = extract_all_monsters()
    skipped = [
        {
            "id": monster["id"],
            "nome": monster["nome"],
            "fonte_breve": monster["fonte_breve"],
            "pagina_pdf": monster["pagina_pdf"],
            "tipo_linea": monster["tipo_linea"],
        }
        for monster in extracted
        if "name" in monster["needs_review"]
    ]
    monsters = [monster for monster in extracted if "name" not in monster["needs_review"]]
    write_json(OUT_DIR / "sources_inventory.json", inventory)
    write_json(OUT_DIR / "monsters.json", monsters)
    write_json(OUT_DIR / "monster_validation.json", validation_report(monsters, inventory, skipped))
    write_js(JS_OUT, monsters)
    print(f"extracted {len(extracted)} monsters")
    print(f"wrote {len(monsters)} monsters")
    print(f"skipped {len(skipped)} name suspects")
    print(f"review {sum(1 for monster in monsters if monster['needs_review'])}")


if __name__ == "__main__":
    main()
