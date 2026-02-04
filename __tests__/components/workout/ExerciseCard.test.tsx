/**
 * Tests for ExerciseCard Component
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ExerciseCard } from '@/components/workout/ExerciseCard';

const mockExercise = {
  exercise_id: 'ex-1',
  exercise_name: 'Push-up',
  reps: 10,
  completed: false,
};

const mockTimedExercise = {
  exercise_id: 'ex-2',
  exercise_name: 'Plank',
  duration_seconds: 30,
  completed: false,
};

describe('ExerciseCard', () => {
  it('should render exercise name', () => {
    render(<ExerciseCard exercise={mockExercise} />);
    expect(screen.getByText('Push-up')).toBeTruthy();
  });

  it('should display rep count for rep-based exercises', () => {
    render(<ExerciseCard exercise={mockExercise} />);
    expect(screen.getByText('10 reps')).toBeTruthy();
  });

  it('should display duration for timed exercises', () => {
    render(<ExerciseCard exercise={mockTimedExercise} />);
    expect(screen.getByText('30 seconds')).toBeTruthy();
  });

  it('should show completed state', () => {
    const completedExercise = { ...mockExercise, completed: true };
    const { getByTestId } = render(<ExerciseCard exercise={completedExercise} />);
    expect(getByTestId('completed-indicator')).toBeTruthy();
  });

  it('should render in large size when specified', () => {
    const { getByTestId } = render(<ExerciseCard exercise={mockExercise} size="large" />);
    const card = getByTestId('exercise-card');
    expect(card.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ minHeight: 120 })])
    );
  });

  it('should render in small size when specified', () => {
    const { getByTestId } = render(<ExerciseCard exercise={mockExercise} size="small" />);
    const card = getByTestId('exercise-card');
    expect(card.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ minHeight: 60 })])
    );
  });

  it('should show label when provided', () => {
    render(<ExerciseCard exercise={mockExercise} label="Your exercise" />);
    expect(screen.getByText('Your exercise')).toBeTruthy();
  });
});
