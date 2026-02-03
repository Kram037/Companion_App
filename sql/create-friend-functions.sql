-- Funzioni SQL per gestire richieste di amicizia
-- Queste funzioni bypassano RLS usando SECURITY DEFINER per restituire dati pubblici degli utenti
-- Esegui questo script nel SQL Editor di Supabase

-- Funzione per ottenere l'ID dell'utente corrente
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM utenti WHERE uid = auth.uid()::text LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Funzione per ottenere le richieste in entrata con dati utente
CREATE OR REPLACE FUNCTION get_richieste_in_entrata()
RETURNS TABLE (
    richiesta_id UUID,
    richiedente_id UUID,
    nome_utente TEXT,
    cid INTEGER,
    stato TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    current_user_id UUID;
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
    richiesta_id UUID,
    destinatario_id UUID,
    nome_utente TEXT,
    cid INTEGER,
    stato TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    current_user_id UUID;
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
    amico_id UUID,
    nome_utente TEXT,
    cid INTEGER,
    richiesta_id UUID,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    current_user_id UUID;
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

-- Funzione per ottenere tutte le richieste (per debug/amministrazione)
CREATE OR REPLACE FUNCTION get_all_richieste_amicizia()
RETURNS TABLE (
    richiesta_id UUID,
    richiedente_id UUID,
    richiedente_nome TEXT,
    richiedente_cid INTEGER,
    destinatario_id UUID,
    destinatario_nome TEXT,
    destinatario_cid INTEGER,
    stato TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := get_current_user_id();
    
    RETURN QUERY
    SELECT 
        ra.id as richiesta_id,
        ur.id as richiedente_id,
        ur.nome_utente as richiedente_nome,
        ur.cid as richiedente_cid,
        ud.id as destinatario_id,
        ud.nome_utente as destinatario_nome,
        ud.cid as destinatario_cid,
        ra.stato,
        ra.created_at
    FROM richieste_amicizia ra
    INNER JOIN utenti ur ON ur.id = ra.richiedente_id
    INNER JOIN utenti ud ON ud.id = ra.destinatario_id
    WHERE ra.richiedente_id = current_user_id OR ra.destinatario_id = current_user_id
    ORDER BY ra.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Funzione per cercare un utente per nome e CID (bypassa RLS per permettere la ricerca)
CREATE OR REPLACE FUNCTION search_user_by_name_and_cid(
    search_nome TEXT,
    search_cid INTEGER
)
RETURNS TABLE (
    id UUID,
    nome_utente TEXT,
    cid INTEGER
) AS $$
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

-- Verifica che le funzioni siano state create
SELECT 
    'Funzione get_richieste_in_entrata creata: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_richieste_in_entrata'
    ) THEN 'SÌ' ELSE 'NO' END as risultato
UNION ALL
SELECT 
    'Funzione get_richieste_in_uscita creata: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_richieste_in_uscita'
    ) THEN 'SÌ' ELSE 'NO' END
UNION ALL
SELECT 
    'Funzione get_amici creata: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_amici'
    ) THEN 'SÌ' ELSE 'NO' END
UNION ALL
SELECT 
    'Funzione search_user_by_name_and_cid creata: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'search_user_by_name_and_cid'
    ) THEN 'SÌ' ELSE 'NO' END;

