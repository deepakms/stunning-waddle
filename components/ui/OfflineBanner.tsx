/**
 * Offline Banner Component
 *
 * Shows a banner when the device is offline.
 * Slides in from top with animation.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';
import { useNetworkState } from '@/hooks/useNetworkState';

interface OfflineBannerProps {
  onDismiss?: () => void;
}

export function OfflineBanner({ onDismiss }: OfflineBannerProps) {
  const { isConnected, showOfflineBanner, dismissOfflineBanner } = useNetworkState();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (showOfflineBanner) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showOfflineBanner]);

  if (!showOfflineBanner && isConnected) {
    return null;
  }

  const handleDismiss = () => {
    dismissOfflineBanner();
    onDismiss?.();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
        isConnected ? styles.connectedContainer : null,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{isConnected ? '✅' : '📡'}</Text>
        <Text style={styles.text}>
          {isConnected ? 'Back online!' : 'No internet connection'}
        </Text>
      </View>
      <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
        <Text style={styles.dismissText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Inline offline indicator for use within components
 */
export function OfflineIndicator() {
  const { isConnected } = useNetworkState();

  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.inlineIndicator}>
      <Text style={styles.inlineIcon}>📡</Text>
      <Text style={styles.inlineText}>Offline mode</Text>
    </View>
  );
}

/**
 * Full screen offline state
 */
export function OfflineScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <View style={styles.fullScreen}>
      <Text style={styles.fullScreenIcon}>📡</Text>
      <Text style={styles.fullScreenTitle}>You're Offline</Text>
      <Text style={styles.fullScreenMessage}>
        Please check your internet connection and try again.
      </Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.error,
    paddingTop: 50, // Account for safe area
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  connectedContainer: {
    backgroundColor: COLORS.success,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  text: {
    color: '#ffffff',
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  dismissButton: {
    padding: SPACING.xs,
  },
  dismissText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '300',
  },

  // Inline indicator
  inlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.warning}20`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  inlineIcon: {
    fontSize: 12,
    marginRight: SPACING.xs,
  },
  inlineText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    fontWeight: '500',
  },

  // Full screen
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  fullScreenIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  fullScreenTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  fullScreenMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    maxWidth: 280,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
