-- ============================================
-- DEPLOY COMPLETO - Droppa e ricrea TUTTE le funzioni RPC
-- Esegui questo script UNA SOLA VOLTA nel SQL Editor di Supabase
-- ============================================

-- STEP 1: DROP di tutte le funzioni esistenti (ignora se non esistono)

-- Friend functions (versione UUID - vecchia)
DROP FUNCTION IF EXISTS get_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS get_richieste_in_entrata() CASCADE;
DROP FUNCTION IF EXISTS get_richieste_in_uscita() CASCADE;
DROP FUNCTION IF EXISTS get_amici() CASCADE;
DROP FUNCTION IF EXISTS get_all_richieste_amicizia() CASCADE;
DROP FUNCTION IF EXISTS search_user_by_name_and_cid(TEXT, INTEGER) CASCADE;

-- DM functions
DROP FUNCTION IF EXISTS get_dm_campagna(VARCHAR(10)) CASCADE;
DROP FUNCTION IF EXISTS get_dms_campagne(VARCHAR(10)[]) CASCADE;
DROP FUNCTION IF EXISTS check_dm_campagna(VARCHAR(10), VARCHAR(10)) CASCADE;

-- Giocatori
DROP FUNCTION IF EXISTS get_giocatori_campagna(VARCHAR(10)) CASCADE;

-- Tiri iniziativa
DROP FUNCTION IF EXISTS get_tiri_iniziativa(VARCHAR(10)) CASCADE;

-- Inviti
DROP FUNCTION IF EXISTS get_inviti_ricevuti(VARCHAR(10)) CASCADE;
DROP FUNCTION IF EXISTS invia_invito_campagna(VARCHAR(10), VARCHAR(10), VARCHAR(10)) CASCADE;
DROP FUNCTION IF EXISTS accetta_invito_campagna(VARCHAR(10)) CASCADE;
DROP FUNCTION IF EXISTS rifiuta_invito_campagna(VARCHAR(10)) CASCADE;
DROP FUNCTION IF EXISTS rimuovi_giocatore_campagna(VARCHAR(10), VARCHAR(10)) CASCADE;

