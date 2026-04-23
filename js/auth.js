// [BUILD-MARKER] Se vedi questa riga in console, hai la versione nuova del file.
console.log('[homebrew][build] auth.js BUILD 2026-04-23-F debug amici + integrazione hb scheda');

// Setup Supabase Auth listeners
function setupSupabaseAuth() {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
        console.warn('⚠️ Supabase non disponibile. L\'app funzionerà senza autenticazione.');
        return;
    }

    try {
        // Listen for auth state changes
        let _authInitDone = false;
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Auth state changed:', event, session?.user?.email || 'null');
            
            if (session?.user) {
                const alreadyLoggedSameUser = AppState.isLoggedIn && AppState.currentUser?.uid === session.user.id;
                const prevName = AppState.currentUser?.displayName;
                AppState.currentUser = {
                    uid: session.user.id,
                    email: session.user.email,
                    displayName: prevName || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Utente'
                };
                AppState.isLoggedIn = true;
                updateUIForLoggedIn();

                if (alreadyLoggedSameUser && _authInitDone && event === 'TOKEN_REFRESHED') return;
                _authInitDone = true;
                
                initializeUserDocument(session.user).then(() => {
                    loadRazzeBackground();
                    loadHomebrewSottoclassi();
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
                    } else if (AppState.currentCampagnaId && !['campagne','amici','personaggi','laboratorio','scheda'].includes(AppState.currentPage)) {
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

// ─────────────────────────────────────────────────────────────────────────
// Carica le sottoclassi homebrew visibili dall'utente corrente:
//  • le proprie (sempre visibili);
//  • quelle degli amici esplicitamente abilitati nelle impostazioni
//    (`utenti.homebrew_settings.amici_abilitati`), solo se l'opzione
//    master `enabled` è attiva.
// Risultato cache: AppState.cachedHomebrewSottoclassi
//   = [{ id, nome, parent_class_slug, parent_class_name,
//        sottoclasse_features, granted_spells, _author_uid,
//        _author_name, _is_own }]
// ─────────────────────────────────────────────────────────────────────────
async function loadHomebrewSottoclassi() {
    // Dedup: chiamate concorrenti restituiscono la stessa promise.
    if (AppState._homebrewSottoclassiLoadPromise) {
        return AppState._homebrewSottoclassiLoadPromise;
    }
    AppState._homebrewSottoclassiLoadPromise = (async () => {
        const supabase = getSupabaseClient();
        if (!supabase || !AppState.currentUser?.uid) {
            AppState.cachedHomebrewSottoclassi = [];
            return [];
        }
        const ownUid = AppState.currentUser.uid;
        try {
            // Impostazioni dell'utente (per leggere amici_abilitati / enabled).
            const userData = AppState.cachedUserData || (typeof findUserByUid === 'function'
                ? await findUserByUid(ownUid)
                : null);
            const settings = userData?.homebrew_settings || { enabled: undefined, amici_abilitati: [] };
            // Allineato all'UI: default ON quando enabled non è esplicitamente false.
            const masterEnabled = settings.enabled !== false;

            // Risolvi gli auth-uid degli amici abilitati (se feature attiva).
            let friendUids = [];
            let friendInfoByUid = {};
            try {
                console.log('[homebrew][debug] settings:', settings, 'masterEnabled:', masterEnabled);
            } catch (_) {}
            if (masterEnabled && Array.isArray(settings.amici_abilitati) && settings.amici_abilitati.length > 0) {
                try { console.log('[homebrew][debug] amici_abilitati IDs in settings:', settings.amici_abilitati); } catch (_) {}
                const { data: friendRows, error: friendErr } = await supabase
                    .from('utenti')
                    .select('id, uid, nome_utente')
                    .in('id', settings.amici_abilitati);
                if (friendErr) {
                    console.warn('[homebrew][debug] errore SELECT amici:', friendErr);
                }
                try { console.log('[homebrew][debug] friendRows risolti:', friendRows); } catch (_) {}
                (friendRows || []).forEach(f => {
                    if (f.uid) {
                        friendUids.push(f.uid);
                        friendInfoByUid[f.uid] = f;
                    } else {
                        console.warn('[homebrew][debug] amico senza uid (probabilmente row utenti senza colonna uid valorizzata):', f);
                    }
                });
            } else {
                try {
                    console.log('[homebrew][debug] skip risoluzione amici. master:', masterEnabled,
                        'amici_abilitati:', settings.amici_abilitati);
                } catch (_) {}
            }

            // Una sola SELECT con IN su [io, ...amiciAbilitati].
            const allUids = [ownUid, ...friendUids];

            // [DEBUG] Stato in ingresso.
            try {
                console.log('[homebrew][debug] ownUid:', ownUid);
                console.log('[homebrew][debug] friendUids:', friendUids);
                console.log('[homebrew][debug] allUids per IN:', allUids);
            } catch (_) {}

            const { data, error } = await supabase
                .from('homebrew_classi')
                .select('*')
                .in('user_id', allUids);

            if (error) {
                console.warn('[homebrew] errore SELECT sottoclassi:', error);
                AppState.cachedHomebrewSottoclassi = [];
                return [];
            }

            // [DEBUG] Cosa ha realmente risposto Supabase con il filtro IN.
            try {
                console.log('[homebrew][debug] righe restituite (con IN):', (data || []).length);
                (data || []).forEach((r, i) => {
                    console.log(`[homebrew][debug]  riga ${i}:`, {
                        id: r.id,
                        user_id: r.user_id,
                        nome: r.nome,
                        parent_class_slug: r.parent_class_slug,
                        match_own: r.user_id === ownUid,
                    });
                });
            } catch (_) {}

            // [DEBUG] CONTROLLO senza filtro: serve a capire se RLS sta bloccando.
            try {
                const ctrl = await supabase
                    .from('homebrew_classi')
                    .select('id,user_id,nome,parent_class_slug');
                if (ctrl.error) {
                    console.warn('[homebrew][debug] CONTROL SELECT (senza IN) errore:', ctrl.error);
                } else {
                    console.log('[homebrew][debug] CONTROL SELECT (senza IN) totale visibile:',
                        (ctrl.data || []).length);
                    (ctrl.data || []).forEach((r, i) => {
                        console.log(`[homebrew][debug]  ctrl ${i}:`, {
                            user_id: r.user_id,
                            nome: r.nome,
                            parent_class_slug: r.parent_class_slug,
                            match_own: r.user_id === ownUid,
                        });
                    });
                }
            } catch (eCtrl) {
                console.warn('[homebrew][debug] eccezione control SELECT:', eCtrl);
            }

            const ownName = userData?.nome_utente || 'Tuo';
            const isSubclassRow = (r) => !!(r && r.parent_class_slug);
            const list = (data || []).filter(isSubclassRow).map(r => {
                const isOwn = r.user_id === ownUid;
                return {
                    ...r,
                    _author_uid: r.user_id,
                    _author_name: isOwn ? ownName : (friendInfoByUid[r.user_id]?.nome_utente || 'Amico'),
                    _is_own: isOwn,
                };
            });

            AppState.cachedHomebrewSottoclassi = list;
            try {
                console.log('[homebrew] sottoclassi caricate:', {
                    totale: list.length,
                    proprie: list.filter(x => x._is_own).length,
                    amici: list.filter(x => !x._is_own).length,
                    items: list.map(r => `${r.parent_class_slug}:${r.nome} (${r._is_own ? 'tuo' : r._author_name})`)
                });
            } catch (_) {}
            // Hook: notifica i renderer dipendenti che la cache è cambiata.
            // Così il chip classe (con il bottone "Sottoclasse…") ridisegna
            // includendo anche le voci homebrew appena caricate, senza
            // bisogno di interazione utente.
            try {
                if (typeof window.pgRenderClassi === 'function') {
                    window.pgRenderClassi();
                }
                if (typeof window.microRenderClassi === 'function') {
                    window.microRenderClassi();
                }
                window.dispatchEvent(new CustomEvent('homebrew:sottoclassi-loaded', { detail: { count: list.length } }));
            } catch (e) {
                console.warn('[homebrew] errore re-render dopo load:', e);
            }
            return list;
        } catch (e) {
            console.warn('Errore caricamento sottoclassi homebrew:', e);
            AppState.cachedHomebrewSottoclassi = [];
            return [];
        }
    })().finally(() => {
        AppState._homebrewSottoclassiLoadPromise = null;
    });
    return AppState._homebrewSottoclassiLoadPromise;
}

window.loadHomebrewSottoclassi = loadHomebrewSottoclassi;

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
            } else if (AppState.currentCampagnaId && !['campagne','amici','personaggi','laboratorio','scheda'].includes(AppState.currentPage)) {
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
        elements.addCampagnaBtn.style.display = '';
    }
    if (elements.addAmicoBtn) {
        elements.addAmicoBtn.style.display = '';
    }
    if (elements.addHomebrewBtn) {
        elements.addHomebrewBtn.style.display = '';
    }
    if (elements.addPersonaggioBtn) {
        elements.addPersonaggioBtn.style.display = '';
    }
    // Aggiorna i placeholder per amici, laboratorio e personaggi (nessun dato ancora)
    updatePlaceholderMessages(true);
}

// Aggiorna i messaggi dei placeholder in base allo stato di login
function updatePlaceholderMessages(isLoggedIn) {
    const amiciPlaceholder = document.getElementById('amiciPlaceholder');
    const labPlaceholder = document.getElementById('laboratorioPlaceholder');
    const personaggiList = document.getElementById('personaggiList');
    
    if (isLoggedIn) {
        if (amiciPlaceholder) {
            amiciPlaceholder.innerHTML = '<p>Non hai amici. Tempo di unirsi a una gioiosa cooperazione!</p>';
        }
        if (labPlaceholder) {
            labPlaceholder.style.display = 'none';
        }
        if (personaggiList) {
            personaggiList.innerHTML = '<div class="content-placeholder"><p>Non ci sono personaggi. Crea il tuo (ennesimo) alter ego!</p></div>';
        }
    } else {
        if (amiciPlaceholder) {
            amiciPlaceholder.innerHTML = '<p>Accedi per vedere i tuoi amici</p>';
        }
        if (labPlaceholder) {
            labPlaceholder.style.display = 'block';
            labPlaceholder.innerHTML = '<p>Accedi per creare i tuoi contenuti homebrew</p>';
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
    if (elements.addHomebrewBtn) {
        elements.addHomebrewBtn.style.display = 'none';
    }
    if (elements.addPersonaggioBtn) {
        elements.addPersonaggioBtn.style.display = 'none';
    }
    // Show login message in campagne list
    renderCampagne([], false);
    // Aggiorna i placeholder per amici, laboratorio e personaggi
    updatePlaceholderMessages(false);
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
