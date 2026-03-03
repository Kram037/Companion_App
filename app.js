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
        submitRollRequestBtn: document.getElementById('submitRollRequestBtn'),
        personaggiList: document.getElementById('personaggiList'),
        personaggioModal: document.getElementById('personaggioModal'),
        closePersonaggioModal: document.getElementById('closePersonaggioModal'),
        personaggioForm: document.getElementById('personaggioForm'),
        personaggioModalTitle: document.getElementById('personaggioModalTitle'),
        cancelPersonaggioBtn: document.getElementById('cancelPersonaggioBtn'),
        savePersonaggioBtn: document.getElementById('savePersonaggioBtn'),
        scegliPersonaggioModal: document.getElementById('scegliPersonaggioModal'),
        closeScegliPersonaggioModal: document.getElementById('closeScegliPersonaggioModal'),
        scegliPersonaggioList: document.getElementById('scegliPersonaggioList')
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
    
    // Ripristina currentCampagnaId dal sessionStorage se esiste (solo per la sessione corrente)
    const savedCampagnaId = sessionStorage.getItem('currentCampagnaId');
    if (savedCampagnaId) {
        AppState.currentCampagnaId = savedCampagnaId;
        console.log('📌 Campagna salvata ripristinata dalla sessione:', savedCampagnaId);
    }
    
    // Ripristina currentSessioneId dal sessionStorage se esiste (solo per la sessione corrente)
    const savedSessioneId = sessionStorage.getItem('currentSessioneId');
    if (savedSessioneId) {
        AppState.currentSessioneId = savedSessioneId;
        console.log('📌 Sessione salvata ripristinata dalla sessione:', savedSessioneId);
    }
    
    const savedPersonaggioId = sessionStorage.getItem('currentPersonaggioId');
    if (savedPersonaggioId) {
        AppState.currentPersonaggioId = savedPersonaggioId;
        console.log('📌 Personaggio salvato ripristinato dalla sessione:', savedPersonaggioId);
    }

    // Ripristina currentPage dal sessionStorage se esiste (solo per la sessione corrente)
    const savedPage = sessionStorage.getItem('currentPage');
    if (savedPage) {
        AppState.currentPage = savedPage;
        console.log('📌 Pagina salvata ripristinata dalla sessione:', savedPage);
    }

    const savedActiveSession = sessionStorage.getItem('activeSessionCampagnaId');
    if (savedActiveSession) {
        AppState.activeSessionCampagnaId = savedActiveSession;
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

    // Browser back/forward navigation
    window.addEventListener('popstate', async (event) => {
        if (event.state && event.state.page) {
            const st = event.state;
            if (st.campagnaId) AppState.currentCampagnaId = st.campagnaId;
            if (st.sessioneId) AppState.currentSessioneId = st.sessioneId;
            if (st.personaggioId) AppState.currentPersonaggioId = st.personaggioId;

            navigateToPage(st.page, { pushHistory: false });

            if (st.page === 'dettagli' && st.campagnaId) {
                await loadCampagnaDetails(st.campagnaId);
            } else if (st.page === 'sessione' && st.campagnaId) {
                await renderSessioneContent(st.campagnaId);
            } else if (st.page === 'combattimento' && st.campagnaId && st.sessioneId) {
                await renderCombattimentoContent(st.campagnaId, st.sessioneId);
            } else if (st.page === 'scheda' && st.personaggioId) {
                await renderSchedaPersonaggio(st.personaggioId);
            }
        } else {
            // No state = initial page, go to campagne
            AppState.currentCampagnaId = null;
            AppState.currentSessioneId = null;
            navigateToPage('campagne', { pushHistory: false });
        }
    });

    // Replace current history entry with initial state
    history.replaceState({ page: AppState.currentPage || 'campagne' }, '', null);

    console.log('📄 Navigazione alla pagina iniziale...');
    navigateToPage(AppState.currentPage || 'campagne', { pushHistory: false });
    
    // Wait for Supabase to be ready (in background, non-blocking)
    waitForSupabase().then((success) => {
        if (success) {
            console.log('✅ Supabase pronto, setup auth...');
            setupSupabaseAuth();
            checkAuthState();
        } else {
            console.warn('⚠️ Supabase non disponibile, app continua senza autenticazione');
        }
    }).catch((error) => {
        console.error('❌ Errore nell\'attesa Supabase:', error);
    });

    if (localStorage.getItem('notificheEnabled') === 'true') {
        registerServiceWorker();
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'NOTIFICATION_CLICK') {
                if (event.data.campagnaId) {
                    AppState.currentCampagnaId = event.data.campagnaId;
                    if (event.data.sessioneId) {
                        AppState.currentSessioneId = event.data.sessioneId;
                        navigateToPage('sessione');
                    } else {
                        navigateToPage('dettagli');
                    }
                }
            }
        });
    }
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
                const prevName = AppState.currentUser?.displayName;
                AppState.currentUser = {
                    uid: session.user.id,
                    email: session.user.email,
                    displayName: prevName || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Utente'
                };
                AppState.isLoggedIn = true;
                updateUIForLoggedIn();
                
                initializeUserDocument(session.user).then(() => {
                    loadRazzeBackground();
                    if (AppState.cachedUserData?.nome_utente) {
                        AppState.currentUser.displayName = AppState.cachedUserData.nome_utente;
                        updateUIForLoggedIn();
                    }
                    if (AppState.currentPage === 'scheda' && AppState.currentPersonaggioId) {
                        navigateToPage('scheda');
                    } else if (AppState.currentPage === 'combattimento' && AppState.currentCampagnaId && AppState.currentSessioneId) {
                        navigateToPage('combattimento');
                    } else if (AppState.currentPage === 'sessione' && AppState.currentCampagnaId) {
                        navigateToPage('sessione');
                        renderSessioneContent(AppState.currentCampagnaId);
                    } else if (AppState.currentPage === 'dettagli' && AppState.currentCampagnaId) {
                        navigateToPage('dettagli');
                    } else if (AppState.currentCampagnaId && !['campagne','amici','personaggi','nemici','scheda'].includes(AppState.currentPage)) {
                        navigateToPage('dettagli');
                    } else {
                        navigateToPage(AppState.currentPage || 'campagne');
                    }
                    
                    startRollRequestsRealtime();
                    startSessionRealtime();
                    startAppEventsRealtime();
                    checkStartupNotifications();
                });
            } else {
                AppState.currentUser = null;
                AppState.isLoggedIn = false;
                invalidateUserCache();
                updateUIForLoggedOut();
                console.log('👤 Utente non autenticato');
                
                // Ferma Realtime subscriptions
                stopRollRequestsRealtime();
                stopSessionRealtime();
                stopAppEventsRealtime();
                
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

async function loadRazzeBackground() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    try {
        const [razzeRes, bgRes] = await Promise.all([
            supabase.from('razze').select('*').order('gruppo').order('nome'),
            supabase.from('background').select('*').order('nome')
        ]);
        if (razzeRes.data) AppState.cachedRazze = razzeRes.data;
        if (bgRes.data) AppState.cachedBackground = bgRes.data;
    } catch (e) { console.warn('Errore caricamento razze/background:', e); }
}

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
            await initializeUserDocument(session.user);
            if (AppState.cachedUserData?.nome_utente) {
                AppState.currentUser.displayName = AppState.cachedUserData.nome_utente;
            }
            updateUIForLoggedIn();
            
            if (AppState.currentPage === 'scheda' && AppState.currentPersonaggioId) {
                navigateToPage('scheda');
            } else if (AppState.currentPage === 'combattimento' && AppState.currentCampagnaId && AppState.currentSessioneId) {
                navigateToPage('combattimento');
            } else if (AppState.currentPage === 'sessione' && AppState.currentCampagnaId) {
                navigateToPage('sessione');
                renderSessioneContent(AppState.currentCampagnaId);
            } else if (AppState.currentPage === 'dettagli' && AppState.currentCampagnaId) {
                navigateToPage('dettagli');
            } else if (AppState.currentCampagnaId && !['campagne','amici','personaggi','nemici','scheda'].includes(AppState.currentPage)) {
                navigateToPage('dettagli');
            } else {
                navigateToPage(AppState.currentPage || 'campagne');
            }
            
            startRollRequestsRealtime();
            startSessionRealtime();
            startAppEventsRealtime();
            checkStartupNotifications();
        } else {
            updateUIForLoggedOut();
            stopAppEventsRealtime();
            
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
    const headerUserName = document.getElementById('headerUserName');
    if (headerUserName) {
        const dbName = AppState.cachedUserData?.nome_utente;
        headerUserName.textContent = dbName || AppState.currentUser?.displayName || '';
    }
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
    const personaggiList = document.getElementById('personaggiList');
    
    if (isLoggedIn) {
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
        if (personaggiList) {
            personaggiList.innerHTML = '<div class="content-placeholder"><p>Non ci sono personaggi. Crea il tuo (ennesimo) alter ego!</p></div>';
        }
    } else {
        if (amiciPlaceholder) {
            amiciPlaceholder.innerHTML = '<p>Accedi per vedere i tuoi amici</p>';
        }
        if (nemiciPlaceholder) {
            nemiciPlaceholder.innerHTML = '<p>Accedi per vedere e creare i tuoi nemici</p>';
        }
        if (personaggiList) {
            personaggiList.innerHTML = '<div class="content-placeholder"><p>Accedi per vedere e creare i tuoi personaggi</p></div>';
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
    if (elements.userBtn) {
        elements.userBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!AppState.isLoggedIn) {
                openLoginModal();
            } else {
                openUserModal();
            }
        };
    }

    if (elements.settingsBtn) {
        elements.settingsBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openSettingsModal();
        };
    }

    // Close modals
    if (elements.closeLoginModal) {
        elements.closeLoginModal.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeLoginModal();
        };
    }
    if (elements.closeUserModal) {
        elements.closeUserModal.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeUserModal();
        };
    }
    if (elements.closeSettingsModal) {
        elements.closeSettingsModal.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeSettingsModal();
        };
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

    const notificheToggle = document.getElementById('notificheToggle');
    if (notificheToggle) {
        const notifSaved = localStorage.getItem('notificheEnabled');
        if (notifSaved !== null) {
            notificheToggle.checked = notifSaved === 'true';
        } else {
            notificheToggle.checked = ('Notification' in window && Notification.permission === 'granted');
        }

        notificheToggle.addEventListener('change', async function() {
            if (this.checked) {
                const granted = await requestNotificationPermission();
                if (granted) {
                    localStorage.setItem('notificheEnabled', 'true');
                    showNotification('Notifiche attivate');
                    registerServiceWorker();
                } else {
                    this.checked = false;
                    localStorage.setItem('notificheEnabled', 'false');
                }
            } else {
                localStorage.setItem('notificheEnabled', 'false');
                showNotification('Notifiche disattivate');
            }
        });
    }

    if (elements.themeLight) {
        elements.themeLight.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            setTheme('light');
        };
    }
    if (elements.themeDark) {
        elements.themeDark.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            setTheme('dark');
        };
    }

    // Login form submission
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }

    // Logout button
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }

    if (elements.toolbarBtns && elements.toolbarBtns.length > 0) {
        elements.toolbarBtns.forEach((btn) => {
            const page = btn.getAttribute('data-page');
            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                navigateToPage(page);
            };
        });
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

    if (elements.addCampagnaBtn) {
        elements.addCampagnaBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openCampagnaModal();
        };
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
    
    if (elements.addPersonaggioBtn) {
        elements.addPersonaggioBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openPersonaggioModal();
        };
    }

    if (elements.closePersonaggioModal) {
        elements.closePersonaggioModal.onclick = () => closePersonaggioModal();
    }
    if (elements.cancelPersonaggioBtn) {
        elements.cancelPersonaggioBtn.onclick = () => closePersonaggioModal();
    }
    if (elements.personaggioModal) {
        elements.personaggioModal.addEventListener('click', (e) => {
            if (e.target === elements.personaggioModal) closePersonaggioModal();
        });
    }
    if (elements.personaggioForm) {
        elements.personaggioForm.addEventListener('submit', (e) => e.preventDefault());
        elements.personaggioForm.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') e.preventDefault();
        });
    }
    if (elements.savePersonaggioBtn) {
        elements.savePersonaggioBtn.addEventListener('click', (e) => handleSavePersonaggio(e));
    }

    const abilityFields = ['Forza', 'Destrezza', 'Costituzione', 'Intelligenza', 'Saggezza', 'Carisma'];
    abilityFields.forEach(name => {
        const input = document.getElementById(`pg${name}`);
        const modEl = document.getElementById(`mod${name}`);
        if (input && modEl) {
            input.addEventListener('input', () => updateAbilityMod(input, modEl));
        }
    });
    
    ['Forza','Destrezza','Costituzione','Intelligenza','Saggezza','Carisma'].forEach(name => {
        const cb = document.getElementById(`save${name}`);
        if (cb) cb.addEventListener('change', () => updateAllSaveValues());
    });
    const pgPVInput = document.getElementById('pgPV');
    if (pgPVInput) {
        pgPVInput.addEventListener('input', () => { pgPVInput.dataset.autoHp = 'false'; });
    }
    const pgCosInput = document.getElementById('pgCostituzione');
    if (pgCosInput) {
        pgCosInput.addEventListener('input', () => {
            const pvField = document.getElementById('pgPV');
            if (pvField) pvField.dataset.autoHp = 'true';
            pgRenderDadiVita();
        });
    }
    if (elements.closeScegliPersonaggioModal) {
        elements.closeScegliPersonaggioModal.onclick = () => closeScegliPersonaggioModal();
    }
    if (elements.scegliPersonaggioModal) {
        elements.scegliPersonaggioModal.addEventListener('click', (e) => {
            if (e.target === elements.scegliPersonaggioModal) closeScegliPersonaggioModal();
        });
    }

    const btnReturnSession = document.getElementById('btnReturnSession');
    if (btnReturnSession) {
        btnReturnSession.addEventListener('click', async () => {
            const campagnaId = AppState.activeSessionCampagnaId;
            if (!campagnaId) return;
            const isActive = await checkSessioneAttiva(campagnaId);
            if (isActive) {
                openSessionePage(campagnaId);
            } else {
                clearActiveSession();
                showNotification('La sessione è terminata');
            }
        });
    }

    const richiediTiroModal = document.getElementById('richiediTiroModal');
    const closeRichiediTiroBtn = document.getElementById('closeRichiediTiroModal');
    const cancelRichiediTiroBtn = document.getElementById('cancelRichiediTiro');
    const confirmRichiediTiroBtn = document.getElementById('confirmRichiediTiro');
    const tipoTiroSelect = document.getElementById('tipoTiroSelect');

    if (closeRichiediTiroBtn) closeRichiediTiroBtn.onclick = closeRichiediTiroModal;
    if (cancelRichiediTiroBtn) cancelRichiediTiroBtn.onclick = closeRichiediTiroModal;
    if (confirmRichiediTiroBtn) confirmRichiediTiroBtn.onclick = executeRichiediTiro;
    if (tipoTiroSelect) tipoTiroSelect.addEventListener('change', updateTiroTargetOptions);
    if (richiediTiroModal) {
        richiediTiroModal.addEventListener('click', (e) => {
            if (e.target === richiediTiroModal) closeRichiediTiroModal();
        });
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
            sessionStorage.removeItem('currentCampagnaId');
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
                const natRoll = elements.rollRequestInput.dataset.natRoll
                    ? parseInt(elements.rollRequestInput.dataset.natRoll)
                    : null;
                await submitRollRequest(window.currentRollRequest.id, window.currentRollRequest.tipo, valore, natRoll);
                closeRollRequestModal();
            }
        });
    }
    const autoRollBtn = document.getElementById('autoRollBtn');
    if (autoRollBtn) {
        autoRollBtn.addEventListener('click', () => {
            if (autoRollBtn.disabled) return;
            const d20 = Math.floor(Math.random() * 20) + 1;
            const mod = window.currentRollModifier || 0;
            const total = d20 + mod;
            const isNatCrit = d20 === 1 || d20 === 20;

            if (elements.rollRequestInput) {
                elements.rollRequestInput.value = total;
                elements.rollRequestInput.dataset.natRoll = d20;
            }

            const d20Text = document.getElementById('d20RollText');
            if (d20Text) {
                d20Text.textContent = d20;
                d20Text.classList.add('show');
                d20Text.classList.toggle('nat-crit', isNatCrit);
            }

            const d20Img = autoRollBtn.querySelector('.roll-d20-img');
            if (d20Img) {
                d20Img.classList.remove('spinning');
                void d20Img.offsetWidth;
                d20Img.classList.add('spinning');
            }

            autoRollBtn.disabled = true;
        });
    }

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
    
}

function clearActiveSession() {
    AppState.activeSessionCampagnaId = null;
    sessionStorage.removeItem('activeSessionCampagnaId');
    updateReturnToSessionBtn();
}

function updateReturnToSessionBtn() {
    const btn = document.getElementById('btnReturnSession');
    if (!btn) return;
    const isSessionPage = AppState.currentPage === 'sessione' || AppState.currentPage === 'combattimento';
    const isDettagliOfActiveSession = AppState.currentPage === 'dettagli'
        && AppState.currentCampagnaId === AppState.activeSessionCampagnaId;
    const show = AppState.activeSessionCampagnaId && !isSessionPage && !isDettagliOfActiveSession;
    btn.style.display = show ? 'flex' : 'none';
}

// Navigation
function navigateToPage(pageName, { pushHistory = true } = {}) {
    const previousPage = AppState.currentPage;

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
    
    // Salva la pagina corrente nel sessionStorage
    sessionStorage.setItem('currentPage', pageName);
    
    // Salva currentCampagnaId e currentSessioneId solo per pagine che lo richiedono
    if (pageName === 'dettagli' || pageName === 'sessione' || pageName === 'combattimento') {
        if (AppState.currentCampagnaId) {
            sessionStorage.setItem('currentCampagnaId', AppState.currentCampagnaId);
        }
        if (pageName === 'combattimento' && AppState.currentSessioneId) {
            sessionStorage.setItem('currentSessioneId', AppState.currentSessioneId);
        } else {
            sessionStorage.removeItem('currentSessioneId');
            AppState.currentSessioneId = null;
        }
    } else if (pageName === 'scheda') {
        if (AppState.currentPersonaggioId) {
            sessionStorage.setItem('currentPersonaggioId', AppState.currentPersonaggioId);
        }
    } else {
        if (pageName === 'campagne' || pageName === 'amici' || pageName === 'personaggi' || pageName === 'nemici') {
            sessionStorage.removeItem('currentCampagnaId');
            sessionStorage.removeItem('currentSessioneId');
            sessionStorage.removeItem('currentPersonaggioId');
            AppState.currentCampagnaId = null;
            AppState.currentSessioneId = null;
            AppState.currentPersonaggioId = null;
        }
    }

    // Push to browser history so back/forward buttons work within the app
    if (pushHistory && previousPage !== pageName) {
        const stateObj = {
            page: pageName,
            campagnaId: AppState.currentCampagnaId || null,
            sessioneId: AppState.currentSessioneId || null,
            personaggioId: AppState.currentPersonaggioId || null
        };
        history.pushState(stateObj, '', null);
    }
    
    // Ferma Realtime subscription combattimento se si esce dalla pagina
    if (pageName !== 'combattimento') {
        stopCombattimentoRealtime();
    }
    
    // Ferma Realtime subscription dettagli campagna se si esce dalla pagina
    if (pageName !== 'dettagli') {
        stopCampagnaDetailsRealtime();
    }
    
    if (pageName === 'amici' && AppState.isLoggedIn) {
        loadAmici();
    } else if (pageName === 'campagne') {
        if (AppState.isLoggedIn && AppState.currentUser) {
            loadCampagne(AppState.currentUser.uid);
        }
    } else if (pageName === 'personaggi' && AppState.isLoggedIn) {
        loadPersonaggi();
    } else if (pageName === 'dettagli' && AppState.currentCampagnaId) {
        loadCampagnaDetails(AppState.currentCampagnaId);
    } else if (pageName === 'combattimento' && AppState.currentCampagnaId && AppState.currentSessioneId) {
        renderCombattimentoContent(AppState.currentCampagnaId, AppState.currentSessioneId).then(() => {
            if (!window.combattimentoChannel) {
                startCombattimentoRealtime(AppState.currentCampagnaId, AppState.currentSessioneId);
            }
        });
    } else if (pageName === 'scheda' && AppState.currentPersonaggioId) {
        renderSchedaPersonaggio(AppState.currentPersonaggioId);
    }

    updateReturnToSessionBtn();
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
                    if (userData.nome_utente) {
                        if (elements.userName) elements.userName.textContent = userData.nome_utente;
                        const headerUserName = document.getElementById('headerUserName');
                        if (headerUserName) headerUserName.textContent = userData.nome_utente;
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
                    await sendAppEventBroadcast({ table: 'utenti', action: 'update', uid: AppState.currentUser.uid });
                } catch (error) {
                    console.error('❌ Errore nel salvataggio tema in Supabase:', error);
                }
            }
        }
    }
}

// Supabase - Campagne Management
let campagneChannel = null;
let appEventsChannel = null;
let appEventsRefreshTimeout = null;
let editingCampagnaId = null;

async function loadCampagne(userId, options = {}) {
    const supabase = getSupabaseClient();
    const { skipRealtimeSetup = false, silent = false } = options;

    if (!supabase || !userId) return;

    if (!silent && elements.campagneList) {
        elements.campagneList.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento campagne...</p></div>';
    }
    
    // Disconnetti da eventuali subscription precedenti
    if (!skipRealtimeSetup && campagneChannel) {
        supabase.removeChannel(campagneChannel);
        campagneChannel = null;
    }

    try {
        const [invitiRicevuti, utente] = await Promise.all([
            loadInvitiRicevuti(userId),
            findUserByUid(userId)
        ]);
        
        if (!utente) {
            console.error('❌ Utente non trovato nella tabella utenti');
            renderCampagne([], false);
            return;
        }

        const [campagneResult, invitiResult, preferitiResult] = await Promise.all([
            supabase.from('campagne').select('*').eq('id_dm', utente.id).order('data_creazione', { ascending: false }),
            supabase.from('inviti_campagna').select(`campagna_id, campagne:campagne!inviti_campagna_campagna_id_fkey(*)`).eq('invitato_id', utente.id).eq('stato', 'accepted'),
            supabase.from('utenti').select('campagne_preferite').eq('id', utente.id).single()
        ]);

        if (campagneResult.error) throw campagneResult.error;
        const campagneCreate = campagneResult.data;
        const invitiAccettati = invitiResult.data;
        if (invitiResult.error) console.error('❌ Errore nel caricamento inviti accettati:', invitiResult.error);

        const campagne = campagneCreate || [];
        if (invitiAccettati && invitiAccettati.length > 0) {
            const campagnePartecipate = invitiAccettati
                .map(inv => inv.campagne)
                .filter(Boolean)
                .filter(camp => !campagne.some(c => c.id === camp.id));
            campagne.push(...campagnePartecipate);
        }

        const campagnePreferite = (preferitiResult.data?.campagne_preferite || []);

        // Aggiungi un campo isPreferito a ogni campagna
        campagne.forEach(campagna => {
            campagna.isPreferito = campagnePreferite.includes(campagna.id);
        });

        // Ordina le campagne: prima i preferiti, poi per data di creazione (più recenti prima)
        campagne.sort((a, b) => {
            // Preferiti in cima
            if (a.isPreferito && !b.isPreferito) return -1;
            if (!a.isPreferito && b.isPreferito) return 1;
            // Tra preferiti o tra non preferiti, ordina per data di creazione (più recenti prima)
            return new Date(b.data_creazione || 0) - new Date(a.data_creazione || 0);
        });

        console.log('✅ Campagne caricate:', campagne?.length || 0);
        
        // Applica i filtri prima di renderizzare (passa l'ID utente per filtri ruolo)
        AppState.cachedCampagne = campagne || [];
        const campagneFiltrate = applyCampagneFilters(AppState.cachedCampagne, AppState.campagneFilters, utente.id);
        renderCampagne(campagneFiltrate, true, invitiRicevuti);

        // Setup real-time subscription
        if (!skipRealtimeSetup) {
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
                        // Ricarica campagne preservando inviti, preferiti e filtri
                        await loadCampagne(userId, { skipRealtimeSetup: true });
                    }
                )
                .subscribe();
        }

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
                cid: row.inviante_cid
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

    // Filtro per tipologia (se il campo esiste nel database)
    if (filters.tipologia && filters.tipologia !== 'all') {
        filtered = filtered.filter(c => {
            // Se il campo tipologia non esiste, ignora il filtro
            if (!c.tipologia) return true;
            return c.tipologia === filters.tipologia;
        });
    }

    // Filtro per DM
    if (filters.dm === 'yes') {
        filtered = filtered.filter(c => c.id_dm === currentUserId);
    } else if (filters.dm === 'no') {
        filtered = filtered.filter(c => c.id_dm !== currentUserId);
    }

    // Filtro per preferiti
    if (filters.soloPreferiti) {
        filtered = filtered.filter(c => c.isPreferito === true);
    }

    // Ordinamento: prima i preferiti, poi per data di creazione (più recenti prima)
    filtered.sort((a, b) => {
        // Preferiti in cima
        if (a.isPreferito && !b.isPreferito) return -1;
        if (!a.isPreferito && b.isPreferito) return 1;
        // Tra preferiti o tra non preferiti, ordina per data di creazione (più recenti prima)
        const dateA = new Date(a.data_creazione || 0);
        const dateB = new Date(b.data_creazione || 0);
        return dateB - dateA;
    });

    return filtered;
}

/**
 * Setup event listeners per i filtri campagne
 */
