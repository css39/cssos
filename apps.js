'use strict';
// =====================================================================
//  CSSOS — beépített alkalmazások
//  Új app: registerApp({ id, name, icon, bg, render(el) { ...; return cleanup } })
//  majd az id-t add hozzá a GRID vagy DOCK listához az os.js-ben.
// =====================================================================

const MONTHS = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];

// A Telefon és a Naptár app a system.js-ben van (névjegyekkel, eseményekkel).

// ---------------------------------------------------------------- Üzenetek
const JOKES = [
  'Mit mond a nulla a nyolcasnak? – Csinos öv! 😄',
  'Miért vitte a matektanár a létrát az iskolába? – Mert magasabb szintre akart lépni. 🪜',
  'Mi az: kicsi, kerek és nevet? – A kuncogó borsó. 🟢',
  'Miért nem játszik a telefon focit? – Mert fél, hogy lemerül a csatár. 📱⚽',
];
const BOT_FALLBACK = ['Érdekes! Mesélj még. 🙂', 'Hmm, ezt még tanulom. 🤔 Írd be, hogy „mit tudsz”, és megmutatom a parancsaimat!', 'Értem! 👍', 'Kérdezd meg, hány óra van, kérj egy viccet, vagy mondd, hogy „nyisd meg a zenét”!'];

function botReply(text) {
  // Előbb megnézzük, nem parancs-e (pl. „nyisd meg a zenét”) — ezt a cool.js intézi
  const cmd = typeof assistantCommand === 'function' ? assistantCommand(text) : null;
  if (cmd) return cmd;
  const t = text.toLowerCase();
  const m = t.match(/(-?\d+(?:[.,]\d+)?)\s*([-+*/x×:])\s*(-?\d+(?:[.,]\d+)?)/);
  if (m) {
    const a = parseFloat(m[1].replace(',', '.')), b = parseFloat(m[3].replace(',', '.'));
    const r = { '+': a + b, '-': a - b, '*': a * b, x: a * b, '×': a * b, '/': a / b, ':': a / b }[m[2]];
    return isFinite(r) ? `Az eredmény: ${String(parseFloat(r.toPrecision(12))).replace('.', ',')} 🧮` : 'Nullával nem lehet osztani! 🙅';
  }
  if (/szia|hell?ó|hello|üdv|hali|csá|\bhi\b|\bhey\b/.test(t)) return 'Szia! 👋 Miben segíthetek?';
  if (/hány óra|idő|what time|\btime\b/.test(t)) return `Most ${new Date().toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit' })} van. ⏰`;
  if (/dátum|hányadika|milyen nap|\bdate\b|what day/.test(t)) return `Ma ${new Date().toLocaleDateString(LOC, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })} van. 📅`;
  if (/vicc|joke/.test(t)) return pick(JOKES);
  if (/ki vagy|neved|who are you|your name/.test(t)) return `Én ${settings.botName} vagyok, a ${OS.name} asszisztense. 🤖`;
  if (/cég|telefon|phone|company/.test(t)) return 'Ez lesz a világ legjobb telefonja! 🚀📱';
  if (/köszi|köszönöm|thank/.test(t)) return 'Szívesen! 😊';
  return pick(BOT_FALLBACK);
}

let chatView = null; // a megnyitott chat-képernyő, ha van

function pushChat(msg) {
  const c = store.get('chat', []);
  c.push(msg);
  store.set('chat', c.slice(-200));
  chatView?.add(msg);
}

function sendChat(text) {
  pushChat({ from: 'me', text });
  setTimeout(() => chatView?.typing(true), 300);
  setTimeout(() => {
    chatView?.typing(false);
    const r = botReply(text);
    pushChat({ from: 'bot', text: r });
    if (!chatView || locked) {
      store.set('unread', store.get('unread', 0) + 1);
      updateBadges();
      notify(settings.botName, r, 'messages');
    }
  }, 1100 + Math.random() * 800);
}

