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
        if (pageName === 'campagne' || pageName === 'amici' || pageName === 'personaggi' || pageName === 'laboratorio') {
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
    } else if (pageName === 'laboratorio' && AppState.isLoggedIn) {
        loadLabContent();
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
