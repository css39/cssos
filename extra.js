'use strict';
// =====================================================================
//  CSSOS — szórakoztató alkalmazások: Zene, Kígyó, Rajz
// =====================================================================

// ---------------------------------------------------------------- Zene
// A dalokat a telefon maga „játssza le” hangjegyekből (nincs szükség zenefájlra).
// Minden dallam közkincs vagy saját szerzemény.
const SONGS = [
  {
    title: 'CSSOS téma', artist: 'CSS Hangstúdió', bpm: 132, color: ['#7f53ac', '#38ef7d'],
    notes: [['C4', .5], ['E4', .5], ['G4', .5], ['C5', .5], ['B4', .5], ['G4', .5], ['E4', .5], ['G4', .5],
      ['A4', .5], ['C5', .5], ['E5', .5], ['D5', .5], ['C5', 1], ['G4', 1],
      ['F4', .5], ['A4', .5], ['C5', .5], ['F5', .5], ['E5', .5], ['C5', .5], ['G4', .5], ['E4', .5],
      ['D4', .5], ['G4', .5], ['B4', .5], ['D5', .5], ['C5', 2]],
  },
  {
    title: 'Boci, boci tarka', artist: 'Magyar népdal', bpm: 120, color: ['#ff9f0a', '#ff375f'],
    notes: [['C4', 1], ['E4', 1], ['C4', 1], ['E4', 1], ['G4', 2], ['G4', 2],
      ['C4', 1], ['E4', 1], ['C4', 1], ['E4', 1], ['G4', 2], ['G4', 2],
      ['C5', 1], ['B4', 1], ['A4', 1], ['G4', 1], ['F4', 2], ['A4', 2],
      ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1], ['C4', 2], ['C4', 2]],
  },
  {
    title: 'Örömóda', artist: 'Ludwig van Beethoven', bpm: 140, color: ['#0a84ff', '#64d2ff'],
    notes: [['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1],
      ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1.5], ['D4', .5], ['D4', 2],
      ['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1],
      ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['D4', 1.5], ['C4', .5], ['C4', 2]],
  },
  {
    title: 'Für Elise', artist: 'Ludwig van Beethoven', bpm: 150, color: ['#bf5af2', '#ff375f'],
    notes: [['E5', .5], ['D#5', .5], ['E5', .5], ['D#5', .5], ['E5', .5], ['B4', .5], ['D5', .5], ['C5', .5], ['A4', 1.5], ['-', .5],
      ['C4', .5], ['E4', .5], ['A4', .5], ['B4', 1.5], ['-', .5], ['E4', .5], ['G#4', .5], ['B4', .5], ['C5', 1.5], ['-', .5],
      ['E4', .5], ['E5', .5], ['D#5', .5], ['E5', .5], ['D#5', .5], ['E5', .5], ['B4', .5], ['D5', .5], ['C5', .5], ['A4', 1.5], ['-', .5],
      ['C4', .5], ['E4', .5], ['A4', .5], ['B4', 1.5], ['-', .5], ['E4', .5], ['C5', .5], ['B4', .5], ['A4', 2]],
  },
];

function noteFreq(n) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n);
  const semi = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (m[3] - 4) * 12;
  return 440 * Math.pow(2, semi / 12);
}

// A lejátszó a rendszerben él, így bezárt appnál is szól tovább a zene
const music = { playing: false, song: 0, pos: 0, timer: null, gain: null, analyser: null, onChange: null };

function musicCtx() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (!music.gain) {
    music.gain = audioCtx.createGain();
    music.analyser = audioCtx.createAnalyser();
    music.analyser.fftSize = 64;
    music.gain.connect(music.analyser).connect(audioCtx.destination);
  }
  music.gain.gain.value = (settings.volume / 100) * 0.3;
  return audioCtx;
}

function playNote(freq, dur) {
  const ctx = musicCtx(), t = ctx.currentTime;
  // Dallam (háromszög hullám) + halk basszus egy oktávval lejjebb
  [[freq, 'triangle', 1], [freq / 2, 'sine', 0.45]].forEach(([f, type, vol]) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);
    o.connect(g).connect(music.gain);
    o.start(t);
    o.stop(t + dur);
  });
}

// Értesíti a Zene appot és a zene-widgeteket (kezdő- és zárolási képernyő)
function musicNotify() {
  music.onChange?.();
  if (typeof updateMusicWidgets === "function") updateMusicWidgets();
  if (music.playing && typeof startBeat === "function") startBeat(); // a Fénygyűrű a zenére lüktet
}

