// Firebase Auth - Compat version (no ES modules)
// Firebase is loaded via script tags, so it's available globally as 'firebase'
let auth = null;
let googleProvider = null;
let firebaseReady = false;

// Initialize Firebase (runs after firebase-config-compat.js loads)
function initFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase non disponibile. Assicurati che gli script siano caricati.');
            return false;
        }

        // Get auth and provider from global firebase object
        auth = firebase.auth();
        googleProvider = new firebase.auth.GoogleAuthProvider();
        googleProvider.setCustomParameters({
            prompt: 'select_account'
        });

        firebaseReady = true;
        console.log('✅ Firebase (Compat) inizializzato correttamente');
        console.log('Auth disponibile:', !!auth);
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
        if (typeof firebase !== 'undefined' && firebase.auth) {
            resolve(initFirebase());
        } else {
            // Wait a bit and retry
            let attempts = 0;
            const maxAttempts = 50; // 5 secondi totali (50 * 100ms)
            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof firebase !== 'undefined' && firebase.auth) {
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
        settingsModal: document.getElementById('settingsModal'),
        closeLoginModal: document.getElementById('closeLoginModal'),
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
        googleLoginBtn: document.getElementById('googleLoginBtn')
    };

    // Check if all required elements exist
    console.log('🔍 Verifica elementi DOM...');
    console.log('userBtn:', elements.userBtn);
    console.log('settingsBtn:', elements.settingsBtn);
    console.log('loginModal:', elements.loginModal);
    console.log('toolbarBtns:', elements.toolbarBtns?.length || 0);
    
    if (!elements.userBtn || !elements.settingsBtn || !elements.loginModal) {
        console.error('❌ Alcuni elementi DOM non sono stati trovati');
        console.error('Elementi mancanti:', {
            userBtn: !elements.userBtn,
            settingsBtn: !elements.settingsBtn,
            loginModal: !elements.loginModal
        });
        // Non return, continua comunque per vedere cosa funziona
    } else {
        console.log('✅ Tutti gli elementi DOM trovati');
    }

    // Setup event listeners immediately (don't wait for Firebase)
    setupEventListeners();
    navigateToPage('campagne');
    
    // Wait for Firebase to be ready (in background)
    try {
        console.log('⏳ Attesa caricamento Firebase...');
        await waitForFirebase();
        setupFirebaseAuth();
    } catch (error) {
        console.error('❌ Errore nell\'attesa Firebase:', error);
        // Continue anyway - app works without Firebase
    }
}

// Setup Firebase Auth listeners
function setupFirebaseAuth() {
    if (!auth || !firebase.auth) {
        console.warn('⚠️ Firebase Auth non disponibile. L\'app funzionerà senza autenticazione.');
        return;
    }

    try {
        // Listen for auth state changes (compat version)
        auth.onAuthStateChanged((user) => {
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
            if (!AppState.isLoggedIn) {
                openLoginModal();
            } else {
                // TODO: Open user menu/profile
                console.log('User menu (to be implemented)');
            }
        };
        // Also add event listener as backup
        elements.userBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('👤 Click su user button (addEventListener)');
            if (!AppState.isLoggedIn) {
                openLoginModal();
            } else {
                console.log('User menu (to be implemented)');
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
        elements.closeLoginModal.addEventListener('click', closeLoginModal);
    }
    if (elements.closeSettingsModal) {
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

    if (elements.settingsModal) {
        elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === elements.settingsModal) {
                closeSettingsModal();
            }
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
    } else {
        console.error('❌ googleLoginBtn non trovato');
    }
    
    console.log('✅ Setup event listeners completato');
    
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

function openSettingsModal() {
    elements.settingsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettingsModal() {
    elements.settingsModal.classList.remove('active');
    document.body.style.overflow = '';
}

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
    if (!firebaseReady || !auth || typeof firebase === 'undefined') {
        showError('Autenticazione non disponibile. Ricarica la pagina.');
        console.error('Auth non disponibile:', {
            firebaseReady,
            auth: !!auth,
            firebase: typeof firebase
        });
        return;
    }

    try {
        elements.submitBtn.disabled = true;
        const originalText = elements.submitBtn.textContent;
        elements.submitBtn.textContent = AppState.isRegisterMode ? 'Registrazione...' : 'Accesso...';

        console.log(AppState.isRegisterMode ? '📝 Registrazione utente...' : '🔐 Login utente...', email);

        if (AppState.isRegisterMode) {
            // Register new user (compat version)
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log('✅ Utente registrato con successo:', user.uid, user.email);
            showNotification('Registrazione completata! Benvenuto!');
        } else {
            // Sign in existing user (compat version)
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
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
    if (!auth || !googleProvider || typeof firebase === 'undefined') {
        showError('Autenticazione Google non disponibile. Controlla la configurazione Firebase.');
        return;
    }

    try {
        hideError();
        elements.googleLoginBtn.disabled = true;
        elements.googleLoginBtn.textContent = 'Accesso in corso...';
        
        // Compat version
        const result = await auth.signInWithPopup(googleProvider);
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
            await auth.signOut();
            closeSettingsModal();
            showNotification('Logout effettuato');
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
// With ES modules, scripts are deferred, so DOM should be ready
async function startApp() {
    try {
        console.log('🚀 Inizializzazione app...');
        console.log('Document readyState:', document.readyState);
        await init();
        console.log('✅ Inizializzazione completata');
    } catch (error) {
        console.error('❌ Errore durante l\'inizializzazione:', error);
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
    }, 200);
}

