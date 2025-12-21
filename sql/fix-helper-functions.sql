-- Script per ricreare le funzioni helper con VARCHAR(10)
-- Esegui questo se hai già eseguito clean-and-recreate-schema.sql ma le funzioni non funzionano

-- Rimuovi vecchie versioni (se esistono)
DROP FUNCTION IF EXISTS get_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS get_richieste_in_entrata() CASCADE;
DROP FUNCTION IF EXISTS get_richieste_in_uscita() CASCADE;
DROP FUNCTION IF EXISTS get_amici() CASCADE;
DROP FUNCTION IF EXISTS get_all_richieste_amicizia() CASCADE;
DROP FUNCTION IF EXISTS search_user_by_name_and_cid(TEXT, INTEGER) CASCADE;

-- Funzione per ottenere l'ID dell'utente corrente (VARCHAR(10))
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS VARCHAR(10) AS $$
BEGIN
    RETURN (SELECT id FROM utenti WHERE uid = auth.uid()::text LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Funzione per ottenere le richieste in entrata con dati utente
CREATE OR REPLACE FUNCTION get_richieste_in_entrata()
RETURNS TABLE (
    richiesta_id VARCHAR(10),
    richiedente_id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER,
    email TEXT,
    stato TEXT,
    created_at TIMESTAMPTZ
) AS $$
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
        u.email,
        ra.stato,
        ra.created_at
    FROM richieste_amicizia ra
    INNER JOIN utenti u ON u.id = ra.richiedente_id
    WHERE ra.destinatario_id = current_user_id
    AND ra.stato = 'pending'
    ORDER BY ra.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Funzione per ottenere le richieste in uscita con dati utente
CREATE OR REPLACE FUNCTION get_richieste_in_uscita()
RETURNS TABLE (
    richiesta_id VARCHAR(10),
    destinatario_id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER,
    email TEXT,
    stato TEXT,
    created_at TIMESTAMPTZ
) AS $$
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
        u.email,
        ra.stato,
        ra.created_at
    FROM richieste_amicizia ra
    INNER JOIN utenti u ON u.id = ra.destinatario_id
    WHERE ra.richiedente_id = current_user_id
    AND ra.stato = 'pending'
    ORDER BY ra.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Funzione per ottenere gli amici (richieste accettate) con dati utente
CREATE OR REPLACE FUNCTION get_amici()
RETURNS TABLE (
    amico_id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER,
    email TEXT,
    richiesta_id VARCHAR(10),
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    current_user_id VARCHAR(10);
BEGIN
    current_user_id := get_current_user_id();
    
    RETURN QUERY
    SELECT 
        u.id as amico_id,
        u.nome_utente,
        u.cid,
        u.email,
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Funzione per cercare un utente per nome e CID (bypassa RLS per permettere la ricerca)
CREATE OR REPLACE FUNCTION search_user_by_name_and_cid(
    search_nome TEXT,
    search_cid INTEGER
)
RETURNS TABLE (
    id VARCHAR(10),
    nome_utente TEXT,
    cid INTEGER,
    email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.nome_utente,
        u.cid,
        u.email
    FROM utenti u
    WHERE u.nome_utente = search_nome
    AND u.cid = search_cid
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Verifica che le funzioni siano state create
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc 
    WHERE proname IN ('get_current_user_id', 'get_richieste_in_entrata', 'get_richieste_in_uscita', 'get_amici', 'search_user_by_name_and_cid');
    
    RAISE NOTICE 'Funzioni create: %', func_count;
END;
$$;

