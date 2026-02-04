/**
 * Tests for Onboarding Store
 *
 * TDD Approach: Define expected store behavior before implementation.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useOnboardingStore } from '@/stores/onboarding';

describe('Onboarding Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useOnboardingStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useOnboardingStore());

      expect(result.current.currentStep).toBe(0);
      expect(result.current.basics).toBeNull();
      expect(result.current.fitness).toBeNull();
      expect(result.current.injuries).toEqual([]);
      expect(result.current.goals).toBeNull();
      expect(result.current.equipment).toEqual([]);
      expect(result.current.preferences).toBeNull();
    });
  });

  describe('Step Navigation', () => {
    it('should navigate to next step', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should navigate to previous step', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.nextStep();
        result.current.nextStep();
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should not go below step 0', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(0);
    });

    it('should go to a specific step', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.goToStep(3);
      });

      expect(result.current.currentStep).toBe(3);
    });
  });

  describe('Basics Data', () => {
    it('should set basics data', () => {
      const { result } = renderHook(() => useOnboardingStore());

      const basicsData = {
        birthYear: 1990,
        heightCm: 175,
        weightKg: 70,
        biologicalSex: 'male' as const,
        unitPreference: 'metric' as const,
      };

      act(() => {
        result.current.setBasics(basicsData);
      });

      expect(result.current.basics).toEqual(basicsData);
    });

    it('should update partial basics data', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setBasics({
          birthYear: 1990,
          heightCm: 175,
          weightKg: 70,
          biologicalSex: 'male',
          unitPreference: 'metric',
        });
      });

      act(() => {
        result.current.setBasics({
          ...result.current.basics!,
          weightKg: 75,
        });
      });

      expect(result.current.basics?.weightKg).toBe(75);
      expect(result.current.basics?.heightCm).toBe(175);
    });
  });

  describe('Fitness Data', () => {
    it('should set fitness data', () => {
      const { result } = renderHook(() => useOnboardingStore());

      const fitnessData = {
        activityLevel: 'moderately_active' as const,
        canDoPushups: true,
        canHoldPlank: true,
        canDoFullSquat: true,
        cardioCapacity: 'moderate' as const,
      };

      act(() => {
        result.current.setFitness(fitnessData);
      });

      expect(result.current.fitness).toEqual(fitnessData);
    });
  });

  describe('Injuries Data', () => {
    it('should set injuries', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setInjuries(['knee', 'back_lower']);
      });

      expect(result.current.injuries).toEqual(['knee', 'back_lower']);
    });

    it('should clear injuries when set to empty', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setInjuries(['knee', 'back_lower']);
      });

      act(() => {
        result.current.setInjuries([]);
      });

      expect(result.current.injuries).toEqual([]);
    });
  });

  describe('Goals Data', () => {
    it('should set goals', () => {
      const { result } = renderHook(() => useOnboardingStore());

      const goalsData = {
        primaryGoal: 'lose_weight' as const,
        secondaryGoal: 'build_strength' as const,
      };

      act(() => {
        result.current.setGoals(goalsData);
      });

      expect(result.current.goals).toEqual(goalsData);
    });

    it('should allow null secondary goal', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setGoals({
          primaryGoal: 'lose_weight',
          secondaryGoal: null,
        });
      });

      expect(result.current.goals?.secondaryGoal).toBeNull();
    });
  });

  describe('Equipment Data', () => {
    it('should set equipment', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setEquipment(['dumbbells', 'yoga_mat', 'resistance_bands']);
      });

      expect(result.current.equipment).toEqual(['dumbbells', 'yoga_mat', 'resistance_bands']);
    });
  });

  describe('Preferences Data', () => {
    it('should set preferences', () => {
      const { result } = renderHook(() => useOnboardingStore());

      const preferencesData = {
        workoutLength: 30 as const,
        enjoyedActivities: ['strength', 'hiit'],
        dislikedActivities: ['running'],
        musicPreference: 'upbeat' as const,
      };

      act(() => {
        result.current.setPreferences(preferencesData);
      });

      expect(result.current.preferences).toEqual(preferencesData);
    });
  });

  describe('Location Data', () => {
    it('should set location', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setLocation('home');
      });

      expect(result.current.location).toBe('home');
    });
  });

  describe('Computed Values', () => {
    it('should calculate progress correctly', () => {
      const { result } = renderHook(() => useOnboardingStore());

      // Initial progress
      expect(result.current.getProgress()).toBe(0);

      // After completing basics
      act(() => {
        result.current.setBasics({
          birthYear: 1990,
          heightCm: 175,
          weightKg: 70,
          biologicalSex: 'male',
          unitPreference: 'metric',
        });
      });

      expect(result.current.getProgress()).toBeGreaterThan(0);
    });

    it('should determine if step is complete', () => {
      const { result } = renderHook(() => useOnboardingStore());

      expect(result.current.isStepComplete(0)).toBe(false);

      act(() => {
        result.current.setBasics({
          birthYear: 1990,
          heightCm: 175,
          weightKg: 70,
          biologicalSex: 'male',
          unitPreference: 'metric',
        });
      });

      expect(result.current.isStepComplete(0)).toBe(true);
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setBasics({
          birthYear: 1990,
          heightCm: 175,
          weightKg: 70,
          biologicalSex: 'male',
          unitPreference: 'metric',
        });
        result.current.nextStep();
        result.current.nextStep();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.currentStep).toBe(0);
      expect(result.current.basics).toBeNull();
    });
  });

  describe('Get All Data', () => {
    it('should return all onboarding data', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.setBasics({
          birthYear: 1990,
          heightCm: 175,
          weightKg: 70,
          biologicalSex: 'male',
          unitPreference: 'metric',
        });
        result.current.setFitness({
          activityLevel: 'moderately_active',
          canDoPushups: true,
          canHoldPlank: true,
          canDoFullSquat: true,
          cardioCapacity: 'moderate',
        });
        result.current.setGoals({
          primaryGoal: 'lose_weight',
          secondaryGoal: null,
        });
      });

      const data = result.current.getAllData();

      expect(data.basics).not.toBeNull();
      expect(data.fitness).not.toBeNull();
      expect(data.goals).not.toBeNull();
    });
  });
});
