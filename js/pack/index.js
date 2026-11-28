import { RULES, RULE_WORDS, CATALOG, ruleItem } from "./active-words.js";
import { HUNGARIAN_KEYS } from "../core/answer-spec.js";
// ===== Helyesírás csomag: a Helyesírás Kaland feladatai a közös vázhoz =====
// A váz (js/shell) csak ezen az objektumon keresztül éri el a feladatokat (lásd a Matek repó docs/terv-kozos-vaz.md).
import { el, btn, escHtml, toast } from "../core/dom.js";
import { RANKS, rankOf } from "../game/ranks.js";
import { M_UNIQUE, JLY_LIST, JLY_MAP, ALL_UNIQUE_WORDS, LEGACY_WORD_COUNT, PAIR_TASKS, PAIR_WHY, analyzeWord, analyzeJlyWord, getSynonymsForWord, explainWord,
  extraVariant, extraFragment, jlyOptions, shuffle, sylItems, sylState, sylExplain, sylChoices, sylGaps, SYL_LVL_NAMES } from "./lang.js";
import { optionsUI, typingUI, tilesUI, sylUI } from "./ui.js";
import { isMastered, masteredCount, effLevel, pickItem, planMix, planReview, reviewCount, recordWord, okOf, PACK_BADGES } from "./progress.js";

const TOPICS = [
  { id: "hosszu", name: "Rövid vagy hosszú?", icon: "🎯", color: "#2563eb", place: "Rövid vagy hosszú?", sub: "Válaszd ki a helyes mássalhangzót!" },
  { id: "gap", name: "Betűpótló", icon: "🧩", color: "#ca8a04", place: "Betűpótló", sub: "Pótold a hiányzó mássalhangzót!" },
  { id: "jly", name: "j vagy ly", icon: "✍️", color: "#ea580c", place: "j vagy ly", sub: "Döntsd el: pontos j vagy ly!" },
  { id: "tiles", name: "Betűkirakó", icon: "🔤", color: "#0d9488", place: "Betűkirakó", sub: "Rakd ki a szót!" },
  { id: "pair", name: "Jelentéskülönbség", icon: "⚖️", color: "#db2777", place: "Jelentéskülönbség", sub: "fejjel–fejel, hal–hall…" },
  ...Object.entries(RULES).map(([id, r]) => ({ id, ...r, icon: "✏️", color: "#7c3aed", place: r.name })),
  { id: "szotag", name: "Szótagolás", icon: "✂️", color: "#0891b2", place: "Szótagolás", sub: "Vágd szótagokra a szavakat!" },
];
const topicById = id => TOPICS.find(t => t.id === id) || TOPICS[0];
const LVL = ["", "Kezdő", "Haladó", "Mester"];
const clue = t => `<div class="clue-box">💡 ${t}</div>`;
const HINT_LONG = "Mondd ki hangosan, lassan! A hosszú mássalhangzót hosszabban ejtjük (pl. ki-ssz-a → kassza).";
const HINT_JLY = "A j és az ly hangja egyforma – ezt nem lehet kiejtésből eldönteni. Gondolj a szócsaládra, vagy arra, hol láttad leírva!";

