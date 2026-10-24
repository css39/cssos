'use strict';
// =====================================================================
//  CSSOS — rendszerszolgáltatások, amik minden rendes telefonon megvannak:
//  értesítési központ, Telefon + névjegyek + hívásnapló, ébresztő,
//  naptár-események emlékeztetővel, időjárás (élő adatok), diktafon
// =====================================================================

const DAY_SHORT = L(['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'], ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']); // getDay() sorrend: 0 = vasárnap
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];                  // hétfővel kezdődő hét
const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function timeAgo(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'most';
  if (s < 3600) return Math.floor(s / 60) + ' perce';
  if (s < 86400) return Math.floor(s / 3600) + ' órája';
  return new Date(t).toLocaleDateString(LOC, { month: 'short', day: 'numeric' });
}

// Névből monogram és állandó szín (névjegyekhez)
const initials = name => name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '#';
function nameColor(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(135deg,hsl(${h} 70% 60%),hsl(${(h + 40) % 360} 70% 45%))`;
}

// =====================================================================
//  Értesítési központ
// =====================================================================
function addNotifHistory(title, body, appId) {
  const list = store.get('notifs', []);
  list.unshift({ id: String(Date.now() + Math.random()), title, body, appId, t: Date.now() });
  store.set('notifs', list.slice(0, 40));
  renderLockNotifs();
  if (ncOpen) renderNC();
}
function removeNotif(id) {
  store.set('notifs', store.get('notifs', []).filter(n => n.id !== id));
  renderLockNotifs();
}

function notifCard(n, hideBody) {
  const app = apps[n.appId];
  return `<div class="nc-card" data-id="${n.id}">
    <span class="b-icon" style="background:${app ? app.bg : '#555'};color:${app?.fg || '#fff'}">${app ? appIcon(app) : ic('bell')}</span>
    <div class="b-text"><b>${esc(n.title)}</b><p>${esc(hideBody ? 'Új értesítés' : n.body)}</p></div>
    <small class="b-time">${timeAgo(n.t)}</small>
    <button class="nc-x" aria-label="Értesítés törlése">${ic('close')}</button>
  </div>`;
}

let ncOpen = false;
const ncEl = document.createElement('div');
ncEl.id = 'nc';
screenEl.append(ncEl);

function openNC() {
  if (ncOpen) return;
  closeCC();
  closeSwitcher();
  if (typeof closeSpot === 'function') closeSpot();
  ncOpen = true;
  renderNC();
  screenEl.classList.add('nc-open');
}
function closeNC() {
  ncOpen = false;
  screenEl.classList.remove('nc-open');
}

function renderNC() {
  const list = store.get('notifs', []);
  const d = new Date();
  ncEl.innerHTML = `<div class="nc-head"><b>${fmtTime(d)}</b><span>${cap(d.toLocaleDateString(LOC, { weekday: 'long', month: 'long', day: 'numeric' }))}</span></div>
    <div class="nc-bar"><span>Értesítések</span>${list.length ? '<button class="nc-clear">Összes törlése</button>' : ''}</div>
    ${list.length ? list.map(n => notifCard(n, locked && !settings.preview)).join('') : '<div class="nc-empty">Nincs új értesítés</div>'}`;
  $$('.nc-card', ncEl).forEach(c => (c.onclick = e => {
    const n = list.find(x => x.id === c.dataset.id);
    removeNotif(c.dataset.id);
    if (e.target.closest('.nc-x')) {
      // A törölt kártya kicsúszik jobbra, a többi felcsúszik a helyére
      const h = c.offsetHeight + 8;
      c.style.pointerEvents = 'none';
      c.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(110%)', opacity: 0 }], { duration: 260, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' })
        .onfinish = () => {
          let n = c.nextElementSibling;
          while (n) { n.animate([{ transform: `translateY(${h}px)` }, { transform: 'none' }], { duration: 450, easing: SPRING_SOFT }); n = n.nextElementSibling; }
          c.remove();
          if (!$('.nc-card', ncEl)) renderNC();
        };
      return;
    }
    closeNC();
    if (locked) unlockAttempt();
    else if (n?.appId && isInstalled(n.appId)) openApp(n.appId);
  }));
  const clear = $('.nc-clear', ncEl);
  if (clear) clear.onclick = () => { store.set('notifs', []); renderNC(); renderLockNotifs(); };
}
ncEl.addEventListener('click', e => { if (e.target === ncEl) closeNC(); });

// A zárolási képernyőn a legutóbbi 3 értesítés
function renderLockNotifs() {
  const box = $('#lock-notifs');
  if (!box) return;
  const list = store.get('notifs', []).slice(0, 3);
  box.innerHTML = list.map(n => notifCard(n, !settings.preview)).join('');
  box.onclick = e => {
    const c = e.target.closest('.nc-card');
    if (!c) return;
    if (e.target.closest('.nc-x')) { removeNotif(c.dataset.id); return; }
    unlockAttempt();
  };
}

// A felső sáv bal fele: értesítési központ (a jobb fele továbbra is a vezérlőközpont)
const sbEl = $('#statusbar');
let ncDrag = null;
const leftHalf = e => { const r = sbEl.getBoundingClientRect(); return e.clientX < r.left + r.width / 2; };
sbEl.addEventListener('pointerdown', e => { ncDrag = leftHalf(e) ? { y: e.clientY, pulled: false } : null; }, true);
sbEl.addEventListener('pointermove', e => {
  if (!ncDrag) return;
  e.stopImmediatePropagation();
  if (!ncDrag.pulled && e.clientY - ncDrag.y > 25) { ncDrag.pulled = true; openNC(); }
}, true);
sbEl.addEventListener('click', e => {
  if (screenEl.classList.contains('cc-open')) return; // ezt a vezérlőközpont kezeli
  if (ncOpen) { closeNC(); e.stopImmediatePropagation(); return; }
  if (leftHalf(e)) {
    e.stopImmediatePropagation();
    if (!ncDrag?.pulled) openNC();
  }
  ncDrag = null;
}, true);

// Bezárás: Home csík, Esc, Android vissza gomb
$('#homebar').addEventListener('click', e => { if (ncOpen) { closeNC(); e.stopImmediatePropagation(); } }, true);
document.addEventListener('keydown', e => { if (ncOpen && e.key === 'Escape') { closeNC(); e.stopImmediatePropagation(); } }, true);
{
  const prevBack = window.cssosBack;
  window.cssosBack = () => (ncOpen ? closeNC() : prevBack());
}

// =====================================================================
//  Telefon: Legutóbbiak, Névjegyek, Billentyűzet
// =====================================================================
const getContacts = () => store.get('contacts', []).sort((a, b) => a.name.localeCompare(b.name, 'hu'));
const cleanNum = n => String(n).replace(/[\s-]/g, '');
const contactFor = num => getContacts().find(c => cleanNum(c.phone) === cleanNum(num));

registerApp({
  id: 'phone', name: 'Telefon', icon: 'phone', bg: 'linear-gradient(135deg,#2ee59d,#0fa968)',
  render(el) {
    let tab = 'keypad', num = '', iv = null, connect = null;

    const shell = () => {
      el.innerHTML = `<div class="ph"><div class="ph-body"></div>
        <nav class="tabbar">${[['recents', 'clock', 'Legutóbbiak'], ['contacts', 'user', 'Névjegyek'], ['keypad', 'keypad', 'Billentyűzet']]
          .map(([k, i, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${ic(i)}<span>${l}</span></button>`).join('')}</nav></div>`;
      $$('[data-tab]', el).forEach(b => (b.onclick = () => { tab = b.dataset.tab; shell(); }));
      ({ recents, contacts: contactList, keypad })[tab]($('.ph-body', el));
    };

    // ---- Billentyűzet
    function keypad(body) {
      const KEYS = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']];
      body.innerHTML = `<div class="dialer">
        <div class="dial-num"></div><div class="dial-name muted"></div>
        <div class="keypad">${KEYS.map(([k, l]) => `<button class="key" data-k="${k}">${k}<small>${l}</small></button>`).join('')}</div>
        <div class="dial-actions"><button class="dial-add link" aria-label="Névjegy mentése">${ic('plus')}</button><button class="call-btn">${ic('phone')}</button><button class="del-btn">${ic('backspace')}</button></div>
      </div>`;
      const disp = $('.dial-num', body), name = $('.dial-name', body), del = $('.del-btn', body), add = $('.dial-add', body);
      const upd = () => {
        disp.textContent = num;
        disp.style.fontSize = num.length > 12 ? '26px' : '';
        const c = num && contactFor(num);
        name.textContent = c ? c.name : '';
        del.style.visibility = add.style.visibility = num ? 'visible' : 'hidden';
        if (c) add.style.visibility = 'hidden';
      };
      $$('.key', body).forEach(k => (k.onclick = () => { keyClick(); if (num.length < 20) { num += k.dataset.k; upd(); } }));
      del.onclick = () => { num = num.slice(0, -1); upd(); };
      add.onclick = () => { tab = 'contacts'; shell(); editContact($('.ph-body', el), { name: '', phone: num }); };
      $('.call-btn', body).onclick = () => {
        if (!num) { num = store.get('calls', [])[0]?.num || ''; upd(); return; } // üres → utolsó szám
        call(num);
      };
      upd();
    }

    // ---- Legutóbbiak (hívásnapló)
    function recents(body) {
      const calls = store.get('calls', []);
      body.innerHTML = `<div class="app-bar"><span></span>${calls.length ? '<button class="link rc-clear">Törlés</button>' : ''}</div>
        <div class="app-title">Legutóbbiak</div>
        ${calls.length ? `<div class="group">${calls.map((c, i) => {
          const ct = contactFor(c.num);
          const label = ct ? ct.name : c.num;
          return `<button class="row ct-row" data-i="${i}"><span class="ct-av" style="background:${nameColor(label)}">${esc(initials(ct ? ct.name : '#'))}</span>
            <span class="grow"><b>${esc(label)}</b><small class="muted">Kimenő hívás · ${c.dur ? fmtCallDur(c.dur) : 'nem kapcsolt'}</small></span>
            <span class="muted small">${timeAgo(c.t)}</span></button>`;
        }).join('')}</div>` : '<div class="empty">Még nem telefonáltál.</div>'}`;
      $$('[data-i]', body).forEach(b => (b.onclick = () => call(calls[+b.dataset.i].num)));
      const clr = $('.rc-clear', body);
      if (clr) clr.onclick = () => { store.set('calls', []); recents(body); };
    }

    // ---- Névjegyek
    function contactList(body) {
      const list = getContacts();
      const favs = list.filter(c => c.fav);
      const row = c => `<button class="row ct-row" data-id="${c.id}"><span class="ct-av" style="background:${nameColor(c.name)}">${esc(initials(c.name))}</span><span class="grow"><b>${esc(c.name)}</b><small class="muted">${esc(c.phone)}</small></span>${c.fav ? `<span class="ct-star">${ic('star')}</span>` : ''}</button>`;
      body.innerHTML = `<div class="app-bar"><span></span><button class="link ct-new">${ic('plus')}</button></div>
        <div class="app-title">Névjegyek</div>
        ${list.length ? `${favs.length ? `${sLabel('Kedvencek')}<div class="group">${favs.map(row).join('')}</div>` : ''}
          ${sLabel(`Mind (${list.length})`)}<div class="group">${list.map(row).join('')}</div>`
          : '<div class="empty">Még nincs névjegyed.<br>Koppints a + gombra az első felvételéhez!</div>'}`;
      $('.ct-new', body).onclick = () => editContact(body, null);
      $$('[data-id]', body).forEach(b => (b.onclick = () => contactDetail(body, b.dataset.id)));
    }

    function contactDetail(body, id) {
      const c = getContacts().find(x => x.id === id);
      if (!c) { contactList(body); return; }
      body.innerHTML = `<div class="app-bar"><button class="link ct-back">‹ Névjegyek</button><button class="link ct-edit">Szerkesztés</button></div>
        <div class="ct-head"><span class="ct-av big" style="background:${nameColor(c.name)}">${esc(initials(c.name))}</span><b>${esc(c.name)}</b><span class="muted">${esc(c.phone)}</span></div>
        <div class="ct-actions">
          <button class="ct-act" data-a="call"><span>${ic('phone')}</span>Hívás</button>
          <button class="ct-act${c.fav ? ' on' : ''}" data-a="fav"><span>${ic('star')}</span>${c.fav ? 'Kedvenc' : 'Kedvencekhez'}</button>
        </div>
        <div class="group"><button class="row danger ct-del">Névjegy törlése</button></div>`;
      $('.ct-back', body).onclick = () => contactList(body);
      $('.ct-edit', body).onclick = () => editContact(body, c);
      $('[data-a="call"]', body).onclick = () => call(c.phone);
      $('[data-a="fav"]', body).onclick = () => { saveContact({ ...c, fav: !c.fav }); contactDetail(body, id); };
      $('.ct-del', body).onclick = () => {
        if (!confirm(`Törlöd: ${c.name}?`)) return;
        store.set('contacts', getContacts().filter(x => x.id !== id));
        contactList(body);
      };
    }

    function editContact(body, c) {
      const isNew = !c || !c.id;
      const cur = { id: String(Date.now()), name: '', phone: '', fav: false, ...(c || {}) };
      body.innerHTML = `<div class="app-bar"><button class="link ct-cancel">Mégse</button><b>${isNew ? 'Új névjegy' : 'Szerkesztés'}</b><button class="link ct-save">Kész</button></div>
        <div class="ct-head"><span class="ct-av big ct-prev" style="background:${nameColor(cur.name || '?')}">${esc(initials(cur.name || '?'))}</span></div>
        <div class="group">
          <label class="row">Név <input class="field ct-name" maxlength="40" placeholder="pl. Anya" value="${esc(cur.name)}"></label>
          <label class="row">Telefonszám <input class="field ct-phone" type="tel" maxlength="20" placeholder="06 30 123 4567" value="${esc(cur.phone)}"></label>
        </div>`;
      const nameIn = $('.ct-name', body), phoneIn = $('.ct-phone', body), prev = $('.ct-prev', body);
      nameIn.oninput = () => { prev.textContent = initials(nameIn.value || '?'); prev.style.background = nameColor(nameIn.value || '?'); };
      $('.ct-cancel', body).onclick = () => (isNew ? contactList(body) : contactDetail(body, cur.id));
      $('.ct-save', body).onclick = () => {
        const name = nameIn.value.trim(), phone = phoneIn.value.trim();
        if (!name || !phone) { (name ? phoneIn : nameIn).focus(); return; }
        saveContact({ ...cur, name, phone });
        contactDetail(body, cur.id);
      };
      setTimeout(() => nameIn.focus(), 50);
    }

    function saveContact(c) {
      store.set('contacts', [...getContacts().filter(x => x.id !== c.id), c]);
    }

    // ---- Hívás
    function call(n) {
      const ct = contactFor(n);
      const start = Date.now();
      let sec = 0, connected = false;
      screenEl.classList.add('in-call');
      const ov = overlay(`<div class="call-screen">
        ${ct ? `<span class="ct-av big" style="background:${nameColor(ct.name)}">${esc(initials(ct.name))}</span>` : ''}
        <div class="call-name">${esc(ct ? ct.name : n)}</div>
        <div class="call-status">${ct ? esc(ct.phone) + ' · ' : ''}Hívás…</div>
        <div style="flex:1"></div>
        <div class="call-grid">
          <button><span>${ic('micOff')}</span>némítás</button>
          <button><span>${ic('keypad')}</span>billentyűzet</button>
          <button><span>${ic('speaker')}</span>hangszóró</button>
        </div>
        <button class="call-btn end"><span>${ic('phone')}</span></button>
      </div>`);
      $$('.call-grid button', ov).forEach(b => (b.onclick = () => b.classList.toggle('on')));
      const st = $('.call-status', ov);
      connect = setTimeout(() => {
        connected = true;
        st.textContent = '00:00';
        iv = setInterval(() => { sec++; st.textContent = fmtCallDur(sec); }, 1000);
      }, 2500);
      $('.end', ov).onclick = () => {
        clearTimeout(connect); clearInterval(iv);
        screenEl.classList.remove('in-call');
        st.textContent = 'Hívás vége';
        const calls = store.get('calls', []);
        calls.unshift({ num: n, t: start, dur: connected ? sec : 0 });
        store.set('calls', calls.slice(0, 50));
        setTimeout(() => { ov.remove(); if (tab === 'recents') shell(); }, 700);
      };
    }

    shell();
    return () => { clearTimeout(connect); clearInterval(iv); screenEl.classList.remove('in-call'); };
  },
});
const fmtCallDur = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

// =====================================================================
//  Ébresztő (az Óra app „Ébresztő” füle)
// =====================================================================
const getAlarms = () => store.get('alarms', []);
function saveAlarms(list) { store.set('alarms', list); updateAlarmIcon(); }

function daysText(days) {
  if (!days.length) return 'Egyszer';
  if (days.length === 7) return 'Minden nap';
  if (days.length === 5 && [1, 2, 3, 4, 5].every(d => days.includes(d))) return 'Hétköznap';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Hétvégén';
  return WEEK_ORDER.filter(d => days.includes(d)).map(d => DAY_SHORT[d]).join(', ');
}

// Mikor szól legközelebb?
function nextRing(a) {
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, a.h, a.m);
    if (d > now && (!a.days.length || a.days.includes(d.getDay()))) return d;
  }
  return null;
}
function untilText(d) {
  const min = Math.round((d - Date.now()) / 60000);
  const h = Math.floor(min / 60), m = min % 60;
  if (h >= 24) return `${Math.floor(h / 24)} nap ${h % 24} óra múlva`;
  return h ? `${h} óra ${m} perc múlva` : `${m} perc múlva`;
}

