// Firebase Auth - Compat version (no ES modules)
// Firebase is loaded via script tags, so it's available globally as 'firebase'
// auth and googleProvider are declared in firebase-config-compat.js
let firebaseReady = false;

// Initialize Firebase (runs after firebase-config-compat.js loads)
function initFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase non disponibile. Assicurati che gli script siano caricati.');
            return false;
        }

        // Check if auth and googleProvider are available from firebase-config-compat.js
        if (typeof auth === 'undefined' || typeof googleProvider === 'undefined') {
            console.warn('⚠️ auth o googleProvider non disponibili da firebase-config-compat.js');
            // Try to get them directly from firebase
            if (typeof window.auth === 'undefined') {
                window.auth = firebase.auth();
            }
            if (typeof window.googleProvider === 'undefined') {
                window.googleProvider = new firebase.auth.GoogleAuthProvider();
                window.googleProvider.setCustomParameters({
                    prompt: 'select_account'
                });
            }
        }

        firebaseReady = true;
        console.log('✅ Firebase (Compat) inizializzato correttamente');
        console.log('Auth disponibile:', !!(typeof auth !== 'undefined' ? auth : window.auth));
        return true;
    } catch (error) {
        console.error('❌ Errore nell\'inizializzazione Firebase:', error);
        firebaseReady = false;
        return false;
    }
}

// Wait for DOM and Firebase to be ready
function waitForFirebase() {
    return new Promise((resolve) => {
        if (typeof firebase !== 'undefined' && firebase.auth && (typeof auth !== 'undefined' || typeof window.auth !== 'undefined')) {
            resolve(initFirebase());
        } else {
            // Wait a bit and retry
            let attempts = 0;
            const maxAttempts = 50; // 5 secondi totali (50 * 100ms)
            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof firebase !== 'undefined' && firebase.auth && (typeof auth !== 'undefined' || typeof window.auth !== 'undefined')) {
                    clearInterval(checkInterval);
                    resolve(initFirebase());
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.warn('⏱️ Timeout attesa Firebase, continuo comunque...');
                    resolve(false);
                }
            }, 100);
        }
    });
}

console.log('📦 app.js caricato');

// State Management
const AppState = {
    currentUser: null,
    currentPage: 'campagne',
    isLoggedIn: false,
    isRegisterMode: false
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
        userName: document.getElementById('userName'),
        userEmail: document.getElementById('userEmail'),
        themeLight: document.getElementById('themeLight'),
        themeDark: document.getElementById('themeDark'),
        campagneList: document.getElementById('campagneList'),
        addCampagnaBtn: document.getElementById('addCampagnaBtn'),
        campagnaModal: document.getElementById('campagnaModal'),
        closeCampagnaModal: document.getElementById('closeCampagnaModal'),
        campagnaForm: document.getElementById('campagnaForm'),
        campagnaModalTitle: document.getElementById('campagnaModalTitle'),
        cancelCampagnaBtn: document.getElementById('cancelCampagnaBtn'),
        saveCampagnaBtn: document.getElementById('saveCampagnaBtn')
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
    
    // Setup event listeners immediately (don't wait for Firebase)
    console.log('🔧 Setup event listeners...');
    setupEventListeners();
    console.log('📄 Navigazione alla pagina iniziale...');
    navigateToPage('campagne');
    
    // Wait for Firebase to be ready (in background, non-blocking)
    waitForFirebase().then((success) => {
        if (success) {
            console.log('✅ Firebase pronto, setup auth...');
            setupFirebaseAuth();
            // Setup Firestore after auth is ready
            setupFirestore();
        } else {
            console.warn('⚠️ Firebase non disponibile, app continua senza autenticazione');
        }
    }).catch((error) => {
        console.error('❌ Errore nell\'attesa Firebase:', error);
        // Continue anyway - app works without Firebase
    });
}

// Setup Firebase Auth listeners
function setupFirebaseAuth() {
    // Get auth from global scope (from firebase-config-compat.js)
    const currentAuth = typeof auth !== 'undefined' ? auth : (typeof window.auth !== 'undefined' ? window.auth : null);
    
    if (!currentAuth || !firebase.auth) {
        console.warn('⚠️ Firebase Auth non disponibile. L\'app funzionerà senza autenticazione.');
        return;
    }

    try {
        // Listen for auth state changes (compat version)
        currentAuth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in
                AppState.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0]
                };
                AppState.isLoggedIn = true;
                updateUIForLoggedIn();
                console.log('✅ Utente autenticato:', user.email);
            } else {
                // User is signed out
                AppState.currentUser = null;
                AppState.isLoggedIn = false;
                updateUIForLoggedOut();
                console.log('👤 Utente non autenticato');
            }
        });
    } catch (error) {
        console.error('❌ Errore nel setup Firebase Auth:', error);
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
}

