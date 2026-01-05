// Supabase - Database relazionale PostgreSQL
// Supabase client è disponibile globalmente da supabase-config.js
let supabaseReady = false;

// Initialize Supabase (runs after supabase-config.js loads)
function initSupabase() {
    try {
        if (typeof window.supabaseClient === 'undefined') {
            console.error('❌ Supabase client non disponibile. Verifica che supabase-config.js sia caricato correttamente.');
            console.log('window.supabaseClient:', typeof window.supabaseClient);
            console.log('window.supabase:', typeof window.supabase);
            return false;
        }

        supabaseReady = true;
        console.log('✅ Supabase verificato e pronto');
        console.log('Supabase client disponibile:', !!window.supabaseClient);
        return true;
    } catch (error) {
        console.error('❌ Errore nella verifica Supabase:', error);
        supabaseReady = false;
        return false;
    }
}

// Wait for DOM and Supabase to be ready
function waitForSupabase() {
    return new Promise((resolve) => {
        if (typeof window.supabaseClient !== 'undefined') {
            resolve(initSupabase());
        } else {
            // Wait a bit and retry
            let attempts = 0;
            const maxAttempts = 50; // 5 secondi totali (50 * 100ms)
            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof window.supabaseClient !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve(initSupabase());
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.warn('⏱️ Timeout attesa Supabase, continuo comunque...');
                    console.warn('window.supabaseClient ancora non disponibile dopo', maxAttempts * 100, 'ms');
                    resolve(false);
                }
            }, 100);
        }
    });
}

// Helper per ottenere il client Supabase
function getSupabaseClient() {
    return window.supabaseClient;
}

console.log('📦 app.js caricato');

// State Management
const AppState = {
    currentUser: null,
    currentPage: 'campagne',
    isLoggedIn: false,
    isRegisterMode: false,
    currentCampagnaId: null,
    currentCampagnaDetails: null,
    campagnaGiocatori: [],
    campagneFilters: {
        searchText: '',
        role: 'all',
        soloPreferiti: false,
        dateSort: 'all'
    }
};

// DOM Elements - will be initialized in init()
let elements = {};

// Initialize App
async function init() {
    // Initialize DOM elements
    elements = {
        userBtn: document.getElementById('userBtn'),
        settingsBtn: document.getElementById('settingsBtn'),
        loginModal: document.getElementById('loginModal'),
        userModal: document.getElementById('userModal'),
        settingsModal: document.getElementById('settingsModal'),
        closeLoginModal: document.getElementById('closeLoginModal'),
        closeUserModal: document.getElementById('closeUserModal'),
        closeSettingsModal: document.getElementById('closeSettingsModal'),
        loginForm: document.getElementById('loginForm'),
        logoutBtn: document.getElementById('logoutBtn'),
        d20Logo: document.getElementById('d20Logo'),
        d20RollNumber: document.getElementById('d20RollNumber'),
        toolbarBtns: document.querySelectorAll('.toolbar-btn'),
        pages: document.querySelectorAll('.page'),
        mainContent: document.getElementById('mainContent'),
        loginModalTitle: document.getElementById('loginModalTitle'),
        submitBtn: document.getElementById('submitBtn'),
        registerLink: document.getElementById('registerLink'),
        loginLink: document.getElementById('loginLink'),
        errorMessage: document.getElementById('errorMessage'),
        modalFooterText: document.getElementById('modalFooterText'),
        googleLoginBtn: document.getElementById('googleLoginBtn'),
        nicknameGroup: document.getElementById('nicknameGroup'),
        nicknameInput: document.getElementById('nickname'),
        userName: document.getElementById('userName'),
        userEmail: document.getElementById('userEmail'),
        userCID: document.getElementById('userCID'),
        backToCampagneBtn: document.getElementById('backToCampagneBtn'),
        backToDettagliBtn: document.getElementById('backToDettagliBtn'),
        backToSessioneBtn: document.getElementById('backToSessioneBtn'),
        dettagliCampagnaTitle: document.getElementById('dettagliCampagnaTitle'),
        dettagliCampagnaContent: document.getElementById('dettagliCampagnaContent'),
        dettagliIconContainer: document.getElementById('dettagliIconContainer'),
        editUserNameBtn: document.getElementById('editUserNameBtn'),
        editUserNameForm: document.getElementById('editUserNameForm'),
        editUserNameInput: document.getElementById('editUserNameInput'),
        saveUserNameBtn: document.getElementById('saveUserNameBtn'),
        cancelEditUserNameBtn: document.getElementById('cancelEditUserNameBtn'),
        themeLight: document.getElementById('themeLight'),
        themeDark: document.getElementById('themeDark'),
        campagneList: document.getElementById('campagneList'),
        addCampagnaBtn: document.getElementById('addCampagnaBtn'),
        addAmicoBtn: document.getElementById('addAmicoBtn'),
        addNemicoBtn: document.getElementById('addNemicoBtn'),
        addPersonaggioBtn: document.getElementById('addPersonaggioBtn'),
        campagnaModal: document.getElementById('campagnaModal'),
        closeCampagnaModal: document.getElementById('closeCampagnaModal'),
        campagnaForm: document.getElementById('campagnaForm'),
        addAmicoModal: document.getElementById('addAmicoModal'),
        closeAddAmicoModal: document.getElementById('closeAddAmicoModal'),
        addAmicoForm: document.getElementById('addAmicoForm'),
        cercaUtenteBtn: document.getElementById('cercaUtenteBtn'),
        invitaAmicoBtn: document.getElementById('invitaAmicoBtn'),
        cancelAddAmicoBtn: document.getElementById('cancelAddAmicoBtn'),
        amiciList: document.getElementById('amiciList'),
        richiesteInEntrataList: document.getElementById('richiesteInEntrataList'),
        richiesteInEntrataSection: document.getElementById('richiesteInEntrataSection'),
        campagnaModalTitle: document.getElementById('campagnaModalTitle'),
        cancelCampagnaBtn: document.getElementById('cancelCampagnaBtn'),
        saveCampagnaBtn: document.getElementById('saveCampagnaBtn'),
        openIconSelectorBtn: document.getElementById('openIconSelectorBtn'),
        iconSelectorModal: document.getElementById('iconSelectorModal'),
        closeIconSelectorModal: document.getElementById('closeIconSelectorModal'),
        invitaGiocatoriModal: document.getElementById('invitaGiocatoriModal'),
        closeInvitaGiocatoriModal: document.getElementById('closeInvitaGiocatoriModal'),
        gestisciGiocatoriTab: document.getElementById('gestisciGiocatoriTab'),
        invitaGiocatoriTab: document.getElementById('invitaGiocatoriTab'),
        gestisciGiocatoriContent: document.getElementById('gestisciGiocatoriContent'),
        invitaGiocatoriContent: document.getElementById('invitaGiocatoriContent'),
        editFieldModal: document.getElementById('editFieldModal'),
        closeEditFieldModal: document.getElementById('closeEditFieldModal'),
        editFieldForm: document.getElementById('editFieldForm'),
        editFieldInput: document.getElementById('editFieldInput'),
        editFieldLabel: document.getElementById('editFieldLabel'),
        editFieldModalTitle: document.getElementById('editFieldModalTitle'),
        cancelEditFieldBtn: document.getElementById('cancelEditFieldBtn'),
        saveEditFieldBtn: document.getElementById('saveEditFieldBtn'),
        editDMModal: document.getElementById('editDMModal'),
        closeEditDMModal: document.getElementById('closeEditDMModal'),
        dmPlayersList: document.getElementById('dmPlayersList'),
        cancelEditDMBtn: document.getElementById('cancelEditDMBtn'),
        confirmDialogModal: document.getElementById('confirmDialogModal'),
        closeConfirmDialogModal: document.getElementById('closeConfirmDialogModal'),
        confirmDialogTitle: document.getElementById('confirmDialogTitle'),
        confirmDialogMessage: document.getElementById('confirmDialogMessage'),
        cancelConfirmDialogBtn: document.getElementById('cancelConfirmDialogBtn'),
        confirmDialogBtn: document.getElementById('confirmDialogBtn'),
        rollRequestModal: document.getElementById('rollRequestModal'),
        closeRollRequestModal: document.getElementById('closeRollRequestModal'),
        rollRequestTitle: document.getElementById('rollRequestTitle'),
        rollRequestMessage: document.getElementById('rollRequestMessage'),
        rollRequestLabel: document.getElementById('rollRequestLabel'),
        rollRequestInput: document.getElementById('rollRequestInput'),
        rollRequestForm: document.getElementById('rollRequestForm'),
        cancelRollRequestBtn: document.getElementById('cancelRollRequestBtn'),
        submitRollRequestBtn: document.getElementById('submitRollRequestBtn')
    };

    // Check if all required elements exist
    console.log('🔍 Verifica elementi DOM...');
    console.log('userBtn:', elements.userBtn);
    console.log('settingsBtn:', elements.settingsBtn);
    console.log('loginModal:', elements.loginModal);
    console.log('userModal:', elements.userModal);
    console.log('toolbarBtns:', elements.toolbarBtns?.length || 0);
    
    if (!elements.userBtn || !elements.settingsBtn || !elements.loginModal || !elements.userModal) {
        console.error('❌ Alcuni elementi DOM non sono stati trovati');
        console.error('Elementi mancanti:', {
            userBtn: !elements.userBtn,
            settingsBtn: !elements.settingsBtn,
            loginModal: !elements.loginModal,
            userModal: !elements.userModal
        });
        // Non return, continua comunque per vedere cosa funziona
    } else {
        console.log('✅ Tutti gli elementi DOM trovati');
    }

    // Load saved theme
    loadTheme();
    
    // Ripristina currentCampagnaId dal localStorage se esiste
    const savedCampagnaId = localStorage.getItem('currentCampagnaId');
    if (savedCampagnaId) {
        AppState.currentCampagnaId = savedCampagnaId;
        console.log('📌 Campagna salvata ripristinata:', savedCampagnaId);
    }
    
    // Nascondi i pulsanti di default (saranno mostrati quando l'utente fa login)
    if (elements.addCampagnaBtn) {
        elements.addCampagnaBtn.style.display = 'none';
    }
    if (elements.addAmicoBtn) {
        elements.addAmicoBtn.style.display = 'none';
    }
    if (elements.addNemicoBtn) {
        elements.addNemicoBtn.style.display = 'none';
    }
    if (elements.addPersonaggioBtn) {
        elements.addPersonaggioBtn.style.display = 'none';
    }
    
    // Setup event listeners immediately (don't wait for Supabase)
    console.log('🔧 Setup event listeners...');
    setupEventListeners();
    console.log('📄 Navigazione alla pagina iniziale...');
    navigateToPage('campagne');
    
    // Wait for Supabase to be ready (in background, non-blocking)
    waitForSupabase().then((success) => {
        if (success) {
            console.log('✅ Supabase pronto, setup auth...');
            setupSupabaseAuth();
            // Load initial data after auth is ready
            checkAuthState();
        } else {
            console.warn('⚠️ Supabase non disponibile, app continua senza autenticazione');
        }
    }).catch((error) => {
        console.error('❌ Errore nell\'attesa Supabase:', error);
        // Continue anyway - app works without Supabase
    });
}

// Setup Supabase Auth listeners
function setupSupabaseAuth() {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
        console.warn('⚠️ Supabase non disponibile. L\'app funzionerà senza autenticazione.');
        return;
    }

    try {
        // Listen for auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Auth state changed:', event, session?.user?.email || 'null');
            
            if (session?.user) {
                // User is signed in
                AppState.currentUser = {
                    uid: session.user.id,
                    email: session.user.email,
                    displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Utente'
                };
                AppState.isLoggedIn = true;
                updateUIForLoggedIn();
                console.log('✅ Utente autenticato:', session.user.email);
                
            // Initialize user document and load data
            initializeUserDocument(session.user).then(() => {
                // Se c'è una campagna salvata, vai ai dettagli
                if (AppState.currentCampagnaId) {
                    navigateToPage('dettagli');
                } else {
                    // Carica i dati in base alla pagina corrente
                    if (AppState.currentPage === 'campagne') {
                        loadCampagne(session.user.id);
                    } else if (AppState.currentPage === 'amici') {
                        loadAmici();
                    }
                }
                // Altre pagine possono essere aggiunte qui in futuro
                
                // Avvia polling per richieste tiro e sessioni
                startPollingRollRequests();
                startSessionPolling();
            });
            } else {
                // User is signed out
                AppState.currentUser = null;
                AppState.isLoggedIn = false;
                updateUIForLoggedOut();
                console.log('👤 Utente non autenticato');
                
                // Ferma polling
                stopPollingRollRequests();
                stopSessionPolling();
                
                // Pulisci i dati quando l'utente esce
                if (AppState.currentPage === 'campagne') {
                    renderCampagne([], false);
                } else if (AppState.currentPage === 'amici') {
                    renderAmici([], [], []);
                }
            }
        });
    } catch (error) {
        console.error('❌ Errore nel setup Supabase Auth:', error);
    }
}

// Check current auth state
async function checkAuthState() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
            AppState.currentUser = {
                uid: session.user.id,
                email: session.user.email,
                displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Utente'
            };
            AppState.isLoggedIn = true;
            updateUIForLoggedIn();
            await initializeUserDocument(session.user);
            
            // Se c'è una campagna salvata, vai ai dettagli
            if (AppState.currentCampagnaId) {
                navigateToPage('dettagli');
            } else {
                // Carica i dati in base alla pagina corrente
                if (AppState.currentPage === 'campagne') {
                    loadCampagne(session.user.id);
                } else if (AppState.currentPage === 'amici') {
                    loadAmici();
                }
            }
            
            // Avvia polling per richieste tiro e sessioni
            startPollingRollRequests();
            startSessionPolling();
        } else {
            updateUIForLoggedOut();
            
            // Pulisci i dati quando l'utente esce
            if (AppState.currentPage === 'campagne') {
                renderCampagne([], false);
            } else if (AppState.currentPage === 'amici') {
                renderAmici([], [], []);
            }
        }
    } catch (error) {
        console.error('❌ Errore nel controllo stato auth:', error);
    }
}