registerApp({
  id: 'messages', name: 'Üzenetek', icon: 'message', bg: 'linear-gradient(135deg,#4facfe,#3a5bff)',
  render(el) {
    store.set('unread', 0);
    updateBadges();
    let chat = store.get('chat', []);
    if (!chat.length) {
      chat = [{ from: 'bot', text: `Szia! Én ${settings.botName} vagyok, a ${OS.name} asszisztense. Kérdezz tőlem! Parancsokat is végrehajtok, például: „nyisd meg a zenét”, „időzítő 5 perc” vagy „sötét mód”. Írd be, hogy „mit tudsz”!` }];
      store.set('chat', chat);
    }
    el.innerHTML = `<div class="chat">
      <div class="chat-head"><div class="avatar">${ic('bot')}</div><span>${esc(settings.botName)}</span></div>
      <div class="chat-log"></div>
      <form class="chat-input"><input placeholder="Üzenet" autocomplete="off"><button class="send" type="submit">${ic('send')}</button></form>
    </div>`;
    const log = $('.chat-log', el), input = $('input', el);
    let typingEl = null;
    const bubble = m => {
      const b = document.createElement('div');
      b.className = 'bubble ' + m.from;
      b.textContent = m.text;
      log.insertBefore(b, typingEl);
      log.scrollTop = log.scrollHeight;
    };
    chat.forEach(bubble);
    chatView = {
      add: bubble,
      typing(on) {
        if (on && !typingEl) {
          typingEl = document.createElement('div');
          typingEl.className = 'bubble bot typing';
          typingEl.innerHTML = '<span></span><span></span><span></span>';
          log.append(typingEl);
          log.scrollTop = log.scrollHeight;
        } else if (!on && typingEl) {
          typingEl.remove();
          typingEl = null;
        }
      },
    };
    $('form', el).onsubmit = e => {
      e.preventDefault();
      const t = input.value.trim();
      if (!t) return;
      input.value = '';
      sendChat(t);
    };
    return () => { chatView = null; };
  },
});

// ---------------------------------------------------------------- Kamera
function savePhotos(photos) {
  // Ha betelt a tárhely, a legrégebbi fotók törlődnek.
  while (!store.set('photos', photos) && photos.length) photos.shift();
}

registerApp({
  id: 'camera', name: 'Kamera', icon: 'camera', bg: 'linear-gradient(135deg,#5b6170,#2b2f3a)', dark: true,
  render(el) {
    el.innerHTML = `<div class="cam">
      <video autoplay playsinline muted></video>
      <div class="cam-flash"></div>
      <div class="cam-bar"><button class="cam-thumb" aria-label="Fotók"></button><button class="shutter" aria-label="Fotó készítése" disabled></button><span style="width:50px"></span></div>
    </div>`;
    const video = $('video', el), shutter = $('.shutter', el), thumbBtn = $('.cam-thumb', el);
    let stream = null, dead = false;
    const thumb = () => {
      const p = store.get('photos', []);
      thumbBtn.style.backgroundImage = p.length ? `url(${p[p.length - 1].src})` : 'none';
    };
    const noCam = () => {
      if (dead) return;
      const msg = document.createElement('div');
      msg.className = 'cam-msg';
      msg.textContent = 'A kamera nem érhető el. Engedélyezd a kamera-hozzáférést a böngészőben, vagy csatlakoztass webkamerát.';
      video.replaceWith(msg);
    };
    thumb();
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then(s => {
          if (dead) { s.getTracks().forEach(t => t.stop()); return; }
          stream = s;
          screenEl.classList.add('ring-cam'); // a Fénygyűrű jelzi, hogy a kamera be van kapcsolva
          video.srcObject = s;
          shutter.disabled = false;
        })
        .catch(noCam);
    } else noCam();

    shutter.onclick = () => {
      if (!video.videoWidth) return;
      const w = Math.min(640, video.videoWidth), h = Math.round((w * video.videoHeight) / video.videoWidth);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.translate(w, 0); ctx.scale(-1, 1); // tükrözve, ahogy az előnézetben látszik
      ctx.drawImage(video, 0, 0, w, h);
      const photos = store.get('photos', []);
      photos.push({ id: Date.now(), src: c.toDataURL('image/jpeg', 0.75) });
      savePhotos(photos);
      const f = $('.cam-flash', el);
      f.classList.add('on');
      requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('on')));
      thumb();
    };
    thumbBtn.onclick = () => openApp('gallery');
    return () => { dead = true; stream?.getTracks().forEach(t => t.stop()); screenEl.classList.remove('ring-cam'); };
  },
});

