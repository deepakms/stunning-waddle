/**
 * Invite Code Utilities
 *
 * Functions for generating, validating, and managing invite codes.
 *
 * Principles:
 * - Codes are 8 characters, uppercase alphanumeric
 * - Exclude ambiguous characters: 0, O, 1, I, L
 * - Codes expire after 7 days
 */

import { APP_SCHEME, WEB_URL } from '@/constants/app';

/**
 * Characters allowed in invite codes
 * Excludes: 0 (zero), O (letter), 1 (one), I (letter), L (letter)
 */
const ALLOWED_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Regex pattern for valid invite codes
 */
const VALID_CODE_PATTERN = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/;

/**
 * Generates a random 8-character invite code
 * Uses cryptographically secure randomness
 */
export function generateInviteCode(): string {
  let code = '';
  const charsLength = ALLOWED_CHARS.length;

  // Use crypto.getRandomValues for secure randomness
  const randomValues = new Uint32Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    // Fallback for environments without crypto (tests, etc.)
    for (let i = 0; i < 8; i++) {
      randomValues[i] = Math.floor(Math.random() * 0xffffffff);
    }
  }

  for (let i = 0; i < 8; i++) {
    const randomIndex = randomValues[i] % charsLength;
    code += ALLOWED_CHARS[randomIndex];
  }

  return code;
}

/**
 * Validates an invite code format
 * @param code - The code to validate
 * @returns true if valid format, false otherwise
 */
export function isValidInviteCode(code: unknown): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  return VALID_CODE_PATTERN.test(code);
}

/**
 * Formats the time remaining until expiration
 * @param expiresAt - ISO date string of expiration
 * @returns Human-readable time remaining
 */
export function formatExpirationTime(expiresAt: string): string {
  const now = new Date();
  const expiration = new Date(expiresAt);
  const diffMs = expiration.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Expired';
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 1) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
  }

  if (diffHours >= 1) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  }

  return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
}

/**
 * Checks if an invite code has expired
 * @param expiresAt - ISO date string of expiration
 * @returns true if expired, false otherwise
 */
export function isInviteExpired(expiresAt: string): boolean {
  const now = new Date();
  const expiration = new Date(expiresAt);
  return expiration.getTime() <= now.getTime();
}

/**
 * Generates the shareable deep link URL for an invite code
 * @param code - The invite code
 * @returns Deep link URL
 * @throws Error if code is empty
 */
export function getInviteShareUrl(code: string): string {
  if (!code) {
    throw new Error('Invite code is required');
  }

  return `${APP_SCHEME}://invite/${code}`;
}

/**
 * Generates the web fallback URL for an invite code
 * @param code - The invite code
 * @returns Web URL
 */
export function getInviteWebUrl(code: string): string {
  if (!code) {
    throw new Error('Invite code is required');
  }

  return `${WEB_URL}/invite/${code}`;
}

/**
 * Parses an invite code from a URL (deep link or web)
 * @param url - The URL to parse
 * @returns The invite code or null if not found
 */
export function parseInviteCodeFromUrl(url: string): string | null {
  if (!url) {
    return null;
  }

  // Try deep link format: couplesworkout://invite/CODE
  // Only match allowed characters (exclude 0, O, 1, I, L)
  const deepLinkMatch = url.match(/couplesworkout:\/\/invite\/([23456789ABCDEFGHJKMNPQRSTUVWXYZ]+)/i);
  if (deepLinkMatch && deepLinkMatch[1]) {
    const code = deepLinkMatch[1].toUpperCase();
    return code.length === 8 ? code : null;
  }

  // Try web URL format: https://couplesworkout.app/invite/CODE
  const webMatch = url.match(/\/invite\/([23456789ABCDEFGHJKMNPQRSTUVWXYZ]+)/i);
  if (webMatch && webMatch[1]) {
    const code = webMatch[1].toUpperCase();
    return code.length === 8 ? code : null;
  }

  return null;
}

/**
 * Calculates the expiration date (7 days from now)
 * @returns ISO date string
 */
export function calculateInviteExpiration(): string {
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + 7);
  return expiration.toISOString();
}
