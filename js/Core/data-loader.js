// ============================================================================
// RUNTIME DATA LOADER
// ============================================================================

const RUNTIME_DATA_BUNDLES = {
    backgrounds: { src: 'js/Personaggi/data/backgrounds_data.js', globals: ['BACKGROUNDS_DATA'] },
    classes: { src: 'js/Personaggi/data/classes_data.js', globals: ['CLASSES_DATA'] },
    feats: { src: 'js/Personaggi/data/feats_data.js', globals: ['FEATS_DATA'] },
    fightingStyles: { src: 'js/Personaggi/data/fighting_styles_data.js', globals: ['FIGHTING_STYLES_DATA'] },
    invocations: { src: 'js/Personaggi/data/invocations_data.js', globals: ['INVOCATIONS_DATA'] },
    magicItems: { src: 'js/Personaggi/data/oggetti_magici_data.js', globals: ['OGGETTI_MAGICI_DATA'] },
    races: { src: 'js/Personaggi/data/races_data.js', globals: ['RACES_DATA'] },
    spells: { src: 'js/Personaggi/data/spells_data.js', globals: ['SPELLS_DATA'] },
    subclassSpells: { src: 'js/Personaggi/data/subclass_spells_data.js', globals: ['SUBCLASS_SPELLS_DATA'] },
    poisons: { src: 'js/Personaggi/data/veleni_data.js', globals: ['VELENI_DATA'] },
    equipment: {
        src: 'js/Compendio/data/equipaggiamento_data.js',
        globals: [
            'COMP_ADVENTURING_GEAR_DATA',
            'COMP_TOOLS_DATA',
            'COMP_HERBS_DATA',
            'COMP_METALS_DATA',
            'COMP_GEMS_DATA',
            'COMP_REALMS_GEMS_DATA',
        ],
    },
    monsters: { src: 'js/Compendio/data/mostri_data.js', globals: ['COMP_MONSTERS_DATA'] },
    summonStatblocks: { src: 'js/Compendio/data/summon_statblocks_data.js', globals: ['COMP_SUMMON_STATBLOCKS_DATA'] },
};

const RUNTIME_SCRIPT_BUNDLES = {
    laboratorio: { src: 'js/Laboratorio/laboratorio.js', ready: 'labBackToHub', init: 'initLaboratorio' },
};

const _runtimeDataPromises = new Map();
const _runtimeScriptPromises = new Map();

function _runtimeDataReady(bundle) {
    return bundle.globals.every(name => typeof window[name] !== 'undefined');
}

function _findRuntimeDataScript(src) {
    return Array.from(document.scripts).find(script => {
        const url = new URL(script.src, window.location.href);
        return url.pathname.endsWith(`/${src}`);
    });
}

function ensureRuntimeData(key) {
    const bundle = RUNTIME_DATA_BUNDLES[key];

    if (!bundle) {
        return Promise.reject(new Error(`Runtime data bundle sconosciuto: ${key}`));
    }

    if (_runtimeDataReady(bundle)) {
        return Promise.resolve(bundle.globals.map(name => window[name]));
    }

    if (_runtimeDataPromises.has(key)) {
        return _runtimeDataPromises.get(key);
    }

    const promise = new Promise((resolve, reject) => {
        const finish = () => {
            if (_runtimeDataReady(bundle)) {
                resolve(bundle.globals.map(name => window[name]));
                return;
            }

            reject(new Error(`Runtime data bundle incompleto: ${key}`));
        };

        const existing = _findRuntimeDataScript(bundle.src);
        if (existing) {
            existing.addEventListener('load', finish, { once: true });
            existing.addEventListener('error', () => reject(new Error(`Caricamento dati fallito: ${bundle.src}`)), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = bundle.src;
        script.async = true;
        script.dataset.runtimeData = key;
        script.onload = finish;
        script.onerror = () => reject(new Error(`Caricamento dati fallito: ${bundle.src}`));
        document.head.appendChild(script);
    }).finally(() => {
        _runtimeDataPromises.delete(key);
    });

    _runtimeDataPromises.set(key, promise);
    return promise;
}

function _runtimeScriptReady(bundle) {
    return !bundle.ready || typeof window[bundle.ready] === 'function';
}

function _initRuntimeScript(bundle) {
    if (!bundle.init || typeof window[bundle.init] !== 'function') return;
    window[bundle.init]();
}

function ensureRuntimeScript(key) {
    const bundle = RUNTIME_SCRIPT_BUNDLES[key];

    if (!bundle) {
        return Promise.reject(new Error(`Runtime script sconosciuto: ${key}`));
    }

    if (_runtimeScriptReady(bundle)) {
        _initRuntimeScript(bundle);
        return Promise.resolve();
    }

    if (_runtimeScriptPromises.has(key)) {
        return _runtimeScriptPromises.get(key);
    }

    const promise = new Promise((resolve, reject) => {
        const finish = () => {
            if (_runtimeScriptReady(bundle)) {
                _initRuntimeScript(bundle);
                resolve();
                return;
            }

            reject(new Error(`Runtime script incompleto: ${key}`));
        };

        const existing = _findRuntimeDataScript(bundle.src);
        if (existing) {
            existing.addEventListener('load', finish, { once: true });
            existing.addEventListener('error', () => reject(new Error(`Caricamento script fallito: ${bundle.src}`)), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = bundle.src;
        script.async = true;
        script.dataset.runtimeScript = key;
        script.onload = finish;
        script.onerror = () => reject(new Error(`Caricamento script fallito: ${bundle.src}`));
        document.head.appendChild(script);
    }).finally(() => {
        _runtimeScriptPromises.delete(key);
    });

    _runtimeScriptPromises.set(key, promise);
    return promise;
}

window.RUNTIME_DATA_BUNDLES = RUNTIME_DATA_BUNDLES;
window.ensureRuntimeData = ensureRuntimeData;
window.RUNTIME_SCRIPT_BUNDLES = RUNTIME_SCRIPT_BUNDLES;
window.ensureRuntimeScript = ensureRuntimeScript;