export const PACK = {
  contractVersion: 1,
  version: "1.0.0",
  topicFallbacks: { hosszu: ["tiles"], gap: ["tiles"], jly: ["tiles"] },
  id: "helyesiras",
  retype: true, // hibás válasz után a helyes alakot be kell írni (a szótagolás kivételével)
  topics: TOPICS,
  levels: { count: 3, mode: "manual" },
  settings: [
    { key: "level", group: "play", scope: "child", type: "radio", default: 1, label: "Nehézségi szint", help: "Hány válaszlehetőség legyen, vagy be kell-e gépelni a szót.",
      options: [{ value: 1, label: "Kezdő · 2 opció" }, { value: 2, label: "Haladó · 3 opció" }, { value: 3, label: "Mester · 4 opció / gépelés" }] },
    { key: "grade", group: "play", scope: "child", type: "select", options: [3, 4], default: 3, unit: ". osztály", label: "Évfolyam (a szótagolás kezdőszintjéhez)", help: "4. osztálynál a szótagolás a 2. szintről indul." },
  ],

  // ---- a gyerek csomag-saját adatai ----
  newUser: () => ({ srs: {}, mistakes: [], stats: {} }),
  normUser(u) {
    const arr = x => Array.isArray(x) ? x : Object.values(x || {});
    u.srs = u.srs || {}; u.stats = u.stats || {};
    u.mistakes = arr(u.mistakes);
    delete u.practiced; // régi, a szókártyákkal (srs) azonos lista: a felhőben is törlődik, a „Gyakorolt” szám az srs-ből jön
    if (u.syl) { u.syl.lvl = Math.min(5, Math.max(1, +u.syl.lvl || 1)); ["hist", "recent", "miss"].forEach(k => { u.syl[k] = arr(u.syl[k]); }); }
    else if ((u.prefs || {}).grade == 4) u.syl = { lvl: 2, hist: [], recent: [], miss: [] };
    return u;
  },

  // ---- haladás egy témában (kártya, Gyűjtemény) ----
  status(u, id) {
    const st = (u.stats || {})[id === "gap" ? "hosszu" : id], n = st ? st.n : 0, p = n ? Math.round(st.ok / n * 100) : null;
    const stars = n < 5 ? 0 : p >= 90 ? 3 : p >= 75 ? 2 : p >= 50 ? 1 : 0;
    const label = id === "szotag" ? `${sylState(u).lvl}. szint · ${SYL_LVL_NAMES[sylState(u).lvl]}` : n ? `${p}% elsőre jó · ${n} feladat` : topicById(id).sub;
    return { stars, level: effLevel(u, null), label };
  },
  levelOf: u => effLevel(u, null),

  // ---- feladatok ----
  plan: (u, n, rng, allowed) => planMix(u, n, allowed),
  makeTask(item, rng, u) {
    let topic = item.topic, w = item.sub;
    if (topic === "pair" ? !PAIR_TASKS.some(p => p.s === w) : !ALL_UNIQUE_WORDS.has(w)) w = pickItem(u, topic);
    if (RULE_WORDS[topic] && !RULE_WORDS[topic].includes(w)) w = pickItem(u, topic);
    if (topic === "jly" && !JLY_MAP[w]) w = pickItem(u, topic);
    if ((topic === "hosszu" || topic === "gap") && !M_UNIQUE.includes(w)) {
      if (item.sub && ALL_UNIQUE_WORDS.has(item.sub)) topic = "tiles";
      else w = pickItem(u, topic);
    }
    // ha a szót nem lehet az adott módon kérdezni, betűkirakó lesz belőle
    if (topic === "jly" && !(JLY_MAP[w] && analyzeJlyWord(w))) topic = "tiles";
    if ((topic === "hosszu" || topic === "gap") && !analyzeWord(w)) topic = "tiles";
    const T = topicById(topic);
    if (topic === "pair") return pairTask(PAIR_TASKS.find(p => p.s === w) || shuffle(PAIR_TASKS)[0], T);
    if (topic === "szotag") return sylTask(u, w, T);
    const L = item.level || effLevel(u, w), base = { topic, sub: w, word: w, retype: w, level: L, viz: "", solution: w, correctText: w, answerText: v => String(v), why: () => null, plainQ: "" };
    const meta = `${T.icon} ${T.name} · ${LVL[L]}`, syn = escHtml(getSynonymsForWord(w));
    const steps = [escHtml(explainWord(w)), `Jelentése: ${escHtml(getSynonymsForWord(w, true))}`, `A helyes alak: <b class="big-word">${escHtml(w)}</b>`];
    const check = v => ({ ok: v === w });
    // Új szabálytémák (hosszú magánhangzó, -ó/-ő, -u/-ü/-ú/-ű, -ít, -ul/-ül): a keret „hiányzó rész” felülete
    // (answer kind: "gap"); kezdő: 2 lehetőség, haladó: 3, mester: beírás ékezetes gombsorral. A jelentés mindig látszik.
    if (RULES[topic]) {
      const { part, other, mask, tip } = ruleItem(topic, w), start = mask.indexOf("_");
      const third = thirdOption(topic, part, other);
      const opts = shuffle(L === 2 && third ? [part, other, third] : [part, other]);
      const full = v => w.slice(0, start) + v + w.slice(start + part.length);
      return { ...base, meta, solution: part, correctText: w,
        q: `<b>Pótold a hiányzó részt!</b>${clue("Jelentése: " + syn)}${L === 3 ? `<p class="soft small">Írd be a hiányzó betű(ke)t: ${escHtml([part, other].sort().join(" vagy "))}?</p>` : ""}`,
        answer: L === 3 ? { kind: "gap", word: w, start, part, input: "text", extraKeys: HUNGARIAN_KEYS } : { kind: "gap", word: w, start, part, options: opts },
        answerText: v => full(String(v)), hint: tip,
        steps: [escHtml(tip), `Jelentése: ${escHtml(getSynonymsForWord(w, true))}`, `A helyes alak: <b class="big-word">${escHtml(w)}</b>`],
        speech: `Pótold a hiányzó részt! Jelentése: ${getSynonymsForWord(w)}`, plainQ: mask };
    }
    if (topic === "jly") {
      const opts = shuffle(jlyOptions(w, analyzeJlyWord(w).wrongWord, L));
      return { ...base, meta, q: `<b>Válaszd ki a helyesen írt alakot!</b>${clue("Jelentése: " + syn)}`, render: (box, io) => optionsUI(box, opts, w, io), check, hint: HINT_JLY, steps, speech: "Válaszd ki a helyesen írt alakot! Jelentése: " + getSynonymsForWord(w) };
    }
    if (topic === "hosszu") {
      const info = analyzeWord(w);
      if (L === 3) return { ...base, meta, q: `<b>Írd be a szót helyesen!</b>${clue("Jelentése: " + syn)}`, render: (box, io) => typingUI(box, w, io), check, hint: HINT_LONG, steps, speech: "Írd be a szót helyesen! Jelentése: " + getSynonymsForWord(w) };
      const opts = [info.word, info.wrongWord]; if (L >= 2) { const x = extraVariant(info.word, opts); if (x) opts.push(x); }
      const o = shuffle(opts);
      return { ...base, meta, q: `<b>Kattints a helyesen leírt szóra!</b>${clue("Jelentése: " + syn)}`, render: (box, io) => optionsUI(box, o, w, io), check, hint: HINT_LONG, steps, speech: "Kattints a helyesen leírt szóra! Jelentése: " + getSynonymsForWord(w) };
    }
    if (topic === "gap") {
      const info = analyzeWord(w), good = info.hasLong ? info.longPart : info.shortPart, bad = info.hasLong ? info.shortPart : info.longPart;
      const [a, b] = info.gappedWord.split("___");
      if (L === 3) return { ...base, meta, q: `<b>Írd be a teljes szót!</b>${clue("Jelentése / szinonima: " + syn)}`, render: (box, io) => typingUI(box, w, io, info.gappedWord.replace("___", "__")), check, hint: HINT_LONG, steps, speech: "Írd be a teljes szót!" };
      const opts = [good, bad]; if (L >= 2) opts.push(extraFragment(good, bad));
      const o = shuffle(opts);
      return { ...base, meta, correctText: w, solution: good,
        q: `<b>Melyik betűkapcsolat hiányzik a szóból?</b>${clue("Jelentése / szinonima: " + syn)}<div class="word-display">${escHtml(a)}<span class="gap">__</span>${escHtml(b || "")}</div>`,
        render(box, io) { const ui = optionsUI(box, o, good, io, f => { const g = document.querySelector("#task-q .gap"); if (g) g.textContent = f; }); const sc = ui.showCorrect; ui.showCorrect = () => { sc(); const g = document.querySelector("#task-q .gap"); if (g) g.textContent = good; }; return ui; },
        check: v => ({ ok: v === good }), answerText: v => (a + v + (b || "")), hint: HINT_LONG, steps, speech: "Melyik betűkapcsolat hiányzik a szóból?" };
    }
    // betűkirakó
    return { ...base, topic: "tiles", meta: `${topicById("tiles").icon} Betűkirakó`, q: `<b>Rakd ki a szót!</b> <span class="soft small">(A jelentés ingyenes; a magánhangzók vagy az első–utolsó betű segítség – kevesebb pontot ér.)</span>`,
      render: (box, io) => tilesUI(box, w, io, getSynonymsForWord(w)), check, hint: "Nézd meg a jelentését (💡), és mondd ki a szót hangosan! A jó betűk zölden maradtak.", steps, speech: "Rakd ki a szót! Jelentése: " + getSynonymsForWord(w) };
  },
  // 🔁 „Próbáld ki egy hasonlóval!”: ugyanarra a szabályra egy MÁSIK szó (nem az elrontott)
  twin(task, item, rng) { const w = similarWord(task, rng); return w ? { topic: item.topic, sub: w, level: task.level } : null; },
  record: (u, task, r) => recordWord(u, task, r),
  gatherText: { card: n => n === 1 ? "🃏 Új szókártya a Gyűjteményben!" : `🃏 ${n} új szókártya a Gyűjteményben!` },
  // 🩹 Ismétlő kör: a hibás és ismétlésre esedékes szavakból (a kör hossza a keret beállításából jön)
  review: { unit: "szó", count: reviewCount, plan: (u, n, rng, allowed) => planReview(u, n, allowed) },
  // 🌱 fejlődésjelzés: a helyesírásnál a szó számít (bármelyik feladattípusban jön vissza), a szótagolás és a mondat külön
  progressKey: t => (t.topic === "pair" ? `pair:${t.sub}` : t.topic === "szotag" ? `syl:${t.plainWord || t.sub}` : `w:${t.word || t.sub}`),
  speechText: html => String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),

  // ---- jelvények és jutalom-mérőszámok ----
  badges: PACK_BADGES,
  metrics: { words: { label: "🃏 elsajátított szó", value: masteredCount } },

  // ---- súgó (F1) ----
  help(id) {
    const T = topicById(id);
    const H = RULES[id] ? [T.sub, RULES[id].example, "Nézd meg a hiány helyét, és mondd ki a szót!"] : {
      hosszu: ["Két alak közül (vagy beírva) a helyes írásmódot keresed: rövid vagy hosszú mássalhangzó?", "kasza – kassza", "Mondd ki lassan: a hosszú hangot tovább ejtjük."],
      gap: ["A szóból hiányzik egy betűkapcsolat: rövid vagy hosszú mássalhangzó kell a helyére?", "ka__a → ssz", "Gondolj a jelentésére, és mondd ki hangosan!"],
      jly: ["A j és az ly ugyanúgy hangzik – meg kell jegyezni, melyik szóban melyik van.", "folyó, hely, fejjel", "Gondolj a szócsaládra: hely → helyes, helyi."],
      tiles: ["A szó betűi össze vannak keverve: rakd ki a szót!", "a, s, z, k, s, a → kassza", "Először nézd meg a jelentését – a segítségek kevesebb pontot érnek."],
      pair: ["Két hasonló szó közül azt keresd, amelyik a mondatba illik.", "hal (állat) – hall (fülével)", "Kérdezz rá: mivel? mit csinál?"],
      szotag: ["Koppints a betűk közé, ahol a szót szótagokra kell bontani!", "kis-asz-szony", "Ahány magánhangzó, annyi szótag."],
    }[id] || ["", "", ""];
    return { title: `${T.icon} ${T.name}`, subtitle: T.sub, about: H[0], items: [], example: H[1], tip: H[2] };
  },
  topicLabel: id => { const T = topicById(id); return `${T.icon} ${T.name}`; },
  subLabel: (id, sub) => sub || "",

  // ---- ⚙️ Témák fül: témák pontossága, szókártyák, szótagolás, legtöbbet hibázott szavak ----
  parentTopics(box, u) {
    const rows = TOPICS.map(T => { const st = (u.stats || {})[T.id === "gap" ? "hosszu" : T.id]; const p = st && st.n ? Math.round(st.ok / st.n * 100) : null; return `<tr><td><b>${T.icon} ${escHtml(T.name)}</b></td><td>${st ? `${st.ok}/${st.n} jó` : "–"}</td><td><span class="sc ${p == null ? "grey" : p >= 90 ? "green" : p >= 70 ? "yellow" : "red"}">${p == null ? "még nem próbálta" : p + "%"}</span></td></tr>`; }).join("");
    box.append(el("div", null, `<table class="tmap">${rows}</table><p class="legend">A „Rövid vagy hosszú?” és a „Betűpótló” közös statisztikát használ (hosszú mássalhangzók).</p>`));
    const S = sylState(u);
    box.append(el("h4", "psub", "🃏 Szókártyák és szótagolás"), el("div", "pstrip", `<span>🃏 Elsajátított szó: <b>${[...ALL_UNIQUE_WORDS].filter(w => isMastered((u.srs || {})[w])).length} / ${ALL_UNIQUE_WORDS.size}</b></span><span>📚 Gyakorolt: <b>${Object.keys(u.srs || {}).filter(w => ALL_UNIQUE_WORDS.has(w)).length}</b></span><span>✂️ Szótagolás: <b>${S.lvl}. szint</b> (${SYL_LVL_NAMES[S.lvl]})</span>`));
    ptsAdjust(box, u);
    const miss = Object.entries(u.srs || {}).filter(([, r]) => r.miss).sort((a, b) => b[1].miss - a[1].miss).slice(0, 15);
    box.append(el("h4", "psub", "Legtöbbet hibázott szavak"), el("p", null, miss.length ? miss.map(([w, r]) => `<span class="sc ${isMastered(r) ? "green" : "red"}">${escHtml(w)} · ${r.miss}×</span>`).join(" ") : `<span class="soft">Még nincs hibázott szó. 🙂</span>`));
  },

  // ---- 🎒 Gyűjtemény: szókártya-album ----
  collectionTabs: [{
    id: "cards", icon: "🃏", label: "Szókártyák", help: "A megtanult szavak kártyái. Egy szó akkor lesz kártya, ha 3 különböző napon jó volt.",
    render(box, { user: u, redraw }) {
      const all = [...ALL_UNIQUE_WORDS], got = all.filter(w => isMastered(u.srs[w])).length;
      box.append(el("div", "pstrip", `<span>🃏 <b>${got} / ${all.length}</b> szókártya</span>`), el("p", "soft small", "Egy szó akkor lesz kártya, ha 3 különböző napon helyesen válaszoltál rá, és legalább egyszer nehezebb feladatban is (3 opció, gépelés vagy betűkirakó). Ha 30 nap múlva is tudod, ⭐ kerül rá."));
      const sets = { ...Object.fromEntries(Object.entries(RULE_WORDS).map(([id, words]) => [id, [RULES[id].name, words]])), hosszu: ["Hosszú mássalhangzók", M_UNIQUE], jly: ["j / ly", JLY_LIST.map(x => x.w)] };
      const archivedCards = Object.keys(u.srs || {}).filter(w => !ALL_UNIQUE_WORDS.has(w) && isMastered(u.srs[w]));
      if (archivedCards.length || cardTab === "archive") sets.archive = ["Korábban megszerzett", archivedCards];
      const seg = el("div", "segs");
      Object.entries(sets).forEach(([k, [label]]) => { const b = el("button", "seg" + (k === cardTab ? " on" : ""), label); b.type = "button"; b.addEventListener("click", () => { cardTab = k; redraw(); }); seg.append(b); });
      box.append(seg);
      const grid = el("div", "wgrid");
      [...new Set(sets[cardTab][1])].sort((a, b) => a.localeCompare(b, "hu")).forEach(w => {
        const r = u.srs[w], m = isMastered(r), c = el("div", "wcard " + (m ? "got" : r ? "learn" : "new"));
        if (m) { c.innerHTML = `<b>${escHtml(w)}${(r.rf || 0) >= 1 ? " ⭐" : ""}</b>`; c.title = getSynonymsForWord(w, true); }
        else if (r) { const d = Math.min(r.days, 3); c.innerHTML = `<b>🌱</b><small>${"●".repeat(d)}${"○".repeat(3 - d)}</small>`; }
        else c.innerHTML = `<b>?</b><small>${w.length} betű</small>`;
        grid.append(c);
      });
      box.append(grid);
    },
  }],
};
let cardTab = "hosszu";

