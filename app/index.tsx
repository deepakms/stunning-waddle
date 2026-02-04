/**
 * App Entry Point
 *
 * Handles initial routing based on authentication state.
 * Redirects to appropriate screen based on user state.
 */

import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: Check auth state and redirect accordingly
  // For now, redirect to auth
  return <Redirect href="/(auth)/login" />;
}
