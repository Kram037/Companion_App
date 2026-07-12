import type { HomebrewItem, Id } from '../types/domain';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

export type HomebrewTable =
  | 'homebrew_classi'
  | 'homebrew_combattimenti'
  | 'homebrew_incantesimi'
  | 'homebrew_nemici'
  | 'homebrew_oggetti'
  | 'homebrew_sottoclassi'
  | 'homebrew_stili'
  | 'homebrew_suppliche';

export async function fetchHomebrewByUser(table: HomebrewTable, userId: Id): Promise<HomebrewItem[]> {
  const { data, error } = await getSupabaseClient()
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('nome');
  throwIfSupabaseError(error);
  return data ?? [];
}

