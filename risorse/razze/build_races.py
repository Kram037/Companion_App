"""Build razze.json + js/data/races_data.js a partire da un dataset
hardcoded in italiano, con riferimenti a una libreria di tratti comuni.

Filosofia:
- Niente scraping: i dati sono curati direttamente in IT per qualita' e
  controllo (descrizioni, ASI, tratti razziali, incantesimi innati).
- I tratti ricorrenti (Scurovisione, Antenati Fatati, Trance, ...) sono
  definiti UNA VOLTA in COMMON_TRAITS e referenziati per chiave.
- I tratti specifici di una razza sono inline.
- I metadati strutturati (uses, innate_spells) sono critici: il frontend
  li usa per generare automaticamente Risorse e Slot di magia innata.

Schema di output (per razza, chiave = name IT):
{
  "name": "Nano",
  "name_en": "Dwarf",
  "source": "Manuale del Giocatore",
  "source_short": "PHB",
  "size": "Media",          # Piccola | Media | Grande
  "speed": 7.5,             # metri (5 ft = 1.5 m)
  "ability_score_increase": {"Costituzione": 2},
  "asi_text": "+2 Costituzione",
  "age": "...",
  "alignment": "...",
  "description": "...",
  "languages": ["Comune", "Nanico"],
  "languages_extra": 0,
  "skill_proficiencies": [],            # auto skill
  "tool_proficiencies": [...],
  "weapon_proficiencies": [...],
  "armor_proficiencies": [],
  "resistances": ["veleno"],
  "darkvision": 18,                     # metri (0 = niente)
  "creature_type": "Umanoide",
  "traits": [
      {
        "name": "Scurovisione",
        "name_en": "Darkvision",
        "description": "...",
        "uses": null,                   # o { amount, recharge }
        "innate_spells": null           # o lista
      },
      ...
  ],
  "subraces": [
      {
        "name": "Nano della Collina",
        "name_en": "Hill Dwarf",
        "ability_score_increase": {"Saggezza": 1},
        "asi_text": "+1 Saggezza",
        "description": "...",
        "traits": [...]                 # stessi schema dei tratti razza
      },
      ...
  ]
}

uses:
  amount: int | "prof_bonus"
  recharge: "long_rest" | "short_rest" | "dawn"

innate_spells: lista di:
  { name_en, name, level, level_cast, min_pg_level, recharge, ability }
  - level: livello base dell'incantesimo (0 = trucchetto)
  - level_cast: a quale livello viene lanciato (per i casi Tiefling: spell
    di liv 1 lanciata come liv 2). Se uguale a level si puo' omettere.
  - min_pg_level: livello PG minimo per ottenere questo incantesimo.
  - recharge: "at_will" per i trucchetti, "long_rest" altrimenti.
  - ability: "Carisma" | "Intelligenza" | "Saggezza" | ...
"""

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

OUT_JSON = HERE / "razze.json"
OUT_JS = ROOT / "js" / "data" / "races_data.js"


# ---------------------------------------------------------------------------
# Libreria di tratti comuni (riusati da piu' razze)
# ---------------------------------------------------------------------------

