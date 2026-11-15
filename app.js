// ===== Helyesírás Kaland – alkalmazáslogika =====
// A szóadatok a words.js-ben vannak: export const WORD_SYNONYMS, M_LIST, JLY_RAW, PAIR_TASKS
import { WORD_SYNONYMS, M_LIST, JLY_RAW, PAIR_TASKS } from "./words.js";

const $ = id => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const btn = (cls, txt, fn) => { const b = el("button", cls, txt); b.type = "button"; if (fn) b.addEventListener("click", fn); return b; };

// ---------- 1. Firebase (dinamikus betöltés, offline-biztos) ----------
const firebaseConfig = {
  apiKey: "AIzaSyBqtbV2-nWHwllriImtc9hYLhVnsgaXoCc",
  authDomain: "helyesiras-kaland.firebaseapp.com",
  databaseURL: "https://helyesiras-kaland-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "helyesiras-kaland",
  storageBucket: "helyesiras-kaland.firebasestorage.app",
  messagingSenderId: "346262937393",
  appId: "1:346262937393:web:b256094d9a777aa6d69a10"
};
const FB_BASE = "https://www.gstatic.com/firebasejs/13.2.0/";
let db = null, fb = null, unsub = null, unsubP = null, applyingRemote = false, firstSync = true;
// Belépés (Firebase Authentication): fa = auth modul, authUser = belépett szülő, member = tagja-e a családnak
let fa = null, auth = null, authUser = null, member = false, cloudNote = "";
const EMAIL_KEY = "helyesiras_kaland_login_email";

async function initFirebase() {
  try {
    const [app, dbm, am] = await Promise.all([import(FB_BASE + "firebase-app.js"), import(FB_BASE + "firebase-database.js"), import(FB_BASE + "firebase-auth.js")]);
    const fApp = app.initializeApp(firebaseConfig);
    db = dbm.getDatabase(fApp);
    fb = dbm;
    auth = am.getAuth(fApp); auth.languageCode = "hu";
    fa = am;
    await finishEmailLink();
    fa.onAuthStateChanged(auth, u => {
      authUser = u; member = false; cloudNote = "";
      if (u) joinFamily(); else { connectCloud(); renderCloud(); }
    });
    return true;
  } catch (e) {
    console.warn("Firebase nem érhető el, offline mód:", e);
    setSync("☁️ Offline mód", "");
    return false;
  }
}

// ---------- 2. Szótárak ----------
const JLY_LIST = JLY_RAW.map(x => ({ w: x[0], hint: x[1] }));
const JLY_MAP = Object.fromEntries(JLY_LIST.map(x => [x.w, x]));
const M_UNIQUE = [...new Set(M_LIST)];
const ALL_UNIQUE_WORDS = new Set([...M_UNIQUE, ...JLY_LIST.map(x => x.w)]);

const PAIR_WHY = {
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

const LONG_PATTERNS = [
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
const FRAGS = ["cs", "ccs", "gy", "ggy", "ly", "j", "ny", "nny", "ty", "tty", "sz", "ssz", "zs", "zzs", "l", "ll", "n", "nn", "t", "tt", "r", "rr", "s", "ss", "z", "zz", "k", "kk", "m", "mm", "p", "pp", "b", "bb", "d", "dd", "g", "gg"];

function analyzeWord(word) {
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

function analyzeJlyWord(word) {
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
function cleanHint(word, text) {
  if (HINT_FIX[word]) return HINT_FIX[word];
  const all = text.split(/,\s*(?![^()]*\))/), keep = all.filter(p => !hintLeaks(word, p));
  if (keep.length < 2) all.filter(p => hintLeaks(word, p)).forEach(p => { const m = maskWord(word, p); if (m && keep.length < 4) keep.push(m); });
  return keep.length ? keep.join(", ") : "Gondolj a szó jelentésére, és hallgasd meg a hangokat!";
}
const hintCache = {};

// raw = true: a teljes szöveg (csak válasz UTÁN, vagy az albumban használjuk)
function getSynonymsForWord(word, raw = false) {
  const src = WORD_SYNONYMS[word] || (JLY_MAP[word] && JLY_MAP[word].hint) || "";
  if (!src) return "Keresd meg a betűkből összeálló magyar szót!";
  if (raw) return src;
  return hintCache[word] || (hintCache[word] = cleanHint(word, src));
}

// Hibás válasz utáni, mondatos magyarázat
function explainWord(w) {
  if (JLY_MAP[w]) return `A(z) „${w}” j/ly szó: ezt nem lehet kiejtésből eldönteni, meg kell jegyezni. Jelentése: ${getSynonymsForWord(w, true)}.`;
  const i = analyzeWord(w);
  if (i) return i.hasLong
    ? `A(z) „${w}” szóban hosszú mássalhangzó van: „${i.longPart}”. Mondd ki hangosan, a hosszú hangot hosszabban ejtjük.`
    : `A(z) „${w}” szóban rövid „${i.shortPart}” van, nem „${i.longPart}”.`;
  return `Nézd meg még egyszer a szót: ${w}.`;
}

// ---------- 3. Dátum, állapot, mentés ----------
const dayNum = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5);
const dateKey = n => new Date(n * 864e5).toISOString().slice(0, 10);
const todayKey = () => dateKey(dayNum());
const INTERVALS = [1, 1, 3, 7, 14]; // Leitner-dobozok: ennyi nap múlva jön vissza a szó

const newUser = (av = "🦉") => ({ pts: 0, avatar: av, mastered: [], practiced: [], mistakes: [], daily: {}, srs: {}, stats: {}, streak: { n: 0, last: "" }, badges: [], upd: 0 });
const STORE_KEY = "helyesiras_kaland_v4";
let state = JSON.parse(localStorage.getItem(STORE_KEY) || "null") || { familyCode: "", current: "Játékos", users: { "Játékos": newUser() } };
state.settings = Object.assign({ level: 1, autoNext: true, dyslexia: false, goal: 10 }, state.settings || {});

function normUser(u) {
  const arr = x => Array.isArray(x) ? x : Object.values(x || {});
  u.pts = u.pts || 0; u.avatar = u.avatar || "🦉";
  u.mastered = arr(u.mastered); u.practiced = arr(u.practiced); u.mistakes = arr(u.mistakes); u.badges = arr(u.badges);
  u.daily = u.daily || {}; u.srs = u.srs || {}; u.stats = u.stats || {};
  u.streak = u.streak || { n: 0, last: "" }; u.upd = u.upd || 0;
  // régi "mastered" lista átvétele a Leitner-rendszerbe
  u.mastered.forEach(w => { if (!u.srs[w]) u.srs[w] = { b: 2, days: 2, strong: 0, last: "", due: dayNum() }; });
  u.mastered = [];
  // a régi, már 3 napos szavak megtartják az elsajátított státuszt
  Object.values(u.srs).forEach(r => { if (r.days >= 3 && r.strong === undefined) { r.strong = 1; r.rf = 0; r.due = Math.max(r.due || 0, dayNum() + 30); } });
  u.theme = u.theme || "";
  u.best = Math.max(u.best || 0, u.streak.n || 0);          // legjobb sorozat (nem veszik el, ha megszakad)
  u.maxM = Math.max(u.maxM || 0, masteredCount(u));         // legtöbb elsajátított szó
  if (!Array.isArray(u.unl)) u.unl = Array.isArray(u.unl) ? u.unl : (u.unl ? Object.values(u.unl) : REWARDS.filter(r => isUnlocked(u, r)).map(rewardKey));
  return u;
}
function curUser() {
  if (!state.users[state.current]) state.users[state.current] = newUser();
  return normUser(state.users[state.current]);
}
const REFRESH = [30, 60, 90]; // elsajátítás után ennyi nap múlva jön vissza a szó
const isMastered = r => !!r && r.days >= 3 && (r.strong || 0) >= 1;
const masteredCount = u => Object.values(u.srs).filter(isMastered).length;
const persist = () => localStorage.setItem(STORE_KEY, JSON.stringify(state));

function setSync(text, cls) { const e = $("mon-sync"); if (e) { e.textContent = text; e.className = "sync-badge " + (cls || ""); } }
const safeKey = n => n.replace(/[.$#\[\]\/]/g, "_");
const famCode = () => (state.familyCode || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
// A családkód már csak a család belső azonosítója: hozzáférést a belépett, a családhoz hozzáadott e-mail-cím ad
const emailKey = e => (e || "").trim().toLowerCase().replace(/\./g, ",");
const myKey = () => emailKey(authUser && authUser.email);
const cloudReady = () => !!(fb && db && authUser && member && famCode().length >= 6);

// Felhőbe küldés kötegelve: játék közben nem minden válasz után, hanem a kör végén,
// legkésőbb percenként, illetve amikor a lap háttérbe kerül / bezárják. Helyben (localStorage) mindig azonnal ment,
// így ha a felhőbe küldés elmaradna, a következő kapcsolódáskor a frissebb helyi adat felmegy.
const PUSH_DELAY = 60000;
const pendingPush = new Set();
let pushT = null;
function queuePush(name) {
  if (!cloudReady()) return;
  pendingPush.add(name);
  if (!pushT) pushT = setTimeout(flushPush, PUSH_DELAY);
}
function flushPush() {
  clearTimeout(pushT); pushT = null;
  const names = [...pendingPush]; pendingPush.clear();
  names.forEach(pushUser);
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushPush(); });
addEventListener("pagehide", flushPush);

// Felhasználónkénti mentés: egy játékos írása nem írja felül a többiekét
function pushUser(name) {
  const c = famCode();
  if (!cloudReady() || applyingRemote || !state.users[name]) return;
  fb.set(fb.ref(db, `families/${c}/users/${safeKey(name)}`), { ...state.users[name], name })
    .then(() => setSync("☁️ Szinkronban", "online")).catch(() => setSync("⚠️ Szinkron hiba", "err"));
}
function saveState(touch = true) {
  if (touch) curUser().upd = Date.now();
  persist();
  queuePush(state.current);
}

function connectCloud() {
  if (unsub) { unsub(); unsub = null; }
  if (unsubP) { unsubP(); unsubP = null; }
  const c = famCode();
  if (!fb) { setSync("☁️ Offline mód", ""); return; }
  if (!authUser) { setSync("☁️ Helyi mód – Belépés", ""); return; }
  if (!cloudReady()) { setSync("☁️ Család beállítása", ""); return; }
  setSync("⏳ Kapcsolódás…", ""); firstSync = true;
  // Szülői PIN (sózott hash): a legújabb felhős érték minden eszközre eljut
  unsubP = fb.onValue(fb.ref(db, `families/${c}/parent`), snap => {
    const r = snap.val();
    if (r && r.hash && r.salt) { if (!state.parent || r.hash !== state.parent.hash) { state.parent = { salt: r.salt, hash: r.hash }; persist(); } }
    else if (state.parent) pushParent();
  });
  unsub = fb.onValue(fb.ref(db, `families/${c}/users`), snap => {
    const remote = snap.val() || {};
    let changed = false;
    applyingRemote = true;
    Object.entries(remote).forEach(([k, r]) => {
      const name = r.name || k, l = state.users[name];
      if (!l || (r.upd || 0) > (l.upd || 0)) { state.users[name] = normUser(r); delete state.users[name].name; changed = true; }
    });
    applyingRemote = false;
    if (!state.users[state.current]) state.current = Object.keys(state.users)[0] || "Játékos";
    persist();
    if (firstSync) { // első kapcsolódáskor a újabb helyi adatokat feltöltjük
      firstSync = false;
      Object.keys(state.users).forEach(n => { const r = remote[safeKey(n)]; if (!r || (state.users[n].upd || 0) > (r.upd || 0)) pushUser(n); });
    }
    setSync("☁️ Szinkronban", "online");
    if (changed) refreshViews();
  }, () => setSync("⚠️ Hozzáférés megtagadva", "err"));
}

// ---------- 4. Kis segédek: felugró ablak, toast, konfetti ----------
function modal({ title, text = "", value = null, ok = "OK", cancel = "Mégse", secret = false }) {
  return new Promise(res => {
    const m = $("modal"), box = m.firstElementChild;
    box.innerHTML = "";
    box.append(el("h3", null, title));
    if (text) box.append(el("p", null, text));
    let inp = null;
    if (value !== null) { inp = el("input", "minp"); inp.value = value; inp.maxLength = 40; if (secret) { inp.type = "password"; inp.inputMode = "numeric"; } box.append(inp); }
    const done = v => { m.classList.remove("on"); res(v); };
    const row = el("div", "mbtns");
    if (cancel) row.append(btn("secondary", cancel, () => done(null)));
    row.append(btn("primary", ok, () => done(inp ? inp.value : true)));
    box.append(row);
    m.classList.add("on");
    if (inp) { inp.focus(); inp.addEventListener("keydown", e => { if (e.key === "Enter") done(inp.value); if (e.key === "Escape") done(null); }); }
  });
}
let toastT;
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600); }

function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = $("confetti"), ctx = cv.getContext("2d");
  cv.width = innerWidth; cv.height = innerHeight;
  const cols = ["#7c3aed", "#ec4899", "#f59e0b", "#22c55e", "#06b6d4"];
  const ps = Array.from({ length: 140 }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .5, vx: Math.random() * 4 - 2, vy: 2 + Math.random() * 4, s: 6 + Math.random() * 6, c: cols[Math.random() * cols.length | 0], r: Math.random() * 6 }));
  const t0 = performance.now();
  (function frame(t) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += .1; ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
    if (t - t0 < 2800) requestAnimationFrame(frame); else ctx.clearRect(0, 0, cv.width, cv.height);
  })(t0);
}

