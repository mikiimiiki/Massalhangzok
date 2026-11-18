# Helyesírás Kaland

Helyesírás-gyakorló alsó tagozatosoknak: hosszú mássalhangzók (rövid vagy hosszú?, betűpótló), j vagy ly, betűkirakó, jelentéskülönbség és szótagolás – szókártyákkal (Leitner-ismétlés), napi küldetéssel, napi nagy céllal és ünnepekkel.

A program a **Matek Űrkalanddal közös vázon** fut (`js/core`, `js/shell`); ebben a repóban csak a helyesírási feladatcsomag és a játék paraméterei sajátok. A közös váz terve: a Matek Űrkaland repó `docs/terv-kozos-vaz.md` fájlja.

## Felépítés

- `js/main.js`: indítás – `startShell({ game: GAME, pack: PACK })`.
- `js/core/`, `js/shell/`: a közös váz (azonos a Matek Űrkalandéval – a `tests/pack.test.mjs` ellenőrzi).
- `js/game/`: a Helyesírás Kaland paraméterei – világos téma, 🦉, ⭐ pont (`config.js`), 12 rang (`ranks.js`), tárgyak (`cosmetics-catalog.js`, a régi jutalmakból), ünnepek (`events.js`), ajándékdobozok (`gifts.js`), adatátállás a régi formátumból (`migrate.js`), Firebase (`firebase-config.js`).
- `js/pack/`: a feladatcsomag – szóadatok (`words.js`), szóelemzés, tippek, szótagolás (`lang.js`), válaszadó felületek (`ui.js`), szókártyák, statisztika, jelvények, küldetésterv (`progress.js`), a csomag (`index.js`).
- `css/style.css` a közös váz stílusa, `css/pack.css` a feladatok és a világos téma.

## Mit kap a közös váztól

⚙️ füles szülői ablak (Fejlődés, Témák, Hibák, Beállítások, Család, Felhő), gyerekenkénti beállítások, napi küldetés (sorozat heti pajzzsal) és napi nagy cél (alapból 100 helyes válasz: serlegeső, ajándékdobozok, ×2/×3 szorzó), témazár, egységes pontozás, 12 rangos ranglétra és szekrény, 🎒 Gyűjtemény (szókártyákkal), ünnepek és adventi naptár, szinkronmódok és részleges mentés, eszközfelismerés, gyorsbillentyűk (Tab, Enter, Esc, F1, ←/→, 1–6, a betűkirakón betűgépelés, választásnál 1–4).

## Tesztek

```bash
node tests/pack.test.mjs
node tests/events.test.mjs
node --test tests/firebase-keys.test.mjs
```

Dátum szimulálása (külön tesztadatokkal, felhő nélkül): `index.html?nap=2026-12-06#debug`.
