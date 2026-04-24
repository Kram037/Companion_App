-- =============================================================================
-- PATCH: colonne mostri_combattimento e homebrew_nemici (Supabase)
-- =============================================================================
-- Esegui UNA VOLTA dalla SQL Editor del progetto Supabase se vedi errori tipo:
--   "could not find dadi_vita_num column of mostri_combattimento"
-- oppure salvataggio nemico homebrew fallito per colonne mancanti.
-- Tutte le istruzioni sono idempotenti (IF NOT EXISTS).
-- =============================================================================

-- --- mostri_combattimento (combattimento live) ---
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS attacchi JSONB DEFAULT '[]';
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS azioni_leggendarie JSONB DEFAULT '[]';
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS resistenze_leggendarie INTEGER DEFAULT 0;
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS res_legg_attuali INTEGER DEFAULT 0;
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS slot_incantesimo JSONB DEFAULT NULL;
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS caratteristica_incantatore TEXT DEFAULT NULL;
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS azioni_legg_max INTEGER DEFAULT 0;
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS azioni_legg_attuali INTEGER DEFAULT 0;

ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS maestrie_abilita JSONB DEFAULT '[]';
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS dadi_vita_num INTEGER DEFAULT NULL;
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS dado_vita INTEGER DEFAULT NULL;

-- --- homebrew_nemici (laboratorio) ---
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS tiri_salvezza JSONB DEFAULT '[]';
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS competenze_abilita JSONB DEFAULT '[]';
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS azioni_leggendarie JSONB DEFAULT '[]';
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS resistenze_leggendarie INTEGER DEFAULT 0;
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS slot_incantesimo JSONB DEFAULT NULL;
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS caratteristica_incantatore TEXT DEFAULT NULL;
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS azioni_legg_max INTEGER DEFAULT 0;
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS mod_iniziativa INTEGER DEFAULT NULL;

ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS maestrie_abilita JSONB DEFAULT '[]';
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS dadi_vita_num INTEGER DEFAULT NULL;
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS dado_vita INTEGER DEFAULT NULL;
