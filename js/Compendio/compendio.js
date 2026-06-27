// ============================================================================
// COMPENDIO - D&D reference browser
// ============================================================================

let _compCurrentTab = 'classi';
let _compSpellRefCache = null;
let _compSpellRefCacheSize = 0;
window._compState = window._compState || {};

const COMP_SPELL_REF_CONTEXT_RE = /\b(incantesim\w*|trucchett\w*|lanc\w*|conosc\w*|prepar\w*|slot|magia|magic\w*|spell\w*|cantrip\w*|cast\w*|learn\w*|known|prepared)\b/i;
const COMP_AMBIGUOUS_SPELL_REF_LABELS = new Set([
    'aiuto',
    'anatema',
    'amicizia',
    'bane',
    'bless',
    'comando',
    'command',
    'confusione',
    'confusion',
    'creation',
    'creazione',
    'desiderio',
    'fear',
    'fly',
    'friends',
    'guidance',
    'guida',
    'haste',
    'jump',
    'light',
    'luce',
    'mending',
    'message',
    'messaggio',
    'paura',
    'resistance',
    'resistenza',
    'riparare',
    'saltare',
    'sanctuary',
    'santuario',
    'scudo',
    'shield',
    'silence',
    'silenzio',
    'sleep',
    'sonno',
    'velocita',
    'volare',
    'wish',
]);

const COMP_TABS = {
    razze: { label: 'Razze', iconFile: 'Razze' },
    classi: { label: 'Classi', iconFile: 'Classi' },
    background: { label: 'Background', iconFile: 'Background' },
    oggetti: { label: 'Equipaggiamento', iconFile: 'Equipaggiamento' },
    talenti_stili: { label: 'Talenti e Stili', iconFile: 'Talenti e Stili' },
    mostri: { label: 'Mostri e Combattimenti', iconFile: 'Mostri e Combattimenti' },
    suppliche: { label: 'Suppliche Occulte', iconFile: 'Suppliche' },
    incantesimi: { label: 'Incantesimi', iconFile: 'Incantesimi' },
};

const COMP_EQUIPMENT_SECTIONS = {
    armi: { label: 'Armi, Armature e Scudi', shortLabel: 'Armi e Scudi', iconFile: 'Equipaggiamento/Armi_Armature_Scudi' },
    avventura: { label: 'Avventura', shortLabel: 'Avventura', iconFile: 'Equipaggiamento/Avventura' },
    strumenti: { label: 'Strumenti', shortLabel: 'Strumenti', iconFile: 'Equipaggiamento/Strumenti' },
    erbe: { label: 'Erbe', shortLabel: 'Erbe', iconFile: 'Equipaggiamento/Erbe' },
    metalli: { label: 'Metalli', shortLabel: 'Metalli', iconFile: 'Equipaggiamento/Metalli' },
    gemme: { label: 'Gemme', shortLabel: 'Gemme', iconFile: 'Equipaggiamento/Gemme' },
    veleni: { label: 'Veleni', shortLabel: 'Veleni', iconFile: 'Equipaggiamento/Veleni' },
    oggetti: { label: 'Oggetti Magici', shortLabel: 'Oggetti Magici', iconFile: 'Equipaggiamento/Oggetti Magici' },
};

const COMP_EQUIPMENT_SECTION_ORDER = ['armi', 'avventura', 'strumenti', 'erbe', 'metalli', 'gemme', 'veleni', 'oggetti'];

const COMP_WEAPON_GROUPS = [
    ['semplice_mischia', 'Armi semplici da mischia'],
    ['semplice_distanza', 'Armi semplici a distanza'],
    ['guerra_mischia', 'Armi da guerra da mischia'],
    ['guerra_distanza', 'Armi da guerra a distanza'],
];

const COMP_ARMOR_GROUPS = [
    ['leggera', 'Armature leggere'],
    ['media', 'Armature medie'],
    ['pesante', 'Armature pesanti'],
    ['scudo', 'Scudi'],
];

let COMP_ADVENTURING_GEAR_DATA = window.COMP_ADVENTURING_GEAR_DATA || [];
let COMP_TOOLS_DATA = window.COMP_TOOLS_DATA || [];
let COMP_HERBS_DATA = window.COMP_HERBS_DATA || [];
let COMP_METALS_DATA = window.COMP_METALS_DATA || [];
let COMP_GEMS_DATA = window.COMP_GEMS_DATA || [];
let COMP_REALMS_GEMS_DATA = window.COMP_REALMS_GEMS_DATA || [];
let COMP_MONSTERS_DATA = window.COMP_MONSTERS_DATA || [];
let COMP_SUMMON_STATBLOCKS_DATA = window.COMP_SUMMON_STATBLOCKS_DATA || [];
let _compEquipmentDataPromise = null;
let _compBackgroundDataPromise = null;
let _compRaceDataPromise = null;
let _compFeatDataPromise = null;
let _compFightingStyleDataPromise = null;
let _compInvocationDataPromise = null;
let _compMonsterDataPromise = null;
let _compMonsterDataFailed = false;
let _compSummonStatblockDataPromise = null;
let _compSummonStatblockDataFailed = false;
let _compSummonStatblockDataLoaded = !!COMP_SUMMON_STATBLOCKS_DATA.length;
let _compMonsterItemsCache = null;
let _compMonsterItemsSource = null;
let _compSearchRenderTimer = null;

function _compTabIcon(tab) {
    const file = COMP_TABS[tab]?.iconFile;
    if (!file) return '';
    return `<img class="comp-hub-icon-img" src="images/Tabs/${encodeURIComponent(file)}.svg" alt="" loading="lazy">`;
}

function _compEquipmentSectionIcon(section) {
    const file = COMP_EQUIPMENT_SECTIONS[section]?.iconFile || 'Equipaggiamento';
    const src = `images/Tabs/${file.split('/').map(encodeURIComponent).join('/')}.svg`;
    return `<img class="comp-hub-icon-img" src="${src}" alt="" loading="lazy">`;
}

window.compGetSidebarItems = function() {
    return Object.entries(COMP_TABS).map(([key, tab]) => ({
        key,
        label: tab.label,
        iconFile: tab.iconFile,
    }));
};

window.compGetCurrentSidebarTab = function() {
    const subVisible = document.getElementById('compendioSubPage')?.style.display !== 'none';
    return subVisible ? _compCurrentTab : '';
};

const COMP_MULTICLASS_REQUIREMENTS = {
    Artefice: 'Intelligenza 13',
    Barbaro: 'Forza 13',
    Bardo: 'Carisma 13',
    Chierico: 'Saggezza 13',
    Druido: 'Saggezza 13',
    Guerriero: 'Forza 13 o Destrezza 13',
    Ladro: 'Destrezza 13',
    Mago: 'Intelligenza 13',
    Monaco: 'Destrezza 13 e Saggezza 13',
    Paladino: 'Forza 13 e Carisma 13',
    Ranger: 'Destrezza 13 e Saggezza 13',
    Stregone: 'Carisma 13',
    Warlock: 'Carisma 13',
};

const COMP_MULTICLASS_PROFICIENCIES = {
    Artefice: 'Armature leggere, armature medie, scudi, arnesi da scasso, attrezzi da inventore',
    Barbaro: 'Scudi, armi semplici, armi da guerra',
    Bardo: 'Armature leggere, una abilita a scelta, uno strumento musicale a scelta',
    Chierico: 'Armature leggere, armature medie, scudi',
    Druido: 'Armature leggere, armature medie, scudi',
    Guerriero: 'Armature leggere, armature medie, scudi, armi semplici, armi da guerra',
    Ladro: 'Armature leggere, una abilita dalla lista del Ladro, arnesi da scasso',
    Mago: 'Nessuna competenza aggiuntiva',
    Monaco: 'Armi semplici, spade corte',
    Paladino: 'Armature leggere, armature medie, scudi, armi semplici, armi da guerra',
    Ranger: 'Armature leggere, armature medie, scudi, armi semplici, armi da guerra, una abilita dalla lista del Ranger',
    Stregone: 'Nessuna competenza aggiuntiva',
    Warlock: 'Armature leggere, armi semplici',
};

const COMP_CLASS_ALIASES = {
    artefice: ['artificer'],
    artificer: ['artefice'],
    bardo: ['bard'],
    bard: ['bardo'],
    chierico: ['cleric'],
    cleric: ['chierico'],
    druido: ['druid'],
    druid: ['druido'],
    guerriero: ['fighter'],
    fighter: ['guerriero'],
    ladro: ['rogue'],
    rogue: ['ladro'],
    mago: ['wizard'],
    wizard: ['mago'],
    monaco: ['monk'],
    monk: ['monaco'],
    paladino: ['paladin'],
    paladin: ['paladino'],
    ranger: ['ranger'],
    stregone: ['sorcerer'],
    sorcerer: ['stregone'],
    warlock: ['warlock'],
};

const COMP_CLASS_LABELS = {
    artefice: { it: 'Artefice', en: 'Artificer' },
    bardo: { it: 'Bardo', en: 'Bard' },
    chierico: { it: 'Chierico', en: 'Cleric' },
    druido: { it: 'Druido', en: 'Druid' },
    guerriero: { it: 'Guerriero', en: 'Fighter' },
    ladro: { it: 'Ladro', en: 'Rogue' },
    mago: { it: 'Mago', en: 'Wizard' },
    monaco: { it: 'Monaco', en: 'Monk' },
    paladino: { it: 'Paladino', en: 'Paladin' },
    ranger: { it: 'Ranger', en: 'Ranger' },
    stregone: { it: 'Stregone', en: 'Sorcerer' },
    warlock: { it: 'Warlock', en: 'Warlock' },
};

const COMP_FEATURE_TABLES = {
    'distruggere-non-morti': [
        {
            title: 'Distruggere Non Morti',
            columns: ['Livello da chierico', 'GS distrutti'],
            rows: [
                ['5', '1/2 o inferiore'],
                ['8', '1 o inferiore'],
                ['11', '2 o inferiore'],
                ['14', '3 o inferiore'],
                ['17', '4 o inferiore'],
            ],
        },
    ],
    'forma-selvatica': [
        {
            title: 'Forme Bestiali',
            columns: ['Livello da druido', 'GS massimo', 'Limitazioni'],
            rows: [
                ['2', '1/4', 'Nessuna velocita di volare o nuotare'],
                ['4', '1/2', 'Nessuna velocita di volare'],
                ['8', '1', 'Nessuna'],
            ],
        },
    ],
    'sorgente-di-magia': [
        {
            title: 'Creare Slot Incantesimo',
            columns: ['Livello slot', 'Costo in punti stregoneria'],
            rows: [
                ['1°', '2'],
                ['2°', '3'],
                ['3°', '5'],
                ['4°', '6'],
                ['5°', '7'],
            ],
        },
    ],
    'discepolo-degli-elementi': [
        {
            title: 'Discipline Elementali',
            columns: ['Disciplina', 'Prerequisito', 'Uso'],
            rows: [
                ['Sintonia Elementale', '-', 'Effetti elementali minori e utilita narrativa.'],
                ['Artigli del Serpente di Fuoco', '-', "Portata aumentata e danni da fuoco con colpi senz'armi."],
                ["Pugno dell'Aria Infranta", '-', 'Danni contundenti e spinta su tiro salvezza fallito.'],
                ["Frusta d'Acqua", '-', 'Danni contundenti, trascina o butta a terra il bersaglio.'],
                ['Forma del Fiume', '-', 'Manipola acqua e ghiaccio entro i limiti della disciplina.'],
                ['Assalto dei Tizzoni Ardenti', '-', 'Lancia mani brucianti spendendo punti ki.'],
                ['Pugno dei Quattro Tuoni', '-', 'Lancia onda tonante spendendo punti ki.'],
                ['Soffio del Vento', '-', 'Lancia folata di vento spendendo punti ki.'],
                ['Morsa del Vento del Nord', '6° livello', 'Lancia blocca persone spendendo punti ki.'],
                ['Gong della Vetta', '6° livello', 'Lancia frantumare spendendo punti ki.'],
                ['Fiamme della Fenice', '11° livello', 'Lancia palla di fuoco spendendo punti ki.'],
                ['Cavalcare il Vento', '11° livello', 'Lancia volare su te stesso spendendo punti ki.'],
                ['Posizione della Nebbia', '11° livello', 'Lancia forma gassosa spendendo punti ki.'],
                ['Difesa della Montagna Eterna', '17° livello', 'Lancia pelle di pietra su te stesso spendendo punti ki.'],
                ['Fiume di Fiamme Affamate', '17° livello', 'Lancia muro di fuoco spendendo punti ki.'],
                ['Onda della Terra Rotolante', '17° livello', 'Lancia muro di pietra spendendo punti ki.'],
                ['Respiro dell Inverno', '17° livello', 'Lancia cono di freddo spendendo punti ki.'],
            ],
        },
    ],
};

const COMP_METAMAGIC_OPTIONS = [
    {
        id: 'accurato',
        name: 'Incantesimo Accurato',
        cost: '1 punto stregoneria',
        description: 'Quando lanci un incantesimo che costringe altre creature a effettuare un tiro salvezza, puoi proteggere alcune di quelle creature dalla piena forza dell incantesimo. Spendendo 1 punto stregoneria, scegli un numero di creature fino al tuo modificatore di Carisma (minimo una): quelle creature superano automaticamente il tiro salvezza contro l incantesimo.',
    },
    {
        id: 'distante',
        name: 'Incantesimo Distante',
        cost: '1 punto stregoneria',
        description: 'Quando lanci un incantesimo con gittata di 1,5 metri o superiore, puoi spendere 1 punto stregoneria per raddoppiarne la gittata. Se l incantesimo ha gittata contatto, puoi spendere 1 punto stregoneria per renderla pari a 9 metri.',
    },
    {
        id: 'esteso',
        name: 'Incantesimo Esteso',
        cost: '1 punto stregoneria',
        description: 'Quando lanci un incantesimo con durata di 1 minuto o superiore, puoi spendere 1 punto stregoneria per raddoppiarne la durata, fino a una durata massima di 24 ore.',
    },
    {
        id: 'gemellato',
        name: 'Incantesimo Gemellato',
        cost: 'Livello incantesimo in punti stregoneria',
        description: 'Quando lanci un incantesimo che bersaglia una sola creatura e non ha gittata personale, puoi spendere un numero di punti stregoneria pari al livello dell incantesimo per bersagliare una seconda creatura entro gittata. Per un trucchetto il costo e 1 punto stregoneria. L incantesimo deve essere incapace di bersagliare piu di una creatura al livello a cui viene lanciato.',
    },
    {
        id: 'intensificato',
        name: 'Incantesimo Intensificato',
        cost: '3 punti stregoneria',
        description: 'Quando lanci un incantesimo che costringe una creatura a effettuare un tiro salvezza per resistere ai suoi effetti, puoi spendere 3 punti stregoneria per imporre svantaggio al primo tiro salvezza effettuato da un bersaglio contro l incantesimo.',
    },
    {
        id: 'potenziato',
        name: 'Incantesimo Potenziato',
        cost: '1 punto stregoneria',
        description: 'Quando tiri i danni di un incantesimo, puoi spendere 1 punto stregoneria per ritirare un numero di dadi di danno fino al tuo modificatore di Carisma (minimo uno). Devi usare i nuovi risultati. Puoi usare questa opzione anche se hai gia usato un altra opzione di Metamagia durante il lancio dello stesso incantesimo.',
    },
    {
        id: 'rapido',
        name: 'Incantesimo Rapido',
        cost: '2 punti stregoneria',
        description: 'Quando lanci un incantesimo con tempo di lancio di 1 azione, puoi spendere 2 punti stregoneria per cambiare il tempo di lancio in 1 azione bonus per quel lancio.',
    },
    {
        id: 'silenzioso',
        name: 'Incantesimo Silenzioso',
        cost: '1 punto stregoneria',
        description: 'Quando lanci un incantesimo, puoi spendere 1 punto stregoneria per lanciarlo senza componenti somatiche o verbali.',
    },
    {
        id: 'cercatore',
        name: 'Incantesimo Cercatore',
        cost: '2 punti stregoneria',
        source: 'TCoE',
        description: 'Se effettui un tiro per colpire con un incantesimo e lo manchi, puoi spendere 2 punti stregoneria per ritirare il d20. Devi usare il nuovo risultato. Puoi usare questa opzione anche se hai gia usato un altra opzione di Metamagia durante il lancio dello stesso incantesimo.',
    },
    {
        id: 'tramutato',
        name: 'Incantesimo Tramutato',
        cost: '1 punto stregoneria',
        source: 'TCoE',
        description: 'Quando lanci un incantesimo che infligge danni di un tipo tra acido, freddo, fuoco, fulmine, tuono o veleno, puoi spendere 1 punto stregoneria per sostituire quel tipo di danno con un altro della stessa lista.',
    },
];

const COMP_FEATURE_STATBLOCK_LINKS = {
    'infondere-negli-oggetti': [
        { monster: 'Homunculus Servant', label: 'Servitore Omuncolo' },
    ],
    'infuse-item': [
        { monster: 'Homunculus Servant', label: 'Servitore Omuncolo' },
    ],
    'servitore-omuncolo': [
        { monster: 'Homunculus Servant', label: 'Servitore Omuncolo' },
    ],
    'steel-defender': [
        { monster: 'Steel Defender', label: 'Difensore d Acciaio' },
    ],
    'primal-companion': [
        { monster: 'Beast of the Land', label: 'Bestia della Terra' },
        { monster: 'Beast of the Sea', label: 'Bestia del Mare' },
        { monster: 'Beast of the Sky', label: 'Bestia del Cielo' },
    ],
    'evocare-spirito-della-fiamma': [
        { monster: 'Wildfire Spirit', label: 'Spirito della Fiamma' },
    ],
    'summon-wildfire-spirit': [
        { monster: 'Wildfire Spirit', label: 'Spirito della Fiamma' },
    ],
    'drake-companion': [
        { monster: 'Drake Companion', label: 'Compagno Draconico' },
    ],
};

const COMP_ARTIFICER_SPELLS = window.COMPANION_ARTIFICER_SPELLS = new Set([
    'absorb elements',
    'acid splash',
    'aid',
    'alarm',
    'alter self',
    'animate objects',
    'arcane eye',
    'arcane lock',
    'bigby\'s hand',
    'blink',
    'blur',
    'booming blade',
    'catapult',
    'catnap',
    'continual flame',
    'create bonfire',
    'create food and water',
    'creation',
    'cure wounds',
    'dancing lights',
    'darkvision',
    'detect magic',
    'disguise self',
    'dispel magic',
    'elemental bane',
    'elemental weapon',
    'enhance ability',
    'enlarge/reduce',
    'expeditious retreat',
    'fabricate',
    'faerie fire',
    'false life',
    'feather fall',
    'fire bolt',
    'flame arrows',
    'fly',
    'freedom of movement',
    'frostbite',
    'grease',
    'greater restoration',
    'guidance',
    'haste',
    'heat metal',
    'identify',
    'invisibility',
    'jump',
    'lesser restoration',
    'levitate',
    'light',
    'lightning lure',
    'longstrider',
    'mage hand',
    'magic mouth',
    'magic stone',
    'magic weapon',
    'mending',
    'message',
    'poison spray',
    'prestidigitation',
    'protection from energy',
    'protection from poison',
    'purify food and drink',
    'pyrotechnics',
    'ray of frost',
    'resistance',
    'revivify',
    'rope trick',
    'sanctuary',
    'see invisibility',
    'shocking grasp',
    'skill empowerment',
    'skywrite',
    'snare',
    'spare the dying',
    'spider climb',
    'stone shape',
    'stoneskin',
    'summon construct',
    'sword burst',
    'tasha\'s caustic brew',
    'thorn whip',
    'thunderclap',
    'tiny servant',
    'transmute rock',
    'true strike',
    'vitriolic sphere',
    'wall of stone',
    'water breathing',
    'water walk',
    'web',
]);

function compendioRenderHub() {
    const grid = document.getElementById('compendioHubGrid');
    if (!grid) return;
    grid.style.display = 'flex';
    grid.style.flexDirection = 'column';
    grid.style.gridTemplateColumns = '';
    grid.style.gridTemplateRows = '';
    grid.style.gridAutoFlow = '';
    const rows = [];
    const tabs = Object.entries(COMP_TABS);
    for (let i = 0; i < tabs.length; i += 2) {
        rows.push(`
            <div class="comp-hub-row" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;flex:1;min-height:0;">
                ${tabs.slice(i, i + 2).map(([key, tab]) => `
                    <button type="button" class="comp-hub-card" onclick="compendioOpenTab('${key}')">
                        <span class="comp-hub-card-icon" aria-hidden="true">${_compTabIcon(key)}</span>
                        <span class="comp-hub-card-label">${escapeHtml(tab.label)}</span>
                    </button>
                `).join('')}
            </div>
        `);
    }
    grid.innerHTML = rows.join('');
}

window.compendioBackToHub = function() {
    const state = _compStateFor(_compCurrentTab);
    if (_compCurrentTab === 'oggetti' && state.equipmentSection) {
        state.equipmentSection = '';
        const title = document.getElementById('compendioSubTitle');
        if (title) title.textContent = COMP_TABS.oggetti.label;
        compendioRenderTab();
        _compScrollToTop();
        return;
    }
    if (state.detail) {
        state.detail = null;
        const title = document.getElementById('compendioSubTitle');
        if (title) title.textContent = COMP_TABS[_compCurrentTab]?.label || 'Compendio';
        compendioRenderTab();
        _compScrollToTop();
        return;
    }
    _compSetStickyTools('');
    const hub = document.getElementById('compendioHub');
    const sub = document.getElementById('compendioSubPage');
    if (hub) hub.style.display = '';
    if (sub) sub.style.display = 'none';
    _compScrollToTop();
};

window.compendioShowHub = function() {
    Object.keys(COMP_TABS).forEach(tab => {
        _compStateFor(tab).detail = null;
    });
    _compSetStickyTools('');
    const hub = document.getElementById('compendioHub');
    const sub = document.getElementById('compendioSubPage');
    if (hub) hub.style.display = '';
    if (sub) sub.style.display = 'none';
    _compScrollToTop();
};

window.compendioOpenTab = function(tab) {
    if (!COMP_TABS[tab]) return;
    _compCurrentTab = tab;
    _compStateFor(tab).detail = null;
    if (tab === 'oggetti') {
        _compStateFor(tab).equipmentSection = '';
    }
    const hub = document.getElementById('compendioHub');
    const sub = document.getElementById('compendioSubPage');
    if (hub) hub.style.display = 'none';
    if (sub) sub.style.display = '';
    const title = document.getElementById('compendioSubTitle');
    if (title) title.textContent = COMP_TABS[tab].label;
    compendioRenderTab();
    if (tab === 'mostri') _compEnsureMonsterData({ rerender: true });
    _compScrollToTop();
};

function loadCompendio() {
    compendioRenderHub();
    if (document.getElementById('compendioSubPage')?.style.display !== 'none') {
        compendioRenderTab();
    }
}

function _compHasMonsterData() {
    if (!COMP_MONSTERS_DATA.length && Array.isArray(window.COMP_MONSTERS_DATA)) {
        COMP_MONSTERS_DATA = window.COMP_MONSTERS_DATA;
    }
    return Array.isArray(COMP_MONSTERS_DATA) && COMP_MONSTERS_DATA.length > 0;
}

function _compEquipmentRequiresRuntimeData(section) {
    return ['avventura', 'strumenti', 'erbe', 'metalli', 'gemme'].includes(section);
}

function _compSyncEquipmentData() {
    COMP_ADVENTURING_GEAR_DATA = window.COMP_ADVENTURING_GEAR_DATA || [];
    COMP_TOOLS_DATA = window.COMP_TOOLS_DATA || [];
    COMP_HERBS_DATA = window.COMP_HERBS_DATA || [];
    COMP_METALS_DATA = window.COMP_METALS_DATA || [];
    COMP_GEMS_DATA = window.COMP_GEMS_DATA || [];
    COMP_REALMS_GEMS_DATA = window.COMP_REALMS_GEMS_DATA || [];
}

