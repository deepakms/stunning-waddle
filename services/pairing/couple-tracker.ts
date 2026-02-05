/**
 * Couple Progress Tracker Service
 *
 * Tracks progress of couples working out together,
 * including fitness gap trends, shared milestones,
 * and pairing effectiveness.
 */

import type {
  CoupleProgressProfile,
  FitnessGapSnapshot,
  SharedMilestone,
  PairingHistoryEntry,
  UserProgressProfile,
  WorkoutLog,
  PairingStrategy,
} from './types';

import { calculateFitnessGap } from './pairing-engine';

// ============================================
// STORAGE INTERFACE
// ============================================

export interface CoupleProfileStorage {
  saveProfile(profile: CoupleProgressProfile): Promise<void>;
  getProfile(coupleId: string): Promise<CoupleProgressProfile | null>;
  deleteProfile(coupleId: string): Promise<void>;
}

// ============================================
// IN-MEMORY STORAGE (for development/testing)
// ============================================

const coupleStore = new Map<string, CoupleProgressProfile>();

export const inMemoryCoupleStorage: CoupleProfileStorage = {
  async saveProfile(profile: CoupleProgressProfile): Promise<void> {
    coupleStore.set(profile.coupleId, profile);
  },

  async getProfile(coupleId: string): Promise<CoupleProgressProfile | null> {
    return coupleStore.get(coupleId) || null;
  },

  async deleteProfile(coupleId: string): Promise<void> {
    coupleStore.delete(coupleId);
  },
};

// ============================================
// MILESTONE DEFINITIONS
// ============================================

export interface MilestoneDefinition {
  id: string;
  name: string;
  description: string;
  category: 'consistency' | 'achievement' | 'connection' | 'improvement';
  checkMilestone: (
    profile: CoupleProgressProfile,
    workout: WorkoutLog,
    userA: UserProgressProfile,
    userB: UserProgressProfile
  ) => boolean;
}

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  // Consistency milestones
  {
    id: 'first_workout',
    name: 'First Steps',
    description: 'Complete your first workout together',
    category: 'consistency',
    checkMilestone: (profile) => profile.totalWorkoutsTogether === 1,
  },
  {
    id: 'week_streak',
    name: 'Week Warriors',
    description: 'Work out together for 7 days in a row',
    category: 'consistency',
    checkMilestone: (profile) =>
      profile.pairingHistory.filter(h =>
        isWithinDays(h.date, 7)
      ).length >= 7,
  },
  {
    id: 'ten_workouts',
    name: 'Dynamic Duo',
    description: 'Complete 10 workouts together',
    category: 'consistency',
    checkMilestone: (profile) => profile.totalWorkoutsTogether === 10,
  },
  {
    id: 'twenty_five_workouts',
    name: 'Power Couple',
    description: 'Complete 25 workouts together',
    category: 'consistency',
    checkMilestone: (profile) => profile.totalWorkoutsTogether === 25,
  },
  {
    id: 'fifty_workouts',
    name: 'Fitness Partners',
    description: 'Complete 50 workouts together',
    category: 'consistency',
    checkMilestone: (profile) => profile.totalWorkoutsTogether === 50,
  },

  // Connection milestones
  {
    id: 'first_partner_exercise',
    name: 'In Sync',
    description: 'Complete your first partner exercise',
    category: 'connection',
    checkMilestone: (profile) => {
      const partnerStrategies: PairingStrategy[] = [
        'cooperative_partner',
        'assisted_partner',
        'mirror_facing',
      ];
      return profile.pairingHistory.some(h =>
        partnerStrategies.includes(h.strategyUsed)
      );
    },
  },
  {
    id: 'high_connection_rating',
    name: 'Better Together',
    description: 'Get a 5-star partner connection rating',
    category: 'connection',
    checkMilestone: (profile, workout) =>
      (workout.personAFeedback?.partnerConnectionRating === 5) ||
      (workout.personBFeedback?.partnerConnectionRating === 5),
  },
  {
    id: 'comfortable_with_contact',
    name: 'Trust Built',
    description: 'Reach mutual comfort level for partner exercises',
    category: 'connection',
    checkMilestone: (profile) =>
      profile.partnerExerciseComfort.mutualComfort >= 4,
  },

  // Improvement milestones
  {
    id: 'gap_closing',
    name: 'Growing Together',
    description: 'Reduce your fitness gap by 10%',
    category: 'improvement',
    checkMilestone: (profile) => {
      if (profile.fitnessGapHistory.length < 2) return false;
      const first = profile.fitnessGapHistory[0];
      const latest = profile.fitnessGapHistory[profile.fitnessGapHistory.length - 1];
      return Math.abs(latest.overallGap) < Math.abs(first.overallGap) * 0.9;
    },
  },
  {
    id: 'both_improved',
    name: 'Rising Tide',
    description: 'Both partners improve in the same week',
    category: 'improvement',
    checkMilestone: (_, __, userA, userB) =>
      userA.progressionRate.overall === 'improving' &&
      userB.progressionRate.overall === 'improving',
  },

  // Achievement milestones
  {
    id: 'tried_all_strategies',
    name: 'Adventurous',
    description: 'Try 5 different pairing strategies',
    category: 'achievement',
    checkMilestone: (profile) => {
      const uniqueStrategies = new Set(
        profile.pairingHistory.map(h => h.strategyUsed)
      );
      return uniqueStrategies.size >= 5;
    },
  },
  {
    id: 'competitive_victory',
    name: 'Friendly Competition',
    description: 'Complete a competitive workout',
    category: 'achievement',
    checkMilestone: (profile) =>
      profile.pairingHistory.some(h =>
        h.strategyUsed === 'competitive_same' ||
        h.strategyUsed === 'competitive_adjusted'
      ),
  },
];

