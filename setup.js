'use strict';
// =====================================================================
//  CSSOS — beállító varázsló (3.4: 9 lépés, CSS fiókkal)
//  Üdvözlés → internet → CSS fiók → telefon neve → kinézet → effektek → PIN → gesztusok → kész
//  Aki régebbi verzióról frissít, annak is újra végig kell mennie rajta (SETUP_REV),
//  de a jegyzetei, fotói, névjegyei és beállításai megmaradnak.
// =====================================================================

const SETUP_REV = 2;     // ha ez nő, minden telefonon újra indul a varázsló
const SETUP_STEPS = 9;
const needSetup = () => store.get('setupRev', 0) < SETUP_REV;

// ---------- CSS fiók (csak ezen a telefonon tárolódik) ----------
// A jelszót nem tároljuk, csak egy „ujjlenyomatát” (hash), sóval.
async function hashPass(pass, salt) {
  const data = new TextEncoder().encode(salt + ':' + pass);
  try {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Ha a böngésző nem engedi a titkosítást (pl. régi WebView): egyszerűbb, de működő hash
    let h = 2166136261;
    for (const b of data) { h ^= b; h = Math.imul(h, 16777619) >>> 0; }
    return 'f' + h.toString(16);
  }
}
const getAccount = () => store.get('account', null);

