// ============================================
// CAMPAGNE - Variables
// ============================================

let campagneChannel = null;
let editingCampagnaId = null;

async function openCampagnaModal(campagnaId = null) {
    if (!AppState.isLoggedIn) {
        showNotification('Devi essere loggato per creare una campagna');
        openLoginModal();
        return;
    }
    editingCampagnaId = campagnaId;
    if (!elements.campagnaModal || !elements.campagnaForm) {
        console.error('❌ campagnaModal o campagnaForm non trovati');
        return;
    }
    elements.campagnaForm.reset();
    resetIconPreview();
    const modalTitle = document.querySelector('#campagnaModal h2');
    const saveBtn = document.getElementById('saveCampagnaBtn');
    if (campagnaId) {
        if (modalTitle) modalTitle.textContent = 'Modifica Campagna';
        if (saveBtn) saveBtn.textContent = 'Salva';
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
                    if (campagna.icona_name) selectPredefinedIcon(campagna.icona_name);
                }
            } catch (e) { console.warn('Impossibile pre-caricare dati campagna:', e); }
        }
    } else {
        if (modalTitle) modalTitle.textContent = 'Nuova Campagna';
        if (saveBtn) saveBtn.textContent = 'Crea';
    }
    elements.campagnaModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCampagnaModal() {
    if (!elements.campagnaModal) return;
    elements.campagnaModal.classList.remove('active');
    document.body.style.overflow = '';
    editingCampagnaId = null;
    if (elements.campagnaForm) elements.campagnaForm.reset();
    resetIconPreview();
}

function openIconSelectorModal() {
    if (elements.iconSelectorModal) {
        elements.iconSelectorModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeIconSelectorModal() {
    if (elements.iconSelectorModal) {
        elements.iconSelectorModal.classList.remove('active');
        document.body.style.overflow = '';
    }
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

const _dmCache = {};

// ============================================
// CAMPAGNE - List & Filters
// ============================================

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

// ============================================
// CAMPAGNE - CRUD & Details
// ============================================

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

// ============================================
// CAMPAGNE - Icon Selector
// ============================================

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
