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
    compendio: { src: 'js/Compendio/compendio.js', ready: 'loadCompendio' },
    laboratorio: { src: 'js/Laboratorio/laboratorio.js', ready: 'labBackToHub', init: 'initLaboratorio' },
};

const _runtimeDataPromises = new Map();
const _runtimeScriptPromises = new Map();
let _contentLocalizationPromise = null;

const DATA_LOADER_APP_ROOT_URL = (() => {
    const scriptHref = document.currentScript?.src || Array.from(document.scripts).find(script => {
        try {
            return new URL(script.src, window.location.href).pathname.endsWith('/js/Core/data-loader.js');
        } catch (_) {
            return false;
        }
    })?.src;
    if (scriptHref) {
        const url = new URL(scriptHref, window.location.href);
        url.pathname = url.pathname.replace(/js\/Core\/data-loader\.js$/, '');
        url.search = '';
        url.hash = '';
        return url.toString();
    }

    const manifestHref = document.querySelector('link[rel="manifest"]')?.href;
    if (manifestHref) {
        const url = new URL(manifestHref, window.location.href);
        url.pathname = url.pathname.replace(/(?:assets\/)?manifest(?:-[^/]+)?\.json$/, '');
        url.search = '';
        url.hash = '';
        return url.toString();
    }

    return `${window.location.origin}/`;
})();

function _appAssetUrl(src) {
    return new URL(src, DATA_LOADER_APP_ROOT_URL).toString();
}

function _runtimeDataReady(bundle) {
    return bundle.globals.every(name => typeof window[name] !== 'undefined');
}

function _findRuntimeDataScript(src) {
    return Array.from(document.scripts).find(script => {
        const url = new URL(script.src, window.location.href);
        return url.pathname.endsWith(`/${src}`);
    });
}

function ensureContentLocalization() {
    if (typeof window.localizeRuntimeDataBundle === 'function') {
        return Promise.resolve();
    }
    if (_contentLocalizationPromise) return _contentLocalizationPromise;

    _contentLocalizationPromise = new Promise((resolve, reject) => {
        const src = 'js/Core/content-localization.js';
        const finish = () => {
            if (typeof window.localizeRuntimeDataBundle === 'function') {
                resolve();
                return;
            }
            reject(new Error('Modulo di localizzazione contenuti incompleto'));
        };

        const existing = _findRuntimeDataScript(src);
        if (existing) {
            existing.addEventListener('load', finish, { once: true });
            existing.addEventListener('error', () => reject(new Error(`Caricamento localizzazione fallito: ${src}`)), { once: true });
            // Uno script gia' eseguito non emettera' un nuovo evento load.
            setTimeout(finish, 0);
            return;
        }

        const script = document.createElement('script');
        script.src = _appAssetUrl(`${src}?v=20260712B`);
        script.async = true;
        script.dataset.contentLocalization = 'true';
        script.onload = finish;
        script.onerror = () => reject(new Error(`Caricamento localizzazione fallito: ${src}`));
        document.head.appendChild(script);
    }).catch(error => {
        console.warn('[content-localization]', error);
    }).finally(() => {
        _contentLocalizationPromise = null;
    });

    return _contentLocalizationPromise;
}

function _localizedBundleValues(key, bundle) {
    const values = bundle.globals.map(name => window[name]);
    return ensureContentLocalization().then(() => {
        try {
            window.localizeRuntimeDataBundle?.(key);
        } catch (error) {
            console.warn(`[content-localization] Normalizzazione bundle fallita (${key}):`, error);
        }
        return values;
    });
}

function ensureRuntimeData(key) {
    const bundle = RUNTIME_DATA_BUNDLES[key];

    if (!bundle) {
        return Promise.reject(new Error(`Runtime data bundle sconosciuto: ${key}`));
    }

    if (_runtimeDataReady(bundle)) {
        return _localizedBundleValues(key, bundle);
    }

    if (_runtimeDataPromises.has(key)) {
        return _runtimeDataPromises.get(key);
    }

    const promise = new Promise((resolve, reject) => {
        const finish = () => {
            if (_runtimeDataReady(bundle)) {
                _localizedBundleValues(key, bundle).then(resolve, reject);
                return;
            }

            reject(new Error(`Runtime data bundle incompleto: ${key}`));
        };

        const existing = _findRuntimeDataScript(bundle.src);
        if (existing) {
            existing.addEventListener('load', finish, { once: true });
            existing.addEventListener('error', () => reject(new Error(`Caricamento dati fallito: ${bundle.src}`)), { once: true });
            setTimeout(() => {
                if (_runtimeDataReady(bundle)) finish();
            }, 0);
            return;
        }

        const script = document.createElement('script');
        script.src = _appAssetUrl(bundle.src);
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
        return ensureContentLocalization();
    }

    if (_runtimeScriptPromises.has(key)) {
        return _runtimeScriptPromises.get(key);
    }

    const promise = new Promise((resolve, reject) => {
        const finish = () => {
            if (_runtimeScriptReady(bundle)) {
                _initRuntimeScript(bundle);
                ensureContentLocalization().then(resolve, reject);
                return;
            }

            reject(new Error(`Runtime script incompleto: ${key}`));
        };

        const existing = _findRuntimeDataScript(bundle.src);
        if (existing) {
            existing.addEventListener('load', finish, { once: true });
            existing.addEventListener('error', () => reject(new Error(`Caricamento script fallito: ${bundle.src}`)), { once: true });
            setTimeout(() => {
                if (_runtimeScriptReady(bundle)) finish();
            }, 0);
            return;
        }

        const script = document.createElement('script');
        script.src = _appAssetUrl(bundle.src);
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

// Avvia presto la normalizzazione: corregge anche testi statici gia' presenti
// nell'HTML e contenuti aggiunti successivamente da render legacy.
ensureContentLocalization();

window.RUNTIME_DATA_BUNDLES = RUNTIME_DATA_BUNDLES;
window.ensureRuntimeData = ensureRuntimeData;
window.RUNTIME_SCRIPT_BUNDLES = RUNTIME_SCRIPT_BUNDLES;
window.ensureRuntimeScript = ensureRuntimeScript;
window.ensureContentLocalization = ensureContentLocalization;
