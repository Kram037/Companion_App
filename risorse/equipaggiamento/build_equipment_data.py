from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "js" / "Compendio" / "data" / "equipaggiamento_data.js"
REALMS_GEMS_FILE = ROOT / "risorse" / "equipaggiamento" / "realms_gems.json"
HERBS_TXT = ROOT / "risorse" / "erbe" / "erbe_extracted.txt"
HERBS_PDF = ROOT / "risorse" / "erbe" / "erbe.pdf"


ADVENTURING_GEAR = """
nome|categoria|costo|costo_mo|peso|fonte
Abaco|Equipaggiamento generale|2 mo|2|1 kg|PHB p. 150
Acido (fiala)|Consumabili|25 mo|25|0,5 kg|PHB p. 150
Acqua santa (ampolla)|Consumabili|25 mo|25|0,5 kg|PHB p. 150
Aghi da cerbottana (50)|Munizioni|1 mo|1|0,5 kg|PHB p. 150
Ampolla|Contenitori|2 mo|2|0,5 kg|PHB p. 150
Antitossina (fiala)|Consumabili|50 mo|50|-|PHB p. 150
Ariete portatile|Equipaggiamento generale|4 mo|4|17,5 kg|PHB p. 150
Attrezzatura da pesca|Equipaggiamento generale|1 mo|1|2 kg|PHB p. 150
Barile|Contenitori|2 mo|2|35 kg|PHB p. 150
Bilancia da mercante|Equipaggiamento generale|5 mo|5|1,5 kg|PHB p. 150
Borsa|Contenitori|5 ma|0.5|0,5 kg|PHB p. 150
Borsa per componenti|Equipaggiamento generale|25 mo|25|1 kg|PHB p. 150
Bottiglia di vetro|Contenitori|2 mo|2|1 kg|PHB p. 150
Brocca o caraffa|Contenitori|2 mr|0.02|2 kg|PHB p. 150
Campanella|Equipaggiamento generale|1 mo|1|-|PHB p. 150
Candela|Fuochi e illuminazione|1 mr|0.01|-|PHB p. 150
Cannocchiale|Equipaggiamento generale|1000 mo|1000|0,5 kg|PHB p. 150
Carrucola e paranco|Equipaggiamento generale|1 mo|1|2,5 kg|PHB p. 150
Carta (un foglio)|Scrittura|2 ma|0.2|-|PHB p. 150
Cassa|Contenitori|5 mo|5|12,5 kg|PHB p. 150
Catena (3 metri)|Equipaggiamento generale|5 mo|5|5 kg|PHB p. 150
Cera per sigilli|Scrittura|5 ma|0.5|-|PHB p. 150
Cestino|Contenitori|4 ma|0.4|1 kg|PHB p. 150
Chiodo da rocciatore|Corde e scalata|5 mr|0.05|0,1 kg|PHB p. 150
Clessidra|Equipaggiamento generale|25 mo|25|0,5 kg|PHB p. 150
Coperta|Equipaggiamento generale|5 ma|0.5|1,5 kg|PHB p. 150
Corda di canapa (15 metri)|Corde e scalata|1 mo|1|5 kg|PHB p. 150
Corda di seta (15 metri)|Corde e scalata|10 mo|10|2,5 kg|PHB p. 150
Cristallo|Focus arcano|10 mo|10|0,5 kg|PHB p. 150
Custodia per mappe o pergamene|Contenitori|1 mo|1|0,5 kg|PHB p. 150
Custodia per quadrelli da balestra|Contenitori|1 mo|1|0,5 kg|PHB p. 150
Emblema|Simbolo sacro|5 mo|5|-|PHB p. 150
Faretra|Contenitori|1 mo|1|0,5 kg|PHB p. 150
Fiala|Contenitori|1 mo|1|-|PHB p. 150
Fiasca o boccale|Contenitori|2 mr|0.02|0,5 kg|PHB p. 150
Fischietto da segnalazione|Equipaggiamento generale|5 mr|0.05|-|PHB p. 150
Frecce (20)|Munizioni|1 mo|1|0,5 kg|PHB p. 150
Fuoco dell'alchimista (ampolla)|Consumabili|50 mo|50|0,5 kg|PHB p. 150
Gavetta|Equipaggiamento generale|2 ma|0.2|0,5 kg|PHB p. 150
Gessetto (1 pezzo)|Scrittura|1 mr|0.01|-|PHB p. 150
Giaciglio|Equipaggiamento generale|1 mo|1|3,5 kg|PHB p. 150
Globo|Focus arcano|20 mo|20|1,5 kg|PHB p. 150
Inchiostro (ampolla da 30 g)|Scrittura|10 mo|10|-|PHB p. 150
Kit da arrampicata|Corde e scalata|25 mo|25|6 kg|PHB p. 150
Kit da guaritore|Kit|5 mo|5|1,5 kg|PHB p. 150
Libro|Scrittura|25 mo|25|2,5 kg|PHB p. 150
Libro degli incantesimi|Scrittura|50 mo|50|1,5 kg|PHB p. 150
Lampada|Fuochi e illuminazione|5 ma|0.5|0,5 kg|PHB p. 150
Lanterna a lente sporgente|Fuochi e illuminazione|10 mo|10|1 kg|PHB p. 150
Lanterna schermabile|Fuochi e illuminazione|5 mo|5|1 kg|PHB p. 150
Lente d'ingrandimento|Equipaggiamento generale|100 mo|100|-|PHB p. 150
Manette|Equipaggiamento generale|2 mo|2|3 kg|PHB p. 150
Martello|Equipaggiamento generale|1 mo|1|1,5 kg|PHB p. 150
Martello da demolizione|Equipaggiamento generale|2 mo|2|5 kg|PHB p. 150
Olio (ampolla)|Consumabili|1 ma|0.1|0,5 kg|PHB p. 150
Otre|Contenitori|2 ma|0.2|2,5 kg|PHB p. 150
Acciarino e pietra focaia|Fuochi e illuminazione|5 ma|0.5|0,5 kg|PHB p. 150
Bacchetta|Focus arcano|10 mo|10|0,5 kg|PHB p. 150
Bacchetta di tasso|Focus druidico|10 mo|10|0,5 kg|PHB p. 150
Bastone|Focus arcano|5 mo|5|2 kg|PHB p. 150
Bastone di legno|Focus druidico|5 mo|5|2 kg|PHB p. 150
Penna|Scrittura|2 mr|0.02|-|PHB p. 150
Piede di porco|Equipaggiamento generale|2 mo|2|2,5 kg|PHB p. 150
Pala|Equipaggiamento generale|2 mo|2|2,5 kg|PHB p. 150
Pallini da fionda (20)|Munizioni|4 mr|0.04|0,75 kg|PHB p. 150
Palo (3 metri)|Equipaggiamento generale|5 mr|0.05|3,5 kg|PHB p. 150
Pergamena (un foglio)|Scrittura|1 ma|0.1|-|PHB p. 150
Pentola di ferro|Equipaggiamento generale|2 mo|2|5 kg|PHB p. 150
Piccone da minatore|Equipaggiamento generale|2 mo|2|5 kg|PHB p. 150
Pietra per affilare|Equipaggiamento generale|1 mr|0.01|0,5 kg|PHB p. 150
Pozione di guarigione|Consumabili|50 mo|50|0,25 kg|PHB p. 150
Profumo (fiala)|Equipaggiamento generale|5 mo|5|-|PHB p. 150
Quadrelli da balestra (20)|Munizioni|1 mo|1|0,75 kg|PHB p. 150
Rametto di vischio|Focus druidico|1 mo|1|-|PHB p. 150
Rampino|Corde e scalata|2 mo|2|2 kg|PHB p. 150
Razioni (1 giorno)|Consumabili|5 ma|0.5|1 kg|PHB p. 150
Reliquiario|Simbolo sacro|5 mo|5|1 kg|PHB p. 150
Vesti|Abiti|1 mo|1|2 kg|PHB p. 150
Sacco|Contenitori|1 mr|0.01|0,25 kg|PHB p. 150
Sapone|Equipaggiamento generale|2 mr|0.02|-|PHB p. 150
Scala (3 metri)|Equipaggiamento generale|1 ma|0.1|12,5 kg|PHB p. 150
Secchio|Contenitori|5 mr|0.05|1 kg|PHB p. 150
Serratura|Equipaggiamento generale|10 mo|10|0,5 kg|PHB p. 150
Sfere metalliche (1000)|Equipaggiamento generale|1 mo|1|1 kg|PHB p. 150
Sigillo ad anello|Equipaggiamento generale|5 mo|5|-|PHB p. 150
Simbolo sacro - amuleto|Simbolo sacro|5 mo|5|0,5 kg|PHB p. 150
Specchio d'acciaio|Equipaggiamento generale|5 mo|5|0,25 kg|PHB p. 150
Spuntoni di ferro (10)|Equipaggiamento generale|1 mo|1|2,5 kg|PHB p. 150
Tagliola|Equipaggiamento generale|5 mo|5|12,5 kg|PHB p. 150
Tenda per due persone|Equipaggiamento generale|2 mo|2|10 kg|PHB p. 150
Torcia|Fuochi e illuminazione|1 mr|0.01|0,5 kg|PHB p. 150
Totem|Focus druidico|1 mo|1|-|PHB p. 150
Triboli (20)|Equipaggiamento generale|1 mo|1|1 kg|PHB p. 150
Veleno base (fiala)|Consumabili|100 mo|100|-|PHB p. 150
Verga|Focus arcano|10 mo|10|1 kg|PHB p. 150
Vestiti comuni|Abiti|5 ma|0.5|1,5 kg|PHB p. 150
Vestiti da costume|Abiti|5 mo|5|2 kg|PHB p. 150
Vestiti da viaggiatore|Abiti|2 mo|2|2 kg|PHB p. 150
Vestiti pregiati|Abiti|15 mo|15|3 kg|PHB p. 150
Zaino|Contenitori|2 mo|2|2,5 kg|PHB p. 150
"""


