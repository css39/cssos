'use strict';
// =====================================================================
//  CSSOS — Áruház és a belőle letölthető alkalmazások
//  Letölthető app: registerApp({ ..., optional: true, category, desc })
//  Az Áruház automatikusan megjeleníti az összes ilyen appot.
// =====================================================================

const STORE_CATS = ['Összes', 'Játékok', 'Eszközök', 'Telepítve'];

// Az app „mérete” a programkódjának valódi mérete
function appSize(app) {
  const b = app.render.toString().length;
  return (b / 1024).toFixed(1).replace('.', ',') + ' KB';
}

registerApp({
  id: 'store', name: 'Áruház', icon: 'store', bg: 'linear-gradient(135deg,#00c6ff,#0072ff)',
  render(el) {
    let cat = 'Összes';
    let busy = {}; // id → letöltés százaléka
    const timers = [];

    const storeApps = () => Object.values(apps).filter(a => a.optional);
    const btn = a => {
      if (busy[a.id] !== undefined) return `<button class="st-btn busy" data-id="${a.id}" style="--p:${busy[a.id]}"><i></i></button>`;
      return installed.includes(a.id)
        ? `<button class="st-btn open" data-open="${a.id}">Megnyitás</button>`
        : `<button class="st-btn get" data-get="${a.id}">Letöltés</button>`;
    };
    const iconBox = (a, cls = 'st-icon') => `<span class="${cls}" style="background:${a.bg};color:${a.fg || '#fff'}">${appIcon(a)}</span>`;

    const list = () => {
      const all = storeApps();
      const shown = cat === 'Összes' ? all
        : cat === 'Telepítve' ? all.filter(a => installed.includes(a.id))
        : cat === 'Eszközök' ? all.filter(a => a.category !== 'Játékok')
        : all.filter(a => a.category === cat);
      const featured = all.find(a => !installed.includes(a.id)) || all[0];
      el.innerHTML = `<div class="app-title">Áruház</div>
        ${ANDROID ? `<button class="st-hero st-play">
          <small>ANDROID-APPOK</small><b>Google Play</b><span>Az igazi Google Play Áruház: YouTube, Roblox és minden más Android-app.</span>
          <span class="st-hero-icon">${ic('play')}</span>
        </button>
        <div class="group-label">CSSOS-appok</div>` : ''}
        ${featured ? `<button class="st-hero" data-detail="${featured.id}" style="background:${featured.bg}">
          <small>${installed.includes(featured.id) ? 'KEDVENC' : 'AJÁNLOTT NEKED'}</small>
          <b>${esc(featured.name)}</b><span>${esc(featured.desc.split('.')[0])}.</span>
          <span class="st-hero-icon" style="color:${featured.fg || '#fff'}">${appIcon(featured)}</span>
        </button>` : ''}
        <div class="segmented">${STORE_CATS.map(c => `<button data-cat="${c}" class="${c === cat ? 'on' : ''}">${c}</button>`).join('')}</div>
        ${shown.length ? `<div class="group">${shown.map(a => `
          <div class="row st-row">
            <button class="st-info" data-detail="${a.id}">${iconBox(a)}<span class="grow"><b>${esc(a.name)}</b><small class="muted">${a.category} · ${appSize(a)}</small></span></button>
            ${btn(a)}
          </div>`).join('')}</div>` : '<div class="empty">Itt még nincs semmi.<br>Nézz körül az „Összes” fülön!</div>'}
        ${sNote(`${all.length} alkalmazás · ${installed.filter(id => apps[id]?.optional).length} telepítve`)}`;
      bind();
    };

    const detail = id => {
      const a = apps[id];
      const ov = overlay(`<div class="st-detail">
        <div class="app-bar"><button class="link st-back">‹ Áruház</button><span></span></div>
        <div class="st-head">${iconBox(a, 'st-icon big')}<div><b>${esc(a.name)}</b><span class="muted">CSS Stúdió</span><div class="st-actions"></div></div></div>
        <div class="st-facts">
          <div><small>KATEGÓRIA</small><b>${a.category}</b></div>
          <div><small>MÉRET</small><b>${appSize(a)}</b></div>
          <div><small>KORHATÁR</small><b>3+</b></div>
        </div>
        <div class="group-label">Leírás</div>
        <p class="st-desc">${esc(a.desc)}</p>
      </div>`);
      const paintActions = () => {
        $('.st-actions', ov).innerHTML = btn(a) + (installed.includes(id) ? `<button class="st-del" data-del="${id}" aria-label="Eltávolítás">${ic('trash')}</button>` : '');
        $$('[data-get]', ov).forEach(b => (b.onclick = () => install(id, paintActions)));
        $$('[data-open]', ov).forEach(b => (b.onclick = () => openApp(id)));
        $$('[data-del]', ov).forEach(b => (b.onclick = () => {
          if (!confirm(`Eltávolítod: ${a.name}?`)) return;
          uninstallApp(id);
          paintActions();
          list();
        }));
      };
      $('.st-back', ov).onclick = () => { ov.remove(); list(); };
      paintActions();
    };

    // Letöltés: a gomb körben töltődik, mint a Fénygyűrű
    const install = (id, after) => {
      busy[id] = 0;
      after();
      const t = setInterval(() => {
        busy[id] = Math.min(100, busy[id] + 4 + Math.random() * 6);
        $$(`.st-btn.busy[data-id="${id}"]`, winEl).forEach(b => b.style.setProperty('--p', busy[id]));
        if (busy[id] >= 100) {
          clearInterval(t);
          delete busy[id];
          installApp(id);
          ringFlash();
          confetti();
          beep(988, 0.08);
          setTimeout(() => beep(1319, 0.12), 90);
          notify('Áruház', `${apps[id].name} telepítve. Megtalálod a kezdőképernyőn.`, 'store');
          after();
        }
      }, 60);
      timers.push(t);
    };

    const bind = () => {
      const play = $('.st-play', el);
      if (play) play.onclick = () => {
        if (!ANDROID.launchPackage(PLAY_STORE)) notify('Áruház', 'Ezen a telefonon nincs Google Play.', 'store');
      };
      $$('[data-cat]', el).forEach(b => (b.onclick = () => { cat = b.dataset.cat; list(); }));
      $$('[data-detail]', el).forEach(b => (b.onclick = () => detail(b.dataset.detail)));
      $$('[data-get]', el).forEach(b => (b.onclick = () => install(b.dataset.get, list)));
      $$('[data-open]', el).forEach(b => (b.onclick = () => openApp(b.dataset.open)));
    };

    list();
    return () => {
      // Bezáráskor a félbehagyott letöltések azonnal befejeződnek
      timers.forEach(clearInterval);
      Object.keys(busy).forEach(installApp);
    };
  },
});

