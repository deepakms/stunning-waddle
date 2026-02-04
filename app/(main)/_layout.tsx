/**
 * Main App Layout
 *
 * Layout for authenticated screens with stack navigation.
 */

import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="invite" />
      <Stack.Screen name="join-couple" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="workout" />
    </Stack>
  );
}