// Update UI when user is logged in
function updateUIForLoggedIn() {
    document.body.classList.add('user-logged-in');
    // Update user button to show logged in state
    elements.userBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    `;
    // Mostra i pulsanti quando l'utente è loggato
    if (elements.addCampagnaBtn) {
        elements.addCampagnaBtn.style.display = 'block';
    }
    if (elements.addAmicoBtn) {
        elements.addAmicoBtn.style.display = 'block';
    }
    if (elements.addNemicoBtn) {
        elements.addNemicoBtn.style.display = 'block';
    }
    if (elements.addPersonaggioBtn) {
        elements.addPersonaggioBtn.style.display = 'block';
    }
    // Aggiorna i placeholder per amici, nemici e personaggi (nessun dato ancora)
    updatePlaceholderMessages(true);
}

// Aggiorna i messaggi dei placeholder in base allo stato di login
function updatePlaceholderMessages(isLoggedIn) {
    const amiciPlaceholder = document.getElementById('amiciPlaceholder');
    const nemiciPlaceholder = document.getElementById('nemiciPlaceholder');
    const personaggiPlaceholder = document.getElementById('personaggiPlaceholder');
    
    if (isLoggedIn) {
        // Utente loggato ma senza dati
        if (amiciPlaceholder) {
            amiciPlaceholder.innerHTML = '<p>Non hai amici. Tempo di unirsi a una gioiosa cooperazione!</p>';
        }
        if (nemiciPlaceholder) {
            nemiciPlaceholder.innerHTML = `
                <p>Non ci sono nemici. Crea la tua schiera!</p>
                <p style="font-size: 0.8em; color: var(--text-secondary); margin-top: 0.5em;">
                    Companion App non si assume responsabilità di eventuali conflitti al tavolo con i tuoi "amici".
                </p>
            `;
        }
        if (personaggiPlaceholder) {
            personaggiPlaceholder.innerHTML = '<p>Non ci sono personaggi. Crea il tuo (ennesimo) alter ego!</p>';
        }
    } else {
        // Utente non loggato
        if (amiciPlaceholder) {
            amiciPlaceholder.innerHTML = '<p>Accedi per vedere i tuoi amici</p>';
        }
        if (nemiciPlaceholder) {
            nemiciPlaceholder.innerHTML = '<p>Accedi per vedere e creare i tuoi nemici</p>';
        }
        if (personaggiPlaceholder) {
            personaggiPlaceholder.innerHTML = '<p>Accedi per vedere e creare i tuoi personaggi</p>';
        }
    }
}

// Update UI when user is logged out
function updateUIForLoggedOut() {
    document.body.classList.remove('user-logged-in');
    // Nascondi i pulsanti quando l'utente non è loggato
    if (elements.addCampagnaBtn) {
        elements.addCampagnaBtn.style.display = 'none';
    }
    if (elements.addAmicoBtn) {
        elements.addAmicoBtn.style.display = 'none';
    }
    if (elements.addNemicoBtn) {
        elements.addNemicoBtn.style.display = 'none';
    }
    if (elements.addPersonaggioBtn) {
        elements.addPersonaggioBtn.style.display = 'none';
    }
    // Show login message in campagne list
    renderCampagne([], false);
    // Aggiorna i placeholder per amici, nemici e personaggi
    updatePlaceholderMessages(false);
}

// Setup Event Listeners
function setupEventListeners() {
    console.log('🔧 Setup event listeners...');
    console.log('Elementi disponibili:', Object.keys(elements).filter(key => elements[key] !== null));
    console.log('Verifica elementi critici:', {
        userBtn: !!elements.userBtn,
        settingsBtn: !!elements.settingsBtn,
        toolbarBtns: elements.toolbarBtns?.length || 0
    });
    
    // User button - opens login if not logged in, or user menu if logged in
    if (elements.userBtn) {
        // Use onclick for more reliable binding
        elements.userBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('👤 Click su user button');
            console.log('AppState.isLoggedIn:', AppState.isLoggedIn);
            console.log('AppState.currentUser:', AppState.currentUser);
            if (!AppState.isLoggedIn) {
                console.log('→ Apertura login modal');
                openLoginModal();
            } else {
                console.log('→ Apertura user modal');
                openUserModal();
            }
        };
        // Also add event listener as backup
        elements.userBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('👤 Click su user button (addEventListener)');
            console.log('AppState.isLoggedIn:', AppState.isLoggedIn);
            if (!AppState.isLoggedIn) {
                console.log('→ Apertura login modal (addEventListener)');
                openLoginModal();
            } else {
                console.log('→ Apertura user modal (addEventListener)');
                openUserModal();
            }
        });
        console.log('✅ Event listener aggiunto a userBtn');
    } else {
        console.error('❌ userBtn non trovato');
    }

    // Settings button
    if (elements.settingsBtn) {
        // Use onclick for more reliable binding
        elements.settingsBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('⚙️ Click su settings button');
            openSettingsModal();
        };
        // Also add event listener as backup
        elements.settingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('⚙️ Click su settings button (addEventListener)');
            openSettingsModal();
        });
        console.log('✅ Event listener aggiunto a settingsBtn');
    } else {
        console.error('❌ settingsBtn non trovato');
    }

    // Close modals
    if (elements.closeLoginModal) {
        elements.closeLoginModal.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeLoginModal();
        };
        elements.closeLoginModal.addEventListener('click', closeLoginModal);
    }
    if (elements.closeUserModal) {
        console.log('✅ Trovato closeUserModal, aggiungo listener');
        elements.closeUserModal.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Click su closeUserModal');
            closeUserModal();
        };
        elements.closeUserModal.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Click su closeUserModal (addEventListener)');
            closeUserModal();
        });
    } else {
        console.error('❌ closeUserModal non trovato!');
    }
    if (elements.closeSettingsModal) {
        elements.closeSettingsModal.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeSettingsModal();
        };
        elements.closeSettingsModal.addEventListener('click', closeSettingsModal);
    }

    // Close modal on background click
    if (elements.loginModal) {
        elements.loginModal.addEventListener('click', (e) => {
            if (e.target === elements.loginModal) {
                closeLoginModal();
            }
        });
    }

    if (elements.userModal) {
        elements.userModal.addEventListener('click', (e) => {
            if (e.target === elements.userModal) {
                closeUserModal();
            }
        });
    }

    if (elements.settingsModal) {
        elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === elements.settingsModal) {
                closeSettingsModal();
            }
        });
    }

    // Theme buttons
    if (elements.themeLight) {
        elements.themeLight.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎨 Click su tema light');
            setTheme('light');
        };
        // Also addEventListener as backup
        elements.themeLight.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎨 Click su tema light (addEventListener)');
            setTheme('light');
        });
    }
    if (elements.themeDark) {
        elements.themeDark.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎨 Click su tema dark');
            setTheme('dark');
        };
        // Also addEventListener as backup
        elements.themeDark.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎨 Click su tema dark (addEventListener)');
            setTheme('dark');
        });
    }

    // Login form submission
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }

    // Logout button
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }

    // Toolbar navigation
    if (elements.toolbarBtns && elements.toolbarBtns.length > 0) {
        elements.toolbarBtns.forEach((btn, index) => {
            const page = btn.getAttribute('data-page');
            // Use onclick for more reliable binding
            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📄 Click su toolbar button:', page);
                navigateToPage(page);
            };
            // Also add event listener as backup
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📄 Click su toolbar button (addEventListener):', page);
                navigateToPage(page);
            });
        });
        console.log(`✅ Event listeners aggiunti a ${elements.toolbarBtns.length} toolbar buttons`);
    } else {
        console.error('❌ toolbarBtns non trovati');
    }

    // Register/Login link toggle
    if (elements.registerLink) {
        elements.registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleLoginRegisterMode(true);
        });
        console.log('✅ Event listener aggiunto a registerLink');
    }

    if (elements.loginLink) {
        elements.loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleLoginRegisterMode(false);
        });
        console.log('✅ Event listener aggiunto a loginLink');
    }

    // Google Login button
    if (elements.googleLoginBtn) {
        elements.googleLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleGoogleLogin();
        });
        console.log('✅ Event listener aggiunto a googleLoginBtn');
    }

    // Campagne buttons
    if (elements.addCampagnaBtn) {
        elements.addCampagnaBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('➕ Click su Crea Campagna');
            openCampagnaModal();
        };
        elements.addCampagnaBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('➕ Click su Crea Campagna (addEventListener)');
            openCampagnaModal();
        });
        console.log('✅ Event listener aggiunto a addCampagnaBtn');
    } else {
        console.error('❌ addCampagnaBtn non trovato');
    }

    // Filtri campagne
    setupCampagneFilters();
    
    // Amici button
    if (elements.addAmicoBtn) {
        elements.addAmicoBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('➕ Click su Aggiungi Amico');
            openAddAmicoModal();
        };
        console.log('✅ Event listener aggiunto a addAmicoBtn');
    }
    
    // Add Amico Modal listeners
    if (elements.closeAddAmicoModal) {
        elements.closeAddAmicoModal.addEventListener('click', closeAddAmicoModal);
    }
    if (elements.cancelAddAmicoBtn) {
        elements.cancelAddAmicoBtn.addEventListener('click', closeAddAmicoModal);
    }
    if (elements.addAmicoModal) {
        elements.addAmicoModal.addEventListener('click', (e) => {
            if (e.target === elements.addAmicoModal) {
                closeAddAmicoModal();
            }
        });
    }
    if (elements.cercaUtenteBtn) {
        elements.cercaUtenteBtn.addEventListener('click', handleCercaUtente);
    }
    if (elements.invitaAmicoBtn) {
        elements.invitaAmicoBtn.addEventListener('click', handleInvitaAmico);
    }
    
    // Nemici button
    if (elements.addNemicoBtn) {
        elements.addNemicoBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('➕ Click su Crea Nemico');
            // TODO: Implementare funzione per creare nemico
            showNotification('Funzionalità in arrivo: Crea Nemico');
        };
        console.log('✅ Event listener aggiunto a addNemicoBtn');
    }
    
    // Personaggi button
    if (elements.addPersonaggioBtn) {
        elements.addPersonaggioBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('➕ Click su Crea Personaggio');
            // TODO: Implementare funzione per creare personaggio
            showNotification('Funzionalità in arrivo: Crea Personaggio');
        };
        console.log('✅ Event listener aggiunto a addPersonaggioBtn');
    }
    
    if (elements.closeCampagnaModal) {
        elements.closeCampagnaModal.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeCampagnaModal();
        };
    }
    if (elements.cancelCampagnaBtn) {
        elements.cancelCampagnaBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeCampagnaModal();
        };
    }
    if (elements.campagnaForm) {
        elements.campagnaForm.addEventListener('submit', handleCampagnaSubmit);
    }
    if (elements.campagnaModal) {
        elements.campagnaModal.addEventListener('click', (e) => {
            if (e.target === elements.campagnaModal) {
                closeCampagnaModal();
            }
        });
    }
    
    // D20 Logo roll functionality
    if (elements.d20Logo) {
        elements.d20Logo.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            rollD20();
        });
    }
    
    // Hide roll number when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (elements.d20RollNumber && elements.d20RollNumber.classList.contains('show')) {
            if (!elements.d20Logo || !elements.d20Logo.contains(e.target)) {
                hideRollNumber();
            }
        }
    });
    
    // Icon selector popup
    if (elements.openIconSelectorBtn) {
        elements.openIconSelectorBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openIconSelectorModal();
        };
    }
    if (elements.closeIconSelectorModal) {
        elements.closeIconSelectorModal.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeIconSelectorModal();
        };
    }
    if (elements.iconSelectorModal) {
        elements.iconSelectorModal.addEventListener('click', (e) => {
            if (e.target === elements.iconSelectorModal) {
                closeIconSelectorModal();
            }
        });
    }
    
    // Back to campagne button
    if (elements.backToCampagneBtn) {
        elements.backToCampagneBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            // Reset currentCampagnaId per tornare alla lista
            AppState.currentCampagnaId = null;
            localStorage.removeItem('currentCampagnaId');
            navigateToPage('campagne');
        };
        console.log('✅ Event listener aggiunto a backToCampagneBtn');
    }

    // Back to dettagli button (from sessione page)
    if (elements.backToDettagliBtn) {
        elements.backToDettagliBtn.onclick = async function(e) {
            e.preventDefault();
            e.stopPropagation();
            const campagnaId = AppState.currentCampagnaId;
            if (campagnaId) {
                navigateToPage('dettagli');
                await loadCampagnaDetails(campagnaId);
            }
        };
        console.log('✅ Event listener aggiunto a backToDettagliBtn');
    }

    // Back to sessione button (from combattimento page)
    if (elements.backToSessioneBtn) {
        elements.backToSessioneBtn.onclick = async function(e) {
            e.preventDefault();
            e.stopPropagation();
            const campagnaId = AppState.currentCampagnaId;
            if (campagnaId) {
                navigateToPage('sessione');
                await renderSessioneContent(campagnaId);
            }
        };
        console.log('✅ Event listener aggiunto a backToSessioneBtn');
    }

    // Edit user name button
    if (elements.editUserNameBtn) {
        elements.editUserNameBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (elements.editUserNameForm) {
                elements.editUserNameForm.style.display = 'block';
                if (elements.editUserNameInput) {
                    // Pre-compila con il nome corrente
                    const currentName = elements.userName ? elements.userName.textContent : '';
                    elements.editUserNameInput.value = currentName;
                    elements.editUserNameInput.focus();
                }
            }
        };
        console.log('✅ Event listener aggiunto a editUserNameBtn');
    }

    // Save user name button
    if (elements.saveUserNameBtn) {
        elements.saveUserNameBtn.onclick = async function(e) {
            e.preventDefault();
            e.stopPropagation();
            await handleSaveUserName();
        };
        console.log('✅ Event listener aggiunto a saveUserNameBtn');
    }

    // Cancel edit user name button
    if (elements.cancelEditUserNameBtn) {
        elements.cancelEditUserNameBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (elements.editUserNameForm) {
                elements.editUserNameForm.style.display = 'none';
            }
            if (elements.editUserNameInput) {
                elements.editUserNameInput.value = '';
            }
        };
        console.log('✅ Event listener aggiunto a cancelEditUserNameBtn');
    }

    // Close invita giocatori modal
    if (elements.closeInvitaGiocatoriModal) {
        elements.closeInvitaGiocatoriModal.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeInvitaGiocatoriModal();
        };
    }

    // Close edit DM modal
    if (elements.closeEditDMModal) {
        elements.closeEditDMModal.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeEditDMModal();
        };
    }

    if (elements.cancelEditDMBtn) {
        elements.cancelEditDMBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeEditDMModal();
        };
    }

    if (elements.editDMModal) {
        elements.editDMModal.addEventListener('click', (e) => {
            if (e.target === elements.editDMModal) {
                closeEditDMModal();
            }
        });
    }
    
    // Tab navigation per gestione giocatori modal
    if (elements.gestisciGiocatoriTab) {
        elements.gestisciGiocatoriTab.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            const campagnaId = AppState.currentCampagnaId;
            if (campagnaId) {
                switchGiocatoriTab('gestisci', campagnaId);
            }
        };
    }
    if (elements.invitaGiocatoriTab) {
        elements.invitaGiocatoriTab.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            const campagnaId = AppState.currentCampagnaId;
            if (campagnaId) {
                switchGiocatoriTab('invita', campagnaId);
            }
        };
    }
    if (elements.invitaGiocatoriModal) {
        elements.invitaGiocatoriModal.addEventListener('click', (e) => {
            if (e.target === elements.invitaGiocatoriModal) {
                closeInvitaGiocatoriModal();
            }
        });
    }
    
    // Icon selector setup
    setupIconSelector();

    // Roll request modal setup
    // Il modal di richiesta tiro non può essere chiuso (il giocatore deve fornire un tiro)
    // closeRollRequestModal e cancelRollRequestBtn sono stati rimossi dall'HTML
    if (elements.rollRequestForm) {
        elements.rollRequestForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (window.currentRollRequest) {
                const valore = parseInt(elements.rollRequestInput.value);
                if (isNaN(valore) || valore < 1) {
                    showNotification('Inserisci un numero valido (minimo 1)');
                    return;
                }
                await submitRollRequest(window.currentRollRequest.id, window.currentRollRequest.tipo, valore);
                closeRollRequestModal();
            }
        });
    }
    // Il modal di richiesta tiro non può essere chiuso cliccando fuori (il giocatore deve fornire un tiro)
    // if (elements.rollRequestModal) {
    //     elements.rollRequestModal.addEventListener('click', (e) => {
    //         if (e.target === elements.rollRequestModal) {
    //             closeRollRequestModal();
    //         }
    //     });
    // }

    // Confirm dialog modal setup
    if (elements.confirmDialogBtn) {
        elements.confirmDialogBtn.onclick = () => {
            closeConfirmDialog(true);
        };
    }
    if (elements.cancelConfirmDialogBtn) {
        elements.cancelConfirmDialogBtn.onclick = () => {
            closeConfirmDialog(false);
        };
    }
    if (elements.closeConfirmDialogModal) {
        elements.closeConfirmDialogModal.onclick = () => {
            closeConfirmDialog(false);
        };
    }
    if (elements.confirmDialogModal) {
        elements.confirmDialogModal.addEventListener('click', (e) => {
            if (e.target === elements.confirmDialogModal) {
                closeConfirmDialog(false);
            }
        });
    }

    // Prompt dialog modal setup (editFieldModal riutilizzato)
    // Nota: editFieldForm potrebbe essere usato anche per altri scopi,
    // quindi controlliamo promptDialogResolve prima di usarlo
    const originalEditFieldSubmit = elements.editFieldForm ? elements.editFieldForm.onsubmit : null;
    if (elements.editFieldForm) {
        elements.editFieldForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (promptDialogResolve && elements.editFieldInput) {
                closePromptDialog(elements.editFieldInput.value.trim() || null);
            }
            // Se non è un prompt dialog, non fare nulla (altri handler lo gestiranno)
        });
    }
    if (elements.cancelEditFieldBtn) {
        const originalCancelHandler = elements.cancelEditFieldBtn.onclick;
        elements.cancelEditFieldBtn.onclick = () => {
            if (promptDialogResolve) {
                closePromptDialog(null);
            } else if (originalCancelHandler) {
                originalCancelHandler();
            }
        };
    }
    if (elements.closeEditFieldModal) {
        const originalCloseHandler = elements.closeEditFieldModal.onclick;
        elements.closeEditFieldModal.onclick = () => {
            if (promptDialogResolve) {
                closePromptDialog(null);
            } else if (originalCloseHandler) {
                originalCloseHandler();
            }
        };
    }
    if (elements.editFieldModal) {
        elements.editFieldModal.addEventListener('click', (e) => {
            if (e.target === elements.editFieldModal && promptDialogResolve) {
                closePromptDialog(null);
            }
        });
    }
    
    console.log('✅ Setup event listeners completato');
    
    // Test diretto: verifica che i bottoni siano cliccabili
    setTimeout(() => {
        console.log('🧪 Test bottoni...');
        if (elements.userBtn) {
            console.log('userBtn presente, verifico click handler...');
            console.log('userBtn.onclick:', typeof elements.userBtn.onclick);
        }
        if (elements.settingsBtn) {
            console.log('settingsBtn presente');
        }
        if (elements.toolbarBtns && elements.toolbarBtns.length > 0) {
            console.log(`${elements.toolbarBtns.length} toolbar buttons presenti`);
            elements.toolbarBtns.forEach((btn, i) => {
                console.log(`Toolbar button ${i}:`, btn.getAttribute('data-page'), 'onclick:', typeof btn.onclick);
            });
        }
    }, 300);
}

// Navigation
function navigateToPage(pageName) {
    // Update active page
    elements.pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`${pageName}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update active toolbar button
    elements.toolbarBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageName) {
            btn.classList.add('active');
        }
    });

    AppState.currentPage = pageName;
    
    // Salva la pagina corrente nel localStorage
    localStorage.setItem('currentPage', pageName);
    
    // Salva currentCampagnaId solo per pagine che lo richiedono
    if (pageName === 'dettagli' || pageName === 'sessione' || pageName === 'combattimento') {
        if (AppState.currentCampagnaId) {
            localStorage.setItem('currentCampagnaId', AppState.currentCampagnaId);
        }
    } else {
        // Per altre pagine, rimuovi currentCampagnaId se presente
        if (pageName === 'campagne' || pageName === 'amici') {
            localStorage.removeItem('currentCampagnaId');
            AppState.currentCampagnaId = null;
        }
    }
    
    // Carica dati specifici per la pagina
    if (pageName === 'amici' && AppState.isLoggedIn) {
        loadAmici();
    } else if (pageName === 'campagne') {
        // Se si naviga verso campagne ma si era nella pagina dettagli, torna ai dettagli
        if (AppState.currentCampagnaId) {
            navigateToPage('dettagli');
            return;
        }
        // Altrimenti carica la lista campagne
        if (AppState.isLoggedIn && AppState.currentUser) {
            loadCampagne(AppState.currentUser.uid);
        }
    } else if (pageName === 'dettagli' && AppState.currentCampagnaId) {
        // Carica i dettagli della campagna
        loadCampagnaDetails(AppState.currentCampagnaId);
    }
}

// Modal Functions
function openLoginModal() {
    elements.loginModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
    elements.loginModal.classList.remove('active');
    document.body.style.overflow = '';
    elements.loginForm.reset();
    hideError();
    toggleLoginRegisterMode(false);
}

async function openUserModal() {
    console.log('🔓 Apertura User Modal...');
    console.log('AppState.isLoggedIn:', AppState.isLoggedIn);
    console.log('AppState.currentUser:', AppState.currentUser);
    console.log('elements.userModal:', elements.userModal);
    
    if (!elements.userModal) {
        console.error('❌ userModal non trovato!');
        return;
    }
    
    // Update user info in modal
    if (AppState.currentUser) {
        if (elements.userName) {
            elements.userName.textContent = AppState.currentUser.displayName || 'Utente';
        }
        if (elements.userEmail) {
            elements.userEmail.textContent = AppState.currentUser.email || '';
        }
        
        // Carica il CID e nome utente dall'utente
        if (elements.userCID) {
            try {
                const userData = await findUserByUid(AppState.currentUser.uid);
                if (userData) {
                    if (userData.cid) {
                        elements.userCID.textContent = `CID: ${userData.cid}`;
                    } else {
                        elements.userCID.textContent = 'CID: ----';
                    }
                    // Aggiorna anche il nome utente se disponibile
                    if (userData.nome_utente && elements.userName) {
                        elements.userName.textContent = userData.nome_utente;
                    }
                } else {
                    elements.userCID.textContent = 'CID: ----';
                }
            } catch (error) {
                console.error('❌ Errore nel caricamento dati utente:', error);
                elements.userCID.textContent = 'CID: ----';
            }
        }
        
        // Nascondi il form di modifica nome quando apri il modal
        if (elements.editUserNameForm) {
            elements.editUserNameForm.style.display = 'none';
        }
    }
    
    elements.userModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('✅ User Modal aperto');
}

function closeUserModal() {
    console.log('🔒 Chiusura User Modal...');
    if (!elements.userModal) {
        console.error('❌ userModal non trovato in closeUserModal!');
        return;
    }
    // Nascondi il form di modifica nome quando chiudi il modal
    if (elements.editUserNameForm) {
        elements.editUserNameForm.style.display = 'none';
    }
    if (elements.editUserNameInput) {
        elements.editUserNameInput.value = '';
    }
    elements.userModal.classList.remove('active');
    document.body.style.overflow = '';
    console.log('✅ User Modal chiuso');
}

function openSettingsModal() {
    if (!elements.settingsModal) {
        console.error('❌ settingsModal non trovato');
        return;
    }
    
    console.log('⚙️ Apertura Settings Modal');
    elements.settingsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettingsModal() {
    if (!elements.settingsModal) return;
    elements.settingsModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme, false); // false = don't save again
}

async function setTheme(theme, save = true) {
    console.log('🎨 Cambio tema a:', theme);
    
    // Remove existing theme attribute
    document.documentElement.removeAttribute('data-theme');
    
    // Apply new theme
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        // Light theme is default, no attribute needed
        document.documentElement.removeAttribute('data-theme');
    }
    
    // Force reflow to ensure CSS variables are updated
    void document.documentElement.offsetHeight;
    
    // Update button states
    if (elements.themeLight) {
        if (theme === 'light') {
            elements.themeLight.classList.add('active');
        } else {
            elements.themeLight.classList.remove('active');
        }
    }
    if (elements.themeDark) {
        if (theme === 'dark') {
            elements.themeDark.classList.add('active');
        } else {
            elements.themeDark.classList.remove('active');
        }
    }
    
    // Save to localStorage
    if (save) {
        localStorage.setItem('theme', theme);
        console.log('✅ Tema salvato in localStorage:', theme);
        
        // Save to Supabase if user is logged in
        if (AppState.isLoggedIn && AppState.currentUser) {
            const supabase = getSupabaseClient();
            
            if (supabase) {
                try {
                    const temaScuro = theme === 'dark';
                    // Aggiorna il tema dell'utente
                    const { error } = await supabase
                        .from('utenti')
                        .update({ tema_scuro: temaScuro })
                        .eq('uid', AppState.currentUser.uid);
                    
                    if (error) throw error;
                    console.log('✅ Tema salvato in Supabase:', temaScuro);
                } catch (error) {
                    console.error('❌ Errore nel salvataggio tema in Supabase:', error);
                }
            }
        }
    }
}

// Supabase - Campagne Management
let campagneChannel = null;
let editingCampagnaId = null;

async function loadCampagne(userId) {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
        console.error('❌ Supabase non disponibile');
        return;
    }

    if (!userId) {
        console.error('❌ userId non fornito');
        return;
    }

    // Verifica che l'utente sia autenticato
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== userId) {
        console.error('❌ Utente non autenticato o userId non corrisponde');
        renderCampagne([], false);
        return;
    }
    
    console.log('📚 Caricamento campagne per utente:', userId);
    
    // Carica anche gli inviti ricevuti
    const invitiRicevuti = await loadInvitiRicevuti(userId);
    
    // Disconnetti da eventuali subscription precedenti
    if (campagneChannel) {
        supabase.removeChannel(campagneChannel);
        campagneChannel = null;
    }

    // Carica inizialmente le campagne
    try {
        // Prima trova l'utente nella tabella utenti per ottenere l'ID
        // Usa findUserByUid che già gestisce correttamente le RLS e gli errori
        const utente = await findUserByUid(userId);
        
        if (!utente) {
            console.error('❌ Utente non trovato nella tabella utenti');
            renderCampagne([], false);
            return;
        }

        // Carica le campagne: sia quelle create dall'utente che quelle a cui partecipa (invito accettato)
        const { data: campagneCreate, error: errorCreate } = await supabase
            .from('campagne')
            .select('*')
            .eq('id_dm', utente.id)
            .order('data_creazione', { ascending: false });

        if (errorCreate) throw errorCreate;

        // Carica anche le campagne dove l'utente ha accettato un invito
        const { data: invitiAccettati, error: errorInviti } = await supabase
            .from('inviti_campagna')
            .select(`
                campagna_id,
                campagne:campagne!inviti_campagna_campagna_id_fkey(*)
            `)
            .eq('invitato_id', utente.id)
            .eq('stato', 'accepted');

        if (errorInviti) {
            console.error('❌ Errore nel caricamento inviti accettati:', errorInviti);
        } else {
            console.log('✅ Inviti accettati caricati:', invitiAccettati?.length || 0);
        }

        // Combina le campagne create e quelle a cui partecipa
        const campagne = campagneCreate || [];
        if (invitiAccettati && invitiAccettati.length > 0) {
            const campagnePartecipate = invitiAccettati
                .map(inv => {
                    // Usa l'alias 'campagne' dalla query
                    return inv.campagne;
                })
                .filter(Boolean)
                .filter(camp => !campagne.some(c => c.id === camp.id)); // Evita duplicati

            console.log('📋 Campagne a cui partecipa:', campagnePartecipate.length);
            campagne.push(...campagnePartecipate);
        }

        // Carica i preferiti dell'utente
        const { data: utenteConPreferiti, error: preferitiError } = await supabase
            .from('utenti')
            .select('campagne_preferite')
            .eq('id', utente.id)
            .single();

        const campagnePreferite = (utenteConPreferiti?.campagne_preferite || []);

        // Aggiungi un campo isPreferito a ogni campagna
        campagne.forEach(campagna => {
            campagna.isPreferito = campagnePreferite.includes(campagna.id);
        });

        // Ordina le campagne: prima i preferiti, poi per data di creazione (più recenti prima)
        campagne.sort((a, b) => {
            // Preferiti in cima (solo se non c'è un filtro data specifico)
            if (AppState.campagneFilters.dateSort === 'all') {
                if (a.isPreferito && !b.isPreferito) return -1;
                if (!a.isPreferito && b.isPreferito) return 1;
            }
            // Tra preferiti o tra non preferiti, ordina per data di creazione (più recenti prima)
            return new Date(b.data_creazione || 0) - new Date(a.data_creazione || 0);
        });

        console.log('✅ Campagne caricate:', campagne?.length || 0);
        
        // Applica i filtri prima di renderizzare (passa l'ID utente per filtri ruolo)
        const campagneFiltrate = applyCampagneFilters(campagne || [], AppState.campagneFilters, utente.id);
        renderCampagne(campagneFiltrate, true, invitiRicevuti);

        // Setup real-time subscription
        campagneChannel = supabase
            .channel('campagne-changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'campagne',
                    filter: `id_dm=eq.${utente.id}`
                }, 
                async (payload) => {
                    console.log('🔄 Cambio rilevato nelle campagne:', payload);
                    // Ricarica le campagne
                    const { data: updatedCampagne, error: reloadError } = await supabase
                        .from('campagne')
                        .select('*')
                        .eq('id_dm', utente.id)
                        .order('data_creazione', { ascending: false });
                    
                    if (!reloadError && updatedCampagne) {
                        renderCampagne(updatedCampagne, true);
                    }
                }
            )
            .subscribe();

    } catch (error) {
        console.error('❌ Errore nel caricamento campagne:', error);
        showNotification('Errore nel caricamento delle campagne: ' + error.message);
        renderCampagne([], false);
    }
}

/**
 * Carica gli inviti ricevuti dall'utente
 * Usa una funzione RPC per bypassare le RLS e recuperare i dati completi
 */
