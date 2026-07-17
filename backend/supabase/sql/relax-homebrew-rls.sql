-- Legacy compatibility script.
-- Full sharing rules live in harden-homebrew-rls.sql. This fallback keeps
-- reads owner-only and must never reopen every row to authenticated users.

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'homebrew_classi','homebrew_razze','homebrew_background',
        'homebrew_incantesimi','homebrew_nemici','homebrew_talenti',
        'homebrew_stili','homebrew_suppliche','homebrew_oggetti'
    ]) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_select', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_select_all', tbl);
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (auth.uid() = user_id)',
            tbl || '_select', tbl
        );
    END LOOP;
END $$;