COMMON_TRAITS = {
    "darkvision_60": {
        "name": "Scurovisione",
        "name_en": "Darkvision",
        "description": "Hai una vista superiore in condizioni di buio e penombra. Puoi vedere in penombra entro 18 metri da te come se fosse luce intensa, e nel buio come se fosse penombra. Non puoi distinguere i colori al buio, solo sfumature di grigio.",
    },
    "darkvision_120": {
        "name": "Scurovisione Superiore",
        "name_en": "Superior Darkvision",
        "description": "Puoi vedere in penombra entro 36 metri da te come se fosse luce intensa, e nel buio come se fosse penombra. Non puoi distinguere i colori al buio, solo sfumature di grigio.",
    },
    "fey_ancestry": {
        "name": "Antenati Fatati",
        "name_en": "Fey Ancestry",
        "description": "Hai vantaggio ai tiri salvezza per evitare di essere ammaliato, e la magia non puo' farti addormentare.",
    },
    "trance": {
        "name": "Trance",
        "name_en": "Trance",
        "description": "Gli elfi non hanno bisogno di dormire. Invece, meditano profondamente, restando semicoscienti, per 4 ore al giorno. Dopo aver riposato in questo modo, ottieni gli stessi benefici che un umano riceverebbe da 8 ore di sonno.",
    },
    "dwarven_resilience": {
        "name": "Resilienza Nanica",
        "name_en": "Dwarven Resilience",
        "description": "Hai vantaggio ai tiri salvezza contro veleno, e hai resistenza ai danni da veleno.",
    },
    "dwarven_combat_training": {
        "name": "Addestramento al Combattimento Nanico",
        "name_en": "Dwarven Combat Training",
        "description": "Hai competenza con ascia da battaglia, ascia da lancio, martello leggero e martello da guerra.",
    },
    "stonecunning": {
        "name": "Esperto di Pietra",
        "name_en": "Stonecunning",
        "description": "Ogni volta che effettui una prova di Intelligenza (Storia) relativa all'origine di una struttura in pietra, sei considerato competente nell'abilita' Storia e aggiungi il doppio del tuo bonus di competenza alla prova, invece del normale bonus di competenza.",
    },
    "tool_proficiency_artisan": {
        "name": "Competenza con Strumenti",
        "name_en": "Tool Proficiency",
        "description": "Ottieni competenza con un tipo di strumenti da artigiano a tua scelta tra: strumenti da fabbro, attrezzi da birraio o strumenti da muratore.",
    },
    "keen_senses": {
        "name": "Sensi Acuti",
        "name_en": "Keen Senses",
        "description": "Hai competenza nell'abilita' Percezione.",
    },
    "lucky": {
        "name": "Fortunato",
        "name_en": "Lucky",
        "description": "Quando ottieni 1 al d20 per un tiro per colpire, una prova di abilita' o un tiro salvezza, puoi ritirare il dado e devi usare il nuovo risultato.",
    },
    "brave": {
        "name": "Coraggioso",
        "name_en": "Brave",
        "description": "Hai vantaggio ai tiri salvezza contro essere spaventato.",
    },
    "halfling_nimbleness": {
        "name": "Agilita' Halfling",
        "name_en": "Halfling Nimbleness",
        "description": "Puoi muoverti attraverso lo spazio occupato da qualsiasi creatura di taglia piu' grande della tua.",
    },
    "powerful_build": {
        "name": "Costituzione Potente",
        "name_en": "Powerful Build",
        "description": "Sei considerato di una taglia piu' grande quando si determina la tua capacita' di carico e il peso che puoi spingere, trascinare o sollevare.",
    },
    "elf_weapon_training": {
        "name": "Addestramento Elfico alle Armi",
        "name_en": "Elf Weapon Training",
        "description": "Hai competenza con spada lunga, spada corta, arco corto e arco lungo.",
    },
    "drow_weapon_training": {
        "name": "Addestramento Drow alle Armi",
        "name_en": "Drow Weapon Training",
        "description": "Hai competenza con spada corta, stocco e balestra a mano.",
    },
    "sunlight_sensitivity": {
        "name": "Sensibilita' alla Luce Solare",
        "name_en": "Sunlight Sensitivity",
        "description": "Hai svantaggio ai tiri per colpire e alle prove di Saggezza (Percezione) basate sulla vista quando tu, il bersaglio del tuo attacco o cio' che cerchi di percepire e' in luce solare diretta.",
    },
    "extra_language": {
        "name": "Linguaggio Aggiuntivo",
        "name_en": "Extra Language",
        "description": "Sai parlare, leggere e scrivere un linguaggio aggiuntivo a tua scelta.",
    },
    "naturally_stealthy": {
        "name": "Naturalmente Furtivo",
        "name_en": "Naturally Stealthy",
        "description": "Puoi tentare di nasconderti anche quando sei oscurato solo da una creatura piu' grande di te.",
    },
    "stout_resilience": {
        "name": "Resilienza Tozza",
        "name_en": "Stout Resilience",
        "description": "Hai vantaggio ai tiri salvezza contro veleno, e hai resistenza ai danni da veleno.",
    },
    "gnome_cunning": {
        "name": "Astuzia Gnomesca",
        "name_en": "Gnome Cunning",
        "description": "Hai vantaggio a tutti i tiri salvezza su Intelligenza, Saggezza e Carisma contro la magia.",
    },
    "skill_versatility": {
        "name": "Versatilita' nelle Abilita'",
        "name_en": "Skill Versatility",
        "description": "Ottieni competenza in due abilita' a tua scelta.",
    },
    "menacing": {
        "name": "Minaccioso",
        "name_en": "Menacing",
        "description": "Hai competenza nell'abilita' Intimidire.",
    },
    "relentless_endurance": {
        "name": "Resistenza Implacabile",
        "name_en": "Relentless Endurance",
        "description": "Quando vieni ridotto a 0 punti ferita ma non ucciso direttamente, puoi scendere a 1 punto ferita invece. Non puoi usare di nuovo questo tratto finche' non finisci un riposo lungo.",
    },
    "savage_attacks": {
        "name": "Attacchi Selvaggi",
        "name_en": "Savage Attacks",
        "description": "Quando metti a segno un colpo critico in mischia, puoi tirare uno dei dadi danno dell'arma un'altra volta e aggiungere quel risultato al danno extra del colpo critico.",
    },
    "hellish_resistance": {
        "name": "Resistenza Infernale",
        "name_en": "Hellish Resistance",
        "description": "Hai resistenza ai danni da fuoco.",
    },
    "amphibious": {
        "name": "Anfibio",
        "name_en": "Amphibious",
        "description": "Puoi respirare sia aria che acqua.",
    },
    "swim_speed_30": {
        "name": "Velocita' di Nuoto",
        "name_en": "Swim Speed",
        "description": "Hai una velocita' di nuoto di 9 metri.",
    },
    "natural_athlete": {
        "name": "Atleta Nato",
        "name_en": "Natural Athlete",
        "description": "Hai competenza nell'abilita' Atletica.",
    },
    "stones_endurance": {
        "name": "Resistenza della Pietra",
        "name_en": "Stone's Endurance",
        "description": "Puoi concentrarti per resistere a un danno. Quando subisci danni, puoi usare la tua reazione per tirare 1d12, sommare il tuo modificatore di Costituzione, e ridurre i danni di quel valore. Dopo aver usato questo tratto, devi finire un riposo breve o lungo prima di poterlo usare di nuovo.",
        "uses": {"amount": 1, "recharge": "short_rest"},
    },
    "mountain_born": {
        "name": "Nato sulle Montagne",
        "name_en": "Mountain Born",
        "description": "Sei abituato al freddo: hai resistenza ai danni da freddo e non subisci penalita' per altitudini elevate fino a 6.000 metri.",
    },
    # --- VGtM ---
    "celestial_resistance": {
        "name": "Resistenza Celestiale",
        "name_en": "Celestial Resistance",
        "description": "Hai resistenza ai danni necrotici e ai danni radiosi.",
    },
    "healing_hands": {
        "name": "Mani Curatrici",
        "name_en": "Healing Hands",
        "description": "Come azione, puoi toccare una creatura e farla recuperare un numero di punti ferita pari al tuo livello. Una volta usata questa abilita', non puoi usarla di nuovo finche' non termini un riposo lungo.",
        "uses": {"amount": 1, "recharge": "long_rest"},
    },
    "light_bearer": {
        "name": "Portatore di Luce",
        "name_en": "Light Bearer",
        "description": "Conosci il trucchetto luce. Il Carisma e' la tua caratteristica da incantatore per esso.",
        "innate_spells": [
            {"name_en": "Light", "name": "Luce", "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will", "ability": "Carisma"},
        ],
    },
    "firbolg_magic": {
        "name": "Magia Firbolg",
        "name_en": "Firbolg Magic",
        "description": "Puoi lanciare individuazione del magico e mascherarsi con questo tratto, usando la Saggezza come caratteristica da incantatore. Una volta lanciato uno dei due con questo tratto, devi finire un riposo breve o lungo prima di poterlo lanciare di nuovo. Quando usi questa versione di mascherarsi, puoi sembrare alto fino a 90 cm in piu' o in meno.",
        "uses": {"amount": 1, "recharge": "short_rest"},
        "innate_spells": [
            {"name_en": "Detect Magic", "name": "Individuazione del Magico", "level": 1, "level_cast": 1, "min_pg_level": 1, "recharge": "short_rest", "ability": "Saggezza"},
            {"name_en": "Disguise Self", "name": "Camuffare Sé Stesso", "level": 1, "level_cast": 1, "min_pg_level": 1, "recharge": "short_rest", "ability": "Saggezza"},
        ],
    },
    "hidden_step": {
        "name": "Passo Nascosto",
        "name_en": "Hidden Step",
        "description": "Come azione bonus, puoi diventare invisibile fino all'inizio del tuo prossimo turno o fino a quando attacchi, infliggi danni o costringi qualcuno a effettuare un tiro salvezza. Una volta usato questo tratto, non puoi usarlo di nuovo finche' non termini un riposo breve o lungo.",
        "uses": {"amount": 1, "recharge": "short_rest"},
    },
    "speech_of_beast_and_leaf": {
        "name": "Linguaggio di Bestie e Foglie",
        "name_en": "Speech of Beast and Leaf",
        "description": "Hai la capacita' di comunicare in maniera limitata con bestie e piante. Esse possono comprendere il significato delle tue parole, anche se non hai una capacita' speciale di comprenderle in cambio. Hai vantaggio a tutte le prove di Carisma effettuate per influenzarle.",
    },
    "feline_agility": {
        "name": "Agilita' Felina",
        "name_en": "Feline Agility",
        "description": "I tuoi riflessi e l'agilita' ti permettono di muoverti con scatti improvvisi di velocita'. Quando ti muovi durante il tuo turno in combattimento, puoi raddoppiare la tua velocita' fino alla fine del turno. Una volta usato questo tratto, non puoi usarlo di nuovo finche' non rimani fermo per 1 turno.",
    },
    "cats_claws": {
        "name": "Artigli del Gatto",
        "name_en": "Cat's Claws",
        "description": "Grazie ai tuoi artigli, hai una velocita' di scalata di 6 metri. Inoltre, i tuoi artigli sono armi naturali, che puoi usare per effettuare attacchi senza armi. Se colpisci con essi, infliggi danni taglienti pari a 1d4 + il tuo modificatore di Forza, invece dei normali danni contundenti per un attacco senz'armi.",
    },
    "cats_talents": {
        "name": "Talenti del Gatto",
        "name_en": "Cat's Talents",
        "description": "Hai competenza nelle abilita' Percezione e Furtivita'.",
    },
    "control_air_and_water": {
        "name": "Controllo dell'Aria e dell'Acqua",
        "name_en": "Control Air and Water",
        "description": "Da un giovane triton, sai influenzare gli elementi. Conosci il trucchetto folata di vento. Quando raggiungi il 3 livello, puoi lanciare nebbia. Quando raggiungi il 5 livello, puoi lanciare camminare sull'acqua. Una volta lanciato un incantesimo con questo tratto, non puoi lanciarlo di nuovo finche' non termini un riposo lungo. Il Carisma e' la tua caratteristica da incantatore per essi.",
        "innate_spells": [
            {"name_en": "Fog Cloud", "name": "Nube di Nebbia", "level": 1, "level_cast": 1, "min_pg_level": 3, "recharge": "long_rest", "ability": "Carisma"},
            {"name_en": "Gust of Wind", "name": "Folata di Vento", "level": 2, "level_cast": 2, "min_pg_level": 5, "recharge": "long_rest", "ability": "Carisma"},
            {"name_en": "Wall of Water", "name": "Muro d'Acqua", "level": 3, "level_cast": 3, "min_pg_level": 5, "recharge": "long_rest", "ability": "Carisma"},
        ],
    },
    "emissary_of_the_sea": {
        "name": "Emissario del Mare",
        "name_en": "Emissary of the Sea",
        "description": "Le bestie acquatiche hanno una straordinaria affinita' con il tuo popolo. Puoi comunicare semplici idee con bestie che possono respirare acqua. Esse possono comprendere il significato delle tue parole, anche se tu non hai capacita' speciale di comprenderle a tua volta.",
    },
    "guardians_of_the_depths": {
        "name": "Guardiani delle Profondita'",
        "name_en": "Guardians of the Depths",
        "description": "Adattatosi a vivere a grandi profondita', hai resistenza ai danni da freddo.",
    },
    "fury_of_the_small": {
        "name": "Furia dei Piccoli",
        "name_en": "Fury of the Small",
        "description": "Quando colpisci con un attacco una creatura di taglia piu' grande della tua, puoi infliggere 1d6 danni extra all'attacco. Una volta usato questo tratto, non puoi usarlo di nuovo finche' non termini un riposo breve o lungo.",
        "uses": {"amount": 1, "recharge": "short_rest"},
    },
    "nimble_escape": {
        "name": "Fuga Agile",
        "name_en": "Nimble Escape",
        "description": "Puoi effettuare l'azione di Disimpegno o di Nascondersi come azione bonus durante ognuno dei tuoi turni.",
    },
    "martial_training": {
        "name": "Addestramento Marziale",
        "name_en": "Martial Training",
        "description": "Hai competenza con due armi marziali a tua scelta e con tutte le armature leggere.",
    },
    "saving_face": {
        "name": "Salvare la Faccia",
        "name_en": "Saving Face",
        "description": "Sei orgoglioso, e qualunque tipo di insuccesso ti spinge a fare meglio. Quando manchi un tiro per colpire o fallisci una prova di abilita' o un tiro salvezza, puoi ottenere un bonus al tiro pari al numero di alleati a 9 metri da te (massimo +5). Una volta usato questo tratto, non puoi usarlo di nuovo finche' non termini un riposo breve o lungo.",
        "uses": {"amount": 1, "recharge": "short_rest"},
    },
    "pack_tactics": {
        "name": "Tattica del Branco",
        "name_en": "Pack Tactics",
        "description": "Hai vantaggio ai tiri per colpire contro una creatura se almeno uno dei tuoi alleati si trova entro 1,5 metri dalla creatura e non e' incapacitato.",
    },
    "grovel_cower_and_beg": {
        "name": "Inchinarsi, Acquattarsi e Implorare",
        "name_en": "Grovel, Cower, and Beg",
        "description": "Come azione durante il tuo turno, puoi piagnucolare in modo penoso per distrarre i nemici nelle vicinanze. Tutte le creature entro 3 metri da te che possono vederti hanno vantaggio ai tiri per colpire effettuati contro di te fino alla fine del tuo prossimo turno. Una volta usato questo tratto, non puoi usarlo di nuovo finche' non termini un riposo breve o lungo.",
        "uses": {"amount": 1, "recharge": "short_rest"},
    },
    "aggressive": {
        "name": "Aggressivo",
        "name_en": "Aggressive",
        "description": "Come azione bonus, puoi muoverti fino a una distanza pari alla tua velocita' verso un nemico ostile che puoi vedere.",
    },
    "primal_intuition": {
        "name": "Intuizione Primordiale",
        "name_en": "Primal Intuition",
        "description": "Ottieni competenza in due delle seguenti abilita' a tua scelta: Addestrare Animali, Atletica, Intimidire, Natura, Percezione, Sopravvivenza.",
    },
    "powerful_build_orc": {
        "name": "Costituzione Potente",
        "name_en": "Powerful Build",
        "description": "Sei considerato di una taglia piu' grande quando si determina la tua capacita' di carico e il peso che puoi spingere, trascinare o sollevare.",
    },
    "surprise_attack": {
        "name": "Attacco a Sorpresa",
        "name_en": "Surprise Attack",
        "description": "Se sorprendi una creatura e la colpisci con un attacco durante il primo turno di combattimento, il bersaglio subisce 2d6 danni extra dall'attacco. Puoi usare questo tratto solo una volta per ogni combattimento.",
    },
    "long_limbed": {
        "name": "Arti Lunghi",
        "name_en": "Long-Limbed",
        "description": "Quando effettui un attacco in mischia durante il tuo turno, la tua portata per esso e' di 1,5 metri in piu' del normale.",
    },
    "sneaky_bugbear": {
        "name": "Furtivo",
        "name_en": "Sneaky",
        "description": "Hai competenza nell'abilita' Furtivita'.",
    },
    "expert_forgery": {
        "name": "Falsificatore Esperto",
        "name_en": "Expert Forgery",
        "description": "Hai vantaggio a qualunque prova effettuata per duplicare qualunque oggetto esistente.",
    },
    "kenku_training": {
        "name": "Addestramento Kenku",
        "name_en": "Kenku Training",
        "description": "Ottieni competenza in due delle seguenti abilita' a tua scelta: Acrobazia, Furtivita', Inganno, Rapidita' di Mano.",
    },
    "mimicry_kenku": {
        "name": "Mimetismo",
        "name_en": "Mimicry",
        "description": "Puoi imitare suoni che hai sentito, inclusi voci. Una creatura che li sente puo' capire che e' un'imitazione effettuando con successo una prova di Saggezza (Intuizione) contro la tua prova di Carisma (Inganno).",
    },
    "bite_lizardfolk": {
        "name": "Morso",
        "name_en": "Bite",
        "description": "I tuoi denti aguzzi sono armi naturali, che puoi usare per effettuare attacchi senza armi. Se colpisci con essi, infliggi danni perforanti pari a 1d6 + il tuo modificatore di Forza, invece del normale danno contundente per un attacco senza armi.",
    },
    "cunning_artisan": {
        "name": "Artigiano Astuto",
        "name_en": "Cunning Artisan",
        "description": "Come parte di un riposo breve, puoi cogliere ossa, scaglie e nascondere da una bestia che hai aiutato a uccidere e creare uno dei seguenti oggetti: uno scudo, una clava, un giavellotto o 1d4 dardi o frecce.",
    },
    "hold_breath_lizardfolk": {
        "name": "Trattieni il Respiro",
        "name_en": "Hold Breath",
        "description": "Puoi trattenere il respiro fino a 15 minuti.",
    },
    "hunters_lore": {
        "name": "Sapere del Cacciatore",
        "name_en": "Hunter's Lore",
        "description": "Ottieni competenza in due delle seguenti abilita' a tua scelta: Addestrare Animali, Natura, Percezione, Sopravvivenza, Furtivita'.",
    },
    "natural_armor_lizardfolk": {
        "name": "Armatura Naturale",
        "name_en": "Natural Armor",
        "description": "Hai dure scaglie. Se non indossi alcuna armatura, la tua CA e' 13 + il tuo modificatore di Destrezza. Puoi usare la tua armatura naturale per determinare la CA se l'armatura che indossi ti garantirebbe una CA inferiore. Uno scudo ti permette comunque di trarne benefici.",
    },
    "hungry_jaws": {
        "name": "Mascelle Affamate",
        "name_en": "Hungry Jaws",
        "description": "In battaglia, puoi gettarti voracemente sui nemici per nutrirti. Come azione bonus, puoi effettuare un attacco speciale con il tuo morso. Se colpisci, l'attacco infligge i suoi normali danni e ottieni temporaneamente un numero di punti ferita pari al tuo modificatore di Costituzione (minimo 1). Una volta usato questo tratto, non puoi usarlo di nuovo finche' non termini un riposo breve o lungo.",
        "uses": {"amount": 1, "recharge": "short_rest"},
    },
    "innate_spellcasting_yuanti": {
        "name": "Incantesimi Innati",
        "name_en": "Innate Spellcasting",
        "description": "Conosci il trucchetto velenare. Puoi lanciare charme su persone come incantesimo di livello 2 con questo tratto, e a partire dal 3 livello puoi lanciare anche scrutare il pensiero. Devi terminare un riposo lungo per lanciare di nuovo questi incantesimi con questo tratto. Il Carisma e' la tua caratteristica da incantatore per essi.",
        "innate_spells": [
            {"name_en": "Poison Spray", "name": "Spruzzo Velenoso", "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will", "ability": "Carisma"},
            {"name_en": "Animal Friendship", "name": "Amicizia con gli Animali", "level": 1, "level_cast": 1, "min_pg_level": 1, "recharge": "at_will", "ability": "Carisma"},
            {"name_en": "Suggestion", "name": "Suggestione", "level": 2, "level_cast": 2, "min_pg_level": 3, "recharge": "long_rest", "ability": "Carisma"},
        ],
    },
    "magic_resistance_yuanti": {
        "name": "Resistenza Magica",
        "name_en": "Magic Resistance",
        "description": "Hai vantaggio ai tiri salvezza contro incantesimi e altri effetti magici.",
    },
    "poison_immunity": {
        "name": "Immunita' al Veleno",
        "name_en": "Poison Immunity",
        "description": "Sei immune ai danni da veleno e alla condizione avvelenato.",
    },
    # --- MToF ---
    "fey_step": {
        "name": "Passo Fatato",
        "name_en": "Fey Step",
        "description": "Come azione bonus, puoi teletrasportarti fino a 9 metri in uno spazio non occupato che puoi vedere. Una volta usato questo tratto, non puoi usarlo di nuovo finche' non termini un riposo breve o lungo.",
        "uses": {"amount": 1, "recharge": "short_rest"},
    },
    "child_of_the_sea": {
        "name": "Figlio del Mare",
        "name_en": "Child of the Sea",
        "description": "Hai una velocita' di nuoto di 9 metri e puoi respirare sia aria che acqua.",
    },
    "friend_of_the_sea": {
        "name": "Amico del Mare",
        "name_en": "Friend of the Sea",
        "description": "Usando suoni e gesti, puoi comunicare semplici idee con qualsiasi bestia con velocita' di nuoto innata.",
    },
    "necrotic_resistance": {
        "name": "Resistenza Necrotica",
        "name_en": "Necrotic Resistance",
        "description": "Hai resistenza ai danni necrotici.",
    },
    "blessing_of_raven_queen": {
        "name": "Benedizione della Regina Corvo",
        "name_en": "Blessing of the Raven Queen",
        "description": "Come azione bonus, puoi teletrasportarti fino a 9 metri in uno spazio non occupato che puoi vedere. Una volta usato questo tratto, non puoi usarlo di nuovo finche' non termini un riposo lungo. A partire dall'11 livello, ottieni anche resistenza a tutti i danni quando ti teletrasporti usando questo tratto. La resistenza dura fino all'inizio del tuo prossimo turno.",
        "uses": {"amount": 1, "recharge": "long_rest"},
    },
    "duergar_resilience": {
        "name": "Resilienza Duergar",
        "name_en": "Duergar Resilience",
        "description": "Hai vantaggio ai tiri salvezza contro illusioni e contro essere ammaliato o paralizzato.",
    },
    "duergar_magic": {
        "name": "Magia Duergar",
        "name_en": "Duergar Magic",
        "description": "Quando raggiungi il 3 livello, puoi lanciare ingrandire/ridurre su te stesso una volta con questo tratto, usando solo la versione 'ingrandire' dell'incantesimo. Quando raggiungi il 5 livello, puoi lanciare invisibilita' su te stesso una volta con questo tratto. Non hai bisogno di componenti materiali per questi incantesimi e non puoi lanciarli mentre sei alla luce solare diretta. Una volta lanciato uno dei due incantesimi, devi finire un riposo lungo prima di poterlo lanciare di nuovo. La Forza e' la tua caratteristica da incantatore per essi.",
        "innate_spells": [
            {"name_en": "Enlarge/Reduce", "name": "Ingrandire/Ridurre", "level": 2, "level_cast": 2, "min_pg_level": 3, "recharge": "long_rest", "ability": "Forza"},
            {"name_en": "Invisibility", "name": "Invisibilità", "level": 2, "level_cast": 2, "min_pg_level": 5, "recharge": "long_rest", "ability": "Forza"},
        ],
    },
    "stone_camouflage": {
        "name": "Mimetismo nella Pietra",
        "name_en": "Stone Camouflage",
        "description": "Hai vantaggio alle prove di Destrezza (Furtivita') effettuate per nasconderti in terreno roccioso.",
    },
    "githyanki_psionics": {
        "name": "Psionica Githyanki",
        "name_en": "Githyanki Psionics",
        "description": "Conosci il trucchetto mano magica, e la mano e' invisibile quando lo lanci con questo tratto. Quando raggiungi il 3 livello, puoi lanciare salto una volta con questo tratto, e riacquisti la capacita' di lanciarlo cosi' quando termini un riposo lungo. Quando raggiungi il 5 livello, puoi lanciare nebbia mistificante una volta con questo tratto, e riacquisti la capacita' di lanciarlo cosi' quando termini un riposo lungo. L'Intelligenza e' la tua caratteristica da incantatore per essi.",
        "innate_spells": [
            {"name_en": "Mage Hand", "name": "Mano Magica", "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will", "ability": "Intelligenza"},
            {"name_en": "Jump", "name": "Saltare", "level": 1, "level_cast": 1, "min_pg_level": 3, "recharge": "long_rest", "ability": "Intelligenza"},
            {"name_en": "Misty Step", "name": "Passo Velato", "level": 2, "level_cast": 2, "min_pg_level": 5, "recharge": "long_rest", "ability": "Intelligenza"},
        ],
    },
    "decadent_mastery": {
        "name": "Maestria Decadente",
        "name_en": "Decadent Mastery",
        "description": "Impari un'altra lingua a tua scelta, e sei competente con la tua scelta tra una abilita' o uno strumento. Per i githyanki, riflesso della loro vita militare ed elitaria.",
    },
    "martial_prodigy_githyanki": {
        "name": "Prodigio Marziale",
        "name_en": "Martial Prodigy",
        "description": "Sei competente con armature leggere e medie e con spada corta, spada lunga e spada bastarda.",
    },
    "githzerai_psionics": {
        "name": "Psionica Githzerai",
        "name_en": "Githzerai Psionics",
        "description": "Conosci il trucchetto mano magica, e la mano e' invisibile quando lo lanci con questo tratto. Quando raggiungi il 3 livello, puoi lanciare scudo una volta con questo tratto, e riacquisti la capacita' di lanciarlo cosi' quando termini un riposo lungo. Quando raggiungi il 5 livello, puoi lanciare detezione del pensiero una volta con questo tratto, e riacquisti la capacita' di lanciarlo cosi' quando termini un riposo lungo. La Saggezza e' la tua caratteristica da incantatore per essi.",
        "innate_spells": [
            {"name_en": "Mage Hand", "name": "Mano Magica", "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will", "ability": "Saggezza"},
            {"name_en": "Shield", "name": "Scudo", "level": 1, "level_cast": 1, "min_pg_level": 3, "recharge": "long_rest", "ability": "Saggezza"},
            {"name_en": "Detect Thoughts", "name": "Individuazione del Pensiero", "level": 2, "level_cast": 2, "min_pg_level": 5, "recharge": "long_rest", "ability": "Saggezza"},
        ],
    },
    "mental_discipline": {
        "name": "Disciplina Mentale",
        "name_en": "Mental Discipline",
        "description": "Hai vantaggio ai tiri salvezza contro l'effetto ammaliato e spaventato.",
    },
    # --- MOoT / ToA ---
    "fey_creature_type": {
        "name": "Creatura Fatata",
        "name_en": "Fey",
        "description": "Il tuo tipo di creatura e' fatato, anziche' umanoide.",
    },
    "charge": {
        "name": "Carica",
        "name_en": "Charge",
        "description": "Se ti muovi di almeno 9 metri in linea retta verso un bersaglio e poi lo colpisci con un attacco in mischia con un'arma da impatto nello stesso turno, puoi infliggere 1d6 danni extra del tipo dell'arma. Se l'attacco infligge danni, il bersaglio deve effettuare un tiro salvezza su Forza (CD 8 + bonus competenza + mod Forza) o essere atterrato. Puoi usare questa abilita' un numero di volte pari al tuo bonus di competenza, e riacquisti tutti gli usi quando termini un riposo lungo.",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
    },
    "equine_build": {
        "name": "Costituzione Equina",
        "name_en": "Equine Build",
        "description": "Sei considerato di una taglia piu' grande quando si determina la tua capacita' di carico e il peso che puoi spingere o trascinare. Inoltre, qualunque scalata che richiede mani e piedi e' particolarmente difficile per te per via della tua forma equina. Quando ti muovi in scalata, ogni 30 cm di movimento ti costano 1,2 metri extra invece di 30 cm extra.",
    },
    "hooves": {
        "name": "Zoccoli",
        "name_en": "Hooves",
        "description": "I tuoi zoccoli sono armi naturali, che puoi usare per effettuare attacchi senza armi. Se colpisci con essi, infliggi danni contundenti pari a 1d4 + il tuo modificatore di Forza, invece dei normali danni di un attacco senza armi.",
    },
    "survivor_centaur": {
        "name": "Sapere del Centauro",
        "name_en": "Centaur Lore",
        "description": "Sei competente in due delle seguenti abilita' a tua scelta: Addestrare Animali, Medicina, Natura, Sopravvivenza.",
    },
    "daunting_roar": {
        "name": "Ruggito Spaventoso",
        "name_en": "Daunting Roar",
        "description": "Come azione bonus, puoi ruggire ferocemente. Ogni creatura entro 3 metri da te che puoi vedere deve effettuare un tiro salvezza su Saggezza (CD 8 + bonus competenza + mod Costituzione) o essere spaventata da te fino alla fine del tuo prossimo turno. Una volta usato questo tratto, non puoi usarlo di nuovo finche' non termini un riposo breve o lungo.",
        "uses": {"amount": 1, "recharge": "short_rest"},
    },
    "hunters_instincts": {
        "name": "Istinti del Cacciatore",
        "name_en": "Hunter's Instincts",
        "description": "Sei competente in una delle seguenti abilita' a tua scelta: Atletica, Intimidire, Percezione, Sopravvivenza.",
    },
    "claws_leonin": {
        "name": "Artigli",
        "name_en": "Claws",
        "description": "I tuoi artigli sono armi naturali, che puoi usare per effettuare attacchi senza armi. Se colpisci con essi, infliggi danni taglienti pari a 1d4 + il tuo modificatore di Forza, invece dei normali danni contundenti per un attacco senza armi.",
    },
    "horns_minotaur": {
        "name": "Corna",
        "name_en": "Horns",
        "description": "Le tue corna sono armi naturali, che puoi usare per effettuare attacchi senza armi. Se colpisci con esse, infliggi danni perforanti pari a 1d6 + il tuo modificatore di Forza, invece dei normali danni di un attacco senza armi.",
    },
    "goring_rush": {
        "name": "Carica con le Corna",
        "name_en": "Goring Rush",
        "description": "Subito dopo aver effettuato l'azione di Scattare durante il tuo turno e prima del termine del turno, puoi effettuare un attacco in mischia con le tue corna come azione bonus.",
    },
    "hammering_horns": {
        "name": "Corna che Martellano",
        "name_en": "Hammering Horns",
        "description": "Subito dopo aver colpito una creatura con un attacco in mischia con un'arma durante il tuo turno, puoi tentare di spingere quella creatura con le tue corna usando la tua azione bonus. Il bersaglio deve essere di una taglia non superiore alla tua e a portata. Deve effettuare un tiro salvezza su Forza (CD 8 + bonus competenza + mod Forza). In caso di fallimento, lo spingi fino a 3 metri.",
    },
    "labyrinthine_recall": {
        "name": "Memoria del Labirinto",
        "name_en": "Labyrinthine Recall",
        "description": "Puoi ricordare perfettamente qualunque percorso tu abbia mai percorso.",
    },
    "magic_resistance_satyr": {
        "name": "Resistenza Magica",
        "name_en": "Magic Resistance",
        "description": "Hai vantaggio ai tiri salvezza contro incantesimi.",
    },
    "mirthful_leaps": {
        "name": "Salti Allegri",
        "name_en": "Mirthful Leaps",
        "description": "Quando effettui un salto in lungo o in alto, puoi tirare 1d8 e aggiungere il numero ottenuto al numero di metri saltati, anche quando salti solo di 30 cm.",
    },
    "reveler_satyr": {
        "name": "Festaiolo",
        "name_en": "Reveler",
        "description": "Sei competente nell'abilita' Intrattenere ed in uno strumento musicale a tua scelta.",
    },
    "ram_satyr": {
        "name": "Corna d'Ariete",
        "name_en": "Ram",
        "description": "Puoi usare la tua testa e le corna per effettuare attacchi senza armi. Se colpisci, infliggi danni contundenti pari a 1d4 + il tuo modificatore di Forza, invece dei normali danni di un attacco senza armi.",
    },
    "claws_tortle": {
        "name": "Artigli",
        "name_en": "Claws",
        "description": "I tuoi artigli sono armi naturali. Se colpisci con essi, infliggi danni taglienti pari a 1d4 + il tuo modificatore di Forza, invece dei normali danni di un attacco senza armi. Hai vantaggio alle prove di Forza per scalare.",
    },
    "hold_breath_tortle": {
        "name": "Trattieni il Respiro",
        "name_en": "Hold Breath",
        "description": "Puoi trattenere il respiro fino a 1 ora alla volta. I tortle non sono creature acquatiche, ma possono restare a lungo sott'acqua.",
    },
    "natural_armor_tortle": {
        "name": "Armatura Naturale",
        "name_en": "Natural Armor",
        "description": "Per via del tuo guscio, hai una CA base di 17 (a cui non si aggiunge il modificatore di Destrezza). Non puoi indossare armatura, ma puoi comunque trarre beneficio da uno scudo. Inoltre, puoi ritirarti nel tuo guscio come azione: ottieni +4 alla CA, hai vantaggio ai tiri salvezza su Forza e Costituzione, ma velocita' 0 e svantaggio ai tiri salvezza su Destrezza.",
    },
    "shell_defense": {
        "name": "Difesa del Guscio",
        "name_en": "Shell Defense",
        "description": "Puoi ritirarti nel tuo guscio come azione. Fino a quando non emergi, ottieni +4 alla CA e hai vantaggio ai tiri salvezza su Forza e Costituzione. Mentre sei nel tuo guscio, sei prono, la tua velocita' e' 0 e non puoi aumentarla, hai svantaggio ai tiri salvezza su Destrezza, non puoi reagire e l'unica azione che puoi effettuare e' un'azione bonus per uscire dal guscio.",
    },
    "survival_instinct_tortle": {
        "name": "Istinto di Sopravvivenza",
        "name_en": "Survival Instinct",
        "description": "Hai competenza nell'abilita' Sopravvivenza. Questo riflette il fatto che i tortle sono spesso eremiti e cacciatori esperti dell'isola di Anchorome.",
    },
    # ---------------------------------------------------------------------
    # --- MMM (Mordenkainen presenta: Mostri del Multiverso) ---
    # Tratti aggiornati o introdotti dall'edizione MMM, che rimpiazza VGtM,
    # MToF, parti di MOoT/EGtW/ToA/Tasha. Per le razze ripubblicate l'ASI e'
    # flottante (gestito dal client) e molti tratti scalano col bonus
    # competenza.
    # ---------------------------------------------------------------------
    "fey_ancestry_bugbear": {
        "name": "Discendenza Fatata",
        "name_en": "Fey Ancestry",
        "description": "Hai vantaggio ai tiri salvezza che effettui per evitare di essere ammaliato.",
    },
    "powerful_build_mmm": {
        "name": "Costituzione Potente",
        "name_en": "Powerful Build",
        "description": "Sei considerato di una taglia piu' grande quando si determina la tua capacita' di carico e il peso che puoi spingere, trascinare o sollevare.",
    },
    "sneaky_mmm": {
        "name": "Furtivo",
        "name_en": "Sneaky",
        "description": "Hai competenza nell'abilita' Furtivita'. Inoltre, puoi muoverti attraverso lo spazio di qualunque creatura piu' grande di te, ma non puoi terminare il tuo turno nel suo spazio.",
    },
    "surprise_attack_mmm": {
        "name": "Attacco a Sorpresa",
        "name_en": "Surprise Attack",
        "description": "Se sorprendi una creatura e la colpisci con un attacco durante il primo turno di combattimento, il bersaglio subisce 2d6 danni extra dall'attacco. Puoi usare questo tratto solo una volta per ogni combattimento.",
    },
    "fury_of_the_small_mmm": {
        "name": "Furia dei Piccoli",
        "name_en": "Fury of the Small",
        "description": "Quando colpisci con un attacco una creatura di taglia piu' grande della tua, puoi infliggere danni extra al bersaglio pari al tuo livello del personaggio. Puoi usare questo tratto un numero di volte pari al tuo bonus di competenza, e riacquisti tutti gli usi quando termini un riposo lungo.",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
    },
    "fey_gift": {
        "name": "Dono Fatato",
        "name_en": "Fey Gift",
        "description": "Puoi effettuare l'azione di Aiuto come azione bonus. Quando raggiungi il 3 livello, ogni volta che dai aiuto a una creatura tramite questo tratto la creatura ottiene anche un numero di punti ferita temporanei pari al tuo bonus di competenza. Quando raggiungi il 5 livello, una creatura aiutata da te ottiene vantaggio anche al primo tiro per colpire o tiro salvezza che effettua prima dell'inizio del tuo prossimo turno. Puoi usare questo tratto un numero di volte pari al tuo bonus di competenza e riacquisti tutti gli usi quando termini un riposo lungo.",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
    },
    "fortune_from_the_many": {
        "name": "Fortuna dei Molti",
        "name_en": "Fortune from the Many",
        "description": "Quando manchi un tiro per colpire o fallisci una prova di abilita' o un tiro salvezza, puoi ottenere un bonus al tiro pari al numero di alleati a 9 metri da te (massimo +3). Una volta usato questo tratto, non puoi usarlo di nuovo finche' non termini un riposo lungo.",
        "uses": {"amount": 1, "recharge": "long_rest"},
    },
    "draconic_cry": {
        "name": "Grido Draconico",
        "name_en": "Draconic Cry",
        "description": "Come azione bonus, puoi lanciare un grido di guerra a una distanza di 3 metri. Fino all'inizio del tuo prossimo turno, hai vantaggio ai tiri per colpire contro un nemico in quel raggio. Puoi usare questo tratto un numero di volte pari al tuo bonus di competenza, e riacquisti tutti gli usi quando termini un riposo lungo.",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
    },
    "kobold_legacy": {
        "name": "Eredita' Coboldica",
        "name_en": "Kobold Legacy",
        "description": "I tuoi antenati hanno benedetto la tua linea di sangue con un'eredita' specifica. Scegli una delle seguenti opzioni: Sfida (competenza in un tipo di tiro salvezza a tua scelta), Stregoneria Draconica (un trucchetto a tua scelta dalla lista del mago, con il Carisma come caratteristica da incantatore) o Astuzia (competenza in un'abilita' a tua scelta).",
    },
    "adrenaline_rush": {
        "name": "Scarica di Adrenalina",
        "name_en": "Adrenaline Rush",
        "description": "Come azione bonus puoi effettuare l'azione di Scattare. Quando lo fai, ottieni un numero di punti ferita temporanei pari al tuo bonus di competenza. Puoi usare questo tratto un numero di volte pari al tuo bonus di competenza e riacquisti tutti gli usi quando termini un riposo breve o lungo.",
        "uses": {"amount": "prof_bonus", "recharge": "short_rest"},
    },
    "relentless_endurance_mmm": {
        "name": "Resistenza Inesorabile",
        "name_en": "Relentless Endurance",
        "description": "Quando vieni ridotto a 0 punti ferita ma non ucciso direttamente, puoi scendere a 1 punto ferita invece. Una volta usato questo tratto, non puoi usarlo di nuovo finche' non termini un riposo lungo.",
        "uses": {"amount": 1, "recharge": "long_rest"},
    },
    "yuanti_innate_spellcasting_mmm": {
        "name": "Incantesimi Innati Yuan-ti",
        "name_en": "Innate Spellcasting",
        "description": "Conosci il trucchetto velenare. Quando raggiungi il 3 livello, puoi lanciare suggestione una volta con questo tratto. Quando raggiungi il 5 livello, puoi lanciare amicizia con gli animali un numero illimitato di volte ma solo a serpenti, e suggestione una volta con questo tratto. Devi terminare un riposo lungo per lanciare di nuovo suggestione con questo tratto. Il Carisma e' la tua caratteristica da incantatore per essi.",
        "innate_spells": [
            {"name_en": "Poison Spray", "name": "Spruzzo Velenoso", "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will", "ability": "Carisma"},
            {"name_en": "Animal Friendship", "name": "Amicizia con gli Animali", "level": 1, "level_cast": 1, "min_pg_level": 5, "recharge": "at_will", "ability": "Carisma"},
            {"name_en": "Suggestion", "name": "Suggestione", "level": 2, "level_cast": 2, "min_pg_level": 3, "recharge": "long_rest", "ability": "Carisma"},
        ],
    },
    "firbolg_magic_mmm": {
        "name": "Magia Firbolg",
        "name_en": "Firbolg Magic",
        "description": "Puoi lanciare individuazione del magico e camuffare se' stesso con questo tratto. A partire dal 3 livello, puoi anche lanciare comprendere linguaggi. Puoi lanciare ognuno di questi incantesimi un numero di volte pari al tuo bonus di competenza, e riacquisti tutti gli usi quando termini un riposo lungo. La Saggezza, l'Intelligenza o il Carisma e' la tua caratteristica da incantatore per essi (a tua scelta).",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
        "innate_spells": [
            {"name_en": "Detect Magic",   "name": "Individuazione del Magico", "level": 1, "level_cast": 1, "min_pg_level": 1, "recharge": "long_rest", "ability": "Saggezza"},
            {"name_en": "Disguise Self",  "name": "Camuffare Sé Stesso",       "level": 1, "level_cast": 1, "min_pg_level": 1, "recharge": "long_rest", "ability": "Saggezza"},
            {"name_en": "Comprehend Languages", "name": "Comprendere Linguaggi", "level": 1, "level_cast": 1, "min_pg_level": 3, "recharge": "long_rest", "ability": "Saggezza"},
        ],
    },
    "hidden_step_mmm": {
        "name": "Passo Nascosto",
        "name_en": "Hidden Step",
        "description": "Come azione bonus, puoi diventare invisibile fino all'inizio del tuo prossimo turno o fino a quando attacchi, infliggi danni o costringi qualcuno a effettuare un tiro salvezza. Puoi usare questo tratto un numero di volte pari al tuo bonus di competenza e riacquisti tutti gli usi quando termini un riposo lungo.",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
    },
    "kenku_recall": {
        "name": "Memoria Kenku",
        "name_en": "Kenku Recall",
        "description": "Hai competenza in due delle seguenti abilita' a tua scelta: Acrobazia, Inganno, Intuizione, Indagare, Atletica, Furtivita'. Quando effettui una prova di queste abilita', puoi tirare 1d4 e aggiungerne il risultato. Puoi usare questa proprieta' un numero di volte pari al tuo bonus di competenza, e riacquisti gli usi quando termini un riposo lungo.",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
    },
    "mimicry_kenku_mmm": {
        "name": "Mimetismo",
        "name_en": "Mimicry",
        "description": "Puoi imitare suoni che hai sentito, inclusi voci. Una creatura che li sente puo' capire che e' un'imitazione effettuando con successo una prova di Saggezza (Intuizione) contro la tua prova di Carisma (Inganno).",
    },
    "bite_lizardfolk_mmm": {
        "name": "Morso",
        "name_en": "Bite",
        "description": "I tuoi denti aguzzi sono armi naturali, che puoi usare per effettuare attacchi senza armi. Se colpisci con essi, infliggi danni perforanti pari a 1d6 + il tuo modificatore di Forza, invece del normale danno contundente.",
    },
    "natural_armor_lizardfolk_mmm": {
        "name": "Armatura Naturale",
        "name_en": "Natural Armor",
        "description": "Hai dure scaglie. Se non indossi alcuna armatura, la tua CA e' 13 + il tuo modificatore di Destrezza. Puoi usare la tua armatura naturale per determinare la CA se l'armatura che indossi ti garantirebbe una CA inferiore.",
    },
    "hungry_jaws_mmm": {
        "name": "Mascelle Affamate",
        "name_en": "Hungry Jaws",
        "description": "Come azione bonus, puoi effettuare un attacco speciale con il tuo morso. Se colpisci, l'attacco infligge i suoi normali danni e ottieni temporaneamente un numero di punti ferita pari al tuo bonus di competenza. Puoi usare questo tratto un numero di volte pari al tuo bonus di competenza e riacquisti tutti gli usi quando termini un riposo lungo.",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
    },
    "hunters_lore_mmm": {
        "name": "Sapere del Cacciatore",
        "name_en": "Hunter's Lore",
        "description": "Sei competente in due delle seguenti abilita' a tua scelta: Addestrare Animali, Natura, Percezione, Sopravvivenza, Furtivita'.",
    },
    "feline_agility_mmm": {
        "name": "Agilita' Felina",
        "name_en": "Feline Agility",
        "description": "Quando ti muovi nel tuo turno in combattimento, puoi raddoppiare la tua velocita' fino alla fine del turno. Una volta usato questo tratto, non puoi usarlo di nuovo finche' non rimani fermo per 1 turno.",
    },
    "control_air_and_water_mmm": {
        "name": "Controllo dell'Aria e dell'Acqua",
        "name_en": "Control Air and Water",
        "description": "Puoi lanciare nube di nebbia con questo tratto. A partire dal 3 livello, puoi lanciare anche folata di vento. A partire dal 5 livello, puoi lanciare muro d'acqua. Puoi lanciare ognuno di essi un numero di volte pari al tuo bonus di competenza, e riacquisti gli usi quando termini un riposo lungo. Il Carisma e' la tua caratteristica da incantatore per essi.",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
        "innate_spells": [
            {"name_en": "Fog Cloud",     "name": "Nube di Nebbia", "level": 1, "level_cast": 1, "min_pg_level": 1, "recharge": "long_rest", "ability": "Carisma"},
            {"name_en": "Gust of Wind",  "name": "Folata di Vento", "level": 2, "level_cast": 2, "min_pg_level": 3, "recharge": "long_rest", "ability": "Carisma"},
            {"name_en": "Wall of Water", "name": "Muro d'Acqua",   "level": 3, "level_cast": 3, "min_pg_level": 5, "recharge": "long_rest", "ability": "Carisma"},
        ],
    },
    "githyanki_psionics_mmm": {
        "name": "Psionica Githyanki",
        "name_en": "Githyanki Psionics",
        "description": "Conosci il trucchetto mano magica, e la mano e' invisibile quando lo lanci con questo tratto. A partire dal 3 livello, puoi lanciare salto. A partire dal 5 livello, puoi lanciare passo velato. Puoi lanciare ognuno di salto e passo velato un numero di volte pari al tuo bonus di competenza con questo tratto, e riacquisti gli usi quando termini un riposo lungo. L'Intelligenza, la Saggezza o il Carisma e' la tua caratteristica da incantatore (a tua scelta).",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
        "innate_spells": [
            {"name_en": "Mage Hand",  "name": "Mano Magica",  "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will",   "ability": "Intelligenza"},
            {"name_en": "Jump",       "name": "Saltare",      "level": 1, "level_cast": 1, "min_pg_level": 3, "recharge": "long_rest", "ability": "Intelligenza"},
            {"name_en": "Misty Step", "name": "Passo Velato", "level": 2, "level_cast": 2, "min_pg_level": 5, "recharge": "long_rest", "ability": "Intelligenza"},
        ],
    },
    "astral_knowledge": {
        "name": "Conoscenza Astrale",
        "name_en": "Astral Knowledge",
        "description": "Quando termini un riposo lungo, puoi vagare astralmente per acquisire competenza in un'abilita' o in uno strumento a tua scelta. La competenza dura fino al successivo riposo lungo.",
    },
    "githzerai_psionics_mmm": {
        "name": "Psionica Githzerai",
        "name_en": "Githzerai Psionics",
        "description": "Conosci il trucchetto mano magica, e la mano e' invisibile quando lo lanci con questo tratto. A partire dal 3 livello, puoi lanciare scudo. A partire dal 5 livello, puoi lanciare detezione del pensiero. Puoi lanciare ognuno di scudo e detezione del pensiero un numero di volte pari al tuo bonus di competenza con questo tratto, e riacquisti gli usi quando termini un riposo lungo. L'Intelligenza, la Saggezza o il Carisma e' la tua caratteristica da incantatore (a tua scelta).",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
        "innate_spells": [
            {"name_en": "Mage Hand",        "name": "Mano Magica",            "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will",   "ability": "Saggezza"},
            {"name_en": "Shield",           "name": "Scudo",                  "level": 1, "level_cast": 1, "min_pg_level": 3, "recharge": "long_rest", "ability": "Saggezza"},
            {"name_en": "Detect Thoughts",  "name": "Individuazione del Pensiero", "level": 2, "level_cast": 2, "min_pg_level": 5, "recharge": "long_rest", "ability": "Saggezza"},
        ],
    },
    # Centauro / Leonino / Minotauro / Satiro / Tortle in MMM mantengono in
    # gran parte i tratti di MOoT/ToA: dove diversi, rimandiamo al singolo
    # tratto inline o si riusa il base.
    "stones_endurance_mmm": {
        "name": "Resistenza della Pietra",
        "name_en": "Stone's Endurance",
        "description": "Puoi concentrarti per resistere a un danno. Quando subisci danni, puoi usare la tua reazione per tirare 1d12 e sommare il tuo modificatore di Costituzione, riducendo i danni di quel valore. Puoi usare questo tratto un numero di volte pari al tuo bonus di competenza e riacquisti tutti gli usi quando termini un riposo lungo.",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
    },
    "daunting_roar_mmm": {
        "name": "Ruggito Spaventoso",
        "name_en": "Daunting Roar",
        "description": "Come azione bonus, puoi ruggire ferocemente. Ogni creatura entro 3 metri da te che puoi vedere deve effettuare un tiro salvezza su Saggezza (CD 8 + bonus competenza + mod Costituzione) o essere spaventata da te fino alla fine del tuo prossimo turno. Puoi usare questo tratto un numero di volte pari al tuo bonus di competenza, e riacquisti tutti gli usi quando termini un riposo lungo.",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
    },
    "magic_resistance_satyr_mmm": {
        "name": "Resistenza Magica",
        "name_en": "Magic Resistance",
        "description": "Hai vantaggio ai tiri salvezza contro incantesimi.",
    },
    "shell_defense_mmm": {
        "name": "Difesa del Guscio",
        "name_en": "Shell Defense",
        "description": "Puoi ritirarti nel tuo guscio come azione. Fino a quando non emergi, ottieni +4 alla CA e hai vantaggio ai tiri salvezza su Forza e Costituzione. Mentre sei nel tuo guscio, sei prono, la tua velocita' e' 0 e non puoi aumentarla, hai svantaggio ai tiri salvezza su Destrezza, non puoi reagire e l'unica azione che puoi effettuare e' un'azione bonus per uscire dal guscio (utilizzabile a partire dal tuo prossimo turno).",
    },
    "blessing_of_raven_queen_mmm": {
        "name": "Benedizione della Regina Corvo",
        "name_en": "Blessing of the Raven Queen",
        "description": "Come azione bonus, puoi teletrasportarti fino a 9 metri in uno spazio non occupato che puoi vedere. Una volta usato questo tratto, ottieni resistenza a tutti i danni fino all'inizio del tuo prossimo turno. Puoi usare questo tratto un numero di volte pari al tuo bonus di competenza, e riacquisti tutti gli usi quando termini un riposo lungo.",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
    },
    "duergar_magic_mmm": {
        "name": "Magia Duergar",
        "name_en": "Duergar Magic",
        "description": "A partire dal 3 livello puoi lanciare ingrandire/ridurre su te stesso (solo la versione 'ingrandire'). A partire dal 5 livello puoi lanciare invisibilita' su te stesso. Puoi lanciare ognuno di essi un numero di volte pari al tuo bonus di competenza con questo tratto, e riacquisti gli usi quando termini un riposo lungo. L'Intelligenza, la Saggezza o il Carisma e' la tua caratteristica da incantatore (a tua scelta).",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
        "innate_spells": [
            {"name_en": "Enlarge/Reduce", "name": "Ingrandire/Ridurre", "level": 2, "level_cast": 2, "min_pg_level": 3, "recharge": "long_rest", "ability": "Intelligenza"},
            {"name_en": "Invisibility",   "name": "Invisibilità",       "level": 2, "level_cast": 2, "min_pg_level": 5, "recharge": "long_rest", "ability": "Intelligenza"},
        ],
    },
    "psionic_fortitude": {
        "name": "Fortitudine Psionica",
        "name_en": "Psionic Fortitude",
        "description": "Hai vantaggio ai tiri salvezza che effettui per evitare di essere ammaliato o stordito.",
    },
    "fey_step_mmm": {
        "name": "Passo Fatato",
        "name_en": "Fey Step",
        "description": "Come azione bonus, puoi teletrasportarti magicamente fino a 9 metri in uno spazio non occupato che puoi vedere. Puoi usare questo tratto un numero di volte pari al tuo bonus di competenza e riacquisti tutti gli usi quando termini un riposo lungo. Quando raggiungi il 3 livello, la tua stagione conferisce un effetto extra al teletrasporto: Estate (modificatore di CAR fuoco a creature entro 1,5m), Inverno (creatura entro 1,5m TS Saggezza o spaventata), Primavera (porta con te una creatura volontaria entro 1,5m), Autunno (charme creatura entro 3m fino al fine prossimo turno).",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
    },
    "deep_gnome_magic": {
        "name": "Magia degli Gnomi delle Profondita'",
        "name_en": "Gift of the Svirfneblin",
        "description": "A partire dal 3 livello, puoi lanciare camuffare se' stesso. A partire dal 5 livello, puoi lanciare antidetezione (solo su te stesso). Puoi lanciare ognuno di essi un numero di volte pari al tuo bonus di competenza con questo tratto, e riacquisti gli usi quando termini un riposo lungo. L'Intelligenza, la Saggezza o il Carisma e' la tua caratteristica da incantatore (a tua scelta).",
        "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
        "innate_spells": [
            {"name_en": "Disguise Self",  "name": "Camuffare Sé Stesso", "level": 1, "level_cast": 1, "min_pg_level": 3, "recharge": "long_rest", "ability": "Intelligenza"},
            {"name_en": "Nondetection",   "name": "Antidetezione",        "level": 3, "level_cast": 3, "min_pg_level": 5, "recharge": "long_rest", "ability": "Intelligenza"},
        ],
    },
    "gnomish_cunning_svirfneblin": {
        "name": "Astuzia Gnomesca",
        "name_en": "Gnomish Cunning",
        "description": "Hai vantaggio a tutti i tiri salvezza di Intelligenza, Saggezza e Carisma contro la magia.",
    },
}


