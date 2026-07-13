import type { HomebrewItem, Id } from '../types/domain';
import { homebrewItemSchema, parseArray } from '../schemas';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

export type HomebrewTable =
  | 'homebrew_background'
  | 'homebrew_classi'
  | 'homebrew_combattimenti'
  | 'homebrew_incantesimi'
  | 'homebrew_nemici'
  | 'homebrew_oggetti'
  | 'homebrew_razze'
  | 'homebrew_sottoclassi'
  | 'homebrew_stili'
  | 'homebrew_suppliche'
  | 'homebrew_talenti';

export async function fetchHomebrewByUser(table: HomebrewTable, userId: Id): Promise<HomebrewItem[]> {
  const { data, error } = await getSupabaseClient()
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('nome');
  throwIfSupabaseError(error);
  return parseArray(homebrewItemSchema, data);
}

export async function deleteHomebrewItem(table: HomebrewTable, id: Id): Promise<void> {
  const { error } = await getSupabaseClient().from(table).delete().eq('id', id);
  throwIfSupabaseError(error);
}