// Update UI when user is logged out
function updateUIForLoggedOut() {
    document.body.classList.remove('user-logged-in');
    // Show login message in campagne list
    renderCampagne([], false);
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
            console.log('➕ Click su Nuova Campagna');
            openCampagnaModal();
        };
        elements.addCampagnaBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('➕ Click su Nuova Campagna (addEventListener)');
            openCampagnaModal();
        });
        console.log('✅ Event listener aggiunto a addCampagnaBtn');
    } else {
        console.error('❌ addCampagnaBtn non trovato');
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
    
    // Icon preview update
    const iconaInput = document.getElementById('iconaCampagna');
    const iconPreview = document.getElementById('iconDisplay');
    if (iconaInput && iconPreview) {
        iconaInput.addEventListener('input', function(e) {
            const value = e.target.value.trim();
            iconPreview.textContent = value || '🎲';
        });
    } else {
        console.error('❌ googleLoginBtn non trovato');
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

function openUserModal() {
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

function setTheme(theme, save = true) {
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
        console.log('✅ Tema salvato:', theme);
    }
}

// Firestore - Campagne Management
let campagneUnsubscribe = null;
let editingCampagnaId = null;

function setupFirestore() {
    const currentAuth = typeof auth !== 'undefined' ? auth : (typeof window.auth !== 'undefined' ? window.auth : null);
    const currentFirestore = typeof firestore !== 'undefined' ? firestore : (typeof window.firestore !== 'undefined' ? window.firestore : null);
    
    if (!currentAuth || !currentFirestore) {
        console.warn('⚠️ Firestore non disponibile');
        return;
    }

    // Listen for auth state changes to load campagne
    currentAuth.onAuthStateChanged(async (user) => {
        console.log('🔄 Auth state changed:', user ? user.uid : 'null');
        if (user) {
            console.log('✅ Utente autenticato, carico campagne per:', user.uid);
            
            // Wait for auth token to be ready (especially important on desktop)
            try {
                // Force token refresh to ensure it's valid
                const token = await user.getIdToken(true);
                console.log('🔑 Token ottenuto, lunghezza:', token ? token.length : 0);
                
                // Additional delay for desktop to ensure everything is synced
                const isDesktop = window.innerWidth > 768;
                const delay = isDesktop ? 300 : 100;
                
                setTimeout(() => {
                    console.log('📚 Chiamata loadCampagne dopo delay di', delay, 'ms');
                    loadCampagne(user.uid);
                }, delay);
            } catch (error) {
                console.error('❌ Errore nel recupero token:', error);
                // Retry after a longer delay
                setTimeout(() => {
                    loadCampagne(user.uid);
                }, 500);
            }
        } else {
            console.log('👤 Utente non autenticato, mostro messaggio login');
            // Clear campagne when logged out
            if (campagneUnsubscribe) {
                campagneUnsubscribe();
                campagneUnsubscribe = null;
            }
            renderCampagne([], false); // false = utente non loggato
        }
    });
}

async function loadCampagne(userId) {
    const currentFirestore = typeof firestore !== 'undefined' ? firestore : (typeof window.firestore !== 'undefined' ? window.firestore : null);
    const currentAuth = typeof auth !== 'undefined' ? auth : (typeof window.auth !== 'undefined' ? window.auth : null);
    
    if (!currentFirestore) {
        console.error('❌ Firestore non disponibile');
        return;
    }

    if (!userId) {
        console.error('❌ userId non fornito');
        return;
    }

    // Verify user is authenticated
    if (!currentAuth) {
        console.error('❌ Auth non disponibile');
        return;
    }
    
    const currentUser = currentAuth.currentUser;
    if (!currentUser) {
        console.error('❌ Utente non autenticato al momento della query');
        console.log('userId richiesto:', userId);
        console.log('Stato auth:', currentAuth);
        // Try to get the user again
        await new Promise(resolve => setTimeout(resolve, 200));
        const retryUser = currentAuth.currentUser;
        if (!retryUser) {
            console.error('❌ Utente ancora non disponibile dopo retry');
            return;
        }
        console.log('✅ Utente recuperato dopo retry:', retryUser.uid);
    }
    
    const finalUser = currentAuth.currentUser;
    if (finalUser.uid !== userId) {
        console.error('❌ userId non corrisponde all\'utente autenticato');
        console.log('userId fornito:', userId);
        console.log('uid utente:', finalUser.uid);
        return;
    }
    
    // Verify token is valid
    try {
        const token = await finalUser.getIdToken();
        console.log('✅ Token valido verificato, lunghezza:', token ? token.length : 0);
    } catch (error) {
        console.error('❌ Errore nel recupero token:', error);
        // Try to refresh
        try {
            await finalUser.getIdToken(true);
            console.log('✅ Token aggiornato');
        } catch (refreshError) {
            console.error('❌ Errore nell\'aggiornamento token:', refreshError);
            return;
        }
    }
    
    console.log('✅ Utente autenticato verificato:', finalUser.uid);

    console.log('📚 Caricamento campagne per utente:', userId);
    
    // Unsubscribe from previous listener if exists
    if (campagneUnsubscribe) {
        campagneUnsubscribe();
    }

    // Listen to real-time updates
    // Note: We filter by userId in the query, but document ID is nome_campagna
    // Try query first, if it fails due to permissions, fallback to loading all and filtering client-side
    try {
        campagneUnsubscribe = currentFirestore
            .collection('Campagne')
            .where('userId', '==', userId)
            .onSnapshot(
                (snapshot) => {
                    const campagne = [];
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        // Double-check userId on client side for security
                        if (data.userId === userId) {
                            campagne.push({
                                id: doc.id,
                                ...data
                            });
                        }
                    });
                    console.log('✅ Campagne caricate:', campagne.length);
                    renderCampagne(campagne, true);
                },
                (error) => {
                    console.error('❌ Errore nel caricamento campagne:', error);
                    console.error('Codice errore:', error.code);
                    console.error('Messaggio errore:', error.message);
                    
                    if (error.code === 'permission-denied') {
                        console.warn('⚠️ Permission denied con query where, provo fallback');
                        console.warn('⚠️ Verifica che le regole Firestore permettano read a utenti autenticati');
                        // Fallback: try to load all campaigns and filter client-side
                        // This requires more permissive rules but works as a workaround
                        loadCampagneFallback(userId, currentFirestore);
                    } else {
                        console.error('❌ Errore diverso da permission-denied:', error);
                        showNotification('Errore nel caricamento delle campagne: ' + error.message);
                    }
                }
            );
    } catch (error) {
        console.error('❌ Errore nella creazione listener:', error);
        loadCampagneFallback(userId, currentFirestore);
    }
}