function setupCampagneFilters() {
    const searchInput = document.getElementById('campagneSearchInput');
    const tipologiaFilter = document.getElementById('campagneTipologiaFilter');
    const dmFilter = document.getElementById('campagneDMFilter');
    const preferitiFilter = document.getElementById('togglePreferitiFilter');
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

    if (tipologiaFilter) {
        tipologiaFilter.addEventListener('change', (e) => {
            AppState.campagneFilters.tipologia = e.target.value;
            applyFiltersAndRerender();
        });
    }

    if (dmFilter) {
        dmFilter.addEventListener('change', (e) => {
            AppState.campagneFilters.dm = e.target.value;
            applyFiltersAndRerender();
        });
    }

    if (preferitiFilter) {
        preferitiFilter.addEventListener('change', (e) => {
            AppState.campagneFilters.soloPreferiti = e.target.checked;
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
            if (tipologiaFilter) tipologiaFilter.value = AppState.campagneFilters.tipologia || 'all';
            if (dmFilter) dmFilter.value = AppState.campagneFilters.dm || 'all';
            if (preferitiFilter) preferitiFilter.checked = AppState.campagneFilters.soloPreferiti || false;
        } catch (e) {
            console.warn('Errore nel caricamento filtri salvati:', e);
        }
    }
}

/**
 * Applica i filtri usando i dati cached (senza ricaricare da DB)
 */
async function applyFiltersAndRerender() {
    if (!AppState.currentUser || !AppState.isLoggedIn) return;
    
    localStorage.setItem('campagneFilters', JSON.stringify(AppState.campagneFilters));
    
    if (AppState.cachedCampagne && AppState.cachedUserData) {
        const campagneFiltrate = applyCampagneFilters(AppState.cachedCampagne, AppState.campagneFilters, AppState.cachedUserData.id);
        renderCampagne(campagneFiltrate, true);
    } else {
        await loadCampagne(AppState.currentUser.uid);
    }
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

    const dmIds = [...new Set(campagne.map(c => c.id_dm).filter(Boolean))];
    let dmMap = new Map();
    const supabase = getSupabaseClient();
    
    if (currentUserId && AppState.cachedUserData) {
        dmMap.set(currentUserId, AppState.cachedUserData);
    }
    
    if (dmIds.length > 0 && supabase) {
        try {
            const { data: dms, error: dmsError } = await supabase
                .rpc('get_dms_campagne', { p_dm_ids: dmIds });
            
            if (!dmsError && dms) {
                dms.forEach(dm => dmMap.set(dm.id, dm));
            } else if (dmsError) {
                console.warn('⚠️ RPC get_dms_campagne fallita, fallback query diretta:', dmsError);
                const missingIds = dmIds.filter(id => !dmMap.has(id));
                if (missingIds.length > 0) {
                    const { data: fallbackDms } = await supabase
                        .from('utenti')
                        .select('id, nome_utente, cid')
                        .in('id', missingIds);
                    if (fallbackDms) {
                        fallbackDms.forEach(dm => dmMap.set(dm.id, dm));
                    }
                }
            }
        } catch (err) {
            console.error('❌ Errore nel caricamento DM:', err);
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

        const iconName = campagna.icona_name || 'dice';
        const selectedIcon = predefinedIcons.find(i => i.name === iconName) || predefinedIcons[0];
        const iconaHTML = `<div class="campagna-icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${selectedIcon.svg}</svg></div>`;

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

        if (AppState.currentUser) {
            AppState.currentUser.displayName = newName;
        }

        await supabase.auth.updateUser({ data: { display_name: newName } });

        await sendAppEventBroadcast({ table: 'utenti', action: 'update', userId: utente.id });

        if (elements.userName) {
            elements.userName.textContent = newName;
        }
        const headerUserName = document.getElementById('headerUserName');
        if (headerUserName) headerUserName.textContent = newName;
        invalidateUserCache();
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
 * Trova l'utente per uid (con cache)
 */
async function findUserByUid(uid, forceRefresh = false) {
    if (!forceRefresh && AppState.cachedUserData && AppState.currentUser && AppState.currentUser.uid === uid) {
        return AppState.cachedUserData;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return null;
    
    try {
        const { data, error } = await supabase
            .from('utenti')
            .select('*')
            .eq('uid', uid)
            .maybeSingle();
        
        if (error) {
            if (error.code === 'PGRST116') return null;
            console.error('❌ Errore nella ricerca utente per uid:', error);
            throw error;
        }
        
        if (data && AppState.currentUser && AppState.currentUser.uid === uid) {
            AppState.cachedUserData = data;
        }
        return data;
    } catch (error) {
        console.error('❌ Errore nella ricerca utente per uid:', error);
        return null;
    }
}

function invalidateUserCache() {
    AppState.cachedUserData = null;
    AppState.cachedCampagne = null;
}

/**
 * Inizializza o aggiorna l'utente in Supabase
 */
async function initializeUserDocument(user) {
    const supabase = getSupabaseClient();
    
    if (!supabase || !user) return null;
    
    if (initializingUsers.has(user.id)) {
        let waitAttempts = 0;
        while (initializingUsers.has(user.id) && waitAttempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitAttempts++;
        }
        return await findUserByUid(user.id);
    }
    
    initializingUsers.add(user.id);
    
    try {
        const existingUser = await findUserByUid(user.id);
        
        const currentTheme = localStorage.getItem('theme') || 'light';
        const temaScuro = currentTheme === 'dark';
        const nomeUtente = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utente';
        
        if (existingUser) {
            const { data, error } = await supabase
                .from('utenti')
                .update({
                    email: user.email,
                    tema_scuro: temaScuro
                })
                .eq('uid', user.id)
                .select()
                .single();
            
            if (error) throw error;
            
            if (data) {
                AppState.cachedUserData = data;
            }
            
            await sendAppEventBroadcast({ table: 'utenti', action: 'update', uid: user.id });
            await loadUserData(user.id);
            
            return data;
        } else {
            let cid;
            try {
                cid = await generateUniqueCid();
            } catch (cidError) {
                console.error('❌ Errore nella generazione CID, uso fallback:', cidError);
                cid = Math.floor(1000 + Math.random() * 9000);
            }
            
            const userData = {
                uid: user.id, // UUID di Supabase Auth
                cid: cid,
                nome_utente: nomeUtente,
                email: user.email,
                tema_scuro: temaScuro
            };
            
            
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
                
                if (!error) break;
                
                if (error.code === '23505') {
                    attempts++;
                    if (attempts < 3) {
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
                                await sendAppEventBroadcast({ table: 'utenti', action: 'update', uid: user.id });
                                break;
                            }
                        }
                        continue;
                    }
                }
                break; // Errore diverso o troppi tentativi
            }
            
            if (error) throw error;
            
            if (data) {
                AppState.cachedUserData = data;
            }
            
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
            
            const safeNomeUtente = escapeHtml(data.nome_utente || '');
            const safeCid = escapeHtml(String(data.cid ?? ''));
            searchUserInfo.innerHTML = `
                <p><strong>${safeNomeUtente}</strong> (CID: ${safeCid})</p>
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
        await sendAppEventBroadcast({ table: 'richieste_amicizia', action: 'update', requestId });
        
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
        await sendAppEventBroadcast({ table: 'richieste_amicizia', action: 'update', requestId });
        
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
        await sendAppEventBroadcast({ table: 'richieste_amicizia', action: 'delete', amicoId });

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
async function loadAmici(options = {}) {
    if (!AppState.isLoggedIn || !AppState.currentUser) return;
    const { silent = false } = options;
    
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    const amiciPlaceholder = document.getElementById('amiciPlaceholder');
    if (!silent && amiciPlaceholder) {
        amiciPlaceholder.style.display = 'block';
        amiciPlaceholder.innerHTML = '<div class="loading-spinner"></div><p>Caricamento amici...</p>';
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
            cid: row.cid
        }));
        
        // Formatta le richieste in entrata
        const richiesteInEntrata = (richiesteEntrataResult.data || []).map(row => ({
            id: row.richiesta_id,
            utente: {
                id: row.richiedente_id,
                nome_utente: row.nome_utente,
                cid: row.cid
            }
        }));
        
        // Formatta le richieste in uscita
        const richiesteInUscita = (richiesteUscitaResult.data || []).map(row => ({
            id: row.richiesta_id,
            utente: {
                id: row.destinatario_id,
                nome_utente: row.nome_utente,
                cid: row.cid
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
                                <p class="amico-nome">${escapeHtml(req.utente?.nome_utente || 'Utente')}</p>
                                <p class="amico-cid">CID: ${escapeHtml(String(req.utente?.cid ?? ''))}</p>
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
                            <p class="amico-nome">${escapeHtml(amico.nome_utente || 'Utente')}</p>
                            <p class="amico-cid">CID: ${escapeHtml(String(amico.cid ?? ''))}</p>
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

// ============================================================================
// CUSTOM DROPDOWN COMPONENT
// ============================================================================

window.openCustomDropdown = function(options, { selected, multi, title, onConfirm, onSelect }) {
    const existing = document.getElementById('customDropdownOverlay');
    if (existing) existing.remove();

    const selectedSet = new Set(Array.isArray(selected) ? selected : (selected ? [selected] : []));

    const overlay = document.createElement('div');
    overlay.id = 'customDropdownOverlay';
    overlay.className = 'custom-dd-overlay';

    const optionsHtml = options.map(opt => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const isSelected = selectedSet.has(val);
        if (multi) {
            return `<label class="custom-dd-option" data-value="${escapeHtml(val)}">
                <input type="checkbox" ${isSelected ? 'checked' : ''} value="${escapeHtml(val)}">
                <span>${escapeHtml(label)}</span>
            </label>`;
        }
        return `<div class="custom-dd-option ${isSelected ? 'active' : ''}" data-value="${escapeHtml(val)}">${escapeHtml(label)}</div>`;
    }).join('');

    overlay.innerHTML = `
        <div class="custom-dd-modal">
            <div class="custom-dd-header">
                <span class="custom-dd-title">${escapeHtml(title || 'Seleziona')}</span>
                <button class="custom-dd-close" onclick="closeCustomDropdown()">&times;</button>
            </div>
            <div class="custom-dd-options">${optionsHtml}</div>
            ${multi ? '<div class="custom-dd-footer"><button class="btn-primary btn-small custom-dd-confirm">Aggiungi</button></div>' : ''}
        </div>`;

    if (multi) {
        overlay.querySelector('.custom-dd-confirm').addEventListener('click', () => {
            const checked = [...overlay.querySelectorAll('.custom-dd-option input:checked')].map(cb => cb.value);
            closeCustomDropdown();
            if (onConfirm) onConfirm(checked);
        });
    } else {
        overlay.querySelectorAll('.custom-dd-option').forEach(el => {
            el.addEventListener('click', () => {
                closeCustomDropdown();
                if (onSelect) onSelect(el.dataset.value);
            });
        });
    }

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCustomDropdown(); });
    document.body.appendChild(overlay);
}

window.closeCustomDropdown = function() {
    const overlay = document.getElementById('customDropdownOverlay');
    if (overlay) overlay.remove();
}

// RESISTENZE_OPTIONS removed — use DAMAGE_TYPES from custom select component

// ============================================================================
// CUSTOM SELECT COMPONENT
// ============================================================================

window.openCustomSelect = function(options, callback, title) {
    closeCustomSelect();
    window._customSelectOptions = options;
    window._customSelectCb = callback;
    const overlay = document.createElement('div');
    overlay.id = 'customSelectOverlay';
    overlay.className = 'custom-select-overlay';
    const listHtml = options.map((o, i) => {
        if (o.type === 'divider') return `<div class="custom-select-divider">${escapeHtml(o.label)}</div>`;
        return `<button type="button" class="custom-select-item" data-idx="${i}">${escapeHtml(o.label)}</button>`;
    }).join('');
    overlay.innerHTML = `
        <div class="custom-select-panel">
            <div class="custom-select-header">
                <span>${escapeHtml(title || 'Seleziona')}</span>
                <button class="custom-select-close" onclick="closeCustomSelect()">&times;</button>
            </div>
            <div class="custom-select-list">${listHtml}</div>
        </div>`;
    overlay.querySelector('.custom-select-list').addEventListener('click', (e) => {
        const btn = e.target.closest('.custom-select-item');
        if (btn) {
            const opt = window._customSelectOptions[parseInt(btn.dataset.idx)];
            if (opt && window._customSelectCb) window._customSelectCb(opt.value, opt.label);
            closeCustomSelect();
        }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCustomSelect(); });
    document.body.appendChild(overlay);
}

window.openMultiSelect = function(options, currentSelected, callback, title) {
    closeCustomSelect();
    window._multiSelectState = new Set(currentSelected || []);
    window._multiSelectCb = callback;
    const overlay = document.createElement('div');
    overlay.id = 'customSelectOverlay';
    overlay.className = 'custom-select-overlay';
    overlay.innerHTML = `
        <div class="custom-select-panel">
            <div class="custom-select-header">
                <span>${escapeHtml(title || 'Seleziona')}</span>
                <button class="custom-select-close" onclick="closeCustomSelect()">&times;</button>
            </div>
            <div class="custom-select-list">
                ${options.map((o, i) => `
                <label class="custom-select-check-item">
                    <input type="checkbox" data-idx="${i}" ${window._multiSelectState.has(o.value) ? 'checked' : ''}>
                    <span>${escapeHtml(o.label)}</span>
                </label>`).join('')}
            </div>
            <div class="custom-select-footer">
                <button type="button" class="btn-primary btn-small" onclick="confirmMultiSelect()">Aggiungi</button>
            </div>
        </div>`;
    overlay.querySelectorAll('.custom-select-check-item input').forEach(cb => {
        cb.addEventListener('change', () => {
            const opt = options[parseInt(cb.dataset.idx)];
            if (cb.checked) window._multiSelectState.add(opt.value);
            else window._multiSelectState.delete(opt.value);
        });
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCustomSelect(); });
    document.body.appendChild(overlay);
}

window.confirmMultiSelect = function() {
    if (window._multiSelectCb) window._multiSelectCb([...window._multiSelectState]);
    closeCustomSelect();
}

window.closeCustomSelect = function() {
    const el = document.getElementById('customSelectOverlay');
    if (el) el.remove();
    window._customSelectCb = null;
    window._customSelectOptions = null;
    window._multiSelectCb = null;
    window._multiSelectState = null;
}

const DAMAGE_TYPES = [
    { value: 'acido', label: 'Acido' }, { value: 'contundente', label: 'Contundente' },
    { value: 'freddo', label: 'Freddo' }, { value: 'fulmine', label: 'Fulmine' },
    { value: 'fuoco', label: 'Fuoco' }, { value: 'forza', label: 'Forza' },
    { value: 'necrotico', label: 'Necrotico' }, { value: 'perforante', label: 'Perforante' },
    { value: 'psichico', label: 'Psichico' }, { value: 'radiante', label: 'Radiante' },
    { value: 'tagliente', label: 'Tagliente' }, { value: 'tuono', label: 'Tuono' },
    { value: 'veleno', label: 'Veleno' }
];

// ============================================================================
// PERSONAGGI MANAGEMENT
// ============================================================================

let editingPersonaggioId = null;
let pgWizardCurrentStep = 0;
let pgSelectedClasses = [];

// =====================================================
// FONTI APPROVATE:
// PHB  = Manuale del Giocatore
// DMG  = Manuale del Dungeon Master
// MM   = Manuale dei Mostri
// XGtE = Guida Omnicomprensiva di Xanathar
// TCoE = Calderone Omnicomprensivo di Tasha
// FToD = Il Tesoro dei Draghi di Fizban
// EBR  = Eberron: Nascita dall'Ultima Guerra
// MToF = Tomo dei Nemici di Mordenkainen
// VGtM = Guida dei Mostri di Volo
// =====================================================

const DND_CLASSES = ['Artefice','Barbaro','Bardo','Chierico','Druido','Guerriero','Ladro','Mago','Monaco','Paladino','Ranger','Stregone','Warlock'];

const DND_RACES_GROUPED = [
    { label: 'Dragonidi', type: 'divider' },
    'Dragonide Cromatico',              // FToD
    'Dragonide di Gemma',               // FToD
    'Dragonide Metallico',              // FToD
    { label: 'Elfi', type: 'divider' },
    'Eladrin',                          // MToF
    'Elfo Alto',                        // PHB
    'Elfo dei Boschi',                  // PHB
    'Elfo del Mare',                    // MToF
    'Elfo Oscuro (Drow)',               // PHB
    'Shadar-kai',                       // MToF
    { label: 'Gith', type: 'divider' },
    'Githyanki',                        // MToF
    'Githzerai',                        // MToF
    { label: 'Gnomi', type: 'divider' },
    'Gnomo del Profondo',               // MToF
    'Gnomo delle Foreste',              // PHB
    'Gnomo delle Rocce',                // PHB
    { label: 'Halfling', type: 'divider' },
    'Halfling Piedelesto',              // PHB
    'Halfling Tozzo',                   // PHB
    { label: 'Nani', type: 'divider' },
    'Duergar',                          // MToF
    'Nano delle Colline',               // PHB
    'Nano delle Montagne',              // PHB
    { label: 'Tiefling', type: 'divider' },
    'Tiefling di Asmodeus',             // PHB
    'Tiefling di Baalzebul',            // MToF
    'Tiefling di Dispater',             // MToF
    'Tiefling di Fierna',               // MToF
    'Tiefling di Glasya',               // MToF
    'Tiefling di Levistus',             // MToF
    'Tiefling di Mammon',               // MToF
    'Tiefling di Mephistopheles',       // MToF
    'Tiefling di Zariel',               // MToF
    { type: 'divider', label: '' },
    'Aasimar',                          // VGtM
    'Bugbear',                          // EBR / VGtM
    'Changeling',                       // EBR
    'Firbolg',                          // VGtM
    'Goblin',                           // EBR / VGtM
    'Goliath',                          // VGtM
    'Hobgoblin',                        // EBR / VGtM
    'Kalashtar',                        // EBR
    'Kenku',                            // VGtM
    'Kobold',                           // VGtM
    'Lineaggio Personalizzato',         // TCoE
    'Lizardfolk',                       // VGtM
    'Mezzelfo',                         // PHB
    'Mezzorco',                         // PHB
    'Orco',                             // EBR / VGtM
    'Shifter',                          // EBR
    'Tabaxi',                           // VGtM
    'Triton',                           // VGtM
    'Umano',                            // PHB
    'Warforged',                        // EBR
    'Yuan-Ti Purblood',                 // VGtM
];

const DND_BACKGROUNDS = [
    // PHB
    'Accolito','Artigiano di Gilda','Ciarlatano','Criminale','Eremita',
    'Eroe Popolare','Forestiero','Intrattenitore','Marinaio','Monello',
    'Nobile','Ricercatore','Soldato',
    // PHB (varianti)
    'Cavaliere','Gladiatore','Mercante di Gilda','Pirata','Spia',
    // EBR
    'Agente di Casata'
];

const CLASS_SAVES = {
    'Artefice': ['costituzione','intelligenza'],
    'Barbaro': ['forza','costituzione'],
    'Bardo': ['destrezza','carisma'],
    'Chierico': ['saggezza','carisma'],
    'Druido': ['intelligenza','saggezza'],
    'Guerriero': ['forza','costituzione'],
    'Ladro': ['destrezza','intelligenza'],
    'Mago': ['intelligenza','saggezza'],
    'Monaco': ['forza','destrezza'],
    'Paladino': ['saggezza','carisma'],
    'Ranger': ['forza','destrezza'],
    'Stregone': ['costituzione','carisma'],
    'Warlock': ['saggezza','carisma']
};

const DND_SKILLS = [
    { key: 'acrobazia', nome: 'Acrobazia', ability: 'destrezza', abbr: 'Des' },
    { key: 'addestrare_animali', nome: 'Addestrare Animali', ability: 'saggezza', abbr: 'Sag' },
    { key: 'arcano', nome: 'Arcano', ability: 'intelligenza', abbr: 'Int' },
    { key: 'atletica', nome: 'Atletica', ability: 'forza', abbr: 'For' },
    { key: 'furtivita', nome: 'Furtività', ability: 'destrezza', abbr: 'Des' },
    { key: 'indagare', nome: 'Indagare', ability: 'intelligenza', abbr: 'Int' },
    { key: 'inganno', nome: 'Inganno', ability: 'carisma', abbr: 'Car' },
    { key: 'intimidire', nome: 'Intimidire', ability: 'carisma', abbr: 'Car' },
    { key: 'intrattenere', nome: 'Intrattenere', ability: 'carisma', abbr: 'Car' },
    { key: 'intuizione', nome: 'Intuizione', ability: 'saggezza', abbr: 'Sag' },
    { key: 'medicina', nome: 'Medicina', ability: 'saggezza', abbr: 'Sag' },
    { key: 'natura', nome: 'Natura', ability: 'intelligenza', abbr: 'Int' },
    { key: 'percezione', nome: 'Percezione', ability: 'saggezza', abbr: 'Sag' },
    { key: 'persuasione', nome: 'Persuasione', ability: 'carisma', abbr: 'Car' },
    { key: 'rapidita_di_mano', nome: 'Rapidità di Mano', ability: 'destrezza', abbr: 'Des' },
    { key: 'religione', nome: 'Religione', ability: 'intelligenza', abbr: 'Int' },
    { key: 'sopravvivenza', nome: 'Sopravvivenza', ability: 'saggezza', abbr: 'Sag' },
    { key: 'storia', nome: 'Storia', ability: 'intelligenza', abbr: 'Int' }
];

function calcMod(score) {
    return Math.floor((score - 10) / 2);
}

function calcBonusCompetenza(livello) {
    return Math.floor((livello - 1) / 4) + 2;
}

function updateBonusCompetenza() {
    const livello = pgGetTotalLevel();
    const bonus = calcBonusCompetenza(livello);
    const field = document.getElementById('pgBonusCompetenza');
    if (field) field.value = `+${bonus}`;
}

function pgGetTotalLevel() {
    return pgSelectedClasses.reduce((sum, c) => sum + (c.livello || 1), 0) || 1;
}

function pgUpdateTotalLevel() {
    const total = pgGetTotalLevel();
    const lvField = document.getElementById('pgLivello');
    if (lvField) lvField.value = total;
    updateBonusCompetenza();
}

function formatMod(mod) {
    if (mod > 0) return `(+${mod})`;
    if (mod < 0) return `(${mod})`;
    return '(+0)';
}

function formatModPlain(mod) {
    if (mod >= 0) return `+${mod}`;
    return `${mod}`;
}

function updateAbilityMod(input, modEl) {
    const val = parseInt(input.value) || 10;
    const mod = calcMod(val);
    modEl.textContent = formatModPlain(mod);
    modEl.className = 'pg-ability-mod ' + (mod > 0 ? 'positive' : mod < 0 ? 'negative' : 'zero');
    updateAllSaveValues();
}

function updateAllAbilityMods() {
    ['Forza', 'Destrezza', 'Costituzione', 'Intelligenza', 'Saggezza', 'Carisma'].forEach(name => {
        const input = document.getElementById(`pg${name}`);
        const modEl = document.getElementById(`mod${name}`);
        if (input && modEl) updateAbilityMod(input, modEl);
    });
    updateAllSaveValues();
}

function updateAllSaveValues() {
    const bonus = calcBonusCompetenza(pgGetTotalLevel());
    ['Forza', 'Destrezza', 'Costituzione', 'Intelligenza', 'Saggezza', 'Carisma'].forEach(name => {
        const input = document.getElementById(`pg${name}`);
        const cb = document.getElementById(`save${name}`);
        const valEl = document.getElementById(`saveVal${name}`);
        if (!input || !valEl) return;
        const mod = calcMod(parseInt(input.value) || 10);
        const isProf = cb && cb.checked;
        const total = mod + (isProf ? bonus : 0);
        valEl.textContent = formatModPlain(total);
    });
}

// --- Race/Background selects ---
function buildRaceOptionsFromDB() {
    const razze = AppState.cachedRazze;
    if (!razze || razze.length === 0) {
        return DND_RACES_GROUPED.map(r => typeof r === 'object' ? r : { value: r, label: r });
    }
    const options = [];
    let lastGruppo = '__init__';
    razze.forEach(r => {
        const g = r.gruppo || null;
        if (g !== lastGruppo) {
            options.push({ type: 'divider', label: g || '' });
            lastGruppo = g;
        }
        options.push({ value: r.nome, label: r.nome });
    });
    return options;
}

function buildBackgroundOptionsFromDB() {
    const bgs = AppState.cachedBackground;
    if (!bgs || bgs.length === 0) {
        return DND_BACKGROUNDS.map(b => ({ value: b, label: b }));
    }
    return bgs.map(b => ({ value: b.nome, label: b.nome }));
}

function getRaceData(nome) {
    if (!AppState.cachedRazze) return null;
    return AppState.cachedRazze.find(r => r.nome === nome) || null;
}

function getBackgroundData(nome) {
    if (!AppState.cachedBackground) return null;
    return AppState.cachedBackground.find(b => b.nome === nome) || null;
}

window.pgOpenRazzaSelect = function() {
    openCustomSelect(
        buildRaceOptionsFromDB(),
        (value) => {
            document.getElementById('pgRazza').value = value;
            const btn = document.getElementById('pgRazzaBtn');
            if (btn) btn.textContent = value;
            const data = getRaceData(value);
            if (data) {
                const velField = document.getElementById('pgVelocita');
                if (velField) velField.value = data.velocita || 9;
                if (data.resistenze && data.resistenze.length > 0) {
                    data.resistenze.forEach(r => { if (!pgCurrentResistenze.includes(r)) pgCurrentResistenze.push(r); });
                }
                if (data.competenze_abilita && data.competenze_abilita.length > 0) {
                    data.competenze_abilita.forEach(s => pgCurrentSkillProficiencies.add(s));
                }
            }
        },
        'Seleziona Razza'
    );
}

window.pgOpenBackgroundSelect = function() {
    openCustomSelect(
        buildBackgroundOptionsFromDB(),
        (value) => {
            document.getElementById('pgBackground').value = value;
            const btn = document.getElementById('pgBackgroundBtn');
            if (btn) btn.textContent = value;
            const data = getBackgroundData(value);
            if (data && data.competenze_abilita && data.competenze_abilita.length > 0) {
                data.competenze_abilita.forEach(s => pgCurrentSkillProficiencies.add(s));
            }
        },
        'Seleziona Background'
    );
}

window.pgOpenClassDropdown = function() {
    const available = DND_CLASSES.filter(c => !pgSelectedClasses.find(s => s.nome === c));
    if (available.length === 0) { showNotification('Tutte le classi sono già selezionate'); return; }
    openCustomSelect(
        available.map(c => ({ value: c, label: c })),
        (value) => {
            if (pgSelectedClasses.find(c => c.nome === value)) return;
            pgSelectedClasses.push({ nome: value, livello: 1 });
            pgRenderClassi();
            pgUpdateTotalLevel();
            pgUpdateSavingThrows();
            pgResetAutoHP();
        },
        'Seleziona Classe'
    );
}

window.pgRemoveClasse = function(index) {
    pgSelectedClasses.splice(index, 1);
    pgRenderClassi();
    pgUpdateTotalLevel();
    pgUpdateSavingThrows();
    pgResetAutoHP();
}

window.pgUpdateClassLevel = function(index, value) {
    const lv = Math.max(1, Math.min(20, parseInt(value) || 1));
    pgSelectedClasses[index].livello = lv;
    pgUpdateTotalLevel();
    pgResetAutoHP();
}

function pgResetAutoHP() {
    const pvField = document.getElementById('pgPV');
    if (pvField) pvField.dataset.autoHp = 'true';
    pgRenderDadiVita();
}

const THIRD_CASTER_SUBCLASSES = {
    'Guerriero': 'Cavaliere Mistico',
    'Ladro': 'Mistificatore Arcano'
};

function pgRenderClassi() {
    const container = document.getElementById('pgClassiList');
    if (!container) return;
    const chipsHtml = pgSelectedClasses.map((c, i) => {
        const subLabel = THIRD_CASTER_SUBCLASSES[c.nome];
        const subCheck = subLabel ? `
            <label class="pg-subclass-check">
                <input type="checkbox" ${c.thirdCaster ? 'checked' : ''} onchange="pgToggleThirdCaster(${i}, this.checked)">
                <span>${subLabel}</span>
            </label>` : '';
        return `
        <div class="pg-classe-chip">
            <div class="pg-classe-chip-top">
                <span class="pg-classe-name">${escapeHtml(c.nome)}</span>
                <div class="pg-classe-lv-controls">
                    <span class="pg-classe-lv-label">Lv.</span>
                    <button type="button" class="pg-classe-lv-btn" onclick="pgClassLevelChange(${i},-1)">−</button>
                    <span class="pg-classe-lv-val">${c.livello}</span>
                    <button type="button" class="pg-classe-lv-btn" onclick="pgClassLevelChange(${i},1)">+</button>
                </div>
                <button type="button" class="pg-classe-remove" onclick="pgRemoveClasse(${i})">&times;</button>
            </div>
            ${subCheck}
        </div>`;
    }).join('');

    const addBtn = `<button type="button" class="pg-add-class-btn" onclick="pgOpenClassDropdown()">
        <span class="pg-add-class-plus">+</span> Aggiungi classe
    </button>`;
    container.innerHTML = chipsHtml + addBtn;
}

window.pgClassLevelChange = function(index, delta) {
    const c = pgSelectedClasses[index];
    if (!c) return;
    c.livello = Math.max(1, Math.min(20, c.livello + delta));
    pgRenderClassi();
    pgUpdateTotalLevel();
    pgResetAutoHP();
}

window.pgToggleThirdCaster = function(index, checked) {
    pgSelectedClasses[index].thirdCaster = checked;
    pgResetAutoHP();
}

// --- Saving Throws ---
function pgUpdateSavingThrows() {
    if (pgSelectedClasses.length === 0) return;
    const primaryClass = pgSelectedClasses[0].nome;
    const saves = CLASS_SAVES[primaryClass] || [];
    const allSaves = ['forza','destrezza','costituzione','intelligenza','saggezza','carisma'];
    allSaves.forEach(s => {
        const cb = document.getElementById(`save${s.charAt(0).toUpperCase() + s.slice(1)}`);
        if (cb) cb.checked = saves.includes(s);
    });
}

function pgGetSelectedSaves() {
    const allSaves = ['Forza','Destrezza','Costituzione','Intelligenza','Saggezza','Carisma'];
    return allSaves.filter(s => {
        const cb = document.getElementById(`save${s}`);
        return cb && cb.checked;
    }).map(s => s.toLowerCase());
}

// --- Skills ---
function pgRenderSkills() {
    const container = document.getElementById('pgSkillsList');
    if (!container) return;
    const bonus = calcBonusCompetenza(pgGetTotalLevel());
    container.innerHTML = DND_SKILLS.map(skill => {
        const abilityInput = document.getElementById(`pg${skill.ability.charAt(0).toUpperCase() + skill.ability.slice(1)}`);
        const abilityScore = parseInt(abilityInput?.value) || 10;
        const abilityMod = calcMod(abilityScore);
        const isProf = pgCurrentSkillProficiencies.has(skill.key);
        const totalVal = abilityMod + (isProf ? bonus : 0);
        return `
        <div class="pg-skill-item ${isProf ? 'proficient' : ''}">
            <input type="checkbox" data-skill="${skill.key}" ${isProf ? 'checked' : ''} onchange="pgToggleSkill('${skill.key}', this.checked)">
            <span class="pg-skill-value">${formatModPlain(totalVal)}</span>
            <span class="pg-skill-name">${skill.nome}</span>
            <span class="pg-skill-ability">(${skill.abbr})</span>
        </div>`;
    }).join('');
}

let pgCurrentSkillProficiencies = new Set();

window.pgToggleSkill = function(skillKey, checked) {
    if (checked) pgCurrentSkillProficiencies.add(skillKey);
    else pgCurrentSkillProficiencies.delete(skillKey);
    pgRenderSkills();
    pgUpdatePercezionPassiva();
}

function pgCalcPercPassiva() {
    const sagScore = parseInt(document.getElementById('pgSaggezza')?.value) || 10;
    const sagMod = calcMod(sagScore);
    const bonus = calcBonusCompetenza(pgGetTotalLevel());
    const isProf = pgCurrentSkillProficiencies.has('percezione');
    return 10 + sagMod + (isProf ? bonus : 0);
}

// --- Resistenze ---
let pgCurrentResistenze = [];
let pgCurrentImmunita = [];

function pgRenderResImmGrid(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = DAMAGE_TYPES.map(dt => {
        const isRes = pgCurrentResistenze.includes(dt.value);
        const isImm = pgCurrentImmunita.includes(dt.value);
        return `
        <div class="pg-res-row">
            <span class="pg-res-label">${dt.label}</span>
            <input type="checkbox" class="pg-res-cb" ${isRes ? 'checked' : ''} onchange="pgToggleRes('${dt.value}', this.checked)" title="Resistenza">
            <input type="checkbox" class="pg-imm-cb" ${isImm ? 'checked' : ''} onchange="pgToggleImm('${dt.value}', this.checked)" title="Immunità">
        </div>`;
    }).join('');
}

window.pgToggleRes = function(val, checked) {
    if (checked) { if (!pgCurrentResistenze.includes(val)) pgCurrentResistenze.push(val); }
    else { pgCurrentResistenze = pgCurrentResistenze.filter(r => r !== val); }
}

window.pgToggleImm = function(val, checked) {
    if (checked) { if (!pgCurrentImmunita.includes(val)) pgCurrentImmunita.push(val); }
    else { pgCurrentImmunita = pgCurrentImmunita.filter(r => r !== val); }
}

// --- Spell Slots ---
let pgCurrentSlotIncantesimo = {};

const CLASS_SPELL_SLOTS = {
    'full': {
        1: {1:2}, 2: {1:3}, 3: {1:4,2:2}, 4: {1:4,2:3}, 5: {1:4,2:3,3:2},
        6: {1:4,2:3,3:3}, 7: {1:4,2:3,3:3,4:1}, 8: {1:4,2:3,3:3,4:2},
        9: {1:4,2:3,3:3,4:3,5:1}, 10: {1:4,2:3,3:3,4:3,5:2},
        11: {1:4,2:3,3:3,4:3,5:2,6:1}, 12: {1:4,2:3,3:3,4:3,5:2,6:1},
        13: {1:4,2:3,3:3,4:3,5:2,6:1,7:1}, 14: {1:4,2:3,3:3,4:3,5:2,6:1,7:1},
        15: {1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1}, 16: {1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1},
        17: {1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1,9:1}, 18: {1:4,2:3,3:3,4:3,5:3,6:1,7:1,8:1,9:1},
        19: {1:4,2:3,3:3,4:3,5:3,6:2,7:1,8:1,9:1}, 20: {1:4,2:3,3:3,4:3,5:3,6:2,7:2,8:1,9:1}
    },
    'half': {
        2: {1:2}, 3: {1:3}, 4: {1:3}, 5: {1:4,2:2}, 6: {1:4,2:2},
        7: {1:4,2:3}, 8: {1:4,2:3}, 9: {1:4,2:3,3:2}, 10: {1:4,2:3,3:2},
        11: {1:4,2:3,3:3}, 12: {1:4,2:3,3:3}, 13: {1:4,2:3,3:3,4:1}, 14: {1:4,2:3,3:3,4:1},
        15: {1:4,2:3,3:3,4:2}, 16: {1:4,2:3,3:3,4:2}, 17: {1:4,2:3,3:3,4:3,5:1}, 18: {1:4,2:3,3:3,4:3,5:1},
        19: {1:4,2:3,3:3,4:3,5:2}, 20: {1:4,2:3,3:3,4:3,5:2}
    }
};

const CLASS_CASTER_TYPE = {
    'Bardo': 'full', 'Chierico': 'full', 'Druido': 'full', 'Mago': 'full',
    'Stregone': 'full', 'Warlock': 'pact',
    'Paladino': 'half', 'Ranger': 'half',
    'Artefice': 'half',
    'Barbaro': null, 'Guerriero': null, 'Ladro': null, 'Monaco': null
};

function pgCalcSpellSlots() {
    let totalCasterLevel = 0;
    let hasPactMagic = false;
    let pactLevel = 0;

    pgSelectedClasses.forEach(cls => {
        const type = CLASS_CASTER_TYPE[cls.nome];
        if (type === 'full') totalCasterLevel += cls.livello;
        else if (type === 'half') totalCasterLevel += Math.floor(cls.livello / 2);
        else if (type === 'pact') { hasPactMagic = true; pactLevel += cls.livello; }
        else if (type === null && cls.thirdCaster) {
            totalCasterLevel += Math.floor(cls.livello / 3);
        }
    });

    let slots = {};
    if (totalCasterLevel > 0) {
        const table = CLASS_SPELL_SLOTS['full'];
        const level = Math.min(totalCasterLevel, 20);
        slots = table[level] ? { ...table[level] } : {};
    }

    if (hasPactMagic) {
        const pactSlotLevel = Math.min(Math.ceil(pactLevel / 2), 5);
        let pactSlotCount = pactLevel >= 17 ? 4 : pactLevel >= 11 ? 3 : pactLevel >= 2 ? 2 : 1;
        const current = slots[pactSlotLevel] || 0;
        slots[pactSlotLevel] = current + pactSlotCount;
    }

    return slots;
}

function pgBuildSlotIncantesimo() {
    const defaultSlots = pgCalcSpellSlots();
    const levels = Object.keys(defaultSlots).map(Number).sort((a, b) => a - b);
    if (levels.length === 0) return {};

    const result = {};
    levels.forEach(lvl => {
        const maxDefault = defaultSlots[lvl] || 0;
        const existing = pgCurrentSlotIncantesimo[lvl];
        if (existing) {
            result[lvl] = { max: maxDefault, current: Math.min(existing.current != null ? existing.current : maxDefault, maxDefault) };
        } else {
            result[lvl] = { max: maxDefault, current: maxDefault };
        }
    });
    return result;
}

function pgRenderSlotIncantesimo() {
    const container = document.getElementById('pgSlotIncantesimoList');
    if (!container) return;

    const defaultSlots = pgCalcSpellSlots();
    const slotLevels = Object.keys(defaultSlots).map(Number).sort((a, b) => a - b);

    if (slotLevels.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">Nessun incantesimo disponibile per questa classe</p>';
        pgCurrentSlotIncantesimo = {};
        return;
    }

    const merged = {};
    slotLevels.forEach(lvl => {
        const maxDefault = defaultSlots[lvl] || 0;
        const existing = pgCurrentSlotIncantesimo[lvl];
        if (existing) {
            merged[lvl] = { max: existing.max != null ? existing.max : maxDefault, current: existing.current != null ? existing.current : maxDefault };
        } else {
            merged[lvl] = { max: maxDefault, current: maxDefault };
        }
    });
    pgCurrentSlotIncantesimo = merged;

    container.innerHTML = slotLevels.map(lvl => {
        const s = merged[lvl];
        return `
        <div class="pg-slot-row">
            <span class="pg-slot-label">Livello ${lvl}</span>
            <div class="pg-slot-controls">
                <button type="button" class="pg-slot-btn" onclick="pgSlotDecrement(${lvl})">−</button>
                <span class="pg-slot-value" id="slotCurrent${lvl}">${s.current}</span>
                <span class="pg-slot-sep">/</span>
                <span class="pg-slot-max">${s.max}</span>
                <button type="button" class="pg-slot-btn" onclick="pgSlotIncrement(${lvl})">+</button>
            </div>
        </div>`;
    }).join('');
}

window.pgSlotDecrement = function(lvl) {
    if (!pgCurrentSlotIncantesimo[lvl]) return;
    if (pgCurrentSlotIncantesimo[lvl].current > 0) {
        pgCurrentSlotIncantesimo[lvl].current--;
        const el = document.getElementById(`slotCurrent${lvl}`);
        if (el) el.textContent = pgCurrentSlotIncantesimo[lvl].current;
    }
}

window.pgSlotIncrement = function(lvl) {
    if (!pgCurrentSlotIncantesimo[lvl]) return;
    if (pgCurrentSlotIncantesimo[lvl].current < pgCurrentSlotIncantesimo[lvl].max) {
        pgCurrentSlotIncantesimo[lvl].current++;
        const el = document.getElementById(`slotCurrent${lvl}`);
        if (el) el.textContent = pgCurrentSlotIncantesimo[lvl].current;
    }
}

// --- Hit Dice & HP Calculation ---
const CLASS_HIT_DIE = {
    'Artefice': 8, 'Bardo': 8, 'Chierico': 8, 'Druido': 8,
    'Ladro': 8, 'Monaco': 8, 'Warlock': 8,
    'Barbaro': 12,
    'Mago': 6, 'Stregone': 6,
    'Guerriero': 10, 'Paladino': 10, 'Ranger': 10
};

function dieAvg(die) {
    return Math.ceil(die / 2) + 1;
}

function pgCalcHP() {
    if (pgSelectedClasses.length === 0) return 0;
    const cosMod = calcMod(parseInt(document.getElementById('pgCostituzione')?.value) || 10);
    const totalLevel = pgGetTotalLevel();
    let hp = 0;

    pgSelectedClasses.forEach((cls, idx) => {
        const die = CLASS_HIT_DIE[cls.nome] || 8;
        const avg = dieAvg(die);
        if (idx === 0) {
            hp += die + (cls.livello - 1) * avg;
        } else {
            hp += cls.livello * avg;
        }
    });

    hp += totalLevel * cosMod;
    return Math.max(1, hp);
}

function pgRenderDadiVita() {
    const container = document.getElementById('pgDadiVitaList');
    if (!container) return;

    if (pgSelectedClasses.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">Seleziona una classe per vedere i dadi vita</p>';
        return;
    }

    const cosMod = calcMod(parseInt(document.getElementById('pgCostituzione')?.value) || 10);
    const totalLevel = pgGetTotalLevel();

    container.innerHTML = pgSelectedClasses.map((cls, idx) => {
        const die = CLASS_HIT_DIE[cls.nome] || 8;
        const avg = dieAvg(die);
        let detail;
        if (idx === 0) {
            detail = `${die} + ${cls.livello - 1}×${avg}`;
        } else {
            detail = `${cls.livello}×${avg}`;
        }
        return `
        <div class="pg-dado-vita-item">
            <span class="pg-dado-vita-classe">${escapeHtml(cls.nome)}</span>
            <span class="pg-dado-vita-dice">${cls.livello}d${die}</span>
            <span class="pg-dado-vita-detail">${detail}</span>
        </div>`;
    }).join('');

    const hp = pgCalcHP();
    const cosTotal = totalLevel * cosMod;
    const cosSign = cosTotal >= 0 ? '+' : '';
    const hintPV = document.getElementById('hintPV');
    if (hintPV) hintPV.textContent = `(calcolato: ${hp - cosTotal} ${cosSign}${cosTotal} COS = ${hp})`;

    const pvField = document.getElementById('pgPV');
    if (pvField && pvField.dataset.autoHp !== 'false') {
        pvField.value = hp;
    }
}

// --- Wizard Navigation ---
window.pgWizardNext = function() {
    if (pgWizardCurrentStep === 0) {
        const nome = document.getElementById('pgNome').value.trim();
        if (!nome) { showNotification('Inserisci un nome per il personaggio'); return; }
    }
    if (pgWizardCurrentStep === 1) {
        if (pgSelectedClasses.length === 0) { showNotification('Seleziona almeno una classe'); return; }
    }
    pgWizardGoTo(pgWizardCurrentStep + 1);
}

window.pgWizardPrev = function() {
    pgWizardGoTo(pgWizardCurrentStep - 1);
}

function pgWizardGoTo(step) {
    if (step < 0 || step > 5) return;
    pgWizardCurrentStep = step;

    document.querySelectorAll('#personaggioForm .wizard-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#personaggioModal .wizard-step').forEach((s, i) => {
        s.classList.toggle('active', i <= step);
    });

    const target = document.getElementById(`pgStep${step}`);
    if (target) target.classList.add('active');

    if (step === 2) {
        updateAllAbilityMods();
        if (!editingPersonaggioId && pgSelectedClasses.length > 0) {
            pgUpdateSavingThrows();
        }
        updateAllSaveValues();
    }
    if (step === 3) {
        pgRenderSkills();
    }
    if (step === 4) {
        pgRenderResImmGrid('pgResImmGrid');
    }
    if (step === 5) {
        const des = parseInt(document.getElementById('pgDestrezza')?.value) || 10;
        const cos = parseInt(document.getElementById('pgCostituzione')?.value) || 10;
        const sag = parseInt(document.getElementById('pgSaggezza')?.value) || 10;
        const desMod = calcMod(des);
        const cosMod = calcMod(cos);
        const sagMod = calcMod(sag);

        const initField = document.getElementById('pgIniziativa');
        if (initField && !initField.value) {
            initField.value = desMod;
        }

        const classNames = pgSelectedClasses.map(c => c.nome);
        let caBase, caHint;
        if (classNames.includes('Barbaro')) {
            caBase = 10 + desMod + cosMod;
            caHint = `(10+des+cos = ${caBase})`;
        } else if (classNames.includes('Monaco')) {
            caBase = 10 + desMod + sagMod;
            caHint = `(10+des+sag = ${caBase})`;
        } else {
            caBase = 10 + desMod;
            caHint = `(10+des = ${caBase})`;
        }

        const caField = document.getElementById('pgCA');
        if (caField && !caField.value) caField.value = caBase;
        const hintCA = document.getElementById('hintCA');
        if (hintCA) hintCA.textContent = caHint;
        const hintInit = document.getElementById('hintIniziativa');
        if (hintInit) hintInit.textContent = `(des = ${formatModPlain(desMod)})`;

        pgRenderDadiVita();
    }
}

async function loadPersonaggi(options = {}) {
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn) return;
    const { silent = false } = options;

    if (!silent && elements.personaggiList) {
        elements.personaggiList.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento personaggi...</p></div>';
    }

    try {
        const { data: personaggi, error } = await supabase.rpc('get_personaggi_utente');
        if (error) throw error;

        const pgList = personaggi || [];
        let campagneMap = {};
        if (pgList.length > 0) {
            const pgIds = pgList.map(p => p.id);
            const { data: assocs, error: assocErr } = await supabase
                .from('personaggi_campagna')
                .select('personaggio_id, campagna_id')
                .in('personaggio_id', pgIds);
            if (assocErr) console.error('Errore caricamento associazioni pg-campagna:', assocErr);
            if (assocs && assocs.length > 0) {
                const campagnaIds = [...new Set(assocs.map(a => a.campagna_id))];
                const { data: campagne } = await supabase
                    .from('campagne')
                    .select('id, nome_campagna')
                    .in('id', campagnaIds);
                const nomiMap = {};
                if (campagne) campagne.forEach(c => { nomiMap[c.id] = c.nome_campagna; });
                assocs.forEach(a => {
                    if (!campagneMap[a.personaggio_id]) campagneMap[a.personaggio_id] = [];
                    const nome = nomiMap[a.campagna_id];
                    if (nome) campagneMap[a.personaggio_id].push(nome);
                });
            }
        }
        renderPersonaggi(pgList, campagneMap);
    } catch (error) {
        console.error('Errore caricamento personaggi:', error);
        if (elements.personaggiList) {
            elements.personaggiList.innerHTML = '<div class="content-placeholder"><p>Errore nel caricamento dei personaggi</p></div>';
        }
    }
}

function renderPersonaggi(personaggi, campagneMap = {}) {
    if (!elements.personaggiList) return;

    if (personaggi.length === 0) {
        elements.personaggiList.innerHTML = `
            <div class="content-placeholder">
                <p>Non ci sono personaggi. Crea il tuo (ennesimo) alter ego!</p>
            </div>`;
        return;
    }

    elements.personaggiList.innerHTML = personaggi.map(pg => {
        const initials = (pg.nome || '?').substring(0, 2).toUpperCase();
        let classeDisplay = pg.classe || '';
        if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
            classeDisplay = pg.classi.map(c => `${c.nome} ${c.livello}`).join(' / ');
        }
        const campagne = campagneMap[pg.id] || [];
        const campagneText = campagne.length > 0 ? campagne.map(n => escapeHtml(n)).join(', ') : 'Nessuna campagna';

        return `
        <div class="pg-card pg-card-clickable" data-pg-id="${pg.id}" onclick="openSchedaPersonaggio('${pg.id}')">
            <div class="pg-card-header">
                <div class="pg-card-avatar">${escapeHtml(initials)}</div>
                <div class="pg-card-identity">
                    <p class="pg-card-name">${escapeHtml(pg.nome)}</p>
                    <p class="pg-card-subtitle">${escapeHtml(pg.razza || '')} ${escapeHtml(classeDisplay)}</p>
                </div>
                <div class="pg-card-level">Lv ${pg.livello || 1}</div>
            </div>
            <div class="pg-card-footer">
                <div class="pg-card-campaigns"><span class="pg-card-campaigns-icon">⚔</span> ${campagneText}</div>
                <button class="pg-card-delete" onclick="event.stopPropagation(); deletePersonaggio('${pg.id}')" aria-label="Elimina personaggio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div>
        </div>`;
    }).join('');
}

// --- Scheda Personaggio Page ---
window.openSchedaPersonaggio = async function(personaggioId) {
    AppState.currentPersonaggioId = personaggioId;
    sessionStorage.setItem('currentPersonaggioId', personaggioId);
    navigateToPage('scheda');
    await renderSchedaPersonaggio(personaggioId);
}

// Debounced save for scheda fields
let _schedaSaveTimeout = null;
let _schedaPgCache = null;

function schedaDebouncedSave(personaggioId, field, value) {
    if (_schedaSaveTimeout) clearTimeout(_schedaSaveTimeout);
    _schedaSaveTimeout = setTimeout(async () => {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        try {
            await supabase.from('personaggi').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', personaggioId);
        } catch (e) { console.error('Errore salvataggio:', e); }
    }, 500);
}

function schedaInstantSave(personaggioId, updates) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    updates.updated_at = new Date().toISOString();
    supabase.from('personaggi').update(updates).eq('id', personaggioId).then(({ error }) => {
        if (error) console.error('Errore salvataggio:', error);
    });
}

const SCHEDA_ABILITIES = [
    { key: 'forza', label: 'FOR', full: 'Forza' },
    { key: 'destrezza', label: 'DES', full: 'Destrezza' },
    { key: 'costituzione', label: 'COS', full: 'Costituzione' },
    { key: 'intelligenza', label: 'INT', full: 'Intelligenza' },
    { key: 'saggezza', label: 'SAG', full: 'Saggezza' },
    { key: 'carisma', label: 'CAR', full: 'Carisma' }
];

const SCHEDA_SKILLS = [
    { key: 'acrobazia', label: 'Acrobazia', ability: 'destrezza' },
    { key: 'addestrare_animali', label: 'Addestrare Animali', ability: 'saggezza' },
    { key: 'arcano', label: 'Arcano', ability: 'intelligenza' },
    { key: 'atletica', label: 'Atletica', ability: 'forza' },
    { key: 'furtivita', label: 'Furtività', ability: 'destrezza' },
    { key: 'indagare', label: 'Indagare', ability: 'intelligenza' },
    { key: 'inganno', label: 'Inganno', ability: 'carisma' },
    { key: 'intimidire', label: 'Intimidire', ability: 'carisma' },
    { key: 'intrattenere', label: 'Intrattenere', ability: 'carisma' },
    { key: 'intuizione', label: 'Intuizione', ability: 'saggezza' },
    { key: 'medicina', label: 'Medicina', ability: 'saggezza' },
    { key: 'natura', label: 'Natura', ability: 'intelligenza' },
    { key: 'percezione', label: 'Percezione', ability: 'saggezza' },
    { key: 'persuasione', label: 'Persuasione', ability: 'carisma' },
    { key: 'rapidita_di_mano', label: 'Rapidità di Mano', ability: 'destrezza' },
    { key: 'religione', label: 'Religione', ability: 'intelligenza' },
    { key: 'sopravvivenza', label: 'Sopravvivenza', ability: 'saggezza' },
    { key: 'storia', label: 'Storia', ability: 'intelligenza' }
];

const CLASS_RESOURCES = {
    'Barbaro': { nome: 'Ire', perLivello: [0,2,2,3,3,3,4,4,4,4,4,5,5,5,5,5,6,6,6,6,99], fromLevel: 1 },
    'Bardo': { nome: 'Ispirazioni Bardiche', perLivello: [0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3], usaMod: 'carisma', fromLevel: 1 },
    'Chierico': { nome: 'Incanalare Divinità', perLivello: [0,0,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3], fromLevel: 2 },
    'Druido': { nome: 'Forma Selvatica', perLivello: [0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2], fromLevel: 2 },
    'Guerriero': { nome: 'Secondo Vento', perLivello: [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], fromLevel: 1 },
    'Monaco': { nome: 'Punti Ki', perLivello: [0,0,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], fromLevel: 2 },
    'Paladino': { nome: 'Imposizione delle Mani', perLivello: null, hpPool: true, fromLevel: 1 },
    'Stregone': { nome: 'Punti Stregoneria', perLivello: [0,0,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], fromLevel: 2 },
    'Warlock': { nome: 'Slot del Patto', perLivello: [0,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2], fromLevel: 1 },
};

const CLASS_SPELL_ABILITY = {
    'Bardo': 'carisma', 'Chierico': 'saggezza', 'Druido': 'saggezza', 'Mago': 'intelligenza',
    'Stregone': 'carisma', 'Warlock': 'carisma', 'Paladino': 'carisma', 'Ranger': 'saggezza',
    'Artefice': 'intelligenza'
};

async function renderSchedaPersonaggio(personaggioId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;

    const supabase = getSupabaseClient();
    if (!supabase) { content.innerHTML = '<p>Errore: Supabase non disponibile</p>'; return; }

    if (!_schedaPgCache || _schedaPgCache.id !== personaggioId) {
        content.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento scheda...</p></div>';
    }

    try {
        const { data: pg, error } = await supabase.from('personaggi').select('*').eq('id', personaggioId).single();
        if (error || !pg) throw error || new Error('Personaggio non trovato');
        if (_hpCalcState && _hpCalcState.pgId === personaggioId) {
            pg[_hpCalcState.field] = _hpCalcState.currentVal;
        }
        _schedaPgCache = pg;

        const fMod = (val) => { const m = Math.floor(((val || 10) - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; };
        const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
        const saves = pg.tiri_salvezza || [];
        const skillProf = pg.competenze_abilita || [];
        const skillExpert = pg.maestrie_abilita || [];
        const pvAttuali = pg.pv_attuali != null ? pg.pv_attuali : pg.punti_vita_max;

        let classeDisplay = pg.classe || '';
        if (pg.classi && Array.isArray(pg.classi) && pg.classi.length > 0) {
            classeDisplay = pg.classi.map(c => `${c.nome} ${c.livello}`).join(' / ');
        }

        // 1. Abilities + Saves
        const abilitiesHtml = SCHEDA_ABILITIES.map(a => {
            const val = pg[a.key] || 10;
            const m = fMod(val);
            const isSaveProf = saves.includes(a.key);
            const saveMod = Math.floor((val - 10) / 2) + (isSaveProf ? bonusComp : 0);
            const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
            return `
            <div class="scheda-ability">
                <div class="scheda-ability-label">${a.full}</div>
                <input type="number" class="scheda-ability-input" value="${val}" min="1" max="30" data-field="${a.key}" data-pgid="${pg.id}">
                <div class="scheda-ability-mod" id="sMod_${a.key}">${m}</div>
                <div class="scheda-ability-save ${isSaveProf ? 'proficient' : ''}" data-save="${a.key}" data-pgid="${pg.id}" onclick="schedaToggleSave('${pg.id}','${a.key}')">
                    <span class="scheda-save-dot">${isSaveProf ? '●' : '○'}</span>
                    <span class="scheda-save-label">TS</span>
                    <span class="scheda-save-val" id="sSave_${a.key}">${saveStr}</span>
                </div>
            </div>`;
        }).join('');

        // 2. Four boxes
        const initDisplay = pg.iniziativa != null ? pg.iniziativa : Math.floor(((pg.destrezza || 10) - 10) / 2);

        // 4. Skills with proficiency + expertise
        const sagMod = Math.floor(((pg.saggezza || 10) - 10) / 2);
        const percProf = skillProf.includes('percezione');
        const percExpert = skillExpert.includes('percezione');
        const percPassiva = 10 + sagMod + (percProf ? bonusComp : 0) + (percExpert ? bonusComp : 0);

        const skillsHtml = SCHEDA_SKILLS.map(sk => {
            const abilityVal = pg[sk.ability] || 10;
            const abilityMod = Math.floor((abilityVal - 10) / 2);
            const isProf = skillProf.includes(sk.key);
            const isExpert = skillExpert.includes(sk.key);
            const total = abilityMod + (isProf ? bonusComp : 0) + (isExpert ? bonusComp : 0);
            const totalStr = total >= 0 ? `+${total}` : `${total}`;
            return `
            <div class="scheda-skill">
                <span class="scheda-skill-dot ${isProf ? 'active' : ''}" onclick="schedaToggleSkillProf('${pg.id}','${sk.key}',event)" title="Competenza">●</span>
                <span class="scheda-skill-dot expert ${isExpert ? 'active' : ''}" onclick="schedaToggleSkillExpert('${pg.id}','${sk.key}',event)" title="Maestria">★</span>
                <span class="scheda-skill-mod" id="sSkill_${sk.key}">${totalStr}</span>
                <span class="scheda-skill-name">${sk.label} <small>(${sk.ability.substring(0, 3).toUpperCase()})</small></span>
            </div>`;
        }).join('');

        // Hit dice
        const CLASS_HD = { 'Artefice':8,'Bardo':8,'Chierico':8,'Druido':8,'Ladro':8,'Monaco':8,'Warlock':8,'Barbaro':12,'Mago':6,'Stregone':6,'Guerriero':10,'Paladino':10,'Ranger':10 };
        const dadiDisp = pg.dadi_vita_disponibili || {};
        let hitDiceHtml = '';
        if (pg.classi && pg.classi.length > 0) {
            hitDiceHtml = `<div class="scheda-hd-table">
                <div class="scheda-hd-header"><span>DADI VITA</span><span>DISPONIBILI</span></div>
                ${pg.classi.map(c => {
                    const die = CLASS_HD[c.nome] || 8;
                    const total = c.livello;
                    const key = c.nome;
                    const available = Math.min(total, dadiDisp[key] != null ? dadiDisp[key] : total);
                    return `<div class="scheda-hd-row">
                        <span class="scheda-hd-total">${total}d${die} <small>(${c.nome})</small></span>
                        <div class="scheda-hd-avail">
                            <button class="scheda-hd-btn" onclick="schedaHdChange('${pg.id}','${key}',${available},-1,${total})">−</button>
                            <span class="scheda-hd-val" id="sHd_${key}">${available}</span>
                            <button class="scheda-hd-btn" onclick="schedaHdChange('${pg.id}','${key}',${available},1,${total})">+</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
        }

        // Class Resources
        const classResources = pg.risorse_classe || {};
        let classResourcesHtml = '';
        if (pg.classi && pg.classi.length > 0) {
            const resItems = [];
            pg.classi.forEach(c => {
                const res = CLASS_RESOURCES[c.nome];
                if (!res || c.livello < res.fromLevel) return;
                let maxVal;
                if (res.hpPool) {
                    maxVal = c.livello * 5;
                } else if (res.usaMod) {
                    maxVal = Math.max(1, calcMod(pg[res.usaMod] || 10));
                } else if (res.perLivello) {
                    maxVal = res.perLivello[Math.min(c.livello, 20)] || 0;
                } else { return; }
                if (maxVal <= 0) return;
                const key = `${c.nome}_res`;
                const current = Math.min(maxVal, classResources[key] != null ? classResources[key] : maxVal);
                resItems.push(`<div class="scheda-hd-row">
                    <span class="scheda-hd-total">${res.nome} <small>(${c.nome})</small></span>
                    <div class="scheda-hd-avail">
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},-1,${maxVal})">−</button>
                        <span class="scheda-hd-val" id="sCRes_${key}">${current}</span>
                        <span class="scheda-hd-max">/ ${maxVal}</span>
                        <button class="scheda-hd-btn" onclick="schedaClassResChange('${pg.id}','${key}',${current},1,${maxVal})">+</button>
                    </div>
                </div>`);
            });
            if (resItems.length > 0) {
                classResourcesHtml = `<div class="scheda-section">
                    <div class="scheda-section-title">Risorse di Classe</div>
                    <div class="scheda-hd-table">${resItems.join('')}</div>
                </div>`;
            }
        }

        // Resistenze & Immunità
        const resistenzeHtml = (pg.resistenze && pg.resistenze.length > 0) ?
            pg.resistenze.map(r => `<span class="scheda-tag">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';
        const immunitaHtml = (pg.immunita && pg.immunita.length > 0) ?
            pg.immunita.map(r => `<span class="scheda-tag scheda-tag-imm">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';

        // Conditions
        const conditionsActive = ALL_CONDITIONS.filter(c => pg[c.key]);
        const conditionsHtml = conditionsActive.length > 0 ?
            conditionsActive.map(c => `<span class="condition-badge active">${c.label}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';

        // Check if spellcaster
        const hasSpellSlots = pg.slot_incantesimo && typeof pg.slot_incantesimo === 'object' && Object.keys(pg.slot_incantesimo).length > 0;

        content.innerHTML = `
        <div class="scheda-identity">
            <div class="scheda-name">${escapeHtml(pg.nome)}</div>
            <div class="scheda-subtitle">${escapeHtml(classeDisplay)}</div>
            <div class="scheda-subtitle-sm">${[pg.razza, pg.background].filter(Boolean).map(s => escapeHtml(s)).join(' · ')}</div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title">Caratteristiche e Tiri Salvezza</div>
            <div class="scheda-abilities">${abilitiesHtml}</div>
        </div>

        <div class="scheda-three-boxes">
            <div class="scheda-box editable">
                <input type="number" class="scheda-box-input" value="${pg.classe_armatura || 10}" data-field="classe_armatura" data-pgid="${pg.id}">
                <div class="scheda-box-label">CA</div>
            </div>
            <div class="scheda-box editable">
                <input type="number" class="scheda-box-input" value="${initDisplay}" data-field="iniziativa" data-pgid="${pg.id}">
                <div class="scheda-box-label">Iniziativa</div>
            </div>
            <div class="scheda-box editable">
                <input type="number" class="scheda-box-input" value="${pg.velocita || 9}" step="1.5" data-field="velocita" data-pgid="${pg.id}">
                <div class="scheda-box-label">Velocità</div>
            </div>
        </div>

        <div class="scheda-hp-section">
            <div class="scheda-hp-left">
                <div class="scheda-hp-pair">
                    <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalcLive('${pg.id}','punti_vita_max')">
                        <div class="scheda-hp-display" id="schedaPvMax">${pg.punti_vita_max || 10}</div>
                        <div class="scheda-hp-label">PV Massimi</div>
                    </div>
                    <div class="scheda-hp-cell clickable" onclick="schedaOpenHpCalcLive('${pg.id}','pv_attuali')">
                        <div class="scheda-hp-display pv-current" id="schedaPvAttuali">${pvAttuali}</div>
                        <div class="scheda-hp-label">PV Attuali</div>
                    </div>
                </div>
            </div>
            <div class="scheda-hp-right clickable" onclick="schedaOpenHpCalcLive('${pg.id}','pv_temporanei')">
                <div class="scheda-hp-display" id="schedaPvTemp">${pg.pv_temporanei || 0}</div>
                <div class="scheda-hp-label">PV Temporanei</div>
            </div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title">Abilità</div>
            <div class="scheda-skills" id="schedaSkillsList">${skillsHtml}</div>
            <div class="scheda-perc-passiva">
                <span class="scheda-perc-val" id="sPercPassiva">${percPassiva}</span>
                <span class="scheda-perc-label">Percezione Passiva</span>
            </div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title">Dadi Vita</div>
            ${hitDiceHtml || '<span class="scheda-empty">-</span>'}
        </div>

        ${classResourcesHtml}

        <div class="scheda-section">
            <div class="scheda-section-title">
                Resistenze e Immunità
                <button class="scheda-edit-btn" onclick="schedaOpenResImmEdit('${pg.id}')" title="Modifica">&#9998;</button>
            </div>
            <div class="scheda-res-imm-display" id="schedaResImmDisplay">
                <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Resistenze</span><div class="scheda-tags">${resistenzeHtml}</div></div>
                <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Immunità</span><div class="scheda-tags">${immunitaHtml}</div></div>
            </div>
            <div id="schedaResImmEditGrid" style="display:none;"></div>
        </div>

        <div class="scheda-section">
            <div class="scheda-section-title">Condizioni</div>
            <div class="scheda-tags">${conditionsHtml}</div>
            <div class="scheda-condition-extra">
                <span>Esaustione: <strong>${pg.esaustione || 0}</strong>/6</span>
            </div>
            <button type="button" class="btn-secondary btn-small" style="margin-top:8px;" onclick="openConditionsModal('${pg.id}')">Modifica stato</button>
        </div>

        `;

        // Wire up editable inputs
        content.querySelectorAll('.scheda-ability-input').forEach(input => {
            input.addEventListener('input', () => {
                const field = input.dataset.field;
                const val = Math.max(1, Math.min(30, parseInt(input.value) || 10));
                schedaDebouncedSave(pg.id, field, val);
                schedaRecalcAbility(field, val, pg.id);
            });
        });

        content.querySelectorAll('.scheda-box-input, .scheda-hp-input').forEach(input => {
            input.addEventListener('input', () => {
                const field = input.dataset.field;
                let val = field === 'velocita' ? parseFloat(input.value) || 0 : parseInt(input.value) || 0;
                schedaDebouncedSave(pg.id, field, val);
            });
        });

        const backBtn = document.getElementById('schedaBackBtn');
        if (backBtn) backBtn.onclick = () => navigateToPage('personaggi');

        schedaSetActiveTab('scheda');
        schedaWireTabBar(pg.id);

    } catch (e) {
        console.error('Errore caricamento scheda:', e);
        content.innerHTML = '<div class="content-placeholder"><p>Errore nel caricamento della scheda</p></div>';
    }
}

function schedaRecalcAbility(abilityKey, val, pgId) {
    const m = Math.floor((val - 10) / 2);
    const mStr = m >= 0 ? `+${m}` : `${m}`;
    const modEl = document.getElementById(`sMod_${abilityKey}`);
    if (modEl) modEl.textContent = mStr;

    const pg = _schedaPgCache;
    if (!pg) return;
    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const saves = pg.tiri_salvezza || [];
    const isSaveProf = saves.includes(abilityKey);
    const saveMod = m + (isSaveProf ? bonusComp : 0);
    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
    const saveEl = document.getElementById(`sSave_${abilityKey}`);
    if (saveEl) saveEl.textContent = saveStr;

    // Update skills that depend on this ability
    const skillProf = pg.competenze_abilita || [];
    const skillExpert = pg.maestrie_abilita || [];
    SCHEDA_SKILLS.filter(sk => sk.ability === abilityKey).forEach(sk => {
        const isProf = skillProf.includes(sk.key);
        const isExpert = skillExpert.includes(sk.key);
        const total = m + (isProf ? bonusComp : 0) + (isExpert ? bonusComp : 0);
        const totalStr = total >= 0 ? `+${total}` : `${total}`;
        const el = document.getElementById(`sSkill_${sk.key}`);
        if (el) el.textContent = totalStr;
    });

    if (abilityKey === 'saggezza') {
        const percProf = skillProf.includes('percezione');
        const percExpert = skillExpert.includes('percezione');
        const pp = 10 + m + (percProf ? bonusComp : 0) + (percExpert ? bonusComp : 0);
        const ppEl = document.getElementById('sPercPassiva');
        if (ppEl) ppEl.textContent = pp;
    }
}

window.schedaToggleSave = async function(pgId, abilityKey) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const saves = [...(pg.tiri_salvezza || [])];
    const idx = saves.indexOf(abilityKey);
    if (idx >= 0) saves.splice(idx, 1); else saves.push(abilityKey);
    pg.tiri_salvezza = saves;

    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const val = pg[abilityKey] || 10;
    const m = Math.floor((val - 10) / 2);
    const isProf = saves.includes(abilityKey);
    const saveMod = m + (isProf ? bonusComp : 0);
    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;

    const saveEl = document.querySelector(`.scheda-ability-save[data-save="${abilityKey}"]`);
    if (saveEl) {
        saveEl.classList.toggle('proficient', isProf);
        saveEl.querySelector('.scheda-save-dot').textContent = isProf ? '●' : '○';
        saveEl.querySelector('.scheda-save-val').textContent = saveStr;
    }
    schedaInstantSave(pgId, { tiri_salvezza: saves });
}

window.schedaToggleSkillProf = async function(pgId, skillKey, evt) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const skills = [...(pg.competenze_abilita || [])];
    const idx = skills.indexOf(skillKey);
    if (idx >= 0) skills.splice(idx, 1); else skills.push(skillKey);
    pg.competenze_abilita = skills;

    schedaRefreshSkill(pg, skillKey);
    if (evt && evt.target) setTimeout(() => evt.target.blur(), 0);
    schedaInstantSave(pgId, { competenze_abilita: skills });
}

window.schedaToggleSkillExpert = async function(pgId, skillKey, evt) {
    const pg = _schedaPgCache;
    if (!pg) return;
    const experts = [...(pg.maestrie_abilita || [])];
    const idx = experts.indexOf(skillKey);
    const adding = idx < 0;
    if (adding) experts.push(skillKey); else experts.splice(idx, 1);
    pg.maestrie_abilita = experts;

    const updates = { maestrie_abilita: experts };

    if (adding && !(pg.competenze_abilita || []).includes(skillKey)) {
        const skills = [...(pg.competenze_abilita || []), skillKey];
        pg.competenze_abilita = skills;
        updates.competenze_abilita = skills;
    }

    schedaRefreshSkill(pg, skillKey);
    if (evt && evt.target) setTimeout(() => evt.target.blur(), 0);
    schedaInstantSave(pgId, updates);
}

function schedaRefreshSkill(pg, skillKey) {
    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const sk = SCHEDA_SKILLS.find(s => s.key === skillKey);
    if (!sk) return;

    const abilityVal = pg[sk.ability] || 10;
    const abilityMod = Math.floor((abilityVal - 10) / 2);
    const isProf = (pg.competenze_abilita || []).includes(skillKey);
    const isExpert = (pg.maestrie_abilita || []).includes(skillKey);
    const total = abilityMod + (isProf ? bonusComp : 0) + (isExpert ? bonusComp : 0);
    const totalStr = total >= 0 ? `+${total}` : `${total}`;

    const el = document.getElementById(`sSkill_${skillKey}`);
    if (el) el.textContent = totalStr;

    const row = el?.closest('.scheda-skill');
    if (row) {
        const dots = row.querySelectorAll('.scheda-skill-dot');
        if (dots[0]) dots[0].classList.toggle('active', isProf);
        if (dots[1]) dots[1].classList.toggle('active', isExpert);
    }

    if (skillKey === 'percezione') {
        const sagMod = Math.floor(((pg.saggezza || 10) - 10) / 2);
        const pp = 10 + sagMod + (isProf ? bonusComp : 0) + (isExpert ? bonusComp : 0);
        const ppEl = document.getElementById('sPercPassiva');
        if (ppEl) ppEl.textContent = pp;
    }
}

// Spell Page
window.schedaOpenSpellPage = async function(pgId) {
    const content = document.getElementById('schedaContent');
    if (!content) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: pg } = await supabase.from('personaggi').select('*').eq('id', pgId).single();
    if (!pg) return;
    _schedaPgCache = pg;

    const bonusComp = Math.floor(((pg.livello || 1) - 1) / 4) + 2;
    const classi = pg.classi || [];

    const spellAbilities = [];
    classi.forEach(c => {
        const ab = CLASS_SPELL_ABILITY[c.nome];
        if (ab && !spellAbilities.find(s => s.ability === ab)) {
            const val = pg[ab] || 10;
            const m = Math.floor((val - 10) / 2);
            spellAbilities.push({ classe: c.nome, ability: ab, mod: m });
        }
    });

    const spellStatsHtml = spellAbilities.length > 0 ? spellAbilities.map(sa => {
        const atkBonus = sa.mod + bonusComp;
        const dc = 8 + bonusComp + sa.mod;
        const atkStr = atkBonus >= 0 ? `+${atkBonus}` : `${atkBonus}`;
        const modStr = sa.mod >= 0 ? `+${sa.mod}` : `${sa.mod}`;
        return `
        <div class="scheda-spell-stats-row">
            <div class="scheda-box"><div class="scheda-box-val">${modStr}</div><div class="scheda-box-label">Car. (${sa.ability.substring(0,3).toUpperCase()})</div></div>
            <div class="scheda-box"><div class="scheda-box-val">${atkStr}</div><div class="scheda-box-label">Attacco Inc.</div></div>
            <div class="scheda-box"><div class="scheda-box-val">${dc}</div><div class="scheda-box-label">CD Inc.</div></div>
        </div>`;
    }).join('') : '<p class="scheda-empty">Nessuna classe incantatrice</p>';

    const slots = pg.slot_incantesimo || {};
    const levels = Object.keys(slots).map(Number).sort((a, b) => a - b);
    const slotsHtml = levels.length > 0 ? levels.map(lvl => {
        const s = slots[lvl];
        const pips = [];
        for (let i = 0; i < s.max; i++) {
            pips.push(`<span class="scheda-slot-pip ${i < s.current ? 'filled' : ''}" data-lvl="${lvl}" data-idx="${i}"></span>`);
        }
        return `
        <div class="scheda-slot-row">
            <span class="scheda-slot-level">Lv ${lvl}</span>
            <div class="scheda-slot-pips">${pips.join('')}</div>
            <span class="scheda-slot-count" id="sSlotCount_${lvl}">${s.current}/${s.max}</span>
        </div>`;
    }).join('') : '<p class="scheda-empty">Nessuno slot disponibile</p>';

    const classeDisplay = classi.map(c => c.nome + (c.livello ? ' ' + c.livello : '')).join(' / ') || pg.classe || '';

    content.innerHTML = `
    <div class="scheda-identity">
        <div class="scheda-name">${escapeHtml(pg.nome)}</div>
        <div class="scheda-subtitle">${escapeHtml(classeDisplay)}</div>
        <div class="scheda-subtitle-sm">${[pg.razza, pg.background].filter(Boolean).map(s => escapeHtml(s)).join(' · ')}</div>
    </div>
    <div class="scheda-section">
        <div class="scheda-section-title">Statistiche Incantatore</div>
        ${spellStatsHtml}
    </div>
    <div class="scheda-section">
        <div class="scheda-section-title">Slot Incantesimo</div>
        <div class="scheda-slots-table">${slotsHtml}</div>
    </div>
    `;

    content.querySelectorAll('.scheda-slot-pip').forEach(pip => {
        pip.addEventListener('click', () => {
            const lvl = parseInt(pip.dataset.lvl);
            const idx = parseInt(pip.dataset.idx);
            schedaSlotToggleInline(pgId, lvl, idx);
        });
    });

    const backBtn = document.getElementById('schedaBackBtn');
    if (backBtn) backBtn.onclick = () => navigateToPage('personaggi');

    schedaSetActiveTab('incantesimi');
    schedaWireTabBar(pgId);
}

function schedaSetActiveTab(tab) {
    const mainTab = document.getElementById('schedaTabMain');
    const spellTab = document.getElementById('schedaTabSpell');
    if (mainTab) mainTab.classList.toggle('active', tab === 'scheda');
    if (spellTab) spellTab.classList.toggle('active', tab === 'incantesimi');
}

function schedaWireTabBar(pgId) {
    const mainTab = document.getElementById('schedaTabMain');
    const spellTab = document.getElementById('schedaTabSpell');
    if (mainTab) mainTab.onclick = () => renderSchedaPersonaggio(pgId);
    if (spellTab) spellTab.onclick = () => schedaOpenSpellPage(pgId);
}

function schedaSlotToggleInline(pgId, level, index) {
    const pg = _schedaPgCache;
    if (!pg || !pg.slot_incantesimo) return;

    const slot = pg.slot_incantesimo[level];
    if (!slot) return;

    if (index < slot.current) {
        slot.current = index;
    } else {
        slot.current = index + 1;
    }

    // Update pips without reloading
    const content = document.getElementById('schedaContent');
    if (content) {
        const pips = content.querySelectorAll(`.scheda-slot-pip[data-lvl="${level}"]`);
        pips.forEach((p, i) => {
            p.classList.toggle('filled', i < slot.current);
        });
        const countEl = document.getElementById(`sSlotCount_${level}`);
        if (countEl) countEl.textContent = `${slot.current}/${slot.max}`;
    }

    schedaInstantSave(pgId, { slot_incantesimo: pg.slot_incantesimo });
}

// Res/Imm inline edit on character sheet
window.schedaOpenResImmEdit = function(pgId) {
    const display = document.getElementById('schedaResImmDisplay');
    const grid = document.getElementById('schedaResImmEditGrid');
    if (!display || !grid) return;

    if (grid.style.display !== 'none') {
        grid.style.display = 'none';
        display.style.display = '';
        return;
    }

    const pg = _schedaPgCache;
    if (!pg) return;
    const res = pg.resistenze || [];
    const imm = pg.immunita || [];

    grid.innerHTML = `
        <div class="pg-res-header">
            <span></span><span class="pg-res-col-label">Res</span><span class="pg-res-col-label">Imm</span>
        </div>
        <div class="pg-res-grid">
            ${DAMAGE_TYPES.map(dt => {
                const isRes = res.includes(dt.value);
                const isImm = imm.includes(dt.value);
                return `<div class="pg-res-row">
                    <span class="pg-res-label">${dt.label}</span>
                    <input type="checkbox" class="pg-res-cb" ${isRes ? 'checked' : ''} data-val="${dt.value}" data-type="res" title="Resistenza">
                    <input type="checkbox" class="pg-imm-cb" ${isImm ? 'checked' : ''} data-val="${dt.value}" data-type="imm" title="Immunità">
                </div>`;
            }).join('')}
        </div>
        <div style="text-align:center;margin-top:8px;">
            <button class="btn-primary" id="schedaResImmSaveBtn" style="padding:6px 24px;font-size:0.85rem;">Salva</button>
        </div>`;

    display.style.display = 'none';
    grid.style.display = '';

    document.getElementById('schedaResImmSaveBtn').addEventListener('click', async () => {
        const newRes = [];
        const newImm = [];
        grid.querySelectorAll('.pg-res-cb:checked').forEach(cb => newRes.push(cb.dataset.val));
        grid.querySelectorAll('.pg-imm-cb:checked').forEach(cb => newImm.push(cb.dataset.val));

        const supabase = getSupabaseClient();
        if (!supabase) return;
        const { error } = await supabase.from('personaggi').update({ resistenze: newRes, immunita: newImm }).eq('id', pgId);
        if (error) { showNotification('Errore: ' + error.message); return; }

        if (_schedaPgCache) {
            _schedaPgCache.resistenze = newRes;
            _schedaPgCache.immunita = newImm;
        }

        const resDisp = newRes.length > 0 ?
            newRes.map(r => `<span class="scheda-tag">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';
        const immDisp = newImm.length > 0 ?
            newImm.map(r => `<span class="scheda-tag scheda-tag-imm">${escapeHtml(r.charAt(0).toUpperCase() + r.slice(1))}</span>`).join('') :
            '<span class="scheda-empty">Nessuna</span>';

        display.innerHTML = `
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Resistenze</span><div class="scheda-tags">${resDisp}</div></div>
            <div class="scheda-res-imm-row"><span class="scheda-res-imm-label">Immunità</span><div class="scheda-tags">${immDisp}</div></div>`;

        grid.style.display = 'none';
        display.style.display = '';
        showNotification('Resistenze e immunità aggiornate');
    });
}

// HP Calculator
let _hpCalcState = null;

window.schedaOpenHpCalcLive = function(pgId, field) {
    const pg = _schedaPgCache;
    if (!pg) return;
    let currentVal, maxVal;
    if (field === 'pv_attuali') {
        currentVal = pg.pv_attuali != null ? pg.pv_attuali : (pg.punti_vita_max || 10);
        maxVal = pg.punti_vita_max || 10;
    } else if (field === 'pv_temporanei') {
        currentVal = pg.pv_temporanei || 0;
        maxVal = -1;
    } else if (field === 'punti_vita_max') {
        currentVal = pg.punti_vita_max || 10;
        maxVal = -1;
    }
    schedaOpenHpCalc(pgId, field, currentVal, maxVal);
}

window.schedaOpenHpCalc = function(pgId, field, currentVal, maxVal) {
    _hpCalcState = { pgId, field, currentVal, maxVal, inputBuffer: '0' };
    const labels = { pv_attuali: 'Punti Vita Attuali', pv_temporanei: 'Punti Vita Temporanei', punti_vita_max: 'Punti Vita Massimi' };
    const label = labels[field] || 'Punti Vita';
    const maxDisplay = (maxVal > 0 && field !== 'punti_vita_max') ? `<span class="hp-calc-max">/ ${maxVal}</span>` : '';

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';

    const isDirectEdit = field === 'punti_vita_max' || field === 'pv_temporanei';
    const actionButtons = isDirectEdit
        ? `<div class="hp-calc-buttons"><button class="hp-calc-btn heal hp-calc-btn-full" onclick="schedaHpSetDirect()">Conferma</button></div>`
        : `<div class="hp-calc-buttons">
            <button class="hp-calc-btn damage" onclick="schedaHpApply(-1)">− Danno</button>
            <button class="hp-calc-btn heal" onclick="schedaHpApply(1)">+ Cura</button>
           </div>`;

    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">${label}</div>
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span>${maxDisplay}</div>
            <div class="hp-calc-input-display" id="hpCalcAmountDisplay">0</div>
            <div class="hp-calc-numpad">
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('1')">1</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('2')">2</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('3')">3</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('4')">4</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('5')">5</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('6')">6</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('7')">7</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('8')">8</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('9')">9</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('C')">C</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('0')">0</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('⌫')">⌫</button>
            </div>
            ${actionButtons}
        </div>
    `;
    document.body.appendChild(overlay);
}

window.hpCalcNumpad = function(key) {
    if (!_hpCalcState) return;
    if (key === 'C') {
        _hpCalcState.inputBuffer = '0';
    } else if (key === '⌫') {
        _hpCalcState.inputBuffer = _hpCalcState.inputBuffer.length > 1 ? _hpCalcState.inputBuffer.slice(0, -1) : '0';
    } else {
        _hpCalcState.inputBuffer = _hpCalcState.inputBuffer === '0' ? key : _hpCalcState.inputBuffer + key;
    }
    const display = document.getElementById('hpCalcAmountDisplay');
    if (display) display.textContent = _hpCalcState.inputBuffer;
}

window.schedaHpSetDirect = async function() {
    if (!_hpCalcState) return;
    const newVal = parseInt(_hpCalcState.inputBuffer) || 0;
    _hpCalcState.currentVal = newVal;

    const display = document.getElementById('hpCalcCurrent');
    if (display) display.textContent = newVal;
    _hpCalcState.inputBuffer = '0';
    const amountDisplay = document.getElementById('hpCalcAmountDisplay');
    if (amountDisplay) amountDisplay.textContent = '0';

    const displayId = { pv_attuali: 'schedaPvAttuali', pv_temporanei: 'schedaPvTemp', punti_vita_max: 'schedaPvMax' };
    const pgDisplay = document.getElementById(displayId[_hpCalcState.field]);
    if (pgDisplay) pgDisplay.textContent = newVal;
    if (_schedaPgCache) _schedaPgCache[_hpCalcState.field] = newVal;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ [_hpCalcState.field]: newVal, updated_at: new Date().toISOString() }).eq('id', _hpCalcState.pgId);
    }
}

window.schedaHpApply = async function(direction) {
    if (!_hpCalcState) return;
    const amount = parseInt(_hpCalcState.inputBuffer) || 0;
    if (amount === 0) return;

    let newVal = _hpCalcState.currentVal + (amount * direction);
    if (newVal < 0) newVal = 0;
    if (_hpCalcState.maxVal > 0 && newVal > _hpCalcState.maxVal) newVal = _hpCalcState.maxVal;
    _hpCalcState.currentVal = newVal;
    _hpCalcState.inputBuffer = '0';

    const display = document.getElementById('hpCalcCurrent');
    if (display) display.textContent = newVal;
    const amountDisplay = document.getElementById('hpCalcAmountDisplay');
    if (amountDisplay) amountDisplay.textContent = '0';

    const displayId = { pv_attuali: 'schedaPvAttuali', pv_temporanei: 'schedaPvTemp', punti_vita_max: 'schedaPvMax' };
    const pgDisplay = document.getElementById(displayId[_hpCalcState.field]);
    if (pgDisplay) pgDisplay.textContent = newVal;
    if (_schedaPgCache) _schedaPgCache[_hpCalcState.field] = newVal;

    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('personaggi').update({ [_hpCalcState.field]: newVal, updated_at: new Date().toISOString() }).eq('id', _hpCalcState.pgId);
    }
}

let _hpCalcClosedAt = 0;

window.schedaCloseHpCalc = async function() {
    const overlay = document.getElementById('hpCalcOverlay');
    if (overlay) overlay.remove();
    const wasMonster = _hpCalcState?.isMonster;
    const campagnaId = _hpCalcState?.campagnaId;
    const sessioneId = _hpCalcState?.sessioneId;
    _hpCalcState = null;
    _hpCalcClosedAt = Date.now();
    if (wasMonster && campagnaId && sessioneId) {
        await renderCombattimentoContent(campagnaId, sessioneId);
    }
}

window.schedaHdChange = function(pgId, className, current, delta, max) {
    const pg = _schedaPgCache;
    if (!pg) return;
    let newVal = current + delta;
    if (newVal < 0) newVal = 0;
    if (max != null && newVal > max) newVal = max;

    const dadi = { ...(pg.dadi_vita_disponibili || {}) };
    dadi[className] = newVal;
    pg.dadi_vita_disponibili = dadi;

    const el = document.getElementById(`sHd_${className}`);
    if (el) el.textContent = newVal;

    const row = el?.closest('.scheda-hd-row');
    if (row) {
        const maxAttr = max != null ? max : 99;
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaHdChange('${pgId}','${className}',${newVal},-1,${maxAttr})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaHdChange('${pgId}','${className}',${newVal},1,${maxAttr})`);
    }

    schedaInstantSave(pgId, { dadi_vita_disponibili: dadi });
}

window.schedaClassResChange = function(pgId, key, current, delta, max) {
    const newVal = Math.max(0, max != null ? Math.min(max, current + delta) : current + delta);
    if (newVal === current) return;

    const pg = _schedaPgCache;
    if (!pg) return;
    if (!pg.risorse_classe) pg.risorse_classe = {};
    pg.risorse_classe[key] = newVal;

    const el = document.getElementById(`sCRes_${key}`);
    if (el) el.textContent = newVal;

    const row = el?.closest('.scheda-hd-row');
    if (row) {
        const maxAttr = max != null ? max : 99;
        const btns = row.querySelectorAll('.scheda-hd-btn');
        if (btns[0]) btns[0].setAttribute('onclick', `schedaClassResChange('${pgId}','${key}',${newVal},-1,${maxAttr})`);
        if (btns[1]) btns[1].setAttribute('onclick', `schedaClassResChange('${pgId}','${key}',${newVal},1,${maxAttr})`);
    }

    schedaInstantSave(pgId, { risorse_classe: pg.risorse_classe });
}

window.openPersonaggioModal = function(personaggioId) {
    editingPersonaggioId = personaggioId || null;
    const form = elements.personaggioForm;
    if (!form) return;

    form.reset();
    pgSelectedClasses = [];
    pgCurrentSkillProficiencies = new Set();
    pgCurrentResistenze = [];
    pgCurrentImmunita = [];
    pgCurrentSlotIncantesimo = {};
    pgRenderClassi();
    pgWizardGoTo(0);

    const razzaBtn = document.getElementById('pgRazzaBtn');
    const razzaInput = document.getElementById('pgRazza');
    if (razzaBtn) razzaBtn.textContent = 'Seleziona razza...';
    if (razzaInput) razzaInput.value = '';
    const bgBtn = document.getElementById('pgBackgroundBtn');
    const bgInput = document.getElementById('pgBackground');
    if (bgBtn) bgBtn.textContent = 'Seleziona background...';
    if (bgInput) bgInput.value = '';

    // Reset saving throws
    ['Forza','Destrezza','Costituzione','Intelligenza','Saggezza','Carisma'].forEach(s => {
        const cb = document.getElementById(`save${s}`);
        if (cb) cb.checked = false;
    });

    if (personaggioId) {
        elements.personaggioModalTitle.textContent = 'Modifica Personaggio';
        elements.savePersonaggioBtn.textContent = 'Salva';

        const supabase = getSupabaseClient();
        if (supabase) {
            supabase.from('personaggi').select('*').eq('id', personaggioId).single().then(({ data, error }) => {
                if (data && !error) {
                    document.getElementById('pgNome').value = data.nome || '';
                    const razzaVal = data.razza || '';
                    document.getElementById('pgRazza').value = razzaVal;
                    const rBtn = document.getElementById('pgRazzaBtn');
                    if (rBtn) rBtn.textContent = razzaVal || 'Seleziona razza...';
                    const bgVal = data.background || '';
                    document.getElementById('pgBackground').value = bgVal;
                    const bBtn = document.getElementById('pgBackgroundBtn');
                    if (bBtn) bBtn.textContent = bgVal || 'Seleziona background...';

                    if (data.classi && Array.isArray(data.classi) && data.classi.length > 0) {
                        pgSelectedClasses = data.classi.map(c => ({ nome: c.nome, livello: c.livello || 1, thirdCaster: !!c.thirdCaster }));
                    } else if (data.classe) {
                        pgSelectedClasses = [{ nome: data.classe, livello: data.livello || 1 }];
                    }
                    pgRenderClassi();
                    pgUpdateTotalLevel();

                    document.getElementById('pgForza').value = data.forza || 10;
                    document.getElementById('pgDestrezza').value = data.destrezza || 10;
                    document.getElementById('pgCostituzione').value = data.costituzione || 10;
                    document.getElementById('pgIntelligenza').value = data.intelligenza || 10;
                    document.getElementById('pgSaggezza').value = data.saggezza || 10;
                    document.getElementById('pgCarisma').value = data.carisma || 10;

                    if (data.tiri_salvezza && Array.isArray(data.tiri_salvezza)) {
                        data.tiri_salvezza.forEach(s => {
                            const cb = document.getElementById(`save${s.charAt(0).toUpperCase() + s.slice(1)}`);
                            if (cb) cb.checked = true;
                        });
                    } else {
                        pgUpdateSavingThrows();
                    }

                    if (data.competenze_abilita && Array.isArray(data.competenze_abilita)) {
                        pgCurrentSkillProficiencies = new Set(data.competenze_abilita);
                    }

                    if (data.resistenze && Array.isArray(data.resistenze)) {
                        pgCurrentResistenze = [...data.resistenze];
                    }
                    if (data.immunita && Array.isArray(data.immunita)) {
                        pgCurrentImmunita = [...data.immunita];
                    }
                    if (data.slot_incantesimo && typeof data.slot_incantesimo === 'object') {
                        pgCurrentSlotIncantesimo = {};
                        Object.keys(data.slot_incantesimo).forEach(k => {
                            pgCurrentSlotIncantesimo[parseInt(k)] = { ...data.slot_incantesimo[k] };
                        });
                    }

                    const pvF = document.getElementById('pgPV');
                    if (pvF) { pvF.value = data.punti_vita_max || 10; pvF.dataset.autoHp = 'false'; }
                    document.getElementById('pgIniziativa').value = data.iniziativa != null ? data.iniziativa : calcMod(data.destrezza || 10);
                    document.getElementById('pgCA').value = data.classe_armatura || 10;
                    document.getElementById('pgVelocita').value = data.velocita || 9;
                    updateAllAbilityMods();
                }
            });
        }
    } else {
        elements.personaggioModalTitle.textContent = 'Nuovo Personaggio';
        elements.savePersonaggioBtn.textContent = 'Crea';
        document.getElementById('pgCA').value = '';
        document.getElementById('pgIniziativa').value = '';
        const pvField = document.getElementById('pgPV');
        if (pvField) { pvField.value = 10; pvField.dataset.autoHp = 'true'; }
        updateAllAbilityMods();
        updateBonusCompetenza();
    }

    elements.personaggioModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePersonaggioModal() {
    if (elements.personaggioModal) {
        elements.personaggioModal.classList.remove('active');
        document.body.style.overflow = '';
        editingPersonaggioId = null;
    }
}

let pgSaving = false;
async function handleSavePersonaggio(e) {
    e.preventDefault();
    if (pgSaving) return;
    pgSaving = true;
    const saveBtn = document.getElementById('savePersonaggioBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvataggio...'; }
    const supabase = getSupabaseClient();
    if (!supabase) { pgSaving = false; if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = editingPersonaggioId ? 'Salva' : 'Crea'; } return; }

    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) {
        showNotification('Errore: utente non trovato');
        return;
    }

    const destrezza = parseInt(document.getElementById('pgDestrezza').value) || 10;
    const desMod = calcMod(destrezza);
    const iniziativaVal = document.getElementById('pgIniziativa').value;
    const iniziativa = iniziativaVal !== '' ? parseInt(iniziativaVal) : desMod;
    const caVal = document.getElementById('pgCA').value;
    let caDefault = 10 + desMod;
    const classNames = pgSelectedClasses.map(c => c.nome);
    if (classNames.includes('Barbaro')) caDefault = 10 + desMod + calcMod(parseInt(document.getElementById('pgCostituzione').value) || 10);
    else if (classNames.includes('Monaco')) caDefault = 10 + desMod + calcMod(parseInt(document.getElementById('pgSaggezza').value) || 10);
    const classeArmatura = caVal !== '' ? parseInt(caVal) : caDefault;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const classeDisplay = pgSelectedClasses.map(c => `${c.nome} ${c.livello}`).join(' / ');
    const totalLevel = pgGetTotalLevel();

    const pgData = {
        nome: document.getElementById('pgNome').value.trim(),
        razza: document.getElementById('pgRazza').value || null,
        background: document.getElementById('pgBackground').value || null,
        classe: classeDisplay || null,
        classi: pgSelectedClasses,
        livello: totalLevel,
        forza: clamp(parseInt(document.getElementById('pgForza').value) || 10, 1, 30),
        destrezza: clamp(destrezza, 1, 30),
        costituzione: clamp(parseInt(document.getElementById('pgCostituzione').value) || 10, 1, 30),
        intelligenza: clamp(parseInt(document.getElementById('pgIntelligenza').value) || 10, 1, 30),
        saggezza: clamp(parseInt(document.getElementById('pgSaggezza').value) || 10, 1, 30),
        carisma: clamp(parseInt(document.getElementById('pgCarisma').value) || 10, 1, 30),
        tiri_salvezza: pgGetSelectedSaves(),
        competenze_abilita: Array.from(pgCurrentSkillProficiencies),
        resistenze: pgCurrentResistenze,
        immunita: pgCurrentImmunita,
        slot_incantesimo: pgBuildSlotIncantesimo(),
        punti_vita_max: parseInt(document.getElementById('pgPV').value) || 10,
        pv_attuali: parseInt(document.getElementById('pgPV').value) || 10,
        iniziativa: iniziativa,
        classe_armatura: classeArmatura,
        percezione_passiva: pgCalcPercPassiva(),
        velocita: parseFloat(document.getElementById('pgVelocita').value) || 9,
        updated_at: new Date().toISOString()
    };

    if (!pgData.nome) {
        showNotification('Inserisci un nome per il personaggio');
        return;
    }

    try {
        if (editingPersonaggioId) {
            const { error } = await supabase
                .from('personaggi')
                .update(pgData)
                .eq('id', editingPersonaggioId);
            if (error) throw error;
            showNotification('Personaggio aggiornato');
        } else {
            pgData.user_id = userData.id;
            const { error } = await supabase
                .from('personaggi')
                .insert(pgData);
            if (error) throw error;
            showNotification('Personaggio creato');
        }

        const wasEditing = editingPersonaggioId;
        closePersonaggioModal();
        if (wasEditing && AppState.currentPage === 'scheda') {
            await renderSchedaPersonaggio(wasEditing);
        } else {
            await loadPersonaggi();
        }
        await sendAppEventBroadcast({ table: 'personaggi', action: wasEditing ? 'update' : 'insert' });
    } catch (error) {
        console.error('Errore salvataggio personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    } finally {
        pgSaving = false;
        const btn = document.getElementById('savePersonaggioBtn');
        if (btn) { btn.disabled = false; btn.textContent = editingPersonaggioId ? 'Salva' : 'Crea'; }
    }
}

window.deletePersonaggio = async function(personaggioId) {
    const confirmed = await showConfirm('Sei sicuro di voler eliminare questo personaggio? Verrà rimosso anche da tutte le campagne associate.');
    if (!confirmed) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('personaggi')
            .delete()
            .eq('id', personaggioId);
        if (error) throw error;

        showNotification('Personaggio eliminato');
        if (AppState.currentPage === 'scheda') {
            navigateToPage('personaggi');
        }
        await loadPersonaggi();
        await sendAppEventBroadcast({ table: 'personaggi', action: 'delete' });
    } catch (error) {
        console.error('Errore eliminazione personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    }
}

// --- Scegli personaggio per campagna ---

window.openScegliPersonaggioModal = async function(campagnaId) {
    if (!elements.scegliPersonaggioModal || !elements.scegliPersonaggioList) return;

    elements.scegliPersonaggioList.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento...</p></div>';
    elements.scegliPersonaggioModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const userData = await findUserByUid(AppState.currentUser?.uid);
        if (!userData) throw new Error('Utente non trovato');

        const { data: personaggi, error } = await supabase.rpc('get_personaggi_utente');
        if (error) throw error;

        const { data: assoc } = await supabase
            .from('personaggi_campagna')
            .select('personaggio_id')
            .eq('campagna_id', campagnaId)
            .eq('user_id', userData.id)
            .maybeSingle();

        const currentPgId = assoc?.personaggio_id || null;

        if (!personaggi || personaggi.length === 0) {
            elements.scegliPersonaggioList.innerHTML = `
                <div class="content-placeholder">
                    <p>Non hai personaggi. Creane uno prima!</p>
                    <button class="btn-primary btn-small" onclick="closeScegliPersonaggioModal(); navigateToPage('personaggi');">Vai a Personaggi</button>
                </div>`;
            return;
        }

        elements.scegliPersonaggioList.innerHTML = personaggi.map(pg => {
            const initials = (pg.nome || '?').substring(0, 2).toUpperCase();
            const isSelected = pg.id === currentPgId;
            return `
            <div class="scegli-pg-item ${isSelected ? 'selected' : ''}" onclick="selectPersonaggioCampagna('${campagnaId}', '${pg.id}', '${userData.id}')">
                <div class="scegli-pg-item-avatar">${escapeHtml(initials)}</div>
                <div class="scegli-pg-item-info">
                    <div class="scegli-pg-item-name">${escapeHtml(pg.nome)}${isSelected ? ' (attuale)' : ''}</div>
                    <div class="scegli-pg-item-detail">${escapeHtml(pg.razza || '')} ${escapeHtml(pg.classe || '')} - Lv ${pg.livello || 1}</div>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Errore caricamento personaggi per selezione:', error);
        elements.scegliPersonaggioList.innerHTML = '<div class="content-placeholder"><p>Errore nel caricamento</p></div>';
    }
}

function closeScegliPersonaggioModal() {
    if (elements.scegliPersonaggioModal) {
        elements.scegliPersonaggioModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

window.selectPersonaggioCampagna = async function(campagnaId, personaggioId, userId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('personaggi_campagna')
            .upsert({
                campagna_id: campagnaId,
                user_id: userId,
                personaggio_id: personaggioId,
                created_at: new Date().toISOString()
            }, { onConflict: 'campagna_id,user_id' });

        if (error) throw error;

        showNotification('Personaggio selezionato!');
        closeScegliPersonaggioModal();
        await sendAppEventBroadcast({ table: 'personaggi_campagna', action: 'upsert', campagnaId });

        if (AppState.currentPage === 'dettagli' && AppState.currentCampagnaId === campagnaId) {
            await loadCampagnaDetails(campagnaId);
        }
    } catch (error) {
        console.error('Errore selezione personaggio:', error);
        showNotification('Errore: ' + (error.message || error));
    }
}

/**
 * Carica i dati utente da Supabase e applica le preferenze (es. tema)
 */
async function loadUserData(userId) {
    const supabase = getSupabaseClient();
    
    if (!supabase || !userId) {
        return null;
    }
    
    try {
        const userData = await findUserByUid(userId, true);
        
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

async function openCampagnaModal(campagnaId = null) {
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
    
    const modalTitle = document.querySelector('#campagnaModal h2');
    const saveBtn = document.getElementById('saveCampagnaBtn');

    if (campagnaId) {
        if (modalTitle) modalTitle.textContent = 'Modifica Campagna';
        if (saveBtn) saveBtn.textContent = 'Salva';

        // Pre-fill form with existing campaign data
        const supabase = getSupabaseClient();
        if (supabase) {
            try {
                const { data: campagna } = await supabase
                    .from('campagne')
                    .select('nome_campagna, icona_name')
                    .eq('id', campagnaId)
                    .single();
                if (campagna) {
                    const nomeInput = document.getElementById('nomeCampagna');
                    if (nomeInput) nomeInput.value = campagna.nome_campagna || '';
                    if (campagna.icona_name) {
                        selectPredefinedIcon(campagna.icona_name);
                    }
                }
            } catch (e) {
                console.warn('Impossibile pre-caricare dati campagna:', e);
            }
        }
    } else {
        if (modalTitle) modalTitle.textContent = 'Nuova Campagna';
        if (saveBtn) saveBtn.textContent = 'Crea';
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

function setupIconSelector() {
    const iconGrid = document.getElementById('iconGrid');
    if (!iconGrid) return;
    
    predefinedIcons.forEach((icon, index) => {
        const iconOption = document.createElement('div');
        iconOption.className = 'icon-option';
        if (index === 0) iconOption.classList.add('selected');
        iconOption.dataset.iconName = icon.name;
        iconOption.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.svg}</svg>`;
        iconOption.addEventListener('click', () => selectPredefinedIcon(icon.name));
        iconGrid.appendChild(iconOption);
    });
    
    selectPredefinedIcon('dice');
}

function selectPredefinedIcon(iconName) {
    selectedIconName = iconName;
    
    document.querySelectorAll('.icon-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.iconName === iconName);
    });
    
    updateIconPreview();
    closeIconSelectorModal();
}

// Icon name mapping for display
const iconNameMap = {
    'dice': 'Dado',
    'sword': 'Spada',
    'castle': 'Castello',
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
    const iconaCampagna = document.getElementById('iconaCampagna');
    const iconNameDisplay = document.getElementById('iconNameDisplay');
    
    if (!iconDisplay) return;
    
    const selectedIcon = predefinedIcons.find(i => i.name === selectedIconName);
    if (selectedIcon) {
        iconDisplay.innerHTML = selectedIcon.svg;
        if (iconNameDisplay) {
            const displayName = iconNameMap[selectedIconName] || selectedIcon.name.charAt(0).toUpperCase() + selectedIcon.name.slice(1);
            iconNameDisplay.textContent = displayName;
        }
        if (iconaCampagna) {
            iconaCampagna.value = selectedIconName;
        }
    }
}

function resetIconPreview() {
    selectedIconName = 'dice';
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

    const iconaType = 'predefined';
    const iconaName = selectedIconName || 'dice';
    const iconaData = null;

    const nomeCampagna = document.getElementById('nomeCampagna').value.trim();
    if (!nomeCampagna) {
        showNotification('Inserisci un nome per la campagna');
        return;
    }

    try {
        if (editingCampagnaId) {
            // Update: only change name and icon, preserve everything else
            const updateData = {
                nome_campagna: nomeCampagna,
                icona_type: iconaType,
                icona_name: iconaName,
                icona_data: iconaData,
            };
            const { error } = await supabase
                .from('campagne')
                .update(updateData)
                .eq('id', editingCampagnaId);
            
            if (error) throw error;
            await sendAppEventBroadcast({ table: 'campagne', action: 'update', campagnaId: editingCampagnaId });
            showNotification('Campagna aggiornata con successo!');
        } else {
            // Create new campagna
            const campagnaData = {
                nome_campagna: nomeCampagna,
                icona_type: iconaType,
                icona_name: iconaName,
                icona_data: iconaData,
                id_dm: utente.id,
                giocatori: [],
                numero_sessioni: 0,
                tempo_di_gioco: 0,
                note: []
            };
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
            await sendAppEventBroadcast({ table: 'campagne', action: 'insert' });
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
    // Salva nel sessionStorage per persistenza al refresh (si cancella alla chiusura del browser)
    sessionStorage.setItem('currentCampagnaId', campagnaId);
    navigateToPage('dettagli');
};

/**
 * Carica e mostra i dettagli di una campagna
 */
async function loadCampagnaDetails(campagnaId, options = {}) {
    const supabase = getSupabaseClient();
    const { silent = false } = options;
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    if (!silent && elements.dettagliCampagnaContent) {
        elements.dettagliCampagnaContent.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento dettagli...</p></div>';
    }

    try {
        stopCampagnaDetailsRealtime();

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

        // Avvia Realtime subscription per aggiornare quando viene avviata una sessione
        startCampagnaDetailsRealtime(campagnaId);
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
            const dmNamePromise = (campagna.id_dm && (!AppState.cachedUserData || AppState.cachedUserData.id !== campagna.id_dm))
                ? supabase.rpc('get_dms_campagne', { p_dm_ids: [campagna.id_dm] })
                : Promise.resolve(null);

            const giocatoriPromise = (campagna.giocatori && campagna.giocatori.length > 0)
                ? Promise.all([
                    supabase.from('utenti').select('id, nome_utente, cid').in('id', campagna.giocatori),
                    supabase.from('inviti_campagna').select('id, invitato_id').eq('campagna_id', campagna.id).in('invitato_id', campagna.giocatori).eq('stato', 'accepted')
                  ])
                : Promise.resolve(null);

            const [isDMResult, dmNameResult, giocatoriResult] = await Promise.all([
                isCurrentUserDM(campagna.id),
                dmNamePromise,
                giocatoriPromise
            ]);

            isDM = isDMResult;

            if (AppState.cachedUserData && AppState.cachedUserData.id === campagna.id_dm) {
                nomeDM = AppState.cachedUserData.nome_utente || 'DM';
            } else if (dmNameResult && !dmNameResult.error && dmNameResult.data?.length > 0) {
                nomeDM = dmNameResult.data[0].nome_utente || 'DM';
            }

            numeroGiocatori = Array.isArray(campagna.giocatori) ? campagna.giocatori.length : 0;

            if (giocatoriResult) {
                const [giocatoriDataResult, invitiResult] = giocatoriResult;
                const giocatoriData = giocatoriDataResult.data;
                if (giocatoriData) {
                    const invitiMap = new Map();
                    if (invitiResult.data) {
                        invitiResult.data.forEach(inv => invitiMap.set(inv.invitato_id, inv.id));
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
                    <button class="btn-secondary btn-small" onclick="deleteCampagna('${campagna.id}')" aria-label="Elimina campagna" style="color: #dc3545;">
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
            let pgLabel = '';
            try {
                const uData = await findUserByUid(AppState.currentUser?.uid);
                if (uData) {
                    const { data: pgAssoc } = await supabase
                        .from('personaggi_campagna')
                        .select('personaggio_id')
                        .eq('campagna_id', campagna.id)
                        .eq('user_id', uData.id)
                        .maybeSingle();
                    if (pgAssoc?.personaggio_id) {
                        const { data: pgData } = await supabase
                            .from('personaggi')
                            .select('nome')
                            .eq('id', pgAssoc.personaggio_id)
                            .single();
                        if (pgData) pgLabel = pgData.nome;
                    }
                }
            } catch (e) { console.warn('Errore caricamento pg campagna:', e); }

            dettagliActionsElement.innerHTML = `
                <div class="dettagli-actions-top">
                    <button class="btn-secondary btn-small" onclick="openScegliPersonaggioModal('${campagna.id}')" aria-label="Scegli personaggio">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 4px;">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        ${pgLabel ? escapeHtml(pgLabel) : 'Scegli personaggio'}
                    </button>
                </div>
                ${sessioneAttiva ? `
                <div class="dettagli-actions-start">
                    <button class="btn-primary btn-small" onclick="playerJoinSession('${campagna.id}')" aria-label="Vai alla sessione">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 4px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        Sessione Attiva
                    </button>
                </div>
                ` : ''}
            `;
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

    elements.gestisciGiocatoriContent.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento...</p></div>';

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            elements.gestisciGiocatoriContent.innerHTML = '<div class="content-placeholder"><p>Supabase non disponibile</p></div>';
            return;
        }

        // Usa direttamente la RPC che bypassa RLS
        const { data: utenti, error: utentiError } = await supabase
            .rpc('get_giocatori_campagna', { campagna_id_param: campagnaId });

        if (utentiError) {
            console.error('❌ Errore RPC get_giocatori_campagna:', utentiError);
            elements.gestisciGiocatoriContent.innerHTML = `<div class="content-placeholder"><p>Errore: ${utentiError.message || 'Impossibile caricare i giocatori'}</p></div>`;
            return;
        }

        let giocatoriAttuali = [];
        if (utenti && utenti.length > 0) {
            giocatoriAttuali = utenti.map(utente => ({
                id: utente.id,
                nome_utente: utente.nome_utente,
                cid: utente.cid,
                invitoId: null
            }));

            // Prova a caricare gli inviti per il mapping (non-blocking)
            try {
                const giocatoriIds = utenti.map(u => u.id);
                const { data: inviti } = await supabase
                    .from('inviti_campagna')
                    .select('id, invitato_id')
                    .eq('campagna_id', campagnaId)
                    .eq('stato', 'accepted')
                    .in('invitato_id', giocatoriIds);

                if (inviti) {
                    const invitiMap = new Map(inviti.map(inv => [inv.invitato_id, inv.id]));
                    giocatoriAttuali.forEach(g => { g.invitoId = invitiMap.get(g.id) || null; });
                }
            } catch (invErr) {
                console.warn('⚠️ Impossibile caricare inviti (non critico):', invErr);
            }
        }

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

    elements.invitaGiocatoriContent.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento...</p></div>';

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            elements.invitaGiocatoriContent.innerHTML = '<div class="content-placeholder"><p>Supabase non disponibile</p></div>';
            return;
        }

        // Carica giocatori attuali con RPC (bypassa RLS)
        const { data: giocatoriAttuali } = await supabase
            .rpc('get_giocatori_campagna', { campagna_id_param: campagnaId });

        // Raccogli gli ID da escludere (giocatori attuali + DM)
        const giocatoriAttualiIds = new Set();
        if (giocatoriAttuali) {
            giocatoriAttuali.forEach(g => giocatoriAttualiIds.add(g.id));
        }

        // Aggiungi il DM corrente alla lista di esclusione
        const currentUser = await findUserByUid(AppState.currentUser?.uid);
        if (currentUser) {
            giocatoriAttualiIds.add(currentUser.id);
        }

        // Carica gli amici con RPC (bypassa RLS)
        const { data: amiciData, error: amiciError } = await supabase
            .rpc('get_amici');

        if (amiciError) {
            console.error('❌ Errore RPC get_amici:', amiciError);
            elements.invitaGiocatoriContent.innerHTML = `<div class="content-placeholder"><p>Errore: ${amiciError.message || 'Impossibile caricare gli amici'}</p></div>`;
            return;
        }

        const amici = (amiciData || []).map(row => ({
            id: row.amico_id,
            nome_utente: row.nome_utente,
            cid: row.cid
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
    const iconName = campagna.icona_name || 'dice';
    const selectedIcon = predefinedIcons.find(i => i.name === iconName) || predefinedIcons[0];
    const iconaHTML = `<div class="dettagli-icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${selectedIcon.svg}</svg></div>`;

    // Aggiorna icona container
    if (elements.dettagliIconContainer) {
        elements.dettagliIconContainer.innerHTML = iconaHTML;
    }

    // Aggiorna titolo
    if (elements.dettagliCampagnaTitle) {
        elements.dettagliCampagnaTitle.textContent = campagna.nome_campagna || 'Senza nome';
    }
}

/**
 * Apre il modal per gestire i giocatori della campagna
 */
window.openInvitaGiocatoriModal = async function(campagnaId) {
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
};

/**
 * Chiude il modal per invitare giocatori
 */
function closeInvitaGiocatoriModal() {
    if (!elements.invitaGiocatoriModal) return;
    elements.invitaGiocatoriModal.classList.remove('active');
    document.body.style.overflow = '';
}

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
        elements.dmPlayersList.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento...</p></div>';
        elements.editDMModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const { data: giocatori, error } = await supabase
            .rpc('get_giocatori_campagna', { campagna_id_param: campagnaId });
        
        if (error) {
            console.error('❌ Errore RPC get_giocatori_campagna:', error);
            elements.dmPlayersList.innerHTML = `<div class="content-placeholder"><p>Errore: ${error.message || 'Impossibile caricare i giocatori'}</p></div>`;
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

        await sendAppEventBroadcast({ table: 'campagne', action: 'update', campagnaId });
        
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
 * Verifica se l'utente corrente è il DM di una campagna (con cache a breve durata)
 */
const _dmCache = {};
async function isCurrentUserDM(campagnaId) {
    const cacheKey = campagnaId;
    const cached = _dmCache[cacheKey];
    if (cached && Date.now() - cached.ts < 30000) return cached.value;

    const supabase = getSupabaseClient();
    if (!supabase || !AppState.currentUser) return false;

    try {
        const currentUser = AppState.cachedUserData || await findUserByUid(AppState.currentUser.uid);
        if (!currentUser) return false;
        
        const { data: isDM, error: rpcError } = await supabase.rpc('check_dm_campagna', {
            p_campagna_id: campagnaId,
            p_user_id: currentUser.id
        });

        if (rpcError) {
            const { data: campagna, error } = await supabase
                .from('campagne')
                .select('id_dm')
                .eq('id', campagnaId)
                .single();

            if (error || !campagna) return false;
            
            const result = campagna.id_dm === currentUser.id;
            _dmCache[cacheKey] = { value: result, ts: Date.now() };
            return result;
        }

        const result = isDM === true;
        _dmCache[cacheKey] = { value: result, ts: Date.now() };
        return result;
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
        await sendAppEventBroadcast({ table: 'campagne', action: 'update', campagnaId, field });

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
    const isDM = await isCurrentUserDM(campagnaId);
    if (!isDM) {
        showNotification('Solo il DM può eliminare la campagna');
        return;
    }

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
        await sendAppEventBroadcast({ table: 'campagne', action: 'delete', campagnaId });
        
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
        
        // Usa l'URL completo corrente come redirect
        const redirectUrl = window.location.origin + window.location.pathname;
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl
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
            
            // Pulisci sessionStorage PRIMA del logout
            sessionStorage.removeItem('currentCampagnaId');
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
            sessionStorage.removeItem('currentCampagnaId');
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
            sessionStorage.removeItem('currentCampagnaId');
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
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
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
        await sendAppEventBroadcast({ table: 'utenti', action: 'update', userId: utente.id, campagnaId });

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
 * Controlla all'avvio se ci sono sessioni attive o richieste di tiro pending
 */
async function checkStartupNotifications() {
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn || !AppState.currentUser) return;

    try {
        const userData = await findUserByUid(AppState.currentUser.uid);
        if (!userData) return;

        const [pendingRoll, dmCampagneResult, playerCampagneResult] = await Promise.all([
            checkPendingRollRequests(AppState.currentUser.uid),
            supabase.from('campagne').select('id').eq('id_dm', userData.id),
            supabase.from('inviti_campagna').select('campagna_id').eq('invitato_id', userData.id).eq('stato', 'accepted')
        ]);

        if (pendingRoll && !window.currentRollRequest) {
            showRollRequestModal(pendingRoll);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }

        if (!AppState.activeSessionCampagnaId) {
            const myCampagnaIds = [
                ...(dmCampagneResult.data || []).map(c => c.id),
                ...(playerCampagneResult.data || []).map(c => c.campagna_id)
            ];
            if (myCampagnaIds.length > 0) {
                const { data: activeSessions } = await supabase
                    .from('sessioni')
                    .select('id, campagna_id')
                    .in('campagna_id', myCampagnaIds)
                    .is('data_fine', null)
                    .limit(1);

                if (activeSessions && activeSessions.length > 0) {
                    const sess = activeSessions[0];
                    AppState.activeSessionCampagnaId = sess.campagna_id;
                    sessionStorage.setItem('activeSessionCampagnaId', sess.campagna_id);
                    AppState.currentCampagnaId = sess.campagna_id;
                    sessionStorage.setItem('currentCampagnaId', sess.campagna_id);
                    AppState.currentSessioneId = sess.id;
                    sessionStorage.setItem('currentSessioneId', sess.id);
                    updateReturnToSessionBtn();
                }
            }
        }
    } catch (error) {
        console.error('Errore checkStartupNotifications:', error);
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
        await sendAppEventBroadcast({ table: 'sessioni', action: 'insert', campagnaId, sessioneId: data?.id });

        showNotification('Sessione iniziata!');
        
        // Apri la pagina sessione
        openSessionePage(campagnaId);
    } catch (error) {
        console.error('❌ Errore nell\'inizio sessione:', error);
        showNotification('Errore nell\'inizio della sessione: ' + (error.message || error));
    }
};

/**
 * Verifica che il giocatore abbia un personaggio selezionato prima di entrare in sessione
 */
window.playerJoinSession = async function(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const userData = await findUserByUid(AppState.currentUser?.uid);
    if (!userData) return;

    try {
        const { data: pg } = await supabase.rpc('get_personaggio_campagna', {
            p_campagna_id: campagnaId,
            p_user_id: userData.id
        });
        if (!pg || pg.length === 0) {
            showNotification('Devi scegliere un personaggio prima di unirti alla sessione');
            return;
        }
        openSessionePage(campagnaId);
    } catch (e) {
        console.error('Errore verifica personaggio:', e);
        showNotification('Devi scegliere un personaggio prima di unirti alla sessione');
    }
}

/**
 * Apre la pagina sessione
 */
window.openSessionePage = async function(campagnaId) {
    AppState.currentCampagnaId = campagnaId;
    sessionStorage.setItem('currentCampagnaId', campagnaId);
    AppState.activeSessionCampagnaId = campagnaId;
    sessionStorage.setItem('activeSessionCampagnaId', campagnaId);
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
        const [isDM, campagnaResult, sessione] = await Promise.all([
            isCurrentUserDM(campagnaId),
            supabase.from('campagne').select('nome_campagna').eq('id', campagnaId).single(),
            getSessioneAttiva(campagnaId)
        ]);

        const campagna = campagnaResult.data;
        if (campagnaResult.error) throw campagnaResult.error;

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

        const [numeroSessione, richiesteResult] = await Promise.all([
            getNumeroSessione(campagnaId),
            supabase.from('richieste_tiro_iniziativa').select('id, stato').eq('sessione_id', sessione.id).limit(1)
        ]);

        if (sessioneTitle) {
            sessioneTitle.innerHTML = `<div>${escapeHtml(campagna.nome_campagna)}</div><div>Sessione ${numeroSessione}</div>`;
        }

        const dataInizio = new Date(sessione.data_inizio);
        window._sessioneDataInizio = dataInizio.getTime();
        const durataMs = Date.now() - dataInizio.getTime();
        const durataMinuti = Math.floor(durataMs / 60000);
        const durataOre = Math.floor(durataMinuti / 60);
        const durataMinutiResto = durataMinuti % 60;

        const inCombattimento = richiesteResult.data && richiesteResult.data.length > 0;

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

            <div id="sessioneConditionsPanel"></div>
        `;

        await renderSessioneConditions(campagnaId, isDM);

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
 * Avvia il timer per la sessione (aggiorna solo il DOM del timer, non ricarica tutto)
 */
function startSessioneTimer(campagnaId) {
    if (window.sessioneTimerInterval) {
        clearInterval(window.sessioneTimerInterval);
    }

    window.sessioneTimerInterval = setInterval(() => {
        const timerElement = document.querySelector('.timer-value');
        if (!timerElement || !window._sessioneDataInizio) return;
        
        const durataMs = Date.now() - window._sessioneDataInizio;
        const durataMinuti = Math.floor(durataMs / 60000);
        const ore = Math.floor(durataMinuti / 60);
        const min = durataMinuti % 60;
        timerElement.textContent = `${ore.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    }, 10000);
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
        await sendAppEventBroadcast({ table: 'sessioni', action: 'update', campagnaId, sessioneId });

        stopSessioneTimer();
        clearActiveSession();
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
        await sendAppEventBroadcast({ table: 'iniziativa', action: 'insert', sessioneId });

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
    sessionStorage.setItem('currentCampagnaId', campagnaId);
    sessionStorage.setItem('currentSessioneId', sessioneId);
    navigateToPage('combattimento');
    await renderCombattimentoContent(campagnaId, sessioneId);
    startCombattimentoRealtime(campagnaId, sessioneId);
};

// --- Conditions / Status management ---
const ALL_CONDITIONS = [
    { key: 'concentrazione', label: 'Concentrazione' },
    { key: 'accecato', label: 'Accecato' },
    { key: 'affascinato', label: 'Affascinato' },
    { key: 'afferrato', label: 'Afferrato' },
    { key: 'assordato', label: 'Assordato' },
    { key: 'avvelenato', label: 'Avvelenato' },
    { key: 'incapacitato', label: 'Incapacitato' },
    { key: 'invisibile', label: 'Invisibile' },
    { key: 'paralizzato', label: 'Paralizzato' },
    { key: 'pietrificato', label: 'Pietrificato' },
    { key: 'privo_di_sensi', label: 'Privo di sensi' },
    { key: 'prono', label: 'Prono' },
    { key: 'spaventato', label: 'Spaventato' },
    { key: 'stordito', label: 'Stordito' },
    { key: 'trattenuto', label: 'Trattenuto' }
];

async function renderSessioneConditions(campagnaId, isDM) {
    const panel = document.getElementById('sessioneConditionsPanel');
    if (!panel) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        if (isDM) {
            const { data: pgList } = await supabase.rpc('get_personaggi_in_campagna', { p_campagna_id: campagnaId });
            if (!pgList || pgList.length === 0) { panel.innerHTML = ''; return; }

            const pgIds = pgList.map(pg => pg.personaggio_id).filter(Boolean);
            const { data: fullChars } = await supabase.from('personaggi')
                .select('id, nome, concentrazione, accecato, affascinato, afferrato, assordato, avvelenato, incapacitato, invisibile, paralizzato, pietrificato, privo_di_sensi, prono, spaventato, stordito, trattenuto, esaustione, slot_incantesimo')
                .in('id', pgIds);

            panel.innerHTML = `
                <div class="form-section-label" style="margin-top:var(--spacing-md);">Stato Personaggi</div>
                ${(fullChars || []).map(pg => renderConditionsCard(pg, true)).join('')}
            `;
        } else {
            const userData = AppState.cachedUserData || await findUserByUid(AppState.currentUser?.uid);
            if (!userData) return;
            const { data: pgData } = await supabase.rpc('get_personaggio_campagna', { p_campagna_id: campagnaId, p_user_id: userData.id });
            if (!pgData || pgData.length === 0) { panel.innerHTML = ''; return; }
            const pg = pgData[0];
            const { data: fullPg } = await supabase.from('personaggi').select('id, nome, concentrazione, accecato, affascinato, afferrato, assordato, avvelenato, incapacitato, invisibile, paralizzato, pietrificato, privo_di_sensi, prono, spaventato, stordito, trattenuto, esaustione, slot_incantesimo').eq('id', pg.id).single();
            if (!fullPg) return;

            panel.innerHTML = `
                <div class="form-section-label" style="margin-top:var(--spacing-md);">Il tuo Personaggio</div>
                ${renderConditionsCard(fullPg, false)}
            `;
        }
    } catch (e) {
        console.error('Errore rendering condizioni:', e);
    }
}

function renderConditionsCard(pg, showName) {
    const activeConditions = ALL_CONDITIONS.filter(c => pg[c.key]);
    const activeLabels = activeConditions.map(c => c.label);
    const conditionsText = activeLabels.length > 0 ? activeLabels.join(', ') : 'Nessuna';

    let slotsHtml = '';
    if (pg.slot_incantesimo && typeof pg.slot_incantesimo === 'object') {
        const levels = Object.keys(pg.slot_incantesimo).map(Number).sort((a, b) => a - b);
        if (levels.length > 0) {
            slotsHtml = `
            <div class="session-slots-row">
                ${levels.map(lvl => {
                    const s = pg.slot_incantesimo[lvl];
                    return `<div class="session-slot-badge">
                        <span class="session-slot-lvl">Lv${lvl}</span>
                        <span class="session-slot-val" id="sessSlot_${pg.id}_${lvl}">${s.current}</span>/<span class="session-slot-max">${s.max}</span>
                        <div class="session-slot-btns">
                            <button type="button" class="pg-slot-btn-sm" onclick="sessionSlotChange('${pg.id}',${lvl},-1)">−</button>
                            <button type="button" class="pg-slot-btn-sm" onclick="sessionSlotChange('${pg.id}',${lvl},1)">+</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
        }
    }

    return `
    <div class="session-condition-card" data-pg-id="${pg.id}">
        ${showName ? `<div class="session-condition-name">${escapeHtml(pg.nome)}</div>` : ''}
        <div class="session-condition-row">
            <div class="session-condition-badges">
                ${activeConditions.map(c => `<span class="condition-badge active">${c.label}</span>`).join('')}
            </div>
            <div class="session-condition-exhaustion">
                <span class="exhaustion-label">Esaustione</span>
                <span class="exhaustion-value">${pg.esaustione || 0}</span>/6
            </div>
        </div>
        <div class="session-condition-actions">
            <button type="button" class="btn-secondary btn-small" onclick="openConditionsModal('${pg.id}')">Modifica stato</button>
        </div>
        ${slotsHtml}
    </div>`;
}

window.openConditionsModal = async function(personaggioId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: pg, error } = await supabase.from('personaggi').select('id, nome, concentrazione, accecato, affascinato, afferrato, assordato, avvelenato, incapacitato, invisibile, paralizzato, pietrificato, privo_di_sensi, prono, spaventato, stordito, trattenuto, esaustione').eq('id', personaggioId).single();
    if (error || !pg) { showNotification('Errore nel caricamento del personaggio'); return; }

    const modalHtml = `
    <div class="modal active" id="conditionsModal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeConditionsModal()">&times;</button>
            <h2>Stato: ${escapeHtml(pg.nome)}</h2>
            <div class="form-section-label">Condizioni</div>
            <div class="pg-conditions-grid">
                ${ALL_CONDITIONS.map(c => `
                    <label class="pg-condition-item">
                        <input type="checkbox" id="cond_${c.key}" ${pg[c.key] ? 'checked' : ''}>
                        <label for="cond_${c.key}">${c.label}</label>
                    </label>
                `).join('')}
            </div>
            <div class="form-section-label" style="margin-top:var(--spacing-sm);">Esaustione</div>
            <div class="pg-exhaustion-row">
                <label>Livello</label>
                <input type="range" id="cond_esaustione" min="0" max="6" value="${pg.esaustione || 0}" oninput="document.getElementById('condExhaustionVal').textContent = this.value">
                <span class="pg-exhaustion-value" id="condExhaustionVal">${pg.esaustione || 0}</span>
            </div>
            <div class="form-actions" style="margin-top:var(--spacing-md);">
                <button type="button" class="btn-secondary" onclick="closeConditionsModal()">Annulla</button>
                <button type="button" class="btn-primary" onclick="saveConditions('${personaggioId}')">Salva</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

window.closeConditionsModal = function() {
    const m = document.getElementById('conditionsModal');
    if (m) m.remove();
    document.body.style.overflow = '';
}

window.saveConditions = async function(personaggioId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const updates = {};
    ALL_CONDITIONS.forEach(c => {
        const cb = document.getElementById(`cond_${c.key}`);
        if (cb) updates[c.key] = cb.checked;
    });
    const exhInput = document.getElementById('cond_esaustione');
    if (exhInput) updates.esaustione = parseInt(exhInput.value) || 0;
    updates.updated_at = new Date().toISOString();

    try {
        const { error } = await supabase.from('personaggi').update(updates).eq('id', personaggioId);
        if (error) throw error;
        showNotification('Stato aggiornato');
        closeConditionsModal();
        if (AppState.currentPage === 'scheda' && AppState.currentPersonaggioId) {
            await renderSchedaPersonaggio(AppState.currentPersonaggioId);
        }
        if (AppState.currentCampagnaId) {
            const isDM = await isCurrentUserDM(AppState.currentCampagnaId);
            await renderSessioneConditions(AppState.currentCampagnaId, isDM);
        }
        await sendAppEventBroadcast({ table: 'personaggi', action: 'update' });
    } catch (e) {
        console.error('Errore aggiornamento condizioni:', e);
        showNotification('Errore: ' + (e.message || e));
    }
}

window.sessionSlotChange = async function(personaggioId, level, delta) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: pg } = await supabase.from('personaggi').select('slot_incantesimo').eq('id', personaggioId).single();
    if (!pg || !pg.slot_incantesimo) return;

    const slots = { ...pg.slot_incantesimo };
    const slot = slots[level];
    if (!slot) return;

    const newCurrent = Math.max(0, Math.min(slot.max, slot.current + delta));
    if (newCurrent === slot.current) return;

    slots[level] = { ...slot, current: newCurrent };

    try {
        const { error } = await supabase.from('personaggi').update({ slot_incantesimo: slots, updated_at: new Date().toISOString() }).eq('id', personaggioId);
        if (error) throw error;
        const el = document.getElementById(`sessSlot_${personaggioId}_${level}`);
        if (el) el.textContent = newCurrent;
    } catch (e) {
        console.error('Errore aggiornamento slot:', e);
    }
}

/**
 * Fetches campaign characters once and returns both names and conditions maps.
 * Avoids duplicate RPC + eliminates N+1 queries.
 */
async function getCampaignCharacterData(campagnaId) {
    const namesMap = {};
    const conditionsMap = {};
    const supabase = getSupabaseClient();
    if (!supabase || !campagnaId) return { namesMap, conditionsMap };
    try {
        const { data: pgList } = await supabase.rpc('get_personaggi_in_campagna', { p_campagna_id: campagnaId });
        if (!pgList || pgList.length === 0) return { namesMap, conditionsMap };

        pgList.forEach(pg => { namesMap[pg.player_user_id] = pg.nome; });

        const pgIds = pgList.map(pg => pg.personaggio_id).filter(Boolean);
        if (pgIds.length > 0) {
            const { data: charRows } = await supabase.from('personaggi')
                .select('id, concentrazione, accecato, affascinato, afferrato, assordato, avvelenato, incapacitato, invisibile, paralizzato, pietrificato, privo_di_sensi, prono, spaventato, stordito, trattenuto, esaustione, punti_vita_max, pv_attuali')
                .in('id', pgIds);
            if (charRows) {
                const charById = {};
                charRows.forEach(c => { charById[c.id] = c; });
                pgList.forEach(pg => {
                    if (charById[pg.personaggio_id]) conditionsMap[pg.player_user_id] = charById[pg.personaggio_id];
                });
            }
        }
    } catch (e) { console.warn('Errore caricamento dati personaggi campagna:', e); }
    return { namesMap, conditionsMap };
}

async function getCharacterNamesMap(campagnaId) {
    const { namesMap } = await getCampaignCharacterData(campagnaId);
    return namesMap;
}

async function getCharacterConditionsMap(campagnaId) {
    const { conditionsMap } = await getCampaignCharacterData(campagnaId);
    return conditionsMap;
}

/**
 * Renderizza il contenuto della pagina combattimento
 */
const MONSTER_TYPES = ['Aberrazione','Bestia','Celestiale','Costrutto','Drago','Elementale','Fatato','Immondo','Melma','Mostruosità','Non morto','Pianta','Gigante','Umanoide'];
const MONSTER_SIZES = ['Minuscola','Piccola','Media','Grande','Enorme','Mastodontica'];
const MONSTER_ALIGNMENTS = ['Legale Buono','Neutrale Buono','Caotico Buono','Legale Neutrale','Neutrale','Caotico Neutrale','Legale Malvagio','Neutrale Malvagio','Caotico Malvagio','Senza allineamento'];

let _combatInitiativeOrder = [];
let _combatMonsters = [];
let _combatSelectedId = null;
let _combatSelectedType = null; // 'player' or 'monster'

async function renderCombattimentoContent(campagnaId, sessioneId) {
    const cardsCol = document.getElementById('combattimentoContent');
    const initCol = document.getElementById('combatInitCol');
    const roundInfo = document.getElementById('combatRoundInfo');
    const nextBtn = document.getElementById('combatNextTurnBtn');
    const toolbar = document.getElementById('combatToolbar');
    if (!cardsCol) return;

    const supabase = getSupabaseClient();
    if (!supabase) { cardsCol.innerHTML = '<p>Errore: Supabase non disponibile</p>'; return; }

    try {
        const [sessioneResult, tiriResult, monstersResult, charData, isDM, currentUserId] = await Promise.all([
            supabase.from('sessioni').select('combat_round, combat_turn_index').eq('id', sessioneId).single(),
            supabase.rpc('get_tiri_iniziativa', { p_sessione_id: sessioneId }),
            supabase.from('mostri_combattimento').select('*').eq('sessione_id', sessioneId).order('iniziativa', { ascending: false, nullsFirst: false }),
            getCampaignCharacterData(campagnaId),
            isCurrentUserDM(campagnaId),
            getCurrentInternalUserId()
        ]);

        const sessione = sessioneResult.data;
        const combatRound = sessione?.combat_round || 1;
        const combatTurnIdx = sessione?.combat_turn_index || 0;

        let tiriIniziativa = tiriResult.data;
        if (tiriResult.error || !tiriIniziativa) {
            const fallback = await supabase.from('richieste_tiro_iniziativa')
                .select(`*, utenti!richieste_tiro_iniziativa_giocatore_id_fkey(nome_utente, cid)`)
                .eq('sessione_id', sessioneId).order('valore', { ascending: false });
            tiriIniziativa = fallback.data;
        }
        const tiriCompleted = (tiriIniziativa || []).filter(t => t.stato === 'completed' && t.valore !== null);

        _combatMonsters = monstersResult.data || [];

        const pgNamesMap = charData.namesMap;
        const pgConditionsMap = charData.conditionsMap;

        // Build initiative order
        const order = [];
        tiriCompleted.forEach(t => {
            const pgName = pgNamesMap[t.giocatore_id];
            order.push({ type: 'player', id: t.giocatore_id, name: pgName || t.giocatore_nome || t.utenti?.nome_utente || '?', init: t.valore, conditions: pgConditionsMap[t.giocatore_id] });
        });
        _combatMonsters.forEach(m => {
            order.push({ type: 'monster', id: m.id, name: m.nome, init: m.iniziativa ?? 0, monster: m });
        });
        order.sort((a, b) => b.init - a.init);
        _combatInitiativeOrder = order;

        const turnIdx = Math.min(combatTurnIdx, Math.max(0, order.length - 1));

        // Round/turn header
        if (roundInfo) {
            const currentName = order[turnIdx]?.name || 'In attesa...';
            roundInfo.innerHTML = `<div class="combat-round-num">Round ${combatRound}</div><div class="combat-turn-name">${escapeHtml(currentName)}</div>`;
        }
        if (nextBtn) {
            nextBtn.style.display = isDM && order.length > 0 ? '' : 'none';
            nextBtn.onclick = () => combatNextTurn(campagnaId, sessioneId, order.length, combatRound, turnIdx);
        }

        // Left icons column
        if (initCol) {
            initCol.innerHTML = order.map((entry, idx) => {
                const initials = entry.name.substring(0, 2).toUpperCase();
                const isTurn = idx === turnIdx;
                const isExpanded = _combatSelectedId === entry.id && _combatSelectedType === entry.type;
                const dimmed = _combatSelectedId && !isExpanded;
                return `<div class="combat-icon ${isTurn ? 'active' : ''} ${isExpanded ? 'active' : ''} ${dimmed ? 'dimmed' : ''} ${entry.type === 'monster' ? 'monster' : ''}" data-idx="${idx}">
                    <span class="combat-icon-initials">${escapeHtml(initials)}</span>
                    <span class="combat-icon-init">${entry.init}</span>
                </div>`;
            }).join('');
        }

        // Right cards column
        if (order.length === 0) {
            cardsCol.innerHTML = '<div class="content-placeholder"><p>In attesa dei tiri iniziativa...</p></div>';
        } else if (_combatSelectedId) {
            // Show expanded sheet
            if (_combatSelectedType === 'monster') {
                await renderCombatMonsterSheet(_combatSelectedId, isDM, campagnaId, sessioneId);
            } else {
                const isOwner = _combatSelectedId === currentUserId;
                await renderCombatPlayerSheet(_combatSelectedId, isDM, isOwner, campagnaId, sessioneId);
            }
        } else {
            // Show all cards
            cardsCol.innerHTML = order.map((entry, idx) => {
                const isTurn = idx === turnIdx;
                const isMonster = entry.type === 'monster';

                let condBadges = '';
                if (isMonster && entry.monster) {
                    const active = ALL_CONDITIONS.filter(c => entry.monster[c.key]);
                    if (active.length > 0) condBadges = active.map(c => `<span class="condition-badge-sm">${c.label}</span>`).join('');
                } else if (entry.conditions) {
                    const active = ALL_CONDITIONS.filter(c => entry.conditions[c.key]);
                    if (active.length > 0) condBadges = active.map(c => `<span class="condition-badge-sm">${c.label}</span>`).join('');
                }

                let hpDisplay = '';
                if (isMonster && isDM && entry.monster) {
                    const mHp = entry.monster.pv_attuali ?? entry.monster.punti_vita_max;
                    hpDisplay = `<span class="combat-card-hp">${mHp}/${entry.monster.punti_vita_max}</span>`;
                } else if (!isMonster && entry.conditions) {
                    const pHp = entry.conditions.pv_attuali != null ? entry.conditions.pv_attuali : entry.conditions.punti_vita_max;
                    const pMax = entry.conditions.punti_vita_max || '?';
                    hpDisplay = `<span class="combat-card-hp">${pHp}/${pMax}</span>`;
                }

                return `<div class="combat-card ${isTurn ? 'is-turn' : ''} ${isMonster ? 'monster-card' : ''}" 
                    onclick="combatSelectEntry('${entry.type}','${entry.id}','${campagnaId}','${sessioneId}',${isDM},${entry.id === currentUserId})">
                    <div class="combat-card-center">
                        <span class="combat-card-name">${escapeHtml(entry.name)}</span>
                        ${condBadges ? `<div class="combat-card-badges">${condBadges}</div>` : ''}
                    </div>
                    ${hpDisplay}
                </div>`;
            }).join('');
        }

        // DM Toolbar
        if (toolbar) {
            if (isDM) {
                toolbar.style.display = 'flex';
                toolbar.innerHTML = `
                    <button class="combat-toolbar-btn" onclick="openMonsterCreationModal('${campagnaId}','${sessioneId}')" title="Aggiungi mostro">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                        <span>Mostro</span>
                    </button>
                    <button class="combat-toolbar-btn" onclick="combatDiceRoll()" title="Tira dadi">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="4"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>
                        <span>Dadi</span>
                    </button>
                    <button class="combat-toolbar-btn" onclick="combatCalcOpen()" title="Calcolatrice">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>
                        <span>Calc</span>
                    </button>
                    <button class="combat-toolbar-btn danger" onclick="terminaCombattimento('${campagnaId}','${sessioneId}')" title="Termina combattimento">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        <span>Fine</span>
                    </button>`;
            } else {
                toolbar.style.display = 'none';
            }
        }

    } catch (error) {
        console.error('Errore rendering combattimento:', error);
        cardsCol.innerHTML = '<p>Errore nel caricamento del combattimento</p>';
    }
}

async function getCurrentInternalUserId() {
    if (AppState.cachedUserData?.id) return AppState.cachedUserData.id;
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.currentUser) return null;
    try {
        const { data } = await supabase.from('utenti').select('id').eq('uid', AppState.currentUser.uid).single();
        return data?.id || null;
    } catch (e) { return null; }
}

window.combatNextTurn = async function(campagnaId, sessioneId, orderLen, round, turnIdx) {
    if (orderLen === 0) return;
    let nextIdx = turnIdx + 1;
    let nextRound = round;
    if (nextIdx >= orderLen) {
        nextIdx = 0;
        nextRound = round + 1;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.from('sessioni').update({ combat_round: nextRound, combat_turn_index: nextIdx }).eq('id', sessioneId);
    await sendAppEventBroadcast({ table: 'combattimento', action: 'next_turn', sessioneId, campagnaId });
    await renderCombattimentoContent(campagnaId, sessioneId);
}

window.combatSelectEntry = async function(type, id, campagnaId, sessioneId, isDM, isOwner) {
    if (_combatSelectedId === id && _combatSelectedType === type) {
        _combatSelectedId = null;
        _combatSelectedType = null;
    } else {
        _combatSelectedId = id;
        _combatSelectedType = type;
    }
    await renderCombattimentoContent(campagnaId, sessioneId);
}

window.combatCloseSheet = async function(campagnaId, sessioneId) {
    _combatSelectedId = null;
    _combatSelectedType = null;
    await renderCombattimentoContent(campagnaId, sessioneId);
}

async function renderCombatPlayerSheet(userId, isDM, isOwner, campagnaId, sessioneId) {
    const content = document.getElementById('combattimentoContent');
    if (!content) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: pcList } = await supabase.rpc('get_personaggi_in_campagna', { p_campagna_id: campagnaId });
    const pc = (pcList || []).find(p => p.player_user_id === userId);
    if (!pc) { content.innerHTML = '<p>Personaggio non trovato</p>'; return; }

    const { data: pg } = await supabase.from('personaggi').select('*').eq('id', pc.personaggio_id).single();
    if (!pg) { content.innerHTML = '<p>Personaggio non trovato</p>'; return; }

    const canEdit = isDM || isOwner;
    const fMod = (v) => { const m = Math.floor(((v||10)-10)/2); return m >= 0 ? `+${m}` : `${m}`; };
    const bonusComp = Math.floor(((pg.livello||1)-1)/4)+2;
    const pvAttuali = pg.pv_attuali != null ? pg.pv_attuali : pg.punti_vita_max;
    const saves = pg.tiri_salvezza || [];

    const conditionsActive = ALL_CONDITIONS.filter(c => pg[c.key]);
    const condBadges = conditionsActive.map(c => `<span class="condition-badge active">${c.label}</span>`).join('');

    const hasSpellSlots = pg.slot_incantesimo && typeof pg.slot_incantesimo === 'object' && Object.keys(pg.slot_incantesimo).length > 0;

    // Spell page content
    let spellPageHtml = '';
    if (hasSpellSlots) {
        const classi = pg.classi || [];
        const spellAbilities = [];
        classi.forEach(c => {
            const ab = CLASS_SPELL_ABILITY[c.nome];
            if (ab && !spellAbilities.find(s => s.ability === ab)) {
                const val = pg[ab] || 10;
                const m = Math.floor((val - 10) / 2);
                spellAbilities.push({ classe: c.nome, ability: ab, mod: m });
            }
        });
        const spellStatsHtml = spellAbilities.map(sa => {
            const atkBonus = sa.mod + bonusComp;
            const dc = 8 + bonusComp + sa.mod;
            return `<div class="scheda-box"><div class="scheda-box-val">${sa.mod >= 0 ? '+'+sa.mod : sa.mod}</div><div class="scheda-box-label">${sa.ability.substring(0,3).toUpperCase()}</div></div>
                    <div class="scheda-box"><div class="scheda-box-val">${atkBonus >= 0 ? '+'+atkBonus : atkBonus}</div><div class="scheda-box-label">Attacco</div></div>
                    <div class="scheda-box"><div class="scheda-box-val">${dc}</div><div class="scheda-box-label">CD</div></div>`;
        }).join('');

        const slots = pg.slot_incantesimo;
        const levels = Object.keys(slots).map(Number).sort((a, b) => a - b);
        const slotsHtml = levels.map(lvl => {
            const s = slots[lvl];
            const pips = [];
            for (let i = 0; i < s.max; i++) {
                pips.push(`<span class="scheda-slot-pip ${i < s.current ? 'filled' : ''}" data-lvl="${lvl}" data-idx="${i}"></span>`);
            }
            return `<div class="scheda-slot-row"><span class="scheda-slot-level">Lv ${lvl}</span><div class="scheda-slot-pips">${pips.join('')}</div><span class="scheda-slot-count" id="cSlotCount_${lvl}">${s.current}/${s.max}</span></div>`;
        }).join('');

        spellPageHtml = `
        <div id="combatSpellPage" style="display:none;">
            <div class="scheda-three-boxes" style="margin-bottom:10px;">${spellStatsHtml}</div>
            <div class="scheda-slots-table">${slotsHtml}</div>
        </div>`;
    }

    content.innerHTML = `
    <div class="combat-card-expanded">
        <div class="combat-sheet-header">
            <h3>${escapeHtml(pg.nome)}</h3>
            <span class="combat-sheet-sub">${escapeHtml(pg.razza || '')} · Lv ${pg.livello || 1}</span>
            <button class="combat-sheet-close" onclick="combatCloseSheet('${campagnaId}','${sessioneId}')">&times;</button>
        </div>
        ${hasSpellSlots ? `<div class="combat-sheet-tabs"><button class="combat-sheet-tab active" onclick="combatSheetTab(0)">Scheda</button><button class="combat-sheet-tab" onclick="combatSheetTab(1)">Incantesimi</button></div>` : ''}
        <div id="combatStatsPage">
            <div class="scheda-three-boxes">
                <div class="scheda-box"><div class="scheda-box-val">${pg.classe_armatura || 10}</div><div class="scheda-box-label">CA</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${pg.iniziativa != null ? pg.iniziativa : fMod(pg.destrezza)}</div><div class="scheda-box-label">Iniziativa</div></div>
                <div class="scheda-box"><div class="scheda-box-val">${pg.velocita || 9}</div><div class="scheda-box-label">Velocità</div></div>
            </div>
            <div class="combat-hp-bar">
                <div class="combat-hp-block" ${canEdit ? `onclick="schedaOpenHpCalc('${pg.id}','pv_attuali',${pvAttuali},${pg.punti_vita_max||10})"` : ''}>
                    <span class="combat-hp-val ${canEdit ? 'editable' : ''}">${pvAttuali}</span>/<span>${pg.punti_vita_max||10}</span>
                    <div class="scheda-hp-label">PV</div>
                </div>
                <div class="combat-hp-block" ${canEdit ? `onclick="schedaOpenHpCalc('${pg.id}','pv_temporanei',${pg.pv_temporanei||0},-1)"` : ''}>
                    <span class="combat-hp-val ${canEdit ? 'editable' : ''}">${pg.pv_temporanei||0}</span>
                    <div class="scheda-hp-label">PV Temp</div>
                </div>
            </div>
            <div class="combat-abilities-grid">
                ${SCHEDA_ABILITIES.map(a => {
                    const v = pg[a.key]||10;
                    const isSave = saves.includes(a.key);
                    const saveMod = Math.floor((v-10)/2) + (isSave ? bonusComp : 0);
                    const saveStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
                    return `<div class="combat-ability"><span class="combat-ability-label">${a.label}</span><span class="combat-ability-val">${v}</span><span class="combat-ability-mod">${fMod(v)}</span><span class="combat-ability-save-mini ${isSave?'prof':''}">TS ${saveStr}</span></div>`;
                }).join('')}
            </div>
            ${condBadges || pg.esaustione > 0 ? `<div class="combat-conditions">${condBadges} ${pg.esaustione > 0 ? `<span class="condition-badge-sm exhaustion">Esaustione ${pg.esaustione}</span>` : ''}</div>` : ''}
            ${canEdit ? `<button class="btn-secondary btn-small" style="margin-top:10px;" onclick="openConditionsModal('${pg.id}')">Condizioni</button>` : ''}
        </div>
        ${spellPageHtml}
    </div>`;

    // Wire slot pips if caster
    if (hasSpellSlots && canEdit) {
        content.querySelectorAll('.scheda-slot-pip').forEach(pip => {
            pip.addEventListener('click', () => {
                const lvl = parseInt(pip.dataset.lvl);
                const idx = parseInt(pip.dataset.idx);
                combatSlotToggle(pg.id, lvl, idx);
            });
        });
    }
}

window.combatSheetTab = function(tabIdx) {
    const statsPage = document.getElementById('combatStatsPage');
    const spellPage = document.getElementById('combatSpellPage');
    const tabs = document.querySelectorAll('.combat-sheet-tab');
    tabs.forEach((t, i) => t.classList.toggle('active', i === tabIdx));
    if (statsPage) statsPage.style.display = tabIdx === 0 ? '' : 'none';
    if (spellPage) spellPage.style.display = tabIdx === 1 ? '' : 'none';
}

function combatSlotToggle(pgId, level, index) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.from('personaggi').select('slot_incantesimo').eq('id', pgId).single().then(({ data: pg }) => {
        if (!pg || !pg.slot_incantesimo) return;
        const slot = pg.slot_incantesimo[level];
        if (!slot) return;
        slot.current = index < slot.current ? index : index + 1;
        const content = document.getElementById('combattimentoContent');
        if (content) {
            content.querySelectorAll(`.scheda-slot-pip[data-lvl="${level}"]`).forEach((p, i) => p.classList.toggle('filled', i < slot.current));
            const countEl = document.getElementById(`cSlotCount_${level}`);
            if (countEl) countEl.textContent = `${slot.current}/${slot.max}`;
        }
        supabase.from('personaggi').update({ slot_incantesimo: pg.slot_incantesimo, updated_at: new Date().toISOString() }).eq('id', pgId).then(() => {});
    });
}

async function renderCombatMonsterSheet(monsterId, isDM, campagnaId, sessioneId) {
    const content = document.getElementById('combattimentoContent');
    if (!content) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: m } = await supabase.from('mostri_combattimento').select('*').eq('id', monsterId).single();
    if (!m) { content.innerHTML = '<p>Mostro non trovato</p>'; return; }

    const fMod = (v) => { const mod = Math.floor(((v||10)-10)/2); return mod >= 0 ? `+${mod}` : `${mod}`; };
    const conditionsActive = ALL_CONDITIONS.filter(c => m[c.key]);
    const condBadges = conditionsActive.map(c => `<span class="condition-badge active">${c.label}</span>`).join('');

    const resistenzeHtml = (m.resistenze && m.resistenze.length > 0) ? m.resistenze.map(r => `<span class="scheda-tag">${escapeHtml(r)}</span>`).join('') : '';
    const immunitaHtml = (m.immunita && m.immunita.length > 0) ? m.immunita.map(r => `<span class="scheda-tag" style="background:rgba(239,68,68,0.15);color:#ef4444;">${escapeHtml(r)}</span>`).join('') : '';

    content.innerHTML = `
    <div class="combat-card-expanded">
        <div class="combat-sheet-header">
            <h3>${escapeHtml(m.nome)}</h3>
            <span class="combat-sheet-sub">${escapeHtml(m.tipologia||'')} · ${escapeHtml(m.taglia||'Media')} · GS ${m.grado_sfida||0}</span>
            <button class="combat-sheet-close" onclick="combatCloseSheet('${campagnaId}','${sessioneId}')">&times;</button>
        </div>
        <div class="scheda-four-boxes">
            <div class="scheda-box"><div class="scheda-box-val">${m.classe_armatura||10}</div><div class="scheda-box-label">CA</div></div>
            <div class="scheda-box"><div class="scheda-box-val">${fMod(m.destrezza)}</div><div class="scheda-box-label">Iniziativa</div></div>
            <div class="scheda-box"><div class="scheda-box-val">${m.velocita||9}</div><div class="scheda-box-label">Velocità</div></div>
            <div class="scheda-box"><div class="scheda-box-val">${m.grado_sfida||0}</div><div class="scheda-box-label">GS</div></div>
        </div>
        <div class="combat-hp-bar">
            <div class="combat-hp-block" ${isDM ? `onclick="monsterHpCalc('${m.id}','pv_attuali',${m.pv_attuali??m.punti_vita_max},${m.punti_vita_max||10},'${campagnaId}','${sessioneId}')"` : ''}>
                <span class="combat-hp-val ${isDM ? 'editable' : ''}">${m.pv_attuali??m.punti_vita_max}</span>/<span>${m.punti_vita_max||10}</span>
                <div class="scheda-hp-label">PV</div>
            </div>
        </div>
        <div class="combat-abilities-grid">
            ${SCHEDA_ABILITIES.map(a => `<div class="combat-ability"><span class="combat-ability-label">${a.label}</span><span class="combat-ability-val">${m[a.key]||10}</span><span class="combat-ability-mod">${fMod(m[a.key])}</span></div>`).join('')}
        </div>
        ${resistenzeHtml ? `<div class="combat-section-label">Resistenze</div><div class="scheda-tags">${resistenzeHtml}</div>` : ''}
        ${immunitaHtml ? `<div class="combat-section-label">Immunità</div><div class="scheda-tags">${immunitaHtml}</div>` : ''}
        ${condBadges || m.esaustione > 0 ? `<div class="combat-conditions">${condBadges} ${m.esaustione > 0 ? `<span class="condition-badge-sm exhaustion">Esaustione ${m.esaustione}</span>` : ''}</div>` : ''}
        ${isDM ? `
        <div class="combat-dm-actions">
            <button class="btn-secondary btn-small" onclick="openMonsterConditionsModal('${m.id}','${campagnaId}','${sessioneId}')">Condizioni</button>
            <button class="btn-danger btn-small" onclick="removeMonster('${m.id}','${campagnaId}','${sessioneId}')">Rimuovi</button>
        </div>` : ''}
    </div>`;
}

// Monster HP Calculator (reuses the same overlay UI)
window.monsterHpCalc = function(mId, field, currentVal, maxVal, campagnaId, sessioneId) {
    _hpCalcState = { pgId: mId, field, currentVal, maxVal, isMonster: true, campagnaId, sessioneId, inputBuffer: '0' };
    const label = 'Punti Vita Mostro';
    const maxDisplay = maxVal > 0 ? `<span class="hp-calc-max">/ ${maxVal}</span>` : '';
    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <button class="hp-calc-close" onclick="schedaCloseHpCalc()">&times;</button>
            <div class="hp-calc-title">${label}</div>
            <div class="hp-calc-hp-display"><span class="hp-calc-current" id="hpCalcCurrent">${currentVal}</span>${maxDisplay}</div>
            <div class="hp-calc-input-display" id="hpCalcAmountDisplay">0</div>
            <div class="hp-calc-numpad">
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('1')">1</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('2')">2</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('3')">3</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('4')">4</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('5')">5</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('6')">6</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('7')">7</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('8')">8</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('9')">9</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('C')">C</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('0')">0</button>
                <button class="hp-calc-numpad-btn" onclick="hpCalcNumpad('⌫')">⌫</button>
            </div>
            <div class="hp-calc-buttons">
                <button class="hp-calc-btn damage" onclick="monsterHpApply(-1)">− Danno</button>
                <button class="hp-calc-btn heal" onclick="monsterHpApply(1)">+ Cura</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
}

window.monsterHpApply = async function(direction) {
    if (!_hpCalcState) return;
    const amount = parseInt(_hpCalcState.inputBuffer) || 0;
    if (amount === 0) return;
    let newVal = _hpCalcState.currentVal + (amount * direction);
    if (newVal < 0) newVal = 0;
    if (_hpCalcState.maxVal > 0 && newVal > _hpCalcState.maxVal) newVal = _hpCalcState.maxVal;
    _hpCalcState.currentVal = newVal;
    _hpCalcState.inputBuffer = '0';
    const display = document.getElementById('hpCalcCurrent');
    if (display) display.textContent = newVal;
    const amountDisplay = document.getElementById('hpCalcAmountDisplay');
    if (amountDisplay) amountDisplay.textContent = '0';
    const supabase = getSupabaseClient();
    if (supabase) {
        await supabase.from('mostri_combattimento').update({ pv_attuali: newVal }).eq('id', _hpCalcState.pgId);
    }
}

window.removeMonster = async function(mId, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.from('mostri_combattimento').delete().eq('id', mId);
    _combatSelectedId = null;
    _combatSelectedType = null;
    await sendAppEventBroadcast({ table: 'combattimento', action: 'monster_removed', sessioneId, campagnaId });
    await renderCombattimentoContent(campagnaId, sessioneId);
}

// Combat toolbar placeholders
window.combatDiceRoll = function() {
    showNotification('Funzione dadi in arrivo!');
}

window.combatCalcOpen = function() {
    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal">
            <div class="hp-calc-title">Calcolatrice</div>
            <input type="text" class="hp-calc-input" id="combatCalcInput" value="" style="font-size:1.5rem;" readonly>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
                ${['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(b => 
                    `<button class="hp-calc-btn ${b==='='?'heal':''}" style="padding:12px;font-size:1.1rem;" onclick="combatCalcPress('${b}')">${b}</button>`
                ).join('')}
            </div>
            <div class="hp-calc-actions" style="margin-top:8px;">
                <button class="btn-secondary btn-small" onclick="combatCalcPress('C')">C</button>
                <button class="btn-secondary btn-small" onclick="schedaCloseHpCalc()">Chiudi</button>
            </div>
        </div>`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) schedaCloseHpCalc(); });
    document.body.appendChild(overlay);
}

window.combatCalcPress = function(key) {
    const input = document.getElementById('combatCalcInput');
    if (!input) return;
    if (key === 'C') { input.value = ''; }
    else if (key === '=') { try { input.value = eval(input.value); } catch (e) { input.value = 'Err'; } }
    else { input.value += key; }
}

// Monster conditions modal
window.openMonsterConditionsModal = async function(mId, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data: m } = await supabase.from('mostri_combattimento').select('*').eq('id', mId).single();
    if (!m) return;

    const existing = document.getElementById('hpCalcOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hpCalcOverlay';
    overlay.className = 'hp-calc-overlay';
    overlay.innerHTML = `
        <div class="hp-calc-modal" style="width:340px;max-height:80vh;overflow-y:auto;">
            <div class="hp-calc-title">Condizioni - ${escapeHtml(m.nome)}</div>
            <div class="pg-conditions-grid">
                ${ALL_CONDITIONS.map(c => `<label class="pg-condition-item"><input type="checkbox" id="mc_${c.key}" ${m[c.key] ? 'checked' : ''}> ${c.label}</label>`).join('')}
            </div>
            <div class="pg-exhaustion-row" style="margin-top:12px;">
                <label>Esaustione</label>
                <input type="number" id="mc_esaustione" value="${m.esaustione||0}" min="0" max="6" style="width:60px;">
            </div>
            <div class="hp-calc-actions" style="margin-top:12px;">
                <button class="btn-primary btn-small" onclick="saveMonsterConditions('${mId}','${campagnaId}','${sessioneId}')">Salva</button>
                <button class="btn-secondary btn-small" onclick="schedaCloseHpCalc()">Chiudi</button>
            </div>
        </div>`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) schedaCloseHpCalc(); });
    document.body.appendChild(overlay);
}

