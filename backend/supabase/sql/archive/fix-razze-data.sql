-- Fix razze data: remove Dragonide base, rename Tiefling -> Tiefling di Asmodeus,
-- remove Aasimar subtypes, remove 'Altre Razze' and 'Aasimar' groups

-- Remove Dragonide base (without subrace)
DELETE FROM razze WHERE nome = 'Dragonide';

-- Rename Tiefling to Tiefling di Asmodeus
UPDATE razze SET nome = 'Tiefling di Asmodeus' WHERE nome = 'Tiefling' AND gruppo = 'Tiefling';

-- Remove Aasimar subtypes, keep only base Aasimar
DELETE FROM razze WHERE nome IN ('Aasimar Protettore', 'Aasimar Flagello', 'Aasimar Caduto');

-- Remove Aasimar group, set to NULL (no group = appears in alphabetical list after groups)
UPDATE razze SET gruppo = NULL WHERE gruppo = 'Aasimar';

-- Remove 'Altre Razze' group, set to NULL
UPDATE razze SET gruppo = NULL WHERE gruppo = 'Altre Razze';
