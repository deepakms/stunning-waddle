/**
 * Settings Flow Layout
 *
 * Stack navigation for settings screens.
 */

import { Stack } from 'expo-router';
import { COLORS } from '@/constants/app';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="profile" />
      <Stack.Screen name="partner" />
      <Stack.Screen name="fitness" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="injuries" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="appearance" />
      <Stack.Screen name="haptics" />
      <Stack.Screen name="help" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
    </Stack>
  );
}
