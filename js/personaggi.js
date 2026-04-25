// ============================================================================
// PERSONAGGI MANAGEMENT
// ============================================================================

// [BUILD-MARKER] Se vedi questa riga in console, hai la versione nuova del file.
console.log('[homebrew][build] personaggi.js BUILD 2026-04-23-F integrazione sottoclassi homebrew nella scheda');

let editingPersonaggioId = null;
let pgWizardCurrentStep = 0;
let pgSelectedClasses = [];
let pgSelectedEquipment = [];
let _pgRaceSkills = [];
let _pgBgSkills = [];
// Strumenti e linguaggi auto-popolati dal background, per poterli rimuovere
// se l'utente cambia bg.
let _pgBgTools = [];
let _pgBgLangs = [];
// Linguaggi/strumenti aggiunti tramite background (set, di soli "fissi").
let pgCurrentBgLanguages = new Set();
let pgCurrentBgTools = new Set();
let _pgRaceResistances = [];

// =====================================================
// FONTI APPROVATE:
// PHB  = Manuale del Giocatore
// DMG  = Manuale del Dungeon Master
// MM   = Manuale dei Mostri
// XGtE = Guida Omnicomprensiva di Xanathar
// TCoE = Calderone Omnicomprensivo di Tasha
// FToD = Il Tesoro dei Draghi di Fizban
// EBR  = Eberron: Nascita dall'Ultima Guerra
// MToF = Tomo dei Nemici di Mordenkainen
// VGtM = Guida dei Mostri di Volo
// =====================================================

const DND_CLASSES = ['Artefice','Barbaro','Bardo','Chierico','Druido','Guerriero','Ladro','Mago','Monaco','Paladino','Ranger','Stregone','Warlock'];

const DND_RACES_GROUPED = [
    { label: 'Dragonidi', type: 'divider' },
    'Dragonide Cromatico',              // FToD
    'Dragonide di Gemma',               // FToD
    'Dragonide Metallico',              // FToD
    { label: 'Elfi', type: 'divider' },
    'Eladrin',                          // MToF
    'Elfo Alto',                        // PHB
    'Elfo dei Boschi',                  // PHB
    'Elfo del Mare',                    // MToF
    'Elfo Oscuro (Drow)',               // PHB
    'Shadar-kai',                       // MToF
    { label: 'Gith', type: 'divider' },
    'Githyanki',                        // MToF
    'Githzerai',                        // MToF
    { label: 'Gnomi', type: 'divider' },
    'Gnomo del Profondo',               // MToF
    'Gnomo delle Foreste',              // PHB
    'Gnomo delle Rocce',                // PHB
    { label: 'Halfling', type: 'divider' },
    'Halfling Piedelesto',              // PHB
    'Halfling Tozzo',                   // PHB
    { label: 'Nani', type: 'divider' },
    'Duergar',                          // MToF
    'Nano delle Colline',               // PHB
    'Nano delle Montagne',              // PHB
    { label: 'Tiefling', type: 'divider' },
    'Tiefling di Asmodeus',             // PHB
    'Tiefling di Baalzebul',            // MToF
    'Tiefling di Dispater',             // MToF
    'Tiefling di Fierna',               // MToF
    'Tiefling di Glasya',               // MToF
    'Tiefling di Levistus',             // MToF
    'Tiefling di Mammon',               // MToF
    'Tiefling di Mephistopheles',       // MToF
    'Tiefling di Zariel',               // MToF
    { type: 'divider', label: '' },
    'Aasimar',                          // VGtM
    'Bugbear',                          // EBR / VGtM
    'Changeling',                       // EBR
    'Firbolg',                          // VGtM
    'Goblin',                           // EBR / VGtM
    'Goliath',                          // VGtM
    'Hobgoblin',                        // EBR / VGtM
    'Kalashtar',                        // EBR
    'Kenku',                            // VGtM
    'Kobold',                           // VGtM
    'Lineaggio Personalizzato',         // TCoE
    'Lizardfolk',                       // VGtM
    'Mezzelfo',                         // PHB
    'Mezzorco',                         // PHB
    'Orco',                             // EBR / VGtM
    'Shifter',                          // EBR
    'Tabaxi',                           // VGtM
    'Triton',                           // VGtM
    'Umano',                            // PHB
    'Warforged',                        // EBR
    'Yuan-Ti Purblood',                 // VGtM
];

const DND_BACKGROUNDS = [
    // PHB
    'Accolito','Artigiano di Gilda','Ciarlatano','Criminale','Eremita',
    'Eroe Popolare','Forestiero','Intrattenitore','Marinaio','Monello',
    'Nobile','Ricercatore','Soldato',
    // PHB (varianti)
    'Cavaliere','Gladiatore','Mercante di Gilda','Pirata','Spia',
    // EBR
    'Agente di Casata'
];

const CLASS_SAVES = {
    'Artefice': ['costituzione','intelligenza'],
    'Barbaro': ['forza','costituzione'],
    'Bardo': ['destrezza','carisma'],
    'Chierico': ['saggezza','carisma'],
    'Druido': ['intelligenza','saggezza'],
    'Guerriero': ['forza','costituzione'],
    'Ladro': ['destrezza','intelligenza'],
    'Mago': ['intelligenza','saggezza'],
    'Monaco': ['forza','destrezza'],
    'Paladino': ['saggezza','carisma'],
    'Ranger': ['forza','destrezza'],
    'Stregone': ['costituzione','carisma'],
    'Warlock': ['saggezza','carisma']
};

const DND_SKILLS = [
    { key: 'acrobazia', nome: 'Acrobazia', ability: 'destrezza', abbr: 'Des' },
    { key: 'addestrare_animali', nome: 'Addestrare Animali', ability: 'saggezza', abbr: 'Sag' },
    { key: 'arcano', nome: 'Arcano', ability: 'intelligenza', abbr: 'Int' },
    { key: 'atletica', nome: 'Atletica', ability: 'forza', abbr: 'For' },
    { key: 'furtivita', nome: 'Furtività', ability: 'destrezza', abbr: 'Des' },
    { key: 'indagare', nome: 'Indagare', ability: 'intelligenza', abbr: 'Int' },
    { key: 'inganno', nome: 'Inganno', ability: 'carisma', abbr: 'Car' },
    { key: 'intimidire', nome: 'Intimidire', ability: 'carisma', abbr: 'Car' },
    { key: 'intrattenere', nome: 'Intrattenere', ability: 'carisma', abbr: 'Car' },
    { key: 'intuizione', nome: 'Intuizione', ability: 'saggezza', abbr: 'Sag' },
    { key: 'medicina', nome: 'Medicina', ability: 'saggezza', abbr: 'Sag' },
    { key: 'natura', nome: 'Natura', ability: 'intelligenza', abbr: 'Int' },
    { key: 'percezione', nome: 'Percezione', ability: 'saggezza', abbr: 'Sag' },
    { key: 'persuasione', nome: 'Persuasione', ability: 'carisma', abbr: 'Car' },
    { key: 'rapidita_di_mano', nome: 'Rapidità di Mano', ability: 'destrezza', abbr: 'Des' },
    { key: 'religione', nome: 'Religione', ability: 'intelligenza', abbr: 'Int' },
    { key: 'sopravvivenza', nome: 'Sopravvivenza', ability: 'saggezza', abbr: 'Sag' },
    { key: 'storia', nome: 'Storia', ability: 'intelligenza', abbr: 'Int' }
];

const DND_LINGUAGGI = [
    'Comune','Elfico','Gigante','Gnomesco','Goblin','Halfling','Nanico','Orchesco',
    'Abissale','Celestiale','Draconico','Gergo delle Profondità','Infernale','Primordiale','Silvano','Sottocomune'
];

const DND_ARMI = [
    { nome:'Ascia', cat:'semplice_mischia', danni:'1d6', tipo_danno:'taglienti', proprieta:['Lancio (6/18)','Leggera'] },
    { nome:'Bastone Ferrato', cat:'semplice_mischia', danni:'1d6', tipo_danno:'contundenti', proprieta:['Versatile (1d8)'] },
    { nome:'Falcetto', cat:'semplice_mischia', danni:'1d4', tipo_danno:'taglienti', proprieta:['Leggera'] },
    { nome:'Giavellotto', cat:'semplice_mischia', danni:'1d6', tipo_danno:'perforanti', proprieta:['Lancio (9/36)'] },
    { nome:'Lancia', cat:'semplice_mischia', danni:'1d6', tipo_danno:'perforanti', proprieta:['Lancio (6/18)','Versatile (1d8)'] },
    { nome:'Martello Leggero', cat:'semplice_mischia', danni:'1d4', tipo_danno:'contundenti', proprieta:['Lancio (6/18)','Leggera'] },
    { nome:'Mazza', cat:'semplice_mischia', danni:'1d6', tipo_danno:'contundenti', proprieta:[] },
    { nome:'Pugnale', cat:'semplice_mischia', danni:'1d4', tipo_danno:'perforanti', proprieta:['Accurata','Lancio (6/18)','Leggera'] },
    { nome:'Randello', cat:'semplice_mischia', danni:'1d4', tipo_danno:'contundenti', proprieta:['Leggera'] },
    { nome:'Randello Pesante', cat:'semplice_mischia', danni:'1d8', tipo_danno:'contundenti', proprieta:['Due Mani'] },
    { nome:'Arco Corto', cat:'semplice_distanza', danni:'1d6', tipo_danno:'perforanti', proprieta:['Due Mani','Munizioni (24/96)'] },
    { nome:'Balestra Leggera', cat:'semplice_distanza', danni:'1d8', tipo_danno:'perforanti', proprieta:['Due Mani','Munizioni (24/96)','Ricarica'] },
    { nome:'Dardo', cat:'semplice_distanza', danni:'1d4', tipo_danno:'perforanti', proprieta:['Accurata','Lancio (6/18)'] },
    { nome:'Fionda', cat:'semplice_distanza', danni:'1d4', tipo_danno:'contundenti', proprieta:['Munizioni (9/36)'] },
    { nome:'Alabarda', cat:'guerra_mischia', danni:'1d10', tipo_danno:'taglienti', proprieta:['Due Mani','Pesante','Portata'] },
    { nome:'Ascia Bipenne', cat:'guerra_mischia', danni:'1d12', tipo_danno:'taglienti', proprieta:['Due Mani','Pesante'] },
    { nome:'Ascia da Battaglia', cat:'guerra_mischia', danni:'1d8', tipo_danno:'taglienti', proprieta:['Versatile (1d10)'] },
    { nome:'Falcione', cat:'guerra_mischia', danni:'1d10', tipo_danno:'taglienti', proprieta:['Due Mani','Pesante','Portata'] },
    { nome:'Frusta', cat:'guerra_mischia', danni:'1d4', tipo_danno:'taglienti', proprieta:['Accurata','Portata'] },
    { nome:'Lancia da Cavaliere', cat:'guerra_mischia', danni:'1d12', tipo_danno:'perforanti', proprieta:['Portata','Speciale'] },
    { nome:'Maglio', cat:'guerra_mischia', danni:'2d6', tipo_danno:'contundenti', proprieta:['Due Mani','Pesante'] },
    { nome:'Martello da Guerra', cat:'guerra_mischia', danni:'1d8', tipo_danno:'contundenti', proprieta:['Versatile (1d10)'] },
    { nome:'Mazzafrusto', cat:'guerra_mischia', danni:'1d8', tipo_danno:'contundenti', proprieta:[] },
    { nome:'Morning Star', cat:'guerra_mischia', danni:'1d8', tipo_danno:'perforanti', proprieta:[] },
    { nome:'Picca', cat:'guerra_mischia', danni:'1d10', tipo_danno:'perforanti', proprieta:['Due Mani','Pesante','Portata'] },
    { nome:'Piccone da Guerra', cat:'guerra_mischia', danni:'1d8', tipo_danno:'perforanti', proprieta:[] },
    { nome:'Scimitarra', cat:'guerra_mischia', danni:'1d6', tipo_danno:'taglienti', proprieta:['Accurata','Leggera'] },
    { nome:'Spada Corta', cat:'guerra_mischia', danni:'1d6', tipo_danno:'perforanti', proprieta:['Accurata','Leggera'] },
    { nome:'Spada Lunga', cat:'guerra_mischia', danni:'1d8', tipo_danno:'taglienti', proprieta:['Versatile (1d10)'] },
    { nome:'Spadone', cat:'guerra_mischia', danni:'2d6', tipo_danno:'taglienti', proprieta:['Due Mani','Pesante'] },
    { nome:'Stocco', cat:'guerra_mischia', danni:'1d8', tipo_danno:'perforanti', proprieta:['Accurata'] },
    { nome:'Tridente', cat:'guerra_mischia', danni:'1d6', tipo_danno:'perforanti', proprieta:['Lancio (6/18)','Versatile (1d8)'] },
    { nome:'Arco Lungo', cat:'guerra_distanza', danni:'1d8', tipo_danno:'perforanti', proprieta:['Due Mani','Munizioni (45/180)','Pesante'] },
    { nome:'Balestra a Mano', cat:'guerra_distanza', danni:'1d6', tipo_danno:'perforanti', proprieta:['Leggera','Munizioni (9/36)','Ricarica'] },
    { nome:'Balestra Pesante', cat:'guerra_distanza', danni:'1d10', tipo_danno:'perforanti', proprieta:['Due Mani','Munizioni (30/120)','Pesante','Ricarica'] },
    { nome:'Cerbottana', cat:'guerra_distanza', danni:'1', tipo_danno:'perforanti', proprieta:['Munizioni (7.5/30)','Ricarica'] },
    { nome:'Rete', cat:'guerra_distanza', danni:'-', tipo_danno:'-', proprieta:['Lancio (1.5/4.5)','Speciale'] },
];

const DND_ARMATURE = [
    { nome:'Imbottita', cat:'leggera', ca_base:11, mod_des:true, max_des:99, forza:0, furtivita:'svantaggio' },
    { nome:'Cuoio', cat:'leggera', ca_base:11, mod_des:true, max_des:99, forza:0, furtivita:null },
    { nome:'Cuoio Borchiato', cat:'leggera', ca_base:12, mod_des:true, max_des:99, forza:0, furtivita:null },
    { nome:'Pelle', cat:'media', ca_base:12, mod_des:true, max_des:2, forza:0, furtivita:null },
    { nome:'Giaco di Maglia', cat:'media', ca_base:13, mod_des:true, max_des:2, forza:0, furtivita:null },
    { nome:'Corazza di Scaglie', cat:'media', ca_base:14, mod_des:true, max_des:2, forza:0, furtivita:'svantaggio' },
    { nome:'Corazza di Piastre', cat:'media', ca_base:14, mod_des:true, max_des:2, forza:0, furtivita:null },
    { nome:'Mezza Armatura', cat:'media', ca_base:15, mod_des:true, max_des:2, forza:0, furtivita:'svantaggio' },
    { nome:'Corazza ad Anelli', cat:'pesante', ca_base:14, mod_des:false, max_des:0, forza:0, furtivita:'svantaggio' },
    { nome:'Cotta di Maglia', cat:'pesante', ca_base:16, mod_des:false, max_des:0, forza:13, furtivita:'svantaggio' },
    { nome:'Corazza a Strisce', cat:'pesante', ca_base:17, mod_des:false, max_des:0, forza:15, furtivita:'svantaggio' },
    { nome:'Armatura Completa', cat:'pesante', ca_base:18, mod_des:false, max_des:0, forza:15, furtivita:'svantaggio' },
    { nome:'Scudo', cat:'scudo', ca_base:2, mod_des:false, max_des:0, forza:0, furtivita:null },
];

// Focus da incantatore: oggetti che servono come componente per lanciare
// incantesimi. Non hanno tiri per colpire ne' danni; possono essere
// magici (+1, +2, +3) come item rari.
const DND_FOCUS = [
    { nome: 'Bacchetta',                 cat: 'arcano' },
    { nome: 'Bastone',                   cat: 'arcano' },
    { nome: 'Cristallo',                 cat: 'arcano' },
    { nome: 'Sfera',                     cat: 'arcano' },
    { nome: 'Verga',                     cat: 'arcano' },
    { nome: 'Ramoscello di Vischio',     cat: 'druidico' },
    { nome: 'Totem',                     cat: 'druidico' },
    { nome: 'Bastone di Legno',          cat: 'druidico' },
    { nome: 'Bacchetta di Tasso',        cat: 'druidico' },
    { nome: 'Amuleto',                   cat: 'sacro' },
    { nome: 'Emblema',                   cat: 'sacro' },
    { nome: 'Reliquiario',               cat: 'sacro' },
    { nome: 'Borsa con Componenti',      cat: 'componenti' },
];

const DND_COMPETENZE_STRUMENTI_GROUPED = {
    'Arnesi e Strumenti': {
        items: [
            'Arnesi da Falsario','Arnesi da Scasso','Borsa da Erborista',
            'Sostanze da Avvelenatore','Trucchi per il Camuffamento','Strumenti da Navigatore',
            'Strumenti da Alchimista','Strumenti da Calligrafo','Strumenti da Calzolaio',
            'Strumenti da Cartografo','Strumenti da Conciatore','Strumenti da Costruttore',
            'Strumenti da Fabbro','Strumenti da Falegname','Strumenti da Gioielliere',
            'Strumenti da Intagliatore','Strumenti da Inventore','Strumenti da Pittore',
            'Strumenti da Soffiatore','Strumenti da Tessitore','Strumenti da Vasaio',
            'Utensili da Cuoco','Strumenti da Mescitore'
        ],
        allowMastery: true
    },
    'Strumenti Musicali': {
        items: ['Ciaramella','Cornamusa','Corno','Dulcimer','Flauto','Flauto di Pan','Lira','Liuto','Tamburo','Viola'],
        allowMastery: false
    },
    'Giochi': {
        items: ['Dadi','Mazzo di Carte','Scacchi dei Draghi','Tre Draghi al Buio'],
        allowMastery: false
    },
    'Veicoli': {
        items: ['Veicoli Terrestri','Veicoli Acquatici'],
        allowMastery: false
    }
};
const DND_COMPETENZE_STRUMENTI = Object.values(DND_COMPETENZE_STRUMENTI_GROUPED).flatMap(g => g.items);

// Talenti: dataset locale caricato da js/data/feats_data.js (window.FEATS_DATA).
// Sorgente: PDF aidedd.org parsato in risorse/talenti/parse_feats.py.
// Solo i NOMI ITALIANI sono puntatori salvati nel DB (pg.talenti = [string, ...]),
// l'app risolve descrizione/prerequisiti/fonte localmente.
function _featsData() { return window.FEATS_DATA || {}; }

// Lista talenti (compat: array di {nome, fonte}) generata dal dataset locale.
// Restituisce un array ordinato alfabeticamente per nome IT.
function _featsList() {
    const data = _featsData();
    const out = Object.values(data).map(f => ({
        nome: f.name,
        nome_en: f.name_en,
        fonte: f.source_short || f.source || '',
        prerequisites: f.prerequisites || '',
        description: f.description || ''
    }));
    out.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
    return out;
}

function _featInfo(nomeIt) {
    const data = _featsData();
    return data[nomeIt] || null;
}

// Elenco di tutti i `source_short` distinti presenti nel dataset talenti.
function _featAllSources() {
    const set = new Set();
    Object.values(_featsData()).forEach(f => {
        const s = f.source_short || f.source || '';
        if (s) set.add(s);
    });
    return Array.from(set).sort();
}

function _defaultFeatFilters() {
    return { prereq: 'any', sources: [] };
}

// Stato filtri/ricerca per ciascun "contesto" del picker (wizard, scheda).
window._featPickerFilters = window._featPickerFilters || {};
window._featPickerSearch = window._featPickerSearch || {};

function _featMatchesFilters(t, f) {
    if (!f) return true;
    if (f.prereq === 'yes' && !t.prerequisites) return false;
    if (f.prereq === 'no' && t.prerequisites) return false;
    if (f.sources && f.sources.length > 0 && !f.sources.includes(t.fonte)) return false;
    return true;
}

function _featMatchesSearch(t, q) {
    if (!q) return true;
    return (
        t.nome.toLowerCase().includes(q) ||
        (t.nome_en && t.nome_en.toLowerCase().includes(q)) ||
        (t.fonte || '').toLowerCase().includes(q)
    );
}

function _featPickerHeaderHtml(ctx) {
    const f = window._featPickerFilters[ctx] || _defaultFeatFilters();
    const q = window._featPickerSearch[ctx] || '';
    const allSources = _featAllSources();

    const chip = (label, active, onclick) =>
        `<button type="button" class="spell-filter-chip ${active ? 'active' : ''}" onclick="${onclick}">${escapeHtml(label)}</button>`;

    const prereqChips = [['any','Tutti'],['yes','Sì'],['no','No']]
        .map(([v, lab]) => chip(lab, f.prereq === v, `_featFilterSet('${ctx}','prereq','${v}')`)).join('');

    const sourceChips = allSources
        .map(s => chip(s, f.sources.includes(s), `_featFilterToggle('${ctx}','sources','${escapeHtml(s)}')`)).join('');

    const filtersPanel = `<div class="spell-filter-panel" id="featFilterPanel_${ctx}" style="display:none;">
        <div class="spell-filter-group">
            <div class="spell-filter-label">Prerequisiti</div>
            <div class="spell-filter-chips">${prereqChips}</div>
        </div>
        ${allSources.length > 0 ? `<div class="spell-filter-group">
            <div class="spell-filter-label">Manuale</div>
            <div class="spell-filter-chips">${sourceChips}</div>
        </div>` : ''}
        <div class="spell-filter-actions">
            <button type="button" class="btn-secondary btn-small" onclick="_featFilterReset('${ctx}')">Reimposta</button>
        </div>
    </div>`;

    return `
        <div class="spell-picker-search-row">
            <input type="text" id="featPickerSearch_${ctx}" class="hp-calc-input spell-picker-search"
                   placeholder="Cerca talento (IT/EN/fonte)..."
                   value="${escapeHtml(q)}" oninput="_featPickerOnSearch('${ctx}', this.value)">
            <button type="button" class="spell-picker-filter-btn" id="featPickerFilterBtn_${ctx}"
                    onclick="_featFilterTogglePanel('${ctx}')" title="Filtri" aria-label="Filtri">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span class="spell-picker-filter-badge" id="featFilterBadge_${ctx}" style="display:none;">0</span>
            </button>
        </div>
        ${filtersPanel}
    `;
}

function _featPickerActiveFilterCount(ctx) {
    const f = window._featPickerFilters[ctx];
    if (!f) return 0;
    let n = 0;
    if (f.prereq && f.prereq !== 'any') n += 1;
    n += (f.sources || []).length;
    return n;
}

window._featPickerOnSearch = function(ctx, value) {
    window._featPickerSearch[ctx] = value;
    _featPickerRefresh(ctx);
};

window._featFilterTogglePanel = function(ctx) {
    const panel = document.getElementById(`featFilterPanel_${ctx}`);
    const btn = document.getElementById(`featPickerFilterBtn_${ctx}`);
    if (!panel) return;
    const visible = panel.style.display !== 'none';
    panel.style.display = visible ? 'none' : '';
    if (btn) btn.classList.toggle('active', !visible);
};

window._featFilterToggle = function(ctx, field, value) {
    const f = window._featPickerFilters[ctx];
    if (!f || !Array.isArray(f[field])) return;
    const i = f[field].indexOf(value);
    if (i >= 0) f[field].splice(i, 1); else f[field].push(value);
    _featPickerRefresh(ctx, { keepPanelOpen: true });
};

window._featFilterSet = function(ctx, field, value) {
    const f = window._featPickerFilters[ctx];
    if (!f) return;
    f[field] = value;
    _featPickerRefresh(ctx, { keepPanelOpen: true });
};

window._featFilterReset = function(ctx) {
    window._featPickerFilters[ctx] = _defaultFeatFilters();
    _featPickerRefresh(ctx, { keepPanelOpen: true });
};

// Re-render del contesto richiamando il renderer dedicato di quel contesto.
function _featPickerRefresh(ctx, opts) {
    opts = opts || {};
    const panelOpen = (() => {
        const p = document.getElementById(`featFilterPanel_${ctx}`);
        return p ? p.style.display !== 'none' : false;
    })();

    if (ctx === 'wizard') {
        pgRenderTalenti();
    } else if (ctx === 'scheda') {
        _schedaTalentiRefreshModal();
    }

    if (opts.keepPanelOpen && panelOpen) {
        const p = document.getElementById(`featFilterPanel_${ctx}`);
        const b = document.getElementById(`featPickerFilterBtn_${ctx}`);
        if (p) p.style.display = '';
        if (b) b.classList.add('active');
    }
    // Re-focus sulla barra di ricerca dopo il re-render (mantiene il cursore in coda).
    const input = document.getElementById(`featPickerSearch_${ctx}`);
    if (input && document.activeElement !== input) {
        input.focus();
        const v = input.value;
        try { input.setSelectionRange(v.length, v.length); } catch (_) { /* ignore */ }
    }
    _featPickerUpdateBadge(ctx);
}

function _featPickerUpdateBadge(ctx) {
    const badge = document.getElementById(`featFilterBadge_${ctx}`);
    if (!badge) return;
    const n = _featPickerActiveFilterCount(ctx);
    if (n > 0) { badge.textContent = n; badge.style.display = ''; }
    else badge.style.display = 'none';
}

let pgCurrentTalenti = [];

function _featPickerItemHtml(t, opts) {
    const onClick = opts.onClick ? `onclick="${opts.onClick}"` : '';
    const removeBtn = opts.removeOnClick
        ? `<button type="button" class="pg-talento-remove" onclick="event.stopPropagation();${opts.removeOnClick}">✕</button>`
        : '';
    const infoBtn = `<button type="button" class="pg-talento-info" title="Dettagli" onclick="event.stopPropagation();_featTogglePickerDetail(this)">ⓘ</button>`;
    const cls = opts.selected ? 'pg-talento-item selected' : 'pg-talento-item';
    const prereqHtml = t.prerequisites
        ? `<div class="pg-talento-prereq"><strong>Prerequisito:</strong> ${escapeHtml(t.prerequisites)}</div>`
        : '';
    const descHtml = t.description
        ? `<div class="pg-talento-desc">${window.formatRichText(t.description)}</div>`
        : '';
    return `
        <div class="${cls}" ${onClick}>
            <div class="pg-talento-row">
                <span class="pg-talento-name">${escapeHtml(t.nome)}</span>
                <span class="option-source">(${escapeHtml(t.fonte || '')})</span>
                ${infoBtn}
                ${removeBtn}
            </div>
            <div class="pg-talento-detail" style="display:none;">
                ${prereqHtml}
                ${descHtml || '<div class="pg-talento-desc"><em>Nessuna descrizione disponibile.</em></div>'}
            </div>
        </div>
    `;
}

window._featTogglePickerDetail = function(btn) {
    const item = btn.closest('.pg-talento-item');
    if (!item) return;
    const detail = item.querySelector('.pg-talento-detail');
    if (!detail) return;
    detail.style.display = detail.style.display === 'none' ? '' : 'none';
};

function pgRenderTalenti() {
    const container = document.getElementById('pgTalentiList');
    if (!container) return;
    const ctx = 'wizard';
    if (!window._featPickerFilters[ctx]) window._featPickerFilters[ctx] = _defaultFeatFilters();
    const f = window._featPickerFilters[ctx];
    const q = (window._featPickerSearch[ctx] || '').trim().toLowerCase();

    const selectedHtml = pgCurrentTalenti.map((nome, i) => {
        const info = _featInfo(nome) || { name: nome, source_short: '?' };
        const t = {
            nome,
            fonte: info.source_short || '',
            prerequisites: info.prerequisites || '',
            description: info.description || ''
        };
        return _featPickerItemHtml(t, { selected: true, removeOnClick: `pgRemoveTalento(${i})` });
    }).join('');

    const available = _featsList()
        .filter(t => !pgCurrentTalenti.includes(t.nome))
        .filter(t => _featMatchesFilters(t, f))
        .filter(t => _featMatchesSearch(t, q));
    const listHtml = available.map(t =>
        _featPickerItemHtml(t, { onClick: `pgAddTalento('${escapeHtml(t.nome).replace(/'/g, "\\'")}')` })
    ).join('') || '<div class="scheda-empty" style="padding:12px;">Nessun talento corrisponde ai filtri.</div>';

    container.innerHTML = `
        ${_featPickerHeaderHtml(ctx)}
        ${selectedHtml ? `<div class="form-section-label">Selezionati</div><div class="pg-talenti-selected">${selectedHtml}</div>` : ''}
        <div class="form-section-label">Disponibili (${available.length})</div>
        <div class="pg-talenti-available">${listHtml}</div>
    `;
    _featPickerUpdateBadge(ctx);
}

window.pgAddTalento = function(nome) {
    if (!pgCurrentTalenti.includes(nome)) {
        pgCurrentTalenti.push(nome);
        pgRenderTalenti();
    }
};

window.pgRemoveTalento = function(index) {
    pgCurrentTalenti.splice(index, 1);
    pgRenderTalenti();
};

// =====================================================
// WIZARD STEP 6: EQUIPAGGIAMENTO
// =====================================================
function pgRenderEquipSelected() {
    const container = document.getElementById('pgEquipSelected');
    if (!container) return;
    if (pgSelectedEquipment.length === 0) {
        container.innerHTML = '<span class="scheda-empty">Nessun equipaggiamento selezionato</span>';
        return;
    }
    container.innerHTML = pgSelectedEquipment.map((e, i) => `
        <div class="pg-talento-item selected">
            <span class="pg-talento-name">${escapeHtml(e.nome)}${e.tipo === 'arma' ? ` <small>(${e.danni} ${e.tipo_danno})</small>` : e.ca_base ? ` <small>(CA ${e.ca_base})</small>` : ''}</span>
            <button type="button" class="pg-talento-remove" onclick="pgRemoveEquip(${i})">✕</button>
        </div>
    `).join('');
}

window.pgOpenEquipSelect = function(tipo) {
    let listHtml = '';
    if (tipo === 'arma') {
        const ARMA_CATS = {
            'semplice_mischia': 'Armi da Mischia Semplici',
            'semplice_distanza': 'Armi a Distanza Semplici',
            'guerra_mischia': 'Armi da Mischia da Guerra',
            'guerra_distanza': 'Armi a Distanza da Guerra'
        };
        listHtml = Object.entries(ARMA_CATS).map(([cat, label]) => {
            const items = DND_ARMI.filter(a => a.cat === cat).map(a =>
                `<div class="pg-talento-item" onclick="pgSelectEquipArma('${escapeHtml(a.nome)}')">
                    <span class="pg-talento-name">${escapeHtml(a.nome)}</span>
                    <span class="option-source">${a.danni} ${a.tipo_danno}</span>
                </div>`
            ).join('');
            return `<div class="form-section-label">${label}</div>${items}`;
        }).join('');
    } else {
        listHtml = ['leggera','media','pesante','scudo'].map(cat => {
            const label = cat === 'scudo' ? 'Scudi' : `Armature ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
            const items = DND_ARMATURE.filter(a => a.cat === cat).map(a =>
                `<div class="pg-talento-item" onclick="pgSelectEquipArmatura('${escapeHtml(a.nome)}')">
                    <span class="pg-talento-name">${escapeHtml(a.nome)}</span>
                    <span class="option-source">CA ${a.ca_base}</span>
                </div>`
            ).join('');
            return `<div class="form-section-label">${label}</div>${items}`;
        }).join('');
    }
    const modalHtml = `
    <div class="modal active" id="pgEquipSelectModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="document.getElementById('pgEquipSelectModal')?.remove();document.body.style.overflow='hidden'">&times;</button>
            <h2>${tipo === 'arma' ? 'Scegli Arma' : 'Scegli Armatura'}</h2>
            <div class="wizard-page-scroll">${listHtml}</div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="document.getElementById('pgEquipSelectModal')?.remove();document.body.style.overflow='hidden'">Chiudi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.pgSelectEquipArma = function(nome) {
    const arma = DND_ARMI.find(a => a.nome === nome);
    if (!arma) return;
    pgSelectedEquipment.push({
        nome: arma.nome, tipo: 'arma', danni: arma.danni, tipo_danno: arma.tipo_danno,
        proprieta: arma.proprieta, bonus_colpire: 0, bonus_danno: 0
    });
    document.getElementById('pgEquipSelectModal')?.remove();
    pgRenderEquipSelected();
}

window.pgSelectEquipArmatura = function(nome) {
    const arm = DND_ARMATURE.find(a => a.nome === nome);
    if (!arm) return;
    pgSelectedEquipment.push({
        nome: arm.nome, tipo: arm.cat === 'scudo' ? 'scudo' : 'armatura',
        ca_base: arm.ca_base, categoria: arm.cat, mod_des: arm.mod_des, max_des: arm.max_des
    });
    document.getElementById('pgEquipSelectModal')?.remove();
    pgRenderEquipSelected();
}

window.pgRemoveEquip = function(index) {
    pgSelectedEquipment.splice(index, 1);
    pgRenderEquipSelected();
}

function calcMod(score) {
    return Math.floor((score - 10) / 2);
}

function calcBonusCompetenza(livello) {
    return Math.floor((livello - 1) / 4) + 2;
}

function updateBonusCompetenza() {
    const livello = pgGetTotalLevel();
    const bonus = calcBonusCompetenza(livello);
    const field = document.getElementById('pgBonusCompetenza');
    if (field) field.value = `+${bonus}`;
}

function pgGetTotalLevel() {
    return pgSelectedClasses.reduce((sum, c) => sum + (c.livello || 1), 0) || 1;
}

function pgUpdateTotalLevel() {
    const total = pgGetTotalLevel();
    const lvField = document.getElementById('pgLivello');
    if (lvField) lvField.value = total;
    updateBonusCompetenza();
}

function formatModPlain(mod) {
    if (mod >= 0) return `+${mod}`;
    return `${mod}`;
}

function updateAbilityMod(input, modEl) {
    const val = parseInt(input.value) || 10;
    const mod = calcMod(val);
    modEl.textContent = formatModPlain(mod);
    modEl.className = 'pg-ability-mod ' + (mod > 0 ? 'positive' : mod < 0 ? 'negative' : 'zero');
    updateAllSaveValues();
}

function updateAllAbilityMods() {
    ['Forza', 'Destrezza', 'Costituzione', 'Intelligenza', 'Saggezza', 'Carisma'].forEach(name => {
        const input = document.getElementById(`pg${name}`);
        const modEl = document.getElementById(`mod${name}`);
        if (input && modEl) updateAbilityMod(input, modEl);
    });
    updateAllSaveValues();
}

function updateAllSaveValues() {
    const bonus = calcBonusCompetenza(pgGetTotalLevel());
    ['Forza', 'Destrezza', 'Costituzione', 'Intelligenza', 'Saggezza', 'Carisma'].forEach(name => {
        const input = document.getElementById(`pg${name}`);
        const cb = document.getElementById(`save${name}`);
        const valEl = document.getElementById(`saveVal${name}`);
        if (!input || !valEl) return;
        const mod = calcMod(parseInt(input.value) || 10);
        const isProf = cb && cb.checked;
        const total = mod + (isProf ? bonus : 0);
        valEl.textContent = formatModPlain(total);
    });
}

// --- Race/Background selects ---

// Mappa nome IT abilita' -> chiave usata in DND_SKILLS
function _normSkillKey(n) {
    if (!n) return '';
    return String(n).toLowerCase()
        .replace(/[àá]/g, 'a').replace(/[èé]/g, 'e').replace(/[ìí]/g, 'i')
        .replace(/[òó]/g, 'o').replace(/[ùú]/g, 'u')
        .replace(/'/g, '').replace(/\s+/g, '_');
}

// Restituisce la lista delle razze locali (window.RACES_DATA) ordinata
// alfabeticamente, con divider per fonte.
function buildRaceOptionsLocal() {
    const RD = window.RACES_DATA || {};
    const names = Object.keys(RD);
    if (names.length === 0) {
        // Fallback al vecchio elenco hardcoded (no auto-populate)
        return DND_RACES_GROUPED.map(r => typeof r === 'object' ? r : { value: r, label: r });
    }
    // Lista flat in ordine alfabetico italiano. La fonte rimane come metadato
    // sull'option per il filtro/badge.
    return names
        .slice()
        .sort((a, b) => a.localeCompare(b, 'it'))
        .map(name => {
            const r = RD[name];
            return { value: name, label: name, source: r.source_short || '' };
        });
}

function buildSubraceOptionsLocal(raceName) {
    const RD = window.RACES_DATA || {};
    const race = RD[raceName];
    if (!race || !Array.isArray(race.subraces) || race.subraces.length === 0) return [];
    const opts = race.subraces
        .slice()
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'))
        .map(sr => ({
            value: sr.name,
            label: sr.name,
            source: sr.source_short || race.source_short || ''
        }));
    return opts;
}

function buildBackgroundOptionsFromDB() {
    const bgs = AppState.cachedBackground;
    if (!bgs || bgs.length === 0) {
        return DND_BACKGROUNDS.map(b => ({ value: b, label: b }));
    }
    return bgs.map(b => ({ value: b.nome, label: b.nome, source: b.fonte || '' }));
}

// Lista dei background dal dataset locale (window.BACKGROUNDS_DATA),
// in ordine alfabetico italiano. Fallback al cache DB / hardcoded.
function buildBackgroundOptionsLocal() {
    const BG = window.BACKGROUNDS_DATA || {};
    const names = Object.keys(BG);
    if (names.length === 0) return buildBackgroundOptionsFromDB();
    return names
        .slice()
        .sort((a, b) => a.localeCompare(b, 'it'))
        .map(name => {
            const b = BG[name];
            return { value: name, label: name, source: b.source_short || '' };
        });
}

function getBackgroundLocal(nome) {
    const BG = window.BACKGROUNDS_DATA || {};
    return BG[nome] || null;
}

// Lookup razza nel dataset locale. Restituisce la struttura completa
// (vedere risorse/razze/build_races.py per lo schema).
function getRaceLocal(nome) {
    const RD = window.RACES_DATA || {};
    return RD[nome] || null;
}

function getSubraceLocal(raceName, subraceName) {
    const r = getRaceLocal(raceName);
    if (!r || !subraceName) return null;
    return (r.subraces || []).find(s => s.name === subraceName) || null;
}

// Ritorna un oggetto normalizzato con i campi che il wizard si aspetta
// (velocita, resistenze, competenze_abilita, linguaggi, ...) combinando
// razza + sottorazza. Mantiene il formato compatibile con cachedRazze.
function buildMergedRaceData(raceName, subraceName) {
    const race = getRaceLocal(raceName);
    if (!race) return null;
    const sub = subraceName ? getSubraceLocal(raceName, subraceName) : null;
    const allTraits = [
        ...(race.traits || []),
        ...((sub && sub.traits) || []),
    ];
    const merged = {
        nome: race.name || raceName,
        sottorazza: sub ? sub.name : null,
        fonte: race.source_short || '',
        velocita: race.speed || 9,
        resistenze: [...(race.resistances || []), ...((sub && sub.resistances) || [])],
        competenze_abilita: [
            ...((race.skill_proficiencies || []).map(_normSkillKey)),
            ...((sub && (sub.skill_proficiencies || []).map(_normSkillKey)) || []),
        ],
        linguaggi: [...(race.languages || []), ...((sub && sub.languages) || [])],
        darkvision: (sub && sub.darkvision != null) ? sub.darkvision : (race.darkvision || 0),
        creature_type: (sub && sub.creature_type) || race.creature_type || 'Umanoide',
        asi_text: race.asi_text || '',
        subrace_asi_text: sub ? (sub.asi_text || '') : null,
        traits: allTraits,
        innate_spells: allTraits.flatMap(t => t.innate_spells || []),
        race_resources: allTraits.filter(t => t.uses).map(t => ({
            name: t.name,
            uses: t.uses,
        })),
        size: race.size,
    };
    return merged;
}

// Compat: getRaceData consultato dal codice esistente. Prima tenta dataset
// locale (window.RACES_DATA), poi fallback al cache DB.
function getRaceData(nome) {
    if (!nome) return null;
    const local = buildMergedRaceData(nome, null);
    if (local) return local;
    if (AppState.cachedRazze) {
    return AppState.cachedRazze.find(r => r.nome === nome) || null;
    }
    return null;
}

// Tratti di razza+sottorazza per un PG salvato (oggetto pg dal DB).
function _pgRaceMergedTraits(pg) {
    if (!pg || !pg.razza) return [];
    const merged = buildMergedRaceData(pg.razza, pg.sottorazza || null);
    return merged ? (merged.traits || []) : [];
}

// Risorse derivate dai tratti razziali con `uses`. Persistite in
// pg.risorse_classe._race[key] = current.
// Chiave: name_en o name slugificato.
function _pgRaceResourceKey(trait) {
    const base = trait.name_en || trait.name || '';
    return base.replace(/[^A-Za-z0-9]+/g, '_');
}

function _pgRaceResources(pg) {
    const traits = _pgRaceMergedTraits(pg);
    const lvl = pg.livello || 1;
    const profBonus = calcBonusCompetenza(lvl);
    const stored = (pg.risorse_classe && pg.risorse_classe._race) || {};
    const out = [];
    traits.forEach(t => {
        if (!t.uses) return;
        let max = t.uses.amount;
        if (max === 'prof_bonus') max = profBonus;
        max = parseInt(max) || 1;
        if (max <= 0) return;
        const key = _pgRaceResourceKey(t);
        const current = stored[key] != null ? Math.min(max, Math.max(0, stored[key])) : max;
        let rechargeLabel = '';
        if (t.uses.recharge === 'long_rest') rechargeLabel = 'r. lungo';
        else if (t.uses.recharge === 'short_rest') rechargeLabel = 'r. breve';
        else if (t.uses.recharge === 'dawn') rechargeLabel = "all'alba";
        out.push({ key, name: t.name, max, current, recharge: rechargeLabel });
    });
    return out;
}

// Incantesimi innati razziali disponibili al livello PG.
function _pgRaceInnateSpells(pg) {
    const traits = _pgRaceMergedTraits(pg);
    const lvl = pg.livello || 1;
    const out = [];
    traits.forEach(t => {
        (t.innate_spells || []).forEach(sp => {
            const minLvl = sp.min_pg_level || 1;
            if (lvl >= minLvl) out.push({ ...sp, trait: t.name });
        });
    });
    return out;
}

// Chiave stabile per tracciare gli usi di un incantesimo innato a slot.
// Basata su nome inglese (canonico) + ricarica, evitando collisioni quando
// piu' tratti danno lo stesso spell con ricariche diverse.
function _pgInnateSpellKey(sp) {
    const base = sp.name_en || sp.name || '';
    const rec = sp.recharge || 'long_rest';
    return (base + '_' + rec).replace(/[^A-Za-z0-9]+/g, '_');
}

// Risorse "Slot magia innata": una per ogni incantesimo innato non a volonta'
// e non trucchetto. Persistite in pg.risorse_classe._innate[key] = current.
function _pgRaceInnateSlots(pg) {
    const list = _pgRaceInnateSpells(pg);
    const stored = (pg.risorse_classe && pg.risorse_classe._innate) || {};
    const out = [];
    list.forEach(sp => {
        if (sp.recharge === 'at_will') return;
        if ((sp.level || 0) === 0) return;
        const key = _pgInnateSpellKey(sp);
        const max = 1;
        const current = stored[key] != null ? Math.min(max, Math.max(0, stored[key])) : max;
        let rechargeLabel = '';
        if (sp.recharge === 'long_rest') rechargeLabel = 'r. lungo';
        else if (sp.recharge === 'short_rest') rechargeLabel = 'r. breve';
        else if (sp.recharge === 'dawn') rechargeLabel = "all'alba";
        out.push({
            key,
            name: sp.name,
            name_en: sp.name_en,
            level: sp.level,
            level_cast: sp.level_cast || sp.level,
            ability: sp.ability,
            trait: sp.trait,
            recharge: rechargeLabel,
            max,
            current,
        });
    });
    return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Incantesimi auto-garantiti da sottoclasse (Chierico Domini, Paladino
// Giuramenti, Warlock Patroni con Lista Espansa, Stregone Aberrant Mind /
// Clockwork Soul, Druido Cerchi, Ranger Conclavi, Artefice specialisti...).
// I dati vivono in window.SUBCLASS_SPELLS_DATA e sono generati da
// risorse/classi/build_subclass_spells.py.
//
// Schema (vedi script):
//   { class_slug: { subclass_slug: { pgLvlMin: ["Nome IT", ...] } } }
//
// Il PG ottiene una voce quando livello_classe >= pgLvlMin. La funzione
// restituisce { name, source, source_label, sub_label } per ogni
// incantesimo, deduplicando se lo stesso spell appare in piu' classi.
// ─────────────────────────────────────────────────────────────────────────
function _pgSubclassGrantedSpells(pg) {
    const data = window.SUBCLASS_SPELLS_DATA || {};
    if (!pg || !Array.isArray(pg.classi)) return [];
    const seen = new Set();
    const out = [];
    const hbCache = (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewSottoclassi))
        ? AppState.cachedHomebrewSottoclassi : [];
    pg.classi.forEach(c => {
        if (!c || !c.nome) return;
        const cls = _getClassData(c.nome);
        if (!cls) return;
        const subSlug = c.sottoclasseSlug || '';
        if (!subSlug) return;
        const lvl = parseInt(c.livello) || 1;

        // ── Caso HOMEBREW: lo slug e' 'hb:<id>' ──
        if (c.sottoclasse_homebrew_id || subSlug.startsWith('hb:')) {
            const hbId = c.sottoclasse_homebrew_id || subSlug.replace(/^hb:/, '');
            const hb = hbCache.find(r => String(r.id) === String(hbId));
            if (!hb) return;
            const subLabel = hb.nome || c.sottoclasse || 'Sottoclasse Homebrew';
            // 1. granted_spells a livello sottoclasse: [{ level, spells:[...] }]
            (Array.isArray(hb.granted_spells) ? hb.granted_spells : []).forEach(g => {
                if ((parseInt(g.level) || 99) > lvl) return;
                (g.spells || []).forEach(name => {
                    const key = (name || '').toLowerCase();
                    if (!key || seen.has(key)) return;
                    seen.add(key);
                    out.push({
                        name,
                        source: cls.slug + ':hb:' + hbId,
                        source_label: subLabel,
                    });
                });
            });
            // 2. spells per singolo privilegio (feature.grants_spells)
            (Array.isArray(hb.sottoclasse_features) ? hb.sottoclasse_features : []).forEach(f => {
                if ((parseInt(f.level) || 99) > lvl) return;
                if (!Array.isArray(f.grants_spells) || f.grants_spells.length === 0) return;
                f.grants_spells.forEach(name => {
                    const key = (name || '').toLowerCase();
                    if (!key || seen.has(key)) return;
                    seen.add(key);
                    out.push({
                        name,
                        source: cls.slug + ':hb:' + hbId + ':' + (f.nome || 'priv'),
                        source_label: subLabel + (f.nome ? ' • ' + f.nome : ''),
                    });
                });
            });
            return;
        }

        // ── Caso NATIVO ──
        const subData = (data[cls.slug] || {})[subSlug];
        if (!subData) return;
        // Etichetta: "Dominio della Vita", "Giuramento di Devozione",
        // "Patrono del Demonio", ecc. — usa il nome IT della sottoclasse
        // se disponibile, altrimenti il name_en.
        const sub = (cls.subclasses || []).find(x => x.slug === subSlug);
        const subLabel = sub ? (sub.name || sub.name_en || c.sottoclasse) : (c.sottoclasse || subSlug);
        Object.entries(subData).forEach(([reqLvlStr, spellNames]) => {
            const reqLvl = parseInt(reqLvlStr);
            if (lvl < reqLvl) return;
            (spellNames || []).forEach(name => {
                const key = (name || '').toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                out.push({
                    name,
                    source: cls.slug + ':' + subSlug,
                    source_label: subLabel,
                });
            });
        });
    });
    return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Auto-effetti dei privilegi di sottoclasse (resistenze, immunita',
// ecc.) che dovrebbero essere applicati automaticamente al PG quando
// raggiunge il livello richiesto.
//
// Mappa: classe slug -> sottoclasse slug -> array di
//   { level, resistances?: [...], immunities?: [...] }
const SUBCLASS_AUTO_EFFECTS = {
    sorcerer: {
        'aberrant-mind': [
            { level: 6, resistances: ['psichico'] },  // Difese Psichiche
        ],
        'storm-sorcery': [
            { level: 6, resistances: ['fulmine', 'tuono'] },  // Heart of the Storm
        ],
        'divine-soul': [],
    },
    barbarian: {
        'path-of-the-totem-warrior': [
            { level: 3, resistances: [] }, // Spirit Seeker - resistance only while raging (gestito separatamente)
        ],
    },
    monk: {
        'way-of-the-sun-soul': [],
    },
    paladin: {
        'oath-of-the-ancients': [
            { level: 7, resistances: [] }, // Aura of Warding - aura, gestita separatamente
        ],
    },
};

// Restituisce i tipi di danno a cui il PG ottiene resistenza
// automaticamente in base ai privilegi delle sue sottoclassi e al
// livello attuale.
function _pgSubclassAutoResistances(pg) {
    const out = new Set();
    if (!pg || !Array.isArray(pg.classi)) return [];
    pg.classi.forEach(c => {
        const cls = _getClassData(c?.nome || '');
        if (!cls) return;
        const subSlug = c.sottoclasseSlug;
        if (!subSlug) return;
        const map = SUBCLASS_AUTO_EFFECTS[cls.slug];
        if (!map) return;
        const entries = map[subSlug];
        if (!entries) return;
        const lvl = parseInt(c.livello) || 0;
        entries.forEach(e => {
            if (lvl >= (e.level || 0)) {
                (e.resistances || []).forEach(r => out.add(r));
            }
        });
    });
    return Array.from(out);
}

// Inietta in pg.resistenze (e analogamente immunita') eventuali
// resistenze auto-derivate da privilegi di sottoclasse mancanti.
// Idempotente: aggiunge solo cio' che manca.
function _ensureSubclassAutoEffectsApplied(pg) {
    if (!pg) return false;
    const auto = _pgSubclassAutoResistances(pg);
    if (auto.length === 0) return false;
    if (!Array.isArray(pg.resistenze)) pg.resistenze = [];
    let changed = false;
    auto.forEach(r => {
        if (!pg.resistenze.includes(r)) {
            pg.resistenze.push(r);
            changed = true;
        }
    });
    return changed;
}

// ─────────────────────────────────────────────────────────────────────────
// Invocazioni Occulte (Eldritch Invocations) del Warlock.
// Dataset in window.INVOCATIONS_DATA generato da
// risorse/invocazioni/build_invocations.py.
//
// Per ogni invocazione:
//   id, name, name_en, source, source_short, prerequisites (lista),
//   description, effect, effect_data
//
// pg.invocazioni: array di id (stringhe slug, es. "agonizing-blast").
// ─────────────────────────────────────────────────────────────────────────
function _invocationsAll() { return window.INVOCATIONS_DATA || []; }

function _invocationById(id) {
    if (!id) return null;
    return _invocationsAll().find(i => i.id === id) || null;
}

// ─── Stili di Combattimento (Fighting Styles) ───────────────────────────
function _fightingStylesData() { return window.FIGHTING_STYLES_DATA || {}; }
function _fightingStyleById(slug) {
    if (!slug) return null;
    return _fightingStylesData()[slug] || null;
}
// Restrizioni di stili di combattimento per sottoclasse: alcune sottoclassi
// (es. Bardo del Collegio delle Spade) consentono di scegliere uno stile da
// una lista limitata. La chiave e' lo slug della sottoclasse; il valore
// definisce sotto quale "etichetta classe" salvare la scelta, da quale
// livello e quanti stili, oltre all'elenco di slug disponibili.
const FIGHTING_STYLES_SUBCLASS_RULES = {
    'college-of-swords': {
        className: 'Bardo (Collegio delle Spade)',
        from_level: 3,
        count: 1,
        allowedSlugs: ['dueling', 'two-weapon-fighting'],
    },
    'sword-bard': {
        className: 'Bardo (Collegio delle Spade)',
        from_level: 3,
        count: 1,
        allowedSlugs: ['dueling', 'two-weapon-fighting'],
    },
};

// Chiave della "slot custom" sempre presente: permette a qualsiasi PG di
// scegliere stili anche se la sua classe non glielo concederebbe, e di
// aumentare liberamente quanti stili possiede.
const FS_CUSTOM_SLOT_KEY = 'Personalizzato';

// Quanti stili di combattimento puo' selezionare il PG per ciascuna delle
// sue classi/sottoclassi. Restituisce un oggetto:
//   { 'Guerriero': { max: 1, baseMax: 1, allowedSlugs: null, baseClass: 'Guerriero' }, ... }
// allowedSlugs === null significa "tutti gli stili della classe base".
// La slot 'Personalizzato' e' sempre presente: di default permette 0 stili,
// ma se il PG non ha alcuna allowance concessa dalle classi parte da 1,
// e il giocatore puo' modificare il massimo a piacere via override.
function _pgFightingStylesAllowance(pg) {
    const out = {};
    if (!pg) return out;
    const overrides = (pg.stile_combattimento && typeof pg.stile_combattimento === 'object'
        && pg.stile_combattimento._maxOverrides && typeof pg.stile_combattimento._maxOverrides === 'object')
        ? pg.stile_combattimento._maxOverrides : {};
    const applyOverride = (key, baseMax) => {
        const ov = Number.isFinite(overrides[key]) ? overrides[key] : 0;
        return Math.max(0, baseMax + ov);
    };
    if (Array.isArray(pg.classi)) {
        pg.classi.forEach(c => {
            const lvl = parseInt(c.livello) || 0;
            const subSlug = c.sottoclasseSlug || '';
            if (c.nome === 'Guerriero') {
                let n = lvl >= 1 ? 1 : 0;
                if (lvl >= 10 && subSlug === 'champion') n += 1;
                if (n > 0) out[c.nome] = { baseMax: n, max: applyOverride(c.nome, n), allowedSlugs: null, baseClass: 'Guerriero' };
            } else if (c.nome === 'Paladino') {
                if (lvl >= 2) out[c.nome] = { baseMax: 1, max: applyOverride(c.nome, 1), allowedSlugs: null, baseClass: 'Paladino' };
            } else if (c.nome === 'Ranger') {
                if (lvl >= 2) out[c.nome] = { baseMax: 1, max: applyOverride(c.nome, 1), allowedSlugs: null, baseClass: 'Ranger' };
            }
            // Sottoclassi che concedono stili limitati.
            const rule = FIGHTING_STYLES_SUBCLASS_RULES[subSlug];
            if (rule && lvl >= (rule.from_level || 1)) {
                const cnt = rule.count || 1;
                out[rule.className] = {
                    baseMax: cnt,
                    max: applyOverride(rule.className, cnt),
                    allowedSlugs: rule.allowedSlugs ? [...rule.allowedSlugs] : null,
                    baseClass: c.nome,
                };
            }
        });
    }
    // Slot 'Personalizzato' sempre presente: garantisce che qualsiasi PG
    // possa scegliere uno stile e che l'utente possa estendere il numero.
    const hasClassAllowance = Object.keys(out).length > 0;
    const customBase = hasClassAllowance ? 0 : 1;
    out[FS_CUSTOM_SLOT_KEY] = {
        baseMax: customBase,
        max: applyOverride(FS_CUSTOM_SLOT_KEY, customBase),
        allowedSlugs: null,
        baseClass: null, // null = qualsiasi stile da qualsiasi classe.
        custom: true,
    };
    return out;
}
// Slug degli stili disponibili per una classe specifica (filtrabili poi da
// allowedSlugs della sottoclasse).
function _fightingStylesForClass(className) {
    const data = _fightingStylesData();
    return Object.values(data)
        .filter(fs => Array.isArray(fs.classes) && fs.classes.includes(className))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}
// Stili effettivamente selezionabili per una "voce di allowance" del PG.
// Regole:
//   - Se l'allowance ha allowedSlugs (lista esplicita), si usa SEMPRE quella
//     lista (lookup diretto sui dati globali). Questo evita il problema in
//     cui la classe base non e' tra le classes degli stili (es. Bardo
//     Collegio delle Spade: i suoi stili "Duellare" e "Combattere con due
//     armi" non hanno 'Bardo' tra le loro classes).
//   - Se baseClass e' null (slot Personalizzato) si elencano TUTTI gli stili.
//   - Altrimenti si filtra per la classe base.
function _fightingStylesForSlot(slotKey, allowanceEntry) {
    const data = _fightingStylesData();
    if (allowanceEntry && Array.isArray(allowanceEntry.allowedSlugs)) {
        const allowed = new Set(allowanceEntry.allowedSlugs);
        return Object.values(data)
            .filter(fs => allowed.has(fs.slug))
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    if (!allowanceEntry || allowanceEntry.baseClass == null) {
        return Object.values(data)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return _fightingStylesForClass(allowanceEntry.baseClass);
}

// Numero massimo di invocazioni che un Warlock conosce in base al livello,
// come da PHB pag. 110 (tabella Warlock).
function _pgWarlockLevel(pg) {
    if (!pg || !Array.isArray(pg.classi)) return 0;
    const w = pg.classi.find(c => {
        const cls = _getClassData(c?.nome || '');
        return cls && cls.slug === 'warlock';
    });
    return w ? (parseInt(w.livello) || 0) : 0;
}

function _maxInvocationsForLevel(lvl) {
    if (lvl < 2) return 0;
    if (lvl < 5) return 2;
    if (lvl < 7) return 3;
    if (lvl < 9) return 4;
    if (lvl < 12) return 5;
    if (lvl < 15) return 6;
    if (lvl < 18) return 7;
    return 8;
}

function _pgMaxInvocations(pg) {
    return _maxInvocationsForLevel(_pgWarlockLevel(pg));
}

// Verifica se il PG soddisfa i prerequisiti dell'invocazione. Usato per
// abilitare/disabilitare voci nel picker.
function _pgMeetsInvocationPrereqs(pg, inv, opts = {}) {
    if (!inv || !Array.isArray(inv.prerequisites)) return true;
    const wlvl = _pgWarlockLevel(pg);
    const subSlug = (() => {
        const w = (pg.classi || []).find(c => {
            const cls = _getClassData(c?.nome || '');
            return cls && cls.slug === 'warlock';
        });
        return w ? (w.sottoclasseSlug || '') : '';
    })();
    const subName = (() => {
        const cls = _getClassData('Warlock');
        if (!cls) return '';
        const sc = (cls.subclasses || []).find(s => s.slug === subSlug);
        return sc ? (sc.name_en || sc.name || '') : '';
    })().toLowerCase();
    // Pact non e' modellato direttamente nel PG (e' un privilegio scelto a
    // livello 3). Per ora consideriamo i pact prereq come "informativi"
    // (non bloccano la selezione, ma restituiamo un warning testuale).
    for (const pr of inv.prerequisites) {
        if (pr.type === 'level') {
            if (wlvl < (pr.value || 0)) return false;
        } else if (pr.type === 'patron') {
            const want = (pr.value || '').toLowerCase();
            if (!subName.includes(want)) return false;
        }
        // Per spell/feature/feature_or_curse non blocchiamo (sono difficili
        // da validare a runtime senza modellare i pact); se opts.strict,
        // applichiamo comunque la validazione testuale piu' avanti.
    }
    return true;
}

// Etichetta leggibile dei prerequisiti (per il picker).
function _formatInvocationPrereqs(inv) {
    if (!inv.prerequisites || inv.prerequisites.length === 0) return '';
    return inv.prerequisites.map(pr => {
        if (pr.type === 'level') return `${pr.value}° livello`;
        if (pr.type === 'spell') {
            const it = pr.value_it || pr.value;
            return `trucchetto ${it}`;
        }
        if (pr.type === 'feature') return pr.value;
        if (pr.type === 'patron') return `patrono ${pr.value}`;
        if (pr.type === 'feature_or_curse') return 'incantesimo maledizione o privilegio da warlock che maledice';
        return pr.value || '';
    }).join(', ');
}

// Lista degli "spell at will" e "spell per long rest" garantiti dalle
// invocazioni selezionate (analogo razziale: appariranno nella pagina
// incantesimi del PG con tag invocazione).
function _pgInvocationGrantedSpells(pg) {
    const ids = (pg && pg.invocazioni) || [];
    const out = [];
    ids.forEach(id => {
        const inv = _invocationById(id);
        if (!inv) return;
        const d = inv.effect_data || {};
        if (!d.spell_en || !d.spell_it) return;
        const eff = inv.effect;
        if (eff !== 'spell_at_will' && eff !== 'spell_per_long_rest') return;
        out.push({
            name: d.spell_it,
            name_en: d.spell_en,
            level_cast: d.level_cast || 1,
            recharge: eff === 'spell_at_will' ? 'at_will' : 'long_rest',
            invocation_id: id,
            invocation_name: inv.name,
        });
    });
    return out;
}

// Risorse limitate derivate dalle invocazioni: include sia gli spell
// "1/lungo" sia le invocazioni con uso limitato (es. cloak-of-flies,
// gift-of-the-protectors, bond-of-the-talisman). Restituisce una lista di
// "slot" tracciabili nella pagina incantesimi (Slot invocazioni) e nella
// pagina 1 (Risorse).
function _pgInvocationSlots(pg) {
    const stored = (pg && pg.risorse_classe && pg.risorse_classe._invocations) || {};
    const ids = (pg && pg.invocazioni) || [];
    const pb = (typeof getProficiencyBonus === 'function') ? (getProficiencyBonus(pg) || 2) : 2;
    const out = [];

    ids.forEach(id => {
        const inv = _invocationById(id);
        if (!inv) return;
        const d = inv.effect_data || {};
        const eff = inv.effect;

        let recharge = null;
        let displayRecharge = '';
        let max = 1;
        let isSpell = false;
        let displayName = inv.name;
        let displayLevel = '';
        let key = id.replace(/[^A-Za-z0-9]+/g, '_');

        if (eff === 'spell_per_long_rest') {
            recharge = 'long_rest';
            displayRecharge = 'r. lungo';
            isSpell = true;
            displayName = d.spell_it || d.spell_en || inv.name;
            displayLevel = `Lv ${d.level_cast || 1}`;
            max = 1;
            key = (d.spell_en || id).replace(/[^A-Za-z0-9]+/g, '_');
        } else if (d.recharge === 'long_rest' || d.recharge === 'short_rest') {
            recharge = d.recharge;
            displayRecharge = d.recharge === 'short_rest' ? 'r. breve/lungo' : 'r. lungo';
            const usesSpec = d.uses;
            if (usesSpec === 'prof_bonus') max = pb;
            else if (typeof usesSpec === 'number') max = usesSpec;
            else max = 1;
        } else {
            return;
        }

        const current = stored[key] != null ? Math.min(max, Math.max(0, stored[key])) : max;
        out.push({
            key,
            name: displayName,
            name_en: isSpell ? d.spell_en : null,
            level_cast: isSpell ? (d.level_cast || 1) : null,
            level_label: displayLevel,
            invocation_name: inv.name,
            invocation_id: id,
            is_spell: isSpell,
            recharge: displayRecharge,
            max,
            current,
        });
    });

    return out;
}

// Skill auto-conferite dalle invocazioni (es. Beguiling Influence).
function _pgInvocationGrantedSkills(pg) {
    const ids = (pg && pg.invocazioni) || [];
    const out = new Set();
    ids.forEach(id => {
        const inv = _invocationById(id);
        if (!inv || inv.effect !== 'skill_proficiency') return;
        const skills = (inv.effect_data || {}).skills || [];
        skills.forEach(s => out.add(s));
    });
    return Array.from(out);
}

function getBackgroundData(nome) {
    if (!nome) return null;
    // Prima il dataset locale (window.BACKGROUNDS_DATA): mappa lo schema
    // hardcoded (build_backgrounds.py) ai campi attesi dal codice esistente
    // (nome, fonte, competenze_abilita, competenze_strumenti, ...).
    const local = getBackgroundLocal(nome);
    if (local) {
        return {
            nome: local.name,
            fonte: local.source_short || '',
            competenze_abilita: local.skill_proficiencies || [],
            competenze_strumenti: local.tool_proficiencies || [],
            linguaggi_specifici: local.languages_specific || [],
            linguaggi_a_scelta: local.languages_choice || 0,
            scelte_abilita_testo: local.skill_choices_text || '',
            scelte_strumenti_testo: local.tool_choices_text || '',
            linguaggi_testo: local.languages_text || '',
            equipaggiamento_iniziale: local.starting_equipment || [],
            oro_iniziale: local.starting_gold || 0,
            privilegio_nome: (local.feature && local.feature.name) || '',
            privilegio_descrizione: (local.feature && local.feature.description) || '',
            descrizione: local.description || '',
            _local: true,
        };
    }
    if (AppState.cachedBackground) {
    return AppState.cachedBackground.find(b => b.nome === nome) || null;
    }
    return null;
}

// Applica/rimuove l'auto-popolamento (skills, resistenze, velocita') in base
// alla razza+sottorazza correntemente selezionate. Richiamato dopo qualsiasi
// modifica.
function _pgApplyRaceAutoPopulate() {
    // Rimuove i contributi della precedente selezione
    _pgRaceSkills.forEach(s => pgCurrentSkillProficiencies.delete(s));
    _pgRaceResistances.forEach(r => {
        const i = pgCurrentResistenze.indexOf(r);
        if (i >= 0) pgCurrentResistenze.splice(i, 1);
    });
    _pgRaceSkills = [];
    _pgRaceResistances = [];
    const raceName = document.getElementById('pgRazza').value || '';
    const subName = document.getElementById('pgSottorazza').value || '';
    if (!raceName) return;
    const merged = buildMergedRaceData(raceName, subName) || getRaceData(raceName);
    if (!merged) return;
    const velField = document.getElementById('pgVelocita');
    if (velField) velField.value = merged.velocita || 9;
    if (Array.isArray(merged.resistenze) && merged.resistenze.length > 0) {
        _pgRaceResistances = [...merged.resistenze];
        merged.resistenze.forEach(r => { if (!pgCurrentResistenze.includes(r)) pgCurrentResistenze.push(r); });
    }
    if (Array.isArray(merged.competenze_abilita) && merged.competenze_abilita.length > 0) {
        _pgRaceSkills = [...merged.competenze_abilita];
        merged.competenze_abilita.forEach(s => pgCurrentSkillProficiencies.add(s));
    }
}

// Mostra/nasconde il selettore sottorazza in base alla razza scelta.
function _pgUpdateSottorazzaUI() {
    const raceName = document.getElementById('pgRazza').value || '';
    const group = document.getElementById('pgSottorazzaGroup');
    const btn = document.getElementById('pgSottorazzaBtn');
    const subInput = document.getElementById('pgSottorazza');
    if (!group) return;
    const subOpts = raceName ? buildSubraceOptionsLocal(raceName) : [];
    if (subOpts.length === 0) {
        group.style.display = 'none';
        if (subInput) subInput.value = '';
        if (btn) btn.textContent = 'Seleziona sottorazza...';
        return;
    }
    group.style.display = '';
    const currentSub = subInput ? subInput.value : '';
    const exists = currentSub && subOpts.some(o => o.value === currentSub);
    if (!exists && subInput) subInput.value = '';
    if (btn) btn.textContent = exists ? currentSub : 'Seleziona sottorazza...';
}

// Stato persistente per i picker (razza/sottorazza/background) e' inizializzato
// on-demand in openRazzaPicker, basato su stateKey: window._pgPickerSearch_<key>,
// window._pgPickerSources_<key>, window._pgPickerShow_<key>.

window.pgOpenRazzaSelect = function() {
    openRazzaPicker(
        buildRaceOptionsLocal(),
        'Seleziona Razza',
        (value) => {
            document.getElementById('pgRazza').value = value;
            const btn = document.getElementById('pgRazzaBtn');
            if (btn) btn.textContent = value;
            // Reset sottorazza se si cambia razza
            const subInput = document.getElementById('pgSottorazza');
            if (subInput) subInput.value = '';
            _pgUpdateSottorazzaUI();
            _pgApplyRaceAutoPopulate();
            // Se ci sono sottorazze, apri subito il selettore
            const subOpts = buildSubraceOptionsLocal(value);
            if (subOpts.length > 0) {
                setTimeout(() => window.pgOpenSottorazzaSelect(), 100);
            }
        },
        {
            stateKey: 'razza',
            placeholder: 'Cerca razza...',
            emptyText: 'Nessuna razza corrisponde ai filtri.',
        }
    );
}

window.pgOpenSottorazzaSelect = function() {
    const raceName = document.getElementById('pgRazza').value || '';
    if (!raceName) return;
    const opts = buildSubraceOptionsLocal(raceName);
    if (opts.length === 0) return;
    // Picker con sola ricerca (niente filtro fonte: tutte le sottorazze
    // appartengono comunque a un'unica razza ed e' utile vederle insieme).
    openRazzaPicker(
        opts,
        'Seleziona Sottorazza',
        (value) => {
            document.getElementById('pgSottorazza').value = value;
            const btn = document.getElementById('pgSottorazzaBtn');
            if (btn) btn.textContent = value;
            _pgApplyRaceAutoPopulate();
        },
        {
            stateKey: 'sottorazza',
            placeholder: 'Cerca sottorazza...',
            emptyText: 'Nessuna sottorazza corrisponde alla ricerca.',
            hideSourceFilter: opts.every(o => !o.source || o.source === opts[0].source),
        }
    );
}

// Picker razze/sottorazze con barra di ricerca + filtri per fonte (manuale).
// Le opzioni devono essere flat (no divider): ogni option ha { value, label,
// source }. Lo stato di ricerca/filtro e' globale (window._pgRazza*) per
// preservare l'ultima selezione tra aperture nella stessa sessione.
function openRazzaPicker(options, title, onSelect, opts = {}) {
    closeCustomSelect();
    // Stato indipendente per contesto: razza, sottorazza, background, ...
    // Cosi' search/filtri non si mescolano fra picker diversi.
    const stateKey = opts.stateKey || 'razza';
    const SK_SEARCH = '_pgPickerSearch_' + stateKey;
    const SK_SOURCES = '_pgPickerSources_' + stateKey;
    const SK_SHOW = '_pgPickerShow_' + stateKey;
    if (!window[SK_SOURCES]) window[SK_SOURCES] = new Set();
    const placeholder = opts.placeholder || 'Cerca per nome...';
    const emptyText = opts.emptyText || 'Nessuna voce corrisponde ai filtri.';
    const flat = options.filter(o => o.type !== 'divider');
    const allSources = Array.from(new Set(flat.map(o => o.source).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, 'it'));
    const hideFilters = !!opts.hideSourceFilter || allSources.length <= 1;
    if (hideFilters) {
        window[SK_SOURCES] = new Set();
    } else {
        const valid = new Set(allSources);
        window[SK_SOURCES] = new Set(
            Array.from(window[SK_SOURCES]).filter(s => valid.has(s))
        );
    }

    const overlay = document.createElement('div');
    overlay.id = 'customSelectOverlay';
    overlay.className = 'custom-select-overlay';
    overlay.innerHTML = `
        <div class="custom-select-panel razza-picker-panel">
            <div class="custom-select-header">
                <span>${escapeHtml(title || 'Seleziona')}</span>
                <button class="custom-select-close" onclick="closeCustomSelect()">&times;</button>
            </div>
            <div class="razza-picker-body">
                <div class="spell-picker-search-row">
                    <input type="text" id="razzaPickerSearch" class="hp-calc-input spell-picker-search" placeholder="${escapeAttr(placeholder)}" autocomplete="off">
                    ${hideFilters ? '' : `<button type="button" class="spell-picker-filter-btn" id="razzaPickerFilterBtn" title="Filtri">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        <span class="spell-picker-filter-badge" id="razzaPickerFilterBadge" style="display:none;">0</span>
                    </button>`}
                </div>
                <div class="spell-filter-panel" id="razzaPickerFilterPanel" style="display:none;">
                    <div class="spell-filter-group">
                        <div class="spell-filter-label">Manuale</div>
                        <div class="spell-filter-chips" id="razzaPickerSourceChips"></div>
                    </div>
                    <div class="spell-filter-actions">
                        <button type="button" class="btn-secondary btn-small" id="razzaPickerResetBtn">Reset</button>
                    </div>
                </div>
                <div class="custom-select-list" id="razzaPickerList"></div>
                <div class="razza-picker-empty" id="razzaPickerEmpty" style="display:none;">${escapeHtml(emptyText)}</div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCustomSelect(); });

    const searchInput = overlay.querySelector('#razzaPickerSearch');
    const listEl = overlay.querySelector('#razzaPickerList');
    const emptyEl = overlay.querySelector('#razzaPickerEmpty');
    const filterBtn = overlay.querySelector('#razzaPickerFilterBtn');
    const filterPanel = overlay.querySelector('#razzaPickerFilterPanel');
    const filterBadge = overlay.querySelector('#razzaPickerFilterBadge');
    const sourceChipsEl = overlay.querySelector('#razzaPickerSourceChips');
    const resetBtn = overlay.querySelector('#razzaPickerResetBtn');

    if (window[SK_SEARCH]) searchInput.value = window[SK_SEARCH];

    function renderSourceChips() {
        if (!sourceChipsEl) return;
        sourceChipsEl.innerHTML = allSources.map(src => {
            const active = window[SK_SOURCES].has(src);
            return `<button type="button" class="spell-filter-chip ${active ? 'active' : ''}" data-src="${escapeAttr(src)}">${escapeHtml(src)}</button>`;
        }).join('');
        sourceChipsEl.querySelectorAll('.spell-filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const src = chip.dataset.src;
                if (window[SK_SOURCES].has(src)) window[SK_SOURCES].delete(src);
                else window[SK_SOURCES].add(src);
                chip.classList.toggle('active');
                renderList();
                updateFilterBadge();
            });
        });
    }

    function updateFilterBadge() {
        if (!filterBadge) return;
        const n = window[SK_SOURCES].size;
        if (n > 0) {
            filterBadge.style.display = '';
            filterBadge.textContent = n;
            filterBtn.classList.add('active');
        } else {
            filterBadge.style.display = 'none';
            filterBtn.classList.remove('active');
        }
    }

    function renderList() {
        const q = (searchInput.value || '').trim().toLowerCase();
        window[SK_SEARCH] = searchInput.value || '';
        const selSrc = window[SK_SOURCES];
        const filtered = flat.filter(o => {
            if (q && !(o.label || '').toLowerCase().includes(q)) return false;
            if (selSrc.size > 0 && !selSrc.has(o.source)) return false;
            return true;
        });
        if (filtered.length === 0) {
            listEl.innerHTML = '';
            emptyEl.style.display = '';
            return;
        }
        emptyEl.style.display = 'none';
        listEl.innerHTML = filtered.map(o => {
            const srcHtml = o.source ? ` <span class="option-source">(${escapeHtml(o.source)})</span>` : '';
            return `<button type="button" class="custom-select-item" data-val="${escapeAttr(o.value)}">${escapeHtml(o.label)}${srcHtml}</button>`;
        }).join('');
        listEl.querySelectorAll('.custom-select-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.dataset.val;
                closeCustomSelect();
                if (typeof onSelect === 'function') onSelect(val);
            });
        });
    }

    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            window[SK_SHOW] = !window[SK_SHOW];
            filterPanel.style.display = window[SK_SHOW] ? '' : 'none';
        });
        if (window[SK_SHOW]) filterPanel.style.display = '';
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            window[SK_SOURCES] = new Set();
            renderSourceChips();
            updateFilterBadge();
            renderList();
        });
    }

    searchInput.addEventListener('input', () => renderList());
    renderSourceChips();
    updateFilterBadge();
    renderList();
    // NIENTE auto-focus: l'utente decide se attivare la tastiera cliccando.
}

window.pgOpenBackgroundSelect = function() {
    openRazzaPicker(
        buildBackgroundOptionsLocal(),
        'Seleziona Background',
        (value) => {
            document.getElementById('pgBackground').value = value;
            const btn = document.getElementById('pgBackgroundBtn');
            if (btn) btn.textContent = value;
            _pgApplyBackgroundAutoPopulate();
        },
        {
            stateKey: 'background',
            placeholder: 'Cerca background...',
            emptyText: 'Nessun background corrisponde ai filtri.',
        }
    );
}

// Applica/rimuove l'auto-popolamento (skills, tools, languages) in base al
// background correntemente selezionato. Idempotente: rimuove sempre prima
// i contributi della precedente selezione.
function _pgApplyBackgroundAutoPopulate() {
    _pgBgSkills.forEach(s => pgCurrentSkillProficiencies.delete(s));
    _pgBgTools.forEach(t => pgCurrentBgTools.delete(t));
    _pgBgLangs.forEach(l => pgCurrentBgLanguages.delete(l));
    _pgBgSkills = [];
    _pgBgTools = [];
    _pgBgLangs = [];

    const value = document.getElementById('pgBackground').value || '';
    if (!value) return;
            const data = getBackgroundData(value);
    if (!data) return;
    if (Array.isArray(data.competenze_abilita) && data.competenze_abilita.length > 0) {
        _pgBgSkills = [...data.competenze_abilita];
                data.competenze_abilita.forEach(s => pgCurrentSkillProficiencies.add(s));
            }
    if (Array.isArray(data.competenze_strumenti) && data.competenze_strumenti.length > 0) {
        _pgBgTools = [...data.competenze_strumenti];
        data.competenze_strumenti.forEach(t => pgCurrentBgTools.add(t));
    }
    if (Array.isArray(data.linguaggi_specifici) && data.linguaggi_specifici.length > 0) {
        _pgBgLangs = [...data.linguaggi_specifici];
        data.linguaggi_specifici.forEach(l => pgCurrentBgLanguages.add(l));
    }
}

window.pgOpenClassDropdown = function() {
    const available = DND_CLASSES.filter(c => !pgSelectedClasses.find(s => s.nome === c));
    if (available.length === 0) { showNotification('Tutte le classi sono già selezionate'); return; }
    openCustomSelect(
        available.map(c => ({ value: c, label: c })),
        (value) => {
            if (pgSelectedClasses.find(c => c.nome === value)) return;
            pgSelectedClasses.push({ nome: value, livello: 1 });
            pgRenderClassi();
            pgUpdateTotalLevel();
            pgUpdateSavingThrows();
            pgResetAutoHP();
        },
        'Seleziona Classe'
    );
}

window.pgRemoveClasse = function(index) {
    pgSelectedClasses.splice(index, 1);
    pgRenderClassi();
    pgUpdateTotalLevel();
    pgUpdateSavingThrows();
    pgResetAutoHP();
}

window.pgUpdateClassLevel = function(index, value) {
    const lv = Math.max(1, Math.min(20, parseInt(value) || 1));
    pgSelectedClasses[index].livello = lv;
    pgUpdateTotalLevel();
    pgResetAutoHP();
}

function pgResetAutoHP() {
    const pvField = document.getElementById('pgPV');
    if (pvField) pvField.dataset.autoHp = 'true';
    pgRenderDadiVita();
}

// Sottoclassi "third caster" (1/3 incantatore): l'attributo thirdCaster
// di una classe del PG viene derivato automaticamente quando il giocatore
// seleziona una di queste sottoclassi nel dropdown.
const THIRD_CASTER_SUBCLASS_KEYS = new Set([
    'eldritch-knight', 'arcane-trickster',
    'eldritch knight', 'arcane trickster',
    'cavaliere mistico', 'mistificatore arcano',
]);

function isThirdCasterSubclass(slug, name) {
    return THIRD_CASTER_SUBCLASS_KEYS.has(String(slug || '').toLowerCase()) ||
           THIRD_CASTER_SUBCLASS_KEYS.has(String(name || '').toLowerCase());
}

// Restituisce le sottoclassi disponibili nei dati per una data classe (per nome IT/EN)
function pgGetSubclassOptions(className) {
    const data = window.CLASSES_DATA || [];
    const cls = data.find(c =>
        (c.name || '').toLowerCase() === String(className).toLowerCase() ||
        (c.name_en || '').toLowerCase() === String(className).toLowerCase() ||
        (c.slug || '').toLowerCase() === String(className).toLowerCase()
    );
    if (!cls || !Array.isArray(cls.subclasses)) return [];
    return cls.subclasses.map(s => {
        const lvls = (s.features || []).map(f => f.level || 99);
        const minLevel = lvls.length ? Math.min(...lvls) : 3;
        return {
            slug: s.slug,
            name: s.name || s.name_en,
            minLevel: minLevel || 3,
            isHomebrew: false,
        };
    });
}

// Restituisce le sottoclassi HOMEBREW visibili (proprie + amici abilitati)
// per una data classe. Le voci contengono _hbId, _hbAuthor, _hbIsOwn per
// permettere alla scheda di risalire a tutti i privilegi/incantesimi.
function pgGetHomebrewSubclassOptions(className) {
    // Sync getter: se la cache non è popolata, restituisce []. Il preload
    // viene gestito nel click-handler async (pgOpenSubclassDropdown) e
    // all'apertura della modale, così evitiamo re-render side-effect che
    // farebbero sfarfallare il bottone Sottoclasse.
    if (typeof AppState === 'undefined' || !Array.isArray(AppState.cachedHomebrewSottoclassi)) {
        return [];
    }
    const all = AppState.cachedHomebrewSottoclassi;
    if (all.length === 0) return [];
    const data = window.CLASSES_DATA || [];
    const targetLower = String(className || '').toLowerCase().trim();
    const cls = data.find(c =>
        (c.name || '').toLowerCase() === targetLower ||
        (c.name_en || '').toLowerCase() === targetLower ||
        (c.slug || '').toLowerCase() === targetLower
    );
    const slug = cls ? cls.slug : null;
    // Filtro robusto: accetta match per slug (se trovato) E anche per
    // parent_class_name salvato nel record homebrew (case/spaces-insensitive).
    // In questo modo eventuali disallineamenti CLASSES_DATA <-> nome PG non
    // ci bloccano la visibilità della sottoclasse homebrew.
    const matches = all.filter(r => {
        const slugMatch = slug && r.parent_class_slug === slug;
        const nameMatch = (r.parent_class_name || '').toLowerCase().trim() === targetLower;
        return slugMatch || nameMatch;
    });
    try {
        console.log('[homebrew][picker] richiesta sottoclassi homebrew:', {
            className, targetLower, classeSlugTrovato: slug,
            sottoclassiInCache: all.length,
            sottoclassiPerQuestaClasse: matches.length,
            tutteLeCacheItems: all.map(r => `${r.parent_class_slug || '?'} (${r.parent_class_name || '?'}): ${r.nome}`)
        });
    } catch (_) {}
    if (matches.length === 0) return [];
    return matches
        .map(r => {
            // Min level = il minimo livello tra le feature definite (default 3)
            const lvls = Array.isArray(r.sottoclasse_features)
                ? r.sottoclasse_features.map(f => parseInt(f.level) || 99)
                : [];
            const minLevel = lvls.length ? Math.min(...lvls) : 3;
            return {
                slug: 'hb:' + r.id,
                name: r.nome || 'Sottoclasse',
                minLevel: minLevel || 3,
                isHomebrew: true,
                _hbId: r.id,
                _hbAuthor: r._author_name || '',
                _hbIsOwn: !!r._is_own,
            };
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'));
}

function _renderSubclassSelector(c, index, onclickFn) {
    const opts = pgGetSubclassOptions(c.nome);
    const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
    try {
        console.log('[homebrew][selector] _renderSubclassSelector chiamata:', {
            classeNome: c.nome,
            classeSlug: c.slug,
            optsNative: opts.length,
            optsHomebrew: hbOpts.length,
            cacheArray: Array.isArray(window.AppState?.cachedHomebrewSottoclassi)
                ? window.AppState.cachedHomebrewSottoclassi.length
                : 'NULL'
        });
    } catch (_) {}
    if (opts.length === 0 && hbOpts.length === 0) return '';
    const label = c.sottoclasse
        ? escapeHtml(c.sottoclasse)
        : '<span class="pg-subclass-trigger-empty">Sottoclasse…</span>';
    const clearBtn = c.sottoclasse
        ? `<button type="button" class="pg-subclass-clear" onclick="event.stopPropagation();${onclickFn.replace('pgOpenSubclassDropdown','pgClearSubclass').replace('microOpenSubclassDropdown','microClearSubclass')}(${index})" title="Rimuovi sottoclasse">×</button>`
        : '';
    return `
        <button type="button" class="pg-subclass-trigger" onclick="${onclickFn}(${index})">
            ${label}
            ${clearBtn}
        </button>`;
}

function pgRenderClassi() {
    const container = document.getElementById('pgClassiList');
    if (!container) return;
    const chipsHtml = pgSelectedClasses.map((c, i) => {
        const subSelector = _renderSubclassSelector(c, i, 'pgOpenSubclassDropdown');
        return `
        <div class="pg-classe-chip">
            <div class="pg-classe-chip-top">
                <span class="pg-classe-name">${escapeHtml(c.nome)}</span>
                <div class="pg-classe-lv-controls">
                    <span class="pg-classe-lv-label">Lv.</span>
                    <button type="button" class="pg-classe-lv-btn" onclick="pgClassLevelChange(${i},-1)">−</button>
                    <span class="pg-classe-lv-val">${c.livello}</span>
                    <button type="button" class="pg-classe-lv-btn" onclick="pgClassLevelChange(${i},1)">+</button>
                </div>
                <button type="button" class="pg-classe-remove" onclick="pgRemoveClasse(${i})">&times;</button>
            </div>
            ${subSelector}
        </div>`;
    }).join('');

    const addBtn = `<button type="button" class="pg-add-class-btn" onclick="pgOpenClassDropdown()">
        <span class="pg-add-class-plus">+</span> Aggiungi classe
    </button>`;
    container.innerHTML = chipsHtml + addBtn;
}

window.pgOpenSubclassDropdown = async function(index) {
    const c = pgSelectedClasses[index];
    if (!c) return;
    // Sicurezza: assicurati che le sottoclassi homebrew siano in cache
    // FRESCA prima di mostrare il picker (importante subito dopo aver
    // creato una sottoclasse nel laboratorio o cambiato utente).
    // La dedup interna del loader evita doppie query concorrenti.
    if (typeof loadHomebrewSottoclassi === 'function') {
        try { await loadHomebrewSottoclassi(); } catch (_) {}
    }
    const opts = pgGetSubclassOptions(c.nome);
    const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
    if (opts.length === 0 && hbOpts.length === 0) {
        showNotification(`Nessuna sottoclasse disponibile per ${c.nome}`);
        return;
    }
    const items = _buildSubclassPickerItems(opts, hbOpts, c.livello);
    const allOpts = [...opts, ...hbOpts];
    openCustomSelect(items, (value) => {
        if (value === '__none__') {
            delete c.sottoclasse;
            delete c.sottoclasseSlug;
            delete c.sottoclasse_homebrew_id;
            delete c.sottoclasse_homebrew_author;
            c.thirdCaster = false;
        } else {
            const sel = allOpts.find(o => o.slug === value);
            if (sel) {
                c.sottoclasse = sel.name;
                c.sottoclasseSlug = sel.slug;
                if (sel.isHomebrew) {
                    c.sottoclasse_homebrew_id = sel._hbId;
                    if (sel._hbAuthor) c.sottoclasse_homebrew_author = sel._hbAuthor;
                    c.thirdCaster = false;
                } else {
                    delete c.sottoclasse_homebrew_id;
                    delete c.sottoclasse_homebrew_author;
                    c.thirdCaster = isThirdCasterSubclass(sel.slug, sel.name);
                }
            }
        }
        pgRenderClassi();
        pgResetAutoHP();
    }, `Sottoclasse di ${c.nome}`);
};

// Helper condiviso fra scheda completa e micro-scheda: costruisce gli
// item del custom-select per le sottoclassi, separando con un divider
// le voci homebrew dalle ufficiali.
function _buildSubclassPickerItems(opts, hbOpts, livello) {
    const items = [
        { value: '__none__', label: 'Nessuna sottoclasse' },
        ...opts.map(o => ({
            value: o.slug,
            label: o.name + (livello < o.minLevel ? ` (dal liv. ${o.minLevel})` : '')
        }))
    ];
    if (hbOpts.length > 0) {
        items.push({ type: 'divider', label: 'Homebrew' });
        hbOpts.forEach(o => {
            const tag = o._hbIsOwn ? 'tuo' : (o._hbAuthor || 'amico');
            items.push({
                value: o.slug,
                label: o.name + (livello < o.minLevel ? ` (dal liv. ${o.minLevel})` : ''),
                source: tag,
            });
        });
    }
    return items;
}

window.pgClearSubclass = function(index) {
    const c = pgSelectedClasses[index];
    if (!c) return;
    delete c.sottoclasse;
    delete c.sottoclasseSlug;
    delete c.sottoclasse_homebrew_id;
    delete c.sottoclasse_homebrew_author;
    c.thirdCaster = false;
    pgRenderClassi();
    pgResetAutoHP();
};

window.pgClassLevelChange = function(index, delta) {
    const c = pgSelectedClasses[index];
    if (!c) return;
    c.livello = Math.max(1, Math.min(20, c.livello + delta));
    pgRenderClassi();
    pgUpdateTotalLevel();
    pgResetAutoHP();
}

// --- Saving Throws ---
function pgUpdateSavingThrows() {
    if (pgSelectedClasses.length === 0) return;
    const primaryClass = pgSelectedClasses[0].nome;
    const saves = CLASS_SAVES[primaryClass] || [];
    const allSaves = ['forza','destrezza','costituzione','intelligenza','saggezza','carisma'];
    allSaves.forEach(s => {
        const cb = document.getElementById(`save${s.charAt(0).toUpperCase() + s.slice(1)}`);
        if (cb) cb.checked = saves.includes(s);
    });
}

function pgGetSelectedSaves() {
    const allSaves = ['Forza','Destrezza','Costituzione','Intelligenza','Saggezza','Carisma'];
    return allSaves.filter(s => {
        const cb = document.getElementById(`save${s}`);
        return cb && cb.checked;
    }).map(s => s.toLowerCase());
}

// --- Skills ---
let pgCurrentSkillProficiencies = new Set();
let pgCurrentSkillExpertise = new Set();

function pgRenderSkills() {
    const container = document.getElementById('pgSkillsList');
    if (!container) return;
    const bonus = calcBonusCompetenza(pgGetTotalLevel());
    container.innerHTML = DND_SKILLS.map(skill => {
        const abilityInput = document.getElementById(`pg${skill.ability.charAt(0).toUpperCase() + skill.ability.slice(1)}`);
        const abilityScore = parseInt(abilityInput?.value) || 10;
        const abilityMod = calcMod(abilityScore);
        const isProf = pgCurrentSkillProficiencies.has(skill.key);
        const isExpert = pgCurrentSkillExpertise.has(skill.key);
        const totalVal = abilityMod + (isProf ? bonus : 0) + (isExpert ? bonus : 0);
        return `
        <div class="pg-skill-item ${isProf ? 'proficient' : ''} ${isExpert ? 'expert' : ''}">
            <span class="pg-skill-dot ${isProf ? 'active' : ''}" onclick="pgToggleSkill('${skill.key}')" title="Competenza">●</span>
            <span class="pg-skill-dot expert ${isExpert ? 'active' : ''}" onclick="pgToggleSkillExpert('${skill.key}')" title="Maestria">★</span>
            <span class="pg-skill-value">${formatModPlain(totalVal)}</span>
            <span class="pg-skill-name">${skill.nome}</span>
            <span class="pg-skill-ability">(${skill.abbr})</span>
        </div>`;
    }).join('');
}

window.pgToggleSkill = function(skillKey) {
    if (pgCurrentSkillProficiencies.has(skillKey)) {
        pgCurrentSkillProficiencies.delete(skillKey);
        pgCurrentSkillExpertise.delete(skillKey);
    } else {
        pgCurrentSkillProficiencies.add(skillKey);
    }
    pgRenderSkills();
    pgUpdatePercezionPassiva();
}

window.pgToggleSkillExpert = function(skillKey) {
    if (pgCurrentSkillExpertise.has(skillKey)) {
        pgCurrentSkillExpertise.delete(skillKey);
    } else {
        pgCurrentSkillProficiencies.add(skillKey);
        pgCurrentSkillExpertise.add(skillKey);
    }
    pgRenderSkills();
    pgUpdatePercezionPassiva();
}

function pgCalcPercPassiva() {
    const sagScore = parseInt(document.getElementById('pgSaggezza')?.value) || 10;
    const sagMod = calcMod(sagScore);
    const bonus = calcBonusCompetenza(pgGetTotalLevel());
    const isProf = pgCurrentSkillProficiencies.has('percezione');
    const isExpert = pgCurrentSkillExpertise.has('percezione');
    return 10 + sagMod + (isProf ? bonus : 0) + (isExpert ? bonus : 0);
}

// --- Resistenze ---
let pgCurrentResistenze = [];
let pgCurrentImmunita = [];

function pgRenderResImmGrid(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = DAMAGE_TYPES.map(dt => {
        const isRes = pgCurrentResistenze.includes(dt.value);
        const isImm = pgCurrentImmunita.includes(dt.value);
        return `
        <div class="pg-res-row">
            <span class="pg-res-label">${dt.label}</span>
            <input type="checkbox" class="pg-res-cb" ${isRes ? 'checked' : ''} onchange="pgToggleRes('${dt.value}', this.checked)" title="Resistenza">
            <input type="checkbox" class="pg-imm-cb" ${isImm ? 'checked' : ''} onchange="pgToggleImm('${dt.value}', this.checked)" title="Immunità">
        </div>`;
    }).join('');
}

window.pgToggleRes = function(val, checked) {
    if (checked) { if (!pgCurrentResistenze.includes(val)) pgCurrentResistenze.push(val); }
    else { pgCurrentResistenze = pgCurrentResistenze.filter(r => r !== val); }
}

window.pgToggleImm = function(val, checked) {
    if (checked) { if (!pgCurrentImmunita.includes(val)) pgCurrentImmunita.push(val); }
    else { pgCurrentImmunita = pgCurrentImmunita.filter(r => r !== val); }
}

// --- Spell Slots ---
let pgCurrentSlotIncantesimo = {};

const CLASS_SPELL_SLOTS = {
    'full': {
        1: {1:2}, 2: {1:3}, 3: {1:4,2:2}, 4: {1:4,2:3}, 5: {1:4,2:3,3:2},
        6: {1:4,2:3,3:3}, 7: {1:4,2:3,3:3,4:1}, 8: {1:4,2:3,3:3,4:2},
        9: {1:4,2:3,3:3,4:3,5:1}, 10: {1:4,2:3,3:3,4:3,5:2},
        11: {1:4,2:3,3:3,4:3,5:2,6:1}, 12: {1:4,2:3,3:3,4:3,5:2,6:1},
        13: {1:4,2:3,3:3,4:3,5:2,6:1,7:1}, 14: {1:4,2:3,3:3,4:3,5:2,6:1,7:1},
        15: {1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1}, 16: {1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1},
        17: {1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1,9:1}, 18: {1:4,2:3,3:3,4:3,5:3,6:1,7:1,8:1,9:1},
        19: {1:4,2:3,3:3,4:3,5:3,6:2,7:1,8:1,9:1}, 20: {1:4,2:3,3:3,4:3,5:3,6:2,7:2,8:1,9:1}
    },
    'half': {
        2: {1:2}, 3: {1:3}, 4: {1:3}, 5: {1:4,2:2}, 6: {1:4,2:2},
        7: {1:4,2:3}, 8: {1:4,2:3}, 9: {1:4,2:3,3:2}, 10: {1:4,2:3,3:2},
        11: {1:4,2:3,3:3}, 12: {1:4,2:3,3:3}, 13: {1:4,2:3,3:3,4:1}, 14: {1:4,2:3,3:3,4:1},
        15: {1:4,2:3,3:3,4:2}, 16: {1:4,2:3,3:3,4:2}, 17: {1:4,2:3,3:3,4:3,5:1}, 18: {1:4,2:3,3:3,4:3,5:1},
        19: {1:4,2:3,3:3,4:3,5:2}, 20: {1:4,2:3,3:3,4:3,5:2}
    },
    'third': {
        3: {1:2}, 4: {1:3}, 5: {1:3}, 6: {1:3},
        7: {1:4,2:2}, 8: {1:4,2:2}, 9: {1:4,2:2},
        10: {1:4,2:3}, 11: {1:4,2:3}, 12: {1:4,2:3},
        13: {1:4,2:3,3:2}, 14: {1:4,2:3,3:2}, 15: {1:4,2:3,3:2},
        16: {1:4,2:3,3:3}, 17: {1:4,2:3,3:3}, 18: {1:4,2:3,3:3},
        19: {1:4,2:3,3:3,4:1}, 20: {1:4,2:3,3:3,4:1}
    }
};

const CLASS_CASTER_TYPE = {
    'Bardo': 'full', 'Chierico': 'full', 'Druido': 'full', 'Mago': 'full',
    'Stregone': 'full', 'Warlock': 'pact',
    'Paladino': 'half', 'Ranger': 'half',
    'Artefice': 'half',
    'Barbaro': null, 'Guerriero': null, 'Ladro': null, 'Monaco': null
};

/**
 * Calcola gli slot incantesimo dato un array di classi del PG.
 *
 * Regole D&D 5e:
 *  - Single-class full caster (Bardo/Chierico/Druido/Mago/Stregone): tabella 'full' al livello reale.
 *  - Single-class half caster (Paladino/Ranger/Artefice): tabella 'half' al livello reale.
 *  - Single-class third caster (Eldritch Knight, Arcane Trickster): tabella 'third' al livello reale.
 *  - Multiclass: somma "effective caster level" = livelli full + floor(livelli half / 2)
 *    + floor(livelli third / 3) e si consulta SEMPRE la tabella 'full' (tabella Multiclass Spellcaster).
 *  - Pact Magic (Warlock): slot dedicati che si AGGIUNGONO sopra agli altri (se warlock multiclassato)
 *    o sostituiscono (se single-class warlock).
 */
function _computeSpellSlots(classi) {
    if (!Array.isArray(classi) || classi.length === 0) return {};

    // Categorizza ogni classe per tipo caster
    const fullClasses = [];
    const halfClasses = [];
    const thirdClasses = [];
    const pactClasses = [];
    const nonCasters = [];
    classi.forEach(cls => {
        const type = CLASS_CASTER_TYPE[cls.nome];
        if (type === 'full') fullClasses.push(cls);
        else if (type === 'half') halfClasses.push(cls);
        else if (type === 'pact') pactClasses.push(cls);
        else if (type === null && cls.thirdCaster) thirdClasses.push(cls);
        else nonCasters.push(cls);
    });

    const casterClassesCount = fullClasses.length + halfClasses.length + thirdClasses.length;
    const isMulticlass = casterClassesCount > 1;

    let slots = {};

    if (!isMulticlass && casterClassesCount === 1) {
        // SINGLE-CLASS caster: usa la tabella dedicata sul livello reale.
        let table = null, lv = 0;
        if (fullClasses.length === 1) { table = CLASS_SPELL_SLOTS.full;  lv = fullClasses[0].livello; }
        else if (halfClasses.length === 1) { table = CLASS_SPELL_SLOTS.half;  lv = halfClasses[0].livello; }
        else if (thirdClasses.length === 1) { table = CLASS_SPELL_SLOTS.third; lv = thirdClasses[0].livello; }
        if (table) {
            const level = Math.min(Math.max(lv, 0), 20);
        slots = table[level] ? { ...table[level] } : {};
        }
    } else if (isMulticlass) {
        // MULTICLASS: regola PHB - tabella 'full' sul livello effettivo.
        let effectiveLevel = 0;
        fullClasses.forEach(c => { effectiveLevel += c.livello; });
        halfClasses.forEach(c => { effectiveLevel += Math.floor(c.livello / 2); });
        thirdClasses.forEach(c => { effectiveLevel += Math.floor(c.livello / 3); });
        if (effectiveLevel > 0) {
            const level = Math.min(effectiveLevel, 20);
            const table = CLASS_SPELL_SLOTS.full;
            slots = table[level] ? { ...table[level] } : {};
        }
    }

    // Pact Magic (Warlock) - sempre additivo.
    if (pactClasses.length > 0) {
        const pactLevel = pactClasses.reduce((s, c) => s + c.livello, 0);
        if (pactLevel > 0) {
        const pactSlotLevel = Math.min(Math.ceil(pactLevel / 2), 5);
            const pactSlotCount = pactLevel >= 17 ? 4 : pactLevel >= 11 ? 3 : pactLevel >= 2 ? 2 : 1;
            slots[pactSlotLevel] = (slots[pactSlotLevel] || 0) + pactSlotCount;

            // Mystic Arcanum: 1 incantesimo conoscibile per ciascuno dei livelli
            // 6/7/8/9 sbloccati a livello Warlock 11/13/15/17 (lanciabile 1/giorno).
            // Lo modelliamo come 1 slot dedicato per ogni livello sbloccato,
            // additivo agli eventuali slot multiclass dello stesso livello.
            if (pactLevel >= 11) slots[6] = (slots[6] || 0) + 1;
            if (pactLevel >= 13) slots[7] = (slots[7] || 0) + 1;
            if (pactLevel >= 15) slots[8] = (slots[8] || 0) + 1;
            if (pactLevel >= 17) slots[9] = (slots[9] || 0) + 1;
        }
    }

    return slots;
}

function calcSpellSlotsFromClassi(classi) { return _computeSpellSlots(classi); }
function pgCalcSpellSlots() { return _computeSpellSlots(pgSelectedClasses); }

/**
 * Restituisce il massimo livello di incantesimo a cui il PG ha accesso
 * (per visualizzare la lista incantesimi conoscibili, anche se non ha slot).
 *
 * Particolarmente importante per il Warlock: pur avendo solo slot di livello
 * fino a 5, ottiene il Mystic Arcanum a lv 11/13/15/17 che gli permette di
 * conoscere e lanciare un incantesimo di livello 6/7/8/9. La lista degli
 * incantesimi accessibili deve quindi includere tutti i livelli da 0 al
 * massimo conoscibile, indipendentemente dalla presenza di slot.
 */
function _maxSpellLevelForClass(cls) {
    const type = CLASS_CASTER_TYPE[cls.nome];
    const lv = parseInt(cls.livello) || 0;
    if (lv <= 0) return 0;
    if (type === 'full') {
        const t = CLASS_SPELL_SLOTS.full[Math.min(lv, 20)];
        return t ? Math.max(...Object.keys(t).map(Number)) : 0;
    }
    if (type === 'half') {
        const t = CLASS_SPELL_SLOTS.half[Math.min(lv, 20)];
        return t ? Math.max(...Object.keys(t).map(Number)) : 0;
    }
    if (type === 'pact') {
        // Slot Pact (max 5) + Mystic Arcanum (lv 11/13/15/17 -> 6/7/8/9)
        let max = Math.min(Math.ceil(lv / 2), 5);
        if (lv >= 11) max = Math.max(max, 6);
        if (lv >= 13) max = Math.max(max, 7);
        if (lv >= 15) max = Math.max(max, 8);
        if (lv >= 17) max = Math.max(max, 9);
        return max;
    }
    if (type === null && cls.thirdCaster) {
        const t = CLASS_SPELL_SLOTS.third[Math.min(lv, 20)];
        return t ? Math.max(...Object.keys(t).map(Number)) : 0;
    }
    return 0;
}

function _maxKnownSpellLevel(classi) {
    return (classi || []).reduce((m, c) => Math.max(m, _maxSpellLevelForClass(c)), 0);
}

function pgBuildSlotIncantesimo() {
    const defaultSlots = pgCalcSpellSlots();
    const levels = Object.keys(defaultSlots).map(Number).sort((a, b) => a - b);
    if (levels.length === 0) return {};

    const result = {};
    levels.forEach(lvl => {
        const maxDefault = defaultSlots[lvl] || 0;
        const existing = pgCurrentSlotIncantesimo[lvl];
        if (existing) {
            result[lvl] = { max: maxDefault, current: Math.min(existing.current != null ? existing.current : maxDefault, maxDefault) };
        } else {
            result[lvl] = { max: maxDefault, current: maxDefault };
        }
    });
    return result;
}

function pgRenderSlotIncantesimo() {
    const container = document.getElementById('pgSlotIncantesimoList');
    if (!container) return;

    const defaultSlots = pgCalcSpellSlots();
    const slotLevels = Object.keys(defaultSlots).map(Number).sort((a, b) => a - b);

    if (slotLevels.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">Nessun incantesimo disponibile per questa classe</p>';
        pgCurrentSlotIncantesimo = {};
        return;
    }

    const merged = {};
    slotLevels.forEach(lvl => {
        const maxDefault = defaultSlots[lvl] || 0;
        const existing = pgCurrentSlotIncantesimo[lvl];
        if (existing) {
            merged[lvl] = { max: existing.max != null ? existing.max : maxDefault, current: existing.current != null ? existing.current : maxDefault };
        } else {
            merged[lvl] = { max: maxDefault, current: maxDefault };
        }
    });
    pgCurrentSlotIncantesimo = merged;

    container.innerHTML = slotLevels.map(lvl => {
        const s = merged[lvl];
        return `
        <div class="pg-slot-row">
            <span class="pg-slot-label">Livello ${lvl}</span>
            <div class="pg-slot-controls">
                <button type="button" class="pg-slot-btn" onclick="pgSlotDecrement(${lvl})">−</button>
                <span class="pg-slot-value" id="slotCurrent${lvl}">${s.current}</span>
                <span class="pg-slot-sep">/</span>
                <span class="pg-slot-max">${s.max}</span>
                <button type="button" class="pg-slot-btn" onclick="pgSlotIncrement(${lvl})">+</button>
            </div>
        </div>`;
    }).join('');
}

window.pgSlotDecrement = function(lvl) {
    if (!pgCurrentSlotIncantesimo[lvl]) return;
    if (pgCurrentSlotIncantesimo[lvl].current > 0) {
        pgCurrentSlotIncantesimo[lvl].current--;
        const el = document.getElementById(`slotCurrent${lvl}`);
        if (el) el.textContent = pgCurrentSlotIncantesimo[lvl].current;
    }
}

window.pgSlotIncrement = function(lvl) {
    if (!pgCurrentSlotIncantesimo[lvl]) return;
    if (pgCurrentSlotIncantesimo[lvl].current < pgCurrentSlotIncantesimo[lvl].max) {
        pgCurrentSlotIncantesimo[lvl].current++;
        const el = document.getElementById(`slotCurrent${lvl}`);
        if (el) el.textContent = pgCurrentSlotIncantesimo[lvl].current;
    }
}

// --- Hit Dice & HP Calculation ---
const CLASS_HIT_DIE = {
    'Artefice': 8, 'Bardo': 8, 'Chierico': 8, 'Druido': 8,
    'Ladro': 8, 'Monaco': 8, 'Warlock': 8,
    'Barbaro': 12,
    'Mago': 6, 'Stregone': 6,
    'Guerriero': 10, 'Paladino': 10, 'Ranger': 10
};

function dieAvg(die) {
    return Math.ceil(die / 2) + 1;
}

function pgCalcHP() {
    if (pgSelectedClasses.length === 0) return 0;
    const cosMod = calcMod(parseInt(document.getElementById('pgCostituzione')?.value) || 10);
    const totalLevel = pgGetTotalLevel();
    let hp = 0;

    pgSelectedClasses.forEach((cls, idx) => {
        const die = CLASS_HIT_DIE[cls.nome] || 8;
        const avg = dieAvg(die);
        if (idx === 0) {
            hp += die + (cls.livello - 1) * avg;
        } else {
            hp += cls.livello * avg;
        }
    });

    hp += totalLevel * cosMod;
    return Math.max(1, hp);
}

function pgRenderDadiVita() {
    const container = document.getElementById('pgDadiVitaList');
    if (!container) return;

    if (pgSelectedClasses.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">Seleziona una classe per vedere i dadi vita</p>';
        return;
    }

    const cosMod = calcMod(parseInt(document.getElementById('pgCostituzione')?.value) || 10);
    const totalLevel = pgGetTotalLevel();

    container.innerHTML = pgSelectedClasses.map((cls, idx) => {
        const die = CLASS_HIT_DIE[cls.nome] || 8;
        const avg = dieAvg(die);
        let detail;
        if (idx === 0) {
            detail = `${die} + ${cls.livello - 1}×${avg}`;
        } else {
            detail = `${cls.livello}×${avg}`;
        }
        return `
        <div class="pg-dado-vita-item">
            <span class="pg-dado-vita-classe">${escapeHtml(cls.nome)}</span>
            <span class="pg-dado-vita-dice">${cls.livello}d${die}</span>
            <span class="pg-dado-vita-detail">${detail}</span>
        </div>`;
    }).join('');

    const hp = pgCalcHP();
    const cosTotal = totalLevel * cosMod;
    const cosSign = cosTotal >= 0 ? '+' : '';
    const hintPV = document.getElementById('hintPV');
    if (hintPV) hintPV.textContent = `(calcolato: ${hp - cosTotal} ${cosSign}${cosTotal} COS = ${hp})`;

    const pvField = document.getElementById('pgPV');
    if (pvField && pvField.dataset.autoHp !== 'false') {
        pvField.value = hp;
    }
}

// --- Generic numeric keypad for inputs ---
window.pgOpenAbilityKeypad = function(inputEl) {
    const existing = document.getElementById('pgKeypadOverlay');
    if (existing) existing.remove();

    const currentVal = inputEl.value || '0';
    window._kpTarget = inputEl;
    window._kpBuffer = currentVal;

    const label = inputEl.closest('.form-group')?.querySelector('label')?.textContent
              || inputEl.closest('.pg-ability-block')?.querySelector('label')?.textContent
              || '';

    const overlay = document.createElement('div');
    overlay.id = 'pgKeypadOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="pgCloseKeypad()">&times;</button>
            <div class="hp-calc-title">${escapeHtml(label)}</div>
            <div class="hp-calc-input-display" id="kpDisplay">${escapeHtml(currentVal)}</div>
            <div class="hp-calc-numpad">
                <button class="hp-calc-numpad-btn" onclick="pgKeypadInput('1')">1</button>
                <button class="hp-calc-numpad-btn" onclick="pgKeypadInput('2')">2</button>
                <button class="hp-calc-numpad-btn" onclick="pgKeypadInput('3')">3</button>
                <button class="hp-calc-numpad-btn" onclick="pgKeypadInput('4')">4</button>
                <button class="hp-calc-numpad-btn" onclick="pgKeypadInput('5')">5</button>
                <button class="hp-calc-numpad-btn" onclick="pgKeypadInput('6')">6</button>
                <button class="hp-calc-numpad-btn" onclick="pgKeypadInput('7')">7</button>
                <button class="hp-calc-numpad-btn" onclick="pgKeypadInput('8')">8</button>
                <button class="hp-calc-numpad-btn" onclick="pgKeypadInput('9')">9</button>
                <button class="hp-calc-numpad-btn" onclick="pgKeypadInput('C')">C</button>
                <button class="hp-calc-numpad-btn" onclick="pgKeypadInput('0')">0</button>
                <button class="hp-calc-numpad-btn" onclick="pgKeypadInput('⌫')">⌫</button>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="pgKeypadConfirm()">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.pgKeypadInput = function(key) {
    if (key === 'C') { window._kpBuffer = '0'; }
    else if (key === '⌫') { window._kpBuffer = window._kpBuffer.length > 1 ? window._kpBuffer.slice(0, -1) : '0'; }
    else { window._kpBuffer = window._kpBuffer === '0' ? key : window._kpBuffer + key; }
    const disp = document.getElementById('kpDisplay');
    if (disp) disp.textContent = window._kpBuffer;
};

window.pgKeypadConfirm = function() {
    const input = window._kpTarget;
    if (input) {
        const val = parseInt(window._kpBuffer) || 0;
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        if (input.classList.contains('pg-ability-input')) {
            updateAllAbilityMods();
        }
    }
    pgCloseKeypad();
};

window.pgCloseKeypad = function() {
    const o = document.getElementById('pgKeypadOverlay');
    if (o) o.remove();
    window._kpTarget = null;
    window._kpBuffer = '0';
};

// --- Wizard Navigation ---
window.pgWizardNext = function() {
    if (pgWizardCurrentStep === 0) {
        const nome = document.getElementById('pgNome').value.trim();
        if (!nome) { showNotification('Inserisci un nome per il personaggio'); return; }
    }
    if (pgWizardCurrentStep === 1) {
        if (pgSelectedClasses.length === 0) { showNotification('Seleziona almeno una classe'); return; }
    }
    pgWizardGoTo(pgWizardCurrentStep + 1);
}

window.pgWizardPrev = function() {
    pgWizardGoTo(pgWizardCurrentStep - 1);
}

function pgWizardGoTo(step) {
    if (step < 0 || step > 7) return;
    pgWizardCurrentStep = step;

    document.querySelectorAll('#personaggioForm .wizard-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#personaggioModal .wizard-step').forEach((s, i) => {
        s.classList.toggle('active', i <= step);
    });

    const target = document.getElementById(`pgStep${step}`);
    if (target) target.classList.add('active');

    if (step === 2) {
        updateAllAbilityMods();
        if (!editingPersonaggioId && pgSelectedClasses.length > 0) {
            pgUpdateSavingThrows();
        }
        updateAllSaveValues();
    }
    if (step === 3) {
        pgRenderSkills();
    }
    if (step === 4) {
        pgRenderResImmGrid('pgResImmGrid');
    }
    if (step === 5) {
        pgRenderTalenti();
    }
    if (step === 6) {
        pgRenderEquipSelected();
    }
    if (step === 7) {
        const des = parseInt(document.getElementById('pgDestrezza')?.value) || 10;
        const cos = parseInt(document.getElementById('pgCostituzione')?.value) || 10;
        const sag = parseInt(document.getElementById('pgSaggezza')?.value) || 10;
        const desMod = calcMod(des);

        const initField = document.getElementById('pgIniziativa');
        if (initField && !initField.value) {
            initField.value = desMod;
        }

        const fakePg = {
            destrezza: des, costituzione: cos, saggezza: sag,
            classi: pgSelectedClasses, equipaggiamento: pgSelectedEquipment
        };
        const caBase = calcCAFromEquip(fakePg);
        const breakdownLines = getCABreakdown(fakePg);
        const caHint = breakdownLines.join(' | ');

        const caField = document.getElementById('pgCA');
        if (caField) caField.value = caBase;
        const hintCA = document.getElementById('hintCA');
        if (hintCA) hintCA.innerHTML = caHint;
        const hintInit = document.getElementById('hintIniziativa');
        if (hintInit) hintInit.textContent = `(des = ${formatModPlain(desMod)})`;

        pgRenderDadiVita();
    }
}

async function loadPersonaggi(options = {}) {
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn) return;
    const { silent = false } = options;

    if (!silent && elements.personaggiList) {
        elements.personaggiList.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento personaggi...</p></div>';
    }

    try {
        const { data: personaggi, error } = await supabase.rpc('get_personaggi_utente');
        if (error) throw error;

        const pgList = personaggi || [];
        let campagneMap = {};
        if (pgList.length > 0) {
            const pgIds = pgList.map(p => p.id);
            const { data: assocs, error: assocErr } = await supabase
                .from('personaggi_campagna')
                .select('personaggio_id, campagna_id')
                .in('personaggio_id', pgIds);
            if (assocErr) console.error('Errore caricamento associazioni pg-campagna:', assocErr);
            if (assocs && assocs.length > 0) {
                const campagnaIds = [...new Set(assocs.map(a => a.campagna_id))];
                const { data: campagne } = await supabase
                    .from('campagne')
                    .select('id, nome_campagna')
                    .in('id', campagnaIds);
                const nomiMap = {};
                if (campagne) campagne.forEach(c => { nomiMap[c.id] = c.nome_campagna; });
                assocs.forEach(a => {
                    if (!campagneMap[a.personaggio_id]) campagneMap[a.personaggio_id] = [];
                    const nome = nomiMap[a.campagna_id];
                    if (nome) campagneMap[a.personaggio_id].push(nome);
                });
            }
        }
        renderPersonaggi(pgList, campagneMap);
    } catch (error) {
        console.error('Errore caricamento personaggi:', error);
        if (elements.personaggiList) {
            elements.personaggiList.innerHTML = '<div class="content-placeholder"><p>Errore nel caricamento dei personaggi</p></div>';
        }
    }
}

function renderPersonaggi(personaggi, campagneMap = {}) {
    if (!elements.personaggiList) return;

    if (personaggi.length === 0) {
        elements.personaggiList.innerHTML = `
            <div class="content-placeholder">
                <p>Non ci sono personaggi. Crea il tuo (ennesimo) alter ego!</p>
            </div>`;
        return;
    }

    elements.personaggiList.innerHTML = personaggi.map(pg => {
        const initials = (pg.nome || '?').substring(0, 2).toUpperCase();
        let classeDisplay = pg.classe || '';
        if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
            classeDisplay = pg.classi.map(c => `${c.nome} ${c.livello}`).join(' / ');
        }
        const campagne = campagneMap[pg.id] || [];
        const campagneText = campagne.length > 0 ? campagne.map(n => escapeHtml(n)).join(', ') : 'Nessuna campagna';

        const isMicro = pg.tipo_scheda === 'micro';
        return `
        <div class="pg-card pg-card-clickable ${isMicro ? 'pg-card-micro' : ''}" data-pg-id="${pg.id}" onclick="openSchedaPersonaggio('${pg.id}')">
            <div class="pg-card-header">
                <div class="pg-card-avatar">${escapeHtml(initials)}</div>
                <div class="pg-card-identity">
                    <p class="pg-card-name">${escapeHtml(pg.nome)}${isMicro ? ' <span class="pg-micro-badge">μ</span>' : ''}</p>
                    <p class="pg-card-subtitle">${escapeHtml(pg.razza || '')} ${escapeHtml(classeDisplay)}</p>
                </div>
                <div class="pg-card-level">Lv ${pg.livello || 1}</div>
            </div>
            <div class="pg-card-footer">
                <div class="pg-card-campaigns"><span class="pg-card-campaigns-icon">⚔</span> ${campagneText}</div>
                <button class="pg-card-action pg-card-subclass-btn" onclick="event.stopPropagation(); pgChangeSubclassFromCard('${pg.id}')" aria-label="Cambia sottoclasse" title="Cambia sottoclasse"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg></button>
                <button class="pg-card-delete" onclick="event.stopPropagation(); deletePersonaggio('${pg.id}')" aria-label="Elimina personaggio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div>
        </div>`;
    }).join('');
}

// --- Scheda Personaggio Page ---
window.openSchedaPersonaggio = async function(personaggioId, opts) {
    AppState.currentPersonaggioId = personaggioId;
    sessionStorage.setItem('currentPersonaggioId', personaggioId);
    if (opts && opts.scrollToStats) {
        // Flag consumato dopo il render della Pagina 1 per centrare la tabella
        // delle statistiche (PV, PV temp, CA, ecc.). Usato quando si torna
        // alla scheda da una sessione/combattimento.
        window._schedaPendingScrollToStats = true;
    }
    navigateToPage('scheda');
    await renderSchedaPersonaggio(personaggioId);
}

// Debounced save for scheda fields
let _schedaSaveTimeout = null;
let _schedaPgCache = null;

function schedaDebouncedSave(personaggioId, field, value) {
    if (_schedaSaveTimeout) clearTimeout(_schedaSaveTimeout);
    _schedaSaveTimeout = setTimeout(async () => {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        try {
            await supabase.from('personaggi').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', personaggioId);
        } catch (e) { console.error('Errore salvataggio:', e); }
    }, 500);
}

async function schedaInstantSave(personaggioId, updates) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from('personaggi').update(updates).eq('id', personaggioId);
        if (error) console.error('Errore salvataggio:', error);
}

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
        { nome: 'Fortuna Tenebrosa', max: 'prof_bonus', fromLevel: 6, recharge: 'long_rest' },
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

const CLASS_SPELL_ABILITY = {
    'Bardo': 'carisma', 'Chierico': 'saggezza', 'Druido': 'saggezza', 'Mago': 'intelligenza',
    'Stregone': 'carisma', 'Warlock': 'carisma', 'Paladino': 'carisma', 'Ranger': 'saggezza',
    'Artefice': 'intelligenza'
};

// Classi che usano la "preparazione" (devono scegliere ogni giorno quali
// incantesimi conosciuti rendere disponibili). Le altre classi
// (Bardo, Stregone, Warlock, Ranger) hanno un numero fisso di
// "incantesimi conosciuti" che sono sempre considerati preparati.
const PREPARED_CASTER_CLASSES = ['Mago', 'Chierico', 'Druido', 'Paladino', 'Artefice'];

function _pgUsesPreparedSystem(pg) {
    return (pg?.classi || []).some(c => PREPARED_CASTER_CLASSES.includes(c.nome));
}

// Calcolo "regola standard" del numero massimo di incantesimi preparati.
// - Mago/Chierico/Druido/Artefice: mod caratteristica + livello di classe
// - Paladino: mod CAR + (livello/2 floor), minimo 1
// - In multiclass si sommano i contributi delle singole classi (semplificazione).
function _calcMaxPreparedAuto(pg) {
    if (!pg) return 0;
    let total = 0;
    for (const c of (pg.classi || [])) {
        if (!PREPARED_CASTER_CLASSES.includes(c.nome)) continue;
        const ab = CLASS_SPELL_ABILITY[c.nome];
        if (!ab) continue;
        const mod = Math.floor(((pg[ab] || 10) - 10) / 2);
        const lvl = c.livello || 1;
        const lvlContrib = c.nome === 'Paladino' ? Math.floor(lvl / 2) : lvl;
        total += Math.max(1, mod + lvlContrib);
    }
    return total;
}

function _spellIsPrepared(pg, spellName, spellLevel) {
    if (spellLevel === 0) return true;
    if (!_pgUsesPreparedSystem(pg)) return true;
    const list = Array.isArray(pg.incantesimi_preparati) ? pg.incantesimi_preparati : [];
    return list.includes(spellName);
}

async function renderSchedaPersonaggio(personaggioId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;

    const supabase = getSupabaseClient();
    if (!supabase) { content.innerHTML = '<p>Errore: Supabase non disponibile</p>'; return; }

    // Check tipo_scheda to route to micro view
    const { data: checkPg } = await supabase.from('personaggi').select('tipo_scheda').eq('id', personaggioId).single();
    if (checkPg?.tipo_scheda === 'micro') {
        return renderMicroScheda(personaggioId);
    }

    const tabBar = document.getElementById('schedaTabBar');
    if (tabBar) tabBar.style.display = '';

    window._schedaCurrentPgId = personaggioId;
    window._schedaCurrentTab = 'scheda';
    if (typeof updateScrollStatsBtn === 'function') updateScrollStatsBtn();

    if (!_schedaPgCache || _schedaPgCache.id !== personaggioId) {
        content.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento scheda...</p></div>';
    }

    try {
        const { data: pg, error } = await supabase.from('personaggi').select('*').eq('id', personaggioId).single();
        if (error || !pg) throw error || new Error('Personaggio non trovato');
        if (_hpCalcState && _hpCalcState.pgId === personaggioId) {
            pg[_hpCalcState.field] = _hpCalcState.currentVal;
        }
        _schedaPgCache = pg;

        // Auto-injection di resistenze derivate da privilegi di sottoclasse
        // (es. Difese Psichiche dello Stregone Mente Aberrante a liv 6).
        // Persistite a DB se mancanti, in modo che siano visibili anche da
        // altri dispositivi.
        if (_ensureSubclassAutoEffectsApplied(pg)) {
            try {
                await supabase.from('personaggi')
                    .update({ resistenze: pg.resistenze, updated_at: new Date().toISOString() })
                    .eq('id', personaggioId);
            } catch (e) {
                console.warn('[auto-resistance] save failed', e);
            }
        }

        const fMod = (val) => { const m = Math.floor(((val || 10) - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; };
        const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
        const saves = pg.tiri_salvezza || [];
        const skillProf = pg.competenze_abilita || [];
        const skillExpert = pg.maestrie_abilita || [];
        const pvAttuali = pg.pv_attuali != null ? pg.pv_attuali : pg.punti_vita_max;

        let classeDisplay = pg.classe || '';
        if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
            classeDisplay = pg.classi.map(c => `${c.nome} ${c.livello}`).join(' / ');
        }

        // 1. Abilities + Saves
        const abilitiesHtml = SCHEDA_ABILITIES.map(a => {
            const val = pg[a.key] || 10;
            const m = fMod(val);
            const isSaveProf = saves.includes(a.key);
            const saveExtra = _getSaveBonusFor(pg, a.key);
            const saveMod = Math.floor((val - 10) / 2) + (isSaveProf ? bonusComp : 0) + saveExtra;
            const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
            const saveMark = saveExtra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';
            return `
            <div class="scheda-ability">
                <div class="scheda-ability-label">${a.full}</div>
                <div class="scheda-ability-input clickable" id="sAbil_${a.key}" data-field="${a.key}" data-pgid="${pg.id}" onclick="schedaOpenAbilityCalc('${pg.id}','${a.key}')">${val}</div>
                <div class="scheda-ability-mod" id="sMod_${a.key}">${m}</div>
                <div class="scheda-ability-save ${isSaveProf ? 'proficient' : ''}" data-save="${a.key}" data-pgid="${pg.id}">
                    <span class="scheda-save-dot" onclick="schedaToggleSave('${pg.id}','${a.key}')" title="Tocca per attivare/disattivare la competenza">${isSaveProf ? '●' : '○'}</span>
                    <span class="scheda-save-clickable" onclick="schedaOpenSaveBonus('${pg.id}','${a.key}')" title="Modifica bonus extra ai TS">
                        <span class="scheda-save-label">TS</span>
                        <span class="scheda-save-val" id="sSave_${a.key}">${saveStr}${saveMark}</span>
                    </span>
                </div>
            </div>`;
        }).join('');

        // 2. Four boxes
        const initDisplay = pg.iniziativa != null ? pg.iniziativa : Math.floor(((pg.destrezza || 10) - 10) / 2);

        // 4. Skills with proficiency + expertise
        const sagMod = Math.floor(((pg.saggezza || 10) - 10) / 2);
        const percProf = skillProf.includes('percezione');
        const percExpert = skillExpert.includes('percezione');
        const percPassiva = 10 + sagMod + (percProf ? bonusComp : 0) + (percExpert ? bonusComp : 0);

        const skillsHtml = SCHEDA_SKILLS.map(sk => {
            const abilityVal = pg[sk.ability] || 10;
            const abilityMod = Math.floor((abilityVal - 10) / 2);
            const isProf = skillProf.includes(sk.key);
            const isExpert = skillExpert.includes(sk.key);
            const total = abilityMod + (isProf ? bonusComp : 0) + (isExpert ? bonusComp : 0);
            const totalStr = total >= 0 ? `+${total}` : `${total}`;
            return `
            <div class="scheda-skill">
                <span class="scheda-skill-dot ${isProf ? 'active' : ''}" tabindex="-1" onmousedown="event.preventDefault();schedaToggleSkillProf('${pg.id}','${sk.key}')" ontouchend="event.preventDefault();schedaToggleSkillProf('${pg.id}','${sk.key}')" title="Competenza">●</span>
                <span class="scheda-skill-dot expert ${isExpert ? 'active' : ''}" tabindex="-1" onmousedown="event.preventDefault();schedaToggleSkillExpert('${pg.id}','${sk.key}')" ontouchend="event.preventDefault();schedaToggleSkillExpert('${pg.id}','${sk.key}')" title="Maestria">★</span>
                <span class="scheda-skill-mod" id="sSkill_${sk.key}">${totalStr}</span>
                <span class="scheda-skill-name">${sk.label} <small>(${sk.ability.substring(0, 3).toUpperCase()})</small></span>
            </div>`;
        }).join('');

        // Hit dice
        const CLASS_HD = { 'Artefice':8,'Bardo':8,'Chierico':8,'Druido':8,'Ladro':8,'Monaco':8,'Warlock':8,'Barbaro':12,'Mago':6,'Stregone':6,'Guerriero':10,'Paladino':10,'Ranger':10 };
        const dadiDisp = pg.dadi_vita_disponibili || {};
        let hitDiceHtml = '';
        if (pg.classi && pg.classi.length > 0) {
            hitDiceHtml = `<div class="scheda-hd-table">
                ${pg.classi.map(c => {
                    const die = CLASS_HD[c.nome] || 8;
                    const total = c.livello;
                    const key = c.nome;
                    const available = Math.min(total, dadiDisp[key] != null ? dadiDisp[key] : total);
                    return `<div class="scheda-hd-row">
                        <span class="scheda-hd-total">${total}d${die} <small>(${c.nome})</small></span>
                        <div class="scheda-hd-avail">
                            <button class="scheda-hd-btn" onclick="schedaHdChange('${pg.id}','${key}',${available},-1,${total})">−</button>
                            <span class="scheda-hd-val" id="sHd_${key}">${available}</span>
                            <button class="scheda-hd-btn" onclick="schedaHdChange('${pg.id}','${key}',${available},1,${total})">+</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
        }

        // Class Resources (built-in + custom)
        const classResources = pg.risorse_classe || {};
        let classResourcesHtml = '';
            const resItems = [];
        if (pg.classi && pg.classi.length > 0) {
            pg.classi.forEach(c => {
                const resList = CLASS_RESOURCES[c.nome];
                if (!resList) return;
                resList.forEach((res, rIdx) => {
                    if (c.livello < res.fromLevel) return;
                let maxVal;
                if (res.hpPool) {
                    maxVal = c.livello * 5;
                } else if (res.usaMod) {
                    maxVal = Math.max(1, calcMod(pg[res.usaMod] || 10));
                } else if (res.perLivello) {
                    maxVal = res.perLivello[Math.min(c.livello, 20)] || 0;
                } else { return; }
                if (maxVal <= 0) return;
                    const key = rIdx === 0 ? `${c.nome}_res` : `${c.nome}_res_${rIdx}`;
                    // Applica eventuali override utente (nome / max).
                    const overrides = (classResources._overrides && classResources._overrides[key]) || {};
                    const dispNome = overrides.nome || res.nome;
                    if (typeof overrides.max === 'number' && overrides.max > 0) maxVal = overrides.max;
                const current = Math.min(maxVal, classResources[key] != null ? classResources[key] : maxVal);
                resItems.push(`<div class="scheda-hd-row">
                        <span class="scheda-hd-total scheda-hd-total-clickable" onclick="schedaOpenEditClassRes('${pg.id}','${key}','${escapeHtml(res.nome).replace(/'/g, '&#39;')}',${maxVal})" title="Modifica">${escapeHtml(dispNome)} <small>(${escapeHtml(c.nome)})</small></span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},-1,${maxVal})">−</button>
                        <span class="scheda-hd-val" id="sCRes_${key}">${current}</span>
                        <span class="scheda-hd-max">/ ${maxVal}</span>
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},1,${maxVal})">+</button>
                    </div>
                </div>`);
            });
            });
        }
        // Risorse di sottoclasse (auto-derivate da SUBCLASS_RESOURCES)
        _pgSubclassResources(pg).forEach(sr => {
            // Override utente (rinomina o cambio max).
            const overrides = (classResources._overrides && classResources._overrides[sr.key]) || {};
            const dispNome = overrides.nome || sr.nome;
            let maxVal = sr.max;
            if (typeof overrides.max === 'number' && overrides.max > 0) maxVal = overrides.max;
            const current = Math.min(maxVal, sr.current);
            const sub = sr.recharge ? ` <small>(${escapeHtml(sr.sottoclasseNome)}, ${sr.recharge})</small>` : ` <small>(${escapeHtml(sr.sottoclasseNome)})</small>`;
            const dieBadge = sr.die ? ` <small style="color:var(--accent);font-weight:700;">${sr.die}</small>` : '';
            const editBtn = `onclick="schedaOpenEditClassRes('${pg.id}','${sr.key}','${escapeHtml(sr.nome).replace(/'/g, '&#39;')}',${sr.defaultMax})" title="Modifica"`;
            if (sr.tipo === 'portent') {
                // Render specifico Portento (slot di dadi con valore salvato).
                const stored = (pg.risorse_classe && pg.risorse_classe._portent && pg.risorse_classe._portent[sr.key]) || [];
                const slots = [];
                for (let i = 0; i < maxVal; i++) {
                    const v = stored[i];
                    const filled = v != null && v >= 1 && v <= 20;
                    slots.push(`<button class="scheda-portent-slot${filled ? ' filled' : ''}" onclick="schedaPortentSlotClick('${pg.id}','${sr.key}',${i},${maxVal})" title="Click: imposta/usa">${filled ? v : '—'}</button>`);
                }
                const rollBtn = `<button class="scheda-portent-roll" onclick="schedaPortentRollAll('${pg.id}','${sr.key}',${maxVal})" title="Tira tutti">🎲</button>`;
                resItems.push(`<div class="scheda-hd-row scheda-hd-row-portent">
                    <span class="scheda-hd-total scheda-hd-total-clickable" ${editBtn}>${escapeHtml(dispNome)}${sub}</span>
                    <div class="scheda-hd-avail scheda-portent-slots">
                        ${slots.join('')}
                        ${rollBtn}
                    </div>
                </div>`);
            } else if (sr.tipo === 'ward_pool') {
                // Distorsione Arcana (Abjuration): pool di PF = 2*livMago + IntMod.
                const wizardLvl = (pg.classi || []).filter(c => c.nome === 'Mago').reduce((a,c) => a + (c.livello||0), 0);
                const intMod = calcMod(pg.intelligenza || 10);
                const wardMax = (typeof overrides.max === 'number' && overrides.max > 0) ? overrides.max : Math.max(0, 2 * wizardLvl + intMod);
                const wardCur = Math.min(wardMax, current);
                resItems.push(`<div class="scheda-hd-row">
                    <span class="scheda-hd-total scheda-hd-total-clickable" onclick="schedaOpenEditClassRes('${pg.id}','${sr.key}','${escapeHtml(sr.nome).replace(/'/g, '&#39;')}',${Math.max(0, 2 * wizardLvl + intMod)})" title="Modifica">${escapeHtml(dispNome)}${sub}</span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaSubclassResChange('${pg.id}','${sr.key}',${wardCur},-1,${wardMax})">−</button>
                        <span class="scheda-hd-val" id="sSubRes_${sr.key}">${wardCur}</span>
                        <span class="scheda-hd-max">/ ${wardMax}</span>
                        <button class="scheda-hd-btn" onclick="schedaSubclassResChange('${pg.id}','${sr.key}',${wardCur},1,${wardMax})">+</button>
                    </div>
                </div>`);
            } else {
                // Counter standard / dice_pool (con badge dado se presente).
                resItems.push(`<div class="scheda-hd-row">
                    <span class="scheda-hd-total scheda-hd-total-clickable" ${editBtn}>${escapeHtml(dispNome)}${dieBadge}${sub}</span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaSubclassResChange('${pg.id}','${sr.key}',${current},-1,${maxVal})">−</button>
                        <span class="scheda-hd-val" id="sSubRes_${sr.key}">${current}</span>
                        <span class="scheda-hd-max">/ ${maxVal}</span>
                        <button class="scheda-hd-btn" onclick="schedaSubclassResChange('${pg.id}','${sr.key}',${current},1,${maxVal})">+</button>
                    </div>
                </div>`);
            }
        });
        // Risorse razziali (auto-derivate dai tratti con `uses`)
        _pgRaceResources(pg).forEach(rr => {
            const sub = rr.recharge ? ` <small>(razza, ${rr.recharge})</small>` : ` <small>(razza)</small>`;
            resItems.push(`<div class="scheda-hd-row">
                <span class="scheda-hd-total">${escapeHtml(rr.name)}${sub}</span>
                <div class="scheda-hd-avail">
                    <button class="scheda-hd-btn" onclick="schedaRaceResChange('${pg.id}','${rr.key}',${rr.current},-1,${rr.max})">−</button>
                    <span class="scheda-hd-val" id="sRRes_${rr.key}">${rr.current}</span>
                    <span class="scheda-hd-max">/ ${rr.max}</span>
                    <button class="scheda-hd-btn" onclick="schedaRaceResChange('${pg.id}','${rr.key}',${rr.current},1,${rr.max})">+</button>
                </div>
            </div>`);
        });
        // Risorse derivate dalle invocazioni occulte (non-spell): es. Cloak
        // of Flies (1/breve), Tomb of Levistus, Bond of the Talisman
        // (prof_bonus/lungo), Gift of the Protectors, Protection of the
        // Talisman, ecc.
        _pgInvocationSlots(pg).filter(is => !is.is_spell).forEach(is => {
            resItems.push(`<div class="scheda-hd-row">
                <span class="scheda-hd-total">${escapeHtml(is.name)} <small>(invocazione, ${escapeHtml(is.recharge)})</small></span>
                <div class="scheda-hd-avail">
                    <button class="scheda-hd-btn" onclick="schedaInvocationSlotChange('${pg.id}','${is.key}',${is.current},-1,${is.max})">−</button>
                    <span class="scheda-hd-val" id="sInvRes_${is.key}">${is.current}</span>
                    <span class="scheda-hd-max">/ ${is.max}</span>
                    <button class="scheda-hd-btn" onclick="schedaInvocationSlotChange('${pg.id}','${is.key}',${is.current},1,${is.max})">+</button>
                </div>
            </div>`);
        });
        const customRes = classResources._custom || [];
        customRes.forEach((cr, i) => {
            const current = cr.current != null ? cr.current : cr.max;
            const label = cr.tipo === 'dadi' ? `${escapeHtml(cr.nome)} <small>(${cr.dado})</small>` : escapeHtml(cr.nome);
            resItems.push(`<div class="scheda-hd-row">
                <span class="scheda-hd-total scheda-hd-total-clickable" onclick="schedaOpenAddCustomRes('${pg.id}',${i})" title="Modifica / elimina">${label}</span>
                <div class="scheda-hd-avail">
                    <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},-1,${cr.max})">−</button>
                    <span class="scheda-hd-val" id="sCusRes_${i}">${current}</span>
                    <span class="scheda-hd-max">/ ${cr.max}</span>
                    <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},1,${cr.max})">+</button>
                </div>
            </div>`);
        });
        classResourcesHtml = `<div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Risorse
                <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenAddCustomRes('${pg.id}')" title="Aggiungi risorsa">&#9998;</button>
            </div>
            <div class="scheda-section-body">
            ${resItems.length > 0 ? `<div class="scheda-hd-table">${resItems.join('')}</div>` : '<span class="scheda-empty">Nessuna risorsa</span>'}
            </div>
        </div>`;

        // Resistenze, Immunita', Vulnerabilita' (inline: 3 segnalini R/I/V con mutua esclusione fra loro)
        const curRes = Array.isArray(pg.resistenze) ? pg.resistenze : [];
        const curImm = Array.isArray(pg.immunita) ? pg.immunita : [];
        const curVul = Array.isArray(pg.vulnerabilita) ? pg.vulnerabilita : [];
        const nRes = curRes.length, nImm = curImm.length, nVul = curVul.length;
        const resImmInlineHtml = `<div class="scheda-resimm-grid">${DAMAGE_TYPES.map(dt => {
            const isRes = curRes.includes(dt.value);
            const isImm = curImm.includes(dt.value);
            const isVul = curVul.includes(dt.value);
            return `<div class="scheda-resimm-row" id="sResImmRow_${dt.value}">
                <span class="scheda-resimm-marker res ${isRes ? 'active' : ''}" tabindex="-1"
                      onmousedown="event.preventDefault();schedaToggleResInline('${pg.id}','${dt.value}')"
                      ontouchend="event.preventDefault();schedaToggleResInline('${pg.id}','${dt.value}')"
                      title="Resistenza">R</span>
                <span class="scheda-resimm-marker imm ${isImm ? 'active' : ''}" tabindex="-1"
                      onmousedown="event.preventDefault();schedaToggleImmInline('${pg.id}','${dt.value}')"
                      ontouchend="event.preventDefault();schedaToggleImmInline('${pg.id}','${dt.value}')"
                      title="Immunità">I</span>
                <span class="scheda-resimm-marker vul ${isVul ? 'active' : ''}" tabindex="-1"
                      onmousedown="event.preventDefault();schedaToggleVulInline('${pg.id}','${dt.value}')"
                      ontouchend="event.preventDefault();schedaToggleVulInline('${pg.id}','${dt.value}')"
                      title="Vulnerabilità">V</span>
                <span class="scheda-resimm-name">${escapeHtml(dt.label)}</span>
            </div>`;
        }).join('')}</div>
        <div class="scheda-resimm-legend">
            <span><span class="scheda-resimm-marker res active">R</span> Resistenza</span>
            <span><span class="scheda-resimm-marker imm active">I</span> Immunità</span>
            <span><span class="scheda-resimm-marker vul active">V</span> Vulnerabilità</span>
        </div>`;
        const resImmCount = nRes + nImm + nVul;

        // Conditions (excluding concentrazione which is shown separately)
        const conditionsActive = ALL_CONDITIONS.filter(c => c.key !== 'concentrazione' && pg[c.key]);
        const conditionsHtml = conditionsActive.length > 0 ?
            conditionsActive.map(c => `<span class="condition-badge active">${c.label}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';
        const isConcentrating = !!pg.concentrazione;

        // Check if spellcaster
        const hasSpellSlots = pg.slot_incantesimo && typeof pg.slot_incantesimo === 'object' && Object.keys(pg.slot_incantesimo).length > 0;

        content.innerHTML = `
        ${buildSchedaHeader(pg)}

        <div class="scheda-page-grid">
        <div class="scheda-col scheda-col-left">

        <div class="scheda-perc-passiva scheda-prof-bonus">
            <span class="scheda-perc-val" id="sBonusComp">+${calcBonusCompetenza(pg.livello || 1)}</span>
            <span class="scheda-perc-label">Bonus di Competenza</span>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Caratteristiche e Tiri Salvezza</div>
            <div class="scheda-section-body">
                <div class="scheda-abilities">${abilitiesHtml}</div>
            </div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Abilità</div>
            <div class="scheda-section-body">
                <div class="scheda-skills" id="schedaSkillsList">${skillsHtml}</div>
                <div class="scheda-perc-passiva">
                    <span class="scheda-perc-val" id="sPercPassiva">${percPassiva}</span>
                    <span class="scheda-perc-label">Percezione Passiva</span>
                </div>
            </div>
        </div>

        ${buildLangProfSection(pg)}

        </div><!-- /scheda-col-left -->
        <hr class="scheda-divider">
        <div class="scheda-col scheda-col-right">

        <div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Statistiche</div>
            <div class="scheda-section-body">
        <div class="scheda-three-boxes">
                    <div class="scheda-box clickable" onclick="schedaOpenCABonus('${pg.id}')">
                        <div class="scheda-box-val" id="schedaCA">${pg.classe_armatura || 10}</div>
                <div class="scheda-box-label">CA</div>
            </div>
                    <div class="scheda-box clickable" onclick="schedaOpenStatCalc('${pg.id}','iniziativa')">
                        <div class="scheda-box-val" id="schedaInit">${initDisplay >= 0 ? '+' + initDisplay : initDisplay}</div>
                <div class="scheda-box-label">Iniziativa</div>
            </div>
                    <div class="scheda-box clickable" onclick="schedaOpenSpeedCalc('${pg.id}')">
                        <div class="scheda-box-val" id="schedaSpeed">${pg.velocita || 9}</div>
                <div class="scheda-box-label">Velocità</div>
            </div>
        </div>
        <div class="scheda-hp-section">
                    <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalcLive('${pg.id}','punti_vita_max')">
                        <div class="scheda-hp-display" id="schedaPvMax">${pg.punti_vita_max || 10}</div>
                        <div class="scheda-hp-label">PV Max</div>
                    </div>
                    <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalcLive('${pg.id}','pv_attuali')">
                        <div class="scheda-hp-display pv-current" id="schedaPvAttuali">${pvAttuali}</div>
                        <div class="scheda-hp-label">PV Attuali</div>
                    </div>
                    <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalcLive('${pg.id}','pv_temporanei')">
                        <div class="scheda-hp-display" id="schedaPvTemp">${pg.pv_temporanei || 0}</div>
                        <div class="scheda-hp-label">PV Temp</div>
                </div>
            </div>
                <div class="scheda-subsection collapsed">
                    <div class="scheda-subsection-title" onclick="schedaToggleSubsection(this)">
                        <span>Difese</span>
                        <span class="scheda-subsection-meta" id="sResImmCount">${resImmCount > 0 ? resImmCount : ''}</span>
                        <span class="scheda-subsection-arrow">▾</span>
            </div>
                    <div class="scheda-subsection-body">${resImmInlineHtml}</div>
        </div>
                <div class="scheda-subsection collapsed">
                    <div class="scheda-subsection-title" onclick="schedaToggleSubsection(this)">
                        <span>Condizioni</span>
                        <span class="scheda-subsection-meta">${conditionsActive.length > 0 ? conditionsActive.length : ''}${isConcentrating ? ' • C' : ''}</span>
                        <span class="scheda-subsection-arrow">▾</span>
                    </div>
                    <!-- Pinned: sempre visibile e interagibile anche con la tendina chiusa -->
                    <div class="scheda-subsection-pinned">
                        <div class="scheda-concentrazione-row">
                            <button type="button" class="scheda-concentrazione-btn ${isConcentrating ? 'active' : ''}" onclick="event.stopPropagation();schedaToggleConcentrazione('${pg.id}',this)">Concentrazione</button>
                        </div>
                    </div>
                    <div class="scheda-subsection-body">
                        <div class="scheda-tags" style="margin-top:8px;">${conditionsHtml}</div>
                        <div class="scheda-condition-extra">
                            <span>Esaustione: <strong>${pg.esaustione || 0}</strong>/6</span>
                        </div>
                        <button type="button" class="btn-secondary btn-small" style="margin-top:8px;" onclick="openConditionsModal('${pg.id}')">Modifica stato</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Dadi Vita</div>
            <div class="scheda-section-body">
            ${hitDiceHtml || '<span class="scheda-empty">-</span>'}
            </div>
        </div>

        ${buildEquipSection(pg)}

        ${classResourcesHtml}

        ${_buildP1CustomTablesHtml(pg)}

        <div class="priv-add-tab-wrap">
            <button class="btn-secondary priv-add-tab-btn" onclick="p1AddTab()">
                <span class="priv-add-tab-plus">+</span> Nuova tabella
            </button>
        </div>

        </div><!-- /scheda-col-right -->
        </div><!-- /scheda-page-grid -->
        `;

        // Wire up editable inputs
        const backBtn = document.getElementById('schedaBackBtn');
        if (backBtn) backBtn.onclick = () => navigateToPage('personaggi');

        schedaSetActiveTab('scheda');
        schedaWireTabBar(pg.id);

        // Se richiesto (es. ritorno da combattimento), centra la vista sulla
        // tabella delle statistiche (PV / PV temp / CA / iniziativa).
        if (window._schedaPendingScrollToStats) {
            window._schedaPendingScrollToStats = false;
            setTimeout(() => { try { _scrollSchedaDividerIntoView(); } catch(_){} }, 60);
        }

    } catch (e) {
        console.error('Errore caricamento scheda:', e);
        content.innerHTML = '<div class="content-placeholder"><p>Errore nel caricamento della scheda</p></div>';
    }
}

function schedaRecalcAbility(abilityKey, val, pgId) {
    const m = Math.floor((val - 10) / 2);
    const mStr = m >= 0 ? `+${m}` : `${m}`;
    const modEl = document.getElementById(`sMod_${abilityKey}`);
    if (modEl) modEl.textContent = mStr;

    const pg = _schedaPgCache;
    if (!pg) return;
    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const saves = pg.tiri_salvezza || [];
    const isSaveProf = saves.includes(abilityKey);
    const saveExtra = _getSaveBonusFor(pg, abilityKey);
    const saveMod = m + (isSaveProf ? bonusComp : 0) + saveExtra;
    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
    const saveMark = saveExtra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';
    const saveEl = document.getElementById(`sSave_${abilityKey}`);
    if (saveEl) saveEl.innerHTML = `${saveStr}${saveMark}`;

    // Update skills that depend on this ability
    const skillProf = pg.competenze_abilita || [];
    const skillExpert = pg.maestrie_abilita || [];
    SCHEDA_SKILLS.filter(sk => sk.ability === abilityKey).forEach(sk => {
        const isProf = skillProf.includes(sk.key);
        const isExpert = skillExpert.includes(sk.key);
        const total = m + (isProf ? bonusComp : 0) + (isExpert ? bonusComp : 0);
        const totalStr = total >= 0 ? `+${total}` : `${total}`;
        const el = document.getElementById(`sSkill_${sk.key}`);
        if (el) el.textContent = totalStr;
    });

    if (abilityKey === 'saggezza') {
        const percProf = skillProf.includes('percezione');
        const percExpert = skillExpert.includes('percezione');
        const pp = 10 + m + (percProf ? bonusComp : 0) + (percExpert ? bonusComp : 0);
        const ppEl = document.getElementById('sPercPassiva');
        if (ppEl) ppEl.textContent = pp;
    }
}

window.schedaToggleSave = async function(pgId, abilityKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const saves = [...(pg.tiri_salvezza || [])];
    const idx = saves.indexOf(abilityKey);
    if (idx >= 0) saves.splice(idx, 1); else saves.push(abilityKey);
    pg.tiri_salvezza = saves;

    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const val = pg[abilityKey] || 10;
    const m = Math.floor((val - 10) / 2);
    const isProf = saves.includes(abilityKey);
    const saveExtra = _getSaveBonusFor(pg, abilityKey);
    const saveMod = m + (isProf ? bonusComp : 0) + saveExtra;
    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
    const saveMark = saveExtra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';

    const saveEl = document.querySelector(`.scheda-ability-save[data-save="${abilityKey}"]`);
    if (saveEl) {
        saveEl.classList.toggle('proficient', isProf);
        saveEl.querySelector('.scheda-save-dot').textContent = isProf ? '●' : '○';
        saveEl.querySelector('.scheda-save-val').innerHTML = `${saveStr}${saveMark}`;
    }
    schedaInstantSave(pgId, { tiri_salvezza: saves });
}

window.schedaToggleSkillProf = async function(pgId, skillKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const skills = [...(pg.competenze_abilita || [])];
    const idx = skills.indexOf(skillKey);
    if (idx >= 0) skills.splice(idx, 1); else skills.push(skillKey);
    pg.competenze_abilita = skills;

    schedaRefreshSkill(pg, skillKey);
    schedaInstantSave(pgId, { competenze_abilita: skills });
}

window.schedaToggleSkillExpert = async function(pgId, skillKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const experts = [...(pg.maestrie_abilita || [])];
    const idx = experts.indexOf(skillKey);
    const adding = idx < 0;
    if (adding) experts.push(skillKey); else experts.splice(idx, 1);
    pg.maestrie_abilita = experts;

    const updates = { maestrie_abilita: experts };

    if (adding && !(pg.competenze_abilita || []).includes(skillKey)) {
        const skills = [...(pg.competenze_abilita || []), skillKey];
        pg.competenze_abilita = skills;
        updates.competenze_abilita = skills;
    }

    schedaRefreshSkill(pg, skillKey);
    schedaInstantSave(pgId, updates);
}

function schedaRefreshSkill(pg, skillKey) {
    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const sk = SCHEDA_SKILLS.find(s => s.key === skillKey);
    if (!sk) return;

    const abilityVal = pg[sk.ability] || 10;
    const abilityMod = Math.floor((abilityVal - 10) / 2);
    const isProf = (pg.competenze_abilita || []).includes(skillKey);
    const isExpert = (pg.maestrie_abilita || []).includes(skillKey);
    const total = abilityMod + (isProf ? bonusComp : 0) + (isExpert ? bonusComp : 0);
    const totalStr = total >= 0 ? `+${total}` : `${total}`;

    const el = document.getElementById(`sSkill_${skillKey}`);
    if (el) el.textContent = totalStr;

    const row = el?.closest('.scheda-skill');
    if (row) {
        const dots = row.querySelectorAll('.scheda-skill-dot');
        if (dots[0]) dots[0].classList.toggle('active', isProf);
        if (dots[1]) dots[1].classList.toggle('active', isExpert);
    }

    if (skillKey === 'percezione') {
        const sagMod = Math.floor(((pg.saggezza || 10) - 10) / 2);
        const pp = 10 + sagMod + (isProf ? bonusComp : 0) + (isExpert ? bonusComp : 0);
        const ppEl = document.getElementById('sPercPassiva');
        if (ppEl) ppEl.textContent = pp;
    }
}

// Spell Page
window.schedaOpenSpellPage = async function(pgId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: pg } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
    if (!pg) return;
    _schedaPgCache = pg;

    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const classi = pg.classi || [];

    // Aggrega per caratteristica (come prima) ma mantieni TUTTI i nomi delle classi
    // che condividono quella caratteristica: l'utente potrebbe voler aggiungere bonus
    // separati per classi diverse (es. oggetto che potenzia solo gli incantesimi da Mago).
    const spellAbilities = [];
    classi.forEach(c => {
        const ab = CLASS_SPELL_ABILITY[c.nome];
        if (!ab) return;
        const existing = spellAbilities.find(s => s.ability === ab);
        if (existing) {
            if (!existing.classi.includes(c.nome)) existing.classi.push(c.nome);
        } else {
            const val = pg[ab] || 10;
            const m = Math.floor((val - 10) / 2);
            spellAbilities.push({ classi: [c.nome], ability: ab, mod: m });
        }
    });

    const spellStatsHtml = spellAbilities.length > 0 ? spellAbilities.map(sa => {
        const atkBase = sa.mod + bonusComp;
        const dcBase = 8 + bonusComp + sa.mod;
        // Somma bonus manuali di tutte le classi che condividono questa caratteristica.
        let atkExtra = 0, dcExtra = 0;
        sa.classi.forEach(cn => {
            const b = _getCasterBonusFor(pg, cn);
            atkExtra += b.atk;
            dcExtra += b.dc;
        });
        const atkTot = atkBase + atkExtra;
        const dcTot = dcBase + dcExtra;
        const atkStr = atkTot >= 0 ? `+${atkTot}` : `${atkTot}`;
        const modStr = sa.mod >= 0 ? `+${sa.mod}` : `${sa.mod}`;
        const atkMark = atkExtra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';
        const dcMark = dcExtra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';
        const classiArg = encodeURIComponent(JSON.stringify(sa.classi));
        const onAtk = `onclick="schedaOpenSpellAtkBonus('${pg.id}','${classiArg}')"`;
        const onDc = `onclick="schedaOpenSpellDcBonus('${pg.id}','${classiArg}')"`;
        const classesLabel = sa.classi.join(' / ');
        const titleAtk = `title="${escapeHtml(classesLabel)} – bonus tiro per colpire"`;
        const titleDc = `title="${escapeHtml(classesLabel)} – bonus CD"`;
        return `
        <div class="scheda-spell-stats-row" data-classi="${escapeHtml(classesLabel)}">
            <div class="scheda-box"><div class="scheda-box-val">${modStr}</div><div class="scheda-box-label">Car. (${sa.ability.substring(0,3).toUpperCase()})</div></div>
            <div class="scheda-box clickable" ${onAtk} ${titleAtk}><div class="scheda-box-val">${atkStr}${atkMark}</div><div class="scheda-box-label">Attacco Inc.</div></div>
            <div class="scheda-box clickable" ${onDc} ${titleDc}><div class="scheda-box-val">${dcTot}${dcMark}</div><div class="scheda-box-label">CD Inc.</div></div>
        </div>`;
    }).join('') : '<p class="scheda-empty">Nessuna classe incantatrice</p>';

    // Counter "Incantesimi preparati": visibile solo per le classi che usano
    // la preparazione (Mago/Chierico/Druido/Paladino/Artefice). Il conteggio
    // include solo gli incantesimi marcati come preparati di livello >= 1
    // (i trucchetti non si preparano). Il massimo e' precompilato con la
    // formula standard (mod + livello), sovrascrivibile manualmente.
    const usesPrepared = _pgUsesPreparedSystem(pg);
    const preparedCount = usesPrepared
        ? (pg.incantesimi_preparati || [])
            .map(n => _resolveSpell(n))
            .filter(sp => sp && sp.level > 0).length
        : 0;
    const autoMax = _calcMaxPreparedAuto(pg);
    const overrideMax = parseInt(_getBonusManuali(pg).spells_prepared_max) || 0;
    const preparedMax = overrideMax > 0 ? overrideMax : autoMax;
    const preparedRatio = preparedMax > 0 ? `${preparedCount} / ${preparedMax}` : `${preparedCount} / —`;
    const preparedOver = preparedMax > 0 && preparedCount > preparedMax;
    const preparedHint = overrideMax > 0
        ? '<span class="scheda-prepared-hint">manuale</span>'
        : (autoMax > 0 ? '<span class="scheda-prepared-hint">auto</span>' : '');
    const preparedBlock = usesPrepared ? `
        <div class="scheda-prepared-block ${preparedOver ? 'over' : ''}" onclick="schedaOpenPreparedMax('${pg.id}')" title="Clicca per modificare il massimo">
            <div class="scheda-prepared-label">Incantesimi preparati ${preparedHint}</div>
            <div class="scheda-prepared-value" id="schedaPreparedRatio">${preparedRatio}</div>
        </div>` : '';

    // Sincronizza gli slot salvati con quelli calcolati dalle classi correnti.
    // Necessario per allineare PG esistenti dopo modifiche alle regole di calcolo
    // (es. aggiunta Mystic Arcanum del Warlock o tabelle half/third caster fixate).
    // Preserva "used" clampato al nuovo max e salva solo se ci sono differenze.
    const expectedSlots = calcSpellSlotsFromClassi(classi);
    const prevSlots = (pg.slot_incantesimo && typeof pg.slot_incantesimo === 'object') ? pg.slot_incantesimo : {};
    const reconciled = {};
    let needsSync = false;
    Object.keys(expectedSlots).forEach(lvKey => {
        const lv = String(lvKey);
        const max = expectedSlots[lvKey];
        const prev = prevSlots[lv] || prevSlots[parseInt(lv)] || null;
        const prevUsed = prev && Number.isFinite(parseInt(prev.used)) ? Math.min(parseInt(prev.used), max) : 0;
        reconciled[lv] = { max, current: Math.max(0, max - prevUsed), used: prevUsed };
        if (!prev || parseInt(prev.max) !== max) needsSync = true;
    });
    Object.keys(prevSlots).forEach(lv => { if (!(lv in reconciled)) needsSync = true; });
    if (needsSync) {
        pg.slot_incantesimo = reconciled;
        schedaInstantSave(pgId, { slot_incantesimo: reconciled });
    }

    const slots = pg.slot_incantesimo || {};
    const levels = Object.keys(slots).map(Number).sort((a, b) => a - b);
    const slotsHtml = levels.length > 0 ? levels.map(lvl => {
        const s = slots[lvl];
        const pips = [];
        for (let i = 0; i < s.max; i++) {
            pips.push(`<span class="scheda-slot-pip ${i < s.current ? 'filled' : ''}" data-lvl="${lvl}" data-idx="${i}"></span>`);
        }
        return `
        <div class="scheda-slot-row">
            <span class="scheda-slot-level">Lv ${lvl}</span>
            <div class="scheda-slot-pips">${pips.join('')}</div>
            <span class="scheda-slot-count" id="sSlotCount_${lvl}">${s.current}/${s.max}</span>
        </div>`;
    }).join('') : '<p class="scheda-empty">Nessuno slot disponibile</p>';

    // Sezione "Slot magia innata" (solo se la razza fornisce incantesimi
    // innati con ricarica, esclusi i trucchetti / a volonta').
    const innateSlots = _pgRaceInnateSlots(pg);
    let innateSlotsBlock = '';
    if (innateSlots.length > 0) {
        const rows = innateSlots.map(is => {
            const lvlLabel = `Lv ${is.level_cast}`;
            const sub = is.recharge ? ` <small>(${is.recharge})</small>` : '';
            return `<div class="scheda-hd-row">
                <span class="scheda-hd-total">${escapeHtml(is.name)} <small class="scheda-innate-lvl">${lvlLabel}</small>${sub}</span>
                <div class="scheda-hd-avail">
                    <button class="scheda-hd-btn" onclick="schedaInnateSlotChange('${pg.id}','${is.key}',${is.current},-1,${is.max})">−</button>
                    <span class="scheda-hd-val" id="sInnSlot_${is.key}">${is.current}</span>
                    <span class="scheda-hd-max">/ ${is.max}</span>
                    <button class="scheda-hd-btn" onclick="schedaInnateSlotChange('${pg.id}','${is.key}',${is.current},1,${is.max})">+</button>
                </div>
            </div>`;
        }).join('');
        innateSlotsBlock = `
    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Slot magia innata</div>
        <div class="scheda-section-body">
            <div class="scheda-hd-list">${rows}</div>
        </div>
    </div>`;
    }

    // Slot invocazioni 1/lungo (Warlock).
    const invocationSlots = _pgInvocationSlots(pg);
    let invocationSlotsBlock = '';
    if (invocationSlots.length > 0) {
        // Sulla pagina incantesimi mostra solo gli "slot invocazione"
        // che corrispondono a un incantesimo (1/lungo). Le altre risorse
        // limitate (es. Cloak of Flies, Tomb of Levistus) sono trattate
        // come "risorse" e mostrate sulla pagina 1.
        const spellInvSlots = invocationSlots.filter(is => is.is_spell);
        if (spellInvSlots.length > 0) {
            const rows = spellInvSlots.map(is => {
                return `<div class="scheda-hd-row">
                    <span class="scheda-hd-total">${escapeHtml(is.name)} <small class="scheda-innate-lvl">${escapeHtml(is.level_label)}</small> <small>(${escapeHtml(is.recharge)})</small></span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaInvocationSlotChange('${pg.id}','${is.key}',${is.current},-1,${is.max})">−</button>
                        <span class="scheda-hd-val" id="sInvSlot_${is.key}">${is.current}</span>
                        <span class="scheda-hd-max">/ ${is.max}</span>
                        <button class="scheda-hd-btn" onclick="schedaInvocationSlotChange('${pg.id}','${is.key}',${is.current},1,${is.max})">+</button>
                    </div>
                </div>`;
            }).join('');
            invocationSlotsBlock = `
    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Slot invocazioni</div>
        <div class="scheda-section-body">
            <div class="scheda-hd-list">${rows}</div>
        </div>
    </div>`;
        }
    }

    const classeDisplay = classi.map(c => c.nome + (c.livello ? ' ' + c.livello : '')).join(' / ') || pg.classe || '';

    // Determina quali livelli mostrare:
    //   - trucchetti sempre,
    //   - ogni livello con slot,
    //   - ogni livello con almeno un incantesimo conosciuto,
    //   - tutti i livelli da 0 al massimo conoscibile per le classi del PG
    //     (fondamentale per il Warlock: ha solo slot di liv 5 ma conosce
    //     incantesimi 1-5, e con il Mystic Arcanum 6/7/8/9 a partire da lv 11).
    const ALL_DATA = _spellsData();
    const knownLevels = new Set();
    (pg.incantesimi_conosciuti || []).forEach(n => {
        const sp = _resolveSpell(n);
        if (sp) knownLevels.add(sp.level);
    });
    // Livelli con incantesimi razziali innati (devono apparire anche se la
    // classe del PG non darebbe accesso a quel livello).
    const innateLevels = new Set();
    _pgRaceInnateSpells(pg).forEach(s => {
        const sp = _resolveSpell(s.name) || _resolveSpell(s.name_en);
        if (sp) innateLevels.add(sp.level);
    });
    // Livelli con incantesimi auto-garantiti da sottoclasse (Domini,
    // Giuramenti, Patroni con lista espansa, ecc.).
    const subclassLevels = new Set();
    _pgSubclassGrantedSpells(pg).forEach(s => {
        const sp = _resolveSpell(s.name);
        if (sp) subclassLevels.add(sp.level);
    });
    // Livelli con incantesimi conferiti dalle invocazioni del Warlock.
    const invocationLevels = new Set();
    _pgInvocationGrantedSpells(pg).forEach(s => {
        const sp = _resolveSpell(s.name) || _resolveSpell(s.name_en);
        if (sp) invocationLevels.add(sp.level);
    });
    const maxKnowableLevel = _maxKnownSpellLevel(classi);
    const knowableLevels = [];
    for (let l = 0; l <= maxKnowableLevel; l++) knowableLevels.push(l);
    const levelsToShow = new Set([0, ...knowableLevels, ...levels, ...knownLevels, ...innateLevels, ...subclassLevels, ...invocationLevels]);
    // Mostra fino al massimo livello disponibile nel dataset
    const maxAvail = Math.max(0, ...Object.values(ALL_DATA).map(s => s.level));
    const orderedLevels = Array.from(levelsToShow)
        .filter(l => l <= maxAvail)
        .sort((a, b) => a - b);
    // Split per layout 2-colonne su tablet/desktop:
    //   colonna sinistra = trucchetti + livelli 1..4
    //   colonna destra   = livelli 5..9 (+ eventuali successivi)
    const leftLevels = orderedLevels.filter(l => l <= 4);
    const rightLevels = orderedLevels.filter(l => l > 4);
    const spellsLeftHtml = leftLevels.map(l => buildSpellLevelSection(pg, l)).join('');
    const spellsRightHtml = rightLevels.map(l => buildSpellLevelSection(pg, l)).join('');

    // Memorizza tab/personaggio corrente per il rerender al cambio lingua
    window._schedaCurrentPgId = pgId;
    window._schedaCurrentTab = 'incantesimi';

    content.innerHTML = `
    ${buildSchedaHeader(pg, 'Incantesimi')}
    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Statistiche Incantatore</div>
        <div class="scheda-section-body">${spellStatsHtml}${preparedBlock}</div>
    </div>
    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Slot Incantesimo</div>
        <div class="scheda-section-body">
        <div class="scheda-slots-table">${slotsHtml}</div>
        </div>
    </div>
    ${innateSlotsBlock}
    ${invocationSlotsBlock}

    <hr class="scheda-divider">

    <div class="scheda-spells-grid">
        <div class="scheda-spells-col scheda-spells-col-left">${spellsLeftHtml}</div>
        <div class="scheda-spells-col scheda-spells-col-right">${spellsRightHtml || ''}</div>
    </div>
    `;

    content.querySelectorAll('.scheda-slot-pip').forEach(pip => {
        pip.addEventListener('click', () => {
            const lvl = parseInt(pip.dataset.lvl);
            const idx = parseInt(pip.dataset.idx);
            schedaSlotToggleInline(pgId, lvl, idx);
        });
    });

    const backBtn = document.getElementById('schedaBackBtn');
    if (backBtn) backBtn.onclick = () => navigateToPage('personaggi');

    schedaSetActiveTab('incantesimi');
    schedaWireTabBar(pgId);
}

// Set di chiavi di sezioni "aperte" persistite tra i re-render della scheda.
// Usato per le sezioni che hanno data-section-key (es. tabelle custom di
// pagina 1) cosi' un'azione che ricostruisce il DOM non chiude la sezione.
window._schedaOpenSections = window._schedaOpenSections || new Set();
window._schedaClosedSections = window._schedaClosedSections || new Set();

window.schedaToggleSection = function(titleEl) {
    const section = titleEl.closest('.scheda-section');
    if (!section) return;
    section.classList.toggle('collapsed');
    const key = section.getAttribute('data-section-key');
    if (key) {
        const isCollapsed = section.classList.contains('collapsed');
        if (isCollapsed) {
            window._schedaOpenSections.delete(key);
            window._schedaClosedSections.add(key);
        } else {
            window._schedaOpenSections.add(key);
            window._schedaClosedSections.delete(key);
        }
    }
};

/* ── Bottone "Vai a Statistiche" (icona spada) ─────────────────────────
   - Visibile mentre si e' nella scheda di un PG (gestito in navigation.js).
   - Click: porta alla Pagina 1 e scrolla al divisore appena prima della sezione Statistiche.
   - Su Pagina 2/Inventario/Incantesimi: prima naviga a Pagina 1 e poi scrolla. */
function _scrollSchedaDividerIntoView() {
    const content = document.getElementById('schedaContent');
    if (!content) return;
    // Il primo divisore di Pagina 1 e' quello prima della sezione "Statistiche".
    const divider = content.querySelector('.scheda-divider');
    if (divider) {
        divider.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        // Fallback: scrolla in cima alla sezione Statistiche cercando per testo del titolo.
        const titles = content.querySelectorAll('.scheda-section-title');
        for (const t of titles) {
            if (t.textContent.trim().startsWith('Statistiche')) {
                t.closest('.scheda-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                break;
            }
        }
    }
}

window.schedaScrollToStats = function() {
    const pgId = window._schedaCurrentPgId || AppState.currentPersonaggioId;
    const tab = window._schedaCurrentTab;
    const tryScroll = () => {
        const content = document.getElementById('schedaContent');
        if (!content) return false;
        const target = content.querySelector('.scheda-divider')
                    || Array.from(content.querySelectorAll('.scheda-section-title'))
                            .find(t => t.textContent.trim().startsWith('Statistiche'));
        if (!target) return false;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
    };
    if (tab && tab !== 'scheda' && pgId) {
        // Naviga a Pagina 1 e attende che il divider/sezione "Statistiche"
        // appaia nel DOM (polling) prima di eseguire lo scroll. Questo
        // risolve il bug per cui il pulsante non funzionava da Inventario o
        // da altre tab perche' il render era ancora in corso.
        renderSchedaPersonaggio(pgId).then(() => {
            let tries = 0;
            const tick = () => {
                if (tryScroll() || tries++ > 25) return;
                setTimeout(tick, 60);
            };
            setTimeout(tick, 30);
        });
        return;
    }
    if (!tryScroll()) {
        // Fallback: se per qualche motivo non riusciamo a trovare il target,
        // proviamo dopo un breve delay.
        setTimeout(tryScroll, 80);
    }
};

window.schedaToggleSubsection = function(titleEl) {
    const sub = titleEl.closest('.scheda-subsection');
    if (sub) sub.classList.toggle('collapsed');
};

async function _schedaApplyResImmVulChange(pgId, kind, dmgType) {
    // kind: 'res' | 'imm' | 'vul'  – tre liste mutuamente esclusive sul singolo dmgType.
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!pg) return;
    let res = Array.isArray(pg.resistenze) ? [...pg.resistenze] : [];
    let imm = Array.isArray(pg.immunita) ? [...pg.immunita] : [];
    let vul = Array.isArray(pg.vulnerabilita) ? [...pg.vulnerabilita] : [];
    const isOn = (kind === 'res' && res.includes(dmgType))
              || (kind === 'imm' && imm.includes(dmgType))
              || (kind === 'vul' && vul.includes(dmgType));
    res = res.filter(x => x !== dmgType);
    imm = imm.filter(x => x !== dmgType);
    vul = vul.filter(x => x !== dmgType);
    if (!isOn) {
        if (kind === 'res') res.push(dmgType);
        else if (kind === 'imm') imm.push(dmgType);
        else if (kind === 'vul') vul.push(dmgType);
    }
    pg.resistenze = res;
    pg.immunita = imm;
    pg.vulnerabilita = vul;
    _refreshResImmInlineRow(dmgType);
    if (!supabase) return;
    // Salva tutto insieme; se la colonna 'vulnerabilita' non esiste ancora a DB, fallback senza di essa.
    const { error } = await supabase.from('personaggi')
        .update({ resistenze: res, immunita: imm, vulnerabilita: vul }).eq('id', pgId);
    if (error && /vulnerabilita/i.test(error.message || '')) {
        await supabase.from('personaggi').update({ resistenze: res, immunita: imm }).eq('id', pgId);
        console.warn('[scheda] Colonna "vulnerabilita" mancante a DB: esegui sql/add-vulnerabilita.sql');
    }
}

window.schedaToggleResInline = function(pgId, dmgType) { return _schedaApplyResImmVulChange(pgId, 'res', dmgType); };
window.schedaToggleImmInline = function(pgId, dmgType) { return _schedaApplyResImmVulChange(pgId, 'imm', dmgType); };
window.schedaToggleVulInline = function(pgId, dmgType) { return _schedaApplyResImmVulChange(pgId, 'vul', dmgType); };

function _refreshResImmInlineRow(dmgType) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const isRes = (pg.resistenze || []).includes(dmgType);
    const isImm = (pg.immunita || []).includes(dmgType);
    const isVul = (pg.vulnerabilita || []).includes(dmgType);
    const row = document.getElementById('sResImmRow_' + dmgType);
    if (row) {
        const r = row.querySelector('.scheda-resimm-marker.res');
        const i = row.querySelector('.scheda-resimm-marker.imm');
        const v = row.querySelector('.scheda-resimm-marker.vul');
        if (r) r.classList.toggle('active', isRes);
        if (i) i.classList.toggle('active', isImm);
        if (v) v.classList.toggle('active', isVul);
    }
    const badge = document.getElementById('sResImmCount');
    if (badge) {
        const tot = (pg.resistenze || []).length + (pg.immunita || []).length + (pg.vulnerabilita || []).length;
        badge.textContent = tot > 0 ? tot : '';
    }
}

/* ── Header scheda condiviso (foto a sx, identità a sx, level-up + ispirazione a dx) ── */
function buildSchedaHeader(pg, pageLabel) {
    if (!pg) return '';
    const initials = (pg.nome || '?').trim().split(/\s+/).slice(0, 2).map(s => s.charAt(0).toUpperCase()).join('') || '?';
    const rawUrl = pg.immagine_url || '';
    // Normalizza on-the-fly: copre eventuali URL Drive salvati prima
    // dell'introduzione del normalizzatore (es. link "/file/d/.../view"
    // che il browser non puo' embeddare).
    const imgUrl = rawUrl ? (typeof _normalizeImageUrl === 'function' ? _normalizeImageUrl(rawUrl) : rawUrl) : '';
    const avatarInner = imgUrl
        ? `<img src="${escapeAttr(imgUrl)}" alt="${escapeAttr(pg.nome || '')}" class="scheda-avatar-img" referrerpolicy="no-referrer" loading="lazy">`
        : `<span class="scheda-avatar-initials">${escapeHtml(initials)}</span>`;
    const subtitle = (() => {
        if (pageLabel) return escapeHtml(pageLabel);
        if (pg.classi && pg.classi.length > 0) {
            return pg.classi.map(c => `${escapeHtml(c.nome)} ${parseInt(c.livello) || 1}`).join(' / ');
        }
        return escapeHtml(pg.classe || '');
    })();
    const subtitleSm = pageLabel ? '' : escapeHtml(pg.razza || '');
    const hasClasses = pg.classi && pg.classi.length > 0;
    const levelUpBtn = hasClasses
        ? `<button class="scheda-levelup-top" onclick="schedaLevelUp('${pg.id}')" title="Level up">▲ Level Up</button>`
        : '';
    const ispVal = pg.ispirazione || 0;
    const ispBox = `<div class="scheda-isp-box" title="Ispirazione">
        <button class="scheda-isp-btn" onclick="schedaIspChange('${pg.id}',-1)" aria-label="Diminuisci ispirazione">−</button>
        <div class="scheda-isp-display"><span class="scheda-isp-star" aria-hidden="true">★</span><span id="sIsp">${ispVal}</span></div>
        <button class="scheda-isp-btn" onclick="schedaIspChange('${pg.id}',1)" aria-label="Aumenta ispirazione">+</button>
    </div>`;
    return `
    <div class="scheda-identity">
        <button type="button" class="scheda-avatar" onclick="schedaEditAvatar('${pg.id}')" title="Cambia immagine">
            ${avatarInner}
        </button>
        <div class="scheda-identity-info">
            <div class="scheda-name">${escapeHtml(pg.nome || '')}</div>
            <div class="scheda-subtitle">${subtitle}</div>
            ${subtitleSm ? `<div class="scheda-subtitle-sm">${subtitleSm}</div>` : ''}
        </div>
        <div class="scheda-identity-actions">
            ${levelUpBtn}
            ${ispBox}
        </div>
    </div>`;
}

// Estrae il file ID da un URL Google Drive in qualsiasi formato comune
// (sharing link, open link, uc?id=, ecc) e lo restituisce, o null se
// non e' un URL Drive riconosciuto.
function _extractGoogleDriveFileId(url) {
    if (!url || typeof url !== 'string') return null;
    const u = url.trim();
    // /file/d/<ID>/...
    let m = u.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
    if (m) return m[1];
    // /document/d/<ID>/...  /presentation/d/<ID>/...
    m = u.match(/\/(?:document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]{20,})/);
    if (m) return m[1];
    // ?id=<ID> o &id=<ID>
    m = u.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
    if (m) return m[1];
    // /d/<ID>  (lh3.googleusercontent.com/d/<ID>)
    m = u.match(/\/d\/([a-zA-Z0-9_-]{20,})(?:\b|$)/);
    if (m) return m[1];
    return null;
}

// Trasforma un URL di Google Drive in uno utilizzabile direttamente
// dentro <img>. Drive non serve direttamente i contenuti dei link
// /file/d/.../view (richiedono OAuth e mostrano una pagina HTML invece
// dell'immagine), quindi convertiamo nel formato googleusercontent /d/
// che e' embeddable senza autenticazione (funziona finche' il file e'
// condiviso "chiunque con il link puo' visualizzare").
// Ritorna l'URL originale se non e' Google Drive.
function _normalizeImageUrl(url) {
    if (!url) return url;
    const id = _extractGoogleDriveFileId(url);
    if (!id) return url.trim();
    // googleusercontent /d/ accetta opzionalmente un suffisso di
    // dimensione (=w800-h800 ecc.); senza suffisso restituisce
    // l'immagine alla risoluzione di default, sufficiente per un avatar.
    return `https://lh3.googleusercontent.com/d/${id}=w1024`;
}
window._normalizeImageUrl = _normalizeImageUrl;

window.schedaEditAvatar = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const current = pg.immagine_url || '';
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay scheda-avatar-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal scheda-avatar-modal">
            <button class="modal-close" type="button" aria-label="Chiudi">&times;</button>
            <h2 class="scheda-avatar-title">Immagine del personaggio</h2>
            <div class="scheda-avatar-preview" id="schedaAvatarPreview">
                ${current
                    ? `<img src="${escapeAttr(current)}" alt="Anteprima" id="schedaAvatarPreviewImg">`
                    : `<span class="scheda-avatar-preview-placeholder">Nessuna immagine</span>`}
            </div>
            <label class="scheda-avatar-label">URL immagine</label>
            <input type="url" id="schedaAvatarInput" class="scheda-avatar-input"
                placeholder="https://… (oppure incolla un link Google Drive)"
                value="${escapeAttr(current)}">
            <div class="scheda-avatar-hint">
                <strong>Google Drive:</strong> assicurati che il file sia condiviso
                con "<em>Chiunque abbia il link</em>". Incolla qui il link di
                condivisione: viene convertito automaticamente in un URL
                utilizzabile dall'app.
            </div>
            <div class="scheda-avatar-actions">
                <button type="button" class="btn-secondary" id="schedaAvatarRemove">Rimuovi</button>
                <button type="button" class="btn-secondary" id="schedaAvatarCancel">Annulla</button>
                <button type="button" class="btn-primary" id="schedaAvatarSave">Salva</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#schedaAvatarInput');
    const previewBox = overlay.querySelector('#schedaAvatarPreview');
    const close = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.querySelector('#schedaAvatarCancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    const refreshPreview = () => {
        const raw = (input.value || '').trim();
        if (!raw) {
            previewBox.innerHTML = `<span class="scheda-avatar-preview-placeholder">Nessuna immagine</span>`;
            return;
        }
        const normalized = _normalizeImageUrl(raw);
        previewBox.innerHTML = `<img src="${escapeAttr(normalized)}" alt="Anteprima" id="schedaAvatarPreviewImg">`;
        const img = previewBox.querySelector('img');
        img.addEventListener('error', () => {
            previewBox.innerHTML = `<span class="scheda-avatar-preview-placeholder scheda-avatar-preview-error">Impossibile caricare l'immagine.<br><small>Controlla l'URL o le autorizzazioni di condivisione.</small></span>`;
        });
    };
    input.addEventListener('input', () => {
        clearTimeout(input._t);
        input._t = setTimeout(refreshPreview, 350);
    });

    overlay.querySelector('#schedaAvatarRemove').addEventListener('click', async () => {
        await _schedaPersistAvatar(pgId, null);
        close();
    });
    overlay.querySelector('#schedaAvatarSave').addEventListener('click', async () => {
        const raw = (input.value || '').trim();
        const normalized = raw ? _normalizeImageUrl(raw) : null;
        await _schedaPersistAvatar(pgId, normalized);
        close();
    });

    setTimeout(() => input.focus(), 50);
};

async function _schedaPersistAvatar(pgId, urlOrNull) {
    const pg = _schedaPgCache;
    if (!pg) return;
    pg.immagine_url = urlOrNull;
    const supabase = getSupabaseClient();
    if (supabase) {
        const { error } = await supabase.from('personaggi').update({ immagine_url: urlOrNull }).eq('id', pgId);
        if (error) {
            console.warn('Salvataggio immagine fallito:', error.message);
            showNotification && showNotification('Impossibile salvare l\'immagine (manca colonna immagine_url?)');
        }
    }
    const tab = window._schedaCurrentTab;
    if (tab === 'incantesimi') schedaOpenSpellPage(pgId);
    else if (tab === 'inventario') schedaOpenInventoryPage(pgId);
    else if (tab === 'privilegi') schedaOpenPrivilegesPage(pgId);
    else renderSchedaPersonaggio(pgId);
}

/* ── Spells / Trucchetti ── */
// Restituisce SOLO gli incantesimi del catalogo "ufficiale" (file js/data/spells.js).
function _spellsDataNative() { return window.SPELLS_DATA || {}; }

// Adatta una riga di homebrew_incantesimi al formato usato dal picker
// (chiavi: name, name_en, school, school_it, casting_time, range,
//  components, duration, description, classes, source, ...).
function _hbSpellToCatalog(hb) {
    const schoolIt = hb.scuola || '';
    const schoolKey = (schoolIt || '').toLowerCase().trim();
    // Per le scuole canoniche IT, mappo alla key EN cosi' i filtri standard
    // funzionano correttamente; per le homebrew lascio la stringa lower.
    const schoolEn = _SPELL_SCHOOL_IT_TO_EN[schoolKey] || schoolKey;
    const sourceLabel = hb._author_name ? `Homebrew · ${hb._author_name}` : 'Homebrew';
    return {
        // Chiave logica univoca per il picker (non confligge con quelle native)
        _hb_id: hb.id,
        _is_homebrew: true,
        _author_uid: hb._author_uid,
        _author_name: hb._author_name,
        _is_own: hb._is_own,
        name: hb.nome || '',
        name_en: hb.nome || '',
        level: typeof hb.livello === 'number' ? hb.livello : 0,
        school: schoolEn,
        school_it: schoolIt,
        casting_time: hb.tempo_lancio || '',
        casting_time_en: hb.tempo_lancio || '',
        range: hb.gittata || '',
        range_en: hb.gittata || '',
        components: hb.componenti || '',
        components_en: hb.componenti || '',
        duration: hb.durata || '',
        duration_en: hb.durata || '',
        description: hb.descrizione || '',
        description_en: hb.descrizione || '',
        classes: [],
        classes_en: [],
        source: sourceLabel,
        ritual: false,
    };
}

// Pool completo: nativi + homebrew abilitati. Indicizzato per nome IT
// (chiave usata altrove) e per chiave _hb_id se presente.
function _spellsData() {
    const base = window.SPELLS_DATA || {};
    const hbList = (window.AppState?.cachedHomebrewIncantesimi) || [];
    if (!hbList.length) return base;
    const merged = { ...base };
    hbList.forEach(hb => {
        const sp = _hbSpellToCatalog(hb);
        // Evito di sovrascrivere uno spell ufficiale con stesso nome.
        const key = sp.name && !merged[sp.name] ? sp.name : `__hb_${hb.id}`;
        merged[key] = sp;
    });
    return merged;
}

/** Lingua corrente per i contenuti tradotti (incantesimi/privilegi): 'it' | 'en'.
 *  Centralizzata: leggi sempre da window.getAppLang() (impostazione globale dell'app). */
function _spellLang() {
    try { return (typeof getAppLang === 'function' ? getAppLang() : 'it'); }
    catch { return 'it'; }
}

/** Estrae il campo localizzato di un incantesimo, con fallback all'altra lingua. */
function _spellField(sp, key) {
    if (!sp) return '';
    const lang = _spellLang();
    if (lang === 'en') {
        switch (key) {
            case 'name': return sp.name_en || sp.name || '';
            case 'school': return (sp.school || '').replace(/^./, c => c.toUpperCase());
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

function _pgSpellClasses(pg) {
    const out = new Set();
    (pg.classi || []).forEach(c => { if (c?.nome) out.add(c.nome); });
    if (pg.classe) out.add(pg.classe);
    return out;
}

function _spellMatchesPg(spell, pgClasses) {
    if (!pgClasses.size) return true;
    // Confronta sia con classes IT che EN per matching robusto
    const lists = [spell.classes || [], spell.classes_en || []];
    for (const list of lists) {
        for (const c of list) if (pgClasses.has(c)) return true;
    }
    return false;
}

/**
 * Risolve un nome incantesimo (italiano corrente, vecchio italiano o inglese)
 * nei dati dell'incantesimo. Supporta backward compatibility per eventuali
 * record salvati nel DB con nomi obsoleti.
 */
function _resolveSpell(name) {
    if (!name) return null;
    const all = _spellsData();
    if (all[name]) return all[name];
    // Fallback: scorri tutti gli spell e confronta con name_en o legacy_names_it
    for (const k of Object.keys(all)) {
        const sp = all[k];
        if (sp.name_en === name) return sp;
        if (Array.isArray(sp.aliases) && sp.aliases.includes(name)) return sp;
    }
    return null;
}

const SPELL_LEVEL_LABELS = {
    0: 'Trucchetti',
    1: 'Incantesimi di Livello 1',
    2: 'Incantesimi di Livello 2',
    3: 'Incantesimi di Livello 3',
    4: 'Incantesimi di Livello 4',
    5: 'Incantesimi di Livello 5',
    6: 'Incantesimi di Livello 6',
    7: 'Incantesimi di Livello 7',
    8: 'Incantesimi di Livello 8',
    9: 'Incantesimi di Livello 9'
};

function _spellIsConcentration(sp) {
    if (!sp) return false;
    const d = String(sp.duration || sp.duration_en || '').toLowerCase();
    return d.includes('concentr');
}

function _spellConcMark(sp) {
    return _spellIsConcentration(sp)
        ? '<span class="spell-card-conc" title="Richiede concentrazione">C</span>'
        : '';
}

// Toggle "preparato" per le spell card. Visibile solo per le classi
// che usano la preparazione e per gli incantesimi conosciuti di livello >= 1
// (i trucchetti e gli incantesimi razziali/sottoclasse/invocazione sono
// sempre attivi).
function _spellPrepToggle(pg, sp) {
    if (!sp || sp.level === 0) return '';
    if (!_pgUsesPreparedSystem(pg)) return '';
    const prepared = _spellIsPrepared(pg, sp.name, sp.level);
    const cls = prepared ? 'is-prepared' : '';
    const tip = prepared ? 'Preparato (clicca per smarcare)' : 'Non preparato (clicca per preparare)';
    const safeName = escapeAttr(sp.name);
    return `<button type="button" class="spell-card-prep-btn ${cls}"
        onclick="event.stopPropagation();schedaTogglePrepared('${pg.id}','${safeName}')"
        title="${tip}" aria-label="${tip}"></button>`;
}

function buildSpellLevelSection(pg, level) {
    const known = (pg.incantesimi_conosciuti || [])
        .map(n => ({ raw: n, sp: _resolveSpell(n) }))
        .filter(x => x.sp && x.sp.level === level);
    const knownNames = new Set(known.map(x => x.sp.name));

    // Incantesimi razziali innati per questo livello, deduplicati e non
    // sovrapposti agli "incantesimi conosciuti" (in tal caso prevale
    // l'entry razziale che e' read-only).
    const innate = _pgRaceInnateSpells(pg)
        .map(s => ({ src: s, sp: _resolveSpell(s.name) || _resolveSpell(s.name_en) }))
        .filter(x => x.sp && x.sp.level === level);
    const seenInnate = new Set();
    const innateUnique = [];
    innate.forEach(x => {
        const key = x.sp.name;
        if (seenInnate.has(key)) return;
        seenInnate.add(key);
        innateUnique.push(x);
    });

    // Incantesimi auto-garantiti da sottoclasse (Dominio Vita, Giuramento
    // di Devozione, Patrono Demonio, ecc.). Anche questi sono "locked":
    // non si possono rimuovere dal picker ma compaiono in lista come carte
    // con tag della sottoclasse.
    const subclassGranted = _pgSubclassGrantedSpells(pg)
        .map(g => ({ src: g, sp: _resolveSpell(g.name) }))
        .filter(x => x.sp && x.sp.level === level);
    const seenSubclass = new Set();
    const subclassUnique = [];
    subclassGranted.forEach(x => {
        const key = x.sp.name;
        if (seenInnate.has(key)) return; // razza ha priorita'
        if (seenSubclass.has(key)) return;
        seenSubclass.add(key);
        subclassUnique.push(x);
    });

    // Incantesimi conferiti dalle invocazioni del Warlock (a volonta' o
    // 1/lungo). Anche questi sono "locked" (derivati dalla scelta delle
    // invocazioni nella pagina dei privilegi).
    const invocationGranted = _pgInvocationGrantedSpells(pg)
        .map(g => ({ src: g, sp: _resolveSpell(g.name) || _resolveSpell(g.name_en) }))
        .filter(x => x.sp && x.sp.level === level);
    const seenInvocation = new Set();
    const invocationUnique = [];
    invocationGranted.forEach(x => {
        const key = x.sp.name;
        if (seenInnate.has(key) || seenSubclass.has(key)) return;
        if (seenInvocation.has(key)) return;
        seenInvocation.add(key);
        invocationUnique.push(x);
    });

    const knownCards = known
        .filter(({ sp }) => !seenInnate.has(sp.name) && !seenSubclass.has(sp.name) && !seenInvocation.has(sp.name))
        .map(({ sp }) => {
            const id = sp.name;
            const prepared = _spellIsPrepared(pg, sp.name, sp.level);
            const prepCls = (sp.level > 0 && _pgUsesPreparedSystem(pg) && !prepared) ? 'spell-card-unprepared' : '';
            return `<div class="spell-card ${prepCls}" onclick="schedaShowSpellDetail('${escapeAttr(id)}')">
                <div class="spell-card-name">${_spellPrepToggle(pg, sp)}${escapeHtml(_spellField(sp, 'name'))}${_spellConcMark(sp)}</div>
                <div class="spell-card-meta">${escapeHtml(_spellField(sp, 'school'))} · ${escapeHtml(_spellField(sp, 'casting_time'))} · ${escapeHtml(_spellField(sp, 'range'))}</div>
            </div>`;
        }).join('');

    const innateCards = innateUnique.map(({ src, sp }) => {
        const id = sp.name;
        const tag = src.recharge === 'at_will' ? 'a volontà' : (sp.level === 0 ? 'razza' : `razza · ${src.ability}`);
        return `<div class="spell-card spell-card-innate" onclick="schedaShowSpellDetail('${escapeAttr(id)}')">
            <div class="spell-card-name">${escapeHtml(_spellField(sp, 'name'))}${_spellConcMark(sp)} <span class="spell-card-tag">${escapeHtml(tag)}</span></div>
            <div class="spell-card-meta">${escapeHtml(_spellField(sp, 'school'))} · ${escapeHtml(_spellField(sp, 'casting_time'))} · ${escapeHtml(_spellField(sp, 'range'))}</div>
        </div>`;
    }).join('');

    const subclassCards = subclassUnique.map(({ src, sp }) => {
        const id = sp.name;
        const label = src.source_label || 'sottoclasse';
        return `<div class="spell-card spell-card-subclass" onclick="schedaShowSpellDetail('${escapeAttr(id)}')">
            <div class="spell-card-name">${escapeHtml(_spellField(sp, 'name'))}${_spellConcMark(sp)} <span class="spell-card-tag spell-card-tag-subclass" title="Garantito da: ${escapeHtml(label)}">${escapeHtml(label)}</span></div>
            <div class="spell-card-meta">${escapeHtml(_spellField(sp, 'school'))} · ${escapeHtml(_spellField(sp, 'casting_time'))} · ${escapeHtml(_spellField(sp, 'range'))}</div>
        </div>`;
    }).join('');

    const invocationCards = invocationUnique.map(({ src, sp }) => {
        const id = sp.name;
        const tag = src.recharge === 'at_will' ? 'invocazione · a volontà' : 'invocazione · 1/lungo';
        return `<div class="spell-card spell-card-invocation" onclick="schedaShowSpellDetail('${escapeAttr(id)}')">
            <div class="spell-card-name">${escapeHtml(_spellField(sp, 'name'))}${_spellConcMark(sp)} <span class="spell-card-tag spell-card-tag-invocation" title="Conferito da: ${escapeHtml(src.invocation_name)}">${escapeHtml(tag)}</span></div>
            <div class="spell-card-meta">${escapeHtml(_spellField(sp, 'school'))} · ${escapeHtml(_spellField(sp, 'casting_time'))} · ${escapeHtml(_spellField(sp, 'range'))}</div>
        </div>`;
    }).join('');

    const cardsHtml = (knownCards + innateCards + subclassCards + invocationCards) || `<span class="scheda-empty">Nessun ${level === 0 ? 'trucchetto' : 'incantesimo'} scelto</span>`;

    const label = SPELL_LEVEL_LABELS[level] || `Livello ${level}`;
    const title = level === 0 ? 'Scegli trucchetti' : `Scegli incantesimi di livello ${level}`;
    return `<div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">
            ${escapeHtml(label)}
            <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenSpellPicker('${pg.id}', ${level})" title="${title}">&#9998;</button>
        </div>
        <div class="scheda-section-body">
            <div class="spell-cards-grid">${cardsHtml}</div>
        </div>
    </div>`;
}

// Backward compat (mantiene il nome storico)
function buildCantripsSection(pg) { return buildSpellLevelSection(pg, 0); }

function escapeAttr(s) { return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

window.schedaShowSpellDetail = function(spellName) {
    const sp = _resolveSpell(spellName);
    if (!sp) return;
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.dataset.spellId = sp.name;
    const renderBody = () => {
        const lang = _spellLang();
        const lvlText = sp.level === 0
            ? (lang === 'en' ? 'Cantrip' : 'Trucchetto')
            : (lang === 'en' ? `Level ${sp.level}` : `Livello ${sp.level}`);
        const lbl = lang === 'en'
            ? { time: 'Casting Time', range: 'Range', comp: 'Components', dur: 'Duration' }
            : { time: 'Tempo', range: 'Gittata', comp: 'Componenti', dur: 'Durata' };
        return `<div class="hp-calc-modal spell-detail-modal">
            <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h3 class="spell-detail-name">${escapeHtml(_spellField(sp, 'name'))}</h3>
            <div class="spell-detail-sub">${lvlText} · ${escapeHtml(_spellField(sp, 'school'))}</div>
            <div class="spell-detail-meta">
                <div><span class="spell-meta-label">${lbl.time}</span><span>${escapeHtml(_spellField(sp, 'casting_time'))}</span></div>
                <div><span class="spell-meta-label">${lbl.range}</span><span>${escapeHtml(_spellField(sp, 'range'))}</span></div>
                <div><span class="spell-meta-label">${lbl.comp}</span><span>${escapeHtml(_spellField(sp, 'components'))}</span></div>
                <div><span class="spell-meta-label">${lbl.dur}</span><span>${escapeHtml(_spellField(sp, 'duration'))}</span></div>
            </div>
            <div class="spell-detail-desc">${window.formatRichText(_spellField(sp, 'description'))}</div>
            <div class="spell-detail-classes">${(_spellField(sp, 'classes') || []).map(c => `<span class="scheda-tag">${escapeHtml(c)}</span>`).join('')}</div>
            ${sp.source ? `<div class="spell-detail-source">${escapeHtml(sp.source)}</div>` : ''}
        </div>`;
    };
    overlay.innerHTML = renderBody();
    overlay._rerender = () => { overlay.innerHTML = renderBody(); };
    document.body.appendChild(overlay);
};

// Re-render automatico della pagina corrente quando l'utente cambia la lingua
// dell'app dalle Impostazioni (evento globale `appLangChanged`).
document.addEventListener('appLangChanged', () => {
    // Rerenderizza eventuali overlay di dettaglio incantesimo aperti.
    document.querySelectorAll('.hp-calc-overlay').forEach(ov => {
        if (typeof ov._rerender === 'function') ov._rerender();
    });
    // Rerenderizza la tab corrente della scheda personaggio se rilevante.
    const pgId = window._schedaCurrentPgId;
    if (typeof pgId !== 'string') return;
    const tab = window._schedaCurrentTab;
    if (tab === 'incantesimi' && typeof schedaOpenSpellPage === 'function') {
        schedaOpenSpellPage(pgId);
    } else if (tab === 'privilegi' && typeof schedaOpenPrivilegesPage === 'function') {
        schedaOpenPrivilegesPage(pgId);
    }
});

// ── Helper per filtri spell picker ──────────────────────────────────
// Mappa nomi italiani delle 8 scuole canoniche → chiave EN usata dai filtri.
// Usata sia per gli incantesimi homebrew (che salvano la scuola in IT) sia
// come fallback quando un dataset vecchio ha solo school_it.
const _SPELL_SCHOOL_IT_TO_EN = {
    'abiurazione': 'abjuration',
    'evocazione': 'conjuration',
    'divinazione': 'divination',
    'ammaliamento': 'enchantment',
    'invocazione': 'evocation',
    'illusione': 'illusion',
    'necromanzia': 'necromancy',
    'trasmutazione': 'transmutation',
};
function _spellSchoolKey(sp) {
    const raw = (sp.school || sp.school_it || '').toLowerCase().trim();
    if (!raw) return '';
    if (_SPELL_SCHOOL_IT_TO_EN[raw]) return _SPELL_SCHOOL_IT_TO_EN[raw];
    return raw;
}
function _spellHasComponent(sp, c) {
    const txt = (sp.components || sp.components_en || '').toUpperCase();
    // Componenti separate da virgola: estraggo i token prima di parentesi e match esatti
    const tokens = txt.replace(/\(.*?\)/g, '').split(/[,\s]+/).filter(Boolean);
    return tokens.includes(c);
}
function _spellIsConcentration(sp) {
    const d = (sp.duration || sp.duration_en || '').toLowerCase();
    return d.startsWith('concentr');
}
function _spellIsRitual(sp) {
    if (sp.ritual === true) return true;
    const ct = (sp.casting_time || sp.casting_time_en || '').toLowerCase();
    return /\(\s*rit/.test(ct) || /ritual/.test(ct);
}
function _spellSourceShort(sp) {
    const src = sp.source || '';
    if (!src) return '';
    // Match abbreviazioni TRA PARENTESI QUADRE/TONDE PRIMA dei pattern testuali,
    // cosi' fonti tipo "Bard [TCoE]", "Wizard [TCoE]" finiscono in TCoE e non in "Bard".
    const bracket = src.match(/[\[(]\s*([A-Za-z+]{2,8})\s*[\])]/);
    if (bracket) {
        const code = bracket[1].toUpperCase();
        if (code === 'PHB' || code === 'BR+' || code === 'SRD') return 'PHB';
        if (code === 'XGTE') return 'XGtE';
        if (code === 'TCOE') return 'TCoE';
        if (code === 'SCAG') return 'SCAG';
        if (code === 'EBR' || code === 'ERLW') return 'EBR';
        if (code === 'MMM' || code === 'MOTM') return 'MMM';
        if (code === 'SCC') return 'SCC';
        if (code === 'BGG' || code === 'GOTG') return 'BGG';
    }
    if (/Player.{0,3}s Handbook/i.test(src)) return 'PHB';
    if (/Xanathar/i.test(src)) return 'XGtE';
    if (/Tasha|TCoE/i.test(src)) return 'TCoE';
    if (/Sword Coast/i.test(src)) return 'SCAG';
    if (/Eberron/i.test(src)) return 'EBR';
    if (/Mordenkainen.*Multiverse/i.test(src)) return 'MMM';
    if (/Strixhaven/i.test(src)) return 'SCC';
    if (/Bigby|Glory of (the )?Giants/i.test(src)) return 'BGG';
    // Fallback: niente abbreviazioni "improvvisate" - meglio "Altro" che un nome di classe scambiato per manuale.
    return 'Altro';
}
function _normCastingTime(ct) {
    const t = (ct || '').toLowerCase();
    if (/azione bonus/.test(t)) return 'Azione Bonus';
    if (/reazione/.test(t)) return 'Reazione';
    if (/^1 azione/.test(t)) return 'Azione';
    if (/minut/.test(t)) return 'Minuti';
    if (/\bor[ae]\b/.test(t)) return 'Ore';
    return 'Altro';
}
const _SPELL_SCHOOLS = [
    ['abjuration','Abiurazione'],['conjuration','Evocazione'],['divination','Divinazione'],
    ['enchantment','Ammaliamento'],['evocation','Invocazione'],['illusion','Illusione'],
    ['necromancy','Necromanzia'],['transmutation','Trasmutazione']
];
const _SPELL_CASTING_TIMES = ['Azione','Azione Bonus','Reazione','Minuti','Ore','Altro'];
const _SPELL_SOURCES_KNOWN = ['PHB','XGtE','TCoE','SCAG','EBR','MMM','SCC'];

function _defaultSpellFilters(_pg) {
    return {
        schools: [],            // array di chiavi school (es. 'evocation'); vuoto = tutte
        castingTimes: [],       // 'Azione','Azione Bonus','Reazione','Minuti','Ore','Altro'
        components: [],         // ['V','S','M']
        concentration: 'any',   // 'any' | 'yes' | 'no'
        ritual: 'any',          // 'any' | 'yes' | 'no'
        classes: [],            // vuoto = tutte (per visualizzare tutti gli spell)
        sources: []             // codici source (vuoto = tutti)
    };
}

function _applySpellPickerFilters(spell, f) {
    if (!f) return true;
    // Scuola
    if (f.schools && f.schools.length > 0) {
        if (!f.schools.includes(_spellSchoolKey(spell))) return false;
    }
    // Casting time
    if (f.castingTimes && f.castingTimes.length > 0) {
        if (!f.castingTimes.includes(_normCastingTime(spell.casting_time || spell.casting_time_en))) return false;
    }
    // Componenti (richiesti tutti i selezionati)
    if (f.components && f.components.length > 0) {
        for (const c of f.components) if (!_spellHasComponent(spell, c)) return false;
    }
    // Concentrazione
    if (f.concentration === 'yes' && !_spellIsConcentration(spell)) return false;
    if (f.concentration === 'no' && _spellIsConcentration(spell)) return false;
    // Rituale
    if (f.ritual === 'yes' && !_spellIsRitual(spell)) return false;
    if (f.ritual === 'no' && _spellIsRitual(spell)) return false;
    // Classi — vuoto = nessun filtro (tutte le classi). Gli homebrew vivono
    // nel loro tab dedicato e non hanno classi associate, quindi bypassano.
    if (f.classes && f.classes.length > 0 && !spell._is_homebrew) {
        const lists = [spell.classes || [], spell.classes_en || []];
        let ok = false;
        outer: for (const list of lists) for (const c of list) if (f.classes.includes(c)) { ok = true; break outer; }
        if (!ok) return false;
    }
    // Manuale (source)
    if (f.sources && f.sources.length > 0) {
        if (!f.sources.includes(_spellSourceShort(spell))) return false;
    }
    return true;
}

window.schedaOpenSpellPicker = function(pgId, level) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const all = _spellsData();
    // Conserva l'unione di tutti i conosciuti (di ogni livello), normalizzati a nome IT
    const knownAll = new Set((pg.incantesimi_conosciuti || []).map(n => {
        const sp = _resolveSpell(n);
        return sp ? sp.name : n;
    }));

    const lang = _spellLang();
    // Lista nativa (esclude gli homebrew, che vivono nel tab dedicato).
    const list = Object.values(all)
        .filter(s => s.level === level && !s._is_homebrew);
    list.sort((a, b) => _spellField(a, 'name').localeCompare(_spellField(b, 'name'), lang));

    // Lista homebrew separata
    const hbCache = (window.AppState?.cachedHomebrewIncantesimi) || [];
    const hbList = hbCache
        .map(_hbSpellToCatalog)
        .filter(s => s.level === level);
    hbList.sort((a, b) => _spellField(a, 'name').localeCompare(_spellField(b, 'name'), lang));
    const hasHomebrewTab = hbList.length > 0;

    window._spellPickerFilters = _defaultSpellFilters(pg);
    window._spellPickerSearchQ = '';
    window._spellPickerTab = 'catalog'; // 'catalog' | 'homebrew'
    window._spellPickerLists = { catalog: list, homebrew: hbList };
    // Stato selezioni: persiste fra cambi tab (le checkbox nel tab non
    // attivo non sono nel DOM, quindi serve un set lato JS).
    window._spellPickerSelected = new Set(knownAll);

    // Mappa incantesimi auto-garantiti (sottoclasse o invocazioni warlock):
    // selected + disabled nel picker, con badge "garantito".
    const grantedByName = new Map();
    _pgSubclassGrantedSpells(pg).forEach(g => {
        const sp = _resolveSpell(g.name);
        if (sp) grantedByName.set(sp.name, g.source_label || 'sottoclasse');
    });
    _pgInvocationGrantedSpells(pg).forEach(g => {
        const sp = _resolveSpell(g.name) || _resolveSpell(g.name_en);
        if (sp && !grantedByName.has(sp.name)) {
            grantedByName.set(sp.name, `invocazione: ${g.invocation_name}`);
        }
    });

    const renderRow = (sp) => {
        const id = sp.name;
        const isKnown = (window._spellPickerSelected || knownAll).has(id);
        const grantedLabel = grantedByName.get(id);
        const isGranted = !!grantedLabel;
        const safeId = escapeAttr(id);
        const tags = [];
        if (_spellIsConcentration(sp)) tags.push('<span class="spell-pick-tag spell-pick-tag-c" title="Concentrazione">C</span>');
        if (_spellIsRitual(sp)) tags.push('<span class="spell-pick-tag spell-pick-tag-r" title="Rituale">R</span>');
        if (isGranted) tags.push(`<span class="spell-pick-tag spell-pick-tag-granted" title="Garantito da: ${escapeHtml(grantedLabel)}">${escapeHtml(grantedLabel)}</span>`);
        if (sp._is_homebrew) {
            const author = sp._author_name ? ` · ${sp._author_name}` : '';
            tags.push(`<span class="spell-pick-tag spell-pick-tag-hb" title="Homebrew${author}">HB</span>`);
        }
        const metaParts = [];
        const school = _spellField(sp, 'school');
        if (school) metaParts.push(escapeHtml(school));
        const classes = _spellField(sp, 'classes') || [];
        if (classes.length) metaParts.push(classes.join(', '));
        if (sp._is_homebrew && sp._author_name) metaParts.push(`Homebrew · ${escapeHtml(sp._author_name)}`);
        return `<label class="spell-pick-row${isGranted ? ' spell-pick-row-granted' : ''}${sp._is_homebrew ? ' spell-pick-row-hb' : ''}" data-spell-id="${safeId}">
            <input type="checkbox" class="spell-pick-cb" data-name="${safeId}" ${(isKnown || isGranted) ? 'checked' : ''} ${isGranted ? 'disabled' : ''}>
            <div class="spell-pick-info" onclick="event.preventDefault();schedaShowSpellDetail('${safeId}')">
                <div class="spell-pick-name">${escapeHtml(_spellField(sp, 'name'))} ${tags.join('')}</div>
                <div class="spell-pick-meta">${metaParts.join(' · ')}</div>
            </div>
        </label>`;
    };

    const titleLabel = lang === 'en'
        ? (level === 0 ? 'Cantrips' : `Level ${level} Spells`)
        : (SPELL_LEVEL_LABELS[level] || `Livello ${level}`);
    const emptyMsg = lang === 'en' ? 'No spells match the filters' : 'Nessun incantesimo corrisponde ai filtri';
    const placeholder = lang === 'en' ? 'Search…' : 'Cerca…';
    const cancelLbl = lang === 'en' ? 'Cancel' : 'Annulla';
    const saveLbl = lang === 'en' ? 'Save' : 'Salva';

    // Pannello filtri
    const f = window._spellPickerFilters;
    const allClassesSet = new Set();
    Object.values(all).forEach(sp => (sp.classes || []).forEach(c => allClassesSet.add(c)));
    const allClasses = Array.from(allClassesSet).sort((a, b) => a.localeCompare(b, lang));
    const allSourcesSet = new Set();
    Object.values(all).forEach(sp => { const s = _spellSourceShort(sp); if (s) allSourcesSet.add(s); });
    const allSources = Array.from(allSourcesSet).sort();

    const chip = (label, active, onclick) =>
        `<button type="button" class="spell-filter-chip ${active ? 'active' : ''}" onclick="${onclick}">${escapeHtml(label)}</button>`;

    // Scuole HOMEBREW: oltre alle 8 canoniche, aggiungo dinamicamente
    // tutte le scuole non standard incontrate negli incantesimi disponibili
    // (sia nel pool generale sia tra gli homebrew). La key del filtro e' la
    // stringa lower-case (uguale a quanto restituito da _spellSchoolKey).
    const _stdSchoolKeys = new Set(_SPELL_SCHOOLS.map(([k]) => k));
    const customSchoolMap = new Map(); // key → label
    const _addCustomSchool = sp => {
        const k = _spellSchoolKey(sp);
        if (!k || _stdSchoolKeys.has(k)) return;
        const lab = sp.school_it || sp.school || k;
        if (!customSchoolMap.has(k)) customSchoolMap.set(k, lab);
    };
    Object.values(all).forEach(_addCustomSchool);
    (window.AppState?.cachedHomebrewIncantesimi || []).forEach(_addCustomSchool);
    const customSchoolEntries = Array.from(customSchoolMap.entries())
        .sort((a, b) => a[1].localeCompare(b[1], lang));

    const filtersPanelHtml = `<div class="spell-filter-panel" id="spellFilterPanel" style="display:none;">
        <div class="spell-filter-group">
            <div class="spell-filter-label">Scuola</div>
            <div class="spell-filter-chips">
                ${_SPELL_SCHOOLS.map(([k, lab]) => chip(lab, f.schools.includes(k), `spellFilterToggle('schools','${k}')`)).join('')}
                ${customSchoolEntries.map(([k, lab]) => chip(lab, f.schools.includes(k), `spellFilterToggle('schools','${k}')`)).join('')}
            </div>
        </div>
        <div class="spell-filter-group">
            <div class="spell-filter-label">Tempo di lancio</div>
            <div class="spell-filter-chips">
                ${_SPELL_CASTING_TIMES.map(t => chip(t, f.castingTimes.includes(t), `spellFilterToggle('castingTimes','${t}')`)).join('')}
            </div>
        </div>
        <div class="spell-filter-group">
            <div class="spell-filter-label">Componenti</div>
            <div class="spell-filter-chips">
                ${['V','S','M'].map(c => chip(c, f.components.includes(c), `spellFilterToggle('components','${c}')`)).join('')}
            </div>
        </div>
        <div class="spell-filter-group">
            <div class="spell-filter-label">Concentrazione</div>
            <div class="spell-filter-chips">
                ${[['any','Tutti'],['yes','Sì'],['no','No']].map(([v, lab]) => chip(lab, f.concentration === v, `spellFilterSet('concentration','${v}')`)).join('')}
            </div>
        </div>
        <div class="spell-filter-group">
            <div class="spell-filter-label">Rituale</div>
            <div class="spell-filter-chips">
                ${[['any','Tutti'],['yes','Sì'],['no','No']].map(([v, lab]) => chip(lab, f.ritual === v, `spellFilterSet('ritual','${v}')`)).join('')}
            </div>
        </div>
        <div class="spell-filter-group">
            <div class="spell-filter-label">Classi <small style="color:var(--text-light);">(vuoto = tutte)</small></div>
            <div class="spell-filter-chips">
                ${allClasses.map(c => chip(c, f.classes.includes(c), `spellFilterToggle('classes',\`${c.replace(/`/g, '\\`')}\`)`)).join('')}
            </div>
        </div>
        ${allSources.length > 0 ? `<div class="spell-filter-group">
            <div class="spell-filter-label">Manuale</div>
            <div class="spell-filter-chips">
                ${allSources.map(s => chip(s, f.sources.includes(s), `spellFilterToggle('sources','${s}')`)).join('')}
            </div>
        </div>` : ''}
        <div class="spell-filter-actions">
            <button type="button" class="btn-secondary btn-small" onclick="spellFilterReset()">Reimposta</button>
        </div>
    </div>`;

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const tabsHtml = hasHomebrewTab ? `
        <div class="spell-picker-tabs">
            <button type="button" class="spell-picker-tab active" data-tab="catalog" onclick="spellPickerSetTab('catalog')">Catalogo <span class="spell-picker-tab-count">${list.length}</span></button>
            <button type="button" class="spell-picker-tab" data-tab="homebrew" onclick="spellPickerSetTab('homebrew')">Homebrew <span class="spell-picker-tab-count">${hbList.length}</span></button>
        </div>` : '';
    overlay.innerHTML = `<div class="hp-calc-modal spell-picker-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 style="margin-bottom:6px;">${escapeHtml(titleLabel)}</h3>
        ${tabsHtml}
        <div class="spell-picker-search-row">
            <input type="text" id="spellPickerSearch" class="hp-calc-input spell-picker-search" placeholder="${placeholder}">
            <button type="button" class="spell-picker-filter-btn" id="spellPickerFilterBtn" onclick="spellFilterTogglePanel()" title="Filtri" aria-label="Filtri">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span class="spell-picker-filter-badge" id="spellFilterBadge" style="display:none;">0</span>
            </button>
        </div>
        ${filtersPanelHtml}
        <div class="spell-picker-list" id="spellPickerList"></div>
        <div class="dialog-actions">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">${cancelLbl}</button>
            <button class="btn-primary" onclick="schedaSaveSpellsForLevel('${pgId}', ${level})">${saveLbl}</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);

    window._spellPickerRenderRow = renderRow;
    window._spellPickerEmptyMsg = emptyMsg;
    _spellPickerRefresh();

    const search = document.getElementById('spellPickerSearch');
    if (search) {
        search.addEventListener('input', () => {
            window._spellPickerSearchQ = search.value.toLowerCase().trim();
            _spellPickerRefresh();
        });
    }

    // Event delegation: tieni traccia delle selezioni anche quando le
    // checkbox del tab non attivo non sono nel DOM.
    const listEl = document.getElementById('spellPickerList');
    if (listEl) {
        listEl.addEventListener('change', e => {
            const cb = e.target.closest('.spell-pick-cb');
            if (!cb || cb.disabled) return;
            const name = cb.dataset.name;
            if (!name || !window._spellPickerSelected) return;
            if (cb.checked) window._spellPickerSelected.add(name);
            else window._spellPickerSelected.delete(name);
        });
    }
};

function _spellPickerRefresh() {
    const lists = window._spellPickerLists || { catalog: [], homebrew: [] };
    const tab = window._spellPickerTab || 'catalog';
    const list = lists[tab] || [];
    const renderRow = window._spellPickerRenderRow;
    const emptyMsg = window._spellPickerEmptyMsg || '';
    const f = window._spellPickerFilters;
    const q = window._spellPickerSearchQ || '';
    const lang = _spellLang();
    const pg = _schedaPgCache;
    const pgClasses = pg ? _pgSpellClasses(pg) : new Set();

    const filtered = list.filter(sp => _applySpellPickerFilters(sp, f)).filter(sp => {
        if (!q) return true;
        const name = (_spellField(sp, 'name') || '').toLowerCase();
        const sch = (_spellField(sp, 'school') || '').toLowerCase();
        return name.includes(q) || sch.includes(q);
    });

    const listEl = document.getElementById('spellPickerList');
    if (!listEl) return;
    let html = '';
    if (tab === 'homebrew') {
        // Tab homebrew: niente raggruppamento per classe del PG; mostro la lista
        // come unico blocco ordinato. Aggiungo l'autore se non e' del PG stesso.
        if (filtered.length === 0) {
            html = `<p class="scheda-empty">${emptyMsg}</p>`;
        } else {
            html = filtered.map(renderRow).join('');
        }
    } else {
        const matching = filtered.filter(s => _spellMatchesPg(s, pgClasses));
        const others = filtered.filter(s => !_spellMatchesPg(s, pgClasses));
        const grpMatch = lang === 'en' ? 'Available for your class' : 'Disponibili per la tua classe';
        const grpOther = lang === 'en' ? 'Others' : 'Altri';
        if (matching.length > 0) html += `<div class="spell-pick-group-title">${grpMatch}</div>${matching.map(renderRow).join('')}`;
        if (others.length > 0) html += `<div class="spell-pick-group-title">${grpOther}</div>${others.map(renderRow).join('')}`;
        if (filtered.length === 0) html = `<p class="scheda-empty">${emptyMsg}</p>`;
    }
    listEl.innerHTML = html;

    // Aggiorna badge contatore filtri attivi
    const badge = document.getElementById('spellFilterBadge');
    if (badge && f) {
        let n = 0;
        n += f.schools.length;
        n += f.castingTimes.length;
        n += f.components.length;
        if (f.concentration !== 'any') n += 1;
        if (f.ritual !== 'any') n += 1;
        n += f.classes.length;
        n += f.sources.length;
        if (n > 0) { badge.textContent = n; badge.style.display = ''; }
        else badge.style.display = 'none';
    }
}

window.spellPickerSetTab = function(tab) {
    if (tab !== 'catalog' && tab !== 'homebrew') return;
    window._spellPickerTab = tab;
    document.querySelectorAll('.spell-picker-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
    });
    _spellPickerRefresh();
};

window.spellFilterTogglePanel = function() {
    const panel = document.getElementById('spellFilterPanel');
    const btn = document.getElementById('spellPickerFilterBtn');
    if (!panel) return;
    const visible = panel.style.display !== 'none';
    panel.style.display = visible ? 'none' : '';
    if (btn) btn.classList.toggle('active', !visible);
};

window.spellFilterToggle = function(field, value) {
    const f = window._spellPickerFilters;
    if (!f || !Array.isArray(f[field])) return;
    const i = f[field].indexOf(value);
    if (i >= 0) f[field].splice(i, 1); else f[field].push(value);
    // Aggiorna lo stato visivo del chip
    _refreshSpellFilterChips();
    _spellPickerRefresh();
};

window.spellFilterSet = function(field, value) {
    const f = window._spellPickerFilters;
    if (!f) return;
    f[field] = value;
    _refreshSpellFilterChips();
    _spellPickerRefresh();
};

window.spellFilterReset = function() {
    const pg = _schedaPgCache;
    if (!pg) return;
    window._spellPickerFilters = _defaultSpellFilters(pg);
    _refreshSpellFilterChips();
    _spellPickerRefresh();
};

function _refreshSpellFilterChips() {
    const panel = document.getElementById('spellFilterPanel');
    if (!panel) return;
    const f = window._spellPickerFilters;
    panel.querySelectorAll('.spell-filter-chip').forEach(btn => {
        const oc = btn.getAttribute('onclick') || '';
        const m = oc.match(/spellFilter(Toggle|Set)\('([^']+)',\s*[`']([^`']+)[`']\)/);
        if (!m) return;
        const action = m[1], field = m[2], value = m[3];
        let active = false;
        if (action === 'Toggle' && Array.isArray(f[field])) active = f[field].includes(value);
        else if (action === 'Set') active = f[field] === value;
        btn.classList.toggle('active', active);
    });
}

// Alias storico
window.schedaOpenCantripsPicker = function(pgId) { return window.schedaOpenSpellPicker(pgId, 0); };

window.schedaSaveSpellsForLevel = async function(pgId, level) {
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    // Mantieni i conosciuti di altri livelli, sostituisci solo il livello corrente
    const all = _spellsData();
    const others = (pg.incantesimi_conosciuti || []).filter(n => {
        const sp = _resolveSpell(n);
        return !sp || sp.level !== level;
    }).map(n => {
        const sp = _resolveSpell(n);
        return sp ? sp.name : n;
    });
    // Escludi dal salvataggio gli incantesimi auto-garantiti dalla
    // sottoclasse o dalle invocazioni: sono derivati e verranno
    // re-iniettati a runtime.
    const grantedSet = new Set();
    _pgSubclassGrantedSpells(pg).forEach(g => {
        const sp = _resolveSpell(g.name);
        if (sp) grantedSet.add(sp.name);
    });
    _pgInvocationGrantedSpells(pg).forEach(g => {
        const sp = _resolveSpell(g.name) || _resolveSpell(g.name_en);
        if (sp) grantedSet.add(sp.name);
    });
    // Le selezioni vivono in _spellPickerSelected (persistono fra cambi tab).
    // Filtro mantenendo solo quelle che corrispondono a un incantesimo del
    // livello corrente (tab catalog + homebrew) e non sono auto-garantite.
    const allLevelNames = new Set([
        ...((window._spellPickerLists?.catalog) || []).map(s => s.name),
        ...((window._spellPickerLists?.homebrew) || []).map(s => s.name),
    ]);
    const checked = Array.from(window._spellPickerSelected || [])
        .filter(n => allLevelNames.has(n) && !grantedSet.has(n));
    const merged = Array.from(new Set([...others, ...checked]));
    pg.incantesimi_conosciuti = merged;

    // Sincronizza la lista dei preparati: rimuovi quelli che non sono piu' tra
    // i conosciuti (es. spell deselezionata dal picker).
    const updates = { incantesimi_conosciuti: merged };
    if (Array.isArray(pg.incantesimi_preparati) && pg.incantesimi_preparati.length > 0) {
        const knownSet = new Set(merged);
        const cleaned = pg.incantesimi_preparati.filter(n => knownSet.has(n));
        if (cleaned.length !== pg.incantesimi_preparati.length) {
            pg.incantesimi_preparati = cleaned;
            updates.incantesimi_preparati = cleaned;
        }
    }
    await supabase.from('personaggi').update(updates).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenSpellPage(pgId);
};

// Alias storico
window.schedaSaveCantrips = function(pgId) { return window.schedaSaveSpellsForLevel(pgId, 0); };

/* ── Inventario Tab ── */
// Monete D&D 5e con tasso di conversione in MO (oro) e ordine 2x3 (riga1: MR/MA, riga2: ME/MO, riga3: MP/Totale)
const COIN_TYPES = [
    { key: 'mr', label: 'Rame (MR)', short: 'MR', goldRatio: 0.01 },
    { key: 'ma', label: 'Argento (MA)', short: 'MA', goldRatio: 0.1 },
    { key: 'me', label: 'Electrum (ME)', short: 'ME', goldRatio: 0.5 },
    { key: 'mo', label: 'Oro (MO)', short: 'MO', goldRatio: 1 },
    { key: 'mp', label: 'Platino (MP)', short: 'MP', goldRatio: 10 }
];

function _calcCoinsTotalGold(monete) {
    if (!monete) return 0;
    let tot = 0;
    COIN_TYPES.forEach(c => { tot += (parseInt(monete[c.key]) || 0) * c.goldRatio; });
    return tot;
}

function _formatGoldTotal(g) {
    if (g === 0) return '0';
    if (g >= 100 || Number.isInteger(g)) return String(Math.round(g));
    return g.toFixed(2).replace(/\.?0+$/, '');
}

// ──────────────────────────────────────────────────────────────────────
// State + helpers per la lista oggetti dell'Inventario:
//   - search testuale (nome / tipo / sotto-tipo / rarita')
//   - filtri rarita' + tipologia (toggleable via icona imbuto)
//   - drag & drop per riordinare gli oggetti (HTML5 + pointer events
//     per supportare anche il touch). L'ordine viene salvato come
//     ordine dell'array pg.inventario stesso (no campo separato).
// ──────────────────────────────────────────────────────────────────────
window._invListState = window._invListState || {
    search: '',
    filters: { rarita: '', tipo: '' },
    filtersOpen: false,
};

function _invListItemView(o) {
    return _invResolveLive(o);
}

function _invListItemRarity(view) {
    return view._homebrew_rarita || view.rarita || '';
}

function _invListItemTipo(view) {
    return view._homebrew_tipo || view.tipo || '';
}

function _invListMatches(view) {
    const st = window._invListState || {};
    const f = st.filters || {};
    if (f.rarita) {
        const r = String(_invListItemRarity(view) || '').trim();
        if (r !== f.rarita) return false;
    }
    if (f.tipo) {
        const t = String(_invListItemTipo(view) || '').trim();
        if (t !== f.tipo) return false;
    }
    const q = (st.search || '').trim().toLowerCase();
    if (q) {
        const txt = [
            _invDisplayName(view) || view.nome || '',
            view.nome_en || '',
            _invListItemTipo(view),
            view._homebrew_sotto_tipo || view.sotto_tipo || '',
            _invListItemRarity(view),
        ].join(' ').toLowerCase();
        if (!txt.includes(q)) return false;
    }
    return true;
}

function _invListBuildRowsHtml(pg, pgId) {
    const oggetti = pg.inventario || [];
    if (oggetti.length === 0) {
        return '<span class="scheda-empty">Nessun oggetto</span>';
    }
    const visible = [];
    oggetti.forEach((o, i) => {
        const view = _invListItemView(o);
        if (_invListMatches(view)) visible.push({ view, i });
    });
    if (visible.length === 0) {
        return '<span class="scheda-empty">Nessun oggetto corrisponde ai filtri</span>';
    }
    return visible.map(({ view, i }) => {
        const magicStr = view.magic_bonus
            ? ` <span class="inv-magic-badge">+${view.magic_bonus}</span>` : '';
        const hbBadge = view._homebrew_id
            ? ' <span class="inv-hb-badge" title="Homebrew">HB</span>' : '';
        let meta = '';
        if (view._homebrew_id) {
            meta = view._homebrew_meta || (typeof window.formatOggettoMeta === 'function'
                ? window.formatOggettoMeta({
                    tipo: view._homebrew_tipo,
                    sotto_tipo: view._homebrew_sotto_tipo,
                    rarita: view._homebrew_rarita,
                    incantamento: view._homebrew_incantamento,
                    richiede_sintonia: view._homebrew_richiede_sintonia,
                    sintonia_dettaglio: view._homebrew_sintonia_dettaglio,
                }) : '');
        } else if (view.rarita) {
            meta = (typeof window.formatOggettoMeta === 'function')
                ? window.formatOggettoMeta(view) : '';
        }
        const rarClass = _invRarityClass(_invListItemRarity(view));
        return `<div class="inv-item-row inv-item-card ${rarClass}" data-idx="${i}">
            <div class="inv-item-main">
                <div class="inv-item-name inv-item-name-clickable" onclick="invEditItem('${pgId}',${i})">${escapeHtml(_invDisplayName(view) || 'Oggetto')}${view.magico ? ' <span class="inv-magic-badge">✦</span>' : ''}${magicStr}${hbBadge}</div>
                ${meta ? `<div class="inv-item-meta">${escapeHtml(meta)}</div>` : ''}
            </div>
            <div class="inv-item-qty-edit" title="Quantita'">
                <span class="inv-item-qty-x">×</span>
                <input type="number" class="inv-item-qty-input" min="1" step="1"
                    value="${view.quantita || 1}"
                    onclick="event.stopPropagation();this.select();"
                    onchange="invQtyInlineUpdate('${pgId}',${i},this.value)"
                    onblur="invQtyInlineUpdate('${pgId}',${i},this.value)"
                    onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}">
            </div>
        </div>`;
    }).join('');
}

function _invListReRender(pgId) {
    const pg = _schedaPgCache;
    const cont = document.getElementById('invItemsList');
    if (!pg || !cont) return;
    cont.innerHTML = _invListBuildRowsHtml(pg, pgId);
}

function _invListOptionsFor(pg, field) {
    const set = new Set();
    (pg.inventario || []).forEach(o => {
        const view = _invListItemView(o);
        const v = field === 'rarita' ? _invListItemRarity(view) : _invListItemTipo(view);
        const s = String(v || '').trim();
        if (s) set.add(s);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'it'));
}

function _invListActiveFilterCount() {
    const f = (window._invListState && window._invListState.filters) || {};
    return (f.rarita ? 1 : 0) + (f.tipo ? 1 : 0);
}

function _invListRenderFiltersBadge() {
    const badge = document.getElementById('invListFiltersBadge');
    if (!badge) return;
    const n = _invListActiveFilterCount();
    badge.textContent = n ? String(n) : '';
    badge.style.display = n ? 'inline-flex' : 'none';
    const btn = document.getElementById('invListFiltersBtn');
    if (btn) btn.classList.toggle('active', n > 0 || window._invListState?.filtersOpen);
}

function _invListRenderFiltersPanel(pgId) {
    const panel = document.getElementById('invListFiltersPanel');
    if (!panel) return;
    const pg = _schedaPgCache;
    if (!pg) { panel.innerHTML = ''; return; }
    const f = window._invListState.filters || {};
    const rarOpts = _invListOptionsFor(pg, 'rarita');
    const tipOpts = _invListOptionsFor(pg, 'tipo');
    panel.innerHTML = `
        <div class="inv-list-filter-field">
            <label>Rarità</label>
            <select onchange="invListSetFilter('rarita', this.value, '${pgId}')">
                <option value="">Tutte</option>
                ${rarOpts.map(v => `<option value="${escapeHtml(v)}" ${f.rarita === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
            </select>
        </div>
        <div class="inv-list-filter-field">
            <label>Tipologia</label>
            <select onchange="invListSetFilter('tipo', this.value, '${pgId}')">
                <option value="">Tutte</option>
                ${tipOpts.map(v => `<option value="${escapeHtml(v)}" ${f.tipo === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
            </select>
        </div>
        <button type="button" class="inv-list-filter-reset" onclick="invListResetFilters('${pgId}')">Pulisci</button>
    `;
}

window.invListToggleFilters = function(pgId) {
    window._invListState.filtersOpen = !window._invListState.filtersOpen;
    const bar = document.getElementById('invListSearchBar');
    if (bar) bar.style.display = window._invListState.filtersOpen ? '' : 'none';
    if (window._invListState.filtersOpen) {
        _invListRenderFiltersPanel(pgId);
        const inp = document.getElementById('invListSearch');
        if (inp) setTimeout(() => inp.focus(), 30);
    }
    _invListRenderFiltersBadge();
};

window.invListOnSearch = function(value, pgId) {
    window._invListState.search = value || '';
    _invListReRender(pgId);
};

window.invListSetFilter = function(field, value, pgId) {
    window._invListState.filters = window._invListState.filters || {};
    window._invListState.filters[field] = value || '';
    _invListReRender(pgId);
    _invListRenderFiltersBadge();
};

window.invListResetFilters = function(pgId) {
    window._invListState.filters = { rarita: '', tipo: '' };
    _invListRenderFiltersPanel(pgId);
    _invListReRender(pgId);
    _invListRenderFiltersBadge();
};

// Drag & drop rimosso: gli oggetti dell'inventario ora restano fissi
// nell'ordine in cui sono stati aggiunti.

window.schedaOpenInventoryPage = async function(pgId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
    if (!pg) return;
    _schedaPgCache = pg;
    // Tracciamo la tab corrente cosi' il bottone "Vai a Statistiche" sa che
    // deve prima navigare a Pagina 1 e poi scrollare. Senza questo flag il
    // valore restava quello della tab precedente e il bottone non funzionava.
    window._schedaCurrentPgId = pgId;
    window._schedaCurrentTab = 'inventario';

    const monete = pg.monete || {};
    const coinCellHtml = (c) => {
        const val = monete[c.key] || 0;
        return `<div class="inv-coin-cell inv-coin-${c.key}">
            <div class="inv-coin-abbr">${c.short}</div>
            <input type="text" inputmode="none" readonly
                class="inv-coin-input"
                id="invCoin_${c.key}"
                value="${val}"
                data-coin="${c.key}"
                data-pgid="${pgId}"
                onclick="invOpenCoinKeypad(this)">
            <div class="inv-coin-name">${c.label.split(' ')[0]}</div>
        </div>`;
    };
    const totalGold = _calcCoinsTotalGold(monete);
    const totalCellHtml = `<div class="inv-coin-cell inv-coin-total" id="invCoinTotalCell">
        <div class="inv-coin-abbr">TOT</div>
        <div class="inv-coin-input inv-coin-total-val" id="invCoinTotal">${_formatGoldTotal(totalGold)}</div>
        <div class="inv-coin-name">in MO</div>
    </div>`;
    // Riga 1: MR / MA · Riga 2: ME / MO · Riga 3: MP / Totale
    const coinsHtml = `<div class="inv-coins-grid inv-coins-grid-2x3">
        ${coinCellHtml(COIN_TYPES[0])}${coinCellHtml(COIN_TYPES[1])}
        ${coinCellHtml(COIN_TYPES[2])}${coinCellHtml(COIN_TYPES[3])}
        ${coinCellHtml(COIN_TYPES[4])}${totalCellHtml}
    </div>`;

    // Le righe degli oggetti vengono generate da _invListBuildRowsHtml,
    // cosi' search/filtri/drag&drop possono ri-renderizzare la lista
    // senza ricaricare l'intera pagina.
    const oggettiRowsHtml = _invListBuildRowsHtml(pg, pgId);

    const sintonia = pg.sintonia || [];
    const maxSintonia = 3;
    const _attuneNameOf = (it) => {
        if (!it) return '';
        if (typeof it === 'string') return it;
        // Strippa eventuale " +N" finale duplicato col magic_bonus.
        return _invDisplayName(it) || it.nome || '';
    };
    const _attuneBonusOf = (it) => {
        if (!it || typeof it === 'string') return 0;
        return it.magic_bonus || 0;
    };
    let sintoniaHtml = '';
    for (let i = 0; i < maxSintonia; i++) {
        const item = sintonia[i] || null;
        const itemName = _attuneNameOf(item);
        const itemBonus = _attuneBonusOf(item);
        const bonusStr = itemBonus ? ` +${itemBonus}` : '';
        sintoniaHtml += `<div class="inv-attune-slot ${item ? 'filled' : 'empty'}" onclick="invEditAttune('${pgId}',${i})">
            <span class="inv-attune-icon">◈</span>
            <span class="inv-attune-name">${item ? escapeHtml(itemName) + bonusStr : 'Slot vuoto'}</span>
        </div>`;
    }

    content.innerHTML = `
    ${buildSchedaHeader(pg, 'Inventario')}

    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">
            <span>Monete</span>
            <span class="inv-coins-title-total" id="invCoinsTitleTotal" title="Totale in monete d'oro">${_formatGoldTotal(totalGold)} <small>MO</small></span>
        </div>
        <div class="scheda-section-body">
            ${coinsHtml}
        </div>
    </div>

    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Sintonia</div>
        <div class="scheda-section-body">
            <div class="inv-attune-grid">${sintoniaHtml}</div>
        </div>
    </div>

    <div class="scheda-section inv-section-fixed">
        <div class="scheda-section-title inv-section-title-fixed">
            <span>Inventario</span>
            <div class="inv-section-actions">
                <button type="button" id="invListFiltersBtn" class="inv-list-filters-btn" onclick="invListToggleFilters('${pgId}')" title="Filtri e ricerca" aria-label="Filtri">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    <span class="inv-list-filters-badge" id="invListFiltersBadge"></span>
                </button>
                <button class="scheda-edit-btn" onclick="invAddItem('${pgId}')" title="Aggiungi oggetto">&#9998;</button>
            </div>
        </div>
        <div id="invListSearchBar" class="inv-list-search-bar" style="display:none;">
            <input type="text" id="invListSearch" class="inv-list-search-input" placeholder="Cerca per nome o tipo..."
                value="${escapeHtml(window._invListState?.search || '')}"
                oninput="invListOnSearch(this.value,'${pgId}')">
            <div id="invListFiltersPanel" class="inv-list-filters-panel"></div>
        </div>
        <div class="scheda-section-body">
            <div id="invItemsList" class="inv-items-grid inv-items-grid-2col">${oggettiRowsHtml}</div>
        </div>
    </div>
    `;

    schedaSetActiveTab('inventario');
    schedaWireTabBar(pgId);
    if (window._invListState?.filtersOpen) {
        const bar = document.getElementById('invListSearchBar');
        if (bar) bar.style.display = '';
        _invListRenderFiltersPanel(pgId);
    }
    _invListRenderFiltersBadge();
};

window.invCoinChange = async function(pgId, coinKey, delta) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const monete = pg.monete ? { ...pg.monete } : {};
    monete[coinKey] = Math.max(0, (monete[coinKey] || 0) + delta);
    pg.monete = monete;
    const el = document.getElementById('invCoin_' + coinKey);
    if (el) el.textContent = monete[coinKey];
    await supabase.from('personaggi').update({ monete }).eq('id', pgId);
};

window.invOpenCoinKeypad = function(inputEl) {
    if (!inputEl) return;
    const coinKey = inputEl.dataset.coin;
    const pgId = inputEl.dataset.pgid;
    pgOpenAbilityKeypad(inputEl);
    const onChange = async () => {
        const val = Math.max(0, parseInt(inputEl.value) || 0);
        inputEl.value = val;
        const supabase = getSupabaseClient();
        const pg = _schedaPgCache;
        if (!supabase || !pg) return;
        const monete = pg.monete ? { ...pg.monete } : {};
        monete[coinKey] = val;
        pg.monete = monete;
        const formattedTotal = _formatGoldTotal(_calcCoinsTotalGold(monete));
        const totEl = document.getElementById('invCoinTotal');
        if (totEl) totEl.textContent = formattedTotal;
        const titleTotEl = document.getElementById('invCoinsTitleTotal');
        if (titleTotEl) titleTotEl.innerHTML = `${formattedTotal} <small>MO</small>`;
        await supabase.from('personaggi').update({ monete }).eq('id', pgId);
        inputEl.removeEventListener('change', onChange);
    };
    inputEl.addEventListener('change', onChange);
};

// ─────────────────────────────────────────────────────────────────────
// Risoluzione "live" di un'entry inventario:
// - Se l'entry ha _homebrew_id e l'oggetto e' nella cache homebrew,
//   usa i campi attuali dall'autore (nome, descrizione, incantamento,
//   tipo, rarita') sovrascrivendo i campi snapshot salvati.
// - Mantiene SEMPRE quantita e ogni campo che l'utente abbia
//   personalizzato localmente (note non gestite qui).
// - Se l'oggetto homebrew e' stato cancellato dall'autore, fallback
//   sui campi snapshot dell'entry (nome/descrizione gia' salvati).
// ─────────────────────────────────────────────────────────────────────
// Mappa una rarita' (stringa libera, italiano o inglese) alla classe CSS
// da applicare alla riga dell'oggetto. Ritorna stringa vuota per rarita'
// sconosciute o "Comune" (che non ha colore).
function _invRarityClass(rar) {
    if (!rar || typeof rar !== 'string') return '';
    const n = rar.trim().toLowerCase();
    if (!n || n === 'comune' || n === 'common') return '';
    if (n === 'non comune' || n === 'uncommon') return 'rarita-non-comune';
    if (n === 'raro' || n === 'rare') return 'rarita-raro';
    if (n === 'molto raro' || n === 'very rare') return 'rarita-molto-raro';
    if (n === 'leggendario' || n === 'legendary') return 'rarita-leggendario';
    if (n === 'artefatto' || n === 'artifact') return 'rarita-artefatto';
    return '';
}

function _invResolveLive(entry) {
    if (!entry || typeof entry !== 'object') return entry || {};
    if (!entry._homebrew_id) return entry;
    const cache = (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewOggetti))
        ? AppState.cachedHomebrewOggetti : [];
    const hb = cache.find(o => String(o.id) === String(entry._homebrew_id));
    if (!hb) return entry; // autore ha cancellato l'oggetto: fallback snapshot
    const ench = parseInt(hb.incantamento) || 0;
    return {
        ...entry,
        nome: hb.nome || entry.nome,
        descrizione: hb.descrizione || hb.proprieta || entry.descrizione || '',
        magico: ench > 0 || !!hb.richiede_sintonia || (hb.rarita && hb.rarita !== 'Comune') || !!entry.magico,
        magic_bonus: ench > 0 ? ench : (entry.magic_bonus || 0),
        _homebrew_tipo: hb.tipo || null,
        _homebrew_sotto_tipo: hb.sotto_tipo || null,
        _homebrew_rarita: hb.rarita || null,
        _homebrew_incantamento: parseInt(hb.incantamento) || 0,
        _homebrew_richiede_sintonia: !!hb.richiede_sintonia,
        _homebrew_sintonia_dettaglio: hb.sintonia_dettaglio || null,
        _homebrew_author: hb._author_name || null,
        // Snapshot della formula meta gia' formattata (utile a chi non
        // vuole reimpaginarla).
        _homebrew_meta: (typeof window.formatOggettoMeta === 'function')
            ? window.formatOggettoMeta(hb) : '',
    };
}

window._invResolveLive = _invResolveLive;

// ─────────────────────────────────────────────────────────────────────
// Picker "Aggiungi Oggetto al Tesoro"
// Tab "Catalogo" (vuoto, futuro dataset SRD) + tab "Homebrew" (visibile
// solo se l'utente ha l'homebrew abilitato dai settings) + bottone "Crea
// rapidamente" che apre la mini-dialog testo libero (vecchio
// comportamento di invAddItem).
// ─────────────────────────────────────────────────────────────────────
window._invPickerState = { tab: 'catalog', search: '', filters: { rarita: '', tipo: '' }, filtersOpen: false };

window.invAddItem = async function(pgId) {
    // Carica gli homebrew oggetti in background; se la cache c'e' gia'
    // partiamo subito con quella, altrimenti viene riempita dopo.
    if (typeof window.loadHomebrewOggetti === 'function') {
        try { await window.loadHomebrewOggetti(); } catch (_) {}
    }
    _invOpenPickerDialog(pgId);
};

function _invHomebrewEnabled() {
    try {
        const s = AppState.cachedUserData?.homebrew_settings;
        return !!s && s.enabled !== false;
    } catch (_) { return false; }
}

function _invOpenPickerDialog(pgId) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const showHb = _invHomebrewEnabled();
    if (!showHb) _invPickerState.tab = 'catalog';
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal inv-picker-modal" style="width:720px;max-width:96vw;text-align:left;">
        <h3 style="margin-bottom:10px;font-size:1rem;">Aggiungi Oggetto</h3>
        <div class="inv-picker-tabs">
            <button class="inv-picker-tab ${_invPickerState.tab === 'catalog' ? 'active' : ''}"
                onclick="_invPickerSwitchTab('${pgId}','catalog')">Catalogo</button>
            <button class="inv-picker-tab ${_invPickerState.tab === 'veleni' ? 'active' : ''}"
                onclick="_invPickerSwitchTab('${pgId}','veleni')">Veleni</button>
            ${showHb ? `<button class="inv-picker-tab ${_invPickerState.tab === 'homebrew' ? 'active' : ''}"
                onclick="_invPickerSwitchTab('${pgId}','homebrew')">Homebrew</button>` : ''}
        </div>
        <div class="inv-picker-search-row">
            <input type="text" id="invPickerSearch" class="hp-calc-input" placeholder="Cerca per nome o tipo..."
                value="${escapeHtml(_invPickerState.search || '')}"
                oninput="_invPickerOnSearch(this.value,'${pgId}')">
            <button type="button" id="invPickerFiltersBtn" class="inv-picker-filters-btn"
                onclick="_invPickerToggleFilters('${pgId}')" title="Filtri" aria-label="Filtri">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span class="inv-picker-filters-badge" id="invPickerFiltersBadge"></span>
            </button>
        </div>
        <div id="invPickerFiltersPanel" class="inv-picker-filters-panel" style="display:none;"></div>
        <div id="invPickerList" class="inv-picker-list"></div>
        <div class="dialog-actions" style="margin-top:12px;justify-content:space-between;">
            <button class="btn-secondary" onclick="invQuickCreate('${pgId}')">+ Crea rapidamente</button>
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Chiudi</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    _invPickerRenderFiltersPanel(pgId);
    _invPickerRenderFiltersBadge();
    _invPickerRenderList(pgId);
}

window._invPickerSwitchTab = function(pgId, tab) {
    _invPickerState.tab = tab;
    // Cambiando dataset, le opzioni dei filtri cambiano: reset per evitare
    // scelte non piu' presenti (es. "Arma" filtrato in tab Veleni).
    _invPickerState.filters = { rarita: '', tipo: '' };
    const tabLabel = { catalog: 'catalogo', veleni: 'veleni', homebrew: 'homebrew' }[tab] || tab;
    document.querySelectorAll('.inv-picker-tab').forEach(b => b.classList.remove('active'));
    const btn = Array.from(document.querySelectorAll('.inv-picker-tab'))
        .find(b => b.textContent.trim().toLowerCase() === tabLabel);
    if (btn) btn.classList.add('active');
    _invPickerRenderFiltersPanel(pgId);
    _invPickerRenderFiltersBadge();
    _invPickerRenderList(pgId);
};

window._invPickerOnSearch = function(value, pgId) {
    _invPickerState.search = value || '';
    _invPickerRenderList(pgId);
};

// ─── Filtri picker (rarita' + tipologia) ────────────────────────────
// Le opzioni del dropdown vengono derivate dinamicamente dal dataset
// del tab attivo, cosi' "Veleni" mostra ingerito/inalato/contatto/iniezione
// mentre "Catalogo" mostra Arma/Armatura/Bacchetta/etc.
function _invPickerActiveDataset() {
    if (_invPickerState.tab === 'veleni') {
        return Array.isArray(window.VELENI_DATA) ? window.VELENI_DATA : [];
    }
    if (_invPickerState.tab === 'homebrew') {
        return (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewOggetti))
            ? AppState.cachedHomebrewOggetti : [];
    }
    return Array.isArray(window.OGGETTI_MAGICI_DATA) ? window.OGGETTI_MAGICI_DATA : [];
}

function _invPickerOptionsFor(field) {
    const ds = _invPickerActiveDataset();
    const set = new Set();
    for (const o of ds) {
        let v = '';
        if (field === 'rarita') {
            v = o.rarita_it || o.rarita || '';
        } else if (field === 'tipo') {
            v = (_invPickerState.tab === 'veleni')
                ? (o.sotto_tipo_it || o.sotto_tipo_en || '')
                : (o.tipo || '');
        }
        v = String(v || '').trim();
        if (v) set.add(v);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'it'));
}

function _invPickerActiveFilterCount() {
    const f = _invPickerState.filters || {};
    return (f.rarita ? 1 : 0) + (f.tipo ? 1 : 0);
}

function _invPickerMatchesFilters(o) {
    const f = _invPickerState.filters || {};
    if (f.rarita) {
        const r = o.rarita_it || o.rarita || '';
        if (String(r).trim() !== f.rarita) return false;
    }
    if (f.tipo) {
        const t = (_invPickerState.tab === 'veleni')
            ? (o.sotto_tipo_it || o.sotto_tipo_en || '')
            : (o.tipo || '');
        if (String(t).trim() !== f.tipo) return false;
    }
    return true;
}

function _invPickerRenderFiltersBadge() {
    const badge = document.getElementById('invPickerFiltersBadge');
    if (!badge) return;
    const n = _invPickerActiveFilterCount();
    badge.textContent = n ? String(n) : '';
    badge.style.display = n ? 'inline-flex' : 'none';
    const btn = document.getElementById('invPickerFiltersBtn');
    if (btn) btn.classList.toggle('active', n > 0);
}

function _invPickerRenderFiltersPanel(pgId) {
    const panel = document.getElementById('invPickerFiltersPanel');
    if (!panel) return;
    if (!_invPickerState.filtersOpen) {
        panel.style.display = 'none';
        return;
    }
    const f = _invPickerState.filters || {};
    const tipoLabel = _invPickerState.tab === 'veleni' ? 'Tipo' : 'Tipologia';
    const rarOpts = _invPickerOptionsFor('rarita');
    const tipOpts = _invPickerOptionsFor('tipo');
    panel.style.display = 'flex';
    panel.innerHTML = `
        <div class="inv-picker-filter-field">
            <label>Rarità</label>
            <select onchange="_invPickerSetFilter('rarita', this.value, '${pgId}')">
                <option value="">Tutte</option>
                ${rarOpts.map(v => `<option value="${escapeHtml(v)}" ${f.rarita === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
            </select>
        </div>
        <div class="inv-picker-filter-field">
            <label>${tipoLabel}</label>
            <select onchange="_invPickerSetFilter('tipo', this.value, '${pgId}')">
                <option value="">Tutti</option>
                ${tipOpts.map(v => `<option value="${escapeHtml(v)}" ${f.tipo === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
            </select>
        </div>
        <button type="button" class="inv-picker-filter-reset" onclick="_invPickerResetFilters('${pgId}')">Pulisci</button>
    `;
}

window._invPickerToggleFilters = function(pgId) {
    _invPickerState.filtersOpen = !_invPickerState.filtersOpen;
    _invPickerRenderFiltersPanel(pgId);
};

window._invPickerSetFilter = function(field, value, pgId) {
    _invPickerState.filters = _invPickerState.filters || {};
    _invPickerState.filters[field] = value || '';
    _invPickerRenderList(pgId);
    _invPickerRenderFiltersBadge();
};

window._invPickerResetFilters = function(pgId) {
    _invPickerState.filters = { rarita: '', tipo: '' };
    _invPickerRenderFiltersPanel(pgId);
    _invPickerRenderList(pgId);
    _invPickerRenderFiltersBadge();
};

function _invPickerRenderList(pgId) {
    const cont = document.getElementById('invPickerList');
    if (!cont) return;
    const q = (_invPickerState.search || '').trim().toLowerCase();
    if (_invPickerState.tab === 'catalog') {
        const cat = Array.isArray(window.OGGETTI_MAGICI_DATA) ? window.OGGETTI_MAGICI_DATA : [];
        if (cat.length === 0) {
            cont.innerHTML = `<div class="inv-picker-empty">
                <p style="margin:0;">Catalogo oggetti non disponibile.</p>
            </div>`;
            return;
        }
        // Voci "generiche": Arma/Armatura/Scudo +1/+2/+3. La rarita' viene
        // scelta nello step successivo, quindi qui non hanno una rarita'
        // fissa (per i filtri restituiscono true sempre se non c'e' filtro
        // rarita' attivo, false altrimenti).
        const generics = _invPickerGenericMagicEntries();
        const filterActive = _invPickerActiveFilterCount() > 0;
        const genericsFiltered = filterActive ? [] : generics;
        let list = cat.filter(_invPickerMatchesFilters);
        if (q) {
            list = list.filter(o => {
                const txt = (o.nome || '') + ' ' + (o.nome_en || '') + ' ' + (o.tipo || '') + ' ' + (o.sotto_tipo || '') + ' ' + (o.rarita || '');
                return txt.toLowerCase().includes(q);
            });
        }
        const genericsVisible = q
            ? genericsFiltered.filter(g => g.nome.toLowerCase().includes(q) || g.tipo.toLowerCase().includes(q))
            : genericsFiltered;
        if (list.length === 0 && genericsVisible.length === 0) {
            cont.innerHTML = `<div class="inv-picker-empty">
                <p style="margin:0;">Nessun oggetto trovato per "${escapeHtml(q)}".</p>
            </div>`;
            return;
        }
        const genericsHtml = genericsVisible.map(g => {
            return `<div class="inv-picker-item inv-picker-item-generic" onclick="_invOpenGenericMagicDialog('${pgId}','${g.kind}')">
                <div class="inv-picker-item-main">
                    <div class="inv-picker-item-name">${escapeHtml(g.nome)} <span class="inv-picker-item-en">scegli bonus e tipo</span></div>
                    <div class="inv-picker-item-meta">${escapeHtml(g.meta)}</div>
                </div>
            </div>`;
        }).join('');
        cont.innerHTML = genericsHtml + list.slice(0, 200).map(o => {
            const meta = (typeof window.formatOggettoMeta === 'function')
                ? window.formatOggettoMeta(o) : '';
            const rarClass = _invRarityClass(o.rarita);
            const pendingBadge = o._nome_pending
                ? '<span class="inv-picker-tr-pending" title="Traduzione italiana in arrivo">TR</span>'
                : '';
            const subEn = (o._nome_pending && o.nome_en && o.nome_en !== o.nome)
                ? '' : (o.nome_en && o.nome_en !== o.nome ? `<span class="inv-picker-item-en">${escapeHtml(o.nome_en)}</span>` : '');
            return `<div class="inv-picker-item ${rarClass}" onclick="_invShowItemPreview('${pgId}','catalog','${o.id}')">
                <div class="inv-picker-item-main">
                    <div class="inv-picker-item-name">${escapeHtml(o.nome || 'Oggetto')} ${pendingBadge} ${subEn}</div>
                    ${meta ? `<div class="inv-picker-item-meta">${escapeHtml(meta)}</div>` : ''}
                </div>
            </div>`;
        }).join('') + (list.length > 200
            ? `<div class="inv-picker-empty" style="padding:8px;font-size:0.8rem;color:var(--text-secondary);">Mostrando i primi 200 di ${list.length} risultati. Affina la ricerca.</div>`
            : '');
        return;
    }
    if (_invPickerState.tab === 'veleni') {
        const ven = Array.isArray(window.VELENI_DATA) ? window.VELENI_DATA : [];
        if (ven.length === 0) {
            cont.innerHTML = `<div class="inv-picker-empty">
                <p style="margin:0;">Catalogo veleni non disponibile.</p>
            </div>`;
            return;
        }
        let vlist = ven.filter(_invPickerMatchesFilters);
        if (q) {
            vlist = vlist.filter(o => {
                const txt = (o.nome_it || '') + ' ' + (o.nome_en || '') + ' '
                    + (o.sotto_tipo_it || '') + ' ' + (o.categoria_it || '') + ' '
                    + (o.rarita_it || '');
                return txt.toLowerCase().includes(q);
            });
        }
        if (vlist.length === 0) {
            cont.innerHTML = `<div class="inv-picker-empty">
                <p style="margin:0;">Nessun veleno trovato per "${escapeHtml(q)}".</p>
            </div>`;
            return;
        }
        cont.innerHTML = vlist.slice(0, 200).map(o => {
            const meta = `${o.sotto_tipo_it || ''}${o.categoria_it ? ' (' + o.categoria_it + ')' : ''} · ${o.rarita_it || ''} · ${o.prezzo_mo || 0} mo`;
            const rarClass = _invRarityClass(o.rarita_it);
            const pendingBadge = o._nome_pending
                ? '<span class="inv-picker-tr-pending" title="Traduzione italiana in arrivo">TR</span>'
                : '';
            const subEn = (o.nome_en && o.nome_en !== o.nome_it)
                ? `<span class="inv-picker-item-en">${escapeHtml(o.nome_en)}</span>` : '';
            return `<div class="inv-picker-item ${rarClass}" onclick="_invShowItemPreview('${pgId}','veleni','${o.id}')">
                <div class="inv-picker-item-main">
                    <div class="inv-picker-item-name">${escapeHtml(o.nome_it || o.nome_en || 'Veleno')} ${pendingBadge} ${subEn}</div>
                    <div class="inv-picker-item-meta">${escapeHtml(meta)}</div>
                </div>
            </div>`;
        }).join('') + (vlist.length > 200
            ? `<div class="inv-picker-empty" style="padding:8px;font-size:0.8rem;color:var(--text-secondary);">Mostrando i primi 200 di ${vlist.length} risultati. Affina la ricerca.</div>`
            : '');
        return;
    }
    const cache = (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewOggetti))
        ? AppState.cachedHomebrewOggetti : [];
    let list = cache.filter(_invPickerMatchesFilters);
    if (q) {
        list = list.filter(o => {
            const txt = (o.nome || '') + ' ' + (o.tipo || '') + ' ' + (o.rarita || '');
            return txt.toLowerCase().includes(q);
        });
    }
    if (list.length === 0) {
        cont.innerHTML = `<div class="inv-picker-empty">
            <p style="margin:0;">Nessun oggetto homebrew disponibile.</p>
            <p style="margin:6px 0 0 0;color:var(--text-secondary);font-size:0.85rem;">Crea oggetti nel Laboratorio o abilita gli homebrew degli amici dai Settings.</p>
        </div>`;
        return;
    }
    list.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    cont.innerHTML = list.map(o => {
        // formatOggettoMeta gia' include il bonus +N nella posizione
        // canonica (subito dopo tipo/sotto-tipo, prima della rarita').
        const meta = (typeof window.formatOggettoMeta === 'function')
            ? window.formatOggettoMeta(o) : '';
        const author = o._is_own ? 'Tuo' : (o._author_name || 'Amico');
        return `<div class="inv-picker-item" onclick="_invShowItemPreview('${pgId}','homebrew','${o.id}')">
            <div class="inv-picker-item-main">
                <div class="inv-picker-item-name">${escapeHtml(o.nome || 'Oggetto')}</div>
                ${meta ? `<div class="inv-picker-item-meta">${escapeHtml(meta)}</div>` : ''}
            </div>
            <div class="inv-picker-item-author">${escapeHtml(author)}</div>
        </div>`;
    }).join('');
}

// ──────────────────────────────────────────────────────────────────────
// Preview oggetto prima dell'aggiunta al tesoro.
// Apre un overlay sopra il picker con nome, meta, descrizione completa
// (formattata via formatRichText) e bottoni "Indietro" / "Aggiungi al
// tesoro". Funziona per source='catalog'|'veleni'|'homebrew'.
// ──────────────────────────────────────────────────────────────────────
function _invFindItemBySource(source, id) {
    if (source === 'catalog') {
        const cat = Array.isArray(window.OGGETTI_MAGICI_DATA) ? window.OGGETTI_MAGICI_DATA : [];
        return cat.find(o => String(o.id) === String(id));
    }
    if (source === 'veleni') {
        const ven = Array.isArray(window.VELENI_DATA) ? window.VELENI_DATA : [];
        return ven.find(o => String(o.id) === String(id));
    }
    if (source === 'homebrew') {
        const cache = (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewOggetti))
            ? AppState.cachedHomebrewOggetti : [];
        return cache.find(o => String(o.id) === String(id));
    }
    return null;
}

function _invPreviewExtract(source, it) {
    // Normalizza i campi cosi' la preview mostra la stessa shape per
    // tutti e tre i dataset (catalog, veleni, homebrew).
    if (!it) return null;
    if (source === 'veleni') {
        const meta = `${it.sotto_tipo_it || ''}${it.categoria_it ? ' (' + it.categoria_it + ')' : ''} · ${it.rarita_it || ''} · ${it.prezzo_mo || 0} mo`;
        return {
            nome: it.nome_it || it.nome_en || 'Veleno',
            nomeAlt: (it.nome_en && it.nome_en !== it.nome_it) ? it.nome_en : '',
            rarita: it.rarita_it || 'Comune',
            meta,
            extras: it.fonte ? `<div class="inv-preview-extra"><b>Fonte:</b> ${escapeHtml(it.fonte)}</div>` : '',
            descrizione: it.descrizione_it || it.descrizione_en || '',
            pendingTr: !!it._desc_pending,
        };
    }
    if (source === 'homebrew') {
        const meta = (typeof window.formatOggettoMeta === 'function')
            ? window.formatOggettoMeta(it) : '';
        const author = it._is_own ? 'Tuo' : (it._author_name || 'Amico');
        return {
            nome: it.nome || 'Oggetto',
            nomeAlt: '',
            rarita: it.rarita || 'Comune',
            meta,
            extras: `<div class="inv-preview-extra"><b>Autore:</b> ${escapeHtml(author)}</div>`,
            descrizione: it.descrizione || it.proprieta || '',
            pendingTr: false,
        };
    }
    // catalog
    const meta = (typeof window.formatOggettoMeta === 'function')
        ? window.formatOggettoMeta(it) : '';
    return {
        nome: it.nome || it.nome_en || 'Oggetto',
        nomeAlt: (it.nome_en && it.nome_en !== it.nome) ? it.nome_en : '',
        rarita: it.rarita || 'Comune',
        meta,
        extras: '',
        descrizione: it.descrizione || it.descrizione_en || '',
        pendingTr: !!it._desc_pending,
    };
}

window._invShowItemPreview = function(pgId, source, id) {
    const it = _invFindItemBySource(source, id);
    if (!it) return;
    const data = _invPreviewExtract(source, it);
    if (!data) return;
    const rarClass = _invRarityClass(data.rarita);
    const descHtml = data.descrizione
        ? (typeof window.formatRichText === 'function'
            ? window.formatRichText(data.descrizione)
            : escapeHtml(data.descrizione).replace(/\n/g, '<br>'))
        : '<i style="color:var(--text-muted);">Nessuna descrizione disponibile.</i>';
    const trBadge = data.pendingTr
        ? '<span class="inv-picker-tr-pending" style="margin-left:8px;" title="Traduzione italiana in arrivo">TR</span>'
        : '';
    const altName = data.nomeAlt
        ? `<div class="inv-preview-alt">${escapeHtml(data.nomeAlt)}</div>` : '';

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay inv-preview-overlay';
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
            <button type="button" class="btn-primary" id="invPreviewAddBtn">Aggiungi all'inventario</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#invPreviewAddBtn').onclick = () => {
        overlay.remove();
        if (source === 'catalog') return invAddFromCatalog(pgId, id);
        if (source === 'veleni')  return invAddFromVeleni(pgId, id);
        if (source === 'homebrew') return invAddFromHomebrew(pgId, id);
    };
};

window.invAddFromHomebrew = async function(pgId, hbId) {
    const cache = (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewOggetti))
        ? AppState.cachedHomebrewOggetti : [];
    const hb = cache.find(o => String(o.id) === String(hbId));
    if (!hb) return;
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    // Riferimento "live": salviamo solo i metadati di lookup + alcuni
    // campi snapshot di fallback (utili se l'autore cancella l'oggetto).
    const entry = {
        nome: hb.nome || 'Oggetto',
        descrizione: hb.descrizione || hb.proprieta || '',
        quantita: 1,
        magico: parseInt(hb.incantamento) > 0,
        _homebrew_id: hb.id,
        _homebrew_owner_uid: hb._author_uid,
    };
    if (parseInt(hb.incantamento) > 0) entry.magic_bonus = parseInt(hb.incantamento);
    inventario.push(entry);
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

// Aggiunge un oggetto del catalogo (immutabile) al tesoro come snapshot
// completo: dato che il catalogo non cambia, copiamo direttamente i campi
// utili (tipo, sotto_tipo, rarita, incantamento, sintonia, descrizione)
// nell'inventario senza riferimenti "live".
window.invAddFromCatalog = async function(pgId, catId) {
    const cat = Array.isArray(window.OGGETTI_MAGICI_DATA) ? window.OGGETTI_MAGICI_DATA : [];
    const it = cat.find(o => String(o.id) === String(catId));
    if (!it) return;
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const entry = {
        nome: it.nome || it.nome_en || 'Oggetto',
        descrizione: it.descrizione || it.descrizione_en || '',
        quantita: 1,
        tipo: it.tipo || '',
        sotto_tipo: it.sotto_tipo || '',
        rarita: it.rarita || '',
        richiede_sintonia: !!it.richiede_sintonia,
        sintonia_dettaglio: it.sintonia_dettaglio || '',
        incantamento: parseInt(it.incantamento) || 0,
        magico: (it.rarita && it.rarita !== 'Comune') || (parseInt(it.incantamento) > 0),
        _catalog_id: it.id,
    };
    if (parseInt(it.incantamento) > 0) entry.magic_bonus = parseInt(it.incantamento);
    inventario.push(entry);
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

// ──────────────────────────────────────────────────────────────────────
// Voci "generiche" del catalogo: Arma/Armatura/Scudo +N.
// Vengono mostrate in cima alla lista del catalogo. Cliccandole si apre
// un dialog a 2 step (bonus → tipo specifico) che alla conferma aggiunge
// l'oggetto all'inventario come snapshot completo (analogo a un item
// del catalogo "fisso").
// ──────────────────────────────────────────────────────────────────────
// Restituisce il nome dell'item per il display, rimuovendo un eventuale
// suffisso " +N" duplicato quando lo stesso bonus e' gia' presente in
// magic_bonus (cosi' i vecchi item salvati con il vecchio formato
// "Pugnale +2" non si vedono come "Pugnale +2 +2"). Per i nuovi item
// salviamo il nome senza bonus, quindi qui non serve fare nulla.
function _invDisplayName(view) {
    if (!view) return '';
    const nome = view.nome || '';
    const bonus = parseInt(view.magic_bonus) || parseInt(view._homebrew_incantamento) || 0;
    if (bonus <= 0) return nome;
    const re = /\s*\+\d+\s*$/;
    return nome.replace(re, '').trim() || nome;
}
window._invDisplayName = _invDisplayName;

function _invPickerGenericMagicEntries() {
    return [
        { kind: 'arma',          nome: 'Arma Magica',     tipo: 'Arma',     meta: 'Bonus: +1 / +2 / +3 · scegli tipo arma' },
        { kind: 'armatura',      nome: 'Armatura Magica', tipo: 'Armatura', meta: 'Bonus: +1 / +2 / +3 · scegli tipo armatura' },
        { kind: 'scudo',         nome: 'Scudo Magico',    tipo: 'Scudo',    meta: 'Bonus: +1 / +2 / +3' },
        { kind: 'pozione_cura',  nome: 'Pozione di Cura', tipo: 'Pozione',  meta: 'Comune / Non Comune / Raro / Molto Raro · scegli grado' },
    ];
}

// Varianti della Pozione di Cura (SRD). HP recuperati = dadi + bonus fisso.
// Le mostriamo come una sola "voce generica" del catalogo: l'utente
// seleziona quale grado tra i quattro al momento dell'aggiunta.
const _POTION_HEALING_VARIANTS = [
    { id: 'common',    nome: 'Pozione di Cura',           rarita: 'Comune',     dado: '2d4 + 2',   nome_en: 'Potion of Healing' },
    { id: 'uncommon',  nome: 'Pozione di Cura Maggiore',  rarita: 'Non Comune', dado: '4d4 + 4',   nome_en: 'Potion of Greater Healing' },
    { id: 'rare',      nome: 'Pozione di Cura Superiore', rarita: 'Raro',       dado: '8d4 + 8',   nome_en: 'Potion of Superior Healing' },
    { id: 'very_rare', nome: 'Pozione di Cura Suprema',   rarita: 'Molto Raro', dado: '10d4 + 20', nome_en: 'Potion of Supreme Healing' },
];

function _potionHealingDescription(variant) {
    return `Quando bevi questa pozione, recuperi ${variant.dado} punti ferita. Indipendentemente dalla sua potenza, il liquido rosso della pozione luccica quando viene agitato.`;
}

const _GENERIC_BONUS_OPTS = [
    { bonus: 1, rarita: 'Non Comune' },
    { bonus: 2, rarita: 'Raro' },
    { bonus: 3, rarita: 'Molto Raro' },
];

window._invOpenGenericMagicDialog = function(pgId, kind) {
    if (kind === 'pozione_cura') {
        return _invOpenPotionHealingDialog(pgId);
    }
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const labels = { arma: 'Arma Magica', armatura: 'Armatura Magica', scudo: 'Scudo Magico' };
    const title = labels[kind] || 'Oggetto Magico';
    const bonusBtns = _GENERIC_BONUS_OPTS.map(b => {
        const rarClass = _invRarityClass(b.rarita);
        return `<button type="button" class="generic-magic-bonus-btn ${rarClass}"
            onclick="_invGenericPickType('${pgId}','${kind}',${b.bonus})">
            <span class="generic-magic-bonus">+${b.bonus}</span>
            <span class="generic-magic-rar">${b.rarita}</span>
        </button>`;
    }).join('');
    overlay.innerHTML = `<div class="hp-calc-modal generic-magic-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="generic-magic-title">${escapeHtml(title)}</h3>
        <p class="generic-magic-sub">Step 1 di 2 · Scegli il bonus magico</p>
        <div class="generic-magic-bonus-grid">${bonusBtns}</div>
        <div class="dialog-actions" style="margin-top:14px;justify-content:flex-end;">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
};

window._invGenericPickType = function(pgId, kind, bonus) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    if (kind === 'scudo') {
        // Lo scudo non ha sotto-tipi: aggiungiamo subito.
        _invAddGenericMagicItem(pgId, kind, bonus, 'Scudo');
        return;
    }
    let options = [];
    let labelTipo = '';
    if (kind === 'arma') {
        labelTipo = 'arma';
        const armi = (typeof DND_ARMI !== 'undefined') ? DND_ARMI : [];
        options = armi.map(a => ({
            id: a.nome,
            label: a.nome,
            sub: `${a.danni} ${a.tipo_danno}`,
            cat: a.cat,
        }));
    } else {
        labelTipo = 'armatura';
        const arms = (typeof DND_ARMATURE !== 'undefined') ? DND_ARMATURE : [];
        options = arms.filter(a => a.cat !== 'scudo').map(a => ({
            id: a.nome,
            label: a.nome,
            sub: `CA ${a.ca_base} · ${a.cat}`,
            cat: a.cat,
        }));
    }
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const rar = _GENERIC_BONUS_OPTS.find(b => b.bonus === bonus)?.rarita || 'Non Comune';
    // Raggruppa per categoria per leggibilita'.
    const groups = {};
    for (const o of options) {
        const k = o.cat || 'altro';
        (groups[k] = groups[k] || []).push(o);
    }
    const groupOrder = (kind === 'arma')
        ? ['semplice_mischia', 'semplice_distanza', 'guerra_mischia', 'guerra_distanza']
        : ['leggera', 'media', 'pesante'];
    const groupLabels = {
        semplice_mischia: 'Semplici da Mischia', semplice_distanza: 'Semplici a Distanza',
        guerra_mischia: 'Da Guerra (Mischia)', guerra_distanza: 'Da Guerra (Distanza)',
        leggera: 'Armatura Leggera', media: 'Armatura Media', pesante: 'Armatura Pesante',
    };
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        const ai = groupOrder.indexOf(a); const bi = groupOrder.indexOf(b);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
    const body = sortedKeys.map(k => {
        const rows = groups[k].map(o => `<button type="button" class="generic-magic-type-row"
            onclick="_invAddGenericMagicItem('${pgId}','${kind}',${bonus},'${escapeHtml(o.id).replace(/'/g, "\\'")}')">
            <span class="generic-magic-type-name">${escapeHtml(o.label)}</span>
            <span class="generic-magic-type-sub">${escapeHtml(o.sub)}</span>
        </button>`).join('');
        return `<div class="generic-magic-group-label">${escapeHtml(groupLabels[k] || k)}</div>${rows}`;
    }).join('');
    overlay.innerHTML = `<div class="hp-calc-modal generic-magic-modal generic-magic-modal-wide">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="generic-magic-title">${kind === 'arma' ? 'Arma' : 'Armatura'} +${bonus} <span class="generic-magic-rar-inline">(${escapeHtml(rar)})</span></h3>
        <p class="generic-magic-sub">Step 2 di 2 · Scegli il tipo di ${escapeHtml(labelTipo)}</p>
        <div class="generic-magic-type-list">${body}</div>
        <div class="dialog-actions" style="margin-top:12px;justify-content:space-between;">
            <button class="btn-secondary" onclick="_invOpenGenericMagicDialog('${pgId}','${kind}')">← Indietro</button>
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
};

window._invAddGenericMagicItem = async function(pgId, kind, bonus, tipoSpecifico) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const rar = _GENERIC_BONUS_OPTS.find(b => b.bonus === bonus)?.rarita || 'Non Comune';
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const tipoCatLabel = { arma: 'Arma', armatura: 'Armatura', scudo: 'Scudo' }[kind] || 'Oggetto';
    // Costruisco l'entry replicando la forma usata da invAddFromCatalog,
    // cosi' rimane consistente con gli oggetti del catalogo "fisso".
    // IMPORTANTE: il nome NON deve contenere "+N" perche' il bonus
    // viene gia' mostrato come badge separato in tutte le viste; se
    // lo includessimo nel nome ne vedremmo due (es. "Pugnale +2 +2").
    const nome = tipoSpecifico;
    const entry = {
        nome,
        descrizione: `${tipoCatLabel} magica/o con bonus +${bonus} ai tiri per colpire e ai danni (arma) o alla CA (armatura/scudo).`,
        quantita: 1,
        tipo: tipoCatLabel,
        sotto_tipo: tipoSpecifico,
        rarita: rar,
        richiede_sintonia: false,
        sintonia_dettaglio: '',
        incantamento: bonus,
        magico: true,
        magic_bonus: bonus,
    };
    // Per le armi cerco i dati combat (danni, tipo_danno, proprieta) cosi'
    // che il sistema di equip/danni funzioni come per le armi normali.
    if (kind === 'arma' && typeof DND_ARMI !== 'undefined') {
        const arma = DND_ARMI.find(a => a.nome === tipoSpecifico);
        if (arma) {
            entry.danni = arma.danni;
            entry.tipo_danno = arma.tipo_danno;
            entry.proprieta = arma.proprieta;
            entry.cat = arma.cat;
        }
    }
    if (kind === 'armatura' && typeof DND_ARMATURE !== 'undefined') {
        const arm = DND_ARMATURE.find(a => a.nome === tipoSpecifico);
        if (arm) {
            entry.ca_base = arm.ca_base;
            entry.cat = arm.cat;
            entry.mod_des = arm.mod_des;
            entry.max_des = arm.max_des;
            entry.forza = arm.forza;
            entry.furtivita = arm.furtivita;
        }
    }
    if (kind === 'scudo' && typeof DND_ARMATURE !== 'undefined') {
        const sh = DND_ARMATURE.find(a => a.cat === 'scudo');
        if (sh) {
            entry.ca_base = sh.ca_base;
            entry.cat = sh.cat;
        }
    }
    inventario.push(entry);
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    schedaOpenInventoryPage(pgId);
};

// ──────────────────────────────────────────────────────────────────────
// Voce generica "Pozione di Cura": un solo item nel picker che apre un
// dialog con le 4 varianti SRD (Comune / Maggiore / Superiore / Suprema).
// Click su una variante => aggiunta diretta al tesoro come snapshot.
// ──────────────────────────────────────────────────────────────────────
function _invOpenPotionHealingDialog(pgId) {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const rows = _POTION_HEALING_VARIANTS.map(v => {
        const rarClass = _invRarityClass(v.rarita);
        return `<button type="button" class="generic-magic-type-row ${rarClass}"
            onclick="_invAddPotionHealing('${pgId}','${v.id}')">
            <span class="generic-magic-type-name">${escapeHtml(v.nome)}</span>
            <span class="generic-magic-type-sub">${escapeHtml(v.rarita)} · recupera ${escapeHtml(v.dado)} PF</span>
        </button>`;
    }).join('');
    overlay.innerHTML = `<div class="hp-calc-modal generic-magic-modal generic-magic-modal-wide">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="generic-magic-title">Pozione di Cura</h3>
        <p class="generic-magic-sub">Scegli il grado della pozione</p>
        <div class="generic-magic-type-list">${rows}</div>
        <div class="dialog-actions" style="margin-top:12px;justify-content:flex-end;">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
}

window._invAddPotionHealing = async function(pgId, variantId) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const variant = _POTION_HEALING_VARIANTS.find(v => v.id === variantId);
    if (!variant) return;
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const entry = {
        nome: variant.nome,
        descrizione: _potionHealingDescription(variant),
        quantita: 1,
        tipo: 'Pozione',
        sotto_tipo: 'Cura',
        rarita: variant.rarita,
        richiede_sintonia: false,
        sintonia_dettaglio: '',
        magico: true,
        // Per consultazione veloce dal sistema HP / consumo.
        cura_dado: variant.dado,
    };
    inventario.push(entry);
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    schedaOpenInventoryPage(pgId);
};

// Aggiunge un veleno del catalogo (immutabile) all'inventario come
// snapshot. Il veleno viene salvato come oggetto consumabile con tutte
// le info utili (sotto_tipo, categoria, prezzo, rarita, descrizione).
window.invAddFromVeleni = async function(pgId, veId) {
    const ven = Array.isArray(window.VELENI_DATA) ? window.VELENI_DATA : [];
    const it = ven.find(o => String(o.id) === String(veId));
    if (!it) return;
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const entry = {
        nome: it.nome_it || it.nome_en || 'Veleno',
        descrizione: it.descrizione_it || it.descrizione_en || '',
        quantita: 1,
        tipo: 'Veleno',
        sotto_tipo: it.sotto_tipo_it || it.sotto_tipo_en || '',
        rarita: it.rarita_it || 'Comune',
        magico: false,
        prezzo_mo: it.prezzo_mo || 0,
        _veleno_categoria: it.categoria_it || it.categoria_en || '',
        _veleno_id: it.id,
    };
    inventario.push(entry);
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

window.invQuickCreate = function(pgId) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const rarita = ['Comune','Non Comune','Raro','Molto Raro','Leggendario','Artefatto'];
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal inv-quick-modal" style="width:780px;max-width:96vw;text-align:left;">
        <h3 style="margin-bottom:12px;font-size:1rem;">Crea oggetto rapido</h3>
        <div class="inv-quick-row">
            <input type="text" id="invItemNome" class="hp-calc-input inv-quick-name" placeholder="Nome oggetto">
            <select id="invItemRarita" class="hp-calc-input inv-quick-rarita">
                ${rarita.map(r => `<option value="${r}" ${r === 'Comune' ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
            <input type="number" id="invItemQty" class="hp-calc-input inv-quick-qty" value="1" min="1" title="Quantita'">
        </div>
        ${window.renderTextareaFullscreen({
            id: 'invItemDesc',
            className: 'equip-desc-textarea inv-quick-desc',
            rows: 6,
            placeholder: "Descrizione dell'oggetto...",
            value: '',
        })}
        <div class="dialog-actions" style="margin-top:12px;">
            <button class="btn-secondary" onclick="invAddItem('${pgId}')">Indietro</button>
            <button class="btn-primary" onclick="invSaveNewItem('${pgId}')">Aggiungi</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
};

window.invSaveNewItem = async function(pgId) {
    const nome = document.getElementById('invItemNome')?.value?.trim();
    if (!nome) return;
    const desc = document.getElementById('invItemDesc')?.value?.trim() || '';
    const qty = parseInt(document.getElementById('invItemQty')?.value) || 1;
    const rarita = document.getElementById('invItemRarita')?.value || 'Comune';
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const entry = { nome, descrizione: desc, quantita: qty, rarita };
    // Magico inferito: tutto cio' che non e' "Comune" e' magico per definizione D&D.
    entry.magico = rarita !== 'Comune';
    inventario.push(entry);
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

// Aggiornamento inline della quantita' direttamente dalla riga del
// tesoro. Salta il save se il valore non e' cambiato; supporta sia
// onchange che onblur senza moltiplicare le scritture (debouncing
// implicito via flag pendente sul campo). Per gli oggetti homebrew
// aggiorna solo `quantita`, preservando i metadati di lookup.
// Toggle del popover informativo accanto al titolo del dialog di
// modifica oggetto (sostituisce il vecchio banner fisso).
window.invToggleHbInfo = function(btn) {
    const pop = btn?.parentElement?.querySelector('.inv-edit-info-pop');
    if (!pop) return;
    const wasOpen = !pop.hasAttribute('hidden');
    if (wasOpen) {
        pop.setAttribute('hidden', '');
        return;
    }
    pop.removeAttribute('hidden');
    setTimeout(() => {
        const onDoc = (ev) => {
            if (!pop.contains(ev.target) && ev.target !== btn) {
                pop.setAttribute('hidden', '');
                document.removeEventListener('click', onDoc, true);
            }
        };
        document.addEventListener('click', onDoc, true);
    }, 0);
};

window.invQtyInlineUpdate = async function(pgId, idx, rawVal) {
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const prev = inventario[idx];
    if (!prev) return;
    let qty = parseInt(rawVal, 10);
    if (!Number.isFinite(qty) || qty < 1) qty = 1;
    if (qty > 9999) qty = 9999;
    if ((prev.quantita || 1) === qty) return; // niente da fare
    inventario[idx] = { ...prev, quantita: qty };
    pg.inventario = inventario;
    try {
        await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    } catch (e) {
        console.warn('[inv] errore aggiornamento quantita\' inline:', e);
    }
};

window.invEditItem = function(pgId, idx) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const raw = (pg.inventario || [])[idx];
    if (!raw) return;
    const item = _invResolveLive(raw);
    const isHomebrew = !!raw._homebrew_id;
    const hbMeta = isHomebrew
        ? (item._homebrew_meta || (typeof window.formatOggettoMeta === 'function'
            ? window.formatOggettoMeta({
                tipo: item._homebrew_tipo,
                sotto_tipo: item._homebrew_sotto_tipo,
                rarita: item._homebrew_rarita,
                incantamento: item._homebrew_incantamento,
                richiede_sintonia: item._homebrew_richiede_sintonia,
                sintonia_dettaglio: item._homebrew_sintonia_dettaglio,
            }) : ''))
        : '';
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const lockAttr = isHomebrew ? 'readonly' : '';
    // Sotto-titolo discreto con la formula meta D&D ("Tipo, rarita'
    // (richiede sintonia)"). Sempre visibile per gli homebrew, niente
    // banner ingombrante.
    const metaLine = (isHomebrew && hbMeta)
        ? `<div class="inv-edit-meta">${escapeHtml(hbMeta)}</div>`
        : '';
    // Bottoncino "i" compatto: al click rivela un piccolo popover con
    // il dettaglio "Homebrew di X · live updates". Niente banner fisso.
    const infoBtn = isHomebrew
        ? `<button type="button" class="inv-edit-info-btn"
            title="Informazioni su questo oggetto homebrew"
            onclick="invToggleHbInfo(this)">i</button>
           <div class="inv-edit-info-pop" hidden>
                Homebrew di <b>${escapeHtml(item._homebrew_author || 'Autore')}</b>.<br>
                Nome e descrizione si aggiornano live dall'autore: qui puoi solo vederli.
                Per modificare la quantita' usa il numero accanto all'oggetto nella tabella.
           </div>`
        : '';
    overlay.innerHTML = `<div class="hp-calc-modal inv-edit-modal" style="width:720px;max-width:96vw;text-align:left;">
        <div class="inv-edit-header">
            <h3>Modifica Oggetto</h3>
            ${infoBtn}
        </div>
        <input type="text" id="invItemNome" class="hp-calc-input" value="${escapeHtml(item.nome || '')}" placeholder="Nome" style="margin-bottom:6px;" ${lockAttr}>
        ${metaLine}
        ${isHomebrew
            ? `<div class="equip-desc-rendered">${(item.descrizione && item.descrizione.trim())
                ? window.formatRichText(item.descrizione)
                : '<span class="equip-desc-empty">Nessuna descrizione</span>'}</div>`
            : window.renderTextareaFullscreen({
                id: 'invItemDesc',
                className: 'equip-desc-textarea',
                rows: 10,
                placeholder: 'Descrizione (effetti magici, note...)',
                value: item.descrizione || '',
            })
        }
        <div class="dialog-actions" style="margin-top:12px;">
            <button class="btn-danger" onclick="invDeleteFromEdit('${pgId}',${idx})">Elimina</button>
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
            <button class="btn-primary" onclick="invUpdateItem('${pgId}',${idx})">Salva</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
};

window.invSelectMagicBonus = function(btn, bonus) {
    const row = btn.parentElement;
    if (!row) return;
    row.querySelectorAll('.custom-res-dice-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const hidden = document.getElementById('invItemMagicBonus');
    if (hidden) hidden.value = String(bonus);
};

window.invUpdateItem = async function(pgId, idx) {
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const prev = inventario[idx] || {};

    // Per gli oggetti homebrew non c'e' nulla da modificare nel dialog
    // (nome e descrizione sono read-only e arrivano live dalla cache,
    // la quantita' si modifica inline nella tabella). Ci limitiamo a
    // chiudere il dialog senza salvare.
    if (prev._homebrew_id) {
        document.querySelector('.hp-calc-overlay')?.remove();
        return;
    }

    const nome = document.getElementById('invItemNome')?.value?.trim();
    if (!nome) return;
    const desc = document.getElementById('invItemDesc')?.value?.trim() || '';
    // Conserviamo eventuali metadati storici (magico/magic_bonus) gia'
    // salvati: il dialog non li espone piu' ma non vogliamo perderli su
    // oggetti pre-esistenti.
    const updated = {
        ...prev,
        nome,
        descrizione: desc,
        quantita: prev.quantita || 1,
    };
    inventario[idx] = updated;
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

window.invDeleteFromEdit = async function(pgId, idx) {
    const ok = await _schedaShowConfirmDialog({
        title: 'Eliminare oggetto?',
        message: 'L\'oggetto verra\' rimosso dal tesoro.',
        confirmLabel: 'Elimina', danger: true,
    });
    if (!ok) return;
    document.querySelector('.hp-calc-overlay')?.remove();
    await window.invRemoveItem(pgId, idx);
};

window.invRemoveItem = async function(pgId, idx) {
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    const removed = inventario[idx];
    inventario.splice(idx, 1);
    pg.inventario = inventario;
    // Propaga la rimozione all'equipaggiamento: ogni entry equip
    // creata da questo oggetto del tesoro (matched per _treasure_uid)
    // viene rimossa. La rimozione dall'equip non tocca il tesoro
    // (relazione unidirezionale: equip -> tesoro).
    const removedUid = removed && removed._treasure_uid;
    const updates = { inventario };
    let equipChanged = false;
    let attuneChanged = false;
    if (removedUid) {
        if (Array.isArray(pg.equipaggiamento)) {
            const before = pg.equipaggiamento.length;
            pg.equipaggiamento = pg.equipaggiamento.filter(e => e.from_treasure_uid !== removedUid);
            if (pg.equipaggiamento.length !== before) {
                equipChanged = true;
                updates.equipaggiamento = pg.equipaggiamento;
                const newCA = calcCAFromEquip(pg);
                pg.classe_armatura = newCA;
                updates.classe_armatura = newCA;
            }
        }
        if (Array.isArray(pg.sintonia)) {
            const newSint = pg.sintonia.map(s => {
                if (s && typeof s === 'object' && s.from_treasure_uid === removedUid) {
                    attuneChanged = true;
                    return null;
                }
                return s;
            });
            if (attuneChanged) {
                pg.sintonia = newSint;
                updates.sintonia = newSint;
            }
        }
    }
    await supabase.from('personaggi').update(updates).eq('id', pgId);
    schedaOpenInventoryPage(pgId);
    if (equipChanged && attuneChanged) {
        showNotification('Oggetto rimosso anche da equipaggiamento e sintonia');
    } else if (equipChanged) {
        showNotification('Oggetto rimosso anche dall\'equipaggiamento');
    } else if (attuneChanged) {
        showNotification('Oggetto rimosso anche dalla sintonia');
    }
};

// Estrae dal tesoro tutti gli oggetti che richiedono sintonia (catalogo
// SRD o homebrew). Esclude eventuali entry gia' usate da uno slot di
// sintonia diverso da quello in editing (per non duplicare).
function _schedaInvAttunableItems(pg, currentSlotIdx) {
    if (!pg || !Array.isArray(pg.inventario)) return [];
    const sintonia = Array.isArray(pg.sintonia) ? pg.sintonia : [];
    const usedUids = new Set();
    sintonia.forEach((s, i) => {
        if (i === currentSlotIdx) return;
        if (s && typeof s === 'object' && s.from_treasure_uid) usedUids.add(s.from_treasure_uid);
    });
    const out = [];
    pg.inventario.forEach((entry, index) => {
        const view = (typeof window._invResolveLive === 'function')
            ? window._invResolveLive(entry) : entry;
        const requires = !!(view.richiede_sintonia || view._homebrew_richiede_sintonia);
        if (!requires) return;
        if (entry._treasure_uid && usedUids.has(entry._treasure_uid)) return;
        out.push({ index, view });
    });
    return out;
}

window.invEditAttune = function(pgId, idx) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const raw = (pg.sintonia || [])[idx] || null;
    const current = (raw && typeof raw === 'object')
        ? raw
        : (raw ? { nome: String(raw) } : null);

    let currentHtml = '';
    let pickerHtml = '';
    if (current) {
        const bonus = current.magic_bonus || 0;
        const nameWithEnch = `${escapeHtml(_invDisplayName(current) || 'Oggetto')}${bonus ? ' +' + bonus : ''}`;
        const descHtml = current.descrizione
            ? `<div class="inv-attune-current-desc">${(typeof window.formatRichText === 'function' ? window.formatRichText(current.descrizione) : escapeHtml(current.descrizione))}</div>`
            : '<div class="inv-attune-current-desc inv-attune-current-desc-empty">Nessuna descrizione disponibile per questo oggetto.</div>';
        currentHtml = `<div class="inv-attune-current">
            <div class="inv-attune-current-head">
                <div>
                    <div class="inv-attune-current-label">Slot occupato da</div>
                    <div class="inv-attune-current-name">${nameWithEnch}</div>
                </div>
                <button class="btn-danger" onclick="invDeleteAttuneFromEdit('${pgId}',${idx})">Libera slot</button>
            </div>
            ${descHtml}
        </div>`;
    } else {
        const attunable = _schedaInvAttunableItems(pg, idx);
        const treasureRows = attunable.length ? attunable.map(({ index, view }) => {
            const ench = view.magic_bonus || view._homebrew_incantamento || 0;
            const sub = view._homebrew_sotto_tipo || view.sotto_tipo || '';
            const rar = view._homebrew_rarita || view.rarita || '';
            const rarClass = _invRarityClass(rar);
            const subText = [sub, rar].filter(Boolean).join(' · ') || 'Richiede sintonia';
            return `<button type="button" class="inv-attune-pick-row ${rarClass}"
                    onclick="invAttuneFromTreasure('${pgId}',${idx},${index})">
                <span class="inv-attune-pick-name">${escapeHtml(_invDisplayName(view) || 'Oggetto')}${ench ? ' +' + ench : ''}</span>
                <span class="inv-attune-pick-sub">${escapeHtml(subText)}</span>
            </button>`;
        }).join('') : `<div class="inv-attune-pick-empty">
                Nessun oggetto che richiede sintonia nel tuo tesoro.<br>
                <small>Aggiungi prima l'oggetto al tesoro, poi torna qui per assegnarlo a uno slot di sintonia.</small>
            </div>`;
        pickerHtml = `<div class="inv-attune-pick-section">
            <div class="inv-attune-pick-label">Scegli dal Tesoro</div>
            <div class="inv-attune-pick-list">${treasureRows}</div>
        </div>`;
    }

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal inv-attune-modal">
        <button class="hp-calc-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <div class="hp-calc-title">Sintonia – Slot ${idx + 1}</div>
        ${currentHtml}
        ${pickerHtml}
        <div class="dialog-actions inv-attune-actions">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Chiudi</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
};

// Salva immediatamente l'oggetto del tesoro selezionato nello slot di sintonia.
window.invAttuneFromTreasure = async function(pgId, slotIdx, invIndex) {
    const pg = _schedaPgCache;
    if (!pg || !Array.isArray(pg.inventario)) return;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const desc = view.descrizione || view._homebrew_meta || '';
    const uid = _schedaEnsureInvUid(pg.inventario, invIndex);

    const slot = { nome: _invDisplayName(view) || view.nome || 'Oggetto' };
    if (desc) slot.descrizione = desc;
    if (ench > 0) slot.magic_bonus = ench;
    if (uid) slot.from_treasure_uid = uid;

    const sintonia = pg.sintonia ? [...pg.sintonia] : [null, null, null];
    while (sintonia.length < 3) sintonia.push(null);
    sintonia[slotIdx] = slot;
    pg.sintonia = sintonia;

    const updates = { sintonia };
    if (uid) updates.inventario = pg.inventario;
    await supabase.from('personaggi').update(updates).eq('id', pgId);

    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

window.invDeleteAttuneFromEdit = async function(pgId, idx) {
    const ok = await _schedaShowConfirmDialog({
        title: 'Liberare lo slot?',
        message: 'L\'oggetto verra\' rimosso dallo slot di sintonia (resta nel tesoro).',
        confirmLabel: 'Libera', danger: true,
    });
    if (!ok) return;
    document.querySelector('.hp-calc-overlay')?.remove();
    await window.invRemoveAttune(pgId, idx);
};

window.invRemoveAttune = async function(pgId, idx) {
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const sintonia = pg.sintonia ? [...pg.sintonia] : [null, null, null];
    sintonia[idx] = null;
    pg.sintonia = sintonia;
    await supabase.from('personaggi').update({ sintonia }).eq('id', pgId);
    schedaOpenInventoryPage(pgId);
};

/* ──────────────────────────────────────────────────────────────────────
   Privilegi Tab
   Schema dati pg.privilegi:
   {
     hidden_auto: ['<class_slug>:<feature_name_en>', ...],   // privilegi auto-popolati nascosti
     custom_features: { '<TabName>': [{name, level, description}] },
     custom_tabs_order: ['Razza','Background', ...]          // ordine + presenza tabelle custom
   }
   ────────────────────────────────────────────────────────────────────── */

// Tabelle custom presenti di default nella pagina Privilegi.
// Nota: "Talenti" non e' qui perche' viene gestito come sezione speciale legata a pg.talenti.
const PRIV_DEFAULT_CUSTOM_TABS = ['Razza', 'Background'];

function _classesData() { return window.CLASSES_DATA || []; }

function _getClassData(slug) {
    if (!slug) return null;
    return _classesData().find(c =>
        c.slug === slug ||
        (c.name_en || '').toLowerCase() === String(slug).toLowerCase() ||
        (c.name || '').toLowerCase() === String(slug).toLowerCase()
    ) || null;
}

function _normalizePrivilegi(pg) {
    const p = pg.privilegi || {};
    let order = Array.isArray(p.custom_tabs_order)
        ? [...p.custom_tabs_order]
        : [...PRIV_DEFAULT_CUSTOM_TABS];
    if (!order.includes('Razza')) order.unshift('Razza');
    // Riporta "Background" tra le tabelle predefinite (auto-popola dal dataset locale).
    if (!order.includes('Background')) {
        const i = order.indexOf('Razza');
        if (i >= 0) order.splice(i + 1, 0, 'Background');
        else order.push('Background');
    }
    return {
        hidden_auto: Array.isArray(p.hidden_auto) ? [...p.hidden_auto] : [],
        custom_features: (p.custom_features && typeof p.custom_features === 'object')
            ? { ...p.custom_features } : {},
        custom_tabs_order: order,
        // Tabelle custom della pagina 1 (Statistiche). Stesso schema delle
        // tabelle custom della pagina 2.
        p1_tabs_order: Array.isArray(p.p1_tabs_order) ? [...p.p1_tabs_order] : [],
        p1_features: (p.p1_features && typeof p.p1_features === 'object')
            ? { ...p.p1_features } : {},
    };
}

/** Sceglie il nome localizzato (IT/EN) di una classe/sottoclasse in base alla lingua corrente. */
function _localizedClassName(entry) {
    if (!entry) return '';
    const lang = _spellLang();
    if (lang === 'en') return entry.name_en || entry.name || '';
    return entry.name || entry.name_en || '';
}

function _autoFeaturesForClass(clsEntry, pgClassLevel) {
    const cls = _getClassData(clsEntry.nome);
    if (!cls) return { className: clsEntry.nome, features: [], subclassName: null, subFeatures: [] };
    const lvl = parseInt(pgClassLevel || clsEntry.livello || 1) || 1;
    const features = (cls.features || [])
        .filter(f => !f.level || f.level <= lvl)
        .map(f => ({
            source: cls.slug,
            source_label: _localizedClassName(cls),
            name_en: f.name_en,
            name: f.name || f.name_en,
            level: f.level,
            description: f.description || '',
            description_en: f.description_en || '',
            translated: !!f.translated,
        }));
    let subclassName = null;
    let subFeatures = [];
    // ── Sottoclasse HOMEBREW: lo slug è 'hb:<id>' e i dati stanno in cache. ──
    if (clsEntry.sottoclasse_homebrew_id || (clsEntry.sottoclasseSlug || '').startsWith('hb:')) {
        const hbId = clsEntry.sottoclasse_homebrew_id
            || String(clsEntry.sottoclasseSlug || '').replace(/^hb:/, '');
        const cache = (typeof AppState !== 'undefined' && Array.isArray(AppState.cachedHomebrewSottoclassi))
            ? AppState.cachedHomebrewSottoclassi : [];
        const hb = cache.find(r => String(r.id) === String(hbId));
        if (hb) {
            subclassName = hb.nome || clsEntry.sottoclasse || 'Sottoclasse Homebrew';
            const feats = Array.isArray(hb.sottoclasse_features) ? hb.sottoclasse_features : [];
            subFeatures = feats
                .filter(f => !f.level || parseInt(f.level) <= lvl)
                .map(f => ({
                    source: cls.slug + ':hb:' + hbId,
                    source_label: subclassName,
                    name_en: f.name || f.nome || '',
                    name: f.name || f.nome || '',
                    level: parseInt(f.level) || null,
                    description: f.description || f.descrizione || '',
                    description_en: f.description || f.descrizione || '',
                    translated: true,
                    _isHomebrew: true,
                }));
        } else {
            // Fallback: la cache homebrew non è ancora disponibile.
            subclassName = clsEntry.sottoclasse || 'Sottoclasse Homebrew';
        }
    } else if (cls.subclasses && cls.subclasses.length > 0 && clsEntry.sottoclasseSlug) {
        const sub = cls.subclasses.find(s => s.slug === clsEntry.sottoclasseSlug);
        if (sub) {
            subclassName = _localizedClassName(sub);
            subFeatures = (sub.features || [])
                .filter(f => !f.level || f.level <= lvl)
                .map(f => ({
                    source: cls.slug + ':' + sub.slug,
                    source_label: subclassName,
                    name_en: f.name_en,
                    name: f.name || f.name_en,
                    level: f.level,
                    description: f.description || '',
                    description_en: f.description_en || '',
                    translated: !!f.translated,
                }));
        }
    }
    return { className: _localizedClassName(cls), features, subclassName, subFeatures };
}

/** Estrae nome/descrizione localizzati di un privilegio (auto o custom) in base alla lingua corrente. */
function _privFeatField(f, key) {
    if (!f) return '';
    const lang = _spellLang();
    if (key === 'name') {
        if (lang === 'en') return f.name_en || f.name || '';
        return f.name || f.name_en || '';
    }
    if (key === 'description') {
        if (lang === 'en') return f.description_en || f.description || '';
        return f.description || f.description_en || '';
    }
    return '';
}

function _privFeatureKey(source, nameEn) {
    return `${source}:${nameEn}`;
}

function _renderPrivFeatureRow(f, opts = {}) {
    const isHidden = !!opts.hidden;
    const isCustom = !!opts.custom;
    const name = _privFeatField(f, 'name');
    const desc = _privFeatField(f, 'description').trim();
    const hasDesc = desc.length > 0;
    const lvlBadge = f.level
        ? `<span class="priv-feat-level">Lv ${f.level}</span>`
        : `<span class="priv-feat-level priv-feat-level-empty">—</span>`;
    // Mostra il badge "EN" solo quando la lingua corrente e' italiano ma esiste solo la versione inglese.
    const lang = _spellLang();
    const showEnWarn = lang === 'it' && !f.translated && !isCustom && f.description_en && !f.description;
    const langWarn = showEnWarn
        ? `<span class="priv-feat-en-badge" title="Descrizione disponibile solo in inglese">EN</span>`
        : '';
    const editFn = opts.editFn || (isCustom
        ? `privEditCustom('${escapeHtml(opts.tabName || '')}',${opts.index})`
        : '');
    // Per le righe custom: il click sull'header toggla il body (come per
    // i privilegi auto). Se non c'e' descrizione, il click apre l'editor
    // per evitare un'azione "morta". La matita affiancata apre sempre
    // l'editor.
    const isClickable = hasDesc || isCustom;
    const headerClass = `priv-feat-header${isClickable ? ' priv-feat-clickable' : ''}${isHidden ? ' priv-feat-hidden' : ''}`;
    const headerOnclick = hasDesc
        ? `onclick="privToggleFeatureBody(this)"`
        : (isCustom && editFn ? `onclick="${editFn}"` : '');
    const arrowHtml = hasDesc ? '<span class="priv-feat-arrow">▾</span>' : '';
    const editBtn = (isCustom && editFn)
        ? `<button class="priv-feat-edit-btn" onclick="event.stopPropagation();${editFn}" title="Modifica">&#9998;</button>`
        : '';
    return `<div class="priv-feat-row${isHidden ? ' priv-feat-row-hidden' : ''}">
        <div class="${headerClass}" ${headerOnclick}>
            ${lvlBadge}
            <span class="priv-feat-name">${escapeHtml(name)}${langWarn}</span>
            ${arrowHtml}
            ${editBtn}
        </div>
        ${hasDesc ? `<div class="priv-feat-body" style="display:none;">${_privDescToHtml(desc)}</div>` : ''}
    </div>`;
}

function _privDescToHtml(desc) {
    // Delegato al formatter unico dell'app: garantisce una sintassi
    // coerente ovunque (**bold**, *bold*, _italic_, "- bullet").
    const html = window.formatRichText(desc);
    return html;
}

window.privToggleFeatureBody = function(headerEl) {
    if (!headerEl) return;
    const row = headerEl.closest('.priv-feat-row');
    if (!row) return;
    const body = row.querySelector('.priv-feat-body');
    const arrow = headerEl.querySelector('.priv-feat-arrow');
    if (!body) return;
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : '';
    if (arrow) arrow.style.transform = open ? '' : 'rotate(180deg)';
};

// ============================================================
// Tabelle custom della pagina 1 (sotto Risorse)
// Schema identico alla tabella "Risorse": ogni voce e' una risorsa
// consumabile { nome, tipo: 'punti'|'dadi', max, current, dado? }.
// Persistite in pg.privilegi.p1_tabs_order / p1_features.
// ============================================================
function _buildP1CustomTablesHtml(pg) {
    const priv = _normalizePrivilegi(pg);
    if (!priv.p1_tabs_order || priv.p1_tabs_order.length === 0) return '';
    return priv.p1_tabs_order.map(tabName => {
        const items = (priv.p1_features[tabName] || []).filter(r => r && typeof r === 'object' && r.nome != null);
        const rowsHtml = items.length > 0
            ? items.map((r, i) => {
                const max = Number.isFinite(parseInt(r.max)) ? parseInt(r.max) : 1;
                const current = (r.current != null) ? r.current : max;
                const label = r.tipo === 'dadi' && r.dado
                    ? `${escapeHtml(r.nome)} <small>(${escapeHtml(r.dado)})</small>`
                    : escapeHtml(r.nome);
                const tabKey = JSON.stringify(tabName).replace(/"/g, '&quot;');
                return `<div class="scheda-hd-row">
                    <span class="scheda-hd-total scheda-hd-total-clickable" onclick="schedaOpenP1TabRes('${pg.id}',${tabKey},${i})" title="Modifica / elimina">${label}</span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaP1TabResChange('${pg.id}',${tabKey},${i},${current},-1,${max})">−</button>
                        <span class="scheda-hd-val">${current}</span>
                        <span class="scheda-hd-max">/ ${max}</span>
                        <button class="scheda-hd-btn" onclick="schedaP1TabResChange('${pg.id}',${tabKey},${i},${current},1,${max})">+</button>
                    </div>
                </div>`;
            }).join('')
            : '<span class="scheda-empty">Nessuna risorsa</span>';
        const tabKey = JSON.stringify(tabName).replace(/"/g, '&quot;');
        const sectionKey = 'p1tab:' + tabName;
        const open = window._schedaOpenSections && window._schedaOpenSections.has(sectionKey);
        return `<div class="scheda-section${open ? '' : ' collapsed'}" data-section-key="${escapeHtml(sectionKey)}">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">${escapeHtml(tabName)}
                <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenP1TabRes('${pg.id}',${tabKey})" title="Aggiungi risorsa">&#9998;</button>
                <button class="scheda-edit-btn priv-tab-remove" onclick="event.stopPropagation();p1RemoveTab(${tabKey})" title="Rimuovi tabella">✕</button>
            </div>
            <div class="scheda-section-body">
                ${items.length > 0 ? `<div class="scheda-hd-table">${rowsHtml}</div>` : rowsHtml}
            </div>
        </div>`;
    }).join('');
}

async function _p1Save(pgId, priv) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    if (_schedaPgCache) _schedaPgCache.privilegi = priv;
    try {
        const { error } = await supabase.from('personaggi')
            .update({ privilegi: priv, updated_at: new Date().toISOString() })
            .eq('id', pgId);
        if (error) {
            console.error('[p1 custom tabs] save failed', error);
            const msg = (error.message || '').toLowerCase();
            if (msg.includes("'privilegi'") || msg.includes('"privilegi"') || msg.includes('column')) {
                showNotification && showNotification('Manca la colonna "privilegi" sul DB. Esegui sql/add-all-missing-columns.sql');
            } else {
                showNotification && showNotification('Salvataggio fallito: ' + (error.message || 'errore'));
            }
            return false;
        }
        return true;
    } catch (e) {
        console.warn('[p1 custom tabs] save failed', e);
        showNotification && showNotification('Salvataggio fallito: ' + (e.message || 'errore'));
        return false;
    }
}

window.p1AddTab = async function() {
    const name = await _schedaShowInputDialog({
        title: 'Nuova tabella (Pagina 1)',
        placeholder: 'Es. Note, Trofei',
    });
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    if (priv.p1_tabs_order.includes(trimmed)) {
        showNotification && showNotification('Esiste già una tabella con questo nome');
        return;
    }
    priv.p1_tabs_order.push(trimmed);
    priv.p1_features[trimmed] = [];
    if (window._schedaOpenSections) window._schedaOpenSections.add('p1tab:' + trimmed);
    _p1Save(pg.id, priv).then(() => openSchedaPersonaggio(pg.id));
};

window.p1RemoveTab = async function(tabName) {
    const ok = await _schedaShowConfirmDialog({
        title: 'Rimuovere tabella?',
        message: `La tabella "${tabName}" e tutte le sue voci verranno eliminate.`,
        confirmLabel: 'Elimina', danger: true,
    });
    if (!ok) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    priv.p1_tabs_order = priv.p1_tabs_order.filter(t => t !== tabName);
    delete priv.p1_features[tabName];
    _p1Save(pg.id, priv).then(() => openSchedaPersonaggio(pg.id));
};

// Decremento/Incremento di una risorsa di una tabella custom di pagina 1.
window.schedaP1TabResChange = async function(pgId, tabName, index, current, delta, max) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const priv = _normalizePrivilegi(pg);
    const arr = priv.p1_features[tabName];
    if (!Array.isArray(arr)) return;
    const item = arr[index];
    if (!item) return;
    const newVal = Math.max(0, Math.min(max, current + delta));
    item.current = newVal;
    pg.privilegi = priv;
    const supabase = getSupabaseClient();
    if (supabase) {
        try {
            const { error } = await supabase.from('personaggi')
                .update({ privilegi: priv, updated_at: new Date().toISOString() })
                .eq('id', pgId);
            if (error) console.warn('[p1 custom res] save failed', error);
        } catch (e) { console.warn('[p1 custom res] save failed', e); }
    }
    openSchedaPersonaggio(pgId);
};

// Apre la dialog "Aggiungi/Modifica risorsa" per una tabella custom di pagina 1.
window.schedaOpenP1TabRes = function(pgId, tabName, editIndex) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const priv = _normalizePrivilegi(pg);
    const list = Array.isArray(priv.p1_features[tabName]) ? priv.p1_features[tabName] : [];
    const editing = (editIndex != null && editIndex >= 0);
    const existing = editing ? list[editIndex] : null;
    const initialType = (existing && existing.tipo === 'dadi') ? 'dadi' : 'punti';
    const initialDado = (existing && existing.dado) ? existing.dado : 'd8';
    const initialNome = existing ? (existing.nome || '') : '';
    const initialMax  = existing && Number.isFinite(parseInt(existing.max)) ? parseInt(existing.max) : 1;

    const dadiBtns = ['d4','d6','d8','d10','d12','d20'].map(d =>
        `<button type="button" class="btn-secondary custom-res-dice-btn ${d === initialDado ? 'active' : ''}" onclick="schedaCrDadoSelect('${d}')">${d}</button>`
    ).join('');

    const tabKey = JSON.stringify(tabName).replace(/"/g, '&quot;');
    const confirmFn = editing
        ? `schedaConfirmP1TabRes('${pgId}',${tabKey},${editIndex})`
        : `schedaConfirmP1TabRes('${pgId}',${tabKey})`;
    const deleteBtn = editing
        ? `<button type="button" class="btn-danger" onclick="schedaP1TabResDeleteFromEdit('${pgId}',${tabKey},${editIndex})">Elimina</button>`
        : '';

    document.getElementById('p1TabResModal')?.remove();
    const modalHtml = `
    <div class="modal active" id="p1TabResModal">
        <div class="modal-content">
            <button class="modal-close" onclick="document.getElementById('p1TabResModal')?.remove();document.body.style.overflow='';">&times;</button>
            <h2>${editing ? 'Modifica Risorsa' : `Aggiungi a ${escapeHtml(tabName)}`}</h2>
            <div class="form-group">
                <label class="form-label">Nome della risorsa</label>
                <input type="text" id="p1TabResNome" class="form-input" placeholder="Es. Frecce, Pozioni, Cariche" value="${escapeHtml(initialNome)}">
            </div>
            <div class="form-group">
                <label class="form-label">Tipo</label>
                <div class="custom-res-type-row">
                    <button type="button" class="btn-secondary custom-res-type-btn ${initialType === 'punti' ? 'active' : ''}" id="crTypePunti" onclick="schedaCrTypeSelect('punti')">Punti</button>
                    <button type="button" class="btn-secondary custom-res-type-btn ${initialType === 'dadi'  ? 'active' : ''}" id="crTypeDadi" onclick="schedaCrTypeSelect('dadi')">Dadi</button>
                </div>
            </div>
            <div class="form-group" id="crDadoGroup" style="display:${initialType === 'dadi' ? '' : 'none'};">
                <label class="form-label">Tipo di dado</label>
                <div class="custom-res-dice-row">${dadiBtns}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Utilizzi massimi</label>
                <input type="number" id="p1TabResMax" class="form-input" min="1" value="${initialMax}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)">
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <div>${deleteBtn}</div>
                <div style="display:flex;gap:8px;">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('p1TabResModal')?.remove();document.body.style.overflow='';">Annulla</button>
                    <button type="button" class="btn-primary" onclick="${confirmFn}">${editing ? 'Salva' : 'Aggiungi'}</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    window._crType = initialType;
    window._crDado = initialDado;
};

window.schedaConfirmP1TabRes = async function(pgId, tabName, editIndex) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const nome = document.getElementById('p1TabResNome')?.value?.trim();
    if (!nome) { showNotification && showNotification('Inserisci un nome', 'error'); return; }
    const max = parseInt(document.getElementById('p1TabResMax')?.value) || 1;
    const tipo = window._crType || 'punti';
    const priv = _normalizePrivilegi(pg);
    if (!Array.isArray(priv.p1_features[tabName])) priv.p1_features[tabName] = [];
    const arr = priv.p1_features[tabName];
    const editing = (editIndex != null && editIndex >= 0 && arr[editIndex]);
    if (editing) {
        const prev = arr[editIndex];
        const prevCurrent = Number.isFinite(parseInt(prev.current)) ? parseInt(prev.current) : max;
        const updated = { nome, tipo, max, current: Math.max(0, Math.min(prevCurrent, max)) };
        if (tipo === 'dadi') updated.dado = window._crDado || 'd8';
        arr[editIndex] = updated;
    } else {
        const newRes = { nome, tipo, max, current: max };
        if (tipo === 'dadi') newRes.dado = window._crDado || 'd8';
        arr.push(newRes);
    }
    await _p1Save(pgId, priv);
    document.getElementById('p1TabResModal')?.remove();
    document.body.style.overflow = '';
    openSchedaPersonaggio(pgId);
    showNotification && showNotification(editing ? 'Risorsa aggiornata' : 'Risorsa aggiunta');
};

window.schedaP1TabResDeleteFromEdit = async function(pgId, tabName, index) {
    const ok = await _schedaShowConfirmDialog({
        title: 'Eliminare risorsa?',
        message: 'La risorsa verra\' eliminata definitivamente.',
        confirmLabel: 'Elimina', danger: true,
    });
    if (!ok) return;
    document.getElementById('p1TabResModal')?.remove();
    document.body.style.overflow = '';
    await schedaP1TabResDelete(pgId, tabName, index);
};

window.schedaP1TabResDelete = async function(pgId, tabName, index) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const priv = _normalizePrivilegi(pg);
    const arr = priv.p1_features[tabName];
    if (!Array.isArray(arr) || !arr[index]) return;
    arr.splice(index, 1);
    await _p1Save(pgId, priv);
    openSchedaPersonaggio(pgId);
    showNotification && showNotification('Risorsa rimossa');
};

window.schedaOpenPrivilegesPage = async function(pgId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
    if (!pg) return;
    _schedaPgCache = pg;

    window._schedaCurrentPgId = pgId;
    window._schedaCurrentTab = 'privilegi';

    const priv = _normalizePrivilegi(pg);
    const classi = pg.classi || [];

    // ── Sezione Classe (per ogni classe del multiclass) ──
    let classBlocks = '';
    let subclassBlocks = '';
    if (classi.length === 0) {
        classBlocks = '<span class="scheda-empty">Nessuna classe selezionata</span>';
    } else {
        classi.forEach(c => {
            const data = _autoFeaturesForClass(c, c.livello);
            const classTitle = `${escapeHtml(data.className)} - Livello ${c.livello || 1}`;
            const rows = data.features.length > 0
                ? data.features.map(f => {
                    const key = _privFeatureKey(f.source, f.name_en);
                    return _renderPrivFeatureRow(f, { hidden: priv.hidden_auto.includes(key), featKey: key });
                  }).join('')
                : '<span class="scheda-empty">Nessun privilegio disponibile a questo livello</span>';
            classBlocks += `<div class="priv-subblock">
                <div class="priv-subblock-title">${classTitle}</div>
                <div class="priv-feat-list-wrap">${rows}</div>
            </div>`;

            if (data.subclassName) {
                const subRows = data.subFeatures.length > 0
                    ? data.subFeatures.map(f => {
                        const key = _privFeatureKey(f.source, f.name_en);
                        return _renderPrivFeatureRow(f, { hidden: priv.hidden_auto.includes(key), featKey: key });
                      }).join('')
                    : '<span class="scheda-empty">Nessun privilegio di sottoclasse a questo livello</span>';
                subclassBlocks += `<div class="priv-subblock">
                    <div class="priv-subblock-title">${escapeHtml(data.subclassName)} (${escapeHtml(data.className)})</div>
                    <div class="priv-feat-list-wrap">${subRows}</div>
                </div>`;
            }
        });
    }

    // ── Sezioni custom ──
    // Le tabelle PREDEFINITE (Razza, Background) vengono renderizzate
    // PRIMA di "Talenti", perche' fanno parte della base del personaggio.
    // Le tabelle CREATE DALL'UTENTE invece vanno DOPO "Talenti", cosi' i
    // privilegi automatici/standard restano in alto e l'utente personalizza
    // in fondo.
    let customDefaultSectionsHtml = '';  // Razza + Background (sopra a Talenti)
    let customUserSectionsHtml = '';     // Tabelle utente (sotto a Talenti)
    priv.custom_tabs_order.forEach(tabName => {
        const items = priv.custom_features[tabName] || [];
        let autoRows = '';
        // Per la tabella "Razza" auto-popola con i tratti dal dataset locale
        // (window.RACES_DATA), poi aggiunge le voci custom dell'utente.
        if (tabName === 'Razza') {
            const raceTraits = _pgRaceMergedTraits(pg);
            if (raceTraits.length > 0) {
                const merged = buildMergedRaceData(pg.razza, pg.sottorazza || null);
                const subraceLabel = merged && merged.sottorazza
                    ? ` <span class="priv-subblock-title-sub">(${escapeHtml(merged.sottorazza)})</span>`
                    : '';
                const headerLabel = `${escapeHtml(pg.razza || '')}${subraceLabel}`;
                const traitRows = raceTraits.map(t => _renderPrivFeatureRow({
                    name: t.name,
                    name_en: t.name_en,
                    description: t.description || '',
                    translated: true,
                }, {})).join('');
                autoRows = `<div class="priv-subblock">
                    <div class="priv-subblock-title">${headerLabel}</div>
                    <div class="priv-feat-list-wrap">${traitRows}</div>
                </div>`;
            }
        }
        // Per la tabella "Background" auto-popola il privilegio dal dataset
        // locale (window.BACKGROUNDS_DATA). Mostra anche un riepilogo di
        // skills/strumenti/lingue/equipaggiamento iniziale + oro come info.
        if (tabName === 'Background' && pg.background) {
            const bg = getBackgroundData(pg.background);
            if (bg && bg._local) {
                const featRows = bg.privilegio_nome
                    ? _renderPrivFeatureRow({
                        name: bg.privilegio_nome,
                        description: bg.privilegio_descrizione || '',
                        translated: true,
                    }, {})
                    : '';
                const infoLines = [];
                if (bg.competenze_abilita && bg.competenze_abilita.length) {
                    const skillNames = bg.competenze_abilita.map(k => {
                        const s = DND_SKILLS.find(x => x.key === k);
                        return s ? s.nome : k;
                    });
                    infoLines.push(`<div class="bg-info-line"><strong>Abilita':</strong> ${escapeHtml(skillNames.join(', '))}</div>`);
                }
                if (bg.scelte_abilita_testo) {
                    infoLines.push(`<div class="bg-info-line"><strong>Abilita' (a scelta):</strong> ${escapeHtml(bg.scelte_abilita_testo)}</div>`);
                }
                if (bg.competenze_strumenti && bg.competenze_strumenti.length) {
                    infoLines.push(`<div class="bg-info-line"><strong>Strumenti:</strong> ${escapeHtml(bg.competenze_strumenti.join(', '))}</div>`);
                }
                if (bg.scelte_strumenti_testo) {
                    infoLines.push(`<div class="bg-info-line"><strong>Strumenti (a scelta):</strong> ${escapeHtml(bg.scelte_strumenti_testo)}</div>`);
                }
                if (bg.linguaggi_testo) {
                    infoLines.push(`<div class="bg-info-line"><strong>Linguaggi:</strong> ${escapeHtml(bg.linguaggi_testo)}</div>`);
                } else if (bg.linguaggi_specifici && bg.linguaggi_specifici.length) {
                    infoLines.push(`<div class="bg-info-line"><strong>Linguaggi:</strong> ${escapeHtml(bg.linguaggi_specifici.join(', '))}</div>`);
                }
                if (bg.equipaggiamento_iniziale && bg.equipaggiamento_iniziale.length) {
                    const eqHtml = bg.equipaggiamento_iniziale.map(e => `<li>${escapeHtml(e)}</li>`).join('');
                    infoLines.push(`<div class="bg-info-line"><strong>Equipaggiamento iniziale:</strong><ul class="bg-info-eq">${eqHtml}</ul></div>`);
                }
                if (bg.oro_iniziale) {
                    infoLines.push(`<div class="bg-info-line"><strong>Oro iniziale:</strong> ${bg.oro_iniziale} mo</div>`);
                }
                const infoBlock = infoLines.length
                    ? `<div class="bg-info-block">${infoLines.join('')}</div>`
                    : '';
                autoRows = `<div class="priv-subblock">
                    <div class="priv-subblock-title">${escapeHtml(pg.background)} <span class="priv-subblock-title-sub">(${escapeHtml(bg.fonte || '')})</span></div>
                    ${infoBlock}
                    <div class="priv-feat-list-wrap">${featRows}</div>
                </div>`;
            }
        }
        const rows = items.length > 0
            ? items.map((f, i) => _renderPrivFeatureRow(f, { custom: true, tabName, index: i })).join('')
            : (autoRows ? '' : '<span class="scheda-empty">Nessun privilegio aggiunto</span>');
        const isDefault = PRIV_DEFAULT_CUSTOM_TABS.includes(tabName);
        // Le tabelle predefinite (Razza/Background) hanno solo "aggiungi
        // privilegio". Le tabelle create dall'utente hanno la matita che
        // apre un mini-editor con: rinomina + aggiungi privilegio + elimina.
        const editBtn = isDefault
            ? `<button class="scheda-edit-btn" onclick="event.stopPropagation();privAddCustom('${escapeHtml(tabName)}')" title="Aggiungi privilegio">&#9998;</button>`
            : `<button class="scheda-edit-btn" onclick="event.stopPropagation();privOpenCustomTabEdit('${escapeHtml(tabName)}')" title="Modifica tabella">&#9998;</button>`;
        const sectionHtml = `<div class="scheda-section collapsed">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">${escapeHtml(tabName)}
                ${editBtn}
            </div>
            <div class="scheda-section-body">${autoRows}${rows}</div>
        </div>`;
        if (isDefault) customDefaultSectionsHtml += sectionHtml;
        else customUserSectionsHtml += sectionHtml;
    });

    // Sezione Talenti: come tendine espandibili coerenti con le altre
    // tabelle di Pagina 2 (header con nome, dropdown con descrizione).
    const talentiData = _featsData();
    // Indici secondari per matching robusto (per name_en, per slug, e
    // ignorando apostrofi/accenti).
    const _normFeat = s => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['\u2019\s]/g, '');
    const featByEn = {};
    const featBySlug = {};
    const featByNorm = {};
    Object.values(talentiData).forEach(f => {
        if (f.name_en) featByEn[f.name_en] = f;
        if (f.slug) featBySlug[f.slug] = f;
        if (f.name) featByNorm[_normFeat(f.name)] = f;
        if (f.name_en) featByNorm[_normFeat(f.name_en)] = f;
    });
    const talentiRows = (pg.talenti && pg.talenti.length > 0)
        ? pg.talenti.map(t => {
            const nome = typeof t === 'string' ? t : (t && t.name) || '';
            const feat = talentiData[nome]
                || featByEn[nome]
                || featByNorm[_normFeat(nome)]
                || (t && t.slug && featBySlug[t.slug])
                || null;
            const dispName = (feat && feat.name) || nome;
            const desc = feat
                ? (feat.description || feat.description_en || '')
                : (typeof t === 'object' && t.description) || '(descrizione non disponibile)';
            return _renderPrivFeatureRow({
                name: dispName,
                name_en: feat ? feat.name_en : '',
                description: desc,
                description_en: feat ? feat.description_en : '',
                translated: feat ? !!feat.translated : true,
                level: null,
            }, {});
        }).join('')
        : '<span class="scheda-empty">Nessun talento</span>';
    const talentiSectionHtml = `<div class="scheda-section collapsed">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Talenti
            <small style="color:var(--text-muted);font-weight:500;margin-left:4px;">(${pg.talenti ? pg.talenti.length : 0})</small>
            <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenTalentiEdit('${pg.id}')" title="Modifica">&#9998;</button>
        </div>
        <div class="scheda-section-body" id="schedaTalentiDisplay">
            ${talentiRows}
        </div>
    </div>`;

    // ─── Sezione Stili di Combattimento ───────────────────────────────
    // Sempre visibile: anche se il PG non ha allowance, mostra un messaggio
    // esplicativo. Cosi' il giocatore puo' sempre aprire il picker.
    const fsAllowance = _pgFightingStylesAllowance(pg);
    const fsKeys = Object.keys(fsAllowance);
    let fightingStylesSectionHtml = '';
    {
        const stored = (pg.stile_combattimento && typeof pg.stile_combattimento === 'object')
            ? pg.stile_combattimento : {};
        let totalSelected = 0;
        let totalMax = 0;
        // Includi nel display solo gli slot rilevanti: o hanno max > 0,
        // oppure hanno gia' degli stili selezionati. La slot
        // 'Personalizzato' viene cosi' nascosta finche' l'utente non ne
        // alza il massimo o ne assegna manualmente uno.
        const visibleKeys = fsKeys.filter(cn => {
            const entry = fsAllowance[cn];
            const slugs = Array.isArray(stored[cn]) ? stored[cn] : [];
            return (entry && entry.max > 0) || slugs.length > 0;
        });
        let blocks = '';
        if (visibleKeys.length > 0) {
            blocks = visibleKeys.map(cn => {
                const entry = fsAllowance[cn];
                const max = entry.max;
                totalMax += max;
                const slugs = Array.isArray(stored[cn]) ? stored[cn] : [];
                totalSelected += slugs.length;
                const rows = slugs.length > 0
                    ? slugs.map(slug => {
                        const fs = _fightingStyleById(slug);
                        return _renderPrivFeatureRow({
                            name: fs ? fs.name : slug,
                            name_en: fs ? fs.name_en : '',
                            description: fs ? fs.description : '',
                            translated: true,
                            level: null,
                        }, {});
                    }).join('')
                    : '<span class="scheda-empty">Nessuno stile selezionato</span>';
                return `<div class="priv-feat-row" style="background:transparent;border:none;padding:0;">
                    <div style="font-size:0.78rem;color:var(--text-muted);font-weight:700;letter-spacing:0.04em;text-transform:uppercase;margin:6px 0 4px;">${escapeHtml(cn)} <small style="font-weight:500;text-transform:none;">(${slugs.length}/${max})</small></div>
                    ${rows}
                </div>`;
            }).join('');
        } else {
            blocks = '<div class="scheda-empty" style="padding:6px 4px;">Nessuno stile di combattimento. Premi la matita per modificare il massimo o sceglierne uno.</div>';
        }
        const counterTxt = visibleKeys.length > 0 ? `<small style="color:var(--text-muted);font-weight:500;margin-left:4px;">(${totalSelected}/${totalMax})</small>` : '';
        fightingStylesSectionHtml = `<div class="scheda-section collapsed">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Stili di Combattimento
                ${counterTxt}
                <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenFightingStylesEdit('${pg.id}')" title="Scegli stili">&#9998;</button>
            </div>
            <div class="scheda-section-body" id="schedaFightingStylesDisplay">${blocks}</div>
        </div>`;
    }

    // Sezione Invocazioni Occulte (solo per Warlock).
    let invocationsSectionHtml = '';
    const wlvl = _pgWarlockLevel(pg);
    if (wlvl >= 2) {
        const maxInv = _pgMaxInvocations(pg);
        const selected = (pg.invocazioni || []).map(id => _invocationById(id)).filter(Boolean);
        const itemsHtml = selected.length > 0
            ? selected.map(inv => {
                const desc = (inv.description || '').replace(/\s+/g, ' ').trim();
                const prereq = _formatInvocationPrereqs(inv);
                const prereqLine = prereq ? `<div class="priv-feat-prereq"><strong>Prerequisiti:</strong> ${escapeHtml(prereq)}</div>` : '';
                return `<div class="priv-feat-row">
                    <div class="priv-feat-header priv-feat-clickable" onclick="privToggleFeatureBody(this)">
                        <span class="priv-feat-level">${escapeHtml(inv.source_short || '')}</span>
                        <span class="priv-feat-name">${escapeHtml(inv.name)}</span>
                        <span class="priv-feat-arrow">&#9662;</span>
                    </div>
                    <div class="priv-feat-body" style="display:none;">
                        ${prereqLine}
                        <div class="priv-feat-desc">${window.formatRichText(desc)}</div>
                    </div>
                </div>`;
            }).join('')
            : '<span class="scheda-empty">Nessuna invocazione selezionata</span>';
        invocationsSectionHtml = `<div class="scheda-section collapsed">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Invocazioni Occulte <small style="color:var(--text-muted);font-weight:500;">(${selected.length} / ${maxInv})</small>
                <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenInvocationsEdit('${pg.id}')" title="Modifica invocazioni">&#9998;</button>
            </div>
            <div class="scheda-section-body" id="schedaInvocationsDisplay">${itemsHtml}</div>
        </div>`;
    }

    content.innerHTML = `
    ${buildSchedaHeader(pg, 'Pagina 2 · Privilegi')}

    <div class="scheda-section collapsed">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Classe</div>
        <div class="scheda-section-body">${classBlocks}</div>
    </div>

    ${subclassBlocks ? `<div class="scheda-section collapsed">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Sottoclasse</div>
        <div class="scheda-section-body">${subclassBlocks}</div>
    </div>` : ''}

    ${fightingStylesSectionHtml}

    ${invocationsSectionHtml}

    ${customDefaultSectionsHtml}

    ${talentiSectionHtml}

    ${customUserSectionsHtml}

    <div class="priv-add-tab-wrap">
        <button class="btn-secondary priv-add-tab-btn" onclick="privAddTab()">
            <span class="priv-add-tab-plus">+</span> Nuova tabella
        </button>
    </div>
    `;

    schedaSetActiveTab('privilegi');
    schedaWireTabBar(pgId);
};

async function _privSave(pgId, priv) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    if (_schedaPgCache) _schedaPgCache.privilegi = priv;
    try {
        const { error } = await supabase.from('personaggi').update({ privilegi: priv }).eq('id', pgId);
        if (error) {
            console.error('[priv tabs] save failed', error);
            const msg = (error.message || '').toLowerCase();
            if (msg.includes("'privilegi'") || msg.includes('"privilegi"') || msg.includes('column')) {
                showNotification && showNotification('Manca la colonna "privilegi" sul DB. Esegui sql/add-all-missing-columns.sql');
            } else {
                showNotification && showNotification('Salvataggio fallito: ' + (error.message || 'errore'));
            }
            return false;
        }
        return true;
    } catch (e) {
        console.warn('[priv tabs] save failed', e);
        showNotification && showNotification('Salvataggio fallito: ' + (e.message || 'errore'));
        return false;
    }
}

window.privToggleAutoFeature = async function(featKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    const i = priv.hidden_auto.indexOf(featKey);
    if (i >= 0) priv.hidden_auto.splice(i, 1);
    else priv.hidden_auto.push(featKey);
    await _privSave(pg.id, priv);
    schedaOpenPrivilegesPage(pg.id);
};

window.privAddCustom = function(tabName) {
    const pg = _schedaPgCache;
    if (!pg) return;
    _privOpenEditDialog({ tabName, mode: 'add' });
};

window.privEditCustom = function(tabName, index) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    const item = (priv.custom_features[tabName] || [])[index];
    if (!item) return;
    _privOpenEditDialog({ tabName, mode: 'edit', index, item });
};

window.privRemoveCustom = async function(tabName, index) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    if (!priv.custom_features[tabName]) return;
    priv.custom_features[tabName].splice(index, 1);
    await _privSave(pg.id, priv);
    schedaOpenPrivilegesPage(pg.id);
};

// Mini modal di input (sostituisce prompt() che in alcuni contesti
// Electron viene bloccato e ritorna null silenziosamente).
function _schedaShowInputDialog(opts) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'hp-calc-overlay';
        overlay.onclick = e => {
            if (e.target === overlay) { overlay.remove(); resolve(null); }
        };
        const title = (opts && opts.title) || 'Inserisci un valore';
        const placeholder = (opts && opts.placeholder) || '';
        const initial = (opts && opts.initial) || '';
        overlay.innerHTML = `<div class="hp-calc-modal" style="width:340px;text-align:left;">
            <h3 style="margin-bottom:12px;font-size:1rem;">${escapeHtml(title)}</h3>
            <input type="text" id="schedaInputDlgVal" class="hp-calc-input" value="${escapeHtml(initial)}" placeholder="${escapeHtml(placeholder)}">
            <div class="dialog-actions" style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn-secondary" id="schedaInputDlgCancel">Annulla</button>
                <button class="btn-primary" id="schedaInputDlgOk">OK</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        const input = document.getElementById('schedaInputDlgVal');
        const finish = (val) => { overlay.remove(); resolve(val); };
        document.getElementById('schedaInputDlgCancel').onclick = () => finish(null);
        document.getElementById('schedaInputDlgOk').onclick = () => finish(input.value);
        input.onkeydown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); finish(input.value); }
            if (e.key === 'Escape') { e.preventDefault(); finish(null); }
        };
        // Nessun auto-focus: evita la comparsa automatica della tastiera.
    });
}

// Dialog di conferma promise-based con stile dell'app (sostituisce window.confirm).
// opts: { title, message, confirmLabel, cancelLabel, danger? }
function _schedaShowConfirmDialog(opts) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'hp-calc-overlay';
        overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
        const title = (opts && opts.title) || 'Conferma';
        const message = (opts && opts.message) || '';
        const confirmLabel = (opts && opts.confirmLabel) || 'OK';
        const cancelLabel = (opts && opts.cancelLabel) || 'Annulla';
        const danger = !!(opts && opts.danger);
        overlay.innerHTML = `<div class="hp-calc-modal" style="width:340px;text-align:left;">
            <h3 style="margin-bottom:10px;font-size:1rem;">${escapeHtml(title)}</h3>
            <p style="margin:0 0 14px;font-size:0.92rem;color:var(--text);">${escapeHtml(message)}</p>
            <div class="dialog-actions" style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn-secondary" id="schedaConfirmDlgCancel">${escapeHtml(cancelLabel)}</button>
                <button class="${danger ? 'btn-danger' : 'btn-primary'}" id="schedaConfirmDlgOk">${escapeHtml(confirmLabel)}</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        const finish = (val) => { overlay.remove(); resolve(val); };
        document.getElementById('schedaConfirmDlgCancel').onclick = () => finish(false);
        document.getElementById('schedaConfirmDlgOk').onclick = () => finish(true);
        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); document.removeEventListener('keydown', onKey); finish(false); }
            if (e.key === 'Enter')  { e.preventDefault(); document.removeEventListener('keydown', onKey); finish(true); }
        };
        document.addEventListener('keydown', onKey);
    });
}

// Tastierino numerico custom (stesso stile di pgOpenAbilityKeypad) per
// dialog promise-based. Evita la tastiera nativa del telefono.
// opts: { title, initial, min, max }
function _schedaShowNumpadDialog(opts) {
    return new Promise(resolve => {
        const title = (opts && opts.title) || 'Inserisci un valore';
        const initial = (opts && opts.initial != null) ? String(opts.initial) : '';
        const min = (opts && opts.min != null) ? Number(opts.min) : null;
        const max = (opts && opts.max != null) ? Number(opts.max) : null;
        const id = 'schedaNumpadOverlay';
        document.getElementById(id)?.remove();
        const buf = { v: initial && /^\d+$/.test(initial) ? initial : '' };
        const overlay = document.createElement('div');
        overlay.id = id;
        overlay.className = 'hp-calc-overlay';
        overlay.onclick = e => { if (e.target === overlay) { cleanup(); resolve(null); } };
        const rangeHint = (min != null && max != null) ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px;text-align:center;">Valore tra ${min} e ${max}</div>` : '';
        overlay.innerHTML = `
            <div class="hp-calc-modal" style="width:300px;">
                <button class="hp-calc-close" id="schedaNumpadClose">&times;</button>
                <div class="hp-calc-title">${escapeHtml(title)}</div>
                ${rangeHint}
                <div class="hp-calc-input-display" id="schedaNumpadDisp">${escapeHtml(buf.v || '0')}</div>
                <div class="hp-calc-numpad">
                    ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="hp-calc-numpad-btn" data-k="${n}">${n}</button>`).join('')}
                    <button class="hp-calc-numpad-btn" data-k="C">C</button>
                    <button class="hp-calc-numpad-btn" data-k="0">0</button>
                    <button class="hp-calc-numpad-btn" data-k="BS">⌫</button>
                </div>
                <div class="hp-calc-buttons" style="display:flex;gap:8px;">
                    <button class="hp-calc-btn" id="schedaNumpadCancel" style="flex:1;background:var(--surface);color:var(--text);">Annulla</button>
                    <button class="hp-calc-btn heal" id="schedaNumpadOk" style="flex:1;">Conferma</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const disp = document.getElementById('schedaNumpadDisp');
        const refresh = () => { disp.textContent = buf.v || '0'; };
        const press = (k) => {
            if (k === 'C') buf.v = '';
            else if (k === 'BS') buf.v = buf.v.slice(0, -1);
            else if (/^\d$/.test(k)) {
                if (buf.v === '0') buf.v = k;
                else buf.v = (buf.v + k).slice(0, 4);
            }
            refresh();
        };
        overlay.querySelectorAll('.hp-calc-numpad-btn').forEach(btn => {
            btn.onclick = () => press(btn.getAttribute('data-k'));
        });
        const cleanup = () => { overlay.remove(); };
        const validate = () => {
            if (!buf.v) return null;
            const n = parseInt(buf.v, 10);
            if (!Number.isFinite(n)) return null;
            if (min != null && n < min) return null;
            if (max != null && n > max) return null;
            return n;
        };
        document.getElementById('schedaNumpadOk').onclick = () => {
            const n = validate();
            if (n == null) {
                showNotification && showNotification(min != null && max != null
                    ? `Valore non valido (${min}-${max})`
                    : 'Valore non valido');
                return;
            }
            cleanup(); resolve(n);
        };
        document.getElementById('schedaNumpadCancel').onclick = () => { cleanup(); resolve(null); };
        document.getElementById('schedaNumpadClose').onclick = () => { cleanup(); resolve(null); };
    });
}

window.privAddTab = async function() {
    const name = await _schedaShowInputDialog({
        title: 'Nuova tabella',
        placeholder: 'Es. Talenti, Doni divini',
    });
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    if (priv.custom_tabs_order.includes(trimmed)) {
        showNotification && showNotification('Esiste già una tabella con questo nome');
        return;
    }
    priv.custom_tabs_order.push(trimmed);
    priv.custom_features[trimmed] = [];
    _privSave(pg.id, priv).then(() => schedaOpenPrivilegesPage(pg.id));
};

window.privRemoveTab = async function(tabName) {
    if (PRIV_DEFAULT_CUSTOM_TABS.includes(tabName)) return;
    const ok = await _schedaShowConfirmDialog({
        title: 'Rimuovere tabella?',
        message: `La tabella "${tabName}" e tutti i suoi privilegi verranno eliminati.`,
        confirmLabel: 'Elimina', danger: true,
    });
    if (!ok) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    priv.custom_tabs_order = priv.custom_tabs_order.filter(t => t !== tabName);
    delete priv.custom_features[tabName];
    _privSave(pg.id, priv).then(() => schedaOpenPrivilegesPage(pg.id));
};

window.privRenameTab = async function(oldName, newName) {
    const trimmed = String(newName || '').trim();
    if (!trimmed || trimmed === oldName) return false;
    if (PRIV_DEFAULT_CUSTOM_TABS.includes(oldName)) return false;
    const pg = _schedaPgCache;
    if (!pg) return false;
    const priv = _normalizePrivilegi(pg);
    if (priv.custom_tabs_order.includes(trimmed)) {
        showNotification && showNotification('Esiste già una tabella con questo nome');
        return false;
    }
    const idx = priv.custom_tabs_order.indexOf(oldName);
    if (idx < 0) return false;
    priv.custom_tabs_order[idx] = trimmed;
    priv.custom_features[trimmed] = priv.custom_features[oldName] || [];
    delete priv.custom_features[oldName];
    await _privSave(pg.id, priv);
    return true;
};

// Mini editor di una tabella custom: permette di rinominare la tabella,
// aggiungere un nuovo privilegio o eliminare l'intera tabella.
window.privOpenCustomTabEdit = function(tabName) {
    const pg = _schedaPgCache;
    if (!pg) return;
    if (PRIV_DEFAULT_CUSTOM_TABS.includes(tabName)) {
        // Tabelle predefinite: niente rinomina/elimina, solo aggiungi.
        return privAddCustom(tabName);
    }
    let modal = document.getElementById('privEditModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'privEditModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
    <div class="modal-content priv-edit-card">
        <button class="modal-close" onclick="privCloseEdit()" aria-label="Chiudi">×</button>
        <h2 style="margin:0 0 12px;font-size:1.05rem;">Modifica tabella</h2>
        <label class="priv-edit-label">Nome tabella
            <input type="text" id="privTabRenameInput" class="priv-edit-input" value="${escapeHtml(tabName)}" placeholder="Nome della tabella" data-original="${escapeHtml(tabName)}">
        </label>
        <button type="button" class="btn-secondary" style="margin-top:8px;width:100%;"
            onclick="privCloseEdit();privAddCustom('${escapeHtml(tabName)}')">+ Aggiungi privilegio</button>
        <div class="priv-edit-actions priv-edit-actions-wrap">
            <div class="priv-edit-actions-left">
                <button class="btn-danger" onclick="privDeleteTabFromEdit('${escapeHtml(tabName)}')">Elimina</button>
            </div>
            <div class="priv-edit-actions-right">
                <button class="btn-secondary" onclick="privCloseEdit()">Annulla</button>
                <button class="btn-primary" onclick="privConfirmRenameTab('${escapeHtml(tabName)}')">Salva</button>
            </div>
        </div>
    </div>`;
    modal.classList.add('active');
};

window.privConfirmRenameTab = async function(oldName) {
    const input = document.getElementById('privTabRenameInput');
    if (!input) return;
    const newName = (input.value || '').trim();
    if (!newName) {
        showNotification && showNotification('Inserisci un nome valido');
        return;
    }
    if (newName === oldName) {
        privCloseEdit();
        return;
    }
    const ok = await privRenameTab(oldName, newName);
    if (ok) {
        privCloseEdit();
        const pg = _schedaPgCache;
        if (pg) schedaOpenPrivilegesPage(pg.id);
    }
};

window.privDeleteTabFromEdit = async function(tabName) {
    privCloseEdit();
    await privRemoveTab(tabName);
};

function _privOpenEditDialog({ tabName, mode, index, item }) {
    let modal = document.getElementById('privEditModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'privEditModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    const it = item || { name: '', level: '', description: '' };
    const title = mode === 'edit' ? 'Modifica privilegio' : `Aggiungi a ${tabName}`;
    const isEdit = mode === 'edit' && index != null && index >= 0;
    const deleteBtn = isEdit
        ? `<button class="btn-danger" onclick="privDeleteFromEdit('${escapeHtml(tabName)}',${index})">Elimina</button>`
        : '';
    modal.innerHTML = `
    <div class="modal-content priv-edit-card">
        <button class="modal-close" onclick="privCloseEdit()" aria-label="Chiudi">×</button>
        <h2 style="margin:0 0 12px;font-size:1.05rem;">${escapeHtml(title)}</h2>
        <label class="priv-edit-label">Nome
            <input type="text" id="privEditName" class="priv-edit-input" value="${escapeHtml(it.name)}" placeholder="Es. Visione del Buio">
        </label>
        <label class="priv-edit-label">Livello (opzionale)
            <input type="number" id="privEditLevel" class="priv-edit-input priv-edit-input-num" value="${it.level || ''}" min="1" max="20" placeholder="—">
        </label>
        <label class="priv-edit-label">Descrizione
            <textarea id="privEditDesc" class="priv-edit-textarea" rows="6" placeholder="Descrizione del privilegio">${escapeHtml(it.description || '')}</textarea>
        </label>
        <div class="priv-edit-actions priv-edit-actions-wrap">
            <div class="priv-edit-actions-left">${deleteBtn}</div>
            <div class="priv-edit-actions-right">
                <button class="btn-secondary" onclick="privCloseEdit()">Annulla</button>
                <button class="btn-primary" onclick="privConfirmEdit('${escapeHtml(tabName)}','${mode}',${index === undefined ? -1 : index})">Salva</button>
            </div>
        </div>
    </div>`;
    modal.classList.add('active');
    // Nessun auto-focus: evita la comparsa automatica della tastiera.
}

window.privDeleteFromEdit = async function(tabName, index) {
    const ok = await _schedaShowConfirmDialog({
        title: 'Eliminare voce?',
        message: 'Questa voce verra\' rimossa definitivamente dalla tabella.',
        confirmLabel: 'Elimina', danger: true,
    });
    if (!ok) return;
    privCloseEdit();
    if (typeof window.privRemoveCustom === 'function') {
        await window.privRemoveCustom(tabName, index);
    }
};

window.privCloseEdit = function() {
    const modal = document.getElementById('privEditModal');
    if (modal) modal.classList.remove('active');
};

window.privConfirmEdit = async function(tabName, mode, index) {
    const name = (document.getElementById('privEditName')?.value || '').trim();
    const lvlRaw = (document.getElementById('privEditLevel')?.value || '').trim();
    const desc = (document.getElementById('privEditDesc')?.value || '').trim();
    if (!name) {
        showNotification && showNotification('Inserisci almeno il nome');
        return;
    }
    const level = lvlRaw ? Math.max(1, Math.min(20, parseInt(lvlRaw) || 0)) : null;
    const pg = _schedaPgCache;
    if (!pg) return;
    const priv = _normalizePrivilegi(pg);
    if (!priv.custom_features[tabName]) priv.custom_features[tabName] = [];
    const newItem = { name, level, description: desc };
    if (mode === 'edit' && index >= 0) priv.custom_features[tabName][index] = newItem;
    else priv.custom_features[tabName].push(newItem);
    await _privSave(pg.id, priv);
    privCloseEdit();
    schedaOpenPrivilegesPage(pg.id);
};

function schedaSetActiveTab(tab) {
    const mainTab = document.getElementById('schedaTabMain');
    const spellTab = document.getElementById('schedaTabSpell');
    const invTab = document.getElementById('schedaTabInventory');
    const privTab = document.getElementById('schedaTabPrivileges');
    if (mainTab) mainTab.classList.toggle('active', tab === 'scheda');
    if (spellTab) spellTab.classList.toggle('active', tab === 'incantesimi');
    if (invTab) invTab.classList.toggle('active', tab === 'inventario');
    if (privTab) privTab.classList.toggle('active', tab === 'privilegi');
}

function schedaWireTabBar(pgId) {
    const mainTab = document.getElementById('schedaTabMain');
    const spellTab = document.getElementById('schedaTabSpell');
    const invTab = document.getElementById('schedaTabInventory');
    const privTab = document.getElementById('schedaTabPrivileges');
    if (mainTab) mainTab.onclick = () => renderSchedaPersonaggio(pgId);
    if (spellTab) spellTab.onclick = () => schedaOpenSpellPage(pgId);
    if (invTab) invTab.onclick = () => schedaOpenInventoryPage(pgId);
    if (privTab) privTab.onclick = () => schedaOpenPrivilegesPage(pgId);
}

function schedaSlotToggleInline(pgId, level, index) {
    const pg = _schedaPgCache;
    if (!pg || !pg.slot_incantesimo) return;

    const slot = pg.slot_incantesimo[level];
    if (!slot) return;

    if (index < slot.current) {
        slot.current = index;
    } else {
        slot.current = index + 1;
    }

    // Update pips without reloading
    const content = document.getElementById('schedaContent');
    if (content) {
        const pips = content.querySelectorAll(`.scheda-slot-pip[data-lvl="${level}"]`);
        pips.forEach((p, i) => {
            p.classList.toggle('filled', i < slot.current);
        });
        const countEl = document.getElementById(`sSlotCount_${level}`);
        if (countEl) countEl.textContent = `${slot.current}/${slot.max}`;
    }

    schedaInstantSave(pgId, { slot_incantesimo: pg.slot_incantesimo });
}

// Res/Imm inline edit on character sheet
window.schedaOpenResImmEdit = function(pgId) {
    const display = document.getElementById('schedaResImmDisplay');
    const grid = document.getElementById('schedaResImmEditGrid');
    if (!display || !grid) return;

    if (grid.style.display !== 'none') {
        grid.style.display = 'none';
        display.style.display = '';
        return;
    }

    const pg = _schedaPgCache;
    if (!pg) return;
    const res = pg.resistenze || [];
    const imm = pg.immunita || [];

    grid.innerHTML = `
        <div class="pg-res-header">
            <span></span><span class="pg-res-col-label">Res</span><span class="pg-res-col-label">Imm</span>
        </div>
        <div class="pg-res-grid">
            ${DAMAGE_TYPES.map(dt => {
                const isRes = res.includes(dt.value);
                const isImm = imm.includes(dt.value);
                return `<div class="pg-res-row">
                    <span class="pg-res-label">${dt.label}</span>
                    <input type="checkbox" class="pg-res-cb" ${isRes ? 'checked' : ''} data-val="${dt.value}" data-type="res" title="Resistenza">
                    <input type="checkbox" class="pg-imm-cb" ${isImm ? 'checked' : ''} data-val="${dt.value}" data-type="imm" title="Immunità">
                </div>`;
            }).join('')}
        </div>
        <div style="text-align:center;margin-top:8px;">
            <button class="btn-primary" id="schedaResImmSaveBtn" style="padding:6px 24px;font-size:0.85rem;">Salva</button>
        </div>`;

    display.style.display = 'none';
    grid.style.display = '';

    document.getElementById('schedaResImmSaveBtn').addEventListener('click', async () => {
        const newRes = [];
        const newImm = [];
        grid.querySelectorAll('.pg-res-cb:checked').forEach(cb => newRes.push(cb.dataset.val));
        grid.querySelectorAll('.pg-imm-cb:checked').forEach(cb => newImm.push(cb.dataset.val));

        const supabase = getSupabaseClient();
        if (!supabase) return;
        const { error } = await supabase.from('personaggi').update({ resistenze: newRes, immunita: newImm }).eq('id', pgId);
        if (error) { showNotification('Errore: ' + error.message); return; }

        if (_schedaPgCache) {
            _schedaPgCache.resistenze = newRes;
            _schedaPgCache.immunita = newImm;
        }

        const resDisp = newRes.length > 0 ?
            newRes.map(r => `<span class="scheda-tag">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';
        const immDisp = newImm.length > 0 ?
            newImm.map(r => `<span class="scheda-tag scheda-tag-imm">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';

        display.innerHTML = `
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Resistenze</span><div class="scheda-tags">${resDisp}</div></div>
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Immunità</span><div class="scheda-tags">${immDisp}</div></div>`;

        grid.style.display = 'none';
        display.style.display = '';
        showNotification('Resistenze e immunità aggiornate');
    });
}

function _schedaTalentiContentHtml(currentTalenti) {
    const ctx = 'scheda';
    if (!window._featPickerFilters[ctx]) window._featPickerFilters[ctx] = _defaultFeatFilters();
    const f = window._featPickerFilters[ctx];
    const q = (window._featPickerSearch[ctx] || '').trim().toLowerCase();

    const selectedHtml = currentTalenti.map((nome, i) => {
        const info = _featInfo(nome) || { source_short: '?' };
        const t = {
            nome,
            fonte: info.source_short || '',
            prerequisites: info.prerequisites || '',
            description: info.description || ''
        };
        return _featPickerItemHtml(t, { selected: true, removeOnClick: `schedaTalentoRemove(${i})` });
    }).join('');

    const available = _featsList()
        .filter(t => !currentTalenti.includes(t.nome))
        .filter(t => _featMatchesFilters(t, f))
        .filter(t => _featMatchesSearch(t, q));

    const listHtml = available.map(t =>
        _featPickerItemHtml(t, { onClick: `schedaTalentoAdd('${escapeHtml(t.nome).replace(/'/g, "\\'")}')` })
    ).join('') || '<div class="scheda-empty" style="padding:12px;">Nessun talento corrisponde ai filtri.</div>';

    return `
        ${_featPickerHeaderHtml(ctx)}
        ${selectedHtml ? `<div class="form-section-label">Selezionati</div><div class="pg-talenti-selected">${selectedHtml}</div>` : ''}
        <div class="form-section-label">Disponibili (${available.length})</div>
        <div class="pg-talenti-available">${listHtml}</div>
    `;
}

window.schedaOpenTalentiEdit = function(pgId) {
    const pg = _schedaPgCache;
    const currentTalenti = pg?.talenti ? [...pg.talenti] : [];

    // Reset stato filtri/ricerca per il contesto scheda ad ogni apertura.
    window._featPickerFilters['scheda'] = _defaultFeatFilters();
    window._featPickerSearch['scheda'] = '';

    const modalHtml = `
    <div class="modal active" id="schedaTalentiModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="schedaCloseTalentiEdit()">&times;</button>
            <h2>Modifica Talenti</h2>
            <div class="wizard-page-scroll" id="schedaTalentiContent">
                ${_schedaTalentiContentHtml(currentTalenti)}
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="schedaCloseTalentiEdit()">Chiudi</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    window._schedaTalentiEditPgId = pgId;
    window._schedaTalentiEditList = currentTalenti;
};

window.schedaTalentoAdd = async function(nome) {
    if (!window._schedaTalentiEditList) return;
    if (!window._schedaTalentiEditList.includes(nome)) {
        window._schedaTalentiEditList.push(nome);
        await _schedaTalentiSave();
        _schedaTalentiRefreshModal();
    }
};

window.schedaTalentoRemove = async function(index) {
    if (!window._schedaTalentiEditList) return;
    window._schedaTalentiEditList.splice(index, 1);
    await _schedaTalentiSave();
    _schedaTalentiRefreshModal();
};

async function _schedaTalentiSave() {
    const pgId = window._schedaTalentiEditPgId;
    const talenti = window._schedaTalentiEditList;
    if (!pgId) return;

    if (_schedaPgCache) _schedaPgCache.talenti = talenti;

    const display = document.getElementById('schedaTalentiDisplay');
    if (display) {
        display.innerHTML = talenti.length > 0
            ? talenti.map(t => `<span class="scheda-tag">${escapeHtml(t)}</span>`).join('')
            : '<span class="scheda-empty">Nessun talento</span>';
    }

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ talenti, updated_at: new Date().toISOString() }).eq('id', pgId);
    }
}

function _schedaTalentiRefreshModal() {
    const container = document.getElementById('schedaTalentiContent');
    if (!container) return;
    const talenti = window._schedaTalentiEditList || [];
    container.innerHTML = _schedaTalentiContentHtml(talenti);
    // Il re-focus della ricerca è gestito da _featPickerRefresh().
}

window.schedaCloseTalentiEdit = function() {
    const m = document.getElementById('schedaTalentiModal');
    if (m) m.remove();
    document.body.style.overflow = '';
    window._schedaTalentiEditPgId = null;
    window._schedaTalentiEditList = null;
};

// ============================================================
// Picker invocazioni del Warlock
// ============================================================
window._invocationPickerSearch = window._invocationPickerSearch || '';
window._invocationPickerFilters = window._invocationPickerFilters || { source: 'all', prereq: 'all', meets: 'all' };

function _invocationPickerHeaderHtml() {
    const f = window._invocationPickerFilters;
    const sources = Array.from(new Set(_invocationsAll().map(i => i.source_short || '?'))).sort();
    const chip = (label, active, onclick) =>
        `<button type="button" class="spell-filter-chip ${active ? 'active' : ''}" onclick="${onclick}">${escapeHtml(label)}</button>`;
    const meetsChips = [['all','Tutte'],['meet','Solo idonee']]
        .map(([v, lab]) => chip(lab, f.meets === v, `_invocationPickerSetFilter('meets','${v}')`)).join('');
    const prereqChips = [['all','Tutti'],['any','Sì'],['none','No']]
        .map(([v, lab]) => chip(lab, f.prereq === v, `_invocationPickerSetFilter('prereq','${v}')`)).join('');
    const sourceChips = [['all','Tutti']].concat(sources.map(s => [s, s]))
        .map(([v, lab]) => chip(lab, f.source === v, `_invocationPickerSetFilter('source','${v}')`)).join('');

    let activeCount = 0;
    if (f.meets !== 'all') activeCount += 1;
    if (f.prereq !== 'all') activeCount += 1;
    if (f.source !== 'all') activeCount += 1;

    return `
        <div class="spell-picker-search-row">
            <input type="text" id="invocationPickerSearch" class="hp-calc-input spell-picker-search"
                   placeholder="Cerca invocazione (IT/EN)..."
                   value="${escapeHtml(window._invocationPickerSearch)}"
                   oninput="_invocationPickerOnSearch(this.value)">
            <button type="button" class="spell-picker-filter-btn" id="invocationPickerFilterBtn"
                    onclick="_invocationPickerTogglePanel()" title="Filtri" aria-label="Filtri">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                ${activeCount > 0 ? `<span class="spell-picker-filter-badge">${activeCount}</span>` : ''}
            </button>
        </div>
        <div class="spell-filter-panel" id="invocationFilterPanel" style="display:none;">
            <div class="spell-filter-group">
                <div class="spell-filter-label">Idoneità</div>
                <div class="spell-filter-chips">${meetsChips}</div>
            </div>
            <div class="spell-filter-group">
                <div class="spell-filter-label">Prerequisiti</div>
                <div class="spell-filter-chips">${prereqChips}</div>
            </div>
            <div class="spell-filter-group">
                <div class="spell-filter-label">Manuale</div>
                <div class="spell-filter-chips">${sourceChips}</div>
            </div>
            <div class="spell-filter-actions">
                <button type="button" class="btn-secondary btn-small" onclick="_invocationPickerResetFilters()">Reimposta</button>
            </div>
        </div>
    `;
}

window._invocationPickerTogglePanel = function() {
    const panel = document.getElementById('invocationFilterPanel');
    const btn = document.getElementById('invocationPickerFilterBtn');
    if (!panel) return;
    const visible = panel.style.display !== 'none';
    panel.style.display = visible ? 'none' : '';
    if (btn) btn.classList.toggle('active', !visible);
};

window._invocationPickerResetFilters = function() {
    window._invocationPickerFilters = { source: 'all', prereq: 'all', meets: 'all' };
    _schedaInvocationsRefreshModal({ keepPanelOpen: true });
};

window._invocationPickerOnSearch = function(v) {
    window._invocationPickerSearch = v || '';
    _schedaInvocationsRefreshModal({ keepFocus: true });
};
window._invocationPickerSetFilter = function(key, val) {
    window._invocationPickerFilters[key] = val;
    _schedaInvocationsRefreshModal({ keepPanelOpen: true });
};

function _invocationMatchesFilters(inv, pg) {
    const f = window._invocationPickerFilters;
    if (f.source !== 'all' && (inv.source_short || '?') !== f.source) return false;
    const hasPrereq = (inv.prerequisites && inv.prerequisites.length > 0);
    if (f.prereq === 'none' && hasPrereq) return false;
    if (f.prereq === 'any' && !hasPrereq) return false;
    if (f.meets === 'meet' && !_pgMeetsInvocationPrereqs(pg, inv)) return false;
    return true;
}
function _invocationMatchesSearch(inv, q) {
    if (!q) return true;
    const hay = `${inv.name || ''} ${inv.name_en || ''} ${inv.description || ''}`.toLowerCase();
    return hay.includes(q);
}

function _schedaInvocationsContentHtml(currentInvIds) {
    const pg = _schedaPgCache;
    const all = _invocationsAll();
    const q = (window._invocationPickerSearch || '').trim().toLowerCase();
    const maxInv = _pgMaxInvocations(pg);

    const renderItem = (inv, opts) => {
        const desc = (inv.description || '').replace(/\s+/g, ' ').trim();
        const prereq = _formatInvocationPrereqs(inv);
        const meets = _pgMeetsInvocationPrereqs(pg, inv);
        const cls = opts.selected ? 'pg-talento-item selected' : `pg-talento-item ${opts.disabled ? 'pg-talento-item-disabled' : ''}`;
        const onClick = (opts.onClick && !opts.disabled) ? `onclick="${opts.onClick}"` : '';
        const removeBtn = opts.removeOnClick
            ? `<button type="button" class="pg-talento-remove" onclick="event.stopPropagation();${opts.removeOnClick}">✕</button>`
            : '';
        const infoBtn = `<button type="button" class="pg-talento-info" title="Dettagli" onclick="event.stopPropagation();_featTogglePickerDetail(this)">ⓘ</button>`;
        const prereqHtml = prereq
            ? `<div class="pg-talento-prereq" ${(!meets && !opts.selected) ? 'style="color:var(--danger,#c0392b);"' : ''}><strong>Prerequisito:</strong> ${escapeHtml(prereq)}</div>`
            : '';
        const descHtml = desc
            ? `<div class="pg-talento-desc">${window.formatRichText(desc)}</div>`
            : '';
        return `
            <div class="${cls}" ${onClick} ${opts.title ? `title="${escapeHtml(opts.title)}"` : ''}>
                <div class="pg-talento-row">
                    <span class="pg-talento-name">${escapeHtml(inv.name)}</span>
                    <span class="option-source">(${escapeHtml(inv.source_short || '')})</span>
                    ${infoBtn}
                    ${removeBtn}
                </div>
                <div class="pg-talento-detail" style="display:none;">
                    ${prereqHtml}
                    ${descHtml || '<div class="pg-talento-desc"><em>Nessuna descrizione disponibile.</em></div>'}
                </div>
            </div>`;
    };

    const selected = currentInvIds.map(id => _invocationById(id)).filter(Boolean);
    const selectedHtml = selected.length > 0
        ? selected.map((inv, i) => renderItem(inv, { selected: true, removeOnClick: `schedaInvocationRemove(${i})` })).join('')
        : '';

    const available = all
        .filter(inv => !currentInvIds.includes(inv.id))
        .filter(inv => _invocationMatchesFilters(inv, pg))
        .filter(inv => _invocationMatchesSearch(inv, q));

    const canAddMore = currentInvIds.length < maxInv;

    const listHtml = available.map(inv => {
        const meets = _pgMeetsInvocationPrereqs(pg, inv);
        const disabled = !meets || !canAddMore;
        const reason = !canAddMore ? 'Limite invocazioni raggiunto' : (!meets ? 'Prerequisiti non soddisfatti' : '');
        const safeId = inv.id.replace(/'/g, "\\'");
        return renderItem(inv, {
            onClick: `schedaInvocationAdd('${safeId}')`,
            disabled,
            title: disabled ? reason : '',
        });
    }).join('') || '<div class="scheda-empty" style="padding:12px;">Nessuna invocazione corrisponde ai filtri.</div>';

    return `
        <div class="invocations-summary"><strong>${currentInvIds.length}</strong> / ${maxInv} invocazioni selezionate</div>
        ${_invocationPickerHeaderHtml()}
        ${selectedHtml ? `<div class="form-section-label">Selezionate</div><div class="pg-talenti-selected">${selectedHtml}</div>` : ''}
        <div class="form-section-label">Disponibili (${available.length})</div>
        <div class="pg-talenti-available">${listHtml}</div>
    `;
}

// ─── Picker Stili di Combattimento ─────────────────────────────────────
// Dialog stile "scelta talenti/incantesimi": barra di ricerca fissata in
// alto, pulsante per aprire/chiudere il pannello dei filtri (Classe/
// Sottoclasse e Manuale). Solo la lista scorre, mentre la search row
// resta sempre visibile.
window._fsPickerState = window._fsPickerState || { search: '', source: 'all', slot: 'all', filterOpen: false };

window.schedaOpenFightingStylesEdit = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const allowance = _pgFightingStylesAllowance(pg);
    const slotKeys = Object.keys(allowance); // include sempre 'Personalizzato'
    // Stato locale di selezione: { slotKey: [slug, ...] }
    const stored = (pg.stile_combattimento && typeof pg.stile_combattimento === 'object')
        ? pg.stile_combattimento : {};
    const sel = {};
    slotKeys.forEach(k => { sel[k] = Array.isArray(stored[k]) ? [...stored[k]] : []; });
    // Pulisci selezioni con slug non piu' validi (es. dopo cambio sottoclasse).
    slotKeys.forEach(k => {
        const allowed = _fightingStylesForSlot(k, allowance[k]).map(fs => fs.slug);
        sel[k] = sel[k].filter(s => allowed.includes(s));
    });
    // Stato locale degli override del massimo per slot.
    const initOverrides = (stored._maxOverrides && typeof stored._maxOverrides === 'object')
        ? Object.assign({}, stored._maxOverrides) : {};

    // Costruisci una mappa flat: per ogni stile, in quali "slot" del PG
    // puo' essere assegnato (rispettando le restrizioni di sottoclasse).
    const flatStyles = {}; // slug -> { fs, slots: [slotKey, ...] }
    slotKeys.forEach(k => {
        const list = _fightingStylesForSlot(k, allowance[k]);
        list.forEach(fs => {
            if (!flatStyles[fs.slug]) flatStyles[fs.slug] = { fs, slots: [] };
            flatStyles[fs.slug].slots.push(k);
        });
    });
    const allStyles = Object.values(flatStyles)
        .sort((a, b) => (a.fs.name || '').localeCompare(b.fs.name || ''));

    // Reset stato del filtro a ogni apertura.
    window._fsPickerState = { search: '', source: 'all', slot: 'all', filterOpen: false };
    window._fsPickerSel = sel;
    window._fsPickerAllowance = allowance;
    window._fsPickerSlotKeys = slotKeys;
    window._fsPickerAllStyles = allStyles;
    window._fsPickerOverrides = initOverrides;
    window._fsPickerPgId = pgId;

    let modal = document.getElementById('fsPickerModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'fsPickerModal';
    modal.className = 'modal active';
    modal.onclick = e => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `<div class="modal-content modal-content-lg fs-picker-modal" onclick="event.stopPropagation();">
        <button class="modal-close" onclick="document.getElementById('fsPickerModal')?.remove();">&times;</button>
        <h2 style="margin-top:0;">Scegli Stili di Combattimento</h2>

        <div id="fsPickerHeader">${_fsPickerHeaderHtml()}</div>
        <div id="fsPickerCounters" class="fs-pick-counters">${_fsPickerCountersHtml()}</div>

        <div class="wizard-page-scroll fs-picker-scroll">
            <div id="fsPickerList" class="fs-pick-list"></div>
        </div>

        <div class="form-actions" style="margin-top:var(--spacing-md);display:flex;justify-content:flex-end;gap:8px;">
            <button class="btn-secondary" onclick="document.getElementById('fsPickerModal')?.remove();">Annulla</button>
            <button class="btn-primary" onclick="schedaSaveFightingStyles('${pgId}')">Salva</button>
        </div>
    </div>`;
    document.body.appendChild(modal);
    schedaFsRenderList();
};

// HTML della search row + pannello filtri (collassabile).
function _fsPickerHeaderHtml() {
    const state = window._fsPickerState;
    const allStyles = window._fsPickerAllStyles || [];
    const slotKeys = window._fsPickerSlotKeys || [];
    const sources = Array.from(new Set(allStyles.map(s => s.fs.source_short).filter(Boolean))).sort();

    const chip = (label, active, onclick) =>
        `<button type="button" class="spell-filter-chip ${active ? 'active' : ''}" onclick="${onclick}">${escapeHtml(label)}</button>`;

    const jsArg = s => JSON.stringify(s).replace(/"/g, '&quot;');
    const slotChips = [chip('Tutte', state.slot === 'all', `schedaFsSetSlotFilter('all')`)]
        .concat(slotKeys.map(k => chip(k, state.slot === k, `schedaFsSetSlotFilter(${jsArg(k)})`)))
        .join('');
    const sourceChips = [chip('Tutti', state.source === 'all', `schedaFsSetSourceFilter('all')`)]
        .concat(sources.map(s => chip(s, state.source === s, `schedaFsSetSourceFilter(${jsArg(s)})`)))
        .join('');

    let activeCount = 0;
    if (state.slot !== 'all') activeCount += 1;
    if (state.source !== 'all') activeCount += 1;

    return `
        <div class="spell-picker-search-row">
            <input type="text" id="fsPickerSearch" class="hp-calc-input spell-picker-search"
                   placeholder="Cerca stile (IT/EN)..."
                   value="${escapeHtml(state.search)}"
                   oninput="schedaFsSetSearch(this.value)"
                   autocomplete="off">
            <button type="button" class="spell-picker-filter-btn ${state.filterOpen ? 'active' : ''}" id="fsPickerFilterBtn"
                    onclick="schedaFsToggleFilterPanel()" title="Filtri" aria-label="Filtri">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                ${activeCount > 0 ? `<span class="spell-picker-filter-badge">${activeCount}</span>` : ''}
            </button>
        </div>
        <div class="spell-filter-panel" id="fsPickerFilterPanel" style="display:${state.filterOpen ? '' : 'none'};">
            <div class="spell-filter-group">
                <div class="spell-filter-label">Classe / Sottoclasse</div>
                <div class="spell-filter-chips">${slotChips}</div>
            </div>
            ${sources.length > 0 ? `<div class="spell-filter-group">
                <div class="spell-filter-label">Manuale</div>
                <div class="spell-filter-chips">${sourceChips}</div>
            </div>` : ''}
            <div class="spell-filter-actions">
                <button type="button" class="btn-secondary btn-small" onclick="schedaFsResetFilters()">Reimposta</button>
            </div>
        </div>
    `;
}

// Banner contatori "selezionati / max" per ciascuna classe/sottoclasse.
// Ogni contatore include due pulsanti +/- per modificare liberamente il max.
function _fsPickerCountersHtml() {
    const slotKeys = window._fsPickerSlotKeys || [];
    const allowance = window._fsPickerAllowance || {};
    const sel = window._fsPickerSel || {};
    if (slotKeys.length === 0) return '';
    return slotKeys.map(k => {
        const cnt = (sel[k] || []).length;
        const max = allowance[k] ? allowance[k].max : 0;
        const reached = cnt > 0 && cnt >= max;
        const labelKey = JSON.stringify(k).replace(/"/g, '&quot;');
        return `<span class="fs-pick-counter ${reached ? 'reached' : ''} ${max === 0 ? 'is-empty' : ''}" data-slot="${escapeHtml(k)}">
            <strong>${escapeHtml(k)}:</strong> ${cnt}/${max}
            <button type="button" class="fs-pick-counter-btn" title="Riduci massimo"
                onclick="event.stopPropagation();schedaFsBumpSlotMax(${labelKey}, -1)">−</button>
            <button type="button" class="fs-pick-counter-btn" title="Aumenta massimo"
                onclick="event.stopPropagation();schedaFsBumpSlotMax(${labelKey}, 1)">+</button>
        </span>`;
    }).join('');
}

// Modifica il massimo di stili per uno slot di +/- delta.
window.schedaFsBumpSlotMax = function(slotKey, delta) {
    const allowance = window._fsPickerAllowance || {};
    const overrides = window._fsPickerOverrides || (window._fsPickerOverrides = {});
    const sel = window._fsPickerSel || {};
    const entry = allowance[slotKey];
    if (!entry) return;
    const baseMax = Number.isFinite(entry.baseMax) ? entry.baseMax : entry.max;
    const curMax = entry.max;
    const newMax = Math.max(0, curMax + delta);
    const newOverride = newMax - baseMax;
    if (newOverride === 0) {
        delete overrides[slotKey];
    } else {
        overrides[slotKey] = newOverride;
    }
    entry.max = newMax;
    // Se ho ridotto sotto al numero di selezioni correnti, taglia la lista.
    if (Array.isArray(sel[slotKey]) && sel[slotKey].length > newMax) {
        sel[slotKey] = sel[slotKey].slice(0, newMax);
    }
    const counters = document.getElementById('fsPickerCounters');
    if (counters) counters.innerHTML = _fsPickerCountersHtml();
    schedaFsRenderList();
};

window.schedaFsToggleFilterPanel = function() {
    const state = window._fsPickerState;
    state.filterOpen = !state.filterOpen;
    const panel = document.getElementById('fsPickerFilterPanel');
    const btn = document.getElementById('fsPickerFilterBtn');
    if (panel) panel.style.display = state.filterOpen ? '' : 'none';
    if (btn) btn.classList.toggle('active', state.filterOpen);
};

window.schedaFsResetFilters = function() {
    const state = window._fsPickerState;
    state.source = 'all';
    state.slot = 'all';
    _fsPickerRefreshHeader({ keepPanelOpen: true });
    schedaFsRenderList();
};

window.schedaFsSetSearch = function(v) {
    window._fsPickerState.search = v || '';
    schedaFsRenderList();
};
window.schedaFsSetSourceFilter = function(src) {
    window._fsPickerState.source = src;
    _fsPickerRefreshHeader({ keepPanelOpen: true });
    schedaFsRenderList();
};
window.schedaFsSetSlotFilter = function(slot) {
    window._fsPickerState.slot = slot;
    _fsPickerRefreshHeader({ keepPanelOpen: true });
    schedaFsRenderList();
};

// Re-renderizza la search row + pannello filtri preservando focus e
// stato di apertura del pannello.
function _fsPickerRefreshHeader(opts) {
    opts = opts || {};
    const header = document.getElementById('fsPickerHeader');
    if (!header) return;
    if (opts.keepPanelOpen) window._fsPickerState.filterOpen = true;
    header.innerHTML = _fsPickerHeaderHtml();
    const counters = document.getElementById('fsPickerCounters');
    if (counters) counters.innerHTML = _fsPickerCountersHtml();
    // Re-focus della ricerca con il cursore in coda.
    const input = document.getElementById('fsPickerSearch');
    if (input) {
        try {
            input.focus();
            const v = input.value;
            input.setSelectionRange(v.length, v.length);
        } catch (_) { /* ignore */ }
    }
}

window.schedaFsRenderList = function() {
    const state = window._fsPickerState || { search: '', source: 'all', slot: 'all' };
    const allStyles = window._fsPickerAllStyles || [];
    const allowance = window._fsPickerAllowance || {};
    const sel = window._fsPickerSel || {};
    const listEl = document.getElementById('fsPickerList');
    if (!listEl) return;
    const search = (state.search || '').trim().toLowerCase();
    const filtered = allStyles.filter(({ fs, slots }) => {
        if (state.source !== 'all' && fs.source_short !== state.source) return false;
        if (state.slot !== 'all' && !slots.includes(state.slot)) return false;
        if (search) {
            const txt = `${fs.name || ''} ${fs.name_en || ''} ${fs.description || ''}`.toLowerCase();
            if (!txt.includes(search)) return false;
        }
        return true;
    });
    if (filtered.length === 0) {
        listEl.innerHTML = '<div class="scheda-empty" style="padding:18px;text-align:center;">Nessuno stile corrisponde ai filtri.</div>';
        return;
    }
    listEl.innerHTML = filtered.map(({ fs, slots }) => {
        const assignedTo = slots.filter(k => (sel[k] || []).includes(fs.slug));
        const isSelected = assignedTo.length > 0;
        // Mostra le slot solo se hanno almeno 1 max o c'e' gia' una
        // selezione su quella slot per questo stile (per consentire la
        // rimozione anche dopo aver azzerato il max).
        const visibleSlots = slots.filter(k => {
            const max = allowance[k] ? allowance[k].max : 0;
            const here = (sel[k] || []).includes(fs.slug);
            return max > 0 || here;
        });
        const slotBadges = visibleSlots.map(k => {
            const max = allowance[k] ? allowance[k].max : 0;
            const reachedMax = (sel[k] || []).length >= max;
            const here = (sel[k] || []).includes(fs.slug);
            return `<button type="button" class="fs-pick-slot-btn ${here ? 'is-on' : ''} ${reachedMax && !here ? 'is-full' : ''}"
                onclick="event.stopPropagation();schedaFsToggleAssign('${fs.slug}', ${JSON.stringify(k).replace(/"/g, '&quot;')})"
                title="${here ? 'Assegnato a ' + escapeHtml(k) : 'Assegna a ' + escapeHtml(k)}">
                ${here ? '✔ ' : '+ '}${escapeHtml(k)} <small>(${(sel[k] || []).length}/${max})</small>
            </button>`;
        }).join('');
        const slotBadgesHtml = slotBadges || '<span class="scheda-empty" style="font-size:0.78rem;padding:4px 8px;">Aumenta il massimo "Personalizzato" sopra per assegnare questo stile.</span>';
        return `<div class="fs-pick-row ${isSelected ? 'fs-pick-row-selected' : ''}">
            <div class="fs-pick-head" onclick="this.closest('.fs-pick-row').classList.toggle('fs-pick-open');">
                <span class="fs-pick-name">${escapeHtml(fs.name)}</span>
                <span class="fs-pick-source">${escapeHtml(fs.source_short || '')}</span>
                <span class="fs-pick-arrow">▾</span>
            </div>
            <div class="fs-pick-slots">${slotBadgesHtml}</div>
            <div class="fs-pick-desc">${window.formatRichText(fs.description || '')}</div>
        </div>`;
    }).join('');
};

// Toggle assegnazione di uno stile a uno slot specifico (classe/sottoclasse).
window.schedaFsToggleAssign = function(slug, slotKey) {
    const sel = window._fsPickerSel || {};
    const allowance = window._fsPickerAllowance || {};
    if (!sel[slotKey]) sel[slotKey] = [];
    const arr = sel[slotKey];
    const i = arr.indexOf(slug);
    if (i >= 0) {
        arr.splice(i, 1);
    } else {
        if (arr.length >= allowance[slotKey].max) {
            showNotification && showNotification(`Hai gia' raggiunto il massimo di stili per ${slotKey}`);
            return;
        }
        // Uno stile per slot: rimuovilo dagli altri slot del PG.
        Object.keys(sel).forEach(k => {
            if (k !== slotKey) {
                const j = sel[k].indexOf(slug);
                if (j >= 0) sel[k].splice(j, 1);
            }
        });
        arr.push(slug);
    }
    // Aggiorna i contatori nel banner sotto la search row.
    const counters = document.getElementById('fsPickerCounters');
    if (counters) counters.innerHTML = _fsPickerCountersHtml();
    // Aggiorna anche le chip nel pannello filtri (se aperto): nessun
    // contatore nelle chip in questo design, quindi basta ri-renderizzare
    // la lista.
    schedaFsRenderList();
};

window.schedaSaveFightingStyles = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const sel = window._fsPickerSel || {};
    const overrides = window._fsPickerOverrides || {};
    // Costruisci il payload finale: copia delle selezioni + override del max.
    const payload = {};
    Object.keys(sel).forEach(k => { payload[k] = Array.isArray(sel[k]) ? [...sel[k]] : []; });
    // Persiste solo le voci di override realmente non-zero.
    const cleanOverrides = {};
    Object.keys(overrides).forEach(k => {
        const v = overrides[k];
        if (Number.isFinite(v) && v !== 0) cleanOverrides[k] = v;
    });
    if (Object.keys(cleanOverrides).length > 0) payload._maxOverrides = cleanOverrides;
    pg.stile_combattimento = payload;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    try {
        const { error } = await supabase.from('personaggi')
            .update({ stile_combattimento: payload, updated_at: new Date().toISOString() })
            .eq('id', pgId);
        if (error) {
            console.error('[fighting styles] save failed', error);
            const msg = (error.message || '').toLowerCase();
            if (msg.includes('stile_combattimento') || msg.includes('column')) {
                showNotification && showNotification('Manca la colonna "stile_combattimento" sul DB. Esegui sql/add-all-missing-columns.sql');
            } else {
                showNotification && showNotification('Salvataggio fallito: ' + (error.message || 'errore'));
            }
            return;
        }
    } catch (e) {
        console.warn('[fighting styles] save failed', e);
        showNotification && showNotification('Salvataggio fallito: ' + (e.message || 'errore'));
        return;
    }
    document.getElementById('fsPickerModal')?.remove();
    schedaOpenPrivilegesPage(pgId);
};

window.schedaOpenInvocationsEdit = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const current = pg.invocazioni ? [...pg.invocazioni] : [];

    window._invocationPickerSearch = '';
    window._invocationPickerFilters = { source: 'all', prereq: 'all', meets: 'all' };

    const modalHtml = `
    <div class="modal active" id="schedaInvocationsModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="schedaCloseInvocationsEdit()">&times;</button>
            <h2>Modifica Invocazioni Occulte</h2>
            <div class="wizard-page-scroll" id="schedaInvocationsContent">
                ${_schedaInvocationsContentHtml(current)}
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="schedaCloseInvocationsEdit()">Chiudi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    window._schedaInvocationsEditPgId = pgId;
    window._schedaInvocationsEditList = current;
};

window.schedaInvocationAdd = async function(invId) {
    if (!window._schedaInvocationsEditList) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    const inv = _invocationById(invId);
    if (!inv) return;
    if (window._schedaInvocationsEditList.includes(invId)) return;
    if (window._schedaInvocationsEditList.length >= _pgMaxInvocations(pg)) return;
    if (!_pgMeetsInvocationPrereqs(pg, inv)) return;
    window._schedaInvocationsEditList.push(invId);
    _applyInvocationSkillsToPg(pg);
    await _schedaInvocationsSave();
    _schedaInvocationsRefreshModal();
};

window.schedaInvocationRemove = async function(index) {
    if (!window._schedaInvocationsEditList) return;
    const removedId = window._schedaInvocationsEditList[index];
    window._schedaInvocationsEditList.splice(index, 1);
    const pg = _schedaPgCache;
    if (pg) {
        _removeInvocationSkillFromPg(pg, removedId);
        _applyInvocationSkillsToPg(pg);
    }
    await _schedaInvocationsSave();
    _schedaInvocationsRefreshModal();
};

// Aggiunge a pg.competenze_abilita le skill granted dalle invocazioni
// attualmente selezionate (idempotente).
function _applyInvocationSkillsToPg(pg) {
    if (!pg) return;
    if (!Array.isArray(pg.competenze_abilita)) pg.competenze_abilita = [];
    const skills = _pgInvocationGrantedSkills(pg);
    skills.forEach(s => {
        if (!pg.competenze_abilita.includes(s)) pg.competenze_abilita.push(s);
    });
}

// Quando si rimuove una invocazione che concedeva una skill, toglie la
// competenza solo se non e' garantita anche da un'altra invocazione attiva.
function _removeInvocationSkillFromPg(pg, removedInvId) {
    if (!pg || !removedInvId) return;
    const removed = _invocationById(removedInvId);
    if (!removed || removed.effect !== 'skill_proficiency') return;
    const removedSkills = (removed.effect_data || {}).skills || [];
    const stillGranted = new Set(_pgInvocationGrantedSkills(pg));
    if (!Array.isArray(pg.competenze_abilita)) return;
    pg.competenze_abilita = pg.competenze_abilita.filter(s => {
        if (!removedSkills.includes(s)) return true;
        return stillGranted.has(s);
    });
}

async function _schedaInvocationsSave() {
    const pgId = window._schedaInvocationsEditPgId;
    const list = window._schedaInvocationsEditList;
    if (!pgId) return;
    if (_schedaPgCache) _schedaPgCache.invocazioni = list;

    // Refresh anche pannello privilegi se aperto.
    if (typeof schedaOpenPrivilegesPage === 'function' && window._schedaCurrentTab === 'privilegi') {
        schedaOpenPrivilegesPage(pgId);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
        const payload = {
            invocazioni: list,
            competenze_abilita: _schedaPgCache ? (_schedaPgCache.competenze_abilita || []) : undefined,
            updated_at: new Date().toISOString(),
        };
        try {
            let { error } = await supabase.from('personaggi').update(payload).eq('id', pgId);
            // Retry rimuovendo colonne mancanti (es. 'invocazioni' non ancora migrata).
            for (let i = 0; i < 4 && error; i++) {
                const m = (error.message || '').match(/find ['"]?([a-z_]+)['"]? column/i)
                       || (error.message || '').match(/column ['"]?([a-z_]+)['"]?/i);
                if (!m || !(m[1] in payload)) break;
                delete payload[m[1]];
                ({ error } = await supabase.from('personaggi').update(payload).eq('id', pgId));
            }
            if (error) console.warn('[invocazioni] save failed', error);
        } catch (e) {
            console.warn('[invocazioni] save failed (column missing?)', e);
        }
    }
}

function _schedaInvocationsRefreshModal(opts = {}) {
    const container = document.getElementById('schedaInvocationsContent');
    if (!container) return;
    const list = window._schedaInvocationsEditList || [];
    container.innerHTML = _schedaInvocationsContentHtml(list);
    if (opts.keepPanelOpen) {
        const panel = document.getElementById('invocationFilterPanel');
        const btn = document.getElementById('invocationPickerFilterBtn');
        if (panel) panel.style.display = '';
        if (btn) btn.classList.add('active');
    }
    if (opts.keepFocus) {
        const inp = document.getElementById('invocationPickerSearch');
        if (inp) {
            inp.focus();
            const v = inp.value;
            inp.setSelectionRange(v.length, v.length);
        }
    }
}

window.schedaCloseInvocationsEdit = function() {
    const m = document.getElementById('schedaInvocationsModal');
    if (m) m.remove();
    document.body.style.overflow = '';
    window._schedaInvocationsEditPgId = null;
    window._schedaInvocationsEditList = null;
};

// HP Calculator
let _hpCalcState = null;

window.schedaOpenHpCalcLive = function(pgId, field) {
    const pg = _schedaPgCache;
    if (!pg) return;
    let currentVal, maxVal;
    if (field === 'pv_attuali') {
        currentVal = pg.pv_attuali != null ? pg.pv_attuali : (pg.punti_vita_max || 10);
        maxVal = pg.punti_vita_max || 10;
    } else if (field === 'pv_temporanei') {
        currentVal = pg.pv_temporanei || 0;
        maxVal = -1;
    } else if (field === 'punti_vita_max') {
        currentVal = pg.punti_vita_max || 10;
        maxVal = -1;
    }
    schedaOpenHpCalc(pgId, field, currentVal, maxVal);
}

window.schedaOpenHpCalc = function(pgId, field, currentVal, maxVal) {
    _hpCalcState = { pgId, field, currentVal, maxVal, inputBuffer: '0' };
    const labels = { pv_attuali: 'Punti Vita Attuali', pv_temporanei: 'Punti Vita Temporanei', punti_vita_max: 'Punti Vita Massimi' };
    const label = labels[field] || 'Punti Vita';
    const maxDisplay = (maxVal > 0 && field !== 'punti_vita_max') ? `<span class="hp-calc-max">/ ${maxVal}</span>` : '';

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';

    const isDirectEdit = field === 'punti_vita_max';
    const actionButtons = isDirectEdit
        ? `<div class="hp-calc-buttons"><button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaHpSetDirect()">Conferma</button></div>`
        : `<div class="hp-calc-buttons">
            <button class="hp-calc-btn damage" onclick="schedaHpApply(-1)">− Danno</button>
            <button class="hp-calc-btn heal" onclick="schedaHpApply(1)">+ Cura</button>
           </div>`;

    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">${label}</div>
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span>${maxDisplay}</div>
            <div class="hp-calc-input-display" id="hpCalcAmountDisplay">0</div>
            <div class="hp-calc-numpad">
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('1')">1</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('2')">2</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('3')">3</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('4')">4</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('5')">5</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('6')">6</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('7')">7</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('8')">8</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('9')">9</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('C')">C</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('0')">0</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('⌫')">⌫</button>
            </div>
            ${actionButtons}
        </div>
    `;
    document.body.appendChild(overlay);
}

window.hpCalcNumpad = function(key) {
    if (!_hpCalcState) return;
    if (key === 'C') {
        _hpCalcState.inputBuffer = '0';
    } else if (key === '⌫') {
        _hpCalcState.inputBuffer = _hpCalcState.inputBuffer.length > 1 ? _hpCalcState.inputBuffer.slice(0, -1) : '0';
    } else {
        _hpCalcState.inputBuffer = _hpCalcState.inputBuffer === '0' ? key : _hpCalcState.inputBuffer + key;
    }
    const display = document.getElementById('hpCalcAmountDisplay');
    if (display) display.textContent = _hpCalcState.inputBuffer;
}

window.schedaHpSetDirect = async function() {
    if (!_hpCalcState) return;
    const newVal = parseInt(_hpCalcState.inputBuffer) || 0;
    _hpCalcState.currentVal = newVal;

    const display = document.getElementById('hpCalcCurrent');
    if (display) display.textContent = newVal;
    _hpCalcState.inputBuffer = '0';
    const amountDisplay = document.getElementById('hpCalcAmountDisplay');
    if (amountDisplay) amountDisplay.textContent = '0';

    const displayId = { pv_attuali: 'schedaPvAttuali', pv_temporanei: 'schedaPvTemp', punti_vita_max: 'schedaPvMax' };
    const pgDisplay = document.getElementById(displayId[_hpCalcState.field]);
    if (pgDisplay) pgDisplay.textContent = newVal;
    if (_schedaPgCache) _schedaPgCache[_hpCalcState.field] = newVal;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ [_hpCalcState.field]: newVal, updated_at: new Date().toISOString() }).eq('id', _hpCalcState.pgId);
    }
}

window.schedaHpApply = async function(direction) {
    if (!_hpCalcState) return;
    const amount = parseInt(_hpCalcState.inputBuffer) || 0;
    if (amount === 0) return;

    let newVal = _hpCalcState.currentVal + (amount * direction);
    if (newVal < 0) newVal = 0;
    if (_hpCalcState.maxVal > 0 && newVal > _hpCalcState.maxVal) newVal = _hpCalcState.maxVal;
    _hpCalcState.currentVal = newVal;
    _hpCalcState.inputBuffer = '0';

    const display = document.getElementById('hpCalcCurrent');
    if (display) display.textContent = newVal;
    const amountDisplay = document.getElementById('hpCalcAmountDisplay');
    if (amountDisplay) amountDisplay.textContent = '0';

    const displayId = { pv_attuali: 'schedaPvAttuali', pv_temporanei: 'schedaPvTemp', punti_vita_max: 'schedaPvMax' };
    const pgDisplay = document.getElementById(displayId[_hpCalcState.field]);
    if (pgDisplay) pgDisplay.textContent = newVal;
    if (_schedaPgCache) _schedaPgCache[_hpCalcState.field] = newVal;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ [_hpCalcState.field]: newVal, updated_at: new Date().toISOString() }).eq('id', _hpCalcState.pgId);
    }
}

let _hpCalcClosedAt = 0;

window.schedaCloseHpCalc = async function() {
    const overlay = document.getElementById('hpCalcOverlay');
    if (overlay) overlay.remove();
    const wasMonster = _hpCalcState?.isMonster;
    const monsterId = _hpCalcState?.pgId;
    const campagnaId = _hpCalcState?.campagnaId;
    const sessioneId = _hpCalcState?.sessioneId;
    _hpCalcState = null;
    _hpCalcClosedAt = Date.now();
    if (wasMonster && campagnaId && sessioneId) {
        await renderCombattimentoContent(campagnaId, sessioneId);
        // Se il calcolatore HP era stato aperto dalla full-sheet del mostro
        // in combattimento, ricarichiamo quella modale per riflettere i PV
        // aggiornati senza chiuderla.
        const fullModal = document.getElementById('combatMonsterFullModal');
        if (fullModal && fullModal.classList.contains('active') && monsterId && typeof combatOpenMonsterFullSheet === 'function') {
            combatOpenMonsterFullSheet(monsterId, campagnaId, sessioneId);
        }
        // Stessa cosa per la dialog placeholder: re-render per aggiornare
        // i numeri delle box PV / CA al volo.
        const phModal = document.getElementById('combatPlaceholderModal');
        if (phModal && phModal.classList.contains('active') && monsterId && typeof combatOpenPlaceholderDialog === 'function') {
            combatOpenPlaceholderDialog(monsterId, campagnaId, sessioneId);
        }
    }
}

window.schedaOpenStatCalc = function(pgId, field) {
    const currentVal = _schedaPgCache?.[field] ?? 0;
    _hpCalcState = { pgId, field, currentVal, maxVal: -1, inputBuffer: '0' };
    const labels = { classe_armatura: 'Classe Armatura', iniziativa: 'Iniziativa' };
    const label = labels[field] || field;

    let breakdownHtml = '';
    if (field === 'classe_armatura' && _schedaPgCache) {
        const lines = getCABreakdown(_schedaPgCache);
        breakdownHtml = `<div class="ca-breakdown">${lines.map(l => `<div class="ca-breakdown-line">${l}</div>`).join('')}</div>`;
    }

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">${label}</div>
            ${breakdownHtml}
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span></div>
            <div class="hp-calc-input-display" id="hpCalcAmountDisplay">0</div>
            <div class="hp-calc-numpad">
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('1')">1</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('2')">2</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('3')">3</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('4')">4</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('5')">5</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('6')">6</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('7')">7</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('8')">8</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('9')">9</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('C')">C</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('0')">0</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('⌫')">⌫</button>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaStatConfirm()">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.schedaOpenAbilityCalc = function(pgId, abilityKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const currentVal = pg[abilityKey] || 10;
    const abilityInfo = SCHEDA_ABILITIES.find(a => a.key === abilityKey);
    const label = abilityInfo ? abilityInfo.full : abilityKey;
    _hpCalcState = { pgId, field: abilityKey, currentVal, maxVal: -1, inputBuffer: String(currentVal), isAbility: true };

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">${escapeHtml(label)}</div>
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span></div>
            <div class="hp-calc-input-display" id="hpCalcAmountDisplay">${currentVal}</div>
            <div class="hp-calc-numpad">
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('1')">1</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('2')">2</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('3')">3</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('4')">4</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('5')">5</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('6')">6</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('7')">7</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('8')">8</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('9')">9</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('C')">C</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('0')">0</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('⌫')">⌫</button>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaStatConfirm()">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.schedaStatConfirm = async function() {
    if (!_hpCalcState) return;
    const newVal = parseInt(_hpCalcState.inputBuffer) || 0;
    const field = _hpCalcState.field;
    const pgId = _hpCalcState.pgId;
    const pg = _schedaPgCache;

    if (pg) pg[field] = newVal;

    if (_hpCalcState.isAbility) {
        const clampedVal = Math.max(1, Math.min(30, newVal));
        if (pg) pg[field] = clampedVal;
        const abilEl = document.getElementById(`sAbil_${field}`);
        if (abilEl) abilEl.textContent = clampedVal;
        schedaRecalcAbility(field, clampedVal, pgId);
        await schedaInstantSave(pgId, { [field]: clampedVal });
        _recalcEquipFromStats(pgId);
    } else {
        const displayIds = { classe_armatura: 'schedaCA', iniziativa: 'schedaInit' };
        const el = document.getElementById(displayIds[field]);
        if (el) {
            el.textContent = field === 'iniziativa' ? (newVal >= 0 ? '+' + newVal : '' + newVal) : newVal;
        }
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('personaggi').update({ [field]: newVal, updated_at: new Date().toISOString() }).eq('id', pgId);
        }
    }
    schedaCloseHpCalc();
};

window.schedaOpenSpeedCalc = function(pgId) {
    const currentVal = _schedaPgCache?.velocita ?? 9;
    _hpCalcState = { pgId, field: 'velocita', currentVal, maxVal: -1, inputBuffer: '0', isSpeed: true };

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">Velocità</div>
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span><span class="hp-calc-max">m</span></div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn damage" onclick="schedaSpeedAdjust(-1.5)">− 1.5</button>
                <button class="hp-calc-btn heal" onclick="schedaSpeedAdjust(1.5)">+ 1.5</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.schedaSpeedAdjust = async function(delta) {
    if (!_hpCalcState) return;
    let newVal = _hpCalcState.currentVal + delta;
    if (newVal < 0) newVal = 0;
    _hpCalcState.currentVal = newVal;

    const display = document.getElementById('hpCalcCurrent');
    if (display) display.textContent = newVal;

    if (_schedaPgCache) _schedaPgCache.velocita = newVal;
    const el = document.getElementById('schedaSpeed');
    if (el) el.textContent = newVal;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ velocita: newVal, updated_at: new Date().toISOString() }).eq('id', _hpCalcState.pgId);
    }
};

window.schedaToggleConcentrazione = async function(pgId, el) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const isActive = el.classList.contains('active');
    await supabase.from('personaggi').update({ concentrazione: !isActive, updated_at: new Date().toISOString() }).eq('id', pgId);
    el.classList.toggle('active');
    if (_schedaPgCache) _schedaPgCache.concentrazione = !isActive;
};

/* ── Ispirazione (contatore semplice, illimitato, >= 0) ── */
window.schedaIspChange = function(pgId, delta) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const current = parseInt(pg.ispirazione || 0) || 0;
    const newVal = Math.max(0, current + delta);
    if (newVal === current && delta < 0) return;
    pg.ispirazione = newVal;
    const el = document.getElementById('sIsp');
    if (el) el.textContent = newVal;
    schedaInstantSave(pgId, { ispirazione: newVal });
};

/* ── Level Up ────────────────────────────────────────────────────────────────
   Aumenta di 1 il livello di una classe del PG. Per i PV chiede al giocatore
   se usare il valore medio (fisso) oppure tirare il dado vita. Aggiorna anche
   dadi vita disponibili, livello totale, e indirettamente risorse di classe
   e privilegi (calcolati dinamicamente in fase di render in base al livello).
   ────────────────────────────────────────────────────────────────────────── */
window.schedaLevelUp = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) {
        // Carica il PG se non e' in cache (es. clic dalla tab Inventario senza prima aver caricato la scheda).
        const supabase = getSupabaseClient();
        if (supabase) {
            const { data } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
            if (data) _schedaPgCache = data;
        }
    }
    const cur = _schedaPgCache;
    if (!cur) return;
    const classi = Array.isArray(cur.classi) ? cur.classi : [];
    if (classi.length === 0) {
        showNotification('Nessuna classe configurata');
        return;
    }
    const totLevel = classi.reduce((s, c) => s + (parseInt(c.livello) || 0), 0);
    if (totLevel >= 20) {
        showNotification('Livello massimo raggiunto (20)');
        return;
    }

    // Sempre picker: scegli quale classe far salire oppure aggiungi multiclasse.
    _showLevelUpPicker(pgId, classi);
};

function _showLevelUpPicker(pgId, classi) {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const rows = classi.map((c, i) => {
        const lvl = parseInt(c.livello) || 1;
        const disabled = lvl >= 20;
        return `<button class="levelup-pick-row${disabled ? ' disabled' : ''}" ${disabled ? 'disabled' : ''} data-idx="${i}">
            <span class="levelup-pick-name">${escapeHtml(c.nome)}</span>
            <span class="levelup-pick-arrow">${lvl} → ${disabled ? lvl : lvl + 1}</span>
        </button>`;
    }).join('');
    overlay.innerHTML = `<div class="hp-calc-modal levelup-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="levelup-title">Level Up</h3>
        <p class="levelup-sub">Quale classe vuoi aumentare di livello?</p>
        <div class="levelup-pick-list">${rows}</div>
        <div class="levelup-multiclass-divider"></div>
        <button class="levelup-pick-row levelup-pick-multiclass" id="luMulticlassBtn">
            <span class="levelup-pick-name">+ Multiclasse</span>
            <span class="levelup-pick-arrow">aggiungi nuova classe</span>
        </button>
    </div>`;
    overlay.querySelectorAll('.levelup-pick-row[data-idx]').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            overlay.remove();
            _showLevelUpHpChoice(pgId, idx);
        };
    });
    overlay.querySelector('#luMulticlassBtn').onclick = () => {
        overlay.remove();
        _showMulticlassPicker(pgId, classi);
    };
    document.body.appendChild(overlay);
}

function _showMulticlassPicker(pgId, classi) {
    const owned = new Set(classi.map(c => c.nome));
    const all = Object.keys(CLASS_HIT_DIE).sort((a, b) => a.localeCompare(b));
    const available = all.filter(n => !owned.has(n));

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    if (available.length === 0) {
        overlay.innerHTML = `<div class="hp-calc-modal levelup-modal">
            <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
            <h3 class="levelup-title">Multiclasse</h3>
            <p class="levelup-sub">Hai gia' tutte le classi disponibili.</p>
            <div class="levelup-pf-actions">
                <button type="button" class="levelup-pf-cancel" onclick="this.closest('.hp-calc-overlay').remove()">Chiudi</button>
                <button type="button" class="levelup-pf-confirm" onclick="this.closest('.hp-calc-overlay').remove();_showLevelUpPicker('${pgId}', ${JSON.stringify(classi).replace(/'/g, '&#39;')});">Indietro</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        return;
    }

    const rows = available.map(nome => {
        const die = CLASS_HIT_DIE[nome] || 8;
        return `<button class="levelup-pick-row" data-nome="${escapeHtml(nome)}">
            <span class="levelup-pick-name">${escapeHtml(nome)}</span>
            <span class="levelup-pick-arrow">d${die} · liv 1</span>
        </button>`;
    }).join('');

    overlay.innerHTML = `<div class="hp-calc-modal levelup-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="levelup-title">Multiclasse</h3>
        <p class="levelup-sub">Quale classe vuoi aggiungere al livello 1?</p>
        <div class="levelup-pick-list">${rows}</div>
        <div class="levelup-multiclass-divider"></div>
        <button class="levelup-pick-row levelup-pick-back" id="luBackBtn">
            <span class="levelup-pick-name">← Indietro</span>
            <span class="levelup-pick-arrow">scegli classe esistente</span>
        </button>
    </div>`;

    overlay.querySelectorAll('.levelup-pick-row[data-nome]').forEach(btn => {
        btn.onclick = () => {
            const nome = btn.dataset.nome;
            overlay.remove();
            _showLevelUpHpChoice(pgId, -1, { newClassName: nome });
        };
    });
    overlay.querySelector('#luBackBtn').onclick = () => {
        overlay.remove();
        _showLevelUpPicker(pgId, classi);
    };
    document.body.appendChild(overlay);
}

function _showLevelUpHpChoice(pgId, classIdx, opts = {}) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const isNewClass = !!opts.newClassName;
    const cls = isNewClass
        ? { nome: opts.newClassName, livello: 0 }
        : (pg.classi || [])[classIdx];
    if (!cls) return;

    const die = CLASS_HIT_DIE[cls.nome] || 8;
    const conMod = Math.floor((((pg.costituzione) || 10) - 10) / 2);
    const avgGain = Math.max(1, dieAvg(die) + conMod);
    const conSign = conMod >= 0 ? '+' : '';
    const conLabel = `${conSign}${conMod}`;
    const newLvl = (parseInt(cls.livello) || 0) + 1;

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal levelup-pf-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="levelup-title">Punti Ferita</h3>
        <p class="levelup-sub">${escapeHtml(cls.nome)}: Liv ${cls.livello || 1} → ${newLvl}<br><small>Dado: 1d${die} · COS ${conLabel}</small></p>
        <button type="button" class="levelup-pf-avg-btn" id="lupfAvgBtn">Tiro medio (+${avgGain})</button>
        <div class="levelup-pf-roll-row">
            <input type="number" class="levelup-pf-input" id="lupfInput" placeholder="—" min="1" inputmode="numeric">
            <button type="button" class="levelup-pf-roll-btn" id="lupfRollBtn">Tira il dado</button>
        </div>
        <div class="levelup-pf-detail" id="lupfDetail"></div>
        <div class="levelup-pf-actions">
            <button type="button" class="levelup-pf-cancel" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
            <button type="button" class="levelup-pf-confirm" id="lupfConfirmBtn" disabled>Conferma</button>
        </div>
    </div>`;

    const input = overlay.querySelector('#lupfInput');
    const detail = overlay.querySelector('#lupfDetail');
    const avgBtn = overlay.querySelector('#lupfAvgBtn');
    const rollBtn = overlay.querySelector('#lupfRollBtn');
    const confirmBtn = overlay.querySelector('#lupfConfirmBtn');

    const refreshConfirm = () => {
        const v = parseInt(input.value);
        confirmBtn.disabled = !(Number.isFinite(v) && v >= 1);
    };

    avgBtn.onclick = () => {
        input.value = avgGain;
        detail.textContent = `Tiro medio: ${dieAvg(die)} ${conLabel} COS = ${avgGain} PV`;
        refreshConfirm();
    };
    rollBtn.onclick = () => {
        const roll = 1 + Math.floor(Math.random() * die);
        const total = Math.max(1, roll + conMod);
        input.value = total;
        detail.textContent = `1d${die} = ${roll} ${conLabel} COS = ${total} PV`;
        refreshConfirm();
    };
    input.addEventListener('input', () => {
        // Se l'utente edita a mano, rimuovi il dettaglio (non corrisponde piu' al calcolo automatico).
        if (detail.textContent && !detail.dataset.locked) detail.textContent = '';
        refreshConfirm();
    });
    confirmBtn.onclick = async () => {
        const pvGain = parseInt(input.value);
        if (!Number.isFinite(pvGain) || pvGain < 1) return;
        const extra = detail.textContent ? ` (${detail.textContent})` : '';
        overlay.remove();
        await _doLevelUp(pgId, classIdx, pvGain, extra, opts);
    };

    document.body.appendChild(overlay);
    // Nessun auto-focus: evita la comparsa automatica della tastiera.
}

async function _doLevelUp(pgId, classIdx, pvGain, extraMsg = '', opts = {}) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const classi = (pg.classi || []).map(c => ({ ...c }));

    let cls;
    let isNewClass = false;
    if (opts && opts.newClassName) {
        // Multiclasse: aggiungo la nuova classe a livello 0 (verra' portata a 1 sotto).
        if (classi.some(c => c.nome === opts.newClassName)) {
            showNotification(`${opts.newClassName} e' gia' una classe del personaggio`);
            return;
        }
        cls = { nome: opts.newClassName, livello: 0 };
        classi.push(cls);
        classIdx = classi.length - 1;
        isNewClass = true;
    } else {
        cls = classi[classIdx];
        if (!cls) return;
    }

    const newLvl = (parseInt(cls.livello) || 0) + 1;
    if (newLvl > 20) { showNotification('Livello massimo raggiunto (20)'); return; }
    cls.livello = newLvl;
    classi[classIdx] = cls;

    const newPvMax = (parseInt(pg.punti_vita_max) || 0) + pvGain;
    const newPvAttuali = (pg.pv_attuali != null ? parseInt(pg.pv_attuali) : (parseInt(pg.punti_vita_max) || 0)) + pvGain;

    const dadi = { ...(pg.dadi_vita_disponibili || {}) };
    const currentDadi = dadi[cls.nome] != null ? parseInt(dadi[cls.nome]) : (newLvl - 1);
    dadi[cls.nome] = Math.min(newLvl, currentDadi + 1);

    const totalLevel = classi.reduce((s, c) => s + (parseInt(c.livello) || 0), 0);

    // Ricalcola gli slot incantesimo in base al nuovo livello, preservando "used".
    const newAutoSlots = calcSpellSlotsFromClassi(classi);
    const prevSlots = (pg.slot_incantesimo && typeof pg.slot_incantesimo === 'object') ? pg.slot_incantesimo : {};
    const newSlotIncantesimo = {};
    Object.keys(newAutoSlots).forEach(lvKey => {
        const lv = String(lvKey);
        const max = newAutoSlots[lvKey];
        const prev = prevSlots[lv] || prevSlots[parseInt(lv)] || null;
        const prevUsed = prev && Number.isFinite(parseInt(prev.used)) ? Math.min(parseInt(prev.used), max) : 0;
        newSlotIncantesimo[lv] = { max, current: Math.max(0, max - prevUsed), used: prevUsed };
    });

    // Aggiorna anche il display "classe" per coerenza con la stringa multiclasse.
    const classeDisplay = classi.map(c => `${c.nome} ${c.livello}`).join(' / ');

    const updates = {
        classi,
        classe: classeDisplay,
        livello: totalLevel,
        punti_vita_max: newPvMax,
        pv_attuali: newPvAttuali,
        dadi_vita_disponibili: dadi,
        slot_incantesimo: newSlotIncantesimo
    };

    pg.classi = classi;
    pg.classe = classeDisplay;
    pg.livello = totalLevel;
    pg.punti_vita_max = newPvMax;
    pg.pv_attuali = newPvAttuali;
    pg.dadi_vita_disponibili = dadi;
    pg.slot_incantesimo = newSlotIncantesimo;

    await schedaInstantSave(pgId, updates);
    if (isNewClass) {
        showNotification(`Aggiunto ${cls.nome} (multiclasse, liv 1) +${pvGain} PV${extraMsg}`);
    } else {
        showNotification(`${cls.nome} salito al livello ${newLvl} (+${pvGain} PV${extraMsg})`);
    }
    renderSchedaPersonaggio(pgId);
}

window.schedaHdChange = function(pgId, className, current, delta, max) {
    const pg = _schedaPgCache;
    if (!pg) return;
    let newVal = current + delta;
    if (newVal < 0) newVal = 0;
    if (max != null && newVal > max) newVal = max;

    const dadi = { ...(pg.dadi_vita_disponibili || {}) };
    dadi[className] = newVal;
    pg.dadi_vita_disponibili = dadi;

    const el = document.getElementById(`sHd_${className}`);
    if (el) el.textContent = newVal;

    const row = el?.closest('.scheda-hd-row');
    if (row) {
        const maxAttr = max != null ? max : 99;
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaHdChange('${pgId}','${className}',${newVal},-1,${maxAttr})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaHdChange('${pgId}','${className}',${newVal},1,${maxAttr})`);
    }

    schedaInstantSave(pgId, { dadi_vita_disponibili: dadi });
}

window.schedaClassResChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, max != null ? Math.min(max, current + delta) : current + delta);
    if (newVal === current) return;

    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    pg.risorse_classe[key] = newVal;

    const el = document.getElementById(`sCRes_${key}`);
    if (el) el.textContent = newVal;

    const row = el?.closest('.scheda-hd-row');
    if (row) {
        const maxAttr = max != null ? max : 99;
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaClassResChange('${pgId}','${key}',${newVal},-1,${maxAttr})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaClassResChange('${pgId}','${key}',${newVal},1,${maxAttr})`);
    }

    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
}

// Cambio current per le risorse di sottoclasse (counter / dice_pool / ward_pool).
// Persistite in pg.risorse_classe._subclass[key].
window.schedaSubclassResChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._subclass) pg.risorse_classe._subclass = {};
    pg.risorse_classe._subclass[key] = newVal;
    const el = document.getElementById(`sSubRes_${key}`);
    if (el) {
        el.textContent = newVal;
        const row = el.closest('.scheda-hd-row');
        if (row) {
            const btns = row.querySelectorAll('.scheda-hd-btn');
            if (btns[0]) btns[0].setAttribute('onclick', `schedaSubclassResChange('${pgId}','${key}',${newVal},-1,${max})`);
            if (btns[1]) btns[1].setAttribute('onclick', `schedaSubclassResChange('${pgId}','${key}',${newVal},1,${max})`);
        }
    }
    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
};

// Click su uno slot Portento: se vuoto chiede il valore (1-20),
// se pieno offre di "spendere" (svuotare) il dado salvato.
window.schedaPortentSlotClick = async function(pgId, key, idx, max) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._portent) pg.risorse_classe._portent = {};
    if (!Array.isArray(pg.risorse_classe._portent[key])) pg.risorse_classe._portent[key] = [];
    const arr = pg.risorse_classe._portent[key];
    while (arr.length < max) arr.push(null);
    arr.length = max;
    const cur = arr[idx];
    if (cur != null && cur >= 1 && cur <= 20) {
        // Pieno → conferma "spendi" con dialog custom (no browser confirm).
        const ok = await _schedaShowConfirmDialog({
            title: 'Spendere il Portento?',
            message: `Vuoi spendere il dado salvato con valore ${cur}?`,
            confirmLabel: 'Spendi',
            cancelLabel: 'Annulla',
            danger: true,
        });
        if (ok) {
            arr[idx] = null;
            await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
            openSchedaPersonaggio(pgId);
        }
    } else {
        // Vuoto → input valore (tastierino numerico custom, niente keyboard nativa).
        const n = await _schedaShowNumpadDialog({
            title: `Portento - Slot ${idx + 1}`,
            initial: '',
            min: 1,
            max: 20,
        });
        if (n == null) return;
        arr[idx] = n;
        await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
        openSchedaPersonaggio(pgId);
    }
};

// Tira tutti gli slot Portento ancora vuoti (utile al riposo lungo).
window.schedaPortentRollAll = async function(pgId, key, max) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._portent) pg.risorse_classe._portent = {};
    if (!Array.isArray(pg.risorse_classe._portent[key])) pg.risorse_classe._portent[key] = [];
    const arr = pg.risorse_classe._portent[key];
    while (arr.length < max) arr.push(null);
    arr.length = max;
    for (let i = 0; i < max; i++) {
        if (arr[i] == null) arr[i] = 1 + Math.floor(Math.random() * 20);
    }
    await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
    openSchedaPersonaggio(pgId);
};

// Apre l'editor per una risorsa di classe (auto-derivata): permette di
// sovrascrivere il nome e il valore massimo. Gli override sono
// memorizzati in pg.risorse_classe._overrides[key] e applicati al
// rendering. "Reset" li rimuove riportando i valori di default.
window.schedaOpenEditClassRes = function(pgId, key, defaultName, defaultMax) {
    const pg = _schedaPgCache;
    if (!pg || pg.id !== pgId) return;
    const overrides = (pg.risorse_classe && pg.risorse_classe._overrides && pg.risorse_classe._overrides[key]) || {};
    const curNome = overrides.nome || defaultName || '';
    const curMax = (typeof overrides.max === 'number' && overrides.max > 0) ? overrides.max : defaultMax;
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal" style="width:340px;text-align:left;">
        <h3 style="margin-bottom:12px;font-size:1rem;">Modifica risorsa</h3>
        <label style="display:block;font-size:0.78rem;color:var(--text-light);margin-bottom:4px;">Nome (opzionale)</label>
        <input type="text" id="schedaCResNome" class="hp-calc-input" value="${escapeHtml(curNome)}" placeholder="${escapeHtml(defaultName || '')}">
        <label style="display:block;font-size:0.78rem;color:var(--text-light);margin-bottom:4px;">Massimo</label>
        <input type="number" id="schedaCResMax" class="hp-calc-input" value="${curMax}" min="1" max="99">
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:10px;">Default: ${escapeHtml(defaultName || '')} / ${defaultMax}</div>
        <div class="dialog-actions">
            <button class="btn-secondary" id="schedaCResReset" style="background:#a55;color:#fff;border-color:#a55;">Reset</button>
            <button class="btn-secondary" id="schedaCResCancel">Annulla</button>
            <button class="btn-primary" id="schedaCResSave">Salva</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('schedaCResCancel').onclick = close;
    document.getElementById('schedaCResReset').onclick = async () => {
        if (!pg.risorse_classe) pg.risorse_classe = {};
        if (!pg.risorse_classe._overrides) pg.risorse_classe._overrides = {};
        delete pg.risorse_classe._overrides[key];
        await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
        close();
        openSchedaPersonaggio(pgId);
    };
    document.getElementById('schedaCResSave').onclick = async () => {
        const nome = (document.getElementById('schedaCResNome').value || '').trim();
        const maxRaw = parseInt(document.getElementById('schedaCResMax').value, 10);
        const maxVal = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : null;
        if (!pg.risorse_classe) pg.risorse_classe = {};
        if (!pg.risorse_classe._overrides) pg.risorse_classe._overrides = {};
        const ov = {};
        if (nome && nome !== defaultName) ov.nome = nome;
        if (maxVal && maxVal !== defaultMax) ov.max = maxVal;
        if (Object.keys(ov).length === 0) {
            delete pg.risorse_classe._overrides[key];
        } else {
            pg.risorse_classe._overrides[key] = ov;
        }
        // Se il max e' cambiato, clamp del current
        if (maxVal && pg.risorse_classe[key] != null && pg.risorse_classe[key] > maxVal) {
            pg.risorse_classe[key] = maxVal;
        }
        await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
        close();
        openSchedaPersonaggio(pgId);
    };
    // Nessun auto-focus: evita la comparsa automatica della tastiera.
};

window.schedaRaceResChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._race) pg.risorse_classe._race = {};
    pg.risorse_classe._race[key] = newVal;
    const el = document.getElementById(`sRRes_${key}`);
    if (el) el.textContent = newVal;
    const row = el ? el.closest('.scheda-hd-row') : null;
    if (row) {
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaRaceResChange('${pgId}','${key}',${newVal},-1,${max})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaRaceResChange('${pgId}','${key}',${newVal},1,${max})`);
    }
    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
};

window.schedaInnateSlotChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._innate) pg.risorse_classe._innate = {};
    pg.risorse_classe._innate[key] = newVal;
    const el = document.getElementById(`sInnSlot_${key}`);
    if (el) el.textContent = newVal;
    const row = el ? el.closest('.scheda-hd-row') : null;
    if (row) {
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaInnateSlotChange('${pgId}','${key}',${newVal},-1,${max})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaInnateSlotChange('${pgId}','${key}',${newVal},1,${max})`);
    }
    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
};

window.schedaInvocationSlotChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._invocations) pg.risorse_classe._invocations = {};
    pg.risorse_classe._invocations[key] = newVal;
    // Lo stesso slot puo' essere mostrato sia in pagina incantesimi
    // (sInvSlot_) sia nelle risorse di pagina 1 (sInvRes_): aggiorniamo
    // entrambe le viste.
    [`sInvSlot_${key}`, `sInvRes_${key}`].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = newVal;
        const row = el.closest('.scheda-hd-row');
        if (row) {
            const btns = row.querySelectorAll('.scheda-hd-btn');
            if (btns[0]) btns[0].setAttribute('onclick', `schedaInvocationSlotChange('${pgId}','${key}',${newVal},-1,${max})`);
            if (btns[1]) btns[1].setAttribute('onclick', `schedaInvocationSlotChange('${pgId}','${key}',${newVal},1,${max})`);
        }
    });
    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
};

window.schedaCustomResChange = function(pgId, index, current, delta, max) {
    const newVal = Math.max(0, Math.min(max, current + delta));
    if (newVal === current) return;

    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._custom) pg.risorse_classe._custom = [];
    const cr = pg.risorse_classe._custom[index];
    if (!cr) return;
    cr.current = newVal;

    const el = document.getElementById(`sCusRes_${index}`);
    if (el) el.textContent = newVal;

    const row = el?.closest('.scheda-hd-row');
    if (row) {
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaCustomResChange('${pgId}',${index},${newVal},-1,${max})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaCustomResChange('${pgId}',${index},${newVal},1,${max})`);
    }

    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
}

window.schedaOpenAddCustomRes = function(pgId, editIndex) {
    // editIndex opzionale: se passato, modifica una risorsa custom esistente
    const pg = _schedaPgCache;
    const editing = (editIndex != null && editIndex >= 0);
    const existing = editing ? (pg?.risorse_classe?._custom?.[editIndex] || null) : null;

    const initialType = (existing && existing.tipo === 'dadi') ? 'dadi' : 'punti';
    const initialDado = (existing && existing.dado) ? existing.dado : 'd8';
    const initialNome = existing ? (existing.nome || '') : '';
    const initialMax  = existing && Number.isFinite(parseInt(existing.max)) ? parseInt(existing.max) : 1;

    const dadiBtns = ['d4','d6','d8','d10','d12','d20'].map(d =>
        `<button type="button" class="btn-secondary custom-res-dice-btn ${d === initialDado ? 'active' : ''}" onclick="schedaCrDadoSelect('${d}')">${d}</button>`
    ).join('');

    const confirmFn = editing
        ? `schedaConfirmCustomRes('${pgId}', ${editIndex})`
        : `schedaConfirmCustomRes('${pgId}')`;
    const deleteBtn = editing
        ? `<button type="button" class="btn-danger" onclick="schedaDeleteCustomResFromEdit('${pgId}',${editIndex})">Elimina</button>`
        : '';

    const modalHtml = `
    <div class="modal active" id="customResModal">
        <div class="modal-content">
            <button class="modal-close" onclick="schedaCloseCustomResModal()">&times;</button>
            <h2>${editing ? 'Modifica Risorsa' : 'Aggiungi Risorsa'}</h2>
            <div class="form-group">
                <label class="form-label">Nome della risorsa</label>
                <input type="text" id="customResNome" class="form-input" placeholder="Es. Dadi di Superiorità" value="${escapeHtml(initialNome)}">
            </div>
            <div class="form-group">
                <label class="form-label">Tipo</label>
                <div class="custom-res-type-row">
                    <button type="button" class="btn-secondary custom-res-type-btn ${initialType === 'punti' ? 'active' : ''}" id="crTypePunti" onclick="schedaCrTypeSelect('punti')">Punti</button>
                    <button type="button" class="btn-secondary custom-res-type-btn ${initialType === 'dadi'  ? 'active' : ''}" id="crTypeDadi" onclick="schedaCrTypeSelect('dadi')">Dadi</button>
                </div>
            </div>
            <div class="form-group" id="crDadoGroup" style="display:${initialType === 'dadi' ? '' : 'none'};">
                <label class="form-label">Tipo di dado</label>
                <div class="custom-res-dice-row">${dadiBtns}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Utilizzi massimi</label>
                <input type="number" id="customResMax" class="form-input" min="1" value="${initialMax}" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)">
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <div>${deleteBtn}</div>
                <div style="display:flex;gap:8px;">
                    <button type="button" class="btn-secondary" onclick="schedaCloseCustomResModal()">Annulla</button>
                    <button type="button" class="btn-primary" onclick="${confirmFn}">${editing ? 'Salva' : 'Aggiungi'}</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    window._crType = initialType;
    window._crDado = initialDado;
}

window.schedaCrTypeSelect = function(tipo) {
    window._crType = tipo;
    document.getElementById('crTypePunti')?.classList.toggle('active', tipo === 'punti');
    document.getElementById('crTypeDadi')?.classList.toggle('active', tipo === 'dadi');
    document.getElementById('crDadoGroup').style.display = tipo === 'dadi' ? '' : 'none';
}

window.schedaCrDadoSelect = function(dado) {
    window._crDado = dado;
    document.querySelectorAll('.custom-res-dice-btn').forEach(b => b.classList.toggle('active', b.textContent === dado));
}

window.schedaConfirmCustomRes = async function(pgId, editIndex) {
    const nome = document.getElementById('customResNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome', 'error'); return; }
    const max = parseInt(document.getElementById('customResMax')?.value) || 1;
    const tipo = window._crType || 'punti';

    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._custom) pg.risorse_classe._custom = [];

    const editing = (editIndex != null && editIndex >= 0 && pg.risorse_classe._custom[editIndex]);
    if (editing) {
        // Modifica preservando il "current" (clampato al nuovo max).
        const prev = pg.risorse_classe._custom[editIndex];
        const prevCurrent = Number.isFinite(parseInt(prev.current)) ? parseInt(prev.current) : max;
        const updated = { nome, tipo, max, current: Math.max(0, Math.min(prevCurrent, max)) };
        if (tipo === 'dadi') updated.dado = window._crDado || 'd8';
        pg.risorse_classe._custom[editIndex] = updated;
    } else {
        const newRes = { nome, tipo, max, current: max };
        if (tipo === 'dadi') newRes.dado = window._crDado || 'd8';
        pg.risorse_classe._custom.push(newRes);
    }

    await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
    schedaCloseCustomResModal();

    if (pg.tipo_scheda === 'micro') {
        renderMicroScheda(pgId);
    } else {
        renderSchedaPersonaggio(pgId);
    }
    showNotification(editing ? 'Risorsa aggiornata' : 'Risorsa aggiunta');
}

window.schedaDeleteCustomResFromEdit = async function(pgId, index) {
    const ok = await _schedaShowConfirmDialog({
        title: 'Eliminare risorsa?',
        message: 'La risorsa verra\' eliminata definitivamente.',
        confirmLabel: 'Elimina', danger: true,
    });
    if (!ok) return;
    schedaCloseCustomResModal();
    await schedaDeleteCustomRes(pgId, index);
};

window.schedaDeleteCustomRes = async function(pgId, index) {
    const pg = _schedaPgCache;
    if (!pg?.risorse_classe?._custom) return;
    pg.risorse_classe._custom.splice(index, 1);

    await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });

    if (pg.tipo_scheda === 'micro') {
        renderMicroScheda(pgId);
    } else {
        renderSchedaPersonaggio(pgId);
    }
    showNotification('Risorsa rimossa');
}

window.schedaCloseCustomResModal = function() {
    const modal = document.getElementById('customResModal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
}

// =====================================================
// EQUIPAGGIAMENTO
// =====================================================
async function _recalcEquipFromStats(pgId) {
    const pg = _schedaPgCache;
    if (!pg || !pg.equipaggiamento || pg.equipaggiamento.length === 0) return;
    const modFor = calcMod(pg.forza || 10);
    const modDes = calcMod(pg.destrezza || 10);
    const totalLevel = (pg.classi || []).reduce((s, c) => s + (c.livello || 1), 0) || pg.livello || 1;
    const profBonus = calcBonusCompetenza(totalLevel);
    let changed = false;
    pg.equipaggiamento.forEach(e => {
        if (e.tipo === 'arma') {
            const armaRef = DND_ARMI.find(a => a.nome === e.nome);
            const isFinesse = e.proprieta?.some(p => p.includes('Accurata'));
            const isRanged = armaRef ? armaRef.cat.includes('distanza') : e.proprieta?.some(p => p.includes('Munizioni'));
            const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
            const magic = e.magic_bonus || 0;
            const newColpire = profBonus + atkMod + magic;
            const newDanno = atkMod + magic;
            if (e.bonus_colpire !== newColpire || e.bonus_danno !== newDanno) {
                e.bonus_colpire = newColpire;
                e.bonus_danno = newDanno;
                changed = true;
            }
        }
    });
    const newCA = calcCAFromEquip(pg);
    if (pg.classe_armatura !== newCA) {
        pg.classe_armatura = newCA;
        changed = true;
        const caEl = document.getElementById('schedaCA');
        if (caEl) caEl.textContent = newCA;
    }
    if (changed) {
        await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento, classe_armatura: pg.classe_armatura });
        renderSchedaPersonaggio(pgId);
    }
}

function formatEquipName(e) {
    const magic = e.magic_bonus ? ` +${e.magic_bonus}` : '';
    return escapeHtml(e.nome) + magic;
}

function buildEquipSection(pg) {
    const equip = pg.equipaggiamento || [];
    const armiRows = equip.filter(e => e.tipo === 'arma').map((e, i) => {
        const idx = equip.indexOf(e);
        const bonus = e.bonus_colpire != null ? (e.bonus_colpire >= 0 ? `+${e.bonus_colpire}` : e.bonus_colpire) : '-';
        const dmgBonus = e.bonus_danno || 0;
        const dannoStr = e.danni ? `${e.danni}${dmgBonus !== 0 ? (dmgBonus > 0 ? '+' + dmgBonus : dmgBonus) : ''}` : '-';
        return `<tr>
            <td class="equip-name-cell" onclick="schedaEditEquip('${pg.id}',${idx})">${formatEquipName(e)}</td>
            <td class="text-center">${bonus}</td>
            <td class="text-center">${dannoStr} ${e.tipo_danno ? escapeHtml(e.tipo_danno.slice(0,3)) + '.' : ''}</td>
            <td class="text-center"><button class="scheda-custom-res-del" onclick="schedaRemoveEquip('${pg.id}',${idx})">✕</button></td>
        </tr>`;
    }).join('');
    const armaturaItems = equip.filter(e => e.tipo === 'armatura' || e.tipo === 'scudo');
    const armaturaRows = armaturaItems.map(e => {
        const idx = equip.indexOf(e);
        const totalCA = (e.ca_base || 0) + (e.magic_bonus || 0);
        const magicStr = e.magic_bonus ? ` (+${e.magic_bonus})` : '';
        return `<tr>
            <td class="equip-name-cell" onclick="schedaEditEquip('${pg.id}',${idx})">${formatEquipName(e)}</td>
            <td class="text-center">${totalCA}${magicStr}</td>
            <td class="text-center">${e.categoria || '-'}</td>
            <td class="text-center"><button class="scheda-custom-res-del" onclick="schedaRemoveEquip('${pg.id}',${idx})">✕</button></td>
        </tr>`;
    }).join('');
    const FOCUS_LABELS_SHORT = {
        'arcano': 'Arcano',
        'druidico': 'Druidico',
        'sacro': 'Sacro',
        'componenti': 'Componenti',
        'altro': 'Altro',
    };
    const focusItems = equip.filter(e => e.tipo === 'focus');
    const focusRows = focusItems.map(e => {
        const idx = equip.indexOf(e);
        const tipoLabel = FOCUS_LABELS_SHORT[e.categoria] || '-';
        return `<tr>
            <td class="equip-name-cell" onclick="schedaEditEquip('${pg.id}',${idx})">${formatEquipName(e)}</td>
            <td class="text-center">${tipoLabel}</td>
            <td class="text-center"><button class="scheda-custom-res-del" onclick="schedaRemoveEquip('${pg.id}',${idx})">✕</button></td>
        </tr>`;
    }).join('');
    return `<div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Equipaggiamento
            <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenAddEquip('${pg.id}')" title="Aggiungi">&#9998;</button>
        </div>
        <div class="scheda-section-body">
        ${armiRows ? `<table class="scheda-equip-table">
            <thead><tr><th>Arma</th><th>Colpire</th><th>Danno</th><th></th></tr></thead>
            <tbody>${armiRows}</tbody>
        </table>` : ''}
        ${armaturaRows ? `<table class="scheda-equip-table" style="margin-top:8px;">
            <thead><tr><th>Armatura</th><th>CA</th><th>Tipo</th><th></th></tr></thead>
            <tbody>${armaturaRows}</tbody>
        </table>` : ''}
        ${focusRows ? `<table class="scheda-equip-table" style="margin-top:8px;">
            <thead><tr><th>Focus</th><th>Tipo</th><th></th></tr></thead>
            <tbody>${focusRows}</tbody>
        </table>` : ''}
        ${!armiRows && !armaturaRows && !focusRows ? '<span class="scheda-empty">Nessun equipaggiamento</span>' : ''}
        </div>
    </div>`;
}

// Bonus extra inseriti manualmente dall'utente (oggetti che non sono armatura/scudo,
// privilegi non auto-applicati, ecc.). Sempre normalizzato per evitare null-checks.
//
// Nuovo schema (lista di bonus singoli):
//   { ca: [{nome, valore}, ...],
//     incantatori: { "Mago": { atk: [...], dc: [...] }, ... },
//     spells_prepared_max: 0 }
//
// Schema legacy (numero singolo): viene migrato al volo a un'unica entry
// con nome "Manuale".
function _normalizeBonusList(v) {
    if (Array.isArray(v)) {
        return v
            .map(b => ({
                nome: String(b?.nome ?? '').trim().slice(0, 80) || 'Manuale',
                valore: parseInt(b?.valore) || 0,
            }))
            .filter(b => b.valore !== 0);
    }
    const n = parseInt(v) || 0;
    if (n) return [{ nome: 'Manuale', valore: n }];
    return [];
}

function _sumBonusList(arr) {
    return (arr || []).reduce((s, b) => s + (parseInt(b.valore) || 0), 0);
}

function _getBonusManuali(pg) {
    const bm = (pg && typeof pg.bonus_manuali === 'object' && pg.bonus_manuali) ? pg.bonus_manuali : {};
    const incRaw = (bm.incantatori && typeof bm.incantatori === 'object') ? bm.incantatori : {};
    const inc = {};
    for (const cn of Object.keys(incRaw)) {
        const e = incRaw[cn] || {};
        inc[cn] = {
            atk: _normalizeBonusList(e.atk),
            dc: _normalizeBonusList(e.dc),
        };
    }
    const tsRaw = (bm.tiri_salvezza && typeof bm.tiri_salvezza === 'object') ? bm.tiri_salvezza : {};
    const ts = {};
    for (const ab of Object.keys(tsRaw)) {
        ts[ab] = _normalizeBonusList(tsRaw[ab]);
    }
    return {
        ca: _normalizeBonusList(bm.ca),
        incantatori: inc,
        tiri_salvezza: ts,
        spells_prepared_max: parseInt(bm.spells_prepared_max) || 0,
    };
}

function _getCasterBonusFor(pg, classeNome) {
    const inc = _getBonusManuali(pg).incantatori;
    const e = inc[classeNome] || { atk: [], dc: [] };
    return { atk: _sumBonusList(e.atk), dc: _sumBonusList(e.dc) };
}

function _getSaveBonusFor(pg, abilityKey) {
    const ts = _getBonusManuali(pg).tiri_salvezza;
    return _sumBonusList(ts[abilityKey] || []) + _sumBonusList(ts._all || []);
}

// Confeziona l'oggetto da salvare a partire da una versione normalizzata di
// bonus_manuali, preservando spells_prepared_max e altre chiavi future.
function _buildBonusManualiPayload(parsed) {
    return {
        ca: parsed.ca || [],
        incantatori: parsed.incantatori || {},
        tiri_salvezza: parsed.tiri_salvezza || {},
        spells_prepared_max: parsed.spells_prepared_max || 0,
    };
}

function calcCAFromEquip(pg) {
    const equip = pg.equipaggiamento || [];
    const desMod = calcMod(pg.destrezza || 10);
    const armor = equip.find(e => e.tipo === 'armatura');
    const shield = equip.find(e => e.tipo === 'scudo');
    let ca;
    if (armor) {
        if (armor.mod_des) {
            const desBonus = armor.max_des < 99 ? Math.min(desMod, armor.max_des) : desMod;
            ca = armor.ca_base + desBonus;
        } else {
            ca = armor.ca_base;
        }
    } else {
        const classNames = (pg.classi || []).map(c => c.nome);
        if (classNames.includes('Barbaro')) {
            ca = 10 + desMod + calcMod(pg.costituzione || 10);
        } else if (classNames.includes('Monaco')) {
            ca = 10 + desMod + calcMod(pg.saggezza || 10);
        } else {
            ca = 10 + desMod;
        }
    }
    if (armor?.magic_bonus) ca += armor.magic_bonus;
    if (shield) ca += shield.ca_base + (shield.magic_bonus || 0);
    ca += _sumBonusList(_getBonusManuali(pg).ca);
    return ca;
}

function _caModStr(val, statLabel) {
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val} <span class="ca-stat-label">(${statLabel})</span>`;
}

function getCABreakdown(pg) {
    const equip = pg.equipaggiamento || [];
    const desMod = calcMod(pg.destrezza || 10);
    const armor = equip.find(e => e.tipo === 'armatura');
    const shield = equip.find(e => e.tipo === 'scudo');
    const lines = [];
    if (armor) {
        const magic = armor.magic_bonus ? ` +${armor.magic_bonus} <span class="ca-stat-label">(magico)</span>` : '';
        let desc = `${escapeHtml(armor.nome)}: ${armor.ca_base}`;
        if (armor.mod_des) {
            const desBonus = armor.max_des < 99 ? Math.min(desMod, armor.max_des) : desMod;
            const maxNote = armor.max_des < 99 ? ` max ${armor.max_des}` : '';
            desc += ` ${_caModStr(desBonus, 'des' + maxNote)}`;
        }
        desc += magic;
        lines.push(desc);
    } else {
        const classNames = (pg.classi || []).map(c => c.nome);
        if (classNames.includes('Barbaro')) {
            const cosMod = calcMod(pg.costituzione || 10);
            lines.push(`Senza armatura: 10 ${_caModStr(desMod, 'des')} ${_caModStr(cosMod, 'cos')}`);
        } else if (classNames.includes('Monaco')) {
            const sagMod = calcMod(pg.saggezza || 10);
            lines.push(`Senza armatura: 10 ${_caModStr(desMod, 'des')} ${_caModStr(sagMod, 'sag')}`);
        } else {
            lines.push(`Senza armatura: 10 ${_caModStr(desMod, 'des')}`);
        }
    }
    if (shield) {
        const shieldMagic = shield.magic_bonus ? ` +${shield.magic_bonus} <span class="ca-stat-label">(magico)</span>` : '';
        lines.push(`${escapeHtml(shield.nome)}: +${shield.ca_base}${shieldMagic}`);
    }
    const extras = _getBonusManuali(pg).ca;
    extras.forEach(b => {
        const sign = b.valore >= 0 ? '+' : '';
        lines.push(`${escapeHtml(b.nome)}: ${sign}${b.valore} <span class="ca-stat-label">(manuale)</span>`);
    });
    return lines;
}

// =====================================================
// BONUS MANUALI: CA e Statistiche Incantatore
// =====================================================
// =====================================================
// MODAL: lista editabile di bonus manuali (riusabile)
// =====================================================
// La dialog principale (CA / Save / Caster) mostra solo CHIP cliccabili.
// L'add/edit di un singolo bonus avviene in una dialog secondaria
// sovrapposta che modifica direttamente lo stato condiviso e fa re-render.
let _bonusListState = null;
let _bonusEditState = null;

// Sostituite dal nuovo flusso a chip; mantenute come stub vuoti per
// retro-compatibilita' con eventuali handler inline (no-op).
function _bonusListSyncFromInputs() {}
function _bonusGroupSyncFromInputs() {}

function _bonusChipHtml(b, onClickCall, opts = {}) {
    const v = parseInt(b.valore) || 0;
    const sign = v >= 0 ? '+' : '';
    const cls = ['bonus-chip'];
    if (v < 0) cls.push('negative');
    if (opts.global) cls.push('is-global');
    const tagHtml = opts.tag ? `<span class="bonus-chip-tag">${escapeHtml(opts.tag)}</span>` : '';
    const safeOnClick = onClickCall.replace(/"/g, '&quot;');
    return `<button type="button" class="${cls.join(' ')}" onclick="${safeOnClick}" title="Modifica bonus">
        <span class="bonus-chip-name">${escapeHtml(b.nome || 'Manuale')}</span>
        <span class="bonus-chip-val">${sign}${v}</span>
        ${tagHtml}
    </button>`;
}

function _bonusListRender() {
    if (!_bonusListState) return;
    const container = document.getElementById('bonusListContainer');
    if (!container) return;

    let html = '';
    let tot = 0;
    if (_bonusListState.kind === 'ca') {
        const items = _bonusListState.items;
        tot = _sumBonusList(items);
        html = items.length
            ? items.map((b, i) => _bonusChipHtml(b, `schedaBonusEditCA(${i})`)).join('')
            : '<div class="bonus-list-empty">Nessun bonus. Clicca "+ Aggiungi bonus" per inserirne uno.</div>';
    } else if (_bonusListState.kind === 'save') {
        const local = _bonusListState.items;
        const global = _bonusListState.globalItems;
        tot = _sumBonusList(local) + _sumBonusList(global);
        const localChips = local.map((b, i) => _bonusChipHtml(b, `schedaBonusEditSave(${i},'single')`));
        const globalChips = global.map((b, i) => _bonusChipHtml(b, `schedaBonusEditSave(${i},'all')`, { global: true, tag: 'A tutti i TS' }));
        const all = [...localChips, ...globalChips];
        html = all.length
            ? all.join('')
            : '<div class="bonus-list-empty">Nessun bonus. Clicca "+ Aggiungi bonus" per inserirne uno.</div>';
    }
    container.innerHTML = html;

    const totEl = document.getElementById('bonusListTotal');
    if (totEl) totEl.textContent = tot >= 0 ? `+${tot}` : `${tot}`;
}

window.schedaBonusListAdd = function() {
    if (!_bonusListState) return;
    if (_bonusListState.kind === 'ca') _bonusEditOpen({ parentKind: 'ca', isNew: true });
    else if (_bonusListState.kind === 'save') _bonusEditOpen({ parentKind: 'save', isNew: true, scope: 'single' });
};

window.schedaBonusEditCA = function(idx) {
    if (!_bonusListState?.items?.[idx]) return;
    _bonusEditOpen({ parentKind: 'ca', isNew: false, itemIdx: idx, item: { ..._bonusListState.items[idx] } });
};

window.schedaBonusEditSave = function(idx, scope) {
    if (!_bonusListState) return;
    const arr = scope === 'all' ? _bonusListState.globalItems : _bonusListState.items;
    if (!arr?.[idx]) return;
    _bonusEditOpen({
        parentKind: 'save',
        isNew: false,
        itemIdx: idx,
        scope,
        originalScope: scope,
        item: { ...arr[idx] },
    });
};

window.schedaBonusEditCaster = function(gi, idx) {
    if (!_bonusListState?.groups?.[gi]?.items?.[idx]) return;
    _bonusEditOpen({
        parentKind: 'caster',
        isNew: false,
        groupIdx: gi,
        itemIdx: idx,
        item: { ..._bonusListState.groups[gi].items[idx] },
    });
};

// =====================================================
// MODAL secondaria: editor di un singolo bonus
// =====================================================
function _bonusEditOpen(state) {
    _bonusEditState = {
        item: { nome: '', valore: 1 },
        ...state,
    };
    if (!_bonusEditState.item.nome && !_bonusEditState.item.valore) {
        _bonusEditState.item = { nome: '', valore: 1 };
    }
    _bonusEditRender();
}

function _bonusEditRender() {
    const existing = document.getElementById('bonusEditOverlay');
    if (existing) existing.remove();
    if (!_bonusEditState) return;

    const e = _bonusEditState;
    const title = e.isNew ? 'Aggiungi bonus' : 'Modifica bonus';

    let scopeHtml = '';
    if (e.parentKind === 'save') {
        const abilityLabel = _ABILITY_LABELS[_bonusListState?.abilityKey] || _bonusListState?.abilityKey || '';
        const scope = e.scope || 'single';
        scopeHtml = `
        <div class="bonus-edit-field">
            <label>Applica a</label>
            <div class="bonus-edit-scope">
                <label class="bonus-edit-scope-opt ${scope==='single'?'selected':''}">
                    <input type="radio" name="bonusScope" value="single" ${scope==='single'?'checked':''} onchange="schedaBonusEditorSetScope('single')">
                    <span>Solo TS ${escapeHtml(abilityLabel)}</span>
                </label>
                <label class="bonus-edit-scope-opt ${scope==='all'?'selected':''}">
                    <input type="radio" name="bonusScope" value="all" ${scope==='all'?'checked':''} onchange="schedaBonusEditorSetScope('all')">
                    <span>Tutti i TS</span>
                </label>
            </div>
        </div>`;
    }

    const deleteBtn = e.isNew ? '' : '<button class="hp-calc-btn dmg" onclick="schedaBonusEditorDelete()">Elimina</button>';
    const v = parseInt(e.item.valore) || 0;
    const placeholderName = e.parentKind === 'caster' ? 'Es. Bastone del Potere'
        : e.parentKind === 'save' ? 'Es. Mantello della Protezione'
        : 'Es. Anello di Protezione';

    const overlay = document.createElement('div');
    overlay.id = 'bonusEditOverlay';
    overlay.className = 'hp-calc-overlay bonus-edit-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-edit-modal">
            <button class="hp-calc-close" onclick="schedaBonusEditorClose()">&times;</button>
            <div class="hp-calc-title">${title}</div>
            <div class="bonus-edit-field">
                <label>Nome</label>
                <input type="text" id="bonusEditName" value="${escapeHtml(e.item.nome)}" placeholder="${placeholderName}" maxlength="80">
            </div>
            <div class="bonus-edit-field">
                <label>Valore</label>
                <div class="bonus-edit-val-row">
                    <button type="button" class="bonus-modal-step" onclick="schedaBonusEditorStep(-1)">−</button>
                    <input type="number" id="bonusEditValue" value="${v}" step="1">
                    <button type="button" class="bonus-modal-step" onclick="schedaBonusEditorStep(1)">+</button>
                </div>
            </div>
            ${scopeHtml}
            <div class="hp-calc-buttons bonus-edit-buttons">
                ${deleteBtn}
                <button class="hp-calc-btn heal" onclick="schedaBonusEditorSave()">Salva</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('bonusEditName')?.focus(), 50);
}

window.schedaBonusEditorSetScope = function(scope) {
    if (!_bonusEditState) return;
    _bonusEditState.scope = scope;
    // Aggiorna le classi visive senza ricostruire l'intera modal.
    document.querySelectorAll('#bonusEditOverlay .bonus-edit-scope-opt').forEach(el => {
        const inp = el.querySelector('input');
        el.classList.toggle('selected', inp?.value === scope);
    });
};

window.schedaBonusEditorStep = function(delta) {
    const inp = document.getElementById('bonusEditValue');
    if (!inp) return;
    const cur = parseInt(inp.value) || 0;
    inp.value = cur + delta;
};

window.schedaBonusEditorClose = function() {
    const o = document.getElementById('bonusEditOverlay');
    if (o) o.remove();
    _bonusEditState = null;
};

window.schedaBonusEditorSave = function() {
    if (!_bonusEditState || !_bonusListState) return;
    const nameEl = document.getElementById('bonusEditName');
    const valEl = document.getElementById('bonusEditValue');
    const nome = (nameEl?.value || '').trim().slice(0, 80) || 'Manuale';
    const valore = parseInt(valEl?.value) || 0;

    if (valore === 0) {
        showNotification('Inserisci un valore diverso da 0');
        return;
    }

    const e = _bonusEditState;
    const newItem = { nome, valore };

    if (e.parentKind === 'ca') {
        if (e.isNew) _bonusListState.items.push(newItem);
        else _bonusListState.items[e.itemIdx] = newItem;
        _bonusListRender();
    } else if (e.parentKind === 'save') {
        const newScope = e.scope || 'single';
        const newArrName = newScope === 'all' ? 'globalItems' : 'items';
        if (e.isNew) {
            _bonusListState[newArrName].push(newItem);
        } else {
            const origScope = e.originalScope || newScope;
            const origArrName = origScope === 'all' ? 'globalItems' : 'items';
            if (origArrName === newArrName) {
                _bonusListState[newArrName][e.itemIdx] = newItem;
            } else {
                _bonusListState[origArrName].splice(e.itemIdx, 1);
                _bonusListState[newArrName].push(newItem);
            }
        }
        _bonusListRender();
    } else if (e.parentKind === 'caster') {
        const g = _bonusListState.groups[e.groupIdx];
        if (!g) return;
        if (e.isNew) g.items.push(newItem);
        else g.items[e.itemIdx] = newItem;
        _bonusGroupRender(e.groupIdx);
    }

    schedaBonusEditorClose();
};

window.schedaBonusEditorDelete = function() {
    if (!_bonusEditState || !_bonusListState) return;
    const e = _bonusEditState;
    if (e.isNew) { schedaBonusEditorClose(); return; }

    if (e.parentKind === 'ca') {
        _bonusListState.items.splice(e.itemIdx, 1);
        _bonusListRender();
    } else if (e.parentKind === 'save') {
        const origArrName = (e.originalScope || e.scope) === 'all' ? 'globalItems' : 'items';
        _bonusListState[origArrName].splice(e.itemIdx, 1);
        _bonusListRender();
    } else if (e.parentKind === 'caster') {
        const g = _bonusListState.groups[e.groupIdx];
        if (g) g.items.splice(e.itemIdx, 1);
        _bonusGroupRender(e.groupIdx);
    }
    schedaBonusEditorClose();
};

// =====================================================
// MODAL CA
// =====================================================
window.schedaOpenCABonus = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const bm = _getBonusManuali(pg);
    const lines = getCABreakdown(pg);
    const breakdownHtml = `<div class="ca-breakdown">${lines.map(l => `<div class="ca-breakdown-line">${l}</div>`).join('')}</div>`;
    const totalCA = pg.classe_armatura || 10;

    _bonusListState = { kind: 'ca', pgId, items: bm.ca.map(b => ({ ...b })) };

    // Pulsante Armatura Magica: visibile solo se conosciuto/preparato e
    // il PG NON indossa armatura (la cui presenza la disattiverebbe).
    const armorEquipped = (pg.equipaggiamento || []).some(e => e.tipo === 'armatura');
    const knowsMageArmor = _pgKnowsSpellByName(pg, 'Armatura Magica', 'Mage Armor');
    const alreadyApplied = _bonusListState.items.some(b => /armatura\s*magica/i.test(b.nome || ''));
    const desMod = Math.floor(((pg.destrezza || 10) - 10) / 2);
    let mageArmorBtn = '';
    if (knowsMageArmor && !armorEquipped && !alreadyApplied) {
        mageArmorBtn = `<button type="button" class="bonus-quick-btn small" onclick="schedaApplyMageArmor()" title="Aggiunge un bonus +3 (Armatura Magica = 13 + Des)">
            ✦ Applica Armatura Magica (CA ${13 + desMod})
        </button>`;
    } else if (knowsMageArmor && armorEquipped) {
        mageArmorBtn = `<div class="bonus-modal-hint" style="color:#d29c2a;">Armatura Magica disponibile ma stai indossando un'armatura: rimuovila per applicarla.</div>`;
    }

    const existing = document.getElementById('caBonusOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'caBonusOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-modal bonus-list-modal">
            <button class="hp-calc-close" onclick="schedaCloseCABonus()">&times;</button>
            <div class="hp-calc-title">Classe Armatura</div>
            ${breakdownHtml}
            <div class="hp-calc-hp-display"><span class="hp-calc-current">${totalCA}</span></div>
            <div class="bonus-list-section">
                <div class="bonus-list-header">
                    <label class="bonus-modal-label">Bonus extra</label>
                    <span class="bonus-list-total-label">Tot: <span id="bonusListTotal">+0</span></span>
                </div>
                <div id="bonusListContainer" class="bonus-list-container"></div>
                <button type="button" class="bonus-list-add-btn" onclick="schedaBonusListAdd()">+ Aggiungi bonus</button>
                ${mageArmorBtn}
                <div class="bonus-modal-hint">Inserisci ogni bonus separatamente: Anello di Protezione +1, Mantello del Mago Battagliero +1, ecc.</div>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaCABonusConfirm('${pgId}')">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    _bonusListRender();
};

window.schedaCloseCABonus = function() {
    const o = document.getElementById('caBonusOverlay');
    if (o) o.remove();
    _bonusListState = null;
};

window.schedaApplyMageArmor = function() {
    if (!_bonusListState || _bonusListState.kind !== 'ca') return;
    _bonusListSyncFromInputs();
    // Armatura Magica: CA = 13 + Des (sostituisce il 10 base senza armatura).
    // Equivalente a un bonus piatto di +3 alla CA base.
    _bonusListState.items.push({ nome: 'Armatura Magica', valore: 3 });
    _bonusListRender();
    showNotification('Armatura Magica applicata (+3)');
};

window.schedaCABonusConfirm = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    _bonusListSyncFromInputs();

    const cleaned = (_bonusListState?.items || [])
        .map(b => ({ nome: (b.nome || 'Manuale').trim().slice(0, 80) || 'Manuale', valore: parseInt(b.valore) || 0 }))
        .filter(b => b.valore !== 0);

    const bm = _getBonusManuali(pg);
    const next = _buildBonusManualiPayload({
        ca: cleaned,
        incantatori: bm.incantatori,
        tiri_salvezza: bm.tiri_salvezza,
        spells_prepared_max: bm.spells_prepared_max,
    });
    pg.bonus_manuali = next;

    const newCA = calcCAFromEquip(pg);
    pg.classe_armatura = newCA;

    const caEl = document.getElementById('schedaCA');
    if (caEl) caEl.textContent = newCA;

    schedaCloseCABonus();
    await schedaInstantSave(pgId, { bonus_manuali: next, classe_armatura: newCA });
    showNotification(`CA aggiornata: ${newCA}`);
};

// =====================================================
// MODAL Bonus Tiri Salvezza
// =====================================================
const _ABILITY_LABELS = {
    forza: 'Forza',
    destrezza: 'Destrezza',
    costituzione: 'Costituzione',
    intelligenza: 'Intelligenza',
    saggezza: 'Saggezza',
    carisma: 'Carisma',
};

window.schedaOpenSaveBonus = function(pgId, abilityKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const bm = _getBonusManuali(pg);
    const items = (bm.tiri_salvezza[abilityKey] || []).map(b => ({ ...b }));
    const globalItems = (bm.tiri_salvezza._all || []).map(b => ({ ...b }));

    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const val = pg[abilityKey] || 10;
    const mod = Math.floor((val - 10) / 2);
    const isProf = (pg.tiri_salvezza || []).includes(abilityKey);
    const profPart = isProf ? ` + comp +${bonusComp}` : '';
    const baseTot = mod + (isProf ? bonusComp : 0);
    const baseStr = baseTot >= 0 ? `+${baseTot}` : `${baseTot}`;

    _bonusListState = { kind: 'save', pgId, abilityKey, items, globalItems };

    const labelAb = _ABILITY_LABELS[abilityKey] || abilityKey;
    const headerInfo = `Base: mod ${mod >= 0 ? '+' : ''}${mod}${profPart} = <b>${baseStr}</b>`;

    const existing = document.getElementById('saveBonusOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'saveBonusOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-modal bonus-list-modal">
            <button class="hp-calc-close" onclick="schedaCloseSaveBonus()">&times;</button>
            <div class="hp-calc-title">Bonus TS – ${escapeHtml(labelAb)}</div>
            <div class="bonus-modal-info">${headerInfo}</div>
            <div class="bonus-list-section">
                <div class="bonus-list-header">
                    <label class="bonus-modal-label">Bonus extra</label>
                    <span class="bonus-list-total-label">Tot: <span id="bonusListTotal">+0</span></span>
                </div>
                <div id="bonusListContainer" class="bonus-list-container"></div>
                <button type="button" class="bonus-list-add-btn" onclick="schedaBonusListAdd()">+ Aggiungi bonus</button>
                <div class="bonus-modal-hint">Es. <i>Mantello della Protezione</i> +1, <i>Privilegio di classe</i> +2, ecc.</div>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaSaveBonusConfirm('${pgId}','${abilityKey}')">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    _bonusListRender();
};

window.schedaCloseSaveBonus = function() {
    const o = document.getElementById('saveBonusOverlay');
    if (o) o.remove();
    _bonusListState = null;
};

window.schedaSaveBonusConfirm = async function(pgId, abilityKey) {
    const pg = _schedaPgCache;
    if (!pg) return;

    const cleanList = arr => (arr || [])
        .map(b => ({ nome: (b.nome || 'Manuale').trim().slice(0, 80) || 'Manuale', valore: parseInt(b.valore) || 0 }))
        .filter(b => b.valore !== 0);

    const cleanedLocal = cleanList(_bonusListState?.items);
    const cleanedGlobal = cleanList(_bonusListState?.globalItems);

    const bm = _getBonusManuali(pg);
    const ts = { ...(bm.tiri_salvezza || {}) };
    if (cleanedLocal.length) ts[abilityKey] = cleanedLocal;
    else delete ts[abilityKey];
    if (cleanedGlobal.length) ts._all = cleanedGlobal;
    else delete ts._all;

    const next = _buildBonusManualiPayload({
        ca: bm.ca,
        incantatori: bm.incantatori,
        tiri_salvezza: ts,
        spells_prepared_max: bm.spells_prepared_max,
    });
    pg.bonus_manuali = next;

    schedaCloseSaveBonus();

    // Aggiorna inline tutti i 6 TS (perche' i bonus globali influenzano tutti).
    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    SCHEDA_ABILITIES.forEach(a => {
        const v = pg[a.key] || 10;
        const m = Math.floor((v - 10) / 2);
        const isP = (pg.tiri_salvezza || []).includes(a.key);
        const extra = _getSaveBonusFor(pg, a.key);
        const sm = m + (isP ? bonusComp : 0) + extra;
        const ss = sm >= 0 ? `+${sm}` : `${sm}`;
        const mark = extra ? '<span class="scheda-bonus-mark" title="Bonus extra applicato">*</span>' : '';
        const el = document.getElementById(`sSave_${a.key}`);
        if (el) el.innerHTML = `${ss}${mark}`;
    });

    await schedaInstantSave(pgId, { bonus_manuali: next });
    showNotification(`TS ${labelOrKey(abilityKey)} aggiornato`);
};

function labelOrKey(k) {
    return _ABILITY_LABELS[k] || k;
}

// =====================================================
// MODAL Bonus Incantatore (Atk e DC separate)
// =====================================================
function _pgKnowsSpellByName(pg, nameIt, nameEn) {
    const list = pg?.incantesimi_conosciuti || [];
    if (!list.length) return false;
    const norm = s => String(s || '').toLowerCase();
    const targets = [norm(nameIt), norm(nameEn)].filter(Boolean);
    return list.some(n => {
        const sp = _resolveSpell(n);
        if (!sp) return targets.includes(norm(n));
        return targets.includes(norm(sp.name)) || targets.includes(norm(sp.name_en));
    });
}

function _openSpellBonusGeneric(pgId, classiArg, kind) {
    const pg = _schedaPgCache;
    if (!pg) return;
    let classi = [];
    try { classi = JSON.parse(decodeURIComponent(classiArg)); } catch (_) { classi = []; }
    if (!Array.isArray(classi) || classi.length === 0) return;

    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const ability = CLASS_SPELL_ABILITY[classi[0]];
    const abilVal = pg[ability] || 10;
    const mod = Math.floor((abilVal - 10) / 2);

    const bm = _getBonusManuali(pg);
    // _bonusListState multiplo: una entry per ciascuna classe del gruppo.
    _bonusListState = {
        kind: 'caster',
        pgId,
        casterKind: kind,
        classi: [...classi],
        groups: classi.map(cn => ({
            classe: cn,
            items: ((bm.incantatori[cn] || {})[kind] || []).map(b => ({ ...b })),
        })),
    };

    const title = kind === 'atk' ? 'Bonus tiro per colpire' : 'Bonus CD incantesimi';
    const baseInfo = kind === 'atk'
        ? `Base: mod ${mod >= 0 ? '+' : ''}${mod} + comp +${bonusComp} = <b>${(mod + bonusComp) >= 0 ? '+' : ''}${mod + bonusComp}</b>`
        : `Base: 8 + mod ${mod >= 0 ? '+' : ''}${mod} + comp +${bonusComp} = <b>${8 + mod + bonusComp}</b>`;
    const headerInfo = `${escapeHtml(classi.join(' / '))} · Caratteristica: <b>${ability}</b><br>${baseInfo}`;

    const groupsHtml = _bonusListState.groups.map((g, gi) => `
        <div class="bonus-list-group" data-gidx="${gi}">
            <div class="bonus-list-group-head">
                <span class="bonus-list-group-name">${escapeHtml(g.classe)}</span>
                <span class="bonus-list-total-label">Tot: <span id="bonusListGroupTotal_${gi}">+0</span></span>
            </div>
            <div id="bonusListGroupContainer_${gi}" class="bonus-list-container"></div>
            <button type="button" class="bonus-list-add-btn" onclick="schedaBonusGroupAdd(${gi})">+ Aggiungi bonus</button>
        </div>
    `).join('');

    const existing = document.getElementById('spellBonusOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'spellBonusOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-modal bonus-list-modal">
            <button class="hp-calc-close" onclick="schedaCloseSpellCasterBonus()">&times;</button>
            <div class="hp-calc-title">${title}</div>
            <div class="bonus-modal-info">${headerInfo}</div>
            ${groupsHtml}
            <div class="bonus-modal-hint">Inserisci ogni bonus separatamente con il suo nome (es. <i>Bastone del Potere</i> +2, <i>Stella della Notte</i> +1).</div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaSpellCasterBonusConfirm('${pgId}')">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    _bonusGroupRenderAll();
}

window.schedaOpenSpellAtkBonus = function(pgId, classiArg) {
    _openSpellBonusGeneric(pgId, classiArg, 'atk');
};

window.schedaOpenSpellDcBonus = function(pgId, classiArg) {
    _openSpellBonusGeneric(pgId, classiArg, 'dc');
};

function _bonusGroupRender(gi) {
    if (!_bonusListState || _bonusListState.kind !== 'caster') return;
    const g = _bonusListState.groups[gi];
    if (!g) return;
    const c = document.getElementById(`bonusListGroupContainer_${gi}`);
    if (!c) return;
    c.innerHTML = g.items.length
        ? g.items.map((b, i) => _bonusChipHtml(b, `schedaBonusEditCaster(${gi},${i})`)).join('')
        : '<div class="bonus-list-empty">Nessun bonus.</div>';
    const totEl = document.getElementById(`bonusListGroupTotal_${gi}`);
    if (totEl) {
        const tot = _sumBonusList(g.items);
        totEl.textContent = tot >= 0 ? `+${tot}` : `${tot}`;
    }
}

function _bonusGroupRenderAll() {
    if (!_bonusListState?.groups) return;
    _bonusListState.groups.forEach((_, gi) => _bonusGroupRender(gi));
}

window.schedaBonusGroupAdd = function(gi) {
    if (!_bonusListState?.groups?.[gi]) return;
    _bonusEditOpen({ parentKind: 'caster', isNew: true, groupIdx: gi });
};

window.schedaCloseSpellCasterBonus = function() {
    const o = document.getElementById('spellBonusOverlay');
    if (o) o.remove();
    _bonusListState = null;
};

window.schedaTogglePrepared = async function(pgId, spellName) {
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!_pgUsesPreparedSystem(pg)) return;
    const sp = _resolveSpell(spellName);
    if (!sp || sp.level === 0) return;

    let list = Array.isArray(pg.incantesimi_preparati) ? [...pg.incantesimi_preparati] : [];
    const idx = list.indexOf(spellName);
    const willPrepare = idx === -1;

    if (willPrepare) {
        // Controlla il limite massimo prima di aggiungere.
        const autoMax = _calcMaxPreparedAuto(pg);
        const overrideMax = parseInt(_getBonusManuali(pg).spells_prepared_max) || 0;
        const maxPrep = overrideMax > 0 ? overrideMax : autoMax;
        const currentCount = list
            .map(n => _resolveSpell(n))
            .filter(s => s && s.level > 0).length;
        if (maxPrep > 0 && currentCount >= maxPrep) {
            showNotification(`Limite raggiunto: ${currentCount}/${maxPrep} preparati`);
            return;
        }
        list.push(spellName);
    } else {
        list.splice(idx, 1);
    }

    pg.incantesimi_preparati = list;
    await schedaInstantSave(pgId, { incantesimi_preparati: list });
    if (typeof schedaOpenSpellPage === 'function') schedaOpenSpellPage(pgId);
};

window.schedaOpenPreparedMax = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const override = parseInt(_getBonusManuali(pg).spells_prepared_max) || 0;
    const auto = _calcMaxPreparedAuto(pg);
    // Pre-compila con override se presente, altrimenti con il calcolo automatico
    // (cosi' al primo accesso l'utente vede subito il valore standard).
    const initial = override > 0 ? override : auto;

    const existing = document.getElementById('preparedMaxOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'preparedMaxOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal bonus-modal">
            <button class="hp-calc-close" onclick="schedaClosePreparedMax()">&times;</button>
            <div class="hp-calc-title">Incantesimi preparati</div>
            <div class="bonus-modal-info">
                Numero massimo di incantesimi che il personaggio può preparare.<br>
                <b>Calcolo automatico</b>: <span style="color:var(--accent,#6c5ce7);font-weight:700;">${auto}</span>
                ${override > 0 ? ` · <b>Manuale attuale</b>: <span style="color:var(--warning,#d29c2a);font-weight:700;">${override}</span>` : ''}
            </div>
            <div class="bonus-modal-row">
                <label class="bonus-modal-label">Massimo preparati</label>
                <div class="bonus-modal-input-row">
                    <button class="bonus-modal-step" onclick="schedaPreparedMaxStep(-1)">−</button>
                    <input type="number" id="preparedMaxInput" class="bonus-modal-input" value="${initial}" step="1" min="0">
                    <button class="bonus-modal-step" onclick="schedaPreparedMaxStep(1)">+</button>
                </div>
                <div class="bonus-modal-hint">Regola standard: modificatore caratteristica + livello di classe (Paladino: livello/2). Imposta 0 per tornare al calcolo automatico.</div>
            </div>
            <div class="hp-calc-buttons">
                ${override > 0 ? `<button class="btn-secondary" onclick="schedaPreparedMaxReset('${pgId}')">Ripristina auto</button>` : ''}
                <button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaPreparedMaxConfirm('${pgId}')">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => { document.getElementById('preparedMaxInput')?.focus(); }, 50);
};

window.schedaPreparedMaxReset = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const bm = _getBonusManuali(pg);
    const next = _buildBonusManualiPayload({
        ca: bm.ca,
        incantatori: bm.incantatori,
        tiri_salvezza: bm.tiri_salvezza,
        spells_prepared_max: 0,
    });
    pg.bonus_manuali = next;
    schedaClosePreparedMax();
    await schedaInstantSave(pgId, { bonus_manuali: next });
    if (typeof schedaOpenSpellPage === 'function') schedaOpenSpellPage(pgId);
    showNotification('Ripristinato calcolo automatico');
};

window.schedaClosePreparedMax = function() {
    const o = document.getElementById('preparedMaxOverlay');
    if (o) o.remove();
};

window.schedaPreparedMaxStep = function(delta) {
    const inp = document.getElementById('preparedMaxInput');
    if (!inp) return;
    const cur = parseInt(inp.value) || 0;
    inp.value = Math.max(0, cur + delta);
};

window.schedaPreparedMaxConfirm = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const inp = document.getElementById('preparedMaxInput');
    const val = Math.max(0, parseInt(inp?.value) || 0);
    const auto = _calcMaxPreparedAuto(pg);

    const bm = _getBonusManuali(pg);
    // Se il valore inserito coincide con quello automatico, salviamo 0 per tornare
    // alla modalita' "auto" (cosi' resta agganciato al livello/caratteristica).
    const stored = (val === auto) ? 0 : val;
    const next = _buildBonusManualiPayload({
        ca: bm.ca,
        incantatori: bm.incantatori,
        tiri_salvezza: bm.tiri_salvezza,
        spells_prepared_max: stored,
    });
    pg.bonus_manuali = next;

    schedaClosePreparedMax();
    await schedaInstantSave(pgId, { bonus_manuali: next });
    if (typeof schedaOpenSpellPage === 'function') schedaOpenSpellPage(pgId);
    showNotification(stored ? `Massimo preparati: ${val} (manuale)` : `Massimo preparati: ${auto} (automatico)`);
};

window.schedaSpellCasterBonusConfirm = async function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!_bonusListState || _bonusListState.kind !== 'caster') return;

    _bonusGroupSyncFromInputs();

    const bm = _getBonusManuali(pg);
    const inc = {};
    // Copia tutti i dati esistenti per non perdere l'altro kind (atk vs dc).
    for (const cn of Object.keys(bm.incantatori || {})) {
        inc[cn] = {
            atk: (bm.incantatori[cn].atk || []).map(b => ({ ...b })),
            dc: (bm.incantatori[cn].dc || []).map(b => ({ ...b })),
        };
    }
    // Sovrascrive solo il kind editato per ogni classe del gruppo.
    const kind = _bonusListState.casterKind;
    _bonusListState.groups.forEach(g => {
        const cleaned = (g.items || [])
            .map(b => ({ nome: (b.nome || 'Manuale').trim().slice(0, 80) || 'Manuale', valore: parseInt(b.valore) || 0 }))
            .filter(b => b.valore !== 0);
        inc[g.classe] = inc[g.classe] || { atk: [], dc: [] };
        inc[g.classe][kind] = cleaned;
        if (!inc[g.classe].atk?.length && !inc[g.classe].dc?.length) delete inc[g.classe];
    });

    const next = _buildBonusManualiPayload({
        ca: bm.ca,
        incantatori: inc,
        tiri_salvezza: bm.tiri_salvezza,
        spells_prepared_max: bm.spells_prepared_max,
    });
    pg.bonus_manuali = next;

    schedaCloseSpellCasterBonus();
    await schedaInstantSave(pgId, { bonus_manuali: next });
    if (typeof schedaOpenSpellPage === 'function') schedaOpenSpellPage(pgId);
    showNotification('Bonus salvato');
};

window.schedaOpenAddEquip = function(pgId) {
    const ARMA_CATS = {
        'semplice_mischia': 'Armi da Mischia Semplici',
        'semplice_distanza': 'Armi a Distanza Semplici',
        'guerra_mischia': 'Armi da Mischia da Guerra',
        'guerra_distanza': 'Armi a Distanza da Guerra'
    };

    // Sezione "Dal tuo Inventario": oggetti magici/homebrew dell'inventario
    // classificati come Arma/Armatura/Scudo. Cliccandoli si avvia un
    // flusso di equip (con scelta del tipo D&D di base se ambiguo).
    const invSplit = _schedaInvWeaponsArmors(_schedaPgCache);
    const _invRowHtml = (handler, view, index) => {
        const sub = view._homebrew_sotto_tipo || view.sotto_tipo || '';
        const ench = view.magic_bonus || view._homebrew_incantamento || 0;
        const rar = view._homebrew_rarita || view.rarita || '';
        const rarClass = _invRarityClass(rar);
        const subText = [sub, rar].filter(Boolean).join(' · ') || 'Oggetto magico';
        return `<div class="pg-talento-item pg-talento-item-treasure ${rarClass}" onclick="${handler}('${pgId}',${index})">
            <span class="pg-talento-name">${escapeHtml(_invDisplayName(view) || 'Oggetto')}${ench ? ' +' + ench : ''}</span>
            <span class="option-source">${escapeHtml(subText)}</span>
        </div>`;
    };
    const tesoroArmiHtml = invSplit.armi.length
        ? `<div class="scheda-picker-cat">Dal tuo Inventario</div>${
            invSplit.armi.map(({ index, view }) => _invRowHtml('schedaAddArmaFromInventory', view, index)).join('')
        }` : '';
    const tesoroArmatureHtml = (invSplit.armature.length || invSplit.scudi.length)
        ? `<div class="scheda-picker-cat">Dal tuo Inventario</div>${
            [...invSplit.scudi, ...invSplit.armature]
                .map(({ index, view }) => _invRowHtml('schedaAddArmaturaFromInventory', view, index)).join('')
        }` : '';

    const customArmaHtml = `
        <div class="scheda-picker-cat">Creazione rapida</div>
        <div class="pg-talento-item pg-talento-item-custom" onclick="schedaOpenCustomWeaponDialog('${pgId}')">
            <span class="pg-talento-name">Arma personalizzata…</span>
            <span class="option-source">Nome, danni e proprietà a scelta</span>
        </div>`;

    const armiHtml = tesoroArmiHtml + customArmaHtml + Object.entries(ARMA_CATS).map(([cat, label]) => {
        const items = DND_ARMI.filter(a => a.cat === cat).map(a =>
            `<div class="pg-talento-item" onclick="schedaAddArma('${pgId}','${escapeHtml(a.nome)}')">
                <span class="pg-talento-name">${escapeHtml(a.nome)}</span>
                <span class="option-source">${a.danni} ${a.tipo_danno}</span>
            </div>`
        ).join('');
        return `<div class="scheda-picker-cat">${label}</div>${items}`;
    }).join('');

    const ARMATURA_LABELS = {
        'leggera': 'Armature Leggere',
        'media': 'Armature Medie',
        'pesante': 'Armature Pesanti',
        'scudo': 'Scudi'
    };
    const armatureHtml = tesoroArmatureHtml + ['leggera','media','pesante','scudo'].map(cat => {
        const label = ARMATURA_LABELS[cat];
        const items = DND_ARMATURE.filter(a => a.cat === cat).map(a =>
            `<div class="pg-talento-item" onclick="schedaAddArmatura('${pgId}','${escapeHtml(a.nome)}')">
                <span class="pg-talento-name">${escapeHtml(a.nome)}</span>
                <span class="option-source">CA ${a.ca_base}</span>
            </div>`
        ).join('');
        return `<div class="scheda-picker-cat">${label}</div>${items}`;
    }).join('');

    const FOCUS_LABELS = {
        'arcano': 'Focus Arcano',
        'druidico': 'Focus Druidico',
        'sacro': 'Simbolo Sacro',
        'componenti': 'Borsa con Componenti',
    };
    const focusCatHtml = ['arcano','druidico','sacro','componenti'].map(cat => {
        const label = FOCUS_LABELS[cat];
        const items = DND_FOCUS.filter(f => f.cat === cat).map(f =>
            `<div class="pg-talento-item" onclick="schedaAddFocus('${pgId}','${escapeHtml(f.nome)}')">
                <span class="pg-talento-name">${escapeHtml(f.nome)}</span>
                <span class="option-source">${escapeHtml(label)}</span>
            </div>`
        ).join('');
        return `<div class="scheda-picker-cat">${label}</div>${items}`;
    }).join('');
    // "Altro" → input libero del nome, senza dover creare un oggetto homebrew.
    const altroHtml = `
        <div class="scheda-picker-cat">Altro</div>
        <div class="pg-talento-item" onclick="schedaAddFocusAltro('${pgId}')">
            <span class="pg-talento-name">Focus Personalizzato…</span>
            <span class="option-source">Inserisci il nome (es. amuleto, bracciale)</span>
        </div>`;
    const focusHtml = focusCatHtml + altroHtml;

    const modalHtml = `
    <div class="modal active" id="equipModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="document.getElementById('equipModal')?.remove();document.body.style.overflow=''">&times;</button>
            <h2>Aggiungi Equipaggiamento</h2>
            <div class="picker-tabs">
                <button type="button" class="picker-tab active" data-panel="armi" onclick="schedaPickerSwitchTab(this,'armi')">Armi</button>
                <button type="button" class="picker-tab" data-panel="armature" onclick="schedaPickerSwitchTab(this,'armature')">Armature</button>
                <button type="button" class="picker-tab" data-panel="focus" onclick="schedaPickerSwitchTab(this,'focus')">Focus</button>
            </div>
            <div class="wizard-page-scroll">
                <div class="picker-tab-panel active" data-panel="armi">${armiHtml}</div>
                <div class="picker-tab-panel" data-panel="armature">${armatureHtml}</div>
                <div class="picker-tab-panel" data-panel="focus">${focusHtml}</div>
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="document.getElementById('equipModal')?.remove();document.body.style.overflow=''">Chiudi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

window.schedaAddFocus = async function(pgId, nome) {
    const focus = DND_FOCUS.find(f => f.nome === nome);
    if (!focus) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    pg.equipaggiamento.push({
        nome: focus.nome,
        tipo: 'focus',
        categoria: focus.cat,
    });
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento });
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${focus.nome} aggiunto`);
}

// Aggiunge un focus personalizzato chiedendo all'utente il nome.
// Utile per oggetti non standard (amuleto, bracciale, ecc.) senza dover
// creare un homebrew completo.
window.schedaAddFocusAltro = async function(pgId) {
    const nome = await _schedaShowInputDialog({
        title: 'Focus personalizzato',
        placeholder: 'Es. Amuleto, Bracciale, Anello…',
    });
    if (!nome) return;
    const trimmed = nome.trim();
    if (!trimmed) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    pg.equipaggiamento.push({
        nome: trimmed,
        tipo: 'focus',
        categoria: 'altro',
    });
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento });
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${trimmed} aggiunto`);
}

// Helper condiviso per i picker della scheda con tab a 2 vie (Armi/Armature, Linguaggi/Strumenti, ...)
window.schedaPickerSwitchTab = function(btn, panelId) {
    // Funziona sia per .modal-content (modal standard) sia per .hp-calc-modal
    // (overlay tipo dialog dell'inventario/sintonia).
    const modal = btn.closest('.modal-content, .hp-calc-modal');
    if (!modal) return;
    modal.querySelectorAll('.picker-tab').forEach(b => b.classList.toggle('active', b === btn));
    modal.querySelectorAll('.picker-tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === panelId));
};

window.schedaAddArma = async function(pgId, nome) {
    const arma = DND_ARMI.find(a => a.nome === nome);
    if (!arma) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    const profBonus = 2;
    const modFor = calcMod(pg.forza || 10);
    const modDes = calcMod(pg.destrezza || 10);
    const isFinesse = arma.proprieta.some(p => p.includes('Accurata'));
    const isRanged = arma.cat.includes('distanza');
    const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
    const dmgMod = atkMod;
    pg.equipaggiamento.push({
        nome: arma.nome, tipo: 'arma', danni: arma.danni, tipo_danno: arma.tipo_danno,
        proprieta: arma.proprieta, bonus_colpire: profBonus + atkMod, bonus_danno: dmgMod
    });
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento });
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${arma.nome} aggiunta`);
}

window.schedaAddArmatura = async function(pgId, nome) {
    const arm = DND_ARMATURE.find(a => a.nome === nome);
    if (!arm) return;
    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    if (arm.cat !== 'scudo') {
        pg.equipaggiamento = pg.equipaggiamento.filter(e => e.tipo !== 'armatura');
    } else {
        pg.equipaggiamento = pg.equipaggiamento.filter(e => e.tipo !== 'scudo');
    }
    pg.equipaggiamento.push({
        nome: arm.nome, tipo: arm.cat === 'scudo' ? 'scudo' : 'armatura',
        ca_base: arm.ca_base, categoria: arm.cat, mod_des: arm.mod_des, max_des: arm.max_des
    });
    const newCA = calcCAFromEquip(pg);
    pg.classe_armatura = newCA;
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento, classe_armatura: newCA });
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${arm.nome} equipaggiata — CA: ${newCA}`);
}

// ──────────────────────────────────────────────────────────────────────
// Equipaggia direttamente un'arma/armatura/scudo presa dall'inventario
// (oggetto magico SRD o homebrew). Se l'oggetto specifica univocamente
// il tipo D&D di base (es. "spada lunga"), equipaggia subito; altrimenti
// apre un picker per scegliere il tipo specifico (es. "qualsiasi spada").
// Il bonus magico (+N) si propaga ad attacco/danni o alla CA.
// ──────────────────────────────────────────────────────────────────────
function _schedaInvWeaponsArmors(pg) {
    const result = { armi: [], armature: [], scudi: [] };
    if (!pg || !Array.isArray(pg.inventario)) return result;
    pg.inventario.forEach((entry, index) => {
        const view = (typeof window._invResolveLive === 'function')
            ? window._invResolveLive(entry) : entry;
        const tipo = view._homebrew_tipo || view.tipo || '';
        const sub = (view._homebrew_sotto_tipo || view.sotto_tipo || '').toLowerCase();
        const nameLow = (view.nome || '').toLowerCase();
        if (tipo === 'Arma') {
            result.armi.push({ index, view });
        } else if (tipo === 'Scudo' || (tipo === 'Armatura' && sub.includes('scudo'))
                || nameLow === 'scudo' || nameLow.startsWith('scudo ')) {
            result.scudi.push({ index, view });
        } else if (tipo === 'Armatura') {
            result.armature.push({ index, view });
        }
    });
    return result;
}

// Trova candidati nel dataset DND per il sotto_tipo dato. Restituisce
// l'array di voci compatibili (potrebbe essere 0, 1 o N).
function _schedaMatchDndCandidates(dataset, subRaw, opts = {}) {
    if (!Array.isArray(dataset) || !dataset.length) return [];
    const sub = (subRaw || '').toLowerCase().trim();
    if (!sub) return [];
    // 1) match esatto sul nome
    const exact = dataset.filter(x => (x.nome || '').toLowerCase() === sub);
    if (exact.length) return exact;
    // 2) "qualsiasi X" o "X qualsiasi" -> match per parola chiave
    const cleaned = sub.replace(/\b(qualsiasi|qualunque|ogni|tutte le|tutti gli)\b/g, '').trim();
    // 3) per le armi: "spada", "ascia", "martello", ...
    if (cleaned) {
        const tokens = cleaned.split(/[\s,()\/]+/).filter(t => t && t.length >= 3);
        if (tokens.length) {
            const matches = dataset.filter(x => {
                const n = (x.nome || '').toLowerCase();
                return tokens.some(t => n.includes(t));
            });
            if (matches.length) return matches;
        }
    }
    // 4) per le armature: matcha per categoria (leggera/media/pesante)
    if (opts.armatura) {
        const cats = ['leggera','media','pesante'].filter(c => sub.includes(c));
        if (cats.length) {
            return dataset.filter(x => cats.includes(x.cat) && x.cat !== 'scudo');
        }
    }
    return [];
}

// Ricostruisce il "view" dell'oggetto inventario per index.
function _schedaInvViewAt(pg, index) {
    if (!pg || !Array.isArray(pg.inventario)) return null;
    const entry = pg.inventario[index];
    if (!entry) return null;
    return (typeof window._invResolveLive === 'function')
        ? window._invResolveLive(entry) : entry;
}

window.schedaAddArmaFromInventory = function(pgId, invIndex) {
    const pg = _schedaPgCache;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const sub = view._homebrew_sotto_tipo || view.sotto_tipo || '';
    const armi = (typeof DND_ARMI !== 'undefined') ? DND_ARMI : [];
    const candidates = _schedaMatchDndCandidates(armi, sub);
    if (candidates.length === 1) {
        return _schedaApplyInvArmaEquip(pgId, invIndex, candidates[0].nome);
    }
    _schedaPickInvWeaponBase(pgId, invIndex, candidates.length ? candidates : armi, view, sub);
};

window.schedaAddArmaturaFromInventory = function(pgId, invIndex) {
    const pg = _schedaPgCache;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const tipo = view._homebrew_tipo || view.tipo || '';
    const sub = (view._homebrew_sotto_tipo || view.sotto_tipo || '').toLowerCase();
    const nameLow = (view.nome || '').toLowerCase();
    const armature = (typeof DND_ARMATURE !== 'undefined') ? DND_ARMATURE : [];
    // Caso scudo: equipaggio subito lo scudo standard.
    if (tipo === 'Scudo' || sub.includes('scudo') || nameLow === 'scudo' || nameLow.startsWith('scudo ')) {
        const scudo = armature.find(a => a.cat === 'scudo');
        if (!scudo) return;
        return _schedaApplyInvArmaturaEquip(pgId, invIndex, scudo.nome);
    }
    const candidates = _schedaMatchDndCandidates(
        armature.filter(a => a.cat !== 'scudo'),
        sub,
        { armatura: true }
    );
    if (candidates.length === 1) {
        return _schedaApplyInvArmaturaEquip(pgId, invIndex, candidates[0].nome);
    }
    _schedaPickInvArmorBase(pgId, invIndex, candidates.length ? candidates : armature.filter(a => a.cat !== 'scudo'), view, sub);
};

function _schedaPickInvWeaponBase(pgId, invIndex, candidates, view, subRaw) {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const groups = {};
    for (const o of candidates) {
        const k = o.cat || 'altro';
        (groups[k] = groups[k] || []).push(o);
    }
    const groupOrder = ['semplice_mischia','semplice_distanza','guerra_mischia','guerra_distanza'];
    const groupLabels = {
        semplice_mischia: 'Semplici da Mischia',
        semplice_distanza: 'Semplici a Distanza',
        guerra_mischia: 'Da Guerra (Mischia)',
        guerra_distanza: 'Da Guerra (Distanza)',
    };
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        const ai = groupOrder.indexOf(a); const bi = groupOrder.indexOf(b);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
    const body = sortedKeys.map(k => {
        const rows = groups[k].map(o => `<button type="button" class="generic-magic-type-row"
            onclick="_schedaApplyInvArmaEquip('${pgId}',${invIndex},'${escapeHtml(o.nome).replace(/'/g, "\\'")}')">
            <span class="generic-magic-type-name">${escapeHtml(o.nome)}</span>
            <span class="generic-magic-type-sub">${escapeHtml(`${o.danni} ${o.tipo_danno}`)}</span>
        </button>`).join('');
        return `<div class="generic-magic-group-label">${escapeHtml(groupLabels[k] || k)}</div>${rows}`;
    }).join('');
    const customRow = `<button type="button" class="generic-magic-type-row generic-magic-type-row-custom"
        onclick="schedaOpenCustomWeaponDialog('${pgId}', { invIndex: ${invIndex} })">
        <span class="generic-magic-type-name">Arma personalizzata…</span>
        <span class="generic-magic-type-sub">Nome, danni e proprietà custom</span>
    </button>`;
    const bodyWithCustom = `<div class="generic-magic-group-label">Personalizzata</div>${customRow}${body}`;
    overlay.innerHTML = `<div class="hp-calc-modal generic-magic-modal generic-magic-modal-wide">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="generic-magic-title">${escapeHtml(_invDisplayName(view) || 'Arma')}${ench ? ' +' + ench : ''}</h3>
        <p class="generic-magic-sub">Scegli il tipo di arma di base${subRaw ? ` (${escapeHtml(subRaw)})` : ''}</p>
        <div class="generic-magic-type-list">${bodyWithCustom}</div>
        <div class="dialog-actions" style="margin-top:12px;justify-content:flex-end;">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
}

function _schedaPickInvArmorBase(pgId, invIndex, candidates, view, subRaw) {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const groups = {};
    for (const o of candidates) {
        const k = o.cat || 'altro';
        (groups[k] = groups[k] || []).push(o);
    }
    const groupOrder = ['leggera','media','pesante'];
    const groupLabels = {
        leggera: 'Armatura Leggera',
        media: 'Armatura Media',
        pesante: 'Armatura Pesante',
    };
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        const ai = groupOrder.indexOf(a); const bi = groupOrder.indexOf(b);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
    const body = sortedKeys.map(k => {
        const rows = groups[k].map(o => `<button type="button" class="generic-magic-type-row"
            onclick="_schedaApplyInvArmaturaEquip('${pgId}',${invIndex},'${escapeHtml(o.nome).replace(/'/g, "\\'")}')">
            <span class="generic-magic-type-name">${escapeHtml(o.nome)}</span>
            <span class="generic-magic-type-sub">CA ${o.ca_base} · ${escapeHtml(o.cat)}</span>
        </button>`).join('');
        return `<div class="generic-magic-group-label">${escapeHtml(groupLabels[k] || k)}</div>${rows}`;
    }).join('');
    overlay.innerHTML = `<div class="hp-calc-modal generic-magic-modal generic-magic-modal-wide">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="generic-magic-title">${escapeHtml(_invDisplayName(view) || 'Armatura')}${ench ? ' +' + ench : ''}</h3>
        <p class="generic-magic-sub">Scegli il tipo di armatura di base${subRaw ? ` (${escapeHtml(subRaw)})` : ''}</p>
        <div class="generic-magic-type-list">${body}</div>
        <div class="dialog-actions" style="margin-top:12px;justify-content:flex-end;">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
}

// Costruisce il display name per un'entry equipaggiamento creata da un
// oggetto dell'inventario. Rimuove il "+N" finale (sara' riapplicato da
// formatEquipName via magic_bonus) e omette "(Tipo Base)" quando il
// nome dell'oggetto contiene gia' il nome della base D&D (evita
// duplicati tipo "Pugnale (Pugnale)" o "Pugnale +2 (Pugnale) +2").
function _schedaBuildEquipDisplayName(invName, baseName) {
    const stripped = (invName || '').replace(/\s*\+\d+\s*$/, '').trim();
    const lowName = stripped.toLowerCase();
    const lowBase = (baseName || '').toLowerCase().trim();
    if (!stripped) return baseName || 'Oggetto';
    if (!lowBase || lowName === lowBase || lowName.includes(lowBase)) {
        return stripped;
    }
    return `${stripped} (${baseName})`;
}

// Garantisce che l'entry inventario abbia un uid stabile per essere
// referenziata dall'equipaggiamento. Lo crea on-the-fly se mancante.
function _schedaEnsureInvUid(inventario, idx) {
    const it = inventario && inventario[idx];
    if (!it || typeof it !== 'object') return null;
    if (it._treasure_uid) return it._treasure_uid;
    const uid = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    it._treasure_uid = uid;
    return uid;
}

window._schedaApplyInvArmaEquip = async function(pgId, invIndex, dndArmaNome) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const pg = _schedaPgCache;
    if (!pg) return;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const arma = DND_ARMI.find(a => a.nome === dndArmaNome);
    if (!arma) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    const profBonus = 2;
    const modFor = calcMod(pg.forza || 10);
    const modDes = calcMod(pg.destrezza || 10);
    const isFinesse = arma.proprieta.some(p => p.includes('Accurata'));
    const isRanged = arma.cat.includes('distanza');
    const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
    const dmgMod = atkMod;
    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const displayName = _schedaBuildEquipDisplayName(view.nome, arma.nome);
    const treasureUid = _schedaEnsureInvUid(pg.inventario, invIndex);
    pg.equipaggiamento.push({
        nome: displayName,
        tipo: 'arma',
        danni: arma.danni,
        tipo_danno: arma.tipo_danno,
        proprieta: arma.proprieta,
        bonus_colpire: profBonus + atkMod + ench,
        bonus_danno: dmgMod + ench,
        magic_bonus: ench,
        from_treasure_uid: treasureUid,
    });
    const updates = { equipaggiamento: pg.equipaggiamento };
    if (treasureUid) updates.inventario = pg.inventario;
    await schedaInstantSave(pgId, updates);
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${view.nome} equipaggiata`);
};

window._schedaApplyInvArmaturaEquip = async function(pgId, invIndex, dndArmNome) {
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    const pg = _schedaPgCache;
    if (!pg) return;
    const view = _schedaInvViewAt(pg, invIndex);
    if (!view) return;
    const arm = DND_ARMATURE.find(a => a.nome === dndArmNome);
    if (!arm) return;
    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    const isShield = arm.cat === 'scudo';
    if (!isShield) {
        pg.equipaggiamento = pg.equipaggiamento.filter(e => e.tipo !== 'armatura');
    } else {
        pg.equipaggiamento = pg.equipaggiamento.filter(e => e.tipo !== 'scudo');
    }
    const ench = view.magic_bonus || view._homebrew_incantamento || 0;
    const displayName = _schedaBuildEquipDisplayName(view.nome, arm.nome);
    const treasureUid = _schedaEnsureInvUid(pg.inventario, invIndex);
    pg.equipaggiamento.push({
        nome: displayName,
        tipo: isShield ? 'scudo' : 'armatura',
        ca_base: arm.ca_base,
        categoria: arm.cat,
        mod_des: arm.mod_des,
        max_des: arm.max_des,
        magic_bonus: ench,
        from_treasure_uid: treasureUid,
    });
    const newCA = calcCAFromEquip(pg);
    pg.classe_armatura = newCA;
    const updates = { equipaggiamento: pg.equipaggiamento, classe_armatura: newCA };
    if (treasureUid) updates.inventario = pg.inventario;
    await schedaInstantSave(pgId, updates);
    renderSchedaPersonaggio(pgId);
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    showNotification(`${view.nome} equipaggiata — CA: ${newCA}`);
};

window.schedaRemoveEquip = async function(pgId, index) {
    const pg = _schedaPgCache;
    if (!pg?.equipaggiamento) return;
    const removed = pg.equipaggiamento[index];
    pg.equipaggiamento.splice(index, 1);
    const isArmor = removed?.tipo === 'armatura' || removed?.tipo === 'scudo';
    const updates = { equipaggiamento: pg.equipaggiamento };
    if (isArmor) {
        const newCA = calcCAFromEquip(pg);
        pg.classe_armatura = newCA;
        updates.classe_armatura = newCA;
    }
    await schedaInstantSave(pgId, updates);
    renderSchedaPersonaggio(pgId);
    showNotification('Oggetto rimosso');
}

window.schedaEditEquip = function(pgId, index) {
    const pg = _schedaPgCache;
    if (!pg?.equipaggiamento?.[index]) return;
    const e = pg.equipaggiamento[index];
    const currentBonus = e.magic_bonus || 0;
    const currentDesc = e.descrizione || '';

    // Se l'oggetto è collegato a una entry dell'inventario (via
    // from_treasure_uid o, in fallback, per nome) recuperiamo la
    // descrizione live dell'oggetto: così cliccando l'arma/armatura
    // nell'equipaggiamento si vede sempre la descrizione completa
    // dell'oggetto homebrew/SRD da cui è stata equipaggiata, senza
    // dover andare nell'inventario.
    let inventoryDesc = '';
    let inventoryName = '';
    if (Array.isArray(pg.inventario) && pg.inventario.length) {
        const stripBonus = (s) => String(s || '')
            .replace(/\s*\+\d+\s*$/, '')
            .replace(/\s*\([^)]+\)\s*$/, '')
            .trim()
            .toLowerCase();
        const equipBase = stripBonus(e.nome);
        let invItem = null;
        if (e.from_treasure_uid) {
            invItem = pg.inventario.find(it => it && typeof it === 'object' && it._treasure_uid === e.from_treasure_uid) || null;
        }
        if (!invItem && equipBase) {
            // Fallback per oggetti equipaggiati prima del meccanismo
            // from_treasure_uid: matching per nome (case-insensitive,
            // ignorando bonus magici e parentesi tipo "(pugnale)").
            invItem = pg.inventario.find(it => {
                if (!it || typeof it !== 'object') return false;
                const invName = stripBonus(it.nome);
                return invName && (invName === equipBase || equipBase.startsWith(invName) || invName.startsWith(equipBase));
            }) || null;
        }
        if (invItem) {
            const view = (typeof window._invResolveLive === 'function')
                ? window._invResolveLive(invItem) : invItem;
            inventoryDesc = view?.descrizione || view?.proprieta || '';
            inventoryName = view?.nome || '';
        }
    }
    const inventoryDescHtml = inventoryDesc
        ? `<div class="equip-inv-desc-section">
                <div class="equip-inv-desc-label">Descrizione${inventoryName ? ` — ${escapeHtml(inventoryName)}` : ''} (dall'inventario)</div>
                <div class="equip-inv-desc-body">${(typeof window.formatRichText === 'function' ? window.formatRichText(inventoryDesc) : escapeHtml(inventoryDesc))}</div>
            </div>`
        : '';

    const modalHtml = `
    <div class="modal active" id="editEquipModal">
        <div class="modal-content modal-content-xl">
            <button class="modal-close" onclick="document.getElementById('editEquipModal')?.remove();document.body.style.overflow=''">&times;</button>
            <h2 id="editEquipTitle">${formatEquipName(e)}</h2>
            ${e.proprieta ? `<p style="font-size:0.8rem;color:var(--text-light);margin-bottom:12px;">${e.proprieta.join(', ')}</p>` : ''}
            <div class="equip-ench-row">
                <span class="equip-ench-label">Incantamento</span>
                <div class="custom-res-dice-row">
                    ${[0,1,2,3].map(b =>
                        `<button type="button" class="btn-secondary custom-res-dice-btn ${b === currentBonus ? 'active' : ''}" onclick="schedaSetMagicBonus('${pgId}',${index},${b})">${b === 0 ? 'No' : '+' + b}</button>`
                    ).join('')}
                </div>
            </div>
            ${inventoryDescHtml}
            <label class="equip-desc-label">${inventoryDesc ? 'Note personali' : 'Descrizione'}</label>
            <textarea id="editEquipDesc" class="equip-desc-textarea" placeholder="${inventoryDesc ? 'Note aggiuntive su questo oggetto…' : 'Aggiungi una descrizione, effetti magici, note...'}">${escapeHtml(currentDesc)}</textarea>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="document.getElementById('editEquipModal')?.remove();document.body.style.overflow=''">Annulla</button>
                <button type="button" class="btn-primary" onclick="schedaSaveEquipDesc('${pgId}',${index})">Salva</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

window.schedaSaveEquipDesc = async function(pgId, index) {
    const pg = _schedaPgCache;
    if (!pg?.equipaggiamento?.[index]) return;
    const e = pg.equipaggiamento[index];
    const ta = document.getElementById('editEquipDesc');
    e.descrizione = ta?.value || '';
    await schedaInstantSave(pgId, { equipaggiamento: pg.equipaggiamento });
    document.getElementById('editEquipModal')?.remove();
    document.body.style.overflow = '';
    renderSchedaPersonaggio(pgId);
    showNotification('Descrizione aggiornata');
}

// ──────────────────────────────────────────────────────────────────────
// Arma personalizzata: l'utente sceglie nome, categoria (mischia/distanza),
// danni, tipo danno e proprietà a piacere. Usato sia in fase di
// "creazione rapida" dall'aggiunta equipaggiamento, sia per equipaggiare
// un oggetto homebrew dell'inventario senza essere vincolati ai tipi
// standard di D&D (es. lama-pistola, frusta a catena, ecc.).
// opts: { invIndex?: number }
// ──────────────────────────────────────────────────────────────────────
window.schedaOpenCustomWeaponDialog = function(pgId, opts) {
    opts = opts || {};
    const pg = _schedaPgCache;
    if (!pg) return;

    let prefilledName = '';
    let prefilledMagic = 0;
    let invIndex = (typeof opts.invIndex === 'number') ? opts.invIndex : null;
    if (invIndex != null) {
        const view = _schedaInvViewAt(pg, invIndex);
        if (view) {
            prefilledName = (_invDisplayName(view) || view.nome || '').replace(/\s*\+\d+\s*$/, '').trim();
            prefilledMagic = view.magic_bonus || view._homebrew_incantamento || 0;
        }
    }

    document.querySelectorAll('#schedaCustomWeaponOverlay').forEach(o => o.remove());

    const propsList = ['Accurata','Due Mani','Leggera','Pesante','Portata','Lancio','Munizioni','Ricarica','Versatile','Speciale'];
    const propsHtml = propsList.map(p => `
        <label class="custom-weapon-prop">
            <input type="checkbox" data-prop="${escapeHtml(p)}">
            <span>${escapeHtml(p)}</span>
        </label>`).join('');

    const dmgTypes = ['taglienti','perforanti','contundenti','fuoco','freddo','elettricità','acido','veleno','radiante','necrotico','psichico','tuono','forza'];
    const dmgTypeOpts = `<option value="">— nessuno —</option>` + dmgTypes.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');

    const overlay = document.createElement('div');
    overlay.id = 'schedaCustomWeaponOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
        <div class="hp-calc-modal custom-weapon-modal">
            <button class="modal-close" onclick="document.getElementById('schedaCustomWeaponOverlay')?.remove()">&times;</button>
            <h3 class="custom-weapon-title">${invIndex != null ? 'Definisci arma personalizzata' : 'Crea arma personalizzata'}</h3>
            ${invIndex != null ? '<p class="custom-weapon-sub">Definisci come usare questo oggetto dell\'inventario</p>' : '<p class="custom-weapon-sub">Specifica nome, danni e proprietà</p>'}
            <div class="custom-weapon-form">
                <div class="custom-weapon-row">
                    <label>Nome</label>
                    <input type="text" id="cwName" maxlength="80" placeholder="Es. Lama-pistola, Frusta a catena…" value="${escapeHtml(prefilledName)}" />
                </div>
                <div class="custom-weapon-row custom-weapon-row-2">
                    <div>
                        <label>Categoria</label>
                        <select id="cwCategory">
                            <option value="mischia" selected>Mischia (Forza)</option>
                            <option value="distanza">Distanza (Destrezza)</option>
                        </select>
                    </div>
                    <div>
                        <label>Incantamento</label>
                        <select id="cwMagic">
                            <option value="0"${prefilledMagic === 0 ? ' selected' : ''}>Nessuno</option>
                            <option value="1"${prefilledMagic === 1 ? ' selected' : ''}>+1</option>
                            <option value="2"${prefilledMagic === 2 ? ' selected' : ''}>+2</option>
                            <option value="3"${prefilledMagic === 3 ? ' selected' : ''}>+3</option>
                        </select>
                    </div>
                </div>
                <div class="custom-weapon-row custom-weapon-row-2">
                    <div>
                        <label>Danni</label>
                        <input type="text" id="cwDamage" maxlength="20" placeholder="1d8" value="1d6" />
                    </div>
                    <div>
                        <label>Tipo danno</label>
                        <select id="cwDamageType">
                            ${dmgTypeOpts}
                        </select>
                    </div>
                </div>
                <div class="custom-weapon-row">
                    <label>Proprietà</label>
                    <div class="custom-weapon-props" id="cwProps">${propsHtml}</div>
                </div>
                <div class="custom-weapon-row">
                    <label>Altre proprietà <span class="custom-weapon-hint">(es. Gittata 9/27, Speciale)</span></label>
                    <input type="text" id="cwExtraProps" maxlength="120" placeholder="Separate da virgola" />
                </div>
            </div>
            <div class="dialog-actions custom-weapon-actions">
                <button type="button" class="btn-secondary" onclick="document.getElementById('schedaCustomWeaponOverlay')?.remove()">Annulla</button>
                <button type="button" class="btn-primary" onclick="schedaSaveCustomWeapon('${pgId}', ${invIndex != null ? invIndex : 'null'})">Aggiungi</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
};

window.schedaSaveCustomWeapon = async function(pgId, invIndex) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const overlay = document.getElementById('schedaCustomWeaponOverlay');
    if (!overlay) return;

    const nome = (overlay.querySelector('#cwName')?.value || '').trim();
    if (!nome) {
        showNotification('Inserisci un nome per l\'arma');
        return;
    }
    const categoria = overlay.querySelector('#cwCategory')?.value || 'mischia';
    const danni = (overlay.querySelector('#cwDamage')?.value || '').trim() || '1d4';
    const tipoDanno = overlay.querySelector('#cwDamageType')?.value || '';
    const magic = parseInt(overlay.querySelector('#cwMagic')?.value) || 0;

    const checkedProps = Array.from(overlay.querySelectorAll('#cwProps input[type="checkbox"]:checked'))
        .map(el => el.dataset.prop);
    const extraRaw = (overlay.querySelector('#cwExtraProps')?.value || '').trim();
    const extraProps = extraRaw ? extraRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
    const proprieta = [...checkedProps, ...extraProps];

    const isRanged = categoria === 'distanza';
    const isFinesse = proprieta.some(p => p.toLowerCase().includes('accurata'));
    const totalLevel = (pg.classi || []).reduce((s, c) => s + (c.livello || 1), 0) || pg.livello || 1;
    const profBonus = calcBonusCompetenza(totalLevel);
    const modFor = calcMod(pg.forza || 10);
    const modDes = calcMod(pg.destrezza || 10);
    const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
    const dmgMod = atkMod;

    if (!pg.equipaggiamento) pg.equipaggiamento = [];
    const entry = {
        nome,
        tipo: 'arma',
        danni,
        tipo_danno: tipoDanno,
        proprieta,
        bonus_colpire: profBonus + atkMod + magic,
        bonus_danno: dmgMod + magic,
        magic_bonus: magic,
        custom: true,
    };

    let updates = { equipaggiamento: pg.equipaggiamento };
    if (typeof invIndex === 'number' && invIndex >= 0) {
        const treasureUid = _schedaEnsureInvUid(pg.inventario, invIndex);
        if (treasureUid) {
            entry.from_treasure_uid = treasureUid;
            updates.inventario = pg.inventario;
        }
    }
    pg.equipaggiamento.push(entry);

    await schedaInstantSave(pgId, updates);

    overlay.remove();
    document.querySelectorAll('.hp-calc-overlay').forEach(o => o.remove());
    document.getElementById('equipModal')?.remove();
    document.body.style.overflow = '';
    renderSchedaPersonaggio(pgId);
    showNotification(`${nome} aggiunta all'equipaggiamento`);
};

window.schedaSetMagicBonus = async function(pgId, index, bonus) {
    const pg = _schedaPgCache;
    if (!pg?.equipaggiamento?.[index]) return;
    const e = pg.equipaggiamento[index];
    const oldBonus = e.magic_bonus || 0;
    if (oldBonus === bonus) return;
    e.magic_bonus = bonus;

    if (e.tipo === 'arma') {
        e.bonus_colpire = (e.bonus_colpire || 0) - oldBonus + bonus;
        e.bonus_danno = (e.bonus_danno || 0) - oldBonus + bonus;
    }

    const updates = { equipaggiamento: pg.equipaggiamento };
    if (e.tipo === 'armatura' || e.tipo === 'scudo') {
        const newCA = calcCAFromEquip(pg);
        pg.classe_armatura = newCA;
        updates.classe_armatura = newCA;
    }

    await schedaInstantSave(pgId, updates);
    // Aggiorna lo stato visivo dei pulsanti senza chiudere il dialog,
    // cosi' l'utente puo' continuare a modificare la descrizione.
    const modal = document.getElementById('editEquipModal');
    if (modal) {
        modal.querySelectorAll('.custom-res-dice-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const btns = modal.querySelectorAll('.custom-res-dice-btn');
        if (btns[bonus]) btns[bonus].classList.add('active');
        const titleEl = modal.querySelector('h2');
        if (titleEl) titleEl.innerHTML = formatEquipName(e);
    }
    showNotification(`${e.nome} ${bonus > 0 ? '+' + bonus : ''} aggiornato`);
}

// =====================================================
// LINGUAGGI E COMPETENZE
// =====================================================
function _parseToolEntry(t) {
    if (typeof t === 'object' && t !== null) return t;
    return { nome: t, maestria: false };
}

function _toolsByGroup(compStrum) {
    const parsed = (compStrum || []).map(_parseToolEntry);
    const grouped = {};
    for (const [groupName, groupDef] of Object.entries(DND_COMPETENZE_STRUMENTI_GROUPED)) {
        const items = parsed.filter(t => groupDef.items.includes(t.nome));
        if (items.length > 0) grouped[groupName] = items;
    }
    return grouped;
}

function buildLangProfSection(pg) {
    const linguaggi = pg.linguaggi || [];
    const compStrum = pg.competenze_strumenti || [];
    const langHtml = linguaggi.length > 0 ?
        linguaggi.map(l => `<span class="scheda-tag">${escapeHtml(l)}</span>`).join('') :
        '<span class="scheda-empty">Nessuno</span>';

    const grouped = _toolsByGroup(compStrum);
    let toolSectionsHtml = '';
    if (Object.keys(grouped).length > 0) {
        for (const [groupName, items] of Object.entries(grouped)) {
            const tags = items.map(t => {
                const cls = t.maestria ? 'scheda-tag scheda-tag-mastery' : 'scheda-tag';
                return `<span class="${cls}">${escapeHtml(t.nome)}${t.maestria ? ' ★' : ''}</span>`;
            }).join('');
            toolSectionsHtml += `<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">${escapeHtml(groupName)}</span><div class="scheda-tags">${tags}</div></div>`;
        }
    } else {
        toolSectionsHtml = '<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Strumenti</span><div class="scheda-tags"><span class="scheda-empty">Nessuna</span></div></div>';
    }

    return `<div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Linguaggi e Competenze
            <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenLangProfEdit('${pg.id}')" title="Modifica">&#9998;</button>
        </div>
        <div class="scheda-section-body">
            <div class="scheda-res-imm-display" id="schedaLangProfDisplay">
                <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Linguaggi</span><div class="scheda-tags" id="schedaLangDisplay">${langHtml}</div></div>
                ${toolSectionsHtml}
            </div>
        </div>
    </div>`;
}

window.schedaOpenLangProfEdit = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const currentLangs = pg.linguaggi ? [...pg.linguaggi] : [];
    const currentToolsRaw = pg.competenze_strumenti || [];
    const currentTools = currentToolsRaw.map(_parseToolEntry);

    const langCheckboxes = DND_LINGUAGGI.map(l => {
        const checked = currentLangs.includes(l) ? 'checked' : '';
        return `<label class="scheda-checkbox-item"><input type="checkbox" value="${escapeHtml(l)}" ${checked} onchange="schedaLangToggle(this)"><span>${escapeHtml(l)}</span></label>`;
    }).join('');

    let toolSectionsHtml = '';
    for (const [groupName, groupDef] of Object.entries(DND_COMPETENZE_STRUMENTI_GROUPED)) {
        const items = groupDef.items.map(t => {
            const entry = currentTools.find(e => e.nome === t);
            const checked = entry ? 'checked' : '';
            const hasMastery = entry?.maestria ? 'checked' : '';
            let html = `<label class="scheda-checkbox-item"><input type="checkbox" value="${escapeHtml(t)}" ${checked} onchange="schedaToolToggle(this)"><span>${escapeHtml(t)}</span>`;
            if (groupDef.allowMastery) {
                html += `<label class="scheda-mastery-toggle" title="Maestria"><input type="checkbox" data-tool="${escapeHtml(t)}" ${hasMastery} onchange="schedaToolMasteryToggle(this)" ${!entry ? 'disabled' : ''}>★</label>`;
            }
            html += `</label>`;
            return html;
        }).join('');
        toolSectionsHtml += `<div class="scheda-picker-cat">${escapeHtml(groupName)}</div><div class="scheda-checkbox-grid">${items}</div>`;
    }

    const modalHtml = `
    <div class="modal active" id="langProfModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="schedaCloseLangProfEdit()">&times;</button>
            <h2>Linguaggi e Competenze</h2>
            <div class="picker-tabs">
                <button type="button" class="picker-tab active" data-panel="linguaggi" onclick="schedaPickerSwitchTab(this,'linguaggi')">Linguaggi</button>
                <button type="button" class="picker-tab" data-panel="competenze" onclick="schedaPickerSwitchTab(this,'competenze')">Competenze</button>
            </div>
            <div class="wizard-page-scroll">
                <div class="picker-tab-panel active" data-panel="linguaggi">
                    <div class="scheda-checkbox-grid">${langCheckboxes}</div>
                </div>
                <div class="picker-tab-panel" data-panel="competenze">
                    ${toolSectionsHtml}
                </div>
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="schedaCloseLangProfEdit()">Chiudi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    window._schedaLangEditPgId = pgId;
    window._schedaLangList = currentLangs;
    window._schedaToolList = currentTools;
}

window.schedaLangToggle = async function(cb) {
    const pgId = window._schedaLangEditPgId;
    if (!pgId) return;
    const lang = cb.value;
    if (cb.checked) {
        if (!window._schedaLangList.includes(lang)) window._schedaLangList.push(lang);
    } else {
        window._schedaLangList = window._schedaLangList.filter(l => l !== lang);
    }
    const pg = _schedaPgCache;
    if (pg) pg.linguaggi = [...window._schedaLangList];
    const display = document.getElementById('schedaLangDisplay');
    if (display) display.innerHTML = window._schedaLangList.length > 0 ?
        window._schedaLangList.map(l => `<span class="scheda-tag">${escapeHtml(l)}</span>`).join('') :
        '<span class="scheda-empty">Nessuno</span>';
    await schedaInstantSave(pgId, { linguaggi: window._schedaLangList });
}

function _refreshToolDisplay() {
    const pg = _schedaPgCache;
    if (!pg) return;
    pg.competenze_strumenti = window._schedaToolList.map(t => ({ ...t }));
    const container = document.getElementById('schedaLangProfDisplay');
    if (!container) return;
    const langDisplay = document.getElementById('schedaLangDisplay');
    const langRow = langDisplay ? langDisplay.closest('.scheda-res-imm-row') : null;
    const grouped = _toolsByGroup(window._schedaToolList);
    let toolHtml = '';
    if (Object.keys(grouped).length > 0) {
        for (const [groupName, items] of Object.entries(grouped)) {
            const tags = items.map(t => {
                const cls = t.maestria ? 'scheda-tag scheda-tag-mastery' : 'scheda-tag';
                return `<span class="${cls}">${escapeHtml(t.nome)}${t.maestria ? ' ★' : ''}</span>`;
            }).join('');
            toolHtml += `<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">${escapeHtml(groupName)}</span><div class="scheda-tags">${tags}</div></div>`;
        }
    } else {
        toolHtml = '<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Strumenti</span><div class="scheda-tags"><span class="scheda-empty">Nessuna</span></div></div>';
    }
    container.innerHTML = (langRow ? langRow.outerHTML : '') + toolHtml;
}

window.schedaToolToggle = async function(cb) {
    const pgId = window._schedaLangEditPgId;
    if (!pgId) return;
    const toolName = cb.value;
    if (cb.checked) {
        if (!window._schedaToolList.find(t => t.nome === toolName)) {
            window._schedaToolList.push({ nome: toolName, maestria: false });
        }
    } else {
        window._schedaToolList = window._schedaToolList.filter(t => t.nome !== toolName);
    }
    const masteryInput = cb.closest('.scheda-checkbox-item')?.querySelector('[data-tool]');
    if (masteryInput) {
        masteryInput.disabled = !cb.checked;
        if (!cb.checked) masteryInput.checked = false;
    }
    _refreshToolDisplay();
    await schedaInstantSave(pgId, { competenze_strumenti: window._schedaToolList });
}

window.schedaToolMasteryToggle = async function(cb) {
    const pgId = window._schedaLangEditPgId;
    if (!pgId) return;
    const toolName = cb.dataset.tool;
    const entry = window._schedaToolList.find(t => t.nome === toolName);
    if (entry) entry.maestria = cb.checked;
    _refreshToolDisplay();
    await schedaInstantSave(pgId, { competenze_strumenti: window._schedaToolList });
}

window.schedaCloseLangProfEdit = function() {
    document.getElementById('langProfModal')?.remove();
    document.body.style.overflow = '';
}

// =====================================================
// AUTO-POPULATE LINGUAGGI FROM RACE
// =====================================================
function autoPopulateLinguaggi(razzaNome, sottorazzaNome) {
    const merged = razzaNome ? buildMergedRaceData(razzaNome, sottorazzaNome || null) : null;
    if (merged && merged.linguaggi && merged.linguaggi.length > 0) {
        return [...merged.linguaggi];
    }
    const raceData = getRaceData(razzaNome);
    if (!raceData) return ['Comune'];
    return raceData.linguaggi && raceData.linguaggi.length > 0 ? [...raceData.linguaggi] : ['Comune'];
}

window.openPersonaggioModal = function(personaggioId) {
    editingPersonaggioId = personaggioId || null;
    const form = elements.personaggioForm;
    if (!form) return;

    // Refresh delle sottoclassi homebrew (proprie + amici abilitati) ad
    // ogni apertura della modale: kick-off in background, NIENTE re-render
    // dopo (per non sfarfallare il bottone). Quando l'utente cliccherà
    // "Sottoclasse...", il click handler aspetterà la fine della load
    // se ancora in volo.
    if (typeof loadHomebrewSottoclassi === 'function') {
        loadHomebrewSottoclassi();
    }

    form.reset();
    pgSelectedClasses = [];
    pgCurrentSkillProficiencies = new Set();
    pgCurrentSkillExpertise = new Set();
    pgCurrentResistenze = [];
    pgCurrentImmunita = [];
    pgCurrentSlotIncantesimo = {};
    pgCurrentTalenti = [];
    window._featPickerFilters['wizard'] = _defaultFeatFilters();
    window._featPickerSearch['wizard'] = '';
    pgSelectedEquipment = [];
    _pgRaceSkills = [];
    _pgBgSkills = [];
    _pgBgTools = [];
    _pgBgLangs = [];
    pgCurrentBgTools = new Set();
    pgCurrentBgLanguages = new Set();
    _pgRaceResistances = [];
    pgRenderClassi();
    pgWizardGoTo(0);

    const razzaBtn = document.getElementById('pgRazzaBtn');
    const razzaInput = document.getElementById('pgRazza');
    if (razzaBtn) razzaBtn.textContent = 'Seleziona razza...';
    if (razzaInput) razzaInput.value = '';
    const sottoBtn = document.getElementById('pgSottorazzaBtn');
    const sottoInput = document.getElementById('pgSottorazza');
    if (sottoBtn) sottoBtn.textContent = 'Seleziona sottorazza...';
    if (sottoInput) sottoInput.value = '';
    const sottoGroup = document.getElementById('pgSottorazzaGroup');
    if (sottoGroup) sottoGroup.style.display = 'none';
    const bgBtn = document.getElementById('pgBackgroundBtn');
    const bgInput = document.getElementById('pgBackground');
    if (bgBtn) bgBtn.textContent = 'Seleziona background...';
    if (bgInput) bgInput.value = '';

    // Reset saving throws
    ['Forza','Destrezza','Costituzione','Intelligenza','Saggezza','Carisma'].forEach(s => {
        const cb = document.getElementById(`save${s}`);
        if (cb) cb.checked = false;
    });

    if (personaggioId) {
        elements.personaggioModalTitle.textContent = 'Modifica Personaggio';
        elements.savePersonaggioBtn.textContent = 'Salva';

        const supabase = getSupabaseClient();
        if (supabase) {
            supabase.from('personaggi').select('*').eq('id', personaggioId).single().then(({ data, error }) => {
                if (data && !error) {
                    document.getElementById('pgNome').value = data.nome || '';
                    const razzaVal = data.razza || '';
                    document.getElementById('pgRazza').value = razzaVal;
                    const rBtn = document.getElementById('pgRazzaBtn');
                    if (rBtn) rBtn.textContent = razzaVal || 'Seleziona razza...';
                    const sottoVal = data.sottorazza || '';
                    const sottoInputEl = document.getElementById('pgSottorazza');
                    if (sottoInputEl) sottoInputEl.value = sottoVal;
                    _pgUpdateSottorazzaUI();
                    const bgVal = data.background || '';
                    document.getElementById('pgBackground').value = bgVal;
                    const bBtn = document.getElementById('pgBackgroundBtn');
                    if (bBtn) bBtn.textContent = bgVal || 'Seleziona background...';
                    // Inizializza tracking del bg corrente (cosi' se l'utente lo cambia
                    // nel wizard, le competenze auto-popolate vengono rimosse correttamente).
                    _pgApplyBackgroundAutoPopulate();

                    if (data.classi && Array.isArray(data.classi) && data.classi.length > 0) {
                        pgSelectedClasses = data.classi.map(c => ({
                            nome: c.nome,
                            livello: c.livello || 1,
                            thirdCaster: !!c.thirdCaster,
                            ...(c.sottoclasse ? { sottoclasse: c.sottoclasse } : {}),
                            ...(c.sottoclasseSlug ? { sottoclasseSlug: c.sottoclasseSlug } : {}),
                        }));
                    } else if (data.classe) {
                        pgSelectedClasses = [{ nome: data.classe, livello: data.livello || 1 }];
                    }
                    pgRenderClassi();
                    pgUpdateTotalLevel();

                    document.getElementById('pgForza').value = data.forza || 10;
                    document.getElementById('pgDestrezza').value = data.destrezza || 10;
                    document.getElementById('pgCostituzione').value = data.costituzione || 10;
                    document.getElementById('pgIntelligenza').value = data.intelligenza || 10;
                    document.getElementById('pgSaggezza').value = data.saggezza || 10;
                    document.getElementById('pgCarisma').value = data.carisma || 10;

                    if (data.tiri_salvezza && Array.isArray(data.tiri_salvezza)) {
                        data.tiri_salvezza.forEach(s => {
                            const cb = document.getElementById(`save${s.charAt(0).toUpperCase() + s.slice(1)}`);
                            if (cb) cb.checked = true;
                        });
                    } else {
                        pgUpdateSavingThrows();
                    }

                    if (data.competenze_abilita && Array.isArray(data.competenze_abilita)) {
                        pgCurrentSkillProficiencies = new Set(data.competenze_abilita);
                    }
                    if (data.maestrie_abilita && Array.isArray(data.maestrie_abilita)) {
                        pgCurrentSkillExpertise = new Set(data.maestrie_abilita);
                    }
                    if (data.talenti && Array.isArray(data.talenti)) {
                        pgCurrentTalenti = [...data.talenti];
                    }
                    if (data.equipaggiamento && Array.isArray(data.equipaggiamento)) {
                        pgSelectedEquipment = [...data.equipaggiamento];
                    }

                    if (data.resistenze && Array.isArray(data.resistenze)) {
                        pgCurrentResistenze = [...data.resistenze];
                    }
                    if (data.immunita && Array.isArray(data.immunita)) {
                        pgCurrentImmunita = [...data.immunita];
                    }
                    if (data.slot_incantesimo && typeof data.slot_incantesimo === 'object') {
                        pgCurrentSlotIncantesimo = {};
                        Object.keys(data.slot_incantesimo).forEach(k => {
                            pgCurrentSlotIncantesimo[parseInt(k)] = { ...data.slot_incantesimo[k] };
                        });
                    }

                    const pvF = document.getElementById('pgPV');
                    if (pvF) { pvF.value = data.punti_vita_max || 10; pvF.dataset.autoHp = 'false'; }
                    document.getElementById('pgIniziativa').value = data.iniziativa != null ? data.iniziativa : calcMod(data.destrezza || 10);
                    document.getElementById('pgCA').value = data.classe_armatura || 10;
                    document.getElementById('pgVelocita').value = data.velocita || 9;
                    updateAllAbilityMods();
                }
            });
        }
    } else {
        elements.personaggioModalTitle.textContent = 'Nuovo Personaggio';
        elements.savePersonaggioBtn.textContent = 'Crea';
        document.getElementById('pgCA').value = '';
        document.getElementById('pgIniziativa').value = '';
        const pvField = document.getElementById('pgPV');
        if (pvField) { pvField.value = 10; pvField.dataset.autoHp = 'true'; }
        updateAllAbilityMods();
        updateBonusCompetenza();
    }

    elements.personaggioModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePersonaggioModal() {
    if (elements.personaggioModal) {
        elements.personaggioModal.classList.remove('active');
        document.body.style.overflow = '';
        editingPersonaggioId = null;
    }
}

let pgSaving = false;
async function handleSavePersonaggio(e) {
    e.preventDefault();
    if (pgSaving) return;
    pgSaving = true;
    const saveBtn = document.getElementById('savePersonaggioBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvataggio...'; }
    const supabase = getSupabaseClient();
    if (!supabase) { pgSaving = false; if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = editingPersonaggioId ? 'Salva' : 'Crea'; } return; }

    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) {
        showNotification('Errore: utente non trovato');
        return;
    }

    const destrezza = parseInt(document.getElementById('pgDestrezza').value) || 10;
    const desMod = calcMod(destrezza);
    const iniziativaVal = document.getElementById('pgIniziativa').value;
    const iniziativa = iniziativaVal !== '' ? parseInt(iniziativaVal) : desMod;
    const caVal = document.getElementById('pgCA').value;
    let caDefault = 10 + desMod;
    const classNames = pgSelectedClasses.map(c => c.nome);
    if (classNames.includes('Barbaro')) caDefault = 10 + desMod + calcMod(parseInt(document.getElementById('pgCostituzione').value) || 10);
    else if (classNames.includes('Monaco')) caDefault = 10 + desMod + calcMod(parseInt(document.getElementById('pgSaggezza').value) || 10);
    const classeArmatura = caVal !== '' ? parseInt(caVal) : caDefault;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const classeDisplay = pgSelectedClasses.map(c => `${c.nome} ${c.livello}`).join(' / ');
    const totalLevel = pgGetTotalLevel();

    let pgData = {
        nome: document.getElementById('pgNome').value.trim(),
        razza: document.getElementById('pgRazza').value || null,
        sottorazza: document.getElementById('pgSottorazza').value || null,
        background: document.getElementById('pgBackground').value || null,
        classe: classeDisplay || null,
        classi: pgSelectedClasses,
        livello: totalLevel,
        forza: clamp(parseInt(document.getElementById('pgForza').value) || 10, 1, 30),
        destrezza: clamp(destrezza, 1, 30),
        costituzione: clamp(parseInt(document.getElementById('pgCostituzione').value) || 10, 1, 30),
        intelligenza: clamp(parseInt(document.getElementById('pgIntelligenza').value) || 10, 1, 30),
        saggezza: clamp(parseInt(document.getElementById('pgSaggezza').value) || 10, 1, 30),
        carisma: clamp(parseInt(document.getElementById('pgCarisma').value) || 10, 1, 30),
        tiri_salvezza: pgGetSelectedSaves(),
        competenze_abilita: Array.from(pgCurrentSkillProficiencies),
        maestrie_abilita: Array.from(pgCurrentSkillExpertise),
        talenti: pgCurrentTalenti,
        resistenze: pgCurrentResistenze,
        immunita: pgCurrentImmunita,
        equipaggiamento: pgSelectedEquipment.map(e => {
            if (e.tipo === 'arma') {
                const forza = clamp(parseInt(document.getElementById('pgForza').value) || 10, 1, 30);
                const modFor = calcMod(forza);
                const modDes = desMod;
                const isFinesse = e.proprieta?.some(p => p.includes('Accurata'));
                const isRanged = e.proprieta?.some(p => p.includes('Munizioni')) || e.proprieta?.some(p => p.includes('Lancio'));
                const atkMod = isRanged ? modDes : (isFinesse ? Math.max(modFor, modDes) : modFor);
                const profBonus = calcBonusCompetenza(totalLevel);
                return { ...e, bonus_colpire: profBonus + atkMod, bonus_danno: atkMod };
            }
            return e;
        }),
        slot_incantesimo: pgBuildSlotIncantesimo(),
        punti_vita_max: parseInt(document.getElementById('pgPV').value) || 10,
        pv_attuali: parseInt(document.getElementById('pgPV').value) || 10,
        iniziativa: iniziativa,
        classe_armatura: classeArmatura,
        percezione_passiva: pgCalcPercPassiva(),
        velocita: parseFloat(document.getElementById('pgVelocita').value) || 9,
        updated_at: new Date().toISOString()
    };

    if (!pgData.nome) {
        showNotification('Inserisci un nome per il personaggio');
        return;
    }

    // Auto-popola dati derivati da razza/background SOLO IN CREAZIONE: in
    // modifica non li tocchiamo per non sovrascrivere quanto l'utente ha
    // gia' personalizzato in scheda (lingue aggiunte, strumenti, oggetti,
    // monete spese). Cosi' i background del dataset locale spingono
    // direttamente al PG strumenti, linguaggi specifici, oggetti iniziali e
    // oro di partenza.
    if (!editingPersonaggioId) {
        const _razzaVal = document.getElementById('pgRazza').value || '';
        const _sottoVal = document.getElementById('pgSottorazza').value || '';
        pgData.linguaggi = autoPopulateLinguaggi(_razzaVal, _sottoVal);

        const _bgVal = document.getElementById('pgBackground').value || '';
        const _bgData = _bgVal ? getBackgroundData(_bgVal) : null;
        if (_bgData) {
            const _bgTools = (_bgData.competenze_strumenti || [])
                .map(t => ({ nome: t, maestria: false }));
            if (_bgTools.length > 0) pgData.competenze_strumenti = _bgTools;
            if (_bgData.linguaggi_specifici && _bgData.linguaggi_specifici.length > 0) {
                pgData.linguaggi = Array.from(new Set([
                    ...(pgData.linguaggi || []),
                    ..._bgData.linguaggi_specifici,
                ]));
            }
            if (_bgData.equipaggiamento_iniziale && _bgData.equipaggiamento_iniziale.length > 0) {
                pgData.inventario = _bgData.equipaggiamento_iniziale.map(name => ({
                    nome: name,
                    descrizione: 'Equipaggiamento iniziale del background',
                    quantita: 1,
                    magico: false,
                }));
            }
            if (_bgData.oro_iniziale) {
                pgData.monete = { mr: 0, ma: 0, me: 0, mo: _bgData.oro_iniziale, mp: 0 };
            }
        }
    }

    // Helper: alcune colonne (es. 'sottorazza') potrebbero non esistere
    // ancora a DB se l'utente non ha eseguito sql/add-sottorazza.sql.
    // Riproviamo senza la colonna problematica per non bloccare il salvataggio.
    const _stripMissingColumns = (data, errMsg) => {
        const m = (errMsg || '').match(/'?([a-z_]+)'? column/i)
              || (errMsg || '').match(/find ['"]?([a-z_]+)['"]? column/i)
              || (errMsg || '').match(/column ['"]?([a-z_]+)['"]?/i);
        if (!m) return null;
        const col = m[1];
        if (!(col in data)) return null;
        const cleaned = { ...data };
        delete cleaned[col];
        console.warn(`[pg save] Colonna '${col}' mancante a DB: salvo senza. Esegui sql/add-${col.replace(/_/g, '-')}.sql per abilitarla.`);
        return cleaned;
    };

    try {
        if (editingPersonaggioId) {
            let { error } = await supabase
                .from('personaggi')
                .update(pgData)
                .eq('id', editingPersonaggioId);
            // Retry escludendo colonne mancanti a DB
            for (let i = 0; i < 4 && error; i++) {
                const cleaned = _stripMissingColumns(pgData, error.message);
                if (!cleaned) break;
                pgData = cleaned;
                ({ error } = await supabase.from('personaggi').update(pgData).eq('id', editingPersonaggioId));
            }
            if (error) throw error;
            showNotification('Personaggio aggiornato');
        } else {
            pgData.user_id = userData.id;
            let { error } = await supabase
                .from('personaggi')
                .insert(pgData);
            for (let i = 0; i < 4 && error; i++) {
                const cleaned = _stripMissingColumns(pgData, error.message);
                if (!cleaned) break;
                pgData = cleaned;
                ({ error } = await supabase.from('personaggi').insert(pgData));
            }
            if (error) throw error;
            showNotification('Personaggio creato');
        }

        const wasEditing = editingPersonaggioId;
        closePersonaggioModal();
        if (wasEditing && AppState.currentPage === 'scheda') {
            await renderSchedaPersonaggio(wasEditing);
        } else {
            await loadPersonaggi();
        }
        await sendAppEventBroadcast({ table: 'personaggi', action: wasEditing ? 'update' : 'insert' });
    } catch (error) {
        console.error('Errore salvataggio personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    } finally {
        pgSaving = false;
        const btn = document.getElementById('savePersonaggioBtn');
        if (btn) { btn.disabled = false; btn.textContent = editingPersonaggioId ? 'Salva' : 'Crea'; }
    }
}

window.deletePersonaggio = async function(personaggioId) {
    const confirmed = await showConfirm('Sei sicuro di voler eliminare questo personaggio? Verrà rimosso anche da tutte le campagne associate.');
    if (!confirmed) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('personaggi')
            .delete()
            .eq('id', personaggioId);
        if (error) throw error;

        showNotification('Personaggio eliminato');
        if (AppState.currentPage === 'scheda') {
            navigateToPage('personaggi');
        }
        await loadPersonaggi();
        await sendAppEventBroadcast({ table: 'personaggi', action: 'delete' });
    } catch (error) {
        console.error('Errore eliminazione personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    }
}

// ─────────────────────────────────────────────────────────────────────
// Cambio sottoclasse dalla card (lista personaggi)
// Permette di cambiare la sottoclasse di un personaggio gia' creato.
// I privilegi auto-derivati e le risorse di sottoclasse vengono ricalcolati
// automaticamente al successivo render (sono derivati da CLASSES_DATA +
// SUBCLASS_RESOURCES in base a sottoclasseSlug/sottoclasse_homebrew_id).
// ─────────────────────────────────────────────────────────────────────
window.pgChangeSubclassFromCard = async function(pgId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let pg;
    try {
        const { data, error } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
        if (error) throw error;
        pg = data;
    } catch (e) {
        console.error('Errore caricamento personaggio:', e);
        showNotification('Errore nel caricamento del personaggio');
        return;
    }
    if (!pg) return;

    if (typeof loadHomebrewSottoclassi === 'function') {
        try { await loadHomebrewSottoclassi(); } catch (_) {}
    }

    let classi = Array.isArray(pg.classi) && pg.classi.length > 0
        ? pg.classi
        : (pg.classe ? [{ nome: pg.classe, livello: pg.livello || 1 }] : []);

    if (!classi.length) {
        showNotification('Nessuna classe trovata per questo personaggio');
        return;
    }

    const eligible = classi.map((c, i) => {
        const opts = pgGetSubclassOptions(c.nome);
        const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
        return { c, i, opts, hbOpts, hasOpts: opts.length > 0 || hbOpts.length > 0 };
    }).filter(x => x.hasOpts);

    if (!eligible.length) {
        showNotification('Nessuna sottoclasse disponibile per le classi di questo personaggio');
        return;
    }

    if (eligible.length === 1) {
        _pgOpenSubclassPickerForSavedPg(pgId, pg, eligible[0].i);
        return;
    }

    const items = eligible.map(({ c, i }) => ({
        value: String(i),
        label: `${c.nome} (Liv. ${c.livello || 1})${c.sottoclasse ? ' — ' + c.sottoclasse : ''}`
    }));
    openCustomSelect(items, (value) => {
        _pgOpenSubclassPickerForSavedPg(pgId, pg, parseInt(value));
    }, 'Per quale classe?');
};

async function _pgOpenSubclassPickerForSavedPg(pgId, pg, classIdx) {
    if (!Array.isArray(pg.classi) || !pg.classi[classIdx]) return;
    const c = pg.classi[classIdx];
    const opts = pgGetSubclassOptions(c.nome);
    const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
    if (opts.length === 0 && hbOpts.length === 0) {
        showNotification(`Nessuna sottoclasse disponibile per ${c.nome}`);
        return;
    }
    const items = _buildSubclassPickerItems(opts, hbOpts, c.livello || 1);
    const allOpts = [...opts, ...hbOpts];

    openCustomSelect(items, async (value) => {
        const newClassi = pg.classi.map(x => ({ ...x }));
        const target = newClassi[classIdx];
        if (value === '__none__') {
            delete target.sottoclasse;
            delete target.sottoclasseSlug;
            delete target.sottoclasse_homebrew_id;
            delete target.sottoclasse_homebrew_author;
            target.thirdCaster = false;
        } else {
            const sel = allOpts.find(o => o.slug === value);
            if (!sel) return;
            target.sottoclasse = sel.name;
            target.sottoclasseSlug = sel.slug;
            if (sel.isHomebrew) {
                target.sottoclasse_homebrew_id = sel._hbId;
                if (sel._hbAuthor) target.sottoclasse_homebrew_author = sel._hbAuthor;
                target.thirdCaster = false;
            } else {
                delete target.sottoclasse_homebrew_id;
                delete target.sottoclasse_homebrew_author;
                target.thirdCaster = (typeof isThirdCasterSubclass === 'function')
                    ? isThirdCasterSubclass(sel.slug, sel.name) : false;
            }
        }

        // Pulisce dai privilegi salvati le voci "hidden_auto" legate alla
        // vecchia sottoclasse di questa stessa classe (prefisso
        // "<classSlug>:<oldSubSlug>:"), per non lasciare fantasmi che, in
        // teoria, potrebbero collidere se l'utente tornasse alla stessa
        // sottoclasse in futuro. Le custom_features (tabelle utente) restano
        // intatte.
        const oldSubSlug = c.sottoclasseSlug || '';
        let privilegi = pg.privilegi && typeof pg.privilegi === 'object' ? { ...pg.privilegi } : null;
        if (privilegi && Array.isArray(privilegi.hidden_auto) && oldSubSlug) {
            privilegi.hidden_auto = privilegi.hidden_auto.filter(k => {
                if (typeof k !== 'string') return true;
                return !k.includes(`:${oldSubSlug}:`);
            });
        }

        const updates = { classi: newClassi, updated_at: new Date().toISOString() };
        if (privilegi) updates.privilegi = privilegi;

        const supabase = getSupabaseClient();
        if (!supabase) return;
        try {
            const { error } = await supabase.from('personaggi').update(updates).eq('id', pgId);
            if (error) throw error;
            showNotification(target.sottoclasse
                ? `Sottoclasse di ${c.nome} aggiornata: ${target.sottoclasse}`
                : `Sottoclasse di ${c.nome} rimossa`);
            await loadPersonaggi();
            // Se la scheda di questo PG e' aperta, ricarica.
            if (AppState.currentPersonaggioId === pgId && AppState.currentPage === 'scheda') {
                if (typeof renderSchedaPersonaggio === 'function') {
                    await renderSchedaPersonaggio(pgId);
                }
            }
            try { await sendAppEventBroadcast({ table: 'personaggi', action: 'update', id: pgId }); } catch (_) {}
        } catch (e) {
            console.error('Errore aggiornamento sottoclasse:', e);
            showNotification('Errore nel salvataggio della sottoclasse');
        }
    }, `Sottoclasse di ${c.nome}`);
}

// --- Scegli personaggio per campagna ---

window.openScegliPersonaggioModal = async function(campagnaId) {
    if (!elements.scegliPersonaggioModal || !elements.scegliPersonaggioList) return;

    elements.scegliPersonaggioList.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento...</p></div>';
    elements.scegliPersonaggioModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const userData = await findUserByUid(AppState.currentUser?.uid);
        if (!userData) throw new Error('Utente non trovato');

        const { data: personaggi, error } = await supabase.rpc('get_personaggi_utente');
        if (error) throw error;

        const { data: assoc } = await supabase
            .from('personaggi_campagna')
            .select('personaggio_id')
            .eq('campagna_id', campagnaId)
            .eq('user_id', userData.id)
            .maybeSingle();

        const currentPgId = assoc?.personaggio_id || null;

        if (!personaggi || personaggi.length === 0) {
            elements.scegliPersonaggioList.innerHTML = `
                <div class="content-placeholder">
                    <p>Non hai personaggi. Creane uno prima!</p>
                    <button class="btn-primary btn-small" onclick="closeScegliPersonaggioModal(); navigateToPage('personaggi');">Vai a Personaggi</button>
                </div>`;
            return;
        }

        elements.scegliPersonaggioList.innerHTML = personaggi.map(pg => {
            const initials = (pg.nome || '?').substring(0, 2).toUpperCase();
            const isSelected = pg.id === currentPgId;
            return `
            <div class="scegli-pg-item ${isSelected ? 'selected' : ''}" onclick="selectPersonaggioCampagna('${campagnaId}', '${pg.id}', '${userData.id}')">
                <div class="scegli-pg-item-avatar">${escapeHtml(initials)}</div>
                <div class="scegli-pg-item-info">
                    <div class="scegli-pg-item-name">${escapeHtml(pg.nome)}${isSelected ? ' (attuale)' : ''}</div>
                    <div class="scegli-pg-item-detail">${escapeHtml(pg.razza || '')} ${escapeHtml(pg.classe || '')} - Lv ${pg.livello || 1}</div>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Errore caricamento personaggi per selezione:', error);
        elements.scegliPersonaggioList.innerHTML = '<div class="content-placeholder"><p>Errore nel caricamento</p></div>';
    }
}

function closeScegliPersonaggioModal() {
    if (elements.scegliPersonaggioModal) {
        elements.scegliPersonaggioModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

window.selectPersonaggioCampagna = async function(campagnaId, personaggioId, userId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('personaggi_campagna')
            .upsert({
                campagna_id: campagnaId,
                user_id: userId,
                personaggio_id: personaggioId,
                created_at: new Date().toISOString()
            }, { onConflict: 'campagna_id,user_id' });

        if (error) throw error;

        showNotification('Personaggio selezionato!');
        closeScegliPersonaggioModal();
        await sendAppEventBroadcast({ table: 'personaggi_campagna', action: 'upsert', campagnaId });

        if (AppState.currentPage === 'dettagli' && AppState.currentCampagnaId === campagnaId) {
            await loadCampagnaDetails(campagnaId);
        }
    } catch (error) {
        console.error('Errore selezione personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    }
}

// ============================================================================
// TIPO SCHEDA MODAL
// ============================================================================

window.openTipoSchedaModal = function() {
    const modal = document.getElementById('tipoSchedaModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
};

window.closeTipoSchedaModal = function() {
    const modal = document.getElementById('tipoSchedaModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
};

// ============================================================================
// MICRO SCHEDA CREATION
// ============================================================================

let _microEditingId = null;
let _microSelectedClasses = [];

function microRenderClassi() {
    const container = document.getElementById('microClassiList');
    if (!container) return;
    const chipsHtml = _microSelectedClasses.map((c, i) => {
        const subSelector = _renderSubclassSelector(c, i, 'microOpenSubclassDropdown');
        return `
        <div class="pg-classe-chip">
            <div class="pg-classe-chip-top">
                <span class="pg-classe-name">${escapeHtml(c.nome)}</span>
                <div class="pg-classe-lv-controls">
                    <span class="pg-classe-lv-label">Lv.</span>
                    <button type="button" class="pg-classe-lv-btn" onclick="microClassLevelChange(${i},-1)">−</button>
                    <span class="pg-classe-lv-val">${c.livello}</span>
                    <button type="button" class="pg-classe-lv-btn" onclick="microClassLevelChange(${i},1)">+</button>
                </div>
                <button type="button" class="pg-classe-remove" onclick="microRemoveClass(${i})">&times;</button>
            </div>
            ${subSelector}
        </div>`;
    }).join('');

    const addBtn = `<button type="button" class="pg-add-class-btn" onclick="microOpenClasseSelect()">
        <span class="pg-add-class-plus">+</span> Aggiungi classe
    </button>`;
    container.innerHTML = chipsHtml + addBtn;
    microUpdateTotalLevel();
}

window.microOpenSubclassDropdown = async function(index) {
    const c = _microSelectedClasses[index];
    if (!c) return;
    // Refresh cache homebrew sempre prima del picker (la dedup interna evita
    // doppie query). Cache vuota non significa "già provato": potrebbe essere
    // un'inizializzazione precedente fatta senza utente loggato.
    if (typeof loadHomebrewSottoclassi === 'function') {
        try { await loadHomebrewSottoclassi(); } catch (_) {}
    }
    const opts = pgGetSubclassOptions(c.nome);
    const hbOpts = pgGetHomebrewSubclassOptions(c.nome);
    if (opts.length === 0 && hbOpts.length === 0) {
        showNotification(`Nessuna sottoclasse disponibile per ${c.nome}`);
        return;
    }
    const items = _buildSubclassPickerItems(opts, hbOpts, c.livello);
    const allOpts = [...opts, ...hbOpts];
    openCustomSelect(items, (value) => {
        if (value === '__none__') {
            delete c.sottoclasse;
            delete c.sottoclasseSlug;
            delete c.sottoclasse_homebrew_id;
            delete c.sottoclasse_homebrew_author;
            c.thirdCaster = false;
        } else {
            const sel = allOpts.find(o => o.slug === value);
            if (sel) {
                c.sottoclasse = sel.name;
                c.sottoclasseSlug = sel.slug;
                if (sel.isHomebrew) {
                    c.sottoclasse_homebrew_id = sel._hbId;
                    if (sel._hbAuthor) c.sottoclasse_homebrew_author = sel._hbAuthor;
                    c.thirdCaster = false;
                } else {
                    delete c.sottoclasse_homebrew_id;
                    delete c.sottoclasse_homebrew_author;
                    c.thirdCaster = isThirdCasterSubclass(sel.slug, sel.name);
                }
            }
        }
        microRenderClassi();
    }, `Sottoclasse di ${c.nome}`);
};

window.microClearSubclass = function(index) {
    const c = _microSelectedClasses[index];
    if (!c) return;
    delete c.sottoclasse;
    delete c.sottoclasseSlug;
    delete c.sottoclasse_homebrew_id;
    delete c.sottoclasse_homebrew_author;
    c.thirdCaster = false;
    microRenderClassi();
};

function microUpdateTotalLevel() {
    const total = _microSelectedClasses.reduce((s, c) => s + c.livello, 0);
    const field = document.getElementById('microLivello');
    if (field) field.value = total;
}

window.microOpenClasseSelect = function() {
    const available = DND_CLASSES.filter(cls => !_microSelectedClasses.some(s => s.nome === cls));
    const classOptions = available.map(c => ({ value: c, label: c }));
    openCustomSelect(classOptions, (value) => {
        _microSelectedClasses.push({ nome: value, livello: 1, thirdCaster: false });
        microRenderClassi();
    }, 'Seleziona Classe');
};

window.microRemoveClass = function(i) {
    _microSelectedClasses.splice(i, 1);
    microRenderClassi();
};

window.microClassLevelChange = function(i, delta) {
    const c = _microSelectedClasses[i];
    if (!c) return;
    c.livello = Math.max(1, Math.min(20, c.livello + delta));
    microRenderClassi();
};

window.openMicroSchedaModal = function(personaggioId) {
    _microEditingId = personaggioId || null;
    const form = document.getElementById('microSchedaForm');
    if (form) form.reset();
    _microSelectedClasses = [];

    const title = document.getElementById('microSchedaModalTitle');
    const saveBtn = document.getElementById('saveMicroSchedaBtn');
    if (_microEditingId) {
        if (title) title.textContent = 'Modifica Micro Scheda';
        if (saveBtn) saveBtn.textContent = 'Salva';
        const supabase = getSupabaseClient();
        if (supabase) {
            supabase.from('personaggi').select('*').eq('id', personaggioId).single().then(({ data }) => {
                if (data) {
                    document.getElementById('microNome').value = data.nome || '';
                    document.getElementById('microPVMax').value = data.punti_vita_max || 10;
                    if (data.classi && Array.isArray(data.classi) && data.classi.length > 0) {
                        _microSelectedClasses = data.classi.map(c => ({
                            nome: c.nome,
                            livello: c.livello || 1,
                            thirdCaster: !!c.thirdCaster,
                            ...(c.sottoclasse ? { sottoclasse: c.sottoclasse } : {}),
                            ...(c.sottoclasseSlug ? { sottoclasseSlug: c.sottoclasseSlug } : {}),
                        }));
                    } else if (data.classe) {
                        _microSelectedClasses = [{ nome: data.classe, livello: data.livello || 1, thirdCaster: false }];
                    }
                    microRenderClassi();
                }
            });
        }
    } else {
        if (title) title.textContent = 'Nuova Micro Scheda';
        if (saveBtn) saveBtn.textContent = 'Crea';
    }
    microRenderClassi();

    const modal = document.getElementById('microSchedaModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
};

window.closeMicroSchedaModal = function() {
    const modal = document.getElementById('microSchedaModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
    _microEditingId = null;
};

async function handleSaveMicroScheda(e) {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const nome = document.getElementById('microNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome'); return; }
    if (_microSelectedClasses.length === 0) { showNotification('Seleziona almeno una classe'); return; }

    const pvMax = parseInt(document.getElementById('microPVMax')?.value) || 10;
    const totalLevel = _microSelectedClasses.reduce((s, c) => s + c.livello, 0);
    const classeDisplay = _microSelectedClasses.map(c => `${c.nome} ${c.livello}`).join(' / ');

    const saveBtn = document.getElementById('saveMicroSchedaBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvataggio...'; }

    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) { showNotification('Errore: utente non trovato'); return; }

    const autoSlots = calcSpellSlotsFromClassi(_microSelectedClasses);
    const slotIncantesimo = {};
    Object.keys(autoSlots).forEach(lv => {
        slotIncantesimo[lv] = { max: autoSlots[lv], current: autoSlots[lv], used: 0 };
    });

    const pgData = {
        nome,
        classe: classeDisplay,
        classi: _microSelectedClasses,
        livello: totalLevel,
        punti_vita_max: pvMax,
        pv_attuali: pvMax,
        slot_incantesimo: slotIncantesimo,
        tipo_scheda: 'micro',
        updated_at: new Date().toISOString()
    };

    try {
        if (_microEditingId) {
            const { error } = await supabase.from('personaggi').update(pgData).eq('id', _microEditingId);
            if (error) throw error;
            showNotification('Micro Scheda aggiornata');
        } else {
            pgData.user_id = userData.id;
            pgData.forza = 10; pgData.destrezza = 10; pgData.costituzione = 10;
            pgData.intelligenza = 10; pgData.saggezza = 10; pgData.carisma = 10;
            pgData.classe_armatura = 10; pgData.iniziativa = 0; pgData.velocita = 9;
            pgData.percezione_passiva = 10;
            const { error } = await supabase.from('personaggi').insert(pgData);
            if (error) throw error;
            showNotification('Micro Scheda creata');
        }
        closeMicroSchedaModal();
        loadPersonaggi();
    } catch (err) {
        console.error('Errore salvataggio micro scheda:', err);
        showNotification('Errore nel salvataggio');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = _microEditingId ? 'Salva' : 'Crea'; }
    }
}

// ============================================================================
// MICRO SCHEDA RENDERING
// ============================================================================

async function renderMicroScheda(personaggioId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;

    const supabase = getSupabaseClient();
    if (!supabase) { content.innerHTML = '<p>Errore</p>'; return; }

    const { data: pg, error } = await supabase.from('personaggi').select('*').eq('id', personaggioId).single();
    if (error || !pg) { content.innerHTML = '<p>Personaggio non trovato</p>'; return; }
    _schedaPgCache = pg;

    let classeDisplay = pg.classe || '';
    if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
        classeDisplay = pg.classi.map(c => `${c.nome} ${c.livello}`).join(' / ');
    }

    const pvAttuali = pg.pv_attuali != null ? pg.pv_attuali : pg.punti_vita_max;
    const pvTemp = pg.pv_temporanei || 0;
    const initDisplay = pg.iniziativa != null ? pg.iniziativa : 0;
    const initStr = initDisplay >= 0 ? `+${initDisplay}` : `${initDisplay}`;

    const CLASS_HD = { 'Artefice':8,'Bardo':8,'Chierico':8,'Druido':8,'Ladro':8,'Monaco':8,'Warlock':8,'Barbaro':12,'Mago':6,'Stregone':6,'Guerriero':10,'Paladino':10,'Ranger':10 };
    const dadiDisp = pg.dadi_vita_disponibili || {};
    let hitDiceHtml = '';
    if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
        hitDiceHtml = `<div class="scheda-hd-table">
            ${pg.classi.map(c => {
                const die = CLASS_HD[c.nome] || 8;
                const total = c.livello || 1;
                const key = c.nome;
                const available = Math.min(total, dadiDisp[key] != null ? dadiDisp[key] : total);
                return `<div class="scheda-hd-row">
                    <span class="scheda-hd-total">${total}d${die} <small>(${c.nome})</small></span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="microHdChange('${pg.id}','${key}',-1,${total})">−</button>
                        <span class="scheda-hd-val" id="sHd_${key}">${available}</span>
                        <button class="scheda-hd-btn" onclick="microHdChange('${pg.id}','${key}',1,${total})">+</button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    }

    // Micro scheda: class resources
    const microClassRes = pg.risorse_classe || {};
    const microResItems = [];
    if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
        pg.classi.forEach(c => {
            const resList = CLASS_RESOURCES[c.nome];
            if (!resList) return;
            resList.forEach((res, rIdx) => {
                if (c.livello < res.fromLevel) return;
                let maxVal;
                if (res.hpPool) {
                    maxVal = c.livello * 5;
                } else if (res.usaMod) {
                    maxVal = Math.max(1, calcMod(pg[res.usaMod] || 10));
                } else if (res.perLivello) {
                    maxVal = res.perLivello[Math.min(c.livello, 20)] || 0;
                } else { return; }
                if (maxVal <= 0) return;
                const key = rIdx === 0 ? `${c.nome}_res` : `${c.nome}_res_${rIdx}`;
                const current = Math.min(maxVal, microClassRes[key] != null ? microClassRes[key] : maxVal);
                microResItems.push(`<div class="scheda-hd-row">
                    <span class="scheda-hd-total">${res.nome} <small>(${c.nome})</small></span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},-1,${maxVal})">−</button>
                        <span class="scheda-hd-val" id="sCRes_${key}">${current}</span>
                        <span class="scheda-hd-max">/ ${maxVal}</span>
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},1,${maxVal})">+</button>
                    </div>
                </div>`);
            });
        });
    }
    _pgRaceResources(pg).forEach(rr => {
        const sub = rr.recharge ? ` <small>(razza, ${rr.recharge})</small>` : ` <small>(razza)</small>`;
        microResItems.push(`<div class="scheda-hd-row">
            <span class="scheda-hd-total">${escapeHtml(rr.name)}${sub}</span>
            <div class="scheda-hd-avail">
                <button class="scheda-hd-btn" onclick="schedaRaceResChange('${pg.id}','${rr.key}',${rr.current},-1,${rr.max})">−</button>
                <span class="scheda-hd-val" id="sRRes_${rr.key}">${rr.current}</span>
                <span class="scheda-hd-max">/ ${rr.max}</span>
                <button class="scheda-hd-btn" onclick="schedaRaceResChange('${pg.id}','${rr.key}',${rr.current},1,${rr.max})">+</button>
            </div>
        </div>`);
    });
    const microCustomRes = microClassRes._custom || [];
    microCustomRes.forEach((cr, i) => {
        const current = cr.current != null ? cr.current : cr.max;
        const label = cr.tipo === 'dadi' ? `${escapeHtml(cr.nome)} <small>(${cr.dado})</small>` : escapeHtml(cr.nome);
        microResItems.push(`<div class="scheda-hd-row">
            <span class="scheda-hd-total scheda-hd-total-clickable" onclick="schedaOpenAddCustomRes('${pg.id}',${i})" title="Modifica / elimina">${label}</span>
            <div class="scheda-hd-avail">
                <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},-1,${cr.max})">−</button>
                <span class="scheda-hd-val" id="sCusRes_${i}">${current}</span>
                <span class="scheda-hd-max">/ ${cr.max}</span>
                <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},1,${cr.max})">+</button>
            </div>
        </div>`);
    });
    const microClassResHtml = `<div class="scheda-section">
        <div class="scheda-section-title">Risorse di Classe
            <button class="scheda-edit-btn" onclick="schedaOpenAddCustomRes('${pg.id}')" title="Aggiungi risorsa">&#9998;</button>
        </div>
        ${microResItems.length > 0 ? `<div class="scheda-hd-table">${microResItems.join('')}</div>` : '<span class="scheda-empty">Nessuna risorsa</span>'}
    </div>`;

    const isConcentrating = !!pg.concentrazione;
    const conditionsActive = ALL_CONDITIONS.filter(c => c.key !== 'concentrazione' && pg[c.key]);
    const conditionsHtml = conditionsActive.length > 0 ?
        conditionsActive.map(c => `<span class="condition-badge active">${c.label}</span>`).join('') :
        '<span class="scheda-empty">Nessuna</span>';

    const resistenze = pg.resistenze || [];
    const immunita = pg.immunita || [];
    const microResHtml = resistenze.length > 0 ?
        resistenze.map(r => `<span class="scheda-tag">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
        '<span class="scheda-empty">Nessuna</span>';
    const microImmHtml = immunita.length > 0 ?
        immunita.map(r => `<span class="scheda-tag scheda-tag-imm">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
        '<span class="scheda-empty">Nessuna</span>';
    const resImmHtml = `<div class="scheda-section">
        <div class="scheda-section-title">
            Resistenze e Immunità
            <button class="scheda-edit-btn" onclick="schedaOpenResImmEdit('${pg.id}')" title="Modifica">&#9998;</button>
        </div>
        <div class="scheda-res-imm-display" id="schedaResImmDisplay">
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Resistenze</span><div class="scheda-tags">${microResHtml}</div></div>
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Immunità</span><div class="scheda-tags">${microImmHtml}</div></div>
        </div>
        <div id="schedaResImmEditGrid" style="display:none;"></div>
    </div>`;

    const slots = pg.slot_incantesimo || {};
    let slotsHtml = '';
    const sortedLevels = Object.keys(slots).map(Number).filter(l => l > 0 && slots[l]?.max > 0).sort((a, b) => a - b);
    const slotRows = sortedLevels.map(lv => {
        const s = slots[lv];
        const currentAvail = s.current != null ? s.current : (s.max - (s.used || 0));
        const pips = [];
        for (let i = 0; i < s.max; i++) {
            pips.push(`<span class="scheda-slot-pip ${i < currentAvail ? 'filled' : ''}" data-lvl="${lv}" data-idx="${i}"></span>`);
        }
        return `
        <div class="scheda-slot-row">
            <span class="scheda-slot-level">Lv ${lv}</span>
            <div class="scheda-slot-pips">${pips.join('')}</div>
            <span class="scheda-slot-count">${currentAvail}/${s.max}</span>
        </div>`;
    }).join('');
    slotsHtml = `<div class="scheda-section">
        <div class="scheda-section-title">Slot Incantesimo <button class="scheda-edit-btn" onclick="microOpenSlotConfig('${pg.id}')" title="Configura">&#9998;</button></div>
        ${slotRows ? `<div class="scheda-slots-table">${slotRows}</div>` : '<span class="scheda-empty">Nessuno slot configurato</span>'}
    </div>`;

    const tabBar = document.getElementById('schedaTabBar');
    if (tabBar) tabBar.style.display = 'none';

    // La micro-scheda non ha la struttura con il divisore "Statistiche": nascondi il bottone spada.
    const scrollBtn = document.getElementById('btnScrollStats');
    if (scrollBtn) scrollBtn.style.display = 'none';

    content.innerHTML = `
    <div class="scheda-identity">
        <div class="scheda-name">${escapeHtml(pg.nome)}</div>
        <div class="scheda-subtitle">${escapeHtml(classeDisplay)}</div>
        <div class="scheda-subtitle-sm">${[pg.razza, pg.background].filter(Boolean).map(s => escapeHtml(s)).join(' · ')}</div>
    </div>

    <div class="scheda-three-boxes">
        <div class="scheda-box clickable" onclick="schedaOpenStatCalc('${pg.id}','iniziativa')">
            <div class="scheda-box-val" id="schedaInit">${initStr}</div>
            <div class="scheda-box-label">Iniziativa</div>
        </div>
    </div>

    <div class="scheda-hp-section">
        <div class="scheda-hp-left">
            <div class="scheda-hp-pair">
                <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalc('${pg.id}','punti_vita_max',${pg.punti_vita_max},-1)">
                    <div class="scheda-hp-display" id="schedaPvMax">${pg.punti_vita_max || 10}</div>
                    <div class="scheda-hp-label">PV Massimi</div>
                </div>
                <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalc('${pg.id}','pv_attuali',${pvAttuali},${pg.punti_vita_max})">
                    <div class="scheda-hp-display pv-current" id="schedaPvAttuali">${pvAttuali}</div>
                    <div class="scheda-hp-label">PV Attuali</div>
                </div>
            </div>
        </div>
        <div class="scheda-hp-right clickable" onclick="schedaOpenHpCalc('${pg.id}','pv_temporanei',${pvTemp},-1)">
            <div class="scheda-hp-display" id="schedaPvTemp">${pvTemp}</div>
            <div class="scheda-hp-label">PV Temp</div>
        </div>
    </div>

    <div class="scheda-section">
        <div class="scheda-section-title">Dadi Vita</div>
        ${hitDiceHtml || '<span class="scheda-empty">-</span>'}
    </div>

    ${microClassResHtml}

    <div class="scheda-section">
        <div class="scheda-section-title">Condizioni</div>
        <div class="scheda-concentrazione-row">
            <button type="button" class="scheda-concentrazione-btn ${isConcentrating ? 'active' : ''}" onclick="schedaToggleConcentrazione('${pg.id}',this)">Concentrazione</button>
        </div>
        <div class="scheda-tags" style="margin-top:8px;">${conditionsHtml}</div>
        <div class="scheda-condition-extra">
            <span>Esaustione: <strong>${pg.esaustione || 0}</strong>/6</span>
        </div>
        <button type="button" class="btn-secondary btn-small" style="margin-top:8px;" onclick="openConditionsModal('${pg.id}')">Modifica stato</button>
    </div>

    ${resImmHtml}

    ${slotsHtml}
    `;

    content.querySelectorAll('.scheda-slot-pip').forEach(pip => {
        pip.addEventListener('click', () => {
            const lvl = parseInt(pip.dataset.lvl);
            const idx = parseInt(pip.dataset.idx);
            microSlotToggle(pg.id, lvl, idx);
        });
    });

    const backBtn = document.getElementById('schedaBackBtn');
    if (backBtn) backBtn.onclick = () => navigateToPage('personaggi');

    // Se richiesto, centra la vista sul blocco PV/PV temp/Iniziativa.
    if (window._schedaPendingScrollToStats) {
        window._schedaPendingScrollToStats = false;
        setTimeout(() => {
            const target = content.querySelector('.scheda-hp-section')
                        || content.querySelector('.scheda-three-boxes');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
    }
}

window.microSlotToggle = async function(pgId, level, index) {
    const pg = _schedaPgCache;
    if (!pg?.slot_incantesimo?.[level]) return;
    const slot = pg.slot_incantesimo[level];
    const currentAvail = slot.current != null ? slot.current : (slot.max - (slot.used || 0));
    slot.current = index < currentAvail ? index : index + 1;
    slot.used = slot.max - slot.current;
    await schedaInstantSave(pgId, { slot_incantesimo: pg.slot_incantesimo });
    renderMicroScheda(pgId);
}

window.microHdChange = async function(pgId, key, delta, max) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('dadi_vita_disponibili').eq('id', pgId).single();
    const dadiDisp = pg?.dadi_vita_disponibili || {};
    const current = dadiDisp[key] != null ? dadiDisp[key] : max;
    const newVal = Math.max(0, Math.min(max, current + delta));
    dadiDisp[key] = newVal;
    await supabase.from('personaggi').update({ dadi_vita_disponibili: dadiDisp, updated_at: new Date().toISOString() }).eq('id', pgId);
    renderMicroScheda(pgId);
};

window.microToggleCondition = async function(pgId, key, el) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const isActive = el.classList.contains('active');
    await supabase.from('personaggi').update({ [key]: !isActive, updated_at: new Date().toISOString() }).eq('id', pgId);
    el.classList.toggle('active');
};

window.microSlotChange = async function(pgId, level, delta, max) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const slots = pg.slot_incantesimo || {};
    if (!slots[level]) slots[level] = { max, current: max, used: 0 };
    const avail = slots[level].current != null ? slots[level].current : (max - (slots[level].used || 0));
    const newAvail = Math.max(0, Math.min(max, avail - delta));
    slots[level].current = newAvail;
    slots[level].used = max - newAvail;
    await schedaInstantSave(pgId, { slot_incantesimo: slots });
    renderMicroScheda(pgId);
};

window.microOpenSlotConfig = async function(pgId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('slot_incantesimo').eq('id', pgId).single();
    const slots = pg?.slot_incantesimo || {};

    let rows = '';
    for (let lv = 1; lv <= 9; lv++) {
        const maxVal = slots[lv]?.max || 0;
        rows += `<div class="micro-slot-config-row">
            <span>${lv}° Livello</span>
            <input type="number" min="0" max="20" value="${maxVal}" id="microSlotMax_${lv}" class="form-control" style="width:60px;text-align:center;" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)">
        </div>`;
    }

    const modalHtml = `
    <div class="modal active" id="microSlotConfigModal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeMicroSlotConfig()">&times;</button>
            <h2>Configura Slot Incantesimo</h2>
            <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:12px;">Imposta il numero massimo di slot per livello</p>
            <div class="micro-slot-config-grid">${rows}</div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="closeMicroSlotConfig()">Annulla</button>
                <button type="button" class="btn-primary" onclick="saveMicroSlotConfig('${pgId}')">Salva</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
};

window.closeMicroSlotConfig = function() {
    const m = document.getElementById('microSlotConfigModal');
    if (m) m.remove();
    document.body.style.overflow = '';
};

window.saveMicroSlotConfig = async function(pgId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('slot_incantesimo').eq('id', pgId).single();
    const slots = pg?.slot_incantesimo || {};

    for (let lv = 1; lv <= 9; lv++) {
        const input = document.getElementById(`microSlotMax_${lv}`);
        const maxVal = parseInt(input?.value) || 0;
        if (maxVal > 0) {
            if (!slots[lv]) slots[lv] = { max: maxVal, used: 0 };
            else slots[lv].max = maxVal;
        } else {
            delete slots[lv];
        }
    }

    await supabase.from('personaggi').update({ slot_incantesimo: slots, updated_at: new Date().toISOString() }).eq('id', pgId);
    closeMicroSlotConfig();
    renderMicroScheda(pgId);
    showNotification('Slot incantesimo aggiornati');
};
