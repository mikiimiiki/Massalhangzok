// ===== Új jelentéskülönbségi mondatpárok az aktív szólistához =====
// Mindkét alak valódi, de mást jelentő szó; a helyes válasz (ok) mindig az aktív listán van, a hibás (bad) lehet listán kívüli.
export const EXTRA_PAIRS = [
  { s: "A hüvelykujj is egy ___ a kezünkön.", ok: "ujj", bad: "új", hint: "Testrész (a kéz része)" },
  { s: "A buszmegállóban sokan ___ a sorban.", ok: "áll", bad: "ál", hint: "Mit csinál? (nem ül)" },
  { s: "A sas magasan ___ az ég felett.", ok: "száll", bad: "szál", hint: "Mit csinál? (repül)" },
  { s: "Nagymama inget ___ a gépen.", ok: "varr", bad: "var", hint: "Mit csinál? (tűvel, cérnával)" },
  { s: "Az ___ mellett magas fák nőnek.", ok: "út", bad: "üt", hint: "Hol? (amin közlekedünk)" },
  { s: "Ez a cipő puha, valódi ___.", ok: "bőr", bad: "bor", hint: "Anyag (az állat bundája alatti réteg)" },
  { s: "Apa vasárnap finom ebédet ___.", ok: "főz", bad: "fűz", hint: "Mit csinál? (ételt készít)" },
  { s: "Varrás előtt cérnát ___ a tűbe.", ok: "fűz", bad: "főz", hint: "Mit csinál? (a tű fokán átdugja)" },
  { s: "A tisztáson egy ijedős ___ legelt.", ok: "őz", bad: "ősz", hint: "Állat (erdei, kecses)" },
  { s: "Már ___ van, hullanak a falevelek.", ok: "ősz", bad: "őz", hint: "Évszak (szeptembertől novemberig)" },
];
export const EXTRA_WHY = {
  ujj: "Az ujj a kezünk része: két j. Az „új” (nem régi) egy j-vel és hosszú ú-val írandó.",
  áll: "Az áll ige (nem ül) két l-lel. Az „ál-” jelentése: hamis (álarc, álnév).",
  száll: "A száll ige (repül) két l-lel. A „szál” egy fonal, egy l.",
  varr: "A varr ige (tűvel öltöget) két r-rel. A „var” a seben képződő kéreg.",
  út: "Az út, amin járunk: hosszú ú. Az „üt” azt jelenti: megüt valakit.",
  bőr: "A bőr anyag, hosszú ő-vel. A „bor” ital, rövid o-val.",
  főz: "A főz ételt készít: ő-vel. A „fűz” cérnát tesz a tűbe: ű-vel.",
  fűz: "A fűz cérnát tesz a tűbe (és fa neve is): ű-vel. A „főz” ételt készít.",
  őz: "Az őz erdei állat: egy ő és z. Az „ősz” évszak: sz-szel.",
  ősz: "Az ősz évszak: sz-szel a végén. Az „őz” egy erdei állat.",
};
// A régi mondatpárok közül néhány súgója elárulta a választ („hosszú ll”) – ezek helyett:
export const PAIR_HINT_FIX = {
  dunna: "Vastag, tollal töltött takaró",
  hall: "Mit csinál? (fülével érzékel)",
  toll: "Mi hullott ki? (a madár testét borítja)",
};
