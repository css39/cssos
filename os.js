'use strict';
// =====================================================================
//  CSSOS — rendszermag
//  Zárolás, kezdőképernyő, alkalmazáskezelés, vezérlőközpont, értesítések
// =====================================================================

// A rendszer neve — ha lesz végleges név, csak itt kell átírni.
const OS = { name: 'CSSOS', short: 'CSS', version: '3.3' };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = a => a[Math.floor(Math.random() * a.length)];
const pad = n => String(n).padStart(2, '0');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
// Szöveg csere csak változás esetén — így a böngészőnek nem kell feleslegesen újrarajzolni
function setText(sel, text) {
  const el = typeof sel === 'string' ? $(sel) : sel;
  if (el && el.textContent !== text) el.textContent = text;
}

// ---------- Tárolás (a telefon „memóriája”) ----------
const store = {
  get(k, d) {
    try { const v = localStorage.getItem('nova.' + k); return v === null ? d : JSON.parse(v); } catch { return d; }
  },
  set(k, v) {
    try { localStorage.setItem('nova.' + k, JSON.stringify(v)); return true; } catch { return false; }
  },
  clear() {
    try { Object.keys(localStorage).filter(k => k.startsWith('nova.')).forEach(k => localStorage.removeItem(k)); } catch {}
  },
};

// ---------- Beállítások ----------
const WALLPAPERS = [
  // 3.0 „mesh” hátterek: egymásba olvadó fényfoltok egy mély alapszínen
  // Éjfél (alapértelmezett)
  'radial-gradient(at 18% 12%,#6d4ae0 0,transparent 52%),radial-gradient(at 88% 28%,#1f8fff 0,transparent 46%),radial-gradient(at 30% 78%,#0fb5a8 0,transparent 42%),radial-gradient(at 85% 96%,#ff4f8b 0,transparent 48%),#0a0c22',
  // Naplemente
  'radial-gradient(at 12% 88%,#ff8a3d 0,transparent 55%),radial-gradient(at 86% 18%,#ff3d77 0,transparent 50%),radial-gradient(at 55% 50%,#9b2fd6 0,transparent 55%),#2a0a2e',
  // Erdő
  'radial-gradient(at 20% 20%,#2ee59d 0,transparent 45%),radial-gradient(at 90% 60%,#00a3a4 0,transparent 50%),radial-gradient(at 30% 95%,#b8f03b 0,transparent 35%),#06261d',
  // Grafit
  'radial-gradient(at 25% 15%,#3a4460 0,transparent 55%),radial-gradient(at 85% 85%,#262d40 0,transparent 55%),#0b0d13',
  // Homok
  'radial-gradient(at 20% 15%,#ffe2a8 0,transparent 55%),radial-gradient(at 85% 60%,#f58a5b 0,transparent 55%),radial-gradient(at 30% 95%,#e85d8a 0,transparent 45%),#d99a52',
  // Ultraviola
  'radial-gradient(at 15% 20%,#ff2fd6 0,transparent 42%),radial-gradient(at 85% 35%,#5b2bff 0,transparent 50%),radial-gradient(at 45% 90%,#00d1ff 0,transparent 40%),#12002b',
  // Élő háttérképek (lassan mozognak)
  'linear-gradient(120deg,#0f2027,#2c5364,#11998e,#38ef7d,#2c5364,#0f2027)',
  'linear-gradient(120deg,#ff512f,#dd2476,#7f53ac,#2a5298,#dd2476,#ff512f)',
  'linear-gradient(120deg,#120136,#4a00e0,#bf5af2,#ff375f,#4a00e0,#120136)',
  // Aurora: lassan hullámzó, világító színfelhők (a mozgó rétegeket a wow.js rajzolja)
  'radial-gradient(circle at 20% 25%,#7f53ac 0,transparent 45%),radial-gradient(circle at 85% 55%,#11998e 0,transparent 45%),radial-gradient(circle at 40% 90%,#2a5298 0,transparent 50%),#060816',
];
const LIVE_WALLS = new Set([6, 7, 8, 9]);
const AURORA = 9;
const ACCENTS = ['#0a84ff', '#34c759', '#ff9f0a', '#ff375f', '#bf5af2', '#64d2ff'];
const TEXT_SIZES = { small: 0.9, normal: 1, large: 1.15, xl: 1.3 };

const settings = Object.assign({
  wallpaper: 0, accent: 0, dark: true, deviceName: OS.short + ' Telefon', pin: '',
  volume: 60, keySound: true, notifSound: true, vibrate: true,
  textSize: 'normal', autoLock: 60, reduceMotion: false, battPct: false,
  showWidget: true, labels: true, preview: true, ring: true, botName: OS.short,
  // Kezdőképernyő
  iconShape: 'drop', iconSize: 'normal', columns: 4,
  // Zárolási képernyő
  lockStyle: 'normal', lockColor: 'white', lockSeconds: false, ownerMsg: '',
  // Idő és dátum
  clock24: true,
  // Akkumulátor
  saver: false, autoSaver: true,
  // Kijelző és kisegítő lehetőségek
  eyeCare: false, eyeCareLevel: 40, boldText: false, colorFilter: 'none',
  // Automatikus sötét mód: este 19 és reggel 7 között
  autoDark: false,
  // Nyelv (az i18n.js olvassa induláskor)
  lang: LANG,
  // A felhasználó neve (a köszönésben) — a beállító varázsló kérdezi meg
  userName: '',
  // 3.1 gesztusok
  gestureNav: true, quickMenu: true, radial: true, dblSleep: true,
  // Effektek: auto = telefonon gyors, gépen látványos
  effects: 'auto',
}, store.get('settings', {}));
// A régi „Nova” alapnevek cseréje az új névre (a saját nevet nem bántjuk)
if (settings.deviceName === 'Nova Telefon') settings.deviceName = OS.short + ' Telefon';
if (settings.botName === 'Nova') settings.botName = OS.short;
const cc = Object.assign({ wifi: true, bt: true, data: true, airplane: false, dnd: false, bright: 100 }, store.get('cc', {}));

const ICON_SHAPES = { drop: '50% 50% 50% 18%', circle: '50%', square: '24%', leaf: '50% 14% 50% 14%' };
const ICON_SIZES = { small: 52, normal: 60, large: 68 };
const LOCK_WEIGHTS = { thin: 200, normal: 600, bold: 800 };
const COLOR_FILTERS = { none: 'none', gray: 'grayscale(1)', invert: 'invert(1) hue-rotate(180deg)', contrast: 'contrast(1.35) saturate(1.2)' };

