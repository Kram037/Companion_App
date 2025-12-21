-- Migration: numero_giocatori ora viene calcolato dinamicamente
-- Il campo numero_giocatori nella tabella campagne non viene più aggiornato manualmente
-- Viene calcolato contando i record in inviti_campagna con stato='accepted' per ogni campagna

-- Opzionale: Funzione per calcolare numero_giocatori (può essere usata in viste o query)
CREATE OR REPLACE FUNCTION get_numero_giocatori(p_campagna_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM inviti_campagna
        WHERE campagna_id = p_campagna_id
        AND stato = 'accepted'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Vista opzionale per campagne con numero_giocatori calcolato
-- (non necessaria, ma può essere utile per query complesse)
CREATE OR REPLACE VIEW campagne_con_giocatori AS
SELECT 
    c.*,
    COALESCE((
        SELECT COUNT(*)::INTEGER
        FROM inviti_campagna ic
        WHERE ic.campagna_id = c.id
        AND ic.stato = 'accepted'
    ), 0) AS numero_giocatori_calcolato
FROM campagne c;

-- Nota: Il campo numero_giocatori nella tabella campagne viene mantenuto
-- per retrocompatibilità, ma non viene più aggiornato manualmente.
-- Il valore corretto viene sempre calcolato dinamicamente dalle query.

