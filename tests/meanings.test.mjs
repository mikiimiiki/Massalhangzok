// Jelentések, súgó, mondatpárok és az új szabálytémák (hiányzó rész) – az aktív szólistára
import assert from "node:assert/strict";
const { ACTIVE_WORDS, RULE_WORDS, CATALOG, ruleItem } = await import("../js/pack/active-words.js");
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

// 3) az új szabálytémák: a keret „hiányzó rész” felülete, a jelentés a kérdésben, a megoldás a pótolandó rész
const pack = normalizePack(PACK), user = { words: {}, prefs: {}, srs: {} };
for (const topic of Object.keys(RULE_WORDS)) for (const w of RULE_WORDS[topic]) for (const level of [1, 2, 3]) {
  const t = pack.makeTask({ topic, sub: w, level }, makeRng(level), user), r = ruleItem(topic, w);
  assert.equal(t.answer.kind, "gap", `${topic}/${w}`);
  assert.equal(t.answer.input === "text", level === 3, `${topic}/${w}/${level}`);
  assert.equal(t.solution, r.part); assert.equal(t.correctText, w);
  assert.ok(t.check(r.part).ok); assert.ok(!t.check(r.other).ok);
  assert.ok(t.q.includes("Jelentése"), `${topic}/${w}: a jelentés a kérdésben`);
  assert.equal(t.answerText(r.part), w);
  if (level === 2) assert.ok(t.answer.options.length >= 2 && t.answer.options.includes(r.part));
}

// 4) ikerfeladat: ugyanaz a szabály (ugyanaz a pótolandó rész, a kivétel kivétellel)
for (const [topic, w] of [["vowel", "bútor"], ["endoo", "cipő"], ["enduu", "kapu"], ["enduu", "betű"], ["endit", "tanít"], ["endul", "repül"], ["endul", "tanul"]]) {
  for (let s = 1; s <= 8; s++) {
    const t = pack.makeTask({ topic, sub: w, level: 1 }, makeRng(s), user);
    const it = pack.twin(t, { topic }, makeRng(s + 50), user), r1 = ruleItem(topic, w), r2 = ruleItem(topic, it.sub);
    assert.notEqual(it.sub, w); assert.equal(r2.part, r1.part, `${w} → ${it.sub}`);
    assert.equal(CATALOG.shortuu.includes(it.sub), CATALOG.shortuu.includes(w), `${w} → ${it.sub}`);
  }
}
console.log(`Jelentések és új témák: ${words.length} szó, ${PAIR_TASKS.length} mondatpár – rendben.`);
