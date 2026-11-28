# Felhős mentés – beállítás és biztonság

A Helyesírás Kaland felhős mentése a **közös `learn` Firebase-projekten** fut (`learn-18d3f`, Realtime Database, Belgium / europe-west1), ugyanazon, mint a többi gyakorló játék. A projekt adatai a közös keretben vannak (`js/core/firebase-learn.js`), a [js/game/firebase-config.js](js/game/firebase-config.js) csak átveszi őket. A játék saját ága a felhőben `apps/helyesiras` (a [js/game/config.js](js/game/config.js) `cloudApp` mezője – ezt nem szabad megváltoztatni). A helyi mentési kulcs `helyesiras_kaland_v4`.

A szülő **Google-fiókkal** lép be, és minden eszközön ugyanaz az állás látszik. A család közös: ha egy másik gyakorlóban már létrehoztátok, itt elég belépni, és a játék magától megtalálja. Felhő nélkül (üres `apiKey`) az app **helyi módban** működik.

## Adatszerkezet (Realtime Database)

```
memberOf/{e-mail}/{családkód}                       = true   ← közös: ebből tudja egy új eszköz vagy játék, melyik a családod
families/{családkód}/members/{e-mail}               = true   ← közös: a szülők (a pont vesszőre cserélve, pl. anna,kiss@gmail,com)
families/{családkód}/parent                         = {salt, hash}   ← közös szülői PIN (sózott hash)
families/{családkód}/apps/helyesiras/users/{játékos}      = {…}    ← a játékos adatai (csak a változott mezők mennek fel)
families/{családkód}/apps/helyesiras/logs/{játékos}/{idő} = {…}    ← hibanapló (a ⚙️ Hibák fül tölti le)
families/{családkód}/apps/helyesiras/settings             = {…}    ← a játék családi beállításai
families/{családkód}/apps/helyesiras/deleted/{játékos}    = {name, ts}     ← törlési jelölő
families/{családkód}/apps/helyesiras/devices/{eszköz}     = {…}    ← eszközök: név, utoljára látva, ki játszhat rajta, forgalom
```

## Átköltözés a régi `helyesiras-kaland` projektből

1. A régi projektből biztonsági mentés: *Realtime Database → Data → ⋮ → Export JSON*.
2. Az új változat megnyitása után a legfrissebb eszközön: **☁️ → Belépés Google-lel**. Ha a család még nincs meg a learn-projektben (ez az első játék), **Család létrehozása**, majd *Másik szülő hozzáadása*. Ha már megvan, a játék magától átveszi.
3. A helyben tárolt eredmények feltöltődnek a játék saját ágára. A többi eszközön elég egyszer belépni; az ottani helyi adatot az app összefésüli (a frissebb nyer).
4. Az eszközlista és a havi forgalom újraindul. A régi projektet néhány hét múlva törölni lehet (*Project settings → Delete project*).

## A learn-projekt beállításai (ha újra kellene létrehozni)

1. <https://console.firebase.google.com> → *Add project*, Google Analytics nélkül. Webalkalmazás a **`</>`** ikonnal (Hosting nélkül); a `firebaseConfig` a keret `js/core/firebase-learn.js` fájljába kerül.
2. *Authentication → Sign-in method → Google → Enable*, majd *Settings → Authorized domains*: `vargamiki.github.io`.
3. *Realtime Database → Create database*, **Belgium (europe-west1)**, **locked mode**; a *Rules* fülön a [database.rules.json](database.rules.json) tartalma, *Publish*.

## Biztonság

- A család adatait csak a családhoz hozzáadott, **ellenőrzött e-mail-című** Google-fiókok olvashatják és írhatják (`database.rules.json`, a keretből jön). A családkód önmagában nem ad hozzáférést.
- A gyereknek nincs saját fiókja; csak a nevét, az avatarját és a gyakorlási eredményeit tároljuk.
- A szülői PIN-t nem tároljuk, csak a sózott hash-ét (PBKDF2).
- Az `apiKey` nem titkos, nyugodtan lehet a nyilvános repóban. A védelmet az adatbázis szabályai adják.

## Költség

A Spark (ingyenes) csomag egy családnak az összes gyakorlóval együtt is bőven elég (1 GB tárhely, havi 10 GB letöltés, 100 egyidejű kapcsolat). A forgalmat a ⚙️ → ☁️ Felhő fül mutatja.
