// apps/native/stores/trial-store.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_DURATION_DAYS = 7;

interface TrialState {
  trialStartDate: string | null;
  isTrialActive: boolean;
  isPremium: boolean;

  startTrial: () => void;
  checkTrialStatus: () => boolean;
  setPremium: (value: boolean) => void;
  getRemainingDays: () => number;
}

export const useTrialStore = create<TrialState>()(
  persist(
    (set, get) => ({
      trialStartDate: null,
      isTrialActive: false,
      isPremium: false,

      startTrial: () => {
        const now = new Date().toISOString();
        set({ trialStartDate: now, isTrialActive: true });
      },

      checkTrialStatus: () => {
        const { trialStartDate, isPremium } = get();

        if (isPremium) return true;
        if (!trialStartDate) return false;

        const start = new Date(trialStartDate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        const isActive = diffDays < TRIAL_DURATION_DAYS;
        set({ isTrialActive: isActive });
        return isActive;
      },

      setPremium: (value: boolean) => {
        set({ isPremium: value });
      },

      getRemainingDays: () => {
        const { trialStartDate, isPremium } = get();

        if (isPremium) return Infinity;
        if (!trialStartDate) return 0;

        const start = new Date(trialStartDate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        return Math.max(0, TRIAL_DURATION_DAYS - diffDays);
      },
    }),
    {
      name: 'driwet-trial',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
