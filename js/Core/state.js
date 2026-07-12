// State Management
const AppState = {
    currentUser: null,
    currentPage: 'campagne',
    isLoggedIn: false,
    isRegisterMode: false,
    currentCampagnaId: null,
    currentSessioneId: null,
    currentPersonaggioId: null,
    currentCampagnaDetails: null,
    campagnaGiocatori: [],
    cachedUserData: null,
    cachedCampagne: null,
    cachedRazze: null,
    cachedBackground: null,
    cachedHomebrewSottoclassi: null,
    cachedHomebrewOggetti: null,
    campagneFilters: {
        searchText: '',
        tipologia: 'all',
        dm: 'all',
        soloPreferiti: false
    }
};

// CRITICAL: i `const` di top-level in script classici NON sono esposti su `window`
// in browser moderni. Lo facciamo esplicitamente per permettere ai check tipo
// `if (window.AppState) ...` (sparsi nel codice) di funzionare correttamente.
window.AppState = AppState;

// DOM Elements - will be initialized in init()
let elements = {};

// ============================================================================
// REALTIME / FETCHING UX GUARDS
// ============================================================================
// Questo blocco viene registrato qui, ma installato al DOMContentLoaded: state.js
// e' uno dei primi script caricati, quindi il listener parte prima di init.js.
// In questo modo le patch sono attive prima che init() lanci auth/refetch/realtime.
(function registerRealtimeUxGuards() {
    if (window.__realtimeUxGuardsRegistered) return;
    window.__realtimeUxGuardsRegistered = true;

    const GUARD_RETRY_MS = 700;
    const SECTION_SELECTOR = '.scheda-section, .scheda-subsection';
    const TITLE_SELECTOR = '.scheda-section-title, .scheda-subsection-title';
    const deferredJobs = new Map();
    const runningJobs = new Map();
    const queuedJobs = new Map();

    function activePageRoot() {
        return document.querySelector('.page.active') || document.body;
    }

    function textKey(text) {
        return String(text || '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function sectionKey(section) {
        if (!section) return '';
        const explicit = section.getAttribute('data-section-key');
        if (explicit) return `key:${explicit}`;
        const title = section.querySelector(TITLE_SELECTOR);
        const kind = section.classList.contains('scheda-subsection') ? 'sub' : 'section';
        return `${kind}:${textKey(title?.textContent || '')}`;
    }

    function captureRefreshUiState() {
        const root = activePageRoot();
        const sections = new Map();
        root.querySelectorAll(SECTION_SELECTOR).forEach((section) => {
            const key = sectionKey(section);
            if (!key || key.endsWith(':')) return;
            sections.set(key, section.classList.contains('collapsed'));
        });

        const scrollTargets = [];
        [
            document.getElementById('mainContent'),
            root,
            root.querySelector('.page-content'),
            document.getElementById('schedaContent'),
            document.getElementById('sessioneContent'),
            document.getElementById('combattimentoContent')
        ].forEach((el) => {
            if (el && !scrollTargets.some(item => item.el === el)) {
                scrollTargets.push({ el, top: el.scrollTop, left: el.scrollLeft });
            }
        });

        return {
            page: AppState.currentPage,
            campagnaId: AppState.currentCampagnaId,
            sessioneId: AppState.currentSessioneId,
            personaggioId: AppState.currentPersonaggioId,
            sections,
            scrollTargets,
            schedaTab: window._schedaCurrentTab || null
        };
    }

    function restoreRefreshUiState(snapshot) {
        if (!snapshot) return;
        if (snapshot.page !== AppState.currentPage) return;
        if (snapshot.campagnaId !== AppState.currentCampagnaId) return;
        if (snapshot.sessioneId !== AppState.currentSessioneId) return;
        if (snapshot.personaggioId !== AppState.currentPersonaggioId) return;

        const root = activePageRoot();
        root.querySelectorAll(SECTION_SELECTOR).forEach((section) => {
            const key = sectionKey(section);
            if (!snapshot.sections.has(key)) return;
            section.classList.toggle('collapsed', snapshot.sections.get(key));
        });

        // Ripristino morbido dello scroll: evita il salto visivo dopo refetch.
        requestAnimationFrame(() => {
            snapshot.scrollTargets.forEach(({ el, top, left }) => {
                if (!el || !document.contains(el)) return;
                try {
                    el.scrollTop = top;
                    el.scrollLeft = left;
                } catch (_) {}
            });
        });
    }

    function hasBlockingOverlay() {
        return !!document.querySelector([
            '.modal.active',
            '.hp-calc-overlay',
            '.ta-fs-overlay',
            '.campagne-filter-overlay',
            '.comp-filter-overlay',
            '.custom-select-overlay',
            '.multi-select-overlay',
            '#conditionsModal',
            '#schedaTalentiModal',
            '#combatMonsterFullModal.active',
            '#combatPlaceholderModal.active'
        ].join(','));
    }

    function hasFocusedEditable() {
        const el = document.activeElement;
        if (!el || el === document.body || el === document.documentElement) return false;
        if (el.closest?.('.modal.active, .hp-calc-overlay, .ta-fs-overlay')) return true;
        return el.matches?.('input:not([readonly]), textarea:not([readonly]), select, [contenteditable="true"]');
    }

    function isUiRefreshBlocked() {
        return hasBlockingOverlay() || hasFocusedEditable() || !!window.currentRollRequest;
    }

    window.isRealtimeUiRefreshBlocked = isUiRefreshBlocked;

    function compactArg(value) {
        if (value == null) return '';
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (Array.isArray(value)) return `[${value.slice(0, 3).map(compactArg).join(',')}]`;
        if (typeof value === 'object') {
            const stable = {};
            ['silent', 'skipRealtimeSetup', 'pushHistory', 'skipPageLoad'].forEach((k) => {
                if (Object.prototype.hasOwnProperty.call(value, k)) stable[k] = value[k];
            });
            return JSON.stringify(stable);
        }
        return typeof value;
    }

    function jobKey(name, args) {
        return `${name}:${Array.from(args).slice(0, 3).map(compactArg).join('|')}`;
    }

    function scheduleDeferred(name, original, ctx, args, opts) {
        const key = jobKey(name, args);
        if (deferredJobs.has(key)) {
            clearTimeout(deferredJobs.get(key));
        }
        const timer = setTimeout(() => {
            deferredJobs.delete(key);
            if (isUiRefreshBlocked()) {
                scheduleDeferred(name, original, ctx, args, opts);
                return;
            }
            runLatest(name, original, ctx, args, opts).catch((error) => {
                console.warn(`[realtime-guard] refresh differito fallito (${name}):`, error);
            });
        }, GUARD_RETRY_MS);
        deferredJobs.set(key, timer);
        return Promise.resolve(null);
    }

    async function runLatest(name, original, ctx, args, opts = {}) {
        const key = jobKey(name, args);
        if (opts.deferWhenBusy && isUiRefreshBlocked()) {
            return scheduleDeferred(name, original, ctx, args, opts);
        }

        if (runningJobs.has(key)) {
            queuedJobs.set(key, { name, original, ctx, args, opts });
            return runningJobs.get(key);
        }

        const snapshot = opts.preserveUi === false ? null : captureRefreshUiState();
        const promise = Promise.resolve()
            .then(() => original.apply(ctx, args))
            .finally(() => {
                runningJobs.delete(key);
                restoreRefreshUiState(snapshot);
                const queued = queuedJobs.get(key);
                if (queued) {
                    queuedJobs.delete(key);
                    setTimeout(() => {
                        runLatest(queued.name, queued.original, queued.ctx, queued.args, queued.opts)
                            .catch((error) => console.warn(`[realtime-guard] refresh accodato fallito (${queued.name}):`, error));
                    }, 0);
                }
            });

        runningJobs.set(key, promise);
        return promise;
    }

    function wrapWindowFunction(name, opts = {}) {
        const original = window[name];
        if (typeof original !== 'function' || original.__realtimeGuardWrapped) return false;
        const wrapped = function realtimeGuardWrappedFunction(...args) {
            return runLatest(name, original, this, args, opts);
        };
        wrapped.__realtimeGuardWrapped = true;
        wrapped.__realtimeGuardOriginal = original;
        window[name] = wrapped;
        return true;
    }

    function patchOpenPageHelpers() {
        if (typeof window.openSchedaPersonaggio === 'function' && !window.openSchedaPersonaggio.__realtimeGuardNoDoubleRender) {
            const patchedOpenScheda = async function(personaggioId, opts) {
                AppState.currentPersonaggioId = personaggioId;
                sessionStorage.setItem('currentPersonaggioId', personaggioId);
                if (opts && opts.scrollToStats) {
                    window._schedaPendingScrollToStats = true;
                }
                return navigateToPage('scheda');
            };
            patchedOpenScheda.__realtimeGuardNoDoubleRender = true;
            window.openSchedaPersonaggio = patchedOpenScheda;
        }

        if (typeof window.openSessionePage === 'function' && !window.openSessionePage.__realtimeGuardNoDoubleRender) {
            const patchedOpenSessione = async function(campagnaId) {
                AppState.currentCampagnaId = campagnaId;
                sessionStorage.setItem('currentCampagnaId', campagnaId);
                AppState.activeSessionCampagnaId = campagnaId;
                sessionStorage.setItem('activeSessionCampagnaId', campagnaId);
                return navigateToPage('sessione');
            };
            patchedOpenSessione.__realtimeGuardNoDoubleRender = true;
            window.openSessionePage = patchedOpenSessione;
        }
    }

    function patchEnsureRuntimeScript() {
        if (typeof window.ensureRuntimeScript !== 'function' || window.ensureRuntimeScript.__realtimeGuardWrapped) return;
        const originalEnsureRuntimeScript = window.ensureRuntimeScript;
        const wrappedEnsureRuntimeScript = function(key) {
            return originalEnsureRuntimeScript.apply(this, arguments).then((result) => {
                installFunctionGuards();
                return result;
            });
        };
        wrappedEnsureRuntimeScript.__realtimeGuardWrapped = true;
        window.ensureRuntimeScript = wrappedEnsureRuntimeScript;
    }

    function installFunctionGuards() {
        patchOpenPageHelpers();
        patchEnsureRuntimeScript();

        wrapWindowFunction('refreshCurrentPageData', { deferWhenBusy: true, preserveUi: true });
        wrapWindowFunction('loadCampagne', { deferWhenBusy: true, preserveUi: false });
        wrapWindowFunction('loadPersonaggi', { deferWhenBusy: true, preserveUi: false });
        wrapWindowFunction('loadAmici', { deferWhenBusy: true, preserveUi: false });
        wrapWindowFunction('loadCampagnaDetails', { deferWhenBusy: true, preserveUi: true });
        wrapWindowFunction('renderSessioneContent', { deferWhenBusy: true, preserveUi: true });
        wrapWindowFunction('renderSchedaPersonaggio', { deferWhenBusy: true, preserveUi: true });
        wrapWindowFunction('renderMicroScheda', { deferWhenBusy: true, preserveUi: true });
        wrapWindowFunction('renderCombattimentoContent', { deferWhenBusy: true, preserveUi: true });
    }

    function installRealtimeUxGuards() {
        installFunctionGuards();
        // Secondo pass: alcuni moduli lazy o assegnazioni tardive possono essere
        // comparsi dopo il primo giro. Non e' polling continuo, solo stabilizzazione.
        setTimeout(installFunctionGuards, 0);
        setTimeout(installFunctionGuards, 250);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installRealtimeUxGuards, { once: true });
    } else {
        setTimeout(installRealtimeUxGuards, 0);
    }
})();
