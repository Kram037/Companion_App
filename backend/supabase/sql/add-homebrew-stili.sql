-- =============================================================================
-- Tabella homebrew_stili (stili di combattimento homebrew nel laboratorio)
-- =============================================================================
-- Esegui UNA VOLTA dalla SQL Editor di Supabase.
-- Sicuro da rieseguire: CREATE TABLE IF NOT EXISTS e policy ricreate.
-- =============================================================================

CREATE TABLE IF NOT EXISTS homebrew_stili (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    prerequisiti TEXT DEFAULT NULL,
    descrizione TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE homebrew_stili ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS homebrew_stili_select ON homebrew_stili;
DROP POLICY IF EXISTS homebrew_stili_select_all ON homebrew_stili;
CREATE POLICY homebrew_stili_select_all
    ON homebrew_stili
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS homebrew_stili_insert ON homebrew_stili;
CREATE POLICY homebrew_stili_insert
    ON homebrew_stili
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS homebrew_stili_update ON homebrew_stili;
CREATE POLICY homebrew_stili_update
    ON homebrew_stili
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS homebrew_stili_delete ON homebrew_stili;
CREATE POLICY homebrew_stili_delete
    ON homebrew_stili
    FOR DELETE
    USING (auth.uid() = user_id);
