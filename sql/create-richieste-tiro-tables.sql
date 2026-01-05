-- Tabella per richieste tiro iniziativa
CREATE TABLE IF NOT EXISTS richieste_tiro_iniziativa (
    id VARCHAR(10) PRIMARY KEY DEFAULT generate_unique_id(),
    sessione_id VARCHAR(10) NOT NULL REFERENCES sessioni(id) ON DELETE CASCADE,
    giocatore_id VARCHAR(10) NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    valore INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stato TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sessione_id, giocatore_id)
);

-- Tabella per richieste tiro generico
CREATE TABLE IF NOT EXISTS richieste_tiro_generico (
    id VARCHAR(10) PRIMARY KEY DEFAULT generate_unique_id(),
    sessione_id VARCHAR(10) NOT NULL REFERENCES sessioni(id) ON DELETE CASCADE,
    richiesta_id VARCHAR(10) NOT NULL, -- Per raggruppare richieste dello stesso round
    giocatore_id VARCHAR(10) NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    valore INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stato TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sessione_id, richiesta_id, giocatore_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_richieste_tiro_iniziativa_sessione ON richieste_tiro_iniziativa(sessione_id);
CREATE INDEX IF NOT EXISTS idx_richieste_tiro_iniziativa_giocatore ON richieste_tiro_iniziativa(giocatore_id);
CREATE INDEX IF NOT EXISTS idx_richieste_tiro_iniziativa_stato ON richieste_tiro_iniziativa(stato);
CREATE INDEX IF NOT EXISTS idx_richieste_tiro_generico_sessione ON richieste_tiro_generico(sessione_id);
CREATE INDEX IF NOT EXISTS idx_richieste_tiro_generico_richiesta ON richieste_tiro_generico(richiesta_id);
CREATE INDEX IF NOT EXISTS idx_richieste_tiro_generico_giocatore ON richieste_tiro_generico(giocatore_id);
CREATE INDEX IF NOT EXISTS idx_richieste_tiro_generico_stato ON richieste_tiro_generico(stato);

-- RLS Policies per richieste_tiro_iniziativa
ALTER TABLE richieste_tiro_iniziativa ENABLE ROW LEVEL SECURITY;

-- Gli utenti possono vedere le proprie richieste e quelle della sessione se hanno accesso
CREATE POLICY "Utenti possono vedere richieste iniziativa sessioni accessibili"
    ON richieste_tiro_iniziativa FOR SELECT
    USING (
        giocatore_id = (SELECT id FROM utenti WHERE uid = auth.uid()::text)
        OR
        EXISTS (
            SELECT 1 FROM sessioni
            JOIN campagne ON campagne.id = sessioni.campagna_id
            WHERE sessioni.id = richieste_tiro_iniziativa.sessione_id
            AND (
                campagne.id_dm = (SELECT id FROM utenti WHERE uid = auth.uid()::text)
                OR
                (SELECT id FROM utenti WHERE uid = auth.uid()::text) = ANY(campagne.giocatori)
            )
        )
    );

-- Gli utenti possono aggiornare solo le proprie richieste (per inserire il valore del tiro)
CREATE POLICY "Utenti possono aggiornare proprie richieste iniziativa"
    ON richieste_tiro_iniziativa FOR UPDATE
    USING (giocatore_id = (SELECT id FROM utenti WHERE uid = auth.uid()::text));

-- Solo il DM può creare/eliminare richieste
CREATE POLICY "Solo DM può gestire richieste iniziativa"
    ON richieste_tiro_iniziativa FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM sessioni
            JOIN campagne ON campagne.id = sessioni.campagna_id
            WHERE sessioni.id = richieste_tiro_iniziativa.sessione_id
            AND campagne.id_dm = (SELECT id FROM utenti WHERE uid = auth.uid()::text)
        )
    );

-- RLS Policies per richieste_tiro_generico
ALTER TABLE richieste_tiro_generico ENABLE ROW LEVEL SECURITY;

-- Gli utenti possono vedere le proprie richieste e quelle della sessione se hanno accesso
CREATE POLICY "Utenti possono vedere richieste tiro generico sessioni accessibili"
    ON richieste_tiro_generico FOR SELECT
    USING (
        giocatore_id = (SELECT id FROM utenti WHERE uid = auth.uid()::text)
        OR
        EXISTS (
            SELECT 1 FROM sessioni
            JOIN campagne ON campagne.id = sessioni.campagna_id
            WHERE sessioni.id = richieste_tiro_generico.sessione_id
            AND (
                campagne.id_dm = (SELECT id FROM utenti WHERE uid = auth.uid()::text)
                OR
                (SELECT id FROM utenti WHERE uid = auth.uid()::text) = ANY(campagne.giocatori)
            )
        )
    );

-- Gli utenti possono aggiornare solo le proprie richieste (per inserire il valore del tiro)
CREATE POLICY "Utenti possono aggiornare proprie richieste tiro generico"
    ON richieste_tiro_generico FOR UPDATE
    USING (giocatore_id = (SELECT id FROM utenti WHERE uid = auth.uid()::text));

-- Solo il DM può creare/eliminare richieste
CREATE POLICY "Solo DM può gestire richieste tiro generico"
    ON richieste_tiro_generico FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM sessioni
            JOIN campagne ON campagne.id = sessioni.campagna_id
            WHERE sessioni.id = richieste_tiro_generico.sessione_id
            AND campagne.id_dm = (SELECT id FROM utenti WHERE uid = auth.uid()::text)
        )
    );

