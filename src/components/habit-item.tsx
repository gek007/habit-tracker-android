import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Habit } from '@/hooks/use-habits';
import { playCompletionChime } from '@/services/sounds';
import { RewardBurst } from './reward-burst';
import { VolumeCounter } from './volume-counter';
import { StreakBadge } from './streak-badge';
import { resolveHabitIcon } from '@/utils/habit-icon';

interface HabitItemProps {
  habit: Habit;
  today: string;
  currentEntry: number;
  streak: number;
  onToggle: (habitId: string, count: number) => Promise<void>;
}

export function HabitItem({
  habit,
  today,
  currentEntry,
  streak,
  onToggle,
}: HabitItemProps) {
  const scale = useSharedValue(1);
  const [showBurst, setShowBurst] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isCompleted = habit.type === 'daily'
    ? currentEntry >= habit.goal
    : currentEntry >= habit.goal;

  const handleToggle = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      if (habit.type === 'daily') {
        const newCount = currentEntry >= habit.goal ? 0 : 1;
        scale.value = withSpring(1.2);
        setTimeout(() => {
          scale.value = withSpring(1);
        }, 150);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await playCompletionChime();
        setShowBurst(true);

        await onToggle(habit.id, newCount);
      } else {
        const newCount = currentEntry + 1;
        scale.value = withSpring(1.15);
        setTimeout(() => {
          scale.value = withSpring(1);
        }, 100);

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await playCompletionChime();

        if (newCount >= habit.goal) {
          setShowBurst(true);
        }

        await onToggle(habit.id, newCount);
      }
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        <View style={styles.habitInfo}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${habit.color}22` },
            ]}
          >
            <MaterialCommunityIcons
              name={resolveHabitIcon(habit.icon)}
              size={24}
              color={habit.color}
            />
          </View>

          <View style={styles.textContent}>
            <Text style={styles.habitName}>{habit.name}</Text>
            <View style={styles.meta}>
              {habit.type === 'volume' && (
                <Text style={styles.metaText}>
                  {currentEntry}/{habit.goal}
                </Text>
              )}
              {streak > 0 && <StreakBadge streak={streak} size="small" />}
            </View>
          </View>
        </View>

        <Animated.View style={animatedStyle}>
          {habit.type === 'daily' ? (
            <TouchableOpacity
              onPress={handleToggle}
              disabled={isLoading}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.toggleCircle,
                  isCompleted && styles.toggleCircleActive,
                  { borderColor: habit.color },
                ]}
              >
                {isCompleted && (
                  <MaterialCommunityIcons
                    name="check"
                    size={24}
                    color={habit.color}
                  />
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <VolumeCounter
              current={currentEntry}
              goal={habit.goal}
              onIncrement={handleToggle}
              color={habit.color}
            />
          )}
        </Animated.View>
      </View>

      {showBurst && (
        <View style={StyleSheet.absoluteFill}>
          <RewardBurst onComplete={() => setShowBurst(false)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    position: 'relative',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '500',
  },
  toggleCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  toggleCircleActive: {
    backgroundColor: '#d4af3722',
  },
});
