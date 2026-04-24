"""Parser PDF -> JSON per gli incantesimi (con traduzione IT e sistema metrico).

Estrae i dati strutturati dai PDF in `risorse/incantesimi/` (trucchetti.pdf,
livello1.pdf, ..., livello9.pdf) e produce due file consumabili dal frontend:

- `risorse/incantesimi/spells.json`   (debug human-readable)
- `js/data/spells_data.js`            (oggetto `window.SPELLS_DATA`)

Caratteristiche:
- Nome italiano usato come ID (chiave). `name_en` mantiene il nome originale.
- Scuola, classi, casting time, range, durata, componenti tradotti automaticamente.
- Distanze convertite nel sistema metrico (5 ft = 1,5 m; 1 mile = 1,5 km).
- Descrizioni: per default in inglese con metriche convertite. Se in
  `risorse/incantesimi/spell_translations.json` esiste un override, viene usata
  la versione IT.
"""

import json
import re
from pathlib import Path
from pypdf import PdfReader

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

PDF_FILES = [HERE / "trucchetti.pdf"] + [
    HERE / f"livello{n}.pdf" for n in range(1, 10)
]

OUT_JSON = HERE / "spells.json"
OUT_JS = ROOT / "js" / "data" / "spells_data.js"
TRANSLATIONS_FILE = HERE / "spell_translations.json"

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