function alarmTab(body) {
  const draw = () => {
    const list = getAlarms().sort((a, b) => a.h * 60 + a.m - (b.h * 60 + b.m));
    body.innerHTML = `<div class="al-top"><button class="btn al-new">${ic('plus')} Új ébresztő</button></div>
      ${list.length ? `<div class="group">${list.map(a => `<div class="row al-row" data-id="${a.id}">
        <div class="grow al-info"><span class="al-time${a.on ? '' : ' off'}">${pad(a.h)}:${pad(a.m)}</span><small class="muted">${esc(a.label || 'Ébresztő')} · ${daysText(a.days)}</small></div>
        <button class="switch${a.on ? ' on' : ''}" data-sw="${a.id}" aria-label="Be/ki"></button></div>`).join('')}</div>
        ${sNote('Koppints egy ébresztőre a szerkesztéshez.')}` : '<div class="empty">Nincs ébresztő beállítva.</div>'}`;
    $('.al-new', body).onclick = () => edit(null);
    $$('.al-row', body).forEach(r => (r.onclick = e => {
      const list2 = getAlarms(), a = list2.find(x => x.id === r.dataset.id);
      if (e.target.closest('[data-sw]')) {
        a.on = !a.on;
        saveAlarms(list2);
        if (a.on) notify('Óra', `Az ébresztő ${untilText(nextRing(a))} szól.`, 'clock');
        draw();
      } else edit(a);
    }));
  };
  const edit = orig => {
    const a = orig ? { ...orig, days: [...orig.days] } : { id: String(Date.now()), h: 7, m: 0, on: true, days: [1, 2, 3, 4, 5], label: '' };
    body.innerHTML = `<div class="group al-form">
        <div class="row al-time-row"><input type="time" class="al-time-in" value="${pad(a.h)}:${pad(a.m)}"></div>
        <label class="row">Címke <input class="field al-label" maxlength="24" placeholder="Ébresztő" value="${esc(a.label)}"></label>
        <div class="row col">Ismétlés<div class="al-days">${WEEK_ORDER.map(d => `<button class="al-day${a.days.includes(d) ? ' on' : ''}" data-d="${d}">${DAY_SHORT[d]}</button>`).join('')}</div></div>
      </div>
      <div class="group"><button class="row link al-save">Mentés</button>${orig ? '<button class="row danger al-del">Ébresztő törlése</button>' : ''}<button class="row al-cancel">Mégse</button></div>`;
    $$('.al-day', body).forEach(b => (b.onclick = () => {
      const d = +b.dataset.d;
      a.days = a.days.includes(d) ? a.days.filter(x => x !== d) : [...a.days, d];
      b.classList.toggle('on', a.days.includes(d));
    }));
    $('.al-cancel', body).onclick = draw;
    const del = $('.al-del', body);
    if (del) del.onclick = () => { saveAlarms(getAlarms().filter(x => x.id !== a.id)); draw(); };
    $('.al-save', body).onclick = () => {
      const [h, m] = ($('.al-time-in', body).value || '07:00').split(':').map(Number);
      Object.assign(a, { h, m, on: true, label: $('.al-label', body).value.trim() });
      saveAlarms([...getAlarms().filter(x => x.id !== a.id), a]);
      notify('Óra', `Ébresztő beállítva: ${pad(h)}:${pad(m)}, ${untilText(nextRing(a))} szól.`, 'clock');
      draw();
    };
  };
  draw();
  return null;
}