// ============================================
// COUPLE TRACKER CLASS
// ============================================

export class CoupleTracker {
  private storage: CoupleProfileStorage;

  constructor(storage: CoupleProfileStorage = inMemoryCoupleStorage) {
    this.storage = storage;
  }

  /**
   * Create initial couple profile
   */
  createInitialProfile(params: {
    coupleId: string;
    personAId: string;
    personBId: string;
    initialContactComfort: number;
  }): CoupleProgressProfile {
    return {
      coupleId: params.coupleId,
      personAId: params.personAId,
      personBId: params.personBId,
      fitnessGapHistory: [],
      gapTrend: 'stable',
      sharedMilestones: [],
      pairingHistory: [],
      totalWorkoutsTogether: 0,
      partnerExerciseComfort: {
        personAComfort: params.initialContactComfort,
        personBComfort: params.initialContactComfort,
        mutualComfort: params.initialContactComfort,
        progressionHistory: [],
      },
      competitionPreference: {
        personACompetitiveness: 0.5,
        personBCompetitiveness: 0.5,
        mutualCompetitionScore: 0.5,
        competitiveWorkoutResults: [],
      },
      lastWorkoutTogether: null,
      createdAt: new Date(),
    };
  }

  /**
   * Update couple profile after a workout
   */
  async updateAfterWorkout(
    coupleProfile: CoupleProgressProfile,
    workout: WorkoutLog,
    userAProfile: UserProgressProfile,
    userBProfile: UserProgressProfile,
    strategyUsed: PairingStrategy
  ): Promise<CoupleProgressProfile> {
    let updated = { ...coupleProfile };

    // Update total workouts
    updated.totalWorkoutsTogether += 1;
    updated.lastWorkoutTogether = new Date();

    // Record fitness gap snapshot
    updated = this.recordFitnessGap(updated, userAProfile, userBProfile);

    // Update gap trend
    updated = this.updateGapTrend(updated);

    // Record pairing history
    updated = this.recordPairingHistory(updated, workout, strategyUsed);

    // Update partner exercise comfort based on feedback
    updated = this.updatePartnerComfort(updated, workout);

    // Update competition preference
    updated = this.updateCompetitionPreference(updated, workout, strategyUsed);

    // Check for new milestones
    updated = this.checkMilestones(updated, workout, userAProfile, userBProfile);

    await this.storage.saveProfile(updated);
    return updated;
  }

