import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabitsContext } from '@/context/habits-context';
import { HabitItem } from '@/components/habit-item';
import { StreakBadge } from '@/components/streak-badge';
import * as Haptics from 'expo-haptics';
import { playCelebrationSound } from '@/services/sounds';

export default function HomeScreen() {
  const router = useRouter();
  const { habits, updateHabitEntry, getHabitEntry, getStreak } =
    useHabitsContext();
  const [today] = useState(new Date().toISOString().split('T')[0]);
  const [showCelebration, setShowCelebration] = useState(false);

  const completedCount = habits.filter(
    (h) => getHabitEntry(h.id, today) >= h.goal
  ).length;
  const completionPercent =
    habits.length > 0
      ? Math.round((completedCount / habits.length) * 100)
      : 0;
  const currentStreak = habits.length > 0
    ? Math.min(...habits.map((h) => getStreak(h.id)))
    : 0;

  useEffect(() => {
    if (habits.length > 0 && completedCount === habits.length && completedCount > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playCelebrationSound();
      setShowCelebration(true);
    }
  }, [completedCount, habits.length]);

  const handleAddHabit = () => {
    router.push('/add-habit');
  };

  const handleHabitToggle = async (habitId: string, count: number) => {
    await updateHabitEntry(habitId, today, count);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Today&apos;s Habits</Text>
          <Text style={styles.date}>
            {new Date(today).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        {currentStreak > 0 && (
          <StreakBadge streak={currentStreak} size="large" />
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Progress</Text>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{completionPercent}%</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${completionPercent}%` },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statValue}>{habits.length}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={styles.statValue}>{completedCount}</Text>
        </View>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HabitItem
            habit={item}
            today={today}
            currentEntry={getHabitEntry(item.id, today)}
            streak={getStreak(item.id)}
            onToggle={handleHabitToggle}
          />
        )}
        contentContainerStyle={styles.listContent}
        scrollEnabled={habits.length > 5}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="plus-circle"
              size={64}
              color="#d4af37"
            />
            <Text style={styles.emptyText}>No habits yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first habit
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddHabit}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#0a0a0a" />
      </TouchableOpacity>

      {showCelebration && (
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationContent}>
            <MaterialCommunityIcons
              name="trophy"
              size={64}
              color="#d4af37"
            />
            <Text style={styles.celebrationText}>
              Perfect Day! 🎉
            </Text>
            <Text style={styles.celebrationSubtext}>
              All habits completed
            </Text>
            <TouchableOpacity
              style={styles.celebrationButton}
              onPress={() => setShowCelebration(false)}
            >
              <Text style={styles.celebrationButtonText}>Nice!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingTop: 4,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d4af3722',
  },
  statLabel: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statContent: {
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#d4af37',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#0a0a0a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#d4af37',
  },
  listContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#d4af37',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  celebrationContent: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4af3722',
  },
  celebrationText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  celebrationSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
  },
  celebrationButton: {
    marginTop: 24,
    backgroundColor: '#d4af37',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  celebrationButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '700',
  },
});
