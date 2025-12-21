-- Script completo per ripulire e ricreare il database
-- ATTENZIONE: Questo script cancella TUTTE le tabelle esistenti!
-- Esegui solo se sei sicuro di voler perdere tutti i dati

-- ============================================
-- PARTE 1: RIMOZIONE TABELLE ESISTENTI
-- ============================================

-- Rimuovi trigger e funzioni dipendenti prima
DROP TRIGGER IF EXISTS update_inviti_campagna_updated_at ON inviti_campagna CASCADE;
DROP TRIGGER IF EXISTS sync_giocatori_on_invito_change ON inviti_campagna CASCADE;
DROP TRIGGER IF EXISTS update_numero_giocatori_trigger ON campagne CASCADE;
DROP TRIGGER IF EXISTS update_campagne_updated_at ON campagne CASCADE;
DROP TRIGGER IF EXISTS update_utenti_updated_at ON utenti CASCADE;
DROP TRIGGER IF EXISTS update_personaggi_updated_at ON personaggi CASCADE;
DROP TRIGGER IF EXISTS update_mostri_updated_at ON mostri CASCADE;

-- Rimuovi tabelle in ordine (rispettando foreign keys)
DROP TABLE IF EXISTS inviti_campagna CASCADE;
DROP TABLE IF EXISTS richieste_amicizia CASCADE;
DROP TABLE IF EXISTS personaggi CASCADE;
DROP TABLE IF EXISTS mostri CASCADE;
DROP TABLE IF EXISTS campagne CASCADE;
DROP TABLE IF EXISTS utenti CASCADE;

-- Rimuovi funzioni
DROP FUNCTION IF EXISTS sync_campagna_giocatori() CASCADE;
DROP FUNCTION IF EXISTS update_numero_giocatori_from_array() CASCADE;
DROP FUNCTION IF EXISTS update_inviti_campagna_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_unique_cid() CASCADE;
DROP FUNCTION IF EXISTS get_numero_giocatori(UUID) CASCADE;

-- ============================================
-- PARTE 2: FUNZIONI DI SUPPORTO
-- ============================================

-- Funzione per generare ID alfanumerici univoci di 10 caratteri
CREATE OR REPLACE FUNCTION generate_unique_id()
RETURNS VARCHAR(10) AS $$
DECLARE
    chars VARCHAR(62) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    result VARCHAR(10);
    exists_check INTEGER;
BEGIN
    LOOP
        result := '';
        -- Genera stringa casuale di 10 caratteri
        FOR i IN 1..10 LOOP
            result := result || substr(chars, floor(random() * 62 + 1)::INTEGER, 1);
        END LOOP;
        
        -- Verifica unicità (controlla solo se le tabelle esistono)
        BEGIN
            SELECT COUNT(*) INTO exists_check
            FROM (
                SELECT id FROM utenti WHERE id = result
                UNION ALL
                SELECT id FROM campagne WHERE id = result
                UNION ALL
                SELECT id FROM richieste_amicizia WHERE id = result
                UNION ALL
                SELECT id FROM inviti_campagna WHERE id = result
            ) AS all_ids;
        EXCEPTION WHEN undefined_table THEN
            -- Se le tabelle non esistono ancora, il risultato è sicuramente unico
            exists_check := 0;
        END;
        
        -- Se unico, esci dal loop
        EXIT WHEN exists_check = 0;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funzione per generare CID univoco a 4 cifre (1000-9999)
CREATE OR REPLACE FUNCTION generate_unique_cid()
RETURNS INTEGER AS $$
DECLARE
    new_cid INTEGER;
    exists_check INTEGER;
BEGIN
    LOOP
        -- Genera un numero casuale tra 1000 e 9999
        new_cid := floor(random() * 9000 + 1000)::INTEGER;
        
        -- Verifica se esiste già
        SELECT COUNT(*) INTO exists_check
        FROM utenti
        WHERE cid = new_cid;
        
        -- Se unico, esci dal loop
        EXIT WHEN exists_check = 0;
    END LOOP;
    
    RETURN new_cid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 3: CREAZIONE TABELLE
-- ============================================

