-- Associazioni personaggio-campagna: ownership strutturale e scritture solo via RPC.

BEGIN;

DO $$
DECLARE
    v_invalid_links TEXT;
BEGIN
    SELECT STRING_AGG(
        FORMAT(
            '%s (personaggio %s): associazione=%s, proprietario=%s',
            pc.id,
            pc.personaggio_id,
            pc.user_id,
            p.user_id
        ),
        '; ' ORDER BY pc.id
    )
    INTO v_invalid_links
    FROM personaggi_campagna pc
    LEFT JOIN personaggi p ON p.id = pc.personaggio_id
    WHERE p.id IS NULL
       OR p.user_id IS DISTINCT FROM pc.user_id;

    IF v_invalid_links IS NOT NULL THEN
        RAISE EXCEPTION 'Associazioni personaggio-campagna incoerenti: %', v_invalid_links
            USING ERRCODE = '23503',
                  HINT = 'Correggi manualmente user_id prima di applicare harden-personaggi-campagna.sql.';
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS personaggi_id_user_id_key
    ON personaggi(id, user_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'personaggi_campagna'::regclass
          AND conname = 'personaggi_campagna_character_owner_fkey'
    ) THEN
        ALTER TABLE personaggi_campagna
            ADD CONSTRAINT personaggi_campagna_character_owner_fkey
            FOREIGN KEY (personaggio_id, user_id)
            REFERENCES personaggi(id, user_id)
            ON DELETE CASCADE;
    END IF;
END;
$$;

DROP POLICY IF EXISTS "Utenti gestiscono proprie associazioni" ON personaggi_campagna;
REVOKE INSERT, UPDATE, DELETE ON TABLE personaggi_campagna FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE personaggi_campagna TO authenticated;

DROP POLICY IF EXISTS "Membri campagna vedono personaggi campagna" ON personaggi;
CREATE POLICY "Membri campagna vedono personaggi campagna"
    ON personaggi FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM personaggi_campagna pc
            JOIN campagne c ON c.id = pc.campagna_id
            WHERE pc.personaggio_id = personaggi.id
              AND pc.user_id = personaggi.user_id
              AND (
                  pc.user_id = c.id_dm
                  OR pc.user_id = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
              )
              AND (
                  c.id_dm = (SELECT u.id FROM utenti u WHERE u.uid = auth.uid()::text)
                  OR (SELECT u.id FROM utenti u WHERE u.uid = auth.uid()::text)
                      = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
              )
        )
    );

DROP POLICY IF EXISTS "DM può aggiornare condizioni personaggi in campagna" ON personaggi;

DROP POLICY IF EXISTS "Membri vedono associazioni personaggi" ON personaggi_campagna;
CREATE POLICY "Membri vedono associazioni personaggi"
    ON personaggi_campagna FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM campagne c
            WHERE c.id = personaggi_campagna.campagna_id
              AND (
                  personaggi_campagna.user_id = c.id_dm
                  OR personaggi_campagna.user_id
                      = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
              )
              AND (
                  c.id_dm = (SELECT u.id FROM utenti u WHERE u.uid = auth.uid()::text)
                  OR (SELECT u.id FROM utenti u WHERE u.uid = auth.uid()::text)
                      = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
              )
        )
    );

