-- Monsters (volatile, per combat session)
CREATE TABLE IF NOT EXISTS mostri_combattimento (
    id VARCHAR(10) PRIMARY KEY DEFAULT SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 10),
    sessione_id VARCHAR(10) NOT NULL REFERENCES sessioni(id) ON DELETE CASCADE,
    campagna_id VARCHAR(10) NOT NULL REFERENCES campagne(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipologia TEXT DEFAULT 'Bestia',
    taglia TEXT DEFAULT 'Media',
    allineamento TEXT DEFAULT 'Neutrale',
    grado_sfida TEXT DEFAULT '0',
    forza INTEGER DEFAULT 10,
    destrezza INTEGER DEFAULT 10,
    costituzione INTEGER DEFAULT 10,
    intelligenza INTEGER DEFAULT 10,
    saggezza INTEGER DEFAULT 10,
    carisma INTEGER DEFAULT 10,
    punti_vita_max INTEGER DEFAULT 10,
    pv_attuali INTEGER DEFAULT 10,
    classe_armatura INTEGER DEFAULT 10,
    velocita NUMERIC DEFAULT 9,
    iniziativa INTEGER,
    tiri_salvezza JSONB DEFAULT '[]',
    competenze_abilita JSONB DEFAULT '[]',
    resistenze JSONB DEFAULT '[]',
    immunita JSONB DEFAULT '[]',
    concentrazione BOOLEAN DEFAULT FALSE,
    accecato BOOLEAN DEFAULT FALSE,
    affascinato BOOLEAN DEFAULT FALSE,
    afferrato BOOLEAN DEFAULT FALSE,
    assordato BOOLEAN DEFAULT FALSE,
    avvelenato BOOLEAN DEFAULT FALSE,
    incapacitato BOOLEAN DEFAULT FALSE,
    invisibile BOOLEAN DEFAULT FALSE,
    paralizzato BOOLEAN DEFAULT FALSE,
    pietrificato BOOLEAN DEFAULT FALSE,
    privo_di_sensi BOOLEAN DEFAULT FALSE,
    prono BOOLEAN DEFAULT FALSE,
    spaventato BOOLEAN DEFAULT FALSE,
    stordito BOOLEAN DEFAULT FALSE,
    trattenuto BOOLEAN DEFAULT FALSE,
    esaustione INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mostri_combattimento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "DM può gestire mostri combattimento" ON mostri_combattimento;
CREATE POLICY "DM può gestire mostri combattimento" ON mostri_combattimento
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM campagne c
        JOIN utenti u ON u.id = c.id_dm
        WHERE c.id = mostri_combattimento.campagna_id
        AND u.uid = auth.uid()::text
    )
);

DROP POLICY IF EXISTS "Giocatori possono leggere mostri combattimento" ON mostri_combattimento;
CREATE POLICY "Giocatori possono leggere mostri combattimento" ON mostri_combattimento
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM personaggi_campagna pc
        JOIN utenti u ON u.id = pc.user_id
        WHERE pc.campagna_id = mostri_combattimento.campagna_id
        AND u.uid = auth.uid()::text
    )
);

-- Add round/turn tracking to sessioni
ALTER TABLE sessioni ADD COLUMN IF NOT EXISTS combat_round INTEGER DEFAULT 1;
ALTER TABLE sessioni ADD COLUMN IF NOT EXISTS combat_turn_index INTEGER DEFAULT 0;
