// A megadott szókészlet; az eredeti adatbázis változatlan marad.
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
  vowel: { name: "Hosszú magánhangzó", sub: "Rövid vagy hosszú magánhangzó illik a hiány helyére?", example: "b_tor: u vagy ú" },
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
