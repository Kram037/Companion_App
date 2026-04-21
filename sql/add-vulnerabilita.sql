-- Aggiunge la colonna 'vulnerabilita' (lista di tipi di danno) alla tabella personaggi.
-- Sicuro da rieseguire.
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS vulnerabilita JSONB DEFAULT '[]';
