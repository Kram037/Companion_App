-- Funzione RPC per ottenere gli inviti ricevuti con dati completi di campagna e inviante
-- Bypassa RLS usando SECURITY DEFINER
-- Restituisce una tabella con tutti i campi necessari
CREATE OR REPLACE FUNCTION get_inviti_ricevuti(p_invitato_id VARCHAR(10))
RETURNS TABLE (
    -- Campi invito
    id VARCHAR(10),
    campagna_id VARCHAR(10),
    inviante_id VARCHAR(10),
    invitato_id VARCHAR(10),
    stato TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    -- Campi campagna
    campagna_nome_campagna TEXT,
    -- Campi inviante (DM)
    inviante_nome_utente TEXT,
    inviante_cid INTEGER,
    inviante_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Recupera gli inviti pending per l'utente specificato
    -- Include i dati della campagna e dell'inviante (DM)
    RETURN QUERY
    SELECT 
        ic.id,
        ic.campagna_id,
        ic.inviante_id,
        ic.invitato_id,
        ic.stato,
        ic.created_at,
        ic.updated_at,
        c.nome_campagna AS campagna_nome_campagna,
        u.nome_utente AS inviante_nome_utente,
        u.cid AS inviante_cid,
        u.email AS inviante_email
    FROM inviti_campagna ic
    LEFT JOIN campagne c ON c.id = ic.campagna_id
    LEFT JOIN utenti u ON u.id = ic.inviante_id
    WHERE ic.invitato_id = p_invitato_id
      AND ic.stato = 'pending'
    ORDER BY ic.created_at DESC;
END;
$$;

-- Grant execute alla funzione per gli utenti autenticati
GRANT EXECUTE ON FUNCTION get_inviti_ricevuti(VARCHAR(10)) TO authenticated;

