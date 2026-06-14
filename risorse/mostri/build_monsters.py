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

ABILITY_NAMES_IT = {
    "Strength": "Forza",
    "Dexterity": "Destrezza",
    "Constitution": "Costituzione",
    "Intelligence": "Intelligenza",
    "Wisdom": "Saggezza",
    "Charisma": "Carisma",
}

COMMON_TRANSLATIONS = [
    ("Melee or Ranged Spell Attack", "Attacco con incantesimo da mischia o a distanza"),
    ("Melee or Ranged Weapon Attack", "Attacco con arma da mischia o a distanza"),
    ("Melee Spell Attack", "Attacco con incantesimo da mischia"),
    ("Ranged Spell Attack", "Attacco con incantesimo a distanza"),
    ("Melee Weapon Attack", "Attacco con arma da mischia"),
    ("Ranged Weapon Attack", "Attacco con arma a distanza"),
    ("spell attack modifier", "modificatore di attacco con incantesimo"),
    ("spell save DC", "CD del tiro salvezza degli incantesimi"),
    ("to hit", "al tiro per colpire"),
    ("reach", "portata"),
    ("range", "gittata"),
    ("Hit:", "Colpito:"),
    ("one target", "un bersaglio"),
    ("one creature", "una creatura"),
    ("one willing creature", "una creatura consenziente"),
    ("one prone creature", "una creatura prona"),
    ("each creature", "ogni creatura"),
    ("the target", "il bersaglio"),
    ("The target", "Il bersaglio"),
    ("target", "bersaglio"),
    ("creature", "creatura"),
    ("ally", "alleato"),
    ("allies", "alleati"),
    ("enemy", "nemico"),
    ("enemies", "nemici"),
    ("within", "entro"),
    ("must succeed on", "deve superare"),
    ("saving throw", "tiro salvezza"),
    ("on a failed save", "se fallisce"),
    ("on a successful save", "se supera il tiro salvezza"),
    ("on a successful one", "se lo supera"),
    ("or half as much damage on a successful one", "o la meta dei danni se lo supera"),
    ("damage", "danni"),
    ("hit points", "punti ferita"),
    ("hit point", "punto ferita"),
    ("temporary hit points", "punti ferita temporanei"),
    ("at the start of each of its turns", "all'inizio di ciascun suo turno"),
    ("at the start of its turn", "all'inizio del suo turno"),
    ("at the end of each of its turns", "alla fine di ciascun suo turno"),
    ("until the start of its next turn", "fino all'inizio del suo prossimo turno"),
    ("until the end of its next turn", "fino alla fine del suo prossimo turno"),
    ("for 1 minute", "per 1 minuto"),
    ("for 1 hour", "per 1 ora"),
    ("is incapacitated", "e' incapacitato"),
    ("isn't incapacitated", "non e' incapacitato"),
    ("can't regain hit points", "non puo' recuperare punti ferita"),
    ("can't speak", "non puo' parlare"),
    ("can see", "puo' vedere"),
    ("that it can see", "che puo' vedere"),
    ("that can hear it", "che puo' sentirlo"),
    ("against spells and other magical effects", "contro incantesimi e altri effetti magici"),
    ("has advantage on", "ha vantaggio a"),
    ("has disadvantage on", "ha svantaggio a"),
    ("attack rolls", "tiri per colpire"),
    ("ability checks", "prove di caratteristica"),
    ("checks", "prove"),
    ("saving throws", "tiri salvezza"),
    ("weapon attack", "attacco con arma"),
    ("spell attack", "attacco con incantesimo"),
    ("half as much damage", "la meta dei danni"),
    ("only half damage", "solo meta dei danni"),
    ("plus", "piu"),
    ("and", "e"),
    ("or", "o"),
    ("magical", "magico"),
    ("nonmagical", "non magico"),
    ("At will:", "A volonta:"),
    ("Cantrips (at will):", "Trucchetti (a volonta):"),
    ("1/day each:", "1/giorno ciascuno:"),
    ("2/day each:", "2/giorno ciascuno:"),
    ("3/day each:", "3/giorno ciascuno:"),
    ("1/day:", "1/giorno:"),
    ("2/day:", "2/giorno:"),
    ("3/day:", "3/giorno:"),
    ("1st level", "1° livello"),
    ("2nd level", "2° livello"),
    ("3rd level", "3° livello"),
    ("4th level", "4° livello"),
    ("5th level", "5° livello"),
    ("6th level", "6° livello"),
    ("7th level", "7° livello"),
    ("8th level", "8° livello"),
    ("9th level", "9° livello"),
]

