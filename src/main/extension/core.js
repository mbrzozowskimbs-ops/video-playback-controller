/* Shared only within the extension's isolated content-script environment. */
(() => {
  'use strict';
  function pickVideo(videos) {
    return Array.from(videos)
      .filter(v => {
        const rect = v.getBoundingClientRect();
        return v.readyState >= 1 && rect.width > 0 && rect.height > 0;
      })
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return br.width * br.height - ar.width * ar.height;
      })[0] || null;
  }

  function seek(video, seconds) {
    if (!Number.isFinite(seconds) || seconds === 0 || Math.abs(seconds) > 900) {
      throw new Error('Nieprawidłowy skok. Wybierz od 1 do 900 sekund.');
    }
    if (!video.seekable.length || !Number.isFinite(video.currentTime)) {
      throw new Error('Materiał nie jest jeszcze dostępny do przewijania.');
    }
    const ranges = Array.from({ length: video.seekable.length }, (_, i) => [
      Math.max(0, video.seekable.start(i)), video.seekable.end(i),
    ]).filter(([start, end]) => Number.isFinite(start) && end >= start);
    if (!ranges.length) throw new Error('Materiał nie jest jeszcze dostępny do przewijania.');
    let target = Math.max(ranges[0][0], Math.min(
      video.currentTime + seconds, ranges[ranges.length - 1][1],
    ));
    // PLAY NOW may use Infinity or Number.MAX_VALUE for a continuing stream.
    if (Number.isFinite(video.duration)) target = Math.min(target, video.duration);
    if (!ranges.some(([start, end]) => target >= start && target <= end)) {
      const boundary = seconds > 0
        ? ranges.find(([start]) => start > target)?.[0]
        : ranges.slice().reverse().find(([, end]) => end < target)?.[1];
      if (boundary !== undefined) target = boundary;
    }
    const before = video.currentTime;
    video.currentTime = target;
    return video.currentTime - before;
  }

  const api = Object.freeze({ pickVideo, seek });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.PlayNowControls = api;
})();
