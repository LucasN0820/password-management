import { ExpoConfig, ConfigContext } from 'expo/config';
import { APP_NAME, APP_PACKAGE, APP_SLUG } from '@repo/metadata';
import packageJson from './package.json';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  slug: APP_SLUG,
  name: APP_NAME,
  scheme: APP_SLUG,
  version: packageJson.version,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: APP_PACKAGE,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: APP_PACKAGE,
  },
  plugins: [
    'expo-router',
    [
      'expo-sqlite',
      {
        enableFTS: true,
        useSQLCipher: true,
        android: {
          enableFTS: false,
          useSQLCipher: false,
        },
        ios: {
          customBuildFlags: [
            '-DSQLITE_ENABLE_DBSTAT_VTAB=1 -DSQLITE_ENABLE_SNAPSHOT=1',
          ],
        },
      },
    ],
    'expo-font',
    'expo-web-browser',
  ],
  experiments: {
    typedRoutes: true,
  },
  owner: 'lucas-beto',
  extra: {
    eas: {
      projectId: '1a2040ad-1684-4431-adab-b2c154f2c871',
    },
  },
});
