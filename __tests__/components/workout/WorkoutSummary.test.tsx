/**
 * Tests for WorkoutSummary Component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WorkoutSummary } from '@/components/workout/WorkoutSummary';

const mockSummary = {
  workoutName: 'Upper Body Blast',
  duration: 1800, // 30 minutes in seconds
  blocksCompleted: 12,
  totalBlocks: 12,
  xpEarned: 300,
  streakDay: 5,
  muscleGroups: ['chest', 'shoulders', 'triceps'],
};

describe('WorkoutSummary', () => {
  const mockOnDone = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render workout name', () => {
    render(<WorkoutSummary {...mockSummary} onDone={mockOnDone} />);
    expect(screen.getByText('Upper Body Blast')).toBeTruthy();
  });

  it('should display formatted duration', () => {
    render(<WorkoutSummary {...mockSummary} onDone={mockOnDone} />);
    expect(screen.getByText('30:00')).toBeTruthy();
  });

  it('should show blocks completed', () => {
    render(<WorkoutSummary {...mockSummary} onDone={mockOnDone} />);
    expect(screen.getByText('12/12')).toBeTruthy();
  });

  it('should display XP earned', () => {
    render(<WorkoutSummary {...mockSummary} onDone={mockOnDone} />);
    expect(screen.getByText('+300 XP')).toBeTruthy();
  });

  it('should show streak day', () => {
    render(<WorkoutSummary {...mockSummary} onDone={mockOnDone} />);
    expect(screen.getByText(/5 day/i)).toBeTruthy();
  });

  it('should display muscle groups worked', () => {
    render(<WorkoutSummary {...mockSummary} onDone={mockOnDone} />);
    expect(screen.getByText(/chest/i)).toBeTruthy();
    expect(screen.getByText(/shoulders/i)).toBeTruthy();
  });

  it('should call onDone when button pressed', () => {
    render(<WorkoutSummary {...mockSummary} onDone={mockOnDone} />);
    fireEvent.press(screen.getByText('Done'));
    expect(mockOnDone).toHaveBeenCalled();
  });

  it('should show completion message', () => {
    render(<WorkoutSummary {...mockSummary} onDone={mockOnDone} />);
    expect(screen.getByText(/workout complete/i)).toBeTruthy();
  });
});
