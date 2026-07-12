export type Id = string;
export type ISODateString = string;
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type JsonRecord = Record<string, JsonValue>;

export interface UserProfile {
  id: Id;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
}

export interface Campagna {
  id: Id;
  nome_campagna: string;
  id_dm: Id;
  descrizione?: string | null;
  icona_name?: string | null;
  created_at?: ISODateString | null;
  updated_at?: ISODateString | null;
}

export interface ClassePersonaggio {
  nome: string;
  livello: number;
  sottoclasse?: string | null;
}

export interface Personaggio {
  id: Id;
  nome: string;
  user_id?: Id | null;
  livello: number;
  esperienza?: number | null;
  classi?: ClassePersonaggio[] | null;
  razza?: string | null;
  background?: string | null;
  bonus_manuali?: JsonRecord | null;
  updated_at?: ISODateString | null;
}

export interface Sessione {
  id: Id;
  campagna_id: Id;
  stato?: string | null;
  round_corrente?: number | null;
  turno_corrente?: number | null;
  created_at?: ISODateString | null;
  updated_at?: ISODateString | null;
}

export interface RichiestaTiro {
  id: Id;
  campagna_id?: Id | null;
  sessione_id?: Id | null;
  personaggio_id?: Id | null;
  tipo: string;
  stato?: string | null;
  payload?: JsonRecord | null;
}

export interface MostroCombattimento {
  id: Id;
  sessione_id?: Id | null;
  nome: string;
  iniziativa?: number | null;
  pv_attuali?: number | null;
  pv_max?: number | null;
  dati?: JsonRecord | null;
}

export interface HomebrewItem {
  id: Id;
  user_id?: Id | null;
  tipo: string;
  nome: string;
  dati?: JsonRecord | null;
  created_at?: ISODateString | null;
  updated_at?: ISODateString | null;
}

export interface RuntimeDataBundle<T = JsonValue> {
  key: string;
  version?: string | number | null;
  source?: string | null;
  data: T;
}
