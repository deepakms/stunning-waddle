/**
 * Tests for BlockProgress Component
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { BlockProgress } from '@/components/workout/BlockProgress';

describe('BlockProgress', () => {
  it('should render current block number', () => {
    render(<BlockProgress currentBlock={3} totalBlocks={10} />);
    // Block numbers are displayed (3/10)
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
  });

  it('should show progress visually', () => {
    const { getByTestId } = render(<BlockProgress currentBlock={5} totalBlocks={10} />);
    const progressBar = getByTestId('progress-bar-fill');
    expect(progressBar.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '50%' })])
    );
  });

  it('should handle edge case of first block', () => {
    const { getByTestId } = render(<BlockProgress currentBlock={1} totalBlocks={10} />);
    const progressBar = getByTestId('progress-bar-fill');
    expect(progressBar.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '10%' })])
    );
  });

  it('should handle edge case of last block', () => {
    const { getByTestId } = render(<BlockProgress currentBlock={10} totalBlocks={10} />);
    const progressBar = getByTestId('progress-bar-fill');
    expect(progressBar.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '100%' })])
    );
  });

  it('should display block type when provided', () => {
    render(<BlockProgress currentBlock={1} totalBlocks={10} blockType="warmup" />);
    expect(screen.getByText(/warm up/i)).toBeTruthy();
  });
});