window.saveMonsterConditions = async function(mId, campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const updates = {};
    ALL_CONDITIONS.forEach(c => { updates[c.key] = document.getElementById(`mc_${c.key}`)?.checked || false; });
    updates.esaustione = parseInt(document.getElementById('mc_esaustione')?.value) || 0;
    await supabase.from('mostri_combattimento').update(updates).eq('id', mId);
    schedaCloseHpCalc();
    await renderCombatMonsterSheet(mId, true, campagnaId, sessioneId);
    await renderCombattimentoContent(campagnaId, sessioneId);
}

// Monster creation modal
window.openMonsterCreationModal = function(campagnaId, sessioneId) {
    let modal = document.getElementById('monsterModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'monsterModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content modal-content-lg" id="monsterModalContent"></div>`;
        modal.addEventListener('click', (e) => { if (e.target === modal) closeMonsterModal(); });
        document.body.appendChild(modal);
    }

    document.getElementById('monsterModalContent').innerHTML = `
        <button class="modal-close" onclick="closeMonsterModal()">&times;</button>
        <h2>Nuovo Mostro</h2>
        <div class="wizard-steps">
            <div class="wizard-step active" data-step="0"></div>
            <div class="wizard-step" data-step="1"></div>
            <div class="wizard-step" data-step="2"></div>
            <div class="wizard-step" data-step="3"></div>
            <div class="wizard-step" data-step="4"></div>
        </div>
        <form id="monsterForm" onsubmit="return false;">
            <div class="wizard-page active" id="mStep0">
                <div class="form-group">
                    <label for="mNome">Nome</label>
                    <input type="text" id="mNome" required placeholder="Nome del mostro">
                </div>
                <div class="form-group">
                    <label>Tipologia</label>
                    <button type="button" class="custom-select-trigger" id="mTipologia" data-value="${MONSTER_TYPES[0]}" onclick="openMonsterFieldSelect('mTipologia',MONSTER_TYPES,'Tipologia')">${MONSTER_TYPES[0]}</button>
                </div>
                <div class="form-row form-row-2">
                    <div class="form-group">
                        <label>Taglia</label>
                        <button type="button" class="custom-select-trigger" id="mTaglia" data-value="Media" onclick="openMonsterFieldSelect('mTaglia',MONSTER_SIZES,'Taglia')">Media</button>
                    </div>
                    <div class="form-group">
                        <label for="mGS">Grado Sfida</label>
                        <input type="text" id="mGS" value="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Allineamento</label>
                    <button type="button" class="custom-select-trigger" id="mAllineamento" data-value="${MONSTER_ALIGNMENTS[0]}" onclick="openMonsterFieldSelect('mAllineamento',MONSTER_ALIGNMENTS,'Allineamento')">${MONSTER_ALIGNMENTS[0]}</button>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeMonsterModal()">Annulla</button>
                    <button type="button" class="btn-primary" onclick="monsterWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="mStep1">
                <div class="form-section-label">Caratteristiche e Tiri Salvezza</div>
                <div class="wizard-page-scroll">
                    <div class="pg-abilities-grid">
                        ${SCHEDA_ABILITIES.map(a => `
                        <div class="pg-ability-block">
                            <label>${a.full}</label>
                            <div class="pg-ability-row">
                                <input type="number" id="m${a.key}" class="pg-ability-input" min="1" max="30" value="10">
                            </div>
                            <label class="pg-save-item"><input type="checkbox" id="mSave_${a.key}"> <span>TS</span></label>
                        </div>`).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="monsterWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="monsterWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="mStep2">
                <div class="form-section-label">Abilità</div>
                <div class="wizard-page-scroll">
                    <div class="pg-skills-list">${SCHEDA_SKILLS.map(sk => `
                        <label class="pg-skill-check-item"><input type="checkbox" id="mSkill_${sk.key}"> ${sk.label} <small>(${sk.ability.substring(0, 3).toUpperCase()})</small></label>`).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="monsterWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="monsterWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="mStep3">
                <div class="form-section-label">Statistiche</div>
                <div class="pg-stats-row-3">
                    <div class="form-group">
                        <label for="mCA">CA</label>
                        <input type="number" id="mCA" min="1" value="10">
                    </div>
                    <div class="form-group">
                        <label for="mInit">Iniziativa</label>
                        <input type="number" id="mInit" value="10">
                    </div>
                    <div class="form-group">
                        <label for="mVel">Velocità</label>
                        <input type="number" id="mVel" min="0" step="1.5" value="9">
                    </div>
                </div>
                <div class="form-group" style="margin-top: var(--spacing-sm);">
                    <label for="mPV">Punti Ferita Massimi</label>
                    <input type="number" id="mPV" min="1" value="10">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="monsterWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="monsterWizardNav(1)">Successivo</button>
                </div>
            </div>
            <div class="wizard-page" id="mStep4">
                <div class="form-section-label">Resistenze e Immunità</div>
                <div class="pg-res-header">
                    <span></span><span class="pg-res-col-label">Res</span><span class="pg-res-col-label">Imm</span>
                </div>
                <div class="wizard-page-scroll">
                    <div id="mResImmGrid" class="pg-res-grid"></div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="monsterWizardNav(-1)">Indietro</button>
                    <button type="button" class="btn-primary" onclick="saveMonster()">Crea</button>
                </div>
            </div>
        </form>`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modal.dataset.campagnaId = campagnaId;
    modal.dataset.sessioneId = sessioneId;
    window._monsterWizardStep = 0;
    window._monsterResistenze = [];
    window._monsterImmunita = [];
}

