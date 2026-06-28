-- Aggiunge la colonna sottorazza (nome IT della sottorazza scelta dal PG).
-- Necessaria per il dataset locale delle razze: una razza puo' avere
-- sottorazze (es. Nano della Collina, Tiefling Stirpe di Asmodeus,
-- Genasi del Fuoco, ...) che il PG sceglie nella 2a fase del wizard.
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS sottorazza TEXT;