# Nomi italiani ufficiali D&D 5e (PHB/XGtE/TCoE/SCAG edizione italiana Asmodee).
# Verificati con dungeonedraghi.it, dungeonsanddragons.fandom.com/it,
# telodoioildungeon.it e Manuale del Giocatore italiano.
SPELL_NAMES_IT = {
    # --- Trucchetti ---
    "Acid Splash": "Fiotto Acido",
    "Blade Ward": "Interdizione alle Lame",
    "Booming Blade": "Lama Tonante",
    "Chill Touch": "Tocco Gelido",
    "Control Flames": "Controllare Fiamme",
    "Create Bonfire": "Creare Falò",
    "Dancing Lights": "Luci Danzanti",
    "Druidcraft": "Druidismo",
    "Eldritch Blast": "Deflagrazione Occulta",
    "Fire Bolt": "Dardo di Fuoco",
    "Friends": "Amicizia",
    "Frostbite": "Gelo",
    "Green-Flame Blade": "Lama di Fiamma Verde",
    "Guidance": "Guida",
    "Gust": "Folata",
    "Infestation": "Infestazione",
    "Light": "Luce",
    "Lightning Lure": "Fulmine Adescante",
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
    "Shillelagh": "Randello Incantato",
    "Shocking Grasp": "Stretta Folgorante",
    "Spare the Dying": "Risparmiare i Morenti",
    "Sword Burst": "Esplosione di Spade",
    "Thaumaturgy": "Taumaturgia",
    "Thorn Whip": "Frusta di Spine",
    "Thunderclap": "Tuono Fragoroso",
    "Toll the Dead": "Rintocco dei Morti",
    "True Strike": "Colpo Accurato",
    "Vicious Mockery": "Beffa Crudele",
    "Word of Radiance": "Parola della Luce",

    # --- Livello 1 ---
    "Absorb Elements": "Assorbire Elementi",
    "Animal Friendship": "Amicizia con gli Animali",
    "Armor of Agathys": "Armatura di Agathys",
    "Arms of Hadar": "Braccia di Hadar",
    "Bane": "Anatema",
    "Beast Bond": "Legame con la Bestia",
    "Bless": "Benedizione",
    "Burning Hands": "Mani Brucianti",
    "Catapult": "Catapulta",
    "Cause Fear": "Causare Paura",
    "Chaos Bolt": "Dardo del Caos",
    "Charm Person": "Charme su Persone",
    "Chromatic Orb": "Sfera Cromatica",
    "Color Spray": "Spruzzo Colorato",
    "Command": "Comando",
    "Compelled Duel": "Duello Obbligato",
    "Create or Destroy Water": "Creare o Distruggere Acqua",
    "Cure Wounds": "Cura Ferite",
    "Detect Evil and Good": "Individuazione del Bene e del Male",
    "Disguise Self": "Camuffare Sé Stesso",
    "Dissonant Whispers": "Sussurri Dissonanti",
    "Divine Favor": "Favore Divino",
    "Earth Tremor": "Tremito di Terra",
    "Ensnaring Strike": "Colpo Intrappolante",
    "Entangle": "Intralciare",
    "Expeditious Retreat": "Ritirata Veloce",
    "Faerie Fire": "Luminescenza",
    "False Life": "Vita Falsata",
    "Feather Fall": "Caduta Morbida",
    "Fog Cloud": "Nube di Nebbia",
    "Goodberry": "Bacche Magiche",
    "Grease": "Grasso",
    "Guiding Bolt": "Dardo Tracciante",
    "Hail of Thorns": "Pioggia di Spine",
    "Healing Word": "Parola Guaritrice",
    "Hellish Rebuke": "Rimprovero Infernale",
    "Heroism": "Eroismo",
    "Hex": "Sortilegio",
    "Hunter's Mark": "Marchio del Cacciatore",
    "Ice Knife": "Lama di Ghiaccio",
    "Inflict Wounds": "Infliggere Ferite",
    "Jump": "Saltare",
    "Longstrider": "Falcata",
    "Mage Armor": "Armatura Magica",
    "Magic Missile": "Dardo Incantato",
    "Protection from Evil and Good": "Protezione dal Bene e dal Male",
    "Ray of Sickness": "Raggio della Malattia",
    "Sanctuary": "Santuario",
    "Searing Smite": "Punizione Cocente",
    "Shield": "Scudo",
    "Shield of Faith": "Scudo della Fede",
    "Silent Image": "Immagine Silente",
    "Sleep": "Sonno",
    "Snare": "Trappola",
    "Tasha's Caustic Brew": "Intruglio Caustico di Tasha",
    "Tasha's Hideous Laughter": "Risata Atroce di Tasha",
    "Thunderous Smite": "Punizione Tonante",
    "Thunderwave": "Onda Tonante",
    "Witch Bolt": "Dardo Stregato",
    "Wrathful Smite": "Punizione Collerica",
    "Zephyr Strike": "Colpo dello Zefiro",

    # --- Livello 2 ---
    "Aganazzar's Scorcher": "Bruciante di Aganazzar",
    "Aid": "Aiuto",
    "Alter Self": "Alterare Sé Stesso",
    "Arcane Lock": "Chiusura Arcana",
    "Barkskin": "Pelle di Corteccia",
    "Blindness/Deafness": "Cecità/Sordità",
    "Blur": "Vista Offuscata",
    "Branding Smite": "Punizione Marchiante",
    "Calm Emotions": "Placare le Emozioni",
    "Cloud of Daggers": "Nube di Pugnali",
    "Continual Flame": "Fiamma Perenne",
    "Cordon of Arrows": "Cordone di Frecce",
    "Crown of Madness": "Corona di Follia",
    "Darkness": "Oscurità",
    "Darkvision": "Scurovisione",
    "Detect Thoughts": "Individuazione del Pensiero",
    "Dragon's Breath": "Soffio del Drago",
    "Dust Devil": "Diavolo della Polvere",
    "Earthbind": "Vincolo Terrestre",
    "Enhance Ability": "Potenziare Caratteristica",
    "Enlarge/Reduce": "Ingrandire/Ridurre",
    "Enthrall": "Soggiogare",
    "Find Steed": "Trovare Cavalcatura",
    "Find Traps": "Individuazione delle Trappole",
    "Flame Blade": "Lama di Fuoco",
    "Flaming Sphere": "Sfera Infuocata",
    "Gust of Wind": "Folata di Vento",
    "Healing Spirit": "Spirito Curatore",
    "Heat Metal": "Riscaldare Metallo",
    "Hold Person": "Bloccare Persone",
    "Invisibility": "Invisibilità",
    "Knock": "Bussare",
    "Lesser Restoration": "Ristorare Inferiore",
    "Levitate": "Levitazione",
    "Locate Object": "Localizza Oggetto",
    "Magic Weapon": "Arma Magica",
    "Maximilian's Earthen Grasp": "Stretta Terrestre di Maximilian",
    "Melf's Acid Arrow": "Freccia Acida di Melf",
    "Mind Spike": "Aculeo Mentale",
    "Mirror Image": "Immagini Speculari",
    "Misty Step": "Passo Velato",
    "Moonbeam": "Raggio Lunare",
    "Nystul's Magic Aura": "Aura Magica di Nystul",
    "Pass without Trace": "Passare senza Tracce",
    "Phantasmal Force": "Forza Fantasma",
    "Prayer of Healing": "Preghiera di Guarigione",
    "Protection from Poison": "Protezione dal Veleno",
    "Pyrotechnics": "Pirotecnica",
    "Ray of Enfeeblement": "Raggio Indebolente",
    "Rope Trick": "Trucco della Corda",
    "Scorching Ray": "Raggio Cocente",
    "See Invisibility": "Vedere Invisibilità",
    "Shadow Blade": "Lama d'Ombra",
    "Shatter": "Frantumare",
    "Snilloc's Snowball Swarm": "Nuvola di Palle di Neve di Snilloc",
    "Spider Climb": "Camminare sulle Pareti",
    "Spike Growth": "Crescita di Spuntoni",
    "Spiritual Weapon": "Arma Spirituale",
    "Suggestion": "Suggestione",
    "Summon Beast": "Evocare Bestia",
    "Tasha's Mind Whip": "Frusta Mentale di Tasha",
    "Warding Bond": "Vincolo Protettore",
    "Warding Wind": "Vento Protettore",
    "Web": "Ragnatela",
    "Zone of Truth": "Zona di Verità",

    # --- Livello 3 ---
    "Animate Dead": "Animare Morti",
    "Aura of Vitality": "Aura di Vitalità",
    "Beacon of Hope": "Faro di Speranza",
    "Bestow Curse": "Scagliare Maledizione",
    "Blinding Smite": "Punizione Accecante",
    "Blink": "Lampeggiare",
    "Call Lightning": "Evocare Fulmini",
    "Catnap": "Pisolino",
    "Clairvoyance": "Chiaroveggenza",
    "Conjure Animals": "Evocare Animali",
    "Conjure Barrage": "Evocare Sbarramento",
    "Counterspell": "Controincantesimo",
    "Create Food and Water": "Creare Cibo e Acqua",
    "Crusader's Mantle": "Manto del Crociato",
    "Daylight": "Luce del Giorno",
    "Dispel Magic": "Dissolvi Magie",
    "Elemental Weapon": "Arma Elementale",
    "Enemies Abound": "Nemici Ovunque",
    "Erupting Earth": "Eruzione Terrestre",
    "Fear": "Paura",
    "Fireball": "Palla di Fuoco",
    "Flame Arrows": "Frecce di Fuoco",
    "Fly": "Volare",
    "Gaseous Form": "Forma Gassosa",
    "Glyph of Warding": "Glifo di Interdizione",
    "Haste": "Velocità",
    "Hunger of Hadar": "Fame di Hadar",
    "Hypnotic Pattern": "Disegno Ipnotico",
    "Intellect Fortress": "Fortezza dell'Intelletto",
    "Life Transference": "Trasferimento di Vita",
    "Lightning Arrow": "Freccia Folgorante",
    "Lightning Bolt": "Fulmine",
    "Magic Circle": "Cerchio Magico",
    "Major Image": "Immagine Maggiore",
    "Mass Healing Word": "Parola Guaritrice di Massa",
    "Melf's Minute Meteors": "Meteore Minuscole di Melf",
    "Nondetection": "Anti-Individuazione",
    "Plant Growth": "Crescita Vegetale",
    "Protection from Energy": "Protezione dall'Energia",
    "Remove Curse": "Rimuovi Maledizione",
    "Revivify": "Rivivificare",
    "Sending": "Inviare Messaggio",
    "Sleet Storm": "Tempesta di Nevischio",
    "Slow": "Rallentare",
    "Speak with Dead": "Parlare con i Morti",
    "Speak with Plants": "Parlare con i Vegetali",
    "Spirit Guardians": "Spiriti Guardiani",
    "Spirit Shroud": "Velo Spirituale",
    "Stinking Cloud": "Nube Pestilenziale",
    "Summon Fey": "Evocare Fata",
    "Summon Lesser Demons": "Evocare Demoni Minori",
    "Summon Shadowspawn": "Evocare Stirpe d'Ombra",
    "Summon Undead": "Evocare Non Morto",
    "Thunder Step": "Passo del Tuono",
    "Tidal Wave": "Onda di Marea",
    "Tiny Servant": "Servitore Minuscolo",
    "Tongues": "Linguaggi",
    "Vampiric Touch": "Tocco del Vampiro",
    "Wall of Sand": "Muro di Sabbia",
    "Wall of Water": "Muro d'Acqua",
    "Wind Wall": "Muro di Vento",

    # --- Livello 4 ---
    "Arcane Eye": "Occhio Arcano",
    "Aura of Life": "Aura di Vita",
    "Aura of Purity": "Aura di Purezza",
    "Banishment": "Bandire",
    "Blight": "Inaridire",
    "Charm Monster": "Charme su Mostro",
    "Compulsion": "Costrizione",
    "Confusion": "Confusione",
    "Conjure Minor Elementals": "Evocare Elementali Minori",
    "Conjure Woodland Beings": "Evocare Esseri Silvani",
    "Control Water": "Controllare Acque",
    "Death Ward": "Protezione dalla Morte",
    "Dimension Door": "Porta Dimensionale",
    "Dominate Beast": "Dominare Bestia",
    "Elemental Bane": "Anatema Elementale",
    "Evard's Black Tentacles": "Tentacoli Neri di Evard",
    "Fabricate": "Fabbricare",
    "Find Greater Steed": "Trovare Cavalcatura Maggiore",
    "Fire Shield": "Scudo di Fuoco",
    "Freedom of Movement": "Libertà di Movimento",
    "Giant Insect": "Insetto Gigante",
    "Grasping Vine": "Vite Avvinghiante",
    "Greater Invisibility": "Invisibilità Superiore",
    "Guardian of Faith": "Guardiano della Fede",
    "Guardian of Nature": "Guardiano della Natura",
    "Hallucinatory Terrain": "Terreno Allucinatorio",
    "Ice Storm": "Tempesta di Ghiaccio",
    "Leomund's Secret Chest": "Scrigno Segreto di Leomund",
    "Locate Creature": "Localizza Creatura",
    "Mordenkainen's Faithful Hound": "Mastino Fedele di Mordenkainen",
    "Mordenkainen's Private Sanctum": "Santuario Privato di Mordenkainen",
    "Otiluke's Resilient Sphere": "Sfera Elastica di Otiluke",
    "Phantasmal Killer": "Assassino Fantasma",
    "Polymorph": "Metamorfosi",
    "Shadow of Moil": "Ombra di Moil",
    "Sickening Radiance": "Radianza Nauseante",
    "Staggering Smite": "Punizione Stordente",
    "Stone Shape": "Modellare Pietra",
    "Stoneskin": "Pelle di Pietra",
    "Storm Sphere": "Sfera di Tempesta",
    "Summon Aberration": "Evocare Aberrazione",
    "Summon Construct": "Evocare Costrutto",
    "Summon Elemental": "Evocare Elementale",
    "Summon Greater Demon": "Evocare Demone Maggiore",
    "Vitriolic Sphere": "Sfera Vetriolica",
    "Wall of Fire": "Muro di Fuoco",
    "Watery Sphere": "Sfera d'Acqua",

    # --- Livello 5 ---
    "Animate Objects": "Animare Oggetti",
    "Antilife Shell": "Guscio Antivita",
    "Awaken": "Risvegliare",
    "Banishing Smite": "Punizione Bandente",
    "Bigby's Hand": "Mano di Bigby",
    "Circle of Power": "Cerchio del Potere",
    "Cloudkill": "Nube Mortale",
    "Cone of Cold": "Cono di Freddo",
    "Conjure Elemental": "Convocare Elementale",
    "Conjure Volley": "Convocare Raffica",
    "Contagion": "Contagio",
    "Control Winds": "Controllare Venti",
    "Creation": "Creazione",
    "Danse Macabre": "Danza Macabra",
    "Dawn": "Alba",
    "Destructive Wave": "Onda Distruttiva",
    "Dispel Evil and Good": "Dissolvere Bene e Male",
    "Dominate Person": "Dominare Persona",
    "Dream": "Sogno",
    "Enervation": "Snervamento",
    "Far Step": "Passo Lontano",
    "Flame Strike": "Colonna di Fuoco",
    "Geas": "Geas",
    "Greater Restoration": "Ristorare Superiore",
    "Hallow": "Consacrare",
    "Hold Monster": "Bloccare Mostri",
    "Holy Weapon": "Arma Sacra",
    "Immolation": "Immolazione",
    "Infernal Calling": "Richiamo Infernale",
    "Insect Plague": "Piaga d'Insetti",
    "Legend Lore": "Sapere Leggendario",
    "Maelstrom": "Vortice",
    "Mass Cure Wounds": "Cura Ferite di Massa",
    "Mislead": "Inganno",
    "Modify Memory": "Modificare Memoria",
    "Negative Energy Flood": "Marea di Energia Negativa",
    "Passwall": "Passamuri",
    "Planar Binding": "Vincolo Planare",
    "Raise Dead": "Resuscitare Morti",
    "Reincarnate": "Reincarnazione",
    "Scrying": "Scrutare",
    "Seeming": "Sembrare",
    "Skill Empowerment": "Potenziare Abilità",
    "Steel Wind Strike": "Colpo di Vento d'Acciaio",
    "Summon Celestial": "Evocare Celestiale",
    "Swift Quiver": "Faretra Rapida",
    "Synaptic Static": "Statica Sinaptica",
    "Telekinesis": "Telecinesi",
    "Teleportation Circle": "Cerchio di Teletrasporto",
    "Transmute Rock": "Trasmutazione della Pietra",
    "Tree Stride": "Passo dell'Albero",
    "Wall of Force": "Muro di Forza",
    "Wall of Light": "Muro di Luce",
    "Wall of Stone": "Muro di Pietra",
    "Wrath of Nature": "Ira della Natura",

    # --- Livello 6 ---
    "Arcane Gate": "Cancello Arcano",
    "Blade Barrier": "Barriera di Lame",
    "Bones of the Earth": "Ossa della Terra",
    "Chain Lightning": "Catena di Fulmini",
    "Circle of Death": "Cerchio della Morte",
    "Conjure Fey": "Convocare Folletti",
    "Contingency": "Eventualità",
    "Create Homunculus": "Creare Homunculus",
    "Create Undead": "Creare Non Morti",
    "Disintegrate": "Disintegrazione",
    "Druid Grove": "Bosco del Druido",
    "Eyebite": "Malocchio",
    "Find the Path": "Trovare il Cammino",
    "Flesh to Stone": "Pietrificazione",
    "Globe of Invulnerability": "Globo di Invulnerabilità",
    "Guards and Wards": "Guardiani e Protezioni",
    "Harm": "Ferire",
    "Heal": "Guarire",
    "Heroes' Feast": "Banchetto degli Eroi",
    "Investiture of Flame": "Investitura della Fiamma",
    "Investiture of Ice": "Investitura del Ghiaccio",
    "Investiture of Stone": "Investitura della Pietra",
    "Investiture of Wind": "Investitura del Vento",
    "Magic Jar": "Vaso Magico",
    "Mass Suggestion": "Suggestione di Massa",
    "Mental Prison": "Prigione Mentale",
    "Move Earth": "Muovere Terra",
    "Otiluke's Freezing Sphere": "Sfera Glaciale di Otiluke",
    "Otto's Irresistible Dance": "Danza Irresistibile di Otto",
    "Planar Ally": "Alleato Planare",
    "Primordial Ward": "Salvaguardia Primordiale",
    "Programmed Illusion": "Illusione Programmata",
    "Scatter": "Disperdere",
    "Soul Cage": "Gabbia dell'Anima",
    "Summon Fiend": "Evocare Immondo",
    "Sunbeam": "Raggio di Sole",
    "Tasha's Otherworldly Guise": "Aspetto Ultraterreno di Tasha",
    "Tenser's Transformation": "Trasformazione di Tenser",
    "Transport via Plants": "Trasporto Vegetale",
    "True Seeing": "Visione del Vero",
    "Wall of Ice": "Muro di Ghiaccio",
    "Wall of Thorns": "Muro di Spine",
    "Wind Walk": "Camminare sul Vento",
    "Word of Recall": "Parola del Richiamo",

    # --- Livello 7 ---
    "Conjure Celestial": "Convocare Celestiale",
    "Crown of Stars": "Corona di Stelle",
    "Delayed Blast Fireball": "Palla di Fuoco Ritardata",
    "Divine Word": "Parola Divina",
    "Dream of the Blue Veil": "Sogno del Velo Azzurro",
    "Etherealness": "Etereo",
    "Finger of Death": "Dito della Morte",
    "Fire Storm": "Tempesta di Fuoco",
    "Forcecage": "Gabbia di Forza",
    "Mirage Arcane": "Miraggio Arcano",
    "Mordenkainen's MagnificentMansion": "Magnifica Magione di Mordenkainen",
    "Mordenkainen's Magnificent Mansion": "Magnifica Magione di Mordenkainen",
    "Mordenkainen's Sword": "Spada di Mordenkainen",
    "Plane Shift": "Cambio di Piano",
    "Power Word Pain": "Parola del Potere: Dolore",
    "Prismatic Spray": "Spruzzo Prismatico",
    "Project Image": "Proiezione di Immagine",
    "Regenerate": "Rigenerazione",
    "Resurrection": "Resurrezione",
    "Reverse Gravity": "Inversione di Gravità",
    "Sequester": "Isolare",
    "Simulacrum": "Simulacro",
    "Symbol": "Simbolo",
    "Teleport": "Teletrasporto",
    "Temple of the Gods": "Tempio degli Dei",
    "Whirlwind": "Turbine",

    # --- Livello 8 ---
    "Abi-Dalzim's Horrid Wilting": "Orribile Avvizzimento di Abi-Dalzim",
    "Animal Shapes": "Forme Animali",
    "Antimagic Field": "Campo Anti-Magia",
    "Antipathy/Sympathy": "Antipatia/Simpatia",
    "Clone": "Clone",
    "Control Weather": "Controllare il Tempo Atmosferico",
    "Demiplane": "Semipiano",
    "Dominate Monster": "Dominare Mostri",
    "Earthquake": "Terremoto",
    "Feeblemind": "Mente Inferma",
    "Glibness": "Eloquenza",
    "Holy Aura": "Aura Sacra",
    "Illusory Dragon": "Drago Illusorio",
    "Incendiary Cloud": "Nube Incendiaria",
    "Maddening Darkness": "Oscurità Folle",
    "Maze": "Labirinto",
    "Mighty Fortress": "Fortezza Possente",
    "Mind Blank": "Mente Vuota",
    "Power Word Stun": "Parola del Potere: Stordire",
    "Sunburst": "Esplosione Solare",
    "Telepathy": "Telepatia",
    "Tsunami": "Tsunami",

    # --- Livello 9 ---
    "Astral Projection": "Proiezione Astrale",
    "Blade of Disaster": "Lama del Disastro",
    "Foresight": "Premonizione",
    "Gate": "Cancello",
    "Imprisonment": "Imprigionamento",
    "Invulnerability": "Invulnerabilità",
    "Mass Heal": "Guarigione di Massa",
    "Mass Polymorph": "Metamorfosi di Massa",
    "Meteor Swarm": "Sciame di Meteore",
    "Power Word Heal": "Parola del Potere: Guarire",
    "Power Word Kill": "Parola del Potere: Uccidere",
    "Prismatic Wall": "Muro Prismatico",
    "Psychic Scream": "Urlo Psichico",
    "Shapechange": "Mutaforma",
    "Storm of Vengeance": "Tempesta di Vendetta",
    "Time Stop": "Arresto del Tempo",
    "True Polymorph": "Metamorfosi Superiore",
    "True Resurrection": "Vera Resurrezione",
    "Weird": "Sinistro",
    "Wish": "Desiderio",
}

