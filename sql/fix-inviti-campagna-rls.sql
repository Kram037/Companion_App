-- Fix per infinite recursion nelle policy RLS di inviti_campagna
-- Crea funzioni SECURITY DEFINER per bypassare RLS

-- Funzione per creare un invito a una campagna
CREATE OR REPLACE FUNCTION create_invito_campagna(
    p_campagna_id VARCHAR(10),
    p_invitato_id VARCHAR(10)
)
RETURNS VARCHAR(10) AS $$
DECLARE
    v_current_user_id VARCHAR(10);
    v_invito_id VARCHAR(10);
    v_id_dm VARCHAR(10);
BEGIN
    -- Ottieni l'ID dell'utente corrente
    SELECT id INTO v_current_user_id
    FROM utenti
    WHERE uid = auth.uid()::text;
    
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;
    
    -- Verifica che la campagna esista e che l'utente corrente sia il DM
    SELECT id_dm INTO v_id_dm
    FROM campagne
    WHERE id = p_campagna_id;
    
    IF v_id_dm IS NULL THEN
        RAISE EXCEPTION 'Campagna non trovata';
    END IF;
    
    IF v_id_dm != v_current_user_id THEN
        RAISE EXCEPTION 'Solo il DM può invitare giocatori alla campagna';
    END IF;
    
    -- Verifica che non esista già un invito per questa campagna e questo invitato
    IF EXISTS (
        SELECT 1 FROM inviti_campagna
        WHERE campagna_id = p_campagna_id
        AND invitato_id = p_invitato_id
    ) THEN
        RAISE EXCEPTION 'Invito già esistente per questo utente e questa campagna';
    END IF;
    
    -- Genera un ID univoco
    v_invito_id := generate_unique_id();
    
    -- Crea l'invito
    INSERT INTO inviti_campagna (id, campagna_id, inviante_id, invitato_id, stato)
    VALUES (v_invito_id, p_campagna_id, v_current_user_id, p_invitato_id, 'pending');
    
    RETURN v_invito_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per aggiornare lo stato di un invito (accetta/rifiuta)
