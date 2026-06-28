-- =============================================================================
-- Tabella homebrew_combattimenti (encounter pre-confezionati nel laboratorio)
-- =============================================================================
-- Esegui UNA VOLTA dalla SQL Editor di Supabase.
-- Sicuro da rieseguire (IF NOT EXISTS, DROP+CREATE per le policy).
-- =============================================================================

CREATE TABLE IF NOT EXISTS homebrew_combattimenti (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    -- Lista di "snapshot" dei mostri inclusi: ogni elemento e' una copia completa
    -- dei dati del nemico al momento dell'aggiunta, cosi' il combattimento resta
    -- valido anche se il nemico originale viene poi modificato o eliminato.
    -- Schema di un elemento (campi liberi, tutti opzionali tranne nome/punti_vita_max):
    --   { source: 'homebrew'|'placeholder', source_id: <uuid?>, snapshot: { ... } }
    mostri JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE homebrew_combattimenti ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS homebrew_combattimenti_select ON homebrew_combattimenti;
CREATE POLICY homebrew_combattimenti_select ON homebrew_combattimenti
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS homebrew_combattimenti_insert ON homebrew_combattimenti;
CREATE POLICY homebrew_combattimenti_insert ON homebrew_combattimenti
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS homebrew_combattimenti_update ON homebrew_combattimenti;
CREATE POLICY homebrew_combattimenti_update ON homebrew_combattimenti
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS homebrew_combattimenti_delete ON homebrew_combattimenti;
CREATE POLICY homebrew_combattimenti_delete ON homebrew_combattimenti
    FOR DELETE USING (auth.uid() = user_id);
