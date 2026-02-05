/**
 * Feedback Processor
 *
 * Processes explicit and implicit feedback to improve
 * workout recommendations and exercise pairings.
 */

import type {
  WorkoutLog,
  ExerciseLog,
  PostWorkoutFeedback,
  UserProgressProfile,
  CoupleProgressProfile,
  PairingAdjustments,
  ExerciseProgressionRecommendation,
  PairingStrategy,
} from './types';

import { analyzeExerciseProgression } from './progression-rules';
import { getExerciseById } from '@/data/exercises/exercise-catalog';

// ============================================
// FEEDBACK TYPES
// ============================================

export interface ProcessedFeedback {
  // User-level insights
  userInsights: {
    exerciseAdjustments: ExerciseProgressionRecommendation[];
    preferenceUpdates: {
      likedExercises: string[];
      dislikedExercises: string[];
      preferredIntensity: 'lower' | 'same' | 'higher';
    };
    fatigueWarnings: string[];
    formConcerns: string[];
  };

  // Couple-level insights
  coupleInsights: {
    pairingAdjustments: PairingAdjustments;
    connectionScore: number;
    strategyEffectiveness: {
      strategy: PairingStrategy;
      score: number;
    }[];
    gapObservations: string[];
  };

  // System recommendations
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    type: 'exercise' | 'intensity' | 'recovery' | 'pairing';
    message: string;
    action?: string;
  }[];
}

// ============================================
// IMPLICIT FEEDBACK SIGNALS
// ============================================

export interface ImplicitSignals {
  workoutCompletionRate: number;
  exerciseSkipRate: number;
  performanceVsPrescription: 'exceeded' | 'met' | 'underperformed';
  restTimeTrend: 'shorter' | 'normal' | 'longer';
  averageRIR: number;
  formTrend: 'improving' | 'stable' | 'declining';
}

// ============================================
// FEEDBACK PROCESSOR CLASS
// ============================================

export class FeedbackProcessor {
  /**
   * Process all feedback from a completed workout
   */
  processWorkoutFeedback(
    workout: WorkoutLog,
    userAProfile: UserProgressProfile,
    userBProfile: UserProgressProfile,
    coupleProfile: CoupleProgressProfile,
    strategyUsed: PairingStrategy
  ): ProcessedFeedback {
    // Extract implicit signals for both users
    const implicitA = this.extractImplicitSignals(
      workout.personALogs,
      userAProfile
    );
    const implicitB = this.extractImplicitSignals(
      workout.personBLogs,
      userBProfile
    );

    // Process user A's feedback
    const userAInsights = this.processUserFeedback(
      workout.personALogs,
      workout.personAFeedback,
      implicitA,
      userAProfile
    );

    // Process user B's feedback
    const userBInsights = this.processUserFeedback(
      workout.personBLogs,
      workout.personBFeedback,
      implicitB,
      userBProfile
    );

    // Process couple-level feedback
    const coupleInsights = this.processCoupleMetrics(
      workout,
      coupleProfile,
      strategyUsed,
      implicitA,
      implicitB
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      userAInsights,
      userBInsights,
      coupleInsights,
      workout
    );

    // Combine insights (merge user insights)
    return {
      userInsights: {
        exerciseAdjustments: [
          ...userAInsights.exerciseAdjustments,
          ...userBInsights.exerciseAdjustments,
        ],
        preferenceUpdates: {
          likedExercises: [
            ...userAInsights.preferenceUpdates.likedExercises,
            ...userBInsights.preferenceUpdates.likedExercises,
          ],
          dislikedExercises: [
            ...userAInsights.preferenceUpdates.dislikedExercises,
            ...userBInsights.preferenceUpdates.dislikedExercises,
          ],
          // Average intensity preference
          preferredIntensity: this.averageIntensityPref(
            userAInsights.preferenceUpdates.preferredIntensity,
            userBInsights.preferenceUpdates.preferredIntensity
          ),
        },
        fatigueWarnings: [
          ...userAInsights.fatigueWarnings,
          ...userBInsights.fatigueWarnings,
        ],
        formConcerns: [
          ...userAInsights.formConcerns,
          ...userBInsights.formConcerns,
        ],
      },
      coupleInsights,
      recommendations,
    };
  }

