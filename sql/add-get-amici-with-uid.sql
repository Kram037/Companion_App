-- ────────────────────────────────────────────────────────────────────────────
-- RPC get_uids_by_user_ids(user_ids text[])
--
-- Risolve l'auth-uid di una lista di utenti dati i loro `utenti.id`.
-- Necessaria per la visibilità degli homebrew degli amici: il loader
-- client-side deve fare una SELECT su tabelle homebrew filtrando per user_id
-- (= utenti.uid), ma la SELECT diretta su utenti viene bloccata dall'RLS.
--
-- SECURITY DEFINER: bypassa l'RLS della tabella utenti per permettere la
-- lettura del solo uid (UUID identifier di Supabase Auth). NON è una
-- credenziale — sapere l'uid di un utente non permette nessuna azione
-- privilegiata. Restituisce solo id, uid e nome_utente, MAI email/password
-- o altri dati sensibili.
--
-- Idempotente: CREATE OR REPLACE.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_uids_by_user_ids(user_ids text[])
RETURNS TABLE(
    id text,
    uid uuid,
    nome_utente text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.uid, u.nome_utente
    FROM utenti u
    WHERE u.id = ANY(user_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION get_uids_by_user_ids(text[]) TO authenticated;
