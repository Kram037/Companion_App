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
            setSafeHtml(searchUserInfo, `
                <p><strong>${safeNomeUtente}</strong> (CID: ${safeCid})</p>
                ${statusText}
            `);
            
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
        
        window.dispatchEvent(new CustomEvent('companion:data-changed', {
            detail: { table: 'richieste_amicizia', action: 'upsert' }
        }));
    } catch (error) {
        console.error('❌ Errore nell\'invio richiesta amicizia:', error);
        if (error.code === '23505') {
            showNotification('Richiesta già esistente');
        } else {
            showNotification('Errore nell\'invio della richiesta. Riprova.');
        }
    }
}
