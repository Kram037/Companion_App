-- Tabella razze
CREATE TABLE IF NOT EXISTS razze (
    id VARCHAR(10) PRIMARY KEY DEFAULT generate_unique_id(),
    nome TEXT NOT NULL,
    gruppo TEXT,
    taglia TEXT DEFAULT 'Media',
    velocita NUMERIC DEFAULT 9,
    competenze_abilita JSONB DEFAULT '[]'::jsonb,
    resistenze JSONB DEFAULT '[]'::jsonb,
    fonte TEXT,
    homebrew BOOLEAN DEFAULT false,
    user_id VARCHAR(10) REFERENCES utenti(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella background
CREATE TABLE IF NOT EXISTS background (
    id VARCHAR(10) PRIMARY KEY DEFAULT generate_unique_id(),
    nome TEXT NOT NULL,
    competenze_abilita JSONB DEFAULT '[]'::jsonb,
    fonte TEXT,
    homebrew BOOLEAN DEFAULT false,
    user_id VARCHAR(10) REFERENCES utenti(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE razze ENABLE ROW LEVEL SECURITY;
ALTER TABLE background ENABLE ROW LEVEL SECURITY;

CREATE POLICY "razze_select" ON razze FOR SELECT USING (
    homebrew = false OR user_id IN (SELECT id FROM utenti WHERE uid = auth.uid()::text)
);
CREATE POLICY "razze_insert" ON razze FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM utenti WHERE uid = auth.uid()::text)
);
CREATE POLICY "razze_update" ON razze FOR UPDATE USING (
    user_id IN (SELECT id FROM utenti WHERE uid = auth.uid()::text)
);
CREATE POLICY "razze_delete" ON razze FOR DELETE USING (
    user_id IN (SELECT id FROM utenti WHERE uid = auth.uid()::text)
);

CREATE POLICY "background_select" ON background FOR SELECT USING (
    homebrew = false OR user_id IN (SELECT id FROM utenti WHERE uid = auth.uid()::text)
);
CREATE POLICY "background_insert" ON background FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM utenti WHERE uid = auth.uid()::text)
);
CREATE POLICY "background_update" ON background FOR UPDATE USING (
    user_id IN (SELECT id FROM utenti WHERE uid = auth.uid()::text)
);
CREATE POLICY "background_delete" ON background FOR DELETE USING (
    user_id IN (SELECT id FROM utenti WHERE uid = auth.uid()::text)
);

-- =====================================================
-- SEED: Razze ufficiali
-- =====================================================

-- FToD - Dragonidi
INSERT INTO razze (nome, gruppo, taglia, velocita, competenze_abilita, resistenze, fonte, homebrew) VALUES
('Dragonide Cromatico', 'Dragonidi', 'Media', 9, '[]', '[]', 'FToD', false),
('Dragonide di Gemma', 'Dragonidi', 'Media', 9, '[]', '[]', 'FToD', false),
('Dragonide Metallico', 'Dragonidi', 'Media', 9, '[]', '[]', 'FToD', false);

-- PHB - Elfi
INSERT INTO razze (nome, gruppo, taglia, velocita, competenze_abilita, resistenze, fonte, homebrew) VALUES
('Elfo Alto', 'Elfi', 'Media', 9, '["percezione"]', '[]', 'PHB', false),
('Elfo dei Boschi', 'Elfi', 'Media', 10.5, '["percezione"]', '[]', 'PHB', false),
('Elfo Oscuro (Drow)', 'Elfi', 'Media', 9, '["percezione"]', '[]', 'PHB', false);

-- MToF - Elfi
INSERT INTO razze (nome, gruppo, taglia, velocita, competenze_abilita, resistenze, fonte, homebrew) VALUES
('Eladrin', 'Elfi', 'Media', 9, '["percezione"]', '[]', 'MToF', false),
('Elfo del Mare', 'Elfi', 'Media', 9, '["percezione"]', '[]', 'MToF', false),
('Shadar-kai', 'Elfi', 'Media', 9, '["percezione"]', '[]', 'MToF', false);

