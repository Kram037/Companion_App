"""
Costruisce il dataset locale delle Invocazioni Demoniache (Eldritch
Invocations) del Warlock.

Fonti incluse:
  - Player's Handbook (PHB)
  - Xanathar's Guide to Everything (XGtE)
  - Tasha's Cauldron of Everything (TCoE)

Per ogni invocazione abbiamo:
  id          slug stabile (es. "agonizing-blast")
  name        nome IT (es. "Deflagrazione Agonizzante")
  name_en     nome originale EN
  source      manuale (testo lungo)
  source_short fonte breve (PHB, XGtE, TCoE)
  prerequisites lista strutturata di prerequisiti:
      { type: "level", value: int }
      { type: "spell", value: "eldritch blast" }
      { type: "feature", value: "Pact of the Blade" }
      { type: "patron", value: "Hexblade" }
  description descrizione completa IT
  effect      tag effetto (es. "spell_at_will", "spell_per_long_rest",
              "skill_proficiency", "passive", "active") - usato dal client
              per conferire automaticamente competenze/spell quando applicabile.
  effect_data dati strutturati per l'auto-effect:
      - per "spell_at_will": {"spell_en": "...", "spell_it": "...", "level_cast": int}
      - per "spell_per_long_rest": idem
      - per "skill_proficiency": {"skills": ["Inganno", "Persuasione"]}

Output:
  - risorse/invocazioni/invocazioni.json
  - js/data/invocations_data.js  (window.INVOCATIONS_DATA)
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
SPELLS_JSON = ROOT / "risorse" / "incantesimi" / "spells.json"
OUT_JSON = ROOT / "risorse" / "invocazioni" / "invocazioni.json"
OUT_JS = ROOT / "js" / "data" / "invocations_data.js"

SPELLS = json.loads(SPELLS_JSON.read_text(encoding="utf-8"))
EN_TO_IT: dict[str, str] = {sp.get("name_en", ""): k for k, sp in SPELLS.items() if sp.get("name_en")}

# Override per incantesimi che il dataset spells.json non contiene (ancora).
# Mappiamo manualmente nome EN -> nome IT canonico in modo che gli slot
# invocazioni e la pagina degli incantesimi mostrino il nome italiano.
SPELL_IT_OVERRIDE: dict[str, str] = {
    "Speak with Animals": "Parlare con gli Animali",
    "Detect Magic": "Individuazione del Magico",
    "Water Breathing": "Respirare sott'Acqua",
    "Detect Thoughts": "Individuazione dei Pensieri",
    "Detect Evil and Good": "Individuazione del Male e del Bene",
    "Mage Hand": "Mano Magica",
    "Find Familiar": "Trova Famiglio",
    "Comprehend Languages": "Comprensione dei Linguaggi",
    "False Life": "Vita Falsata",
    "Identify": "Identificare",
    "Speak with Dead": "Parlare con i Morti",
    "Augury": "Augurio",
    "Tongues": "Linguaggi",
    "Sending": "Inviare Messaggio",
    "Arcane Eye": "Occhio Arcano",
    "Silent Image": "Immagine Silente",
    "Disguise Self": "Camuffare Se' Stesso",
    "Alter Self": "Alterare Se' Stesso",
    "Levitate": "Levitazione",
    "Jump": "Saltare",
    "Confusion": "Confusione",
    "Slow": "Rallentare",
    "Bestow Curse": "Scagliare Maledizione",
    "Polymorph": "Metamorfosi",
    "Hold Monster": "Bloccare Mostri",
    "Mage Armor": "Armatura Magica",
    "Animate Dead": "Animare Morti",
    "Compulsion": "Costrizione",
    "Conjure Elemental": "Convocare Elementale",
    "Hex": "Anatema",
    "Invisibility": "Invisibilita'",
    "Freedom of Movement": "Liberta' di Movimento",
}


def _slug(name: str) -> str:
    s = unicodedata.normalize("NFKD", name)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9]+", "-", s.lower())
    return s.strip("-")


def _resolve_spell_it(en: str) -> str | None:
    """Risolve il nome IT di un incantesimo EN: prima cerca in
    spells.json, poi negli override manuali."""
    it = EN_TO_IT.get(en)
    if it:
        return it
    return SPELL_IT_OVERRIDE.get(en)


INVOCATIONS: list[dict] = []


def _inv(*,
         name_it: str,
         name_en: str,
         source_short: str,
         description: str,
         prereqs: list[dict] | None = None,
         effect: str = "passive",
         effect_data: dict | None = None) -> None:
    src_long = {
        "PHB": "Player's Handbook",
        "XGtE": "Xanathar's Guide to Everything",
        "TCoE": "Tasha's Cauldron of Everything",
    }.get(source_short, source_short)
    inv = {
        "id": _slug(name_en),
        "name": name_it,
        "name_en": name_en,
        "source": src_long,
        "source_short": source_short,
        "prerequisites": prereqs or [],
        "description": description,
        "effect": effect,
        "effect_data": effect_data or {},
    }
    INVOCATIONS.append(inv)


# Helper per i prerequisiti
def L(level: int) -> dict: return {"type": "level", "value": level}
def SP(spell_en: str) -> dict:
    return {"type": "spell", "value": spell_en, "value_it": _resolve_spell_it(spell_en) or spell_en}
def F(feature: str) -> dict: return {"type": "feature", "value": feature}
def P(patron: str) -> dict: return {"type": "patron", "value": patron}
def HEX() -> dict: return {"type": "feature_or_curse", "value": "hex spell or warlock feature that curses"}


# ============================================================================
# PHB (Player's Handbook)
# ============================================================================
_inv(
    name_it="Deflagrazione Agonizzante",
    name_en="Agonizing Blast",
    source_short="PHB",
    prereqs=[SP("Eldritch Blast")],
    description="Quando lanci deflagrazione occulta, aggiungi il tuo modificatore di Carisma ai danni inflitti su un colpo a segno.",
    effect="modifies_eldritch_blast",
    effect_data={"add_cha_to_damage": True},
)

_inv(
    name_it="Armatura delle Ombre",
    name_en="Armor of Shadows",
    source_short="PHB",
    description="Puoi lanciare armatura magica su te stesso a volonta', senza spendere uno slot incantesimo o componenti materiali.",
    effect="spell_at_will",
    effect_data={"spell_en": "Mage Armor", "spell_it": _resolve_spell_it("Mage Armor"), "self_only": True, "level_cast": 1},
)

_inv(
    name_it="Passo Ascendente",
    name_en="Ascendant Step",
    source_short="PHB",
    prereqs=[L(9)],
    description="Puoi lanciare levitazione su te stesso a volonta', senza spendere uno slot incantesimo o componenti materiali.",
    effect="spell_at_will",
    effect_data={"spell_en": "Levitate", "spell_it": _resolve_spell_it("Levitate"), "self_only": True, "level_cast": 2},
)

_inv(
    name_it="Linguaggio delle Bestie",
    name_en="Beast Speech",
    source_short="PHB",
    description="Puoi lanciare parlare con gli animali a volonta', senza spendere uno slot incantesimo.",
    effect="spell_at_will",
    effect_data={"spell_en": "Speak with Animals", "spell_it": _resolve_spell_it("Speak with Animals"), "level_cast": 1},
)

_inv(
    name_it="Influenza Affascinante",
    name_en="Beguiling Influence",
    source_short="PHB",
    description="Ottieni competenza nelle abilita' Inganno e Persuasione.",
    effect="skill_proficiency",
    effect_data={"skills": ["Inganno", "Persuasione"]},
)

_inv(
    name_it="Sussurri Stregati",
    name_en="Bewitching Whispers",
    source_short="PHB",
    prereqs=[L(7)],
    description="Puoi lanciare costrizione una volta utilizzando uno slot incantesimo da warlock. Non puoi farlo di nuovo finche' non termini un riposo lungo.",
    effect="spell_per_long_rest",
    effect_data={"spell_en": "Compulsion", "spell_it": _resolve_spell_it("Compulsion"), "level_cast": 4},
)

_inv(
    name_it="Libro degli Antichi Segreti",
    name_en="Book of Ancient Secrets",
    source_short="PHB",
    prereqs=[F("Pact of the Tome")],
    description="Ora puoi inscrivere rituali magici nel tuo Libro delle Ombre. Scegli due incantesimi di 1 livello che possiedono il tag 'rituale' dalla lista incantesimi di qualsiasi classe (i due non devono provenire dalla stessa lista). Gli incantesimi appaiono nel libro e non vengono conteggiati nel numero di incantesimi che conosci. Con il tuo Libro delle Ombre in mano, puoi lanciare gli incantesimi scelti come rituali. Non puoi lanciarli se non come rituali, a meno che non li abbia imparati per altri mezzi. Puoi anche lanciare un incantesimo da warlock che conosci come rituale, se possiede il tag 'rituale'. Nelle tue avventure, puoi aggiungere altri incantesimi rituali al tuo Libro delle Ombre. Quando trovi un tale incantesimo, puoi aggiungerlo al libro se il livello dell'incantesimo e' uguale o inferiore alla meta' del tuo livello da warlock (arrotondato per eccesso) e se puoi spendere il tempo per trascriverlo. Per ogni livello dell'incantesimo, il processo di trascrizione richiede 2 ore e costa 50 mo per gli inchiostri rari necessari.",
    effect="passive",
)

_inv(
    name_it="Catene di Carceri",
    name_en="Chains of Carceri",
    source_short="PHB",
    prereqs=[L(15), F("Pact of the Chain")],
    description="Puoi lanciare blocca mostri a volonta' (mirando a un celestiale, immondo o elementale) senza spendere uno slot incantesimo o componenti materiali. Devi terminare un riposo lungo prima di poter usare questa invocazione di nuovo sulla stessa creatura.",
    effect="spell_at_will",
    effect_data={"spell_en": "Hold Monster", "spell_it": _resolve_spell_it("Hold Monster"), "level_cast": 5, "restrictions": "Solo celestiali, immondi o elementali; 1/lungo per creatura"},
)

_inv(
    name_it="Vista del Diavolo",
    name_en="Devil's Sight",
    source_short="PHB",
    description="Puoi vedere normalmente nell'oscurita', sia magica sia non magica, fino a una distanza di 36 metri.",
    effect="passive",
)

_inv(
    name_it="Parola Spaventevole",
    name_en="Dreadful Word",
    source_short="PHB",
    prereqs=[L(7)],
    description="Puoi lanciare confusione una volta utilizzando uno slot incantesimo da warlock. Non puoi farlo di nuovo finche' non termini un riposo lungo.",
    effect="spell_per_long_rest",
    effect_data={"spell_en": "Confusion", "spell_it": _resolve_spell_it("Confusion"), "level_cast": 4},
)

_inv(
    name_it="Vista Occulta",
    name_en="Eldritch Sight",
    source_short="PHB",
    description="Puoi lanciare individuazione del magico a volonta', senza spendere uno slot incantesimo.",
    effect="spell_at_will",
    effect_data={"spell_en": "Detect Magic", "spell_it": _resolve_spell_it("Detect Magic"), "level_cast": 1},
)

_inv(
    name_it="Lancia Occulta",
    name_en="Eldritch Spear",
    source_short="PHB",
    prereqs=[SP("Eldritch Blast")],
    description="Quando lanci deflagrazione occulta, la sua gittata e' di 90 metri.",
    effect="modifies_eldritch_blast",
    effect_data={"range_ft": 300},
)

_inv(
    name_it="Occhi del Custode delle Rune",
    name_en="Eyes of the Rune Keeper",
    source_short="PHB",
    description="Puoi leggere qualsiasi tipo di scrittura.",
    effect="passive",
)

_inv(
    name_it="Vigore Demoniaco",
    name_en="Fiendish Vigor",
    source_short="PHB",
    description="Puoi lanciare vita illusoria su te stesso a volonta' come incantesimo di 1 livello, senza spendere uno slot incantesimo o componenti materiali.",
    effect="spell_at_will",
    effect_data={"spell_en": "False Life", "spell_it": _resolve_spell_it("False Life"), "self_only": True, "level_cast": 1},
)

_inv(
    name_it="Sguardo delle Due Menti",
    name_en="Gaze of Two Minds",
    source_short="PHB",
    description="Puoi usare la tua azione per toccare un umanoide consenziente e percepire attraverso i suoi sensi fino alla fine del tuo prossimo turno. Finche' la creatura si trova sullo stesso piano di esistenza, puoi usare la tua azione nei turni successivi per mantenere questa connessione, estendendone la durata fino alla fine del tuo prossimo turno. Mentre percepisci attraverso i sensi dell'altra creatura, benefici di qualsiasi senso speciale posseduto da quella creatura, e sei accecato e assordato per quanto riguarda l'ambiente che ti circonda.",
    effect="active",
)

_inv(
    name_it="Maschera dei Mille Volti",
    name_en="Mask of Many Faces",
    source_short="PHB",
    description="Puoi lanciare camuffare se' stesso a volonta', senza spendere uno slot incantesimo.",
    effect="spell_at_will",
    effect_data={"spell_en": "Disguise Self", "spell_it": _resolve_spell_it("Disguise Self"), "level_cast": 1},
)

_inv(
    name_it="Maestro delle Forme Multiple",
    name_en="Master of Myriad Forms",
    source_short="PHB",
    prereqs=[L(15)],
    description="Puoi lanciare alterare se' stesso a volonta', senza spendere uno slot incantesimo.",
    effect="spell_at_will",
    effect_data={"spell_en": "Alter Self", "spell_it": _resolve_spell_it("Alter Self"), "self_only": True, "level_cast": 2},
)

_inv(
    name_it="Servitori del Caos",
    name_en="Minions of Chaos",
    source_short="PHB",
    prereqs=[L(9)],
    description="Puoi lanciare evocare elementale una volta utilizzando uno slot incantesimo da warlock. Non puoi farlo di nuovo finche' non termini un riposo lungo.",
    effect="spell_per_long_rest",
    effect_data={"spell_en": "Conjure Elemental", "spell_it": _resolve_spell_it("Conjure Elemental"), "level_cast": 5},
)

_inv(
    name_it="Mira Confusa",
    name_en="Mire the Mind",
    source_short="PHB",
    prereqs=[L(5)],
    description="Puoi lanciare lentezza una volta utilizzando uno slot incantesimo da warlock. Non puoi farlo di nuovo finche' non termini un riposo lungo.",
    effect="spell_per_long_rest",
    effect_data={"spell_en": "Slow", "spell_it": _resolve_spell_it("Slow"), "level_cast": 3},
)

_inv(
    name_it="Visioni Nebbiose",
    name_en="Misty Visions",
    source_short="PHB",
    description="Puoi lanciare immagine silenziosa a volonta', senza spendere uno slot incantesimo o componenti materiali.",
    effect="spell_at_will",
    effect_data={"spell_en": "Silent Image", "spell_it": _resolve_spell_it("Silent Image"), "level_cast": 1},
)

_inv(
    name_it="Tutt'Uno con le Ombre",
    name_en="One with Shadows",
    source_short="PHB",
    prereqs=[L(5)],
    description="Quando ti trovi in un'area di luce fioca o oscurita', puoi usare la tua azione per diventare invisibile finche' ti muovi o effettui un'azione o una reazione.",
    effect="active",
)

_inv(
    name_it="Salto Ultraterreno",
    name_en="Otherworldly Leap",
    source_short="PHB",
    prereqs=[L(9)],
    description="Puoi lanciare salto su te stesso a volonta', senza spendere uno slot incantesimo o componenti materiali.",
    effect="spell_at_will",
    effect_data={"spell_en": "Jump", "spell_it": _resolve_spell_it("Jump"), "self_only": True, "level_cast": 1},
)

_inv(
    name_it="Deflagrazione Repulsiva",
    name_en="Repelling Blast",
    source_short="PHB",
    prereqs=[SP("Eldritch Blast")],
    description="Quando colpisci una creatura con deflagrazione occulta, puoi spingerla fino a 3 metri lontano da te in linea retta.",
    effect="modifies_eldritch_blast",
    effect_data={"push_ft": 10},
)

_inv(
    name_it="Scultore di Carne",
    name_en="Sculptor of Flesh",
    source_short="PHB",
    prereqs=[L(7)],
    description="Puoi lanciare metamorfosi una volta utilizzando uno slot incantesimo da warlock. Non puoi farlo di nuovo finche' non termini un riposo lungo.",
    effect="spell_per_long_rest",
    effect_data={"spell_en": "Polymorph", "spell_it": _resolve_spell_it("Polymorph"), "level_cast": 4},
)

_inv(
    name_it="Segno del Cattivo Auspicio",
    name_en="Sign of Ill Omen",
    source_short="PHB",
    prereqs=[L(5)],
    description="Puoi lanciare infliggere maledizione una volta utilizzando uno slot incantesimo da warlock. Non puoi farlo di nuovo finche' non termini un riposo lungo.",
    effect="spell_per_long_rest",
    effect_data={"spell_en": "Bestow Curse", "spell_it": _resolve_spell_it("Bestow Curse"), "level_cast": 3},
)

_inv(
    name_it="Ladro di Cinque Fati",
    name_en="Thief of Five Fates",
    source_short="PHB",
    description="Puoi lanciare anatema una volta utilizzando uno slot incantesimo da warlock. Non puoi farlo di nuovo finche' non termini un riposo lungo.",
    effect="spell_per_long_rest",
    effect_data={"spell_en": "Bane", "spell_it": _resolve_spell_it("Bane"), "level_cast": 1},
)

_inv(
    name_it="Lama Assetata",
    name_en="Thirsting Blade",
    source_short="PHB",
    prereqs=[L(5), F("Pact of the Blade")],
    description="Puoi attaccare con la tua arma del patto due volte, invece di una, ogni volta che effettui l'azione di Attacco nel tuo turno.",
    effect="passive",
    effect_data={"extra_attack": True},
)

_inv(
    name_it="Bevitrice di Vita",
    name_en="Lifedrinker",
    source_short="PHB",
    prereqs=[L(12), F("Pact of the Blade")],
    description="Quando colpisci una creatura con la tua arma del patto, la creatura subisce danni necrotici extra pari al tuo modificatore di Carisma (minimo 1).",
    effect="passive",
    effect_data={"pact_weapon_extra_damage": "cha", "damage_type": "necrotici"},
)

_inv(
    name_it="Voce del Maestro della Catena",
    name_en="Voice of the Chain Master",
    source_short="PHB",
    prereqs=[F("Pact of the Chain")],
    description="Puoi comunicare telepaticamente con il tuo famiglio e percepire attraverso i suoi sensi finche' siete sullo stesso piano di esistenza. Inoltre, mentre percepisci attraverso i sensi del famiglio, puoi anche parlare attraverso il famiglio con la tua stessa voce, anche se il famiglio normalmente non e' in grado di parlare.",
    effect="passive",
)

_inv(
    name_it="Sussurri della Tomba",
    name_en="Whispers of the Grave",
    source_short="PHB",
    prereqs=[L(9)],
    description="Puoi lanciare parlare con i morti a volonta', senza spendere uno slot incantesimo.",
    effect="spell_at_will",
    effect_data={"spell_en": "Speak with Dead", "spell_it": _resolve_spell_it("Speak with Dead"), "level_cast": 3},
)

_inv(
    name_it="Visioni di Reami Distanti",
    name_en="Visions of Distant Realms",
    source_short="PHB",
    prereqs=[L(15)],
    description="Puoi lanciare occhio arcano a volonta', senza spendere uno slot incantesimo.",
    effect="spell_at_will",
    effect_data={"spell_en": "Arcane Eye", "spell_it": _resolve_spell_it("Arcane Eye"), "level_cast": 4},
)

_inv(
    name_it="Vista delle Streghe",
    name_en="Witch Sight",
    source_short="PHB",
    prereqs=[L(15)],
    description="Puoi vedere la vera forma di qualsiasi mutaforma o creatura nascosta da magia di illusione o trasmutazione, finche' la creatura si trova entro 9 metri da te ed entro la tua linea di vista.",
    effect="passive",
)

# ============================================================================
# XGtE (Xanathar's Guide to Everything)
# ============================================================================
_inv(
    name_it="Aspetto della Luna",
    name_en="Aspect of the Moon",
    source_short="XGtE",
    prereqs=[F("Pact of the Tome")],
    description="Non hai piu' bisogno di dormire e non puoi essere costretto a dormire con alcun mezzo. Per ottenere i benefici di un riposo lungo puoi spendere tutte e 8 le ore in attivita' leggera, come leggere il tuo Libro delle Ombre o stare di guardia.",
    effect="passive",
)

_inv(
    name_it="Mantello di Mosche",
    name_en="Cloak of Flies",
    source_short="XGtE",
    prereqs=[L(5)],
    description="Come azione bonus, puoi circondarti di un'aura magica simile a un nugolo di mosche ronzanti. L'aura si estende per 1,5 metri intorno a te in ogni direzione, ma non oltre la copertura totale. Dura finche' diventi inabile o la dissolvi come azione bonus. L'aura ti garantisce vantaggio alle prove di Carisma (Intimidire), ma svantaggio a tutte le altre prove di Carisma. Qualsiasi altra creatura che inizia il turno nell'aura subisce danni da veleno pari al tuo modificatore di Carisma (minimo 0). Una volta usata questa invocazione, non puoi usarla di nuovo finche' non termini un riposo breve o lungo.",
    effect="active",
    effect_data={"recharge": "short_rest"},
)

_inv(
    name_it="Smite Occulto",
    name_en="Eldritch Smite",
    source_short="XGtE",
    prereqs=[L(5), F("Pact of the Blade")],
    description="Una volta per turno, quando colpisci una creatura con la tua arma del patto, puoi spendere uno slot incantesimo da warlock per infliggere 1d8 danni da forza extra al bersaglio, piu' altri 1d8 per livello dello slot incantesimo, e puoi mettere prono il bersaglio se e' di taglia Enorme o piu' piccola.",
    effect="passive",
)

_inv(
    name_it="Sguardo Spettrale",
    name_en="Ghostly Gaze",
    source_short="XGtE",
    prereqs=[L(7)],
    description="Come azione, ottieni la capacita' di vedere attraverso oggetti solidi fino a una distanza di 9 metri. Entro questa distanza, hai scurovisione se non ce l'hai gia'. Questa visione speciale dura 1 minuto o finche' la tua concentrazione termina (come se ti stessi concentrando su un incantesimo). Durante questo tempo, percepisci gli oggetti come immagini spettrali e trasparenti. Una volta usata questa invocazione, non puoi usarla di nuovo finche' non termini un riposo breve o lungo.",
    effect="active",
    effect_data={"recharge": "short_rest"},
)

_inv(
    name_it="Dono delle Profondita'",
    name_en="Gift of the Depths",
    source_short="XGtE",
    prereqs=[L(5)],
    description="Puoi respirare sott'acqua e ottieni una velocita' di nuoto pari alla tua velocita' di camminata. Puoi anche lanciare respirare sott'acqua senza spendere uno slot incantesimo. Recuperi la capacita' di farlo quando termini un riposo lungo.",
    effect="spell_per_long_rest",
    effect_data={"spell_en": "Water Breathing", "spell_it": _resolve_spell_it("Water Breathing"), "level_cast": 3, "passive_extra": "Respirazione subacquea + nuoto = velocita' camminata"},
)

_inv(
    name_it="Dono dei Vivi Eterni",
    name_en="Gift of the Ever-Living Ones",
    source_short="XGtE",
    prereqs=[F("Pact of the Chain")],
    description="Ogni volta che recuperi punti ferita mentre il tuo famiglio si trova entro 30 metri da te, considera tutti i dadi tirati per determinare i punti ferita recuperati come se avessero ottenuto il loro valore massimo.",
    effect="passive",
)

_inv(
    name_it="Presa di Hadar",
    name_en="Grasp of Hadar",
    source_short="XGtE",
    prereqs=[SP("Eldritch Blast")],
    description="Una volta in ognuno dei tuoi turni, quando colpisci una creatura con la tua deflagrazione occulta, puoi muovere quella creatura in linea retta di 3 metri piu' vicino a te.",
    effect="modifies_eldritch_blast",
    effect_data={"pull_ft": 10},
)

_inv(
    name_it="Arma del Patto Migliorata",
    name_en="Improved Pact Weapon",
    source_short="XGtE",
    prereqs=[F("Pact of the Blade")],
    description="Puoi usare qualsiasi arma evochi con la tua capacita' Patto della Lama come focus per gli incantesimi da warlock. Inoltre, l'arma ottiene un bonus di +1 ai tiri per colpire e ai danni, a meno che non sia un'arma magica che ha gia' un bonus a tali tiri. Infine, l'arma che evochi puo' essere un arco corto, un arco lungo, una balestra leggera o una balestra pesante.",
    effect="passive",
)

_inv(
    name_it="Lancia di Letargia",
    name_en="Lance of Lethargy",
    source_short="XGtE",
    prereqs=[SP("Eldritch Blast")],
    description="Una volta in ognuno dei tuoi turni, quando colpisci una creatura con la tua deflagrazione occulta, puoi ridurre la velocita' di quella creatura di 3 metri fino alla fine del tuo prossimo turno.",
    effect="modifies_eldritch_blast",
    effect_data={"slow_ft": 10},
)

_inv(
    name_it="Maledizione Folle",
    name_en="Maddening Hex",
    source_short="XGtE",
    prereqs=[L(5), HEX()],
    description="Come azione bonus, provochi un disturbo psichico attorno al bersaglio maledetto dal tuo incantesimo maledizione o da un privilegio da warlock, come Maledizione del Hexblade e Segno del Cattivo Auspicio. Quando lo fai, infliggi danni psichici al bersaglio maledetto e a ciascuna creatura a tua scelta entro 1,5 metri da esso. I danni psichici sono pari al tuo modificatore di Carisma (minimo 1 danno). Per usare questa invocazione, devi essere in grado di vedere il bersaglio maledetto, e questi deve trovarsi entro 9 metri da te.",
    effect="active",
)

_inv(
    name_it="Maledizione Implacabile",
    name_en="Relentless Hex",
    source_short="XGtE",
    prereqs=[L(7), HEX()],
    description="La tua maledizione crea un legame temporaneo tra te e il bersaglio. Come azione bonus, puoi teletrasportarti magicamente fino a 9 metri in uno spazio non occupato che puoi vedere entro 1,5 metri dal bersaglio maledetto dal tuo incantesimo maledizione o da un privilegio da warlock, come Maledizione del Hexblade o Segno del Cattivo Auspicio. Per teletrasportarti in questo modo devi essere in grado di vedere il bersaglio maledetto.",
    effect="active",
)

_inv(
    name_it="Manto di Ombre",
    name_en="Shroud of Shadow",
    source_short="XGtE",
    prereqs=[L(15)],
    description="Puoi lanciare invisibilita' a volonta', senza spendere uno slot incantesimo.",
    effect="spell_at_will",
    effect_data={"spell_en": "Invisibility", "spell_it": _resolve_spell_it("Invisibility"), "level_cast": 2},
)

_inv(
    name_it="Tomba di Levistus",
    name_en="Tomb of Levistus",
    source_short="XGtE",
    prereqs=[L(5)],
    description="Come reazione quando subisci danni, puoi avvolgerti nel ghiaccio, che si scioglie alla fine del tuo prossimo turno. Ottieni 10 punti ferita temporanei per livello da warlock, che assorbono il piu' possibile dei danni del trigger. Subito dopo aver subito i danni, ottieni vulnerabilita' al fuoco, la tua velocita' e' ridotta a 0 e sei inabile. Questi effetti, inclusi gli eventuali punti ferita temporanei restanti, terminano tutti quando il ghiaccio si scioglie. Una volta usata questa invocazione, non puoi usarla di nuovo finche' non termini un riposo breve o lungo.",
    effect="active",
    effect_data={"recharge": "short_rest"},
)

_inv(
    name_it="Fuga del Ladro",
    name_en="Trickster's Escape",
    source_short="XGtE",
    prereqs=[L(7)],
    description="Puoi lanciare liberta' di movimento su te stesso senza spendere uno slot incantesimo. Recuperi la capacita' di farlo quando termini un riposo lungo.",
    effect="spell_per_long_rest",
    effect_data={"spell_en": "Freedom of Movement", "spell_it": _resolve_spell_it("Freedom of Movement"), "self_only": True, "level_cast": 4},
)

# ============================================================================
# TCoE (Tasha's Cauldron of Everything)
# ============================================================================
_inv(
    name_it="Legame del Talismano",
    name_en="Bond of the Talisman",
    source_short="TCoE",
    prereqs=[L(12), F("Pact of the Talisman")],
    description="Mentre qualcun altro indossa il tuo talismano, puoi usare la tua azione per teletrasportarti nello spazio non occupato piu' vicino a quella persona, a patto che voi due siate sullo stesso piano di esistenza. Chi indossa il talismano puo' fare lo stesso, usando la sua azione per teletrasportarsi da te. Il teletrasporto puo' essere usato un numero di volte pari al tuo bonus di competenza, e tutti gli usi spesi vengono recuperati quando termini un riposo lungo.",
    effect="active",
    effect_data={"recharge": "long_rest", "uses": "prof_bonus"},
)

_inv(
    name_it="Mente Occulta",
    name_en="Eldritch Mind",
    source_short="TCoE",
    description="Hai vantaggio ai tiri salvezza su Costituzione che effettui per mantenere la concentrazione su un incantesimo.",
    effect="passive",
)

_inv(
    name_it="Scriba a Distanza",
    name_en="Far Scribe",
    source_short="TCoE",
    prereqs=[L(5), F("Pact of the Tome")],
    description="Una nuova pagina appare nel tuo Libro delle Ombre. Con il tuo permesso, una creatura puo' usare la sua azione per scrivere il proprio nome su quella pagina, che puo' contenere un numero di nomi pari al tuo bonus di competenza. Puoi lanciare l'incantesimo messaggio a distanza, mirando a una creatura il cui nome e' sulla pagina, senza usare uno slot incantesimo e senza usare componenti materiali. Per farlo, devi scrivere il messaggio sulla pagina. Il bersaglio sente il messaggio nella sua mente, e se risponde, il suo messaggio appare sulla pagina, anziche' nella tua mente. La scrittura sparisce dopo 1 minuto. Come azione, puoi cancellare magicamente un nome dalla pagina toccandolo.",
    effect="spell_at_will",
    effect_data={"spell_en": "Sending", "spell_it": _resolve_spell_it("Sending"), "level_cast": 3, "restrictions": "Solo a creature scritte sulla pagina del Libro delle Ombre"},
)

_inv(
    name_it="Dono dei Protettori",
    name_en="Gift of the Protectors",
    source_short="TCoE",
    prereqs=[L(9), F("Pact of the Tome")],
    description="Una nuova pagina appare nel tuo Libro delle Ombre. Con il tuo permesso, una creatura puo' usare la sua azione per scrivere il proprio nome su quella pagina, che puo' contenere un numero di nomi pari al tuo bonus di competenza. Quando una creatura il cui nome e' sulla pagina viene ridotta a 0 punti ferita ma non uccisa sul colpo, la creatura viene magicamente portata a 1 punto ferita. Una volta scattata questa magia, nessuna creatura puo' beneficiarne finche' non termini un riposo lungo. Come azione, puoi cancellare magicamente un nome dalla pagina toccandolo.",
    effect="active",
    effect_data={"recharge": "long_rest"},
)

_inv(
    name_it="Investitura del Maestro della Catena",
    name_en="Investment of the Chain Master",
    source_short="TCoE",
    prereqs=[F("Pact of the Chain")],
    description="Quando lanci trovare famiglio, infondi il famiglio evocato con una parte del tuo potere occulto, conferendo alla creatura i seguenti benefici: il famiglio ottiene una velocita' di volo o di nuoto (a tua scelta) di 12 metri; come azione bonus, puoi comandare al famiglio di effettuare l'azione di Attacco; gli attacchi con armi del famiglio sono considerati magici per superare immunita' e resistenze ai danni non magici; se il famiglio costringe una creatura a effettuare un tiro salvezza, usa la tua CD incantesimi; quando il famiglio subisce danni, puoi usare la tua reazione per concedergli resistenza a quei danni.",
    effect="passive",
)

_inv(
    name_it="Protezione del Talismano",
    name_en="Protection of the Talisman",
    source_short="TCoE",
    prereqs=[L(7), F("Pact of the Talisman")],
    description="Quando chi indossa il tuo talismano fallisce un tiro salvezza, puo' aggiungere 1d4 al risultato, potenzialmente trasformando il fallimento in un successo. Questo beneficio puo' essere usato un numero di volte pari al tuo bonus di competenza, e tutti gli usi spesi vengono recuperati quando termini un riposo lungo.",
    effect="passive",
    effect_data={"recharge": "long_rest", "uses": "prof_bonus"},
)

_inv(
    name_it="Rappresaglia del Talismano",
    name_en="Rebuke of the Talisman",
    source_short="TCoE",
    prereqs=[F("Pact of the Talisman")],
    description="Quando chi indossa il tuo talismano viene colpito da un attaccante che puoi vedere entro 9 metri da te, puoi usare la tua reazione per infliggere all'attaccante danni psichici pari al tuo bonus di competenza e spingerlo fino a 3 metri lontano da chi indossa il talismano.",
    effect="active",
)

_inv(
    name_it="Servitu' Non-Morta",
    name_en="Undying Servitude",
    source_short="TCoE",
    prereqs=[L(5)],
    description="Puoi lanciare animare morti senza usare uno slot incantesimo. Una volta fatto, non puoi lanciarlo in questo modo di nuovo finche' non termini un riposo lungo.",
    effect="spell_per_long_rest",
    effect_data={"spell_en": "Animate Dead", "spell_it": _resolve_spell_it("Animate Dead"), "level_cast": 3},
)


# ============================================================================
def main() -> int:
    INVOCATIONS.sort(key=lambda i: i["name"].lower())
    print(f"Invocazioni totali: {len(INVOCATIONS)}")
    by_src = {}
    for inv in INVOCATIONS:
        by_src.setdefault(inv["source_short"], 0)
        by_src[inv["source_short"]] += 1
    for s, n in sorted(by_src.items()):
        print(f"  {s}: {n}")

    # Warning per spell IT mancanti
    missing = []
    for inv in INVOCATIONS:
        d = inv.get("effect_data", {})
        if "spell_en" in d and not d.get("spell_it"):
            missing.append((inv["name_en"], d["spell_en"]))
    if missing:
        print(f"\n! Spell IT non trovati nel dataset (verifica spells.json):")
        for inv_name, sp_en in missing:
            print(f"  - {inv_name}: {sp_en}")

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(INVOCATIONS, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text(
        "// Auto-generato da risorse/invocazioni/build_invocations.py - non modificare a mano\n"
        "window.INVOCATIONS_DATA = " + json.dumps(INVOCATIONS, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    print(f"\nScritto: {OUT_JSON.relative_to(ROOT)}")
    print(f"Scritto: {OUT_JS.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