const screenEl = $('#screen');
const lockEl = $('#lock');
const winEl = $('#app-window');
const contentEl = $('#app-content');

function saveSettings() { store.set('settings', settings); applySettings(); }
// Gyors effektek: homályosítás nélkül, könnyített háttérrel. Telefonon (Android, érintőképernyő)
// automatikusan ez megy, mert a homályosítás a gyengébb grafikus chipeket nagyon megterheli.
// Effektszintek: high = látványos (teljes üveg), mid = sima (üveg elmosás nélkül), fast = gyors.
// Automatikus: telefonon „sima”, mert a teljes üveg a középkategóriás telefonokon (pl. Poco X4 Pro) akad.
function fxLevel() {
  const e = settings.effects;
  if (e === 'high' || e === 'mid' || e === 'fast') return e;
  return window.CSSOSAndroid || matchMedia('(pointer: coarse)').matches ? 'mid' : 'high';
}
function fxFast() { return fxLevel() === 'fast'; }
function fxMid() { return fxLevel() === 'mid'; }

// Sötét-e most a téma (automatikus módban este 19 és reggel 7 között)
function isDark() {
  if (!settings.autoDark) return settings.dark;
  const h = new Date().getHours();
  return h >= 19 || h < 7;
}

function applySettings() {
  screenEl.style.setProperty('--wall', WALLPAPERS[settings.wallpaper] || WALLPAPERS[0]);
  screenEl.style.setProperty('--accent', ACCENTS[settings.accent] || ACCENTS[0]);
  screenEl.style.setProperty('--fs', TEXT_SIZES[settings.textSize] || 1);
  screenEl.classList.toggle('light', !isDark());
  screenEl.classList.toggle('reduce-motion', settings.reduceMotion);
  screenEl.classList.toggle('no-ring', !settings.ring);
  screenEl.classList.toggle('bold-text', settings.boldText);
  screenEl.style.setProperty('--icon-radius', ICON_SHAPES[settings.iconShape] || ICON_SHAPES.drop);
  screenEl.style.setProperty('--icon-size', (ICON_SIZES[settings.iconSize] || 60) + 'px');
  screenEl.style.setProperty('--cols', settings.columns);
  screenEl.style.setProperty('--lock-w', LOCK_WEIGHTS[settings.lockStyle] || 600);
  screenEl.style.setProperty('--lock-c', settings.lockColor === 'accent' ? 'var(--accent)' : '#fff');
  screenEl.style.filter = COLOR_FILTERS[settings.colorFilter] || 'none';
  screenEl.classList.toggle('live-wall', LIVE_WALLS.has(settings.wallpaper) && settings.wallpaper !== AURORA);
  screenEl.classList.toggle('aurora', settings.wallpaper === AURORA);
  screenEl.classList.toggle('fx-fast', fxFast());
  screenEl.classList.toggle('fx-mid', fxMid());
  lockEl.classList.toggle('with-sec', settings.lockSeconds);
  const owner = $('#lock-owner');
  owner.textContent = settings.ownerMsg;
  owner.hidden = !settings.ownerMsg;
  $('#warm').style.opacity = settings.eyeCare ? (settings.eyeCareLevel / 100) * 0.45 : 0;
  applyCC();
  updateBattery();
  tick();
}

// Energiatakarékos mód: kézzel, vagy automatikusan 20% alatt
function saverOn() {
  return settings.saver || (settings.autoSaver && batteryLevel !== null && batteryLevel < 0.2 && !batteryCharging);
}

// Idő formázása a 12/24 órás beállítás szerint
function fmtTime(d, withSec = false) {
  const h = settings.clock24 ? d.getHours() : d.getHours() % 12 || 12;
  return `${h}:${pad(d.getMinutes())}${withSec ? ':' + pad(d.getSeconds()) : ''}`;
}
const ampm = d => (settings.clock24 ? '' : d.getHours() < 12 ? L(' de.', ' AM') : L(' du.', ' PM'));

// ---------- Képernyőidő ----------
// Naponta összesíti, melyik app mennyi ideig volt nyitva (ezredmásodpercben).
let usageApp = null, usageStart = 0;
function usageToday() {
  const u = store.get('usage', {});
  const day = new Date().toDateString();
  return u.day === day ? u : { day, apps: {} };
}
function trackStart(id) { usageApp = id; usageStart = Date.now(); }
function trackStop() {
  if (!usageApp) return;
  const u = usageToday();
  u.apps[usageApp] = (u.apps[usageApp] || 0) + (Date.now() - usageStart);
  store.set('usage', u);
  usageApp = null;
}
function usageLive() {
  const u = usageToday();
  const apps = { ...u.apps };
  if (usageApp) apps[usageApp] = (apps[usageApp] || 0) + (Date.now() - usageStart);
  return apps;
}

// ---------- Hangok és rezgés ----------
let audioCtx = null;
function beep(freq = 880, dur = 0.05, vol = 1) {
  if (!settings.volume) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime;
    o.frequency.value = freq;
    g.gain.setValueAtTime((settings.volume / 100) * 0.15 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur);
  } catch {}
}
function keyClick() { if (settings.keySound) beep(1200, 0.03, 0.6); }
function notifSound() {
  if (!settings.notifSound) return;
  beep(880, 0.12);
  setTimeout(() => beep(1320, 0.18), 120);
}
function vibrate(p) {
  if (!settings.vibrate) return;
  if (ANDROID) ANDROID.vibrate(Array.isArray(p) ? p.reduce((a, b) => a + b, 0) : p);
  else navigator.vibrate?.(p);
}

// ---------- Android ----------
// Ha a CSSOS az Android-appban (launcherként) fut, ez a híd az igazi telefonhoz.
const ANDROID = window.CSSOSAndroid || null;
const PLAY_STORE = 'com.android.vending';

