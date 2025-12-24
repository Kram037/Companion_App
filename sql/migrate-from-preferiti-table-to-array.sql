-- Script opzionale per migrare dati dalla tabella campagne_preferiti all'array utenti.campagne_preferite
-- Esegui questo script SOLO se hai già eseguito create-campagne-preferiti-table.sql
-- e vuoi migrare i dati esistenti prima di rimuovere la tabella

-- Migra i preferiti dalla tabella all'array nella tabella utenti
DO $$
DECLARE
    v_utente_record RECORD;
    v_preferiti_array VARCHAR(10)[];
BEGIN
    -- Per ogni utente che ha preferiti nella tabella
    FOR v_utente_record IN 
        SELECT DISTINCT utente_id 
        FROM campagne_preferiti
    LOOP
        -- Costruisci l'array ordinato per questo utente
        SELECT array_agg(campagna_id ORDER BY ordine) INTO v_preferiti_array
        FROM campagne_preferiti
        WHERE utente_id = v_utente_record.utente_id;
        
        -- Aggiorna l'array nella tabella utenti
        UPDATE utenti
        SET campagne_preferite = v_preferiti_array
        WHERE id = v_utente_record.utente_id;
        
        RAISE NOTICE 'Migrati % preferiti per utente %', array_length(v_preferiti_array, 1), v_utente_record.utente_id;
    END LOOP;
END $$;

-- OPZIONALE: Rimuovi la vecchia tabella dopo aver verificato che la migrazione è andata bene
-- DROP TABLE IF EXISTS campagne_preferiti CASCADE;

