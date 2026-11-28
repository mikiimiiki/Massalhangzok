// ===== Helyesírás csomag: nyelvi segédek (DOM nélkül, Node-ban is tesztelhető) =====
// Szóelemzés (hosszú/rövid mássalhangzó, j/ly), tippek, magyarázat, hihető hibás alakok, szótagolás.
import { WORD_SYNONYMS, M_LIST, JLY_RAW, PAIR_TASKS as ARCHIVED_PAIRS } from "./words.js";
import { dateKey, dayNum } from "../core/dates.js";
import { ACTIVE_WORDS, LONG_WORDS, JLY_WORDS } from "./active-words.js";
import { MEANINGS } from "./meanings.js";
import { EXTRA_PAIRS, EXTRA_WHY, PAIR_HINT_FIX } from "./pairs.js";
// a régi mondatpárok közül az aktív szavasak + az új párok (a helyes válasz mindig aktív szó); a választ eláruló régi súgók cserélve
export const PAIR_TASKS = [...ARCHIVED_PAIRS, ...EXTRA_PAIRS].filter(p => ACTIVE_WORDS.has(p.ok)).map(p => (PAIR_HINT_FIX[p.ok] ? { ...p, hint: PAIR_HINT_FIX[p.ok] } : p));
const todayKey = () => dateKey(dayNum());
export const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- 2. Szótárak ----------
export const JLY_LIST = JLY_WORDS.map(w => ({ w, hint: MEANINGS[w] || JLY_RAW.find(x => x[0] === w)?.[1] || "" }));
export const JLY_MAP = Object.fromEntries(JLY_LIST.map(x => [x.w, x]));
export const M_UNIQUE = LONG_WORDS;
export const ALL_UNIQUE_WORDS = ACTIVE_WORDS;
export const LEGACY_WORD_COUNT = new Set([...M_LIST, ...JLY_RAW.map(x => x[0])]).size;

export const PAIR_WHY = {
  fejjel: "fej + -vel → a v hasonul a j-hez: fejjel (eszközhatározó).",
  fejel: "A fejel ige (labdát fejjel játszik), egy j-vel: fej + -el.",
  tejjel: "tej + -vel → a v hasonul a j-hez: tejjel.",
  tejel: "A tejel ige azt jelenti: tejet ad. Egy j van benne.",
  lila: "Színnév: kisbetű és egy l.",
  Lilla: "Lánynév: nagybetű és két l.",
  Duna: "Folyónév: nagybetű és egy n.",
  dunna: "A dunna vastag takaró: kisbetű és két n.",
  hal: "A hal vízi állat: egy l.",
  hall: "A hall azt jelenti: fülével érzékel. Két l.",
  ara: "Az ara a menyasszony: egy r.",
  arra: "Az arra irányt mutat: két r.",
  tol: "A tol ige mozgat, egy l.",
  toll: "A toll íróeszköz vagy madártoll: két l.",
  helység: "A helység település (város, falu).",
  helyiség: "A helyiség épületrész (szoba, terem)."
};
Object.assign(PAIR_WHY, EXTRA_WHY);

export const LONG_PATTERNS = [
  { long: "ccs", short: "cs" }, { long: "ggy", short: "gy" }, { long: "lly", short: "ly" },
  { long: "nny", short: "ny" }, { long: "ssz", short: "sz" }, { long: "tty", short: "ty" },
  { long: "zzs", short: "zs" }, { long: "bb", short: "b" }, { long: "cc", short: "c" },
  { long: "dd", short: "d" }, { long: "ff", short: "f" }, { long: "gg", short: "g" },
  { long: "hh", short: "h" }, { long: "jj", short: "j" }, { long: "kk", short: "k" },
  { long: "ll", short: "l" }, { long: "mm", short: "m" }, { long: "nn", short: "n" },
  { long: "pp", short: "p" }, { long: "rr", short: "r" }, { long: "ss", short: "s" },
  { long: "tt", short: "t" }, { long: "vv", short: "v" }, { long: "zz", short: "z" }
];
const SHORT_FALLBACK = [
  { short: "ny", long: "nny" }, { short: "gy", long: "ggy" }, { short: "ty", long: "tty" },
  { short: "cs", long: "ccs" }, { short: "sz", long: "ssz" }, { short: "b", long: "bb" },
  { short: "d", long: "dd" }, { short: "g", long: "gg" }, { short: "k", long: "kk" },
  { short: "l", long: "ll" }, { short: "m", long: "mm" }, { short: "n", long: "nn" },
  { short: "p", long: "pp" }, { short: "r", long: "rr" }, { short: "s", long: "ss" },
  { short: "t", long: "tt" }, { short: "z", long: "zz" }
];
export const FRAGS = ["cs", "ccs", "gy", "ggy", "ly", "j", "ny", "nny", "ty", "tty", "sz", "ssz", "zs", "zzs", "l", "ll", "n", "nn", "t", "tt", "r", "rr", "s", "ss", "z", "zz", "k", "kk", "m", "mm", "p", "pp", "b", "bb", "d", "dd", "g", "gg"];