// A telefon igazi appjait „android:” kezdetű azonosítóval vesszük fel a CSSOS appjai közé
function loadAndroidApps() {
  if (!ANDROID) return;
  let list = [];
  try { list = JSON.parse(ANDROID.getApps()); } catch {}
  Object.keys(apps).filter(id => id.startsWith('android:')).forEach(id => delete apps[id]);
  list.sort((a, b) => a.label.localeCompare(b.label, 'hu')).forEach(a => {
    const id = 'android:' + a.id;
    apps[id] = {
      id, name: a.label, android: a.id, pkg: a.pkg, bg: '#fff',
      icon: () => `<img class="aicon" src="data:image/png;base64,${a.icon}" alt="">`,
      render() {},
    };
  });
  renderHome();
}
const androidAppIds = () => Object.keys(apps).filter(id => id.startsWith('android:'));

// Az Android-app hívja: vissza gomb, Home gomb, visszatérés egy másik appból
window.cssosBack = () => {
  if (screenEl.classList.contains('switcher-open')) closeSwitcher();
  else if (screenEl.classList.contains('cc-open')) closeCC();
  else if (lockEl.classList.contains('pin-mode') && !lockEl.classList.contains('hidden')) pinKey('cancel');
  else if ($('.app-overlay', winEl)) $$('.app-overlay', winEl).pop().remove();
  else closeApp();
};
window.cssosHome = () => { closeSwitcher(); closeCC(); closeApp(); };
window.cssosAppsChanged = loadAndroidApps;
window.cssosResume = () => { if (ANDROID) readAndroidBattery(); };
function readAndroidBattery() {
  try {
    const b = JSON.parse(ANDROID.battery());
    if (b) setBattery(b.level, b.charging);
  } catch {}
}

// ---------- Alkalmazás-nyilvántartás ----------
const apps = {};
function registerApp(def) { apps[def.id] = def; }
const appIcon = app => (typeof app.icon === 'function' ? app.icon() : ic(app.icon));

// A rendszerappok mindig ott vannak, a többit az Áruházból lehet telepíteni és eltávolítani.
const SYSTEM_GRID = ['clock', 'calendar', 'weather', 'calculator', 'notes', 'gallery', 'store'];
const DEFAULT_INSTALLED = ['music', 'snake', 'paint'];
let installed = store.get('installed', null) || DEFAULT_INSTALLED.slice();

// Kitűzött Android-appok a kezdőképernyőn (alapból csak a Google Play)
function isPinned(id) {
  const pins = store.get('homeAndroid', null);
  return pins ? pins.includes(id) : id.includes('com.android.vending');
}
function setPinned(id, on) {
  const pins = store.get('homeAndroid', null) ?? androidAppIds().filter(isPinned);
  store.set('homeAndroid', on ? [...new Set([...pins, id])] : pins.filter(x => x !== id));
  renderHome();
}

function isInstalled(id) { return !!apps[id] && (!apps[id].optional || installed.includes(id)); }
function installApp(id) {
  if (installed.includes(id)) return;
  installed.push(id);
  store.set('installed', installed);
  renderHome();
}
function uninstallApp(id) {
  installed = installed.filter(x => x !== id);
  store.set('installed', installed);
  recents = recents.filter(x => x !== id);
  if (id === 'music') musicPause();
  renderHome();
}
const DOCK = ['phone', 'messages', 'camera', 'settings'];

function renderHome() {
  iconEl.count = 0;
  const grid = $('#app-grid');
  grid.innerHTML = (settings.showWidget ? '<div class="widget" id="widget"></div>' : '') + '<div class="mwidget" id="mw-home" hidden></div>';
  // A saját sorrend (a szerkesztő módban átrendezve) előre, az új appok a végére kerülnek
  const order = store.get('homeOrder', []);
  // Az Android-appok közül csak a kitűzöttek kerülnek ide (a többi az Alkalmazástárban van)
  const ids = [...SYSTEM_GRID, ...installed, ...androidAppIds().filter(isPinned)].filter(isInstalled);
  const pos = id => { const i = order.indexOf(id); return i < 0 ? 1e6 + ids.indexOf(id) : i; };
  ids.sort((a, b) => pos(a) - pos(b)).forEach(id => grid.append(iconEl(apps[id], true)));
  const dock = $('#dock');
  dock.innerHTML = '';
  DOCK.forEach(id => apps[id] && dock.append(iconEl(apps[id], false)));
  updateWidget();
  updateBadges();
  if (typeof updateMusicWidgets === 'function') updateMusicWidgets();
}

function iconEl(app, label) {
  const b = document.createElement('button');
  b.className = 'app-icon';
  b.style.setProperty('--i', iconEl.count = (iconEl.count || 0) + 1); // a beugrás sorrendjéhez
  b.dataset.app = app.id;
  b.innerHTML = `<div class="icon" style="background:${app.bg};color:${app.fg || '#fff'}">${appIcon(app)}<em class="badge"></em></div>${label && settings.labels ? `<span>${esc(app.name)}</span>` : ''}`;
  b.addEventListener('click', () => {
    if (b.longPressed) { b.longPressed = false; return; }
    if (screenEl.classList.contains('editing')) return; // szerkesztő módban nem nyílik meg
    openApp(app.id, b);
  });
  // Nyomva tartás: szerkesztő mód (ikonok átrendezése, eltávolítás) — a wow.js intézi
  let t = null;
  b.addEventListener('pointerdown', e => {
    if (screenEl.classList.contains('editing') || locked) return;
    const x = e.clientX, y = e.clientY;
    t = setTimeout(() => {
      b.longPressed = true;
      // Nyomva tartás: gyorsmenü (mech.js); ha ki van kapcsolva, rögtön szerkesztő mód
      if (typeof showQuickMenu === 'function' && settings.quickMenu !== false) showQuickMenu(b, x, y);
      else if (typeof enterEditMode === 'function') enterEditMode(b, x, y);
    }, 550);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => clearTimeout(t)));
  b.addEventListener('pointermove', e => { if (t && (Math.abs(e.movementX) + Math.abs(e.movementY) > 6)) clearTimeout(t); });
  return b;
}

function updateBadges() {
  const unread = store.get('unread', 0);
  $$('.app-icon[data-app="messages"] .badge').forEach(b => {
    b.textContent = unread;
    b.style.display = unread ? 'flex' : 'none';
  });
}

