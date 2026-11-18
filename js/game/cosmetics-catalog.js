// ===== A Helyesírás Kaland kinyitható tárgyai (a régi jutalomlistából generálva, a közös ranghatárokhoz igazítva) =====
// Egy tárgy: { id: "fajta:érték", kind, label, show, ... }. A ranglétra (game/ranks.js) mondja meg, melyik rangnál nyílik.
export const KINDS = [
  { id: "av", label: "Avatar", icon: "🦉", slot: "avatar" },
  { id: "bg", label: "Téma", icon: "🎨", slot: "bg" },
  { id: "confetti", label: "Konfetti", icon: "🎊", slot: "confetti" },
  { id: "frame", label: "Névkeret", icon: "🏷️", slot: "frame" },
];
export const DEFAULTS = { bg: "bg:base", confetti: "confetti:color", frame: "frame:none" };
const av = (e, label, special) => ({ id: "av:" + e, kind: "av", label, show: e, value: e, ...(special ? { special: true } : {}) });
// világos témák: a váz a --space1/--space2/--glow változókból rajzolja a hátteret
const bg = (v, label, a, b, special) => ({ id: "bg:" + v, kind: "bg", label, vars: { space1: b, space2: a, glow: a }, ...(special ? { special: true } : {}) });
export const ITEMS = [
  av("🦉", "Bagoly"), av("🦊", "Róka"), av("🐻", "Medve"), av("🐱", "Cica"), av("🐶", "Kutya"), av("🐰", "Nyuszi"), av("🐧", "Pingvin"), av("🦁", "Oroszlán"), av("🐼", "Panda"), av("🦄", "Egyszarvú"), av("🐲", "Sárkányfej"), av("🐸", "Béka"), av("🚗", "Autó"), av("🚕", "Taxi"), av("🚙", "Terepjáró"), av("🤖", "Robot"), av("🔧", "Csavarkulcs"), av("💡", "Villanykörte"), av("🎀", "Masni"), av("🌸", "Cseresznyevirág"), av("💖", "Csillogó szív"), av("🍭", "Nyalóka"), av("🍬", "Cukorka"), av("🍦", "Fagyi"), av("🦖", "Dínó"), av("🚓", "Rendőrautó"), av("🌷", "Tulipán"), av("🍩", "Fánk"), av("⚙️", "Fogaskerék"), av("🐙", "Polip"), av("🚑", "Mentőautó"), av("🍪", "Keksz"), av("👗", "Ruha"), av("🍫", "Csoki"), av("🏍️", "Motor"), av("🦅", "Sas"), av("🧚", "Tündér"), av("🦋", "Pillangó"), av("🔋", "Elem"), av("🚀", "Rakéta"), av("🚜", "Traktor"), av("🦔", "Sün"), av("🧁", "Muffin"), av("🍰", "Tortaszelet"), av("🚒", "Tűzoltóautó"), av("🐺", "Farkas"), av("👸", "Hercegnő"), av("🧲", "Mágnes"), av("💎", "Gyémánt"), av("👑", "Korona"), av("🛰️", "Műhold"), av("🍓", "Eper"), av("🔬", "Mikroszkóp"), av("🦥", "Lajhár"), av("🐉", "Sárkány"), av("🏎️", "Versenyautó"), av("🥧", "Pite"), av("🦚", "Páva"), av("🍮", "Puding"), av("🚁", "Helikopter"), av("🦩", "Flamingó"), av("🎮", "Játékkonzol"), av("🐋", "Bálna"), av("💄", "Rúzs"), av("🧙", "Varázsló"), av("🐘", "Elefánt"), av("🔭", "Távcső"), av("🩰", "Balettcipő"), av("✈️", "Repülő"), av("🎂", "Születésnapi torta"), av("🦜", "Papagáj"), av("🛸", "Ufó"), av("🌈", "Szivárvány"), av("📡", "Parabolaantenna"), av("🧞", "Dzsinn"), av("🍨", "Kehelyfagyi"), av("🦈", "Cápa"), av("🏆", "Serleg"), av("🧠", "Okos agy"),
  bg("base", "Alap", "#fff7ed", "#e0f2fe"),
  bg("sunset", "Naplemente", "#ffedd5", "#fecdd3"),
  bg("ocean", "Óceán", "#cffafe", "#bfdbfe"),
  bg("candy", "Cukorka", "#fce7f3", "#e0e7ff"),
  bg("forest", "Erdő", "#dcfce7", "#fef9c3"),
  bg("mint", "Menta", "#ccfbf1", "#ecfccb"),
  bg("galaxy", "Galaxis", "#e9d5ff", "#c7d2fe"),
  bg("ember", "Parázs", "#fee2e2", "#fef3c7"),
  bg("aurora", "Sarki fény", "#d1fae5", "#ddd6fe"),
  bg("peach", "Barack", "#ffe4e6", "#ffedd5"),
  bg("legend", "Legendás aurora", "#e0f2fe", "#fae8ff"),
  { id: "confetti:color", kind: "confetti", label: "Színes konfetti", show: "🎊", colors: ["#7c3aed", "#ec4899", "#f59e0b", "#22c55e", "#06b6d4", "#facc15"], shape: "rect" },
  { id: "confetti:stars", kind: "confetti", label: "Csillageső", show: "🌠", colors: ["#fde68a", "#facc15", "#f59e0b", "#c4b5fd"], shape: "star" },
  { id: "frame:none", kind: "frame", label: "Nincs keret", show: "▫️", cls: "" },
  { id: "frame:silver", kind: "frame", label: "Ezüst keret", show: "🥈", cls: "fr-silver" },
  { id: "frame:gold", kind: "frame", label: "Arany keret", show: "🥇", cls: "fr-gold" },
  // ünnepi (különleges) tárgyak: eseményből (u.owned), csak megszerzés után látszanak
  av("🎅", "Mikulás", true), av("⛄", "Hóember", true), av("🎄", "Fenyő", true), av("🥳", "Szilveszter", true),
  bg("snowy", "❄️ Hópelyhes", "#f0f9ff", "#dbeafe", true), bg("xmas", "🎄 Karácsonyi", "#fee2e2", "#dcfce7", true), bg("newyear", "🎆 Szilveszteri", "#fef9c3", "#ede9fe", true),
];
export const itemById = id => ITEMS.find(i => i.id === id);
