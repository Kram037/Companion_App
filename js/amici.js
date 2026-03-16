// ============================================================================
// AMICI MANAGEMENT (Network)
// ============================================================================

// Variabile per tenere traccia dell'utente cercato
let searchedUser = null;

/**
 * Apre il modal per aggiungere un amico
 */
function openAddAmicoModal() {
    if (!AppState.isLoggedIn) {
        showNotification('Devi essere loggato per aggiungere amici');
        openLoginModal();
        return;
    }
    
    if (!elements.addAmicoModal || !elements.addAmicoForm) {
        console.error('❌ addAmicoModal o addAmicoForm non trovati');
        return;
    }
    
    // Reset form e risultato ricerca
    elements.addAmicoForm.reset();
    const searchResult = document.getElementById('searchUserResult');
    if (searchResult) {
        searchResult.style.display = 'none';
    }
    searchedUser = null;
    
    elements.addAmicoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Chiude il modal per aggiungere un amico
 */
function closeAddAmicoModal() {
    if (!elements.addAmicoModal) return;
    elements.addAmicoModal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset
    if (elements.addAmicoForm) {
        elements.addAmicoForm.reset();
    }
    const searchResult = document.getElementById('searchUserResult');
    if (searchResult) {
        searchResult.style.display = 'none';
    }
    searchedUser = null;
}

/**
 * Cerca un utente per nome e CID
 */
async function handleCercaUtente(e) {
    e.preventDefault();
    
    const nome = document.getElementById('amicoNome').value.trim();
    const cid = parseInt(document.getElementById('amicoCID').value);
    
    if (!nome || !cid || cid < 1000 || cid > 9999) {
        showNotification('Inserisci un nome valido e un CID compreso tra 1000 e 9999');
        return;
    }
    
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }
    
    try {
        // Cerca l'utente per nome e CID usando una funzione SQL che bypassa RLS
        const { data, error } = await supabase
            .rpc('search_user_by_name_and_cid', {
                search_nome: nome,
                search_cid: cid
            })
            .maybeSingle();
        
        if (error) {
            console.error('❌ Errore nella ricerca utente:', error);
            throw error;
        }
        
        if (!data) {
            showNotification('Utente non trovato. Verifica nome e CID.');
            const searchResult = document.getElementById('searchUserResult');
            if (searchResult) {
                searchResult.style.display = 'none';
            }
            searchedUser = null;
            return;
        }
        
        // Verifica che non sia se stesso
        const currentUser = await findUserByUid(AppState.currentUser.uid);
        if (currentUser && currentUser.id === data.id) {
            showNotification('Non puoi inviare richieste di amicizia a te stesso!');
            const searchResult = document.getElementById('searchUserResult');
            if (searchResult) {
                searchResult.style.display = 'none';
            }
            searchedUser = null;
            return;
        }
        
        // Verifica se esiste già una richiesta (in entrambe le direzioni)
        // Query 1: richiesta da currentUser a data.id
        const { data: request1, error: error1 } = await supabase
            .from('richieste_amicizia')
            .select('*')
            .eq('richiedente_id', currentUser.id)
            .eq('destinatario_id', data.id)
            .maybeSingle();
        
        if (error1) throw error1;
        
        // Query 2: richiesta da data.id a currentUser
        const { data: request2, error: error2 } = await supabase
            .from('richieste_amicizia')
            .select('*')
            .eq('richiedente_id', data.id)
            .eq('destinatario_id', currentUser.id)
            .maybeSingle();
        
        if (error2) throw error2;
        
        const existingRequest = request1 || request2;
        
        searchedUser = data;
        const searchUserInfo = document.getElementById('searchUserInfo');
        const searchResult = document.getElementById('searchUserResult');
        
        if (searchUserInfo && searchResult) {
            let statusText = '';
            if (existingRequest) {
                if (existingRequest.stato === 'accepted') {
                    statusText = '<p style="color: var(--accent); margin-top: 0.5rem;">Già amico!</p>';
                } else if (existingRequest.stato === 'pending') {
                    if (existingRequest.richiedente_id === currentUser.id) {
                        statusText = '<p style="color: var(--text-secondary); margin-top: 0.5rem;">Richiesta già inviata</p>';
        } else {
                        statusText = '<p style="color: var(--text-secondary); margin-top: 0.5rem;">Hai già una richiesta da questo utente</p>';
                    }
                } else if (existingRequest.stato === 'rejected') {
                    statusText = '<p style="color: var(--text-secondary); margin-top: 0.5rem;">Richiesta precedentemente rifiutata</p>';
                }
            }
            
            const safeNomeUtente = escapeHtml(data.nome_utente || '');
            const safeCid = escapeHtml(String(data.cid ?? ''));
            searchUserInfo.innerHTML = `
                <p><strong>${safeNomeUtente}</strong> (CID: ${safeCid})</p>
                ${statusText}
            `;
            
            // Mostra/nascondi pulsante invita
            const invitaBtn = document.getElementById('invitaAmicoBtn');
            if (invitaBtn) {
                if (existingRequest && (existingRequest.stato === 'accepted' || existingRequest.stato === 'pending')) {
                    invitaBtn.style.display = 'none';
                } else {
                    invitaBtn.style.display = 'block';
                    invitaBtn.textContent = existingRequest && existingRequest.stato === 'rejected' ? 'Invia nuovamente' : 'Invia Richiesta';
                }
            }
            
            searchResult.style.display = 'block';
        }
    } catch (error) {
        console.error('❌ Errore nella ricerca utente:', error);
        showNotification('Errore nella ricerca utente. Riprova.');
    }
}

