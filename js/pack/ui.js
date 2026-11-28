// ===== Helyesírás csomag: válaszadó felületek =====
// Mindegyik egy vezérlőt ad vissza a váznak: { read, empty, auto, markWrong, markRight, lock, showCorrect, onKey }
// io: { submit, answering, toast, useHelp }
import { choiceUI, textUI } from "../core/answer-ui.js";
import { tilesUI as sharedTilesUI } from "../core/tile-ui.js";
import { el, btn, aAz } from "../core/dom.js";
import { shuffle, SYL_V } from "./lang.js";

export const optionsUI = (box, options, correct, io, onPick) =>
  choiceUI(box, io, { options, correct, onPick, className: "opts word-opts" });

export function typingUI(box, word, io, mask) {
  if (mask) box.append(el("div", "word-display", mask));
  return textUI(box, io, {
    correct: word, placeholder: "Írd be a szót…", label: "Írd be a helyes szót",
    empty: "Írd be a szót!", read: value => value.trim(),
  });
}

const VOWELS = "aáeéiíoóöőuúüűAÁEÉIÍOÓÖŐUÚÜŰ";
export function tilesUI(box, word, io, clueText) {
  return sharedTilesUI(box, io, { word, clueText, arrange: shuffle, isVowel: ch => VOWELS.includes(ch) });
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
      b.setAttribute("aria-label", `Vágás ${aAz(i + 1)} ${i + 1}. és ${i + 2}. betű között`);
      gapBtns.set(g, b); cell.append(b);
    }
    row.append(cell);
  });
  const paint = () => gapBtns.forEach((b, g) => { b.className = "sylgap" + (lock.has(g) ? " lock" : on.has(g) ? " on" : ""); b.textContent = on.has(g) || lock.has(g) ? "-" : ""; });
  paint();
  const hint = el("div", "clue-box"); hint.style.display = "none";
  const bar = el("div", "help-bar");
  const h1 = btn("help-btn", "🔢 Hány szótag?", () => { if (!io.answering()) return; io.useLearningAid?.(); hint.textContent = `💡 Ahány magánhangzó, annyi szótag. Itt ${want.size + 1} szótag van, tehát ${want.size} vágás kell.`; hint.style.display = "block"; h1.disabled = true; });
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