# ---------------------------------------------------------------------------
# Helper per espandere riferimenti ai tratti comuni
# ---------------------------------------------------------------------------

def T(key_or_dict, **overrides):
    """Espande un riferimento a COMMON_TRAITS o accetta un dict inline.

    Aggiunge campi mancanti (uses, innate_spells = None) per uniformita'.
    """
    if isinstance(key_or_dict, str):
        base = dict(COMMON_TRAITS[key_or_dict])
    else:
        base = dict(key_or_dict)
    base.setdefault("uses", None)
    base.setdefault("innate_spells", None)
    base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# Definizione razze
# ---------------------------------------------------------------------------

RACES = {}


def _add_race(name_it, data):
    RACES[name_it] = data


def _add_subrace(parent_name_it, subrace):
    """Aggiunge una sottorazza alla razza parent (es. MToF aggiunge sottorazze
    alle razze PHB)."""
    parent = RACES.get(parent_name_it)
    if parent is None:
        raise KeyError(f"Razza parent '{parent_name_it}' non trovata")
    parent.setdefault("subraces", []).append(subrace)


# === Player's Handbook ===

# Le razze PHB seguono lo schema standard. La maggior parte dei dati e'
# direttamente in italiano, le sottorazze sono nel campo "subraces".
# I tratti vengono espansi via T() al build.

