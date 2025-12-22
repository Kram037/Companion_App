-- Funzione RPC per ottenere i dati del DM di una campagna
-- Bypassa RLS usando SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_dm_campagna(p_campagna_id VARCHAR(10))
RETURNS TABLE (
    id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER,
    email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Recupera i dati del DM della campagna tramite id_dm
    RETURN QUERY
    SELECT 
        u.id,
        u.nome_utente,
        u.cid,
        u.email
    FROM campagne c
    INNER JOIN utenti u ON u.id = c.id_dm
    WHERE c.id = p_campagna_id;
END;
$$;

-- Funzione RPC per ottenere i dati dei DM di multiple campagne (più efficiente)
-- Bypassa RLS usando SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_dms_campagne(p_dm_ids VARCHAR(10)[])
RETURNS TABLE (
    id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER,
    email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Recupera i dati dei DM dato un array di id_dm
    RETURN QUERY
    SELECT 
        u.id,
        u.nome_utente,
        u.cid,
        u.email
    FROM utenti u
    WHERE u.id = ANY(p_dm_ids);
END;
$$;

-- Grant execute alle funzioni per gli utenti autenticati
GRANT EXECUTE ON FUNCTION get_dm_campagna(VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dms_campagne(VARCHAR(10)[]) TO authenticated;

