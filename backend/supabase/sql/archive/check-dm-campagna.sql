-- Funzione RPC per verificare se un utente è il DM di una campagna
-- Bypassa RLS usando SECURITY DEFINER
-- Usa id_dm invece di user_id
CREATE OR REPLACE FUNCTION check_dm_campagna(p_campagna_id VARCHAR(10), p_user_id VARCHAR(10))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_dm VARCHAR(10);
BEGIN
    SELECT id_dm INTO v_id_dm
    FROM campagne
    WHERE id = p_campagna_id;
    
    -- Se la campagna non esiste o id_dm è NULL, ritorna false
    IF v_id_dm IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Confronta i valori (entrambi sono VARCHAR(10))
    RETURN v_id_dm = p_user_id;
END;
$$;

-- Grant execute alla funzione per gli utenti autenticati
GRANT EXECUTE ON FUNCTION check_dm_campagna(VARCHAR(10), VARCHAR(10)) TO authenticated;

