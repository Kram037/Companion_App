-- ============================================================
-- Update get_personaggio_campagna to include new columns
-- Run this in the Supabase SQL editor
-- ============================================================

DROP FUNCTION IF EXISTS get_personaggio_campagna(VARCHAR(10), VARCHAR(10));

CREATE OR REPLACE FUNCTION get_personaggio_campagna(p_campagna_id VARCHAR(10), p_user_id VARCHAR(10))
RETURNS TABLE (
    id VARCHAR(10),
    nome TEXT,
    razza TEXT,
    classe TEXT,
    classi JSONB,
    livello INTEGER,
    forza INTEGER,
    destrezza INTEGER,
    costituzione INTEGER,
    intelligenza INTEGER,
    saggezza INTEGER,
    carisma INTEGER,
    punti_vita_max INTEGER,
    iniziativa INTEGER,
    classe_armatura INTEGER,
    percezione_passiva INTEGER,
    velocita DECIMAL(5,1),
    tiri_salvezza JSONB,
    competenze_abilita JSONB
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
    SELECT p.id, p.nome, p.razza, p.classe, p.classi, p.livello,
           p.forza, p.destrezza, p.costituzione, p.intelligenza, p.saggezza, p.carisma,
           p.punti_vita_max, p.iniziativa, p.classe_armatura, p.percezione_passiva,
           p.velocita,
           p.tiri_salvezza, p.competenze_abilita
    FROM personaggi_campagna pc
    JOIN personaggi p ON p.id = pc.personaggio_id
    WHERE pc.campagna_id = p_campagna_id
    AND pc.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_personaggio_campagna(VARCHAR(10), VARCHAR(10)) TO authenticated;
