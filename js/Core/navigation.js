function clearActiveSession() {
    AppState.activeSessionCampagnaId = null;
    sessionStorage.removeItem('activeSessionCampagnaId');
    updateReturnToSessionBtn();
}

// Quando esiste una sessione attiva e l'utente non e' gia' nella pagina
// sessione/combattimento mostriamo un bottone fluttuante GLOBALE che
// riporta direttamente alla sessione (o al combattimento se in corso).
// In questo modo il pulsante e' sempre raggiungibile da qualunque
// pagina dell'app, anche da quelle senza un back button "rosso".
// Quando il bottone globale e' visibile, PRENDE IL POSTO del back-button
// della pagina (non si sovrappone): il back-button viene temporaneamente
// nascosto cosi' la posizione in basso a sinistra resta sempre la stessa.
function updateReturnToSessionBtn() {
    const isSessionPage = AppState.currentPage === 'sessione' || AppState.currentPage === 'combattimento';
    const shouldShow = !!AppState.activeSessionCampagnaId && !isSessionPage;
    const btn = document.getElementById('globalSessionReturnBtn');
    if (btn) {
        btn.style.display = shouldShow ? 'inline-flex' : 'none';
    }
    // Se il bottone globale e' visibile, nascondi il back-button della pagina
    // attiva: il bottone "torna alla sessione" prende il suo posto fisico
    // (stessa coordinata bottom/left). Quando torna nascosto, il back-button
    // ridiventa visibile.
    try {
        document.body.classList.toggle('global-return-active', !!shouldShow);
    } catch (_) {}
}

// Verifica se la sessione attiva ha attualmente un combattimento in corso
// (presenza di richieste tiro iniziativa per quella sessione).
async function _isCombatInProgress(sessioneId) {
    if (!sessioneId) return false;
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
        const { data } = await supabase
            .from('richieste_tiro_iniziativa')
            .select('id')
            .eq('sessione_id', sessioneId)
            .limit(1);
        return !!(data && data.length);
    } catch (_) {
        return false;
    }
}

async function _returnToActiveSessionOrCombat() {
    const campagnaId = AppState.activeSessionCampagnaId;
    if (!campagnaId) return false;
    const sessione = await getSessioneAttiva(campagnaId);
    if (!sessione) {
        clearActiveSession();
        showNotification('La sessione e\' terminata');
        return false;
    }
    const inCombat = await _isCombatInProgress(sessione.id);
    if (inCombat) {
        AppState.currentCampagnaId = campagnaId;
        AppState.currentSessioneId = sessione.id;
        sessionStorage.setItem('currentCampagnaId', campagnaId);
        sessionStorage.setItem('currentSessioneId', sessione.id);
        navigateToPage('combattimento');
    } else {
        if (typeof openSessionePage === 'function') {
            openSessionePage(campagnaId);
        }
    }
    return true;
}

