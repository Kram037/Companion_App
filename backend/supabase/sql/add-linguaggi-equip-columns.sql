-- Nuove colonne per personaggi: linguaggi, competenze strumenti, equipaggiamento
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS linguaggi JSONB DEFAULT '[]';
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS competenze_strumenti JSONB DEFAULT '[]';
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS equipaggiamento JSONB DEFAULT '[]';

-- Colonna linguaggi per razze (per auto-popolare)
ALTER TABLE razze ADD COLUMN IF NOT EXISTS linguaggi JSONB DEFAULT '[]';
ALTER TABLE razze ADD COLUMN IF NOT EXISTS linguaggi_extra INTEGER DEFAULT 0;

-- Colonne per background: linguaggi extra e competenze strumenti
ALTER TABLE background ADD COLUMN IF NOT EXISTS linguaggi_extra INTEGER DEFAULT 0;
ALTER TABLE background ADD COLUMN IF NOT EXISTS competenze_strumenti JSONB DEFAULT '[]';

-- =====================================================
-- UPDATE: Linguaggi per ogni razza
-- =====================================================

-- Dragonidi
UPDATE razze SET linguaggi = '["Comune","Draconico"]' WHERE nome IN ('Dragonide Cromatico','Dragonide di Gemma','Dragonide Metallico');

-- Elfi
UPDATE razze SET linguaggi = '["Comune","Elfico"]' WHERE gruppo = 'Elfi';
UPDATE razze SET linguaggi_extra = 1 WHERE nome = 'Elfo Alto';

-- Gith
UPDATE razze SET linguaggi = '["Comune"]', linguaggi_extra = 1 WHERE gruppo = 'Gith';

-- Gnomi
UPDATE razze SET linguaggi = '["Comune","Gnomesco"]' WHERE gruppo = 'Gnomi';
UPDATE razze SET linguaggi = '["Comune","Gnomesco","Sottocomune"]' WHERE nome = 'Gnomo del Profondo';

-- Halfling
UPDATE razze SET linguaggi = '["Comune","Halfling"]' WHERE gruppo = 'Halfling';

-- Nani
UPDATE razze SET linguaggi = '["Comune","Nanico"]' WHERE gruppo = 'Nani';
UPDATE razze SET linguaggi = '["Comune","Nanico","Sottocomune"]' WHERE nome = 'Duergar';

-- Tiefling
UPDATE razze SET linguaggi = '["Comune","Infernale"]' WHERE gruppo = 'Tiefling';

-- Razze singole
UPDATE razze SET linguaggi = '["Comune","Celestiale"]' WHERE nome = 'Aasimar';
UPDATE razze SET linguaggi = '["Comune","Goblin"]' WHERE nome IN ('Bugbear','Goblin','Hobgoblin');
UPDATE razze SET linguaggi = '["Comune"]', linguaggi_extra = 2 WHERE nome = 'Changeling';
UPDATE razze SET linguaggi = '["Comune","Elfico","Gigante"]' WHERE nome = 'Firbolg';
UPDATE razze SET linguaggi = '["Comune","Gigante"]' WHERE nome = 'Goliath';
UPDATE razze SET linguaggi = '["Comune"]', linguaggi_extra = 1 WHERE nome IN ('Kalashtar','Kenku','Lineaggio Personalizzato','Shifter','Tabaxi','Umano','Warforged');
UPDATE razze SET linguaggi = '["Comune","Draconico"]' WHERE nome IN ('Kobold','Lizardfolk');
UPDATE razze SET linguaggi = '["Comune","Elfico"]', linguaggi_extra = 1 WHERE nome = 'Mezzelfo';
UPDATE razze SET linguaggi = '["Comune","Orchesco"]' WHERE nome IN ('Mezzorco','Orco');
UPDATE razze SET linguaggi = '["Comune","Primordiale"]' WHERE nome = 'Triton';
UPDATE razze SET linguaggi = '["Comune","Abissale","Draconico"]' WHERE nome = 'Yuan-Ti Purblood';

-- =====================================================
-- UPDATE: Linguaggi e competenze strumenti per background
-- =====================================================

UPDATE background SET linguaggi_extra = 2, competenze_strumenti = '[]' WHERE nome = 'Accolito';
UPDATE background SET linguaggi_extra = 1, competenze_strumenti = '["Strumenti da Artigiano (1 tipo)"]' WHERE nome IN ('Artigiano di Gilda','Mercante di Gilda');
UPDATE background SET linguaggi_extra = 0, competenze_strumenti = '["Arnesi da Falsario","Trucchi per il Camuffamento"]' WHERE nome = 'Ciarlatano';
UPDATE background SET linguaggi_extra = 0, competenze_strumenti = '["Giochi (1 tipo)","Arnesi da Scasso"]' WHERE nome IN ('Criminale','Spia');
UPDATE background SET linguaggi_extra = 1, competenze_strumenti = '["Borsa da Erborista"]' WHERE nome = 'Eremita';
UPDATE background SET linguaggi_extra = 0, competenze_strumenti = '["Strumenti da Artigiano (1 tipo)","Veicoli Terrestri"]' WHERE nome = 'Eroe Popolare';
UPDATE background SET linguaggi_extra = 1, competenze_strumenti = '["Strumento Musicale (1 tipo)"]' WHERE nome = 'Forestiero';
UPDATE background SET linguaggi_extra = 0, competenze_strumenti = '["Trucchi per il Camuffamento","Strumento Musicale (1 tipo)"]' WHERE nome IN ('Intrattenitore','Gladiatore');
UPDATE background SET linguaggi_extra = 0, competenze_strumenti = '["Strumenti da Navigatore","Veicoli Acquatici"]' WHERE nome IN ('Marinaio','Pirata');
UPDATE background SET linguaggi_extra = 0, competenze_strumenti = '["Arnesi da Scasso","Trucchi per il Camuffamento"]' WHERE nome = 'Monello';
UPDATE background SET linguaggi_extra = 1, competenze_strumenti = '["Giochi (1 tipo)"]' WHERE nome IN ('Nobile','Cavaliere');
UPDATE background SET linguaggi_extra = 2, competenze_strumenti = '[]' WHERE nome = 'Ricercatore';
UPDATE background SET linguaggi_extra = 0, competenze_strumenti = '["Giochi (1 tipo)","Veicoli Terrestri"]' WHERE nome = 'Soldato';
UPDATE background SET linguaggi_extra = 1, competenze_strumenti = '[]' WHERE nome = 'Agente di Casata';
