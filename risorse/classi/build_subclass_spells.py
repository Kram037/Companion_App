"""
Build incantesimi automaticamente garantiti da classi/sottoclassi.

Per le sottoclassi che danno incantesimi "sempre preparati" o aggiunti alla
lista degli incantesimi conosciuti (Chierico Domini, Paladino Giuramenti,
Warlock Patroni con Lista Espansa, Sorcerer Aberrant Mind/Clockwork Soul,
Druido Cerchi che danno spell list, Ranger Conclavi, Artefice specialisti,
ecc.), genera una mappa che il client useri' per inserirli automaticamente
nella lista degli incantesimi del PG (col tag della sottoclasse).

Output:
  - risorse/classi/subclass_spells.json   (debug, leggibile)
  - js/data/subclass_spells_data.js       (consumato dal frontend)

Schema:
  {
      "<class_slug>": {
          "<subclass_slug>": {
              "<pgLevelMin>": ["Nome IT 1", "Nome IT 2", ...],
              ...
          }
      }
  }

Nota: il livello chiave non e' il livello dell'incantesimo, ma il livello
minimo di classe a cui il PG ottiene quegli incantesimi (es. Chierico Vita
ottiene Bless+Cura Ferite a livello 1, Ristorare Inferiore+Arma Spirituale
a livello 3, ecc.).
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
SPELLS_JSON = ROOT / "risorse" / "incantesimi" / "spells.json"
OUT_JSON = ROOT / "risorse" / "classi" / "subclass_spells.json"
OUT_JS = ROOT / "js" / "data" / "subclass_spells_data.js"

# ─────────────────────────────────────────────────────────────────────────
# Caricamento dataset incantesimi: serve per mappare nomi EN -> nomi IT
# ─────────────────────────────────────────────────────────────────────────
SPELLS = json.loads(SPELLS_JSON.read_text(encoding="utf-8"))


def _norm(s: str) -> str:
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9]+", "", s.lower())
    return s


# Mappa name_en -> nome IT (chiave di SPELLS)
EN_TO_IT: dict[str, str] = {}
for it_name, sp in SPELLS.items():
    en = sp.get("name_en") or ""
    if en:
        EN_TO_IT[en] = it_name
        EN_TO_IT[_norm(en)] = it_name

# Override per nomi con punteggiatura (Otiluke's, Rary's, etc.) o varianti
SPELL_ALIAS: dict[str, str] = {
    "Otiluke's Resilient Sphere": "Sfera Resiliente di Otiluke",
    "Rary's Telepathic Bond": "Legame Telepatico di Rary",
    "Leomund's Tiny Hut": "Piccola Capanna di Leomund",
    "Mordenkainen's Faithful Hound": "Segugio Fedele di Mordenkainen",
    "Bigby's Hand": "Mano di Bigby",
    "Tasha's Hideous Laughter": "Risata Atroce di Tasha",
    "Tenser's Floating Disk": "Disco Fluttuante di Tenser",
    "Melf's Acid Arrow": "Freccia Acida di Melf",
    "Evard's Black Tentacles": "Tentacoli Neri di Evard",
    "Nystul's Magic Aura": "Aura Magica di Nystul",
    "Mordenkainen's Sword": "Spada di Mordenkainen",
    "Crusader's Mantle": "Manto del Crociato",
    "Hunter's Mark": "Marchio del Cacciatore",
    "Conjure Barrage": "Sbarramento Evocato",
    "Detect Evil and Good": "Individuazione del Bene e del Male",
}


def s(en: str) -> str | None:
    """Restituisce il nome IT dell'incantesimo corrispondente al nome EN.
    Se non trovato, ritorna None (e logga un warning)."""
    if en in SPELL_ALIAS:
        candidate = SPELL_ALIAS[en]
        if candidate in SPELLS:
            return candidate
    if en in EN_TO_IT:
        return EN_TO_IT[en]
    n = _norm(en)
    if n in EN_TO_IT:
        return EN_TO_IT[n]
    return None


_warned: set[str] = set()


def lst(*names: str) -> list[str]:
    out = []
    for n in names:
        it = s(n)
        if it:
            out.append(it)
        else:
            if n not in _warned:
                print(f"  ! incantesimo non trovato nel dataset: {n}")
                _warned.add(n)
    return out


# ─────────────────────────────────────────────────────────────────────────
# Dati hardcoded: { class_slug: { subclass_slug: { pgLvlMin: [spell_en] } } }
# Usiamo l'helper `lst(*EN names)` per convertire al volo a IT.
# ─────────────────────────────────────────────────────────────────────────
DATA: dict[str, dict[str, dict[int, list[str]]]] = {}


def add(cls: str, sub: str, by_level: dict[int, list[str]]) -> None:
    DATA.setdefault(cls, {})[sub] = by_level


# ── Chierico: Domain Spells (PHB + DMG + XGtE + TCoE + SCAG) ──
add("cleric", "life-domain", {
    1: lst("Bless", "Cure Wounds"),
    3: lst("Lesser Restoration", "Spiritual Weapon"),
    5: lst("Beacon of Hope", "Revivify"),
    7: lst("Death Ward", "Guardian of Faith"),
    9: lst("Mass Cure Wounds", "Raise Dead"),
})
add("cleric", "knowledge-domain", {
    1: lst("Command", "Identify"),
    3: lst("Augury", "Suggestion"),
    5: lst("Nondetection", "Speak with Dead"),
    7: lst("Arcane Eye", "Confusion"),
    9: lst("Legend Lore", "Scrying"),
})
add("cleric", "light-domain", {
    1: lst("Burning Hands", "Faerie Fire"),
    3: lst("Flaming Sphere", "Scorching Ray"),
    5: lst("Daylight", "Fireball"),
    7: lst("Guardian of Faith", "Wall of Fire"),
    9: lst("Flame Strike", "Scrying"),
})
add("cleric", "nature-domain", {
    1: lst("Animal Friendship", "Speak with Animals"),
    3: lst("Barkskin", "Spike Growth"),
    5: lst("Plant Growth", "Wind Wall"),
    7: lst("Dominate Beast", "Grasping Vine"),
    9: lst("Insect Plague", "Tree Stride"),
})
add("cleric", "tempest-domain", {
    1: lst("Fog Cloud", "Thunderwave"),
    3: lst("Gust of Wind", "Shatter"),
    5: lst("Call Lightning", "Sleet Storm"),
    7: lst("Control Water", "Ice Storm"),
    9: lst("Destructive Wave", "Insect Plague"),
})
add("cleric", "trickery-domain", {
    1: lst("Charm Person", "Disguise Self"),
    3: lst("Mirror Image", "Pass without Trace"),
    5: lst("Blink", "Dispel Magic"),
    7: lst("Dimension Door", "Polymorph"),
    9: lst("Dominate Person", "Modify Memory"),
})
add("cleric", "war-domain", {
    1: lst("Divine Favor", "Shield of Faith"),
    3: lst("Magic Weapon", "Spiritual Weapon"),
    5: lst("Crusader's Mantle", "Spirit Guardians"),
    7: lst("Freedom of Movement", "Stoneskin"),
    9: lst("Flame Strike", "Hold Monster"),
})
add("cleric", "death-domain", {
    1: lst("False Life", "Ray of Sickness"),
    3: lst("Blindness/Deafness", "Ray of Enfeeblement"),
    5: lst("Animate Dead", "Vampiric Touch"),
    7: lst("Blight", "Death Ward"),
    9: lst("Antilife Shell", "Cloudkill"),
})
add("cleric", "forge-domain", {
    1: lst("Identify", "Searing Smite"),
    3: lst("Heat Metal", "Magic Weapon"),
    5: lst("Elemental Weapon", "Protection from Energy"),
    7: lst("Fabricate", "Wall of Fire"),
    9: lst("Animate Objects", "Creation"),
})
add("cleric", "grave-domain", {
    1: lst("Bane", "False Life"),
    3: lst("Gentle Repose", "Ray of Enfeeblement"),
    5: lst("Revivify", "Vampiric Touch"),
    7: lst("Blight", "Death Ward"),
    9: lst("Antilife Shell", "Raise Dead"),
})
add("cleric", "order-domain", {
    1: lst("Command", "Heroism"),
    3: lst("Hold Person", "Zone of Truth"),
    5: lst("Mass Healing Word", "Slow"),
    7: lst("Compulsion", "Locate Creature"),
    9: lst("Commune", "Dominate Person"),
})
add("cleric", "peace-domain", {
    1: lst("Heroism", "Sanctuary"),
    3: lst("Aid", "Warding Bond"),
    5: lst("Beacon of Hope", "Sending"),
    7: lst("Aura of Purity", "Otiluke's Resilient Sphere"),
    9: lst("Greater Restoration", "Rary's Telepathic Bond"),
})
add("cleric", "twilight-domain", {
    1: lst("Faerie Fire", "Sleep"),
    3: lst("Moonbeam", "See Invisibility"),
    5: lst("Aura of Vitality", "Leomund's Tiny Hut"),
    7: lst("Aura of Life", "Greater Invisibility"),
    9: lst("Circle of Power", "Mislead"),
})
add("cleric", "arcana-domain", {
    1: lst("Detect Magic", "Magic Missile"),
    3: lst("Magic Weapon", "Nystul's Magic Aura"),
    5: lst("Dispel Magic", "Magic Circle"),
    7: lst("Arcane Eye", "Leomund's Secret Chest"),
    9: lst("Planar Binding", "Teleportation Circle"),
})

# ── Paladino: Oath Spells (PHB + DMG + XGtE + TCoE) ──
add("paladin", "oath-of-devotion", {
    3: lst("Protection from Evil and Good", "Sanctuary"),
    5: lst("Lesser Restoration", "Zone of Truth"),
    9: lst("Beacon of Hope", "Dispel Magic"),
    13: lst("Freedom of Movement", "Guardian of Faith"),
    17: lst("Commune", "Flame Strike"),
})
add("paladin", "oath-of-the-ancients", {
    3: lst("Ensnaring Strike", "Speak with Animals"),
    5: lst("Misty Step", "Moonbeam"),
    9: lst("Plant Growth", "Protection from Energy"),
    13: lst("Ice Storm", "Stoneskin"),
    17: lst("Commune with Nature", "Tree Stride"),
})
add("paladin", "oath-of-vengeance", {
    3: lst("Bane", "Hunter's Mark"),
    5: lst("Hold Person", "Misty Step"),
    9: lst("Haste", "Protection from Energy"),
    13: lst("Banishment", "Dimension Door"),
    17: lst("Hold Monster", "Scrying"),
})
add("paladin", "oath-of-conquest", {
    3: lst("Armor of Agathys", "Command"),
    5: lst("Hold Person", "Spiritual Weapon"),
    9: lst("Bestow Curse", "Fear"),
    13: lst("Dominate Beast", "Stoneskin"),
    17: lst("Cloudkill", "Dominate Person"),
})
add("paladin", "oath-of-redemption", {
    3: lst("Sanctuary", "Sleep"),
    5: lst("Hold Person", "Ray of Enfeeblement"),
    9: lst("Counterspell", "Hypnotic Pattern"),
    13: lst("Otiluke's Resilient Sphere", "Stoneskin"),
    17: lst("Hold Monster", "Wall of Force"),
})
add("paladin", "oath-of-glory", {
    3: lst("Guiding Bolt", "Heroism"),
    5: lst("Enhance Ability", "Magic Weapon"),
    9: lst("Haste", "Protection from Energy"),
    13: lst("Compulsion", "Freedom of Movement"),
    17: lst("Commune", "Flame Strike"),
})
add("paladin", "oath-of-the-watchers", {
    3: lst("Alarm", "Detect Magic"),
    5: lst("Moonbeam", "See Invisibility"),
    9: lst("Counterspell", "Nondetection"),
    13: lst("Aura of Purity", "Banishment"),
    17: lst("Hold Monster", "Scrying"),
})
add("paladin", "oath-of-the-crown", {
    3: lst("Command", "Compelled Duel"),
    5: lst("Warding Bond", "Zone of Truth"),
    9: lst("Aura of Vitality", "Spirit Guardians"),
    13: lst("Banishment", "Guardian of Faith"),
    17: lst("Circle of Power", "Geas"),
})
add("paladin", "oathbreaker", {
    3: lst("Hellish Rebuke", "Inflict Wounds"),
    5: lst("Crown of Madness", "Darkness"),
    9: lst("Animate Dead", "Bestow Curse"),
    13: lst("Blight", "Confusion"),
    17: lst("Contagion", "Dominate Person"),
})

# ── Warlock: Expanded Spell List (PHB + XGtE + TCoE + SCAG + VRGtR) ──
# Per i Warlock l'unlock e' al livello del PG che permette di lanciare lo
# spell di quel livello (1: lvl 1 spell, 3: lvl 2, 5: lvl 3, 7: lvl 4,
# 9: lvl 5). Ottenuti come "scelta in lista", non sempre preparati.
add("warlock", "archfey", {
    1: lst("Faerie Fire", "Sleep"),
    3: lst("Calm Emotions", "Phantasmal Force"),
    5: lst("Blink", "Plant Growth"),
    7: lst("Dominate Beast", "Greater Invisibility"),
    9: lst("Dominate Person", "Seeming"),
})
add("warlock", "the-fiend", {
    1: lst("Burning Hands", "Command"),
    3: lst("Blindness/Deafness", "Scorching Ray"),
    5: lst("Fireball", "Stinking Cloud"),
    7: lst("Fire Shield", "Wall of Fire"),
    9: lst("Flame Strike", "Hallow"),
})
add("warlock", "great-old-one", {
    1: lst("Dissonant Whispers", "Tasha's Hideous Laughter"),
    3: lst("Detect Thoughts", "Phantasmal Force"),
    5: lst("Clairvoyance", "Sending"),
    7: lst("Dominate Beast", "Evard's Black Tentacles"),
    9: lst("Dominate Person", "Telekinesis"),
})
add("warlock", "hexblade", {
    1: lst("Shield", "Wrathful Smite"),
    3: lst("Blur", "Branding Smite"),
    5: lst("Blink", "Elemental Weapon"),
    7: lst("Phantasmal Killer", "Staggering Smite"),
    9: lst("Banishing Smite", "Cone of Cold"),
})
add("warlock", "celestial", {
    1: lst("Cure Wounds", "Guiding Bolt"),
    3: lst("Flaming Sphere", "Lesser Restoration"),
    5: lst("Daylight", "Revivify"),
    7: lst("Guardian of Faith", "Wall of Fire"),
    9: lst("Greater Restoration", "Flame Strike"),
})
add("warlock", "fathomless", {
    1: lst("Create or Destroy Water", "Thunderwave"),
    3: lst("Gust of Wind", "Silence"),
    5: lst("Lightning Bolt", "Sleet Storm"),
    7: lst("Control Water", "Summon Elemental"),
    9: lst("Bigby's Hand", "Cone of Cold"),
})
add("warlock", "genie", {
    1: lst("Detect Evil and Good", "Phantasmal Force"),
    3: lst("Phantom Steed", "Protection from Evil and Good"),
    5: lst("Create Food and Water", "Tongues"),
    7: lst("Phantasmal Killer", "Stoneskin"),
    9: lst("Creation", "Wall of Stone"),
})
add("warlock", "undead", {
    1: lst("Bane", "False Life"),
    3: lst("Blindness/Deafness", "Phantasmal Force"),
    5: lst("Phantom Steed", "Speak with Dead"),
    7: lst("Death Ward", "Greater Invisibility"),
    9: lst("Antilife Shell", "Cloudkill"),
})
add("warlock", "undying", {
    1: lst("False Life", "Ray of Sickness"),
    3: lst("Blindness/Deafness", "Silence"),
    5: lst("Feign Death", "Speak with Dead"),
    7: lst("Aura of Life", "Death Ward"),
    9: lst("Contagion", "Legend Lore"),
})

# ── Sorcerer subclass spells (TCoE) ──
add("sorcerer", "aberrant-mind", {
    1: lst("Arms of Hadar", "Dissonant Whispers", "Mind Sliver"),
    3: lst("Calm Emotions", "Detect Thoughts"),
    5: lst("Hunger of Hadar", "Sending"),
    7: lst("Evard's Black Tentacles", "Summon Aberration"),
    9: lst("Rary's Telepathic Bond", "Telekinesis"),
})
add("sorcerer", "clockwork-soul", {
    1: lst("Alarm", "Protection from Evil and Good"),
    3: lst("Aid", "Lesser Restoration"),
    5: lst("Dispel Magic", "Protection from Energy"),
    7: lst("Freedom of Movement", "Summon Construct"),
    9: lst("Bigby's Hand", "Planar Binding"),
})

# ── Druido: Cerchi che danno spell list (XGtE + TCoE) ──
# Cerchio della Terra: dipende dalla scelta del terreno, lasciato fuori per ora
add("druid", "circle-of-spores", {
    3: lst("Chill Touch", "Cause Fear", "Inflict Wounds"),
    5: lst("Blindness/Deafness", "Gentle Repose"),
    7: lst("Animate Dead", "Gaseous Form"),
    9: lst("Blight", "Confusion"),
    11: lst("Cloudkill", "Contagion"),
})
add("druid", "circle-of-wildfire", {
    2: lst("Burning Hands", "Cure Wounds"),
    3: lst("Flaming Sphere", "Scorching Ray"),
    5: lst("Plant Growth", "Revivify"),
    7: lst("Aura of Life", "Fire Shield"),
    9: lst("Flame Strike", "Mass Cure Wounds"),
})

# ── Ranger: Conclave spells (XGtE + TCoE + FToD) ──
add("ranger", "gloom-stalker", {
    3: lst("Disguise Self"),
    5: lst("Rope Trick"),
    9: lst("Fear"),
    13: lst("Greater Invisibility"),
    17: lst("Seeming"),
})
add("ranger", "horizon-walker", {
    3: lst("Protection from Evil and Good"),
    5: lst("Misty Step"),
    9: lst("Haste"),
    13: lst("Banishment"),
    17: lst("Teleport"),
})
add("ranger", "monster-slayer", {
    3: lst("Protection from Evil and Good"),
    5: lst("Zone of Truth"),
    9: lst("Magic Circle"),
    13: lst("Banishment"),
    17: lst("Hold Monster"),
})
add("ranger", "fey-wanderer", {
    3: lst("Charm Person"),
    5: lst("Misty Step"),
    9: lst("Plant Growth"),
    13: lst("Dominate Beast"),
    17: lst("Mislead"),
})
add("ranger", "swarmkeeper", {
    3: lst("Mage Hand", "Faerie Fire"),
    5: lst("Web"),
    9: lst("Gaseous Form"),
    13: lst("Arcane Eye"),
    17: lst("Insect Plague"),
})
add("ranger", "drakewarden", {
    3: lst("Command"),
    5: lst("Dragon's Breath"),
    9: lst("Speak with Plants"),
    13: lst("Locate Creature"),
    17: lst("Commune with Nature"),
})

# ── Artificer: Specialist spells (TCoE) ──
add("artificer", "alchemist", {
    3: lst("Healing Word", "Ray of Sickness"),
    5: lst("Flaming Sphere", "Melf's Acid Arrow"),
    9: lst("Gaseous Form", "Mass Healing Word"),
    13: lst("Blight", "Death Ward"),
    17: lst("Cloudkill", "Raise Dead"),
})
add("artificer", "armorer", {
    3: lst("Magic Missile", "Thunderwave"),
    5: lst("Mirror Image", "Shatter"),
    9: lst("Hypnotic Pattern", "Lightning Bolt"),
    13: lst("Fire Shield", "Greater Invisibility"),
    17: lst("Passwall", "Wall of Force"),
})
add("artificer", "artillerist", {
    3: lst("Shield", "Thunderwave"),
    5: lst("Scorching Ray", "Shatter"),
    9: lst("Fireball", "Wind Wall"),
    13: lst("Ice Storm", "Wall of Fire"),
    17: lst("Cone of Cold", "Wall of Force"),
})
add("artificer", "battle-smith", {
    3: lst("Heroism", "Shield"),
    5: lst("Branding Smite", "Warding Bond"),
    9: lst("Aura of Vitality", "Conjure Barrage"),
    13: lst("Aura of Purity", "Fire Shield"),
    17: lst("Banishing Smite", "Mass Cure Wounds"),
})


# ─────────────────────────────────────────────────────────────────────────
def main() -> int:
    total = 0
    for cls, subs in DATA.items():
        for sub, lvls in subs.items():
            for lvl, names in lvls.items():
                total += len(names)
    print(f"Sottoclassi configurate: {sum(len(v) for v in DATA.values())}")
    print(f"Voci totali: {total}")
    print(f"Spell mancanti unici: {len(_warned)}")

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(DATA, ensure_ascii=False, indent=2), encoding="utf-8")

    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text(
        "// Auto-generato da risorse/classi/build_subclass_spells.py - non modificare a mano\n"
        "window.SUBCLASS_SPELLS_DATA = " + json.dumps(DATA, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    print(f"Scritto: {OUT_JSON.relative_to(ROOT)}")
    print(f"Scritto: {OUT_JS.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
