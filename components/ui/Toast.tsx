/**
 * Toast Component
 *
 * Shows temporary notification messages.
 * Supports success, error, warning, and info variants.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const COLORS_MAP: Record<ToastType, { bg: string; text: string }> = {
  success: { bg: `${COLORS.success}15`, text: COLORS.success },
  error: { bg: `${COLORS.error}15`, text: COLORS.error },
  warning: { bg: `${COLORS.warning}15`, text: COLORS.warning },
  info: { bg: `${COLORS.primary}15`, text: COLORS.primary },
};

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  action,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      if (duration > 0) {
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
      }
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, duration, onDismiss]);

  if (!visible) {
    return null;
  }

  const colors = COLORS_MAP[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onDismiss}
        activeOpacity={0.9}
      >
        <Text style={styles.icon}>{ICONS[type]}</Text>
        <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
          {message}
        </Text>
        {action && (
          <TouchableOpacity onPress={action.onPress}>
            <Text style={[styles.action, { color: colors.text }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Simple success toast
 */
export function SuccessToast({
  visible,
  message,
  onDismiss,
}: {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}) {
  return (
    <Toast
      visible={visible}
      message={message}
      type="success"
      onDismiss={onDismiss}
    />
  );
}

/**
 * Simple error toast
 */
export function ErrorToast({
  visible,
  message,
  onDismiss,
  onRetry,
}: {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}) {
  return (
    <Toast
      visible={visible}
      message={message}
      type="error"
      onDismiss={onDismiss}
      duration={5000}
      action={
        onRetry
          ? {
              label: 'Retry',
              onPress: onRetry,
            }
          : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: SPACING.lg,
    right: SPACING.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  icon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  message: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  action: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: SPACING.md,
  },
});