/**
 * Invia una richiesta di amicizia
 */
async function handleInvitaAmico(e) {
    e.preventDefault();
    
    if (!searchedUser) {
        showNotification('Cerca prima un utente');
        return;
    }
    
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
        
        // Invia la richiesta (usando upsert per gestire anche il caso di richiesta rifiutata precedentemente)
        const { data, error } = await supabase
            .from('richieste_amicizia')
            .upsert({
                richiedente_id: currentUser.id,
                destinatario_id: searchedUser.id,
                stato: 'pending'
            }, {
                onConflict: 'richiedente_id,destinatario_id'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        showNotification(`Richiesta di amicizia inviata a ${searchedUser.nome_utente}!`);
        closeAddAmicoModal();
        
        // Ricarica gli amici per mostrare eventuali aggiornamenti
        if (AppState.currentPage === 'amici') {
            loadAmici();
        }
    } catch (error) {
        console.error('❌ Errore nell\'invio richiesta amicizia:', error);
        if (error.code === '23505') {
            showNotification('Richiesta già esistente');
        } else {
            showNotification('Errore nell\'invio della richiesta. Riprova.');
        }
    }
}

/**
 * Accetta una richiesta di amicizia (esposta globalmente per onclick)
 */
window.acceptFriendRequest = async function(requestId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
            return;
        }
        
    try {
        const { error } = await supabase
            .from('richieste_amicizia')
            .update({ stato: 'accepted' })
            .eq('id', requestId);
        
        if (error) throw error;
        await sendAppEventBroadcast({ table: 'richieste_amicizia', action: 'update', requestId });
        
        showNotification('Richiesta di amicizia accettata!');
        loadAmici();
    } catch (error) {
        console.error('❌ Errore nell\'accettazione richiesta:', error);
        showNotification('Errore nell\'accettazione della richiesta. Riprova.');
    }
}

/**
 * Rifiuta una richiesta di amicizia (esposta globalmente per onclick)
 */
window.rejectFriendRequest = async function(requestId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('richieste_amicizia')
            .update({ stato: 'rejected' })
            .eq('id', requestId);
        
        if (error) throw error;
        await sendAppEventBroadcast({ table: 'richieste_amicizia', action: 'update', requestId });
        
        showNotification('Richiesta di amicizia rifiutata');
        loadAmici();
    } catch (error) {
        console.error('❌ Errore nel rifiuto richiesta:', error);
        showNotification('Errore nel rifiuto della richiesta. Riprova.');
    }
}

/**
 * Rimuove un amico dalla lista (esposta globalmente per onclick)
 */
window.rimuoviAmico = async function(amicoId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    const confirmed = await showConfirm('Sei sicuro di voler rimuovere questo amico?', 'Rimuovi Amico');
    if (!confirmed) {
        return;
    }

    try {
        const currentUser = await findUserByUid(AppState.currentUser.uid);
        if (!currentUser) {
            showNotification('Errore: utente corrente non trovato');
            return;
        }

        // Elimina la richiesta di amicizia accettata (in entrambe le direzioni possibili)
        const { error } = await supabase
            .from('richieste_amicizia')
            .delete()
            .eq('stato', 'accepted')
            .or(`and(richiedente_id.eq.${currentUser.id},destinatario_id.eq.${amicoId}),and(richiedente_id.eq.${amicoId},destinatario_id.eq.${currentUser.id})`);

        if (error) throw error;
        await sendAppEventBroadcast({ table: 'richieste_amicizia', action: 'delete', amicoId });

        showNotification('Amico rimosso');
        
        // Ricarica gli amici
        if (AppState.currentUser) {
            await loadAmici();
        }
    } catch (error) {
        console.error('❌ Errore nella rimozione amico:', error);
        showNotification('Errore nella rimozione dell\'amico');
    }
};

/**
 * Carica e visualizza gli amici e le richieste
 */
