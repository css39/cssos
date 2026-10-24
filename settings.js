'use strict';
// =====================================================================
//  CSSOS — Beállítások alkalmazás
//  Új oldal: adj egy bejegyzést a SETTINGS_PAGES-hez, és linkeld a főoldalról sLink()-kel.
//  A keresés automatikusan megtalálja az új oldalak sorait is.
// =====================================================================

const AUTO_LOCK_OPTS = [[30, '30 mp'], [60, '1 perc'], [300, '5 perc'], [0, 'Soha']];
const TEXT_SIZE_OPTS = [['small', 'Kicsi'], ['normal', 'Normál'], ['large', 'Nagy'], ['xl', 'Óriás']];
const SHAPE_OPTS = [['drop', 'Csepp'], ['circle', 'Kör'], ['square', 'Négyzet'], ['leaf', 'Levél']];

// 'cc.xxx' kulcs a vezérlőközpont állapota, minden más a settings objektum
function getOpt(k) { return k === 'dark' ? isDark() : k.startsWith('cc.') ? cc[k.slice(3)] : settings[k]; }
function setOpt(k, v) {
  if (k.startsWith('cc.')) {
    const key = k.slice(3);
    cc[key] = v;
    if (key === 'airplane' && v) { cc.wifi = false; cc.bt = false; cc.data = false; }
    applyCC();
  } else {
    settings[k] = v;
    if (k === 'dark') settings.autoDark = false; // kézi váltás kikapcsolja az automatikát
    saveSettings();
    if (k === 'showWidget' || k === 'labels') renderHome();
    // Nyelvváltás: a felület újratöltődik az új nyelven, és visszanyílik ez az oldal
    if (k === 'lang') { store.set('reopen', { page: 'general', t: Date.now() }); setTimeout(() => location.reload(), 150); }
  }
}

// Építőelemek a beállítás-oldalakhoz
const sIcon = (name, bg) => `<span class="ri" style="background:${bg}">${ic(name)}</span>`;
const sSw = (k, text, icon = '') => `<div class="row">${icon}<span class="grow">${text}</span><button class="switch${getOpt(k) ? ' on' : ''}" data-sw="${k}" aria-label="${text}"></button></div>`;
const sLink = (page, text, icon = '', value = '') => `<button class="row" data-go="${page}">${icon}<span class="grow">${text}</span><span class="chev">${value}</span></button>`;
const sSeg = (k, opts) => `<div class="row seg-row"><div class="segmented" data-seg="${k}">${opts.map(([v, l]) => `<button data-v='${JSON.stringify(v)}' class="${getOpt(k) === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
const sRange = (k, min, max, left, right) => `<div class="row"><div class="range-row">${left}<input type="range" data-range="${k}" min="${min}" max="${max}" value="${getOpt(k)}">${right}</div></div>`;
const sText = (k, text, max, placeholder = '') => `<label class="row">${text} <input class="field" data-text="${k}" maxlength="${max}" placeholder="${placeholder}" value="${esc(getOpt(k))}"></label>`;
const sLabel = t => `<div class="group-label">${t}</div>`;
const sNote = t => `<div class="group-note">${t}</div>`;

function rawSize(k) { try { return (localStorage.getItem('nova.' + k) || '').length * 2; } catch { return 0; } }
function fmtBytes(b) {
  const s = b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB';
  return s.replace('.', ',');
}
function fmtDur(ms) {
  const m = Math.round(ms / 60000);
  if (m < 1) return '1 percnél kevesebb';
  const h = Math.floor(m / 60);
  return h ? `${h} óra ${m % 60} perc` : `${m} perc`;
}
const battText = () => (batteryLevel === null ? '' : Math.round(batteryLevel * 100) + '%');

