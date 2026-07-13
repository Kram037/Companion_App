import { create } from 'zustand';

interface WizardUiState {
  currentStepByWizard: Record<string, number>;
  setWizardStep: (wizardId: string, step: number) => void;
  resetWizard: (wizardId: string) => void;
}

export const useWizardUiStore = create<WizardUiState>((set) => ({
  currentStepByWizard: {},
  setWizardStep: (wizardId, step) => set((state) => ({
    currentStepByWizard: { ...state.currentStepByWizard, [wizardId]: step },
  })),
  resetWizard: (wizardId) => set((state) => {
    const next = { ...state.currentStepByWizard };
    delete next[wizardId];
    return { currentStepByWizard: next };
  }),
}));
