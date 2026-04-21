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
        langIt: document.getElementById('langIt'),
        langEn: document.getElementById('langEn'),
        campagneList: document.getElementById('campagneList'),
        addCampagnaBtn: document.getElementById('addCampagnaBtn'),
        addAmicoBtn: document.getElementById('addAmicoBtn'),
        addHomebrewBtn: document.getElementById('addHomebrewBtn'),
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
    if (elements.addHomebrewBtn) {
        elements.addHomebrewBtn.style.display = 'none';
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

    // Registra il Service Worker sempre (necessario per PWA install + future cache offline).
    // La sottoscrizione push avviene solo se le notifiche sono abilitate.
    if ('serviceWorker' in navigator) {
        if (localStorage.getItem('notificheEnabled') === 'true') {
            registerServiceWorker();
        } else {
            navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW registration:', e));
        }
    }

    setupPwaInstall();

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

    if (elements.langIt) {
        elements.langIt.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            setAppLang('it');
        };
    }
    if (elements.langEn) {
        elements.langEn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            setAppLang('en');
        };
    }
    if (typeof loadAppLang === 'function') loadAppLang();

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
    
    // Laboratorio init
    initLaboratorio();
    
    if (elements.addPersonaggioBtn) {
        elements.addPersonaggioBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openTipoSchedaModal();
        };
    }

    const closeTipoSchedaBtn = document.getElementById('closeTipoSchedaModal');
    if (closeTipoSchedaBtn) closeTipoSchedaBtn.addEventListener('click', closeTipoSchedaModal);
    const tipoSchedaModalEl = document.getElementById('tipoSchedaModal');
    if (tipoSchedaModalEl) tipoSchedaModalEl.addEventListener('click', (e) => { if (e.target === tipoSchedaModalEl) closeTipoSchedaModal(); });
    const tipoCompletaBtn = document.getElementById('tipoSchedaCompleta');
    if (tipoCompletaBtn) tipoCompletaBtn.addEventListener('click', () => { closeTipoSchedaModal(); openPersonaggioModal(); });
    const tipoMicroBtn = document.getElementById('tipoSchedaMicro');
    if (tipoMicroBtn) tipoMicroBtn.addEventListener('click', () => { closeTipoSchedaModal(); openMicroSchedaModal(); });

    // MicroScheda modal bindings
    const closeMicroBtn = document.getElementById('closeMicroSchedaModal');
    if (closeMicroBtn) closeMicroBtn.addEventListener('click', closeMicroSchedaModal);
    const cancelMicroBtn = document.getElementById('cancelMicroSchedaBtn');
    if (cancelMicroBtn) cancelMicroBtn.addEventListener('click', closeMicroSchedaModal);
    const microModal = document.getElementById('microSchedaModal');
    if (microModal) microModal.addEventListener('click', (e) => { if (e.target === microModal) closeMicroSchedaModal(); });
    const microForm = document.getElementById('microSchedaForm');
    if (microForm) {
        microForm.addEventListener('submit', handleSaveMicroScheda);
        microForm.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
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

/* ============================================
   PWA install (Add to Home Screen)
   ============================================ */
let __deferredInstallPrompt = null;

function _isPwaInstalled() {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.navigator.standalone === true) return true; // iOS Safari
    return false;
}

function _isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function _setPwaBtnState(state) {
    // state: 'installed' | 'available' | 'unavailable' | 'manual'
    const btn = document.getElementById('installPwaBtn');
    const label = document.getElementById('installPwaBtnLabel');
    if (!btn || !label) return;
    btn.classList.remove('pwa-installed');
    if (state === 'installed') {
        btn.disabled = true;
        btn.classList.add('pwa-installed');
        label.textContent = 'App installata';
        btn.title = 'Companion App e\u0300 gia\u0300 installata su questo dispositivo';
    } else if (state === 'available') {
        btn.disabled = false;
        label.textContent = 'Scarica app';
        btn.title = 'Installa Companion App sul tuo dispositivo';
    } else if (state === 'manual') {
        btn.disabled = false;
        label.textContent = 'Come installare';
        btn.title = 'Mostra le istruzioni per installare l\u0027app';
    } else {
        btn.disabled = true;
        label.textContent = 'Non disponibile';
        btn.title = 'Installazione non supportata da questo browser';
    }
}

function _showPwaInstructions() {
    const modal = document.getElementById('pwaInstructionsModal');
    const body = document.getElementById('pwaInstructionsBody');
    if (!modal || !body) return;
    if (_isIOS()) {
        body.innerHTML = `
            <p>Per installare <b>Companion App</b> su iPhone/iPad:</p>
            <ol style="padding-left:18px;margin:8px 0;">
                <li>Apri questa pagina in <b>Safari</b>.</li>
                <li>Tocca l'icona <b>Condividi</b> (quadrato con freccia in su) in basso.</li>
                <li>Scorri e seleziona <b>Aggiungi alla schermata Home</b>.</li>
                <li>Conferma con <b>Aggiungi</b>.</li>
            </ol>`;
    } else {
        body.innerHTML = `
            <p>Per installare <b>Companion App</b>:</p>
            <ol style="padding-left:18px;margin:8px 0;">
                <li>Apri il menu del browser (<b>⋮</b> in alto a destra).</li>
                <li>Seleziona <b>Installa app</b> oppure <b>Aggiungi alla schermata Home</b>.</li>
                <li>Conferma per installare.</li>
            </ol>
            <p style="font-size:0.85rem;color:var(--text-light);">Se non vedi l'opzione, il tuo browser potrebbe non supportare l'installazione PWA.</p>`;
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function _closePwaInstructions() {
    const modal = document.getElementById('pwaInstructionsModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function setupPwaInstall() {
    const btn = document.getElementById('installPwaBtn');
    const closeBtn = document.getElementById('closePwaInstructionsModal');
    const instrModal = document.getElementById('pwaInstructionsModal');
    if (!btn) return;

    if (_isPwaInstalled()) {
        _setPwaBtnState('installed');
    } else if (_isIOS()) {
        // iOS Safari non supporta beforeinstallprompt: mostra solo le istruzioni
        _setPwaBtnState('manual');
    } else {
        _setPwaBtnState('unavailable');
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        __deferredInstallPrompt = e;
        if (!_isPwaInstalled()) _setPwaBtnState('available');
    });

    window.addEventListener('appinstalled', () => {
        __deferredInstallPrompt = null;
        _setPwaBtnState('installed');
    });

    btn.addEventListener('click', async () => {
        if (btn.disabled) return;
        if (__deferredInstallPrompt) {
            try {
                __deferredInstallPrompt.prompt();
                const { outcome } = await __deferredInstallPrompt.userChoice;
                __deferredInstallPrompt = null;
                if (outcome === 'accepted') _setPwaBtnState('installed');
                else _setPwaBtnState('manual');
            } catch (err) {
                console.warn('PWA install prompt fallito:', err);
                _showPwaInstructions();
            }
        } else {
            _showPwaInstructions();
        }
    });

    if (closeBtn) closeBtn.onclick = _closePwaInstructions;
    if (instrModal) instrModal.addEventListener('click', (e) => {
        if (e.target === instrModal) _closePwaInstructions();
    });
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
