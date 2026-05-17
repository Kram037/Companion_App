// ============================================================================
// CHARACTER SHEET DATA AND RESOURCE HELPERS
// ============================================================================

const SCHEDA_ABILITIES = [
    { key: 'forza', label: 'FOR', full: 'Forza' },
    { key: 'destrezza', label: 'DES', full: 'Destrezza' },
    { key: 'costituzione', label: 'COS', full: 'Costituzione' },
    { key: 'intelligenza', label: 'INT', full: 'Intelligenza' },
    { key: 'saggezza', label: 'SAG', full: 'Saggezza' },
    { key: 'carisma', label: 'CAR', full: 'Carisma' }
];

const SCHEDA_SKILLS = [
    { key: 'acrobazia', label: 'Acrobazia', ability: 'destrezza' },
    { key: 'addestrare_animali', label: 'Addestrare Animali', ability: 'saggezza' },
    { key: 'arcano', label: 'Arcano', ability: 'intelligenza' },
    { key: 'atletica', label: 'Atletica', ability: 'forza' },
    { key: 'furtivita', label: 'Furtività', ability: 'destrezza' },
    { key: 'indagare', label: 'Indagare', ability: 'intelligenza' },
    { key: 'inganno', label: 'Inganno', ability: 'carisma' },
    { key: 'intimidire', label: 'Intimidire', ability: 'carisma' },
    { key: 'intrattenere', label: 'Intrattenere', ability: 'carisma' },
    { key: 'intuizione', label: 'Intuizione', ability: 'saggezza' },
    { key: 'medicina', label: 'Medicina', ability: 'saggezza' },
    { key: 'natura', label: 'Natura', ability: 'intelligenza' },
    { key: 'percezione', label: 'Percezione', ability: 'saggezza' },
    { key: 'persuasione', label: 'Persuasione', ability: 'carisma' },
    { key: 'rapidita_di_mano', label: 'Rapidità di Mano', ability: 'destrezza' },
    { key: 'religione', label: 'Religione', ability: 'intelligenza' },
    { key: 'sopravvivenza', label: 'Sopravvivenza', ability: 'saggezza' },
    { key: 'storia', label: 'Storia', ability: 'intelligenza' }
];

const CLASS_RESOURCES = {
    'Artefice': [
        { nome: 'Invenzione Magica', usaMod: 'intelligenza', fromLevel: 1 },
        { nome: 'Infondere negli Oggetti', perLivello: [0,0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6], fromLevel: 2 },
        { nome: 'Lampo di Genio', usaMod: 'intelligenza', fromLevel: 7 }
    ],
    'Barbaro': [
        { nome: 'Ire', perLivello: [0,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5,6,6,6,6,99], fromLevel: 1 }
    ],
    'Bardo': [
        { nome: 'Ispirazioni Bardiche', usaMod: 'carisma', fromLevel: 1 }
    ],
    'Chierico': [
        { nome: 'Incanalare Divinità', perLivello: [0,0,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3], fromLevel: 2 }
    ],
    'Druido': [
        { nome: 'Forma Selvatica', perLivello: [0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2], fromLevel: 2 }
    ],
    'Guerriero': [
        { nome: 'Recuperare Energie', perLivello: [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], fromLevel: 1 },
        { nome: 'Azione Impetuosa', perLivello: [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2], fromLevel: 2 },
        { nome: 'Indomito', perLivello: [0,0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3], fromLevel: 9 }
    ],
    'Monaco': [
        { nome: 'Punti Ki', perLivello: [0,0,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], fromLevel: 2 }
    ],
    'Paladino': [
        { nome: 'Imposizione delle Mani', hpPool: true, fromLevel: 1 },
        { nome: 'Incanalare Divinità', perLivello: [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], fromLevel: 3 }
    ],
    'Stregone': [
        { nome: 'Punti Stregoneria', perLivello: [0,0,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], fromLevel: 2 }
    ],
    // Warlock: gli "Slot del Patto" sono gestiti come slot incantesimo nella
    // pagina Incantesimi (non come risorsa di classe), per evitare duplicazione.
};

