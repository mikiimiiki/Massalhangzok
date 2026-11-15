// Futtatás: node --test tests/
// Ellenőrzi, hogy a felhőbe (Firebase Realtime Database) csak érvényes kulcs és érték kerülhet fel.
import test from "node:test";
import assert from "node:assert/strict";
import { cleanForCloud, cloudSafe, fixKey } from "../cloudkeys.js";
import { M_LIST, JLY_RAW } from "../words.js";

test("érvénytelen karakterek a kulcsban javításra kerülnek", () => {
  const fixed = [];
  const out = cleanForCloud({ "T1.kerekites": 1, "a$b": 2, "c#d": 3, "e[f]": 4, "g/h": 5, "": 6, ok: { "x.y": true } }, fixed);
  assert.ok(cloudSafe(out));
  assert.equal(out["T1_kerekites"], 1);
  assert.equal(out.ok["x_y"], true);
  assert.equal(fixed.length, 7);
});

test("ütköző javított kulcsok nem írják felül egymást", () => {
  const out = cleanForCloud({ "a.b": 1, "a_b": 2 });
  assert.ok(cloudSafe(out));
  assert.deepEqual(Object.values(out).sort(), [1, 2]);
});

test("undefined, NaN, Infinity és függvény nem kerül fel", () => {
  const out = cleanForCloud({ a: undefined, b: NaN, c: Infinity, d: () => 1, e: 0, f: "", g: false, h: [1, undefined, 3] });
  assert.ok(cloudSafe(out));
  assert.deepEqual(out, { e: 0, f: "", g: false, h: [1, null, 3] });
});

test("a cloudSafe kiszűri a hibás adatot", () => {
  assert.equal(cloudSafe({ "a.b": 1 }), false);
  assert.equal(cloudSafe({ a: undefined }), false);
  assert.equal(cloudSafe({ a: NaN }), false);
  assert.equal(cloudSafe({ a: { b: [1, 2, { c: "x" }] } }), true);
  assert.equal(fixKey("a.b/c"), "a_b_c");
});

test("egy valós szerkezetű játékos minden kulcsa érvényes (szavak, dátumok, jutalmak)", () => {
  const words = [...new Set([...M_LIST, ...JLY_RAW.map(x => x[0])])];
  const srs = Object.fromEntries(words.map(w => [w, { b: 1, days: 1, strong: 0, last: "2026-11-15", due: 20000 }]));
  const daily = { "2026-11-14": 12, "2026-11-15": 3 };
  const user = {
    name: "Kis Anna", pts: 120, avatar: "🦉", practiced: words.slice(0, 5), mistakes: [], badges: ["first"],
    daily, srs, stats: { hosszu: { ok: 3, n: 4 }, szotag: { ok: 1, n: 1 }, tiles: { ok: 0, n: 0 } },
    streak: { n: 2, last: "2026-11-15" }, unl: ["pts:100", "streak:3"], syl: { lvl: 2, hist: [], recent: [], miss: [] }, upd: Date.now()
  };
  assert.ok(cloudSafe(user), "a nyers adatnak is érvényesnek kell lennie");
  const fixed = [];
  assert.ok(cloudSafe(cleanForCloud(user, fixed)));
  assert.deepEqual(fixed, []);
});
