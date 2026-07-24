// ============================================
// CAMPAGNE - Variables
// ============================================

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
    { name: 'cross', svg: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>' },
    { name: 'logo_leggenda', imageSrc: 'images/Logo Leggenda.jpeg' }
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
    'cross': 'Croce',
    'logo_leggenda': 'Logo Leggenda'
};

function buildIconOptionHtml(icon) {
    if (icon.imageSrc) {
        return `<img class="icon-option-img" src="${encodeURI(icon.imageSrc)}" alt="" decoding="async" />`;
    }
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.svg}</svg>`;
}

function buildIconPreviewHtml(icon) {
    if (icon.imageSrc) {
        return `<img id="iconDisplay" class="icon-preview-img" src="${encodeURI(icon.imageSrc)}" alt="" decoding="async" />`;
    }
    return `<svg id="iconDisplay" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.svg}</svg>`;
}

const _dmCache = {};

function setupGiocatoriCampagnaDelegation() {
    const containers = [elements.gestisciGiocatoriContent, elements.invitaGiocatoriContent].filter(Boolean);

    containers.forEach(container => {
        if (container.dataset.giocatoriCampagnaDelegationReady === 'true') return;
        container.dataset.giocatoriCampagnaDelegationReady = 'true';
        container.addEventListener('click', handleGiocatoriCampagnaActionClick);
    });
}

function handleGiocatoriCampagnaActionClick(event) {
    const button = event.target.closest('[data-giocatori-action]');
    if (!button) return;

    event.preventDefault();
    const { giocatoriAction, campagnaId, giocatoreId, amicoId } = button.dataset;

    if (giocatoriAction === 'remove-player' && campagnaId && giocatoreId) {
        window.rimuoviGiocatoreDaCampagna(campagnaId, giocatoreId);
    } else if (giocatoriAction === 'invite-friend' && campagnaId && amicoId) {
        window.invitaAmicoAllaCampagna(campagnaId, amicoId);
    }
}

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

    } catch (error) {
        console.error('Errore nel salvataggio campagna:', error);
        showNotification('Errore nel salvataggio della campagna: ' + (error.message || error));
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
    const safeCampagnaId = safeAttr(campagnaId);

    setSafeHtml(elements.gestisciGiocatoriContent, '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento...</p></div>');

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            setSafeHtml(elements.gestisciGiocatoriContent, '<div class="content-placeholder"><p>Supabase non disponibile</p></div>');
            return;
        }

        // Usa direttamente la RPC che bypassa RLS
        const { data: utenti, error: utentiError } = await supabase
            .rpc('get_giocatori_campagna', { campagna_id_param: campagnaId });

        if (utentiError) {
            console.error('❌ Errore RPC get_giocatori_campagna:', utentiError);
            setSafeHtml(elements.gestisciGiocatoriContent, `<div class="content-placeholder"><p>Errore: ${escapeHtml(utentiError.message || 'Impossibile caricare i giocatori')}</p></div>`);
            return;
        }

        let giocatoriAttuali = [];
        if (utenti && utenti.length > 0) {
            giocatoriAttuali = utenti.map(utente => ({
                id: utente.id,
                nome_utente: utente.nome_utente,
                cid: utente.cid
            }));
        }

        if (giocatoriAttuali.length === 0) {
            setSafeHtml(elements.gestisciGiocatoriContent, `
                <div class="content-placeholder">
                    <p>Non ci sono giocatori. Invita amici nella tua campagna!</p>
                </div>
            `);
        } else {
            setSafeHtml(elements.gestisciGiocatoriContent, `
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
                            <button class="btn-icon-remove"
                                    data-giocatori-action="remove-player"
                                    data-campagna-id="${safeCampagnaId}"
                                    data-giocatore-id="${safeAttr(giocatore.id)}"
                                    aria-label="Rimuovi giocatore"
                                    title="Rimuovi dalla campagna">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `);
        }
    } catch (error) {
        console.error('❌ Errore nel caricamento giocatori:', error);
        setSafeHtml(elements.gestisciGiocatoriContent, '<p>Errore nel caricamento dei giocatori</p>');
    }
}

/**
 * Renderizza la tab "Invita Giocatori"
 */
async function renderInvitaGiocatoriTab(campagnaId) {
    if (!elements.invitaGiocatoriContent) return;
    const safeCampagnaId = safeAttr(campagnaId);

    setSafeHtml(elements.invitaGiocatoriContent, '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento...</p></div>');

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            setSafeHtml(elements.invitaGiocatoriContent, '<div class="content-placeholder"><p>Supabase non disponibile</p></div>');
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
            setSafeHtml(elements.invitaGiocatoriContent, `<div class="content-placeholder"><p>Errore: ${escapeHtml(amiciError.message || 'Impossibile caricare gli amici')}</p></div>`);
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
            .eq('campagna_id', campagnaId)
            .in('stato', ['pending', 'accepted']);

        const invitatiIds = new Set((invitiEsistenti || []).map(inv => inv.invitato_id));

        if (amiciDaInvitare.length === 0) {
            setSafeHtml(elements.invitaGiocatoriContent, `
                <div class="content-placeholder">
                    <p>Non hai amici da invitare. Aggiungi degli amici prima!</p>
                </div>
            `);
        } else {
            setSafeHtml(elements.invitaGiocatoriContent, `
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
                                        data-giocatori-action="invite-friend"
                                        data-campagna-id="${safeCampagnaId}"
                                        data-amico-id="${safeAttr(amico.id)}"
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
            `);
        }
    } catch (error) {
        console.error('❌ Errore nel caricamento amici per invito:', error);
        setSafeHtml(elements.invitaGiocatoriContent, '<p>Errore nel caricamento degli amici</p>');
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
        setSafeHtml(elements.dmPlayersList, '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Caricamento...</p></div>');
        elements.editDMModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const { data: giocatori, error } = await supabase
            .rpc('get_giocatori_campagna', { campagna_id_param: campagnaId });

        if (error) {
            console.error('❌ Errore RPC get_giocatori_campagna:', error);
            setSafeHtml(elements.dmPlayersList, `<div class="content-placeholder"><p>Errore: ${escapeHtml(error.message || 'Impossibile caricare i giocatori')}</p></div>`);
            return;
        }

        if (!giocatori || giocatori.length === 0) {
            setSafeHtml(elements.dmPlayersList, '<p>Non ci sono giocatori nella campagna per cambiare il DM</p>');
            return;
        }

        // Popola la lista con le card dei giocatori
        setSafeHtml(elements.dmPlayersList, giocatori.map(giocatore => `
            <div class="dm-player-card" data-giocatore-id="${safeAttr(giocatore.id)}" data-giocatore-nome="${safeAttr(giocatore.nome_utente)}">
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
        `).join(''));

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
            setSafeHtml(elements.dmPlayersList, '<p>Errore nel caricamento dei giocatori</p>');
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
        appDebug('🔄 selectNewDM: campagnaId =', campagnaId);
        appDebug('🔄 selectNewDM: giocatoreId =', giocatoreId, 'tipo:', typeof giocatoreId);
        appDebug('🔄 selectNewDM: giocatoreNome =', giocatoreNome);

        // Verifica che il giocatoreId esista prima di aggiornare
        const currentUser = await findUserByUid(AppState.currentUser.uid);
        appDebug('🔄 selectNewDM: currentUser.id =', currentUser?.id);

        // Aggiorna id_dm per trasferire i permessi
        // Usa la funzione RPC per bypassare RLS
        appDebug('🔄 selectNewDM: uso funzione RPC per aggiornare DM');
        const { error: rpcError } = await supabase.rpc('update_dm_campagna', {
            p_campagna_id: campagnaId,
            p_nuovo_dm_id: giocatoreId
        });

        if (rpcError) throw rpcError;
        appDebug('✅ selectNewDM: campagna aggiornata tramite RPC');

        await sendAppEventBroadcast({ table: 'campagne', action: 'update', campagnaId });
        delete _dmCache[campagnaId];

        // Per la verifica, usa una query normale
        const { data: campagnaVerifica, error: errorVerifica } = await supabase
            .from('campagne')
            .select('id_dm')
            .eq('id', campagnaId)
            .single();

        if (errorVerifica) {
            console.error('❌ selectNewDM: errore nella verifica:', errorVerifica);
        } else if (campagnaVerifica) {
            appDebug('✅ selectNewDM: verifica dopo update - id_dm =', campagnaVerifica.id_dm);
            appDebug('🔍 selectNewDM: confronto id_dm - atteso:', giocatoreId, 'trovato:', campagnaVerifica.id_dm, 'match:', campagnaVerifica.id_dm === giocatoreId);
        }

        // Chiudi il modal
        closeEditDMModal();

        showNotification(`DM cambiato a ${giocatoreNome}`);

        // Verifica che il DM sia stato cambiato correttamente
        const isNowDM = await isCurrentUserDM(campagnaId);
        appDebug('🔍 selectNewDM: verifica finale - isNowDM =', isNowDM);
        if (!isNowDM && giocatoreId === currentUser?.id) {
            console.warn('⚠️ selectNewDM: il DM non corrisponde dopo l\'update, potrebbe essere un problema di cache o RLS');
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
            .rpc('invia_invito_campagna', {
                p_campagna_id: campagnaId,
                p_inviante_id: currentUser.id,
                p_invitato_id: amicoId
            });

        if (error) {
            if (error.message && error.message.includes('già esistente')) {
                showNotification('Questo utente è già stato invitato a questa campagna');
            } else {
                throw error;
            }
        } else {
            await sendAppEventBroadcast({ table: 'inviti_campagna', action: 'insert', campagnaId, invitoId });
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
window.rimuoviGiocatoreDaCampagna = async function(campagnaId, giocatoreId) {
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
            .rpc('rimuovi_giocatore_campagna', {
                p_campagna_id: campagnaId,
                p_giocatore_id: giocatoreId
            });

        if (error) throw error;
        await sendAppEventBroadcast({ table: 'inviti_campagna', action: 'update', campagnaId, giocatoreId });
        await sendAppEventBroadcast({ table: 'campagne', action: 'update', campagnaId });

        showNotification('Giocatore rimosso dalla campagna');

        // Ricarica la tab "Gestisci Giocatori" se la dialog è aperta
        if (elements.invitaGiocatoriModal && elements.invitaGiocatoriModal.classList.contains('active')) {
            await renderGestisciGiocatoriTab(campagnaId);
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

        navigateToPage('campagne');
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
        setSafeHtml(iconOption, buildIconOptionHtml(icon));
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
    const iconPreview = document.getElementById('iconPreview');
    const iconaCampagna = document.getElementById('iconaCampagna');
    const iconNameDisplay = document.getElementById('iconNameDisplay');

    if (!iconPreview) return;

    const selectedIcon = predefinedIcons.find(i => i.name === selectedIconName);
    if (!selectedIcon) return;

    setSafeHtml(iconPreview, buildIconPreviewHtml(selectedIcon));
    if (iconNameDisplay) {
        const displayName = iconNameMap[selectedIconName] || selectedIcon.name.charAt(0).toUpperCase() + selectedIcon.name.slice(1);
        iconNameDisplay.textContent = displayName;
    }
    if (iconaCampagna) {
        iconaCampagna.value = selectedIconName;
    }
}

function resetIconPreview() {
    selectedIconName = 'dice';
    document.querySelectorAll('.icon-option').forEach((opt, index) => {
        opt.classList.toggle('selected', index === 0);
    });
    updateIconPreview();
}