  /**
   * Get or create a couple profile
   */
  async getOrCreateProfile(
    coupleId: string,
    personAId: string,
    personBId: string,
    initialContactComfort = 2
  ): Promise<CoupleProgressProfile> {
    const existing = await this.storage.getProfile(coupleId);
    if (existing) return existing;

    const newProfile = this.createInitialProfile({
      coupleId,
      personAId,
      personBId,
      initialContactComfort,
    });

    await this.storage.saveProfile(newProfile);
    return newProfile;
  }

  /**
   * Save a couple profile
   */
  async saveProfile(profile: CoupleProgressProfile): Promise<void> {
    await this.storage.saveProfile(profile);
  }

  // ============================================
  // FITNESS GAP TRACKING
  // ============================================

  private recordFitnessGap(
    profile: CoupleProgressProfile,
    userA: UserProgressProfile,
    userB: UserProgressProfile
  ): CoupleProgressProfile {
    const overallGap = calculateFitnessGap(userA, userB);

    // Calculate per-area gaps
    const gapByArea: Record<string, number> = {};

    // Compare strength by muscle group
    for (const muscle of Object.keys(userA.estimatedAbilities.strength)) {
      const aVal = userA.estimatedAbilities.strength[muscle as keyof typeof userA.estimatedAbilities.strength] || 50;
      const bVal = userB.estimatedAbilities.strength[muscle as keyof typeof userB.estimatedAbilities.strength] || 50;
      gapByArea[`strength_${muscle}`] = aVal - bVal;
    }

    // Compare cardio
    gapByArea['cardio'] =
      userA.estimatedAbilities.cardioEndurance -
      userB.estimatedAbilities.cardioEndurance;

    const snapshot: FitnessGapSnapshot = {
      date: new Date(),
      overallGap,
      gapByArea,
    };

    return {
      ...profile,
      fitnessGapHistory: [
        ...profile.fitnessGapHistory.slice(-52), // Keep last year of weekly snapshots
        snapshot,
      ],
    };
  }

  private updateGapTrend(
    profile: CoupleProgressProfile
  ): CoupleProgressProfile {
    const history = profile.fitnessGapHistory;
    if (history.length < 3) {
      return { ...profile, gapTrend: 'stable' };
    }

    // Look at last 5 snapshots
    const recent = history.slice(-5);
    const gaps = recent.map(h => Math.abs(h.overallGap));

    // Calculate trend
    let increasing = 0;
    let decreasing = 0;

    for (let i = 1; i < gaps.length; i++) {
      if (gaps[i] > gaps[i - 1] + 2) increasing++;
      if (gaps[i] < gaps[i - 1] - 2) decreasing++;
    }

    let gapTrend: 'widening' | 'stable' | 'closing' = 'stable';
    if (increasing > decreasing + 1) gapTrend = 'widening';
    if (decreasing > increasing + 1) gapTrend = 'closing';

    return { ...profile, gapTrend };
  }

  // ============================================
  // PAIRING HISTORY
  // ============================================

  private recordPairingHistory(
    profile: CoupleProgressProfile,
    workout: WorkoutLog,
    strategyUsed: PairingStrategy
  ): CoupleProgressProfile {
    const avgSatisfaction =
      ((workout.personAFeedback?.enjoymentRating || 3) +
        (workout.personBFeedback?.enjoymentRating || 3)) /
      2;

    const entry: PairingHistoryEntry = {
      date: new Date(),
      workoutId: workout.id,
      strategyUsed,
      satisfactionScore: avgSatisfaction,
      bothCompleted:
        workout.personALogs.every(l => l.completed) &&
        workout.personBLogs.every(l => l.completed),
    };

    return {
      ...profile,
      pairingHistory: [
        ...profile.pairingHistory.slice(-100), // Keep last 100 entries
        entry,
      ],
    };
  }

