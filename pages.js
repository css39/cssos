'use strict';
// =====================================================================
//  CSSOS 2.0 — kezdőképernyő-oldalak
//  0: „Ma” nézet (widgetek)   1: appok   2: Alkalmazástár
//  + widgetek a zárolási képernyőn, + visszalépés a képernyő bal széléről húzva
// =====================================================================

window.homePage = 1;
const pagesEl = $('#pages'), pagerEl = $('#pager');

function goPage(i, instant) {
  i = Math.max(0, Math.min(2, i));
  const changed = i !== window.homePage;
  window.homePage = i;
  if (instant) pagerEl.style.transition = 'none';
  pagerEl.style.transform = '';
  pagerEl.style.setProperty('--pg', i);
  if (instant) { void pagerEl.offsetWidth; pagerEl.style.transition = ''; }
  $$('#page-dots i').forEach(d => d.classList.toggle('on', +d.dataset.pg === i));
  screenEl.classList.toggle('on-lib', i === 2);
  screenEl.classList.toggle('on-today', i === 0);
  if (i === 0) renderToday();
  if (i === 2) renderLibrary();
  if (changed) vibrate(6);
}

// ---------- Lapozás ujjal / egérrel ----------
let swipe = null, swipedAt = 0;
pagesEl.addEventListener('pointerdown', e => {
  if (current || locked || screenEl.classList.contains('editing') || e.target.closest('input, .mwidget')) return;
  swipe = { x: e.clientX, y: e.clientY, dir: null, t: performance.now(), id: e.pointerId };
});
pagesEl.addEventListener('pointermove', e => {
  if (!swipe) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  if (!swipe.dir) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    swipe.dir = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (swipe.dir === 'x') { pagesEl.setPointerCapture(swipe.id); pagerEl.style.transition = 'none'; }
  }
  if (swipe.dir !== 'x') return;
  const W = pagesEl.clientWidth;
  // A szélső oldalakon túl csak „gumiszerűen” enged
  const atEdge = (window.homePage === 0 && dx > 0) || (window.homePage === 2 && dx < 0);
  const off = atEdge ? Math.sign(dx) * Math.sqrt(Math.abs(dx)) * 6 : dx;
  pagerEl.style.transform = `translateX(${-window.homePage * W + off}px)`;
  swipe.dx = dx;
});
function endSwipe() {
  if (!swipe) return;
  const s = swipe;
  swipe = null;
  if (s.dir !== 'x') return;
  swipedAt = Date.now();
  pagerEl.style.transition = '';
  const W = pagesEl.clientWidth, dx = s.dx || 0;
  const v = dx / Math.max(1, performance.now() - s.t); // px/ms
  let i = window.homePage;
  if (dx < -W * 0.25 || v < -0.5) i++;
  else if (dx > W * 0.25 || v > 0.5) i--;
  goPage(i);
}
pagesEl.addEventListener('pointerup', endSwipe);
pagesEl.addEventListener('pointercancel', endSwipe);
// Lapozás után az ikonra „kattintás” ne nyisson appot
pagesEl.addEventListener('click', e => { if (Date.now() - swipedAt < 250) { e.stopPropagation(); e.preventDefault(); } }, true);
$$('#page-dots i').forEach(d => (d.onclick = () => goPage(+d.dataset.pg)));
// Gépen: nyilakkal és vízszintes görgetéssel is
document.addEventListener('keydown', e => {
  if (current || locked || /INPUT|TEXTAREA/.test(document.activeElement?.tagName) || screenEl.classList.contains('cc-open')) return;
  if (e.key === 'ArrowLeft') goPage(window.homePage - 1);
  else if (e.key === 'ArrowRight') goPage(window.homePage + 1);
});
let wheelLock = 0;
pagesEl.addEventListener('wheel', e => {
  if (Math.abs(e.deltaX) < 30 || Date.now() < wheelLock) return;
  wheelLock = Date.now() + 500;
  goPage(window.homePage + Math.sign(e.deltaX));
}, { passive: true });
// A Home csík a középső (appok) oldalra visz vissza
$('#homebar').addEventListener('click', () => { if (!current && !locked && window.homePage !== 1) goPage(1); });

// =====================================================================
//  „Ma” nézet — widgetek
// =====================================================================
function card(cls, html, open) {
  return `<button class="tw ${cls}"${open ? ` data-open="${open}"` : ''}>${html}</button>`;
}

