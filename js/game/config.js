// ===== A Helyesírás Kaland paraméterei a közös vázhoz =====
import { PACK } from "../pack/index.js";
import { settingsDefs } from "../shell/settings-defs.js";
import { FIREBASE_CONFIG } from "./firebase-config.js";
import * as ranks from "./ranks.js";
import * as catalog from "./cosmetics-catalog.js";
import * as events from "./events.js";
import * as gifts from "./gifts.js";
import { migrateFamily, migrateUser, newId } from "./migrate.js";

export const GAME = {
  id: "helyesiras-kaland",
  title: "Helyesírás Kaland",
  settingsTitle: "⚙️ Szülői beállítások",
  storeKey: "helyesiras_kaland_v4", simKey: "helyesiras_kaland_sim",
  firebase: FIREBASE_CONFIG,
  // téma és szavak
  bodyClass: "theme-light",
  logo: "🦉", mascot: "🦉",
  pointsIcon: "⭐", pointsName: "pont",
  topicWord: { one: "feladat", many: "feladatok", acc: "feladatra", tab: "🃏 Témák" },
  homeWord: "főmenü",
  praise: ["Szuper! 🦉", "Helyes! ⭐", "Telitalálat! 🎯", "Így kell ezt! 💪", "Hibátlan! 🌟", "Ügyes vagy! 🏆"],
  texts: {
    welcome: "Üdv a Helyesírás Kalandban! 🦉", pickAvatar: "Hogy hívnak? Válassz egy avatart is!",
    unlockHint: "🎁 Gyakorlással újabb avatarokat, témákat és konfettit nyithatsz ki!", go: "Indulás! 🦉",
    helloTodo: "Indulhat a mai vegyes kaland?", helloDone: "A mai küldetés kész – gyakorolhatsz tovább! 🌟",
    start: "🚀 Vegyes kaland", cont: "🚀 Folytatás", again: "🚀 Még egy kör", mission: "🚀 Vegyes kaland", plus: "🚀 Plusz kör",
    explainTitle: "Nézzük meg együtt! 🦉", sideIcon: "🦉", helpTitle: "❓ Milyen feladatok vannak?",
    homeTip: "✏️ Tipp: a hibás szavakat írd le egyszer a füzetedbe is – így jobban megmaradnak.", playTip: "",
  },
  legendLine: "Te vagy a Helyesírás Legendája! 🌟",
  defaults: { goalTasks: 10, goalMin: 15, bigGoal: 100, freeTasks: 10 },
  speechLang: "hu-HU",
  snowColor: "rgba(147,197,253,.95)",
  ranks, catalog, events, gifts,
  migrate: { family: migrateFamily, user: migrateUser, newId },
};

export const SETTINGS = settingsDefs(GAME, PACK);
