import type { Id, Personaggio } from '../types/domain';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

export async function fetchCharacterById(personaggioId: Id): Promise<Personaggio | null> {
  const { data, error } = await getSupabaseClient()
    .from('personaggi')
    .select('*')
    .eq('id', personaggioId)
    .single();
  throwIfSupabaseError(error);
  return data ?? null;
}

export async function fetchCharactersByUser(userId: Id): Promise<Personaggio[]> {
  const { data, error } = await getSupabaseClient()
    .from('personaggi')
    .select('*')
    .eq('user_id', userId)
    .order('nome');
  throwIfSupabaseError(error);
  return data ?? [];
}