TITLE_TRANSLATIONS = {
    "Multiattack": "Multiattacco",
    "Spellcasting": "Incantesimi",
    "Innate Spellcasting": "Incantesimi Innati",
    "Magic Resistance": "Resistenza alla Magia",
    "Magic Weapons": "Armi Magiche",
    "Legendary Resistance": "Resistenza Leggendaria",
    "Keen Hearing and Smell": "Udito e Olfatto Acuti",
    "Keen Sight": "Vista Acuta",
    "Keen Smell": "Olfatto Acuto",
    "Pack Tactics": "Tattiche di Branco",
    "Pounce": "Balzo",
    "Charge": "Carica",
    "Amphibious": "Anfibio",
    "Regeneration": "Rigenerazione",
    "Spider Climb": "Movimenti del Ragno",
    "Sunlight Sensitivity": "Sensibilita alla Luce del Sole",
    "Bite": "Morso",
    "Claw": "Artiglio",
    "Claws": "Artigli",
    "Slam": "Schianto",
    "Tail": "Coda",
    "Sting": "Pungiglione",
    "Hooves": "Zoccoli",
    "Horns": "Corna",
    "Beak": "Becco",
    "Talons": "Artigli",
    "Longsword": "Spada Lunga",
    "Shortsword": "Spada Corta",
    "Scimitar": "Scimitarra",
    "Dagger": "Pugnale",
    "Spear": "Lancia",
    "Javelin": "Giavellotto",
    "Longbow": "Arco Lungo",
    "Shortbow": "Arco Corto",
    "Club": "Randello",
    "Greatclub": "Randello Pesante",
    "Rock": "Roccia",
    "Fist": "Pugno",
    "Ray": "Raggio",
    "Teleport": "Teletrasporto",
    "Attack": "Attacco",
    "Move": "Movimento",
}

DAMAGE_TRANSLATIONS = {
    "acid": "acido",
    "bludgeoning": "contundenti",
    "cold": "da freddo",
    "fire": "da fuoco",
    "force": "da forza",
    "lightning": "da fulmine",
    "necrotic": "necrotici",
    "piercing": "perforanti",
    "poison": "da veleno",
    "psychic": "psichici",
    "radiant": "radiosi",
    "slashing": "taglienti",
    "thunder": "da tuono",
}

CONDITION_TRANSLATIONS = {
    "blinded": "accecato",
    "charmed": "affascinato",
    "deafened": "assordato",
    "exhaustion": "indebolimento",
    "frightened": "spaventato",
    "grappled": "afferrato",
    "incapacitated": "incapacitato",
    "invisible": "invisibile",
    "paralyzed": "paralizzato",
    "petrified": "pietrificato",
    "poisoned": "avvelenato",
    "prone": "prono",
    "restrained": "trattenuto",
    "stunned": "stordito",
    "unconscious": "privo di sensi",
}

SENSE_TRANSLATIONS = {
    "blindsight": "vista cieca",
    "darkvision": "scurovisione",
    "tremorsense": "percezione tellurica",
    "truesight": "vista pura",
    "passive Perception": "Percezione passiva",
}

LANGUAGE_TRANSLATIONS = {
    "Abyssal": "Abissale",
    "Aquan": "Aquan",
    "Auran": "Auran",
    "Celestial": "Celestiale",
    "Common": "Comune",
    "Deep Speech": "Gergo delle Profondita",
    "Draconic": "Draconico",
    "Dwarvish": "Nanico",
    "Elvish": "Elfico",
    "Giant": "Gigante",
    "Gnomish": "Gnomesco",
    "Goblin": "Goblin",
    "Ignan": "Ignan",
    "Infernal": "Infernale",
    "Orc": "Orchesco",
    "Primordial": "Primordiale",
    "Sylvan": "Silvano",
    "Terran": "Terran",
    "Undercommon": "Sottocomune",
    "telepathy": "telepatia",
    "understands": "comprende",
    "but can't speak": "ma non parla",
    "any one language": "un linguaggio qualsiasi",
    "any two languages": "due linguaggi qualsiasi",
    "all": "tutti",
    "all the languages it knew in life": "tutti i linguaggi che conosceva in vita",
    "the languages you speak": "i linguaggi che parli",
    "the languages it knew in life": "i linguaggi che conosceva in vita",
}

SPEED_TRANSLATIONS = {
    "fly": "volare",
    "swim": "nuotare",
    "climb": "scalare",
    "burrow": "scavare",
    "hover": "fluttuare",
    "when rolling": "quando rotola",
    "rolling downhill": "rotolando in discesa",
}

_SPELL_TRANSLATIONS = None
_SPELL_PATTERN = None


def normalize_spaces(value):
    value = str(value or "").replace("\u00a0", " ").replace("´", "'")
    return re.sub(r"\s+", " ", value).strip()


def slugify(value):
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return text or "monster"


