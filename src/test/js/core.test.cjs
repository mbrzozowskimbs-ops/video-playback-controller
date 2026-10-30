const { test } = require('node:test');
const assert = require('node:assert/strict');
const controls = require('../../main/extension/core.js');
const video = (time, duration, ranges) => ({
  currentTime: time, duration,
  seekable: { length: ranges.length, start: i => ranges[i][0], end: i => ranges[i][1] },
});

test('przewija na pauzie i ogranicza cel do dostępnego zakresu', () => {
  const v = { ...video(15, 120, [[10, 120]]), paused: true };
  controls.seek(v, -60);
  assert.equal(v.currentTime, 10);
  controls.seek(v, 900);
  assert.equal(v.currentTime, 120);
});
test('obsługuje PLAY NOW z pozornie nieskończoną długością', () => {
  for (const duration of [Infinity, Number.MAX_VALUE]) {
    const v = video(21, duration, [[0, Number.MAX_VALUE]]);
    controls.seek(v, 300);
    assert.equal(v.currentTime, 321);
  }
});
test('nie ustawia pozycji wewnątrz niedostępnej przerwy', () => {
  const v = video(15, 100, [[0, 20], [40, 100]]);
  controls.seek(v, 15);
  assert.equal(v.currentTime, 40);
  controls.seek(v, -10);
  assert.equal(v.currentTime, 20);
});
test('odrzuca nieprawidłowe skoki i brak dostępnego materiału', () => {
  const v = video(20, 120, [[0, 120]]);
  for (const value of [NaN, Infinity, '10', 901, 0]) {
    assert.throws(() => controls.seek(v, value), /Nieprawidłowy/);
    assert.equal(v.currentTime, 20);
  }
  assert.throws(() => controls.seek(video(0, NaN, []), 10), /dostępny/);
});
test('wybiera widoczny główny odtwarzacz i pomija ukryte wideo', () => {
  const hidden = { readyState: 4, paused: false, getBoundingClientRect: () => ({ width: 0, height: 0 }) };
  const main = { readyState: 4, paused: true, getBoundingClientRect: () => ({ width: 1280, height: 720 }) };
  const small = { readyState: 4, paused: false, getBoundingClientRect: () => ({ width: 160, height: 90 }) };
  assert.equal(controls.pickVideo([hidden, small, main]), main);
  assert.equal(controls.pickVideo([hidden]), null);
});
