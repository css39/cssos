'use strict';
// =====================================================================
//  CSSOS — „wow” funkciók
//  Fénygyűrű-panel, Aurora élő háttér, érintés-fény, kezdőképernyő-szerkesztés,
//  zenére táncoló Fénygyűrű
// =====================================================================

if (settings.touchLight === undefined) settings.touchLight = true;

// =====================================================================
//  Aurora: lassan úszó, világító színfelhők (a kezdő- és a zárolási képernyőn)
// =====================================================================
function makeAurora() {
  const fx = document.createElement('div');
  fx.className = 'aurora-fx';
  fx.innerHTML = '<i></i><i></i><i></i><i></i><i></i><b></b>';
  return fx;
}
screenEl.prepend(makeAurora());
lockEl.prepend(makeAurora());

// =====================================================================
//  Érintés-fény: ahova koppintasz, egy fénygyűrű terjed szét
// =====================================================================
function touchLight(e) {
  if (!settings.touchLight || motionOff() || current) return;
  const s = screenEl.getBoundingClientRect();
  const r = document.createElement('span');
  r.className = 'touch-ring';
  r.style.left = e.clientX - s.left + 'px';
  r.style.top = e.clientY - s.top + 'px';
  screenEl.append(r);
  r.addEventListener('animationend', () => r.remove());
}
$('#home').addEventListener('pointerdown', touchLight);
lockEl.addEventListener('pointerdown', e => { if (!lockEl.classList.contains('pin-mode')) touchLight(e); });

// =====================================================================
//  Fénygyűrű-panel: a gyűrűre koppintva élő panellé nyílik
// =====================================================================
const rp = document.createElement('div');
rp.id = 'ring-panel';
screenEl.append(rp);
let rpOpen = false, rpTimer = null, rpIdle = null;

function rpSections() {
  const out = [];
  const now = Date.now();
  // Időzítő
  if (clockState.timerEnd > now) {
    const left = Math.ceil((clockState.timerEnd - now) / 1000);
    const p = (clockState.timerEnd - now) / (clockState.timerTotal || 1);
    out.push(`<div class="rp-sec rp-timer"><span class="rp-dial" style="--p:${(p * 100).toFixed(1)}">${ic('timer')}</span>
      <div class="grow"><small>Időzítő</small><b>${pad(Math.floor(left / 60))}:${pad(left % 60)}</b></div>
      <button data-rp="plus">+1 perc</button><button data-rp="stop" class="rp-red">${ic('close')}</button></div>`);
  }
  // Zene
  if (typeof music !== 'undefined' && isInstalled('music') && (music.playing || music.pos > 0)) {
    const s = SONGS[music.song];
    out.push(`<div class="rp-sec rp-music"><span class="rp-disc${music.playing ? ' on' : ''}" style="--c1:${s.color[0]};--c2:${s.color[1]}"></span>
      <div class="grow"><small>${esc(s.artist)}</small><b>${esc(s.title)}</b><div class="rp-eq${music.playing ? ' on' : ''}"><i></i><i></i><i></i><i></i></div></div>
      <button data-rp="prev">${ic('prev')}</button><button data-rp="play">${ic(music.playing ? 'pause' : 'play')}</button><button data-rp="next">${ic('next')}</button></div>`);
  }
  // Hangfelvétel
  if (screenEl.classList.contains('ring-mic')) out.push(`<div class="rp-sec"><span class="rp-dot rp-rec"></span><div class="grow"><small>Diktafon</small><b>Felvétel folyamatban</b></div></div>`);
  // Töltés
  if (batteryLevel !== null && batteryCharging) {
    const pct = Math.round(batteryLevel * 100);
    out.push(`<div class="rp-sec"><span class="rp-dial rp-green" style="--p:${pct}">${ic('bolt')}</span><div class="grow"><small>Töltés</small><b>${pct}%</b></div></div>`);
  }
  // Következő ébresztő
  if (typeof getAlarms === 'function') {
    const next = getAlarms().filter(a => a.on).map(nextRing).filter(Boolean).sort((a, b) => a - b)[0];
    if (next) out.push(`<div class="rp-sec"><span class="rp-ico">${ic('alarm')}</span><div class="grow"><small>Következő ébresztő</small><b>${fmtTime(next)} <span class="rp-sub">${untilText(next)}</span></b></div></div>`);
  }
  // Ha semmi sem fut: idő, dátum, akku
  if (!out.length) {
    const d = new Date();
    out.push(`<div class="rp-sec rp-idle"><div class="grow"><small>${cap(d.toLocaleDateString(LOC, { weekday: 'long', month: 'long', day: 'numeric' }))}</small><b>${fmtTime(d, true)}</b></div>
      ${batteryLevel !== null ? `<span class="rp-batt"><i style="width:${Math.round(batteryLevel * 100)}%"></i></span><small class="rp-sub">${Math.round(batteryLevel * 100)}%</small>` : ''}</div>`);
  }
  return out.join('');
}