-- MToF - Gith
INSERT INTO razze (nome, gruppo, taglia, velocita, competenze_abilita, resistenze, fonte, homebrew) VALUES
('Githyanki', 'Gith', 'Media', 9, '[]', '[]', 'MToF', false),
('Githzerai', 'Gith', 'Media', 9, '[]', '[]', 'MToF', false);

-- PHB - Gnomi
INSERT INTO razze (nome, gruppo, taglia, velocita, competenze_abilita, resistenze, fonte, homebrew) VALUES
('Gnomo delle Foreste', 'Gnomi', 'Piccola', 7.5, '[]', '[]', 'PHB', false),
('Gnomo delle Rocce', 'Gnomi', 'Piccola', 7.5, '[]', '[]', 'PHB', false);

-- MToF - Gnomi
INSERT INTO razze (nome, gruppo, taglia, velocita, competenze_abilita, resistenze, fonte, homebrew) VALUES
('Gnomo del Profondo', 'Gnomi', 'Piccola', 7.5, '[]', '[]', 'MToF', false);

-- PHB - Halfling
INSERT INTO razze (nome, gruppo, taglia, velocita, competenze_abilita, resistenze, fonte, homebrew) VALUES
('Halfling Piedelesto', 'Halfling', 'Piccola', 7.5, '[]', '[]', 'PHB', false),
('Halfling Tozzo', 'Halfling', 'Piccola', 7.5, '[]', '["veleno"]', 'PHB', false);

-- PHB - Nani
INSERT INTO razze (nome, gruppo, taglia, velocita, competenze_abilita, resistenze, fonte, homebrew) VALUES
('Nano delle Colline', 'Nani', 'Media', 7.5, '[]', '["veleno"]', 'PHB', false),
('Nano delle Montagne', 'Nani', 'Media', 7.5, '[]', '["veleno"]', 'PHB', false);

-- MToF - Nani
INSERT INTO razze (nome, gruppo, taglia, velocita, competenze_abilita, resistenze, fonte, homebrew) VALUES
('Duergar', 'Nani', 'Media', 7.5, '[]', '["veleno"]', 'MToF', false);

-- Tiefling
INSERT INTO razze (nome, gruppo, taglia, velocita, competenze_abilita, resistenze, fonte, homebrew) VALUES
('Tiefling di Asmodeus', 'Tiefling', 'Media', 9, '[]', '["fuoco"]', 'PHB', false);

-- MToF - Tiefling varianti
INSERT INTO razze (nome, gruppo, taglia, velocita, competenze_abilita, resistenze, fonte, homebrew) VALUES
('Tiefling di Baalzebul', 'Tiefling', 'Media', 9, '[]', '["fuoco"]', 'MToF', false),
('Tiefling di Dispater', 'Tiefling', 'Media', 9, '[]', '["fuoco"]', 'MToF', false),
('Tiefling di Fierna', 'Tiefling', 'Media', 9, '[]', '["fuoco"]', 'MToF', false),
('Tiefling di Glasya', 'Tiefling', 'Media', 9, '[]', '["fuoco"]', 'MToF', false),
('Tiefling di Levistus', 'Tiefling', 'Media', 9, '[]', '["fuoco"]', 'MToF', false),
('Tiefling di Mammon', 'Tiefling', 'Media', 9, '[]', '["fuoco"]', 'MToF', false),
('Tiefling di Mephistopheles', 'Tiefling', 'Media', 9, '[]', '["fuoco"]', 'MToF', false),
('Tiefling di Zariel', 'Tiefling', 'Media', 9, '[]', '["fuoco"]', 'MToF', false);

