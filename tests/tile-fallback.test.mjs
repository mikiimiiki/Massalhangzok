import assert from 'node:assert/strict';
import { PACK } from '../js/pack/index.js';
import { normalizePack } from '../js/core/pack-contract.js';
import { makeRng } from '../js/core/rng.js';
const pack = normalizePack(PACK);
for (const word of ['bútor', 'héja', 'kapu', 'tanít', 'repül', 'betű']) {
  const task = pack.makeTask({topic:'hosszu',sub:word}, makeRng(1), {words:{},prefs:{}});
  assert.equal(task.topic,'tiles',word); assert.ok(pack.topicFallbacks.hosszu.includes(task.topic));
  assert.ok(task.check(word).ok); assert.ok(!task.check(word+'x').ok);
}
// Ikerfeladat: másik szó, ugyanarra a szabályra (pl. ugyanaz a hosszú betűkapcsolat)
import { analyzeWord } from '../js/pack/lang.js';
let checked = 0;
for (const topic of ['gap', 'hosszu', 'jly', 'tiles']) for (let s = 1; s <= 40; s++) {
  const t = pack.makeTask({ topic, sub: null }, makeRng(s), { words: {}, prefs: {} });
  const it = PACK.twin(t, { topic }, makeRng(s + 1), {});
  if (!it) continue; // Some spellings have no other word with the same pattern.
  const t2 = pack.makeTask(it, makeRng(s + 2), { words: {}, prefs: {} });
  checked++;
  assert.notEqual(t2.sub, t.sub);
  if (topic === 'gap') assert.equal(analyzeWord(t2.sub).longPart.toLowerCase(), analyzeWord(t.sub).longPart.toLowerCase());
}
assert.ok(checked > 0);
console.log(`OK: ${checked} matching alternate words checked`);
