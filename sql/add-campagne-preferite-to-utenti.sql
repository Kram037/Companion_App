-- Aggiunge campo array campagne_preferite alla tabella utenti
-- L'array contiene gli ID delle campagne preferite dall'utente
-- L'ordine nell'array rappresenta l'ordine di visualizzazione

ALTER TABLE utenti
ADD COLUMN IF NOT EXISTS campagne_preferite VARCHAR(10)[] DEFAULT ARRAY[]::VARCHAR(10)[];

-- Crea indice GIN per ottimizzare le query su array
CREATE INDEX IF NOT EXISTS idx_utenti_campagne_preferite ON utenti USING GIN(campagne_preferite);

