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