async function loadInvitiRicevuti(userId) {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    try {
        const utente = await findUserByUid(userId);
        if (!utente) {
            console.warn('⚠️ Utente non trovato per caricamento inviti');
            return [];
        }

        // Usa la funzione RPC per recuperare gli inviti con dati completi
        // La funzione bypassa le RLS e restituisce i dati di campagna e inviante
        const { data, error } = await supabase
            .rpc('get_inviti_ricevuti', {
                p_invitato_id: utente.id
            });

        if (error) {
            console.error('❌ Errore RPC get_inviti_ricevuti:', error);
            throw error;
        }

        // Trasforma i risultati della tabella nella struttura attesa dal codice
        // (con oggetti annidati 'campagne' e 'inviante')
        const inviti = (data || []).map(row => ({
            id: row.id,
            campagna_id: row.campagna_id,
            inviante_id: row.inviante_id,
            invitato_id: row.invitato_id,
            stato: row.stato,
            created_at: row.created_at,
            updated_at: row.updated_at,
            campagne: row.campagna_nome_campagna ? {
                id: row.campagna_id,
                nome_campagna: row.campagna_nome_campagna
            } : null,
            inviante: row.inviante_nome_utente ? {
                id: row.inviante_id,
                nome_utente: row.inviante_nome_utente,
                cid: row.inviante_cid,
                email: row.inviante_email
            } : null
        }));

        console.log('✅ Inviti ricevuti caricati:', inviti?.length || 0);
        if (inviti && inviti.length > 0) {
            console.log('📋 Primo invito esempio:', JSON.stringify(inviti[0], null, 2));
        }

        return inviti || [];
    } catch (error) {
        console.error('❌ Errore nel caricamento inviti ricevuti:', error);
        return [];
    }
}

/**
 * Applica i filtri all'array di campagne
 */
function applyCampagneFilters(campagne, filters, currentUserId) {
    let filtered = [...campagne];

    // Filtro per testo (nome campagna)
    if (filters.searchText && filters.searchText.trim() !== '') {
        const searchLower = filters.searchText.toLowerCase().trim();
        filtered = filtered.filter(c => 
            c.nome_campagna && c.nome_campagna.toLowerCase().includes(searchLower)
        );
    }

    // Filtro per ruolo (DM o giocatore)
    if (filters.role === 'dm') {
        filtered = filtered.filter(c => c.id_dm === currentUserId);
    } else if (filters.role === 'player') {
        filtered = filtered.filter(c => 
            c.id_dm !== currentUserId && 
            Array.isArray(c.giocatori) && 
            c.giocatori.includes(currentUserId)
        );
    }

    // Filtro per preferiti
    if (filters.soloPreferiti) {
        filtered = filtered.filter(c => c.isPreferito === true);
    }

    // Ordinamento per data (se non è 'all')
    if (filters.dateSort === 'recent') {
        filtered.sort((a, b) => {
            // Mantieni preferiti in cima anche con ordinamento data
            if (a.isPreferito && !b.isPreferito) return -1;
            if (!a.isPreferito && b.isPreferito) return 1;
            const dateA = new Date(a.data_creazione || 0);
            const dateB = new Date(b.data_creazione || 0);
            return dateB - dateA; // Più recenti prima
        });
    } else if (filters.dateSort === 'oldest') {
        filtered.sort((a, b) => {
            // Mantieni preferiti in cima anche con ordinamento data
            if (a.isPreferito && !b.isPreferito) return -1;
            if (!a.isPreferito && b.isPreferito) return 1;
            const dateA = new Date(a.data_creazione || 0);
            const dateB = new Date(b.data_creazione || 0);
            return dateA - dateB; // Più vecchie prima
        });
    }

    return filtered;
}

/**
 * Setup event listeners per i filtri campagne
 */
function setupCampagneFilters() {
    const searchInput = document.getElementById('campagneSearchInput');
    const roleFilter = document.getElementById('campagneRoleFilter');
    const preferitiFilter = document.getElementById('togglePreferitiFilter');
    const dateFilter = document.getElementById('campagneDateFilter');

    // Debounce per ricerca testuale
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                AppState.campagneFilters.searchText = e.target.value;
                applyFiltersAndRerender();
            }, 300);
        });
    }

    if (roleFilter) {
        roleFilter.addEventListener('change', (e) => {
            AppState.campagneFilters.role = e.target.value;
            applyFiltersAndRerender();
        });
    }

    if (preferitiFilter) {
        preferitiFilter.addEventListener('click', (e) => {
            e.preventDefault();
            AppState.campagneFilters.soloPreferiti = !AppState.campagneFilters.soloPreferiti;
            preferitiFilter.classList.toggle('active', AppState.campagneFilters.soloPreferiti);
            applyFiltersAndRerender();
        });
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', (e) => {
            AppState.campagneFilters.dateSort = e.target.value;
            applyFiltersAndRerender();
        });
    }

    // Carica preferenze salvate dal localStorage (opzionale)
    const savedFilters = localStorage.getItem('campagneFilters');
    if (savedFilters) {
        try {
            const parsed = JSON.parse(savedFilters);
            AppState.campagneFilters = { ...AppState.campagneFilters, ...parsed };
            // Applica i valori salvati agli input
            if (searchInput) searchInput.value = AppState.campagneFilters.searchText || '';
            if (roleFilter) roleFilter.value = AppState.campagneFilters.role || 'all';
            if (preferitiFilter) {
                preferitiFilter.classList.toggle('active', AppState.campagneFilters.soloPreferiti);
            }
            if (dateFilter) dateFilter.value = AppState.campagneFilters.dateSort || 'all';
        } catch (e) {
            console.warn('Errore nel caricamento filtri salvati:', e);
        }
    }
}

/**
 * Applica i filtri e ricarica le campagne
 */
async function applyFiltersAndRerender() {
    if (!AppState.currentUser || !AppState.isLoggedIn) return;
    
    // Salva preferenze in localStorage
    localStorage.setItem('campagneFilters', JSON.stringify(AppState.campagneFilters));
    
    // Ricarica le campagne (che applicheranno automaticamente i filtri)
    await loadCampagne(AppState.currentUser.uid);
}

async function renderCampagne(campagne, isLoggedIn = true, invitiRicevuti = []) {
    if (!elements.campagneList) return;

    // If user is not logged in, show login message
    if (!isLoggedIn) {
        elements.campagneList.innerHTML = `
            <div class="content-placeholder">
                <p>Accedi per vedere e creare le tue campagne</p>
            </div>
        `;
        return;
    }

    // Ottieni l'ID dell'utente corrente per verificare se è DM
    let currentUserId = null;
    if (AppState.currentUser && AppState.currentUser.uid) {
        const currentUserData = await findUserByUid(AppState.currentUser.uid);
        if (currentUserData) {
            currentUserId = currentUserData.id;
        }
    }

    let htmlContent = '';

    // Mostra gli inviti ricevuti
    if (invitiRicevuti.length > 0) {
        htmlContent += invitiRicevuti.map(invito => {
            // Usa l'alias 'campagne' e 'inviante' dalla query
            const campagna = invito.campagne;
            const inviante = invito.inviante; // Chi ha inviato l'invito (il DM)
            
            // Debug logging
            if (!campagna || !inviante) {
                console.warn('⚠️ Dati invito incompleti:', {
                    invitoId: invito.id,
                    hasCampagna: !!campagna,
                    hasInviante: !!inviante,
                    invitoKeys: Object.keys(invito)
                });
            }
            
            const nomeCampagna = campagna?.nome_campagna || 'Campagna sconosciuta';
            const nomeDM = inviante?.nome_utente || 'DM sconosciuto';
            const cidDM = inviante?.cid || '';
            
            return `
                <div class="invito-card">
                    <div class="invito-header">
                        <h4>🎲 Invito a Campagna</h4>
                    </div>
                    <div class="invito-content">
                        <p><strong>Campagna: ${escapeHtml(nomeCampagna)}</strong></p>
                        <p class="invito-from">DM: ${escapeHtml(nomeDM)}${cidDM ? ` (CID: ${cidDM})` : ''}</p>
                        <div class="invito-actions">
                            <button class="btn-primary btn-small" onclick="accettaInvitoCampagna('${invito.id}')">Accetta</button>
                            <button class="btn-secondary btn-small" onclick="rifiutaInvitoCampagna('${invito.id}')">Rifiuta</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // If logged in but no campaigns and no invites
    if (campagne.length === 0 && invitiRicevuti.length === 0) {
        elements.campagneList.innerHTML = `
            <div class="content-placeholder">
                <p>Non hai campagne. Crea o partecipa a una campagna!</p>
            </div>
        `;
        return;
    }

    // Carica i nomi dei DM per tutte le campagne usando la funzione RPC (bypassa RLS)
    const dmIds = [...new Set(campagne.map(c => c.id_dm).filter(Boolean))];
    let dmMap = new Map();
    const supabase = getSupabaseClient();
    if (dmIds.length > 0 && supabase) {
        const { data: dms, error: dmsError } = await supabase
            .rpc('get_dms_campagne', {
                p_dm_ids: dmIds
            });
        
        if (dmsError) {
            console.error('❌ Errore nel caricamento DM:', dmsError);
        } else if (dms) {
            dms.forEach(dm => dmMap.set(dm.id, dm));
        }
    }

    // Carica tutte le sessioni attive per le campagne in batch
    const campagnaIds = campagne.map(c => c.id);
    const sessioniAttiveMap = new Map();
    if (campagnaIds.length > 0 && supabase) {
        try {
            const { data: sessioniAttive, error: sessioniError } = await supabase
                .from('sessioni')
                .select('campagna_id')
                .in('campagna_id', campagnaIds)
                .is('data_fine', null);
            
            if (!sessioniError && sessioniAttive) {
                sessioniAttive.forEach(s => sessioniAttiveMap.set(s.campagna_id, true));
            }
        } catch (error) {
            console.error('❌ Errore nel caricamento sessioni attive:', error);
        }
    }

    htmlContent += campagne.map(campagna => {
        // Verifica se l'utente corrente è il DM di questa campagna
        const isDM = currentUserId && campagna.id_dm === currentUserId;
        
        // Recupera il nome del DM
        const dm = dmMap.get(campagna.id_dm);
        const nomeDM = dm?.nome_utente || 'DM sconosciuto';
        
        // Calcola il numero di giocatori dall'array
        const numeroGiocatori = Array.isArray(campagna.giocatori) ? campagna.giocatori.length : 0;

        // Renderizza l'icona della campagna
        let iconaHTML = '';
        if (campagna.icona_type === 'image' && campagna.icona_data) {
            iconaHTML = `<img src="${escapeHtml(campagna.icona_data)}" alt="Icona campagna" class="campagna-icon-image">`;
        } else if (campagna.icona_type === 'predefined' && campagna.icona_name) {
            const selectedIcon = predefinedIcons.find(i => i.name === campagna.icona_name);
            if (selectedIcon) {
                iconaHTML = `<div class="campagna-icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${selectedIcon.svg}</svg></div>`;
            }
        }
        // Se non c'è icona, usa quella di default
        if (!iconaHTML) {
            const defaultIcon = predefinedIcons.find(i => i.name === 'dice');
            iconaHTML = `<div class="campagna-icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${defaultIcon.svg}</svg></div>`;
        }

        const isPreferito = campagna.isPreferito === true;
        return `
            <div class="campagna-card" 
                 data-campagna-id="${campagna.id}"
                 onclick="openCampagnaDetails('${campagna.id}')"
                 style="cursor: pointer;">
                <div class="campagna-header">
                    <div class="campagna-icon">${iconaHTML}</div>
                    <h3 class="campagna-title">${escapeHtml(campagna.nome_campagna || 'Senza nome')}</h3>
                    <div class="campagna-actions" onclick="event.stopPropagation();">
                        <button class="btn-star ${isPreferito ? 'starred' : ''}" 
                                onclick="togglePreferito('${campagna.id}')" 
                                aria-label="${isPreferito ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}"
                                title="${isPreferito ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}">
                            <svg viewBox="0 0 24 24" fill="${isPreferito ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                        </button>
                        ${isDM ? `
                        <button class="btn-icon" onclick="editCampagna('${campagna.id}')" aria-label="Modifica">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="deleteCampagna('${campagna.id}')" aria-label="Elimina">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                        ` : ''}
                    </div>
                </div>
                <div class="campagna-info">
                    <div class="info-item">
                        <span class="info-label">DM:</span>
                        <span class="info-value">${escapeHtml(nomeDM)}</span>
                    </div>
                    </div>
            </div>
        `;
    }).join('');

    elements.campagneList.innerHTML = htmlContent;
}

/**
 * Accetta un invito a una campagna
 */
window.accettaInvitoCampagna = async function(invitoId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Prima recupera i dati dell'invito per ottenere campagna_id
        const { data: invito, error: invitoError } = await supabase
            .from('inviti_campagna')
            .select('campagna_id')
            .eq('id', invitoId)
            .single();

        if (invitoError || !invito) {
            throw invitoError || new Error('Invito non trovato');
        }

        // Aggiorna lo stato dell'invito usando la funzione RPC
        const { error: updateError } = await supabase
            .rpc('update_invito_campagna_stato', {
                p_invito_id: invitoId,
                p_nuovo_stato: 'accepted'
            });

        if (updateError) throw updateError;

        // Il numero_giocatori viene calcolato dinamicamente contando gli inviti accettati
        // Non è più necessario incrementarlo manualmente

        showNotification('Invito accettato!');
        
        // Ricarica le campagne
        if (AppState.currentUser) {
            await loadCampagne(AppState.currentUser.uid);
        }
        
        // Se siamo nella pagina dettagli di questa campagna, ricarica i dettagli
        if (AppState.currentCampagnaId === invito.campagna_id) {
            await loadCampagnaDetails(invito.campagna_id);
        }
    } catch (error) {
        console.error('❌ Errore nell\'accettazione invito:', error);
        showNotification('Errore nell\'accettazione dell\'invito: ' + (error.message || error));
    }
};

/**
 * Rifiuta un invito a una campagna
 */
window.rifiutaInvitoCampagna = async function(invitoId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Aggiorna lo stato dell'invito usando la funzione RPC
        const { error } = await supabase
            .rpc('update_invito_campagna_stato', {
                p_invito_id: invitoId,
                p_nuovo_stato: 'rejected'
            });

        if (error) throw error;

        showNotification('Invito rifiutato');
        
        // Ricarica le campagne
        if (AppState.currentUser) {
            loadCampagne(AppState.currentUser.uid);
        }
    } catch (error) {
        console.error('❌ Errore nel rifiuto invito:', error);
        showNotification('Errore nel rifiuto dell\'invito');
    }
};

