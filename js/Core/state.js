// State Management
const AppState = {
    currentUser: null,
    currentPage: 'campagne',
    isLoggedIn: false,
    isRegisterMode: false,
    currentCampagnaId: null,
    currentSessioneId: null,
    currentPersonaggioId: null,
    cachedUserData: null,
    cachedRazze: null,
    cachedBackground: null,
    cachedHomebrewSottoclassi: null,
    cachedHomebrewOggetti: null
};

// Gli script classici condividono ancora questo compatibility layer.
window.AppState = AppState;

// DOM Elements - will be initialized in init()
let elements = {};

// Carica il modulo PF max quando gli helper legacy della scheda sono pronti.
(function registerPfMaxModifiersLoader() {
    if (window.__pfMaxModifiersLoaderRegistered) return;
    window.__pfMaxModifiersLoaderRegistered = true;

    function loadPfMaxModifiersModule() {
        if (window.__pfMaxModifiersFeatureLoaded) return;
        if (document.querySelector('script[data-pf-max-modifiers]')) return;

        const ready = typeof window.schedaOpenHpCalcLive === 'function'
            && typeof window.schedaOpenHpCalc === 'function';
        if (!ready) {
            setTimeout(loadPfMaxModifiersModule, 120);
            return;
        }

        const script = document.createElement('script');
        script.src = 'js/Personaggi/personaggi-pf-max-modifiers.js?v=20260712A';
        script.dataset.pfMaxModifiers = 'true';
        script.onload = () => {
            try {
                if (typeof window.schedaUpdateHpDisplays === 'function' && typeof _schedaPgCache !== 'undefined' && _schedaPgCache) {
                    window.schedaUpdateHpDisplays(_schedaPgCache);
                }
            } catch (_) {}
        };
        script.onerror = () => console.warn('[pf-max] Impossibile caricare il modulo modificatori PF max');
        document.head.appendChild(script);
    }

    if (document.readyState === 'complete') {
        setTimeout(loadPfMaxModifiersModule, 0);
    } else {
        window.addEventListener('load', () => setTimeout(loadPfMaxModifiersModule, 0), { once: true });
        setTimeout(loadPfMaxModifiersModule, 1800);
    }
})();