// Fallback method: load all campaigns and filter client-side
function loadCampagneFallback(userId, currentFirestore) {
    console.log('🔄 Fallback: carico tutte le campagne e filtro per userId:', userId);
    
    if (campagneUnsubscribe) {
        campagneUnsubscribe();
    }
    
    // Verify user is still authenticated
    const currentAuth = typeof auth !== 'undefined' ? auth : (typeof window.auth !== 'undefined' ? window.auth : null);
    if (!currentAuth || !currentAuth.currentUser) {
        console.error('❌ Utente non autenticato durante fallback');
        renderCampagne([], false);
        return;
    }
    
    console.log('✅ Utente autenticato, procedo con fallback');
    
    campagneUnsubscribe = currentFirestore
        .collection('Campagne')
        .onSnapshot(
            (snapshot) => {
                const campagne = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    // Filter by userId on client side
                    if (data.userId === userId) {
                        campagne.push({
                            id: doc.id,
                            ...data
                        });
                    }
                });
                console.log('✅ Campagne caricate (fallback):', campagne.length);
                renderCampagne(campagne, true);
            },
            (error) => {
                console.error('❌ Errore anche nel fallback:', error);
                console.error('Codice errore fallback:', error.code);
                console.error('Messaggio errore fallback:', error.message);
                
                if (error.code === 'permission-denied') {
                    console.error('❌ Le regole Firestore non permettono la lettura. Configura le regole come da FIREBASE_SETUP.md');
                    showNotification('Errore: configura le regole Firestore nella Firebase Console. Vedi FIREBASE_SETUP.md per le istruzioni.');
                } else {
                    showNotification('Errore nel caricamento delle campagne: ' + error.message);
                }
            }
        );
}