function musicStep() {
  const s = SONGS[music.song];
  if (music.pos >= s.notes.length) { musicSkip(1); return; }
  const [n, beats] = s.notes[music.pos++];
  const dur = (beats * 60) / s.bpm;
  if (n !== '-') playNote(noteFreq(n), dur);
  musicNotify();
  music.timer = setTimeout(musicStep, dur * 1000);
}
function musicPlay() {
  if (music.playing) return;
  music.playing = true;
  screenEl.classList.add('ring-music');
  musicStep();
}
function musicPause() {
  music.playing = false;
  clearTimeout(music.timer);
  screenEl.classList.remove('ring-music');
  musicNotify();
}
function musicSkip(dir) {
  clearTimeout(music.timer);
  music.song = (music.song + dir + SONGS.length) % SONGS.length;
  music.pos = 0;
  if (music.playing) musicStep();
  else musicNotify();
}

registerApp({
  id: 'music', name: 'Zene', icon: 'music', bg: 'linear-gradient(135deg,#ff375f,#bf5af2)',
  optional: true, category: 'Szórakozás', desc: 'Zenelejátszó forgó lemezzel és a zenére ugráló hangszínképpel. A dalokat a telefon maga játssza le hangjegyekből, és bezárt appnál is szól tovább.',
  render(el) {
    el.innerHTML = `<div class="music">
      <div class="m-art"><div class="m-disc">${ic('music')}</div></div>
      <div class="m-title"></div><div class="m-sub muted"></div>
      <canvas class="m-viz"></canvas>
      <div class="m-progress"><i></i></div>
      <div class="m-controls">
        <button class="m-prev" aria-label="Előző">${ic('prev')}</button>
        <button class="m-play" aria-label="Lejátszás"></button>
        <button class="m-next" aria-label="Következő">${ic('next')}</button>
      </div>
      <div class="group m-list">${SONGS.map((s, i) => `<button class="row" data-song="${i}"><span class="m-dot" style="background:linear-gradient(135deg,${s.color[0]},${s.color[1]})"></span><span class="grow">${s.title}<small class="muted small" style="display:block">${s.artist}</small></span></button>`).join('')}</div>
    </div>`;
    const art = $('.m-art', el), canvas = $('.m-viz', el), cx = canvas.getContext('2d');
    const paint = () => {
      const s = SONGS[music.song];
      $('.m-title', el).textContent = s.title;
      $('.m-sub', el).textContent = s.artist;
      art.style.setProperty('--c1', s.color[0]);
      art.style.setProperty('--c2', s.color[1]);
      art.classList.toggle('playing', music.playing);
      $('.m-play', el).innerHTML = ic(music.playing ? 'pause' : 'play');
      $('.m-progress i', el).style.width = (music.pos / s.notes.length) * 100 + '%';
      $$('[data-song]', el).forEach(b => b.classList.toggle('on', +b.dataset.song === music.song));
    };
    music.onChange = paint;
    $('.m-play', el).onclick = () => (music.playing ? musicPause() : musicPlay());
    $('.m-prev', el).onclick = () => musicSkip(-1);
    $('.m-next', el).onclick = () => musicSkip(1);
    $$('[data-song]', el).forEach(b => (b.onclick = () => {
      music.song = +b.dataset.song - 1;
      musicSkip(1);
      musicPlay();
    }));

    // Hangszínkép: oszlopok, amik a zenére ugrálnak
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    let raf = 0;
    const data = new Uint8Array(32);
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const w = canvas.width, h = canvas.height;
      cx.clearRect(0, 0, w, h);
      if (music.analyser) music.analyser.getByteFrequencyData(data);
      const s = SONGS[music.song], n = 24, bw = w / n;
      const grad = cx.createLinearGradient(0, h, 0, 0);
      grad.addColorStop(0, s.color[0]);
      grad.addColorStop(1, s.color[1]);
      cx.fillStyle = grad;
      for (let i = 0; i < n; i++) {
        const v = music.playing ? data[i + 1] / 255 : 0.04;
        const bh = Math.max(3 * dpr, v * h);
        cx.beginPath();
        cx.roundRect(i * bw + bw * 0.2, h - bh, bw * 0.6, bh, 3 * dpr);
        cx.fill();
      }
    };
    draw();
    paint();
    return () => { cancelAnimationFrame(raf); music.onChange = null; };
  },
});