// Csörgés: teljes képernyő, hang, rezgés, Fénygyűrű
let ringing = null;
function ringAlarm(label) {
  if (ringing) return;
  screenEl.classList.remove('off');
  const d = new Date();
  const el = document.createElement('div');
  el.className = 'alarm-ring';
  el.innerHTML = `<div class="ar-pulse">${ic('alarm')}</div><small>Ébresztő</small><b>${fmtTime(d)}</b><span>${esc(label || '')}</span>
    <div class="ar-btns"><button class="ar-snooze">Szundi · 5 perc</button><button class="ar-stop">Leállítás</button></div>`;
  screenEl.append(el);
  screenEl.classList.add('ring-alarm');
  const tone = () => {
    // Az ébresztő akkor is szól, ha le van halkítva a telefon
    const vol = settings.volume;
    settings.volume = Math.max(vol, 60);
    [880, 1175, 880].forEach((f, i) => setTimeout(() => beep(f, 0.18), i * 200));
    settings.volume = vol;
    vibrate([400, 200, 400]);
  };
  tone();
  const iv = setInterval(tone, 1300);
  const stop = () => { clearInterval(iv); el.remove(); screenEl.classList.remove('ring-alarm'); ringing = null; };
  $('.ar-stop', el).onclick = stop;
  $('.ar-snooze', el).onclick = () => {
    store.set('snooze', { t: Date.now() + 5 * 60000, label: label || 'Szundi' });
    stop();
    notify('Óra', 'Szundi: 5 perc múlva újra szólok.', 'clock');
  };
  ringing = { stop };
}