// Click sul bottone globale "Sessione": redirect alla sessione/combat.
document.addEventListener('click', function(e) {
    const btn = e.target && e.target.closest && e.target.closest('#globalSessionReturnBtn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    _returnToActiveSessionOrCombat();
}, true);

function updateScrollStatsBtn() {
    const btn = document.getElementById('btnScrollStats');
    if (!btn) return;
    const show = AppState.currentPage === 'scheda';
    btn.style.display = show ? 'inline-flex' : 'none';
    if (show && typeof window.schedaScrollToStats === 'function') {
        btn.onclick = window.schedaScrollToStats;
    } else {
        btn.onclick = null;
    }
}

// Navigation
function navigateToPage(pageName, { pushHistory = true, skipPageLoad = false } = {}) {
    if (typeof captureActiveBookmark === 'function') {
        captureActiveBookmark({ silent: true });
    }

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
        if (pageName === 'campagne' || pageName === 'amici' || pageName === 'compendio' || pageName === 'personaggi' || pageName === 'laboratorio') {
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
        history.pushState(stateObj, '', legacyPathFromNavigationState(stateObj));
    }
    
    // Ferma Realtime subscription combattimento se si esce dalla pagina
    if (pageName !== 'combattimento') {
        stopCombattimentoRealtime();
    }
    
    // Ferma Realtime subscription dettagli campagna se si esce dalla pagina
    if (pageName !== 'dettagli') {
        stopCampagnaDetailsRealtime();
    }
    
    const desktopGroupTab = !skipPageLoad && typeof getDesktopDefaultGroupTab === 'function'
        ? getDesktopDefaultGroupTab(pageName)
        : '';

    const pageLoadPromise = skipPageLoad
        ? Promise.resolve()
        : _runPageLoad(pageName, desktopGroupTab);

    updateReturnToSessionBtn();
    updateScrollStatsBtn();
    if (typeof scheduleActiveBookmarkCapture === 'function') {
        scheduleActiveBookmarkCapture(220);
    }
    if (typeof updateBookmarkChrome === 'function') {
        setTimeout(updateBookmarkChrome, 0);
    }

    return pageLoadPromise;
}

function legacyPathFromNavigationState(state) {
    const page = state?.page || 'campagne';
    const campagnaId = encodeURIComponent(state?.campagnaId || '');
    const sessioneId = encodeURIComponent(state?.sessioneId || '');
    const personaggioId = encodeURIComponent(state?.personaggioId || '');
    const base = legacyAppBasePath();

    if (page === 'dettagli' && campagnaId) return `${base}campagne/${campagnaId}`;
    if (page === 'sessione' && campagnaId) return `${base}campagne/${campagnaId}/sessione`;
    if (page === 'combattimento' && campagnaId && sessioneId) return `${base}campagne/${campagnaId}/sessione/${sessioneId}/combattimento`;
    if (page === 'scheda' && personaggioId) return `${base}personaggi/${personaggioId}`;
    if (['campagne', 'personaggi', 'compendio', 'laboratorio', 'amici'].includes(page)) return `${base}${page}`;
    return `${base}campagne`;
}

function legacyAppBasePath() {
    const routeRoots = ['campagne', 'personaggi', 'compendio', 'laboratorio', 'amici'];
    const segments = location.pathname.split('/').filter(Boolean);
    const routeIndex = segments.findIndex(segment => routeRoots.includes(segment));
    if (routeIndex >= 0) {
        return `/${segments.slice(0, routeIndex).join('/')}${routeIndex ? '/' : ''}`;
    }
    return location.pathname.endsWith('/index.html')
        ? location.pathname.replace(/index\.html$/, '')
        : location.pathname.replace(/[^/]*$/, '');
}

function _pageRuntimeDataBundles(pageName) {
    if (pageName === 'personaggioCreate' || pageName === 'scheda') {
        const bundles = ['backgrounds', 'races', 'feats', 'fightingStyles', 'invocations', 'subclassSpells', 'classes', 'spells'];
        if (pageName === 'scheda') bundles.push('magicItems', 'poisons');
        return bundles;
    }
    if (pageName === 'laboratorio') return ['spells'];
    return [];
}

async function _ensurePageRuntimeData(pageName) {
    if (typeof window.ensureRuntimeData !== 'function') return;
    const bundles = _pageRuntimeDataBundles(pageName);
    if (!bundles.length) return;
    const results = await Promise.allSettled(bundles.map(key => window.ensureRuntimeData(key)));
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.warn(`[navigation] bundle dati non caricato (${bundles[index]}):`, result.reason);
        }
    });
}

async function _runPageLoad(pageName, desktopGroupTab = '') {
    try {
        await _ensurePageRuntimeData(pageName);
        if (pageName === 'amici' && AppState.isLoggedIn) {
            loadAmici();
        } else if (pageName === 'compendio') {
            if (typeof window.ensureRuntimeScript === 'function') {
                await window.ensureRuntimeScript('compendio');
            }
            if (typeof loadCompendio === 'function') loadCompendio();
            if (desktopGroupTab && typeof compendioOpenTab === 'function') {
                compendioOpenTab(desktopGroupTab);
            } else if (typeof compendioShowHub === 'function') {
                compendioShowHub();
            }
        } else if (pageName === 'campagne') {
            if (AppState.isLoggedIn && AppState.currentUser) {
                loadCampagne(AppState.currentUser.uid);
            }
        } else if (pageName === 'laboratorio' && AppState.isLoggedIn) {
            if (typeof window.ensureRuntimeScript === 'function') {
                await window.ensureRuntimeScript('laboratorio');
            }
            if (desktopGroupTab && typeof labOpenCategory === 'function') {
                labOpenCategory(desktopGroupTab);
            } else if (typeof labBackToHub === 'function') {
                labBackToHub();
            }
        } else if (pageName === 'personaggi' && AppState.isLoggedIn) {
            loadPersonaggi();
        } else if (pageName === 'personaggioCreate') {
            if (typeof pgEnsureWizardPageMount === 'function') pgEnsureWizardPageMount();
        } else if (pageName === 'dettagli' && AppState.currentCampagnaId) {
            loadCampagnaDetails(AppState.currentCampagnaId);
        } else if (pageName === 'combattimento' && AppState.currentCampagnaId && AppState.currentSessioneId) {
            if (typeof window.ensureRuntimeScript === 'function') {
                await window.ensureRuntimeScript('combattimento');
            }
            await renderCombattimentoContent(AppState.currentCampagnaId, AppState.currentSessioneId);
            if (!window.combattimentoChannel) {
                startCombattimentoRealtime(AppState.currentCampagnaId, AppState.currentSessioneId);
            }
        } else if (pageName === 'scheda' && AppState.currentPersonaggioId) {
            renderSchedaPersonaggio(AppState.currentPersonaggioId);
        }
    } catch (error) {
        console.warn('[navigation] preload pagina fallito:', error);
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
}

function closeUserModal() {
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
}

function openSettingsModal() {
    if (!elements.settingsModal) {
        console.error('❌ settingsModal non trovato');
        return;
    }
    
    elements.settingsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettingsModal() {
    if (!elements.settingsModal) return;
    elements.settingsModal.classList.remove('active');
    document.body.style.overflow = '';
}