export function analyzeWord(word) {
  const lower = word.toLowerCase();
  for (const pat of LONG_PATTERNS) {
    const idx = lower.indexOf(pat.long);
    if (idx !== -1) {
      const longPart = word.slice(idx, idx + pat.long.length);
      const shortPart = (idx === 0 && word[0] === word[0].toUpperCase()) ? pat.short[0].toUpperCase() + pat.short.slice(1) : pat.short;
      return { word, wrongWord: word.slice(0, idx) + shortPart + word.slice(idx + pat.long.length), gappedWord: word.slice(0, idx) + "___" + word.slice(idx + pat.long.length), longPart, shortPart, hasLong: true };
    }
  }
  for (const pat of SHORT_FALLBACK) {
    const idx = lower.indexOf(pat.short);
    if (idx > 0) {
      const shortPart = word.slice(idx, idx + pat.short.length);
      return { word, wrongWord: word.slice(0, idx) + pat.long + word.slice(idx + pat.short.length), gappedWord: word.slice(0, idx) + "___" + word.slice(idx + pat.short.length), longPart: pat.long, shortPart, hasLong: false };
    }
  }
  return null;
}

export function analyzeJlyWord(word) {
  const lower = word.toLowerCase();
  for (const p of [{ t: "lly", a: "jj" }, { t: "jj", a: "lly" }, { t: "ly", a: "j" }, { t: "j", a: "ly" }]) {
    const idx = lower.indexOf(p.t);
    if (idx !== -1) {
      const isCap = idx === 0 && word[0] === word[0].toUpperCase();
      const wrongPart = isCap ? p.a[0].toUpperCase() + p.a.slice(1) : p.a;
      return { word, wrongWord: word.slice(0, idx) + wrongPart + word.slice(idx + p.t.length) };
    }
  }
  return null;
}

