-- ─────────────────────────────────────────────────────────────────────
--  Migrazione: alla chiusura di una sessione, INCREMENTA numero_sessioni
--  e tempo_di_gioco invece di ricalcolarli con COUNT/SUM.
--
--  PROBLEMA: il trigger originale `update_campagna_stats_on_session_close`
--  ricomputava i valori facendo COUNT(*) sulle sessioni chiuse e
--  SUM(durata_minuti). Questo SOVRASCRIVEVA qualsiasi modifica manuale
--  fatta dal DM nei dettagli della campagna (es. "ho 17 sessioni e 85 ore"
--  diventava "1 sessione e 0 ore" dopo aver chiuso la prima sessione).
--
--  SOLUZIONE: incrementare di +1 il contatore di sessioni e di +durata
--  il tempo di gioco, preservando i valori esistenti.
--
--  Eseguibile in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_campagna_stats_on_session_close()
RETURNS TRIGGER AS $$
DECLARE
    durata INTEGER;
BEGIN
    -- Fire SOLO quando la sessione passa da aperta a chiusa.
    IF OLD.data_fine IS NULL AND NEW.data_fine IS NOT NULL THEN
        durata := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NEW.data_fine - NEW.data_inizio)) / 60))::INTEGER;

        -- Persiste la durata sulla riga della sessione.
        UPDATE sessioni
        SET durata_minuti = durata
        WHERE id = NEW.id;

        -- Incrementa contatori della campagna preservando edit manuali.
        UPDATE campagne
        SET
            numero_sessioni = COALESCE(numero_sessioni, 0) + 1,
            tempo_di_gioco = COALESCE(tempo_di_gioco, 0) + durata
        WHERE id = NEW.campagna_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_campagna_stats_on_session_close ON sessioni;
CREATE TRIGGER trigger_update_campagna_stats_on_session_close
    AFTER UPDATE ON sessioni
    FOR EACH ROW
    WHEN (OLD.data_fine IS NULL AND NEW.data_fine IS NOT NULL)
    EXECUTE FUNCTION update_campagna_stats_on_session_close();
