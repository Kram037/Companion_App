-- Funzione RPC per ottenere i dati del DM di una campagna
-- Bypassa RLS usando SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_dm_campagna(p_campagna_id VARCHAR(10))
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
    v_current_user_id VARCHAR(10);
    v_id_dm VARCHAR(10);
    v_giocatori VARCHAR(10)[];
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    SELECT id INTO v_current_user_id
    FROM utenti
    WHERE uid = auth.uid()::text;

    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;

    SELECT id_dm, giocatori INTO v_id_dm, v_giocatori
    FROM campagne
    WHERE id = p_campagna_id;

    IF v_id_dm IS NULL THEN
        RAISE EXCEPTION 'Campagna non trovata';
    END IF;

    v_giocatori := COALESCE(v_giocatori, ARRAY[]::VARCHAR(10)[]);

    -- Autorizza solo DM o giocatori della campagna
    IF v_current_user_id != v_id_dm AND NOT (v_current_user_id = ANY(v_giocatori)) THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    -- Recupera i dati del DM della campagna tramite id_dm
    RETURN QUERY
    SELECT 
        u.id,
        u.nome_utente,
        u.cid
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
    cid INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_user_id VARCHAR(10);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    SELECT id INTO v_current_user_id
    FROM utenti
    WHERE uid = auth.uid()::text;

    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;

    -- Recupera i dati dei DM dato un array di id_dm
    RETURN QUERY
    SELECT 
        u.id,
        u.nome_utente,
        u.cid
    FROM campagne c
    INNER JOIN utenti u ON u.id = c.id_dm
    WHERE c.id_dm = ANY(p_dm_ids)
      AND (
          c.id_dm = v_current_user_id
          OR v_current_user_id = ANY(c.giocatori)
      );
END;
$$;

-- Grant execute alle funzioni per gli utenti autenticati
GRANT EXECUTE ON FUNCTION get_dm_campagna(VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dms_campagne(VARCHAR(10)[]) TO authenticated;

