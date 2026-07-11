/**
 * FCM push notification registration + handling.
 *
 * Token acquisition/refresh uses @react-native-firebase/messaging directly
 * against the Branzia Firebase project (same project the web dashboard's
 * FCM v1 sender and the merchant PWA share) — the server expects a raw
 * FCM device token, not an Expo push token.
 *
 * expo-notifications is used only to *display* a local banner while the
 * app is in the foreground, since RNFirebase's onMessage() delivers the
 * payload silently without showing anything on screen.
 */
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as api from '@/services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let unsubscribeOnMessage: (() => void) | null = null;
let unsubscribeTokenRefresh: (() => void) | null = null;

async function requestPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  const granted =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (Platform.OS === 'android') {
    // Android 13+ needs the runtime POST_NOTIFICATIONS prompt; older
    // Android versions resolve this immediately with 'granted'.
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  return granted;
}

/**
 * Requests permission, fetches the current FCM token, registers it with
 * the Branzia API, and starts listening for token refresh + foreground
 * messages. Safe to call multiple times (e.g. on every app launch) —
 * re-registers listeners rather than stacking them.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    const granted = await requestPermission();
    if (!granted) return;

    const token = await messaging().getToken();
    if (token) {
      await api.registerFcmToken(token);
    }

    unsubscribeTokenRefresh?.();
    unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      await api.registerFcmToken(newToken);
    });

    unsubscribeOnMessage?.();
    unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title ?? 'Branzia',
          body: remoteMessage.notification?.body ?? '',
          data: remoteMessage.data ?? {},
        },
        trigger: null, // show immediately
      });
    });
  } catch (err) {
    console.warn('[FCM] registration failed', err);
  }
}

/** Stops listening for token refresh + foreground messages. Does NOT
 *  remove the token from the server — call api.removeFcmToken() for that. */
export function unregisterPushNotifications(): void {
  unsubscribeOnMessage?.();
  unsubscribeOnMessage = null;
  unsubscribeTokenRefresh?.();
  unsubscribeTokenRefresh = null;
}

/**
 * Maps the `data.url` sent by the Branzia API (web dashboard paths, e.g.
 * "/merchant/orders/101") to an in-app expo-router route. Returns null
 * for URLs this app doesn't have a screen for.
 */
export function resolveNotificationRoute(url?: string | null): string | null {
  if (!url) return null;
  const orderMatch = url.match(/^\/merchant\/orders\/(\d+)$/);
  if (orderMatch) return `/orders/${orderMatch[1]}`;
  if (url === '/merchant/orders') return '/(tabs)/orders';
  return null;
}
