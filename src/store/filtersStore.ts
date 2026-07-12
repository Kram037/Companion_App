import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type FilterValue = string | string[] | number | boolean | null;

interface FiltersState {
  filtersByScope: Record<string, Record<string, FilterValue>>;
  setFilter: (scope: string, key: string, value: FilterValue) => void;
  resetFilters: (scope: string) => void;
}

export const useFiltersStore = create<FiltersState>()(persist(
  (set) => ({
    filtersByScope: {},
    setFilter: (scope, key, value) => set((state) => ({
      filtersByScope: {
        ...state.filtersByScope,
        [scope]: { ...(state.filtersByScope[scope] ?? {}), [key]: value },
      },
    })),
    resetFilters: (scope) => set((state) => {
      const next = { ...state.filtersByScope };
      delete next[scope];
      return { filtersByScope: next };
    }),
  }),
  { name: 'companion-filters-ui' },
));