TOOLS = """
nome|categoria|costo|costo_mo|peso|fonte
Arnesi da alchimista|Strumenti da artigiano|50 mo|50|4 kg|PHB p. 154
Arnesi da caligrafo|Strumenti da artigiano|10 mo|10|2,5 kg|PHB p. 154
Arnesi da cartografo|Strumenti da artigiano|15 mo|15|3 kg|PHB p. 154
Arnesi da conciatore|Strumenti da artigiano|5 mo|5|2,5 kg|PHB p. 154
Arnesi da fabbro|Strumenti da artigiano|20 mo|20|4 kg|PHB p. 154
Arnesi da falegname|Strumenti da artigiano|8 mo|8|3 kg|PHB p. 154
Arnesi da gioielliere|Strumenti da artigiano|25 mo|25|1 kg|PHB p. 154
Arnesi da intagliatore|Strumenti da artigiano|1 mo|1|2,5 kg|PHB p. 154
Arnesi da inventore|Strumenti da artigiano|50 mo|50|5 kg|PHB p. 154
Arnesi da muratore|Strumenti da artigiano|10 mo|10|4 kg|PHB p. 154
Arnesi da pittore|Strumenti da artigiano|10 mo|10|2,5 kg|PHB p. 154
Arnesi da scassinatore|Altri strumenti|25 mo|25|0,5 kg|PHB p. 154
Arnesi da soffiatore di vetro|Strumenti da artigiano|30 mo|30|2,5 kg|PHB p. 154
Arnesi da vasaio|Strumenti da artigiano|10 mo|10|1,5 kg|PHB p. 154
Arnesi per falsificare|Altri strumenti|15 mo|15|2,5 kg|PHB p. 154
Corno|Strumento musicale|3 mo|3|1 kg|PHB p. 154
Cornamusa|Strumento musicale|30 mo|30|3 kg|PHB p. 154
Flauto|Strumento musicale|2 mo|2|0,5 kg|PHB p. 154
Flauto di Pan|Strumento musicale|12 mo|12|1 kg|PHB p. 154
Giochi da dadi|Set da gioco|1 ma|0.1|-|PHB p. 154
Liuto|Strumento musicale|35 mo|35|1 kg|PHB p. 154
Lira|Strumento musicale|30 mo|30|1 kg|PHB p. 154
Mazzo di carte|Set da gioco|5 ma|0.5|-|PHB p. 154
Scacchi dei draghi|Set da gioco|1 mo|1|0,25 kg|PHB p. 154
Scacciapensieri|Strumento musicale|2 mo|2|0,5 kg|PHB p. 154
Strumenti da birraio|Strumenti da artigiano|20 mo|20|4,5 kg|PHB p. 154
Strumenti da calzolaio|Strumenti da artigiano|5 mo|5|2,5 kg|PHB p. 154
Strumenti da cuoco|Strumenti da artigiano|1 mo|1|4 kg|PHB p. 154
Strumenti da navigatore|Altri strumenti|25 mo|25|1 kg|PHB p. 154
Strumenti da tessitore|Strumenti da artigiano|1 mo|1|2,5 kg|PHB p. 154
Tamburo|Strumento musicale|6 mo|6|1,5 kg|PHB p. 154
Tric trac dei tre draghi|Set da gioco|1 mo|1|-|PHB p. 154
Trousse da avvelenatore|Altri strumenti|50 mo|50|1 kg|PHB p. 154
Trousse da erborista|Altri strumenti|5 mo|5|1,5 kg|PHB p. 154
Trousse da truccatore|Altri strumenti|25 mo|25|1,5 kg|PHB p. 154
Salterio|Strumento musicale|25 mo|25|5 kg|PHB p. 154
Viola|Strumento musicale|30 mo|30|0,5 kg|PHB p. 154
"""


