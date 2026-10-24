'use strict';
// =====================================================================
//  CSSOS — nyelvek (magyar, angol)
//  A felületet magyarul írtuk; angol nyelvnél ez a fájl minden megjelenő
//  szöveget lecserél a fordítására. Új nyelvhez: új szótár + LANGS bővítése.
// =====================================================================

// A választott nyelv (Beállítások → Általános → Nyelv). Ha még nincs, a böngésző nyelve dönt.
const LANG = (() => {
  try {
    const s = JSON.parse(localStorage.getItem('nova.settings') || '{}');
    if (s.lang) return s.lang;
  } catch {}
  return (navigator.language || 'hu').toLowerCase().startsWith('hu') ? 'hu' : 'en';
})();
const LOC = LANG === 'en' ? 'en-GB' : 'hu-HU'; // dátumok és idők formája
const L = (hu, en) => (LANG === 'en' ? en : hu); // kódon belüli rövid fordításokhoz
document.documentElement.lang = LANG;

// ---------------------------------------------------------------- Angol szótár (pontos egyezés)
const EN = new Map(Object.entries({
  // Rendszer
  'Csúsztasd felfelé a feloldáshoz': 'Swipe up to unlock', 'Add meg a PIN-kódot': 'Enter your PIN', 'Mégse': 'Cancel', 'Törlés': 'Delete',
  'Vezérlőközpont': 'Control Center', 'Repülő': 'Airplane', 'Ne zavarj': 'Do Not Disturb', 'Sötét mód': 'Dark Mode', 'Kamera': 'Camera',
  'Időzítő': 'Timer', 'Zárolás': 'Lock', 'Keresés': 'Search', 'Kész': 'Done', 'Bekapcsoló gomb': 'Power button',
  'Jó reggelt!': 'Good morning!', 'Jó napot!': 'Good afternoon!', 'Jó estét!': 'Good evening!', 'Jó éjszakát!': 'Good night!',
  'Értesítések': 'Notifications', 'Összes törlése': 'Clear all', 'Nincs új értesítés': 'No new notifications', 'Új értesítés': 'New notification',
  'Összes bezárása': 'Close all', 'Nincs megnyitott alkalmazás': 'No open apps', 'most': 'now', 'Töltés': 'Charging',
  'App, beállítás, kérdés…': 'App, setting, question…', 'Legutóbbi appok': 'Recent apps', 'Tipp': 'Tip', 'Alkalmazások': 'Apps',
  'Írd be egy app nevét, egy beállítást, vagy kérdezd meg az asszisztenst! Például:': 'Type an app name or a setting, or ask the assistant! For example:',
  '„időzítő 5 perc”': '“timer 5 min”', '„sötét mód”': '“dark mode”', '„nyisd meg a zenét”': '“open music”',
  'Lejárt az időzítő! ⏰': "Time's up! ⏰", 'Szundi: 5 perc múlva újra szólok.': "Snoozed: I'll ring again in 5 minutes.",
  'Ébresztő': 'Alarm', 'Szundi · 5 perc': 'Snooze · 5 min', 'Leállítás': 'Stop', 'Következő ébresztő': 'Next alarm', 'Felvétel folyamatban': 'Recording…',
  '+1 perc': '+1 min', 'Fénygyűrű': 'Light Ring', 'ÉLŐ': 'LIVE',
  // Appok nevei
  'Telefon': 'Phone', 'Üzenetek': 'Messages', 'Fotók': 'Photos', 'Óra': 'Clock', 'Naptár': 'Calendar', 'Időjárás': 'Weather',
  'Számológép': 'Calculator', 'Jegyzetek': 'Notes', 'Beállítások': 'Settings', 'Áruház': 'Store', 'Zene': 'Music', 'Kígyó': 'Snake',
  'Rajz': 'Paint', 'Zseblámpa': 'Flashlight', 'Dobókocka': 'Dice', 'Memória': 'Memory', 'Átváltó': 'Converter', 'Iránytű': 'Compass',
  'Amőba': 'Tic-Tac-Toe', 'Diktafon': 'Recorder',
  // Telefon és névjegyek
  'Legutóbbiak': 'Recents', 'Névjegyek': 'Contacts', 'Billentyűzet': 'Keypad', 'Kedvencek': 'Favorites', 'Szerkesztés': 'Edit',
  'Hívás': 'Call', 'Kedvenc': 'Favorite', 'Kedvencekhez': 'Add to favorites', 'Névjegy törlése': 'Delete contact', 'Új névjegy': 'New contact',
  'Név': 'Name', 'Telefonszám': 'Phone number', 'pl. Anya': 'e.g. Mom', '‹ Névjegyek': '‹ Contacts', 'Még nem telefonáltál.': "You haven't made any calls yet.",
  'Még nincs névjegyed.': "You don't have any contacts yet.", 'Koppints a + gombra az első felvételéhez!': 'Tap + to add your first one!',
  'Hívás…': 'Calling…', 'Hívás vége': 'Call ended', 'némítás': 'mute', 'billentyűzet': 'keypad', 'hangszóró': 'speaker', 'nem kapcsolt': 'not connected',
  // Üzenetek és asszisztens
  'Üzenet': 'Message', 'Szia! 👋 Miben segíthetek?': 'Hi! 👋 How can I help?', 'Szívesen! 😊': "You're welcome! 😊",
  'Ez lesz a világ legjobb telefonja! 🚀📱': "This is going to be the world's best phone! 🚀📱", 'Nullával nem lehet osztani! 🙅': "You can't divide by zero! 🙅",
  'Érdekes! Mesélj még. 🙂': 'Interesting! Tell me more. 🙂', 'Értem! 👍': 'Got it! 👍',
  'Hmm, ezt még tanulom. 🤔 Írd be, hogy „mit tudsz”, és megmutatom a parancsaimat!': "Hmm, I'm still learning that. 🤔 Type “what can you do” and I'll show you my commands!",
  'Kérdezd meg, hány óra van, kérj egy viccet, vagy mondd, hogy „nyisd meg a zenét”!': 'Ask me what time it is, ask for a joke, or say “open music”!',
  'Mit mond a nulla a nyolcasnak? – Csinos öv! 😄': 'What did the zero say to the eight? – Nice belt! 😄',
  'Miért vitte a matektanár a létrát az iskolába? – Mert magasabb szintre akart lépni. 🪜': 'Why did the student bring a ladder to school? – To get to high school! 🪜',
  'Mi az: kicsi, kerek és nevet? – A kuncogó borsó. 🟢': 'What do you call a sleeping dinosaur? – A dino-snore! 🦕',
  'Miért nem játszik a telefon focit? – Mert fél, hogy lemerül a csatár. 📱⚽': 'Why was the phone wearing glasses? – It lost its contacts! 📱',
  'Bekapcsoltam a sötét módot. 🌙': 'Dark mode is on. 🌙', 'Bekapcsoltam a világos módot. ☀️': 'Light mode is on. ☀️',
  'Ne zavarj mód bekapcsolva. 🌙 Értesítést most nem kapsz.': "Do Not Disturb is on. 🌙 You won't get notifications now.", 'Ne zavarj mód kikapcsolva.': 'Do Not Disturb is off.',
  'Leállítottam a zenét. 🔇': 'Music stopped. 🔇', 'Megnyitom a zseblámpát! 🔦': 'Opening the flashlight! 🔦', 'Zárolom a telefont. 🔒': 'Locking the phone. 🔒',
  'Bulizzunk! 🎉🎉🎉': "Let's party! 🎉🎉🎉", 'Ehhez töltsd le a Zene appot az Áruházból! 🎵': 'Get the Music app from the Store for that! 🎵',
  'Ehhez töltsd le a Zseblámpa appot az Áruházból! 🔦': 'Get the Flashlight app from the Store for that! 🔦',
  'Ezeket tudom:\n• „nyisd meg a zenét”\n• „időzítő 5 perc”\n• „sötét mód” / „világos mód”\n• „játssz zenét” / „állítsd le a zenét”\n• „zseblámpa”\n• „ne zavarj”\n• „új háttérkép”\n• „fényerő 50”\n• „zárold a telefont”\n• „bulizzunk” 🎉\n• számolás, pl. „12*7”, és vicc is!':
    'Here is what I can do:\n• “open music”\n• “timer 5 min”\n• “dark mode” / “light mode”\n• “play music” / “stop music”\n• “flashlight”\n• “do not disturb”\n• “new wallpaper”\n• “brightness 50”\n• “lock the phone”\n• “party” 🎉\n• math like “12*7”, and jokes too!',
  // Kamera, Fotók
  'A kamera nem érhető el. Engedélyezd a kamera-hozzáférést a böngészőben, vagy csatlakoztass webkamerát.': 'The camera is not available. Allow camera access in your browser, or connect a webcam.',
  'Még nincsenek fotók.': 'No photos yet.', 'Készíts egyet a Kamerával!': 'Take one with the Camera!', '‹ Vissza': '‹ Back',
  // Óra
  'Világóra': 'World Clock', 'Stopper': 'Stopwatch', 'Indít': 'Start', 'Állj': 'Stop', 'Nulláz': 'Reset', 'Kör': 'Circle',
  'Válassz időtartamot': 'Choose a duration', 'Új ébresztő': 'New alarm', 'Koppints egy ébresztőre a szerkesztéshez.': 'Tap an alarm to edit it.',
  'Nincs ébresztő beállítva.': 'No alarms set.', 'Címke': 'Label', 'Ismétlés': 'Repeat', 'Mentés': 'Save', 'Ébresztő törlése': 'Delete alarm',
  'Egyszer': 'Once', 'Minden nap': 'Every day', 'Hétköznap': 'Weekdays', 'Hétvégén': 'Weekends', 'Tokió': 'Tokyo',
  // Naptár
  'Január': 'January', 'Február': 'February', 'Március': 'March', 'Április': 'April', 'Május': 'May', 'Június': 'June', 'Július': 'July',
  'Augusztus': 'August', 'Szeptember': 'September', 'Október': 'October', 'November': 'November', 'December': 'December',
  'Egész nap': 'All day', 'Nincs esemény. Koppints ide egy új felvételéhez!': 'No events. Tap here to add one!', 'Új esemény': 'New event',
  'Hozzáadás': 'Add', 'Cím': 'Title', 'Nap': 'Day', 'Időpont': 'Time', 'pl. Edzés': 'e.g. Training',
  'Ha adsz meg időpontot, a telefon akkor értesítést küld.': "If you set a time, you'll get a notification then.",
  // Számológép, Jegyzetek
  'CSS Telefon': 'CSS Phone', 'Hiba': 'Error', 'Új jegyzet ✎': 'New note ✎', 'Új jegyzet': 'New note', 'Nincs további szöveg': 'No additional text', '‹ Jegyzetek': '‹ Notes',
  'Írj valamit…': 'Write something…', 'Még nincsenek jegyzetek.': 'No notes yet.', 'Koppints az „Új jegyzet” gombra!': 'Tap “New note”!',
  // Zene, játékok, Rajz
  'CSSOS téma': 'CSSOS Theme', 'CSS Hangstúdió': 'CSS Sound Studio', 'Magyar népdal': 'Hungarian folk song', 'Örömóda': 'Ode to Joy',
  'Edd meg a piros pöttyöket, de a falba és magadba ne ütközz!': "Eat the red dots, but don't hit the walls or yourself!",
  'Játék indítása': 'Start game', 'Újra': 'Retry', 'Vége a játéknak': 'Game over', 'Új rekord!': 'New record!', 'Pont:': 'Score:', 'Rekord:': 'Best:',
  'A rajzot elmentettem a Fotókba.': 'Your drawing was saved to Photos.', 'Dobás': 'Roll', 'Új játék': 'New game', 'Lépések:': 'Moves:', 'Legjobb:': 'Best:',
  'Te jössz!': 'Your turn!', 'A telefon gondolkodik…': 'Phone is thinking…', 'Nyertél!': 'You won!', 'A telefon nyert.': 'The phone won.', 'Döntetlen.': "It's a draw.",
  // Zseblámpa, Átváltó, Iránytű
  'Koppints a bekapcsoláshoz': 'Tap to turn on', 'A kijelző világít': 'The screen is lit', 'A vaku világít': 'The flash is on',
  'Hossz': 'Length', 'Tömeg': 'Weight', 'Hőmérséklet': 'Temperature', 'hüvelyk': 'inch', 'láb': 'foot', 'mérföld': 'mile', 'font': 'pound', 'uncia': 'ounce',
  'Iránytű engedélyezése': 'Enable compass', 'Az iránytűhöz engedély kell.': 'The compass needs permission.',
  'Ezen az eszközön nincs iránytű. Nyisd meg egy telefonon (például Androidon), és ott működni fog.': 'This device has no compass. Open it on a phone (for example Android) and it will work there.',
  // Időjárás
  'ÓRÁNKÉNT': 'HOURLY', '7 NAPOS ELŐREJELZÉS': '7-DAY FORECAST', 'HŐÉRZET': 'FEELS LIKE', 'PÁRATARTALOM': 'HUMIDITY', 'SZÉL': 'WIND', 'NAPKELTE': 'SUNRISE',
  'Most': 'Now', 'Ma': 'Today', 'Derült': 'Clear', 'Többnyire derült': 'Mostly clear', 'Részben felhős': 'Partly cloudy', 'Borult': 'Overcast',
  'Ködös': 'Foggy', 'Szitálás': 'Drizzle', 'Eső': 'Rain', 'Havazás': 'Snow', 'Zápor': 'Showers', 'Hózápor': 'Snow showers', 'Zivatar': 'Thunderstorm',
  'Időjárás betöltése…': 'Loading weather…', 'Nem sikerült betölteni az időjárást. Van internet?': "Couldn't load the weather. Are you online?",
  'Város neve, pl. Szeged': 'City name, e.g. London', 'Nincs ilyen város.': 'No such city.', 'Nincs internetkapcsolat.': 'No internet connection.',
  'Jelenlegi helyzet': 'Current location', 'A helyzeted nem érhető el. Engedélyezd a helymeghatározást, vagy keress rá egy városra.': 'Your location is not available. Allow location access, or search for a city.',
  // Diktafon
  'Még nincs felvétel.': 'No recordings yet.', 'Nyomd meg a piros gombot!': 'Press the red button!',
  'Nincs mikrofon, vagy nem engedélyezted a használatát.': "There's no microphone, or you didn't allow it.",
  // Áruház
  'AJÁNLOTT NEKED': 'RECOMMENDED FOR YOU', 'KEDVENC': 'FAVORITE', 'ANDROID-APPOK': 'ANDROID APPS', 'CSSOS-appok': 'CSSOS apps',
  'Az igazi Google Play Áruház: YouTube, Roblox és minden más Android-app.': 'The real Google Play Store: YouTube, Roblox and every other Android app.',
  'Összes': 'All', 'Játékok': 'Games', 'Eszközök': 'Tools', 'Telepítve': 'Installed', 'Szórakozás': 'Entertainment', 'Kreatív': 'Creative',
  'Letöltés': 'Get', 'Megnyitás': 'Open', '‹ Áruház': '‹ Store', 'CSS Stúdió': 'CSS Studio', 'KATEGÓRIA': 'CATEGORY', 'MÉRET': 'SIZE', 'KORHATÁR': 'AGE',
  'Leírás': 'Description', 'Itt még nincs semmi.': 'Nothing here yet.', 'Nézz körül az „Összes” fülön!': 'Have a look in the “All” tab!',
  'Ezen a telefonon nincs Google Play.': "This phone doesn't have Google Play.",
  'Zenelejátszó forgó lemezzel és a zenére ugráló hangszínképpel. A dalokat a telefon maga játssza le hangjegyekből, és bezárt appnál is szól tovább.': 'A music player with a spinning record and a visualizer that dances to the music. The phone plays the songs itself from notes, and keeps playing when you close the app.',
  'A klasszikus kígyós játék szivárványszínben. Edd meg a pöttyöket, nőj minél nagyobbra, és döntsd meg a rekordodat!': 'The classic snake game in rainbow colors. Eat the dots, grow as big as you can, and beat your record!',
  'Rajzolj az ujjaddal 8 színnel és állítható ecsettel. A kész művet egy gombnyomással elmentheted a Fotókba.': 'Draw with your finger in 8 colors with an adjustable brush. Save your masterpiece to Photos with one tap.',
  'Egy gombnyomásra világít. Androidos telefonon a valódi vakut kapcsolja be, máshol a kijelző világít fehéren.': 'Lights up with one tap. On Android it turns on the real flash; elsewhere the screen glows white.',
  'Dobj egy vagy két kockával társasjátékhoz! Koppints a kockákra, vagy rázd meg a gombot.': 'Roll one or two dice for board games! Tap the dice or press the button.',
  'Fordítsd fel a kártyákat, és találd meg a párokat minél kevesebb lépésből! A legjobb eredményed megmarad.': 'Flip the cards and find the pairs in as few moves as you can! Your best score is saved.',
  'Mértékegységek átváltása egy pillanat alatt: hosszúság, tömeg és hőmérséklet.': 'Convert units in a moment: length, weight and temperature.',
  'Megmutatja, merre van észak. Iránytűvel rendelkező telefonon (például Androidon) működik.': 'Shows you where north is. Works on phones with a compass (for example Android).',
  'Három egy sorban! Játssz a telefon ellen. Te vagy az X, a telefon a kör.': 'Three in a row! Play against the phone. You are X, the phone is O.',
  'Hangfelvevő: rögzíts legfeljebb 3 perces hangjegyzeteket, és hallgasd vissza bármikor. A felvételek csak a telefonodon tárolódnak.': 'Voice recorder: record voice notes up to 3 minutes long and play them back anytime. Recordings stay on your phone only.',
  // Beállítások
  'Keresés a beállításokban': 'Search settings', 'Nincs találat.': 'No results.', '‹ Beállítások': '‹ Settings', '‹ Általános': '‹ General',
  'Repülőgép üzemmód': 'Airplane Mode', 'Mobiladat': 'Mobile Data', 'Hangok és rezgés': 'Sounds & Haptics', 'Képernyőidő': 'Screen Time',
  'Kijelző és fényerő': 'Display & Brightness', 'Háttérkép és színek': 'Wallpaper & Colors', 'Kezdőképernyő': 'Home Screen', 'Zárolási képernyő': 'Lock Screen',
  'Kisegítő lehetőségek': 'Accessibility', 'Akkumulátor': 'Battery', 'Biztonság és PIN': 'Security & PIN', 'Asszisztens': 'Assistant', 'Tárhely': 'Storage',
  'Általános': 'General', 'Be': 'On', 'Ki': 'Off', 'Előnézet zárolt képernyőn': 'Show previews when locked', 'Értesítési hang': 'Notification sound',
  'Értesítési központ megnyitása': 'Open Notification Center', 'Fénygyűrű jelzései': 'Light Ring signals', 'Próbaértesítés küldése': 'Send a test notification',
  'Hangerő': 'Volume', 'A telefon bal oldalán lévő gombokkal is állíthatod.': 'You can also use the buttons on the left side of the phone.',
  'Billentyűhangok': 'Keyboard clicks', 'Rezgés': 'Vibration', 'A rezgés csak olyan telefonon érezhető, amelyik támogatja.': 'You can only feel vibration on phones that support it.',
  'Hang kipróbálása': 'Test sound', 'Ma összesen': 'Today in total', 'Mai képernyőidő törlése': "Clear today's screen time",
  'Ma még nem használtál egy appot sem.': "You haven't used any apps today.",
  'Az idő csak akkor számít, amikor egy app nyitva van és a telefon nincs zárolva. Éjfélkor nullázódik.': 'Time only counts while an app is open and the phone is unlocked. It resets at midnight.',
  'Automatikus (este sötét)': 'Automatic (dark at night)', 'Automatikus módban este 7-től reggel 7-ig sötét, napközben világos a téma.': 'In automatic mode the theme is dark from 7 pm to 7 am and light during the day.',
  'Fényerő': 'Brightness', 'Szemkímélő mód': 'Night Shift', 'Melegebb színűre állítja a kijelzőt, ami este kíméli a szemet.': 'Makes the screen warmer, which is easier on your eyes at night.',
  'Szövegméret': 'Text size', 'Így néz ki a szöveg ebben a méretben.': 'This is how text looks at this size.', 'Automatikus zárolás': 'Auto-Lock',
  'Ennyi idő után kapcsol ki a képernyő, ha nem nyúlsz a telefonhoz.': "The screen turns off after this long if you don't touch the phone.",
  // Frissítés
  'Koppints a frissítések kereséséhez.': 'Tap to check for updates.', 'Böngészőben mindig a legfrissebb verzió fut.': 'The browser always runs the latest version.',
  'Újraindítás és frissítés': 'Restart and update', 'Új app letöltése': 'Download new app',
  'A telefon naponta egyszer magától is megnézi, van-e új CSSOS. Az adataid frissítéskor megmaradnak.': 'Your phone also checks for a new CSSOS once a day. Your data is kept when updating.',
  'Ha internet nélkül frissítenél: másold a telefonra az új CSSOS.apk fájlt, koppints a fenti gombra, és válaszd ki.': 'To update without internet: copy the new CSSOS.apk to your phone, tap the button above and pick it.',
  'Böngészőben a CSSOS mindig a legfrissebb: elég újratölteni az oldalt.': 'In a browser CSSOS is always up to date: just reload the page.',
  'A rendszer naprakész.': 'Your system is up to date.', 'Nem sikerült elérni a frissítési szervert. Van internet?': "Couldn't reach the update server. Are you online?",
  'Online frissítés': 'Online updates', 'Frissítés az internetről, telepítés nélkül, az adatok megmaradnak.': 'Updates over the internet, no reinstalling, your data is kept.',
  'Frissítés telepítése fájlból': 'Install update from file', 'Rendben': 'OK', 'Három kezdőképernyő-oldal': 'Three home screen pages',
  'Balra a Ma nézet widgetekkel, jobbra az Alkalmazástár.': 'Today view with widgets on the left, App Library on the right.',
  'Új vezérlőközpont': 'New Control Center', 'Zenelejátszó, zseblámpa, energiatakarékos mód, hangerő-csúszka.': 'Music player, flashlight, Low Power Mode, volume slider.',
  'Widgetek a zárolási képernyőn': 'Lock screen widgets', 'Időjárás, akkumulátor és a következő esemény.': 'Weather, battery and your next event.',
  'Személyes köszönés': 'Personal greeting', 'Add meg a neved: Beállítások → Általános.': 'Add your name in Settings → General.',
  'Másold a telefonra az új CSSOS.apk fájlt (kábellel vagy Google Drive-on), koppints a fenti gombra, és válaszd ki. A frissítés a mostani CSSOS fölé települ: a beállításaid, jegyzeteid, fotóid és névjegyeid megmaradnak.': 'Copy the new CSSOS.apk to your phone (by cable or Google Drive), tap the button above and pick it. The update installs over your current CSSOS: your settings, notes, photos and contacts are kept.',
  'Böngészőben a CSSOS mindig a legfrissebb: elég újratölteni az oldalt. A telefonra a CSSOS.apk fájllal kerül fel a frissítés.': 'In a browser CSSOS is always up to date: just reload the page. On a phone, updates come as the CSSOS.apk file.',
  // 2.0: oldalak, Alkalmazástár, vezérlőközpont, varázsló
  'Nem szól zene': 'Nothing playing', 'Energiatakarékos': 'Low Power', 'Koppints a mai előrejelzéshez': "Tap for today's forecast",
  'Nincs mai esemény': 'No events today', 'Alkalmazástár': 'App Library', 'Keresés az appok között': 'Search apps', 'Kitűzés': 'Pin',
  'A csillaggal jelölt Android-appok a kezdőképernyőn is megjelennek. A + gombbal tűzhetsz ki újat.': 'Android apps with a star also appear on the home screen. Use + to pin more.',
  'Üdvözöl a CSSOS': 'Welcome to CSSOS', 'Állítsuk be együtt a telefonodat. Csak egy perc!': "Let's set up your phone together. It only takes a minute!",
  'Kezdés': 'Get started', 'Hogy hívnak?': "What's your name?", 'Így fog köszönni neked a telefon.': 'Your phone will greet you by name.',
  'A neved': 'Your name', 'A telefon neve': 'Phone name', 'Tovább': 'Continue', 'Válassz kinézetet': 'Choose your look', 'Sötét': 'Dark', 'Világos': 'Light',
  'Védd a telefonodat': 'Protect your phone', 'Állíts be egy 4 jegyű PIN-kódot, és csak te tudod majd feloldani.': 'Set a 4-digit PIN so only you can unlock it.',
  'PIN beállítása': 'Set PIN', 'Most kihagyom': 'Skip for now', 'Minden kész!': "You're all set!", 'Néhány trükk, amit érdemes tudni:': 'A few handy tricks:',
  'Indulás': "Let's go", 'pl. Peti': 'e.g. Pete', 'Beállító varázsló újra': 'Run setup again',
  'Animációk csökkentése': 'Reduce motion', 'Effektek': 'Effects', 'Automatikus': 'Automatic', 'Látványos': 'Fancy', 'Gyors': 'Fast',
  'A „Gyors” mód elhagyja a homályosított hátteret, így gyengébb telefonon is folyamatosak az animációk. Automatikusan telefonon gyors, számítógépen látványos.': '“Fast” mode skips the blurred backgrounds so animations stay smooth on weaker phones. Automatic means fast on phones and fancy on computers.', 'Kicsi': 'Small', 'Normál': 'Normal', 'Nagy': 'Large', 'Óriás': 'Huge', 'Soha': 'Never',
  'Háttérkép': 'Wallpaper', 'Kiemelő szín': 'Accent color', 'Érintés-fény': 'Touch light',
  'Az „ÉLŐ” jelű háttérképek lassan mozognak. Az utolsó, az „Aurora”, világító színfelhőkből áll.': 'Wallpapers marked “LIVE” move slowly. The last one, “Aurora”, is made of glowing clouds of color.',
  'Ahova a kezdő- vagy a zárolási képernyőn koppintasz, egy fénygyűrű terjed szét.': 'A ring of light spreads wherever you tap on the home or lock screen.',
  'A kiemelő szín a gombokon, a linkeken, az üzenetbuborékokon és a Fénygyűrű értesítés-villanásán látszik.': 'The accent color appears on buttons, links, message bubbles and the Light Ring notification flash.',
  'Ikonforma': 'Icon shape', 'Csepp': 'Drop', 'Négyzet': 'Square', 'Levél': 'Leaf', 'A „Csepp” a CSSOS saját ikonformája.': '“Drop” is the signature CSSOS icon shape.',
  'Ikonméret': 'Icon size', 'Oszlopok száma': 'Columns', 'Üdvözlő widget': 'Greeting widget', 'App nevek megjelenítése': 'Show app names',
  'Óra stílusa': 'Clock style', 'Vékony': 'Thin', 'Vastag': 'Bold', 'Óra színe': 'Clock color', 'Fehér': 'White', 'Másodpercek mutatása': 'Show seconds',
  'Értesítések előnézete': 'Notification previews', 'Tulajdonos üzenete': "Owner's message", 'pl. Ha megtaláltad, hívj!': 'e.g. If found, please call me!',
  'Ez a szöveg a zárolási képernyő alján látszik. Jól jön, ha elhagyod a telefont.': 'This text appears at the bottom of the lock screen. Handy if you lose your phone.',
  'Zárolási képernyő megnézése': 'Preview lock screen', 'Félkövér szöveg': 'Bold text', 'Színszűrő': 'Color filter', 'Nincs': 'None', 'Szürke': 'Grayscale',
  'Fordított': 'Inverted', 'Kontraszt': 'Contrast',
  'A „Szürke” segít kevesebbet nyomkodni a telefont, a „Fordított” és a „Kontraszt” pedig a jobb olvashatóságot.': '“Grayscale” helps you use the phone less, while “Inverted” and “Contrast” make things easier to read.',
  'Az akkumulátor szintje ebben a böngészőben nem olvasható ki.': "This browser doesn't report the battery level.", 'Töltés folyamatban': 'Charging',
  'Akkumulátorról működik': 'On battery', 'energiatakarékos mód': 'Low Power Mode', 'Energiatakarékos mód': 'Low Power Mode', 'Automatikusan 20% alatt': 'Automatically below 20%',
  'Energiatakarékos módban kicsit sötétebb a kijelző, nincsenek animációk, a Fénygyűrű pedig csak a kamerát jelzi. Az akkumulátor ikon sárga lesz.': 'In Low Power Mode the screen is a bit dimmer, there are no animations, and the Light Ring only shows the camera. The battery icon turns yellow.',
  'Akkumulátor százalék a felső sávban': 'Battery percentage in the status bar', 'Akkumulátor százalék': 'Battery percentage',
  'PIN-kód': 'PIN', 'Bekapcsolva': 'On', 'PIN-kód kikapcsolása': 'Turn off PIN', 'Új PIN (4 számjegy)': 'New PIN (4 digits)', 'PIN-kód beállítása': 'Set PIN',
  'Zárolás most': 'Lock now', 'Így mutatkozik be az asszisztens az Üzenetek appban.': 'This is how the assistant introduces itself in Messages.',
  'Beszélgetés törlése': 'Delete conversation', '/ kb. 5 MB használatban': '/ approx. 5 MB used', 'Hangfelvételek': 'Recordings', 'Rendszer': 'System',
  'Összes fotó törlése': 'Delete all photos', 'Eszköz neve': 'Device name', 'Idő és dátum': 'Date & Time', 'Rendszerfrissítés': 'Software Update',
  'Névjegy': 'About', 'Verzió': 'Version', 'Kijelző': 'Display', 'ismeretlen': 'unknown', 'Gyári visszaállítás': 'Reset to factory settings',
  '24 órás formátum': '24-hour time', 'Másodpercek a zárolási képernyőn': 'Seconds on the lock screen', 'Pontos idő': 'Time', 'Dátum': 'Date', 'Időzóna': 'Time zone',
  'Az időt és az időzónát a telefon automatikusan a hálózatról veszi.': 'The phone sets the time and time zone automatically from the network.',
  'Még nem kerestél frissítést.': "You haven't checked for updates yet.", 'Frissítések keresése': 'Check for updates', 'Frissítések keresése…': 'Checking for updates…',
  'Android': 'Android', 'Android verzió': 'Android version', 'Android-appok': 'Android apps', 'CSSOS beállítása kezdőképernyőnek': 'Set CSSOS as home screen',
  'Az Android saját beállításai': "Android's own settings", 'Futás': 'Running', 'Böngészőben': 'In a browser', 'CSSOS Androidos telefonra': 'CSSOS on an Android phone',
  'Telepítsd a': 'Install the', 'fájlt a telefonra (a „Telefonos cég” mappában van). Ott a CSSOS lesz a kezdőképernyő, és a telefon igazi appjai, a Google Play is, megjelennek benne.': 'file on the phone (it is in the “Telefonos cég” folder). There CSSOS becomes the home screen, and the phone’s real apps, including Google Play, appear in it.',
  'Ha a CSSOS a kezdőképernyő, a telefon Home gombja mindig ide hoz vissza. Az eredeti kezdőképernyőt ugyanitt lehet visszaállítani.': 'When CSSOS is the home screen, the Home button always brings you back here. You can switch back to the original home screen in the same place.',
  'Nyelv': 'Language', 'A nyelv megváltoztatásakor a telefon felülete újratöltődik.': 'Changing the language reloads the phone’s interface.',
  'Ha az előnézet ki van kapcsolva, zárolt képernyőn csak annyi látszik: „Új értesítés”. Ne zavarj módban semmilyen értesítés nem jelenik meg.': 'If previews are off, the lock screen only shows “New notification”. In Do Not Disturb mode no notifications appear.',
  'A korábbi értesítéseket az értesítési központban látod: húzd le (vagy koppints) a felső sáv bal felén. Ha az előnézet ki van kapcsolva, zárolt képernyőn csak annyi látszik: „Új értesítés”. Ne zavarj módban nem ugranak fel az értesítések, de az értesítési központba bekerülnek.': 'You can see earlier notifications in the Notification Center: pull down (or tap) the left half of the status bar. If previews are off, the lock screen only shows “New notification”. In Do Not Disturb mode notifications don’t pop up, but they still go to the Notification Center.',
  'A kamera körüli gyűrű jelez: villan, ha értesítés jön, zölden pulzál hívás közben, narancssárgán fogy, amíg fut az időzítő, és pirosan világít, amíg a kamera be van kapcsolva. A kamera jelzése kikapcsolt gyűrűnél is megmarad. Ha rákoppintasz a gyűrűre, élő panellé nyílik ki.': 'The ring around the camera signals things: it flashes for notifications, pulses green during calls, shrinks in orange while a timer runs, and glows red while the camera is on. The camera signal stays even if the ring is turned off. Tap the ring and it opens into a live panel.',
  'Így néz ki egy értesítés.': 'This is what a notification looks like.', 'Próbaértesítés': 'Test notification',
  'PIN-kód beállítva. Feloldáskor ezt kell megadni.': "PIN set. You'll need it to unlock.",
  // Felolvasóprogramoknak szóló (láthatatlan) feliratok
  'Értesítés törlése': 'Delete notification', 'Fotó készítése': 'Take photo', 'Előző': 'Previous', 'Lejátszás': 'Play', 'Következő': 'Next',
  'Visszavonás': 'Undo', 'Szín': 'Color', 'Névjegy mentése': 'Save contact', 'Város keresése': 'Search city', 'Helyzetem': 'My location',
  'Felvétel': 'Record', 'Be/ki': 'On/off', 'Eltávolítás': 'Remove', 'Csere': 'Swap', 'Fel': 'Up', 'Le': 'Down', 'Balra': 'Left', 'Jobbra': 'Right',
  'Zseblámpa bekapcsolása': 'Turn on flashlight', 'Kezdőképernyő szerkesztése': 'Edit home screen',
  'Zenelejátszó forgó lemezzel és a zenére ugráló hangszínképpel.': 'A music player with a spinning record and a visualizer that dances to the music.',
  'Törlöd a teljes beszélgetést?': 'Delete the whole conversation?', 'Törlöd az összes fotót?': 'Delete all photos?', 'Törlöd a mai képernyőidőt?': "Clear today's screen time?",
  'Biztosan törölsz minden adatot (jegyzetek, fotók, üzenetek, beállítások)?': 'Are you sure you want to erase everything (notes, photos, messages, settings)?',
}));

