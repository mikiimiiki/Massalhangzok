// ===== A Helyesírás Kaland ünnepei (2026/27 tél) =====
// Az eseménymotor közös (js/core/events.js, a Matek Űrkalandból). A tárgykulcsok ennek az appnak a jutalomrendszerét
// követik: "avatar:…" és "theme:…" (lásd REWARDS az app.js-ben, by: "event"); a matricák "st:…".

const pts = n => ({ pts: n }), avatar = v => ({ item: "avatar:" + v }), theme = v => ({ item: "theme:" + v }), sticker = e => ({ item: "st:" + e });

// 24 ablak: főleg pont és matricák; különleges: 6. Mikulás, 13. hópelyhes téma, 20. hóember, 24. karácsony
const ADVENT = [
  [pts(20)], [sticker("🦌")], [pts(30)], [sticker("⭐")], [pts(20)], [avatar("🎅")],
  [sticker("🍪")], [pts(30)], [sticker("🧦")], [pts(50)], [sticker("🔔")], [pts(20)],
  [theme("snowy")], [sticker("🕯️")], [pts(30)], [sticker("🍬")], [pts(50)], [sticker("🎁")],
  [pts(30)], [avatar("⛄")], [sticker("🦉")], [pts(50)], [sticker("🧸")], [theme("xmas"), avatar("🎄")],
].map((reward, i) => ({ day: i + 1, reward }));

export const EVENTS = [
  { id: "advent2026", kind: "advent", from: "2026-12-01", to: "2026-12-24", title: "🎄 Adventi naptár", windows: ADVENT },
  { id: "santa2026", kind: "once", from: "2026-12-06", to: "2026-12-06", when: "missionDone",
    reward: [avatar("🎅"), pts(100)], title: "🎅 Megjött a Mikulás!", text: "A mai napi célért a Mikulás is hozott valamit a csizmádba!" },
  { id: "xmas2026", kind: "once", from: "2026-12-24", to: "2026-12-26", when: "missionDone",
    reward: [theme("xmas"), avatar("🎄"), pts(50)], title: "🎄 Boldog karácsonyt!", text: "Karácsonyi ajándék a mai napi célért – nézd meg a Gyűjteményben!" },
  { id: "newyear2027", kind: "once", from: "2026-12-31", to: "2027-01-01", when: "missionDone",
    reward: [avatar("🥳"), theme("newyear")], title: "🎆 Boldog új évet!", text: "Szilveszteri avatar és téma – sikeres új évet!" },
  { id: "winter", kind: "ambient", from: "12-01", to: "01-06", effect: "snow" },
];
// „Plusz kör”: a napi cél felett még ennyi helyes válasz – ezután nyitható ki egy korábbi, kihagyott ablak
export const PLUS_ROUND = 5;
