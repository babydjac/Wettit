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
  theme: getDefault("theme", "midnight"),
  font: getDefault("font", "modern"),
  autoplay: getDefault("autoplay", true),
  nsfwBlur: getDefault("nsfw-blur", false),
  cardsPerRow: getDefault("cards-row", 3),
  nsfwOnly: getDefault("nsfw-only", false),
  mediaType: getDefault("media-type", "all"), // all | images | videos
  minUpvotes: getDefault("min-upvotes", 0)
};

// -- Persist and update setting --
export function saveSetting(k, v) {
  settings[k] = v;
  localStorage.setItem(PREFIX + k, v);
}

// -- Theme definitions --
const theme = {
  midnight: {
    "--bg": "#0e1224",
    "--bg2": "#111735",
    "--fg": "#e9f4fa",
    "--muted": "#9db2c7",
    "--card": "#182042",
    "--hover": "#1a244f",
    "--accent": "#17e1cf",
    "--card-shadow": "rgba(23,225,207,0.18)"
  },
  neon: {
    "--bg": "#0a0a0f",
    "--bg2": "#101018",
    "--fg": "#f2f7ff",
    "--muted": "#9ea7b3",
    "--card": "#131321",
    "--hover": "#1a1a2e",
    "--accent": "#ff2bd6",
    "--card-shadow": "rgba(255,43,214,0.22)"
  },
  ocean: {
    "--bg": "#061a24",
    "--bg2": "#08202d",
    "--fg": "#e8fbff",
    "--muted": "#a1c7d1",
    "--card": "#0d2a3a",
    "--hover": "#0f3346",
    "--accent": "#19c4ff",
    "--card-shadow": "rgba(25,196,255,0.2)"
  },
  forest: {
    "--bg": "#0f1a14",
    "--bg2": "#13241a",
    "--fg": "#ecfff4",
    "--muted": "#a3c2b4",
    "--card": "#173326",
    "--hover": "#1b3a2b",
    "--accent": "#2ce87e",
    "--card-shadow": "rgba(44,232,126,0.18)"
  },
  rose: {
    "--bg": "#1b0f14",
    "--bg2": "#230f17",
    "--fg": "#ffeef6",
    "--muted": "#d7a9bc",
    "--card": "#2a121d",
    "--hover": "#311624",
    "--accent": "#ff5fa0",
    "--card-shadow": "rgba(255,95,160,0.2)"
  },
  grape: {
    "--bg": "#120a1a",
    "--bg2": "#1a0f26",
    "--fg": "#f7ecff",
    "--muted": "#cab3e6",
    "--card": "#221236",
    "--hover": "#2b1645",
    "--accent": "#a06bff",
    "--card-shadow": "rgba(160,107,255,0.2)"
  },
  solar: {
    "--bg": "#faf3dd",
    "--bg2": "#fff9e6",
    "--fg": "#1c160e",
    "--muted": "#6e604c",
    "--card": "#fff2cc",
    "--hover": "#ffeab3",
    "--accent": "#ff9f1c",
    "--card-shadow": "rgba(255,159,28,0.18)"
  },
  light: {
    "--bg": "#faf7f4",
    "--bg2": "#ffffff",
    "--fg": "#1a1a1a",
    "--muted": "#666",
    "--card": "#f4efe7",
    "--hover": "#ece6dc",
    "--accent": "#ff4500",
    "--card-shadow": "rgba(0,0,0,0.08)"
  },
  dark: {
    "--bg": "#171717",
    "--bg2": "#202020",
    "--fg": "#f0f0f0",
    "--muted": "#a6a6a6",
    "--card": "#2a2a2a",
    "--hover": "#1f1f1f",
    "--accent": "#ff4500",
    "--card-shadow": "rgba(0,0,0,0.28)"
  }
};

const fonts = {
  modern: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  rounded: "ui-rounded, 'SF Pro Rounded', Nunito, Quicksand, Poppins, system-ui, -apple-system, sans-serif",
  serif: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  display: "'Avenir Next', Montserrat, Poppins, Raleway, system-ui, sans-serif"
};

// -- Theme applier (call on load or theme change) --
export function applyTheme(name) {
  const vars = theme[name] || theme.midnight;
  for (let k in vars) document.body.style.setProperty(k, vars[k]);
}
export function applyFont(name) {
  const stack = fonts[name] || fonts.modern;
  document.body.style.setProperty("--font", stack);
}
applyTheme(settings.theme);
applyFont(settings.font);

// -- Export utility for UI to get available themes --
export function getThemeNames() {
  return Object.keys(theme);
}

export function getFontNames() {
  return Object.keys(fonts);
}
