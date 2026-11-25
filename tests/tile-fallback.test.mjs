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
