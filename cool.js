'use strict';
// =====================================================================
//  CSSOS — menő funkciók
//  Kereső, okos asszisztens, zene-widget, konfetti, töltés-animáció
// =====================================================================

// Ékezetek nélküli kisbetűs alak az összehasonlításhoz („Zenét” → „zenet”)
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// ---------------------------------------------------------------- Konfetti
function confetti() {
  if (settings.reduceMotion || saverOn()) return;
  const cv = document.createElement('canvas');
  cv.className = 'confetti';
  screenEl.append(cv);
  const w = (cv.width = screenEl.clientWidth), h = (cv.height = screenEl.clientHeight);
  const ctx = cv.getContext('2d');
  const COLORS = [...ACCENTS, '#ffd60a', '#ffffff'];
  const parts = Array.from({ length: 140 }, () => ({
    x: w / 2 + (Math.random() - 0.5) * 60, y: h * 0.35,
    vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
    s: 5 + Math.random() * 6, c: pick(COLORS),
  }));
  const start = performance.now();
  const frame = now => {
    const t = now - start;
    ctx.clearRect(0, 0, w, h);
    parts.forEach(p => {
      p.vy += 0.35; p.vx *= 0.99;
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / 2200);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    });
    if (t < 2200) requestAnimationFrame(frame);
    else cv.remove();
  };
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- Töltés-animáció
function chargeAnimation(level) {
  const pct = Math.round(level * 100);
  const el = document.createElement('div');
  el.className = 'charge-anim';
  el.innerHTML = `<div class="ca-ring" style="--p:${pct}"><div class="ca-in">${ic('bolt')}<b>${pct}%</b></div></div><span>Töltés</span>`;
  screenEl.append(el);
  beep(660, 0.08); setTimeout(() => beep(990, 0.12), 100);
  vibrate(40);
  setTimeout(() => el.classList.add('out'), 1900);
  setTimeout(() => el.remove(), 2400);
}

// ---------------------------------------------------------------- Okos asszisztens
// Felismeri a parancsokat, végre is hajtja őket, és visszaadja a választ.
// Ha a szöveg nem parancs, null-t ad vissza (akkor a sima csevegés válaszol).
function findAppByName(term) {
  const t = norm(term).replace(/^(a|az)\s+/, '');
  if (t.length < 2) return null;
  let best = null;
  Object.values(apps).forEach(a => {
    if (!isInstalled(a.id)) return;
    const n = [norm(a.name), norm(appName(a))].find(x => t.startsWith(x) || x.startsWith(t)) || norm(a.name);
    if ((t.startsWith(n) || n.startsWith(t)) && (!best || n.length > norm(best.name).length)) best = a;
  });
  return best;
}

