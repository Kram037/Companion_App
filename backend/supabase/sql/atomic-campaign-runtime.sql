-- Runtime atomico per sessioni e combattimenti.
-- Applicare dopo create-sessioni-table.sql, add-mostri-combattimento.sql,
-- create-richieste-tiro-tables.sql e add-combat-timers.sql.

DO $$
DECLARE
    v_duplicates TEXT;
BEGIN
    SELECT STRING_AGG(
        FORMAT('campagna %s -> sessioni [%s]', duplicates.campagna_id, duplicates.session_ids),
        '; ' ORDER BY duplicates.campagna_id
    )
    INTO v_duplicates
    FROM (
        SELECT campagna_id, STRING_AGG(id, ', ' ORDER BY id) AS session_ids
        FROM sessioni
        WHERE data_fine IS NULL
        GROUP BY campagna_id
        HAVING COUNT(*) > 1
    ) AS duplicates;

    IF v_duplicates IS NOT NULL THEN
        RAISE EXCEPTION 'Sessioni aperte duplicate: %', v_duplicates
            USING ERRCODE = '23505',
                  HINT = 'Risolvi manualmente i duplicati prima di applicare atomic-campaign-runtime.sql.';
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS sessioni_one_open_per_campaign
    ON sessioni(campagna_id)
    WHERE data_fine IS NULL;

ALTER TABLE richieste_tiro_generico
    ADD COLUMN IF NOT EXISTS tipo_tiro TEXT,
    ADD COLUMN IF NOT EXISTS target_tiro TEXT,
    ADD COLUMN IF NOT EXISTS tiro_label TEXT;

CREATE OR REPLACE FUNCTION start_campaign_session(p_campagna_id VARCHAR(10))
RETURNS SETOF sessioni
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    PERFORM 1
    FROM campagne c
    WHERE c.id = p_campagna_id
      AND c.id_dm = get_current_user_id()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solo il DM può avviare la sessione' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT s.*
    FROM sessioni s
    WHERE s.campagna_id = p_campagna_id
      AND s.data_fine IS NULL
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;

    RETURN QUERY
    INSERT INTO sessioni(campagna_id, data_inizio)
    VALUES (p_campagna_id, NOW())
    RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION finish_campaign_session(p_sessione_id VARCHAR(10))
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sessioni s
        JOIN campagne c ON c.id = s.campagna_id
        WHERE s.id = p_sessione_id
          AND c.id_dm = get_current_user_id()
        FOR UPDATE OF s, c
    ) THEN
        RAISE EXCEPTION 'Solo il DM può terminare la sessione' USING ERRCODE = '42501';
    END IF;

    DELETE FROM richieste_tiro_iniziativa WHERE sessione_id = p_sessione_id;
    DELETE FROM richieste_tiro_generico WHERE sessione_id = p_sessione_id;
    DELETE FROM iniziativa WHERE sessione_id = p_sessione_id;
    DELETE FROM combat_timers WHERE sessione_id = p_sessione_id;
    DELETE FROM mostri_combattimento WHERE sessione_id = p_sessione_id;

    UPDATE sessioni
    SET data_fine = COALESCE(data_fine, NOW()),
        combat_round = 1,
        combat_turn_index = 0
    WHERE id = p_sessione_id;
END;
$$;

CREATE OR REPLACE FUNCTION finish_combat(p_sessione_id VARCHAR(10))
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sessioni s
        JOIN campagne c ON c.id = s.campagna_id
        WHERE s.id = p_sessione_id
          AND s.data_fine IS NULL
          AND c.id_dm = get_current_user_id()
        FOR UPDATE OF s, c
    ) THEN
        RAISE EXCEPTION 'Solo il DM può terminare il combattimento' USING ERRCODE = '42501';
    END IF;

    DELETE FROM richieste_tiro_iniziativa WHERE sessione_id = p_sessione_id;
    DELETE FROM iniziativa WHERE sessione_id = p_sessione_id;
    DELETE FROM combat_timers WHERE sessione_id = p_sessione_id;
    DELETE FROM mostri_combattimento WHERE sessione_id = p_sessione_id;

    UPDATE sessioni
    SET combat_round = 1,
        combat_turn_index = 0
    WHERE id = p_sessione_id;
END;
$$;

