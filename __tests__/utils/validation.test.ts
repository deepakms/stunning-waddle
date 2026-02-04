/**
 * Tests for validation utility functions
 *
 * TDD Approach: Define expected validation behavior before implementation.
 */

import {
  isValidEmail,
  isValidPassword,
  isValidDisplayName,
  isValidInviteCode,
} from '@/utils/validation';

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for passwords with 8+ characters', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('MyP@ssw0rd!')).toBe(true);
      expect(isValidPassword('12345678')).toBe(true);
    });

    it('should return false for passwords with less than 8 characters', () => {
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('1234567')).toBe(false);
    });
  });

  describe('isValidDisplayName', () => {
    it('should return true for valid display names (2-50 chars)', () => {
      expect(isValidDisplayName('Jo')).toBe(true);
      expect(isValidDisplayName('John Doe')).toBe(true);
      expect(isValidDisplayName('A'.repeat(50))).toBe(true);
    });

    it('should return false for invalid display names', () => {
      expect(isValidDisplayName('')).toBe(false);
      expect(isValidDisplayName('J')).toBe(false);
      expect(isValidDisplayName('A'.repeat(51))).toBe(false);
    });

    it('should trim whitespace before validation', () => {
      expect(isValidDisplayName('  Jo  ')).toBe(true);
      expect(isValidDisplayName('   ')).toBe(false);
    });
  });

  describe('isValidInviteCode', () => {
    it('should return true for valid invite codes (8 alphanumeric chars)', () => {
      expect(isValidInviteCode('ABC12345')).toBe(true);
      expect(isValidInviteCode('ABCD1234')).toBe(true);
      expect(isValidInviteCode('12345678')).toBe(true);
    });

    it('should return false for invalid invite codes', () => {
      expect(isValidInviteCode('')).toBe(false);
      expect(isValidInviteCode('ABC123')).toBe(false); // too short
      expect(isValidInviteCode('ABC123456')).toBe(false); // too long
      expect(isValidInviteCode('abc12345')).toBe(false); // lowercase
      expect(isValidInviteCode('ABC-1234')).toBe(false); // special char
    });
  });
});
