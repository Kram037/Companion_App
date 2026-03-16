-- Rimuove i campi nome_dm e numero_giocatori dalla tabella campagne
-- Questi dati verranno calcolati dinamicamente:
-- - nome_dm: recuperato dalla tabella utenti tramite id_dm
-- - numero_giocatori: calcolato contando gli elementi nell'array giocatori

-- PRIMA: Rimuovi i trigger e le funzioni che usano numero_giocatori
DROP TRIGGER IF EXISTS update_numero_giocatori_trigger ON campagne CASCADE;
DROP FUNCTION IF EXISTS update_numero_giocatori_from_array() CASCADE;

-- Nota: Il trigger sync_campagna_giocatori() viene mantenuto perché aggiorna solo l'array giocatori
-- Se esiste un trigger che aggiorna anche numero_giocatori, rimuovilo qui

-- POI: Rimuovi i campi
ALTER TABLE campagne DROP COLUMN IF EXISTS nome_dm;
ALTER TABLE campagne DROP COLUMN IF EXISTS numero_giocatori;