-- Tabella Utenti
CREATE TABLE utenti (
    id VARCHAR(10) PRIMARY KEY DEFAULT generate_unique_id(),
    uid TEXT UNIQUE NOT NULL, -- Firebase UID o Supabase auth.uid()
    cid INTEGER UNIQUE NOT NULL DEFAULT generate_unique_cid(), -- Codice identificativo univoco 4 cifre
    nome_utente TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tema_scuro BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella Campagne
CREATE TABLE campagne (
    id VARCHAR(10) PRIMARY KEY DEFAULT generate_unique_id(),
    nome_campagna TEXT NOT NULL,
    user_id VARCHAR(10) NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    icona_type TEXT, -- 'predefined' o 'image'
    icona_name TEXT, -- nome icona predefinita
    icona_data TEXT, -- data URL per immagini caricate
    nome_dm TEXT DEFAULT '',
    giocatori VARCHAR(10)[] DEFAULT '{}', -- Array di ID utenti che hanno accettato l'invito
    numero_giocatori INTEGER DEFAULT 0, -- Calcolato automaticamente da array_length(giocatori, 1)
    numero_sessioni INTEGER DEFAULT 0,
    tempo_di_gioco INTEGER DEFAULT 0, -- in minuti
    note TEXT[], -- array di note
    data_creazione TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nome_campagna, user_id) -- Un utente non può avere due campagne con lo stesso nome
);

-- Tabella Richieste Amicizia
CREATE TABLE richieste_amicizia (
    id VARCHAR(10) PRIMARY KEY DEFAULT generate_unique_id(),
    richiedente_id VARCHAR(10) NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    destinatario_id VARCHAR(10) NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    stato TEXT NOT NULL DEFAULT 'pending' CHECK (stato IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Un utente non può inviare richieste a se stesso
    CHECK (richiedente_id != destinatario_id),
    -- Evita duplicati: stessa coppia di utenti (in qualsiasi direzione)
    UNIQUE(richiedente_id, destinatario_id)
);

-- Tabella Inviti Campagna
CREATE TABLE inviti_campagna (
    id VARCHAR(10) PRIMARY KEY DEFAULT generate_unique_id(),
    campagna_id VARCHAR(10) NOT NULL REFERENCES campagne(id) ON DELETE CASCADE,
    inviante_id VARCHAR(10) NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    invitato_id VARCHAR(10) NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    stato TEXT NOT NULL DEFAULT 'pending' CHECK (stato IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (inviante_id != invitato_id),
    UNIQUE(campagna_id, invitato_id) -- Un utente può ricevere un solo invito per campagna
);

-- ============================================
-- PARTE 4: INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX idx_campagne_user_id ON campagne(user_id);
CREATE INDEX idx_campagne_nome ON campagne(nome_campagna);
CREATE INDEX idx_campagne_giocatori_gin ON campagne USING GIN (giocatori); -- Indice GIN per array
CREATE INDEX idx_utenti_uid ON utenti(uid);
CREATE INDEX idx_utenti_cid ON utenti(cid);
CREATE INDEX idx_richieste_amicizia_richiedente ON richieste_amicizia(richiedente_id);
CREATE INDEX idx_richieste_amicizia_destinatario ON richieste_amicizia(destinatario_id);
CREATE INDEX idx_richieste_amicizia_stato ON richieste_amicizia(stato);
CREATE INDEX idx_inviti_campagna_campagna_id ON inviti_campagna(campagna_id);
CREATE INDEX idx_inviti_campagna_invitato_id ON inviti_campagna(invitato_id);
CREATE INDEX idx_inviti_campagna_stato ON inviti_campagna(stato);

-- ============================================
-- PARTE 5: TRIGGER
-- ============================================

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_utenti_updated_at BEFORE UPDATE ON utenti
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campagne_updated_at BEFORE UPDATE ON campagne
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_richieste_amicizia_updated_at BEFORE UPDATE ON richieste_amicizia
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inviti_campagna_updated_at BEFORE UPDATE ON inviti_campagna
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger per sincronizzare array giocatori quando cambiano gli inviti
CREATE OR REPLACE FUNCTION sync_campagna_giocatori()
RETURNS TRIGGER AS $$
BEGIN
    -- Aggiorna l'array giocatori per la campagna interessata
    -- Include solo gli utenti con inviti accettati
    UPDATE campagne
    SET giocatori = (
        SELECT COALESCE(ARRAY_AGG(invitato_id), '{}')
        FROM inviti_campagna
        WHERE campagna_id = COALESCE(NEW.campagna_id, OLD.campagna_id)
        AND stato = 'accepted'
    )
    WHERE id = COALESCE(NEW.campagna_id, OLD.campagna_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_giocatori_on_invito_change
    AFTER INSERT OR UPDATE OR DELETE ON inviti_campagna
    FOR EACH ROW
    EXECUTE FUNCTION sync_campagna_giocatori();

-- Trigger per calcolare numero_giocatori dalla lunghezza dell'array
CREATE OR REPLACE FUNCTION update_numero_giocatori_from_array()
RETURNS TRIGGER AS $$
BEGIN
    NEW.numero_giocatori = COALESCE(array_length(NEW.giocatori, 1), 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_numero_giocatori_trigger
    BEFORE INSERT OR UPDATE OF giocatori ON campagne
    FOR EACH ROW
    EXECUTE FUNCTION update_numero_giocatori_from_array();

-- ============================================
-- PARTE 6: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE utenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE campagne ENABLE ROW LEVEL SECURITY;
ALTER TABLE richieste_amicizia ENABLE ROW LEVEL SECURITY;
ALTER TABLE inviti_campagna ENABLE ROW LEVEL SECURITY;

-- Policy per utenti: gli utenti possono vedere e modificare solo il proprio profilo
CREATE POLICY "Utenti possono vedere il proprio profilo"
    ON utenti FOR SELECT
    USING (uid = auth.uid()::text);

CREATE POLICY "Utenti possono aggiornare il proprio profilo"
    ON utenti FOR UPDATE
    USING (uid = auth.uid()::text);

CREATE POLICY "Utenti possono inserire il proprio profilo"
    ON utenti FOR INSERT
    WITH CHECK (uid = auth.uid()::text);

-- Policy per campagne: gli utenti possono vedere le proprie campagne e quelle a cui partecipano
CREATE POLICY "Utenti possono vedere le proprie campagne"
    ON campagne FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = campagne.user_id
            AND utenti.uid = auth.uid()::text
        )
        OR
        EXISTS (
            SELECT 1 FROM utenti
            JOIN inviti_campagna ic ON ic.campagna_id = campagne.id
            WHERE utenti.id = ic.invitato_id
            AND ic.stato = 'accepted'
            AND utenti.uid = auth.uid()::text
        )
    );

CREATE POLICY "Utenti possono creare campagne"
    ON campagne FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = campagne.user_id
            AND utenti.uid = auth.uid()::text
        )
    );

