import type { Id, Personaggio } from '../types/domain';
import { characterSchema, parseArray, parseNullable } from '../schemas';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

export async function fetchCharacterById(personaggioId: Id): Promise<Personaggio | null> {
  const { data, error } = await getSupabaseClient()
    .from('personaggi')
    .select('*')
    .eq('id', personaggioId)
    .single();
  throwIfSupabaseError(error);
  return parseNullable(characterSchema, data);
}

export async function fetchCharactersByUser(userId: Id): Promise<Personaggio[]> {
  const { data, error } = await getSupabaseClient()
    .from('personaggi')
    .select('*')
    .eq('user_id', userId)
    .order('nome');
  throwIfSupabaseError(error);
  const characters = parseArray(characterSchema, data);
  if (!characters.length) return characters;

  const client = getSupabaseClient();
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