// ---------- 5. Jelvények ----------
const total = u => Object.values(u.stats).reduce((a, s) => a + (s.ok || 0), 0);
const okOf = (u, k) => (u.stats[k] && u.stats[k].ok) || 0;
const BADGES = [
  { id: "first", ic: "🌱", n: "Első helyes válasz", t: u => total(u) >= 1 },
  { id: "jly10", ic: "✍️", n: "10 helyes j/ly szó", t: u => okOf(u, "jly") >= 10 },
  { id: "long25", ic: "🔠", n: "25 helyes hosszú/rövid", t: u => okOf(u, "hosszu") >= 25 },
  { id: "pair10", ic: "⚖️", n: "10 helyes jelentéskülönbség", t: u => okOf(u, "pair") >= 10 },
  { id: "tiles10", ic: "🔤", n: "10 kirakott szó", t: u => okOf(u, "tiles") >= 10 },
  { id: "streak3", ic: "🔥", n: "3 napos sorozat", t: u => u.streak.n >= 3 },
  { id: "streak7", ic: "🌋", n: "7 napos sorozat", t: u => u.streak.n >= 7 },
  { id: "m25", ic: "🏆", n: "25 elsajátított szó", t: u => masteredCount(u) >= 25 },
  { id: "pts500", ic: "💎", n: "500 pont", t: u => u.pts >= 500 },
  { id: "perfect", ic: "🎯", n: "Hibátlan kör", t: () => false } // a kör végén adjuk
];
let sessionBadges = [];
function awardBadge(u, b) { if (!u.badges.includes(b.id)) { u.badges.push(b.id); sessionBadges.push(b); toast(`${b.ic} Új jelvény: ${b.n}`); } }
function checkBadges(u) { BADGES.forEach(b => b.t(u) && awardBadge(u, b)); }

// ---------- 6. Képernyők ----------
function syncMascots() { const av = curUser().avatar; document.querySelectorAll(".mascot").forEach(e => e.textContent = av); }
function updateBar() { document.body.dataset.theme = curUser().theme || ""; syncMascots(); $("mon-today").textContent = curUser().daily[todayKey()] || 0; }
function applySettings() { document.body.classList.toggle("dys", !!state.settings.dyslexia); }

const RANKS = [{ min: 0, name: "Kezdő Betűvadász" }, { min: 150, name: "Helyesírás Inas" }, { min: 400, name: "Mássalhangzó Mester" }, { min: 800, name: "Betűvarázsló" }, { min: 1500, name: "Nyelvtan Bajnok" }];

function dueWords(u) {
  const t = dayNum();
  return [...new Set([...u.mistakes, ...Object.keys(u.srs).filter(w => u.srs[w].due <= t)])].filter(w => ALL_UNIQUE_WORDS.has(w));
}
const MODE_TOPIC = { choice: "hosszu", gap: "hosszu", jly: "jly", tiles: "tiles", pairs: "pair" };
const blockedTopics = u => (u.block && u.block.day === todayKey()) ? Object.values(u.block.topics || {}) : [];
const topicOf = t => t.type === "pair" ? "pair" : t.type === "jly" ? "jly" : t.type === "tiles" ? "tiles" : "hosszu";
function streakNow(u) { const t = dayNum(); return (u.streak.last === dateKey(t) || u.streak.last === dateKey(t - 1)) ? u.streak.n : 0; }

function renderLevels() {
  const w = $("levels"); w.innerHTML = "";
  [[1, "Kezdő", "2 opció"], [2, "Haladó", "3 opció"], [3, "Mester", "4 opció / gépelés"]].forEach(([n, a, b]) => {
    w.append(btn("lvl" + (state.settings.level === n ? " on" : ""), `${a} · ${b}`, () => { state.settings.level = n; persist(); renderLevels(); }));
  });
}

function updateHome() {
  const u = curUser();
  $("hello-txt").textContent = "Szia, " + state.current + "!";
  $("st-pts").textContent = u.pts;
  $("st-done").textContent = masteredCount(u);
  $("st-streak").textContent = streakNow(u);
  $("st-goal").textContent = Math.min(u.daily[todayKey()] || 0, 999) + "/" + state.settings.goal;
  let r = 0; RANKS.forEach((x, i) => { if (u.pts >= x.min) r = i; });
  const cur = RANKS[r], nxt = RANKS[r + 1];
  $("rank-name").textContent = cur.name;
  $("rank-cur").textContent = u.pts + " pont";
  if (nxt) { $("rank-bar").style.width = Math.min(100, Math.round((u.pts - cur.min) / (nxt.min - cur.min) * 100)) + "%"; $("rank-next").textContent = `Következő: ${nxt.name} (${nxt.min} p)`; }
  else { $("rank-bar").style.width = "100%"; $("rank-next").textContent = "Legmagasabb szint elérve!"; }
  const n = dueWords(u).length;
  $("btn-mistakes").style.display = n ? "flex" : "none";
  $("mistake-cnt").textContent = n;
  const bl = blockedTopics(u);
  Object.entries(MODE_TOPIC).forEach(([m, tp]) => { const b = $("btn-" + m), off = bl.includes(tp); b.disabled = off; b.title = off ? "Ma lezárva" : ""; });
  $("lock-note").textContent = bl.length ? "🔒 Ma néhány feladatot lezártak, hogy a nehezebbekre jusson idő." : "";
  renderLevels(); updateBar();
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("on"));
  $(id).classList.add("on");
  if (id === "scr-home") updateHome();
  if (id === "scr-users") renderUsers();
  if (id === "scr-stats") renderStats();
  if (id === "scr-parent") renderParent();
  if (id === "scr-album") renderAlbum();
  updateBar();
  scrollTo(0, 0);
}
function goHome() { clearTimeout(autoT); flushPush(); $("sheet").classList.remove("on"); showScreen("scr-home"); }
function refreshViews() {
  if ($("scr-home").classList.contains("on")) updateHome();
  if ($("scr-users").classList.contains("on")) renderUsers();
  if ($("scr-stats").classList.contains("on")) renderStats();
  updateBar();
}

// ---------- 7. Profilok (váltás, átnevezés, törlés) ----------
const AVATARS = ["🦉", "🦊", "🐻", "🐱", "🐶", "🐰", "🐧", "🦁", "🐼", "🦄", "🐲", "🐸"];
let selectedAvatar = "🦉";