-- ============================================
-- STEP 2: Ricrea get_current_user_id
-- ============================================
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS VARCHAR(10) AS $$
BEGIN
    RETURN (SELECT id FROM utenti WHERE uid = auth.uid()::text LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================
-- STEP 3: Friend functions (VARCHAR(10))
-- ============================================
CREATE OR REPLACE FUNCTION get_richieste_in_entrata()
RETURNS TABLE (
    richiesta_id VARCHAR(10),
    richiedente_id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER,
    stato TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    current_user_id VARCHAR(10);
BEGIN
    current_user_id := get_current_user_id();
    RETURN QUERY
    SELECT ra.id, u.id, u.nome_utente, u.cid, ra.stato, ra.created_at
    FROM richieste_amicizia ra
    INNER JOIN utenti u ON u.id = ra.richiedente_id
    WHERE ra.destinatario_id = current_user_id AND ra.stato = 'pending'
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
DECLARE
    current_user_id VARCHAR(10);
BEGIN
    current_user_id := get_current_user_id();
    RETURN QUERY
    SELECT ra.id, u.id, u.nome_utente, u.cid, ra.stato, ra.created_at
    FROM richieste_amicizia ra
    INNER JOIN utenti u ON u.id = ra.destinatario_id
    WHERE ra.richiedente_id = current_user_id AND ra.stato = 'pending'
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
DECLARE
    current_user_id VARCHAR(10);
BEGIN
    current_user_id := get_current_user_id();
    RETURN QUERY
    SELECT u.id, u.nome_utente, u.cid, ra.id, ra.created_at
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

CREATE OR REPLACE FUNCTION search_user_by_name_and_cid(search_nome TEXT, search_cid INTEGER)
RETURNS TABLE (
    id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.nome_utente, u.cid
    FROM utenti u
    WHERE u.nome_utente = search_nome AND u.cid = search_cid
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================
-- STEP 4: DM functions
-- ============================================
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

    SELECT id INTO v_current_user_id FROM utenti WHERE uid = auth.uid()::text;
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;

    SELECT c.id_dm, c.giocatori INTO v_id_dm, v_giocatori
    FROM campagne c WHERE c.id = p_campagna_id;

    IF v_id_dm IS NULL THEN
        RAISE EXCEPTION 'Campagna non trovata';
    END IF;

    v_giocatori := COALESCE(v_giocatori, ARRAY[]::VARCHAR(10)[]);

    IF v_current_user_id != v_id_dm AND NOT (v_current_user_id = ANY(v_giocatori)) THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    RETURN QUERY
    SELECT u.id, u.nome_utente, u.cid
    FROM campagne c
    INNER JOIN utenti u ON u.id = c.id_dm
    WHERE c.id = p_campagna_id;
END;
$$;

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

    SELECT u.id INTO v_current_user_id FROM utenti u WHERE u.uid = auth.uid()::text;
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;

    RETURN QUERY
    SELECT DISTINCT u.id, u.nome_utente, u.cid
    FROM campagne c
    INNER JOIN utenti u ON u.id = c.id_dm
    WHERE c.id_dm = ANY(p_dm_ids)
      AND (c.id_dm = v_current_user_id OR v_current_user_id = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[])));
END;
$$;

CREATE OR REPLACE FUNCTION check_dm_campagna(p_campagna_id VARCHAR(10), p_user_id VARCHAR(10))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_dm VARCHAR(10);
BEGIN
    SELECT id_dm INTO v_id_dm FROM campagne WHERE id = p_campagna_id;
    IF v_id_dm IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN v_id_dm = p_user_id;
END;
$$;

-- ============================================
-- STEP 5: Giocatori campagna
-- ============================================
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
    v_current_user_id VARCHAR(10);
    v_giocatori VARCHAR(10)[];
    v_id_dm VARCHAR(10);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    SELECT id INTO v_current_user_id FROM utenti WHERE uid = auth.uid()::text;
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;

    SELECT c.giocatori, c.id_dm INTO v_giocatori, v_id_dm
    FROM campagne c WHERE c.id = campagna_id_param;

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
    SELECT u.id, u.nome_utente, u.cid
    FROM utenti u
    WHERE u.id = ANY(v_giocatori);
END;
$$;

-- ============================================
-- STEP 5b: Tiri iniziativa (bypassa RLS per nomi giocatori)
-- ============================================
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
DECLARE
    v_current_user_id VARCHAR(10);
    v_campagna_id VARCHAR(10);
    v_id_dm VARCHAR(10);
    v_giocatori VARCHAR(10)[];
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    SELECT u.id INTO v_current_user_id FROM utenti u WHERE u.uid = auth.uid()::text;
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;

    SELECT s.campagna_id INTO v_campagna_id FROM sessioni s WHERE s.id = p_sessione_id;
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
    SELECT r.id, r.sessione_id, r.giocatore_id, r.valore, r.stato, r."timestamp", r.created_at,
           u.nome_utente AS giocatore_nome, u.cid AS giocatore_cid
    FROM richieste_tiro_iniziativa r
    INNER JOIN utenti u ON u.id = r.giocatore_id
    WHERE r.sessione_id = p_sessione_id
    ORDER BY r.valore DESC NULLS LAST;
END;
$$;

-- ============================================
-- STEP 6: Inviti campagna
-- ============================================
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
DECLARE
    v_current_user_id VARCHAR(10);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    SELECT u.id INTO v_current_user_id FROM utenti u WHERE u.uid = auth.uid()::text;

    IF v_current_user_id IS NULL OR v_current_user_id != p_invitato_id THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    RETURN QUERY
    SELECT
        i.id, i.campagna_id, i.inviante_id, i.invitato_id, i.stato, i.created_at, i.updated_at,
        c.nome_campagna AS campagna_nome_campagna,
        u.nome_utente AS inviante_nome_utente,
        u.cid AS inviante_cid
    FROM inviti_campagna i
    LEFT JOIN campagne c ON c.id = i.campagna_id
    LEFT JOIN utenti u ON u.id = i.inviante_id
    WHERE i.invitato_id = p_invitato_id AND i.stato = 'pending'
    ORDER BY i.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION invia_invito_campagna(
    p_campagna_id VARCHAR(10),
    p_inviante_id VARCHAR(10),
    p_invitato_id VARCHAR(10)
)
RETURNS VARCHAR(10)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invito_id VARCHAR(10);
    v_id_dm VARCHAR(10);
BEGIN
    SELECT id_dm INTO v_id_dm FROM campagne WHERE id = p_campagna_id;
    IF v_id_dm IS NULL OR v_id_dm != p_inviante_id THEN
        RAISE EXCEPTION 'Solo il DM può invitare giocatori';
    END IF;

    INSERT INTO inviti_campagna (campagna_id, inviante_id, invitato_id, stato)
    VALUES (p_campagna_id, p_inviante_id, p_invitato_id, 'pending')
    RETURNING id INTO v_invito_id;

    RETURN v_invito_id;
END;
$$;

CREATE OR REPLACE FUNCTION accetta_invito_campagna(p_invito_id VARCHAR(10))
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_campagna_id VARCHAR(10);
    v_invitato_id VARCHAR(10);
    v_current_user_id VARCHAR(10);
BEGIN
    SELECT u.id INTO v_current_user_id FROM utenti u WHERE u.uid = auth.uid()::text;

    SELECT campagna_id, invitato_id INTO v_campagna_id, v_invitato_id
    FROM inviti_campagna WHERE id = p_invito_id AND stato = 'pending';

    IF v_invitato_id IS NULL OR v_invitato_id != v_current_user_id THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    UPDATE inviti_campagna SET stato = 'accepted', updated_at = NOW() WHERE id = p_invito_id;

    UPDATE campagne
    SET giocatori = array_append(COALESCE(giocatori, ARRAY[]::VARCHAR(10)[]), v_invitato_id)
    WHERE id = v_campagna_id
      AND NOT (v_invitato_id = ANY(COALESCE(giocatori, ARRAY[]::VARCHAR(10)[])));
END;
$$;

CREATE OR REPLACE FUNCTION rifiuta_invito_campagna(p_invito_id VARCHAR(10))
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitato_id VARCHAR(10);
    v_current_user_id VARCHAR(10);
BEGIN
    SELECT u.id INTO v_current_user_id FROM utenti u WHERE u.uid = auth.uid()::text;

    SELECT invitato_id INTO v_invitato_id
    FROM inviti_campagna WHERE id = p_invito_id AND stato = 'pending';

    IF v_invitato_id IS NULL OR v_invitato_id != v_current_user_id THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    UPDATE inviti_campagna SET stato = 'rejected', updated_at = NOW() WHERE id = p_invito_id;
END;
$$;

CREATE OR REPLACE FUNCTION rimuovi_giocatore_campagna(
    p_campagna_id VARCHAR(10),
    p_giocatore_id VARCHAR(10)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_dm VARCHAR(10);
    v_current_user_id VARCHAR(10);
BEGIN
    SELECT u.id INTO v_current_user_id FROM utenti u WHERE u.uid = auth.uid()::text;
    SELECT id_dm INTO v_id_dm FROM campagne WHERE id = p_campagna_id;

    IF v_id_dm IS NULL OR v_id_dm != v_current_user_id THEN
        RAISE EXCEPTION 'Solo il DM può rimuovere giocatori';
    END IF;

    UPDATE campagne
    SET giocatori = array_remove(COALESCE(giocatori, ARRAY[]::VARCHAR(10)[]), p_giocatore_id)
    WHERE id = p_campagna_id;

    UPDATE inviti_campagna
    SET stato = 'rejected', updated_at = NOW()
    WHERE campagna_id = p_campagna_id AND invitato_id = p_giocatore_id AND stato = 'accepted';
END;
$$;

-- ============================================
-- STEP 7: GRANT permissions
-- ============================================
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_richieste_in_entrata() TO authenticated;
GRANT EXECUTE ON FUNCTION get_richieste_in_uscita() TO authenticated;
GRANT EXECUTE ON FUNCTION get_amici() TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_by_name_and_cid(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dm_campagna(VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dms_campagne(VARCHAR(10)[]) TO authenticated;
GRANT EXECUTE ON FUNCTION check_dm_campagna(VARCHAR(10), VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_giocatori_campagna(VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_inviti_ricevuti(VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION invia_invito_campagna(VARCHAR(10), VARCHAR(10), VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION accetta_invito_campagna(VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION rifiuta_invito_campagna(VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION rimuovi_giocatore_campagna(VARCHAR(10), VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tiri_iniziativa(VARCHAR(10)) TO authenticated;
