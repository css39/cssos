# CSSOS 3.2

A cégünk telefonjának operációs rendszere. Böngészőben és Androidos telefonon (launcherként) is fut.

## Indítás
Nyisd meg az `index.html` fájlt dupla kattintással (Chrome-ban vagy Edge-ben).
Telefonon is megnyitható, ott teljes képernyőn fut.

## Androidon (igazi telefonon)
A CSSOS Android-appként is fut, **kezdőképernyőként (launcherként)**. Ilyenkor a telefon igazi appjai
(Google Play, YouTube, Roblox…) is megjelennek benne csepp alakú ikonnal, és a Play Áruház is működik.

**A legegyszerűbb:** másold át a `CSSOS.apk` fájlt a telefonra, és nyisd meg. A telefon megkérdezi,
hogy engedélyezed-e az ismeretlen forrásból való telepítést, ezt engedélyezd.

**Android Studióval:**
1. Telepítsd az Android Studiót: https://developer.android.com/studio
2. *File → Open*, és válaszd ki a `Telefonos cég\android` mappát. Várd meg, amíg alul befejeződik a „Gradle sync”.
3. A telefonon kapcsold be a fejlesztői módot: *Beállítások → A telefonról → Buildszám*, erre koppints 7-szer.
   Utána a *Fejlesztői beállítások* között kapcsold be az *USB-hibakeresést*.
4. Dugd be a telefont USB-kábellel, és az Android Studióban nyomd meg a zöld ▶ (Run) gombot.
5. A telefonon nyomd meg a Home gombot, válaszd a **CSSOS**-t, majd a **Mindig** gombot.

Visszaállítás az eredeti kezdőképernyőre: a CSSOS-ban *Beállítások → Általános → CSSOS beállítása kezdőképernyőnek*,
és ott válaszd az eredetit.

Ha a CSSOS-on változtatsz (bármelyik `.js`/`.css` fájlon), az Android-app következő építésekor magától belekerül.
Az Android-rész kódja az `android` mappában van (`MainActivity.java`, `Bridge.java`).

## Használat
- **Feloldás:** húzd felfelé a zárolási képernyőt, vagy kattints a „Csúsztasd felfelé” szövegre
- **Vissza a kezdőképernyőre:** kattints az alsó fehér csíkra, vagy nyomd meg az Esc-et
- **Vezérlőközpont:** kattints a felső sávra (óra / akkumulátor)
- **Zárolás / képernyő ki:** a telefon jobb oldali gombja

## Fájlok
| Fájl | Mit csinál |
|---|---|
| `index.html` | A telefon „hardvere”: kijelző, gombok, rendszerelemek |
| `style.css` | A kinézet |
| `os.js` | A rendszermag: zárolás, PIN, appindítás, vezérlőközpont, értesítések |
| `apps.js` | A beépített alkalmazások |
| `extra.js` | Zene, Kígyó (játék) és Rajz |
| `appstore.js` | Az Áruház és a belőle letölthető appok |
| `settings.js` | A Beállítások app (oldalakra bontva) |
| `cool.js` | Kereső, okos asszisztens, zene-widget, konfetti, töltés-animáció |
| `system.js` | Értesítési központ, Telefon + névjegyek, ébresztő, naptár-események, időjárás, diktafon |
| `wow.js` | Fénygyűrű-panel, Aurora háttér, érintés-fény, kezdőképernyő-szerkesztés |
| `pages.js` | Kezdőképernyő-oldalak: Ma nézet, Alkalmazástár, zárolási widgetek, visszalépés széléről |
| `setup.js` | Beállító varázsló az első induláskor |
| `icons.js` | A CSSOS saját ikonkészlete |
| `i18n.js` | Nyelvek: magyar és angol (szótár + automatikus fordítás) |
| `android/` | Az Android-app (Android Studióval nyitható meg) |
| `CSSOS.apk` | A kész Android-app, telefonra telepíthető |

A rendszer neve (CSSOS) az `os.js` elején, az `OS` sorban van.
Ha ott átírod, mindenhol megváltozik.

## Alkalmazások
Telefon, Üzenetek (CSS asszisztenssel), Kamera, Fotók, Óra (világóra, stopper, időzítő),
Naptár (eseményekkel, emlékeztetővel), Időjárás (élő adatok), Számológép, Jegyzetek, Beállítások, Áruház.
A Telefon appban névjegyek és hívásnapló, az Óra appban ébresztő is van.

Az Áruházból letölthető: Zene, Kígyó, Rajz, Zseblámpa, Dobókocka, Memória, Átváltó, Iránytű, Amőba, Diktafon.

## Új app hozzáadása
1. Az `apps.js`-ben: `registerApp({ id, name, icon, bg, render(el) { ... } })`
2. Az `os.js`-ben írd be az `id`-t a `GRID` (kezdőképernyő) vagy a `DOCK` (alsó sáv) listába.

## A CSSOS saját jegyei
- **Fénygyűrű:** az előlapi kamera a bal felső sarokban van, körülötte egy jelzőgyűrűvel.
  Villan, ha értesítés jön, zölden pulzál hívás közben, narancssárgán fogy, amíg fut az időzítő,
  és pirosan világít, amíg a kamera be van kapcsolva.
- **Csepp alakú ikonok:** saját rajzolású vonalas ikonok (`icons.js`), három lekerekített és egy hegyesebb sarokkal.

## Trükkök
- **Appváltó:** tartsd nyomva az alsó csíkot (vagy nyomd meg a Tab billentyűt). Kártyát felhúzva bezárod az appot.
- **Vezérlőközpont:** húzd le a felső sávot.
- **Élő háttérképek:** Beállítások → Háttérkép és színek, az „ÉLŐ” jelűek.
- **Kereső:** húzd le a kezdőképernyőt, vagy koppints a „Keresés” gombra (gépen: `/` vagy Ctrl+K).
- **Okos asszisztens:** az Üzenetekben vagy a keresőben írd be, hogy „mit tudsz”. Például: „nyisd meg a zenét”, „időzítő 5 perc”, „sötét mód”, „bulizzunk”.
- **Automatikus sötét mód:** Beállítások → Kijelző és fényerő.
- **Értesítési központ:** húzd le (vagy koppints) a felső sáv **bal** felén. A jobb fele a vezérlőközpont.
- **Fénygyűrű-panel:** koppints a bal felső kameragyűrűre: élő panellé nyílik (időzítő, zene, töltés, ébresztő).
- **Ikonok átrendezése:** tarts nyomva egy ikont: remegni kezdenek, húzással átrendezheted őket, a × jellel eltávolíthatod az appot. Kész: „Kész” gomb vagy az alsó csík.
- **Aurora háttér:** Beállítások → Háttérkép és színek, az utolsó „ÉLŐ” háttér.
- **Nyelv:** Beállítások → Általános → Nyelv (magyar / English). Új nyelv az `i18n.js`-ben adható hozzá.
- **Oldalak:** lapozz oldalra a kezdőképernyőn: balra a **Ma** nézet (widgetek), jobbra az **Alkalmazástár**.
- **Visszalépés:** appban húzz a képernyő bal széléről befelé.
- **Beállító varázsló:** Beállítások → Általános → „Beállító varázsló újra”.
