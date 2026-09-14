-- Espone il contatore di ispirazione ai membri della campagna.

BEGIN;

ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS ispirazione INTEGER DEFAULT 0;

DROP FUNCTION IF EXISTS get_personaggi_in_campagna(VARCHAR(10));

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
    player_nome TEXT,
    ispirazione INTEGER
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
           u.nome_utente, COALESCE(p.ispirazione, 0)
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

REVOKE EXECUTE ON FUNCTION get_personaggi_in_campagna(VARCHAR(10)) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_personaggi_in_campagna(VARCHAR(10)) FROM anon;
GRANT EXECUTE ON FUNCTION get_personaggi_in_campagna(VARCHAR(10)) TO authenticated;

COMMIT;
