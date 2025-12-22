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
    v_user_id VARCHAR(10);
BEGIN
    -- Ottieni l'ID del DM corrente e del creatore
    SELECT id_dm, user_id INTO v_id_dm, v_user_id
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
    AND u.id != COALESCE(v_id_dm, '') -- Escludi il DM corrente
    
    UNION
    
    -- Include anche il creatore se non è il DM e non è già nella lista degli inviti
    SELECT 
        u.id,
        u.nome_utente,
        u.cid
    FROM utenti u
    WHERE u.id = v_user_id
    AND v_user_id IS NOT NULL
    AND (v_user_id != COALESCE(v_id_dm, ''))
    AND NOT EXISTS (
        SELECT 1 
        FROM inviti_campagna ic2 
        WHERE ic2.invitato_id = u.id 
        AND ic2.campagna_id = campagna_id_param 
        AND ic2.stato = 'accepted'
    );
END;
$$;

-- Grant execute alla funzione per gli utenti autenticati
GRANT EXECUTE ON FUNCTION get_giocatori_campagna(VARCHAR(10)) TO authenticated;

