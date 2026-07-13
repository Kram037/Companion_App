export interface CharacterClassLevel {
  nome?: string | null;
  name?: string | null;
  livello?: number | string | null;
}

export interface CharacterLevelSource {
  livello?: number | string | null;
  classi?: readonly CharacterClassLevel[] | null;
}

export function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number) {
  const normalized = Math.max(1, Math.min(20, Math.trunc(level) || 1));
  return Math.floor((normalized - 1) / 4) + 2;
}

export function totalCharacterLevel(character: CharacterLevelSource) {
  const classTotal = character.classi?.reduce((sum, entry) => sum + numericLevel(entry.livello), 0) ?? 0;
  return classTotal || numericLevel(character.livello) || 1;
}

export function jackOfAllTradesBonus(character: CharacterLevelSource) {
  const bardLevel = character.classi
    ?.filter(entry => ['bardo', 'bard'].includes(String(entry.nome ?? entry.name ?? '').toLowerCase()))
    .reduce((sum, entry) => sum + numericLevel(entry.livello), 0) ?? 0;

  return bardLevel >= 2 ? Math.floor(proficiencyBonus(totalCharacterLevel(character)) / 2) : 0;
}

export function cumulativeHpFromHitDice(rolls: readonly number[], constitutionModifier: number) {
  return rolls.map((_, index) => {
    const level = index + 1;
    const rollTotal = rolls.slice(0, level).reduce((sum, roll) => sum + roll, 0);
    return rollTotal + constitutionModifier * level;
  });
}

export function effectiveMaxHp(baseMaxHp: number, temporaryMaxBonus = 0) {
  return Math.max(1, Math.trunc(baseMaxHp) || 1) + Math.max(0, Math.trunc(temporaryMaxBonus) || 0);
}

export function clampCurrentHp(currentHp: number, maxHp: number) {
  return Math.max(0, Math.min(Math.trunc(currentHp) || 0, Math.max(1, Math.trunc(maxHp) || 1)));
}

function numericLevel(value: number | string | null | undefined) {
  return Math.max(0, Math.trunc(Number(value)) || 0);
}
