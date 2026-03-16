-- Add background column to personaggi table
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS background TEXT;
