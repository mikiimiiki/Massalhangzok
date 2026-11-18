// ===== Adat-átállás: a régi Helyesírás Kaland (v4) → közös váz (schema 4) =====
// Egyszer fut, többször lefuttatva sem változtat semmin. Amit a program nem ismer, azt nem törli
// (a szókártyák, a statisztika és a szótagolás a helyén marad).
//  - családi beállítások (szint, napi cél, diszlexia, ünnepek) → családi alapérték + gyerekenkénti beállítás
//  - u.daily[nap] (helyes válaszok) → u.days[nap] { n, ok, done }
//  - u.streak { n, last: "ÉÉÉÉ-HH-NN" } → { n, last: napsorszám, best }
//  - napi 100: u.p100 / mult / bonus / gift / giftLog → u.goal { big, mult, bonus, gift, giftLog }
//  - kinyitott jutalmak (u.unl) és a téma (u.theme) → u.owned ("av:…", "bg:…") és u.cosmetics.bg
//  - feladatzár (u.block, ha tartós) → u.block { topics }
//  - jelvények: streak3/streak7 → s3/s7
import { defaultsFor } from "../core/settings.js";
import { keyToDay } from "../core/dates.js";
import { SETTINGS } from "./config.js";

export const SCHEMA = 4;
export function idFromName(name) {
  let h = 0x811c9dc5;
  for (const ch of String(name)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return "c" + h.toString(16).padStart(8, "0");
}
// függvénydeklaráció: a config.js ↔ migrate.js körkörös importban is azonnal elérhető
export function newId() { return "c" + [...crypto.getRandomValues(new Uint8Array(4))].map(b => b.toString(16).padStart(2, "0")).join(""); }
const arr = x => Array.isArray(x) ? x : Object.values(x || {});
const clone = x => JSON.parse(JSON.stringify(x ?? null));

export function migrateFamily(state) {
  const s = (state.settings = state.settings || {});
  if (!s.childDefaults) {
    const d = defaultsFor(SETTINGS, "child");
    if (s.level) d.level = +s.level;
    if (s.goal) d.goalTasks = Math.max(3, Math.min(40, +s.goal));
    if (s.dyslexia != null) d.dyslexia = !!s.dyslexia;
    if (s.events != null) d.events = s.events !== false;
    if (s.snow != null) d.snow = s.snow !== false;
    s.childDefaults = d;
  }
  if (!Array.isArray(s.rewards)) s.rewards = arr(s.rewards);
  return state;
}

export function migrateUser(u, state) {
  if (!u) return u;
  const fam = (state && state.settings) || {}, goalN = (fam.childDefaults || {}).goalTasks || 10;
  if (!u.id) u.id = idFromName(u.name);
  if (!u.prefs) u.prefs = clone(fam.childDefaults || defaultsFor(SETTINGS, "child"));
  if (!Array.isArray(u.rewards)) u.rewards = arr(u.rewards);
  if ((u.schema || 0) < SCHEMA) {
    // napi helyes válaszok → napi összesítő
    u.days = u.days || {};
    Object.entries(u.daily || {}).forEach(([k, ok]) => {
      if (u.days[k]) return;
      const h = (u.hist || {})[k] || {}, n = Object.values(h).reduce((a, x) => a + (+x.n || 0), 0);
      u.days[k] = { n: Math.max(n, +ok || 0), ok: +ok || 0, ms: 0, done: (+ok || 0) >= goalN };
    });
    // sorozat
    const st = u.streak || {};
    if (typeof st.last === "string") u.streak = { n: +st.n || 0, last: st.last ? keyToDay(st.last) : -1, best: Math.max(+u.best || 0, +st.n || 0) };
    // napi 100 → napi nagy cél
    u.goal = u.goal && typeof u.goal === "object" ? u.goal : {};
    if (u.p100 && !u.goal.big) u.goal.big = { day: u.p100.day, n: +u.p100.n || 0 };
    if (u.mult && typeof u.mult === "object" && !u.goal.mult) u.goal.mult = { day: u.mult.day, v: +u.mult.v || 1 };
    if (u.bonus && !u.goal.bonus) u.goal.bonus = { day: u.bonus.day, n: +u.bonus.n || 0 };
    if (u.gift && !u.goal.gift) u.goal.gift = { due: u.gift.due, picked: u.gift.picked || "" };
    if (u.giftLog && !u.goal.giftLog) u.goal.giftLog = arr(u.giftLog);
    // kinyitott jutalmak és téma → szekrény
    const owned = new Set(arr(u.owned).map(x => String(x).replace(/^avatar:/, "av:").replace(/^theme:/, "bg:")));
    arr(u.unl).forEach(k => owned.add(String(k).replace(/^avatar:/, "av:").replace(/^theme:/, "bg:")));
    if (u.avatar) owned.add("av:" + u.avatar);
    u.owned = [...owned];
    u.cosmetics = u.cosmetics || { avatar: u.avatar };
    if (u.theme && !u.cosmetics.bg) u.cosmetics.bg = "bg:" + u.theme;
    // feladatzár: csak a tartós zár marad meg
    if (u.block && !Array.isArray(u.block.topics)) u.block = u.block.perm ? { topics: arr(u.block.topics) } : null;
    else if (u.block && u.block.perm === false) u.block = null;
    // jelvények
    u.badges = [...new Set(arr(u.badges).map(b => ({ streak3: "s3", streak7: "s7" }[b] || b)))];
    u.log = arr(u.log);
    u.schema = SCHEMA;
  }
  return u;
}
