import type { CombatCharacter, CombatSnapshot, Id, InitiativeRoll, MostroCombattimento } from '../types/domain';
import { combatMonsterSchema, parseArray } from '../schemas';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

import { fetchSessionById } from './sessionsApi';

const CONDITION_KEYS = [
  'concentrazione', 'accecato', 'affascinato', 'afferrato', 'assordato',
  'avvelenato', 'incapacitato', 'invisibile', 'paralizzato', 'pietrificato',
  'privo_di_sensi', 'prono', 'spaventato', 'stordito', 'trattenuto',
] as const;

type CombatConditionKey = typeof CONDITION_KEYS[number];

const COMBAT_MONSTER_COLUMNS = `id,sessione_id,nome,iniziativa,pv_attuali,punti_vita_max,created_at,resistenze_leggendarie,azioni_legg_max,${CONDITION_KEYS.join(',')}`;
const INITIATIVE_ROLL_COLUMNS = 'id,giocatore_id,valore,stato,created_at';
const COMBAT_TIMER_COLUMNS = 'id,target_kind,target_id,conditions,remaining_rounds';

export async function fetchCombatMonsters(sessioneId: Id): Promise<MostroCombattimento[]> {
  const { data, error } = await getSupabaseClient()
    .from('mostri_combattimento')
    .select(COMBAT_MONSTER_COLUMNS)
    .eq('sessione_id', sessioneId)
    .order('iniziativa', { ascending: false, nullsFirst: false });
  throwIfSupabaseError(error);
  return parseArray(combatMonsterSchema, data);
}

export async function fetchCombatSnapshot(campagnaId: Id, sessioneId: Id): Promise<CombatSnapshot> {
  const [sessione, rolls, mostri, personaggi] = await Promise.all([
    fetchSessionById(sessioneId),
    fetchInitiativeRolls(sessioneId),
    fetchCombatMonsters(sessioneId),
    fetchCombatCharacters(campagnaId),
  ]);
  return { sessione, tiri: rolls, mostri, personaggi };
}

export async function advanceCombatTurn(input: {
  sessioneId: Id;
  orderLength: number;
  round: number;
  turnIndex: number;
  nextMonster?: MostroCombattimento | null;
}): Promise<{ round: number; turnIndex: number; expiredTimers: number }> {
  const { round: nextRound, turnIndex: nextTurnIndex } = nextCombatTurnState(input.orderLength, input.round, input.turnIndex);
  if (input.orderLength <= 0) return { round: nextRound, turnIndex: nextTurnIndex, expiredTimers: 0 };
  const client = getSupabaseClient();

  if (input.nextMonster) {
    const updates: Record<string, number> = {};
    if ((input.nextMonster.resistenze_leggendarie ?? 0) > 0) updates.res_legg_attuali = input.nextMonster.resistenze_leggendarie ?? 0;
    if ((input.nextMonster.azioni_legg_max ?? 0) > 0) updates.azioni_legg_attuali = input.nextMonster.azioni_legg_max ?? 0;
    if (Object.keys(updates).length) {
      const { error } = await client.from('mostri_combattimento').update(updates).eq('id', input.nextMonster.id);
      throwIfSupabaseError(error);
    }
  }

  const { error } = await client.from('sessioni')
    .update({ combat_round: nextRound, combat_turn_index: nextTurnIndex })
    .eq('id', input.sessioneId);
  throwIfSupabaseError(error);

  let expiredTimers = 0;
  if (nextRound !== input.round) {
    try {
      expiredTimers = await tickCombatTimers(input.sessioneId);
    } catch (error) {
      console.warn('Errore tick timer:', error);
    }
  }
  return { round: nextRound, turnIndex: nextTurnIndex, expiredTimers };
}

export function nextCombatTurnState(orderLength: number, round: number, turnIndex: number): { round: number; turnIndex: number } {
  if (orderLength <= 0) return { round, turnIndex };
  const nextTurnIndex = turnIndex + 1 >= orderLength ? 0 : turnIndex + 1;
  return { round: nextTurnIndex === 0 ? round + 1 : round, turnIndex: nextTurnIndex };
}

