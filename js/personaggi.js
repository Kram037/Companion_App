// ============================================================================
// PERSONAGGI MANAGEMENT
// ============================================================================

let editingPersonaggioId = null;
let pgWizardCurrentStep = 0;
let pgSelectedClasses = [];

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

// Talenti from PHB, XGtE, TCoE
const DND_TALENTI = [
    { nome: 'Allerta', fonte: 'PHB' },
    { nome: 'Atleta', fonte: 'PHB' },
    { nome: 'Attore', fonte: 'PHB' },
    { nome: 'Abile', fonte: 'PHB' },
    { nome: 'Arma da Guerra Preferita', fonte: 'PHB' },
    { nome: 'Carica Possente', fonte: 'PHB' },
    { nome: 'Cecchino Letale', fonte: 'PHB' },
    { nome: 'Combattente a Due Armi', fonte: 'PHB' },
    { nome: 'Combattente con Arma a Due Mani', fonte: 'PHB' },
    { nome: 'Combattente con Scudo', fonte: 'PHB' },
    { nome: 'Difensore da Sentinella', fonte: 'PHB' },
    { nome: 'Duro a Morire', fonte: 'PHB' },
    { nome: 'Duro come la Roccia', fonte: 'PHB' },
    { nome: 'Elementalista', fonte: 'PHB' },
    { nome: 'Guerriero a Distanza', fonte: 'PHB' },
    { nome: 'Incantatore da Guerra', fonte: 'PHB' },
    { nome: 'Iniziato alla Magia', fonte: 'PHB' },
    { nome: 'Ispiratore', fonte: 'PHB' },
    { nome: 'Linguista', fonte: 'PHB' },
    { nome: 'Lottatore', fonte: 'PHB' },
    { nome: 'Mago da Guerra', fonte: 'PHB' },
    { nome: 'Mobile', fonte: 'PHB' },
    { nome: 'Osservatore', fonte: 'PHB' },
    { nome: 'Robusto', fonte: 'PHB' },
    { nome: 'Sentinella', fonte: 'PHB' },
    { nome: 'Tiratore Scelto', fonte: 'PHB' },
    { nome: 'Duttile', fonte: 'PHB' },
    { nome: 'Fortuna', fonte: 'PHB' },
    { nome: 'Guaritore', fonte: 'PHB' },
    { nome: 'Maestro delle Armature Leggere', fonte: 'PHB' },
    { nome: 'Maestro delle Armature Medie', fonte: 'PHB' },
    { nome: 'Maestro delle Armature Pesanti', fonte: 'PHB' },
    { nome: 'Maestro delle Pozioni', fonte: 'XGtE' },
    { nome: 'Prodigio', fonte: 'XGtE' },
    { nome: 'Elfico', fonte: 'XGtE' },
    { nome: 'Infernale', fonte: 'XGtE' },
    { nome: 'Nanico', fonte: 'XGtE' },
    { nome: 'Orchesco', fonte: 'XGtE' },
    { nome: 'Secondo Respiro', fonte: 'XGtE' },
    { nome: 'Silvano', fonte: 'XGtE' },
    { nome: 'Telepate', fonte: 'TCoE' },
    { nome: 'Telecineta', fonte: 'TCoE' },
    { nome: 'Metamago', fonte: 'TCoE' },
    { nome: 'Adepto Marziale', fonte: 'TCoE' },
    { nome: 'Iniziato agli Artifici', fonte: 'TCoE' },
    { nome: 'Cuoco', fonte: 'TCoE' },
    { nome: 'Avvelenatore', fonte: 'TCoE' },
    { nome: 'Abile Combattente', fonte: 'TCoE' },
    { nome: 'Schermitore', fonte: 'TCoE' },
    { nome: 'Frantoio', fonte: 'TCoE' },
    { nome: 'Trafittore', fonte: 'TCoE' },
    { nome: 'Tagliatore', fonte: 'TCoE' }
];

let pgCurrentTalenti = [];

