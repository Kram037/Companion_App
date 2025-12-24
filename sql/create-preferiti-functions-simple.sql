-- Funzioni RPC semplificate per gestire i preferiti usando l'array nella tabella utenti

-- Toggle preferito: aggiunge se non esiste, rimuove se esiste
CREATE OR REPLACE FUNCTION toggle_campagna_preferito(
    p_utente_id VARCHAR(10),
    p_campagna_id VARCHAR(10)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_preferiti VARCHAR(10)[];
    v_nuovo_stato BOOLEAN;
BEGIN
    -- Recupera l'array corrente
    SELECT campagne_preferite INTO v_preferiti
    FROM utenti
    WHERE id = p_utente_id;

    IF v_preferiti IS NULL THEN
        v_preferiti := ARRAY[]::VARCHAR(10)[];
    END IF;

    -- Controlla se esiste già
    IF p_campagna_id = ANY(v_preferiti) THEN
        -- Rimuovi il preferito
        v_preferiti := array_remove(v_preferiti, p_campagna_id);
        v_nuovo_stato := FALSE;
    ELSE
        -- Aggiungi il preferito in coda (mantiene l'ordine)
        v_preferiti := array_append(v_preferiti, p_campagna_id);
        v_nuovo_stato := TRUE;
    END IF;

    -- Aggiorna l'array
    UPDATE utenti
    SET campagne_preferite = v_preferiti
    WHERE id = p_utente_id;

    RETURN v_nuovo_stato;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_campagna_preferito(VARCHAR(10), VARCHAR(10)) TO authenticated;

-- Ottieni l'array dei preferiti con gli ordini (l'indice nell'array è l'ordine)
CREATE OR REPLACE FUNCTION get_campagne_preferiti(p_utente_id VARCHAR(10))
RETURNS TABLE (
    campagna_id VARCHAR(10),
    ordine INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_preferiti VARCHAR(10)[];
    v_index INTEGER;
BEGIN
    SELECT campagne_preferite INTO v_preferiti
    FROM utenti
    WHERE id = p_utente_id;

    IF v_preferiti IS NULL OR array_length(v_preferiti, 1) IS NULL THEN
        RETURN;
    END IF;

    -- Itera sull'array e restituisce ogni elemento con il suo indice come ordine
    FOR v_index IN 1..array_length(v_preferiti, 1)
    LOOP
        campagna_id := v_preferiti[v_index];
        ordine := v_index - 1; -- 0-based index
        RETURN NEXT;
    END LOOP;

    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION get_campagne_preferiti(VARCHAR(10)) TO authenticated;

-- Aggiorna l'ordine dei preferiti (riceve un array di ID nell'ordine desiderato)
CREATE OR REPLACE FUNCTION update_preferiti_ordine(
    p_utente_id VARCHAR(10),
    p_campagne_ids VARCHAR(10)[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Aggiorna semplicemente l'array con il nuovo ordine
    UPDATE utenti
    SET campagne_preferite = p_campagne_ids
    WHERE id = p_utente_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_preferiti_ordine(VARCHAR(10), VARCHAR(10)[]) TO authenticated;

