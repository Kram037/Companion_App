import type { HomebrewSettings, Id, UserProfile } from '../types/domain';
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

export interface HomebrewFriend {
  id: Id;
  nome: string;
  cid?: string | null;
}

export async function fetchHomebrewFriends(): Promise<HomebrewFriend[]> {
  const { data, error } = await getSupabaseClient().rpc('get_amici');
  throwIfSupabaseError(error);
  return (Array.isArray(data) ? data : []).map(row => ({
    id: String(row.amico_id || row.uid || row.id || ''),
    nome: String(row.nome_utente || row.username || 'Amico'),
    cid: row.cid == null ? null : String(row.cid),
  })).filter(friend => friend.id);
}

export async function updateUserHomebrewSettings(userId: Id, settings: HomebrewSettings): Promise<void> {
  const { error } = await getSupabaseClient().from('utenti').update({
    homebrew_settings: settings,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);
  throwIfSupabaseError(error);
}

