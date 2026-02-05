/**
 * Periodization System
 *
 * Manages long-term training phases and cycles,
 * implementing periodization principles for sustainable progress.
 */

import type {
  TrainingPhase,
  PhaseConfig,
  PeriodizationPlan,
  UserProgressProfile,
  CoupleProgressProfile,
} from './types';

// ============================================
// PHASE CONFIGURATIONS
// ============================================

export const PHASE_CONFIGS: Record<TrainingPhase, PhaseConfig> = {
  adaptation: {
    phase: 'adaptation',
    durationWeeks: 3,
    intensityRange: { min: 0.5, max: 0.7 },
    volumeMultiplier: 0.7,
    progressionSpeed: 'slow',
    focusAreas: ['form', 'consistency', 'movement_patterns'],
    description: 'Learn movements and build workout habits',
  },
  building: {
    phase: 'building',
    durationWeeks: 4,
    intensityRange: { min: 0.7, max: 0.85 },
    volumeMultiplier: 1.0,
    progressionSpeed: 'normal',
    focusAreas: ['progressive_overload', 'strength', 'endurance'],
    description: 'Progressive overload and building capacity',
  },
  peak: {
    phase: 'peak',
    durationWeeks: 2,
    intensityRange: { min: 0.85, max: 0.95 },
    volumeMultiplier: 1.1,
    progressionSpeed: 'fast',
    focusAreas: ['challenge', 'performance', 'new_variations'],
    description: 'Push limits and test progress',
  },
  deload: {
    phase: 'deload',
    durationWeeks: 1,
    intensityRange: { min: 0.4, max: 0.6 },
    volumeMultiplier: 0.5,
    progressionSpeed: 'none',
    focusAreas: ['recovery', 'mobility', 'technique'],
    description: 'Active recovery and regeneration',
  },
};

// Standard mesocycle order
const STANDARD_CYCLE: TrainingPhase[] = [
  'adaptation',
  'building',
  'building',
  'peak',
  'deload',
];

// ============================================
// AUTO-DELOAD TRIGGERS
// ============================================

export interface DeloadTrigger {
  id: string;
  name: string;
  description: string;
  check: (
    profile: UserProgressProfile,
    plan: PeriodizationPlan
  ) => { triggered: boolean; reason: string };
}

export const DELOAD_TRIGGERS: DeloadTrigger[] = [
  {
    id: 'time_since_deload',
    name: 'Time-Based Deload',
    description: 'Automatic deload after 6 weeks without one',
    check: (_, plan) => {
      const weeksSinceDeload = plan.weeksSinceLastDeload;
      return {
        triggered: weeksSinceDeload >= 6,
        reason: `${weeksSinceDeload} weeks since last deload`,
      };
    },
  },
  {
    id: 'plateau_detected',
    name: 'Plateau Recovery',
    description: 'Deload after 3 weeks of plateau',
    check: (profile, plan) => {
      const isPlateaued = profile.progressionRate.overall === 'plateau';
      const weeksPlateau = plan.weeksSincePlateauStart || 0;
      return {
        triggered: isPlateaued && weeksPlateau >= 3,
        reason: `Performance plateau for ${weeksPlateau} weeks`,
      };
    },
  },
  {
    id: 'overtraining_signals',
    name: 'Overtraining Prevention',
    description: 'Deload when overtraining signs detected',
    check: (profile) => {
      const isDeclining = profile.progressionRate.overall === 'declining';
      const isExhausted = profile.recoveryStatus.overallFatigue === 'exhausted';
      return {
        triggered: isDeclining || isExhausted,
        reason: isDeclining
          ? 'Performance declining'
          : 'Persistent fatigue detected',
      };
    },
  },
  {
    id: 'consistency_drop',
    name: 'Motivation Reset',
    description: 'Deload when workout frequency drops significantly',
    check: (profile) => {
      const avgFreq = profile.consistency.averageWorkoutsPerWeek;
      const recentFreq = profile.consistency.workoutsThisWeek;
      const significantDrop = avgFreq > 2 && recentFreq < avgFreq * 0.5;
      return {
        triggered: significantDrop,
        reason: 'Workout frequency dropped significantly',
      };
    },
  },
];

// ============================================
// PERIODIZATION MANAGER
// ============================================

export class PeriodizationManager {
  /**
   * Create initial periodization plan for a user or couple
   */
  createInitialPlan(params: {
    userId: string;
    coupleId?: string;
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    primaryGoal: string;
  }): PeriodizationPlan {
    // Beginners get longer adaptation phase
    const startPhase: TrainingPhase =
      params.fitnessLevel === 'beginner' ? 'adaptation' : 'building';

    const plan: PeriodizationPlan = {
      id: generateId(),
      userId: params.userId,
      coupleId: params.coupleId,
      startDate: new Date(),
      currentPhase: startPhase,
      currentPhaseStartDate: new Date(),
      currentPhaseWeek: 1,
      totalWeeksCompleted: 0,
      phaseHistory: [
        {
          phase: startPhase,
          startDate: new Date(),
          endDate: null,
          reason: 'Initial plan',
        },
      ],
      weeksSinceLastDeload: 0,
      weeksSincePlateauStart: null,
      nextPlannedDeload: this.calculateNextDeload(new Date(), startPhase),
      adjustments: [],
    };

    return plan;
  }

