import path from 'node:path';
import { ExpoConfig, ConfigContext } from 'expo/config';
import { APP_NAME, APP_PACKAGE, APP_SLUG } from '@repo/metadata';
import packageJson from './package.json';

// Resolve asset paths against this config's directory rather than relying on
// process.cwd(). On EAS the prebuild step runs from the monorepo root, and
// @expo/image-utils reads icon paths relative to cwd, so a plain
// './assets/...' path resolves to <repo-root>/assets and fails with ENOENT.
const asset = (relativePath: string) => path.resolve(__dirname, relativePath);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  slug: APP_SLUG,
  name: APP_NAME,
  scheme: APP_SLUG,
  version: packageJson.version,
  orientation: 'portrait',
  icon: asset('./assets/images/icon.png'),
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: APP_PACKAGE,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: asset('./assets/images/adaptive-icon.png'),
      backgroundColor: '#faf9f5',
    },
    predictiveBackGestureEnabled: true,
    package: APP_PACKAGE,
  },
  web: {
    favicon: asset('./assets/images/favicon.png'),
  },
  plugins: [
    'expo-router',
    'expo-localization',
    [
      'expo-splash-screen',
      {
        image: asset('./assets/images/splash-icon.png'),
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
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'Allow $(PRODUCT_NAME) to use Face ID to unlock your vault.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'Allow $(PRODUCT_NAME) to scan two-factor (2FA) QR codes.',
      },
    ],
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
      projectId: 'aed44e7d-8d68-4974-86b2-70e8534d16ce',
    },
  },
});
