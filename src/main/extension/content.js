(() => {
  'use strict';
  const controls = globalThis.PlayNowControls;
  let feedback;
  let feedbackTimer;
  let panel;
  let panelTimer;
  let panelHovered = false;
  let panelFrame = 0;

  function mount(host) {
    const parent = document.fullscreenElement || document.documentElement;
    if (host.parentNode !== parent) parent.append(host);
  }

  function hidePanel() {
    panelHovered = false;
    if (panel) panel.host.hidden = true;
  }

  // Restarts the hide countdown; the bar stays visible while the pointer is over it.
  function scheduleHidePanel() {
    clearTimeout(panelTimer);
    if (!panelHovered) panelTimer = setTimeout(hidePanel, 2500);
  }

  function createPanel() {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = ':host{all:initial;position:fixed;z-index:2147483647;transform:translateX(-50%)}'
      + 'div{display:flex;gap:6px;padding:6px;background:rgba(20,20,28,.8);border-radius:12px}'
      + 'button{font:600 15px system-ui;color:white;background:transparent;border:1px solid #777;border-radius:8px;padding:8px 12px;cursor:pointer}'
      + 'button:hover,button:focus-visible{background:#3a3a48}';
    const bar = document.createElement('div');
    for (const [label, message] of [
      ['−1 min', { action: 'seek', seconds: -60 }],
      ['−10 s', { action: 'seek', seconds: -10 }],
      ['⏯', { action: 'toggle' }],
      ['+10 s', { action: 'seek', seconds: 10 }],
      ['+1 min', { action: 'seek', seconds: 60 }],
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', event => {
        event.stopPropagation();
        scheduleHidePanel();
        void perform(message);
      });
      bar.append(button);
    }
    // Keep clicks and presses from reaching the player underneath.
    for (const type of ['pointerdown', 'mousedown', 'dblclick']) {
      bar.addEventListener(type, event => event.stopPropagation());
    }
    bar.addEventListener('pointerenter', () => { panelHovered = true; scheduleHidePanel(); });
    bar.addEventListener('pointerleave', () => { panelHovered = false; scheduleHidePanel(); });
    shadow.append(style, bar);
    return { host };
  }

  function showPanel(x, y) {
    const video = controls.pickVideo(document.querySelectorAll('video'));
    const rect = video?.getBoundingClientRect();
    if (!rect || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return;
    panel ??= createPanel();
    mount(panel.host);
    panel.host.style.left = `${rect.left + rect.width / 2}px`;
    // Above the player's own bottom control bar.
    panel.host.style.top = `${Math.max(rect.top + 8, rect.bottom - 140)}px`;
    panel.host.hidden = false;
    scheduleHidePanel();
  }

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
      feedback.hostElement = host;
    }
    mount(feedback.hostElement);
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

  document.addEventListener('mousemove', event => {
    if (panelFrame) return;
    const { clientX, clientY } = event;
    panelFrame = requestAnimationFrame(() => {
      panelFrame = 0;
      showPanel(clientX, clientY);
    });
  }, { capture: true, passive: true });

  document.addEventListener('fullscreenchange', hidePanel);
})();