-- Razze singole (ordine alfabetico, senza gruppo)
INSERT INTO razze (nome, gruppo, taglia, velocita, competenze_abilita, resistenze, fonte, homebrew) VALUES
('Aasimar', NULL, 'Media', 9, '[]', '["necrotico","radiante"]', 'VGtM', false),
('Bugbear', NULL, 'Media', 9, '["furtivita"]', '[]', 'VGtM', false),
('Changeling', NULL, 'Media', 9, '[]', '[]', 'EBR', false),
('Firbolg', NULL, 'Media', 9, '[]', '[]', 'VGtM', false),
('Goblin', NULL, 'Piccola', 9, '[]', '[]', 'VGtM', false),
('Goliath', NULL, 'Media', 9, '["atletica"]', '[]', 'VGtM', false),
('Hobgoblin', NULL, 'Media', 9, '[]', '[]', 'VGtM', false),
('Kalashtar', NULL, 'Media', 9, '[]', '["psichico"]', 'EBR', false),
('Kenku', NULL, 'Media', 9, '[]', '[]', 'VGtM', false),
('Kobold', NULL, 'Piccola', 9, '[]', '[]', 'VGtM', false),
('Lineaggio Personalizzato', NULL, 'Media', 9, '[]', '[]', 'TCoE', false),
('Lizardfolk', NULL, 'Media', 9, '[]', '[]', 'VGtM', false),
('Mezzelfo', NULL, 'Media', 9, '[]', '[]', 'PHB', false),
('Mezzorco', NULL, 'Media', 9, '["intimidire"]', '[]', 'PHB', false),
('Orco', NULL, 'Media', 9, '["intimidire"]', '[]', 'VGtM', false),
('Shifter', NULL, 'Media', 9, '[]', '[]', 'EBR', false),
('Tabaxi', NULL, 'Media', 9, '["percezione","furtivita"]', '[]', 'VGtM', false),
('Triton', NULL, 'Media', 9, '[]', '["freddo"]', 'VGtM', false),
('Umano', NULL, 'Media', 9, '[]', '[]', 'PHB', false),
('Warforged', NULL, 'Media', 9, '[]', '["veleno"]', 'EBR', false),
('Yuan-Ti Purblood', NULL, 'Media', 9, '[]', '["veleno"]', 'VGtM', false);

-- =====================================================
-- SEED: Background ufficiali
-- =====================================================

INSERT INTO background (nome, competenze_abilita, fonte, homebrew) VALUES
('Accolito', '["intuizione","religione"]', 'PHB', false),
('Artigiano di Gilda', '["intuizione","persuasione"]', 'PHB', false),
('Ciarlatano', '["inganno","rapidita_di_mano"]', 'PHB', false),
('Criminale', '["inganno","furtivita"]', 'PHB', false),
('Eremita', '["medicina","religione"]', 'PHB', false),
('Eroe Popolare', '["addestrare_animali","sopravvivenza"]', 'PHB', false),
('Forestiero', '["atletica","sopravvivenza"]', 'PHB', false),
('Intrattenitore', '["acrobazia","intrattenere"]', 'PHB', false),
('Marinaio', '["atletica","percezione"]', 'PHB', false),
('Monello', '["furtivita","rapidita_di_mano"]', 'PHB', false),
('Nobile', '["persuasione","storia"]', 'PHB', false),
('Ricercatore', '["arcano","storia"]', 'PHB', false),
('Soldato', '["atletica","intimidire"]', 'PHB', false),
('Cavaliere', '["persuasione","storia"]', 'PHB', false),
('Gladiatore', '["acrobazia","intrattenere"]', 'PHB', false),
('Mercante di Gilda', '["intuizione","persuasione"]', 'PHB', false),
('Pirata', '["atletica","percezione"]', 'PHB', false),
('Spia', '["inganno","furtivita"]', 'PHB', false),
('Agente di Casata', '["intuizione","persuasione"]', 'EBR', false);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE razze;
ALTER PUBLICATION supabase_realtime ADD TABLE background;
