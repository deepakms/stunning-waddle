/**
 * Database Types
 *
 * TypeScript types matching the Supabase database schema.
 * These types ensure type safety when working with database operations.
 *
 * Principles:
 * - Mirror database schema exactly
 * - Use union types for enums
 * - Nullable fields marked optional
 */

// ============================================
// ENUMS
// ============================================

export type CoupleStatus = 'pending' | 'active' | 'paused' | 'uncoupled';

export type SessionStatus = 'scheduled' | 'ready' | 'in_progress' | 'paused' | 'completed' | 'abandoned';

export type BetStatus = 'pending' | 'accepted' | 'active' | 'completed' | 'cancelled';

export type BetMetric = 'total_reps' | 'total_sessions' | 'total_minutes' | 'streak_days' | 'xp_earned' | 'custom';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'full_body'
  | 'cardio';

export type ExerciseType = 'strength' | 'cardio' | 'flexibility' | 'balance';

export type MovementPattern = 'push' | 'pull' | 'squat' | 'hinge' | 'lunge' | 'rotation' | 'cardio' | 'isometric';

export type SpaceRequired = 'minimal' | 'small' | 'medium' | 'large';

export type ContactLevel = 'none' | 'light' | 'full';

export type DifficultyLabel = 'beginner' | 'easy' | 'moderate' | 'hard' | 'advanced';

export type PrimaryGoal =
  | 'lose_weight'
  | 'build_muscle'
  | 'get_toned'
  | 'flexibility'
  | 'general_fitness'
  | 'stress_relief';

export type CardioCapacity = 'under_5min' | '5_15min' | '15_30min' | 'over_30min';

export type BiologicalSex = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type DynamicPreference = 'competitive' | 'collaborative' | 'mix';

export type XPReason =
  | 'workout_completed'
  | 'streak_bonus'
  | 'bet_won'
  | 'challenge_completed'
  | 'referral'
  | 'milestone';

// ============================================
// TABLE TYPES
// ============================================

export interface Profile {
  id: string;
  user_id: string;
  couple_id: string | null;

  // Basic info
  display_name: string;
  avatar_url: string | null;

  // Fitness profile
  fitness_level: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  biological_sex: BiologicalSex | null;
  birth_year: number | null;

  // Fitness assessment
  can_do_pushups_10: boolean;
  can_hold_plank_30s: boolean;
  can_do_full_squat: boolean;
  cardio_capacity: CardioCapacity | null;

  // Injuries
  injuries: string[];

  // Preferences
  primary_goal: PrimaryGoal | null;
  preferred_workout_length: number;
  preferred_activities: string[];
  disliked_activities: string[];
  available_equipment: string[];

  // Couple preferences
  comfort_with_contact: ContactLevel | null;
  dynamic_preference: DynamicPreference | null;

  // Timestamps
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Couple {
  id: string;

  // Invite system
  invite_code: string;
  invite_expires_at: string | null;

  // Status
  status: CoupleStatus;

  // Shared preferences
  workouts_per_week: number;
  preferred_workout_days: string[];

  // Progression
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_workout_at: string | null;

  // Timestamps
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;

  // Basic info
  name: string;
  description: string | null;
  instructions: string[];

  // Classification
  muscle_group: MuscleGroup;
  exercise_type: ExerciseType | null;
  movement_pattern: MovementPattern | null;

  // Difficulty
  difficulty: number;
  difficulty_label: DifficultyLabel | null;

  // Equipment & space
  equipment_required: string[];
  space_required: SpaceRequired | null;

  // Timing
  default_duration_seconds: number | null;
  default_reps: number | null;
  is_timed: boolean;

  // Partner info
  is_partner_exercise: boolean;
  requires_contact: boolean;
  contact_level: ContactLevel | null;

  // Media
  video_url: string | null;
  thumbnail_url: string | null;

  // Metadata
  calories_per_minute: number | null;
  met_value: number | null;

  created_at: string;
}

export interface ExercisePair {
  id: string;
  exercise_a_id: string;
  exercise_b_id: string;
  muscle_group: MuscleGroup;
  duration_seconds: number;
  difficulty_gap: number | null;
  tags: string[];
  created_at: string;
}

export interface Session {
  id: string;
  couple_id: string;

  // Session info
  name: string | null;
  description: string | null;

  // Status
  status: SessionStatus;

  // Workout data (JSONB)
  workout_data: WorkoutData;

  // Progress
  current_block_index: number;

  // Partner assignments
  partner_a_id: string | null;
  partner_b_id: string | null;

  // Timing
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_active_seconds: number | null;

  // Scoring
  xp_earned: number;

  // Metadata
  is_solo: boolean;

  created_at: string;
  updated_at: string;
}

export interface SessionState {
  id: string;
  session_id: string;

  // Current position
  current_block_index: number;
  block_started_at: string | null;

  // Timer state
  timer_running: boolean;
  timer_seconds_remaining: number | null;

  // Pause state
  is_paused: boolean;
  paused_by: string | null;

  // Partner readiness
  partner_a_ready: boolean;
  partner_b_ready: boolean;

  // Sync
  last_updated_at: string;
  updated_by: string | null;
}

export interface Bet {
  id: string;
  couple_id: string;

  // Challenger
  challenger_id: string;

  // Stakes
  challenger_stake: string;
  challenged_stake: string;

  // Metric
  metric: BetMetric;
  custom_metric_description: string | null;

  // Time period
  starts_at: string;
  ends_at: string;

  // Status
  status: BetStatus;

  // Results
  challenger_score: number | null;
  challenged_score: number | null;
  winner_id: string | null;

  created_at: string;
  resolved_at: string | null;
}

export interface XPTransaction {
  id: string;
  couple_id: string;

  // Transaction details
  amount: number;
  reason: XPReason;

  // References
  session_id: string | null;
  bet_id: string | null;

  // Multiplier
  multiplier: number;
  base_amount: number | null;

  created_at: string;
}

// ============================================
// WORKOUT DATA STRUCTURES (JSONB)
// ============================================

export interface WorkoutData {
  blocks: WorkoutBlock[];
  total_duration_minutes: number;
  muscle_groups: MuscleGroup[];
  difficulty_a: number;
  difficulty_b: number;
}

export interface WorkoutBlock {
  id: string;
  type: 'warmup' | 'exercise' | 'rest' | 'cooldown';
  duration_seconds: number;
  slot_a: ExerciseSlot;
  slot_b: ExerciseSlot;
}

export interface ExerciseSlot {
  exercise_id: string;
  exercise_name: string;
  reps?: number;
  duration_seconds?: number;
  completed: boolean;
  completed_reps?: number;
}

// ============================================
// INSERT TYPES (for creating new records)
// ============================================

export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
export type CoupleInsert = Omit<Couple, 'id' | 'created_at' | 'updated_at'>;
export type SessionInsert = Omit<Session, 'id' | 'created_at' | 'updated_at'>;
export type BetInsert = Omit<Bet, 'id' | 'created_at'>;

// ============================================
// UPDATE TYPES (for updating records)
// ============================================

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'user_id' | 'created_at'>>;
export type CoupleUpdate = Partial<Omit<Couple, 'id' | 'created_at'>>;
export type SessionUpdate = Partial<Omit<Session, 'id' | 'couple_id' | 'created_at'>>;
export type SessionStateUpdate = Partial<Omit<SessionState, 'id' | 'session_id'>>;
