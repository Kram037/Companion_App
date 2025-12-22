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
-- Usiamo un approccio più semplice: cerchiamo tutti i constraint unique e li droppiamo se contengono user_id
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Trova tutti i constraint unique che coinvolgono user_id
    FOR constraint_record IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'campagne'::regclass
        AND contype = 'u'
        AND EXISTS (
            SELECT 1
            FROM unnest(conkey) AS attnum
            JOIN pg_attribute ON pg_attribute.attrelid = conrelid AND pg_attribute.attnum = unnest.attnum
            WHERE pg_attribute.attname = 'user_id'
        )
    LOOP
        EXECUTE 'ALTER TABLE campagne DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_record.conname);
    END LOOP;
END $$;

-- Ora possiamo rimuovere la colonna user_id
ALTER TABLE campagne DROP COLUMN IF EXISTS user_id;

