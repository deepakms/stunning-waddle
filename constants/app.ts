/**
 * App Constants
 *
 * Centralized configuration values used throughout the app.
 *
 * Principles:
 * - Single source of truth for magic numbers
 * - Grouped by feature/purpose
 * - Type-safe with as const
 */

// ============================================
// WORKOUT SETTINGS
// ============================================

export const WORKOUT_DURATIONS = [15, 20, 30, 45] as const;
export type WorkoutDuration = (typeof WORKOUT_DURATIONS)[number];

export const DEFAULT_WORKOUT_DURATION: WorkoutDuration = 30;

export const WORKOUT_STRUCTURE = {
  15: { warmupBlocks: 1, exerciseBlocks: 4, cooldownBlocks: 1 },
  20: { warmupBlocks: 1, exerciseBlocks: 6, cooldownBlocks: 1 },
  30: { warmupBlocks: 2, exerciseBlocks: 8, cooldownBlocks: 2 },
  45: { warmupBlocks: 2, exerciseBlocks: 12, cooldownBlocks: 2 },
} as const;

// ============================================
// XP SYSTEM
// ============================================

export const XP_PER_MINUTE = 10;
export const SOLO_XP_MULTIPLIER = 0.25;

export const STREAK_MULTIPLIERS = {
  7: 1.5,  // 7+ day streak
  30: 2.0, // 30+ day streak
} as const;

// ============================================
// APP URLS & SCHEME
// ============================================

export const APP_SCHEME = 'couplesworkout';
export const WEB_URL = 'https://couplesworkout.app';

// ============================================
// INVITE SYSTEM
// ============================================

export const INVITE_CODE_LENGTH = 8;
export const INVITE_EXPIRY_DAYS = 7;

// ============================================
// VALIDATION
// ============================================

export const MIN_PASSWORD_LENGTH = 8;
export const MIN_DISPLAY_NAME_LENGTH = 2;
export const MAX_DISPLAY_NAME_LENGTH = 50;

// ============================================
// SYNC SETTINGS
// ============================================

export const SYNC_TOLERANCE_MS = 1000; // 1 second sync tolerance
export const TIMER_BROADCAST_INTERVAL_MS = 1000; // Broadcast timer every second
export const RECONNECT_DELAY_MS = 2000;
export const MAX_RECONNECT_ATTEMPTS = 5;

// ============================================
// DIFFICULTY LEVELS
// ============================================

export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const DIFFICULTY_LABELS = {
  1: 'Beginner',
  2: 'Easy',
  3: 'Moderate',
  4: 'Hard',
  5: 'Advanced',
} as const;

// ============================================
// UI SETTINGS
// ============================================

export const COLORS = {
  primary: '#6366f1', // Indigo
  secondary: '#ec4899', // Pink
  success: '#22c55e', // Green
  warning: '#f59e0b', // Amber
  error: '#ef4444', // Red
  background: '#ffffff',
  surface: '#f3f4f6',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;
