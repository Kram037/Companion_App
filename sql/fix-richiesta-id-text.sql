-- Fix: Cambia richiesta_id da VARCHAR(10) a TEXT per supportare ID più lunghi
ALTER TABLE richieste_tiro_generico 
ALTER COLUMN richiesta_id TYPE TEXT;