// ---------------------------------------------------------------- Kígyó
registerApp({
  id: 'snake', name: 'Kígyó', icon: 'gamepad', bg: 'linear-gradient(135deg,#7f5af0,#2cb67d)', dark: true,
  optional: true, category: 'Játékok', desc: 'A klasszikus kígyós játék szivárványszínben. Edd meg a pöttyöket, nőj minél nagyobbra, és döntsd meg a rekordodat!',
  render(el) {
    const N = 17;
    el.innerHTML = `<div class="game">
      <div class="game-top"><span>Pont: <b class="g-score">0</b></span><span class="muted">Rekord: <b class="g-best">${store.get('snakeBest', 0)}</b></span></div>
      <div class="game-board"><canvas></canvas>
        <div class="game-msg"><b class="g-title">Kígyó</b><span class="muted g-text">Edd meg a piros pöttyöket, de a falba és magadba ne ütközz!</span><button class="btn g-start">Játék indítása</button></div>
      </div>
      <div class="dpad">
        <span></span><button data-d="0,-1" aria-label="Fel">${ic('chevUp')}</button><span></span>
        <button data-d="-1,0" aria-label="Balra">${ic('chevLeft')}</button><span></span><button data-d="1,0" aria-label="Jobbra">${ic('chevRight')}</button>
        <span></span><button data-d="0,1" aria-label="Le">${ic('chevDown')}</button><span></span>
      </div>
    </div>`;
    const canvas = $('canvas', el), ctx = canvas.getContext('2d'), board = $('.game-board', el), msg = $('.game-msg', el);
    const size = Math.min(board.clientWidth, 330);
    const dpr = window.devicePixelRatio || 1;
    const cell = size / N;
    canvas.style.width = canvas.style.height = size + 'px';
    board.style.height = size + 'px';
    canvas.width = canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let snake, dir, nextDir, food, score, speed, timer = null, running = false;

    const placeFood = () => {
      do food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
      while (snake.some(p => p.x === food.x && p.y === food.y));
    };
    const reset = () => {
      snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
      dir = nextDir = { x: 1, y: 0 };
      score = 0;
      speed = 150;
      placeFood();
      $('.g-score', el).textContent = 0;
    };
    const draw = () => {
      ctx.fillStyle = '#0d0f17';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = 'rgba(255,255,255,.035)';
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) % 2) ctx.fillRect(x * cell, y * cell, cell, cell);
      // Világító étel
      ctx.shadowColor = '#ff3b5c';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ff3b5c';
      ctx.beginPath();
      ctx.arc((food.x + 0.5) * cell, (food.y + 0.5) * cell, cell * 0.33, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Szivárványos kígyó
      snake.forEach((p, i) => {
        ctx.fillStyle = `hsl(${(150 + i * 9) % 360} 85% ${i ? 55 : 62}%)`;
        ctx.beginPath();
        ctx.roundRect(p.x * cell + 1.5, p.y * cell + 1.5, cell - 3, cell - 3, cell * 0.32);
        ctx.fill();
      });
      // Szemek
      const h = snake[0];
      ctx.fillStyle = '#0d0f17';
      [[-0.18, -0.18], [0.18, -0.18]].forEach(([a, b]) => {
        const ex = dir.x ? b * -dir.x : a, ey = dir.y ? b * -dir.y : a;
        ctx.beginPath();
        ctx.arc((h.x + 0.5 + ex + dir.x * 0.12) * cell, (h.y + 0.5 + ey + dir.y * 0.12) * cell, cell * 0.08, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    const over = () => {
      running = false;
      clearInterval(timer);
      vibrate([80, 60, 160]);
      beep(220, 0.25);
      const best = store.get('snakeBest', 0);
      const record = score > best;
      if (record) { store.set('snakeBest', score); $('.g-best', el).textContent = score; ringFlash(); confetti(); }
      $('.g-title', el).textContent = record ? 'Új rekord!' : 'Vége a játéknak';
      $('.g-text', el).textContent = `${score} pontot szereztél.`;
      $('.g-start', el).textContent = 'Újra';
      msg.hidden = false;
    };
    const step = () => {
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N || snake.some(p => p.x === head.x && p.y === head.y)) { over(); return; }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score++;
        $('.g-score', el).textContent = score;
        beep(660 + score * 20, 0.06);
        placeFood();
        speed = Math.max(70, 150 - score * 4);
        clearInterval(timer);
        timer = setInterval(step, speed);
      } else snake.pop();
      draw();
    };
    const start = () => {
      reset();
      msg.hidden = true;
      running = true;
      clearInterval(timer);
      timer = setInterval(step, speed);
      draw();
    };
    const turn = (x, y) => {
      if (!running) return;
      if (x === -dir.x && y === -dir.y) return; // visszafelé nem fordulhat
      nextDir = { x, y };
    };
    $('.g-start', el).onclick = start;
    $$('[data-d]', el).forEach(b => (b.onclick = () => { const [x, y] = b.dataset.d.split(',').map(Number); turn(x, y); }));
    const onKey = e => {
      const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] }[e.key];
      if (d) { e.preventDefault(); turn(...d); }
      else if ((e.key === ' ' || e.key === 'Enter') && !running) start();
    };
    document.addEventListener('keydown', onKey);
    // Húzás (ujjal vagy egérrel) a pályán
    let sw = null;
    canvas.onpointerdown = e => { sw = { x: e.clientX, y: e.clientY }; };
    canvas.onpointerup = e => {
      if (!sw) return;
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      sw = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) turn(Math.sign(dx), 0);
      else turn(0, Math.sign(dy));
    };
    reset();
    draw();
    return () => { clearInterval(timer); document.removeEventListener('keydown', onKey); };
  },
});

