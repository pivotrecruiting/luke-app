import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type OnboardingGoalDraftT = {
  name: string;
  icon: string;
  target: number;
  monthlyContribution: number | null;
};

export type OnboardingEntryT = {
  type: string;
  amount: number;
};

export type OnboardingBudgetEntryT = {
  name: string;
  limit: number;
};

type OnboardingDraftStateT = {
  motivations: string[];
  initialSavingsAmount: number | null;
  goalDraft: OnboardingGoalDraftT | null;
  incomeEntries: OnboardingEntryT[];
  expenseEntries: OnboardingEntryT[];
  budgetEntries: OnboardingBudgetEntryT[];
};

export type OnboardingStoreT = OnboardingDraftStateT & {
  isSubmitting: boolean;
  hasSubmitted: boolean;
  setMotivations: (value: string[]) => void;
  toggleMotivation: (id: string) => void;
  setInitialSavingsAmount: (amount: number | null) => void;
  setGoalDraft: (draft: OnboardingGoalDraftT | null) => void;
  setIncomeEntries: (entries: OnboardingEntryT[]) => void;
  setExpenseEntries: (entries: OnboardingEntryT[]) => void;
  setBudgetEntries: (entries: OnboardingBudgetEntryT[]) => void;
  resetMotivations: () => void;
  resetInitialSavings: () => void;
  resetGoalDraft: () => void;
  resetIncomeEntries: () => void;
  resetExpenseEntries: () => void;
  resetBudgetEntries: () => void;
  resetDrafts: () => void;
  setIsSubmitting: (value: boolean) => void;
  setHasSubmitted: (value: boolean) => void;
  resetAll: () => void;
};

const initialDraftState: OnboardingDraftStateT = {
  motivations: [],
  initialSavingsAmount: null,
  goalDraft: null,
  incomeEntries: [],
  expenseEntries: [],
  budgetEntries: [],
};

export const useOnboardingStore = create<OnboardingStoreT>()(
  persist(
    (set) => ({
      ...initialDraftState,
      isSubmitting: false,
      hasSubmitted: false,
      setMotivations: (value) => set({ motivations: value }),
      toggleMotivation: (id) =>
        set((state: OnboardingStoreT) => ({
          motivations: state.motivations.includes(id)
            ? state.motivations.filter((item) => item !== id)
            : [...state.motivations, id],
        })),
      setInitialSavingsAmount: (amount) => set({ initialSavingsAmount: amount }),
      setGoalDraft: (draft) => set({ goalDraft: draft }),
      setIncomeEntries: (entries) => set({ incomeEntries: entries }),
      setExpenseEntries: (entries) => set({ expenseEntries: entries }),
      setBudgetEntries: (entries) => set({ budgetEntries: entries }),
      resetMotivations: () => set({ motivations: [] }),
      resetInitialSavings: () => set({ initialSavingsAmount: null }),
      resetGoalDraft: () => set({ goalDraft: null }),
      resetIncomeEntries: () => set({ incomeEntries: [] }),
      resetExpenseEntries: () => set({ expenseEntries: [] }),
      resetBudgetEntries: () => set({ budgetEntries: [] }),
      resetDrafts: () => set({ ...initialDraftState }),
      setIsSubmitting: (value) => set({ isSubmitting: value }),
      setHasSubmitted: (value) => set({ hasSubmitted: value }),
      resetAll: () =>
        set({
          ...initialDraftState,
          isSubmitting: false,
          hasSubmitted: false,
        }),
    }),
    {
      name: "onboarding-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state: OnboardingStoreT) => ({
        motivations: state.motivations,
        initialSavingsAmount: state.initialSavingsAmount,
        goalDraft: state.goalDraft,
        incomeEntries: state.incomeEntries,
        expenseEntries: state.expenseEntries,
        budgetEntries: state.budgetEntries,
      }),
    },
  ),
);
