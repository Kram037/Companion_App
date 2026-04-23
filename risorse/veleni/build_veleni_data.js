// Genera js/data/veleni_data.js a partire da risorse/veleni/veleni.json.
// Aggiunge i flag _nome_pending/_desc_pending per i campi non ancora tradotti.
// Esegui: node "risorse/veleni/build_veleni_data.js"

const fs = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, 'veleni.json');
const DEST = path.join(__dirname, '..', '..', 'js', 'data', 'veleni_data.js');

const json = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const items = (json.items || []).map(it => {
    const out = {
        id: it.id,
        nome_en: it.nome,
        nome_it: it.nome_it && it.nome_it.trim() ? it.nome_it : it.nome,
        _nome_pending: !it.nome_it || !it.nome_it.trim(),

        tipo: it.tipo || 'Veleno',
        sotto_tipo_en: it.sotto_tipo || '',
        sotto_tipo_it: it.sotto_tipo_it && it.sotto_tipo_it.trim() ? it.sotto_tipo_it : (it.sotto_tipo || ''),

        categoria_en: it.categoria || '',
        categoria_it: it.categoria_it && it.categoria_it.trim() ? it.categoria_it : (it.categoria || ''),

        prezzo_mo: it.prezzo_mo || 0,

        rarita_en: it.rarita || 'Comune',
        rarita_it: it.rarita_it && it.rarita_it.trim() ? it.rarita_it : (it.rarita || 'Comune'),

        descrizione_en: it.descrizione || '',
        descrizione_it: it.descrizione_it && it.descrizione_it.trim() ? it.descrizione_it : (it.descrizione || ''),
        _desc_pending: !it.descrizione_it || !it.descrizione_it.trim(),

        fonte: it.fonte || '',
    };
    return out;
});

const banner = `// AUTO-GENERATED da risorse/veleni/veleni.json (build_veleni_data.js)\n// NON modificare a mano: rigenera con \`node risorse/veleni/build_veleni_data.js\`.\n`;
const body = `window.VELENI_DATA = ${JSON.stringify(items, null, 2)};\n`;

fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, banner + body, 'utf8');

const totNomi = items.filter(i => !i._nome_pending).length;
const totDesc = items.filter(i => !i._desc_pending).length;
console.log('[build_veleni_data] scritto', DEST);
console.log('  voci totali:        ', items.length);
console.log('  nomi tradotti:      ', totNomi + '/' + items.length);
console.log('  descrizioni tradotte:', totDesc + '/' + items.length);
