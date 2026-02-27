-- Tabella personaggi
CREATE TABLE IF NOT EXISTS personaggi (
    id VARCHAR(10) PRIMARY KEY DEFAULT generate_unique_id(),
    user_id VARCHAR(10) NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    razza TEXT,
    classe TEXT,
    livello INTEGER DEFAULT 1,
    forza INTEGER DEFAULT 10,
    destrezza INTEGER DEFAULT 10,
    costituzione INTEGER DEFAULT 10,
    intelligenza INTEGER DEFAULT 10,
    saggezza INTEGER DEFAULT 10,
    carisma INTEGER DEFAULT 10,
    punti_vita_max INTEGER DEFAULT 10,
    iniziativa INTEGER,
    classe_armatura INTEGER DEFAULT 10,
    percezione_passiva INTEGER DEFAULT 10,
    velocita DECIMAL(5,1) DEFAULT 9.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella associativa personaggio-campagna
CREATE TABLE IF NOT EXISTS personaggi_campagna (
    id VARCHAR(10) PRIMARY KEY DEFAULT generate_unique_id(),
    campagna_id VARCHAR(10) NOT NULL REFERENCES campagne(id) ON DELETE CASCADE,
    user_id VARCHAR(10) NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    personaggio_id VARCHAR(10) NOT NULL REFERENCES personaggi(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campagna_id, user_id)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_personaggi_user ON personaggi(user_id);
CREATE INDEX IF NOT EXISTS idx_personaggi_campagna_campagna ON personaggi_campagna(campagna_id);
CREATE INDEX IF NOT EXISTS idx_personaggi_campagna_user ON personaggi_campagna(user_id);
CREATE INDEX IF NOT EXISTS idx_personaggi_campagna_personaggio ON personaggi_campagna(personaggio_id);

-- RLS
ALTER TABLE personaggi ENABLE ROW LEVEL SECURITY;
ALTER TABLE personaggi_campagna ENABLE ROW LEVEL SECURITY;

-- Personaggi: ogni utente vede e gestisce solo i propri
CREATE POLICY "Utenti vedono propri personaggi"
    ON personaggi FOR SELECT
    USING (user_id = (SELECT id FROM utenti WHERE uid = auth.uid()::text));

CREATE POLICY "Utenti gestiscono propri personaggi"
    ON personaggi FOR ALL
    USING (user_id = (SELECT id FROM utenti WHERE uid = auth.uid()::text));

-- Personaggi visibili anche ai membri della stessa campagna (per vedere i personaggi degli altri)
CREATE POLICY "Membri campagna vedono personaggi campagna"
    ON personaggi FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM personaggi_campagna pc
            JOIN campagne c ON c.id = pc.campagna_id
            WHERE pc.personaggio_id = personaggi.id
            AND (
                c.id_dm = (SELECT id FROM utenti WHERE uid = auth.uid()::text)
                OR (SELECT id FROM utenti WHERE uid = auth.uid()::text) = ANY(c.giocatori)
            )
        )
    );

-- Personaggi_campagna: membri della campagna possono vedere
CREATE POLICY "Membri vedono associazioni personaggi"
    ON personaggi_campagna FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campagne c
            WHERE c.id = personaggi_campagna.campagna_id
            AND (
                c.id_dm = (SELECT id FROM utenti WHERE uid = auth.uid()::text)
                OR (SELECT id FROM utenti WHERE uid = auth.uid()::text) = ANY(c.giocatori)
            )
        )
    );

-- Solo il proprietario può gestire la propria associazione
CREATE POLICY "Utenti gestiscono proprie associazioni"
    ON personaggi_campagna FOR ALL
    USING (user_id = (SELECT id FROM utenti WHERE uid = auth.uid()::text));

-- RPC per ottenere i personaggi di un utente
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
           p.punti_vita_max, p.iniziativa, p.classe_armatura, p.percezione_passiva,
           p.velocita, p.created_at, p.updated_at
    FROM personaggi p
    WHERE p.user_id = v_user_id
    ORDER BY p.updated_at DESC;
END;
$$;

-- RPC per ottenere il personaggio scelto da un giocatore in una campagna
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
           p.punti_vita_max, p.iniziativa, p.classe_armatura, p.percezione_passiva,
           p.velocita
    FROM personaggi_campagna pc
    JOIN personaggi p ON p.id = pc.personaggio_id
    WHERE pc.campagna_id = p_campagna_id
    AND pc.user_id = p_user_id;
END;
$$;

-- RPC per ottenere tutti i personaggi associati a una campagna
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
           p.nome, p.razza, p.classe, p.livello, p.iniziativa,
           p.punti_vita_max, p.classe_armatura,
           u.nome_utente AS player_nome
    FROM personaggi_campagna pc
    JOIN personaggi p ON p.id = pc.personaggio_id
    JOIN utenti u ON u.id = pc.user_id
    WHERE pc.campagna_id = p_campagna_id;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION get_personaggi_utente() TO authenticated;
GRANT EXECUTE ON FUNCTION get_personaggio_campagna(VARCHAR(10), VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_personaggi_in_campagna(VARCHAR(10)) TO authenticated;
