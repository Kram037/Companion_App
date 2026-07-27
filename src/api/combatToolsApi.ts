import { z } from 'zod';

import { jsonValueSchema, parseArray, parseData } from '../schemas';
import type { HomebrewItem } from '../types/domain';
import { fetchHomebrewByUser } from './homebrewApi';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

declare global {
  interface Window {
    ensureRuntimeData?: (key: string) => Promise<unknown>;
    COMP_MONSTERS_DATA?: unknown;
  }
}

export const COMBAT_CONDITIONS = [
  'concentrazione', 'accecato', 'affascinato', 'afferrato', 'assordato',
  'avvelenato', 'incapacitato', 'invisibile', 'paralizzato', 'pietrificato',
  'privo_di_sensi', 'prono', 'spaventato', 'stordito', 'trattenuto',
] as const;

const idSchema = z.string().trim().min(1);
const compendiumMonsterSchema = z.object({
  id: idSchema,
  nome: z.string().trim().min(1),
}).passthrough();
const conditionSchema = z.enum(COMBAT_CONDITIONS);
const nullableNumber = z.number().nullish();
const initiativeSchema = z.number().int().min(-100).max(100);
const MAX_MONSTERS_PER_BATCH = 500;

const combatToolMonsterSchema = z.object({
  id: idSchema,
  sessione_id: idSchema.nullish(),
  campagna_id: idSchema.nullish(),
  nome: z.string(),
  tipologia: z.string().nullish(),
  taglia: z.string().nullish(),
  allineamento: z.string().nullish(),
  grado_sfida: z.string().nullish(),
  forza: nullableNumber,
  destrezza: nullableNumber,
  costituzione: nullableNumber,
  intelligenza: nullableNumber,
  saggezza: nullableNumber,
  carisma: nullableNumber,
  iniziativa: nullableNumber,
  pv_attuali: nullableNumber,
  punti_vita_max: nullableNumber,
  dadi_vita_num: nullableNumber,
  dado_vita: nullableNumber,
  classe_armatura: nullableNumber,
  velocita: nullableNumber,
  tiri_salvezza: jsonValueSchema.nullish(),
  competenze_abilita: jsonValueSchema.nullish(),
  maestrie_abilita: jsonValueSchema.nullish(),
  resistenze: jsonValueSchema.nullish(),
  immunita: jsonValueSchema.nullish(),
  attacchi: jsonValueSchema.nullish(),
  azioni_leggendarie: jsonValueSchema.nullish(),
  slot_incantesimo: jsonValueSchema.nullish(),
  caratteristica_incantatore: z.string().nullish(),
  is_placeholder: z.boolean().nullish(),
  created_at: z.string().nullish(),
  resistenze_leggendarie: nullableNumber,
  res_legg_attuali: nullableNumber,
  azioni_legg_max: nullableNumber,
  azioni_legg_attuali: nullableNumber,
  esaustione: nullableNumber,
  ...Object.fromEntries(COMBAT_CONDITIONS.map(key => [key, z.boolean().nullish()])),
});

const combatTimerSchema = z.object({
  id: idSchema,
  sessione_id: idSchema,
  campagna_id: idSchema,
  nome: z.string(),
  target_kind: z.enum(['monster', 'player', 'global']),
  target_id: idSchema.nullish(),
  target_name: z.string().nullish(),
  conditions: z.array(conditionSchema).default([]),
  duration_rounds: z.number().int().positive(),
  remaining_rounds: z.number().int().nonnegative(),
  created_by: idSchema.nullish(),
  created_at: z.string().nullish(),
  expired: z.boolean().default(false),
});

const placeholderInputSchema = z.object({
  campagnaId: idSchema,
  sessioneId: idSchema,
  nome: z.string().trim().min(1).max(80),
  hpMax: z.number().int().min(1).max(999_999),
  armorClass: z.number().int().min(1).max(99),
  initiative: initiativeSchema.optional(),
});

