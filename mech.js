'use strict';
// =====================================================================
//  CSSOS 3.1 — új mechanikák
//  1. Gesztusnavigáció az alsó csíkon   2. Gyorsmenü (ikon nyomva tartása)
//  3. Varázskör (üres helyen nyomva tartva)   4. Dupla koppintás: kijelző ki
//  Mindegyik kikapcsolható: Beállítások → Gesztusok
// =====================================================================

const gestOn = k => settings[k] !== false; // alapból minden be van kapcsolva

// =====================================================================
//  1. Gesztusnavigáció
// =====================================================================
const hb = $('#homebar');
let gest = null, gestUsed = 0;

hb.addEventListener('pointerdown', e => {
  if (!gestOn('gestureNav') || locked || !current) return;
  gest = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, mode: null, id: e.pointerId, t: performance.now(), lastY: e.clientY, lastT: performance.now(), v: 0, still: 0, pausedAt: 0 };
});

hb.addEventListener('pointermove', e => {
  if (!gest) return;
  gest.dx = e.clientX - gest.x;
  gest.dy = e.clientY - gest.y;
  if (!gest.mode) {
    if (Math.hypot(gest.dx, gest.dy) < 10) return;
    gest.mode = Math.abs(gest.dx) > Math.abs(gest.dy) * 1.3 ? 'side' : 'up';
    clearTimeout(hbTimer); // ne nyíljon meg a régi, nyomva tartós appváltó
    try { hb.setPointerCapture(gest.id); } catch {}
    if (gest.mode === 'up') {
      finishWinAnim();
      winEl.classList.add('anim');
      winEl.style.transition = 'none';
      screenEl.classList.add('gesturing');
      screenEl.classList.remove('app-open'); // a kezdőképernyő előtűnik a háttérből
    }
  }
  if (gest.mode !== 'up') return;
  const now = performance.now();
  gest.v = (e.clientY - gest.lastY) / Math.max(1, now - gest.lastT);
  gest.lastY = e.clientY;
  gest.lastT = now;
  // Megállt-e az ujj? (appváltóhoz)
  if (Math.abs(gest.v) < 0.08) { if (!gest.pausedAt) gest.pausedAt = now; }
  else gest.pausedAt = 0;
  const H = screenEl.clientHeight;
  const up = Math.max(0, -gest.dy);
  const p = Math.min(1, up / (H * 0.55)); // mennyire húztad fel (0–1)
  const scale = 1 - p * 0.6;
  winEl.style.transform = `translate(${gest.dx * 0.6}px, ${-up * 0.85}px) scale(${scale})`;
  winEl.style.borderRadius = 44 + p * 30 + 'px';
  screenEl.classList.toggle('gest-switch', p > 0.18 && p < 0.7 && gest.pausedAt && now - gest.pausedAt > 250);
});

