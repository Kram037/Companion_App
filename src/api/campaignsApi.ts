import type { Campagna, Id } from '../types/domain';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

export async function fetchCampaignById(campagnaId: Id): Promise<Campagna | null> {
  const { data, error } = await getSupabaseClient()
    .from('campagne')
    .select('*')
    .eq('id', campagnaId)
    .single();
  throwIfSupabaseError(error);
  return data ?? null;
}

export async function fetchCampaignsByDm(dmId: Id): Promise<Campagna[]> {
  const { data, error } = await getSupabaseClient()
    .from('campagne')
    .select('*')
    .eq('id_dm', dmId)
    .order('data_creazione', { ascending: false });
  throwIfSupabaseError(error);
  return data ?? [];
}