const monsterUpdateSchema = z.object({
  hp: z.number().int().min(0).max(999_999),
  hpMax: z.number().int().min(1).max(999_999),
  armorClass: z.number().int().min(1).max(99),
  exhaustion: z.number().int().min(0).max(6).default(0),
  conditions: z.array(conditionSchema).default([]),
}).refine(value => value.hp <= value.hpMax, {
  message: 'I punti vita attuali non possono superare i punti vita massimi',
  path: ['hp'],
});

const monsterCounterSchema = z.object({
  field: z.enum(['res_legg_attuali', 'azioni_legg_attuali']),
  value: z.number().int().min(0).max(99),
});

const timerInputSchema = z.object({
  campagnaId: idSchema,
  sessioneId: idSchema,
  createdBy: idSchema,
  nome: z.string().trim().min(1).max(60),
  targetKind: z.enum(['monster', 'player', 'global']),
  targetId: idSchema.nullish(),
  targetName: z.string().trim().max(80).nullish(),
  conditions: z.array(conditionSchema).default([]),
  rounds: z.number().int().min(1).max(9_999),
}).superRefine((value, context) => {
  if (value.targetKind !== 'global' && !value.targetId) {
    context.addIssue({ code: 'custom', message: 'Il target e obbligatorio', path: ['targetId'] });
  }
});
const timerUpdateSchema = z.object({
  remainingRounds: z.number().int().min(1).max(9_999),
  conditions: z.array(conditionSchema),
});

const MONSTER_COLUMNS = [
  'id', 'sessione_id', 'campagna_id', 'nome', 'iniziativa', 'pv_attuali',
  'punti_vita_max', 'classe_armatura', 'is_placeholder', 'created_at',
  'resistenze_leggendarie', 'res_legg_attuali', 'azioni_legg_max',
  'azioni_legg_attuali', 'esaustione', ...COMBAT_CONDITIONS,
].join(',');

const MONSTER_CLONE_COLUMNS = [
  'id', 'sessione_id', 'campagna_id', 'nome', 'tipologia', 'taglia',
  'allineamento', 'grado_sfida', 'forza', 'destrezza', 'costituzione',
  'intelligenza', 'saggezza', 'carisma', 'punti_vita_max', 'pv_attuali',
  'dadi_vita_num', 'dado_vita', 'classe_armatura', 'velocita', 'iniziativa',
  'tiri_salvezza', 'competenze_abilita', 'maestrie_abilita', 'resistenze',
  'immunita', 'attacchi', 'azioni_leggendarie', 'resistenze_leggendarie',
  'res_legg_attuali', 'azioni_legg_max', 'azioni_legg_attuali',
  'slot_incantesimo', 'caratteristica_incantatore', 'is_placeholder',
  'esaustione', 'created_at', ...COMBAT_CONDITIONS,
].join(',');

const TIMER_COLUMNS = [
  'id', 'sessione_id', 'campagna_id', 'nome', 'target_kind', 'target_id',
  'target_name', 'conditions', 'duration_rounds', 'remaining_rounds',
  'created_by', 'created_at', 'expired',
].join(',');

export type CombatCondition = z.infer<typeof conditionSchema>;
export type CombatToolMonster = z.infer<typeof combatToolMonsterSchema>;
export type CombatTimer = z.infer<typeof combatTimerSchema>;
export type CreatePlaceholderMonsterInput = z.input<typeof placeholderInputSchema>;
export type CreateCombatTimerInput = z.input<typeof timerInputSchema>;
export type UpdateCombatTimerInput = z.input<typeof timerUpdateSchema>;
export type UpdateCombatMonsterInput = z.input<typeof monsterUpdateSchema>;
export type CombatMonsterSources = {
  monsters: HomebrewItem[];
  encounters: HomebrewItem[];
};
export type CombatMonsterDraft = {
  source: Record<string, unknown>;
  initiative?: number;
  initiativeGroup?: string;
};