  /**
   * Update plan after a week of training
   */
  updatePlanWeekly(
    plan: PeriodizationPlan,
    profile: UserProgressProfile
  ): PeriodizationPlan {
    let updated = { ...plan };

    // Increment week counters
    updated.totalWeeksCompleted += 1;
    updated.currentPhaseWeek += 1;
    updated.weeksSinceLastDeload += 1;

    // Track plateau duration
    if (profile.progressionRate.overall === 'plateau') {
      updated.weeksSincePlateauStart =
        (updated.weeksSincePlateauStart || 0) + 1;
    } else {
      updated.weeksSincePlateauStart = null;
    }

    // Check for auto-deload triggers
    const deloadCheck = this.checkDeloadTriggers(profile, updated);
    if (deloadCheck.shouldDeload && updated.currentPhase !== 'deload') {
      updated = this.transitionToPhase(updated, 'deload', deloadCheck.reason);
      return updated;
    }

    // Check if current phase is complete
    const config = PHASE_CONFIGS[updated.currentPhase];
    if (updated.currentPhaseWeek > config.durationWeeks) {
      const nextPhase = this.determineNextPhase(updated, profile);
      updated = this.transitionToPhase(
        updated,
        nextPhase,
        'Phase duration completed'
      );
    }

    return updated;
  }

  /**
   * Force transition to a specific phase
   */
  forcePhaseTransition(
    plan: PeriodizationPlan,
    newPhase: TrainingPhase,
    reason: string
  ): PeriodizationPlan {
    return this.transitionToPhase(plan, newPhase, reason);
  }

  /**
   * Get current phase configuration
   */
  getCurrentPhaseConfig(plan: PeriodizationPlan): PhaseConfig {
    return PHASE_CONFIGS[plan.currentPhase];
  }

  /**
   * Get workout parameters for current phase
   */
  getPhaseWorkoutParams(plan: PeriodizationPlan): {
    targetIntensity: number;
    volumeMultiplier: number;
    shouldProgressExercises: boolean;
    focusAreas: string[];
  } {
    const config = PHASE_CONFIGS[plan.currentPhase];

    // Intensity increases through the phase
    const phaseProgress =
      plan.currentPhaseWeek / config.durationWeeks;
    const targetIntensity =
      config.intensityRange.min +
      (config.intensityRange.max - config.intensityRange.min) * phaseProgress;

    return {
      targetIntensity: Math.round(targetIntensity * 100) / 100,
      volumeMultiplier: config.volumeMultiplier,
      shouldProgressExercises: config.progressionSpeed !== 'none',
      focusAreas: config.focusAreas,
    };
  }