function formatTempoGioco(minuti) {
    if (minuti < 60) {
        return `00:${minuti.toString().padStart(2, '0')}`;
    }
    const ore = Math.floor(minuti / 60);
    const min = minuti % 60;
    // Se ore <= 99, usa formato hh:mm, altrimenti hhh:mm
    const oreStr = ore.toString().padStart(ore > 99 ? 3 : 2, '0');
    return `${oreStr}:${min.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Callback per i dialog personalizzati
let confirmDialogResolve = null;
let promptDialogResolve = null;

/**
 * Mostra un dialog di conferma personalizzato (sostituisce confirm())
 * @param {string} message - Messaggio da mostrare
 * @param {string} title - Titolo del dialog (default: "Conferma")
 * @returns {Promise<boolean>} - true se confermato, false se annullato
 */
function showConfirm(message, title = 'Conferma') {
    return new Promise((resolve) => {
        if (!elements.confirmDialogModal) {
            console.error('❌ confirmDialogModal non trovato');
            resolve(false);
            return;
        }

        // Imposta titolo e messaggio
        if (elements.confirmDialogTitle) {
            elements.confirmDialogTitle.textContent = title;
        }
        if (elements.confirmDialogMessage) {
            elements.confirmDialogMessage.textContent = message;
        }

        // Memorizza il resolve
        confirmDialogResolve = resolve;

        // Mostra modal
        elements.confirmDialogModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

/**
 * Chiude il dialog di conferma
 */
function closeConfirmDialog(result) {
    if (elements.confirmDialogModal) {
        elements.confirmDialogModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    if (confirmDialogResolve) {
        confirmDialogResolve(result);
        confirmDialogResolve = null;
    }
}

/**
 * Mostra un dialog di input personalizzato (sostituisce prompt())
 * @param {string} message - Messaggio da mostrare
 * @param {string} title - Titolo del dialog (default: "Input")
 * @param {string} defaultValue - Valore di default (default: "")
 * @returns {Promise<string|null>} - Valore inserito o null se annullato
 */
function showPrompt(message, title = 'Input', defaultValue = '') {
    return new Promise((resolve) => {
        if (!elements.editFieldModal) {
            console.error('❌ editFieldModal non trovato');
            resolve(null);
            return;
        }

        // Imposta titolo e label
        if (elements.editFieldModalTitle) {
            elements.editFieldModalTitle.textContent = title;
        }
        if (elements.editFieldLabel) {
            elements.editFieldLabel.textContent = message;
        }
        if (elements.editFieldInput) {
            elements.editFieldInput.value = defaultValue;
            elements.editFieldInput.type = 'text';
        }

        // Memorizza il resolve
        promptDialogResolve = resolve;

        // Mostra modal
        elements.editFieldModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Focus sull'input
        setTimeout(() => {
            if (elements.editFieldInput) {
                elements.editFieldInput.focus();
                elements.editFieldInput.select();
            }
        }, 100);
    });
}

/**
 * Chiude il dialog di input
 */
function closePromptDialog(result) {
    if (elements.editFieldModal) {
        elements.editFieldModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    if (promptDialogResolve) {
        promptDialogResolve(result);
        promptDialogResolve = null;
    }
}

// Supabase - Utenti Management
let initializingUsers = new Set(); // Traccia utenti in fase di inizializzazione per evitare chiamate multiple

/**
 * Genera un CID univoco a 4 cifre (1000-9999) usando la funzione SQL
 */
async function generateUniqueCid() {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
        console.error('❌ Supabase non disponibile per generare CID');
        // Fallback: genera un numero casuale
        return Math.floor(1000 + Math.random() * 9000);
    }
    
    try {
        // Usa la funzione SQL per generare un CID univoco
        const { data, error } = await supabase.rpc('generate_unique_cid');
        
        if (error) throw error;
        
        console.log('✅ CID generato dalla funzione SQL:', data);
        return data;
        } catch (error) {
        console.error('❌ Errore nella generazione CID, uso fallback:', error);
        // Fallback: genera un numero casuale
        return Math.floor(1000 + Math.random() * 9000);
    }
}

/**
 * Salva il nuovo nome utente
 */
async function handleSaveUserName() {
    if (!elements.editUserNameInput) return;
    
    const newName = elements.editUserNameInput.value.trim();
    if (!newName) {
        showNotification('Il nome utente non può essere vuoto');
        return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    if (!AppState.currentUser) {
        showNotification('Errore: utente non autenticato');
        return;
    }

    try {
        // Trova l'utente nella tabella utenti
        const utente = await findUserByUid(AppState.currentUser.uid);
        if (!utente) {
            showNotification('Errore: profilo utente non trovato');
            return;
        }

        // Aggiorna il nome utente
        const { error } = await supabase
            .from('utenti')
            .update({ nome_utente: newName })
            .eq('id', utente.id);

        if (error) throw error;

        // Aggiorna l'UI
        if (elements.userName) {
            elements.userName.textContent = newName;
        }
        if (elements.editUserNameForm) {
            elements.editUserNameForm.style.display = 'none';
        }
        if (elements.editUserNameInput) {
            elements.editUserNameInput.value = '';
        }

        showNotification('Nome utente aggiornato con successo!');
    } catch (error) {
        console.error('❌ Errore nell\'aggiornamento nome utente:', error);
        showNotification('Errore nell\'aggiornamento del nome utente: ' + (error.message || error));
    }
}

/**
 * Trova l'utente per uid
 */
async function findUserByUid(uid) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    
    try {
        // Verifica che l'utente sia autenticato
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.warn('⚠️ Nessuna sessione attiva per la query utente');
            return null;
        }
        
        // Usa maybeSingle per evitare errori se non trovato
        const { data, error } = await supabase
            .from('utenti')
            .select('*')
            .eq('uid', uid)
            .maybeSingle(); // maybeSingle ritorna null se non trova risultati invece di errore
        
        if (error) {
            // PGRST116 significa "nessun risultato", non è un errore critico
            if (error.code === 'PGRST116') {
        return null;
            }
            console.error('❌ Errore nella ricerca utente per uid:', error);
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error('❌ Errore nella ricerca utente per uid:', error);
        // Non lanciare l'errore, ritorna null per evitare crash
        return null;
    }
}

/**
 * Inizializza o aggiorna l'utente in Supabase
 */
async function initializeUserDocument(user) {
    console.log('🔧 Inizializzazione utente per:', user ? user.id : 'null');
    
    const supabase = getSupabaseClient();
    
    if (!supabase || !user) {
        console.error('❌ Supabase o utente non disponibile per inizializzare utente');
        return null;
    }
    
    // Evita inizializzazioni multiple simultanee per lo stesso utente
    if (initializingUsers.has(user.id)) {
        console.log('⚠️ Inizializzazione già in corso per questo utente, aspetto...');
        // Aspetta che l'inizializzazione corrente finisca
        let waitAttempts = 0;
        while (initializingUsers.has(user.id) && waitAttempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitAttempts++;
        }
        // Prova a caricare l'utente che dovrebbe essere stato creato
        return await findUserByUid(user.id);
    }
    
    initializingUsers.add(user.id);
    
    try {
        console.log('📄 Controllo utente esistente...');
        // Cerca l'utente per uid (user.id è l'UUID di Supabase Auth)
        const existingUser = await findUserByUid(user.id);
        
        const currentTheme = localStorage.getItem('theme') || 'light';
        const temaScuro = currentTheme === 'dark';
        const nomeUtente = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utente';
        
        if (existingUser) {
            console.log('✅ Utente già esistente, aggiorno...');
            // Utente esistente: aggiorna solo i campi che potrebbero essere cambiati
            const { data, error } = await supabase
                .from('utenti')
                .update({
                email: user.email,
                nome_utente: nomeUtente,
                tema_scuro: temaScuro
                })
                .eq('uid', user.id)
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ Utente aggiornato');
            
            // Carica i dati utente per applicare il tema
            await loadUserData(user.id);
            
            return data;
        } else {
            console.log('🆕 Nuovo utente, creo record...');
            // Nuovo utente: crea record completo
            console.log('🔢 Generazione CID...');
            let cid;
            try {
                cid = await generateUniqueCid();
                console.log('✅ CID generato:', cid);
            } catch (cidError) {
                console.error('❌ Errore nella generazione CID, uso fallback:', cidError);
                // Fallback: genera un CID senza verificare l'unicità
                cid = Math.floor(1000 + Math.random() * 9000);
                console.log('⚠️ Usando CID fallback:', cid);
            }
            
            const userData = {
                uid: user.id, // UUID di Supabase Auth
                cid: cid,
                nome_utente: nomeUtente,
                email: user.email,
                tema_scuro: temaScuro
            };
            
            console.log('💾 Salvataggio utente...');
            console.log('📋 Dati:', userData);
            
            // Usa upsert che gestisce automaticamente insert/update
            // onConflict su uid (chiave primaria per identificare l'utente)
            let attempts = 0;
            let data = null;
            let error = null;
            
            while (attempts < 3) {
                const result = await supabase
                    .from('utenti')
                    .upsert(userData, {
                        onConflict: 'uid'
                    })
                    .select()
                    .single();
                
                data = result.data;
                error = result.error;
                
                if (!error) {
                    break; // Successo
                }
                
                // Se è un errore di chiave duplicata, aspetta un po' e riprova
                if (error.code === '23505') {
                    attempts++;
                    if (attempts < 3) {
                        console.log(`⚠️ Conflitto chiave duplicata, tentativo ${attempts + 1}/3...`);
                        await new Promise(resolve => setTimeout(resolve, 200));
                        // Prova a caricare l'utente esistente
                        const existingUser = await findUserByUid(user.id);
                        if (existingUser) {
                            // Usa i dati esistenti e aggiorna solo i campi necessari
                            const updateData = {
                                email: user.email,
                                nome_utente: nomeUtente,
                                tema_scuro: temaScuro
                            };
                            const updateResult = await supabase
                                .from('utenti')
                                .update(updateData)
                                .eq('uid', user.id)
                                .select()
                                .single();
                            
                            if (!updateResult.error && updateResult.data) {
                                data = updateResult.data;
                                error = null;
                                break;
                            }
                        }
                        continue;
                    }
                }
                break; // Errore diverso o troppi tentativi
            }
            
            if (error) {
                console.error('❌ Errore nell\'upsert utente dopo', attempts, 'tentativi:', error);
                throw error;
            }
            
            console.log('✅ Utente creato/aggiornato con successo, CID:', data?.cid || cid);
            
            // Piccolo delay per assicurarsi che il database sia aggiornato
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Applica il tema
            if (temaScuro) {
                setTheme('dark', false); // false = non salvare di nuovo in localStorage
            } else {
                setTheme('light', false);
            }
            
            return data;
        }
    } catch (error) {
        console.error('❌ Errore nell\'inizializzazione utente:', error);
        console.error('Messaggio errore:', error.message);
        
        showNotification('⚠️ Errore nell\'inizializzazione profilo. Controlla la console per i dettagli.');
        
        return null;
    } finally {
        // Rimuovi l'utente dal set di inizializzazione
        initializingUsers.delete(user.id);
    }
}

// ============================================================================
// AMICI MANAGEMENT (Network)
// ============================================================================

// Variabile per tenere traccia dell'utente cercato
let searchedUser = null;

/**
 * Apre il modal per aggiungere un amico
 */
function openAddAmicoModal() {
    if (!AppState.isLoggedIn) {
        showNotification('Devi essere loggato per aggiungere amici');
        openLoginModal();
        return;
    }
    
    if (!elements.addAmicoModal || !elements.addAmicoForm) {
        console.error('❌ addAmicoModal o addAmicoForm non trovati');
        return;
    }
    
    // Reset form e risultato ricerca
    elements.addAmicoForm.reset();
    const searchResult = document.getElementById('searchUserResult');
    if (searchResult) {
        searchResult.style.display = 'none';
    }
    searchedUser = null;
    
    elements.addAmicoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Chiude il modal per aggiungere un amico
 */
function closeAddAmicoModal() {
    if (!elements.addAmicoModal) return;
    elements.addAmicoModal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset
    if (elements.addAmicoForm) {
        elements.addAmicoForm.reset();
    }
    const searchResult = document.getElementById('searchUserResult');
    if (searchResult) {
        searchResult.style.display = 'none';
    }
    searchedUser = null;
}

/**
 * Cerca un utente per nome e CID
 */
async function handleCercaUtente(e) {
    e.preventDefault();
    
    const nome = document.getElementById('amicoNome').value.trim();
    const cid = parseInt(document.getElementById('amicoCID').value);
    
    if (!nome || !cid || cid < 1000 || cid > 9999) {
        showNotification('Inserisci un nome valido e un CID compreso tra 1000 e 9999');
        return;
    }
    
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }
    
    try {
        // Cerca l'utente per nome e CID usando una funzione SQL che bypassa RLS
        const { data, error } = await supabase
            .rpc('search_user_by_name_and_cid', {
                search_nome: nome,
                search_cid: cid
            })
            .maybeSingle();
        
        if (error) {
            console.error('❌ Errore nella ricerca utente:', error);
            throw error;
        }
        
        if (!data) {
            showNotification('Utente non trovato. Verifica nome e CID.');
            const searchResult = document.getElementById('searchUserResult');
            if (searchResult) {
                searchResult.style.display = 'none';
            }
            searchedUser = null;
            return;
        }
        
        // Verifica che non sia se stesso
        const currentUser = await findUserByUid(AppState.currentUser.uid);
        if (currentUser && currentUser.id === data.id) {
            showNotification('Non puoi inviare richieste di amicizia a te stesso!');
            const searchResult = document.getElementById('searchUserResult');
            if (searchResult) {
                searchResult.style.display = 'none';
            }
            searchedUser = null;
            return;
        }
        
        // Verifica se esiste già una richiesta (in entrambe le direzioni)
        // Query 1: richiesta da currentUser a data.id
        const { data: request1, error: error1 } = await supabase
            .from('richieste_amicizia')
            .select('*')
            .eq('richiedente_id', currentUser.id)
            .eq('destinatario_id', data.id)
            .maybeSingle();
        
        if (error1) throw error1;
        
        // Query 2: richiesta da data.id a currentUser
        const { data: request2, error: error2 } = await supabase
            .from('richieste_amicizia')
            .select('*')
            .eq('richiedente_id', data.id)
            .eq('destinatario_id', currentUser.id)
            .maybeSingle();
        
        if (error2) throw error2;
        
        const existingRequest = request1 || request2;
        
        searchedUser = data;
        const searchUserInfo = document.getElementById('searchUserInfo');
        const searchResult = document.getElementById('searchUserResult');
        
        if (searchUserInfo && searchResult) {
            let statusText = '';
            if (existingRequest) {
                if (existingRequest.stato === 'accepted') {
                    statusText = '<p style="color: var(--accent); margin-top: 0.5rem;">Già amico!</p>';
                } else if (existingRequest.stato === 'pending') {
                    if (existingRequest.richiedente_id === currentUser.id) {
                        statusText = '<p style="color: var(--text-secondary); margin-top: 0.5rem;">Richiesta già inviata</p>';
        } else {
                        statusText = '<p style="color: var(--text-secondary); margin-top: 0.5rem;">Hai già una richiesta da questo utente</p>';
                    }
                } else if (existingRequest.stato === 'rejected') {
                    statusText = '<p style="color: var(--text-secondary); margin-top: 0.5rem;">Richiesta precedentemente rifiutata</p>';
                }
            }
            
            searchUserInfo.innerHTML = `
                <p><strong>${data.nome_utente}</strong> (CID: ${data.cid})</p>
                ${statusText}
            `;
            
            // Mostra/nascondi pulsante invita
            const invitaBtn = document.getElementById('invitaAmicoBtn');
            if (invitaBtn) {
                if (existingRequest && (existingRequest.stato === 'accepted' || existingRequest.stato === 'pending')) {
                    invitaBtn.style.display = 'none';
                } else {
                    invitaBtn.style.display = 'block';
                    invitaBtn.textContent = existingRequest && existingRequest.stato === 'rejected' ? 'Invia nuovamente' : 'Invia Richiesta';
                }
            }
            
            searchResult.style.display = 'block';
        }
    } catch (error) {
        console.error('❌ Errore nella ricerca utente:', error);
        showNotification('Errore nella ricerca utente. Riprova.');
    }
}

/**
 * Invia una richiesta di amicizia
 */
async function handleInvitaAmico(e) {
    e.preventDefault();
    
    if (!searchedUser) {
        showNotification('Cerca prima un utente');
        return;
    }
    
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }
    
    try {
        const currentUser = await findUserByUid(AppState.currentUser.uid);
        if (!currentUser) {
            showNotification('Errore: utente corrente non trovato');
            return;
        }
        
        // Invia la richiesta (usando upsert per gestire anche il caso di richiesta rifiutata precedentemente)
        const { data, error } = await supabase
            .from('richieste_amicizia')
            .upsert({
                richiedente_id: currentUser.id,
                destinatario_id: searchedUser.id,
                stato: 'pending'
            }, {
                onConflict: 'richiedente_id,destinatario_id'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        showNotification(`Richiesta di amicizia inviata a ${searchedUser.nome_utente}!`);
        closeAddAmicoModal();
        
        // Ricarica gli amici per mostrare eventuali aggiornamenti
        if (AppState.currentPage === 'amici') {
            loadAmici();
        }
    } catch (error) {
        console.error('❌ Errore nell\'invio richiesta amicizia:', error);
        if (error.code === '23505') {
            showNotification('Richiesta già esistente');
        } else {
            showNotification('Errore nell\'invio della richiesta. Riprova.');
        }
    }
}

/**
 * Accetta una richiesta di amicizia (esposta globalmente per onclick)
 */
window.acceptFriendRequest = async function(requestId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
            return;
        }
        
    try {
        const { error } = await supabase
            .from('richieste_amicizia')
            .update({ stato: 'accepted' })
            .eq('id', requestId);
        
        if (error) throw error;
        
        showNotification('Richiesta di amicizia accettata!');
        loadAmici();
    } catch (error) {
        console.error('❌ Errore nell\'accettazione richiesta:', error);
        showNotification('Errore nell\'accettazione della richiesta. Riprova.');
    }
}

/**
 * Rifiuta una richiesta di amicizia (esposta globalmente per onclick)
 */
window.rejectFriendRequest = async function(requestId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('richieste_amicizia')
            .update({ stato: 'rejected' })
            .eq('id', requestId);
        
        if (error) throw error;
        
        showNotification('Richiesta di amicizia rifiutata');
        loadAmici();
    } catch (error) {
        console.error('❌ Errore nel rifiuto richiesta:', error);
        showNotification('Errore nel rifiuto della richiesta. Riprova.');
    }
}

/**
 * Rimuove un amico dalla lista (esposta globalmente per onclick)
 */
window.rimuoviAmico = async function(amicoId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    const confirmed = await showConfirm('Sei sicuro di voler rimuovere questo amico?', 'Rimuovi Amico');
    if (!confirmed) {
        return;
    }

    try {
        const currentUser = await findUserByUid(AppState.currentUser.uid);
        if (!currentUser) {
            showNotification('Errore: utente corrente non trovato');
            return;
        }

        // Elimina la richiesta di amicizia accettata (in entrambe le direzioni possibili)
        const { error } = await supabase
            .from('richieste_amicizia')
            .delete()
            .eq('stato', 'accepted')
            .or(`and(richiedente_id.eq.${currentUser.id},destinatario_id.eq.${amicoId}),and(richiedente_id.eq.${amicoId},destinatario_id.eq.${currentUser.id})`);

        if (error) throw error;

        showNotification('Amico rimosso');
        
        // Ricarica gli amici
        if (AppState.currentUser) {
            await loadAmici();
        }
    } catch (error) {
        console.error('❌ Errore nella rimozione amico:', error);
        showNotification('Errore nella rimozione dell\'amico');
    }
};

/**
 * Carica e visualizza gli amici e le richieste
 */
async function loadAmici() {
    if (!AppState.isLoggedIn || !AppState.currentUser) {
        return;
    }
    
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error('❌ Supabase non disponibile');
        return;
    }
    
    try {
        const currentUser = await findUserByUid(AppState.currentUser.uid);
        if (!currentUser) {
            console.error('❌ Utente corrente non trovato');
            return;
        }
        
        console.log('🔍 Caricamento richieste amicizia per utente:', currentUser.id);
        
        // Usa le funzioni SQL per ottenere i dati (bypassano RLS)
        const [amiciResult, richiesteEntrataResult, richiesteUscitaResult] = await Promise.all([
            supabase.rpc('get_amici'),
            supabase.rpc('get_richieste_in_entrata'),
            supabase.rpc('get_richieste_in_uscita')
        ]);
        
        if (amiciResult.error) {
            console.error('❌ Errore nel caricamento amici:', amiciResult.error);
        }
        if (richiesteEntrataResult.error) {
            console.error('❌ Errore nel caricamento richieste in entrata:', richiesteEntrataResult.error);
        }
        if (richiesteUscitaResult.error) {
            console.error('❌ Errore nel caricamento richieste in uscita:', richiesteUscitaResult.error);
        }
        
        // Formatta i dati degli amici
        const amici = (amiciResult.data || []).map(row => ({
            id: row.amico_id,
            nome_utente: row.nome_utente,
            cid: row.cid,
            email: row.email
        }));
        
        // Formatta le richieste in entrata
        const richiesteInEntrata = (richiesteEntrataResult.data || []).map(row => ({
            id: row.richiesta_id,
            utente: {
                id: row.richiedente_id,
                nome_utente: row.nome_utente,
                cid: row.cid,
                email: row.email
            }
        }));
        
        // Formatta le richieste in uscita
        const richiesteInUscita = (richiesteUscitaResult.data || []).map(row => ({
            id: row.richiesta_id,
            utente: {
                id: row.destinatario_id,
                nome_utente: row.nome_utente,
                cid: row.cid,
                email: row.email
            }
        }));
        
        console.log('✅ Amici caricati:', amici.length, 'Richieste in entrata:', richiesteInEntrata.length, 'Richieste in uscita:', richiesteInUscita.length);
        
        // Renderizza
        renderAmici(amici, richiesteInEntrata, richiesteInUscita);
    } catch (error) {
        console.error('❌ Errore nel caricamento amici:', error);
        console.error('Dettagli errore:', error.message, error.code);
        showNotification('Errore nel caricamento degli amici. Riprova.');
        // Mostra comunque il placeholder
        renderAmici([], [], []);
    }
}

/**
 * Renderizza amici e richieste nella UI
 */
function renderAmici(amici, richiesteInEntrata, richiesteInUscita) {
    const amiciPlaceholder = document.getElementById('amiciPlaceholder');
    const amiciList = elements.amiciList;
    const richiesteInEntrataList = elements.richiesteInEntrataList;
    const richiesteInEntrataSection = elements.richiesteInEntrataSection;
    
    // Gestisci richieste in entrata
    if (richiesteInEntrataSection) {
        if (richiesteInEntrata.length > 0) {
            richiesteInEntrataSection.style.display = 'block';
            if (richiesteInEntrataList) {
                richiesteInEntrataList.innerHTML = richiesteInEntrata.map(req => `
                    <div class="amico-item">
                        <div class="amico-info">
                            <div class="amico-avatar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <div>
                                <p class="amico-nome">${req.utente?.nome_utente || 'Utente'}</p>
                                <p class="amico-cid">CID: ${req.utente?.cid || ''}</p>
                            </div>
                        </div>
                        <div class="amico-actions">
                            <button class="btn-icon-amico btn-accept" onclick="acceptFriendRequest('${req.id}')" aria-label="Accetta richiesta" title="Accetta richiesta">
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </button>
                            <button class="btn-icon-amico btn-reject" onclick="rejectFriendRequest('${req.id}')" aria-label="Rifiuta richiesta" title="Rifiuta richiesta">
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            richiesteInEntrataSection.style.display = 'none';
        }
    }
    
    // Gestisci lista amici
    if (amici.length === 0 && richiesteInEntrata.length === 0 && richiesteInUscita.length === 0) {
        // Nessun amico e nessuna richiesta
        if (amiciPlaceholder) {
            amiciPlaceholder.style.display = 'block';
            amiciPlaceholder.innerHTML = '<p>Non hai amici. Tempo di unirsi a una gioiosa cooperazione!</p>';
        }
        if (amiciList) {
            amiciList.style.display = 'none';
        }
    } else {
        if (amiciPlaceholder) {
            amiciPlaceholder.style.display = 'none';
        }
        if (amiciList) {
            amiciList.style.display = 'grid';
            amiciList.innerHTML = amici.map(amico => `
                <div class="amico-item">
                    <div class="amico-info">
                        <div class="amico-avatar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div>
                            <p class="amico-nome">${amico.nome_utente || 'Utente'}</p>
                            <p class="amico-cid">CID: ${amico.cid || ''}</p>
                        </div>
                    </div>
                    <div class="amico-actions">
                        <button class="btn-icon-remove" onclick="rimuoviAmico('${amico.id}')" aria-label="Rimuovi amico" title="Rimuovi amico">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
}

/**
 * Carica i dati utente da Supabase e applica le preferenze (es. tema)
 */
async function loadUserData(userId) {
    const supabase = getSupabaseClient();
    
    if (!supabase || !userId) {
        console.warn('⚠️ Supabase o userId non disponibile per caricare dati utente');
        return null;
    }
    
    try {
        const userData = await findUserByUid(userId);
        
        if (userData) {
            console.log('✅ Dati utente caricati:', userData);
            
            // Applica il tema se presente
            if (userData.tema_scuro !== undefined) {
                const theme = userData.tema_scuro ? 'dark' : 'light';
                setTheme(theme, false); // false = non salvare in localStorage (già salvato in Supabase)
                // Aggiorna localStorage per coerenza
                localStorage.setItem('theme', theme);
            }
            
            return userData;
        } else {
            console.warn('⚠️ Utente non trovato per:', userId);
            return null;
        }
    } catch (error) {
        console.error('❌ Errore nel caricamento dati utente:', error);
        return null;
    }
}

function openCampagnaModal(campagnaId = null) {
    // Verifica che l'utente sia loggato
    if (!AppState.isLoggedIn) {
        showNotification('Devi essere loggato per creare una campagna');
        // Apri il modal di login invece
        openLoginModal();
        return;
    }
    
    editingCampagnaId = campagnaId;
    
    if (!elements.campagnaModal || !elements.campagnaForm) {
        console.error('❌ campagnaModal o campagnaForm non trovati');
        return;
    }

    console.log('📝 Apertura modal campagna, editingCampagnaId:', editingCampagnaId);

    // Reset form
    elements.campagnaForm.reset();
    
    // Reset icon preview
    resetIconPreview();
    
    // For now, we only support creating new campaigns (simple form)
    // Editing will be handled separately if needed
    const modalTitle = document.querySelector('#campagnaModal h2');
    if (modalTitle) {
        modalTitle.textContent = 'Nuova Campagna';
    }

    elements.campagnaModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('✅ Modal campagna aperta');
}

function openIconSelectorModal() {
    if (elements.iconSelectorModal) {
        elements.iconSelectorModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('✅ Icon selector modal aperto');
    }
}

function closeIconSelectorModal() {
    if (elements.iconSelectorModal) {
        elements.iconSelectorModal.classList.remove('active');
        document.body.style.overflow = '';
        console.log('✅ Icon selector modal chiuso');
    }
}

function closeCampagnaModal() {
    if (!elements.campagnaModal) return;
    elements.campagnaModal.classList.remove('active');
    document.body.style.overflow = '';
    editingCampagnaId = null;
    if (elements.campagnaForm) {
        elements.campagnaForm.reset();
    }
    resetIconPreview();
}

// Icon Selector Functions
const predefinedIcons = [
    { name: 'dice', svg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="9" cy="9" r="1"></circle><circle cx="15" cy="9" r="1"></circle><circle cx="9" cy="15" r="1"></circle><circle cx="15" cy="15" r="1"></circle><circle cx="12" cy="12" r="1"></circle>' },
    { name: 'sword', svg: '<path d="M6 18L18 6M6 6l12 12"></path>' },
    { name: 'castle', svg: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><line x1="9" y1="8" x2="15" y2="8"></line><line x1="9" y1="12" x2="15" y2="12"></line><line x1="9" y1="16" x2="15" y2="16"></line>' },
    { name: 'shield', svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>' },
    { name: 'book', svg: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>' },
    { name: 'star', svg: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>' },
    { name: 'fire', svg: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>' },
    { name: 'moon', svg: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' },
    { name: 'sun', svg: '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' },
    { name: 'treasure', svg: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' },
    { name: 'skull', svg: '<circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><path d="M8 20v2h8v-2"></path><path d="M12 20v2"></path><path d="M8 18v-2a4 4 0 0 1 8 0v2"></path>' },
    { name: 'cross', svg: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>' }
];

let selectedIconName = 'dice';
let uploadedImageData = null;

function setupIconSelector() {
    const iconGrid = document.getElementById('iconGrid');
    const iconUpload = document.getElementById('iconUpload');
    const iconUploadArea = document.getElementById('iconUploadArea');
    
    if (!iconGrid) {
        console.error('❌ iconGrid non trovato');
        return;
    }
    
    // Populate icon grid
    predefinedIcons.forEach((icon, index) => {
        const iconOption = document.createElement('div');
        iconOption.className = 'icon-option';
        if (index === 0) iconOption.classList.add('selected');
        iconOption.dataset.iconName = icon.name;
        iconOption.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.svg}</svg>`;
        iconOption.addEventListener('click', () => selectPredefinedIcon(icon.name));
        iconGrid.appendChild(iconOption);
    });
    
    // Handle file input change
    if (iconUpload) {
        iconUpload.addEventListener('change', (e) => {
            handleImageUpload(e.target.files[0]);
        });
    }
    
    // Setup drag and drop
    if (iconUploadArea) {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            iconUploadArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            iconUploadArea.addEventListener(eventName, () => {
                iconUploadArea.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            iconUploadArea.addEventListener(eventName, () => {
                iconUploadArea.classList.remove('drag-over');
            }, false);
        });

        // Handle dropped files
        iconUploadArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                handleImageUpload(files[0]);
            }
        }, false);
    }
    
    // Set default icon
    selectPredefinedIcon('dice');
}

function handleImageUpload(file) {
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
        showNotification('Per favore seleziona un file immagine.');
        return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showNotification('L\'immagine è troppo grande. Massimo 2MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        uploadedImageData = event.target.result;
        
        // Deselect all predefined icons
        document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
        
        // Update preview (this will also update the icon name display)
        updateIconPreview();
        
        // Update icon name display with file name
        const iconNameDisplay = document.getElementById('iconNameDisplay');
        if (iconNameDisplay) {
            // Show file name without extension
            const fileName = file.name.replace(/\.[^/.]+$/, '');
            iconNameDisplay.textContent = fileName || file.name;
        }
    };
    reader.readAsDataURL(file);
}

function selectPredefinedIcon(iconName) {
    selectedIconName = iconName;
    uploadedImageData = null; // Clear uploaded image when selecting predefined icon
    
    // Update selected state
    document.querySelectorAll('.icon-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.iconName === iconName);
    });
    
    // Reset file input
    const iconUpload = document.getElementById('iconUpload');
    if (iconUpload) {
        iconUpload.value = '';
    }
    
    updateIconPreview();
    
    // Close icon selector modal after selection
    closeIconSelectorModal();
}