METALS = """
Adamant|Metallo|Forgotten Realms Wiki
Adamantine|Metallo|Forgotten Realms Wiki
Arambarium|Metallo|Forgotten Realms Wiki
Arandur|Metallo|Forgotten Realms Wiki
Arjale|Metallo|Forgotten Realms Wiki
Baatorian green steel|Metallo|Forgotten Realms Wiki
Barium|Metallo|Forgotten Realms Wiki
Brass|Metallo|Forgotten Realms Wiki
Brightsilver|Metallo|Forgotten Realms Wiki
Bronze|Metallo|Forgotten Realms Wiki
Celestial steel|Metallo|Forgotten Realms Wiki
Chromium|Metallo|Forgotten Realms Wiki
Cobalt|Metallo|Forgotten Realms Wiki
Cold iron|Metallo|Forgotten Realms Wiki
Copper|Metallo|Forgotten Realms Wiki
Dajavva|Metallo|Forgotten Realms Wiki
Darksteel|Metallo|Forgotten Realms Wiki
Dlarun|Metallo|Forgotten Realms Wiki
Electrum|Metallo|Forgotten Realms Wiki
Elven steel|Metallo|Forgotten Realms Wiki
Favored mineral|Metallo|Forgotten Realms Wiki
Gold|Metallo|Forgotten Realms Wiki
Hellthorn|Metallo|Forgotten Realms Wiki
Hizagkuur|Metallo|Forgotten Realms Wiki
Illithium|Metallo|Forgotten Realms Wiki
Infernal iron|Metallo|Forgotten Realms Wiki
Iron|Metallo|Forgotten Realms Wiki
Ironfell|Metallo|Forgotten Realms Wiki
Lead|Metallo|Forgotten Realms Wiki
Lithium|Metallo|Forgotten Realms Wiki
Magnesium|Metallo|Forgotten Realms Wiki
Manganese|Metallo|Forgotten Realms Wiki
Mercury|Metallo|Forgotten Realms Wiki
Mithral|Metallo|Forgotten Realms Wiki
Molybdenum|Metallo|Forgotten Realms Wiki
Nickel|Metallo|Forgotten Realms Wiki
Orcslayer|Metallo|Forgotten Realms Wiki
Palladium|Metallo|Forgotten Realms Wiki
Pewter|Metallo|Forgotten Realms Wiki
Platinum|Metallo|Forgotten Realms Wiki
Pyrohydram|Metallo|Forgotten Realms Wiki
Silver|Metallo|Forgotten Realms Wiki
Slag|Metallo|Forgotten Realms Wiki
Solanian truesteel|Metallo|Forgotten Realms Wiki
Star metal|Metallo|Forgotten Realms Wiki
Steel|Metallo|Forgotten Realms Wiki
Tantulhor|Metallo|Forgotten Realms Wiki
Telstang|Metallo|Forgotten Realms Wiki
Tin|Metallo|Forgotten Realms Wiki
Titanium|Metallo|Forgotten Realms Wiki
Titansteel|Metallo|Forgotten Realms Wiki
Whitesteel|Metallo|Forgotten Realms Wiki
Wootz steel|Metallo|Forgotten Realms Wiki
Zardazil|Metallo|Forgotten Realms Wiki
Zinc|Metallo|Forgotten Realms Wiki
Zirconium|Metallo|Forgotten Realms Wiki
"""


GEMS = """
Azurite|10 mo|10|mottled deep blue|Roll20 Gemstones
Banded agate|10 mo|10|striped brown, blue, white, or red|Roll20 Gemstones
Blue quartz|10 mo|10|pale blue|Roll20 Gemstones
Eye agate|10 mo|10|circles of gray, white, brown, blue, or green|Roll20 Gemstones
Hematite|10 mo|10|gray black|Roll20 Gemstones
Lapis lazuli|10 mo|10|light and dark blue with yellow flecks|Roll20 Gemstones
Malachite|10 mo|10|striated light and dark green|Roll20 Gemstones
Moss agate|10 mo|10|pink or yellow white with mossy gray or green markings|Roll20 Gemstones
Obsidian|10 mo|10|black|Roll20 Gemstones
Rhodochrosite|10 mo|10|light pink|Roll20 Gemstones
Tiger eye|10 mo|10|brown with golden center|Roll20 Gemstones
Turquoise|10 mo|10|light blue green|Roll20 Gemstones
Bloodstone|50 mo|50|dark gray with red flecks|Roll20 Gemstones
Carnelian|50 mo|50|orange to red brown|Roll20 Gemstones
Chalcedony|50 mo|50|white|Roll20 Gemstones
Chrysoprase|50 mo|50|green|Roll20 Gemstones
Citrine|50 mo|50|pale yellow brown|Roll20 Gemstones
Jasper|50 mo|50|blue, black, or brown|Roll20 Gemstones
Moonstone|50 mo|50|white with pale-blue glow|Roll20 Gemstones
Onyx|50 mo|50|bands of black and white, or pure black or white|Roll20 Gemstones
Quartz|50 mo|50|white, smoky gray, or yellow|Roll20 Gemstones
Sardonyx|50 mo|50|bands of red and white|Roll20 Gemstones
Star rose quartz|50 mo|50|rosy stone with white star-shaped center|Roll20 Gemstones
Zircon|50 mo|50|pale blue green|Roll20 Gemstones
Amber|100 mo|100|watery gold to rich gold|Roll20 Gemstones
Amethyst|100 mo|100|deep purple|Roll20 Gemstones
Chrysoberyl|100 mo|100|yellow green to pale green|Roll20 Gemstones
Coral|100 mo|100|crimson|Roll20 Gemstones
Garnet|100 mo|100|red, brown green, or violet|Roll20 Gemstones
Jade|100 mo|100|light green, deep green, or white|Roll20 Gemstones
Jet|100 mo|100|deep black|Roll20 Gemstones
Pearl|100 mo|100|lustrous white, yellow, or pink|Roll20 Gemstones
Spinel|100 mo|100|red, red brown, or deep green|Roll20 Gemstones
Tourmaline|100 mo|100|pale green, blue, brown, or red|Roll20 Gemstones
Alexandrite|500 mo|500|dark green|Roll20 Gemstones
Aquamarine|500 mo|500|pale blue green|Roll20 Gemstones
Black pearl|500 mo|500|pure black|Roll20 Gemstones
Blue spinel|500 mo|500|deep blue|Roll20 Gemstones
Peridot|500 mo|500|rich olive green|Roll20 Gemstones
Topaz|500 mo|500|golden yellow|Roll20 Gemstones
Black opal|1000 mo|1000|dark green with black mottling and golden flecks|Roll20 Gemstones
Blue sapphire|1000 mo|1000|medium blue|Roll20 Gemstones
Emerald|1000 mo|1000|deep bright green|Roll20 Gemstones
Fire opal|1000 mo|1000|fiery red|Roll20 Gemstones
Opal|1000 mo|1000|pale blue with green and golden mottling|Roll20 Gemstones
Star ruby|1000 mo|1000|ruby with white star-shaped center|Roll20 Gemstones
Star sapphire|1000 mo|1000|blue sapphire with white star-shaped center|Roll20 Gemstones
Yellow sapphire|1000 mo|1000|fiery yellow or yellow green|Roll20 Gemstones
Black sapphire|5000 mo|5000|lustrous black with glowing highlights|Roll20 Gemstones
Diamond|5000 mo|5000|blue white, canary, pink, brown, or blue|Roll20 Gemstones
Jacinth|5000 mo|5000|fiery orange|Roll20 Gemstones
Ruby|5000 mo|5000|clear red to deep crimson|Roll20 Gemstones
"""


def parse_pipe_table(text, fields):
    rows = []
    for raw in text.strip().splitlines():
        if not raw.strip() or raw.startswith("nome|"):
            continue
        values = [part.strip() for part in raw.split("|")]
        rows.append({field: values[idx] if idx < len(values) else "" for idx, field in enumerate(fields)})
    return rows


