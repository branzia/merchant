import '../global.css';
import * as Sentry from '@sentry/react-native';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { resolveNotificationRoute } from '@/services/notifications';
import { ActivityIndicator, View } from 'react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0,
});

function RootLayoutNav() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!token && !inAuth) {
      router.replace('/(auth)/login');
    } else if (token && inAuth) {
      router.replace('/(tabs)');
    }
  }, [token, isLoading, segments]);

  // Notification tap → deep link. Two sources: a real FCM notification
  // tapped from background/quit state, or our own foreground-only local
  // notification (see services/notifications.ts) tapped in-app.
  useEffect(() => {
    const goTo = (url?: string | null) => {
      const route = resolveNotificationRoute(url);
      if (route) router.push(route as any);
    };

    const unsubscribeOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
      goTo(remoteMessage?.data?.url as string | undefined);
    });

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => goTo(remoteMessage?.data?.url as string | undefined));

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      goTo(response.notification.request.content.data?.url as string | undefined);
    });

    return () => {
      unsubscribeOpenedApp();
      responseSub.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  return <Slot />;
}

function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

export default Sentry.wrap(RootLayout);
