-- Script per rimuovere completamente la policy problematica
-- Esegui questo script nel SQL Editor di Supabase

-- Rimuovi la policy che causa ricorsione
DROP POLICY IF EXISTS "Utenti possono vedere dati pubblici di altri utenti con richieste di amicizia" ON utenti;

-- Verifica che sia stata rimossa
SELECT 
    'Policy rimossa: ' || 
    CASE WHEN NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'utenti' 
        AND policyname = 'Utenti possono vedere dati pubblici di altri utenti con richieste di amicizia'
    ) THEN 'SÌ' ELSE 'NO' END as risultato;

-- Verifica che rimanga solo la policy base
SELECT 
    policyname,
    cmd as command_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'utenti'
ORDER BY policyname;

