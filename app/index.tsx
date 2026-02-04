/**
 * App Entry Point
 *
 * Handles initial routing based on authentication state.
 * Shows loading while checking auth, then redirects appropriately.
 */

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/constants/app';

export default function Index() {
  const { isLoading, isAuthenticated, user } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Redirect based on auth state
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // User is authenticated, go to main app
  return <Redirect href="/(main)/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
