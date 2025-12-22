-- Rimuove i campi nome_dm e numero_giocatori dalla tabella campagne
-- Questi dati verranno calcolati dinamicamente:
-- - nome_dm: recuperato dalla tabella utenti tramite id_dm
-- - numero_giocatori: calcolato contando gli elementi nell'array giocatori

-- Rimuovi i campi
ALTER TABLE campagne DROP COLUMN IF EXISTS nome_dm;
ALTER TABLE campagne DROP COLUMN IF EXISTS numero_giocatori;

