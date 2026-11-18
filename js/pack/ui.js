// ===== Helyesírás csomag: válaszadó felületek =====
// Mindegyik egy vezérlőt ad vissza a váznak: { read, empty, auto, markWrong, markRight, lock, showCorrect, onKey }
// io: { submit, answering, toast, useHelp }
import { el, btn } from "../core/dom.js";
import { shuffle, SYL_V } from "./lang.js";

// --- Választós gombok (1–4 billentyűvel is) ---
export function optionsUI(box, opts, correct, io, onPick) {
  const wrap = el("div", "opts word-opts"); wrap.setAttribute("role", "group");
  let picked = null, clicked = null;
  const btns = opts.map((o, i) => {
    const b = btn("opt", ""); b.textContent = o; b.setAttribute("aria-label", `${i + 1}. ${o}`);
    b.addEventListener("click", () => { if (!io.answering() || b.disabled) return; picked = o; clicked = b; if (onPick) onPick(o); io.submit(); });
    wrap.append(b); return b;
  });
  box.append(wrap);
  return {
    read: () => picked, auto: true, empty: "Válassz egyet!",
    markWrong: () => { if (clicked) { clicked.classList.add("wrong"); clicked.disabled = true; } },
    markRight: () => { if (clicked) clicked.classList.add("right"); },
    lock: () => btns.forEach(b => { b.disabled = true; }),
    showCorrect: () => btns.forEach(b => { if (b.textContent === correct) b.classList.add("right"); }),
    onKey: e => { if (/^[1-4]$/.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) { const b = btns[+e.key - 1]; if (b) { b.click(); return true; } } return false; },
  };
}

// --- Begépelés (3. szint) ---
export function typingUI(box, word, io, mask) {
  if (mask) box.append(el("div", "word-display", mask));
  const inp = el("input", "typeinp"); inp.autocomplete = "off"; inp.autocapitalize = "off"; inp.spellcheck = false; inp.setAttribute("autocorrect", "off");
  inp.placeholder = "Írd be a szót…"; inp.setAttribute("aria-label", "Írd be a helyes szót");
  inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); io.submit(); } });
  inp.addEventListener("input", () => inp.classList.remove("wrong"));
  box.append(inp);
  setTimeout(() => inp.focus(), 30);
  return {
    read: () => (inp.value.trim() || null), empty: "Írd be a szót!",
    markWrong: () => { inp.classList.remove("wrong"); void inp.offsetWidth; inp.classList.add("wrong"); inp.select(); },
    markRight: () => { inp.classList.add("right"); inp.disabled = true; },
    lock: () => { inp.disabled = true; },
    showCorrect: () => { inp.value = word; inp.classList.remove("wrong"); inp.classList.add("right"); },
  };
}

// --- Betűkirakó: a szinonima ingyenes; magánhangzók VAGY első–utolsó betű (segítség, pontlevonással) ---
const VOWELS = "aáeéiíoóöőuúüűAÁEÉIÍOÓÖŐUÚÜŰ";
export function tilesUI(box, word, io, clueText) {
  const pool = shuffle([...word].map((c, idx) => ({ c, idx }))), slots = new Array(word.length).fill(null);
  let done = false;
  const clue = el("div", "clue-box", "💡 Jelentés: " + clueText); clue.style.display = "none";
  const row = el("div", "slotrow"), tiles = el("div", "tiles"), tb = new Map();
  pool.forEach(it => { const b = btn("tile", "", () => pick(it.idx)); b.textContent = it.c; tb.set(it.idx, b); tiles.append(b); });
  const used = idx => tb.get(idx).classList.contains("used");
  const draw = () => {
    row.innerHTML = "";
    slots.forEach((s, pos) => {
      if (!s) { row.append(el("div", "slot-empty", "•")); return; }
      const b = btn("tile placed" + (s.locked ? " locked" : ""), ""); b.textContent = s.char;
      if (!s.locked) b.addEventListener("click", () => remove(pos));
      row.append(b);
    });
  };
  const full = () => slots.every(Boolean);
  function pick(idx) {
    if (!io.answering() || done || used(idx)) return;
    const pos = slots.findIndex(s => s === null); if (pos < 0) return;
    tb.get(idx).classList.add("used");
    slots[pos] = { poolIdx: idx, char: pool.find(x => x.idx === idx).c, locked: false };
    draw(); if (full()) io.submit();
  }
  function remove(pos) { const s = slots[pos]; if (!io.answering() || !s || s.locked) return; tb.get(s.poolIdx).classList.remove("used"); slots[pos] = null; draw(); }
  const clearFree = () => { slots.forEach((s, i) => { if (s && !s.locked) { tb.get(s.poolIdx).classList.remove("used"); slots[i] = null; } }); draw(); };
  function place(pred) {
    for (let pos = 0; pos < word.length; pos++) {
      if (!pred(pos) || (slots[pos] && slots[pos].locked)) continue;
      const ch = word[pos];
      if (slots[pos]) { tb.get(slots[pos].poolIdx).classList.remove("used"); slots[pos] = null; }
      let it = pool.find(x => x.c === ch && !used(x.idx));
      if (!it) { const o = slots.findIndex(s => s && !s.locked && s.char === ch); if (o >= 0) { const idx = slots[o].poolIdx; tb.get(idx).classList.remove("used"); slots[o] = null; it = pool.find(x => x.idx === idx); } }
      if (it) { tb.get(it.idx).classList.add("used"); slots[pos] = { poolIdx: it.idx, char: ch, locked: true }; }
    }
    draw(); if (full()) io.submit();
  }
  const bar = el("div", "help-bar");
  const hSyn = btn("help-btn", "💡 Jelentés", () => { clue.style.display = "block"; hSyn.disabled = true; });
  const hV = btn("help-btn pay", "🅰️ Magánhangzók", () => { if (!io.answering()) return; io.useHelp(); hV.disabled = hE.disabled = true; place(p => VOWELS.includes(word[p])); });
  const hE = btn("help-btn pay", "↔️ Első és utolsó betű", () => { if (!io.answering()) return; io.useHelp(); hV.disabled = hE.disabled = true; place(p => p === 0 || p === word.length - 1); });
  hV.title = hE.title = "Segítség – kevesebb pontot ér";
  bar.append(hSyn, hV, hE);
  const reset = btn("secondary", "↺ Szabad betűk törlése", clearFree);
  box.append(clue, row, tiles, bar, el("div", "tiles-reset")); box.lastChild.append(reset);
  draw();
  return {
    read: () => (full() ? slots.map(s => s.char).join("") : null), auto: true, empty: "Rakd ki az összes betűt!",
    // hiba után: a jó betűk zölden maradnak, a többi visszakerül
    markWrong: () => { slots.forEach((s, i) => { if (s.char === word[i]) s.locked = true; else { tb.get(s.poolIdx).classList.remove("used"); slots[i] = null; } }); draw(); io.toast("Majdnem! A jó betűk zölden maradtak, próbáld újra!"); },
    markRight: () => { done = true; slots.forEach(s => { s.locked = true; }); draw(); },
    lock: () => { done = true; tiles.querySelectorAll("button").forEach(b => { b.disabled = true; }); bar.querySelectorAll("button").forEach(b => { b.disabled = true; }); reset.disabled = true; },
    showCorrect: () => { row.innerHTML = ""; [...word].forEach(c => { const b = btn("tile placed locked", ""); b.textContent = c; row.append(b); }); },
    onKey: e => {
      if (!io.answering() || e.ctrlKey || e.altKey || e.metaKey) return false;
      if (e.key === "Backspace") { for (let i = slots.length - 1; i >= 0; i--) if (slots[i] && !slots[i].locked) { remove(i); break; } return true; }
      if (e.key.length === 1) { const it = pool.find(x => x.c.toLowerCase() === e.key.toLowerCase() && !used(x.idx)); if (it) { pick(it.idx); return true; } }
      return false;
    },
  };
}

