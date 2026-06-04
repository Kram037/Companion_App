from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "js" / "Compendio" / "data" / "equipaggiamento_data.js"
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


def js_assign(name, value):
    return f"window.{name} = {json.dumps(value, ensure_ascii=False, indent=2)};"


def main():
    adventuring = convert_numbers(parse_pipe_table(ADVENTURING_GEAR, ["nome", "categoria", "costo", "costo_mo", "peso", "fonte"]))
    tools = convert_numbers(parse_pipe_table(TOOLS, ["nome", "categoria", "costo", "costo_mo", "peso", "fonte"]))
    metals = parse_pipe_table(METALS, ["nome", "categoria", "fonte"])
    gems = convert_numbers(parse_pipe_table(GEMS, ["nome", "valore", "valore_mo", "descrizione", "fonte"]))
    herbs = parse_herbs()
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
        "}());\n",
        encoding="utf-8",
    )
    print(f"wrote {OUT}")
    print(f"adventuring={len(adventuring)} tools={len(tools)} herbs={len(herbs)} metals={len(metals)} gems={len(gems)}")


if __name__ == "__main__":
    main()