function _compHasEquipmentData() {
    const ready = [
        'COMP_ADVENTURING_GEAR_DATA',
        'COMP_TOOLS_DATA',
        'COMP_HERBS_DATA',
        'COMP_METALS_DATA',
        'COMP_GEMS_DATA',
        'COMP_REALMS_GEMS_DATA',
    ].every(name => typeof window[name] !== 'undefined');
    if (ready) _compSyncEquipmentData();
    return ready;
}

function _compHasBackgroundData() {
    return typeof window.BACKGROUNDS_DATA !== 'undefined';
}

function _compEnsureBackgroundData({ rerender = false } = {}) {
    if (_compHasBackgroundData()) return Promise.resolve();
    if (_compBackgroundDataPromise) return _compBackgroundDataPromise;
    if (typeof window.ensureRuntimeData !== 'function') return Promise.resolve();

    _compBackgroundDataPromise = window.ensureRuntimeData('backgrounds')
        .then(() => {
            if (rerender && _compCurrentTab === 'background') compendioRenderTab();
        })
        .catch(error => console.warn('[compendio] caricamento background fallito:', error))
        .finally(() => {
            _compBackgroundDataPromise = null;
        });

    return _compBackgroundDataPromise;
}

function _compHasRaceData() {
    return typeof window.RACES_DATA !== 'undefined';
}

function _compEnsureRaceData({ rerender = false } = {}) {
    if (_compHasRaceData()) return Promise.resolve();
    if (_compRaceDataPromise) return _compRaceDataPromise;
    if (typeof window.ensureRuntimeData !== 'function') return Promise.resolve();

    _compRaceDataPromise = window.ensureRuntimeData('races')
        .then(() => {
            if (rerender && _compCurrentTab === 'razze') compendioRenderTab();
        })
        .catch(error => console.warn('[compendio] caricamento razze fallito:', error))
        .finally(() => {
            _compRaceDataPromise = null;
        });

    return _compRaceDataPromise;
}

function _compNeedsFeatData() {
    return _compCurrentTab === 'talenti' || (_compCurrentTab === 'talenti_stili' && _compTalentiStiliKind() === 'talenti');
}

function _compHasFeatData() {
    return typeof window.FEATS_DATA !== 'undefined';
}

function _compEnsureFeatData({ rerender = false } = {}) {
    if (_compHasFeatData()) return Promise.resolve();
    if (_compFeatDataPromise) return _compFeatDataPromise;
    if (typeof window.ensureRuntimeData !== 'function') return Promise.resolve();

    _compFeatDataPromise = window.ensureRuntimeData('feats')
        .then(() => {
            if (rerender && _compNeedsFeatData()) compendioRenderTab();
        })
        .catch(error => console.warn('[compendio] caricamento talenti fallito:', error))
        .finally(() => {
            _compFeatDataPromise = null;
        });

    return _compFeatDataPromise;
}

function _compNeedsFightingStyleData() {
    return _compCurrentTab === 'stili' || (_compCurrentTab === 'talenti_stili' && _compTalentiStiliKind() === 'stili');
}

function _compHasFightingStyleData() {
    return typeof window.FIGHTING_STYLES_DATA !== 'undefined';
}

function _compEnsureFightingStyleData({ rerender = false } = {}) {
    if (_compHasFightingStyleData()) return Promise.resolve();
    if (_compFightingStyleDataPromise) return _compFightingStyleDataPromise;
    if (typeof window.ensureRuntimeData !== 'function') return Promise.resolve();

    _compFightingStyleDataPromise = window.ensureRuntimeData('fightingStyles')
        .then(() => {
            if (rerender && _compNeedsFightingStyleData()) compendioRenderTab();
        })
        .catch(error => console.warn('[compendio] caricamento stili fallito:', error))
        .finally(() => {
            _compFightingStyleDataPromise = null;
        });

    return _compFightingStyleDataPromise;
}

function _compHasInvocationData() {
    return typeof window.INVOCATIONS_DATA !== 'undefined';
}

function _compEnsureInvocationData({ rerender = false } = {}) {
    if (_compHasInvocationData()) return Promise.resolve();
    if (_compInvocationDataPromise) return _compInvocationDataPromise;
    if (typeof window.ensureRuntimeData !== 'function') return Promise.resolve();

    _compInvocationDataPromise = window.ensureRuntimeData('invocations')
        .then(() => {
            if (rerender && _compCurrentTab === 'suppliche') compendioRenderTab();
        })
        .catch(error => console.warn('[compendio] caricamento suppliche fallito:', error))
        .finally(() => {
            _compInvocationDataPromise = null;
        });

    return _compInvocationDataPromise;
}

function _compEnsureEquipmentData({ rerender = false } = {}) {
    if (_compHasEquipmentData()) return Promise.resolve();
    if (_compEquipmentDataPromise) return _compEquipmentDataPromise;

    _compEquipmentDataPromise = (typeof window.ensureRuntimeData === 'function'
        ? window.ensureRuntimeData('equipment')
        : Promise.reject(new Error('Runtime data loader non disponibile'))
    ).then(() => {
        _compSyncEquipmentData();
    }).then(() => {
        if (rerender && _compCurrentTab === 'oggetti') compendioRenderTab();
    }).catch(error => {
        console.warn('[compendio] caricamento equipaggiamento fallito:', error);
    }).finally(() => {
        _compEquipmentDataPromise = null;
    });

    return _compEquipmentDataPromise;
}

function _compEnsureMonsterData({ rerender = false } = {}) {
    if (_compHasMonsterData()) return Promise.resolve(COMP_MONSTERS_DATA);
    if (_compMonsterDataPromise) return _compMonsterDataPromise;
    _compMonsterDataFailed = false;

    _compMonsterDataPromise = (typeof window.ensureRuntimeData === 'function'
        ? window.ensureRuntimeData('monsters')
        : Promise.reject(new Error('Runtime data loader non disponibile'))
    ).then(() => {
        COMP_MONSTERS_DATA = window.COMP_MONSTERS_DATA || [];
        _compMonsterItemsCache = null;
        _compMonsterItemsSource = null;
        return COMP_MONSTERS_DATA;
    }).then(data => {
        if (rerender && _compCurrentTab === 'mostri') compendioRenderTab();
        return data;
    }).catch(error => {
        _compMonsterDataFailed = true;
        console.warn('[compendio] caricamento bestiario fallito:', error);
        const container = document.getElementById('compendioContent');
        if (rerender && _compCurrentTab === 'mostri' && container) {
            container.innerHTML = `
                ${_compMostriTabsHtml()}
                <div class="comp-empty">Non riesco a caricare il bestiario. Riprova tra qualche secondo.</div>
            `;
        }
        return [];
    }).finally(() => {
        _compMonsterDataPromise = null;
    });

    return _compMonsterDataPromise;
}

window.compGetBookmarkState = function() {
    const subVisible = document.getElementById('compendioSubPage')?.style.display !== 'none';
    const state = _compStateFor(_compCurrentTab);
    const title = subVisible
        ? (document.getElementById('compendioSubTitle')?.textContent || COMP_TABS[_compCurrentTab]?.label || 'Compendio')
        : 'Compendio';
    const sectionParts = ['Compendio'];
    if (subVisible) sectionParts.push(COMP_TABS[_compCurrentTab]?.label || _compCurrentTab);
    if (_compCurrentTab === 'oggetti' && state.equipmentSection) {
        sectionParts.push(COMP_EQUIPMENT_SECTIONS[state.equipmentSection]?.label || state.equipmentSection);
    }
    if (state.detail?.id) sectionParts.push(state.detail.title || 'Dettaglio');
    return {
        title,
        section: sectionParts.join(' > '),
        key: subVisible
            ? `${_compCurrentTab}:${state.equipmentSection || ''}:${state.detail?.id || ''}`
            : 'hub',
        state: {
            view: subVisible ? 'sub' : 'hub',
            tab: _compCurrentTab,
            tabState: JSON.parse(JSON.stringify(state || {})),
        },
    };
};

window.compRestoreBookmarkState = async function(saved) {
    const data = saved || {};
    _compCurrentTab = COMP_TABS[data.tab] ? data.tab : 'classi';
    if (data.tabState) {
        window._compState[_compCurrentTab] = {
            ..._compStateFor(_compCurrentTab),
            ...data.tabState,
        };
    }
    if (data.view === 'sub') {
        const hub = document.getElementById('compendioHub');
        const sub = document.getElementById('compendioSubPage');
        if (hub) hub.style.display = 'none';
        if (sub) sub.style.display = '';
        const title = document.getElementById('compendioSubTitle');
        const state = _compStateFor(_compCurrentTab);
        if (title) title.textContent = state.detail?.id
            ? (state.detail.title || COMP_TABS[_compCurrentTab]?.label || 'Compendio')
            : (state.equipmentSection
                ? (COMP_EQUIPMENT_SECTIONS[state.equipmentSection]?.label || COMP_TABS[_compCurrentTab]?.label)
                : (COMP_TABS[_compCurrentTab]?.label || 'Compendio'));
        compendioRenderTab();
        if (_compCurrentTab === 'mostri') await _compEnsureMonsterData({ rerender: true });
    } else {
        compendioShowHub();
    }
};

function _compStateFor(tab) {
    if (!window._compState[tab]) {
        window._compState[tab] = { search: '', filters: {}, detail: null, openGroups: {} };
    }
    return window._compState[tab];
}

function compendioRenderTab() {
    const container = document.getElementById('compendioContent');
    if (!container) return;
    if (_compCurrentTab === 'oggetti') {
        const state = _compStateFor('oggetti');
        const title = document.getElementById('compendioSubTitle');
        if (title) title.textContent = state.equipmentSection
            ? (COMP_EQUIPMENT_SECTIONS[state.equipmentSection]?.label || COMP_TABS.oggetti.label)
            : COMP_TABS.oggetti.label;
        if (_compEquipmentRequiresRuntimeData(state.equipmentSection) && !_compHasEquipmentData()) {
            _compSetStickyTools('');
            container.innerHTML = `
                <div class="loading-placeholder comp-lazy-loading">
                    <div class="loading-spinner"></div>
                    <p>Caricamento equipaggiamento...</p>
                </div>
            `;
            _compEnsureEquipmentData({ rerender: true });
            return;
        }
        container.innerHTML = _compObjectsPageHtml();
        _compRenderObjectsStickyTools();
        _compScrollToTop();
        return;
    }
    if (_compCurrentTab === 'background' && !_compHasBackgroundData()) {
        _compSetStickyTools('');
        container.innerHTML = `
            <div class="loading-placeholder comp-lazy-loading">
                <div class="loading-spinner"></div>
                <p>Caricamento background...</p>
            </div>
        `;
        _compEnsureBackgroundData({ rerender: true });
        return;
    }
    if (_compCurrentTab === 'razze' && !_compHasRaceData()) {
        _compSetStickyTools('');
        container.innerHTML = `
            <div class="loading-placeholder comp-lazy-loading">
                <div class="loading-spinner"></div>
                <p>Caricamento razze...</p>
            </div>
        `;
        _compEnsureRaceData({ rerender: true });
        return;
    }
    if (_compNeedsFeatData() && !_compHasFeatData()) {
        _compSetStickyTools('');
        container.innerHTML = `
            <div class="loading-placeholder comp-lazy-loading">
                <div class="loading-spinner"></div>
                <p>Caricamento talenti...</p>
            </div>
        `;
        _compEnsureFeatData({ rerender: true });
        return;
    }
    if (_compNeedsFightingStyleData() && !_compHasFightingStyleData()) {
        _compSetStickyTools('');
        container.innerHTML = `
            <div class="loading-placeholder comp-lazy-loading">
                <div class="loading-spinner"></div>
                <p>Caricamento stili di combattimento...</p>
            </div>
        `;
        _compEnsureFightingStyleData({ rerender: true });
        return;
    }
    if (_compCurrentTab === 'suppliche' && !_compHasInvocationData()) {
        _compSetStickyTools('');
        container.innerHTML = `
            <div class="loading-placeholder comp-lazy-loading">
                <div class="loading-spinner"></div>
                <p>Caricamento suppliche...</p>
            </div>
        `;
        _compEnsureInvocationData({ rerender: true });
        return;
    }
    if (_compCurrentTab === 'mostri' && _compMostriKind() === 'mostri' && !_compHasMonsterData()) {
        _compSetStickyTools('');
        container.innerHTML = `
            ${_compMostriTabsHtml()}
            <div class="loading-placeholder comp-lazy-loading">
                <div class="loading-spinner"></div>
                <p>Caricamento bestiario...</p>
            </div>
        `;
        _compEnsureMonsterData({ rerender: true });
        return;
    }
    const items = _compItems(_compCurrentTab);
    const state = _compStateFor(_compCurrentTab);
    if (state.detail) {
        const item = items.find(x => String(x.id) === String(state.detail.id));
        if (item) {
            const title = document.getElementById('compendioSubTitle');
            if (title) title.textContent = item.title;
            _compSetStickyTools('');
            container.innerHTML = _compDetailPageHtml(item);
            return;
        }
        state.detail = null;
    }
    const filtered = items.filter(item => _compMatches(item, state));
    _compRenderStickyTools(_compCurrentTab, state, items);
    container.innerHTML = _compListContentHtml(_compCurrentTab, filtered, items.length);
}

window.compendioSetSearch = function(value) {
    _compStateFor(_compCurrentTab).search = value || '';
    clearTimeout(_compSearchRenderTimer);
    _compSearchRenderTimer = setTimeout(() => {
        _compRenderCurrentListContent();
    }, 120);
};

window.compendioSetFilter = function(key, value) {
    const filters = _compStateFor(_compCurrentTab).filters;
    const values = _compFilterValues(value).filter(Boolean);
    if (values.length) filters[key] = values;
    else delete filters[key];
    _compRenderCurrentListContent();
    _compRefreshStickyTools();
};

window.compendioPickFilter = function(key, encodedOptions, title, mode = 'multi') {
    const options = JSON.parse(decodeURIComponent(encodedOptions));
    const current = _compFilterValues(_compStateFor(_compCurrentTab).filters[key]);
    if (mode === 'single') {
        openCustomSelect(options, value => {
            window.compendioSetFilter(key, value);
            const overlay = document.querySelector('.comp-filter-overlay');
            if (overlay) {
                overlay.querySelector('.comp-filter-panel').innerHTML = _compFiltersHtml(_compCurrentTab, _compStateFor(_compCurrentTab), _compItems(_compCurrentTab));
            }
        }, title || 'Filtro');
        return;
    }
    _compOpenInstantMultiSelect(options, current, values => {
        window.compendioSetFilter(key, values);
        const overlay = document.querySelector('.comp-filter-overlay');
        if (overlay) {
            overlay.querySelector('.comp-filter-panel').innerHTML = _compFiltersHtml(_compCurrentTab, _compStateFor(_compCurrentTab), _compItems(_compCurrentTab));
        }
    }, title || 'Filtro');
};

window.compendioResetFilters = function() {
    _compStateFor(_compCurrentTab).filters = {};
    _compRenderCurrentListContent();
    _compRefreshStickyTools();
    const overlay = document.querySelector('.comp-filter-overlay');
    if (overlay) {
        overlay.querySelector('.comp-filter-panel').innerHTML = _compFiltersHtml(_compCurrentTab, _compStateFor(_compCurrentTab), _compItems(_compCurrentTab));
    }
};