# --- Nano (Dwarf, PHB) ---
_add_race("Nano", {
    "name_en": "Dwarf",
    "source": "Manuale del Giocatore",
    "source_short": "PHB",
    "size": "Media",
    "speed": 7.5,
    "ability_score_increase": {"Costituzione": 2},
    "asi_text": "+2 Costituzione",
    "age": "I nani maturano alla stessa velocita' degli umani, ma sono considerati giovani fino ai 50 anni. In media vivono circa 350 anni.",
    "alignment": "La maggior parte dei nani e' legale, credendo fermamente nei benefici di una societa' ben ordinata. Tendono al bene, con un forte senso di lealta' e la convinzione che tutti meritino di condividere i benefici di un giusto ordine.",
    "description": "Regni ricchi di antica grandiosita', sale scavate nelle radici delle montagne, l'eco di picconi e martelli in profonde miniere e fucine ardenti, una dedizione al clan e alla tradizione, e un odio bruciante per goblin e orchi - questi tratti comuni uniscono tutti i nani.",
    "languages": ["Comune", "Nanico"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": ["Strumenti da artigiano (a scelta tra: strumenti da fabbro, attrezzi da birraio, strumenti da muratore)"],
    "weapon_proficiencies": ["Ascia da battaglia", "Ascia da lancio", "Martello leggero", "Martello da guerra"],
    "armor_proficiencies": [],
    "resistances": ["veleno"],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("dwarven_resilience"),
        T("dwarven_combat_training"),
        T("tool_proficiency_artisan"),
        T("stonecunning"),
        T({
            "name": "Linguaggi",
            "name_en": "Languages",
            "description": "Sai parlare, leggere e scrivere Comune e Nanico. Il Nanico e' pieno di consonanti dure e suoni gutturali, e queste caratteristiche si riversano in qualunque altra lingua un nano potrebbe parlare.",
        }),
    ],
    "subraces": [
        {
            "name": "Nano della Collina",
            "name_en": "Hill Dwarf",
            "ability_score_increase": {"Saggezza": 1},
            "asi_text": "+1 Saggezza",
            "description": "Da nano della collina, hai sensi acuti, intuito profondo e notevole resilienza. I nani d'oro del Faerun nel loro potente regno meridionale sono nani della collina.",
            "traits": [
                T({
                    "name": "Tenacia Nanica",
                    "name_en": "Dwarven Toughness",
                    "description": "I tuoi punti ferita massimi aumentano di 1, e aumentano di 1 ogni volta che sali di livello.",
                }),
            ],
        },
        {
            "name": "Nano della Montagna",
            "name_en": "Mountain Dwarf",
            "ability_score_increase": {"Forza": 2},
            "asi_text": "+2 Forza",
            "description": "Da nano della montagna, sei forte e robusto, abituato a una vita difficile in terreno aspro. Sei probabilmente alto (per un nano), e tendi a colorazioni piu' chiare.",
            "traits": [
                T({
                    "name": "Addestramento alle Armature Naniche",
                    "name_en": "Dwarven Armor Training",
                    "description": "Hai competenza con armature leggere e medie.",
                }),
            ],
        },
    ],
})


# --- Elfo (Elf, PHB) ---
_add_race("Elfo", {
    "name_en": "Elf",
    "source": "Manuale del Giocatore",
    "source_short": "PHB",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"Destrezza": 2},
    "asi_text": "+2 Destrezza",
    "age": "Gli elfi raggiungono la maturita' fisica all'incirca alla stessa eta' degli umani, ma il senso elfico dell'eta' adulta va oltre la crescita fisica per abbracciare anni di esperienza nel mondo. Un elfo a questa eta' adotta tipicamente un nome adulto attorno ai 100 anni di vita e puo' vivere fino a 750 anni.",
    "alignment": "Gli elfi amano la liberta', la varieta' e l'auto-espressione, quindi tendono fortemente verso aspetti piu' gentili del caos. Apprezzano e proteggono la liberta' altrui quanto la propria, e tendono al bene piu' che al male.",
    "description": "Gli elfi sono un popolo magico di grazia ultraterrena, che vive nel mondo ma non ne fa parte completamente. Vivono in luoghi di etereale bellezza, in mezzo ad antiche foreste o in torri argentee scintillanti di luce fatata.",
    "languages": ["Comune", "Elfico"],
    "languages_extra": 0,
    "skill_proficiencies": ["Percezione"],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("keen_senses"),
        T("fey_ancestry"),
        T("trance"),
    ],
    "subraces": [
        {
            "name": "Alto Elfo",
            "name_en": "High Elf",
            "ability_score_increase": {"Intelligenza": 1},
            "asi_text": "+1 Intelligenza",
            "description": "Da alto elfo hai una mente acuta e padroneggi almeno le basi della magia. In molti dei mondi di D&D ci sono due tipi di alti elfi: uno arrogante e recluso, l'altro piu' comune e amichevole.",
            "traits": [
                T("elf_weapon_training"),
                T({
                    "name": "Trucchetto",
                    "name_en": "Cantrip",
                    "description": "Conosci un trucchetto a tua scelta dalla lista degli incantesimi del mago. L'Intelligenza e' la tua caratteristica da incantatore per esso.",
                }),
                T("extra_language"),
            ],
        },
        {
            "name": "Elfo dei Boschi",
            "name_en": "Wood Elf",
            "ability_score_increase": {"Saggezza": 1},
            "asi_text": "+1 Saggezza",
            "description": "Da elfo dei boschi hai sensi acuti e intuito, e ti muovi rapidamente e furtivamente nelle tue foreste native.",
            "traits": [
                T("elf_weapon_training"),
                T({
                    "name": "Andatura Veloce",
                    "name_en": "Fleet of Foot",
                    "description": "La tua velocita' base di camminata aumenta a 10,5 metri.",
                }),
                T({
                    "name": "Maschera Selvatica",
                    "name_en": "Mask of the Wild",
                    "description": "Puoi tentare di nasconderti anche quando sei coperto solo leggermente da fogliame, pioggia intensa, neve, nebbia, e altri fenomeni naturali.",
                }),
            ],
        },
        {
            "name": "Drow",
            "name_en": "Drow",
            "ability_score_increase": {"Carisma": 1},
            "asi_text": "+1 Carisma",
            "description": "Discendenti di una volta dagli alti elfi, i drow furono banditi nel sottosuolo per i loro accordi con divinita' malvagie. Adesso vivono nell'Underdark in citta' simili a fortezze dove venerano la ragno-divinita' Lolth.",
            "traits": [
                T("darkvision_120"),
                T("sunlight_sensitivity"),
                T("drow_weapon_training"),
                T({
                    "name": "Magia Drow",
                    "name_en": "Drow Magic",
                    "description": "Conosci il trucchetto luci danzanti. Quando raggiungi il 3 livello, puoi lanciare l'incantesimo charme su persone una volta con questo tratto e riacquisti l'abilita' di farlo quando finisci un riposo lungo. Quando raggiungi il 5 livello, puoi lanciare l'incantesimo oscurita' una volta con questo tratto e riacquisti l'abilita' di farlo quando finisci un riposo lungo. Il Carisma e' la tua caratteristica da incantatore per questi incantesimi.",
                    "innate_spells": [
                        {"name_en": "Dancing Lights", "name": "Luci Danzanti", "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will", "ability": "Carisma"},
                        {"name_en": "Faerie Fire", "name": "Luminescenza", "level": 1, "level_cast": 1, "min_pg_level": 3, "recharge": "long_rest", "ability": "Carisma"},
                        {"name_en": "Darkness", "name": "Oscurità", "level": 2, "level_cast": 2, "min_pg_level": 5, "recharge": "long_rest", "ability": "Carisma"},
                    ],
                }),
            ],
        },
    ],
})

# --- Halfling (PHB) ---
_add_race("Halfling", {
    "name_en": "Halfling",
    "source": "Manuale del Giocatore",
    "source_short": "PHB",
    "size": "Piccola",
    "speed": 7.5,
    "ability_score_increase": {"Destrezza": 2},
    "asi_text": "+2 Destrezza",
    "age": "Un halfling raggiunge l'eta' adulta a 20 anni e generalmente vive fino al secondo secolo.",
    "alignment": "La maggior parte degli halfling e' legale buona. Per regola sono di buon cuore, gentili, odiano vedere gli altri soffrire e non tollerano l'oppressione.",
    "description": "Gli ardenti halfling apprezzano i conforti di casa piu' di ogni altra cosa. Maggior parte degli halfling vivono in comunita' rurali pacifiche, sebbene alcuni abbiano un'inclinazione per il vagabondare.",
    "languages": ["Comune", "Halfling"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T("lucky"),
        T("brave"),
        T("halfling_nimbleness"),
    ],
    "subraces": [
        {
            "name": "Piedelieve",
            "name_en": "Lightfoot Halfling",
            "ability_score_increase": {"Carisma": 1},
            "asi_text": "+1 Carisma",
            "description": "Da halfling piedelieve, puoi facilmente nasconderti dalla vista, anche usando altre persone come copertura. Sei socievole e amichevole.",
            "traits": [
                T("naturally_stealthy"),
            ],
        },
        {
            "name": "Tozzo",
            "name_en": "Stout Halfling",
            "ability_score_increase": {"Costituzione": 1},
            "asi_text": "+1 Costituzione",
            "description": "Da halfling tozzo, sei piu' resistente della media e hai una certa resistenza al veleno. Si dice che gli halfling tozzi abbiano sangue nano nelle loro vene.",
            "traits": [
                T("stout_resilience"),
            ],
        },
    ],
})

# --- Umano (Human, PHB) ---
_add_race("Umano", {
    "name_en": "Human",
    "source": "Manuale del Giocatore",
    "source_short": "PHB",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"Forza": 1, "Destrezza": 1, "Costituzione": 1, "Intelligenza": 1, "Saggezza": 1, "Carisma": 1},
    "asi_text": "+1 a tutte le caratteristiche",
    "age": "Gli umani raggiungono l'eta' adulta nei loro tardi adolescenti e vivono meno di un secolo.",
    "alignment": "Gli umani non tendono a un particolare allineamento. I migliori e i peggiori si trovano tra di loro.",
    "description": "Negli ambientazioni di D&D piu' comuni, gli umani sono i piu' adattabili e ambiziosi delle razze comuni. Hanno gusti, morale e usanze ampiamente diversi nei molti paesi dove si sono insediati.",
    "languages": ["Comune"],
    "languages_extra": 1,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T({
            "name": "Linguaggi",
            "name_en": "Languages",
            "description": "Sai parlare, leggere e scrivere Comune e una lingua aggiuntiva a tua scelta. Gli umani parlano tipicamente le lingue di altri popoli con cui interagiscono, inclusi nemici insoliti.",
        }),
    ],
    "subraces": [],
})

