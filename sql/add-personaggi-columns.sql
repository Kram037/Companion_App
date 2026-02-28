-- ============================================================
-- Migration: Add classi, tiri_salvezza, competenze_abilita to personaggi
-- Run this in the Supabase SQL editor
-- ============================================================

-- Add new JSONB columns
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS classi JSONB DEFAULT '[]';
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS tiri_salvezza JSONB DEFAULT '[]';
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS competenze_abilita JSONB DEFAULT '[]';

-- Migrate existing classe text data into classi JSONB format
UPDATE personaggi
SET classi = jsonb_build_array(jsonb_build_object('nome', classe, 'livello', livello))
WHERE classe IS NOT NULL AND classe != ''
  AND (classi IS NULL OR classi = '[]'::jsonb);

-- Update the RPC function to return the new columns
CREATE OR REPLACE FUNCTION get_personaggi_utente()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    nome TEXT,
    razza TEXT,
    classe TEXT,
    classi JSONB,
    livello INT,
    forza INT,
    destrezza INT,
    costituzione INT,
    intelligenza INT,
    saggezza INT,
    carisma INT,
    punti_vita_max INT,
    iniziativa INT,
    classe_armatura INT,
    percezione_passiva INT,
    velocita NUMERIC,
    tiri_salvezza JSONB,
    competenze_abilita JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.user_id, p.nome, p.razza, p.classe, p.classi, p.livello,
           p.forza, p.destrezza, p.costituzione, p.intelligenza, p.saggezza, p.carisma,
           p.punti_vita_max, p.iniziativa, p.classe_armatura, p.percezione_passiva, p.velocita,
           p.tiri_salvezza, p.competenze_abilita,
           p.created_at, p.updated_at
    FROM personaggi p
    WHERE p.user_id = auth.uid()
    ORDER BY p.updated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_personaggi_utente() TO authenticated;
