/**
 * Validation Utility Functions
 *
 * Pure functions for validating user input.
 *
 * Principles:
 * - Pure functions (no side effects)
 * - Single responsibility
 * - Clear, descriptive names
 * - Consistent return types (boolean)
 */

/**
 * Validates email format using RFC 5322 simplified regex
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password meets minimum requirements
 * Requirements: At least 8 characters
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  return password.length >= 8;
}

/**
 * Validates display name
 * Requirements: 2-50 characters after trimming
 */
export function isValidDisplayName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
}

/**
 * Validates invite code format
 * Requirements: Exactly 8 uppercase alphanumeric characters
 */
export function isValidInviteCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  const inviteCodeRegex = /^[A-Z0-9]{8}$/;
  return inviteCodeRegex.test(code);
}
