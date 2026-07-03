ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS esperienza INTEGER DEFAULT 0;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS bonus_manuali JSONB DEFAULT '{}';

UPDATE personaggi
SET esperienza = 0
WHERE esperienza IS NULL;

UPDATE personaggi
SET esperienza = (bonus_manuali->>'_esperienza')::integer
WHERE bonus_manuali ? '_esperienza'
  AND (bonus_manuali->>'_esperienza') ~ '^[0-9]+$'
  AND COALESCE(esperienza, 0) = 0;

DROP FUNCTION IF EXISTS get_personaggi_utente();
CREATE OR REPLACE FUNCTION get_personaggi_utente()
RETURNS TABLE (
    id VARCHAR(10),
    user_id VARCHAR(10),
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
    velocita DECIMAL(5,1),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
    v_user_id VARCHAR(10);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    SELECT u.id INTO v_user_id FROM utenti u WHERE u.uid = auth.uid()::text;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;

    RETURN QUERY
    SELECT p.id, p.user_id, p.nome, p.razza, p.classe, p.livello,
           p.forza, p.destrezza, p.costituzione, p.intelligenza, p.saggezza, p.carisma,
           p.esperienza, p.punti_vita_max, p.iniziativa, p.classe_armatura, p.percezione_passiva,
           p.velocita, p.created_at, p.updated_at
    FROM personaggi p
    WHERE p.user_id = v_user_id
    ORDER BY p.updated_at DESC;
END;
$$;

DROP FUNCTION IF EXISTS get_personaggio_campagna(VARCHAR(10), VARCHAR(10));
CREATE OR REPLACE FUNCTION get_personaggio_campagna(p_campagna_id VARCHAR(10), p_user_id VARCHAR(10))
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
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    RETURN QUERY
    SELECT p.id, p.nome, p.razza, p.classe, p.livello,
           p.forza, p.destrezza, p.costituzione, p.intelligenza, p.saggezza, p.carisma,
           p.esperienza, p.punti_vita_max, p.iniziativa, p.classe_armatura, p.percezione_passiva,
           p.velocita
    FROM personaggi_campagna pc
    JOIN personaggi p ON p.id = pc.personaggio_id
    WHERE pc.campagna_id = p_campagna_id
    AND pc.user_id = p_user_id;
END;
$$;

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
    player_nome TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
    v_user_id VARCHAR(10);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    SELECT u.id INTO v_user_id FROM utenti u WHERE u.uid = auth.uid()::text;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;

    RETURN QUERY
    SELECT pc.personaggio_id, pc.user_id AS player_user_id,
           p.nome, p.razza, p.classe, p.livello, p.esperienza, p.iniziativa,
           p.punti_vita_max, p.classe_armatura,
           u.nome_utente AS player_nome
    FROM personaggi_campagna pc
    JOIN personaggi p ON p.id = pc.personaggio_id
    JOIN utenti u ON u.id = pc.user_id
    WHERE pc.campagna_id = p_campagna_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_personaggi_utente() TO authenticated;
GRANT EXECUTE ON FUNCTION get_personaggio_campagna(VARCHAR(10), VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_personaggi_in_campagna(VARCHAR(10)) TO authenticated;
