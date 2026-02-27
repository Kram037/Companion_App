-- Funzioni SQL per gestire richieste di amicizia
-- Queste funzioni bypassano RLS usando SECURITY DEFINER per restituire dati pubblici degli utenti
-- Esegui questo script nel SQL Editor di Supabase
-- NOTA: Usa VARCHAR(10) per coerenza con lo schema utenti/campagne

-- Funzione per ottenere l'ID dell'utente corrente
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS VARCHAR(10) AS $$
BEGIN
    RETURN (SELECT u.id FROM utenti u WHERE u.uid = auth.uid()::text LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Funzione per ottenere le richieste in entrata con dati utente
CREATE OR REPLACE FUNCTION get_richieste_in_entrata()
RETURNS TABLE (
    richiesta_id VARCHAR(10),
    richiedente_id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER,
    stato TEXT,
    created_at TIMESTAMPTZ
) AS $$
#variable_conflict use_column
DECLARE
    current_user_id VARCHAR(10);
BEGIN
    current_user_id := get_current_user_id();
    
    RETURN QUERY
    SELECT 
        ra.id as richiesta_id,
        u.id as richiedente_id,
        u.nome_utente,
        u.cid,
        ra.stato,
        ra.created_at
    FROM richieste_amicizia ra
    INNER JOIN utenti u ON u.id = ra.richiedente_id
    WHERE ra.destinatario_id = current_user_id
    AND ra.stato = 'pending'
    ORDER BY ra.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Funzione per ottenere le richieste in uscita con dati utente
CREATE OR REPLACE FUNCTION get_richieste_in_uscita()
RETURNS TABLE (
    richiesta_id VARCHAR(10),
    destinatario_id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER,
    stato TEXT,
    created_at TIMESTAMPTZ
) AS $$
#variable_conflict use_column
DECLARE
    current_user_id VARCHAR(10);
BEGIN
    current_user_id := get_current_user_id();
    
    RETURN QUERY
    SELECT 
        ra.id as richiesta_id,
        u.id as destinatario_id,
        u.nome_utente,
        u.cid,
        ra.stato,
        ra.created_at
    FROM richieste_amicizia ra
    INNER JOIN utenti u ON u.id = ra.destinatario_id
    WHERE ra.richiedente_id = current_user_id
    AND ra.stato = 'pending'
    ORDER BY ra.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Funzione per ottenere gli amici (richieste accettate) con dati utente
CREATE OR REPLACE FUNCTION get_amici()
RETURNS TABLE (
    amico_id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER,
    richiesta_id VARCHAR(10),
    created_at TIMESTAMPTZ
) AS $$
#variable_conflict use_column
DECLARE
    current_user_id VARCHAR(10);
BEGIN
    current_user_id := get_current_user_id();
    
    RETURN QUERY
    SELECT 
        u.id as amico_id,
        u.nome_utente,
        u.cid,
        ra.id as richiesta_id,
        ra.created_at
    FROM richieste_amicizia ra
    INNER JOIN utenti u ON (
        CASE 
            WHEN ra.richiedente_id = current_user_id THEN u.id = ra.destinatario_id
            ELSE u.id = ra.richiedente_id
        END
    )
    WHERE (ra.richiedente_id = current_user_id OR ra.destinatario_id = current_user_id)
    AND ra.stato = 'accepted'
    ORDER BY u.nome_utente;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Funzione per cercare un utente per nome e CID (bypassa RLS per permettere la ricerca)
CREATE OR REPLACE FUNCTION search_user_by_name_and_cid(
    search_nome TEXT,
    search_cid INTEGER
)
RETURNS TABLE (
    id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.nome_utente,
        u.cid
    FROM utenti u
    WHERE u.nome_utente = search_nome
    AND u.cid = search_cid
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Grant execute alle funzioni per gli utenti autenticati
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_richieste_in_entrata() TO authenticated;
GRANT EXECUTE ON FUNCTION get_richieste_in_uscita() TO authenticated;
GRANT EXECUTE ON FUNCTION get_amici() TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_by_name_and_cid(TEXT, INTEGER) TO authenticated;