function pgRenderTalenti() {
    const container = document.getElementById('pgTalentiList');
    if (!container) return;

    const selectedHtml = pgCurrentTalenti.map((t, i) => `
        <div class="pg-talento-item selected">
            <span class="pg-talento-name">${escapeHtml(t)}</span>
            <button type="button" class="pg-talento-remove" onclick="pgRemoveTalento(${i})">✕</button>
        </div>
    `).join('');

    const available = DND_TALENTI.filter(t => !pgCurrentTalenti.includes(t.nome));
    const listHtml = available.map(t => `
        <div class="pg-talento-item" onclick="pgAddTalento('${escapeHtml(t.nome)}')">
            <span class="pg-talento-name">${escapeHtml(t.nome)}</span>
            <span class="option-source">(${t.fonte})</span>
        </div>
    `).join('');

    container.innerHTML = `
        ${selectedHtml ? `<div class="pg-talenti-selected">${selectedHtml}</div>` : ''}
        <div class="pg-talenti-available">${listHtml}</div>
    `;
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
function buildRaceOptionsFromDB() {
    const razze = AppState.cachedRazze;
    if (!razze || razze.length === 0) {
        return DND_RACES_GROUPED.map(r => typeof r === 'object' ? r : { value: r, label: r });
    }
    const options = [];
    let lastGruppo = '__init__';
    razze.forEach(r => {
        const g = r.gruppo || null;
        if (g !== lastGruppo) {
            options.push({ type: 'divider', label: g || '' });
            lastGruppo = g;
        }
        options.push({ value: r.nome, label: r.nome, source: r.fonte || '' });
    });
    return options;
}

function buildBackgroundOptionsFromDB() {
    const bgs = AppState.cachedBackground;
    if (!bgs || bgs.length === 0) {
        return DND_BACKGROUNDS.map(b => ({ value: b, label: b }));
    }
    return bgs.map(b => ({ value: b.nome, label: b.nome, source: b.fonte || '' }));
}

function getRaceData(nome) {
    if (!AppState.cachedRazze) return null;
    return AppState.cachedRazze.find(r => r.nome === nome) || null;
}

function getBackgroundData(nome) {
    if (!AppState.cachedBackground) return null;
    return AppState.cachedBackground.find(b => b.nome === nome) || null;
}

window.pgOpenRazzaSelect = function() {
    openCustomSelect(
        buildRaceOptionsFromDB(),
        (value) => {
            document.getElementById('pgRazza').value = value;
            const btn = document.getElementById('pgRazzaBtn');
            if (btn) btn.textContent = value;
            const data = getRaceData(value);
            if (data) {
                const velField = document.getElementById('pgVelocita');
                if (velField) velField.value = data.velocita || 9;
                if (data.resistenze && data.resistenze.length > 0) {
                    data.resistenze.forEach(r => { if (!pgCurrentResistenze.includes(r)) pgCurrentResistenze.push(r); });
                }
                if (data.competenze_abilita && data.competenze_abilita.length > 0) {
                    data.competenze_abilita.forEach(s => pgCurrentSkillProficiencies.add(s));
                }
            }
        },
        'Seleziona Razza'
    );
}

window.pgOpenBackgroundSelect = function() {
    openCustomSelect(
        buildBackgroundOptionsFromDB(),
        (value) => {
            document.getElementById('pgBackground').value = value;
            const btn = document.getElementById('pgBackgroundBtn');
            if (btn) btn.textContent = value;
            const data = getBackgroundData(value);
            if (data && data.competenze_abilita && data.competenze_abilita.length > 0) {
                data.competenze_abilita.forEach(s => pgCurrentSkillProficiencies.add(s));
            }
        },
        'Seleziona Background'
    );
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

const THIRD_CASTER_SUBCLASSES = {
    'Guerriero': 'Cavaliere Mistico',
    'Ladro': 'Mistificatore Arcano'
};

function pgRenderClassi() {
    const container = document.getElementById('pgClassiList');
    if (!container) return;
    const chipsHtml = pgSelectedClasses.map((c, i) => {
        const subLabel = THIRD_CASTER_SUBCLASSES[c.nome];
        const subCheck = subLabel ? `
            <label class="pg-subclass-check">
                <input type="checkbox" ${c.thirdCaster ? 'checked' : ''} onchange="pgToggleThirdCaster(${i}, this.checked)">
                <span>${subLabel}</span>
            </label>` : '';
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
            ${subCheck}
        </div>`;
    }).join('');

    const addBtn = `<button type="button" class="pg-add-class-btn" onclick="pgOpenClassDropdown()">
        <span class="pg-add-class-plus">+</span> Aggiungi classe
    </button>`;
    container.innerHTML = chipsHtml + addBtn;
}

window.pgClassLevelChange = function(index, delta) {
    const c = pgSelectedClasses[index];
    if (!c) return;
    c.livello = Math.max(1, Math.min(20, c.livello + delta));
    pgRenderClassi();
    pgUpdateTotalLevel();
    pgResetAutoHP();
}

window.pgToggleThirdCaster = function(index, checked) {
    pgSelectedClasses[index].thirdCaster = checked;
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
    }
};

const CLASS_CASTER_TYPE = {
    'Bardo': 'full', 'Chierico': 'full', 'Druido': 'full', 'Mago': 'full',
    'Stregone': 'full', 'Warlock': 'pact',
    'Paladino': 'half', 'Ranger': 'half',
    'Artefice': 'half',
    'Barbaro': null, 'Guerriero': null, 'Ladro': null, 'Monaco': null
};

function pgCalcSpellSlots() {
    let totalCasterLevel = 0;
    let hasPactMagic = false;
    let pactLevel = 0;

    pgSelectedClasses.forEach(cls => {
        const type = CLASS_CASTER_TYPE[cls.nome];
        if (type === 'full') totalCasterLevel += cls.livello;
        else if (type === 'half') totalCasterLevel += Math.floor(cls.livello / 2);
        else if (type === 'pact') { hasPactMagic = true; pactLevel += cls.livello; }
        else if (type === null && cls.thirdCaster) {
            totalCasterLevel += Math.floor(cls.livello / 3);
        }
    });

    let slots = {};
    if (totalCasterLevel > 0) {
        const table = CLASS_SPELL_SLOTS['full'];
        const level = Math.min(totalCasterLevel, 20);
        slots = table[level] ? { ...table[level] } : {};
    }

    if (hasPactMagic) {
        const pactSlotLevel = Math.min(Math.ceil(pactLevel / 2), 5);
        let pactSlotCount = pactLevel >= 17 ? 4 : pactLevel >= 11 ? 3 : pactLevel >= 2 ? 2 : 1;
        const current = slots[pactSlotLevel] || 0;
        slots[pactSlotLevel] = current + pactSlotCount;
    }

    return slots;
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
    if (step < 0 || step > 6) return;
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
        const des = parseInt(document.getElementById('pgDestrezza')?.value) || 10;
        const cos = parseInt(document.getElementById('pgCostituzione')?.value) || 10;
        const sag = parseInt(document.getElementById('pgSaggezza')?.value) || 10;
        const desMod = calcMod(des);
        const cosMod = calcMod(cos);
        const sagMod = calcMod(sag);

        const initField = document.getElementById('pgIniziativa');
        if (initField && !initField.value) {
            initField.value = desMod;
        }

        const classNames = pgSelectedClasses.map(c => c.nome);
        let caBase, caHint;
        if (classNames.includes('Barbaro')) {
            caBase = 10 + desMod + cosMod;
            caHint = `(10+des+cos = ${caBase})`;
        } else if (classNames.includes('Monaco')) {
            caBase = 10 + desMod + sagMod;
            caHint = `(10+des+sag = ${caBase})`;
        } else {
            caBase = 10 + desMod;
            caHint = `(10+des = ${caBase})`;
        }

        const caField = document.getElementById('pgCA');
        if (caField && !caField.value) caField.value = caBase;
        const hintCA = document.getElementById('hintCA');
        if (hintCA) hintCA.textContent = caHint;
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
                <button class="pg-card-delete" onclick="event.stopPropagation(); deletePersonaggio('${pg.id}')" aria-label="Elimina personaggio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div>
        </div>`;
    }).join('');
}

// --- Scheda Personaggio Page ---
window.openSchedaPersonaggio = async function(personaggioId) {
    AppState.currentPersonaggioId = personaggioId;
    sessionStorage.setItem('currentPersonaggioId', personaggioId);
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

function schedaInstantSave(personaggioId, updates) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    updates.updated_at = new Date().toISOString();
    supabase.from('personaggi').update(updates).eq('id', personaggioId).then(({ error }) => {
        if (error) console.error('Errore salvataggio:', error);
    });
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
    'Barbaro': { nome: 'Ire', perLivello: [0,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5,6,6,6,6,99], fromLevel: 1 },
    'Bardo': { nome: 'Ispirazioni Bardiche', perLivello: [0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3], usaMod: 'carisma', fromLevel: 1 },
    'Chierico': { nome: 'Incanalare Divinità', perLivello: [0,0,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3], fromLevel: 2 },
    'Druido': { nome: 'Forma Selvatica', perLivello: [0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2], fromLevel: 2 },
    'Guerriero': { nome: 'Secondo Vento', perLivello: [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], fromLevel: 1 },
    'Monaco': { nome: 'Punti Ki', perLivello: [0,0,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], fromLevel: 2 },
    'Paladino': { nome: 'Imposizione delle Mani', perLivello: null, hpPool: true, fromLevel: 1 },
    'Stregone': { nome: 'Punti Stregoneria', perLivello: [0,0,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], fromLevel: 2 },
    'Warlock': { nome: 'Slot del Patto', perLivello: [0,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2], fromLevel: 1 },
};

const CLASS_SPELL_ABILITY = {
    'Bardo': 'carisma', 'Chierico': 'saggezza', 'Druido': 'saggezza', 'Mago': 'intelligenza',
    'Stregone': 'carisma', 'Warlock': 'carisma', 'Paladino': 'carisma', 'Ranger': 'saggezza',
    'Artefice': 'intelligenza'
};

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
            const saveMod = Math.floor((val - 10) / 2) + (isSaveProf ? bonusComp : 0);
            const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
            return `
            <div class="scheda-ability">
                <div class="scheda-ability-label">${a.full}</div>
                <input type="number" class="scheda-ability-input" value="${val}" min="1" max="30" data-field="${a.key}" data-pgid="${pg.id}">
                <div class="scheda-ability-mod" id="sMod_${a.key}">${m}</div>
                <div class="scheda-ability-save ${isSaveProf ? 'proficient' : ''}" data-save="${a.key}" data-pgid="${pg.id}" onclick="schedaToggleSave('${pg.id}','${a.key}')">
                    <span class="scheda-save-dot">${isSaveProf ? '●' : '○'}</span>
                    <span class="scheda-save-label">TS</span>
                    <span class="scheda-save-val" id="sSave_${a.key}">${saveStr}</span>
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
                <span class="scheda-skill-dot ${isProf ? 'active' : ''}" onclick="schedaToggleSkillProf('${pg.id}','${sk.key}',event)" title="Competenza">●</span>
                <span class="scheda-skill-dot expert ${isExpert ? 'active' : ''}" onclick="schedaToggleSkillExpert('${pg.id}','${sk.key}',event)" title="Maestria">★</span>
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

        // Class Resources
        const classResources = pg.risorse_classe || {};
        let classResourcesHtml = '';
        if (pg.classi && pg.classi.length > 0) {
            const resItems = [];
            pg.classi.forEach(c => {
                const res = CLASS_RESOURCES[c.nome];
                if (!res || c.livello < res.fromLevel) return;
                let maxVal;
                if (res.hpPool) {
                    maxVal = c.livello * 5;
                } else if (res.usaMod) {
                    maxVal = Math.max(1, calcMod(pg[res.usaMod] || 10));
                } else if (res.perLivello) {
                    maxVal = res.perLivello[Math.min(c.livello, 20)] || 0;
                } else { return; }
                if (maxVal <= 0) return;
                const key = `${c.nome}_res`;
                const current = Math.min(maxVal, classResources[key] != null ? classResources[key] : maxVal);
                resItems.push(`<div class="scheda-hd-row">
                    <span class="scheda-hd-total">${res.nome} <small>(${c.nome})</small></span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},-1,${maxVal})">−</button>
                        <span class="scheda-hd-val" id="sCRes_${key}">${current}</span>
                        <span class="scheda-hd-max">/ ${maxVal}</span>
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},1,${maxVal})">+</button>
                    </div>
                </div>`);
            });
            if (resItems.length > 0) {
                classResourcesHtml = `<div class="scheda-section">
                    <div class="scheda-section-title">Risorse di Classe</div>
                    <div class="scheda-hd-table">${resItems.join('')}</div>
                </div>`;
            }
        }

        // Resistenze & Immunità
        const resistenzeHtml = (pg.resistenze && pg.resistenze.length > 0) ?
            pg.resistenze.map(r => `<span class="scheda-tag">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';
        const immunitaHtml = (pg.immunita && pg.immunita.length > 0) ?
            pg.immunita.map(r => `<span class="scheda-tag scheda-tag-imm">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';

        // Conditions (excluding concentrazione which is shown separately)
        const conditionsActive = ALL_CONDITIONS.filter(c => c.key !== 'concentrazione' && pg[c.key]);
        const conditionsHtml = conditionsActive.length > 0 ?
            conditionsActive.map(c => `<span class="condition-badge active">${c.label}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';
        const isConcentrating = !!pg.concentrazione;

        // Check if spellcaster
        const hasSpellSlots = pg.slot_incantesimo && typeof pg.slot_incantesimo === 'object' && Object.keys(pg.slot_incantesimo).length > 0;

        content.innerHTML = `
        <div class="scheda-identity">
            <div class="scheda-name">${escapeHtml(pg.nome)}</div>
            <div class="scheda-subtitle">${escapeHtml(classeDisplay)}</div>
            <div class="scheda-subtitle-sm">${[pg.razza, pg.background].filter(Boolean).map(s => escapeHtml(s)).join(' · ')}</div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title">Caratteristiche e Tiri Salvezza</div>
            <div class="scheda-abilities">${abilitiesHtml}</div>
        </div>

        <div class="scheda-three-boxes">
            <div class="scheda-box editable">
                <input type="number" class="scheda-box-input" value="${pg.classe_armatura || 10}" data-field="classe_armatura" data-pgid="${pg.id}">
                <div class="scheda-box-label">CA</div>
            </div>
            <div class="scheda-box editable">
                <input type="number" class="scheda-box-input" value="${initDisplay}" data-field="iniziativa" data-pgid="${pg.id}">
                <div class="scheda-box-label">Iniziativa</div>
            </div>
            <div class="scheda-box editable">
                <input type="number" class="scheda-box-input" value="${pg.velocita || 9}" step="1.5" data-field="velocita" data-pgid="${pg.id}">
                <div class="scheda-box-label">Velocità</div>
            </div>
        </div>

        <div class="scheda-hp-section">
            <div class="scheda-hp-left">
                <div class="scheda-hp-pair">
                    <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalcLive('${pg.id}','punti_vita_max')">
                        <div class="scheda-hp-display" id="schedaPvMax">${pg.punti_vita_max || 10}</div>
                        <div class="scheda-hp-label">PV Massimi</div>
                    </div>
                    <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalcLive('${pg.id}','pv_attuali')">
                        <div class="scheda-hp-display pv-current" id="schedaPvAttuali">${pvAttuali}</div>
                        <div class="scheda-hp-label">PV Attuali</div>
                    </div>
                </div>
            </div>
            <div class="scheda-hp-right clickable" onclick="schedaOpenHpCalcLive('${pg.id}','pv_temporanei')">
                <div class="scheda-hp-display" id="schedaPvTemp">${pg.pv_temporanei || 0}</div>
                <div class="scheda-hp-label">PV Temporanei</div>
            </div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title">Abilità</div>
            <div class="scheda-skills" id="schedaSkillsList">${skillsHtml}</div>
            <div class="scheda-perc-passiva">
                <span class="scheda-perc-val" id="sPercPassiva">${percPassiva}</span>
                <span class="scheda-perc-label">Percezione Passiva</span>
            </div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title">Dadi Vita - Disponibili</div>
            ${hitDiceHtml || '<span class="scheda-empty">-</span>'}
        </div>

        ${classResourcesHtml}

        <div class="scheda-section">
            <div class="scheda-section-title">
                Resistenze e Immunità
                <button class="scheda-edit-btn" onclick="schedaOpenResImmEdit('${pg.id}')" title="Modifica">&#9998;</button>
            </div>
            <div class="scheda-res-imm-display" id="schedaResImmDisplay">
                <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Resistenze</span><div class="scheda-tags">${resistenzeHtml}</div></div>
                <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Immunità</span><div class="scheda-tags">${immunitaHtml}</div></div>
            </div>
            <div id="schedaResImmEditGrid" style="display:none;"></div>
        </div>

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

        ${(pg.talenti && pg.talenti.length > 0) ? `
        <div class="scheda-section">
            <div class="scheda-section-title">Talenti</div>
            <div class="scheda-tags">${pg.talenti.map(t => `<span class="scheda-tag">${escapeHtml(t)}</span>`).join('')}</div>
        </div>` : ''}

        `;

        // Wire up editable inputs
        content.querySelectorAll('.scheda-ability-input').forEach(input => {
            input.addEventListener('input', () => {
                const field = input.dataset.field;
                const val = Math.max(1, Math.min(30, parseInt(input.value) || 10));
                schedaDebouncedSave(pg.id, field, val);
                schedaRecalcAbility(field, val, pg.id);
            });
        });

        content.querySelectorAll('.scheda-box-input, .scheda-hp-input').forEach(input => {
            input.addEventListener('input', () => {
                const field = input.dataset.field;
                let val = field === 'velocita' ? parseFloat(input.value) || 0 : parseInt(input.value) || 0;
                schedaDebouncedSave(pg.id, field, val);
            });
        });

        const backBtn = document.getElementById('schedaBackBtn');
        if (backBtn) backBtn.onclick = () => navigateToPage('personaggi');

        schedaSetActiveTab('scheda');
        schedaWireTabBar(pg.id);

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
    const saveMod = m + (isSaveProf ? bonusComp : 0);
    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
    const saveEl = document.getElementById(`sSave_${abilityKey}`);
    if (saveEl) saveEl.textContent = saveStr;

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
    const saveMod = m + (isProf ? bonusComp : 0);
    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;

    const saveEl = document.querySelector(`.scheda-ability-save[data-save="${abilityKey}"]`);
    if (saveEl) {
        saveEl.classList.toggle('proficient', isProf);
        saveEl.querySelector('.scheda-save-dot').textContent = isProf ? '●' : '○';
        saveEl.querySelector('.scheda-save-val').textContent = saveStr;
    }
    schedaInstantSave(pgId, { tiri_salvezza: saves });
}

