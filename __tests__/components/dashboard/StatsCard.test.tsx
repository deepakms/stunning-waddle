/**
 * Tests for StatsCard Component
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatsCard } from '@/components/dashboard/StatsCard';

describe('StatsCard', () => {
  it('should render title', () => {
    render(<StatsCard title="Total XP" value="1,500" />);
    expect(screen.getByText('Total XP')).toBeTruthy();
  });

  it('should render value', () => {
    render(<StatsCard title="Total XP" value="1,500" />);
    expect(screen.getByText('1,500')).toBeTruthy();
  });

  it('should render icon when provided', () => {
    render(<StatsCard title="Total XP" value="1,500" icon="⭐" />);
    expect(screen.getByText('⭐')).toBeTruthy();
  });

  it('should render subtitle when provided', () => {
    render(<StatsCard title="Total XP" value="1,500" subtitle="+300 this week" />);
    expect(screen.getByText('+300 this week')).toBeTruthy();
  });

  it('should apply accent color when provided', () => {
    const { getByTestId } = render(
      <StatsCard title="Streak" value="7" accentColor="#22c55e" testID="stats-card" />
    );
    expect(getByTestId('stats-card')).toBeTruthy();
  });
});
