import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { HabitsProvider } from '@/context/habits-context';
import { initializeSounds } from '@/services/sounds';
import { initializeNotifications, requestNotificationPermissions } from '@/services/notifications';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    initializeSounds();
    initializeNotifications();
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_complete');
      setOnboardingComplete(completed === 'true');
      if (completed !== 'true') {
        router.replace('/onboarding');
      }
    } catch (error) {
      console.error('Failed to check onboarding:', error);
      setOnboardingComplete(false);
    }
  };

  return (
    <SafeAreaProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <HabitsProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="onboarding"
            options={{
              presentation: 'fullScreenModal',
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="add-habit"
            options={{
              presentation: 'modal',
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="celebrate"
            options={{
              presentation: 'modal',
              animationEnabled: true,
            }}
          />
        </Stack>
      </HabitsProvider>
    </ThemeProvider>
    </SafeAreaProvider>
  );
}
