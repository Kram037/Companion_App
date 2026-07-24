-- L'array campagne.giocatori e' l'unica fonte di verita' della membership.
-- Il vecchio trigger ricostruiva l'array dagli inviti e annullava i trasferimenti DM.
DROP TRIGGER IF EXISTS sync_giocatori_on_invito_change ON inviti_campagna;

-- Trasferisce una campagna dal DM corrente a un nuovo DM.
CREATE OR REPLACE FUNCTION update_dm_campagna(
    p_campagna_id VARCHAR(10),
    p_nuovo_dm_id VARCHAR(10)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_user_id VARCHAR(10);
    v_vecchio_dm_id VARCHAR(10);
    v_giocatori VARCHAR(10)[];
BEGIN
    SELECT u.id INTO v_current_user_id
    FROM utenti u
    WHERE u.uid = auth.uid()::text;

    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    SELECT c.id_dm, c.giocatori INTO v_vecchio_dm_id, v_giocatori
    FROM campagne c
    WHERE c.id = p_campagna_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Campagna non trovata';
    END IF;

    IF v_vecchio_dm_id IS NULL OR v_current_user_id IS DISTINCT FROM v_vecchio_dm_id THEN
        RAISE EXCEPTION 'Solo il DM corrente puo trasferire la campagna';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM utenti u WHERE u.id = p_nuovo_dm_id) THEN
        RAISE EXCEPTION 'Nuovo DM non trovato';
    END IF;

    IF v_vecchio_dm_id = p_nuovo_dm_id THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM sessioni s
        WHERE s.campagna_id = p_campagna_id
          AND s.data_fine IS NULL
    ) THEN
        RAISE EXCEPTION 'Termina la sessione attiva prima di trasferire la campagna';
    END IF;

    UPDATE inviti_campagna
    SET stato = 'rejected',
        updated_at = NOW()
    WHERE campagna_id = p_campagna_id
      AND inviante_id = v_vecchio_dm_id
      AND stato = 'pending';

    v_giocatori := array_remove(
        COALESCE(v_giocatori, ARRAY[]::VARCHAR(10)[]),
        p_nuovo_dm_id
    );

    IF v_vecchio_dm_id != p_nuovo_dm_id AND NOT (v_vecchio_dm_id = ANY(v_giocatori)) THEN
        v_giocatori := array_append(v_giocatori, v_vecchio_dm_id);
    END IF;

    UPDATE campagne
    SET id_dm = p_nuovo_dm_id,
        giocatori = v_giocatori
    WHERE id = p_campagna_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_dm_campagna(VARCHAR(10), VARCHAR(10)) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_dm_campagna(VARCHAR(10), VARCHAR(10)) TO authenticated;
