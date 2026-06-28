-- Aggiunge la colonna 'invocazioni' alla tabella personaggi.
-- Memorizza l'elenco di id (slug) delle invocazioni demoniache scelte da
-- un PG Warlock. La logica delle invocazioni e dei loro effetti e'
-- gestita interamente lato app a partire da window.INVOCATIONS_DATA.
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS invocazioni JSONB DEFAULT '[]';