// ---- ⚖️ Pontok igazítása a megtanult szavakhoz (⚙️ Témák fül, a szülői ablak PIN-nel védett) ----
// Arány: a legfelső rang pontja = az összes szó elsajátítva → 1 elsajátított szó ≈ 9000 / szószám pont.
// A rang a pontból adódik; a ranghoz kötött tárgyak a váz look() függvénye miatt maguktól visszaállnak egy kinyitottra.
export const PTS_PER_WORD = RANKS[RANKS.length - 1].pts / LEGACY_WORD_COUNT;
export const suggestedPts = u => Math.round(masteredCount(u) * PTS_PER_WORD);
const rankTxt = p => { const r = rankOf(p); return `${r.n}. ${r.name}`; };
function ptsAdjust(box, u) {
  const sug = suggestedPts(u), m = masteredCount(u);
  box.append(el("h4", "psub", "⚖️ Pontok igazítása a megtanult szavakhoz"));
  const strip = el("div", "pstrip"), draw = () => {
    strip.innerHTML = `<span>⭐ Most: <b>${u.pts}</b> pont · ${escHtml(rankTxt(u.pts))}</span>`
      + `<span>🃏 ${m} elsajátított szó → javasolt: <b>${sug}</b> pont · ${escHtml(rankTxt(sug))}</span>`;
  };
  draw();
  box.append(strip, el("p", "legend", `Arány: a legfelső rang (${RANKS[RANKS.length - 1].pts} pont) = mind a ${ALL_UNIQUE_WORDS.size} szó elsajátítva, azaz 1 szó ≈ ${PTS_PER_WORD.toFixed(1)} pont. `
    + (u.pts > sug ? `A mostani pontszám ${u.pts - sug} ponttal magasabb a javasoltnál.` : "A mostani pontszám nem magasabb a javasoltnál.")
    + " Átírás után a rang és a ranghoz kötött tárgyak is ehhez igazodnak; a jelvények, a saját tárgyak és az ajándékok megmaradnak."));
  const row = el("div", "form-row"), inp = el("input");
  inp.type = "number"; inp.min = "0"; inp.step = "1"; inp.value = String(Math.min(u.pts, sug)); inp.setAttribute("aria-label", "Új pontszám");
  const hint = el("span", "soft small"), upd = () => { const v = Math.max(0, Math.round(+inp.value || 0)); hint.textContent = `→ ${rankTxt(v)}`; };
  inp.addEventListener("input", upd); upd();
  row.append(inp, hint, btn("secondary", `↺ Javasolt (${sug})`, () => { inp.value = String(sug); upd(); }), btn("primary", "💾 Mentés", async () => {
    const v = Math.max(0, Math.round(+inp.value || 0));
    if (v === u.pts) { toast("A pontszám nem változott."); return; }
    // a modal és a mentés csak böngészőben töltődik be (a csomag tesztjei DOM nélkül futnak)
    const [{ ask }, { saveUser }] = await Promise.all([import("../core/modal.js"), import("../shell/ctx.js")]);
    const ok = await ask({ title: "Pontok átírása", text: `${escHtml(u.name)}: ${u.pts} → ${v} pont (${escHtml(rankTxt(u.pts))} → ${escHtml(rankTxt(v))}). Biztosan átírod?`, ok: "Igen, átírom" });
    if (!ok) return;
    const from = u.pts; u.pts = v;
    u.ptsAdj = [...(Array.isArray(u.ptsAdj) ? u.ptsAdj : []), { d: new Date().toISOString().slice(0, 10), from, to: v }].slice(-10);
    saveUser(u); draw(); toast(`✅ ${u.name}: ${from} → ${v} pont`);
  }));
  box.append(row);
  if (Array.isArray(u.ptsAdj) && u.ptsAdj.length) box.append(el("p", "legend", "Korábbi igazítások: " + u.ptsAdj.slice(-3).map(x => `${x.d}: ${x.from} → ${x.to}`).join(" · ")));
}

