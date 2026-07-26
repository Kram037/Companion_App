-- Abilita Realtime senza fallire quando una tabella è già pubblicata.
DO $$
DECLARE
    v_table TEXT;
BEGIN
    FOREACH v_table IN ARRAY ARRAY[
        'richieste_tiro_iniziativa',
        'richieste_tiro_generico',
        'sessioni'
    ]
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = v_table
        ) THEN
            EXECUTE FORMAT(
                'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
                v_table
            );
        END IF;
    END LOOP;
END;
$$;

SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN (
      'richieste_tiro_iniziativa',
      'richieste_tiro_generico',
      'sessioni'
  )
ORDER BY tablename;
