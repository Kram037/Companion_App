import type { Id, UserProfile } from '../types/domain';
import { parseNullable, userProfileSchema } from '../schemas';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  let client;
  try {
    client = getSupabaseClient();
  } catch {
    return null;
  }
  const { data, error } = await client.auth.getSession();
  throwIfSupabaseError(error);
  return data.session?.user?.id ? fetchUserByUid(data.session.user.id) : null;
}

export function subscribeToCurrentUser(callback: () => void): () => void {
  let client;
  try {
    client = getSupabaseClient();
  } catch {
    return () => undefined;
  }
  const { data } = client.auth.onAuthStateChange(() => callback());
  return () => data.subscription.unsubscribe();
}

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