function updateAlarmIcon() {
  const on = getAlarms().some(a => a.on) || !!store.get('snooze', null);
  const el = $('#sb-alarm');
  if (el) el.hidden = !on;
}

// =====================================================================
//  Naptár eseményekkel és emlékeztetővel
// =====================================================================
const getEvents = () => store.get('events', []);

registerApp({
  id: 'calendar', name: 'Naptár', bg: '#fff',
  icon: () => {
    const d = new Date();
    return `<svg class="ic" width="1em" height="1em" viewBox="0 0 24 24" font-family="system-ui, sans-serif" text-anchor="middle"><text x="12" y="8.5" font-size="6.2" font-weight="700" fill="#ff3b5c">${d.toLocaleDateString(LOC, { weekday: 'short' }).replace('.', '').toUpperCase()}</text><text x="12" y="21.5" font-size="14" font-weight="600" fill="#1c1c1e">${d.getDate()}</text></svg>`;
  },
  render(el) {
    const today = new Date();
    const view = new Date(today.getFullYear(), today.getMonth(), 1);
    let sel = dateKey(today);

    const draw = () => {
      const y = view.getFullYear(), m = view.getMonth();
      const first = (new Date(y, m, 1).getDay() + 6) % 7;
      const days = new Date(y, m + 1, 0).getDate();
      const evs = getEvents();
      const has = new Set(evs.map(e => e.date));
      let cells = '<div></div>'.repeat(first);
      for (let day = 1; day <= days; day++) {
        const k = dateKey(new Date(y, m, day));
        const wd = (first + day - 1) % 7;
        cells += `<button class="d${wd > 4 ? ' we' : ''}${k === dateKey(today) ? ' today' : ''}${k === sel ? ' sel' : ''}" data-k="${k}"><span>${day}</span>${has.has(k) ? '<i></i>' : ''}</button>`;
      }
      const dayEvs = evs.filter(e => e.date === sel).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      const selDate = new Date(sel + 'T00:00');
      el.innerHTML = `<div class="app-bar"><span></span><button class="link ev-new">${ic('plus')}</button></div>
        <div class="app-title">Naptár</div>
        <div class="cal-head"><button class="link c-prev">‹</button><div class="cal-title"><b>${MONTHS[m]}</b> ${y}</div><button class="link c-next">›</button></div>
        <div class="cal-grid">${L(['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'], ['M', 'T', 'W', 'T', 'F', 'S', 'S']).map(x => `<div class="dow">${x}</div>`).join('')}${cells}</div>
        ${sLabel(cap(selDate.toLocaleDateString(LOC, { month: 'long', day: 'numeric', weekday: 'long' })))}
        <div class="group">${dayEvs.length ? dayEvs.map(e => `<div class="row ev-row"><span class="ev-time">${e.time || 'Egész nap'}</span><span class="grow">${esc(e.title)}</span><button class="nc-x" data-del="${e.id}" aria-label="Törlés">${ic('close')}</button></div>`).join('')
          : '<button class="row muted ev-empty">Nincs esemény. Koppints ide egy új felvételéhez!</button>'}</div>`;
      $('.c-prev', el).onclick = () => { view.setMonth(view.getMonth() - 1); draw(); };
      $('.c-next', el).onclick = () => { view.setMonth(view.getMonth() + 1); draw(); };
      $('.cal-title', el).onclick = () => { view.setFullYear(today.getFullYear(), today.getMonth(), 1); sel = dateKey(today); draw(); };
      $$('[data-k]', el).forEach(b => (b.onclick = () => { sel = b.dataset.k; draw(); }));
      $$('[data-del]', el).forEach(b => (b.onclick = () => { store.set('events', getEvents().filter(e => e.id !== b.dataset.del)); draw(); }));
      $('.ev-new', el).onclick = form;
      const empty = $('.ev-empty', el);
      if (empty) empty.onclick = form;
    };

    const form = () => {
      el.innerHTML = `<div class="app-bar"><button class="link ev-cancel">Mégse</button><b>Új esemény</b><button class="link ev-save">Hozzáadás</button></div>
        <div class="group">
          <label class="row">Cím <input class="field ev-title" maxlength="50" placeholder="pl. Edzés"></label>
          <label class="row">Nap <input class="field ev-date" type="date" value="${sel}"></label>
          <label class="row">Időpont <input class="field ev-time" type="time"></label>
        </div>
        ${sNote('Ha adsz meg időpontot, a telefon akkor értesítést küld.')}`;
      $('.ev-cancel', el).onclick = draw;
      $('.ev-save', el).onclick = () => {
        const title = $('.ev-title', el).value.trim();
        if (!title) { $('.ev-title', el).focus(); return; }
        const date = $('.ev-date', el).value || sel;
        store.set('events', [...getEvents(), { id: String(Date.now()), title, date, time: $('.ev-time', el).value }]);
        sel = date;
        const d = new Date(date + 'T00:00');
        view.setFullYear(d.getFullYear(), d.getMonth(), 1);
        draw();
      };
      setTimeout(() => $('.ev-title', el).focus(), 50);
    };

    draw();
  },
});

