-- ────────────────────────────────────────────────────────────────────────────
-- RPC get_uids_by_user_ids(user_ids text[])
--
-- Risolve l'auth-uid di una lista di utenti dati i loro `utenti.id`.
-- Necessaria per la visibilità degli homebrew degli amici: il loader
-- client-side deve fare una SELECT su tabelle homebrew filtrando per
-- user_id (= utenti.uid degli amici abilitati), e la SELECT diretta su
-- utenti viene bloccata dall'RLS.
--
-- SECURITY DEFINER: bypassa l'RLS della tabella utenti per permettere la
-- lettura del solo uid (UUID identifier di Supabase Auth). NON è una
-- credenziale — sapere l'uid di un utente non permette nessuna azione
-- privilegiata. Restituisce solo id, uid e nome_utente, MAI email/password
-- o altri dati sensibili.
--
-- I CAST espliciti a text sono necessari perché `utenti.id` è varchar(10)
-- e `utenti.uid` può essere uuid o varchar a seconda della migrazione del DB.
-- Castando tutto a text evitiamo errori 42804 (tipo di colonna che non
-- combacia col tipo di ritorno).
--
-- IMPORTANTE: dropp esplicito prima del CREATE perché PostgreSQL non
-- permette di cambiare il tipo di ritorno di una funzione esistente con
-- CREATE OR REPLACE.
-- ────────────────────────────────────────────────────────────────────────────

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
BEGIN
    RETURN QUERY
    SELECT
        u.id::text          AS id,
        u.uid::text         AS uid,
        u.nome_utente::text AS nome_utente
    FROM utenti u
    WHERE u.id::text = ANY(user_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION get_uids_by_user_ids(text[]) TO authenticated;