# --- Umano Variante (Human Variant, PHB) ---
_add_race("Umano Variante", {
    "name_en": "Human Variant",
    "source": "Manuale del Giocatore",
    "source_short": "PHB",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_choose_2": 1},
    "asi_text": "+1 a due caratteristiche a scelta",
    "age": "Gli umani raggiungono l'eta' adulta nei loro tardi adolescenti e vivono meno di un secolo.",
    "alignment": "Gli umani non tendono a un particolare allineamento. I migliori e i peggiori si trovano tra di loro.",
    "description": "Variante dell'Umano: invece di +1 a tutte le caratteristiche, ottieni +1 a due caratteristiche a tua scelta, una competenza in un'abilita' a scelta e un talento.",
    "languages": ["Comune"],
    "languages_extra": 1,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T({
            "name": "Abilita' Aggiuntiva",
            "name_en": "Skills",
            "description": "Ottieni competenza in un'abilita' a tua scelta.",
        }),
        T({
            "name": "Talento Aggiuntivo",
            "name_en": "Feat",
            "description": "Ottieni un talento a tua scelta.",
        }),
    ],
    "subraces": [],
})

# --- Dragonide (Dragonborn, PHB) ---
_add_race("Dragonide", {
    "name_en": "Dragonborn",
    "source": "Manuale del Giocatore",
    "source_short": "PHB",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"Forza": 2, "Carisma": 1},
    "asi_text": "+2 Forza, +1 Carisma",
    "age": "I giovani dragonidi crescono rapidamente. Camminano poche ore dopo la schiusa, raggiungono le dimensioni e lo sviluppo di un bambino umano di 10 anni a tre anni di eta', e diventano adulti a 15. Vivono fino a 80 anni.",
    "alignment": "I dragonidi tendono agli estremi, scegliendo coscientemente da un lato o dall'altro della guerra cosmica tra bene e male. Molti dragonidi sono buoni, ma quelli che si schierano con i draghi cromatici possono essere terribilmente malvagi.",
    "description": "Nati dai draghi, come dichiara il loro nome, i dragonidi sono originati per la prima volta in regni distanti, dove ancora si trovano in massima concentrazione. La loro chiamata era a essere guerrieri grandi, e molti tornano a quella chiamata. La sottorazza determina la tua discendenza draconica (il tipo di danno e la forma della tua arma del soffio).",
    "languages": ["Comune", "Draconico"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [],  # I tratti effettivi (Discendenza, Arma del Soffio,
    # Resistenza) dipendono dalla discendenza scelta come sottorazza.
    "subraces": [],  # popolate sotto via _add_subrace
})


# === Dragonide (PHB) – 10 discendenze come sottorazze ===
# Ogni sottorazza fissa: tipo di danno, forma dell'arma del soffio (linea o
# cono) e relativa resistenza. La meccanica dei danni scala col livello PG
# (1d6 1-5, 2d6 6-10, 3d6 11-15, 4d6 16+).

def _dragonborn_traits(damage_it, breath_shape, breath_dist_m, save):
    """Costruisce i 3 tratti standard di un dragonide (Discendenza,
    Arma del Soffio, Resistenza) per una specifica discendenza."""
    if breath_shape == "linea":
        breath_geom = f"linea di {breath_dist_m} metri lunga e 1,5 metri larga"
    else:  # cono
        breath_geom = f"cono di {breath_dist_m} metri"
    return [
        T({
            "name": "Discendenza Draconica",
            "name_en": "Draconic Ancestry",
            "description": f"Hai discendenza draconica e sei imparentato con questa stirpe specifica. La tua arma del soffio infligge danni da {damage_it} e ottieni resistenza a quel tipo di danno.",
        }),
        T({
            "name": "Arma del Soffio",
            "name_en": "Breath Weapon",
            "description": f"Puoi usare la tua azione per esalare energia distruttiva. La tua discendenza determina forma e tipo di danno: una {breath_geom}. Ogni creatura nell'area deve effettuare un tiro salvezza su {save} (CD = 8 + il tuo modificatore di Costituzione + il tuo bonus di competenza). In caso di TS fallito subisce 2d6 danni da {damage_it} (1d6 al 1-5 livello, 2d6 al 6-10, 3d6 al 11-15, 4d6 al 16+ livello), o meta' con un TS riuscito. Devi finire un riposo breve o lungo per usare di nuovo l'arma del soffio.",
            "uses": {"amount": 1, "recharge": "short_rest"},
        }),
        T({
            "name": "Resistenza ai Danni",
            "name_en": "Damage Resistance",
            "description": f"Hai resistenza ai danni da {damage_it} grazie alla tua discendenza draconica.",
        }),
    ]


# Cromatici (drow malvagi)
_DRAGONBORN_CHROMATIC = [
    ("Dragonide Nero",   "Black Dragonborn",   "acido",   "linea", 9, "Destrezza", "acido"),
    ("Dragonide Azzurro","Blue Dragonborn",    "fulmine", "linea", 9, "Destrezza", "fulmine"),
    ("Dragonide Verde",  "Green Dragonborn",   "veleno",  "cono",  4.5, "Costituzione", "veleno"),
    ("Dragonide Rosso",  "Red Dragonborn",     "fuoco",   "cono",  4.5, "Destrezza", "fuoco"),
    ("Dragonide Bianco", "White Dragonborn",   "freddo",  "cono",  4.5, "Costituzione", "freddo"),
]
# Metallici (buoni)
_DRAGONBORN_METALLIC = [
    ("Dragonide d'Ottone", "Brass Dragonborn",  "fuoco",   "linea", 9, "Destrezza", "fuoco"),
    ("Dragonide di Bronzo","Bronze Dragonborn", "fulmine", "linea", 9, "Destrezza", "fulmine"),
    ("Dragonide di Rame",  "Copper Dragonborn", "acido",   "linea", 9, "Destrezza", "acido"),
    ("Dragonide d'Oro",    "Gold Dragonborn",   "fuoco",   "cono",  4.5, "Destrezza", "fuoco"),
    ("Dragonide d'Argento","Silver Dragonborn", "freddo",  "cono",  4.5, "Costituzione", "freddo"),
]

for name_it, name_en, dmg, shape, dist, save, res in _DRAGONBORN_CHROMATIC + _DRAGONBORN_METALLIC:
    _add_subrace("Dragonide", {
        "name": name_it,
        "name_en": name_en,
        "description": f"Discendi da un drago {name_it.replace('Dragonide ', '').lower()}. La tua arma del soffio e' una {('linea di ' + str(dist) + ' metri') if shape == 'linea' else ('cono di ' + str(dist) + ' metri')} di danni da {dmg} e hai resistenza a quel tipo di danno.",
        "ability_score_increase": {},
        "asi_text": "",
        "resistances": [res],
        "traits": _dragonborn_traits(dmg, shape, dist, save),
    })

# --- Gnomo (Gnome, PHB) ---
_add_race("Gnomo", {
    "name_en": "Gnome",
    "source": "Manuale del Giocatore",
    "source_short": "PHB",
    "size": "Piccola",
    "speed": 7.5,
    "ability_score_increase": {"Intelligenza": 2},
    "asi_text": "+2 Intelligenza",
    "age": "I gnomi maturano alla stessa velocita' degli umani, e la maggior parte di essi e' insediata nella vita adulta intorno ai 40 anni. Possono vivere fino a 350 anni.",
    "alignment": "Gli gnomi sono spesso buoni. Quelli che tendono al legale sono saggi, ingegneri, ricercatori, studiosi, investigatori o inventori. Quelli che tendono al caotico sono menestrelli, imbroglioni, viaggiatori o gioiellieri fantasiosi.",
    "description": "Una stridula esclamazione di stupore, una risata che evoca l'immagine di un piccolo animale che ride - questi sono i suoni della vita gnomesca. Gli gnomi prendono delizia nella vita, godendo di ogni morso di cibo e ogni sorso di bevanda.",
    "languages": ["Comune", "Gnomesco"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("gnome_cunning"),
    ],
    "subraces": [
        {
            "name": "Gnomo della Foresta",
            "name_en": "Forest Gnome",
            "ability_score_increase": {"Destrezza": 1},
            "asi_text": "+1 Destrezza",
            "description": "Da gnomo della foresta, hai un talento naturale per l'illusione e per i contatti innati con le creature dei boschi.",
            "traits": [
                T({
                    "name": "Illusionista Naturale",
                    "name_en": "Natural Illusionist",
                    "description": "Conosci il trucchetto immagine minore. L'Intelligenza e' la tua caratteristica da incantatore per esso.",
                    "innate_spells": [
                        {"name_en": "Minor Illusion", "name": "Illusione Minore", "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will", "ability": "Intelligenza"},
                    ],
                }),
                T({
                    "name": "Parlare con le Piccole Bestie",
                    "name_en": "Speak with Small Beasts",
                    "description": "Attraverso suoni e gesti, puoi comunicare semplici idee con piccole bestie o piu' piccole. Gli gnomi della foresta amano molto gli animali e spesso tengono scoiattoli, tassi, conigli, talpe, picchi e altre creature come amati animali domestici.",
                }),
            ],
        },
        {
            "name": "Gnomo della Roccia",
            "name_en": "Rock Gnome",
            "ability_score_increase": {"Costituzione": 1},
            "asi_text": "+1 Costituzione",
            "description": "Da gnomo della roccia, hai un'abilita' naturale con strumenti e una conoscenza innata dei principi dietro a costruzioni meccaniche.",
            "traits": [
                T({
                    "name": "Sapere dell'Artefice",
                    "name_en": "Artificer's Lore",
                    "description": "Ogni volta che effettui una prova di Intelligenza (Storia) relativa a oggetti magici, alchemici o tecnologici, puoi aggiungere il doppio del tuo bonus di competenza, invece di qualunque bonus di competenza tu applichi normalmente.",
                }),
                T({
                    "name": "Armeggione",
                    "name_en": "Tinker",
                    "description": "Hai competenza con strumenti da artigiano (strumenti da armeggione). Usando questi strumenti, puoi spendere 1 ora e 10 mo per costruire un piccolo dispositivo (CA 5, 1 PF) ad orologeria. Il dispositivo cessa di funzionare dopo 24 ore (a meno che tu non spenda 1 ora a ripararlo) o quando lo smonti. Puoi avere fino a tre dispositivi attivi alla volta. Quando ne crei uno, scegli tra: Giocattolo (animale meccanico), Accendino (riscalda materiali infiammabili), Scatola Musicale (suona melodia).",
                }),
            ],
        },
    ],
})

# --- Mezzelfo (Half-Elf, PHB) ---
_add_race("Mezzelfo", {
    "name_en": "Half-Elf",
    "source": "Manuale del Giocatore",
    "source_short": "PHB",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"Carisma": 2, "_choose_2": 1},
    "asi_text": "+2 Carisma, +1 a due caratteristiche a scelta",
    "age": "I mezzelfi maturano alla stessa velocita' degli umani e raggiungono l'eta' adulta intorno ai 20 anni. Vivono pero' molto piu' a lungo degli umani, fino a 180 anni o piu'.",
    "alignment": "I mezzelfi condividono il caotico portamento dei loro genitori elfici. Apprezzano molto sia la liberta' personale che l'auto-espressione creativa.",
    "description": "Camminando in due mondi ma realmente in nessuno, i mezzelfi combinano cio' che alcuni considerano i migliori tratti dei loro genitori elfi e umani: curiosita', inventiva e ambizione umane temperate da sensi raffinati, amore della natura e gusti artistici degli elfi.",
    "languages": ["Comune", "Elfico"],
    "languages_extra": 1,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("fey_ancestry"),
        T("skill_versatility"),
    ],
    "subraces": [],
})

# --- Mezzorco (Half-Orc, PHB) ---
_add_race("Mezzorco", {
    "name_en": "Half-Orc",
    "source": "Manuale del Giocatore",
    "source_short": "PHB",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"Forza": 2, "Costituzione": 1},
    "asi_text": "+2 Forza, +1 Costituzione",
    "age": "I mezzorchi maturano leggermente piu' in fretta degli umani, raggiungendo l'eta' adulta intorno ai 14 anni. Invecchiano notevolmente piu' rapidamente e raramente vivono oltre i 75 anni.",
    "alignment": "I mezzorchi ereditano una tendenza al caos dai loro genitori orchi e non sono fortemente portati al bene. I mezzorchi cresciuti tra orchi e che mantengono la fede di Gruumsh sono solitamente malvagi.",
    "description": "Sia che vivano tra gli orchi o in mezzo agli umani, i mezzorchi crescono robusti, alti e impulsivi. La maggior parte dei mezzorchi di sangue umano e orchesco e' un membro di una tribu' orchesca o si trova spesso ai margini della societa' civilizzata.",
    "languages": ["Comune", "Orchesco"],
    "languages_extra": 0,
    "skill_proficiencies": ["Intimidire"],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("menacing"),
        T("relentless_endurance"),
        T("savage_attacks"),
    ],
    "subraces": [],
})

# --- Tiefling (PHB) ---
_add_race("Tiefling", {
    "name_en": "Tiefling",
    "source": "Manuale del Giocatore",
    "source_short": "PHB",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"Intelligenza": 1, "Carisma": 2},
    "asi_text": "+2 Carisma, +1 Intelligenza",
    "age": "I tiefling maturano alla stessa velocita' degli umani ma vivono qualche anno in piu'.",
    "alignment": "I tiefling potrebbero non avere una tendenza innata al male, ma molti finiscono comunque la' per scelta. Possono essere caotici per natura, ma alcuni tiefling sono buoni o legali.",
    "description": "Discendere da una linea di sangue infernale, possedere corna, una coda, occhi di sodio e denti aguzzi - tutti questi sono segni di un'ascendenza tiefling. Anche prima del tempo della loro nascita, sono marchiati per essere odiati.",
    "languages": ["Comune", "Infernale"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": ["fuoco"],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("hellish_resistance"),
    ],
    # I tiefling scelgono una stirpe (lineage) come sottorazza che determina
    # i loro incantesimi razziali. La default storica del PHB e' Asmodeus.
    "subraces": [],  # popolate sotto via _add_subrace
})


# === Tiefling – Stirpi infernali (Asmodeus PHB + 8 stirpi MToF + 3 varianti SCAG) ===

def _tiefling_lineage_trait(name_it, name_en, ability_it, spells_desc, spells_list):
    return T({
        "name": name_it,
        "name_en": name_en,
        "description": spells_desc,
        "innate_spells": spells_list,
    })


# --- Asmodeus (default PHB, anche elencata in MToF) ---
_add_subrace("Tiefling", {
    "name": "Stirpe di Asmodeus",
    "name_en": "Bloodline of Asmodeus",
    "source_short": "PHB",
    "description": "La stirpe piu' diffusa: il tuo lignaggio risale al Signore dei Nove Inferi. Conosci il trucchetto taumaturgia. Al 3 livello puoi lanciare rimprovero infernale come incantesimo di 2 livello una volta per riposo lungo. Al 5 livello puoi lanciare oscurita' una volta per riposo lungo.",
    "ability_score_increase": {},
    "asi_text": "",
    "traits": [
        _tiefling_lineage_trait(
            "Eredita' Infernale", "Infernal Legacy", "Carisma",
            "Conosci il trucchetto taumaturgia. Al 3 livello puoi lanciare rimprovero infernale come incantesimo di 2 livello (1/r. lungo). Al 5 livello puoi lanciare oscurita' (1/r. lungo). Il Carisma e' la tua caratteristica da incantatore.",
            [
                {"name_en": "Thaumaturgy",     "name": "Taumaturgia",          "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will",   "ability": "Carisma"},
                {"name_en": "Hellish Rebuke",  "name": "Rimprovero Infernale", "level": 1, "level_cast": 2, "min_pg_level": 3, "recharge": "long_rest", "ability": "Carisma"},
                {"name_en": "Darkness",        "name": "Oscurità",             "level": 2, "level_cast": 2, "min_pg_level": 5, "recharge": "long_rest", "ability": "Carisma"},
            ],
        ),
    ],
})

# --- MToF lineages (8) ---
_TIEFLING_MTOF = [
    ("Stirpe di Baalzebul",       "Bloodline of Baalzebul",
        [("Thaumaturgy", "Taumaturgia", 0, 0, 1, "at_will"),
         ("Ray of Sickness", "Raggio Indebolente", 1, 1, 3, "long_rest"),
         ("Crown of Madness", "Corona della Follia", 2, 2, 5, "long_rest")]),
    ("Stirpe di Dispater",        "Bloodline of Dispater",
        [("Thaumaturgy", "Taumaturgia", 0, 0, 1, "at_will"),
         ("Disguise Self", "Camuffare Sé Stesso", 1, 1, 3, "long_rest"),
         ("Detect Thoughts", "Individuazione del Pensiero", 2, 2, 5, "long_rest")]),
    ("Stirpe di Fierna",          "Bloodline of Fierna",
        [("Friends", "Amicizia", 0, 0, 1, "at_will"),
         ("Charm Person", "Charme su Persone", 1, 1, 3, "long_rest"),
         ("Suggestion", "Suggestione", 2, 2, 5, "long_rest")]),
    ("Stirpe di Glasya",          "Bloodline of Glasya",
        [("Minor Illusion", "Illusione Minore", 0, 0, 1, "at_will"),
         ("Disguise Self", "Camuffare Sé Stesso", 1, 1, 3, "long_rest"),
         ("Invisibility", "Invisibilità", 2, 2, 5, "long_rest")]),
    ("Stirpe di Levistus",        "Bloodline of Levistus",
        [("Ray of Frost", "Raggio di Gelo", 0, 0, 1, "at_will"),
         ("Armor of Agathys", "Armatura di Agathys", 1, 1, 3, "long_rest"),
         ("Darkness", "Oscurità", 2, 2, 5, "long_rest")]),
    ("Stirpe di Mammon",          "Bloodline of Mammon",
        [("Mage Hand", "Mano Magica", 0, 0, 1, "at_will"),
         ("Tenser's Floating Disk", "Disco Fluttuante di Tenser", 1, 1, 3, "long_rest"),
         ("Arcane Lock", "Chiusura Arcana", 2, 2, 5, "long_rest")]),
    ("Stirpe di Mefistofele",     "Bloodline of Mephistopheles",
        [("Mage Hand", "Mano Magica", 0, 0, 1, "at_will"),
         ("Burning Hands", "Mani Brucianti", 1, 1, 3, "long_rest"),
         ("Flame Blade", "Lama Infuocata", 2, 2, 5, "long_rest")]),
    ("Stirpe di Zariel",          "Bloodline of Zariel",
        [("Thaumaturgy", "Taumaturgia", 0, 0, 1, "at_will"),
         ("Searing Smite", "Castigo Bruciante", 1, 1, 3, "long_rest"),
         ("Branding Smite", "Castigo Marchiante", 2, 2, 5, "long_rest")]),
]
for name_it, name_en, spells in _TIEFLING_MTOF:
    spell_objs = [
        {"name_en": s[0], "name": s[1], "level": s[2], "level_cast": s[3], "min_pg_level": s[4], "recharge": s[5], "ability": "Carisma"}
        for s in spells
    ]
    desc_parts = []
    for s in spells:
        if s[4] == 1 and s[5] == "at_will":
            desc_parts.append(f"conosci il trucchetto {s[1].lower()}")
        else:
            rest = "riposo lungo" if s[5] == "long_rest" else "riposo breve"
            desc_parts.append(f"al {s[4]} livello puoi lanciare {s[1].lower()} (1/{rest})")
    desc = "Stirpe MToF: " + "; ".join(desc_parts) + ". Il Carisma e' la tua caratteristica da incantatore."
    _add_subrace("Tiefling", {
        "name": name_it,
        "name_en": name_en,
        "source_short": "MToF",
        "description": desc,
        "ability_score_increase": {},
        "asi_text": "",
        "traits": [
            _tiefling_lineage_trait(
                name_it.replace("Stirpe di ", "Eredita' "), name_en.replace("Bloodline of ", "Legacy of "),
                "Carisma", desc, spell_objs,
            ),
        ],
    })

