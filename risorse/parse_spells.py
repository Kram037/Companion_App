"""Parser PDF -> JSON per gli incantesimi (con traduzione IT e sistema metrico).

Estrae i dati strutturati dai PDF in `risorse/` (trucchetti.pdf, livello1.pdf, ...)
e produce due file consumabili dal frontend:

- `risorse/spells.json`         (debug human-readable)
- `js/data/spells_data.js`      (oggetto `window.SPELLS_DATA`)

Caratteristiche:
- Nome italiano usato come ID (chiave). `name_en` mantiene il nome originale.
- Scuola, classi, casting time, range, durata, componenti tradotti automaticamente.
- Distanze convertite nel sistema metrico (5 ft = 1,5 m; 1 mile = 1,5 km).
- Descrizioni: per default in inglese con metriche convertite. Se in
  `risorse/spell_translations.json` esiste un override, viene usata la versione IT.
"""

import json
import re
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
RISORSE_DIR = ROOT / "risorse"

PDF_FILES = [
    RISORSE_DIR / "trucchetti.pdf",
    RISORSE_DIR / "livello1.pdf",
]

OUT_JSON = RISORSE_DIR / "spells.json"
OUT_JS = ROOT / "js" / "data" / "spells_data.js"
TRANSLATIONS_FILE = RISORSE_DIR / "spell_translations.json"

# ---------------------------------------------------------------------------
# Tabelle di traduzione
# ---------------------------------------------------------------------------

CLASS_NAMES = {
    "Bard", "Cleric", "Druid", "Sorcerer", "Warlock", "Wizard",
    "Artificer", "Paladin", "Ranger",
}

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

