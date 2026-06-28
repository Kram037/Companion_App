-- ────────────────────────────────────────────────────────────────────────────
-- Estende homebrew_oggetti con i metadati standard di un oggetto magico D&D:
--   - sotto_tipo TEXT             : sotto-categoria libera, mostrata fra
--                                   parentesi accanto al tipo (es. "Weapon
--                                   (arrow)" → tipo='Arma' sotto_tipo='freccia').
--   - richiede_sintonia BOOLEAN   : flag "(requires attunement)".
--
-- Combinati con tipo/rarita'/incantamento permettono di comporre la
-- formuletta canonica usata in ogni oggetto (es. "Oggetto Meraviglioso, raro
-- (richiede sintonia)").
--
-- Idempotente.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE homebrew_oggetti
    ADD COLUMN IF NOT EXISTS sotto_tipo TEXT DEFAULT NULL;

ALTER TABLE homebrew_oggetti
    ADD COLUMN IF NOT EXISTS richiede_sintonia BOOLEAN DEFAULT FALSE;
