-- Script per creare la tabella richieste_amicizia
-- Esegui questo script nel SQL Editor di Supabase

-- Verifica se la tabella esiste già
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'richieste_amicizia'
    ) THEN
        -- Crea la tabella
        CREATE TABLE richieste_amicizia (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            richiedente_id UUID NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
            destinatario_id UUID NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
            stato TEXT NOT NULL DEFAULT 'pending' CHECK (stato IN ('pending', 'accepted', 'rejected', 'blocked')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            -- Un utente non può inviare richieste a se stesso
            CHECK (richiedente_id != destinatario_id),
            -- Evita duplicati: stessa coppia di utenti (in qualsiasi direzione)
            UNIQUE(richiedente_id, destinatario_id)
        );
        
        RAISE NOTICE 'Tabella richieste_amicizia creata con successo';
    ELSE
        RAISE NOTICE 'Tabella richieste_amicizia esiste già';
    END IF;
END $$;

-- Crea gli indici
CREATE INDEX IF NOT EXISTS idx_richieste_amicizia_richiedente ON richieste_amicizia(richiedente_id);
CREATE INDEX IF NOT EXISTS idx_richieste_amicizia_destinatario ON richieste_amicizia(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_richieste_amicizia_stato ON richieste_amicizia(stato);

-- Crea il trigger per updated_at
CREATE TRIGGER update_richieste_amicizia_updated_at 
    BEFORE UPDATE ON richieste_amicizia
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Abilita RLS
ALTER TABLE richieste_amicizia ENABLE ROW LEVEL SECURITY;

-- Crea le policies (se non esistono già)
DO $$
BEGIN
    -- Policy SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'richieste_amicizia' 
        AND policyname = 'Utenti possono vedere le proprie richieste di amicizia'
    ) THEN
        CREATE POLICY "Utenti possono vedere le proprie richieste di amicizia"
            ON richieste_amicizia FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM utenti
                    WHERE (utenti.id = richieste_amicizia.richiedente_id OR utenti.id = richieste_amicizia.destinatario_id)
                    AND utenti.uid = auth.uid()::text
                )
            );
    END IF;
    
    -- Policy INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'richieste_amicizia' 
        AND policyname = 'Utenti possono creare richieste di amicizia'
    ) THEN
        CREATE POLICY "Utenti possono creare richieste di amicizia"
            ON richieste_amicizia FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM utenti
                    WHERE utenti.id = richieste_amicizia.richiedente_id
                    AND utenti.uid = auth.uid()::text
                )
            );
    END IF;
    
    -- Policy UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'richieste_amicizia' 
        AND policyname = 'Utenti possono aggiornare richieste ricevute'
    ) THEN
        CREATE POLICY "Utenti possono aggiornare richieste ricevute"
            ON richieste_amicizia FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM utenti
                    WHERE utenti.id = richieste_amicizia.destinatario_id
                    AND utenti.uid = auth.uid()::text
                )
            );
    END IF;
    
    -- Policy DELETE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'richieste_amicizia' 
        AND policyname = 'Utenti possono eliminare le proprie richieste'
    ) THEN
        CREATE POLICY "Utenti possono eliminare le proprie richieste"
            ON richieste_amicizia FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM utenti
                    WHERE (utenti.id = richieste_amicizia.richiedente_id OR utenti.id = richieste_amicizia.destinatario_id)
                    AND utenti.uid = auth.uid()::text
                )
            );
    END IF;
END $$;

-- Aggiungi la policy per vedere i dati pubblici degli altri utenti (se non esiste)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'utenti' 
        AND policyname = 'Utenti possono vedere dati pubblici di altri utenti con richieste di amicizia'
    ) THEN
        CREATE POLICY "Utenti possono vedere dati pubblici di altri utenti con richieste di amicizia"
            ON utenti FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM richieste_amicizia
                    WHERE (richieste_amicizia.richiedente_id = utenti.id 
                           OR richieste_amicizia.destinatario_id = utenti.id)
                    AND (
                        richieste_amicizia.richiedente_id IN (
                            SELECT id FROM utenti WHERE uid = auth.uid()::text
                        )
                        OR richieste_amicizia.destinatario_id IN (
                            SELECT id FROM utenti WHERE uid = auth.uid()::text
                        )
                    )
                )
            );
    END IF;
END $$;

-- Verifica che la tabella sia stata creata
SELECT 
    'Tabella richieste_amicizia creata: ' || 
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'richieste_amicizia'
    ) THEN 'SÌ' ELSE 'NO' END as risultato;

