import { create } from 'zustand';

interface CombatUiState {
  selectedCombatantId: string | null;
  expandedMonsterIds: Record<string, boolean>;
  setSelectedCombatant: (id: string | null) => void;
  setMonsterExpanded: (id: string, expanded: boolean) => void;
}

export const useCombatUiStore = create<CombatUiState>((set) => ({
  selectedCombatantId: null,
  expandedMonsterIds: {},
  setSelectedCombatant: (id) => set({ selectedCombatantId: id }),
  setMonsterExpanded: (id, expanded) => set((state) => ({
    expandedMonsterIds: { ...state.expandedMonsterIds, [id]: expanded },
  })),
}));