def parse_herbs():
    if HERBS_TXT.exists():
        text = HERBS_TXT.read_text(encoding="utf-8")
    else:
        from pypdf import PdfReader
        reader = PdfReader(str(HERBS_PDF))
        text = "\n\n".join((page.extract_text() or "") for page in reader.pages)

    lines = text.splitlines()
    rows = []
    skip = {"DnD 5 Herbs", "Recueil des plantes d´AideDD"}
    i = 0
    while i < len(lines) - 2:
        name = lines[i].strip()
        meta = lines[i + 1].strip()
        detail = lines[i + 2].strip()
        is_name = re.match(r"^[A-Za-z][A-Za-z À-ÿ'’.-]+$", name)
        if (
            name
            and name not in skip
            and not name.startswith(("23/", "https://"))
            and is_name
            and re.search(r" - \d+ po$", meta)
            and detail.startswith("↪")
        ):
            match = re.match(r"(.+?) \((.+?)\) - (\d+) po$", meta)
            parts = [part.strip() for part in detail.replace("↪", "").strip().split(" - ")]
            rows.append({
                "nome": name,
                "categoria": match.group(1),
                "preparazione": match.group(2),
                "costo": f"{match.group(3)} mo",
                "costo_mo": int(match.group(3)),
                "parte": parts[0] if len(parts) > 0 else "",
                "ambiente": parts[1] if len(parts) > 1 else "",
                "stagione": parts[2] if len(parts) > 2 else "",
                "fonte": "AideDD Herbs",
            })
            i += 3
        else:
            i += 1
    return rows


def convert_numbers(rows):
    for row in rows:
        for key in ("costo_mo", "valore_mo"):
            if key in row:
                try:
                    row[key] = float(row[key]) if "." in str(row[key]) else int(row[key])
                except ValueError:
                    pass
    return rows


HERB_CATEGORY_IT = {
    "altering": "Alterante",
    "antipoison": "Antiveleno",
    "boost": "Potenziamento",
    "curative": "Curativa",
    "fortifying": "Fortificante",
}

HERB_PREPARATION_IT = {
    "maceration": "Macerazione",
    "decoction": "Decotto",
    "infusion": "Infuso",
    "direct absorption": "Assorbimento diretto",
}

HERB_PART_IT = {
    "bark": "Corteccia",
    "mushroom": "Fungo",
    "plant": "Pianta",
    "roots": "Radici",
}

HERB_ENVIRONMENT_IT = {
    "arctic": "Artico",
    "coast": "Costa",
    "desert": "Deserto",
    "forest": "Foresta",
    "grassland": "Prateria",
    "mountain": "Montagna",
    "swamp": "Palude",
    "underdark": "Sottosuolo",
}

HERB_SEASON_IT = {
    "spring": "Primavera",
    "summer": "Estate",
    "fall": "Autunno",
    "winter": "Inverno",
}

HERB_CATEGORY_DETAIL_IT = {
    "Alterante": "Erba alchemica con effetti alteranti, pensata per preparazioni che modificano lo stato del bersaglio o della mistura.",
    "Antiveleno": "Erba utile in preparazioni contro tossine, veleni o contaminazioni naturali.",
    "Potenziamento": "Erba impiegata per preparazioni che rafforzano o amplificano temporaneamente una capacita'.",
    "Curativa": "Erba destinata a preparazioni curative, lenitive o di recupero.",
    "Fortificante": "Erba usata per preparazioni fortificanti, adatte a sostenere il corpo o resistere a condizioni difficili.",
}

ADVENTURING_DESCRIPTIONS = {
    "Acido (fiala)": "Liquido corrosivo contenuto in una fiala, utile come consumabile alchemico o materiale per situazioni di emergenza.",
    "Acqua santa (ampolla)": "Acqua consacrata conservata in un'ampolla, spesso usata contro creature empie o non morte.",
    "Antitossina (fiala)": "Preparato da bere che aiuta a resistere agli effetti dei veleni per un breve periodo.",
    "Ariete portatile": "Trave rinforzata impugnata da piu' creature per sfondare porte e barriere.",
    "Borsa per componenti": "Piccola borsa impermeabile con scomparti per componenti materiali degli incantesimi.",
    "Candela": "Piccola fonte di luce da viaggio, lenta da consumare e facile da trasportare.",
    "Cannocchiale": "Strumento ottico prezioso per osservare bersagli e luoghi lontani.",
    "Carrucola e paranco": "Sistema di funi e carrucole che facilita il sollevamento di carichi pesanti.",
    "Corda di canapa (15 metri)": "Corda robusta e comune per scalare, legare o assicurare carichi.",
    "Corda di seta (15 metri)": "Corda leggera e resistente, piu' costosa della canapa.",
    "Fuoco dell'alchimista (ampolla)": "Sostanza appiccicosa che prende fuoco a contatto con l'aria.",
    "Giaciglio": "Rotolo da viaggio per dormire all'aperto o in accampamento.",
    "Kit da arrampicata": "Imbracatura, chiodi e attrezzatura pensati per rendere piu' sicura una scalata.",
    "Kit da guaritore": "Borsa con bende, unguenti e stecche per stabilizzare una creatura ferita.",
    "Lampada": "Fonte di luce alimentata a olio, adatta a illuminare una piccola area.",
    "Lanterna a lente sporgente": "Lanterna che concentra la luce in un fascio piu' lungo e diretto.",
    "Lanterna schermabile": "Lanterna con schermi mobili che permettono di coprire rapidamente la luce.",
    "Lente d'ingrandimento": "Lente utile per ispezionare dettagli minuti e accendere piccoli fuochi con la luce solare.",
    "Manette": "Coppia di vincoli metallici con serratura, pensati per trattenere una creatura.",
    "Olio (ampolla)": "Olio combustibile impiegato per lampade o come materiale improvvisato.",
    "Piede di porco": "Leva di metallo utile per forzare porte, casse o oggetti incastrati.",
    "Pozione di guarigione": "Pozione magica minore che ripristina punti ferita quando viene bevuta.",
    "Rampino": "Gancio metallico legato a una corda, utile per ancorarsi o superare ostacoli.",
    "Razioni (1 giorno)": "Cibo secco e compatto sufficiente per una giornata di viaggio.",
    "Serratura": "Serratura standard con chiave, usata per chiudere bauli, porte o contenitori.",
    "Sfere metalliche (1000)": "Piccole sfere sparse a terra per rendere difficile il movimento.",
    "Tagliola": "Trappola meccanica a molla che si chiude sulla creatura che la calpesta.",
    "Torcia": "Fonte di luce semplice e consumabile, adatta all'esplorazione.",
    "Triboli (20)": "Chiodi a quattro punte da spargere a terra per rallentare o ferire chi passa.",
    "Veleno base (fiala)": "Veleno comune applicabile ad armi perforanti o taglienti.",
    "Zaino": "Contenitore da viaggio con spazio per equipaggiamento essenziale.",
}

ADVENTURING_CATEGORY_DESCRIPTIONS = {
    "Abiti": "Indumenti e vestiario per viaggio, scena o occasioni formali.",
    "Consumabili": "Oggetto consumabile da usare una volta o in poche applicazioni.",
    "Contenitori": "Oggetto pensato per contenere, trasportare o proteggere materiale.",
    "Corde e scalata": "Equipaggiamento utile per arrampicarsi, fissarsi o superare ostacoli verticali.",
    "Focus arcano": "Focus usabile da un incantatore arcano come tramite per gli incantesimi.",
    "Focus druidico": "Focus naturale usabile da un druido come tramite per gli incantesimi.",
    "Fuochi e illuminazione": "Equipaggiamento per illuminare, accendere o gestire una fonte di fuoco.",
    "Kit": "Kit pratico con strumenti dedicati a una funzione specifica.",
    "Munizioni": "Munizioni per armi a distanza o da lancio.",
    "Scrittura": "Materiali per scrivere, registrare informazioni o sigillare documenti.",
    "Simbolo sacro": "Simbolo religioso usabile come focus sacro.",
}

