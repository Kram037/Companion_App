-- Tabella Sessioni
CREATE TABLE IF NOT EXISTS sessioni (
    id VARCHAR(10) PRIMARY KEY DEFAULT generate_unique_id(),
    campagna_id VARCHAR(10) NOT NULL REFERENCES campagne(id) ON DELETE CASCADE,
    data_inizio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_fine TIMESTAMP WITH TIME ZONE,
    durata_minuti INTEGER, -- Calcolato alla chiusura
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella Iniziativa (per ordine di turno durante sessione)
CREATE TABLE IF NOT EXISTS iniziativa (
    id VARCHAR(10) PRIMARY KEY DEFAULT generate_unique_id(),
    sessione_id VARCHAR(10) NOT NULL REFERENCES sessioni(id) ON DELETE CASCADE,
    personaggio_nome TEXT NOT NULL, -- Nome personaggio o giocatore
    valore_iniziativa INTEGER NOT NULL, -- Valore d20 + modificatori
    ordine INTEGER NOT NULL, -- Ordine nel turno (1 = primo)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sessione_id, ordine) -- Un ordine per sessione
);

-- Funzione per aggiornare numero_sessioni e tempo_di_gioco quando una
-- sessione viene chiusa. INCREMENTA i valori esistenti invece di
-- ricalcolarli da zero, cosi' eventuali modifiche manuali fatte dal DM
-- nei dettagli della campagna vengono preservate e la nuova sessione
-- viene semplicemente sommata sopra.
CREATE OR REPLACE FUNCTION update_campagna_stats_on_session_close()
RETURNS TRIGGER AS $$
DECLARE
    durata INTEGER;
BEGIN
    -- Solo quando la sessione passa da aperta a chiusa
    IF OLD.data_fine IS NULL AND NEW.data_fine IS NOT NULL THEN
        durata := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NEW.data_fine - NEW.data_inizio)) / 60))::INTEGER;

        -- Salva la durata calcolata sulla riga della sessione
        UPDATE sessioni
        SET durata_minuti = durata
        WHERE id = NEW.id;

        -- Incrementa le statistiche campagna (preserva edit manuali)
        UPDATE campagne
        SET
            numero_sessioni = COALESCE(numero_sessioni, 0) + 1,
            tempo_di_gioco = COALESCE(tempo_di_gioco, 0) + durata
        WHERE id = NEW.campagna_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare statistiche quando una sessione viene chiusa
DROP TRIGGER IF EXISTS trigger_update_campagna_stats_on_session_close ON sessioni;
CREATE TRIGGER trigger_update_campagna_stats_on_session_close
    AFTER UPDATE ON sessioni
    FOR EACH ROW
    WHEN (OLD.data_fine IS NULL AND NEW.data_fine IS NOT NULL)
    EXECUTE FUNCTION update_campagna_stats_on_session_close();

-- RLS Policies per sessioni
ALTER TABLE sessioni ENABLE ROW LEVEL SECURITY;

-- Gli utenti possono vedere le sessioni delle campagne a cui hanno accesso (sono DM o giocatori)
CREATE POLICY "Utenti possono vedere sessioni campagne accessibili"
    ON sessioni FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campagne
            WHERE campagne.id = sessioni.campagna_id
            AND (
                campagne.id_dm = (SELECT id FROM utenti WHERE uid = auth.uid()::text)
                OR
                (SELECT id FROM utenti WHERE uid = auth.uid()::text) = ANY(campagne.giocatori)
            )
        )
    );

-- Solo il DM può creare/aggiornare/eliminare sessioni
CREATE POLICY "Solo DM può gestire sessioni"
    ON sessioni FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM campagne
            WHERE campagne.id = sessioni.campagna_id
            AND campagne.id_dm = (SELECT id FROM utenti WHERE uid = auth.uid()::text)
        )
    );

-- RLS Policies per iniziativa
ALTER TABLE iniziativa ENABLE ROW LEVEL SECURITY;

-- Gli utenti possono vedere l'iniziativa delle sessioni a cui hanno accesso
CREATE POLICY "Utenti possono vedere iniziativa sessioni accessibili"
    ON iniziativa FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessioni
            JOIN campagne ON campagne.id = sessioni.campagna_id
            WHERE sessioni.id = iniziativa.sessione_id
            AND (
                campagne.id_dm = (SELECT id FROM utenti WHERE uid = auth.uid()::text)
                OR
                (SELECT id FROM utenti WHERE uid = auth.uid()::text) = ANY(campagne.giocatori)
            )
        )
    );

-- Solo il DM può gestire l'iniziativa
CREATE POLICY "Solo DM può gestire iniziativa"
    ON iniziativa FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM sessioni
            JOIN campagne ON campagne.id = sessioni.campagna_id
            WHERE sessioni.id = iniziativa.sessione_id
            AND campagne.id_dm = (SELECT id FROM utenti WHERE uid = auth.uid()::text)
        )
    );