  /**
   * Extract implicit signals from exercise logs
   */
  private extractImplicitSignals(
    logs: ExerciseLog[],
    profile: UserProgressProfile
  ): ImplicitSignals {
    if (logs.length === 0) {
      return {
        workoutCompletionRate: 0,
        exerciseSkipRate: 0,
        performanceVsPrescription: 'met',
        restTimeTrend: 'normal',
        averageRIR: 2,
        formTrend: 'stable',
      };
    }

    // Completion rate
    const completed = logs.filter(l => l.completed).length;
    const workoutCompletionRate = completed / logs.length;

    // Skip rate (exercises where actual reps = 0 or very low)
    const skipped = logs.filter(
      l => l.actualReps === 0 || (l.prescribedReps && l.actualReps && l.actualReps < l.prescribedReps * 0.5)
    ).length;
    const exerciseSkipRate = skipped / logs.length;

    // Performance vs prescription
    let exceededCount = 0;
    let underperformedCount = 0;
    for (const log of logs) {
      if (log.prescribedReps && log.actualReps) {
        if (log.actualReps > log.prescribedReps) exceededCount++;
        if (log.actualReps < log.prescribedReps * 0.8) underperformedCount++;
      }
    }
    let performanceVsPrescription: 'exceeded' | 'met' | 'underperformed' = 'met';
    if (exceededCount > logs.length * 0.3) performanceVsPrescription = 'exceeded';
    if (underperformedCount > logs.length * 0.3) performanceVsPrescription = 'underperformed';

    // Average RIR
    const totalRIR = logs.reduce((sum, l) => sum + l.actualRIR, 0);
    const averageRIR = totalRIR / logs.length;

    // Form trend (compare to historical average)
    const formQualityMap = { poor: 1, okay: 2, good: 3, perfect: 4 };
    const avgForm = logs.reduce((sum, l) => sum + formQualityMap[l.formQuality], 0) / logs.length;

    // Get historical form average from mastery data
    const masteryValues = Object.values(profile.exerciseMastery);
    const historicalAvgForm =
      masteryValues.length > 0
        ? masteryValues.reduce((sum, m) => sum + m.averageFormQuality, 0) / masteryValues.length
        : 2.5;

    let formTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (avgForm > historicalAvgForm + 0.3) formTrend = 'improving';
    if (avgForm < historicalAvgForm - 0.3) formTrend = 'declining';

    return {
      workoutCompletionRate,
      exerciseSkipRate,
      performanceVsPrescription,
      restTimeTrend: 'normal', // Would need timing data to calculate
      averageRIR,
      formTrend,
    };
  }

