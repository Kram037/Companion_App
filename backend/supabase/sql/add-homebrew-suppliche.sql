-- =============================================================================
-- Tabella homebrew_suppliche (suppliche occulte homebrew nel laboratorio)
-- =============================================================================
-- Esegui UNA VOLTA dalla SQL Editor di Supabase.
-- Sicuro da rieseguire: CREATE TABLE IF NOT EXISTS e policy ricreate.
-- =============================================================================

CREATE TABLE IF NOT EXISTS homebrew_suppliche (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    prerequisiti TEXT DEFAULT NULL,
    descrizione TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE homebrew_suppliche ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS homebrew_suppliche_select ON homebrew_suppliche;
DROP POLICY IF EXISTS homebrew_suppliche_select_all ON homebrew_suppliche;
CREATE POLICY homebrew_suppliche_select
    ON homebrew_suppliche
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS homebrew_suppliche_insert ON homebrew_suppliche;
CREATE POLICY homebrew_suppliche_insert
    ON homebrew_suppliche
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS homebrew_suppliche_update ON homebrew_suppliche;
CREATE POLICY homebrew_suppliche_update
    ON homebrew_suppliche
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS homebrew_suppliche_delete ON homebrew_suppliche;
CREATE POLICY homebrew_suppliche_delete
    ON homebrew_suppliche
    FOR DELETE
    USING (auth.uid() = user_id);
