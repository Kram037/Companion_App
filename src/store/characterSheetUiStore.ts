import { create } from 'zustand';

interface CharacterSheetUiState {
  openSections: Record<string, boolean>;
  activeTabByCharacter: Record<string, string>;
  setSectionOpen: (key: string, open: boolean) => void;
  setCharacterTab: (characterId: string, tab: string) => void;
}

export const useCharacterSheetUiStore = create<CharacterSheetUiState>((set) => ({
  openSections: {},
  activeTabByCharacter: {},
  setSectionOpen: (key, open) => set((state) => ({ openSections: { ...state.openSections, [key]: open } })),
  setCharacterTab: (characterId, tab) => set((state) => ({
    activeTabByCharacter: { ...state.activeTabByCharacter, [characterId]: tab },
  })),
}));