function startSetup() {
  let step = store.get('setupStep', 0) || 0;
  const acc = getAccount();
  const updated = !!store.get('lastVersion', null);
  const el = document.createElement('div');
  el.id = 'setup';
  el.append(makeAurora());
  $('.aurora-fx', el).classList.add('on');
  const wallBtns = WALLPAPERS.map((w, i) => `<button class="su-wall${i === settings.wallpaper ? ' on' : ''}" data-wall="${i}" style="background:${w}" aria-label="Háttérkép ${i + 1}">${LIVE_WALLS.has(i) ? '<small class="live-tag">ÉLŐ</small>' : ''}</button>`).join('');
  const accBtns = ACCENTS.map((c, i) => `<button class="su-acc${i === settings.accent ? ' on' : ''}" data-acc="${i}" style="background:${c}" aria-label="Szín ${i + 1}"></button>`).join('');
  const fx = settings.effects || 'auto';
  el.insertAdjacentHTML('beforeend', `
    <button class="su-back" aria-label="Vissza">${ic('chevLeft')}</button>
    <div class="su-track">
      <section class="su-step">
        <div class="su-logo"></div>
        <h1>${updated ? 'Üdv újra a CSSOS-ban' : 'Üdvözöl a CSSOS'}</h1>
        <p>${updated ? 'A rendszer frissült. Menjünk végig együtt a beállításokon, a meglévő adataid megmaradnak.' : 'Állítsuk be együtt a telefonodat. Csak pár perc!'}</p>
        <div class="su-lang"><button data-lang="hu" class="${LANG === 'hu' ? 'on' : ''}">Magyar</button><button data-lang="en" class="${LANG === 'en' ? 'on' : ''}">English</button></div>
        <button class="su-next">Kezdés</button>
      </section>

      <section class="su-step">
        <span class="su-ic">${ic('wifi')}</span>
        <h2>Internetkapcsolat</h2>
        <p>Az időjáráshoz és az online frissítésekhez internet kell.</p>
        <div class="su-net"></div>
        <button class="su-next">Tovább</button>
      </section>

      <section class="su-step su-acc-step">
        <span class="su-ic">${ic('user')}</span>
        ${acc ? `
          <h2>Bejelentkezés</h2>
          <p>Lépj be a CSS fiókodba.</p>
          <div class="su-who"><span class="su-av" data-notr>${esc(initials(acc.name))}</span><div><b data-notr>${esc(acc.name)}</b><small data-notr>@${esc(acc.user)}</small></div></div>
          <input class="su-in su-lpass" type="password" placeholder="Jelszó" autocomplete="current-password">
          <p class="su-err" hidden></p>
          <button class="su-next su-login">Bejelentkezés</button>
          <button class="su-skip su-newacc">Új fiók létrehozása helyette</button>`
        : `
          <h2>CSS fiók létrehozása</h2>
          <p>A fiókkal a telefon megjegyzi, ki vagy.</p>
          <input class="su-in su-aname" maxlength="20" placeholder="Teljes név" value="${esc(settings.userName || '')}" autocomplete="name">
          <input class="su-in su-auser" maxlength="20" placeholder="Felhasználónév" autocomplete="username" autocapitalize="off">
          <input class="su-in su-apass" type="password" placeholder="Jelszó (legalább 4 karakter)" autocomplete="new-password">
          <input class="su-in su-apass2" type="password" placeholder="Jelszó még egyszer" autocomplete="new-password">
          <p class="su-err" hidden></p>
          <button class="su-next su-create">Fiók létrehozása</button>`}
        <button class="su-skip su-noacc">Folytatás fiók nélkül</button>
        <p class="su-fine">A fiók csak ezen a telefonon tárolódik. Ne a Google- vagy más valódi jelszavadat add meg.</p>
      </section>

      <section class="su-step">
        <span class="su-ic">${ic('device')}</span>
        <h2>A telefonod neve</h2>
        <p>Így fog szerepelni a Beállításokban.</p>
        <input class="su-in su-dev" maxlength="24" placeholder="A telefon neve" value="${esc(settings.deviceName)}">
        <div class="su-preview"><small>Így köszön majd:</small><b class="su-greet"></b></div>
        <button class="su-next">Tovább</button>
      </section>

      <section class="su-step">
        <span class="su-ic">${ic('palette')}</span>
        <h2>Válassz kinézetet</h2>
        <div class="su-mode"><button data-dark="1" class="${isDark() ? 'on' : ''}">${ic('moon')} Sötét</button><button data-dark="0" class="${isDark() ? '' : 'on'}">${ic('sun')} Világos</button></div>
        <div class="su-walls">${wallBtns}</div>
        <div class="su-accs">${accBtns}</div>
        <button class="su-next">Tovább</button>
      </section>

      <section class="su-step">
        <span class="su-ic">${ic('bolt')}</span>
        <h2>Effektek</h2>
        <p>Mennyire legyen látványos az üveg?</p>
        <div class="su-choices">
          <button class="su-choice${fx === 'auto' ? ' on' : ''}" data-fx="auto"><b>Automatikus</b><small>Telefonon Sima, számítógépen Látványos. Ajánlott.</small></button>
          <button class="su-choice${fx === 'high' ? ' on' : ''}" data-fx="high"><b>Látványos</b><small>Teljes folyékony üveg, mozgó fénnyel. Erős telefonra.</small></button>
          <button class="su-choice${fx === 'mid' ? ' on' : ''}" data-fx="mid"><b>Sima</b><small>Üveg elmosás nélkül. Középkategóriás telefonra, pl. Poco.</small></button>
        </div>
        <button class="su-next">Tovább</button>
      </section>

      <section class="su-step">
        <span class="su-ic">${ic('lock')}</span>
        <h2>Védd a telefonodat</h2>
        <p>Állíts be egy 4 jegyű PIN-kódot, és csak te tudod majd feloldani.</p>
        <input class="su-in su-pin" type="password" inputmode="numeric" maxlength="4" placeholder="••••">
        <button class="su-next su-setpin">PIN beállítása</button>
        <button class="su-skip su-skippin">${settings.pin ? 'Marad a mostani PIN' : 'Most kihagyom'}</button>
      </section>

      <section class="su-step">
        <span class="su-ic">${ic('hand')}</span>
        <h2>Így irányítasz</h2>
        <ul class="su-tips">
          <li>${ic('chevUp')}<span>Húzd fel az alsó csíkot: haza. Félúton megállva: appváltó.</span></li>
          <li>${ic('settings')}<span>Tarts nyomva egy ikont a gyorsmenühöz.</span></li>
          <li>${ic('star')}<span>Tartsd nyomva az üres kezdőképernyőt: Varázskör.</span></li>
          <li>${ic('chevDown')}<span>Húzd le a felső sávot: bal fele értesítések, jobb fele vezérlőközpont.</span></li>
          <li>${ic('timer')}<span>Koppints a bal felső Fénygyűrűre: élő panel.</span></li>
        </ul>
        <button class="su-next">Értem</button>
      </section>

      <section class="su-step">
        <span class="su-ic su-done">${ic('star')}</span>
        <h2>Minden kész!</h2>
        <div class="su-summary"></div>
        <button class="su-next su-finish">Indulás</button>
      </section>
    </div>
    <div class="su-dots">${Array.from({ length: SETUP_STEPS }, (_, i) => `<i data-i="${i}"></i>`).join('')}</div>`);
  screenEl.append(el);
  fillIcons(el);

  const track = $('.su-track', el);
  const steps = $$('.su-step', el);
  const show = (i, instant) => {
    step = Math.max(0, Math.min(SETUP_STEPS - 1, i));
    store.set('setupStep', step);
    if (instant) track.style.transition = 'none';
    track.style.transform = `translateX(${-step * 100}%)`;
    if (instant) { void track.offsetWidth; track.style.transition = ''; }
    $$('.su-dots i', el).forEach((d, k) => d.classList.toggle('on', k === step));
    steps.forEach((s, k) => s.classList.toggle('cur', k === step));
    $('.su-back', el).classList.toggle('on', step > 0);
    if (step === 1) renderNet();
    if (step === 3) renderGreet();
    if (step === SETUP_STEPS - 1) renderSummary();
    const inp = steps[step].querySelector('input');
    if (inp && !instant) setTimeout(() => inp.focus(), 450);
  };
  const next = () => { keyClick(); show(step + 1); };
  const err = (box, msg) => {
    const p = $('.su-err', box);
    p.textContent = msg ? trText(msg) : '';
    p.hidden = !msg;
    if (msg) vibrate(80);
  };

  // 0. nyelv (a váltás újratölti a felületet, a varázsló ugyanitt folytatódik)
  $$('[data-lang]', el).forEach(b => (b.onclick = () => {
    if (b.dataset.lang === LANG) return;
    settings.lang = b.dataset.lang;
    store.set('settings', settings);
    location.reload();
  }));

  // 1. internet: a valódi kapcsolat állapota
  function renderNet() {
    const on = navigator.onLine;
    $('.su-net', el).innerHTML = `<div class="su-netrow ${on ? 'ok' : 'bad'}">${ic(on ? 'wifi' : 'close')}<div><b>${on ? 'Csatlakozva' : 'Nincs internet'}</b><small>${on ? 'Minden rendben, mehetünk tovább.' : 'Internet nélkül is folytathatod, később is beállíthatod.'}</small></div></div>`;
  }
  window.addEventListener('online', () => step === 1 && renderNet());
  window.addEventListener('offline', () => step === 1 && renderNet());

  // 2. CSS fiók
  const accStep = $('.su-acc-step', el);
  const create = $('.su-create', el);
  if (create) create.onclick = async e => {
    e.stopPropagation();
    const name = $('.su-aname', el).value.trim(), user = $('.su-auser', el).value.trim().toLowerCase();
    const p1 = $('.su-apass', el).value, p2 = $('.su-apass2', el).value;
    if (!name) return err(accStep, 'Írd be a neved.');
    if (!/^[a-z0-9._]{3,20}$/.test(user)) return err(accStep, 'A felhasználónév 3–20 karakter: kisbetű, szám, pont vagy aláhúzás.');
    if (p1.length < 4) return err(accStep, 'A jelszó legyen legalább 4 karakter.');
    if (p1 !== p2) return err(accStep, 'A két jelszó nem egyezik.');
    err(accStep, '');
    const salt = Math.random().toString(36).slice(2);
    store.set('account', { name, user, salt, hash: await hashPass(p1, salt), created: Date.now() });
    settings.userName = name.split(/\s+/)[0];
    store.set('settings', settings);
    confetti();
    next();
  };
  const login = $('.su-login', el);
  if (login) login.onclick = async e => {
    e.stopPropagation();
    const a = getAccount(), input = $('.su-lpass', el);
    if (!input.value) return err(accStep, 'Írd be a jelszavad.');
    if ((await hashPass(input.value, a.salt)) !== a.hash) { input.classList.add('bad'); return err(accStep, 'Hibás jelszó. Próbáld újra.'); }
    err(accStep, '');
    settings.userName = a.name.split(/\s+/)[0];
    store.set('settings', settings);
    next();
  };
  const newAcc = $('.su-newacc', el);
  if (newAcc) newAcc.onclick = () => {
    if (!confirm('Új fiókot hozol létre? A mostani fiók törlődik erről a telefonról (az adataid megmaradnak).')) return;
    store.set('account', null);
    store.set('setupStep', 2);
    location.reload();
  };
  $('.su-noacc', el).onclick = () => { store.set('account', null); next(); };
  $$('.su-in', el).forEach(i => i.addEventListener('input', () => i.classList.remove('bad')));

  // 3. telefon neve + a köszönés előnézete
  function renderGreet() {
    const h = new Date().getHours();
    const g = h < 5 ? 'Jó éjszakát' : h < 10 ? 'Jó reggelt' : h < 18 ? 'Jó napot' : 'Jó estét';
    $('.su-greet', el).textContent = `${g}${settings.userName ? ', ' + settings.userName : ''}!`;
  }
  $('.su-dev', el).oninput = e => { settings.deviceName = e.target.value.trim() || OS.short + ' Telefon'; store.set('settings', settings); };

  // 4. kinézet (azonnal látszik a háttérben)
  $$('[data-dark]', el).forEach(b => (b.onclick = () => {
    settings.dark = b.dataset.dark === '1'; settings.autoDark = false; saveSettings();
    $$('[data-dark]', el).forEach(x => x.classList.toggle('on', x === b));
  }));
  $$('[data-wall]', el).forEach(b => (b.onclick = () => {
    settings.wallpaper = +b.dataset.wall; saveSettings();
    $$('[data-wall]', el).forEach(x => x.classList.toggle('on', x === b));
  }));
  $$('[data-acc]', el).forEach(b => (b.onclick = () => {
    settings.accent = +b.dataset.acc; saveSettings();
    $$('[data-acc]', el).forEach(x => x.classList.toggle('on', x === b));
  }));

  // 5. effektek
  $$('[data-fx]', el).forEach(b => (b.onclick = () => {
    settings.effects = b.dataset.fx; saveSettings();
    $$('[data-fx]', el).forEach(x => x.classList.toggle('on', x === b));
  }));

  // 6. PIN
  const pinIn = $('.su-pin', el);
  pinIn.oninput = () => { pinIn.value = pinIn.value.replace(/\D/g, ''); pinIn.classList.remove('bad'); };
  $('.su-setpin', el).onclick = e => {
    e.stopPropagation();
    if (!/^\d{4}$/.test(pinIn.value)) { pinIn.classList.add('bad'); vibrate(80); return; }
    settings.pin = pinIn.value; saveSettings(); next();
  };
  $('.su-skippin', el).onclick = next;

  // 8. összegzés
  function renderSummary() {
    const a = getAccount();
    const rows = [
      ['user', a ? `${a.name} (@${a.user})` : trText('Fiók nélkül')],
      ['device', settings.deviceName],
      ['palette', trText(isDark() ? 'Sötét mód' : 'Világos mód')],
      ['bolt', trText({ auto: 'Automatikus', high: 'Látványos', mid: 'Sima', fast: 'Gyors' }[settings.effects || 'auto'])],
      ['lock', trText(settings.pin ? 'PIN-kód bekapcsolva' : 'PIN-kód nélkül')],
    ];
    $('.su-summary', el).innerHTML = rows.map(([i, t]) => `<div class="su-sumrow">${ic(i)}<span data-notr>${esc(t)}</span></div>`).join('');
  }

  // Lapozás
  $$('.su-next:not(.su-setpin):not(.su-finish):not(.su-create):not(.su-login)', el).forEach(b => (b.onclick = next));
  $('.su-back', el).onclick = () => show(step - 1);
  $$('.su-dots i', el).forEach(d => (d.onclick = () => { if (+d.dataset.i < step) show(+d.dataset.i); }));

  // Kész
  $('.su-finish', el).onclick = () => {
    saveSettings();
    store.set('setupDone', true);
    store.set('setupRev', SETUP_REV);
    store.set('setupStep', null);
    welcomed = true;
    el.classList.add('out');
    if (locked) unlock();
    renderHome();
    setTimeout(confetti, 250);
    setTimeout(() => el.remove(), 700);
    notify(OS.name, L(`Szia${settings.userName ? ' ' + settings.userName : ''}! Jó szórakozást a telefonodhoz! 🎉`, `Hi${settings.userName ? ' ' + settings.userName : ''}! Enjoy your phone! 🎉`), 'settings');
  };
  show(step, true);
}

