// Jelentések, súgó, mondatpárok és az új szabálytémák (hiányzó rész) – az aktív szólistára
import assert from "node:assert/strict";
const { ACTIVE_WORDS, VOWEL_GROUPS, vowelItem } = await import("../js/pack/active-words.js");
const { getSynonymsForWord, PAIR_TASKS, PAIR_WHY } = await import("../js/pack/lang.js");
const { PACK } = await import("../js/pack/index.js");
const { normalizePack } = await import("../js/core/pack-contract.js");
const { makeRng } = await import("../js/core/rng.js");

// 1) minden aktív szónak van jelentése, és a feladat közben látható súgó nem tartalmazza magát a szót
const words = [...ACTIVE_WORDS];
const fallback = words.filter(w => /Keresd meg|Gondolj a szó jelentésére/.test(getSynonymsForWord(w)));
assert.deepEqual(fallback, [], "jelentés nélküli szavak");
const leaks = words.filter(w => getSynonymsForWord(w).toLowerCase().includes(w.toLowerCase()));
assert.deepEqual(leaks, [], "a súgó elárulja a szót");

// 2) mondatpárok: a helyes válasz aktív szó, a két alak különbözik, van magyarázat, a mondatban egy hely van
assert.ok(PAIR_TASKS.length >= 12, "legalább 12 mondatpár");
for (const p of PAIR_TASKS) {
  assert.ok(ACTIVE_WORDS.has(p.ok), p.ok); assert.notEqual(p.ok, p.bad);
  assert.ok(PAIR_WHY[p.ok], "magyarázat: " + p.ok); assert.equal(p.s.split("___").length, 2, p.s);
  assert.ok(!/hosszú [a-z]{2}|rövid [a-z]/i.test(p.hint) && !p.hint.toLowerCase().includes(p.ok.toLowerCase()), "a súgó elárulja: " + p.hint);
}

// 3) az összevont „Magánhangzók: hosszú vagy rövid?” téma: a keret „hiányzó rész” felülete, a jelentés a kérdésben,
//    a megoldás a pótolandó rész, a „miért” címke (📏 szabály / ⚠️ kivétel / 🧠 meg kell jegyezni) a tippben és jó válasz után
const pack = normalizePack(PACK), user = { words: {}, prefs: {}, srs: {} };
const KIND = { stemLong: "🧠", stemShort: "🧠", endoo: "📏", enduuLong: "📏", enduuShort: "⚠️", endit: "📏", endul: "📏" };
for (const [g, list] of Object.entries(VOWEL_GROUPS)) for (const w of list) for (const level of [1, 2, 3]) {
  const t = pack.makeTask({ topic: "vowel", sub: `${g}|${w}`, level }, makeRng(level), user), it = vowelItem(g, w);
  assert.equal(t.answer.kind, "gap", `${g}/${w}`);
  assert.equal(t.answer.input === "text", level === 3, `${g}/${w}/${level}`);
  assert.equal(t.solution, it.part); assert.equal(t.correctText, w);
  assert.ok(t.check(it.part).ok); assert.ok(!t.check(it.other).ok);
  assert.ok(t.q.includes("Jelentése"), `${g}/${w}: a jelentés a kérdésben`);
  assert.equal(t.answerText(it.part), w);
  assert.ok(t.rule.startsWith(KIND[g]) && t.hint === t.rule, `${g}/${w}: miért-címke`);
  if (level === 2) assert.ok(t.answer.options.length >= 2 && t.answer.options.includes(it.part));
}
// rövid helyes válasz is van (nem kitalálható): a csoportok kb. 40%-a rövid
const short = ["stemShort", "enduuShort", "endul"].reduce((a, g) => a + 1, 0) / Object.keys(VOWEL_GROUPS).length;
assert.ok(short > 0.35 && short < 0.5);
assert.ok(VOWEL_GROUPS.stemShort.length >= 25, "elég rövid ellenpélda");
// régi témaazonosítók és sima szavak (ismétlésből) is működnek
for (const [topic, sub] of [["endit", "tanít"], ["endoo", "cipő"], ["vowel", "ujj"], ["enduu", null]]) assert.equal(PACK.makeTask({ topic, sub, level: 1 }, makeRng(1), user).topic, "vowel");

// 4) ikerfeladat: ugyanaz a csoport (a szótőnél ugyanaz a magánhangzó is)
for (const sub of ["stemLong|bútor", "stemShort|ujj", "endoo|cipő", "enduuShort|kapu", "enduuLong|betű", "endit|tanít", "endul|repül"]) {
  for (let s = 1; s <= 8; s++) {
    const t = pack.makeTask({ topic: "vowel", sub, level: 1 }, makeRng(s), user);
    const it = pack.twin(t, { topic: "vowel" }, makeRng(s + 50), user), [g1, w1] = sub.split("|"), [g2, w2] = it.sub.split("|");
    assert.equal(g2, g1, `${sub} → ${it.sub}`); assert.notEqual(w2, w1);
    if (g1.startsWith("stem")) assert.equal(vowelItem(g2, w2).part, vowelItem(g1, w1).part, `${sub} → ${it.sub}`);
  }
}
console.log(`Jelentések és új témák: ${words.length} szó, ${PAIR_TASKS.length} mondatpár – rendben.`);
