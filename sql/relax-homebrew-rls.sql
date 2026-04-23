-- ============================================================================
-- Rilassa le policy RLS SELECT sulle tabelle homebrew per permettere a
-- qualunque utente autenticato di leggere TUTTI i contenuti homebrew.
--
-- Razionale: la visibilità "Mostra solo i miei homebrew + quelli degli amici
-- esplicitamente abilitati nei Settings del laboratorio" viene gestita
-- interamente lato client (loadHomebrewSottoclassi in js/auth.js, e
-- analoghe). Mantenere RLS strette su SELECT renderebbe impossibile leggere
-- l'homebrew di un amico abilitato senza inventarsi join complesse fra
-- utenti.homebrew_settings -> amici_abilitati e auth.uid().
--
-- Le policy di INSERT/UPDATE/DELETE restano restrittive: ogni utente puo'
-- modificare o cancellare SOLO le proprie righe (auth.uid() = user_id).
-- ============================================================================

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'homebrew_classi','homebrew_razze','homebrew_background',
        'homebrew_incantesimi','homebrew_nemici','homebrew_talenti','homebrew_oggetti'
    ]) LOOP
        -- Drop la vecchia policy SELECT restrittiva (se esiste).
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_select', tbl);
        -- Drop l'eventuale variante con suffissi differenti (storico).
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_select_all', tbl);
        -- SELECT permissivo per tutti gli utenti autenticati.
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (true)',
            tbl || '_select_all', tbl
        );
    END LOOP;
END $$;