window.compendioOpenFilters = function() {
    const state = _compStateFor(_compCurrentTab);
    const items = _compItems(_compCurrentTab);
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay comp-filter-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div class="hp-calc-modal comp-filter-modal">
            <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h2 class="comp-filter-title">Filtri</h2>
            <div class="comp-filter-panel">${_compFiltersHtml(_compCurrentTab, state, items)}</div>
            <div class="comp-filter-actions">
                <button type="button" class="btn-secondary" onclick="compendioResetFilters()">Reset</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

function _compItems(tab) {
    if (tab === 'classi') {
        return (window.CLASSES_DATA || []).map(cls => ({
            type: tab,
            id: cls.slug || cls.name,
            title: _compName(cls) || 'Classe',
            subtitle: '',
            source: 'Manuale',
            search: [cls.name, cls.name_en, cls.prof_skills, cls.prof_skills_en, cls.prof_saving_throws, cls.prof_saving_throws_en, cls.spellcasting_ability, cls.spellcasting_ability_en].join(' '),
            tags: [cls.hit_dice, _compField(cls, 'prof_saving_throws')].filter(Boolean),
            desc: '',
            data: cls,
        }));
    }
    if (tab === 'oggetti') {
        return [];
    }
    if (tab === 'mostri') {
        return _compMonsterItems();
    }
    if (tab === 'talenti_stili') {
        return _compTalentiStiliKind() === 'stili'
            ? _compStyleItems('talenti_stili')
            : _compFeatItems('talenti_stili');
    }
    if (tab === 'sottoclassi') {
        return (window.CLASSES_DATA || []).flatMap(cls => (cls.subclasses || []).map(sub => ({
            type: tab,
            id: `${cls.slug || cls.name}:${sub.slug || sub.name}`,
            title: _compName(sub) || 'Sottoclasse',
            subtitle: _compName(cls) || '',
            source: _compName(cls) || '',
            group: _compName(cls) || '',
            search: [sub.name, sub.name_en, cls.name, cls.name_en, ...(sub.features || []).map(f => `${f.name} ${f.description}`)].join(' '),
            tags: [],
            desc: '',
            data: { ...sub, parent_class_slug: cls.slug, className: cls.name, classNameEn: cls.name_en, classLabel: _compName(cls) },
        })));
    }
    if (tab === 'razze') {
        return _compRaceItems();
    }
    if (tab === 'background') {
        return Object.entries(window.BACKGROUNDS_DATA || {}).map(([key, bg]) => ({
            type: tab,
            id: key,
            title: _compName(bg) || key,
            subtitle: '',
            source: bg.source_short || bg.source || '',
            search: [bg.name, bg.name_en, bg.description, bg.feature_name, bg.feature?.name, bg.feature_description, bg.feature?.description, bg.skill_proficiencies].join(' '),
            tags: [_compArrayLabel(bg.skill_proficiencies)].filter(Boolean),
            desc: '',
            data: bg,
        }));
    }
    if (tab === 'talenti') {
        return _compFeatItems('talenti');
    }
    if (tab === 'stili') {
        return _compStyleItems('stili');
    }
    if (tab === 'suppliche') {
        return _compObjectValues(window.INVOCATIONS_DATA).map(inv => ({
            type: tab,
            id: inv.id || inv.slug || inv.name || inv.name_en,
            title: _compName(inv) || inv.name_it || 'Supplica',
            subtitle: '',
            source: inv.source_short || inv.source || '',
            search: [inv.name, inv.name_it, inv.name_en, inv.description, inv.prerequisites].join(' '),
            tags: [_compPrereqLabel(inv.prerequisites)].filter(Boolean),
            desc: '',
            data: inv,
        }));
    }
    if (tab === 'incantesimi') {
        return Object.entries(window.SPELLS_DATA || {}).map(([key, sp]) => ({
            type: tab,
            id: key,
            title: _compSpellField(sp, 'name') || key,
            subtitle: '',
            source: _compSpellSource(sp),
            group: _compSpellLevel(sp.level),
            sortLevel: Number(sp.level) || 0,
            search: [sp.name, sp.name_en, sp.school_it, sp.school, sp.components, sp.components_en, sp.duration, sp.duration_en, (sp.classes || []).join(' '), (sp.classes_en || []).join(' '), sp.description, sp.description_en].join(' '),
            tags: [_compSpellField(sp, 'school'), _compSpellField(sp, 'duration')].filter(Boolean),
            desc: '',
            data: sp,
        }));
    }
    return [];
}

function _compTalentiStiliKind() {
    const state = _compStateFor('talenti_stili');
    return state.kind === 'stili' ? 'stili' : 'talenti';
}

function _compFeatItems(tabKey = 'talenti') {
    return Object.entries(window.FEATS_DATA || {}).map(([key, feat]) => ({
        tab: tabKey,
        type: 'talenti',
        id: key,
        title: _compName(feat) || key,
        subtitle: '',
        source: feat.source_short || feat.source || '',
        search: [feat.name, feat.name_en, feat.prerequisites, feat.description].join(' '),
        tags: [feat.prerequisites ? `Prereq: ${feat.prerequisites}` : 'Nessun prerequisito'].filter(Boolean),
        desc: '',
        data: feat,
    }));
}

function _compStyleItems(tabKey = 'stili') {
    return _compObjectValues(window.FIGHTING_STYLES_DATA).map(style => ({
        tab: tabKey,
        type: 'stili',
        id: style.slug || style.name || style.name_en,
        title: _compName(style) || style.name_it || 'Stile',
        subtitle: '',
        source: style.source_short || style.source || '',
        search: [style.name, style.name_it, style.name_en, style.description, style.classes].join(' '),
        tags: [_compArrayLabel(style.classes)].filter(Boolean),
        desc: '',
        data: style,
    }));
}

function _compMostriKind() {
    const state = _compStateFor('mostri');
    return state.kind === 'combattimenti' ? 'combattimenti' : 'mostri';
}

function _compMonsterItems() {
    if (_compMostriKind() === 'combattimenti') return [];
    const data = COMP_MONSTERS_DATA || [];
    if (_compMonsterItemsCache && _compMonsterItemsSource === data) return _compMonsterItemsCache;
    _compMonsterItemsSource = data;
    _compMonsterItemsCache = data.map(monster => {
        const source = monster.fonte_breve || monster.fonte || '';
        const challenge = String(monster.grado_sfida || '').trim() || 'Senza GS';
        return {
            type: 'mostri',
            id: monster.id || `${monster.nome}-${monster.pagina_pdf || ''}`,
            title: monster.nome || 'Mostro',
            subtitle: '',
            source,
            sources: source ? [source] : [],
            group: _compMonsterChallengeLabel(challenge),
            sortChallenge: _compMonsterChallengeValue(challenge),
            search: _compMonsterSearchText(monster),
            tags: [monster.tipo, monster.allineamento_breve].filter(Boolean),
            desc: '',
            data: monster,
        };
    });
    return _compMonsterItemsCache;
}

function _compMonsterSearchText(monster) {
    if (!monster) return '';
    return [
        monster.nome,
        monster.fonte,
        monster.fonte_breve,
        monster.tipo_linea,
        monster.tipo,
        monster.taglia,
        monster.allineamento,
        monster.allineamento_breve,
        monster.grado_sfida,
        monster.tiri_salvezza_testo,
        monster.abilita_testo,
        monster.vulnerabilita_testo,
        monster.resistenze_testo,
        monster.immunita_danni_testo,
        monster.immunita_condizioni_testo,
        monster.sensi,
        monster.linguaggi,
        monster.tratti,
        monster.azioni,
        monster.reazioni,
        monster.azioni_leggendarie,
    ].join(' ');
}

function _compRaceItems() {
    const byRace = new Map();
    let raceOrder = 0;
    Object.entries(window.RACES_DATA || {}).forEach(([key, race]) => {
        const raceLabel = _compRaceBaseLabel(race, key);
        const groupKey = race.version_group || _compSlug(race.name_en || race.name || key);
        const baseSearch = _compRaceSearchText(key, race);
        const baseEntry = {
            id: race.version_id || key,
            key,
            title: raceLabel,
            subtitle: '',
            source: race.source_short || race.source || '',
            data: race,
            baseRace: race,
            baseRaceKey: key,
            isSubrace: false,
            order: raceOrder++,
            search: baseSearch,
        };
        _compPushRaceVersion(byRace, groupKey, raceLabel, baseEntry, false);
        (race.subraces || []).forEach(sub => {
            const entry = {
                id: sub.version_id || `${key}:${sub.name || sub.name_en}`,
                key: `${key}:${sub.name || sub.name_en}`,
                title: _compName(sub) || 'Sottorazza',
                subtitle: raceLabel,
                source: sub.source_short || sub.source || race.source_short || race.source || '',
                data: sub,
                baseRace: race,
                baseRaceKey: key,
                isSubrace: true,
                order: raceOrder++,
                search: [baseSearch, _compRaceSearchText(sub.name || sub.name_en || '', sub)].join(' '),
            };
            _compPushRaceVersion(byRace, groupKey, raceLabel, entry, true);
        });
    });
    return Array.from(byRace.entries()).map(([id, raceGroup]) => {
        const versions = _compSortRaceVersions(raceGroup.versions);
        const subraces = _compSortRaceSubraceGroups(Array.from(raceGroup.subraces.values()).map(subrace => ({
            ...subrace,
            versions: _compSortRaceVersions(subrace.versions),
        })));
        const allVersions = [...versions, ...subraces.flatMap(subrace => subrace.versions)];
        const sources = _compUnique(allVersions.map(version => version.source).filter(Boolean));
        return {
            type: 'razze',
            id,
            title: raceGroup.title,
            subtitle: '',
            source: sources.join(', '),
            sources,
            group: '',
            tags: sources,
            desc: '',
            search: allVersions.map(version => version.search).join(' '),
            data: { title: raceGroup.title, versions, subraces },
        };
    });
}

function _compPushRaceVersion(map, groupKey, raceLabel, entry, isSubrace) {
    if (!map.has(groupKey)) map.set(groupKey, { title: raceLabel, versions: [], subraces: new Map() });
    const raceGroup = map.get(groupKey);
    if (!isSubrace) {
        raceGroup.versions.push(entry);
        return;
    }
    const subraceKey = entry.data.version_group || _compSlug(entry.data.name_en || entry.data.name || entry.title);
    if (!raceGroup.subraces.has(subraceKey)) {
        raceGroup.subraces.set(subraceKey, { id: subraceKey, title: entry.title, versions: [] });
    }
    raceGroup.subraces.get(subraceKey).versions.push(entry);
}

function _compRaceBaseLabel(race, fallback) {
    if (_compLang() === 'en') return race.name_en || race.name || fallback;
    return race.name || race.name_en || fallback;
}

function _compRaceSearchText(key, race) {
    return [
        key,
        race.name,
        race.name_en,
        race.version_label,
        race.source_short,
        race.source,
        race.description,
        race.description_en,
        race.asi_text,
        race.asi_text_en,
        (race.traits || race.features || []).map(t => `${t.name || ''} ${t.name_en || ''} ${t.description || ''} ${t.description_en || ''}`).join(' '),
    ].join(' ');
}

function _compSortRaceVersions(versions) {
    const collator = new Intl.Collator(_compLang() === 'en' ? 'en' : 'it');
    return [...versions].sort((a, b) => {
        const sourceOrder = _compRaceSourceOrder(a.source) - _compRaceSourceOrder(b.source);
        if (sourceOrder !== 0) return sourceOrder;
        const baseOrder = Number(a.isSubrace) - Number(b.isSubrace);
        if (baseOrder !== 0) return baseOrder;
        const manualOrder = (a.order || 0) - (b.order || 0);
        if (manualOrder !== 0) return manualOrder;
        return collator.compare(a.title || '', b.title || '');
    });
}

function _compSortRaceSubraceGroups(subraces) {
    const collator = new Intl.Collator(_compLang() === 'en' ? 'en' : 'it');
    return [...subraces].sort((a, b) => collator.compare(a.title || '', b.title || ''));
}

function _compRaceSourceOrder(source) {
    const order = { MMM: 0, PHB: 10, TCOE: 12, VGtM: 20, ERLW: 25, MToF: 30, SCAG: 40, ToA: 50 };
    return order[String(source || '').trim()] ?? 99;
}

function _compSlug(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'elemento';
}

function _compToolbarHtml(tab, state, allItems) {
    if (tab === 'mostri' && _compMostriKind() === 'combattimenti') return '';
    const activeFilters = _compActiveFiltersCount(state);
    const filtersHtml = _compFiltersHtml(tab, state, allItems);
    return `
        <div class="comp-toolbar page-tools-row">
            <label class="comp-search-wrap">
                ${_compIcon('search')}
                <input class="comp-search" type="search" placeholder="Cerca in ${escapeHtml(COMP_TABS[tab].label.toLowerCase())}..."
                    value="${escapeHtml(state.search || '')}" oninput="compendioSetSearch(this.value)">
            </label>
            ${filtersHtml ? `<button type="button" class="comp-filter-btn" onclick="compendioOpenFilters()">
                ${_compIcon('sliders')}
                <span>Filtri</span>
                ${activeFilters ? `<strong id="compFiltersBadge">${activeFilters}</strong>` : '<strong id="compFiltersBadge" style="display:none;"></strong>'}
            </button>` : ''}
        </div>
    `;
}

function _compActiveFiltersCount(state) {
    return Object.values(state?.filters || {}).reduce((count, value) => count + _compFilterValues(value).length, 0);
}

function _compSetStickyTools(html) {
    const target = document.getElementById('compendioStickyTools');
    if (target) target.innerHTML = html || '';
}

function _compRenderStickyTools(tab, state, items) {
    _compSetStickyTools(_compToolbarHtml(tab, state, items));
}

function _compRefreshStickyTools() {
    if (_compCurrentTab === 'oggetti') {
        _compRenderObjectsStickyTools();
        return;
    }
    const items = _compItems(_compCurrentTab);
    const state = _compStateFor(_compCurrentTab);
    if (state.detail) return;
    _compRenderStickyTools(_compCurrentTab, state, items);
}

function _compListContentHtml(tab, filtered, total) {
    if (tab === 'mostri' && _compMostriKind() === 'combattimenti') {
        return `
            ${_compMostriTabsHtml()}
            <div class="comp-empty">La sezione Combattimenti sara disponibile in un prossimo aggiornamento.</div>
        `;
    }
    return `
        ${tab === 'mostri' ? _compMostriTabsHtml() : ''}
        ${tab === 'talenti_stili' ? _compTalentiStiliTabsHtml() : ''}
        <p class="comp-count">${filtered.length} risultati su ${total}</p>
        ${filtered.length ? _compListHtml(tab, filtered) : '<div class="comp-empty">Nessun elemento trovato</div>'}
    `;
}

function _compMostriTabsHtml() {
    const kind = _compMostriKind();
    return `
        <div class="lab-subtabs comp-inner-tabs">
            <button type="button" class="lab-subtab ${kind === 'mostri' ? 'active' : ''}" onclick="compendioMostriSetKind('mostri')">
                <span>Mostri</span>
            </button>
            <button type="button" class="lab-subtab ${kind === 'combattimenti' ? 'active' : ''}" onclick="compendioMostriSetKind('combattimenti')">
                <span>Combattimenti</span>
            </button>
        </div>
    `;
}

window.compendioMostriSetKind = function(kind) {
    const state = _compStateFor('mostri');
    state.kind = kind === 'combattimenti' ? 'combattimenti' : 'mostri';
    state.detail = null;
    compendioRenderTab();
    if (state.kind === 'mostri') _compEnsureMonsterData({ rerender: true });
    _compScrollToTop();
};

function _compTalentiStiliTabsHtml() {
    const kind = _compTalentiStiliKind();
    return `
        <div class="lab-subtabs comp-inner-tabs">
            <button type="button" class="lab-subtab ${kind === 'talenti' ? 'active' : ''}" onclick="compendioTalentiStiliSetKind('talenti')">
                <span>Talenti</span>
            </button>
            <button type="button" class="lab-subtab ${kind === 'stili' ? 'active' : ''}" onclick="compendioTalentiStiliSetKind('stili')">
                <span>Stili di Combattimento</span>
            </button>
        </div>
    `;
}

window.compendioTalentiStiliSetKind = function(kind) {
    const state = _compStateFor('talenti_stili');
    state.kind = kind === 'stili' ? 'stili' : 'talenti';
    state.detail = null;
    compendioRenderTab();
    _compScrollToTop();
};

function _compRenderCurrentListContent() {
    if (_compCurrentTab === 'oggetti') {
        _compRenderObjectsInventoryList();
        return;
    }
    const container = document.getElementById('compendioContent');
    const state = _compStateFor(_compCurrentTab);
    if (!container || state.detail) return;
    const items = _compItems(_compCurrentTab);
    const filtered = items.filter(item => _compMatches(item, state));
    container.innerHTML = _compListContentHtml(_compCurrentTab, filtered, items.length);
}

function _compFiltersHtml(tab, state, allItems) {
    const f = state.filters || {};
    if (tab === 'mostri') {
        if (_compMostriKind() === 'combattimenti') return '';
        const challenges = _compUnique(allItems.map(i => i.data.grado_sfida).filter(Boolean))
            .sort((a, b) => _compMonsterChallengeValue(a) - _compMonsterChallengeValue(b));
        const types = _compUnique(allItems.map(i => i.data.tipo).filter(Boolean));
        const sources = _compUnique(allItems.flatMap(i => i.sources || i.source || []).filter(Boolean));
        const saves = _compUnique(allItems.flatMap(i => i.data.tiri_salvezza || []).filter(Boolean));
        const resistances = _compUnique(allItems.flatMap(i => i.data.resistenze || []).filter(Boolean));
        const immunities = _compUnique(allItems.flatMap(i => i.data.immunita_danni || []).filter(Boolean));
        const vulnerabilities = _compUnique(allItems.flatMap(i => i.data.vulnerabilita || []).filter(Boolean));
        return [
            _compSelect('challenge', f.challenge, [['', 'Tutti'], ...challenges.map(v => [v, _compMonsterChallengeLabel(v)])], 'Grado sfida', 'multi'),
            _compSelect('type', f.type, [['', 'Tutte'], ...types.map(v => [v, v])], 'Tipologia', 'multi'),
            sources.length > 1 ? _compSelect('source', f.source, [['', 'Tutte'], ...sources.map(v => [v, v])], 'Fonte', 'multi') : '',
            saves.length ? _compSelect('save', f.save, [['', 'Tutti'], ...saves.map(v => [v, v])], 'Tiri salvezza', 'multi') : '',
            resistances.length ? _compSelect('resistance', f.resistance, [['', 'Tutte'], ...resistances.map(v => [v, v])], 'Resistenze', 'multi') : '',
            immunities.length ? _compSelect('immunity', f.immunity, [['', 'Tutte'], ...immunities.map(v => [v, v])], 'Immunita', 'multi') : '',
            vulnerabilities.length ? _compSelect('vulnerability', f.vulnerability, [['', 'Tutte'], ...vulnerabilities.map(v => [v, v])], 'Vulnerabilita', 'multi') : '',
        ].join('');
    }
    if (tab === 'incantesimi') {
        const schools = _compUnique(allItems.map(i => i.data.school_it || i.data.school).filter(Boolean));
        const classes = _compSpellClassOptions(allItems);
        const sources = _compUnique(allItems.map(i => i.source).filter(Boolean));
        return [
            _compSelect('level', f.level, [['', 'Tutti'], ['0', 'Trucchetti'], ...Array.from({ length: 9 }, (_, i) => [String(i + 1), `Livello ${i + 1}`])], 'Livello'),
            _compSelect('school', f.school, [['', 'Tutte'], ...schools.map(v => [v, v])], 'Scuola'),
            _compSelect('component', f.component, [['', 'Tutte'], ['V', 'V'], ['S', 'S'], ['M', 'M']], 'Componenti'),
            _compSelect('concentration', f.concentration, [['', 'Tutti'], ['yes', 'Si'], ['no', 'No']], 'Concentrazione'),
            _compSelect('ritual', f.ritual, [['', 'Tutti'], ['yes', 'Si'], ['no', 'No']], 'Rituale'),
            _compSelect('class', f.class, [['', 'Tutte'], ...classes.map(v => [v, v])], 'Classe'),
            _compSelect('source', f.source, [['', 'Tutte'], ...sources.map(v => [v, v])], 'Fonte'),
        ].join('');
    }
    const sources = _compUnique(allItems.flatMap(i => i.sources || i.source || []).filter(Boolean));
    const base = sources.length > 1 ? _compSelect('source', f.source, [['', 'Tutte'], ...sources.map(v => [v, v])], 'Fonte') : '';
    if (tab === 'sottoclassi') {
        const classes = _compUnique(allItems.map(i => i.data.className).filter(Boolean));
        return base + _compSelect('class', f.class, [['', 'Tutte'], ...classes.map(v => [v, v])], 'Classe');
    }
    if (tab === 'razze') {
        return base;
    }
    return base;
}

function _compSelect(key, value, options, title, mode = '') {
    const selected = _compFilterValues(value);
    const nonEmpty = options.filter(([v]) => String(v || '') !== '');
    const isSingle = mode ? mode === 'single' : nonEmpty.length === 2;
    const normalized = (isSingle ? options : nonEmpty).map(([v, label]) => ({ value: String(v || ''), label }));
    const encoded = encodeURIComponent(JSON.stringify(normalized)).replace(/'/g, '%27');
    const selectedLabel = isSingle && selected.length
        ? normalized.find(opt => opt.value === selected[0])?.label || selected[0]
        : selected.length;
    return `<button type="button" class="custom-select-trigger comp-filter-select" onclick="compendioPickFilter('${key}','${encoded}','${_compEscapeAttr(title || 'Filtro')}','${isSingle ? 'single' : 'multi'}')" data-value="${_compEscapeAttr(selected.join(','))}">
        ${escapeHtml(title || 'Filtro')}
        ${selected.length ? `<small>${escapeHtml(selectedLabel)}</small>` : ''}
    </button>`;
}

function _compMatchesAnyFilter(selected, values) {
    if (!selected.length) return true;
    const normalized = new Set((values || []).map(v => String(v || '').trim().toLowerCase()).filter(Boolean));
    return selected.some(value => normalized.has(String(value || '').trim().toLowerCase()));
}

function _compMatches(item, state) {
    const q = (state.search || '').trim().toLowerCase();
    if (q && !String(item.search || '').toLowerCase().includes(q) && !String(item.title || '').toLowerCase().includes(q)) {
        return false;
    }
    const f = state.filters || {};
    const sources = _compFilterValues(f.source);
    const groups = _compFilterValues(f.group);
    const classes = _compFilterValues(f.class);
    if (sources.length) {
        const itemSources = item.sources || (item.source ? [item.source] : []);
        if (!sources.some(source => itemSources.includes(source))) return false;
    }
    if (groups.length && item.type !== 'razze' && !groups.includes(item.group)) return false;
    if (classes.length) {
        if (item.type === 'sottoclassi' && !classes.some(cls => item.data.className === cls || item.data.classNameEn === cls)) return false;
        if (item.type === 'incantesimi' && !classes.some(cls => _compSpellMatchesClass(item.data, cls))) return false;
    }
    if (item.type === 'mostri') {
        const monster = item.data;
        const challenges = _compFilterValues(f.challenge);
        const types = _compFilterValues(f.type);
        const saves = _compFilterValues(f.save);
        const resistances = _compFilterValues(f.resistance);
        const immunities = _compFilterValues(f.immunity);
        const vulnerabilities = _compFilterValues(f.vulnerability);
        if (challenges.length && !challenges.includes(String(monster.grado_sfida || '').trim())) return false;
        if (types.length && !types.includes(monster.tipo)) return false;
        if (!_compMatchesAnyFilter(saves, monster.tiri_salvezza)) return false;
        if (!_compMatchesAnyFilter(resistances, monster.resistenze)) return false;
        if (!_compMatchesAnyFilter(immunities, monster.immunita_danni)) return false;
        if (!_compMatchesAnyFilter(vulnerabilities, monster.vulnerabilita)) return false;
    }
    if (item.type === 'incantesimi') {
        const sp = item.data;
        const levels = _compFilterValues(f.level);
        const schools = _compFilterValues(f.school);
        const components = _compFilterValues(f.component);
        const concentrations = _compFilterValues(f.concentration);
        const rituals = _compFilterValues(f.ritual);
        if (levels.length && !levels.includes(String(sp.level))) return false;
        if (schools.length && !schools.includes(sp.school_it || sp.school)) return false;
        if (components.length && !components.some(component => _compSpellHasComponent(sp, component))) return false;
        if (concentrations.length === 1 && concentrations[0] === 'yes' && !_compSpellIsConcentration(sp)) return false;
        if (concentrations.length === 1 && concentrations[0] === 'no' && _compSpellIsConcentration(sp)) return false;
        if (rituals.length === 1 && rituals[0] === 'yes' && !_compSpellIsRitual(sp)) return false;
        if (rituals.length === 1 && rituals[0] === 'no' && _compSpellIsRitual(sp)) return false;
    }
    return true;
}

function _compListHtml(tab, items) {
    const sorted = _compSortItems(tab, items);
    if (tab === 'sottoclassi' || tab === 'incantesimi' || tab === 'mostri') {
        const groups = _compGroupItems(sorted);
        const state = _compStateFor(tab);
        return `<div class="comp-grouped-list">${groups.map(group => `
            <section class="comp-group">
                <button type="button" class="comp-group-divider ${_compGroupOpen(tab, group.label, state) ? 'open' : ''}" onclick="compendioToggleGroup('${_compEscapeAttr(group.label)}')">
                    ${_compIcon('chevron-right')}
                    <span>${escapeHtml(group.label)}</span>
                    <small>${group.items.length}</small>
                </button>
                <div class="comp-list" ${_compGroupOpen(tab, group.label, state) ? '' : 'style="display:none;"'}>${group.items.map(item => _compCardHtml(item)).join('')}</div>
            </section>
        `).join('')}</div>`;
    }
    return `<div class="comp-list">${sorted.map(item => _compCardHtml(item)).join('')}</div>`;
}

function _compGroupOpen(tab, label, state) {
    if (Object.prototype.hasOwnProperty.call(state.openGroups || {}, label)) return !!state.openGroups[label];
    return tab === 'incantesimi';
}

window.compendioToggleGroup = function(label) {
    const state = _compStateFor(_compCurrentTab);
    state.openGroups = state.openGroups || {};
    state.openGroups[label] = !_compGroupOpen(_compCurrentTab, label, state);
    compendioRenderTab();
};

function _compSortItems(tab, items) {
    const collator = new Intl.Collator(_compLang() === 'en' ? 'en' : 'it');
    return [...items].sort((a, b) => {
        if (tab === 'mostri') {
            const challenge = (a.sortChallenge ?? 999) - (b.sortChallenge ?? 999);
            if (challenge !== 0) return challenge;
        }
        if (tab === 'incantesimi') {
            const lvl = (a.sortLevel || 0) - (b.sortLevel || 0);
            if (lvl !== 0) return lvl;
        }
        const g = collator.compare(a.group || '', b.group || '');
        if (g !== 0) return g;
        return collator.compare(a.title || '', b.title || '');
    });
}

function _compGroupItems(items) {
    const groups = [];
    items.forEach(item => {
        const label = item.group || 'Altro';
        let group = groups.find(g => g.label === label);
        if (!group) {
            group = { label, items: [] };
            groups.push(group);
        }
        group.items.push(item);
    });
    return groups;
}

function _compCardHtml(item) {
    if (item.type === 'mostri') return _compMonsterCardHtml(item);
    if (item.type === 'incantesimi') return _compSpellCardHtml(item);
    const tabKey = item.tab || item.type;
    if (item.type === 'sottoclassi' || item.type === 'razze') {
        return `
            <article class="comp-card comp-card-compact" onclick="compendioOpenDetail('${tabKey}', '${_compEscapeAttr(item.id)}')">
                <div class="comp-card-main">
                    <h2 class="comp-card-title">${escapeHtml(item.title)}</h2>
                    ${item.type === 'razze' && item.source ? `<span class="comp-card-source">${escapeHtml(item.source)}</span>` : ''}
                </div>
            </article>
        `;
    }
    return `
        <article class="comp-card" onclick="compendioOpenDetail('${tabKey}', '${_compEscapeAttr(item.id)}')">
            <div class="comp-card-main">
                <h2 class="comp-card-title">${escapeHtml(item.title)}</h2>
                ${item.source ? `<span class="comp-card-source">${escapeHtml(item.source)}</span>` : ''}
            </div>
            <div class="comp-card-meta">${(item.tags || []).slice(0, item.type === 'classi' ? 2 : 4).map(t => `<span class="comp-tag">${escapeHtml(t)}</span>`).join('')}</div>
            ${item.desc ? `<p class="comp-card-desc">${escapeHtml(_compPlain(item.desc))}</p>` : ''}
        </article>
    `;
}

function _compSpellCardHtml(item) {
    const sp = item.data;
    const tabKey = item.tab || item.type;
    return `
        <article class="comp-card comp-spell-card" onclick="compendioOpenDetail('${tabKey}', '${_compEscapeAttr(item.id)}')">
            <div class="comp-spell-card-body">
                <h2 class="comp-card-title">${escapeHtml(item.title)}</h2>
                <div class="comp-spell-card-meta">
                    <span>${escapeHtml(_compSpellField(sp, 'school'))}</span>
                    <span>${escapeHtml(_compSpellField(sp, 'duration'))}</span>
                </div>
            </div>
            <div class="comp-spell-level">${escapeHtml(_compSpellLevelShort(sp.level))}</div>
        </article>
    `;
}

window.compendioOpenDetail = async function(type, id) {
    const item = _compItems(type).find(x => String(x.id) === String(id));
    if (!item) return;
    if (type === 'incantesimi') await _compEnsureSummonStatblockData();
    _compCurrentTab = type;
    _compStateFor(type).detail = { id };
    compendioRenderTab();
    _compScrollToTop();
};

function _compDetailPageHtml(item) {
    return `
        <div class="comp-detail-page">
            ${_compDetailHtml(item)}
        </div>
    `;
}

function _compDetailHtml(item) {
    const d = item.data;
    if (item.type === 'classi') return _compClassDetail(d);
    if (item.type === 'sottoclassi') return _compFeatureDetail(item.title, item.subtitle, d.features || [], d);
    if (item.type === 'razze') return _compRaceDetail(d, item.title, item.subtitle);
    if (item.type === 'background') return _compBackgroundDetail(d, item.title, item.subtitle);
    if (item.type === 'talenti') return _compSimpleDetail(item, [['Prerequisiti', d.prerequisites || 'Nessuno'], ['Fonte', d.source || d.source_short || '']]);
    if (item.type === 'stili') return _compSimpleDetail(item, [['Classi', _compArrayLabel(d.classes) || ''], ['Fonte', d.source || d.source_short || '']]);
    if (item.type === 'suppliche') return _compSimpleDetail(item, [['Prerequisiti', _compPrereqLabel(d.prerequisites) || 'Nessuno'], ['Fonte', d.source || d.source_short || '']]);
    if (item.type === 'incantesimi') return _compSpellDetail(d);
    if (item.type === 'mostri') return _compMonsterDetail(d);
    return _compSimpleDetail(item, []);
}

function _compMonsterDetail(monster) {
    const source = [monster.fonte_breve || monster.fonte, monster.pagina_pdf ? `pag. ${monster.pagina_pdf}` : ''].filter(Boolean).join(' - ');
    const challenge = `${_compMonsterChallengeLabel(monster.grado_sfida)}${monster.pe ? ` (${monster.pe})` : ''}`;
    return `
        ${_compMonsterSummaryBoxes([
            ['Tipo', monster.tipo_linea || monster.tipo],
            ['Allineamento', monster.allineamento || monster.allineamento_breve],
            ['Classe Armatura', monster.classe_armatura],
            ['Punti Ferita', monster.punti_ferita],
            ['Velocita', monster.velocita],
            ['Grado sfida', challenge],
        ])}
        ${_compMonsterAbilitiesTable(monster.caratteristiche)}
        ${_compMonsterFactsSection(monster)}
        ${_compMonsterTextSection('Tratti', monster.tratti)}
        ${_compMonsterTextSection('Azioni', monster.azioni)}
        ${_compMonsterTextSection('Azioni bonus', monster.azioni_bonus)}
        ${_compMonsterTextSection('Reazioni', monster.reazioni)}
        ${_compMonsterTextSection('Azioni leggendarie', monster.azioni_leggendarie)}
        ${_compMonsterTextSection('Azioni mitiche', monster.azioni_mitiche)}
        ${_compMonsterTextSection('Azioni di tana', monster.azioni_tana)}
        ${source ? `<div class="comp-monster-source">Fonte: ${escapeHtml(source)}</div>` : ''}
    `;
}

function _compMonsterSummaryBoxes(boxes) {
    const html = _compBoxes(boxes.map(([label, value]) => [label, _compMonsterTranslateText(value)]));
    return html.replace('comp-detail-grid', 'comp-detail-grid comp-monster-summary-grid');
}

function _compMonsterAbilitiesTable(abilities) {
    const keys = [
        ['forza', 'FOR'],
        ['destrezza', 'DES'],
        ['costituzione', 'COS'],
        ['intelligenza', 'INT'],
        ['saggezza', 'SAG'],
        ['carisma', 'CAR'],
    ];
    if (!abilities || !keys.some(([key]) => abilities[key]?.score != null)) return '';
    return `<section class="comp-detail-section">
        <h3>Caratteristiche</h3>
        <div class="comp-table-wrap">
            <table class="comp-equipment-table comp-monster-abilities-table">
                <thead><tr>${keys.map(([, label]) => `<th>${label}</th>`).join('')}</tr></thead>
                <tbody>
                    <tr>${keys.map(([key]) => {
                        const stat = abilities[key] || {};
                        return `<td><strong>${escapeHtml(String(stat.score ?? '-'))}</strong><span>${escapeHtml(_compSigned(stat.mod))}</span></td>`;
                    }).join('')}</tr>
                </tbody>
            </table>
        </div>
    </section>`;
}

function _compMonsterFactsSection(monster) {
    const rows = [
        ['Tiri salvezza', monster.tiri_salvezza_testo],
        ['Abilita', monster.abilita_testo],
        ['Vulnerabilita ai danni', monster.vulnerabilita_testo],
        ['Resistenze ai danni', monster.resistenze_testo],
        ['Immunita ai danni', monster.immunita_danni_testo],
        ['Immunita alle condizioni', monster.immunita_condizioni_testo],
        ['Sensi', monster.sensi],
        ['Linguaggi', monster.linguaggi],
    ].filter(([, value]) => value != null && String(value).trim() !== '');
    if (!rows.length) return '';
    return `<section class="comp-detail-section">
        <h3>Difese e sensi</h3>
        <div class="comp-monster-facts">
            ${rows.map(([label, value]) => `
                <div class="comp-monster-fact">
                    <strong>${escapeHtml(label)}</strong>
                    <span>${escapeHtml(_compMonsterTranslateText(value))}</span>
                </div>
            `).join('')}
        </div>
    </section>`;
}

function _compMonsterTextSection(title, text) {
    if (!text || !String(text).trim()) return '';
    return `<section class="comp-detail-section">
        <h3>${escapeHtml(title)}</h3>
        <div class="comp-rich comp-monster-text">${_compMonsterRich(text)}</div>
    </section>`;
}

function _compMonsterRich(text) {
    const raw = String(text || '').trim();
    if (!raw) return '<p>Nessuna descrizione disponibile.</p>';
    const translated = _compMonsterTranslateText(raw);
    return translated.split(/\n{2,}/)
        .map(paragraph => _compRich(paragraph, { linkSpells: _compMonsterParagraphHasSpellList(paragraph) }))
        .join('');
}

function _compMonsterTranslateText(text) {
    let out = String(text || '');
    if (!out) return '';
    out = _compMonsterTranslateTitles(out);
    const replacements = [
        [/\bMelee or Ranged Weapon Attack\b/g, 'Attacco con arma da mischia o a distanza'],
        [/\bMelee Weapon Attack\b/g, 'Attacco con arma da mischia'],
        [/\bRanged Weapon Attack\b/g, 'Attacco con arma a distanza'],
        [/\bMelee Spell Attack\b/g, 'Attacco con incantesimo da mischia'],
        [/\bRanged Spell Attack\b/g, 'Attacco con incantesimo a distanza'],
        [/\bHit:\b/g, 'Colpito:'],
        [/\bto hit\b/g, 'al tiro per colpire'],
        [/\breach\b/g, 'portata'],
        [/\brange\b/g, 'gittata'],
        [/\bone target\b/g, 'un bersaglio'],
        [/\bone creature\b/g, 'una creatura'],
        [/\ba target\b/g, 'un bersaglio'],
        [/\bthe target\b/g, 'il bersaglio'],
        [/\bThe target\b/g, 'Il bersaglio'],
        [/\btarget\b/g, 'bersaglio'],
        [/\bcreature\b/g, 'creatura'],
        [/\bcreatures\b/g, 'creature'],
        [/\ballied\b/g, 'alleato'],
        [/\bUndead\b/g, 'Non Morto'],
        [/\bundead\b/g, 'non morto'],
        [/\bcan take (\d+) legendary actions\b/gi, 'puo effettuare $1 azioni leggendarie'],
        [/\bchoosing from the options below\b/gi, 'scegliendo tra le opzioni seguenti'],
        [/\bOnly one legendary action option can be used at a time\b/gi, 'Puo usare solo una opzione di azione leggendaria alla volta'],
        [/\bonly at the end of another creature's turn\b/gi, 'solo alla fine del turno di un altra creatura'],
        [/\bonly at the end of another creatura's turn\b/gi, 'solo alla fine del turno di un altra creatura'],
        [/\bregains spent legendary actions at the start of (?:its|his|her) turn\b/gi, 'recupera le azioni leggendarie spese all inizio del suo turno'],
        [/\bregains spent legendary actions all'inizio del suo turno\b/gi, 'recupera le azioni leggendarie spese all inizio del suo turno'],
        [/\bThe ([^.]+?) makes one ([^.]+?) attack\b/g, 'Il $1 effettua un attacco con $2'],
        [/\bThe ([^.]+?) makes two ([^.]+?) attacks\b/g, 'Il $1 effettua due attacchi con $2'],
        [/\bThe ([^.]+?) makes three ([^.]+?) attacks\b/g, 'Il $1 effettua tre attacchi con $2'],
        [/\bThe ([^.]+?) makes four ([^.]+?) attacks\b/g, 'Il $1 effettua quattro attacchi con $2'],
        [/\bIt can replace one of the attacks with a use of Spellcasting\b/g, 'Puo sostituire uno degli attacchi con un uso di Incantesimi'],
        [/\bIt can replace one attack with a use of Spellcasting\b/g, 'Puo sostituire un attacco con un uso di Incantesimi'],
        [/\bcan replace one of the attacks with a use of Spellcasting\b/g, 'puo sostituire uno degli attacchi con un uso di Incantesimi'],
        [/\bcan replace one attack with a use of Spellcasting\b/g, 'puo sostituire un attacco con un uso di Incantesimi'],
        [/\bcasts one of the following spells\b/gi, 'lancia uno dei seguenti incantesimi'],
        [/\brequiring no material components\b/gi, 'senza componenti materiali'],
        [/\busing ([A-Za-z]+) as the spellcasting ability\b/g, 'usando $1 come caratteristica da incantatore'],
        [/\bspellcasting ability is ([A-Za-z]+)\b/g, 'caratteristica da incantatore e $1'],
        [/\bwith spell attacks\b/g, 'agli attacchi con incantesimo'],
        [/\bmust make a tiro salvezza\b/g, 'deve effettuare un tiro salvezza'],
        [/\bmust succeed on a tiro salvezza\b/g, 'deve superare un tiro salvezza'],
        [/\bmust succeed on a\b/g, 'deve superare un'],
        [/\bmust make a\b/g, 'deve effettuare un'],
        [/\bIf the ([^,.]+?) fails\b/g, 'Se $1 fallisce'],
        [/\bIf it fails\b/g, 'Se fallisce'],
        [/\bif it fails\b/g, 'se fallisce'],
        [/\bIf the ([^,.]+?) succeeds\b/g, 'Se $1 supera il tiro'],
        [/\bon a success\b/g, 'se lo supera'],
        [/\bon a failed save\b/g, 'se fallisce il tiro salvezza'],
        [/\bor half as much damage on a successful one\b/g, 'o la meta dei danni se lo supera'],
        [/\btakes no damage\b/g, 'non subisce danni'],
        [/\btakes only half the damage\b/g, 'subisce solo meta dei danni'],
        [/\btakes ([^,.]+?) damage\b/g, 'subisce $1 danni'],
        [/\bdeals only half damage\b/g, 'infligge solo meta dei danni'],
        [/\bdeals\b/g, 'infligge'],
        [/\bdamage\b/g, 'danni'],
        [/\badvantage\b/g, 'vantaggio'],
        [/\bdisadvantage\b/g, 'svantaggio'],
        [/\bchecks\b/g, 'prove'],
        [/\bcheck\b/g, 'prova'],
        [/\bsaving throws\b/g, 'tiri salvezza'],
        [/\bsaving throw\b/g, 'tiro salvezza'],
        [/\battack rolls\b/g, 'tiri per colpire'],
        [/\battack roll\b/g, 'tiro per colpire'],
        [/\bopportunity attacks\b/g, 'attacchi di opportunita'],
        [/\bstart of (?:its|his|her) next turn\b/g, 'inizio del suo prossimo turno'],
        [/\bend of (?:its|his|her) next turn\b/g, 'fine del suo prossimo turno'],
        [/\bend of each of (?:its|his|her) turns\b/g, 'fine di ciascuno dei suoi turni'],
        [/\buntil the start of\b/g, 'fino all inizio di'],
        [/\buntil the end of\b/g, 'fino alla fine di'],
        [/\bwithin\b/g, 'entro'],
        [/\bwithout provoking\b/g, 'senza provocare'],
        [/\bhas advantage on\b/g, 'ha vantaggio a'],
        [/\bhas advantage\b/g, 'ha vantaggio'],
        [/\bis immune to\b/g, 'e immune a'],
        [/\bis incapacitated\b/g, 'e incapacitato'],
        [/\bis blinded\b/g, 'e accecato'],
        [/\bis stable\b/g, 'e stabile'],
        [/\bis paralyzed\b/g, 'e paralizzato'],
        [/\bis poisoned\b/g, 'e avvelenato'],
        [/\bbecomes poisoned\b/g, 'diventa avvelenato'],
        [/\bbecome poisoned\b/g, 'diventa avvelenato'],
        [/\bending the effect on itself\b/g, 'terminando l effetto su se stesso'],
        [/\bending the effect\b/g, 'terminando l effetto'],
        [/\bThey remain until destroyed\b/g, 'Rimangono finche non vengono distrutti'],
        [/\bThey remain\b/g, 'Rimangono'],
        [/\bCosts (\d+) Actions\b/g, 'Costa $1 azioni'],
        [/\bCosts 1 Action\b/g, 'Costa 1 azione'],
        [/\bobey\b/g, 'obbediscono a'],
        [/\broll initiative\b/g, 'tirano l iniziativa'],
        [/\bSpeed\b/g, 'Velocita'],
        [/\bArmor Class\b/g, 'Classe Armatura'],
        [/\bHit Points\b/g, 'Punti Ferita'],
        [/\bA volonta\b/g, 'A volonta'],
        [/\bper day each\b/g, 'al giorno ciascuno'],
        [/\b\/day each\b/g, '/giorno ciascuno'],
        [/\bself only\b/g, 'solo se stesso'],
        [/\bself\b/g, 'se stesso'],
        [/\bLarge\b/g, 'Grande'],
        [/\bMedium\b/g, 'Medio'],
        [/\bSmall\b/g, 'Piccolo'],
        [/\bTiny\b/g, 'Minuscolo'],
        [/\bo\b/g, 'o'],
        [/\be\b/g, 'e'],
    ];
    replacements.forEach(([pattern, replacement]) => {
        out = out.replace(pattern, replacement);
    });
    out = out.replace(/\bThe ([A-Z][A-Za-z' -]+?)\b/g, 'Il $1');
    out = out.replace(/\bthe ([A-Z][A-Za-z' -]+?)\b/g, 'il $1');
    return out.replace(/[ \t]{2,}/g, ' ').replace(/\s+([,.;:])/g, '$1');
}

function _compMonsterTranslateTitles(text) {
    const titles = {
        'Multiattack': 'Multiattacco',
        'Spellcasting': 'Incantesimi',
        'Innate Spellcasting': 'Incantesimi Innati',
        'InnateSpellcasting': 'Incantesimi Innati',
        'Evasion': 'Elusione',
        'Legendary Resistance': 'Resistenza Leggendaria',
        'Legendary Resistenza': 'Resistenza Leggendaria',
        'Magic Resistance': 'Resistenza alla Magia',
        'Keen Senses': 'Sensi Acuti',
        'Keen Sight': 'Vista Acuta',
        'Keen Hearing and Smell': 'Udito e Olfatto Acuti',
        'Stone Camouflage': 'Mimetismo nella Roccia',
        'Blind Senses': 'Sensi Ciechi',
        'Limited Telepathy': 'Telepatia Limitata',
        'Unusual Nature': 'Natura Insolita',
        'Master of the Grave': 'Signore della Tomba',
        'Bone Staff': 'Bastone d Ossa',
        'Deathly Ray': 'Raggio Mortale',
        'Attack': 'Attacco',
        'Move': 'Movimento',
        'Summon Undead': 'Evoca Non Morti',
        'Cast a Spell': 'Lancia un Incantesimo',
        'Staff': 'Bastone',
        'Claw': 'Artiglio',
        'Claws': 'Artigli',
        'Bite': 'Morso',
        'Tail': 'Coda',
        'Longsword': 'Spada Lunga',
        'Shortsword': 'Spada Corta',
        'Shortbow': 'Arco Corto',
        'Longbow': 'Arco Lungo',
        'Dagger': 'Pugnale',
        'Scimitar': 'Scimitarra',
        'Slam': 'Schianto',
    };
    return String(text || '').replace(/\*\*([^*.]+?)(?: \(([^*)]+)\))?\.\*\*/g, (match, title, suffix = '') => {
        const translated = titles[title] || _compMonsterTranslateTitleWords(title);
        const cleanSuffix = suffix ? ` (${_compMonsterTranslateText(suffix)})` : '';
        return `**${translated}${cleanSuffix}.**`;
    });
}

function _compMonsterTranslateTitleWords(title) {
    const words = {
        Fiendish: 'Immondo',
        Deathly: 'Mortale',
        Bone: 'Ossa',
        Staff: 'Bastone',
        Ray: 'Raggio',
        Claw: 'Artiglio',
        Claws: 'Artigli',
        Bite: 'Morso',
        Tail: 'Coda',
        Poisonous: 'Velenoso',
        Touch: 'Tocco',
        Arcane: 'Arcana',
        Eruption: 'Eruzione',
        Gaze: 'Sguardo',
        Weakening: 'Indebolente',
        Spray: 'Spruzzo',
        Bile: 'Bile',
        Warp: 'Distorsione',
        Demon: 'Demoniaco',
        Scimitar: 'Scimitarra',
        Longsword: 'Spada Lunga',
        Shortbow: 'Arco Corto',
        Shortword: 'Spada Corta',
        Dagger: 'Pugnale',
        Staff: 'Bastone',
        Attack: 'Attacco',
        Spell: 'Incantesimo',
    };
    return String(title || '').split(/\s+/).map(word => words[word] || word).join(' ');
}

function _compMonsterParagraphHasSpellList(text) {
    return /\*\*(Incantesimi|Incantesimi Innati|Spellcasting|Innate Spellcasting)[^*]*\.\*\*/i.test(String(text || ''));
}

function _compClassDetail(cls) {
    const clsId = _compClassId(cls);
    const optionalFeatures = _compFilteredOptionalFeatures(cls.optional_features || []);
    const showTasha = _compShowTashaFeatures(clsId);
    const classFeatures = _compMergeFeatureLists(cls.features || [], showTasha ? optionalFeatures : []);
    const boxes = [
        ['Dado vita', cls.hit_dice],
        ['Tiri salvezza', _compField(cls, 'prof_saving_throws')],
        ['Armature', _compField(cls, 'prof_armor')],
        ['Armi', _compField(cls, 'prof_weapons')],
        ['Strumenti', _compField(cls, 'prof_tools')],
        ['Incantesimi', _compField(cls, 'spellcasting_ability') || 'Non incantatore'],
    ];
    return `
        ${_compBoxes(boxes)}
        <section class="comp-detail-section">
            <h3>Multiclasse</h3>
            ${_compStackedBoxes([
                ['Requisiti', COMP_MULTICLASS_REQUIREMENTS[cls.name] || 'Verifica sul manuale'],
                ['Competenze ottenute', COMP_MULTICLASS_PROFICIENCIES[cls.name] || 'Verifica sul manuale'],
            ])}
        </section>
        ${_compClassProgressionSection(cls)}
        <section class="comp-detail-section">
            <h3>Competenze iniziali</h3>
            <div class="comp-rich">${_compRich(_compField(cls, 'prof_skills') || '')}</div>
        </section>
        <section class="comp-detail-section">
            <h3>Equipaggiamento</h3>
            <div class="comp-rich">${_compRich(_compField(cls, 'equipment') || '')}</div>
        </section>
        ${_compTashaToggleHtml(clsId, optionalFeatures, showTasha)}
        ${_compFeaturesSection(classFeatures)}
        ${_compClassSubclassesSection(cls, showTasha)}
    `;
}

function _compMonsterCardHtml(item) {
    const monster = item.data;
    return `
        <article class="comp-card comp-monster-card" onclick="compendioOpenDetail('mostri', '${_compEscapeAttr(item.id)}')">
            <div class="comp-card-main">
                <h2 class="comp-card-title">${escapeHtml(item.title)}</h2>
                <span class="comp-monster-gs">${escapeHtml(_compMonsterChallengeLabel(monster.grado_sfida))}</span>
            </div>
            <div class="comp-monster-card-meta">
                <span>${escapeHtml(monster.tipo || 'Tipo non indicato')}</span>
                <span>${escapeHtml(monster.allineamento_breve || '-')}</span>
            </div>
        </article>
    `;
}

function _compClassSubclassesSection(cls, showTasha = false) {
    const subclasses = _compSortedSubclasses(cls.subclasses || []);
    if (!subclasses.length) return '';
    const clsId = cls.slug || cls.name || cls.name_en || 'classe';
    return `<section class="comp-detail-section">
        <h3>Sottoclassi</h3>
        <div class="comp-subclass-accordion-list">
            ${subclasses.map(sub => _compSubclassAccordionHtml(clsId, sub, showTasha)).join('')}
        </div>
    </section>`;
}

function _compObjectsPageHtml() {
    const state = _compStateFor('oggetti');
    state.equipmentSection = state.equipmentSection || '';
    if (!state.equipmentSection) return _compEquipmentHubHtml();
    return `<div id="compEquipmentSectionContent">${_compEquipmentSectionHtml(state.equipmentSection, state)}</div>`;
}

window.compendioSetObjectsSubTab = function(tab) {
    const state = _compStateFor('oggetti');
    state.equipmentSection = tab === 'oggetti' ? 'oggetti' : 'armi';
    compendioRenderTab();
    _compScrollToTop();
};

window.compendioOpenEquipmentSection = function(section) {
    if (!COMP_EQUIPMENT_SECTIONS[section]) return;
    const state = _compStateFor('oggetti');
    state.equipmentSection = section;
    state.detail = null;
    compendioRenderTab();
    _compScrollToTop();
};

window.compendioToggleGemTreasures = function() {
    const state = _compStateFor('oggetti');
    state.gemTreasureOpen = state.gemTreasureOpen === false;
    _compRenderObjectsSectionContent();
};

window.compendioSetGemView = function(view) {
    const state = _compStateFor('oggetti');
    state.gemView = view === 'tesori' ? 'tesori' : 'lista';
    if (state.gemView === 'tesori') {
        const filters = _compEquipmentFilterState('gemme', state);
        delete filters.type;
        delete filters.availability;
    }
    _compRenderObjectsSectionContent();
    _compRenderObjectsStickyTools();
};

window.compendioSetObjectsSearch = function(value) {
    const state = _compStateFor('oggetti');
    const section = state.equipmentSection || 'armi';
    state.equipmentSearch = state.equipmentSearch || {};
    state.equipmentSearch[section] = value || '';
    _compRenderObjectsSectionContent();
};

function _compEquipmentHubHtml() {
    const rows = [];
    for (let i = 0; i < COMP_EQUIPMENT_SECTION_ORDER.length; i += 2) {
        rows.push(`
            <div class="comp-equipment-hub-row">
                ${COMP_EQUIPMENT_SECTION_ORDER.slice(i, i + 2).map(section => `
                    <button type="button" class="comp-hub-card comp-equipment-hub-card" onclick="compendioOpenEquipmentSection('${section}')">
                        <span class="comp-hub-card-icon" aria-hidden="true">${_compEquipmentSectionIcon(section)}</span>
                        <span class="comp-hub-card-label">${escapeHtml(COMP_EQUIPMENT_SECTIONS[section].shortLabel || COMP_EQUIPMENT_SECTIONS[section].label)}</span>
                    </button>
                `).join('')}
            </div>
        `);
    }
    return `<div class="comp-equipment-hub">${rows.join('')}</div>`;
}

function _compEquipmentSectionHtml(section, state = _compStateFor('oggetti')) {
    if (section === 'armi') return _compEquipmentTablesHtml(state);
    if (section === 'oggetti' || section === 'veleni') {
        return `<div id="compObjectsListContent">${_compObjectsInventoryListHtml(state)}</div>`;
    }
    return _compGenericEquipmentListHtml(section, state);
}

function _compEquipmentSearchValue(section, state = _compStateFor('oggetti')) {
    return (state.equipmentSearch && state.equipmentSearch[section]) || '';
}

function _compEquipmentFilterState(section, state = _compStateFor('oggetti')) {
    state.equipmentFilters = state.equipmentFilters || {};
    state.equipmentFilters[section] = state.equipmentFilters[section] || {};
    return state.equipmentFilters[section];
}

function _compEquipmentTablesHtml(state = _compStateFor('oggetti')) {
    const allItems = _compEquipmentSectionItems('armi');
    const filtered = _compEquipmentFilteredItems('armi', state);
    const weapons = filtered.filter(item => item.kind === 'weapon').map(item => item.data);
    const armors = filtered.filter(item => item.kind === 'armor').map(item => item.data);
    const content = `
        <p class="comp-count">${filtered.length} risultati su ${allItems.length}</p>
        <section class="comp-detail-section">
            <h3>Armi</h3>
            ${COMP_WEAPON_GROUPS.map(([cat, label]) => _compWeaponTable(label, weapons.filter(w => w.cat === cat))).join('') || '<div class="comp-empty">Nessuna arma trovata</div>'}
        </section>
        <section class="comp-detail-section">
            <h3>Armature e Scudi</h3>
            ${COMP_ARMOR_GROUPS.map(([cat, label]) => _compArmorTable(label, armors.filter(a => a.cat === cat))).join('') || '<div class="comp-empty">Nessuna armatura o scudo trovato</div>'}
        </section>
    `;
    return filtered.length ? content : `${content}<div class="comp-empty">Nessun elemento trovato</div>`;
}

function _compGenericEquipmentListHtml(section, state = _compStateFor('oggetti')) {
    if (section === 'gemme') {
        return _compGemsListHtml(state);
    }
    const total = _compEquipmentSectionItems(section).length;
    let items = _compEquipmentFilteredItems(section, state);
    if (section === 'metalli') {
        items = items.sort((a, b) => a.title.localeCompare(b.title, 'it'));
    }
    let content = '';
    if (section === 'strumenti') {
        content = _compToolsTablesHtml(items);
    } else if (['avventura', 'erbe', 'metalli'].includes(section)) {
        content = _compEquipmentCardsHtml(section, items);
    } else {
        content = _compGenericEquipmentTable(section, items);
    }
    return `
        <p class="comp-count">${items.length} risultati su ${total}</p>
        ${content || '<div class="comp-empty">Dati non ancora disponibili</div>'}
    `;
}

function _compToolsTablesHtml(items) {
    if (!items.length) return '<div class="comp-empty">Nessuno strumento trovato</div>';
    const order = ['Strumenti da artigiano', 'Strumento musicale', 'Set da gioco', 'Altri strumenti'];
    const groups = order
        .map(category => [category, items.filter(item => (item.categoryLabel || item.category) === category)])
        .filter(([, rows]) => rows.length);
    const remaining = items.filter(item => !order.includes(item.categoryLabel || item.category));
    if (remaining.length) groups.push(['Altri', remaining]);
    return groups.map(([category, rows]) => `
        <div class="comp-equipment-subtable">
            <h4>${escapeHtml(_compToolCategoryTitle(category))}</h4>
            <div class="comp-table-wrap">
                <table class="comp-equipment-table comp-tools-table">
                    <thead><tr><th>Nome</th><th>Costo</th><th>Peso</th></tr></thead>
                    <tbody>${rows.map(item => `
                        <tr>
                            <td>${escapeHtml(item.title || '-')}</td>
                            <td>${escapeHtml(item.costLabel || '-')}</td>
                            <td>${escapeHtml(item.weight || '-')}</td>
                        </tr>
                    `).join('')}</tbody>
                </table>
            </div>
        </div>
    `).join('');
}

function _compToolCategoryTitle(category) {
    const labels = {
        'Strumento musicale': 'Strumenti musicali',
        'Set da gioco': 'Set da gioco',
        'Strumenti da artigiano': 'Strumenti da artigiano',
        'Altri strumenti': 'Altri strumenti',
    };
    return labels[category] || category || 'Strumenti';
}

function _compEquipmentCardsHtml(section, items) {
    if (!items.length) return '<div class="comp-empty">Nessun elemento trovato</div>';
    return `<div class="comp-list comp-equipment-card-list">${items.map(item => _compEquipmentCardHtml(section, item)).join('')}</div>`;
}

function _compEquipmentCardHtml(section, item) {
    const meta = _compEquipmentCardMeta(section, item);
    const infoHtml = _compEquipmentCardInfoHtml(section, item, meta);
    const accent = _compEquipmentCardAccent(section, item);
    const desc = '';
    const clickable = ['avventura', 'erbe', 'metalli'].includes(section) || (section === 'gemme' && item.gemKind === 'reame');
    const clickAttrs = clickable
        ? ` role="button" tabindex="0" onclick="compendioOpenEquipmentDetail('${section}','${_compEscapeAttr(item.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();compendioOpenEquipmentDetail('${section}','${_compEscapeAttr(item.id)}')}"`
        : '';
    return `<article class="comp-card comp-inventory-card comp-equipment-card comp-equipment-card-${section}${clickable ? ' clickable' : ''}"${clickAttrs}>
        <div class="comp-card-main">
            <h2 class="comp-card-title">${escapeHtml(item.title)}</h2>
            ${accent ? `<span class="comp-card-source comp-equipment-card-value">${escapeHtml(accent)}</span>` : ''}
        </div>
        ${infoHtml}
        ${desc ? `<p class="comp-card-desc comp-equipment-card-desc">${escapeHtml(desc)}</p>` : ''}
    </article>`;
}

function _compEquipmentCardAccent(section, item) {
    return item.costLabel || item.valueLabel || '';
}

function _compEquipmentCardMeta(section, item) {
    if (section === 'erbe') {
        return [item.categoryLabel, item.part, item.preparation].filter(Boolean).join(' · ');
    }
    if (section === 'avventura') {
        return [item.categoryLabel || item.category, item.weight ? `Peso: ${item.weight}` : ''].filter(Boolean).join(' · ');
    }
    if (section === 'gemme') {
        return [item.type, item.availability].filter(Boolean).join(' · ');
    }
    return '';
}

function _compEquipmentCardInfoHtml(section, item, meta) {
    return meta ? `<div class="comp-card-meta comp-inventory-meta">${escapeHtml(meta)}</div>` : '';
}

function _compGemsListHtml(state) {
    state.gemView = state.gemView || 'lista';
    const all = _compEquipmentSectionItems('gemme');
    const filtered = _compEquipmentFilteredItems('gemme', state);
    const isTreasure = state.gemView === 'tesori';
    const base = all.filter(item => item.gemKind === (isTreasure ? 'tesoro' : 'reame'));
    const items = filtered.filter(item => item.gemKind === (isTreasure ? 'tesoro' : 'reame'));
    const treasures = items.filter(item => item.gemKind === 'tesoro');
    const realms = items.filter(item => item.gemKind === 'reame')
        .sort((a, b) => a.title.localeCompare(b.title, 'it'));
    const treasureHtml = treasures.length
        ? _compGemTreasureTablesHtml(treasures)
        : '<div class="comp-empty">Nessuna gemma tesoro trovata</div>';
    const realmsHtml = realms.length
        ? `<div class="comp-list comp-equipment-card-list">${realms.map(item => _compEquipmentCardHtml('gemme', item)).join('')}</div>`
        : '';
    const emptyHtml = !items.length
        ? '<div class="comp-empty">Nessuna gemma trovata</div>'
        : '';
    return `
        <div class="comp-gem-mode-switch" role="tablist" aria-label="Vista gemme">
            <button type="button" class="${!isTreasure ? 'active' : ''}" onclick="compendioSetGemView('lista')">Lista</button>
            <button type="button" class="${isTreasure ? 'active' : ''}" onclick="compendioSetGemView('tesori')">Tesori</button>
        </div>
        <p class="comp-count">${items.length} risultati su ${base.length}</p>
        ${isTreasure ? treasureHtml : realmsHtml}
        ${emptyHtml}
    `;
}

function _compGemTreasureTablesHtml(items) {
    const groups = new Map();
    items.forEach(item => {
        const key = item.valueLabel || item.costLabel || 'Valore variabile';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
    });
    return Array.from(groups.entries())
        .sort(([a], [b]) => _compGemValueSort(a) - _compGemValueSort(b))
        .map(([value, group]) => `
            <div class="comp-equipment-subtable comp-gem-treasure-table">
                <h4>Gemme da ${escapeHtml(value)}</h4>
                <div class="comp-table-wrap">
                    <table class="comp-equipment-table comp-gems-table">
                        <thead><tr><th>Gemma</th><th>Descrizione</th></tr></thead>
                        <tbody>${group.sort((a, b) => a.title.localeCompare(b.title, 'it')).map(item => `
                            <tr>
                                <td>${escapeHtml(item.title)}</td>
                                <td>${escapeHtml(item.description || '-')}</td>
                            </tr>
                        `).join('')}</tbody>
                    </table>
                </div>
            </div>
        `).join('');
}

function _compGemValueSort(value) {
    const n = Number(String(value || '').replace(/[^\d]/g, ''));
    return Number.isFinite(n) ? n : 999999;
}

function _compGenericEquipmentTable(section, items) {
    if (!items.length) return '';
    const columns = _compGenericEquipmentColumns(section, items);
    return `
        <div class="comp-table-wrap">
            <table class="comp-equipment-table">
                <thead><tr>
                    ${columns.map(col => `<th>${escapeHtml(col.label)}</th>`).join('')}
                </tr></thead>
                <tbody>${items.map(item => `
                    <tr>
                        ${columns.map(col => `<td>${escapeHtml(col.value(item) || '-')}</td>`).join('')}
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
    `;
}

function _compGenericEquipmentColumns(section, items) {
    if (section === 'erbe') {
        return [
            { label: 'Nome', value: item => item.title },
            { label: 'Tipo', value: item => item.categoryLabel },
            { label: 'Preparazione', value: item => item.preparation },
            { label: 'Parte', value: item => item.part },
            { label: 'Ambiente', value: item => item.environment },
            { label: 'Stagione', value: item => item.season },
            { label: 'Costo', value: item => item.costLabel },
        ];
    }
    if (section === 'gemme') {
        return [
            { label: 'Nome', value: item => item.title },
            { label: 'Valore', value: item => item.valueLabel || item.costLabel },
            { label: 'Descrizione', value: item => item.description },
        ];
    }
    if (section === 'metalli') {
        return [
            { label: 'Nome', value: item => item.title },
            { label: 'Costo', value: item => item.costLabel },
            { label: 'Descrizione', value: item => item.description },
        ];
    }
    return [
        { label: 'Nome', value: item => item.title },
        { label: 'Categoria', value: item => item.categoryLabel || item.type },
        { label: 'Costo', value: item => item.costLabel },
        { label: 'Peso', value: item => item.weight },
    ].filter(col => col.label === 'Nome' || items.some(item => col.value(item)));
}

function _compRenderObjectsStickyTools() {
    const state = _compStateFor('oggetti');
    const section = state.equipmentSection || '';
    if (!section) {
        _compSetStickyTools('');
        return;
    }
    const cfg = COMP_EQUIPMENT_SECTIONS[section] || {};
    const activeFilters = _compObjectsActiveFilterCount();
    _compSetStickyTools(`
        <div class="comp-toolbar page-tools-row">
            <label class="comp-search-wrap">
                ${_compIcon('search')}
                <input id="compObjectsSearch" class="comp-search" type="search" placeholder="Cerca in ${escapeHtml((cfg.label || 'equipaggiamento').toLowerCase())}..."
                    value="${escapeHtml(_compEquipmentSearchValue(section, state))}" oninput="compendioSetObjectsSearch(this.value)">
            </label>
            <button type="button" class="comp-filter-btn" onclick="compendioOpenObjectsFilters()" aria-label="Filtri">
                ${_compIcon('sliders')}
                <span>Filtri</span>
                ${activeFilters ? `<strong id="compObjectsFiltersBadge">${activeFilters}</strong>` : '<strong id="compObjectsFiltersBadge" style="display:none;"></strong>'}
            </button>
        </div>
    `);
}

function _compWeaponTable(label, rows) {
    if (!rows.length) return '';
    return `<div class="comp-equipment-subtable">
        <h4>${escapeHtml(label)}</h4>
        <div class="comp-table-wrap">
            <table class="comp-equipment-table">
                <thead><tr><th>Nome</th><th>Danni</th><th>Tipo</th><th>Proprieta</th></tr></thead>
                <tbody>${rows.map(w => `
                    <tr>
                        <td>${escapeHtml(w.nome || '')}</td>
                        <td>${escapeHtml(w.danni || '-')}</td>
                        <td>${escapeHtml(w.tipo_danno || '-')}</td>
                        <td>${escapeHtml(_compArrayLabel(w.proprieta) || '-')}</td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
    </div>`;
}

function _compArmorTable(label, rows) {
    if (!rows.length) return '';
    return `<div class="comp-equipment-subtable">
        <h4>${escapeHtml(label)}</h4>
        <div class="comp-table-wrap">
            <table class="comp-equipment-table">
                <thead><tr><th>Nome</th><th>CA</th><th>Forza</th><th>Furtivita</th></tr></thead>
                <tbody>${rows.map(a => `
                    <tr>
                        <td>${escapeHtml(a.nome || '')}</td>
                        <td>${escapeHtml(_compArmorClassLabel(a))}</td>
                        <td>${escapeHtml(a.forza ? String(a.forza) : '-')}</td>
                        <td>${escapeHtml(a.furtivita || '-')}</td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
    </div>`;
}

function _compEquipmentSectionItems(section) {
    if (section === 'armi') return _compArmoryItems();
    if (section === 'oggetti') {
        return (Array.isArray(window.OGGETTI_MAGICI_DATA) ? window.OGGETTI_MAGICI_DATA : [])
            .map(item => _compInventoryItem('catalog', item))
            .filter(Boolean);
    }
    if (section === 'veleni') {
        return (Array.isArray(window.VELENI_DATA) ? window.VELENI_DATA : [])
            .map(item => _compInventoryItem('veleni', item))
            .filter(Boolean);
    }
    if (section === 'gemme') {
        return [
            ...COMP_GEMS_DATA.map((item, index) => _compGenericEquipmentItem('gemme', item, index)),
            ...COMP_REALMS_GEMS_DATA.map((item, index) => _compGenericEquipmentItem('gemme', item, `realms-${index}`)),
        ].filter(Boolean);
    }
    const sourceMap = {
        avventura: COMP_ADVENTURING_GEAR_DATA,
        strumenti: COMP_TOOLS_DATA,
        erbe: COMP_HERBS_DATA,
        metalli: COMP_METALS_DATA,
    };
    return (sourceMap[section] || []).map((item, index) => _compGenericEquipmentItem(section, item, index)).filter(Boolean);
}

function _compArmoryItems() {
    const weapons = typeof DND_ARMI !== 'undefined' && Array.isArray(DND_ARMI) ? DND_ARMI : [];
    const armors = typeof DND_ARMATURE !== 'undefined' && Array.isArray(DND_ARMATURE) ? DND_ARMATURE : [];
    return [
        ...weapons.map(w => ({
            kind: 'weapon',
            title: w.nome || '',
            category: w.cat || '',
            categoryLabel: _compEquipmentGroupLabel(w.cat),
            type: w.tipo_danno || '',
            properties: _compArrayLabel(w.proprieta),
            source: 'Armi',
            data: w,
            search: [w.nome, w.danni, w.tipo_danno, _compArrayLabel(w.proprieta), _compEquipmentGroupLabel(w.cat)].join(' ').toLowerCase(),
        })),
        ...armors.map(a => ({
            kind: 'armor',
            title: a.nome || '',
            category: a.cat || '',
            categoryLabel: _compEquipmentGroupLabel(a.cat),
            type: a.cat === 'scudo' ? 'Scudo' : 'Armatura',
            properties: a.furtivita || '',
            source: a.cat === 'scudo' ? 'Scudi' : 'Armature',
            data: a,
            search: [a.nome, _compArmorClassLabel(a), a.furtivita, _compEquipmentGroupLabel(a.cat)].join(' ').toLowerCase(),
        })),
    ];
}

function _compGenericEquipmentItem(section, item, index) {
    if (!item) return null;
    const title = item.nome || item.name || item.nome_it || item.title || '';
    if (!title) return null;
    const cost = Number(item.costo_mo ?? item.cost_gp ?? item.cost ?? item.valore_mo ?? item.value_gp ?? NaN);
    return {
        id: item.id || `${section}-${index}`,
        title,
        category: item.categoria || item.category || item.tipo || item.type || '',
        categoryLabel: item.categoria || item.category || item.tipo || item.type || '',
        type: item.tipo || item.type || '',
        availability: item.reperibilita || item.availability || item.location || '',
        source: item.fonte || item.source || '',
        cost,
        costLabel: item.costo || item.cost_label || item.prezzo || item.price || (Number.isFinite(cost) ? `${cost} mo` : ''),
        costGroupLabel: item.costo_gruppo || item.cost_group || '',
        valueLabel: item.valore || item.value_label || (Number.isFinite(cost) && section === 'gemme' ? `${cost} mo` : ''),
        weight: item.peso || item.weight || '',
        costDetail: item.costo_dettaglio || item.cost_detail || '',
        components: item.componenti || item.components || '',
        color: item.colore || item.color || '',
        properties: item.proprieta || item.properties || '',
        preparation: item.preparazione || item.preparation || '',
        part: item.parte || item.part || '',
        environment: item.ambiente || item.environment || '',
        season: item.stagione || item.season || '',
        description: item.descrizione || item.description || '',
        gemKind: item.tipo_gemma || item.gem_kind || '',
        power: item.potere || item.power || item.poteri || '',
        sourceUrl: item.fonte_url || item.source_url || '',
        rarity: item.rarita || item.rarity || '',
        data: item,
        search: [
            title, item.name, item.categoria, item.category, item.tipo, item.type,
            item.reperibilita, item.availability, item.location, item.fonte, item.source, item.preparazione, item.preparation, item.parte,
            item.part, item.ambiente, item.environment, item.stagione, item.season,
            item.descrizione, item.description, item.valore, item.value_label, item.costo,
            item.costo_gruppo, item.componenti, item.components, item.colore, item.color, item.proprieta, item.properties,
            item.cost_label, item.costo_dettaglio, item.cost_detail, item.peso, item.weight,
            item.potere, item.power, item.poteri, item.rarita, item.rarity,
        ].join(' ').toLowerCase(),
    };
}

function _compEquipmentFilteredItems(section, state = _compStateFor('oggetti')) {
    const q = String(_compEquipmentSearchValue(section, state)).trim().toLowerCase();
    return _compEquipmentSectionItems(section)
        .filter(item => !q || String(item.search || '').includes(q) || String(item.title || '').toLowerCase().includes(q))
        .filter(item => _compEquipmentMatchesFilters(item, section, state));
}

function _compEquipmentMatchesFilters(item, section, state = _compStateFor('oggetti')) {
    if (section === 'oggetti' || section === 'veleni') return _compObjectMatchesFilters(item, state);
    const filters = _compEquipmentFilterState(section, state);
    const categories = _compFilterValues(filters.category);
    const kinds = _compFilterValues(filters.kind);
    const types = _compFilterValues(filters.type);
    const properties = _compFilterValues(filters.property);
    const costs = _compFilterValues(filters.cost);
    const preparations = _compFilterValues(filters.preparation);
    const parts = _compFilterValues(filters.part);
    const environments = _compFilterValues(filters.environment);
    const seasons = _compFilterValues(filters.season);
    const values = _compFilterValues(filters.value);
    const availabilities = _compFilterValues(filters.availability);
    const rarities = _compFilterValues(filters.rarity);
    const costLabels = _compFilterValues(filters.costLabel);
    const valueRange = filters.valueRange;
    if (rarities.length && !rarities.includes(item.rarity)) return false;
    if (costLabels.length && !costLabels.includes(item.costGroupLabel || item.costLabel)) return false;
    if (categories.length && !categories.includes(item.categoryLabel || item.category)) return false;
    if (kinds.length && !kinds.includes(item.kind || item.type)) return false;
    if (types.length && !types.includes(item.type)) return false;
    if (availabilities.length && !availabilities.includes(item.availability)) return false;
    if (properties.length && !properties.some(prop => String(item.properties || '').includes(prop))) return false;
    if (preparations.length && !preparations.includes(item.preparation)) return false;
    if (parts.length && !parts.includes(item.part)) return false;
    if (environments.length && !environments.includes(item.environment)) return false;
    if (seasons.length && !seasons.some(season => String(item.season || '').split(',').map(s => s.trim()).includes(season))) return false;
    if (values.length && !values.includes(item.valueLabel || item.costLabel)) return false;
    if (valueRange && (Number.isFinite(valueRange.min) || Number.isFinite(valueRange.max))) {
        if (!Number.isFinite(item.cost)) return false;
        const min = Number.isFinite(valueRange.min) ? valueRange.min : -Infinity;
        const max = Number.isFinite(valueRange.max) ? valueRange.max : Infinity;
        if (item.cost < min || item.cost > max) return false;
    }
    if (costs.length) {
        if (!Number.isFinite(item.cost)) return false;
        if (!costs.some(range => _compCostInRange(item.cost, range))) return false;
    }
    return true;
}

function _compEquipmentFilterDefs(section) {
    const items = _compEquipmentSectionItems(section);
    if (section === 'oggetti' || section === 'veleni') {
        const rarities = _compUnique(items.map(i => i.rarity));
        const types = _compUnique(items.map(i => i.type));
        const filters = [
            { key: 'rarity', title: 'Rarita', options: rarities.map(v => [v, v]) },
            { key: 'type', title: 'Tipologia', options: types.map(v => [v, v]) },
        ].filter(def => def.options.length);
        if (section === 'oggetti') {
            filters.push({ key: 'attunement', title: 'Sintonia', mode: 'single', options: [['yes', 'Si'], ['no', 'No']] });
        }
        if (section === 'veleni') {
            filters.push({ key: 'cost', title: 'Costo', options: [['0-100', '0-100 mo'], ['101-500', '101-500 mo'], ['501-1000', '501-1000 mo'], ['1001+', '1001+ mo']] });
        }
        return filters;
    }
    const filters = section === 'gemme'
        ? []
        : [
            { key: 'category', title: 'Categoria', options: _compUnique(items.map(i => i.categoryLabel || i.category)).map(v => [v, v]) },
            { key: 'type', title: 'Tipologia', options: _compUnique(items.map(i => i.type)).map(v => [v, v]) },
        ].filter(def => def.options.length);
    if (section === 'armi') {
        filters.unshift({ key: 'kind', title: 'Tipo', options: [['weapon', 'Armi'], ['armor', 'Armature e Scudi']] });
        const props = _compUnique(items.flatMap(i => _compFilterValues(String(i.properties || '').split(',').map(x => x.trim()))));
        if (props.length) filters.push({ key: 'property', title: 'Proprieta', options: props.map(v => [v, v]) });
    }
    if (section === 'erbe') {
        filters.push(
            { key: 'preparation', title: 'Preparazione', options: _compUnique(items.map(i => i.preparation)).map(v => [v, v]) },
            { key: 'part', title: 'Parte', options: _compUnique(items.map(i => i.part)).map(v => [v, v]) },
            { key: 'environment', title: 'Ambiente', options: _compUnique(items.map(i => i.environment)).map(v => [v, v]) },
            { key: 'season', title: 'Stagione', options: _compUnique(items.flatMap(i => String(i.season || '').split(',').map(s => s.trim()))).map(v => [v, v]) },
        );
    }
    if (section === 'gemme') {
        const view = _compStateFor('oggetti').gemView === 'tesori' ? 'tesoro' : 'reame';
        const scoped = items.filter(i => i.gemKind === view);
        const types = _compUnique(scoped.map(i => i.type)).map(v => [v, v]);
        const availability = _compUnique(scoped.map(i => i.availability)).map(v => [v, v]);
        const costs = scoped.filter(i => Number.isFinite(i.cost)).map(i => i.cost);
        if (view === 'reame' && types.length) filters.push({ key: 'type', title: 'Tipo', options: types });
        if (view === 'reame' && availability.length) filters.push({ key: 'availability', title: 'Reperibilita', options: availability });
        if (costs.length) {
            filters.push({
                key: 'valueRange',
                title: 'Valore',
                mode: 'numberRange',
                min: Math.min(...costs),
                max: Math.max(...costs),
            });
        }
    }
    if (section === 'metalli') {
        const rarities = _compUnique(items.map(i => i.rarity)).map(v => [v, v]);
        const costLabels = _compUnique(items
            .map(i => i.costGroupLabel || i.costLabel)
            .filter(label => String(label || '').includes('mo)')))
            .map(v => [v, v]);
        if (rarities.length) filters.push({ key: 'rarity', title: 'Rarita', options: rarities });
        if (costLabels.length) filters.push({ key: 'costLabel', title: 'Range costo', options: costLabels });
    }
    if (items.some(item => Number.isFinite(item.cost)) && section !== 'gemme') {
        filters.push({ key: 'cost', title: 'Costo', options: [['0-1', '0-1 mo'], ['1-10', '1-10 mo'], ['11-50', '11-50 mo'], ['51-100', '51-100 mo'], ['101+', '101+ mo']] });
    }
    return filters.filter(def => def.mode === 'range' || def.mode === 'numberRange' || def.options?.length);
}

function _compEquipmentGroupLabel(cat) {
    return [...COMP_WEAPON_GROUPS, ...COMP_ARMOR_GROUPS].find(([key]) => key === cat)?.[1] || cat || '';
}

function _compObjectsInventoryListHtml(state = _compStateFor('oggetti')) {
    const section = state.equipmentSection === 'veleni' ? 'veleni' : 'oggetti';
    const baseItems = _compEquipmentSectionItems(section);
    const all = _compEquipmentFilteredItems(section, state)
        .sort((a, b) => a.title.localeCompare(b.title, 'it'));
    return `
        <p class="comp-count">${all.length} risultati su ${baseItems.length}</p>
        ${all.length ? `<div class="comp-list">${all.map(_compInventoryCardHtml).join('')}</div>` : '<div class="comp-empty">Nessun elemento trovato</div>'}
    `;
}

function _compInventoryItem(source, item) {
    if (!item) return null;
    if (source === 'veleni') {
        const title = item.nome_it || item.nome_en || 'Veleno';
        const meta = `${item.sotto_tipo_it || ''}${item.categoria_it ? ' (' + item.categoria_it + ')' : ''} · ${item.rarita_it || ''} · ${item.prezzo_mo || 0} mo`;
        return {
            source,
            id: item.id,
            title,
            subtitle: item.nome_en && item.nome_en !== item.nome_it ? item.nome_en : '',
            meta,
            group: 'Veleni',
            rarity: item.rarita_it || '',
            type: item.sotto_tipo_it || 'Veleno',
            attunement: '',
            cost: Number(item.prezzo_mo) || 0,
            data: item,
            search: [title, item.nome_en, item.sotto_tipo_it, item.categoria_it, item.rarita_it, item.descrizione_it, item.descrizione_en].join(' ').toLowerCase(),
        };
    }
    const title = item.nome || item.nome_en || 'Oggetto';
    const meta = typeof window.formatOggettoMeta === 'function'
        ? window.formatOggettoMeta(item)
        : [item.tipo, item.sotto_tipo, item.rarita].filter(Boolean).join(' · ');
    return {
        source,
        id: item.id,
        title,
        subtitle: item.nome_en && item.nome_en !== item.nome ? item.nome_en : '',
        meta,
        group: 'Oggetti Magici',
        rarity: item.rarita || '',
        type: item.tipo || '',
        attunement: item.richiede_sintonia ? 'yes' : 'no',
        cost: null,
        data: item,
        search: [title, item.nome_en, item.tipo, item.sotto_tipo, item.rarita, item.descrizione, item.descrizione_en].join(' ').toLowerCase(),
    };
}

function _compInventoryCardHtml(item) {
    const rarClass = typeof _invRarityClass === 'function' ? _invRarityClass(item.rarity) : '';
    return `<article class="comp-card comp-inventory-card ${rarClass}" onclick="compendioOpenObjectDetail('${item.source}','${_compEscapeAttr(item.id)}')">
        <div class="comp-card-main">
            <h2 class="comp-card-title">${escapeHtml(item.title)}</h2>
            <span class="comp-card-source">${escapeHtml(item.rarity || item.group)}</span>
        </div>
        ${item.meta ? `<div class="comp-card-meta comp-inventory-meta">${escapeHtml(item.meta)}</div>` : ''}
    </article>`;
}

function _compRenderObjectsInventoryList() {
    _compRenderObjectsSectionContent();
}

function _compRenderObjectsSectionContent() {
    const state = _compStateFor('oggetti');
    const section = state.equipmentSection || '';
    const target = document.getElementById('compObjectsListContent');
    if (target) {
        target.innerHTML = _compObjectsInventoryListHtml(state);
    } else {
        const sectionTarget = document.getElementById('compEquipmentSectionContent');
        if (sectionTarget && section) sectionTarget.innerHTML = _compEquipmentSectionHtml(section, state);
    }
    const badge = document.getElementById('compObjectsFiltersBadge');
    if (badge) {
        const n = _compObjectsActiveFilterCount();
        badge.textContent = n ? String(n) : '';
        badge.style.display = n ? 'inline-flex' : 'none';
    }
}

window.compendioSetObjectKind = function(kind) {
    compendioOpenEquipmentSection(kind === 'veleni' ? 'veleni' : 'oggetti');
};

function _compObjectMatchesFilters(item, state) {
    const section = state.equipmentSection || (item.source === 'veleni' ? 'veleni' : 'oggetti');
    const f = _compEquipmentFilterState(section, state);
    const rarities = _compFilterValues(f.rarity);
    const types = _compFilterValues(f.type);
    const attunements = _compFilterValues(f.attunement);
    const costs = _compFilterValues(f.cost);
    if (rarities.length && !rarities.includes(item.rarity)) return false;
    if (types.length && !types.includes(item.type)) return false;
    if (attunements.length && !attunements.includes(item.attunement)) return false;
    if (costs.length) {
        if (!Number.isFinite(item.cost)) return false;
        if (!costs.some(range => _compCostInRange(item.cost, range))) return false;
    }
    return true;
}

function _compObjectsActiveFilterCount() {
    const state = _compStateFor('oggetti');
    const f = _compEquipmentFilterState(state.equipmentSection || 'armi', state);
    return Object.values(f).reduce((count, value) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) return count + 1;
        return count + _compFilterValues(value).length;
    }, 0);
}

window.compendioOpenObjectsFilters = function() {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay comp-filter-overlay comp-objects-filter-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div class="hp-calc-modal comp-filter-modal">
            <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h2 class="comp-filter-title">Filtri</h2>
            <div class="comp-filter-panel">${_compObjectsFiltersHtml()}</div>
            <div class="comp-filter-actions">
                <button type="button" class="btn-secondary" onclick="compendioResetObjectsFilters()">Reset</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

function _compObjectsFiltersHtml() {
    const state = _compStateFor('oggetti');
    const section = state.equipmentSection || 'armi';
    const f = _compEquipmentFilterState(section, state);
    const defs = _compEquipmentFilterDefs(section);
    if (!defs.length) return '<div class="comp-empty">Nessun filtro disponibile</div>';
    return defs.map(def => def.mode === 'range'
        ? _compObjectRangeFilter(def, f[def.key])
        : def.mode === 'numberRange'
            ? _compObjectNumberRangeFilter(def, f[def.key])
        : _compObjectSelect(def.key, f[def.key], def.options, def.title, def.mode || '')
    ).join('');
}

function _compObjectSelect(key, value, options, title, forcedMode = '') {
    const selected = _compFilterValues(value);
    const normalized = options.map(([v, label]) => ({ value: String(v), label }));
    const isSingle = forcedMode === 'single' || normalized.length === 2;
    const singleOptions = [{ value: '', label: 'Tutti' }, ...normalized];
    const encoded = encodeURIComponent(JSON.stringify(isSingle ? singleOptions : normalized)).replace(/'/g, '%27');
    const selectedLabel = isSingle && selected.length
        ? normalized.find(opt => opt.value === selected[0])?.label || selected[0]
        : selected.length;
    return `<button type="button" class="custom-select-trigger comp-filter-select" onclick="compendioPickObjectFilter('${key}','${encoded}','${_compEscapeAttr(title)}','${isSingle ? 'single' : 'multi'}')" data-value="${_compEscapeAttr(selected.join(','))}">
        ${escapeHtml(title)}
        ${selected.length ? `<small>${escapeHtml(selectedLabel)}</small>` : ''}
    </button>`;
}

function _compObjectRangeFilter(def, value) {
    const minBound = Number(def.min || 0);
    const maxBound = Number(def.max || minBound);
    const rawMin = Number(value?.min);
    const rawMax = Number(value?.max);
    const min = Number.isFinite(rawMin) ? Math.max(minBound, Math.min(rawMin, maxBound)) : minBound;
    const max = Number.isFinite(rawMax) ? Math.min(maxBound, Math.max(rawMax, minBound)) : maxBound;
    const step = Math.max(1, Math.round((maxBound - minBound) / 200));
    const active = min !== minBound || max !== maxBound;
    return `<div class="comp-range-filter" data-range-key="${_compEscapeAttr(def.key)}">
        <div class="comp-range-filter-head">
            <span>${escapeHtml(def.title)}</span>
            <small id="compRangeLabel-${_compEscapeAttr(def.key)}">${escapeHtml(_compMoneyRangeLabel(min, max))}</small>
        </div>
        <div class="comp-dual-range ${active ? 'active' : ''}">
            <input type="range" min="${minBound}" max="${maxBound}" step="${step}" value="${min}"
                oninput="compendioSetObjectRangeFilter('${_compEscapeAttr(def.key)}','min',this.value)">
            <input type="range" min="${minBound}" max="${maxBound}" step="${step}" value="${max}"
                oninput="compendioSetObjectRangeFilter('${_compEscapeAttr(def.key)}','max',this.value)">
        </div>
    </div>`;
}

function _compObjectNumberRangeFilter(def, value) {
    const rawMin = Number(value?.min);
    const rawMax = Number(value?.max);
    const min = Number.isFinite(rawMin) ? rawMin : '';
    const max = Number.isFinite(rawMax) ? rawMax : '';
    return `<div class="comp-range-filter comp-number-range-filter" data-range-key="${_compEscapeAttr(def.key)}">
        <div class="comp-range-filter-head">
            <span>${escapeHtml(def.title)}</span>
            <small>mo</small>
        </div>
        <div class="comp-number-range-inputs">
            <label>
                <span>Min</span>
                <input type="number" inputmode="numeric" min="${Number(def.min || 0)}" max="${Number(def.max || 0)}"
                    placeholder="${escapeHtml(_compFormatGold(def.min || 0))}" value="${escapeHtml(String(min))}"
                    oninput="compendioSetObjectNumberRangeFilter('${_compEscapeAttr(def.key)}','min',this.value)">
            </label>
            <label>
                <span>Max</span>
                <input type="number" inputmode="numeric" min="${Number(def.min || 0)}" max="${Number(def.max || 0)}"
                    placeholder="${escapeHtml(_compFormatGold(def.max || 0))}" value="${escapeHtml(String(max))}"
                    oninput="compendioSetObjectNumberRangeFilter('${_compEscapeAttr(def.key)}','max',this.value)">
            </label>
        </div>
    </div>`;
}

function _compMoneyRangeLabel(min, max) {
    return `${_compFormatGold(min)} - ${_compFormatGold(max)}`;
}

function _compFormatGold(value) {
    return `${Number(value || 0).toLocaleString('it-IT')} mo`;
}

window.compendioPickObjectFilter = function(key, encodedOptions, title, mode = 'multi') {
    const options = JSON.parse(decodeURIComponent(encodedOptions));
    const state = _compStateFor('oggetti');
    const section = state.equipmentSection || 'armi';
    const filters = _compEquipmentFilterState(section, state);
    if (mode === 'single') {
        openCustomSelect(options, value => {
            filters[key] = value || '';
            if (!value) delete filters[key];
            _compRenderObjectsSectionContent();
            const overlay = document.querySelector('.comp-objects-filter-overlay');
            if (overlay) overlay.querySelector('.comp-filter-panel').innerHTML = _compObjectsFiltersHtml();
        }, title || 'Filtro');
        return;
    }
    _compOpenInstantMultiSelect(options, _compFilterValues(filters[key]), values => {
        filters[key] = values;
        _compRenderObjectsSectionContent();
        const overlay = document.querySelector('.comp-objects-filter-overlay');
        if (overlay) overlay.querySelector('.comp-filter-panel').innerHTML = _compObjectsFiltersHtml();
    }, title || 'Filtro');
};

window.compendioSetObjectRangeFilter = function(key, bound, value) {
    const state = _compStateFor('oggetti');
    const section = state.equipmentSection || 'armi';
    const filters = _compEquipmentFilterState(section, state);
    const def = _compEquipmentFilterDefs(section).find(entry => entry.key === key);
    if (!def) return;
    const minBound = Number(def.min || 0);
    const maxBound = Number(def.max || minBound);
    const current = filters[key] && typeof filters[key] === 'object' ? { ...filters[key] } : { min: minBound, max: maxBound };
    current[bound] = Number(value);
    current.min = Math.max(minBound, Math.min(Number(current.min), maxBound));
    current.max = Math.min(maxBound, Math.max(Number(current.max), minBound));
    if (current.min > current.max) {
        if (bound === 'min') current.max = current.min;
        else current.min = current.max;
    }
    if (current.min === minBound && current.max === maxBound) delete filters[key];
    else filters[key] = current;
    _compRenderObjectsSectionContent();
    const label = document.getElementById(`compRangeLabel-${key}`);
    if (label) label.textContent = _compMoneyRangeLabel(current.min, current.max);
    const badge = document.getElementById('compObjectsFiltersBadge');
    if (badge) {
        const n = _compObjectsActiveFilterCount();
        badge.textContent = String(n);
        badge.style.display = n ? 'inline-flex' : 'none';
    }
};

window.compendioSetObjectNumberRangeFilter = function(key, bound, value) {
    const state = _compStateFor('oggetti');
    const section = state.equipmentSection || 'armi';
    const filters = _compEquipmentFilterState(section, state);
    const def = _compEquipmentFilterDefs(section).find(entry => entry.key === key);
    if (!def) return;
    const minBound = Number(def.min || 0);
    const maxBound = Number(def.max || minBound);
    const current = filters[key] && typeof filters[key] === 'object' ? { ...filters[key] } : {};
    const parsed = value === '' ? NaN : Number(value);
    if (Number.isFinite(parsed)) {
        current[bound] = Math.max(minBound, Math.min(parsed, maxBound));
    } else {
        delete current[bound];
    }
    if (Number.isFinite(current.min) && Number.isFinite(current.max) && current.min > current.max) {
        if (bound === 'min') current.max = current.min;
        else current.min = current.max;
    }
    if (Number.isFinite(current.min) || Number.isFinite(current.max)) filters[key] = current;
    else delete filters[key];
    _compRenderObjectsSectionContent();
    const badge = document.getElementById('compObjectsFiltersBadge');
    if (badge) {
        const n = _compObjectsActiveFilterCount();
        badge.textContent = n ? String(n) : '';
        badge.style.display = n ? 'inline-flex' : 'none';
    }
};

function _compOpenInstantMultiSelect(options, currentSelected, callback, title) {
    if (typeof closeCustomSelect === 'function') closeCustomSelect();
    const state = new Set((currentSelected || []).map(String));
    const overlay = document.createElement('div');
    overlay.id = 'customSelectOverlay';
    overlay.className = 'custom-select-overlay';
    const html = `
        <div class="custom-select-panel">
            <div class="custom-select-header">
                <span>${escapeHtml(title || 'Seleziona')}</span>
                <button class="custom-select-close" data-custom-select-action="close">&times;</button>
            </div>
            <div class="custom-select-list">
                ${options.map((o, i) => `
                    <label class="custom-select-check-item">
                        <input type="checkbox" data-idx="${i}" ${state.has(String(o.value)) ? 'checked' : ''}>
                        <span>${escapeHtml(o.label)}</span>
                    </label>
                `).join('')}
            </div>
            <div class="custom-select-footer">
                <button type="button" class="btn-secondary" data-custom-select-action="reset-multi">Reset</button>
            </div>
        </div>`;
    if (typeof setSafeHtml === 'function') setSafeHtml(overlay, html);
    else overlay.innerHTML = html;
    const apply = () => callback([...state]);
    overlay.querySelectorAll('.custom-select-check-item input').forEach(cb => {
        cb.addEventListener('change', () => {
            const opt = options[parseInt(cb.dataset.idx, 10)];
            if (!opt) return;
            if (cb.checked) state.add(String(opt.value));
            else state.delete(String(opt.value));
            apply();
        });
    });
    overlay.addEventListener('click', e => {
        const action = e.target.closest('[data-custom-select-action]')?.dataset.customSelectAction;
        if (e.target === overlay || action === 'close') {
            if (typeof closeCustomSelect === 'function') closeCustomSelect();
            else overlay.remove();
        } else if (action === 'reset-multi') {
            state.clear();
            overlay.querySelectorAll('.custom-select-check-item input').forEach(cb => { cb.checked = false; });
            apply();
        }
    });
    document.body.appendChild(overlay);
}

window.compendioResetObjectsFilters = function() {
    const state = _compStateFor('oggetti');
    const section = state.equipmentSection || 'armi';
    state.equipmentFilters = state.equipmentFilters || {};
    state.equipmentFilters[section] = {};
    _compRenderObjectsSectionContent();
    const overlay = document.querySelector('.comp-objects-filter-overlay');
    if (overlay) overlay.querySelector('.comp-filter-panel').innerHTML = _compObjectsFiltersHtml();
};

function _compCostInRange(cost, range) {
    if (range === '1001+') return cost >= 1001;
    if (range === '101+') return cost >= 101;
    const [min, max] = String(range).split('-').map(Number);
    return cost >= min && cost <= max;
}

window.compendioOpenObjectDetail = function(source, id) {
    const item = _compFindInventoryData(source, id);
    if (!item) return;
    const data = _compObjectPreviewData(source, item);
    if (!data) return;
    _compShowObjectPreview(data, typeof _invRarityClass === 'function' ? _invRarityClass(data.rarita) : '');
};

window.compendioOpenEquipmentDetail = function(section, id) {
    if (!['avventura', 'erbe', 'metalli', 'gemme'].includes(section)) return;
    const item = _compEquipmentSectionItems(section).find(entry => String(entry.id) === String(id));
    if (!item) return;
    const data = _compGenericEquipmentPreviewData(section, item);
    if (!data) return;
    _compShowObjectPreview(data, '');
};

function _compShowObjectPreview(data, modalClass = '') {
    const rarClass = modalClass || (typeof _invRarityClass === 'function' ? _invRarityClass(data.rarita) : '');
    const descHtml = data.descrizione
        ? (typeof window.formatRichText === 'function'
            ? window.formatRichText(data.descrizione)
            : escapeHtml(data.descrizione).replace(/\n/g, '<br>'))
        : '<i style="color:var(--text-muted);">Nessuna descrizione disponibile.</i>';
    const trBadge = data.pendingTr
        ? '<span class="inv-picker-tr-pending" style="margin-left:8px;" title="Traduzione italiana in arrivo">TR</span>'
        : '';
    const altName = data.nomeAlt
        ? `<div class="inv-preview-alt">${escapeHtml(data.nomeAlt)}</div>`
        : '';
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay inv-preview-overlay comp-object-detail-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal inv-preview-modal ${rarClass}">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <div class="inv-preview-header">
            <h3 class="inv-preview-title">${escapeHtml(data.nome)}${trBadge}</h3>
            ${altName}
            ${data.meta ? `<div class="inv-preview-meta">${escapeHtml(data.meta)}</div>` : ''}
            ${data.extras || ''}
        </div>
        <div class="inv-preview-desc">${descHtml}</div>
        <div class="dialog-actions inv-preview-actions">
            <button type="button" class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">← Indietro</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
}

function _compGenericEquipmentPreviewData(section, item) {
    if (section === 'avventura') {
        return {
            nome: item.title,
            nomeAlt: '',
            rarita: '',
            meta: _compEquipmentDetailMeta([
                ['Tipo', item.categoryLabel || item.category],
                ['Costo', item.costLabel],
                ['Peso', item.weight],
            ]),
            extras: '',
            descrizione: item.description || '',
            pendingTr: false,
        };
    }
    if (section === 'erbe') {
        return {
            nome: item.title,
            nomeAlt: '',
            rarita: '',
            meta: _compEquipmentDetailMeta([
                ['Categoria', item.categoryLabel],
                ['Costo', item.costLabel],
            ]),
            extras: _compEquipmentDetailExtras([
                ['Parte utile', item.part],
                ['Preparazione', item.preparation],
                ['Ambiente', item.environment],
                ['Stagione', item.season],
            ]),
            descrizione: item.description || '',
            pendingTr: false,
        };
    }
    if (section === 'metalli') {
        return {
            nome: item.title,
            nomeAlt: '',
            rarita: '',
            meta: '',
            extras: _compEquipmentDetailExtras([
                ['Range costi', item.costLabel],
                ['Indicazioni', item.costDetail],
                ['Componenti', item.components],
                ['Colore', item.color],
                ['Proprieta', item.properties],
                ['Reperibilita', item.availability],
            ]),
            descrizione: item.description || '',
            pendingTr: false,
        };
    }
    if (section === 'gemme' && item.gemKind === 'reame') {
        return {
            nome: item.title,
            nomeAlt: '',
            rarita: '',
            meta: '',
            extras: _compEquipmentDetailExtras([
                ['Costo', item.costLabel || item.valueLabel],
                ['Tipo', item.type],
                ['Reperibilita', item.availability],
                ['Peso', item.weight],
                ['Poteri', item.power],
            ]),
            descrizione: item.description || '',
            pendingTr: false,
        };
    }
    return null;
}

function _compEquipmentDetailMeta(rows) {
    return rows.map(([label, value]) => value ? `${label}: ${value}` : '').filter(Boolean).join(' · ');
}

function _compEquipmentDetailExtras(rows) {
    return rows
        .map(([label, value]) => value ? `<div class="inv-preview-extra"><b>${escapeHtml(label)}:</b> ${escapeHtml(value)}</div>` : '')
        .join('');
}

function _compFindInventoryData(source, id) {
    const list = source === 'veleni'
        ? (Array.isArray(window.VELENI_DATA) ? window.VELENI_DATA : [])
        : (Array.isArray(window.OGGETTI_MAGICI_DATA) ? window.OGGETTI_MAGICI_DATA : []);
    return list.find(item => String(item.id) === String(id));
}

function _compObjectDetailData(source, item) {
    if (source === 'veleni') {
        return {
            title: item.nome_it || item.nome_en || 'Veleno',
            subtitle: item.nome_en && item.nome_en !== item.nome_it ? item.nome_en : '',
            boxes: [
                ['Tipo', item.sotto_tipo_it],
                ['Categoria', item.categoria_it],
                ['Rarita', item.rarita_it],
                ['Costo', item.prezzo_mo != null ? `${item.prezzo_mo} mo` : ''],
            ],
            description: item.descrizione_it || item.descrizione_en || '',
        };
    }
    return {
        title: item.nome || item.nome_en || 'Oggetto',
        subtitle: '',
        boxes: [
            ['Tipo', [item.tipo, item.sotto_tipo].filter(Boolean).join(' - ')],
            ['Rarita', item.rarita],
            ['Sintonia', item.richiede_sintonia ? (item.sintonia_dettaglio || 'Si') : 'No'],
            ['Incantamento', item.incantamento ? `+${item.incantamento}` : ''],
        ],
        description: item.descrizione || item.descrizione_en || '',
    };
}

function _compObjectPreviewData(source, item) {
    if (typeof _invPreviewExtract === 'function') {
        const preview = _invPreviewExtract(source, item);
        if (preview) return preview;
    }
    const detail = _compObjectDetailData(source, item);
    return {
        nome: detail.title,
        nomeAlt: detail.subtitle || '',
        rarita: source === 'veleni' ? item.rarita_it : item.rarita,
        meta: detail.boxes.map(([label, value]) => value ? `${label}: ${value}` : '').filter(Boolean).join(' · '),
        extras: '',
        descrizione: detail.description,
        pendingTr: !!item._desc_pending,
    };
}

function _compArmorClassLabel(armor) {
    if (!armor) return '';
    if (armor.cat === 'scudo') return '+2';
    if (!armor.mod_des) return String(armor.ca_base || '');
    if (armor.max_des === 2) return `${armor.ca_base} + Des (max 2)`;
    return `${armor.ca_base} + Des`;
}

function _compSubclassAccordionHtml(clsId, sub, showTasha = false) {
    const subId = sub.slug || sub.name || sub.name_en || _compName(sub);
    const key = _compSubclassOpenKey(clsId, subId);
    const state = _compStateFor('classi');
    const isOpen = !!state.openSubclasses?.[key];
    const optionalFeatures = _compFilteredOptionalFeatures(sub.optional_features || []);
    const spellRows = _compSubclassSpellRows(clsId, sub);
    const features = _compRenderableFeatures(
        _compMergeFeatureLists(sub.features || [], showTasha ? optionalFeatures : []),
        { hideGrantedSpellFeatures: spellRows.length > 0 }
    );
    return `<section class="comp-subclass-accordion">
        <button type="button" class="comp-group-divider comp-subclass-toggle ${isOpen ? 'open' : ''}" onclick="compendioToggleClassSubclass('${_compEscapeAttr(clsId)}','${_compEscapeAttr(subId)}')">
            ${_compIcon('chevron-right')}
            <span>${escapeHtml(_compName(sub) || 'Sottoclasse')}</span>
            <small>${features.length}</small>
        </button>
        <div class="comp-subclass-body" ${isOpen ? '' : 'style="display:none;"'}>
            ${_compClassProgressionSection(sub, 'Progressione incantesimi')}
            ${_compSubclassSpellListSection(clsId, sub, spellRows)}
            ${_compFeaturesSection(features)}
        </div>
    </section>`;
}

window.compendioToggleClassSubclass = function(clsId, subId) {
    const state = _compStateFor('classi');
    state.openSubclasses = state.openSubclasses || {};
    const key = _compSubclassOpenKey(clsId, subId);
    state.openSubclasses[key] = !state.openSubclasses[key];
    compendioRenderTab();
};

function _compSubclassOpenKey(clsId, subId) {
    return `${clsId}::${subId}`;
}

function _compClassId(cls) {
    return String(cls?.slug || cls?.name_en || cls?.name || 'classe');
}

function _compClassCanonicalKey(cls) {
    return _compClassKey(cls?.slug || cls?.name || cls?.name_en || '');
}

function _compUtilityTableSections(tables) {
    if (!Array.isArray(tables) || !tables.length) return '';
    return tables.map(table => {
        const columns = Array.isArray(table.columns) ? table.columns : [];
        const rows = Array.isArray(table.rows) ? table.rows : [];
        if (!columns.length || !rows.length) return '';
        return `<section class="comp-detail-section">
            <h3>${escapeHtml(table.title || 'Tabella')}</h3>
            <div class="comp-table-wrap comp-utility-table-wrap">
                <table class="comp-utility-table">
                    <thead>
                        <tr>${columns.map(col => `<th>${escapeHtml(col)}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => `<tr>${columns.map((_, index) => `<td>${escapeHtml(row[index] ?? '')}</td>`).join('')}</tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </section>`;
    }).filter(Boolean).join('');
}

function _compShowTashaFeatures(clsId) {
    const state = _compStateFor('classi');
    return !!state.showTashaFeatures?.[clsId];
}

window.compendioToggleTashaFeatures = function(clsId) {
    const state = _compStateFor('classi');
    state.showTashaFeatures = state.showTashaFeatures || {};
    state.showTashaFeatures[clsId] = !state.showTashaFeatures[clsId];
    compendioRenderTab();
};

function _compTashaToggleHtml(clsId, optionalFeatures, showTasha) {
    if (!optionalFeatures.length) return '';
    return `<section class="comp-tasha-toggle-row">
        <button type="button" class="comp-filter-btn comp-tasha-toggle" onclick="compendioToggleTashaFeatures('${_compEscapeAttr(clsId)}')">
            ${_compIcon(showTasha ? 'eye-off' : 'eye')}
            <strong>${escapeHtml(showTasha ? 'Nascondi privilegi opzionali Tasha' : 'Mostra privilegi opzionali Tasha')}</strong>
            <small>${optionalFeatures.length}</small>
        </button>
    </section>`;
}

function _compFilteredOptionalFeatures(features) {
    return (features || []).filter(feature => !_compIsRedundantOptionalFeature(feature));
}

function _compIsRedundantOptionalFeature(feature) {
    const nameEn = String(feature?.name_en || '').toLowerCase();
    const nameIt = String(feature?.name || '').toLowerCase();
    if (nameEn.startsWith('additional ') && nameEn.endsWith(' spells')) return true;
    if (nameEn === 'fighting style options') return true;
    if (nameIt.startsWith('incantesimi ') && nameIt.includes(' aggiuntivi')) return true;
    if (nameIt === 'opzioni dello stile di combattimento') return true;
    return false;
}

function _compRenderableFeatures(features, options = {}) {
    let list = [...(features || [])];
    if (options.hideGrantedSpellFeatures) {
        list = list.filter(feature => !_compIsGrantedSpellFeature(feature));
    }
    return list;
}

function _compIsGrantedSpellFeature(feature) {
    const name = `${feature?.name_en || ''} ${feature?.name || ''}`.toLowerCase();
    if (!name.trim()) return false;
    if (name.includes('spellcasting') || name.includes('lancio di incantesimi')) return false;
    return /\b(domain spells|oath spells|circle spells|expanded spell list|psionic spells|clockwork magic|artificer spells|alchemist spells|armorer spells|artillerist spells|battle smith spells)\b/.test(name)
        || /incantesimi (del|della|dello|dei|degli|delle|da|dell'|psionici|estesa|ampliata)|lista .*incantesimi|magia dell'orologeria/.test(name);
}

function _compMergeFeatureLists(baseFeatures, optionalFeatures) {
    return [
        ...(baseFeatures || []).map(f => ({ ...f, _compOptional: false })),
        ...(optionalFeatures || []).map(f => ({ ...f, _compOptional: true })),
    ].sort((a, b) => {
        const al = parseInt(a.level);
        const bl = parseInt(b.level);
        const byLevel = (Number.isFinite(al) ? al : 999) - (Number.isFinite(bl) ? bl : 999);
        if (byLevel !== 0) return byLevel;
        if (!!a._compOptional !== !!b._compOptional) return a._compOptional ? 1 : -1;
        return String(_compName(a) || '').localeCompare(String(_compName(b) || ''), _compLang() === 'en' ? 'en' : 'it');
    });
}

function _compSubclassSpellListSection(clsId, sub, presetRows = null) {
    const rows = Array.isArray(presetRows) ? presetRows : _compSubclassSpellRows(clsId, sub);
    if (!rows.length) return '';
    return `<section class="comp-detail-section comp-subclass-spells-section">
        <h3>Incantesimi concessi</h3>
        <div class="comp-table-wrap">
            <table class="comp-equipment-table comp-spell-offer-table comp-subclass-spell-table">
                <thead>
                    <tr>
                        <th>Liv. classe</th>
                        <th>Incantesimi</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `<tr>
                        <td>${escapeHtml(row.variant ? `${row.variant} - ${row.level}` : row.level)}</td>
                        <td><div class="comp-spell-pill-list">${row.spells.map(name => `<button type="button" class="comp-spell-name-pill comp-spell-name-pill-btn" onclick="compendioOpenSpellRef('${_compEscapeAttr(name)}')">${escapeHtml(name)}</button>`).join('')}</div></td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </section>`;
}

function _compSubclassSpellRows(clsId, sub) {
    const rawClassKey = String(clsId || '').trim();
    const classKey = _compClassKey(rawClassKey);
    const classKeys = _compUnique([
        rawClassKey,
        classKey,
        ...(COMP_CLASS_ALIASES[classKey] || []),
        ...(COMP_CLASS_ALIASES[rawClassKey] || []),
    ].filter(Boolean));
    const subKey = String(sub?.slug || sub?.name_en || sub?.name || '').trim();
    const data = window.SUBCLASS_SPELLS_DATA || {};
    const table = classKeys.map(key => data[key]?.[subKey]).find(Boolean);
    if (!table || typeof table !== 'object') return [];
    const rows = [];
    Object.entries(table).forEach(([level, spells]) => {
        if (String(level).startsWith('_') || !Array.isArray(spells)) return;
        const clean = spells.filter(Boolean);
        if (clean.length) rows.push({ level, spells: clean });
    });
    Object.entries(table._variants || {}).forEach(([variant, byLevel]) => {
        if (!byLevel || typeof byLevel !== 'object') return;
        Object.entries(byLevel).forEach(([level, spells]) => {
            if (!Array.isArray(spells)) return;
            const clean = spells.filter(Boolean);
            if (clean.length) rows.push({ level, variant, spells: clean });
        });
    });
    const collator = new Intl.Collator(_compLang() === 'en' ? 'en' : 'it');
    return rows.sort((a, b) => {
        const byLevel = (parseInt(a.level) || 0) - (parseInt(b.level) || 0);
        if (byLevel !== 0) return byLevel;
        return collator.compare(a.variant || '', b.variant || '');
    });
}

function _compSortedSubclasses(subclasses) {
    const collator = new Intl.Collator(_compLang() === 'en' ? 'en' : 'it');
    return [...subclasses].sort((a, b) => {
        const an = _compSubclassSortLabel(a);
        const bn = _compSubclassSortLabel(b);
        const byClean = collator.compare(an, bn);
        if (byClean !== 0) return byClean;
        return collator.compare(_compName(a) || '', _compName(b) || '');
    });
}

function _compSubclassSortLabel(sub) {
    let name = String(_compName(sub) || '').trim();
    name = name.replace(/^(via|cammino|giuramento|circolo|dominio|collegio|scuola|tradizione|archetipo|sentiero)\s+(dell'|della|dello|degli|delle|del|dei|di|de)\s*/i, '');
    name = name.replace(/^(way|path|oath|circle|domain|college|school|tradition|archetype)\s+of\s+(the\s+)?/i, '');
    return name.trim() || String(_compName(sub) || '').trim();
}

function _compFeatureDetail(title, subtitle, features, data) {
    const clsId = data.parent_class_slug || data.classSlug || _compClassKey(data.className || data.classNameEn || '');
    const spellRows = _compSubclassSpellRows(clsId, data);
    const visibleFeatures = _compRenderableFeatures(features, { hideGrantedSpellFeatures: spellRows.length > 0 });
    return `
        <div class="comp-detail-subtitle">${escapeHtml(subtitle || data.name_en || '')}</div>
        ${_compClassProgressionSection(data, 'Progressione incantesimi')}
        ${_compSubclassSpellListSection(clsId, data, spellRows)}
        ${_compFeaturesSection(visibleFeatures)}
    `;
}

function _compRaceDetail(race, title, subtitle) {
    if (race?.versions || race?.subraces) {
        const versions = _compVisibleRaceVersions(race.versions || []);
        const subraces = _compVisibleRaceSubraces(race.subraces || []);
        return `
            ${versions.length ? `<div class="comp-race-version-list">
                ${versions.map(version => _compRaceVersionSection(version)).join('')}
            </div>` : ''}
            ${subraces.length ? `<section class="comp-detail-section">
                <h3>Sottorazze</h3>
                <div class="comp-subclass-accordion-list">
                    ${subraces.map(subrace => _compRaceSubraceAccordion(race, subrace)).join('')}
                </div>
            </section>` : ''}
        `;
    }
    return _compRaceVersionBody({
        title,
        subtitle,
        source: race.source_short || race.source || '',
        data: race,
        baseRace: race.baseRace || race,
        isSubrace: !!race.isSubrace,
    });
}

function _compVisibleRaceVersions(versions) {
    const selectedSources = _compFilterValues(_compStateFor('razze').filters.source);
    if (!selectedSources.length) return versions;
    return versions.filter(version => selectedSources.includes(version.source));
}

function _compVisibleRaceSubraces(subraces) {
    return subraces
        .map(subrace => ({ ...subrace, versions: _compVisibleRaceVersions(subrace.versions || []) }))
        .filter(subrace => subrace.versions.length);
}

function _compRaceSubraceAccordion(race, subrace) {
    const state = _compStateFor('razze');
    const key = `race-subrace:${race.title || 'race'}:${subrace.id}`;
    const isOpen = _compGroupOpen('razze', key, state);
    const sources = _compUnique(subrace.versions.map(version => version.source).filter(Boolean));
    return `<section class="comp-subclass-accordion">
        <button type="button" class="comp-group-divider comp-subclass-toggle ${isOpen ? 'open' : ''}" onclick="compendioToggleGroup('${_compEscapeAttr(key)}')">
            ${_compIcon('chevron-right')}
            <span>${escapeHtml(subrace.title)}</span>
            <small>${escapeHtml(sources.join(', ') || String(subrace.versions.length))}</small>
        </button>
        <div class="comp-subclass-body" ${isOpen ? '' : 'style="display:none;"'}>
            ${subrace.versions.map(version => _compRaceVersionSection(version)).join('')}
        </div>
    </section>`;
}

function _compRaceVersionSection(version) {
    const name = version.isSubrace && version.subtitle ? `${version.title} - ${version.subtitle}` : version.title;
    const label = version.source ? `${name} (${version.source})` : name;
    return `
        <section class="comp-race-version">
            <div class="comp-race-version-divider">
                <span>${escapeHtml(label)}</span>
            </div>
            ${_compRaceVersionBody(version)}
        </section>
    `;
}

function _compRaceVersionBody(version) {
    const base = version.baseRace || version.data || {};
    const race = version.data || {};
    const sourceData = version.isSubrace ? race : base;
    const mergedTraits = [
        ...(base.traits || base.features || []),
        ...(version.isSubrace ? (race.traits || race.features || []) : []),
    ];
    const description = version.isSubrace
        ? [_compField(base, 'description'), _compField(race, 'description')].filter(Boolean).join('\n\n')
        : _compField(base, 'description');
    return `
        ${version.subtitle ? `<div class="comp-detail-subtitle">${escapeHtml(version.subtitle)}</div>` : ''}
        ${_compRaceMetaBoxes(base, version.isSubrace ? race : null)}
        ${_compRaceAsiSection(base, version.isSubrace ? race : null)}
        <section class="comp-detail-section"><h3>Descrizione</h3><div class="comp-rich">${_compRich(description || '')}</div></section>
        ${_compFeaturesSection(mergedTraits)}
    `;
}

function _compRaceMetaBoxes(base, subrace) {
    const languages = _compArrayLabel([...(base.languages || []), ...(subrace ? (subrace.languages || []) : [])]);
    return `<div class="comp-detail-grid comp-race-meta-grid">
        ${_compRaceMetaBox('Taglia', base.size)}
        ${_compRaceMetaBox('Velocita', base.speed != null ? `${base.speed} m` : '')}
        ${_compRaceMetaBox('Linguaggi', languages, true)}
    </div>`;
}

function _compRaceMetaBox(label, value, wide = false) {
    if (value == null || String(value).trim() === '') return '';
    return `<div class="comp-detail-box ${wide ? 'comp-race-meta-wide' : ''}">
        <div class="comp-detail-box-label">${escapeHtml(label)}</div>
        <div class="comp-detail-box-value">${escapeHtml(_compArrayLabel(value))}</div>
    </div>`;
}

function _compRaceAsiSection(base, subrace) {
    const rows = _compRaceAsiRows(base, subrace);
    if (!rows.length) return '';
    return `<section class="comp-detail-section">
        <h3>Incrementi dei punteggi di caratteristica</h3>
        <div class="comp-table-wrap">
            <table class="comp-race-asi-table">
                <tbody>
                    ${rows.map(row => `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`).join('')}
                </tbody>
            </table>
        </div>
    </section>`;
}

function _compRaceAsiRows(base, subrace) {
    const rows = [];
    const baseAsi = [base.asi_text, subrace ? subrace.asi_text : ''].filter(Boolean).join('; ');
    if (baseAsi && !_compRaceAsiIsFloating(base, subrace)) {
        rows.push({ label: 'Regole base', value: baseAsi });
    }
    rows.push({ label: 'Regole Tasha', value: '+2 a una caratteristica e +1 a un\'altra caratteristica a scelta' });
    rows.push({ label: 'Regole MMM', value: '+2 a una caratteristica e +1 a un\'altra, oppure +1 a tre caratteristiche diverse' });
    return rows;
}

function _compRaceAsiIsFloating(base, subrace) {
    const asi = [base?.ability_score_increase, subrace?.ability_score_increase].filter(Boolean);
    return asi.some(value => Object.prototype.hasOwnProperty.call(value, '_any'));
}


function _compBackgroundDetail(bg, title, subtitle) {
    return `
        <div class="comp-detail-subtitle">${escapeHtml([subtitle, bg.source_short || bg.source].filter(Boolean).join(' - '))}</div>
        ${_compBoxes([
            ['Abilita', bg.skill_proficiencies],
            ['Strumenti', bg.tool_proficiencies],
            ['Linguaggi', bg.languages_text || bg.languages || bg.languages_specific],
        ])}
        ${_compStackedBoxes([
            ['Monete iniziali', bg.starting_gold != null ? `${bg.starting_gold} mo` : ''],
            ['Equipaggiamento', bg.equipment || bg.starting_equipment],
        ])}
        <section class="comp-detail-section"><h3>${escapeHtml(bg.feature_name || bg.feature?.name || 'Privilegio')}</h3><div class="comp-rich">${_compRich(bg.feature_description || bg.feature?.description || bg.description || '')}</div></section>
    `;
}

function _compSpellDetail(sp) {
    const lvlText = _compSpellLevel(sp.level);
    return `
        <article class="comp-spell-detail">
            <header class="comp-spell-detail-head">
                <div>
                    <div class="spell-detail-sub">${escapeHtml(lvlText)} &middot; ${escapeHtml(_compSpellField(sp, 'school'))}</div>
                </div>
                <div class="comp-spell-level comp-spell-level-large">${escapeHtml(_compSpellLevelShort(sp.level))}</div>
            </header>
            <div class="spell-detail-meta">
                <div><span class="spell-meta-label">Tempo</span><span>${escapeHtml(_compSpellField(sp, 'casting_time'))}</span></div>
                <div><span class="spell-meta-label">Gittata</span><span>${escapeHtml(_compSpellField(sp, 'range'))}</span></div>
                <div><span class="spell-meta-label">Componenti</span><span>${escapeHtml(_compSpellField(sp, 'components'))}</span></div>
                <div><span class="spell-meta-label">Durata</span><span>${escapeHtml(_compSpellField(sp, 'duration'))}</span></div>
            </div>
            <div class="spell-detail-desc">${_compRich(_compSpellField(sp, 'description'), { linkSpells: false })}</div>
            ${_compSpellSummonsSection(sp)}
            <div class="spell-detail-classes">${(_compSpellField(sp, 'classes') || []).map(c => `<span class="scheda-tag">${escapeHtml(c)}</span>`).join('')}</div>
            ${_compSpellSource(sp) ? `<div class="spell-detail-source">${escapeHtml(_compSpellSource(sp))}</div>` : ''}
        </article>
    `;
}

function _compSpellSummonsSection(sp) {
    if (!_compSummonStatblockDataLoaded && !_compSummonStatblockDataFailed) {
        _compEnsureSummonStatblockData().then(data => {
            if (data.length && _compCurrentTab === 'incantesimi') compendioRenderTab();
        });
    }

    const blocks = _compSpellSummonsFor(sp);
    if (!blocks.length) return '';
    return `<section class="comp-detail-section comp-summon-statblock-section">
        <div class="comp-summon-statblock-list">
            ${blocks.map(block => `
                <button type="button" class="comp-statblock-link comp-summon-statblock-link" onclick="compendioOpenSummonStatblock('${_compEscapeAttr(block.id)}')">
                    ${escapeHtml(block.nome || block.nome_en || 'Statblock')}
                </button>
            `).join('')}
        </div>
    </section>`;
}

function _compSpellSummonsFor(sp) {
    if (!sp || !COMP_SUMMON_STATBLOCKS_DATA.length) return [];
    const spellKeys = [
        _compSpellField(sp, 'name'),
        sp.name,
        sp.name_en,
        ...(Array.isArray(sp.aliases) ? sp.aliases : []),
    ].map(_compLookupKey).filter(Boolean);
    return COMP_SUMMON_STATBLOCKS_DATA.filter(block => {
        const blockKeys = [block.spell_name, block.spell_name_en].map(_compLookupKey).filter(Boolean);
        return blockKeys.some(key => spellKeys.includes(key));
    });
}

async function _compEnsureSummonStatblockData() {
    if (COMP_SUMMON_STATBLOCKS_DATA.length || _compSummonStatblockDataFailed) return COMP_SUMMON_STATBLOCKS_DATA;
    if (_compSummonStatblockDataPromise) return _compSummonStatblockDataPromise;
    if (typeof window.ensureRuntimeData !== 'function') return COMP_SUMMON_STATBLOCKS_DATA;

    _compSummonStatblockDataPromise = window.ensureRuntimeData('summonStatblocks')
        .then(() => {
            COMP_SUMMON_STATBLOCKS_DATA = window.COMP_SUMMON_STATBLOCKS_DATA || [];
            _compSummonStatblockDataLoaded = true;
            return COMP_SUMMON_STATBLOCKS_DATA;
        })
        .catch(error => {
            _compSummonStatblockDataFailed = true;
            console.warn('Statblock evocati non caricati', error);
            return COMP_SUMMON_STATBLOCKS_DATA;
        });

    return _compSummonStatblockDataPromise;
}

function _compLinkedStatblocksSection(links, title = 'Statblock collegati') {
    const items = (Array.isArray(links) ? links : [])
        .map(link => ({
            ref: link.monster || link.name || link.id || link.label,
            label: link.label || link.monster || link.name || 'Statblock',
        }))
        .filter(link => link.ref);
    if (!items.length) return '';
    return `<section class="comp-detail-section comp-linked-statblock-section">
        <h3>${escapeHtml(title)}</h3>
        <div class="comp-summon-statblock-list">
            ${items.map(({ ref, label }) => `
                <button type="button" class="comp-statblock-link" onclick="compendioOpenLinkedStatblock('${_compEscapeAttr(ref)}')">
                    ${escapeHtml(label)}
                </button>
            `).join('')}
        </div>
    </section>`;
}

function _compFindMonsterStatblock(value) {
    const ref = String(value || '').trim();
    if (!ref) return null;
    const key = _compLookupKey(ref);
    return (COMP_MONSTERS_DATA || []).find(monster => (
        String(monster.id || '') === ref ||
        _compLookupKey(monster.nome) === key ||
        _compLookupKey(monster.nome_en) === key
    )) || null;
}

function _compSimpleDetail(item, boxes) {
    return `
        <div class="comp-detail-subtitle">${escapeHtml(item.subtitle || '')}</div>
        ${_compBoxes(boxes)}
        <section class="comp-detail-section"><h3>Descrizione</h3><div class="comp-rich">${_compRich(item.data.description || item.data.description_it || item.data.description_en || '')}</div></section>
    `;
}

function _compFeaturesSection(features, title = 'Privilegi') {
    if (!features || !features.length) return '';
    return `<section class="comp-detail-section">
        <h3>${escapeHtml(title)}</h3>
        <div class="comp-feature-list">
            ${features.map(f => `<article class="comp-feature ${f._compOptional ? 'comp-feature-optional' : ''}">
                <h4 class="comp-feature-title">${escapeHtml(_compName(f) || 'Privilegio')}${f.level != null ? ` - Livello ${escapeHtml(String(f.level))}` : ''}</h4>
                ${f.replaces?.length ? `<div class="comp-feature-note">Sostituisce: ${escapeHtml(_compArrayLabel(f.replaces))}</div>` : ''}
                ${f.source_short ? `<div class="comp-feature-note">Fonte: ${escapeHtml(f.source_short)}</div>` : ''}
                <div class="comp-rich">${_compRich(_compField(f, 'description') || f.description_it || f.description_en || '')}</div>
                ${_compFeatureInlineExtras(f)}
            </article>`).join('')}
        </div>
    </section>`;
}

function _compFeatureInlineExtras(feature) {
    const keys = _compFeatureKeys(feature);
    const tableKey = keys.find(key => COMP_FEATURE_TABLES[key]);
    const statblockKey = keys.find(key => COMP_FEATURE_STATBLOCK_LINKS[key]);
    return [
        _compUtilityTableSections(tableKey ? COMP_FEATURE_TABLES[tableKey] : null),
        keys.includes('metamagia') || keys.includes('metamagic') ? _compMetamagicOptionsHtml() : '',
        _compLinkedStatblocksSection(statblockKey ? COMP_FEATURE_STATBLOCK_LINKS[statblockKey] : null, 'Statblock collegati'),
    ].filter(Boolean).join('');
}

function _compFeatureKeys(feature) {
    const keys = [
        feature?.slug,
        feature?.name,
        feature?.name_en,
        _compName(feature),
    ];
    return [...new Set(keys.map(value => _compLookupKey(value).replace(/\s+/g, '-')).filter(Boolean))];
}

function _compMetamagicOptionsHtml() {
    return `<details class="comp-inline-accordion comp-metamagic-accordion">
        <summary>Opzioni di Metamagia</summary>
        <div class="comp-metamagic-grid">
            ${COMP_METAMAGIC_OPTIONS.map(option => `
                <button type="button" class="comp-metamagic-card" onclick="compendioOpenMetamagicOption('${_compEscapeAttr(option.id)}')">
                    <span>${escapeHtml(option.name)}${option.source ? ` <small>${escapeHtml(option.source)}</small>` : ''}</span>
                    <strong>${escapeHtml(option.cost)}</strong>
                </button>
            `).join('')}
        </div>
    </details>`;
}

function _compBoxes(boxes) {
    const clean = boxes.filter(([, value]) => value != null && String(value).trim() !== '');
    if (!clean.length) return '';
    return `<div class="comp-detail-grid">${clean.map(([label, value]) => `
        <div class="comp-detail-box">
            <div class="comp-detail-box-label">${escapeHtml(label)}</div>
            <div class="comp-detail-box-value">${_compBoxValueHtml(value)}</div>
        </div>
    `).join('')}</div>`;
}

function _compStackedBoxes(boxes) {
    const clean = boxes.filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return value != null && String(value).trim() !== '';
    });
    if (!clean.length) return '';
    return `<div class="comp-detail-grid comp-detail-grid-stacked">${clean.map(([label, value]) => `
        <div class="comp-detail-box">
            <div class="comp-detail-box-label">${escapeHtml(label)}</div>
            <div class="comp-detail-box-value">${_compBoxValueHtml(value, true)}</div>
        </div>
    `).join('')}</div>`;
}

function _compBoxValueHtml(value, preferList = false) {
    if (Array.isArray(value) && preferList) {
        const items = value.filter(Boolean);
        if (!items.length) return '';
        return `<ul class="comp-box-list">${items.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>`;
    }
    return escapeHtml(_compArrayLabel(value));
}

function _compClassProgressionSection(cls, title = 'Progressione di classe') {
    const rows = _compClassProgressionRows(cls);
    const columns = _compClassProgressionColumns(rows);
    const hasProgressionColumns = columns.some(key => key !== 'Level');
    if (!rows.length || !hasProgressionColumns) return '';
    const tableClasses = [
        'comp-level-table',
        columns.some(_compIsSpellSlotColumn) ? 'comp-level-table-spell-slots' : '',
        columns.length <= 4 ? 'comp-level-table-fill' : '',
    ].filter(Boolean).join(' ');
    return `<section class="comp-detail-section">
        <h3>${escapeHtml(title)}</h3>
        <div class="comp-table-wrap comp-level-table-wrap">
            <table class="${tableClasses}">
                <colgroup>
                    ${columns.map(key => `<col class="${_compProgressionColumnClass(key)}">`).join('')}
                </colgroup>
                <thead>
                    <tr>${columns.map(key => `<th class="${_compProgressionColumnClass(key)}">${escapeHtml(_compClassColumnLabel(key))}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${rows.map(row => `<tr>${columns.map(key => `<td class="${_compProgressionColumnClass(key)}">${escapeHtml(_compClassCellValue(row, key))}</td>`).join('')}</tr>`).join('')}
                </tbody>
            </table>
        </div>
    </section>`;
}

function _compClassProgressionRows(cls) {
    const rows = Array.isArray(cls?.level_table) ? cls.level_table : [];
    const key = _compClassCanonicalKey(cls);
    if (key !== 'bardo') return rows;
    return rows.map(row => ({
        ...row,
        'Bardic Inspiration': _compBardicInspirationDie(row?._level || row?.Level),
    }));
}

function _compBardicInspirationDie(level) {
    const numeric = Number(String(level || '').match(/\d+/)?.[0] || 0);
    if (numeric >= 15) return 'd12';
    if (numeric >= 10) return 'd10';
    if (numeric >= 5) return 'd8';
    if (numeric >= 1) return 'd6';
    return '';
}

function _compClassProgressionColumns(rows) {
    if (!rows.length) return [];
    const preferred = [
        'Level',
        'Bardic Inspiration',
        'Rages', 'Rage Damage', 'Sneak Attack', 'Martial Arts', 'Ki Points', 'Unarmored Movement',
        'Infusions Known', 'Infused Items',
        'Sorcery Points', 'Cantrips Known', 'Spells Known',
        'Spell Slots', 'Slot Level', 'Invocations Known',
        '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th',
    ];
    const present = new Set();
    rows.forEach(row => {
        Object.keys(row || {}).forEach(key => {
            if (key === '_level' || key === 'Features' || key === 'Proficiency Bonus') return;
            const hasValue = rows.some(r => {
                const value = r?.[key];
                return value != null && String(value).trim() !== '' && String(value).trim() !== '-';
            });
            if (hasValue || key === 'Level') present.add(key);
        });
    });
    const ordered = preferred.filter(key => present.has(key));
    const extras = Array.from(present).filter(key => !preferred.includes(key)).sort((a, b) => a.localeCompare(b, 'it'));
    return [...ordered, ...extras];
}

function _compIsSpellSlotColumn(key) {
    return /^(1st|2nd|3rd|4th|5th|6th|7th|8th|9th)$/.test(key);
}

function _compProgressionColumnClass(key) {
    if (key === 'Level') return 'comp-level-col-level';
    if (_compIsSpellSlotColumn(key)) return 'comp-level-col-slot';
    if (['Rages', 'Infused Items', 'Sorcery Points', 'Ki Points', 'Cantrips Known', 'Spell Slots', 'Bardic Inspiration'].includes(key)) return 'comp-level-col-short';
    if (['Rage Damage', 'Sneak Attack', 'Martial Arts', 'Slot Level', 'Invocations Known'].includes(key)) return 'comp-level-col-medium';
    return 'comp-level-col-wide';
}

function _compClassColumnLabel(key) {
    const it = {
        Level: 'Liv.',
        'Proficiency Bonus': 'Bonus competenza',
        'Bardic Inspiration': 'Ispirazione Bardica',
        Rages: 'Ire',
        'Rage Damage': 'Danno ira',
        'Sneak Attack': 'Attacco furtivo',
        'Martial Arts': 'Arti marziali',
        'Ki Points': 'Punti ki',
        'Unarmored Movement': 'Movimento senza armatura',
        'Infusions Known': 'Infusioni conosciute',
        'Infused Items': 'Elementi infusi',
        'Sorcery Points': 'Punti stregoneria',
        'Cantrips Known': 'Trucchetti',
        'Spells Known': 'Inc. conosciuti',
        'Spell Slots': 'Slot',
        'Slot Level': 'Livello slot',
        'Invocations Known': 'Suppliche',
        '1st': `1\u00B0`,
        '2nd': `2\u00B0`,
        '3rd': `3\u00B0`,
        '4th': `4\u00B0`,
        '5th': `5\u00B0`,
        '6th': `6\u00B0`,
        '7th': `7\u00B0`,
        '8th': `8\u00B0`,
        '9th': `9\u00B0`,
    };
    if (_compLang() === 'en') {
        if (key === 'Level') return 'Lv.';
        if (key === 'Proficiency Bonus') return 'Proficiency';
        return key;
    }
    return it[key] || key;
}

function _compClassCellValue(row, key) {
    if (key === 'Level') return String(row?._level || row?.Level || '');
    const raw = String(row?.[key] ?? '').trim();
    if (!raw || raw === '-') return '-';
    if (_compLang() === 'it') {
        return raw.replace(/^(\d+)(st|nd|rd|th)$/i, (_, n) => `${n}\u00B0`);
    }
    return raw;
}

function _compRich(text, options = {}) {
    const raw = String(text || '').trim();
    if (!raw) return '<p>Nessuna descrizione disponibile.</p>';
    const html = typeof window.formatRichText === 'function'
        ? window.formatRichText(raw)
        : raw.split(/\n{2,}/).map(p => `<p>${escapeHtml(p)}</p>`).join('');
    if (options.linkSpells !== true) return html;
    return _compLinkSpellRefs(html);
}

function _compPlain(text) {
    return String(text || '').replace(/\*\*/g, '').replace(/\n+/g, ' ').trim();
}

function _compLinkSpellRefs(html) {
    if (!html || !window.SPELLS_DATA) return html;
    return String(html)
        .split(/(<[^>]+>)/g)
        .map(part => part.startsWith('<') ? part : _compLinkSpellRefsInText(part))
        .join('');
}

function _compLinkSpellRefsInText(text) {
    const entries = _compSpellRefEntries();
    if (!entries.length || !text) return text;
    const matches = [];
    entries.forEach(entry => {
        const label = escapeHtml(entry.label);
        if (!label || label.length < 4) return;
        const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])(${_compRegexEscape(label)})(?=$|[^\\p{L}\\p{N}_])`, 'gu');
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const start = match.index + match[1].length;
            const value = match[2];
            const end = start + value.length;
            if (_compShouldLinkSpellRef(text, start, end, entry) && !_compRangesOverlap(matches, start, end)) {
                matches.push({ start, end, id: entry.id });
            }
            if (pattern.lastIndex === match.index) pattern.lastIndex += 1;
        }
    });
    if (!matches.length) return text;
    matches.sort((a, b) => a.start - b.start);
    let cursor = 0;
    let out = '';
    matches.forEach(match => {
        out += text.slice(cursor, match.start);
        const label = text.slice(match.start, match.end);
        out += `<button type="button" class="comp-spell-ref" onclick="compendioOpenSpellRef('${_compEscapeAttr(match.id)}')">${label}</button>`;
        cursor = match.end;
    });
    return out + text.slice(cursor);
}

function _compSpellRefEntries() {
    const data = window.SPELLS_DATA || {};
    const size = Object.keys(data).length;
    if (_compSpellRefCache && _compSpellRefCacheSize === size) return _compSpellRefCache;
    const seen = new Set();
    const entries = [];
    Object.entries(data).forEach(([id, spell]) => {
        const labels = [
            spell?.name,
            spell?.name_en,
            ...(Array.isArray(spell?.aliases) ? spell.aliases : []),
        ];
        labels.forEach(label => {
            const clean = String(label || '').trim();
            const key = clean.toLowerCase();
            if (!clean || seen.has(key)) return;
            seen.add(key);
            entries.push({ id, label: clean, ambiguous: _compIsAmbiguousSpellRef(clean) });
        });
    });
    _compSpellRefCache = entries.sort((a, b) => b.label.length - a.label.length);
    _compSpellRefCacheSize = size;
    return _compSpellRefCache;
}

function _compShouldLinkSpellRef(text, start, end, entry) {
    if (!entry.ambiguous) return true;
    const context = `${text.slice(Math.max(0, start - 80), start)} ${text.slice(end, Math.min(text.length, end + 80))}`;
    return COMP_SPELL_REF_CONTEXT_RE.test(context);
}

function _compIsAmbiguousSpellRef(label) {
    const clean = String(label || '').trim();
    if (!clean) return true;
    const singleWord = !/[\s/,'-]/.test(clean);
    return COMP_AMBIGUOUS_SPELL_REF_LABELS.has(_compSpellRefAmbiguousKey(clean)) || (singleWord && clean.length <= 7);
}

function _compSpellRefAmbiguousKey(text) {
    return String(text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function _compLookupKey(text) {
    return String(text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/['’`]/g, '')
        .replace(/[^a-z0-9]+/gi, ' ')
        .trim()
        .toLowerCase();
}

function _compRangesOverlap(ranges, start, end) {
    return ranges.some(range => start < range.end && end > range.start);
}

function _compRegexEscape(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

window.compendioOpenSpellRef = async function(id) {
    const spellId = _compFindSpellRefId(id);
    if (spellId) await _compOpenSpellRefModal(spellId);
};

window.compendioOpenSummonStatblock = async function(id) {
    await _compEnsureSummonStatblockData();
    const block = (COMP_SUMMON_STATBLOCKS_DATA || []).find(item => String(item.id) === String(id));
    if (!block) return;
    _compOpenStatblockModal(block);
};

window.compendioOpenLinkedStatblock = async function(id) {
    await _compEnsureMonsterData();
    const block = _compFindMonsterStatblock(id);
    if (!block) return;
    _compOpenStatblockModal(block);
};

window.compendioOpenMetamagicOption = function(id) {
    const option = COMP_METAMAGIC_OPTIONS.find(item => item.id === id);
    if (!option) return;
    document.querySelector('.comp-metamagic-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay comp-metamagic-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) overlay.remove();
    };
    overlay.innerHTML = `
        <div class="hp-calc-modal comp-spell-ref-modal comp-metamagic-modal">
            <button class="modal-close" type="button" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h3 class="comp-spell-ref-title">${escapeHtml(option.name)}</h3>
            <div class="comp-detail-grid comp-detail-grid-stacked">
                <div class="comp-detail-box">
                    <div class="comp-detail-box-label">Costo</div>
                    <div class="comp-detail-box-value">${escapeHtml(option.cost)}</div>
                </div>
                ${option.source ? `<div class="comp-detail-box">
                    <div class="comp-detail-box-label">Fonte</div>
                    <div class="comp-detail-box-value">${escapeHtml(option.source)}</div>
                </div>` : ''}
            </div>
            <section class="comp-detail-section">
                <h3>Effetto</h3>
                <div class="comp-rich"><p>${escapeHtml(option.description)}</p></div>
            </section>
        </div>
    `;
    document.body.appendChild(overlay);
};

function _compOpenStatblockModal(block) {
    document.querySelector('.comp-summon-statblock-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay comp-summon-statblock-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) overlay.remove();
    };
    overlay.innerHTML = `
        <div class="hp-calc-modal comp-spell-ref-modal comp-summon-statblock-modal">
            <button class="modal-close" type="button" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h3 class="comp-spell-ref-title">${escapeHtml(block.nome || block.nome_en || 'Statblock')}</h3>
            ${_compMonsterDetail(block)}
        </div>
    `;
    document.body.appendChild(overlay);
}

function _compFindSpellRefId(value) {
    const ref = String(value || '').trim();
    if (!ref) return '';
    const data = window.SPELLS_DATA || {};
    if (data[ref]) return ref;
    const lowered = ref.toLowerCase();
    const match = _compSpellRefEntries().find(entry => entry.label.toLowerCase() === lowered || String(entry.id).toLowerCase() === lowered);
    return match?.id || '';
}

async function _compOpenSpellRefModal(spellId) {
    const spell = (window.SPELLS_DATA || {})[spellId];
    if (!spell) return;
    await _compEnsureSummonStatblockData();
    document.querySelector('.comp-spell-ref-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay comp-spell-ref-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) overlay.remove();
    };
    overlay.innerHTML = `
        <div class="hp-calc-modal comp-spell-ref-modal">
            <button class="modal-close" type="button" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h3 class="comp-spell-ref-title">${escapeHtml(_compSpellField(spell, 'name'))}</h3>
            ${_compSpellDetail(spell)}
        </div>
    `;
    document.body.appendChild(overlay);
}

function _compScrollToTop() {
    requestAnimationFrame(() => {
        document.getElementById('mainContent')?.scrollTo({ top: 0, left: 0 });
        document.getElementById('compendioContent')?.scrollTo?.({ top: 0, left: 0 });
        window.scrollTo?.({ top: 0, left: 0 });
    });
}

function _compLang() {
    try { return typeof getAppLang === 'function' ? getAppLang() : 'it'; }
    catch { return 'it'; }
}

function _compField(entry, field) {
    if (!entry) return '';
    if (_compLang() === 'en') return entry[`${field}_en`] || entry[field] || '';
    return entry[field] || entry[`${field}_en`] || '';
}

function _compName(entry) {
    if (!entry) return '';
    if (_compLang() === 'en') return entry.name_en || entry.name || entry.name_it || '';
    return entry.name || entry.name_it || entry.name_en || '';
}

function _compSpellField(sp, key) {
    if (!sp) return '';
    if (_compLang() === 'en') {
        switch (key) {
            case 'name': return sp.name_en || sp.name || '';
            case 'school': return (sp.school || sp.school_it || '').replace(/^./, c => c.toUpperCase());
            case 'casting_time': return sp.casting_time_en || sp.casting_time || '';
            case 'range': return sp.range_en || sp.range || '';
            case 'components': return sp.components_en || sp.components || '';
            case 'duration': return sp.duration_en || sp.duration || '';
            case 'description': return sp.description_en || sp.description || '';
            case 'classes': return sp.classes_en || sp.classes || [];
        }
    }
    switch (key) {
        case 'name': return sp.name || sp.name_en || '';
        case 'school': return sp.school_it || (sp.school || '').replace(/^./, c => c.toUpperCase());
        case 'casting_time': return sp.casting_time || sp.casting_time_en || '';
        case 'range': return sp.range || sp.range_en || '';
        case 'components': return sp.components || sp.components_en || '';
        case 'duration': return sp.duration || sp.duration_en || '';
        case 'description': return sp.description || sp.description_en || '';
        case 'classes': return sp.classes || sp.classes_en || [];
    }
    return '';
}

function _compSpellSource(sp) {
    const source = String(sp?.source || '').trim();
    if (!source) return '';
    const classExpansion = source.match(/^(?:Artificer|Bard|Cleric|Druid|Paladin|Ranger|Sorcerer|Warlock|Wizard|Artefice|Bardo|Chierico|Druido|Paladino|Stregone|Mago|Ladro)\s+\[([A-Za-z0-9+]+)\]$/i);
    if (classExpansion) {
        return _compSourceFromAbbrev(classExpansion[1]);
    }
    return source;
}

function _compSpellClassOptions(allItems) {
    const spellClasses = allItems.flatMap(item => _compSpellClassLabels(item.data));
    const casterClasses = (window.CLASSES_DATA || [])
        .filter(cls => cls.spellcasting_ability || cls.spellcasting_ability_en)
        .map(cls => _compName(cls));
    return _compUnique([...spellClasses, ...casterClasses]);
}

function _compSpellClassLabels(sp) {
    if (!sp) return [];
    const labels = _compLang() === 'en' ? (sp.classes_en || sp.classes || []) : (sp.classes || sp.classes_en || []);
    const sourceClass = _compSpellSourceClass(sp, _compLang());
    const virtualClasses = _compSpellVirtualClasses(sp);
    return [...labels, sourceClass, ...virtualClasses].filter(Boolean);
}

function _compSpellMatchesClass(sp, className) {
    const wanted = _compClassAliasSet(className);
    const labels = [
        ...(sp?.classes || []),
        ...(sp?.classes_en || []),
        _compSpellSourceClass(sp, 'it'),
        _compSpellSourceClass(sp, 'en'),
        ..._compSpellVirtualClasses(sp, 'it'),
        ..._compSpellVirtualClasses(sp, 'en'),
    ].filter(Boolean);
    return labels.some(label => {
        const aliases = _compClassAliasSet(label);
        return [...aliases].some(alias => wanted.has(alias));
    });
}

function _compSpellVirtualClasses(sp, lang = _compLang()) {
    const name = String(sp?.name_en || sp?.name || '').trim().toLowerCase();
    if (!COMP_ARTIFICER_SPELLS.has(name)) return [];
    return [COMP_CLASS_LABELS.artefice[lang]];
}

function _compSpellSourceClass(sp, lang = _compLang()) {
    const match = String(sp?.source || '').trim().match(/^(.+?)\s+\[[A-Za-z0-9+]+\]$/);
    if (!match) return '';
    const key = _compClassKey(match[1]);
    return key ? COMP_CLASS_LABELS[key]?.[lang] || match[1] : match[1];
}

function _compClassAliasSet(value) {
    const key = _compClassKey(value);
    if (!key) return new Set();
    return new Set([key, ...(COMP_CLASS_ALIASES[key] || [])]);
}

function _compClassKey(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return '';
    if (COMP_CLASS_LABELS[key]) return key;
    const labelKey = Object.entries(COMP_CLASS_ALIASES)
        .find(([canonical, aliases]) => COMP_CLASS_LABELS[canonical] && (canonical === key || aliases.includes(key)))?.[0];
    if (labelKey) return labelKey;
    if (COMP_CLASS_ALIASES[key]) return key;
    return Object.entries(COMP_CLASS_ALIASES).find(([canonical, aliases]) => aliases.includes(key) || canonical === key)?.[0] || key;
}

function _compSourceFromAbbrev(abbrev) {
    const key = String(abbrev || '').trim().toUpperCase();
    const sources = {
        TCOE: "Tasha's Cauldron of Everything",
        XGTE: "Xanathar's Guide to Everything",
        FTD: "Fizban's Treasury of Dragons",
        PHB: "Player's Handbook",
        SRD: "Player's Handbook (SRD)",
        BR: "Player's Handbook (BR+)",
        'BR+': "Player's Handbook (BR+)",
    };
    return sources[key] || abbrev;
}

function _compEscapeAttr(value) {
    return String(value || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function _compObjectValues(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') return Object.values(value);
    return [];
}

function _compSigned(value) {
    if (value == null || value === '') return '-';
    const num = Number(value);
    if (!Number.isFinite(num)) return String(value);
    return num >= 0 ? `+${num}` : String(num);
}

function _compMonsterChallengeLabel(value) {
    const clean = String(value || '').trim();
    if (!clean || clean === '?' || clean === '-' || clean.toLowerCase() === 'senza gs') return 'Senza GS';
    return `GS ${clean || '?'}`;
}

function _compMonsterChallengeValue(value) {
    const clean = String(value || '').trim();
    if (!clean || clean === '?' || clean === '-' || clean.toLowerCase() === 'senza gs') return 999;
    if (clean.includes('/')) {
        const [a, b] = clean.split('/').map(Number);
        if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
    }
    const numeric = Number(clean.replace(',', '.'));
    return Number.isFinite(numeric) ? numeric : 999;
}

function _compFilterValues(value) {
    if (Array.isArray(value)) return value.map(v => String(v || '').trim()).filter(Boolean);
    if (value == null || value === '') return [];
    return [String(value).trim()].filter(Boolean);
}

function _compUnique(values) {
    return Array.from(new Set(values.map(v => String(v || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'it'));
}

function _compArrayLabel(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join(', ');
    return value || '';
}

function _compPrereqLabel(value) {
    if (Array.isArray(value)) {
        if (!value.length) return 'Nessuno';
        return value.map(v => {
            if (typeof v === 'string') return v;
            if (!v || typeof v !== 'object') return String(v || '');
            if (v.type === 'level') return `Livello ${v.value}`;
            if (v.type === 'spell') return v.value_it || v.value || 'Incantesimo richiesto';
            if (v.type === 'feature') return v.value || 'Privilegio richiesto';
            return [v.type, v.value_it || v.value].filter(Boolean).join(': ');
        }).filter(Boolean).join(', ');
    }
    return value || 'Nessuno';
}

function _compFeatureLevels(features) {
    const levels = _compUnique((features || []).map(f => f.level != null ? String(f.level) : ''));
    return levels.length ? `Livelli ${levels.join(', ')}` : '';
}

function _compSpellLevel(level) {
    const n = Number(level);
    if (_compLang() === 'en') return n === 0 ? 'Cantrip' : `Level ${n}`;
    return n === 0 ? 'Trucchetto' : `Livello ${n}`;
}

function _compSpellLevelShort(level) {
    const n = Number(level);
    return n === 0 ? (_compLang() === 'en' ? 'C' : 'T') : String(n);
}

function _compSpellHasComponent(sp, component) {
    const txt = String(sp.components || sp.components_en || '').toUpperCase();
    return txt.replace(/\(.*?\)/g, '').split(/[,\s]+/).filter(Boolean).includes(component);
}

function _compSpellIsConcentration(sp) {
    return String(sp.duration || sp.duration_en || '').toLowerCase().startsWith('concentr');
}

function _compSpellIsRitual(sp) {
    if (sp.ritual === true) return true;
    return /ritual|rituale/i.test(`${sp.casting_time || ''} ${sp.casting_time_en || ''}`);
}

function _compIcon(name) {
    const icons = {
        'book-open': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H2z"></path><path d="M22 4h-7a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h7z"></path></svg>',
        layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path></svg>',
        scroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h12a2 2 0 0 0 2-2V5a3 3 0 0 0-3-3H8"></path><path d="M8 21a3 3 0 0 1-3-3V5a3 3 0 0 1 6 0v13a3 3 0 0 1-3 3z"></path></svg>',
        star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
        shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"></path><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"></path></svg>',
        wand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 4l5 5"></path><path d="M14 5l-9 9 5 5 9-9"></path><path d="M4 20l2-2"></path></svg>',
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
        sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>',
        'arrow-left': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>',
        'chevron-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"></path></svg>',
        eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
        'eye-off': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18"></path><path d="M10.6 10.6A3 3 0 0 0 13.4 13.4"></path><path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18.1 18.1 0 0 1-4.1 5.1"></path><path d="M6.1 6.1A18.1 18.1 0 0 0 2 12s3.5 8 10 8a10.7 10.7 0 0 0 4.8-1.1"></path></svg>',
    };
    return icons[name] || icons['book-open'];
}

document.addEventListener('appLangChanged', () => {
    if (window.AppState?.currentPage === 'compendio') loadCompendio();
});