# Nomi italiani ufficiali D&D 5e (edizione italiana Asmodee).
SPELL_NAMES_IT = {
    # --- Trucchetti ---
    "Acid Splash": "Spruzzo Acido",
    "Blade Ward": "Custodia della Lama",
    "Booming Blade": "Lama Tonante",
    "Chill Touch": "Tocco Gelido",
    "Control Flames": "Controllare Fiamme",
    "Create Bonfire": "Creare Falò",
    "Dancing Lights": "Luci Danzanti",
    "Druidcraft": "Druidismo",
    "Eldritch Blast": "Colpo Occulto",
    "Fire Bolt": "Dardo Infuocato",
    "Friends": "Amicizia",
    "Frostbite": "Gelo",
    "Green-Flame Blade": "Lama di Fiamma Verde",
    "Guidance": "Guida",
    "Gust": "Folata di Vento",
    "Infestation": "Infestazione",
    "Light": "Luce",
    "Lightning Lure": "Frusta Folgorante",
    "Mage Hand": "Mano Magica",
    "Magic Stone": "Pietra Magica",
    "Mending": "Riparare",
    "Message": "Messaggio",
    "Mind Sliver": "Scheggia Mentale",
    "Minor Illusion": "Illusione Minore",
    "Mold Earth": "Modellare la Terra",
    "Poison Spray": "Spruzzo Velenoso",
    "Prestidigitation": "Prestidigitazione",
    "Primal Savagery": "Ferocia Primordiale",
    "Produce Flame": "Produrre Fiamma",
    "Ray of Frost": "Raggio di Gelo",
    "Resistance": "Resistenza",
    "Sacred Flame": "Fiamma Sacra",
    "Shape Water": "Modellare Acqua",
    "Shillelagh": "Shillelagh",
    "Shocking Grasp": "Folgorare",
    "Spare the Dying": "Risparmiare i Morenti",
    "Sword Burst": "Esplosione di Spade",
    "Thaumaturgy": "Taumaturgia",
    "Thorn Whip": "Frusta di Spine",
    "Thunderclap": "Tuono Fragoroso",
    "Toll the Dead": "Rintocco dei Morti",
    "True Strike": "Colpo Accurato",
    "Vicious Mockery": "Schernire",
    "Word of Radiance": "Parola della Luce",

    # --- Livello 1 ---
    "Absorb Elements": "Assorbire Elementi",
    "Animal Friendship": "Amicizia con gli Animali",
    "Armor of Agathys": "Armatura di Agathys",
    "Arms of Hadar": "Braccia di Hadar",
    "Bane": "Rovina",
    "Beast Bond": "Legame con la Bestia",
    "Bless": "Benedizione",
    "Burning Hands": "Mani Brucianti",
    "Catapult": "Catapulta",
    "Cause Fear": "Provocare Paura",
    "Chaos Bolt": "Dardo del Caos",
    "Charm Person": "Charme su Persona",
    "Chromatic Orb": "Sfera Cromatica",
    "Color Spray": "Spruzzo Colorato",
    "Command": "Ordine",
    "Compelled Duel": "Duello Forzato",
    "Create or Destroy Water": "Creare o Distruggere Acqua",
    "Cure Wounds": "Cura Ferite",
    "Detect Evil and Good": "Individuazione del Bene e del Male",
    "Disguise Self": "Camuffarsi",
    "Dissonant Whispers": "Sussurri Dissonanti",
    "Divine Favor": "Favore Divino",
    "Earth Tremor": "Tremito di Terra",
    "Ensnaring Strike": "Colpo Intrappolante",
    "Entangle": "Intralciare",
    "Expeditious Retreat": "Ritirata Veloce",
    "Faerie Fire": "Fuoco Fatato",
    "False Life": "Falsa Vita",
    "Feather Fall": "Caduta Morbida",
    "Fog Cloud": "Nube di Nebbia",
    "Goodberry": "Bacche Magiche",
    "Grease": "Grasso",
    "Guiding Bolt": "Dardo Guida",
    "Hail of Thorns": "Pioggia di Spine",
    "Healing Word": "Parola Guaritrice",
    "Hellish Rebuke": "Rimprovero Infernale",
    "Heroism": "Eroismo",
    "Hex": "Maledire",
    "Hunter's Mark": "Marchio del Cacciatore",
    "Ice Knife": "Lama di Ghiaccio",
    "Inflict Wounds": "Infliggere Ferite",
    "Jump": "Saltare",
    "Longstrider": "Falcata",
    "Mage Armor": "Armatura del Mago",
    "Magic Missile": "Dardo Incantato",
    "Protection from Evil and Good": "Protezione dal Bene e dal Male",
    "Ray of Sickness": "Raggio della Malattia",
    "Sanctuary": "Santuario",
    "Searing Smite": "Castigo Cocente",
    "Shield": "Scudo",
    "Shield of Faith": "Scudo della Fede",
    "Silent Image": "Immagine Silente",
    "Sleep": "Sonno",
    "Snare": "Trappola",
    "Tasha's Caustic Brew": "Intruglio Caustico di Tasha",
    "Tasha's Hideous Laughter": "Risata Atroce di Tasha",
    "Thunderous Smite": "Castigo Tonante",
    "Thunderwave": "Onda Tonante",
    "Witch Bolt": "Dardo Stregato",
    "Wrathful Smite": "Castigo Iracondo",
    "Zephyr Strike": "Colpo dello Zefiro",
}

# Casting time
CASTING_TIME_IT = {
    "1 action": "1 azione",
    "1 bonus action": "1 azione bonus",
    "1 reaction": "1 reazione",
    "1 minute": "1 minuto",
    "10 minutes": "10 minuti",
    "1 hour": "1 ora",
    "8 hours": "8 ore",
    "12 hours": "12 ore",
    "24 hours": "24 ore",
}

# Range fissi
RANGE_FIXED_IT = {
    "Self": "Incantatore",
    "Touch": "Contatto",
    "Sight": "Vista",
    "Special": "Speciale",
    "Unlimited": "Illimitata",
}

# Duration fisse
DURATION_FIXED_IT = {
    "Instantaneous": "Istantanea",
    "Special": "Speciale",
    "Until dispelled": "Finché non dissolto",
    "Until dispelled or triggered": "Finché non dissolto o attivato",
    "Permanent": "Permanente",
}

DURATION_UNIT_IT = {
    "round": "round",
    "rounds": "round",
    "minute": "minuto",
    "minutes": "minuti",
    "hour": "ora",
    "hours": "ore",
    "day": "giorno",
    "days": "giorni",
}

