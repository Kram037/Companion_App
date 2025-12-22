-- Funzione RPC per aggiornare il DM di una campagna
-- Gestisce anche l'aggiornamento dell'array giocatori:
-- - Rimuove il nuovo DM dall'array giocatori
-- - Aggiunge il vecchio DM all'array giocatori
-- Bypassa RLS usando SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_dm_campagna(
    p_campagna_id VARCHAR(10),
    p_nuovo_dm_id VARCHAR(10),
    p_nuovo_dm_nome TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_vecchio_dm_id VARCHAR(10);
    v_giocatori VARCHAR(10)[];
BEGIN
    -- Recupera il vecchio DM e l'array giocatori corrente
    SELECT id_dm, giocatori INTO v_vecchio_dm_id, v_giocatori
    FROM campagne
    WHERE id = p_campagna_id;
    
    -- Se il vecchio DM esiste e non è NULL, aggiungilo all'array giocatori (se non già presente)
    IF v_vecchio_dm_id IS NOT NULL AND v_vecchio_dm_id != p_nuovo_dm_id THEN
        -- Inizializza l'array se NULL
        IF v_giocatori IS NULL THEN
            v_giocatori := ARRAY[]::VARCHAR(10)[];
        END IF;
        
        -- Aggiungi il vecchio DM all'array se non è già presente
        IF NOT (v_vecchio_dm_id = ANY(v_giocatori)) THEN
            v_giocatori := array_append(v_giocatori, v_vecchio_dm_id);
        END IF;
    END IF;
    
    -- Rimuovi il nuovo DM dall'array giocatori (se presente)
    IF v_giocatori IS NOT NULL THEN
        v_giocatori := array_remove(v_giocatori, p_nuovo_dm_id);
    END IF;
    
    -- Aggiorna la campagna
    UPDATE campagne
    SET 
        id_dm = p_nuovo_dm_id,
        nome_dm = p_nuovo_dm_nome,
        giocatori = v_giocatori
    WHERE id = p_campagna_id;
END;
$$;

-- Grant execute alla funzione per gli utenti autenticati
GRANT EXECUTE ON FUNCTION update_dm_campagna(VARCHAR(10), VARCHAR(10), TEXT) TO authenticated;

