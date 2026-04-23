-- ============================================================================
-- LABORATORIO: aggiunge colonne per le sottoclassi homebrew
-- (la vecchia tabella `homebrew_classi` ora ospita SOLO sottoclassi homebrew;
--  manteniamo il nome tabella per evitare migrazioni distruttive di dati esistenti).
-- ============================================================================

ALTER TABLE homebrew_classi
    ADD COLUMN IF NOT EXISTS parent_class_slug TEXT,
    ADD COLUMN IF NOT EXISTS parent_class_name TEXT,
    ADD COLUMN IF NOT EXISTS sottoclasse_features JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS granted_spells JSONB DEFAULT '[]'::jsonb;

-- Le vecchie colonne (dado_vita, tipo_caster, tiri_salvezza, risorse_speciali)
-- restano per compatibilità ma non vengono più scritte: rendiamole nullable.
ALTER TABLE homebrew_classi
    ALTER COLUMN dado_vita DROP NOT NULL;