function assistantCommand(text) {
  const t = norm(enCommand(norm(text))); // angol parancsokat is megért
  const later = fn => setTimeout(fn, 700); // hogy előbb a válasz látsszon

  if (/^(mit tudsz|segits|segitseg|help|parancsok)/.test(t)) {
    return 'Ezeket tudom:\n• „nyisd meg a zenét”\n• „időzítő 5 perc”\n• „sötét mód” / „világos mód”\n• „játssz zenét” / „állítsd le a zenét”\n• „zseblámpa”\n• „ne zavarj”\n• „új háttérkép”\n• „fényerő 50”\n• „zárold a telefont”\n• „bulizzunk” 🎉\n• számolás, pl. „12*7”, és vicc is!';
  }

  // Időzítő: „időzítő 5 perc”, „szólj 30 másodperc múlva”
  const tm = t.match(/(\d+)\s*(perc|p\b|masodperc|mp|ora)/);
  if (tm && /(idozito|szolj|ebressz|ebresszt|timer|allits)/.test(t)) {
    const n = +tm[1], unit = tm[2];
    const sec = unit.startsWith('o') ? n * 3600 : unit.startsWith('p') ? n * 60 : n;
    clockState.timerTotal = sec * 1000;
    clockState.timerEnd = Date.now() + clockState.timerTotal;
    updateTimerRing();
    return `Rendben, ${n} ${unit.startsWith('o') ? 'óra' : unit.startsWith('p') ? 'perc' : 'másodperc'} múlva szólok! ⏰ A Fénygyűrű mutatja, mennyi van hátra.`;
  }

  // Zene
  if (/(allitsd le|kapcsold ki|allj|stop|szunet|halkits).*zen|zen.*(le|stop|ki)$/.test(t)) {
    if (typeof musicPause === 'function') musicPause();
    return 'Leállítottam a zenét. 🔇';
  }
  if (/(jatssz|inditsd|kapcsold be|kerek).*(zen|dal)|^zenet|^zene$/.test(t)) {
    if (!isInstalled('music')) return 'Ehhez töltsd le a Zene appot az Áruházból! 🎵';
    musicPlay();
    return `Szól a zene: ${SONGS[music.song].title} 🎶`;
  }

  // App megnyitása: „nyisd meg a kígyót”, „indítsd el a YouTube-ot”
  const op = t.match(/^(nyisd meg|nyisd|nyiss meg|inditsd el|inditsd|mutasd)\s+(.+)$/);
  if (op) {
    const app = findAppByName(op[2].replace(/-(ot|et|at|t)$/, ''));
    if (!app) return `Nem találok ilyen appot: „${op[2]}”. Nézd meg az Áruházban! 🛍️`;
    later(() => openApp(app.id));
    return `Megnyitom: ${app.name} 🚀`;
  }

  // Sötét / világos mód
  if (/(sotet mod|sotetits|legyen sotet)/.test(t)) {
    settings.dark = true; settings.autoDark = false; saveSettings();
    return 'Bekapcsoltam a sötét módot. 🌙';
  }
  if (/(vilagos mod|legyen vilagos)/.test(t)) {
    settings.dark = false; settings.autoDark = false; saveSettings();
    return 'Bekapcsoltam a világos módot. ☀️';
  }

  // Ne zavarj
  if (/ne zavarj/.test(t)) {
    cc.dnd = !/(ki|kapcsold ki)$/.test(t);
    applyCC();
    return cc.dnd ? 'Ne zavarj mód bekapcsolva. 🌙 Értesítést most nem kapsz.' : 'Ne zavarj mód kikapcsolva.';
  }

  // Zseblámpa
  if (/(zseblampa|lampa|vilagits)/.test(t)) {
    if (!isInstalled('flashlight')) return 'Ehhez töltsd le a Zseblámpa appot az Áruházból! 🔦';
    later(() => openApp('flashlight'));
    return 'Megnyitom a zseblámpát! 🔦';
  }

  // Háttérkép
  if (/hatter/.test(t)) {
    settings.wallpaper = (settings.wallpaper + 1) % WALLPAPERS.length;
    saveSettings();
    return `Kész, új háttérkép${LIVE_WALLS.has(settings.wallpaper) ? ' (ez élő, mozog!)' : ''}. 🎨`;
  }

  // Fényerő
  const br = t.match(/fenyero\D*(\d+)/);
  if (br) {
    cc.bright = Math.max(20, Math.min(100, +br[1]));
    applyCC();
    return `A fényerő most ${cc.bright}%. ☀️`;
  }

  // Zárolás
  if (/(zarold|zarolas|zard le)/.test(t)) {
    later(lock);
    return 'Zárolom a telefont. 🔒';
  }

  // Buli
  if (/(bulizz|buli|unnepelj|konfetti)/.test(t)) {
    later(confetti);
    return 'Bulizzunk! 🎉🎉🎉';
  }

  return null;
}

