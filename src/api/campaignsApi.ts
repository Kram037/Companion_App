import type { Campagna, Id } from '../types/domain';
import { campaignSchema, parseArray, parseNullable } from '../schemas';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

export async function fetchCampaignById(campagnaId: Id): Promise<Campagna | null> {
  const { data, error } = await getSupabaseClient()
    .from('campagne')
    .select('*')
    .eq('id', campagnaId)
    .single();
  throwIfSupabaseError(error);
  return parseNullable(campaignSchema, data);
}

export async function fetchCampaignsByDm(dmId: Id): Promise<Campagna[]> {
  const { data, error } = await getSupabaseClient()
    .from('campagne')
    .select('*')
    .eq('id_dm', dmId)
    .order('data_creazione', { ascending: false });
  throwIfSupabaseError(error);
  return parseArray(campaignSchema, data);
}

