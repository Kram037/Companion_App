// Estrae i veleni dal file di testo veleni.pdf (estratto come testo)
// e produce risorse/veleni/veleni.json con struttura { meta, items: [...] }.
// Esegui: node "risorse/veleni/extract_veleni_to_json.js"

const fs = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, 'veleni.txt');
const DEST = path.join(__dirname, 'veleni.json');

function slugify(s) {
    return s.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/['’]/g, '-')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function rarityFromPrice(gp) {
    if (gp >= 4000) return { en: 'Legendary',  it: 'Leggendario' };
    if (gp >= 1000) return { en: 'Very Rare',  it: 'Molto Raro'  };
    if (gp >= 500)  return { en: 'Rare',       it: 'Raro'        };
    if (gp >= 200)  return { en: 'Uncommon',   it: 'Non Comune'  };
    return                  { en: 'Common',    it: 'Comune'      };
}

const TIPO_IT = {
    'ingested': 'ingerito',
    'inhaled':  'inalato',
    'contact':  'contatto',
    'injury':   'ferita',
};
const CAT_IT = {
    'mixture':  'miscela',
    'toxin':    'tossina',
    'vegetal':  'vegetale',
    'venom':    'veleno animale',
};

const raw = fs.readFileSync(SRC, 'utf8');
const lines = raw.split(/\r?\n/);

const isNoise = (l) => {
    const s = l.trim();
    if (!s) return true;
    if (/^DnD 5 Poisons$/i.test(s)) return true;
    if (/^\d+\/\d+\/\d+,\s*\d+:\d+/.test(s)) return true;
    if (/^https?:\/\//i.test(s)) return true;
    if (/^-- \d+ of \d+ --$/.test(s)) return true;
    return false;
};

const cleaned = lines.filter(l => !isNoise(l)).map(l => l.replace(/\s+$/, ''));

const TYPE_RE   = /^\s*(ingested|inhaled|contact|injury)\s*\(\s*(mixture|toxin|vegetal|venom)\s*\)\s*-\s*(\d+)\s*gp\s*$/i;
const SOURCE_RE = /^(Recueil des poisons|Dungeon Master)/i;

const items = [];
let i = 0;
while (i < cleaned.length) {
    const nome = cleaned[i++];
    if (!nome || i >= cleaned.length) break;
    const tipoLine = cleaned[i];
    const tm = tipoLine && tipoLine.match(TYPE_RE);
    if (!tm) {
        // disallineamento - prova a saltare
        // console.warn('skip line non-type:', JSON.stringify(tipoLine));
        continue;
    }
    i++;
    const tipoEn = tm[1].toLowerCase();
    const catEn  = tm[2].toLowerCase();
    const prezzo = parseInt(tm[3], 10);

    const desc = [];
    while (i < cleaned.length && !SOURCE_RE.test(cleaned[i]) && !TYPE_RE.test(cleaned[i])) {
        desc.push(cleaned[i++]);
    }
    let fonte = '';
    if (i < cleaned.length && SOURCE_RE.test(cleaned[i])) {
        fonte = cleaned[i++];
    }

    const rar = rarityFromPrice(prezzo);
    const id = slugify(nome);

    items.push({
        id,
        nome,
        nome_it: '',
        tipo: 'Veleno',
        sotto_tipo: tipoEn,
        sotto_tipo_it: TIPO_IT[tipoEn] || tipoEn,
        categoria: catEn,
        categoria_it: CAT_IT[catEn] || catEn,
        prezzo_mo: prezzo,
        rarita: rar.en,
        rarita_it: rar.it,
        sintonia: '',
        sintonia_it: '',
        descrizione: desc.join('\n').trim(),
        descrizione_it: '',
        fonte: fonte.replace(/´/g, "'"),
    });
}

const out = {
    meta: {
        lingua: 'en+it',
        fonte_pdf: 'veleni.pdf',
        count: items.length,
        nota: "Veleni estratti da aidedd.org. I campi *_it contengono le traduzioni italiane (vuote se non ancora tradotte)."
    },
    items,
};

fs.writeFileSync(DEST, JSON.stringify(out, null, 2), 'utf8');
console.log('[extract_veleni_to_json] estratti:', items.length, 'veleni →', DEST);
console.log('  primi 5:', items.slice(0,5).map(it => it.nome).join(', '));
console.log('  ultimi 5:', items.slice(-5).map(it => it.nome).join(', '));