window.closeMonsterModal = function() {
    const modal = document.getElementById('monsterModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

window.openMonsterFieldSelect = function(fieldId, options, title) {
    openCustomSelect(
        options.map(o => ({ value: o, label: o })),
        (value) => {
            const btn = document.getElementById(fieldId);
            if (btn) { btn.dataset.value = value; btn.textContent = value; btn.classList.remove('placeholder'); }
        },
        title
    );
}

function monsterRenderResImmGrid() {
    const container = document.getElementById('mResImmGrid');
    if (!container) return;
    container.innerHTML = DAMAGE_TYPES.map(dt => {
        const isRes = (window._monsterResistenze || []).includes(dt.value);
        const isImm = (window._monsterImmunita || []).includes(dt.value);
        return `
        <div class="pg-res-row">
            <span class="pg-res-label">${dt.label}</span>
            <input type="checkbox" class="pg-res-cb" ${isRes ? 'checked' : ''} onchange="monsterToggleRes('${dt.value}', this.checked)" title="Resistenza">
            <input type="checkbox" class="pg-imm-cb" ${isImm ? 'checked' : ''} onchange="monsterToggleImm('${dt.value}', this.checked)" title="Immunità">
        </div>`;
    }).join('');
}

window.monsterToggleRes = function(val, checked) {
    if (!window._monsterResistenze) window._monsterResistenze = [];
    if (checked) { if (!window._monsterResistenze.includes(val)) window._monsterResistenze.push(val); }
    else { window._monsterResistenze = window._monsterResistenze.filter(r => r !== val); }
}

window.monsterToggleImm = function(val, checked) {
    if (!window._monsterImmunita) window._monsterImmunita = [];
    if (checked) { if (!window._monsterImmunita.includes(val)) window._monsterImmunita.push(val); }
    else { window._monsterImmunita = window._monsterImmunita.filter(r => r !== val); }
}


window.monsterWizardNav = function(dir) {
    if (dir > 0 && (window._monsterWizardStep || 0) === 0) {
        const nome = document.getElementById('mNome')?.value?.trim();
        if (!nome) { showNotification('Inserisci un nome per il mostro'); return; }
    }
    const totalSteps = 5;
    const maxStep = totalSteps - 1;
    window._monsterWizardStep = Math.max(0, Math.min(maxStep, (window._monsterWizardStep || 0) + dir));
    const step = window._monsterWizardStep;
    for (let i = 0; i <= maxStep; i++) {
        const page = document.getElementById(`mStep${i}`);
        if (page) page.classList.toggle('active', i === step);
    }
    if (step === 4) monsterRenderResImmGrid();
    const modal = document.getElementById('monsterModal');
    if (modal) {
        modal.querySelectorAll('.wizard-step').forEach((dot, i) => {
            dot.classList.toggle('active', i <= step);
        });
    }
}

window.saveMonster = async function() {
    const modal = document.getElementById('monsterModal');
    const campagnaId = modal?.dataset.campagnaId;
    const sessioneId = modal?.dataset.sessioneId;
    if (!campagnaId || !sessioneId) return;

    const nome = document.getElementById('mNome')?.value?.trim();
    if (!nome) { showNotification('Inserisci un nome per il mostro'); return; }

    const saves = SCHEDA_ABILITIES.filter(a => document.getElementById(`mSave_${a.key}`)?.checked).map(a => a.key);
    const skills = SCHEDA_SKILLS.filter(s => document.getElementById(`mSkill_${s.key}`)?.checked).map(s => s.key);
    const resistenze = window._monsterResistenze || [];
    const immunita = window._monsterImmunita || [];
    const pvMax = parseInt(document.getElementById('mPV')?.value) || 10;

    const monster = {
        sessione_id: sessioneId,
        campagna_id: campagnaId,
        nome,
        tipologia: document.getElementById('mTipologia')?.dataset?.value || 'Bestia',
        taglia: document.getElementById('mTaglia')?.dataset?.value || 'Media',
        allineamento: document.getElementById('mAllineamento')?.dataset?.value || 'Neutrale',
        grado_sfida: document.getElementById('mGS')?.value || '0',
        forza: parseInt(document.getElementById('mforza')?.value) || 10,
        destrezza: parseInt(document.getElementById('mdestrezza')?.value) || 10,
        costituzione: parseInt(document.getElementById('mcostituzione')?.value) || 10,
        intelligenza: parseInt(document.getElementById('mintelligenza')?.value) || 10,
        saggezza: parseInt(document.getElementById('msaggezza')?.value) || 10,
        carisma: parseInt(document.getElementById('mcarisma')?.value) || 10,
        punti_vita_max: pvMax,
        pv_attuali: pvMax,
        classe_armatura: parseInt(document.getElementById('mCA')?.value) || 10,
        velocita: parseFloat(document.getElementById('mVel')?.value) || 9,
        iniziativa: parseInt(document.getElementById('mInit')?.value) || 10,
        tiri_salvezza: saves,
        competenze_abilita: skills,
        resistenze,
        immunita
    };

    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('mostri_combattimento').insert(monster);
    if (error) { showNotification('Errore creazione mostro: ' + error.message); return; }

    closeMonsterModal();
    showNotification(`${nome} aggiunto al combattimento!`);
    await sendAppEventBroadcast({ table: 'combattimento', action: 'monster_added', sessioneId, campagnaId });
    await renderCombattimentoContent(campagnaId, sessioneId);
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
    window.currentRollModifier = 0;
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
 * Avvia Realtime subscription per le richieste tiro
 */
function startRollRequestsRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn || !AppState.currentUser) return;

    // Ferma subscription esistente se presente
    stopRollRequestsRealtime();

    // Ottieni l'ID utente dal database
    findUserByUid(AppState.currentUser.uid).then(async (userData) => {
        if (!userData) {
            console.warn('⚠️ UserData non trovato per Realtime roll requests');
            return;
        }

        const giocatoreId = userData.id;

        // Subscription per richieste tiro iniziativa
        const iniziativaChannel = supabase
            .channel(`roll-requests-iniziativa-${giocatoreId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'richieste_tiro_iniziativa',
                    filter: `giocatore_id=eq.${giocatoreId}`
                },
                async (payload) => {
                    console.log('🔔 [REALTIME] Nuova richiesta tiro iniziativa ricevuta:', payload.new);
                    if (payload.new.stato === 'pending' && !window.currentRollRequest) {
                        const request = {
                            id: payload.new.id,
                            tipo: 'iniziativa',
                            sessione_id: payload.new.sessione_id
                        };
                        console.log('✅ [REALTIME] Mostro modal per richiesta:', request);
                        showRollRequestModal(request);
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 [REALTIME] Stato subscription iniziativa:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [REALTIME] Subscription iniziativa attiva');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ [REALTIME] Errore subscription iniziativa');
                }
            });

        // Subscription per richieste tiro generico
        const genericoChannel = supabase
            .channel(`roll-requests-generico-${giocatoreId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'richieste_tiro_generico',
                    filter: `giocatore_id=eq.${giocatoreId}`
                },
                async (payload) => {
                    console.log('🔔 [REALTIME] Nuova richiesta tiro generico ricevuta:', payload.new);
                    if (payload.new.stato === 'pending' && !window.currentRollRequest) {
                        const request = {
                            id: payload.new.id,
                            tipo: 'generico',
                            sessione_id: payload.new.sessione_id,
                            richiesta_id: payload.new.richiesta_id
                        };
                        console.log('✅ [REALTIME] Mostro modal per richiesta:', request);
                        showRollRequestModal(request);
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 [REALTIME] Stato subscription generico:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [REALTIME] Subscription generico attiva');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ [REALTIME] Errore subscription generico');
                }
            });

        // Salva i canali per poterli rimuovere in seguito
        window.rollRequestsChannels = {
            iniziativa: iniziativaChannel,
            generico: genericoChannel
        };

        console.log('✅ Realtime subscriptions per roll requests avviate');
    }).catch(error => {
        console.error('❌ Errore nell\'avvio Realtime roll requests:', error);
    });
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

        if (errorDM || errorTutte) {
            console.error('❌ Errore nel caricamento campagne per sessioni:', errorDM || errorTutte);
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
 * Avvia Realtime subscription per le nuove sessioni
 */
function startSessionRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn || !AppState.currentUser) return;

    // Ferma subscription esistente se presente
    stopSessionRealtime();

    // Ottieni l'ID utente dal database e carica le campagne
    findUserByUid(AppState.currentUser.uid).then(async (userData) => {
        if (!userData) {
            console.warn('⚠️ UserData non trovato per Realtime sessioni');
            return;
        }

        // Carica tutte le campagne dove l'utente è DM o giocatore
        const { data: campagneDM } = await supabase
            .from('campagne')
            .select('id')
            .eq('id_dm', userData.id);

        const { data: tutteCampagne } = await supabase
            .from('campagne')
            .select('id, giocatori');

        let campagnePlayer = [];
        if (tutteCampagne) {
            campagnePlayer = tutteCampagne
                .filter(c => Array.isArray(c.giocatori) && c.giocatori.includes(userData.id))
                .map(c => ({ id: c.id }));
        }

        const campagnaIds = [
            ...(campagneDM || []).map(c => c.id),
            ...(campagnePlayer || []).map(c => c.id)
        ].filter((id, index, self) => self.indexOf(id) === index);

        if (campagnaIds.length === 0) return;

        // Subscription per nuove sessioni
        // Nota: Supabase Realtime non supporta filtri complessi con OR, quindi
        // ascoltiamo tutte le nuove sessioni e filtriamo lato client
        const sessionChannel = supabase
            .channel('new-sessions')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'sessioni'
                },
                async (payload) => {
                    console.log('🔔 Nuova sessione:', payload.new);
                    // Filtra lato client: verifica che la sessione appartenga a una delle campagne dell'utente
                    if (campagnaIds.includes(payload.new.campagna_id) && !payload.new.data_fine) {
                        // Carica i dettagli della campagna
                        const { data: campagna } = await supabase
                            .from('campagne')
                            .select('nome_campagna')
                            .eq('id', payload.new.campagna_id)
                            .single();

                        if (campagna) {
                            showInAppNotification({
                                title: 'Sessione Attiva',
                                message: `La campagna "${campagna.nome_campagna}" ha iniziato una nuova sessione`,
                                campagnaId: payload.new.campagna_id,
                                sessioneId: payload.new.id
                            });
                        }
                    }
                }
            )
            .subscribe();

        window.sessionChannel = sessionChannel;
        console.log('✅ Realtime subscription per sessioni avviata');
    }).catch(error => {
        console.error('❌ Errore nell\'avvio Realtime sessioni:', error);
    });
}

