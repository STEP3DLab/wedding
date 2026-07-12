const SPREADSHEET_ID = '1WJh4UdoD6LaBRhJMxz3LY0Z52xZ6vIe-lYDIfLXcCMY';
const SHEETS = { guests: 'Гости', scenarios: 'Сценарии', responses: 'Ответы', settings: 'Настройки' };
const DEFAULT_COPY = 'Ждём вас 25 июля 2026 года в селе Ермо-Николаевка. Сбор гостей — в 15:00. Праздник пройдёт во дворе дома.';

function book_() { return SpreadsheetApp.openById(SPREADSHEET_ID); }

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Свадебный сайт')
    .addItem('Проверить структуру', 'setupWeddingWorkbook')
    .addItem('Обновить ссылки гостей', 'refreshGuestLinks')
    .addToUi();
}

function setupWeddingWorkbook() {
  const ss = book_();
  ensure_(ss, SHEETS.guests, ['id','Обращение','Имя','Сценарий','Именное (override)','Венчание (override)','Продолжение (override)','Ночёвка (override)','Персональный текст','Активно','Ссылка','Кому отправлено','Статус рассылки','Комментарий']);
  ensure_(ss, SHEETS.scenarios, ['scenario','Описание','Именное','Показывать венчание','Показывать продолжение','Показывать ночёвку']);
  ensure_(ss, SHEETS.responses, ['Дата и время','id','Сценарий','Обращение','Гости','25 июля','Венчание 24 июля','Ночёвка','Комментарий','Источник']);
  ensure_(ss, SHEETS.settings, ['Ключ','Значение','Описание']);
  refreshGuestLinks();
  SpreadsheetApp.getUi().alert('Структура таблицы проверена.');
}

function ensure_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEETS.guests || e.range.getRow() < 2) return;
  if ([1, 4, 10].indexOf(e.range.getColumn()) === -1) return;
  updateLink_(sheet, e.range.getRow());
}

function refreshGuestLinks() {
  const sheet = book_().getSheetByName(SHEETS.guests);
  if (!sheet || sheet.getLastRow() < 2) return;
  for (let row = 2; row <= sheet.getLastRow(); row++) updateLink_(sheet, row);
}

function updateLink_(sheet, row) {
  const id = String(sheet.getRange(row, 1).getDisplayValue() || '').trim();
  const active = String(sheet.getRange(row, 10).getDisplayValue() || 'Да').trim();
  const base = setting_('base_url') || 'https://step3dlab.github.io/wedding/';
  const cell = sheet.getRange(row, 11);
  if (!id || !yes_(active)) return cell.clearContent();
  cell.setValue(base + (base.includes('?') ? '&' : '?') + 'guest=' + encodeURIComponent(id));
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (String(p.action || '') === 'guest') {
    const guest = guest_(String(p.id || '').trim());
    return output_(guest ? {ok:true, guest:guest} : {ok:false, error:'guest_not_found'}, p.callback);
  }
  return output_({ok:true, service:'wedding-25-07', timestamp:new Date().toISOString()}, p.callback);
}

function doPost(e) {
  try {
    const p = payload_(e);
    const sheet = ensure_(book_(), SHEETS.responses, ['Дата и время','id','Сценарий','Обращение','Гости','25 июля','Венчание 24 июля','Ночёвка','Комментарий','Источник']);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet.appendRow([new Date(), safe_(p.id), safe_(p.scenario), safe_(p.salutation), safe_(p.guestName), safe_(p.mainAttendance), safe_(p.church), safe_(p.stay), safe_(p.comment), safe_(p.source)]);
    } finally { lock.releaseLock(); }
    return output_({ok:true});
  } catch (err) { return output_({ok:false, error:String(err && err.message || err)}); }
}

function payload_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (_) {}
  }
  return (e && e.parameter) || {};
}

function guest_(id) {
  if (!id) return null;
  const sheet = book_().getSheetByName(SHEETS.guests);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const row = objects_(sheet).find(x => String(x.id || '').trim() === id);
  if (!row || !yes_(row['Активно'] || 'Да')) return null;
  const sc = scenario_(row['Сценарий']);
  return {
    id: String(row.id || '').trim(),
    salutation: String(row['Обращение'] || 'Дорогие').trim(),
    name: String(row['Имя'] || 'гости').trim(),
    scenario: String(row['Сценарий'] || 'general-home').trim(),
    named: override_(row['Именное (override)'], sc.named),
    showChurch: override_(row['Венчание (override)'], sc.showChurch),
    showAfterparty: override_(row['Продолжение (override)'], sc.showAfterparty),
    showStay: override_(row['Ночёвка (override)'], sc.showStay),
    heroCopy: String(row['Персональный текст'] || DEFAULT_COPY).trim()
  };
}

function scenario_(name) {
  const fallback = {named:false, showChurch:true, showAfterparty:true, showStay:false};
  const sheet = book_().getSheetByName(SHEETS.scenarios);
  if (!sheet || sheet.getLastRow() < 2) return fallback;
  const row = objects_(sheet).find(x => String(x.scenario || '').trim() === String(name || '').trim());
  if (!row) return fallback;
  return {named:yes_(row['Именное']), showChurch:yes_(row['Показывать венчание']), showAfterparty:yes_(row['Показывать продолжение']), showStay:yes_(row['Показывать ночёвку'])};
}

function override_(value, fallback) {
  const text = String(value || '').trim().toLowerCase();
  return !text || text === 'по сценарию' ? Boolean(fallback) : yes_(text);
}

function objects_(sheet) {
  const rows = sheet.getDataRange().getDisplayValues();
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).filter(r => r.some(Boolean)).map(r => {
    const o = {}; headers.forEach((h, i) => o[h] = r[i]); return o;
  });
}

function setting_(key) {
  const sheet = book_().getSheetByName(SHEETS.settings);
  if (!sheet || sheet.getLastRow() < 2) return '';
  const row = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues().find(r => String(r[0]).trim() === key);
  return row ? String(row[1] || '').trim() : '';
}

function yes_(value) { return ['да','yes','true','1','on'].includes(String(value || '').trim().toLowerCase()); }
function safe_(value) { return value == null ? '' : String(value).slice(0, 5000); }
function output_(data, callback) {
  const json = JSON.stringify(data);
  const cb = String(callback || '').replace(/[^a-zA-Z0-9_.$]/g, '');
  return ContentService.createTextOutput(cb ? cb + '(' + json + ')' : json)
    .setMimeType(cb ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}