CREATE OR REPLACE FUNCTION select_personaggio_campagna(
    p_campagna_id VARCHAR(10),
    p_personaggio_id VARCHAR(10)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_user_id VARCHAR(10);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato' USING ERRCODE = '42501';
    END IF;

    SELECT u.id
    INTO v_current_user_id
    FROM utenti u
    WHERE u.uid = auth.uid()::text;

    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato' USING ERRCODE = '42501';
    END IF;

    PERFORM 1
    FROM campagne c
    WHERE c.id = p_campagna_id
      AND (
          c.id_dm = v_current_user_id
          OR v_current_user_id = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
      )
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Campagna non disponibile' USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM personaggi p
        WHERE p.id = p_personaggio_id
          AND p.user_id = v_current_user_id
    ) THEN
        RAISE EXCEPTION 'Personaggio non disponibile' USING ERRCODE = '42501';
    END IF;

    INSERT INTO personaggi_campagna(campagna_id, user_id, personaggio_id, created_at)
    VALUES (p_campagna_id, v_current_user_id, p_personaggio_id, NOW())
    ON CONFLICT (campagna_id, user_id)
    DO UPDATE SET
        personaggio_id = EXCLUDED.personaggio_id,
        created_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION get_personaggio_campagna(
    p_campagna_id VARCHAR(10),
    p_user_id VARCHAR(10)
)
RETURNS TABLE (
    id VARCHAR(10),
    nome TEXT,
    razza TEXT,
    classe TEXT,
    livello INTEGER,
    forza INTEGER,
    destrezza INTEGER,
    costituzione INTEGER,
    intelligenza INTEGER,
    saggezza INTEGER,
    carisma INTEGER,
    esperienza INTEGER,
    punti_vita_max INTEGER,
    iniziativa INTEGER,
    classe_armatura INTEGER,
    percezione_passiva INTEGER,
    velocita DECIMAL(5,1)
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
        RAISE EXCEPTION 'Non autorizzato' USING ERRCODE = '42501';
    END IF;

    SELECT u.id
    INTO v_current_user_id
    FROM utenti u
    WHERE u.uid = auth.uid()::text;

    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato' USING ERRCODE = '42501';
    END IF;

    SELECT c.id_dm, COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[])
    INTO v_id_dm, v_giocatori
    FROM campagne c
    WHERE c.id = p_campagna_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Campagna non trovata' USING ERRCODE = 'P0002';
    END IF;

    IF v_current_user_id IS DISTINCT FROM v_id_dm
       AND NOT COALESCE(v_current_user_id = ANY(v_giocatori), FALSE) THEN
        RAISE EXCEPTION 'Non autorizzato' USING ERRCODE = '42501';
    END IF;

    IF p_user_id IS DISTINCT FROM v_id_dm
       AND NOT COALESCE(p_user_id = ANY(v_giocatori), FALSE) THEN
        RAISE EXCEPTION 'Giocatore non appartenente alla campagna' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT p.id, p.nome, p.razza, p.classe, p.livello,
           p.forza, p.destrezza, p.costituzione, p.intelligenza, p.saggezza, p.carisma,
           p.esperienza, p.punti_vita_max, p.iniziativa, p.classe_armatura, p.percezione_passiva,
           p.velocita
    FROM personaggi_campagna pc
    JOIN personaggi p
      ON p.id = pc.personaggio_id
     AND p.user_id = pc.user_id
    WHERE pc.campagna_id = p_campagna_id
      AND pc.user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_personaggi_in_campagna(p_campagna_id VARCHAR(10))
RETURNS TABLE (
    personaggio_id VARCHAR(10),
    player_user_id VARCHAR(10),
    nome TEXT,
    razza TEXT,
    classe TEXT,
    livello INTEGER,
    esperienza INTEGER,
    iniziativa INTEGER,
    punti_vita_max INTEGER,
    classe_armatura INTEGER,
    player_nome TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
    v_user_id VARCHAR(10);
    v_id_dm VARCHAR(10);
    v_giocatori VARCHAR(10)[];
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato' USING ERRCODE = '42501';
    END IF;

    SELECT u.id
    INTO v_user_id
    FROM utenti u
    WHERE u.uid = auth.uid()::text;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato' USING ERRCODE = '42501';
    END IF;

    SELECT c.id_dm, COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[])
    INTO v_id_dm, v_giocatori
    FROM campagne c
    WHERE c.id = p_campagna_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Campagna non trovata' USING ERRCODE = 'P0002';
    END IF;

    IF v_user_id IS DISTINCT FROM v_id_dm
       AND NOT COALESCE(v_user_id = ANY(v_giocatori), FALSE) THEN
        RAISE EXCEPTION 'Non autorizzato' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT pc.personaggio_id, pc.user_id,
           p.nome, p.razza, p.classe, p.livello, p.esperienza, p.iniziativa,
           p.punti_vita_max, p.classe_armatura,
           u.nome_utente
    FROM personaggi_campagna pc
    JOIN personaggi p
      ON p.id = pc.personaggio_id
     AND p.user_id = pc.user_id
    JOIN utenti u ON u.id = pc.user_id
    WHERE pc.campagna_id = p_campagna_id
      AND (
          pc.user_id = v_id_dm
          OR pc.user_id = ANY(v_giocatori)
      );
END;
$$;

