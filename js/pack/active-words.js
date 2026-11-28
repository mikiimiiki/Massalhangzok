// A megadott szókészlet; az eredeti adatbázis változatlan marad.
import { aAz } from "../core/dom.js";
export const CATALOG = {
  long1n: ["állat", "állomás", "befőtt", "billentyű", "bükkfa", "csillag", "csillagász", "dallam", "dunna", "ellenség", "forrás", "futballista", "függöny", "holló", "hullám", "illat", "kakukk", "kanna", "kotta", "makk", "megálló", "mellény", "olló", "orr", "orvosság", "pikkely", "pillanat", "pillangó", "puttony", "szalonna", "szappan", "szempilla", "szökkenés", "toll", "töltőtoll", "ujj", "uzsonna", "ünnep", "váll", "villa", "villamos", "vízcsepp"],
  long2n: ["asszony", "bosszú", "dinnye", "gally", "hattyú", "könny", "meggy", "menyasszony", "mennydörgés", "mennyezet", "összeg", "szivattyú", "vessző"],
  voweln: ["boríték", "bőr", "bőrönd", "bútor", "búza", "csónak", "csőr", "csősz", "drót", "elmúlás", "evőeszköz", "fiók", "fióka", "főnév", "főváros", "gombóc", "gúnya", "gyík", "híd", "hírlap", "hóember", "hónap", "hóvirág", "hús", "ígéret", "kerítés", "kívánság", "kórház", "kút", "lúd", "mókus", "mosópor", "múzeum", "műsor", "nővér", "nyúl", "október", "óra", "óvoda", "óvónő", "ősz", "őz", "papír", "pók", "pulóver", "radír", "rendőr", "rím", "róka", "rózsa", "színész", "színház", "szív", "szúnyog", "teknős", "tűz", "tyúk", "tyúkól", "újság", "úr", "út", "vasút", "víz"],
  endoo: ["ajtó", "autó", "barátnő", "cipó", "cipő", "csengő", "cső", "dió", "erdő", "esztendő", "felhő", "folyó", "folyosó", "golyó", "hajó", "hintó", "hógolyó", "holló", "karó", "kóró", "költő", "kunyhó", "lépcső", "levegő", "ló", "mogyoró", "olló", "öregapó", "pókháló", "ragasztó", "repülő", "rigó", "sütnivaló", "szajkó", "szitakötő", "szőlő", "tanító", "televízió", "tó", "tűzoltó", "űrhajó", "zacskó", "zsebkendő"],
  enduu: ["ágyú", "betű", "billentyű", "bosszú", "bú", "derű", "emlékmű", "fésű", "fiú", "fű", "gyanú", "gyűrű", "gyűszű", "háború", "hattyú", "hegedű", "kesztyű", "kopoltyú", "koszorú", "odú", "sarkantyú", "söprű", "szú", "tanú", "tű", "vályú", "varjú"],
  shortuu: ["alku", "anyu", "apu", "áru", "bábu", "batyu", "daru", "eskü", "falu", "gyalu", "hamu", "Icu", "kakadu", "kapu", "kenu", "lapu", "menü", "Pityu", "revü", "Samu", "saru", "satu", "zsalu"],
  jn: ["ajándék", "ajtó", "díj", "éjszaka", "fürj", "haj", "hajnal", "hajó", "héja", "jaguár", "játék", "játszótér", "jegesmedve", "joghurt", "juhász", "máj", "majom", "papagáj", "sajt", "száj", "szajkó", "táj", "talaj", "tej", "tejföl", "tejszín", "tojás", "ujj", "újság", "űrhajó", "vaj", "zaj", "zsivaj"],
  lyn: ["állóhely", "bagoly", "bélyeg", "bélyegző", "bivaly", "bolygó", "csermely", "csuklya", "erkély", "fogoly", "folyam", "folyó", "folyosó", "furulya", "gally", "gereblye", "gerely", "gólya", "golyó", "harkály", "hely", "helyesírás", "hógolyó", "ibolya", "jégpálya", "kályha", "kastély", "karvaly", "király", "korcsolya", "kulcslyuk", "lakóhely", "lyuk", "osztály", "pálya", "pályaudvar", "petrezselyem", "pulyka", "rejtekhely", "sirály", "súly", "szabály", "ülőhely", "ünnepély", "veszély"],
  long1v: ["áll", "álldogál", "ballag", "berreg", "billeg", "cammog", "csattog", "cselleng", "csörren", "csurran", "csügged", "durran", "faggat", "forr", "fullad", "függ", "füllent", "guggol", "gyullad", "hall", "hallgat", "hull", "illatozik", "illeszt", "izzik", "koppan", "lebben", "mossa", "pattan", "rázza", "roppan", "suttog", "száll", "szállingózik", "szállít", "szégyell", "szétpukkad", "szökken", "ujjong", "ünnepel", "varr", "viccel", "villámlik", "virrad", "zöldell", "zörren", "zümmög"],
  long2v: ["bosszant", "buggyan", "cseppen", "fonnyad", "fröccsen", "füttyent", "gunnyaszt", "könnyezik", "kuruttyol", "loccsan", "pottyan", "reccsen", "szunnyad"],
  vowelv: ["bólint", "bőg", "csíp", "bújik", "bújócskázik", "búsul", "csúszik", "dúdol", "dúl-fúl", "dűl", "előz", "fejlődik", "fogócskázik", "főz", "fúj", "fűrészel", "fűt", "fűz", "gőzöl", "győz", "gyújt", "gyűjt", "gyűlik", "hív", "húz", "ígér", "ír", "kérődzik", "kezdődik", "kísér", "kíván", "kóstol", "megszívlel", "múlik", "nő", "nyílik", "nyújtózkodik", "nyúl", "nyúlik", "őriz", "rúg", "síel", "sír", "sírdogál", "spórol", "sóz", "szánkózik", "színez", "szív", "szól", "szór", "szunyókál", "szűnik", "úszik", "zúg"],
  endit: ["állít", "borít", "buzdít", "csördít", "díszít", "épít", "erősít", "fényesít", "fordít", "gömbölyít", "gurít", "gyógyít", "gyorsít", "hajlít", "halkít", "indít", "javít", "készít", "lassít", "lódít", "melegít", "merít", "mozdít", "nyerít", "okít", "ordít", "pirosít", "rögzít", "segít", "szállít", "szárít", "szédít", "szelídít", "szépít", "szólít", "szundít", "tanít", "terít", "tompít", "veszít", "virít"],
  endul: ["ámul", "bámul", "borul", "búsul", "csördül", "derül", "fésül", "feszül", "fordul", "frissül", "gurul", "gyógyul", "hegedül", "kékül", "kerül", "készül", "kondul", "merül", "mozdul", "őszül", "pendül", "perdül", "pirul", "repül", "sárgul", "sérül", "tanul", "zöldül"],
  jv: ["ájul", "befejez", "bújik", "bujkál", "fáj", "fejel", "felejt", "fúj", "hajladozik", "hajol", "ijed", "jajgat", "jár", "játszik", "javít", "jegyzetel", "jelent", "jön", "rajzol", "nyújtózkodik", "tájékoztat", "zajong", "zsivajog"],
};
export const RULES = {
  vowel: { name: "Magánhangzók: hosszú vagy rövid?", sub: "Hosszú vagy rövid magánhangzó illik a hiány helyére?", example: "b_tor → ú · _jj → u · kap_ → u · tan_t → í · rep_l → ü" },
  endoo: { name: "Főnevek: -ó, -ő", sub: "Pótold a szóvégi ó vagy ő betűt!", example: "ajt_: o vagy ó" },
  enduu: { name: "Főnevek: -u, -ü, -ú, -ű", sub: "Figyelj a hosszú szóvégre és a rövid kivételekre!", example: "kap_: u vagy ú" },
  endit: { name: "Igék: -ít", sub: "Pótold az -ít végződést!", example: "tan__: it vagy ít" },
  endul: { name: "Igék: -ul, -ül", sub: "Pótold az -ul vagy -ül végződést!", example: "rep__: ül vagy űl" },
};
export const ACTIVE_WORDS = new Set(Object.values(CATALOG).flat());
export const LONG_WORDS = [...new Set([...CATALOG.long1n, ...CATALOG.long2n, ...CATALOG.long1v, ...CATALOG.long2v])];
export const JLY_WORDS = [...new Set([...CATALOG.jn, ...CATALOG.lyn, ...CATALOG.jv])];
export const RULE_WORDS = {
  vowel: [...new Set([...CATALOG.voweln, ...CATALOG.vowelv])],
  endoo: CATALOG.endoo,
  enduu: [...CATALOG.enduu, ...CATALOG.shortuu],
  endit: CATALOG.endit,
  endul: CATALOG.endul,
};
const counterpart = { á: "a", é: "e", í: "i", ó: "o", ő: "ö", ú: "u", ű: "ü", u: "ú", ü: "ű", ít: "it", ul: "úl", ül: "űl" };
const vowelTarget = { szánkózik: "ó", vasút: "ú", tyúkól: "ú", nyújtózkodik: "ú", szunyókál: "ó" };
export function ruleItem(topic, word) {
  if (!RULE_WORDS[topic]?.includes(word)) return null;
  const part = topic === "vowel" ? vowelTarget[word] || word.match(/[áéíóőúű]/u)?.[0] : word.slice(topic === "endit" || topic === "endul" ? -2 : -1);
  const position = topic === "vowel" ? word.indexOf(part) : word.length - part.length;
  const other = counterpart[part];
  if (!other || position < 0) throw new Error(`Missing target: ${topic}/${word}`);
  const mask = word.slice(0, position) + "_".repeat(part.length) + word.slice(position + part.length);
  const tip = topic === "endit" ? "Az -ít végződésben hosszú í van." :
    topic === "endul" ? "Az -ul és -ül végződésben rövid a magánhangzó." :
    topic === "endoo" ? "Ezeknek a főneveknek a végén hosszú ó vagy ő áll." :
    topic === "enduu" && CATALOG.shortuu.includes(word) ? "Ez a szó a rövid u vagy ü végű kivételek közé tartozik." :
    topic === "enduu" ? "Ennek a főnévnek a vége hosszú ú vagy ű." : "Figyeld meg a magánhangzó hosszúságát!";
  return { part, other, mask, tip };
}