# Vecchie traduzioni interne ora obsolete -> nuove. Permette di risolvere
# eventuali record già salvati nel DB con i nomi precedenti.
LEGACY_NAMES_IT = {
    "Spruzzo Acido": "Fiotto Acido",
    "Custodia della Lama": "Interdizione alle Lame",
    "Colpo Occulto": "Deflagrazione Occulta",
    "Dardo Infuocato": "Dardo di Fuoco",
    "Frusta Folgorante": "Fulmine Adescante",
    "Folgorare": "Stretta Folgorante",
    "Schernire": "Beffa Crudele",
    "Rovina": "Anatema",
    "Provocare Paura": "Causare Paura",
    "Charme su Persona": "Charme su Persone",
    "Ordine": "Comando",
    "Duello Forzato": "Duello Obbligato",
    "Camuffarsi": "Camuffare Sé Stesso",
    "Fuoco Fatato": "Luminescenza",
    "Falsa Vita": "Vita Falsata",
    "Dardo Guida": "Dardo Tracciante",
    "Maledire": "Sortilegio",
    "Armatura del Mago": "Armatura Magica",
    "Castigo Cocente": "Punizione Cocente",
    "Castigo Tonante": "Punizione Tonante",
    "Castigo Iracondo": "Punizione Collerica",
    # Nota: "Shillelagh" (vecchio nome italiano) e "Folata di Vento" (vecchio
    # nome del trucchetto Gust, ora occupato dall'incantesimo di liv.2 Gust of Wind)
    # NON sono mappati per evitare collisioni: il primo si risolve via `name_en`,
    # il secondo è meglio non rimappare per non confondere l'utente.
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
    "1 action or 8 hours": "1 azione o 8 ore",
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
    "Instantaneous or 1 hour (see below)": "Istantanea o 1 ora (vedi sotto)",
    "Instantaneous or 8 hours (see below)": "Istantanea o 8 ore (vedi sotto)",
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
# Pattern miglia (con e senza trattino: "5-mile" / "5 miles")
_MILE_HYPHEN_RE = re.compile(r"\b(\d+(?:\.\d+)?)\s*-\s*miles?\b", re.IGNORECASE)
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
    # "X-mile" (con trattino) e "X miles" / "X mile"
    text = _MILE_HYPHEN_RE.sub(lambda m: f"{miles_to_km(float(m.group(1)))} km", text)
    text = _MILES_RE.sub(lambda m: f"{miles_to_km(float(m.group(1)))} km", text)
    # "X inches"
    text = _INCHES_RE.sub(lambda m: f"{int(round(float(m.group(1)) * 2.54))} cm", text)
    return text


# ---------------------------------------------------------------------------
# Traduttori metadati
# ---------------------------------------------------------------------------

def _translate_reaction_extra(text: str) -> str:
    """Traduce la parte 'extra' di un casting time di reazione.

    Le reazioni complesse contengono una clausola che descrive il trigger
    (es. 'which you take when you take fire damage'). Mappiamo i pattern
    noti alla loro traduzione italiana, convertendo le distanze in metri.
    """
    s = text

    # Traduce un elenco di tipi di danno EN -> IT (preserva le virgole/or).
    def _dmg(types_str: str) -> str:
        mapping = {
            "acid": "acidi",
            "cold": "da freddo",
            "fire": "da fuoco",
            "lightning": "da fulmine",
            "thunder": "tonanti",
            "necrotic": "necrotici",
            "radiant": "radiosi",
            "force": "da forza",
            "psychic": "psichici",
            "poison": "da veleno",
            "bludgeoning": "contundenti",
            "piercing": "perforanti",
            "slashing": "taglienti",
        }
        # Normalizza separatori
        text = re.sub(r"\bor\b", "o", types_str, flags=re.IGNORECASE)
        for en, it in mapping.items():
            text = re.sub(rf"\b{en}\b", it, text, flags=re.IGNORECASE)
        return text.strip()

    def _feet(n: str) -> str:
        try:
            return feet_to_meters(float(n))
        except ValueError:
            return n

    # Prefissi più lunghi prima.
    s = re.sub(
        r"^which you take in response to being damaged by ",
        "che si compie in risposta a un danno inflitto da ",
        s, flags=re.IGNORECASE,
    )
    s = re.sub(r"^which you take when ", "che si compie quando ", s, flags=re.IGNORECASE)
    s = re.sub(r"^see below$", "vedi sotto", s, flags=re.IGNORECASE)

    # Sotto-frasi note (ordine importa: più specifiche prima).
    s = re.sub(
        r"\byou or a creature within (\d+) feet of you falls\b",
        lambda m: f"tu o una creatura entro {_feet(m.group(1))} metri da te cade",
        s, flags=re.IGNORECASE,
    )
    s = re.sub(
        r"\byou see a creature within (\d+) feet of you casting a spell\b",
        lambda m: f"vedi una creatura entro {_feet(m.group(1))} metri da te lanciare un incantesimo",
        s, flags=re.IGNORECASE,
    )
    s = re.sub(
        r"\ba humanoid you can see within (\d+) feet of you dies\b",
        lambda m: f"un umanoide che riesci a vedere entro {_feet(m.group(1))} metri da te muore",
        s, flags=re.IGNORECASE,
    )
    s = re.sub(
        r"\ba creature within (\d+) feet of you that you can see\b",
        lambda m: f"una creatura entro {_feet(m.group(1))} metri da te che riesci a vedere",
        s, flags=re.IGNORECASE,
    )
    s = re.sub(
        r"\byou are hit by an attack or targeted by the magic missile spell\b",
        "vieni colpito da un attacco o sei bersaglio dell'incantesimo dardo incantato",
        s, flags=re.IGNORECASE,
    )
    s = re.sub(
        r"\byou take ([a-z, ]+?) damage\b",
        lambda m: f"subisci danni {_dmg(m.group(1))}",
        s, flags=re.IGNORECASE,
    )
    return s


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
        extra_it = _translate_reaction_extra(extra)
        return f"{base_it}, {extra_it}"
    return base_it


def translate_range(s: str) -> str:
    if not s:
        return s
    s_strip = s.strip()
    if s_strip in RANGE_FIXED_IT:
        return RANGE_FIXED_IT[s_strip]
    # "Self (X-foot ...)" o "Self (X-foot cone)" o "Self (X-mile radius)"
    m = re.match(r"^Self\s*\((.+)\)$", s_strip, re.IGNORECASE)
    if m:
        inner = m.group(1)
        inner = convert_distances(inner)
        # Forme con "radius" + shape esplicita: es. "X metri radius sphere"
        # Mappiamo in "<shape> di X <unita> di raggio".
        radius_shapes = {
            "sphere": "sfera",
            "hemisphere": "emisfera",
            "cube": "cubo",
            "cylinder": "cilindro",
        }
        for en, it in radius_shapes.items():
            inner = re.sub(
                rf"(\d[\d,]*)\s*(km|metri)\s*[-\s]\s*radius\s+{en}",
                lambda mo, it=it: f"{it} di {mo.group(1)} {mo.group(2)} di raggio",
                inner,
                flags=re.IGNORECASE,
            )
        # Forme: "<num> metri[-]<forma>" o "<num> metri <forma>" -> "<forma> di <num> metri[ di lato]"
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
                rf"(\d[\d,]*)\s*(km|metri)\s*-?\s*{en}",
                lambda mo, it=it, suffix=suffix:
                    f"{it} di {mo.group(1)} {mo.group(2)}{suffix}",
                inner,
                flags=re.IGNORECASE,
            )
        # Strip eventuali residui inglesi
        inner = re.sub(r"\bradius\b", "raggio", inner, flags=re.IGNORECASE)
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