// Icon name mapping for display
const iconNameMap = {
    'dice': 'Dado',
    'sword': 'Spada',
    'shield': 'Scudo',
    'book': 'Libro',
    'star': 'Stella',
    'fire': 'Fuoco',
    'moon': 'Luna',
    'sun': 'Sole',
    'treasure': 'Tesoro',
    'skull': 'Teschio',
    'cross': 'Croce'
};

function updateIconPreview() {
    const iconDisplay = document.getElementById('iconDisplay');
    const iconImageDisplay = document.getElementById('iconImageDisplay');
    const iconaCampagna = document.getElementById('iconaCampagna');
    const iconNameDisplay = document.getElementById('iconNameDisplay');
    
    if (!iconDisplay || !iconImageDisplay) return;
    
    // Show uploaded image if available, otherwise show predefined icon
    if (uploadedImageData) {
        iconDisplay.style.display = 'none';
        iconImageDisplay.style.display = 'block';
        iconImageDisplay.src = uploadedImageData;
        
        if (iconaCampagna) {
            iconaCampagna.value = uploadedImageData; // Store as data URL
        }
    } else {
        iconDisplay.style.display = 'block';
        iconImageDisplay.style.display = 'none';
        
        const selectedIcon = predefinedIcons.find(i => i.name === selectedIconName);
        if (selectedIcon) {
            iconDisplay.innerHTML = selectedIcon.svg;
            
            // Update icon name display
            if (iconNameDisplay) {
                const displayName = iconNameMap[selectedIconName] || selectedIcon.name.charAt(0).toUpperCase() + selectedIcon.name.slice(1);
                iconNameDisplay.textContent = displayName;
            }
            
            if (iconaCampagna) {
                iconaCampagna.value = selectedIconName; // Store icon name
            }
        }
    }
}

function resetIconPreview() {
    selectedIconName = 'dice';
    uploadedImageData = null;
    
    // Reset file input
    const iconUpload = document.getElementById('iconUpload');
    if (iconUpload) {
        iconUpload.value = '';
    }
    
    // Select first icon
    document.querySelectorAll('.icon-option').forEach((opt, index) => {
        opt.classList.toggle('selected', index === 0);
    });
    
    updateIconPreview();
}

async function handleCampagnaSubmit(e) {
    e.preventDefault();
    
    if (!AppState.isLoggedIn) {
        showNotification('Devi essere loggato per creare una campagna');
        return;
    }

    const supabase = getSupabaseClient();
    
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    // Verifica che l'utente sia autenticato
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
        showNotification('Errore: utente non autenticato');
        return;
    }

    // Trova l'utente nella tabella utenti per ottenere l'ID
    const utente = await findUserByUid(session.user.id);
    if (!utente) {
        showNotification('Errore: profilo utente non trovato');
        return;
    }

    // Get icon data
    const iconaType = uploadedImageData ? 'image' : 'predefined';
    const iconaName = selectedIconName || null;
    const iconaData = uploadedImageData || null;

    const nomeCampagna = document.getElementById('nomeCampagna').value.trim();
    if (!nomeCampagna) {
        showNotification('Inserisci un nome per la campagna');
        return;
    }

    const campagnaData = {
        nome_campagna: nomeCampagna,
        icona_type: iconaType,
        icona_name: iconaName,
        icona_data: iconaData,
        id_dm: utente.id, // Imposta l'ID del DM (foreign key verso utenti)
        giocatori: [], // Array vuoto: il creatore è il DM, quindi non è nella lista giocatori
        numero_sessioni: 0,
        tempo_di_gioco: 0,
        note: []
    };

    try {
        if (editingCampagnaId) {
            // Update existing campagna
            const { error } = await supabase
                .from('campagne')
                .update(campagnaData)
                .eq('id', editingCampagnaId);
            
            if (error) throw error;
            showNotification('Campagna aggiornata con successo!');
        } else {
            // Create new campagna
            const { error } = await supabase
                .from('campagne')
                .insert(campagnaData);
            
            if (error) {
                // Se è un errore di unique constraint, significa che esiste già una campagna con questo nome
                if (error.code === '23505') {
                    throw new Error('Esiste già una campagna con questo nome');
                }
                throw error;
            }
            showNotification('Campagna creata con successo!');
        }
        closeCampagnaModal();
        
        // Ricarica le campagne dopo creazione/modifica
        if (session?.user) {
            loadCampagne(session.user.id);
        }
    } catch (error) {
        console.error('Errore nel salvataggio campagna:', error);
        showNotification('Errore nel salvataggio della campagna: ' + (error.message || error));
    }
}

// Global functions for inline onclick handlers
window.editCampagna = function(campagnaId) {
    openCampagnaModal(campagnaId);
};

window.openCampagnaDetails = function(campagnaId) {
    // Salva l'ID della campagna corrente
    AppState.currentCampagnaId = campagnaId;
    // Salva nel localStorage per persistenza al refresh
    localStorage.setItem('currentCampagnaId', campagnaId);
    navigateToPage('dettagli');
};

/**
 * Carica e mostra i dettagli di una campagna
 */
async function loadCampagnaDetails(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Carica i dati della campagna
        const { data: campagna, error } = await supabase
            .from('campagne')
            .select('*')
            .eq('id', campagnaId)
            .single();

        if (error) throw error;
        if (!campagna) {
            showNotification('Campagna non trovata');
        return;
    }

        // Mostra icona e nome
        renderCampagnaDetailsHeader(campagna);

        // Mostra tutti i dettagli della campagna (ora async)
        await renderCampagnaDetailsContent(campagna);
    } catch (error) {
        console.error('❌ Errore nel caricamento dettagli campagna:', error);
        showNotification('Errore nel caricamento dei dettagli della campagna');
    }
}

/**
 * Renderizza il contenuto dei dettagli campagna
 */
async function renderCampagnaDetailsContent(campagna) {
    const dataCreazione = campagna.data_creazione ? 
        new Date(campagna.data_creazione).toLocaleDateString('it-IT') : 
        'N/A';
    const tempoGioco = campagna.tempo_di_gioco ? 
        formatTempoGioco(campagna.tempo_di_gioco) : 
        '0 min';
    const note = campagna.note && Array.isArray(campagna.note) && campagna.note.length > 0 ? 
        campagna.note.join(', ') : 
        'Nessuna nota';

    // Verifica se l'utente corrente è il DM (usa la funzione che fa una query fresca al DB)
    const supabase = getSupabaseClient();
    let isDM = false;
    let giocatoriCampagna = [];
    let nomeDM = 'DM sconosciuto';
    let numeroGiocatori = 0;
    
    if (supabase && AppState.currentUser) {
        try {
            // Usa la funzione isCurrentUserDM che fa una query fresca al database
            isDM = await isCurrentUserDM(campagna.id);
            console.log('🔍 Verifica DM per campagna', campagna.id, '- isDM:', isDM);
            
            // Carica i dati del DM usando la funzione RPC (bypassa RLS)
            if (campagna.id_dm) {
                const { data: dmData, error: dmError } = await supabase
                    .rpc('get_dm_campagna', {
                        p_campagna_id: campagna.id
                    });
                
                if (dmError) {
                    console.error('❌ Errore nel caricamento DM:', dmError);
                } else if (dmData && dmData.length > 0) {
                    nomeDM = dmData[0].nome_utente || 'DM sconosciuto';
                }
            }
            
            // Calcola il numero di giocatori dall'array
            numeroGiocatori = Array.isArray(campagna.giocatori) ? campagna.giocatori.length : 0;
            
            // Carica i dettagli dei giocatori se l'array non è vuoto
            if (campagna.giocatori && campagna.giocatori.length > 0) {
                const { data: giocatoriData } = await supabase
                    .from('utenti')
                    .select('id, nome_utente, cid')
                    .in('id', campagna.giocatori);
                
                if (giocatoriData) {
                    // Mappa i giocatori con i loro inviti per poterli rimuovere
                    const { data: inviti } = await supabase
                        .from('inviti_campagna')
                        .select('id, invitato_id')
                        .eq('campagna_id', campagna.id)
                        .in('invitato_id', campagna.giocatori)
                        .eq('stato', 'accepted');
                    
                    const invitiMap = new Map();
                    if (inviti) {
                        inviti.forEach(inv => invitiMap.set(inv.invitato_id, inv.id));
                    }
                    
                    giocatoriCampagna = giocatoriData.map(giocatore => ({
                        ...giocatore,
                        invitoId: invitiMap.get(giocatore.id)
                    }));
                }
            }
            
        } catch (error) {
            console.error('❌ Errore nel caricamento dati campagna:', error);
        }
    }

    // Renderizza azioni rapide nell'header
    const dettagliActionsElement = document.getElementById('dettagliActions');
    if (dettagliActionsElement) {
        // Verifica se c'è una sessione attiva (sia per DM che giocatori)
        const sessioneAttiva = await checkSessioneAttiva(campagna.id);
        
        if (isDM) {
            dettagliActionsElement.innerHTML = `
                <div class="dettagli-actions-top">
                    <button class="btn-secondary btn-small" onclick="editCampagna('${campagna.id}')" aria-label="Modifica campagna">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 4px;">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Modifica
                    </button>
                    <button class="btn-danger btn-small" onclick="deleteCampagna('${campagna.id}')" aria-label="Elimina campagna">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 4px;">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Elimina
                    </button>
                </div>
                <div class="dettagli-actions-start">
                    ${sessioneAttiva ? `
                    <button class="btn-primary btn-small" onclick="openSessionePage('${campagna.id}')" aria-label="Vai alla sessione">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 4px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        Sessione Attiva
                    </button>
                    ` : `
                    <button class="btn-primary btn-small btn-start-session" onclick="iniziaSessione('${campagna.id}')" aria-label="Inizia sessione">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 4px;">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        Inizia Sessione
                    </button>
                    `}
                </div>
            `;
        } else {
            // Per i giocatori, mostra solo il bottone "Sessione Attiva" se c'è una sessione attiva
            if (sessioneAttiva) {
                dettagliActionsElement.innerHTML = `
                    <div class="dettagli-actions-start">
                        <button class="btn-primary btn-small" onclick="openSessionePage('${campagna.id}')" aria-label="Vai alla sessione">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 4px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Sessione Attiva
                        </button>
                    </div>
                `;
            } else {
                dettagliActionsElement.innerHTML = '';
            }
        }
    }

    if (elements.dettagliCampagnaContent) {
        elements.dettagliCampagnaContent.innerHTML = `
            <!-- Sezione Informazioni Principali -->
            <div class="dettagli-section dettagli-main-info">
                <h2 class="dettagli-section-title">Informazioni</h2>
                <div class="dettagli-info-grid">
                    <div class="info-item">
                        <span class="info-label">DM:</span>
                        <span class="info-value" id="dmValue">${escapeHtml(nomeDM)}</span>
                        ${isDM ? `<button class="btn-icon-small" onclick="editDMField('${campagna.id}')" aria-label="Modifica DM">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>` : '<span></span>'}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Giocatori:</span>
                        <span class="info-value" id="giocatoriValue">${numeroGiocatori}</span>
                        ${isDM ? `<button class="btn-icon-small" onclick="openInvitaGiocatoriModal('${campagna.id}')" aria-label="Gestisci giocatori">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>` : '<span></span>'}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Creata il:</span>
                        <span class="info-value">${dataCreazione}</span>
                        ${isDM ? `<button class="btn-icon-small" onclick="editDataCreazione('${campagna.id}')" aria-label="Modifica data creazione">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>` : '<span></span>'}
                    </div>
                </div>
            </div>

            <!-- Sezione Statistiche -->
            <div class="dettagli-section dettagli-stats">
                <h2 class="dettagli-section-title">Statistiche</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-content">
                            <span class="stat-label">Sessioni</span>
                            <span class="stat-value" id="sessioniValue">${campagna.numero_sessioni || 0}</span>
                        </div>
                        ${isDM ? `<button class="btn-icon-small stat-edit" onclick="editNumeroSessioni('${campagna.id}')" aria-label="Modifica numero sessioni">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>` : ''}
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-content">
                            <span class="stat-label">Tempo di gioco</span>
                            <span class="stat-value" id="tempoGiocoValue">${tempoGioco}</span>
                        </div>
                        ${isDM ? `<button class="btn-icon-small stat-edit" onclick="editTempoGioco('${campagna.id}')" aria-label="Modifica tempo di gioco">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>` : ''}
                    </div>
                </div>
            </div>

            <!-- Sezione Note -->
            ${note !== 'Nessuna nota' ? `
            <div class="dettagli-section dettagli-notes-section">
                <h2 class="dettagli-section-title">Note</h2>
                <div class="dettagli-notes-content">
                    ${escapeHtml(note)}
                </div>
            </div>
            ` : ''}
        `;

        // Salva i dati della campagna nello state per uso futuro
        AppState.currentCampagnaDetails = campagna;
        AppState.campagnaGiocatori = giocatoriCampagna;
    }
}

/**
 * Cambia tab nella dialog gestione giocatori
 */
function switchGiocatoriTab(tabName, campagnaId) {
    if (!elements.gestisciGiocatoriTab || !elements.invitaGiocatoriTab || 
        !elements.gestisciGiocatoriContent || !elements.invitaGiocatoriContent) {
        return;
    }

    // Rimuovi classe active da tutte le tab e contenuti
    elements.gestisciGiocatoriTab.classList.remove('active');
    elements.invitaGiocatoriTab.classList.remove('active');
    elements.gestisciGiocatoriContent.classList.remove('active');
    elements.invitaGiocatoriContent.classList.remove('active');

    // Aggiungi classe active alla tab selezionata
    if (tabName === 'gestisci') {
        elements.gestisciGiocatoriTab.classList.add('active');
        elements.gestisciGiocatoriContent.classList.add('active');
        renderGestisciGiocatoriTab(campagnaId);
    } else if (tabName === 'invita') {
        elements.invitaGiocatoriTab.classList.add('active');
        elements.invitaGiocatoriContent.classList.add('active');
        renderInvitaGiocatoriTab(campagnaId);
    }
}

/**
 * Renderizza la tab "Gestisci Giocatori"
 */
async function renderGestisciGiocatoriTab(campagnaId) {
    if (!elements.gestisciGiocatoriContent) return;

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            elements.gestisciGiocatoriContent.innerHTML = '<p>Errore: Supabase non disponibile</p>';
            return;
        }

        // 1. Carica la campagna per ottenere l'array giocatori
        const { data: campagna, error: campagnaError } = await supabase
            .from('campagne')
            .select('id, giocatori')
            .eq('id', campagnaId)
            .single();
        
        if (campagnaError) {
            console.error('❌ Errore nel caricamento campagna:', campagnaError);
            elements.gestisciGiocatoriContent.innerHTML = '<p>Errore nel caricamento della campagna</p>';
            return;
        }

        console.log('📋 Campagna caricata:', campagna);
        console.log('📋 Array giocatori:', campagna.giocatori);
        console.log('📋 Tipo array giocatori:', typeof campagna.giocatori, Array.isArray(campagna.giocatori));
        
        // 2. Estrai gli ID dall'array giocatori
        const giocatoriIds = Array.isArray(campagna.giocatori) ? campagna.giocatori.filter(id => id) : [];
        console.log('🆔 ID giocatori da caricare:', giocatoriIds);
        console.log('🆔 Tipo ID:', giocatoriIds.map(id => ({ id, type: typeof id })));
        
        // 3. Carica gli utenti usando la funzione RPC che bypassa RLS
        let giocatoriAttuali = [];
        if (giocatoriIds.length > 0) {
            console.log('🔍 Carico utenti usando RPC function get_giocatori_campagna...');
            
            // Usa la funzione RPC che bypassa RLS
            const { data: utenti, error: utentiError } = await supabase
                .rpc('get_giocatori_campagna', { campagna_id_param: campagnaId });
            
            console.log('👥 Utenti caricati con RPC:', utenti);
            console.log('❌ Errore caricamento utenti:', utentiError);
            
            if (utentiError) {
                console.error('❌ Errore nel caricamento utenti via RPC:', utentiError);
                elements.gestisciGiocatoriContent.innerHTML = `
                    <div class="content-placeholder">
                        <p>Errore nel caricamento dei giocatori. Assicurati di aver eseguito la funzione SQL get_giocatori_campagna.</p>
                    </div>
                `;
                return;
            }
            
            if (utenti && utenti.length > 0) {
                // Per ogni giocatore, dobbiamo trovare l'invitoId corrispondente per poterlo rimuovere
                // Carichiamo gli inviti per mappare gli ID
                const { data: inviti, error: invitiError } = await supabase
                    .from('inviti_campagna')
                    .select('id, invitato_id')
                    .eq('campagna_id', campagnaId)
                    .eq('stato', 'accepted')
                    .in('invitato_id', giocatoriIds);
                
                const invitiMap = new Map();
                if (!invitiError && inviti) {
                    inviti.forEach(inv => {
                        invitiMap.set(inv.invitato_id, inv.id);
                    });
                }
                
                giocatoriAttuali = utenti.map(utente => {
                    const invitoId = invitiMap.get(utente.id);
                    console.log('👤 Mappo utente:', utente, 'con invitoId:', invitoId);
                    return {
                        id: utente.id,
                        nome_utente: utente.nome_utente,
                        cid: utente.cid,
                        invitoId: invitoId || null // Se non c'è invito, sarà null (non dovrebbe succedere)
                    };
                });
                console.log('✅ Giocatori mappati:', giocatoriAttuali);
            }
        }

        console.log('✅ Giocatori attuali finali:', giocatoriAttuali);
        console.log('✅ Numero giocatori finali:', giocatoriAttuali.length);

        if (giocatoriAttuali.length === 0) {
            elements.gestisciGiocatoriContent.innerHTML = `
                <div class="content-placeholder">
                    <p>Non ci sono giocatori. Invita amici nella tua campagna!</p>
                </div>
            `;
        } else {
            elements.gestisciGiocatoriContent.innerHTML = `
                <div class="giocatori-modal-list">
                    ${giocatoriAttuali.map(giocatore => `
                        <div class="giocatore-modal-item">
                            <div class="giocatore-info">
                                <div class="giocatore-avatar">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <div>
                                    <p class="giocatore-nome">${escapeHtml(giocatore.nome_utente || 'Utente')}</p>
                                    <p class="giocatore-cid">CID: ${giocatore.cid || ''}</p>
                                </div>
                            </div>
                            <button class="btn-icon-remove" onclick="rimuoviGiocatoreDaCampagna('${campagnaId}', '${giocatore.invitoId || ''}', '${giocatore.id}')" aria-label="Rimuovi giocatore" title="Rimuovi dalla campagna">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Errore nel caricamento giocatori:', error);
        elements.gestisciGiocatoriContent.innerHTML = '<p>Errore nel caricamento dei giocatori</p>';
    }
}

/**
 * Renderizza la tab "Invita Giocatori"
 */
async function renderInvitaGiocatoriTab(campagnaId) {
    if (!elements.invitaGiocatoriContent) return;

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            elements.invitaGiocatoriContent.innerHTML = '<p>Errore: Supabase non disponibile</p>';
            return;
        }

        const currentUser = await findUserByUid(AppState.currentUser.uid);
        if (!currentUser) {
            elements.invitaGiocatoriContent.innerHTML = '<p>Errore: utente corrente non trovato</p>';
            return;
        }

        // Carica i giocatori attuali dall'array giocatori della campagna
        const { data: campagna, error: campagnaError } = await supabase
            .from('campagne')
            .select('giocatori, id_dm')
            .eq('id', campagnaId)
            .single();
        
        if (campagnaError) throw campagnaError;
        
        // Crea un Set con gli ID dei giocatori attuali (incluso il DM per escluderlo)
        const giocatoriAttualiIds = new Set();
        if (campagna.giocatori && Array.isArray(campagna.giocatori)) {
            campagna.giocatori.forEach(id => giocatoriAttualiIds.add(id));
        }
        // Aggiungi anche il DM per escluderlo dalla lista
        if (campagna.id_dm) {
            giocatoriAttualiIds.add(campagna.id_dm);
        }

        // Carica gli amici
        const { data: amiciData, error: amiciError } = await supabase
            .rpc('get_amici');

        if (amiciError) throw amiciError;

        const amici = (amiciData || []).map(row => ({
            id: row.amico_id,
            nome_utente: row.nome_utente,
            cid: row.cid,
            email: row.email
        }));

        // Filtra gli amici escludendo quelli già nella campagna
        const amiciDaInvitare = amici.filter(amico => !giocatoriAttualiIds.has(amico.id));

        // Carica gli inviti già inviati per questa campagna
        const { data: invitiEsistenti } = await supabase
            .from('inviti_campagna')
            .select('invitato_id')
            .eq('campagna_id', campagnaId);

        const invitatiIds = new Set((invitiEsistenti || []).map(inv => inv.invitato_id));

        if (amiciDaInvitare.length === 0) {
            elements.invitaGiocatoriContent.innerHTML = `
                <div class="content-placeholder">
                    <p>Non hai amici da invitare. Aggiungi degli amici prima!</p>
                </div>
            `;
        } else {
            elements.invitaGiocatoriContent.innerHTML = `
                <div class="amici-invito-list">
                    ${amiciDaInvitare.map(amico => {
                        const giaInvitato = invitatiIds.has(amico.id);
                        return `
                            <div class="amico-invito-item">
                                <div class="amico-info">
                                    <div class="amico-avatar">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="amico-nome">${escapeHtml(amico.nome_utente || 'Utente')}</p>
                                        <p class="amico-cid">CID: ${amico.cid || ''}</p>
                                    </div>
                                </div>
                                <button class="btn-icon-invita ${giaInvitato ? 'btn-disabled' : ''}" 
                                        onclick="invitaAmicoAllaCampagna('${campagnaId}', '${amico.id}')" 
                                        ${giaInvitato ? 'disabled' : ''}
                                        title="${giaInvitato ? 'Già invitato' : 'Invita'}">
                                    ${giaInvitato ? 
                                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' :
                                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>'
                                    }
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Errore nel caricamento amici per invito:', error);
        elements.invitaGiocatoriContent.innerHTML = '<p>Errore nel caricamento degli amici</p>';
    }
}

/**
 * Renderizza l'header dei dettagli campagna (icona e nome)
 */