function renderToday() {
  const el = $('#page-today');
  const d = new Date();
  const h = d.getHours();
  const greet = h < 5 ? 'Jó éjszakát' : h < 10 ? 'Jó reggelt' : h < 18 ? 'Jó napot' : 'Jó estét';
  const parts = [];

  // Időjárás
  const wc = store.get('weatherCache', null);
  if (wc) {
    const c = wc.data.current, info = wInfo(c.weather_code, c.is_day);
    parts.push(card('tw-wide tw-weather', `<div class="tw-wx" style="background:${info.bg}">
      <div><small>${esc(wc.city)}</small><b>${Math.round(c.temperature_2m)}°</b><span>${info.text}</span></div>
      <span class="tw-wx-ic">${ic(info.icon)}</span>
      <em>Max ${Math.round(wc.data.daily.temperature_2m_max[0])}° · Min ${Math.round(wc.data.daily.temperature_2m_min[0])}°</em></div>`, 'weather'));
  } else {
    parts.push(card('tw-wide', `<span class="tw-ico" style="background:linear-gradient(135deg,#2f80ed,#56ccf2)">${ic('partly')}</span><div class="tw-t"><b>Időjárás</b><small>Koppints a mai előrejelzéshez</small></div>`, 'weather'));
  }

  // Mai események
  const today = dateKey(d);
  const evs = getEvents().filter(e => e.date === today).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  parts.push(card('tw-cal', `<small class="tw-h" style="color:#ff3b5c">${cap(d.toLocaleDateString(LOC, { weekday: 'long' }))}</small><b class="tw-big">${d.getDate()}</b>
    ${evs.length ? evs.slice(0, 2).map(e => `<span class="tw-ev"><i></i>${e.time || 'Egész nap'} ${esc(e.title)}</span>`).join('') : '<span class="tw-sub">Nincs mai esemény</span>'}`, 'calendar'));

  // Akkumulátor
  const pct = batteryLevel === null ? null : Math.round(batteryLevel * 100);
  parts.push(card('tw-batt', `<span class="tw-ring" style="--p:${pct ?? 0};--c:${batteryCharging ? '#34c759' : pct !== null && pct < 20 ? '#ff3b30' : 'var(--accent)'}">${ic(batteryCharging ? 'bolt' : 'device')}</span>
    <b>${pct === null ? '–' : pct + '%'}</b><small class="tw-sub">${batteryCharging ? 'Töltés' : 'Akkumulátor'}</small>`, null));

  // Következő ébresztő
  const next = getAlarms().filter(a => a.on).map(nextRing).filter(Boolean).sort((a, b) => a - b)[0];
  parts.push(card('tw-alarm', `<span class="tw-ico" style="background:linear-gradient(135deg,#2b2f3a,#11131a);color:#ffb547">${ic('alarm')}</span>
    <small class="tw-h">Ébresztő</small>${next ? `<b>${fmtTime(next)}</b><small class="tw-sub">${untilText(next)}</small>` : '<span class="tw-sub">Nincs ébresztő beállítva.</span>'}`, 'clock'));

  // Képernyőidő
  const used = Object.entries(usageLive()).filter(([id]) => apps[id]).sort((a, b) => b[1] - a[1]);
  const total = used.reduce((a, [, ms]) => a + ms, 0);
  parts.push(card('tw-time', `<small class="tw-h">Képernyőidő</small><b>${total ? fmtDur(total) : '0 perc'}</b>
    <span class="tw-bars">${used.slice(0, 3).map(([id, ms]) => `<i style="width:${Math.max(6, (ms / (used[0][1] || 1)) * 100)}%;background:${apps[id].bg}"></i>`).join('')}</span>`, null));

  // Legutóbbi jegyzet
  const note = store.get('notes', []).filter(n => n.text.trim()).sort((a, b) => b.t - a.t)[0];
  parts.push(card('tw-note', `<small class="tw-h" style="color:#b88a00">Jegyzetek</small><span class="tw-notetext">${note ? esc(note.text.trim().slice(0, 90)) : 'Még nincsenek jegyzetek.'}</span>`, 'notes'));

  el.innerHTML = `<div class="tw-head"><small>${greet}${settings.userName ? ', ' + esc(settings.userName) : ''}!</small><b>${cap(d.toLocaleDateString(LOC, { month: 'long', day: 'numeric' }))}</b></div>
    <div class="tw-grid">${parts.join('')}<div class="mwidget tw-music" id="mw-today" hidden></div></div>`;
  $$('[data-open]', el).forEach(b => (b.onclick = () => openApp(b.dataset.open)));
  updateMusicWidgets();
}

