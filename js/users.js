// Supabase - Utenti Management
let initializingUsers = new Set(); // Traccia utenti in fase di inizializzazione per evitare chiamate multiple

/**
 * Genera un CID univoco a 4 cifre (1000-9999) usando la funzione SQL
 */
async function generateUniqueCid() {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
        console.error('❌ Supabase non disponibile per generare CID');
        // Fallback: genera un numero casuale
        return Math.floor(1000 + Math.random() * 9000);
    }
    
    try {
        // Usa la funzione SQL per generare un CID univoco
        const { data, error } = await supabase.rpc('generate_unique_cid');
        
        if (error) throw error;
        
        console.log('✅ CID generato dalla funzione SQL:', data);
        return data;
    } catch (error) {
        console.error('❌ Errore nella generazione CID, uso fallback:', error);
        // Fallback: genera un numero casuale
        return Math.floor(1000 + Math.random() * 9000);
    }
}

/**
 * Salva il nuovo nome utente
 */
async function handleSaveUserName() {
    if (!elements.editUserNameInput) return;
    
    const newName = elements.editUserNameInput.value.trim();
    if (!newName) {
        showNotification('Il nome utente non può essere vuoto');
        return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
        showNotification('Errore: Supabase non disponibile');
        return;
    }

    if (!AppState.currentUser) {
        showNotification('Errore: utente non autenticato');
        return;
    }

    try {
        // Trova l'utente nella tabella utenti
        const utente = await findUserByUid(AppState.currentUser.uid);
        if (!utente) {
            showNotification('Errore: profilo utente non trovato');
            return;
        }

        // Aggiorna il nome utente
        const { error } = await supabase
            .from('utenti')
            .update({ nome_utente: newName })
            .eq('id', utente.id);

        if (error) throw error;

        if (AppState.currentUser) {
            AppState.currentUser.displayName = newName;
        }

        await supabase.auth.updateUser({ data: { display_name: newName } });

        await sendAppEventBroadcast({ table: 'utenti', action: 'update', userId: utente.id });

        if (elements.userName) {
            elements.userName.textContent = newName;
        }
        const headerUserName = document.getElementById('headerUserName');
        if (headerUserName) headerUserName.textContent = newName;
        invalidateUserCache();
        if (elements.editUserNameForm) {
            elements.editUserNameForm.style.display = 'none';
        }
        if (elements.editUserNameInput) {
            elements.editUserNameInput.value = '';
        }

        showNotification('Nome utente aggiornato con successo!');
    } catch (error) {
        console.error('❌ Errore nell\'aggiornamento nome utente:', error);
        showNotification('Errore nell\'aggiornamento del nome utente: ' + (error.message || error));
    }
}

/**
 * Trova l'utente per uid (con cache)
 */
async function findUserByUid(uid, forceRefresh = false) {
    if (!forceRefresh && AppState.cachedUserData && AppState.currentUser && AppState.currentUser.uid === uid) {
        return AppState.cachedUserData;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return null;
    
    try {
        const { data, error } = await supabase
            .from('utenti')
            .select('*')
            .eq('uid', uid)
            .maybeSingle();
        
        if (error) {
            if (error.code === 'PGRST116') return null;
            console.error('❌ Errore nella ricerca utente per uid:', error);
            throw error;
        }
        
        if (data && AppState.currentUser && AppState.currentUser.uid === uid) {
            AppState.cachedUserData = data;
        }
        return data;
    } catch (error) {
        console.error('❌ Errore nella ricerca utente per uid:', error);
        return null;
    }
}

function invalidateUserCache() {
    AppState.cachedUserData = null;
    AppState.cachedCampagne = null;
}

/**
 * Inizializza o aggiorna l'utente in Supabase
 */
async function initializeUserDocument(user) {
    const supabase = getSupabaseClient();
    
    if (!supabase || !user) return null;
    
    if (initializingUsers.has(user.id)) {
        let waitAttempts = 0;
        while (initializingUsers.has(user.id) && waitAttempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitAttempts++;
        }
        return await findUserByUid(user.id);
    }
    
    initializingUsers.add(user.id);
    
    try {
        const existingUser = await findUserByUid(user.id);
        
        const currentTheme = localStorage.getItem('theme') || 'light';
        const temaScuro = currentTheme === 'dark';
        const nomeUtente = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utente';
        
        if (existingUser) {
            const { data, error } = await supabase
                .from('utenti')
                .update({
                    email: user.email,
                    tema_scuro: temaScuro
                })
                .eq('uid', user.id)
                .select()
                .single();
            
            if (error) throw error;
            
            if (data) {
                AppState.cachedUserData = data;
            }
            
            await sendAppEventBroadcast({ table: 'utenti', action: 'update', uid: user.id });
            await loadUserData(user.id);
            
            return data;
        } else {
            let cid;
            try {
                cid = await generateUniqueCid();
            } catch (cidError) {
                console.error('❌ Errore nella generazione CID, uso fallback:', cidError);
                cid = Math.floor(1000 + Math.random() * 9000);
            }
            
            const userData = {
                uid: user.id, // UUID di Supabase Auth
                cid: cid,
                nome_utente: nomeUtente,
                email: user.email,
                tema_scuro: temaScuro
            };
            
            
            // Usa upsert che gestisce automaticamente insert/update
            // onConflict su uid (chiave primaria per identificare l'utente)
            let attempts = 0;
            let data = null;
            let error = null;
            
            while (attempts < 3) {
                const result = await supabase
                    .from('utenti')
                    .upsert(userData, {
                        onConflict: 'uid'
                    })
                    .select()
                    .single();
                
                data = result.data;
                error = result.error;
                
                if (!error) break;
                
                if (error.code === '23505') {
                    attempts++;
                    if (attempts < 3) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                        // Prova a caricare l'utente esistente
                        const existingUser = await findUserByUid(user.id);
                        if (existingUser) {
                            // Usa i dati esistenti e aggiorna solo i campi necessari
                            const updateData = {
                                email: user.email,
                                nome_utente: nomeUtente,
                                tema_scuro: temaScuro
                            };
                            const updateResult = await supabase
                                .from('utenti')
                                .update(updateData)
                                .eq('uid', user.id)
                                .select()
                                .single();
                            
                            if (!updateResult.error && updateResult.data) {
                                data = updateResult.data;
                                error = null;
                                await sendAppEventBroadcast({ table: 'utenti', action: 'update', uid: user.id });
                                break;
                            }
                        }
                        continue;
                    }
                }
                break; // Errore diverso o troppi tentativi
            }
            
            if (error) throw error;
            
            if (data) {
                AppState.cachedUserData = data;
            }
            
            // Applica il tema
            if (temaScuro) {
                setTheme('dark', false); // false = non salvare di nuovo in localStorage
            } else {
                setTheme('light', false);
            }
            
            return data;
        }
    } catch (error) {
        console.error('❌ Errore nell\'inizializzazione utente:', error);
        
        return null;
    } finally {
        // Rimuovi l'utente dal set di inizializzazione
        initializingUsers.delete(user.id);
    }
}
