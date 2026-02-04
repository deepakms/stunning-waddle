/**
 * Bet Flow Layout
 *
 * Stack navigation for bet screens.
 */

import { Stack } from 'expo-router';
import { COLORS } from '@/constants/app';

export default function BetLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
