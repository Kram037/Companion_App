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
    currentCampagnaId: null
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
        closeIconSelectorModal: document.getElementById('closeIconSelectorModal')
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
                    // Carica i dati in base alla pagina corrente
                    if (AppState.currentPage === 'campagne') {
                        loadCampagne(session.user.id);
                    } else if (AppState.currentPage === 'amici') {
                        loadAmici();
                    }
                    // Altre pagine possono essere aggiunte qui in futuro
                });
            } else {
                // User is signed out
                AppState.currentUser = null;
                AppState.isLoggedIn = false;
                updateUIForLoggedOut();
                console.log('👤 Utente non autenticato');
                
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
            
            // Carica i dati in base alla pagina corrente
            if (AppState.currentPage === 'campagne') {
                loadCampagne(session.user.id);
            } else if (AppState.currentPage === 'amici') {
                loadAmici();
            }
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
            navigateToPage('campagne');
        };
        console.log('✅ Event listener aggiunto a backToCampagneBtn');
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

    // Icon selector setup
    setupIconSelector();
    
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

        // Carica le campagne
        const { data: campagne, error } = await supabase
            .from('campagne')
            .select('*')
            .eq('user_id', utente.id)
            .order('data_creazione', { ascending: false });

        if (error) throw error;

        console.log('✅ Campagne caricate:', campagne?.length || 0);
        renderCampagne(campagne || [], true);

        // Setup real-time subscription
        campagneChannel = supabase
            .channel('campagne-changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'campagne',
                    filter: `user_id=eq.${utente.id}`
                }, 
                async (payload) => {
                    console.log('🔄 Cambio rilevato nelle campagne:', payload);
                    // Ricarica le campagne
                    const { data: updatedCampagne, error: reloadError } = await supabase
                        .from('campagne')
                        .select('*')
                        .eq('user_id', utente.id)
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

function renderCampagne(campagne, isLoggedIn = true) {
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

    // If logged in but no campaigns
    if (campagne.length === 0) {
        elements.campagneList.innerHTML = `
            <div class="content-placeholder">
                <p>Non hai campagne. Crea o partecipa a una campagna!</p>
            </div>
        `;
        return;
    }

    elements.campagneList.innerHTML = campagne.map(campagna => {
        const dataCreazione = campagna.data_creazione ? 
            new Date(campagna.data_creazione).toLocaleDateString('it-IT') : 
            'N/A';
        const tempoGioco = campagna.tempo_di_gioco ? 
            formatTempoGioco(campagna.tempo_di_gioco) : 
            '0 min';
        const note = campagna.note && Array.isArray(campagna.note) && campagna.note.length > 0 ? 
            campagna.note.join(', ') : 
            'Nessuna nota';

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

        return `
            <div class="campagna-card" data-campagna-id="${campagna.id}" onclick="openCampagnaDetails('${campagna.id}')" style="cursor: pointer;">
                <div class="campagna-header">
                    <div class="campagna-title-with-icon">
                        <div class="campagna-icon">${iconaHTML}</div>
                        <h3>${escapeHtml(campagna.nome_campagna || 'Senza nome')}</h3>
                    </div>
                    <div class="campagna-actions" onclick="event.stopPropagation();">
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
                    </div>
                </div>
                <div class="campagna-info">
                    <div class="info-item">
                        <span class="info-label">DM:</span>
                        <span class="info-value">${escapeHtml(campagna.nome_dm || 'N/A')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Giocatori:</span>
                        <span class="info-value">${campagna.numero_giocatori || 0}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Sessioni:</span>
                        <span class="info-value">${campagna.numero_sessioni || 0}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Tempo di gioco:</span>
                        <span class="info-value">${tempoGioco}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Creata il:</span>
                        <span class="info-value">${dataCreazione}</span>
                    </div>
                </div>
                ${note !== 'Nessuna nota' ? `<div class="campagna-notes"><strong>Note:</strong> ${escapeHtml(note)}</div>` : ''}
            </div>
        `;
    }).join('');
}

function formatTempoGioco(minuti) {
    if (minuti < 60) {
        return `${minuti} min`;
    }
    const ore = Math.floor(minuti / 60);
    const min = minuti % 60;
    if (min === 0) {
        return `${ore}h`;
    }
    return `${ore}h ${min}min`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
                            <button class="btn-primary btn-small" onclick="acceptFriendRequest('${req.id}')">Accetta</button>
                            <button class="btn-secondary btn-small" onclick="rejectFriendRequest('${req.id}')">Rifiuta</button>
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
            amiciList.style.display = 'block';
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
        user_id: utente.id,
        icona_type: iconaType,
        icona_name: iconaName,
        icona_data: iconaData,
        nome_dm: utente.nome_utente || session.user.email?.split('@')[0] || 'N/A', // Imposta il DM al creatore
        numero_giocatori: 0,
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
    navigateToPage('dettagli');
};

window.deleteCampagna = async function(campagnaId) {
    if (!confirm('Sei sicuro di voler eliminare questa campagna?')) {
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
    if (confirm('Sei sicuro di voler uscire?')) {
        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                // Disconnetti da eventuali subscription
                if (campagneChannel) {
                    supabase.removeChannel(campagneChannel);
                    campagneChannel = null;
                }
                
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                
                closeUserModal();
                showNotification('Logout effettuato');
            } else {
                showNotification('Errore: autenticazione non disponibile');
            }
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('Errore durante il logout');
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


