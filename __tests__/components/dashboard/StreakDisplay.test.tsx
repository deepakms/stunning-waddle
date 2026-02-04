/**
 * Tests for StreakDisplay Component
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StreakDisplay } from '@/components/dashboard/StreakDisplay';

describe('StreakDisplay', () => {
  it('should render streak count', () => {
    render(<StreakDisplay currentStreak={7} longestStreak={10} />);
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('should render fire emoji for active streak', () => {
    render(<StreakDisplay currentStreak={7} longestStreak={10} isActive />);
    expect(screen.getByText('🔥')).toBeTruthy();
  });

  it('should show streak label', () => {
    render(<StreakDisplay currentStreak={7} longestStreak={10} />);
    expect(screen.getByText(/day streak/i)).toBeTruthy();
  });

  it('should display longest streak', () => {
    render(<StreakDisplay currentStreak={5} longestStreak={10} />);
    expect(screen.getByText(/best.*10/i)).toBeTruthy();
  });

  it('should show XP bonus message for 7+ day streak', () => {
    render(<StreakDisplay currentStreak={7} longestStreak={10} isActive />);
    expect(screen.getByText(/1\.5x/i)).toBeTruthy();
  });

  it('should show XP bonus message for 30+ day streak', () => {
    render(<StreakDisplay currentStreak={30} longestStreak={30} isActive />);
    expect(screen.getByText(/2x/i)).toBeTruthy();
  });

  it('should handle zero streak', () => {
    render(<StreakDisplay currentStreak={0} longestStreak={5} />);
    expect(screen.getByText('0')).toBeTruthy();
  });
});
