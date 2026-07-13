window.XB_APPS_SCRIPT_URL = '';
window.XB_MUSIC_FILE = 'assets/ryazan-moya.mp3';
window.XB_CONTACT_PHONE = '79969662393';

(() => {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'clean-stripes.css?v=be8a2127';
  document.head.appendChild(css);
})();

window.addEventListener('DOMContentLoaded', () => {
  const heroCopy = document.querySelector('[data-hero-copy]');
  if (heroCopy) {
    heroCopy.textContent = 'Ждём вас на нашей тёплой деревенской свадьбе — во дворе дома, с музыкой, танцами и гуляньем от души.';
  }
});
