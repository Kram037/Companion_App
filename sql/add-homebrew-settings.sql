-- Aggiunge colonna homebrew_settings alla tabella utenti
-- Struttura: { enabled: boolean, amici_abilitati: [amico_id, ...] }
ALTER TABLE utenti ADD COLUMN IF NOT EXISTS homebrew_settings JSONB DEFAULT '{"enabled": false, "amici_abilitati": []}';