function renderCampagnaDetailsHeader(campagna) {
    // Renderizza l'icona
    let iconaHTML = '';
    if (campagna.icona_type === 'image' && campagna.icona_data) {
        iconaHTML = `<img src="${escapeHtml(campagna.icona_data)}" alt="Icona campagna" class="dettagli-icon-image">`;
    } else if (campagna.icona_type === 'predefined' && campagna.icona_name) {
        const selectedIcon = predefinedIcons.find(i => i.name === campagna.icona_name);
        if (selectedIcon) {
            iconaHTML = `<div class="dettagli-icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${selectedIcon.svg}</svg></div>`;
        }
    }
    // Se non c'è icona, usa quella di default
    if (!iconaHTML) {
        const defaultIcon = predefinedIcons.find(i => i.name === 'dice');
        iconaHTML = `<div class="dettagli-icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${defaultIcon.svg}</svg></div>`;
    }

    // Aggiorna icona container
    if (elements.dettagliIconContainer) {
        elements.dettagliIconContainer.innerHTML = iconaHTML;
    }

    // Aggiorna titolo
    if (elements.dettagliCampagnaTitle) {
        elements.dettagliCampagnaTitle.textContent = escapeHtml(campagna.nome_campagna || 'Senza nome');
    }
}

/**
 * Apre il modal per gestire i giocatori della campagna
 */
async function openInvitaGiocatoriModal(campagnaId) {
    if (!elements.invitaGiocatoriModal) return;

    // Verifica che l'utente sia il DM
    const isDM = await isCurrentUserDM(campagnaId);
    if (!isDM) {
        showNotification('Solo il DM può gestire i giocatori');
        return;
    }

    // Mostra la dialog e switch alla tab "Gestisci Giocatori" (tab predefinita)
    elements.invitaGiocatoriModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    switchGiocatoriTab('gestisci', campagnaId);
}

/**
 * Chiude il modal per invitare giocatori
 */
function closeInvitaGiocatoriModal() {
    if (!elements.invitaGiocatoriModal) return;
    elements.invitaGiocatoriModal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Modifica il numero di giocatori
 */
window.editNumeroGiocatori = async function(campagnaId) {
    // Verifica che l'utente sia il DM
    const isDM = await isCurrentUserDM(campagnaId);
    if (!isDM) {
        showNotification('Solo il DM può modificare i dettagli della campagna');
        return;
    }

    const nuovoNumero = await showPrompt('Inserisci il nuovo numero di giocatori:', 'Modifica Numero Giocatori');
    if (nuovoNumero === null) return;
    
    const numero = parseInt(nuovoNumero);
    if (isNaN(numero) || numero < 0) {
        showNotification('Inserisci un numero valido');
        return;
    }

    // Non aggiorniamo più numero_giocatori, viene calcolato dinamicamente dall'array giocatori
    showNotification('Il numero di giocatori viene calcolato automaticamente dal numero di giocatori nella campagna');
};

/**
 * Modifica il numero di sessioni
 */
window.editNumeroSessioni = async function(campagnaId) {
    // Verifica che l'utente sia il DM
    const isDM = await isCurrentUserDM(campagnaId);
    if (!isDM) {
        showNotification('Solo il DM può modificare i dettagli della campagna');
        return;
    }

    const nuovoNumero = await showPrompt('Inserisci il nuovo numero di sessioni:', 'Modifica Numero Sessioni');
    if (nuovoNumero === null) return;
    
    const numero = parseInt(nuovoNumero);
    if (isNaN(numero) || numero < 0) {
        showNotification('Inserisci un numero valido');
        return;
    }

    await updateCampagnaField(campagnaId, 'numero_sessioni', numero);
};

/**
 * Modifica il tempo di gioco (in minuti)
 */
window.editTempoGioco = async function(campagnaId) {
    // Verifica che l'utente sia il DM
    const isDM = await isCurrentUserDM(campagnaId);
    if (!isDM) {
        showNotification('Solo il DM può modificare i dettagli della campagna');
        return;
    }

    const nuovoTempo = await showPrompt('Inserisci il nuovo tempo di gioco in minuti:', 'Modifica Tempo di Gioco');
    if (nuovoTempo === null) return;
    
    const minuti = parseInt(nuovoTempo);
    if (isNaN(minuti) || minuti < 0) {
        showNotification('Inserisci un numero valido');
        return;
    }

    await updateCampagnaField(campagnaId, 'tempo_di_gioco', minuti);
};

/**
 * Modifica il DM della campagna
 */
window.editDMField = async function(campagnaId) {
    // Verifica che l'utente sia il DM
    const isDM = await isCurrentUserDM(campagnaId);
    if (!isDM) {
        showNotification('Solo il DM può modificare i dettagli della campagna');
        return;
    }

    await openEditDMModal(campagnaId);
};

/**
 * Modifica la data di creazione della campagna
 */
window.editDataCreazione = async function(campagnaId) {
    // Verifica che l'utente sia il DM
    const isDM = await isCurrentUserDM(campagnaId);
    if (!isDM) {
        showNotification('Solo il DM può modificare i dettagli della campagna');
        return;
    }

    const nuovaData = await showPrompt('Inserisci la nuova data di creazione (formato: GG/MM/AAAA):', 'Modifica Data Creazione');
    if (nuovaData === null) return;
    
    // Valida e converti la data
    const dateParts = nuovaData.split('/');
    if (dateParts.length !== 3) {
        showNotification('Formato data non valido. Usa GG/MM/AAAA');
        return;
    }
    
    const giorno = parseInt(dateParts[0]);
    const mese = parseInt(dateParts[1]) - 1; // I mesi sono 0-indexed in JavaScript
    const anno = parseInt(dateParts[2]);
    
    if (isNaN(giorno) || isNaN(mese) || isNaN(anno)) {
        showNotification('Inserisci una data valida');
        return;
    }
    
    const dataObj = new Date(anno, mese, giorno);
    if (dataObj.getDate() !== giorno || dataObj.getMonth() !== mese || dataObj.getFullYear() !== anno) {
        showNotification('Data non valida');
        return;
    }
    
    await updateCampagnaField(campagnaId, 'data_creazione', dataObj.toISOString());
};

/**
 * Apre il modal per selezionare il nuovo DM
 */
async function openEditDMModal(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase || !elements.editDMModal || !elements.dmPlayersList) {
        showNotification('Errore: Elementi non disponibili');
        return;
    }

    try {
        // Mostra il modal con stato di caricamento
        elements.dmPlayersList.innerHTML = '<p>Caricamento giocatori...</p>';
        elements.editDMModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Carica i giocatori usando la funzione RPC (stessa logica di renderGestisciGiocatoriTab)
        const { data: giocatori, error } = await supabase
            .rpc('get_giocatori_campagna', { campagna_id_param: campagnaId });
        
        if (error) {
            console.error('❌ Errore nel caricamento giocatori:', error);
            elements.dmPlayersList.innerHTML = '<p>Errore nel caricamento dei giocatori</p>';
            return;
        }

        if (!giocatori || giocatori.length === 0) {
            elements.dmPlayersList.innerHTML = '<p>Non ci sono giocatori nella campagna per cambiare il DM</p>';
            return;
        }

        // Popola la lista con le card dei giocatori
        elements.dmPlayersList.innerHTML = giocatori.map(giocatore => `
            <div class="dm-player-card" data-giocatore-id="${giocatore.id}" data-giocatore-nome="${escapeHtml(giocatore.nome_utente)}">
                <div class="giocatore-info">
                    <div class="giocatore-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <div>
                        <p class="giocatore-nome">${escapeHtml(giocatore.nome_utente || 'Utente')}</p>
                        <p class="giocatore-cid">CID: ${giocatore.cid || ''}</p>
                    </div>
                </div>
            </div>
        `).join('');

        // Aggiungi event listener a tutte le card
        const playerCards = elements.dmPlayersList.querySelectorAll('.dm-player-card');
        playerCards.forEach(card => {
            card.addEventListener('click', () => {
                const giocatoreId = card.getAttribute('data-giocatore-id');
                const giocatoreNome = card.getAttribute('data-giocatore-nome');
                selectNewDM(campagnaId, giocatoreId, giocatoreNome);
            });
        });

    } catch (error) {
        console.error('❌ Errore nell\'apertura modal DM:', error);
        if (elements.dmPlayersList) {
            elements.dmPlayersList.innerHTML = '<p>Errore nel caricamento dei giocatori</p>';
        }
    }
}

/**
 * Chiude il modal di selezione DM
 */
function closeEditDMModal() {
    if (elements.editDMModal) {
        elements.editDMModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Seleziona un giocatore come nuovo DM
 */
async function selectNewDM(campagnaId, giocatoreId, giocatoreNome) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        console.log('🔄 selectNewDM: campagnaId =', campagnaId);
        console.log('🔄 selectNewDM: giocatoreId =', giocatoreId, 'tipo:', typeof giocatoreId);
        console.log('🔄 selectNewDM: giocatoreNome =', giocatoreNome);
        
        // Verifica che il giocatoreId esista prima di aggiornare
        const currentUser = await findUserByUid(AppState.currentUser.uid);
        console.log('🔄 selectNewDM: currentUser.id =', currentUser?.id);
        
        // Aggiorna id_dm per trasferire i permessi
        // Usa la funzione RPC per bypassare RLS
        console.log('🔄 selectNewDM: uso funzione RPC per aggiornare DM');
        const { error: rpcError } = await supabase.rpc('update_dm_campagna', {
            p_campagna_id: campagnaId,
            p_nuovo_dm_id: giocatoreId
        });
        
        if (rpcError) {
            console.error('❌ selectNewDM: errore nella funzione RPC update_dm_campagna:', rpcError);
            // Fallback: prova con update normale
            console.log('⚠️ selectNewDM: fallback all\'update normale');
            const { data, error } = await supabase
                .from('campagne')
                .update({ 
                    id_dm: giocatoreId
                })
                .eq('id', campagnaId)
                .select();
            
            if (error) {
                console.error('❌ selectNewDM: errore nell\'update normale:', error);
                throw error;
            }
            console.log('✅ selectNewDM: campagna aggiornata (fallback):', data);
        } else {
            console.log('✅ selectNewDM: campagna aggiornata tramite RPC');
        }
        
        // Per la verifica, usa una query normale
        const { data: campagnaVerifica, error: errorVerifica } = await supabase
            .from('campagne')
            .select('id_dm')
            .eq('id', campagnaId)
            .single();
        
        if (errorVerifica) {
            console.error('❌ selectNewDM: errore nella verifica:', errorVerifica);
        } else if (campagnaVerifica) {
            console.log('✅ selectNewDM: verifica dopo update - id_dm =', campagnaVerifica.id_dm);
            console.log('🔍 selectNewDM: confronto id_dm - atteso:', giocatoreId, 'trovato:', campagnaVerifica.id_dm, 'match:', campagnaVerifica.id_dm === giocatoreId);
        }
        
        // Chiudi il modal
        closeEditDMModal();
        
        showNotification(`DM cambiato a ${giocatoreNome}`);
        
        // Aspetta un po' per assicurarsi che l'update sia propagato nel database
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Ricarica i dettagli della campagna per aggiornare la UI
        // Usa un approccio più diretto: ricarica la campagna e verifica i permessi
        await loadCampagnaDetails(campagnaId);
        
        // Verifica che il DM sia stato cambiato correttamente
        const isNowDM = await isCurrentUserDM(campagnaId);
        console.log('🔍 selectNewDM: verifica finale - isNowDM =', isNowDM);
        if (!isNowDM && giocatoreId === currentUser?.id) {
            console.warn('⚠️ selectNewDM: il DM non corrisponde dopo l\'update, potrebbe essere un problema di cache o RLS');
            // Forza un refresh completo ricaricando la pagina delle campagne
            if (AppState.currentUser) {
                await loadCampagne(AppState.currentUser.uid);
            }
        }
    } catch (error) {
        console.error('❌ Errore nel cambio DM:', error);
        showNotification('Errore nel cambio del DM: ' + (error.message || error));
    }
}

/**
 * Verifica se l'utente corrente è il DM di una campagna
 */
async function isCurrentUserDM(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.currentUser) {
        console.log('❌ isCurrentUserDM: supabase o currentUser non disponibili');
        return false;
    }

    try {
        const currentUser = await findUserByUid(AppState.currentUser.uid);
        if (!currentUser) {
            console.log('❌ isCurrentUserDM: currentUser non trovato');
            return false;
        }
        console.log('👤 isCurrentUserDM: currentUser.id =', currentUser.id, 'tipo:', typeof currentUser.id);
        console.log('📋 isCurrentUserDM: campagnaId =', campagnaId, 'tipo:', typeof campagnaId);

        // Usa la funzione RPC per bypassare RLS e ottenere il vero valore dal database
        console.log('🔍 isCurrentUserDM: chiamata RPC con parametri:', {
            p_campagna_id: campagnaId,
            p_user_id: currentUser.id
        });
        
        const { data: isDM, error: rpcError } = await supabase.rpc('check_dm_campagna', {
            p_campagna_id: campagnaId,
            p_user_id: currentUser.id
        });

        if (rpcError) {
            console.error('❌ isCurrentUserDM: errore nella funzione RPC:', rpcError);
            // Fallback: usa la query normale se la RPC non è disponibile
            console.log('⚠️ isCurrentUserDM: fallback alla query normale');
            const { data: campagna, error } = await supabase
                .from('campagne')
                .select('id_dm')
                .eq('id', campagnaId)
                .single();

            if (error) {
                console.error('❌ isCurrentUserDM: errore nel caricamento campagna:', error);
                return false;
            }
            if (!campagna) {
                console.log('❌ isCurrentUserDM: campagna non trovata');
                return false;
            }
            
            // Confronta id_dm invece di user_id
            const isDM = campagna.id_dm === currentUser.id;
            console.log('🔍 isCurrentUserDM: query diretta - id_dm =', campagna.id_dm);
            console.log('🔍 isCurrentUserDM: confronto diretto', currentUser.id, '===', campagna.id_dm, '=', isDM);
            return isDM;
            console.log('📋 isCurrentUserDM (fallback): campagna.id_dm =', campagna.id_dm, 'tipo:', typeof campagna.id_dm);
            const isMatch = currentUser.id === campagna.id_dm;
            console.log('✅ isCurrentUserDM (fallback): confronto', currentUser.id, '===', campagna.id_dm, '=', isMatch);
            return isMatch;
        }

        console.log('✅ isCurrentUserDM (RPC): risultato =', isDM, 'tipo:', typeof isDM);
        
        // Aggiungi anche una query diretta per confrontare
        const { data: campagnaDirect, error: directError } = await supabase
            .from('campagne')
            .select('id_dm')
            .eq('id', campagnaId)
            .single();
        
        if (!directError && campagnaDirect) {
            console.log('🔍 isCurrentUserDM: query diretta - id_dm =', campagnaDirect.id_dm);
            console.log('🔍 isCurrentUserDM: confronto diretto', currentUser.id, '===', campagnaDirect.id_dm, '=', currentUser.id === campagnaDirect.id_dm);
        }
        
        return isDM === true;
    } catch (error) {
        console.error('❌ Errore nel controllo DM:', error);
        return false;
    }
}

/**
 * Aggiorna un campo della campagna
 */
async function updateCampagnaField(campagnaId, field, value) {
    // Verifica che l'utente sia il DM
    const isDM = await isCurrentUserDM(campagnaId);
    if (!isDM) {
        showNotification('Solo il DM può modificare i dettagli della campagna');
        return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        const { error } = await supabase
            .from('campagne')
            .update({ [field]: value })
            .eq('id', campagnaId);

        if (error) throw error;

        showNotification('Campo aggiornato con successo!');
        
        // Ricarica i dettagli della campagna
        if (AppState.currentCampagnaId) {
            await loadCampagnaDetails(AppState.currentCampagnaId);
        }
    } catch (error) {
        console.error('❌ Errore nell\'aggiornamento campo:', error);
        showNotification('Errore nell\'aggiornamento: ' + (error.message || error));
    }
}

/**
 * Invita un amico alla campagna
 */
window.invitaAmicoAllaCampagna = async function(campagnaId, amicoId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        const currentUser = await findUserByUid(AppState.currentUser.uid);
        if (!currentUser) {
            showNotification('Errore: utente corrente non trovato');
            return;
        }

        // Crea l'invito usando la funzione RPC
        // La funzione RPC verifica automaticamente che l'utente sia il DM della campagna
        const { data: invitoId, error } = await supabase
            .rpc('create_invito_campagna', {
                p_campagna_id: campagnaId,
                p_invitato_id: amicoId
            });

        if (error) {
            if (error.message && error.message.includes('già esistente')) {
                showNotification('Questo utente è già stato invitato a questa campagna');
            } else {
                throw error;
            }
        } else {
            showNotification('Invito inviato con successo!');
            // Ricarica il modal per aggiornare lo stato
            await openInvitaGiocatoriModal(campagnaId);
        }
    } catch (error) {
        console.error('❌ Errore nell\'invio invito:', error);
        showNotification('Errore nell\'invio dell\'invito: ' + (error.message || error));
    }
};

/**
 * Rimuove un giocatore dalla campagna
 */
window.rimuoviGiocatoreDaCampagna = async function(campagnaId, invitoId, giocatoreId) {
    // Verifica che l'utente sia il DM
    const isDM = await isCurrentUserDM(campagnaId);
    if (!isDM) {
        showNotification('Solo il DM può rimuovere giocatori dalla campagna');
        return;
    }

    const confirmed = await showConfirm('Sei sicuro di voler rimuovere questo giocatore dalla campagna?', 'Rimuovi Giocatore');
    if (!confirmed) {
        return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Usa la funzione RPC dedicata per il DM per rimuovere il giocatore
        // Questa funzione aggiorna lo stato dell'invito e rimuove il giocatore dall'array giocatori
        const { error } = await supabase
            .rpc('dm_rimuovi_giocatore', {
                p_campagna_id: campagnaId,
                p_giocatore_id: giocatoreId,
                p_invito_id: invitoId || null
            });

        if (error) throw error;

        showNotification('Giocatore rimosso dalla campagna');

        // Ricarica la tab "Gestisci Giocatori" se la dialog è aperta
        if (elements.invitaGiocatoriModal && elements.invitaGiocatoriModal.classList.contains('active')) {
            await renderGestisciGiocatoriTab(campagnaId);
        }
        
        // Ricarica i dettagli della campagna
        if (AppState.currentCampagnaId) {
            await loadCampagnaDetails(AppState.currentCampagnaId);
        }
    } catch (error) {
        console.error('❌ Errore nella rimozione giocatore:', error);
        showNotification('Errore nella rimozione del giocatore: ' + (error.message || error));
    }
};

window.deleteCampagna = async function(campagnaId) {
    const confirmed = await showConfirm('Sei sicuro di voler eliminare questa campagna?', 'Elimina Campagna');
    if (!confirmed) {
        return;
    }

    const supabase = getSupabaseClient();
    
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        const { error } = await supabase
            .from('campagne')
            .delete()
            .eq('id', campagnaId);
        
        if (error) throw error;
        
        showNotification('Campagna eliminata con successo!');
        
        // Ricarica le campagne dopo eliminazione
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            loadCampagne(session.user.id);
        }
    } catch (error) {
        console.error('Errore nell\'eliminazione campagna:', error);
        showNotification('Errore nell\'eliminazione della campagna: ' + (error.message || error));
    }
};

// Toggle between login and register mode
function toggleLoginRegisterMode(isRegister) {
    AppState.isRegisterMode = isRegister;
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (isRegister) {
        elements.loginModalTitle.textContent = 'Registrati';
        elements.submitBtn.textContent = 'Registrati';
        elements.registerLink.style.display = 'none';
        elements.loginLink.style.display = 'inline';
        elements.modalFooterText.textContent = 'Hai già un account? ';
        // Mostra il campo nickname
        if (elements.nicknameGroup) {
            elements.nicknameGroup.style.display = 'block';
        }
    } else {
        elements.loginModalTitle.textContent = 'Accedi';
        elements.submitBtn.textContent = 'Accedi';
        elements.registerLink.style.display = 'inline';
        elements.loginLink.style.display = 'none';
        elements.modalFooterText.textContent = 'Non hai un account? ';
        // Nascondi il campo nickname
        if (elements.nicknameGroup) {
            elements.nicknameGroup.style.display = 'none';
        }
        // Pulisci il campo nickname
        if (elements.nicknameInput) {
            elements.nicknameInput.value = '';
        }
    }
    
    hideError();
    emailInput.value = '';
    passwordInput.value = '';
}

// Show error message
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
}

// Hide error message
function hideError() {
    elements.errorMessage.style.display = 'none';
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    hideError();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validazione input
    if (!email || !password) {
        showError('Inserisci email e password');
        return;
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Inserisci un indirizzo email valido');
        return;
    }

    // Validazione password per registrazione
    if (AppState.isRegisterMode && password.length < 6) {
        showError('La password deve contenere almeno 6 caratteri');
        return;
    }

    // Verifica che Supabase sia disponibile
    const supabase = getSupabaseClient();
    
    if (!supabase) {
        // Prova a ottenere il client direttamente se non è disponibile
        if (typeof window.supabaseClient !== 'undefined') {
            // Client disponibile, aggiorna supabaseReady
            supabaseReady = true;
        } else {
        showError('Autenticazione non disponibile. Ricarica la pagina.');
            console.error('Supabase non disponibile:', {
                supabaseReady,
                supabase: !!supabase,
                windowSupabaseClient: typeof window.supabaseClient
        });
        return;
        }
    } else {
        // Client disponibile, assicurati che supabaseReady sia true
        if (!supabaseReady) {
            supabaseReady = true;
        }
    }

    try {
        elements.submitBtn.disabled = true;
        const originalText = elements.submitBtn.textContent;
        elements.submitBtn.textContent = AppState.isRegisterMode ? 'Registrazione...' : 'Accesso...';

        console.log(AppState.isRegisterMode ? '📝 Registrazione utente...' : '🔐 Login utente...', email);
        
        if (AppState.isRegisterMode) {
            // Register new user
            const nickname = document.getElementById('nickname')?.value.trim() || '';
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        display_name: nickname || email.split('@')[0],
                        full_name: nickname || email.split('@')[0]
                    }
                }
            });
            
            if (error) throw error;
            
            console.log('✅ Utente registrato con successo:', data.user?.id, data.user?.email);
            
            // Non inizializziamo qui perché onAuthStateChange lo farà automaticamente
            // Questo evita doppie inizializzazioni e race conditions
            console.log('✅ Registrazione completata, onAuthStateChange gestirà l\'inizializzazione');
            showNotification('Registrazione completata! Benvenuto!');
        } else {
            // Sign in existing user
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            console.log('✅ Utente autenticato con successo:', data.user?.id, data.user?.email);
            showNotification('Accesso effettuato!');
        }

        closeLoginModal();
    } catch (error) {
        console.error('❌ Auth error:', error);
        console.error('Error message:', error.message);
        
        let errorMessage = 'Si è verificato un errore';
        
        // Supabase error codes
        if (error.message) {
            if (error.message.includes('already registered') || error.message.includes('already exists')) {
                errorMessage = AppState.isRegisterMode 
                    ? 'Questa email è già registrata. Usa "Accedi" per entrare.' 
                    : 'Email già in uso';
            } else if (error.message.includes('Invalid email')) {
                errorMessage = 'Email non valida';
            } else if (error.message.includes('Password')) {
                errorMessage = 'Password troppo debole (minimo 6 caratteri)';
            } else if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
                errorMessage = 'Credenziali non valide. Verifica email e password.';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Troppi tentativi. Riprova più tardi';
            } else {
                errorMessage = error.message || 'Errore durante l\'autenticazione';
            }
        }
        
        showError(errorMessage);
    } finally {
        elements.submitBtn.disabled = false;
        elements.submitBtn.textContent = AppState.isRegisterMode ? 'Registrati' : 'Accedi';
    }
}