// ---------------------------------------------------------------- Zseblámpa
registerApp({
  id: 'flashlight', name: 'Zseblámpa', icon: 'flashlight', bg: 'linear-gradient(135deg,#ffe259,#ffa751)', fg: '#4a3000', dark: true,
  optional: true, category: 'Eszközök',
  desc: 'Egy gombnyomásra világít. Androidos telefonon a valódi vakut kapcsolja be, máshol a kijelző világít fehéren.',
  render(el) {
    el.innerHTML = `<div class="torch"><button class="torch-btn" aria-label="Zseblámpa">${ic('flashlight')}</button><span class="torch-status muted">Koppints a bekapcsoláshoz</span></div>`;
    const wrap = $('.torch', el), status = $('.torch-status', el);
    let on = false, stream = null, oldBright = cc.bright;
    const stop = () => {
      if (ANDROID) ANDROID.torch(false);
      stream?.getTracks().forEach(t => t.stop());
      stream = null;
      screenEl.classList.remove('ring-cam');
    };
    const set = async v => {
      on = v;
      wrap.classList.toggle('on', on);
      keyClick();
      if (!on) {
        stop();
        cc.bright = oldBright;
        applyCC();
        status.textContent = 'Koppints a bekapcsoláshoz';
        return;
      }
      oldBright = cc.bright;
      cc.bright = 100;
      applyCC();
      status.textContent = 'A kijelző világít';
      // CSSOS Android-app: a vakut közvetlenül kapcsoljuk
      if (ANDROID) {
        if (ANDROID.torch(true)) status.textContent = 'A vaku világít';
        return;
      }
      // Böngészőben: valódi vaku, ha a böngésző engedi (Androidon a Chrome)
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const track = s.getVideoTracks()[0];
        if (!on) { s.getTracks().forEach(t => t.stop()); return; }
        if (track.getCapabilities?.().torch) {
          await track.applyConstraints({ advanced: [{ torch: true }] });
          stream = s;
          screenEl.classList.add('ring-cam');
          status.textContent = 'A vaku világít';
        } else s.getTracks().forEach(t => t.stop());
      } catch { /* nincs kamera vagy nincs engedély: marad a kijelző */ }
    };
    $('.torch-btn', el).onclick = () => set(!on);
    return () => { if (on) { cc.bright = oldBright; applyCC(); } stop(); };
  },
});

