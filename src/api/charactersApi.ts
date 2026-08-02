import { z } from 'zod';

import type { Id, Personaggio } from '../types/domain';
import { characterSchema, parseArray, parseData, parseNullable } from '../schemas';
import { dbTables } from './databaseContract';
import { getSupabaseClient, isMissingDatabaseColumn, throwIfSupabaseError } from './supabaseClient';

const CHARACTER_BASE_COLUMNS = [
  'id', 'user_id', 'nome', 'razza', 'classe', 'livello', 'forza', 'destrezza',
  'costituzione', 'intelligenza', 'saggezza', 'carisma', 'esperienza',
  'punti_vita_max', 'iniziativa', 'classe_armatura', 'percezione_passiva',
  'velocita', 'created_at', 'updated_at',
].join(',');

const CHARACTER_LIST_COLUMNS = [
  'id', 'user_id', 'nome', 'razza', 'classe', 'livello', 'esperienza',
  'classi', 'background', 'tipo_scheda', 'sottorazza', 'updated_at',
].join(',');

const CHARACTER_DETAIL_COLUMNS = [
  CHARACTER_BASE_COLUMNS,
  'classi', 'tiri_salvezza', 'competenze_abilita', 'maestrie_abilita',
  'resistenze', 'immunita', 'vulnerabilita', 'slot_incantesimo',
  'risorse_classe', 'dadi_vita_disponibili', 'pv_attuali', 'pv_temporanei',
  'background', 'concentrazione', 'accecato', 'affascinato', 'afferrato',
  'assordato', 'avvelenato', 'incapacitato', 'invisibile', 'paralizzato',
  'pietrificato', 'privo_di_sensi', 'prono', 'spaventato', 'stordito',
  'trattenuto', 'esaustione', 'ispirazione', 'immagine_url', 'sottorazza',
  'invocazioni', 'privilegi', 'stile_combattimento', 'bonus_manuali',
  'linguaggi', 'competenze_strumenti', 'equipaggiamento', 'monete',
  'inventario', 'sintonia', 'incantesimi_conosciuti', 'incantesimi_preparati',
  'tipo_scheda', 'talenti',
].join(',');

const characterCampaignLinkSchema = z.object({
  personaggio_id: z.string(),
  campagna_id: z.string(),
});
const campaignNameSchema = z.object({
  id: z.string(),
  nome_campagna: z.string(),
});
const characterResistancesSchema = z.object({
  resistenze: z.array(z.string()).nullish(),
});

export async function fetchCharacterById(personaggioId: Id): Promise<Personaggio | null> {
  const client = getSupabaseClient();
  const result = await client
    .from(dbTables.characters)
    .select(CHARACTER_DETAIL_COLUMNS)
    .eq('id', personaggioId)
    .single();
  if (!isMissingDatabaseColumn(result.error)) {
    throwIfSupabaseError(result.error);
    return parseNullable(characterSchema, result.data);
  }

  const fallback = await client
    .from(dbTables.characters)
    .select(CHARACTER_BASE_COLUMNS)
    .eq('id', personaggioId)
    .single();
  throwIfSupabaseError(fallback.error);
  return parseNullable(characterSchema, fallback.data);
}

export async function fetchCharactersByUser(userId: Id): Promise<Personaggio[]> {
  const client = getSupabaseClient();
  const result = await client
    .from(dbTables.characters)
    .select(CHARACTER_LIST_COLUMNS)
    .eq('user_id', userId)
    .order('nome');
  const fallback = isMissingDatabaseColumn(result.error)
    ? await client.from(dbTables.characters).select(CHARACTER_BASE_COLUMNS).eq('user_id', userId).order('nome')
    : result;
  throwIfSupabaseError(fallback.error);
  const characters = parseArray(characterSchema, fallback.data);
  if (!characters.length) return characters;

  const { data: associations, error: associationError } = await client
    .from(dbTables.campaignCharacters)
    .select('personaggio_id,campagna_id')
    .in('personaggio_id', characters.map(character => character.id));
  throwIfSupabaseError(associationError);
  const parsedAssociations = parseArray(characterCampaignLinkSchema, associations);
  const campaignIds = [...new Set(parsedAssociations.map(row => row.campagna_id))];
  if (!campaignIds.length) return characters.map(character => ({ ...character, campagne: [] }));
  const { data: campaigns, error: campaignsError } = await client.from(dbTables.campaigns).select('id,nome_campagna').in('id', campaignIds);
  throwIfSupabaseError(campaignsError);
  const nameById = new Map<string, string>(parseArray(campaignNameSchema, campaigns).map(row => [row.id, row.nome_campagna]));
  const namesByCharacter = new Map<string, string[]>();
  parsedAssociations.forEach(row => {
    const characterId = row.personaggio_id;
    const name = nameById.get(row.campagna_id);
    if (name) namesByCharacter.set(characterId, [...(namesByCharacter.get(characterId) ?? []), name]);
  });
  return characters.map(character => ({ ...character, campagne: namesByCharacter.get(character.id) ?? [] }));
}

export async function updateCharacterResistances(personaggioId: Id, resistenze: string[]): Promise<string[]> {
  const { data, error } = await getSupabaseClient()
    .from(dbTables.characters)
    .update({ resistenze, updated_at: new Date().toISOString() })
    .eq('id', personaggioId)
    .select('resistenze')
    .single();
  throwIfSupabaseError(error);
  return parseData(characterResistancesSchema, data).resistenze ?? resistenze;
}

