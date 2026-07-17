-- Resolves Supabase auth UIDs only for the caller and accepted friends.
DROP FUNCTION IF EXISTS get_uids_by_user_ids(text[]);

CREATE FUNCTION get_uids_by_user_ids(user_ids text[])
RETURNS TABLE(
    id text,
    uid text,
    nome_utente text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_user_id VARCHAR(10);
BEGIN
    SELECT u.id INTO v_current_user_id
    FROM utenti u
    WHERE u.uid = auth.uid()::text;

    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    RETURN QUERY
    SELECT
        u.id::text,
        u.uid::text,
        u.nome_utente::text
    FROM utenti u
    WHERE u.id::text = ANY(user_ids)
      AND (
          u.id = v_current_user_id
          OR EXISTS (
              SELECT 1
              FROM richieste_amicizia ra
              WHERE ra.stato = 'accepted'
                AND (
                    (ra.richiedente_id = v_current_user_id AND ra.destinatario_id = u.id)
                    OR
                    (ra.destinatario_id = v_current_user_id AND ra.richiedente_id = u.id)
                )
          )
      );
END;
$$;

REVOKE EXECUTE ON FUNCTION get_uids_by_user_ids(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_uids_by_user_ids(text[]) TO authenticated;
