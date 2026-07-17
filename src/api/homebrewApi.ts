import type { HomebrewItem, Id } from '../types/domain';
import { homebrewItemSchema, parseArray } from '../schemas';
import { getSupabaseClient, isMissingDatabaseColumn, throwIfSupabaseError } from './supabaseClient';

export type HomebrewTable =
  | 'homebrew_background'
  | 'homebrew_classi'
  | 'homebrew_combattimenti'
  | 'homebrew_incantesimi'
  | 'homebrew_nemici'
  | 'homebrew_oggetti'
  | 'homebrew_razze'
  | 'homebrew_stili'
  | 'homebrew_suppliche'
  | 'homebrew_talenti';

const HOME_BREW_COMMON_COLUMNS = 'id,user_id,nome,created_at,updated_at';
const HOME_BREW_STABLE_COLUMNS: Record<HomebrewTable, string> = {
  homebrew_background: `${HOME_BREW_COMMON_COLUMNS},competenze_abilita,competenze_strumenti`,
  homebrew_classi: `${HOME_BREW_COMMON_COLUMNS},dado_vita,tiri_salvezza,tipo_caster,risorse_speciali`,
  homebrew_combattimenti: `${HOME_BREW_COMMON_COLUMNS},mostri`,
  homebrew_incantesimi: `${HOME_BREW_COMMON_COLUMNS},livello,scuola,tempo_lancio,gittata,componenti,durata,descrizione`,
  homebrew_nemici: `${HOME_BREW_COMMON_COLUMNS},taglia,tipo,allineamento,classe_armatura,punti_vita_max,velocita,forza,destrezza,costituzione,intelligenza,saggezza,carisma,grado_sfida,attacchi,resistenze,immunita`,
  homebrew_oggetti: `${HOME_BREW_COMMON_COLUMNS},tipo,rarita,proprieta`,
  homebrew_razze: `${HOME_BREW_COMMON_COLUMNS},taglia,velocita,competenze_abilita,resistenze`,
  homebrew_stili: `${HOME_BREW_COMMON_COLUMNS},prerequisiti,descrizione`,
  homebrew_suppliche: `${HOME_BREW_COMMON_COLUMNS},prerequisiti,descrizione`,
  homebrew_talenti: `${HOME_BREW_COMMON_COLUMNS},prerequisiti,effetti`,
};
const HOME_BREW_COLUMNS: Record<HomebrewTable, string> = {
  ...HOME_BREW_STABLE_COLUMNS,
  homebrew_classi: `${HOME_BREW_STABLE_COLUMNS.homebrew_classi},parent_class_slug,parent_class_name,sottoclasse_features,granted_spells`,
  homebrew_nemici: `${HOME_BREW_STABLE_COLUMNS.homebrew_nemici},tiri_salvezza,competenze_abilita,azioni_leggendarie,resistenze_leggendarie,slot_incantesimo,caratteristica_incantatore,azioni_legg_max,mod_iniziativa,maestrie_abilita,dadi_vita_num,dado_vita`,
  homebrew_oggetti: `${HOME_BREW_STABLE_COLUMNS.homebrew_oggetti},descrizione,incantamento,sotto_tipo,richiede_sintonia,sintonia_dettaglio`,
  homebrew_razze: `${HOME_BREW_STABLE_COLUMNS.homebrew_razze},linguaggi,abilita_speciali`,
};

export async function fetchHomebrewByUser(table: HomebrewTable, userId: Id): Promise<HomebrewItem[]> {
  const client = getSupabaseClient();
  const result = await client
    .from(table)
    .select(HOME_BREW_COLUMNS[table])
    .eq('user_id', userId)
    .order('nome');
  const fallback = isMissingDatabaseColumn(result.error)
    ? await client.from(table).select(HOME_BREW_STABLE_COLUMNS[table]).eq('user_id', userId).order('nome')
    : result;
  throwIfSupabaseError(fallback.error);
  return parseArray(homebrewItemSchema, fallback.data);
}

export async function deleteHomebrewItem(table: HomebrewTable, id: Id): Promise<void> {
  const { error } = await getSupabaseClient().from(table).delete().eq('id', id);
  throwIfSupabaseError(error);
}

