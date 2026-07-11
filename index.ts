import messaging from '@react-native-firebase/messaging';

// Must be registered outside the React tree, before the app renders, so
// FCM data messages are handled even when the app is killed/backgrounded.
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[FCM] background message', remoteMessage.messageId);
});

import './global.css';
import 'expo-router/entry';
