-- Funzione RPC per verificare se un utente è il DM di una campagna
-- Bypassa RLS usando SECURITY DEFINER
CREATE OR REPLACE FUNCTION check_dm_campagna(p_campagna_id VARCHAR(10), p_user_id VARCHAR(10))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id VARCHAR(10);
BEGIN
    SELECT user_id INTO v_user_id
    FROM campagne
    WHERE id = p_campagna_id;
    
    RETURN v_user_id = p_user_id;
END;
$$;

-- Grant execute alla funzione per gli utenti autenticati
GRANT EXECUTE ON FUNCTION check_dm_campagna(VARCHAR(10), VARCHAR(10)) TO authenticated;

