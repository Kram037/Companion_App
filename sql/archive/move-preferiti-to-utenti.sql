-- Sposta i preferiti dalle campagne agli utenti
-- Rimuove i campi preferito e ordine dalla tabella campagne
-- Aggiunge campagne_preferite (array di ID campagne) alla tabella utenti

-- 1. Aggiungi il campo campagne_preferite alla tabella utenti
ALTER TABLE utenti
ADD COLUMN IF NOT EXISTS campagne_preferite VARCHAR(10)[] DEFAULT '{}';

-- 2. Migra i dati esistenti: per ogni campagna con preferito=true,
--    aggiungi l'ID della campagna all'array campagne_preferite dell'utente che la possiede
--    (Nota: questo presuppone che solo il DM possa aver marcato una campagna come preferita)
DO $$
DECLARE
    campagna_rec RECORD;
BEGIN
    FOR campagna_rec IN 
        SELECT id, id_dm 
        FROM campagne 
        WHERE preferito = TRUE
    LOOP
        -- Aggiorna l'array campagne_preferite dell'utente
        UPDATE utenti
        SET campagne_preferite = array_append(COALESCE(campagne_preferite, '{}'), campagna_rec.id)
        WHERE id = campagna_rec.id_dm
        AND NOT (campagna_rec.id = ANY(COALESCE(campagne_preferite, '{}')));
    END LOOP;
END $$;

-- 3. Rimuovi gli indici associati ai campi preferito e ordine
DROP INDEX IF EXISTS idx_campagne_preferito;
DROP INDEX IF EXISTS idx_campagne_ordine;

-- 4. Rimuovi i campi preferito e ordine dalla tabella campagne
ALTER TABLE campagne
DROP COLUMN IF EXISTS preferito,
DROP COLUMN IF EXISTS ordine;

-- Nota: Il campo ordine viene rimosso come richiesto dall'utente.
-- Il riordinamento manuale sarà gestito diversamente in futuro.

