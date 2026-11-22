# Helyesírás Kaland

Helyesírás-gyakorló alsó tagozatosoknak: hosszú mássalhangzók (rövid vagy hosszú?, betűpótló), j vagy ly, betűkirakó, jelentéskülönbség és szótagolás – szókártyákkal (Leitner-ismétlés), napi küldetéssel, napi nagy céllal és ünnepekkel.

A program a **Matek Űrkalanddal közös vázon** fut (`js/core`, `js/shell`); ebben a repóban csak a helyesírási feladatcsomag és a játék paraméterei sajátok. A közös váz terve: a Matek Űrkaland repó `docs/terv-kozos-vaz.md` fájlja.

## Felépítés

- `js/main.js`: indítás – `startShell({ game: GAME, pack: PACK })`.
- `js/core/`, `js/shell/`, `css/style.css`: a közös váz – forrása a `keretrendszer` repó (`../keretrendszer`); itt nem szerkesztjük, a keret-repóban futtatott `node tools/keret-masolas.mjs ../Massalhangzok` másolja át. A `KERET_VERZIO` rögzíti a verziót, a `tests/keret.test.mjs` jelzi a kézi eltérést. Az `index.html` saját (cím, ikon, a `css/pack.css` betöltése); a keret mintájának változásait kézzel kell átvezetni.
- `js/game/`: a Helyesírás Kaland paraméterei – világos téma, 🦉, ⭐ pont (`config.js`), 12 rang (`ranks.js`), tárgyak (`cosmetics-catalog.js`, az avatarok saját nevükkel), ünnepek (`events.js`), ajándékdobozok (`gifts.js`), adatátállás a régi formátumból (`migrate.js`), Firebase (`firebase-config.js`).
- `js/pack/`: a feladatcsomag – szóadatok (`words.js`), szóelemzés, tippek, szótagolás (`lang.js`), válaszadó felületek (`ui.js`), szókártyák, statisztika, jelvények, küldetésterv és ismétlő kör (`progress.js`), a csomag (`index.js`, benne a ⚙️ Témák fül „Pontok igazítása” eszköze).
- `css/style.css` a közös váz stílusa, `css/pack.css` a feladatok és a világos téma.

## Mit kap a közös váztól

⚙️ füles szülői ablak (Fejlődés, Témák, Hibák, Beállítások, Család, Felhő), gyerekenkénti beállítások, napi küldetés (alapból 10 feladat vagy 15 perc, sorozat heti pajzzsal; utána a „Még egy kör” is 10 feladat) és napi nagy cél (alapból 100 helyes válasz: serlegeső, ajándékdobozok, ×2/×3 szorzó), témazár, egységes pontozás, 12 rangos ranglétra és „Gyűjteményem”, 🎒 Gyűjtemény (szókártyákkal), ünnepek és adventi naptár, szinkronmódok és részleges mentés (csak a változás megy fel; kiesésnél lépcsőzetes újrapróbálkozás), eszközfelismerés, gyorsbillentyűk (Tab, Enter, Esc, F1, ←/→, 1–6, a betűkirakón betűgépelés, választásnál 1–4).

A csomag ezeket kéri a váztól:
- **✍️ A helyes alak beírása** (`retype`): hibás válasz és magyarázat után középen felugrik egy ablak, a gyerek beírja a helyes szót (+1 pont), és csak utána léphet tovább; iPaden magától felugrik a billentyűzet. Gyerekenként: kötelező (alap) / kihagyható / kikapcsolt. A szótagolásnál nincs.
- **🩹 Ismétlő kör** (`review`): ha van hibás vagy ismétlésre esedékes szó, a főképernyőn megjelenik a kártya; j/ly szó j/ly feladatként, a többi „Rövid vagy hosszú?”-ként jön, elsőre jó válasz után lekerül. A kör hossza a „Szabad gyakorlás egy körben” beállítás (alapból 10).

A lépésenkénti súgót **nem** kéri (a helyesírási lépések már az elején elárulnák a választ), ezért itt a ❓ / F1 a feladattípus leírását mutatja.

## Tesztek

```bash
node tests/pack.test.mjs
node tests/events.test.mjs
node tests/keret.test.mjs
```

## Egyéb fájlok

- `szotagolas_ellenorzes.txt`: a szótagolás szólistája ellenőrzéshez; `tools/mta_check.py` a helyesiras.mta.hu elválasztójával veti össze (`python tools/mta_check.py szotagolas_ellenorzes.txt mta.json`).
- `database.rules.json`: a Firebase adatbázis-szabályai; [FIREBASE.md](FIREBASE.md): a felhős mentés adatszerkezete, újrabeállítása és biztonsága.

Dátum szimulálása (külön tesztadatokkal, felhő nélkül): `index.html?nap=2026-12-06#debug`.
