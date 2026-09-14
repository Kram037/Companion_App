-- Permette all'autore di nascondere un oggetto homebrew dal catalogo altrui.
-- Gli oggetti esistenti restano visibili per compatibilita'.

ALTER TABLE public.homebrew_oggetti
    ADD COLUMN IF NOT EXISTS nascosto_catalogo BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.homebrew_oggetti ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS homebrew_oggetti_select_all ON public.homebrew_oggetti;
DROP POLICY IF EXISTS homebrew_oggetti_select ON public.homebrew_oggetti;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'homebrew_oggetti'
          AND column_name = 'visibility'
    ) AND EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'can_read_homebrew'
    ) THEN
        EXECUTE $policy$
            CREATE POLICY homebrew_oggetti_select
            ON public.homebrew_oggetti
            FOR SELECT TO authenticated
            USING (
                can_read_homebrew(user_id, visibility, campaign_id)
                AND ((SELECT auth.uid()) = user_id OR NOT nascosto_catalogo)
            )
        $policy$;
    ELSE
        EXECUTE $policy$
            CREATE POLICY homebrew_oggetti_select
            ON public.homebrew_oggetti
            FOR SELECT TO authenticated
            USING ((SELECT auth.uid()) = user_id OR NOT nascosto_catalogo)
        $policy$;
    END IF;
END $$;
