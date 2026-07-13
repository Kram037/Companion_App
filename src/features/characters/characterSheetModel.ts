import type { ClassePersonaggio, JsonRecord, JsonValue, Personaggio } from '../../types/domain';

export type CharacterData = Personaggio & Record<string, unknown> & {
  classi?: CharacterClass[] | null;
  bonus_manuali?: JsonRecord | null;
};

export type CharacterClass = ClassePersonaggio & {
  sottoclasseSlug?: string | null;
  sottoclasseNome?: string | null;
  sottoclasse_homebrew_id?: string | null;
};

export const ABILITIES = [
  { key: 'forza', short: 'FOR', label: 'Forza' },
  { key: 'destrezza', short: 'DES', label: 'Destrezza' },
  { key: 'costituzione', short: 'COS', label: 'Costituzione' },
  { key: 'intelligenza', short: 'INT', label: 'Intelligenza' },
  { key: 'saggezza', short: 'SAG', label: 'Saggezza' },
  { key: 'carisma', short: 'CAR', label: 'Carisma' },
] as const;

export const SKILLS = [
  ['acrobazia', 'Acrobazia', 'destrezza'], ['addestrare_animali', 'Addestrare Animali', 'saggezza'],
  ['arcano', 'Arcano', 'intelligenza'], ['atletica', 'Atletica', 'forza'], ['furtivita', 'Furtivita', 'destrezza'],
  ['indagare', 'Indagare', 'intelligenza'], ['inganno', 'Inganno', 'carisma'], ['intimidire', 'Intimidire', 'carisma'],
  ['intrattenere', 'Intrattenere', 'carisma'], ['intuizione', 'Intuizione', 'saggezza'], ['medicina', 'Medicina', 'saggezza'],
  ['natura', 'Natura', 'intelligenza'], ['percezione', 'Percezione', 'saggezza'], ['persuasione', 'Persuasione', 'carisma'],
  ['rapidita_di_mano', 'Rapidita di Mano', 'destrezza'], ['religione', 'Religione', 'intelligenza'],
  ['sopravvivenza', 'Sopravvivenza', 'saggezza'], ['storia', 'Storia', 'intelligenza'],
] as const;

export const CONDITIONS = [
  ['accecato', 'Accecato'], ['affascinato', 'Affascinato'], ['afferrato', 'Afferrato'], ['assordato', 'Assordato'],
  ['avvelenato', 'Avvelenato'], ['incapacitato', 'Incapacitato'], ['invisibile', 'Invisibile'], ['paralizzato', 'Paralizzato'],
  ['pietrificato', 'Pietrificato'], ['privo_di_sensi', 'Privo di sensi'], ['prono', 'Prono'], ['spaventato', 'Spaventato'],
  ['stordito', 'Stordito'], ['trattenuto', 'Trattenuto'],
] as const;

export const HIT_DICE: Record<string, number> = {
  Artefice: 8, Bardo: 8, Chierico: 8, Druido: 8, Ladro: 8, Monaco: 8, Warlock: 8,
  Barbaro: 12, Mago: 6, Stregone: 6, Guerriero: 10, Paladino: 10, Ranger: 10,
};

export const SPELL_ABILITIES: Record<string, string> = {
  Artefice: 'intelligenza', Bardo: 'carisma', Chierico: 'saggezza', Druido: 'saggezza',
  Mago: 'intelligenza', Paladino: 'carisma', Ranger: 'saggezza', Stregone: 'carisma', Warlock: 'carisma',
};

export function numberField(character: CharacterData, key: string, fallback = 0) {
  const value = Number(character[key]);
  return Number.isFinite(value) ? value : fallback;
}

export function stringList(character: CharacterData, key: string): string[] {
  const value = character[key];
  return Array.isArray(value) ? value.map(String) : [];
}

export function recordField(character: CharacterData, key: string): Record<string, any> {
  const value = character[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

export function objectList(character: CharacterData, key: string): Record<string, any>[] {
  const value = character[key];
  return Array.isArray(value) ? value.filter(item => item && typeof item === 'object') as Record<string, any>[] : [];
}

export function modifier(score: number) { return Math.floor((score - 10) / 2); }
export function signed(value: number) { return value >= 0 ? `+${value}` : String(value); }
export function proficiency(level: number) { return Math.floor((Math.max(1, level) - 1) / 4) + 2; }

export function classLine(character: CharacterData) {
  if (character.classi?.length) return character.classi.map(item => `${item.nome} ${item.livello || 1}`).join(' / ');
  return String(character.classe || '-');
}

export function subclassLine(character: CharacterData) {
  const values = (character.classi ?? []).map(item => cleanSubclass(item.sottoclasse)).filter(Boolean);
  return values.length ? values.join(' / ') : '-';
}

export function raceLine(character: CharacterData) {
  const race = String(character.razza || '').trim();
  const subrace = String(character.sottorazza || '').trim();
  if (!subrace) return race || '-';
  return race && !subrace.toLowerCase().includes(race.toLowerCase()) ? `${race} ${subrace}` : subrace;
}

export function cleanSubclass(value?: string | null) {
  return String(value || '').trim()
    .replace(/^(via|cammino|sentiero|giuramento|circolo|dominio|collegio|scuola|tradizione|archetipo)\s+(dell'|della|dello|degli|delle|del|dei|di|de)\s*/i, '')
    .replace(/^(way|path|oath|circle|domain|college|school|tradition|archetype)\s+of\s+(the\s+)?/i, '');
}

export function hpValues(character: CharacterData) {
  const base = numberField(character, 'punti_vita_max', 10);
  const bonus = Number((character.bonus_manuali as Record<string, JsonValue> | null)?._pv_max_temporaneo) || 0;
  const max = Math.max(1, base + bonus);
  return {
    base,
    bonus,
    max,
    current: Math.min(max, numberField(character, 'pv_attuali', base)),
    temporary: numberField(character, 'pv_temporanei'),
  };
}

export function inventoryName(item: Record<string, any>) {
  return String(item.nome || item.name || item._homebrew_nome || 'Oggetto');
}

export function inventoryMeta(item: Record<string, any>) {
  return [item.tipo || item._homebrew_tipo, item.sotto_tipo || item._homebrew_sotto_tipo, item.rarita || item._homebrew_rarita]
    .filter(Boolean).map(String).join(' · ');
}

export function spellName(item: unknown) {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    return String(record.name || record.nome || record.name_en || '');
  }
  return '';
}
