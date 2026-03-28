-- Aggiunge colonne mancanti a homebrew_nemici per abilità, tiri salvezza, azioni e resistenze leggendarie
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS tiri_salvezza JSONB DEFAULT '[]';
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS competenze_abilita JSONB DEFAULT '[]';
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS azioni_leggendarie JSONB DEFAULT '[]';
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS resistenze_leggendarie INTEGER DEFAULT 0;
