window.XB_APPS_SCRIPT_URL = '';
window.XB_MUSIC_FILE = 'assets/ryazan-moya.mp3';
window.XB_CONTACT_PHONE = '79969662393';

(() => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'design-system.css?v=925f31e9';
  link.dataset.weddingDesignSystem = 'true';
  document.head.appendChild(link);
})();

window.addEventListener('DOMContentLoaded', () => {
  const heroCopy = document.querySelector('[data-hero-copy]');
  if (heroCopy) {
    heroCopy.textContent = 'Ждём вас на нашей тёплой деревенской свадьбе — во дворе дома, с музыкой, танцами и гуляньем от души.';
  }

  const player = document.querySelector('[data-player]');
  const countdown = document.querySelector('.countdown-section');
  const countFrame = countdown?.querySelector('.count-frame');
  if (player && countdown && countFrame && !player.closest('.countdown-music')) {
    const holder = document.createElement('div');
    holder.className = 'countdown-music';
    holder.setAttribute('aria-label', 'Музыкальный плеер');
    holder.appendChild(player);
    countFrame.insertAdjacentElement('afterend', holder);
  }
});
