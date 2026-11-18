// A Helyesírás csomag a közös vázon: feladatok, témazár, szókártyák, régi adatok átállítása.
// Futtatás: node tests/pack.test.mjs
globalThis.document = { querySelector: () => null };
const { PACK } = await import("../js/pack/index.js");
const { makeRng } = await import("../js/core/rng.js");
const { newUser, normUser } = await import("../js/shell/user.js");
const { GAME, SETTINGS } = await import("../js/game/config.js");
const { migrateFamily, migrateUser } = await import("../js/game/migrate.js");
const { isMastered } = await import("../js/pack/progress.js");
const { setToday, keyToDay } = await import("../js/core/dates.js");
const { score } = await import("../js/core/scoring.js");
const { readFileSync, readdirSync } = await import("fs");

let fails = 0;
const ok = (c, msg) => { console.log((c ? "✓ " : "✗ ") + msg); if (!c) fails++; };
const rng = makeRng(7);

// --- minden feladat elfogadja a saját helyes válaszát, és van tipp, magyarázat
for (const L of [1, 2, 3]) {
  const u = PACK.normUser(newUser("A", "🦉", PACK)); u.prefs = { level: L };
  let bad = [];
  PACK.topics.forEach(T => { for (let i = 0; i < 250; i++) { const t = PACK.makeTask({ topic: T.id, sub: null }, rng, u); if (!t.check(t.solution).ok || !t.hint || !t.steps.length || !t.q || t.check("@@@").ok) bad.push(`${T.id}:${t.sub}`); } });
  ok(!bad.length, `${L}. szint: 6 téma × 250 feladat – mind elfogadja a jó választ, és elutasítja a rosszat` + (bad.length ? " " + bad.slice(0, 5) : ""));
}
// --- küldetésterv és témazár
{
  const u = PACK.normUser(newUser("B", "🦉", PACK));
  const plan = PACK.plan(u, 10, rng, null);
  ok(plan.length === 10 && new Set(plan.map(p => p.topic)).size >= 3, "a vegyes kaland 10 feladat, legalább 3 féle");
  const p2 = PACK.plan(u, 10, rng, ["jly", "tiles"]);
  ok(p2.every(p => ["jly", "tiles"].includes(p.topic)), "témazár: csak a nyitott feladatok kerülnek a tervbe");
}
// --- szókártya: 3 különböző napon jó, legalább egyszer nehezebb feladatban → elsajátítva
{
  const u = PACK.normUser(newUser("C", "🦉", PACK));
  ["2026-11-01", "2026-11-03", "2026-11-05"].forEach((d, i) => { setToday(keyToDay(d)); PACK.record(u, { topic: i === 2 ? "tiles" : "hosszu", word: "kassza", level: 1 }, 1); });
  setToday(null);
  ok(isMastered(u.srs.kassza) && u.stats.hosszu.ok === 2 && u.stats.tiles.ok === 1, "kassza: 3 nap, betűkirakóval is → szókártya");
  PACK.record(u, { topic: "hosszu", word: "kassza", level: 1 }, 0);
  ok(!isMastered(u.srs.kassza) && u.mistakes.includes("kassza") && u.srs.kassza.miss === 1, "hibás válasz: visszaesik, a hibás szavak közé kerül");
}
// --- egységes pontozás a betűkirakónál (segítség −3, de legalább 2)
ok(score({ r: 1, level: 1, helps: 1 }).pts === 7 && score({ r: 2, level: 1, helps: 2 }).pts === 2, "betűkirakó segítséggel: kevesebb pont, de legalább 2");

