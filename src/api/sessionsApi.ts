import type { Id, Sessione } from '../types/domain';
import { parseData, parseNullable, sessionSchema } from '../schemas';
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
    .is('data_fine', null)
    .limit(1)
    .maybeSingle();
  throwIfSupabaseError(error);
  return parseNullable(sessionSchema, data);
}

export async function startCampaignSession(campagnaId: Id): Promise<Sessione> {
  const active = await fetchActiveSessionByCampaign(campagnaId);
  if (active) return active;

  const { data, error } = await getSupabaseClient()
    .from('sessioni')
    .insert({ campagna_id: campagnaId, data_inizio: new Date().toISOString() })
    .select('*')
    .single();
  throwIfSupabaseError(error);
  return parseData(sessionSchema, data);
}

export async function fetchHasInitiativeRequest(sessioneId: Id): Promise<boolean> {
  const { count, error } = await getSupabaseClient()
    .from('richieste_tiro_iniziativa')
    .select('id', { count: 'exact', head: true })
    .eq('sessione_id', sessioneId);
  throwIfSupabaseError(error);
  return (count ?? 0) > 0;
}

