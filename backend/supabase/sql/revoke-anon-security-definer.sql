-- Privilege-escalating RPCs are authenticated-only.
-- Supabase grants EXECUTE to anon explicitly, so revoking PUBLIC alone is not enough.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;

DO $$
DECLARE
    function_name TEXT;
BEGIN
    FOR function_name IN
        SELECT p.oid::REGPROCEDURE::TEXT
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prosecdef
    LOOP
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon',
            function_name
        );
        EXECUTE format(
            'GRANT EXECUTE ON FUNCTION %s TO authenticated',
            function_name
        );
    END LOOP;
END $$;

ALTER FUNCTION generate_unique_id() SET search_path = public;
ALTER FUNCTION generate_unique_cid() SET search_path = public;
ALTER FUNCTION update_updated_at_column() SET search_path = public;
ALTER FUNCTION sync_campagna_giocatori() SET search_path = public;
ALTER FUNCTION update_campagna_stats_on_session_close() SET search_path = public;