-- p_player_ids resta nella firma per i client già pubblicati; la membership
-- autorevole viene sempre letta dalla campagna sotto lock.
CREATE OR REPLACE FUNCTION request_initiative_rolls(
    p_sessione_id VARCHAR(10),
    p_player_ids VARCHAR(10)[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_campaign_players VARCHAR(10)[];
    v_count INTEGER;
BEGIN
    SELECT COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[])
    INTO v_campaign_players
    FROM sessioni s
    JOIN campagne c ON c.id = s.campagna_id
    WHERE s.id = p_sessione_id
      AND s.data_fine IS NULL
      AND c.id_dm = get_current_user_id()
    FOR UPDATE OF s, c;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solo il DM può richiedere l''iniziativa' USING ERRCODE = '42501';
    END IF;

    DELETE FROM richieste_tiro_iniziativa WHERE sessione_id = p_sessione_id;
    INSERT INTO richieste_tiro_iniziativa(sessione_id, giocatore_id, stato)
    SELECT DISTINCT p_sessione_id, players.player_id, 'pending'
    FROM UNNEST(v_campaign_players) AS players(player_id)
    WHERE players.player_id IS NOT NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION request_generic_rolls(
    p_sessione_id VARCHAR(10),
    p_player_ids VARCHAR(10)[],
    p_tipo_tiro TEXT,
    p_target_tiro TEXT,
    p_tiro_label TEXT
)
RETURNS VARCHAR(10)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_campaign_players VARCHAR(10)[];
    v_richiesta_id VARCHAR(10);
BEGIN
    SELECT COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[])
    INTO v_campaign_players
    FROM sessioni s
    JOIN campagne c ON c.id = s.campagna_id
    WHERE s.id = p_sessione_id
      AND s.data_fine IS NULL
      AND c.id_dm = get_current_user_id()
    FOR UPDATE OF s, c;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solo il DM può richiedere un tiro' USING ERRCODE = '42501';
    END IF;

    IF COALESCE(CARDINALITY(p_player_ids), 0) = 0 THEN
        RAISE EXCEPTION 'Seleziona almeno un giocatore' USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM richieste_tiro_generico
        WHERE sessione_id = p_sessione_id
    ) THEN
        RAISE EXCEPTION 'Chiudi la richiesta tiro corrente prima di crearne un''altra'
            USING ERRCODE = '23505';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM UNNEST(p_player_ids) AS requested(player_id)
        WHERE requested.player_id IS NULL
           OR NOT COALESCE(requested.player_id = ANY(v_campaign_players), FALSE)
    ) THEN
        RAISE EXCEPTION 'Uno o più giocatori non appartengono alla campagna' USING ERRCODE = '22023';
    END IF;

    IF p_tipo_tiro IS NULL
       OR p_tipo_tiro NOT IN ('salvezza', 'abilita', 'caratteristica')
       OR NULLIF(BTRIM(p_target_tiro), '') IS NULL
       OR NULLIF(BTRIM(p_tiro_label), '') IS NULL THEN
        RAISE EXCEPTION 'Metadati tiro non validi' USING ERRCODE = '22023';
    END IF;

    LOOP
        v_richiesta_id := generate_unique_id();
        EXIT WHEN NOT EXISTS (
            SELECT 1
            FROM richieste_tiro_generico
            WHERE sessione_id = p_sessione_id
              AND richiesta_id = v_richiesta_id
        );
    END LOOP;

    INSERT INTO richieste_tiro_generico(
        sessione_id,
        richiesta_id,
        giocatore_id,
        stato,
        tipo_tiro,
        target_tiro,
        tiro_label
    )
    SELECT p_sessione_id,
           v_richiesta_id,
           players.player_id,
           'pending',
           p_tipo_tiro,
           p_target_tiro,
           p_tiro_label
    FROM (
        SELECT DISTINCT requested.player_id
        FROM UNNEST(p_player_ids) AS requested(player_id)
    ) AS players;

    RETURN v_richiesta_id;
END;
$$;