def spell_translations():
    global _SPELL_TRANSLATIONS
    if _SPELL_TRANSLATIONS is not None:
        return _SPELL_TRANSLATIONS
    path = ROOT / "risorse" / "incantesimi" / "spells.json"
    translations = {}
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        for spell in data.values():
            name = normalize_spaces(spell.get("name"))
            name_en = normalize_spaces(spell.get("name_en"))
            if name and name_en:
                translations[name_en.lower()] = name
    _SPELL_TRANSLATIONS = translations
    return translations


def spell_pattern():
    global _SPELL_PATTERN
    if _SPELL_PATTERN is not None:
        return _SPELL_PATTERN
    keys = sorted(spell_translations(), key=len, reverse=True)
    if not keys:
        _SPELL_PATTERN = re.compile(r"a^")
    else:
        _SPELL_PATTERN = re.compile(r"(?<![A-Za-z])(" + "|".join(re.escape(key) for key in keys) + r")(?![A-Za-z])", re.I)
    return _SPELL_PATTERN


def meters_from_feet(value):
    meters = float(value) * 0.3
    if abs(meters - round(meters)) < 0.0001:
        return str(int(round(meters)))
    return f"{meters:.1f}".replace(".", ",")


def convert_feet_to_meters(value):
    text = str(value or "")
    text = re.sub(r"\b(\d+)O\s*ft\.?", lambda m: f"{m.group(1)}0 ft.", text)

    def range_repl(match):
        return f"{meters_from_feet(match.group(1))}/{meters_from_feet(match.group(2))} m"

    def foot_repl(match):
        suffix = "metri" if match.group(2) else "m"
        return f"{meters_from_feet(match.group(1))} {suffix}"

    text = re.sub(r"\b(\d+)\s*-\s*to\s+(\d+)\s*-\s*foot\b", lambda m: f"{meters_from_feet(m.group(1))}-{meters_from_feet(m.group(2))} metri", text, flags=re.I)
    text = re.sub(r"\b(\d+)\s*/\s*(\d+)\s*ft\.?", range_repl, text, flags=re.I)
    text = re.sub(r"\b(\d+)\s*-\s*foot\b", lambda m: f"{meters_from_feet(m.group(1))} metri", text, flags=re.I)
    text = re.sub(r"\b(\d+)\s*(feet|foot)\b", foot_repl, text, flags=re.I)
    text = re.sub(r"\b(\d+)\s*ft\.?", lambda m: f"{meters_from_feet(m.group(1))} m", text, flags=re.I)
    text = replace_case_insensitive(text, "every foot", "ogni 30 cm")
    text = replace_case_insensitive(text, "number of feet", "numero di metri")
    text = replace_case_insensitive(text, "feet", "metri")
    text = replace_case_insensitive(text, "foot", "30 cm")
    return text


def replace_case_insensitive(text, source, target):
    escaped = re.escape(source)
    if re.match(r"^\w", source) and re.search(r"\w$", source):
        pattern = rf"\b{escaped}\b"
    else:
        pattern = escaped
    return re.sub(pattern, target, text, flags=re.I)


def translate_spell_names(text):
    if not re.search(r"\b(spell|spells|spellcasting|Cantrips|At will|\d/day)\b", text, re.I):
        return text
    translations = spell_translations()
    return spell_pattern().sub(lambda match: translations.get(match.group(1).lower(), match.group(1)), text)


def translate_title(title):
    clean = normalize_spaces(title).rstrip(".")
    suffix = ""
    match = re.match(r"^(.+?)(\s*\([^)]*\))$", clean)
    if match:
        clean, suffix = match.groups()
    translated = TITLE_TRANSLATIONS.get(clean, clean)
    return f"{translated}{suffix}."


def translate_bold_titles(text):
    def repl(match):
        return f"**{translate_title(match.group(1))}**"

    return re.sub(r"\*\*([^*]+?)\.\*\*", repl, text)


def translate_saving_throws(text):
    def repl(match):
        ability = ABILITY_NAMES_IT.get(match.group(2), match.group(2))
        return f"tiro salvezza su {ability} CD {match.group(1)}"

    return re.sub(
        r"DC\s+(\d+)\s+(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+saving throw",
        repl,
        text,
        flags=re.I,
    )


def translate_word_map(text, mapping):
    result = text
    for source, target in sorted(mapping.items(), key=lambda item: len(item[0]), reverse=True):
        result = replace_case_insensitive(result, source, target)
    return result


def translate_damage_phrases(text):
    result = text
    for source, target in sorted(DAMAGE_TRANSLATIONS.items(), key=lambda item: len(item[0]), reverse=True):
        result = re.sub(
            rf"\b{re.escape(source)}\s+damage\b",
            f"danni {target}",
            result,
            flags=re.I,
        )
    return result


