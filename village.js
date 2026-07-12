(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const params = new URLSearchParams(window.location.search);
  const guestId = String(params.get('guest') || params.get('id') || '').trim();
  const apiUrl = String(window.XB_APPS_SCRIPT_URL || '').trim();
  const musicFile = String(window.XB_MUSIC_FILE || 'assets/ryazan-moya.mp3').trim();
  const phone = String(window.XB_CONTACT_PHONE || '79969662393').replace(/\D/g, '');

  const scenarios = {
    'named-home': { named: true, church: true, afterparty: true, stay: false },
    'named-stay': { named: true, church: true, afterparty: true, stay: true },
    'general-home': { named: false, church: true, afterparty: true, stay: false },
    'general-stay': { named: false, church: true, afterparty: true, stay: true },
    'main-only': { named: false, church: false, afterparty: false, stay: false }
  };

  const fallbacks = {
    'evgeniy-larisa': { id: 'evgeniy-larisa', salutation: 'Дорогие', name: 'Евгений и Лариса', scenario: 'named-home' },
    'aleksey-natalya': { id: 'aleksey-natalya', salutation: 'Дорогие', name: 'Алексей и Наталья', scenario: 'named-home' },
    family: { id: 'family', salutation: 'Дорогая', name: 'семья', scenario: 'named-home' },
    'guests-1': { id: 'guests-1', salutation: 'Дорогие', name: 'гости', scenario: 'general-home' },
    'guests-2': { id: 'guests-2', salutation: 'Дорогие', name: 'гости', scenario: 'general-stay' }
  };

  const defaultHero = 'Ждём вас 25 июля 2026 года в селе Ермо‑Николаевка. Сбор гостей — в 15:00. Праздник пройдёт во дворе дома.';

  function polishStaticContent() {
    const setTitle = (selector, value) => {
      const node = $(selector);
      if (node) node.textContent = value;
    };

    setTitle('.countdown-section .title', 'Осталось до свадьбы');
    setTitle('#main-day .title', 'Свадьба — 25 июля');
    setTitle('#church .title', 'Венчание — 24 июля');
    setTitle('#continuation .title', 'Продолжение — 26 июля');
    setTitle('#dresscode .title', 'Дресс-код');
    setTitle('#bring .title', 'Что взять с собой');
    setTitle('#location .title', 'Адрес и связь');
    setTitle('.gifts-section .title', 'Подарки');
    setTitle('#faq .title', 'Полезно знать');
    setTitle('#rsvp .title', 'Подтвердить участие');

    const firstMenu = $('.menu a[href="#main-day"]');
    if (firstMenu) firstMenu.textContent = 'Свадьба';

    const dressCard = $('#dresscode .simple-card');
    dressCard?.classList.remove('daisy-card');

    const weatherNote = $('#dresscode .note');
    if (weatherNote && !weatherNote.querySelector('svg')) {
      const text = weatherNote.textContent.trim();
      weatherNote.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-sun"></use></svg><span>${text}</span>`;
    }

    const facts = $$('.hero-facts .fact');
    if (facts[0]) facts[0].querySelector('strong').innerHTML = '<span>25 июля</span><span>2026</span>';
    if (facts[1]) facts[1].querySelector('strong').innerHTML = '<span>Ермо-</span><span>Николаевка</span>';
    if (facts[2]) facts[2].querySelector('strong').innerHTML = '<span>Во дворе</span><span>дома</span>';

    const churchLead = $('#church .lead-text');
    if (churchLead) churchLead.textContent = 'Если вы захотите присоединиться к венчанию, будем рады видеть вас рядом.';
    const churchCopy = $('#church .body-copy');
    if (churchCopy) churchCopy.textContent = 'Венчание состоится в храме села Высокие Поляны. Точное время сообщим позже.';

    const continuationCopy = $('#continuation .body-copy');
    if (continuationCopy) continuationCopy.textContent = '26 июля можно снова приехать во двор. Общего времени сбора нет — приезжайте, когда вам удобно.';

    const staySection = $('[data-section-stay]');
    if (staySection) {
      const wasHidden = staySection.hidden;
      staySection.innerHTML = `
        <div class="simple-card">
          <h2 class="title">Где остановиться на ночь</h2>
          <p class="stay-address">Деревня Лукино</p>
          <p class="body-copy">Рязанская область, рядом с озером Святое. Точный адрес дома, распределение мест и время заселения сообщим лично.</p>
          <div class="stay-transfer">
            <svg class="icon" aria-hidden="true"><use href="#i-route"></use></svg>
            <p><strong>Вечером будет организован трансфер до места ночёвки.</strong> Машины можно оставить во дворе дома в Ермо‑Николаевке.</p>
          </div>
          <ul class="plain-list">
            <li>двухэтажный деревянный дом для размещения до 8 гостей;</li>
            <li>спальни, кухня-гостиная и две ванные комнаты;</li>
            <li>постельное бельё, полотенца, Wi‑Fi и кондиционеры;</li>
            <li>парковка, веранда и мангальная зона.</li>
          </ul>
          <p class="stay-note">Просим соблюдать тишину с 22:00 до 9:00. В доме нельзя курить, использовать открытый огонь и пиротехнику.</p>
        </div>`;
      staySection.hidden = wasHidden;
    }
  }

  const asBool = (value, fallback) => {
    if (value === undefined || value === null || value === '' || value === 'По сценарию') return fallback;
    if (typeof value === 'boolean') return value;
    const normalized = String(value).trim().toLowerCase();
    if (['да', 'true', '1', 'yes', 'on', 'lukino'].includes(normalized)) return true;
    if (['нет', 'false', '0', 'no', 'off'].includes(normalized)) return false;
    return fallback;
  };

  const normalizeInvite = (raw = {}) => {
    const scenarioName = String(raw.scenario || raw['Сценарий'] || 'general-home').trim();
    const scenario = scenarios[scenarioName] || scenarios['general-home'];
    return {
      id: String(raw.id || raw.ID || guestId || 'guests-1').trim(),
      salutation: String(raw.salutation || raw['Обращение'] || 'Дорогие').trim(),
      name: String(raw.name || raw['Имя'] || 'гости').trim(),
      scenario: scenarioName,
      named: asBool(raw.named ?? raw['Именное'], scenario.named),
      church: asBool(raw.showChurch ?? raw.church ?? raw['Показывать венчание'], scenario.church),
      afterparty: asBool(raw.showAfterparty ?? raw.afterparty ?? raw['Показывать продолжение'], scenario.afterparty),
      stay: asBool(raw.showStay ?? raw.stay ?? raw['Показывать ночёвку'], scenario.stay),
      heroText: String(raw.heroCopy || raw.heroText || raw['Персональный текст'] || defaultHero).trim(),
      active: asBool(raw.active ?? raw['Активно'], true)
    };
  };

  const applyOverrides = (data) => {
    const next = { ...data };
    if (params.has('church')) next.church = asBool(params.get('church'), next.church);
    if (params.has('after')) next.afterparty = asBool(params.get('after'), next.afterparty);
    if (params.has('stay')) next.stay = params.get('stay') === 'lukino' || asBool(params.get('stay'), next.stay);
    return next;
  };

  let invite = applyOverrides(normalizeInvite(fallbacks[guestId] || { id: guestId || 'guests-1' }));

  const setVisible = (selector, visible) => {
    $$(selector).forEach((node) => { node.hidden = !visible; });
  };

  function applyInvite(raw = invite) {
    invite = applyOverrides(normalizeInvite(raw));
    if (!invite.active) invite = applyOverrides(normalizeInvite({ scenario: 'general-home' }));

    const salutation = $('[data-salutation]');
    const name = $('[data-guest-name]');
    const hero = $('[data-hero-copy]');
    if (salutation) salutation.textContent = invite.salutation;
    if (name) name.textContent = invite.name;
    if (hero) hero.textContent = invite.heroText || defaultHero;
    document.title = invite.named ? `ХВ • ${invite.name}` : 'Свадьба Христины и Владимира';

    setVisible('[data-section-church], [data-menu-church], [data-rsvp-church]', invite.church);
    setVisible('[data-section-afterparty], [data-menu-afterparty]', invite.afterparty);
    setVisible('[data-section-stay], [data-menu-stay], [data-rsvp-stay]', invite.stay);

    const wrap = $('#guestFieldWrap');
    const input = $('#guestNameField');
    if (invite.named) {
      if (wrap) wrap.hidden = true;
      if (input) input.value = invite.name;
    } else {
      if (wrap) wrap.hidden = false;
      if (input) input.value = '';
    }
  }

  function loadGuestFromSheet() {
    if (!apiUrl || !guestId) return;
    const callback = `weddingGuest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement('script');
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      delete window[callback];
      script.remove();
    };
    window[callback] = (payload) => {
      if (payload?.ok !== false && payload?.guest) applyInvite(payload.guest);
      cleanup();
    };
    script.onerror = cleanup;
    script.src = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}action=guest&id=${encodeURIComponent(guestId)}&callback=${encodeURIComponent(callback)}`;
    document.head.appendChild(script);
    timer = setTimeout(cleanup, 6500);
  }

  function initCountdown() {
    const date = new Date('2026-07-25T15:00:00+03:00');
    const tick = () => {
      const diff = Math.max(0, date.getTime() - Date.now());
      const put = (selector, value) => { const node = $(selector); if (node) node.textContent = value; };
      put('[data-days]', String(Math.floor(diff / 86400000)));
      put('[data-hours]', String(Math.floor(diff / 3600000) % 24).padStart(2, '0'));
      put('[data-minutes]', String(Math.floor(diff / 60000) % 60).padStart(2, '0'));
      put('[data-seconds]', String(Math.floor(diff / 1000) % 60).padStart(2, '0'));
    };
    tick();
    setInterval(tick, 1000);
  }

  function initMenu() {
    const button = $('.menu-button');
    const menu = $('.menu');
    if (!button || !menu) return;
    const setOpen = (open) => {
      document.body.classList.toggle('menu-open', open);
      menu.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    };
    button.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    $$('a', menu).forEach((link) => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
    document.addEventListener('click', (event) => {
      if (menu.classList.contains('is-open') && !menu.contains(event.target) && !button.contains(event.target)) setOpen(false);
    });
  }

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };

  function initMusic() {
    const card = $('[data-player]');
    if (!card) return;
    const audio = $('audio', card);
    const button = $('.music-button', card);
    const progress = $('.music-progress', card);
    const current = $('.music-current', card);
    const duration = $('.music-duration', card);
    const status = $('.music-status', card);
    if (!audio || !button || !progress) return;
    audio.src = musicFile;

    const sync = () => {
      const value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      progress.value = String(value);
      progress.style.setProperty('--progress', `${value}%`);
      if (current) current.textContent = formatTime(audio.currentTime);
      if (duration) duration.textContent = formatTime(audio.duration);
    };
    audio.addEventListener('loadedmetadata', () => { sync(); if (status) status.textContent = 'Нажмите кнопку, чтобы включить песню.'; });
    audio.addEventListener('timeupdate', sync);
    audio.addEventListener('play', () => card.classList.add('is-playing'));
    audio.addEventListener('pause', () => card.classList.remove('is-playing'));
    audio.addEventListener('ended', () => { card.classList.remove('is-playing'); sync(); });
    audio.addEventListener('error', () => { if (status) status.textContent = 'Песня временно недоступна. Попробуйте открыть страницу позднее.'; });
    button.addEventListener('click', async () => {
      try { if (audio.paused) await audio.play(); else audio.pause(); }
      catch { if (status) status.textContent = 'Не удалось запустить песню. Попробуйте ещё раз.'; }
    });
    progress.addEventListener('input', () => { if (audio.duration) audio.currentTime = (Number(progress.value) / 100) * audio.duration; });
  }

  function formPayload() {
    const input = $('#guestNameField');
    const guestName = invite.named ? invite.name : String(input?.value || '').trim();
    return {
      timestamp: new Date().toISOString(),
      id: invite.id,
      scenario: invite.scenario,
      salutation: invite.salutation,
      guestName,
      mainAttendance: $('input[name="day25"]:checked')?.value || 'Будем',
      church: invite.church ? ($('#churchCheck')?.checked ? 'Да' : 'Нет') : 'Не показывалось',
      stay: invite.stay ? ($('#stayCheck')?.checked ? 'Да' : 'Нет') : 'Не предусмотрено',
      comment: String($('#commentField')?.value || '').trim(),
      source: window.location.href
    };
  }

  function validate(payload) {
    const input = $('#guestNameField');
    const error = $('#guestError');
    if (!invite.named && !payload.guestName) {
      input?.setAttribute('aria-invalid', 'true');
      if (error) error.textContent = 'Пожалуйста, укажите имя и фамилию.';
      input?.focus();
      return false;
    }
    input?.removeAttribute('aria-invalid');
    if (error) error.textContent = '';
    return true;
  }

  function whatsappText(payload) {
    const lines = [
      'Здравствуйте! Подтверждаем участие в свадьбе.',
      `Гости: ${payload.guestName}.`,
      `25 июля: ${payload.mainAttendance}.`
    ];
    if (invite.church) lines.push(`Венчание 24 июля: ${payload.church}.`);
    if (invite.stay) lines.push(`Ночёвка в Лукино: ${payload.stay}.`);
    if (payload.comment) lines.push(`Комментарий: ${payload.comment}`);
    return lines.join('\n');
  }

  async function sendToSheet(payload) {
    if (!apiUrl) return false;
    await fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return true;
  }

  function initRsvp() {
    const form = $('#rsvpForm');
    const status = $('#formStatus');
    const button = $('.submit-button');
    if (!form || !status || !button) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = formPayload();
      if (!validate(payload)) return;
      button.disabled = true;
      status.textContent = 'Отправляем ответ…';
      try {
        localStorage.setItem(`wedding_rsvp_${guestId || 'general'}`, JSON.stringify(payload));
        if (await sendToSheet(payload)) {
          status.textContent = 'Спасибо! Ответ отправлен.';
        } else {
          status.textContent = 'Открываем WhatsApp…';
          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(whatsappText(payload))}`, '_blank', 'noopener');
        }
      } catch {
        status.textContent = 'Открываем WhatsApp…';
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(whatsappText(payload))}`, '_blank', 'noopener');
      } finally {
        button.disabled = false;
      }
    });
  }

  polishStaticContent();
  applyInvite(invite);
  loadGuestFromSheet();
  initCountdown();
  initMenu();
  initMusic();
  initRsvp();
})();