function endGesture() {
  if (!gest) return;
  const g = gest;
  gest = null;
  if (!g.mode) return;
  gestUsed = Date.now();
  const H = screenEl.clientHeight;
  const up = Math.max(0, -g.dy);
  const p = up / (H * 0.55);

  if (g.mode === 'side') {
    // Oldalra húzás: előző app (jobbra) / visszalépés a következőre (balra)
    if (Math.abs(g.dx) < 70) return;
    const others = recents.filter(id => id !== current && isInstalled(id) && !apps[id].android);
    const next = g.dx > 0 ? others[0] : others[others.length - 1];
    if (!next) return;
    vibrate(12);
    openApp(next);
    contentEl.animate([{ transform: `translateX(${g.dx > 0 ? -40 : 40}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: SPRING_SOFT });
    return;
  }

  const switching = screenEl.classList.contains('gest-switch');
  screenEl.classList.remove('gesturing', 'gest-switch');
  winEl.style.transition = '';
  const from = winEl.style.transform;
  winEl.style.transform = '';
  winEl.style.borderRadius = '';

  if (switching) {
    // Megállás félúton: appváltó
    vibrate(20);
    window.gestureFrom = from;
    closeApp();
    openSwitcher();
  } else if (p > 0.22 || g.v < -0.7) {
    // Elég messzire vagy gyorsan felhúzva: haza
    window.gestureFrom = from;
    closeApp();
  } else {
    // Vissza az appba
    screenEl.classList.add('app-open');
    const a = winEl.animate([{ transform: from }, { transform: 'none' }], { duration: 420, easing: SPRING_SOFT });
    a.onfinish = () => winEl.classList.remove('anim');
  }
}
hb.addEventListener('pointerup', endGesture);
hb.addEventListener('pointercancel', endGesture);
// Gesztus után a csík „kattintása” ne csináljon semmit
hb.addEventListener('click', e => { if (Date.now() - gestUsed < 300) e.stopImmediatePropagation(); }, true);

// =====================================================================
//  2. Gyorsmenü: az ikon nyomva tartására
// =====================================================================
function quickActions(app) {
  const A = [];
  const go = (fn, delay = 120) => () => { openApp(app.id); setTimeout(fn, delay); };
  switch (app.id) {
    case 'phone':
      A.push(['keypad', 'Billentyűzet', go(() => $('[data-tab=keypad]')?.click())]);
      A.push(['user', 'Névjegyek', go(() => $('[data-tab=contacts]')?.click())]);
      A.push(['clock', 'Legutóbbiak', go(() => $('[data-tab=recents]')?.click())]);
      break;
    case 'messages':
      A.push(['message', 'Új üzenet', go(() => $('.chat-input input')?.focus())]);
      break;
    case 'clock':
      A.push(['timer', 'Időzítő 5 perc', () => { clockState.timerTotal = 300000; clockState.timerEnd = Date.now() + 300000; updateTimerRing(); notify(L('Óra', 'Clock'), L('Az időzítő elindult: 5 perc.', 'Timer started: 5 minutes.'), 'clock'); }]);
      A.push(['alarm', 'Ébresztő', go(() => $('[data-tab=alarm]')?.click())]);
      A.push(['clock', 'Stopper', go(() => $('[data-tab=sw]')?.click())]);
      break;
    case 'music':
      if (typeof music !== 'undefined') {
        A.push([music.playing ? 'pause' : 'play', music.playing ? 'Szünet' : 'Lejátszás', () => (music.playing ? musicPause() : musicPlay())]);
        A.push(['next', 'Következő dal', () => { musicSkip(1); if (!music.playing) musicPlay(); }]);
      }
      break;
    case 'notes':
      A.push(['notes', 'Új jegyzet', go(() => $('.n-new')?.click())]);
      break;
    case 'calendar':
      A.push(['plus', 'Új esemény', go(() => $('.ev-new')?.click())]);
      break;
    case 'camera':
      A.push(['camera', 'Fotó készítése', go(() => $('.shutter:not(:disabled)')?.click(), 1200)]);
      break;
    case 'settings':
      A.push(['wifi', cc.wifi ? 'Wi-Fi kikapcsolása' : 'Wi-Fi bekapcsolása', () => { cc.wifi = !cc.wifi; applyCC(); }]);
      A.push(['contrast', isDark() ? 'Világos mód' : 'Sötét mód', () => { settings.dark = !isDark(); settings.autoDark = false; saveSettings(); }]);
      A.push(['hand', 'Gesztusok', () => { window.settingsStartPage = 'gestures'; openApp('settings'); }]);
      break;
    case 'flashlight':
      A.push(['flashlight', 'Bekapcsolás', go(() => $('.torch-btn')?.click())]);
      break;
    case 'snake':
      A.push(['gamepad', 'Új játék', go(() => $('.g-start')?.click())]);
      break;
  }
  return A;
}

let qm = null;
function closeQuickMenu() {
  if (!qm) return;
  const m = qm;
  qm = null;
  document.removeEventListener('pointermove', m.onMove);
  m.el.classList.add('out');
  setTimeout(() => m.el.remove(), 220);
}

function showQuickMenu(b, x, y) {
  closeQuickMenu();
  const app = apps[b.dataset.app];
  if (!app) return;
  vibrate(25);
  const s = screenEl.getBoundingClientRect(), r = $('.icon', b).getBoundingClientRect();
  const items = quickActions(app);
  const extra = [];
  extra.push(['settings', 'Kezdőképernyő szerkesztése', () => enterEditMode(null)]);
  if (app.pkg) extra.push(['info', 'App infó', () => ANDROID.appInfo(app.pkg)]);
  if (removable(app.id) && b.closest('#app-grid')) extra.push(['trash', 'App eltávolítása', () => removeFromHome(b), 'danger']);

  // Előnézet: időjárásnál a mostani hőmérséklet
  let head = '';
  const wc = app.id === 'weather' && store.get('weatherCache', null);
  if (wc) head = `<div class="qm-head"><b>${Math.round(wc.data.current.temperature_2m)}°</b><span>${esc(wc.city)} · ${wInfo(wc.data.current.weather_code).text}</span></div>`;

  const row = ([i, t, , cls]) => `<button class="qm-item${cls ? ' ' + cls : ''}">${ic(i)}<span>${t}</span></button>`;
  const el = document.createElement('div');
  el.id = 'qmenu';
  el.innerHTML = `<div class="qm-card">${head}${items.length ? `<div class="qm-group">${items.map(row).join('')}</div>` : ''}<div class="qm-group">${extra.map(row).join('')}</div></div>`;
  screenEl.append(el);
  const all = [...items, ...extra];
  $$('.qm-item', el).forEach((btn, i) => (btn.onclick = e => { e.stopPropagation(); closeQuickMenu(); all[i][2](); }));
  el.addEventListener('click', e => { if (e.target === el) closeQuickMenu(); });

  // Az ikon éles másolata a homályos háttér fölött (az eredeti a kezdőképernyővel együtt elmosódik)
  const lift = document.createElement('div');
  lift.className = 'qm-icon app-icon'; // az app-icon osztály adja az ikon formáját
  lift.style.cssText = `left:${r.left - s.left}px;top:${r.top - s.top}px;width:${r.width}px;height:${r.height}px`;
  lift.innerHTML = $('.icon', b).outerHTML;
  el.append(lift);

  // Helyezés: az ikon alá, ha elfér; különben fölé. A menü mindig a kijelzőn belül marad.
  const card = $('.qm-card', el);
  const CW = 238, ch = card.scrollHeight;
  const left = Math.min(Math.max(12, r.left - s.left - 10), s.width - CW - 12);
  const below = r.bottom - s.top + 12;
  const top = below + ch < s.height - 40 ? below : r.top - s.top - ch - 12;
  card.style.left = left + 'px';
  card.style.top = top + 'px';
  card.style.transformOrigin = `${r.left - s.left - left + r.width / 2}px ${top > r.top - s.top ? 0 : ch}px`;

  // Ha nyomva tartás közben elhúzod az ujjad: szerkesztő mód, és húzhatod az ikont
  const onMove = e => {
    if (Math.hypot(e.clientX - x, e.clientY - y) < 14 || !(e.buttons & 1)) return;
    closeQuickMenu();
    if (b.closest('#app-grid')) enterEditMode(b, e.clientX, e.clientY);
  };
  document.addEventListener('pointermove', onMove);
  qm = { el, onMove };
}
document.addEventListener('keydown', e => { if (qm && e.key === 'Escape') { closeQuickMenu(); e.stopImmediatePropagation(); } }, true);
{
  const prevBack = window.cssosBack;
  window.cssosBack = () => (qm ? closeQuickMenu() : prevBack());
}

// =====================================================================
//  3. Varázskör: üres helyen nyomva tartva gyűrű alakú menü
// =====================================================================
const RADIAL = [
  ['camera', 'Kamera', () => openApp('camera')],
  ['flashlight', 'Zseblámpa', () => toggleTorch()],
  ['timer', 'Időzítő', () => { window.settingsStartPage = null; openApp('clock'); setTimeout(() => $('[data-tab=timer]')?.click(), 120); }],
  ['music', 'Zene', () => { if (isInstalled('music')) { music.playing ? musicPause() : musicPlay(); } else openApp('store'); }],
  ['search', 'Keresés', () => openSpot()],
  ['lock', 'Zárolás', () => lock()],
];
let rad = null;
const RAD_R = 92; // a gyűrű sugara képpontban

$('#page-apps').addEventListener('pointerdown', e => {
  if (!gestOn('radial') || e.button > 0 || current || locked || screenEl.classList.contains('editing')) return;
  if (e.target.closest('.app-icon, .widget, .mwidget, #dock, #spot-pill')) return;
  const start = { x: e.clientX, y: e.clientY, id: e.pointerId };
  const cancel = ev => { if (!ev || Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 10) { clearTimeout(t); document.removeEventListener('pointermove', cancel); document.removeEventListener('pointerup', cancel); } };
  const t = setTimeout(() => { cancel(); openRadial(start); }, 480);
  document.addEventListener('pointermove', cancel);
  document.addEventListener('pointerup', () => cancel());
});

function openRadial(start) {
  const s = screenEl.getBoundingClientRect();
  // A gyűrű ne lógjon ki a kijelzőről
  const cx = Math.min(Math.max(start.x - s.left, RAD_R + 34), s.width - RAD_R - 34);
  const cy = Math.min(Math.max(start.y - s.top, RAD_R + 70), s.height - RAD_R - 60);
  const el = document.createElement('div');
  el.id = 'radial';
  el.innerHTML = `<div class="rad-ring" style="left:${cx}px;top:${cy}px">
    <div class="rad-core"><span class="rad-label">${L('Húzd valamelyik felé', 'Drag towards one')}</span></div>
    ${RADIAL.map(([i, t], k) => {
      const a = (k / RADIAL.length) * Math.PI * 2 - Math.PI / 2;
      return `<div class="rad-item" style="--x:${Math.cos(a) * RAD_R}px;--y:${Math.sin(a) * RAD_R}px;--k:${k}">${ic(i)}</div>`;
    }).join('')}
  </div>`;
  screenEl.append(el);
  vibrate(30);
  try { el.setPointerCapture(start.id); } catch {}
  rad = { el, cx: cx + s.left, cy: cy + s.top, sel: -1, labels: RADIAL.map(r => trText(r[1])) };
  const label = $('.rad-label', el);
  const move = e => {
    const dx = e.clientX - rad.cx, dy = e.clientY - rad.cy;
    let sel = -1;
    if (Math.hypot(dx, dy) > 34) {
      const a = (Math.atan2(dy, dx) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
      sel = Math.round(a / ((Math.PI * 2) / RADIAL.length)) % RADIAL.length;
    }
    if (sel === rad.sel) return;
    rad.sel = sel;
    $$('.rad-item', el).forEach((it, k) => it.classList.toggle('on', k === sel));
    label.textContent = sel < 0 ? L('Húzd valamelyik felé', 'Drag towards one') : rad.labels[sel];
    if (sel >= 0) vibrate(8);
  };
  const up = () => {
    const sel = rad.sel;
    el.classList.add('out');
    setTimeout(() => el.remove(), 250);
    rad = null;
    if (sel >= 0) RADIAL[sel][2]();
  };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up, { once: true });
  el.addEventListener('pointercancel', up, { once: true });
  // Egérrel (gépen) a felengedés máshol is történhet
  document.addEventListener('pointerup', () => rad && up(), { once: true });
}

// =====================================================================
//  4. Dupla koppintás: kijelző ki
// =====================================================================
let lastTap = { t: 0, x: 0, y: 0 };
function dblTap(e) {
  if (!gestOn('dblSleep')) return;
  if (e.target.closest('button, input, .app-icon, .widget, .mwidget, .tw, .lib-row, #dock, .nc-card, #lock-notifs, #lock-widgets, .lw')) return;
  if (lockEl.classList.contains('pin-mode')) return;
  const now = Date.now();
  if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
    lastTap.t = 0;
    if (!screenEl.classList.contains('off')) power();
    return;
  }
  lastTap = { t: now, x: e.clientX, y: e.clientY };
}
$('#home').addEventListener('pointerup', e => { if (!current && !locked) dblTap(e); });
lockEl.addEventListener('pointerup', e => { if (!lockEl.classList.contains('dragging')) dblTap(e); });

// =====================================================================
//  5. Folyékony üveg: a csillanás a telefon dőlését (gépen az egeret) követi
// =====================================================================
let lightRaf = 0, lightNext = null;
function setLight(x, y) {
  lightNext = [Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y))];
  if (lightRaf) return;
  lightRaf = requestAnimationFrame(() => {
    lightRaf = 0;
    screenEl.style.setProperty('--lx', lightNext[0].toFixed(1) + '%');
    screenEl.style.setProperty('--ly', lightNext[1].toFixed(1) + '%');
  });
}
const lightOff = () => motionOff() || fxFast() || fxMid();
// Gépen: az egér helye a kijelzőn
screenEl.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || lightOff()) return;
  const r = screenEl.getBoundingClientRect();
  setLight(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100 - 20);
});
// Telefonon: a dőlés (balra-jobbra és előre-hátra)
window.addEventListener('deviceorientation', e => {
  if (e.gamma === null || lightOff()) return;
  setLight(50 + e.gamma * 1.6, 20 + (e.beta - 45) * 1.2);
});