CREATE POLICY "Utenti possono aggiornare le proprie campagne"
    ON campagne FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = campagne.user_id
            AND utenti.uid = auth.uid()::text
        )
    );

CREATE POLICY "Utenti possono eliminare le proprie campagne"
    ON campagne FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = campagne.user_id
            AND utenti.uid = auth.uid()::text
        )
    );

-- Policy per richieste_amicizia
CREATE POLICY "Utenti possono vedere le proprie richieste di amicizia"
    ON richieste_amicizia FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE (utenti.id = richieste_amicizia.richiedente_id OR utenti.id = richieste_amicizia.destinatario_id)
            AND utenti.uid = auth.uid()::text
        )
    );

CREATE POLICY "Utenti possono creare richieste di amicizia"
    ON richieste_amicizia FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = richieste_amicizia.richiedente_id
            AND utenti.uid = auth.uid()::text
        )
    );

CREATE POLICY "Utenti possono aggiornare richieste ricevute"
    ON richieste_amicizia FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = richieste_amicizia.destinatario_id
            AND utenti.uid = auth.uid()::text
        )
    );

CREATE POLICY "Utenti possono eliminare le proprie richieste"
    ON richieste_amicizia FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE (utenti.id = richieste_amicizia.richiedente_id OR utenti.id = richieste_amicizia.destinatario_id)
            AND utenti.uid = auth.uid()::text
        )
    );

-- Policy per inviti_campagna
CREATE POLICY "Utenti possono vedere i propri inviti"
    ON inviti_campagna FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE (utenti.id = inviti_campagna.inviante_id OR utenti.id = inviti_campagna.invitato_id)
            AND utenti.uid = auth.uid()::text
        )
    );

CREATE POLICY "Utenti possono creare inviti per le proprie campagne"
    ON inviti_campagna FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM utenti u
            JOIN campagne c ON c.user_id = u.id
            WHERE u.uid = auth.uid()::text
            AND c.id = inviti_campagna.campagna_id
            AND u.id = inviti_campagna.inviante_id
        )
    );

CREATE POLICY "Utenti possono aggiornare inviti ricevuti"
    ON inviti_campagna FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = inviti_campagna.invitato_id
            AND utenti.uid = auth.uid()::text
        )
    );

CREATE POLICY "Utenti possono eliminare i propri inviti"
    ON inviti_campagna FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE (utenti.id = inviti_campagna.inviante_id OR utenti.id = inviti_campagna.invitato_id)
            AND utenti.uid = auth.uid()::text
        )
    );

