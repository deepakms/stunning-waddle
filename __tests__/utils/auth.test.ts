/**
 * Tests for Auth Utility Functions
 *
 * TDD Approach: Define expected auth utilities before implementation.
 */

import {
  getAuthErrorMessage,
  isAuthError,
  AuthErrorCode,
} from '@/utils/auth';

describe('Auth Utils', () => {
  describe('getAuthErrorMessage', () => {
    it('should return user-friendly message for invalid credentials', () => {
      const error = { message: 'Invalid login credentials' };
      expect(getAuthErrorMessage(error)).toBe('Invalid email or password. Please try again.');
    });

    it('should return user-friendly message for email already registered', () => {
      const error = { message: 'User already registered' };
      expect(getAuthErrorMessage(error)).toBe('An account with this email already exists.');
    });

    it('should return user-friendly message for weak password', () => {
      const error = { message: 'Password should be at least 6 characters' };
      expect(getAuthErrorMessage(error)).toBe('Password must be at least 8 characters long.');
    });

    it('should return user-friendly message for invalid email', () => {
      const error = { message: 'Unable to validate email address: invalid format' };
      expect(getAuthErrorMessage(error)).toBe('Please enter a valid email address.');
    });

    it('should return user-friendly message for network error', () => {
      const error = { message: 'Failed to fetch' };
      expect(getAuthErrorMessage(error)).toBe('Network error. Please check your connection.');
    });

    it('should return user-friendly message for rate limiting', () => {
      const error = { message: 'For security purposes, you can only request this once every 60 seconds' };
      expect(getAuthErrorMessage(error)).toBe('Too many attempts. Please wait a moment and try again.');
    });

    it('should return generic message for unknown errors', () => {
      const error = { message: 'Some unknown error' };
      expect(getAuthErrorMessage(error)).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle null or undefined error', () => {
      expect(getAuthErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
      expect(getAuthErrorMessage(undefined)).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('isAuthError', () => {
    it('should return true for auth error objects', () => {
      expect(isAuthError({ message: 'Error', status: 400 })).toBe(true);
      expect(isAuthError({ message: 'Error' })).toBe(true);
    });

    it('should return false for non-auth errors', () => {
      expect(isAuthError(null)).toBe(false);
      expect(isAuthError(undefined)).toBe(false);
      expect(isAuthError('string error')).toBe(false);
      expect(isAuthError({})).toBe(false);
    });
  });

  describe('AuthErrorCode', () => {
    it('should have expected error codes', () => {
      expect(AuthErrorCode.INVALID_CREDENTIALS).toBe('invalid_credentials');
      expect(AuthErrorCode.EMAIL_TAKEN).toBe('email_taken');
      expect(AuthErrorCode.WEAK_PASSWORD).toBe('weak_password');
      expect(AuthErrorCode.INVALID_EMAIL).toBe('invalid_email');
      expect(AuthErrorCode.NETWORK_ERROR).toBe('network_error');
      expect(AuthErrorCode.RATE_LIMITED).toBe('rate_limited');
      expect(AuthErrorCode.UNKNOWN).toBe('unknown');
    });
  });
});
