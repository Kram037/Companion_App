-- Funzione RPC per aggiornare il DM di una campagna
-- Bypassa RLS usando SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_dm_campagna(
    p_campagna_id VARCHAR(10),
    p_nuovo_dm_id VARCHAR(10),
    p_nuovo_dm_nome TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE campagne
    SET 
        user_id = p_nuovo_dm_id,
        nome_dm = p_nuovo_dm_nome
    WHERE id = p_campagna_id;
END;
$$;

-- Grant execute alla funzione per gli utenti autenticati
GRANT EXECUTE ON FUNCTION update_dm_campagna(VARCHAR(10), VARCHAR(10), TEXT) TO authenticated;