export async function endCombat(sessioneId: Id): Promise<void> {
  const client = getSupabaseClient();
  const deleteRolls = await client.from('richieste_tiro_iniziativa').delete().eq('sessione_id', sessioneId);
  throwIfSupabaseError(deleteRolls.error);

  const deleteMonsters = await client.from('mostri_combattimento').delete().eq('sessione_id', sessioneId);
  throwIfSupabaseError(deleteMonsters.error);

  const resetSession = await client.from('sessioni')
    .update({ combat_round: 1, combat_turn_index: 0 })
    .eq('id', sessioneId);
  throwIfSupabaseError(resetSession.error);
}

async function fetchInitiativeRolls(sessioneId: Id): Promise<InitiativeRoll[]> {
  const client = getSupabaseClient();
  let { data, error } = await client.rpc('get_tiri_iniziativa', { p_sessione_id: sessioneId });
  if (error) {
    ({ data, error } = await client.from('richieste_tiro_iniziativa').select(INITIATIVE_ROLL_COLUMNS).eq('sessione_id', sessioneId));
  }
  throwIfSupabaseError(error);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id ? String(row.id) : null,
    giocatore_id: String(row.giocatore_id),
    giocatore_nome: row.giocatore_nome ? String(row.giocatore_nome) : null,
    valore: row.valore == null ? null : Number(row.valore),
    stato: row.stato ? String(row.stato) : null,
    created_at: row.created_at ? String(row.created_at) : null,
    completed_at: row.completed_at ? String(row.completed_at) : null,
  }));
}

async function fetchCombatCharacters(campagnaId: Id): Promise<CombatCharacter[]> {
  const client = getSupabaseClient();
  const { data: links, error: linksError } = await client.rpc('get_personaggi_in_campagna', { p_campagna_id: campagnaId });
  throwIfSupabaseError(linksError);
  const ids = (links ?? []).map((row: Record<string, unknown>) => row.personaggio_id).filter(Boolean).map(String);
  if (!ids.length) return [];
  const { data, error } = await client.from('personaggi')
    .select(`id,nome,immagine_url,punti_vita_max,pv_attuali,${CONDITION_KEYS.join(',')}`)
    .in('id', ids);
  throwIfSupabaseError(error);
  const playerByCharacter = new Map<string, string | null>((links ?? []).map((row: Record<string, unknown>) => [String(row.personaggio_id), row.player_user_id ? String(row.player_user_id) : null]));
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  return rows.map(row => ({
    id: String(row.id),
    nome: String(row.nome ?? '?'),
    player_user_id: playerByCharacter.get(String(row.id)) ?? null,
    immagine_url: row.immagine_url ? String(row.immagine_url) : null,
    punti_vita_max: row.punti_vita_max == null ? null : Number(row.punti_vita_max),
    pv_attuali: row.pv_attuali == null ? null : Number(row.pv_attuali),
    condizioni: CONDITION_KEYS.filter(key => Boolean(row[key])),
  }));
}

async function tickCombatTimers(sessioneId: Id): Promise<number> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('combat_timers')
    .select(COMBAT_TIMER_COLUMNS)
    .eq('sessione_id', sessioneId)
    .eq('expired', false);
  throwIfSupabaseError(error);

  let expiredCount = 0;
  for (const timer of (data ?? []) as Array<Record<string, unknown>>) {
    const id = String(timer.id ?? '');
    if (!id) continue;

    const remaining = Number(timer.remaining_rounds ?? 0) - 1;
    if (remaining > 0) {
      const update = await client.from('combat_timers').update({ remaining_rounds: remaining }).eq('id', id);
      throwIfSupabaseError(update.error);
      continue;
    }

    const conditions = timerConditions(timer.conditions);
    const targetId = timer.target_id ? String(timer.target_id) : '';
    const targetKind = timer.target_kind ? String(timer.target_kind) : '';
    if (targetId && conditions.length) {
      const update = Object.fromEntries(conditions.map(condition => [condition, false]));
      const table = targetKind === 'monster' ? 'mostri_combattimento' : targetKind === 'player' ? 'personaggi' : null;
      if (table) {
        const target = await client.from(table).update(update).eq('id', targetId);
        throwIfSupabaseError(target.error);
      }
    }

    const remove = await client.from('combat_timers').delete().eq('id', id);
    throwIfSupabaseError(remove.error);
    expiredCount += 1;
  }
  return expiredCount;
}

function timerConditions(value: unknown): CombatConditionKey[] {
  return Array.isArray(value) ? value.filter(isCombatConditionKey) : [];
}

function isCombatConditionKey(value: unknown): value is CombatConditionKey {
  return typeof value === 'string' && (CONDITION_KEYS as readonly string[]).includes(value);
}