// =====================================================================
//  Alkalmazástár — minden app egy helyen, ábécérendben, kereséssel
// =====================================================================
let libQuery = '';
function renderLibrary() {
  const el = $('#page-lib');
  if (!$('.lib-q', el)) {
    el.innerHTML = `<div class="lib-head"><b>Alkalmazástár</b></div>
      <label class="lib-search">${ic('search')}<input class="lib-q" placeholder="Keresés az appok között" autocomplete="off"></label>
      <div class="lib-body"></div>`;
    $('.lib-q', el).oninput = e => { libQuery = e.target.value; renderLibrary(); };
  }
  const q = norm(libQuery);
  const all = Object.values(apps).filter(a => isInstalled(a.id))
    .map(a => ({ a, name: appName(a) }))
    .filter(x => !q || norm(x.name).includes(q) || norm(x.a.name).includes(q))
    .sort((x, y) => x.name.localeCompare(y.name, LOC));
  const rec = q ? [] : recents.filter(isInstalled).slice(0, 4).map(id => apps[id]);
  let letter = '';
  const rows = all.map(({ a, name }) => {
    const L1 = name[0].toUpperCase();
    const head = L1 !== letter ? `<div class="lib-letter">${(letter = L1)}</div>` : '';
    const pin = a.pkg ? `<button class="lib-pin${isPinned(a.id) ? ' on' : ''}" data-pin="${a.id}" aria-label="Kitűzés">${ic(isPinned(a.id) ? 'star' : 'plus')}</button>` : '';
    return `${head}<div class="lib-row"><button class="lib-open" data-open="${a.id}"><span class="lib-ic" style="background:${a.bg};color:${a.fg || '#fff'}">${appIcon(a)}</span><span class="grow" data-notr>${esc(name)}</span></button>${pin}</div>`;
  }).join('');
  $('.lib-body', el).innerHTML = `
    ${rec.length ? `<div class="lib-label">Legutóbbi appok</div><div class="lib-rec">${rec.map(a => `<button class="lib-open lib-big" data-open="${a.id}"><span class="lib-ic" style="background:${a.bg};color:${a.fg || '#fff'}">${appIcon(a)}</span><small>${esc(appName(a))}</small></button>`).join('')}</div>` : ''}
    <div class="lib-label">${q ? 'Találatok' : 'Minden app'} (${all.length})</div>
    ${rows || '<div class="empty">Nincs találat.</div>'}
    ${ANDROID ? '<p class="lib-tip">A csillaggal jelölt Android-appok a kezdőképernyőn is megjelennek. A + gombbal tűzhetsz ki újat.</p>' : ''}`;
  $$('[data-open]', el).forEach(b => (b.onclick = () => openApp(b.dataset.open)));
  $$('[data-pin]', el).forEach(b => (b.onclick = () => { setPinned(b.dataset.pin, !isPinned(b.dataset.pin)); renderLibrary(); }));
}

// =====================================================================
//  Widgetek a zárolási képernyőn
// =====================================================================
function renderLockWidgets() {
  const box = $('#lock-widgets');
  const items = [];
  const wc = store.get('weatherCache', null);
  if (wc) {
    const c = wc.data.current, info = wInfo(c.weather_code, c.is_day);
    items.push(`<span class="lw">${ic(info.icon)}<b>${Math.round(c.temperature_2m)}°</b></span>`);
  }
  if (batteryLevel !== null) items.push(`<span class="lw">${ic(batteryCharging ? 'bolt' : 'battery')}<b>${Math.round(batteryLevel * 100)}%</b></span>`);
  // A mai következő esemény, vagy a következő ébresztő
  const now = new Date(), k = dateKey(now), hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const ev = getEvents().filter(e => e.date === k && e.time && e.time >= hm).sort((a, b) => a.time.localeCompare(b.time))[0];
  if (ev) items.push(`<span class="lw lw-wide">${ic('date')}<b>${ev.time}</b><span data-notr>${esc(ev.title)}</span></span>`);
  else {
    const next = getAlarms().filter(a => a.on).map(nextRing).filter(Boolean).sort((a, b) => a - b)[0];
    if (next) items.push(`<span class="lw">${ic('alarm')}<b>${fmtTime(next)}</b></span>`);
  }
  const html = items.join('');
  if (box.innerHTML !== html) box.innerHTML = html;
}

// =====================================================================
//  Visszalépés: a képernyő bal széléről befelé húzva
// =====================================================================
const edgeArrow = document.createElement('div');
edgeArrow.id = 'edge-arrow';
edgeArrow.innerHTML = ic('chevLeft');
screenEl.append(edgeArrow);
let edge = null;
screenEl.addEventListener('pointerdown', e => {
  if (!current || locked) return;
  const s = screenEl.getBoundingClientRect();
  if (e.clientX - s.left > 22) return;
  edge = { x: e.clientX, y: e.clientY - s.top, dx: 0, id: e.pointerId };
  edgeArrow.style.top = edge.y + 'px';
}, true);
document.addEventListener('pointermove', e => {
  if (!edge) return;
  edge.dx = Math.max(0, e.clientX - edge.x);
  const p = Math.min(1, edge.dx / 90);
  edgeArrow.style.transform = `translate(${p * 46 - 46}px, -50%) scale(${0.6 + p * 0.4})`;
  edgeArrow.style.opacity = p;
  edgeArrow.classList.toggle('ready', p >= 1);
});
function endEdge() {
  if (!edge) return;
  const go = edge.dx >= 90;
  edge = null;
  edgeArrow.style.transform = '';
  edgeArrow.style.opacity = '';
  edgeArrow.classList.remove('ready');
  if (go) { vibrate(10); window.cssosBack(); }
}
document.addEventListener('pointerup', endEdge);
document.addEventListener('pointercancel', endEdge);

// =====================================================================
//  Frissítés: percenként, és amikor fontos adat változik
// =====================================================================
let lastMin = '';
setInterval(() => {
  const m = new Date().getMinutes();
  if (m === lastMin) return;
  lastMin = m;
  renderLockWidgets();
  if (window.homePage === 0) renderToday();
}, 1000);
window.addEventListener('load', () => {
  goPage(1, true);
  renderToday();
  renderLockWidgets();
  setTimeout(renderLockWidgets, 1500); // ha az akku adata később érkezik
});
