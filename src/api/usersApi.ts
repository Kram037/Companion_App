import type { Id, UserProfile } from '../types/domain';
import { parseNullable, userProfileSchema } from '../schemas';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

export async function fetchUserById(userId: Id): Promise<UserProfile | null> {
  const { data, error } = await getSupabaseClient()
    .from('utenti')
    .select('*')
    .eq('id', userId)
    .single();
  throwIfSupabaseError(error);
  return parseNullable(userProfileSchema, data);
}

export async function fetchUserByUid(uid: Id): Promise<UserProfile | null> {
  const { data, error } = await getSupabaseClient()
    .from('utenti')
    .select('*')
    .eq('uid', uid)
    .single();
  throwIfSupabaseError(error);
  return parseNullable(userProfileSchema, data);
}