export async function fetchCombatToolMonsters(sessioneId: string): Promise<CombatToolMonster[]> {
  const { data, error } = await getSupabaseClient()
    .from('mostri_combattimento')
    .select(MONSTER_CLONE_COLUMNS)
    .eq('sessione_id', idSchema.parse(sessioneId))
    .order('iniziativa', { ascending: false, nullsFirst: false });
  throwIfSupabaseError(error);
  return parseArray(combatToolMonsterSchema, data);
}

export async function createPlaceholderMonster(input: CreatePlaceholderMonsterInput): Promise<CombatToolMonster> {
  const value = placeholderInputSchema.parse(input);
  const { data, error } = await getSupabaseClient()
    .from('mostri_combattimento')
    .insert({
      campagna_id: value.campagnaId,
      sessione_id: value.sessioneId,
      nome: value.nome,
      iniziativa: value.initiative ?? Math.floor(Math.random() * 20) + 1,
      punti_vita_max: value.hpMax,
      pv_attuali: value.hpMax,
      classe_armatura: value.armorClass,
      is_placeholder: true,
    })
    .select(MONSTER_COLUMNS)
    .single();
  throwIfSupabaseError(error);
  return parseData(combatToolMonsterSchema, data);
}

export async function fetchCombatMonsterSources(userId: string): Promise<CombatMonsterSources> {
  const validUserId = idSchema.parse(userId);
  const [monsters, encounters] = await Promise.all([
    fetchHomebrewByUser('homebrew_nemici', validUserId),
    fetchHomebrewByUser('homebrew_combattimenti', validUserId),
  ]);
  return { monsters, encounters };
}

export async function fetchCompendiumMonsterSources(): Promise<HomebrewItem[]> {
  if (typeof window.ensureRuntimeData !== 'function') throw new Error('Catalogo mostri non disponibile');
  await window.ensureRuntimeData('monsters');
  return parseArray(compendiumMonsterSchema, window.COMP_MONSTERS_DATA);
}

export async function createCombatMonsters(input: {
  campagnaId: string;
  sessioneId: string;
  drafts: CombatMonsterDraft[];
}): Promise<CombatToolMonster[]> {
  if (!input.drafts.length) throw new Error('Seleziona almeno un mostro');
  if (input.drafts.length > MAX_MONSTERS_PER_BATCH) throw new Error(`Puoi aggiungere al massimo ${MAX_MONSTERS_PER_BATCH} mostri alla volta`);
  const payloads = combatMonsterPayloads(input.drafts, input.campagnaId, input.sessioneId);
  const { data, error } = await getSupabaseClient()
    .from('mostri_combattimento')
    .insert(payloads)
    .select(MONSTER_COLUMNS);
  throwIfSupabaseError(error);
  return parseArray(combatToolMonsterSchema, data);
}

export async function updateCombatMonster(
  monsterId: string,
  input: UpdateCombatMonsterInput,
): Promise<CombatToolMonster> {
  const value = monsterUpdateSchema.parse(input);
  const selected = new Set(value.conditions);
  return updateMonster(monsterId, {
    pv_attuali: value.hp,
    punti_vita_max: value.hpMax,
    classe_armatura: value.armorClass,
    esaustione: value.exhaustion,
    ...Object.fromEntries(COMBAT_CONDITIONS.map(condition => [condition, selected.has(condition)])),
  });
}

export async function updateCombatMonsterCounter(
  monsterId: string,
  field: 'res_legg_attuali' | 'azioni_legg_attuali',
  value: number,
): Promise<CombatToolMonster> {
  const update = monsterCounterSchema.parse({ field, value });
  return updateMonster(monsterId, { [update.field]: update.value });
}