// ---- Jutalmak: pontból, napi sorozatból és elsajátított szavakból nyithatók ----
// by: "pts" = pont, "streak" = napi sorozat (a legjobb számít), "words" = elsajátított szavak (a legtöbb számít)
const REWARDS = [
  // pontok
  { k: "avatar", v: "🦖", by: "pts", n: 100 }, { k: "avatar", v: "🐙", by: "pts", n: 250 }, { k: "avatar", v: "🦋", by: "pts", n: 400 },
  { k: "avatar", v: "🚀", by: "pts", n: 600 }, { k: "avatar", v: "👑", by: "pts", n: 900 }, { k: "avatar", v: "🐉", by: "pts", n: 1500 },
  { k: "avatar", v: "🧙", by: "pts", n: 2500 }, { k: "avatar", v: "🛸", by: "pts", n: 4000 }, { k: "avatar", v: "🏆", by: "pts", n: 6000 },
  { k: "theme", v: "sunset", name: "Naplemente", by: "pts", n: 150 }, { k: "theme", v: "ocean", name: "Óceán", by: "pts", n: 400 },
  { k: "theme", v: "forest", name: "Erdő", by: "pts", n: 800 }, { k: "theme", v: "galaxy", name: "Galaxis", by: "pts", n: 1500 },
  { k: "theme", v: "aurora", name: "Sarki fény", by: "pts", n: 3000 },
  // napi sorozat
  { k: "avatar", v: "🦅", by: "streak", n: 7 }, { k: "avatar", v: "🐺", by: "streak", n: 14 }, { k: "avatar", v: "🦚", by: "streak", n: 30 },
  { k: "avatar", v: "🐘", by: "streak", n: 60 }, { k: "avatar", v: "🦈", by: "streak", n: 100 },
  { k: "theme", v: "candy", name: "Cukorka", by: "streak", n: 14 }, { k: "theme", v: "ember", name: "Parázs", by: "streak", n: 30 },
  // elsajátított szavak
  { k: "avatar", v: "🦔", by: "words", n: 50 }, { k: "avatar", v: "🦥", by: "words", n: 100 }, { k: "avatar", v: "🦩", by: "words", n: 150 },
  { k: "avatar", v: "🐋", by: "words", n: 200 }, { k: "avatar", v: "🦜", by: "words", n: 300 }, { k: "avatar", v: "🧞", by: "words", n: 400 },
  { k: "avatar", v: "🧠", by: "words", n: 500 },
  { k: "theme", v: "mint", name: "Menta", by: "words", n: 100 }, { k: "theme", v: "peach", name: "Barack", by: "words", n: 250 },
  // autók és járművek
  { k: "avatar", c: "car", v: "🚓", by: "pts", n: 120 }, { k: "avatar", c: "car", v: "🚑", by: "pts", n: 300 }, { k: "avatar", c: "car", v: "🚒", by: "pts", n: 700 },
  { k: "avatar", c: "car", v: "🏍️", by: "streak", n: 7 }, { k: "avatar", c: "car", v: "🏎️", by: "streak", n: 30 },
  { k: "avatar", c: "car", v: "🚜", by: "words", n: 50 }, { k: "avatar", c: "car", v: "🚁", by: "words", n: 150 }, { k: "avatar", c: "car", v: "✈️", by: "words", n: 300 },
  // műszaki
  { k: "avatar", c: "tech", v: "⚙️", by: "pts", n: 180 }, { k: "avatar", c: "tech", v: "🔋", by: "pts", n: 450 }, { k: "avatar", c: "tech", v: "🛰️", by: "pts", n: 1100 },
  { k: "avatar", c: "tech", v: "🧲", by: "streak", n: 14 }, { k: "avatar", c: "tech", v: "🔭", by: "streak", n: 60 },
  { k: "avatar", c: "tech", v: "🔬", by: "words", n: 100 }, { k: "avatar", c: "tech", v: "🎮", by: "words", n: 200 }, { k: "avatar", c: "tech", v: "📡", by: "words", n: 400 },
  // lányos
  { k: "avatar", c: "girl", v: "🌷", by: "pts", n: 130 }, { k: "avatar", c: "girl", v: "👗", by: "pts", n: 350 }, { k: "avatar", c: "girl", v: "💎", by: "pts", n: 800 },
  { k: "avatar", c: "girl", v: "🧚", by: "streak", n: 7 }, { k: "avatar", c: "girl", v: "👸", by: "streak", n: 14 }, { k: "avatar", c: "girl", v: "🩰", by: "streak", n: 60 },
  { k: "avatar", c: "girl", v: "🍓", by: "words", n: 100 }, { k: "avatar", c: "girl", v: "💄", by: "words", n: 200 }, { k: "avatar", c: "girl", v: "🌈", by: "words", n: 350 },
  // édességek
  { k: "avatar", c: "sweet", v: "🍩", by: "pts", n: 140 }, { k: "avatar", c: "sweet", v: "🍪", by: "pts", n: 320 }, { k: "avatar", c: "sweet", v: "🍰", by: "pts", n: 650 },
  { k: "avatar", c: "sweet", v: "🍫", by: "streak", n: 7 }, { k: "avatar", c: "sweet", v: "🥧", by: "streak", n: 30 }, { k: "avatar", c: "sweet", v: "🍨", by: "streak", n: 100 },
  { k: "avatar", c: "sweet", v: "🧁", by: "words", n: 50 }, { k: "avatar", c: "sweet", v: "🍮", by: "words", n: 150 }, { k: "avatar", c: "sweet", v: "🎂", by: "words", n: 300 }
];
// avatar-kategóriák; a "free" lista mindenkinek elérhető
const AV_CATS = [
  { id: "animal", label: "🦉 Állatok és mesék", free: AVATARS },
  { id: "car", label: "🚗 Autók és járművek", free: ["🚗", "🚕", "🚙"] },
  { id: "tech", label: "🔧 Műszaki", free: ["🤖", "🔧", "💡"] },
  { id: "girl", label: "🎀 Lányos", free: ["🎀", "🌸", "💖"] },
  { id: "sweet", label: "🍭 Édességek", free: ["🍭", "🍬", "🍦"] }
];
const avCat = v => (AV_CATS.find(c => c.free.includes(v)) || { id: (REWARDS.find(r => r.k === "avatar" && r.v === v) || {}).c || "animal" }).id;
let avTab = "";
const BY_TXT = { pts: n => `${n} pont`, streak: n => `${n} napos sorozat`, words: n => `${n} elsajátított szó` };
const BY_ICON = { pts: "⭐", streak: "🔥", words: "🃏" };
const rewardKey = r => r.k + ":" + r.v;
const rewardLabel = r => r.k === "avatar" ? r.v : "🎨 " + r.name;
function progress(u) { return { pts: u.pts || 0, streak: Math.max(u.best || 0, streakNow(u)), words: Math.max(u.maxM || 0, masteredCount(u)) }; }
function isUnlocked(u, r) { return progress(u)[r.by] >= r.n; }
const BY_UNIT = { pts: "p", streak: "nap", words: "szó" };
const shortReq = r => `${BY_ICON[r.by]} ${r.n} ${BY_UNIT[r.by]}`;
function lockText(u, r) { const have = progress(u)[r.by]; return `Ehhez ${BY_TXT[r.by](r.n)} kell (most: ${have})`; }

// Új jutalmak értesítése (a régieket az első betöltéskor csendben megjegyezzük)
function checkUnlocks(u) {
  const fresh = REWARDS.filter(r => isUnlocked(u, r) && !u.unl.includes(rewardKey(r)));
  fresh.forEach(r => u.unl.push(rewardKey(r)));
  if (fresh.length > 3) { setTimeout(() => toast(`🔓 ${fresh.length} új jutalom nyílt meg! Nézd meg a Gyűjteményben.`), 1700); return; }
  fresh.forEach((r, i) => setTimeout(() => toast(`🔓 Új ${r.k === "avatar" ? "avatar" : "kinézet"}: ${rewardLabel(r)}  (${BY_TXT[r.by](r.n)})`), 1700 * (i + 1)));
}

function renderAvatarPicker(p = $("avatar-picker"), after = renderUsers) {
  p.innerHTML = "";
  const u = curUser();
  if (!avTab || !AV_CATS.some(c => c.id === avTab)) avTab = avCat(u.avatar);
  const itemsOf = id => [...AV_CATS.find(c => c.id === id).free.map(v => ({ v, r: null })), ...REWARDS.filter(r => r.k === "avatar" && (r.c || "animal") === id).map(r => ({ v: r.v, r }))];

  const tabs = el("div", "levels"); tabs.style.cssText = "width:100%;margin-bottom:6px";
  AV_CATS.forEach(c => {
    const it = itemsOf(c.id), got = it.filter(x => !x.r || isUnlocked(u, x.r)).length;
    tabs.append(btn("lvl" + (c.id === avTab ? " on" : ""), `${c.label} (${got}/${it.length})`, () => { avTab = c.id; renderAvatarPicker(p, after); }));
  });
  const grid = el("div"); grid.style.cssText = "display:flex;flex-wrap:wrap;justify-content:center;gap:8px;width:100%";
  itemsOf(avTab).forEach(({ v, r }) => {
    const locked = r && !isUnlocked(u, r), sel = v === u.avatar;
    const b = btn("avcell" + (sel ? " sel" : "") + (locked ? " locked" : ""), "", () => {
      if (locked) { toast(lockText(u, r)); return; }
      selectedAvatar = v; u.avatar = v; saveState(); after();
    });
    b.append(el("span", "ae", v), el("small", null, locked ? "🔒 " + shortReq(r) : sel ? "✓" : ""));
    b.setAttribute("aria-label", locked ? "Zárolt avatar. " + lockText(u, r) : "Avatar: " + v);
    if (locked) b.title = lockText(u, r);
    grid.append(b);
  });
  p.append(tabs, grid);
}

function renderUsers() {
  selectedAvatar = curUser().avatar;
  renderAvatarPicker(); syncMascots();
  const list = $("user-list"); list.innerHTML = "";
  Object.keys(state.users).forEach(name => {
    const row = el("div", "urow");
    const sel = btn("profile" + (name === state.current ? " cur" : ""), "", () => { state.current = name; persist(); goHome(); });
    sel.append(el("span", null, (state.users[name].avatar || "🦉") + " " + name), el("span", null, (state.users[name].pts || 0) + " p"));
    const ren = btn("iconbtn sm", "✏️", () => renameUser(name)); ren.setAttribute("aria-label", name + " átnevezése");
    const del = btn("iconbtn sm", "🗑️", () => deleteUser(name)); del.setAttribute("aria-label", name + " törlése");
    row.append(sel, ren, del); list.append(row);
  });
}

function addUser() {
  const inp = $("new-user-inp"), name = inp.value.trim();
  if (!name) return;
  if (!state.users[name]) state.users[name] = newUser(selectedAvatar);
  state.current = name; inp.value = "";
  saveState(); goHome();
}

async function renameUser(old) {
  const v = await modal({ title: "Átnevezés", value: old, ok: "Mentés" });
  const name = v && v.trim();
  if (!name || name === old) return;
  if (state.users[name]) { toast("Már van ilyen nevű játékos."); return; }
  state.users[name] = state.users[old]; delete state.users[old];
  if (state.current === old) state.current = name;
  state.users[name].upd = Date.now();
  persist(); pushUser(name);
  if (cloudReady()) fb.remove(fb.ref(db, `families/${famCode()}/users/${safeKey(old)}`));
  renderUsers();
}

async function deleteUser(name) {
  if (!(await requirePin("Törlés PIN-kóddal", `„${name}” törléséhez írd be a szülői PIN-kódot.`))) return;
  const ok = await modal({ title: `Törlöd: ${name}?`, text: "A játékos pontjai és haladása végleg elvesznek.", ok: "Törlés" });
  if (!ok) return;
  delete state.users[name];
  if (cloudReady()) fb.remove(fb.ref(db, `families/${famCode()}/users/${safeKey(name)}`));
  if (state.current === name) state.current = Object.keys(state.users)[0] || "Játékos";
  curUser(); persist(); renderUsers(); updateBar();
}

// ---------- 8. Statisztika képernyő ----------
const TOPICS = { jly: "j / ly", hosszu: "Hosszú mássalhangzó", pair: "Jelentéskülönbség", tiles: "Betűkirakó" };