let batteryLevel = null;
function updateWidget() {
  const w = $('#widget');
  if (!w) return;
  const d = new Date(), h = d.getHours();
  const greet = h < 5 ? 'Jó éjszakát' : h < 10 ? 'Jó reggelt' : h < 18 ? 'Jó napot' : 'Jó estét';
  const batt = batteryLevel === null ? '' : ` · akkumulátor ${Math.round(batteryLevel * 100)}%`;
  const wc = store.get('weatherCache', null); // az Időjárás app legutóbbi adata
  const wx = wc ? ` · ${Math.round(wc.data.current.temperature_2m)}° ${esc(wc.city)}` : '';
  const html = `<small>${greet}${settings.userName ? ', ' + esc(settings.userName) : ''}!</small><b>${fmtTime(d)}${ampm(d)}</b><span>${cap(d.toLocaleDateString(LOC, { weekday: 'long', month: 'long', day: 'numeric' }))}${wx}${batt}</span>`;
  if (w.innerHTML !== html) w.innerHTML = html;
}

// ---------- Alkalmazás megnyitása / bezárása ----------
let current = null;
let cleanup = null;

function runCleanup() {
  if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { console.error(e); } }
  cleanup = null;
}

function openApp(id, fromEl) {
  const app = apps[id];
  if (!isInstalled(id)) return;
  // Igazi Android-app: az Android indítja el
  if (app.android) {
    closeCC();
    closeSwitcher();
    ANDROID.launch(app.android);
    return;
  }
  closeCC();
  runCleanup();
  finishWinAnim();
  $$('.app-overlay', winEl).forEach(o => o.remove());
  const fromHome = !current;
  winEl.classList.toggle('dark-ui', !!app.dark);
  screenEl.classList.toggle('dark-app', !!app.dark);
  contentEl.innerHTML = '';
  contentEl.scrollTop = 0;
  trackStop();
  current = id;
  trackStart(id);
  rememberApp(id);
  cleanup = app.render(contentEl) || null;
  // A tartalom elemei egymás után úsznak be (csak nyitáskor, nem minden frissítésnél)
  contentEl.classList.add('entering');
  clearTimeout(openApp.enterT);
  openApp.enterT = setTimeout(() => contentEl.classList.remove('entering'), 800);
  winEl.classList.add('open');
  screenEl.classList.add('app-open');
  if (fromHome) animateOpen(app, fromEl);
}

function closeApp() {
  if (!current) return;
  const id = current;
  runCleanup();
  trackStop();
  current = null;
  screenEl.classList.remove('app-open', 'dark-app');
  animateClose(apps[id]);
  updateBadges();
}

// ---------- Mozgás: az app az ikonból nő ki, és oda tér vissza ----------
// Rugós görbék (a CSS-ben is ugyanezek vannak: --spring, --spring-soft)
const SPRING = 'linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1)';
const SPRING_SOFT = 'linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.8%, 0.991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%, 1.001 85.9%, 1)';
const EASE_OUT = 'cubic-bezier(.2,.9,.25,1)';
const EASE_IN_OUT = 'cubic-bezier(.4,0,.2,1)';
const motionOff = () => settings.reduceMotion || saverOn();

let winAnims = [], hiddenIcon = null, splashEl = null;
function finishWinAnim() {
  winAnims.forEach(a => a.cancel());
  winAnims = [];
  splashEl?.remove();
  splashEl = null;
  if (hiddenIcon) { hiddenIcon.style.visibility = ''; hiddenIcon = null; }
}

// Egy elem helye a kijelzőn transzformációk nélkül (a kezdőképernyő épp nagyít/kicsinyít)
function layoutRect(el) {
  let x = 0, y = 0, n = el;
  while (n && n !== screenEl) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent;
  }
  const grid = el.closest('#app-grid');
  if (grid) y -= grid.scrollTop;
  // A lapozósáv el van tolva (a kezdőképernyő oldalai): ezt is számolni kell
  if (el.closest('#pager')) x -= (window.homePage ?? 1) * screenEl.clientWidth;
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

function homeIcon(id, fromEl) {
  const icon = (fromEl && $('.icon', fromEl)) || $(`#home .app-icon[data-app="${id}"] .icon`);
  if (!icon || !icon.offsetParent) return null;
  const r = layoutRect(icon);
  // Ha az ikon épp nem látszik (a rácsban kigörgetve), nincs honnan kinőni
  if (r.y + r.h < 40 || r.y > screenEl.clientHeight - 40) return null;
  return { el: icon, r };
}

// Az app „kezdőképe”: az ikon színe és jele, ami átúszik a valódi tartalomba
function makeSplash(app) {
  const s = document.createElement('div');
  s.className = 'app-splash';
  s.style.background = app.bg;
  s.style.color = app.fg || '#fff';
  s.innerHTML = `<span>${appIcon(app)}</span>`;
  winEl.append(s);
  return s;
}

// Az ikon helyére és méretére kicsinyített ablak (csak eltolás + nagyítás: ezt a grafikus chip
// rajzolja, ezért gyenge telefonon is folyamatos marad)
function iconTransform(r) {
  const W = screenEl.clientWidth, H = screenEl.clientHeight;
  const s = r.w / W;
  return `translate(${r.x + r.w / 2 - W / 2}px, ${r.y + r.h / 2 - H / 2}px) scale(${s})`;
}

function animateOpen(app, fromEl) {
  if (motionOff()) return;
  const hit = homeIcon(app.id, fromEl);
  winEl.classList.add('anim');
  if (!hit) {
    winAnims = [winEl.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: SPRING_SOFT })];
    winAnims[0].onfinish = () => { winEl.classList.remove('anim'); winAnims = []; };
    return;
  }
  hiddenIcon = hit.el;
  hiddenIcon.style.visibility = 'hidden';
  splashEl = makeSplash(app);
  const D = 500;
  const glyph = screenEl.clientWidth / 120; // a kis ablakban az ikonjel akkora, mint az ikonon
  winAnims = [
    winEl.animate([{ transform: iconTransform(hit.r) }, { transform: 'none' }], { duration: D, easing: SPRING_SOFT }),
    splashEl.animate([{ opacity: 1 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], { duration: D, easing: 'ease-out', fill: 'forwards' }),
    $('span', splashEl).animate([{ transform: `scale(${glyph})` }, { transform: 'none' }], { duration: D, easing: SPRING_SOFT }),
    contentEl.animate([{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1 }], { duration: D, easing: EASE_OUT }),
  ];
  winAnims[0].onfinish = () => {
    winEl.classList.remove('anim');
    splashEl?.remove();
    splashEl = null;
    winAnims = [];
  };
}

