/**
 * Tests for SyncStatusIndicator Component
 *
 * TDD Approach: Define expected UI behavior before implementation.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SyncStatusIndicator } from '@/components/workout/SyncStatusIndicator';

describe('SyncStatusIndicator', () => {
  describe('connected state', () => {
    it('should render connected indicator when isConnected is true', () => {
      render(<SyncStatusIndicator isConnected={true} />);

      expect(screen.getByText('Partner connected')).toBeTruthy();
    });

    it('should show green indicator when connected', () => {
      const { getByTestId } = render(<SyncStatusIndicator isConnected={true} />);

      const dot = getByTestId('sync-status-dot');
      expect(dot.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#22c55e' }),
        ])
      );
    });
  });

  describe('disconnected state', () => {
    it('should render reconnecting text when isConnected is false', () => {
      render(<SyncStatusIndicator isConnected={false} />);

      expect(screen.getByText('Reconnecting...')).toBeTruthy();
    });

    it('should show red indicator when disconnected', () => {
      const { getByTestId } = render(<SyncStatusIndicator isConnected={false} />);

      const dot = getByTestId('sync-status-dot');
      expect(dot.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#ef4444' }),
        ])
      );
    });
  });

  describe('custom partner name', () => {
    it('should show partner name when provided and connected', () => {
      render(<SyncStatusIndicator isConnected={true} partnerName="Alex" />);

      expect(screen.getByText('Alex connected')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have accessible label for connected state', () => {
      const { getByLabelText } = render(<SyncStatusIndicator isConnected={true} />);

      expect(getByLabelText('Partner connection status: connected')).toBeTruthy();
    });

    it('should have accessible label for disconnected state', () => {
      const { getByLabelText } = render(<SyncStatusIndicator isConnected={false} />);

      expect(getByLabelText('Partner connection status: reconnecting')).toBeTruthy();
    });
  });
});
