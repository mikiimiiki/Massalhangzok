// ===== Helyesírás csomag: szókártyák (Leitner + elsajátítás), témastatisztika, jelvények, küldetésterv =====
// DOM nélkül. Az általános részek (pont, napi összesítő, sorozat, napi cél) a közös keretben vannak.
import { dayNum, dateKey } from "../core/dates.js";
import { M_UNIQUE, JLY_LIST, JLY_MAP, ALL_UNIQUE_WORDS, PAIR_TASKS, analyzeWord, analyzeJlyWord, shuffle, sylState, sylQueue, sylAdapt, SYL_LVL_NAMES } from "./lang.js";

export const INTERVALS = [1, 1, 3, 7, 14]; // Leitner-dobozok: ennyi nap múlva jön vissza a szó
export const REFRESH = [30, 60, 90];       // elsajátítás után ennyi nap múlva jön vissza
// Egy szó akkor lesz szókártya, ha 3 különböző napon jó volt, és legalább egyszer nehezebb feladatban is
export const isMastered = r => !!r && r.days >= 3 && (r.strong || 0) >= 1;
export const masteredCount = u => Object.values(u.srs || {}).filter(isMastered).length;
export const dueWords = (u, t = dayNum()) => [...new Set([...(u.mistakes || []), ...Object.keys(u.srs || {}).filter(w => u.srs[w].due <= t)])].filter(w => ALL_UNIQUE_WORDS.has(w));
export const okOf = (u, k) => ((u.stats || {})[k] && u.stats[k].ok) || 0;
export const levelPref = u => Math.min(3, Math.max(1, +((u.prefs || {}).level) || 1));

// A feladat szintje: a szülő által beállított szint, de az elsajátításhoz/frissítéshez legalább 2. szint kell
export function effLevel(u, w) {
  const r = w && (u.srs || {})[w];
  const need = r && (isMastered(r) || (r.days >= 3 && !r.strong));
  return Math.max(levelPref(u), need ? 2 : 1);
}

// Szavak választása: az esedékesek elöl, a legutóbb kérdezettek hátrébb (egy körön belül ne ismétlődjön)
const recent = [];
export function pickWords(list, n, u) {
  const due = new Set(dueWords(u)), seen = new Set(recent);
  const order = [...shuffle(list.filter(w => due.has(w) && !seen.has(w))), ...shuffle(list.filter(w => !due.has(w) && !seen.has(w))), ...shuffle(list.filter(w => seen.has(w)))];
  const out = order.slice(0, n);
  recent.push(...out); trim();
  return out;
}
function trim() { if (recent.length > 40) recent.splice(0, recent.length - 40); }
// Egy feladat a témából (szabad gyakorlás, feladatonként választva)
// A legrégebben kérdezett elem (amit még nem kérdeztünk, az elöl; egyenlőségnél véletlenszerű).
// Ha minden elem szerepel a legutóbbiak között (pl. csak 16 jelentéskülönbség-mondat van), nem az első jön mindig.
const leastRecent = (items, key) => shuffle(items).map(x => [x, recent.lastIndexOf(key(x))]).sort((a, b) => a[1] - b[1])[0][0];
export function pickItem(u, topic) {
  if (topic === "pair") { const p = leastRecent(PAIR_TASKS, x => x.s); recent.push(p.s); trim(); return p.s; }
  if (topic === "szotag") { const it = leastRecent(sylQueue(u), i => i.word); recent.push(it.word); trim(); return it.word; }
  if (topic === "jly") return pickWords(JLY_LIST.map(x => x.w), 1, u)[0];
  return pickWords(M_UNIQUE, 1, u)[0];
}
// Napi küldetés („Vegyes kaland”): hosszú mássalhangzó, j/ly, betűpótló és betűkirakó vegyesen, az esedékes szavak elöl
export function planMix(u, n, allowed) {
  const ok = t => !allowed || allowed.includes(t);
  const m = pickWords(M_UNIQUE, n, u), j = pickWords(JLY_LIST.map(x => x.w), Math.ceil(n * 0.3), u);
  const pattern = ["hosszu", "jly", "gap", "tiles", "jly", "hosszu", "gap", "jly", "tiles", "hosszu"].filter(ok);
  const pool = pattern.length ? pattern : (allowed && allowed.length ? allowed : ["hosszu"]);
  const plan = [];
  for (let i = 0, mi = 0, ji = 0; plan.length < n; i++) {
    const topic = pool[i % pool.length];
    if (topic === "jly") plan.push({ topic, sub: j[ji++ % j.length] });
    else if (topic === "pair" || topic === "szotag") plan.push({ topic, sub: null });
    else plan.push({ topic, sub: m[mi++ % m.length] });
  }
  return shuffle(plan);
}

