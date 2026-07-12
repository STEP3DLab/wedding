window.XB_APPS_SCRIPT_URL = '';
window.XB_MUSIC_FILE = 'assets/ryazan-moya.mp3';
window.XB_CONTACT_PHONE = '79969662393';

(() => {
  const existing = document.querySelector('link[data-wedding-redesign]');
  if (existing) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'redesign.css?v=cb89194c';
  link.dataset.weddingRedesign = 'true';
  document.head.appendChild(link);
})();

window.addEventListener('DOMContentLoaded', () => {
  const heroCopy = document.querySelector('[data-hero-copy]');
  if (heroCopy) {
    heroCopy.textContent = 'Ждём вас на нашей тёплой деревенской свадьбе — во дворе дома, с музыкой, танцами и гуляньем от души.';
  }
});
