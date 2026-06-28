-- Aggiorna le policy RLS sulla tabella campagne per usare id_dm invece di user_id

-- Rimuovi le vecchie policy
DROP POLICY IF EXISTS "Utenti possono vedere le proprie campagne" ON campagne;
DROP POLICY IF EXISTS "Utenti possono creare campagne" ON campagne;
DROP POLICY IF EXISTS "Utenti possono creare le proprie campagne" ON campagne;
DROP POLICY IF EXISTS "Utenti possono aggiornare le proprie campagne" ON campagne;
DROP POLICY IF EXISTS "Utenti possono eliminare le proprie campagne" ON campagne;

-- Nuove policy che usano id_dm invece di user_id

-- SELECT: Gli utenti possono vedere le campagne dove sono DM o dove sono giocatori
CREATE POLICY "Utenti possono vedere campagne come DM o giocatori"
    ON campagne FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = campagne.id_dm
            AND utenti.uid = auth.uid()::text
        )
        OR
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.uid = auth.uid()::text
            AND utenti.id = ANY(campagne.giocatori)
        )
    );

-- INSERT: Gli utenti possono creare campagne e diventare automaticamente DM
CREATE POLICY "Utenti possono creare campagne"
    ON campagne FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = campagne.id_dm
            AND utenti.uid = auth.uid()::text
        )
    );

-- UPDATE: Solo il DM può aggiornare la campagna
CREATE POLICY "Solo il DM può aggiornare la campagna"
    ON campagne FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = campagne.id_dm
            AND utenti.uid = auth.uid()::text
        )
    );

-- DELETE: Solo il DM può eliminare la campagna
CREATE POLICY "Solo il DM può eliminare la campagna"
    ON campagne FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = campagne.id_dm
            AND utenti.uid = auth.uid()::text
        )
    );

