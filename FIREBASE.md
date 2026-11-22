# Felhős mentés – beállítás és biztonság

A Helyesírás Kaland felhős mentése **már be van állítva**: a Firebase-projekt neve `helyesiras-kaland`, a beállítások a [js/game/firebase-config.js](js/game/firebase-config.js) fájlban vannak. Ezt a leírást akkor kell követni, ha a projektet újra kell létrehozni, vagy egy másik Firebase-projektre kell átköltözni.

Felhő nélkül az app **helyi módban** működik: minden adat csak abban a böngészőben van, ahol a gyerek gyakorol. A felhővel a szülő **Google-fiókkal** lép be, és minden eszközön ugyanaz az állás látszik. A másik szülő is beléphet a saját Google-fiókjával.

A felépítés ugyanaz, mint a Matek Űrkalandnál (a felhőkezelés a közös keretben van: `js/core/cloud.js`), de a két app **külön Firebase-projektet** használ, hogy az adataik ne keveredjenek.

## Adatszerkezet (Realtime Database)

```
families/{családkód}/members/{e-mail}     = true   ← a pont vesszőre cserélve (pl. anna,kiss@gmail,com)
families/{családkód}/users/{játékos}      = {…}    ← a játékos adatai (csak a változott mezők mennek fel)
families/{családkód}/logs/{játékos}/{idő} = {…}    ← hibanapló, külön ágon (a ⚙️ Hibák fül tölti le)
families/{családkód}/settings             = {…}    ← családi beállítások
families/{családkód}/parent               = {salt, hash}   ← a szülői PIN sózott hash-e
families/{családkód}/deleted/{játékos}    = {name, ts}     ← törlési jelölő (más eszközön se jöjjön vissza)
families/{családkód}/devices/{eszköz}     = {…}    ← eszközök: név, utoljára látva, ki játszhat rajta, forgalom
memberOf/{e-mail}/{családkód}             = true   ← ebből tudja egy új eszköz, melyik a családod
```

## Újrabeállítás (kb. 15 perc)

1. **Projekt:** <https://console.firebase.google.com> → *Add project*. A Google Analytics nem kell.
2. **Webalkalmazás:** a projekt kezdőlapján a **`</>`** (Web) ikon. A „Firebase Hosting” maradjon üresen (GitHub Pages-en fut). A megjelenő `firebaseConfig` értékeit másold a [js/game/firebase-config.js](js/game/firebase-config.js) fájlba.
3. **Google-belépés:** *Build → Authentication → Get started → Sign-in method → Google → Enable*, majd *Settings → Authorized domains → Add domain*: `mikiimiiki.github.io` (a `localhost` alapból szerepel).
4. **Adatbázis:** *Build → Realtime Database → Create database*, helyszín **Belgium (europe-west1)**, **locked mode**. Az adatbázis címét írd a `databaseURL` mezőbe. A *Rules* fülön másold be a [database.rules.json](database.rules.json) tartalmát, és *Publish*.
5. **Feltöltés és első belépés:** töltsd fel a módosított `js/game/firebase-config.js`-t a GitHub-repóba, majd az appban: **☁️ → Belépés Google-lel → Család létrehozása**. Az ezen az eszközön lévő eredmények ekkor feltöltődnek.
6. **Másik szülő:** ☁️ → *Másik szülő hozzáadása* – a Google-fiókja e-mail-címével. Ő belépés után ugyanazt a családot látja. A többi eszközön elég egyszer belépni.

Átköltözéskor a régi projektből a családot a *Realtime Database → ⋮ → Export JSON* / *Import JSON* paranccsal lehet átvinni.

## Biztonság

- A család adatait csak a családhoz hozzáadott, **ellenőrzött e-mail-című** Google-fiókok olvashatják és írhatják (`database.rules.json`). A családkód önmagában nem ad hozzáférést.
- A gyereknek nincs saját fiókja; csak a nevét, az avatarját és a gyakorlási eredményeit tároljuk.
- A szülői PIN-t nem tároljuk, csak a sózott hash-ét (PBKDF2).
- Az `apiKey` nem titkos, nyugodtan lehet a nyilvános repóban. A védelmet az adatbázis szabályai adják.

## Költség

A Spark (ingyenes) csomag egy család használatához bőven elég, bankkártyát nem kell megadni. A forgalmat és a becsült Spark-felhasználást a ⚙️ → ☁️ Felhő fül mutatja.
