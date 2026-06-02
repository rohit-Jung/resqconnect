import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Resq Civilian',
  slug: 'resq-civilian',
  version: '1.0.0',
  scheme: 'resq-civilian',
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  experiments: {
    tsconfigPaths: true,
  },
  plugins: ['expo-router', 'expo-location', 'expo-font', 'expo-secure-store'],
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.anonymous.resq.user',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
    package: 'com.anonymous.resq.user',
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  },
  extra: {
    router: {},
    eas: {
      projectId: 'd1da640e-4a39-4ac4-9608-d5196cab6166',
    },
  },
};

export default config;
