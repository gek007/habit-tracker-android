import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabitsContext } from '@/context/habits-context';
import { StatsChart } from '@/components/stats-chart';
import { StreakBadge } from '@/components/streak-badge';
import { resolveHabitIcon } from '@/utils/habit-icon';

export default function StatsScreen() {
  const { habits, getHabitEntry, getStreak } = useHabitsContext();

  const sevenDayData = useMemo(() => {
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const completed = habits.filter(
        (h) => getHabitEntry(h.id, dateStr) >= h.goal
      ).length;
      const percent =
        habits.length > 0
          ? Math.round((completed / habits.length) * 100)
          : 0;

      data.push({
        value: percent,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }

    return data;
  }, [habits, getHabitEntry]);

  const longestStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    const streaks = habits.map((h) => getStreak(h.id));
    return Math.max(...streaks);
  }, [habits, getStreak]);

  const currentStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    const streaks = habits.map((h) => getStreak(h.id));
    return Math.min(...streaks);
  }, [habits, getStreak]);

  const totalCompleted = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return habits.reduce((acc, h) => {
      const completed = h.entries.filter((e) => e.date <= today && e.count >= h.goal).length;
      return acc + completed;
    }, 0);
  }, [habits]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.streakSection}>
          <View style={styles.streakCard}>
            <View style={styles.streakContent}>
              <Text style={styles.streakLabel}>Current Streak</Text>
              <View style={styles.streakValueContainer}>
                <Text style={styles.streakValue}>{currentStreak}</Text>
                <MaterialCommunityIcons
                  name="fire"
                  size={24}
                  color="#ff6b35"
                />
              </View>
            </View>
          </View>

          <View style={styles.streakCard}>
            <View style={styles.streakContent}>
              <Text style={styles.streakLabel}>Longest Streak</Text>
              <View style={styles.streakValueContainer}>
                <Text style={styles.streakValue}>{longestStreak}</Text>
                <MaterialCommunityIcons
                  name="fire"
                  size={24}
                  color="#ff6b35"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 7 Days</Text>
          <StatsChart
            data={sevenDayData}
            title="Daily Completion %"
            maxValue={100}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habit Consistency</Text>
          {habits.length > 0 ? (
            habits.map((habit) => {
              const habitStreak = getStreak(habit.id);
              return (
                <View key={habit.id} style={styles.habitStat}>
                  <View
                    style={[
                      styles.habitStatIcon,
                      { backgroundColor: `${habit.color}22` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={resolveHabitIcon(habit.icon)}
                      size={20}
                      color={habit.color}
                    />
                  </View>
                  <View style={styles.habitStatInfo}>
                    <Text style={styles.habitStatName}>{habit.name}</Text>
                    <View style={styles.habitStatMeta}>
                      {habitStreak > 0 ? (
                        <>
                          <MaterialCommunityIcons
                            name="fire"
                            size={14}
                            color="#ff6b35"
                          />
                          <Text style={styles.habitStatStreak}>
                            {habitStreak} day streak
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.habitStatStreak}>
                          No streak
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.habitStatBadge}>
                    <Text style={styles.habitStatBadgeText}>
                      {habit.entries.length} logged
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No habits to track</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Total Completed</Text>
              <Text style={styles.overviewValue}>{totalCompleted}</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Active Habits</Text>
              <Text style={styles.overviewValue}>{habits.length}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  streakSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d4af3722',
  },
  streakContent: {
    justifyContent: 'center',
  },
  streakLabel: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streakValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ff6b35',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  habitStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  habitStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitStatInfo: {
    flex: 1,
  },
  habitStatName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  habitStatMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  habitStatStreak: {
    fontSize: 12,
    color: '#aaa',
  },
  habitStatBadge: {
    backgroundColor: '#d4af3722',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  habitStatBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d4af37',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#aaa',
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600',
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#d4af37',
  },
});