// --- régi (v4) adat átállítása
{
  const state = { familyCode: "", current: "Lili", users: {}, deleted: {}, settings: { level: 2, autoNext: true, dyslexia: true, goal: 15, events: true, snow: false } };
  const old = { pts: 1234, avatar: "🦖", mastered: [], practiced: ["kassza"], mistakes: ["fejjel"], daily: { "2026-11-16": 22, "2026-11-17": 8 },
    srs: { kassza: { b: 2, days: 3, strong: 1, last: "2026-11-16", due: 1 } }, stats: { hosszu: { ok: 30, n: 40 } }, streak: { n: 4, last: "2026-11-17" }, best: 9,
    badges: ["first", "streak3"], unl: ["avatar:🦖", "theme:ocean"], theme: "ocean", owned: ["avatar:🎅"], p100: { day: "2026-11-17", n: 40 }, mult: { v: 2, day: "2026-11-17" },
    bonus: { day: "2026-11-18", n: 10 }, gift: { due: "2026-11-16", picked: "kissMom" }, giftLog: [{ d: "2026-11-16", id: "kissMom" }], block: { perm: true, topics: ["pair"] },
    hist: { "2026-11-16": { hosszu: { ok: 20, n: 25 } } }, syl: { lvl: 3, hist: [], recent: [], miss: [] }, grade: 4, upd: 5 };
  migrateFamily(state);
  ok(state.settings.childDefaults.level === 2 && state.settings.childDefaults.goalTasks === 15 && state.settings.childDefaults.dyslexia === true && state.settings.childDefaults.snow === false && state.settings.childDefaults.bigGoal === 100, "családi beállítások → alapértékek");
  const u = migrateUser(normUser({ ...JSON.parse(JSON.stringify(old)), name: "Lili" }, PACK), state);
  ok(u.schema === 4 && u.pts === 1234 && u.srs.kassza.days === 3 && u.stats.hosszu.ok === 30 && u.syl.lvl === 3, "pont, szókártyák, statisztika, szótagolás megmaradt");
  ok(u.days["2026-11-16"].ok === 22 && u.days["2026-11-16"].n === 25 && u.days["2026-11-16"].done && !u.days["2026-11-17"].done, "napi helyes válaszok → napi összesítő (a cél szerint teljesítve)");
  ok(u.streak.n === 4 && u.streak.last === keyToDay("2026-11-17") && u.streak.best === 9, "sorozat átalakítva (napsorszám, legjobb)");
  ok(u.goal.big.n === 40 && u.goal.mult.v === 2 && u.goal.bonus.n === 10 && u.goal.gift.picked === "kissMom" && u.goal.giftLog.length === 1, "napi 100: állás, szorzó, előleg, ajándék megmaradt");
  ok(["av:🦖", "bg:ocean", "av:🎅"].every(x => u.owned.includes(x)) && u.cosmetics.bg === "bg:ocean", "kinyitott tárgyak és a téma a szekrényben");
  ok(u.block.topics[0] === "pair" && u.badges.includes("s3") && !u.badges.includes("streak3") && u.prefs.level === 2, "témazár, jelvények, gyerekenkénti beállítás");
  const again = JSON.stringify(u); migrateUser(u, state);
  ok(JSON.stringify(u) === again, "többször futtatva sem változik");
}
// --- a beállítások: a csomag saját beállításai a Gyakorlás csoportban
ok(SETTINGS.some(d => d.key === "level" && d.group === "play") && GAME.defaults.bigGoal === 100, "szint és évfolyam a beállítások között; napi nagy cél: 100");
// --- a közös váz és keret azonos a Matek Űrkalandéval (ha a Matek repó a szomszéd mappában van)
{
  const other = new URL("../../Felvételi_matek/js/", import.meta.url), diff = [];
  try {
    ["core", "shell"].forEach(d => readdirSync(new URL(`../js/${d}/`, import.meta.url)).forEach(f => {
      if (readFileSync(new URL(`../js/${d}/${f}`, import.meta.url), "utf8") !== readFileSync(new URL(`${d}/${f}`, other), "utf8")) diff.push(`${d}/${f}`);
    }));
    ok(!diff.length, "a js/core és js/shell megegyezik a Matek Űrkalandéval" + (diff.length ? ": " + diff.join(", ") : ""));
  } catch { console.log("– a Matek repó nincs a szomszéd mappában, az összevetés kimarad"); }
}

console.log(fails ? `\n✗ ${fails} hiba` : "\n✓ Minden teszt rendben");
process.exit(fails ? 1 : 0);
