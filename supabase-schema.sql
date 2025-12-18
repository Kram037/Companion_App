-- Schema Database Supabase per Companion App
-- Esegui questo script nella SQL Editor di Supabase

-- Abilita estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabella Utenti (sostituisce la collection Firestore "Utenti")
CREATE TABLE IF NOT EXISTS utenti (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid TEXT UNIQUE NOT NULL, -- Firebase UID (per migrazione) o Supabase auth.uid()
    cid INTEGER UNIQUE NOT NULL, -- Codice identificativo univoco 4 cifre
    nome_utente TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tema_scuro BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella Campagne
CREATE TABLE IF NOT EXISTS campagne (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_campagna TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    icona_type TEXT, -- 'predefined' o 'image'
    icona_name TEXT, -- nome icona predefinita
    icona_data TEXT, -- data URL per immagini caricate
    nome_dm TEXT DEFAULT '',
    numero_giocatori INTEGER DEFAULT 0,
    numero_sessioni INTEGER DEFAULT 0,
    tempo_di_gioco INTEGER DEFAULT 0, -- in minuti
    note TEXT[], -- array di note
    data_creazione TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nome_campagna, user_id) -- Un utente non può avere due campagne con lo stesso nome
);

-- Tabella Personaggi (per future implementazioni)
CREATE TABLE IF NOT EXISTS personaggi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    campagna_id UUID REFERENCES campagne(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella Mostri (per future implementazioni)
CREATE TABLE IF NOT EXISTS mostri (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    campagna_id UUID REFERENCES campagne(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_campagne_user_id ON campagne(user_id);
CREATE INDEX IF NOT EXISTS idx_campagne_nome ON campagne(nome_campagna);
CREATE INDEX IF NOT EXISTS idx_utenti_uid ON utenti(uid);
CREATE INDEX IF NOT EXISTS idx_utenti_cid ON utenti(cid);
CREATE INDEX IF NOT EXISTS idx_personaggi_user_id ON personaggi(user_id);
CREATE INDEX IF NOT EXISTS idx_mostri_user_id ON mostri(user_id);

-- Funzione per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_utenti_updated_at BEFORE UPDATE ON utenti
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campagne_updated_at BEFORE UPDATE ON campagne
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personaggi_updated_at BEFORE UPDATE ON personaggi
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mostri_updated_at BEFORE UPDATE ON mostri
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funzione per generare CID univoco
CREATE OR REPLACE FUNCTION generate_unique_cid()
RETURNS INTEGER AS $$
DECLARE
    new_cid INTEGER;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Genera un numero casuale tra 1000 e 9999
        new_cid := floor(random() * 9000 + 1000)::INTEGER;
        
        -- Verifica se esiste già
        SELECT COUNT(*) INTO exists_count
        FROM utenti
        WHERE cid = new_cid;
        
        -- Se non esiste, esci dal loop
        EXIT WHEN exists_count = 0;
    END LOOP;
    
    RETURN new_cid;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
-- Abilita RLS su tutte le tabelle
ALTER TABLE utenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE campagne ENABLE ROW LEVEL SECURITY;
ALTER TABLE personaggi ENABLE ROW LEVEL SECURITY;
ALTER TABLE mostri ENABLE ROW LEVEL SECURITY;

-- Policy per Utenti: gli utenti possono leggere e modificare solo il proprio profilo
CREATE POLICY "Utenti possono vedere il proprio profilo"
    ON utenti FOR SELECT
    USING (auth.uid()::text = uid);

CREATE POLICY "Utenti possono aggiornare il proprio profilo"
    ON utenti FOR UPDATE
    USING (auth.uid()::text = uid);

CREATE POLICY "Utenti possono inserire il proprio profilo"
    ON utenti FOR INSERT
    WITH CHECK (auth.uid()::text = uid);

-- Policy per Campagne: gli utenti possono vedere e modificare solo le proprie campagne
CREATE POLICY "Utenti possono vedere le proprie campagne"
    ON campagne FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = campagne.user_id
            AND utenti.uid = auth.uid()::text
        )
    );

CREATE POLICY "Utenti possono creare le proprie campagne"
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

-- Policy per Personaggi e Mostri (simili)
CREATE POLICY "Utenti possono vedere i propri personaggi"
    ON personaggi FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = personaggi.user_id
            AND utenti.uid = auth.uid()::text
        )
    );

CREATE POLICY "Utenti possono gestire i propri personaggi"
    ON personaggi FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = personaggi.user_id
            AND utenti.uid = auth.uid()::text
        )
    );

CREATE POLICY "Utenti possono vedere i propri mostri"
    ON mostri FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = mostri.user_id
            AND utenti.uid = auth.uid()::text
        )
    );

CREATE POLICY "Utenti possono gestire i propri mostri"
    ON mostri FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM utenti
            WHERE utenti.id = mostri.user_id
            AND utenti.uid = auth.uid()::text
        )
    );

-- View per conteggio campagne per utente (per performance)
CREATE OR REPLACE VIEW utenti_campagne_count AS
SELECT 
    u.id,
    u.uid,
    COUNT(c.id) as totale_campagne
FROM utenti u
LEFT JOIN campagne c ON c.user_id = u.id
GROUP BY u.id, u.uid;