// ---------------------------------------------------------------- Rajz
registerApp({
  id: 'paint', name: 'Rajz', icon: 'brush', bg: 'linear-gradient(135deg,#ffb347,#ff3c8e)',
  optional: true, category: 'Kreatív', desc: 'Rajzolj az ujjaddal 8 színnel és állítható ecsettel. A kész művet egy gombnyomással elmentheted a Fotókba.',
  render(el) {
    const COLORS = ['#1c1c1e', '#ff3b5c', '#ff9f0a', '#ffd60a', '#34c759', '#0a84ff', '#bf5af2', '#fafafa'];
    const PAPER = '#fafafa';
    el.innerHTML = `<div class="paint">
      <div class="app-bar"><button class="link p-clear">Törlés</button><b>Rajz</b><button class="link p-save">Mentés</button></div>
      <div class="paint-wrap"><canvas></canvas></div>
      <div class="paint-tools">
        <button class="p-undo" aria-label="Visszavonás">${ic('undo')}</button>
        <div class="paint-colors">${COLORS.map((c, i) => `<button class="pc${i === 5 ? ' on' : ''}" data-c="${c}" style="background:${c}" aria-label="Szín"></button>`).join('')}</div>
      </div>
      <div class="paint-size"><span class="p-dot"></span><input type="range" class="p-size" min="2" max="36" value="8"></div>
    </div>`;
    const wrap = $('.paint-wrap', el), canvas = $('canvas', el), ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.lineCap = ctx.lineJoin = 'round';
    const clear = () => { ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h); };
    clear();

    let color = COLORS[5], size = 8, last = null;
    const history = [];
    const dot = $('.p-dot', el);
    const updDot = () => { dot.style.width = dot.style.height = size + 'px'; dot.style.background = color; };
    updDot();
    const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    canvas.onpointerdown = e => {
      canvas.setPointerCapture(e.pointerId);
      history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (history.length > 15) history.shift();
      last = pos(e);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(last.x, last.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    };
    canvas.onpointermove = e => {
      if (!last) return;
      const p = pos(e);
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    };
    canvas.onpointerup = canvas.onpointercancel = () => { last = null; };
    $$('.pc', el).forEach(b => (b.onclick = () => {
      color = b.dataset.c;
      $$('.pc', el).forEach(x => x.classList.toggle('on', x === b));
      updDot();
    }));
    $('.p-size', el).oninput = e => { size = +e.target.value; updDot(); };
    $('.p-undo', el).onclick = () => { const img = history.pop(); if (img) ctx.putImageData(img, 0, 0); };
    $('.p-clear', el).onclick = () => { history.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); clear(); };
    $('.p-save', el).onclick = () => {
      const photos = store.get('photos', []);
      photos.push({ id: Date.now(), src: canvas.toDataURL('image/jpeg', 0.85) });
      savePhotos(photos);
      notify('Rajz', 'A rajzot elmentettem a Fotókba.', 'gallery');
    };
  },
});
