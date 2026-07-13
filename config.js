window.XB_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxo2WLL2cuTmiw3mggZietnPBfLdrCDoUys3cZ88zPWVSrb2ff8iGM5x74e3_rV2ZUt/exec';
window.XB_MUSIC_FILE = 'assets/ryazan-moya.mp3';
window.XB_CONTACT_PHONE = '79969662393';

(() => {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'clean-stripes.css?v=62046c6c';
  document.head.appendChild(css);

  const formHelp = document.querySelector('#rsvpForm .form-help');
  if (formHelp) formHelp.remove();
})();

window.addEventListener('DOMContentLoaded', () => {
  const heroCopy = document.querySelector('[data-hero-copy]');
  if (heroCopy) {
    heroCopy.textContent = 'Ждём вас на нашей тёплой деревенской свадьбе — во дворе дома, с музыкой, танцами и гуляньем от души.';
  }

  const churchOption = document.querySelector('[data-rsvp-church] span');
  if (churchOption) churchOption.textContent = 'Будем на венчании 24 июля';

  const stayOption = document.querySelector('[data-rsvp-stay] span');
  if (stayOption) stayOption.textContent = 'Нужна ночёвка в Лукино';
});
