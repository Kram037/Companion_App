import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NavigationState {
  page: string;
  tabByPage: Record<string, string>;
  sessionNavigation: {
    campagnaId: string | null;
    sessioneId: string | null;
  };
  setPage: (page: string) => void;
  setTab: (page: string, tab: string) => void;
  setSessionNavigation: (campagnaId: string | null, sessioneId?: string | null) => void;
  clearSessionNavigation: () => void;
}

export const useNavigationStore = create<NavigationState>()(persist(
  (set) => ({
    page: 'campagne',
    tabByPage: {},
    sessionNavigation: { campagnaId: null, sessioneId: null },
    setPage: (page) => set({ page }),
    setTab: (page, tab) => set((state) => ({ tabByPage: { ...state.tabByPage, [page]: tab } })),
    setSessionNavigation: (campagnaId, sessioneId = null) => set({
      sessionNavigation: { campagnaId, sessioneId },
    }),
    clearSessionNavigation: () => set({
      sessionNavigation: { campagnaId: null, sessioneId: null },
    }),
  }),
  { name: 'companion-navigation-ui' },
));
