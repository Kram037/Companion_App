import type { CombatCharacter, CombatSnapshot, Id, InitiativeRoll, MostroCombattimento } from '../types/domain';
import { campaignCharacterSchema, combatAdvanceResultSchema, combatCharacterRowSchema, combatMonsterSchema, initiativeRollSchema, parseArray, parseData } from '../schemas';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

import { fetchSessionById } from './sessionsApi';

const CONDITION_KEYS = [
  'concentrazione', 'accecato', 'affascinato', 'afferrato', 'assordato',
  'avvelenato', 'incapacitato', 'invisibile', 'paralizzato', 'pietrificato',
  'privo_di_sensi', 'prono', 'spaventato', 'stordito', 'trattenuto',
] as const;

export async function fetchCombatMonsters(sessioneId: Id): Promise<MostroCombattimento[]> {
  const { data, error } = await getSupabaseClient()
    .rpc('get_combat_monsters_safe', { p_sessione_id: sessioneId });
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
  if (sessione && sessione.campagna_id !== campagnaId) {
    throw new Error('La sessione non appartiene alla campagna richiesta');
  }
  return { sessione, tiri: rolls, mostri, personaggi };
}

export async function advanceCombatTurn(input: {
  sessioneId: Id;
  orderLength: number;
  round: number;
  turnIndex: number;
  nextMonster?: MostroCombattimento | null;
}): Promise<{ round: number; turnIndex: number; expiredTimers: number; advanced: boolean }> {
  const { round: nextRound, turnIndex: nextTurnIndex } = nextCombatTurnState(input.orderLength, input.round, input.turnIndex);
  if (input.orderLength <= 0) return { round: nextRound, turnIndex: nextTurnIndex, expiredTimers: 0, advanced: false };
  const { data, error } = await getSupabaseClient().rpc('advance_combat_turn', {
    p_sessione_id: input.sessioneId,
    p_order_length: input.orderLength,
    p_expected_round: input.round,
    p_expected_turn_index: input.turnIndex,
    p_next_monster_id: input.nextMonster?.id ?? null,
  });
  throwIfSupabaseError(error);
  const result = parseData(combatAdvanceResultSchema, Array.isArray(data) ? data[0] : data);
  return {
    round: result.combat_round,
    turnIndex: result.combat_turn_index,
    expiredTimers: result.expired_timers,
    advanced: result.advanced,
  };
}

export function nextCombatTurnState(orderLength: number, round: number, turnIndex: number): { round: number; turnIndex: number } {
  if (orderLength <= 0) return { round, turnIndex };
  const nextTurnIndex = turnIndex + 1 >= orderLength ? 0 : turnIndex + 1;
  return { round: nextTurnIndex === 0 ? round + 1 : round, turnIndex: nextTurnIndex };
}

export async function endCombat(sessioneId: Id): Promise<void> {
  const { error } = await getSupabaseClient().rpc('finish_combat', { p_sessione_id: sessioneId });
  throwIfSupabaseError(error);
}

async function fetchInitiativeRolls(sessioneId: Id): Promise<InitiativeRoll[]> {
  const { data, error } = await getSupabaseClient().rpc('get_tiri_iniziativa', { p_sessione_id: sessioneId });
  throwIfSupabaseError(error);
  return parseArray(initiativeRollSchema, data);
}

async function fetchCombatCharacters(campagnaId: Id): Promise<CombatCharacter[]> {
  const client = getSupabaseClient();
  const { data: links, error: linksError } = await client.rpc('get_personaggi_in_campagna', { p_campagna_id: campagnaId });
  throwIfSupabaseError(linksError);
  const parsedLinks = parseArray(campaignCharacterSchema, links);
  const ids = parsedLinks.map(row => row.personaggio_id);
  if (!ids.length) return [];
  const { data, error } = await client.from('personaggi')
    .select(`id,nome,immagine_url,punti_vita_max,pv_attuali,${CONDITION_KEYS.join(',')}`)
    .in('id', ids);
  throwIfSupabaseError(error);
  const playerByCharacter = new Map(parsedLinks.map(row => [row.personaggio_id, row.player_user_id ?? null]));
  const rows = parseArray(combatCharacterRowSchema, data);
  return rows.map(row => ({
    id: row.id,
    nome: row.nome,
    player_user_id: playerByCharacter.get(row.id) ?? null,
    immagine_url: row.immagine_url,
    punti_vita_max: row.punti_vita_max,
    pv_attuali: row.pv_attuali,
    condizioni: CONDITION_KEYS.filter(key => Boolean(row[key])),
  }));
}