/**
 * Ferma Realtime subscription per le nuove sessioni
 */
function stopSessionRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (window.sessionChannel) {
        supabase.removeChannel(window.sessionChannel);
        window.sessionChannel = null;
    }
}

/**
 * Avvia Realtime subscription per la pagina combattimento
 */
function startCombattimentoRealtime(campagnaId, sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Ferma subscription esistente se presente
    stopCombattimentoRealtime();

    // Subscription per aggiornamenti ai tiri iniziativa
    const combattimentoChannel = supabase
        .channel(`combattimento-${sessioneId}`)
        .on(
            'broadcast',
            { event: 'iniziativa_update' },
            async (payload) => {
                console.log('🔔 [REALTIME] Broadcast iniziativa:', payload);
                const combattimentoPage = document.getElementById('combattimentoPage');
                if (combattimentoPage && combattimentoPage.classList.contains('active')) {
                    if (AppState.currentSessioneId === sessioneId && AppState.currentCampagnaId === campagnaId) {
                        await renderCombattimentoContent(campagnaId, sessioneId);
                    }
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: '*', // INSERT, UPDATE, DELETE
                schema: 'public',
                table: 'richieste_tiro_iniziativa',
                filter: `sessione_id=eq.${sessioneId}`
            },
            async (payload) => {
                console.log('🔔 [REALTIME] Aggiornamento tiro iniziativa:', payload);
                // Verifica che siamo ancora nella pagina combattimento
                const combattimentoPage = document.getElementById('combattimentoPage');
                if (combattimentoPage && combattimentoPage.classList.contains('active')) {
                    // Verifica che la sessione sia ancora quella corrente
                    if (AppState.currentSessioneId === sessioneId && AppState.currentCampagnaId === campagnaId) {
                        console.log('✅ [REALTIME] Ricarico contenuto combattimento');
                        // Ricarica il contenuto del combattimento
                        await renderCombattimentoContent(campagnaId, sessioneId);
                    }
                }
            }
        )
        .subscribe((status) => {
            console.log('📡 [REALTIME] Stato subscription combattimento:', status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ [REALTIME] Subscription combattimento attiva');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('❌ [REALTIME] Errore subscription combattimento');
            }
        });

    window.combattimentoChannel = combattimentoChannel;
    console.log('✅ Realtime subscription per combattimento avviata');
}

/**
 * Invia un broadcast per aggiornare il combattimento in tempo reale
 */
async function sendCombattimentoUpdateBroadcast(sessioneId) {
    const supabase = getSupabaseClient();
    if (!supabase || !sessioneId) return;

    // Se siamo già in combattimento, usa il canale esistente
    if (window.combattimentoChannel && AppState.currentSessioneId === sessioneId) {
        try {
            await window.combattimentoChannel.send({
                type: 'broadcast',
                event: 'iniziativa_update',
                payload: { sessioneId, ts: Date.now() }
            });
        } catch (error) {
            console.warn('⚠️ Errore invio broadcast combattimento:', error);
        }
        return;
    }

    // Altrimenti crea un canale temporaneo per il broadcast
    const tempChannel = supabase.channel(`combattimento-${sessioneId}`);
    tempChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            tempChannel.send({
                type: 'broadcast',
                event: 'iniziativa_update',
                payload: { sessioneId, ts: Date.now() }
            }).catch((error) => {
                console.warn('⚠️ Errore invio broadcast combattimento:', error);
            }).finally(() => {
                setTimeout(() => {
                    supabase.removeChannel(tempChannel);
                }, 300);
            });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            supabase.removeChannel(tempChannel);
        }
    });
}