export async function duplicateCombatMonster(monsterId: string, sessioneId: string): Promise<CombatToolMonster> {
  const client = getSupabaseClient();
  const validMonsterId = idSchema.parse(monsterId);
  const validSessionId = idSchema.parse(sessioneId);
  const [{ data: sourceData, error: sourceError }, monsters] = await Promise.all([
    client.from('mostri_combattimento').select(MONSTER_CLONE_COLUMNS).eq('id', validMonsterId).single(),
    fetchCombatToolMonsters(validSessionId),
  ]);
  throwIfSupabaseError(sourceError);
  const source = parseData(combatToolMonsterSchema, sourceData);
  if (source.sessione_id !== validSessionId) throw new Error('Il mostro non appartiene alla sessione');

  const { id: _id, created_at: _createdAt, ...copy } = source;
  const clone: Record<string, unknown> = {
    ...copy,
    nome: nextCombatMonsterCopyName(source.nome, monsters.map(monster => monster.nome)),
    iniziativa: Math.floor(Math.random() * 20) + 1,
    pv_attuali: source.punti_vita_max ?? source.pv_attuali ?? 10,
    res_legg_attuali: source.resistenze_leggendarie ?? 0,
    azioni_legg_attuali: source.azioni_legg_max ?? 0,
    esaustione: 0,
  };
  for (const condition of COMBAT_CONDITIONS) clone[condition] = false;

  const { data, error } = await client
    .from('mostri_combattimento')
    .insert(clone)
    .select(MONSTER_COLUMNS)
    .single();
  throwIfSupabaseError(error);
  return parseData(combatToolMonsterSchema, data);
}

export async function removeCombatMonster(monsterId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('mostri_combattimento')
    .delete()
    .eq('id', idSchema.parse(monsterId));
  throwIfSupabaseError(error);
}

export async function fetchCombatTimers(sessioneId: string): Promise<CombatTimer[]> {
  const { data, error } = await getSupabaseClient()
    .from('combat_timers')
    .select(TIMER_COLUMNS)
    .eq('sessione_id', idSchema.parse(sessioneId))
    .eq('expired', false)
    .order('created_at', { ascending: true });
  throwIfSupabaseError(error);
  return parseArray(combatTimerSchema, data);
}

export async function createCombatTimer(input: CreateCombatTimerInput): Promise<CombatTimer> {
  const value = timerInputSchema.parse(input);
  const targetId = value.targetKind === 'global' ? null : value.targetId;
  const { data, error } = await getSupabaseClient()
    .from('combat_timers')
    .insert({
      campagna_id: value.campagnaId,
      sessione_id: value.sessioneId,
      created_by: value.createdBy,
      nome: value.nome,
      target_kind: value.targetKind,
      target_id: targetId,
      target_name: targetId ? value.targetName || null : null,
      conditions: value.conditions,
      duration_rounds: value.rounds,
      remaining_rounds: value.rounds,
    })
    .select(TIMER_COLUMNS)
    .single();
  throwIfSupabaseError(error);
  return parseData(combatTimerSchema, data);
}

export async function updateCombatTimer(timerId: string, input: UpdateCombatTimerInput): Promise<CombatTimer> {
  const value = timerUpdateSchema.parse(input);
  const { data, error } = await getSupabaseClient()
    .from('combat_timers')
    .update({
      remaining_rounds: value.remainingRounds,
      conditions: value.conditions,
    })
    .eq('id', idSchema.parse(timerId))
    .select(TIMER_COLUMNS)
    .single();
  throwIfSupabaseError(error);
  return parseData(combatTimerSchema, data);
}

export async function removeCombatTimer(timerId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('combat_timers')
    .delete()
    .eq('id', idSchema.parse(timerId));
  throwIfSupabaseError(error);
}

export function activeCombatConditions(monster: CombatToolMonster): CombatCondition[] {
  const values = monster as CombatToolMonster & Partial<Record<CombatCondition, boolean | null>>;
  return COMBAT_CONDITIONS.filter(condition => values[condition] === true);
}