  // ============================================
  // PARTNER COMFORT
  // ============================================

  private updatePartnerComfort(
    profile: CoupleProgressProfile,
    workout: WorkoutLog
  ): CoupleProgressProfile {
    const comfort = { ...profile.partnerExerciseComfort };

    // If connection ratings are high, increase comfort
    const aRating = workout.personAFeedback?.partnerConnectionRating || 3;
    const bRating = workout.personBFeedback?.partnerConnectionRating || 3;

    // Gradual adjustment based on ratings
    if (aRating >= 4) {
      comfort.personAComfort = Math.min(5, comfort.personAComfort + 0.1);
    } else if (aRating <= 2) {
      comfort.personAComfort = Math.max(1, comfort.personAComfort - 0.1);
    }

    if (bRating >= 4) {
      comfort.personBComfort = Math.min(5, comfort.personBComfort + 0.1);
    } else if (bRating <= 2) {
      comfort.personBComfort = Math.max(1, comfort.personBComfort - 0.1);
    }

    // Mutual comfort is the minimum of both
    comfort.mutualComfort = Math.min(
      comfort.personAComfort,
      comfort.personBComfort
    );

    // Round for cleaner numbers
    comfort.personAComfort = Math.round(comfort.personAComfort * 10) / 10;
    comfort.personBComfort = Math.round(comfort.personBComfort * 10) / 10;
    comfort.mutualComfort = Math.round(comfort.mutualComfort * 10) / 10;

    // Record in history
    comfort.progressionHistory = [
      ...comfort.progressionHistory.slice(-20),
      {
        date: new Date(),
        level: comfort.mutualComfort,
      },
    ];

    return { ...profile, partnerExerciseComfort: comfort };
  }

  // ============================================
  // COMPETITION PREFERENCE
  // ============================================

  private updateCompetitionPreference(
    profile: CoupleProgressProfile,
    workout: WorkoutLog,
    strategyUsed: PairingStrategy
  ): CoupleProgressProfile {
    const comp = { ...profile.competitionPreference };

    // Only update if competitive workout
    if (
      strategyUsed !== 'competitive_same' &&
      strategyUsed !== 'competitive_adjusted'
    ) {
      return profile;
    }

    // Record result
    const aEnjoyment = workout.personAFeedback?.enjoymentRating || 3;
    const bEnjoyment = workout.personBFeedback?.enjoymentRating || 3;

    comp.competitiveWorkoutResults = [
      ...comp.competitiveWorkoutResults.slice(-10),
      {
        date: new Date(),
        workoutId: workout.id,
        personAScore: aEnjoyment,
        personBScore: bEnjoyment,
      },
    ];

    // Adjust competitiveness based on enjoyment of competitive workouts
    if (aEnjoyment >= 4) {
      comp.personACompetitiveness = Math.min(1, comp.personACompetitiveness + 0.1);
    } else if (aEnjoyment <= 2) {
      comp.personACompetitiveness = Math.max(0, comp.personACompetitiveness - 0.1);
    }

    if (bEnjoyment >= 4) {
      comp.personBCompetitiveness = Math.min(1, comp.personBCompetitiveness + 0.1);
    } else if (bEnjoyment <= 2) {
      comp.personBCompetitiveness = Math.max(0, comp.personBCompetitiveness - 0.1);
    }

    // Mutual score is average
    comp.mutualCompetitionScore =
      (comp.personACompetitiveness + comp.personBCompetitiveness) / 2;

    // Round
    comp.personACompetitiveness = Math.round(comp.personACompetitiveness * 100) / 100;
    comp.personBCompetitiveness = Math.round(comp.personBCompetitiveness * 100) / 100;
    comp.mutualCompetitionScore = Math.round(comp.mutualCompetitionScore * 100) / 100;

    return { ...profile, competitionPreference: comp };
  }

