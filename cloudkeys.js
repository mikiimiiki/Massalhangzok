// Firebase Realtime Database: a kulcsokban nem lehet . $ # [ ] / és vezérlőkarakter, üres kulcs sem lehet,
// és undefined / NaN / függvény érték sem kerülhet fel – ezek miatt a teljes feltöltés hibát dobna.
export const BAD_KEY = /[.$#\[\]\/\x00-\x1f\x7f]/;
export const fixKey = k => (String(k).replace(/[.$#\[\]\/\x00-\x1f\x7f]/g, "_") || "_").slice(0, 700);

// Feltöltés előtt megtisztítja az adatot. A `fixed` tömbbe gyűjti a javított kulcsokat (naplózáshoz).
export function cleanForCloud(v, fixed = [], path = "") {
  if (v === null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" || typeof v === "boolean") return v;
  if (typeof v !== "object") return null; // undefined, függvény, symbol, bigint
  if (Array.isArray(v)) return v.map((x, i) => cleanForCloud(x, fixed, `${path}/${i}`));
  const out = {};
  for (const [k, x] of Object.entries(v)) {
    const c = cleanForCloud(x, fixed, `${path}/${k}`);
    if (c === null) continue;
    let nk = BAD_KEY.test(k) || k === "" ? fixKey(k) : k;
    if (nk !== k) { while (nk in out || nk in v) nk += "_"; fixed.push(`${path}/${k}`); }
    out[nk] = c;
  }
  return out;
}

// Igaz, ha az adatban minden kulcs és érték feltölthető (a tesztek ezt ellenőrzik)
export function cloudSafe(v) {
  if (v === null || typeof v === "string" || typeof v === "boolean") return true;
  if (typeof v === "number") return Number.isFinite(v);
  if (typeof v !== "object") return false;
  return Object.entries(v).every(([k, x]) => k !== "" && !BAD_KEY.test(k) && cloudSafe(x));
}
