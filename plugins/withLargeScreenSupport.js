const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withLargeScreenSupport(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    manifest['supports-screens'] = [
      {
        $: {
          'android:smallScreens': 'true',
          'android:normalScreens': 'true',
          'android:largeScreens': 'true',
          'android:xlargeScreens': 'true',
          'android:resizeable': 'true',
        },
      },
    ];

    const application = manifest.application[0];
    application.$['android:resizeableActivity'] = 'true';

    return config;
  });
};