function renderCampagne(campagne, isLoggedIn = true) {
    if (!elements.campagneList) return;

    // If user is not logged in, show login message
    if (!isLoggedIn) {
        elements.campagneList.innerHTML = `
            <div class="content-placeholder">
                <p>Accedi per vedere le tue campagne</p>
            </div>
        `;
        return;
    }

    // If logged in but no campaigns
    if (campagne.length === 0) {
        elements.campagneList.innerHTML = `
            <div class="content-placeholder">
                <p>Nessuna campagna ancora. Clicca su "Nuova Campagna" per crearne una!</p>
            </div>
        `;
        return;
    }

    elements.campagneList.innerHTML = campagne.map(campagna => {
        const dataCreazione = campagna.data_creazione?.toDate ? 
            new Date(campagna.data_creazione.toDate()).toLocaleDateString('it-IT') : 
            'N/A';
        const tempoGioco = campagna.tempo_di_gioco ? 
            formatTempoGioco(campagna.tempo_di_gioco) : 
            '0 min';
        const note = campagna.note && campagna.note.length > 0 ? 
            campagna.note.join(', ') : 
            'Nessuna nota';

        return `
            <div class="campagna-card" data-campagna-id="${campagna.id}">
                <div class="campagna-header">
                    <h3>${escapeHtml(campagna.nome_campagna || 'Senza nome')}</h3>
                    <div class="campagna-actions">
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

function openCampagnaModal(campagnaId = null) {
    editingCampagnaId = campagnaId;
    
    if (!elements.campagnaModal || !elements.campagnaForm) {
        console.error('❌ campagnaModal o campagnaForm non trovati');
        return;
    }

    console.log('📝 Apertura modal campagna, editingCampagnaId:', editingCampagnaId);

    // Reset form
    elements.campagnaForm.reset();
    
    // Reset icon preview
    const iconPreview = document.getElementById('iconDisplay');
    if (iconPreview) {
        iconPreview.textContent = '🎲';
    }
    
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

function closeCampagnaModal() {
    if (!elements.campagnaModal) return;
    elements.campagnaModal.classList.remove('active');
    document.body.style.overflow = '';
    editingCampagnaId = null;
    if (elements.campagnaForm) {
        elements.campagnaForm.reset();
    }
}

async function handleCampagnaSubmit(e) {
    e.preventDefault();
    
    if (!AppState.isLoggedIn) {
        showNotification('Devi essere loggato per creare una campagna');
        return;
    }

    const currentAuth = typeof auth !== 'undefined' ? auth : (typeof window.auth !== 'undefined' ? window.auth : null);
    const currentFirestore = typeof firestore !== 'undefined' ? firestore : (typeof window.firestore !== 'undefined' ? window.firestore : null);
    
    if (!currentAuth || !currentFirestore) {
        showNotification('Errore: Firestore non disponibile');
        return;
    }

    const user = currentAuth.currentUser;
    if (!user) {
        showNotification('Errore: utente non autenticato');
        return;
    }

    const formData = {
        nome_campagna: document.getElementById('nomeCampagna').value.trim(),
        nome_dm: document.getElementById('nomeDM').value.trim(),
        numero_giocatori: parseInt(document.getElementById('numeroGiocatori').value) || 0,
        numero_sessioni: parseInt(document.getElementById('numeroSessioni').value) || 0,
        tempo_di_gioco: parseInt(document.getElementById('tempoDiGioco').value) || 0,
        note: document.getElementById('note').value.split('\n').filter(n => n.trim()).map(n => n.trim()),
        userId: user.uid
    };

    // Add data_creazione only for new campaigns
    if (!editingCampagnaId) {
        formData.data_creazione = firebase.firestore.FieldValue.serverTimestamp();
    }

    try {
        if (editingCampagnaId) {
            // Update existing campagna - keep same document ID
            await currentFirestore.collection('Campagne').doc(editingCampagnaId).update(formData);
            showNotification('Campagna aggiornata con successo!');
        } else {
            // Create new campagna - use nome_campagna as document ID (as specified)
            const docId = formData.nome_campagna;
            await currentFirestore.collection('Campagne').doc(docId).set(formData);
            showNotification('Campagna creata con successo!');
        }
        closeCampagnaModal();
    } catch (error) {
        console.error('Errore nel salvataggio campagna:', error);
        showNotification('Errore nel salvataggio della campagna: ' + error.message);
    }
}

// Global functions for inline onclick handlers
window.editCampagna = function(campagnaId) {
    openCampagnaModal(campagnaId);
};

window.deleteCampagna = async function(campagnaId) {
    if (!confirm('Sei sicuro di voler eliminare questa campagna?')) {
        return;
    }

    const currentFirestore = typeof firestore !== 'undefined' ? firestore : (typeof window.firestore !== 'undefined' ? window.firestore : null);
    
    if (!currentFirestore) {
        showNotification('Errore: Firestore non disponibile');
        return;
    }

    try {
        await currentFirestore.collection('Campagne').doc(campagnaId).delete();
        showNotification('Campagna eliminata con successo!');
    } catch (error) {
        console.error('Errore nell\'eliminazione campagna:', error);
        showNotification('Errore nell\'eliminazione della campagna: ' + error.message);
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
    } else {
        elements.loginModalTitle.textContent = 'Accedi';
        elements.submitBtn.textContent = 'Accedi';
        elements.registerLink.style.display = 'inline';
        elements.loginLink.style.display = 'none';
        elements.modalFooterText.textContent = 'Non hai un account? ';
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

    // Verifica che Firebase sia disponibile
    const currentAuth = typeof auth !== 'undefined' ? auth : (typeof window.auth !== 'undefined' ? window.auth : null);
    
    if (!firebaseReady || !currentAuth || typeof firebase === 'undefined') {
        showError('Autenticazione non disponibile. Ricarica la pagina.');
        console.error('Auth non disponibile:', {
            firebaseReady,
            auth: !!currentAuth,
            firebase: typeof firebase
        });
        return;
    }

    try {
        elements.submitBtn.disabled = true;
        const originalText = elements.submitBtn.textContent;
        elements.submitBtn.textContent = AppState.isRegisterMode ? 'Registrazione...' : 'Accesso...';

        console.log(AppState.isRegisterMode ? '📝 Registrazione utente...' : '🔐 Login utente...', email);

        const currentAuth = typeof auth !== 'undefined' ? auth : (typeof window.auth !== 'undefined' ? window.auth : null);
        
        if (AppState.isRegisterMode) {
            // Register new user (compat version)
            const userCredential = await currentAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log('✅ Utente registrato con successo:', user.uid, user.email);
            showNotification('Registrazione completata! Benvenuto!');
        } else {
            // Sign in existing user (compat version)
            const userCredential = await currentAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log('✅ Utente autenticato con successo:', user.uid, user.email);
            showNotification('Accesso effettuato!');
        }

        closeLoginModal();
    } catch (error) {
        console.error('❌ Auth error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        let errorMessage = 'Si è verificato un errore';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = AppState.isRegisterMode 
                    ? 'Questa email è già registrata. Usa "Accedi" per entrare.' 
                    : 'Email già in uso';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email non valida';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password troppo debole (minimo 6 caratteri)';
                break;
            case 'auth/user-not-found':
                errorMessage = 'Utente non trovato. Verifica l\'email o registrati.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Password errata';
                break;
            case 'auth/invalid-credential':
                errorMessage = 'Credenziali non valide. Verifica email e password.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Troppi tentativi. Riprova più tardi';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Errore di connessione. Verifica la tua connessione internet.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Operazione non consentita. Controlla le impostazioni Firebase.';
                break;
            default:
                errorMessage = error.message || 'Errore durante l\'autenticazione';
                console.error('Errore sconosciuto:', error);
        }
        
        showError(errorMessage);
    } finally {
        elements.submitBtn.disabled = false;
        elements.submitBtn.textContent = AppState.isRegisterMode ? 'Registrati' : 'Accedi';
    }
}

// Google Login Handler
async function handleGoogleLogin() {
    const currentAuth = typeof auth !== 'undefined' ? auth : (typeof window.auth !== 'undefined' ? window.auth : null);
    const currentGoogleProvider = typeof googleProvider !== 'undefined' ? googleProvider : (typeof window.googleProvider !== 'undefined' ? window.googleProvider : null);
    
    if (!currentAuth || !currentGoogleProvider || typeof firebase === 'undefined') {
        showError('Autenticazione Google non disponibile. Controlla la configurazione Firebase.');
        return;
    }

    try {
        hideError();
        elements.googleLoginBtn.disabled = true;
        elements.googleLoginBtn.textContent = 'Accesso in corso...';
        
        // Compat version
        const result = await currentAuth.signInWithPopup(currentGoogleProvider);
        const user = result.user;
        
        console.log('✅ Login Google completato:', user.email);
        showNotification(`Benvenuto, ${user.displayName || user.email}!`);
        closeLoginModal();
    } catch (error) {
        console.error('Google Auth error:', error);
        let errorMessage = 'Errore durante l\'accesso con Google';
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'Popup chiusa. Riprova.';
                break;
            case 'auth/cancelled-popup-request':
                errorMessage = 'Richiesta annullata. Riprova.';
                break;
            case 'auth/account-exists-with-different-credential':
                errorMessage = 'Esiste già un account con questa email. Usa email/password.';
                break;
            default:
                errorMessage = error.message || 'Errore durante l\'accesso con Google';
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

// Logout Handler
async function handleLogout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        try {
            const currentAuth = typeof auth !== 'undefined' ? auth : (typeof window.auth !== 'undefined' ? window.auth : null);
            if (currentAuth) {
                await currentAuth.signOut();
                closeUserModal(); // Close user modal instead of settings
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


