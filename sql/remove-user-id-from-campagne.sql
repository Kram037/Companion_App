-- Rimuove il campo user_id dalla tabella campagne
-- Ora usiamo solo id_dm per identificare il DM

-- Prima aggiorniamo le funzioni che usano user_id

-- Aggiorna create_invito_campagna per verificare che l'utente sia il DM invece del proprietario
CREATE OR REPLACE FUNCTION create_invito_campagna(
    p_campagna_id VARCHAR(10),
    p_invitato_id VARCHAR(10)
)
RETURNS VARCHAR(10) AS $$
DECLARE
    v_current_user_id VARCHAR(10);
    v_invito_id VARCHAR(10);
BEGIN
    -- Ottieni l'ID dell'utente corrente
    SELECT id INTO v_current_user_id
    FROM utenti
    WHERE uid = auth.uid()::text;
    
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non trovato';
    END IF;
    
    -- Verifica che l'utente corrente sia il DM della campagna
    IF NOT EXISTS (
        SELECT 1 FROM campagne
        WHERE id = p_campagna_id
        AND id_dm = v_current_user_id
    ) THEN
        RAISE EXCEPTION 'Solo il DM può invitare giocatori alla campagna';
    END IF;
    
    -- Verifica che non esista già un invito per questa campagna e questo invitato
    IF EXISTS (
        SELECT 1 FROM inviti_campagna
        WHERE campagna_id = p_campagna_id
        AND invitato_id = p_invitato_id
    ) THEN
        RAISE EXCEPTION 'Invito già esistente per questo utente e questa campagna';
    END IF;
    
    -- Genera un ID univoco
    v_invito_id := generate_unique_id();
    
    -- Crea l'invito
    INSERT INTO inviti_campagna (id, campagna_id, inviante_id, invitato_id, stato)
    VALUES (v_invito_id, p_campagna_id, v_current_user_id, p_invitato_id, 'pending');
    
    RETURN v_invito_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rimuovi la colonna user_id dalla tabella campagne
-- Prima rimuoviamo l'indice se esiste
DROP INDEX IF EXISTS idx_campagne_user_id;

-- Rimuoviamo il vincolo UNIQUE su (nome_campagna, user_id) se esiste
-- Nota: in PostgreSQL, dobbiamo prima trovare il nome del constraint
DO $$
DECLARE
    constraint_name TEXT;
    nome_campagna_attnum INTEGER;
    user_id_attnum INTEGER;
BEGIN
    -- Ottieni gli attnum per nome_campagna e user_id
    SELECT attnum INTO nome_campagna_attnum
    FROM pg_attribute
    WHERE attrelid = 'campagne'::regclass
    AND attname = 'nome_campagna';
    
    SELECT attnum INTO user_id_attnum
    FROM pg_attribute
    WHERE attrelid = 'campagne'::regclass
    AND attname = 'user_id';
    
    -- Trova il nome del constraint unique su (nome_campagna, user_id)
    IF nome_campagna_attnum IS NOT NULL AND user_id_attnum IS NOT NULL THEN
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = 'campagne'::regclass
        AND contype = 'u'
        AND array_length(conkey, 1) = 2
        AND conkey @> ARRAY[nome_campagna_attnum, user_id_attnum];
        
        IF constraint_name IS NOT NULL THEN
            EXECUTE 'ALTER TABLE campagne DROP CONSTRAINT ' || quote_ident(constraint_name);
        END IF;
    END IF;
END $$;

-- Ora possiamo rimuovere la colonna user_id
ALTER TABLE campagne DROP COLUMN IF EXISTS user_id;

