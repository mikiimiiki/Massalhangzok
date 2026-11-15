import re, sys, time, json, urllib.request, urllib.parse

src, out = sys.argv[1], sys.argv[2]
words = []
for line in open(src, encoding="utf-8"):
    line = line.strip()
    m = re.match(r"^([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű-]+)", line)
    if not m or "-" not in m.group(1) or line.startswith("==="):
        continue
    words.append(m.group(1))

res = {}
try:
    res = json.load(open(out, encoding="utf-8"))
except Exception:
    pass
for syl in words:
    w = syl.replace("-", "")
    if w in res:
        continue
    url = "https://helyesiras.mta.hu/helyesiras/default/hyph?q=" + urllib.parse.quote(w)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")
        ul = re.search(r'<ul class="result">(.*?)</ul>', html, re.S)
        alts = re.findall(r"<i>(.*?)</i>", ul.group(1)) if ul else []
    except Exception as e:
        alts = ["HIBA: " + str(e)]
    res[w] = {"app": syl, "mta": alts}
    json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    time.sleep(1)
print("kész", len(res))
