-- Abilita Realtime per le tabelle necessarie
-- IMPORTANTE: Questo script deve essere eseguito nel SQL Editor di Supabase
-- per abilitare Realtime su tutte le tabelle utilizzate dall'app

-- Abilita Realtime per richieste_tiro_iniziativa
ALTER PUBLICATION supabase_realtime ADD TABLE richieste_tiro_iniziativa;

-- Abilita Realtime per richieste_tiro_generico
ALTER PUBLICATION supabase_realtime ADD TABLE richieste_tiro_generico;

-- Abilita Realtime per sessioni
ALTER PUBLICATION supabase_realtime ADD TABLE sessioni;

-- Verifica che Realtime sia abilitato (opzionale - per debug)
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

