-- Aggiunge colonne linguaggi e abilita_speciali a homebrew_razze
ALTER TABLE homebrew_razze ADD COLUMN IF NOT EXISTS linguaggi JSONB DEFAULT '[]';
ALTER TABLE homebrew_razze ADD COLUMN IF NOT EXISTS abilita_speciali JSONB DEFAULT '[]';