# Componenti: V/S/M restano, materiali tradotti dove possibile
COMPONENT_FIXED_IT = {
    "V": "V",
    "S": "S",
    "M": "M",
}

# ---------------------------------------------------------------------------
# Conversioni metriche
# ---------------------------------------------------------------------------

def feet_to_meters(feet: float) -> str:
    """Converte piedi in metri secondo lo standard D&D (5 ft = 1,5 m).
    Restituisce una stringa con virgola decimale italiana."""
    meters = feet * 0.3
    if abs(meters - round(meters)) < 0.01:
        return f"{int(round(meters))}"
    return f"{meters:.1f}".replace(".", ",").rstrip("0").rstrip(",") or "0"


def miles_to_km(miles: float) -> str:
    km = miles * 1.5
    if abs(km - round(km)) < 0.01:
        return f"{int(round(km))}"
    return f"{km:.1f}".replace(".", ",").rstrip("0").rstrip(",") or "0"


# Pattern come "5-foot", "60-foot", "10-foot-radius" -> conversione
_FOOT_HYPHEN_RE = re.compile(r"\b(\d+(?:\.\d+)?)\s*-\s*foot\b", re.IGNORECASE)
# Pattern come "60 feet", "5 feet"
_FEET_RE = re.compile(r"\b(\d+(?:\.\d+)?)\s+feet\b", re.IGNORECASE)
_FOOT_RE = re.compile(r"\b(\d+(?:\.\d+)?)\s+foot\b", re.IGNORECASE)
# Pattern miglia
_MILES_RE = re.compile(r"\b(\d+(?:\.\d+)?)\s+miles?\b", re.IGNORECASE)
# "1 inch" -> "2,5 cm" (raro ma capita)
_INCHES_RE = re.compile(r"\b(\d+(?:\.\d+)?)\s+inch(?:es)?\b", re.IGNORECASE)


def convert_distances(text: str) -> str:
    if not text:
        return text
    # "X-foot"
    text = _FOOT_HYPHEN_RE.sub(lambda m: f"{feet_to_meters(float(m.group(1)))} metri", text)
    # "X feet"
    text = _FEET_RE.sub(lambda m: f"{feet_to_meters(float(m.group(1)))} metri", text)
    # "X foot" residui
    text = _FOOT_RE.sub(lambda m: f"{feet_to_meters(float(m.group(1)))} metri", text)
    # "X miles" / "X mile"
    text = _MILES_RE.sub(lambda m: f"{miles_to_km(float(m.group(1)))} km", text)
    # "X inches"
    text = _INCHES_RE.sub(lambda m: f"{int(round(float(m.group(1)) * 2.54))} cm", text)
    return text


# ---------------------------------------------------------------------------
# Traduttori metadati
# ---------------------------------------------------------------------------

def translate_casting_time(s: str) -> str:
    if not s:
        return s
    base = s
    extra = ""
    if "," in s:
        base, extra = s.split(",", 1)
        base = base.strip()
        extra = extra.strip()
    base_l = base.lower()
    base_it = CASTING_TIME_IT.get(base_l, base)
    if extra:
        # es. "which you take when ..." -> proviamo a tradurre frasi comuni
        extra_it = extra
        extra_it = re.sub(r"^which you take when ", "che si compie quando ", extra_it, flags=re.IGNORECASE)
        extra_it = re.sub(r"^see below", "vedi sotto", extra_it, flags=re.IGNORECASE)
        return f"{base_it}, {extra_it}"
    return base_it


