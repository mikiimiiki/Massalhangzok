import assert from 'node:assert/strict';
import { PACK } from '../js/pack/index.js';
import { normalizePack } from '../js/core/pack-contract.js';
import { makeRng } from '../js/core/rng.js';
const pack = normalizePack(PACK);
for (const word of ['méh','puha','héja','új','lila','nini']) {
  const task = pack.makeTask({topic:'hosszu',sub:word}, makeRng(1), {words:{},prefs:{}});
  assert.equal(task.topic,'tiles',word); assert.ok(pack.topicFallbacks.hosszu.includes(task.topic));
  assert.ok(task.check(word).ok); assert.ok(!task.check(word+'x').ok);
}
console.log('OK: 6/6 magyar tartalekag');
// Ikerfeladat: másik szó, ugyanarra a szabályra (pl. ugyanaz a hosszú betűkapcsolat)
import { analyzeWord } from '../js/pack/lang.js';
let same = 0, n = 0;
for (const topic of ['gap', 'hosszu', 'jly', 'tiles']) for (let s = 1; s <= 40; s++) {
  const t = pack.makeTask({ topic, sub: null }, makeRng(s), { words: {}, prefs: {} });
  const it = pack.twin(t, { topic }, makeRng(s + 1), {}), t2 = pack.makeTask(it, makeRng(s + 2), { words: {}, prefs: {} });
  n++; if (t2.sub === t.sub) same++;
  if (topic === 'gap' && t.topic === 'gap') assert.equal(analyzeWord(t2.sub).longPart.toLowerCase(), analyzeWord(t.sub).longPart.toLowerCase(), t.sub + ' → ' + t2.sub);
}
assert.ok(same <= 2, `ikerfeladat ugyanaz a szó: ${same}/${n}`);
console.log(`OK: ikerfeladat másik szó (${n - same}/${n})`);
