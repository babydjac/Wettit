// subreddits.js
// Boss, this file is the source of all subreddit/favorite/pin logic for your Wettit extension. Modular, fast, and built for ComfyUI domination.

export const TOP_SUBREDDITS = [
  { name: "pics", icon: "https://styles.redditmedia.com/t5_2qh0u/styles/communityIcon_1jzqf6ks5y701.png" },
  { name: "funny", icon: "https://b.thumbs.redditmedia.com/wcE3z0u-dWduYgV4uZT4M-g1mtjWybFsvZXqUudFNHQ.png" },
  { name: "AskReddit", icon: "https://b.thumbs.redditmedia.com/woPThhbs8A5umOuUy9nrFug6tCQWoAt6Ae90j7X1Rls.png" },
  { name: "aww", icon: "https://b.thumbs.redditmedia.com/fBZaH-b9rIMvYutA6qkI2dcTCXn5TCMGs7f6C7NqQQY.png" },
  { name: "memes", icon: "" },
  { name: "videos", icon: "" },
  { name: "todayilearned", icon: "" },
  // NSFW
  { name: "nsfw", icon: "", nsfw: true },
  { name: "gonewild", icon: "", nsfw: true },
  { name: "RealGirls", icon: "", nsfw: true },
  { name: "NSFW_GIF", icon: "", nsfw: true },
  { name: "rule34", icon: "", nsfw: true },
  { name: "ass", icon: "", nsfw: true },
  { name: "boobs", icon: "", nsfw: true },
  { name: "cumsluts", icon: "", nsfw: true },
  { name: "porn", icon: "", nsfw: true }
];

// ---- Pins logic ----
const PIN_KEY = "wettit-pins";

/**
 * Get pinned subreddits from localStorage, returns Array of names.
 */
export function getPinnedSubs() {
  try {
    const pins = JSON.parse(localStorage.getItem(PIN_KEY));
    return Array.isArray(pins) ? pins : [];
  } catch {
    return [];
  }
}

/**
 * Set pinned subreddits (overwrites, expects array of names)
 */
export function setPinnedSubs(pins) {
  localStorage.setItem(PIN_KEY, JSON.stringify([...new Set(pins)].slice(0, 7)));
}

/**
 * Pin a subreddit (by name)
 */
export function pinSub(subName) {
  const pins = getPinnedSubs();
  if (!pins.includes(subName)) {
    pins.unshift(subName);
    setPinnedSubs(pins);
  }
}

/**
 * Unpin a subreddit (by name)
 */
export function unpinSub(subName) {
  setPinnedSubs(getPinnedSubs().filter(name => name !== subName));
}

/**
 * Clear all pinned subreddits.
 */
export function clearPins() {
  setPinnedSubs([]);
}

/**
 * Check if a sub is NSFW (based on TOP_SUBREDDITS or manual rules)
 */
export function isNsfwSub(subName) {
  const s = subName.toLowerCase();
  return !!TOP_SUBREDDITS.find(sub =>
    sub.nsfw && sub.name.toLowerCase() === s
  ) || ["nsfw", "gonewild", "realgirls", "nsfw_gif", "rule34", "ass", "boobs", "cumsluts", "porn"].includes(s);
}

// ---- Subreddit suggestions ----

const subredditCache = new Map();
const cacheTTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch subreddit suggestions from Reddit API (with fallback, returns Promise<array>)
 * @param {string} query
 * @returns {Promise<Array<{name:string,icon:string}>>}
 */
export async function fetchSubredditSuggestions(query) {
  if (!query) return TOP_SUBREDDITS;
  const cacheKey = `subreddits:${query}`;
  const now = Date.now();
  if (subredditCache.has(cacheKey) && now - subredditCache.get(cacheKey).timestamp < cacheTTL) {
    return subredditCache.get(cacheKey).suggestions;
  }
  try {
    const url = `https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(query)}&limit=12&include_over_18=on`;
    const res = await fetch(url);
    const json = await res.json();
    const suggestions = (json.data?.children || []).map(({ data }) => ({
      name: data.display_name,
      icon: data.icon_img || (data.community_icon ? data.community_icon.split("?")[0] : "")
    }));
    subredditCache.set(cacheKey, { suggestions, timestamp: now });
    return suggestions.length ? suggestions : TOP_SUBREDDITS;
  } catch (err) {
    return TOP_SUBREDDITS;
  }
}
