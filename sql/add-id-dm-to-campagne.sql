-- Migration: Aggiunge campo id_dm come foreign key alla tabella campagne
-- e migra i dati da nome_dm a id_dm

-- 1. Aggiungi la colonna id_dm
ALTER TABLE campagne
ADD COLUMN IF NOT EXISTS id_dm VARCHAR(10);

-- 2. Migra i dati: trova l'id dell'utente basandosi sul nome_dm
UPDATE campagne c
SET id_dm = (
    SELECT u.id
    FROM utenti u
    WHERE u.nome_utente = c.nome_dm
    LIMIT 1
)
WHERE c.id_dm IS NULL AND c.nome_dm IS NOT NULL;

-- 3. Aggiungi la foreign key constraint
ALTER TABLE campagne
ADD CONSTRAINT campagne_id_dm_fkey 
FOREIGN KEY (id_dm) 
REFERENCES utenti(id) 
ON DELETE SET NULL;

-- 4. Aggiungi un indice per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_campagne_id_dm ON campagne(id_dm);

-- 5. Aggiorna le funzioni RPC esistenti per usare id_dm

-- Aggiorna check_dm_campagna
CREATE OR REPLACE FUNCTION check_dm_campagna(p_campagna_id VARCHAR(10), p_user_id VARCHAR(10))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_dm VARCHAR(10);
BEGIN
    SELECT id_dm INTO v_id_dm
    FROM campagne
    WHERE id = p_campagna_id;
    
    -- Se la campagna non esiste o id_dm è NULL, ritorna false
    IF v_id_dm IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Confronta i valori
    RETURN v_id_dm = p_user_id;
END;
$$;

-- Aggiorna update_dm_campagna
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
BEGIN
    UPDATE campagne
    SET 
        id_dm = p_nuovo_dm_id,
        nome_dm = p_nuovo_dm_nome
    WHERE id = p_campagna_id;
END;
$$;

