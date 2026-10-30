const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../../..');

test('manifest, package.json and pom.xml share the release version', () => {
  const pom = readFileSync(path.join(root, 'pom.xml'), 'utf8').match(/<artifactId>video-playback-controller<\/artifactId>\s*<version>([^<]+)/)[1];
  assert.equal(JSON.parse(readFileSync(path.join(root, 'src/main/extension/manifest.json'))).version, pom);
  assert.equal(JSON.parse(readFileSync(path.join(root, 'package.json'))).version, pom);
});
