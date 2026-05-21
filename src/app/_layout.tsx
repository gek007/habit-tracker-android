import 'react-native-get-random-values';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState, ReactNode } from 'react';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { HabitsProvider } from '@/context/habits-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { initializeSounds } from '@/services/sounds';
import { initializeNotifications, requestNotificationPermissions } from '@/services/notifications';

function AuthGate({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    console.log('[routing] Session:', !!session);

    if (!session) {
      console.log('[routing] No session, going to login');
      router.replace('/(auth)/login' as any);
    } else {
      console.log('[routing] Session exists, checking onboarding');
      checkOnboarding();
    }
  }, [session, isLoading]);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_complete');
      console.log('[routing] Onboarding completed:', completed === 'true');
      if (completed === 'true') {
        console.log('[routing] Going to (tabs)');
        router.replace('/(tabs)' as any);
      } else {
        console.log('[routing] Going to onboarding');
        router.replace('/onboarding');
      }
    } catch (e) {
      console.error('[routing] Onboarding check error:', e);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initializeSounds();
    initializeNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthGate>
            <HabitsProvider>
              <AnimatedSplashOverlay />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="onboarding"
                  options={{
                    presentation: 'fullScreenModal',
                  }}
                />
                <Stack.Screen
                  name="add-habit"
                  options={{
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen
                  name="celebrate"
                  options={{
                    presentation: 'modal',
                  }}
                />
              </Stack>
            </HabitsProvider>
          </AuthGate>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
