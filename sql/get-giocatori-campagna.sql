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
#variable_conflict use_column
DECLARE
    v_current_user_id VARCHAR(10);
    v_giocatori VARCHAR(10)[];
    v_id_dm VARCHAR(10);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    SELECT u.id INTO v_current_user_id
    FROM utenti u
    WHERE u.uid = auth.uid()::text;

    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;

    SELECT c.giocatori, c.id_dm INTO v_giocatori, v_id_dm
    FROM campagne c
    WHERE c.id = campagna_id_param;

    IF v_id_dm IS NULL THEN
        RAISE EXCEPTION 'Campagna non trovata';
    END IF;

    v_giocatori := COALESCE(v_giocatori, ARRAY[]::VARCHAR(10)[]);

    IF v_current_user_id != v_id_dm AND NOT (v_current_user_id = ANY(v_giocatori)) THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;
    
    IF v_giocatori IS NULL OR array_length(v_giocatori, 1) IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        u.id,
        u.nome_utente,
        u.cid
    FROM utenti u
    WHERE u.id = ANY(v_giocatori);
END;
$$;

GRANT EXECUTE ON FUNCTION get_giocatori_campagna(VARCHAR(10)) TO authenticated;
