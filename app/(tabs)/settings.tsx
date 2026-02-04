/**
 * Settings Tab Screen
 *
 * User profile settings, preferences, and account management.
 * Clean, organized sections for all settings.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, SPACING, FONT_SIZES, DIFFICULTY_LABELS } from '@/constants/app';

interface SettingsItemProps {
  icon: string;
  title: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}

function SettingsItem({ icon, title, value, onPress, danger }: SettingsItemProps) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        {value && <Text style={styles.settingsValue}>{value}</Text>}
      </View>
      <Text style={styles.settingsArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { profile, profileWithCouple, hasCouple, isLoading } = useProfile();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleUncouple = () => {
    Alert.alert(
      'Leave Partnership',
      'Are you sure you want to leave your partnership? This will end your workout history together.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement uncouple
            Alert.alert('Coming Soon', 'This feature will be available soon.');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const fitnessLevel = profile?.fitness_level;
  const fitnessLabel = fitnessLevel
    ? DIFFICULTY_LABELS[fitnessLevel as keyof typeof DIFFICULTY_LABELS]
    : 'Not set';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/(settings)/profile')}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.display_name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.display_name ?? 'Unknown'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <Text style={styles.profileArrow}>›</Text>
        </TouchableOpacity>

        {/* Partner Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partnership</Text>
          <View style={styles.settingsGroup}>
            {hasCouple ? (
              <>
                <SettingsItem
                  icon="❤️"
                  title="Partner Status"
                  value="Connected"
                  onPress={() => router.push('/(settings)/partner')}
                />
                <SettingsItem
                  icon="📤"
                  title="Invite New Partner"
                  onPress={() => router.push('/(main)/invite')}
                />
                <SettingsItem
                  icon="💔"
                  title="Leave Partnership"
                  onPress={handleUncouple}
                  danger
                />
              </>
            ) : (
              <>
                <SettingsItem
                  icon="👥"
                  title="Invite Partner"
                  value="Not connected"
                  onPress={() => router.push('/(main)/invite')}
                />
                <SettingsItem
                  icon="🔗"
                  title="Join Partner"
                  value="Have an invite code?"
                  onPress={() => router.push('/(main)/join-couple')}
                />
              </>
            )}
          </View>
        </View>

        {/* Fitness Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Profile</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon="💪"
              title="Fitness Level"
              value={fitnessLabel}
              onPress={() => router.push('/(settings)/fitness')}
            />
            <SettingsItem
              icon="⏱️"
              title="Preferred Duration"
              value={`${profile?.preferred_workout_length ?? 30} min`}
              onPress={() => router.push('/(settings)/preferences')}
            />
            <SettingsItem
              icon="🎯"
              title="Goals"
              value={profile?.primary_goal?.replace(/_/g, ' ') ?? 'Not set'}
              onPress={() => router.push('/(settings)/goals')}
            />
            <SettingsItem
              icon="⚠️"
              title="Injuries"
              value={`${profile?.injuries?.length ?? 0} listed`}
              onPress={() => router.push('/(settings)/injuries')}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon="🔔"
              title="Notifications"
              onPress={() => router.push('/(settings)/notifications')}
            />
            <SettingsItem
              icon="🎨"
              title="Appearance"
              value="Light"
              onPress={() => router.push('/(settings)/appearance')}
            />
            <SettingsItem
              icon="📳"
              title="Haptic Feedback"
              value="On"
              onPress={() => router.push('/(settings)/haptics')}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon="❓"
              title="Help & FAQ"
              onPress={() => router.push('/(settings)/help')}
            />
            <SettingsItem
              icon="📧"
              title="Contact Us"
              onPress={() => router.push('/(settings)/contact')}
            />
            <SettingsItem
              icon="📜"
              title="Terms of Service"
              onPress={() => router.push('/(settings)/terms')}
            />
            <SettingsItem
              icon="🔒"
              title="Privacy Policy"
              onPress={() => router.push('/(settings)/privacy')}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon="🚪"
              title="Sign Out"
              onPress={handleSignOut}
            />
            <SettingsItem
              icon="🗑️"
              title="Delete Account"
              onPress={() => {
                Alert.alert(
                  'Delete Account',
                  'This action is irreversible. All your data will be permanently deleted.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        Alert.alert('Coming Soon', 'Account deletion will be available soon.');
                      },
                    },
                  ]
                );
              }}
              danger
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Couples Workout</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Profile Card
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileArrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },

  // Section
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  settingsGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Settings Item
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
    width: 28,
    textAlign: 'center',
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  settingsValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingsArrow: {
    fontSize: 20,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  dangerText: {
    color: COLORS.error,
  },

  // App Info
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  appName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  appVersion: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
