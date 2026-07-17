-- Homebrew visibility model and RLS hardening.
-- Existing rows default to "friends" to preserve the current sharing flow.

CREATE OR REPLACE FUNCTION can_read_homebrew(
    p_owner_uid UUID,
    p_visibility TEXT,
    p_campaign_id VARCHAR(10)
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN auth.uid() IS NULL THEN FALSE
        WHEN auth.uid() = p_owner_uid THEN TRUE
        WHEN p_visibility = 'public' THEN TRUE
        WHEN p_visibility = 'friends' THEN EXISTS (
            SELECT 1
            FROM utenti viewer
            JOIN utenti owner_user ON owner_user.uid::text = p_owner_uid::text
            JOIN richieste_amicizia ra ON (
                (ra.richiedente_id = viewer.id AND ra.destinatario_id = owner_user.id)
                OR
                (ra.destinatario_id = viewer.id AND ra.richiedente_id = owner_user.id)
            )
            WHERE viewer.uid::text = auth.uid()::text
              AND ra.stato = 'accepted'
        )
        WHEN p_visibility = 'campaign' AND p_campaign_id IS NOT NULL THEN EXISTS (
            SELECT 1
            FROM campagne c
            JOIN utenti viewer ON viewer.uid::text = auth.uid()::text
            WHERE c.id = p_campaign_id
              AND (
                  c.id_dm = viewer.id
                  OR viewer.id = ANY(COALESCE(c.giocatori, ARRAY[]::VARCHAR(10)[]))
              )
        )
        ELSE FALSE
    END;
$$;

REVOKE EXECUTE ON FUNCTION can_read_homebrew(UUID, TEXT, VARCHAR(10)) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION can_read_homebrew(UUID, TEXT, VARCHAR(10)) TO authenticated;

DO $$
DECLARE
    tbl TEXT;
    constraint_name TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'homebrew_classi','homebrew_razze','homebrew_background',
        'homebrew_incantesimi','homebrew_nemici','homebrew_talenti',
        'homebrew_stili','homebrew_suppliche','homebrew_oggetti',
        'homebrew_combattimenti'
    ]) LOOP
        IF to_regclass('public.' || tbl) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format(
            'ALTER TABLE %I ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT %L',
            tbl, 'friends'
        );
        EXECUTE format(
            'ALTER TABLE %I ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(10)',
            tbl
        );

        constraint_name := tbl || '_visibility_check';
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = constraint_name
        ) THEN
            EXECUTE format(
                'ALTER TABLE %I ADD CONSTRAINT %I CHECK (visibility IN (%L, %L, %L, %L))',
                tbl, constraint_name, 'private', 'friends', 'campaign', 'public'
            );
        END IF;

        constraint_name := tbl || '_campaign_id_fkey';
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = constraint_name
        ) THEN
            EXECUTE format(
                'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (campaign_id) REFERENCES campagne(id) ON DELETE SET NULL',
                tbl, constraint_name
            );
        END IF;

        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_select', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_select_all', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_insert', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_update', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_delete', tbl);

        EXECUTE format(
            'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (can_read_homebrew(user_id, visibility, campaign_id))',
            tbl || '_select', tbl
        );
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND ((visibility = %L AND campaign_id IS NOT NULL) OR (visibility <> %L AND campaign_id IS NULL)))',
            tbl || '_insert', tbl, 'campaign', 'campaign'
        );
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND ((visibility = %L AND campaign_id IS NOT NULL) OR (visibility <> %L AND campaign_id IS NULL)))',
            tbl || '_update', tbl, 'campaign', 'campaign'
        );
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (auth.uid() = user_id)',
            tbl || '_delete', tbl
        );
    END LOOP;
END $$;