function renderStats() {
  const u = curUser(), t = dayNum(), box = $("stats-body"); box.innerHTML = "";
  const panel = (title) => { const p = el("div", "panel"); p.append(el("h3", null, title)); box.append(p); return p; };

  const sum = panel("Összegzés");
  [`⭐ ${u.pts} pont`, `🏆 ${masteredCount(u)} elsajátított szó`, `📚 ${u.practiced.length}/${ALL_UNIQUE_WORDS.size} már gyakorolt szó`, `🔥 ${streakNow(u)} napos sorozat`].forEach(s => sum.append(el("div", null, s)));

  const wk = panel("Utolsó 7 nap (helyes válaszok)");
  const days = [...Array(7)].map((_, i) => t - 6 + i), vals = days.map(d => u.daily[dateKey(d)] || 0);
  const max = Math.max(state.settings.goal, ...vals, 1), chart = el("div", "chart");
  const names = ["V", "H", "K", "Sze", "Cs", "P", "Szo"];
  days.forEach((d, i) => {
    const c = el("div", "col"), bar = el("i");
    bar.style.height = Math.round(vals[i] / max * 90) + "px";
    c.append(el("b", null, vals[i]), bar, el("span", null, names[new Date(d * 864e5).getUTCDay()]));
    chart.append(c);
  });
  wk.append(chart);

  const tp = panel("Témák pontossága");
  let weakest = null;
  Object.entries(TOPICS).forEach(([k, label]) => {
    const s = u.stats[k] || { ok: 0, n: 0 }, pct = s.n ? Math.round(s.ok / s.n * 100) : 0;
    if (s.n >= 5 && (!weakest || pct < weakest.pct)) weakest = { label, pct };
    const row = el("div", "trow"), bar = el("div", "bar"), i = el("i");
    i.style.width = pct + "%"; bar.append(i);
    row.append(el("span", null, label), bar, el("span", null, s.n ? pct + "%" : "–"));
    tp.append(row);
  });
  if (weakest) tp.append(el("p", null, `💡 Ezt érdemes többet gyakorolni: ${weakest.label}`));

  const bd = panel(`Jelvények (${u.badges.length}/${BADGES.length})`), g = el("div", "badgegrid");
  BADGES.forEach(b => { const d = el("div", "badge" + (u.badges.includes(b.id) ? "" : " locked")); d.append(el("span", null, b.ic), document.createTextNode(b.n)); g.append(d); });
  bd.append(g);

  const st = panel("Beállítások");
  const row = (label, ctl) => { const r = el("label", "setrow"); r.append(el("span", null, label), ctl); st.append(r); };
  const cb = (key, fn) => { const c = el("input"); c.type = "checkbox"; c.checked = !!state.settings[key]; c.addEventListener("change", () => { state.settings[key] = c.checked; persist(); fn && fn(); }); return c; };
  row("Automatikus továbblépés helyes válasz után", cb("autoNext"));
  row("Diszlexia-barát betűtípus", cb("dyslexia", applySettings));
  const sel = el("select"); [5, 10, 15, 20].forEach(n => { const o = el("option", null, n + " szó"); o.value = n; if (n === state.settings.goal) o.selected = true; sel.append(o); });
  sel.addEventListener("change", () => { state.settings.goal = +sel.value; persist(); });
  row("Napi cél", sel);
  const br = el("div", "btnrow");
  br.append(btn("secondary", "☁️ Felhős mentés", openCloud), btn("secondary", "⬇️ Adatok exportálása", exportData));
  st.append(br);
}

// ---------- Felhős mentés: belépés és család ----------
// Adatbázis: families/{kód}/members/{e-mail} = true, families/{kód}/users/..., families/{kód}/parent
//            memberOf/{e-mail}/{kód} = true  (ebből tudja egy új eszköz, melyik családhoz tartozol)
// Az e-mail-címben a pont vesszőre cserélődik (a Firebase kulcsban nem lehet pont). Szabályok: database.rules.json
function fbError(e) {
  const c = (e && e.code) || "";
  if (/permission.denied|PERMISSION_DENIED/i.test(c + (e && e.message))) return "Nincs jogosultság.";
  if (c.includes("network")) return "Nincs internetkapcsolat – később újrapróbálom.";
  if (c.includes("invalid-action-code") || c.includes("expired-action-code")) return "A belépő link lejárt vagy már felhasználták. Kérj újat!";
  if (c.includes("invalid-email")) return "Hibás e-mail-cím.";
  if (c.includes("unauthorized-domain") || c.includes("unauthorized-continue-uri")) return "Ez a webcím nincs engedélyezve a Firebase-ben (Authentication → Settings → Authorized domains).";
  if (c.includes("operation-not-allowed")) return "Ez a belépési mód nincs bekapcsolva a Firebase-ben (Authentication → Sign-in method).";
  if (c.includes("popup-blocked")) return "A böngésző letiltotta a felugró ablakot. Engedélyezd, vagy lépj be e-mailes linkkel.";
  return (e && e.message) || "Ismeretlen hiba.";
}

// Ha az e-mailben kapott belépő linkről érkeztünk vissza, befejezzük a belépést
async function finishEmailLink() {
  if (!fa.isSignInWithEmailLink(auth, location.href)) return;
  const link = location.href;
  history.replaceState(null, "", location.pathname); // a kódot eltüntetjük a címsorból
  let em = null;
  try { em = localStorage.getItem(EMAIL_KEY); } catch (e) { /* privát mód */ }
  if (!em) em = await modal({ title: "Belépés befejezése", text: "Add meg újra az e-mail-címedet:", value: "", ok: "Belépés" });
  if (!em) return;
  try { await fa.signInWithEmailLink(auth, em.trim(), link); } catch (e) { toast("❌ " + fbError(e)); }
  try { localStorage.removeItem(EMAIL_KEY); } catch (e) { /* mindegy */ }
}