// =====================================================================
//  Időzített ellenőrzések: ébresztő, szundi, naptár-emlékeztető
// =====================================================================
let lastMinute = '';
function systemTick() {
  const d = new Date();
  // Szundi (másodpercre pontosan)
  const sn = store.get('snooze', null);
  if (sn && Date.now() >= sn.t) { store.set('snooze', null); updateAlarmIcon(); ringAlarm(sn.label); }

  const key = `${dateKey(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (key === lastMinute) return;
  lastMinute = key;

  // Ébresztők
  const list = getAlarms();
  let changed = false;
  list.forEach(a => {
    if (!a.on || a.h !== d.getHours() || a.m !== d.getMinutes()) return;
    if (a.days.length && !a.days.includes(d.getDay())) return;
    ringAlarm(a.label);
    if (!a.days.length) { a.on = false; changed = true; } // egyszeri ébresztő
  });
  if (changed) saveAlarms(list);

  // Naptár-emlékeztetők
  const done = store.get('evDone', []);
  getEvents().forEach(e => {
    if (e.time && `${e.date} ${e.time}` === key && !done.includes(e.id)) {
      done.push(e.id);
      notify('Naptár', `${e.title} – most kezdődik`, 'calendar');
    }
  });
  store.set('evDone', done.slice(-100));
}

// =====================================================================
//  Időjárás — élő adatok az Open-Meteo ingyenes szolgáltatásából
// =====================================================================
const WMO = [
  [[0], 'Derült', 'sun'], [[1], 'Többnyire derült', 'partly'], [[2], 'Részben felhős', 'partly'], [[3], 'Borult', 'cloud'],
  [[45, 48], 'Ködös', 'fog'], [[51, 53, 55, 56, 57], 'Szitálás', 'rain'], [[61, 63, 65, 66, 67], 'Eső', 'rain'],
  [[71, 73, 75, 77], 'Havazás', 'snow'], [[80, 81, 82], 'Zápor', 'rain'], [[85, 86], 'Hózápor', 'snow'], [[95, 96, 99], 'Zivatar', 'storm'],
];
function wInfo(code, isDay = 1) {
  const w = WMO.find(x => x[0].includes(code)) || WMO[3];
  let icon = w[2];
  if (!isDay && icon === 'sun') icon = 'moonSmall';
  const bg = !isDay ? 'linear-gradient(170deg,#0f2027,#203a43 55%,#2c5364)'
    : icon === 'sun' ? 'linear-gradient(170deg,#2f80ed,#56ccf2)'
    : icon === 'partly' ? 'linear-gradient(170deg,#4b79a1,#7fb3e0)'
    : icon === 'rain' ? 'linear-gradient(170deg,#3a4a6b,#5f7391)'
    : icon === 'snow' ? 'linear-gradient(170deg,#7f97b5,#c9d6e8)'
    : icon === 'storm' ? 'linear-gradient(170deg,#232526,#414345)'
    : 'linear-gradient(170deg,#6b7a8c,#9aa7b5)';
  return { text: w[1], icon, bg };
}

async function fetchWeather(c) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}`
    + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day'
    + '&hourly=temperature_2m,weather_code,is_day'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max'
    + '&timezone=auto&forecast_days=7';
  const r = await fetch(url);
  if (!r.ok) throw new Error('weather ' + r.status);
  return r.json();
}