// ===== Összevont téma: „Magánhangzók – hosszú vagy rövid?” (7 csoport, kb. 40% rövid helyes válasz) =====
// Rövid magánhangzós ellenpéldák az aktív listáról: itt a rövid a helyes (a gyerekek gyakran hosszúnak írják).
// part: a kitakart rövid magánhangzó; at: hányadik előfordulása (alapból az első).
export const SHORT_STEM = [
  { w: "ujj", part: "u" }, { w: "ujjong", part: "u" }, { w: "ünnep", part: "ü" }, { w: "ünnepel", part: "ü" }, { w: "ünnepély", part: "ü" },
  { w: "uzsonna", part: "u" }, { w: "illat", part: "i" }, { w: "illatozik", part: "i" }, { w: "csillag", part: "i" }, { w: "hullám", part: "u" },
  { w: "furulya", part: "u" }, { w: "bujkál", part: "u" }, { w: "szivattyú", part: "i" }, { w: "sirály", part: "i" }, { w: "ibolya", part: "i" },
  { w: "fiók", part: "i" }, { w: "fióka", part: "i" }, { w: "dió", part: "i" }, { w: "fiú", part: "i" }, { w: "rigó", part: "i" },
  { w: "kunyhó", part: "u" }, { w: "pulóver", part: "u" }, { w: "papír", part: "a" }, { w: "radír", part: "a" }, { w: "boríték", part: "o" },
  { w: "kerítés", part: "e" }, { w: "múzeum", part: "e" }, { w: "tojás", part: "o" }, { w: "juhász", part: "u" }, { w: "gurul", part: "u" },
];
const SHORT_OF = { á: "a", é: "e", í: "i", ó: "o", ő: "ö", ú: "u", ű: "ü" };
const LONG_OF = Object.fromEntries(Object.entries(SHORT_OF).map(([l, s]) => [s, l]));
const isShortUU = w => CATALOG.shortuu.includes(w);
// csoport → szavak
export const VOWEL_GROUPS = {
  stemLong: RULE_WORDS.vowel,
  stemShort: SHORT_STEM.map(x => x.w),
  endoo: CATALOG.endoo,
  enduuLong: CATALOG.enduu,
  enduuShort: CATALOG.shortuu,
  endit: CATALOG.endit,
  endul: CATALOG.endul,
};
export const VOWEL_WORDS = [...new Set(Object.values(VOWEL_GROUPS).flat())];
// Egy feladatelem: { group, word, start, part, other, kind: "rule" | "exception" | "memo", why }
export function vowelItem(group, word) {
  if (!VOWEL_GROUPS[group] || !VOWEL_GROUPS[group].includes(word)) return null;
  let part, start;
  if (group === "stemShort") {
    part = SHORT_STEM.find(x => x.w === word).part; start = word.indexOf(part);
  } else {
    const r = ruleItem(group === "stemLong" ? "vowel" : group.startsWith("enduu") ? "enduu" : group, word);
    part = r.part; start = r.mask.indexOf("_");
  }
  const other = group === "endit" ? "it" : group === "endul" ? (part === "ul" ? "úl" : "űl") : (SHORT_OF[part] || LONG_OF[part]);
  if (start < 0 || !other) throw new Error(`Hiányos magánhangzó-elem: ${group}/${word}`);
  const q = s => `„${s}”`;
  const why = {
    stemLong: `🧠 Meg kell jegyezni: a szótőben nincs szabály a hosszúságra – ${aAz(q(word))} ${q(word)} szóban hosszú ${part} van. Mondd ki lassan, és jegyezd meg!`,
    stemShort: `🧠 Meg kell jegyezni: ${aAz(q(word))} ${q(word)} szóban itt rövid ${part} van, nem nyújtjuk. Mondd ki lassan, és jegyezd meg!`,
    endoo: "📏 Szabály: a főnevek végén az ó és az ő mindig hosszú (ajtó, cipő, erdő).",
    enduuLong: "📏 Szabály: a főnevek végén az ú és az ű hosszú (betű, kesztyű, varjú) – csak néhány kivétel rövid (kapu, falu, menü).",
    enduuShort: `⚠️ Kivétel: ${aAz(q(word))} ${q(word)} azon kevés főnév közé tartozik, amelynek a végén rövid u vagy ü van (alku, falu, kapu, menü…).`,
    endit: "📏 Szabály: az -ít végű igékben mindig hosszú í van (tanít, épít, segít).",
    endul: "📏 Szabály: az -ul, -ül végű igékben az u és az ü mindig rövid (tanul, repül, gurul).",
  }[group];
  const kind = group === "enduuShort" ? "exception" : group.startsWith("stem") ? "memo" : "rule";
  return { group, word, start, part, other, kind, why };
}
// sub: „csoport|szó”; régi / sima szó esetén az első illő csoport (pl. ismétlésből jövő szó)
export function vowelItemFromSub(sub) {
  const s = String(sub || ""), i = s.indexOf("|");
  if (i > 0) { const it = vowelItem(s.slice(0, i), s.slice(i + 1)); if (it) return it; }
  const w = i > 0 ? s.slice(i + 1) : s;
  for (const g of ["endit", "endul", "endoo", "enduuShort", "enduuLong", "stemShort", "stemLong"]) { const it = vowelItem(g, w); if (it) return it; }
  return null;
}
// a régi öt téma azonosítója → az összevont téma (félbehagyott kör, lezárás, ismétlés biztonsága)
export const OLD_VOWEL_TOPICS = ["endoo", "enduu", "endit", "endul"];