def translate_range(s: str) -> str:
    if not s:
        return s
    s_strip = s.strip()
    if s_strip in RANGE_FIXED_IT:
        return RANGE_FIXED_IT[s_strip]
    # "Self (X-foot ...)" o "Self (X-foot cone)"
    m = re.match(r"^Self\s*\((.+)\)$", s_strip, re.IGNORECASE)
    if m:
        inner = m.group(1)
        inner = convert_distances(inner)
        # Pattern del tipo "<num> metri <forma>" -> "<forma> di <num> metri[ di lato]"
        shape_map = {
            "cone": ("cono", ""),
            "cube": ("cubo", " di lato"),
            "sphere": ("sfera", " di raggio"),
            "hemisphere": ("emisfera", " di raggio"),
            "line": ("linea", ""),
            "radius": ("raggio", ""),
        }
        for en, (it, suffix) in shape_map.items():
            inner = re.sub(
                rf"(\d[\d,]*)\s*metri\s+{en}",
                lambda mo, it=it, suffix=suffix: f"{it} di {mo.group(1)} metri{suffix}",
                inner,
                flags=re.IGNORECASE,
            )
        return f"Incantatore ({inner})"
    # Distanze pure tipo "60 feet"
    return convert_distances(s_strip)


def translate_duration(s: str) -> str:
    if not s:
        return s
    s_strip = s.strip()
    if s_strip in DURATION_FIXED_IT:
        return DURATION_FIXED_IT[s_strip]
    # "Concentration, up to X minute(s)/hour(s)"
    m = re.match(r"^Concentration,\s*up to\s+(\d+)\s+(\w+)\s*$", s_strip, re.IGNORECASE)
    if m:
        n = m.group(1)
        unit = m.group(2).lower()
        unit_it = DURATION_UNIT_IT.get(unit, unit)
        return f"Concentrazione, fino a {n} {unit_it}"
    # "Up to X minute(s)/hour(s)"
    m = re.match(r"^Up to\s+(\d+)\s+(\w+)\s*$", s_strip, re.IGNORECASE)
    if m:
        n = m.group(1)
        unit = m.group(2).lower()
        unit_it = DURATION_UNIT_IT.get(unit, unit)
        return f"Fino a {n} {unit_it}"
    # "X minute(s)/hour(s)/day(s)/round(s)"
    m = re.match(r"^(\d+)\s+(\w+)\s*$", s_strip, re.IGNORECASE)
    if m:
        n = m.group(1)
        unit = m.group(2).lower()
        unit_it = DURATION_UNIT_IT.get(unit, unit)
        return f"{n} {unit_it}"
    return s_strip


