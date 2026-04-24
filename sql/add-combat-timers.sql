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
-- =====================================================================

CREATE TABLE IF NOT EXISTS combat_timers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessione_id     UUID NOT NULL REFERENCES sessioni(id) ON DELETE CASCADE,
    campagna_id     UUID NOT NULL REFERENCES campagne(id) ON DELETE CASCADE,
    nome            TEXT NOT NULL,
    -- 'monster' | 'player' | 'global'
    target_kind     TEXT NOT NULL CHECK (target_kind IN ('monster','player','global')),
    -- id del mostro (mostri_combattimento) o del personaggio (personaggi)
    target_id       UUID,
    -- nome leggibile del target, salvato per evitare join in lettura
    target_name     TEXT,
    -- chiavi delle condizioni applicate (esempio: {'avvelenato','prono'})
    conditions      TEXT[] NOT NULL DEFAULT '{}',
    duration_rounds INT NOT NULL CHECK (duration_rounds > 0),
    remaining_rounds INT NOT NULL CHECK (remaining_rounds >= 0),
    created_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expired         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_combat_timers_sessione
    ON combat_timers(sessione_id) WHERE expired = FALSE;
CREATE INDEX IF NOT EXISTS idx_combat_timers_target
    ON combat_timers(target_kind, target_id);

-- RLS: per ora consentiamo accesso completo agli utenti autenticati
-- (la logica di "chi vede cosa" e' gestita lato app: il DM vede tutto,
-- il player vede solo i timer del proprio personaggio + i global).
ALTER TABLE combat_timers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS combat_timers_all ON combat_timers;
CREATE POLICY combat_timers_all ON combat_timers
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