/**
 * Ferma Realtime subscription per la pagina combattimento
 */
function stopCombattimentoRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (window.combattimentoChannel) {
        supabase.removeChannel(window.combattimentoChannel);
        window.combattimentoChannel = null;
    }
}

/**
 * Avvia Realtime subscription per aggiornare la pagina dettagli quando viene avviata una sessione
 */
function startCampagnaDetailsRealtime(campagnaId) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Ferma subscription esistente se presente
    stopCampagnaDetailsRealtime();

    // Verifica che siamo ancora nella pagina dettagli
    const dettagliPage = document.getElementById('dettagliPage');
    if (!dettagliPage || !dettagliPage.classList.contains('active')) {
        return;
    }

    // Verifica che la campagna sia ancora quella corrente
    if (AppState.currentCampagnaId !== campagnaId) {
        return;
    }

    // Subscription per nuove sessioni per questa campagna
    const campagnaDetailsChannel = supabase
        .channel(`campagna-details-${campagnaId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'sessioni',
                filter: `campagna_id=eq.${campagnaId}`
            },
            async (payload) => {
                console.log('🔔 [REALTIME] Nuova sessione avviata per campagna:', payload.new);
                // Verifica che la sessione non abbia data_fine (sia attiva)
                if (!payload.new.data_fine) {
                    // Verifica che siamo ancora nella pagina dettagli
                    const dettagliPage = document.getElementById('dettagliPage');
                    if (dettagliPage && dettagliPage.classList.contains('active')) {
                        // Verifica che la campagna sia ancora quella corrente
                        if (AppState.currentCampagnaId === campagnaId) {
                            console.log('✅ [REALTIME] Ricarico dettagli campagna per nuova sessione');
                            // Ricarica i dettagli della campagna per aggiornare il bottone
                            await loadCampagnaDetails(campagnaId);
                        }
                    }
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'sessioni',
                filter: `campagna_id=eq.${campagnaId}`
            },
            async (payload) => {
                console.log('🔔 [REALTIME] Sessione aggiornata per campagna:', payload.new);
                // Se la sessione è stata terminata (data_fine impostata), ricarica i dettagli
                if (payload.new.data_fine) {
                    // Verifica che siamo ancora nella pagina dettagli
                    const dettagliPage = document.getElementById('dettagliPage');
                    if (dettagliPage && dettagliPage.classList.contains('active')) {
                        // Verifica che la campagna sia ancora quella corrente
                        if (AppState.currentCampagnaId === campagnaId) {
                            console.log('✅ [REALTIME] Ricarico dettagli campagna per sessione terminata');
                            // Ricarica i dettagli della campagna per aggiornare il bottone
                            await loadCampagnaDetails(campagnaId);
                        }
                    }
                }
            }
        )
        .subscribe((status) => {
            console.log('📡 [REALTIME] Stato subscription dettagli campagna:', status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ [REALTIME] Subscription dettagli campagna attiva');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ [REALTIME] Errore subscription dettagli campagna');
            }
        });

    window.campagnaDetailsChannel = campagnaDetailsChannel;
    console.log('✅ Realtime subscription per dettagli campagna avviata');
}

/**
 * Ferma Realtime subscription per la pagina dettagli campagna
 */
function stopCampagnaDetailsRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (window.campagnaDetailsChannel) {
        supabase.removeChannel(window.campagnaDetailsChannel);
        window.campagnaDetailsChannel = null;
        console.log('✅ Realtime subscription per dettagli campagna fermata');
    }
}

/**
 * Avvia Realtime subscription globale per eventi app
 */
function startAppEventsRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase || !AppState.isLoggedIn) return;

    stopAppEventsRealtime();

    const channel = supabase
        .channel('app-events')
        .on(
            'broadcast',
            { event: 'app_change' },
            async (payload) => {
                const data = payload?.payload;
                if (!data) return;
                if (data.sourceUid && data.sourceUid === AppState.currentUser?.uid) {
                    return;
                }

                if (data.table === 'richieste_tiro_iniziativa' && data.action === 'insert') {
                    setTimeout(async () => {
                        const pending = await checkPendingRollRequests(AppState.currentUser?.uid);
                        if (pending && !window.currentRollRequest) {
                            showRollRequestModal(pending);
                            sendBrowserNotification('Tiro di Iniziativa', 'Il DM ti ha richiesto un tiro di iniziativa!');
                            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                        }
                    }, 500);
                }

                if (data.table === 'richieste_tiro_generico' && data.action === 'insert') {
                    const label = data.tiroLabel || 'Tiro Richiesto';
                    const tipoTiro = data.tipoTiro || null;
                    const targetTiro = data.targetTiro || null;
                    setTimeout(async () => {
                        const pending = await checkPendingRollRequests(AppState.currentUser?.uid);
                        if (pending && !window.currentRollRequest) {
                            pending.tiroLabel = label;
                            pending.tipoTiro = tipoTiro;
                            pending.targetTiro = targetTiro;
                            showRollRequestModal(pending);
                            sendBrowserNotification(label, `Il DM ha richiesto: ${label}`);
                            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                        }
                    }, 500);
                }

                if (data.table === 'richieste_tiro_iniziativa' && data.action === 'delete') {
                    closeRollRequestModal();
                    if (AppState.currentPage === 'combattimento' && data.campagnaId) {
                        showNotification('Il combattimento è terminato');
                        navigateToPage('sessione');
                        renderSessioneContent(data.campagnaId);
                    }
                }

                if (data.table === 'richieste_tiro_generico' && data.action === 'delete') {
                    closeRollRequestModal();
                }

                if (data.table === 'sessioni' && data.action === 'insert' && data.campagnaId) {
                    try {
                        const userData = await findUserByUid(AppState.currentUser?.uid);
                        if (userData) {
                            const { data: campagna } = await supabase
                                .from('campagne')
                                .select('nome_campagna, id_dm, giocatori')
                                .eq('id', data.campagnaId)
                                .single();

                            if (campagna && campagna.id_dm !== userData.id) {
                                const isPlayer = Array.isArray(campagna.giocatori) && campagna.giocatori.includes(userData.id);
                                if (isPlayer) {
                                    showInAppNotification({
                                        title: 'Sessione Avviata!',
                                        message: `La campagna "${campagna.nome_campagna}" ha iniziato una nuova sessione`,
                                        campagnaId: data.campagnaId,
                                        sessioneId: data.sessioneId
                                    });
                                    sendBrowserNotification(
                                        'Sessione Avviata',
                                        `La campagna "${campagna.nome_campagna}" ha iniziato una nuova sessione`
                                    );
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('Errore notifica sessione:', e);
                    }
                }

                if (data.table === 'sessioni' && data.action === 'update' && data.campagnaId) {
                    if (AppState.activeSessionCampagnaId === data.campagnaId) {
                        clearActiveSession();
                        if (AppState.currentPage === 'sessione') {
                            stopSessioneTimer();
                            showNotification('La sessione è terminata');
                            navigateToPage('dettagli');
                            loadCampagnaDetails(data.campagnaId);
                        }
                    }
                }

                const skipRefreshTables = [
                    'richieste_tiro_iniziativa',
                    'richieste_tiro_generico'
                ];
                const needsRefresh = !skipRefreshTables.includes(data.table);
                if (needsRefresh) {
                    scheduleAppEventsRefresh();
                }
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Realtime subscription globale app attiva');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('❌ Realtime subscription globale app in errore');
            }
        });

    appEventsChannel = channel;
    window.appEventsChannel = channel;
}

/**
 * Ferma Realtime subscription globale per eventi app
 */
function stopAppEventsRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (appEventsChannel) {
        supabase.removeChannel(appEventsChannel);
        appEventsChannel = null;
        window.appEventsChannel = null;
        console.log('✅ Realtime subscription globale app fermata');
    }

    if (appEventsRefreshTimeout) {
        clearTimeout(appEventsRefreshTimeout);
        appEventsRefreshTimeout = null;
    }
}

let _appRefreshRunning = false;
let _appRefreshQueued = false;

function scheduleAppEventsRefresh() {
    if (appEventsRefreshTimeout) {
        clearTimeout(appEventsRefreshTimeout);
    }
    if (_appRefreshRunning) {
        _appRefreshQueued = true;
        return;
    }
    appEventsRefreshTimeout = setTimeout(() => {
        refreshCurrentPageData();
    }, 800);
}

async function refreshCurrentPageData() {
    if (!AppState.isLoggedIn) return;
    if (_appRefreshRunning) { _appRefreshQueued = true; return; }
    _appRefreshRunning = true;
    _appRefreshQueued = false;

    if (_hpCalcState || (Date.now() - _hpCalcClosedAt < 2000)) { _appRefreshRunning = false; return; }

    const page = AppState.currentPage;
    try {
        if (page === 'campagne' && AppState.currentUser?.uid) {
            await loadCampagne(AppState.currentUser.uid, { silent: true });
        } else if (page === 'personaggi') {
            await loadPersonaggi({ silent: true });
        } else if (page === 'amici') {
            await loadAmici({ silent: true });
        } else if (page === 'dettagli' && AppState.currentCampagnaId) {
            await loadCampagnaDetails(AppState.currentCampagnaId, { silent: true });
        } else if (page === 'sessione' && AppState.currentCampagnaId) {
            if (window.currentTiroGenericoRichiestaId) {
                const sessione = await getSessioneAttiva(AppState.currentCampagnaId);
                if (sessione) {
                    await updateTiroGenericoTable(sessione.id, window.currentTiroGenericoRichiestaId);
                }
            } else {
                await renderSessioneContent(AppState.currentCampagnaId);
            }
        } else if (page === 'combattimento' && AppState.currentCampagnaId && AppState.currentSessioneId) {
            await renderCombattimentoContent(AppState.currentCampagnaId, AppState.currentSessioneId);
        } else if (page === 'scheda' && AppState.currentPersonaggioId) {
            await renderSchedaPersonaggio(AppState.currentPersonaggioId);
        }
    } catch (error) {
        console.warn('⚠️ Errore refresh pagina corrente:', error);
    } finally {
        _appRefreshRunning = false;
        if (_appRefreshQueued) {
            _appRefreshQueued = false;
            scheduleAppEventsRefresh();
        }
    }
}

/**
 * Invia un broadcast globale per notificare cambiamenti app
 */
async function sendAppEventBroadcast(change) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const payload = {
        ...change,
        sourceUid: AppState.currentUser?.uid || null,
        ts: Date.now()
    };

    if (appEventsChannel) {
        try {
            await appEventsChannel.send({
                type: 'broadcast',
                event: 'app_change',
                payload
            });
        } catch (error) {
            console.warn('⚠️ Errore broadcast app (channel):', error);
        }
        return;
    }

    const tempChannel = supabase.channel('app-events');
    tempChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            tempChannel.send({
                type: 'broadcast',
                event: 'app_change',
                payload
            }).catch((error) => {
                console.warn('⚠️ Errore broadcast app (temp):', error);
            }).finally(() => {
                setTimeout(() => {
                    supabase.removeChannel(tempChannel);
                }, 300);
            });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            supabase.removeChannel(tempChannel);
        }
    });
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

    if (campagnaId && sessioneId) {
        notification.onclick = async function(e) {
            if (e.target.closest('.in-app-notification-close')) return;
            closeInAppNotification(notificationId);
            const isDM = await isCurrentUserDM(campagnaId);
            if (isDM) {
                openSessionePage(campagnaId);
            } else {
                playerJoinSession(campagnaId);
            }
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
 * Browser Notification API - system-level notifications
 */
function sendBrowserNotification(title, body) {
    if (localStorage.getItem('notificheEnabled') !== 'true') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title,
                body,
                icon: 'images/icon d20.png'
            });
        } else {
            new Notification(title, {
                body,
                icon: 'images/icon d20.png',
                badge: 'images/icon d20.png',
                tag: 'companion-app-' + Date.now(),
                requireInteraction: true
            });
        }
    } catch (e) {
        console.warn('Errore invio notifica browser:', e);
    }
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showNotification('Il tuo browser non supporta le notifiche');
        return false;
    }

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
        showNotification('Notifiche bloccate. Abilitale dalle impostazioni del browser.');
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;

    try {
        const registration = await navigator.serviceWorker.register('sw.js');
        console.log('Service Worker registrato');

        if ('PushManager' in window && registration.pushManager) {
            const existingSub = await registration.pushManager.getSubscription();
            if (!existingSub) {
                await subscribeToPush(registration);
            }
        }

        return registration;
    } catch (e) {
        console.warn('Service Worker registration fallita:', e);
        return null;
    }
}

async function subscribeToPush(registration) {
    try {
        const vapidKey = localStorage.getItem('vapidPublicKey');
        if (!vapidKey) return null;

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });

        const supabase = getSupabaseClient();
        if (supabase && AppState.currentUser) {
            const userData = await findUserByUid(AppState.currentUser.uid);
            if (userData) {
                await supabase.from('push_subscriptions').upsert({
                    user_id: userData.id,
                    subscription: JSON.stringify(subscription),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            }
        }

        return subscription;
    } catch (e) {
        console.warn('Push subscription fallita:', e);
        return null;
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Ferma Realtime subscriptions per le richieste tiro
 */
function stopRollRequestsRealtime() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (window.rollRequestsChannels) {
        if (window.rollRequestsChannels.iniziativa) {
            supabase.removeChannel(window.rollRequestsChannels.iniziativa);
        }
        if (window.rollRequestsChannels.generico) {
            supabase.removeChannel(window.rollRequestsChannels.generico);
        }
        window.rollRequestsChannels = null;
    }
}

/**
 * Mostra il modal per la richiesta tiro
 */
function calcAbilityMod(score) {
    return Math.floor((score - 10) / 2);
}

function getCharacterModifier(pg, tipoTiro, targetTiro) {
    if (!pg || !tipoTiro || !targetTiro) return null;

    const ABILITY_MAP = {
        'forza': 'forza', 'destrezza': 'destrezza', 'costituzione': 'costituzione',
        'intelligenza': 'intelligenza', 'saggezza': 'saggezza', 'carisma': 'carisma'
    };

    const SKILL_ABILITY_MAP = {
        'acrobazia': 'destrezza', 'addestrare_animali': 'saggezza', 'arcano': 'intelligenza',
        'atletica': 'forza', 'furtivita': 'destrezza', 'indagare': 'intelligenza',
        'inganno': 'carisma', 'intimidire': 'carisma', 'intrattenere': 'carisma',
        'intuizione': 'saggezza', 'medicina': 'saggezza', 'natura': 'intelligenza',
        'percezione': 'saggezza', 'persuasione': 'carisma', 'rapidita_di_mano': 'destrezza',
        'religione': 'intelligenza', 'sopravvivenza': 'saggezza', 'storia': 'intelligenza'
    };

    const totalLevel = pg.livello || 1;
    const profBonus = Math.floor((totalLevel - 1) / 4) + 2;

    if (tipoTiro === 'caratteristica') {
        const abilityKey = ABILITY_MAP[targetTiro];
        if (!abilityKey || pg[abilityKey] == null) return null;
        return calcAbilityMod(pg[abilityKey]);
    }

    if (tipoTiro === 'salvezza') {
        const abilityKey = ABILITY_MAP[targetTiro];
        if (!abilityKey || pg[abilityKey] == null) return null;
        let mod = calcAbilityMod(pg[abilityKey]);
        const saves = pg.tiri_salvezza || [];
        if (saves.includes(abilityKey) || saves.includes(targetTiro)) {
            mod += profBonus;
        }
        return mod;
    }

    if (tipoTiro === 'abilita') {
        const abilityKey = SKILL_ABILITY_MAP[targetTiro];
        if (!abilityKey || pg[abilityKey] == null) return null;
        let mod = calcAbilityMod(pg[abilityKey]);
        const skills = pg.competenze_abilita || [];
        if (skills.includes(targetTiro)) {
            mod += profBonus;
        }
        return mod;
    }

    return null;
}

function formatMod(value) {
    if (value == null) return '?';
    return value >= 0 ? `+${value}` : `${value}`;
}

async function showRollRequestModal(request) {
    if (!elements.rollRequestModal) return;

    window.currentRollRequest = request;

    const isIniziativa = request.tipo === 'iniziativa';
    const tiroLabel = !isIniziativa && request.tiroLabel ? request.tiroLabel : null;
    const tipoTiro = request.tipoTiro || null;
    const targetTiro = request.targetTiro || null;

    let modValue = null;
    let modText = '';
    window.currentRollModifier = 0;

    try {
        const supabase = getSupabaseClient();
        const userData = await findUserByUid(AppState.currentUser?.uid);
        let campagnaId = AppState.currentCampagnaId;
        if (!campagnaId && request.sessione_id && supabase) {
            const { data: sess } = await supabase.from('sessioni').select('campagna_id').eq('id', request.sessione_id).single();
            if (sess) {
                campagnaId = sess.campagna_id;
                AppState.currentCampagnaId = campagnaId;
                sessionStorage.setItem('currentCampagnaId', campagnaId);
            }
        }
        if (supabase && userData && campagnaId) {
            const { data: pgData } = await supabase.rpc('get_personaggio_campagna', {
                p_campagna_id: campagnaId,
                p_user_id: userData.id
            });
            if (pgData && pgData.length > 0) {
                const pg = pgData[0];
                if (isIniziativa) {
                    modValue = pg.iniziativa != null ? pg.iniziativa : calcAbilityMod(pg.destrezza || 10);
                } else if (tipoTiro && targetTiro) {
                    modValue = getCharacterModifier(pg, tipoTiro, targetTiro);
                }
                if (modValue != null) window.currentRollModifier = modValue;
            }
        }
    } catch (e) {
        console.warn('Impossibile calcolare modificatore:', e);
    }
    modText = modValue != null ? ` (${formatMod(modValue)})` : '';

    if (elements.rollRequestTitle) {
        elements.rollRequestTitle.textContent = isIniziativa
            ? 'Tiro di Iniziativa'
            : (tiroLabel || 'Tiro Richiesto');
    }
    if (elements.rollRequestMessage) {
        const modStr = modValue != null ? formatMod(modValue) : '?';
        elements.rollRequestMessage.textContent = `d20 ${modStr}`;
    }
    if (elements.rollRequestLabel) {
        elements.rollRequestLabel.textContent = 'Risultato del tiro:';
    }
    if (elements.rollRequestInput) {
        elements.rollRequestInput.value = '';
        elements.rollRequestInput.min = '1';
        elements.rollRequestInput.max = '999';
    }
    const d20Text = document.getElementById('d20RollText');
    if (d20Text) {
        d20Text.textContent = '';
        d20Text.classList.remove('show', 'nat-crit');
    }
    const autoRollBtnEl = document.getElementById('autoRollBtn');
    if (autoRollBtnEl) autoRollBtnEl.disabled = false;
    if (elements.rollRequestInput) {
        delete elements.rollRequestInput.dataset.natRoll;
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
window.submitRollRequest = async function(requestId, tipo, valore, tiroNaturale) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    try {
        const tableName = tipo === 'iniziativa' 
            ? 'richieste_tiro_iniziativa' 
            : 'richieste_tiro_generico';

        const updateData = { 
            valore: valore,
            stato: 'completed',
            timestamp: new Date().toISOString()
        };
        if (tiroNaturale != null) updateData.tiro_naturale = tiroNaturale;

        const { error } = await supabase
            .from(tableName)
            .update(updateData)
            .eq('id', requestId);

        if (error) throw error;
        await sendAppEventBroadcast({ table: tableName, action: 'update', requestId });

        showNotification('Tiro inviato!');

        // Se è un tiro iniziativa, verifica se tutti hanno completato
        if (tipo === 'iniziativa') {
            const { data: richiesta } = await supabase
                .from('richieste_tiro_iniziativa')
                .select('sessione_id')
                .eq('id', requestId)
                .single();

            if (richiesta) {
                // Porta subito il giocatore alla pagina combattimento
                const { data: sessione } = await supabase
                    .from('sessioni')
                    .select('campagna_id')
                    .eq('id', richiesta.sessione_id)
                    .single();

                if (sessione?.campagna_id) {
                    await openCombattimentoPage(sessione.campagna_id, richiesta.sessione_id);
                }

                // Notifica subito il DM tramite broadcast realtime
                await sendCombattimentoUpdateBroadcast(richiesta.sessione_id);

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

        // Lista solo i giocatori (DM esonerato)
        const partecipanti = (campagna.giocatori || []).filter(Boolean);

        // Controlla se tutte le richieste sono completed
        const { data: richieste, error } = await supabase
            .from('richieste_tiro_iniziativa')
            .select('giocatore_id, stato')
            .eq('sessione_id', sessioneId);

        if (error) throw error;

        const completedGiocatori = new Set(
            (richieste || []).filter(r => r.stato === 'completed').map(r => r.giocatore_id)
        );

        // Se tutti i giocatori hanno completato, porta i giocatori alla pagina combattimento
        const allCompleted = partecipanti.length > 0 && partecipanti.every(id => completedGiocatori.has(id));

        if (allCompleted && partecipanti.length > 0) {
            // Se l'utente corrente è nella sessione, portalo al combattimento
            const userData = await findUserByUid(AppState.currentUser.uid);
            if (userData && partecipanti.includes(userData.id)) {
                // Usa openCombattimentoPage per impostare correttamente lo stato e avviare il polling
                await openCombattimentoPage(sessione.campagna_id, sessioneId);
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
        const { error: deleteError } = await supabase
            .from('richieste_tiro_iniziativa')
            .delete()
            .eq('sessione_id', sessioneId);
        if (deleteError) throw deleteError;
        await sendAppEventBroadcast({ table: 'richieste_tiro_iniziativa', action: 'delete', sessioneId });

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
        await sendAppEventBroadcast({ table: 'richieste_tiro_iniziativa', action: 'insert', sessioneId });

        showNotification('Richieste tiro iniziativa inviate!');
        
        // Apri pagina combattimento per il DM (imposta anche stato e realtime)
        await openCombattimentoPage(campagnaId, sessioneId);
    } catch (error) {
        console.error('❌ Errore nella richiesta tiro iniziativa:', error);
        showNotification('Errore nella richiesta tiro iniziativa: ' + (error.message || error));
    }
};

/**
 * Apre il dialog per scegliere il tipo di tiro generico
 */
const TIRO_CARATTERISTICHE = [
    { value: 'forza', label: 'Forza' },
    { value: 'destrezza', label: 'Destrezza' },
    { value: 'costituzione', label: 'Costituzione' },
    { value: 'intelligenza', label: 'Intelligenza' },
    { value: 'saggezza', label: 'Saggezza' },
    { value: 'carisma', label: 'Carisma' }
];

const TIRO_ABILITA = [
    { value: 'acrobazia', label: 'Acrobazia' },
    { value: 'addestrare_animali', label: 'Addestrare Animali' },
    { value: 'arcano', label: 'Arcano' },
    { value: 'atletica', label: 'Atletica' },
    { value: 'furtivita', label: 'Furtività' },
    { value: 'indagare', label: 'Indagare' },
    { value: 'inganno', label: 'Inganno' },
    { value: 'intimidire', label: 'Intimidire' },
    { value: 'intrattenere', label: 'Intrattenere' },
    { value: 'intuizione', label: 'Intuizione' },
    { value: 'medicina', label: 'Medicina' },
    { value: 'natura', label: 'Natura' },
    { value: 'percezione', label: 'Percezione' },
    { value: 'persuasione', label: 'Persuasione' },
    { value: 'rapidita_di_mano', label: 'Rapidità di Mano' },
    { value: 'religione', label: 'Religione' },
    { value: 'sopravvivenza', label: 'Sopravvivenza' },
    { value: 'storia', label: 'Storia' }
];

function updateTiroTargetOptions() {
    const tipo = document.getElementById('tipoTiroSelect')?.value;
    const targetSelect = document.getElementById('tiroTargetSelect');
    const targetLabel = document.getElementById('tiroTargetLabel');
    if (!targetSelect || !targetLabel) return;

    let options = [];
    if (tipo === 'salvezza' || tipo === 'caratteristica') {
        options = TIRO_CARATTERISTICHE;
        targetLabel.textContent = 'Caratteristica';
    } else {
        options = TIRO_ABILITA;
        targetLabel.textContent = 'Abilità';
    }
    targetSelect.innerHTML = options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
}

function getTiroLabel(tipo, target) {
    const allOptions = [...TIRO_CARATTERISTICHE, ...TIRO_ABILITA];
    const opt = allOptions.find(o => o.value === target);
    const targetName = opt ? opt.label : target;
    if (tipo === 'salvezza') return `Tiro salvezza su ${targetName}`;
    if (tipo === 'abilita') return `Tiro di ${targetName}`;
    return `Prova di ${targetName}`;
}

window.richiediTiroGenerico = async function(sessioneId, campagnaId) {
    const modal = document.getElementById('richiediTiroModal');
    if (!modal) return;

    window._pendingTiroSessioneId = sessioneId;
    window._pendingTiroCampagnaId = campagnaId;

    updateTiroTargetOptions();

    const playersList = document.getElementById('tiroPlayersList');
    if (playersList) {
        playersList.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">Caricamento...</p>';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const supabase = getSupabaseClient();
    if (!supabase || !playersList) return;

    try {
        const pgNamesMap = await getCharacterNamesMap(campagnaId);
        const { data: giocatoriData } = await supabase.rpc('get_giocatori_campagna', {
            campagna_id_param: campagnaId
        });

        if (!giocatoriData || giocatoriData.length === 0) {
            playersList.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">Nessun giocatore</p>';
            return;
        }

        playersList.innerHTML = giocatoriData.map(g => {
            const displayName = pgNamesMap[g.id] || g.nome_utente || 'Giocatore';
            return `
                <div class="tiro-player-item">
                    <input type="checkbox" id="tiroPlayer_${g.id}" value="${g.id}" checked>
                    <label for="tiroPlayer_${g.id}">${escapeHtml(displayName)}</label>
                </div>`;
        }).join('');
    } catch (e) {
        console.warn('Errore caricamento giocatori per tiro:', e);
        playersList.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">Errore caricamento</p>';
    }
}

function closeRichiediTiroModal() {
    const modal = document.getElementById('richiediTiroModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

async function executeRichiediTiro() {
    const sessioneId = window._pendingTiroSessioneId;
    const campagnaId = window._pendingTiroCampagnaId;
    const tipo = document.getElementById('tipoTiroSelect')?.value;
    const target = document.getElementById('tiroTargetSelect')?.value;
    if (!sessioneId || !campagnaId || !tipo || !target) return;

    const selectedCheckboxes = document.querySelectorAll('#tiroPlayersList input[type="checkbox"]:checked');
    const selectedPlayerIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    if (selectedPlayerIds.length === 0) {
        showNotification('Seleziona almeno un giocatore');
        return;
    }

    const tiroLabel = getTiroLabel(tipo, target);
    closeRichiediTiroModal();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const isDM = await isCurrentUserDM(campagnaId);
        if (!isDM) { showNotification('Solo il DM può richiedere tiri'); return; }

        const richiestaId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const richieste = selectedPlayerIds.map(giocatoreId => ({
            sessione_id: sessioneId,
            richiesta_id: richiestaId,
            giocatore_id: giocatoreId,
            stato: 'pending'
        }));

        const { error: insertError } = await supabase
            .from('richieste_tiro_generico')
            .insert(richieste);
        if (insertError) throw insertError;

        await sendAppEventBroadcast({
            table: 'richieste_tiro_generico',
            action: 'insert',
            sessioneId,
            tiroLabel,
            tipoTiro: tipo,
            targetTiro: target
        });
        showNotification(`${tiroLabel} richiesto!`);

        window.currentTiroGenericoRichiestaId = richiestaId;
        window.currentTiroGenericoLabel = tiroLabel;

        await updateTiroGenericoTable(sessioneId, richiestaId);
        startTiroGenericoPolling(sessioneId);
    } catch (error) {
        console.error('❌ Errore nella richiesta tiro generico:', error);
        showNotification('Errore: ' + (error.message || error));
    }
}

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
        const { data: tiri, error } = await supabase
            .from('richieste_tiro_generico')
            .select('*')
            .eq('sessione_id', sessioneId)
            .eq('richiesta_id', richiestaId)
            .order('valore', { ascending: false, nullsFirst: false });

        if (error) throw error;

        if (!tiri || tiri.length === 0) {
            tableElement.style.display = 'none';
            return;
        }

        const pgNamesMap = await getCharacterNamesMap(AppState.currentCampagnaId);
        
        const giocatoreIds = [...new Set(tiri.map(t => t.giocatore_id).filter(Boolean))];
        let utentiMap = {};
        if (giocatoreIds.length > 0) {
            try {
                const { data: giocatoriData } = await supabase.rpc('get_giocatori_campagna', {
                    campagna_id_param: AppState.currentCampagnaId
                });
                if (giocatoriData) {
                    giocatoriData.forEach(g => { utentiMap[g.id] = g; });
                }
            } catch (e) {
                console.warn('Fallback nomi giocatori:', e);
            }
        }

        tableElement.style.display = 'block';
        const tiroLabel = window.currentTiroGenericoLabel || 'Tiri Richiesti';

        const tableHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
                <h3 style="margin: 0;">${escapeHtml(tiroLabel)}</h3>
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
                    ${tiri.map(tiro => {
                        const pgName = pgNamesMap[tiro.giocatore_id];
                        const utente = utentiMap[tiro.giocatore_id];
                        const nome = pgName || utente?.nome_utente || 'Giocatore';
                        const natRoll = tiro.tiro_naturale;
                        const isNatCrit = natRoll === 1 || natRoll === 20;
                        let risultatoHtml = '-';
                        if (tiro.valore !== null) {
                            if (isNatCrit) {
                                const modDiff = tiro.valore - natRoll;
                                const modStr = modDiff >= 0 ? `+${modDiff}` : `${modDiff}`;
                                risultatoHtml = `<span style="color:#e74c3c;font-weight:700;">${natRoll}</span><span style="font-size:0.8em;opacity:0.7;margin-left:2px;">${modStr}</span> = ${tiro.valore}`;
                            } else {
                                risultatoHtml = `${tiro.valore}`;
                            }
                        }
                        return `
                        <tr>
                            <td style="padding: var(--spacing-sm); border-bottom: 1px solid var(--border);">
                                ${escapeHtml(nome)}
                            </td>
                            <td style="text-align: right; padding: var(--spacing-sm); border-bottom: 1px solid var(--border);">
                                ${risultatoHtml}
                            </td>
                            <td style="text-align: center; padding: var(--spacing-sm); border-bottom: 1px solid var(--border);">
                                ${tiro.stato === 'completed' ? '✓' : '⏳'}
                            </td>
                        </tr>`;
                    }).join('')}
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
        await sendAppEventBroadcast({ table: 'richieste_tiro_generico', action: 'delete', sessioneId, richiestaId, campagnaId: AppState.currentCampagnaId });

        // Nascondi la tabella
        const tableElement = document.getElementById('tiroGenericoTable');
        if (tableElement) {
            tableElement.style.display = 'none';
        }

        if (window.currentTiroGenericoRichiestaId === richiestaId) {
            window.currentTiroGenericoRichiestaId = null;
            window.currentTiroGenericoLabel = null;
        }
        stopTiroGenericoPolling();

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

        const { error: deleteError } = await supabase
            .from('richieste_tiro_iniziativa')
            .delete()
            .eq('sessione_id', sessioneId);

        if (deleteError) throw deleteError;

        // Delete volatile monsters
        await supabase.from('mostri_combattimento').delete().eq('sessione_id', sessioneId);

        // Reset round/turn
        await supabase.from('sessioni').update({ combat_round: 1, combat_turn_index: 0 }).eq('id', sessioneId);

        await sendAppEventBroadcast({ table: 'richieste_tiro_iniziativa', action: 'delete', sessioneId, campagnaId });

        showNotification('Combattimento terminato');

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
        await sendAppEventBroadcast({ table: 'iniziativa', action: 'delete', sessioneId, iniziativaId });

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