const SETTINGS_PAGES = {
  main: {
    title: 'Beállítások',
    html: () => `
      <div class="s-search">${ic('search')}<input class="s-q" placeholder="Keresés a beállításokban" autocomplete="off"></div>
      <div class="s-results"></div>
      <div class="s-main">
      <div class="group"><button class="row" data-go="general"><div class="avatar">${ic('device')}</div>
        <div class="grow"><b>${esc(settings.deviceName)}</b><div class="muted small">${OS.name} ${OS.version}</div></div><span class="chev"></span></button></div>
      <div class="group">
        ${sSw('cc.airplane', 'Repülőgép üzemmód', sIcon('plane', '#ff9f0a'))}
        ${sSw('cc.wifi', 'Wi-Fi', sIcon('wifi', '#0a84ff'))}
        ${sSw('cc.bt', 'Bluetooth', sIcon('bluetooth', '#0a84ff'))}
        ${sSw('cc.data', 'Mobiladat', sIcon('signal', '#34c759'))}
      </div>
      <div class="group">
        ${sLink('notifications', 'Értesítések', sIcon('bell', '#ff3b30'))}
        ${sLink('sounds', 'Hangok és rezgés', sIcon('speaker', '#ff2d55'), settings.volume + '%')}
        ${sSw('cc.dnd', 'Ne zavarj', sIcon('moon', '#5e5ce6'))}
        ${sLink('screentime', 'Képernyőidő', sIcon('hourglass', '#5856d6'))}
      </div>
      <div class="group">
        ${sLink('display', 'Kijelző és fényerő', sIcon('sun', '#0a84ff'))}
        ${sLink('wallpaper', 'Háttérkép és színek', sIcon('palette', '#34aadc'))}
        ${sLink('home', 'Kezdőképernyő', sIcon('home', '#5856d6'))}
        ${sLink('lockscreen', 'Zárolási képernyő', sIcon('device', '#ff375f'))}
        ${sLink('access', 'Kisegítő lehetőségek', sIcon('access', '#0a84ff'))}
        ${sLink('gestures', 'Gesztusok', sIcon('hand', '#ff9f0a'))}
      </div>
      <div class="group">
        ${sLink('battery', 'Akkumulátor', sIcon('battery', '#34c759'), battText())}
        ${sLink('security', 'Biztonság és PIN', sIcon('lock', '#8e8e93'), settings.pin ? 'Be' : 'Ki')}
        ${sLink('assistant', 'Asszisztens', sIcon('bot', '#af52de'), esc(settings.botName))}
        ${sLink('storage', 'Tárhely', sIcon('storage', '#30b0c7'))}
        ${sLink('general', 'Általános', sIcon('info', '#8e8e93'))}
      </div>
      </div>`,
  },

  notifications: {
    title: 'Értesítések',
    html: () => `
      <div class="group">
        ${sSw('preview', 'Előnézet zárolt képernyőn')}
        ${sSw('notifSound', 'Értesítési hang')}
        ${sSw('cc.dnd', 'Ne zavarj')}
      </div>
      ${sNote('A korábbi értesítéseket az értesítési központban látod: húzd le (vagy koppints) a felső sáv bal felén. Ha az előnézet ki van kapcsolva, zárolt képernyőn csak annyi látszik: „Új értesítés”. Ne zavarj módban nem ugranak fel az értesítések, de az értesítési központba bekerülnek.')}
      <div class="group"><button class="row link" data-act="openNC">Értesítési központ megnyitása</button></div>
      ${sLabel('Fénygyűrű')}
      <div class="group">${sSw('ring', 'Fénygyűrű jelzései')}</div>
      ${sNote('A kamera körüli gyűrű jelez: villan, ha értesítés jön, zölden pulzál hívás közben, narancssárgán fogy, amíg fut az időzítő, és pirosan világít, amíg a kamera be van kapcsolva. A kamera jelzése kikapcsolt gyűrűnél is megmarad. Ha rákoppintasz a gyűrűre, élő panellé nyílik ki.')}
      <div class="group"><button class="row link" data-act="testNotif">Próbaértesítés küldése</button></div>`,
  },

  sounds: {
    title: 'Hangok és rezgés',
    html: () => `
      ${sLabel('Hangerő')}
      <div class="group">${sRange('volume', 0, 100, ic('speakerLow'), ic('speaker'))}</div>
      ${sNote('A telefon bal oldalán lévő gombokkal is állíthatod.')}
      <div class="group">
        ${sSw('keySound', 'Billentyűhangok')}
        ${sSw('notifSound', 'Értesítési hang')}
        ${sSw('vibrate', 'Rezgés')}
      </div>
      ${sNote('A rezgés csak olyan telefonon érezhető, amelyik támogatja.')}
      <div class="group"><button class="row link" data-act="testSound">Hang kipróbálása</button></div>`,
  },

  screentime: {
    title: 'Képernyőidő',
    html: () => {
      const used = Object.entries(usageLive()).filter(([id]) => apps[id]).sort((a, b) => b[1] - a[1]);
      const total = used.reduce((a, [, ms]) => a + ms, 0);
      const max = used.length ? used[0][1] : 1;
      return `
        <div class="group"><div class="row col">
          <span class="muted small">Ma összesen</span>
          <span class="usage-total">${total ? fmtDur(total) : '0 perc'}</span>
        </div></div>
        ${used.length ? `${sLabel('Alkalmazások')}<div class="group">${used.map(([id, ms]) => `
          <div class="row">
            <span class="ri" style="background:${apps[id].bg};color:${apps[id].fg || '#fff'}">${appIcon(apps[id])}</span>
            <div class="usage-app"><div class="top"><span>${esc(apps[id].name)}</span><span class="muted">${fmtDur(ms)}</span></div>
            <div class="usage-bar"><i style="width:${Math.max(3, (ms / max) * 100)}%"></i></div></div>
          </div>`).join('')}</div>` : '<div class="empty">Ma még nem használtál egy appot sem.</div>'}
        ${sNote('Az idő csak akkor számít, amikor egy app nyitva van és a telefon nincs zárolva. Éjfélkor nullázódik.')}
        <div class="group"><button class="row danger" data-act="resetUsage">Mai képernyőidő törlése</button></div>`;
    },
  },

  display: {
    title: 'Kijelző és fényerő',
    html: () => `
      <div class="group">
        ${sSw('dark', 'Sötét mód')}
        ${sSw('autoDark', 'Automatikus (este sötét)')}
      </div>
      ${sNote('Automatikus módban este 7-től reggel 7-ig sötét, napközben világos a téma.')}
      ${sLabel('Fényerő')}
      <div class="group">${sRange('cc.bright', 20, 100, ic('sunLow'), ic('sun'))}</div>
      ${sLabel('Szemkímélő mód')}
      <div class="group">
        ${sSw('eyeCare', 'Szemkímélő mód', sIcon('eye', '#ff9f0a'))}
        ${settings.eyeCare ? sRange('eyeCareLevel', 10, 100, '<span class="muted small">Enyhe</span>', '<span class="muted small">Erős</span>') : ''}
      </div>
      ${sNote('Melegebb színűre állítja a kijelzőt, ami este kíméli a szemet.')}
      ${sLabel('Szövegméret')}
      <div class="group">
        ${sSeg('textSize', TEXT_SIZE_OPTS)}
        <div class="row text-preview">Így néz ki a szöveg ebben a méretben.</div>
      </div>
      ${sLabel('Automatikus zárolás')}
      <div class="group">${sSeg('autoLock', AUTO_LOCK_OPTS)}</div>
      ${sNote('Ennyi idő után kapcsol ki a képernyő, ha nem nyúlsz a telefonhoz.')}
      ${sLabel('Effektek')}
      <div class="group">${sSeg('effects', [['auto', 'Automatikus'], ['high', 'Látványos'], ['mid', 'Sima'], ['fast', 'Gyors']])}</div>
      ${sNote('Látványos: teljes folyékony üveg. Sima: üveg elmosás és mozgó fény nélkül, középkategóriás telefonokra. Gyors: egyszerű felületek. Az Automatikus telefonon a Simát, számítógépen a Látványosat választja.')}
      <div class="group">
        ${sSw('reduceMotion', 'Animációk csökkentése')}
        ${sLink('access', 'Kisegítő lehetőségek')}
      </div>`,
  },

  wallpaper: {
    title: 'Háttérkép és színek',
    html: () => `
      ${sLabel('Háttérkép')}
      <div class="group"><div class="row"><div class="walls">${WALLPAPERS.map((w, i) => `<button class="wall${i === settings.wallpaper ? ' on' : ''}" data-wall="${i}" style="background:${w}" aria-label="Háttérkép ${i + 1}">${LIVE_WALLS.has(i) ? '<small class="live-tag">ÉLŐ</small>' : ''}</button>`).join('')}</div></div></div>
      ${sNote('Az „ÉLŐ” jelű háttérképek lassan mozognak. Az utolsó, az „Aurora”, világító színfelhőkből áll.')}
      <div class="group">${sSw('touchLight', 'Érintés-fény')}</div>
      ${sNote('Ahova a kezdő- vagy a zárolási képernyőn koppintasz, egy fénygyűrű terjed szét.')}
      ${sLabel('Kiemelő szín')}
      <div class="group"><div class="row"><div class="accents">${ACCENTS.map((c, i) => `<button class="accent${i === settings.accent ? ' on' : ''}" data-accent="${i}" style="background:${c}" aria-label="Szín ${i + 1}"></button>`).join('')}</div></div></div>
      ${sNote('A kiemelő szín a gombokon, a linkeken, az üzenetbuborékokon és a Fénygyűrű értesítés-villanásán látszik.')}`,
  },

  home: {
    title: 'Kezdőképernyő',
    html: () => `
      ${sLabel('Ikonforma')}
      <div class="group"><div class="row"><div class="shape-opts">${SHAPE_OPTS.map(([v, l]) =>
        `<button class="shape-btn${settings.iconShape === v ? ' on' : ''}" data-shape="${v}"><i style="border-radius:${ICON_SHAPES[v]}"></i>${l}</button>`).join('')}</div></div></div>
      ${sNote('A „Csepp” a CSSOS saját ikonformája.')}
      ${sLabel('Ikonméret')}
      <div class="group">${sSeg('iconSize', [['small', 'Kicsi'], ['normal', 'Normál'], ['large', 'Nagy']])}</div>
      ${sLabel('Oszlopok száma')}
      <div class="group">${sSeg('columns', [[4, '4 oszlop'], [5, '5 oszlop']])}</div>
      <div class="group">
        ${sSw('showWidget', 'Üdvözlő widget')}
        ${sSw('labels', 'App nevek megjelenítése')}
      </div>`,
  },

  lockscreen: {
    title: 'Zárolási képernyő',
    html: () => `
      ${sLabel('Óra stílusa')}
      <div class="group">${sSeg('lockStyle', [['thin', 'Vékony'], ['normal', 'Normál'], ['bold', 'Vastag']])}</div>
      ${sLabel('Óra színe')}
      <div class="group">${sSeg('lockColor', [['white', 'Fehér'], ['accent', 'Kiemelő szín']])}</div>
      <div class="group">
        ${sSw('lockSeconds', 'Másodpercek mutatása')}
        ${sSw('preview', 'Értesítések előnézete')}
      </div>
      ${sLabel('Tulajdonos üzenete')}
      <div class="group">${sText('ownerMsg', 'Üzenet', 60, 'pl. Ha megtaláltad, hívj!')}</div>
      ${sNote('Ez a szöveg a zárolási képernyő alján látszik. Jól jön, ha elhagyod a telefont.')}
      <div class="group"><button class="row link" data-act="lockNow">Zárolási képernyő megnézése</button></div>`,
  },

  access: {
    title: 'Kisegítő lehetőségek',
    html: () => `
      <div class="group">
        ${sSw('boldText', 'Félkövér szöveg')}
        ${sLink('display', 'Szövegméret', '', TEXT_SIZE_OPTS.find(o => o[0] === settings.textSize)?.[1] || '')}
      </div>
      ${sLabel('Színszűrő')}
      <div class="group">${sSeg('colorFilter', [['none', 'Nincs'], ['gray', 'Szürke'], ['invert', 'Fordított'], ['contrast', 'Kontraszt']])}</div>
      ${sNote('A „Szürke” segít kevesebbet nyomkodni a telefont, a „Fordított” és a „Kontraszt” pedig a jobb olvashatóságot.')}
      <div class="group">
        ${sSw('reduceMotion', 'Animációk csökkentése')}
        ${sSw('vibrate', 'Rezgés')}
        ${sSw('keySound', 'Billentyűhangok')}
      </div>`,
  },

  battery: {
    title: 'Akkumulátor',
    html: () => `
      <div class="group"><div class="row col">
        ${batteryLevel === null
          ? '<span class="muted">Az akkumulátor szintje ebben a böngészőben nem olvasható ki.</span>'
          : `<span class="batt-big">${battText()}</span><span class="muted">${batteryCharging ? 'Töltés folyamatban' : 'Akkumulátorról működik'}${saverOn() ? ' · energiatakarékos mód' : ''}</span>`}
      </div></div>
      <div class="group">
        ${sSw('saver', 'Energiatakarékos mód')}
        ${sSw('autoSaver', 'Automatikusan 20% alatt')}
      </div>
      ${sNote('Energiatakarékos módban kicsit sötétebb a kijelző, nincsenek animációk, a Fénygyűrű pedig csak a kamerát jelzi. Az akkumulátor ikon sárga lesz.')}
      <div class="group">${sSw('battPct', 'Akkumulátor százalék a felső sávban')}</div>`,
  },

  gestures: {
    title: 'Gesztusok',
    html: () => `
      <div class="group">${sSw('gestureNav', 'Gesztusnavigáció')}</div>
      ${sNote('Húzd fel az alsó csíkot: az app összemegy, elengedve hazamész. Ha félúton megállsz, megnyílik az appváltó. A csíkon oldalra húzva az előző appra váltasz.')}
      <div class="group">${sSw('quickMenu', 'Gyorsmenü')}</div>
      ${sNote('Tarts nyomva egy ikont: felugrik az app gyors műveleteivel. Ha közben elhúzod az ujjad, átrendezheted az ikonokat.')}
      <div class="group">${sSw('radial', 'Varázskör')}</div>
      ${sNote('Tartsd nyomva a kezdőképernyő üres részét: gyűrű nyílik 6 gyorsgombbal. Húzd a kívánt irányba, és engedd el.')}
      <div class="group">${sSw('dblSleep', 'Dupla koppintás: kijelző ki')}</div>
      ${sNote('Koppints duplán a kezdő- vagy a zárolási képernyő üres részére, és kikapcsol a kijelző.')}`,
  },

  security: {
    title: 'Biztonság és PIN',
    html: () => `
      <div class="group">${settings.pin
        ? '<div class="row">PIN-kód <span class="muted">Bekapcsolva</span></div><button class="row danger" data-act="pinOff">PIN-kód kikapcsolása</button>'
        : '<label class="row">Új PIN (4 számjegy) <input class="field s-pin" inputmode="numeric" maxlength="4" type="password" placeholder="••••"></label><button class="row link" data-act="pinOn">PIN-kód beállítása</button>'}
      </div>
      <div class="group">
        ${sLink('display', 'Automatikus zárolás', '', AUTO_LOCK_OPTS.find(o => o[0] === settings.autoLock)?.[1] || '')}
        ${sLink('lockscreen', 'Zárolási képernyő')}
      </div>
      <div class="group"><button class="row link" data-act="lockNow">Zárolás most</button></div>`,
  },

  assistant: {
    title: 'Asszisztens',
    html: () => `
      <div class="group">${sText('botName', 'Név', 16)}</div>
      ${sNote('Így mutatkozik be az asszisztens az Üzenetek appban.')}
      <div class="group"><button class="row danger" data-act="clearChat">Beszélgetés törlése</button></div>`,
  },

  storage: {
    title: 'Tárhely',
    html: () => {
      const LIMIT = 5 * 1024 * 1024; // a böngészők kb. ennyit engednek
      const parts = [
        ['Fotók', rawSize('photos'), '#ff9f0a', `${store.get('photos', []).length} db`],
        ['Jegyzetek', rawSize('notes'), '#ffd60a', `${store.get('notes', []).length} db`],
        ['Üzenetek', rawSize('chat'), '#0a84ff', `${store.get('chat', []).length} db`],
        ['Hangfelvételek', rawSize('recordings'), '#ff375f', `${store.get('recordings', []).length} db`],
        ['Rendszer', rawSize('settings') + rawSize('cc') + rawSize('unread') + rawSize('lastCall') + rawSize('usage'), '#8e8e93', ''],
      ];
      const used = parts.reduce((a, p) => a + p[1], 0);
      return `
        <div class="group"><div class="row col">
          <span><b>${fmtBytes(used)}</b> <span class="muted">/ kb. 5 MB használatban</span></span>
          <div class="storage-bar">${parts.map(p => `<i style="width:${(p[1] / LIMIT) * 100}%;background:${p[2]}"></i>`).join('')}</div>
          <div class="legend">${parts.map(p => `<span><b style="background:${p[2]}"></b>${p[0]}</span>`).join('')}</div>
        </div></div>
        <div class="group">${parts.slice(0, 4).map(p => `<div class="row"><span class="grow">${p[0]} <span class="muted small">${p[3]}</span></span><span class="muted">${fmtBytes(p[1])}</span></div>`).join('')}</div>
        <div class="group">
          <button class="row danger" data-act="delPhotos">Összes fotó törlése</button>
          <button class="row danger" data-act="clearChat">Beszélgetés törlése</button>
        </div>`;
    },
  },

  general: {
    title: 'Általános',
    html: () => `
      ${sLabel('Nyelv')}
      <div class="group">${sSeg('lang', [['hu', 'Magyar'], ['en', 'English']])}</div>
      ${sNote('A nyelv megváltoztatásakor a telefon felülete újratöltődik.')}
      <div class="group">
        ${sText('userName', 'A neved', 20, 'pl. Peti')}
        ${sText('deviceName', 'Eszköz neve', 24)}
      </div>
      <div class="group"><button class="row link" data-act="rerunSetup">Beállító varázsló újra</button></div>
      <div class="group">
        ${sLink('datetime', 'Idő és dátum', sIcon('date', '#ff3b30'))}
        ${sLink('update', 'Rendszerfrissítés', sIcon('update', '#8e8e93'))}
      </div>
      ${ANDROID ? `${sLabel('Android')}
      <div class="group">
        <div class="row">Telefon <span class="muted">${esc(ANDROID.deviceName())}</span></div>
        <div class="row">Android verzió <span class="muted">${esc(ANDROID.androidVersion())}</span></div>
        <div class="row">Android-appok <span class="muted">${androidAppIds().length}</span></div>
        <button class="row link" data-act="homeSettings">CSSOS beállítása kezdőképernyőnek</button>
        <button class="row link" data-act="androidSettings">Az Android saját beállításai</button>
      </div>
      ${sNote('Ha a CSSOS a kezdőképernyő, a telefon Home gombja mindig ide hoz vissza. Az eredeti kezdőképernyőt ugyanitt lehet visszaállítani.')}` : `${sLabel('Android')}
      <div class="group">
        <div class="row">Futás <span class="muted">Böngészőben</span></div>
        <div class="row col"><span>CSSOS Androidos telefonra</span><span class="muted small">Telepítsd a <b>CSSOS.apk</b> fájlt a telefonra (a „Telefonos cég” mappában van). Ott a CSSOS lesz a kezdőképernyő, és a telefon igazi appjai, a Google Play is, megjelennek benne.</span></div>
      </div>`}
      ${sLabel('Névjegy')}
      <div class="group">
        <div class="row">Rendszer <span class="muted">${OS.name}</span></div>
        <div class="row">Verzió <span class="muted">${OS.version}</span></div>
        <div class="row">Alkalmazások <span class="muted">${Object.keys(apps).length}</span></div>
        <div class="row">Kijelző <span class="muted">${Math.round(screenEl.clientWidth)} × ${Math.round(screenEl.clientHeight)}</span></div>
        <div class="row">Akkumulátor <span class="muted">${battText() || 'ismeretlen'}</span></div>
      </div>
      <div class="group"><button class="row danger" data-act="reset">Gyári visszaállítás</button></div>`,
  },

  datetime: {
    title: 'Idő és dátum',
    html: () => {
      const d = new Date();
      return `
        <div class="group">
          ${sSw('clock24', '24 órás formátum')}
          ${sSw('lockSeconds', 'Másodpercek a zárolási képernyőn')}
        </div>
        <div class="group">
          <div class="row">Pontos idő <span class="muted">${fmtTime(d)}${ampm(d)}</span></div>
          <div class="row">Dátum <span class="muted">${d.toLocaleDateString(LOC, { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
          <div class="row">Időzóna <span class="muted">${Intl.DateTimeFormat().resolvedOptions().timeZone || 'ismeretlen'}</span></div>
        </div>
        ${sNote('Az időt és az időzónát a telefon automatikusan a hálózatról veszi.')}`;
    },
  },

  update: {
    title: 'Rendszerfrissítés',
    html: () => {
      const prev = store.get('prevVersion', null);
      const online = !!(ANDROID && ANDROID.checkUpdate); // a 2.1-es és újabb app tud online frissülni
      const st = window.updateState || {};
      const status = st.text || (online ? 'Koppints a frissítések kereséséhez.' : ANDROID ? 'Telepített app: ' + esc(ANDROID.appVersion() || OS.version) : 'Böngészőben mindig a legfrissebb verzió fut.');
      return `
        <div class="group"><div class="update-box">
          <div class="update-logo${st.busy ? ' spin' : ''}"></div>
          <b>${OS.name} ${OS.version}</b>
          <span class="muted u-status">${esc(status)}</span>
        </div></div>
        ${online ? `<div class="group">
            ${st.state === 'ready' ? '<button class="row link" data-act="restartUpdate">Újraindítás és frissítés</button>'
              : st.state === 'apk' ? '<button class="row link" data-act="downloadApk">Új app letöltése</button>'
              : '<button class="row link" data-act="checkOnline">Frissítések keresése</button>'}
          </div>
          ${sNote('A telefon naponta egyszer magától is megnézi, van-e új CSSOS. Az adataid frissítéskor megmaradnak.')}` : ''}
        ${ANDROID ? `<div class="group"><button class="row link" data-act="installUpdate">Frissítés telepítése fájlból</button></div>
          ${sNote('Ha internet nélkül frissítenél: másold a telefonra az új CSSOS.apk fájlt, koppints a fenti gombra, és válaszd ki.')}`
          : sNote('Böngészőben a CSSOS mindig a legfrissebb: elég újratölteni az oldalt.')}
        ${prev ? sNote(`Legutóbbi frissítés: ${esc(prev)} → ${OS.version}`) : ''}`;
    },
  },
};

