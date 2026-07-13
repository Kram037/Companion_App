import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  compactMode: boolean;
  setCompactMode: (enabled: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(persist(
  (set) => ({
    compactMode: false,
    setCompactMode: (compactMode) => set({ compactMode }),
  }),
  { name: 'companion-preferences-ui' },
));