registerApp({
  id: 'weather', name: 'Időjárás', icon: 'partly', bg: 'linear-gradient(135deg,#2f80ed,#56ccf2)', dark: true,
  render(el) {
    let city = store.get('weatherCity', { name: 'Budapest', lat: 47.4979, lon: 19.0402 });
    let alive = true;

    const show = data => {
      const c = data.current, info = wInfo(c.weather_code, c.is_day), dl = data.daily;
      const start = Math.max(0, data.hourly.time.findIndex(t => t >= c.time.slice(0, 13) + ':00'));
      const hours = data.hourly.time.slice(start, start + 24).map((t, i) => ({
        h: i ? t.slice(11, 13) : 'Most', temp: data.hourly.temperature_2m[start + i],
        icon: wInfo(data.hourly.weather_code[start + i], data.hourly.is_day[start + i]).icon,
      }));
      const lo = Math.min(...dl.temperature_2m_min), hi = Math.max(...dl.temperature_2m_max);
      el.innerHTML = `<div class="wx" style="background:${info.bg}">
        <div class="wx-top"><button class="wx-btn wx-search" aria-label="Város keresése">${ic('search')}</button><button class="wx-btn wx-loc" aria-label="Helyzetem">${ic('location')}</button></div>
        <div class="wx-now">
          <span class="wx-city">${esc(city.name)}</span>
          <b class="wx-temp">${Math.round(c.temperature_2m)}°</b>
          <span class="wx-desc">${ic(info.icon)} ${info.text}</span>
          <span class="wx-hl">Max ${Math.round(dl.temperature_2m_max[0])}° · Min ${Math.round(dl.temperature_2m_min[0])}°</span>
        </div>
        <div class="wx-card"><div class="wx-label">ÓRÁNKÉNT</div>
          <div class="wx-hours">${hours.map(x => `<div><small>${x.h}</small>${ic(x.icon)}<b>${Math.round(x.temp)}°</b></div>`).join('')}</div></div>
        <div class="wx-card"><div class="wx-label">7 NAPOS ELŐREJELZÉS</div>
          ${dl.time.map((t, i) => {
            const d = new Date(t + 'T12:00');
            const mn = dl.temperature_2m_min[i], mx = dl.temperature_2m_max[i];
            return `<div class="wx-day"><span class="wx-dname">${i ? cap(d.toLocaleDateString(LOC, { weekday: 'short' }).replace('.', '')) : 'Ma'}</span>
              <span class="wx-dicon">${ic(wInfo(dl.weather_code[i]).icon)}<small>${dl.precipitation_probability_max?.[i] ? dl.precipitation_probability_max[i] + '%' : ''}</small></span>
              <span class="wx-min">${Math.round(mn)}°</span>
              <span class="wx-range"><i style="left:${((mn - lo) / (hi - lo || 1)) * 100}%;right:${100 - ((mx - lo) / (hi - lo || 1)) * 100}%"></i></span>
              <span class="wx-max">${Math.round(mx)}°</span></div>`;
          }).join('')}</div>
        <div class="wx-grid">
          <div class="wx-card"><div class="wx-label">${ic('thermo')} HŐÉRZET</div><b>${Math.round(c.apparent_temperature)}°</b></div>
          <div class="wx-card"><div class="wx-label">${ic('drop')} PÁRATARTALOM</div><b>${Math.round(c.relative_humidity_2m)}%</b></div>
          <div class="wx-card"><div class="wx-label">${ic('wind')} SZÉL</div><b>${Math.round(c.wind_speed_10m)} km/h</b></div>
          <div class="wx-card"><div class="wx-label">${ic('sunrise')} NAPKELTE</div><b>${dl.sunrise[0].slice(11)}</b><small>Napnyugta: ${dl.sunset[0].slice(11)}</small></div>
        </div>
        <p class="wx-src">Adatok: Open-Meteo · frissítve ${timeAgo(store.get('weatherCache', {}).t || Date.now())}</p>
      </div>`;
      $('.wx-search', el).onclick = search;
      $('.wx-loc', el).onclick = locate;
    };

    const load = async force => {
      const cache = store.get('weatherCache', null);
      const same = cache && cache.city === city.name;
      if (same) show(cache.data);
      if (same && !force && Date.now() - cache.t < 15 * 60000) return;
      if (!same) el.innerHTML = `<div class="wx wx-msg" style="background:${wInfo(2).bg}"><div class="wx-spin"></div><span>Időjárás betöltése…</span></div>`;
      try {
        const data = await fetchWeather(city);
        store.set('weatherCache', { city: city.name, t: Date.now(), data });
        if (alive) show(data);
        updateWidget();
      } catch {
        if (alive && !same) {
          el.innerHTML = `<div class="wx wx-msg" style="background:${wInfo(3).bg}">${ic('cloud')}<span>Nem sikerült betölteni az időjárást. Van internet?</span><button class="btn wx-retry">Újra</button></div>`;
          $('.wx-retry', el).onclick = () => load(true);
        }
      }
    };

    const setCity = c => {
      city = c;
      store.set('weatherCity', c);
      load(true);
    };

    // Város keresése név alapján
    const search = () => {
      const ov = overlay(`<div class="wx-find"><div class="spot-bar">${ic('search')}<input class="wf-q" placeholder="Város neve, pl. Szeged" autocomplete="off"><button class="spot-x wf-x">Mégse</button></div><div class="wf-res"></div></div>`);
      const q = $('.wf-q', ov), res = $('.wf-res', ov);
      let t = null;
      q.oninput = () => {
        clearTimeout(t);
        t = setTimeout(async () => {
          if (q.value.trim().length < 2) { res.innerHTML = ''; return; }
          try {
            const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.value.trim())}&count=8&language=hu`);
            const j = await r.json();
            res.innerHTML = (j.results || []).map((p, i) => `<button class="spot-row" data-i="${i}"><span class="grow">${esc(p.name)}<small>${esc([p.admin1, p.country].filter(Boolean).join(', '))}</small></span></button>`).join('') || '<p class="spot-tip">Nincs ilyen város.</p>';
            $$('[data-i]', res).forEach(b => (b.onclick = () => {
              const p = j.results[+b.dataset.i];
              ov.remove();
              setCity({ name: p.name, lat: p.latitude, lon: p.longitude });
            }));
          } catch { res.innerHTML = '<p class="spot-tip">Nincs internetkapcsolat.</p>'; }
        }, 300);
      };
      $('.wf-x', ov).onclick = () => ov.remove();
      setTimeout(() => q.focus(), 50);
    };

    // Saját helyzet (GPS)
    const locate = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        p => setCity({ name: 'Jelenlegi helyzet', lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3) }),
        () => notify('Időjárás', 'A helyzeted nem érhető el. Engedélyezd a helymeghatározást, vagy keress rá egy városra.', 'weather'),
        { timeout: 10000 });
    };

    load(false);
    return () => { alive = false; };
  },
});

// =====================================================================
//  Diktafon — hangfelvevő (a felvételek a telefonon maradnak)
// =====================================================================
// A felvételek ugyanott tárolódnak, mint a fotók (ez a dupla kattintással megnyitott oldalon is működik).
// Ha betelik a hely, a legrégebbi felvétel törlődik.
const REC_MAX_SEC = 180;
const recDB = {
  async all() { return store.get('recordings', []).slice().sort((a, b) => b.id - a.id); },
  async put(v) {
    const src = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(v.blob); });
    const list = store.get('recordings', []);
    list.push({ id: v.id, name: v.name, dur: v.dur, src });
    while (!store.set('recordings', list) && list.length > 1) list.shift();
  },
  async del(id) { store.set('recordings', store.get('recordings', []).filter(r => r.id !== id)); },
};

registerApp({
  id: 'recorder', name: 'Diktafon', icon: 'mic', bg: 'linear-gradient(135deg,#ff5f6d,#c31432)',
  optional: true, category: 'Eszközök',
  desc: 'Hangfelvevő: rögzíts legfeljebb 3 perces hangjegyzeteket, és hallgasd vissza bármikor. A felvételek csak a telefonodon tárolódnak.',
  render(el) {
    let rec = null, stream = null, chunks = [], startT = 0, iv = null, raf = 0, audio = null, playing = null;

    el.innerHTML = `<div class="rec">
      <div class="app-title">Diktafon</div>
      <div class="rec-list"></div>
      <div class="rec-panel">
        <canvas class="rec-wave"></canvas>
        <div class="rec-time">00:00</div>
        <button class="rec-btn" aria-label="Felvétel"><i></i></button>
      </div>
    </div>`;
    const listEl = $('.rec-list', el), btn = $('.rec-btn', el), timeEl = $('.rec-time', el), wave = $('.rec-wave', el);

    const drawList = async () => {
      let all = [];
      try { all = await recDB.all(); } catch { /* ha a tároló nem érhető el, üres listát mutatunk */ }
      listEl.innerHTML = all.length ? `<div class="group">${all.map(r => `<div class="row rec-row" data-id="${r.id}">
          <button class="rec-play" data-play="${r.id}" aria-label="Lejátszás">${ic(playing === r.id ? 'pause' : 'play')}</button>
          <span class="grow"><b>${esc(r.name)}</b><small class="muted">${new Date(r.id).toLocaleString(LOC, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · ${fmtCallDur(r.dur)}</small></span>
          <button class="nc-x" data-del="${r.id}" aria-label="Törlés">${ic('trash')}</button></div>`).join('')}</div>`
        : '<div class="empty">Még nincs felvétel.<br>Nyomd meg a piros gombot!</div>';
      $$('[data-play]', listEl).forEach(b => (b.onclick = () => play(all.find(r => r.id === +b.dataset.play))));
      $$('[data-del]', listEl).forEach(b => (b.onclick = async () => { if (playing === +b.dataset.del) stopAudio(); await recDB.del(+b.dataset.del); drawList(); }));
    };

    const stopAudio = () => { audio?.pause(); audio = null; playing = null; };
    const play = r => {
      if (playing === r.id) { stopAudio(); drawList(); return; }
      stopAudio();
      audio = new Audio(r.src);
      playing = r.id;
      audio.onended = () => { playing = null; drawList(); };
      audio.play();
      drawList();
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        notify('Diktafon', 'Nincs mikrofon, vagy nem engedélyezted a használatát.', 'recorder');
        return;
      }
      stopAudio();
      chunks = [];
      rec = new MediaRecorder(stream);
      rec.ondataavailable = e => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        const dur = Math.round((Date.now() - startT) / 1000);
        const n = (await recDB.all()).length + 1;
        await recDB.put({ id: Date.now(), name: `Felvétel ${n}`, dur, blob: new Blob(chunks, { type: rec.mimeType }) });
        drawList();
      };
      rec.start();
      startT = Date.now();
      btn.classList.add('on');
      screenEl.classList.add('ring-mic');
      iv = setInterval(() => {
        const s = Math.floor((Date.now() - startT) / 1000);
        timeEl.textContent = fmtCallDur(s);
        if (s >= REC_MAX_SEC) stop(); // legfeljebb 3 perc, hogy elférjen a telefonon
      }, 250);
      // Élő hanghullám
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx;
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(an);
      const data = new Uint8Array(an.fftSize);
      const g = wave.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      wave.width = wave.clientWidth * dpr;
      wave.height = wave.clientHeight * dpr;
      const draw = () => {
        raf = requestAnimationFrame(draw);
        an.getByteTimeDomainData(data);
        g.clearRect(0, 0, wave.width, wave.height);
        g.strokeStyle = '#ff375f';
        g.lineWidth = 2 * dpr;
        g.beginPath();
        data.forEach((v, i) => {
          const x = (i / data.length) * wave.width, y = (v / 255) * wave.height;
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        });
        g.stroke();
      };
      draw();
    };

    const stop = () => {
      if (!rec) return;
      rec.stop();
      stream.getTracks().forEach(t => t.stop());
      rec = null;
      clearInterval(iv);
      cancelAnimationFrame(raf);
      wave.getContext('2d').clearRect(0, 0, wave.width, wave.height);
      btn.classList.remove('on');
      timeEl.textContent = '00:00';
      screenEl.classList.remove('ring-mic');
    };

    btn.onclick = () => (rec ? stop() : start());
    listEl.innerHTML = '<div class="empty">Még nincs felvétel.<br>Nyomd meg a piros gombot!</div>';
    drawList();
    return () => { stop(); stopAudio(); };
  },
});

// =====================================================================
//  Indulás
// =====================================================================
window.addEventListener('load', () => {
  renderLockNotifs();
  updateAlarmIcon();
  systemTick();
  setInterval(systemTick, 1000);
});
