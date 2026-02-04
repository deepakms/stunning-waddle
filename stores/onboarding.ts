/**
 * Onboarding Store
 *
 * Zustand store for managing onboarding questionnaire state.
 *
 * Principles:
 * - Persistent state for resume capability
 * - Step-by-step data collection
 * - Type-safe with explicit interfaces
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ActivityLevel,
  CardioCapacity,
  BiologicalSex,
  UnitPreference,
  PrimaryGoal,
} from '@/utils/onboarding';

// ============================================
// TYPES
// ============================================

export interface BasicsData {
  birthYear: number;
  heightCm: number;
  weightKg: number;
  biologicalSex: BiologicalSex;
  unitPreference: UnitPreference;
}

export interface FitnessData {
  activityLevel: ActivityLevel;
  canDoPushups: boolean;
  canHoldPlank: boolean;
  canDoFullSquat: boolean;
  cardioCapacity: CardioCapacity;
}

export interface GoalsData {
  primaryGoal: PrimaryGoal;
  secondaryGoal: PrimaryGoal | null;
}

export type WorkoutLength = 15 | 20 | 30 | 45;
export type MusicPreference = 'upbeat' | 'chill' | 'none' | 'any';
export type WorkoutLocation = 'home' | 'gym' | 'outdoor' | 'mix';
export type SpaceAvailability = 'minimal' | 'moderate' | 'spacious';

export interface PreferencesData {
  workoutLength: WorkoutLength;
  enjoyedActivities: string[];
  dislikedActivities: string[];
  musicPreference: MusicPreference;
}

export interface CouplePreferencesData {
  workedOutTogether: boolean;
  contactComfortLevel: 'no_contact' | 'light_contact' | 'full_contact';
  dynamicPreference: 'competitive' | 'collaborative' | 'mix';
  daysPerWeekTogether: number;
}

export interface OnboardingState {
  // Navigation
  currentStep: number;
  totalSteps: number;

  // Form data
  basics: BasicsData | null;
  fitness: FitnessData | null;
  injuries: string[];
  chronicConditions: string[];
  movementsToAvoid: string;
  goals: GoalsData | null;
  equipment: string[];
  location: WorkoutLocation | null;
  spaceAvailability: SpaceAvailability | null;
  preferences: PreferencesData | null;
  couplePreferences: CouplePreferencesData | null;

  // Actions
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;

  setBasics: (data: BasicsData) => void;
  setFitness: (data: FitnessData) => void;
  setInjuries: (injuries: string[]) => void;
  setChronicConditions: (conditions: string[]) => void;
  setMovementsToAvoid: (movements: string) => void;
  setGoals: (data: GoalsData) => void;
  setEquipment: (equipment: string[]) => void;
  setLocation: (location: WorkoutLocation) => void;
  setSpaceAvailability: (space: SpaceAvailability) => void;
  setPreferences: (data: PreferencesData) => void;
  setCouplePreferences: (data: CouplePreferencesData) => void;

  // Computed
  getProgress: () => number;
  isStepComplete: (step: number) => boolean;
  getAllData: () => Partial<OnboardingState>;

  // Reset
  reset: () => void;
}

// ============================================
// STEP CONFIGURATION
// ============================================

export const ONBOARDING_STEPS = [
  { id: 'basics', title: 'Basics', description: 'Tell us about yourself' },
  { id: 'fitness', title: 'Fitness Level', description: 'How fit are you?' },
  { id: 'injuries', title: 'Health', description: 'Any injuries or conditions?' },
  { id: 'goals', title: 'Goals', description: 'What do you want to achieve?' },
  { id: 'equipment', title: 'Equipment', description: 'What do you have?' },
  { id: 'preferences', title: 'Preferences', description: 'Your workout preferences' },
] as const;

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  currentStep: 0,
  totalSteps: ONBOARDING_STEPS.length,
  basics: null,
  fitness: null,
  injuries: [],
  chronicConditions: [],
  movementsToAvoid: '',
  goals: null,
  equipment: [],
  location: null,
  spaceAvailability: null,
  preferences: null,
  couplePreferences: null,
};

// ============================================
// STORE
// ============================================

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Navigation
      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),

      goToStep: (step: number) =>
        set((state) => ({
          currentStep: Math.max(0, Math.min(step, state.totalSteps - 1)),
        })),

      // Form data setters
      setBasics: (data: BasicsData) => set({ basics: data }),
      setFitness: (data: FitnessData) => set({ fitness: data }),
      setInjuries: (injuries: string[]) => set({ injuries }),
      setChronicConditions: (conditions: string[]) => set({ chronicConditions: conditions }),
      setMovementsToAvoid: (movements: string) => set({ movementsToAvoid: movements }),
      setGoals: (data: GoalsData) => set({ goals: data }),
      setEquipment: (equipment: string[]) => set({ equipment }),
      setLocation: (location: WorkoutLocation) => set({ location }),
      setSpaceAvailability: (space: SpaceAvailability) => set({ spaceAvailability: space }),
      setPreferences: (data: PreferencesData) => set({ preferences: data }),
      setCouplePreferences: (data: CouplePreferencesData) => set({ couplePreferences: data }),

      // Computed
      getProgress: () => {
        const state = get();
        let completed = 0;
        // Only count required fields for progress
        if (state.basics) completed++;
        if (state.fitness) completed++;
        if (state.goals) completed++;
        if (state.preferences) completed++;
        // Injuries and equipment steps are optional - count them as complete
        // only if the user has explicitly interacted (marked by having location set)
        // For simplicity, we count 4 required steps
        return completed / 4;
      },

      isStepComplete: (step: number) => {
        const state = get();
        switch (step) {
          case 0:
            return state.basics !== null;
          case 1:
            return state.fitness !== null;
          case 2:
            return true; // Injuries can be empty (None selected)
          case 3:
            return state.goals !== null;
          case 4:
            return true; // Equipment can be empty
          case 5:
            return state.preferences !== null;
          default:
            return false;
        }
      },

      getAllData: () => {
        const state = get();
        return {
          basics: state.basics,
          fitness: state.fitness,
          injuries: state.injuries,
          chronicConditions: state.chronicConditions,
          movementsToAvoid: state.movementsToAvoid,
          goals: state.goals,
          equipment: state.equipment,
          location: state.location,
          spaceAvailability: state.spaceAvailability,
          preferences: state.preferences,
          couplePreferences: state.couplePreferences,
        };
      },

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist form data, not UI state
      partialize: (state) => ({
        currentStep: state.currentStep,
        basics: state.basics,
        fitness: state.fitness,
        injuries: state.injuries,
        chronicConditions: state.chronicConditions,
        movementsToAvoid: state.movementsToAvoid,
        goals: state.goals,
        equipment: state.equipment,
        location: state.location,
        spaceAvailability: state.spaceAvailability,
        preferences: state.preferences,
        couplePreferences: state.couplePreferences,
      }),
    }
  )
);
