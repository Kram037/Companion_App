-- Aggiunge il contatore di ispirazione (intero >= 0, illimitato).
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS ispirazione INTEGER DEFAULT 0;
