// Config plugin for the local expo-model-download module.
//
// The native module ships its own AndroidManifest (foreground-service +
// permissions) and iOS background URLSession, but the deep link the download
// notification opens depends on the app's URL scheme, which is only known at
// config time. This injects `<scheme>://ai-import` as Android manifest
// meta-data the service reads when building the notification's content intent.
const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const META_NAME = 'expo.modules.modeldownload.DEEP_LINK';

const withModelDownload = config => {
  return withAndroidManifest(config, cfg => {
    const scheme = Array.isArray(config.scheme)
      ? config.scheme[0]
      : config.scheme;
    if (!scheme) return cfg;

    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults
    );
    const deepLink = `${scheme}://ai-import`;
    application['meta-data'] = application['meta-data'] || [];
    const existing = application['meta-data'].find(
      item => item.$['android:name'] === META_NAME
    );
    if (existing) {
      existing.$['android:value'] = deepLink;
    } else {
      application['meta-data'].push({
        $: { 'android:name': META_NAME, 'android:value': deepLink },
      });
    }
    return cfg;
  });
};

module.exports = withModelDownload;