function renderRP() {
  const html = rpSections();
  if (rp.dataset.html === html) return;
  rp.dataset.html = html;
  rp.innerHTML = `<div class="rp-in">${html}</div>`;
  fitRP();
}

function openRP() {
  if (rpOpen) return;
  rpOpen = true;
  renderRP();
  // A zárt (gyűrűméretű) állapotból nagyítással nyílik — ehhez a mostani méretből számoljuk a kicsinyítést
  rp.style.transition = "none";
  fitRP();
  void rp.offsetWidth;
  rp.style.transition = "";
  screenEl.classList.add("rp-open");
  vibrate(15);
  clearInterval(rpTimer);
  rpTimer = setInterval(renderRP, 500);
  bumpRP();
}
function closeRP() {
  if (!rpOpen) return;
  rpOpen = false;
  screenEl.classList.remove('rp-open');
  clearInterval(rpTimer);
  clearTimeout(rpIdle);
}
function bumpRP() {
  clearTimeout(rpIdle);
  rpIdle = setTimeout(closeRP, 6000); // 6 mp tétlenség után visszahúzódik a gyűrűbe
}

ringEl.addEventListener('click', e => { e.stopPropagation(); rpOpen ? closeRP() : openRP(); });
rp.addEventListener('click', e => {
  e.stopPropagation();
  bumpRP();
  const a = e.target.closest('[data-rp]')?.dataset.rp;
  if (!a) return;
  if (a === 'play') music.playing ? musicPause() : musicPlay();
  else if (a === 'prev') musicSkip(-1);
  else if (a === 'next') musicSkip(1);
  else if (a === 'plus') { clockState.timerEnd += 60000; clockState.timerTotal += 60000; updateTimerRing(); }
  else if (a === 'stop') { clockState.timerEnd = 0; updateTimerRing(); }
  delete rp.dataset.html;
  renderRP();
});
// Kattintás bárhova máshova: a panel visszahúzódik
screenEl.addEventListener('pointerdown', e => { if (rpOpen && !e.target.closest('#ring-panel, #cam-ring')) closeRP(); }, true);
document.addEventListener('keydown', e => { if (rpOpen && e.key === 'Escape') { closeRP(); e.stopImmediatePropagation(); } }, true);

// =====================================================================
//  Kezdőképernyő-szerkesztés: remegő ikonok, átrendezés húzással, eltávolítás
// =====================================================================
const doneBtn = document.createElement('button');
doneBtn.id = 'edit-done';
doneBtn.textContent = 'Kész';
$('#home').append(doneBtn);

function removable(id) { return apps[id] && (apps[id].optional || apps[id].pkg); }

function enterEditMode(fromIcon, x, y) {
  if (screenEl.classList.contains('editing')) return;
  vibrate(35);
  screenEl.classList.add('editing');
  $('#app-grid').style.transform = '';
  // Eltávolítás jel a letölthető és az Android-appokon
  $$('#app-grid .app-icon').forEach((b, i) => {
    b.style.setProperty('--w', (i % 3) * 0.07 + 's');
    if (removable(b.dataset.app) && !$('.del-badge', b)) {
      const d = document.createElement('i');
      d.className = 'del-badge';
      d.innerHTML = ic('close');
      d.addEventListener('pointerdown', e => e.stopPropagation());
      d.addEventListener('click', e => { e.stopPropagation(); removeFromHome(b); });
      $('.icon', b).append(d);
    }
  });
  if (fromIcon && fromIcon.closest('#app-grid')) startIconDrag(fromIcon, x, y);
}

function exitEditMode() {
  screenEl.classList.remove('editing');
  $$('.del-badge').forEach(d => d.remove());
  saveHomeOrder();
}
doneBtn.addEventListener('click', exitEditMode);
$('#homebar').addEventListener('click', e => { if (screenEl.classList.contains('editing')) { exitEditMode(); e.stopImmediatePropagation(); } }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && screenEl.classList.contains('editing')) { exitEditMode(); e.stopImmediatePropagation(); } }, true);
// Üres helyre koppintva is véget ér a szerkesztés
$('#home').addEventListener('click', e => {
  if (screenEl.classList.contains('editing') && !e.target.closest('.app-icon, #edit-done') && !dragging && Date.now() - lastDrop > 400) exitEditMode();
});

function saveHomeOrder() {
  store.set('homeOrder', $$('#app-grid .app-icon').map(b => b.dataset.app));
}

function removeFromHome(b) {
  const app = apps[b.dataset.app];
  if (!app) return;
  if (app.pkg) { ANDROID.uninstall(app.pkg); return; } // az Android saját eltávolító ablaka jön
  if (!confirm(`Eltávolítod: ${app.name}?\n\nAz Áruházból bármikor újra letöltheted.`)) return;
  // Az ikon összezsugorodik és eltűnik, a többi a helyére csúszik
  const before = rects();
  b.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }], { duration: 250, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
    const keep = new Map(before);
    b.remove();
    flip(keep);
    installed = installed.filter(x => x !== app.id);
    store.set('installed', installed);
    recents = recents.filter(x => x !== app.id);
    if (app.id === 'music') musicPause();
    saveHomeOrder();
  };
}