// ---------------------------------------------------------------- Zene-widget
// Ha szól (vagy szünetel) a zene, a kezdő- és a zárolási képernyőn is megjelenik egy lejátszó.
function updateMusicWidgets() {
  const show = typeof music !== 'undefined' && isInstalled('music') && (music.playing || music.pos > 0);
  $$('.mwidget').forEach(el => {
    el.hidden = !show;
    if (!show) return;
    if (!el.dataset.built) {
      el.dataset.built = '1';
      el.innerHTML = `<div class="mw-art"></div>
        <div class="mw-text"><b></b><span></span><div class="mw-bar"><i></i></div></div>
        <div class="mw-btns"><button data-m="prev" aria-label="Előző">${ic('prev')}</button><button data-m="play" aria-label="Lejátszás"></button><button data-m="next" aria-label="Következő">${ic('next')}</button></div>`;
      el.addEventListener('click', e => {
        const m = e.target.closest('[data-m]')?.dataset.m;
        if (m === 'play') music.playing ? musicPause() : musicPlay();
        else if (m === 'prev') musicSkip(-1);
        else if (m === 'next') musicSkip(1);
        else if (!locked) openApp('music');
      });
    }
    const s = SONGS[music.song];
    setText($('b', el), s.title);
    setText($('.mw-text span', el), s.artist);
    $('.mw-bar i', el).style.width = (music.pos / s.notes.length) * 100 + '%';
    const art = $('.mw-art', el);
    art.style.setProperty('--c1', s.color[0]);
    art.style.setProperty('--c2', s.color[1]);
    art.classList.toggle('playing', music.playing);
    const state = music.playing ? 'pause' : 'play';
    const pb = $('[data-m="play"]', el);
    if (pb.dataset.state !== state) { pb.dataset.state = state; pb.innerHTML = ic(state); }
  });
}

// ---------------------------------------------------------------- Kereső
let spotOpen = false;
const spotEl = document.createElement('div');
spotEl.id = 'spot';
spotEl.innerHTML = `<div class="spot-bar">${ic('search')}<input id="spot-q" placeholder="App, beállítás, kérdés…" autocomplete="off" enterkeyhint="search"><button class="spot-x">Mégse</button></div><div class="spot-res"></div>`;
screenEl.append(spotEl);
const spotQ = $('#spot-q');
let spotIndex = null;

function openSpot() {
  if (locked) return;
  closeCC();
  closeSwitcher();
  spotOpen = true;
  spotIndex = null;
  spotQ.value = '';
  renderSpot();
  screenEl.classList.add('spot-open');
  setTimeout(() => spotQ.focus(), 80);
}
function closeSpot() {
  spotOpen = false;
  screenEl.classList.remove('spot-open');
  spotQ.blur();
}

function spotAppBtn(a) {
  return `<button class="spot-app" data-open="${a.id}"><span class="icon" style="background:${a.bg};color:${a.fg || '#fff'}">${appIcon(a)}</span><small>${esc(a.name)}</small></button>`;
}