async function loadAmici(options = {}) {
    if (!AppState.isLoggedIn || !AppState.currentUser) return;
    const { silent = false } = options;
    
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    const amiciPlaceholder = document.getElementById('amiciPlaceholder');
    if (!silent && amiciPlaceholder) {
        amiciPlaceholder.style.display = 'block';
        amiciPlaceholder.innerHTML = '<div class="loading-spinner"></div><p>Caricamento amici...</p>';
    }
    
    try {
        const currentUser = await findUserByUid(AppState.currentUser.uid);
        if (!currentUser) {
            console.error('❌ Utente corrente non trovato');
            return;
        }
        
        console.log('🔍 Caricamento richieste amicizia per utente:', currentUser.id);
        
        // Usa le funzioni SQL per ottenere i dati (bypassano RLS)
        const [amiciResult, richiesteEntrataResult, richiesteUscitaResult] = await Promise.all([
            supabase.rpc('get_amici'),
            supabase.rpc('get_richieste_in_entrata'),
            supabase.rpc('get_richieste_in_uscita')
        ]);
        
        if (amiciResult.error) {
            console.error('❌ Errore nel caricamento amici:', amiciResult.error);
        }
        if (richiesteEntrataResult.error) {
            console.error('❌ Errore nel caricamento richieste in entrata:', richiesteEntrataResult.error);
        }
        if (richiesteUscitaResult.error) {
            console.error('❌ Errore nel caricamento richieste in uscita:', richiesteUscitaResult.error);
        }
        
        // Formatta i dati degli amici
        const amici = (amiciResult.data || []).map(row => ({
            id: row.amico_id,
            nome_utente: row.nome_utente,
            cid: row.cid
        }));
        
        // Formatta le richieste in entrata
        const richiesteInEntrata = (richiesteEntrataResult.data || []).map(row => ({
            id: row.richiesta_id,
            utente: {
                id: row.richiedente_id,
                nome_utente: row.nome_utente,
                cid: row.cid
            }
        }));
        
        // Formatta le richieste in uscita
        const richiesteInUscita = (richiesteUscitaResult.data || []).map(row => ({
            id: row.richiesta_id,
            utente: {
                id: row.destinatario_id,
                nome_utente: row.nome_utente,
                cid: row.cid
            }
        }));
        
        console.log('✅ Amici caricati:', amici.length, 'Richieste in entrata:', richiesteInEntrata.length, 'Richieste in uscita:', richiesteInUscita.length);
        
        // Renderizza
        renderAmici(amici, richiesteInEntrata, richiesteInUscita);
    } catch (error) {
        console.error('❌ Errore nel caricamento amici:', error);
        console.error('Dettagli errore:', error.message, error.code);
        showNotification('Errore nel caricamento degli amici. Riprova.');
        // Mostra comunque il placeholder
        renderAmici([], [], []);
    }
}

/**
 * Renderizza amici e richieste nella UI
 */
function renderAmici(amici, richiesteInEntrata, richiesteInUscita) {
    const amiciPlaceholder = document.getElementById('amiciPlaceholder');
    const amiciList = elements.amiciList;
    const richiesteInEntrataList = elements.richiesteInEntrataList;
    const richiesteInEntrataSection = elements.richiesteInEntrataSection;
    
    // Gestisci richieste in entrata
    if (richiesteInEntrataSection) {
        if (richiesteInEntrata.length > 0) {
            richiesteInEntrataSection.style.display = 'block';
            if (richiesteInEntrataList) {
                richiesteInEntrataList.innerHTML = richiesteInEntrata.map(req => `
                    <div class="amico-item">
                        <div class="amico-info">
                            <div class="amico-avatar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <div>
                                <p class="amico-nome">${escapeHtml(req.utente?.nome_utente || 'Utente')}</p>
                                <p class="amico-cid">CID: ${escapeHtml(String(req.utente?.cid ?? ''))}</p>
                            </div>
                        </div>
                        <div class="amico-actions">
                            <button class="btn-icon-amico btn-accept" onclick="acceptFriendRequest('${req.id}')" aria-label="Accetta richiesta" title="Accetta richiesta">
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </button>
                            <button class="btn-icon-amico btn-reject" onclick="rejectFriendRequest('${req.id}')" aria-label="Rifiuta richiesta" title="Rifiuta richiesta">
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            richiesteInEntrataSection.style.display = 'none';
        }
    }
    
    // Gestisci lista amici
    if (amici.length === 0 && richiesteInEntrata.length === 0 && richiesteInUscita.length === 0) {
        // Nessun amico e nessuna richiesta
        if (amiciPlaceholder) {
            amiciPlaceholder.style.display = 'block';
            amiciPlaceholder.innerHTML = '<p>Non hai amici. Tempo di unirsi a una gioiosa cooperazione!</p>';
        }
        if (amiciList) {
            amiciList.style.display = 'none';
        }
    } else {
        if (amiciPlaceholder) {
            amiciPlaceholder.style.display = 'none';
        }
        if (amiciList) {
            amiciList.style.display = 'grid';
            amiciList.innerHTML = amici.map(amico => `
                <div class="amico-item">
                    <div class="amico-info">
                        <div class="amico-avatar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div>
                            <p class="amico-nome">${escapeHtml(amico.nome_utente || 'Utente')}</p>
                            <p class="amico-cid">CID: ${escapeHtml(String(amico.cid ?? ''))}</p>
                        </div>
                    </div>
                    <div class="amico-actions">
                        <button class="btn-icon-remove" onclick="rimuoviAmico('${amico.id}')" aria-label="Rimuovi amico" title="Rimuovi amico">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
}
