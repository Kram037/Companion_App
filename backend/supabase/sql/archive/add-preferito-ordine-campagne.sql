-- Aggiungi campi preferito e ordine alla tabella campagne
-- preferito: BOOLEAN per indicare se la campagna è tra i preferiti
-- ordine: INTEGER per memorizzare l'ordine di visualizzazione

ALTER TABLE campagne
ADD COLUMN IF NOT EXISTS preferito BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ordine INTEGER DEFAULT 0;

-- Crea indice per ottimizzare le query ordinate
CREATE INDEX IF NOT EXISTS idx_campagne_ordine ON campagne(ordine);
CREATE INDEX IF NOT EXISTS idx_campagne_preferito ON campagne(preferito);

-- Aggiorna le campagne esistenti con un ordine progressivo basato sulla data di creazione
-- Le campagne più recenti avranno un ordine maggiore
WITH campagne_ordinate AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY data_creazione ASC) - 1 AS nuovo_ordine
    FROM campagne
    WHERE ordine = 0 OR ordine IS NULL
)
UPDATE campagne
SET ordine = campagne_ordinate.nuovo_ordine
FROM campagne_ordinate
WHERE campagne.id = campagne_ordinate.id;