function animateClose(app) {
  // Gesztusnál onnan indul, ahol az ujj elengedte az appot (mech.js állítja be)
  const from = window.gestureFrom || 'none';
  window.gestureFrom = null;
  finishWinAnim();
  const done = () => {
    winEl.classList.remove('open', 'anim');
    finishWinAnim();
    $$('.app-overlay', winEl).forEach(o => o.remove());
  };
  if (motionOff() || !app) { done(); return; }
  winEl.classList.add('anim');
  const hit = homeIcon(app.id);
  if (!hit) {
    const a = winEl.animate([{ opacity: 1, transform: from }, { opacity: 0, transform: 'scale(.6)' }], { duration: 240, easing: EASE_IN_OUT });
    winAnims = [a];
    a.onfinish = done;
    return;
  }
  hiddenIcon = hit.el;
  hiddenIcon.style.visibility = 'hidden';
  splashEl = makeSplash(app);
  const D = 380;
  const a = winEl.animate([{ transform: from }, { transform: iconTransform(hit.r) }], { duration: from === 'none' ? D : 320, easing: 'cubic-bezier(.3,0,.15,1)', fill: 'forwards' });
  winAnims = [
    a,
    splashEl.animate([{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 1 }], { duration: D, fill: 'forwards' }),
    $('span', splashEl).animate([{ transform: 'none' }, { transform: `scale(${screenEl.clientWidth / 120})` }], { duration: D, easing: 'cubic-bezier(.3,0,.15,1)', fill: 'forwards' }),
  ];
  a.onfinish = done;
}

// Teljes képernyős réteg az app fölött (pl. hívás, fotónézegető)
function overlay(html) {
  const o = document.createElement('div');
  o.className = 'app-overlay';
  o.innerHTML = html;
  winEl.append(o);
  return o;
}

// ---------- Zárolás ----------
let locked = true;
let pinBuf = '';

function lock() {
  if (typeof closeNC === 'function') closeNC();
  closeSwitcher();
  closeCC();
  locked = true;
  pinBuf = '';
  renderPinDots();
  lockEl.classList.remove('hidden', 'pin-mode');
  screenEl.classList.add('locked');
  trackStop(); // zárolt telefonon nem számít a képernyőidő
}

function unlockAttempt() {
  if (settings.pin) lockEl.classList.add('pin-mode');
  else unlock();
}

let welcomed = false;
function unlock() {
  locked = false;
  pinBuf = '';
  renderPinDots();
  lockEl.classList.remove('pin-mode');
  lockEl.classList.add('hidden');
  screenEl.classList.remove('locked');
  if (current) trackStart(current);
  // Feloldási animáció: a kezdőképernyő a Fénygyűrűből nyílik ki, az ikonok egymás után ugranak be
  screenEl.classList.remove('unlocking');
  void screenEl.offsetWidth;
  screenEl.classList.add('unlocking');
  clearTimeout(unlock.timer);
  unlock.timer = setTimeout(() => screenEl.classList.remove('unlocking'), 900);
  ringFlash();
  if (settings.keySound) [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.09, 0.7), i * 70));
  if (!welcomed) {
    welcomed = true;
    setTimeout(() => notify(OS.name, `Üdv a(z) ${settings.deviceName} készülékeden! 👋`, 'settings'), 700);
  }
}

// Felfelé húzás a zárolási képernyőn
let drag = null;
lockEl.addEventListener('pointerdown', e => {
  if (lockEl.classList.contains('pin-mode') || e.target.closest('.mwidget, #lock-notifs')) return; // a zene-widget gombjai kattinthatók maradnak
  drag = { y: e.clientY, dy: 0, target: e.target, t: performance.now(), v: 0, lastY: e.clientY, lastT: performance.now() };
  lockEl.setPointerCapture(e.pointerId);
  lockEl.style.transition = 'none';
  lockEl.classList.add('dragging');
});
lockEl.addEventListener('pointermove', e => {
  if (!drag) return;
  const raw = e.clientY - drag.y;
  // Felfelé követi az ujjat, lefelé csak „gumiszerűen” enged egy kicsit
  drag.dy = raw < 0 ? raw : Math.sqrt(raw) * 4;
  const now = performance.now();
  drag.v = (e.clientY - drag.lastY) / Math.max(1, now - drag.lastT); // sebesség (px/ms)
  drag.lastY = e.clientY;
  drag.lastT = now;
  const p = Math.min(1, Math.max(0, -drag.dy / 320)); // mennyire húztad fel (0–1)
  lockEl.style.transform = `translateY(${drag.dy}px)`;
  lockEl.style.setProperty('--p', p);
});
function endDrag() {
  if (!drag) return;
  const { dy, target, v } = drag;
  drag = null;
  lockEl.classList.remove('dragging');
  lockEl.style.transition = '';
  lockEl.style.transform = '';
  lockEl.style.removeProperty('--p');
  // Feloldás: elég messzire húztad, vagy gyorsan „felpöccintetted”
  if (dy < -90 || (dy < -25 && v < -0.6) || (Math.abs(dy) < 5 && target.closest('.lock-hint'))) unlockAttempt();
}
lockEl.addEventListener('pointerup', endDrag);
lockEl.addEventListener('pointercancel', endDrag);

// PIN-billentyűzet
const PIN_KEYS = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['cancel', ''], ['0', ''], ['del', '']];
$('#pin-keys').innerHTML = PIN_KEYS.map(([k, l]) =>
  k === 'cancel' ? '<button class="ghost" data-k="cancel">Mégse</button>'
  : k === 'del' ? '<button class="ghost" data-k="del">Törlés</button>'
  : `<button data-k="${k}">${k}<small>${l}</small></button>`).join('');

function renderPinDots() { $$('#pin-dots i').forEach((d, i) => d.classList.toggle('on', i < pinBuf.length)); }

function pinKey(k) {
  keyClick();
  if (k === 'del') pinBuf = pinBuf.slice(0, -1);
  else if (k === 'cancel') { pinBuf = ''; lockEl.classList.remove('pin-mode'); }
  else if (pinBuf.length < 4) pinBuf += k;
  renderPinDots();
  if (pinBuf.length === 4) {
    if (pinBuf === settings.pin) setTimeout(unlock, 150);
    else {
      const dots = $('#pin-dots');
      dots.classList.add('shake');
      vibrate(200);
      setTimeout(() => { dots.classList.remove('shake'); pinBuf = ''; renderPinDots(); }, 450);
    }
  }
}
$('#pin-keys').addEventListener('click', e => {
  const k = e.target.closest('button')?.dataset.k;
  if (k) pinKey(k);
});