export function nextCombatMonsterCopyName(sourceName: string, existingNames: readonly string[]): string {
  const baseName = sourceName.replace(/\s*#\d+\s*$/, '').trim();
  let largestCopy = 0;
  for (const name of existingNames) {
    if (name.replace(/\s*#\d+\s*$/, '').trim() !== baseName) continue;
    const suffix = name.match(/#(\d+)\s*$/);
    largestCopy = Math.max(largestCopy, suffix ? Number(suffix[1]) : 1);
  }
  return `${baseName} #${largestCopy + 1}`;
}

export function combatMonsterPayload(
  source: Record<string, unknown>,
  campagnaId: string,
  sessioneId: string,
  initiative?: number,
): Record<string, unknown> {
  const hitDice = parseHitDice(source.punti_ferita);
  const dexterity = abilityScore(source, 'destrezza');
  const initiativeModifier = numberValue(source.mod_iniziativa, Math.floor((dexterity - 10) / 2));
  const hpMax = numberValue(source.punti_vita_max ?? source.punti_ferita, 10);
  const legendaryResistances = numberValue(source.resistenze_leggendarie, textResourceCount(source.tratti, /(?:legendary resist(?:ance|enza)|resistenza leggendaria)/i));
  const legendaryActions = numberValue(source.azioni_legg_max, textResourceCount(source.azioni_leggendarie, /(?:legendary actions|azioni leggendarie)/i));
  const validInitiative = initiativeSchema.optional().parse(initiative);
  return {
    sessione_id: idSchema.parse(sessioneId),
    campagna_id: idSchema.parse(campagnaId),
    nome: stringValue(source.nome, 'Mostro'),
    tipologia: stringValue(source.tipo ?? source.tipologia, 'Bestia'),
    taglia: stringValue(source.taglia, 'Media'),
    allineamento: stringValue(source.allineamento, 'Neutrale'),
    grado_sfida: stringValue(source.grado_sfida, '0'),
    forza: abilityScore(source, 'forza'),
    destrezza: dexterity,
    costituzione: abilityScore(source, 'costituzione'),
    intelligenza: abilityScore(source, 'intelligenza'),
    saggezza: abilityScore(source, 'saggezza'),
    carisma: abilityScore(source, 'carisma'),
    punti_vita_max: hpMax,
    pv_attuali: hpMax,
    dadi_vita_num: numberValue(source.dadi_vita_num, hitDice?.count ?? 1),
    dado_vita: numberValue(source.dado_vita, hitDice?.die ?? hitDieForSize(source.taglia)),
    classe_armatura: numberValue(source.classe_armatura, 10),
    velocita: numberValue(source.velocita, 9),
    iniziativa: validInitiative ?? Math.floor(Math.random() * 20) + 1 + initiativeModifier,
    tiri_salvezza: sourceList(source.tiri_salvezza, saveAbilities(source.tiri_salvezza_testo)),
    competenze_abilita: sourceList(source.competenze_abilita, skillNames(source.abilita_testo)),
    maestrie_abilita: jsonArray(source.maestrie_abilita),
    resistenze: jsonArray(source.resistenze),
    immunita: sourceList(source.immunita, jsonArray(source.immunita_danni)),
    attacchi: sourceActions(source.attacchi, source.azioni, true),
    azioni_leggendarie: sourceActions(source.azioni_leggendarie),
    resistenze_leggendarie: legendaryResistances,
    res_legg_attuali: legendaryResistances,
    azioni_legg_max: legendaryActions,
    azioni_legg_attuali: legendaryActions,
    slot_incantesimo: jsonRecord(source.slot_incantesimo),
    caratteristica_incantatore: nullableString(source.caratteristica_incantatore),
    is_placeholder: false,
    esaustione: 0,
    ...Object.fromEntries(COMBAT_CONDITIONS.map(condition => [condition, false])),
  };
}

export function combatMonsterPayloads(
  drafts: CombatMonsterDraft[],
  campagnaId: string,
  sessioneId: string,
): Record<string, unknown>[] {
  const groupInitiatives = new Map<string, number>();
  return drafts.map(draft => {
    const shared = draft.initiativeGroup ? groupInitiatives.get(draft.initiativeGroup) : undefined;
    const payload = combatMonsterPayload(draft.source, campagnaId, sessioneId, shared ?? draft.initiative);
    if (draft.initiativeGroup && shared == null) {
      groupInitiatives.set(draft.initiativeGroup, Number(payload.iniziativa));
    }
    return payload;
  });
}

async function updateMonster(monsterId: string, changes: Record<string, unknown>): Promise<CombatToolMonster> {
  const { data, error } = await getSupabaseClient()
    .from('mostri_combattimento')
    .update(changes)
    .eq('id', idSchema.parse(monsterId))
    .select(MONSTER_COLUMNS)
    .single();
  throwIfSupabaseError(error);
  return parseData(combatToolMonsterSchema, data);
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function abilityScore(source: Record<string, unknown>, ability: string) {
  const characteristics = recordValue(source.caratteristiche);
  const nested = recordValue(characteristics?.[ability]);
  return numberValue(source[ability] ?? nested?.score, 10);
}

function parseHitDice(value: unknown) {
  const match = String(value ?? '').match(/\((\d+)d(\d+)/i);
  return match ? { count: Number(match[1]), die: Number(match[2]) } : null;
}

function sourceList(value: unknown, fallback: unknown[]) {
  const items = jsonArray(value);
  return items.length ? items : fallback;
}

function saveAbilities(value: unknown) {
  const text = String(value ?? '').toLocaleLowerCase('it');
  return Object.entries({
    for: 'forza', des: 'destrezza', cos: 'costituzione',
    int: 'intelligenza', sag: 'saggezza', car: 'carisma',
  }).flatMap(([short, ability]) => new RegExp(`\\b${short}\\s*[+-]\\d+`, 'i').test(text) ? [ability] : []);
}

function skillNames(value: unknown) {
  return String(value ?? '').split(',').map(entry => entry.replace(/\s+[+-]\s*\d+.*$/, '').trim()).filter(Boolean);
}

function sourceActions(primary: unknown, fallback?: unknown, includePlain = false) {
  const items = jsonArray(primary);
  if (items.length) return items;
  return String(fallback ?? primary ?? '').split(/\n\s*\n/).flatMap(section => {
    const text = section.trim();
    const match = text.match(/^\*\*(.+?)\.?\*\*\s*(.*)$/s);
    if (match) return [{ nome: match[1].replace(/\.$/, '').trim(), descrizione: match[2].trim() }];
    if (!includePlain || !text) return [];
    // ponytail: plain statblocks use the first sentence as title; replace when the catalog exposes structured actions.
    const split = text.indexOf('. ');
    return [{ nome: split > 0 ? text.slice(0, split) : 'Azione', descrizione: split > 0 ? text.slice(split + 2) : text }];
  });
}

function textResourceCount(value: unknown, label: RegExp) {
  const text = String(value ?? '');
  if (!label.test(text)) return 0;
  const count = text.match(/\((\d+)\s*\/[^)]*\)/)?.[1] ?? text.match(/(\d+)\s+(?:legendary actions|azioni leggendarie)/i)?.[1];
  return count ? Number(count) : 0;
}

function jsonArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter(entry => jsonValueSchema.safeParse(entry).success)
    : [];
}

function jsonRecord(value: unknown) {
  const record = recordValue(value);
  return record && jsonValueSchema.safeParse(record).success ? record : null;
}

function hitDieForSize(value: unknown) {
  return ({ Minuscola: 4, Piccola: 6, Media: 8, Grande: 10, Enorme: 12, Mastodontica: 20 } as Record<string, number>)[String(value)] ?? 8;
}
