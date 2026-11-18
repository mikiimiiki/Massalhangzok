// Ünnepi események (közös eseménymotor + a Helyesírás Kaland ünnepei). Futtatás: node tests/events.test.mjs
import { inRange, activeEvents, claimOnce, adventState, openWindow, adventDay } from "../js/core/events.js";
import { EVENTS, PLUS_ROUND } from "../js/game/events.js";
import { keyToDay, dayNum, setToday, dateKey } from "../js/core/dates.js";

let fails = 0;
const ok = (c, msg) => { console.log((c ? "✓ " : "✗ ") + msg); if (!c) fails++; };
const D = k => keyToDay(k);
const ids = k => activeEvents(EVENTS, D(k)).map(e => e.id).sort().join(",");
const ev = id => EVENTS.find(e => e.id === id);

// --- dátumtartományok
ok(ids("2026-11-30") === "", "nov. 30.: nincs esemény");
ok(ids("2026-12-06") === "advent2026,santa2026,winter", "dec. 6.: advent + Mikulás + hóesés");
ok(ids("2026-12-25") === "winter,xmas2026", "dec. 25.: az advent véget ért, karácsony tart");
ok(ids("2027-01-01") === "newyear2027,winter" && ids("2027-01-07") === "", "újév; jan. 7-től semmi");
ok(inRange("12-01", "01-06", D("2027-12-15")), "a hóesés évente ismétlődik");
ok(ev("advent2026").windows.length === 24, "24 adventi ablak");

// --- minden ünnepi tárgy szerepel a tárgykatalógusban (ünnepi, különleges tárgyként)
const { itemById } = await import("../js/game/cosmetics-catalog.js");
const items = [...new Set(EVENTS.flatMap(e => [...(e.reward || []), ...(e.windows || []).flatMap(w => w.reward)]).filter(r => r.item && !r.item.startsWith("st:")).map(r => r.item))];
items.forEach(id => ok(itemById(id) && itemById(id).special, `katalógusban (különleges): ${id}`));

// --- egyszeri esemény
{
  const u = { pts: 0, owned: [] }, S = ev("santa2026");
  ok(!claimOnce(u, S, { missionDone: false }, D("2026-12-06")), "Mikulás: napi cél nélkül nem");
  ok(claimOnce(u, S, { missionDone: true }, D("2026-12-06")) && u.owned.includes("av:🎅") && u.pts === 100, "Mikulás: napi cél után 🎅 + 100 pont");
  ok(!claimOnce(u, S, { missionDone: true }, D("2026-12-06")), "Mikulás: csak egyszer");
}
// --- advent és pótlás
{
  const A = ev("advent2026"), u = { pts: 0, owned: [] };
  ok(!openWindow(u, A, 3, { todayOk: false }, D("2026-12-03")), "napi cél előtt a mai ablak nem nyílik");
  ok(openWindow(u, A, 3, { todayOk: true, makeupOk: false }, D("2026-12-03")) && u.pts === 30, "napi cél után kinyílik (+30)");
  ok(!openWindow(u, A, 1, { todayOk: true, makeupOk: false }, D("2026-12-03")), "pótlás plusz kör nélkül nem");
  ok(openWindow(u, A, 1, { todayOk: true, makeupOk: true }, D("2026-12-03")), "plusz kör után egy pótlás");
  ok(!openWindow(u, A, 2, { todayOk: true, makeupOk: true }, D("2026-12-03")), "naponta legfeljebb egy pótlás");
  openWindow(u, A, 13, { todayOk: true }, D("2026-12-13"));
  openWindow(u, A, 24, { todayOk: true }, D("2026-12-24"));
  ok(u.owned.includes("bg:snowy") && u.owned.includes("bg:xmas") && u.owned.includes("av:🎄"), "különleges ablakok: hópelyhes és karácsonyi téma, 🎄 avatar");
  ok(adventDay(A, D("2026-12-25")) === 0 && PLUS_ROUND === 5, "advent vége; plusz kör = 5");
}
setToday(D("2026-12-06")); ok(dateKey(dayNum()) === "2026-12-06", "tesztkapcsoló: szimulált nap"); setToday(null);

console.log(fails ? `\n✗ ${fails} hiba` : "\n✓ Minden teszt rendben");
process.exit(fails ? 1 : 0);