// ---------------------------------------------------------------- Dobókocka
registerApp({
  id: 'dice', name: 'Dobókocka', icon: 'dice', bg: 'linear-gradient(135deg,#ff6a88,#ff3b30)',
  optional: true, category: 'Játékok',
  desc: 'Dobj egy vagy két kockával társasjátékhoz! Koppints a kockákra, vagy rázd meg a gombot.',
  render(el) {
    let count = 2, rolling = false;
    const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
    const face = n => `<div class="die">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[n].includes(i + 1) ? 'on' : ''}"></i>`).join('')}</div>`;
    el.innerHTML = `<div class="app-title">Dobókocka</div>
      <div class="segmented">${[1, 2].map(n => `<button data-n="${n}" class="${n === count ? 'on' : ''}">${n} kocka</button>`).join('')}</div>
      <div class="dice-area"></div><div class="dice-total"></div>
      <div class="dice-go"><button class="btn d-roll">Dobás</button></div>`;
    const area = $('.dice-area', el), total = $('.dice-total', el);
    let values = [6, 6];
    const draw = () => {
      area.innerHTML = values.slice(0, count).map(face).join('');
      total.textContent = count > 1 ? `Összesen: ${values[0] + values[1]}` : '';
    };
    const roll = () => {
      if (rolling) return;
      rolling = true;
      area.classList.add('rolling');
      vibrate(60);
      let n = 0;
      const t = setInterval(() => {
        values = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
        draw();
        beep(300 + Math.random() * 300, 0.02, 0.5);
        if (++n > 9) {
          clearInterval(t);
          area.classList.remove('rolling');
          rolling = false;
        }
      }, 70);
    };
    $$('[data-n]', el).forEach(b => (b.onclick = () => {
      count = +b.dataset.n;
      $$('[data-n]', el).forEach(x => x.classList.toggle('on', x === b));
      draw();
    }));
    $('.d-roll', el).onclick = roll;
    area.onclick = roll;
    draw();
  },
});

// ---------------------------------------------------------------- Memória
registerApp({
  id: 'memory', name: 'Memória', icon: 'cards', bg: 'linear-gradient(135deg,#43e97b,#38a3f9)',
  optional: true, category: 'Játékok',
  desc: 'Fordítsd fel a kártyákat, és találd meg a párokat minél kevesebb lépésből! A legjobb eredményed megmarad.',
  render(el) {
    const SYMBOLS = ['music', 'camera', 'phone', 'clock', 'gallery', 'brush', 'gamepad', 'bell'];
    const COLORS = ['#ff375f', '#0a84ff', '#34c759', '#ff9f0a', '#bf5af2', '#ff2d55', '#5e5ce6', '#ffd60a'];
    let cards, open, found, moves, lock2;
    const start = () => {
      const deck = [...SYMBOLS.keys(), ...SYMBOLS.keys()].sort(() => Math.random() - 0.5);
      cards = deck;
      open = [];
      found = new Set();
      moves = 0;
      lock2 = false;
      el.innerHTML = `<div class="app-title">Memória</div>
        <div class="mem-top"><span>Lépések: <b class="mem-moves">0</b></span><span class="muted">Legjobb: <b>${store.get('memoryBest', 0) || '–'}</b></span></div>
        <div class="mem-grid">${cards.map((s, i) => `<button class="mem-card" data-i="${i}"><span class="mem-back">${ic('star')}</span><span class="mem-front" style="color:${COLORS[s]}">${ic(SYMBOLS[s])}</span></button>`).join('')}</div>
        <div class="dice-go"><button class="btn mem-new">Új játék</button></div>`;
      $('.mem-new', el).onclick = start;
      $$('.mem-card', el).forEach(c => (c.onclick = () => flip(+c.dataset.i, c)));
    };
    const flip = (i, c) => {
      if (lock2 || found.has(i) || open.includes(i)) return;
      c.classList.add('up');
      keyClick();
      open.push(i);
      if (open.length < 2) return;
      moves++;
      $('.mem-moves', el).textContent = moves;
      const [a, b] = open;
      if (cards[a] === cards[b]) {
        found.add(a).add(b);
        open = [];
        beep(880, 0.08);
        $$('.mem-card', el).filter(x => found.has(+x.dataset.i)).forEach(x => x.classList.add('done'));
        if (found.size === cards.length) {
          const best = store.get('memoryBest', 0);
          if (!best || moves < best) store.set('memoryBest', moves);
          ringFlash();
          confetti();
          setTimeout(() => notify('Memória', `Megvan az összes pár ${moves} lépésből!${!best || moves < best ? ' Új rekord!' : ''}`, 'memory'), 300);
        }
      } else {
        lock2 = true;
        setTimeout(() => {
          open.forEach(k => $(`.mem-card[data-i="${k}"]`, el)?.classList.remove('up'));
          open = [];
          lock2 = false;
        }, 750);
      }
    };
    start();
  },
});

// ---------------------------------------------------------------- Átváltó
registerApp({
  id: 'convert', name: 'Átváltó', icon: 'convert', bg: 'linear-gradient(135deg,#30cfd0,#330867)',
  optional: true, category: 'Eszközök',
  desc: 'Mértékegységek átváltása egy pillanat alatt: hosszúság, tömeg és hőmérséklet.',
  render(el) {
    const UNITS = {
      'Hossz': { mm: 0.001, cm: 0.01, m: 1, km: 1000, 'hüvelyk': 0.0254, 'láb': 0.3048, 'mérföld': 1609.344 },
      'Tömeg': { g: 0.001, dkg: 0.01, kg: 1, t: 1000, font: 0.45359237, uncia: 0.028349523 },
      'Hőmérséklet': { '°C': 'c', '°F': 'f', K: 'k' },
    };
    let kind = 'Hossz';
    const toBase = (v, u) => {
      const f = UNITS[kind][u];
      if (f === 'c') return v;
      if (f === 'f') return (v - 32) * 5 / 9;
      if (f === 'k') return v - 273.15;
      return v * f;
    };
    const fromBase = (v, u) => {
      const f = UNITS[kind][u];
      if (f === 'c') return v;
      if (f === 'f') return v * 9 / 5 + 32;
      if (f === 'k') return v + 273.15;
      return v / f;
    };
    const draw = () => {
      const names = Object.keys(UNITS[kind]);
      const opts = sel => names.map(n => `<option value="${n}"${n === sel ? ' selected' : ''}>${n}</option>`).join(''); // az érték fix marad, csak a felirat fordítódik
      el.innerHTML = `<div class="app-title">Átváltó</div>
        <div class="segmented">${Object.keys(UNITS).map(k => `<button data-k="${k}" class="${k === kind ? 'on' : ''}">${k}</button>`).join('')}</div>
        <div class="group conv">
          <div class="row"><input class="conv-in" type="number" inputmode="decimal" value="1"><select class="conv-from">${opts(names[kind === 'Hőmérséklet' ? 0 : 2])}</select></div>
          <button class="conv-swap" aria-label="Csere">${ic('convert')}</button>
          <div class="row"><span class="conv-out"></span><select class="conv-to">${opts(names[kind === 'Hőmérséklet' ? 1 : 3])}</select></div>
        </div>`;
      const inp = $('.conv-in', el), from = $('.conv-from', el), to = $('.conv-to', el), out = $('.conv-out', el);
      const calc = () => {
        const v = parseFloat(String(inp.value).replace(',', '.'));
        const r = isFinite(v) ? fromBase(toBase(v, from.value), to.value) : NaN;
        out.textContent = isFinite(r) ? String(parseFloat(r.toPrecision(8))).replace('.', ',') : '–';
      };
      inp.oninput = from.onchange = to.onchange = calc;
      $('.conv-swap', el).onclick = () => { [from.value, to.value] = [to.value, from.value]; calc(); };
      $$('[data-k]', el).forEach(b => (b.onclick = () => { kind = b.dataset.k; draw(); }));
      calc();
    };
    draw();
  },
});

// ---------------------------------------------------------------- Iránytű
registerApp({
  id: 'compass', name: 'Iránytű', icon: 'compass', bg: 'linear-gradient(135deg,#434343,#000)', fg: '#ff453a', dark: true,
  optional: true, category: 'Eszközök',
  desc: 'Megmutatja, merre van észak. Iránytűvel rendelkező telefonon (például Androidon) működik.',
  render(el) {
    const ticks = Array.from({ length: 36 }, (_, i) => `<i style="transform:rotate(${i * 10}deg)"></i>`).join('');
    el.innerHTML = `<div class="compass">
      <div class="cmp-deg">–</div><div class="cmp-dir muted">&nbsp;</div>
      <div class="cmp-rose"><div class="cmp-dial">${ticks}<b class="n">${L('É', 'N')}</b><b class="e">${L('K', 'E')}</b><b class="s">${L('D', 'S')}</b><b class="w">${L('Ny', 'W')}</b></div><div class="cmp-needle"></div></div>
      <p class="cmp-msg muted"></p>
      <button class="btn cmp-perm" hidden>Iránytű engedélyezése</button>
    </div>`;
    const dial = $('.cmp-dial', el), deg = $('.cmp-deg', el), dir = $('.cmp-dir', el), msg = $('.cmp-msg', el);
    const NAMES = L(['észak', 'északkelet', 'kelet', 'délkelet', 'dél', 'délnyugat', 'nyugat', 'északnyugat'], ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']);
    let got = false;
    const onOri = e => {
      let h = e.webkitCompassHeading ?? (e.absolute || e.type === 'deviceorientationabsolute' ? 360 - e.alpha : null);
      if (h === null || h === undefined || isNaN(h)) return;
      got = true;
      h = (h + 360) % 360;
      dial.style.transform = `rotate(${-h}deg)`;
      deg.textContent = Math.round(h) + '°';
      dir.textContent = cap(NAMES[Math.round(h / 45) % 8]);
      msg.textContent = '';
    };
    const listen = () => {
      window.addEventListener('deviceorientationabsolute', onOri);
      window.addEventListener('deviceorientation', onOri);
    };
    listen();
    const t = setTimeout(() => {
      if (got) return;
      // Néhány telefon (pl. iPhone) külön engedélyt kér az iránytűhöz
      const needsPerm = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function' && 'ontouchstart' in window;
      if (needsPerm) {
        const b = $('.cmp-perm', el);
        b.hidden = false;
        b.onclick = () => DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') b.hidden = true; }).catch(() => {});
        msg.textContent = 'Az iránytűhöz engedély kell.';
      } else {
        msg.textContent = 'Ezen az eszközön nincs iránytű. Nyisd meg egy telefonon (például Androidon), és ott működni fog.';
      }
    }, 1500);
    return () => {
      clearTimeout(t);
      window.removeEventListener('deviceorientationabsolute', onOri);
      window.removeEventListener('deviceorientation', onOri);
    };
  },
});

// ---------------------------------------------------------------- Amőba (3×3)
registerApp({
  id: 'tictactoe', name: 'Amőba', icon: 'grid3', bg: 'linear-gradient(135deg,#f093fb,#5b247a)',
  optional: true, category: 'Játékok',
  desc: 'Három egy sorban! Játssz a telefon ellen. Te vagy az X, a telefon a kör.',
  render(el) {
    const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const score = store.get('tttScore', { me: 0, cpu: 0, draw: 0 });
    let b, over, timer = null;
    const winner = bd => {
      for (const l of LINES) if (bd[l[0]] && bd[l[0]] === bd[l[1]] && bd[l[1]] === bd[l[2]]) return { p: bd[l[0]], line: l };
      return bd.every(Boolean) ? { p: 'draw' } : null;
    };
    // A telefon lépése: nyer, ha tud; blokkol, ha kell; különben közép, sarok, bármi
    const cpuMove = () => {
      const free = b.map((v, i) => (v ? null : i)).filter(i => i !== null);
      const tryWin = p => free.find(i => { const t = b.slice(); t[i] = p; return winner(t)?.p === p; });
      let m = tryWin('O') ?? tryWin('X');
      if (m === undefined && !b[4]) m = 4;
      if (m === undefined) m = [0, 2, 6, 8].filter(i => !b[i]).sort(() => Math.random() - 0.5)[0];
      if (m === undefined) m = free[0];
      b[m] = 'O';
    };
    const draw = () => {
      const w = winner(b);
      $$('.ttt-cell', el).forEach((c, i) => {
        c.innerHTML = b[i] === 'X' ? ic('close') : b[i] === 'O' ? '<span class="ttt-o"></span>' : '';
        c.classList.toggle('win', !!w?.line?.includes(i));
      });
      $('.ttt-status', el).textContent = !w ? (over ? 'A telefon gondolkodik…' : 'Te jössz!') : w.p === 'X' ? 'Nyertél!' : w.p === 'O' ? 'A telefon nyert.' : 'Döntetlen.';
      $('.ttt-score', el).textContent = `Te ${score.me} · Döntetlen ${score.draw} · Telefon ${score.cpu}`;
    };
    const finish = () => {
      const w = winner(b);
      if (!w) return false;
      over = true;
      if (w.p === 'X') { score.me++; ringFlash(); confetti(); beep(988, 0.12); }
      else if (w.p === 'O') { score.cpu++; beep(260, 0.2); }
      else score.draw++;
      store.set('tttScore', score);
      return true;
    };
    const start = () => {
      b = Array(9).fill(null);
      over = false;
      draw();
    };
    el.innerHTML = `<div class="app-title">Amőba</div>
      <div class="ttt-status"></div>
      <div class="ttt-board">${Array.from({ length: 9 }, (_, i) => `<button class="ttt-cell" data-i="${i}"></button>`).join('')}</div>
      <div class="ttt-score muted"></div>
      <div class="dice-go"><button class="btn ttt-new">Új játék</button></div>`;
    $$('.ttt-cell', el).forEach(c => (c.onclick = () => {
      const i = +c.dataset.i;
      if (over || b[i]) return;
      b[i] = 'X';
      keyClick();
      if (!finish()) {
        over = true; // amíg a telefon gondolkodik
        draw();
        timer = setTimeout(() => { over = false; cpuMove(); finish(); draw(); }, 350);
      }
      draw();
    }));
    $('.ttt-new', el).onclick = start;
    start();
    return () => clearTimeout(timer);
  },
});