window.schedaToggleSkillProf = async function(pgId, skillKey, evt) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const skills = [...(pg.competenze_abilita || [])];
    const idx = skills.indexOf(skillKey);
    if (idx >= 0) skills.splice(idx, 1); else skills.push(skillKey);
    pg.competenze_abilita = skills;

    schedaRefreshSkill(pg, skillKey);
    if (evt && evt.target) setTimeout(() => evt.target.blur(), 0);
    schedaInstantSave(pgId, { competenze_abilita: skills });
}

window.schedaToggleSkillExpert = async function(pgId, skillKey, evt) {
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
    if (evt && evt.target) setTimeout(() => evt.target.blur(), 0);
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

    const spellAbilities = [];
    classi.forEach(c => {
        const ab = CLASS_SPELL_ABILITY[c.nome];
        if (ab && !spellAbilities.find(s => s.ability === ab)) {
            const val = pg[ab] || 10;
            const m = Math.floor((val - 10) / 2);
            spellAbilities.push({ classe: c.nome, ability: ab, mod: m });
        }
    });

    const spellStatsHtml = spellAbilities.length > 0 ? spellAbilities.map(sa => {
        const atkBonus = sa.mod + bonusComp;
        const dc = 8 + bonusComp + sa.mod;
        const atkStr = atkBonus >= 0 ? `+${atkBonus}` : `${atkBonus}`;
        const modStr = sa.mod >= 0 ? `+${sa.mod}` : `${sa.mod}`;
        return `
        <div class="scheda-spell-stats-row">
            <div class="scheda-box"><div class="scheda-box-val">${modStr}</div><div class="scheda-box-label">Car. (${sa.ability.substring(0,3).toUpperCase()})</div></div>
            <div class="scheda-box"><div class="scheda-box-val">${atkStr}</div><div class="scheda-box-label">Attacco Inc.</div></div>
            <div class="scheda-box"><div class="scheda-box-val">${dc}</div><div class="scheda-box-label">CD Inc.</div></div>
        </div>`;
    }).join('') : '<p class="scheda-empty">Nessuna classe incantatrice</p>';

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

    const classeDisplay = classi.map(c => c.nome + (c.livello ? ' ' + c.livello : '')).join(' / ') || pg.classe || '';

    content.innerHTML = `
    <div class="scheda-identity">
        <div class="scheda-name">${escapeHtml(pg.nome)}</div>
        <div class="scheda-subtitle">${escapeHtml(classeDisplay)}</div>
        <div class="scheda-subtitle-sm">${[pg.razza, pg.background].filter(Boolean).map(s => escapeHtml(s)).join(' · ')}</div>
    </div>
    <div class="scheda-section">
        <div class="scheda-section-title">Statistiche Incantatore</div>
        ${spellStatsHtml}
    </div>
    <div class="scheda-section">
        <div class="scheda-section-title">Slot Incantesimo</div>
        <div class="scheda-slots-table">${slotsHtml}</div>
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

function schedaSetActiveTab(tab) {
    const mainTab = document.getElementById('schedaTabMain');
    const spellTab = document.getElementById('schedaTabSpell');
    if (mainTab) mainTab.classList.toggle('active', tab === 'scheda');
    if (spellTab) spellTab.classList.toggle('active', tab === 'incantesimi');
}

function schedaWireTabBar(pgId) {
    const mainTab = document.getElementById('schedaTabMain');
    const spellTab = document.getElementById('schedaTabSpell');
    if (mainTab) mainTab.onclick = () => renderSchedaPersonaggio(pgId);
    if (spellTab) spellTab.onclick = () => schedaOpenSpellPage(pgId);
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

    const isDirectEdit = field === 'punti_vita_max' || field === 'pv_temporanei';
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
    const campagnaId = _hpCalcState?.campagnaId;
    const sessioneId = _hpCalcState?.sessioneId;
    _hpCalcState = null;
    _hpCalcClosedAt = Date.now();
    if (wasMonster && campagnaId && sessioneId) {
        await renderCombattimentoContent(campagnaId, sessioneId);
    }
}

window.schedaToggleConcentrazione = async function(pgId, el) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const isActive = el.classList.contains('active');
    await supabase.from('personaggi').update({ concentrazione: !isActive, updated_at: new Date().toISOString() }).eq('id', pgId);
    el.classList.toggle('active');
    if (_schedaPgCache) _schedaPgCache.concentrazione = !isActive;
};

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

window.openPersonaggioModal = function(personaggioId) {
    editingPersonaggioId = personaggioId || null;
    const form = elements.personaggioForm;
    if (!form) return;

    form.reset();
    pgSelectedClasses = [];
    pgCurrentSkillProficiencies = new Set();
    pgCurrentSkillExpertise = new Set();
    pgCurrentResistenze = [];
    pgCurrentImmunita = [];
    pgCurrentSlotIncantesimo = {};
    pgCurrentTalenti = [];
    pgRenderClassi();
    pgWizardGoTo(0);

    const razzaBtn = document.getElementById('pgRazzaBtn');
    const razzaInput = document.getElementById('pgRazza');
    if (razzaBtn) razzaBtn.textContent = 'Seleziona razza...';
    if (razzaInput) razzaInput.value = '';
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
                    const bgVal = data.background || '';
                    document.getElementById('pgBackground').value = bgVal;
                    const bBtn = document.getElementById('pgBackgroundBtn');
                    if (bBtn) bBtn.textContent = bgVal || 'Seleziona background...';

                    if (data.classi && Array.isArray(data.classi) && data.classi.length > 0) {
                        pgSelectedClasses = data.classi.map(c => ({ nome: c.nome, livello: c.livello || 1, thirdCaster: !!c.thirdCaster }));
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

    const pgData = {
        nome: document.getElementById('pgNome').value.trim(),
        razza: document.getElementById('pgRazza').value || null,
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

    try {
        if (editingPersonaggioId) {
            const { error } = await supabase
                .from('personaggi')
                .update(pgData)
                .eq('id', editingPersonaggioId);
            if (error) throw error;
            showNotification('Personaggio aggiornato');
        } else {
            pgData.user_id = userData.id;
            const { error } = await supabase
                .from('personaggi')
                .insert(pgData);
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
    let html = '';
    _microSelectedClasses.forEach((c, i) => {
        html += `
        <div class="pg-classe-row">
            <div class="pg-classe-header">
                <span class="pg-classe-name">${escapeHtml(c.nome)}</span>
                <button type="button" class="pg-classe-remove" onclick="microRemoveClass(${i})">✕</button>
            </div>
            <div class="pg-classe-lv-controls">
                <span class="pg-classe-lv-label">Lv.</span>
                <button type="button" class="pg-classe-lv-btn" onclick="microClassLevelChange(${i},-1)">−</button>
                <span class="pg-classe-lv-val">${c.livello}</span>
                <button type="button" class="pg-classe-lv-btn" onclick="microClassLevelChange(${i},1)">+</button>
            </div>
        </div>`;
    });
    const available = DND_CLASSES.filter(cls => !_microSelectedClasses.some(s => s.nome === cls));
    if (available.length > 0) {
        html += `<button type="button" class="custom-select-trigger" onclick="microOpenClasseSelect()">+ Aggiungi classe</button>`;
    }
    container.innerHTML = html;
    microUpdateTotalLevel();
}

function microUpdateTotalLevel() {
    const total = _microSelectedClasses.reduce((s, c) => s + c.livello, 0);
    const field = document.getElementById('microLivello');
    if (field) field.value = total;
}

window.microOpenClasseSelect = function() {
    const available = DND_CLASSES.filter(cls => !_microSelectedClasses.some(s => s.nome === cls));
    const classOptions = available.map(c => ({ value: c, label: c }));
    openCustomSelect(classOptions, (value) => {
        _microSelectedClasses.push({ nome: value, livello: 1 });
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
                        _microSelectedClasses = data.classi.map(c => ({ nome: c.nome, livello: c.livello || 1 }));
                    } else if (data.classe) {
                        _microSelectedClasses = [{ nome: data.classe, livello: data.livello || 1 }];
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

    const pgData = {
        nome,
        classe: classeDisplay,
        classi: _microSelectedClasses,
        livello: totalLevel,
        punti_vita_max: pvMax,
        pv_attuali: pvMax,
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

    const isConcentrating = !!pg.concentrazione;
    const conditionsActive = ALL_CONDITIONS.filter(c => c.key !== 'concentrazione' && pg[c.key]);
    const conditionsHtml = conditionsActive.length > 0 ?
        conditionsActive.map(c => `<span class="condition-badge active">${c.label}</span>`).join('') :
        '<span class="scheda-empty">Nessuna</span>';

    const resistenze = pg.resistenze || [];
    const immunita = pg.immunita || [];
    let resImmHtml = '';
    if (resistenze.length > 0 || immunita.length > 0) {
        const resHtml = resistenze.length > 0 ?
            `<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Resistenze</span><div class="scheda-tags">${resistenze.map(r => `<span class="condition-badge">${escapeHtml(r)}</span>`).join('')}</div></div>` : '';
        const immHtml = immunita.length > 0 ?
            `<div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Immunità</span><div class="scheda-tags">${immunita.map(r => `<span class="condition-badge">${escapeHtml(r)}</span>`).join('')}</div></div>` : '';
        resImmHtml = `<div class="scheda-section"><div class="scheda-section-title">Resistenze e Immunità</div>${resHtml}${immHtml}</div>`;
    }

    const slots = pg.slot_incantesimo || {};
    let slotsHtml = '';
    const sortedLevels = Object.keys(slots).map(Number).filter(l => l > 0 && slots[l]?.max > 0).sort((a, b) => a - b);
    const slotItems = sortedLevels.map(lv => {
        const s = slots[lv];
        const used = Math.min(s.max, s.used != null ? s.used : 0);
        return `
        <div class="scheda-slot-block">
            <div class="scheda-slot-level">${lv}°</div>
            <div class="scheda-slot-controls">
                <button type="button" class="scheda-hd-btn" onclick="microSlotChange('${pg.id}',${lv},-1,${s.max})">−</button>
                <span class="scheda-hd-val">${used}/${s.max}</span>
                <button type="button" class="scheda-hd-btn" onclick="microSlotChange('${pg.id}',${lv},1,${s.max})">+</button>
            </div>
        </div>`;
    }).join('');
    slotsHtml = `<div class="scheda-section">
        <div class="scheda-section-title">Slot Incantesimo <button class="scheda-edit-btn" onclick="microOpenSlotConfig('${pg.id}')" title="Configura">&#9998;</button></div>
        ${slotItems ? `<div class="scheda-slots-grid">${slotItems}</div>` : '<span class="scheda-empty">Nessuno slot configurato</span>'}
    </div>`;

    const tabBar = document.getElementById('schedaTabBar');
    if (tabBar) tabBar.style.display = 'none';

    content.innerHTML = `
    <div class="scheda-identity">
        <div class="scheda-name">${escapeHtml(pg.nome)}</div>
        <div class="scheda-subtitle">${escapeHtml(classeDisplay)}</div>
        <div class="scheda-subtitle-sm">${[pg.razza, pg.background].filter(Boolean).map(s => escapeHtml(s)).join(' · ')}</div>
    </div>

    <div class="scheda-three-boxes">
        <div class="scheda-box">
            <input type="number" class="scheda-ability-input" value="${initDisplay}" data-field="iniziativa" style="width:48px;text-align:center;font-size:1.3rem;font-weight:700;">
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
        <div class="scheda-section-title">Dadi Vita - Disponibili</div>
        ${hitDiceHtml || '<span class="scheda-empty">-</span>'}
    </div>

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

    content.querySelectorAll('.scheda-ability-input').forEach(input => {
        input.addEventListener('input', () => {
            const field = input.dataset.field;
            const val = parseInt(input.value) || 0;
            schedaDebouncedSave(pg.id, field, val);
        });
    });
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
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('slot_incantesimo').eq('id', pgId).single();
    const slots = pg?.slot_incantesimo || {};
    if (!slots[level]) slots[level] = { max, used: 0 };
    const current = slots[level].used || 0;
    slots[level].used = Math.max(0, Math.min(max, current + delta));
    await supabase.from('personaggi').update({ slot_incantesimo: slots, updated_at: new Date().toISOString() }).eq('id', pgId);
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
            <input type="number" min="0" max="20" value="${maxVal}" id="microSlotMax_${lv}" class="form-control" style="width:60px;text-align:center;">
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
