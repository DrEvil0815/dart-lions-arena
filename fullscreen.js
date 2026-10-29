/* Dart Lions Trainings-Arena – Fullscreen management */
(() => {
  'use strict';
  const toggle = document.getElementById('fullscreen-toggle');
  const hint = document.getElementById('fullscreen-hint');
  if (!toggle || !hint) return;
  const sync = () => {
    const active = !!document.fullscreenElement;
    toggle.textContent = active ? '⛶ VOLLBILD BEENDEN' : '⛶ VOLLBILD';
    toggle.setAttribute('aria-label', active ? 'Vollbild beenden' : 'Vollbild einschalten');
    hint.hidden = !active;
  };
  async function changeFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    } catch (error) {
      console.warn('Vollbild konnte nicht gestartet werden:', error);
    }
    sync();
  }
  toggle.addEventListener('click', changeFullscreen);
  document.addEventListener('fullscreenchange', sync);
  // Browsers require a user gesture. Enter fullscreen when selecting a mode,
  // never automatically on page load. The header button is always available.
  const choice = document.getElementById('choice-screen');
  if (choice) choice.addEventListener('click', event => {
    if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
    const option = event.target.closest('button');
    if (!option || option.disabled) return;
    document.documentElement.requestFullscreen().catch(error => console.warn('Vollbild nicht verfügbar:', error));
  }, {capture:true});
  sync();
})();
