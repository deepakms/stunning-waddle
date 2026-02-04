/**
 * History Tab Screen
 *
 * Shows workout history and statistics.
 * Clean timeline view of past workouts.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

type TimeFilter = 'week' | 'month' | 'all';

// Mock data - will be replaced with real data
const MOCK_WORKOUTS: Array<{
  id: string;
  name: string;
  date: string;
  duration: number;
  xpEarned: number;
  completed: boolean;
}> = [];

const MOCK_STATS = {
  totalWorkouts: 0,
  totalMinutes: 0,
  totalXp: 0,
  avgDuration: 0,
};

export default function HistoryScreen() {
  const { hasCouple, isLoading } = useProfile();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const workouts = MOCK_WORKOUTS;
  const stats = MOCK_STATS;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Track your fitness journey</Text>
        </View>

        {/* Time Filter */}
        <View style={styles.filterContainer}>
          {(['week', 'month', 'all'] as TimeFilter[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                timeFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setTimeFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  timeFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalXp}</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgDuration}</Text>
            <Text style={styles.statLabel}>Avg Min</Text>
          </View>
        </View>

        {/* Workouts List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>

          {!hasCouple && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No Data Yet</Text>
              <Text style={styles.emptyText}>
                Connect with a partner and complete workouts to see your history
              </Text>
            </View>
          )}

          {hasCouple && workouts.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No Workouts Yet</Text>
              <Text style={styles.emptyText}>
                Complete your first workout to start tracking progress
              </Text>
            </View>
          )}

          {workouts.length > 0 && (
            <View style={styles.workoutsList}>
              {workouts.map((workout) => (
                <TouchableOpacity key={workout.id} style={styles.workoutCard}>
                  <View style={styles.workoutIcon}>
                    <Text style={styles.workoutIconText}>💪</Text>
                  </View>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    <Text style={styles.workoutDate}>{workout.date}</Text>
                  </View>
                  <View style={styles.workoutStats}>
                    <Text style={styles.workoutDuration}>{workout.duration} min</Text>
                    <Text style={styles.workoutXp}>+{workout.xpEarned} XP</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Insights */}
        {hasCouple && workouts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            <View style={styles.insightsCard}>
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>📈</Text>
                <Text style={styles.insightText}>
                  You've improved by 15% this week
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>🏆</Text>
                <Text style={styles.insightText}>
                  Best workout: Full Body Blast (45 min)
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Motivational Message */}
        {hasCouple && workouts.length === 0 && (
          <View style={styles.motivationCard}>
            <Text style={styles.motivationIcon}>💪</Text>
            <Text style={styles.motivationTitle}>Every journey begins with a single step</Text>
            <Text style={styles.motivationText}>
              Start your first workout today and begin building your fitness story together
            </Text>
          </View>
        )}
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
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Filter
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // Empty State
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Workouts List
  workoutsList: {
    gap: SPACING.sm,
  },
  workoutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  workoutIconText: {
    fontSize: 24,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  workoutDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  workoutStats: {
    alignItems: 'flex-end',
  },
  workoutDuration: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  workoutXp: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    marginTop: 2,
  },

  // Insights
  insightsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  insightText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Motivation Card
  motivationCard: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  motivationIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  motivationTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  motivationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
