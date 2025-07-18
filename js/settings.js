// settings.js
// Boss, this is the control center for user settings and theme handling for your extension.

const PREFIX = "wettit-";

function getDefault(key, def) {
  if (localStorage.getItem(PREFIX + key) === null) return def;
  if (typeof def === "boolean") return localStorage.getItem(PREFIX + key) !== "false";
  if (typeof def === "number") return Number(localStorage.getItem(PREFIX + key));
  return localStorage.getItem(PREFIX + key);
}

// -- Main settings object (live in memory, always synced) --
export let settings = {
  theme: getDefault("theme", "dark"),
  autoplay: getDefault("autoplay", true),
  nsfwBlur: getDefault("nsfw-blur", false),
  cardsPerRow: getDefault("cards-row", 3)
};

// -- Persist and update setting --
export function saveSetting(k, v) {
  settings[k] = v;
  localStorage.setItem(PREFIX + k, v);
}

// -- Theme definitions --
const theme = {
  dark: {
    "--bg": "#171717",
    "--bg2": "#222",
    "--fg": "#fff",
    "--muted": "#bbb",
    "--card": "#2e2e2e",
    "--hover": "#191919",
    "--accent": "#ff4500",
    "--card-shadow": "rgba(0,0,0,0.3)"
  },
  light: {
    "--bg": "#faf7f4",
    "--bg2": "#fff",
    "--fg": "#1a1a1a",
    "--muted": "#444",
    "--card": "#f4efe7",
    "--hover": "#f2e8e0",
    "--accent": "#ff4500",
    "--card-shadow": "rgba(0,0,0,0.1)"
  }
};

// -- Theme applier (call on load or theme change) --
export function applyTheme(name) {
  const vars = theme[name === "light" ? "light" : "dark"];
  for (let k in vars) {
    document.body.style.setProperty(k, vars[k]);
  }
}
applyTheme(settings.theme);

// -- Export utility for UI to get available themes --
export function getThemeNames() {
  return Object.keys(theme);
}
