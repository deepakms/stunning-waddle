/**
 * Tests for format utility functions
 *
 * TDD Approach: Define expected formatting behavior before implementation.
 */

import {
  formatTime,
  formatDuration,
  formatNumber,
  generateInviteCode,
} from '@/utils/format';

describe('Format Utils', () => {
  describe('formatTime', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(125)).toBe('2:05');
      expect(formatTime(3600)).toBe('60:00');
    });

    it('should handle negative values as 0', () => {
      expect(formatTime(-10)).toBe('0:00');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes to human readable string', () => {
      expect(formatDuration(15)).toBe('15 min');
      expect(formatDuration(30)).toBe('30 min');
      expect(formatDuration(60)).toBe('1 hr');
      expect(formatDuration(90)).toBe('1 hr 30 min');
      expect(formatDuration(120)).toBe('2 hrs');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should handle decimals', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });
  });

  describe('generateInviteCode', () => {
    it('should generate 8 character code', () => {
      const code = generateInviteCode();
      expect(code).toHaveLength(8);
    });

    it('should only contain uppercase alphanumeric characters', () => {
      const code = generateInviteCode();
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it('should not contain ambiguous characters (I, O, 0, 1)', () => {
      // Generate multiple codes to increase confidence
      for (let i = 0; i < 100; i++) {
        const code = generateInviteCode();
        expect(code).not.toMatch(/[IO01]/);
      }
    });

    it('should generate unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateInviteCode());
      }
      // With 32^8 possible codes, collisions should be extremely rare
      expect(codes.size).toBe(100);
    });
  });
});