// Gombok műveletei. Ha false-t adnak vissza, az oldal nem rajzolódik újra.
const SETTINGS_ACTIONS = {
  openNC() { closeApp(); setTimeout(openNC, 250); return false; },
  testNotif() { setTimeout(() => notify('Próbaértesítés', 'Így néz ki egy értesítés.', 'settings'), 300); return false; },
  testSound() { beep(880, 0.12); setTimeout(() => beep(1320, 0.18), 120); vibrate(100); return false; },
  pinOn(el) {
    const inp = $('.s-pin', el);
    if (!/^\d{4}$/.test(inp.value)) { inp.style.color = '#ff453a'; inp.focus(); return false; }
    settings.pin = inp.value;
    saveSettings();
    notify('Beállítások', 'PIN-kód beállítva. Feloldáskor ezt kell megadni.', 'settings');
  },
  pinOff() { settings.pin = ''; saveSettings(); },
  lockNow() { lock(); return false; },
  rerunSetup() { store.set('setupStep', 0); location.reload(); return false; },
  homeSettings() { ANDROID.homeSettings(); return false; },
  androidSettings() { ANDROID.systemSettings(); return false; },
  clearChat() { if (confirm('Törlöd a teljes beszélgetést?')) store.set('chat', []); },
  delPhotos() { if (confirm('Törlöd az összes fotót?')) store.set('photos', []); },
  resetUsage() {
    if (!confirm('Törlöd a mai képernyőidőt?')) return false;
    store.set('usage', {});
    if (usageApp) trackStart(usageApp);
  },
  checkOnline() { startUpdateCheck(true); },
  restartUpdate() { ANDROID.restartApp(); return false; },
  downloadApk() { ANDROID.downloadApk(); return false; },
  installUpdate() { ANDROID.pickUpdate(); return false; },
  checkUpdate(el) {
    const logo = $('.update-logo', el), status = $('.u-status', el);
    logo.classList.add('spin');
    status.textContent = 'Frissítések keresése…';
    setTimeout(() => {
      logo.classList.remove('spin');
      store.set('lastUpdateCheck', Date.now());
      status.textContent = `A rendszer naprakész. Nincs újabb verzió a ${OS.name} ${OS.version}-nál.`;
    }, 1800);
    return false;
  },
  reset() {
    if (confirm('Biztosan törölsz minden adatot (jegyzetek, fotók, üzenetek, beállítások)?')) {
      store.clear();
      location.reload();
    }
    return false;
  },
};