// FLIP: elmentjük az ikonok helyét, átrendezzük őket, majd az új helyükre „úsztatjuk” őket
function rects() { return new Map($$('#app-grid .app-icon').map(b => [b, b.getBoundingClientRect()])); }
function flip(before, skip) {
  $$('#app-grid .app-icon').forEach(b => {
    if (b === skip) return;
    const old = before.get(b);
    if (!old) return;
    const now = b.getBoundingClientRect();
    const dx = old.left - now.left, dy = old.top - now.top;
    if (dx || dy) b.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 420, easing: SPRING_SOFT });
  });
}

let dragging = null, lastDrop = 0;
function startIconDrag(b, x, y) {
  const r = b.getBoundingClientRect(), s = screenEl.getBoundingClientRect();
  const ghost = b.cloneNode(true);
  ghost.classList.add('drag-ghost');
  ghost.style.width = r.width + 'px';
  ghost.style.left = r.left - s.left + 'px';
  ghost.style.top = r.top - s.top + 'px';
  screenEl.append(ghost);
  b.classList.add('drag-src');
  dragging = { b, ghost, ox: x - r.left, oy: y - r.top, sx: s.left, sy: s.top, moved: false };
}

document.addEventListener('pointermove', e => {
  if (!dragging) return;
  const d = dragging;
  d.moved = true;
  d.ghost.style.left = e.clientX - d.ox - d.sx + 'px';
  d.ghost.style.top = e.clientY - d.oy - d.sy + 'px';
  // Melyik ikon fölött van az ujj?
  d.ghost.style.pointerEvents = 'none';
  const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('#app-grid .app-icon');
  if (over && over !== d.b) {
    const before = rects();
    const items = $$('#app-grid .app-icon');
    const after = items.indexOf(over) > items.indexOf(d.b);
    over.parentNode.insertBefore(d.b, after ? over.nextSibling : over);
    flip(before, d.b);
    vibrate(8);
  }
});

function endIconDrag() {
  if (!dragging) return;
  const d = dragging;
  dragging = null;
  lastDrop = Date.now();
  // A „lebegő” ikon a helyére ugrik
  const target = d.b.getBoundingClientRect(), s = screenEl.getBoundingClientRect();
  const from = { left: d.ghost.style.left, top: d.ghost.style.top };
  d.ghost.animate([{ left: from.left, top: from.top, transform: 'scale(1.15)' }, { left: target.left - s.left + 'px', top: target.top - s.top + 'px', transform: 'scale(1)' }],
    { duration: 380, easing: SPRING_SOFT, fill: 'forwards' }).onfinish = () => {
    d.ghost.remove();
    d.b.classList.remove('drag-src');
  };
  saveHomeOrder();
}
document.addEventListener('pointerup', endIconDrag);
document.addEventListener('pointercancel', endIconDrag);

// Szerkesztő módban egy ikon megfogása (nyomva tartás nélkül is) húzást indít
$('#app-grid').addEventListener('pointerdown', e => {
  if (!screenEl.classList.contains('editing') || e.target.closest('.del-badge')) return;
  const b = e.target.closest('.app-icon');
  if (b) { e.preventDefault(); startIconDrag(b, e.clientX, e.clientY); }
});

// =====================================================================
//  Zenére táncoló Fénygyűrű
// =====================================================================
// Csak akkor fut, amikor szól a zene (különben fölöslegesen merítené az akkut)
let beatRunning = false;
const beatData = new Uint8Array(16);
function startBeat() {
  if (beatRunning) return;
  beatRunning = true;
  const loop = () => {
    if (typeof music === 'undefined' || !music.playing || !music.analyser || motionOff()) {
      beatRunning = false;
      ringEl.style.removeProperty('--beat');
      return;
    }
    music.analyser.getByteFrequencyData(beatData);
    const level = beatData.slice(1, 6).reduce((a, b) => a + b, 0) / (5 * 255);
    ringEl.style.setProperty('--beat', (1 + level * 0.45).toFixed(3));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// A panel magassága a tartalomhoz igazodik (így rugózva tud nőni)
function fitRP() {
  const inner = $('.rp-in', rp);
  if (!rpOpen || !inner) return;
  const h = inner.offsetHeight;
  rp.style.height = h + 'px';
  // Zárt állapotban a panel a 36 px-es gyűrű méretére kicsinyítve „bújik” a gyűrű mögé
  rp.style.setProperty('--sx', (36 / rp.offsetWidth).toFixed(4));
  rp.style.setProperty('--sy', (36 / h).toFixed(4));
}
