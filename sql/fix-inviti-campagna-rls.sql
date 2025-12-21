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
BEGIN
    -- Ottieni l'ID dell'utente corrente
    SELECT id INTO v_current_user_id
    FROM utenti
    WHERE uid = auth.uid()::text;
    
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;
    
    -- Verifica che la campagna appartenga all'utente corrente
    IF NOT EXISTS (
        SELECT 1 FROM campagne
        WHERE id = p_campagna_id
        AND user_id = v_current_user_id
    ) THEN
        RAISE EXCEPTION 'La campagna non appartiene all''utente corrente';
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
CREATE OR REPLACE FUNCTION update_invito_campagna_stato(
    p_invito_id VARCHAR(10),
    p_nuovo_stato TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_user_id VARCHAR(10);
    v_invitato_id VARCHAR(10);
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
    
    -- Ottieni l'invitato_id dell'invito
    SELECT invitato_id INTO v_invitato_id
    FROM inviti_campagna
    WHERE id = p_invito_id;
    
    IF v_invitato_id IS NULL THEN
        RAISE EXCEPTION 'Invito non trovato';
    END IF;
    
    -- Verifica che l'utente corrente sia l'invitato
    IF v_current_user_id != v_invitato_id THEN
        RAISE EXCEPTION 'Solo l''invitato può modificare lo stato dell''invito';
    END IF;
    
    -- Aggiorna lo stato
    UPDATE inviti_campagna
    SET stato = p_nuovo_stato,
        updated_at = NOW()
    WHERE id = p_invito_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rimuovi le policy problematiche e sostituiscile con policy più semplici
DROP POLICY IF EXISTS "Utenti possono creare inviti per le proprie campagne" ON inviti_campagna;
DROP POLICY IF EXISTS "Utenti possono aggiornare inviti ricevuti" ON inviti_campagna;

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

