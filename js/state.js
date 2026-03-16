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
    campagneFilters: {
        searchText: '',
        tipologia: 'all',
        dm: 'all',
        soloPreferiti: false
    }
};

// DOM Elements - will be initialized in init()
let elements = {};