// ---------------------------------------------------------------- Fotók
registerApp({
  id: 'gallery', name: 'Fotók', icon: 'gallery', bg: 'linear-gradient(135deg,#ff8fa3,#c9184a)',
  render(el) {
    const draw = () => {
      const p = store.get('photos', []).slice().reverse();
      el.innerHTML = `<div class="app-title">Fotók</div>${p.length
        ? `<div class="gal-grid">${p.map(x => `<img src="${x.src}" data-id="${x.id}" alt="" loading="lazy" decoding="async">`).join('')}</div><p class="gal-count">${p.length} fotó</p>`
        : '<div class="empty">Még nincsenek fotók.<br>Készíts egyet a Kamerával!</div>'}`;
      $$('img', el).forEach(img => (img.onclick = () => view(+img.dataset.id)));
    };
    const view = id => {
      const ph = store.get('photos', []).find(x => x.id === id);
      if (!ph) return;
      const v = overlay(`<div class="viewer"><div class="app-bar"><button class="link" data-a="back">‹ Vissza</button><button class="link danger" data-a="del">Törlés</button></div><img src="${ph.src}" alt=""></div>`);
      $('[data-a=back]', v).onclick = () => v.remove();
      $('[data-a=del]', v).onclick = () => {
        savePhotos(store.get('photos', []).filter(x => x.id !== id));
        v.remove();
        draw();
      };
    };
    draw();
  },
});

// ---------------------------------------------------------------- Óra
registerApp({
  id: 'clock', name: 'Óra', icon: 'clock', bg: 'linear-gradient(135deg,#2b2f3a,#11131a)', fg: '#ffb547',
  render(el) {
    let tab = clockState.timerEnd ? 'timer' : 'world', iv = null;
    const show = () => {
      clearInterval(iv);
      el.innerHTML = `<div class="app-title">Óra</div>
        <div class="segmented">${[['alarm', 'Ébresztő'], ['world', 'Világóra'], ['sw', 'Stopper'], ['timer', 'Időzítő']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="ck-body"></div>`;
      $$('[data-tab]', el).forEach(b => (b.onclick = () => { tab = b.dataset.tab; show(); }));
      const body = $('.ck-body', el);
      iv = tab === 'alarm' ? alarmTab(body) : tab === 'world' ? worldClock(body) : tab === 'sw' ? stopwatch(body) : timer(body);
    };
    show();
    return () => clearInterval(iv);
  },
});

function worldClock(body) {
  const CITIES = [['Budapest', 'Europe/Budapest'], ['London', 'Europe/London'], ['New York', 'America/New_York'], ['Tokió', 'Asia/Tokyo'], ['Sydney', 'Australia/Sydney']];
  let nums = '';
  for (let i = 1; i <= 12; i++) {
    const a = (i * Math.PI) / 6;
    nums += `<span class="num" style="left:${50 + 39 * Math.sin(a)}%;top:${50 - 39 * Math.cos(a)}%">${i}</span>`;
  }
  body.innerHTML = `<div class="analog">${nums}<div class="hand h"></div><div class="hand m"></div><div class="hand s"></div><div class="dot"></div></div>
    <div class="group">${CITIES.map(([n, tz]) => `<div class="row"><b>${n}</b><span class="city-time" data-tz="${tz}"></span></div>`).join('')}</div>`;
  const upd = () => {
    const d = new Date();
    const s = d.getSeconds(), m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
    $('.hand.h', body).style.transform = `rotate(${h * 30}deg)`;
    $('.hand.m', body).style.transform = `rotate(${m * 6}deg)`;
    $('.hand.s', body).style.transform = `rotate(${s * 6}deg)`;
    $$('.city-time', body).forEach(e => (e.textContent = d.toLocaleTimeString(LOC, { timeZone: e.dataset.tz, hour: '2-digit', minute: '2-digit' })));
  };
  upd();
  return setInterval(upd, 1000);
}

