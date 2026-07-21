import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { APP_CONFIG } from '../constants/config';

// Configure notification default behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers the device for Expo Push Notifications and FCM token retrieval.
 * Configures specific priority channels on Android for low-latency alerts.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'web') {
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications Service] Failed to get push token for push notification!');
      return null;
    }

    // Retrieve the token
    try {
      const expoTokenResponse = await Notifications.getExpoPushTokenAsync();
      token = expoTokenResponse.data;
      console.log('[Notifications Service] Expo Push Token obtained:', token);
    } catch (error) {
      console.error('[Notifications Service] Error getting Expo Push Token:', error);
    }

    // Configure low-latency VIP channel for Android devices
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(APP_CONFIG.NOTIFICATION_CHANNEL_ID, {
        name: APP_CONFIG.NOTIFICATION_CHANNEL_NAME,
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4AF37', // Gold color notification led
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
      });
    }
  } else {
    console.log('[Notifications Service] Emulators do not support physical push notifications');
  }

  return token;
}

/**
 * Attaches event listeners for foreground and background notification interactions.
 */
export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationResponseReceived: (response: Notifications.NotificationResponse) => void
) {
  // Triggered when a notification is received while the app is foregrounded
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    onNotificationReceived
  );

  // Triggered when a user taps on or interacts with a notification (foreground, background, or closed)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    onNotificationResponseReceived
  );

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}