GEM_TRANSLATIONS = {
    "Alexandrite": ("Alessandrite", "verde scuro"),
    "Amber": ("Ambra", "dorata, da tenue ad intensa"),
    "Amethyst": ("Ametista", "viola intenso"),
    "Aquamarine": ("Acquamarina", "verde-blu pallido"),
    "Azurite": ("Azzurrite", "blu intenso screziato"),
    "Banded agate": ("Agata fasciata", "striata di marrone, blu, bianco o rosso"),
    "Black opal": ("Opale nero", "verde scuro con screziature nere e pagliuzze dorate"),
    "Black pearl": ("Perla nera", "nero puro"),
    "Black sapphire": ("Zaffiro nero", "nero lucente con riflessi luminosi"),
    "Bloodstone": ("Eliotropio", "grigio scuro con pagliuzze rosse"),
    "Blue quartz": ("Quarzo blu", "blu pallido"),
    "Blue sapphire": ("Zaffiro blu", "blu medio"),
    "Blue spinel": ("Spinello blu", "blu intenso"),
    "Carnelian": ("Corniola", "dall'arancione al rosso-marrone"),
    "Chalcedony": ("Calcedonio", "bianco"),
    "Chrysoberyl": ("Crisoberillo", "dal giallo-verde al verde pallido"),
    "Chrysoprase": ("Crisoprasio", "verde"),
    "Citrine": ("Citrino", "giallo-marrone pallido"),
    "Coral": ("Corallo", "cremisi"),
    "Diamond": ("Diamante", "bianco-blu, canarino, rosa, marrone o blu"),
    "Emerald": ("Smeraldo", "verde brillante intenso"),
    "Eye agate": ("Agata occhio", "cerchi grigi, bianchi, marroni, blu o verdi"),
    "Fire opal": ("Opale di fuoco", "rosso fiamma"),
    "Garnet": ("Granato", "rosso, marrone-verde o violetto"),
    "Hematite": ("Ematite", "nero grigiastro"),
    "Jacinth": ("Giacinto", "arancione fiamma"),
    "Jade": ("Giada", "verde chiaro, verde intenso o bianco"),
    "Jasper": ("Diaspro", "blu, nero o marrone"),
    "Jet": ("Giaietto", "nero intenso"),
    "Lapis lazuli": ("Lapislazzuli", "blu chiaro e scuro con pagliuzze gialle"),
    "Malachite": ("Malachite", "verde chiaro e scuro striato"),
    "Moonstone": ("Pietra di luna", "bianca con bagliore azzurro pallido"),
    "Moss agate": ("Agata muschiata", "bianco rosato o giallastro con segni grigi o verdi"),
    "Obsidian": ("Ossidiana", "nera"),
    "Onyx": ("Onice", "fasce nere e bianche, oppure nero o bianco puro"),
    "Opal": ("Opale", "blu pallido con screziature verdi e dorate"),
    "Pearl": ("Perla", "bianco, giallo o rosa lucente"),
    "Peridot": ("Peridoto", "verde oliva intenso"),
    "Quartz": ("Quarzo", "bianco, grigio fumoso o giallo"),
    "Rhodochrosite": ("Rodocrosite", "rosa chiaro"),
    "Ruby": ("Rubino", "rosso limpido fino al cremisi intenso"),
    "Sardonyx": ("Sardonica", "fasce rosse e bianche"),
    "Spinel": ("Spinello", "rosso, rosso-marrone o verde intenso"),
    "Star rose quartz": ("Quarzo rosa stellato", "rosa con centro bianco a forma di stella"),
    "Star ruby": ("Rubino stellato", "rubino con centro bianco a forma di stella"),
    "Star sapphire": ("Zaffiro stellato", "zaffiro blu con centro bianco a forma di stella"),
    "Tiger eye": ("Occhio di tigre", "marrone con centro dorato"),
    "Topaz": ("Topazio", "giallo dorato"),
    "Tourmaline": ("Tormalina", "verde pallido, blu, marrone o rossa"),
    "Turquoise": ("Turchese", "verde-blu chiaro"),
    "Yellow sapphire": ("Zaffiro giallo", "giallo fiamma o verde-giallo"),
    "Zircon": ("Zircone", "verde-blu pallido"),
}

REALMS_GEMS = [
    {
        "id": "realms-chardalyn",
        "nome": "Chardalyn",
        "costo": "1.000-8.000 mo",
        "costo_mo": 8000,
        "tipo_gemma": "reame",
        "fonte": "Forgotten Realms Wiki",
        "fonte_url": "https://forgottenrealms.fandom.com/wiki/Chardalyn",
        "descrizione": "Sostanza rara dei Reami, di colore nero e fragile come vetro. I frammenti piu' grandi erano preziosi per la loro affinita' naturale con la magia.",
        "potere": "Puo' assorbire un singolo incantesimo e rilasciarlo quando la pietra viene frantumata o distrutta. Una chardalyn vuota puo' assorbire anche magie nell'area, mentre una gia' carica non accetta altri incantesimi.",
    },
    {
        "id": "realms-bloodstone",
        "nome": "Pietra sanguigna",
        "costo": "50 mo",
        "costo_mo": 50,
        "tipo_gemma": "reame",
        "fonte": "Forgotten Realms Wiki",
        "fonte_url": "https://forgottenrealms.fandom.com/wiki/Bloodstone",
        "descrizione": "Calcedonio verde-grigio con inclusioni rosse simili a gocce di sangue. Nei Reami veniva lavorato spesso come cabochon o in barre marcate da casate nobili.",
        "potere": "Premuta su una ferita aperta, puo' coagulare il sangue, chiudere la ferita e rimuovere malattie del sangue o veleni senza ripristinare punti ferita. La gemma si dissolve dopo l'uso e lo stesso bersaglio non ne beneficia di nuovo prima di un ciclo lunare.",
    },
    {
        "id": "realms-emerald",
        "nome": "Smeraldo",
        "costo": "1.000 mo",
        "costo_mo": 1000,
        "tipo_gemma": "reame",
        "fonte": "Forgotten Realms Wiki",
        "fonte_url": "https://forgottenrealms.fandom.com/wiki/Emerald",
        "descrizione": "Gemma verde che si sfalda facilmente lungo linee ortogonali, motivo per cui viene spesso tagliata in forma rettangolare. Le tonalita' piu' limpide e brillanti sono le piu' pregiate.",
        "potere": "Associato a salute, fertilita' e crescita. Intero o in polvere, e' usato in dispositivi e lavorazioni magiche di guarigione, crescita, portali e teletrasporto. Secondo la tradizione, puo' incrinarsi in presenza di tradimento o inganno.",
    },
    {
        "id": "realms-sapphire",
        "nome": "Zaffiro",
        "costo": "1.000 mo",
        "costo_mo": 1000,
        "tipo_gemma": "reame",
        "fonte": "Forgotten Realms Wiki",
        "fonte_url": "https://forgottenrealms.fandom.com/wiki/Sapphire",
        "descrizione": "Varieta' rara di corindone, trovata in tonalita' dal blu pallido all'azzurro intenso. La colorazione blu vivida puo' essere ottenuta anche tramite trattamento ad altissime temperature.",
        "potere": "La tradizione dei Reami lo collega a perizia magica, mente ed elemento aria. Puo' attenuare paura, rabbia, disperazione o follia indotte magicamente e, come componente, favorisce durata ed effetto iniziale delle magie.",
    },
    {
        "id": "realms-ruby",
        "nome": "Rubino",
        "costo": "5.000 mo",
        "costo_mo": 5000,
        "tipo_gemma": "reame",
        "fonte": "Forgotten Realms Wiki",
        "fonte_url": "https://forgottenrealms.fandom.com/wiki/Ruby",
        "descrizione": "Varieta' di corindone che va da tonalita' quasi incolori al cremisi profondo. Piu' il colore e' scuro e piu' la pietra e' priva di inclusioni, maggiore e' il suo valore.",
        "potere": "In polvere potenzia oggetti personali legati a abilita', resistenza o fortuna, e puo' essere usato in inchiostri magici. Rubini lavorati sono apprezzati in oggetti di guarigione e, con rituali adeguati, possono proteggere da fulmini e terremoti.",
    },
    {
        "id": "realms-diamond",
        "nome": "Diamante",
        "costo": "5.000 mo",
        "costo_mo": 5000,
        "tipo_gemma": "reame",
        "fonte": "Forgotten Realms Wiki",
        "fonte_url": "https://forgottenrealms.fandom.com/wiki/Diamond",
        "descrizione": "Gemma estremamente dura, traslucida o trasparente, spesso tagliata a faccette per rifrangere la luce. E' preziosa anche come materiale per incidere e realizzare utensili da taglio o perforazione molto fini.",
        "potere": "Ha affinita' con divinazione, vista e localizzazione. Polvere e frammenti di diamante sono utili in inchiostri, immersioni magiche, neutralizzazione o creazione di veleni, protezioni contro charme e influssi psionici.",
    },
    {
        "id": "realms-moonstone",
        "nome": "Pietra di luna",
        "costo": "50 mo",
        "costo_mo": 50,
        "tipo_gemma": "reame",
        "fonte": "Forgotten Realms Wiki",
        "fonte_url": "https://forgottenrealms.fandom.com/wiki/Moonstone",
        "descrizione": "Feldspato opaco e bianco con riflessi lattiginosi e blu quando viene lucidato. E' comune in gioielleria e nelle tradizioni religiose legate alla luna.",
        "potere": "Assorbe la luce e puo' brillare debolmente al buio dopo lo spegnimento delle fonti luminose. La polvere puo' sostituire componenti non organiche in alcune magie di abiurazione ed evocazione, se dosata con ricerca accurata.",
    },
]