// Belépés után: megkeressük a családot. Ha még nincs, de ezen az eszközön van régi szinkronkód,
// azt a családot „igényeljük” – így a felhőben már meglévő adatok a helyükön maradnak.
async function joinFamily() {
  setSync("⏳ Kapcsolódás…", "");
  try {
    const mine = Object.keys((await fb.get(fb.ref(db, `memberOf/${myKey()}`))).val() || {});
    if (mine.length) {
      if (!mine.includes(famCode())) { state.familyCode = mine[0]; persist(); }
      member = true;
    } else if (famCode().length >= 6) {
      member = await claimFamily(famCode());
      if (!member) cloudNote = "❌ Ezt a családot már egy másik szülő igényelte. Kérd meg, hogy a Felhős mentés panelen adja hozzá az e-mail-címedet, aztán nyomd meg az „Újra ellenőrzöm” gombot.";
    }
  } catch (e) { console.warn(e); cloudNote = "❌ " + fbError(e); }
  firstSync = true;
  connectCloud(); renderCloud();
}
async function claimFamily(code) {
  try {
    await fb.set(fb.ref(db, `families/${code}/members/${myKey()}`), true); // előbb tag leszünk…
    await fb.set(fb.ref(db, `memberOf/${myKey()}/${code}`), true);        // …utána írhatjuk a mutatót
    return true;
  } catch (e) { console.warn(e); return false; }
}
async function createFamily() {
  const code = "f" + [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, "0")).join("");
  if (await claimFamily(code)) { state.familyCode = code; persist(); member = true; cloudNote = ""; firstSync = true; connectCloud(); }
  else cloudNote = "❌ Nem sikerült létrehozni a családot.";
  renderCloud();
}
async function addMember(em) {
  em = (em || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { cloudNote = "❌ Ez nem tűnik e-mail-címnek."; return renderCloud(); }
  cloudOpen = false;
  const ok = await requirePin("Családtag hozzáadása", "Írd be a szülői PIN-kódot.");
  if (ok) {
    try {
      await fb.set(fb.ref(db, `families/${famCode()}/members/${emailKey(em)}`), true);
      await fb.set(fb.ref(db, `memberOf/${emailKey(em)}/${famCode()}`), true);
      cloudNote = `✅ ${em} hozzáadva. Ha ezzel a címmel belép, látni fogja a családot.`;
    } catch (e) { cloudNote = "❌ " + fbError(e); }
  }
  openCloud();
}
async function removeMember(k, count) {
  const me = k === myKey(), em = k.replace(/,/g, ".");
  if (me && count <= 1) { cloudNote = "❌ Te vagy az egyetlen tag – előbb adj hozzá valaki mást."; return renderCloud(); }
  cloudOpen = false;
  const ok = await requirePin(me ? "Kilépés a családból" : `${em} eltávolítása`, "Írd be a szülői PIN-kódot.");
  if (ok) {
    try {
      await fb.remove(fb.ref(db, `memberOf/${k}/${famCode()}`));          // amíg még tag vagyunk
      await fb.remove(fb.ref(db, `families/${famCode()}/members/${k}`));
      if (me) { member = false; state.familyCode = ""; persist(); connectCloud(); }
      cloudNote = me ? "Kiléptél a családból. Az ezen az eszközön lévő adatok megmaradtak." : `${em} eltávolítva.`;
    } catch (e) { cloudNote = "❌ " + fbError(e); }
  }
  openCloud();
}
async function googleLogin() {
  cloudNote = "";
  try { await fa.signInWithPopup(auth, new fa.GoogleAuthProvider()); }
  catch (e) { if (!/popup-closed-by-user|cancelled-popup-request/.test(e.code || "")) { cloudNote = "❌ " + fbError(e); renderCloud(); } }
}
async function sendLink(em) {
  em = (em || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { cloudNote = "❌ Ez nem tűnik e-mail-címnek."; return renderCloud(); }
  try {
    await fa.sendSignInLinkToEmail(auth, em, { url: location.origin + location.pathname, handleCodeInApp: true });
    try { localStorage.setItem(EMAIL_KEY, em); } catch (e) { /* privát mód */ }
    cloudNote = `📧 Elküldtem a belépő linket ide: ${em}. Nyisd meg a levelet ezen az eszközön, és kattints a linkre. (Ha nem jön, nézd meg a spam mappát is.)`;
  } catch (e) { cloudNote = "❌ " + fbError(e); }
  renderCloud();
}
async function logout() {
  const ok = await modal({ title: "Kijelentkezés", text: "Az ezen az eszközön lévő játékosok és haladásuk megmaradnak, csak nem szinkronizálódnak tovább.", ok: "Kijelentkezés" });
  if (ok) await fa.signOut(auth); else openCloud();
}

// A panel a meglévő felugró ablakban jelenik meg
let cloudOpen = false, cloudTok = 0;
function openCloud() {
  if (!fb) { toast("Most nincs kapcsolat a felhővel – a játék helyben ment."); return; }
  cloudOpen = true; $("modal").classList.add("on"); renderCloud();
}
function closeCloud() { cloudOpen = false; cloudNote = ""; $("modal").classList.remove("on"); }
async function renderCloud() {
  if (!cloudOpen) return;
  const tok = ++cloudTok, box = $("modal").firstElementChild;
  box.innerHTML = "";
  box.append(el("h3", null, "☁️ Felhős mentés és család"));
  const p = t => { const e = el("p", null, t); box.append(e); return e; };
  const row = (...bs) => { const r = el("div", "mbtns"); r.style.cssText = "flex-wrap:wrap;justify-content:flex-start;margin-bottom:10px"; r.append(...bs); box.append(r); };
  const input = ph => { const i = el("input", "minp"); i.type = "email"; i.placeholder = ph; i.autocomplete = "email"; box.append(i); return i; };
  const note = el("p"); // a megjegyzés mindig a gombok fölött
  if (!authUser) {
    p("Lépj be szülőként, és a játékosok haladása minden eszközön meglesz – a másik szülő is láthatja a saját telefonján. Belépés nélkül a haladás csak ezen az eszközön van elmentve.");
    row(btn("primary", "Belépés Google-fiókkal", googleLogin));
    const i = input("vagy e-mail-cím a belépő linkhez");
    i.addEventListener("keydown", e => { if (e.key === "Enter") sendLink(i.value); });
    row(btn("secondary", "📧 Belépő link küldése", () => sendLink(i.value)));
  } else if (!member) {
    p(`Belépve: ${authUser.email}`);
    p("Ez a cím még nem tartozik családhoz. Ha a másik szülő már létrehozta, kérd meg, hogy adja hozzá a címedet, aztán nyomd meg az „Újra ellenőrzöm” gombot. Ha te vagy az első, hozd létre a családot – az ezen az eszközön lévő játékosok felkerülnek a felhőbe.");
    box.append(note);
    row(btn("primary", "👨‍👩‍👧 Család létrehozása", createFamily), btn("secondary", "🔄 Újra ellenőrzöm", joinFamily), btn("secondary", "Kijelentkezés", logout));
  } else {
    p(`Belépve: ${authUser.email}`);
    box.append(el("b", null, "A család tagjai"), el("p", null, "Ők látják és folytathatják a játékosok haladását."));
    const list = el("div"); box.append(list);
    const i = input("Másik szülő e-mail-címe");
    i.addEventListener("keydown", e => { if (e.key === "Enter") addMember(i.value); });
    box.append(note);
    row(btn("secondary", "➕ Hozzáadás", () => addMember(i.value)), btn("secondary", "Kijelentkezés", logout));
    try {
      const m = Object.keys((await fb.get(fb.ref(db, `families/${famCode()}/members`))).val() || {});
      if (tok !== cloudTok) return;
      m.forEach(k => { const r = el("div", "setrow"); r.append(el("span", null, "👤 " + k.replace(/,/g, ".")), btn("secondary", "✖", () => removeMember(k, m.length))); list.append(r); });
    } catch (e) { if (tok === cloudTok) list.append(el("p", null, "❌ " + fbError(e))); }
  }
  if (cloudNote) { note.textContent = cloudNote; if (!note.parentNode) box.append(note); }
  row(btn("primary", "Bezárás", closeCloud));
}
function exportData() {
  const a = el("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(state.users, null, 2)], { type: "application/json" }));
  a.download = "helyesiras-kaland-" + todayKey() + ".json"; a.click(); URL.revokeObjectURL(a.href);
}

// ---------- 9. Kvíz motor ----------
let queue = [], qIndex = 0, sessionScore = 0, sessionRoundOk = 0, combo = 0, lastMode = "mixed", currentTask = null, answered = false, autoT = null;

function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
// Az esedékes szavak előre kerülnek
function pickFrom(list, n, u) {
  const due = new Set(dueWords(u));
  return [...shuffle(list.filter(w => due.has(w))), ...shuffle(list.filter(w => !due.has(w)))].slice(0, n);
}

let curLevel = 1;
function effLevel(T) {
  const w = T.word || (T.item && T.item.w), r = w && curUser().srs[w];
  const need = r && (isMastered(r) || (r.days >= 3 && !r.strong)); // ellenőrző vagy frissítő kérdés
  return Math.max(state.settings.level, need ? 2 : 1);
}
function startQuiz(mode) {
  const u = curUser();
  lastMode = mode; qIndex = 0; sessionScore = 0; sessionRoundOk = 0; combo = 0; sessionBadges = [];
  if (mode === "pairs") queue = shuffle(PAIR_TASKS).slice(0, 10).map(p => ({ type: "pair", data: p }));
  else if (mode === "jly") queue = pickFrom(JLY_LIST.map(x => x.w), 10, u).map(w => ({ type: "jly", item: JLY_MAP[w] }));
  else if (mode === "mistakes") {
    queue = shuffle(dueWords(u)).slice(0, 10).map(w => (JLY_MAP[w] && analyzeJlyWord(w)) ? { type: "jly", item: JLY_MAP[w] } : { type: "choice", word: w });
  } else if (mode === "mixed") {
    const m = pickFrom(M_UNIQUE, 7, u), j = pickFrom(JLY_LIST.map(x => x.w), 3, u).map(w => JLY_MAP[w]);
    queue = shuffle([{ type: "choice", word: m[0] }, { type: "jly", item: j[0] }, { type: "gap", word: m[1] }, { type: "tiles", word: m[2] }, { type: "jly", item: j[1] }, { type: "choice", word: m[3] }, { type: "gap", word: m[4] }, { type: "jly", item: j[2] }, { type: "tiles", word: m[5] }, { type: "choice", word: m[6] }]);
  } else queue = pickFrom(M_UNIQUE, 10, u).map(w => ({ type: mode, word: w }));
  const bl = blockedTopics(u);
  queue = queue.filter(t => (t.item || t.word || t.data) && !bl.includes(topicOf(t)));
  if (!queue.length) { toast(bl.length ? "Ez a feladat ma le van zárva." : "Nincs mit gyakorolni."); return; }
  showScreen("scr-quiz");
  renderQuestion();
}

// Harmadik, hihető hibás alak (2. szint): egy mássalhangzót megdupláz vagy rövidít
function extraVariant(word, avoid) {
  const idx = [...word].map((c, i) => i).filter(i => "bcdfghjklmnpqrstvwxyz".includes(word[i].toLowerCase()));
  for (const i of shuffle(idx)) {
    const v = word[i + 1] === word[i] ? word.slice(0, i) + word.slice(i + 1) : word.slice(0, i + 1) + word[i] + word.slice(i + 1);
    if (!avoid.includes(v)) return v;
  }
  return null;
}
// További, hihető hibás alakok: más mássalhangzó-hosszúság, magánhangzó-hosszúság (á/a, ő/ö …)
const ACC = { a: "á", á: "a", e: "é", é: "e", i: "í", í: "i", o: "ó", ó: "o", ö: "ő", ő: "ö", u: "ú", ú: "u", ü: "ű", ű: "ü" };
function vowelVariants(word) {
  const out = [];
  [...word].forEach((c, i) => { const lo = c.toLowerCase(), m = ACC[lo]; if (m) out.push(word.slice(0, i) + (c === lo ? m : m.toUpperCase()) + word.slice(i + 1)); });
  return out;
}
function consVariants(word, skip) {
  const out = [];
  [...word].forEach((c, i) => {
    const lo = c.toLowerCase();
    if (!"bcdfghjklmnpqrstvwxz".includes(lo) || skip.includes(lo) || (i === 0 && word[1] !== c)) return; // szó elején nem duplázunk
    out.push(word[i + 1] === c ? word.slice(0, i) + word.slice(i + 1) : word.slice(0, i + 1) + c + word.slice(i + 1));
  });
  return out;
}
function moreVariants(word, avoid, n, skip = "") {
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
function jlyOptions(word, swapped, L) {
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
function extraFragment(c, w) {
  const used = [c, w], first = c[0].toLowerCase();
  const pool = FRAGS.filter(f => !used.includes(f) && f[0] === first);
  const any = FRAGS.filter(f => !used.includes(f));
  const list = pool.length ? pool : any;
  return list[Math.random() * list.length | 0];
}

function makeOptionButtons(opts, correct, full, body, meta) {
  const wrap = el("div", "opts");
  wrap.setAttribute("role", "group");
  opts.forEach((o, i) => {
    const b = btn("opt", o);
    b.setAttribute("aria-label", `${i + 1}. ${o}`);
    b.addEventListener("click", () => {
      if (answered) return; answered = true;
      document.querySelectorAll(".opt").forEach(x => x.classList.add(x.textContent === correct ? "ok" : x === b ? "bad" : "dim"));
      const g = $("gap-span"); if (g) g.textContent = correct;
      finishAnswer(o === correct, full, meta);
    });
    wrap.append(b);
  });
  body.append(wrap);
}

function renderTyping(body, word, meta, mask) {
  if (mask) { body.append(el("div", "word-display", mask)); }
  const inp = el("input", "typeinp"); inp.id = "type-inp"; inp.autocomplete = "off"; inp.autocapitalize = "off"; inp.spellcheck = false;
  inp.placeholder = "Írd be a szót…"; inp.setAttribute("aria-label", "Írd be a helyes szót");
  const go = () => { if (answered) return; const v = inp.value.trim(); if (!v) return; answered = true; keepKeyboard(); inp.disabled = true; finishAnswer(v === word, word, meta); };
  const ok = btn("primary", "Ellenőriz", go); ok.id = "type-ok";
  body.append(inp, el("br"), ok);
  inp.focus(); // iOS: csak koppintásból indított hívásban jelenik meg a billentyűzet
}

// iOS csak koppintás közben nyitja meg a billentyűzetet. A „tartó” mező a billentyűzetet nyitva tartja a válasz és a következő
// (automatikusan betöltődő) gépelős kérdés között; ha a következő kérdés nem gépelős, elengedjük.
let kbKeeper = null;
function keepKeyboard() {
  if (!kbKeeper) {
    kbKeeper = el("input"); kbKeeper.tabIndex = -1; kbKeeper.setAttribute("aria-hidden", "true"); kbKeeper.autocomplete = "off";
    kbKeeper.style.cssText = "position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;border:0;padding:0;font-size:16px;pointer-events:none";
    document.body.append(kbKeeper);
  }
  kbKeeper.focus({ preventScroll: true });
}
function releaseKeyboardSoon() {
  setTimeout(() => { if (kbKeeper && document.activeElement === kbKeeper) kbKeeper.blur(); }, 200);
}

// A helyes alak begépeléséhez tartozó stílusok (az extra.css-t nem kell módosítani)
document.head.append(Object.assign(el("style"), { textContent: `
.retype-wrap { position: fixed; left: 50%; top: 34%; transform: translate(-50%, -50%); width: min(92vw, 440px); box-sizing: border-box; z-index: 55; background: #fff; border-radius: 22px; padding: 14px 16px 18px; box-shadow: 0 10px 40px rgba(0,0,0,.28), 0 0 0 3px #fca5a5; text-align: center; }
.retype-label { font-weight: 800; color: var(--soft); }
.retype-word { font-size: 34px; font-weight: 900; margin: 4px 0 2px; letter-spacing: .02em; }
.retype-in { display: block; margin: 8px auto 0; }
.retype-in.done { border-color: #16a34a; background: #dcfce7; }
` }));

function renderQuestion() {
  answered = false; clearTimeout(autoT); hideRetype(); releaseKeyboardSoon();
  $("sheet").classList.remove("on");
  $("q-prog").style.width = (qIndex / queue.length * 100) + "%";
  $("q-score").textContent = sessionScore + " p";
  $("q-combo").textContent = combo >= 2 ? "🔥 " + combo + "x" : "";

  const T = currentTask = queue[qIndex], L = curLevel = effLevel(T);
  const body = $("q-body"), tag = $("q-tag"), title = $("q-title");
  body.innerHTML = "";
  const setTag = (txt, col, ttl) => { tag.textContent = txt; tag.style.background = col; title.textContent = ttl; };
  const clue = txt => body.append(el("div", "clue-box", txt));

  if (T.type === "jly" && !analyzeJlyWord(T.item.w)) { T.type = "tiles"; T.word = T.item.w; }
  if ((T.type === "choice" || T.type === "gap") && !analyzeWord(T.word)) T.type = "tiles";

  if (T.type === "pair") {
    const p = T.data, meta = { topic: "pair", explain: PAIR_WHY[p.ok] || p.hint };
    setTag("Jelentéskülönbség", "#db2777", `Melyik szó illik a mondatba? (${p.hint})`);
    const s = el("div", "sentence-display"); s.innerHTML = ""; // biztonságos felépítés
    const [a, b] = p.s.split("___");
    const gap = el("span", "gap", "?"); gap.id = "gap-span";
    s.append(document.createTextNode(a), gap, document.createTextNode(b || ""));
    body.append(s);
    const o = L >= 2 ? shuffle([p.ok, p.bad]) : shuffle([p.ok, p.bad]); // csak két érvényes alak van
    makeOptionButtons(o, p.ok, p.ok, body, meta);
    return;
  }

  if (T.type === "jly") {
    const jo = T.item, ji = analyzeJlyWord(jo.w), meta = { topic: "jly", explain: explainWord(jo.w) };
    setTag("j vagy ly gyakorló", "#ea580c", "Válaszd ki a helyesen írt alakot!");
    clue("💡 Jelentése: " + getSynonymsForWord(jo.w));
    const opts = jlyOptions(jo.w, ji.wrongWord, L);
    makeOptionButtons(shuffle(opts), jo.w, jo.w, body, meta);
    return;
  }

  if (T.type === "choice" || T.type === "gap") {
    const info = analyzeWord(T.word), meta = { topic: "hosszu", explain: explainWord(T.word) };
    if (T.type === "choice") {
      setTag("Rövid vagy hosszú?", "#2563eb", L === 3 ? "Írd be a szót helyesen!" : "Kattints a helyesen leírt szóra!");
      clue("💡 Jelentése: " + getSynonymsForWord(T.word));
      if (L === 3) { renderTyping(body, T.word, meta, ""); return; }
      body.append(el("div", "word-display", "🤔"));
      const opts = [info.word, info.wrongWord];
      if (L >= 2) { const x = extraVariant(info.word, opts); if (x) opts.push(x); }
      makeOptionButtons(shuffle(opts), info.word, info.word, body, meta);
    } else {
      setTag("Betűpótló", "#ca8a04", L === 3 ? "Írd be a teljes szót!" : "Melyik betűkapcsolat hiányzik a szóból?");
      clue("💡 Jelentése / Szinonima: " + getSynonymsForWord(T.word));
      if (L === 3) { renderTyping(body, T.word, meta, info.gappedWord.replace("___", "__")); return; }
      const good = info.hasLong ? info.longPart : info.shortPart, bad = info.hasLong ? info.shortPart : info.longPart;
      const disp = el("div", "word-display");
      const [a, b] = info.gappedWord.split("___");
      const gap = el("span", "gap", "__"); gap.id = "gap-span";
      disp.append(document.createTextNode(a), gap, document.createTextNode(b || ""));
      body.append(disp);
      const opts = [good, bad];
      if (L >= 2) opts.push(extraFragment(good, bad));
      makeOptionButtons(shuffle(opts), good, info.word, body, meta);
    }
    return;
  }

  setTag("Betűkirakó", "#0d9488", "Rakd ki a szót! (A szinonima ingyenes. A magánhangzók VAGY az első–utolsó betű −5 pontba kerül. Hibára van még egy próba.)");
  renderTilePuzzle(T.word, body);
}

// Pontlevonás látványos jelzése: rezgés, piros villanás, felrobbanó „−5”
function penaltyEffect(n) {
  if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
  let f = $("flash"); if (!f) { f = el("div"); f.id = "flash"; document.body.append(f); }
  f.classList.remove("on"); void f.offsetWidth; f.classList.add("on");
  document.body.classList.add("shake"); setTimeout(() => document.body.classList.remove("shake"), 500);
  const b = el("div", "boom", "💥 −" + n); document.body.append(b); setTimeout(() => b.remove(), 950);
  toast(`−${n} pont a segítségért`);
}

// ---------- 10. Betűkirakó ----------
let tileTarget = "", tileSlots = [], tilePool = [], helpUsed = 0, tileTry = 0, helpPen = false;
const VOWELS = "aáeéiíoóöőuúüűAÁEÉIÍOÓÖŐUÚÜŰ";

function renderTilePuzzle(word, body) {
  tileTarget = word; tileSlots = new Array(word.length).fill(null); helpUsed = 0; tileTry = 0; helpPen = false;
  tilePool = shuffle([...word].map((c, idx) => ({ c, idx })));

  const clue = el("div", "clue-box", "💡 Szinonimák / jelentés: " + getSynonymsForWord(word));
  clue.style.display = "none";
  const row = el("div", "slotrow"); row.id = "slot-row";
  const pool = el("div", "tiles");
  tilePool.forEach(it => { const b = btn("tile", it.c, () => pickTile(it.idx)); b.id = "t-" + it.idx; pool.append(b); });

  const bar = el("div", "help-bar");
  const helps = [
    ["💡 1. Szinonimák", () => { clue.style.display = "block"; }],
    ["🅰️ Magánhangzók (−5 p)", () => placeMatching(p => VOWELS.includes(tileTarget[p]))],
    ["↔️ Első és utolsó betű (−5 p)", () => placeMatching(p => p === 0 || p === tileTarget.length - 1)]
  ];
  helps.forEach(([label, fn], idx) => {
    const b = btn("help-btn", label, () => {
      if (answered || helpUsed >= 2 || b.disabled) return;
      fn(); b.disabled = true; helpUsed++;
      if (idx >= 1) { helpPen = true; penaltyEffect(5); }
      if (idx === 1) bar.children[2].disabled = true; // magánhangzók VAGY első–utolsó betű
      if (idx === 2) bar.children[1].disabled = true;
      if (helpUsed >= 2) bar.querySelectorAll(".help-btn").forEach(x => x.disabled = true);
    });
    if (idx >= 1) b.classList.add("pay");
    bar.append(b);
  });
  const reset = el("div"); reset.style.marginTop = "12px";
  reset.append(btn("secondary", "↺ Szabad betűk törlése", clearUnlocked));
  body.append(clue, row, pool, bar, reset);
  updateSlots();
}

function placeMatching(pred) {
  for (let pos = 0; pos < tileTarget.length; pos++) {
    if (!pred(pos)) continue;
    const ch = tileTarget[pos];
    if (tileSlots[pos] && tileSlots[pos].locked) continue;
    if (tileSlots[pos]) { $("t-" + tileSlots[pos].poolIdx).classList.remove("used"); tileSlots[pos] = null; }
    let it = tilePool.find(x => x.c === ch && !$("t-" + x.idx).classList.contains("used"));
    if (!it) { // a betűt egy másik, szabad rekeszből vesszük el
      const o = tileSlots.findIndex(s => s && !s.locked && s.char === ch);
      if (o >= 0) { const idx = tileSlots[o].poolIdx; $("t-" + idx).classList.remove("used"); tileSlots[o] = null; it = tilePool.find(x => x.idx === idx); }
    }
    if (it) { $("t-" + it.idx).classList.add("used"); tileSlots[pos] = { poolIdx: it.idx, char: ch, locked: true }; }
  }
  updateSlots(); checkTileDone();
}

function pickTile(idx) {
  if (answered) return;
  const b = $("t-" + idx); if (b.classList.contains("used")) return;
  const pos = tileSlots.findIndex(s => s === null); if (pos < 0) return;
  b.classList.add("used");
  tileSlots[pos] = { poolIdx: idx, char: tilePool.find(x => x.idx === idx).c, locked: false };
  updateSlots(); checkTileDone();
}

function checkTileDone() {
  if (!tileSlots.every(Boolean)) return;
  const built = tileSlots.map(s => s.char).join(""), meta = { topic: "tiles", explain: explainWord(tileTarget) };
  if (built === tileTarget) { answered = true; finishAnswer(true, tileTarget, { ...meta, penalty: (helpPen ? 5 : 0) + (tileTry ? 4 : 0) }); return; }
  if (tileTry === 0) { // egy újabb próba: a jó betűk zölden bezárulnak
    tileTry = 1;
    tileSlots.forEach((s, i) => { if (s.char === tileTarget[i]) s.locked = true; else { $("t-" + s.poolIdx).classList.remove("used"); tileSlots[i] = null; } });
    updateSlots(); toast("Majdnem! A jó betűk zölden maradtak, próbáld újra!");
    return;
  }
  answered = true; finishAnswer(false, tileTarget, meta);
}

function updateSlots() {
  const row = $("slot-row"); if (!row) return;
  row.innerHTML = "";
  tileSlots.forEach((s, pos) => {
    if (!s) { row.append(el("div", "slot-empty", "•")); return; }
    const b = btn("tile placed" + (s.locked ? " locked" : ""), s.char);
    if (!s.locked) b.addEventListener("click", () => removeTile(pos));
    row.append(b);
  });
}
function removeTile(pos) { const s = tileSlots[pos]; if (answered || !s || s.locked) return; $("t-" + s.poolIdx).classList.remove("used"); tileSlots[pos] = null; updateSlots(); }
function clearUnlocked() { if (answered) return; tileSlots.forEach((s, i) => { if (s && !s.locked) { $("t-" + s.poolIdx).classList.remove("used"); tileSlots[i] = null; } }); updateSlots(); }

// ---------- 11. Kiértékelés ----------
let retype = null;
function hideRetype() { retype = null; $("sh-next").disabled = false; document.querySelectorAll(".retype-wrap").forEach(x => x.remove()); }
function showRetype(w) {
  retype = w; $("sh-next").disabled = true;
  // A mező a képernyő közepén lévő panelben van; a helyes alakot is ide írjuk ki, mert iPhone-on a billentyűzet eltakarja az alsó sávot.
  const wrap = el("div", "retype-wrap");
  const i = el("input", "typeinp retype-in");
  i.autocomplete = "off"; i.autocapitalize = "off"; i.spellcheck = false; i.setAttribute("autocorrect", "off"); i.setAttribute("enterkeyhint", "done");
  i.setAttribute("aria-label", "Írd le a helyes alakot"); i.placeholder = "Írd le ide…";
  i.addEventListener("input", () => { // a helyes alak begépelése után lehet továbblépni
    if (retype && i.value.trim() === retype) { retype = null; i.classList.add("done"); i.disabled = true; $("sh-next").disabled = false; $("sh-next").focus(); }
  });
  wrap.append(el("div", "retype-label", "✍️ Írd le a helyes alakot:"), el("div", "retype-word", w), i);
  document.body.append(wrap);
  i.focus(); // közvetlenül a koppintás kezelőjében, különben iOS nem nyitja meg a billentyűzetet
}
function finishAnswer(ok, full, meta = {}) {
  clearTimeout(autoT);
  const u = curUser(), t = dayNum(), key = todayKey(), S = state.settings;
  const tp = meta.topic || "hosszu", st = u.stats[tp] = u.stats[tp] || { ok: 0, n: 0 };
  st.n++;

  let newCard = false;
  if (ALL_UNIQUE_WORDS.has(full)) { // Leitner-rendszer
    if (!u.practiced.includes(full)) u.practiced.push(full);
    const r = u.srs[full] = u.srs[full] || { b: 0, days: 0, strong: 0, last: "", due: t };
    if (r.strong === undefined) r.strong = 0;
    const wasM = isMastered(r), strong = curLevel >= 2 || tp === "tiles"; // találgatással nem lehet elsajátítani
    if (ok) {
      if (wasM) { r.rf = (r.rf || 0) + 1; r.due = t + REFRESH[Math.min(r.rf, REFRESH.length - 1)]; r.last = key; } // frissítő ismétlés
      else {
        if (r.last !== key) { r.days++; r.b = Math.min(r.b + 1, 4); }
        r.last = key; if (strong) r.strong++;
        r.due = t + INTERVALS[r.b];
        if (isMastered(r)) { r.rf = 0; r.due = t + REFRESH[0]; newCard = true; }
        else if (r.days >= 3) r.due = t + 1; // még egy nehezebb feladat kell
      }
    } else { r.b = 0; r.days = Math.max(0, r.days - (wasM ? 2 : 1)); r.due = t + 1; r.miss = (r.miss || 0) + 1; r.rf = 0; }
  }

  const sheet = $("sheet");
  if (ok) {
    combo++; st.ok++;
    const gain = Math.max(3, 10 + (combo >= 3 ? 5 : 0) + (S.level - 1) * 5 - (meta.penalty || 0));
    sessionScore += gain; sessionRoundOk++; u.pts += gain;
    if (u.streak.last !== key) { u.streak.n = u.streak.last === dateKey(t - 1) ? u.streak.n + 1 : 1; u.streak.last = key; }
    const before = u.daily[key] || 0;
    u.daily[key] = before + 1;
    u.mistakes = u.mistakes.filter(w => w !== full);
    sheet.className = "sheet ok on"; hideRetype();
    $("sh-head").textContent = (combo >= 3 ? `Szuper! (+${gain} pont, ${combo}x sorozat!)` : `Helyes! (+${gain} pont)`) + (before + 1 === S.goal ? " 🎉 Napi cél teljesítve!" : "");
    $("sh-full").textContent = "Helyes alak: " + full + (newCard ? "   🃏 Új szókártya az albumban!" : "");
    $("sh-why").textContent = "";
    u.best = Math.max(u.best || 0, u.streak.n); u.maxM = Math.max(u.maxM || 0, masteredCount(u));
    checkBadges(u); checkUnlocks(u);
    if (S.autoNext) autoT = setTimeout(nextQuestion, 1200); // csak helyes válasznál
  } else {
    combo = 0;
    if (!u.mistakes.includes(full)) u.mistakes.push(full);
    sheet.className = "sheet bad on"; showRetype(full);
    $("sh-head").textContent = "Most nem talált!";
    $("sh-full").textContent = "A helyes írásmód: " + full;
    $("sh-why").textContent = "📖 " + (meta.explain || explainWord(full));
  }
  saveState(); updateBar();
  $("q-score").textContent = sessionScore + " p";
}

function nextQuestion() {
  if (retype) return; // előbb le kell írni a helyes alakot
  clearTimeout(autoT);
  if (!$("sheet").classList.contains("on")) return;
  qIndex++;
  qIndex < queue.length ? renderQuestion() : showResults();
}

// Csillagok: 5 = legfeljebb 1 hiba; 4 = 2 hiba vagy 90% fölött; 3 = 80% fölött; 2 = 65% fölött; 1 = 50% fölött
function starsFor(ok, total) {
  const err = total - ok, r = ok / total;
  if (err <= 1) return 5;
  if (err <= 2 || r > .9) return 4;
  if (r > .8) return 3;
  if (r > .65) return 2;
  if (r > .5) return 1;
  return 0;
}
function showResults() {
  $("sheet").classList.remove("on");
  const u = curUser(), ratio = sessionRoundOk / queue.length;
  if (ratio === 1) { const b = BADGES.find(x => x.id === "perfect"); awardBadge(u, b); saveState(); }
  flushPush(); // kör vége: most megy fel a felhőbe
  showScreen("scr-res");
  const stars = starsFor(sessionRoundOk, queue.length), errors = queue.length - sessionRoundOk;
  $("res-stars").textContent = "⭐".repeat(stars) + "☆".repeat(5 - stars);
  $("res-stars").setAttribute("aria-label", `${stars} csillag az 5-ből`);
  $("res-head").textContent = errors === 0 ? "Hibátlan teljesítmény!" : stars >= 4 ? "Remek munka!" : stars >= 2 ? "Szép munka!" : "Gyakorolj még, menni fog!";
  $("res-sub").textContent = `${queue.length} szóból ${sessionRoundOk} jó • Szerzett pontok: ${sessionScore} p`;
  const g = $("res-badges"); g.innerHTML = "";
  sessionBadges.forEach(b => { const d = el("div", "badge"); d.append(el("span", null, b.ic), document.createTextNode(b.n)); g.append(d); });
  if (errors === 0) confetti(); // konfetti csak hibátlan körnél
}

// ---------- 12. Billentyűzet ----------
document.addEventListener("keydown", e => {
  if ($("modal").classList.contains("on") || !$("scr-quiz").classList.contains("on")) return;
  const sheetOn = $("sheet").classList.contains("on");
  if (e.key === "Enter" && sheetOn) { e.preventDefault(); nextQuestion(); return; }
  if (e.target.tagName === "INPUT") { if (e.key === "Enter") { e.preventDefault(); $("type-ok") && $("type-ok").click(); } return; }
  if (answered || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^[1-4]$/.test(e.key)) { const b = document.querySelectorAll(".opt")[+e.key - 1]; if (b) b.click(); return; }
  if (currentTask && currentTask.type === "tiles") {
    if (e.key === "Backspace") { for (let i = tileSlots.length - 1; i >= 0; i--) if (tileSlots[i] && !tileSlots[i].locked) { removeTile(i); break; } return; }
    if (e.key.length === 1) {
      const it = tilePool.find(x => x.c.toLowerCase() === e.key.toLowerCase() && !$("t-" + x.idx).classList.contains("used"));
      if (it) pickTile(it.idx);
    }
  }
});


// ---------- 12b. Szülői nézet ----------
const ALL_TOPICS = ["jly", "hosszu", "pair", "tiles"];
let parentUser = null;

// --- PIN: PBKDF2-SHA256 sózott hash, a Firebase-ben tárolva ---
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
async function hashPin(pin, saltHex) {
  const salt = saltHex ? Uint8Array.from(saltHex.match(/../g).map(h => parseInt(h, 16))) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, key, 256);
  return { salt: hex(salt), hash: hex(bits) };
}
function pushParent() {
  const c = famCode();
  if (!cloudReady() || !state.parent) return;
  fb.set(fb.ref(db, `families/${c}/parent`), state.parent).catch(() => setSync("⚠️ Szinkron hiba", "err"));
}
async function setPin(pin) { state.parent = await hashPin(pin); delete state.parentPin; persist(); pushParent(); }
async function checkPin(pin) { const p = state.parent; return !!p && (await hashPin(pin, p.salt)).hash === p.hash; }
const PIN_OK = /^\d{6,10}$/;

async function requirePin(title, text) {
  if (!(window.crypto && crypto.subtle)) { toast("A PIN-hez biztonságos (https) kapcsolat kell."); return false; }
  // új eszközön először megnézzük, van-e már PIN a felhőben
  if (!state.parent && cloudReady()) {
    try { const r = (await fb.get(fb.ref(db, `families/${famCode()}/parent`))).val(); if (r && r.hash && r.salt) { state.parent = { salt: r.salt, hash: r.hash }; persist(); } } catch (e) { /* offline */ }
  }
  // régi, helyi PIN átalakítása hash-sé
  if (!state.parent && state.parentPin) await setPin(state.parentPin);
  if (!state.parent) {
    const p = await modal({ title: "Szülői PIN beállítása", text: "Ez a PIN védi a szülői nézetet és a játékosok törlését. 6–10 számjegy; szinkronkóddal minden eszközön ugyanez érvényes.", value: "", ok: "Mentés", secret: true });
    if (p === null) return false;
    if (!PIN_OK.test(p.trim())) { toast("A PIN 6–10 számjegy legyen."); return false; }
    await setPin(p.trim());
    return true;
  }
  const p = await modal({ title, text, value: "", ok: "Belépés", secret: true });
  if (p === null) return false;
  if (!(await checkPin(p.trim()))) { toast("Hibás PIN."); return false; }
  return true;
}

async function openParent() {
  if (!(await requirePin("Szülői nézet", "Írd be a PIN-kódot."))) return;
  if (!parentUser || !state.users[parentUser]) parentUser = state.current;
  showScreen("scr-parent");
}

function saveOther(name) { state.users[name].upd = Date.now(); persist(); pushUser(name); }

function renderParent() {
  const box = $("parent-body"); box.innerHTML = "";
  const names = Object.keys(state.users);
  if (!state.users[parentUser]) parentUser = names[0];
  const tabs = el("div", "levels");
  names.forEach(n => tabs.append(btn("lvl" + (n === parentUser ? " on" : ""), (state.users[n].avatar || "🦉") + " " + n, () => { parentUser = n; renderParent(); })));
  box.append(tabs);

  const u = normUser(state.users[parentUser]), t = dayNum(), key = todayKey();
  const panel = title => { const p = el("div", "panel"); p.append(el("h3", null, title)); box.append(p); return p; };

  const ov = panel("Áttekintés");
  [`📅 Utoljára játszott: ${u.streak.last || "még nem játszott"}`, `✅ Ma helyes válasz: ${u.daily[key] || 0}`, `🔥 Sorozat: ${streakNow(u)} nap`, `🏆 Elsajátított szó: ${masteredCount(u)} / ${ALL_UNIQUE_WORDS.size}`, `⭐ Pont: ${u.pts}`].forEach(x => ov.append(el("div", null, x)));

  const cp = panel("Utolsó 14 nap (helyes válaszok)");
  const days = [...Array(14)].map((_, i) => t - 13 + i), vals = days.map(d => u.daily[dateKey(d)] || 0), max = Math.max(...vals, 5), ch = el("div", "chart");
  days.forEach((d, i) => { const col = el("div", "col"), bar = el("i"); bar.style.height = Math.round(vals[i] / max * 90) + "px"; col.append(el("b", null, vals[i]), bar, el("span", null, dateKey(d).slice(8))); ch.append(col); });
  cp.append(ch);

  const tp = panel("Témák pontossága (piros: 70% alatt, zöld: 90% fölött)");
  const pcts = {};
  ALL_TOPICS.forEach(k => {
    const st = u.stats[k] || { ok: 0, n: 0 }, pct = st.n ? Math.round(st.ok / st.n * 100) : null;
    pcts[k] = { pct, n: st.n };
    const row = el("div", "trow"), bar = el("div", "bar"), i = el("i");
    i.style.width = (pct || 0) + "%";
    if (pct !== null && pct < 70) i.style.background = "#ef4444"; else if (pct >= 90) i.style.background = "#22c55e";
    bar.append(i); row.append(el("span", null, TOPICS[k]), bar, el("span", null, st.n ? `${pct}% (${st.n})` : "–")); tp.append(row);
  });

  const pw = panel("Legtöbbet hibázott szavak");
  const bad = Object.entries(u.srs).filter(([w, r]) => r.miss).sort((a, b) => b[1].miss - a[1].miss).slice(0, 12);
  if (!bad.length) pw.append(el("div", null, "Még nincs adat (a hibákat mostantól számoljuk)."));
  const wrap = el("div", "badgegrid");
  bad.forEach(([w, r]) => { const d = el("div", "badge"); d.append(el("span", null, "✗" + r.miss), document.createTextNode(w)); wrap.append(d); });
  pw.append(wrap);

  const bp = panel("Mai feladatzár (csak ma érvényes)");
  bp.append(el("p", null, "A lezárt feladattípust a gyerek ma nem tudja elindítani, így több idő jut a gyengébb részekre. Holnap magától feloldódik."));
  const setBlock = arr => {
    if (arr.length >= ALL_TOPICS.length) { toast("Legalább egy feladattípusnak nyitva kell maradnia."); return false; }
    u.block = { day: key, topics: arr }; saveOther(parentUser); renderParent(); return true;
  };
  const cur = new Set(blockedTopics(u));
  ALL_TOPICS.forEach(k => {
    const r = el("label", "setrow"), cb = el("input"); cb.type = "checkbox"; cb.checked = cur.has(k);
    cb.addEventListener("change", () => { const n = new Set(blockedTopics(u)); cb.checked ? n.add(k) : n.delete(k); if (!setBlock([...n])) cb.checked = false; });
    r.append(el("span", null, "🔒 " + TOPICS[k] + (pcts[k].n ? ` (${pcts[k].pct}%)` : "")), cb); bp.append(r);
  });
  const row = el("div", "btnrow");
  row.append(btn("secondary", "🎯 Zárd le automatikusan, ami már megy", () => {
    let auto = ALL_TOPICS.filter(k => pcts[k].n >= 10 && pcts[k].pct >= 90);
    if (!auto.length) { toast("Egyik téma sem éri el még a 90%-ot (min. 10 válasz)."); return; }
    if (auto.length >= ALL_TOPICS.length) { const w = ALL_TOPICS.slice().sort((a, b) => pcts[a].pct - pcts[b].pct)[0]; auto = auto.filter(k => k !== w); }
    setBlock(auto);
  }), btn("secondary", "🔓 Minden feloldása", () => { u.block = { day: key, topics: [] }; saveOther(parentUser); renderParent(); }));
  bp.append(row);

  const fr = el("div", "btnrow");
  fr.append(btn("secondary", "🔑 PIN módosítása", async () => {
    const old = await modal({ title: "Jelenlegi PIN", value: "", ok: "Tovább", secret: true });
    if (old === null) return;
    if (!(await checkPin(old.trim()))) { toast("Hibás PIN."); return; }
    const p = await modal({ title: "Új PIN", text: "6–10 számjegy.", value: "", ok: "Mentés", secret: true });
    if (p === null) return;
    if (!PIN_OK.test(p.trim())) { toast("A PIN 6–10 számjegy legyen."); return; }
    await setPin(p.trim()); toast("PIN módosítva.");
  }));
  box.append(fr);
}

// ---------- 12c. Szókártya-album és jutalmak ----------
let albumTab = "hosszu", albumOnly = false;

function renderAlbum() {
  const u = curUser(), box = $("album-body"); box.innerHTML = "";
  const panel = title => { const p = el("div", "panel"); p.append(el("h3", null, title)); box.append(p); return p; };
  const all = [...ALL_UNIQUE_WORDS], got = all.filter(w => isMastered(u.srs[w])).length;

  const sp = panel(`📖 Szókártya-gyűjtemény: ${got} / ${all.length}`);
  const bar = el("div", "bar"), bi = el("i"); bi.style.width = Math.round(got / all.length * 100) + "%"; bar.append(bi); sp.append(bar);
  sp.append(el("p", null, "Egy szó akkor lesz kártya, ha 3 különböző napon helyesen válaszoltál rá, és legalább egyszer nehezebb feladatban is (3 opció, gépelés vagy betűkirakó). Ha a szót 30 nap múlva is tudod, ⭐ kerül a kártyára."));

  // Következő célok: kategóriánként a legközelebbi még zárolt jutalom
  const gp = panel("🎯 Következő jutalmak"), pr = progress(u);
  ["pts", "streak", "words"].forEach(by => {
    const next = REWARDS.filter(r => r.by === by && pr[by] < r.n).sort((x, y) => x.n - y.n)[0];
    const row = el("div", "trow"), bar2 = el("div", "bar"), i2 = el("i");
    if (!next) { i2.style.width = "100%"; bar2.append(i2); row.append(el("span", null, `${BY_ICON[by]} ${{ pts: "Pont", streak: "Sorozat", words: "Szavak" }[by]}`), bar2, el("span", null, "✓ mind megvan")); }
    else { i2.style.width = Math.min(100, Math.round(pr[by] / next.n * 100)) + "%"; bar2.append(i2); row.append(el("span", null, `${BY_ICON[by]} ${rewardLabel(next)}`), bar2, el("span", null, `${pr[by]}/${next.n}`)); }
    gp.append(row);
  });
  gp.append(el("p", null, "Pontot minden helyes válasz ad. A sorozat az egymás utáni napok száma (a legjobb számít). Az elsajátított szavak a Gyűjtemény kártyái."));

  const tp = panel("🎨 Kinézet"), tr = el("div", "levels");
  tr.append(btn("lvl" + (!u.theme ? " on" : ""), "Alap", () => { u.theme = ""; saveState(); updateBar(); renderAlbum(); }));
  REWARDS.filter(r => r.k === "theme").forEach(r => {
    const locked = !isUnlocked(u, r);
    tr.append(btn("lvl" + (u.theme === r.v ? " on" : ""), locked ? `🔒 ${r.name} (${BY_TXT[r.by](r.n)})` : r.name, () => {
      if (locked) { toast(lockText(u, r)); return; }
      u.theme = r.v; saveState(); updateBar(); renderAlbum();
    }));
  });
  tp.append(tr);

  const ap = panel("🧑‍🎤 Avatarok"), ad = el("div");
  ad.style.cssText = "display:flex;flex-wrap:wrap;gap:8px"; ap.append(ad);
  renderAvatarPicker(ad, renderAlbum);

  const sets = { hosszu: ["Hosszú mássalhangzók", M_UNIQUE], jly: ["j / ly", JLY_LIST.map(x => x.w)] };
  const cp = panel("🃏 Szókártyák"), tabs = el("div", "levels");
  Object.entries(sets).forEach(([k, [label]]) => tabs.append(btn("lvl" + (k === albumTab ? " on" : ""), label, () => { albumTab = k; renderAlbum(); })));
  const only = el("label", "setrow"), cb = el("input"); cb.type = "checkbox"; cb.checked = albumOnly;
  cb.addEventListener("change", () => { albumOnly = cb.checked; renderAlbum(); });
  only.append(el("span", null, "Csak a megszerzettek"), cb);
  cp.append(tabs, only);
  const grid = el("div", "wgrid");
  [...new Set(sets[albumTab][1])].sort((a, b) => a.localeCompare(b, "hu")).forEach(w => {
    const r = u.srs[w], m = isMastered(r);
    if (albumOnly && !m) return;
    const c = el("div", "wcard " + (m ? "got" : r ? "learn" : "new"));
    if (m) {
      c.append(el("b", null, w + ((r.rf || 0) >= 1 ? " ⭐" : "")));
      c.title = getSynonymsForWord(w, true); c.addEventListener("click", () => toast(w + ": " + getSynonymsForWord(w, true)));
    } else if (r) { const d = Math.min(r.days, 3); c.append(el("b", null, "🌱"), el("small", null, "●".repeat(d) + "○".repeat(3 - d))); }
    else c.append(el("b", null, "?"), el("small", null, w.length + " betű"));
    grid.append(c);
  });
  cp.append(grid);
}

// ---------- 13. Eseménykezelők és indítás ----------
[["mixed", "btn-mixed"], ["choice", "btn-choice"], ["jly", "btn-jly"], ["gap", "btn-gap"], ["tiles", "btn-tiles"], ["pairs", "btn-pairs"], ["mistakes", "btn-mistakes"]]
  .forEach(([mode, id]) => $(id).addEventListener("click", () => startQuiz(mode)));
$("btn-switch-user").addEventListener("click", () => showScreen("scr-users"));
$("btn-users-back").addEventListener("click", goHome);
$("btn-stats").addEventListener("click", () => showScreen("scr-stats"));
$("btn-parent").addEventListener("click", openParent);
$("btn-parent-back").addEventListener("click", goHome);
$("btn-album").addEventListener("click", () => showScreen("scr-album"));
$("btn-album-back").addEventListener("click", goHome);
$("btn-stats-back").addEventListener("click", goHome);
$("btn-add-user").addEventListener("click", addUser);
$("new-user-inp").addEventListener("keydown", e => { if (e.key === "Enter") addUser(); });
$("btn-quit").addEventListener("click", goHome);
$("btn-again").addEventListener("click", () => startQuiz(lastMode));
$("btn-home").addEventListener("click", goHome);
$("sh-next").addEventListener("click", nextQuestion);
$("mon-sync").addEventListener("click", openCloud);

applySettings();
updateHome();
initFirebase(); // a játék a felhő nélkül is azonnal indul; a kapcsolódást a belépés állapota indítja
