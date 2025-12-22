-- Funzione RPC per ottenere i giocatori di una campagna
-- Bypassa RLS usando SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_giocatori_campagna(campagna_id_param VARCHAR(10))
RETURNS TABLE (
    id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.nome_utente,
        u.cid
    FROM utenti u
    WHERE u.id = ANY(
        SELECT unnest(c.giocatori)
        FROM campagne c
        WHERE c.id = campagna_id_param
    );
END;
$$;

-- Grant execute alla funzione per gli utenti autenticati
GRANT EXECUTE ON FUNCTION get_giocatori_campagna(VARCHAR(10)) TO authenticated;

