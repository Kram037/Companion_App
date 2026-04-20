// ============================================================================
// PERSONAGGI MANAGEMENT
// ============================================================================

let editingPersonaggioId = null;
let pgWizardCurrentStep = 0;
let pgSelectedClasses = [];
let pgSelectedEquipment = [];
let _pgRaceSkills = [];
let _pgBgSkills = [];
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

// Talenti from PHB, XGtE, TCoE
const DND_TALENTI = [
    // PHB
    { nome: 'Abile', fonte: 'PHB' },
    { nome: 'Adepto Elementale', fonte: 'PHB' },
    { nome: 'Adepto Marziale', fonte: 'PHB' },
    { nome: 'Aggressore Selvaggio', fonte: 'PHB' },
    { nome: 'Allerta', fonte: 'PHB' },
    { nome: 'Appostato', fonte: 'PHB' },
    { nome: 'Atleta', fonte: 'PHB' },
    { nome: 'Attore', fonte: 'PHB' },
    { nome: 'Carica', fonte: 'PHB' },
    { nome: 'Cecchino Magico', fonte: 'PHB' },
    { nome: 'Combattente a Due Armi', fonte: 'PHB' },
    { nome: 'Combattente in Sella', fonte: 'PHB' },
    { nome: 'Condottiero Ispiratore', fonte: 'PHB' },
    { nome: 'Corazze Leggere', fonte: 'PHB' },
    { nome: 'Corazze Medie', fonte: 'PHB' },
    { nome: 'Corazze Pesanti', fonte: 'PHB' },
    { nome: 'Duellante Difensivo', fonte: 'PHB' },
    { nome: 'Esperto di Balestre', fonte: 'PHB' },
    { nome: 'Esperto di Dungeon', fonte: 'PHB' },
    { nome: 'Fortunato', fonte: 'PHB' },
    { nome: 'Guaritore', fonte: 'PHB' },
    { nome: 'Incantatore da Guerra', fonte: 'PHB' },
    { nome: 'Incantatore Rituale', fonte: 'PHB' },
    { nome: 'Iniziato alla Magia', fonte: 'PHB' },
    { nome: 'Linguista', fonte: 'PHB' },
    { nome: 'Lottatore', fonte: 'PHB' },
    { nome: 'Lottatore da Taverna', fonte: 'PHB' },
    { nome: 'Maestro d\'Armi', fonte: 'PHB' },
    { nome: 'Maestro d\'Armi Possenti', fonte: 'PHB' },
    { nome: 'Maestro degli Scudi', fonte: 'PHB' },
    { nome: 'Maestro delle Armature Medie', fonte: 'PHB' },
    { nome: 'Maestro delle Armature Pesanti', fonte: 'PHB' },
    { nome: 'Maestro delle Armi su Asta', fonte: 'PHB' },
    { nome: 'Mente Acuta', fonte: 'PHB' },
    { nome: 'Mobilità', fonte: 'PHB' },
    { nome: 'Osservatore', fonte: 'PHB' },
    { nome: 'Resiliente', fonte: 'PHB' },
    { nome: 'Robusto', fonte: 'PHB' },
    { nome: 'Sentinella', fonte: 'PHB' },
    { nome: 'Sterminatore di Maghi', fonte: 'PHB' },
    { nome: 'Tenace', fonte: 'PHB' },
    { nome: 'Tiratore Scelto', fonte: 'PHB' },
    // XGtE
    { nome: 'Agilità Tarchiata', fonte: 'XGtE' },
    { nome: 'Alta Magia Drow', fonte: 'XGtE' },
    { nome: 'Costituzione Infernale', fonte: 'XGtE' },
    { nome: 'Fiamme di Flegesto', fonte: 'XGtE' },
    { nome: 'Fortuna Generosa', fonte: 'XGtE' },
    { nome: 'Furia Orchesca', fonte: 'XGtE' },
    { nome: 'Magia degli Elfi dei Boschi', fonte: 'XGtE' },
    { nome: 'Paura Draconica', fonte: 'XGtE' },
    { nome: 'Pelle di Drago', fonte: 'XGtE' },
    { nome: 'Precisione Elfica', fonte: 'XGtE' },
    { nome: 'Prodigio', fonte: 'XGtE' },
    { nome: 'Scomparire', fonte: 'XGtE' },
    { nome: 'Seconda Possibilità', fonte: 'XGtE' },
    { nome: 'Teletrasporto Fatato', fonte: 'XGtE' },
    { nome: 'Tempra Nanica', fonte: 'XGtE' },
    // TCoE
    { nome: 'Abilità Impeccabile', fonte: 'TCoE' },
    { nome: 'Adepto di Metamagia', fonte: 'TCoE' },
    { nome: 'Adepto Occulto', fonte: 'TCoE' },
    { nome: 'Bisturi da Battaglia', fonte: 'TCoE' },
    { nome: 'Contaminazione Fatata', fonte: 'TCoE' },
    { nome: 'Contaminazione Ombrosa', fonte: 'TCoE' },
    { nome: 'Cuoco', fonte: 'TCoE' },
    { nome: 'Maestria dei Veleni', fonte: 'TCoE' },
    { nome: 'Martello Vivente', fonte: 'TCoE' },
    { nome: 'Pistolero', fonte: 'TCoE' },
    { nome: 'Rudimenti da Artefice', fonte: 'TCoE' },
    { nome: 'Rudimenti da Guerriero', fonte: 'TCoE' },
    { nome: 'Stile Penetrante', fonte: 'TCoE' },
    { nome: 'Telecinesi', fonte: 'TCoE' },
    { nome: 'Telepatia', fonte: 'TCoE' }
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

            _pgRaceSkills.forEach(s => pgCurrentSkillProficiencies.delete(s));
            _pgRaceResistances.forEach(r => { const i = pgCurrentResistenze.indexOf(r); if (i >= 0) pgCurrentResistenze.splice(i, 1); });
            _pgRaceSkills = [];
            _pgRaceResistances = [];

            const data = getRaceData(value);
            if (data) {
                const velField = document.getElementById('pgVelocita');
                if (velField) velField.value = data.velocita || 9;
                if (data.resistenze && data.resistenze.length > 0) {
                    _pgRaceResistances = [...data.resistenze];
                    data.resistenze.forEach(r => { if (!pgCurrentResistenze.includes(r)) pgCurrentResistenze.push(r); });
                }
                if (data.competenze_abilita && data.competenze_abilita.length > 0) {
                    _pgRaceSkills = [...data.competenze_abilita];
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

            _pgBgSkills.forEach(s => pgCurrentSkillProficiencies.delete(s));
            _pgBgSkills = [];

            const data = getBackgroundData(value);
            if (data && data.competenze_abilita && data.competenze_abilita.length > 0) {
                _pgBgSkills = [...data.competenze_abilita];
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

function calcSpellSlotsFromClassi(classi) {
    let totalCasterLevel = 0;
    let hasPactMagic = false;
    let pactLevel = 0;

    classi.forEach(cls => {
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
    'Warlock': [
        { nome: 'Slot del Patto', perLivello: [0,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2], fromLevel: 1 }
    ],
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
                <div class="scheda-ability-input clickable" id="sAbil_${a.key}" data-field="${a.key}" data-pgid="${pg.id}" onclick="schedaOpenAbilityCalc('${pg.id}','${a.key}')">${val}</div>
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
            });
        }
        const customRes = classResources._custom || [];
        customRes.forEach((cr, i) => {
            const current = cr.current != null ? cr.current : cr.max;
            const label = cr.tipo === 'dadi' ? `${escapeHtml(cr.nome)} <small>(${cr.dado})</small>` : escapeHtml(cr.nome);
            resItems.push(`<div class="scheda-hd-row">
                <span class="scheda-hd-total">${label}
                    <button class="scheda-custom-res-del" onclick="schedaDeleteCustomRes('${pg.id}',${i})" title="Rimuovi">✕</button>
                </span>
                <div class="scheda-hd-avail">
                    <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},-1,${cr.max})">−</button>
                    <span class="scheda-hd-val" id="sCusRes_${i}">${current}</span>
                    <span class="scheda-hd-max">/ ${cr.max}</span>
                    <button class="scheda-hd-btn" onclick="schedaCustomResChange('${pg.id}',${i},${current},1,${cr.max})">+</button>
                </div>
            </div>`);
        });
        classResourcesHtml = `<div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Risorse di Classe
                <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenAddCustomRes('${pg.id}')" title="Aggiungi risorsa">+</button>
            </div>
            <div class="scheda-section-body">
            ${resItems.length > 0 ? `<div class="scheda-hd-table">${resItems.join('')}</div>` : '<span class="scheda-empty">Nessuna risorsa</span>'}
            </div>
        </div>`;

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
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Caratteristiche e Tiri Salvezza</div>
            <div class="scheda-section-body">
                <div class="scheda-abilities">${abilitiesHtml}</div>
            </div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Statistiche</div>
            <div class="scheda-section-body">
                <div class="scheda-three-boxes">
                    <div class="scheda-box clickable" onclick="schedaOpenStatCalc('${pg.id}','classe_armatura')">
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

        <div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Dadi Vita</div>
            <div class="scheda-section-body">
                ${hitDiceHtml || '<span class="scheda-empty">-</span>'}
            </div>
        </div>

        ${classResourcesHtml}

        <div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">
                Resistenze e Immunità
                <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenResImmEdit('${pg.id}')" title="Modifica">&#9998;</button>
            </div>
            <div class="scheda-section-body">
                <div class="scheda-res-imm-display" id="schedaResImmDisplay">
                    <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Resistenze</span><div class="scheda-tags">${resistenzeHtml}</div></div>
                    <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Immunità</span><div class="scheda-tags">${immunitaHtml}</div></div>
                </div>
                <div id="schedaResImmEditGrid" style="display:none;"></div>
            </div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">Condizioni</div>
            <div class="scheda-section-body">
                <div class="scheda-concentrazione-row">
                    <button type="button" class="scheda-concentrazione-btn ${isConcentrating ? 'active' : ''}" onclick="schedaToggleConcentrazione('${pg.id}',this)">Concentrazione</button>
                </div>
                <div class="scheda-tags" style="margin-top:8px;">${conditionsHtml}</div>
                <div class="scheda-condition-extra">
                    <span>Esaustione: <strong>${pg.esaustione || 0}</strong>/6</span>
                </div>
                <button type="button" class="btn-secondary btn-small" style="margin-top:8px;" onclick="openConditionsModal('${pg.id}')">Modifica stato</button>
            </div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title" onclick="schedaToggleSection(this)">
                Talenti
                <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenTalentiEdit('${pg.id}')" title="Modifica">&#9998;</button>
            </div>
            <div class="scheda-section-body">
                <div class="scheda-tags" id="schedaTalentiDisplay">${(pg.talenti && pg.talenti.length > 0) ?
                    pg.talenti.map(t => `<span class="scheda-tag">${escapeHtml(t)}</span>`).join('') :
                    '<span class="scheda-empty">Nessun talento</span>'}</div>
            </div>
        </div>

        ${buildEquipSection(pg)}

        ${buildLangProfSection(pg)}

        `;

        // Wire up editable inputs
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

    const cantripsHtml = buildCantripsSection(pg);

    content.innerHTML = `
    <div class="scheda-identity">
        <div class="scheda-name">${escapeHtml(pg.nome)}</div>
        <div class="scheda-subtitle">${escapeHtml(classeDisplay)}</div>
        <div class="scheda-subtitle-sm">${[pg.razza, pg.background].filter(Boolean).map(s => escapeHtml(s)).join(' · ')}</div>
    </div>
    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Statistiche Incantatore</div>
        <div class="scheda-section-body">${spellStatsHtml}</div>
    </div>
    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Slot Incantesimo</div>
        <div class="scheda-section-body">
            <div class="scheda-slots-table">${slotsHtml}</div>
        </div>
    </div>
    ${cantripsHtml}
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

window.schedaToggleSection = function(titleEl) {
    const section = titleEl.closest('.scheda-section');
    if (section) section.classList.toggle('collapsed');
};

/* ── Spells / Trucchetti ── */
function _spellsData() { return window.SPELLS_DATA || {}; }

function _pgSpellClasses(pg) {
    const out = new Set();
    (pg.classi || []).forEach(c => { if (c?.nome) out.add(c.nome); });
    if (pg.classe) out.add(pg.classe);
    return out;
}

function _spellMatchesPg(spell, pgClasses) {
    if (!pgClasses.size) return true;
    const list = spell.classes || [];
    for (const c of list) if (pgClasses.has(c)) return true;
    return false;
}

function buildCantripsSection(pg) {
    const all = _spellsData();
    const known = (pg.incantesimi_conosciuti || []).filter(n => all[n] && all[n].level === 0);
    const cards = known.length > 0 ? known.map(n => {
        const sp = all[n];
        return `<div class="spell-card" onclick="schedaShowSpellDetail('${escapeAttr(n)}')">
            <div class="spell-card-name">${escapeHtml(sp.name)}</div>
            <div class="spell-card-meta">${escapeHtml(sp.school_it || sp.school)} · ${escapeHtml(sp.casting_time)} · ${escapeHtml(sp.range)}</div>
        </div>`;
    }).join('') : '<span class="scheda-empty">Nessun trucchetto scelto</span>';

    return `<div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">
            Trucchetti
            <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenCantripsPicker('${pg.id}')" title="Scegli trucchetti">+</button>
        </div>
        <div class="scheda-section-body">
            <div class="spell-cards-grid">${cards}</div>
        </div>
    </div>`;
}

function escapeAttr(s) { return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

window.schedaShowSpellDetail = function(spellName) {
    const sp = _spellsData()[spellName];
    if (!sp) return;
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const lvlText = sp.level === 0 ? 'Trucchetto' : `Livello ${sp.level}`;
    overlay.innerHTML = `<div class="hp-calc-modal spell-detail-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 class="spell-detail-name">${escapeHtml(sp.name)}</h3>
        <div class="spell-detail-sub">${lvlText} · ${escapeHtml(sp.school_it || sp.school)}</div>
        <div class="spell-detail-meta">
            <div><span class="spell-meta-label">Tempo</span><span>${escapeHtml(sp.casting_time)}</span></div>
            <div><span class="spell-meta-label">Gittata</span><span>${escapeHtml(sp.range)}</span></div>
            <div><span class="spell-meta-label">Componenti</span><span>${escapeHtml(sp.components)}</span></div>
            <div><span class="spell-meta-label">Durata</span><span>${escapeHtml(sp.duration)}</span></div>
        </div>
        <div class="spell-detail-desc">${escapeHtml(sp.description).replace(/\n/g,'<br>')}</div>
        <div class="spell-detail-classes">${(sp.classes || []).map(c => `<span class="scheda-tag">${escapeHtml(c)}</span>`).join('')}</div>
        ${sp.source ? `<div class="spell-detail-source">${escapeHtml(sp.source)}</div>` : ''}
    </div>`;
    document.body.appendChild(overlay);
};

window.schedaOpenCantripsPicker = function(pgId) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const all = _spellsData();
    const pgClasses = _pgSpellClasses(pg);
    const known = new Set(pg.incantesimi_conosciuti || []);

    const cantrips = Object.values(all).filter(s => s.level === 0);
    cantrips.sort((a, b) => a.name.localeCompare(b.name));

    const matching = cantrips.filter(s => _spellMatchesPg(s, pgClasses));
    const others = cantrips.filter(s => !_spellMatchesPg(s, pgClasses));

    const renderRow = (sp) => {
        const isKnown = known.has(sp.name);
        const safeName = escapeAttr(sp.name);
        return `<label class="spell-pick-row">
            <input type="checkbox" class="spell-pick-cb" data-name="${safeName}" ${isKnown ? 'checked' : ''}>
            <div class="spell-pick-info" onclick="event.preventDefault();schedaShowSpellDetail('${safeName}')">
                <div class="spell-pick-name">${escapeHtml(sp.name)}</div>
                <div class="spell-pick-meta">${escapeHtml(sp.school_it || sp.school)} · ${(sp.classes || []).join(', ')}</div>
            </div>
        </label>`;
    };

    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal spell-picker-modal">
        <button class="modal-close" onclick="this.closest('.hp-calc-overlay').remove()">&times;</button>
        <h3 style="margin-bottom:6px;">Trucchetti</h3>
        <input type="text" id="spellPickerSearch" class="hp-calc-input" placeholder="Cerca…" style="margin-bottom:10px;">
        <div class="spell-picker-list" id="spellPickerList">
            ${matching.length > 0 ? `<div class="spell-pick-group-title">Disponibili per la tua classe</div>${matching.map(renderRow).join('')}` : ''}
            ${others.length > 0 ? `<div class="spell-pick-group-title">Altri</div>${others.map(renderRow).join('')}` : ''}
            ${cantrips.length === 0 ? '<p class="scheda-empty">Nessun trucchetto disponibile</p>' : ''}
        </div>
        <div class="dialog-actions">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
            <button class="btn-primary" onclick="schedaSaveCantrips('${pgId}')">Salva</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);

    const search = document.getElementById('spellPickerSearch');
    if (search) {
        search.addEventListener('input', () => {
            const q = search.value.toLowerCase().trim();
            overlay.querySelectorAll('.spell-pick-row').forEach(r => {
                const txt = r.textContent.toLowerCase();
                r.style.display = !q || txt.includes(q) ? '' : 'none';
            });
        });
    }
};

window.schedaSaveCantrips = async function(pgId) {
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const checked = Array.from(document.querySelectorAll('.spell-pick-cb:checked')).map(cb => cb.dataset.name);
    pg.incantesimi_conosciuti = checked;
    await supabase.from('personaggi').update({ incantesimi_conosciuti: checked }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenSpellPage(pgId);
};

/* ── Inventario Tab ── */
const COIN_TYPES = [
    { key: 'pp', label: 'Platino (PP)', icon: '◆' },
    { key: 'mo', label: 'Oro (MO)', icon: '●' },
    { key: 'ma', label: 'Argento (MA)', icon: '○' },
    { key: 'mr', label: 'Rame (MR)', icon: '·' },
    { key: 'me', label: 'Electrum (ME)', icon: '◇' }
];

window.schedaOpenInventoryPage = async function(pgId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: pg } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
    if (!pg) return;
    _schedaPgCache = pg;

    const monete = pg.monete || {};
    const coinsHtml = COIN_TYPES.map(c => {
        const val = monete[c.key] || 0;
        return `<div class="inv-coin-cell inv-coin-${c.key}">
            <div class="inv-coin-abbr">${c.key.toUpperCase()}</div>
            <input type="text" inputmode="none" readonly
                class="inv-coin-input"
                id="invCoin_${c.key}"
                value="${val}"
                data-coin="${c.key}"
                data-pgid="${pgId}"
                onclick="invOpenCoinKeypad(this)">
            <div class="inv-coin-name">${c.label.split(' ')[0]}</div>
        </div>`;
    }).join('');

    const oggetti = pg.inventario || [];
    const oggettiRows = oggetti.length > 0 ? oggetti.map((o, i) => {
        return `<div class="inv-item-row">
            <div class="inv-item-name">${escapeHtml(o.nome || 'Oggetto')}${o.magico ? ' <span class="inv-magic-badge">✦</span>' : ''}</div>
            <div class="inv-item-qty">×${o.quantita || 1}</div>
            <div class="inv-item-actions">
                <button class="scheda-hd-btn" onclick="invEditItem('${pgId}',${i})">✎</button>
                <button class="scheda-custom-res-del" onclick="invRemoveItem('${pgId}',${i})">✕</button>
            </div>
        </div>`;
    }).join('') : '<span class="scheda-empty">Nessun oggetto</span>';

    const sintonia = pg.sintonia || [];
    const maxSintonia = 3;
    let sintoniaHtml = '';
    for (let i = 0; i < maxSintonia; i++) {
        const item = sintonia[i] || null;
        sintoniaHtml += `<div class="inv-attune-slot ${item ? 'filled' : 'empty'}" onclick="invEditAttune('${pgId}',${i})">
            <span class="inv-attune-icon">◈</span>
            <span class="inv-attune-name">${item ? escapeHtml(item) : 'Slot vuoto'}</span>
            ${item ? `<button class="scheda-custom-res-del" onclick="event.stopPropagation();invRemoveAttune('${pgId}',${i})">✕</button>` : ''}
        </div>`;
    }

    content.innerHTML = `
    <div class="scheda-identity">
        <div class="scheda-name">${escapeHtml(pg.nome)}</div>
        <div class="scheda-subtitle-sm">Inventario</div>
    </div>

    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Monete</div>
        <div class="scheda-section-body">
            <div class="inv-coins-grid">${coinsHtml}</div>
        </div>
    </div>

    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Oggetti
            <button class="scheda-edit-btn" onclick="event.stopPropagation();invAddItem('${pgId}')" title="Aggiungi">+</button>
        </div>
        <div class="scheda-section-body">
            <div id="invItemsList">${oggettiRows}</div>
        </div>
    </div>

    <div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Sintonia</div>
        <div class="scheda-section-body">
            <div class="inv-attune-grid">${sintoniaHtml}</div>
        </div>
    </div>
    `;

    schedaSetActiveTab('inventario');
    schedaWireTabBar(pgId);
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
        await supabase.from('personaggi').update({ monete }).eq('id', pgId);
        inputEl.removeEventListener('change', onChange);
    };
    inputEl.addEventListener('change', onChange);
};

window.invAddItem = function(pgId) {
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal" style="width:320px;">
        <h3 style="margin-bottom:12px;font-size:1rem;">Nuovo Oggetto</h3>
        <input type="text" id="invItemNome" class="hp-calc-input" placeholder="Nome oggetto" style="margin-bottom:8px;">
        <input type="text" id="invItemDesc" class="hp-calc-input" placeholder="Descrizione (opzionale)" style="margin-bottom:8px;">
        <div style="display:flex;gap:8px;margin-bottom:8px;">
            <input type="number" id="invItemQty" class="hp-calc-input" value="1" min="1" style="flex:1;">
            <label style="display:flex;align-items:center;gap:4px;color:var(--text-secondary);font-size:0.85rem;white-space:nowrap;">
                <input type="checkbox" id="invItemMagic"> Magico
            </label>
        </div>
        <div class="dialog-actions">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
            <button class="btn-primary" onclick="invSaveNewItem('${pgId}')">Aggiungi</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('invItemNome')?.focus(), 100);
};

window.invSaveNewItem = async function(pgId) {
    const nome = document.getElementById('invItemNome')?.value?.trim();
    if (!nome) return;
    const desc = document.getElementById('invItemDesc')?.value?.trim() || '';
    const qty = parseInt(document.getElementById('invItemQty')?.value) || 1;
    const magico = document.getElementById('invItemMagic')?.checked || false;
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    inventario.push({ nome, descrizione: desc, quantita: qty, magico });
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

window.invEditItem = function(pgId, idx) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const item = (pg.inventario || [])[idx];
    if (!item) return;
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal" style="width:320px;">
        <h3 style="margin-bottom:12px;font-size:1rem;">Modifica Oggetto</h3>
        <input type="text" id="invItemNome" class="hp-calc-input" value="${escapeHtml(item.nome || '')}" placeholder="Nome" style="margin-bottom:8px;">
        <input type="text" id="invItemDesc" class="hp-calc-input" value="${escapeHtml(item.descrizione || '')}" placeholder="Descrizione" style="margin-bottom:8px;">
        <div style="display:flex;gap:8px;margin-bottom:8px;">
            <input type="number" id="invItemQty" class="hp-calc-input" value="${item.quantita || 1}" min="1" style="flex:1;">
            <label style="display:flex;align-items:center;gap:4px;color:var(--text-secondary);font-size:0.85rem;white-space:nowrap;">
                <input type="checkbox" id="invItemMagic" ${item.magico ? 'checked' : ''}> Magico
            </label>
        </div>
        <div class="dialog-actions">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
            <button class="btn-primary" onclick="invUpdateItem('${pgId}',${idx})">Salva</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
};

window.invUpdateItem = async function(pgId, idx) {
    const nome = document.getElementById('invItemNome')?.value?.trim();
    if (!nome) return;
    const desc = document.getElementById('invItemDesc')?.value?.trim() || '';
    const qty = parseInt(document.getElementById('invItemQty')?.value) || 1;
    const magico = document.getElementById('invItemMagic')?.checked || false;
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    inventario[idx] = { nome, descrizione: desc, quantita: qty, magico };
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
};

window.invRemoveItem = async function(pgId, idx) {
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const inventario = pg.inventario ? [...pg.inventario] : [];
    inventario.splice(idx, 1);
    pg.inventario = inventario;
    await supabase.from('personaggi').update({ inventario }).eq('id', pgId);
    schedaOpenInventoryPage(pgId);
};

window.invEditAttune = function(pgId, idx) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const current = (pg.sintonia || [])[idx] || '';
    const overlay = document.createElement('div');
    overlay.className = 'hp-calc-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="hp-calc-modal" style="width:300px;">
        <h3 style="margin-bottom:12px;font-size:1rem;">Sintonia – Slot ${idx + 1}</h3>
        <input type="text" id="invAttuneName" class="hp-calc-input" value="${escapeHtml(current)}" placeholder="Nome oggetto a sintonia">
        <div class="dialog-actions">
            <button class="btn-secondary" onclick="this.closest('.hp-calc-overlay').remove()">Annulla</button>
            <button class="btn-primary" onclick="invSaveAttune('${pgId}',${idx})">Salva</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('invAttuneName')?.focus(), 100);
};

