'use strict';
// =====================================================================
//  CSSOS 2.0 — beállító varázsló az első induláskor
//  Üdvözlés + nyelv → név → kinézet → PIN → kész
// =====================================================================

const SETUP_STEPS = 5;

// Új telefon: még soha nem mentett beállítást. A régi felhasználóknak nem jelenik meg.
const setupFresh = (() => { try { return localStorage.getItem('nova.settings') === null; } catch { return false; } })();
if (!setupFresh && !store.get('setupDone', false) && store.get('setupStep', null) === null) store.set('setupDone', true);

function startSetup() {
  let step = store.get('setupStep', 0) || 0;
  const el = document.createElement('div');
  el.id = 'setup';
  el.append(makeAurora());
  $('.aurora-fx', el).classList.add('on');
  const wallBtns = WALLPAPERS.map((w, i) => `<button class="su-wall${i === settings.wallpaper ? ' on' : ''}" data-wall="${i}" style="background:${w}" aria-label="Háttérkép ${i + 1}">${LIVE_WALLS.has(i) ? '<small class="live-tag">ÉLŐ</small>' : ''}</button>`).join('');
  const accBtns = ACCENTS.map((c, i) => `<button class="su-acc${i === settings.accent ? ' on' : ''}" data-acc="${i}" style="background:${c}" aria-label="Szín ${i + 1}"></button>`).join('');
  el.insertAdjacentHTML('beforeend', `
    <div class="su-track">
      <section class="su-step">
        <div class="su-logo"></div>
        <h1>Üdvözöl a CSSOS</h1>
        <p>Állítsuk be együtt a telefonodat. Csak egy perc!</p>
        <div class="su-lang"><button data-lang="hu" class="${LANG === 'hu' ? 'on' : ''}">Magyar</button><button data-lang="en" class="${LANG === 'en' ? 'on' : ''}">English</button></div>
        <button class="su-next">Kezdés</button>
      </section>
      <section class="su-step">
        <span class="su-ic">${ic('user')}</span>
        <h2>Hogy hívnak?</h2>
        <p>Így fog köszönni neked a telefon.</p>
        <input class="su-in su-name" maxlength="20" placeholder="A neved" value="${esc(settings.userName || '')}">
        <input class="su-in su-dev" maxlength="24" placeholder="A telefon neve" value="${esc(settings.deviceName)}">
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
        <span class="su-ic">${ic('lock')}</span>
        <h2>Védd a telefonodat</h2>
        <p>Állíts be egy 4 jegyű PIN-kódot, és csak te tudod majd feloldani.</p>
        <input class="su-in su-pin" type="password" inputmode="numeric" maxlength="4" placeholder="••••">
        <button class="su-next su-setpin">PIN beállítása</button>
        <button class="su-skip">Most kihagyom</button>
      </section>
      <section class="su-step">
        <span class="su-ic su-done">${ic('star')}</span>
        <h2>Minden kész!</h2>
        <p>Néhány trükk, amit érdemes tudni:</p>
        <ul class="su-tips">
          <li>${ic('chevLeft')}<span data-notr>${L('Lapozz oldalra: balra a <b>Ma</b> nézet, jobbra az <b>Alkalmazástár</b>.', 'Swipe sideways: <b>Today</b> view on the left, <b>App Library</b> on the right.')}</span></li>
          <li>${ic('chevDown')}<span data-notr>${L('Húzd le a felső sávot: bal fele az <b>értesítések</b>, jobb fele a <b>vezérlőközpont</b>.', 'Pull down the status bar: left half for <b>notifications</b>, right half for <b>Control Center</b>.')}</span></li>
          <li>${ic('timer')}<span data-notr>${L('Koppints a bal felső <b>Fénygyűrűre</b>: élő panellé nyílik.', 'Tap the <b>Light Ring</b> in the top-left corner: it opens into a live panel.')}</span></li>
        </ul>
        <button class="su-next su-finish">Indulás</button>
      </section>
    </div>
    <div class="su-dots">${Array.from({ length: SETUP_STEPS }, (_, i) => `<i data-i="${i}"></i>`).join('')}</div>`);
  screenEl.append(el);
  fillIcons(el);

  const track = $('.su-track', el);
  const show = (i, instant) => {
    step = Math.max(0, Math.min(SETUP_STEPS - 1, i));
    store.set('setupStep', step);
    if (instant) track.style.transition = 'none';
    track.style.transform = `translateX(${-step * 100}%)`;
    if (instant) { void track.offsetWidth; track.style.transition = ''; }
    $$('.su-dots i', el).forEach((d, k) => d.classList.toggle('on', k === step));
    $$('.su-step', el).forEach((s, k) => s.classList.toggle('cur', k === step));
    const inp = $$('.su-step', el)[step].querySelector('input');
    if (inp && !instant) setTimeout(() => inp.focus(), 450);
  };

  // 1. lépés: nyelv (a váltás újratölti a felületet, a varázsló ugyanitt folytatódik)
  $$('[data-lang]', el).forEach(b => (b.onclick = () => {
    if (b.dataset.lang === LANG) return;
    settings.lang = b.dataset.lang;
    store.set('settings', settings);
    location.reload();
  }));
  // 2. lépés: név
  $('.su-name', el).oninput = e => { settings.userName = e.target.value.trim(); store.set('settings', settings); };
  $('.su-dev', el).oninput = e => { settings.deviceName = e.target.value.trim() || OS.short + ' Telefon'; store.set('settings', settings); };
  // 3. lépés: kinézet (azonnal látszik a háttérben)
  $$('[data-dark]', el).forEach(b => (b.onclick = () => {
    settings.dark = b.dataset.dark === '1';
    settings.autoDark = false;
    saveSettings();
    $$('[data-dark]', el).forEach(x => x.classList.toggle('on', x === b));
  }));
  $$('[data-wall]', el).forEach(b => (b.onclick = () => {
    settings.wallpaper = +b.dataset.wall;
    saveSettings();
    $$('[data-wall]', el).forEach(x => x.classList.toggle('on', x === b));
  }));
  $$('[data-acc]', el).forEach(b => (b.onclick = () => {
    settings.accent = +b.dataset.acc;
    saveSettings();
    $$('[data-acc]', el).forEach(x => x.classList.toggle('on', x === b));
  }));
  // 4. lépés: PIN
  const pinIn = $('.su-pin', el);
  pinIn.oninput = () => { pinIn.value = pinIn.value.replace(/\D/g, ''); pinIn.classList.remove('bad'); };
  $('.su-setpin', el).onclick = e => {
    e.stopPropagation();
    if (!/^\d{4}$/.test(pinIn.value)) { pinIn.classList.add('bad'); vibrate(80); return; }
    settings.pin = pinIn.value;
    saveSettings();
    show(step + 1);
  };
  $('.su-skip', el).onclick = () => show(step + 1);
  // Tovább gombok
  $$('.su-next:not(.su-setpin):not(.su-finish)', el).forEach(b => (b.onclick = () => { keyClick(); show(step + 1); }));
  $$('.su-dots i', el).forEach(d => (d.onclick = () => { if (+d.dataset.i < step) show(+d.dataset.i); }));
  // Kész
  $('.su-finish', el).onclick = () => {
    saveSettings();
    store.set('setupDone', true);
    store.set('setupStep', null);
    welcomed = true;
    el.classList.add('out');
    if (locked) unlock();
    renderHome();
    setTimeout(confetti, 250);
    setTimeout(() => el.remove(), 700);
    notify(OS.name, L(`Szia${settings.userName ? ' ' + settings.userName : ''}! Jó szórakozást az új telefonodhoz! 🎉`, `Hi${settings.userName ? ' ' + settings.userName : ''}! Enjoy your new phone! 🎉`), 'settings');
  };
  show(step, true);
}

window.addEventListener('load', () => {
  if (store.get('setupStep', null) !== null || (setupFresh && !store.get('setupDone', false))) setTimeout(startSetup, 950);
});

// =====================================================================
//  Frissítés után: „Újdonságok” ablak (pl. 1.4 → 2.0), az adatok megmaradnak
// =====================================================================
const WHATS_NEW = [
  ['palette', 'Folyékony üveg', 'Fényes, csillogó üvegszélek mindenhol a rendszerben.'],
  ['sun', 'Mozgó fény', 'A csillanás követi, ahogy a telefont döntöd.'],
  ['settings', 'Üveg az appokban is', 'Az appok mögött átlátszik az elmosott háttérkép.'],
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
    if (from) {
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
