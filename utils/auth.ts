/**
 * Authentication Utility Functions
 *
 * Helpers for handling authentication errors and state.
 *
 * Principles:
 * - User-friendly error messages
 * - Type-safe error handling
 * - Consistent error codes
 */

/**
 * Standard auth error codes for consistent error handling
 */
export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  EMAIL_TAKEN: 'email_taken',
  WEAK_PASSWORD: 'weak_password',
  INVALID_EMAIL: 'invalid_email',
  NETWORK_ERROR: 'network_error',
  RATE_LIMITED: 'rate_limited',
  UNKNOWN: 'unknown',
} as const;

export type AuthErrorCodeType = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

/**
 * Auth error interface matching Supabase error structure
 */
export interface AuthError {
  message: string;
  status?: number;
}

/**
 * Type guard to check if an error is an auth error
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as AuthError).message === 'string'
  );
}

/**
 * Error message patterns to match against Supabase errors
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  code: AuthErrorCodeType;
  message: string;
}> = [
  {
    pattern: /invalid login credentials/i,
    code: AuthErrorCode.INVALID_CREDENTIALS,
    message: 'Invalid email or password. Please try again.',
  },
  {
    pattern: /user already registered/i,
    code: AuthErrorCode.EMAIL_TAKEN,
    message: 'An account with this email already exists.',
  },
  {
    pattern: /password should be at least/i,
    code: AuthErrorCode.WEAK_PASSWORD,
    message: 'Password must be at least 8 characters long.',
  },
  {
    pattern: /unable to validate email|invalid.*email/i,
    code: AuthErrorCode.INVALID_EMAIL,
    message: 'Please enter a valid email address.',
  },
  {
    pattern: /failed to fetch|network/i,
    code: AuthErrorCode.NETWORK_ERROR,
    message: 'Network error. Please check your connection.',
  },
  {
    pattern: /security purposes|rate limit|too many/i,
    code: AuthErrorCode.RATE_LIMITED,
    message: 'Too many attempts. Please wait a moment and try again.',
  },
];

/**
 * Converts Supabase auth errors to user-friendly messages
 * @param error - The error object from Supabase
 * @returns User-friendly error message
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!isAuthError(error)) {
    return 'An unexpected error occurred. Please try again.';
  }

  const errorMessage = error.message;

  for (const { pattern, message } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Gets the error code for an auth error
 * @param error - The error object
 * @returns Auth error code
 */
export function getAuthErrorCode(error: unknown): AuthErrorCodeType {
  if (!isAuthError(error)) {
    return AuthErrorCode.UNKNOWN;
  }

  const errorMessage = error.message;

  for (const { pattern, code } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return code;
    }
  }

  return AuthErrorCode.UNKNOWN;
}
