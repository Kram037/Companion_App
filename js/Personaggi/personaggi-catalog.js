// ============================================================================
// PERSONAGGI CATALOG
// ============================================================================

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
    'Nobile','Sapiente','Soldato',
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
