-- Tabella Inviti Campagna
-- Gli utenti possono invitare amici a partecipare alle loro campagne

CREATE TABLE IF NOT EXISTS inviti_campagna (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campagna_id UUID NOT NULL REFERENCES campagne(id) ON DELETE CASCADE,
    inviante_id UUID NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    invitato_id UUID NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    stato TEXT NOT NULL DEFAULT 'pending' CHECK (stato IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (inviante_id != invitato_id),
    UNIQUE(campagna_id, invitato_id) -- Un utente può ricevere un solo invito per campagna
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_inviti_campagna_campagna_id ON inviti_campagna(campagna_id);
CREATE INDEX IF NOT EXISTS idx_inviti_campagna_invitato_id ON inviti_campagna(invitato_id);
CREATE INDEX IF NOT EXISTS idx_inviti_campagna_stato ON inviti_campagna(stato);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_inviti_campagna_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inviti_campagna_updated_at
    BEFORE UPDATE ON inviti_campagna
    FOR EACH ROW
    EXECUTE FUNCTION update_inviti_campagna_updated_at();

-- RLS Policies per inviti_campagna

-- Abilita RLS
ALTER TABLE inviti_campagna ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere gli inviti che hanno inviato o ricevuto
CREATE POLICY "Utenti possono vedere i propri inviti"
    ON inviti_campagna FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE (utenti.id = inviti_campagna.inviante_id OR utenti.id = inviti_campagna.invitato_id)
            AND utenti.uid = auth.uid()::text
        )
    );

-- Policy: Gli utenti possono creare inviti per le campagne di cui sono proprietari
CREATE POLICY "Utenti possono creare inviti per le proprie campagne"
    ON inviti_campagna FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM utenti u
            JOIN campagne c ON c.user_id = u.id
            WHERE u.uid = auth.uid()::text
            AND c.id = inviti_campagna.campagna_id
            AND u.id = inviti_campagna.inviante_id
        )
    );

-- Policy: Gli utenti possono aggiornare (accettare/rifiutare) gli inviti che hanno ricevuto
CREATE POLICY "Utenti possono aggiornare inviti ricevuti"
    ON inviti_campagna FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = inviti_campagna.invitato_id
            AND utenti.uid = auth.uid()::text
        )
    );

-- Policy: Gli utenti possono eliminare gli inviti che hanno inviato o ricevuto
CREATE POLICY "Utenti possono eliminare i propri inviti"
    ON inviti_campagna FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE (utenti.id = inviti_campagna.inviante_id OR utenti.id = inviti_campagna.invitato_id)
            AND utenti.uid = auth.uid()::text
        )
    );