// ---------- Bekapcsoló gomb ----------
function power() {
  if (screenEl.classList.contains('off')) screenEl.classList.remove('off');
  else { lock(); screenEl.classList.add('off'); }
}
$('#btn-power').addEventListener('click', power);
$('#off').addEventListener('click', () => screenEl.classList.remove('off'));

// ---------- Hangerő gombok ----------
function changeVolume(delta) {
  settings.volume = Math.max(0, Math.min(100, settings.volume + delta));
  saveSettings();
  const hud = $('#vol-hud');
  hud.innerHTML = `${ic(settings.volume ? 'speaker' : 'speakerOff')}<div class="vol-track"><i style="height:${settings.volume}%"></i></div>`;
  hud.classList.add('show');
  clearTimeout(changeVolume.timer);
  changeVolume.timer = setTimeout(() => hud.classList.remove('show'), 1500);
  beep(660, 0.06);
}
$('#btn-vol-up').addEventListener('click', () => changeVolume(10));
$('#btn-vol-down').addEventListener('click', () => changeVolume(-10));

// ---------- Automatikus zárolás ----------
let lastActive = Date.now();
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => (lastActive = Date.now()), true));
function checkAutoLock() {
  // Androidon a telefon saját zárolása dolgozik, a CSSOS nem zárol magától
  if (ANDROID || locked || !settings.autoLock || screenEl.classList.contains('in-call') || screenEl.classList.contains('off')) return;
  if (Date.now() - lastActive > settings.autoLock * 1000) power();
}

// ---------- Vezérlőközpont ----------
function openCC() { screenEl.classList.add('cc-open'); }
function closeCC() { screenEl.classList.remove('cc-open'); }

function applyCC() {
  $$('#cc [data-t]').forEach(b => {
    const t = b.dataset.t;
    if (t === 'dark') b.classList.toggle('on', isDark());
    else if (t === 'saver') b.classList.toggle('on', !!settings.saver);
    else if (t === 'torch') b.classList.toggle('on', torchOn);
    else if (t in cc) b.classList.toggle('on', !!cc[t]);
  });
  const vol = $('#vol');
  if (vol) vol.value = settings.volume;
  $('#sb-wifi').style.display = cc.wifi ? '' : 'none';
  $('#sb-plane').hidden = !cc.airplane;
  $('#sb-signal').style.opacity = cc.airplane ? 0.3 : 1;
  $('#sb-net').hidden = cc.airplane || !cc.data || cc.wifi; // mobilnet jelzés, ha nincs Wi-Fi
  $('#bright').value = cc.bright;
  // Energiatakarékos módban a kijelző kicsit sötétebb
  $('#dim').style.opacity = Math.min(0.8, ((100 - cc.bright) / 100) * 0.75 + (saverOn() ? 0.12 : 0));
  store.set('cc', cc);
}

$('#cc').addEventListener('click', e => {
  const b = e.target.closest('[data-t]');
  if (!b) {
    if (!e.target.closest('.cc-slider')) closeCC();
    return;
  }
  const t = b.dataset.t;
  if (t === 'dark') { settings.dark = !isDark(); settings.autoDark = false; saveSettings(); return; }
  if (t === 'lock') { lock(); return; }
  if (t === 'saver') { settings.saver = !settings.saver; saveSettings(); return; }
  if (t === 'torch') { toggleTorch(); return; }
  if (t.startsWith('open:')) {
    closeCC();
    if (locked) unlockAttempt();
    else openApp(t.slice(5));
    return;
  }
  if (t === 'airplane') {
    cc.airplane = !cc.airplane;
    if (cc.airplane) { cc.wifi = false; cc.bt = false; }
  } else {
    cc[t] = !cc[t];
  }
  applyCC();
});
$('#bright').addEventListener('input', e => { cc.bright = +e.target.value; applyCC(); });
$('#vol').addEventListener('input', e => { settings.volume = +e.target.value; store.set('settings', settings); });
$('#vol').addEventListener('change', () => beep(660, 0.06));

// Zseblámpa a vezérlőközpontból: Androidon a valódi vaku, máshol a Zseblámpa app
let torchOn = false;
function toggleTorch() {
  if (ANDROID) {
    torchOn = !torchOn;
    if (!ANDROID.torch(torchOn)) torchOn = false;
    applyCC();
    return;
  }
  closeCC();
  if (locked) { unlockAttempt(); return; }
  if (isInstalled('flashlight')) openApp('flashlight');
  else notify(L('Zseblámpa', 'Flashlight'), L('Töltsd le a Zseblámpa appot az Áruházból!', 'Get the Flashlight app from the Store!'), 'store');
}
// Vezérlőközpont: kattintás a felső sávra, vagy lehúzás
let sbDrag = null;
$('#statusbar').addEventListener('pointerdown', e => { sbDrag = { y: e.clientY, pulled: false }; });
$('#statusbar').addEventListener('pointermove', e => {
  if (sbDrag && !sbDrag.pulled && e.clientY - sbDrag.y > 25) { sbDrag.pulled = true; openCC(); }
});
$('#statusbar').addEventListener('click', () => {
  const pulled = sbDrag?.pulled;
  sbDrag = null;
  if (pulled) return;
  screenEl.classList.contains('cc-open') ? closeCC() : openCC();
});

