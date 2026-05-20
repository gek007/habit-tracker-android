import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHabitsContext } from '@/context/habits-context';
import { requestNotificationPermissions } from '@/services/notifications';
import { resolveHabitIcon } from '@/utils/habit-icon';

const SCREEN_WIDTH = Dimensions.get('window').width;

const PRESET_HABITS = [
  {
    name: 'Morning Walk',
    icon: 'run',
    color: '#22c55e',
    type: 'daily' as const,
  },
  {
    name: 'Drink Water',
    icon: 'water',
    color: '#3b82f6',
    type: 'volume' as const,
    goal: 8,
  },
  {
    name: 'Meditate',
    icon: 'meditation',
    color: '#a855f7',
    type: 'daily' as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { addHabit, createChallenge } = useHabitsContext();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = async () => {
    if (currentScreen < 2) {
      setCurrentScreen(currentScreen + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);

      const habitIds: string[] = [];

      for (const habit of PRESET_HABITS) {
        const created = await addHabit(
          habit.name,
          habit.type,
          habit.goal || 1,
          habit.icon,
          habit.color
        );
        habitIds.push(created.id);
      }

      const today = new Date().toISOString().split('T')[0];
      await createChallenge(
        '3-Day Kickstart',
        'Complete your habits for 3 days',
        3,
        habitIds
      );

      await AsyncStorage.setItem('onboarding_complete', 'true');
      await requestNotificationPermissions();

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      alert('Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('onboarding_complete', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        <OnboardingScreen1 />
        <OnboardingScreen2 />
        <OnboardingScreen3 />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {[0, 1, 2].map((index) => {
            const opacity = scrollX.interpolate({
              inputRange: [
                (index - 1) * SCREEN_WIDTH,
                index * SCREEN_WIDTH,
                (index + 1) * SCREEN_WIDTH,
              ],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    opacity:
                      currentScreen === index
                        ? 1
                        : 0.3,
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            onPress={handleSkip}
            disabled={isLoading}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>
              {currentScreen === 2 ? 'Skip' : 'Skip'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            disabled={isLoading}
            style={styles.nextButton}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#0a0a0a" />
            ) : (
              <Text style={styles.nextText}>
                {currentScreen === 2 ? 'Get Started' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function OnboardingScreen1() {
  return (
    <View style={[styles.screen, { width: SCREEN_WIDTH }]}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="fire"
          size={80}
          color="#d4af37"
          style={{ marginBottom: 24 }}
        />
        <Text style={styles.title}>Build Better Habits</Text>
        <Text style={styles.subtitle}>
          Small daily actions lead to extraordinary results. Start your journey
          today.
        </Text>
      </View>
    </View>
  );
}

function OnboardingScreen2() {
  return (
    <View style={[styles.screen, { width: SCREEN_WIDTH }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your 3-Day Kickstart</Text>
        <Text style={[styles.subtitle, styles.subtitleSpaced]}>
          We've prepared these habits to get you started
        </Text>

        {PRESET_HABITS.map((habit, index) => (
          <View
            key={index}
            style={[
              styles.habitCard,
              { backgroundColor: `${habit.color}22` },
            ]}
          >
            <View
              style={[
                styles.habitIconContainer,
                { backgroundColor: `${habit.color}33` },
              ]}
            >
              <MaterialCommunityIcons
                name={resolveHabitIcon(habit.icon)}
                size={28}
                color={habit.color}
              />
            </View>
            <View style={styles.habitCardText}>
              <Text style={styles.habitName}>{habit.name}</Text>
              <Text style={styles.habitDescription}>
                {habit.type === 'daily'
                  ? 'Complete once per day'
                  : `${habit.goal} times per day`}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function OnboardingScreen3() {
  return (
    <View style={[styles.screen, { width: SCREEN_WIDTH }]}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="bell"
          size={80}
          color="#d4af37"
          style={{ marginBottom: 24 }}
        />
        <Text style={styles.title}>Stay Motivated</Text>
        <Text style={styles.subtitle}>
          Get daily reminders and celebrate your progress with notifications,
          sounds, and visual feedback.
        </Text>

        <View style={styles.featureList}>
          <View style={styles.feature}>
            <MaterialCommunityIcons
              name="vibrate"
              size={20}
              color="#d4af37"
            />
            <Text style={styles.featureText}>Haptic feedback</Text>
          </View>
          <View style={styles.feature}>
            <MaterialCommunityIcons
              name="volume-high"
              size={20}
              color="#d4af37"
            />
            <Text style={styles.featureText}>Celebration sounds</Text>
          </View>
          <View style={styles.feature}>
            <MaterialCommunityIcons name="bell" size={20} color="#d4af37" />
            <Text style={styles.featureText}>Daily reminders</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  subtitleSpaced: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  habitIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitCardText: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 13,
    color: '#aaa',
  },
  featureList: {
    marginTop: 32,
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#d4af3722',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d4af37',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a0a0a',
  },
});