MAGIC_ITEM_RARITY_RANGES = {
    "Comune": "50-100 mo",
    "Non comune": "101-500 mo",
    "Raro": "501-5.000 mo",
    "Molto raro": "5.001-50.000 mo",
    "Planare/leggendario": "50.001+ mo",
}

PRECIOUS_METAL_EQUIVALENCES = {
    "Copper": "1 mr = 1/10 ma, 1/50 me, 1/100 mo, 1/1000 mp",
    "Silver": "1 ma = 10 mr, 1/5 me, 1/10 mo, 1/100 mp",
    "Electrum": "1 me = 50 mr, 5 ma, 1/2 mo, 1/20 mp",
    "Gold": "1 mo = 100 mr, 10 ma, 2 me, 1/10 mp",
    "Platinum": "1 mp = 1000 mr, 100 ma, 50 me, 10 mo",
}

METAL_PROPERTIES = {
    "Adamantine": "In gioco e' utile per armature e oggetti quasi impossibili da danneggiare: un'armatura di adamantio trasforma i colpi critici subiti in colpi normali. La sua durezza rende costrutti, porte o catene in adamantio difficili da rompere senza strumenti o armi adeguate; la lavorazione richiede fornaci e temperature eccezionali.",
    "Adamant": "Versione leggendaria o nome alternativo legato a materiali quasi indistruttibili. Usalo come metallo da ricompensa epica, componente per sigilli, serrature, catene o nuclei di costrutti.",
    "Mithral": "Metallo leggero e resistente, ideale per armature piu' maneggevoli e oggetti raffinati. In molte campagne riduce ingombro e rumorosita', rendendolo prezioso per esploratori e incantatori corazzati.",
    "Silver": "L'argento e' il riferimento piu' comune per armi argentate: molte creature soprannaturali, come alcuni immondi, non morti o mutaforma, sono piu' vulnerabili o aggirano meno facilmente armi rivestite d'argento.",
    "Iron": "Il ferro resta il materiale pratico di riferimento per armi, armature, chiodi, catene e strumenti. E' comune, riparabile quasi ovunque e utile come base per descrivere equipaggiamento non prezioso.",
    "Cold iron": "Ferro lavorato a freddo o con tecniche tradizionali, spesso usato nelle leggende contro fate e creature extraplanari. E' un buon materiale speciale quando vuoi distinguere armi rituali o anti-folletto.",
    "Bronze": "Lega antica e resistente alla corrosione, utile per armi e armature di culture arcaiche, statue, campane e oggetti cerimoniali.",
    "Copper": "Il rame e' soprattutto valuta e metallo comune per conduttori, utensili, finiture e componenti alchemiche semplici.",
    "Electrum": "L'elettro e' una lega naturale o artificiale di oro e argento, adatta a monete, gioielli e tesori dall'aspetto antico.",
    "Gold": "L'oro e' morbido, prezioso e molto lavorabile: e' ideale per monete, intarsi, reliquiari, gioielli e ricompense riconoscibili.",
    "Platinum": "Il platino e' piu' raro e prestigioso dell'oro, adatto a tesori di alto rango, monete pregiate e componenti rituali ricercate.",
    "Infernal iron": "Metallo infernale legato ai Piani Inferiori, perfetto per armi, macchine da guerra e contratti diabolici. Trattalo come materiale raro o narrativo piu' che merce comune.",
    "Celestial steel": "Acciaio celestiale adatto a reliquie, armi sacre e protezioni contro creature empie. Funziona bene come ricompensa collegata a templi, ordini sacri o piani superiori.",
    "Baatorian green steel": "Acciaio verde infernale, utile per equipaggiamento diabolico o mercati planari. Il colore e l'origine lo rendono subito riconoscibile come materiale non comune.",
}

