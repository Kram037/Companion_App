// State Management
const AppState = {
    currentUser: null,
    currentPage: 'campagne',
    isLoggedIn: false
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
    mainContent: document.getElementById('mainContent')
};

// Initialize App
function init() {
    checkLoginStatus();
    setupEventListeners();
    navigateToPage('campagne');
}

// Check if user is logged in (from localStorage)
function checkLoginStatus() {
    const savedUser = localStorage.getItem('companionApp_user');
    if (savedUser) {
        AppState.currentUser = JSON.parse(savedUser);
        AppState.isLoggedIn = true;
        updateUIForLoggedIn();
    } else {
        AppState.isLoggedIn = false;
        updateUIForLoggedOut();
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

    // Register link (placeholder)
    document.getElementById('registerLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Registrazione (da implementare)');
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
}

function openSettingsModal() {
    elements.settingsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettingsModal() {
    elements.settingsModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Login Handler
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // TODO: Implementare chiamata API reale
    // Per ora simuliamo un login
    if (email && password) {
        // Simulazione login (in produzione qui ci sarebbe una chiamata API)
        const userData = {
            email: email,
            name: email.split('@')[0],
            loginTime: new Date().toISOString()
        };

        // Salva nello stato e localStorage
        AppState.currentUser = userData;
        AppState.isLoggedIn = true;
        localStorage.setItem('companionApp_user', JSON.stringify(userData));

        // Aggiorna UI
        updateUIForLoggedIn();
        closeLoginModal();

        // Mostra messaggio di benvenuto
        showNotification(`Benvenuto, ${userData.name}!`);
    } else {
        alert('Inserisci email e password');
    }
}

// Logout Handler
function handleLogout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        AppState.currentUser = null;
        AppState.isLoggedIn = false;
        localStorage.removeItem('companionApp_user');
        
        updateUIForLoggedOut();
        closeSettingsModal();
        showNotification('Logout effettuato');
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

