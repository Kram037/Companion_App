-- Aggiunge la colonna 'incantesimi_preparati' alla tabella personaggi.
-- Contiene la lista dei nomi (chiavi spells_data) degli incantesimi
-- attualmente preparati dal personaggio. Si applica solo alle classi
-- che usano la "preparazione" (Mago, Chierico, Druido, Paladino,
-- Artefice). Per le classi a "incantesimi conosciuti" (Bardo, Stregone,
-- Warlock, Ranger) l'array viene ignorato e tutti i conosciuti sono
-- considerati sempre preparati.
-- Sicuro da rieseguire.
ALTER TABLE personaggi ADD COLUMN IF NOT EXISTS incantesimi_preparati JSONB DEFAULT '[]';
