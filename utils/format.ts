/**
 * Format Utility Functions
 *
 * Pure functions for formatting values for display.
 *
 * Principles:
 * - Pure functions (no side effects)
 * - Consistent output format
 * - Handle edge cases gracefully
 */

/**
 * Formats seconds to MM:SS format
 * Used for workout timers
 */
export function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats minutes to human-readable duration
 * Used for workout duration display
 * @param minutes - Duration in minutes
 * @returns Human-readable duration string (e.g., "30 min", "1 hr 30 min")
 */
export function formatDuration(minutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(minutes));

  if (safeMinutes < 60) {
    return `${safeMinutes} min`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const remainingMins = safeMinutes % 60;

  const hourLabel = hours === 1 ? 'hr' : 'hrs';

  if (remainingMins === 0) {
    return `${hours} ${hourLabel}`;
  }

  return `${hours} ${hourLabel} ${remainingMins} min`;
}

/**
 * Formats numbers with thousands separators
 * Used for XP, rep counts, etc.
 * @param num - Number to format
 * @returns Formatted number string with thousands separators
 */
export function formatNumber(num: number): string {
  if (!Number.isFinite(num)) {
    return '0';
  }
  return num.toLocaleString('en-US');
}

/**
 * Generates a random invite code
 * 8 characters, uppercase alphanumeric, excluding ambiguous characters (I, O, 0, 1)
 */
export function generateInviteCode(): string {
  // Exclude I, O, 0, 1 to avoid confusion
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }

  return code;
}