// ---------------------------------------------------------------- Minták (változó részekkel)
const EN_RULES = [
  [/^(\d+) perce$/, '$1 min ago'], [/^(\d+) órája$/, '$1 h ago'],
  [/^(\d+) perc$/, '$1 min'], [/^(\d+) mp$/, '$1 sec'], [/^(\d+) másodperc$/, '$1 sec'], [/^(\d+) db$/, '$1'],
  [/^(\d+) nap (\d+) óra múlva$/, 'in $1 d $2 h'], [/^(\d+) óra (\d+) perc múlva$/, 'in $1 h $2 min'], [/^(\d+) perc múlva$/, 'in $1 min'],
  [/^(\d+) óra (\d+) perc$/, '$1 h $2 min'], [/^1 percnél kevesebb$/, 'less than 1 min'],
  [/^(\d+)\. kör$/, 'Lap $1'], [/^Mind \((\d+)\)$/, 'All ($1)'], [/^(\d) oszlop$/, '$1 columns'], [/^(\d) kocka$/, (m, n) => `${n} ${n === '1' ? 'die' : 'dice'}`],
  [/^Összesen: (\d+)$/, 'Total: $1'], [/^Frissítve: (.+)$/, 'Updated: $1'], [/^Telepített app: (.+)$/, 'Installed app: $1'],
  [/^Legutóbbi frissítés: (.+)$/, 'Last update: $1'], [/^Minden app \((\d+)\)$/, 'All apps ($1)'], [/^Találatok \((\d+)\)$/, 'Results ($1)'],
  [/^Egész nap (.+)$/, 'All day $1'],
  [/^(Jó reggelt|Jó napot|Jó estét|Jó éjszakát), (.+)!$/, (m, g, n) => `${{ 'Jó reggelt': 'Good morning', 'Jó napot': 'Good afternoon', 'Jó estét': 'Good evening', 'Jó éjszakát': 'Good night' }[g]}, ${n}!`], [/^Háttérkép (\d+)$/, 'Wallpaper $1'], [/^Szín (\d+)$/, 'Color $1'], [/^(\d+) fotó$/, '$1 photos'], [/^Felvétel (\d+)$/, 'Recording $1'],
  [/^(\d+) alkalmazás$/, '$1 apps'], [/^(\d+) telepítve$/, '$1 installed'],
  [/^Te (\d+)$/, 'You $1'], [/^Döntetlen (\d+)$/, 'Draws $1'], [/^Telefon (\d+)$/, 'Phone $1'],
  [/^akkumulátor (\d+%)$/, 'battery $1'], [/^frissítve (.+)$/, (m, a) => 'updated ' + trText(a)], [/^Napnyugta: (.+)$/, 'Sunset: $1'],
  [/^Kimenő hívás$/, 'Outgoing call'], [/^(.+) asszisztens$/, '$1 assistant'], [/^Kérdezd: „(.*)”$/, 'Ask: “$1”'],
  [/^(.+) – most kezdődik$/, '$1 – starting now'], [/^(\d+) pontot szereztél\.$/, 'You scored $1 points.'],
  [/^Üdv a\(z\) (.+) készülékeden! 👋$/, (m, a) => `Welcome to your ${trText(a)}! 👋`],
  [/^Megnyitom: (.+) 🚀$/, (m, a) => `Opening ${trText(a)} 🚀`], [/^Szól a zene: (.+) 🎶$/, (m, a) => `Now playing: ${trText(a)} 🎶`],
  [/^Rendben, (\d+) (perc|másodperc|óra) múlva szólok!.*$/s, (m, n, u) => `OK, I'll ring in ${n} ${{ perc: 'min', 'másodperc': 'sec', 'óra': 'h' }[u]}! ⏰ The Light Ring shows how much time is left.`],
  [/^A fényerő most (\d+)%\. ☀️$/, 'Brightness is now $1%. ☀️'], [/^Kész, új háttérkép( \(ez élő, mozog!\))?\. 🎨$/, (m, live) => `Done, new wallpaper${live ? ' (this one is live!)' : ''}. 🎨`],
  [/^Nem találok ilyen appot: „(.+)”\. Nézd meg az Áruházban! 🛍️$/, 'I can’t find an app called “$1”. Have a look in the Store! 🛍️'],
  [/^Az eredmény: (.+) 🧮$/, 'The answer: $1 🧮'], [/^Most (.+) van\. ⏰$/, "It's $1 now. ⏰"], [/^Ma (.+) van\. 📅$/, 'Today is $1. 📅'],
  [/^Én (.+) vagyok, a (.+) asszisztense\. 🤖$/, "I'm $1, the $2 assistant. 🤖"],
  [/^Szia! Én (.+) vagyok, a (.+) asszisztense\..*$/s, 'Hi! I’m $1, the $2 assistant. Ask me anything! I can also follow commands like “open music”, “timer 5 min” or “dark mode”. Type “what can you do”!'],
  [/^(.+) telepítve\. Megtalálod a kezdőképernyőn\.$/, (m, a) => `${trText(a)} installed. You'll find it on your home screen.`],
  [/^Az ébresztő (.+) szól\.$/, (m, a) => `The alarm will ring ${trText(a)}.`],
  [/^Ébresztő beállítva: (\S+), (.+) szól\.$/, (m, t, a) => `Alarm set for ${t}, it will ring ${trText(a)}.`],
  [/^Megvan az összes pár (\d+) lépésből!( Új rekord!)?$/, (m, n, r) => `You found all pairs in ${n} moves!${r ? ' New record!' : ''}`],
  [/^Eltávolítod: (.+)\?\n\nAz Áruházból bármikor újra letöltheted\.$/s, (m, a) => `Remove ${trText(a)}?\n\nYou can get it again from the Store anytime.`],
  [/^Eltávolítod: (.+)\?$/, (m, a) => `Remove ${trText(a)}?`], [/^Törlöd: (.+)\?$/, 'Delete $1?'],
  [/^A rendszer naprakész\. Utolsó ellenőrzés: (.+)$/, 'Your system is up to date. Last checked: $1'],
  [/^A rendszer naprakész\. Nincs újabb verzió a (.+)-nál\.$/, 'Your system is up to date. $1 is the latest version.'],
  [/^(.+) · prototípus — jobb oldalt a bekapcsoló, bal oldalt a hangerő gombok$/, '$1 · prototype — power button on the right, volume buttons on the left'],
];