// ─────────────────────────────────────────────────────────────────────────
// SUBCLASS_RESOURCES: risorse consumabili specifiche di sottoclasse.
// Mappa subclassSlug -> array di risorse, ognuna con:
//   nome           etichetta IT
//   fromLevel      livello minimo nella classe da cui appare
//   tipo (opt)     'counter' (default), 'portent', 'dice_pool'
//   perLivello?    array indicizzato dal livello (max in base al livello classe)
//   max?           numero fisso o 'prof_bonus' o 'usaMod:<carat>'
//   usaMod?        nome caratteristica per max = mod min 1 (es. 'intelligenza')
//   minMod         min per usaMod (default 1)
//   recharge?      'long_rest' | 'short_rest' | 'short_or_long' | ...
//   dado?          es. 'd6' (per dice_pool, viene mostrato come info)
//   dadoPerLivello? array di dadi (per dice_pool che scala)
//   note?          breve nota visualizzata accanto
// ─────────────────────────────────────────────────────────────────────────
const SUBCLASS_RESOURCES = {
    // ── MAGO ───────────────────────────────────────────────────────────
    'school-of-divination': [
        { nome: 'Portento', tipo: 'portent', perLivello: [0,0,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3], fromLevel: 2, recharge: 'long_rest' },
    ],
    'school-of-abjuration': [
        { nome: 'Distorsione Arcana', tipo: 'ward_pool', fromLevel: 2, recharge: 'long_rest' },
    ],
    'war-magic': [
        { nome: 'Sovraccarico Magico', usaMod: 'intelligenza', minMod: 1, fromLevel: 2, recharge: 'long_rest', note: 'recupera 1 al r. lungo, +1 a critico/TS riuscito' },
    ],
    'bladesinging': [
        { nome: 'Canto della Lama', max: 'prof_bonus', fromLevel: 2, recharge: 'short_or_long' },
    ],
    'chronurgy-magic': [
        { nome: 'Spostamento Cronologico', max: 2, fromLevel: 2, recharge: 'long_rest' },
        { nome: 'Anello Temporale', max: 1, fromLevel: 14, recharge: 'long_rest' },
    ],
    'graviturgy-magic': [
        { nome: 'Regolare Densità', max: 'prof_bonus', fromLevel: 2, recharge: 'long_rest' },
    ],
    'order-of-scribes': [
        { nome: 'Mente Manifesta', max: 'prof_bonus', fromLevel: 2, recharge: 'long_rest' },
    ],

    // ── LADRO ──────────────────────────────────────────────────────────
    'soulknife': [
        { nome: 'Dadi di Energia Psionica',
          tipo: 'dice_pool',
          perLivello: [0,0,0,4,4,6,6,6,6,6,6,8,8,8,8,8,8,12,12,12,12],
          dadoPerLivello: ['d6','d6','d6','d6','d6','d8','d8','d8','d8','d8','d8','d10','d10','d10','d10','d10','d10','d12','d12','d12','d12'],
          fromLevel: 3, recharge: 'long_rest_or_bonus' },
    ],
    'phantom': [
        { nome: 'Lamenti dalla Tomba', max: 'prof_bonus', fromLevel: 9, recharge: 'long_rest' },
    ],

    // ── COMBATTENTE ────────────────────────────────────────────────────
    'battle-master': [
        { nome: 'Dadi di Superiorità',
          tipo: 'dice_pool',
          perLivello: [0,0,0,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6],
          dadoPerLivello: ['d8','d8','d8','d8','d8','d8','d8','d8','d8','d10','d10','d10','d10','d10','d10','d10','d10','d12','d12','d12','d12'],
          fromLevel: 3, recharge: 'short_or_long' },
    ],
    'psi-warrior': [
        { nome: 'Dadi di Energia Psionica',
          tipo: 'dice_pool',
          perLivello: [0,0,0,4,4,6,6,6,6,6,6,8,8,8,8,8,8,12,12,12,12],
          dadoPerLivello: ['d6','d6','d6','d6','d6','d8','d8','d8','d8','d8','d8','d10','d10','d10','d10','d10','d10','d12','d12','d12','d12'],
          fromLevel: 3, recharge: 'long_rest_or_bonus' },
    ],
    'echo-knight': [
        { nome: 'Liberare l\'Incarnazione', max: 'prof_bonus', fromLevel: 3, recharge: 'long_rest' },
    ],
    'samurai': [
        { nome: 'Spirito Combattivo', max: 3, fromLevel: 3, recharge: 'long_rest', note: 'usi recuperano al r. lungo' },
    ],
    'arcane-archer': [
        { nome: 'Tiri Arcani', perLivello: [0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2], fromLevel: 3, recharge: 'short_or_long' },
    ],
    'banneret': [
        { nome: 'Carica Ispiratrice', perLivello: [0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2], fromLevel: 7, recharge: 'short_or_long' },
    ],
    'rune-knight': [
        { nome: 'Forma del Gigante', max: 'prof_bonus', fromLevel: 3, recharge: 'short_or_long' },
    ],
    'gunslinger': [
        { nome: 'Grinta', usaMod: 'saggezza', minMod: 1, fromLevel: 3, recharge: 'short_or_long' },
    ],

    // ── BARBARO ───────────────────────────────────────────────────────
    'path-of-the-zealot': [
        { nome: 'Presenza Fanatica', max: 1, fromLevel: 10, recharge: 'long_rest' },
    ],
    'path-of-wild-magic': [
        { nome: 'Magia Selvaggia (Riserva di Cariche)', max: 'prof_bonus', fromLevel: 6, recharge: 'long_rest', note: 'cariche di Magia Cumulativa' },
    ],
    'path-of-the-storm-herald': [
        // Storm Aura usa Rage; nessuna risorsa daily aggiuntiva.
    ],
    'path-of-the-ancestral-guardian': [
        // Spirit Shield usa la reazione mentre infuriato; niente daily.
    ],

    // ── DRUIDO (oltre a Forma Selvatica/Wild Shape) ───────────────────
    'circle-of-the-land': [
        { nome: 'Recupero Naturale', max: 1, fromLevel: 2, recharge: 'long_rest', note: 'recupera slot a riposo breve' },
    ],
    'circle-of-dreams': [
        { nome: 'Balsamo della Corte Estiva',
          tipo: 'dice_pool',
          perLivelloCalc: 'druid_level_d6',
          dado: 'd6',
          fromLevel: 2, recharge: 'long_rest', note: 'dadi = livello da Druido' },
    ],
    'circle-of-stars': [
        { nome: 'Presagio Cosmico', max: 'prof_bonus', fromLevel: 10, recharge: 'long_rest' },
    ],
    'circle-of-the-shepherd': [
        { nome: "Spirito del Difensore", max: 1, fromLevel: 14, recharge: 'long_rest', note: 'rinasce 1/giorno' },
    ],

    // ── CHIERICO ───────────────────────────────────────────────────────
    // La maggior parte delle opzioni di sottoclasse usa Channel Divinity
    // (gestito a livello classe). Ma alcuni domini hanno altre risorse.
    'tempest-domain': [
        { nome: 'Ira della Tempesta', usaMod: 'saggezza', minMod: 1, fromLevel: 1, recharge: 'long_rest' },
    ],
    'war-domain': [
        { nome: 'Sacerdote di Guerra', usaMod: 'saggezza', minMod: 1, fromLevel: 1, recharge: 'long_rest' },
    ],
    'knowledge-domain': [
        { nome: 'Visioni del Passato', max: 1, fromLevel: 6, recharge: 'short_or_long' },
    ],
    'grave-domain': [
        { nome: 'Sentinella alla Soglia della Morte', max: 'prof_bonus', fromLevel: 6, recharge: 'long_rest' },
    ],
    'twilight-domain': [
        { nome: 'Benedizione Vigile', max: 1, fromLevel: 1, recharge: 'turn', note: 'al proprio turno' },
    ],
    'peace-domain': [
        { nome: 'Vincolo Incoraggiante', max: 'prof_bonus', fromLevel: 1, recharge: 'long_rest', note: 'ricarica al r. lungo' },
    ],
    'order-domain': [
        // Voice of Authority e Embodiment: niente daily.
    ],
    'arcana-domain': [
        // Arcane Initiate / Spell Breaker: niente daily.
    ],
    'forge-domain': [
        // Bonus dell'Artigiano: 1/r. lungo (creare oggetto magico)
        { nome: 'Bonus dell\'Artigiano', max: 1, fromLevel: 1, recharge: 'long_rest' },
    ],

    // ── STREGONE ───────────────────────────────────────────────────────
    'wild-magic': [
        { nome: 'Maree del Caos', max: 1, fromLevel: 1, recharge: 'long_rest' },
    ],
    'shadow-magic': [
        { nome: 'Forza dell\'Oltretomba', max: 1, fromLevel: 1, recharge: 'long_rest' },
    ],
    'divine-soul': [
        { nome: 'Favorito dagli Dei', max: 1, fromLevel: 1, recharge: 'short_or_long' },
        { nome: 'Recupero Ultraterreno', max: 1, fromLevel: 18, recharge: 'long_rest' },
    ],
    'storm-sorcery': [
        // Tempestuous Magic e Heart of the Storm sono passive/free; niente daily.
    ],
    'draconic-bloodline': [
        // Nessuna risorsa daily extra (Draconic Presence usa sorcery points).
    ],
    'aberrant-mind': [
        // Psionic Sorcery e Psionic Defenses usano sorcery points / passive.
    ],

    // ── BARBARO ───────────────────────────────────────────────────────
    // Path of the Battlerager / Berserker / Beast / Totem Warrior /
    // Giant: nessuna daily oltre alle Ire (gestita a livello classe).

    // ── BARDO ──────────────────────────────────────────────────────────
    'college-of-eloquence': [
        { nome: 'Lingua Universale', max: 'prof_bonus', fromLevel: 6, recharge: 'long_rest' },
    ],
    // Gli altri collegi usano Ispirazioni Bardiche (di classe) o sono passive.

    // ── RANGER ─────────────────────────────────────────────────────────
    'monster-slayer': [
        { nome: 'Magia da Cacciatore', max: 'prof_bonus', fromLevel: 7, recharge: 'long_rest' },
    ],
    'fey-wanderer': [
        { nome: 'Distorsione Affascinante', max: 'prof_bonus', fromLevel: 7, recharge: 'long_rest' },
    ],
    'horizon-walker': [
        { nome: 'Individuazione Portali', max: 1, fromLevel: 3, recharge: 'short_or_long' },
    ],
    'gloom-stalker': [
        // Iron Mind, Shadowy Dodge: passive/reactive senza daily.
    ],
    'drakewarden': [
        // Drake Companion (compagno), niente counter aggiuntivo.
    ],
    'swarmkeeper': [
        // Swarmkeeper Magic: solo incantesimi.
    ],
    'beast-master': [
        // Compagno animale gestito a parte.
    ],
    'hunter': [
        // Nessuna risorsa daily.
    ],

    // ── ROGUE ──────────────────────────────────────────────────────────
    'inquisitive': [
        { nome: 'Occhio Inerrante', usaMod: 'saggezza', minMod: 1, fromLevel: 13, recharge: 'long_rest' },
    ],
    'mastermind': [
        // Master Tactician: passive.
    ],
    'arcane-trickster': [
        // Solo incantesimi/legerdemain magico (no daily counter).
    ],
    'assassin': [
        // Niente daily.
    ],
    'scout': [
        // Niente daily.
    ],
    'swashbuckler': [
        // Niente daily.
    ],
    'thief': [
        // Niente daily.
    ],

    // ── PALADINO ───────────────────────────────────────────────────────
    // Tutte le opzioni di Channel Divinity di sottoclasse condividono il
    // pool di Incanalare Divinità della classe → niente da aggiungere.

    // ── MONACO (oltre a Punti Ki) ─────────────────────────────────────
    'way-of-mercy': [
        // Hand of Healing/Harm usano Ki.
    ],
    'way-of-the-astral-self': [
        // Arms/Visage/Body of the Astral Self usano Ki.
    ],
    'way-of-shadow': [
        // Shadow Arts: usa Ki.
    ],
    'way-of-the-four-elements': [
        // Discipline of the Elements: usa Ki.
    ],
    'way-of-the-sun-soul': [
        // Tutto usa Ki.
    ],
    'way-of-the-long-death': [
        // Mastery of Death usa Ki; Touch of the Long Death usa Ki.
    ],
    'way-of-the-drunken-master': [
        // Tipsy Sway, Drunkard's Luck: passive/reactive.
    ],
    'way-of-the-kensei': [
        // Tutto usa Ki.
    ],

    // ── COMBATTENTE (extra) ───────────────────────────────────────────
    'cavalier': [
        // Hold the Line / Ferocious Charger / Vigilant Defender: passive/reactive.
    ],
    'eldritch-knight': [
        // Solo incantesimi.
    ],
    'champion': [
        // Niente daily.
    ],

    // ── MONACO ─────────────────────────────────────────────────────────
    'way-of-the-open-hand': [
        { nome: 'Pienezza del Corpo', max: 1, fromLevel: 6, recharge: 'long_rest', note: 'cura 3 × livello monaco PF' },
    ],
    'way-of-the-ascendant-dragon': [
        { nome: 'Soffio del Drago', max: 'prof_bonus', fromLevel: 3, recharge: 'long_rest' },
    ],

    // ── PALADINO (oltre al Channel Divinity di classe) ────────────────
    // Tutte le opzioni di Channel Divinity di sottoclasse condividono il
    // pool di Incanalare Divinità della classe → niente da aggiungere.

    // ── DRUIDO ─────────────────────────────────────────────────────────
    // La maggior parte usa Forma Selvatica (gestita a livello classe).

    // ── RANGER ─────────────────────────────────────────────────────────
    'horizon-walker': [
        { nome: 'Individuazione Portali', max: 1, fromLevel: 3, recharge: 'short_or_long' },
    ],
    'fey-wanderer': [
        { nome: 'Distorsione Affascinante', max: 'prof_bonus', fromLevel: 7, recharge: 'long_rest' },
    ],

    // ── BARDO ──────────────────────────────────────────────────────────
    'college-of-glamour': [
        { nome: 'Esibizione Ammaliante', max: 1, fromLevel: 6, recharge: 'short_or_long' },
    ],
    'college-of-whispers': [
        { nome: 'Manto dei Sussurri', max: 1, fromLevel: 6, recharge: 'short_or_long' },
    ],
    'college-of-creation': [
        { nome: 'Esibizione della Creazione', max: 1, fromLevel: 6, recharge: 'long_rest' },
    ],

    // ── STREGONE ───────────────────────────────────────────────────────
    // Wild Magic
    'wild-magic': [
        { nome: 'Maree del Caos', max: 1, fromLevel: 1, recharge: 'long_rest' },
    ],
    'clockwork-soul': [
        { nome: 'Ripristina Equilibrio', max: 'prof_bonus', fromLevel: 1, recharge: 'long_rest' },
        { nome: 'Trance dell\'Ordine', max: 1, fromLevel: 6, recharge: 'long_rest' },
        { nome: 'Cavalcata dell\'Orologio', max: 1, fromLevel: 18, recharge: 'long_rest' },
    ],
    // Aberrant Mind: Psionic Sorcery usa Punti Stregoneria, niente extra.

    // ── WARLOCK ────────────────────────────────────────────────────────
    'hexblade': [
        { nome: 'Maledizione del Lama Stregata', max: 'prof_bonus', fromLevel: 1, recharge: 'short_or_long' },
        { nome: 'Spettro Maledetto', max: 1, fromLevel: 6, recharge: 'long_rest' },
    ],
    'the-fiend': [
        // Dark One's Own Luck: 1 uso per riposo breve o lungo (non bonus di competenza).
        { nome: 'Fortuna dell\'Oscuro', max: 1, fromLevel: 6, recharge: 'short_or_long' },
        { nome: 'Scaglia all\'Inferno', max: 1, fromLevel: 14, recharge: 'long_rest' },
    ],
    'celestial': [
        { nome: 'Luce Curativa',
          tipo: 'dice_pool',
          perLivelloCalc: 'warlock_lvl_plus_one_d6',
          dado: 'd6',
          fromLevel: 1, recharge: 'long_rest', note: '1 + livello Warlock dadi' },
        { nome: 'Resilienza Celestiale (allies)', max: 5, fromLevel: 10, recharge: 'short_or_long', note: 'al termine del riposo' },
    ],
    'genie': [
        { nome: 'Vaso del Genio (Riposo)', max: 1, fromLevel: 1, recharge: 'long_rest' },
        { nome: 'Vaso del Genio (Ira)', max: 'prof_bonus', fromLevel: 1, recharge: 'long_rest' },
        { nome: 'Desiderio Limitato', max: 1, fromLevel: 14, recharge: 'long_rest', note: 'recupera dopo 1d4 r. lunghi' },
    ],
    'undead': [
        { nome: 'Forma del Terrore', max: 'prof_bonus', fromLevel: 1, recharge: 'long_rest' },
    ],
    'great-old-one': [
        { nome: 'Barriera Entropica', max: 1, fromLevel: 6, recharge: 'short_or_long' },
        { nome: 'Creare Schiavo', max: 1, fromLevel: 14, recharge: 'long_rest' },
    ],
    'archfey': [
        { nome: 'Presenza Fatata', max: 1, fromLevel: 1, recharge: 'short_or_long' },
        { nome: 'Fuga nella Nebbia', max: 1, fromLevel: 6, recharge: 'short_or_long' },
        { nome: 'Delirio Oscuro', max: 1, fromLevel: 14, recharge: 'short_or_long' },
    ],
    'fathomless': [
        { nome: 'Tentacolo degli Abissi', max: 'prof_bonus', fromLevel: 1, recharge: 'short_or_long' },
        { nome: 'Tuffo Abissale', max: 'prof_bonus', fromLevel: 6, recharge: 'long_rest' },
    ],
    'undying': [
        { nome: 'Sfida la Morte', max: 1, fromLevel: 6, recharge: 'long_rest' },
        { nome: 'Vita Indistruttibile', max: 1, fromLevel: 14, recharge: 'short_or_long' },
    ],

    // ── ARTEFICE ───────────────────────────────────────────────────────
    'alchemist': [
        { nome: 'Elisir Sperimentale', usaMod: 'intelligenza', minMod: 1, fromLevel: 3, recharge: 'long_rest' },
    ],
};