// Keresés: minden oldal sorait összegyűjti (a főoldal kivételével)
function settingsIndex() {
  const tmp = document.createElement('div');
  const out = [];
  for (const [page, p] of Object.entries(SETTINGS_PAGES)) {
    if (page === 'main') continue;
    out.push({ text: trText(p.title), page, title: trText(p.title) });
    tmp.innerHTML = p.html();
    $$('.group-label, .row:not(.seg-row)', tmp).forEach(r => {
      if (r.querySelector('.shape-opts, .walls, .accents')) return; // ezekben nincs kereshető felirat
      const label = trText((r.querySelector('.grow') || r).childNodes[0]?.textContent?.trim() || ''); // az aktuális nyelven
      if (label && label.length > 1 && !out.some(o => o.text === label && o.page === page)) out.push({ text: label, page, title: trText(p.title) });
    });
  }
  return out;
}

registerApp({
  id: 'settings', name: 'Beállítások', icon: 'settings', bg: 'linear-gradient(135deg,#8e9aaf,#4f5b72)',
  render(el) {
    let page = window.settingsStartPage || 'main'; // a kereső egy adott oldalra is nyithatja
    window.settingsStartPage = null;
    let index = null; // a keresés listája, oldalváltáskor újraépül
    // Melyik oldal melyiknek az aloldala (a Vissza gomb ide visz)
    const PARENT = { datetime: 'general', update: 'general' };
    const depth = p => (p === 'main' ? 0 : PARENT[p] ? 2 : 1);
    const go = p => {
      const dir = Math.sign(depth(p) - depth(page)) || 1; // 1: előre, -1: vissza
      page = p;
      draw();
      el.scrollTop = 0;
      // Előre: jobbról csúszik be; vissza: balról
      if (!motionOff()) {
        el.animate(
          [{ transform: `translateX(${dir * 60}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 420, easing: SPRING_SOFT });
        el.classList.add('entering');
        clearTimeout(go.t);
        go.t = setTimeout(() => el.classList.remove('entering'), 700);
      }
    };
    const draw = () => {
      const p = SETTINGS_PAGES[page];
      const parent = PARENT[page] || 'main';
      index = null;
      el.innerHTML = (page === 'main' ? '' : `<div class="app-bar"><button class="link" data-go="${parent}">‹ ${SETTINGS_PAGES[parent].title}</button><span></span></div>`)
        + `<div class="app-title">${p.title}</div>${p.html()}`;
      bind();
    };
    const bind = () => {
      $$('[data-go]', el).forEach(b => (b.onclick = () => go(b.dataset.go)));
      $$('[data-sw]', el).forEach(b => (b.onclick = () => { setOpt(b.dataset.sw, !getOpt(b.dataset.sw)); draw(); }));
      $$('[data-seg] button', el).forEach(b => (b.onclick = () => { setOpt(b.parentElement.dataset.seg, JSON.parse(b.dataset.v)); draw(); }));
      $$('[data-range]', el).forEach(r => {
        r.oninput = () => setOpt(r.dataset.range, +r.value);
        if (r.dataset.range === 'volume') r.onchange = () => beep(660, 0.08);
      });
      $$('[data-text]', el).forEach(i => (i.oninput = () => {
        const k = i.dataset.text, v = i.value.trim();
        const fallback = { botName: OS.short, deviceName: OS.short + ' Telefon' }[k];
        setOpt(k, v || fallback || '');
      }));
      $$('[data-wall]', el).forEach(b => (b.onclick = () => { setOpt('wallpaper', +b.dataset.wall); draw(); }));
      $$('[data-accent]', el).forEach(b => (b.onclick = () => { setOpt('accent', +b.dataset.accent); draw(); }));
      $$('[data-shape]', el).forEach(b => (b.onclick = () => { setOpt('iconShape', b.dataset.shape); draw(); }));
      $$('[data-act]', el).forEach(b => (b.onclick = () => { if (SETTINGS_ACTIONS[b.dataset.act](el) !== false) draw(); }));
      const pin = $('.s-pin', el);
      if (pin) pin.oninput = () => { pin.value = pin.value.replace(/\D/g, ''); pin.style.color = ''; };

      const q = $('.s-q', el);
      if (q) q.oninput = () => {
        const term = q.value.trim().toLowerCase();
        const res = $('.s-results', el), main = $('.s-main', el);
        main.hidden = !!term;
        if (!term) { res.innerHTML = ''; return; }
        index = index || settingsIndex(); // csak az első betűnél építjük fel
        const hits = index.filter(o => o.text.toLowerCase().includes(term)).slice(0, 12);
        res.innerHTML = hits.length
          ? `<div class="group">${hits.map(h => `<button class="row s-result" data-go="${h.page}"><span class="grow">${esc(h.text)}<small>${esc(h.title)}</small></span><span class="chev"></span></button>`).join('')}</div>`
          : '<div class="empty">Nincs találat.</div>';
        $$('[data-go]', res).forEach(b => (b.onclick = () => go(b.dataset.go)));
      };
    };
    draw();
  },
});
