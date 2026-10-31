// Firefox reads this file from gecko.update_url to find the signed XPI of the latest release.
// https://extensionworkshop.com/documentation/manage/updating-your-extension/
function updateManifest({ addonId, version, repository }) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Wersja Firefox musi mieć format X.Y.Z.');
  return {
    addons: {
      [addonId]: {
        updates: [{
          version,
          update_link: `https://github.com/${repository}/releases/download/v${version}/video-playback-controller-${version}-firefox.xpi`,
        }],
      },
    },
  };
}

module.exports = { updateManifest };

if (require.main === module) {
  const firefox = require('../src/main/extension/manifest.json');
  const manifest = updateManifest({
    addonId: firefox.browser_specific_settings.gecko.id,
    version: firefox.version,
    repository: process.env.GITHUB_REPOSITORY,
  });
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}