// --- Szótagoló: koppintás a betűk közé ---
export function sylUI(box, word, want, io) {
  const on = new Set(), lock = new Set(), letters = [...word], gapBtns = new Map();
  const row = el("div", "sylrow"); row.setAttribute("role", "group");
  letters.forEach((ch, i) => {
    const cell = el("span", "sylcell");
    cell.append(el("span", "sylch" + (SYL_V.includes(ch.toLowerCase()) ? " v" : ""), ch));
    if (i < letters.length - 1) {
      const g = i + 1, b = btn("sylgap", "", () => { if (!io.answering() || lock.has(g)) return; if (on.has(g)) on.delete(g); else on.add(g); paint(); });
      b.setAttribute("aria-label", `Vágás a(z) ${i + 1}. és ${i + 2}. betű között`);
      gapBtns.set(g, b); cell.append(b);
    }
    row.append(cell);
  });
  const paint = () => gapBtns.forEach((b, g) => { b.className = "sylgap" + (lock.has(g) ? " lock" : on.has(g) ? " on" : ""); b.textContent = on.has(g) || lock.has(g) ? "-" : ""; });
  paint();
  const hint = el("div", "clue-box"); hint.style.display = "none";
  const bar = el("div", "help-bar");
  const h1 = btn("help-btn", "🔢 Hány szótag?", () => { hint.textContent = `💡 Ahány magánhangzó, annyi szótag. Itt ${want.size + 1} szótag van, tehát ${want.size} vágás kell.`; hint.style.display = "block"; h1.disabled = true; });
  const h2 = btn("help-btn pay", "🅰️ Magánhangzók", () => { if (!io.answering()) return; io.useHelp(); row.classList.add("showv"); h2.disabled = true; });
  bar.append(h1, h2);
  box.append(row, hint, bar);
  return {
    read: () => [...on, ...lock].sort((a, b) => a - b).join(","), empty: "Jelöld be a vágásokat!",
    markWrong: () => { [...on].forEach(g => { if (want.has(g)) lock.add(g); on.delete(g); }); paint(); io.toast("Majdnem! A jó vágások zölden maradtak, próbáld újra!"); },
    markRight: () => { gapBtns.forEach((b, g) => { b.disabled = true; if (want.has(g)) b.className = "sylgap lock"; }); },
    lock: () => { gapBtns.forEach(b => { b.disabled = true; }); bar.querySelectorAll("button").forEach(b => { b.disabled = true; }); },
    showCorrect: () => gapBtns.forEach((b, g) => { b.disabled = true; b.className = "sylgap" + (want.has(g) ? " lock" : ""); b.textContent = want.has(g) ? "-" : ""; }),
    onKey: e => { if (e.key === "Enter" && io.answering()) { io.submit(); return true; } return false; },
  };
}