function stopwatch(body) {
  const S = clockState;
  body.innerHTML = `<div class="big-num sw-t"></div>
    <div class="round-row"><button class="round-btn sw-l"></button><button class="round-btn sw-s"></button></div>
    <div class="group sw-laps"></div>`;
  const elapsed = () => S.swElapsed + (S.swRunning ? Date.now() - S.swStart : 0);
  const fmt = ms => `${pad(Math.floor(ms / 60000))}:${pad(Math.floor(ms / 1000) % 60)},${pad(Math.floor(ms / 10) % 100)}`;
  const paint = () => { $('.sw-t', body).textContent = fmt(elapsed()); };
  const btns = () => {
    const l = $('.sw-l', body), s = $('.sw-s', body), laps = $('.sw-laps', body);
    s.textContent = S.swRunning ? 'Állj' : 'Indít';
    s.className = 'round-btn sw-s ' + (S.swRunning ? 'red' : 'green');
    l.textContent = S.swRunning ? L('Kör', 'Lap') : 'Nulláz';
    l.disabled = !S.swRunning && !elapsed();
    laps.innerHTML = S.laps.map((t, i) => `<div class="row"><span>${i + 1}. kör</span><span class="mono">${fmt(t)}</span></div>`).reverse().join('');
    laps.style.display = S.laps.length ? '' : 'none';
  };
  $('.sw-s', body).onclick = () => {
    if (S.swRunning) { S.swElapsed = elapsed(); S.swRunning = false; }
    else { S.swStart = Date.now(); S.swRunning = true; }
    btns();
  };
  $('.sw-l', body).onclick = () => {
    if (S.swRunning) S.laps.push(elapsed() - S.laps.reduce((a, b) => a + b, 0));
    else { S.swElapsed = 0; S.laps = []; paint(); }
    btns();
  };
  btns();
  paint();
  return setInterval(paint, 37);
}

function timer(body) {
  const S = clockState;
  const PRESETS = [['10 mp', 10], ['1 perc', 60], ['3 perc', 180], ['5 perc', 300], ['10 perc', 600], ['30 perc', 1800]];
  const render = () => {
    if (S.timerEnd) {
      body.innerHTML = '<div class="big-num tm-t"></div><div class="round-row center"><button class="round-btn red tm-c">Mégse</button></div>';
      $('.tm-c', body).onclick = () => { S.timerEnd = 0; updateTimerRing(); render(); };
      paint();
    } else {
      body.innerHTML = `<div class="big-num hint">Válassz időtartamot</div><div class="presets">${PRESETS.map(([l, s]) => `<button class="preset" data-s="${s}">${l}</button>`).join('')}</div>`;
      $$('.preset', body).forEach(b => (b.onclick = () => { S.timerTotal = b.dataset.s * 1000; S.timerEnd = Date.now() + S.timerTotal; updateTimerRing(); render(); }));
    }
  };
  const paint = () => {
    const t = $('.tm-t', body);
    if (!t) return;
    if (!S.timerEnd) { render(); return; } // lejárt
    const left = Math.ceil(Math.max(0, S.timerEnd - Date.now()) / 1000);
    t.textContent = `${pad(Math.floor(left / 60))}:${pad(left % 60)}`;
  };
  render();
  return setInterval(paint, 250);
}

