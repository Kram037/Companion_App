import type { CombatCharacter, CombatSnapshot, Id, InitiativeRoll, MostroCombattimento } from '../types/domain';
import { combatMonsterSchema, parseArray } from '../schemas';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

import { fetchSessionById } from './sessionsApi';

const CONDITION_KEYS = [
  'concentrazione', 'accecato', 'affascinato', 'afferrato', 'assordato',
  'avvelenato', 'incapacitato', 'invisibile', 'paralizzato', 'pietrificato',
  'privo_di_sensi', 'prono', 'spaventato', 'stordito', 'trattenuto',
] as const;

const COMBAT_MONSTER_COLUMNS = `id,sessione_id,nome,iniziativa,pv_attuali,punti_vita_max,created_at,${CONDITION_KEYS.join(',')}`;
const INITIATIVE_ROLL_COLUMNS = 'id,giocatore_id,valore,stato,created_at';

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