CREATE OR REPLACE FUNCTION advance_combat_turn(
    p_sessione_id VARCHAR(10),
    p_order_length INTEGER,
    p_expected_round INTEGER,
    p_expected_turn_index INTEGER,
    p_next_monster_id VARCHAR(10) DEFAULT NULL
)
RETURNS TABLE (
    combat_round INTEGER,
    combat_turn_index INTEGER,
    expired_timers INTEGER,
    advanced BOOLEAN
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_round INTEGER;
    v_turn INTEGER;
BEGIN
    SELECT COALESCE(s.combat_round, 1), COALESCE(s.combat_turn_index, 0)
    INTO v_round, v_turn
    FROM sessioni s
    JOIN campagne c ON c.id = s.campagna_id
    WHERE s.id = p_sessione_id
      AND s.data_fine IS NULL
      AND c.id_dm = get_current_user_id()
    FOR UPDATE OF s, c;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Combattimento non disponibile' USING ERRCODE = '42501';
    END IF;

    -- L'ordine può accorciarsi tra due turni (per esempio dopo la rimozione
    -- di un mostro): riallinea l'indice persistito prima del confronto ottimistico.
    IF p_order_length > 0 THEN
        v_turn := GREATEST(0, LEAST(v_turn, p_order_length - 1));
    END IF;

    IF p_order_length <= 0
       OR v_round <> p_expected_round
       OR v_turn <> p_expected_turn_index THEN
        RETURN QUERY SELECT v_round, v_turn, 0, FALSE;
        RETURN;
    END IF;

    v_turn := v_turn + 1;
    IF v_turn >= p_order_length THEN
        v_turn := 0;
        v_round := v_round + 1;
    END IF;

    UPDATE sessioni
    SET combat_round = v_round,
        combat_turn_index = v_turn
    WHERE id = p_sessione_id;

    IF p_next_monster_id IS NOT NULL THEN
        UPDATE mostri_combattimento
        SET res_legg_attuali = COALESCE(resistenze_leggendarie, 0),
            azioni_legg_attuali = COALESCE(azioni_legg_max, 0)
        WHERE id = p_next_monster_id
          AND sessione_id = p_sessione_id;
    END IF;

    expired_timers := 0;
    IF v_turn = 0 THEN
        UPDATE combat_timers
        SET remaining_rounds = GREATEST(remaining_rounds - 1, 0)
        WHERE sessione_id = p_sessione_id
          AND expired = FALSE;

        WITH expired AS (
            DELETE FROM combat_timers
            WHERE sessione_id = p_sessione_id
              AND remaining_rounds = 0
            RETURNING 1
        )
        SELECT COUNT(*)::INTEGER INTO expired_timers FROM expired;
    END IF;

    RETURN QUERY SELECT v_round, v_turn, expired_timers, TRUE;
END;
$$;

-- Sessione e campagna devono corrispondere anche sulle scritture dirette del DM.
DROP POLICY IF EXISTS "DM può gestire mostri combattimento" ON mostri_combattimento;
CREATE POLICY "DM può gestire mostri combattimento" ON mostri_combattimento
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM sessioni s
            JOIN campagne c ON c.id = s.campagna_id
            JOIN utenti u ON u.id = c.id_dm
            WHERE s.id = mostri_combattimento.sessione_id
              AND s.campagna_id = mostri_combattimento.campagna_id
              AND s.data_fine IS NULL
              AND u.uid::text = auth.uid()::text
        )
    );

-- I giocatori vedono solo l'ordine pubblico. I dettagli del mostro restano al DM.
DROP POLICY IF EXISTS "Giocatori possono leggere mostri combattimento" ON mostri_combattimento;

-- I timer per mostri possono contenere informazioni riservate del DM.
DROP POLICY IF EXISTS combat_timers_select ON combat_timers;
CREATE POLICY combat_timers_select ON combat_timers
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM sessioni s
            JOIN campagne c ON c.id = s.campagna_id
            JOIN utenti u ON u.uid::text = auth.uid()::text
            WHERE s.id = combat_timers.sessione_id
              AND s.campagna_id = combat_timers.campagna_id
              AND s.data_fine IS NULL
              AND (
                  c.id_dm = u.id
                  OR (
                      u.id = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
                      AND (
                          combat_timers.target_kind = 'global'
                          OR (
                              combat_timers.target_kind = 'player'
                              AND EXISTS (
                                  SELECT 1
                                  FROM personaggi_campagna pc
                                  WHERE pc.campagna_id = c.id
                                    AND pc.user_id = u.id
                                    AND pc.personaggio_id = combat_timers.target_id
                              )
                          )
                      )
                  )
              )
        )
    );

