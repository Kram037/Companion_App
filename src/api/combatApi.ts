import type { Id, MostroCombattimento } from '../types/domain';
import { combatMonsterSchema, parseArray } from '../schemas';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

export async function fetchCombatMonsters(sessioneId: Id): Promise<MostroCombattimento[]> {
  const { data, error } = await getSupabaseClient()
    .from('mostri_combattimento')
    .select('*')
    .eq('sessione_id', sessioneId)
    .order('iniziativa', { ascending: false, nullsFirst: false });
  throwIfSupabaseError(error);
  return parseArray(combatMonsterSchema, data);
}