// ---------- Home gomb (alsó csík) ----------
// Koppintás: vissza a kezdőképernyőre. Nyomva tartás: appváltó.
let hbTimer = null, hbLong = false;
$('#homebar').addEventListener('pointerdown', () => {
  hbLong = false;
  clearTimeout(hbTimer);
  if (locked) return;
  hbTimer = setTimeout(() => { hbLong = true; openSwitcher(); }, 450);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => $('#homebar').addEventListener(ev, () => clearTimeout(hbTimer)));
$('#homebar').addEventListener('click', () => {
  if (hbLong) { hbLong = false; return; }
  if (screenEl.classList.contains('switcher-open')) closeSwitcher();
  else if (screenEl.classList.contains('cc-open')) closeCC();
  else if (locked) unlockAttempt();
  else closeApp();
});

// ---------- Appváltó ----------
// A legutóbb használt appok kártyákon. Koppintás: megnyitás. Felhúzás: eltávolítás.
let recents = [];
function rememberApp(id) { recents = [id, ...recents.filter(x => x !== id)].slice(0, 8); }

function openSwitcher() {
  closeCC();
  const sw = $('#switcher');
  const cards = recents.filter(isInstalled);
  sw.innerHTML = cards.length
    ? `<div class="sw-cards">${cards.map(id => {
        const a = apps[id];
        return `<div class="sw-card" data-id="${id}"><div class="sw-label"><span class="ri" style="background:${a.bg};color:${a.fg || '#fff'}">${appIcon(a)}</span>${esc(a.name)}</div>
          <div class="sw-shot" style="background:${a.bg};color:${a.fg || '#fff'}">${appIcon(a)}</div></div>`;
      }).join('')}</div><button class="sw-clear">Összes bezárása</button>`
    : '<div class="sw-empty">Nincs megnyitott alkalmazás</div>';
  screenEl.classList.add('switcher-open');
  // 3D körhinta: a középső kártya szemből látszik, a szélsők elfordulnak és kisebbek
  const strip = $('.sw-cards', sw);
  if (strip) {
    const tilt = () => {
      const mid = strip.scrollLeft + strip.clientWidth / 2;
      $$('.sw-card', strip).forEach(c => {
        const d = (c.offsetLeft + c.offsetWidth / 2 - mid) / c.offsetWidth;
        c.style.setProperty('--d', Math.max(-1.5, Math.min(1.5, d)).toFixed(3));
        c.style.setProperty('--ad', Math.min(1, Math.abs(d)).toFixed(3));
      });
    };
    strip.onscroll = () => requestAnimationFrame(tilt);
    tilt();
  }
  $('.sw-clear', sw)?.addEventListener('click', () => { recents = []; closeApp(); closeSwitcher(); });
  $$('.sw-card', sw).forEach(card => {
    let start = null, dy = 0;
    card.onpointerdown = e => { start = e.clientY; dy = 0; card.setPointerCapture(e.pointerId); card.style.transition = 'none'; };
    card.onpointermove = e => {
      if (start === null) return;
      dy = Math.min(0, e.clientY - start);
      card.style.transform = `translateY(${dy}px)`;
      card.style.opacity = 1 + dy / 300;
    };
    card.onpointerup = () => {
      start = null;
      card.style.transition = '';
      const id = card.dataset.id;
      if (dy < -90) { // felhúzva: bezárás
        card.style.transform = 'translateY(-120%)';
        card.style.opacity = 0;
        recents = recents.filter(x => x !== id);
        if (current === id) closeApp();
        setTimeout(() => (recents.length ? openSwitcher() : closeSwitcher()), 200);
      } else if (Math.abs(dy) < 6) { // koppintás: megnyitás
        closeSwitcher();
        openApp(id);
      } else {
        card.style.transform = '';
        card.style.opacity = '';
      }
    };
  });
}
function closeSwitcher() { screenEl.classList.remove('switcher-open'); }

// ---------- 3D dőlés a kezdőképernyőn ----------
// A kezdőképernyő ikonjai finoman követik az egeret (asztali gépen).
let tiltRaf = 0;
screenEl.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || current || locked || settings.reduceMotion || saverOn() || screenEl.classList.contains('editing')) return;
  cancelAnimationFrame(tiltRaf);
  tiltRaf = requestAnimationFrame(() => {
    const r = screenEl.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    $('#app-grid').style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    $('#dock').style.transform = `translateX(${x * -6}px)`;
  });
});
screenEl.addEventListener('pointerleave', () => {
  $('#app-grid').style.transform = '';
  $('#dock').style.transform = '';
});

// ---------- Értesítések ----------
function notify(title, body, appId) {
  // Minden értesítés bekerül az értesítési központba (Ne zavarj módban is)
  if (typeof addNotifHistory === 'function') addNotifHistory(title, body, appId);
  if (cc.dnd) return;
  const app = apps[appId];
  const b = $('#banner');
  // Zárolt képernyőn elrejthető az értesítés tartalma
  const text = locked && !settings.preview ? 'Új értesítés' : body;
  b.innerHTML = `<div class="b-icon" style="background:${app ? app.bg : '#555'};color:${app?.fg || '#fff'}">${app ? appIcon(app) : ic('bell')}</div>
    <div class="b-text"><b>${esc(title)}</b><p>${esc(text)}</p></div><small class="b-time">most</small>`;
  notifSound();
  vibrate(80);
  ringFlash();
  b.classList.add('show');
  b.onclick = () => {
    if (b.dataset.swiped) { delete b.dataset.swiped; return; } // felsöpörték, nem koppintottak
    b.classList.remove('show');
    if (!locked && appId) openApp(appId);
  };
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => b.classList.remove('show'), 4500);
}

// Az értesítést felfelé söpörve el lehet tüntetni (visszaszáll a Fénygyűrűbe)
{
  const b = $('#banner');
  let st = null;
  b.addEventListener('pointerdown', e => {
    st = { y: e.clientY, dy: 0 };
    b.setPointerCapture(e.pointerId);
    b.style.transition = 'none';
  });
  b.addEventListener('pointermove', e => {
    if (!st) return;
    const raw = e.clientY - st.y;
    st.dy = raw < 0 ? raw : Math.sqrt(raw) * 3;
    b.style.transform = `translateY(${st.dy}px)`;
  });
  const end = () => {
    if (!st) return;
    const dy = st.dy;
    st = null;
    b.style.transition = '';
    b.style.transform = '';
    if (dy < -30) {
      b.dataset.swiped = '1';
      b.classList.remove('show');
      clearTimeout(notify.timer);
    }
  };
  b.addEventListener('pointerup', end);
  b.addEventListener('pointercancel', end);
}

// ---------- Fénygyűrű ----------
// A kamera körüli gyűrű jelzései (erősségi sorrendben, a CSS dönti el, melyik látszik):
//   ring-low    – piros lassú pulzálás: lemerülőben az akku
//   ring-timer  – narancs, fogyó gyűrű: fut az időzítő
//   ring-notify – kiemelő színű villanás: értesítés jött
//   in-call     – zöld pulzálás: hívás folyik
//   ring-cam    – piros: a kamera be van kapcsolva
const ringEl = $('#cam-ring');
function ringFlash() {
  screenEl.classList.remove('ring-notify');
  void ringEl.offsetWidth; // újraindítja az animációt
  screenEl.classList.add('ring-notify');
  clearTimeout(ringFlash.timer);
  ringFlash.timer = setTimeout(() => screenEl.classList.remove('ring-notify'), 1400);
}
function updateTimerRing() {
  const { timerEnd, timerTotal } = clockState;
  const on = timerEnd > Date.now() && timerTotal > 0;
  screenEl.classList.toggle('ring-timer', on);
  if (on) ringEl.style.setProperty('--ring-p', ((timerEnd - Date.now()) / timerTotal) * 100);
  else ringEl.style.removeProperty('--ring-p');
}