// Etichette di recharge user-friendly.
const _RECHARGE_LABELS = {
    long_rest: 'r. lungo',
    short_rest: 'r. breve',
    short_or_long: 'r. breve/lungo',
    long_rest_or_bonus: 'r. lungo o az. bonus',
    dawn: "all'alba",
    turn: 'al turno',
};

// Calcola il valore massimo di una risorsa di sottoclasse per il PG.
function _resolveSubclassResMax(res, pg, classEntry) {
    const lvl = parseInt(classEntry?.livello) || 0;
    if (typeof res.max === 'number') return res.max;
    if (res.max === 'prof_bonus') {
        return calcBonusCompetenza(pg.livello || 1) || 2;
    }
    if (res.usaMod) {
        const mod = calcMod(pg[res.usaMod] || 10);
        const minMod = res.minMod != null ? res.minMod : 1;
        return Math.max(minMod, mod);
    }
    if (Array.isArray(res.perLivello)) {
        return res.perLivello[Math.min(lvl, 20)] || 0;
    }
    if (res.perLivelloCalc === 'warlock_lvl_plus_one_d6') {
        // Per "Luce Curativa" del Celestial Warlock: 1 + livello warlock.
        const warlockLvl = (pg.classi || []).filter(c => c.nome === 'Warlock').reduce((a, c) => a + (c.livello || 0), 0) || 0;
        return Math.max(1, warlockLvl + 1);
    }
    if (res.perLivelloCalc === 'druid_level_d6') {
        // Per "Balsamo della Corte Estiva" del Circle of Dreams: dadi = livello da Druido.
        const druidLvl = (pg.classi || []).filter(c => c.nome === 'Druido').reduce((a, c) => a + (c.livello || 0), 0) || 0;
        return Math.max(1, druidLvl);
    }
    return 0;
}