// ---- Tippek: a megoldást eláruló részek kiszűrése ----
const HINT_FIX = {
  ebbe: "erre a helyre, ide", Csilla: "lánynév (a csillag szóból ered)", Gellért: "fiúnév (budapesti hegy névadója)",
  Ilona: "lánynév (becézve: Ili)", Jolán: "lánynév (becézve: Joli)", Mónika: "lánynév (Móni)", Vivien: "lánynév (Vivi)",
  Kossuth: "híres magyar államférfi, 1848-as kormányzó", víziló: "afrikai, nagy testű vízi emlős", liter: "űrmérték (tíz deci egy ilyen)",
  szisszen: "halk, éles hangot ad (mint a kígyó)", folyam: "nagy vízi út, a Duna is ilyen", gombolyag: "feltekert, gömbölyű fonalcsomó",
  korcsolya: "jégen siklásra való, cipőre szerelt eszköz", olaj: "sütéshez használt folyékony zsiradék", pálya: "versenyek helyszíne, futóút, életút",
  ölyv: "ragadozó madár (az egér a kedvenc zsákmánya)", sólyom: "gyors, vadászó ragadozó madár", tojás: "a tyúk adja, húsvétkor festik",
  ujjú: "olyan ruha, aminek ujja van", ujj: "a kéz vagy a láb nyúlványa"
};
const foldTxt = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function hintLeaks(word, chunk) {
  const w = foldTxt(word), stem = w.length >= 5 ? w.slice(0, w.length - 2) : w;
  return foldTxt(chunk).split(/[^a-z0-9]+/).filter(Boolean).some(t => (w.length >= 4 && t.includes(w)) || t.startsWith(stem));
}
function maskWord(word, part) { // összetett szó: a megoldás részét ▢ jelöli (pl. pókháló → pók▢)
  const n = word.length, w = foldTxt(word);
  if (n < 4 || foldTxt(part) === w) return null;
  let out = "", i = 0, hit = false;
  while (i < part.length) { if (foldTxt(part.slice(i, i + n)) === w) { out += "▢"; i += n; hit = true; } else out += part[i++]; }
  const rest = out.replace(/▢/g, "").trim().length;
  return hit && (out.endsWith("▢") ? rest >= 3 : out.startsWith("▢") && rest >= 6) ? out : null;
}
export function cleanHint(word, text) {
  if (HINT_FIX[word]) return HINT_FIX[word];
  const all = text.split(/,\s*(?![^()]*\))/), keep = all.filter(p => !hintLeaks(word, p));
  if (keep.length < 2) all.filter(p => hintLeaks(word, p)).forEach(p => { const m = maskWord(word, p); if (m && keep.length < 4) keep.push(m); });
  return keep.length ? keep.join(", ") : "Gondolj a szó jelentésére, és hallgasd meg a hangokat!";
}
const hintCache = {};

// raw = true: a teljes szöveg (csak válasz UTÁN, vagy az albumban használjuk)
export function getSynonymsForWord(word, raw = false) {
  // a meanings.js az erősebb (új szavak és javított tippek), utána a régi adatbázis
  const src = MEANINGS[word] || WORD_SYNONYMS[word] || (JLY_MAP[word] && JLY_MAP[word].hint) || "";
  if (!src) return "Keresd meg a betűkből összeálló magyar szót!";
  if (raw) return src;
  return hintCache[word] || (hintCache[word] = cleanHint(word, src));
}

// Hibás válasz utáni, mondatos magyarázat
export function explainWord(w) {
  if (JLY_MAP[w]) return `A(z) „${w}” j/ly szó: ezt nem lehet kiejtésből eldönteni, meg kell jegyezni. Jelentése: ${getSynonymsForWord(w, true)}.`;
  const i = analyzeWord(w);
  if (i) return i.hasLong
    ? `A(z) „${w}” szóban hosszú mássalhangzó van: „${i.longPart}”. Mondd ki hangosan, a hosszú hangot hosszabban ejtjük.`
    : `A(z) „${w}” szóban rövid „${i.shortPart}” van, nem „${i.longPart}”.`;
  return `Nézd meg még egyszer a szót: ${w}.`;
}


