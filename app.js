// Import Firebase Auth
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// State Management
const AppState = {
    currentUser: null,
    currentPage: 'campagne',
    isLoggedIn: false,
    isRegisterMode: false
};

// DOM Elements
const elements = {
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
    modalFooterText: document.getElementById('modalFooterText')
};

// Initialize App
function init() {
    setupFirebaseAuth();
    setupEventListeners();
    navigateToPage('campagne');
}

// Setup Firebase Auth listeners
function setupFirebaseAuth() {
    if (!auth) {
        console.error('Firebase Auth non inizializzato. Controlla firebase-config.js');
        return;
    }

    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            AppState.currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0]
            };
            AppState.isLoggedIn = true;
            updateUIForLoggedIn();
        } else {
            // User is signed out
            AppState.currentUser = null;
            AppState.isLoggedIn = false;
            updateUIForLoggedOut();
        }
    });
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
    // User button - opens login if not logged in, or user menu if logged in
    elements.userBtn.addEventListener('click', () => {
        if (!AppState.isLoggedIn) {
            openLoginModal();
        } else {
            // TODO: Open user menu/profile
            console.log('User menu (to be implemented)');
        }
    });

    // Settings button
    elements.settingsBtn.addEventListener('click', () => {
        openSettingsModal();
    });

    // Close modals
    elements.closeLoginModal.addEventListener('click', closeLoginModal);
    elements.closeSettingsModal.addEventListener('click', closeSettingsModal);

    // Close modal on background click
    elements.loginModal.addEventListener('click', (e) => {
        if (e.target === elements.loginModal) {
            closeLoginModal();
        }
    });

    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeSettingsModal();
        }
    });

    // Login form submission
    elements.loginForm.addEventListener('submit', handleLogin);

    // Logout button
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Toolbar navigation
    elements.toolbarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            navigateToPage(page);
        });
    });

    // Register/Login link toggle
    elements.registerLink?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleLoginRegisterMode(true);
    });

    elements.loginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleLoginRegisterMode(false);
    });
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
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showError('Inserisci email e password');
        return;
    }

    try {
        elements.submitBtn.disabled = true;
        elements.submitBtn.textContent = AppState.isRegisterMode ? 'Registrazione...' : 'Accesso...';

        if (AppState.isRegisterMode) {
            // Register new user
            await createUserWithEmailAndPassword(auth, email, password);
            showNotification('Registrazione completata! Benvenuto!');
        } else {
            // Sign in existing user
            await signInWithEmailAndPassword(auth, email, password);
            showNotification('Accesso effettuato!');
        }

        closeLoginModal();
    } catch (error) {
        console.error('Auth error:', error);
        let errorMessage = 'Si è verificato un errore';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Questa email è già registrata';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email non valida';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password troppo debole (minimo 6 caratteri)';
                break;
            case 'auth/user-not-found':
                errorMessage = 'Utente non trovato';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Password errata';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Troppi tentativi. Riprova più tardi';
                break;
            default:
                errorMessage = error.message || 'Errore durante l\'autenticazione';
        }
        
        showError(errorMessage);
    } finally {
        elements.submitBtn.disabled = false;
        elements.submitBtn.textContent = AppState.isRegisterMode ? 'Registrati' : 'Accedi';
    }
}

// Logout Handler
async function handleLogout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        try {
            await signOut(auth);
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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