# --- Varianti SCAG (sostituiscono Eredita' Infernale invece di aggiungersi) ---
_add_subrace("Tiefling", {
    "name": "Tiefling Lingua di Diavolo",
    "name_en": "Devil's Tongue Tiefling",
    "source_short": "SCAG",
    "description": "Variante SCAG: rinunci a Eredita' Infernale per ottenere altri incantesimi di influenza. Conosci il trucchetto motteggio crudele. Al 3 livello puoi lanciare charme su persone come incantesimo di 2 livello (1/r. lungo). Al 5 livello puoi lanciare ammaliare (1/r. lungo). Il Carisma e' la tua caratteristica da incantatore.",
    "ability_score_increase": {},
    "asi_text": "",
    "traits": [
        T({
            "name": "Lingua del Diavolo",
            "name_en": "Devil's Tongue",
            "description": "Variante che sostituisce Eredita' Infernale.",
            "innate_spells": [
                {"name_en": "Vicious Mockery", "name": "Beffa Crudele", "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will",   "ability": "Carisma"},
                {"name_en": "Charm Person",    "name": "Charme su Persone", "level": 1, "level_cast": 2, "min_pg_level": 3, "recharge": "long_rest", "ability": "Carisma"},
                {"name_en": "Enthrall",        "name": "Ammaliare",         "level": 2, "level_cast": 2, "min_pg_level": 5, "recharge": "long_rest", "ability": "Carisma"},
            ],
        }),
    ],
})

_add_subrace("Tiefling", {
    "name": "Tiefling Fuoco Infernale",
    "name_en": "Hellfire Tiefling",
    "source_short": "SCAG",
    "description": "Variante SCAG: sostituisci oscurita' con mani brucianti. Conosci il trucchetto taumaturgia. Al 3 livello puoi lanciare rimprovero infernale come incantesimo di 2 livello (1/r. lungo). Al 5 livello puoi lanciare mani brucianti come incantesimo di 2 livello (1/r. lungo). Il Carisma e' la tua caratteristica da incantatore.",
    "ability_score_increase": {},
    "asi_text": "",
    "traits": [
        T({
            "name": "Fuoco Infernale",
            "name_en": "Hellfire",
            "description": "Variante che sostituisce l'incantesimo di 2 livello di Eredita' Infernale.",
            "innate_spells": [
                {"name_en": "Thaumaturgy",    "name": "Taumaturgia",          "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will",   "ability": "Carisma"},
                {"name_en": "Hellish Rebuke", "name": "Rimprovero Infernale", "level": 1, "level_cast": 2, "min_pg_level": 3, "recharge": "long_rest", "ability": "Carisma"},
                {"name_en": "Burning Hands",  "name": "Mani Brucianti",       "level": 1, "level_cast": 2, "min_pg_level": 5, "recharge": "long_rest", "ability": "Carisma"},
            ],
        }),
    ],
})

_add_subrace("Tiefling", {
    "name": "Tiefling Alato",
    "name_en": "Winged Tiefling",
    "source_short": "SCAG",
    "description": "Variante SCAG: rinunci a Eredita' Infernale per ottenere ali ricurve. Hai una velocita' di volo di 9 metri quando non indossi armature pesanti.",
    "ability_score_increase": {},
    "asi_text": "",
    "traits": [
        T({
            "name": "Ali",
            "name_en": "Wings",
            "description": "Hai ali ricurve simili a quelle di un pipistrello che spuntano dalle scapole. Hai una velocita' di volo di 9 metri quando non indossi armature pesanti.",
        }),
    ],
})


# === Volo's Guide to Monsters ===

# --- Aasimar (MMM) ---
# Versione aggiornata di "Mordenkainen presenta: Mostri del Multiverso" che
# rimpiazza la versione VGtM con sottorazze. Niente sottorazze: la scelta
# fra Anima Necrotica / Consumo Radioso / Anima Radiosa avviene al 3 livello
# tramite il tratto "Rivelazione Celestiale" e sostituisce le precedenti
# sotto-stirpi (Protettore / Sferzante / Caduto). ASI flottante secondo la
# regola "origine dei personaggi" di MMM.
_add_race("Aasimar", {
    "name_en": "Aasimar",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "Gli aasimar maturano alla stessa velocita' degli umani ma vivono fino a 160 anni.",
    "alignment": "Per via della loro discendenza celestiale, gli aasimar tendono al bene. La maggior parte sono buoni, eppure alcuni cadono nel male, rifiutando il loro destino superiore.",
    "description": "Gli aasimar portano dentro di se' la luce divina di un essere celeste. Sono guidati spesso dall'idea di sconfiggere il male, agendo come un faro contro l'oscurita'.",
    "languages": ["Comune"],
    "languages_extra": 1,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": ["necrotico", "radiante"],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("celestial_resistance"),
        T({
            "name": "Mani Curatrici",
            "name_en": "Healing Hands",
            "description": "Come azione, puoi toccare una creatura e fluire energia divina nel suo corpo, curando un numero di punti ferita pari al tuo livello e moltiplicandolo per 1d4. Una volta usato questo tratto, non puoi usarlo di nuovo finche' non termini un riposo lungo.",
            "uses": {"amount": 1, "recharge": "long_rest"},
        }),
        T("light_bearer"),
        T({
            "name": "Rivelazione Celestiale",
            "name_en": "Celestial Revelation",
            "description": (
                "Quando raggiungi il 3 livello, puoi trasformarti per rivelare la tua "
                "natura celestiale. Come azione bonus, puoi assumere la tua forma "
                "celestiale per 1 minuto o finche' non la annulli (sempre con un'azione "
                "bonus). Quando ti trasformi, scegli una delle tre opzioni qui sotto: "
                "una volta scelta, la forma e' definitiva e ottieni gli effetti relativi "
                "ogni volta che ti trasformi.\n\n"
                "Indipendentemente dalla forma scelta, mentre sei trasformato godi dei "
                "seguenti benefici: la tua forma emette luce intensa in un raggio di 3 "
                "metri e luce fioca per ulteriori 3 metri.\n\n"
                "**Anima Necrotica.** Aure spettrali emanano dalle tue spalle: hai una "
                "velocita' di volo pari alla tua velocita' di camminata e, una volta in "
                "ogni tuo turno, puoi infliggere danni necrotici extra a un bersaglio "
                "quando gli infliggi danni con un attacco o un incantesimo. Tali danni "
                "extra sono pari al tuo bonus di competenza.\n\n"
                "**Consumo Radioso.** Energia radiante divampa dal tuo corpo: alla "
                "fine di ognuno dei tuoi turni, ogni creatura entro 3 metri da te "
                "subisce danni radiosi pari al tuo bonus di competenza, e una volta in "
                "ogni tuo turno puoi infliggere danni radiosi extra (pari al tuo bonus "
                "di competenza) a un bersaglio quando gli infliggi danni con un attacco "
                "o un incantesimo.\n\n"
                "**Anima Radiosa.** Ali spettrali emergono dalla tua schiena: hai una "
                "velocita' di volo pari alla tua velocita' di camminata e, una volta in "
                "ogni tuo turno, puoi infliggere danni radiosi extra a un bersaglio "
                "quando gli infliggi danni con un attacco o un incantesimo. Tali danni "
                "extra sono pari al tuo bonus di competenza."
            ),
            "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
        }),
    ],
    "subraces": [],
})

# --- Firbolg (VGtM) ---
_add_race("Firbolg", {
    "name_en": "Firbolg",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "Come gli umani, i firbolg raggiungono la maturita' nei loro tardi adolescenti. Vivono notevolmente piu' a lungo degli umani, fino a 500 anni.",
    "alignment": "Spesso devoti al loro clan e alla loro foresta; tendenzialmente neutrali buoni.",
    "description": "I firbolg sono custodi della foresta che preferiscono inscenare elaborate frodi per spingere gli intrusi via dai loro boschi piuttosto che ricorrere alla violenza diretta.",
    "languages": ["Comune", "Elfico", "Gigante"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T("firbolg_magic_mmm"),
        T("hidden_step_mmm"),
        T("powerful_build_mmm"),
        T("speech_of_beast_and_leaf"),
    ],
    "subraces": [],
})

# --- Goliath (MMM) ---
# Resistenza della Pietra ora scala col bonus competenza (PB usi/RL),
# Atleta Nato non e' piu' una skill auto: in MMM e' rimosso. ASI flottante.
_add_race("Goliath", {
    "name_en": "Goliath",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "I goliath hanno durate di vita simili agli umani. Entrano nell'eta' adulta a tarda adolescenza e di solito vivono meno di un secolo.",
    "alignment": "La cultura goliath e' fortemente comunitaria; spesso pendono al legale ma MMM lascia liberta' al giocatore.",
    "description": "I goliath vagano in un mondo solitario e selvaggio. Vivendo sui pendii ventosi delle piu' alte cime montuose, lontani dagli affari di mortali e divini, conoscono solo difficolta' e fatica.",
    "languages": ["Comune", "Gigante"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": ["freddo"],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T("stones_endurance_mmm"),
        T("powerful_build_mmm"),
        T("mountain_born"),
    ],
    "subraces": [],
})

# --- Kenku (MMM) ---
# In MMM i kenku possono parlare normalmente (la maledizione e' sciolta).
# "Kenku Training" diventa "Kenku Recall" (2 skill a scelta + 1d4 PB
# usi/RL). Resta Mimetismo. ASI flottante.
_add_race("Kenku", {
    "name_en": "Kenku",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "I kenku hanno una durata di vita simile a quella degli umani.",
    "alignment": "Spesso opportunisti; tendono al caotico neutrale, ma MMM lascia liberta' al giocatore.",
    "description": "I kenku sono umanoidi simili a uccelli, vagabondi che hanno perso da tempo la capacita' di volare. In MMM possono parlare e mimano suoni e voci con disinvoltura.",
    "languages": ["Comune", "Aurano"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T("expert_forgery"),
        T("kenku_recall"),
        T("mimicry_kenku_mmm"),
    ],
    "subraces": [],
})

# --- Lizardfolk (MMM) ---
# Mascelle Affamate ora usa PB volte/RL e i temp HP scalano col bonus
# competenza (non piu' modificatore di Costituzione). Armatura Naturale
# resta 13+DEX. ASI flottante.
_add_race("Uomo Lucertola", {
    "name_en": "Lizardfolk",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "Gli uomini lucertola raggiungono la maturita' intorno ai 14 anni e di rado vivono piu' di 60 anni.",
    "alignment": "Pragmatici e tribali, tendenzialmente neutrali; MMM lascia liberta' al giocatore.",
    "description": "Gli uomini lucertola sono praticamente alieni alle altre razze umanoidi. Vivono nelle paludi e seguono valori tribali con una visione molto pratica e priva di emozioni.",
    "languages": ["Comune", "Draconico"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T("bite_lizardfolk_mmm"),
        T("cunning_artisan"),
        T("hold_breath_lizardfolk"),
        T("hunters_lore_mmm"),
        T("natural_armor_lizardfolk_mmm"),
        T("hungry_jaws_mmm"),
    ],
    "subraces": [],
})

# --- Tabaxi (MMM) ---
_add_race("Tabaxi", {
    "name_en": "Tabaxi",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "I tabaxi hanno durata di vita comparabile agli umani.",
    "alignment": "Curiosi e irrequieti, raramente malvagi; MMM lascia liberta' al giocatore.",
    "description": "I tabaxi sono umanoidi felini, esploratori curiosi nati da terre tropicali distanti. La loro insaziabile curiosita' li porta a girovagare il mondo in cerca di reliquie, conoscenza e storie.",
    "languages": ["Comune"],
    "languages_extra": 1,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("feline_agility_mmm"),
        T("cats_claws"),
        T("cats_talents"),
    ],
    "subraces": [],
})

# --- Triton (MMM) ---
# Controllo dell'Aria e dell'Acqua scala col PB (PB usi/RL per ognuno
# dei tre incantesimi). ASI flottante.
_add_race("Triton", {
    "name_en": "Triton",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "I triton hanno durata di vita simile agli umani.",
    "alignment": "Spesso fieri custodi degli oceani; tendenzialmente legali buoni.",
    "description": "I triton sono custodi delle profondita' oceaniche, recentemente emersi dai loro mondi sottomarini per affrontare nuove minacce in superficie.",
    "languages": ["Comune", "Primordiale"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": ["freddo"],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T("amphibious"),
        T("control_air_and_water_mmm"),
        T("emissary_of_the_sea"),
        T("guardians_of_the_depths"),
        T("swim_speed_30"),
    ],
    "subraces": [],
})

# --- Bugbear (MMM) ---
# In MMM viene rimosso il tratto "Long-Limbed" (portata +1,5m) e aggiunta
# Discendenza Fatata (vantaggio vs ammaliato). Sneaky concede anche di
# muoversi attraverso lo spazio di creature piu' grandi. ASI flottante.
_add_race("Bugbear", {
    "name_en": "Bugbear",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "I bugbear hanno durata di vita comparabile agli umani.",
    "alignment": "I bugbear sono spesso caotici malvagi, ma alcuni si liberano dal pugno di Hruggek, il loro dio.",
    "description": "I bugbear sono i piu' grandi e forti dei goblinoidi. La loro furtivita' a dispetto della loro stazza li rende cacciatori e razziatori formidabili.",
    "languages": ["Comune", "Goblin"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("fey_ancestry_bugbear"),
        T("powerful_build_mmm"),
        T("sneaky_mmm"),
        T("surprise_attack_mmm"),
    ],
    "subraces": [],
})

# --- Goblin (MMM) ---
# Furia dei Piccoli ora scala col livello (livello danni extra) ed e'
# usabile PB volte/riposo lungo. ASI flottante.
_add_race("Goblin", {
    "name_en": "Goblin",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Piccola",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "I goblin raggiungono l'eta' adulta a 8 anni e vivono fino a 60.",
    "alignment": "Variano: la maggior parte e' opportunista, ma alcuni rinnegano la lealta' al loro signore.",
    "description": "I goblin sono creature aggressive, irascibili e codarde che vivono in colonie sotterranee, sempre in cerca di un capo piu' forte.",
    "languages": ["Comune", "Goblin"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("fury_of_the_small_mmm"),
        T("nimble_escape"),
    ],
    "subraces": [],
})

# --- Hobgoblin (MMM) ---
# In MMM "Saving Face" e' rimpiazzato da "Fortuna dei Molti", e
# "Martial Training" e' rimpiazzato da "Dono Fatato" (azione bonus Aiuto
# scalabile col PB). ASI flottante.
_add_race("Hobgoblin", {
    "name_en": "Hobgoblin",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "Gli hobgoblin maturano alla stessa velocita' degli umani e hanno la stessa durata di vita.",
    "alignment": "Spesso disciplinati: apprezzano ordine, addestramento e onore in battaglia.",
    "description": "Gli hobgoblin sono goblinoidi grandi, marziali, organizzati in legioni rigidamente disciplinate. Apprezzano forza, abilita' e onore in battaglia.",
    "languages": ["Comune", "Goblin"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("fey_gift"),
        T("fortune_from_the_many"),
    ],
    "subraces": [],
})

# --- Kobold (MMM) ---
# In MMM si rimuovono Sensibilita' alla Luce Solare, Tattica del Branco e
# Inchinarsi/Acquattarsi/Implorare. Si introducono "Grido Draconico" (PB
# usi/LR) e "Eredita' Coboldica" (1 di 3 opzioni). Niente piu' malus a
# Forza: ASI flottante MMM.
_add_race("Coboldo", {
    "name_en": "Kobold",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Piccola",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "I coboldi raggiungono la maturita' a 6 anni e vivono fino a 120 anni.",
    "alignment": "Spesso astuti e leali al clan; molti restano devoti ai draghi venerati come divinita'.",
    "description": "I coboldi sono umanoidi rettiliani, ingegnosi nei loro modi sleali, e venerano i draghi come divinita'.",
    "languages": ["Comune", "Draconico"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("draconic_cry"),
        T("kobold_legacy"),
    ],
    "subraces": [],
})

