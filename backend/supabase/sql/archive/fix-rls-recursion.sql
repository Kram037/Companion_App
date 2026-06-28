-- Script per correggere la ricorsione infinita nella policy RLS
-- Esegui questo script nel SQL Editor di Supabase

-- Crea funzione helper per evitare ricorsione nelle policies
-- SECURITY DEFINER permette di bypassare RLS quando si esegue la funzione
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
    SELECT id FROM utenti WHERE uid = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Rimuovi la policy problematica se esiste
DROP POLICY IF EXISTS "Utenti possono vedere dati pubblici di altri utenti con richieste di amicizia" ON utenti;

-- Ricrea la policy corretta senza ricorsione
CREATE POLICY "Utenti possono vedere dati pubblici di altri utenti con richieste di amicizia"
    ON utenti FOR SELECT
    USING (
        -- Permetti se c'è una richiesta di amicizia (in qualsiasi direzione)
        -- Usa la funzione per evitare ricorsione
        EXISTS (
            SELECT 1 FROM richieste_amicizia
            WHERE (richieste_amicizia.richiedente_id = utenti.id 
                   OR richieste_amicizia.destinatario_id = utenti.id)
            AND (
                richieste_amicizia.richiedente_id = get_current_user_id()
                OR richieste_amicizia.destinatario_id = get_current_user_id()
            )
        )
    );

-- Verifica che la policy sia stata creata
SELECT 
    'Policy creata: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'utenti' 
        AND policyname = 'Utenti possono vedere dati pubblici di altri utenti con richieste di amicizia'
    ) THEN 'SÌ' ELSE 'NO' END as risultato;

