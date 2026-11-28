import assert from 'node:assert/strict';
import { PACK } from '../js/pack/index.js';
import { ACTIVE_WORDS, CATALOG, LONG_WORDS, JLY_WORDS, RULE_WORDS, ruleItem, VOWEL_GROUPS, vowelItem } from '../js/pack/active-words.js';
import { PAIR_TASKS, analyzeWord, sylItems } from '../js/pack/lang.js';
import { M_LIST, WORD_SYNONYMS } from '../js/pack/words.js';
import { makeRng } from '../js/core/rng.js';
import { normalizePack } from '../js/core/pack-contract.js';
const pack = normalizePack(PACK), rng = makeRng(72);
const u = PACK.normUser({ pts: 1234, mistakes: ['kassza', 'tanít', 'fül', 'bútor'], srs: { kassza: { b: 2, days: 3, strong: 1, due: 0 } } });
const snapshot = structuredClone(u.srs);
assert.equal(ACTIVE_WORDS.size, 472);
assert.equal(Object.keys(CATALOG).length, 14);
assert.ok(M_LIST.includes('kassza') && WORD_SYNONYMS.kassza && !ACTIVE_WORDS.has('kassza'));
const covered = new Set();
function check(topic, sub, level) {
  const task = pack.makeTask({ topic, sub, level }, rng, u);
  assert.equal(task.topic, topic, `${topic}: ${sub}`);
  assert.equal(task.sub, sub);
  assert.ok(task.check(task.solution).ok && !task.check('@@@').ok);
  covered.add(String(sub).split('|').pop());
  return task;
}
for (const level of [1, 2, 3]) {
  for (const w of LONG_WORDS) {
    assert.ok(analyzeWord(w).hasLong, w);
    check('hosszu', w, level); check('gap', w, level);
  }
  for (const w of JLY_WORDS) check('jly', w, level);
  // összevont magánhangzó-téma: minden csoport minden szava, csoport|szó alakú sub-bal
  for (const [g, words] of Object.entries(VOWEL_GROUPS)) for (const w of words) {
    const it = vowelItem(g, w), t = check('vowel', `${g}|${w}`, level);
    assert.equal(w.slice(it.start, it.start + it.part.length), it.part);
    assert.equal(t.retype, w); assert.ok(t.rule);
    assert.ok(!t.check(it.other).ok);
  }
}
assert.deepEqual(covered, ACTIVE_WORDS);
for (const [topic, w, expected] of [['vowel', 'bútor', 'ú'], ['endoo', 'cipő', 'ő'], ['enduu', 'kapu', 'u'], ['enduu', 'menü', 'ü'], ['enduu', 'betű', 'ű'], ['endit', 'tanít', 'ít'], ['endul', 'repül', 'ül']]) {
  assert.equal(ruleItem(topic, w).part, expected);
}
assert.equal(analyzeWord('cseppen').longPart, 'pp');
assert.ok(PAIR_TASKS.every(p => ACTIVE_WORDS.has(p.ok)));
assert.ok(sylItems().every(i => ACTIVE_WORDS.has(i.w)));
const mixed = pack.plan(u, 44, rng, pack.topics.map(t => t.id));
assert.equal(new Set(mixed.map(i => i.topic)).size, pack.topics.length);
for (const i of mixed) {
  const t = pack.makeTask(i, rng, u);
  assert.ok(ACTIVE_WORDS.has(t.topic === 'pair' ? t.correctText : t.plainWord || t.word));
  const twin = PACK.twin(t, i, rng);
  if (twin) assert.notEqual(twin.sub, t.sub);
}
assert.equal(pack.plan(u, 5, rng, []).length, 0);
const review = pack.review.plan(u, 10, rng);
assert.ok(review.some(i => i.sub === 'bútor' && i.topic === 'vowel'));
assert.ok(review.some(i => i.sub === 'tanít' && i.topic === 'vowel'), 'az -ít ige az összevont magánhangzó-témában ismétlődik');
assert.ok(review.every(i => ACTIVE_WORDS.has(i.sub)));
assert.ok(ACTIVE_WORDS.has(pack.makeTask({ topic: 'tiles', sub: 'kassza' }, rng, u).word));
assert.deepEqual(u.srs, snapshot);
assert.equal(u.pts, 1234);
console.log('OK: 14 categories, 472 active words, levels 1-3, mixed/review/twin, archived word and progress retention.');
