-- Funzione RPC per ottenere i giocatori di una campagna
-- Recupera i giocatori dall'array giocatori della campagna
-- Esclude il DM corrente dalla lista
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
DECLARE
    v_id_dm VARCHAR(10);
    v_giocatori VARCHAR(10)[];
BEGIN
    -- Ottieni l'ID del DM corrente e l'array giocatori
    SELECT c.id_dm, c.giocatori INTO v_id_dm, v_giocatori
    FROM campagne c
    WHERE c.id = campagna_id_param;
    
    -- Se non ci sono giocatori, ritorna vuoto
    IF v_giocatori IS NULL OR array_length(v_giocatori, 1) IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        u.id,
        u.nome_utente,
        u.cid
    FROM utenti u
    WHERE u.id = ANY(v_giocatori)
    AND u.id != COALESCE(v_id_dm, ''); -- Escludi il DM corrente
END;
$$;

-- Grant execute alla funzione per gli utenti autenticati
GRANT EXECUTE ON FUNCTION get_giocatori_campagna(VARCHAR(10)) TO authenticated;

