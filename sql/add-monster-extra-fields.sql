-- Aggiunge colonne per attacchi, azioni leggendarie, resistenze leggendarie e slot incantesimi ai mostri in combattimento
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS attacchi JSONB DEFAULT '[]';
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS azioni_leggendarie JSONB DEFAULT '[]';
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS resistenze_leggendarie INTEGER DEFAULT 0;
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS res_legg_attuali INTEGER DEFAULT 0;
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS slot_incantesimo JSONB DEFAULT NULL;
ALTER TABLE mostri_combattimento ADD COLUMN IF NOT EXISTS caratteristica_incantatore TEXT DEFAULT NULL;