# --- Orc (MMM) ---
# In MMM gli orchi diventano una razza giocabile a se' stante, senza piu'
# malus a Intelligenza, con ASI flottante. "Aggressivo" e "Minaccioso"
# vengono rimossi: arrivano "Scarica di Adrenalina" (PB usi/RB), "Resistenza
# Inesorabile" (1/RL) e "Costituzione Potente".
_add_race("Orco", {
    "name_en": "Orc",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "Gli orchi raggiungono l'eta' adulta a 12 anni e vivono fino a 50 anni.",
    "alignment": "Gli orchi MMM hanno temperamenti molto vari: l'allineamento dipende dall'individuo e dalla cultura.",
    "description": "Gli orchi sono creature feroci e fiere, vincolate da forti legami tribali. La tradizione di MMM li presenta come popolo ricco e variegato che migra tra i piani.",
    "languages": ["Comune", "Orchesco"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("adrenaline_rush"),
        T("powerful_build_mmm"),
        T("relentless_endurance_mmm"),
    ],
    "subraces": [],
})

# --- Yuan-ti (MMM) ---
# In MMM la razza si chiama semplicemente "Yuan-ti" (non piu' "Pureblood")
# e l'incantesimi innati sono cambiati: trucchetto Spruzzo Velenoso,
# Suggestione 1/LR al 3 livello, Amicizia con gli Animali at-will (solo
# serpenti) al 5 livello. ASI flottante MMM.
_add_race("Yuan-ti Purosangue", {
    "name_en": "Yuan-ti",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "Gli yuan-ti maturano alla stessa velocita' degli umani e hanno la stessa durata di vita.",
    "alignment": "Tipicamente freddi e calcolatori. MMM lascia liberta' al giocatore.",
    "description": "Gli yuan-ti sono umanoidi serpentini imbevuti di magia primordiale. In MMM la razza giocabile rappresenta gli yuan-ti che hanno mantenuto un aspetto piu' simile a quello umano.",
    "languages": ["Comune", "Abissale", "Draconico"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("yuanti_innate_spellcasting_mmm"),
        T("magic_resistance_yuanti"),
        T("poison_immunity"),
    ],
    "subraces": [],
})


# === Mordenkainen's Tome of Foes ===
# Sottorazze MToF aggiunte alle razze parent del PHB

# --- Eladrin (sottorazza Elfo, ora MMM) ---
# In MMM Eladrin / Sea Elf / Shadar-kai sono razze a se' stanti. Per non
# rompere i PG salvati le manteniamo come sottorazze dell'Elfo (parent
# PHB) ma aggiorniamo i tratti alla versione MMM (Passo Fatato scala col
# PB con effetto-stagione al 3 livello).
_add_subrace("Elfo", {
    "name": "Eladrin",
    "name_en": "Eladrin",
    "source_short": "MMM",
    "ability_score_increase": {"Carisma": 1},
    "asi_text": "+1 Carisma",
    "description": "Da eladrin, sei un elfo nativo del Reame Fatato. Esprimi una stagione associata al tuo umore, che puoi cambiare ogni volta che termini un riposo lungo. Versione MMM: Passo Fatato scalabile col bonus competenza.",
    "traits": [
        T("fey_step_mmm"),
        T({
            "name": "Stagione",
            "name_en": "Season",
            "description": "Sei associato a una delle quattro stagioni: primavera (gioia), estate (audacia), autunno (pace) o inverno (malinconia). Puoi cambiare la tua stagione ogni volta che termini un riposo lungo. La stagione determina l'effetto extra del Passo Fatato a partire dal 3 livello.",
        }),
    ],
})

# --- Sea Elf (sottorazza Elfo, ora MMM) ---
_add_subrace("Elfo", {
    "name": "Elfo del Mare",
    "name_en": "Sea Elf",
    "source_short": "MMM",
    "ability_score_increase": {"Costituzione": 1},
    "asi_text": "+1 Costituzione",
    "description": "Da elfo del mare, sei un elfo che vive nelle profondita' dell'oceano. Hai forte affinita' con la natura acquatica. Versione MMM: respiri sia aria che acqua e nuoti a 9m.",
    "traits": [
        T("child_of_the_sea"),
        T("friend_of_the_sea"),
        T({
            "name": "Addestramento alle Armi degli Elfi del Mare",
            "name_en": "Sea Elf Training",
            "description": "Hai competenza con lancia, tridente, rete e balestra leggera.",
        }),
        T({
            "name": "Lingua Primordiale (dialetto Acquano)",
            "name_en": "Primordial Language (Aquan)",
            "description": "Sai parlare, leggere e scrivere il dialetto Acquano della lingua Primordiale, oltre alle altre lingue elfiche.",
        }),
    ],
})

# --- Shadar-kai (sottorazza Elfo, ora MMM) ---
# Benedizione della Regina Corvo ora scala col PB e da resistenza a tutti
# i danni fino all'inizio del prossimo turno dopo il teletrasporto.
_add_subrace("Elfo", {
    "name": "Shadar-kai",
    "name_en": "Shadar-kai",
    "source_short": "MMM",
    "ability_score_increase": {"Costituzione": 1},
    "asi_text": "+1 Costituzione",
    "description": "Da shadar-kai, sei un elfo legato al Piano dell'Ombra, servitore della Regina Corvo. Sei pallido, scuro come un cadavere e dotato di forte legame con la morte.",
    "traits": [
        T("necrotic_resistance"),
        T("blessing_of_raven_queen_mmm"),
    ],
})

# --- Duergar (sottorazza Nano, ora MMM) ---
# In MMM Duergar e' una razza standalone: la teniamo come sottorazza per
# compatibilita', ma con tratti MMM (Magia Duergar PB usi/RL, Fortitudine
# Psionica al posto di Resilienza, niente Sensibilita' alla Luce Solare).
_add_subrace("Nano", {
    "name": "Duergar",
    "name_en": "Duergar",
    "source_short": "MMM",
    "ability_score_increase": {"Forza": 1},
    "asi_text": "+1 Forza",
    "description": "Da duergar, sei un nano grigio dell'Underdark. La tua mente e' temprata dalla sofferenza, e sei abituato all'oscurita'. Versione MMM: piu' magia psionica, niente piu' debolezza alla luce solare.",
    "traits": [
        T("darkvision_120"),
        T("psionic_fortitude"),
        T("duergar_magic_mmm"),
        T({
            "name": "Lingue Duergar",
            "name_en": "Duergar Languages",
            "description": "Sai parlare, leggere e scrivere Comune, Nanico e Sottocomune.",
        }),
    ],
})

# --- Svirfneblin / Deep Gnome (sottorazza Gnomo, ora MMM) ---
_add_subrace("Gnomo", {
    "name": "Gnomo Svirfneblin",
    "name_en": "Deep Gnome (Svirfneblin)",
    "source_short": "MMM",
    "ability_score_increase": {"Destrezza": 1},
    "asi_text": "+1 Destrezza",
    "description": "Da svirfneblin (gnomo profondo), vivi nell'Underdark e sei piu' magro e duro dei tuoi cugini di superficie. Versione MMM: Astuzia Gnomesca + Magia degli Gnomi delle Profondita'.",
    "traits": [
        T("darkvision_120"),
        T("stone_camouflage"),
        T("gnomish_cunning_svirfneblin"),
        T("deep_gnome_magic"),
        T({
            "name": "Lingue Svirfneblin",
            "name_en": "Svirfneblin Languages",
            "description": "Sai parlare Sottocomune oltre a Comune e Gnomesco.",
        }),
    ],
})

# --- Githyanki (MToF) ---
# --- Githyanki (MMM) ---
# In MMM "Decadent Mastery" e "Martial Prodigy" sono rimpiazzati da
# "Conoscenza Astrale" (skill/strumento a scelta dopo riposo lungo).
# Psionica: scala col PB e si sceglie l'abilita' (INT/SAG/CAR). ASI
# flottante.
_add_race("Githyanki", {
    "name_en": "Githyanki",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "I githyanki invecchiano molto lentamente; potrebbero vivere per secoli a meno di non essere uccisi.",
    "alignment": "Spesso militaristi e fieri; MMM lascia liberta' al giocatore.",
    "description": "I githyanki, predoni psionici dell'Astrale, conducono incursioni a cavallo di draghi rossi attraverso i piani per saccheggiare ricchezze e schiavi.",
    "languages": ["Comune", "Gith"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T("astral_knowledge"),
        T("githyanki_psionics_mmm"),
    ],
    "subraces": [],
})

# --- Githzerai (MMM) ---
# Mantiene Disciplina Mentale; Psionica scala col PB e l'abilita' e' a
# scelta. ASI flottante.
_add_race("Githzerai", {
    "name_en": "Githzerai",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "I githzerai possono vivere oltre il secolo. Maturano alla stessa velocita' degli umani.",
    "alignment": "Spesso disciplinati e meditativi; MMM lascia liberta' al giocatore.",
    "description": "I githzerai sono asceti monastici dei piani caotici, opposti ai loro cugini githyanki. Vivono in monasteri nel Limbo dove perfezionano corpo e mente.",
    "languages": ["Comune", "Gith"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": ["psichico"],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T("mental_discipline"),
        T("githzerai_psionics_mmm"),
    ],
    "subraces": [],
})


# === Mordenkainen presents: Monsters of the Multiverse (ex-MOoT/ToA) ===
# Centauro, Leonino, Minotauro, Satiro e Tortle vengono ripubblicati in
# MMM con ASI flottante e tratti scalati col PB dove sensato.

# --- Centaur (MMM, originariamente MOoT/GGtR) ---
_add_race("Centauro", {
    "name_en": "Centaur",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 12,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "I centauri maturano alla stessa velocita' degli umani e di solito vivono fino a un secolo.",
    "alignment": "Devoti alle tradizioni del proprio clan; MMM lascia liberta' al giocatore.",
    "description": "Esseri robusti e selvaggi, i centauri sono mezzi cavalli e mezzi umanoidi che vagano per pianure e foreste in branchi tribali, fieri della loro liberta'.",
    "languages": ["Comune", "Silvano"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Fatato",
    "traits": [
        T("fey_creature_type"),
        T("charge"),
        T("hooves"),
        T("equine_build"),
        T("survivor_centaur"),
    ],
    "subraces": [],
})

# --- Leonin (MMM, originariamente MOoT) ---
_add_race("Leonino", {
    "name_en": "Leonin",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 10.5,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "I leonini maturano piu' velocemente degli umani, raggiungendo la maturita' a 16 anni. Vivono fino a 95 anni.",
    "alignment": "Spesso fieri e protettivi della loro tribu'; MMM lascia liberta' al giocatore.",
    "description": "Una razza umanoide felina nobile e fiera, i leonini vivono in tribu' nomadi nelle praterie sotto cieli aperti, dedicandosi alla protezione delle terre selvagge.",
    "languages": ["Comune", "Leonino"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T("daunting_roar_mmm"),
        T("hunters_instincts"),
        T("claws_leonin"),
    ],
    "subraces": [],
})

# --- Minotaur (MMM, originariamente MOoT) ---
_add_race("Minotauro", {
    "name_en": "Minotaur",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "I minotauri maturano alla stessa velocita' degli umani e hanno una durata di vita simile.",
    "alignment": "Spesso orgogliosi guerrieri devoti a codici d'onore; MMM lascia liberta' al giocatore.",
    "description": "Robusti, alti e cornuti, i minotauri sono guerrieri che vivono in tribu' guidate da forti tradizioni. Combinano forza fisica e abilita' tattica.",
    "languages": ["Comune", "Minotaurico"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T("horns_minotaur"),
        T("goring_rush"),
        T("hammering_horns"),
        T("labyrinthine_recall"),
    ],
    "subraces": [],
})

# --- Satyr (MMM, originariamente MOoT) ---
_add_race("Satiro", {
    "name_en": "Satyr",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 10.5,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "I satiri maturano alla stessa velocita' degli umani ma vivono molto piu' a lungo, fino a 200 anni.",
    "alignment": "Spesso allegri e festosi; MMM lascia liberta' al giocatore.",
    "description": "I satiri sono creature fatate gioiose e festose, mezzi umanoidi e mezze capre, che vivono nei boschi godendo della musica, del vino e dei piaceri della natura.",
    "languages": ["Comune", "Silvano"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Fatato",
    "traits": [
        T("fey_creature_type"),
        T("magic_resistance_satyr_mmm"),
        T("mirthful_leaps"),
        T("reveler_satyr"),
        T("ram_satyr"),
    ],
    "subraces": [],
})

# === Mordenkainen presents: Monsters of the Multiverse ===
# Le razze MMM/MOTM aggiungono nuove razze che non erano presenti nei manuali
# precedenti. Le razze esistenti (Aasimar, Goliath, Triton, Tabaxi, ecc.)
# hanno una versione MMM modernizzata, ma per evitare duplicati nel picker
# manteniamo qui SOLO le razze veramente mancanti dal dataset corrente.

# --- Aarakocra (MMM) ---
_add_race("Aarakocra", {
    "name_en": "Aarakocra",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 7.5,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM 'origine dei personaggi').",
    "age": "Gli aarakocra raggiungono la maturita' a 3 anni e vivono fino a 30.",
    "alignment": "Spesso caotici buoni: amano la liberta' e detestano la schiavitu'.",
    "description": "Aviari delle nubi, gli aarakocra hanno corpi simili a uomini-uccello con ali piumate, occhi di rapace e becchi affilati. Migrano per il Piano dell'Aria e per i picchi piu' alti del Multiverso.",
    "languages": ["Comune", "Auran"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T({
            "name": "Volo",
            "name_en": "Flight",
            "description": "Hai una velocita' di volo di 15 metri. Per usarla, non puoi indossare armature mediane o pesanti.",
        }),
        T({
            "name": "Artigli",
            "name_en": "Talons",
            "description": "Hai artigli affilati come armi naturali, con cui puoi effettuare attacchi senz'armi senza essere disarmato. Quando colpisci con essi, infliggi 1d6 + il tuo modificatore di Forza danni taglienti, invece dei normali danni contundenti.",
        }),
        T({
            "name": "Vento Folgorante (Wind Caller)",
            "name_en": "Wind Caller",
            "description": "A partire dal 3 livello, puoi lanciare l'incantesimo folata di vento con questo tratto, senza richiedere componenti materiali. Una volta lanciato, non puoi farlo di nuovo finche' non termini un riposo lungo. La Saggezza, l'Intelligenza o il Carisma e' la tua caratteristica da incantatore (a tua scelta) per esso.",
            "uses": {"amount": 1, "recharge": "long_rest"},
            "innate_spells": [
                {"name_en": "Gust of Wind", "name": "Folata di Vento", "level": 2, "level_cast": 2, "min_pg_level": 3, "recharge": "long_rest", "ability": "Saggezza"},
            ],
        }),
    ],
    "subraces": [],
})

# --- Changeling (MMM) ---
_add_race("Mutamorfo", {
    "name_en": "Changeling",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM).",
    "age": "Gli changeling raggiungono la maturita' a 20 anni e vivono fino a 100.",
    "alignment": "Variano ampiamente; spesso assumono identita' diverse a seconda della situazione.",
    "description": "Mutaforma silenziosi e adattabili, gli changeling possono modificare il proprio aspetto a piacimento. Molti vivono come spie, attori o mediatori tra culture diverse.",
    "languages": ["Comune"],
    "languages_extra": 2,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T({
            "name": "Istinto Mutaforma",
            "name_en": "Changeling Instincts",
            "description": "Hai competenza in due delle seguenti abilita' a tua scelta: Inganno, Intuizione, Intimidire, Persuasione.",
        }),
        T({
            "name": "Mutaforma",
            "name_en": "Shapechanger",
            "description": "Come azione, puoi cambiare il tuo aspetto e la tua voce. Determini i dettagli del nuovo aspetto, inclusi sesso, altezza e peso (entro un metro o due dalla tua altezza/peso normale). Puoi farti sembrare un membro di un'altra razza, anche se nessuno dei tuoi statistiche cambia. Non puoi assumere le sembianze di una creatura di taglia diversa dalla tua, e la tua forma base e' sempre umanoide. Mantieni la nuova forma finche' non usi un'azione per tornare alla tua vera forma o finche' non muori.",
        }),
        T({
            "name": "Versatilita' Linguistica",
            "name_en": "Changeling Linguist",
            "description": "Conosci due linguaggi a tua scelta oltre al Comune.",
        }),
    ],
    "subraces": [],
})

