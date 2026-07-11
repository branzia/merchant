module.exports = {
  expo: {
    name: 'Branzia Merchant',
    slug: 'branzia-merchant',
    scheme: 'branzia-merchant',
    version: '1.0.0',
    orientation: 'default',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    android: {
      newArchEnabled: true,
      package: 'com.branzia.merchant',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
      adaptiveIcon: {
        backgroundImage: './assets/android-icon-background.png',
        foregroundImage: './assets/android-icon-foreground.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-secure-store',
      'expo-router',
      './plugins/withLargeScreenSupport',
      [
        '@sentry/react-native',
        {
          organization: 'branzia',
          project: 'branzia-merchant',
        },
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
    ],
    extra: {
      router: {},
      eas: {
        projectId: 'b581a1f4-ba6a-4c3f-9850-22ddfa1ad3d9',
      },
    },
    owner: 'itsvishwa01',
  },
};