# Lista di sostituzioni per il testo dei materiali. ORDINE IMPORTANTE:
# - frasi multi-parola PRIMA delle parole singole
# - articoli/preposizioni inglesi alla fine (per non sporcare frasi piu' lunghe)
_MAT_REPLACEMENTS = [
    # Frasi composite (quantitativi)
    (r"\ba (?:tiny )?bit of\b", "un pezzetto di"),
    (r"\ba bit of\b", "un pezzetto di"),
    (r"\ba pinch of\b", "un pizzico di"),
    (r"\bpinch of\b", "pizzico di"),
    (r"\ba small piece of\b", "un piccolo pezzo di"),
    (r"\ba short piece of\b", "un breve pezzo di"),
    (r"\ba piece of\b", "un pezzo di"),
    (r"\bpiece of\b", "pezzo di"),
    (r"\ba lump of\b", "una zolla di"),
    (r"\ba dollop of\b", "una cucchiaiata di"),
    (r"\ba handful of\b", "una manciata di"),
    (r"\ba few grains of\b", "alcuni granelli di"),
    (r"\ba few\b", "alcuni"),
    (r"\ba drop of\b", "una goccia di"),
    (r"\ba wisp of\b", "un filo di"),
    (r"\ba sprig of\b", "un rametto di"),
    (r"\ba tuft of\b", "un ciuffo di"),
    (r"\ba scrap of\b", "un brandello di"),
    (r"\ba sliver of\b", "una scheggia di"),
    (r"\ba strand of\b", "un filamento di"),
    (r"\ba small amount of\b", "una piccola quantita' di"),
    (r"\ba small measure of\b", "una piccola misura di"),
    (r"\bsome\b", "un po' di"),

    # Frasi di valore / consumo
    (r"\bworth at least\b", "del valore di almeno"),
    (r"\bworth\b", "del valore di"),
    (r"\beach item worth\b", "ciascuno del valore di"),
    (r"\beach worth\b", "ciascuno del valore di"),
    (r"\bthe spell consumes\b", "l'incantesimo consuma"),
    (r"\bconsumed by the spell\b", "consumato dall'incantesimo"),
    (r"\bwhich the spell consumes\b", "che l'incantesimo consuma"),
    (r"\bthat (?:the spell )?consumes\b", "che l'incantesimo consuma"),
    (r"\bgp\b", "mo"),
    (r"\bsp\b", "ma"),
    (r"\bcp\b", "mr"),

    # ==== COMBINAZIONI agg+sost INVERTITE (DEVONO precedere i singoli) ====
    (r"\bpowdered iron\b", "ferro in polvere"),
    (r"\bpowdered diamond\b", "diamante in polvere"),
    (r"\bpowdered silver\b", "argento in polvere"),
    (r"\bpowdered ruby\b", "rubino in polvere"),
    (r"\bdiamond dust\b", "polvere di diamante"),
    (r"\bdiamond powder\b", "polvere di diamante"),
    (r"\biron filings\b", "limatura di ferro"),
    (r"\bsilver filings\b", "limatura d'argento"),
    (r"\bgem-encrusted bowl\b", "ciotola tempestata di gemme"),
    (r"\bjewel-encrusted dagger\b", "pugnale tempestato di gemme"),
    (r"\bgem-encrusted\b", "tempestato di gemme"),
    (r"\bjewel-encrusted\b", "tempestato di gemme"),
    (r"\bminiature portal\b", "portale in miniatura"),
    (r"\bpolished marble\b", "marmo lucidato"),
    (r"\btiny silver\b", "minuscolo d'argento"),
    (r"\btiny statuette\b", "statuetta minuscola"),
    (r"\btiny reliquary\b", "minuscolo reliquiario"),
    (r"\btiny gem\b", "gemma minuscola"),
    (r"\btiny vial\b", "fiala minuscola"),
    (r"\bsmall, straight piece of iron\b", "piccolo pezzo dritto di ferro"),
    (r"\bstraight\b", "dritto"),
    (r"\bsilver cage\b", "gabbia d'argento"),
    (r"\bsilver whistle\b", "fischietto d'argento"),
    (r"\bsilver wire\b", "filo d'argento"),
    (r"\bsilver pin\b", "spillo d'argento"),
    (r"\bsilver pins\b", "spilli d'argento"),
    (r"\bsilver spoon\b", "cucchiaio d'argento"),
    (r"\bsilver rod\b", "bacchetta d'argento"),
    (r"\bsilver bell\b", "campana d'argento"),
    (r"\bcopper wire\b", "filo di rame"),
    (r"\bcopper piece\b", "moneta di rame"),
    (r"\bcopper coin\b", "moneta di rame"),
    (r"\bcopper rod\b", "bacchetta di rame"),
    (r"\bgolden wire\b", "filo d'oro"),
    (r"\bgolden flower\b", "fiore d'oro"),
    (r"\bgolden sickle\b", "falcetto d'oro"),
    (r"\bgolden reliquary\b", "reliquiario d'oro"),
    (r"\bgolden skull\b", "teschio d'oro"),
    (r"\bgolden horn\b", "corno d'oro"),
    (r"\bgilded flower\b", "fiore dorato"),
    (r"\bgilded acorn\b", "ghianda dorata"),
    (r"\bgilded skull\b", "teschio dorato"),
    (r"\bjeweled horn\b", "corno ingioiellato"),
    (r"\bmetal rod\b", "bacchetta di metallo"),
    (r"\bmetal lockbox\b", "cassetta di metallo"),
    (r"\bglass cone\b", "cono di vetro"),
    (r"\bglass eye\b", "occhio di vetro"),
    (r"\bcrystal rod\b", "bacchetta di cristallo"),
    (r"\bcrystal vial\b", "fiala di cristallo"),
    (r"\bcrystal bead\b", "perlina di cristallo"),
    (r"\bivory dagger\b", "pugnale d'avorio"),
    (r"\bivory portal\b", "portale d'avorio"),
    (r"\bblack pearl\b", "perla nera"),
    (r"\bbrown pearl\b", "perla marrone"),
    (r"\bsmall feather\b", "piccola piuma"),
    (r"\bbat guano\b", "guano di pipistrello"),
    (r"\beye of a newt\b", "occhio di tritone"),
    (r"\bthe petrified eye of a newt\b", "l'occhio pietrificato di un tritone"),
    (r"\bsnake's tongue\b", "lingua di serpente"),
    (r"\bumber hulk blood\b", "sangue di umber hulk"),
    (r"\bmandrake root\b", "radice di mandragora"),
    (r"\brose petals\b", "petali di rosa"),
    (r"\bfish tail\b", "coda di pesce"),
    (r"\bsalt water\b", "acqua salata"),
    (r"\bfine sand\b", "sabbia fine"),
    (r"\bfull moon\b", "luna piena"),
    (r"\bmelee weapon\b", "arma da mischia"),
    (r"\bholy water\b", "acqua santa"),
    (r"\bholy symbol\b", "simbolo sacro"),
    (r"\bsacred relic\b", "reliquia sacra"),
    (r"\bsaint's robe\b", "veste di un santo"),
    (r"\breligious text\b", "testo religioso"),
    (r"\bplane of existence\b", "piano di esistenza"),
    (r"\bgum arabic\b", "gomma arabica"),
    (r"\bcubic inch\b", "pollice cubico"),
    (r"\bcircular bronze brazier\b", "braciere circolare di bronzo"),
    (r"\bbronze brazier\b", "braciere di bronzo"),
    (r"\bvellum depiction\b", "raffigurazione di cartapecora"),
    (r"\bcarved statuette\b", "statuetta intagliata"),
    (r"\bsealable lid\b", "coperchio sigillabile"),
    (r"\bgem-encrusted bowl\b", "ciotola tempestata di gemme"),
    (r"\bcubic inch of flesh\b", "pollice cubico di carne"),

    # Materiali rituali/religiosi (singoli)
    (r"\bholy\b", "sacro"),
    (r"\bsacred relic\b", "reliquia sacra"),
    (r"\breliquary\b", "reliquiario"),
    (r"\bincense\b", "incenso"),
    (r"\bburning incense\b", "incenso che brucia"),
    (r"\bbrimstone\b", "zolfo nero"),
    (r"\bfrankincense\b", "incenso"),
    (r"\bsaint's robe\b", "veste di un santo"),
    (r"\breligious text\b", "testo religioso"),
    (r"\bparchment\b", "pergamena"),
    (r"\bvellum\b", "cartapecora"),

    # Pietre / metalli / gemme (singole parole)
    (r"\bsulfur\b", "zolfo"),
    (r"\bphosphorus\b", "fosforo"),
    (r"\bmistletoe\b", "vischio"),
    (r"\bholly\b", "agrifoglio"),
    (r"\boak\b", "quercia"),
    (r"\bsilver\b", "argento"),
    (r"\bgold\b", "oro"),
    (r"\bgolden\b", "dorato"),
    (r"\bgilded\b", "dorato"),
    (r"\bcopper\b", "rame"),
    (r"\biron\b", "ferro"),
    (r"\bsteel\b", "acciaio"),
    (r"\bbronze\b", "bronzo"),
    (r"\bplatinum\b", "platino"),
    (r"\bcrystal\b", "cristallo"),
    (r"\bdiamond\b", "diamante"),
    (r"\bjade\b", "giada"),
    (r"\bquartz\b", "quarzo"),
    (r"\bruby\b", "rubino"),
    (r"\bemerald\b", "smeraldo"),
    (r"\bsapphire\b", "zaffiro"),
    (r"\bamber\b", "ambra"),
    (r"\bonyx\b", "onice"),
    (r"\bpearl\b", "perla"),
    (r"\bblack pearl\b", "perla nera"),
    (r"\bgem\b", "gemma"),
    (r"\bgems\b", "gemme"),
    (r"\bgemstones?\b", "gemme"),
    (r"\bgem-encrusted\b", "tempestato di gemme"),
    (r"\bjewel-encrusted\b", "tempestato di gemme"),
    (r"\bjeweled\b", "ingioiellato"),
    (r"\bivory\b", "avorio"),
    (r"\bmarble\b", "marmo"),
    (r"\bstone\b", "pietra"),
    (r"\blodestone\b", "calamita"),
    (r"\blead\b", "piombo"),
    (r"\bmercury\b", "mercurio"),
    (r"\bquicksilver\b", "mercurio"),

    # Sabbia / polvere / cenere / liquidi
    (r"\bfine sand\b", "sabbia fine"),
    (r"\bsand\b", "sabbia"),
    (r"\bdust\b", "polvere"),
    (r"\bpowdered\b", "in polvere"),
    (r"\bpowder\b", "polvere"),
    (r"\bash\b", "cenere"),
    (r"\bash(es)?\b", "cenere"),
    (r"\bclay\b", "argilla"),
    (r"\bdirt\b", "terra"),
    (r"\bearth\b", "terra"),
    (r"\bwater\b", "acqua"),
    (r"\bsalt water\b", "acqua salata"),
    (r"\boil\b", "olio"),
    (r"\bwax\b", "cera"),
    (r"\bcandle\b", "candela"),
    (r"\bvinegar\b", "aceto"),
    (r"\bhoney\b", "miele"),
    (r"\balum\b", "allume"),
    (r"\bgum arabic\b", "gomma arabica"),
    (r"\bsmoke\b", "fumo"),
    (r"\bbitumen\b", "bitume"),
    (r"\bink\b", "inchiostro"),
    (r"\binks\b", "inchiostri"),
    (r"\bchalks?\b", "gessetti"),

    # Animali e parti
    (r"\bbat guano\b", "guano di pipistrello"),
    (r"\ba firefly\b", "una lucciola"),
    (r"\bfirefly\b", "lucciola"),
    (r"\bglowworm\b", "verme luminoso"),
    (r"\bsmall feather\b", "piccola piuma"),
    (r"\bfeather\b", "piuma"),
    (r"\bfur\b", "pelliccia"),
    (r"\bfleece\b", "vello"),
    (r"\bfrom an animal\b", "di un animale"),
    (r"\bof leather\b", "di cuoio"),
    (r"\bleather\b", "cuoio"),
    (r"\bwool\b", "lana"),
    (r"\bcloth\b", "stoffa"),
    (r"\bsilk\b", "seta"),
    (r"\bgauze\b", "garza"),
    (r"\ba cricket\b", "un grillo"),
    (r"\bcricket\b", "grillo"),
    (r"\bthe petrified eye of a newt\b", "l'occhio pietrificato di un tritone"),
    (r"\beye of a newt\b", "occhio di tritone"),
    (r"\bpetrified\b", "pietrificato"),
    (r"\bsnake's tongue\b", "lingua di serpente"),
    (r"\bspider\b", "ragno"),
    (r"\btentacle\b", "tentacolo"),
    (r"\beyeball\b", "bulbo oculare"),
    (r"\bpickled\b", "in salamoia"),
    (r"\bblood\b", "sangue"),
    (r"\bhumanoid blood\b", "sangue di umanoide"),
    (r"\btears\b", "lacrime"),
    (r"\bbone\b", "osso"),
    (r"\bskull\b", "teschio"),
    (r"\bheart\b", "cuore"),
    (r"\btail\b", "coda"),
    (r"\bfish tail\b", "coda di pesce"),
    (r"\bacorn\b", "ghianda"),
    (r"\bberry\b", "bacca"),
    (r"\bberries\b", "bacche"),
    (r"\bleaf\b", "foglia"),
    (r"\bleaves\b", "foglie"),
    (r"\btwig\b", "ramoscello"),
    (r"\bplant\b", "pianta"),
    (r"\bmandrake root\b", "radice di mandragora"),
    (r"\bumber hulk blood\b", "sangue di umber hulk"),
    (r"\bmoon\b", "luna"),
    (r"\bsun\b", "sole"),
    (r"\bfull moon\b", "luna piena"),
    (r"\bice\b", "ghiaccio"),
    (r"\bair\b", "aria"),
    (r"\bfire\b", "fuoco"),
    (r"\brose petals\b", "petali di rosa"),
    (r"\bpetals?\b", "petali"),
    (r"\brose\b", "rosa"),
    (r"\bthorns?\b", "spina"),
    (r"\bstring\b", "spago"),
    (r"\brope\b", "corda"),

    # Oggetti / contenitori / strumenti
    (r"\bvial\b", "fiala"),
    (r"\bbowl\b", "ciotola"),
    (r"\bcup\b", "tazza"),
    (r"\bcontainer\b", "contenitore"),
    (r"\bvessel\b", "vasca"),
    (r"\burn\b", "urna"),
    (r"\bcoffin\b", "bara"),
    (r"\bcyst\b", "cisti"),
    (r"\bgilded\b", "dorato"),
    (r"\bspoon\b", "cucchiaio"),
    (r"\bbell\b", "campana"),
    (r"\bwhistle\b", "fischietto"),
    (r"\brod\b", "bacchetta"),
    (r"\bforked\b", "biforcuta"),
    (r"\bmetal rod\b", "bacchetta di metallo"),
    (r"\bcage\b", "gabbia"),
    (r"\blockbox\b", "cassetta chiusa"),
    (r"\bdagger\b", "pugnale"),
    (r"\bsickle\b", "falcetto"),
    (r"\bhorn\b", "corno"),
    (r"\bstatuette\b", "statuetta"),
    (r"\bmirror\b", "specchio"),
    (r"\bbrazier\b", "braciere"),
    (r"\bbead\b", "perlina"),
    (r"\bball\b", "palla"),
    (r"\bpins?\b", "spilli"),
    (r"\bwire\b", "filo"),
    (r"\bcopper wire\b", "filo di rame"),
    (r"\bsilver wire\b", "filo d'argento"),
    (r"\bgolden wire\b", "filo dorato"),
    (r"\bportal\b", "portale"),
    (r"\bcarved\b", "intagliato"),
    (r"\bengraved\b", "inciso"),
    (r"\bdecorated\b", "decorato"),
    (r"\bencrusted\b", "incrostato"),
    (r"\bpolished\b", "lucidato"),
    (r"\bminiature\b", "in miniatura"),
    (r"\binfused\b", "infuso"),
    (r"\battuned\b", "in sintonia"),
    (r"\binlaid\b", "intarsiato"),
    (r"\bplatinum-inlaid\b", "intarsiato di platino"),
    (r"\bgold-inlaid\b", "intarsiato d'oro"),
    (r"\bbeaded\b", "perlato"),
    (r"\bsymbol\b", "simbolo"),
    (r"\bdepiction\b", "raffigurazione"),
    (r"\blikeness\b", "fattezze"),
    (r"\bcomponent\b", "componente"),
    (r"\bversion\b", "versione"),
    (r"\bobject\b", "oggetto"),
    (r"\bitem\b", "oggetto"),
    (r"\bitems\b", "oggetti"),
    (r"\bmaterials?\b", "materiali"),
    (r"\bweapon\b", "arma"),
    (r"\bmelee weapon\b", "arma da mischia"),
    (r"\bmelee\b", "mischia"),
    (r"\bammunition\b", "munizioni"),
    (r"\barrow\b", "freccia"),
    (r"\bsword\b", "spada"),
    (r"\bclub\b", "mazza"),
    (r"\bquarterstaff\b", "bastone ferrato"),
    (r"\bspecial\b", "speciale"),

    # Soggetti / azioni
    (r"\bcreature\b", "creatura"),
    (r"\bcreatures\b", "creature"),
    (r"\bhumanoid\b", "umanoide"),
    (r"\bgiant\b", "gigante"),
    (r"\btarget\b", "bersaglio"),
    (r"\bsoaked in\b", "imbevuto in"),
    (r"\bwrapped in\b", "avvolto in"),
    (r"\bfilled with\b", "riempito di"),
    (r"\bfilled\b", "riempito"),
    (r"\bsprinkled over\b", "sparso su"),
    (r"\bsprinkled\b", "sparso"),
    (r"\bharvested with\b", "raccolto con"),
    (r"\bharvested\b", "raccolto"),
    (r"\bunder the light of\b", "sotto la luce di"),
    (r"\bcontaining\b", "contenente"),
    (r"\bcontains\b", "che contiene"),
    (r"\bbent into\b", "piegato a forma di"),
    (r"\bbound around\b", "legato attorno a"),
    (r"\bcomposed of\b", "composto di"),
    (r"\bmade of\b", "fatto di"),
    (r"\bmade\b", "fatto"),
    (r"\bcrushed\b", "frantumato"),
    (r"\bground\b", "macinato"),
    (r"\bdistilled\b", "distillato"),
    (r"\bcubic inch\b", "pollice cubico"),
    (r"\bplane of existence\b", "piano di esistenza"),
    (r"\bplane\b", "piano"),
    (r"\bexistence\b", "esistenza"),
    (r"\bspell\b", "incantesimo"),
    (r"\bsuch as\b", "come"),
    (r"\bvaries\b", "varia"),
    (r"\bchoose\b", "scegli"),
    (r"\beither\b", "o"),
    (r"\bof course\b", ""),
    (r"\bfor the antipathy effect\b", "per l'effetto di antipatia"),
    (r"\bfor the sympathy effect\b", "per l'effetto di simpatia"),
    (r"\bfor hearing\b", "per l'udito"),
    (r"\bfor seeing\b", "per la vista"),

    # Aggettivi di dimensione
    (r"\btiny\b", "minuscolo"),
    (r"\bsmall\b", "piccolo"),
    (r"\blarge\b", "grande"),
    (r"\bhuge\b", "enorme"),
    (r"\bshort\b", "corto"),
    (r"\bfine\b", "fine"),
    (r"\bblack\b", "nero"),
    (r"\bwhite\b", "bianco"),
    (r"\bred\b", "rosso"),
    (r"\bgreen\b", "verde"),
    (r"\bgold\b", "oro"),
    (r"\brare\b", "raro"),
    (r"\bprecious\b", "prezioso"),
    (r"\bhit die\b", "Dado vita"),
    (r"\bHit Die\b", "Dado vita"),

    # Verbi/aux/articoli (alla fine)
    (r"\bcan see\b", "puo' vedere"),
    (r"\bmust\b", "deve"),
    (r"\beach\b", "ciascun"),
    (r"\bone\b", "uno"),
    (r"\btwo\b", "due"),
    (r"\bthree\b", "tre"),
    (r"\bfour\b", "quattro"),
    (r"\bfive\b", "cinque"),
    (r"\bper\b", "per"),
    (r"\bfor\b", "per"),
    (r"\binside\b", "all'interno di"),
    (r"\binto\b", "in"),
    (r"\bin\b", "in"),
    (r"\bat least\b", "almeno"),
    (r"\bof\b", "di"),
    (r"\bfrom\b", "da"),
    (r"\bwith\b", "con"),
    (r"\band\b", "e"),
    (r"\bor\b", "o"),
    (r"\bthe\b", ""),
    (r"\bthat\b", "che"),
    (r"\bwhich\b", "che"),
    (r"\bsuch\b", "tale"),
    (r"\byou\b", "tu"),
    (r"\byour\b", "tuo"),

    # Combinazioni aggettivo-sostantivo (in italiano si invertono)
    (r"\bpowdered iron\b", "ferro in polvere"),
    (r"\bpowdered diamond\b", "diamante in polvere"),
    (r"\bpowdered silver\b", "argento in polvere"),
    (r"\bpowdered ruby\b", "rubino in polvere"),
    (r"\biron filings\b", "limatura di ferro"),
    (r"\bsilver filings\b", "limatura d'argento"),
    (r"\bfilings\b", "limatura"),
    (r"\bsilver cage\b", "gabbia d'argento"),
    (r"\bsilver whistle\b", "fischietto d'argento"),
    (r"\bsilver wire\b", "filo d'argento"),
    (r"\bsilver pin\b", "spillo d'argento"),
    (r"\bsilver pins\b", "spilli d'argento"),
    (r"\bsilver spoon\b", "cucchiaio d'argento"),
    (r"\bsilver rod\b", "bacchetta d'argento"),
    (r"\bcopper wire\b", "filo di rame"),
    (r"\bcopper piece\b", "moneta di rame"),
    (r"\bgolden wire\b", "filo d'oro"),
    (r"\bgolden flower\b", "fiore d'oro"),
    (r"\bgolden sickle\b", "falcetto d'oro"),
    (r"\bgolden reliquary\b", "reliquiario d'oro"),
    (r"\bgolden skull\b", "teschio d'oro"),
    (r"\bgolden horn\b", "corno d'oro"),
    (r"\bjeweled horn\b", "corno ingioiellato"),
    (r"\bmetal rod\b", "bacchetta di metallo"),
    (r"\bmetal lockbox\b", "cassetta di metallo"),
    (r"\bglass cone\b", "cono di vetro"),
    (r"\bglass eye\b", "occhio di vetro"),
    (r"\bcrystal rod\b", "bacchetta di cristallo"),
    (r"\bivory dagger\b", "pugnale d'avorio"),
    (r"\bcandle\b", "candela"),

    # Termini residui
    (r"\bwood\b", "legno"),
    (r"\bwooden\b", "di legno"),
    (r"\bdown\b", "piumino"),
    (r"\bbits of\b", "frammenti di"),
    (r"\bbits\b", "frammenti"),
    (r"\bmixed in\b", "mescolato in"),
    (r"\bmixed\b", "mescolato"),
    (r"\bburning\b", "che brucia"),
    (r"\bglass\b", "vetro"),
    (r"\bflesh\b", "carne"),
    (r"\bcubic\b", "cubico"),
    (r"\bcubic inch\b", "pollice cubico"),
    (r"\bsealable lid\b", "coperchio sigillabile"),
    (r"\bsealable\b", "sigillabile"),
    (r"\blid\b", "coperchio"),
    (r"\blarge enough to hold\b", "abbastanza grande da contenere"),
    (r"\blong shank\b", "lungo gambo"),
    (r"\bshank\b", "gambo"),
    (r"\bend\b", "estremita'"),
    (r"\bring\b", "anello"),
    (r"\bbeing cloned\b", "che viene clonato"),
    (r"\bcloned\b", "clonato"),
    (r"\bcrystals?\b", "cristallo"),
    (r"\bsphere\b", "sfera"),
    (r"\bcone\b", "cono"),
    (r"\bcube\b", "cubo"),
    (r"\bline\b", "linea"),
    (r"\bcircle\b", "cerchio"),
    (r"\bdrop\b", "goccia"),
    (r"\bsoap\b", "sapone"),

    # Articoli inglesi residui (alla fine, dopo tutto il resto)
    (r"\b[Aa]n\b", "un"),
    (r"\b[Aa]\b", "un"),

    # Pulizia: doppi spazi
    (r"\s{2,}", " "),
]


