-- Fix: "Column reference 'id' is ambiguous" in all RPC functions
-- Aggiunge #variable_conflict use_column e alias tabella mancanti
-- Eseguire nel SQL Editor di Supabase

-- 1. get_giocatori_campagna
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

-- 2. get_dm_campagna
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
#variable_conflict use_column
DECLARE
    v_current_user_id VARCHAR(10);
    v_id_dm VARCHAR(10);
    v_giocatori VARCHAR(10)[];
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

    SELECT c.id_dm, c.giocatori INTO v_id_dm, v_giocatori
    FROM campagne c
    WHERE c.id = p_campagna_id;

    IF v_id_dm IS NULL THEN
        RAISE EXCEPTION 'Campagna non trovata';
    END IF;

    v_giocatori := COALESCE(v_giocatori, ARRAY[]::VARCHAR(10)[]);

    IF v_current_user_id != v_id_dm AND NOT (v_current_user_id = ANY(v_giocatori)) THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

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

-- 3. get_dms_campagne
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
#variable_conflict use_column
DECLARE
    v_current_user_id VARCHAR(10);
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

-- 4. get_inviti_ricevuti
CREATE OR REPLACE FUNCTION get_inviti_ricevuti(p_invitato_id VARCHAR(10))
RETURNS TABLE (
    id VARCHAR(10),
    campagna_id VARCHAR(10),
    inviante_id VARCHAR(10),
    invitato_id VARCHAR(10),
    stato TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    campagna_nome_campagna TEXT,
    inviante_nome_utente TEXT,
    inviante_cid INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM utenti u
        WHERE u.id = p_invitato_id
          AND u.uid = auth.uid()::text
    ) THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    RETURN QUERY
    SELECT 
        ic.id,
        ic.campagna_id,
        ic.inviante_id,
        ic.invitato_id,
        ic.stato,
        ic.created_at,
        ic.updated_at,
        c.nome_campagna AS campagna_nome_campagna,
        u.nome_utente AS inviante_nome_utente,
        u.cid AS inviante_cid
    FROM inviti_campagna ic
    LEFT JOIN campagne c ON c.id = ic.campagna_id
    LEFT JOIN utenti u ON u.id = ic.inviante_id
    WHERE ic.invitato_id = p_invitato_id
      AND ic.stato = 'pending'
    ORDER BY ic.created_at DESC;
END;
$$;

-- 5. get_tiri_iniziativa
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

-- 6. Friend functions
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS VARCHAR(10) AS $$
BEGIN
    RETURN (SELECT u.id FROM utenti u WHERE u.uid = auth.uid()::text LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_richieste_in_entrata()
RETURNS TABLE (
    richiesta_id VARCHAR(10),
    richiedente_id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER,
    stato TEXT,
    created_at TIMESTAMPTZ
) AS $$
#variable_conflict use_column
DECLARE
    current_user_id VARCHAR(10);
BEGIN
    current_user_id := get_current_user_id();
    
    RETURN QUERY
    SELECT 
        ra.id as richiesta_id,
        u.id as richiedente_id,
        u.nome_utente,
        u.cid,
        ra.stato,
        ra.created_at
    FROM richieste_amicizia ra
    INNER JOIN utenti u ON u.id = ra.richiedente_id
    WHERE ra.destinatario_id = current_user_id
    AND ra.stato = 'pending'
    ORDER BY ra.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_richieste_in_uscita()
RETURNS TABLE (
    richiesta_id VARCHAR(10),
    destinatario_id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER,
    stato TEXT,
    created_at TIMESTAMPTZ
) AS $$
#variable_conflict use_column
DECLARE
    current_user_id VARCHAR(10);
BEGIN
    current_user_id := get_current_user_id();
    
    RETURN QUERY
    SELECT 
        ra.id as richiesta_id,
        u.id as destinatario_id,
        u.nome_utente,
        u.cid,
        ra.stato,
        ra.created_at
    FROM richieste_amicizia ra
    INNER JOIN utenti u ON u.id = ra.destinatario_id
    WHERE ra.richiedente_id = current_user_id
    AND ra.stato = 'pending'
    ORDER BY ra.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_amici()
RETURNS TABLE (
    amico_id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER,
    richiesta_id VARCHAR(10),
    created_at TIMESTAMPTZ
) AS $$
#variable_conflict use_column
DECLARE
    current_user_id VARCHAR(10);
BEGIN
    current_user_id := get_current_user_id();
    
    RETURN QUERY
    SELECT 
        u.id as amico_id,
        u.nome_utente,
        u.cid,
        ra.id as richiesta_id,
        ra.created_at
    FROM richieste_amicizia ra
    INNER JOIN utenti u ON (
        CASE 
            WHEN ra.richiedente_id = current_user_id THEN u.id = ra.destinatario_id
            ELSE u.id = ra.richiedente_id
        END
    )
    WHERE (ra.richiedente_id = current_user_id OR ra.destinatario_id = current_user_id)
    AND ra.stato = 'accepted'
    ORDER BY u.nome_utente;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION search_user_by_name_and_cid(
    search_nome TEXT,
    search_cid INTEGER
)
RETURNS TABLE (
    id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.nome_utente,
        u.cid
    FROM utenti u
    WHERE u.nome_utente = search_nome
    AND u.cid = search_cid
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Grants
GRANT EXECUTE ON FUNCTION get_giocatori_campagna(VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dm_campagna(VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dms_campagne(VARCHAR(10)[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_inviti_ricevuti(VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tiri_iniziativa(VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_richieste_in_entrata() TO authenticated;
GRANT EXECUTE ON FUNCTION get_richieste_in_uscita() TO authenticated;
GRANT EXECUTE ON FUNCTION get_amici() TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_by_name_and_cid(TEXT, INTEGER) TO authenticated;