// Google Login Handler
async function handleGoogleLogin() {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
        showError('Autenticazione Google non disponibile. Controlla la configurazione Supabase.');
        return;
    }

    try {
        hideError();
        elements.googleLoginBtn.disabled = true;
        elements.googleLoginBtn.textContent = 'Accesso in corso...';
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        
        if (error) throw error;
        
        // La redirect avverrà automaticamente, quindi non chiudiamo il modal qui
        // Il callback verrà gestito da onAuthStateChange
        console.log('✅ Redirect a Google per autenticazione...');
        
    } catch (error) {
        console.error('Google Auth error:', error);
        let errorMessage = 'Errore durante l\'accesso con Google';
        
        if (error.message) {
            if (error.message.includes('popup_closed')) {
                errorMessage = 'Popup chiusa. Riprova.';
            } else if (error.message.includes('cancelled')) {
                errorMessage = 'Richiesta annullata. Riprova.';
            } else {
                errorMessage = error.message || 'Errore durante l\'accesso con Google';
            }
        }
        
        showError(errorMessage);
    } finally {
        if (elements.googleLoginBtn) {
            elements.googleLoginBtn.disabled = false;
            elements.googleLoginBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <g fill="#000" fill-rule="evenodd">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.96-2.184l-2.908-2.258c-.806.54-1.837.86-3.052.86-2.347 0-4.335-1.585-5.043-3.716H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                        <path d="M3.957 10.702c-.18-.54-.282-1.117-.282-1.702s.102-1.162.282-1.702V4.966H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.034l3-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.966L3.957 7.3C4.665 5.168 6.653 3.58 9 3.58z" fill="#EA4335"/>
                    </g>
                </svg>
                Accedi con Google
            `;
        }
    }
}

// D20 Roll Functions
function rollD20() {
    if (!elements.d20Logo || !elements.d20RollNumber) return;
    
    // Remove critical class if present
    elements.d20RollNumber.classList.remove('critical');
    
    // Add spinning class
    elements.d20Logo.classList.add('spinning');
    
    // Generate random number between 1 and 20
    const roll = Math.floor(Math.random() * 20) + 1;
    
    // Remove spinning class after animation completes
    setTimeout(() => {
        elements.d20Logo.classList.remove('spinning');
        
        // Show the number
        elements.d20RollNumber.textContent = roll;
        elements.d20RollNumber.classList.add('show');
        
        // If critical roll (1 or 20), add flash effect
        if (roll === 1 || roll === 20) {
            elements.d20RollNumber.classList.add('critical');
        }
    }, 1200); // Match animation duration (1.2s)
}

function hideRollNumber() {
    if (elements.d20RollNumber) {
        elements.d20RollNumber.classList.remove('show');
    }
}

// Logout Handler
async function handleLogout() {
    console.log('🚪 handleLogout chiamato');
    try {
        const confirmed = await showConfirm('Sei sicuro di voler uscire?', 'Logout');
        console.log('🚪 Conferma logout:', confirmed);
        if (!confirmed) {
            console.log('🚪 Logout annullato dall\'utente');
            return;
        }
        try {
            const supabase = getSupabaseClient();
            
            // Pulisci localStorage PRIMA del logout
            localStorage.removeItem('currentCampagnaId');
            AppState.currentCampagnaId = null;
            
            // Pulisci lo stato locale PRIMA
            AppState.currentUser = null;
            AppState.isLoggedIn = false;
            
            if (supabase) {
                // Disconnetti da eventuali subscription
                if (campagneChannel) {
                    supabase.removeChannel(campagneChannel);
                    campagneChannel = null;
                }
                
                // Esegui logout da Supabase (senza scope per pulire tutto)
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.warn('⚠️ Errore durante signOut:', error);
                    // Continua comunque con il logout locale
            } else {
                    console.log('✅ SignOut completato con successo');
                }
                
                // Pulisci manualmente anche localStorage e sessionStorage per sicurezza
                // Rimuovi tutte le chiavi di Supabase
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-')) {
                        localStorage.removeItem(key);
                    }
                });
                Object.keys(sessionStorage).forEach(key => {
                    if (key.startsWith('sb-')) {
                        sessionStorage.removeItem(key);
                    }
                });
            }
            
            // Aggiorna UI e chiudi modal
            updateUIForLoggedOut();
            closeUserModal();
            showNotification('Logout effettuato');
            
            // Aspetta un po' per assicurarsi che il signOut sia completato
            // e poi forza un refresh della pagina per assicurarsi che tutto sia pulito
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Pulisci anche AppState prima del reload
            AppState.currentUser = null;
            AppState.isLoggedIn = false;
            AppState.currentCampagnaId = null;
            
            // Ricarica la pagina
            window.location.reload();
            
        } catch (error) {
            console.error('Logout error:', error);
            // In caso di errore, pulisci comunque tutto
            AppState.currentUser = null;
            AppState.isLoggedIn = false;
            updateUIForLoggedOut();
            localStorage.removeItem('currentCampagnaId');
            closeUserModal();
            showNotification('Logout effettuato');
            // Forza refresh anche in caso di errore
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    } catch (error) {
        console.error('❌ Errore in handleLogout:', error);
        // In caso di errore nella conferma, procedi comunque con il logout
        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                await supabase.auth.signOut({ scope: 'local' });
            }
            AppState.currentUser = null;
            AppState.isLoggedIn = false;
            updateUIForLoggedOut();
            localStorage.removeItem('currentCampagnaId');
            closeUserModal();
            showNotification('Logout effettuato');
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (logoutError) {
            console.error('❌ Errore critico nel logout:', logoutError);
            showNotification('Errore durante il logout. Ricarica la pagina.');
        }
    }
}

// Notification System (simple)
function showNotification(message) {
    // Crea elemento notifica
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent);
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 2000;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Rimuovi dopo 3 secondi
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// GESTIONE PREFERITI
// ============================================

/**
 * Toggle preferito per una campagna (usa campagne_preferite nella tabella utenti)
 */
window.togglePreferito = async function(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Recupera l'utente corrente
        const utente = await findUserByUid(AppState.currentUser.uid);
        if (!utente) {
            throw new Error('Utente non trovato');
        }

        // Recupera l'array attuale dei preferiti
        const { data: utenteData, error: fetchError } = await supabase
            .from('utenti')
            .select('campagne_preferite')
            .eq('id', utente.id)
            .single();

        if (fetchError) throw fetchError;

        const preferitiAttuali = utenteData.campagne_preferite || [];
        const isPreferito = preferitiAttuali.includes(campagnaId);

        // Aggiungi o rimuovi dalla lista
        let nuoviPreferiti;
        if (isPreferito) {
            // Rimuovi
            nuoviPreferiti = preferitiAttuali.filter(id => id !== campagnaId);
        } else {
            // Aggiungi
            nuoviPreferiti = [...preferitiAttuali, campagnaId];
        }

        // Aggiorna l'array nella tabella utenti
        const { error: updateError } = await supabase
            .from('utenti')
            .update({ campagne_preferite: nuoviPreferiti })
            .eq('id', utente.id);

        if (updateError) throw updateError;

        showNotification(!isPreferito ? 'Campagna aggiunta ai preferiti' : 'Campagna rimossa dai preferiti');

        // Ricarica le campagne
        if (AppState.currentUser) {
            await loadCampagne(AppState.currentUser.uid);
        }
    } catch (error) {
        console.error('❌ Errore nel toggle preferito:', error);
        showNotification('Errore nell\'aggiornamento del preferito');
    }
};


// ============================================
// GESTIONE SESSIONI
// ============================================

/**
 * Verifica se c'è una sessione attiva per una campagna
 */
async function checkSessioneAttiva(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
        const { data, error } = await supabase
            .from('sessioni')
            .select('id')
            .eq('campagna_id', campagnaId)
            .is('data_fine', null)
            .limit(1)
            .single();

        return !error && data !== null;
    } catch (error) {
        console.error('❌ Errore nel controllo sessione attiva:', error);
        return false;
    }
}

/**
 * Ottiene la sessione attiva per una campagna
 */
async function getSessioneAttiva(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('sessioni')
            .select('*')
            .eq('campagna_id', campagnaId)
            .is('data_fine', null)
            .limit(1)
            .single();

        if (error) return null;
        return data;
    } catch (error) {
        console.error('❌ Errore nel recupero sessione attiva:', error);
        return null;
    }
}

/**
 * Inizia una nuova sessione per una campagna
 */
window.iniziaSessione = async function(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Verifica che non ci sia già una sessione attiva
        const sessioneAttiva = await checkSessioneAttiva(campagnaId);
        if (sessioneAttiva) {
            showNotification('C\'è già una sessione attiva per questa campagna');
            openSessionePage(campagnaId);
            return;
        }

        // Verifica che l'utente sia il DM
        const isDM = await isCurrentUserDM(campagnaId);
        if (!isDM) {
            showNotification('Solo il DM può iniziare una sessione');
            return;
        }

        // Crea la nuova sessione
        const { data, error } = await supabase
            .from('sessioni')
            .insert({
                campagna_id: campagnaId,
                data_inizio: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        showNotification('Sessione iniziata!');
        
        // Apri la pagina sessione
        openSessionePage(campagnaId);
    } catch (error) {
        console.error('❌ Errore nell\'inizio sessione:', error);
        showNotification('Errore nell\'inizio della sessione: ' + (error.message || error));
    }
};

/**
 * Apre la pagina sessione
 */
window.openSessionePage = async function(campagnaId) {
    AppState.currentCampagnaId = campagnaId;
    localStorage.setItem('currentCampagnaId', campagnaId);
    navigateToPage('sessione');
    await renderSessioneContent(campagnaId);
};

/**
 * Calcola il numero della sessione (sessioni concluse + 1)
 */
async function getNumeroSessione(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) return 1;

    try {
        const { count, error } = await supabase
            .from('sessioni')
            .select('*', { count: 'exact', head: true })
            .eq('campagna_id', campagnaId)
            .not('data_fine', 'is', null);

        if (error) {
            console.error('❌ Errore nel conteggio sessioni:', error);
            return 1;
        }

        return (count || 0) + 1;
    } catch (error) {
        console.error('❌ Errore nel conteggio sessioni:', error);
        return 1;
    }
}

/**
 * Renderizza il contenuto della pagina sessione
 */
async function renderSessioneContent(campagnaId) {
    const sessioneContent = document.getElementById('sessioneContent');
    const sessioneTitle = document.getElementById('sessioneCampagnaTitle');
    if (!sessioneContent) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
        sessioneContent.innerHTML = '<p>Errore: Supabase non disponibile</p>';
        return;
    }

    try {
        // Verifica se l'utente è DM
        const isDM = await isCurrentUserDM(campagnaId);

        // Carica la campagna
        const { data: campagna, error: campagnaError } = await supabase
            .from('campagne')
            .select('nome_campagna')
            .eq('id', campagnaId)
            .single();

        if (campagnaError) throw campagnaError;

        // Carica la sessione attiva
        const sessione = await getSessioneAttiva(campagnaId);
        
        if (!sessione) {
            sessioneContent.innerHTML = `
                <div class="content-placeholder">
                    <p>Nessuna sessione attiva</p>
                    ${isDM ? `<button class="btn-primary" onclick="iniziaSessione('${campagnaId}')">Inizia Sessione</button>` : ''}
                </div>
            `;
            if (sessioneTitle) {
                sessioneTitle.innerHTML = `<div>${escapeHtml(campagna.nome_campagna)}</div><div>Sessione</div>`;
            }
            return;
        }

        // Calcola numero sessione
        const numeroSessione = await getNumeroSessione(campagnaId);

        // Aggiorna titolo
        if (sessioneTitle) {
            sessioneTitle.innerHTML = `<div>${escapeHtml(campagna.nome_campagna)}</div><div>Sessione ${numeroSessione}</div>`;
        }

        // Calcola durata corrente
        const dataInizio = new Date(sessione.data_inizio);
        const durataMs = Date.now() - dataInizio.getTime();
        const durataMinuti = Math.floor(durataMs / 60000);
        const durataOre = Math.floor(durataMinuti / 60);
        const durataMinutiResto = durataMinuti % 60;

        // Verifica se c'è combattimento attivo (ci sono richieste tiro iniziativa per questa sessione)
        const { data: richiesteIniziativa } = await supabase
            .from('richieste_tiro_iniziativa')
            .select('id, stato')
            .eq('sessione_id', sessione.id)
            .limit(1);
        
        const inCombattimento = richiesteIniziativa && richiesteIniziativa.length > 0;

        sessioneContent.innerHTML = `
            <div class="sessione-timer">
                <div class="timer-display">
                    <span class="timer-value">${durataOre.toString().padStart(2, '0')}:${durataMinutiResto.toString().padStart(2, '0')}</span>
                    <span class="timer-label">Durata</span>
                </div>
                ${isDM ? `
                <button class="btn-secondary btn-small" onclick="finisciSessione('${sessione.id}', '${campagnaId}')">
                    Fine Sessione
                </button>
                ` : ''}
            </div>

            ${isDM ? `
            <div class="sessione-actions">
                ${inCombattimento ? `
                <button class="btn-primary btn-small" onclick="openCombattimentoPage('${campagnaId}', '${sessione.id}')">
                    Ritorna al combattimento
                </button>
                ` : `
                <button class="btn-primary btn-small" onclick="richiediTiroIniziativa('${sessione.id}', '${campagnaId}')">
                    Tirate iniziativa
                </button>
                `}
                <button class="btn-secondary btn-small" onclick="richiediTiroGenerico('${sessione.id}', '${campagnaId}')">
                    Richiedi tiro
                </button>
            </div>
            <div id="tiroGenericoTable" class="tiro-generico-table" style="display: none;"></div>
            ` : `
            ${inCombattimento ? `
            <div class="sessione-actions">
                <button class="btn-primary btn-small" onclick="openCombattimentoPage('${campagnaId}', '${sessione.id}')">
                    Ritorna al combattimento
                </button>
            </div>
            ` : ''}
            `}
        `;

        // Avvia timer se non già avviato
        if (!window.sessioneTimerInterval) {
            startSessioneTimer(campagnaId);
        }

        // Se c'è una tabella tiri generici da mostrare, aggiornala
        if (isDM && window.currentTiroGenericoRichiestaId) {
            await updateTiroGenericoTable(sessione.id, window.currentTiroGenericoRichiestaId);
        }

        // Avvia polling per aggiornare la tabella tiri generici
        if (isDM && !window.tiroGenericoPollingInterval) {
            startTiroGenericoPolling(sessione.id);
        } else if (!isDM && window.tiroGenericoPollingInterval) {
            stopTiroGenericoPolling();
        }
    } catch (error) {
        console.error('❌ Errore nel rendering sessione:', error);
        sessioneContent.innerHTML = '<p>Errore nel caricamento della sessione</p>';
    }
}

/**
 * Avvia il timer per la sessione
 */
function startSessioneTimer(campagnaId) {
    // Rimuovi timer esistente se presente
    if (window.sessioneTimerInterval) {
        clearInterval(window.sessioneTimerInterval);
    }

    window.sessioneTimerInterval = setInterval(async () => {
        await renderSessioneContent(campagnaId);
    }, 60000); // Aggiorna ogni minuto
}

/**
 * Ferma il timer della sessione
 */
function stopSessioneTimer() {
    if (window.sessioneTimerInterval) {
        clearInterval(window.sessioneTimerInterval);
        window.sessioneTimerInterval = null;
    }
}

/**
 * Finisce una sessione
 */
window.finisciSessione = async function(sessioneId, campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Verifica che l'utente sia il DM
        const isDM = await isCurrentUserDM(campagnaId);
        if (!isDM) {
            showNotification('Solo il DM può finire una sessione');
            return;
        }

        const dataFine = new Date().toISOString();

        const { error } = await supabase
            .from('sessioni')
            .update({ data_fine: dataFine })
            .eq('id', sessioneId);

        if (error) throw error;

        stopSessioneTimer();
        showNotification('Sessione terminata!');
        
        // Torna ai dettagli campagna
        navigateToPage('dettagli');
        await loadCampagnaDetails(campagnaId);
    } catch (error) {
        console.error('❌ Errore nella fine sessione:', error);
        showNotification('Errore nella fine della sessione: ' + (error.message || error));
    }
};

/**
 * Aggiunge una voce all'iniziativa
 */
window.aggiungiIniziativa = async function(sessioneId) {
    const nome = await showPrompt('Nome personaggio:', 'Aggiungi Iniziativa');
    if (!nome || nome.trim() === '') return;

    const valoreStr = await showPrompt('Valore iniziativa (d20 + modificatori):', 'Aggiungi Iniziativa');
    if (!valoreStr) return;

    const valore = parseInt(valoreStr);
    if (isNaN(valore)) {
        showNotification('Inserisci un numero valido');
        return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Trova l'ordine massimo
        const { data: existing, error: existingError } = await supabase
            .from('iniziativa')
            .select('ordine')
            .eq('sessione_id', sessioneId)
            .order('ordine', { ascending: false })
            .limit(1);

        const nuovoOrdine = existing && existing.length > 0 ? existing[0].ordine + 1 : 1;

        const { error } = await supabase
            .from('iniziativa')
            .insert({
                sessione_id: sessioneId,
                personaggio_nome: nome.trim(),
                valore_iniziativa: valore,
                ordine: nuovoOrdine
            });

        if (error) throw error;

        showNotification('Iniziativa aggiunta!');
        
        // Ricarica la sessione
        const { data: sessione } = await supabase
            .from('sessioni')
            .select('campagna_id')
            .eq('id', sessioneId)
            .single();

        if (sessione) {
            await renderSessioneContent(sessione.campagna_id);
        }
    } catch (error) {
        console.error('❌ Errore nell\'aggiunta iniziativa:', error);
        showNotification('Errore nell\'aggiunta dell\'iniziativa: ' + (error.message || error));
    }
};

/**
 * Apre la pagina combattimento
 */
window.openCombattimentoPage = async function(campagnaId, sessioneId) {
    AppState.currentCampagnaId = campagnaId;
    AppState.currentSessioneId = sessioneId;
    localStorage.setItem('currentCampagnaId', campagnaId);
    localStorage.setItem('currentSessioneId', sessioneId);
    navigateToPage('combattimento');
    await renderCombattimentoContent(campagnaId, sessioneId);
};

/**
 * Renderizza il contenuto della pagina combattimento
 */
async function renderCombattimentoContent(campagnaId, sessioneId) {
    const combattimentoContent = document.getElementById('combattimentoContent');
    const combattimentoTitle = document.getElementById('combattimentoCampagnaTitle');
    if (!combattimentoContent) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
        combattimentoContent.innerHTML = '<p>Errore: Supabase non disponibile</p>';
        return;
    }

    try {
        // Carica la campagna
        const { data: campagna, error: campagnaError } = await supabase
            .from('campagne')
            .select('nome_campagna')
            .eq('id', campagnaId)
            .single();

        if (campagnaError) throw campagnaError;

        // Calcola numero sessione
        const numeroSessione = await getNumeroSessione(campagnaId);

        // Aggiorna titolo
        if (combattimentoTitle) {
            combattimentoTitle.innerHTML = `<div>${escapeHtml(campagna.nome_campagna)}</div><div>Combattimento - Sessione ${numeroSessione}</div>`;
        }

        // Carica i tiri di iniziativa dalla tabella richieste_tiro_iniziativa
        const { data: tiriIniziativa, error: tiriError } = await supabase
            .from('richieste_tiro_iniziativa')
            .select(`
                *,
                utenti!richieste_tiro_iniziativa_giocatore_id_fkey(nome_utente, cid)
            `)
            .eq('sessione_id', sessioneId)
            .order('valore', { ascending: false });

        if (tiriError) {
            console.error('❌ Errore nel caricamento tiri iniziativa:', tiriError);
        }

        const tiriCompleted = (tiriIniziativa || []).filter(t => t.stato === 'completed' && t.valore !== null);
        
        if (tiriCompleted.length === 0) {
            combattimentoContent.innerHTML = `
                <div class="content-placeholder">
                    <p>Combattimento in corso...</p>
                    <p style="margin-top: 1rem; color: var(--text-light);">I giocatori stanno tirando l'iniziativa</p>
                </div>
            `;
        } else {
            const cardsHTML = tiriCompleted.map((tiro, index) => `
                <div class="combattimento-card" style="padding: var(--spacing-md); background: var(--card-bg); border-radius: var(--radius-md); box-shadow: var(--shadow-md); margin-bottom: var(--spacing-md);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: var(--accent);">#${index + 1}</div>
                            <div style="font-size: 1.1rem; font-weight: 600; margin-top: var(--spacing-xs);">
                                ${escapeHtml(tiro.utenti?.nome_utente || 'Sconosciuto')}
                                ${tiro.utenti?.cid ? ` <span style="color: var(--text-light); font-size: 0.9rem;">(CID: ${tiro.utenti.cid})</span>` : ''}
                            </div>
                        </div>
                        <div style="font-size: 2rem; font-weight: bold; color: var(--text-primary);">
                            ${tiro.valore}
                        </div>
                    </div>
                </div>
            `).join('');

            // Verifica se l'utente è il DM
            const isDM = await isCurrentUserDM(campagnaId);
            
            combattimentoContent.innerHTML = cardsHTML + (isDM ? `
                <div style="margin-top: var(--spacing-lg); display: flex; justify-content: center;">
                    <button class="btn-danger" onclick="terminaCombattimento('${campagnaId}', '${sessioneId}')" aria-label="Termina combattimento">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 4px;">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Termina Combattimento
                    </button>
                </div>
            ` : '');
        }
    } catch (error) {
        console.error('❌ Errore nel rendering combattimento:', error);
        combattimentoContent.innerHTML = '<p>Errore nel caricamento del combattimento</p>';
    }
}

/**
 * Chiude il modal di richiesta tiro
 */
function closeRollRequestModal() {
    if (elements.rollRequestModal) {
        elements.rollRequestModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    if (elements.rollRequestInput) {
        elements.rollRequestInput.value = '';
    }
    window.currentRollRequest = null;
}

/**
 * Verifica se ci sono richieste tiro pending per l'utente corrente
 */
async function checkPendingRollRequests(userId) {
    if (!AppState.isLoggedIn || !userId) return null;

    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
        const userData = await findUserByUid(userId);
        if (!userData) {
            console.log('⚠️ UserData non trovato per userId:', userId);
            return null;
        }

        console.log('🔍 Controllo richieste tiro per giocatore:', userData.id);

        // Controlla richieste iniziativa pending
        const { data: iniziativaRequests, error: iniziativaError } = await supabase
            .from('richieste_tiro_iniziativa')
            .select('*')
            .eq('giocatore_id', userData.id)
            .eq('stato', 'pending')
            .order('timestamp', { ascending: false })
            .limit(1);

        if (iniziativaError) {
            console.error('❌ Errore nel controllo richieste iniziativa:', iniziativaError);
        } else {
            console.log('📊 Richieste iniziativa trovate:', iniziativaRequests?.length || 0);
        }

        if (iniziativaRequests && iniziativaRequests.length > 0) {
            console.log('✅ Trovata richiesta iniziativa:', iniziativaRequests[0].id);
            return {
                id: iniziativaRequests[0].id,
                tipo: 'iniziativa',
                sessione_id: iniziativaRequests[0].sessione_id
            };
        }

        // Controlla richieste tiro generico pending
        const { data: genericoRequests, error: genericoError } = await supabase
            .from('richieste_tiro_generico')
            .select('*')
            .eq('giocatore_id', userData.id)
            .eq('stato', 'pending')
            .order('timestamp', { ascending: false })
            .limit(1);

        if (genericoError) {
            console.error('❌ Errore nel controllo richieste generico:', genericoError);
        } else {
            console.log('📊 Richieste generico trovate:', genericoRequests?.length || 0);
        }

        if (genericoRequests && genericoRequests.length > 0) {
            console.log('✅ Trovata richiesta generico:', genericoRequests[0].id);
            return {
                id: genericoRequests[0].id,
                tipo: 'generico',
                sessione_id: genericoRequests[0].sessione_id,
                richiesta_id: genericoRequests[0].richiesta_id
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Errore nel controllo richieste tiro:', error);
        return null;
    }
}

/**
 * Avvia il polling per le richieste tiro
 */
function startPollingRollRequests() {
    // Rimuovi polling esistente se presente
    if (window.rollRequestPollingInterval) {
        clearInterval(window.rollRequestPollingInterval);
    }

    // Controlla ogni 2-3 secondi
    window.rollRequestPollingInterval = setInterval(async () => {
        if (!AppState.isLoggedIn || !AppState.currentUser || window.currentRollRequest) {
            return; // Non controllare se non loggato o se c'è già un popup aperto
        }

        const request = await checkPendingRollRequests(AppState.currentUser.uid);
        if (request) {
            showRollRequestModal(request);
        }
    }, 2500); // 2.5 secondi
}

/**
 * Verifica se ci sono nuove sessioni attive per campagne dell'utente
 */
async function checkNewSessions(userId) {
    if (!AppState.isLoggedIn || !userId) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const userData = await findUserByUid(userId);
        if (!userData) return;

        // Carica tutte le campagne dove l'utente è DM o giocatore
        const { data: campagneDM, error: errorDM } = await supabase
            .from('campagne')
            .select('id')
            .eq('id_dm', userData.id);

        // Per le campagne dove l'utente è giocatore, carica tutte le campagne e filtra lato client
        // (Supabase non supporta direttamente "array contains" nelle query)
        const { data: tutteCampagne, error: errorTutte } = await supabase
            .from('campagne')
            .select('id, giocatori');
        
        let campagnePlayer = [];
        if (!errorTutte && tutteCampagne) {
            campagnePlayer = tutteCampagne
                .filter(c => Array.isArray(c.giocatori) && c.giocatori.includes(userData.id))
                .map(c => ({ id: c.id }));
        }

        if (errorDM || errorPlayer) {
            console.error('❌ Errore nel caricamento campagne per sessioni:', errorDM || errorPlayer);
            return;
        }

        const campagnaIds = [
            ...(campagneDM || []).map(c => c.id),
            ...(campagnePlayer || []).map(c => c.id)
        ].filter((id, index, self) => self.indexOf(id) === index); // Rimuovi duplicati

        if (campagnaIds.length === 0) return;

        // Carica sessioni attive per queste campagne
        const { data: sessioniAttive, error: errorSessioni } = await supabase
            .from('sessioni')
            .select('id, campagna_id, data_inizio')
            .in('campagna_id', campagnaIds)
            .is('data_fine', null)
            .order('data_inizio', { ascending: false });

        if (errorSessioni) {
            console.error('❌ Errore nel caricamento sessioni attive:', errorSessioni);
            return;
        }

        if (!sessioniAttive || sessioniAttive.length === 0) return;

        // Controlla se ci sono sessioni nuove (non ancora notificate)
        const lastCheckKey = 'lastSessionCheck';
        const lastCheck = localStorage.getItem(lastCheckKey);
        const lastCheckTime = lastCheck ? parseInt(lastCheck) : 0;

        for (const sessione of sessioniAttive) {
            const sessioneTime = new Date(sessione.data_inizio).getTime();
            
            // Se la sessione è più recente dell'ultimo check, notifica
            if (sessioneTime > lastCheckTime) {
                // Carica i dettagli della campagna
                const { data: campagna, error: errorCampagna } = await supabase
                    .from('campagne')
                    .select('nome_campagna')
                    .eq('id', sessione.campagna_id)
                    .single();

                if (!errorCampagna && campagna) {
                    showInAppNotification({
                        title: 'Sessione Attiva',
                        message: `La campagna "${campagna.nome_campagna}" ha iniziato una nuova sessione`,
                        campagnaId: sessione.campagna_id,
                        sessioneId: sessione.id
                    });
                }
            }
        }

        // Aggiorna il timestamp dell'ultimo check
        localStorage.setItem(lastCheckKey, Date.now().toString());
    } catch (error) {
        console.error('❌ Errore nel controllo nuove sessioni:', error);
    }
}

/**
 * Avvia il polling per le nuove sessioni
 */
function startSessionPolling() {
    // Rimuovi polling esistente se presente
    if (window.sessionPollingInterval) {
        clearInterval(window.sessionPollingInterval);
    }

    // Controlla ogni 5 secondi
    window.sessionPollingInterval = setInterval(async () => {
        if (!AppState.isLoggedIn || !AppState.currentUser) {
            return;
        }

        await checkNewSessions(AppState.currentUser.uid);
    }, 5000); // 5 secondi
}

/**
 * Ferma il polling per le nuove sessioni
 */
function stopSessionPolling() {
    if (window.sessionPollingInterval) {
        clearInterval(window.sessionPollingInterval);
        window.sessionPollingInterval = null;
    }
}

/**
 * Mostra una notifica in-app
 */
function showInAppNotification({ title, message, campagnaId, sessioneId }) {
    const container = document.getElementById('inAppNotifications');
    if (!container) return;

    const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = 'in-app-notification';
    
    notification.innerHTML = `
        <svg class="in-app-notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <div class="in-app-notification-content">
            <div class="in-app-notification-title">${escapeHtml(title)}</div>
            <div class="in-app-notification-message">${escapeHtml(message)}</div>
        </div>
        <button class="in-app-notification-close" onclick="closeInAppNotification('${notificationId}')" aria-label="Chiudi">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    // Click sulla notifica per aprire la sessione
    if (campagnaId && sessioneId) {
        notification.onclick = function(e) {
            if (e.target.closest('.in-app-notification-close')) return;
            closeInAppNotification(notificationId);
            openSessionePage(campagnaId);
        };
    }

    container.appendChild(notification);

    // Auto-rimuovi dopo 10 secondi
    setTimeout(() => {
        closeInAppNotification(notificationId);
    }, 10000);
}

/**
 * Chiude una notifica in-app
 */
window.closeInAppNotification = function(notificationId) {
    const notification = document.getElementById(notificationId);
    if (!notification) return;

    notification.classList.add('closing');
    setTimeout(() => {
        notification.remove();
    }, 300);
}

/**
 * Ferma il polling per le richieste tiro
 */
function stopPollingRollRequests() {
    if (window.rollRequestPollingInterval) {
        clearInterval(window.rollRequestPollingInterval);
        window.rollRequestPollingInterval = null;
    }
}

/**
 * Mostra il modal per la richiesta tiro
 */
function showRollRequestModal(request) {
    if (!elements.rollRequestModal) return;

    window.currentRollRequest = request;

    if (elements.rollRequestTitle) {
        elements.rollRequestTitle.textContent = request.tipo === 'iniziativa' 
            ? 'Tiro di Iniziativa' 
            : 'Tiro Richiesto';
    }
    if (elements.rollRequestMessage) {
        elements.rollRequestMessage.textContent = request.tipo === 'iniziativa'
            ? 'Il DM ti ha richiesto di fare un tiro di iniziativa (d20 + modificatori)'
            : 'Il DM ti ha richiesto di fare un tiro (d20)';
    }
    if (elements.rollRequestLabel) {
        elements.rollRequestLabel.textContent = request.tipo === 'iniziativa'
            ? 'Risultato del tiro (d20 + modificatori):'
            : 'Risultato del tiro (d20):';
    }
    if (elements.rollRequestInput) {
        elements.rollRequestInput.value = '';
        elements.rollRequestInput.min = '1';
        elements.rollRequestInput.max = request.tipo === 'iniziativa' ? '999' : '20';
    }

    elements.rollRequestModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        if (elements.rollRequestInput) {
            elements.rollRequestInput.focus();
        }
    }, 100);
}

