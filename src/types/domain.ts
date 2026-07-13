export type Id = string;
export type ISODateString = string;
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type JsonRecord = Record<string, JsonValue>;

export interface UserProfile {
  id: Id;
  uid?: Id | null;
  nome_utente?: string | null;
  cid?: string | null;
  campagne_preferite?: Id[] | null;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  homebrew_settings?: HomebrewSettings | null;
}

export interface HomebrewSettings {
  enabled: boolean;
  amici_abilitati: Id[];
}

export interface Campagna {
  id: Id;
  nome_campagna: string;
  id_dm: Id;
  descrizione?: string | null;
  icona_name?: string | null;
  giocatori?: Id[] | null;
  data_creazione?: ISODateString | null;
  dm_nome?: string | null;
  isPreferito?: boolean;
  numero_sessioni?: number | null;
  tempo_di_gioco?: number | null;
  note?: string[] | null;
  created_at?: ISODateString | null;
  updated_at?: ISODateString | null;
}

export interface CampaignInvite {
  id: Id;
  campagna_id: Id;
  inviante_id?: Id | null;
  invitato_id?: Id | null;
  stato?: string | null;
  created_at?: ISODateString | null;
  updated_at?: ISODateString | null;
  campagna?: Pick<Campagna, 'id' | 'nome_campagna'> | null;
  inviante?: {
    id: Id;
    nome_utente?: string | null;
    cid?: string | null;
  } | null;
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
  classe?: string | null;
  tipo_scheda?: string | null;
  sottorazza?: string | null;
  campagne?: string[];
  bonus_manuali?: JsonRecord | null;
  updated_at?: ISODateString | null;
}

export interface Sessione {
  id: Id;
  campagna_id: Id;
  stato?: string | null;
  round_corrente?: number | null;
  turno_corrente?: number | null;
  data_inizio?: ISODateString | null;
  data_fine?: ISODateString | null;
  combat_round?: number | null;
  combat_turn_index?: number | null;
  created_at?: ISODateString | null;
  updated_at?: ISODateString | null;
}

export interface CampaignPlayer {
  id: Id;
  nome_utente?: string | null;
  cid?: string | null;
}

export interface CampaignCharacter {
  id: Id;
  nome: string;
  player_user_id?: Id | null;
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
  punti_vita_max?: number | null;
  created_at?: ISODateString | null;
  is_placeholder?: boolean | null;
  resistenze_leggendarie?: number | null;
  azioni_legg_max?: number | null;
  dati?: JsonRecord | null;
}

export interface InitiativeRoll {
  id?: Id | null;
  giocatore_id: Id;
  giocatore_nome?: string | null;
  valore?: number | null;
  stato?: string | null;
  created_at?: ISODateString | null;
  completed_at?: ISODateString | null;
}

export interface CombatCharacter extends CampaignCharacter {
  immagine_url?: string | null;
  punti_vita_max?: number | null;
  pv_attuali?: number | null;
  condizioni: string[];
}

export interface CombatSnapshot {
  sessione: Sessione | null;
  tiri: InitiativeRoll[];
  mostri: MostroCombattimento[];
  personaggi: CombatCharacter[];
}

export interface HomebrewItem {
  [key: string]: unknown;
  id: Id;
  user_id?: Id | null;
  tipo?: string | null;
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
