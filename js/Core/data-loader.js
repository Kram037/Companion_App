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
    combattimento: { src: 'js/Combattimento/combat.js', ready: 'renderCombattimentoContent' },
    compendio: { src: 'js/Compendio/compendio.js', ready: 'loadCompendio' },
    laboratorio: { src: 'js/Laboratorio/laboratorio.js', ready: 'labBackToHub', init: 'initLaboratorio' },
};

const _runtimeDataPromises = new Map();
const _runtimeScriptPromises = new Map();
let _contentLocalizationPromise = null;
let _sessionNavigationFixPromise = null;

function _runtimeDataReady(bundle) {
    return bundle.globals.every(name => typeof window[name] !== 'undefined');
}

function _findRuntimeDataScript(src) {
    return Array.from(document.scripts).find(script => {
        const url = new URL(script.src, window.location.href);
        return url.pathname.endsWith(`/${src}`);
    });
}

function _loadUtilityScript({ src, version, ready, datasetKey, label }) {
    if (typeof window[ready] !== 'undefined') {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const finish = () => {
            if (typeof window[ready] !== 'undefined') {
                resolve();
                return;
            }
            reject(new Error(`Modulo ${label} incompleto`));
        };

        const existing = _findRuntimeDataScript(src);
        if (existing) {
            existing.addEventListener('load', finish, { once: true });
            existing.addEventListener('error', () => reject(new Error(`Caricamento ${label} fallito: ${src}`)), { once: true });
            setTimeout(finish, 0);
            return;
        }

        const script = document.createElement('script');
        script.src = `${src}?v=${version}`;
        script.async = true;
        script.dataset[datasetKey] = 'true';
        script.onload = finish;
        script.onerror = () => reject(new Error(`Caricamento ${label} fallito: ${src}`));
        document.head.appendChild(script);
    }).catch(error => {
        console.warn(`[${label}]`, error);
    });
}

function ensureContentLocalization() {
    if (typeof window.localizeRuntimeDataBundle === 'function') {
        return Promise.resolve();
    }
    if (_contentLocalizationPromise) return _contentLocalizationPromise;

    _contentLocalizationPromise = _loadUtilityScript({
        src: 'js/Core/content-localization.js',
        version: '20260712B',
        ready: 'localizeRuntimeDataBundle',
        datasetKey: 'contentLocalization',
        label: 'content-localization',
    }).finally(() => {
        _contentLocalizationPromise = null;
    });

    return _contentLocalizationPromise;
}

function ensureSessionNavigationFix() {
    if (window.__sessionNavigationFixInstalled) {
        return Promise.resolve();
    }
    if (_sessionNavigationFixPromise) return _sessionNavigationFixPromise;

    _sessionNavigationFixPromise = _loadUtilityScript({
        src: 'js/Core/session-navigation-fix.js',
        version: '20260712A',
        ready: '__sessionNavigationFixRegistered',
        datasetKey: 'sessionNavigationFix',
        label: 'session-navigation-fix',
    }).finally(() => {
        _sessionNavigationFixPromise = null;
    });

    return _sessionNavigationFixPromise;
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
        return Promise.all([ensureContentLocalization(), ensureSessionNavigationFix()]).then(() => undefined);
    }

    if (_runtimeScriptPromises.has(key)) {
        return _runtimeScriptPromises.get(key);
    }

    const promise = new Promise((resolve, reject) => {
        const finish = () => {
            if (_runtimeScriptReady(bundle)) {
                _initRuntimeScript(bundle);
                Promise.all([ensureContentLocalization(), ensureSessionNavigationFix()]).then(() => resolve(), reject);
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

// Avvia presto i moduli di compatibilita': correggono testi statici/dinamici e
// garantiscono che la pagina sessione venga renderizzata da navigateToPage.
ensureContentLocalization();
ensureSessionNavigationFix();

window.RUNTIME_DATA_BUNDLES = RUNTIME_DATA_BUNDLES;
window.ensureRuntimeData = ensureRuntimeData;
window.RUNTIME_SCRIPT_BUNDLES = RUNTIME_SCRIPT_BUNDLES;
window.ensureRuntimeScript = ensureRuntimeScript;
window.ensureContentLocalization = ensureContentLocalization;
window.ensureSessionNavigationFix = ensureSessionNavigationFix;
