-- ============================================================
-- Migration: Add resistenze, spell_slots, conditions to personaggi
-- Run this in the Supabase SQL editor
-- ============================================================

-- Resistenze (JSONB array of strings, e.g. ["fuoco","freddo","veleno"])
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS resistenze JSONB DEFAULT '[]';

-- Spell slots: JSONB object tracking max and current for each level
-- e.g. {"1":{"max":4,"current":4},"2":{"max":3,"current":2},...}
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS slot_incantesimo JSONB DEFAULT '{}';

-- Conditions (boolean)
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS concentrazione BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS accecato BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS affascinato BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS afferrato BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS assordato BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS avvelenato BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS incapacitato BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS invisibile BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS paralizzato BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS pietrificato BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS privo_di_sensi BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS prono BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS spaventato BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS stordito BOOLEAN DEFAULT FALSE;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS trattenuto BOOLEAN DEFAULT FALSE;

-- Exhaustion (0-6)
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS esaustione INTEGER DEFAULT 0;

-- ============================================================
-- Update RPCs to include new columns
-- ============================================================

DROP FUNCTION IF EXISTS get_personaggi_utente();

CREATE OR REPLACE FUNCTION get_personaggi_utente()
RETURNS TABLE (
    id VARCHAR(10),
    user_id VARCHAR(10),
    nome TEXT,
    razza TEXT,
    classe TEXT,
    classi JSONB,
    livello INT,
    forza INT,
    destrezza INT,
    costituzione INT,
    intelligenza INT,
    saggezza INT,
    carisma INT,
    punti_vita_max INT,
    iniziativa INT,
    classe_armatura INT,
    percezione_passiva INT,
    velocita NUMERIC,
    tiri_salvezza JSONB,
    competenze_abilita JSONB,
    resistenze JSONB,
    slot_incantesimo JSONB,
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
    trattenuto BOOLEAN,
    esaustione INT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT p.id, p.user_id, p.nome, p.razza, p.classe, p.classi, p.livello,
           p.forza, p.destrezza, p.costituzione, p.intelligenza, p.saggezza, p.carisma,
           p.punti_vita_max, p.iniziativa, p.classe_armatura, p.percezione_passiva, p.velocita,
           p.tiri_salvezza, p.competenze_abilita, p.resistenze, p.slot_incantesimo,
           p.concentrazione, p.accecato, p.affascinato, p.afferrato, p.assordato, p.avvelenato,
           p.incapacitato, p.invisibile, p.paralizzato, p.pietrificato, p.privo_di_sensi,
           p.prono, p.spaventato, p.stordito, p.trattenuto, p.esaustione,
           p.created_at, p.updated_at
    FROM personaggi p
    WHERE p.user_id = (SELECT u.id FROM utenti u WHERE u.uid = auth.uid()::text)
    ORDER BY p.updated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_personaggi_utente() TO authenticated;

-- Update get_personaggio_campagna
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
    competenze_abilita JSONB,
    resistenze JSONB,
    slot_incantesimo JSONB,
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
    trattenuto BOOLEAN,
    esaustione INTEGER
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
           p.velocita, p.tiri_salvezza, p.competenze_abilita,
           p.resistenze, p.slot_incantesimo,
           p.concentrazione, p.accecato, p.affascinato, p.afferrato, p.assordato, p.avvelenato,
           p.incapacitato, p.invisibile, p.paralizzato, p.pietrificato, p.privo_di_sensi,
           p.prono, p.spaventato, p.stordito, p.trattenuto, p.esaustione
    FROM personaggi_campagna pc
    JOIN personaggi p ON p.id = pc.personaggio_id
    WHERE pc.campagna_id = p_campagna_id
    AND pc.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_personaggio_campagna(VARCHAR(10), VARCHAR(10)) TO authenticated;

-- Update get_personaggi_in_campagna to include conditions
DROP FUNCTION IF EXISTS get_personaggi_in_campagna(VARCHAR(10));

CREATE OR REPLACE FUNCTION get_personaggi_in_campagna(p_campagna_id VARCHAR(10))
RETURNS TABLE (
    personaggio_id VARCHAR(10),
    player_user_id VARCHAR(10),
    nome TEXT,
    razza TEXT,
    classe TEXT,
    livello INTEGER,
    iniziativa INTEGER,
    punti_vita_max INTEGER,
    classe_armatura INTEGER,
    player_nome TEXT,
    concentrazione BOOLEAN,
    esaustione INTEGER
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
           p.nome, p.razza, p.classe, p.livello, p.iniziativa,
           p.punti_vita_max, p.classe_armatura,
           u.nome_utente AS player_nome,
           p.concentrazione, p.esaustione
    FROM personaggi_campagna pc
    JOIN personaggi p ON p.id = pc.personaggio_id
    JOIN utenti u ON u.id = pc.user_id
    WHERE pc.campagna_id = p_campagna_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_personaggi_in_campagna(VARCHAR(10)) TO authenticated;

-- Allow DM to update character conditions during sessions
DROP POLICY IF EXISTS "DM può aggiornare condizioni personaggi in campagna" ON personaggi;
CREATE POLICY "DM può aggiornare condizioni personaggi in campagna"
    ON personaggi FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM personaggi_campagna pc
            JOIN campagne c ON c.id = pc.campagna_id
            WHERE pc.personaggio_id = personaggi.id
            AND c.id_dm = (SELECT id FROM utenti WHERE uid = auth.uid()::text)
        )
    );
