'use strict';
const statusElement = document.querySelector('#status');
let busy = false;
async function send(action, seconds) {
  if (busy) return;
  busy = true;
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => { button.disabled = true; });
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || new URL(tab.url).origin !== 'https://playnow.pl') {
      throw new Error('Otwórz kartę playnow.pl i uruchom program.');
    }
    let response;
    try {
      response = await browser.tabs.sendMessage(tab.id, { type: 'PLAYNOW_CONTROL', action, seconds }, { frameId: 0 });
    } catch {
      throw new Error('Odśwież kartę PLAY NOW po włączeniu dodatku. Sprawdź jego dostęp do playnow.pl.');
    }
    if (!response) throw new Error('Odtwarzacz nie odpowiedział. Odśwież kartę PLAY NOW.');
    statusElement.textContent = response.text;
    statusElement.dataset.error = String(!response.ok);
  } catch (error) {
    statusElement.textContent = error.message;
    statusElement.dataset.error = 'true';
  } finally {
    busy = false;
    buttons.forEach(button => { button.disabled = false; });
  }
}
document.querySelectorAll('[data-seconds]').forEach(button => {
  button.addEventListener('click', () => { void send('seek', Number(button.dataset.seconds)); });
});
document.querySelector('#toggle').addEventListener('click', () => { void send('toggle'); });
document.querySelector('#custom').addEventListener('submit', event => {
  event.preventDefault();
  const amount = document.querySelector('#seconds').valueAsNumber;
  const direction = Number(event.submitter?.value || 1);
  if (!Number.isInteger(amount) || amount < 1 || amount > 900) {
    statusElement.textContent = 'Wpisz liczbę całkowitą od 1 do 900.';
    statusElement.dataset.error = 'true';
    return;
  }
  void send('seek', amount * direction);
});
void send('status');
