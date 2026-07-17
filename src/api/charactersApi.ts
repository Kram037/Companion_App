import type { Id, Personaggio } from '../types/domain';
import { characterSchema, parseArray, parseNullable } from '../schemas';
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

export async function fetchCharacterById(personaggioId: Id): Promise<Personaggio | null> {
  const client = getSupabaseClient();
  const result = await client
    .from('personaggi')
    .select(CHARACTER_DETAIL_COLUMNS)
    .eq('id', personaggioId)
    .single();
  if (!isMissingDatabaseColumn(result.error)) {
    throwIfSupabaseError(result.error);
    return parseNullable(characterSchema, result.data);
  }

  const fallback = await client
    .from('personaggi')
    .select(CHARACTER_BASE_COLUMNS)
    .eq('id', personaggioId)
    .single();
  throwIfSupabaseError(fallback.error);
  return parseNullable(characterSchema, fallback.data);
}

export async function fetchCharactersByUser(userId: Id): Promise<Personaggio[]> {
  const client = getSupabaseClient();
  const result = await client
    .from('personaggi')
    .select(CHARACTER_LIST_COLUMNS)
    .eq('user_id', userId)
    .order('nome');
  const fallback = isMissingDatabaseColumn(result.error)
    ? await client.from('personaggi').select(CHARACTER_BASE_COLUMNS).eq('user_id', userId).order('nome')
    : result;
  throwIfSupabaseError(fallback.error);
  const characters = parseArray(characterSchema, fallback.data);
  if (!characters.length) return characters;

  const { data: associations, error: associationError } = await client
    .from('personaggi_campagna')
    .select('personaggio_id,campagna_id')
    .in('personaggio_id', characters.map(character => character.id));
  throwIfSupabaseError(associationError);
  const campaignIds = [...new Set((associations ?? []).map((row: Record<string, unknown>) => String(row.campagna_id)))];
  if (!campaignIds.length) return characters.map(character => ({ ...character, campagne: [] }));
  const { data: campaigns, error: campaignsError } = await client.from('campagne').select('id,nome_campagna').in('id', campaignIds);
  throwIfSupabaseError(campaignsError);
  const nameById = new Map<string, string>((campaigns ?? []).map((row: Record<string, unknown>) => [String(row.id), String(row.nome_campagna)]));
  const namesByCharacter = new Map<string, string[]>();
  (associations ?? []).forEach((row: Record<string, unknown>) => {
    const characterId = String(row.personaggio_id);
    const name = nameById.get(String(row.campagna_id));
    if (name) namesByCharacter.set(characterId, [...(namesByCharacter.get(characterId) ?? []), name]);
  });
  return characters.map(character => ({ ...character, campagne: namesByCharacter.get(character.id) ?? [] }));
}

export async function updateCharacterResistances(personaggioId: Id, resistenze: string[]): Promise<string[]> {
  const { data, error } = await getSupabaseClient()
    .from('personaggi')
    .update({ resistenze, updated_at: new Date().toISOString() })
    .eq('id', personaggioId)
    .select('resistenze')
    .single();
  throwIfSupabaseError(error);
  return Array.isArray(data?.resistenze) ? data.resistenze.map(String) : resistenze;
}