// ---------------------------------------------------------------- Számológép
registerApp({
  id: 'calculator', name: 'Számológép', icon: 'calculator', bg: 'linear-gradient(135deg,#ffb547,#ff7a1a)', dark: true,
  render(el) {
    const KEYS = ['AC', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', ',', '='];
    el.innerHTML = `<div class="calc"><div class="calc-display">0</div><div class="calc-keys">${KEYS.map(k =>
      `<button class="ck${'÷×−+='.includes(k) ? ' op' : ''}${['AC', '±', '%'].includes(k) ? ' fn' : ''}${k === '0' ? ' zero' : ''}" data-k="${k}">${k}</button>`).join('')}</div></div>`;
    const disp = $('.calc-display', el);
    let cur = '0', prev = null, op = null, fresh = false;

    const compute = () => {
      const a = prev, b = parseFloat(cur);
      const r = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : b === 0 ? NaN : a / b;
      cur = isFinite(r) ? String(parseFloat(r.toPrecision(12))) : 'Hiba';
    };
    const render = () => {
      const txt = cur.replace('.', ',');
      disp.textContent = txt;
      disp.style.fontSize = txt.length > 9 ? '44px' : txt.length > 6 ? '58px' : '';
      $$('.ck.op', el).forEach(b => b.classList.toggle('active', fresh && b.dataset.k === op));
    };
    const input = k => {
      if (cur === 'Hiba' && k !== 'AC') { cur = '0'; prev = null; op = null; }
      if (/\d/.test(k)) {
        if (fresh || cur === '0') { cur = k; fresh = false; }
        else if (cur.replace(/[-.]/g, '').length < 9) cur += k;
      } else if (k === ',') {
        if (fresh) { cur = '0.'; fresh = false; }
        else if (!cur.includes('.')) cur += '.';
      } else if (k === 'AC') { cur = '0'; prev = null; op = null; fresh = false; }
      else if (k === '±') cur = cur.startsWith('-') ? cur.slice(1) : cur === '0' ? cur : '-' + cur;
      else if (k === '%') cur = String(parseFloat(cur) / 100);
      else if ('÷×−+'.includes(k)) {
        if (op && !fresh) compute();
        prev = parseFloat(cur); op = k; fresh = true;
      } else if (k === '=') {
        if (op) { compute(); op = null; prev = null; }
        fresh = true;
      }
      render();
    };
    $$('.ck', el).forEach(b => (b.onclick = () => { keyClick(); input(b.dataset.k); }));
    const onKey = e => {
      const map = { '/': '÷', '*': '×', '-': '−', '+': '+', Enter: '=', '=': '=', '.': ',', ',': ',', Backspace: 'AC', Delete: 'AC', '%': '%' };
      const k = /^\d$/.test(e.key) ? e.key : map[e.key];
      if (k) { e.preventDefault(); input(k); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  },
});

// ---------------------------------------------------------------- Jegyzetek
registerApp({
  id: 'notes', name: 'Jegyzetek', icon: 'notes', bg: 'linear-gradient(135deg,#ffe066,#ffb703)', fg: '#5a3d00',
  render(el) {
    let notes = store.get('notes', []);
    const save = () => store.set('notes', notes);
    const lines = n => n.text.trim().split('\n').filter(Boolean);
    const when = t => new Date(t).toLocaleDateString(LOC, { month: 'short', day: 'numeric' });

    const list = () => {
      notes = notes.filter(n => n.text.trim());
      save();
      const sorted = notes.slice().sort((a, b) => b.t - a.t);
      el.innerHTML = `<div class="app-bar"><span></span><button class="link n-new">Új jegyzet ✎</button></div>
        <div class="app-title">Jegyzetek</div>
        ${sorted.length
          ? `<div class="group">${sorted.map(n => `<button class="row" data-id="${n.id}"><div class="note-prev"><b>${esc(lines(n)[0] || 'Új jegyzet')}</b><small class="muted">${when(n.t)} · ${esc(lines(n)[1] || 'Nincs további szöveg')}</small></div></button>`).join('')}</div>`
          : '<div class="empty">Még nincsenek jegyzetek.<br>Koppints az „Új jegyzet” gombra!</div>'}`;
      $('.n-new', el).onclick = () => edit(null);
      $$('[data-id]', el).forEach(b => (b.onclick = () => edit(+b.dataset.id)));
    };

    const edit = id => {
      let n = notes.find(x => x.id === id);
      if (!n) { n = { id: Date.now(), text: '', t: Date.now() }; notes.push(n); }
      el.innerHTML = `<div class="app-bar"><button class="link n-back">‹ Jegyzetek</button><button class="link danger n-del">Törlés</button></div>
        <div class="note-editor"><textarea placeholder="Írj valamit…">${esc(n.text)}</textarea></div>`;
      const ta = $('textarea', el);
      ta.oninput = () => { n.text = ta.value; n.t = Date.now(); save(); };
      $('.n-back', el).onclick = list;
      $('.n-del', el).onclick = () => { notes = notes.filter(x => x !== n); list(); };
      ta.focus();
    };

    list();
    return () => { notes = notes.filter(n => n.text.trim()); save(); };
  },
});

