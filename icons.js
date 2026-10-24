'use strict';
// =====================================================================
//  CSSOS — saját ikonkészlet
//  Minden ikon 24×24-es rácsra rajzolt vonalas ábra.
//  Használat: ic('phone') → SVG szöveg, mérete a betűmérettel állítható.
// =====================================================================

const ICONS = {
  // Alkalmazások
  phone: '<path d="M5 4h3.5l2 5-2.5 1.6a11 11 0 0 0 5.4 5.4L15 13.5l5 2V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  message: '<path d="M21 11.5a8.5 8 0 0 1-12 7.3L4 20l1.3-4.2A8.5 8 0 1 1 21 11.5z"/><path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01" stroke-width="2.6"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  calculator: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8.5 7.5h7"/><path d="M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" stroke-width="2.6"/>',
  notes: '<path d="M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M8.5 13h7M8.5 17h4.5"/>',
  gallery: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 15.5l-5-5L6.5 20"/>',

  // Rendszer
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.8 12.5a9.5 9.5 0 0 1 12.4 0M9.2 16a4.5 4.5 0 0 1 5.6 0"/><circle cx="12" cy="19.3" r="1.1" fill="currentColor" stroke="none"/>',
  bluetooth: '<path d="M7 7.5l10 9-5 4.5V3l5 4.5-10 9"/>',
  plane: '<path d="M10.2 3.6a1.8 1.8 0 0 1 3.6 0V9l7.2 4v2.2L13.8 13v4.6l2.6 2V21L12 20l-4.4 1v-1.4l2.6-2V13L3 15.2V13l7.2-4z"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/>',
  contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.2 2.2M10 2.5h4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 21h4"/>',
  speaker: '<path d="M4 9.5h3.5L12.5 5v14l-5-4.5H4z"/><path d="M16 9a4.5 4.5 0 0 1 0 6M18.8 6.5a8.5 8.5 0 0 1 0 11"/>',
  speakerLow: '<path d="M4 9.5h3.5L12.5 5v14l-5-4.5H4z"/><path d="M16 9.5a3.5 3.5 0 0 1 0 5"/>',
  speakerOff: '<path d="M4 9.5h3.5L12.5 5v14l-5-4.5H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  sunLow: '<circle cx="12" cy="12" r="3.5"/><path d="M12 5.5v.5M12 18v.5M5.5 12h.5M18 12h.5M7.4 7.4l.3.3M16.3 16.3l.3.3M7.4 16.6l.3-.3M16.3 7.7l.3-.3"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.3-1-1.5-1-2.5s.8-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><path d="M7.5 11.5h.01M9.5 7.5h.01M14.5 7.5h.01" stroke-width="2.6"/>',
  home: '<path d="M3 11l9-7.5 9 7.5"/><path d="M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="4"/><path d="M12 4.5V8"/><circle cx="12" cy="3.5" r="1"/><path d="M9 13.5h.01M15 13.5h.01" stroke-width="2.8"/><path d="M10 17h4"/>',
  storage: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  device: '<rect x="6.5" y="2.5" width="11" height="19" rx="3"/><circle cx="9.5" cy="5.5" r=".8" fill="currentColor"/><path d="M10.5 18.5h3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/>',
  backspace: '<path d="M8.5 5H20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8.5L2.5 12z"/><path d="M11.5 9.5l5 5M16.5 9.5l-5 5"/>',
  micOff: '<path d="M15 10.5V6a3 3 0 0 0-5.6-1.5M9 9v2a3 3 0 0 0 4.6 2.5M5.5 11a6.5 6.5 0 0 0 10.6 5M18.5 11a6.5 6.5 0 0 1-.5 2.5M12 17.5V21M3 3l18 18"/>',
  keypad: '<path d="M6 5h.01M12 5h.01M18 5h.01M6 11h.01M12 11h.01M18 11h.01M6 17h.01M12 17h.01M18 17h.01M12 21.5h.01" stroke-width="3"/>',
  send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  signal: '<path d="M4.5 20v-3M9.5 20v-6.5M14.5 20V10M19.5 20V5.5"/>',
  hourglass: '<path d="M6 3h12M6 21h12"/><path d="M7.5 3c0 4.5 4.5 5.5 4.5 9s-4.5 4.5-4.5 9M16.5 3c0 4.5-4.5 5.5-4.5 9s4.5 4.5 4.5 9"/>',
  access: '<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5l7 1.5 7-1.5M12 10v4.5l-3.5 6.5M12 14.5l3.5 6.5"/>',
  battery: '<rect x="2.5" y="7" width="17" height="10" rx="2.5"/><path d="M22 10.5v3M6 10.5v3M9.5 10.5v3"/>',
  date: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  update: '<path d="M20 11a8 8 0 0 0-14.5-4.5M4 3.5V7h3.5M4 13a8 8 0 0 0 14.5 4.5M20 20.5V17h-3.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  music: '<path d="M9 18V5.5l11-2.5v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  play: '<path d="M7.5 4.5v15l12-7.5z" fill="currentColor"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3.6"/>',
  next: '<path d="M5 5.5v13l9-6.5z" fill="currentColor"/><path d="M18.5 5.5v13" stroke-width="2.6"/>',
  prev: '<path d="M19 5.5v13l-9-6.5z" fill="currentColor"/><path d="M5.5 5.5v13" stroke-width="2.6"/>',
  gamepad: '<rect x="2.5" y="7" width="19" height="10.5" rx="5.25"/><path d="M7.5 10v5M5 12.5h5"/><path d="M15.5 11.5h.01M18 14h.01" stroke-width="2.8"/>',
  brush: '<path d="M18.5 3.5a2.1 2.1 0 0 1 3 3L11 17l-4 1 1-4z"/><path d="M3.5 21c2 0 3.5-1 3.5-3"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  chevUp: '<path d="M6 15l6-6 6 6"/>',
  chevDown: '<path d="M6 9l6 6 6-6"/>',
  chevLeft: '<path d="M15 6l-6 6 6 6"/>',
  chevRight: '<path d="M9 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  store: '<path d="M4.5 8h15l-1.2 12.1a1 1 0 0 1-1 .9H6.7a1 1 0 0 1-1-.9z"/><path d="M9 11V6.5a3 3 0 0 1 6 0V11"/>',
  download: '<path d="M12 3.5v11M7 10l5 5 5-5M5 20h14"/>',
  flashlight: '<path d="M7.5 2.5h9v4l-2.5 3.5V20.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V10L7.5 6.5z"/><path d="M7.5 6.5h9M12 13v2.5"/>',
  dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01" stroke-width="3"/>',
  cards: '<rect x="3" y="6" width="11" height="15" rx="2.5"/><path d="M8 3.5A1.5 1.5 0 0 1 9.5 2h10A1.5 1.5 0 0 1 21 3.5v12a1.5 1.5 0 0 1-1.5 1.5H16.5"/><path d="M8.5 11l2 2.5-2 2.5-2-2.5z"/>',
  convert: '<path d="M4 8h15l-4-4M20 16H5l4 4"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.8 8.2l-2.3 5.3-5.3 2.3 2.3-5.3z"/>',
  grid3: '<path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17"/>',
  trash: '<path d="M4 6.5h16M9.5 6.5V4h5v2.5M6.5 6.5l1 13.5h9l1-13.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  alarm: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.5M4.5 4.5l2.5-2M19.5 4.5l-2.5-2"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  cloud: '<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 9.1 4.7 4.7 0 0 0 7 18.5z"/>',
  partly: '<path d="M8.5 2.5v1.3M3.7 4.6l.9.9M2.5 9.3h1.3M13.3 4.6l-.9.9"/><path d="M5.6 11.6A3.6 3.6 0 1 1 11.9 7.9"/><path d="M9 20.5h8.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-.4A3.8 3.8 0 0 0 9 20.5z"/>',
  rain: '<path d="M7 14.5h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 5.1 4.7 4.7 0 0 0 7 14.5z"/><path d="M8.5 17.5l-1 3M12.5 17.5l-1 3M16.5 17.5l-1 3"/>',
  snow: '<path d="M7 14.5h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 5.1 4.7 4.7 0 0 0 7 14.5z"/><path d="M8 18h.01M12 19.5h.01M16 18h.01M10 21.5h.01M14 21.5h.01" stroke-width="2.6"/>',
  storm: '<path d="M7 14h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 4.6 4.7 4.7 0 0 0 7 14z"/><path d="M12.5 14l-2 4h3l-2 4"/>',
  fog: '<path d="M4 8h16M6 12h12M4 16h16M8 20h8"/>',
  moonSmall: '<path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z"/>',
  wind: '<path d="M3 8h10.5a2.5 2.5 0 1 0-2.5-2.5M3 12h15a2.5 2.5 0 1 1-2.5 2.5M3 16h7"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  thermo: '<path d="M14 14.6V5a2 2 0 0 0-4 0v9.6a4 4 0 1 0 4 0z"/>',
  sunrise: '<path d="M3 18h18M6.5 14.5a5.5 5.5 0 0 1 11 0M12 3.5v4.5M9.5 6L12 3.5 14.5 6"/>',
  sunset: '<path d="M3 18h18M6.5 14.5a5.5 5.5 0 0 1 11 0M12 8V3.5M9.5 6L12 8.5 14.5 6"/>',
  location: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/>',
  bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" fill="currentColor" stroke-linejoin="round"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
};

function ic(name, extraClass = '') {
  return `<svg class="ic ${extraClass}" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

// A HTML-ben data-ic="név" attribútummal megjelölt helyekre beteszi az ikont
function fillIcons(root = document) {
  root.querySelectorAll('[data-ic]').forEach(el => { el.innerHTML = ic(el.dataset.ic); });
}
