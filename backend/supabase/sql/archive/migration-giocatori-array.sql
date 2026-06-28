-- Migration: Aggiunge campo giocatori come array UUID nella tabella campagne
-- L'array viene sincronizzato automaticamente con inviti_campagna tramite trigger

-- 1. Aggiungi il campo giocatori (array di UUID) alla tabella campagne
ALTER TABLE campagne 
ADD COLUMN IF NOT EXISTS giocatori UUID[] DEFAULT '{}';

-- 2. Crea funzione per sincronizzare l'array giocatori basandosi su inviti_campagna
CREATE OR REPLACE FUNCTION sync_campagna_giocatori()
RETURNS TRIGGER AS $$
BEGIN
    -- Aggiorna l'array giocatori per la campagna interessata
    -- Include solo gli utenti con inviti accettati
    UPDATE campagne
    SET giocatori = (
        SELECT COALESCE(ARRAY_AGG(invitato_id), '{}')
        FROM inviti_campagna
        WHERE campagna_id = COALESCE(NEW.campagna_id, OLD.campagna_id)
        AND stato = 'accepted'
    )
    WHERE id = COALESCE(NEW.campagna_id, OLD.campagna_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Crea trigger che si attiva quando cambia lo stato di un invito
CREATE TRIGGER sync_giocatori_on_invito_change
    AFTER INSERT OR UPDATE OR DELETE ON inviti_campagna
    FOR EACH ROW
    EXECUTE FUNCTION sync_campagna_giocatori();

-- 4. Sincronizza i dati esistenti per tutte le campagne
UPDATE campagne
SET giocatori = (
    SELECT COALESCE(ARRAY_AGG(invitato_id), '{}')
    FROM inviti_campagna
    WHERE inviti_campagna.campagna_id = campagne.id
    AND stato = 'accepted'
);

-- 5. Aggiorna numero_giocatori usando la lunghezza dell'array (opzionale, per retrocompatibilità)
-- Nota: numero_giocatori può essere calcolato come array_length(giocatori, 1)
-- Oppure manteniamo questo campo e lo aggiorniamo tramite trigger
CREATE OR REPLACE FUNCTION update_numero_giocatori_from_array()
RETURNS TRIGGER AS $$
BEGIN
    NEW.numero_giocatori = COALESCE(array_length(NEW.giocatori, 1), 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_numero_giocatori_trigger
    BEFORE INSERT OR UPDATE OF giocatori ON campagne
    FOR EACH ROW
    EXECUTE FUNCTION update_numero_giocatori_from_array();

-- 6. Indice GIN per query efficienti sugli array (opzionale, ma utile per ricerche)
CREATE INDEX IF NOT EXISTS idx_campagne_giocatori_gin ON campagne USING GIN (giocatori);

-- Nota: 
-- - La tabella inviti_campagna rimane la fonte di verità
-- - L'array giocatori è una cache denormalizzata per performance
-- - Il trigger mantiene automaticamente la sincronizzazione