METAL_TRANSLATIONS = {
    "Adamant": ("Adamante", "Variabile", "Metallo estremamente duro, associato a lavorazioni leggendarie e materiali quasi indistruttibili."),
    "Adamantine": ("Adamantio", "Variabile", "Lega rara e durissima, usata per armature e armi capaci di resistere a colpi devastanti."),
    "Arambarium": ("Arambarium", "Variabile", "Metallo raro dei Reami, ricercato per lavorazioni speciali e oggetti preziosi."),
    "Arandur": ("Arandur", "Variabile", "Lega minerale rara, apprezzata per robustezza e lavorazioni arcane."),
    "Arjale": ("Arjale", "Variabile", "Metallo esotico, adatto a comparire come materiale raro in tesori o componenti speciali."),
    "Baatorian green steel": ("Acciaio verde baatoriano", "Variabile", "Acciaio infernale dal colore verde, legato a forgia planare e manufatti dei Piani Inferiori."),
    "Barium": ("Bario", "Variabile", "Metallo comune nella realta', utile come riferimento minerario o materiale alchemico."),
    "Brass": ("Ottone", "Variabile", "Lega di rame e zinco, usata per finiture, strumenti e componenti decorativi."),
    "Brightsilver": ("Argento brillante", "Variabile", "Metallo prezioso e luminoso, adatto a gioielli, ornamenti e oggetti cerimoniali."),
    "Bronze": ("Bronzo", "Variabile", "Lega resistente di rame e stagno, comune in armi, armature antiche e decorazioni."),
    "Celestial steel": ("Acciaio celestiale", "Variabile", "Acciaio raro di origine celestiale, ideale per reliquie o armi sacre."),
    "Chromium": ("Cromo", "Variabile", "Metallo duro e lucente, utile per rivestimenti e dettagli resistenti."),
    "Cobalt": ("Cobalto", "Variabile", "Metallo bluastro, prezioso per pigmenti, leghe e componenti speciali."),
    "Cold iron": ("Ferro freddo", "Variabile", "Ferro lavorato con tecniche particolari, spesso associato a efficacia contro creature fatate o innaturali."),
    "Copper": ("Rame", "Variabile", "Metallo comune, duttile e diffuso in monete, utensili e componenti."),
    "Dajavva": ("Dajavva", "Variabile", "Metallo raro dei Reami, utile come materiale esotico per forgia o tesori."),
    "Darksteel": ("Acciaio scuro", "Variabile", "Metallo scuro e resistente, adatto a equipaggiamenti rari e manufatti minacciosi."),
    "Dlarun": ("Dlarun", "Variabile", "Metallo raro e pallido, usato in lavorazioni speciali e oggetti di pregio."),
    "Electrum": ("Elettro", "Variabile", "Lega naturale o artificiale di oro e argento, usata anche per monete e gioielli."),
    "Elven steel": ("Acciaio elfico", "Variabile", "Acciaio raffinato di tradizione elfica, leggero ed elegante nelle lavorazioni."),
    "Favored mineral": ("Minerale favorito", "Variabile", "Minerale speciale legato a tradizioni o luoghi specifici dei Reami."),
    "Gold": ("Oro", "Variabile", "Metallo prezioso per eccellenza, usato per monete, gioielli e decorazioni."),
    "Hellthorn": ("Spina infernale", "Variabile", "Materiale infernale raro, adatto a oggetti sinistri o componenti planari."),
    "Hizagkuur": ("Hizagkuur", "Variabile", "Metallo raro dei Reami, spesso trattato come materiale speciale per forgia avanzata."),
    "Illithium": ("Illithium", "Variabile", "Metallo raro dal nome legato agli illithid, utile per oggetti psionici o misteriosi."),
    "Infernal iron": ("Ferro infernale", "Variabile", "Ferro dei Piani Inferiori, associato a macchine, armi e manufatti infernali."),
    "Iron": ("Ferro", "Variabile", "Metallo comune e fondamentale per armi, armature, utensili e costruzioni."),
    "Ironfell": ("Ironfell", "Variabile", "Metallo raro e pesante, adatto a tesori minerari e leghe speciali."),
    "Lead": ("Piombo", "Variabile", "Metallo pesante e malleabile, usato in pesi, sigilli e schermature."),
    "Lithium": ("Litio", "Variabile", "Metallo leggero, utile come materiale raro in contesti alchemici o tecnologici."),
    "Magnesium": ("Magnesio", "Variabile", "Metallo leggero e reattivo, interessante per lavorazioni alchemiche."),
    "Manganese": ("Manganese", "Variabile", "Metallo usato in leghe e pigmenti, utile come risorsa mineraria."),
    "Mercury": ("Mercurio", "Variabile", "Metallo liquido a temperatura ordinaria, importante in alchimia e rituali."),
    "Mithral": ("Mithral", "Variabile", "Metallo raro, leggero e resistente, ricercato per armature e oggetti di pregio."),
    "Molybdenum": ("Molibdeno", "Variabile", "Metallo resistente, utile in leghe robuste e applicazioni specialistiche."),
    "Nickel": ("Nichel", "Variabile", "Metallo resistente alla corrosione, usato in leghe e finiture."),
    "Orcslayer": ("Ammazzaorchi", "Variabile", "Metallo o lega dal nome marziale, adatto a manufatti pensati per la guerra."),
    "Palladium": ("Palladio", "Variabile", "Metallo prezioso e raro, utile per gioielli e componenti di alto valore."),
    "Pewter": ("Peltro", "Variabile", "Lega tenera e comune, usata in stoviglie, contenitori e piccoli oggetti."),
    "Platinum": ("Platino", "Variabile", "Metallo prezioso molto raro, usato per tesori, gioielli e oggetti nobili."),
    "Pyrohydram": ("Pyrohydram", "Variabile", "Metallo esotico dal nome legato al fuoco, adatto a forgia magica o planare."),
    "Silver": ("Argento", "Variabile", "Metallo prezioso usato per monete, gioielli e armi argentate."),
    "Slag": ("Scoria", "Variabile", "Residuo di fusione, utile come materiale grezzo o dettaglio di forgia."),
    "Solanian truesteel": ("Vero acciaio solaniano", "Variabile", "Acciaio raro di origine celestiale, adatto a reliquie e manufatti puri."),
    "Star metal": ("Metallo stellare", "Variabile", "Metallo meteorico, raro e ricercato per armi o oggetti straordinari."),
    "Steel": ("Acciaio", "Variabile", "Lega comune di ferro, base per molte armi, armature e utensili."),
    "Tantulhor": ("Tantulhor", "Variabile", "Metallo raro dei Reami, utile come materiale esotico o componente prezioso."),
    "Telstang": ("Telstang", "Variabile", "Metallo raro e flessibile, adatto a lavorazioni speciali."),
    "Tin": ("Stagno", "Variabile", "Metallo tenero, spesso impiegato in leghe come il bronzo."),
    "Titanium": ("Titanio", "Variabile", "Metallo resistente e leggero, adatto a leghe avanzate."),
    "Titansteel": ("Acciaio titanico", "Variabile", "Lega potente e rara, adatta a equipaggiamenti eccezionali."),
    "Whitesteel": ("Acciaio bianco", "Variabile", "Acciaio raro e chiaro, adatto a oggetti eleganti o sacri."),
    "Wootz steel": ("Acciaio wootz", "Variabile", "Acciaio pregiato noto per qualita' e venature, ideale per lame raffinate."),
    "Zardazil": ("Zardazil", "Variabile", "Metallo raro dei Reami, adatto a tesori e materiali speciali."),
    "Zinc": ("Zinco", "Variabile", "Metallo comune impiegato in leghe, rivestimenti e piccoli oggetti."),
    "Zirconium": ("Zirconio", "Variabile", "Metallo resistente e raro, utile in leghe pregiate o componenti speciali."),
}