window.addEventListener('load', () => {
  if (needSetup()) setTimeout(startSetup, 950);
});

// =====================================================================
//  Frissítés után: „Újdonságok” ablak (pl. 1.4 → 2.0), az adatok megmaradnak
// =====================================================================
const WHATS_NEW = [
  ['user', 'Új beállító varázsló', 'Kilenc lépés, CSS fiókkal. Frissítés után mindenkinek újra végig kell mennie rajta.'],
];

function showWhatsNew(from) {
  const el = document.createElement('div');
  el.id = 'whatsnew';
  el.innerHTML = `<div class="wn-card">
    <div class="su-logo wn-logo"></div>
    <small>${esc(from)} → ${OS.version}</small>
    <h2>Frissítve: ${OS.name} ${OS.version}</h2>
    <ul class="su-tips">${WHATS_NEW.map(([i, t, d]) => `<li>${ic(i)}<span><b>${t}</b><br>${d}</span></li>`).join('')}</ul>
    <button class="su-next wn-ok">Rendben</button>
  </div>`;
  screenEl.append(el);
  $('.wn-ok', el).onclick = () => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 400);
    confetti();
  };
}

window.addEventListener('load', () => {
  const last = store.get('lastVersion', null);
  if (last !== OS.version) {
    // Van már adat a telefonon (régi verzió futott rajta), de a verziót még nem jegyeztük fel → 1.4 vagy régebbi
    const from = last || (setupFresh ? null : '1.4');
    store.set('lastVersion', OS.version);
    if (from && !needSetup()) { // ha úgyis indul a varázsló, nem kell külön ablak
      store.set('prevVersion', from);
      setTimeout(() => showWhatsNew(from), 1300);
    }
  }
});