// Harmadik, hihető hibás alak (2. szint): egy mássalhangzót megdupláz vagy rövidít
export function extraVariant(word, avoid) {
  const idx = [...word].map((c, i) => i).filter(i => "bcdfghjklmnpqrstvwxyz".includes(word[i].toLowerCase()));
  for (const i of shuffle(idx)) {
    const v = word[i + 1] === word[i] ? word.slice(0, i) + word.slice(i + 1) : word.slice(0, i + 1) + word[i] + word.slice(i + 1);
    if (!avoid.includes(v)) return v;
  }
  return null;
}
// További, hihető hibás alakok: más mássalhangzó-hosszúság, magánhangzó-hosszúság (á/a, ő/ö …)
export const ACC = { a: "á", á: "a", e: "é", é: "e", i: "í", í: "i", o: "ó", ó: "o", ö: "ő", ő: "ö", u: "ú", ú: "u", ü: "ű", ű: "ü" };
export function vowelVariants(word) {
  const out = [];
  [...word].forEach((c, i) => { const lo = c.toLowerCase(), m = ACC[lo]; if (m) out.push(word.slice(0, i) + (c === lo ? m : m.toUpperCase()) + word.slice(i + 1)); });
  return out;
}
export function consVariants(word, skip) {
  const out = [];
  [...word].forEach((c, i) => {
    const lo = c.toLowerCase();
    if (!"bcdfghjklmnpqrstvwxz".includes(lo) || skip.includes(lo) || (i === 0 && word[1] !== c)) return; // szó elején nem duplázunk
    out.push(word[i + 1] === c ? word.slice(0, i) + word.slice(i + 1) : word.slice(0, i + 1) + c + word.slice(i + 1));
  });
  return out;
}
export function moreVariants(word, avoid, n, skip = "") {
  const ok = v => v !== word && !avoid.includes(v);
  const pools = shuffle([shuffle([...new Set(consVariants(word, skip))]).filter(ok), shuffle([...new Set(vowelVariants(word))]).filter(ok)]);
  const out = [];
  for (let k = 0; out.length < n && (pools[0].length || pools[1].length); k++) {
    const x = pools[k % 2].shift();
    if (x && !out.includes(x)) out.push(x);
  }
  return out;
}
// j/ly feladat válaszlehetőségei. A kiegészítő (más hibás) alakok felében a j/ly is el van rontva,
// így a j/ly betűből nem lehet kitalálni a jó választ (2. szint: 3 alak, 3. szint: 4 alak).
export function jlyOptions(word, swapped, L) {
  const opts = [word, swapped], n = L >= 3 ? 2 : L >= 2 ? 1 : 0;
  if (!n) return opts;
  const flags = n === 2 ? shuffle([true, false]) : [Math.random() < .5];
  moreVariants(word, opts, n, "jly").forEach((v, i) => {
    const a = flags[i] && analyzeJlyWord(v);
    const x = a && a.wrongWord !== word && !opts.includes(a.wrongWord) ? a.wrongWord : v;
    if (!opts.includes(x)) opts.push(x);
  });
  return opts;
}
export function extraFragment(c, w) {
  const used = [c, w], first = c[0].toLowerCase();
  const pool = FRAGS.filter(f => !used.includes(f) && f[0] === first);
  const any = FRAGS.filter(f => !used.includes(f));
  const list = pool.length ? pool : any;
  return list[Math.random() * list.length | 0];
}


// ---------- 12d. Szótagolás ----------
// Kiejtés szerinti szótagolás: minden szótagban egy magánhangzó van. Két magánhangzó között nincs mássalhangzó → közöttük vágunk;
// egy mássalhangzó a következő szótagba kerül; több mássalhangzónál csak az utolsó. A kétjegyű betűk (cs, sz, ty …) nem vághatók;
// a hosszú kettős betűt (ssz, tty, nny …) vágáskor kétszer írjuk le: asz-szony. Összetett szavaknál is a szótagolás szabálya érvényes.
export const SYL_V = "aáeéiíoóöőuúüű";
const SYL_LONG = [["ddzs", "dzs"], ["ccs", "cs"], ["ddz", "dz"], ["ggy", "gy"], ["lly", "ly"], ["nny", "ny"], ["ssz", "sz"], ["tty", "ty"], ["zzs", "zs"]];
const SYL_DI = ["dzs", "cs", "dz", "gy", "ly", "ny", "sz", "ty", "zs"];
export const SYL_FIX = { "fogkrém": "fog-krém", "kisasszony": "kis-asz-szony", "bélyeggyűjtés": "bé-lyeg-gyűj-tés", "ellenőrző": "el-len-őr-ző", "álarc": "ál-arc", "hónalj": "hón-alj", "azóta": "az-ó-ta", "megálló": "meg-ál-ló", "délelőtt": "dél-e-lőtt", "kilogramm": "ki-lo-gramm", "dekagramm": "de-ka-gramm", "haddelhadd": "hadd-el-hadd", "hüvelykujj": "hü-velyk-ujj", "fészekalja": "fé-szek-al-ja" }; // összetett szavak, ahol a szóhatár szerinti vágás a helyes
export function sylUnits(word) {
  const w = word.toLowerCase(), out = []; let i = 0;
  while (i < w.length) {
    const c = w[i];
    if (SYL_V.includes(c)) { out.push({ s: i, e: i + 1, v: true, t: c }); i++; continue; }
    const L = SYL_LONG.find(([lg]) => w.startsWith(lg, i));
    if (L) { out.push({ s: i, e: i + L[0].length, t: L[1], half: 1, long: L[0] }, { s: i, e: i + L[0].length, t: L[1], half: 2, long: L[0] }); i += L[0].length; continue; }
    const D = SYL_DI.find(d => w.startsWith(d, i));
    if (D) { out.push({ s: i, e: i + D.length, t: D }); i += D.length; continue; }
    out.push({ s: i, e: i + 1, t: c }); i++;
  }
  return out;
}
export function sylCuts(u) {
  const vi = u.map((x, i) => x.v ? i : -1).filter(i => i >= 0), cuts = [];
  for (let k = 0; k < vi.length - 1; k++) { const a = vi[k], b = vi[k + 1]; cuts.push(b - a - 1 === 0 ? b : b - 1); }
  return cuts;
}
export function sylSplit(word, u = sylUnits(word), cuts = new Set(sylCuts(u))) {
  const out = []; let cur = "";
  for (let i = 0; i < u.length; i++) {
    const x = u[i];
    if (cuts.has(i)) { out.push(cur); cur = ""; }
    if (x.long) { if (x.half === 1 && !cuts.has(i + 1)) { cur += word.slice(x.s, x.e); i++; } else cur += word.slice(x.s + 1, x.e); }
    else cur += word.slice(x.s, x.e);
  }
  out.push(cur); return out;
}
// Hány betű előtt van kötőjel (a "gap" = a betűk közötti hely sorszáma)
export const sylGaps = syl => { const g = []; let n = 0; for (const ch of syl) { if (ch === "-") g.push(n); else n++; } return g; };