// ---------------------------------------------------------------- Fordítás
function trText(s) {
  if (LANG === 'hu' || !s) return s;
  const t = s.trim();
  if (!t) return s;
  let r = EN.get(t);
  if (r === undefined) {
    for (const [re, rep] of EN_RULES) {
      if (re.test(t)) { r = t.replace(re, rep); break; }
    }
  }
  // „A · B · C” típusú szövegeknél darabonként fordítunk
  if (r === undefined && t.includes(' · ')) {
    const parts = t.split(' · ');
    const tr = parts.map(p => trText(p));
    if (tr.some((p, i) => p !== parts[i])) r = tr.join(' · ');
  }
  if (r === undefined) return s;
  return s.replace(t, r);
}

// Az alkalmazások neve az aktuális nyelven (kereséshez, asszisztenshez)
const appName = app => trText(app.name);

if (LANG !== 'hu') {
  // Ezekben a felhasználó saját szövegei vannak, azokat nem fordítjuk
  const SKIP = '.bubble.me, .note-prev, textarea, input, [data-notr], script, style';
  const ATTRS = ['placeholder', 'aria-label', 'title'];
  const fixAttrs = el => ATTRS.forEach(a => {
    const v = el.getAttribute?.(a);
    if (v) { const t = trText(v); if (t !== v) el.setAttribute(a, t); }
  });
  const translateTree = root => {
    if (root.nodeType === 3) {
      if (root.parentElement?.closest(SKIP)) return;
      const t = trText(root.nodeValue);
      if (t !== root.nodeValue) root.nodeValue = t;
      return;
    }
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    fixAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 1) { fixAttrs(n); continue; }
      if (n.parentElement?.closest(SKIP)) continue;
      const t = trText(n.nodeValue);
      if (t !== n.nodeValue) n.nodeValue = t;
    }
  };
  new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'characterData') translateTree(m.target);
      else if (m.type === 'attributes') fixAttrs(m.target);
      else m.addedNodes.forEach(translateTree);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  document.addEventListener('DOMContentLoaded', () => translateTree(document.body));

  // A felugró kérdések (pl. „Biztosan törlöd?”) is angolul jelenjenek meg
  const origConfirm = window.confirm.bind(window);
  window.confirm = msg => origConfirm(trText(String(msg)));
}