def translate_components(s: str) -> str:
    """Mantiene V/S/M e traduce i materiali tra parentesi quando possibile."""
    if not s:
        return s
    # Estrai parte materiali
    m = re.match(r"^([VSM,\s]+)(?:\s*\((.+)\))?\s*$", s.strip())
    if not m:
        return s
    letters = m.group(1).strip()
    materials = m.group(2)
    out = letters
    if materials:
        # Traduzioni comuni di parole-chiave nei componenti materiali
        mat_it = materials
        replacements = [
            (r"\ba (?:tiny )?bit of\b", "un pizzico di"),
            (r"\ba pinch of\b", "un pizzico di"),
            (r"\ba small piece of\b", "un piccolo pezzo di"),
            (r"\ba piece of\b", "un pezzo di"),
            (r"\ba drop of\b", "una goccia di"),
            (r"\ba bit of\b", "un pezzetto di"),
            (r"\bsulfur\b", "zolfo"),
            (r"\bbat guano\b", "guano di pipistrello"),
            (r"\bphosphorus\b", "fosforo"),
            (r"\ba firefly\b", "una lucciola"),
            (r"\bglowworm\b", "verme luminoso"),
            (r"\bmistletoe\b", "vischio"),
            (r"\ba sprig of\b", "un rametto di"),
            (r"\bholly\b", "agrifoglio"),
            (r"\boak\b", "quercia"),
            (r"\bclub\b", "mazza"),
            (r"\bquarterstaff\b", "bastone ferrato"),
            (r"\bsmall feather\b", "piccola piuma"),
            (r"\bfeather\b", "piuma"),
            (r"\bfur\b", "pelliccia"),
            (r"\bfrom an animal\b", "di un animale"),
            (r"\bof leather\b", "di cuoio"),
            (r"\bleather\b", "cuoio"),
            (r"\bwool\b", "lana"),
            (r"\bsilver\b", "argento"),
            (r"\bgold\b", "oro"),
            (r"\bcopper\b", "rame"),
            (r"\biron\b", "ferro"),
            (r"\bsteel\b", "acciaio"),
            (r"\bcrystal\b", "cristallo"),
            (r"\bdiamond\b", "diamante"),
            (r"\bfine sand\b", "sabbia fine"),
            (r"\brose petals\b", "petali di rosa"),
            (r"\ba cricket\b", "un grillo"),
            (r"\bcricket\b", "grillo"),
            (r"\bthe petrified eye of a newt\b", "l'occhio pietrificato di un tritone"),
            (r"\beye of a newt\b", "occhio di tritone"),
            (r"\bpetrified\b", "pietrificato"),
            (r"\bjade\b", "giada"),
            (r"\bquartz\b", "quarzo"),
            (r"\bruby\b", "rubino"),
            (r"\bemerald\b", "smeraldo"),
            (r"\bsapphire\b", "zaffiro"),
            (r"\bdust\b", "polvere"),
            (r"\bash\b", "cenere"),
            (r"\bthorn\b", "spina"),
            (r"\bstring\b", "spago"),
            (r"\brope\b", "corda"),
            (r"\bwax\b", "cera"),
            (r"\bcandle\b", "candela"),
            (r"\bworth at least\b", "del valore di almeno"),
            (r"\bworth\b", "del valore di"),
            (r"\bthe spell consumes\b", "l'incantesimo consuma"),
            (r"\bconsumed by the spell\b", "consumato dall'incantesimo"),
            (r"\bwhich the spell consumes\b", "che l'incantesimo consuma"),
            (r"\bgp\b", "mo"),
            (r"\bsp\b", "ma"),
            (r"\bcp\b", "mr"),
            (r"\band\b", "e"),
            (r"\bor\b", "o"),
        ]
        for patt, repl in replacements:
            mat_it = re.sub(patt, repl, mat_it, flags=re.IGNORECASE)
        # converti distanze anche nei materiali
        mat_it = convert_distances(mat_it)
        out += f" ({mat_it})"
    return out


# ---------------------------------------------------------------------------
# Estrazione PDF
# ---------------------------------------------------------------------------

LEVEL_RE = re.compile(r"^level (\d+) - (\w+)$", re.IGNORECASE)
FOOTER_DATE_RE = re.compile(r"^\d{2}/\d{2}/\d{2},\s*\d{1,2}:\d{2}\s+List")
FOOTER_URL_RE = re.compile(r"^https?://")


def clean_text(line: str) -> str:
    return line.replace("\u00b4", "'").replace("´", "'").rstrip()


def extract_lines(pdf_path: Path) -> list[str]:
    reader = PdfReader(str(pdf_path))
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

        name_en = lines[i - 1]
        level = int(m.group(1))
        school = m.group(2).lower()

        casting_time = range_ = components = duration = ""
        meta_keys = ("Casting Time:", "Range:", "Components:", "Duration:")
        current_field: str | None = None
        j = i + 1
        # Aggrega le righe metadati: se la riga inizia con un prefisso noto,
        # cambiamo campo; altrimenti la riga è la continuazione del campo
        # corrente (es. componenti multi-riga). Ci fermiamo quando troviamo
        # 4 metadati o una riga senza prefisso che non è continuazione.
        seen_keys: set[str] = set()
        while j < n and len(seen_keys) < 4:
            ln = lines[j]
            matched = False
            for key in meta_keys:
                if ln.startswith(key):
                    current_field = key
                    seen_keys.add(key)
                    val = ln.split(":", 1)[1].strip()
                    if key == "Casting Time:":
                        casting_time = val
                    elif key == "Range:":
                        range_ = val
                    elif key == "Components:":
                        components = val
                    elif key == "Duration:":
                        duration = val
                    matched = True
                    break
            if not matched:
                if current_field is None:
                    break
                # continuazione del campo corrente
                if current_field == "Casting Time:":
                    casting_time = (casting_time + " " + ln).strip()
                elif current_field == "Range:":
                    range_ = (range_ + " " + ln).strip()
                elif current_field == "Components:":
                    components = (components + " " + ln).strip()
                elif current_field == "Duration:":
                    duration = (duration + " " + ln).strip()
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

        description_en = " ".join(desc_lines).strip()
        description_en = re.sub(r"\s+", " ", description_en)
        description_en = description_en.replace(" • ", "\n• ")

        spells.append({
            "_name_en_raw": name_en,
            "_level": level,
            "_school": school,
            "_casting_time_en": casting_time,
            "_range_en": range_,
            "_components_en": components,
            "_duration_en": duration,
            "_description_en": description_en,
            "_classes_en": classes,
            "_source": source,
        })

        i = j

    return spells


