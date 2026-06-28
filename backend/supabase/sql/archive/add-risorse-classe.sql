-- Add risorse_classe column to personaggi table
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS risorse_classe JSONB DEFAULT '{}'::jsonb;
