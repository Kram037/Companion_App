import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NavigationState {
  page: string;
  tabByPage: Record<string, string>;
  setPage: (page: string) => void;
  setTab: (page: string, tab: string) => void;
}

export const useNavigationStore = create<NavigationState>()(persist(
  (set) => ({
    page: 'campagne',
    tabByPage: {},
    setPage: (page) => set({ page }),
    setTab: (page, tab) => set((state) => ({ tabByPage: { ...state.tabByPage, [page]: tab } })),
  }),
  { name: 'companion-navigation-ui' },
));