  /**
   * Process individual user feedback
   */
  private processUserFeedback(
    logs: ExerciseLog[],
    feedback: PostWorkoutFeedback | null,
    implicit: ImplicitSignals,
    profile: UserProgressProfile
  ): {
    exerciseAdjustments: ExerciseProgressionRecommendation[];
    preferenceUpdates: {
      likedExercises: string[];
      dislikedExercises: string[];
      preferredIntensity: 'lower' | 'same' | 'higher';
    };
    fatigueWarnings: string[];
    formConcerns: string[];
  } {
    const exerciseAdjustments: ExerciseProgressionRecommendation[] = [];
    const likedExercises: string[] = [];
    const dislikedExercises: string[] = [];
    const fatigueWarnings: string[] = [];
    const formConcerns: string[] = [];

    // Analyze each exercise for progression
    for (const log of logs) {
      const exercise = getExerciseById(log.exerciseId);
      if (!exercise) continue;

      const mastery = profile.exerciseMastery[log.exerciseId];
      if (mastery) {
        const recommendation = analyzeExerciseProgression(
          mastery,
          [log], // Just this session's log
          exercise
        );
        if (recommendation.change !== 'maintain') {
          exerciseAdjustments.push(recommendation);
        }
      }

      // Check for exercises that felt too easy/hard
      if (log.feltTooEasy) {
        likedExercises.push(log.exerciseId);
      }
      if (log.feltTooHard || log.feltPain) {
        dislikedExercises.push(log.exerciseId);
      }

      // Form concerns
      if (log.formQuality === 'poor') {
        formConcerns.push(
          `Form breakdown on ${exercise.name} - consider regression or cues`
        );
      }

      // Pain warnings
      if (log.feltPain) {
        fatigueWarnings.push(
          `Pain reported during ${exercise.name} - requires attention`
        );
      }
    }

    // Add explicit favorites from feedback
    if (feedback?.favoriteExercise) {
      likedExercises.push(feedback.favoriteExercise);
    }
    if (feedback?.leastFavoriteExercise) {
      dislikedExercises.push(feedback.leastFavoriteExercise);
    }

    // Determine intensity preference
    let preferredIntensity: 'lower' | 'same' | 'higher' = 'same';
    if (feedback) {
      if (feedback.overallDifficulty <= 2) {
        preferredIntensity = 'higher';
      } else if (feedback.overallDifficulty >= 4) {
        preferredIntensity = 'lower';
      }
    } else {
      // Infer from implicit signals
      if (implicit.averageRIR >= 4 && implicit.workoutCompletionRate > 0.95) {
        preferredIntensity = 'higher';
      }
      if (implicit.averageRIR <= 1 || implicit.workoutCompletionRate < 0.7) {
        preferredIntensity = 'lower';
      }
    }

    // Fatigue warnings from implicit signals
    if (implicit.exerciseSkipRate > 0.2) {
      fatigueWarnings.push('High exercise skip rate - possible fatigue or exercise mismatch');
    }
    if (implicit.performanceVsPrescription === 'underperformed') {
      fatigueWarnings.push('Consistently underperforming prescription - may need intensity reduction');
    }

    return {
      exerciseAdjustments,
      preferenceUpdates: {
        likedExercises: [...new Set(likedExercises)],
        dislikedExercises: [...new Set(dislikedExercises)],
        preferredIntensity,
      },
      fatigueWarnings,
      formConcerns,
    };
  }

  /**
   * Process couple-level metrics
   */
  private processCoupleMetrics(
    workout: WorkoutLog,
    coupleProfile: CoupleProgressProfile,
    strategyUsed: PairingStrategy,
    implicitA: ImplicitSignals,
    implicitB: ImplicitSignals
  ): {
    pairingAdjustments: PairingAdjustments;
    connectionScore: number;
    strategyEffectiveness: { strategy: PairingStrategy; score: number }[];
    gapObservations: string[];
  } {
    // Calculate connection score from feedback
    const connectionA = workout.personAFeedback?.partnerConnectionRating || 3;
    const connectionB = workout.personBFeedback?.partnerConnectionRating || 3;
    const connectionScore = (connectionA + connectionB) / 2;

    // Strategy effectiveness
    const strategyScore = this.calculateStrategyEffectiveness(
      workout,
      strategyUsed,
      implicitA,
      implicitB
    );

    // Get historical strategy effectiveness from couple profile
    const strategyEffectiveness: { strategy: PairingStrategy; score: number }[] = [
      { strategy: strategyUsed, score: strategyScore },
    ];

    // Add historical data
    const historyByStrategy = new Map<PairingStrategy, number[]>();
    for (const entry of coupleProfile.pairingHistory) {
      const existing = historyByStrategy.get(entry.strategyUsed) || [];
      existing.push(entry.satisfactionScore);
      historyByStrategy.set(entry.strategyUsed, existing);
    }

    for (const [strategy, scores] of historyByStrategy) {
      if (strategy !== strategyUsed) {
        strategyEffectiveness.push({
          strategy,
          score: scores.reduce((a, b) => a + b, 0) / scores.length,
        });
      }
    }

    // Gap observations
    const gapObservations: string[] = [];
    const rirDiff = Math.abs(implicitA.averageRIR - implicitB.averageRIR);

    if (rirDiff > 2) {
      gapObservations.push(
        `Large effort disparity (RIR diff: ${rirDiff.toFixed(1)}) - consider adjusting pairing`
      );
    }

    if (implicitA.workoutCompletionRate < 0.8 && implicitB.workoutCompletionRate > 0.95) {
      gapObservations.push('Partner A struggling while B completing easily - gap may be widening');
    } else if (implicitB.workoutCompletionRate < 0.8 && implicitA.workoutCompletionRate > 0.95) {
      gapObservations.push('Partner B struggling while A completing easily - gap may be widening');
    }

    if (coupleProfile.gapTrend === 'widening') {
      gapObservations.push('Fitness gap has been widening - recommend more supportive pairing strategies');
    }

    // Generate pairing adjustments
    const pairingAdjustments = this.generatePairingAdjustments(
      strategyUsed,
      strategyScore,
      connectionScore,
      implicitA,
      implicitB,
      coupleProfile
    );

    return {
      pairingAdjustments,
      connectionScore,
      strategyEffectiveness: strategyEffectiveness.sort((a, b) => b.score - a.score),
      gapObservations,
    };
  }