// --- Jelentéskülönbség: melyik szó illik a mondatba? ---
// Hasonló szó az ikerfeladathoz: betűpótló / hosszú mássalhangzó → ugyanaz a betűkapcsolat (pl. ssz),
// j/ly → ugyanaz az írásmód (j, ly, jj, lly), betűkirakó → hasonló hossz, szótagolás → ugyanannyi szótag
const gapKey = w => { const i = analyzeWord(w); return i ? `${i.hasLong ? "L" : "S"}:${i.longPart.toLowerCase()}` : null; };
const jlyKey = w => { const l = w.toLowerCase(); return ["lly", "jj", "ly", "j"].find(t => l.includes(t)) || null; };
// Haladó szinten a harmadik, hihető hibás lehetőség (ugyanabból a hangcsaládból)
const THIRD = { vowel: { á: "é", é: "á", í: "é", ó: "ő", ő: "ó", ú: "ű", ű: "ú" }, endoo: { ó: "ő", ő: "ó" }, enduu: { u: "ü", ü: "u", ú: "ű", ű: "ú" }, endit: { ít: "ét" }, endul: { ul: "ül", ül: "ul" } };
function thirdOption(topic, part, other) { const t = (THIRD[topic] || {})[part]; return t && t !== part && t !== other ? t : null; }
function similarWord(task, rng) {
  const w = task.sub, len = s => [...s].length;
  let pool;
  if (RULE_WORDS[task.topic]) {
    // ugyanaz a szabály: ugyanaz a pótolandó rész (pl. ú, -ít, -ül), a -u/-ü témánál a kivétel csak kivétellel jön
    const key = x => { const r = ruleItem(task.topic, x); return `${r && r.part}|${CATALOG.shortuu.includes(x)}`; }, k = key(w);
    pool = RULE_WORDS[task.topic].filter(x => key(x) === k);
  }
  else if (task.topic === "pair") pool = PAIR_TASKS.map(p => p.s);
  else if (task.topic === "szotag") { const n = String(task.word).split("-").length; pool = sylItems().filter(i => i.syl.split("-").length === n).map(i => i.w); }
  else if (task.topic === "jly") { const k = jlyKey(w); pool = JLY_LIST.map(x => x.w).filter(x => jlyKey(x) === k); }
  else if (task.topic === "tiles") pool = [...ALL_UNIQUE_WORDS].filter(x => Math.abs(len(x) - len(w)) <= 1);
  else { const k = gapKey(w); pool = M_UNIQUE.filter(x => gapKey(x) === k); }
  pool = pool.filter(x => x !== w);
  return pool.length ? rng.pick(pool) : null;
}
function pairTask(p, T) {
  const [a, b] = p.s.split("___"), o = shuffle([p.ok, p.bad]);
  return { topic: "pair", sub: p.s, word: p.ok, retype: p.ok, solution: p.ok, level: 1, meta: `${T.icon} ${T.name}`, viz: "",
    q: `<b>Melyik szó illik a mondatba?</b> <span class="soft">(${escHtml(p.hint)})</span><div class="sentence-display">${escHtml(a)}<span class="gap">?</span>${escHtml(b || "")}</div>`,
    render(box, io) { const ui = optionsUI(box, o, p.ok, io, f => { const g = document.querySelector("#task-q .gap"); if (g) g.textContent = f; }); const sc = ui.showCorrect; ui.showCorrect = () => { sc(); const g = document.querySelector("#task-q .gap"); if (g) g.textContent = p.ok; }; return ui; },
    check: v => ({ ok: v === p.ok }), hint: escHtml(p.hint), steps: [escHtml(PAIR_WHY[p.ok] || p.hint), `A helyes mondat: <b>${escHtml(a + p.ok + (b || ""))}</b>`],
    why: v => PAIR_WHY[v] ? escHtml(PAIR_WHY[v]) : null, answerText: v => String(v), correctText: p.ok, speech: "Melyik szó illik a mondatba? " + p.s.replace("___", "…"), plainQ: p.s };
}
// --- Szótagolás ---
function sylTask(u, w, T) {
  const it = sylItems().find(i => i.w === w) || sylItems()[0], lvl = sylState(u).lvl;
  const base = { topic: "szotag", sub: it.w, word: it.syl, plainWord: it.w, syl: true, level: Math.min(3, Math.ceil(lvl / 2)), meta: `${T.icon} Szótagolás · ${lvl}. szint (${SYL_LVL_NAMES[lvl]})`, viz: "",
    correctText: it.syl, why: () => null, speech: "Bontsd szótagokra: " + it.w, plainQ: it.w,
    hint: `Ahány magánhangzó, annyi szótag. Itt ${it.n} szótag van.`, steps: [escHtml(sylExplain(it.w, it.syl)), `A helyes szótagolás: <b class="big-word">${escHtml(it.syl)}</b>`] };
  if (it.choice) {
    const opts = sylChoices(it);
    return { ...base, solution: it.syl, q: `<b>Melyik a helyes szótagolás?</b><div class="word-display">${escHtml(it.w)}</div>`, render: (box, io) => optionsUI(box, opts, it.syl, io), check: v => ({ ok: v === it.syl }), answerText: v => String(v) };
  }
  const want = new Set(sylGaps(it.syl)), wantKey = [...want].sort((a, b) => a - b).join(",");
  const show = v => { const g = new Set(String(v).split(",").filter(Boolean).map(Number)); let o = ""; [...it.w].forEach((ch, i) => { if (g.has(i)) o += "-"; o += ch; }); return o; };
  return { ...base, solution: wantKey, q: `<b>Koppints a betűk közé, ahol a szót szótagokra kell bontani!</b>`, render: (box, io) => sylUI(box, it.w, want, io), check: v => ({ ok: v === wantKey }), answerText: show };
}
export { okOf };
