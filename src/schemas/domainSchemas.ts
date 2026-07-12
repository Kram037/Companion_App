import { z } from 'zod';
import type { JsonValue } from '../types/domain';

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() => z.union([
  z.null(),
  z.boolean(),
  z.number(),
  z.string(),
  z.array(jsonValueSchema),
  z.record(z.string(), jsonValueSchema),
]));

export const jsonRecordSchema = z.record(z.string(), jsonValueSchema);

export const userProfileSchema = z.object({
  id: z.string(),
  username: z.string().nullish(),
  displayName: z.string().nullish(),
  avatarUrl: z.string().nullish(),
  email: z.string().nullish(),
}).passthrough();

export const campaignSchema = z.object({
  id: z.string(),
  nome_campagna: z.string(),
  id_dm: z.string(),
  descrizione: z.string().nullish(),
  icona_name: z.string().nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
}).passthrough();

export const characterClassSchema = z.object({
  nome: z.string(),
  livello: z.number(),
  sottoclasse: z.string().nullish(),
}).passthrough();

export const characterSchema = z.object({
  id: z.string(),
  nome: z.string(),
  user_id: z.string().nullish(),
  livello: z.number().default(1),
  esperienza: z.number().nullish(),
  classi: z.array(characterClassSchema).nullish(),
  razza: z.string().nullish(),
  background: z.string().nullish(),
  bonus_manuali: jsonRecordSchema.nullish(),
  updated_at: z.string().nullish(),
}).passthrough();

export const sessionSchema = z.object({
  id: z.string(),
  campagna_id: z.string(),
  stato: z.string().nullish(),
  round_corrente: z.number().nullish(),
  turno_corrente: z.number().nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
}).passthrough();

export const rollRequestSchema = z.object({
  id: z.string(),
  campagna_id: z.string().nullish(),
  sessione_id: z.string().nullish(),
  personaggio_id: z.string().nullish(),
  tipo: z.string(),
  stato: z.string().nullish(),
  payload: jsonRecordSchema.nullish(),
}).passthrough();

export const initiativeRollRequestSchema = rollRequestSchema;
export const genericRollRequestSchema = rollRequestSchema;

export const combatMonsterSchema = z.object({
  id: z.string(),
  sessione_id: z.string().nullish(),
  nome: z.string(),
  iniziativa: z.number().nullish(),
  pv_attuali: z.number().nullish(),
  pv_max: z.number().nullish(),
  dati: jsonRecordSchema.nullish(),
}).passthrough();

export const homebrewItemSchema = z.object({
  id: z.string(),
  user_id: z.string().nullish(),
  tipo: z.string().nullish(),
  nome: z.string(),
  dati: jsonRecordSchema.nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
}).passthrough();

export const homebrewObjectSchema = homebrewItemSchema;
export const homebrewSpellSchema = homebrewItemSchema;

export const runtimeDataBundleSchema = z.object({
  key: z.string(),
  version: z.union([z.string(), z.number()]).nullish(),
  source: z.string().nullish(),
  data: jsonValueSchema,
}).passthrough();

export type UserProfileFromSchema = z.infer<typeof userProfileSchema>;
export type CampaignFromSchema = z.infer<typeof campaignSchema>;
export type CharacterFromSchema = z.infer<typeof characterSchema>;
export type SessionFromSchema = z.infer<typeof sessionSchema>;
export type RollRequestFromSchema = z.infer<typeof rollRequestSchema>;
export type CombatMonsterFromSchema = z.infer<typeof combatMonsterSchema>;
export type HomebrewItemFromSchema = z.infer<typeof homebrewItemSchema>;
export type RuntimeDataBundleFromSchema = z.infer<typeof runtimeDataBundleSchema>;
