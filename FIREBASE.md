# Felhős mentés – belépés és biztonság

A játék továbbra is a böngészőbe ment (localStorage). A felhős szinkronhoz egy szülő
**Google-fiókkal** vagy **e-mailes belépő linkkel** lép be, és a család adatait csak a családhoz
hozzáadott e-mail-címek olvashatják és írhatják. A régi „szinkronkód” már csak a család belső
azonosítója, önmagában nem ad hozzáférést.

## Adatszerkezet (Realtime Database)

```
families/{kód}/members/{e-mail}  = true      ← a pont vesszőre cserélve (pl. anna,kiss@gmail,com)
families/{kód}/users/{játékos}   = {...}     ← változatlan
families/{kód}/parent            = {salt, hash}
memberOf/{e-mail}/{kód}          = true      ← ebből tudja egy új eszköz, melyik a családod
```

## Átállás a régi (kódos) változatról – adatvesztés nélkül

1. **Biztonsági mentés:** Firebase konzol → Realtime Database → ⋮ → *Export JSON*.
2. **Belépési módok bekapcsolása:** Authentication → Sign-in method →
   *Google* ✔, *Email/Password* ✔ + *Email link (passwordless sign-in)* ✔.
3. **Domain engedélyezése:** Authentication → Settings → Authorized domains → `mikiimiiki.github.io`.
4. Az új kód kerüljön ki a GitHub Pages-re.
5. **Szabályok:** Realtime Database → Rules → a `database.rules.json` tartalma → *Publish*.
6. Azon az eszközön, ahol a régi szinkronkód be van állítva: ☁️ gomb → belépés.
   A játék automatikusan „igényli” a meglévő családot – az adatok a helyükön maradnak.
7. ☁️ panel → add hozzá a másik szülő e-mail-címét. Minden további eszközön elég belépni.

Egy még nem igényelt régi családot az igényelhet, aki ismeri a kódját és belép – ezért az
5–6. lépést érdemes egymás után, gyorsan elvégezni. Igénylés után a kód már semmit nem ér.
