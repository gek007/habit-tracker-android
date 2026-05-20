import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '@/hooks/use-habits';

const NOTIFICATION_PREFS_KEY = 'notification_prefs';

/** Push/local scheduling via expo-notifications is not supported in Expo Go on Android (SDK 53+). */
export const notificationsAvailable =
  !(Constants.appOwnership === 'expo' && Platform.OS === 'android');

export interface NotificationPrefs {
  enabled: boolean;
  morningTime: string;
  eveningTime: string;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: true,
  morningTime: '08:00',
  eveningTime: '19:00',
};

type NotificationsModule = typeof import('expo-notifications');

async function getNotifications(): Promise<NotificationsModule | null> {
  if (!notificationsAvailable) {
    return null;
  }
  return import('expo-notifications');
}

export async function initializeNotifications() {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function requestNotificationPermissions() {
  if (!notificationsAvailable) {
    return false;
  }

  try {
    const Notifications = await getNotifications();
    if (!Notifications) return false;

    const { granted } = await Notifications.requestPermissionsAsync();
    return granted;
  } catch (error) {
    console.error('Failed to request notification permissions:', error);
    return false;
  }
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function updateNotificationPrefs(prefs: Partial<NotificationPrefs>) {
  try {
    const current = await getNotificationPrefs();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
    if (updated.enabled) {
      await scheduleHabitReminders([], updated);
    } else {
      await cancelAllNotifications();
    }
  } catch (error) {
    console.error('Failed to update notification prefs:', error);
  }
}

export async function scheduleHabitReminders(habits: Habit[], prefs?: NotificationPrefs) {
  if (!notificationsAvailable) return;

  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    const preferences = prefs || (await getNotificationPrefs());

    if (!preferences.enabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    const [morningHour, morningMin] = preferences.morningTime.split(':').map(Number);
    const [eveningHour, eveningMin] = preferences.eveningTime.split(':').map(Number);

    if (habits.length === 0) {
      await scheduleTimeNotification(
        Notifications,
        'Morning check-in',
        'Ready to start your habits?',
        morningHour,
        morningMin
      );
      await scheduleTimeNotification(
        Notifications,
        'Evening reminder',
        "Don't forget your habits!",
        eveningHour,
        eveningMin
      );
    } else {
      const habitList = habits.map((h) => h.name).join(', ');
      await scheduleTimeNotification(
        Notifications,
        'Morning habits',
        `Today: ${habitList}`,
        morningHour,
        morningMin
      );
      await scheduleTimeNotification(
        Notifications,
        'Evening check-in',
        `Log your progress: ${habitList}`,
        eveningHour,
        eveningMin
      );
    }
  } catch (error) {
    console.error('Failed to schedule habit reminders:', error);
  }
}

async function scheduleTimeNotification(
  Notifications: NotificationsModule,
  title: string,
  body: string,
  hour: number,
  minute: number
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function cancelAllNotifications() {
  if (!notificationsAvailable) return;

  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
}
