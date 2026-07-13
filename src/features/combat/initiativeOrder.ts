export interface InitiativeEntry {
  id: string | number;
  init?: number | null;
  tiebreak?: number | string | null;
}

export function sortInitiativeOrder<T extends InitiativeEntry>(entries: readonly T[]) {
  return entries.slice().sort((a, b) => {
    const initiativeDiff = numericInitiative(b.init) - numericInitiative(a.init);
    if (initiativeDiff) return initiativeDiff;

    const tiebreakDiff = numericTiebreak(a.tiebreak) - numericTiebreak(b.tiebreak);
    if (tiebreakDiff) return tiebreakDiff;

    return String(a.id).localeCompare(String(b.id));
  });
}

function numericInitiative(value: number | null | undefined) {
  return Number(value) || 0;
}

function numericTiebreak(value: number | string | null | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}
