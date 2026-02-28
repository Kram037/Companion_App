-- Add tiro_naturale column to richieste_tiro_generico
-- Run this in the Supabase SQL editor
ALTER TABLE richieste_tiro_generico ADD COLUMN IF NOT EXISTS tiro_naturale INTEGER;
ALTER TABLE richieste_tiro_iniziativa ADD COLUMN IF NOT EXISTS tiro_naturale INTEGER;