def translate_common_text(value):
    text = convert_feet_to_meters(str(value or ""))
    text = translate_spell_names(text)
    text = translate_bold_titles(text)
    text = translate_saving_throws(text)
    text = translate_damage_phrases(text)
    text = re.sub(r"\btakes? ([^.;]*?danni[^.;]*)", r"subisce \1", text, flags=re.I)
    text = re.sub(r"\btaking ([^.;]*?danni[^.;]*)", r"subendo \1", text, flags=re.I)
    for source, target in sorted(COMMON_TRANSLATIONS, key=lambda item: len(item[0]), reverse=True):
        text = replace_case_insensitive(text, source, target)
    text = translate_word_map(text, DAMAGE_TRANSLATIONS)
    text = translate_word_map(text, CONDITION_TRANSLATIONS)
    text = re.sub(r"\s+([,.;:)])", r"\1", text)
    text = re.sub(r"\(\s+", "(", text)
    return text


def translate_inline_field(value, mapping=None):
    text = convert_feet_to_meters(str(value or ""))
    if mapping:
        text = translate_word_map(text, mapping)
    text = translate_word_map(text, DAMAGE_TRANSLATIONS)
    text = translate_word_map(text, CONDITION_TRANSLATIONS)
    return text


def translate_monster(monster):
    monster["tipo_linea"] = translate_inline_field(monster.get("tipo_linea"), {**SIZE_IT, **TYPE_IT})
    monster["allineamento"] = translate_alignment_label(monster.get("allineamento"))
    monster["classe_armatura"] = translate_inline_field(monster.get("classe_armatura"), {"natural armor": "armatura naturale"})
    monster["punti_ferita"] = translate_inline_field(monster.get("punti_ferita"))
    monster["velocita"] = translate_inline_field(monster.get("velocita"), SPEED_TRANSLATIONS)
    monster["tiri_salvezza_testo"] = translate_saves_label(monster.get("tiri_salvezza_testo"))
    monster["abilita_testo"] = translate_skills_label(monster.get("abilita_testo"))
    monster["vulnerabilita_testo"] = translate_inline_field(monster.get("vulnerabilita_testo"))
    monster["resistenze_testo"] = translate_inline_field(monster.get("resistenze_testo"))
    monster["immunita_danni_testo"] = translate_inline_field(monster.get("immunita_danni_testo"))
    monster["immunita_condizioni_testo"] = translate_inline_field(monster.get("immunita_condizioni_testo"))
    monster["sensi"] = translate_inline_field(monster.get("sensi"), SENSE_TRANSLATIONS)
    monster["linguaggi"] = translate_inline_field(monster.get("linguaggi"), LANGUAGE_TRANSLATIONS)
    for key in ("tratti", "azioni", "azioni_bonus", "reazioni", "azioni_leggendarie", "azioni_mitiche", "azioni_tana"):
        monster[key] = translate_common_text(monster.get(key))
    return monster


def translate_alignment_label(value):
    clean = normalize_spaces(value)
    replacements = {
        "lawful good": "legale buono",
        "neutral good": "neutrale buono",
        "chaotic good": "caotico buono",
        "lawful neutral": "legale neutrale",
        "neutral evil": "neutrale malvagio",
        "lawful evil": "legale malvagio",
        "chaotic evil": "caotico malvagio",
        "chaotic neutral": "caotico neutrale",
        "neutral": "neutrale",
        "unaligned": "senza allineamento",
        "any alignment": "qualsiasi allineamento",
        "typically": "tipicamente",
        "usually": "solitamente",
    }
    result = clean
    for source, target in sorted(replacements.items(), key=lambda item: len(item[0]), reverse=True):
        result = replace_case_insensitive(result, source, target)
    return result


def translate_saves_label(value):
    text = normalize_spaces(value)
    for source, target in SAVE_IT.items():
        text = replace_case_insensitive(text, source, target)
    return text


def translate_skills_label(value):
    text = normalize_spaces(value)
    skills = {
        "Acrobatics": "Acrobazia",
        "Animal Handling": "Addestrare Animali",
        "Arcana": "Arcano",
        "Athletics": "Atletica",
        "Deception": "Inganno",
        "History": "Storia",
        "Insight": "Intuizione",
        "Intimidation": "Intimidire",
        "Investigation": "Indagare",
        "Medicine": "Medicina",
        "Nature": "Natura",
        "Perception": "Percezione",
        "Performance": "Intrattenere",
        "Persuasion": "Persuasione",
        "Religion": "Religione",
        "Sleight of Hand": "Rapidita di Mano",
        "Stealth": "Furtivita",
        "Survival": "Sopravvivenza",
    }
    return translate_word_map(text, skills)


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
        if match and current and not current.rstrip().endswith((".", "!", "?", ")", "]")):
            match = None
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
        return translate_monster(monster), "summon"

    return translate_monster(monster), "monster"


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