METAL_COST_RANGES = {
    "Barium": "Comune",
    "Brass": "Comune",
    "Bronze": "Comune",
    "Chromium": "Comune",
    "Cobalt": "Comune",
    "Copper": "Comune",
    "Iron": "Comune",
    "Lead": "Comune",
    "Lithium": "Comune",
    "Magnesium": "Comune",
    "Manganese": "Comune",
    "Molybdenum": "Comune",
    "Nickel": "Comune",
    "Pewter": "Comune",
    "Slag": "Comune",
    "Steel": "Comune",
    "Tin": "Comune",
    "Titanium": "Comune",
    "Zinc": "Comune",
    "Zirconium": "Comune",
    "Electrum": "Prezioso",
    "Gold": "Prezioso",
    "Palladium": "Prezioso",
    "Platinum": "Prezioso",
    "Silver": "Prezioso",
    "Adamant": "Molto raro",
    "Adamantine": "Molto raro",
    "Cold iron": "Raro",
    "Mithral": "Molto raro",
    "Star metal": "Molto raro",
    "Arambarium": "Raro",
    "Arandur": "Raro",
    "Arjale": "Raro",
    "Brightsilver": "Raro",
    "Dajavva": "Raro",
    "Darksteel": "Raro",
    "Dlarun": "Raro",
    "Elven steel": "Raro",
    "Favored mineral": "Raro",
    "Hizagkuur": "Raro",
    "Illithium": "Raro",
    "Ironfell": "Raro",
    "Orcslayer": "Raro",
    "Pyrohydram": "Raro",
    "Tantulhor": "Raro",
    "Telstang": "Raro",
    "Titansteel": "Raro",
    "Whitesteel": "Raro",
    "Wootz steel": "Raro",
    "Zardazil": "Raro",
    "Baatorian green steel": "Planare/leggendario",
    "Celestial steel": "Planare/leggendario",
    "Hellthorn": "Planare/leggendario",
    "Infernal iron": "Planare/leggendario",
    "Solanian truesteel": "Planare/leggendario",
}

METAL_COST_DETAILS = {
    "Comune": "materiale acquistabile come merce comune; il prezzo dipende soprattutto da peso, purezza e forma lavorata.",
    "Prezioso": "materiale prezioso; il valore cresce molto in base a purezza, peso e lavorazione, come per lingotti, monete e gioielli.",
    "Raro": "materiale raro; di norma richiede mercati specializzati, miniere specifiche o contatti artigianali.",
    "Molto raro": "materiale molto raro; il costo e' normalmente alto e spesso legato a disponibilita' locale, segreti di forgia o componenti magici.",
    "Planare/leggendario": "materiale planare o leggendario; il prezzo non e' standardizzato e di solito viene gestito come ricompensa, componente unico o trattativa narrativa.",
}


def translate_joined(value, mapping):
    parts = [part.strip() for part in str(value or "").split(",") if part.strip()]
    return ", ".join(mapping.get(part.lower(), part) for part in parts)


def enrich_adventuring(rows):
    for row in rows:
        row["descrizione"] = ADVENTURING_DESCRIPTIONS.get(row.get("nome"), ADVENTURING_CATEGORY_DESCRIPTIONS.get(row.get("categoria"), ""))
    return rows


def enrich_herbs(rows):
    for row in rows:
        row["categoria"] = HERB_CATEGORY_IT.get(str(row.get("categoria", "")).lower(), row.get("categoria", ""))
        row["preparazione"] = HERB_PREPARATION_IT.get(str(row.get("preparazione", "")).lower(), row.get("preparazione", ""))
        row["parte"] = HERB_PART_IT.get(str(row.get("parte", "")).lower(), row.get("parte", ""))
        row["ambiente"] = translate_joined(row.get("ambiente"), HERB_ENVIRONMENT_IT)
        row["stagione"] = translate_joined(row.get("stagione"), HERB_SEASON_IT)
        row["descrizione"] = HERB_CATEGORY_DETAIL_IT.get(row.get("categoria"), "Erba catalogata dal PDF delle erbe.")
    return rows


def enrich_gems(rows):
    for row in rows:
        name, description = GEM_TRANSLATIONS.get(row.get("nome"), (row.get("nome"), row.get("descrizione", "")))
        row["nome"] = name
        row["descrizione"] = description
        row["tipo_gemma"] = "tesoro"
        row["gruppo"] = row.get("valore")
    return rows


def metal_cost_label(range_label):
    money = MAGIC_ITEM_RARITY_RANGES.get(range_label)
    return f"{range_label} ({money})" if money else range_label


def enrich_metals(rows):
    for row in rows:
        original_name = row.get("nome")
        name, cost, description = METAL_TRANSLATIONS.get(
            original_name,
            (original_name, "Variabile", "Metallo o lega rara, utile come materiale speciale o componente di tesori."),
        )
        range_label = "Prezioso" if original_name in PRECIOUS_METAL_EQUIVALENCES else METAL_COST_RANGES.get(original_name, cost if cost != "Variabile" else "Raro")
        cost_label = PRECIOUS_METAL_EQUIVALENCES.get(original_name) or metal_cost_label(range_label)
        detail = METAL_COST_DETAILS.get(range_label, METAL_COST_DETAILS["Raro"])
        properties = METAL_PROPERTIES.get(original_name, "")
        row["nome"] = name
        row["costo"] = cost_label
        row["rarita"] = range_label
        row["costo_dettaglio"] = detail
        row["descrizione"] = f"{description} {properties}".strip()
        row.pop("categoria", None)
    return rows


def js_assign(name, value):
    return f"window.{name} = {json.dumps(value, ensure_ascii=False, indent=2)};"


def load_realms_gems():
    gems = []
    if REALMS_GEMS_FILE.exists():
        gems = json.loads(REALMS_GEMS_FILE.read_text(encoding="utf-8"))
    by_id = {gem.get("id"): gem for gem in gems if gem.get("id")}
    for gem in REALMS_GEMS:
        by_id[gem["id"]] = gem
    return sorted(by_id.values(), key=lambda item: str(item.get("nome", "")).lower())


def main():
    adventuring = enrich_adventuring(convert_numbers(parse_pipe_table(ADVENTURING_GEAR, ["nome", "categoria", "costo", "costo_mo", "peso", "fonte"])))
    tools = convert_numbers(parse_pipe_table(TOOLS, ["nome", "categoria", "costo", "costo_mo", "peso", "fonte"]))
    metals = enrich_metals(parse_pipe_table(METALS, ["nome", "categoria", "fonte"]))
    gems = enrich_gems(convert_numbers(parse_pipe_table(GEMS, ["nome", "valore", "valore_mo", "descrizione", "fonte"])))
    realms_gems = load_realms_gems()
    herbs = enrich_herbs(parse_herbs())
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        "// Dati tabellari del Compendio > Equipaggiamento.\n"
        "// Generato da risorse/equipaggiamento/build_equipment_data.py.\n"
        "(function() {\n"
        f"{js_assign('COMP_ADVENTURING_GEAR_DATA', adventuring)}\n"
        f"{js_assign('COMP_TOOLS_DATA', tools)}\n"
        f"{js_assign('COMP_HERBS_DATA', herbs)}\n"
        f"{js_assign('COMP_METALS_DATA', metals)}\n"
        f"{js_assign('COMP_GEMS_DATA', gems)}\n"
        f"{js_assign('COMP_REALMS_GEMS_DATA', realms_gems)}\n"
        "}());\n",
        encoding="utf-8",
    )
    print(f"wrote {OUT}")
    print(f"adventuring={len(adventuring)} tools={len(tools)} herbs={len(herbs)} metals={len(metals)} gems={len(gems)} realms_gems={len(realms_gems)}")


if __name__ == "__main__":
    main()