window.invSaveAttune = async function(pgId, idx) {
    const nome = document.getElementById('invAttuneName')?.value?.trim() || '';
    const supabase = getSupabaseClient();
    const pg = _schedaPgCache;
    if (!supabase || !pg) return;
    const sintonia = pg.sintonia ? [...pg.sintonia] : [null, null, null];
    while (sintonia.length < 3) sintonia.push(null);
    sintonia[idx] = nome || null;
    pg.sintonia = sintonia;
    await supabase.from('personaggi').update({ sintonia }).eq('id', pgId);
    document.querySelector('.hp-calc-overlay')?.remove();
    schedaOpenInventoryPage(pgId);
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

function schedaSetActiveTab(tab) {
    const mainTab = document.getElementById('schedaTabMain');
    const spellTab = document.getElementById('schedaTabSpell');
    const invTab = document.getElementById('schedaTabInventory');
    if (mainTab) mainTab.classList.toggle('active', tab === 'scheda');
    if (spellTab) spellTab.classList.toggle('active', tab === 'incantesimi');
    if (invTab) invTab.classList.toggle('active', tab === 'inventario');
}

function schedaWireTabBar(pgId) {
    const mainTab = document.getElementById('schedaTabMain');
    const spellTab = document.getElementById('schedaTabSpell');
    const invTab = document.getElementById('schedaTabInventory');
    if (mainTab) mainTab.onclick = () => renderSchedaPersonaggio(pgId);
    if (spellTab) spellTab.onclick = () => schedaOpenSpellPage(pgId);
    if (invTab) invTab.onclick = () => schedaOpenInventoryPage(pgId);
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

// Talenti Edit on Scheda
window.schedaOpenTalentiEdit = function(pgId) {
    const pg = _schedaPgCache;
    const currentTalenti = pg?.talenti ? [...pg.talenti] : [];

    const selectedHtml = currentTalenti.map((t, i) => `
        <div class="pg-talento-item selected">
            <span class="pg-talento-name">${escapeHtml(t)}</span>
            <button type="button" class="pg-talento-remove" onclick="schedaTalentoRemove(${i})">✕</button>
        </div>
    `).join('');

    const available = DND_TALENTI.filter(t => !currentTalenti.includes(t.nome));
    const listHtml = available.map(t => `
        <div class="pg-talento-item" onclick="schedaTalentoAdd('${escapeHtml(t.nome)}')">
            <span class="pg-talento-name">${escapeHtml(t.nome)}</span>
            <span class="option-source">(${t.fonte})</span>
        </div>
    `).join('');

    const modalHtml = `
    <div class="modal active" id="schedaTalentiModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="schedaCloseTalentiEdit()">&times;</button>
            <h2>Modifica Talenti</h2>
            <div class="wizard-page-scroll" id="schedaTalentiContent">
                ${selectedHtml ? `<div class="form-section-label">Selezionati</div><div class="pg-talenti-selected">${selectedHtml}</div>` : ''}
                <div class="form-section-label">Disponibili</div>
                <div class="pg-talenti-available">${listHtml}</div>
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

    const selectedHtml = talenti.map((t, i) => `
        <div class="pg-talento-item selected">
            <span class="pg-talento-name">${escapeHtml(t)}</span>
            <button type="button" class="pg-talento-remove" onclick="schedaTalentoRemove(${i})">✕</button>
        </div>
    `).join('');

    const available = DND_TALENTI.filter(t => !talenti.includes(t.nome));
    const listHtml = available.map(t => `
        <div class="pg-talento-item" onclick="schedaTalentoAdd('${escapeHtml(t.nome)}')">
            <span class="pg-talento-name">${escapeHtml(t.nome)}</span>
            <span class="option-source">(${t.fonte})</span>
        </div>
    `).join('');

    container.innerHTML = `
        ${selectedHtml ? `<div class="form-section-label">Selezionati</div><div class="pg-talenti-selected">${selectedHtml}</div>` : ''}
        <div class="form-section-label">Disponibili</div>
        <div class="pg-talenti-available">${listHtml}</div>
    `;
}

window.schedaCloseTalentiEdit = function() {
    const m = document.getElementById('schedaTalentiModal');
    if (m) m.remove();
    document.body.style.overflow = '';
    window._schedaTalentiEditPgId = null;
    window._schedaTalentiEditList = null;
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
    const campagnaId = _hpCalcState?.campagnaId;
    const sessioneId = _hpCalcState?.sessioneId;
    _hpCalcState = null;
    _hpCalcClosedAt = Date.now();
    if (wasMonster && campagnaId && sessioneId) {
        await renderCombattimentoContent(campagnaId, sessioneId);
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

window.schedaOpenAddCustomRes = function(pgId) {
    const modalHtml = `
    <div class="modal active" id="customResModal">
        <div class="modal-content">
            <button class="modal-close" onclick="schedaCloseCustomResModal()">&times;</button>
            <h2>Aggiungi Risorsa</h2>
            <div class="form-group">
                <label class="form-label">Nome della risorsa</label>
                <input type="text" id="customResNome" class="form-input" placeholder="Es. Dadi di Superiorità">
            </div>
            <div class="form-group">
                <label class="form-label">Tipo</label>
                <div class="custom-res-type-row">
                    <button type="button" class="btn-secondary custom-res-type-btn active" id="crTypePunti" onclick="schedaCrTypeSelect('punti')">Punti</button>
                    <button type="button" class="btn-secondary custom-res-type-btn" id="crTypeDadi" onclick="schedaCrTypeSelect('dadi')">Dadi</button>
                </div>
            </div>
            <div class="form-group" id="crDadoGroup" style="display:none;">
                <label class="form-label">Tipo di dado</label>
                <div class="custom-res-dice-row">
                    ${['d4','d6','d8','d10','d12','d20'].map(d =>
                        `<button type="button" class="btn-secondary custom-res-dice-btn ${d === 'd8' ? 'active' : ''}" onclick="schedaCrDadoSelect('${d}')">${d}</button>`
                    ).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Utilizzi massimi</label>
                <input type="number" id="customResMax" class="form-input" min="1" value="1" inputmode="none" readonly onclick="pgOpenAbilityKeypad(this)">
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="schedaCloseCustomResModal()">Annulla</button>
                <button type="button" class="btn-primary" onclick="schedaConfirmCustomRes('${pgId}')">Aggiungi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    window._crType = 'punti';
    window._crDado = 'd8';
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

window.schedaConfirmCustomRes = async function(pgId) {
    const nome = document.getElementById('customResNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome', 'error'); return; }
    const max = parseInt(document.getElementById('customResMax')?.value) || 1;
    const tipo = window._crType || 'punti';
    const newRes = { nome, tipo, max, current: max };
    if (tipo === 'dadi') newRes.dado = window._crDado || 'd8';

    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    if (!pg.risorse_classe._custom) pg.risorse_classe._custom = [];
    pg.risorse_classe._custom.push(newRes);

    await schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
    schedaCloseCustomResModal();

    if (pg.tipo_scheda === 'micro') {
        renderMicroScheda(pgId);
    } else {
        renderSchedaPersonaggio(pgId);
    }
    showNotification('Risorsa aggiunta');
}

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
    return `<div class="scheda-section">
        <div class="scheda-section-title" onclick="schedaToggleSection(this)">Equipaggiamento
            <button class="scheda-edit-btn" onclick="event.stopPropagation();schedaOpenAddEquip('${pg.id}')" title="Aggiungi">+</button>
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
        ${!armiRows && !armaturaRows ? '<span class="scheda-empty">Nessun equipaggiamento</span>' : ''}
        </div>
    </div>`;
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
    return lines;
}

window.schedaOpenAddEquip = function(pgId) {
    const ARMA_CATS = {
        'semplice_mischia': 'Armi da Mischia Semplici',
        'semplice_distanza': 'Armi a Distanza Semplici',
        'guerra_mischia': 'Armi da Mischia da Guerra',
        'guerra_distanza': 'Armi a Distanza da Guerra'
    };
    const armiHtml = Object.entries(ARMA_CATS).map(([cat, label]) => {
        const items = DND_ARMI.filter(a => a.cat === cat).map(a =>
            `<div class="pg-talento-item" onclick="schedaAddArma('${pgId}','${escapeHtml(a.nome)}')">
                <span class="pg-talento-name">${escapeHtml(a.nome)}</span>
                <span class="option-source">${a.danni} ${a.tipo_danno}</span>
            </div>`
        ).join('');
        return `<div class="form-section-label">${label}</div>${items}`;
    }).join('');

    const armatureHtml = ['leggera','media','pesante','scudo'].map(cat => {
        const label = cat === 'scudo' ? 'Scudi' : `Armature ${cat.charAt(0).toUpperCase() + cat.slice(1)}${cat === 'leggera' ? '' : cat === 'media' ? '' : ''}`;
        const items = DND_ARMATURE.filter(a => a.cat === cat).map(a =>
            `<div class="pg-talento-item" onclick="schedaAddArmatura('${pgId}','${escapeHtml(a.nome)}')">
                <span class="pg-talento-name">${escapeHtml(a.nome)}</span>
                <span class="option-source">CA ${a.ca_base}</span>
            </div>`
        ).join('');
        return `<div class="form-section-label">${label}</div>${items}`;
    }).join('');

    const modalHtml = `
    <div class="modal active" id="equipModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="document.getElementById('equipModal')?.remove();document.body.style.overflow=''">&times;</button>
            <h2>Aggiungi Equipaggiamento</h2>
            <div class="wizard-page-scroll">
                <div class="form-section-label" style="font-size:1.1rem;margin-bottom:4px;">Armi</div>
                ${armiHtml}
                <div class="form-section-label" style="font-size:1.1rem;margin-top:16px;margin-bottom:4px;">Armature</div>
                ${armatureHtml}
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="document.getElementById('equipModal')?.remove();document.body.style.overflow=''">Chiudi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

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
    const isArma = e.tipo === 'arma';

    const modalHtml = `
    <div class="modal active" id="editEquipModal">
        <div class="modal-content">
            <button class="modal-close" onclick="document.getElementById('editEquipModal')?.remove();document.body.style.overflow=''">&times;</button>
            <h2>${formatEquipName(e)}</h2>
            ${e.proprieta ? `<p style="font-size:0.8rem;color:var(--text-light);margin-bottom:12px;">${e.proprieta.join(', ')}</p>` : ''}
            <div class="form-group">
                <label class="form-label">Bonus Magico</label>
                <div class="custom-res-dice-row">
                    ${[0,1,2,3].map(b =>
                        `<button type="button" class="btn-secondary custom-res-dice-btn ${b === currentBonus ? 'active' : ''}" onclick="schedaSetMagicBonus('${pgId}',${index},${b})">${b === 0 ? 'No' : '+' + b}</button>`
                    ).join('')}
                </div>
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="document.getElementById('editEquipModal')?.remove();document.body.style.overflow=''">Chiudi</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

window.schedaSetMagicBonus = async function(pgId, index, bonus) {
    const pg = _schedaPgCache;
    if (!pg?.equipaggiamento?.[index]) return;
    const e = pg.equipaggiamento[index];
    const oldBonus = e.magic_bonus || 0;
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
    document.getElementById('editEquipModal')?.remove();
    document.body.style.overflow = '';
    renderSchedaPersonaggio(pgId);
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
        toolSectionsHtml += `<div class="form-section-label" style="margin-top:16px;">${escapeHtml(groupName)}</div><div class="scheda-checkbox-grid">${items}</div>`;
    }

    const modalHtml = `
    <div class="modal active" id="langProfModal">
        <div class="modal-content modal-content-lg">
            <button class="modal-close" onclick="schedaCloseLangProfEdit()">&times;</button>
            <h2>Linguaggi e Competenze</h2>
            <div class="wizard-page-scroll">
                <div class="form-section-label">Linguaggi</div>
                <div class="scheda-checkbox-grid">${langCheckboxes}</div>
                ${toolSectionsHtml}
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
function autoPopulateLinguaggi(razzaNome) {
    const raceData = getRaceData(razzaNome);
    if (!raceData) return ['Comune'];
    return raceData.linguaggi && raceData.linguaggi.length > 0 ? [...raceData.linguaggi] : ['Comune'];
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
    pgSelectedEquipment = [];
    _pgRaceSkills = [];
    _pgBgSkills = [];
    _pgRaceResistances = [];
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
        linguaggi: autoPopulateLinguaggi(document.getElementById('pgRazza').value),
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
    const chipsHtml = _microSelectedClasses.map((c, i) => {
        const subLabel = THIRD_CASTER_SUBCLASSES[c.nome];
        const subCheck = subLabel ? `
            <label class="pg-subclass-check">
                <input type="checkbox" ${c.thirdCaster ? 'checked' : ''} onchange="microToggleThirdCaster(${i}, this.checked)">
                <span>${subLabel}</span>
            </label>` : '';
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
            ${subCheck}
        </div>`;
    }).join('');

    const addBtn = `<button type="button" class="pg-add-class-btn" onclick="microOpenClasseSelect()">
        <span class="pg-add-class-plus">+</span> Aggiungi classe
    </button>`;
    container.innerHTML = chipsHtml + addBtn;
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

window.microToggleThirdCaster = function(index, checked) {
    _microSelectedClasses[index].thirdCaster = checked;
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
                        _microSelectedClasses = data.classi.map(c => ({ nome: c.nome, livello: c.livello || 1, thirdCaster: !!c.thirdCaster }));
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
    const microCustomRes = microClassRes._custom || [];
    microCustomRes.forEach((cr, i) => {
        const current = cr.current != null ? cr.current : cr.max;
        const label = cr.tipo === 'dadi' ? `${escapeHtml(cr.nome)} <small>(${cr.dado})</small>` : escapeHtml(cr.nome);
        microResItems.push(`<div class="scheda-hd-row">
            <span class="scheda-hd-total">${label}
                <button class="scheda-custom-res-del" onclick="schedaDeleteCustomRes('${pg.id}',${i})" title="Rimuovi">✕</button>
            </span>
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
            <button class="scheda-edit-btn" onclick="schedaOpenAddCustomRes('${pg.id}')" title="Aggiungi risorsa">+</button>
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
