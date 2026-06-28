-- Funzione RPC per ottenere i tiri di iniziativa con i nomi dei giocatori
-- Bypassa RLS usando SECURITY DEFINER per mostrare i nomi di tutti i giocatori

DROP FUNCTION IF EXISTS get_tiri_iniziativa(VARCHAR(10)) CASCADE;

CREATE OR REPLACE FUNCTION get_tiri_iniziativa(p_sessione_id VARCHAR(10))
RETURNS TABLE (
    id VARCHAR(10),
    sessione_id VARCHAR(10),
    giocatore_id VARCHAR(10),
    valore INTEGER,
    stato TEXT,
    "timestamp" TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    giocatore_nome TEXT,
    giocatore_cid INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
    v_current_user_id VARCHAR(10);
    v_campagna_id VARCHAR(10);
    v_id_dm VARCHAR(10);
    v_giocatori VARCHAR(10)[];
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    SELECT u.id INTO v_current_user_id
    FROM utenti u WHERE u.uid = auth.uid()::text;

    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;

    -- Verifica che la sessione esista e l'utente abbia accesso alla campagna
    SELECT s.campagna_id INTO v_campagna_id
    FROM sessioni s WHERE s.id = p_sessione_id;

    IF v_campagna_id IS NULL THEN
        RAISE EXCEPTION 'Sessione non trovata';
    END IF;

    SELECT c.id_dm, c.giocatori INTO v_id_dm, v_giocatori
    FROM campagne c WHERE c.id = v_campagna_id;

    v_giocatori := COALESCE(v_giocatori, ARRAY[]::VARCHAR(10)[]);

    IF v_current_user_id != v_id_dm AND NOT (v_current_user_id = ANY(v_giocatori)) THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    RETURN QUERY
    SELECT
        r.id,
        r.sessione_id,
        r.giocatore_id,
        r.valore,
        r.stato,
        r."timestamp",
        r.created_at,
        u.nome_utente AS giocatore_nome,
        u.cid AS giocatore_cid
    FROM richieste_tiro_iniziativa r
    INNER JOIN utenti u ON u.id = r.giocatore_id
    WHERE r.sessione_id = p_sessione_id
    ORDER BY r.valore DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION get_tiri_iniziativa(VARCHAR(10)) TO authenticated;