// Nehézség: szótagszám + a nehezítő jelenségek; az 5 szint a szólista százalékos arányai szerint alakul
let SYL_ITEMS = null;
export function sylItems() {
  if (SYL_ITEMS) return SYL_ITEMS;
  const items = [];
  ALL_UNIQUE_WORDS.forEach(w => {
    if (!/^[a-záéíóöőúüű]+$/i.test(w)) return;
    const u = sylUnits(w), cuts = sylCuts(u); if (!cuts.length) return;
    const syl = SYL_FIX[w] || sylSplit(w, u).join("-"), n = cuts.length + 1;
    const choice = syl.replace(/-/g, "").toLowerCase() !== w.toLowerCase(); // hosszú kettős betű vágása: a betűk kétszer szerepelnek
    let s = n === 2 ? 0 : n === 3 ? 3 : n === 4 ? 5 : 7;
    if (choice) s += 3;
    if (u.some(x => x.long) && !choice) s += 1;
    if (u.some(x => !x.v && !x.long && x.e - x.s > 1)) s += 1;                        // kétjegyű betű
    if (cuts.some(c => u[c].v)) s += 2;                                                // magánhangzó-találkozás
    if (cuts.some(c => !u[c].v && u[c - 1] && !u[c - 1].v && u[c - 1].t !== u[c].t)) s += 1; // különböző mássalhangzók (ab-lak)
    let m = 0, run = 0; u.forEach(x => { if (x.v) run = 0; else { run++; m = Math.max(m, run); } });
    if (m >= 3) s += 2;
    if (w.length >= 8) s += 1;
    items.push({ w, syl, n, choice, s: s + w.length / 100 });
  });
  items.sort((a, b) => a.s - b.s);
  [.3, .55, .78, .92].forEach((q, k) => items.forEach((it, i) => { if (i >= Math.floor(items.length * q)) it.lvl = k + 2; }));
  items.forEach(it => { it.lvl = it.lvl || 1; });
  return SYL_ITEMS = items;
}
export const SYL_LVL_NAMES = ["", "Kezdő", "Haladó", "Ügyes", "Mester", "Szótagoló bajnok"];
export function sylState(u) {
  if (!u.syl) u.syl = { lvl: u.grade === 4 ? 2 : 1, hist: [], recent: [], miss: [] };
  return u.syl;
}
// 10 feladat: többnyire a jelenlegi szintről, néhány könnyebb és nehezebb; a legutóbbi szavak és a hibásak külön kezelve; könnyűtől a nehézig
export function sylQueue(u) {
  const S = sylState(u), all = sylItems(), L = S.lvl, recent = new Set(S.recent);
  const pool = lv => shuffle(all.filter(i => i.lvl === lv && !recent.has(i.w))).concat(shuffle(all.filter(i => i.lvl === lv && recent.has(i.w))));
  const chosen = [], used = new Set();
  const take = (list, n) => { for (const i of list) { if (n <= 0) break; if (!used.has(i.w)) { used.add(i.w); chosen.push(i); n--; } } };
  take(shuffle(S.miss.map(w => all.find(i => i.w === w)).filter(i => i && i.lvl <= L + 1)), 2);
  take(pool(L), 10 - chosen.length - 2 - (L < 5 ? 2 : 0));
  take(pool(Math.max(1, L - 1)), 2);
  if (L < 5) take(pool(L + 1), 2);
  take(pool(L), 10 - chosen.length);
  take(shuffle(all), 10 - chosen.length);
  chosen.sort((a, b) => a.lvl - b.lvl || Math.random() - .5);
  S.recent = [...S.recent, ...chosen.map(i => i.w)].slice(-60);
  return chosen.map(i => ({ type: "syl", word: i.w, item: i }));
}
// Kör végén: ≥90% → egy szinttel feljebb, ≤50% → egy szinttel lejjebb
export function sylAdapt(u, ok, n) {
  const S = sylState(u), r = ok / n, before = S.lvl;
  S.hist = [...S.hist, { d: todayKey(), lvl: before, ok, n }].slice(-12);
  if (r >= .9 && S.lvl < 5) S.lvl++; else if (r <= .5 && S.lvl > 1) S.lvl--;
  // (a mentést a váz végzi)
  return S.lvl - before;
}
export function sylExplain(word, syl) {
  const u = sylUnits(word), cuts = sylCuts(u), n = cuts.length + 1, msg = [`${n} magánhangzó van, ezért ${n} szótag: ${syl}.`];
  if (SYL_FIX[word]) { msg.push("Ennél a szónál a szóhatárnál (szóelemnél) vágunk."); return msg.join(" "); }
  if (cuts.some(c => u[c].v)) msg.push("Két magánhangzó között nincs mássalhangzó: a két magánhangzó külön szótagba kerül.");
  if (cuts.some(c => !u[c].v && u[c].long)) msg.push("A hosszú kettős betűt (pl. ssz, tty, nny) vágáskor kétszer írjuk le.");
  else if (cuts.some(c => !u[c].v && u[c - 1] && !u[c - 1].v)) msg.push("Két magánhangzó között több mássalhangzó van: csak az utolsó kerül a következő szótagba.");
  else if (cuts.some(c => !u[c].v)) msg.push("Két magánhangzó között egy mássalhangzó van: az a következő szótagba kerül.");
  if (u.some(x => !x.v && !x.long && x.e - x.s > 1)) msg.push("A kétjegyű betűt (cs, sz, ty, gy, ny, ly, zs, dz, dzs) nem vágjuk szét.");
  return msg.slice(0, 3).join(" ");
}
export function sylChoices(it) { // hosszú kettős betűs szavak: melyik a helyes szótagolás?
  const w = it.w, u = sylUnits(w), cuts = sylCuts(u), ci = cuts.find(c => u[c].long && u[c].half === 2);
  if (ci === undefined) return [it.syl];
  const x = u[ci], others = cuts.filter(c => c !== ci).map(c => u[c].s);
  const build = gaps => { let o = ""; [...w].forEach((ch, i) => { if (gaps.includes(i)) o += "-"; o += ch; }); return o; };
  const wrong = SYL_FIX[w] ? [sylSplit(w, u).join("-")] : [];
  for (let g = x.s; g < x.e; g++) { if (g > 0) wrong.push(build([...others, g])); }
  return shuffle([it.syl, ...shuffle([...new Set(wrong)].filter(s => s !== it.syl)).slice(0, 2)]);
}
