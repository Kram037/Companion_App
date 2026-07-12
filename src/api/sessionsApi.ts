import type { Id, Sessione } from '../types/domain';
import { parseNullable, sessionSchema } from '../schemas';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

export async function fetchSessionById(sessioneId: Id): Promise<Sessione | null> {
  const { data, error } = await getSupabaseClient()
    .from('sessioni')
    .select('*')
    .eq('id', sessioneId)
    .single();
  throwIfSupabaseError(error);
  return parseNullable(sessionSchema, data);
}

export async function fetchActiveSessionByCampaign(campagnaId: Id): Promise<Sessione | null> {
  const { data, error } = await getSupabaseClient()
    .from('sessioni')
    .select('*')
    .eq('campagna_id', campagnaId)
    .eq('attiva', true)
    .maybeSingle();
  throwIfSupabaseError(error);
  return parseNullable(sessionSchema, data);
}

