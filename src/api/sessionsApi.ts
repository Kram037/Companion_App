import type { Id, Sessione } from '../types/domain';
import { parseData, parseNullable, sessionSchema } from '../schemas';
import { getSupabaseClient, isMissingDatabaseColumn, throwIfSupabaseError } from './supabaseClient';

const SESSION_COLUMNS = 'id,campagna_id,data_inizio,data_fine,created_at,combat_round,combat_turn_index';
const SESSION_BASE_COLUMNS = 'id,campagna_id,data_inizio,data_fine,created_at';

export async function fetchSessionById(sessioneId: Id): Promise<Sessione | null> {
  const client = getSupabaseClient();
  const result = await client
    .from('sessioni')
    .select(SESSION_COLUMNS)
    .eq('id', sessioneId)
    .single();
  if (!isMissingDatabaseColumn(result.error)) {
    throwIfSupabaseError(result.error);
    return parseNullable(sessionSchema, result.data);
  }

  const fallback = await client
    .from('sessioni')
    .select(SESSION_BASE_COLUMNS)
    .eq('id', sessioneId)
    .single();
  throwIfSupabaseError(fallback.error);
  return parseNullable(sessionSchema, fallback.data);
}

export async function fetchActiveSessionByCampaign(campagnaId: Id): Promise<Sessione | null> {
  const client = getSupabaseClient();
  const result = await client
    .from('sessioni')
    .select(SESSION_COLUMNS)
    .eq('campagna_id', campagnaId)
    .is('data_fine', null)
    .limit(1)
    .maybeSingle();
  if (!isMissingDatabaseColumn(result.error)) {
    throwIfSupabaseError(result.error);
    return parseNullable(sessionSchema, result.data);
  }

  const fallback = await client
    .from('sessioni')
    .select(SESSION_BASE_COLUMNS)
    .eq('campagna_id', campagnaId)
    .is('data_fine', null)
    .limit(1)
    .maybeSingle();
  throwIfSupabaseError(fallback.error);
  return parseNullable(sessionSchema, fallback.data);
}

export async function startCampaignSession(campagnaId: Id): Promise<Sessione> {
  const active = await fetchActiveSessionByCampaign(campagnaId);
  if (active) return active;

  const { data, error } = await getSupabaseClient()
    .from('sessioni')
    .insert({ campagna_id: campagnaId, data_inizio: new Date().toISOString() })
    .select(SESSION_BASE_COLUMNS)
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