function renderSpot() {
  const res = $('.spot-res', spotEl);
  const q = norm(spotQ.value);
  if (!q) {
    const rec = recents.filter(isInstalled).slice(0, 4).map(id => apps[id]);
    res.innerHTML = `${rec.length ? `<div class="spot-label">Legutóbbi appok</div><div class="spot-apps">${rec.map(spotAppBtn).join('')}</div>` : ''}
      <div class="spot-label">Tipp</div>
      <div class="spot-tip">Írd be egy app nevét, egy beállítást, vagy kérdezd meg az asszisztenst! Például: <b>„időzítő 5 perc”</b>, <b>„sötét mód”</b>, <b>„nyisd meg a zenét”</b>.</div>`;
  } else {
    const appHits = Object.values(apps).filter(a => isInstalled(a.id) && (norm(a.name).includes(q) || norm(appName(a)).includes(q))).slice(0, 8);
    spotIndex = spotIndex || (typeof settingsIndex === 'function' ? settingsIndex() : []);
    const setHits = spotIndex.filter(o => norm(o.text).includes(q)).slice(0, 5);
    const noteHits = store.get('notes', []).filter(n => norm(n.text).includes(q)).slice(0, 3);
    res.innerHTML = `
      ${appHits.length ? `<div class="spot-label">Alkalmazások</div><div class="spot-apps">${appHits.map(spotAppBtn).join('')}</div>` : ''}
      <div class="spot-label">${esc(settings.botName)} asszisztens</div>
      <button class="spot-row spot-ask"><span class="ri" style="background:linear-gradient(135deg,#a18cd1,#6a5acd)">${ic('bot')}</span><span class="grow">Kérdezd: „${esc(spotQ.value.trim())}”</span></button>
      <div class="spot-answer" hidden></div>
      ${setHits.length ? `<div class="spot-label">Beállítások</div>${setHits.map(h => `<button class="spot-row" data-page="${h.page}"><span class="ri" style="background:linear-gradient(135deg,#8e9aaf,#4f5b72)">${ic('settings')}</span><span class="grow">${esc(h.text)}<small>${esc(h.title)}</small></span></button>`).join('')}` : ''}
      ${noteHits.length ? `<div class="spot-label">Jegyzetek</div>${noteHits.map(n => `<button class="spot-row" data-note><span class="ri" style="background:linear-gradient(135deg,#ffe066,#ffb703);color:#5a3d00">${ic('notes')}</span><span class="grow">${esc(n.text.trim().split('\n')[0].slice(0, 40))}</span></button>`).join('')}` : ''}`;
  }
  $$('[data-open]', res).forEach(b => (b.onclick = () => { closeSpot(); openApp(b.dataset.open); }));
  $$('[data-page]', res).forEach(b => (b.onclick = () => { closeSpot(); window.settingsStartPage = b.dataset.page; openApp('settings'); }));
  $$('[data-note]', res).forEach(b => (b.onclick = () => { closeSpot(); openApp('notes'); }));
  const ask = $('.spot-ask', res);
  if (ask) ask.onclick = askSpot;
}

function askSpot() {
  const q = spotQ.value.trim();
  if (!q) return;
  const ans = $('.spot-answer', spotEl);
  if (!ans) return;
  ans.hidden = false;
  ans.textContent = botReply(q);
}

spotQ.addEventListener('input', renderSpot);
spotQ.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const first = $('.spot-res [data-open]', spotEl);
  if (first && norm(appName(apps[first.dataset.open])).startsWith(norm(spotQ.value))) first.click();
  else askSpot();
});
$('.spot-x', spotEl).onclick = closeSpot;

// Lehúzás a kezdőképernyőn → kereső
let pull = null;
$('#home').addEventListener('pointerdown', e => {
  if (current || locked || (window.homePage ?? 1) !== 1 || screenEl.classList.contains('editing') || e.target.closest('#dock, .mwidget, #spot-pill')) return;
  pull = { y: e.clientY, done: false };
});
$('#home').addEventListener('pointermove', e => {
  if (pull && !pull.done && e.clientY - pull.y > 70) { pull.done = true; openSpot(); }
});
$('#home').addEventListener('pointerup', () => { setTimeout(() => (pull = null), 0); });
// Ha lehúzás volt, az ikonra kattintás ne nyisson appot
$('#home').addEventListener('click', e => { if (pull?.done) { e.stopPropagation(); e.preventDefault(); } }, true);
$('#spot-pill').addEventListener('click', openSpot);

// A kereső bezárása: Home csík, Esc, Android vissza gomb
$('#homebar').addEventListener('click', e => { if (spotOpen) { closeSpot(); e.stopImmediatePropagation(); } }, true);
document.addEventListener('keydown', e => {
  if (spotOpen && e.key === 'Escape') { closeSpot(); e.stopImmediatePropagation(); return; }
  // „/” vagy Ctrl+K: kereső (asztali gépen)
  if (!spotOpen && !locked && (e.key === '/' || (e.ctrlKey && e.key === 'k')) && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) {
    e.preventDefault();
    openSpot();
  }
}, true);
const origBack = window.cssosBack;
window.cssosBack = () => (spotOpen ? closeSpot() : origBack());

// Indulás után
window.addEventListener('load', () => { fillIcons($('#home')); updateMusicWidgets(); });
