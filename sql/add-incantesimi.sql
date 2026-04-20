-- Personaggio -> Incantesimi conosciuti/preparati
-- Memorizziamo solo il NOME dell'incantesimo (id logico).
-- I dati completi (descrizione, gittata, ecc.) vivono in js/data/spells_*.js
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS incantesimi_conosciuti JSONB DEFAULT '[]';
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS incantesimi_preparati JSONB DEFAULT '[]';
