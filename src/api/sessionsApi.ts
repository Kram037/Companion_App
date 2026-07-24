import type { GenericRollGroup, GenericRollMetadata, Id, Sessione } from '../types/domain';
import {
  genericRollGroupIdSchema,
  genericRollResultSchema,
  parseArray,
  parseData,
  parseNullable,
  sessionSchema,
} from '../schemas';
import { getSupabaseClient, isMissingDatabaseColumn, throwIfSupabaseError } from './supabaseClient';

const SESSION_COLUMNS = 'id,campagna_id,data_inizio,data_fine,created_at,combat_round,combat_turn_index';
const SESSION_BASE_COLUMNS = 'id,campagna_id,data_inizio,data_fine,created_at';
const GENERIC_ROLL_COLUMNS = 'id,sessione_id,richiesta_id,giocatore_id,valore,tiro_naturale,stato,created_at,tipo_tiro,target_tiro,tiro_label';

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
  const { data, error } = await getSupabaseClient().rpc('start_campaign_session', {
    p_campagna_id: campagnaId,
  });
  throwIfSupabaseError(error);
  return parseData(sessionSchema, Array.isArray(data) ? data[0] : undefined);
}

export async function fetchHasInitiativeRequest(sessioneId: Id): Promise<boolean> {
  const { count, error } = await getSupabaseClient()
    .from('richieste_tiro_iniziativa')
    .select('id', { count: 'exact', head: true })
    .eq('sessione_id', sessioneId);
  throwIfSupabaseError(error);
  return (count ?? 0) > 0;
}

export async function endCampaignSession(sessioneId: Id): Promise<void> {
  const { error } = await getSupabaseClient().rpc('finish_campaign_session', {
    p_sessione_id: sessioneId,
  });
  throwIfSupabaseError(error);
}

export async function requestInitiativeRolls(sessioneId: Id, playerIds: Id[]): Promise<number> {
  const { data, error } = await getSupabaseClient().rpc('request_initiative_rolls', {
    p_sessione_id: sessioneId,
    p_player_ids: playerIds,
  });
  throwIfSupabaseError(error);
  const count = Number(data);
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Risposta iniziativa non valida');
  return count;
}

export async function requestGenericRolls(
  sessioneId: Id,
  playerIds: Id[],
  metadata: GenericRollMetadata,
): Promise<Id> {
  if (!playerIds.length) throw new Error('Seleziona almeno un giocatore');
  const { data, error } = await getSupabaseClient().rpc('request_generic_rolls', {
    p_sessione_id: sessioneId,
    p_player_ids: playerIds,
    p_tipo_tiro: metadata.tipoTiro,
    p_target_tiro: metadata.targetTiro,
    p_tiro_label: metadata.tiroLabel,
  });
  throwIfSupabaseError(error);
  return parseData(genericRollGroupIdSchema, data);
}

export async function fetchLatestGenericRollGroup(sessioneId: Id): Promise<GenericRollGroup | null> {
  const client = getSupabaseClient();
  const latestResult = await client
    .from('richieste_tiro_generico')
    .select(GENERIC_ROLL_COLUMNS)
    .eq('sessione_id', sessioneId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  throwIfSupabaseError(latestResult.error);
  const latest = parseNullable(genericRollResultSchema, latestResult.data);
  if (!latest) return null;

  const { data, error } = await client
    .from('richieste_tiro_generico')
    .select(GENERIC_ROLL_COLUMNS)
    .eq('sessione_id', sessioneId)
    .eq('richiesta_id', latest.richiesta_id)
    .order('valore', { ascending: false, nullsFirst: false });
  throwIfSupabaseError(error);
  return {
    richiestaId: latest.richiesta_id,
    tipoTiro: latest.tipo_tiro ?? null,
    targetTiro: latest.target_tiro ?? null,
    tiroLabel: latest.tiro_label ?? null,
    risultati: parseArray(genericRollResultSchema, data),
  };
}

export async function deleteGenericRollGroup(sessioneId: Id, richiestaId: Id): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('richieste_tiro_generico')
    .delete()
    .eq('sessione_id', sessioneId)
    .eq('richiesta_id', richiestaId);
  throwIfSupabaseError(error);
}

