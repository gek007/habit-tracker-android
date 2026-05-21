import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabitsContext } from '@/context/habits-context';
import { useAuth } from '@/context/auth-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  requestNotificationPermissions,
  scheduleHabitReminders,
  notificationsAvailable,
} from '@/services/notifications';

export default function SettingsScreen() {
  const { habits } = useHabitsContext();
  const { signOut } = useAuth();
  const [morningTime, setMorningTime] = useState('08:00');
  const [eveningTime, setEveningTime] = useState('19:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPrefs();
      setMorningTime(prefs.morningTime);
      setEveningTime(prefs.eveningTime);
      setNotificationsEnabled(prefs.enabled);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!notificationsAvailable) {
      alert(
        'Scheduled notifications are not available in Expo Go on Android. Use a development build or test on a physical device with a production build.'
      );
      return;
    }

    try {
      if (enabled) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          alert(
            'Notification permission denied. You can enable it in Settings.'
          );
          return;
        }
      }

      setNotificationsEnabled(enabled);
      await updateNotificationPrefs({ enabled });

      if (enabled) {
        await scheduleHabitReminders(habits, {
          enabled: true,
          morningTime,
          eveningTime,
        });
      }
    } catch (error) {
      console.error('Failed to update notifications:', error);
    }
  };

  const handleTimeChange = async (
    type: 'morning' | 'evening',
    time: string
  ) => {
    try {
      if (type === 'morning') {
        setMorningTime(time);
      } else {
        setEveningTime(time);
      }

      const newPrefs = {
        enabled: notificationsEnabled,
        morningTime: type === 'morning' ? time : morningTime,
        eveningTime: type === 'evening' ? time : eveningTime,
      };

      await updateNotificationPrefs(newPrefs);

      if (notificationsEnabled) {
        await scheduleHabitReminders(habits, newPrefs);
      }
    } catch (error) {
      console.error('Failed to update time:', error);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#d4af37" />
        </View>
      </SafeAreaView>
    );
  }

  const TimeInput = ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (time: string) => void;
    label: string;
  }) => {
    const hours = value.split(':')[0];
    const minutes = value.split(':')[1];

    const handleHourChange = (text: string) => {
      const num = Math.min(Math.max(parseInt(text, 10) || 0, 0), 23);
      onChange(`${String(num).padStart(2, '0')}:${minutes}`);
    };

    const handleMinuteChange = (text: string) => {
      const num = Math.min(Math.max(parseInt(text, 10) || 0, 0), 59);
      onChange(`${hours}:${String(num).padStart(2, '0')}`);
    };

    return (
      <View style={styles.timeInput}>
        <Text style={styles.timeInputLabel}>{label}</Text>
        <View style={styles.timeInputRow}>
          <View style={styles.timeField}>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                const newHour = (parseInt(hours, 10) - 1 + 24) % 24;
                handleHourChange(String(newHour));
              }}
            >
              <MaterialCommunityIcons name="minus" size={16} color="#d4af37" />
            </TouchableOpacity>
            <Text style={styles.timeValue}>{hours}</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                const newHour = (parseInt(hours, 10) + 1) % 24;
                handleHourChange(String(newHour));
              }}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#d4af37" />
            </TouchableOpacity>
          </View>

          <Text style={styles.timeSeparator}>:</Text>

          <View style={styles.timeField}>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                const newMin = (parseInt(minutes, 10) - 1 + 60) % 60;
                handleMinuteChange(String(newMin));
              }}
            >
              <MaterialCommunityIcons name="minus" size={16} color="#d4af37" />
            </TouchableOpacity>
            <Text style={styles.timeValue}>{minutes}</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                const newMin = (parseInt(minutes, 10) + 1) % 60;
                handleMinuteChange(String(newMin));
              }}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#d4af37" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bell" size={20} color="#d4af37" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          {!notificationsAvailable && (
            <Text style={styles.expoGoNotice}>
              Reminders are unavailable in Expo Go on Android. The rest of the app works normally.
            </Text>
          )}

          <View style={styles.notificationToggle}>
            <View>
              <Text style={styles.toggleLabel}>Enable Notifications</Text>
              <Text style={styles.toggleSubtext}>
                Get daily reminders for your habits
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              disabled={!notificationsAvailable}
              trackColor={{ false: '#333', true: '#d4af3744' }}
              thumbColor={notificationsEnabled ? '#d4af37' : '#666'}
            />
          </View>

          {notificationsEnabled && notificationsAvailable && (
            <>
              <TimeInput
                label="Morning Reminder"
                value={morningTime}
                onChange={(time) => handleTimeChange('morning', time)}
              />
              <TimeInput
                label="Evening Reminder"
                value={eveningTime}
                onChange={(time) => handleTimeChange('evening', time)}
              />
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information" size={20} color="#d4af37" />
            <Text style={styles.sectionTitle}>App Info</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Active Habits</Text>
            <Text style={styles.infoValue}>{habits.length}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="help-circle" size={20} color="#d4af37" />
            <Text style={styles.sectionTitle}>About</Text>
          </View>

          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              Build better habits with our habit tracker. Stay motivated with
              daily reminders, progress tracking, and celebratory rewards.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="logout" size={20} color="#fff" />
                <Text style={styles.logoutText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>
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
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  notificationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#aaa',
  },
  expoGoNotice: {
    fontSize: 12,
    color: '#f97316',
    lineHeight: 18,
    marginBottom: 12,
  },
  timeInput: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  timeInputLabel: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timeField: {
    alignItems: 'center',
    gap: 8,
  },
  timeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  timeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    minWidth: 40,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: '700',
    color: '#d4af37',
    marginHorizontal: 4,
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  infoLabel: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d4af37',
  },
  aboutCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  aboutText: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