// =====================================================================
//  Online frissítés (Android): keresés, letöltés, újraindítás
// =====================================================================
window.updateState = {};
let updateManual = false;

function startUpdateCheck(manual) {
  if (!ANDROID || !ANDROID.checkUpdate) return;
  updateManual = manual;
  window.updateState = { busy: true, text: L('Frissítések keresése…', 'Checking for updates…') };
  refreshUpdatePage();
  store.set('lastUpdateCheck', Date.now());
  ANDROID.checkUpdate();
}

function refreshUpdatePage() {
  // Ha épp a Rendszerfrissítés oldal van nyitva, újrarajzoljuk
  if (current === 'settings' && $('.update-box')) { window.settingsStartPage = 'update'; openApp('settings'); }
}

// A telefon (Updater.java) visszajelzései — a fájlból telepítésé is
window.cssosUpdateStatus = (st, version) => {
  const T = {
    latest: L('A rendszer naprakész.', 'Your system is up to date.'),
    ready: L(`Letöltve: ${OS.name} ${version}. Indítsd újra a telefont a frissítéshez.`, `Downloaded: ${OS.name} ${version}. Restart to update.`),
    apk: L(`Új verzió: ${OS.name} ${version}. Ehhez az appot is frissíteni kell.`, `New version: ${OS.name} ${version}. The app needs updating too.`),
    offline: L('Nem sikerült elérni a frissítési szervert. Van internet?', "Couldn't reach the update server. Are you online?"),
    permission: L('Engedélyezd a CSSOS-nak, hogy frissítést telepítsen, aztán koppints újra a gombra.', 'Allow CSSOS to install updates, then tap the button again.'),
    installing: L('A telefon most telepíti a frissítést. Utána a CSSOS újraindul.', 'The phone is installing the update. CSSOS will restart afterwards.'),
    error: L('Nem sikerült megnyitni a fájlt. Biztos, hogy a CSSOS.apk-t választottad?', "Couldn't open the file. Are you sure you picked CSSOS.apk?"),
  };
  if (['latest', 'ready', 'apk', 'offline'].includes(st)) {
    window.updateState = { state: st, text: T[st] };
    refreshUpdatePage();
    // Magától indított ellenőrzésnél csak akkor szólunk, ha tényleg van új verzió
    if (st === 'ready' || st === 'apk' || updateManual) notify(L('Rendszerfrissítés', 'Software Update'), T[st], 'settings');
  } else if (T[st]) {
    notify(L('Rendszerfrissítés', 'Software Update'), T[st], 'settings');
  }
};

// Naponta egyszer magától is keres (indulás után, hogy ne lassítsa a betöltést)
window.addEventListener('load', () => {
  if (Date.now() - store.get('lastUpdateCheck', 0) > 20 * 3600 * 1000) setTimeout(() => startUpdateCheck(false), 8000);
});
