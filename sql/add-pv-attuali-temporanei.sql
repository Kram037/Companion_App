-- Add current HP and temp HP columns
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS pv_attuali INTEGER;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS pv_temporanei INTEGER DEFAULT 0;
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS maestrie_abilita JSONB DEFAULT '[]';

-- Update RPCs
DROP FUNCTION IF EXISTS get_personaggi_utente();
CREATE OR REPLACE FUNCTION get_personaggi_utente()
RETURNS TABLE (
    id VARCHAR(10), user_id VARCHAR(10), nome TEXT, razza TEXT, classe TEXT, classi JSONB, livello INT,
    forza INT, destrezza INT, costituzione INT, intelligenza INT, saggezza INT, carisma INT,
    punti_vita_max INT, pv_attuali INT, pv_temporanei INT, iniziativa INT, classe_armatura INT,
    percezione_passiva INT, velocita NUMERIC, tiri_salvezza JSONB, competenze_abilita JSONB,
    maestrie_abilita JSONB, resistenze JSONB, slot_incantesimo JSONB,
    concentrazione BOOLEAN, accecato BOOLEAN, affascinato BOOLEAN, afferrato BOOLEAN,
    assordato BOOLEAN, avvelenato BOOLEAN, incapacitato BOOLEAN, invisibile BOOLEAN,
    paralizzato BOOLEAN, pietrificato BOOLEAN, privo_di_sensi BOOLEAN, prono BOOLEAN,
    spaventato BOOLEAN, stordito BOOLEAN, trattenuto BOOLEAN, esaustione INT,
    created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT p.id, p.user_id, p.nome, p.razza, p.classe, p.classi, p.livello,
           p.forza, p.destrezza, p.costituzione, p.intelligenza, p.saggezza, p.carisma,
           p.punti_vita_max, p.pv_attuali, p.pv_temporanei, p.iniziativa, p.classe_armatura,
           p.percezione_passiva, p.velocita, p.tiri_salvezza, p.competenze_abilita,
           p.maestrie_abilita, p.resistenze, p.slot_incantesimo,
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

DROP FUNCTION IF EXISTS get_personaggio_campagna(VARCHAR(10), VARCHAR(10));
CREATE OR REPLACE FUNCTION get_personaggio_campagna(p_campagna_id VARCHAR(10), p_user_id VARCHAR(10))
RETURNS TABLE (
    id VARCHAR(10), nome TEXT, razza TEXT, classe TEXT, classi JSONB, livello INTEGER,
    forza INTEGER, destrezza INTEGER, costituzione INTEGER, intelligenza INTEGER, saggezza INTEGER, carisma INTEGER,
    punti_vita_max INTEGER, pv_attuali INTEGER, pv_temporanei INTEGER,
    iniziativa INTEGER, classe_armatura INTEGER, percezione_passiva INTEGER, velocita DECIMAL(5,1),
    tiri_salvezza JSONB, competenze_abilita JSONB, maestrie_abilita JSONB,
    resistenze JSONB, slot_incantesimo JSONB,
    concentrazione BOOLEAN, accecato BOOLEAN, affascinato BOOLEAN, afferrato BOOLEAN,
    assordato BOOLEAN, avvelenato BOOLEAN, incapacitato BOOLEAN, invisibile BOOLEAN,
    paralizzato BOOLEAN, pietrificato BOOLEAN, privo_di_sensi BOOLEAN, prono BOOLEAN,
    spaventato BOOLEAN, stordito BOOLEAN, trattenuto BOOLEAN, esaustione INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non autorizzato'; END IF;
    RETURN QUERY
    SELECT p.id, p.nome, p.razza, p.classe, p.classi, p.livello,
           p.forza, p.destrezza, p.costituzione, p.intelligenza, p.saggezza, p.carisma,
           p.punti_vita_max, p.pv_attuali, p.pv_temporanei,
           p.iniziativa, p.classe_armatura, p.percezione_passiva, p.velocita,
           p.tiri_salvezza, p.competenze_abilita, p.maestrie_abilita,
           p.resistenze, p.slot_incantesimo,
           p.concentrazione, p.accecato, p.affascinato, p.afferrato, p.assordato, p.avvelenato,
           p.incapacitato, p.invisibile, p.paralizzato, p.pietrificato, p.privo_di_sensi,
           p.prono, p.spaventato, p.stordito, p.trattenuto, p.esaustione
    FROM personaggi_campagna pc
    JOIN personaggi p ON p.id = pc.personaggio_id
    WHERE pc.campagna_id = p_campagna_id AND pc.user_id = p_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION get_personaggio_campagna(VARCHAR(10), VARCHAR(10)) TO authenticated;
