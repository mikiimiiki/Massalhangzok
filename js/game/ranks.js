// ===== Ranglétra: 12 rang – a ranghatárok minden játékban közösek, a nevek és a tárgyak a játékéi =====
import { dayNum, dateKey } from "../core/dates.js";
import { SCORING } from "../core/scoring.js";

export const RANKS = [
  { name: "Kezdő Betűvadász", pts: 0, unlocks: ["av:🦉", "av:🦊", "av:🐻", "av:🐱", "av:🐶", "av:🐰", "av:🐧", "av:🦁", "av:🐼", "av:🦄", "av:🐲", "av:🐸", "av:🚗", "av:🚕", "av:🚙", "av:🤖", "av:🔧", "av:💡", "av:🎀", "av:🌸", "av:💖", "av:🍭", "av:🍬", "av:🍦", "bg:base", "confetti:color", "frame:none"] },
  { name: "Betűgyűjtő", pts: 300, unlocks: ["av:🦖", "av:🚓", "av:🌷", "av:🍩", "av:⚙️", "bg:sunset"] },
  { name: "Helyesírás Inas", pts: 700, unlocks: ["av:🐙", "av:🚑", "av:🍪", "av:👗", "av:🍫", "bg:ocean"] },
  { name: "Szókirakó", pts: 1200, unlocks: ["av:🏍️", "av:🦅", "av:🧚", "av:🦋", "av:🔋", "bg:candy"] },
  { name: "Mássalhangzó Mester", pts: 1800, unlocks: ["av:🚀", "av:🚜", "av:🦔", "av:🧁", "av:🍰", "bg:forest"] },
  { name: "Szótagoló", pts: 2500, unlocks: ["av:🚒", "av:🐺", "av:👸", "av:🧲", "av:💎", "bg:mint"] },
  { name: "Betűvarázsló", pts: 3300, unlocks: ["av:👑", "av:🛰️", "av:🍓", "av:🔬", "av:🦥", "bg:galaxy", "confetti:stars"] },
  { name: "Szófejtő", pts: 4200, unlocks: ["av:🐉", "av:🏎️", "av:🥧", "av:🦚", "av:🍮", "bg:ember", "frame:silver"] },
  { name: "Nyelvtan Bajnok", pts: 5200, unlocks: ["av:🚁", "av:🦩", "av:🎮", "av:🐋", "av:💄", "bg:aurora"] },
  { name: "Helyesírás Lovag", pts: 6300, unlocks: ["av:🧙", "av:🐘", "av:🔭", "av:🩰", "av:✈️", "bg:peach"] },
  { name: "Betűkirály", pts: 7500, unlocks: ["av:🎂", "av:🦜", "av:🛸", "av:🌈", "av:📡", "frame:gold"] },
  { name: "Helyesírás Legenda", pts: 9000, unlocks: ["av:🧞", "av:🍨", "av:🦈", "av:🏆", "av:🧠", "bg:legend"], title: "Legenda" },
];
export function rankIndex(pts) { let i = 0; while (i + 1 < RANKS.length && pts >= RANKS[i + 1].pts) i++; return i; }
export function rankOf(pts) {
  const i = rankIndex(pts), r = RANKS[i], next = RANKS[i + 1] || null;
  return { i, n: i + 1, total: RANKS.length, name: r.name, rank: r, next: next ? next.name : null, nextRank: next,
    pct: next ? (pts - r.pts) / (next.pts - r.pts) : 1, need: next ? next.pts - pts : 0 };
}
// A rangból kinyílt tárgyak
export const rankItems = pts => RANKS.slice(0, rankIndex(pts) + 1).flatMap(r => r.unlocks);
// Melyik rangnál nyílik egy tárgy (null: nem rangból jön, pl. ünnepi)
export function unlockRank(id) { const i = RANKS.findIndex(r => r.unlocks.includes(id)); return i < 0 ? null : RANKS[i]; }

// Egy nap ⛽-je: ha el van tárolva (days[].pts), azt; régebbi napoknál becslés a jó/rossz válaszokból
const dayPts = d => (d ? (d.pts != null ? d.pts : (d.ok || 0) * SCORING.first + ((d.n || 0) - (d.ok || 0)) * 3) : 0);
export const DEFAULT_PER_DAY = 120;
// „kb. Y nap”: az utolsó 7 nap átlagos napi ⛽-je alapján (adat nélkül 120 ⛽/nap)
export function daysTo(u, need, today = dayNum()) {
  if (need <= 0) return 0;
  let sum = 0; for (let d = today - 6; d <= today; d++) sum += dayPts((u.days || {})[dateKey(d)]);
  const per = sum > 0 ? sum / 7 : DEFAULT_PER_DAY;
  return Math.max(1, Math.ceil(need / per));
}