  /**
   * Calculate how effective a pairing strategy was
   */
  private calculateStrategyEffectiveness(
    workout: WorkoutLog,
    strategy: PairingStrategy,
    implicitA: ImplicitSignals,
    implicitB: ImplicitSignals
  ): number {
    let score = 3; // Base score

    // Both completed most exercises
    const avgCompletion = (implicitA.workoutCompletionRate + implicitB.workoutCompletionRate) / 2;
    if (avgCompletion > 0.9) score += 0.5;
    if (avgCompletion < 0.7) score -= 0.5;

    // Similar effort levels (RIR within 1.5 of each other)
    const rirDiff = Math.abs(implicitA.averageRIR - implicitB.averageRIR);
    if (rirDiff < 1.5) score += 0.5;
    if (rirDiff > 3) score -= 0.5;

    // Enjoyment from feedback
    const enjoyA = workout.personAFeedback?.enjoymentRating || 3;
    const enjoyB = workout.personBFeedback?.enjoymentRating || 3;
    const avgEnjoy = (enjoyA + enjoyB) / 2;
    if (avgEnjoy >= 4) score += 0.5;
    if (avgEnjoy <= 2) score -= 0.5;

    // Connection rating matters more for partner strategies
    const partnerStrategies: PairingStrategy[] = [
      'cooperative_partner',
      'assisted_partner',
      'mirror_facing',
      'competitive_same',
      'competitive_adjusted',
    ];

    if (partnerStrategies.includes(strategy)) {
      const connA = workout.personAFeedback?.partnerConnectionRating || 3;
      const connB = workout.personBFeedback?.partnerConnectionRating || 3;
      const avgConn = (connA + connB) / 2;
      if (avgConn >= 4) score += 0.5;
      if (avgConn <= 2) score -= 0.5;
    }

    // Clamp to 1-5 range
    return Math.max(1, Math.min(5, score));
  }