/**
 * Invia il risultato di un tiro (globale per essere chiamata dal form)
 */
window.submitRollRequest = async function(requestId, tipo, valore) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        const tableName = tipo === 'iniziativa' 
            ? 'richieste_tiro_iniziativa' 
            : 'richieste_tiro_generico';

        const { error } = await supabase
            .from(tableName)
            .update({ 
                valore: valore,
                stato: 'completed',
                timestamp: new Date().toISOString()
            })
            .eq('id', requestId);

        if (error) throw error;

        showNotification('Tiro inviato!');

        // Se è un tiro iniziativa, verifica se tutti hanno completato
        if (tipo === 'iniziativa') {
            const { data: richiesta } = await supabase
                .from('richieste_tiro_iniziativa')
                .select('sessione_id')
                .eq('id', requestId)
                .single();

            if (richiesta) {
                await checkAllIniziativaCompleted(richiesta.sessione_id);
            }
        }
    } catch (error) {
        console.error('❌ Errore nell\'invio tiro:', error);
        showNotification('Errore nell\'invio del tiro: ' + (error.message || error));
    }
}

/**
 * Verifica se tutti i giocatori hanno completato il tiro iniziativa
 */
async function checkAllIniziativaCompleted(sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { data: sessione } = await supabase
            .from('sessioni')
            .select('campagna_id')
            .eq('id', sessioneId)
            .single();

        if (!sessione) return;

        const { data: campagna } = await supabase
            .from('campagne')
            .select('giocatori, id_dm')
            .eq('id', sessione.campagna_id)
            .single();

        if (!campagna) return;

        // Lista tutti i partecipanti (DM + giocatori)
        const partecipanti = [campagna.id_dm, ...(campagna.giocatori || [])].filter(Boolean);

        // Controlla se tutte le richieste sono completed
        const { data: richieste, error } = await supabase
            .from('richieste_tiro_iniziativa')
            .select('giocatore_id, stato')
            .eq('sessione_id', sessioneId);

        if (error) throw error;

        const completedGiocatori = new Set(
            (richieste || []).filter(r => r.stato === 'completed').map(r => r.giocatore_id)
        );

        // Se tutti i partecipanti hanno completato, porta i giocatori alla pagina combattimento
        const allCompleted = partecipanti.every(id => completedGiocatori.has(id));

        if (allCompleted && partecipanti.length > 0) {
            // Se l'utente corrente è nella sessione, portalo al combattimento
            const userData = await findUserByUid(AppState.currentUser.uid);
            if (userData && partecipanti.includes(userData.id)) {
                navigateToPage('combattimento');
                await renderCombattimentoContent(sessione.campagna_id, sessioneId);
            }
        }
    } catch (error) {
        console.error('❌ Errore nel controllo completamento iniziativa:', error);
    }
}

/**
 * Richiede tiro iniziativa a tutti i giocatori
 */
window.richiediTiroIniziativa = async function(sessioneId, campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Verifica che l'utente sia il DM
        const isDM = await isCurrentUserDM(campagnaId);
        if (!isDM) {
            showNotification('Solo il DM può richiedere tiri');
            return;
        }

        // Carica la campagna per ottenere i giocatori
        const { data: campagna, error: campagnaError } = await supabase
            .from('campagne')
            .select('giocatori, id_dm')
            .eq('id', campagnaId)
            .single();

        if (campagnaError) throw campagnaError;

        // Rimuovi eventuali richieste pending per questa sessione
        await supabase
            .from('richieste_tiro_iniziativa')
            .delete()
            .eq('sessione_id', sessioneId);

        // Crea richieste solo per i giocatori (escludi il DM)
        const partecipanti = (campagna.giocatori || []).filter(Boolean);
        
        const richieste = partecipanti.map(giocatoreId => ({
            sessione_id: sessioneId,
            giocatore_id: giocatoreId,
            stato: 'pending'
        }));

        const { error: insertError } = await supabase
            .from('richieste_tiro_iniziativa')
            .insert(richieste);

        if (insertError) throw insertError;

        showNotification('Richieste tiro iniziativa inviate!');
        
        // Apri pagina combattimento per il DM
        navigateToPage('combattimento');
        await renderCombattimentoContent(campagnaId, sessioneId);
    } catch (error) {
        console.error('❌ Errore nella richiesta tiro iniziativa:', error);
        showNotification('Errore nella richiesta tiro iniziativa: ' + (error.message || error));
    }
};

/**
 * Richiede tiro generico a tutti i giocatori
 */
window.richiediTiroGenerico = async function(sessioneId, campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Verifica che l'utente sia il DM
        const isDM = await isCurrentUserDM(campagnaId);
        if (!isDM) {
            showNotification('Solo il DM può richiedere tiri');
            return;
        }

        // Carica la campagna per ottenere i giocatori
        const { data: campagna, error: campagnaError } = await supabase
            .from('campagne')
            .select('giocatori, id_dm')
            .eq('id', campagnaId)
            .single();

        if (campagnaError) throw campagnaError;

        // Genera un ID univoco per questa richiesta (round)
        const richiestaId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Crea richieste per tutti i partecipanti (DM + giocatori)
        const partecipanti = [campagna.id_dm, ...(campagna.giocatori || [])].filter(Boolean);
        
        const richieste = partecipanti.map(giocatoreId => ({
            sessione_id: sessioneId,
            richiesta_id: richiestaId,
            giocatore_id: giocatoreId,
            stato: 'pending'
        }));

        const { error: insertError } = await supabase
            .from('richieste_tiro_generico')
            .insert(richieste);

        if (insertError) throw insertError;

        showNotification('Richieste tiro inviate!');
        
        // Salva richiesta_id corrente
        window.currentTiroGenericoRichiestaId = richiestaId;
        
        // Aggiorna la tabella tiri generici
        await updateTiroGenericoTable(sessioneId, richiestaId);
    } catch (error) {
        console.error('❌ Errore nella richiesta tiro generico:', error);
        showNotification('Errore nella richiesta tiro generico: ' + (error.message || error));
    }
};

/**
 * Avvia polling per aggiornare la tabella tiri generici
 */
function startTiroGenericoPolling(sessioneId) {
    if (window.tiroGenericoPollingInterval) {
        clearInterval(window.tiroGenericoPollingInterval);
    }

    window.tiroGenericoPollingInterval = setInterval(async () => {
        if (window.currentTiroGenericoRichiestaId) {
            await updateTiroGenericoTable(sessioneId, window.currentTiroGenericoRichiestaId);
        }
    }, 2000); // Aggiorna ogni 2 secondi
}

/**
 * Ferma il polling per la tabella tiri generici
 */
function stopTiroGenericoPolling() {
    if (window.tiroGenericoPollingInterval) {
        clearInterval(window.tiroGenericoPollingInterval);
        window.tiroGenericoPollingInterval = null;
    }
}

/**
 * Aggiorna la tabella tiri generici nella pagina sessione
 */
async function updateTiroGenericoTable(sessioneId, richiestaId) {
    const tableElement = document.getElementById('tiroGenericoTable');
    if (!tableElement) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        // Carica tutti i tiri per questa richiesta
        const { data: tiri, error } = await supabase
            .from('richieste_tiro_generico')
            .select(`
                *,
                utenti!richieste_tiro_generico_giocatore_id_fkey(nome_utente, cid)
            `)
            .eq('sessione_id', sessioneId)
            .eq('richiesta_id', richiestaId)
            .order('timestamp', { ascending: false });

        if (error) throw error;

        if (!tiri || tiri.length === 0) {
            tableElement.style.display = 'none';
            return;
        }

        tableElement.style.display = 'block';

        const tableHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
                <h3 style="margin: 0;">Tiri Richiesti</h3>
                <button class="btn-secondary btn-small" onclick="chiudiTabellaTiri('${sessioneId}', '${richiestaId}')" style="width: auto; padding: var(--spacing-xs) var(--spacing-sm);">
                    Chiudi
                </button>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="text-align: left; padding: var(--spacing-sm); border-bottom: 2px solid var(--border);">Giocatore</th>
                        <th style="text-align: right; padding: var(--spacing-sm); border-bottom: 2px solid var(--border);">Risultato</th>
                        <th style="text-align: center; padding: var(--spacing-sm); border-bottom: 2px solid var(--border);">Stato</th>
                    </tr>
                </thead>
                <tbody>
                    ${tiri.map(tiro => `
                        <tr>
                            <td style="padding: var(--spacing-sm); border-bottom: 1px solid var(--border);">
                                ${escapeHtml(tiro.utenti?.nome_utente || 'Sconosciuto')}
                                ${tiro.utenti?.cid ? ` (CID: ${tiro.utenti.cid})` : ''}
                            </td>
                            <td style="text-align: right; padding: var(--spacing-sm); border-bottom: 1px solid var(--border);">
                                ${tiro.valore !== null ? tiro.valore : '-'}
                            </td>
                            <td style="text-align: center; padding: var(--spacing-sm); border-bottom: 1px solid var(--border);">
                                ${tiro.stato === 'completed' ? '✓' : '⏳'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        tableElement.innerHTML = tableHTML;
    } catch (error) {
        console.error('❌ Errore nell\'aggiornamento tabella tiri:', error);
    }
}

/**
 * Chiude e cancella la tabella tiri generici
 */
window.chiudiTabellaTiri = async function(sessioneId, richiestaId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Verifica che l'utente sia il DM
        const { data: sessione } = await supabase
            .from('sessioni')
            .select('campagna_id')
            .eq('id', sessioneId)
            .single();

        if (!sessione) return;

        const isDM = await isCurrentUserDM(sessione.campagna_id);
        if (!isDM) {
            showNotification('Solo il DM può chiudere la tabella');
            return;
        }

        // Cancella tutte le richieste per questa richiesta_id
        const { error } = await supabase
            .from('richieste_tiro_generico')
            .delete()
            .eq('sessione_id', sessioneId)
            .eq('richiesta_id', richiestaId);

        if (error) throw error;

        // Nascondi la tabella
        const tableElement = document.getElementById('tiroGenericoTable');
        if (tableElement) {
            tableElement.style.display = 'none';
        }

        // Reset richiesta_id corrente
        if (window.currentTiroGenericoRichiestaId === richiestaId) {
            window.currentTiroGenericoRichiestaId = null;
        }

        showNotification('Tabella tiri chiusa');
    } catch (error) {
        console.error('❌ Errore nella chiusura tabella tiri:', error);
        showNotification('Errore nella chiusura tabella: ' + (error.message || error));
    }
};

/**
 * Termina il combattimento eliminando tutte le richieste di iniziativa
 */
window.terminaCombattimento = async function(campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        // Verifica che l'utente sia il DM
        const isDM = await isCurrentUserDM(campagnaId);
        if (!isDM) {
            showNotification('Solo il DM può terminare il combattimento');
            return;
        }

        // Elimina tutte le richieste di iniziativa per questa sessione
        const { error: deleteError } = await supabase
            .from('richieste_tiro_iniziativa')
            .delete()
            .eq('sessione_id', sessioneId);

        if (deleteError) throw deleteError;

        showNotification('Combattimento terminato');
        
        // Torna alla pagina sessione
        navigateToPage('sessione');
        await renderSessioneContent(campagnaId);
    } catch (error) {
        console.error('❌ Errore nella terminazione combattimento:', error);
        showNotification('Errore nella terminazione del combattimento: ' + (error.message || error));
    }
};

/**
 * Rimuove una voce dall'iniziativa
 */
window.rimuoviIniziativa = async function(iniziativaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        const { error } = await supabase
            .from('iniziativa')
            .delete()
            .eq('id', iniziativaId);

        if (error) throw error;

        showNotification('Iniziativa rimossa!');
        
        // Ricarica la sessione
        const { data: sessione } = await supabase
            .from('sessioni')
            .select('campagna_id')
            .eq('id', sessioneId)
            .single();

        if (sessione) {
            await renderSessioneContent(sessione.campagna_id);
        }
    } catch (error) {
        console.error('❌ Errore nella rimozione iniziativa:', error);
        showNotification('Errore nella rimozione dell\'iniziativa: ' + (error.message || error));
    }
};

// Initialize app when DOM is ready
function startApp() {
    try {
        console.log('🚀 Inizializzazione app...');
        console.log('Document readyState:', document.readyState);
        
        // Call init synchronously first to set up event listeners
        init().catch(error => {
            console.error('❌ Errore durante l\'inizializzazione:', error);
            console.error('Stack:', error.stack);
        });
        
        console.log('✅ Inizializzazione avviata');
    } catch (error) {
        console.error('❌ Errore critico durante l\'inizializzazione:', error);
        console.error('Stack:', error.stack);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOMContentLoaded fired');
        startApp();
    });
} else {
    // DOM already loaded, but wait a bit for all scripts to load
    console.log('📄 DOM già caricato, attendo script...');
    setTimeout(() => {
        startApp();
    }, 100);
}


