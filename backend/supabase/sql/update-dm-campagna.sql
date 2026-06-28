-- Funzione RPC per aggiornare il DM di una campagna
-- Logica:
-- 1. Aggiunge il vecchio DM all'array giocatori
-- 2. Aggiorna id_dm al nuovo DM
-- 3. Rimuove il nuovo DM dall'array giocatori
-- Bypassa RLS usando SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_dm_campagna(
    p_campagna_id VARCHAR(10),
    p_nuovo_dm_id VARCHAR(10)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_vecchio_dm_id VARCHAR(10);
    v_giocatori VARCHAR(10)[];
BEGIN
    -- Recupera il vecchio DM e l'array giocatori corrente
    SELECT id_dm, giocatori INTO v_vecchio_dm_id, v_giocatori
    FROM campagne
    WHERE id = p_campagna_id;
    
    -- Inizializza l'array se NULL
    IF v_giocatori IS NULL THEN
        v_giocatori := ARRAY[]::VARCHAR(10)[];
    END IF;
    
    -- STEP 1: Aggiungi il vecchio DM all'array giocatori (se esiste e non è già presente)
    IF v_vecchio_dm_id IS NOT NULL AND v_vecchio_dm_id != p_nuovo_dm_id THEN
        IF NOT (v_vecchio_dm_id = ANY(v_giocatori)) THEN
            v_giocatori := array_append(v_giocatori, v_vecchio_dm_id);
        END IF;
    END IF;
    
    -- STEP 2: Aggiorna id_dm al nuovo DM
    UPDATE campagne
    SET id_dm = p_nuovo_dm_id
    WHERE id = p_campagna_id;
    
    -- STEP 3: Rimuovi il nuovo DM dall'array giocatori (se presente)
    IF p_nuovo_dm_id = ANY(v_giocatori) THEN
        v_giocatori := array_remove(v_giocatori, p_nuovo_dm_id);
        UPDATE campagne
        SET giocatori = v_giocatori
        WHERE id = p_campagna_id;
    ELSE
        -- Aggiorna comunque l'array se abbiamo aggiunto il vecchio DM
        UPDATE campagne
        SET giocatori = v_giocatori
        WHERE id = p_campagna_id;
    END IF;
END;
$$;

-- Grant execute alla funzione per gli utenti autenticati
GRANT EXECUTE ON FUNCTION update_dm_campagna(VARCHAR(10), VARCHAR(10)) TO authenticated;

