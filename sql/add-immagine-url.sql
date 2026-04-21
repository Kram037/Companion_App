-- Aggiunge la colonna immagine_url (URL dell'immagine del personaggio).
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS immagine_url TEXT;
