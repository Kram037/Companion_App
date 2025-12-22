-- Funzione RPC per ottenere i giocatori di una campagna
-- Recupera i giocatori che hanno accettato un invito (non dall'array giocatori)
-- Esclude il DM corrente dalla lista
-- Bypassa RLS usando SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_giocatori_campagna(campagna_id_param VARCHAR(10))
RETURNS TABLE (
    id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_dm VARCHAR(10);
BEGIN
    -- Ottieni l'ID del DM corrente
    SELECT id_dm INTO v_id_dm
    FROM campagne
    WHERE id = campagna_id_param;
    
    RETURN QUERY
    SELECT DISTINCT
        u.id,
        u.nome_utente,
        u.cid
    FROM utenti u
    INNER JOIN inviti_campagna ic ON u.id = ic.invitato_id
    WHERE ic.campagna_id = campagna_id_param
    AND ic.stato = 'accepted'
    AND u.id != v_id_dm; -- Escludi il DM corrente
END;
$$;

-- Grant execute alla funzione per gli utenti autenticati
GRANT EXECUTE ON FUNCTION get_giocatori_campagna(VARCHAR(10)) TO authenticated;