  /**
   * Generate pairing adjustments based on feedback
   */
  private generatePairingAdjustments(
    currentStrategy: PairingStrategy,
    strategyScore: number,
    connectionScore: number,
    implicitA: ImplicitSignals,
    implicitB: ImplicitSignals,
    coupleProfile: CoupleProgressProfile
  ): PairingAdjustments {
    const adjustments: PairingAdjustments = {
      suggestedStrategies: [],
      avoidStrategies: [],
      intensityAdjustment: 0,
      exerciseSwaps: [],
      focusAreas: [],
    };

    // If current strategy scored poorly, suggest alternatives
    if (strategyScore < 3) {
      adjustments.avoidStrategies.push(currentStrategy);

      // Suggest alternatives based on what went wrong
      const rirDiff = Math.abs(implicitA.averageRIR - implicitB.averageRIR);

      if (rirDiff > 2) {
        // Large gap - suggest more accommodating strategies
        adjustments.suggestedStrategies.push('distant_progression');
        adjustments.suggestedStrategies.push('assisted_partner');
      }

      if (connectionScore < 3) {
        // Low connection - suggest less interactive strategies
        adjustments.suggestedStrategies.push('same_exercise_different_reps');
        adjustments.suggestedStrategies.push('adjacent_progression');
      }
    }

    // If strategy scored well, note it
    if (strategyScore >= 4) {
      adjustments.suggestedStrategies.push(currentStrategy);
    }

    // Intensity adjustment
    const avgCompletion = (implicitA.workoutCompletionRate + implicitB.workoutCompletionRate) / 2;
    const avgRIR = (implicitA.averageRIR + implicitB.averageRIR) / 2;

    if (avgCompletion < 0.8 || avgRIR < 1) {
      adjustments.intensityAdjustment = -0.1; // Reduce 10%
    } else if (avgCompletion > 0.95 && avgRIR > 3.5) {
      adjustments.intensityAdjustment = 0.1; // Increase 10%
    }

    // Focus areas based on observations
    if (coupleProfile.gapTrend === 'widening') {
      adjustments.focusAreas.push('gap_reduction');
    }
    if (connectionScore < 3) {
      adjustments.focusAreas.push('partner_connection');
    }
    if (implicitA.formTrend === 'declining' || implicitB.formTrend === 'declining') {
      adjustments.focusAreas.push('form_quality');
    }

    return adjustments;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    userAInsights: ReturnType<typeof this.processUserFeedback>,
    userBInsights: ReturnType<typeof this.processUserFeedback>,
    coupleInsights: ReturnType<typeof this.processCoupleMetrics>,
    workout: WorkoutLog
  ): ProcessedFeedback['recommendations'] {
    const recommendations: ProcessedFeedback['recommendations'] = [];

    // High priority: Pain reports
    const allFatigueWarnings = [
      ...userAInsights.fatigueWarnings,
      ...userBInsights.fatigueWarnings,
    ];

    for (const warning of allFatigueWarnings) {
      if (warning.includes('Pain')) {
        recommendations.push({
          priority: 'high',
          type: 'exercise',
          message: warning,
          action: 'Review exercise selection and consider substitution',
        });
      }
    }

    // Medium priority: Form concerns
    const formConcerns = [
      ...userAInsights.formConcerns,
      ...userBInsights.formConcerns,
    ];

    for (const concern of formConcerns) {
      recommendations.push({
        priority: 'medium',
        type: 'exercise',
        message: concern,
        action: 'Consider exercise regression or additional form cues',
      });
    }

    // Medium priority: Intensity adjustments
    if (coupleInsights.pairingAdjustments.intensityAdjustment !== 0) {
      const direction = coupleInsights.pairingAdjustments.intensityAdjustment > 0
        ? 'increase'
        : 'decrease';
      recommendations.push({
        priority: 'medium',
        type: 'intensity',
        message: `Consider ${direction}ing workout intensity based on performance`,
        action: `Adjust intensity by ${Math.abs(coupleInsights.pairingAdjustments.intensityAdjustment * 100)}%`,
      });
    }

    // Medium priority: Pairing strategy changes
    if (coupleInsights.pairingAdjustments.avoidStrategies.length > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'pairing',
        message: `Pairing strategy "${coupleInsights.pairingAdjustments.avoidStrategies[0]}" had low effectiveness`,
        action: `Try "${coupleInsights.pairingAdjustments.suggestedStrategies[0] || 'different'}" strategy next time`,
      });
    }

    // Low priority: Gap observations
    for (const obs of coupleInsights.gapObservations) {
      recommendations.push({
        priority: 'low',
        type: 'pairing',
        message: obs,
      });
    }

    // Low priority: Recovery recommendations
    if (allFatigueWarnings.some(w => w.includes('skip') || w.includes('underperforming'))) {
      recommendations.push({
        priority: 'low',
        type: 'recovery',
        message: 'Signs of accumulated fatigue detected',
        action: 'Consider a lighter workout or rest day',
      });
    }

    return recommendations;
  }

  /**
   * Average two intensity preferences
   */
  private averageIntensityPref(
    a: 'lower' | 'same' | 'higher',
    b: 'lower' | 'same' | 'higher'
  ): 'lower' | 'same' | 'higher' {
    const map = { lower: -1, same: 0, higher: 1 };
    const avg = (map[a] + map[b]) / 2;
    if (avg < -0.3) return 'lower';
    if (avg > 0.3) return 'higher';
    return 'same';
  }
}

// Default instance
export const feedbackProcessor = new FeedbackProcessor();