# --- Fairy (MMM) ---
_add_race("Fata", {
    "name_en": "Fairy",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Piccola",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM).",
    "age": "Le fate raggiungono la maturita' a 20 anni e vivono fino a circa 200.",
    "alignment": "Le fate tendono al caotico buono; aborrono la rigidita' e amano la liberta' e l'umorismo.",
    "description": "Piccole creature fatate dalle ali iridescenti, le fate vagano tra i piani in cerca di meraviglia e malizia. Bench'e' minute, posseggono potenti incantesimi innati.",
    "languages": ["Comune", "Silvano"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Fata",
    "traits": [
        T("fey_creature_type"),
        T({
            "name": "Volo",
            "name_en": "Flight",
            "description": "Hai una velocita' di volo di 9 metri grazie alle tue ali. Per usarla, non puoi indossare armature mediane o pesanti.",
        }),
        T({
            "name": "Magia Fatata",
            "name_en": "Fairy Magic",
            "description": "Conosci il trucchetto luci danzanti. A partire dal 3 livello, puoi lanciare ingrandire/ridurre (solo la versione 'ridurre' su te stesso). A partire dal 5 livello, puoi lanciare invisibilita'. Una volta lanciato uno di questi due incantesimi con questo tratto, devi finire un riposo lungo prima di poterlo lanciare di nuovo. Puoi anche lanciarli usando slot incantesimo che possiedi. Intelligenza, Saggezza o Carisma e' la tua caratteristica da incantatore per essi (scegli quando crei il personaggio).",
            "innate_spells": [
                {"name_en": "Druidcraft",       "name": "Pratica Druidica", "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will",   "ability": "Carisma"},
                {"name_en": "Faerie Fire",      "name": "Luminescenza",     "level": 1, "level_cast": 1, "min_pg_level": 1, "recharge": "long_rest", "ability": "Carisma"},
                {"name_en": "Enlarge/Reduce",   "name": "Ingrandire/Ridurre", "level": 2, "level_cast": 2, "min_pg_level": 3, "recharge": "long_rest", "ability": "Carisma"},
                {"name_en": "Invisibility",     "name": "Invisibilità",     "level": 2, "level_cast": 2, "min_pg_level": 5, "recharge": "long_rest", "ability": "Carisma"},
            ],
        }),
    ],
    "subraces": [],
})

# --- Harengon (MMM) ---
_add_race("Harengon", {
    "name_en": "Harengon",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Piccola o Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM).",
    "age": "Gli harengon raggiungono la maturita' a 20 anni e vivono fino a 100.",
    "alignment": "Spesso caotici neutrali o caotici buoni; vagabondi per natura.",
    "description": "Lepri umanoidi influenzate dal tocco del Reame Fatato, gli harengon possiedono lunghe orecchie sensibili, riflessi fulminei e una notevole abilita' nel salto.",
    "languages": ["Comune", "Silvano"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T({
            "name": "Salto Possente",
            "name_en": "Hare-Trigger",
            "description": "Puoi aggiungere il tuo bonus di competenza ai tiri di iniziativa.",
        }),
        T({
            "name": "Saltatore",
            "name_en": "Leporine Senses",
            "description": "Hai competenza nell'abilita' Percezione.",
        }),
        T({
            "name": "Lunga Falcata",
            "name_en": "Lucky Footwork",
            "description": "Quando fallisci un tiro salvezza su Destrezza, puoi usare la tua reazione per tirare 1d4 e aggiungere il numero ottenuto al risultato del tiro, potenzialmente trasformandolo in un successo. Non puoi usare questo tratto se sei inabile o ridotto a velocita' 0.",
        }),
        T({
            "name": "Salto Naturale",
            "name_en": "Rabbit Hop",
            "description": "Come azione bonus, puoi saltare con un balzo fino a una distanza in metri pari a 1,5 + 1,5 metri x il tuo bonus di competenza, senza provocare attacchi di opportunita'. Puoi usare questo tratto un numero di volte pari al tuo bonus di competenza, riacquistando tutti gli usi al termine di un riposo lungo.",
            "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
        }),
    ],
    "subraces": [],
})

# --- Genasi (EEPC/MMM) ---
# Genasi e' un'unica razza con 4 sottorazze elementali (aria, terra, fuoco, acqua).
_add_race("Genasi", {
    "name_en": "Genasi",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"Costituzione": 2},
    "asi_text": "+2 Costituzione (PHB/MMM); la sottorazza determina l'aumento ulteriore.",
    "age": "I genasi maturano alla stessa velocita' degli umani e raggiungono l'eta' adulta a 20 anni. Vivono leggermente piu' a lungo, fino a 120 anni.",
    "alignment": "I genasi tendono ad essere indipendenti e impulsivi, riflettendo il loro retaggio elementale.",
    "description": "I genasi sono i discendenti di unioni tra mortali e creature degli Elementali Interni. Ogni genasi reca in se' la traccia di uno dei quattro elementi: aria, terra, fuoco o acqua.",
    "languages": ["Comune", "Primordiale"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [],
    "subraces": [],  # popolate sotto via _add_subrace
})

_add_subrace("Genasi", {
    "name": "Genasi dell'Aria",
    "name_en": "Air Genasi",
    "source_short": "MMM",
    "description": "Discendi dai jinn dell'aria. Sei sempre circondato da una brezza leggera. Hai competenza con il trucchetto modellare l'aria e impari nuovi incantesimi di levitazione e folata di vento crescendo di livello.",
    "ability_score_increase": {"Destrezza": 1},
    "asi_text": "+1 Destrezza",
    "traits": [
        T({
            "name": "Respiro Indipendente",
            "name_en": "Unending Breath",
            "description": "Puoi trattenere il respiro indefinitamente quando non sei inabile.",
        }),
        T({
            "name": "Magia dell'Aria",
            "name_en": "Mingle with the Wind",
            "description": "Conosci il trucchetto modellare l'aria. A partire dal 3 livello, puoi lanciare levitazione una volta con questo tratto, e riacquisti la capacita' di farlo quando termini un riposo lungo. La Costituzione e' la tua caratteristica da incantatore per essi.",
            "innate_spells": [
                {"name_en": "Shocking Grasp", "name": "Tocco Folgorante", "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will",   "ability": "Costituzione"},
                {"name_en": "Feather Fall",   "name": "Caduta Morbida",   "level": 1, "level_cast": 1, "min_pg_level": 3, "recharge": "long_rest", "ability": "Costituzione"},
                {"name_en": "Levitate",       "name": "Levitazione",      "level": 2, "level_cast": 2, "min_pg_level": 5, "recharge": "long_rest", "ability": "Costituzione"},
            ],
        }),
        T({
            "name": "Anima dell'Aria",
            "name_en": "Lightning Resistance",
            "description": "Hai resistenza ai danni da fulmine.",
        }),
    ],
    "resistances": ["fulmine"],
})

_add_subrace("Genasi", {
    "name": "Genasi della Terra",
    "name_en": "Earth Genasi",
    "source_short": "MMM",
    "description": "Discendi dai dao della terra. La tua pelle ha venature simili al marmo e i tuoi capelli ricordano l'erba o l'argento. Puoi attraversare terreno difficile naturale senza penalita'.",
    "ability_score_increase": {"Forza": 1},
    "asi_text": "+1 Forza",
    "traits": [
        T({
            "name": "Sentiero della Terra",
            "name_en": "Earth Walk",
            "description": "Puoi muoverti attraverso il terreno difficile fatto di terra o pietra senza spendere movimento aggiuntivo.",
        }),
        T({
            "name": "Fusione con la Pietra",
            "name_en": "Merge with Stone",
            "description": "Puoi lanciare l'incantesimo passare senza traccia con questo tratto e riacquisti la capacita' di farlo quando termini un riposo lungo. Puoi anche lanciarlo usando slot incantesimo che possiedi. La Costituzione e' la tua caratteristica da incantatore per esso.",
            "innate_spells": [
                {"name_en": "Blade Ward",     "name": "Difesa dalle Lame", "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will",   "ability": "Costituzione"},
                {"name_en": "Pass without Trace", "name": "Passare senza Traccia", "level": 2, "level_cast": 2, "min_pg_level": 3, "recharge": "long_rest", "ability": "Costituzione"},
            ],
        }),
    ],
})

_add_subrace("Genasi", {
    "name": "Genasi del Fuoco",
    "name_en": "Fire Genasi",
    "source_short": "MMM",
    "description": "Discendi dagli efreet del fuoco. La tua pelle ha sfumature rosse o cinerine, e i tuoi capelli somigliano a fiamme guizzanti. Hai resistenza al danno da fuoco e impari incantesimi a tema fiamma.",
    "ability_score_increase": {"Intelligenza": 1},
    "asi_text": "+1 Intelligenza",
    "traits": [
        T({
            "name": "Vista del Fuoco",
            "name_en": "Darkvision",
            "description": "Hai scurovisione fino a 18 metri.",
        }),
        T({
            "name": "Resistenza al Fuoco",
            "name_en": "Fire Resistance",
            "description": "Hai resistenza ai danni da fuoco.",
        }),
        T({
            "name": "Stirpe del Fuoco",
            "name_en": "Reach to the Blaze",
            "description": "Conosci il trucchetto produrre fiamme. A partire dal 3 livello, puoi lanciare mani brucianti una volta con questo tratto e riacquisti la capacita' di farlo quando termini un riposo lungo. Puoi anche lanciarlo usando slot incantesimo che possiedi. La Costituzione e' la tua caratteristica da incantatore per essi.",
            "innate_spells": [
                {"name_en": "Produce Flame", "name": "Produrre Fiamme", "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will",   "ability": "Costituzione"},
                {"name_en": "Burning Hands", "name": "Mani Brucianti",  "level": 1, "level_cast": 1, "min_pg_level": 3, "recharge": "long_rest", "ability": "Costituzione"},
            ],
        }),
    ],
    "resistances": ["fuoco"],
    "darkvision": 18,
})

_add_subrace("Genasi", {
    "name": "Genasi dell'Acqua",
    "name_en": "Water Genasi",
    "source_short": "MMM",
    "description": "Discendi dai marid dell'acqua. La tua pelle ha sfumature blu o verdi, e ti muovi con la grazia delle correnti marine. Puoi nuotare e respirare sott'acqua.",
    "ability_score_increase": {"Saggezza": 1},
    "asi_text": "+1 Saggezza",
    "traits": [
        T({
            "name": "Acclimatamento Acquatico",
            "name_en": "Acid Resistance",
            "description": "Hai resistenza ai danni da acido.",
        }),
        T({
            "name": "Respiro Acquatico",
            "name_en": "Amphibious",
            "description": "Puoi respirare sia aria che acqua.",
        }),
        T({
            "name": "Nuotatore",
            "name_en": "Swim",
            "description": "Hai una velocita' di nuoto di 9 metri.",
        }),
        T({
            "name": "Magia dell'Acqua",
            "name_en": "Call to the Wave",
            "description": "Conosci il trucchetto modellare l'acqua. A partire dal 3 livello, puoi lanciare creare/distruggere acqua come incantesimo di 2 livello una volta con questo tratto e riacquisti la capacita' di farlo quando termini un riposo lungo. Puoi anche lanciarlo usando slot incantesimo che possiedi. La Costituzione e' la tua caratteristica da incantatore per essi.",
            "innate_spells": [
                {"name_en": "Shape Water", "name": "Modellare l'Acqua", "level": 0, "level_cast": 0, "min_pg_level": 1, "recharge": "at_will",   "ability": "Costituzione"},
                {"name_en": "Create or Destroy Water", "name": "Creare o Distruggere Acqua", "level": 1, "level_cast": 2, "min_pg_level": 3, "recharge": "long_rest", "ability": "Costituzione"},
            ],
        }),
    ],
    "resistances": ["acido"],
})

# --- Shifter (MMM) ---
# Shifter e' un'unica razza con 4 "Shifting Forms" come sottorazze.
_add_race("Shifter", {
    "name_en": "Shifter",
    "source": "Mordenkainen presenta: Mostri del Multiverso",
    "source_short": "MMM",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"_any": "+2/+1 o +1/+1/+1"},
    "asi_text": "Aumenta una caratteristica di +2 e un'altra di +1, oppure tre caratteristiche di +1 (regola MMM).",
    "age": "Gli shifter maturano a 10 anni e raramente vivono oltre i 70.",
    "alignment": "Spesso neutrali; le diverse stirpi tirano lo shifter in direzioni differenti.",
    "description": "Discendenti di mortali e creature licantrope, gli shifter possono attingere brevemente alla loro natura bestiale per ottenere caratteristiche animalesche. La sottorazza determina il tipo di trasformazione (Shifting Feature).",
    "languages": ["Comune"],
    "languages_extra": 1,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 18,
    "creature_type": "Umanoide",
    "traits": [
        T("darkvision_60"),
        T({
            "name": "Trasformazione (Shifting)",
            "name_en": "Shifting",
            "description": "Come azione bonus, puoi assumere una forma piu' bestiale. Questa trasformazione dura 1 minuto, finche' non muori, finche' non sei inabile o finche' non termini la trasformazione come azione bonus. Quando ti trasformi, ottieni un numero di punti ferita temporanei pari al tuo livello + il tuo modificatore di Costituzione (minimo 1). Puoi trasformarti un numero di volte pari al tuo bonus di competenza, riacquistando tutti gli usi al termine di un riposo lungo. La sottorazza determina i benefici aggiuntivi della trasformazione.",
            "uses": {"amount": "prof_bonus", "recharge": "long_rest"},
        }),
    ],
    "subraces": [],  # popolate sotto via _add_subrace
})

_add_subrace("Shifter", {
    "name": "Pellebestia (Beasthide)",
    "name_en": "Beasthide Shifter",
    "source_short": "MMM",
    "description": "Quando ti trasformi, ottieni 1d6 punti ferita temporanei aggiuntivi e gli attacchi senz'armi infliggono 1d6 danni contundenti.",
    "ability_score_increase": {},
    "asi_text": "",
    "traits": [
        T({
            "name": "Caratteristica di Trasformazione: Pellebestia",
            "name_en": "Shifting Feature: Beasthide",
            "description": "Quando attivi Trasformazione, ottieni 1d6 punti ferita temporanei extra. Mentre sei trasformato, ottieni una velocita' di scalata di 9 metri e gli attacchi senz'armi infliggono 1d6 + il tuo modificatore di Forza danni contundenti.",
        }),
    ],
})

_add_subrace("Shifter", {
    "name": "Zannalunga (Longtooth)",
    "name_en": "Longtooth Shifter",
    "source_short": "MMM",
    "description": "Mentre sei trasformato, le tue zanne diventano armi naturali con cui puoi infliggere 1d6 + Forza danni perforanti.",
    "ability_score_increase": {},
    "asi_text": "",
    "traits": [
        T({
            "name": "Caratteristica di Trasformazione: Zannalunga",
            "name_en": "Shifting Feature: Longtooth",
            "description": "Mentre sei trasformato, puoi effettuare un attacco senz'armi con i tuoi denti come azione bonus, infliggendo 1d6 + il tuo modificatore di Forza danni perforanti. La Forza e' la tua caratteristica per questo attacco.",
        }),
    ],
})

_add_subrace("Shifter", {
    "name": "Falcatasvelta (Swiftstride)",
    "name_en": "Swiftstride Shifter",
    "source_short": "MMM",
    "description": "Quando ti trasformi, la tua velocita' aumenta di 3 metri e puoi muoverti senza provocare attacchi di opportunita' come reazione.",
    "ability_score_increase": {},
    "asi_text": "",
    "traits": [
        T({
            "name": "Caratteristica di Trasformazione: Falcatasvelta",
            "name_en": "Shifting Feature: Swiftstride",
            "description": "Mentre sei trasformato, la tua velocita' a piedi aumenta di 3 metri. Inoltre, quando una creatura entro 1,5 metri da te effettua un attacco contro di te, puoi usare la tua reazione per muoverti fino a 3 metri senza provocare attacchi di opportunita'.",
        }),
    ],
})

_add_subrace("Shifter", {
    "name": "Cacciatore Selvatico (Wildhunt)",
    "name_en": "Wildhunt Shifter",
    "source_short": "MMM",
    "description": "Mentre sei trasformato, hai vantaggio ai tiri salvezza su Saggezza e nessuna creatura entro 9 metri da te puo' effettuare attacchi con vantaggio (a meno che non sia inabile).",
    "ability_score_increase": {},
    "asi_text": "",
    "traits": [
        T({
            "name": "Caratteristica di Trasformazione: Cacciatore Selvatico",
            "name_en": "Shifting Feature: Wildhunt",
            "description": "Mentre sei trasformato, hai vantaggio ai tiri salvezza su Saggezza e nessuna creatura entro 9 metri da te puo' effettuare un tiro per colpire con vantaggio contro di te (a meno che non sia inabile).",
        }),
    ],
})


# === Tomb of Annihilation ===

# --- Tortle (ToA) ---
_add_race("Tortle", {
    "name_en": "Tortle",
    "source": "La Tomba dell'Annichilazione",
    "source_short": "ToA",
    "size": "Media",
    "speed": 9,
    "ability_score_increase": {"Forza": 2, "Saggezza": 1},
    "asi_text": "+2 Forza, +1 Saggezza",
    "age": "I tortle vivono per circa 50 anni e raggiungono l'eta' adulta intorno ai 15. Generalmente trascorrono i loro ultimi anni in una sorta di pellegrinaggio spirituale.",
    "alignment": "I tortle sono in genere legali buoni. Apprezzano l'onesta', la diligenza e la lealta'.",
    "description": "I tortle sono creature dal guscio simile alle tartarughe che vivono lungo le coste. Maestri sopravvissuti e di solito cacciatori-raccoglitori, sono saggi e tranquilli.",
    "languages": ["Comune", "Acquano"],
    "languages_extra": 0,
    "skill_proficiencies": [],
    "tool_proficiencies": [],
    "weapon_proficiencies": [],
    "armor_proficiencies": [],
    "resistances": [],
    "darkvision": 0,
    "creature_type": "Umanoide",
    "traits": [
        T("claws_tortle"),
        T("hold_breath_tortle"),
        T("natural_armor_tortle"),
        T("shell_defense"),
        T("survival_instinct_tortle"),
    ],
    "subraces": [],
})


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def main():
    print(f"Razze totali: {len(RACES)}")
    total_subraces = sum(len(r.get("subraces", [])) for r in RACES.values())
    print(f"Sottorazze totali: {total_subraces}")

    OUT_JSON.write_text(
        json.dumps(RACES, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    js_payload = json.dumps(RACES, ensure_ascii=False, indent=2)
    OUT_JS.write_text(
        "/* Auto-generato da risorse/razze/build_races.py - non modificare a mano */\n"
        f"window.RACES_DATA = Object.assign(window.RACES_DATA || {{}}, {js_payload});\n",
        encoding="utf-8",
    )
    print(f"Scritto: {OUT_JSON.relative_to(ROOT)}")
    print(f"Scritto: {OUT_JS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