// ---------- Óra és akkumulátor ----------
// Az Óra app stoppere és időzítője itt él, hogy bezárt appnál is fusson.
const clockState = { swRunning: false, swStart: 0, swElapsed: 0, laps: [], timerEnd: 0, timerTotal: 0 };

function tick() {
  const d = new Date();
  // Csak akkor írunk a képernyőre, ha tényleg változott valami (percenként, nem másodpercenként)
  setText('#sb-time', fmtTime(d));
  // 3.0: az óra két sorban (óra fölött perc), ezért darabonként írjuk ki
  const lt = fmtTime(d, settings.lockSeconds), lockT = $('#lock-time');
  if (lockT.dataset.t !== lt) {
    lockT.dataset.t = lt;
    lockT.innerHTML = lt.split(':').map(p => `<span>${pad(+p)}</span>`).join('');
  }
  const minute = fmtTime(d) + settings.clock24;
  if (minute !== tick.lastMinute) {
    tick.lastMinute = minute;
    setText('#lock-date', cap(d.toLocaleDateString(LOC, { weekday: 'long', month: 'long', day: 'numeric' })));
    updateWidget();
    if (settings.autoDark) screenEl.classList.toggle('light', !isDark());
  }
  checkAutoLock();
  if (clockState.timerEnd && Date.now() >= clockState.timerEnd) {
    clockState.timerEnd = 0;
    vibrate([300, 100, 300]);
    notify('Óra', 'Lejárt az időzítő! ⏰', 'clock');
  }
  updateTimerRing();
}

let batteryCharging = false;
function setBattery(level, charging) {
  batteryLevel = level;
  // Töltőre dugáskor nagy töltés-animáció (az első, induláskori értéknél nem)
  if (charging && !batteryCharging && setBattery.known && typeof chargeAnimation === 'function') chargeAnimation(level);
  setBattery.known = true;
  batteryCharging = charging;
  updateBattery();
}
function updateBattery() {
  const level = batteryLevel === null ? 1 : batteryLevel;
  const f = $('#batt-fill');
  f.style.width = Math.max(8, Math.round(level * 100)) + '%';
  f.style.background = batteryCharging ? '#34c759' : level < 0.2 ? '#ff3b30' : '';
  const pct = $('#sb-pct');
  pct.textContent = Math.round(level * 100) + '%';
  // Ha a böngésző nem árulja el az akkumulátor szintjét, nem írunk ki kitalált számot
  pct.hidden = !settings.battPct || batteryLevel === null;
  screenEl.classList.toggle('ring-low', batteryLevel !== null && level < 0.2 && !batteryCharging);
  // Töltés közben a Fénygyűrű zölden mutatja, mennyire van feltöltve
  screenEl.classList.toggle('ring-charge', batteryLevel !== null && batteryCharging);
  if (batteryCharging) ringEl.style.setProperty('--charge-p', Math.round(level * 100));
  // Energiatakarékos mód: sárga akku, nincs animáció, Fénygyűrű csak a kamerát jelzi
  const saver = saverOn();
  if (saver !== screenEl.classList.contains('saver')) {
    screenEl.classList.toggle('saver', saver);
    applyCC();
  }
  if (saver && !batteryCharging) f.style.background = '#ffd60a';
  updateWidget();
}

// ---------- Billentyűzet ----------
document.addEventListener('keydown', e => {
  if (lockEl.classList.contains('pin-mode') && !lockEl.classList.contains('hidden')) {
    if (/^\d$/.test(e.key)) pinKey(e.key);
    else if (e.key === 'Backspace') pinKey('del');
    else if (e.key === 'Escape') pinKey('cancel');
    return;
  }
  if (e.key === 'Escape') {
    if (screenEl.classList.contains('switcher-open')) closeSwitcher();
    else if (screenEl.classList.contains('cc-open')) closeCC();
    else closeApp();
  }
  // Tab: appváltó (asztali gépen)
  if (e.key === 'Tab' && !locked && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) {
    e.preventDefault();
    screenEl.classList.contains('switcher-open') ? closeSwitcher() : openSwitcher();
  }
});

// ---------- Indulás ----------
window.addEventListener('load', () => {
  document.title = OS.name;
  $('.boot-name').innerHTML = [...OS.short.toUpperCase()].map((c, i) => `<span style="--i:${i}">${c}</span>`).join('');
  $('#caption').textContent = `${OS.name} ${OS.version} · prototípus — jobb oldalt a bekapcsoló, bal oldalt a hangerő gombok`;
  fillIcons();
  applySettings();
  renderHome();
  tick();
  setInterval(tick, 1000);
  if (navigator.getBattery) {
    navigator.getBattery().then(b => {
      const u = () => setBattery(b.level, b.charging);
      u();
      b.addEventListener('levelchange', u);
      b.addEventListener('chargingchange', u);
    }).catch(() => {});
  }
  setTimeout(() => {
    $('#boot').classList.add('done');
    // Az indulás után a zárolási képernyő elemei beúsznak
    screenEl.classList.add('boot-reveal');
    setTimeout(() => screenEl.classList.remove('boot-reveal'), 1200);
  }, 900);

  if (ANDROID) {
    // Launcherként: rögtön a kezdőképernyő jön (a zárolást az Android intézi), és betöltjük az igazi appokat
    document.body.classList.add('android');
    welcomed = true;
    unlock();
    loadAndroidApps();
    readAndroidBattery();
    setInterval(readAndroidBattery, 30000);
  }

  // Nyelvváltás után (pár másodpercen belüli újratöltés) visszanyílik a Beállítások oldala
  const re = store.get('reopen', null);
  if (re) {
    store.set('reopen', null);
    if (Date.now() - re.t < 10000) {
      welcomed = true;
      if (locked) unlock();
      window.settingsStartPage = re.page;
      setTimeout(() => openApp('settings'), 950);
    }
  }
});
