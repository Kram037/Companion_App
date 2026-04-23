-- ────────────────────────────────────────────────────────────────────────────
-- Aggiunge colonne per la nuova UI di creazione oggetti homebrew:
--   - descrizione TEXT          : testo libero del campo "Descrizione"
--                                 (sostituisce nominalmente la vecchia
--                                  "proprieta", che resta per backwards-compat)
--   - incantamento INT          : 0..3, valido solo per Arma/Armatura/Focus
--
-- Nota: i CAST e i tipi sono allineati allo schema esistente
-- (vedi sql/create-laboratorio-tables.sql).
--
-- Idempotente.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE homebrew_oggetti
    ADD COLUMN IF NOT EXISTS descrizione TEXT DEFAULT NULL;

ALTER TABLE homebrew_oggetti
    ADD COLUMN IF NOT EXISTS incantamento INT DEFAULT 0;

-- Migra il vecchio campo `proprieta` su `descrizione` quando questa e' vuota
-- (solo prima volta: non sovrascrive se descrizione e' gia' valorizzata).
UPDATE homebrew_oggetti
   SET descrizione = proprieta
 WHERE descrizione IS NULL AND proprieta IS NOT NULL;