CREATE OR REPLACE FUNCTION update_campaign_character_conditions(
    p_campagna_id VARCHAR(10),
    p_personaggio_id VARCHAR(10),
    p_conditions JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_user_id VARCHAR(10) := get_current_user_id();
    v_extra_keys TEXT;
    v_esaustione INTEGER;
BEGIN
    IF JSONB_TYPEOF(p_conditions) IS DISTINCT FROM 'object' THEN
        RAISE EXCEPTION 'Condizioni non valide' USING ERRCODE = '22023';
    END IF;

    SELECT STRING_AGG(key, ', ' ORDER BY key)
    INTO v_extra_keys
    FROM JSONB_OBJECT_KEYS(p_conditions) AS keys(key)
    WHERE key <> ALL(ARRAY[
        'concentrazione', 'accecato', 'affascinato', 'afferrato', 'assordato',
        'avvelenato', 'incapacitato', 'invisibile', 'paralizzato', 'pietrificato',
        'privo_di_sensi', 'prono', 'spaventato', 'stordito', 'trattenuto', 'esaustione'
    ]::TEXT[]);

    IF v_extra_keys IS NOT NULL OR EXISTS (
        SELECT 1
        FROM JSONB_EACH(p_conditions) AS entry(key, value)
        WHERE key <> 'esaustione' AND JSONB_TYPEOF(value) <> 'boolean'
    ) THEN
        RAISE EXCEPTION 'Campi condizione non validi: %', COALESCE(v_extra_keys, 'tipo')
            USING ERRCODE = '22023';
    END IF;

    IF p_conditions ? 'esaustione'
       AND JSONB_TYPEOF(p_conditions->'esaustione') <> 'number' THEN
        RAISE EXCEPTION 'Esaustione non valida' USING ERRCODE = '22023';
    END IF;

    IF p_conditions ? 'esaustione' THEN
        v_esaustione := (p_conditions->>'esaustione')::INTEGER;
        IF v_esaustione NOT BETWEEN 0 AND 6 THEN
            RAISE EXCEPTION 'Esaustione non valida' USING ERRCODE = '22023';
        END IF;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM personaggi_campagna pc
        JOIN campagne c ON c.id = pc.campagna_id
        WHERE pc.campagna_id = p_campagna_id
          AND pc.personaggio_id = p_personaggio_id
          AND c.id_dm = v_current_user_id
          AND (
              pc.user_id = c.id_dm
              OR pc.user_id = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
          )
    ) THEN
        RAISE EXCEPTION 'Solo il DM può aggiornare le condizioni'
            USING ERRCODE = '42501';
    END IF;

    UPDATE personaggi
    SET concentrazione = CASE WHEN p_conditions ? 'concentrazione' THEN (p_conditions->>'concentrazione')::BOOLEAN ELSE concentrazione END,
        accecato = CASE WHEN p_conditions ? 'accecato' THEN (p_conditions->>'accecato')::BOOLEAN ELSE accecato END,
        affascinato = CASE WHEN p_conditions ? 'affascinato' THEN (p_conditions->>'affascinato')::BOOLEAN ELSE affascinato END,
        afferrato = CASE WHEN p_conditions ? 'afferrato' THEN (p_conditions->>'afferrato')::BOOLEAN ELSE afferrato END,
        assordato = CASE WHEN p_conditions ? 'assordato' THEN (p_conditions->>'assordato')::BOOLEAN ELSE assordato END,
        avvelenato = CASE WHEN p_conditions ? 'avvelenato' THEN (p_conditions->>'avvelenato')::BOOLEAN ELSE avvelenato END,
        incapacitato = CASE WHEN p_conditions ? 'incapacitato' THEN (p_conditions->>'incapacitato')::BOOLEAN ELSE incapacitato END,
        invisibile = CASE WHEN p_conditions ? 'invisibile' THEN (p_conditions->>'invisibile')::BOOLEAN ELSE invisibile END,
        paralizzato = CASE WHEN p_conditions ? 'paralizzato' THEN (p_conditions->>'paralizzato')::BOOLEAN ELSE paralizzato END,
        pietrificato = CASE WHEN p_conditions ? 'pietrificato' THEN (p_conditions->>'pietrificato')::BOOLEAN ELSE pietrificato END,
        privo_di_sensi = CASE WHEN p_conditions ? 'privo_di_sensi' THEN (p_conditions->>'privo_di_sensi')::BOOLEAN ELSE privo_di_sensi END,
        prono = CASE WHEN p_conditions ? 'prono' THEN (p_conditions->>'prono')::BOOLEAN ELSE prono END,
        spaventato = CASE WHEN p_conditions ? 'spaventato' THEN (p_conditions->>'spaventato')::BOOLEAN ELSE spaventato END,
        stordito = CASE WHEN p_conditions ? 'stordito' THEN (p_conditions->>'stordito')::BOOLEAN ELSE stordito END,
        trattenuto = CASE WHEN p_conditions ? 'trattenuto' THEN (p_conditions->>'trattenuto')::BOOLEAN ELSE trattenuto END,
        esaustione = CASE WHEN p_conditions ? 'esaustione' THEN v_esaustione ELSE esaustione END,
        updated_at = NOW()
    WHERE id = p_personaggio_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Personaggio non trovato' USING ERRCODE = 'P0002';
    END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION select_personaggio_campagna(VARCHAR(10), VARCHAR(10)) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_personaggio_campagna(VARCHAR(10), VARCHAR(10)) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_personaggi_in_campagna(VARCHAR(10)) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION update_campaign_character_conditions(VARCHAR(10), VARCHAR(10), JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION select_personaggio_campagna(VARCHAR(10), VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_personaggio_campagna(VARCHAR(10), VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_personaggi_in_campagna(VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION update_campaign_character_conditions(VARCHAR(10), VARCHAR(10), JSONB) TO authenticated;

COMMIT;
