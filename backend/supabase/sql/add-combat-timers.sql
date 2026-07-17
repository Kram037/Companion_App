-- =====================================================================
-- Combat Timers
-- ---------------------------------------------------------------------
-- Timer collegati al giro di iniziativa di un combattimento attivo.
--   * Possono essere creati dal DM (target = mostro o "global") o dai
--     giocatori (target = il loro personaggio, sempre).
--   * "duration_rounds" = numero totale di round (1 minuto = 10 round).
--   * "remaining_rounds" viene decrementato ad ogni avanzamento di
--     round (combatNextTurn) e quando arriva a 0 il timer scade
--     automaticamente.
--   * "conditions" e' un array opzionale di chiavi-condizione D&D che,
--     quando il timer e' attivo, vengono applicate al target. Allo
--     scadere del timer queste vengono rimosse (solo quelle che il
--     timer stesso aveva applicato).
--
-- IMPORTANTE: in questo schema le PK delle tabelle correlate sono
-- VARCHAR(10) (vedi create-sessioni-table.sql, create-personaggi.sql,
-- add-mostri-combattimento.sql), non UUID. Per questo motivo anche le
-- foreign key qui sotto sono dichiarate come VARCHAR(10).
-- =====================================================================

CREATE TABLE IF NOT EXISTS combat_timers (
    id              VARCHAR(10) PRIMARY KEY
                    DEFAULT SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 10),
    sessione_id     VARCHAR(10) NOT NULL REFERENCES sessioni(id) ON DELETE CASCADE,
    campagna_id     VARCHAR(10) NOT NULL REFERENCES campagne(id) ON DELETE CASCADE,
    nome            TEXT NOT NULL,
    -- 'monster' | 'player' | 'global'
    target_kind     TEXT NOT NULL CHECK (target_kind IN ('monster','player','global')),
    -- id del mostro (mostri_combattimento) o del personaggio (personaggi).
    -- Non vincolato con FK perche' puo' puntare a tabelle diverse a
    -- seconda di target_kind. La pulizia dei timer "orfani" e' gestita
    -- lato app o tramite la cascata su sessione_id (fine combattimento).
    target_id       VARCHAR(10),
    -- nome leggibile del target, salvato per evitare join in lettura
    target_name     TEXT,
    -- chiavi delle condizioni applicate (esempio: {'avvelenato','prono'})
    conditions      TEXT[] NOT NULL DEFAULT '{}',
    duration_rounds INT NOT NULL CHECK (duration_rounds > 0),
    remaining_rounds INT NOT NULL CHECK (remaining_rounds >= 0),
    created_by      VARCHAR(10),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expired         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_combat_timers_sessione
    ON combat_timers(sessione_id) WHERE expired = FALSE;
CREATE INDEX IF NOT EXISTS idx_combat_timers_target
    ON combat_timers(target_kind, target_id);

-- RLS: tutti i membri leggono i timer della propria campagna. Il DM gestisce
-- tutto; un giocatore puo creare e gestire solo timer del proprio personaggio.
ALTER TABLE combat_timers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS combat_timers_all ON combat_timers;
DROP POLICY IF EXISTS combat_timers_select ON combat_timers;
DROP POLICY IF EXISTS combat_timers_insert ON combat_timers;
DROP POLICY IF EXISTS combat_timers_update ON combat_timers;
DROP POLICY IF EXISTS combat_timers_delete ON combat_timers;

CREATE POLICY combat_timers_select ON combat_timers
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM sessioni s
            JOIN campagne c ON c.id = s.campagna_id
            JOIN utenti u ON u.uid::text = auth.uid()::text
            WHERE s.id = combat_timers.sessione_id
              AND s.campagna_id = combat_timers.campagna_id
              AND (
                  c.id_dm = u.id
                  OR u.id = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
              )
        )
    );

CREATE POLICY combat_timers_insert ON combat_timers
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM sessioni s
            JOIN campagne c ON c.id = s.campagna_id
            JOIN utenti u ON u.uid::text = auth.uid()::text
            WHERE s.id = combat_timers.sessione_id
              AND s.campagna_id = combat_timers.campagna_id
              AND combat_timers.created_by = u.id
              AND (
                  c.id_dm = u.id
                  OR (
                      u.id = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
                      AND combat_timers.created_by = u.id
                      AND combat_timers.target_kind = 'player'
                      AND EXISTS (
                          SELECT 1
                          FROM personaggi_campagna pc
                          WHERE pc.campagna_id = c.id
                            AND pc.user_id = u.id
                            AND pc.personaggio_id = combat_timers.target_id
                      )
                  )
              )
        )
    );

CREATE POLICY combat_timers_update ON combat_timers
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM sessioni s
            JOIN campagne c ON c.id = s.campagna_id
            JOIN utenti u ON u.uid::text = auth.uid()::text
            WHERE s.id = combat_timers.sessione_id
              AND s.campagna_id = combat_timers.campagna_id
              AND (
                  c.id_dm = u.id
                  OR (
                      u.id = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
                      AND combat_timers.created_by = u.id
                      AND combat_timers.target_kind = 'player'
                      AND EXISTS (
                          SELECT 1
                          FROM personaggi_campagna pc
                          WHERE pc.campagna_id = c.id
                            AND pc.user_id = u.id
                            AND pc.personaggio_id = combat_timers.target_id
                      )
                  )
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM sessioni s
            JOIN campagne c ON c.id = s.campagna_id
            JOIN utenti u ON u.uid::text = auth.uid()::text
            WHERE s.id = combat_timers.sessione_id
              AND s.campagna_id = combat_timers.campagna_id
              AND (
                  c.id_dm = u.id
                  OR (
                      u.id = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
                      AND combat_timers.created_by = u.id
                      AND combat_timers.target_kind = 'player'
                      AND EXISTS (
                          SELECT 1
                          FROM personaggi_campagna pc
                          WHERE pc.campagna_id = c.id
                            AND pc.user_id = u.id
                            AND pc.personaggio_id = combat_timers.target_id
                      )
                  )
              )
        )
    );

CREATE POLICY combat_timers_delete ON combat_timers
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM sessioni s
            JOIN campagne c ON c.id = s.campagna_id
            JOIN utenti u ON u.uid::text = auth.uid()::text
            WHERE s.id = combat_timers.sessione_id
              AND s.campagna_id = combat_timers.campagna_id
              AND (
                  c.id_dm = u.id
                  OR (
                      u.id = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
                      AND combat_timers.created_by = u.id
                      AND combat_timers.target_kind = 'player'
                      AND EXISTS (
                          SELECT 1
                          FROM personaggi_campagna pc
                          WHERE pc.campagna_id = c.id
                            AND pc.user_id = u.id
                            AND pc.personaggio_id = combat_timers.target_id
                      )
                  )
              )
        )
    );