  // ============================================
  // MILESTONE CHECKING
  // ============================================

  private checkMilestones(
    profile: CoupleProgressProfile,
    workout: WorkoutLog,
    userA: UserProgressProfile,
    userB: UserProgressProfile
  ): CoupleProgressProfile {
    const achievedIds = new Set(profile.sharedMilestones.map(m => m.milestoneId));
    const newMilestones: SharedMilestone[] = [];

    for (const def of MILESTONE_DEFINITIONS) {
      // Skip already achieved
      if (achievedIds.has(def.id)) continue;

      // Check if milestone is achieved
      if (def.checkMilestone(profile, workout, userA, userB)) {
        newMilestones.push({
          milestoneId: def.id,
          name: def.name,
          description: def.description,
          achievedDate: new Date(),
          category: def.category,
        });
      }
    }

    if (newMilestones.length === 0) {
      return profile;
    }

    return {
      ...profile,
      sharedMilestones: [...profile.sharedMilestones, ...newMilestones],
    };
  }

  // ============================================
  // ANALYSIS METHODS
  // ============================================

  /**
   * Get best performing pairing strategies
   */
  getBestStrategies(profile: CoupleProgressProfile): {
    strategy: PairingStrategy;
    avgSatisfaction: number;
    timesUsed: number;
  }[] {
    const strategyStats = new Map<
      PairingStrategy,
      { total: number; count: number }
    >();

    for (const entry of profile.pairingHistory) {
      const existing = strategyStats.get(entry.strategyUsed) || {
        total: 0,
        count: 0,
      };
      existing.total += entry.satisfactionScore;
      existing.count += 1;
      strategyStats.set(entry.strategyUsed, existing);
    }

    return Array.from(strategyStats.entries())
      .map(([strategy, stats]) => ({
        strategy,
        avgSatisfaction: Math.round((stats.total / stats.count) * 10) / 10,
        timesUsed: stats.count,
      }))
      .sort((a, b) => b.avgSatisfaction - a.avgSatisfaction);
  }

  /**
   * Get recent milestones
   */
  getRecentMilestones(
    profile: CoupleProgressProfile,
    limit = 5
  ): SharedMilestone[] {
    return [...profile.sharedMilestones]
      .sort((a, b) => b.achievedDate.getTime() - a.achievedDate.getTime())
      .slice(0, limit);
  }

  /**
   * Get progress summary
   */
  getProgressSummary(profile: CoupleProgressProfile): {
    totalWorkouts: number;
    currentStreak: number;
    gapTrend: string;
    milestonesAchieved: number;
    partnerComfortLevel: number;
    favoritePairingStrategy: PairingStrategy | null;
  } {
    // Calculate current streak
    let streak = 0;
    const now = new Date();
    const sortedWorkouts = [...profile.pairingHistory].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    for (const entry of sortedWorkouts) {
      const daysSince = Math.floor(
        (now.getTime() - entry.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince <= streak + 3) {
        streak++;
      } else {
        break;
      }
    }

    const bestStrategies = this.getBestStrategies(profile);

    return {
      totalWorkouts: profile.totalWorkoutsTogether,
      currentStreak: streak,
      gapTrend: profile.gapTrend,
      milestonesAchieved: profile.sharedMilestones.length,
      partnerComfortLevel: profile.partnerExerciseComfort.mutualComfort,
      favoritePairingStrategy:
        bestStrategies.length > 0 ? bestStrategies[0].strategy : null,
    };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function isWithinDays(date: Date, days: number): boolean {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

// Default instance
export const coupleTracker = new CoupleTracker();