CREATE OR REPLACE FUNCTION get_combat_monsters_safe(p_sessione_id VARCHAR(10))
RETURNS TABLE (
    id VARCHAR(10),
    sessione_id VARCHAR(10),
    nome TEXT,
    iniziativa INTEGER,
    created_at TIMESTAMPTZ,
    pv_attuali INTEGER,
    punti_vita_max INTEGER,
    resistenze_leggendarie INTEGER,
    azioni_legg_max INTEGER,
    concentrazione BOOLEAN,
    accecato BOOLEAN,
    affascinato BOOLEAN,
    afferrato BOOLEAN,
    assordato BOOLEAN,
    avvelenato BOOLEAN,
    incapacitato BOOLEAN,
    invisibile BOOLEAN,
    paralizzato BOOLEAN,
    pietrificato BOOLEAN,
    privo_di_sensi BOOLEAN,
    prono BOOLEAN,
    spaventato BOOLEAN,
    stordito BOOLEAN,
    trattenuto BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id VARCHAR(10) := get_current_user_id();
    v_campagna_id VARCHAR(10);
    v_is_dm BOOLEAN;
BEGIN
    SELECT s.campagna_id, c.id_dm = v_user_id
    INTO v_campagna_id, v_is_dm
    FROM sessioni s
    JOIN campagne c ON c.id = s.campagna_id
    WHERE s.id = p_sessione_id
      AND s.data_fine IS NULL
      AND (
          c.id_dm = v_user_id
          OR v_user_id = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
      );

    IF v_is_dm IS NULL THEN
        RAISE EXCEPTION 'Combattimento non disponibile' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT m.id, m.sessione_id, m.nome, m.iniziativa, m.created_at,
           CASE WHEN v_is_dm THEN m.pv_attuali END,
           CASE WHEN v_is_dm THEN m.punti_vita_max END,
           CASE WHEN v_is_dm THEN m.resistenze_leggendarie END,
           CASE WHEN v_is_dm THEN m.azioni_legg_max END,
           CASE WHEN v_is_dm THEN m.concentrazione END,
           CASE WHEN v_is_dm THEN m.accecato END,
           CASE WHEN v_is_dm THEN m.affascinato END,
           CASE WHEN v_is_dm THEN m.afferrato END,
           CASE WHEN v_is_dm THEN m.assordato END,
           CASE WHEN v_is_dm THEN m.avvelenato END,
           CASE WHEN v_is_dm THEN m.incapacitato END,
           CASE WHEN v_is_dm THEN m.invisibile END,
           CASE WHEN v_is_dm THEN m.paralizzato END,
           CASE WHEN v_is_dm THEN m.pietrificato END,
           CASE WHEN v_is_dm THEN m.privo_di_sensi END,
           CASE WHEN v_is_dm THEN m.prono END,
           CASE WHEN v_is_dm THEN m.spaventato END,
           CASE WHEN v_is_dm THEN m.stordito END,
           CASE WHEN v_is_dm THEN m.trattenuto END
    FROM mostri_combattimento m
    WHERE m.sessione_id = p_sessione_id
      AND m.campagna_id = v_campagna_id
    ORDER BY m.iniziativa DESC NULLS LAST;
END;
$$;

REVOKE EXECUTE ON FUNCTION start_campaign_session(VARCHAR) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION finish_campaign_session(VARCHAR) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION finish_combat(VARCHAR) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION request_initiative_rolls(VARCHAR, VARCHAR[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION request_generic_rolls(VARCHAR, VARCHAR[], TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION advance_combat_turn(VARCHAR, INTEGER, INTEGER, INTEGER, VARCHAR) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_combat_monsters_safe(VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION start_campaign_session(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION finish_campaign_session(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION finish_combat(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION request_initiative_rolls(VARCHAR, VARCHAR[]) TO authenticated;
GRANT EXECUTE ON FUNCTION request_generic_rolls(VARCHAR, VARCHAR[], TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION advance_combat_turn(VARCHAR, INTEGER, INTEGER, INTEGER, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_combat_monsters_safe(VARCHAR) TO authenticated;
