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
  runtimeVersion: { policy: 'fingerprint' },
  updates: {
    url: 'https://u.expo.dev/aed44e7d-8d68-4974-86b2-70e8534d16ce',
    // Updates are checked/fetched manually (see src/features/app-update) so we
    // can prompt before reloading. ON_ERROR_RECOVERY keeps the SDK's automatic
    // behaviour limited to recovering from a broken JS bundle, and avoids a
    // redundant background fetch racing the manual check on startup.
    checkAutomatically: 'ON_ERROR_RECOVERY',
    fallbackToCacheTimeout: 0,
  },
  orientation: 'portrait',
  icon: asset('./assets/images/icon.png'),
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: APP_PACKAGE,
    buildNumber: '1',
    // Keep the fingerprint runtime version stable between local EAS CLI
    // evaluation and the EAS worker, where EAS_BUILD_PROFILE is set.
    entitlements: {
      'com.apple.developer.kernel.extended-virtual-addressing': true,
      'com.apple.developer.kernel.increased-memory-limit': true,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: asset('./assets/images/adaptive-icon.png'),
      backgroundColor: '#faf9f5',
    },
    predictiveBackGestureEnabled: true,
    package: APP_PACKAGE,
    // versionCode is managed remotely (eas.json appVersionSource: 'remote'), so
    // a static value here is ignored — omit it to avoid the build-time warning.
    permissions: ['android.permission.REQUEST_INSTALL_PACKAGES'],
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
        entitlementsProfile: [
          'development',
          'preview',
          'production',
          'direct',
        ],
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
