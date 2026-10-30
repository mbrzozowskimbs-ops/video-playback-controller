(() => {
  'use strict';
  const controls = globalThis.PlayNowControls;
  let feedback;
  let feedbackTimer;

  function showFeedback(text) {
    if (!feedback?.isConnected) {
      const host = document.createElement('div');
      const shadow = host.attachShadow({ mode: 'closed' });
      const style = document.createElement('style');
      style.textContent = ':host{all:initial;position:fixed;top:100px;right:24px;z-index:2147483647;pointer-events:none}div{font:600 16px system-ui;color:white;background:#20202a;padding:12px 18px;border:1px solid #777;border-radius:10px}';
      feedback = document.createElement('div');
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      shadow.append(style, feedback);
      (document.fullscreenElement || document.documentElement).append(host);
      feedback.hostElement = host;
    }
    feedback.textContent = text;
    feedback.hostElement.hidden = false;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => { feedback.hostElement.hidden = true; }, 1800);
  }

  async function perform(message) {
    const video = controls.pickVideo(document.querySelectorAll('video'));
    if (!video) return { ok: false, text: 'Najpierw uruchom program w PLAY NOW.' };
    try {
      let text;
      if (message.action === 'seek') {
        const change = controls.seek(video, message.seconds);
        text = `${change >= 0 ? '+' : '−'}${Math.abs(change).toFixed(0)} s`;
      } else if (message.action === 'toggle') {
        if (video.paused) { await video.play(); text = 'Odtwarzanie'; }
        else { video.pause(); text = 'Pauza'; }
      } else if (message.action === 'status') {
        return { ok: true, text: video.paused ? 'Program jest na pauzie.' : 'Program jest odtwarzany.' };
      } else return { ok: false, text: 'Nieznane polecenie.' };
      showFeedback(text);
      return { ok: true, text };
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Nie udało się wykonać polecenia.';
      showFeedback(text);
      return { ok: false, text };
    }
  }

  browser.runtime.onMessage.addListener((message, sender) => {
    if (sender.id !== browser.runtime.id || message?.type !== 'PLAYNOW_CONTROL') return;
    return perform(message);
  });

  document.addEventListener('keydown', event => {
    if (!event.isTrusted || !event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.composedPath().some(el => el instanceof HTMLElement && (
      el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
    ))) return;
    const seconds = { ArrowLeft: -10, ArrowRight: 10, ArrowDown: -60, ArrowUp: 60 }[event.key];
    if (seconds === undefined && event.code !== 'Space') return;
    if (!controls.pickVideo(document.querySelectorAll('video'))) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void perform(seconds === undefined ? { action: 'toggle' } : { action: 'seek', seconds });
  }, true);
})();