-- Gestisce anche l'aggiornamento dell'array giocatori:
-- - Se accettato: aggiunge l'invitato all'array giocatori (se non già presente)
-- - Se rifiutato: rimuove l'invitato dall'array giocatori (se presente)
CREATE OR REPLACE FUNCTION update_invito_campagna_stato(
    p_invito_id VARCHAR(10),
    p_nuovo_stato TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_user_id VARCHAR(10);
    v_invitato_id VARCHAR(10);
    v_campagna_id VARCHAR(10);
    v_id_dm VARCHAR(10);
    v_vecchio_stato TEXT;
    v_giocatori VARCHAR(10)[];
BEGIN
    -- Verifica che il nuovo stato sia valido
    IF p_nuovo_stato NOT IN ('accepted', 'rejected', 'pending') THEN
        RAISE EXCEPTION 'Stato non valido';
    END IF;
    
    -- Ottieni l'ID dell'utente corrente
    SELECT id INTO v_current_user_id
    FROM utenti
    WHERE uid = auth.uid()::text;
    
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;
    
    -- Ottieni l'invitato_id, campagna_id e vecchio stato dell'invito
    SELECT invitato_id, campagna_id, stato INTO v_invitato_id, v_campagna_id, v_vecchio_stato
    FROM inviti_campagna
    WHERE id = p_invito_id;
    
    IF v_invitato_id IS NULL THEN
        RAISE EXCEPTION 'Invito non trovato';
    END IF;
    
    -- Verifica che l'utente corrente sia l'invitato
    IF v_current_user_id != v_invitato_id THEN
        RAISE EXCEPTION 'Solo l''invitato può modificare lo stato dell''invito';
    END IF;
    
    -- Aggiorna lo stato dell'invito
    UPDATE inviti_campagna
    SET stato = p_nuovo_stato,
        updated_at = NOW()
    WHERE id = p_invito_id;
    
    -- Gestisci l'array giocatori nella tabella campagne
    -- Ottieni l'array giocatori corrente e l'id_dm
    SELECT giocatori, id_dm INTO v_giocatori, v_id_dm
    FROM campagne
    WHERE id = v_campagna_id;
    
    -- Inizializza l'array se NULL
    IF v_giocatori IS NULL THEN
        v_giocatori := ARRAY[]::VARCHAR(10)[];
    END IF;
    
    -- Se l'invito viene accettato, aggiungi l'invitato all'array giocatori (se non già presente)
    -- Nota: non aggiungiamo se è il DM, ma questo non dovrebbe mai succedere perché il DM non può invitare se stesso
    IF p_nuovo_stato = 'accepted' THEN
        -- Verifica che non sia il DM
        IF v_invitato_id != COALESCE(v_id_dm, '') THEN
            IF NOT (v_invitato_id = ANY(v_giocatori)) THEN
                v_giocatori := array_append(v_giocatori, v_invitato_id);
                UPDATE campagne
                SET giocatori = v_giocatori
                WHERE id = v_campagna_id;
            END IF;
        END IF;
    END IF;
    
    -- Se l'invito viene rifiutato o era accettato e ora viene rifiutato, rimuovi l'invitato dall'array giocatori
    IF (p_nuovo_stato = 'rejected' OR (v_vecchio_stato = 'accepted' AND p_nuovo_stato != 'accepted')) THEN
        IF v_invitato_id = ANY(v_giocatori) THEN
            v_giocatori := array_remove(v_giocatori, v_invitato_id);
            UPDATE campagne
            SET giocatori = v_giocatori
            WHERE id = v_campagna_id;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per rimuovere un giocatore dalla campagna (solo per DM)
-- Aggiorna lo stato dell'invito a 'rejected' e rimuove il giocatore dall'array giocatori
CREATE OR REPLACE FUNCTION dm_rimuovi_giocatore(
    p_campagna_id VARCHAR(10),
    p_giocatore_id VARCHAR(10),
    p_invito_id VARCHAR(10) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_user_id VARCHAR(10);
    v_id_dm VARCHAR(10);
    v_giocatori VARCHAR(10)[];
BEGIN
    -- Ottieni l'ID dell'utente corrente
    SELECT id INTO v_current_user_id
    FROM utenti
    WHERE uid = auth.uid()::text;
    
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;
    
    -- Verifica che l'utente corrente sia il DM della campagna
    SELECT id_dm INTO v_id_dm
    FROM campagne
    WHERE id = p_campagna_id;
    
    IF v_id_dm IS NULL OR v_id_dm != v_current_user_id THEN
        RAISE EXCEPTION 'Solo il DM può rimuovere giocatori dalla campagna';
    END IF;
    
    -- Se abbiamo un invito_id, aggiorna lo stato a 'rejected'
    IF p_invito_id IS NOT NULL THEN
        UPDATE inviti_campagna
        SET stato = 'rejected',
            updated_at = NOW()
        WHERE id = p_invito_id;
    ELSE
        -- Altrimenti, aggiorna tutti gli inviti per questo giocatore e questa campagna
        UPDATE inviti_campagna
        SET stato = 'rejected',
            updated_at = NOW()
        WHERE campagna_id = p_campagna_id
        AND invitato_id = p_giocatore_id;
    END IF;
    
    -- Rimuovi il giocatore dall'array giocatori
    SELECT giocatori INTO v_giocatori
    FROM campagne
    WHERE id = p_campagna_id;
    
    IF v_giocatori IS NOT NULL AND p_giocatore_id = ANY(v_giocatori) THEN
        v_giocatori := array_remove(v_giocatori, p_giocatore_id);
        UPDATE campagne
        SET giocatori = v_giocatori
        WHERE id = p_campagna_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute alla funzione per gli utenti autenticati
GRANT EXECUTE ON FUNCTION dm_rimuovi_giocatore(VARCHAR(10), VARCHAR(10), VARCHAR(10)) TO authenticated;

-- Rimuovi le policy problematiche e sostituiscile con policy più semplici
DROP POLICY IF EXISTS "Utenti possono creare inviti per le proprie campagne" ON inviti_campagna;
DROP POLICY IF EXISTS "Utenti possono aggiornare inviti ricevuti" ON inviti_campagna;
DROP POLICY IF EXISTS "Utenti possono creare inviti tramite funzione" ON inviti_campagna;
DROP POLICY IF EXISTS "Utenti possono aggiornare inviti tramite funzione" ON inviti_campagna;

-- Policy semplificate che usano le funzioni SECURITY DEFINER
-- La policy INSERT ora permette solo se viene chiamata tramite la funzione
-- (in pratica, disabilitiamo INSERT diretto e usiamo solo la funzione)
CREATE POLICY "Utenti possono creare inviti tramite funzione"
    ON inviti_campagna FOR INSERT
    WITH CHECK (false); -- Disabilita INSERT diretto, usa la funzione

CREATE POLICY "Utenti possono aggiornare inviti tramite funzione"
    ON inviti_campagna FOR UPDATE
    USING (false); -- Disabilita UPDATE diretto, usa la funzione

-- Le policy SELECT e DELETE rimangono come prima
-- (già presenti nel file clean-and-recreate-schema.sql)

