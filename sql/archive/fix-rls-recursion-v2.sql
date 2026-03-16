-- Script per correggere definitivamente la ricorsione infinita nella policy RLS
-- Esegui questo script nel SQL Editor di Supabase

-- Step 1: Rimuovi TUTTE le policies SELECT sulla tabella utenti (tranne quella base)
DROP POLICY IF EXISTS "Utenti possono vedere dati pubblici di altri utenti con richieste di amicizia" ON utenti;

-- Step 2: Crea/ricrea la funzione SECURITY DEFINER per ottenere l'ID utente corrente
-- SECURITY DEFINER bypassa RLS, quindi può leggere utenti senza ricorsione
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM utenti WHERE uid = auth.uid()::text LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Step 3: Verifica che la funzione base per vedere il proprio profilo esista
-- (Questa dovrebbe già esistere, ma la verificiamo)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'utenti' 
        AND policyname = 'Utenti possono vedere il proprio profilo'
    ) THEN
        CREATE POLICY "Utenti possono vedere il proprio profilo"
            ON utenti FOR SELECT
            USING (auth.uid()::text = uid);
    END IF;
END $$;

-- Step 4: Crea una policy più semplice che evita ricorsione
-- Questa policy permette di vedere gli altri utenti solo se c'è una richiesta di amicizia
-- e usa la funzione SECURITY DEFINER per ottenere l'ID corrente senza ricorsione
CREATE POLICY "Utenti possono vedere dati pubblici di altri utenti con richieste di amicizia"
    ON utenti FOR SELECT
    USING (
        -- Prima verifica che non sia il proprio profilo (quello è già coperto dall'altra policy)
        auth.uid()::text != uid
        AND
        -- Poi verifica che ci sia una richiesta di amicizia
        EXISTS (
            SELECT 1 
            FROM richieste_amicizia ra
            WHERE (
                (ra.richiedente_id = utenti.id AND ra.destinatario_id = get_current_user_id())
                OR 
                (ra.destinatario_id = utenti.id AND ra.richiedente_id = get_current_user_id())
            )
        )
    );

-- Verifica che tutto sia stato creato correttamente
SELECT 
    'Funzione get_current_user_id creata: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_current_user_id'
    ) THEN 'SÌ' ELSE 'NO' END as risultato
UNION ALL
SELECT 
    'Policy per vedere proprio profilo: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'utenti' 
        AND policyname = 'Utenti possono vedere il proprio profilo'
    ) THEN 'SÌ' ELSE 'NO' END
UNION ALL
SELECT 
    'Policy per vedere altri utenti: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'utenti' 
        AND policyname = 'Utenti possono vedere dati pubblici di altri utenti con richieste di amicizia'
    ) THEN 'SÌ' ELSE 'NO' END;

