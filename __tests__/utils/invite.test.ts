/**
 * Tests for Invite Code Utilities
 *
 * TDD Approach: Define expected invite code behavior before implementation.
 */

import {
  generateInviteCode,
  isValidInviteCode,
  formatExpirationTime,
  isInviteExpired,
  getInviteShareUrl,
  parseInviteCodeFromUrl,
} from '@/utils/invite';

describe('Invite Code Utilities', () => {
  describe('generateInviteCode', () => {
    it('should generate an 8-character code', () => {
      const code = generateInviteCode();
      expect(code).toHaveLength(8);
    });

    it('should only contain uppercase alphanumeric characters', () => {
      const code = generateInviteCode();
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it('should not contain ambiguous characters (0, O, 1, I, L)', () => {
      // Generate multiple codes to increase confidence
      for (let i = 0; i < 100; i++) {
        const code = generateInviteCode();
        expect(code).not.toMatch(/[0O1IL]/);
      }
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateInviteCode());
      }
      // All 100 codes should be unique
      expect(codes.size).toBe(100);
    });
  });

  describe('isValidInviteCode', () => {
    it('should return true for valid 8-character code', () => {
      // Using only allowed chars: 23456789ABCDEFGHJKMNPQRSTUVWXYZ
      expect(isValidInviteCode('ABCD2345')).toBe(true);
      expect(isValidInviteCode('XYZ98765')).toBe(true);
      expect(isValidInviteCode('HJKMNPQR')).toBe(true);
    });

    it('should return false for codes with wrong length', () => {
      expect(isValidInviteCode('ABC')).toBe(false);
      expect(isValidInviteCode('ABCDEFGHIJ')).toBe(false);
      expect(isValidInviteCode('')).toBe(false);
    });

    it('should return false for codes with invalid characters', () => {
      expect(isValidInviteCode('abcd2345')).toBe(false); // lowercase
      expect(isValidInviteCode('ABCD-234')).toBe(false); // special char
      expect(isValidInviteCode('ABCD 234')).toBe(false); // space
    });

    it('should return false for codes with ambiguous characters', () => {
      expect(isValidInviteCode('ABCD0123')).toBe(false); // contains 0
      expect(isValidInviteCode('ABCDO123')).toBe(false); // contains O
      expect(isValidInviteCode('ABCD1I23')).toBe(false); // contains 1 and I
      expect(isValidInviteCode('ABCDL234')).toBe(false); // contains L
    });

    it('should handle null/undefined gracefully', () => {
      expect(isValidInviteCode(null as any)).toBe(false);
      expect(isValidInviteCode(undefined as any)).toBe(false);
    });
  });

  describe('formatExpirationTime', () => {
    it('should format days remaining', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      expect(formatExpirationTime(futureDate.toISOString())).toBe('5 days');
    });

    it('should format hours when less than 1 day', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 12);
      expect(formatExpirationTime(futureDate.toISOString())).toBe('12 hours');
    });

    it('should format minutes when less than 1 hour', () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 30);
      expect(formatExpirationTime(futureDate.toISOString())).toBe('30 minutes');
    });

    it('should return "Expired" for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(formatExpirationTime(pastDate.toISOString())).toBe('Expired');
    });

    it('should handle singular forms', () => {
      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
      oneDayFromNow.setHours(oneDayFromNow.getHours() + 1); // Add buffer to ensure it's > 24h
      expect(formatExpirationTime(oneDayFromNow.toISOString())).toMatch(/1 day|25 hours/);
    });
  });

  describe('isInviteExpired', () => {
    it('should return false for future expiration', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      expect(isInviteExpired(futureDate.toISOString())).toBe(false);
    });

    it('should return true for past expiration', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isInviteExpired(pastDate.toISOString())).toBe(true);
    });

    it('should return true for current time (edge case)', () => {
      const now = new Date().toISOString();
      expect(isInviteExpired(now)).toBe(true);
    });
  });

  describe('getInviteShareUrl', () => {
    it('should generate correct deep link URL', () => {
      const url = getInviteShareUrl('ABCD5678');
      expect(url).toBe('couplesworkout://invite/ABCD5678');
    });

    it('should handle empty code', () => {
      expect(() => getInviteShareUrl('')).toThrow();
    });
  });

  describe('parseInviteCodeFromUrl', () => {
    it('should extract code from deep link URL', () => {
      expect(parseInviteCodeFromUrl('couplesworkout://invite/ABCD5678')).toBe('ABCD5678');
    });

    it('should extract code from web URL', () => {
      expect(parseInviteCodeFromUrl('https://couplesworkout.app/invite/ABCD5678')).toBe('ABCD5678');
    });

    it('should return null for invalid URL', () => {
      expect(parseInviteCodeFromUrl('https://example.com')).toBeNull();
      expect(parseInviteCodeFromUrl('invalid')).toBeNull();
    });

    it('should return null for URL without code', () => {
      expect(parseInviteCodeFromUrl('couplesworkout://invite/')).toBeNull();
      expect(parseInviteCodeFromUrl('couplesworkout://invite')).toBeNull();
    });
  });
});
