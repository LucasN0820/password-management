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
  ios: {
    supportsTablet: true,
    bundleIdentifier: APP_PACKAGE,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#faf9f5',
    },
    predictiveBackGestureEnabled: true,
    package: APP_PACKAGE,
  },
  web: {
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-localization',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#faf9f5',
      },
    ],
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
    'expo-secure-store',
    'expo-web-browser',
    [
      'llama.rn',
      {
        enableEntitlements: true,
        entitlementsProfile: ['development', 'preview', 'production'],
        forceCxx20: true,
        enableOpenCLAndHexagon: true,
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '16.4',
        },
        android: {
          minSdkVersion: 24,
        },
      },
    ],
    './plugins/expo-model-download.js',
  ],
  experiments: {
    typedRoutes: true,
  },
  owner: 'lucas-beto',
  extra: {
    eas: {
      projectId: 'd7184498-0ef7-4f4b-b2e9-cd33ea62045c',
    },
  },
});