  /**
   * Get plan status summary
   */
  getPlanStatus(plan: PeriodizationPlan): {
    currentPhase: TrainingPhase;
    phaseDescription: string;
    weekInPhase: number;
    totalWeeksInPhase: number;
    daysUntilNextPhase: number;
    daysUntilDeload: number;
    intensity: string;
  } {
    const config = PHASE_CONFIGS[plan.currentPhase];
    const weeksRemaining = Math.max(
      0,
      config.durationWeeks - plan.currentPhaseWeek + 1
    );

    const deloadDate = plan.nextPlannedDeload;
    const daysUntilDeload = deloadDate
      ? Math.max(
          0,
          Math.floor(
            (deloadDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    // Get intensity description
    const avgIntensity =
      (config.intensityRange.min + config.intensityRange.max) / 2;
    let intensityDesc = 'Moderate';
    if (avgIntensity >= 0.85) intensityDesc = 'High';
    else if (avgIntensity >= 0.7) intensityDesc = 'Medium-High';
    else if (avgIntensity <= 0.5) intensityDesc = 'Low';

    return {
      currentPhase: plan.currentPhase,
      phaseDescription: config.description,
      weekInPhase: plan.currentPhaseWeek,
      totalWeeksInPhase: config.durationWeeks,
      daysUntilNextPhase: weeksRemaining * 7,
      daysUntilDeload,
      intensity: intensityDesc,
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private transitionToPhase(
    plan: PeriodizationPlan,
    newPhase: TrainingPhase,
    reason: string
  ): PeriodizationPlan {
    const now = new Date();

    // Close current phase in history
    const updatedHistory = [...plan.phaseHistory];
    if (updatedHistory.length > 0) {
      updatedHistory[updatedHistory.length - 1].endDate = now;
    }

    // Add new phase
    updatedHistory.push({
      phase: newPhase,
      startDate: now,
      endDate: null,
      reason,
    });

    // Reset deload counter if entering deload
    const weeksSinceLastDeload =
      newPhase === 'deload' ? 0 : plan.weeksSinceLastDeload;

    return {
      ...plan,
      currentPhase: newPhase,
      currentPhaseStartDate: now,
      currentPhaseWeek: 1,
      phaseHistory: updatedHistory.slice(-20), // Keep last 20 phases
      weeksSinceLastDeload,
      nextPlannedDeload: this.calculateNextDeload(now, newPhase),
      adjustments: [
        ...plan.adjustments.slice(-10),
        {
          date: now,
          type: 'phase_transition',
          description: `Transitioned to ${newPhase}: ${reason}`,
        },
      ],
    };
  }

  private checkDeloadTriggers(
    profile: UserProgressProfile,
    plan: PeriodizationPlan
  ): { shouldDeload: boolean; reason: string } {
    for (const trigger of DELOAD_TRIGGERS) {
      const result = trigger.check(profile, plan);
      if (result.triggered) {
        return { shouldDeload: true, reason: result.reason };
      }
    }
    return { shouldDeload: false, reason: '' };
  }

  private determineNextPhase(
    plan: PeriodizationPlan,
    profile: UserProgressProfile
  ): TrainingPhase {
    const current = plan.currentPhase;

    // Standard progression
    switch (current) {
      case 'adaptation':
        return 'building';

      case 'building':
        // After 2 building phases, move to peak
        const recentBuilding = plan.phaseHistory
          .slice(-3)
          .filter(h => h.phase === 'building').length;
        return recentBuilding >= 2 ? 'peak' : 'building';

      case 'peak':
        return 'deload';

      case 'deload':
        // After deload, check if user is improving or needs more adaptation
        if (profile.progressionRate.overall === 'declining') {
          return 'adaptation';
        }
        return 'building';

      default:
        return 'building';
    }
  }

  private calculateNextDeload(
    fromDate: Date,
    currentPhase: TrainingPhase
  ): Date {
    // Calculate weeks until deload based on standard cycle
    let weeksUntilDeload = 6; // Default max

    if (currentPhase === 'deload') {
      // Just started deload, next one in ~6 weeks
      weeksUntilDeload = 6;
    } else {
      // Calculate based on remaining phases in cycle
      const currentIndex = STANDARD_CYCLE.indexOf(currentPhase);
      if (currentIndex !== -1) {
        let weeks = 0;
        for (let i = currentIndex; i < STANDARD_CYCLE.length; i++) {
          if (STANDARD_CYCLE[i] === 'deload') break;
          weeks += PHASE_CONFIGS[STANDARD_CYCLE[i]].durationWeeks;
        }
        weeksUntilDeload = Math.min(weeks, 6);
      }
    }

    const deloadDate = new Date(fromDate);
    deloadDate.setDate(deloadDate.getDate() + weeksUntilDeload * 7);
    return deloadDate;
  }
}

// ============================================
// COUPLE PERIODIZATION
// ============================================

/**
 * Synchronize periodization plans for a couple
 */
export function synchronizeCouplePhases(
  planA: PeriodizationPlan,
  planB: PeriodizationPlan,
  coupleProfile: CoupleProgressProfile
): { planA: PeriodizationPlan; planB: PeriodizationPlan; synchronized: boolean } {
  // If both in same phase, no sync needed
  if (planA.currentPhase === planB.currentPhase) {
    return { planA, planB, synchronized: true };
  }

  // If one is in deload and other isn't, don't force sync
  // (let individual recovery happen)
  if (planA.currentPhase === 'deload' || planB.currentPhase === 'deload') {
    return { planA, planB, synchronized: false };
  }

  // Try to align phases for couples who work out together often
  const workoutsPerWeek = coupleProfile.totalWorkoutsTogether > 0
    ? coupleProfile.totalWorkoutsTogether /
      Math.max(1, weeksBetween(coupleProfile.createdAt, new Date()))
    : 0;

  // If working out together frequently, try to sync phases
  if (workoutsPerWeek >= 2) {
    // Find the "ahead" person and slow them to wait
    const phaseOrder: TrainingPhase[] = ['adaptation', 'building', 'peak', 'deload'];
    const indexA = phaseOrder.indexOf(planA.currentPhase);
    const indexB = phaseOrder.indexOf(planB.currentPhase);

    if (Math.abs(indexA - indexB) <= 1) {
      // Close enough, can sync
      // Extend the phase of whoever is ahead
      if (indexA > indexB) {
        // A is ahead, extend their current phase
        const configA = PHASE_CONFIGS[planA.currentPhase];
        if (planA.currentPhaseWeek < configA.durationWeeks) {
          // A can wait
          return { planA, planB, synchronized: true };
        }
      } else {
        // B is ahead
        const configB = PHASE_CONFIGS[planB.currentPhase];
        if (planB.currentPhaseWeek < configB.durationWeeks) {
          return { planA, planB, synchronized: true };
        }
      }
    }
  }

  // Can't or shouldn't sync
  return { planA, planB, synchronized: false };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function weeksBetween(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
}

// Default instance
export const periodizationManager = new PeriodizationManager();
