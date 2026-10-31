const { test } = require('node:test');
const assert = require('node:assert/strict');
const { updateManifest } = require('../../../scripts/update-manifest.cjs');
const firefox = require('../../main/extension/manifest.json');

test('update manifest points Firefox to the signed XPI of the release', () => {
  assert.deepEqual(updateManifest({ addonId: 'addon@example.invalid', version: '1.6.0', repository: 'example/checker' }), {
    addons: {
      'addon@example.invalid': {
        updates: [{
          version: '1.6.0',
          update_link: 'https://github.com/example/checker/releases/download/v1.6.0/video-playback-controller-1.6.0-firefox.xpi',
        }],
      },
    },
  });
});

test('rejects malformed versions', () => {
  assert.throws(() => updateManifest({ addonId: 'a', version: '1.6.0-SNAPSHOT', repository: 'r' }), /X\.Y\.Z/);
});

test('extension manifest reads updates from the latest GitHub Release', () => {
  assert.equal(firefox.browser_specific_settings.gecko.update_url,
    'https://github.com/mbrzozowskimbs-ops/video-playback-controller/releases/latest/download/updates.json');
});