def _translate_material_text(materials: str) -> str:
    """Applica la pipeline di sostituzioni a una stringa di materiali."""
    out = materials
    for patt, repl in _MAT_REPLACEMENTS:
        out = re.sub(patt, repl, out, flags=re.IGNORECASE)
    out = convert_distances(out)
    out = re.sub(r"\s+([,;.])", r"\1", out)
    out = re.sub(r"\(\s+", "(", out)
    out = re.sub(r"\s+\)", ")", out)
    return out.strip()


def translate_components(s: str) -> str:
    """Mantiene V/S/M e traduce i materiali tra parentesi quando possibile."""
    if not s:
        return s
    m = re.match(r"^([VSM,\s]+)(?:\s*\((.+)\))?\s*$", s.strip())
    if not m:
        return s
    letters = m.group(1).strip()
    materials = m.group(2)
    out = letters
    if materials:
        mat_it = _translate_material_text(materials)
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


def _aliases_for(name_it: str) -> list[str]:
    """Restituisce i vecchi nomi italiani (alias) puntati a name_it."""
    return [old for old, new in LEGACY_NAMES_IT.items() if new == name_it]


def localize(spell_raw: dict, translations: dict) -> dict:
    name_en = spell_raw["_name_en_raw"]
    name_it = SPELL_NAMES_IT.get(name_en, name_en)
    aliases = _aliases_for(name_it)

    description_en = spell_raw["_description_en"]
    # Descrizione in inglese ma con metriche convertite
    description_metric_en = convert_distances(description_en)

    # Override IT da file translations
    override = translations.get(name_en) or translations.get(name_it) or {}
    description_it = override.get("description")
    if not description_it:
        # fallback: stessa descrizione (inglese metricata) con note
        description_it = description_metric_en

    # Gli override vengono applicati a tutti i campi metadati. Il regex
    # generico copre la maggior parte dei casi, gli override servono per
    # le frasi piu' complesse (reazioni, materiali rari).
    casting_time_it = override.get("casting_time") or translate_casting_time(spell_raw["_casting_time_en"])
    range_it = override.get("range") or translate_range(spell_raw["_range_en"])
    components_it = override.get("components") or translate_components(spell_raw["_components_en"])
    duration_it = override.get("duration") or translate_duration(spell_raw["_duration_en"])

    return {
        "name": name_it,
        "name_en": name_en,
        "level": spell_raw["_level"],
        "school": spell_raw["_school"],
        "school_it": SCHOOL_IT.get(spell_raw["_school"], spell_raw["_school"].capitalize()),
        "casting_time": casting_time_it,
        "casting_time_en": spell_raw["_casting_time_en"],
        "range": range_it,
        "range_en": spell_raw["_range_en"],
        "components": components_it,
        "components_en": spell_raw["_components_en"],
        "duration": duration_it,
        "duration_en": spell_raw["_duration_en"],
        "description": description_it,
        "description_en": description_en,
        "classes": [CLASS_IT.get(c, c) for c in spell_raw["_classes_en"]],
        "classes_en": spell_raw["_classes_en"],
        "source": spell_raw["_source"],
        "aliases": aliases,
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