// A csomag saját haladásának rögzítése. r: 1 elsőre jó · 2 tipp után jó · 0 hibás
// task: { topic, word (szó vagy szótagolt alak), level, syl }
export function recordWord(u, task, r, t = dayNum()) {
  const key = dateKey(t), tp = task.topic === "gap" ? "hosszu" : task.topic;
  u.stats = u.stats || {}; u.srs = u.srs || {}; u.mistakes = u.mistakes || [];
  const st = (u.stats[tp] = u.stats[tp] || { ok: 0, n: 0 });
  st.n++; if (r === 1) st.ok++;
  const out = [];
  const w = task.word;
  if (!task.syl && ALL_UNIQUE_WORDS.has(w)) {
    const s = (u.srs[w] = u.srs[w] || { b: 0, days: 0, strong: 0, last: "", due: t });
    const wasM = isMastered(s), strong = task.level >= 2 || tp === "tiles"; // találgatással nem lehet elsajátítani
    if (r === 1) {
      if (wasM) { s.rf = (s.rf || 0) + 1; s.due = t + REFRESH[Math.min(s.rf, REFRESH.length - 1)]; s.last = key; } // frissítő ismétlés
      else {
        if (s.last !== key) { s.days++; s.b = Math.min(s.b + 1, 4); }
        s.last = key; if (strong) s.strong = (s.strong || 0) + 1;
        s.due = t + INTERVALS[s.b];
        if (isMastered(s)) { s.rf = 0; s.due = t + REFRESH[0]; out.push("🃏 Új szókártya a Gyűjteményben!"); }
        else if (s.days >= 3) s.due = t + 1; // még egy nehezebb feladat kell
      }
      u.mistakes = u.mistakes.filter(x => x !== w);
    } else if (r === 0) {
      s.b = 0; s.days = Math.max(0, s.days - (wasM ? 2 : 1)); s.due = t + 1; s.miss = (s.miss || 0) + 1; s.rf = 0;
      if (!u.mistakes.includes(w)) u.mistakes.push(w);
    } else s.due = t + 1; // tipp után jó: holnap újra
    u.maxM = Math.max(u.maxM || 0, masteredCount(u));
  }
  if (task.syl) {
    const S = sylState(u), plain = task.plainWord;
    if (r === 1) S.miss = S.miss.filter(x => x !== plain);
    else if (r === 0 && !S.miss.includes(plain)) S.miss = [...S.miss, plain].slice(-20);
    // 10 szótagolásonként szintigazítás: ≥90% → feljebb, ≤50% → lejjebb
    S.cnt = (S.cnt || 0) + 1; S.okc = (S.okc || 0) + (r === 1 ? 1 : 0);
    if (S.cnt >= 10) {
      const d = sylAdapt(u, S.okc, S.cnt); S.cnt = 0; S.okc = 0;
      if (d) out.push(d > 0 ? `✂️ Szótagolás: új szint – ${S.lvl}. (${SYL_LVL_NAMES[S.lvl]})` : `✂️ Szótagolás: könnyebb szint – ${S.lvl}.`);
    }
  }
  return out.length ? { text: out.join(" "), confetti: out.some(x => x.startsWith("🃏")) } : null;
}

const total = u => Object.values(u.stats || {}).reduce((a, s) => a + (s.ok || 0), 0);
export const PACK_BADGES = [
  { id: "jly10", ic: "✍️", n: "10 helyes j/ly szó", t: u => okOf(u, "jly") >= 10 },
  { id: "long25", ic: "🔠", n: "25 helyes hosszú/rövid", t: u => okOf(u, "hosszu") >= 25 },
  { id: "pair10", ic: "⚖️", n: "10 helyes jelentéskülönbség", t: u => okOf(u, "pair") >= 10 },
  { id: "tiles10", ic: "🔤", n: "10 kirakott szó", t: u => okOf(u, "tiles") >= 10 },
  { id: "m25", ic: "🏆", n: "25 elsajátított szó", t: u => masteredCount(u) >= 25 },
  { id: "m100", ic: "📚", n: "100 elsajátított szó", t: u => masteredCount(u) >= 100 },
  { id: "pts500", ic: "💎", n: "500 pont", t: u => (u.pts || 0) >= 500 },
  { id: "syl25", ic: "✂️", n: "25 helyes szótagolás", t: u => okOf(u, "szotag") >= 25 },
  { id: "sylmax", ic: "🧩", n: "Szótagolás: 5. szint", t: u => !!u.syl && u.syl.lvl >= 5 },
  { id: "ok250", ic: "🌳", n: "250 helyes szó", t: u => total(u) >= 250 },
];
export { JLY_MAP, analyzeWord, analyzeJlyWord };
