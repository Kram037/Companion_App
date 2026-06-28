-- ────────────────────────────────────────────────────────────────────────────
-- Aggiunge il dettaglio testuale per la sintonia degli oggetti homebrew.
-- Permette di esprimere requisiti specifici come "Richiede sintonia con un
-- mago della scuola di divinazione" anziche' il semplice flag booleano.
--
--   - sintonia_dettaglio TEXT  : testo libero. Significativo solo quando
--                                 richiede_sintonia=TRUE. NULL = sintonia
--                                 generica senza vincoli.
--
-- Idempotente.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE homebrew_oggetti
    ADD COLUMN IF NOT EXISTS sintonia_dettaglio TEXT DEFAULT NULL;
