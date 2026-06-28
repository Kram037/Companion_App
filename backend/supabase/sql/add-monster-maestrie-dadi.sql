-- Aggiunge maestrie_abilita e dadi vita a mostri_combattimento e homebrew_nemici
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS maestrie_abilita JSONB DEFAULT '[]';
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS dadi_vita_num INTEGER DEFAULT NULL;
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS dado_vita INTEGER DEFAULT NULL;

ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS maestrie_abilita JSONB DEFAULT '[]';
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS dadi_vita_num INTEGER DEFAULT NULL;
ALTER TABLE homebrew_nemici ADD COLUMN IF NOT EXISTS dado_vita INTEGER DEFAULT NULL;