// Angol parancsok átalakítása az asszisztens (magyar) nyelvére
function enCommand(t) {
  if (LANG !== 'en') return t;
  return t
    .replace(/^(what can you do|help|commands)\b.*/, 'mit tudsz')
    .replace(/^(open|launch|start|show)\s+(the\s+)?/, 'nyisd meg ')
    .replace(/\b(set (a )?)?timer (for )?(\d+)\s*(min|mins|minute|minutes)\b/, 'időzítő $4 perc')
    .replace(/\b(set (a )?)?timer (for )?(\d+)\s*(s|sec|secs|second|seconds)\b/, 'időzítő $4 mp')
    .replace(/\b(set (a )?)?timer (for )?(\d+)\s*(h|hour|hours)\b/, 'időzítő $4 ora')
    .replace(/\bdark mode\b/, 'sotet mod').replace(/\blight mode\b/, 'vilagos mod')
    .replace(/\b(stop|pause) (the )?music\b/, 'allitsd le a zenet').replace(/\bplay (some )?music\b/, 'jatssz zenet')
    .replace(/\b(flashlight|torch)\b/, 'zseblampa').replace(/\bdo not disturb( off)?\b/, (m, off) => 'ne zavarj' + (off ? ' ki' : ''))
    .replace(/\b(new )?wallpaper\b/, 'hatter').replace(/\bbrightness\b/, 'fenyero')
    .replace(/^lock( the phone)?$/, 'zarold').replace(/\b(party|celebrate|confetti)\b/, 'buli');
}