// Ritorna la dimensione del dado per le risorse di tipo dice_pool che
// scalano (es. Soulknife, Battle Master).
function _resolveSubclassResDie(res, classEntry) {
    if (Array.isArray(res.dadoPerLivello)) {
        const lvl = parseInt(classEntry?.livello) || 0;
        return res.dadoPerLivello[Math.min(lvl, 20)] || res.dado || '';
    }
    return res.dado || '';
}

// Helper: per ogni classe del PG, restituisce le risorse di sottoclasse
// applicabili al livello corrente.
function _pgSubclassResources(pg) {
    const out = [];
    if (!pg || !Array.isArray(pg.classi)) return out;
    const stored = (pg.risorse_classe && pg.risorse_classe._subclass) || {};
    const hbCache = (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewSottoclassi))
        ? AppState.cachedHomebrewSottoclassi : [];
    pg.classi.forEach(c => {
        const subSlug = c.sottoclasseSlug;
        if (!subSlug) return;
        const lvl = parseInt(c.livello) || 0;

        // ── Caso HOMEBREW: estrae le `risorsa` dalle features ──
        if (c.sottoclasse_homebrew_id || subSlug.startsWith('hb:')) {
            const hbId = c.sottoclasse_homebrew_id || subSlug.replace(/^hb:/, '');
            const hb = hbCache.find(r => String(r.id) === String(hbId));
            if (!hb || !Array.isArray(hb.sottoclasse_features)) return;
            hb.sottoclasse_features.forEach((f, fIdx) => {
                if (!f || !f.risorsa) return;
                if ((parseInt(f.level) || 1) > lvl) return;
                const r = f.risorsa;
                // Risolve max: numero diretto o formula tipo 'prof_bonus'
                let max = 0;
                if (typeof r.max === 'number') {
                    max = r.max;
                } else if (typeof r.max === 'string') {
                    max = _resolveHomebrewResMax(r.max, pg, c);
                }
                if (max <= 0) return;
                const key = `hb:${hbId}__${fIdx}`;
                const current = stored[key] != null ? Math.min(max, Math.max(0, stored[key])) : max;
                out.push({
                    key,
                    nome: r.nome || f.nome,
                    tipo: r.tipo || 'counter',
                    max, current,
                    die: r.dado || (r.tipo === 'dice_pool' || r.tipo === 'portent' ? 'd6' : null),
                    recharge: _RECHARGE_LABELS[r.recharge] || '',
                    classeNome: c.nome,
                    sottoclasseNome: hb.nome || c.sottoclasse || 'Sottoclasse Homebrew',
                    note: '',
                    defaultMax: max,
                    fromLevel: parseInt(f.level) || 1,
                });
            });
            return;
        }

        // ── Caso NATIVO ──
        const list = SUBCLASS_RESOURCES[subSlug];
        if (!list) return;
        list.forEach((res, rIdx) => {
            if (lvl < (res.fromLevel || 1)) return;
            const max = _resolveSubclassResMax(res, pg, c);
            if (max <= 0) return;
            const die = _resolveSubclassResDie(res, c);
            const key = `${subSlug}__${rIdx}`;
            const current = stored[key] != null ? Math.min(max, Math.max(0, stored[key])) : max;
            out.push({
                key,
                nome: res.nome,
                tipo: res.tipo || 'counter',
                max, current,
                die,
                recharge: _RECHARGE_LABELS[res.recharge] || '',
                classeNome: c.nome,
                sottoclasseNome: c.sottoclasse || c.sottoclasseNome || subSlug,
                note: res.note || '',
                defaultMax: max,
                fromLevel: res.fromLevel || 1,
            });
        });
    });
    return out;
}

// Risolve i valori "formula" del max risorsa per le sottoclassi homebrew.
// Supporta: prof_bonus, cha_mod, wis_mod, int_mod, con_mod, str_mod, dex_mod
// Per i mod usa la caratteristica primaria del PG. Se non riconosce la
// stringa, prova a parsarla come intero.
function _resolveHomebrewResMax(formula, pg, classeEntry) {
    const f = String(formula || '').trim().toLowerCase();
    if (f === 'prof_bonus') {
        const totLvl = (pg.classi || []).reduce((s, c) => s + (parseInt(c.livello) || 0), 0) || 1;
        return Math.floor((totLvl - 1) / 4) + 2;
    }
    const modMap = {
        cha_mod: 'carisma', wis_mod: 'saggezza', int_mod: 'intelligenza',
        con_mod: 'costituzione', str_mod: 'forza', dex_mod: 'destrezza'
    };
    if (modMap[f]) {
        const stat = (pg.statistiche && pg.statistiche[modMap[f]]) || 10;
        return Math.max(1, Math.floor((stat - 10) / 2));
    }
    const n = parseInt(f);
    return isNaN(n) ? 0 : n;
}
