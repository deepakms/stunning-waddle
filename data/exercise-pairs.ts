/**
 * Exercise Pairs Seed Data
 *
 * Pairs of exercises designed for partners to do together.
 * Partners can have different difficulty levels within the same pair.
 */

import type { ExercisePair, MuscleGroup } from '@/types/database';

type ExercisePairSeed = Omit<ExercisePair, 'id' | 'created_at'>;

// Note: exercise_a_id and exercise_b_id will be populated during seeding
// based on exercise names. For now, we use placeholder references.

export const EXERCISE_PAIRS: Array<{
  exercise_a_name: string;
  exercise_b_name: string;
  muscle_group: MuscleGroup;
  duration_seconds: number;
  tags: string[];
}> = [
  // CHEST PAIRS
  {
    exercise_a_name: 'Standard Push-up',
    exercise_b_name: 'Standard Push-up',
    muscle_group: 'chest',
    duration_seconds: 45,
    tags: ['same_exercise', 'bodyweight'],
  },
  {
    exercise_a_name: 'Standard Push-up',
    exercise_b_name: 'Knee Push-up',
    muscle_group: 'chest',
    duration_seconds: 45,
    tags: ['difficulty_scaled', 'bodyweight'],
  },
  {
    exercise_a_name: 'Diamond Push-up',
    exercise_b_name: 'Standard Push-up',
    muscle_group: 'chest',
    duration_seconds: 45,
    tags: ['difficulty_scaled', 'bodyweight'],
  },
  {
    exercise_a_name: 'Wide Push-up',
    exercise_b_name: 'Wide Push-up',
    muscle_group: 'chest',
    duration_seconds: 45,
    tags: ['same_exercise', 'bodyweight'],
  },
  {
    exercise_a_name: 'Decline Push-up',
    exercise_b_name: 'Standard Push-up',
    muscle_group: 'chest',
    duration_seconds: 45,
    tags: ['difficulty_scaled', 'bodyweight'],
  },
  {
    exercise_a_name: 'Archer Push-up',
    exercise_b_name: 'Diamond Push-up',
    muscle_group: 'chest',
    duration_seconds: 45,
    tags: ['difficulty_scaled', 'advanced'],
  },

  // BACK PAIRS
  {
    exercise_a_name: 'Superman Hold',
    exercise_b_name: 'Superman Hold',
    muscle_group: 'back',
    duration_seconds: 30,
    tags: ['same_exercise', 'isometric'],
  },
  {
    exercise_a_name: 'Prone Y Raise',
    exercise_b_name: 'Prone Y Raise',
    muscle_group: 'back',
    duration_seconds: 45,
    tags: ['same_exercise', 'bodyweight'],
  },
  {
    exercise_a_name: 'Reverse Snow Angel',
    exercise_b_name: 'Superman Hold',
    muscle_group: 'back',
    duration_seconds: 45,
    tags: ['difficulty_scaled', 'bodyweight'],
  },
  {
    exercise_a_name: 'Bird Dog',
    exercise_b_name: 'Bird Dog',
    muscle_group: 'back',
    duration_seconds: 45,
    tags: ['same_exercise', 'stability'],
  },
  {
    exercise_a_name: 'Prone W Raise',
    exercise_b_name: 'Prone Y Raise',
    muscle_group: 'back',
    duration_seconds: 45,
    tags: ['complementary', 'bodyweight'],
  },

  // SHOULDER PAIRS
  {
    exercise_a_name: 'Pike Push-up',
    exercise_b_name: 'Shoulder Tap',
    muscle_group: 'shoulders',
    duration_seconds: 45,
    tags: ['difficulty_scaled', 'bodyweight'],
  },
  {
    exercise_a_name: 'Shoulder Tap',
    exercise_b_name: 'Shoulder Tap',
    muscle_group: 'shoulders',
    duration_seconds: 45,
    tags: ['same_exercise', 'stability'],
  },
  {
    exercise_a_name: 'Wall Walk',
    exercise_b_name: 'Pike Push-up',
    muscle_group: 'shoulders',
    duration_seconds: 60,
    tags: ['difficulty_scaled', 'advanced'],
  },
  {
    exercise_a_name: 'Arm Circles',
    exercise_b_name: 'Arm Circles',
    muscle_group: 'shoulders',
    duration_seconds: 30,
    tags: ['same_exercise', 'warmup'],
  },
  {
    exercise_a_name: 'Prone T Raise',
    exercise_b_name: 'Prone T Raise',
    muscle_group: 'shoulders',
    duration_seconds: 45,
    tags: ['same_exercise', 'bodyweight'],
  },

  // CORE PAIRS
  {
    exercise_a_name: 'Plank',
    exercise_b_name: 'Plank',
    muscle_group: 'core',
    duration_seconds: 30,
    tags: ['same_exercise', 'isometric'],
  },
  {
    exercise_a_name: 'Partner High-Five Plank',
    exercise_b_name: 'Partner High-Five Plank',
    muscle_group: 'core',
    duration_seconds: 30,
    tags: ['partner', 'interactive'],
  },
  {
    exercise_a_name: 'Mountain Climber',
    exercise_b_name: 'Mountain Climber',
    muscle_group: 'core',
    duration_seconds: 30,
    tags: ['same_exercise', 'cardio'],
  },
  {
    exercise_a_name: 'Dead Bug',
    exercise_b_name: 'Dead Bug',
    muscle_group: 'core',
    duration_seconds: 45,
    tags: ['same_exercise', 'stability'],
  },
  {
    exercise_a_name: 'Bicycle Crunch',
    exercise_b_name: 'Bicycle Crunch',
    muscle_group: 'core',
    duration_seconds: 45,
    tags: ['same_exercise', 'dynamic'],
  },
  {
    exercise_a_name: 'Side Plank',
    exercise_b_name: 'Plank',
    muscle_group: 'core',
    duration_seconds: 30,
    tags: ['difficulty_scaled', 'isometric'],
  },
  {
    exercise_a_name: 'V-Up',
    exercise_b_name: 'Bicycle Crunch',
    muscle_group: 'core',
    duration_seconds: 45,
    tags: ['difficulty_scaled', 'advanced'],
  },
  {
    exercise_a_name: 'Partner Leg Throw',
    exercise_b_name: 'Partner Leg Throw',
    muscle_group: 'core',
    duration_seconds: 45,
    tags: ['partner', 'interactive'],
  },

  // QUADRICEPS PAIRS
  {
    exercise_a_name: 'Bodyweight Squat',
    exercise_b_name: 'Bodyweight Squat',
    muscle_group: 'quadriceps',
    duration_seconds: 45,
    tags: ['same_exercise', 'fundamental'],
  },
  {
    exercise_a_name: 'Jump Squat',
    exercise_b_name: 'Bodyweight Squat',
    muscle_group: 'quadriceps',
    duration_seconds: 30,
    tags: ['difficulty_scaled', 'explosive'],
  },
  {
    exercise_a_name: 'Forward Lunge',
    exercise_b_name: 'Forward Lunge',
    muscle_group: 'quadriceps',
    duration_seconds: 45,
    tags: ['same_exercise', 'unilateral'],
  },
  {
    exercise_a_name: 'Wall Sit',
    exercise_b_name: 'Wall Sit',
    muscle_group: 'quadriceps',
    duration_seconds: 30,
    tags: ['same_exercise', 'isometric'],
  },
  {
    exercise_a_name: 'Partner Squat Hold',
    exercise_b_name: 'Partner Squat Hold',
    muscle_group: 'quadriceps',
    duration_seconds: 30,
    tags: ['partner', 'interactive'],
  },

  // GLUTES PAIRS
  {
    exercise_a_name: 'Glute Bridge',
    exercise_b_name: 'Glute Bridge',
    muscle_group: 'glutes',
    duration_seconds: 45,
    tags: ['same_exercise', 'fundamental'],
  },
  {
    exercise_a_name: 'Single Leg Glute Bridge',
    exercise_b_name: 'Glute Bridge',
    muscle_group: 'glutes',
    duration_seconds: 45,
    tags: ['difficulty_scaled', 'unilateral'],
  },

  // HAMSTRINGS PAIRS
  {
    exercise_a_name: 'Romanian Deadlift (Bodyweight)',
    exercise_b_name: 'Glute Bridge',
    muscle_group: 'hamstrings',
    duration_seconds: 45,
    tags: ['complementary', 'hip_hinge'],
  },

  // CALVES PAIRS
  {
    exercise_a_name: 'Calf Raise',
    exercise_b_name: 'Calf Raise',
    muscle_group: 'calves',
    duration_seconds: 45,
    tags: ['same_exercise', 'fundamental'],
  },

  // TRICEPS PAIRS
  {
    exercise_a_name: 'Tricep Dip (Chair)',
    exercise_b_name: 'Tricep Dip (Chair)',
    muscle_group: 'triceps',
    duration_seconds: 45,
    tags: ['same_exercise', 'bodyweight'],
  },
  {
    exercise_a_name: 'Close-Grip Push-up',
    exercise_b_name: 'Tricep Dip (Chair)',
    muscle_group: 'triceps',
    duration_seconds: 45,
    tags: ['complementary', 'bodyweight'],
  },

  // BICEPS PAIRS
  {
    exercise_a_name: 'Bodyweight Curl',
    exercise_b_name: 'Bodyweight Curl',
    muscle_group: 'biceps',
    duration_seconds: 45,
    tags: ['same_exercise', 'bodyweight'],
  },

  // FULL BODY PAIRS
  {
    exercise_a_name: 'Burpee',
    exercise_b_name: 'Burpee',
    muscle_group: 'full_body',
    duration_seconds: 45,
    tags: ['same_exercise', 'high_intensity'],
  },
  {
    exercise_a_name: 'Burpee',
    exercise_b_name: 'Jump Squat',
    muscle_group: 'full_body',
    duration_seconds: 45,
    tags: ['difficulty_scaled', 'explosive'],
  },
  {
    exercise_a_name: 'Bear Crawl',
    exercise_b_name: 'Mountain Climber',
    muscle_group: 'full_body',
    duration_seconds: 30,
    tags: ['complementary', 'coordination'],
  },
  {
    exercise_a_name: 'Skater Jump',
    exercise_b_name: 'Skater Jump',
    muscle_group: 'full_body',
    duration_seconds: 30,
    tags: ['same_exercise', 'lateral'],
  },

  // CARDIO PAIRS
  {
    exercise_a_name: 'Jumping Jack',
    exercise_b_name: 'Jumping Jack',
    muscle_group: 'cardio',
    duration_seconds: 30,
    tags: ['same_exercise', 'warmup'],
  },
  {
    exercise_a_name: 'High Knees',
    exercise_b_name: 'High Knees',
    muscle_group: 'cardio',
    duration_seconds: 30,
    tags: ['same_exercise', 'warmup'],
  },
  {
    exercise_a_name: 'High Knees',
    exercise_b_name: 'Jumping Jack',
    muscle_group: 'cardio',
    duration_seconds: 30,
    tags: ['complementary', 'warmup'],
  },

  // PARTNER SPECIFIC PAIRS
  {
    exercise_a_name: 'Wheelbarrow Push-up',
    exercise_b_name: 'Wheelbarrow Push-up',
    muscle_group: 'chest',
    duration_seconds: 45,
    tags: ['partner', 'interactive', 'advanced'],
  },
  {
    exercise_a_name: 'Partner Medicine Ball Pass',
    exercise_b_name: 'Partner Medicine Ball Pass',
    muscle_group: 'core',
    duration_seconds: 45,
    tags: ['partner', 'interactive', 'equipment'],
  },
];

export const EXERCISE_PAIR_COUNT = EXERCISE_PAIRS.length;