# ---------------------------------------------------------------------------
# Localizzazione + assemblaggio finale
# ---------------------------------------------------------------------------

def load_translations() -> dict:
    if TRANSLATIONS_FILE.exists():
        try:
            return json.loads(TRANSLATIONS_FILE.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"[WARN] Errore lettura {TRANSLATIONS_FILE.name}: {e}")
    return {}


def localize(spell_raw: dict, translations: dict) -> dict:
    name_en = spell_raw["_name_en_raw"]
    name_it = SPELL_NAMES_IT.get(name_en, name_en)

    description_en = spell_raw["_description_en"]
    # Descrizione in inglese ma con metriche convertite
    description_metric_en = convert_distances(description_en)

    # Override IT da file translations
    override = translations.get(name_en) or translations.get(name_it) or {}
    description_it = override.get("description")
    if not description_it:
        # fallback: stessa descrizione (inglese metricata) con note
        description_it = description_metric_en

    return {
        "name": name_it,
        "name_en": name_en,
        "level": spell_raw["_level"],
        "school": spell_raw["_school"],
        "school_it": SCHOOL_IT.get(spell_raw["_school"], spell_raw["_school"].capitalize()),
        "casting_time": translate_casting_time(spell_raw["_casting_time_en"]),
        "casting_time_en": spell_raw["_casting_time_en"],
        "range": translate_range(spell_raw["_range_en"]),
        "range_en": spell_raw["_range_en"],
        "components": translate_components(spell_raw["_components_en"]),
        "components_en": spell_raw["_components_en"],
        "duration": translate_duration(spell_raw["_duration_en"]),
        "duration_en": spell_raw["_duration_en"],
        "description": description_it,
        "description_en": description_en,
        "classes": [CLASS_IT.get(c, c) for c in spell_raw["_classes_en"]],
        "classes_en": spell_raw["_classes_en"],
        "source": spell_raw["_source"],
        "translated": bool(override.get("description")),
    }


def main():
    translations = load_translations()
    if translations:
        print(f"Caricati override traduzione per {len(translations)} incantesimi")

    all_spells: list[dict] = []
    for pdf in PDF_FILES:
        if not pdf.exists():
            print(f"[skip] {pdf.name} non trovato")
            continue
        lines = extract_lines(pdf)
        raw = parse_spells(lines)
        loc = [localize(s, translations) for s in raw]
        all_spells.extend(loc)
        print(f"[{pdf.name}] estratti {len(loc)} incantesimi")

    # Dedup per nome italiano (priorità all'ultimo)
    by_id: dict[str, dict] = {}
    for s in all_spells:
        by_id[s["name"]] = s

    print(f"Totale incantesimi: {len(by_id)}")
    translated = sum(1 for s in by_id.values() if s["translated"])
    print(f"Con descrizione tradotta: {translated} / {len(by_id)}")

    OUT_JSON.write_text(
        json.dumps(by_id, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    js_payload = json.dumps(by_id, ensure_ascii=False, indent=2)
    OUT_JS.write_text(
        "/* Auto-generato da risorse/parse_spells.py - non modificare a mano */\n"
        f"window.SPELLS_DATA = Object.assign(window.SPELLS_DATA || {{}}, {js_payload});\n",
        encoding="utf-8",
    )

    print(f"Scritto: {OUT_JSON.relative_to(ROOT)}")
    print(f"Scritto: {OUT_JS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
